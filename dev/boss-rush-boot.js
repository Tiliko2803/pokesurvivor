/* Preview boot: no service worker registration or production updater. */
(() => {
  function boot() {
    G.I18n.startDom();
    const ready = document.fonts?.load ? document.fonts.load('16px Pixelify') : Promise.resolve();
    ready.catch(() => {}).then(() => G.Flow.boot());
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
  else boot();
})();
