const { test } = require('node:test'), assert = require('node:assert/strict');
const { fixture } = require('./helpers/boss-rush-fixture.cjs');
test('Boss Rush snapshots roster size and multiplies every boss HP without compounding or changing damage',async()=>{
  for(const n of [1,2,3,4]){
    const f=fixture(),{G}=f;await G.DB.ready();
    const mates=Array.from({length:n-1},()=>({x:16,y:101,r:12,dead:false}));
    const born=[],add=G.EnemyMgr.add.bind(G.EnemyMgr);
    G.EnemyMgr.add=b=>{born.push({hp:b.hp,maxHp:b.maxHp});return add(b);};
    G.Game.everyone=()=>[G.Game.player,...mates];
    G.BossRushPreview.play();f.prepare();
    let b=G.BossRushPreview.boss;
    assert.equal(b.maxHp,400000*n);assert.equal(b.hp,b.maxHp);
    assert.equal(G.BossRushPreview.encounter.players().length,n);
    for(const p of mates)p.dead=true;
    G.Game.everyone=()=>[G.Game.player]; // Leaving/downed teammates do not shrink later bosses.
    for(const stage of [1,2,3,4,5]){
      b.hurt(99999999);f.tick(201);b=G.BossRushPreview.boss;
      assert.equal(G.BossRushPreview.stage,stage);
      if(stage===3){assert.equal(b.dex,382);assert.equal(b.maxHp,2500000*n);assert.equal(born[stage].hp,b.maxHp);continue;}
      const base=G.BossRushRules.minorStats(stage);
      assert.equal(b.maxHp,base.hp*n);assert.equal(born[stage].hp,b.maxHp);
      assert.equal(b.dmg,base.damage);assert.equal(b.rushAttackRate,base.attackRate);
    }
    G.Game.quit();f.back();G.BossRushPreview.play();
    assert.equal(G.BossRushPreview.boss.maxHp,400000,'A new solo attempt resets the multiplier');
  }
});

test('Kyogre uses native damage and slow, freezes in pause, clears rain and slow on exit',async()=>{
  const f=fixture(),{G}=f;await G.DB.ready();G.BossRushPreview.play();f.prepare();
  for(let i=0;i<3;i++){G.BossRushPreview.boss.hurt(99999999);f.tick(201);}
  const e=G.BossRushPreview.encounter,p=G.Game.player,b=G.BossRushPreview.boss;
  assert.equal(e.id,'kyogre');assert.ok(p.level>=17);
  e.attacks=[];e.cooldown=99;p.invuln=0;p.x=b.x;p.y=b.y+85;
  e.begin('ice');const hp=p.hp;
  const dt=e.attack.warn+0.02;for(let i=0;i<Math.ceil(dt*100);i++)e.update(.01);
  assert.ok(p.hp<hp);assert.equal(p.slowT,.7);assert.ok(p.invuln>=.9);
  e.attacks=[];e.begin('rain');for(let i=0;i<160;i++)e.update(.01);assert.equal(e.raining,true);
  G.Game.togglePause();const snapshot=JSON.stringify(e);f.tick(100);assert.equal(JSON.stringify(e),snapshot);
  G.Game.quit();f.back();assert.equal(p.slowT,0);assert.equal(G.BossRushPreview.encounter,null);
  assert.deepEqual(f.storage,f.before);assert.equal(f.rankings(),0);
});
test('Engine integration: temporary session, real moves hit Groudon, no ranking or account writes', async () => {
  const f=fixture(),{G}=f; await G.DB.ready(); assert.equal(G.DB.guest,true);
  G.BossRushPreview.play(); assert.equal(G.Game.state,'paused'); assert.equal(G.Game.player.level,8);
  assert.equal(f.prepare(),7); assert.equal(G.Game.state,'playing');
  assert.equal(G.BossRushPreview.boss.dex,383); assert.ok(G.Game.player.maxHp>0);
  const hp=G.BossRushPreview.boss.hp; f.tick(180);
  assert.ok(G.BossRushPreview.boss.hp<hp); assert.ok(G.Game.player.dmgDealt>0);
  assert.ok(G.Game.player.hp<G.Game.player.maxHp,'A stationary player takes damage from Groudon');
  assert.equal(G.EnemyMgr.all().length,1); assert.equal(f.rankings(),0);
  assert.deepEqual(f.storage,f.before); assert.equal(G.World.arena.th.pools,0);
  assert.equal(G.Camera.x,16); assert.equal(G.Camera.y,16-(G.Camera.rushOffsetY||0));
});
test('Engine integration: pause stops combat; abandon and retry reset the fight', async () => {
  const f=fixture(),{G}=f; await G.DB.ready(); G.BossRushPreview.play(); f.prepare(); f.tick(180);
  G.Game.togglePause(); const time=G.BossRushPreview.encounter.clock; f.tick(100);
  assert.equal(G.BossRushPreview.encounter.clock,time);
  G.Game.quit(); assert.equal(f.result().coins,0); assert.equal(f.result().record,false);
  f.back(); assert.equal(G.Game.state,'ui'); assert.equal(G.BossRushPreview.running,false);
  G.BossRushPreview.play(); f.prepare(); assert.equal(G.BossRushPreview.encounter.phase,1);
  assert.equal(G.BossRushPreview.boss.hp,400000); assert.equal(G.Game.player.hp,G.Game.player.maxHp);
  assert.deepEqual(f.storage,f.before);
});
test('Engine integration: phases, victory and no drops/rewards', async () => {
  const f=fixture(),{G}=f; await G.DB.ready(); G.BossRushPreview.play(); f.prepare();
  const b=G.BossRushPreview.boss;
  b.hp=b.maxHp*0.7; f.tick(1); assert.equal(G.BossRushPreview.encounter.phase,2);
  b.hp=b.maxHp*0.35; f.tick(1); assert.equal(G.BossRushPreview.encounter.phase,3);
  b.hurt(999999); f.tick(1); assert.equal(G.Game.state,'playing');
  f.tick(200); const firstMinor=G.BossRushPreview.boss.dex;
  assert.ok(G.BossRushRules.eligibleMinor(G.DEX_BY[firstMinor],G.SPRITE_META));
  assert.ok(G.Game.player.level>8); assert.equal(G.EnemyMgr.all().filter(e=>!e.dead).length,1);
  const firstStats={hp:G.BossRushPreview.boss.maxHp,dmg:G.BossRushPreview.boss.dmg,rate:G.BossRushPreview.boss.rushAttackRate};
  G.BossRushPreview.boss.hurt(999999); f.tick(201);
  const second=G.BossRushPreview.boss;
  assert.ok(G.BossRushRules.eligibleMinor(G.DEX_BY[second.dex],G.SPRITE_META)); assert.notEqual(second.dex,firstMinor);
  assert.ok(second.maxHp>firstStats.hp && second.dmg>firstStats.dmg && second.rushAttackRate>firstStats.rate);
  G.BossRushPreview.boss.hurt(999999); f.tick(201);
  assert.equal(G.BossRushPreview.stage,3);assert.equal(G.BossRushPreview.boss.dex,382);
  assert.equal(G.Game.player.level,17);assert.equal(G.BossRushPreview.encounter.id,'kyogre');
  assert.equal(G.World.arena.type,'water');assert.equal(G.World.arena.th.pools,0);
  const seen=new Set([firstMinor,second.dex]);
  for(const next of [4,5]){
    G.BossRushPreview.boss.hurt(99999999);f.tick(201);
    assert.equal(G.BossRushPreview.stage,next);
    const dex=G.BossRushPreview.boss.dex;
    assert.ok(G.BossRushRules.eligibleMinor(G.DEX_BY[dex],G.SPRITE_META));
    assert.ok(!seen.has(dex));seen.add(dex);
  }
  G.BossRushPreview.boss.hurt(99999999);f.tick(201);
  assert.equal(G.Game.state,'over'); assert.equal(f.nodes.get('over-title').textContent,'¡Tierra y océano superados!');
  assert.equal(f.result().coins,0); assert.equal(f.rankings(),0); assert.deepEqual(f.storage,f.before);
});
test('Preview preserves absence of a pre-existing session too', async () => {
  const f=fixture(null); await f.G.DB.ready(); assert.deepEqual(f.storage,f.before);
});
test('Test funds and three Pokemon are available; purchased perks survive preparation',async()=>{
  const f=fixture(),{G}=f;await G.DB.ready();
  assert.equal(G.DB.save.coins,100000);
  for(const dex of [260,257,254])assert.ok(G.DB.owns(dex));
  const levels=G.DB.upgradesOf(260);
  // Apply the same prices and levels as the game's gold shop.
  for(const id of ['hp','atk','spd','options']){G.DB.save.coins-=G.Upgrades.cost(id,0);levels[id]=1;}
  const afterBuying=G.DB.save.coins;assert.ok(afterBuying<100000);
  G.BossRushPreview.play();const p=G.Game.player;
  assert.equal(p.maxHp,G.DEX_BY[260].hp+8);assert.equal(p.atkMul,1.04);assert.equal(p.spdMul,1.03);
  assert.equal(p.cardOptions,4);f.prepare();
  assert.equal(G.DB.save.coins,afterBuying);assert.equal(G.BossRushPreview.refillFunds(),false);
  G.Game.quit();f.back();assert.equal(G.BossRushPreview.refillFunds(),true);
  assert.equal(G.DB.save.coins,100000);assert.deepEqual(f.storage,f.before);
});
test('Minor scaling changes idle cooldown only; native patterns and warning durations stay intact', async()=>{
  const f=fixture(),{G}=f;await G.DB.ready();G.BossRushPreview.play();f.prepare();
  const def={dex:377,hp:3200,spd:60,dmg:27,xp:0,behavior:'ranged',shotDmg:15};
  const native=new G.Enemy(def,0,0,{hp:1,spd:1,dmg:1},true);
  const later=new G.Enemy(def,0,0,{hp:1,spd:1,dmg:1},true);
  native.bossInit();later.bossInit();
  later.rushMinor=true;later.rushAttackRate=1.3;
  for(const e of [native,later]){e.ai.cd=2;e.ai.mode='far';e.ai.modeT=99;}
  const p=G.Game.player;
  native.bossMove(0.1,p,200,1,0,60);later.bossMove(0.1,p,200,1,0,60);
  assert.ok(Math.abs(native.ai.cd-1.9)<1e-9);assert.ok(Math.abs(later.ai.cd-1.87)<1e-9);
  native.bossStart('beam',p);later.bossStart('beam',p);
  assert.equal(native.ai.cast.wind,later.ai.cast.wind);
  assert.equal(native.ai.cast.after,later.ai.cast.after);
  native.bossMove(0.1,p,200,1,0,60);later.bossMove(0.1,p,200,1,0,60);
  assert.equal(native.ai.cast.t,later.ai.cast.t);
  assert.deepEqual(Array.from(native.ai.melee),Array.from(later.ai.melee));
  assert.deepEqual(Array.from(native.ai.ranged),Array.from(later.ai.ranged));
});

test('Jugar exposes Boss Rush explicitly; Back returns to mode selection and normal runs stay normal', async () => {
  const f=fixture(),{G}=f; await G.DB.ready();
  G.MenuUI.init(); G.MenuUI.open();
  assert.equal(G.UI.isOpen('scr-menu'),true);
  assert.equal(f.nodes.has('scr-boss-rush'),false);
  G.MenuUI.openPlayMode(); f.nodes.get('btn-boss-rush').onclick();
  assert.equal(G.UI.isOpen('scr-boss-rush'),true);
  assert.equal(G.UI.isOpen('scr-play-mode'),false);
  f.nodes.get('rush-start').onclick();
  assert.equal(G.BossRushPreview.running,true); assert.equal(G.Game.player.level,8);
  f.prepare(); G.Game.quit(); f.back();
  G.MenuUI.openPlayMode(); f.nodes.get('btn-boss-rush').onclick();
  f.nodes.get('rush-back').onclick();
  assert.equal(G.UI.isOpen('scr-boss-rush'),false);
  assert.equal(G.UI.isOpen('scr-play-mode'),true);
  G.Game.startRun();
  assert.equal(G.Game.state,'playing'); assert.equal(G.Game.player.level,1);
  assert.equal(G.BossRushPreview.running,false); assert.equal(G.BossRushPreview.preparing,false);
});

test('Mega Blaziken is unlocked and equipped in the temporary save and works in Boss Rush', async () => {
  const f=fixture(),{G}=f; await G.DB.ready();
  assert.equal(G.Mega.has(G.DB.save,257),true);
  assert.equal(G.Mega.equipped(G.DB.save,257),true);
  G.BossRushPreview.open();
  const select=f.nodes.get('rush-partner'); select.value='257'; select.onchange();
  f.nodes.get('rush-start').onclick();
  const p=G.Game.player;
  assert.equal(p.mega,'blazikenite'); assert.equal(p.mon.name,'Mega Blaziken');
  assert.equal(p.moves.find(m=>m.id==='karate-chop').lvl,2);
  f.prepare(); p.x=G.BossRushPreview.boss.x; p.y=G.BossRushPreview.boss.y+30; f.tick(180);
  assert.ok(p.megaElapsed>0); assert.ok(p.dmgDealt>0);
  assert.deepEqual(f.storage,f.before);
});

test('Rush arena fills every viewport edge, contains actors, and restores normal camera after exit',async()=>{
  const f=fixture(),{G}=f;await G.DB.ready();G.BossRushPreview.play();f.prepare();
  const r=G.Groudon.ARENA;
  for(const [w,h] of [[1280,560],[360,720],[960,540]]) {
    G.Camera.resize(w,h,2);
    assert.ok(Math.abs((16+r.left-G.Camera.left())*G.Camera.scale)<1e-9);
    assert.ok(Math.abs((16+r.right-G.Camera.left())*G.Camera.scale-w)<1e-9);
    assert.ok(Math.abs((16+r.top-G.Camera.top())*G.Camera.scale)<1e-9);
    assert.ok(Math.abs((16+r.bottom-G.Camera.top())*G.Camera.scale-h)<1e-9);
    assert.ok(Math.abs(G.Camera.w*G.Camera.scale-w)<1e-9);
    assert.ok(Math.abs(G.Camera.h*G.Camera.scale-h)<1e-9);
    assert.ok(G.World.arena.r*32>Math.hypot(r.right,r.bottom)+32,'Native walls stay beyond visible corners');
  }
  const p=G.Game.player,b=G.BossRushPreview.boss,initialY=b.y;
  f.tick(30); assert.ok(b.y>initialY);
  p.x=10000;p.y=-10000;G.Spawner.update(.01,[],0);
  assert.ok(p.x<=16+r.right-p.r-6);assert.ok(p.y>=16+r.top+p.r+6);
  G.Game.quit();f.back();
  assert.ok(Math.abs(G.Camera.scale-1.25)<1e-9);assert.equal(G.Camera.w,768);assert.ok(Math.abs(G.Camera.h-432)<1e-9);
});

test('Rotation retires old warnings and lava before moving actors into the new bounds',async()=>{
  const f=fixture(),{G}=f;await G.DB.ready();G.BossRushPreview.play();f.prepare();
  G.Camera.resize(360,720,2);
  const e=G.BossRushPreview.encounter,p=G.Game.player,b=G.BossRushPreview.boss;
  p.y=800;b.y=-700;e.beginCombo(['blades','eruption']);
  assert.ok(e.findEscape({x:p.x-16,y:p.y-16,r:p.r},e.attacks),'Portrait warnings leave a reachable escape');
  e.hazards.push({kind:'circle',x:0,y:800,r:45,start:e.clock,end:e.clock+5});
  const hp=p.hp;G.Camera.resize(960,540,2);
  assert.equal(e.attacks.length,0);assert.equal(e.hazards.length,0);
  assert.ok(p.invuln>=1);assert.equal(p.hp,hp);
  const r=G.Groudon.ARENA;
  for(const actor of [p,b]) assert.ok(actor.y>=16+r.top+actor.r+6&&actor.y<=16+r.bottom-actor.r-6);
  e.beginCombo(['blades','eruption']);
  assert.ok(e.findEscape({x:p.x-16,y:p.y-16,r:p.r},e.attacks),'New warnings leave a reachable escape');
});

test('Only the major grants one Bond; selecting the native fusion pauses the intermission',async()=>{
  const f=fixture(),{G}=f;await G.DB.ready();G.BossRushPreview.play();f.prepare();
  const p=G.Game.player,b=G.BossRushPreview.boss;
  assert.equal(p.bonds,0);b.hurt(999999);b.die();
  assert.equal(p.bonds,1,'No duplicate reward from repeated die calls');
  f.tick(1,{autoBond:false});assert.equal(G.Game.state,'choice');
  assert.equal(f.bond().opt.mode,'pair');
  f.tick(240,{autoBond:false});assert.equal(G.BossRushPreview.stage,0);
  assert.equal(p.bonds,1);assert.equal(G.UI.isOpen('scr-bond'),true);
  f.pickBond();assert.equal(G.Game.state,'playing');assert.equal(p.bonds,0);
  assert.equal(p.activeGroup().length,2);
  const pair=p.activeGroup().map(m=>m.id),fired=new Set(),cast=p.cast.bind(p);
  p.cast=m=>{fired.add(m.id);cast(m);};
  f.tick(200);assert.equal(G.BossRushPreview.stage,1);
  for(const id of pair) assert.ok(fired.has(id),'The fused group casts '+id);
  G.BossRushPreview.boss.hurt(999999);f.tick(201);
  assert.equal(G.BossRushPreview.stage,2);assert.equal(p.bonds,0);assert.equal(f.bond(),null);
  G.BossRushPreview.boss.hurt(999999);f.tick(201);
  assert.equal(G.BossRushPreview.stage,3);assert.equal(p.bonds,0);
  const kyogre=G.BossRushPreview.boss;kyogre.hurt(99999999);kyogre.die();
  assert.equal(p.bonds,1,'Kyogre grants one Bond too');
  f.tick(240,{autoBond:false});
  if(G.Game.state==='choice'){assert.equal(G.BossRushPreview.stage,3);f.pickBond();}
  f.tick(201);assert.equal(G.BossRushPreview.stage,4);
  for(let i=0;i<2;i++){G.BossRushPreview.boss.hurt(99999999);f.tick(201);}
  assert.equal(G.Game.state,'over');
  assert.deepEqual(f.storage,f.before);
});

test('Max Upgrades button affects only the selected guest Pokemon and starts level 8 with seven choices',async()=>{
  const f=fixture(),{G}=f;await G.DB.ready();G.BossRushPreview.open();
  const select=f.nodes.get('rush-partner');select.value='257';select.onchange();
  const coins=G.DB.save.coins,swampert=JSON.stringify(G.DB.save.pupg[260]),sceptile=JSON.stringify(G.DB.save.pupg[254]);
  f.nodes.get('rush-max').onclick();
  for(const u of G.Upgrades.LIST)assert.equal(G.DB.upgradesOf(257)[u.id],u.max,u.id);
  assert.equal(G.DB.save.coins,coins);assert.equal(JSON.stringify(G.DB.save.pupg[260]),swampert);
  assert.equal(JSON.stringify(G.DB.save.pupg[254]),sceptile);
  assert.equal(f.nodes.get('rush-max').disabled,true);
  assert.match(f.nodes.get('rush-status').textContent,/Blaziken/);
  assert.equal(G.BossRushPreview.maxUpgrades(999),false);
  select.value='254';select.onchange();assert.equal(f.nodes.get('rush-max').disabled,false);
  select.value='257';select.onchange();f.nodes.get('rush-start').onclick();
  const p=G.Game.player;
  assert.equal(p.level,8);assert.equal(p.xp,0);assert.equal(p.xpNext,G.Player.xpFor(8));
  assert.equal(p.atkMul,1.4);assert.equal(p.cardOptions,6);
  assert.equal(G.BossRushPreview.maxUpgrades(260),false);
  assert.equal(f.prepare(),7);assert.equal(p.level,8);assert.equal(G.Game.state,'playing');
  assert.deepEqual(f.storage,f.before);
});
