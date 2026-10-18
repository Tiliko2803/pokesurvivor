/* Duration benchmark using the real game, combat, moves, upgrades and Mega Impulso.
 * UI/terrain are stubbed by the integration fixture. The driver stays in melee range,
 * ignores incoming damage, and optionally withholds casts to model time spent dodging.
 * This measures offensive duration, not whether a human can survive the encounter.
 * Run: node tools/benchmark-groudon.cjs
 */
const vm = require('node:vm');
const { fixture } = require('../tests/helpers/boss-rush-fixture.cjs');
const PLANS = {
  melee: ['up:karate-chop','up:karate-chop','up:karate-chop','stat:atk','evo:karate-chop',
    'stat:atk','stat:atk'],
  dance: ['up:karate-chop','up:karate-chop','up:karate-chop','stat:atk','evo:karate-chop',
    'up:swords-dance','up:swords-dance']
};
async function simulate({ build = 'melee', uptime = 0.85, seed = 123 } = {}) {
  if (!PLANS[build] || !(uptime > 0 && uptime <= 1)) throw new Error('Invalid benchmark configuration');
  const f = fixture(), {G} = f;
  f.ctx.benchmarkSeed = seed;
  vm.runInContext('Math.random=()=>{benchmarkSeed=(Math.imul(benchmarkSeed,1664525)+1013904223)>>>0;return benchmarkSeed/4294967296;}',f.ctx);
  await G.DB.ready();
  for (const u of G.Upgrades.LIST) G.DB.upgradesOf(257)[u.id] = u.max;
  G.BossRushPreview.open();
  const select = f.nodes.get('rush-partner'); select.value='257'; select.onchange();
  if (build === 'dance') f.nodes.get('rush-move-2').value='swords-dance';
  const plan = [...PLANS[build]], originalOffer = G.LevelUp.offer;
  let choices = 0;
  G.LevelUp.offer = p => {
    const key = plan.length ? plan.shift() : build==='dance'&&p.moves.find(m=>m.id==='swords-dance').lvl<5 ? 'up:swords-dance' : 'stat:atk';
    // Select a reproducible, legal preparation card; do not grant extra levels/cards.
    for (let i=0;i<100;i++) {
      const card=originalOffer(p,100).find(c=>c.key===key);
      if (card) { choices++; return [card]; }
    }
    throw new Error('Unavailable preparation card: '+key);
  };
  G.RunUI.showLevelUp = (level,cards,pick) => pick(cards[0]);
  f.nodes.get('rush-start').onclick();
  for(let i=0;i<G.BossRushRules.MAJOR_STAGES.groudon;i++){for(const b of G.BossRushPreview.bosses)b.hurt(1e12);f.tick(201);}
  const p = G.Game.player, boss = G.BossRushPreview.boss, encounter = G.BossRushPreview.encounter;
  const levelAtStart = p.level, choicesAtStart = choices;
  p.hurt=()=>{};
  encounter.hit = () => 0;
  let casting = true;
  const originalTick = G.Combat.tick;
  G.Combat.tick = (...args) => { if (casting) originalTick(...args); };
  let frames = 0;
  while (!boss.dead && frames < 600*60) {
    p.x=boss.x; p.y=boss.y+40;
    if (build === 'dance') {
      const dance = p.moves.find(m=>m.id==='swords-dance');
      p.setActive(p.buffs.atk.n<dance.stacks || p.buffs.atk.t<1 ? 1 : 0);
    }
    casting = (frames/60%10) < uptime*10;
    f.tick(1); frames++;
  }
  return { build, seed, uptime, hp:boss.maxHp, seconds:+(frames/60).toFixed(2),
    defeated:boss.dead, phase:encounter.phase, choices:choicesAtStart,
    maxGold:G.Upgrades.LIST.every(u=>G.DB.upgradesOf(257)[u.id]===u.max),
    mega:p.mega, levelAtStart };
}
module.exports = { simulate };
if (require.main === module) (async()=>{
  for (const build of ['melee','dance']) for (const uptime of [1,0.85,0.75])
    console.log(JSON.stringify(await simulate({build,uptime})));
})().catch(error=>{ console.error(error); process.exitCode=1; });
