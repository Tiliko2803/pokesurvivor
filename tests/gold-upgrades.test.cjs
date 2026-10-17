'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function fixture(levels={}) {
  const G={}, noop=()=>{};
  const ctx=vm.createContext({G,window:{G},performance:{now:()=>100000}});
  for(const f of ['js/core/util.js','js/data/moves.js','js/data/upgrades.js','js/entities/player.js','js/entities/projectile.js','js/systems/combat.js','js/systems/levelup.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx,{filename:f});
  G.Sprites={Animator:class{update(){} loop(){} play(){}},bodyRadius:()=>10,bodyHeight:()=>30,dirFromAngle:()=>0};
  G.FX=Object.fromEntries(['ring','spark','slash','sp','burst','dmgText'].map(k=>[k,noop]));
  G.Audio={sfx:noop};G.Camera={kick:noop,sees:()=>true};
  G.World={collide:noop,isLiquid:()=>false,nearestBreakable:()=>null,propsInCircle:()=>[],projectileBlock:()=>null};
  G.EnemyMgr={all:()=>[],queryCircle:()=>[]};G.Weather={speedFor:()=>1,mult:()=>1};
  G.Types={mult:()=>1,label:()=>null};G.VFX={forMove:()=>({}),forType:()=>({})};
  G.Coop={active:false};G.Challenges={damageMultiplier:()=>1};G.Progress={event:noop};
  const p=new G.Player({dex:1,hp:100,atk:1,spd:100,types:['normal']},G.Upgrades.perks(levels));
  p.frozen=true;p.cast=noop;p.target={x:100,y:0};p.aim=0;
  function cast(id,level=1) {const m=G.Moves.instance(id,level);p.moves=[m];p.slots=[[m]];p.active=0;G.Combat.tick(0,p,0);return m;}
  return {G,p,cast,ctx};
}
test('Mejoras antiguas conservan valores; nuevos máximos y tres precios exactos',()=>{
  const {G}=fixture();const x=G.Upgrades.perks({});
  assert.equal(x.cardOptions,3);assert.equal(x.critMul,1.5);assert.equal(x.lastBreath,false);
  const max=G.Upgrades.perks(Object.fromEntries(G.Upgrades.LIST.map(u=>[u.id,999])));
  near(max.atkMul,1.4);near(max.cdMul,0.76);near(max.areaMul,1.2);near(max.durationMul,1.25);
  assert.equal(max.critMul,2);assert.equal(max.cardOptions,6);assert.equal(max.drainPerKill,1);
  assert.deepEqual([0,1,2].map(l=>G.Upgrades.cost('options',l)),[2000,6000,15000]);
  assert.equal(G.Upgrades.perks({options:-3,drain:NaN}).cardOptions,3);
});
test('Más Opciones: 3 / 4 / 5 / 6 cartas distintas, respeta Veto y garantiza evolución',()=>{
  for(let level=0;level<=3;level++) {
    const {G,p}=fixture({options:level});G.Moves.poolFor=()=>['ember','water-gun','swords-dance','dragon-dance'];
    p.banned.add('ember');
    for(let repeat=0;repeat<10;repeat++) {
      const cards=G.LevelUp.offer(p);assert.equal(cards.length,3+level);
      assert.equal(new Set(cards.map(c=>c.key)).size,cards.length);
      assert.ok(cards.every(c=>c.key!=='new:ember'));
    }
    const m=G.Moves.instance('swords-dance',5);p.moves=[m];p.slots=[[m]];p.statsTaken.atk=1;
    assert.ok(G.LevelUp.offer(p).some(c=>c.type==='evo'));
    assert.equal(G.LevelUp.offer(p,2).length,2);
  }
});
test('Expansión amplía el disparo y el alcance cuerpo a cuerpo sin acumularse ni tocar la instancia',()=>{
  const {G,p,cast}=fixture({area:4});
  const m=cast('ember');near(G.Projectiles.all()[0].r,m.size*1.2);
  assert.equal(G.Projectiles.all()[0].life,m.life);
  m.t=0;G.Combat.tick(0,p,1);near(G.Projectiles.all()[1].r,m.size*1.2);
  const melee=G.Moves.instance('tackle');p.moves=[melee];p.slots=[[melee]];
  p.target={x:melee.radius*1.2+29,y:0};let reach=0;G.EnemyMgr.queryCircle=(_x,_y,r)=>{reach=r;return []};
  const original=melee.radius;G.Combat.tick(0,p,2);near(reach,original*1.2);assert.equal(melee.radius,original);
});
test('Persistencia alarga las danzas y su evolución una sola vez, conserva recarga y daño',()=>{
  const {G,p,cast}=fixture({duration:5});
  const m=cast('swords-dance',5);near(p.buffs.atk.t,m.dur*1.25);
  const cd=m.t,base=m.dur;G.Moves.evolve(m);m.t=0;G.Combat.tick(0,p,1);
  near(p.buffs.atk.t,15);near(m.dur,12);assert.equal(m.cd,cd);
  m.t=0;G.Combat.tick(0,p,2);near(p.buffs.atk.t,15);assert.ok(base<12);
});
test('Golpe Devastador aplica x2 tanto a ataques directos como proyectiles',()=>{
  for(const move of ['tackle','ember'])for(const level of [0,5]) {
    const {G,p,cast}=fixture({critDamage:level});p.critChance=1;p.target={x:10,y:0};
    const damage=[];const e={id:1,x:10,y:0,r:10,bodyH:30,types:['normal'],hurt:d=>damage.push(d),applyBurn(){},applySlow(){},applyPoison(){},strike(){}};
    G.EnemyMgr.queryCircle=()=>[e];
    const m=cast(move);if(move==='ember')G.Combat.resolve(0,p,0);
    assert.equal(damage.length,1);near(damage[0],m.dmg*(level?2:1.5));
  }
});
test('Drenaje limita ráfagas a 2 PV/s, no acumula a vida llena ni cura después de caer',()=>{
  const {p}=fixture({drain:5});p.hp=40;
  for(let i=0;i<100;i++)p.onKill();near(p.drainHeal,2);
  p.update(0.1);near(p.hp,40.2);near(p.drainHeal,1.8);
  p.update(0.9);near(p.hp,42);near(p.drainHeal,0);
  p.hp=100;p.onKill();near(p.drainHeal,0);
  p.hp=99.9;p.onKill();p.update(0.1);near(p.hp,100);near(p.drainHeal,0);
  p.dead=true;p.hp=0;p.onKill();near(p.drainHeal,0);
});
test('Último Aliento resiste una sola vez y no se renueva tras una reanimación; Focus tiene prioridad',()=>{
  const {G,p}=fixture({lastBreath:1});p.hurt(1000);assert.equal(p.dead,false);assert.equal(p.hp,1);assert.equal(p.invuln,3);
  p.hurt(1000);assert.equal(p.hp,1);p.invuln=0;p.hurt(1000);assert.equal(p.dead,true);
  p.anim._start=()=>{};p.revive();p.invuln=0;p.hurt(1000);assert.equal(p.dead,true);
  const q=new G.Player(p.mon,G.Upgrades.perks({lastBreath:1}));q.item='focussash';q.hurt(1000);
  assert.equal(q.hp,1);assert.equal(q.lastBreathUsed,false);q.invuln=0;q.hurt(1000);
  assert.equal(q.lastBreathUsed,true);assert.equal(q.invuln,3);
});
test('Ataques fantasma conservan tamaño y duración sin causar daño ni mutar al compañero',()=>{
  const {G,p}=fixture();G.Combat.ghostCast(p,'ember',1,0,false,1.2,1.25);
  const m=G.Moves.instance('ember');const shot=G.Projectiles.all()[0];near(shot.r,m.size*1.2);assert.ok(shot.ghost);
  assert.equal(p.areaMul,1);assert.equal(p.durationMul,1);
});

test('Persistencia extiende la vida real de minas, torretas y rastros; Expansión escala sus impactos',()=>{
  for(const id of ['spikes','substitute','toxic']) {
    const {G,p,cast}=fixture({duration:5,area:4});const m=cast(id);
    const count=G.Combat.fieldCount;assert.ok(count>0);
    G.Combat.updateFields(m.dur+0.01);assert.equal(G.Combat.fieldCount,count,id+' expiró demasiado pronto');
    G.Combat.updateFields(m.dur*0.25);assert.equal(G.Combat.fieldCount,0,id+' no expiró');
  }
});
test('Cooperativo: una baja remota da Drenaje, una retirada no; los ataques transmiten los multiplicadores',()=>{
  const {G,p,ctx}=fixture({drain:5,area:4,duration:5});let receive;
  ctx.document={addEventListener(){}};
  G.Net={uid:'guest',on:cb=>receive=cb,onPeer(){}};
  G.DEX_BY={1:p.mon};G.startMoveOf=()=> 'tackle';G.Sprites.preload=()=>{};G.Flow={};
  G.EnemyMgr.removeRemote=()=>{};G.Judgment={};
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','js/net/coop.js'),'utf8'),ctx);
  G.Coop.begin({host:'host',members:[{uid:'guest',dex:1}]},p,{syncTeam(){}});p.hp=40;
  receive('host',{k:'f',ev:[['ed',1],['eg',2]],p:{},e:[]});near(p.drainHeal,1);
  p.dead=true;receive('host',{k:'f',ev:[['ed',3]],p:{},e:[]});near(p.drainHeal,1);
  G.Coop.end();
});
