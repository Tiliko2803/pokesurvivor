/* Independent gift character. Registered for play/rankings, never random spawns or gacha. */
G.Toji = (() => {
  const DEX = 10002;
  const cobalion = G.DEX_BY[638];
  const mon = Object.freeze({ dex: DEX, name: 'Toji Fushiguro',
    types: [...cobalion.types], hp: cobalion.hp, spd: cobalion.spd,
    atk: cobalion.atk, rarity: 5, bst: cobalion.bst, gen: 0, start: 'metal-claw' });
  const durations = {
    Idle: [40], Walk: [7, 7, 7, 7], Attack: [3, 7, 7, 5],
    Shoot: [3, 7, 7, 5], Charge: [6, 10, 6], Hurt: [7, 5], Faint: [7, 40]
  };
  G.DEX_BY[DEX] = mon;
  // Weapon padding belongs to art, not the body used by collisions and life bars.
  G.SPRITE_META[DEX] = { s: 1, bw: 32, bh: 36, a: Object.fromEntries(Object.entries(durations).map(([name, d]) =>
    [name, { w: 80, h: 64, n: d.length, r: 8, d, ax: 40, ay: 55 }])) };
  return { DEX, mon };
})();
