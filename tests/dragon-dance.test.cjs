'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-10, `${a} != ${b}`);
function fixture(level = 5, evolved = false) {
  const G = {}, noop = () => {};
  const ctx = vm.createContext({ G, window: { G }, performance: { now: () => 0 } });
  for (const f of ['js/core/util.js', 'js/data/moves.js', 'js/systems/stats.js', 'js/entities/player.js', 'js/entities/projectile.js',
                   'js/systems/blaziken.js', 'js/systems/combat.js', 'js/systems/levelup.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx);
  G.VFX = { forMove: () => ({}) }; G.FX = { ring: noop, sp: noop, burst: noop };
  G.Coop = { active: false }; G.Audio = { sfx: noop }; G.Progress = { event: noop };
  G.Weather = { speedFor: () => 1 };
  G.World = { collide: noop, isLiquid: () => false, nearestBreakable: () => null };
  G.EnemyMgr = { all: () => [] }; G.Sprites = { dirFromAngle: () => 0 };
  G.Settings={get:()=>false};G.Input={axis:()=>[0,0]};G.Touch={active:false,aim:()=>null};G.Pad={aim:()=>null,rumble:()=>{}};
  const p = Object.create(G.Player.prototype), m = G.Moves.instance('dragon-dance', level);
  if (evolved) G.Moves.evolve(m);
  Object.assign(p, { baseAtk: 2, atkMul: 3, baseSpd: 100, spdMul: 1, cdMul: 0.92 ** 10,
    buffs: Object.fromEntries(['atk', 'patk', 'satk', 'spd', 'def', 'regen'].map(k => [k, { n: 0, t: 0, amount: 0 }])),
    moves: [m], slots: [[m]], active: 0, dead: false, frozen: true, x: 0, y: 0, r: 10, bodyH: 30,
    cast: noop, mon: { types: ['dragon'] }, statsTaken: {}, maxMoves: 4,
    anim: { update: noop, loop: noop } });
  const cast = () => { m.t = 0; G.Combat.tick(0, p, 0); };
  const fill = () => { for (let i = 0; i < 12; i++) cast(); };
  return { G, p, m, cast, fill };
}
test('Danza Dragón progresa en niveles 1–5 hasta +175% daño y +25% cadencia sin evolucionar', () => {
  const totals = [0.6377551020408163, 0.7653061224489796, 1.0714285714285714, 1.0714285714285714, 1.75];
  for (let level = 1; level <= 5; level++) {
    const { p, m, fill } = fixture(level); fill();
    near(p.atkFor({cat:'physical'}) / 6, 1 + totals[level - 1]);
    near(p.attackSpeed, 1 + totals[level - 1] / 7);
    assert.equal(p.buffs.patk.n, m.stacks);
    near(p.buffs.patk.t, level < 4 ? 7 : 10.5);
    near(p.spd, 100); // no aumenta el desplazamiento
  }
});
test('Celestial exige nivel 5 + Reflejos; Potencia por sí sola no desbloquea la carta', () => {
  const { G, p, m } = fixture();
  m.lvl = 4; assert.equal(G.Moves.evoInfo(m, { cd: 1 }), null); m.lvl = 5;
  assert.equal(G.Moves.evoInfo(m, { atk: 1 }).ready, false);
  assert.ok(!G.LevelUp.offer(p).some(c => c.type === 'evo'));
  p.statsTaken.cd = 1;
  const card = G.LevelUp.offer(p).find(c => c.type === 'evo');
  assert.ok(card); assert.match(card.title, /Danza del Dragón Celestial/); card.apply(p);
  assert.equal(m.name, 'Danza del Dragón Celestial'); assert.equal(m.evolved, true);
  assert.equal(G.Moves.evoInfo(m, p.statsTaken), null); assert.equal(G.Moves.evolve(m), false);
});
test('Celestial limita ocho cargas a +200% daño y +40% cadencia durante 12 segundos', () => {
  const { G, p, m, fill, cast } = fixture(5, true); fill();
  assert.equal(p.buffs.patk.n, 8); near(p.atkFor({cat:'physical'}), 18); near(p.attackSpeed, 1.4);
  assert.equal(p.buffs.patk.dragonCelestial, true); near(m.dur, 12);
  p.buffs.patk.t = 0.1; cast(); near(p.buffs.patk.t, 12); assert.equal(p.buffs.patk.n, 8);
  p.slots.push([]); p.active = 1; G.Combat.tick(0, p, 0);
  p.update(11.9); near(p.attackSpeed, 1.4); near(p.atkFor({cat:'physical'}), 18);
  p.update(0.2); near(p.attackSpeed, 1); near(p.atkFor({cat:'physical'}), 6);
});
test('La cadencia multiplica mejoras finales e Impulso sin alterar cdMul ni confundir +25% con -25% recarga', () => {
  const { p, fill } = fixture(); fill(); const cdMul = p.cdMul, move = { cd: 1 };
  near(p.cooldownFor(move), cdMul / 1.25); near(p.cooldownFor(move) / cdMul, 0.8);
  p.mega = 'blazikenite'; p.megaElapsed = 150;
  near(p.attackSpeed, 1.25 * 1.3); near(p.cooldownFor(move), cdMul / (1.25 * 1.3));
  near(p.cooldownFor({ cd: 0.001 }), 0.05 / (1.25 * 1.3)); near(p.cdMul, cdMul);
  p.buffs.patk.n = 0; near(p.attackSpeed, 1.3);
});
test('Las órbitas existentes actualizan su cadencia al ganar y perder las cargas', () => {
  const { G, p, fill } = fixture();
  const orbit = G.Moves.instance('fire-spin'); p.slots.push([orbit]); p.active = 1;
  G.Combat.tick(0, p, 0); const first = G.Projectiles.all()[0]; near(first.rehit, orbit.cd);
  p.active = 0; fill(); p.active = 1; G.Combat.tick(0, p, 0);
  assert.equal(G.Projectiles.all()[0], first); near(first.rehit, orbit.cd / 1.25);
  p.buffs.patk.n = 0; G.Combat.tick(0, p, 0); near(first.rehit, orbit.cd);
});
test('La última danza conserva el sistema compartido sin dejar velocidad residual ni alterar Mil Espadas', () => {
  const { G, p, fill } = fixture(5, true); fill();
  const sword = G.Moves.instance('swords-dance', 5); G.Moves.evolve(sword);
  p.addBuff(sword.stat, sword.amount, sword.dur, sword.stacks, sword);
  near(p.atkFor({cat:'physical'}) / 6, 3.4); near(p.attackSpeed, 1);
  assert.equal(p.buffs.patk.dragonCelestial, false); assert.equal(p.buffs.patk.milEspadas, true);
});
