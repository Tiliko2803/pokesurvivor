/* Repertorio: elección por Pokémon del ataque adicional de inicio. */
G.Repertoire = (() => {
  function initialMove(mon) {
    if(mon.dex===47&&mon.megaStone==='parasectite')return 'shadow-ball';
    if(mon.dex===959&&mon.megaStone==='tinkatonite')return 'gigaton-hammer';
    if(mon.dex===257&&mon.megaStone==='blazikenite')return 'karate-chop';
    return mon.dex === 260 && mon.megaStone === 'swampertite' ? 'bulldoze' : G.startMoveOf(mon.dex);
  }

  function pool(mon, save, known = [initialMove(mon)]) {
    const perks = G.Upgrades.perks((save.pupg || {})[mon.dex] || {});
    const banned = new Set(((save.pban || {})[mon.dex] || []).slice(0, perks.bans));
    const learnable = G.Coverage ? G.Coverage.pool(mon, save) : G.Moves.poolFor(mon);
    return learnable.filter(id =>
      !known.includes(id) && !banned.has(id) && G.Moves.BY_ID[id] && G.Moves.BY_ID[id].kind !== 'buff');
  }

  function selected(mon, save, known) {
    const id = (save.prepertoire || {})[mon.dex];
    return pool(mon, save, known).includes(id) ? id : null;
  }

  function choose(mon, save, id) {
    if (G.Upgrades.perks((save.pupg || {})[mon.dex] || {}).startMoves < 2) return false;
    if (id !== null && !pool(mon, save).includes(id)) return false;
    save.prepertoire = save.prepertoire || {};
    save.prepertoire[mon.dex] = id;
    return true;
  }

  return { initialMove, pool, selected, choose };
})();
