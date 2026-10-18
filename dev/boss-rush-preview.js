/* Development-only adapter. Loaded after game.js, never by the official page.
 * A guest save stays in memory; no production account, rewards or rankings.
 */
G.BossRushPreview = (() => {
  let encounter = null, boss = null, running = false, ending = false, won = false;
  let preparing = false, choicesLeft = 0, stage = 0, transition = 0, defeated = false;
  let route = [];
  let chosen = ['water-gun', 'bubble'], ox = 0, oy = 0;
  const roster = [260, 257, 254];
  const normalPause = G.Game.togglePause;
  const originals = {};
  const wrap = (obj, name, fn) => { const old = obj[name]; originals[name] = old; obj[name] = function(...args) { return fn.call(this, old, ...args); }; };
  const localPlayers = () => G.Game.everyone().map(p => ({ get x() { return p.x - ox; }, set x(v) { p.x = ox + v; },
    get y() { return p.y - oy; }, set y(v) { p.y = oy + v; }, r: p.r, get dead() { return p.dead; }, source: p }));
  // Stable player identities are needed to enforce one hit per attack.
  let players = [];
  const relativeBoss = { get x() { return boss.x - ox; }, set x(v) { boss.x = ox + v; },
    get y() { return boss.y - oy; }, set y(v) { boss.y = oy + v; }, get r() { return boss.r; },
    get hp() { return boss.hp; }, get maxHp() { return boss.maxHp; }, get dead() { return boss.dead; } };
  function signal(kind, data) {
    if (kind === 'attack') {
      boss.anim.play('Charge');
      const p = G.Game.player; boss.anim.dir = G.Sprites.dirFromAngle(Math.atan2(p.y - boss.y, p.x - boss.x));
      G.Spawner.say(data.name + (data.kind === 'rupture' ? ' · ¡Busca la franja segura!' : ''), data.warn, true);
    } else if (kind === 'phase') {
      G.Audio.sfx('boss'); G.Spawner.say(data === 2 ? '¡Tierra abrasadora!' : '¡Furia continental!', 2, true);
    } else if (kind === 'impact') {
      boss.anim.play('Attack'); G.Audio.sfx('break'); G.Camera.kick(data.kind === 'rupture' ? 0.55 : 0.22);
    } else if (kind === 'recovery') {
      boss.anim.loop('Idle');
      if (data.kind === 'charge' || data.kind === 'rupture') G.Spawner.say('¡Groudon se recupera! ¡Ataca!', 2, true);
    } else if (kind === 'recoil') {
      boss.hurt(data, '#f5d1bd');
    } else if (kind === 'victory') {
      G.Spawner.say('¡Groudon derrotado!', 2, true);
    }
  }
  function start() {
    const p = G.Game.player;
    const minors = G.BossRushRules.selectMinors(G.DEX, G.SPRITE_META);
    route = [{ dex: 383, major: true, hp: 10000, damage: 38 },
      ...minors.map(dex => ({ dex, major: false }))];
    ox = 16; oy = 16; p.x = ox; p.y = oy + 85;
    p.moves = []; p.slots = []; p.active = 0; p.bind = {}; p.bonds = 0;
    for (const id of chosen) {
      p.addMove(id);
    }
    p.setActive(0);
    // Level ten includes the nine actual upgrade selections, rather than only a label.
    p.level = 10; p.xp = 0; p.xpNext = G.Player.xpFor(10);
    p.baseSpd = 130; p.invuln = 2;
    G.World.setArena({ tx: 0, ty: 0, r: 13, type: 'fire' });
    // No random pools, columns or breakable objects inside the combat space.
    G.World.arena.th = { ...G.Tiles.ARENA_THEMES.fire, pools: 0, pillars: 0, props: {} };
    G.World.setBiome(G.Tiles.arenaBiome('fire'), true);
    players = localPlayers();
    running = true; ending = false; won = false; stage = 0;
    spawnStage();
    G.Camera.x = ox; G.Camera.y = oy;
    preparing = true; choicesLeft = 9;
    normalPause(); // No combat clock or enemy can advance during preparation.
    offerPreparation();
  }
  function spawnStage() {
    const def = route[stage], p = G.Game.player;
    const stats = def.major ? def : G.BossRushRules.minorStats(stage);
    const mon = G.DEX_BY[def.dex];
    const ranged = mon.types.some(t => ['psychic','electric','ghost','fairy','fire','water','ice','dragon'].includes(t));
    G.Projectiles.clear(); G.Combat.clearFields(); G.Hazards.clear();
    defeated = false; transition = 0;
    boss = new G.Enemy({ dex: def.dex, name: mon.name, hp: stats.hp,
      spd: def.major ? 0 : Math.round(G.U.clamp(48 + (mon.spd - 78) * 0.6, 48, 105)),
      dmg: def.major ? 0 : stats.damage,
      xp: G.BossRushRules.rewardXp(G.Player.xpFor, p.level),
      behavior: def.major || !ranged ? 'charger' : 'ranged',
      shotDmg: stats.damage * 0.55, shotCd: 1.2, range: 300 }, ox, oy - 65, { hp: 1, spd: 1, dmg: 1 }, true);
    boss.rushBoss = def.major; boss.rushMinor = !def.major; boss.legend = false;
    boss.rushAttackRate = def.major ? 1 : stats.attackRate;
    boss.touchCd = def.major ? 999 : 1.5;
    G.EnemyMgr.add(boss);
    encounter = def.major ? new G.Groudon.Encounter({ boss: relativeBoss, players: () => players,
      hit: (rp, dmg, type) => {
        const pl = rp.source, before = pl.hp; pl.hurt(dmg, type, false, true);
        // Extra grace between scripted impacts and lava, without disabling defence.
        if (!pl.dead) pl.invuln = Math.max(pl.invuln, 0.9);
        return Math.max(0, before - pl.hp);
      }, signal }) : null;
    G.Sprites.preload([def.dex, p.dex], 8000);
    G.Spawner.say(def.major ? 'Groudon · El despertar' : 'Combate ' + (stage + 1) + ' · ' + boss.name, 2.4, true);
  }
  function offerPreparation() {
    if (!preparing) return;
    const p = G.Game.player;
    const count = p.cardOptions || 3;
    const list = G.LevelUp.offer(p, count + 1).filter(c => c.key !== 'stat:heal').slice(0, count);
    G.RunUI.showLevelUp(10 - choicesLeft + 1, list, card => {
      if (!preparing) return;
      card.apply(p); choicesLeft--;
      if (choicesLeft > 0) offerPreparation();
      else {
        preparing = false; p.hp = p.maxHp; p.setActive(0);
        G.Game.togglePause(); G.Spawner.say('Nivel 10 · ¡Comienza el Boss Rush!', 2.5, true);
      }
    });
    document.getElementById('lvl-hint').textContent = 'Preparación · Elige tus mejoras iniciales · Faltan ' + choicesLeft;
  }
  function shape(ctx, s) {
    ctx.beginPath();
    if (s.kind === 'circle') ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    else if (s.kind === 'line') {
      const dx = s.bx - s.ax, dy = s.by - s.ay, n = Math.hypot(dx, dy) || 1;
      const x = -dy / n * s.width / 2, y = dx / n * s.width / 2;
      ctx.moveTo(s.ax + x, s.ay + y); ctx.lineTo(s.bx + x, s.by + y);
      ctx.lineTo(s.bx - x, s.by - y); ctx.lineTo(s.ax - x, s.ay - y); ctx.closePath();
    } else ctx.rect(s.left, s.top, s.right - s.left, s.bottom - s.top);
  }
  function paintShape(ctx, s, fill, stroke) { shape(ctx, s); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.stroke(); }
  function draw(ctx) {
    if (!running) return;
    ctx.save(); ctx.translate(ox, oy); ctx.lineWidth = 2;
    const r = G.Groudon.ARENA;
    ctx.fillStyle = '#27222b'; ctx.fillRect(r.left - 12, r.top - 12, 624, 324);
    ctx.fillStyle = '#3a3033'; ctx.fillRect(r.left, r.top, 600, 300);
    ctx.strokeStyle = '#d8a56c'; ctx.strokeRect(r.left, r.top, 600, 300);
    ctx.strokeStyle = '#564044'; ctx.lineWidth = 1;
    for (let x = -280; x < 300; x += 40) { ctx.beginPath(); ctx.moveTo(x, -150); ctx.lineTo(x, 150); ctx.stroke(); }
    for (let y = -130; y < 150; y += 40) { ctx.beginPath(); ctx.moveTo(-300, y); ctx.lineTo(300, y); ctx.stroke(); }
    ctx.lineWidth = 2;
    for (const h of encounter?.hazards || []) {
      paintShape(ctx, h, encounter.clock < h.start ? '#a9532844' : '#e45a1faa', '#ffb34f');
      ctx.fillStyle = '#ffe0a0'; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center'; ctx.fillText('≈', h.x, h.y + 5);
    }
    const a = encounter?.attack;
    if (a && !encounter.recovering) {
      const warning = a.t < a.warn;
      ctx.setLineDash(warning ? [7, 5] : []);
      for (const s of a.shapes) paintShape(ctx, s, warning ? '#f4863440' : '#ffae38bb', warning ? '#ffd181' : '#fff0c0');
      if (a.safe) {
        ctx.setLineDash([]); paintShape(ctx, a.safe, '#48d8bd30', '#8ffff0');
        ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#b5fff3';
        ctx.fillText('ZONA SEGURA', 0, (a.safe.top + a.safe.bottom) / 2 + 5);
      }
      if (warning) {
        ctx.setLineDash([]); ctx.textAlign = 'center'; ctx.font = 'bold 20px monospace'; ctx.fillStyle = '#ffe6b5';
        for (const s of a.shapes) {
          const x = s.kind === 'circle' ? s.x : s.kind === 'line' ? (s.ax + s.bx) / 2 : (s.left + s.right) / 2;
          const y = s.kind === 'circle' ? s.y : s.kind === 'line' ? (s.ay + s.by) / 2 : (s.top + s.bottom) / 2;
          ctx.fillText('!', x, y + 6);
        }
      }
    }
    ctx.restore();
  }
  function hud(ctx, w) {
    if (!running || !boss) return;
    const width = Math.min(420, w - 80), x = (w - width) / 2;
    ctx.save(); ctx.fillStyle = '#15121ef5'; ctx.fillRect(x - 10, 63, width + 20, 42);
    ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe2ba';
    ctx.fillText(boss.name.toUpperCase() + (encounter ? ' · FASE ' + encounter.phase + '/3' : ' · MENOR'), w / 2, 77);
    ctx.fillStyle = '#4e2b35'; ctx.fillRect(x, 82, width, 6);
    ctx.fillStyle = encounter?.recovering ? '#7ce7bc' : '#f67846'; ctx.fillRect(x, 82, width * Math.max(0, boss.hp / boss.maxHp), 6);
    ctx.font = '11px monospace'; ctx.fillStyle = '#fff';
    ctx.fillText(transition ? 'Victoria · Recupera fuerzas' : encounter?.label || 'Combate ' + (stage + 1) + '/3 · Gana experiencia', w / 2, 100); ctx.restore();
  }
  function setup() {
    const root = document.createElement('section'); root.id = 'scr-boss-rush'; root.className = 'scr dim hidden';
    root.innerHTML = `<div class="panel rush-setup"><span class="rush-kicker">BOSS RUSH · HOENN</span>
      <h1>El despertar de Groudon</h1><p>Primera arena de la ruta. Aprende sus señales, esquiva y contraataca.</p>
      <div class="rush-route"><b>Groudon → 2 legendarios menores aleatorios</b><span>Después: Kyogre · Próximamente</span></div>
      <div class="rush-fields"><label>Tu Pokémon<select id="rush-partner"></select></label>
      <label>Ataque 1<select id="rush-move-1"></select></label><label>Ataque 2<select id="rush-move-2"></select></label></div>
      <div class="rush-wallet"><b id="rush-balance"></b><div class="rush-actions">
      <button class="btn small" id="rush-upgrades">Mejoras de oro</button>
      <button class="btn small ghost" id="rush-refill">Reponer dinero de prueba</button></div></div>
      <p class="sub">Empiezas en nivel 10: elige nueve mejoras antes de combatir. Cada victoria da experiencia y recupera un 20% de vida.<br>Prueba individual del primer tramo. Tu cuenta y tu progreso no se modifican.</p>
      <button class="btn gold" id="rush-start">Enfrentar a Groudon</button>
      <p id="rush-error" role="status"></p></div>`;
    document.body.appendChild(root);
    const select = document.getElementById('rush-partner');
    for (const dex of roster) select.add(new Option(G.DEX_BY[dex].name, String(dex)));
    function moves() {
      const dex = Number(select.value), pool = G.Moves.poolFor(G.DEX_BY[dex]);
      const defaults = dex === 260 ? ['water-gun', 'bubble'] : dex === 257 ? ['karate-chop', 'ember'] : ['vine-whip', 'razor-leaf'];
      [1, 2].forEach((n, i) => {
        const el = document.getElementById('rush-move-' + n); el.replaceChildren();
        for (const id of pool) el.add(new Option(G.Moves.BY_ID[id].name, id));
        el.value = defaults[i];
      });
    }
    select.onchange = () => { G.DB.save.partner = Number(select.value); moves(); }; moves();
    document.getElementById('rush-upgrades').onclick = () => {
      const dex = Number(select.value); G.DB.save.partner = dex;
      document.querySelector('#scr-menu [data-go="upgrades"]').click();
      const upgradeSelect = document.getElementById('upg-mon');
      upgradeSelect.value = String(dex); upgradeSelect.onchange();
    };
    document.getElementById('rush-refill').onclick = refillFunds;
    document.getElementById('rush-start').onclick = () => {
      chosen = [1, 2].map(n => document.getElementById('rush-move-' + n).value);
      if (chosen[0] === chosen[1] || chosen.every(id => G.Moves.BY_ID[id].kind === 'buff')) {
        document.getElementById('rush-error').textContent = 'Elige dos ataques distintos y al menos uno que cause daño.'; return;
      }
      G.DB.save.partner = Number(select.value); G.Audio.unlock(); G.Game.startRun();
    };
  }
  function refreshSetup() {
    const el = document.getElementById('rush-balance');
    if (el) el.textContent = G.DB.save.coins.toLocaleString('es-MX') + ' Pokémonedas de prueba';
  }
  function refillFunds() {
    if (!G.DB.guest || running) return false;
    G.DB.save.coins = 100000; G.UI.refreshCoins(); refreshSetup(); return true;
  }
  function init() {
    // Preserve the real session byte-for-byte, including a missing session.
    G.DB.ready = async () => {
      let session = null; try { session = localStorage.getItem('ps.session'); } catch (_) {}
      G.DB.playAsGuest();
      try { if (session === null) localStorage.removeItem('ps.session'); else localStorage.setItem('ps.session', session); } catch (_) {}
      const s = G.DB.save; s.partner = s.starter = 260; s.coins = 100000; s.pupg = {}; s.megaEquipped = {};
      for (const dex of roster) s.owned[dex] = { at: Date.now(), from: 'boss-rush-preview' };
      return true;
    };
    G.Updater.init = () => {};
    for (const name of ['runStarted', 'submitSolo', 'submitGroup']) G.Ranking[name] = () => {};
    const tap = G.Input.tap;
    G.Input.tap = k => preparing && (k === 'escape' || k === 'keyp') ? false : tap(k);
    G.Game.togglePause = () => { if (!preparing) normalPause(); };
    wrap(G.UI, 'show', (old, id, ...args) => {
      if (id !== 'scr-boss-rush') document.getElementById('scr-boss-rush')?.classList.add('hidden');
      return old(id, ...args);
    });
    wrap(G.UI, 'hideAll', old => {
      document.getElementById('scr-boss-rush')?.classList.add('hidden'); return old();
    });
    wrap(G.MenuUI, 'open', old => {
      old(); if (!document.getElementById('scr-boss-rush')) setup();
      refreshSetup(); G.UI.show('scr-boss-rush', true);
    });
    wrap(G.Game, 'startRun', old => {
      if (G.Game.state !== 'ui' || running) return;
      old(); if (G.Game.state === 'playing') start();
    });
    wrap(G.Spawner, 'update', (old, dt, ...args) => {
      if (!running) return old(dt, ...args);
      G.Spawner.tickBanner(dt);
      for (const p of players) {
        p.x = Math.max(-294 + p.r, Math.min(294 - p.r, p.x));
        p.y = Math.max(-144 + p.r, Math.min(144 - p.r, p.y));
      }
      if (encounter) encounter.update(dt);
      if (boss && !boss.dead) {
        boss.x = Math.max(ox - 294 + boss.r, Math.min(ox + 294 - boss.r, boss.x));
        boss.y = Math.max(oy - 144 + boss.r, Math.min(oy + 144 - boss.r, boss.y));
      }
      if (boss?.dead && !defeated) {
        defeated = true; transition = 3; G.Hazards.clear(); G.Projectiles.clear(); G.Combat.clearFields();
        G.Game.player.heal(G.Game.player.maxHp * 0.2); G.Pickups.pullAll();
        G.Spawner.say('¡' + boss.name + ' derrotado! · +20% de vida', 2.5, true);
      } else if (transition > 0 && !G.Game.player.dead) {
        transition -= dt;
        if (transition <= 0) {
          if (stage < route.length - 1) { stage++; spawnStage(); }
          else { won = true; ending = true; }
        }
      }
      if (ending && !G.Game.player.dead) { ending = false; G.Game.quit(); }
    });
    for (const obj of [G.Rift, G.Judgment, G.Events, G.Weather, G.Interact]) {
      wrap(obj, 'update', (old, ...args) => { if (!running) return old(...args); });
    }
    wrap(G.Camera, 'follow', (old, x, y, dt) => old.call(G.Camera, running ? ox : x, running ? oy : y, dt));
    wrap(G.World, 'drawLiquid', (old, ctx, ...args) => { old(ctx, ...args); draw(ctx); });
    wrap(G.HUD, 'draw', (old, ctx, w, ...args) => { old(ctx, w, ...args); hud(ctx, w); });
    wrap(G.Enemy.prototype, 'bossMove', function(old, dt, ...args) {
      if (this.rushMinor) {
        if (!this.ai) this.bossInit();
        if (!this.ai.cast) this.ai.cd -= dt * G.BossRushRules.extraCooldownDecay(this.rushAttackRate, this.ai.fury);
      }
      return old.call(this, dt, ...args);
    });
    wrap(G.Enemy.prototype, 'update', function(old, dt, p) {
      if (!this.rushBoss) return old.call(this, dt, p);
      this.anim.update(dt); this.flash = Math.max(0, this.flash - dt); this.touchCd = 999;
      if (this.dead) { this.fade -= dt; return; }
      if (this.burn > 0) {
        this.burnT -= dt; this.burnTick -= dt;
        if (this.burnTick <= 0) { this.burnTick = 0.5; this.hurt(1.6 * this.burn * (1 + p.level * 0.06), '#ff9a4d'); }
        if (this.burnT <= 0) this.burn = 0;
      }
      if (this.poison > 0) {
        this.poisonT -= dt; this.poisonTick -= dt;
        if (this.poisonTick <= 0) { this.poisonTick = 0.6; this.hurt(this.maxHp * 0.012 * this.poison + 1, '#d47cf0'); }
        if (this.poisonT <= 0) this.poison = 0;
      }
    });
    wrap(G.Enemy.prototype, 'die', function(old) {
      if (!this.rushBoss && !this.rushMinor) return old.call(this);
      if (this.dead) return;
      this.dead = true; this.fade = 0.9; this.anim.play('Faint', { hold: true }); G.Audio.sfx('bossDown');
      G.Pickups.dropXp(this.x, this.y, this.xp, true, false, true);
    });
    wrap(G.RunUI, 'showOver', (old, result, back) => {
      if (!running) return old(result, back);
      old({ ...result, coins: 0, record: false, breakdown: 'Prueba de combate · Sin recompensas', caught: [], megaUnlocked: false }, () => {
        running = false; preparing = false; encounter = null; boss = null; back();
      });
      document.getElementById('over-title').textContent = won ? '¡Primer tramo superado!' : 'Intento terminado';
      document.getElementById('btn-again').textContent = 'Preparar otro intento';
      document.getElementById('over-ask')?.remove();
    });
  }
  init();
  return { refillFunds, get encounter() { return encounter; }, get boss() { return boss; }, get running() { return running; },
    get preparing() { return preparing; }, get stage() { return stage; } };
})();
