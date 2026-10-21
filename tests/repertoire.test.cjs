'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const contexts = new WeakMap();
const prefix=process.env.REPERTOIRE_VARIANT==='dev'?'dev/':'';
function fixture(){
  const G={Challenges:{mergeProgress:(a,b)=>({...a,...b})}};
  const storage=new Map();
  const ctx=vm.createContext({G,console,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}});
  for(const file of ['js/data/pokedex.js','js/data/moves.js', 'js/systems/stats.js','js/data/starters.js','js/data/upgrades.js',prefix+'js/systems/mega.js',prefix+'js/systems/repertoire.js',prefix+'js/core/db.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
  contexts.set(G,ctx);
  return G;
}
test('Repertorio conserva una elección por Pokémon y permite volver al azar',()=>{
  const G=fixture(),s={pupg:{260:{moves:1},1:{moves:1}}};
  const a=G.DEX_BY[260],b=G.DEX_BY[1];
  const id=G.Repertoire.pool(a,s)[0],id2=G.Repertoire.pool(b,s)[1];
  assert.equal(G.Repertoire.choose(a,s,id),true);
  assert.equal(G.Repertoire.choose(b,s,id2),true);
  const loaded=JSON.parse(JSON.stringify(s));
  assert.equal(G.Repertoire.selected(a,loaded),id);
  assert.equal(G.Repertoire.selected(b,loaded),id2);
  assert.equal(G.Repertoire.choose(a,loaded,null),true);
  assert.equal(G.Repertoire.selected(a,loaded),null);
  assert.equal(G.Repertoire.selected(b,loaded),id2);
});
test('Sin comprar Repertorio no se puede escoger; excluye buffs, ataques ajenos y duplicados',()=>{
  const G=fixture(),mon=G.DEX_BY[260],s={pupg:{}};
  assert.equal(G.Repertoire.choose(mon,s,'tackle'),false);
  s.pupg[260]={moves:1};
  const pool=G.Repertoire.pool(mon,s);
  assert.ok(pool.length>2);
  assert.ok(pool.every(id=>G.Moves.BY_ID[id].kind!=='buff'));
  assert.ok(!pool.includes(G.startMoveOf(260)));
  assert.equal(G.Repertoire.choose(mon,s,'ember'),false);
  assert.equal(G.Repertoire.choose(mon,s,'unknown'),false);
  assert.equal(G.Repertoire.pool(mon,s,[...pool,G.startMoveOf(260)]).length,0);
});
test('Veto respeta los niveles comprados e invalida una elección que ya no está permitida',()=>{
  const G=fixture(),mon=G.DEX_BY[260],s={pupg:{260:{moves:1,ban:1}}};
  const [id,id2]=G.Repertoire.pool(mon,s);
  G.Repertoire.choose(mon,s,id);
  s.pban={260:[id,id2]};
  assert.equal(G.Repertoire.selected(mon,s),null);
  assert.equal(G.Repertoire.choose(mon,s,id),false);
  assert.ok(G.Repertoire.pool(mon,s).includes(id2));
});
test('Mega Swampert excluye Terratemblor inicial y valida al cambiar de forma',()=>{
  const G=fixture(),s={owned:{260:{at:1}},pupg:{260:{moves:1}},megaStones:{swampertite:1},megaEquipped:{260:'swampertite'}};
  const mon=G.Mega.form(G.DEX_BY[260],s);
  assert.equal(G.Repertoire.initialMove(mon),'bulldoze');
  assert.ok(!G.Repertoire.pool(mon,s).includes('bulldoze'));
  assert.equal(G.Repertoire.choose(mon,s,'bulldoze'),false);
});
test('La fusión de guardados conserva preferencias y respeta el retorno explícito a Aleatorio',()=>{
  const G=fixture();
  const save=(updated,prepertoire)=>({updated,prepertoire,upgrades:{},stats:{},pity:{},coins:0,tickets:{t1:0,t10:0}});
  const old=save(1,{260:'tackle',1:'razor-leaf'}),newer=save(2,{260:null});
  const merged=G.DB.merge(old,newer);
  assert.equal(merged.prepertoire[260],null);
  assert.equal(merged.prepertoire[1],'razor-leaf');
  assert.deepEqual(JSON.parse(JSON.stringify(G.DB.merge(newer,old).prepertoire)),JSON.parse(JSON.stringify(merged.prepertoire)));
});

test('La elección sobrevive a guardar, cerrar y volver a entrar con la base de datos real',async()=>{
  const G=fixture(),ctx=contexts.get(G),storage=new Map();
  Object.assign(ctx,{window:{},Uint8Array,TextEncoder,setTimeout:()=>{},clearTimeout:()=>{},
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}});
  G.UI={refreshCoins(){}};
  assert.equal((await G.DB.register('RepertorioTest','123456')).ok,true);
  G.DB.grant(260,'starter');G.DB.save.partner=260;G.DB.save.pupg[260]={moves:1};
  const mon=G.DEX_BY[260],id=G.Repertoire.pool(mon,G.DB.save)[0];
  G.Repertoire.choose(mon,G.DB.save,id);G.DB.commit(true);
  await G.DB.logout();
  assert.equal((await G.DB.login('RepertorioTest','123456')).ok,true);
  assert.equal(G.Repertoire.selected(mon,G.DB.save),id);
});

for(const mode of ['solo','coop','challenge','no-upgrade','veto','random']){
  test(`Inicio real de partida: ${mode}`,()=>{
    const G=fixture(),ctx=contexts.get(G),noop=()=>{};
    Object.assign(ctx,{performance:{now:()=>0},navigator:{onLine:true}});
    G.UI={hideAll:noop,chrome:noop};G.RunUI={};
    for(const [name,method] of Object.entries({FX:'clear',Projectiles:'clear',Combat:'clearFields',EnemyMgr:'clear',Pickups:'clear',Spawner:'reset',Rift:'reset',Judgment:'reset',Events:'reset',Weather:'reset',Path:'clear',Hazards:'clear'}))G[name]={[method]:noop};
    G.FX.ring=noop;G.Projectiles.clearOrbs=noop;G.Audio={sfx:noop,music:noop};
    G.World={reset:noop,setBiome:noop};G.Camera={};G.BIOME_MUSIC=[];
    G.Sprites={Animator:class{},hasShiny:()=>false,playerScale: () => 1, playerRadius(dex) { return Math.min(18, this.bodyRadius(dex)); }, bodyRadius:()=>16,bodyHeight:()=>30,preload:noop};G.MegaArt={Animator:class{}};
    G.U={TYPE_COLOR:{},pick:a=>a[a.length-1]};G.Social={setPlaying:noop,room:null};
    let coopPlayer=null;
    G.Coop={active:false,begin:(_cfg,p)=>{coopPlayer=p;},isHost:true};
    G.Challenges={active:null,begin:id=>{G.Challenges.active=id;},bindPlayer:noop};G.Ranking={runStarted:noop};
    const save={partner:260,pupg:{260:mode==='no-upgrade'?{}:{moves:1,ban:1}},owned:{260:{at:1}},megaStones:{swampertite:1},megaEquipped:{260:'swampertite'}};
    G.DB={save,upgradesOf:d=>save.pupg[d],ownsShiny:()=>false};
    const mon=G.Mega.form(G.DEX_BY[260],save),id=G.Repertoire.pool(mon,save)[0];
    save.prepertoire={260:id};
    if(mode==='veto')save.pban={260:[id]};
    if(mode==='random')save.prepertoire[260]=null;
    for(const file of [prefix+'js/entities/player.js',prefix+'js/game.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
    G.Game.startRun(mode==='coop'?{seed:123,host:'x',members:[]}:null,mode==='challenge'?'test-challenge':null);
    const p=G.Game.player;
    assert.equal(G.Game.state,'playing');
    assert.equal(p.moves[0].id,'bulldoze');assert.equal(p.moves[0].lvl,2);
    assert.equal(p.moves.length,mode==='no-upgrade'?1:2);
    if(['solo','coop','challenge'].includes(mode))assert.equal(p.moves[1].id,id);
    if(mode==='veto')assert.ok(!p.hasMove(id));
    if(mode==='coop')assert.equal(coopPlayer,p);
  });
}

test('Fusionar la elección conserva el saldo de monedas y tickets de ambos dispositivos',()=>{
  const G=fixture();
  const a={updated:1,prepertoire:{260:'tackle'},coins:90,tickets:{t1:9,t10:0},
    led:{base:{c:[100,0],t1:[10,0]},phone:{c:[0,10],t1:[0,1]}},upgrades:{},stats:{},pity:{}};
  const b={updated:2,prepertoire:{260:null},coins:120,tickets:{t1:12,t10:0},
    led:{base:{c:[100,0],t1:[10,0]},pc:{c:[20,0],t1:[2,0]}},upgrades:{},stats:{},pity:{}};
  const plainA=JSON.parse(JSON.stringify(a)),plainB=JSON.parse(JSON.stringify(b));
  delete plainA.prepertoire;delete plainB.prepertoire;
  const baseline=G.DB.merge(plainA,plainB),merged=G.DB.merge(a,b);
  assert.equal(merged.coins,baseline.coins);
  assert.deepEqual(merged.tickets,baseline.tickets);
  assert.equal(merged.prepertoire[260],null);
  if(!prefix){assert.equal(merged.coins,110);assert.equal(merged.tickets.t1,11);}
});
