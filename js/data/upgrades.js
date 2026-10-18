/* ============ upgrades.js — mejoras permanentes entre runs ============
 * Se compran con Pokémonedas en el menú. `per` es lo que da cada nivel.
 */
G.Upgrades = (() => {
  const LIST = [
    { id: 'hp',     icon: 'heart', name: 'Vitalidad',      unit: '+8 vida',            max: 10, base: 60,  grow: 1.35 },
    { id: 'atk',    icon: 'fist', name: 'Fuerza',         unit: '+4% daño',           max: 10, base: 80,  grow: 1.38 },
    { id: 'spd',    icon: 'boot', name: 'Zancada',        unit: '+3% velocidad',      max: 8,  base: 70,  grow: 1.4 },
    { id: 'cd',     icon: 'clock', name: 'Reflejos',       unit: '-3% recarga',        max: 8,  base: 90,  grow: 1.42 },
    { id: 'def',    icon: 'shield', name: 'Coraza',         unit: '+2% defensa',        max: 8,  base: 80,  grow: 1.4 },
    { id: 'regen',  icon: 'sprout', name: 'Síntesis',       unit: '+0.2 vida/s',        max: 5,  base: 120, grow: 1.5 },
    { id: 'magnet', icon: 'magnet', name: 'Imán',           unit: '+12% recogida',      max: 6,  base: 50,  grow: 1.4 },
    { id: 'xp',     icon: 'book', name: 'Sabiduría',      unit: '+5% experiencia',    max: 8,  base: 100, grow: 1.42 },
    { id: 'coins',  icon: 'coin', name: 'Fortuna',        unit: '+8% Pokémonedas',    max: 8,  base: 120, grow: 1.45 },
    { id: 'moves',  icon: 'cards', name: 'Repertorio',     unit: 'Empiezas con 2 movimientos', max: 1, base: 1500, grow: 1 },
    { id: 'crit',   icon: 'star', name: 'Golpe Crítico',  unit: '+3% de probabilidad de crítico', max: 10, base: 90, grow: 1.4 },
    { id: 'reroll', icon: 'up', name: 'Cambio de cartas', unit: '+1 cambio de cartas de nivel por run', max: 5, base: 150, grow: 1.6 },
    { id: 'ban',    icon: 'ban', name: 'Veto',           unit: 'Bloquea 1 movimiento: no te sale en las cartas', max: 3, base: 300, grow: 1.9 },
    { id: 'critDamage', icon: 'star', name: 'Golpe Devastador', unit: '+0.1 al multiplicador crítico (máx. x2)', max: 5, base: 250, grow: 1.5 },
    { id: 'area', icon: 'magnet', name: 'Expansión', unit: '+5% de tamaño de áreas y proyectiles (máx. +20%)', max: 4, base: 250, grow: 1.5 },
    { id: 'duration', icon: 'clock', name: 'Persistencia', unit: '+5% de duración de buffs, minas, torretas y rastros (máx. +25%)', max: 5, base: 200, grow: 1.5 },
    { id: 'drain', icon: 'heart', name: 'Drenaje', unit: '+0.2 vida por enemigo derrotado por tu equipo (máx. 1; tope 2 vida/s)', max: 5, base: 300, grow: 1.5 },
    { id: 'lastBreath', icon: 'shield', name: 'Último Aliento', unit: 'Sobrevives con 1 vida y 3 s de invulnerabilidad, una vez por run', max: 1, base: 2500, grow: 1 },
    { id: 'options', icon: 'cards', name: 'Más Opciones', unit: '+1 carta a elegir por nivel (4 / 5 / 6); recibes una', max: 3, base: 2000, grow: 1, prices: [2000, 6000, 15000] },
    { id: 'coverage', icon: 'book', name: 'Coberturas', unit: '+1 movimiento compatible de otros tipos para elegir (máx. 3)', max: 3, base: 1500, grow: 1, prices: [1500, 4000, 10000] }
  ];
  const BY = {};
  for (const u of LIST) BY[u.id] = u;

  function cost(id, lvl) {
    const u = BY[id];
    return u.prices ? u.prices[lvl] : Math.round(u.base * Math.pow(u.grow, lvl) / 10) * 10;
  }

  /** Niveles comprados -> modificadores para G.Player. */
  function perks(levels = {}) {
    // Nunca por encima del máximo (una partida editada a mano no da más poder).
    const L = id => Math.max(0, Math.min(BY[id].max, Math.floor(+levels[id] || 0)));
    return {
      hp: L('hp') * 8,
      atkMul: 1 + L('atk') * 0.04,
      spdMul: 1 + L('spd') * 0.03,
      cdMul: 1 - L('cd') * 0.03,
      dmgReduce: L('def') * 0.02,
      regen: L('regen') * 0.2,
      magnetMul: 1 + L('magnet') * 0.12,
      xpMul: 1 + L('xp') * 0.05,
      coinMul: 1 + L('coins') * 0.08,
      startMoves: 1 + L('moves'),
      crit: L('crit') * 0.03,
      rerolls: L('reroll'),
      bans: L('ban'),
      critMul: 1.5 + L('critDamage') * 0.1,
      areaMul: 1 + L('area') * 0.05,
      durationMul: 1 + L('duration') * 0.05,
      drainPerKill: L('drain') * 0.2,
      lastBreath: L('lastBreath') > 0,
      cardOptions: 3 + L('options'),
      coverageSlots: L('coverage')
    };
  }

  return { LIST, BY, cost, perks };
})();
