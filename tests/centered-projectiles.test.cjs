'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
function fixture({combat='js/systems/combat.js',jitter=0}={}){
  const G={},noop=()=>{},context=vm.createContext({G,window:{G},performance:{now:()=>0}});
  for(const file of ['js/core/util.js','js/data/moves.js','js/entities/projectile.js',combat])
    vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  G.U.rand=(a,b)=>(a+b)/2+jitter*(b-a)/2;
  G.VFX={forMove:()=>({}),forType:()=>({})};
  G.FX={spark:noop,sp:noop,burst:noop};
  G.Camera={sees:()=>true};
  G.World={projectileBlock:()=>null,propsInCircle:()=>[]};
  G.Types={mult:()=>1,label:()=>null};G.Weather={mult:()=>1};
  G.Coop={active:false,cast:noop};
  G.EnemyMgr={queryCircle:()=>[]};
  function player(m,aim=0){
    return {x:20,y:40,r:12,atk:1,cdMul:1,aim,dmgDealt:0,critChance:0,
      target:{x:20+430*Math.cos(aim),y:40+430*Math.sin(aim)},
      activeGroup:()=>[m],cast:noop,onDealt:noop,hasItem:()=>false};
  }
  return {G,player};
}
const angleDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
function assertCentered(p,pl){
  assert.ok(Math.abs(angleDiff(Math.atan2(p.vy,p.vx),pl.aim))<1e-12,'el primer disparo perdió el centro');
  assert.ok(Math.abs(angleDiff(Math.atan2(p.y-pl.y,p.x-pl.x),pl.aim))<1e-12,'el origen perdió el centro');
}
test('Todos los ataques de proyectiles: centro exacto en 8 direcciones, niveles 1–5 y evolución',()=>{
  const {G,player}=fixture({jitter:1});
  const defs=G.Moves.ALL.filter(m=>m.kind==='projectile');
  assert.ok(defs.some(m=>m.id==='ember'));
  for(const def of defs)for(let level=1;level<=def.maxLvl;level++)for(let dir=0;dir<8;dir++){
    const m=G.Moves.instance(def.id,level);if(level===def.maxLvl)G.Moves.evolve(m);
    const pl=player(m,dir*Math.PI/4);G.Projectiles.clear();G.Combat.tick(0,pl,0);
    const shots=G.Projectiles.all();
    assert.equal(shots.length,m.count,`${def.id} Nv.${level}`);
    assertCentered(shots[0],pl);
    for(const p of shots){
      assert.ok(Math.abs(Math.hypot(p.vx,p.vy)-m.speed)<1e-9);
      assert.equal(p.dmg,m.dmg);assert.equal(p.pierce,m.pierce|0);
      assert.equal(p.life,m.life);assert.equal(p.homing,m.homing||0);
      assert.equal(p.burn,m.burn||0);assert.equal(p.poison,m.poison||0);
    }
  }
});
test('Con 1–8 proyectiles mantiene uno centrado y abre los extras a ambos lados cuando hay tres o más',()=>{
  for(const jitter of [-1,0,1]){
    const {G,player}=fixture({jitter});
    for(let n=1;n<=8;n++){
      const m=G.Moves.instance('ember');m.count=n;
      const pl=player(m,0.8);G.Projectiles.clear();G.Combat.tick(0,pl,0);
      const shots=G.Projectiles.all();assert.equal(shots.length,n);assertCentered(shots[0],pl);
      const offsets=shots.slice(1).map(p=>angleDiff(Math.atan2(p.vy,p.vx),pl.aim));
      assert.ok(offsets.every(a=>Math.abs(a)>0.01));
      if(n>=3){assert.ok(offsets.some(a=>a<0));assert.ok(offsets.some(a=>a>0));}
      assert.equal(new Set(offsets.map(a=>a.toFixed(8))).size,offsets.length);
    }
  }
});
function hitsAtDistance(combat){
  const {G,player}=fixture({combat});const m=G.Moves.instance('ember',2),pl=player(m);
  let hits=0;
  const target={id:1,x:450,y:40,r:8,bodyH:20,types:['normal'],cy:()=>40,
    hurt:()=>hits++,applyBurn:()=>{},applyPoison:()=>{},applySlow:()=>{}};
  pl.target=target;G.EnemyMgr.queryCircle=()=>[target];
  G.Combat.tick(0,pl,0);
  G.Projectiles.update(1.4,pl,[target]);
  G.Combat.resolve(1.4,pl,1.4);
  return hits;
}
test('Regresión real de Ascuas Nv.2: un blanco pequeño a distancia recibe el disparo central',()=>{
  assert.equal(hitsAtDistance('js/systems/combat.js'),1);
  assert.equal(hitsAtDistance('dev/js/systems/combat.js'),1);
});
test('Cooperativo: el disparo local y el fantasma comparten el centro sin duplicar daño',()=>{
  const {G,player}=fixture();const m=G.Moves.instance('ember',2),pl=player(m,2.5);
  const calls=[];G.Coop={active:true,cast:(...args)=>calls.push(args)};
  G.Combat.tick(0,pl,0);const local=G.Projectiles.all().map(p=>({vx:p.vx,vy:p.vy}));
  assert.equal(calls.length,1);G.Projectiles.clear();
  G.Combat.ghostCast(pl,'ember',2,pl.aim,false);
  const remote=G.Projectiles.all();assertCentered(remote[0],pl);
  assert.deepEqual(remote.map(p=>({vx:p.vx,vy:p.vy})),local);
  assert.ok(remote.every(p=>p.ghost));
  let hits=0;const enemy={id:1,x:450,y:40,r:8,bodyH:20,hurt:()=>hits++};
  G.EnemyMgr.queryCircle=()=>[enemy];
  G.Projectiles.clear();pl.aim=0;G.Combat.ghostCast(pl,'ember',2,0,false);
  G.Projectiles.update(1.4,pl,[]);G.Combat.resolve(1.4,pl,1.4);
  assert.equal(hits,0);
  G.Projectiles.clear();m.t=0;G.Combat.tick(0,pl,0);
  assert.ok(G.Projectiles.all().every(p=>!p.ghost));
});
test('Sin objetivo espera; el disparo único también sale sin desviación aleatoria',()=>{
  const {G,player}=fixture({jitter:-1});const m=G.Moves.instance('ember'),pl=player(m,-2.7);
  pl.target=null;G.Combat.tick(0,pl,0);assert.equal(G.Projectiles.count,0);
  pl.target={x:pl.x+100,y:pl.y};pl.aim=0;m.t=0;
  G.Combat.tick(0,pl,0);assert.equal(G.Projectiles.count,1);assertCentered(G.Projectiles.all()[0],pl);
});
