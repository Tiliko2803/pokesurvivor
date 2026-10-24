'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
function fixture(){
 const G={},ctx=vm.createContext({G,window:{G},console,Image:class{}});
 for(const f of ['js/core/util.js','js/data/pokedex.js','js/data/moves.js','js/systems/stats.js','js/data/types.js','js/systems/mega.js','js/systems/parasect.js','js/systems/repertoire.js'])
  vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
 const enemies=[];G.EnemyMgr={queryCircle:(x,y,r)=>enemies.filter(e=>Math.hypot(e.x-x,e.y-y)<=r)};
 G.FX={ring(){},burst(){}};G.Weather={mult:()=>1};
 function enemy(x=0,boss=false){
  const e={x,y:0,hp:1000,types:['psychic'],mon:{sd:75},boss,dead:false,hits:[],slows:[],
   hurt(n){this.hits.push(n);this.hp-=n;if(this.hp<=0)this.dead=true;},
   applySlow(n,d){this.slows.push([n,d]);}};enemies.push(e);return e;
 }
 const pl={mega:'parasectite',x:0,y:0,level:10,maxHp:100,hp:50,dmgDealt:0,areaMul:1,
  atkFor:()=>2,onDealt(){},heal(n){this.hp=Math.min(this.maxHp,this.hp+n);}};
 return {G,pl,enemy};
}
test('Parasectita unlock and equip use the existing solo three-boss mission',()=>{
 const {G}=fixture(),s={owned:{47:{at:1}},megaStones:{},megaEquipped:{}};
 const p={dex:47,mon:G.DEX_BY[47],bosses:2};
 assert.equal(G.Mega.equip(s,47,true),false);
 assert.equal(G.Mega.finishRun(s,p,{clean:true}),false);p.bosses=3;
 assert.equal(G.Mega.finishRun(s,p,{clean:true,coop:true}),false);
 assert.equal(G.Mega.finishRun(s,p,{clean:true,challenge:true}),false);
 assert.equal(G.Mega.finishRun(s,p,{clean:true}),true);
 assert.equal(G.Mega.equip(s,47,true),true);G.Mega.sanitize(s);
 const form=G.Mega.form(G.DEX_BY[47],s);
 assert.deepEqual(Array.from(form.types),['bug','ghost']);
 assert.equal(form.bst,505);assert.equal(form.atk,form.sa);assert.ok(form.sa>form.pa);
 assert.equal(G.Repertoire.initialMove(form),'shadow-ball');
 assert.ok(G.Moves.poolFor(form).includes('shadow-ball'));assert.ok(G.Moves.poolFor(form).includes('bug-buzz'));
 assert.equal(G.Mega.equip(s,47,false),true);
 assert.equal(G.Mega.form(G.DEX_BY[47],s),G.DEX_BY[47]);
});
test('spore pulse respects simulation time, types, stats, range and boss slow',()=>{
 const {G,pl,enemy}=fixture(),e=enemy(),boss=enemy(50,true),far=enemy(500);
 G.Parasect.tick(1,pl);assert.equal(e.hits.length,0);
 G.Parasect.tick(.5,pl);assert.equal(e.hits[0],37*2*1.6);
 assert.deepEqual(e.slows[0],[.35,2]);assert.deepEqual(boss.slows[0],[.15,2]);
 assert.equal(far.hits.length,0);assert.equal(pl.dmgDealt,e.hits[0]+boss.hits[0]);
 G.Parasect.tick(1,pl);assert.equal(e.hits.length,1);
});
test('infected deaths spread once, heal at most 6% per cycle and stop after expiration',()=>{
 const {G,pl,enemy}=fixture(),targets=Array.from({length:8},()=>enemy());
 G.Parasect.tick(1.5,pl);for(const e of targets)e.dead=true;
 G.Parasect.tick(.1,pl);assert.equal(pl.hp,56);
 G.Parasect.tick(.1,pl);assert.equal(pl.hp,56);
 const other=fixture(),e=other.enemy();other.G.Parasect.tick(1.5,other.pl);
 other.G.Parasect.tick(3,other.pl);e.dead=true;other.G.Parasect.tick(.1,other.pl);
 assert.equal(other.pl.hp,50,'an expired infection gives no healing');
});
test('ordinary, dead, remote and frozen players never trigger spores; owners have independent timers',()=>{
 const {G,pl,enemy}=fixture(),e=enemy();
 for(const patch of [{mega:null},{dead:true},{remote:true},{frozen:true}])G.Parasect.tick(10,{...pl,...patch});
 assert.equal(e.hits.length,0);G.Parasect.tick(1.5,pl);assert.equal(e.hits.length,1);
 const second={...pl};G.Parasect.tick(1,second);assert.equal(e.hits.length,1);
 G.Parasect.tick(.5,second);assert.equal(e.hits.length,2);
 G.Parasect.tick(NaN,pl);G.Parasect.tick(-1,pl);assert.equal(e.hits.length,2);
});
test('real game starts the mega with level-2 Shadow Ball, runs its intro and restores normal form',()=>{
 const {fixture:gameFixture}=require('./helpers/boss-rush-fixture.cjs');
 const f=gameFixture('real-account',{live:true}),{G}=f;
 f.load('js/systems/parasect.js');f.load('js/systems/mega-evolution.js');G.Parasect.ready=()=>true;
 G.DB.playAsGuest();const s=G.DB.save;s.partner=47;s.owned[47]={at:1};s.megaStones.parasectite=1;
 G.Mega.equip(s,47,true);G.Game.startRun();const p=G.Game.player;
 assert.equal(p.mega,'parasectite');assert.equal(p.moves[0].id,'shadow-ball');assert.equal(p.moves[0].lvl,2);
 assert.ok(p.anim instanceof G.Parasect.Animator);assert.equal(G.MegaEvolution.active,true);
 assert.deepEqual(Array.from(p.mon.types),['bug','ghost']);
 f.tick(150);assert.equal(G.MegaEvolution.active,false);assert.ok(G.Game.st.time>0);
 G.Game.toUI();G.Mega.equip(s,47,false);G.Game.startRun();
 assert.equal(G.Game.player.mega,null);assert.deepEqual(Array.from(G.Game.player.mon.types),['bug','grass']);
});
