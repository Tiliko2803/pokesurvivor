'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const noop=()=>{},near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function fixture({evolved=true,maxHp=100}={}){
 const G={},ctx=vm.createContext({G,window:{G},console,performance:{now:()=>0}});
 for(const f of ['js/core/util.js','js/data/moves.js','js/data/types.js','js/systems/mega.js','js/entities/player.js','js/systems/combat.js'])
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx,{filename:f});
 G.Coop={active:false};G.Audio={sfx:noop};G.Camera={kick:noop,sees:()=>true};
 G.FX=new Proxy({},{get:()=>noop});G.VFX={forMove:()=>({})};G.Weather={mult:()=>1};
 G.World={propsInCircle:()=>[],damageProp:noop};
 const targets=[];G.EnemyMgr={queryCircle:()=>targets};
 const m=G.Moves.instance('play-rough',5);if(evolved)G.Moves.evolve(m);
 const pl=Object.create(G.Player.prototype);
 Object.assign(pl,{mon:{types:['fairy','steel'],atk:1.47,specialAtk:1.08},mega:'tinkatonite',
  x:0,y:0,r:10,bodyH:30,aim:0,baseAtk:1.47,atkMul:1,cdMul:1,buffs:{atk:{n:0,amount:0}},
  hp:maxHp/2,maxHp,dead:false,remote:false,dmgDealt:0,critChance:0,critMul:2,
  target:{x:10,y:0},activeGroup:()=>[m],cast:noop,onDealt:noop});
 const enemy=(opts={})=>({x:10,y:0,r:8,types:['normal'],hp:1e6,dead:false,
  hurt(d){if(!this.dead&&!this.blocked)this.hp-=d;},...opts});
 const cast=now=>{m.t=0;G.Combat.tick(0,pl,now);};
 return {G,pl,m,targets,enemy,cast};
}
test('Juego Rudo uses the Latin American name; its evolution requires Synthesis and stays physical Fairy',()=>{
 const {G,m}=fixture({evolved:false});
 assert.equal(m.name,'Juego Rudo');assert.equal(m.type,'fairy');assert.equal(m.category,'physical');
 const info=G.Moves.evoInfo(m,{atk:1});assert.equal(info.name,'Beso Drenaje');assert.equal(info.ready,false);
 assert.equal(G.Moves.evoInfo(m,{rgn:1}).ready,true);const damage=m.dmg;
 assert.equal(G.Moves.evolve(m),true);assert.equal(m.name,'Beso Drenaje');assert.equal(m.kind,'melee');
 assert.equal(m.category,'physical');assert.equal(m.type,'fairy');near(m.dmg,damage*1.9);
 assert.equal(m.drainKiss,.02);assert.equal(G.Moves.evolve(m),false);
 assert.ok(G.Moves.poolFor({dex:959,types:['fairy','steel']}).includes('play-rough'));
 assert.ok(!G.Moves.poolFor({dex:260,types:['water','ground']}).includes('play-rough'));
});
test('A crowd heals once per attack and a rolling second permits at most 4% maximum HP',()=>{
 const {pl,targets,enemy,cast}=fixture();for(let i=0;i<10;i++)targets.push(enemy());
 cast(0);near(pl.hp,52);cast(.1);near(pl.hp,54);cast(.2);near(pl.hp,54);cast(.999);near(pl.hp,54);
 cast(1);near(pl.hp,56);cast(1.05);near(pl.hp,56);cast(1.101);near(pl.hp,58);
});
test('Potencia, criticals and attack buffs increase damage without multiplying healing',()=>{
 const {pl,m,targets,enemy,cast}=fixture({maxHp:1000});const e=enemy();targets.push(e);
 pl.atkMul=8;pl.buffs.atk={n:8,amount:.30};pl.critChance=1;const before=e.hp;
 cast(0);near(before-e.hp,m.dmg*(1.47*8*3.4)*2*2);near(pl.hp,520);
});
test('Misses, props, defeated enemies, blocked damage and unevolved Juego Rudo never heal',()=>{
 const f=fixture();f.cast(0);near(f.pl.hp,50);
 f.G.World.propsInCircle=()=>[{id:1,x:10,y:0}];f.cast(.1);near(f.pl.hp,50);
 f.targets.push(f.enemy({hp:0,dead:true}));f.cast(.2);near(f.pl.hp,50);
 f.targets.splice(0,1,f.enemy({blocked:true}));f.cast(.3);near(f.pl.hp,50);
 const base=fixture({evolved:false});base.targets.push(base.enemy());base.cast(0);near(base.pl.hp,50);
});
test('Full HP banks no recovery, caps at max HP, and a dead or remote player cannot drain',()=>{
 const {pl,targets,enemy,cast}=fixture();targets.push(enemy());pl.hp=100;cast(0);near(pl.hp,100);
 pl.hp=50;cast(.1);near(pl.hp,52);pl.hp=99;cast(.2);near(pl.hp,100);
 pl.hp=0;pl.dead=true;cast(2);near(pl.hp,0);
 pl.dead=false;pl.hp=50;pl.remote=true;cast(3);near(pl.hp,50);
});
test('Visual coop copies never damage or heal; recovery limits belong to each player',()=>{
 const f=fixture();f.targets.push(f.enemy());f.G.Combat.ghostCast(f.pl,'play-rough',5,0,true,1,1);near(f.pl.hp,50);near(f.targets[0].hp,1e6);
 f.cast(0);f.cast(.1);f.cast(.2);near(f.pl.hp,54);
 const other=fixture();other.targets.push(other.enemy());other.cast(.2);near(other.pl.hp,52);
});
