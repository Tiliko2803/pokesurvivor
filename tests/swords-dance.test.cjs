'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function fixture() {
  const G = {}, noop = () => {};
  const ctx = vm.createContext({ G, performance: { now: () => 0 } });
  for (const file of ['js/data/moves.js', 'js/entities/player.js', 'js/systems/combat.js', 'js/systems/levelup.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), ctx);
  G.U = { TYPE_COLOR: { normal: '#fff' }, TYPE_NAME: { normal: 'Normal' }, rand: () => 0, pickN: a => a.slice(0, 6) };
  G.VFX = { forMove: () => ({}) }; G.FX = { ring: noop, sp: noop, burst: noop };
  G.Coop = { active: false }; G.Audio = { sfx: noop }; G.Progress = { event: noop };
  const p = Object.create(G.Player.prototype);
  Object.assign(p, { baseAtk: 2, atkMul: 3, cdMul: 1, buffs: { atk: { n: 0, t: 0, amount: 0 } },
    x: 0, y: 0, r: 10, bodyH: 30, dead: false, cast: noop, statsTaken: {}, maxMoves: 4,
    moves: [G.Moves.instance('swords-dance', 5)], active: 0, mon: { types: ['normal'] } });
  p.slots = [p.moves];
  return { G, p, m: p.moves[0] };
}
test('La carta dorada exige nivel 5 y Potencia, y no reaparece tras evolucionar', () => {
  const { G, p, m } = fixture();
  m.lvl = 4; assert.equal(G.Moves.evoInfo(m, { atk: 1 }), null);
  m.lvl = 5; assert.equal(G.Moves.evoInfo(m, {}).ready, false);
  assert.ok(!G.LevelUp.offer(p).some(c => c.type === 'evo'));
  p.statsTaken.atk = 1;
  const card = G.LevelUp.offer(p).find(c => c.type === 'evo');
  assert.ok(card); assert.match(card.title, /Danza de Mil Espadas/);
  card.apply(p);
  assert.equal(m.name, 'Danza de Mil Espadas'); assert.equal(m.evolved, true);
  assert.equal(G.Moves.evoInfo(m, p.statsTaken), null);
  assert.equal(G.Moves.evolve(m), false);
});
test('Ocho cargas dan exactamente +240% sobre el ataque mejorado y renuevan 12 segundos', () => {
  const { G, p, m } = fixture(); G.Moves.evolve(m);
  assert.equal(m.stacks, 8); assert.ok(Math.abs(m.amount - 0.30) < 1e-12);
  assert.equal(m.dur, 12); assert.equal(m.cd, 0.85);
  for (let i = 0; i < 20; i++) { m.t = 0; G.Combat.tick(0, p, 0); }
  assert.equal(p.buffs.atk.n, 8); assert.ok(Math.abs(p.atk - 6 * 3.4) < 1e-12);
  assert.equal(p.buffs.atk.t, 12); assert.equal(p.buffs.atk.milEspadas, true);
  p.buffs.atk.t = 1; m.t = 0; G.Combat.tick(0, p, 0);
  assert.equal(p.buffs.atk.t, 12); assert.equal(p.buffs.atk.n, 8);
  p.slots.push([]); p.active = 1; G.Combat.tick(1, p, 1);
  assert.equal(p.buffs.atk.n, 8); // cambiar de ataque conserva las cargas
  Object.assign(p, { anim: { update() {}, loop() {} }, frozen: true, baseSpd: 100, spdMul: 1,
    buffs: { ...p.buffs, spd: { n: 0, amount: 0 }, regen: { n: 0, amount: 0 } } });
  G.Weather = { speedFor: () => 1 }; G.World = { collide() {}, isLiquid: () => false, nearestBreakable: () => null };
  G.EnemyMgr = { all: () => [] }; G.Projectiles = { nearest: () => null }; G.Sprites = { dirFromAngle: () => 0 };
  p.update(11.9); assert.equal(p.buffs.atk.n, 8);
  p.update(0.2); assert.equal(p.buffs.atk.n, 0); assert.equal(p.atk, 6);
});
test('Danza Espada conserva su progresión y los demás buffs no obtienen evolución', () => {
  const { G, p, m } = fixture();
  assert.equal(m.stacks, 7); assert.ok(Math.abs(m.amount - 0.2548) < 1e-12); assert.equal(m.dur, 10.5);
  G.Combat.tick(0, p, 0); assert.equal(p.buffs.atk.milEspadas, false);
  for (const d of G.Moves.ALL.filter(d => d.kind === 'buff' && d.id !== 'swords-dance')) {
    const other = G.Moves.instance(d.id, d.maxLvl);
    assert.equal(G.Moves.evoInfo(other, { atk: 1, hp: 1, spd: 1, rgn: 1 }), null);
    assert.equal(G.Moves.evolve(other), false);
  }
  const ember = G.Moves.instance('ember', 5), damage = ember.dmg;
  assert.equal(G.Moves.evolve(ember), true); assert.equal(ember.dmg, damage * 1.8);
});
