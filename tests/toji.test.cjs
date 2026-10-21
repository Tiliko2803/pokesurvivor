'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),noop=()=>{};
const source=f=>fs.readFileSync(path.join(root,f),'utf8');
function fixture(){
  const storage=new Map(),G={};
  const ctx=vm.createContext({G,console,URLSearchParams,Uint8Array,TextEncoder,
    location:{search:'',protocol:'file:'},navigator:{onLine:true},performance:{now:()=>ctx.now||0},
    document:{addEventListener:noop},setTimeout:noop,clearTimeout:noop,
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}});
  ctx.window=ctx;
  ctx.Image=class{
    set src(value){this._src=value;if(!value)return;const png=fs.readFileSync(path.join(root,value.split('?')[0]));this.width=png.readUInt32BE(16);this.height=png.readUInt32BE(20);if(this.onload)this.onload();}
    get src(){return this._src;}
  };
  const load=(f,code=source(f))=>vm.runInContext(code,ctx,{filename:f});
  for(const f of ['js/core/util.js','js/data/pokedex.js','js/data/sprites-meta.js','js/data/maomao-preview.js',
    'js/data/toji.js','js/data/gift-codes.js','js/data/moves.js', 'js/systems/stats.js','js/data/starters.js','js/data/upgrades.js',
    'js/systems/mega.js','js/systems/challenges.js','js/systems/repertoire.js','js/core/db.js','js/core/sprites.js','js/entities/player.js'])load(f);
  G.UI={refreshCoins:noop,hideAll:noop,chrome:noop,toast:noop};
  G.Game={state:'ui'};
  return {G,ctx,storage,load};
}
test('Toji es independiente y apto para ranking; conserva el combate base de Cobalion',()=>{
  const {G}=fixture(),toji=G.Toji.mon,cobalion=G.DEX_BY[638];
  assert.equal(toji.dex,10002);assert.equal(toji.gen,0);assert.equal(toji.customPreview,undefined);
  for(const key of ['hp','atk','spd','rarity','bst'])assert.equal(toji[key],cobalion[key]);
  assert.deepEqual([...toji.types],[...cobalion.types]);assert.equal(cobalion.name,'Cobalion');
  assert.equal(G.DEX.includes(toji),false,'No entra en gacha, salvajes ni grietas');
  assert.equal(G.startMoveOf(10002),G.startMoveOf(638));
  assert.deepEqual([...G.Moves.poolFor(toji)],[...G.Moves.poolFor(cobalion)]);
  const a=new G.Player(toji),b=new G.Player(cobalion);
  for(const key of ['maxHp','baseAtk','baseSpd','r'])assert.equal(a[key],b[key]);
  assert.equal(a.anim.dex,10002);assert.equal(b.anim.dex,638);
});
test('Las siete animaciones cargan y dibujan todos sus fotogramas en ocho direcciones',()=>{
  const {G}=fixture();
  for(const [name,m] of Object.entries(G.SPRITE_META[10002].a)){
    const sheet=G.Sprites.sheet(10002,name);assert.equal(sheet.ready,true);
    assert.equal(sheet.img.width,m.w*m.n);assert.equal(sheet.img.height,m.h*8);
    const anim=new G.Sprites.Animator(10002),calls=[];
    const ctx={globalAlpha:1,drawImage:(...args)=>calls.push(args)};
    anim.play(name,{hold:true});
    for(let f=0;f<m.n;f++){
      anim.frame=f;
      for(let dir=0;dir<8;dir++){anim.dir=dir;anim.draw(ctx,100,100);const call=calls.at(-1);assert.equal(call[1],f*m.w);assert.equal(call[2],dir*m.h);assert.ok(Math.abs(call[7]-m.w*1.56)<1e-6);assert.ok(Math.abs(call[8]-m.h*1.56)<1e-6);}
    }
    if(name==='Faint'){anim.update(10);assert.equal(anim.done,true);assert.equal(anim.frame,m.n-1);}
  }
});
test('El cooperativo real crea a Toji remoto con sus sprites y movimiento inicial',()=>{
  const {G,load}=fixture();G.Net={uid:'local',on:noop,onPeer:noop};G.Flow={};
  load('js/net/coop.js');
  const local=new G.Player(G.DEX_BY[638]);
  G.Coop.begin({host:'local',members:[{uid:'local',dex:638},{uid:'remote',dex:10002,name:'Toji'}]},local,{});
  const toji=G.Coop.mate('remote').pl;
  assert.equal(toji.remote,true);assert.equal(toji.dex,10002);assert.equal(toji.anim.dex,10002);
  assert.equal(toji.net.mv,'metal-claw');assert.equal(G.Sprites.sheet(10002,'Walk').ready,true);
  assert.equal(local.anim.dex,638);G.Coop.end();
});
test('TOJI1 se entrega una vez y persiste con selección y mejoras propias',async()=>{
  const {G}=fixture();await G.DB.register('TojiTest','123456');
  const first=await G.DB.redeemGift(' toji1 ');assert.equal(first.reward,'toji');assert.equal(first.already,false);
  assert.equal(G.DB.save.owned[10002].from,'gift');assert.equal(G.DB.save.gifts.toji,'TOJI1');
  assert.equal((await G.DB.redeemGift('TOJI1')).already,true);
  G.DB.save.partner=10002;G.DB.save.pupg[10002]={hp:2};G.DB.commit(true);
  await G.DB.logout();await G.DB.login('TojiTest','123456');
  assert.equal(G.DB.save.partner,10002);assert.equal(G.DB.save.pupg[10002].hp,2);
  assert.equal(G.DB.save.pupg[638],undefined);assert.equal(G.DB.save.gifts.toji,'TOJI1');
  const result=await G.DB.redeemGift('MAO25');assert.equal(result.reward,'maomao');
  assert.ok(G.DB.save.owned[10001]);assert.ok(G.DB.save.owned[10002]);
});
test('Fusionar con otro dispositivo conserva a Toji y el sello sin duplicar premios',async()=>{
  const {G}=fixture();await G.DB.register('TojiMerge','123456');await G.DB.redeemGift('TOJI1');
  const awarded=JSON.parse(JSON.stringify(G.DB.save)),older=JSON.parse(JSON.stringify(awarded));
  older.updated=awarded.updated+1000;delete older.owned[10002];older.gifts={};
  const merged=G.DB.merge(older,awarded);assert.ok(merged.owned[10002]);assert.equal(merged.gifts.toji,'TOJI1');
  assert.equal(merged.coins,awarded.coins);assert.deepEqual(JSON.parse(JSON.stringify(G.DB.merge(merged,awarded))),JSON.parse(JSON.stringify(merged)));
});
for(const denied of [false,true])test(`Regalo cloud: transacción ${denied?'rechazada no modifica nada':'confirmada concede sólo Toji'}`,async()=>{
  const f=fixture(),{G,load}=f;await G.DB.register('TojiCloud','123456');
  const save=JSON.parse(JSON.stringify(G.DB.save)),remote={save:JSON.parse(JSON.stringify(save)),v:3};let writes=0;
  const store={collection:()=>({doc:()=>({})}),runTransaction:async cb=>{let candidate;await cb({get:async()=>({exists:true,data:()=>remote}),set:(_r,data)=>candidate=data});if(denied)throw new Error('permission-denied');if(candidate){writes++;Object.assign(remote,candidate);}}};
  f.ctx.firebase={firestore:{FieldValue:{serverTimestamp:()=> 'SERVER_TS'}}};
  load('js/core/db.js',source('js/core/db.js').replace('  return {\n    ready, register,','  return { __setup(s,store) { mode="cloud"; uid="test"; key="test"; user="TojiCloud"; guest=false; save=s; fs=store; },\n    ready, register,'));
  G.DB.__setup(save,store);
  if(denied){await assert.rejects(G.DB.redeemGift('TOJI1'),/permission-denied/);assert.equal(save.owned[10002],undefined);assert.equal(writes,0);}
  else{const result=await G.DB.redeemGift('TOJI1');assert.equal(result.local,false);assert.equal(writes,1);assert.equal(remote.save.gifts.toji,'TOJI1');assert.ok(G.DB.save.owned[10002]);assert.equal(remote.save.coins,save.coins);assert.equal(remote.save.partner,save.partner);assert.equal((await G.DB.redeemGift('TOJI1')).already,true);assert.equal(writes,1);}
});
for(const group of [false,true])test(`Partida real de Toji guarda y envía su tiempo al ranking ${group?'cooperativo':'solo'}`,async()=>{
  const {G,ctx,load}=fixture();await G.DB.register('TojiRank','123456');await G.DB.redeemGift('TOJI1');G.DB.save.partner=10002;
  for(const [name,method] of Object.entries({FX:'clear',Projectiles:'clear',Combat:'clearFields',EnemyMgr:'clear',Pickups:'clear',Spawner:'reset',Rift:'reset',Judgment:'reset',Events:'reset',Weather:'reset',Path:'clear',Hazards:'clear'}))G[name]={[method]:noop};
  G.FX.ring=noop;G.Projectiles.clearOrbs=noop;G.Audio={sfx:noop,music:noop};G.World={reset:noop,setBiome:noop};G.Camera={};G.BIOME_MUSIC=[];
  G.Progress={event:noop,checkAch:noop};G.Judgment.summary=()=>null;G.Social={room:null,me:null,setPlaying:noop};
  const members=[{uid:'host',dex:10002,name:'TojiRank'},{uid:'guest',dex:638,name:'Cobalion'}];
  G.Coop={active:false,isHost:true,members,begin:(_c,p)=>{G.Coop.active=true;p.uid='host';p.coopHost=true;},end:()=>{G.Coop.active=false;},leave:()=>{G.Coop.active=false;}};
  let starts=0,submission;G.Ranking={runStarted:()=>starts++,submitSolo:r=>submission=r,submitGroup:r=>submission=r};
  G.RunUI={showOver:noop};
  load('js/game.js',source('js/game.js').replace('return {\n    init, startRun,','return {\n    _elapsed(t) { time=t; }, init, startRun,'));
  G.Game.startRun(group?{seed:1,host:'host',members}:null);assert.equal(starts,1);
  assert.equal(G.Game.player.dex,10002);assert.equal(G.Game.player.moves[0].id,'metal-claw');
  // Advance only the clock under test; real wall time matches it. No debugTime or clean() bypass.
  ctx.now=65000;G.Game._elapsed(65);G.Game.quit();
  assert.equal(submission.t,65);assert.equal(G.DB.save.stats.bestTime,65);
  if(group)assert.ok(submission.members.some(m=>m.dex===10002));else assert.equal(submission.dex,10002);
});
