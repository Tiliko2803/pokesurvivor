'use strict';
const { test }=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const base=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(base,p),'utf8').replace(/\r\n/g,'\n');
const code=read('js/core/db.js');
const rules=read('firestore.rules');

function fixture(mode='cloud',fail=false) {
 const cache=new Map();
 const saved={v:3,name:'Entrenador',created:100,updated:200,coins:500,
    owned:{1:{at:100,from:'starter'}},gifts:{},shiny:{},partner:1,
    stats:{runs:0},tickets:{t1:0,t10:0},pupg:{},upgrades:{},ach:{},pity:{},challenges:{}};
 const remote=JSON.parse(JSON.stringify(saved));
 const doc={save:remote,v:3};
 let writes=0,txCalls=0;
 const store={
   collection(name){assert.equal(name,'saves');return {doc(id){assert.equal(id,'user1');return {id}}};},
   async runTransaction(cb){
     txCalls++;let candidate=null;
     await cb({
       get:async(ref)=>({exists:true,data:()=>JSON.parse(JSON.stringify(doc))}),
       set:(_ref,data)=>{candidate=data}
     });
     if(fail)throw Object.assign(new Error('permission-denied'),{code:'permission-denied'});
     if(candidate){writes++;Object.assign(doc,JSON.parse(JSON.stringify(candidate)))}
   }
 };
 const G={DEX_BY:{1:{name:'Bulbasaur'},10001:{name:'Maomao'}},
  Challenges:{mergeProgress(a,b){return {...a,...b}}},
  Game:{state:'ui'},Upgrades:{BY:{}},UI:{refreshCoins(){}}};
 const firebase={firestore:{FieldValue:{serverTimestamp:()=> 'SERVER_TS'}}};
 const ctx={G,Date,JSON,URLSearchParams,navigator:{onLine:true},setTimeout,clearTimeout,
   console,firebase,localStorage:{
     getItem:k=>cache.get(k)||null,
     setItem:(k,v)=>{cache.set(k,v);return true},
     removeItem:k=>cache.delete(k)
   }};
 vm.runInNewContext(read('js/data/gift-codes.js'),ctx);
 const anchor='  return {\n    ready, register,';
 assert.ok(code.includes(anchor));
 const injected=code.replace(anchor,
 `  function __testSetup(v){mode=v.mode;uid=v.mode==='cloud'?'user1':null;
    key='user1';user='Entrenador';guest=false;save=v.save;fs=v.firestore;}
  return {__testSetup,
    ready, register,`);
 vm.runInNewContext(injected,ctx);
 G.DB.__testSetup({mode,save:saved,firestore:store});
 return {G,saved,doc,cache,get writes(){return writes},get transactions(){return txCalls}};
}

test('El código 20KPS tiene cinco caracteres, ignora minúsculas y no reemplaza MAO25',()=>{
 const f=fixture('local');
 assert.equal(f.G.GiftCodes.normalize(' 20kps '),'20KPS');
 assert.equal(f.G.GiftCodes.validFormat('20KPS'),true);
 assert.equal(f.G.GiftCodes.isCoins('20KPS'),true);
 assert.equal(f.G.GiftCodes.isMaomao('MAO25'),true);
 assert.equal(f.G.GiftCodes.COINS_AMOUNT,20000);
});
test('Cuenta local: añade exactamente 20,000 una vez y persiste el sello',async()=>{
 const f=fixture('local');
 const a=await f.G.DB.redeemGift('20kps');
 assert.equal(a.ok,true);assert.equal(a.reward,'coins');assert.equal(a.amount,20000);
 assert.equal(f.saved.coins,20500);assert.equal(f.saved.gifts.coins20k,'20KPS');
 assert.ok(f.cache.has('ps.save.user1'));
 const b=await f.G.DB.redeemGift('20KPS');
 assert.equal(b.already,true);assert.equal(f.saved.coins,20500);
});
test('En Firebase se canjea atómicamente y no afecta a Pokémon, objetos o estadísticas',async()=>{
 const f=fixture('cloud');
 const r=await f.G.DB.redeemGift('20KPS');
 assert.equal(r.already,false);assert.equal(f.writes,1);
 assert.equal(f.doc.save.coins,20500);assert.equal(f.doc.save.gifts.coins20k,'20KPS');
 assert.equal(f.doc.save.gifts.maomao,undefined);
 assert.equal(f.doc.save.owned[10001],undefined);assert.equal(f.doc.save.partner,1);
 assert.equal(f.doc.save.stats.runs,0);
 const again=await f.G.DB.redeemGift('20KPS');
 assert.equal(again.already,true);assert.equal(f.writes,1);
});
test('Los dos regalos funcionan independientemente, sin bloquear el segundo',async()=>{
 const f=fixture('cloud');
 await f.G.DB.redeemGift('MAO25');
 assert.equal(f.doc.save.coins,500);
 await f.G.DB.redeemGift('20KPS');
 assert.equal(f.doc.save.coins,20500);
 assert.equal(f.doc.save.gifts.maomao,'MAO25');
 assert.equal(f.doc.save.gifts.coins20k,'20KPS');
 assert.ok(f.doc.save.owned[10001]);
 assert.equal(f.writes,2);
});
test('Reutilizable para dos cuentas diferentes, pero no dos veces en una',async()=>{
 const a=fixture(),b=fixture();
 await a.G.DB.redeemGift('20KPS');await b.G.DB.redeemGift('20KPS');
 assert.equal(a.doc.save.coins,20500);assert.equal(b.doc.save.coins,20500);
 assert.equal(a.writes,1);assert.equal(b.writes,1);
});
test('Firestore deniega canje: ninguna moneda o sello se añade en local',async()=>{
 const f=fixture('cloud',true);
 await assert.rejects(f.G.DB.redeemGift('20KPS'),/permission-denied/);
 assert.equal(f.writes,0);assert.equal(f.saved.coins,500);
 assert.equal(f.saved.gifts.coins20k,undefined);
});
test('Sin código correcto o durante partida no se pueden reclamar premios',async()=>{
 const f=fixture();
 await assert.rejects(f.G.DB.redeemGift('FAKE1'),/inválido/);
 f.G.Game.state='playing';
 await assert.rejects(f.G.DB.redeemGift('20KPS'),/Sal de la partida/);
 assert.equal(f.writes,0);
});
test('Fusionar partidas mantiene el premio sin sumar otras 20,000 monedas',async()=>{
 const f=fixture('local');await f.G.DB.redeemGift('20KPS');
 const awarded=JSON.parse(JSON.stringify(f.saved));
 const newerNoGift={...awarded,updated:awarded.updated+1000,coins:900,gifts:{}};
 const m=f.G.DB.merge(newerNoGift,awarded);
 assert.equal(m.gifts.coins20k,'20KPS');
 assert.equal(m.coins,20500);
 const twice=f.G.DB.merge(m,awarded);
 assert.equal(twice.coins,20500);
 assert.equal(twice.gifts.coins20k,'20KPS');
});
test('Reglas exigen exactamente 20K, un sello por cuenta y sin otros cambios',()=>{
 assert.match(rules,/function authorizedCoinsGift\(\)/);
 assert.match(rules,/authorizedGift\(\) \|\| authorizedCoinsGift\(\)/);
 assert.match(rules,/next\.get\('coins', 0\) == old\.get\('coins', 0\) \+ 20000/);
 assert.match(rules,/next\.get\('gifts', \{\}\)\.get\('coins20k', ''\) == '20KPS'/);
 assert.match(rules,/old\.get\('gifts', \{\}\)\.get\('coins20k', null\) == null/);
 assert.match(rules,/next\.diff\(old\)\.affectedKeys\(\)\.hasOnly\(\['coins', 'gifts', 'updated'\]\)/);
 assert.match(rules,/!\('coins20k' in request\.resource\.data\.save\.get\('gifts', \{\}\)\)/);
 assert.match(rules,/next\.get\('gifts', \{\}\)\.get\('coins20k', null\) == old\.get\('gifts', \{\}\)\.get\('coins20k', null\)/);
});
test('La pantalla sigue disponible después de conseguir a Mao Mao',()=>{
 const ui=read('js/ui/gifts-ui.js');
 assert.match(ui,/result\.reward === 'coins'/);
 assert.match(ui,/gift-code'\)\.disabled = false/);
 assert.match(ui,/gift-redeem'\)\.disabled = false/);
 assert.match(ui,/G\.UI\.refreshCoins\(\)/);
});
