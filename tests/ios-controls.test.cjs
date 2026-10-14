'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const touchCode = fs.readFileSync(path.join(root, 'js/core/touch.js'), 'utf8');
const gameCode = fs.readFileSync(path.join(root, 'js/game.js'), 'utf8').replace(/\r\n/g, '\n');
const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');

function setup(hasTouchEvents = true) {
  const callbacks = {}, docCallbacks = {};
  let now = 1000, viewport = {left: 15, top: 20, width: 400, height: 200};
  const canvas = {
    clientWidth: 800, clientHeight: 400,
    getBoundingClientRect: () => viewport,
    addEventListener: (key, fn) => { callbacks[key] = fn; },
    setPointerCapture() {}
  };
  const document = {
    body: {classList: {add() {}}},
    addEventListener: (key, fn) => { docCallbacks[key] = fn; }
  };
  const G = {Game: {state:'playing'}, Settings: {touch:true, get: () => 1}};
  const window = hasTouchEvents ? {ontouchstart:null} : {};
  vm.runInNewContext(touchCode, {G, window, document, performance:{now:()=>now}, addEventListener(){}});
  G.Touch.init(canvas);
  const touch = (id,x,y) => ({identifier:id,clientX:x,clientY:y});
  const evt = changedTouches => ({changedTouches,cancelable:true,preventDefault(){}});
  return {G,canvas,callbacks,docCallbacks,touch,evt,now:v=>{now=v;},viewport:v=>{viewport=v;}};
}

test('iOS: segundo dedo selecciona ataque mientras el primero mueve el joystick', () => {
  const s = setup();
  let attacks = 0;
  s.G.Touch.addButton(500,280,54,54,()=>attacks++,6);
  s.callbacks.pointerdown({pointerType:'touch',pointerId:21,clientX:65,clientY:80,preventDefault(){}});
  assert.equal(s.G.Touch.stick, null, 'Safari PointerEvent debe esperar TouchEvent');
  s.callbacks.touchstart(s.evt([s.touch(1,65,80)]));
  s.callbacks.touchmove(s.evt([s.touch(1,95,80)]));
  assert.ok(s.G.Touch.vector()[0]>0.8, 'joystick sigue funcionando');
  s.callbacks.touchstart(s.evt([s.touch(2,265,160)]));
  assert.equal(attacks,1);
  s.callbacks.touchend(s.evt([s.touch(2,265,160)]));
  assert.ok(s.G.Touch.stick, 'soltar el ataque no suelta el joystick');
  s.callbacks.touchstart(s.evt([s.touch(3,265,160)]));
  assert.equal(attacks,2, 'se permite volver a tocar rápidamente');
  s.callbacks.touchend(s.evt([s.touch(1,95,80)]));
  assert.equal(s.G.Touch.stick, null);
});

test('iOS: hitboxes correctas cuando Safari desplaza o escala el canvas', () => {
  const s = setup();
  let pressCount = 0;
  s.G.Touch.addButton(20,20,54,54,()=>pressCount++,0);
  s.viewport({left:80,top:40,width:400,height:200});
  // El canvas interno tiene 800x400, factor 2 respecto de su rectángulo.
  s.callbacks.touchstart(s.evt([s.touch(2,90,50)]));
  assert.equal(pressCount,1,'toque convertido a coordenadas CSS del canvas');
});

test('Sin TouchEvents: conserva pointer events y ratón', () => {
  const s=setup(false);
  let presses=0;
  s.G.Touch.addButton(100,100,54,54,()=>presses++,0);
  s.callbacks.pointerdown({pointerType:'mouse',pointerId:1,clientX:65,clientY:70,preventDefault(){}});
  assert.equal(presses,1,'clic de escritorio');
  s.callbacks.pointerdown({pointerType:'touch',pointerId:2,clientX:65,clientY:70,preventDefault(){}});
  assert.equal(presses,2,'fallback táctil con PointerEvents');
});

test('iOS: el resize mantiene el canvas y la cámara proporcionales al área visible', () => {
  const match=gameCode.match(/  function resize\(\) \{([\s\S]*?)\n  \}\n\n  \/\*\* Móvil/);
  assert.ok(match, 'no se encontró resize del juego');
  const calls=[]; let writes=0, width=844, height=390;
  const cv = {
    getBoundingClientRect:()=>({width,height}),
    get clientWidth(){return width;},get clientHeight(){return height;},
    get width(){return this._w||0;},set width(v){this._w=v;writes++;},
    get height(){return this._h||0;},set height(v){this._h=v;writes++;}
  };
  const context={cv,G:{Camera:{resize:(...args)=>calls.push(args)}},
    window:{devicePixelRatio:3},checkOrientation(){},Math,w:0,h:0,dpr:1};
  vm.createContext(context);
  vm.runInContext('function resize() {'+match[1]+'\n}\nresize();',context);
  assert.deepEqual(Array.from(calls.at(-1)),[844,390,1.5]);
  assert.equal(cv.width,1266);assert.equal(cv.height,585);
  vm.runInContext('resize()',context);
  assert.equal(writes,2,'si no cambia tamaño no debe vaciar canvas');
  width=760;height=360;
  vm.runInContext('resize()',context);
  assert.deepEqual(Array.from(calls.at(-1)),[760,360,1.5]);
  assert.equal(cv.width,1140);assert.equal(cv.height,540);
  assert.match(css,/#game\s*\{[^}]*position:\s*fixed;/);
  assert.match(css,/#game\s*\{[^}]*height:\s*100dvh;/);
});
