/* Coberturas: compatibilidad por especie, selección por Pokémon y datos sin conexión. */
G.Coverage = (() => {
  const MAX = 3;
  const record = value => value && typeof value === 'object' && !Array.isArray(value);
  const species = dex => G.DEX_BY && G.DEX_BY[dex];
  const basePool = mon => mon && Array.isArray(mon.types) ? G.Moves.poolFor(mon) : [];
  const cache = new Map();

  function eligible(mon) {
    if (!mon || !species(mon.dex)) return [];
    const key = `${mon.dex}:${mon.types.join(',')}`;
    if (cache.has(key)) return cache.get(key).slice();
    const data = G.CoverageData;
    const custom = data.custom[mon.dex];
    const learned = custom || (data.learnsets[mon.dex] || []).map(i => data.moves[i]);
    const base = new Set(basePool(mon));
    const result = [...new Set(learned)].filter(id => G.Moves.BY_ID[id] && !base.has(id));
    cache.set(key, result);
    return result.slice();
  }

  function slots(mon, save) {
    const bought = G.Upgrades.perks(((save || {}).pupg || {})[mon.dex] || {}).coverageSlots || 0;
    return Math.min(bought, eligible(mon).length);
  }

  function normalize(mon, value) {
    const valid = new Set(eligible(mon));
    return Array.isArray(value) ? [...new Set(value.filter(id => typeof id === 'string' && valid.has(id)))].slice(0, MAX) : [];
  }

  function selected(mon, save) {
    const entry = ((save || {}).pcoverage || {})[mon.dex];
    return normalize(mon, record(entry) ? entry.moves : []).slice(0, slots(mon, save));
  }

  function withMoves(mon, moves) {
    return [...new Set(basePool(mon).concat(normalize(mon, moves)))];
  }
  const pool = (mon, save) => withMoves(mon, selected(mon, save));

  function choose(mon, save, moves) {
    if (!save || !Array.isArray(moves) || !slots(mon, save)) return false;
    const normalized = normalize(mon, moves);
    // Reject incompatible, duplicate or over-limit submissions instead of silently buying power.
    if (normalized.length !== moves.length || moves.length > slots(mon, save)) return false;
    if (!record(save.pcoverage)) save.pcoverage = {};
    const before = save.pcoverage[mon.dex];
    save.pcoverage[mon.dex] = { moves: normalized, at: Math.max(Date.now(), ((before || {}).at || 0) + 1) };
    return true;
  }

  function cleanEntry(mon, value) {
    if (!record(value)) return null;
    return { moves: normalize(mon, value.moves), at: Number.isSafeInteger(value.at) && value.at >= 0 ? value.at : 0 };
  }

  function sanitize(save) {
    const result = {};
    if (record(save.pcoverage)) for (const [dex, value] of Object.entries(save.pcoverage)) {
      const mon = species(dex), entry = mon && cleanEntry(mon, value);
      if (entry) result[dex] = entry;
    }
    save.pcoverage = result;
  }

  // Per-Pokémon clocks: an unrelated coin sync must not resurrect removed coverage moves.
  // Empty lists are explicit clears and survive merges with older clients.
  function mergeChoices(a = {}, b = {}) {
    const out = {};
    for (const src of [a, b]) if (record(src)) for (const [dex, value] of Object.entries(src)) {
      const mon = species(dex), entry = mon && cleanEntry(mon, value);
      if (!entry) continue;
      const prev = out[dex];
      if (!prev || entry.at > prev.at || (entry.at === prev.at && JSON.stringify(entry.moves) > JSON.stringify(prev.moves))) out[dex] = entry;
    }
    return out;
  }

  return { MAX, eligible, slots, selected, withMoves, pool, choose, sanitize, mergeChoices };
})();
