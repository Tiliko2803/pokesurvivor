'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./helpers/boss-rush-fixture.cjs');
function setup(){
 const f=fixture('real-account',{live:true}),{G}=f;
 f.load('js/systems/survivor-megas.js');G.DB.playAsGuest();
 G.World.isWall=()=>false;G.FX.beam=()=>{};
 return f;
}
test('both stones require three normal solo bosses, merge progress and restore ordinary forms',()=>{
 const {G}=setup(),s=G.DB.save;
 for(const [dex,stone] of [[530,'excadrillite'],[154,'meganiumite']]){
  s.owned[dex]={at:1};const p={dex,mon:G.DEX_BY[dex],bosses:2};
  assert.equal(G.Mega.equip(s,dex,true),false);
  assert.equal(G.Mega.finishRun(s,p,{clean:true}),false);p.bosses=3;
  for(const flags of [{clean:false},{clean:true,coop:true},{clean:true,challenge:true}])assert.equal(G.Mega.finishRun(s,p,flags),false);
  assert.equal(G.Mega.finishRun(s,p,{clean:true}),true);assert.equal(G.Mega.equip(s,dex,true),true);
  const m=G.Mega.form(p.mon,s);assert.equal(m.megaStone,stone);
  assert.equal(G.Repertoire.initialMove(m),dex===530?'metal-claw':'solar-beam');
  const merged=G.DB.merge(s,{...s,updated:s.updated+1,megaProgress:{}});
  assert.equal(merged.megaProgress[G.Mega.definition(dex).progress],3);
  assert.equal(G.Mega.has(merged,dex),true);G.Mega.equip(s,dex,false);
  assert.equal(G.Mega.form(p.mon,s),p.mon);
 }
});
test('actual runs use new atlases, level-2 starters, correct stats and transformation intro',()=>{
 const f=setup(),{G}=f;f.load('js/systems/mega-evolution.js');
 G.SurvivorMegas.pack=()=>({ready:()=>true});
 for(const dex of [530,154]){
  const s=G.DB.save;s.partner=dex;s.owned[dex]={at:1};s.megaStones[G.Mega.definition(dex).id]=1;
  G.Mega.equip(s,dex,true);G.Game.startRun();const p=G.Game.player;
  assert.ok(p.anim instanceof G.SurvivorMegas.Animator);assert.equal(p.moves[0].lvl,2);
  assert.equal(p.mon.baseStats[dex===530?'atk':'spa'],dex===530?165:143);
  assert.equal(G.MegaEvolution.active,true);f.tick(150);assert.equal(G.MegaEvolution.active,false);
  G.Game.toUI();G.Mega.equip(s,dex,false);G.Game.startRun();assert.equal(G.Game.player.mega,null);G.Game.toUI();
 }
});
function fighter(stone){return {mega:stone,x:0,y:0,aim:0,level:10,maxHp:100,hp:50,areaMul:1,dmgDealt:0,
 atkFor:()=>2,onDealt(){},heal(n){this.hp=Math.min(this.maxHp,this.hp+n);}};}
function enemy(x,y=0,behavior='melee',types=['normal']){return {x,y,r:8,hp:10000,types,mon:{df:75,sd:75},behavior,hits:[],slows:[],
 hurt(n){this.hits.push(n);},applySlow(n,t){this.slows.push([n,t]);}};}
test('drill pierces hordes, rewards support hits and respects range, walls, types and simulation timing',()=>{
 const {G}=setup(),p=fighter('excadrillite');
 const a=enemy(60),b=enemy(180,0,'healer'),c=enemy(200,0,'shielder'),far=enemy(600),side=enemy(100,90),immune=enemy(100,0,'melee',['flying']);
 const list=[a,b,c,far,side,immune];G.EnemyMgr.queryCircle=()=>list;
 G.SurvivorMegas.tick(1,p);assert.equal(a.hits.length,0);G.SurvivorMegas.tick(.5,p);
 assert.equal(a.hits.length,1);assert.equal(b.hits[0],a.hits[0]*1.5);assert.equal(c.hits[0],b.hits[0]);
 assert.equal(immune.hits[0],a.hits[0]*.3);
 for(const e of [far,side])assert.equal(e.hits.length,0);
 G.SurvivorMegas.tick(3,p);assert.equal(a.hits.length,1);G.SurvivorMegas.tick(1,p);assert.equal(a.hits.length,2);
 G.World.isWall=x=>x>=100;G.SurvivorMegas.tick(40,p);
 assert.equal(a.hits.length,3);assert.equal(b.hits.length,2,'wall blocks further enemies, no stored extra pulses');
});
test('garden fires four rays, slows bosses less and heals once only when a ray connects',()=>{
 const {G}=setup(),p=fighter('meganiumite'),targets=[enemy(70),enemy(0,70),enemy(-70),enemy(0,-70)];
 targets[0].boss=true;G.EnemyMgr.queryCircle=()=>targets;
 G.SurvivorMegas.tick(1.5,p);assert.equal(p.hp,54);
 for(const e of targets)assert.equal(e.hits.length,1);
 assert.deepEqual(targets[0].slows[0],[.15,2]);assert.deepEqual(targets[1].slows[0],[.35,2]);
 G.EnemyMgr.queryCircle=()=>[];G.SurvivorMegas.tick(8,p);assert.equal(p.hp,54);
});
test('ordinary, remote, frozen and dead players never trigger passives; clocks are independent',()=>{
 const {G}=setup(),e=enemy(50);G.EnemyMgr.queryCircle=()=>[e];
 for(const mega of ['excadrillite','meganiumite']){
  const p=fighter(mega);
  for(const patch of [{mega:null},{dead:true},{remote:true},{frozen:true}])G.SurvivorMegas.tick(20,{...p,...patch});
  G.SurvivorMegas.tick(NaN,p);G.SurvivorMegas.tick(-1,p);assert.equal(e.hits.length,0);
 }
 const a=fighter('excadrillite'),b=fighter('excadrillite');G.SurvivorMegas.tick(1.5,a);G.SurvivorMegas.tick(1,b);
 assert.equal(e.hits.length,1);G.SurvivorMegas.tick(.5,b);assert.equal(e.hits.length,2);
});
test('Meganium Solar Beam becomes instant without mutating the normal move or its evolved version',()=>{
 const {G}=setup(),p=fighter('meganiumite');p.cdMul=1;p.activeGroup=()=>[m];p.cast=()=>{};
 p.target=enemy(100);p.attackSpeed=1;p.anim={};G.EnemyMgr.queryCircle=()=>[];
 G.World.isWall=()=>false;G.FX.beam=()=>{};
 const m=G.Moves.instance('solar-beam');m.t=0;
 G.Combat.clearFields();G.Combat.tick(.01,p,1);assert.equal(G.Combat.fieldCount,0);assert.equal(m.kind,'charge');
 m.t=0;p.mega=null;G.Combat.tick(.01,p,1);assert.equal(G.Combat.fieldCount,1);
 G.Combat.clearFields();G.Moves.evolve(m);m.t=0;p.mega='meganiumite';
 G.Combat.tick(.01,p,1);assert.equal(G.Combat.fieldCount,0);assert.equal(m.kind,'charge');
});
