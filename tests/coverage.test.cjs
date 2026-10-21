'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),plain=x=>JSON.parse(JSON.stringify(x)),noop=()=>{};
function fixture() {
  const G={Challenges:{mergeProgress:(a,b)=>({...a,...b})}},storage=new Map();
  const ctx=vm.createContext({G,window:{G},console,performance:{now:()=>0},setTimeout:noop,clearTimeout:noop,
    TextEncoder,Uint8Array,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}});
  const load=file=>vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
  for(const f of ['js/core/util.js','js/data/pokedex.js','js/data/moves.js', 'js/systems/stats.js','js/data/starters.js','js/data/upgrades.js',
    'js/data/coverage-data.js','js/systems/coverage.js','js/systems/mega.js','js/systems/repertoire.js','js/core/db.js','js/systems/levelup.js','js/entities/player.js'])load(f);
  G.DEX_BY[10001]={dex:10001,types:['poison','grass']};G.DEX_BY[10002]={dex:10002,types:['steel','fighting']};
  return {G,ctx,load};
}
const save=(dex=260,tier=3)=>({pupg:{[dex]:{coverage:tier,moves:1,ban:1}},pcoverage:{},pban:{},prepertoire:{}});
test('Pinned learnsets cover every catalog species; base and Normal moves never become coverage',()=>{
  const {G}=fixture();assert.equal(G.CoverageData.commit,'6fd69dfe90465ba96534f6816fc817737d1f97f6');
  let supported=0;
  for(const mon of G.DEX) {
    assert.ok(Object.hasOwn(G.CoverageData.learnsets,mon.dex));
    const extra=G.Coverage.eligible(mon),base=new Set(G.Moves.poolFor(mon));
    for(const id of extra){assert.ok(G.Moves.BY_ID[id]);assert.ok(!base.has(id));}
    assert.equal(extra.length,new Set(extra).size);if(extra.length)supported++;
  }
  assert.equal(supported,919);
});
test('Compatibility is species-specific, including Swampert, Blaziken and Venusaur',()=>{
  const {G}=fixture();
  assert.ok(G.Coverage.eligible(G.DEX_BY[260]).includes('ice-beam'));
  assert.ok(G.Coverage.eligible(G.DEX_BY[257]).includes('rock-slide'));
  assert.ok(!G.Coverage.eligible(G.DEX_BY[3]).includes('sludge'));
  assert.ok(!G.Coverage.eligible(G.DEX_BY[25]).includes('ice-beam'));
  assert.deepEqual(plain(G.Coverage.eligible(G.DEX_BY[129])),[]);
  assert.deepEqual(plain(G.Coverage.eligible(G.DEX_BY[202])),[]);
  assert.equal(G.Coverage.eligible({...G.DEX_BY[260],megaStone:'swampertite'}).join(),G.Coverage.eligible(G.DEX_BY[260]).join());
  assert.ok(!G.Coverage.eligible({...G.DEX_BY[260],types:['water','ice']}).includes('ice-beam'));
});
test('Custom IDs use explicit design lists, never PokéAPI alternate-form learnsets',()=>{
  const {G}=fixture();
  assert.equal(G.CoverageData.learnsets[10001],undefined);
  assert.deepEqual(plain(G.Coverage.eligible(G.DEX_BY[10001])),['thunderbolt','rock-slide','confusion']);
  assert.deepEqual(plain(G.Coverage.eligible(G.DEX_BY[10002])),['aerial-ace','psycho-cut','rock-slide','bite']);
});
test('Three tiers charge the agreed prices and enforce purchased slots without duplicates or foreign moves',()=>{
  const {G}=fixture(),mon=G.DEX_BY[260],s=save(260,0);
  assert.deepEqual([0,1,2].map(i=>G.Upgrades.cost('coverage',i)),[1500,4000,10000]);
  assert.equal(G.Coverage.choose(mon,s,['ice-beam']),false);
  for(let tier=1;tier<=3;tier++) {
    s.pupg[260].coverage=tier;assert.equal(G.Coverage.slots(mon,s),tier);
    const chosen=['ice-beam','rock-slide','toxic'].slice(0,tier);
    assert.equal(G.Coverage.choose(mon,s,chosen),true);assert.deepEqual(plain(G.Coverage.selected(mon,s)),chosen);
  }
  for(const invalid of [['ice-beam','ice-beam'],['ember'],['water-gun'],['unknown'],['ice-beam','rock-slide','toxic','hail']])
    assert.equal(G.Coverage.choose(mon,s,invalid),false);
  assert.equal(G.Coverage.choose(mon,s,[]),true);assert.deepEqual(plain(G.Coverage.selected(mon,s)),[]);
  assert.equal(G.Coverage.slots(G.DEX_BY[25],save(25,3)),1);
});
test('Repertoire uses selected coverage and respects Veto; unselected compatible moves stay out',()=>{
  const {G}=fixture(),mon=G.DEX_BY[260],s=save();
  assert.ok(!G.Repertoire.pool(mon,s).includes('ice-beam'));
  G.Coverage.choose(mon,s,['ice-beam']);assert.ok(G.Repertoire.pool(mon,s).includes('ice-beam'));
  assert.equal(G.Repertoire.choose(mon,s,'ice-beam'),true);assert.equal(G.Repertoire.selected(mon,s),'ice-beam');
  s.pban[260]=['ice-beam'];assert.equal(G.Repertoire.selected(mon,s),null);
  s.pban[260]=[];G.Coverage.choose(mon,s,[]);assert.equal(G.Repertoire.selected(mon,s),null);
  assert.ok(!G.Coverage.pool(mon,s).includes('ice-beam'));
});
test('Selected coverage is offered as a real card, then upgrades, evolves and bonds within four slots',()=>{
  const {G}=fixture(),mon=G.DEX_BY[260];
  G.Sprites={Animator:class{},playerScale: () => 1, playerRadius(dex) { return Math.min(18, this.bodyRadius(dex)); }, bodyRadius:()=>10,bodyHeight:()=>30};G.Projectiles={clearOrbs:noop};G.Audio={sfx:noop};
  G.FX={ring:noop,burst:noop};G.Progress={event:noop};
  const p=new G.Player(mon);p.coverage=['ice-beam'];p.addMove('water-gun');
  let card;
  for(let i=0;i<200&&!card;i++)card=G.LevelUp.offer(p,100).find(c=>c.key==='new:ice-beam');
  assert.ok(card);card.apply(p);const m=p.moves.find(m=>m.id==='ice-beam');
  assert.ok(m);for(let i=1;i<5;i++)G.Moves.levelUp(m);assert.equal(m.lvl,5);
  const needs=G.Moves.evoInfo(m,{});p.statsTaken[needs.needs]=1;
  const evolution=G.LevelUp.offer(p).find(c=>c.key==='evo:ice-beam');assert.ok(evolution);evolution.apply(p);assert.ok(m.evolved);
  p.bonds=1;p.fuse([p.moves[0],m]);assert.equal(p.slots.length,1);assert.equal(p.slots[0].length,2);assert.equal(p.maxMoves,4);
  p.banned.add('rock-slide');p.coverage=['rock-slide'];
  for(let i=0;i<20;i++)assert.ok(G.LevelUp.offer(p,100).every(c=>c.key!=='new:rock-slide'));
});
test('Per-Pokémon edits and explicit clears merge without resurrection or unrelated resource changes',()=>{
  const {G}=fixture(),mon=G.DEX_BY[260],s=save();G.Coverage.choose(mon,s,['ice-beam']);
  const first=plain(s.pcoverage),at=first[260].at;G.Coverage.choose(mon,s,[]);
  assert.ok(s.pcoverage[260].at>at);
  const merged=G.Coverage.mergeChoices(first,s.pcoverage);assert.deepEqual(plain(merged[260].moves),[]);
  assert.deepEqual(plain(G.Coverage.mergeChoices(s.pcoverage,first)),plain(merged));
  assert.deepEqual(plain(G.Coverage.mergeChoices(merged,merged)),plain(merged));
  const later={257:{moves:['rock-slide'],at:at+100}};
  assert.deepEqual(plain(G.Coverage.mergeChoices(merged,later)[260].moves),[]);
  const a={updated:100,coins:500,tickets:{t1:2,t10:1},pcoverage:first};
  const b={updated:2,coins:500,tickets:{t1:2,t10:1},pcoverage:s.pcoverage};
  assert.deepEqual(plain(G.DB.merge(a,b).pcoverage[260].moves),[]);
  assert.equal(G.DB.merge(a,b).coins,500);assert.deepEqual(plain(G.DB.merge(a,b).tickets),{t1:2,t10:1});
});
test('Sanitization removes malformed data while active choices are capped by bought levels',()=>{
  const {G}=fixture(),s=save(260,1);
  s.pcoverage={260:{moves:['ice-beam','ice-beam','ember','rock-slide','toxic','hail'],at:-1},99999:{moves:['ice-beam'],at:2},257:'bad'};
  G.Coverage.sanitize(s);assert.deepEqual(plain(s.pcoverage),{260:{moves:['ice-beam','rock-slide','toxic'],at:0}});
  assert.deepEqual(plain(G.Coverage.selected(G.DEX_BY[260],s)),['ice-beam']);
});
test('A real local save survives logout/login with coverage, paid tiers and Repertoire intact',async()=>{
  const {G}=fixture();G.UI={refreshCoins:noop};
  assert.equal((await G.DB.register('CoverageTest','123456')).ok,true);G.DB.grant(260,'starter');
  G.DB.save.partner=260;G.DB.save.pupg[260]={coverage:2,moves:1};
  G.Coverage.choose(G.DEX_BY[260],G.DB.save,['ice-beam','rock-slide']);
  G.Repertoire.choose(G.DEX_BY[260],G.DB.save,'ice-beam');G.DB.commit(true);await G.DB.logout();
  assert.equal((await G.DB.login('CoverageTest','123456')).ok,true);
  assert.deepEqual(plain(G.Coverage.selected(G.DEX_BY[260],G.DB.save)),['ice-beam','rock-slide']);
  assert.equal(G.Repertoire.selected(G.DEX_BY[260],G.DB.save),'ice-beam');
  assert.deepEqual(plain(G.Coverage.selected(G.DEX_BY[257],G.DB.save)),[]);
});
for(const mode of ['solo','coop','challenge','veto','no-upgrade'])test(`Real run snapshots coverage and Repertoire: ${mode}`,()=>{
 const {G,ctx,load}=fixture();Object.assign(ctx,{navigator:{onLine:true}});
 G.UI={hideAll:noop,chrome:noop};G.RunUI={};
 for(const [name,method]of Object.entries({FX:'clear',Projectiles:'clear',Combat:'clearFields',EnemyMgr:'clear',Pickups:'clear',Spawner:'reset',Rift:'reset',Judgment:'reset',Events:'reset',Weather:'reset',Path:'clear',Hazards:'clear'}))G[name]={[method]:noop};
 G.FX.ring=noop;G.Projectiles.clearOrbs=noop;G.Audio={sfx:noop,music:noop};
 G.World={reset:noop,setBiome:noop};G.Camera={};G.BIOME_MUSIC=[];
 G.Sprites={Animator:class{},hasShiny:()=>false,playerScale: () => 1, playerRadius(dex) { return Math.min(18, this.bodyRadius(dex)); }, bodyRadius:()=>16,bodyHeight:()=>30,preload:noop};G.MegaArt={Animator:class{}};
 G.U.TYPE_COLOR={};G.Social={setPlaying:noop,room:null};
 G.Coop={active:false,begin:noop,isHost:true};
 G.Challenges={active:null,begin:id=>{G.Challenges.active=id;},bindPlayer:noop};G.Ranking={runStarted:noop};
 const s=save();s.partner=260;s.owned={260:{at:1}};s.megaStones={swampertite:1};s.megaEquipped={260:'swampertite'};
 G.Coverage.choose(G.DEX_BY[260],s,['ice-beam']);s.prepertoire[260]='ice-beam';
 if(mode==='veto')s.pban[260]=['ice-beam'];
 if(mode==='no-upgrade')s.pupg[260].coverage=0;
 G.DB={save:s,upgradesOf:d=>s.pupg[d],ownsShiny:()=>false};load('js/game.js');
 G.Game.startRun(mode==='coop'?{seed:123,host:'x',members:[]}:null,mode==='challenge'?'test-challenge':null);
 const p=G.Game.player;assert.equal(G.Game.state,'playing');assert.equal(p.moves[0].id,'bulldoze');assert.equal(p.moves[0].lvl,2);
 assert.equal(p.maxMoves,4);assert.deepEqual(plain(p.coverage),mode==='no-upgrade'?[]:['ice-beam']);
 if(['solo','coop','challenge'].includes(mode))assert.equal(p.moves[1].id,'ice-beam');
 else assert.ok(!p.hasMove('ice-beam'));
 s.pcoverage[260].moves=[];assert.deepEqual(plain(p.coverage),mode==='no-upgrade'?[]:['ice-beam']);
});
