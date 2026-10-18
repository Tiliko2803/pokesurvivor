/* Groudon Boss Rush prototype: deterministic combat rules, independent of UI/network.
 * Coordinates are relative to the arena centre. Only the combat clock advances them.
 */
G.Groudon = (() => {
  const BASE_HP = 400000; // Calibrated against a level-10 Mega Blaziken with all gold upgrades.
  const ARENA = Object.seal({ left: -480, right: 480, top: -280, bottom: 280 });
  function resizeArena(width,height) {
    if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0) return false;
    ARENA.left=-width/2;ARENA.right=width/2;ARENA.top=-height/2;ARENA.bottom=height/2;
    return true;
  }
  const NAMES = { blades: 'Filo del Abismo', stomp: 'Terratemblor', eruption: 'Estallido',
    charge: 'Doble Filo', rupture: 'Terremoto' };
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  function segmentDistance(x, y, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    return Math.hypot(x - ax - t * dx, y - ay - t * dy);
  }
  function contains(s, p) {
    const r = p.r || 0;
    if (s.kind === 'circle') return Math.hypot(p.x - s.x, p.y - s.y) < s.r + r;
    if (s.kind === 'line') return segmentDistance(p.x, p.y, s.ax, s.ay, s.bx, s.by) < s.width / 2 + r;
    return p.x + r > s.left && p.x - r < s.right && p.y + r > s.top && p.y - r < s.bottom;
  }
  class Encounter {
    constructor({ boss, players, hit, signal = () => {}, random = Math.random }) {
      this.boss = boss; this.players = players; this.hit = hit; this.signal = signal; this.random = random;
      this.phase = 1; this.clock = 0; this.cooldown = 0.55; this.attacks = []; this.moving = false;
      this.hazards = []; this.sequence = 0; this.ruptured = false; this.finished = false;
      this.lastDamage = -99; this.lastLava = -99;
      this.hitCooldown = new Map();
    }
    alive() { return this.players().filter(p => !p.dead); }
    bound(p) {
      p.x = clamp(p.x, ARENA.left + p.r + 6, ARENA.right - p.r - 6);
      p.y = clamp(p.y, ARENA.top + p.r + 6, ARENA.bottom - p.r - 6);
    }
    target() {
      const ps = this.alive();
      return ps[this.sequence % Math.max(1, ps.length)] || { x: 0, y: 70, r: 12 };
    }
    approach(dt) {
      const b = this.boss, p = this.target(), dx = p.x - b.x, dy = p.y - b.y;
      const distance = Math.hypot(dx, dy), stop = b.r + p.r + 16;
      if (distance <= stop) return;
      const step = Math.min(distance - stop, (88 + (this.phase - 1) * 12) * dt);
      b.x += dx / distance * step; b.y += dy / distance * step;
      this.bound(b); this.moving = true;
    }
    createAttack(kind) {
      const b = this.boss, target = this.target();
      const a = { kind, name: NAMES[kind], t: 0, warn: 1.15, active: 0.32, recovery: 0.55,
        shapes: [], hit: new Set(), damage: 42, type: 'ground' };
      if (kind === 'blades') {
        const shift = clamp(target.x, ARENA.left + 24, ARENA.right - 24);
        a.shapes = [-210, 0, 210].map(x => x + shift).filter(x => x > ARENA.left && x < ARENA.right)
          .map(x => ({ kind: 'line', ax: x, ay: ARENA.top, bx: x, by: ARENA.bottom, width: 42 }));
      } else if (kind === 'stomp') {
        a.shapes = [{ kind: 'circle', x: b.x, y: b.y, r: 110 }]; a.damage = 44; a.warn = 1.35;
      } else if (kind === 'eruption') {
        // Snapshot positions once: the marks never chase the player.
        a.shapes = this.alive().slice(0, 4).map(p => ({ kind: 'circle',
          x: p.x, y: p.y, r: 52 }));
        a.damage = 38; a.type = 'fire'; a.warn = 1.3;
      } else if (kind === 'charge') {
        const angle = Math.atan2(target.y - b.y, target.x - b.x);
        let length = Math.hypot(ARENA.right - ARENA.left, ARENA.bottom - ARENA.top);
        const nx = Math.cos(angle), ny = Math.sin(angle);
        if (nx > 0.001) length = Math.min(length, (ARENA.right - b.r - 12 - b.x) / nx);
        if (nx < -0.001) length = Math.min(length, (ARENA.left + b.r + 12 - b.x) / nx);
        if (ny > 0.001) length = Math.min(length, (ARENA.bottom - b.r - 12 - b.y) / ny);
        if (ny < -0.001) length = Math.min(length, (ARENA.top + b.r + 12 - b.y) / ny);
        length = Math.max(0, length);
        a.shapes = [{ kind: 'line', ax: b.x, ay: b.y, bx: b.x + nx * length,
          by: b.y + ny * length, width: b.r * 2 + 10 }];
        a.active = Math.max(length / 600, 0.35); a.recovery = 1.35; a.damage = 56; a.type = 'normal';
      } else if (kind === 'rupture') {
        // Guaranteed reachable refuge centred on a living player. Clear old lava.
        const half = 50, y = clamp(target.y, ARENA.top + half + 20, ARENA.bottom - half - 20);
        a.safe = { kind: 'rect', left: ARENA.left, right: ARENA.right, top: y - half, bottom: y + half };
        a.shapes = [
          { kind: 'rect', left: ARENA.left, right: ARENA.right, top: ARENA.top, bottom: y - half },
          { kind: 'rect', left: ARENA.left, right: ARENA.right, top: y + half, bottom: ARENA.bottom }
        ];
        a.warn = 2; a.damage = 64; a.recovery = 2.5;
      } else return null;
      return a;
    }
    begin(kind) { return this.beginCombo([kind]); }
    findEscape(p, attacks = this.attacks) {
      const left=ARENA.left+p.r+6, right=ARENA.right-p.r-6;
      const top=ARENA.top+p.r+6, bottom=ARENA.bottom-p.r-6;
      let best=null, distance=Infinity;
      for(let dx=-240;dx<=240;dx+=8) for(let dy=-240;dy<=240;dy+=8) {
        const q={x:clamp(p.x+dx,left,right),y:clamp(p.y+dy,top,bottom),r:p.r};
        const d=Math.hypot(q.x-p.x,q.y-p.y);
        if(d>=distance || attacks.some(a=>a.shapes.some(s=>contains(s,q))) || this.hazards.some(h=>contains(h,q))) continue;
        // Existing lava may be crossed neither on the destination nor on a straight escape.
        if(this.hazards.some(h=>!contains(h,p)&&segmentDistance(h.x,h.y,p.x,p.y,q.x,q.y)<h.r+p.r+3)) continue;
        best=q;distance=d;
      }
      return best && { ...best, distance };
    }
    beginCombo(kinds) {
      if(this.finished || this.attacks.length || !kinds.length || kinds.length>3 || new Set(kinds).size!==kinds.length) return false;
      if(kinds.includes('rupture') && kinds.length>1) return false;
      let attacks=kinds.map(kind=>this.createAttack(kind));
      if(attacks.some(a=>!a)) return false;
      let warn=Math.max(...attacks.map(a=>a.warn));
      while(attacks.length>1) {
        const routes=this.alive().map(p=>this.findEscape(p,attacks));
        const needed=Math.max(warn,...routes.map(route=>route?route.distance/130+.25:Infinity));
        if(needed<=2) { warn=Math.ceil(needed*20)/20;break; }
        attacks.pop(); // Reduce density rather than create a corner trap.
        warn=Math.max(...attacks.map(a=>a.warn));
      }
      if(attacks[0].kind==='rupture') this.hazards=[];
      for(const a of attacks) a.warn=warn;
      this.attacks=attacks;
      attacks[0].comboName=attacks.map(a=>a.name).join(' + ');
      this.signal('attack',attacks[0]); return true;
    }
    resolveHits() {
      for(const p of this.alive()) {
        const colliding=this.attacks.filter(a=>a.t>=a.warn && a.t<a.warn+a.active && !a.hit.has(p) &&
          (a.kind==='charge'?Math.hypot(p.x-this.boss.x,p.y-this.boss.y)<p.r+this.boss.r:a.shapes.some(s=>contains(s,p))));
        if(!colliding.length) continue;
        for(const a of colliding) a.hit.add(p);
        if(this.clock-(this.hitCooldown.get(p)??-99)<.9) continue;
        const a=colliding.reduce((best,other)=>other.damage>best.damage?other:best);
        const dealt=this.hit(p,a.damage,a.type);
        if(a.kind==='charge'&&Number.isFinite(dealt)&&dealt>0) this.signal('recoil',dealt/3);
        this.hitCooldown.set(p,this.clock);this.lastDamage=this.clock;
      }
    }
    onImpact() {}
    onRecovery(a) {
      if(a.kind==='eruption') this.hazards=a.shapes.map(s=>({...s,r:31,start:this.clock+.8,end:this.clock+5}));
    }
    idleDelay() { return [0,.4,.25,.15][this.phase]; }
    chooseAttack() {
      if (this.phase === 3 && !this.ruptured) { this.ruptured = true; this.begin('rupture'); }
      else {
        const pattern = this.phase === 1 ? ['blades', 'charge', 'stomp', 'eruption'] : this.phase === 2
          ? ['eruption', 'charge', 'blades', 'stomp'] : ['blades', 'charge', 'eruption', 'stomp', 'charge'];
        let kind = pattern[this.sequence++ % pattern.length];
        if (kind === 'stomp' && Math.hypot(this.target().x - this.boss.x, this.target().y - this.boss.y) > 130) kind = 'eruption';
        const kinds=[kind];
        if(this.phase>=2) kinds.push(kind==='eruption'?'blades':'eruption');
        if(this.phase===3) {
          const near=Math.hypot(this.target().x-this.boss.x,this.target().y-this.boss.y)<=130;
          const third=near?'stomp':'charge';
          kinds.push(kinds.includes(third)?'blades':third);
        }
        this.beginCombo(kinds);
      }
    }
    updateHazards() {
      if (this.clock - this.lastLava >= 0.8 && this.clock - this.lastDamage >= 0.9) {
        this.lastLava = this.clock;
        for (const p of this.alive()) if (this.clock-(this.hitCooldown.get(p)??-99)>=.9&&this.hazards.some(h => this.clock >= h.start && contains(h, p))) {
          this.hit(p,12,'fire');this.hitCooldown.set(p,this.clock);
        }
      }
    }
    update(dt) {
      if (this.finished || !Number.isFinite(dt) || dt <= 0) return;
      // The game already caps frames; cap here too, so a resumed tab cannot skip a warning.
      dt = Math.min(dt, 0.05); this.clock += dt; this.moving = false;
      for (const p of this.alive()) this.bound(p);
      this.bound(this.boss);
      if (this.boss.dead || this.boss.hp <= 0) {
        this.finished = true; this.attacks = []; this.hazards = []; this.hitCooldown.clear(); this.signal('victory'); return;
      }
      const ratio = this.boss.hp / this.boss.maxHp;
      const phase = ratio <= 0.35 ? 3 : ratio <= 0.7 ? 2 : 1;
      if (phase > this.phase) { this.phase = phase; this.signal('phase', phase); }
      this.hazards = this.hazards.filter(h => h.end > this.clock);
      if (this.attacks.length) {
        for(const a of this.attacks) a.t+=dt;
        for(const a of this.attacks) {
          const before=a.t-dt;
          if(a.t>=a.warn&&before<a.warn) { this.onImpact(a); this.signal('impact',a); }
          if(a.kind==='charge'&&a.t>=a.warn&&a.t<a.warn+a.active) {
            const s=a.shapes[0],k=clamp((a.t-a.warn)/a.active,0,1);
            this.boss.x=s.ax+(s.bx-s.ax)*k;this.boss.y=s.ay+(s.by-s.ay)*k;
          }
          if(a.t>=a.warn+a.active&&before<a.warn+a.active) {
            if(a.kind==='charge') {const s=a.shapes[0];this.boss.x=s.bx;this.boss.y=s.by;}
            this.onRecovery(a);
            this.signal('recovery',a);
          }
        }
        this.resolveHits();
        if(this.attacks.every(a=>a.t>=a.warn+a.active+a.recovery)) {
          this.attacks=[];this.cooldown=this.idleDelay();
        }
      } else {
        this.approach(dt);
        this.cooldown -= dt;
        if (this.cooldown <= 0) {
          this.chooseAttack();
        }
      }
      this.updateHazards();
    }
    get attack() { return this.attacks[0] || null; }
    get recovering() { return this.attacks.length>0 && this.attacks.every(a=>a.t>=a.warn+a.active); }
    get label() { return this.recovering?'¡Aprovecha su recuperación!':this.attacks.length?this.attacks.map(a=>a.name).join(' + '):'Busca una buena posición'; }
  }
  return { Encounter, ARENA, BASE_HP, resizeArena, contains, segmentDistance };
})();
