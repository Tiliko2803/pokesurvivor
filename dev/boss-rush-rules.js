/* Boss Rush selection and progression; no changes to normal survival enemies. */
G.BossRushRules = (() => {
  const MAJOR_STAGES = Object.freeze({ groudon: 1, kyogre: 3, rayquaza: 5 });
  const MINOR_STAGES = Object.freeze([0, 4]);
  const HOENN_MINORS = Object.freeze([377, 378, 379, 380, 381, 385]);
  // Fixed encounter budgets; never read the player's damage or build during a run.
  const MINOR_HP = Object.freeze([44000, 600000]);
  // User-defined major group, including cover legends and expansion protagonists.
  const MAJORS = new Set([150,249,250,382,383,384,483,484,487,493,643,644,646,
    716,717,718,791,792,800,888,889,890,892,898,1007,1008,1017,1024]);
  const eligibleMinor = (mon, meta) => !!mon && !!mon.leg && Number.isInteger(mon.dex) &&
    HOENN_MINORS.includes(mon.dex) && !MAJORS.has(mon.dex) && !!meta?.[mon.dex];
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
    const n = MINOR_STAGES.indexOf(encounterIndex);
    if (n < 0) throw new Error('Posición de menor inválida.');
    return { hp: MINOR_HP[n], damage: n===0?21:Math.round(30 * 1.10 ** (n+3)),
      attackRate: n===0?1.12:Math.min(1.35, 1.12 + 0.045 * (n+3)) };
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
  // Group rewards are paid once: two base levels for the Regis, six for the Eon duo and Jirachi.
  const rewardLevels = stage => stage === 0 ? 2 : stage === 2 || stage === 4 ? 6 : 3;
  return { MAJOR_STAGES, MINOR_STAGES, HOENN_MINORS, eligibleMinor, selectMinors, minorStats, bossHp, extraCooldownDecay, rewardXp, rewardLevels };
})();
