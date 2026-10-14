'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const load=(p)=>fs.readFileSync(path.join(root,p),'utf8');
function setup(mode='float',pad=null) {
  let now=1000; const handlers={},store={stick:1,stickMode:mode,pad};
  const G={Settings:{touch:true,get(k){return store[k]},set(k,v){store[k]=v}},Game:{state:'playing'}};
  const cv={clientWidth:800,clientHeight:400,
    getBoundingClientRect(){return {left:0,top:0,width:400,height:200}},
    addEventListener(k,fn){handlers[k]=fn},setPointerCapture(){}};
  const doc={body:{classList:{add(){}}},addEventListener(){}};
  vm.runInNewContext(load('js/core/touch.js'),{
    G,document:doc,window:{ontouchstart:null},addEventListener(){},
    performance:{now:()=>now}
  });
  G.Touch.init(cv);
  const t=(identifier,clientX,clientY)=>({identifier,clientX,clientY});
  const event=(...changedTouches)=>({changedTouches,cancelable:true,preventDefault(){}});
  return {G,cv,handlers,t,event,store};
}
test('Joystick fijo aparece donde se guardó y no responde a toques lejanos',()=>{
  const s=setup('fixed',{stick:[0.15,0.6]});
  const base=s.G.Touch.stickBase();
  assert.equal(base.x,120);assert.equal(base.y,240);
  s.handlers.touchstart(s.event(s.t(10,350,170)));
  assert.equal(s.G.Touch.stick,null,'no debe abrirse lejos del joystick');
  s.handlers.touchstart(s.event(s.t(11,60,120)));
  assert.ok(s.G.Touch.stick.fixed);
  assert.equal(s.G.Touch.stick.ox,120);
  s.handlers.touchmove(s.event(s.t(11,86,120)));
  assert.ok(s.G.Touch.vector()[0]>0.7);
  assert.equal(s.G.Touch.stick.ox,120,'el centro fijo no debe seguir el dedo');
  s.handlers.touchend(s.event(s.t(11,86,120)));
  assert.equal(s.G.Touch.stick,null);
});
test('Joystick fijo mantiene movimiento con segundo dedo cambiando ataque en iOS',()=>{
  const s=setup('fixed',{stick:[0.15,0.6],bar:[0.5,0.8]});
  let taps=0;
  s.G.Touch.addButton(500,280,54,54,()=>taps++);
  s.handlers.touchstart(s.event(s.t(1,60,120)));
  s.handlers.touchmove(s.event(s.t(1,90,120)));
  s.handlers.touchstart(s.event(s.t(2,250,140)));
  assert.equal(taps,1);
  s.handlers.touchend(s.event(s.t(2,250,140)));
  assert.ok(s.G.Touch.stick,'al soltar el ataque no termina el movimiento');
  s.handlers.touchend(s.event(s.t(1,90,120)));
  assert.equal(s.G.Touch.stick,null);
  assert.equal(Array.from(s.G.Touch.spot('bar')).join(','),'0.5,0.8');
});
test('Modo flotante permite crear joystick en cualquier zona libre',()=>{
  const s=setup('float');
  s.handlers.touchstart(s.event(s.t(4,330,155)));
  assert.ok(s.G.Touch.stick);
  assert.equal(s.G.Touch.stick.fixed,undefined);
  s.handlers.touchmove(s.event(s.t(4,360,155)));
  assert.ok(s.G.Touch.vector()[0]>0.7);
});
test('Editor de controles se carga sin alterar cuenta ni servicio de nube',()=>{
  const dev=load('dev.html'),pub=load('index.html');
  const scripts=h=>[...h.matchAll(/<script defer src="(js\/[^"]+\.js)(?:\?[^"]+)?"\s*><\/script>/g)].map(v=>v[1]);
  assert.ok(scripts(dev).includes('js/ui/layout-ui.js'));
  assert.deepEqual(scripts(dev),scripts(pub));
  const editor=load('js/ui/layout-ui.js');
  assert.match(editor,/G\.Settings\.set\('pad',/);
  assert.match(editor,/G\.Settings\.set\('stickMode',/);
  assert.doesNotMatch(editor,/G\.DB\.|G\.FIREBASE_CONFIG|firebase/);
  assert.match(load('js/ui/settings-ui.js'),/id="set-layout"/);
  assert.match(load('js/ui/hud.js'),/G\.Touch\.spot\('bar'\)/);
  assert.match(load('js/ui/hud.js'),/G\.Touch\.spot\('pause'\)/);
  assert.match(load('LICENSE-NONCOMMERCIAL.md'),/Required Notice: Copyright 2026 JPTER78/);
});
