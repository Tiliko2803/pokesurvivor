'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
function fixture(seed=123) {
  const G={};const ctx=vm.createContext({G,window:{G},console});
  for(const f of ['js/core/util.js','js/data/pokedex.js','js/data/sprites-meta.js','js/data/enemies.js','js/data/types.js','js/tft/engine.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
  const E=ctx.G.TFT,s=E.create(seed);return {G:ctx.G,E,s};
}
function purchase(E,s,dex,n=1) {for(let i=0;i<n;i++){s.shop=[dex];assert.ok(E.buy(s,0));}}
test('107 complete evolution families use local Pokédex and sprite assets',()=>{
  const {G,E}=fixture();assert.equal(E.ROSTER.length,107);
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
test('wave twelve continues while only zero life ends the expedition; income pays once',()=>{
 for(const life of [1,5]){const {E,s}=fixture();s.gold=100;s.round=12;s.life=life;
  purchase(E,s,1);E.place(s,s.units[0].id,35);E.start(s);s.battle.units.filter(u=>u.side===0).forEach(u=>u.hp=0);E.tick(s,.1);
  assert.equal(s.phase,life===1?'defeat':'result');const gold=s.gold;E.tick(s,.2);assert.equal(s.gold,gold);
  assert.equal(E.next(s),life!==1);if(life!==1)assert.equal(s.round,13);
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
 s.battle.opening=0;s.battle.units=[a,foe];a.x=2;a.y=3;foe.x=2;foe.y=2;foe.moveCD=99;foe.cooldown=99;
 E.tick(s,.05);assert.ok(Math.abs(a.x-foe.x)+Math.abs(a.y-foe.y)>1);
 assert.ok(a.x>=0&&a.x<6&&a.y>=0&&a.y<6);
});
test('guardian grants a capped shield to a vulnerable teammate',()=>{
 const {E,s}=fixture();s.gold=100;purchase(E,s,374,3);purchase(E,s,4);
 s.units.forEach((u,i)=>E.place(s,u.id,18+i));E.start(s);
 const a=s.battle.units.find(u=>u.dex===375),ally=s.battle.units.find(u=>u.side===0&&u!==a),foe=s.battle.units.find(u=>u.side===1);
 s.battle.opening=0;s.battle.units=[a,ally,foe];a.x=2;a.y=3;a.mana=100;a.cooldown=0;ally.x=3;ally.y=3;ally.hp=ally.maxHp*.1;
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
 const {E}=fixture();const deck=[1,7,172,66,37,54,529,63,258,661],s=E.create(99,deck);
 s.gold=10000;
 for(const level of [3,4,5,6]){s.level=level;for(let i=0;i<150;i++){
  assert.ok(E.reroll(s));assert.ok(s.shop.every(d=>deck.includes(d)));
 }}
 s.shop=[4];const gold=s.gold;assert.equal(E.buy(s,0),false);assert.equal(s.gold,gold);
 s.phase='result';E.next(s);assert.ok(s.shop.every(d=>deck.includes(d)));
});
test('decks without low-cost families still produce a playable cheapest shop',()=>{
 const {E}=fixture();const deck=E.PLAYABLE_ROSTER.filter(f=>f.cost>=3).slice(0,10).map(f=>f.dex);assert.equal(deck.length,10);
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
test('Haunter retains its execute bonus before evolving into ambush Gengar',()=>{
 const {E}=fixture();const run=weak=>{
  const {b,units:[a,t]}=battleFor(E,[[93,2,0,2,4],[133,1,1,2,3]]);if(weak)t.hp=3000;
  const before=t.hp;E.cast(b,a,t);return before-t.hp;
 };assert.ok(run(true)>run(false)*1.4);
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
test('interest grants one per five saved gold, has no five-gold cap and uses pre-income gold',()=>{
 for(const [gold,interest] of [[0,0],[4,0],[5,1],[9,1],[10,2],[24,4],[25,5],[50,10],[100,20],[1000,200]]){
  const {E,s}=fixture();s.gold=10;purchase(E,s,4);E.place(s,s.units[0].id,20);E.start(s);s.battle.opening=0;s.gold=gold;
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
  const {s,b,units:[a,t,other]}=battleFor(E,[[dex,star,0,2,4],[133,1,1,2,3],[133,1,1,3,3]]);E.cast(b,a,t);if(dex===959)reworkBeat(E,s);
  assert.ok(t.hp<10000&&other.hp<10000);assert.ok(b.events.some(e=>e.kind==='area'&&e.type===type));
 }
});
test('round reports snapshot actual damage and shield absorption without overkill',()=>{
 const {E}=fixture();const {s,b,units:[a,t]}=battleFor(E,[[93,2,0,2,4],[133,1,1,2,3]]);
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
  assert.equal(s.phase,'defeat');assert.ok(s.history.length>0&&s.history.length<=E.HISTORY_LIMIT);
  assert.ok(E.report(s,'match').every(r=>Number.isFinite(r.damage)&&r.damage>=0));
 }
});
test('residual visual effects expire after a round while reports and payments remain unchanged',()=>{
 const {E,s}=fixture();s.gold=10;purchase(E,s,4);E.place(s,s.units[0].id,20);E.start(s);
 for(const foe of s.battle.units.filter(u=>u.side===1))foe.hp=0;
 s.battle.opening=0;s.battle.events.push({kind:'cast',ttl:.6});E.tick(s,.05);const report=JSON.stringify(s.result),gold=s.gold;
 for(let i=0;i<20;i++)E.tick(s,.1);assert.equal(s.battle.events.length,0);assert.equal(JSON.stringify(s.result),report);assert.equal(s.gold,gold);
});

test('scouted opponents and formation match the coming fight without rerolling on inspection',()=>{
 const {E}=fixture(),s=E.create(2468,E.DEFAULT_DECK);const before=s.seed,foes=JSON.stringify(E.scout(s));
 E.scout(s)[0].dex=99999;assert.equal(JSON.stringify(E.scout(s)),foes);assert.equal(s.seed,before);
 s.shop=[4];E.buy(s,0);E.place(s,s.units[0].id,20);E.start(s);
 assert.equal(JSON.stringify(s.battle.units.filter(u=>u.side===1).map(({id,dex,star,pos,boss,elite})=>({id,dex,star,pos,boss,elite}))),foes);
 while(s.phase==='combat')E.tick(s,.1);if(s.phase==='result'){E.next(s);assert.equal(s.opponentRound,2);assert.notEqual(JSON.stringify(E.scout(s)),foes);}
});
test('entrances do not pause the rhythm or reapply when combat resumes',()=>{
 const {E}=fixture(),s=E.create(3,E.DEFAULT_DECK);s.gold=100;
 for(const d of [7,280,529]){s.shop=[d];E.buy(s,0);}s.units.forEach((u,i)=>E.place(s,u.id,18+i));
 s.opponent=[{id:-1,dex:133,star:1,pos:5}];s.opponentRound=1;
 const base=E.preview(s,s.units[0]);E.start(s);const a=s.battle.units.find(u=>u.dex===7);
 assert.ok(a.shield>=a.maxHp*.19);assert.ok(s.battle.events.some(e=>e.kind==='entrance'));
 for(let i=0;i<3;i++)E.tick(s,.1);assert.ok(s.battle.time>.29);assert.equal(s.battle.beat,1);assert.ok(s.battle.opening>0,'banner remains visible while units act');
 const saved=E.restore(E.serialize(s));assert.ok(saved);assert.equal(saved.battle.units[0].shield,a.shield);assert.equal(saved.battle.opening,s.battle.opening);
 for(let i=0;i<3;i++){E.tick(saved,.1);E.tick(s,.1);}assert.equal(saved.battle.units[0].shield,a.shield);assert.equal(saved.battle.time,s.battle.time);
 assert.ok(base.shield===0);
});
test('all roster families expose an entrance; twelve families have distinct evolving moves',()=>{
 const {E}=fixture();for(const f of E.ROSTER)assert.ok(E.entranceFor({dex:f.dex,star:1}).description);
 for(const d of [1,4,7,172,66,152,63,255,529,92,280,374])for(let star=1;star<=3;star++)assert.equal(E.abilityFor({dex:E.evolvedDex(d,star),star}).signature,true);
});
test('new signature moves drain actual HP, chain enemies, break shields, cleanse and expire buffs',()=>{
 const {E}=fixture();
 {const {b,units:[a,t]}=battleFor(E,[[1,1,0,2,3],[7,1,1,2,2]]);a.hp=a.maxHp/2;const hp=a.hp;E.cast(b,a,t);assert.ok(a.hp>hp);assert.ok(a.healingDone<=a.damageDone*.5+1);}
 {const {b,units:[a,t,other,ally]}=battleFor(E,[[26,3,0,2,3],[7,1,1,2,2],[7,1,1,3,2],[7,1,0,3,3]]);const hp=ally.hp;E.cast(b,a,t);assert.ok(other.hp<other.maxHp);assert.equal(ally.hp,hp);assert.ok(t.stunUntil>0);}
 {const {s,b,units:[a,t]}=battleFor(E,[[68,3,0,2,3],[7,1,1,2,2]]);t.shield=1000;const armor=a.armor;E.cast(b,a,t);assert.equal(t.shield,0);assert.equal(a.armor,armor-10);a.cooldown=99;t.cooldown=99;for(let i=0;i<42;i++)E.tick(s,.05);assert.equal(a.armor,armor);}
 {const {b,units:[a,t,ally]}=battleFor(E,[[154,3,0,2,3],[7,1,1,2,2],[7,1,0,3,3]]);ally.hp/=2;ally.burn={};ally.stunUntil=10;E.cast(b,a,t);assert.equal(ally.burn,null);assert.equal(ally.stunUntil,0);assert.ok(ally.hp>ally.maxHp/2);}
 {const {s,b,units:[a,t]}=battleFor(E,[[257,3,0,2,3],[7,1,1,2,2]]);const interval=a.interval;E.cast(b,a,t);assert.ok(a.interval<interval);a.cooldown=99;t.cooldown=99;t.hp=100000;t.maxHp=100000;for(let i=0;i<42;i++)E.tick(s,.05);assert.ok(Math.abs(a.interval-interval)<1e-9);}
});
test('save/resume preserves shop, formation, RNG, economy and combat outcome without duplicate income',()=>{
 const {E}=fixture(),s=E.create(12345,E.DEFAULT_DECK);s.shop=[4,7];E.buy(s,0);E.buy(s,1);s.units.forEach((u,i)=>E.place(s,u.id,18+i));s.locked=true;
 const planning=E.restore(E.serialize(s));assert.ok(planning);assert.equal(E.serialize(planning),E.serialize(s));
 E.start(s);for(let i=0;i<45;i++)E.tick(s,.1);const restored=E.restore(E.serialize(s));assert.ok(restored);
 while(s.phase==='combat')E.tick(s,.1);while(restored.phase==='combat')E.tick(restored,.1);
 assert.equal(JSON.stringify(restored.result),JSON.stringify(s.result));assert.equal(restored.gold,s.gold);
 const result=E.restore(E.serialize(s));assert.ok(result);E.tick(result,.1);assert.equal(result.gold,s.gold);assert.equal(JSON.stringify(result.history),JSON.stringify(s.history));
});
test('invalid, incompatible and incomplete snapshots are rejected safely',()=>{
 const {E}=fixture(),s=E.create(5,E.DEFAULT_DECK);const data=JSON.parse(E.serialize(s));
 for(const raw of [null,'{','x'.repeat(300001),JSON.stringify({...data,version:999})])assert.equal(E.restore(raw),null);
 for(const change of [s=>s.gold=-1,s=>s.deck=[4],s=>s.units=[{id:1,dex:9999,star:1,pos:20}],s=>s.opponent=null,s=>s.history=[{round:1,report:[{dex:4}]}],s=>s.phase='combat']){
 const copy=JSON.parse(JSON.stringify(data));change(copy.state);assert.equal(E.restore(JSON.stringify(copy)),null);
 }
});

test('all 107 families have explicit entrances and executable moves at all 321 bronze ranks',()=>{
 const {E}=fixture(),names=new Set();
 for(const family of E.ROSTER){
  const entry=E.entranceFor({dex:family.dex,star:1});names.add(entry.name);
  assert.ok(!['Guardia Inicial','Aura de Apoyo','Concentración','Determinación'].includes(entry.name));
  for(let star=1;star<=3;star++){
   const dex=E.evolvedDex(family.dex,star),ability=E.abilityFor({dex,star});assert.equal(ability.signature,true);assert.ok(ability.description.length>20);
   const {b,units:[a,t,other,ally]}=battleFor(E,[[dex,star,0,2,3],[133,1,1,2,2],[133,1,1,3,2],[7,1,0,3,3]]);
   a.hp=a.maxHp/2;ally.hp=ally.maxHp/3;const allyHP=ally.hp;a.mana=100;
   E.cast(b,a,t);
   assert.ok(a.damageDone+a.healingDone+a.shieldingDone>0||a.populationPulse===0||a.ambushPending||a.hammerX!==undefined||a.bulletPulses||a.leafPulse===0||b.waves?.some(w=>w.source===a.id),`${family.dex} rank ${star} has a real effect`);
   assert.ok(ally.hp>=allyHP,'never damages its ally');assert.ok(b.units.every(u=>Number.isFinite(u.hp)&&u.hp>=0&&u.hp<=u.maxHp&&Number.isFinite(u.mana)));
   assert.ok(a.mana>=0&&a.mana<=100);assert.ok(a.shield<=a.maxHp*.5);
   assert.ok(b.events.filter(e=>e.kind==='spell').every(e=>e.type===ability.type),`${family.dex} uses the advertised damage type`);
  }
 }
 assert.equal(names.size,107,'each family has its own named entrance');
});
test('iconic moves protect the correct allies, ignore armor and strengthen against wounded targets',()=>{
 const {E}=fixture();
 {const {b,units:[a,t,ally]}=battleFor(E,[[384,3,0,2,3],[133,1,1,2,2],[7,1,0,3,3]]);E.cast(b,a,t);assert.ok(ally.shield>0);assert.ok(t.stunUntil>0);assert.equal(t.shield,0);}
 {const {b,units:[a,t,ally]}=battleFor(E,[[260,3,0,2,3],[133,1,1,2,2],[7,1,0,3,3]]);E.cast(b,a,t);assert.ok(t.slowUntil>0);assert.ok(ally.shield>0);assert.equal(ally.slowUntil,undefined);}
 {const {b,units:[a,t,ally]}=battleFor(E,[[131,3,0,2,3],[133,1,1,2,2],[7,1,0,3,3]]);E.cast(b,a,t);assert.ok(ally.shield>0);assert.ok(t.slowPower===.25);}
 {const damage=hp=>{const {b,units:[a,t]}=battleFor(E,[[448,3,0,2,3],[133,1,1,2,2]]);t.hp=hp;t.armor=100;E.cast(b,a,t);assert.equal(a.pierce,0);assert.ok(a.shield>0);return a.damageDone;};assert.ok(damage(4000)>damage(10000));}
 {const {b,units:[a,t]}=battleFor(E,[[958,2,0,2,3],[133,1,1,2,2]]);t.shield=1000;E.cast(b,a,t);assert.ok(t.shield<=500);assert.ok(t.shield>=0);}
 {const {s,b,units:[a,t]}=battleFor(E,[[373,3,0,2,3],[133,1,1,2,2]]);const initial=a.interval;E.cast(b,a,t);const boosted=a.interval;E.cast(b,a,t);assert.equal(a.interval,boosted,'refresh cannot stack permanent speed');for(let i=0;i<42;i++)E.tick(s,.05);assert.ok(Math.abs(a.interval-initial)<1e-9);}
});
test('new support moves cleanse, share mana, drain actual HP and never spend a heal as an attack',()=>{
 const {E}=fixture();
 {const {b,units:[a,t,ally]}=battleFor(E,[[242,3,0,2,3],[133,1,1,2,2],[7,1,0,3,3]]);ally.hp/=2;ally.burn={};ally.stunUntil=10;const hp=t.hp;E.cast(b,a,t);assert.equal(t.hp,hp);assert.equal(ally.burn,null);assert.equal(ally.stunUntil,0);assert.ok(ally.hp>ally.maxHp/2);}
 {const {b,units:[a,t,ally]}=battleFor(E,[[134,3,0,2,3],[133,1,1,2,2],[7,1,0,3,3]]);ally.hp/=2;ally.mana=95;E.cast(b,a,t);assert.equal(ally.mana,100);}
 {const {b,units:[a,t,ally]}=battleFor(E,[[272,3,0,2,3],[133,1,1,2,2],[7,1,0,3,3]]);a.hp/=2;ally.hp/=2;t.hp=10;E.cast(b,a,t);assert.equal(a.damageDone,10);assert.ok(a.healingDone<=a.damageDone*.6+2);}
 {const {b,units:[a,t]}=battleFor(E,[[14,2,0,2,3],[133,1,1,2,2]]);const hp=t.hp;E.cast(b,a,t);assert.equal(t.hp,hp);assert.equal(a.mana,15);assert.ok(a.shield>0);}
});
test('new buffs and statuses survive a save and keep the same combat outcome',()=>{
 const {E}=fixture(),deck=[133,447,131,246,258,661,371,957,270,440],s=E.create(222,deck);s.gold=1000;s.level=6;
 for(const [i,d] of [133,447,131,258,371,957].entries()){
  for(let n=0;n<9;n++){s.shop=[d];E.buy(s,0);}E.place(s,s.units.find(u=>E.BY[u.dex].line[0]===d).id,18+i);
 }
 E.start(s);s.battle.opening=0;for(const a of s.battle.units.filter(u=>u.side===0))E.cast(s.battle,a,s.battle.units.find(u=>u.side===1));
 const restored=E.restore(E.serialize(s));assert.ok(restored);
 while(s.phase==='combat')E.tick(s,.1);while(restored.phase==='combat')E.tick(restored,.1);
 assert.equal(JSON.stringify(restored.result),JSON.stringify(s.result));
});

function seismicMatch(E,star=2) {
 const s=E.create(444,E.DEFAULT_DECK);s.gold=1000;
 for(let i=0;i<3**(star-1);i++){s.shop=[529];E.buy(s,0);}
 const a=s.units[0];E.place(s,a.id,20);s.shop=[7];E.buy(s,0);E.place(s,s.units.find(u=>u.dex===7).id,21);
 s.opponent=[{id:-1,dex:133,star:1,pos:8},{id:-2,dex:133,star:1,pos:9},{id:-3,dex:133,star:1,pos:5}];s.opponentRound=s.round;
 E.start(s);return s;
}
test('Excadrill opens once with a safe drill and area stun before the first beat',()=>{
 const {E}=fixture();for(const star of [2,3]){
  const s=seismicMatch(E,star),b=s.battle,a=b.units.find(u=>u.dex===530),ally=b.units.find(u=>u.dex===7),near=b.units.find(u=>u.id===-1),diagonal=b.units.find(u=>u.id===-2),far=b.units.find(u=>u.id===-3);
  assert.equal(b.beat,0);assert.equal(b.time,0);assert.equal(a.y,0);assert.equal(a.x,2);
  assert.ok(near.hp<near.maxHp);assert.equal(near.stunUntil,star===3?.8:.6);
  assert.equal(!!diagonal.stunUntil,star===3);assert.equal(far.hp,far.maxHp);assert.equal(far.stunUntil,undefined);
  assert.equal(ally.hp,ally.maxHp);assert.equal(ally.stunUntil,undefined);assert.equal(a.mana,0,'entrance does not spend or fill mana');
  assert.equal(new Set(b.units.filter(u=>u.hp>0).map(u=>u.x+','+u.y)).size,b.units.filter(u=>u.hp>0).length);
  const hp=near.hp,allyPosition=ally.x+','+ally.y;E.tick(s,.05);assert.ok(b.time>0);assert.ok(b.opening>0);assert.notEqual(ally.x+','+ally.y,allyPosition,'unstunned ally moves while entry banner is still visible');assert.equal(near.hp,hp);
  const restored=E.restore(E.serialize(s));assert.ok(restored);assert.equal(restored.battle.units.find(u=>u.id===-1).hp,hp);assert.equal(restored.battle.units.find(u=>u.id===-1).stunUntil,near.stunUntil);
  for(let i=0;i<10;i++)E.tick(s,.05);
  assert.ok(!b.events.some(e=>e.kind==='hit'&&e.from===near.id),'stunned unit cannot attack on the first attack beat');
 }
});
test('Drilbur has a smaller stationary opener and allied blockers stop Excadrill entry',()=>{
 const {E}=fixture();
 {const s=E.create(555,E.DEFAULT_DECK);s.shop=[529];E.buy(s,0);E.place(s,s.units[0].id,18);s.opponent=[{id:-1,dex:133,star:1,pos:12}];s.opponentRound=1;E.start(s);const [a,t]=s.battle.units;assert.equal(a.y,3);assert.equal(t.stunUntil,.5);assert.ok(t.hp<t.maxHp);}
 {const s=E.create(555,E.DEFAULT_DECK);s.gold=100;for(let i=0;i<3;i++){s.shop=[529];E.buy(s,0);}E.place(s,s.units[0].id,24);s.shop=[7];E.buy(s,0);E.place(s,s.units.find(u=>u.dex===7).id,18);s.opponent=[{id:-1,dex:133,star:1,pos:6}];s.opponentRound=1;E.start(s);const a=s.battle.units.find(u=>u.dex===530),t=s.battle.units.find(u=>u.side===1);assert.equal(a.y,4);assert.equal(a.damageDone,0,'blocked Excadrill deals no entry damage; Squirtle may still attack');assert.equal(t.stunUntil,undefined);}
});
test('Excadrill mana move stuns the landing area and overlapping stuns never add duration',()=>{
 const {E}=fixture();for(const star of [2,3]){
  const {s,b,units:[a,t,other,ally]}=battleFor(E,[[530,star,0,2,3],[133,1,1,2,1],[133,1,1,3,1],[7,1,0,4,3]]);
  const allyHP=ally.hp;a.mana=100;E.cast(b,a,t);assert.equal(a.mana,0);assert.equal(t.stunUntil,star===3?.8:.6);assert.equal(ally.hp,allyHP);assert.equal(ally.stunUntil,undefined);
  t.stunUntil=5;ally.x=2;ally.y=2;E.cast(b,a,t);assert.equal(t.stunUntil,5,'a shorter CC cannot extend an existing longer stun');
 }
});

test('burn events identify periodic damage for animation without recasting the source',()=>{
 const {E}=fixture(),{s,b,units:[a,t]}=battleFor(E,[[4,1,0,2,3],[133,1,1,2,2]]);
 E.cast(b,a,t);for(let i=0;i<21;i++)E.tick(s,.05);
 const dot=b.events.find(e=>e.periodic);assert.ok(dot);assert.equal(dot.from,a.id);assert.equal(dot.to,t.id);assert.equal(dot.type,'fire');assert.equal(dot.move,'Ascuas');
 assert.equal(b.events.filter(e=>e.kind==='cast').length,0,'burn has no extra cast event');
});

function entryMatch(E,family,star=1) {
 const deck=E.DEFAULT_DECK.slice();if(!deck.includes(family))deck[9]=family;
 const s=E.create(555,deck);s.gold=1000;
 for(let i=0;i<3**(star-1);i++){s.shop=[family];E.buy(s,0);}E.place(s,s.units[0].id,20);
 s.shop=[1];E.buy(s,0);E.place(s,s.units.find(u=>u.id!==s.units[0].id).id,21);
 s.opponent=[{id:-1,dex:133,star:1,pos:8},{id:-2,dex:133,star:1,pos:9},{id:-3,dex:133,star:1,pos:5}];s.opponentRound=1;
 E.start(s);return s;
}
test('nine more families have real active entrance effects at every rank without spending mana',()=>{
 const {E}=fixture();
 for(const family of [4,7,172,92,280,374,131,246,258])for(let star=1;star<=3;star++){
  const s=entryMatch(E,family,star),b=s.battle,a=b.units.find(u=>E.BY[u.dex].line[0]===family),ally=b.units.find(u=>u.side===a.side&&u!==a),foes=b.units.filter(u=>u.side!==a.side);
  assert.equal(E.entranceFor(a).active,true);assert.ok(b.events.some(e=>e.kind==='entryCast'&&e.from===a.id),family+' rank '+star);
  assert.equal(ally.hp,ally.maxHp);assert.equal(ally.stunUntil,undefined);assert.equal(ally.burn,undefined);
  if([280,131].includes(family)){assert.ok(a.shieldingDone>0);assert.ok(ally.shield>0);}
  else assert.ok(a.damageDone>0,family+' entrance damages enemies');
  if([172,374].includes(family))assert.ok(foes.some(u=>E.isStunned(b,u)&&u.stunSource===a.id));
  if([92,246,258].includes(family))assert.ok(foes.some(u=>u.slowUntil>0));
  if(family===4)assert.ok(foes.some(u=>u.burn));
  assert.equal(a.mana,family===172?25:0,'entrance keeps mana granted by passive and spends none');
  const live=b.units.filter(u=>u.hp>0);assert.equal(new Set(live.map(u=>u.x+','+u.y)).size,live.length);
 }
});
test('entrance attacks respect range and never reach across the whole board',()=>{
 const {E}=fixture();for(const family of [4,7,172,92,374,246,258]){
  const deck=E.DEFAULT_DECK.slice();if(!deck.includes(family))deck[9]=family;
  const s=E.create(444,deck);s.gold=100;s.shop=[family];E.buy(s,0);E.place(s,s.units[0].id,35);s.opponent=[{id:-1,dex:133,star:1,pos:0}];s.opponentRound=1;E.start(s);
  const a=s.battle.units.find(u=>u.side===0),t=s.battle.units.find(u=>u.side===1);assert.equal(t.hp,t.maxHp);assert.equal(t.stunUntil,undefined);assert.equal(a.damageDone,0);
 }
});
test('CC boundary rejects caster and allied targets; enemy CC expires while allies act',()=>{
 const {E}=fixture(),{s,b,units:[a,t,ally]}=battleFor(E,[[530,3,0,2,3],[133,1,1,2,2],[7,1,0,3,3]]);
 const before=JSON.stringify(ally),events=b.events.length;assert.equal(E.stun(b,a,a,1),false);assert.equal(E.stun(b,a,ally,1),false);assert.equal(JSON.stringify(ally),before);assert.equal(b.events.length,events);
 assert.equal(E.stun(b,a,t,.8),true);assert.equal(E.isStunned(b,t),true);assert.equal(t.stunSource,a.id);assert.equal(E.isStunned(b,ally),false);
 for(let i=0;i<17;i++)E.tick(s,.05);assert.equal(E.isStunned(b,t),false);
});
test('a stun interrupts an enemy already queued to attack in the same pulse',()=>{
 const {E}=fixture(),{s,b,units:[a,t]}=battleFor(E,[[172,1,0,2,3],[66,1,1,2,2]]);
 a.mana=100;a.cooldown=t.cooldown=0;b.beatCount=1;b.beat=1;b.nextBeat=.05;
 E.tick(s,.05);assert.equal(b.beat,2);assert.ok(E.isStunned(b,t));assert.equal(t.damageDone,0,'target cannot execute an already queued strike after being stunned');assert.ok(a.damageDone>0);
});
test('an enemy Excadrill stuns our units but never its own teammates',()=>{
 const {E}=fixture(),s=E.create(333,E.DEFAULT_DECK);s.shop=[1];E.buy(s,0);E.place(s,s.units[0].id,20);
 s.opponent=[{id:-1,dex:530,star:3,pos:8},{id:-2,dex:133,star:1,pos:9}];s.opponentRound=1;E.start(s);
 const b=s.battle,player=b.units.find(u=>u.side===0),caster=b.units.find(u=>u.id===-1),enemyMate=b.units.find(u=>u.id===-2);
 assert.equal(E.isStunned(b,caster),false);assert.equal(E.isStunned(b,enemyMate),false);assert.ok(E.isStunned(b,player));assert.equal(player.stunSource,-1);
});
test('active entry effects and CC resume without repeating damage, shields or control duration',()=>{
 const {E}=fixture();for(const family of [4,7,172,92,280,374,131,246,258]){
  const s=entryMatch(E,family,2);E.tick(s,.1);const saved=E.restore(E.serialize(s));assert.ok(saved,family);
  const state=u=>({id:u.id,hp:u.hp,shield:u.shield,mana:u.mana,stunUntil:u.stunUntil,burn:u.burn});
  assert.equal(JSON.stringify(saved.battle.units.map(state)),JSON.stringify(s.battle.units.map(state)));
  while(s.phase==='combat')E.tick(s,.1);while(saved.phase==='combat')E.tick(saved,.1);
  assert.equal(JSON.stringify(saved.result),JSON.stringify(s.result),family+' result is unchanged by resume');
 }
});

const SECOND_WAVE=[32,173,58,60,298,285,498,650,810,821,653,728,813,816,906,909,912,215,446,304,479,597,607,679,884];
const EXPANSION_LINES=[129,147,155,158,252,349,387,390,393,443,495,501,633,656,704,722,725,782,885,996,661,...SECOND_WAVE];
test('forty-six expansion families evolve, execute friendly-safe entrances and resume all ranks',()=>{
 const {E}=fixture();
 for(const family of EXPANSION_LINES)for(let star=1;star<=3;star++){
  const s=entryMatch(E,family,star),b=s.battle,a=b.units.find(u=>E.BY[u.dex].line[0]===family),ally=b.units.find(u=>u.side===a.side&&u!==a);
  assert.equal(a.dex,E.evolvedDex(family,star));assert.equal(a.star,star);
  assert.equal(ally.hp,ally.maxHp);assert.equal(ally.stunUntil,undefined);assert.equal(ally.slowUntil,undefined);assert.equal(ally.burn,undefined);
  assert.ok(a.damageDone+a.shieldingDone>0||family===661&&ally.boostUntil>0,`${family}/${star}: actual opener effect`);
  assert.ok(b.units.every(u=>Number.isFinite(u.hp)&&Number.isFinite(u.interval)));
  if(family!==129||star!==1){assert.ok(E.entranceFor(a).active);assert.equal(b.events.filter(e=>e.kind==='entryCast'&&e.from===a.id).length,1);}
  const restored=E.restore(E.serialize(s));assert.ok(restored,`${family}/${star}: valid saved fight`);
  for(let i=0;i<100;i++){E.tick(s,.05);E.tick(restored,.05);}
  const normalize=state=>JSON.stringify(state,(key,value)=>key==='entrance'?undefined:value);
  assert.equal(normalize(s),normalize(restored),`${family}/${star}: deterministic restore`);
 }
});
test('Gyarados gains intimidation on evolution and shares its non-stacking cap with Salamence and Incineroar',()=>{
 const {E}=fixture();
 const make=(extra=false)=>{
  const s=E.create(17);s.units=[{id:1,dex:130,star:2,pos:20}];
  if(extra)s.units.push({id:2,dex:373,star:3,pos:21},{id:3,dex:727,star:3,pos:22});
  s.opponent=[{id:-1,dex:133,star:1,pos:0}];s.opponentRound=1;E.start(s);return s;
 };
 const single=make(),stack=make(true);assert.equal(single.battle.units.find(u=>u.side===1).attack,stack.battle.units.find(u=>u.side===1).attack);
 const weak=entryMatch(E,129,1),fish=weak.battle.units.find(u=>u.dex===129);assert.equal(fish.damageDone,0);assert.ok(fish.shield>0);assert.equal(E.entranceFor(fish).active,undefined);
 const evolved=entryMatch(E,129,2),gyarados=evolved.battle.units.find(u=>u.dex===130);assert.ok(gyarados.damageDone>0);assert.equal(E.entranceFor(gyarados).name,'Mirada Intimidante');
});
test('expanded opening tactics respect range and support shields stay on their own team',()=>{
 const {E}=fixture();
 for(const family of EXPANSION_LINES){
  const s=E.create(7);s.units=[{id:1,dex:E.evolvedDex(family,3),star:3,pos:35},{id:2,dex:1,star:1,pos:34}];
  s.opponent=[{id:-1,dex:133,star:1,pos:0}];s.opponentRound=1;E.start(s);
  const a=s.battle.units[0],foe=s.battle.units.find(u=>u.side===1);assert.equal(a.damageDone,0,'no cross-board opening '+family);assert.equal(foe.shield,0);assert.equal(foe.stunUntil,undefined);
 }
});
test('all expansion families complete fights at each rank without collisions, invalid HP or duplicate income',()=>{
 const {E}=fixture();
 for(const family of EXPANSION_LINES)for(let star=1;star<=3;star++){
  const s=entryMatch(E,family,star);
  for(let i=0;i<1000&&s.phase==='combat';i++){
   E.tick(s,.05);const live=s.battle.units.filter(u=>u.hp>0);assert.equal(new Set(live.map(u=>u.x+','+u.y)).size,live.length);
   assert.ok(s.battle.units.every(u=>Number.isFinite(u.hp)&&u.hp>=0&&u.hp<=u.maxHp&&u.shield<=u.maxHp*.5+.0001));
  }
  assert.notEqual(s.phase,'combat',`${family}/${star} finishes`);const gold=s.gold;E.tick(s,.1);assert.equal(s.gold,gold);
 }
});

test('second wave adds 25 unique families with 10/8/5/2 costs and every regional starter',()=>{
 const {E}=fixture(),costs={};assert.equal(new Set(E.ROSTER.flatMap(f=>Array.from(f.line))).size,E.ROSTER.reduce((n,f)=>n+f.line.length,0),'no overlapping evolution families');
 for(const d of SECOND_WAVE){assert.ok(E.BY[d]);const c=E.BY[d].cost;costs[c]=(costs[c]||0)+1;}
 assert.deepEqual(costs,{1:10,2:8,3:5,4:2});
 for(const starter of [1,4,7,152,155,158,252,255,258,387,390,393,495,498,501,650,653,656,722,725,728,810,813,816,906,909,912])assert.ok(E.ROSTER.some(f=>f.dex===starter),'starter '+starter);
 const cheap=SECOND_WAVE.filter(d=>E.BY[d].cost===1),s=E.create(17,cheap);
 for(let i=0;i<30;i++){E.reroll(s,true);assert.ok(s.shop.every(d=>cheap.includes(d)&&E.BY[d].cost===1));}
 s.gold=10;for(const d of cheap.slice(0,8))purchase(E,s,d);s.shop=[cheap[8]];assert.equal(E.buy(s,0),false);assert.equal(s.units.length,8,'bench still caps capacity');assert.equal(s.gold,2);
});
test('Ferrothorn reflects only HP lost to adjacent basics, with no reflection chains or special counters',()=>{
 const {E}=fixture();assert.equal(entryMatch(E,597,3).battle.units.find(u=>u.dex===598).thorns,.2);
 for(const [gap,shielded] of [[1,false],[2,false],[1,true]]){
  const {s,b,units:[a,t]}=battleFor(E,[[66,1,0,2,3],[598,3,1,2,3-gap]]);
  a.hp=a.maxHp=10000;a.cooldown=0;a.range=3;a.thorns=.2;t.thorns=.2;t.shield=shielded?10000:0;b.beatCount=1;b.nextBeat=.05;
  E.tick(s,.05);const reflected=b.events.filter(e=>e.from===t.id&&e.periodic);
  assert.equal(reflected.length,gap===1&&!shielded?1:0);
  if(reflected.length){assert.equal(reflected[0].type,'steel');assert.ok(a.hp<a.maxHp);assert.ok(t.damageDone>0);}
 }
 const {b,units:[a,t]}=battleFor(E,[[66,1,0,2,3],[598,3,1,2,2]]);t.thorns=.2;const hp=a.hp;E.cast(b,a,t);assert.equal(a.hp,hp);assert.equal(b.events.filter(e=>e.periodic).length,0);
});
test('a basic attacker defeated by contact reflection cannot cast after its death',()=>{
 const {E}=fixture(),{s,b,units:[a,t]}=battleFor(E,[[66,1,0,2,3],[598,3,1,2,2]]);
 a.hp=1;a.mana=99;a.cooldown=0;t.thorns=.2;b.beatCount=1;b.nextBeat=.05;
 E.tick(s,.05);assert.equal(a.hp,0);assert.equal(b.events.filter(e=>e.kind==='cast'&&e.from===a.id).length,0);
});
test('Snorlax Rest heals and cleanses itself even when another ally is more injured',()=>{
 const {E}=fixture(),{b,units:[a,t,ally]}=battleFor(E,[[143,3,0,2,3],[133,1,1,2,2],[1,1,0,3,3]]);
 a.hp=a.maxHp*.3;ally.hp=1;for(const u of [a,ally]){u.burn={remaining:2};u.stunUntil=2;u.slowUntil=2;}
 const hp=a.hp;E.cast(b,a,t);assert.ok(a.hp>hp);assert.equal(a.burn,null);assert.equal(a.stunUntil,0);assert.equal(a.slowUntil,0);assert.equal(ally.hp,1);assert.ok(ally.burn);assert.equal(ally.stunUntil,2);
});

test('Talonflame full-health priority wins attack order for either side, disables when hurt and returns after healing',()=>{
 const {E}=fixture();
 for(const side of [0,1])for(const healthy of [true,false]){
  const {s,b,units:[foe,bird]}=battleFor(E,[[66,1,1-side,2,2],[663,3,side,2,3]]);
  bird.galeWings=true;bird.hp=bird.maxHp-(healthy?0:1);bird.cooldown=foe.cooldown=0;b.beatCount=1;b.nextBeat=.05;
  assert.equal(E.hasAttackPriority(bird),healthy);E.tick(s,.05);
  const hits=b.events.filter(e=>e.kind==='hit');assert.equal(hits[0].from,healthy?bird.id:foe.id);assert.equal(hits.find(e=>e.from===bird.id).type,'flying');
  bird.hp=bird.maxHp;assert.equal(E.hasAttackPriority(bird),true);bird.hp=0;assert.equal(E.hasAttackPriority(bird),false);
 }
});
test('Alas Vendaval does not bypass range, stun or the shared attack beats',()=>{
 const {E}=fixture();
 for(const mode of ['move','range','stun']){
  const {s,b,units:[foe,bird]}=battleFor(E,[[66,1,1,2,mode==='range'?0:2],[663,3,0,2,3]]);
  bird.galeWings=true;bird.cooldown=0;bird.range=1;bird.moveCD=0;b.beatCount=mode==='move'?0:1;b.nextBeat=.05;if(mode==='stun')bird.stunUntil=1;
  E.tick(s,.05);assert.equal(b.events.filter(e=>e.from===bird.id&&(e.kind==='hit'||e.kind==='cast')).length,0,mode);
 }
});
test('Viento Afin boosts allies only, does not stack and expires; every family rank uses Flying basic damage',()=>{
 const {E}=fixture();
 for(let star=1;star<=3;star++){
  const s=entryMatch(E,661,star),b=s.battle,bird=b.units.find(u=>E.BY[u.dex].line[0]===661),ally=b.units.find(u=>u.side===0&&u!==bird),foe=b.units.find(u=>u.side===1);
  assert.equal(bird.galeWings,true);assert.equal(bird.basicType,'flying');assert.ok(E.hasAttackPriority(bird));
  assert.equal(ally.boostPower,[.08,.12,.16][star-1]);assert.equal(foe.boostPower,undefined);assert.equal(bird.mana,0);assert.equal(bird.damageDone,0);
  const base=E.preview(s,s.units.find(u=>u.id===ally.id)).interval;assert.ok(Math.abs(ally.interval-base/(1+ally.boostPower))<1e-9);
  for(const u of b.units)u.cooldown=u.moveCD=99;for(let i=0;i<42;i++)E.tick(s,.05);assert.ok(Math.abs(ally.interval-base)<1e-9);
 }
 const s=E.create(10);s.units=[{id:1,dex:661,star:1,pos:20},{id:2,dex:663,star:3,pos:21},{id:3,dex:1,star:1,pos:22}];s.opponent=[{id:-1,dex:133,star:1,pos:0}];s.opponentRound=1;E.start(s);
 const ally=s.battle.units.find(u=>u.id===3);assert.equal(ally.boostPower,.16);const base=E.preview(s,s.units[2]).interval;assert.ok(Math.abs(ally.interval-base/1.16)<1e-9);
});

test('endless PvE generates themed encounters, specials and rotating bosses past wave twelve with six enemies maximum',()=>{
 const {E,G}=fixture(),s=E.create(771,E.DEFAULT_DECK);s.gold=100;purchase(E,s,4);E.place(s,s.units[0].id,35);
 const bosses=new Set(),names=new Set();
 for(let wave=1;wave<=120;wave++){
  assert.equal(s.round,wave);assert.ok(E.start(s));const foes=s.battle.units.filter(u=>u.side===1),scout=E.scout(s);names.add(E.waveInfo(wave).name);
  assert.ok(foes.length>=(wave%10===0?1:2)&&foes.length<=6);if(wave%10===0)assert.equal(foes.length,1);assert.equal(new Set(scout.map(u=>u.pos)).size,scout.length);
  assert.ok(scout.filter(u=>E.BY[u.dex].role==='healer'||E.aiFor(u.dex)==='healer').length<=1);
  assert.equal(foes.some(u=>u.boss),wave%10===0);assert.equal(E.waveInfo(wave).kind,wave%10===0?'boss':wave%5===0?'elite':'normal');
  if(wave%10===0){const boss=foes.find(u=>u.boss);bosses.add(boss.dex);assert.ok(G.DEX_BY[boss.dex]);assert.ok(boss.maxHp>E.preview({...s,opponent:scout}, {...scout.find(u=>u.boss),boss:false}).maxHp*2.9);}
  for(const u of s.battle.units)u.hp=u.side===1?0:u.maxHp;
  E.tick(s,.05);assert.equal(s.phase,'result');assert.equal(s.life,5);const paid=s.gold;E.tick(s,.1);assert.equal(s.gold,paid);
  const saved=E.restore(E.serialize(s));assert.ok(saved,'restores wave '+wave);assert.equal(saved.round,wave);assert.ok(E.next(s));
 }
 assert.equal(bosses.size,6);assert.ok(names.size>6);assert.equal(s.completed,120);assert.equal(s.history.length,E.HISTORY_LIMIT);assert.equal(s.wins,120);assert.ok(s.totals.length>0);
});
test('legendary families are excluded from decks and shops and older ten-line decks migrate without duplicates',()=>{
 const {E}=fixture();assert.equal(E.PLAYABLE_ROSTER.length,106);assert.equal(E.PLAYABLE_ROSTER.some(f=>f.dex===384),false);
 const old=[1,4,7,172,92,280,529,246,374,384];assert.equal(E.validDeck(old),false);const deck=E.migrateDeck(old);assert.ok(E.validDeck(deck));assert.equal(deck.includes(384),false);assert.equal(new Set(deck).size,10);
 const s=E.create(35,deck);s.gold=100000;s.level=6;
 for(let i=0;i<100;i++){E.reroll(s,true);assert.ok(s.shop.every(d=>!E.BY[d].bossOnly));}
 for(const dex of [144,145,146,382,383,384]){s.shop=[dex];const gold=s.gold;assert.equal(E.buy(s,0),false);assert.equal(s.gold,gold);}
});
test('version-one victory can continue to wave thirteen and legendary copies refund once during migration',()=>{
 const {E}=fixture(),s=E.create(81,E.DEFAULT_DECK);s.gold=100;purchase(E,s,4);E.place(s,s.units[0].id,20);s.round=12;s.opponentRound=0;E.start(s);
 for(const u of s.battle.units)u.hp=u.side===1?0:u.maxHp;E.tick(s,.05);
 const old=JSON.parse(E.serialize(s));old.version=1;old.state.phase='victory';old.state.deck[9]=384;old.state.units.push({id:old.state.nextId++,dex:384,star:2,pos:null});
 delete old.state.totals;delete old.state.completed;delete old.state.recordId;
 const gold=old.state.gold,resumed=E.restore(JSON.stringify(old));assert.ok(resumed);assert.equal(resumed.phase,'result');assert.equal(resumed.units.some(u=>u.dex===384),false);assert.equal(resumed.gold,gold+15);assert.ok(E.validDeck(resumed.deck));
 const twice=E.restore(E.serialize(resumed));assert.equal(twice.gold,resumed.gold);assert.ok(E.next(twice));assert.equal(twice.round,13);assert.equal(twice.phase,'planning');
});
test('old active fights safely return to preparation and bosses resist CC without immunity',()=>{
 const {E}=fixture(),s=entryMatch(E,661,2),old=JSON.parse(E.serialize(s));old.version=1;old.state.deck[9]=384;
 // Keep the purchased family in the legacy deck while replacing another slot.
 old.state.deck[8]=661;const loaded=E.restore(JSON.stringify(old));assert.ok(loaded);assert.equal(loaded.phase,'planning');assert.equal(loaded.battle,null);assert.equal(loaded.gold,s.gold);
 const {b,units:[a,t]}=battleFor(E,[[530,3,0,2,3],[144,2,1,2,2]]);t.boss=true;assert.ok(E.stun(b,a,t,1));assert.equal(t.stunUntil,.5);assert.equal(E.stun(b,t,t,1),false);
});
test('late losses stay recoverable and bounded reports retain full expedition totals',()=>{
 const {E}=fixture(),s=E.create(1,E.DEFAULT_DECK);s.gold=100;purchase(E,s,4);E.place(s,s.units[0].id,35);s.round=1000;s.opponentRound=0;E.start(s);
 for(const u of s.battle.units)if(u.side===0)u.hp=0;E.tick(s,.05);assert.equal(s.life,4);assert.equal(s.phase,'result');assert.ok(E.restore(E.serialize(s)));
 const a=E.create(61,E.DEFAULT_DECK);a.gold=100;purchase(E,a,4);E.place(a,a.units[0].id,20);
 for(let i=0;i<35;i++){E.start(a);const hero=a.battle.units.find(u=>u.side===0);hero.hp=hero.maxHp;hero.damageDone=10;for(const u of a.battle.units)if(u.side===1)u.hp=0;E.tick(a,.05);E.next(a);}
 assert.equal(a.history.length,20);assert.equal(E.report(a,'match')[0].damage,350);const restored=E.restore(E.serialize(a));assert.ok(restored);assert.equal(E.report(restored,'match')[0].damage,350);
});

test('every legendary boss has executable ranked moves and active boss fights resume deterministically',()=>{
 const {E}=fixture();
 for(const f of E.BOSS_DEFINITIONS)for(let star=1;star<=3;star++){
  const {b,units:[a,t,ally]}=battleFor(E,[[f.dex,star,1,2,2],[4,3,0,2,3],[7,1,1,3,2]]);a.hp=a.maxHp*.5;ally.hp=ally.maxHp*.5;E.cast(b,a,t);
  assert.ok(a.damageDone+a.healingDone+a.shieldingDone>0);assert.ok(b.units.every(u=>Number.isFinite(u.hp)&&u.hp>=0&&u.hp<=u.maxHp));
 }
 const s=E.create(98,E.DEFAULT_DECK);s.gold=1000;s.level=6;s.round=40;s.opponentRound=0;
 for(const [i,d]of [4,7,529,280,661,374].entries()){purchase(E,s,d,9);E.place(s,s.units.find(u=>E.BY[u.dex].line[0]===d).id,18+i);}
 E.start(s);for(let i=0;i<10;i++)E.tick(s,.05);const restored=E.restore(E.serialize(s));assert.ok(restored);assert.ok(restored.battle.units.some(u=>u.boss&&u.dex===382));
 while(s.phase==='combat')E.tick(s,.05);while(restored.phase==='combat')E.tick(restored,.05);assert.equal(JSON.stringify(restored.result),JSON.stringify(s.result));
});

test('wave balance caps tank roles and tank AI across seeds without removing healer limits',()=>{
 const {E}=fixture();
 for(let seed=1;seed<=20;seed++){
  const s=E.create(seed);
  for(let wave=1;wave<=120;wave++){
   const enemies=E.scout(s);
   assert.ok(enemies.filter(u=>E.BY[u.dex].role==='tank'||['tank','guardian'].includes(E.aiFor(u.dex))).length<=2,`tank cap seed ${seed} wave ${wave}`);
   assert.ok(enemies.filter(u=>E.BY[u.dex].role==='healer'||E.aiFor(u.dex)==='healer').length<=1);
   if(wave<25&&wave%10)assert.ok(enemies.every(u=>u.star<3));
   if(wave===24)assert.ok(enemies.every(u=>u.star===2));
   if(wave===25)assert.equal(enemies.filter(u=>u.star===3).length,1);
   s.phase='result';assert.ok(E.next(s));
  }
 }
});
test('enemy durability and damage grow separately, tanks lose enemy damage only',()=>{
 const {E,s}=fixture();s.round=24;
 for(const dex of [4,7]){
  const ally={id:1,dex,star:1,pos:20},enemy={...ally,id:-1,pos:7};s.units=[ally];s.opponent=[enemy];
  const a=E.preview(s,ally),b=E.preview(s,enemy);
  assert.ok(Math.abs(b.maxHp/a.maxHp-1.575)<1e-9);
  const tank=E.BY[dex].role==='tank'||['tank','guardian'].includes(E.aiFor(dex));
  assert.ok(Math.abs(b.attack/a.attack-1.345*(tank?.8:1))<1e-9);
 }
});
test('older planning saves rebalance once while active fights keep exact state',()=>{
 const {E}=fixture(),s=E.create(123,E.DEFAULT_DECK);s.gold=100;purchase(E,s,4);E.place(s,s.units[0].id,35);
 delete s.balanceVersion;const restored=E.restore(E.serialize(s));assert.ok(restored);assert.equal(restored.balanceVersion,2);
 const seed=restored.seed,foes=JSON.stringify(E.scout(restored)),again=E.restore(E.serialize(restored));assert.equal(again.seed,seed);assert.equal(JSON.stringify(E.scout(again)),foes);
 assert.ok(E.start(s));delete s.balanceVersion;const battle=JSON.stringify(s.battle.units.map(({entrance,...u})=>u)),active=E.restore(E.serialize(s));assert.ok(active);assert.equal(active.phase,'combat');assert.equal(JSON.stringify(active.battle.units),battle);
});

test('training spans nine ranks in 42 copies, preserves identity and refunds partial training',()=>{
 const {E}=fixture(),s=E.create(41,E.DEFAULT_DECK);s.gold=1000;purchase(E,s,4);const id=s.units[0].id;E.place(s,id,20);purchase(E,s,4,8);
 const u=s.units[0];assert.equal(E.rankLabel(u),'Bronce ★★★');const base=E.preview(s,u);
 for(let i=0;i<6;i++){
  purchase(E,s,4,E.TRAINING_COSTS[i]-1);assert.equal(E.rank(u),3+i);assert.equal(E.unitCopies(u),9+E.TRAINING_COSTS.slice(0,i+1).reduce((a,b)=>a+b,0)-1);
  const raw=E.serialize(s);assert.ok(E.restore(raw));purchase(E,s,4);
  assert.equal(E.rank(u),4+i);assert.equal(u.id,id);assert.equal(u.pos,20);assert.equal(u.dex,6);assert.equal(E.moveFor(u),'Llamarada');
  assert.ok(Math.abs(E.preview(s,u).attack/base.attack-1.18**(i+1))<1e-8);
 }
 assert.equal(E.rankLabel(u),'Oro ★★★');assert.equal(E.unitCopies(u),42);assert.equal(s.gold,958);s.shop=[4];assert.equal(E.buy(s,0),false);assert.equal(s.gold,958);
 assert.ok(E.sell(s,id));assert.equal(s.gold,1000);
 purchase(E,s,4,11);assert.equal(E.unitCopies(s.units[0]),11);E.sell(s,s.units[0].id);assert.equal(s.gold,1000);
});
test('training works on a full bench and upgraded fights and reports restore safely',()=>{
 const {E}=fixture(),s=E.create(42,E.DEFAULT_DECK);s.gold=1000;purchase(E,s,4,9);E.place(s,s.units[0].id,20);
 for(const dex of [1,7,172,92,280,529,246,374])purchase(E,s,dex);
 purchase(E,s,4,3);assert.equal(s.units.length,9);assert.equal(s.units[0].promotion,1);assert.ok(E.start(s));
 const restored=E.restore(E.serialize(s));assert.ok(restored);assert.equal(restored.battle.units.find(u=>u.id===s.units[0].id).promotion,1);
 for(const foe of s.battle.units.filter(u=>u.side===1))foe.hp=0;E.tick(s,.1);
 assert.equal(E.report(s)[0].promotion,1);assert.ok(E.restore(E.serialize(s)));assert.equal(E.report(s,'match')[0].promotion,1);
 const bad=JSON.parse(E.serialize(s));bad.state.units[0].promotion=7;assert.equal(E.restore(JSON.stringify(bad)),null);
});
test('shops keep at most two copies, three families when possible and exclude completed gold',()=>{
 const {E}=fixture(),s=E.create(43,E.DEFAULT_DECK);s.gold=100000;
 for(let i=0;i<1000;i++){
  assert.ok(E.reroll(s));const counts=new Map();for(const d of s.shop)counts.set(d,(counts.get(d)||0)+1);
  assert.ok([...counts.values()].every(n=>n<=2));assert.ok(counts.size>=3);
 }
 purchase(E,s,4,42);for(let i=0;i<20;i++){E.reroll(s);assert.equal(s.shop.includes(4),false);}
 s.units=s.deck.map((d,i)=>({id:i+1,dex:E.evolvedDex(d,3),star:3,promotion:6,pos:null}));
 const gold=s.gold;assert.equal(E.reroll(s),false);assert.equal(s.gold,gold);assert.ok(E.reroll(s,true));assert.ok(s.shop.every(d=>d===null));
 s.units.pop();assert.ok(E.reroll(s));assert.equal(s.shop.filter(Boolean).length,2);
});
test('later waves pay growing base income and boss loot alongside uncapped interest',()=>{
 const {E}=fixture();
 for(const [wave,base,loot] of [[1,5,0],[6,6,0],[24,9,0],[25,9,4],[30,10,16],[100,20,30]]){
  const s=E.create(wave,E.DEFAULT_DECK);s.round=wave;s.opponentRound=0;s.gold=1000;purchase(E,s,4);E.place(s,s.units[0].id,20);E.start(s);s.gold=100;for(const ally of s.battle.units.filter(u=>u.side===0))ally.hp=ally.maxHp;
  for(const foe of s.battle.units.filter(u=>u.side===1))foe.hp=0;E.tick(s,.1);
  assert.equal(s.result.baseIncome,base);assert.equal(s.result.encounterBonus,loot);assert.equal(s.result.interest,20);assert.equal(s.gold,100+base+loot+21);assert.ok(E.restore(E.serialize(s)));
 }
});

test('boss introductions freeze combat and entry effects, save mid-sequence and skip exactly once',()=>{
 const {E}=fixture(),s=E.create(117,E.DEFAULT_DECK);s.gold=100;purchase(E,s,4);E.place(s,s.units[0].id,20);s.round=10;s.opponentRound=0;
 assert.ok(E.start(s,{presentation:true}));assert.equal(s.battle.intro,2.8);assert.equal(s.battle.events.length,0);const units=JSON.stringify(s.battle.units);
 for(let i=0;i<10;i++)E.tick(s,.05);
 assert.equal(s.battle.time,0);assert.equal(s.battle.beatCount,0);assert.equal(JSON.stringify(s.battle.units),units);
 const restored=E.restore(E.serialize(s));assert.ok(restored);assert.equal(restored.battle.intro,s.battle.intro);
 assert.ok(E.skipIntro(s));const after=JSON.stringify(s.battle.units);assert.equal(E.skipIntro(s),false);assert.equal(JSON.stringify(s.battle.units),after);
 assert.ok(s.battle.events.some(e=>e.kind==='entrance'));
 while(restored.battle.intro>0)E.tick(restored,.05);
 assert.equal(restored.battle.time,0);assert.equal(JSON.stringify(restored.battle.units),after);
 E.tick(s,.05);E.tick(restored,.05);assert.equal(JSON.stringify(restored.battle.units),JSON.stringify(s.battle.units));
 const bad=JSON.parse(E.serialize(s));bad.state.battle.intro=3;assert.equal(E.restore(JSON.stringify(bad)),null);
 const plain=E.create(118,E.DEFAULT_DECK);plain.gold=100;purchase(E,plain,4);E.place(plain,plain.units[0].id,20);E.start(plain,{presentation:true});assert.equal(plain.battle.intro,0);assert.ok(plain.battle.events.length>0);
});

test('saved boss preparation loses escorts once and an ongoing boss fight remains intact',()=>{
 const {E}=fixture(),s=E.create(187,E.DEFAULT_DECK);s.round=9;s.phase='result';E.next(s);s.balanceVersion=1;
 s.opponent.push({id:-2,dex:4,star:1,pos:9,boss:false,elite:false});
 const loaded=E.restore(E.serialize(s));assert.ok(loaded);assert.equal(loaded.opponent.length,1);assert.ok(loaded.opponent[0].boss);assert.equal(loaded.opponent[0].pos,8);
 const again=E.restore(E.serialize(loaded));assert.equal(again.seed,loaded.seed);assert.equal(JSON.stringify(again.opponent),JSON.stringify(loaded.opponent));
 s.gold=100;purchase(E,s,4);E.place(s,s.units[0].id,20);E.start(s);const active=E.restore(E.serialize(s));assert.ok(active);assert.equal(active.battle.units.filter(u=>u.side===1).length,2);
});

test('five trainer lives lose exactly one per defeat including timeout and legacy HP migrates once',()=>{
 const {E}=fixture(),s=E.create(888,E.DEFAULT_DECK);s.gold=100;purchase(E,s,4);E.place(s,s.units[0].id,20);assert.equal(s.life,5);
 for(let i=0;i<5;i++){assert.ok(E.start(s));if(i===2){for(const u of s.battle.units){u.hp=u.maxHp;u.attack=0;u.regen=0;u.moveCD=999;}s.battle.time=44.99;s.battle.nextBeat=999;}else for(const u of s.battle.units.filter(u=>u.side===0))u.hp=0;
  E.tick(s,.05);assert.equal(s.life,4-i);assert.equal(s.phase,i===4?'defeat':'result');assert.equal(E.next(s),i<4);
 }
 for(const [hp,lives] of [[50,5],[41,5],[24,3],[1,1],[0,0]]){const a=E.create(89,E.DEFAULT_DECK);a.life=hp;const payload=JSON.parse(E.serialize(a));payload.version=2;payload.state.rankOwner='owner';payload.state.rankRules=1;const restored=E.restore(JSON.stringify(payload));assert.ok(restored);assert.equal(restored.life,lives);assert.equal(restored.rankOwner,undefined);assert.equal(E.restore(E.serialize(restored)).life,lives);}
});

const NEW_COMPETITIVE_FAMILIES=[10,41,79,187,214,227,307,322,302,406,403,449,532,546,595,677,690,701,747,761,736,856,859,924,935];
test('third expansion adds 25 unique families across nine generations with ten one-gold options',()=>{
 const {E}=fixture();const rows=NEW_COMPETITIVE_FAMILIES.map(d=>E.ROSTER.find(f=>f.dex===d));assert.ok(rows.every(Boolean));assert.equal(new Set(rows.flatMap(f=>f.line)).size,rows.flatMap(f=>f.line).length);
 assert.deepEqual([1,2,3,4].map(c=>rows.filter(f=>f.cost===c).length),[10,9,5,1]);assert.equal(rows.filter(f=>f.role==='healer').length,5);assert.equal(rows.filter(f=>f.role==='tank').length,4);
 const limits=[151,251,386,493,649,721,809,905,1025],gens=rows.map(f=>limits.findIndex(n=>f.dex<=n));assert.deepEqual(limits.map((_,i)=>gens.filter(g=>g===i).length),[3,3,3,3,3,3,3,2,2]);
 for(const f of rows){assert.equal(f.bossOnly,false);for(let star=1;star<=3;star++){const u={dex:E.evolvedDex(f.dex,star),star};assert.ok(E.entranceFor(u).active);assert.ok(E.abilityFor(u).description.length>20);}}
});
test('all new families execute friendly-safe entrances, finish fights and restore at each bronze rank',()=>{
 const {E}=fixture();
 for(const family of [...NEW_COMPETITIVE_FAMILIES,610,696])for(let star=1;star<=3;star++){
  const deck=E.DEFAULT_DECK.includes(family)?E.DEFAULT_DECK:[family,...E.DEFAULT_DECK.slice(1)],s=E.create(family*10+star,deck);s.gold=1000;purchase(E,s,family,3**(star-1));const hero=s.units[0];E.place(s,hero.id,20);s.opponent=[{id:-1,dex:661,star:1,pos:8}];s.opponentRound=s.round;
  assert.ok(E.start(s));assert.ok(E.restore(E.serialize(s)),`${family}/${star} saves entry`);
  const own=s.battle.units.filter(u=>u.side===0);assert.ok(own.every(u=>u.hp===u.maxHp),'entry never damages allies');
  while(s.phase==='combat')E.tick(s,.1);assert.notEqual(s.phase,'combat');assert.ok(E.restore(E.serialize(s)),`${family}/${star} saves result`);
  for(const u of s.battle.units)assert.ok(Number.isFinite(u.hp)&&u.hp>=0&&u.hp<=u.maxHp);
 }
});
test('Ceruledge Bitter Blade and other self-drains heal only the user from effective HP damage',()=>{
 const {E}=fixture(),{b,units:[a,t,ally]}=battleFor(E,[[937,3,0,2,2],[7,1,1,2,3],[1,1,0,1,2]]);a.hp=a.maxHp*.1;ally.hp=ally.maxHp*.1;t.hp=30;t.shield=0;const before=a.hp,other=ally.hp;E.cast(b,a,t);
 assert.equal(a.damageDone,30);assert.ok(Math.abs(a.hp-before-15)<1e-8);assert.equal(ally.hp,other);assert.equal(a.healingDone,15);
 const full=battleFor(E,[[937,3,0,2,2],[7,1,1,2,3]]);full.units[0].hp=full.units[0].maxHp*.1;full.units[1].shield=10000;E.cast(full.b,full.units[0],full.units[1]);assert.equal(full.units[0].healingDone,0);
});

function reworkBeat(E,s,beat=2){const b=s.battle;b.beatCount=beat-1;b.nextBeat=b.time+.05;E.tick(s,.05);}
test('Maushold chains 3/3/4 hits on attack pulses, retargets a defeated victim and earns no attacking mana',()=>{
 const {E}=fixture(),{s,b,units:[a,t,other,ally]}=battleFor(E,[[925,3,0,2,3],[133,1,1,2,2],[133,1,1,3,3],[7,1,0,1,3]]);
 t.hp=1;const allyHP=ally.hp;E.cast(b,a,t);assert.equal(a.damageDone,0);
 for(let i=0;i<3;i++){b.events=[];reworkBeat(E,s);assert.equal(b.events.filter(e=>e.mouse!==undefined).length,[3,3,4][i]);assert.equal(a.mana,0);}
 assert.equal(t.hp,0);assert.ok(other.hp<other.maxHp);assert.equal(ally.hp,allyHP);assert.equal(a.populationPulse,undefined);
});
test('Maushold loses a stunned pulse and an out-of-range pulse without delaying the chain',()=>{
 const {E}=fixture(),{s,b,units:[a,t]}=battleFor(E,[[925,3,0,2,3],[133,1,1,2,2]]);
 E.cast(b,a,t);a.stunUntil=1;reworkBeat(E,s);assert.equal(a.damageDone,0);assert.equal(a.populationPulse,1);
 a.stunUntil=0;t.y=0;reworkBeat(E,s);assert.equal(a.damageDone,0);assert.equal(a.populationPulse,2);
 t.y=2;reworkBeat(E,s);assert.equal(b.events.filter(e=>e.mouse!==undefined).length,4);assert.equal(a.populationPulse,undefined);
});
test('Aegislash shields then consumes half remaining protection in a distinct attack pulse; stun delays blade',()=>{
 const {E}=fixture(),{s,b,units:[a,t]}=battleFor(E,[[681,3,0,2,3],[133,1,1,2,2]]);
 const hp=t.hp;E.cast(b,a,t);assert.equal(t.hp,hp);assert.equal(a.bladePending,true);const shield=a.shield;
 a.stunUntil=1;reworkBeat(E,s);assert.equal(a.shield,shield);assert.equal(a.bladePending,true);
 a.stunUntil=0;reworkBeat(E,s);assert.equal(a.shield,shield/2);assert.ok(t.hp<hp);assert.equal(a.bladePending,undefined);
 assert.equal(a.mana,0);assert.ok(b.events.some(e=>e.move==='Forma Filo'));
});
test('Talonflame flies to the rear without overlapping and damages only landing enemies; recoil cannot kill',()=>{
 const {E}=fixture(),{b,units:[a,front,rear,ally]}=battleFor(E,[[663,3,0,2,5],[133,1,1,2,4],[133,1,1,2,0],[7,1,0,1,0]]);
 const hp=front.hp,allyHP=ally.hp;a.hp=1;E.cast(b,a,front);
 assert.equal(a.hp,1);assert.equal(front.hp,hp);assert.ok(rear.hp<rear.maxHp);assert.equal(ally.hp,allyHP);
 assert.ok(Math.abs(a.x-rear.x)+Math.abs(a.y-rear.y)===1);
 const alive=b.units.filter(u=>u.hp>0);assert.equal(new Set(alive.map(u=>u.y*6+u.x)).size,alive.length);assert.ok(b.events.some(e=>e.kind==='flight'));
});
test('Greninja advances two legal steps on movement beats while Frogadier advances one; attacks do not move',()=>{
 for(const [dex,star,steps] of [[658,3,2],[657,2,1]]){
  const {E}=fixture(),{s,units:[a,t]}=battleFor(E,[[dex,star,0,2,5],[133,1,1,2,0]]);a.moveCD=0;
  reworkBeat(E,s,1);assert.equal(a.y,5-steps);const y=a.y;reworkBeat(E,s,2);assert.equal(a.y,y);
 }
 const {E}=fixture(),{s,b,units:[a]}=battleFor(E,[[658,3,0,2,5],[133,1,1,2,0],[7,1,0,2,4]]);a.moveCD=0;reworkBeat(E,s,1);
 assert.ok(a.x!==2||a.y!==4);const alive=b.units.filter(u=>u.hp>0);assert.equal(new Set(alive.map(u=>u.y*6+u.x)).size,alive.length);
});
test('mid-chain Maushold and shielded Aegislash restore deterministically and reject invalid action counters',()=>{
 const {E}=fixture();
 for(const dex of [925,681]){
  const family=E.BY[dex].line[0],deck=[family,...E.DEFAULT_DECK.filter(d=>d!==family)].slice(0,10),s=E.create(92,deck);
  s.units=[{id:1,dex,star:3,pos:20}];s.nextId=2;s.opponent=[{id:-1,dex:133,star:1,pos:14}];s.opponentRound=s.round;E.start(s);
  const a=s.battle.units[0],t=s.battle.units[1];t.hp=t.maxHp=100000;E.cast(s.battle,a,t);
  const saved=E.serialize(s),restored=E.restore(saved);assert.ok(restored,`${dex}: restores pending action`);
  for(let i=0;i<70;i++){E.tick(s,.05);E.tick(restored,.05);}
  const normalize=b=>JSON.stringify(b.units.map(u=>{const x={...u};delete x.entrance;return x;}));
  assert.equal(normalize(s.battle),normalize(restored.battle));
  const bad=JSON.parse(saved);bad.state.battle.units[0].populationPulse=999;assert.equal(E.restore(JSON.stringify(bad)),null);
 }
});

test('Gengar hides on movement, is untargetable, then ambushes the weakest available victim on an attack beat',()=>{
 const {E}=fixture(),{s,b,units:[a,front,weak,ally]}=battleFor(E,[[94,3,0,2,4],[7,1,1,2,3],[7,1,1,4,0],[7,1,0,1,4]]);
 weak.hp=1;E.cast(b,a,front);assert.equal(a.damageDone,0);reworkBeat(E,s,1);assert.equal(a.shadowed,true);
 assert.notEqual(E.selectTarget(b,front)?.id,a.id);const hp=a.hp;E.cast(b,front,a);assert.equal(a.hp,hp);assert.equal(E.stun(b,front,a,1),false);
 reworkBeat(E,s,2);assert.equal(a.shadowed,undefined);assert.equal(a.ambushPending,undefined);assert.equal(weak.hp,0);assert.equal(a.mana,50);
 assert.equal(Math.abs(a.x-weak.x)+Math.abs(a.y-weak.y),1);assert.equal(ally.damageTaken,0);
 const live=b.units.filter(u=>u.hp>0);assert.equal(new Set(live.map(u=>u.y*6+u.x)).size,live.length);
});
test('stunning Gengar before hiding cancels the ambush without granting invulnerability',()=>{
 const {E}=fixture(),{s,b,units:[a,t]}=battleFor(E,[[94,3,0,2,3],[7,1,1,2,2]]);
 E.cast(b,a,t);E.stun(b,t,a,2);reworkBeat(E,s,1);assert.equal(a.shadowed,undefined);assert.equal(a.ambushPending,undefined);assert.equal(a.damageDone,0);
});
test('Gardevoir rescues one nearby ally to a legal rear cell at 1 HP and shields it, then cannot rescue twice',()=>{
 const {E}=fixture(),{b,units:[g,foe,ally]}=battleFor(E,[[282,3,0,2,3],[93,2,1,2,1],[7,1,0,2,2]]);
 foe.attack=100000;ally.hp=20;E.cast(b,foe,ally);
 assert.equal(g.rescueUsed,true);assert.equal(ally.hp,1);assert.ok(ally.y>g.y);assert.ok(ally.shield>0);assert.equal(foe.kills,0);assert.equal(foe.damageDone,19);assert.ok(g.shieldingDone>0);
 assert.ok(b.events.some(e=>e.kind==='rescue'));E.cast(b,foe,ally);assert.equal(ally.hp,0);assert.equal(foe.kills,1);
});
test('Rescue requires another ally, range, an available Gardevoir and a free rear cell on both sides',()=>{
 for(const mode of ['self','range','stunned','no-space','enemy']){
  const {E}=fixture(),{b,units:[g,foe,ally]}=battleFor(E,[[282,3,0,2,3],[93,2,1,2,1],[7,1,0,2,2]]);foe.attack=100000;ally.hp=20;
  if(mode==='range'){g.x=5;g.y=5;}
  if(mode==='stunned')g.stunUntil=1;
  if(mode==='no-space')g.y=5;
  if(mode==='enemy')g.side=1;
  const victim=mode==='self'?g:ally;E.cast(b,foe,victim);assert.equal(victim.hp,0,mode);assert.equal(g.rescueUsed,undefined,mode);
 }
 const {E}=fixture(),{b,units:[g,foe,ally]}=battleFor(E,[[282,3,1,2,2],[93,2,0,2,4],[7,1,1,2,3]]);foe.attack=100000;ally.hp=20;E.cast(b,foe,ally);assert.equal(ally.hp,1);assert.ok(ally.y<g.y);
});
test('Tinkaton telegraphs a fixed area, destroys only enemy shields, then loses one attack beat recovering',()=>{
 const {E}=fixture(),{s,b,units:[a,t,near,ally]}=battleFor(E,[[959,3,0,2,3],[7,1,1,2,2],[7,1,1,3,2],[7,1,0,1,2]]);
 t.shield=near.shield=1000;ally.shield=100;const allyHP=ally.hp;E.cast(b,a,t);assert.equal(a.damageDone,0);assert.ok(b.events.some(e=>e.kind==='warning'));
 t.x=5;t.y=0;a.moveCD=0;reworkBeat(E,s,1);assert.equal(a.y,3);reworkBeat(E,s,2);
 assert.equal(t.hp,t.maxHp);assert.equal(t.shield,1000);assert.equal(near.shield,0);assert.ok(near.hp<near.maxHp);assert.equal(ally.hp,allyHP);assert.equal(ally.shield,100);assert.equal(a.hammerRecovery,true);
 a.cooldown=0;const damage=a.damageDone;reworkBeat(E,s,4);assert.equal(a.damageDone,damage);assert.equal(a.hammerRecovery,undefined);
});
test('stunning Tinkaton interrupts preparation and never damages the telegraphed zone',()=>{
 const {E}=fixture(),{s,b,units:[a,t]}=battleFor(E,[[959,3,0,2,3],[7,1,1,2,2]]);E.cast(b,a,t);E.stun(b,t,a,1);reworkBeat(E,s);assert.equal(a.hammerX,undefined);assert.equal(a.hammerY,undefined);assert.equal(a.hammerRecovery,undefined);assert.equal(a.damageDone,0);
});
test('Scizor executes six explicitly weak Steel hits boosted by Technician and earns no attacking mana',()=>{
 for(const star of [2,3]){
  const {E}=fixture(),{s,b,units:[a,t]}=battleFor(E,[[212,star,0,2,3],[7,1,1,2,2]]);t.armor=0;a.interval=1;a.attack=100;t.types=['normal'];
  E.cast(b,a,t);assert.equal(a.damageDone,0);assert.ok(E.hasAttackPriority(a));
  for(let i=0;i<3;i++)reworkBeat(E,s);
  assert.equal(a.damageDone,540);assert.equal(a.mana,0);assert.equal(a.bulletPulses,undefined);assert.equal(E.hasAttackPriority(a),false);assert.equal(E.moveFor(a),'Puño Bala');
  assert.equal(b.events.filter(e=>e.bullet!==undefined).length,6);
 }
});
test('Scizor priority can defeat a foe before its attack, but cannot bypass stun or range',()=>{
 const {E}=fixture(),{s,b,units:[foe,a]}=battleFor(E,[[7,1,1,2,2],[212,3,0,2,3]]);foe.hp=1;foe.cooldown=0;E.cast(b,a,foe);const hp=a.hp;reworkBeat(E,s);assert.equal(foe.hp,0);assert.equal(a.hp,hp);assert.equal(foe.damageDone,0);
 for(const mode of ['stun','range']){
  const {E}=fixture(),{s,b,units:[a,t]}=battleFor(E,[[212,3,0,2,3],[7,1,1,2,2]]);E.cast(b,a,t);
  if(mode==='stun')a.stunUntil=1;else t.y=0;
  reworkBeat(E,s);assert.equal(a.damageDone,0,mode);assert.equal(a.bulletPulses,2,mode);
 }
});
test('second-wave tactical states restore without resetting actions and reject invalid pending fields',()=>{
 const {E}=fixture();
 for(const dex of [94,212,959]){
  const family=E.BY[dex].line[0],deck=[family,...E.DEFAULT_DECK.filter(d=>d!==family)].slice(0,10),s=E.create(72,deck);
  s.units=[{id:1,dex,star:3,pos:20}];s.nextId=2;s.opponent=[{id:-1,dex:7,star:1,pos:14}];s.opponentRound=1;E.start(s);const [a,t]=s.battle.units;t.hp=t.maxHp=100000;E.cast(s.battle,a,t);if(dex===94)reworkBeat(E,s,1);
  const saved=E.serialize(s),restored=E.restore(saved);assert.ok(restored,`${dex} restores`);
  for(let i=0;i<70;i++){E.tick(s,.05);E.tick(restored,.05);}
  const normalize=b=>JSON.stringify(b.units.map(u=>{const x={...u};delete x.entrance;return x;}));assert.equal(normalize(s.battle),normalize(restored.battle));
  const invalid=JSON.parse(saved);invalid.state.battle.units[0].bulletPulses=9;assert.equal(E.restore(JSON.stringify(invalid)),null);
 }
});
test('saving after a Gardevoir rescue preserves its spent charge and prevents a second rescue after reload',()=>{
 const {E}=fixture(),deck=[280,...E.DEFAULT_DECK.filter(d=>d!==280)].slice(0,10),s=E.create(41,deck);
 s.units=[{id:1,dex:282,star:3,pos:20},{id:2,dex:7,star:1,pos:19}];s.nextId=3;s.opponent=[{id:-1,dex:93,star:2,pos:13}];s.opponentRound=1;E.start(s);
 const [g,ally,foe]=s.battle.units;foe.attack=100000;ally.hp=20;E.cast(s.battle,foe,ally);assert.equal(ally.hp,1);
 const r=E.restore(E.serialize(s));assert.ok(r);assert.equal(r.battle.units[0].rescueUsed,true);E.cast(r.battle,r.battle.units[2],r.battle.units[1]);assert.equal(r.battle.units[1].hp,0);
});

test('Heracross throws an adjacent enemy behind itself at all stages without moving allies or bosses',()=>{
 for(let star=1;star<=3;star++){
  const {E}=fixture(),{b,units:[a,t]}=battleFor(E,[[214,star,0,2,3],[7,1,1,2,2]]);E.cast(b,a,t);
  assert.ok(t.hp<t.maxHp);assert.equal(t.x,2);assert.equal(t.y,4);assert.equal(a.y,3);assert.ok(b.events.some(e=>e.kind==='throw'));assert.equal(E.moveFor(a),'Llave de Relevo');
 }
 for(const mode of ['boss','occupied','edge','range','ally']){
  const {E}=fixture(),{b,units:[a,t,ally]}=battleFor(E,[[214,3,0,2,3],[7,1,1,2,2],[7,1,0,1,4]]);
  if(mode==='boss')t.boss=true;if(mode==='occupied')ally.x=2;if(mode==='edge'){a.y=5;t.y=4;}if(mode==='range')t.y=0;if(mode==='ally')t.side=0;
  const x=t.x,y=t.y,hp=t.hp;E.cast(b,a,t);assert.equal(t.x,x,mode);assert.equal(t.y,y,mode);assert.equal(b.events.some(e=>e.kind==='throw'),false,mode);
  if(['range','ally'].includes(mode))assert.equal(t.hp,hp,mode);else assert.ok(t.hp<hp,mode);
 }
});
test('Sceptile circles its victim through legal corners, pierces only on a successful rear flank and ends in a friendly-safe cone',()=>{
 const {E}=fixture(),{s,b,units:[a,t,near,far,ally]}=battleFor(E,[[254,3,0,2,3],[7,1,1,2,2],[7,1,1,1,2],[7,1,1,5,0],[7,1,0,1,3]]);
 a.attack=100;t.armor=100;t.types=['normal'];const allyHP=ally.hp;E.cast(b,a,t);assert.equal(a.damageDone,0);
 reworkBeat(E,s);assert.equal(a.x,3);assert.equal(a.y,2);assert.equal(t.maxHp-t.hp,65);
 reworkBeat(E,s);assert.equal(a.x,2);assert.equal(a.y,1);assert.equal(t.maxHp-t.hp,165);
 const nearHP=near.hp;reworkBeat(E,s);assert.equal(t.maxHp-t.hp,285);assert.ok(near.hp<nearHP);assert.equal(far.hp,far.maxHp);assert.equal(ally.hp,allyHP);assert.equal(a.leafPulse,undefined);assert.equal(a.mana,0);
 const live=b.units.filter(u=>u.hp>0);assert.equal(new Set(live.map(u=>u.y*6+u.x)).size,live.length);
});
test('blocking both side flanks denies Sceptile bonus penetration; stunned and out-of-range steps are lost',()=>{
 const {E}=fixture(),{s,b,units:[a,t]}=battleFor(E,[[254,3,0,2,3],[7,1,1,2,2],[7,1,0,1,2],[7,1,0,3,2]]);
 a.attack=100;t.armor=100;t.types=['normal'];E.cast(b,a,t);reworkBeat(E,s);reworkBeat(E,s);assert.equal(a.x,2);assert.equal(a.y,3);assert.equal(t.maxHp-t.hp,145);assert.equal(b.events.some(e=>e.kind==='flank'),false);
 const q=battleFor(E,[[254,3,0,2,3],[7,1,1,2,2]]),leaf=q.units[0],foe=q.units[1];E.cast(q.b,leaf,foe);leaf.stunUntil=1;reworkBeat(E,q.s);assert.equal(leaf.damageDone,0);assert.equal(leaf.leafPulse,1);
 leaf.stunUntil=0;foe.y=0;reworkBeat(E,q.s);assert.equal(leaf.damageDone,0);reworkBeat(E,q.s);assert.ok(leaf.damageDone>0);assert.equal(leaf.leafPulse,undefined);
});
test('Empoleon wave advances after movement, hits a three-cell band and never hits the same pushed victim twice',()=>{
 const {E}=fixture(),{s,b,units:[a,t,wing,out,ally,far]}=battleFor(E,[[395,3,0,2,5],[7,1,1,2,4],[7,1,1,1,4],[7,1,1,4,4],[7,1,0,3,4],[7,1,1,2,1]]);
 const allyHP=ally.hp;E.cast(b,a,t);assert.equal(a.damageDone,0);assert.equal(b.waves.length,1);reworkBeat(E,s,2);assert.equal(a.damageDone,0,'attack beats do not advance waves');
 reworkBeat(E,s,1);assert.equal(t.y,3);assert.equal(wing.y,3);assert.ok(t.hp<t.maxHp&&wing.hp<wing.maxHp);assert.equal(out.hp,out.maxHp);assert.equal(ally.hp,allyHP);
 const hp=t.hp;reworkBeat(E,s,3);assert.equal(t.hp,hp,'pushing into next band cannot re-hit');
 for(let i=0;i<4;i++)reworkBeat(E,s,1);assert.ok(far.hp<far.maxHp);assert.equal(b.waves.length,0);assert.equal(ally.hp,allyHP);
});
test('Empoleon respects blocked pushes, boss immunity and both casting directions; a launched wave keeps its cast power and heading',()=>{
 for(const mode of ['blocked','boss','reverse','caster-moves']){
  const {E}=fixture(),{s,b,units:[a,t,block]}=battleFor(E,[[395,3,0,2,5],[7,1,1,2,4],[7,1,0,2,3]]);
  if(mode==='boss')t.boss=true;if(mode==='reverse'){a.side=1;a.y=0;t.side=0;t.y=1;block.x=5;}
  const y=t.y;E.cast(b,a,t);if(mode==='caster-moves'){a.x=5;a.attack=1;}
  reworkBeat(E,s,1);assert.ok(t.hp<t.maxHp,mode);
  if(mode==='reverse')assert.equal(t.y,2);else assert.equal(t.y,y,mode);
  if(mode==='caster-moves')assert.ok(a.damageDone>2.5,'damage snapshots cast attack rather than new attack');
 }
});
test('Dragapult fires down distinct corridors, pierces first victims and explodes on the second without hitting allies',()=>{
 const {E}=fixture(),{b,units:[a,first,second,sideFirst,sideSecond,ally,off]}=battleFor(E,[[887,3,0,2,5],[7,1,1,2,3],[7,1,1,2,1],[7,1,1,3,4],[7,1,1,3,2],[7,1,0,2,4],[7,1,1,0,0]]);
 const allyHP=ally.hp;E.cast(b,a,first);for(const t of [first,second,sideFirst,sideSecond])assert.ok(t.hp<t.maxHp);
 assert.equal(ally.hp,allyHP);assert.equal(off.hp,off.maxHp);const darts=b.events.filter(e=>e.kind==='dreepy');assert.equal(darts.length,2);assert.notEqual(darts[0].sx,darts[1].sx);assert.ok(darts.every(e=>e.explodes&&!e.returning));assert.equal(b.events.filter(e=>e.kind==='area'&&e.type==='dragon').length,2);
});
test('a lone Dragapult victim is struck on the outbound and return path; an empty corridor causes no extra damage',()=>{
 const {E}=fixture(),{b,units:[a,t]}=battleFor(E,[[887,3,0,2,5],[7,1,1,2,3]]);a.attack=100;t.armor=100;const old=a.pierce;E.cast(b,a,t);
 assert.equal(t.maxHp-t.hp,169);assert.equal(a.pierce,old);assert.equal(b.events.filter(e=>e.kind==='spell').length,2);assert.equal(b.events.filter(e=>e.kind==='dreepy'&&e.returning).length,1);assert.equal(b.events.some(e=>e.kind==='area'),false);
});
test('Sceptile sequences and moving Empoleon waves resume deterministically and reject invalid stored state',()=>{
 const {E}=fixture();
 for(const dex of [254,395]){
  const family=E.BY[dex].line[0],deck=[family,...E.DEFAULT_DECK.filter(d=>d!==family)].slice(0,10),s=E.create(212,deck);
  s.units=[{id:1,dex,star:3,pos:dex===395?32:20}];s.nextId=2;s.opponent=[{id:-1,dex:7,star:1,pos:14}];s.opponentRound=1;E.start(s);
  const [a,t]=s.battle.units;t.hp=t.maxHp=100000;a.cooldown=a.moveCD=t.cooldown=t.moveCD=99;if(dex===395)t.y=4;
  E.cast(s.battle,a,t);reworkBeat(E,s,dex===395?1:2);const raw=E.serialize(s),restored=E.restore(raw);assert.ok(restored,`${dex} restores`);
  for(let i=0;i<80;i++){E.tick(s,.05);E.tick(restored,.05);}
  const clean=b=>JSON.stringify({units:b.units.map(u=>{const x={...u};delete x.entrance;return x;}),waves:b.waves});assert.equal(clean(s.battle),clean(restored.battle));
  const bad=JSON.parse(raw);if(dex===395)bad.state.battle.waves[0].hit.push(1);else bad.state.battle.units[0].leafPulse=9;assert.equal(E.restore(JSON.stringify(bad)),null);
 }
});
test('the new quartet completes mixed fights without cell collisions and remains deterministic across frame rates',()=>{
 const {E}=fixture();const run=dt=>{
  const deck=[214,252,393,885,...E.DEFAULT_DECK.filter(d=>![214,252,393,885].includes(d))].slice(0,10),s=E.create(421,deck);s.level=6;
  s.units=[214,254,395,887].map((dex,i)=>({id:i+1,dex,star:3,pos:18+i}));s.nextId=5;
  s.opponent=[214,254,395,887,282,959].map((dex,i)=>({id:-i-1,dex,star:3,pos:12+i}));s.opponentRound=1;E.start(s);
  for(let i=0;i<1500&&s.phase==='combat';i++){
   E.tick(s,dt);const live=s.battle.units.filter(u=>u.hp>0);assert.equal(new Set(live.map(u=>u.y*6+u.x)).size,live.length);
   assert.ok(live.every(u=>u.x>=0&&u.x<6&&u.y>=0&&u.y<6&&Number.isFinite(u.hp)));
  }
  assert.notEqual(s.phase,'combat');return JSON.stringify({result:s.result,units:s.battle.units,waves:s.battle.waves});
 };assert.equal(run(.05),run(.1));
});
