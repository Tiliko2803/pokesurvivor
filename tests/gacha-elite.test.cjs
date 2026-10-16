'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const basicDex=()=>[1,2,3,4,5].flatMap(rarity=>[0,1].map(i=>({dex:rarity*10+i,rarity,gen:1})));
const save=()=>({owned:{},coins:100,stats:{},tickets:{t1:20,t10:2}});
function fixture(dex=basicDex(),shiny=false){
 let roll=0.1,pick=0;
 const G={DEX:dex,SPRITE_META:Object.fromEntries(dex.map(p=>[p.dex,{}])),U:{pick:a=>a[Math.floor(pick*a.length)]},Sprites:{hasShiny:()=>shiny}};
 const ctx=vm.createContext({G,Math:Object.assign(Object.create(Math),{random:()=>roll})});
 vm.runInContext(read('js/systems/gacha.js'),ctx);
 return {G,random:(r,p=0)=>{roll=r;pick=p;}};
}
test('Élite consume exactamente un ticket ×10 y entrega cinco Raros o superiores',()=>{
 const {G,random}=fixture();
 for(const [roll,rarity] of [[0,3],[0.68999,3],[0.69001,4],[0.95499,4],[0.95501,5],[0.99999,5]]){
  random(roll);const s=save(),out=G.Gacha.pull(s,5,1,'elite');
  assert.equal(out.length,5);assert.ok(out.every(r=>r.rarity===rarity));
  assert.deepEqual(s.tickets,{t1:20,t10:1});assert.equal(s.stats.pulls,5);
 }
});
test('Costos, combinaciones inválidas y banners vacíos no gastan ni modifican el guardado',()=>{
 const {G}=fixture();
 for(const [n,gen,use] of [[10,1,'elite'],[1,1,'elite'],[5,1,'t1'],[-1,1,'t1'],[0,1,'t1'],[1.5,1,'t1'],[1,1,'t10'],[10,1,'otro'],[5,10,'elite'],[5,2,'elite']]){
  const s=save(),before=JSON.stringify(s);assert.equal(G.Gacha.pull(s,n,gen,use),null);assert.equal(JSON.stringify(s),before);
 }
 const s=save();s.tickets.t10=0;const before=JSON.stringify(s);
 assert.equal(G.Gacha.pull(s,5,1,'elite'),null);assert.equal(JSON.stringify(s),before);
 assert.equal(G.Gacha.costOf({},5,'elite'),null);
});
test('Pity cuenta cinco tiradas reales, se comparte con normales y se reinicia al salir Legendaria',()=>{
 const {G,random}=fixture();random(0.1);const s=save();s.pity={1:68,2:25};
 const out=G.Gacha.pull(s,5,1,'elite');
 assert.equal(out[0].rarity,3);assert.equal(out[1].rarity,5);assert.equal(s.pity[1],3);assert.equal(s.pity[2],25);
 s.pity[1]=69;assert.equal(G.Gacha.pull(s,1)[0].rarity,5);assert.equal(s.pity[1],0);
 s.pity[1]=64;G.Gacha.pull(s,5,1,'elite');assert.equal(s.pity[1],69);
 assert.equal(G.Gacha.pull(s,1)[0].rarity,5);assert.equal(s.stats.pulls,12);
});
test('Tasas exactas: normales intactas y Legendaria Élite al triple, antes de las garantías',()=>{
 const {G,random}=fixture(),counts={},elite={};
 for(let i=0;i<10000;i++){
  random((i+0.5)/10000);
  const r=G.Gacha.pull(save(),1)[0].rarity;counts[r]=(counts[r]||0)+1;
  const e=G.Gacha.pull(save(),5,1,'elite')[0].rarity;elite[e]=(elite[e]||0)+1;
 }
 assert.deepEqual(counts,{1:4500,2:3000,3:1700,4:650,5:150});
 assert.deepEqual(elite,{3:6900,4:2650,5:450});
});
test('Especies nuevas tienen triple peso; completar la rareza restaura selección uniforme',()=>{
 const {G,random}=fixture();let missing=0,owned=0;
 for(let i=0;i<100;i++){
  random(0.1,(i+0.5)/100);const s=save();s.owned[10]={at:1};
  const r=G.Gacha.pull(s,1)[0];if(r.dex===11)missing++;else owned++;
 }
 assert.equal(missing,75);assert.equal(owned,25);
 const counts={};
 for(let i=0;i<100;i++){
  random(0.1,(i+0.5)/100);const s=save();s.owned={10:{at:1},11:{at:1}};
  const r=G.Gacha.pull(s,1)[0];counts[r.dex]=(counts[r.dex]||0)+1;
  assert.equal(r.isNew,false);assert.equal(r.refund,15);assert.equal(s.coins,115);
 }
 assert.deepEqual(counts,{10:50,11:50});
});
test('Las dos normales ×10 evitan especies repetidas sin alterar la garantía Épica',()=>{
 const dex=Array.from({length:12},(_,i)=>({dex:i+1,rarity:1,gen:1})).concat([{dex:40,rarity:4,gen:1},{dex:50,rarity:5,gen:1}]);
 const {G}=fixture(dex);
 for(const use of ['t1','t10']){
  const s=save(),out=G.Gacha.pull(s,10,1,use);
  assert.equal(new Set(out.map(r=>r.dex)).size,10);assert.equal(out[9].rarity,4);
  assert.deepEqual(s.tickets,use==='t1'?{t1:10,t10:2}:{t1:20,t10:1});
 }
});
test('Pools pequeños permiten repetidos y reembolsan sin bloquear la tanda',()=>{
 const {G}=fixture([{dex:1,rarity:1,gen:1},{dex:4,rarity:4,gen:1}]);
 const s=save(),out=G.Gacha.pull(s,10);assert.equal(out.length,10);
 assert.equal(out.filter(r=>!r.isNew).length,8);assert.equal(s.coins,220);
});
test('Élite nunca baja de Rara al faltar un pool y no gasta si sólo hay Comunes',()=>{
 const {G}=fixture([{dex:4,rarity:4,gen:1}]);
 assert.ok(G.Gacha.pull(save(),5,1,'elite').every(r=>r.rarity===4));
 const other=fixture([{dex:1,rarity:1,gen:1}]).G,s=save(),before=JSON.stringify(s);
 assert.equal(other.Gacha.pull(s,5,1,'elite'),null);assert.equal(JSON.stringify(s),before);
});
test('Conserva shiny nuevos, redirección de shiny repetidos y reembolso normal si no faltan',()=>{
 const {G,random}=fixture(undefined,true);random(0.5);const s=save();s.shiny={30:{at:1}};
 G.Gacha.debugForceShiny(1);const first=G.Gacha.pull(s,5,1,'elite')[0];
 assert.equal(first.dex,31);assert.equal(first.shiny,true);assert.equal(first.isNew,true);assert.ok(s.owned[31]);
 G.Gacha.debugForceShiny(5);const out=G.Gacha.pull(s,5,1,'elite');
 assert.ok(out.every(r=>!r.shiny));assert.ok(out.every(r=>r.refund===60));
});
test('Todos los banners reales tienen legendarios y respetan la garantía mínima Élite',()=>{
 const ctx=vm.createContext({G:{}});for(const f of ['js/data/pokedex.js','js/data/sprites-meta.js'])vm.runInContext(read(f),ctx);
 const {G,random}=fixture(ctx.G.DEX);G.SPRITE_META=ctx.G.SPRITE_META;
 for(const {gen} of G.Gacha.BANNERS){
  assert.ok(G.Gacha.pool(5,gen).length>0,`Gen ${gen} sin legendarios`);
  for(const roll of [0.1,0.8,0.99]){
   random(roll);const out=G.Gacha.pull(save(),5,gen,'elite');
   assert.ok(out.every(r=>r.rarity>=3&&G.DEX.find(p=>p.dex===r.dex).gen===gen));
  }
 }
});
