'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
function fixture(seed=123) {
  const G={};const ctx=vm.createContext({G,window:{G},console});
  for(const f of ['js/core/util.js','js/data/pokedex.js','js/data/sprites-meta.js','js/data/enemies.js','js/data/types.js','js/tft/engine.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
  const E=ctx.G.TFT,s=E.create(seed);return {G:ctx.G,E,s};
}
function purchase(E,s,dex,n=1) {for(let i=0;i<n;i++){s.shop=[dex];assert.ok(E.buy(s,0));}}
test('24 complete evolution families use local Pokédex and sprite assets',()=>{
  const {G,E}=fixture();assert.equal(E.ROSTER.length,24);
  for(const family of E.ROSTER)for(const dex of family.line){
    assert.ok(G.DEX_BY[dex]);assert.ok(fs.existsSync(path.join(root,`assets/pokemon/${dex}/Idle.png`)));
  }
});
test('nine Charmander become Charizard and preserve deployed position and id',()=>{
  const {E,s}=fixture();s.gold=100;purchase(E,s,4,1);const id=s.units[0].id;E.place(s,id,20);
  purchase(E,s,4,2);assert.equal(s.units[0].dex,5);assert.equal(s.units[0].star,2);assert.equal(s.units[0].pos,20);
  purchase(E,s,4,6);assert.equal(s.units.length,1);assert.equal(s.units[0].dex,6);assert.equal(s.units[0].star,3);
  assert.equal(s.units[0].id,id);assert.equal(E.moveFor(s.units[0]),'Llamarada');
  assert.equal(s.gold,91);E.sell(s,id);assert.equal(s.gold,100,'selling conserves invested copies');
});
test('two-stage lines evolve, then empower their final species',()=>{
  const {E,s}=fixture();s.gold=100;purchase(E,s,529,3);assert.equal(s.units[0].dex,530);
  purchase(E,s,529,6);assert.equal(s.units.length,1);assert.equal(s.units[0].dex,530);assert.equal(s.units[0].star,3);
});
test('full bench rejects purchase without spending but allows an evolution merge',()=>{
  const {E,s}=fixture();s.gold=200;for(const d of [4,4,1,7,172,133,66,152])purchase(E,s,d);
  s.shop=[37];const gold=s.gold;assert.equal(E.buy(s,0),false);assert.equal(s.gold,gold);assert.equal(s.shop[0],37);
  purchase(E,s,4);assert.equal(s.units.length,7);assert.ok(s.units.some(u=>u.dex===5));
});
test('deployment limits, enemy cells, swaps and bench capacity',()=>{
  const {E,s}=fixture();s.gold=100;for(const d of [1,4,7,172])purchase(E,s,d);
  const ids=s.units.map(u=>u.id);assert.equal(E.place(s,ids[0],0),false);assert.equal(E.place(s,ids[0],18.5),false);
  ids.slice(0,3).forEach((id,i)=>assert.ok(E.place(s,id,18+i)));
  assert.equal(E.place(s,ids[3],21),false);assert.ok(E.place(s,ids[3],18));
  assert.equal(s.units.find(u=>u.id===ids[0]).pos,null);assert.equal(s.units.find(u=>u.id===ids[3]).pos,18);
  assert.ok(E.place(s,ids[1],null));
});
test('traits count each family once and acquire evolved types',()=>{
  const {E,s}=fixture();s.gold=100;purchase(E,s,4,3);purchase(E,s,4);purchase(E,s,37);
  const traits=E.traits(s.units);assert.equal(traits.fire.count,2);assert.equal(traits.fire.tier,1);
  purchase(E,s,4,5);assert.equal(E.traits(s.units).flying.count,1,'Charizard gains flying');
});
test('level economy and shop lock persist over round transitions',()=>{
  const {E,s}=fixture();s.gold=100;assert.ok(E.buyXP(s));assert.equal(s.xp,4);assert.ok(E.buyXP(s));assert.equal(s.level,4);assert.equal(s.xp,2);
  const shop=JSON.stringify(s.shop);s.locked=true;s.phase='result';assert.ok(E.next(s));assert.equal(JSON.stringify(s.shop),shop);
  s.locked=false;s.phase='result';E.next(s);assert.equal(s.shop.length,5);
});
test('combat blocks purchases, resolves within timeout, preserves roster health and pays once',()=>{
  const {E,s}=fixture();s.gold=100;purchase(E,s,529,3);E.place(s,s.units[0].id,20);
  const before=JSON.stringify(s.units);assert.ok(E.start(s));
  assert.equal(E.buy(s,0),false);assert.equal(E.reroll(s),false);assert.equal(E.buyXP(s),false);
  assert.equal(E.sell(s,s.units[0].id),false);assert.equal(E.place(s,s.units[0].id,21),false);
  for(let i=0;i<1000&&s.phase==='combat';i++)E.tick(s,.1);
  assert.notEqual(s.phase,'combat');assert.ok(s.battle.time<=45.1);assert.equal(JSON.stringify(s.units),before);
  const gold=s.gold;E.tick(s,1);assert.equal(s.gold,gold);
});
test('fixed-seed combat is deterministic across frame rates',()=>{
  const play=dt=>{const {E,s}=fixture(7);s.gold=100;purchase(E,s,4,3);purchase(E,s,7,3);
    s.units.forEach((u,i)=>E.place(s,u.id,18+i));E.start(s);while(s.phase==='combat')E.tick(s,dt);
    return JSON.stringify({result:s.result,life:s.life,units:s.battle.units});};
  assert.equal(play(.05),play(.1));
});
test('last round and zero life terminate; no next round or double payment',()=>{
  for(const life of [1,50]){const {E,s}=fixture();s.gold=100;s.round=12;s.life=life;
    purchase(E,s,1);E.place(s,s.units[0].id,35);E.start(s);s.battle.units.filter(u=>u.side===0).forEach(u=>u.hp=0);E.tick(s,.1);
    assert.equal(s.phase,life===1?'defeat':'victory');assert.equal(E.next(s),false);
    const gold=s.gold;E.tick(s,.2);assert.equal(s.gold,gold);
  }
});
test('TFT adapts the real Survivor classifier without replacing melee identities',()=>{
 const {E,G}=fixture();assert.equal(typeof G.Enemies.behaviorOf,'function');
 assert.equal(G.Enemies.behaviorOf(G.DEX_BY[375]),'shielder');assert.equal(E.aiFor(375),'guardian');
 assert.equal(E.aiFor(448),'diver');assert.equal(E.aiFor(25),'ranged');assert.equal(E.aiFor(280),'healer');
 assert.equal(E.aiFor(530),'fighter');assert.equal(E.aiFor(257),'fighter');assert.equal(E.aiFor(376),'tank');
});
test('divers prefer backline while tanks pick the nearest and ranged pick wounded targets in range',()=>{
 const {E}=fixture();const foes=[{id:2,side:1,hp:100,maxHp:100,x:2,y:2,ai:'tank'},
  {id:3,side:1,hp:40,maxHp:100,x:2,y:1,ai:'healer'}, {id:4,side:1,hp:90,maxHp:100,x:3,y:1,ai:'ranged'}];
 const a={id:1,side:0,hp:100,x:2,y:3,range:3,ai:'diver'},b={units:[a,...foes]};
 assert.equal(E.selectTarget(b,a).id,3);a.ai='tank';assert.equal(E.selectTarget(b,a).id,2);
 a.ai='ranged';assert.equal(E.selectTarget(b,a).id,3);
});
test('ranged units retreat into a free cell when a melee enemy reaches them',()=>{
 const {E,s}=fixture();s.gold=100;purchase(E,s,25); // tests may buy any known stage; shop rolls base species
 E.place(s,s.units[0].id,20);E.start(s);
 const a=s.battle.units.find(u=>u.side===0),foe=s.battle.units.find(u=>u.side===1);
 s.battle.units=[a,foe];a.x=2;a.y=3;foe.x=2;foe.y=2;foe.moveCD=99;foe.cooldown=99;
 E.tick(s,.05);assert.ok(Math.abs(a.x-foe.x)+Math.abs(a.y-foe.y)>1);
 assert.ok(a.x>=0&&a.x<6&&a.y>=0&&a.y<6);
});
test('guardian grants a capped shield to a vulnerable teammate',()=>{
 const {E,s}=fixture();s.gold=100;purchase(E,s,374,3);purchase(E,s,4);
 s.units.forEach((u,i)=>E.place(s,u.id,18+i));E.start(s);
 const a=s.battle.units.find(u=>u.dex===375),ally=s.battle.units.find(u=>u.side===0&&u!==a),foe=s.battle.units.find(u=>u.side===1);
 s.battle.units=[a,ally,foe];a.x=2;a.y=3;a.mana=100;a.cooldown=0;ally.x=3;ally.y=3;ally.hp=ally.maxHp*.1;
 foe.x=2;foe.y=2;foe.cooldown=99;foe.moveCD=99;E.tick(s,.05);
 assert.ok(ally.shield>0);assert.ok(ally.shield<=ally.maxHp*.5);assert.equal(a.mana,0);
});
