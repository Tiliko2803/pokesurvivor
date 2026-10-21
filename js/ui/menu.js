/* ============ menu.js — menú principal, colección y mejoras ============ */
G.MenuUI = (() => {
  const $ = G.UI.$;
  const GEN_NAMES = ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Teselia', 'Kalos', 'Alola', 'Galar', 'Paldea'];
  let dexFilter = 'all', dexGen = 1, dexSel = null;
  const specialCatalog = () => Object.values(G.DEX_BY).filter(p => p.gen === 0 && G.DB.save.owned[p.dex]);

  function init() {
    const ICON = { play: 'ball', dex: 'book', upgrades: 'up', gacha: 'ball4', goals: 'medal3', friends: 'friends', rank: 'trophy', settings: 'gear', gifts: 'ticket' };
    document.querySelectorAll('#scr-menu [data-go]').forEach(b => {
      b.insertAdjacentHTML('afterbegin', `<span class="mi-ico">${G.Icons.html(ICON[b.dataset.go], 26)}</span>`);
      b.dataset.sfx = b.dataset.go === 'play' ? 'confirm' : 'click';
      b.onclick = () => {
        const go = b.dataset.go;
        if (go === 'play') { if (G.Social.room) G.LobbyUI.open(); else openPlayMode(); }
        else if (go === 'dex') openDex();
        else if (go === 'upgrades') openUpgrades();
        else if (go === 'gacha') G.GachaUI.open();
        else if (go === 'gifts') G.GiftsUI.open();
        else if (go === 'goals') G.GoalsUI.open();
        else if (go === 'friends') G.FriendsUI.open();
        else if (go === 'rank') G.RankingUI.open();
        else if (go === 'settings') G.SettingsUI.open();
      };
    });
    document.querySelectorAll('[data-back]').forEach(b => { b.onclick = open; });
    $('btn-normal-run').onclick = () => { if (G.Social.room) G.LobbyUI.open(); else G.Flow.play(); };
    $('btn-challenges').onclick = openChallenges;
    $('challenges-back').onclick = openPlayMode;
    G.Social.on(() => { if (G.UI.isOpen('scr-menu')) socialLine(); });
    $('btn-logout').onclick = () => {
      if (G.DB.guest && !confirm('Eres invitado: se perderá todo el progreso. ¿Salir?')) return;
      G.Audio.music(null);
      G.DB.logout().then(() => G.Flow.toLogin());
    };
  }

  function openPlayMode() { G.UI.show('scr-play-mode', true); }

  function openChallenges() {
    G.UI.show('scr-challenges', true);
    const box = $('challenge-list');
    box.innerHTML = '';
    for (const def of G.Challenges.LIST) {
      const progress = G.Challenges.progress(G.DB.save, def.id);
      const card = document.createElement('article');
      card.className = 'panel challenge-card';
      card.innerHTML = `<h3>${def.name}</h3><p>${def.description}</p>
        <p><b>Reglas especiales:</b> ${def.rules}</p>
        <p><b>Objetivo:</b> sobrevivir ${G.U.mmss(def.duration)} de juego activo. Las pausas y elecciones no cuentan.</p>
        <p><b>Estado:</b> ${progress.completedAt ? 'Completado' : 'Pendiente'}<br>
        <b>Mejor intento:</b> ${G.U.mmss(progress.bestTime)}</p>
        <p class="sub">Recompensa propuesta: ${def.rewardCoins} monedas por la primera victoria. Pendiente de habilitación; esta versión no entrega el premio.</p>
        ${G.DB.guest ? '<p class="sub">Como invitado, el progreso sólo dura esta sesión.</p>' : ''}
        <button class="btn gold" data-sfx="confirm">Comenzar desafío</button>`;
      card.querySelector('button').onclick = () => G.Game.startRun(null, def.id);
      box.appendChild(card);
    }
  }

  // ---------------- menú principal ----------------

  function open() {
    const s = G.DB.save;
    const mon = G.DEX_BY[s.partner];
    const megaDef=G.Mega.definition(mon.dex),megaOn=G.Mega.equipped(s,mon.dex);
    const shiny = !!s.partnerShiny && G.DB.ownsShiny(mon.dex)&&!(megaOn&&megaDef.shiny===false);
    G.UI.chrome(true);
    G.UI.show('scr-menu');
    G.UI.sprite($('menu-partner'), mon.dex, { lively: true, scale: 4, hero: true, shiny, mega: G.Mega.equipped(s,mon.dex) });
    $('menu-partner').style.setProperty('--stage-c', shiny ? '#9ae6ff' : G.U.TYPE_COLOR[mon.types[0]]);
    $('menu-partner').classList.toggle('shiny', shiny);
    $('menu-partner-name').innerHTML = (G.Mega.equipped(s,mon.dex)?'Mega ':'')+mon.name+(shiny?' '+G.Icons.html('shiny',24):'');
    $('menu-partner-info').innerHTML = G.UI.typeChips(mon.types) + ' ' + G.UI.stars(mon.rarity);
    // Normal / shiny a mano, aquí mismo (en el móvil no se encontraba en la ficha).
    const seg = $('menu-shiny');
    seg.classList.toggle('hidden', !G.DB.ownsShiny(mon.dex)||(megaOn&&megaDef.shiny===false));
    seg.lastChild.innerHTML = G.Icons.html('shiny', 12) + ' Shiny';
    seg.querySelectorAll('button').forEach(b => {
      b.classList.toggle('on', (b.dataset.v === '1') === shiny);
      b.onclick = () => {
        if ((b.dataset.v === '1') === shiny) return;
        s.partnerShiny = b.dataset.v === '1';
        G.DB.commit();
        G.Audio.sfx('confirm');
        open();
      };
    });

    const owned = Object.keys(s.owned).filter(d => G.DEX_BY[d]).length;
    const megaBox=$('menu-mega');
    megaBox.classList.toggle('hidden',!megaDef);
    if(megaDef){
      const unlocked=G.Mega.has(s,mon.dex),active=megaOn;
      const best=Math.min(3,(s.megaProgress||{})[megaDef.progress]||0);
      megaBox.innerHTML='<div class="mega-title">'+G.Icons.html('mega',22)+' '+megaDef.name+'</div>'+
        (unlocked?'<div class="mega-help">Piedra permanente · '+megaDef.help+'</div>':
        '<div class="mega-help">Misión: vence 3 jefes en una partida en solitario con '+mon.name+' normal. Mejor: '+best+'/3</div>')+
        '<button class="btn small '+(active?'gold':'')+'" type="button" '+(!unlocked?'disabled':'')+'>'+
        (!unlocked?'🔒 Por desbloquear':active?'Mega equipada · Quitar':'Equipar '+megaDef.name)+'</button>';
      megaBox.querySelector('button').onclick=()=>{
        if(!G.Mega.equip(s,mon.dex,!active))return;
        G.DB.commit();G.Audio.sfx('confirm');open();
      };
    }
    const shinies = Object.keys(s.shiny || {}).length;
    $('menu-dex-count').textContent = `${owned} / ${G.DEX.length}` + (shinies ? ` · ${shinies} shiny` : '');

    const st = s.stats;
    $('menu-stats').innerHTML =
      `Runs <b style="color:#fff">${st.runs}</b> · Mejor tiempo <b style="color:#fff">${G.U.mmss(st.bestTime)}</b><br>` +
      `Mejor nivel <b style="color:#fff">${st.bestLevel}</b> · Derrotados <b style="color:#fff">${st.totalKills.toLocaleString('es')}</b>` +
      (G.DB.guest ? '<br><span style="color:#ffb0b8">Modo invitado: no se guarda</span>' : '');

    const preview = $('btn-maomao-preview');
    preview.classList.toggle('hidden', !G.MaomaoPreview.allowed());
    preview.onclick = () => G.Game.startRun(null, null, 'maomao');

    socialLine();
    // Premios de misiones por recoger.
    G.Progress.checkAch();
    const pend = G.Progress.pending();
    $('menu-goals-sub').textContent = pend ? pend + (pend === 1 ? ' premio por recoger' : ' premios por recoger') : 'Misiones, logros y perfil';
    $('menu-goals-sub').classList.toggle('gold', pend > 0);
    // Con cuenta en la nube: amigos en línea, invitaciones y (una vez) el apodo.
    if (G.DB.online && !G.Social.started) {
      G.Social.start().then(r => {
        if (r === 'need-nick' && !G.NickUI.skipped && G.UI.isOpen('scr-menu')) G.NickUI.open();
        socialLine();
      });
    }
    G.InvitePop.refresh();
  }

  /** Texto bajo "Amigos" y "Jugar": quién está en línea, solicitudes, sala. */
  function socialLine() {
    const room = G.Social.room;
    const play = document.querySelector('#scr-menu [data-go=play] small');
    if (play) play.textContent = room ? 'Volver a tu sala (' + room.members.length + '/' + G.Social.MAX_PLAYERS + ')' : 'Entra en la mazmorra';
    const fr = G.Social.friends;
    const on = fr.filter(f => f.status === 'ok' && f.online).length;
    const req = fr.filter(f => f.status === 'in').length;
    const parts = [];
    if (on) parts.push(on + ' en línea');
    if (req) parts.push(req + (req === 1 ? ' solicitud' : ' solicitudes'));
    $('menu-friends-sub').textContent = parts.length ? parts.join(' · ') : 'Juega en grupo, hasta 4';
    $('menu-friends-sub').classList.toggle('gold', req > 0);
  }

  // ---------------- colección ----------------

  function openDex() {
    G.UI.show('scr-dex', true);
    const s = G.DB.save;
    if (dexSel == null) { dexSel = s.partner; dexGen = G.DEX_BY[s.partner].gen; }
    const owned = Object.keys(s.owned).filter(d => G.DEX_BY[d]).length;
    $('dex-total').textContent = `${owned} / ${G.DEX.length}`;

    // Pestañas de generación, con cuántos tienes de cada una.
    const tabs = $('dex-gens');
    tabs.innerHTML = '';
    GEN_NAMES.forEach((name, i) => {
      const g = i + 1;
      const total = G.DEX.filter(p => p.gen === g).length;
      const have = G.DEX.filter(p => p.gen === g && s.owned[p.dex]).length;
      const b = document.createElement('button');
      b.className = 'gen-tab' + (g === dexGen ? ' on' : '');
      b.innerHTML = `<b>${name}</b><small>${have}/${total}</small>`;
      b.onclick = () => { dexGen = g; openDex(); };
      tabs.appendChild(b);
    });

    const F = [['all', 'Todos'], ['own', 'Tengo'], ['miss', 'Me faltan'], ['shiny', 'Shiny'],
               ['5', 5], ['4', 4], ['3', 3], ['2', 2], ['1', 1]];
    const fb = $('dex-filters');
    fb.innerHTML = '';
    for (const [k, label] of F) {
      const c = document.createElement('button');
      c.className = 'chip' + (k === dexFilter ? ' on' : '');
      c.innerHTML = k === 'shiny' ? G.Icons.html('shiny', 12) + ' Shiny'
                  : typeof label === 'number' ? G.Icons.rarity(label, 12) + ' ' + G.Gacha.RARITY_NAME[label] : label;
      c.onclick = () => { dexFilter = k; openDex(); };
      fb.appendChild(c);
    }
    const specials = specialCatalog();
    if (specials.length) {
      const special = document.createElement('button');
      special.className = 'gen-tab' + (dexGen === 0 ? ' on' : '');
      special.innerHTML = '<b>Especial</b><small>' + specials.length + '/' + Object.values(G.DEX_BY).filter(p => p.gen === 0).length + '</small>';
      special.onclick = () => { dexGen = 0; if (!specials.some(p => p.dex === dexSel)) dexSel = specials[0].dex; openDex(); };
      tabs.appendChild(special);
    }
    if (dexGen === 0 && specials.length && !specials.some(p => p.dex === dexSel)) dexSel = specials[0].dex;
    renderGrid();
    showDetail(dexSel);
  }

  function renderGrid() {
    const s = G.DB.save;
    const grid = $('dex-grid');
    grid.innerHTML = '';
    const catalog = dexGen === 0 ? specialCatalog() : G.DEX;
    for (const p of catalog) {
      if (p.gen !== dexGen) continue;
      const own = !!s.owned[p.dex], sh = !!(s.shiny && s.shiny[p.dex]);
      if (dexFilter === 'own' && !own) continue;
      if (dexFilter === 'miss' && own) continue;
      if (dexFilter === 'shiny' && !sh) continue;
      if (/^\d$/.test(dexFilter) && p.rarity !== +dexFilter) continue;

      const cell = document.createElement('div');
      cell.className = 'cell' + (own ? '' : ' locked') + (p.dex === dexSel ? ' on' : '');
      cell.insertAdjacentHTML('beforeend', `<span class="no">${String(p.dex).padStart(3, '0')}</span>`);
      if (p.dex === s.partner) cell.insertAdjacentHTML('beforeend', `<span class="badge-r" title="Compañero">${G.Icons.html('crown', 14)}</span>`);
      else if (sh) cell.insertAdjacentHTML('beforeend', `<span class="badge-r" title="Tienes su shiny">${G.Icons.html('shiny', 12)}</span>`);
      const useShiny = sh && p.dex === s.partner && s.partnerShiny;
      cell.appendChild(G.UI.spriteCanvas(p.dex, 92, 80, { scale: 2, silhouette: !own, shadow: own, shiny: useShiny }));
      cell.insertAdjacentHTML('beforeend', `<b>${own ? p.name : '???'}</b>${G.UI.stars(p.rarity, 9)}`);
      cell.onclick = () => {
        dexSel = p.dex;
        grid.querySelectorAll('.cell').forEach(c => c.classList.remove('on'));
        cell.classList.add('on');
        showDetail(p.dex);
      };
      grid.appendChild(cell);
    }
    if (!grid.children.length) grid.innerHTML = '<p class="sub" style="grid-column:1/-1">Ninguno con este filtro.</p>';
  }

  // Variante que se está viendo en la ficha (normal o shiny).
  let viewShiny = false;

  function showDetail(dex) {
    const s = G.DB.save;
    const p = G.DEX_BY[dex];
    const own = !!s.owned[dex];
    const hasSh = G.DB.ownsShiny(dex);
    const isPartner = dex === s.partner;
    if (!hasSh) viewShiny = false;
    else if (isPartner && dex !== showDetail.last) viewShiny = !!s.partnerShiny;
    showDetail.last = dex;

    const max = { hp: 183, atk: 1.55, spd: 137 };
    const bar = (label, v, m, txt) =>
      `<div class="stat"><span>${label}</span><div class="bar"><i style="width:${Math.min(100, v / m * 100)}%"></i></div><span>${txt}</span></div>`;
    const usingThis = isPartner && (!hasSh || !!s.partnerShiny === viewShiny);

    const box = $('dex-detail');
    box.innerHTML = `
      <canvas id="dex-big" class="stage" width="220" height="190"></canvas>
      ${hasSh ? `<div class="seg">
          <button class="${viewShiny ? '' : 'on'}" data-v="0">Normal</button>
          <button class="${viewShiny ? 'on' : ''}" data-v="1">${G.Icons.html('shiny', 12)} Shiny</button></div>` : ''}
      <div class="center">
        <div style="color:var(--muted);font-size:13px">Nº ${String(p.dex).padStart(3, '0')} · ${p.gen === 0 ? 'Especial' : GEN_NAMES[p.gen - 1]}</div>
        <h3>${own ? p.name : '???'}</h3>
        <div style="color:${G.Gacha.RARITY_COLOR[p.rarity]}">${G.UI.stars(p.rarity, 24)} ${G.Gacha.RARITY_NAME[p.rarity]}</div>
        <div style="margin:6px 0">${own ? G.UI.typeChips(p.types) : ''}</div>
      </div>
      ${own ? `
        ${bar('Vida', p.hp, max.hp, p.hp)}
        ${bar('Ataque', p.pa ?? p.atk, max.atk, '×' + (p.pa ?? p.atk).toFixed(2))}
        ${bar('At. Esp.', p.sa ?? p.atk, max.atk, '×' + (p.sa ?? p.atk).toFixed(2))}
        ${bar('Defensa', p.df ?? 75, 230, p.df ?? 75)}
        ${bar('Def. Esp.', p.sd ?? 75, 230, p.sd ?? 75)}
        <p class="sub center">Pega mejor con ataques <b>${G.Stats.sideOf(p) === 'special' ? 'especiales' : 'físicos'}</b>${p.types.length === 1 ? ' · Monotipo: +20 % con su tipo' : ''}</p>
        ${bar('Velocidad', p.spd, max.spd, p.spd)}
        <p style="font-size:14px;margin:10px 0 4px">Empieza con <b class="gold">${G.Moves.BY_ID[G.startMoveOf(dex)].name}</b></p>
        <p class="move-icons" title="Movimientos que puede aprender">
          ${(G.Coverage ? G.Coverage.pool(p, s) : G.Moves.poolFor(p)).map(id => `<span title="${G.Moves.BY_ID[id].name}">${G.Icons.html('move:' + id, 16)}</span>`).join('')}</p>
        ${usingThis
          ? '<button class="btn grow" disabled style="width:100%">Es tu compañero</button>'
          : `<button id="dex-pick" class="btn gold" data-sfx="confirm" style="width:100%">Elegir de compañero${viewShiny ? ' (shiny)' : ''}</button>`}
      ` : `<p class="center" style="color:var(--muted)">Aún no lo tienes.<br>Consíguelo en el banner de <b class="gold">${p.gen === 0 ? 'Especial' : GEN_NAMES[p.gen - 1]}</b>
            o derrotándolo cuando salga shiny.</p>`}
    `;
    $('dex-big').style.setProperty('--stage-c', !own ? '#5b83d6' : viewShiny ? '#9ae6ff' : G.U.TYPE_COLOR[p.types[0]]);
    $('dex-big').classList.toggle('shiny', own && viewShiny);
    G.UI.sprite($('dex-big'), dex, { lively: own, spin: own, silhouette: !own, scale: 3, hero: true, shiny: own && viewShiny });
    box.querySelectorAll('.seg button').forEach(b => {
      b.onclick = () => { viewShiny = b.dataset.v === '1'; showDetail(dex); };
    });
    const pick = $('dex-pick');
    if (pick) pick.onclick = () => {
      s.partner = dex;
      s.partnerShiny = hasSh && viewShiny;
      G.DB.commit();
      G.UI.toast(p.name + (s.partnerShiny ? ' shiny' : '') + ' es ahora tu compañero');
      renderGrid(); showDetail(dex);
    };
  }

  // ---------------- mejoras ----------------

  let upgDex = null, repertoireOpen = false, coverageOpen = false;

  function openUpgrades() {
    G.UI.show('scr-upgrades', true);
    const s = G.DB.save;
    if (!upgDex || !s.owned[upgDex]) upgDex = s.partner;
    // Selector con tus Pokémon: el compañero primero, luego los que ya tienen mejoras.
    const sel = $('upg-mon');
    const lv = d => Object.values(s.pupg[d] || {}).reduce((a, b) => a + b, 0);
    const mons = Object.keys(s.owned).map(Number).filter(d => G.DEX_BY[d])
      .sort((a, b) => (b === s.partner) - (a === s.partner) || lv(b) - lv(a) || a - b);
    sel.innerHTML = mons.map(d => `<option value="${d}">${G.DEX_BY[d].name}${d === s.partner ? ' (compañero)' : ''}${lv(d) ? ' · ' + lv(d) + ' niveles' : ''}</option>`).join('');
    sel.value = upgDex;
    sel.onchange = () => { upgDex = +sel.value; G.Audio.sfx('select'); renderUpgrades(); };
    renderUpgrades();
  }

  function renderUpgrades() {
    const s = G.DB.save;
    const levels = G.DB.upgradesOf(upgDex);
    const mon = G.DEX_BY[upgDex];
    const shiny = upgDex === s.partner && !!s.partnerShiny && G.DB.ownsShiny(upgDex);
    G.UI.sprite($('upg-stage'), upgDex, { lively: true, scale: 2, hero: true, shiny });
    $('upg-stage').style.setProperty('--stage-c', shiny ? '#9ae6ff' : G.U.TYPE_COLOR[mon.types[0]]);
    const box = $('upg-list');
    box.innerHTML = '';
    for (const u of G.Upgrades.LIST) {
      const lvl = levels[u.id] || 0;
      const available = u.id === 'coverage' ? Math.min(u.max, G.Coverage.eligible(mon).length) : u.max;
      const maxed = lvl >= available;
      const cost = maxed ? 0 : G.Upgrades.cost(u.id, lvl);
      const el = document.createElement('div');
      el.className = 'panel upg-item' + (u.id === 'moves' ? ' repertoire-upgrade' : '');
      el.innerHTML = `
        <div class="ic">${G.Icons.html(u.icon, 32)}</div>
        <div>
          <b>${u.name}</b> <span style="color:var(--muted);font-size:13px">${u.id === 'moves' ? 'Empiezas con 2 movimientos; eliges el extra' : u.id === 'options' ? `${u.unit} · ${3 + lvl} → ${3 + Math.min(lvl + 1, u.max)}` : u.unit}</span>
          <div class="pips">${Array.from({ length: available }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('')}</div>
        </div>
        <div class="upg-btns">
          ${u.id === 'coverage' && lvl > 0 ? `<button class="btn small" data-coverage>Elegir coberturas (${G.Coverage.selected(mon, s).length}/${G.Coverage.slots(mon, s)})</button>` : ''}
          ${u.id === 'moves' && lvl > 0 ? '<button class="btn small" data-repertoire>Elegir ataque</button>' : ''}
          ${u.id === 'start' && lvl > 0 ? `<button class="btn small" data-start>Elegir: ${G.Moves.BY_ID[G.startMoveOf(upgDex)].name}</button>` : ''}
          ${u.id === 'ban' && lvl > 0 ? `<button class="btn small" data-ban>Elegir (${banList().length}/${lvl})</button>` : ''}
          <button class="btn small ${maxed ? '' : 'gold'}" data-buy data-sfx="none" ${maxed || s.coins < cost ? 'disabled' : ''}>
          ${available === 0 ? 'Sin compatibles' : maxed ? 'Máx.' : `<span class="coin"></span> ${cost}`}</button></div>`;
      if (u.id === 'coverage' && lvl > 0) el.querySelector('[data-coverage]').onclick = () => { coverageOpen = !coverageOpen; renderUpgrades(); };
      if (u.id === 'moves' && lvl > 0) el.querySelector('[data-repertoire]').onclick = () => { repertoireOpen = !repertoireOpen; renderUpgrades(); };
      if (u.id === 'start' && lvl > 0) el.querySelector('[data-start]').onclick = () => { startOpen = !startOpen; renderUpgrades(); };
      if (u.id === 'ban' && lvl > 0) el.querySelector('[data-ban]').onclick = () => { banOpen = !banOpen; renderUpgrades(); };
      el.querySelector('[data-buy]').onclick = () => {
        // Se vuelve a leer todo al pulsar (la partida puede haber cambiado desde que se dibujó).
        const sv = G.DB.save, lv = G.DB.upgradesOf(upgDex), now = lv[u.id] || 0;
        const limit = u.id === 'coverage' ? Math.min(u.max, G.Coverage.eligible(G.DEX_BY[upgDex]).length) : u.max;
        if (now >= limit) { renderUpgrades(); return; }
        const price = G.Upgrades.cost(u.id, now);
        if (sv.coins < price) { renderUpgrades(); return; }
        sv.coins -= price;
        lv[u.id] = now + 1;
        if (u.id === 'coverage') coverageOpen = true;
        G.DB.commit(true);
        G.Audio.sfx('buy');
        G.UI.refreshCoins();
        G.UI.toast(`${mon.name} · ${u.name}: nivel ${now + 1}`);
        renderUpgrades();
      };
      box.appendChild(el);
      if (u.id === 'coverage' && available === 0) {
        const note = document.createElement('p'); note.className = 'sub coverage-empty';
        note.textContent = 'Este Pokémon no tiene coberturas compatibles entre los movimientos actuales del juego.';
        box.appendChild(note);
      }
      if (u.id === 'coverage' && lvl > 0 && coverageOpen) box.appendChild(coveragePicker());
      if (u.id === 'moves' && lvl > 0 && repertoireOpen) box.appendChild(repertoirePicker());
      if (u.id === 'start' && lvl > 0 && startOpen) box.appendChild(startPicker());
      if (u.id === 'ban' && lvl > 0 && banOpen) box.appendChild(banPicker(lvl));
    }
    box.appendChild(bindPanel());
  }

  function coveragePicker() {
    const s = G.DB.save, mon = G.Mega.form(G.DEX_BY[upgDex], s);
    const selected = G.Coverage.selected(mon, s), slots = G.Coverage.slots(mon, s);
    const banned = new Set(banList().slice(0, G.Upgrades.perks(G.DB.upgradesOf(upgDex)).bans));
    const ids = G.Coverage.eligible(mon).sort((a, b) => G.Moves.BY_ID[a].name.localeCompare(G.Moves.BY_ID[b].name, 'es'));
    const el = document.createElement('div'); el.className = 'panel ban-picker coverage-picker';
    el.innerHTML = `<div class="row between"><b>Coberturas · Movimientos adicionales</b><span data-coverage-count>${selected.length}/${slots}</span></div>
      <p class="sub">Elige ataques para que puedan salir en las cartas. Puedes cambiarlos antes de cada partida; conservas cuatro espacios de movimientos.</p>
      <p class="sub">Los ataques elegidos también aparecen en Repertorio, Veto y Atajos. Si Veto bloquea uno, no aparecerá en las cartas.</p>
      <div class="ban-moves">${ids.map(id => { const m = G.Moves.BY_ID[id], on = selected.includes(id);
        const family = G.CoverageData.families && G.CoverageData.families[id] && G.Moves.EVO[id];
        const label = family ? m.name + ' → ' + family[0] : m.name;
        return `<button type="button" class="chip ${on ? 'on' : ''}" data-coverage-id="${id}" aria-pressed="${on}" ${!on && selected.length >= slots ? 'disabled' : ''}>
          ${G.Icons.html('move:' + id, 16)} ${label} <span class="coverage-type">${G.U.TYPE_NAME[m.type]}</span>${banned.has(id) ? ' · Veto' : ''}</button>`;
      }).join('')}</div><button type="button" class="btn small ghost" data-coverage-clear ${selected.length ? '' : 'disabled'}>Vaciar coberturas</button>`;
    const commit = ids => {
      if (!G.Coverage.choose(mon, s, ids)) return;
      G.DB.commit(true); G.Audio.sfx('select'); renderUpgrades();
    };
    el.querySelectorAll('[data-coverage-id]').forEach(b => {
      b.onclick = () => {
        const current = G.Coverage.selected(mon, s), id = b.dataset.coverageId;
        commit(current.includes(id) ? current.filter(x => x !== id) : current.concat(id));
      };
    });
    el.querySelector('[data-coverage-clear]').onclick = () => commit([]);
    return el;
  }

  function repertoirePicker() {
    const s = G.DB.save, mon = G.Mega.form(G.DEX_BY[upgDex], s);
    const chosen = G.Repertoire.selected(mon, s);
    const ids = G.Repertoire.pool(mon, s).sort((a, b) => G.Moves.BY_ID[a].name.localeCompare(G.Moves.BY_ID[b].name, 'es'));
    const el = document.createElement('div');
    el.className = 'panel ban-picker repertoire-picker';
    el.innerHTML = `<b>Repertorio · Ataque extra</b>
      <p class="sub" style="margin:4px 0 8px">Elige el segundo ataque con el que empieza ${mon.name}. Se conserva para tus siguientes partidas. Respeta Veto; el ataque principal se mantiene.</p>
      <p class="sub">Elegido: <b>${chosen ? G.Moves.BY_ID[chosen].name : 'Aleatorio'}</b></p>
      <div class="ban-moves"><button class="chip ${chosen ? '' : 'on'}" data-repertoire-id="" aria-pressed="${!chosen}">Aleatorio</button>
      ${ids.map(id => { const d = G.Moves.BY_ID[id]; return `<button class="chip ${chosen === id ? 'on' : ''}" data-repertoire-id="${id}" aria-pressed="${chosen === id}" title="${d.name}">${G.Icons.html('move:' + id, 16)} ${d.name}</button>`; }).join('')}</div>
      ${ids.length ? '' : '<p class="sub">No quedan ataques compatibles. Revisa los movimientos de Veto.</p>'}`;
    el.querySelectorAll('[data-repertoire-id]').forEach(b => {
      b.onclick = () => {
        if (!G.Repertoire.choose(mon, s, b.dataset.repertoireId || null)) return;
        G.DB.commit();
        G.Audio.sfx('select');
        renderUpgrades();
      };
    });
    return el;
  }

  // ---------------- atajos: hueco fijo para cada movimiento ----------------
  // save.pbind[dex] = [movimiento del hueco 1, del 2, del 3, del 4] (o null).
  function bindPanel() {
    const s = G.DB.save;
    s.pbind = s.pbind || {};
    const list = s.pbind[upgDex] || [null, null, null, null];
    const mon = G.DEX_BY[upgDex];
    const ids = (G.Coverage ? G.Coverage.pool(mon, s) : G.Moves.poolFor(mon)).concat([G.startMoveOf(upgDex)]).filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => G.Moves.BY_ID[a].name.localeCompare(G.Moves.BY_ID[b].name, 'es'));
    const el = document.createElement('div');
    el.className = 'panel bind-panel';
    el.innerHTML = `<b>Atajos de movimientos</b>
      <p class="sub" style="margin:2px 0 8px">Elige qué movimiento va siempre en cada hueco (teclas 1-4 o los iconos de abajo), para la memoria muscular. Si aún no tienes tantos movimientos, va al hueco más cercano.</p>
      <div class="bind-slots">${[0, 1, 2, 3].map(i => `<label class="bind-slot"><span>${i + 1}</span>
        <select class="field" data-slot="${i}"><option value="">Libre</option>${ids.map(id =>
          `<option value="${id}" ${list[i] === id ? 'selected' : ''}>${G.Moves.BY_ID[id].name}</option>`).join('')}</select></label>`).join('')}</div>`;
    el.querySelectorAll('select[data-slot]').forEach(sel => {
      sel.onchange = () => {
        const l = (s.pbind[upgDex] || [null, null, null, null]).slice(0, 4);
        while (l.length < 4) l.push(null);
        const i = +sel.dataset.slot, id = sel.value || null;
        // Un movimiento sólo puede estar en un hueco.
        for (let j = 0; j < 4; j++) if (id && l[j] === id) l[j] = null;
        l[i] = id;
        s.pbind[upgDex] = l;
        G.DB.commit();
        G.Audio.sfx('select');
        renderUpgrades();
      };
    });
    return el;
  }

  // ---------------- movimiento inicial (Mejoras → Movimiento inicial) ----------------
  let startOpen = false;
  function startPicker() {
    const s = G.DB.save, cur = G.startMoveOf(upgDex), base = G.baseStartOf(upgDex);
    const ids = G.startChoices(upgDex).sort((a, b) => G.Moves.BY_ID[a].name.localeCompare(G.Moves.BY_ID[b].name, 'es'));
    const el = document.createElement('div');
    el.className = 'panel ban-picker';
    el.innerHTML = `<p class="sub" style="margin:0 0 8px">Elige con qué ataque empieza. Lo puedes cambiar cuando quieras, gratis.</p>
      <div class="ban-moves">${ids.map(id => { const d = G.Moves.BY_ID[id];
        return `<button class="chip ${id === cur ? 'on' : ''}" data-id="${id}">${G.Icons.html('move:' + id, 16)} ${d.name}${id === base ? ' <small>(de serie)</small>' : ''}</button>`; }).join('')}</div>`;
    el.querySelectorAll('[data-id]').forEach(b => {
      b.onclick = () => {
        const id = b.dataset.id;
        s.pstart = s.pstart || {};
        if (id === base) delete s.pstart[upgDex]; else s.pstart[upgDex] = id;
        // El inicial no puede estar vetado.
        const l = banList(), i = l.indexOf(id);
        if (i >= 0) l.splice(i, 1);
        G.DB.commit();
        G.Audio.sfx('select');
        G.UI.toast(G.DEX_BY[upgDex].name + ' empezará con ' + G.Moves.BY_ID[id].name);
        renderUpgrades();
      };
    });
    return el;
  }

  // ---------------- veto: movimientos bloqueados ----------------
  // Lista por Pokémon en save.pban[dex]; con N niveles de Veto, N movimientos.
  let banOpen = false;
  function banList() {
    const s = G.DB.save;
    s.pban = s.pban || {};
    return s.pban[upgDex] || (s.pban[upgDex] = []);
  }
  function banPicker(max) {
    const mon = G.DEX_BY[upgDex];
    const start = G.startMoveOf(upgDex);
    const list = banList();
    const learnable = G.Coverage ? G.Coverage.pool(mon, G.DB.save) : G.Moves.poolFor(mon);
    const ids = [...new Set(learnable.concat(list))].filter(id => id !== start && G.Moves.BY_ID[id])
      .sort((a, b) => G.Moves.BY_ID[a].name.localeCompare(G.Moves.BY_ID[b].name, 'es'));
    const el = document.createElement('div');
    el.className = 'panel ban-picker';
    el.innerHTML = `<p class="sub" style="margin:0 0 8px">Toca los movimientos que no quieres que te salgan en las cartas (${list.length}/${max}). El movimiento de inicio no se puede vetar.</p>
      <div class="ban-moves">${ids.map(id => { const d = G.Moves.BY_ID[id]; const on = list.includes(id);
        return `<button class="chip ${on ? 'on ban' : ''}" data-id="${id}">${G.Icons.html('move:' + id, 16)} ${d.name}${on ? ' ' + G.Icons.html('ban', 14) : ''}</button>`; }).join('')}</div>`;
    el.querySelectorAll('[data-id]').forEach(b => {
      b.onclick = () => {
        const l = banList(), id = b.dataset.id, i = l.indexOf(id);
        if (i >= 0) l.splice(i, 1);
        else if (l.length >= max) { G.UI.toast('Ya tienes ' + max + ' vetados: quita uno primero'); return; }
        else l.push(id);
        G.DB.commit();
        G.Audio.sfx('select');
        renderUpgrades();
      };
    });
    return el;
  }

  return { init, open, openPlayMode, openChallenges, GEN_NAMES };
})();
