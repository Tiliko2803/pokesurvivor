/* Development-only adapter. Loaded after game.js, never by the official page.
 * A guest save stays in memory; no production account, rewards or rankings.
 */
G.BossRushPreview = (() => {
  const START_LEVEL = 8;
  let encounter = null, boss = null, running = false, ending = false, won = false;
  let preparing = false, choicesLeft = 0, stage = 0, transition = 0, defeated = false;
  let route = [];
  let soloJirachi=false, preparationLevel=START_LEVEL;
  let bosses = [], bars = null;
  let returnFromUpgrades = false;
  let chosen = ['water-gun', 'bubble'], ox = 0, oy = 0;
  const roster = [260, 257, 254, 248];
  const normalPause = G.Game.togglePause;
  const originals = {};
  const wrap = (obj, name, fn) => { const old = obj[name]; originals[name] = old; obj[name] = function(...args) { return fn.call(this, old, ...args); }; };
  const localPlayers = () => G.Game.everyone().map(p => ({ get x() { return p.x - ox; }, set x(v) { p.x = ox + v; },
    get y() { return p.y - oy; }, set y(v) { p.y = oy + v; }, r: p.r, get dead() { return p.dead; }, source: p }));
  // Stable player identities are needed to enforce one hit per attack.
  let players = [];
  let partySize = 1;
  const relativeBoss = { get x() { return boss.x - ox; }, set x(v) { boss.x = ox + v; },
    get y() { return boss.y - oy; }, set y(v) { boss.y = oy + v; }, get r() { return boss.r; },
    get hp() { return boss.hp; }, get maxHp() { return boss.maxHp; }, get dead() { return boss.dead; }, get source(){return boss;} };
  const effects = () => encounter?.id==='jirachi'?G.JirachiFX:encounter?.id==='eon'?G.EonFX:encounter?.id==='regis'?G.RegisFX:boss?.dex===384?G.RayquazaFX:boss?.dex === 382 ? G.KyogreFX : G.GroudonFX;
  const arenaType = () => route[stage]?.dex===385||stage===2||stage>=G.BossRushRules.MAJOR_STAGES.rayquaza?'flying':stage >= G.BossRushRules.MAJOR_STAGES.kyogre ? 'water' : 'fire';
  function signal(kind, data) {
    if(encounter?.members){
      const actor=data?.owner?.source;
      if(kind==='attack'){const pl=G.Game.player;actor.anim.dir=G.Sprites.dirFromAngle(Math.atan2(pl.y-actor.y,pl.x-actor.x));actor.anim.play('Charge');G.Spawner.say(data.owner.name+' · '+data.name,data.warn,true);}
      if(kind==='impact'){actor.anim.play(['rocks','slide','claw','zen'].includes(data.kind)?'Attack':'Shoot');G.Audio.sfx('shot',{kind:'beam',type:data.type});}
      if(kind==='recovery')actor.anim.loop('Idle');
      return;
    }
    if (kind === 'attack') {
      boss.anim.play('Charge');
      const p = G.Game.player; boss.anim.dir = G.Sprites.dirFromAngle(Math.atan2(p.y - boss.y, p.x - boss.x));
      G.Spawner.say((data.comboName || data.name) + (data.kind === 'rupture'||data.kind==='pulse' ? ' · ¡Busca la franja segura!' : ''), data.warn, true);
    } else if (kind === 'phase') {
      G.Audio.sfx('boss'); G.Spawner.say(boss.dex===385?(data===2?'¡Los deseos se entrelazan!':'¡El cielo de los deseos! · Avisos más rápidos'):boss.dex===384?(data===2?'¡Se abren los cielos! · Avisos más rápidos':'¡Furia del firmamento! · Avisos más rápidos'):boss.dex===382?(data===2?'¡Marea creciente! · Avisos más rápidos':'¡Furia oceánica! · Avisos más rápidos'):(data === 2 ? '¡Tierra abrasadora!' : '¡Furia continental!'), 2, true);
    } else if (kind === 'impact') {
      boss.anim.play(['eruption','hydro','ice','dragon','doom','flash','swift'].includes(data.kind) ? 'Shoot' : 'Attack');
      const sound = { blades:'melee', stomp:'nova', eruption:'beam', charge:'projectile', rupture:'nova',surf:'nova',hydro:'beam',ice:'beam',rain:'nova',pulse:'nova',ascent:'melee',dragon:'beam',hurricane:'nova',meteor:'nova',doom:'nova',swift:'projectile',flash:'beam',psychic:'nova' }[data.kind];
      G.Audio.sfx('shot', { kind:sound, type:data.type });
      G.Camera.kick(data.kind === 'rupture' ? 0.55 : data.kind === 'stomp' ? 0.35 : 0.22);
      const color = effects().palette(data.kind).light, count = G.Settings.get('calm') ? 4 : 10;
      if (data.kind === 'stomp' || data.kind === 'charge') G.FX.burst(boss.x,boss.y,color,count*2,150);
      else for (const s of data.shapes) {
        const x=['circle','ring'].includes(s.kind)?s.x:s.kind==='line'?s.ax:(s.left+s.right)/2;
        const y=['circle','ring'].includes(s.kind)?s.y:s.kind==='line'?(s.ay+s.by)/2:(s.top+s.bottom)/2;
        G.FX.burst(ox+x,oy+y,color,count,140);
      }
    } else if (kind === 'recovery') {
      if (encounter?.recovering) {
        boss.anim.loop('Idle');
        if (['charge','rupture','pulse','meteor'].includes(data.kind)) G.Spawner.say('¡'+boss.name+' se recupera! ¡Ataca!', 2, true);
      }
    } else if (kind === 'recoil') {
      boss.hurt(data, '#f5d1bd');
    } else if (kind === 'victory') {
      G.Spawner.say('¡'+boss.name+' derrotado!', 2, true);
    }
  }
  function start(jirachiOnly=false) {
    soloJirachi=jirachiOnly;preparationLevel=soloJirachi?25:START_LEVEL;
    const p = G.Game.player;
    route = [{dex:377,members:G.Regis.IDS,group:'regis',title:'Los Tres Guardianes',major:false},
      { dex: 383, major: true, hp: G.Groudon.BASE_HP, damage: 42 },
      {dex:381,members:G.Eon.IDS,group:'eon',title:'Dúo Eón',major:false,hp:G.Eon.BASE_HP,damage:34,attackRate:1},
      {dex:382,major:true,hp:G.Kyogre.BASE_HP,damage:50},
      {dex:385,major:false},
      {dex:384,major:true,hp:G.Rayquaza.BASE_HP,damage:54}];
    ox = 16; oy = 16; p.x = ox; p.y = oy + 85;
    p.moves = []; p.slots = []; p.active = 0; p.bind = {}; p.bonds = 0;
    for (const id of chosen) {
      p.addMove(id);
      const mega = G.Mega.definition(p.dex);
      if (p.mega && mega?.start === id) G.Moves.levelUp(p.moves.find(m => m.id === id));
    }
    p.setActive(0);
    // Starting at level eight includes the seven level-ups from level one.
    p.level = preparationLevel; p.xp = 0; p.xpNext = G.Player.xpFor(preparationLevel);
    if(soloJirachi){p.bonds=2;if(p.mega==='blazikenite')p.megaElapsed=150;}
    p.baseSpd = 130; p.invuln = 1;
    G.World.setArena({ tx: 0, ty: 0, r: 20, type: 'fire' });
    // No random pools, columns or breakable objects inside the combat space.
    G.World.arena.th = { ...G.Tiles.ARENA_THEMES.fire, pools: 0, pillars: 0, props: {} };
    G.World.setBiome(G.Tiles.arenaBiome('fire'), true);
    players = localPlayers();
    // Keep the starting roster size for the whole run, including downed teammates.
    partySize = Math.max(1, players.length);
    running = true; ending = false; won = false; stage = soloJirachi?4:0;
    refreshCamera();
    spawnStage();
    G.Camera.x = ox; G.Camera.y = oy - (G.Camera.rushOffsetY || 0);
    preparing = true; choicesLeft = preparationLevel - 1;
    normalPause(); // No combat clock or enemy can advance during preparation.
    offerPreparation();
  }
  function spawnStage() {
    const def = route[stage], p = G.Game.player;
    const stats = def.major || def.group==='eon' ? def : G.BossRushRules.minorStats(stage);
    if(def.dex===385)stats.hp=G.Jirachi.hpForStage(stage);
    G.Projectiles.clear(); G.Combat.clearFields(); G.Hazards.clear();
    defeated = false; transition = 0;
    p.slowT=0;
    refreshCamera();
    G.World.setBiome(G.Tiles.arenaBiome(arenaType()),true);
    bosses=(def.members||[def.dex]).map((dex,i)=>{
    const mon = G.DEX_BY[dex];
    const ranged = mon.types.some(t => ['psychic','electric','ghost','fairy','fire','water','ice','dragon'].includes(t));
    const b = new G.Enemy({ dex, name: mon.name, hp: G.BossRushRules.bossHp(stats.hp, partySize),
      spd: def.major ? 0 : Math.round(G.U.clamp(48 + (mon.spd - 78) * 0.6, 48, 105)),
      dmg: def.major ? 0 : stats.damage,
      xp: def.members?0:G.BossRushRules.rewardXp(G.Player.xpFor, p.level, G.BossRushRules.rewardLevels(stage)),
      behavior: def.major || !ranged ? 'charger' : 'ranged',
      shotDmg: stats.damage * 0.55, shotCd: 1.2, range: 300 }, ox+(def.members?(def.group==='eon'?(i-.5)*220:(i-1)*170):0), oy - (def.members&&i===1?150:65), { hp: 1, spd: 1, dmg: 1 }, true);
    b.rushBoss = def.major; b.rushMinor = !def.major; b.rushGroup=!!def.members;b.rushScripted=dex===385;b.legend = false;
    b.rushAttackRate = def.major ? 1 : stats.attackRate;
    b.touchCd = def.major||def.members||b.rushScripted ? 999 : 1.5;
    G.EnemyMgr.add(b);return b;
    });
    boss=bosses[0];bars=def.members?new G.BossRushBars(bosses):null;
    const Encounter=def.dex===385?G.Jirachi.Encounter:def.dex===384?G.Rayquaza.Encounter:def.dex===382?G.Kyogre.Encounter:G.Groudon.Encounter;
    const options={boss:relativeBoss,players:()=>players,
      hit: (rp, dmg, type, effect) => {
        const pl = rp.source, before = pl.hp; pl.hurt(dmg, type, false, true);
        // Extra grace between scripted impacts and lava, without disabling defence.
        if (!pl.dead) pl.invuln = Math.max(pl.invuln, 0.9);
        if(before>pl.hp&&effect?.slow)pl.slowT=Math.max(pl.slowT,effect.slow);
        return Math.max(0, before - pl.hp);
      },signal};
    encounter = def.members?new (def.group==='eon'?G.Eon.Encounter:G.Regis.Encounter)({...options,bosses:bosses.map(b=>({dex:b.dex,name:b.name,source:b,get x(){return b.x-ox;},set x(v){b.x=ox+v;},get y(){return b.y-oy;},set y(v){b.y=oy+v;},r:b.r,get hp(){return b.hp;},get maxHp(){return b.maxHp;},get dead(){return b.dead;}}))}):def.major||def.dex===385?new Encounter(def.dex===385?{...options,damageScale:stats.damage/G.Jirachi.DAMAGE}:options):null;
    if(def.major)G.MajorCadence.attach(encounter);
    G.Sprites.preload([...bosses.map(b=>b.dex), p.dex], 8000);
    G.Spawner.say(def.members?def.title+' · ¡Vence a todos!':def.dex===385?'Jirachi · El observatorio de los deseos':def.major ? boss.name+(def.dex===384?' · Señor de los cielos':def.dex===382?' · El océano despierta':' · El despertar') : 'Combate ' + (stage + 1) + ' · ' + boss.name, 2.4, true);
  }
  function offerPreparation() {
    if (!preparing) return;
    const p = G.Game.player;
    const count = p.cardOptions || 3;
    const list = G.LevelUp.offer(p, count + 1).filter(c => c.key !== 'stat:heal').slice(0, count);
    G.RunUI.showLevelUp(preparationLevel - choicesLeft + 1, list, card => {
      if (!preparing) return;
      card.apply(p); choicesLeft--;
      if (choicesLeft > 0) offerPreparation();
      else {
        preparing = false; p.hp = p.maxHp; p.setActive(0);
        G.Game.togglePause(); G.Spawner.say('Nivel ' + preparationLevel + (soloJirachi?' · ¡Prueba de Jirachi!':' · ¡Comienza el Boss Rush!'), 2.5, true);
      }
    });
    document.getElementById('lvl-hint').textContent = 'Preparación · Elige tus mejoras iniciales · Faltan ' + choicesLeft;
  }
  function shape(ctx, s) {
    ctx.beginPath();
    if(s.kind==='ring'){ctx.arc(s.x,s.y,s.outer,0,Math.PI*2);ctx.moveTo(s.x+s.inner,s.y);ctx.arc(s.x,s.y,s.inner,0,Math.PI*2,true);}
    else if (s.kind === 'circle') ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    else if (s.kind === 'line') {
      const dx = s.bx - s.ax, dy = s.by - s.ay, n = Math.hypot(dx, dy) || 1;
      const x = -dy / n * s.width / 2, y = dx / n * s.width / 2;
      ctx.moveTo(s.ax + x, s.ay + y); ctx.lineTo(s.bx + x, s.by + y);
      ctx.lineTo(s.bx - x, s.by - y); ctx.lineTo(s.ax - x, s.ay - y); ctx.closePath();
    } else ctx.rect(s.left, s.top, s.right - s.left, s.bottom - s.top);
  }
  function paintShape(ctx, s, fill, stroke) { shape(ctx, s); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.stroke(); }
  function refreshCamera() {
    const cam = G.Camera;
    if (Number.isFinite(cam.w * cam.scale) && Number.isFinite(cam.h * cam.scale))
      cam.resize(cam.w * cam.scale, cam.h * cam.scale, cam.dpr);
  }
  let effectsCanvas=null;
  function drawEffects(ctx) {
    if(!encounter)return;
    const r=G.Groudon.ARENA,w=Math.ceil((r.right-r.left+128)/2),h=Math.ceil((r.bottom-r.top+128)/2);
    if(!effectsCanvas)effectsCanvas=document.createElement('canvas');
    if(effectsCanvas.width!==w||effectsCanvas.height!==h){effectsCanvas.width=w;effectsCanvas.height=h;}
    const c=effectsCanvas.getContext('2d');c.clearRect(0,0,w,h);c.save();
    c.scale(.5,.5);c.translate(64-r.left,64-r.top);
    effects().draw(c,encounter,relativeBoss,{quality:G.Settings.fx,calm:G.Settings.get('calm')});c.restore();
    ctx.save();ctx.imageSmoothingEnabled=false;
    ctx.drawImage(effectsCanvas,r.left-64,r.top-64,w*2,h*2);ctx.restore();
  }
  function draw(ctx) {
    if (!running) return;
    ctx.save(); ctx.fillStyle = '#1d1b22';
    ctx.fillRect(G.Camera.left()-64,G.Camera.top()-64,G.Camera.w+128,G.Camera.h+128);
    ctx.translate(ox, oy); ctx.lineWidth = 2;
    G.BossRushArena.draw(ctx, G.Groudon.ARENA,boss?.dex===385?'astral':arenaType());
    ctx.lineWidth = 2;
    for (const h of encounter?.hazards || []) {
      paintShape(ctx, h, encounter.id==='regis'?'#59483888':encounter.clock < h.start ? '#a9532844' : '#e45a1faa', encounter.id==='regis'?'#bca58b':'#ffb34f');
    }
    for (const a of encounter?.attacks || []) {
      if (a.t >= a.warn + a.active) continue;
      const warning = a.t < a.warn;
      ctx.setLineDash(warning ? [7, 5] : []);
      const palette = effects().palette(a.kind);
      const shapes=!warning&&['kyogre','regis','eon','jirachi'].includes(encounter.id)?encounter.hitShapes(a):a.shapes;
      const spriteImpact=!warning&&(encounter.members||encounter.id==='jirachi'||encounter.id==='rayquaza'||encounter.id==='kyogre'&&['surf','hydro','ice'].includes(a.kind));
      if(!spriteImpact)for (const s of shapes) paintShape(ctx, s, warning ? palette.warning : palette.impact, palette.edge);
      for(const safe of a.safes||(a.safe?[a.safe]:[])) {
        ctx.setLineDash([]); paintShape(ctx, safe, '#48d8bd30', '#8ffff0');
        ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#b5fff3';
        ctx.fillText('ZONA SEGURA', 0, (safe.top + safe.bottom) / 2 + 5);
      }
      if (warning) {
        ctx.setLineDash([]); ctx.textAlign = 'center'; ctx.font = 'bold 20px monospace'; ctx.fillStyle = '#ffe6b5';
        for (const s of a.shapes) {
          const x = ['circle','ring'].includes(s.kind) ? s.x : s.kind === 'line' ? (s.ax + s.bx) / 2 : (s.left + s.right) / 2;
          const y = ['circle','ring'].includes(s.kind) ? s.y : s.kind === 'line' ? (s.ay + s.by) / 2 : (s.top + s.bottom) / 2;
          ctx.fillText('!', x, y + 6);
        }
      }
    }
    drawEffects(ctx);
    ctx.restore();
  }
  function hud(ctx, w) {
    if (!running || !boss) return;
    if(bars){bars.draw(ctx,w);ctx.save();ctx.font='11px monospace';ctx.textAlign='center';ctx.fillStyle='#ffffff';ctx.fillText(transition?'¡'+route[stage].title+' derrotado! · Recupera fuerzas':route[stage].title+' · '+bosses.filter(b=>!b.dead).length+'/'+bosses.length+' · '+Math.floor(encounter.clock)+' s',w/2,114);ctx.restore();return;}
    const width = Math.min(420, w - 80), x = (w - width) / 2;
    ctx.save(); ctx.fillStyle = '#15121ef5'; ctx.fillRect(x - 10, 63, width + 20, 42);
    ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe2ba';
    const seconds = Math.floor(encounter?.clock || 0);
    const timer = encounter ? ' · ' + Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2,'0') : '';
    ctx.fillText(boss.name.toUpperCase() + (encounter ? ' · FASE ' + encounter.phase + '/3' : ' · MENOR') + timer, w / 2, 77);
    ctx.fillStyle = '#4e2b35'; ctx.fillRect(x, 82, width, 6);
    ctx.fillStyle = encounter?.recovering ? '#7ce7bc' : arenaType()==='flying'?'#72efb0':arenaType()==='water'?'#51d9f4':'#f67846'; ctx.fillRect(x, 82, width * Math.max(0, boss.hp / boss.maxHp), 6);
    ctx.font = '11px monospace'; ctx.fillStyle = '#fff';
    ctx.fillText(transition ? 'Victoria · Recupera fuerzas' : encounter?.label || 'Combate ' + (stage + 1) + '/'+route.length+' · Gana experiencia', w / 2, 100); ctx.restore();
  }
  function setup() {
    const root = document.createElement('section'); root.id = 'scr-boss-rush'; root.className = 'scr dim hidden';
    root.innerHTML = `<div class="panel rush-setup"><span class="rush-kicker">BOSS RUSH · HOENN</span>
      <h1>El trío de Hoenn</h1><p>Tres legendarios mayores. Aprende sus señales, esquiva y contraataca.</p>
      <div class="rush-route"><b>Tres Regis → Groudon → Dúo Eón → Kyogre → Jirachi → Rayquaza</b><span>Los Regis y el Dúo Eón combaten en grupo, con ataques desfasados y barras individuales.</span></div>
      <div class="rush-fields"><label>Tu Pokémon<select id="rush-partner"></select></label>
      <label>Ataque 1<select id="rush-move-1"></select></label><label>Ataque 2<select id="rush-move-2"></select></label></div>
      <div class="rush-wallet"><b id="rush-balance"></b><div class="rush-actions">
      <button class="btn small" id="rush-upgrades">Mejoras de oro</button>
      <button class="btn small" id="rush-max">Mejorar al máximo</button>
      <button class="btn small ghost" id="rush-refill">Reponer dinero de prueba</button></div></div>
      <p class="sub" id="rush-status" role="status"></p>
      <p class="sub">Mega Swampert, Mega Blaziken y Mega Tyranitar están desbloqueados y equipados al elegirlos. Puedes cambiar sus piedras desde el menú.<br>Para probar Coberturas, abre Mejoras de oro y elige los movimientos compatibles; también aparecerán en los dos selectores de ataques.<br>Empiezas en nivel ${START_LEVEL}: elige ${START_LEVEL-1} mejoras antes de combatir. Cada victoria da experiencia y recupera un 20% de vida. Los legendarios mayores dan un Vínculo para combinar movimientos.<br>La prueba directa de Jirachi empieza en nivel 25, con 24 mejoras por elegir y 2 Vínculos.<br>Prueba individual de la ruta de Hoenn. Tu cuenta y tu progreso no se modifican.</p>
      <div class="rush-actions"><button class="btn gold" id="rush-start">Comenzar Boss Rush</button>
      <button class="btn" id="rush-jirachi">Probar solo a Jirachi</button>
      <button class="btn ghost" id="rush-back">Volver a Jugar</button></div>
      <p id="rush-error" role="status"></p></div>`;
    document.body.appendChild(root);
    const select = document.getElementById('rush-partner');
    for (const dex of roster) select.add(new Option(G.DEX_BY[dex].name + (G.Mega.has(G.DB.save,dex) ? ' · Mega disponible' : ''), String(dex)));
    select.onchange = () => {
      G.DB.save.partner = Number(select.value); refreshMoves(false); refreshSetup();
      document.getElementById('rush-status').textContent = '';
    }; refreshMoves(false);
    document.getElementById('rush-upgrades').onclick = () => {
      const dex = Number(select.value); G.DB.save.partner = dex;
      returnFromUpgrades = true;
      document.querySelector('#scr-menu [data-go="upgrades"]').click();
      const upgradeSelect = document.getElementById('upg-mon');
      upgradeSelect.value = String(dex); upgradeSelect.onchange();
    };
    document.getElementById('rush-refill').onclick = refillFunds;
    document.getElementById('rush-max').onclick = () => maxUpgrades(Number(select.value));
    document.getElementById('rush-back').onclick = () => G.MenuUI.openPlayMode();
    const beginSelected = mode => {
      chosen = [1, 2].map(n => document.getElementById('rush-move-' + n).value);
      if (chosen[0] === chosen[1] || chosen.every(id => G.Moves.BY_ID[id].kind === 'buff')) {
        document.getElementById('rush-error').textContent = 'Elige dos ataques distintos y al menos uno que cause daño.'; return;
      }
      G.DB.save.partner = Number(select.value); G.Audio.unlock(); play(mode);
    };
    document.getElementById('rush-start').onclick=()=>beginSelected('route');
    document.getElementById('rush-jirachi').onclick=()=>beginSelected('jirachi');
  }
  function refreshMoves(preserve = true) {
    const select = document.getElementById('rush-partner');
    if (!select) return;
    const dex = Number(select.value), mon = G.DEX_BY[dex];
    const pool = G.Coverage ? G.Coverage.pool(mon, G.DB.save) : G.Moves.poolFor(mon);
    const mega = G.Mega.equipped(G.DB.save,dex) && G.Mega.definition(dex);
    const defaults = dex === 260 ? [mega ? mega.start : 'water-gun', 'bubble'] : dex === 257 ? ['karate-chop', 'ember'] : dex === 248 ? ['rock-throw', 'bite'] : ['vine-whip', 'razor-leaf'];
    [1,2].forEach((n,i) => {
      const el = document.getElementById('rush-move-' + n), previous = el.value;
      el.replaceChildren();
      for (const id of pool) el.add(new Option(G.Moves.BY_ID[id].name, id));
      el.value = preserve && pool.includes(previous) ? previous : defaults[i];
    });
  }
  function open() {
    if (!document.getElementById('scr-boss-rush')) setup();
    refreshMoves(); refreshSetup(); G.UI.show('scr-boss-rush', true);
    document.getElementById('scr-boss-rush').classList.remove('hidden');
  }
  function play(mode='route') {
    if (G.Game.state !== 'ui' || running) return;
    G.Game.startRun();
    if (G.Game.state === 'playing') start(mode==='jirachi');
  }
  function refreshSetup() {
    const el = document.getElementById('rush-balance');
    if (el) el.textContent = G.DB.save.coins.toLocaleString('es-MX') + ' Pokémonedas de prueba';
    const button = document.getElementById('rush-max'), select = document.getElementById('rush-partner');
    if (button && select) {
      const levels = G.DB.save.pupg[Number(select.value)] || {};
      const full = G.Upgrades.LIST.every(u => (levels[u.id] || 0) >= u.max);
      button.disabled = full; button.textContent = full ? 'Mejoras al máximo ✓' : 'Mejorar al máximo';
    }
  }
  function maxUpgrades(dex = G.DB.save?.partner) {
    dex = Number(dex);
    if (!G.DB.guest || G.Game.state !== 'ui' || running || !roster.includes(dex) || !G.DB.owns(dex)) return false;
    const levels = G.DB.upgradesOf(dex);
    for (const u of G.Upgrades.LIST) levels[u.id] = u.max;
    const status = document.getElementById('rush-status');
    if (status) status.textContent = G.DEX_BY[dex].name + ': todas las mejoras de oro al máximo.';
    refreshSetup(); return true;
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
      for (const dex of [260,257,248]) {
        s.megaStones[G.Mega.definition(dex).id] = Date.now(); G.Mega.equip(s,dex,true);
      }
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
    wrap(G.MenuUI, 'init', old => {
      old(); document.getElementById('btn-boss-rush').onclick = open;
    });
    wrap(G.MenuUI, 'open', old => {
      old();
      if (returnFromUpgrades) { returnFromUpgrades = false; open(); }
    });
    wrap(G.Spawner, 'update', (old, dt, ...args) => {
      if (!running) return old(dt, ...args);
      G.Spawner.tickBanner(dt);
      for (const p of players) {
        const r = G.Groudon.ARENA;
        p.x = Math.max(r.left + 6 + p.r, Math.min(r.right - 6 - p.r, p.x));
        p.y = Math.max(r.top + 6 + p.r, Math.min(r.bottom - 6 - p.r, p.y));
      }
      if (encounter) encounter.update(dt);
      if(bars)bars.update(dt);
      if(boss?.dead&&bosses.some(b=>!b.dead))boss=bosses.find(b=>!b.dead);
      for(const boss of bosses)if (!boss.dead) {
        const r = G.Groudon.ARENA;
        boss.x = Math.max(ox + r.left + 6 + boss.r, Math.min(ox + r.right - 6 - boss.r, boss.x));
        boss.y = Math.max(oy + r.top + 6 + boss.r, Math.min(oy + r.bottom - 6 - boss.r, boss.y));
      }
      if (bosses.length&&bosses.every(b=>b.dead) && !defeated) {
        if(route[stage].members)G.Pickups.dropXp(ox,oy,G.BossRushRules.rewardXp(G.Player.xpFor,G.Game.player.level,G.BossRushRules.rewardLevels(stage)),true,false,true);
        defeated = true; transition = 3; G.Hazards.clear(); G.Projectiles.clear(); G.Combat.clearFields();
        G.Game.player.heal(G.Game.player.maxHp * 0.2); G.Pickups.pullAll();
        G.Spawner.say('¡' + (route[stage].title||boss.name) + ' derrotado! · +20% de vida', 2.5, true);
      } else if (transition > 0 && !G.Game.player.dead) {
        transition -= dt;
        if (transition <= 0) {
          if (!soloJirachi && stage < route.length - 1) { stage++; spawnStage(); }
          else { won = true; ending = true; }
        }
      }
      if (ending && !G.Game.player.dead) { ending = false; G.Game.quit(); }
    });
    for (const obj of [G.Rift, G.Judgment, G.Events, G.Weather, G.Interact]) {
      wrap(obj, 'update', (old, ...args) => { if (!running) return old(...args); });
    }
    wrap(G.Camera, 'resize', (old, ...args) => {
      old.apply(G.Camera, args);
      G.Camera.rushOffsetY = 0;
      if (!running) return;
      const r = G.Groudon.ARENA, cam = G.Camera;
      const [w,h] = args, previousWidth=r.right-r.left,previousHeight=r.bottom-r.top;
      cam.scale = Math.min(w/960,h/560);
      cam.w = w/cam.scale; cam.h = h/cam.scale;
      cam.x = ox; cam.y = oy;
      G.Groudon.resizeArena(cam.w,cam.h);
      const tileSize=Number.isFinite(G.World.TS)?G.World.TS:32;
      G.World.setArena({tx:0,ty:0,r:Math.ceil(Math.hypot(cam.w,cam.h)/(2*tileSize))+3,type:arenaType()});
      G.World.arena.th={...G.Tiles.ARENA_THEMES[arenaType()],pools:0,pillars:0,props:{}};
      // A rotation may shrink one axis dramatically: retire old marks before clamping actors.
      if(cam.w<previousWidth*.8||cam.h<previousHeight*.8) {
        if(encounter?.interrupt)encounter.interrupt();
        else if(encounter) {encounter.attacks=[];encounter.hazards=[];encounter.cooldown=Math.max(.8,encounter.cooldown);}
        if(boss?.ai) {boss.ai.cast=null;boss.ai.melee=[];boss.ai.cd=Math.max(1,boss.ai.cd||0);}
        G.Projectiles.clear();G.Combat.clearFields();G.Hazards.clear();
        if(G.Game.player)G.Game.player.invuln=Math.max(1,G.Game.player.invuln);
      }
      for(const p of players) {
        p.x=Math.max(r.left+p.r+6,Math.min(r.right-p.r-6,p.x));
        p.y=Math.max(r.top+p.r+6,Math.min(r.bottom-p.r-6,p.y));
      }
      for(const boss of bosses) {
        boss.x=Math.max(ox+r.left+boss.r+6,Math.min(ox+r.right-boss.r-6,boss.x));
        boss.y=Math.max(oy+r.top+boss.r+6,Math.min(oy+r.bottom-boss.r-6,boss.y));
      }
    });
    wrap(G.Camera, 'follow', (old, x, y, dt) => old.call(G.Camera, running ? ox : x, running ? oy-(G.Camera.rushOffsetY||0) : y, dt));
    wrap(G.World, 'drawGround', (old, ...args) => { if(!running)return old(...args); });
    wrap(G.World, 'visibleProps', (old, ...args) => running?[]:old(...args));
    wrap(G.World, 'drawLiquid', (old, ctx, ...args) => { if(running)draw(ctx);else old(ctx,...args); });
    wrap(G.HUD, 'draw', (old, ctx, w, ...args) => { old(ctx, w, ...args); hud(ctx, w); });
    wrap(G.Enemy.prototype, 'bossMove', function(old, dt, ...args) {
      if (this.rushMinor) {
        if (!this.ai) this.bossInit();
        if (!this.ai.cast) this.ai.cd -= dt * G.BossRushRules.extraCooldownDecay(this.rushAttackRate, this.ai.fury);
      }
      return old.call(this, dt, ...args);
    });
    wrap(G.Enemy.prototype, 'update', function(old, dt, p) {
      if (!this.rushBoss&&!this.rushGroup&&!this.rushScripted) return old.call(this, dt, p);
      this.anim.update(dt); this.flash = Math.max(0, this.flash - dt); this.touchCd = 999;
      if(this.slowT>0){this.slowT-=dt;if(this.slowT<=0)this.slow=0;}
      const ascent=this.dex===384?encounter?.attacks.find(a=>a.kind==='ascent'):null;
      this.jumpLift=this.dex===385?Math.sin((encounter?.clock||0)*2)*3:ascent&&ascent.t<ascent.warn?Math.sin(Math.min(1,ascent.t/ascent.warn)*Math.PI)*70:0;
      if (this.dead) { this.fade -= dt; return; }
      const casting=this.rushGroup?encounter?.attacks.some(a=>a.owner.source===this&&a.t<a.warn+a.active):encounter?.attack&&!encounter.recovering;
      if (!casting) {
        const moving=this.rushGroup?encounter?.movingMembers.has(encounter.members.find(b=>b.source===this)):encounter?.moving;
        this.anim.loop(moving ? 'Walk' : 'Idle');
        if (moving) this.anim.dir = G.Sprites.dirFromAngle(Math.atan2(p.y - this.y, p.x - this.x));
      }
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
      if (this.rushBoss) {
        G.Game.player.bonds++;
        G.Spawner.say('¡Legendario mayor derrotado! · +1 Vínculo', 3, true);
      }
      if(this.xp>0)G.Pickups.dropXp(this.x, this.y, this.xp, true, false, true);
    });
    wrap(G.RunUI, 'showOver', (old, result, back) => {
      if (!running) return old(result, back);
      old({ ...result, coins: 0, record: false, breakdown: 'Prueba de combate · Sin recompensas', caught: [], megaUnlocked: false }, () => {
        running = false; preparing = false; soloJirachi=false; encounter = null; boss = null;bosses=[];bars=null; G.Game.player.slowT=0; refreshCamera(); back();
      });
      document.getElementById('over-title').textContent = won ? (soloJirachi?'¡Jirachi derrotado!':'¡Trío de Hoenn superado!') : 'Intento terminado';
      document.getElementById('btn-again').textContent = 'Preparar otro intento';
      document.getElementById('over-ask')?.remove();
    });
  }
  init();
  return { START_LEVEL, open, play, refillFunds, maxUpgrades, get encounter() { return encounter; }, get boss() { return boss; }, get running() { return running; },
    get bosses(){return bosses.slice();},get bars(){return bars;},get preparing() { return preparing; }, get stage() { return stage; } };
})();
