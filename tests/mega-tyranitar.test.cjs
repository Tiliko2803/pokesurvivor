'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {fixture}=require('./helpers/boss-rush-fixture.cjs');
async function setup(){const f=fixture();await f.G.DB.ready();return f;}
test('Tyranitarita requires three solo bosses in one normal run and survives save merge',async()=>{
  const {G}=await setup(),s=G.DB.save;
  delete s.megaStones.tyranitarite;delete s.megaEquipped[248];
  const p={dex:248,mon:G.DEX_BY[248],bosses:2};
  assert.equal(G.Mega.finishRun(s,p,{clean:true}),false);
  p.bosses=3;assert.equal(G.Mega.finishRun(s,p,{clean:true,coop:true}),false);
  assert.equal(G.Mega.finishRun(s,p,{clean:true,challenge:true}),false);
  assert.equal(G.Mega.finishRun(s,p,{clean:false}),false);
  assert.equal(G.Mega.finishRun(s,p,{clean:true}),true);
  assert.equal(G.Mega.equip(s,248,true),true);
  const later={...s,updated:s.updated+1,megaProgress:{tyranitarBosses:1}};
  const merged=G.DB.merge(s,later);assert.equal(merged.megaProgress.tyranitarBosses,3);
  assert.equal(G.Mega.has(merged,248),true);
  assert.equal(G.Mega.equipped(merged,248),true);
});
test('Preview unlocks all three megas, transforms Tyranitar, and starts Rock Throw at level 2',async()=>{
  const {G}=await setup(),s=G.DB.save;
  for(const dex of [260,257,248])assert.equal(G.Mega.equipped(s,dex),true);
  s.partner=248;const mon=G.Mega.form(G.DEX_BY[248],s);
  assert.equal(mon.hp,132);assert.equal(mon.atk,1.8);assert.equal(mon.spd,109);
  assert.equal(mon.megaNoShiny,true);assert.equal(G.Repertoire.initialMove(mon),'rock-throw');
  G.Game.startRun();const p=G.Game.player;
  assert.equal(p.mega,'tyranitarite');assert.equal(p.moves[0].id,'rock-throw');assert.equal(p.moves[0].lvl,2);
  assert.equal(p.reduction,.10);assert.equal(p.maxMoves,4);
  assert.equal(p.moves.length,1,'Dragon Dance remains an elected coverage, not a free slot');
  assert.ok(G.Coverage.eligible(mon).includes('dragon-dance'));
});
test('Sand Stream respects attack buffs, rock effectiveness, range, slow and elapsed time',async()=>{
  const {G}=await setup();G.DB.save.partner=248;G.Game.startRun();const p=G.Game.player;
  p.buffs.atk={n:8,amount:.25,t:12,maxStacks:8,attackSpeedAmount:.05};
  assert.equal(p.atk,5.4);assert.equal(p.attackSpeed,1.4);
  let total=0,hits=0,slow=0;const near={x:50,y:0,r:5,types:['fire'],hurt(d){total+=d;hits++;},applySlow(f){slow=f;}};
  const far={...near,x:400,hurt(){throw Error('out of range');}};
  G.EnemyMgr.queryCircle=()=>[near,far];G.Weather.mult=()=>1;
  G.Tyranitar.tickSand(p,.5);assert.equal(hits,0);
  G.Tyranitar.tickSand(p,.25);assert.equal(hits,1);assert.equal(total,69.12);assert.equal(slow,.25);
  assert.equal(p.dmgDealt,69.12);
  G.Tyranitar.tickSand(p,.75);assert.equal(hits,2);
  G.Tyranitar.tickSand(p,30);assert.equal(hits,3,'no banked burst after suspension');
  p.dead=true;G.Tyranitar.tickSand(p,1);assert.equal(hits,3);
});
test('Sand radius applies Expansion once, resistance caps at 80%, normal Tyranitar has no aura',async()=>{
  const {G}=await setup(),mega=G.Mega.form(G.DEX_BY[248],G.DB.save);
  const p=new G.Player(mega,{areaMul:1.2,dmgReduce:.15});
  assert.equal(G.Tyranitar.radius(p),132);assert.ok(Math.abs(p.reduction-.25)<1e-10);
  p.dmgReduce=.79;assert.equal(p.reduction,.8);
  const normal=new G.Player(G.DEX_BY[248],{dmgReduce:.15});assert.equal(normal.reduction,.15);
  G.EnemyMgr.queryCircle=()=>{throw Error('normal form has no sand');};G.Tyranitar.tickSand(normal,1);
});
test('Preview setup offers Tyranitar and compatible elected Dragon Dance without altering official scripts',async()=>{
  const {G,nodes}=await setup();G.BossRushPreview.open();
  const select=nodes.get('rush-partner');assert.ok(select.options.some(o=>o.value==='248'));
  select.value='248';select.onchange();
  assert.equal(nodes.get('rush-move-1').value,'rock-throw');assert.equal(nodes.get('rush-move-2').value,'bite');
  assert.equal(G.BossRushPreview.maxUpgrades(248),true);
  assert.equal(G.Coverage.choose(G.DEX_BY[248],G.DB.save,['dragon-dance']),true);
  select.onchange();assert.ok(nodes.get('rush-move-2').options.some(o=>o.value==='dragon-dance'));
  const official=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.ok(!official.includes('dev/tyranitar.js'));
  const preview=fs.readFileSync(path.join(__dirname,'../dev/index.html'),'utf8');assert.match(preview,/dev\/tyranitar.js/);
});
test('Animator remaps source directions and holds or returns from one-shot actions',async()=>{
  const {G}=await setup(),a=new G.Tyranitar.Animator();
  assert.deepEqual(Array.from(G.Tyranitar.ROWS),[0,7,6,5,4,3,2,1]);
  a.loop('Walk');a.play('Shoot');assert.equal(a.busy(),true);a.update(1);assert.equal(a.cur,'Walk');
  a.play('Faint',{hold:true});a.update(1);assert.equal(a.done,true);assert.equal(a.progress(),1);
});
