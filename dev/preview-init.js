/* Vista de desarrollo aislada: no carga la cuenta real ni guarda en Firebase. */
(() => {
  // La prueba siempre crea una sesión temporal (en memoria).
  // No se alteran ni el usuario ni los guardados existentes.
  G.DB.ready = async () => {
    let former;
    try { former = localStorage.getItem('ps.session'); } catch (_) {}
    G.DB.playAsGuest();
    // playAsGuest elimina la sesión local en algunas configuraciones:
    // conservarla para no cerrar la cuenta normal al volver al juego público.
    if (former != null) {
      try { localStorage.setItem('ps.session', former); } catch (_) {}
    }
    const save = G.DB.save;
    save.partner = 260;
    save.starter = 260;
    save.owned[260] = { at: Date.now(), from: 'mega-preview' };
    save.megaStones = { swampertite: Date.now() };
    save.megaEquipped = { 260: 'swampertite' };
    save.megaProgress = { swampertBosses: 3 };
    save.partnerShiny = false;
    return true;
  };
  // La versión de prueba no debe recargarse por los cambios en producción.
  if (G.Updater) G.Updater.init = () => {};
})();
