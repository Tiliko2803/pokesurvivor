/* ============ touch.js — controles táctiles ============
 * Joystick flotante: pones el dedo en cualquier sitio de la pantalla de juego
 * y ahí aparece; arrastras para moverte y al soltar desaparece. Si el dedo se
 * aleja más que el radio, la base le sigue (nunca se queda "atascado").
 *
 * Botones del HUD (iconos de ataque, pausa): el HUD los registra en cada
 * fotograma con addButton(); un toque (o un clic con el ratón) sobre uno lo
 * pulsa en vez de abrir el joystick. Varios dedos a la vez funcionan.
 */
G.Touch = (() => {
  let cv = null, stick = null, aimStick = null;
  let active = G.Settings.touch;      // ¿se está usando táctil?
  let buttons = [];

  const R = () => 56 * (G.Settings.get('stick') || 1);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  /** Centros de botones en proporción al tamaño de pantalla, o null. */
  function spot(k) {
    const p = G.Settings.get('pad');
    const v = p && p[k];
    return Array.isArray(v) && v.length === 2 && v.every(n => typeof n === 'number' && Number.isFinite(n)) ? v : null;
  }
  const STICK_DEF = [0.14, 0.72];
  const AIM_DEF = [0.86, 0.70];
  const manual = () => G.Settings.get('aimManual') === true;
  function aimBase(w = cv.clientWidth, h = cv.clientHeight) {
    const p = spot('aim') || AIM_DEF, rad = R();
    return { x: clamp(p[0] * w, rad + 4, Math.max(rad + 4, w - rad - 4)),
             y: clamp(p[1] * h, rad + 4, Math.max(rad + 4, h - rad - 4)) };
  }
  const fixed = () => G.Settings.get('stickMode') === 'fixed';
  /** Centro del joystick fijo, medido en píxeles CSS del canvas. */
  function stickBase(w = cv.clientWidth, h = cv.clientHeight) {
    const p = spot('stick') || STICK_DEF, rad = R();
    return { x: clamp(p[0] * w, rad + 4, Math.max(rad + 4, w - rad - 4)),
             y: clamp(p[1] * h, rad + 4, Math.max(rad + 4, h - rad - 4)) };
  }

  // Se usan TouchEvents como fuente principal en iOS/Android: permiten que
  // un dedo mantenga el joystick y otro pulse movimientos sin competir con
  // pointer capture. PointerEvents quedan para ratón, lápiz y navegadores sin
  // TouchEvents.
  let lastTouchAt = -Infinity;

  function enableTouch() {
    if (!active) { active = true; document.body.classList.add('touch'); }
  }

  // El HUD y el joystick se dibujan en píxeles CSS del canvas, NO en
  // coordenadas del viewport. Safari puede mover o redimensionar el canvas
  // al mostrar/ocultar barras; convertir siempre desde su rectángulo real.
  function point(clientX, clientY) {
    const r = cv.getBoundingClientRect();
    return {
      x: (clientX - r.left) * (r.width ? cv.clientWidth / r.width : 1),
      y: (clientY - r.top) * (r.height ? cv.clientHeight / r.height : 1)
    };
  }

  function init(canvas) {
    cv = canvas;
    if (active) document.body.classList.add('touch');
    cv.addEventListener('touchstart', touchStart, { passive: false });
    cv.addEventListener('touchmove', touchMove, { passive: false });
    cv.addEventListener('touchend', touchEnd, { passive: false });
    cv.addEventListener('touchcancel', touchEnd, { passive: false });
    cv.addEventListener('pointerdown', down);
    cv.addEventListener('pointermove', move);
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('selectstart', e => {
      if (!e.target.closest || !e.target.closest('input, textarea, [contenteditable]')) e.preventDefault();
    });
    addEventListener('blur', reset);
    document.addEventListener('visibilitychange', reset);
  }

  function hit(x, y) {
    for (let i = buttons.length - 1; i >= 0; i--) {
      const b = buttons[i];
      if (x >= b.x - b.pad && x <= b.x + b.w + b.pad &&
          y >= b.y - b.pad && y <= b.y + b.h + b.pad) return b;
    }
    return null;
  }

  // Cada pulsación física pasa por una sola ruta de eventos. No se aplica un
  // bloqueo de 350 ms: también se puede alternar movimientos rápidamente.
  function press(b) { b.fn(); }

  function startStick(id, source, x, y) {
    if (stick || !G.Game || G.Game.state !== 'playing') return false;
    if (fixed()) {
      const base = stickBase();
      // En modo fijo, un toque lejano no mueve al Pokémon.
      if (Math.hypot(x - base.x, y - base.y) > R() * 2.2) return false;
      stick = { id, source, fixed: true, ox: base.x, oy: base.y, x, y };
    } else {
      stick = { id, source, ox: x, oy: y, x, y };
    }
    return true;
  }

  // Cada dedo conserva su joystick hasta soltarlo; el HUD tiene prioridad.
  function startControl(id, source, x, y) {
    if (manual() && G.Game?.state === 'playing') {
      const b = aimBase();
      if (Math.hypot(x - b.x, y - b.y) <= R() * 1.6) {
        if (aimStick) return false;
        aimStick = { id, source, ox: b.x, oy: b.y, x, y };
        return true;
      }
      if (x > cv.clientWidth * 0.5) return false;
    }
    return startStick(id, source, x, y);
  }

  function moveStick(x, y) {
    if (!stick) return;
    stick.x = x; stick.y = y;
    if (stick.fixed) return; // el centro del joystick fijo no sigue al dedo
    const dx = x - stick.ox, dy = y - stick.oy, d = Math.hypot(dx, dy), r = R();
    if (d > r) { stick.ox = x - dx / d * r; stick.oy = y - dy / d * r; }
  }

  function touchStart(e) {
    lastTouchAt = performance.now();
    if (e.cancelable) e.preventDefault();
    enableTouch();
    for (const t of e.changedTouches) {
      const p = point(t.clientX, t.clientY);
      const b = hit(p.x, p.y);
      if (b) { press(b); continue; }
      startControl(t.identifier, 'touch', p.x, p.y);
    }
  }

  function touchMove(e) {
    if (e.cancelable) e.preventDefault();
    for (const t of e.changedTouches) {
      const p = point(t.clientX, t.clientY);
      if (stick?.source === 'touch' && t.identifier === stick.id) moveStick(p.x, p.y);
      if (aimStick?.source === 'touch' && t.identifier === aimStick.id) { aimStick.x = p.x; aimStick.y = p.y; }
    }
  }

  function touchEnd(e) {
    if (e.cancelable) e.preventDefault();
    for (const t of e.changedTouches) {
      if (stick?.source === 'touch' && t.identifier === stick.id) stick = null;
      if (aimStick?.source === 'touch' && t.identifier === aimStick.id) aimStick = null;
    }
  }

  function down(e) {
    // En WebKit pointerdown y touchstart pueden llegar por el MISMO dedo.
    if (e.pointerType === 'touch' && 'ontouchstart' in window) return;
    if (e.pointerType === 'mouse' && performance.now() - lastTouchAt < 700) return;
    const touchy = e.pointerType !== 'mouse';
    if (touchy) enableTouch();
    const p = point(e.clientX, e.clientY);
    const b = hit(p.x, p.y);
    if (b) { e.preventDefault(); press(b); return; }
    if (!touchy || !startControl(e.pointerId, 'pointer', p.x, p.y)) return;
    e.preventDefault();
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* nada */ }
  }

  function move(e) {
    const p = point(e.clientX, e.clientY);
    if (stick?.source === 'pointer' && e.pointerId === stick.id) moveStick(p.x, p.y);
    if (aimStick?.source === 'pointer' && e.pointerId === aimStick.id) { aimStick.x = p.x; aimStick.y = p.y; }
  }

  function up(e) {
    if (stick && stick.source === 'pointer' && e.pointerId === stick.id) stick = null;
    if (aimStick?.source === 'pointer' && e.pointerId === aimStick.id) aimStick = null;
  }
  function reset() { stick = null; aimStick = null; }
  addEventListener('resize', reset);
  addEventListener('orientationchange', reset);
  if (G.Settings.on) G.Settings.on(k => { if (['aimManual', 'pad', 'stick', 'stickMode'].includes(k)) reset(); });

  /** Stick derecho: zona muerta pequeña y apuntado automático al soltar. */
  function aim() {
    if (!manual() || G.Game?.state !== 'playing' || !aimStick) return null;
    const dx = aimStick.x - aimStick.ox, dy = aimStick.y - aimStick.oy, d = Math.hypot(dx, dy);
    return d < 7 ? null : [dx / d, dy / d];
  }

  /** Dirección del joystick (con fuerza 0..1), o null si no se usa. */
  function vector() {
    if (!stick) return null;
    const dx = stick.x - stick.ox, dy = stick.y - stick.oy, d = Math.hypot(dx, dy);
    if (d < 7) return [0, 0];
    // A partir de medio radio ya va a toda velocidad.
    const k = Math.min(1, (d - 7) / (R() * 0.5 - 7));
    return [dx / d * k, dy / d * k];
  }

  /** Márgenes del iPhone (barra de inicio abajo, muesca a los lados), en px. */
  let safe = null;
  function safeArea() {
    if (safe) return safe;
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;' +
      'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
    document.body.appendChild(d);
    const cs = getComputedStyle(d);
    safe = { top: parseFloat(cs.paddingTop) || 0, right: parseFloat(cs.paddingRight) || 0,
             bottom: parseFloat(cs.paddingBottom) || 0, left: parseFloat(cs.paddingLeft) || 0 };
    d.remove();
    return safe;
  }
  addEventListener('resize', () => { safe = null; });
  addEventListener('orientationchange', () => { safe = null; });

  /** El HUD vacía y vuelve a registrar sus botones cada fotograma. */
  function clearButtons() { buttons = []; }
  function addButton(x, y, w, h, fn, pad = 6) { buttons.push({ x, y, w, h, fn, pad }); }

  /** Dibuja el joystick (coordenadas de pantalla, CSS px). */
  function draw(ctx) {
    const base = !stick && fixed() && active && G.Game && G.Game.state === 'playing' ? stickBase() : null;
    if (stick || base) {
      const s = stick || { ox: base.x, oy: base.y, x: base.x, y: base.y };
      drawStick(ctx, s, R(), base ? 0.55 : 1);
    }
    if (active && manual() && G.Game?.state === 'playing') {
      const b = aimBase(), a = aimStick || { ox: b.x, oy: b.y, x: b.x, y: b.y };
      drawStick(ctx, a, R(), aimStick ? 1 : 0.55);
      ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = '#f4f8ff';
      ctx.font = '700 12px Pixelify, monospace'; ctx.textAlign = 'center';
      ctx.fillText('APUNTAR', b.x, b.y - R() - 9); ctx.restore();
    }
  }

  function drawStick(ctx, stick, r, opacity = 1) {
    const dx = stick.x - stick.ox, dy = stick.y - stick.oy, d = Math.hypot(dx, dy);
    const kx = stick.ox + (d > r ? dx / d * r : dx), ky = stick.oy + (d > r ? dy / d * r : dy);
    ctx.save();
    ctx.globalAlpha = 0.5 * opacity;
    ctx.fillStyle = 'rgba(10,20,48,.55)';
    ctx.beginPath(); ctx.arc(stick.ox, stick.oy, r, 0, 6.2832); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#f4f8ff';
    ctx.stroke();
    ctx.globalAlpha = 0.85 * opacity;
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath(); ctx.arc(kx, ky, r * 0.42, 0, 6.2832); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#a55f00'; ctx.stroke();
    ctx.restore();
  }

  return { init, vector, aim, aimBase, AIM_DEF, draw, drawStick, clearButtons, addButton, reset, safeArea, spot, stickBase, R, STICK_DEF,
           get active() { return active; }, get stick() { return stick; }, get aimStick() { return aimStick; } };
})();
