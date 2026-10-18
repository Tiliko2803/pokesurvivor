const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.join(__dirname, '..');
function fixture() {
  const ctx = vm.createContext({ G: {} });
  vm.runInContext(fs.readFileSync(path.join(root, 'dev/groudon.js'), 'utf8'), ctx);
  const boss = { x: 0, y: -65, r: 28, hp: 18000, maxHp: 18000, dead: false };
  const p = { x: 0, y: 80, r: 12, dead: false }, ps = [p], hits = [], events = [];
  const e = new ctx.G.Groudon.Encounter({ boss, players: () => ps,
    hit: (...args) => { hits.push(args); }, signal: (...args) => events.push(args), random: () => 0.5 });
  const tick = seconds => { for (let i = 0; i < Math.round(seconds * 100); i++) e.update(0.01); };
  return { ...ctx.G.Groudon, boss, p, ps, hits, events, e, tick };
}
test('Filo: aviso completo, marcas fijas y un solo impacto por jugador', () => {
  const { e, p, hits, tick } = fixture(); e.begin('blades');
  tick(e.attack.warn - 0.05); assert.equal(hits.length, 0);
  tick(0.1); assert.equal(hits.length, 1);
  tick(0.2); assert.equal(hits.length, 1);
  assert.equal(hits[0][1], 42); assert.equal(hits[0][2], 'ground');
  assert.equal(e.attack.hit.has(p), true);
});
test('Se puede salir caminando de cada aviso con 130 unidades/s', () => {
  for (const kind of ['blades', 'stomp', 'eruption', 'charge']) {
    const { e, p, hits, contains } = fixture(); p.y = kind === 'stomp' ? -65 : 70; e.begin(kind);
    const a = e.attack;
    let goal = null;
    for (let x = -275; x <= 275; x += 10) for (let y = -125; y <= 125; y += 10) {
      const candidate = { x, y, r: p.r };
      if (!a.shapes.some(s => contains(s, candidate))) {
        const distance = Math.hypot(x - p.x, y - p.y);
        if (!goal || distance < goal.distance) goal = { x, y, distance };
      }
    }
    assert.ok(goal && goal.distance / 130 < a.warn - 0.2, kind + ': falta tiempo de reacción');
    p.x = goal.x; p.y = goal.y;
    for (let i = 0; i < (a.warn + a.active) * 100; i++) e.update(0.01);
    assert.equal(hits.length, 0, kind);
  }
});
test('Erupción congela el blanco y la lava expira', () => {
  const { e, p, hits, tick } = fixture(); e.begin('eruption');
  const x = e.attack.shapes[0].x; p.x = 200;
  tick(1.8); assert.equal(hits.length, 0); assert.equal(e.hazards[0].x, x);
  assert.ok(e.hazards[0].start > e.clock); tick(6); assert.equal(e.hazards.length, 0);
});
test('Umbrales 70/35 y Ruptura una sola vez sin saltarse el ataque activo', () => {
  const { e, boss, events, tick } = fixture(); e.begin('stomp');
  boss.hp = boss.maxHp * 0.7; tick(0.01); assert.equal(e.phase, 2);
  boss.hp = boss.maxHp * 0.35; tick(0.01); assert.equal(e.phase, 3);
  assert.equal(e.attack.kind, 'stomp'); tick(7);
  assert.equal(events.filter(ev => ev[0] === 'attack' && ev[1].kind === 'rupture').length, 1);
  tick(25); assert.equal(events.filter(ev => ev[0] === 'attack' && ev[1].kind === 'rupture').length, 1);
});
test('Ruptura limpia lava y ofrece refugio al borde de la arena', () => {
  for (const y of [-138, 138, 0]) {
    const { e, p, hits, tick, contains } = fixture(); p.y = y;
    e.hazards = [{ x: p.x, y: p.y, r: 40, end: 99 }]; e.begin('rupture');
    assert.equal(e.hazards.length, 0);
    const a = e.attack, targetY = (a.safe.top + a.safe.bottom) / 2;
    assert.ok(Math.abs(targetY - p.y) / 130 < 1.8);
    p.y = targetY; tick(2.4); assert.equal(hits.length, 0);
    assert.ok(!a.shapes.some(s => contains(s, p))); assert.equal(e.recovering, true);
    tick(2.2); assert.equal(e.attack.kind, 'rupture'); tick(0.3); assert.equal(e.attack, null);
  }
});
test('Carga recorre su corredor, no daña por delante y recupera 1.35 segundos', () => {
  const { e, p, boss, hits, tick } = fixture(); p.y = 110; e.begin('charge');
  const a = e.attack, y = boss.y; tick(a.warn - 0.02); assert.equal(boss.y, y); assert.equal(hits.length, 0);
  tick(0.7); assert.equal(e.recovering, true); assert.equal(hits.length, 1);
  assert.ok(boss.y > y); assert.equal(a.recovery, 1.35);
});
test('Cuatro jugadores: un impacto para cada uno, máximo cuatro charcos', () => {
  const { e, p, ps, hits, tick } = fixture();
  for (let i = 0; i < 3; i++) ps.push({ ...p });
  e.begin('eruption'); assert.equal(e.attack.shapes.length, 4); tick(1.75);
  assert.equal(hits.length, 4); assert.equal(e.hazards.length, 4);
});
test('Movimientos reales: tipos y retroceso de Doble Filo sobre daño efectivo', () => {
  const { e, events, tick } = fixture();
  e.hit = () => 30; e.begin('charge');
  assert.equal(e.attack.name, 'Doble Filo'); assert.equal(e.attack.type, 'normal'); tick(2);
  assert.ok(events.some(ev => ev[0] === 'recoil' && ev[1] === 10));
  const f = fixture(); f.e.begin('rupture'); assert.equal(f.e.attack.name, 'Terremoto');
  const s = fixture(); s.e.begin('stomp'); assert.equal(s.e.attack.name, 'Terratemblor');
  const b = fixture(); b.e.begin('eruption'); assert.equal(b.e.attack.name, 'Estallido');
});
test('No hay daño de lava durante la gracia después del impacto', () => {
  const { e, p, hits, tick } = fixture(); e.begin('blades');
  e.hazards = [{ kind: 'circle', x: p.x, y: p.y, r: 40, start: 1.26, end: 99 }];
  tick(e.attack.warn + 0.85); assert.equal(hits.length, 1);
  tick(0.2); assert.equal(hits.length, 2);
});
test('Victoria limpia ataques y lava, señal única; reloj no avanza en pausa ni con saltos', () => {
  const { e, boss, events } = fixture(); e.begin('blades');
  e.update(100); assert.equal(e.clock, 0.05); assert.equal(e.attack.t, 0.05);
  e.update(NaN); e.update(-1); e.update(0); assert.equal(e.clock, 0.05);
  boss.hp = 0; e.update(0.01); e.update(1);
  assert.equal(e.attack, null); assert.equal(e.hazards.length, 0);
  assert.equal(events.filter(ev => ev[0] === 'victory').length, 1);
});
test('Página generada carga sólo el prototipo, sin cuenta, PWA ni config de producción', () => {
  const html = fs.readFileSync(path.join(root, 'dev/index.html'), 'utf8');
  assert.ok(html.includes('G.FIREBASE_CONFIG = null'));
  assert.ok(!html.includes('src="js/core/firebase-config.js"'));
  assert.ok(!html.includes('src="js/main.js"'));
  assert.equal((html.match(/id="btn-boss-rush"/g) || []).length, 1);
  assert.ok(html.indexOf('id="btn-boss-rush"') > html.indexOf('id="scr-play-mode"'));
  assert.ok(html.indexOf('id="btn-boss-rush"') < html.indexOf('id="scr-challenges"'));
  for (const m of html.matchAll(/<script[^>]*src="([^"?]+)(?:\?[^"]*)?"/g)) assert.ok(fs.existsSync(path.join(root, m[1])), m[1]);
  const official = fs.readFileSync(path.join(root, 'dev.html'), 'utf8');
  assert.ok(official.includes('dev/groudon.js')); assert.ok(official.includes('js/systems/boss-rush.js')); assert.ok(!official.includes('boss-rush-preview'));
});

test('Groudon approaches between attacks, stops for warnings and remains inside the larger arena', () => {
  const {e,boss,p,tick,ARENA}=fixture(); p.x=320; p.y=160;
  const start=Math.hypot(p.x-boss.x,p.y-boss.y); tick(.5);
  assert.ok(Math.hypot(p.x-boss.x,p.y-boss.y)<start-40);
  assert.equal(e.moving,true); e.begin('stomp');
  const position=[boss.x,boss.y]; tick(1);
  assert.deepEqual([boss.x,boss.y],position); assert.equal(e.moving,false);
  assert.equal(ARENA.right-ARENA.left,960); assert.equal(ARENA.bottom-ARENA.top,560);
});
test('Standing at any arena corner no longer avoids Filo del Abismo or Estallido', () => {
  for(const kind of ['blades','eruption']) for(const x of [-460,460]) for(const y of [-260,260]) {
    const {e,p,hits,tick,contains}=fixture(); p.x=x; p.y=y; e.begin(kind);
    assert.ok(e.attack.shapes.some(s=>contains(s,p)),kind+' corner '+x+','+y);
    const snapshot=JSON.stringify(e.attack.shapes); tick(e.attack.warn+.1);
    assert.equal(hits.length,1); assert.equal(JSON.stringify(e.attack.shapes),snapshot);
  }
});
test('The first phase attacks quickly, uses Doble Filo and pressures a stationary distant player', () => {
  const {e,p,hits,events,tick}=fixture(); p.x=330; p.y=170; tick(14);
  assert.ok(events.find(ev=>ev[0]==='attack')[1].warn>=1.1);
  assert.ok(events.some(ev=>ev[0]==='attack'&&ev[1].kind==='charge'));
  assert.ok(hits.length>=2); assert.equal(e.phase,1);
  assert.ok(!events.some(ev=>ev[0]==='attack'&&ev[1].kind==='stomp'&&Math.hypot(p.x-ev[1].shapes[0].x,p.y-ev[1].shapes[0].y)>130));
});
test('Every telegraph has a reachable escape at the centre and edges of the expanded arena', () => {
  for(const radius of [12,24,30]) for(const kind of ['blades','stomp','eruption','charge','rupture'])
    for(const [sideX,sideY] of [[0,0],[-1,-1],[1,-1],[-1,1],[1,1]]) {
    const {e,p,contains,ARENA}=fixture(); p.r=radius;
    const x=sideX*(ARENA.right-radius-6), y=sideY*(ARENA.bottom-radius-6);
    p.x=x; p.y=y; e.begin(kind);
    let distance=Infinity;
    for(let gx=ARENA.left+p.r+6;gx<=ARENA.right-p.r-6;gx+=6)
      for(let gy=ARENA.top+p.r+6;gy<=ARENA.bottom-p.r-6;gy+=6)
        if(!e.attack.shapes.some(s=>contains(s,{x:gx,y:gy,r:p.r}))) distance=Math.min(distance,Math.hypot(gx-x,gy-y));
    assert.ok(distance/130+.2<e.attack.warn,kind+' from '+x+','+y+' with radius '+radius);
  }
});
