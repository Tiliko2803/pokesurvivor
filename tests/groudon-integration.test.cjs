const { test } = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.join(__dirname, '..'), read = f => fs.readFileSync(path.join(root, f), 'utf8'), noop = () => {};
function fixture(session = 'real-account') {
  const storage = new Map([['ps.save.real-account', '{"coins":123456}'], ['ps.dev', '"existing1234"']]);
  if (session !== null) storage.set('ps.session', session);
  const before = new Map(storage), nodes = new Map();
  const node = id => {
    if (!nodes.has(id)) {
      const classes = new Set(['hidden']);
      nodes.set(id, { classList: { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x), toggle: noop },
        remove: noop, textContent: '', innerHTML: '' });
    }
    return nodes.get(id);
  };
  const ctx = vm.createContext({ G: {}, console, navigator: { onLine: true }, document: { hidden: false,
    addEventListener: noop, getElementById: node }, window: {}, location: { protocol: 'file:' },
    addEventListener: noop, requestAnimationFrame: noop, setTimeout: noop, clearTimeout: noop,
    performance: { now: () => ctx.now || 0 },
    localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k,v) => storage.set(k,v), removeItem: k => storage.delete(k) } });
  const load = f => vm.runInContext(read(f), ctx, { filename: f });
  const G = ctx.G;
  // util.js deliberately owns the browser's global G.
  ctx.window.G = G;
  for (const f of ['js/core/util.js', 'js/data/pokedex.js', 'js/data/sprites-meta.js', 'js/data/moves.js', 'js/data/types.js', 'js/data/starters.js', 'js/data/upgrades.js',
    'js/systems/mega.js', 'js/systems/repertoire.js', 'js/systems/challenges.js', 'js/core/db.js']) load(f);
  const stub = () => new Proxy({}, { get: (o,k) => k in o ? o[k] : noop });
  for (const name of ['UI','FX','Pickups','Spawner','Rift','Judgment','Events','Weather','Path','Hazards','World','Interact','Audio','Progress','Social','Coop','Input','RunUI','Settings','MenuUI','Updater','HUD']) G[name] = stub();
  Object.assign(G.Coop, { active: false, isHost: false }); Object.assign(G.Social, { room: null, me: null });
  Object.assign(G.Weather, { mult: () => 1, speedFor: () => 1 });
  Object.assign(G.World, { biome: 0, isLiquid: () => false, projectileBlock: () => false, propsInCircle: () => [],
    setArena: cfg => { G.World.arena = cfg; }, nearestBreakable: () => null });
  G.Tiles = { ARENA_THEMES: { fire: {} }, arenaBiome: () => 0 };
  G.BIOME_MUSIC = ['boss']; G.Judgment.summary = () => null; G.Judgment.cinematic = false; G.Judgment.active = false;
  G.Rift.inArena = false; G.Input.axis = () => [0,0]; G.Input.tap = () => false; G.SettingsUI = { isOpen: false };
  G.UI.isOpen = id => !node(id).classList.contains('hidden'); G.UI.$ = node;
  G.Camera = { x: 0, y: 0, follow(x,y) { this.x=x; this.y=y; }, sees: () => true, kick: noop, outerRadius: () => 500 };
  G.Sprites = { PX: 2, hasShiny: () => false, hovers: () => false, preload: noop, dirFromAngle: () => 0,
    bodyRadius: dex => dex === 383 ? 28 : 12, bodyHeight: () => 80, animMeta: () => ({ ay: 40, d: [10] }),
    Animator: class { constructor() {this.cur='Idle'; this.dir=0;} update(){} play(a){this.cur=a;} loop(){} busy(){return false;} progress(){return 1;} } };
  G.VFX = { forMove: () => ({ pal: 'water', proj: 'orb' }), forType: () => ({pal:'ground'}) };
  let rankings = 0; G.Ranking = { runStarted: () => rankings++, submitSolo: () => rankings++, submitGroup: () => rankings++ };
  for (const f of ['js/entities/projectile.js', 'js/entities/enemy.js', 'js/entities/player.js', 'js/systems/combat.js', 'js/systems/levelup.js', 'js/entities/pickup.js']) load(f);
  const instrumented = read('js/game.js').replace('function render() {', 'function render() { return;')
    .replace('function restore() {', 'function restore() { return;')
    .replace('init, startRun, everyone,', '_frame: frame, init, startRun, everyone,');
  vm.runInContext(instrumented, ctx, {filename:'js/game.js'});
  let result, back, cards, pick;
  G.RunUI.showOver = (r,b) => { result=r; back=b; };
  G.RunUI.showLevelUp = (lv,list,cb) => { cards=list; pick=cb; };
  G.Flow.afterRun = () => G.Game.toUI();
  load('dev/boss-rush-rules.js'); load('dev/groudon.js'); load('dev/boss-rush-preview.js');
  const choose = () => { const card=cards.find(c=>c.key==='up:water-gun') || cards.find(c=>c.key==='stat:atk') || cards[0]; const cb=pick; cards=null; pick=null; cb(card); };
  const prepare = () => { let n=0; while(G.BossRushPreview.preparing) { choose(); n++; assert.ok(n<=9); } return n; };
  const tick = n => { for (let i=0;i<n;i++) {ctx.now=(ctx.now||0)+1000/60; G.Game._frame(ctx.now); if(G.Game.state==='levelup') choose();} };
  return { G, ctx, load, tick, prepare, storage, before, nodes, result:()=>result, back:()=>back(), rankings:()=>rankings };
}
test('Engine integration: temporary session, real moves hit Groudon, no ranking or account writes', async () => {
  const f=fixture(),{G}=f; await G.DB.ready(); assert.equal(G.DB.guest,true);
  G.Game.startRun(); assert.equal(G.Game.state,'paused'); assert.equal(G.Game.player.level,10);
  assert.equal(f.prepare(),9); assert.equal(G.Game.state,'playing');
  assert.equal(G.BossRushPreview.boss.dex,383); assert.ok(G.Game.player.maxHp>0);
  const hp=G.BossRushPreview.boss.hp; f.tick(180);
  assert.ok(G.BossRushPreview.boss.hp<hp); assert.ok(G.Game.player.dmgDealt>0);
  assert.equal(G.EnemyMgr.all().length,1); assert.equal(f.rankings(),0);
  assert.deepEqual(f.storage,f.before); assert.equal(G.World.arena.th.pools,0);
  assert.equal(G.Camera.x,16); assert.equal(G.Camera.y,16);
});
test('Engine integration: pause stops combat; abandon and retry reset the fight', async () => {
  const f=fixture(),{G}=f; await G.DB.ready(); G.Game.startRun(); f.prepare(); f.tick(180);
  G.Game.togglePause(); const time=G.BossRushPreview.encounter.clock; f.tick(100);
  assert.equal(G.BossRushPreview.encounter.clock,time);
  G.Game.quit(); assert.equal(f.result().coins,0); assert.equal(f.result().record,false);
  f.back(); assert.equal(G.Game.state,'ui'); assert.equal(G.BossRushPreview.running,false);
  G.Game.startRun(); f.prepare(); assert.equal(G.BossRushPreview.encounter.phase,1);
  assert.equal(G.BossRushPreview.boss.hp,10000); assert.equal(G.Game.player.hp,G.Game.player.maxHp);
  assert.deepEqual(f.storage,f.before);
});
test('Engine integration: phases, victory and no drops/rewards', async () => {
  const f=fixture(),{G}=f; await G.DB.ready(); G.Game.startRun(); f.prepare();
  const b=G.BossRushPreview.boss;
  b.hp=b.maxHp*0.7; f.tick(1); assert.equal(G.BossRushPreview.encounter.phase,2);
  b.hp=b.maxHp*0.35; f.tick(1); assert.equal(G.BossRushPreview.encounter.phase,3);
  b.hurt(999999); f.tick(1); assert.equal(G.Game.state,'playing');
  f.tick(200); const firstMinor=G.BossRushPreview.boss.dex;
  assert.ok(G.BossRushRules.eligibleMinor(G.DEX_BY[firstMinor],G.SPRITE_META));
  assert.ok(G.Game.player.level>10); assert.equal(G.EnemyMgr.all().filter(e=>!e.dead).length,1);
  const firstStats={hp:G.BossRushPreview.boss.maxHp,dmg:G.BossRushPreview.boss.dmg,rate:G.BossRushPreview.boss.rushAttackRate};
  G.BossRushPreview.boss.hurt(999999); f.tick(201);
  const second=G.BossRushPreview.boss;
  assert.ok(G.BossRushRules.eligibleMinor(G.DEX_BY[second.dex],G.SPRITE_META)); assert.notEqual(second.dex,firstMinor);
  assert.ok(second.maxHp>firstStats.hp && second.dmg>firstStats.dmg && second.rushAttackRate>firstStats.rate);
  G.BossRushPreview.boss.hurt(999999); f.tick(201);
  assert.equal(G.Game.state,'over'); assert.equal(f.nodes.get('over-title').textContent,'¡Primer tramo superado!');
  assert.equal(f.result().coins,0); assert.equal(f.rankings(),0); assert.deepEqual(f.storage,f.before);
});
test('Preview preserves absence of a pre-existing session too', async () => {
  const f=fixture(null); await f.G.DB.ready(); assert.deepEqual(f.storage,f.before);
});
test('Minor scaling changes idle cooldown only; native patterns and warning durations stay intact', async()=>{
  const f=fixture(),{G}=f;await G.DB.ready();G.Game.startRun();f.prepare();
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
