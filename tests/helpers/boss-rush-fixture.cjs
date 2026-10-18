const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.join(__dirname, '../..'), read = f => fs.readFileSync(path.join(root, f), 'utf8'), noop = () => {};
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
  G.UI.hide = id => node(id).classList.add('hidden');
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
  let result, back, cards, pick, bond;
  G.RunUI.showOver = (r,b) => { result=r; back=b; };
  G.RunUI.showLevelUp = (lv,list,cb) => { cards=list; pick=cb; };
  G.RunUI.showBond = (opt,cb) => { bond={opt,cb}; G.UI.show('scr-bond'); };
  G.Flow.afterRun = () => G.Game.toUI();
  load('dev/boss-rush-rules.js'); load('dev/groudon.js'); load('dev/groudon-fx.js'); load('dev/boss-rush-preview.js');
  const choose = () => { const card=cards.find(c=>c.key==='up:water-gun') || cards.find(c=>c.key==='stat:atk') || cards[0]; const cb=pick; cards=null; pick=null; cb(card); };
  const prepare = () => { let n=0; while(G.BossRushPreview.preparing) { choose(); n++; assert.ok(n<=9); } return n; };
  const pickBond = () => {
    const {opt,cb}=bond; bond=null; G.UI.hide('scr-bond');
    cb(opt.mode==='pair'?opt.loose.slice(0,2):opt.loose.slice(0,1));
  };
  const tick = (n,{autoBond=true}={}) => { for (let i=0;i<n;i++) {
    ctx.now=(ctx.now||0)+1000/60; G.Game._frame(ctx.now);
    if(G.Game.state==='levelup') choose();
    if(autoBond&&G.Game.state==='choice'&&bond) pickBond();
  } };
  return { G, ctx, load, tick, prepare, storage, before, nodes, pickBond, bond:()=>bond,
    result:()=>result, back:()=>back(), rankings:()=>rankings };
}

module.exports = { fixture };
