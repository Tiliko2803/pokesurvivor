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
        remove: noop, textContent: '', innerHTML: '', value: '',
        add(option) { if (!this.value) this.value = option.value; }, replaceChildren() { this.value = ''; } });
    }
    return nodes.get(id);
  };
  const ctx = vm.createContext({ G: {}, console, navigator: { onLine: true }, document: { hidden: false,
    addEventListener: noop, getElementById: id => id === 'scr-boss-rush' ? nodes.get(id) || null : node(id),
    createElement: () => ({}), body: { appendChild: el => nodes.set(el.id, Object.assign(node(el.id), el)) } },
    Option: class { constructor(text,value) { this.text=text; this.value=value; } }, Image: class {}, window: {}, location: { protocol: 'file:' },
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
  G.UI.show = id => { for (const [key,el] of nodes) if (key.startsWith('scr-')) el.classList.add('hidden'); node(id).classList.remove('hidden'); };
  G.MenuUI.open = () => G.UI.show('scr-menu');
  G.MenuUI.openPlayMode = () => G.UI.show('scr-play-mode');
  load('js/core/camera.js'); G.Camera.resize(960,540,1);
  G.Sprites = { PX: 2, hasShiny: () => false, hovers: () => false, preload: noop, dirFromAngle: () => 0,
    bodyRadius: dex => dex === 383 ? 28 : 12, bodyHeight: () => 80, animMeta: () => ({ ay: 40, d: [10] }),
    Animator: class { constructor() {this.cur='Idle'; this.dir=0;} update(){} play(a){this.cur=a;} loop(){} busy(){return false;} progress(){return 1;} } };
  G.VFX = { forMove: () => ({ pal: 'water', proj: 'orb' }), forType: () => ({pal:'ground'}) };
  G.MegaArt = { Animator: G.Sprites.Animator }; load('js/systems/blaziken.js');
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
  G.BossRushPreview.play(); assert.equal(G.Game.state,'paused'); assert.equal(G.Game.player.level,10);
  assert.equal(f.prepare(),9); assert.equal(G.Game.state,'playing');
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
  assert.equal(G.BossRushPreview.boss.hp,22000); assert.equal(G.Game.player.hp,G.Game.player.maxHp);
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
  assert.equal(G.BossRushPreview.running,true); assert.equal(G.Game.player.level,10);
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

test('Rush arena fits landscape and portrait, contains actors, and restores normal camera after exit',async()=>{
  const f=fixture(),{G}=f;await G.DB.ready();G.BossRushPreview.play();f.prepare();
  const r=G.Groudon.ARENA;
  for(const [w,h] of [[1280,560],[360,720],[960,540]]) {
    G.Camera.resize(w,h,2);
    assert.ok((16+r.left-G.Camera.left())*G.Camera.scale>=24-1e-9);
    assert.ok((16+r.top-G.Camera.top())*G.Camera.scale>=112-1e-9);
    assert.ok((16+r.bottom-G.Camera.top())*G.Camera.scale<=h-64+1e-9);
    assert.ok(Math.abs(G.Camera.w*G.Camera.scale-w)<1e-9);
    assert.ok(Math.abs(G.Camera.h*G.Camera.scale-h)<1e-9);
  }
  const p=G.Game.player,b=G.BossRushPreview.boss,initialY=b.y;
  f.tick(30); assert.ok(b.y>initialY);
  p.x=10000;p.y=-10000;G.Spawner.update(.01,[],0);
  assert.ok(p.x<=16+r.right-p.r-6);assert.ok(p.y>=16+r.top+p.r+6);
  G.Game.quit();f.back();
  assert.ok(Math.abs(G.Camera.scale-1.25)<1e-9);assert.equal(G.Camera.w,768);assert.ok(Math.abs(G.Camera.h-432)<1e-9);
});
