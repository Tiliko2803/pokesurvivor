/* Boss Rush selection and progression; no changes to normal survival enemies. */
G.BossRushRules = (() => {
  // User-defined major group, including cover legends and expansion protagonists.
  const MAJORS = new Set([150,249,250,382,383,384,483,484,487,493,643,644,646,
    716,717,718,791,792,800,888,889,890,892,898,1007,1008,1017,1024]);
  const eligibleMinor = (mon, meta) => !!mon && !!mon.leg && Number.isInteger(mon.dex) &&
    mon.dex > 0 && mon.dex <= 1025 && !MAJORS.has(mon.dex) && !!meta?.[mon.dex];
  function selectMinors(dex, meta, count = 2, random = Math.random) {
    const pool = [...new Map(dex.filter(p => eligibleMinor(p, meta)).map(p => [p.dex,p])).values()];
    if (!Number.isInteger(count) || count < 0 || pool.length < count) throw new Error('No hay suficientes legendarios menores disponibles.');
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.min(i, Math.max(0, Math.floor(random() * (i + 1))));
      [pool[i],pool[j]] = [pool[j],pool[i]];
    }
    return pool.slice(0, count).map(p => p.dex);
  }
  function minorStats(encounterIndex) {
    if (!Number.isSafeInteger(encounterIndex) || encounterIndex < 1) throw new Error('Posición de menor inválida.');
    const n = encounterIndex - 1;
    return { hp: Math.round(3200 * 1.18 ** n), damage: Math.round(27 * 1.07 ** n),
      attackRate: Math.min(1.30, 1 + 0.035 * n) };
  }
  function bossHp(baseHp, playerCount = 1) {
    const count = Number.isSafeInteger(playerCount) && playerCount > 0 ? playerCount : 1;
    return Math.round(baseHp * count);
  }
  // Change only the wait between casts. Do not accelerate tells, movement, or projectiles.
  function extraCooldownDecay(attackRate, fury) {
    const normal = fury ? 1.25 : 1;
    return Math.max(0, Math.min(1.5, normal * attackRate) - normal);
  }
  function rewardXp(xpFor, level, levels = 3) {
    let total = 0;
    for (let i = 0; i < levels; i++) total += xpFor(level + i);
    return total;
  }
  return { eligibleMinor, selectMinors, minorStats, bossHp, extraCooldownDecay, rewardXp };
})();
