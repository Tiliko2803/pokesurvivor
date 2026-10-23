'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
function fixture(seed=123) {
  const G={};const ctx=vm.createContext({G,window:{G},console});
  for(const f of ['js/core/util.js','js/data/pokedex.js','js/data/sprites-meta.js','js/data/enemies.js','js/data/types.js','js/tft/engine.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
  const E=ctx.G.TFT,s=E.create(seed);return {G:ctx.G,E,s};
}
function purchase(E,s,dex,n=1) {for(let i=0;i<n;i++){s.shop=[dex];assert.ok(E.buy(s,0));}}
test('34 complete evolution families use local Pokédex and sprite assets',()=>{
  const {G,E}=fixture();assert.equal(E.ROSTER.length,34);
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
 foe.x=2;foe.y=2;foe.cooldown=99;foe.moveCD=99;for(let i=0;i<12;i++)E.tick(s,.05);
 assert.ok(ally.shield>0);assert.ok(ally.shield<=ally.maxHp*.5);assert.equal(a.mana,0);
});
test('ten-line decks validate exact family identities and snapshot the selection',()=>{
 const {E}=fixture();assert.ok(E.validDeck(E.DEFAULT_DECK));
 for(const bad of [[],E.DEFAULT_DECK.slice(1),[...E.DEFAULT_DECK,37],[...E.DEFAULT_DECK.slice(1),4],E.DEFAULT_DECK.map((d,i)=>i===0?2:d)]){
  assert.equal(E.validDeck(bad),false);assert.throws(()=>E.create(2,bad));
 }
 const deck=Array.from(E.DEFAULT_DECK),s=E.create(1,deck);deck[0]=37;
 assert.equal(s.deck[0],1);assert.equal(s.deck.length,10);
});
test('shop only offers chosen lines at every level, refresh and round',()=>{
 const {E}=fixture();const deck=[1,7,172,66,37,54,529,63,258,384],s=E.create(99,deck);
 s.gold=10000;
 for(const level of [3,4,5,6]){s.level=level;for(let i=0;i<150;i++){
  assert.ok(E.reroll(s));assert.ok(s.shop.every(d=>deck.includes(d)));
 }}
 s.shop=[4];const gold=s.gold;assert.equal(E.buy(s,0),false);assert.equal(s.gold,gold);
 s.phase='result';E.next(s);assert.ok(s.shop.every(d=>deck.includes(d)));
});
test('decks without low-cost families still produce a playable cheapest shop',()=>{
 const {E}=fixture();const deck=E.ROSTER.filter(f=>f.cost>=3).slice(0,10).map(f=>f.dex);assert.equal(deck.length,10);
 const s=E.create(11,deck);for(let i=0;i<50;i++){
  E.reroll(s,true);assert.ok(s.shop.every(d=>E.BY[d].cost===3));
 }
 s.level=6;for(let i=0;i<50;i++){E.reroll(s,true);assert.ok(s.shop.every(d=>deck.includes(d)));}
});
test('evolution emits old/new species and expires while planning without changing the unit',()=>{
 const {E,s}=fixture();s.gold=100;purchase(E,s,4,3);
 assert.equal(s.effects.length,1);assert.equal(s.effects[0].fromDex,4);assert.equal(s.effects[0].toDex,5);
 const before=JSON.stringify(s.units);for(let i=0;i<20;i++)E.tick(s,.1);
 assert.equal(s.effects.length,0);assert.equal(JSON.stringify(s.units),before);assert.equal(s.phase,'planning');
});
test('inspection previews current synergy stats without mutating the save roster',()=>{
 const {E,s}=fixture();s.gold=100;purchase(E,s,4);purchase(E,s,37);
 s.units.forEach((u,i)=>E.place(s,u.id,18+i));const before=JSON.stringify(s.units);
 const f=E.preview(s,s.units[0]);assert.ok(f.attack>44);assert.equal(f.hp,f.maxHp);
 assert.ok(E.abilityFor(s.units[0]).description);assert.equal(JSON.stringify(s.units),before);
});
function battleFor(E,specs) {
 const s=E.create(42),units=specs.map(([dex,star,side,x,y],i)=>{
  const u=E.preview({units:[]},{id:i+1,dex,star,pos:y*6+x});Object.assign(u,{side,x,y,cooldown:99,moveCD:99});
  if(side===1)u.hp=u.maxHp=10000;return u;
 });
 s.phase='combat';s.battle={time:0,acc:0,events:[],units};return {s,b:s.battle,units};
}
test('Charizard burns a cone and burn ticks without hitting allies or enemies behind it',()=>{
 const {E}=fixture();const {s,b,units:[a,t,near,back,ally]}=battleFor(E,[[6,3,0,2,4],[133,1,1,2,3],[133,1,1,3,2],[133,1,1,2,5],[7,1,0,3,3]]);
 const allyHP=ally.hp;E.cast(b,a,t);assert.ok(t.burn);assert.ok(near.burn);assert.equal(back.burn,undefined);assert.equal(ally.hp,allyHP);
 const hp=t.hp;for(let i=0;i<12;i++)E.tick(s,.1);assert.ok(t.hp<hp);assert.ok(a.damageDone>0);
});
test('Blastoise water beam damages its line and pushes without overlap or leaving the board',()=>{
 const {E}=fixture();const {b,units:[a,t,other,edge,off]}=battleFor(E,[[9,3,0,2,4],[133,1,1,2,3],[133,1,1,2,2],[133,1,1,2,0],[133,1,1,4,2]]);
 E.cast(b,a,t);assert.ok(t.hp<10000);assert.ok(other.hp<10000);assert.ok(edge.hp<10000);assert.equal(off.hp,10000);
 assert.equal(new Set(b.units.map(u=>u.x+','+u.y)).size,b.units.length);
 assert.ok(b.units.every(u=>u.x>=0&&u.x<6&&u.y>=0&&u.y<6));assert.ok(b.events.some(e=>e.kind==='beam'));
});
test('Excadrill pierces multiple enemies and lands free; allied blockers stop the drill',()=>{
 const {E}=fixture();for(const block of [false,true]){
  const {b,units:[a,t,next]}=battleFor(E,[[530,2,0,2,4],[133,1,1,2,3],[133,1,block?0:1,2,2]]);
  const nextHP=next.hp;E.cast(b,a,t);assert.ok(t.hp<10000);
  if(block){assert.equal(next.hp,nextHP);assert.equal(a.y,4);}else{assert.ok(next.hp<nextHP);assert.equal(a.y,1);}
  assert.equal(new Set(b.units.filter(u=>u.hp>0).map(u=>u.x+','+u.y)).size,b.units.filter(u=>u.hp>0).length);
 }
});
test('Gengar punishes wounded targets and heals from actual damage dealt',()=>{
 const {E}=fixture();const run=weak=>{
  const {b,units:[a,t]}=battleFor(E,[[94,3,0,2,4],[133,1,1,2,3]]);if(weak)t.hp=3000;
  a.hp=a.maxHp*.2;const hp=a.hp,before=t.hp;E.cast(b,a,t);return {damage:before-t.hp,healed:a.hp-hp};
 };const weak=run(true),healthy=run(false);assert.ok(weak.damage>healthy.damage*1.7);assert.ok(weak.healed>0);assert.ok(weak.healed<=weak.damage*.25+1);
});
test('Gardevoir heals and shields exactly the two most wounded allies',()=>{
 const {E}=fixture();const {b,units:[a,t,x,y,z]}=battleFor(E,[[282,3,0,2,4],[133,1,1,2,3],[7,1,0,1,4],[172,1,0,3,4],[66,1,0,4,4]]);
 x.hp*=.1;y.hp*=.2;z.hp*=.7;const zHP=z.hp;E.cast(b,a,t);
 assert.ok(x.shield>0&&y.shield>0);assert.equal(z.shield,0);assert.equal(z.hp,zHP);assert.equal(a.shield,0);assert.ok(a.healingDone>0);
});
test('Kirlia cleanses burn, slow and stun from the most wounded ally',()=>{
 const {E}=fixture();const {b,units:[a,t,ally]}=battleFor(E,[[281,2,0,2,4],[133,1,1,2,3],[7,1,0,1,4]]);
 ally.hp*=.1;ally.burn={remaining:3};ally.slowUntil=9;ally.stunUntil=9;E.cast(b,a,t);
 assert.equal(ally.burn,null);assert.equal(ally.slowUntil,0);assert.equal(ally.stunUntil,0);
});
test('Metagross stuns the impact zone, shields itself and prevents stunned actions',()=>{
 const {E}=fixture();const {s,b,units:[a,t,near,far]}=battleFor(E,[[376,3,0,2,4],[133,1,1,2,3],[133,1,1,3,3],[133,1,1,5,5]]);
 E.cast(b,a,t);assert.equal(t.stunUntil,1);assert.equal(near.stunUntil,1);assert.equal(far.stunUntil,undefined);assert.ok(a.shield>0);
 t.cooldown=0;t.moveCD=0;const hp=a.hp,shield=a.shield;E.tick(s,.1);assert.equal(a.hp,hp);assert.equal(a.shield,shield);assert.equal(t.x,2);assert.equal(t.y,3);
});
test('ability descriptions change through each of the six signature families',()=>{
 const {E}=fixture();for(const family of [4,7,529,92,280,374]){
  const descriptions=[];for(let star=1;star<=3;star++){
   const u={dex:E.evolvedDex(family,star),star};const ability=E.abilityFor(u);assert.equal(ability.signature,true);assert.ok(ability.type);descriptions.push(ability.description);
  }assert.equal(new Set(descriptions).size,3);
 }
});
test('interest grants one per five saved gold, caps at five and uses pre-income gold',()=>{
 for(const [gold,interest] of [[0,0],[4,0],[5,1],[9,1],[10,2],[24,4],[25,5],[100,5]]){
  const {E,s}=fixture();s.gold=10;purchase(E,s,4);E.place(s,s.units[0].id,20);E.start(s);s.gold=gold;
  for(const foe of s.battle.units.filter(u=>u.side===1))foe.hp=0;
  E.tick(s,.1);assert.equal(s.result.interest,interest,'saved '+gold);
  assert.equal(s.gold,gold+6+interest);const paid=s.gold;E.tick(s,.1);assert.equal(s.gold,paid);
 }
});
test('shared four-beat rhythm attacks on 2/4 and moves on 1/3 only',()=>{
 const {E}=fixture();const {s,b,units:[a,t]}=battleFor(E,[[66,1,0,2,4],[133,1,1,2,3]]);
 a.cooldown=t.cooldown=0;a.hp=a.maxHp=10000;
 E.tick(s,.05);assert.equal(b.beat,1);assert.equal(b.events.filter(e=>e.kind==='hit').length,0);
 for(let i=0;i<10;i++)E.tick(s,.05);assert.equal(b.beat,2);
 const hits=b.events.filter(e=>e.kind==='hit');assert.equal(hits.length,2);assert.ok(hits.every(e=>e.beat===2));
 const hp=t.hp;for(let i=0;i<10;i++)E.tick(s,.05);assert.equal(b.beat,3);assert.equal(t.hp,hp);
 for(let i=0;i<10;i++)E.tick(s,.05);assert.equal(b.beat,4);assert.ok(t.hp<hp);
 for(let i=0;i<10;i++)E.tick(s,.05);assert.equal(b.beat,1);assert.equal(b.beatCount,5);
});
test('a unit advances at most one ordinary cell on a movement pulse and never between pulses',()=>{
 const {E}=fixture();const {s,b,units:[a,t]}=battleFor(E,[[66,1,0,2,5],[133,1,1,2,0]]);a.moveCD=0;
 E.tick(s,.05);assert.equal(a.y,4);const pos=a.x+','+a.y;
 for(let i=0;i<19;i++)E.tick(s,.05);assert.equal(a.x+','+a.y,pos);assert.equal(b.beat,2);
 E.tick(s,.05);assert.equal(b.beat,3);assert.equal(a.y,3);
});
test('attack-speed differences affect power and mana while both units strike on the same beat',()=>{
 const {E}=fixture();const {s,b,units:[a,t]}=battleFor(E,[[66,1,0,2,4],[66,1,1,2,3]]);
 a.cooldown=t.cooldown=0;a.hp=a.maxHp=10000;a.interval=.7;t.interval=1.4;
 for(let i=0;i<11;i++)E.tick(s,.05);
 assert.equal(b.beat,2);const hits=b.events.filter(e=>e.kind==='hit');assert.equal(hits.length,2);
 assert.ok(a.damageDone>t.damageDone*1.9);assert.ok(a.mana>t.mana);
});
test('Earthquake hits multiple enemies in radius but never allies or distant targets',()=>{
 const {E}=fixture();for(const dex of [28,76,260,208]){
  const rank=dex===208?2:3;const {b,units:[a,t,other,far,ally]}=battleFor(E,[[dex,rank,0,2,3],[133,1,1,2,2],[133,1,1,3,3],[133,1,1,5,0],[7,1,0,1,3]]);
  const allyHP=ally.hp;assert.equal(E.abilityFor(a).area,true);E.cast(b,a,t);
  assert.ok(t.hp<10000);assert.ok(other.hp<10000);assert.equal(far.hp,10000);assert.equal(ally.hp,allyHP);
  assert.ok(b.events.some(e=>e.kind==='area'&&e.type==='ground'&&e.radius===2));
 }
});
test('area Blizzard and Discharge damage clusters and report their real damage types',()=>{
 const {E}=fixture();for(const [dex,star,type] of [[365,3,'ice'],[180,2,'electric'],[959,3,'steel']]){
  const {b,units:[a,t,other]}=battleFor(E,[[dex,star,0,2,4],[133,1,1,2,3],[133,1,1,3,3]]);E.cast(b,a,t);
  assert.ok(t.hp<10000&&other.hp<10000);assert.ok(b.events.some(e=>e.kind==='area'&&e.type===type));
 }
});
test('round reports snapshot actual damage, healing and shield absorption without overkill',()=>{
 const {E}=fixture();const {s,b,units:[a,t]}=battleFor(E,[[94,3,0,2,4],[133,1,1,2,3]]);
 a.hp=a.maxHp*.2;t.hp=10;t.shield=20;E.cast(b,a,t);E.tick(s,.05);
 assert.equal(s.result.report.find(r=>r.id===a.id).damage,10);
 assert.equal(s.result.report.find(r=>r.id===t.id).blocked,20);
 assert.equal(s.result.report.find(r=>r.id===t.id).taken,10);
 const snapshot=JSON.stringify(s.history);a.damageDone=99999;t.hp=123;
 assert.equal(JSON.stringify(s.history),snapshot);assert.equal(E.report(s,'ally')[0].damage,10);
});
test('match reports aggregate the same family across evolving species and do not mutate rounds',()=>{
 const {E,s}=fixture();const row=(dex,star,damage)=>({id:1,dex,star,side:0,damage,healing:0,shielding:0,taken:0,blocked:0,kills:0});
 s.history=[{round:1,report:[row(4,1,10)]},{round:2,report:[row(5,2,20)]},{round:3,report:[row(6,3,30)]}];
 const before=JSON.stringify(s.history),rows=E.report(s,'match');assert.equal(rows.length,1);assert.equal(rows[0].damage,60);assert.equal(rows[0].dex,6);
 rows[0].damage=999;assert.equal(JSON.stringify(s.history),before);
});
test('complete rhythmic matches with signature/AOE units stay finite and collision-free',()=>{
 for(const seed of [9,71]){
  const {E,s}=fixture(seed);s.gold=10000;s.level=6;
  for(const [i,d] of [4,7,529,92,280,374].entries()){purchase(E,s,d,9);E.place(s,s.units.find(u=>u.dex===E.evolvedDex(d,3)).id,18+i);}
  while(s.phase==='planning'){
   assert.ok(E.start(s));for(let i=0;i<1000&&s.phase==='combat';i++){
    E.tick(s,.05);const alive=s.battle.units.filter(u=>u.hp>0);
    assert.equal(new Set(alive.map(u=>u.x+','+u.y)).size,alive.length);
    assert.ok(s.battle.units.every(u=>Number.isFinite(u.hp)&&Number.isFinite(u.mana)&&u.hp>=0&&u.hp<=u.maxHp));
   }
   assert.notEqual(s.phase,'combat');if(s.phase==='result')E.next(s);
  }
  assert.ok(['victory','defeat'].includes(s.phase));assert.ok(s.history.length>0&&s.history.length<=12);
  assert.ok(E.report(s,'match').every(r=>Number.isFinite(r.damage)&&r.damage>=0));
 }
});
test('residual visual effects expire after a round while reports and payments remain unchanged',()=>{
 const {E,s}=fixture();s.gold=10;purchase(E,s,4);E.place(s,s.units[0].id,20);E.start(s);
 for(const foe of s.battle.units.filter(u=>u.side===1))foe.hp=0;
 s.battle.events.push({kind:'cast',ttl:.6});E.tick(s,.05);const report=JSON.stringify(s.result),gold=s.gold;
 for(let i=0;i<20;i++)E.tick(s,.1);assert.equal(s.battle.events.length,0);assert.equal(JSON.stringify(s.result),report);assert.equal(s.gold,gold);
});
