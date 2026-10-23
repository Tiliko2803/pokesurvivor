/* Touch-first TFT screen. The survivor remains in its menu state. */
G.TFTUI = (() => {
  'use strict';
  const $=id=>document.getElementById(id),E=G.TFT;
  let state=null,selected=null,active=false,frame=0,last=0,paused=false,speed=1,quitPending=false;
  const DECK_KEY='ps.tft.decks.v1',MATCH_KEY='ps.tft.match.v1';
  let saveClock=0;
  let decks=loadDecks(),slot=0,picks=new Set(decks[0]),editing=true;
  function loadDecks() {
    try {const a=JSON.parse(localStorage.getItem(DECK_KEY));if(Array.isArray(a)&&a.length===3&&a.every(E.validDeck))return a;}
    catch(_){} return Array.from({length:3},()=>E.DEFAULT_DECK.slice());
  }
  function saveDeck() {
    const deck=[...picks];if(!E.validDeck(deck))return false;
    decks[slot]=deck.slice();
    try {localStorage.setItem(DECK_KEY,JSON.stringify(decks));$('tft-deck-status').textContent='Mazo '+(slot+1)+' guardado en este dispositivo.';}
    catch(_) {$('tft-deck-status').textContent='El navegador no permite guardar. Puedes jugar con el mazo durante esta sesión.';}
    return true;
  }
  function persist() {
    if(!state)return false;
    try {localStorage.setItem(MATCH_KEY,E.serialize(state));if($('tft-save-status').textContent!=='Partida guardada en este dispositivo.')$('tft-save-status').textContent='Partida guardada en este dispositivo.';return true;}
    catch(_){$('tft-save-status').textContent='No se pudo guardar. Mantén esta pestaña abierta para conservar la partida.';return false;}
  }
  function loadMatch() {try{return E.restore(localStorage.getItem(MATCH_KEY));}catch(_){return null;}}
  function showMatch() {
    editing=false;$('tft-deck-panel').classList.add('hidden');$('tft-match').classList.remove('hidden');
    $('tft-current-deck').textContent='Mi mazo · 10 líneas';$('tft-deck-summary').textContent=state.deck.map(d=>G.DEX_BY[d].name).join(' · ');
    selected=null;seenEvents=new WeakSet();anims.clear();views.clear();shownEvolution=null;reportScope='ally';lastReport=null;render();
  }
  function editDeck() {state=null;selected=null;editing=true;picks=new Set(decks[slot]);renderDeck();}
  function renderDeck() {
    $('tft-deck-panel').classList.remove('hidden');$('tft-match').classList.add('hidden');
    $('tft-stats').textContent='Construye tu equipo antes de entrar';$('tft-quit').classList.add('hidden');
    $('tft-deck-count').textContent=picks.size+'/10 líneas';
    $('tft-deck-save').disabled=$('tft-deck-start').disabled=picks.size!==10;
    $('tft-deck-slots').innerHTML=decks.map((_,i)=>`<button class="btn small ${i===slot?'gold':''}" data-slot="${i}" aria-pressed="${i===slot}">Mazo ${i+1}</button>`).join('');
    $('tft-deck-slots').querySelectorAll('button').forEach(b=>b.onclick=()=>{slot=Number(b.dataset.slot);picks=new Set(decks[slot]);$('tft-deck-status').textContent='';renderDeck();});
    const cost=Number($('tft-deck-filter').value);
    $('tft-deck-list').innerHTML=E.ROSTER.filter(f=>!cost||f.cost===cost).map(f=>`<button class="tft-card ${picks.has(f.dex)?'tft-selected':''}" data-family="${f.dex}" aria-label="Línea ${G.DEX_BY[f.dex].name}" aria-pressed="${picks.has(f.dex)}"><canvas width="110" height="70" data-tft-dex="${f.dex}" aria-hidden="true"></canvas><b>${G.DEX_BY[f.dex].name}</b><span>${f.cost} oro ${picks.has(f.dex)?'✓':''}</span><small>${f.line.map(d=>G.DEX_BY[d].name).join(' → ')}</small></button>`).join('');
    $('tft-deck-list').querySelectorAll('button').forEach(b=>b.onclick=()=>{
      const d=Number(b.dataset.family);
      if(picks.has(d))picks.delete(d);else if(picks.size<10)picks.add(d);else {G.UI.toast('Quita una línea antes de elegir otra: el mazo tiene 10 espacios.');return;}
      $('tft-deck-status').textContent='';renderDeck();
    });
    paintCards(0);
  }
  const anims=new Map(),views=new Map();
  let shownEvolution=null,infoClock=0,reportScope='ally',lastReport=null;
  let seenEvents=new WeakSet();
  const TYPE=()=>G.U.TYPE_NAME;
  const aiNames={healer:'Apoyo · cura',guardian:'Guardián · protege aliados',ranged:'Distancia · retrocede',diver:'Asaltante · busca retaguardia',tank:'Tanque · primera línea',fighter:'Luchador · persigue'};
  const effects={attack:'daño +15/30%',hp:'vida +20/40%',armor:'defensa +20/40',speed:'ataques +15/30%',
    mana:'maná por golpe +5/10',regen:'cura 1,5/3% de vida por segundo',pierce:'ignora 15/30% de defensa',slow:'ralentiza ataques 15/30%'};
  function open() {
    if(G.Social.room){G.UI.toast('Sal de la sala de cooperativo para jugar TFT individual.');return;}
    if(G.Game.state!=='ui')return;
    active=true;quitPending=false;document.body.classList.add('tft-active');document.body.classList.toggle('tft-calm',!!G.Settings?.get('calm'));G.UI.chrome(false);G.UI.show('scr-tft');
    if(!state)state=loadMatch();
    paused=state?.phase==='combat';
    if(state)showMatch();else editDeck();
    last=0;if(!editing)render();cancelAnimationFrame(frame);frame=requestAnimationFrame(loop);
  }
  function reset() {if(!saveDeck())return;state=E.create(Date.now(),[...picks]);paused=false;showMatch();persist();}
  function close() {
    if(state&&!persist()&&!quitPending){quitPending=true;render();return;}
    active=false;quitPending=false;cancelAnimationFrame(frame);anims.clear();state=null;
    document.body.classList.remove('tft-active','tft-calm');G.UI.hide('scr-tft');G.Flow.goMenu();
  }
  function act(fn) {
    if(!fn()){G.UI.toast('Acción no disponible: revisa el oro, el banquillo o el límite de equipo.');return;}
    if(!state.units.some(u=>u.id===selected))selected=null;
    persist();render();
  }
  function unitCard(u,kind,index) {
    const p=G.DEX_BY[u.dex],def=E.BY[u.dex],next=E.evolvedDex(u.dex,Math.min(3,u.star+1));
    const action=kind==='shop'?`data-buy="${index}"`: `data-unit="${u.id}"`;
    const label=kind==='shop'?`Comprar ${p.name}, ${def.cost} de oro`:`Seleccionar ${p.name}, ${u.star} estrellas`;
    return `<button class="tft-card ${selected===u.id?'tft-selected':''}" ${action} aria-label="${label}" ${kind==='shop'&&(state.phase!=='planning'||state.gold<def.cost)?'disabled':''}>
      <canvas width="110" height="70" data-tft-dex="${u.dex}" aria-hidden="true"></canvas>
      <b>${p.name}</b><span>${kind==='shop'?def.cost+' oro':'★'.repeat(u.star)}</span>
      <small>${p.types.map(t=>TYPE()[t]).join(' · ')}</small>
      <small>${kind==='shop'?aiNames[E.aiFor(u.dex)]:u.star<3?(next!==u.dex?'→ '+G.DEX_BY[next].name:'→ Potenciar'):'Máximo'}</small></button>`;
  }
  function render() {
    if(!state)return;
    const s=state,planning=s.phase==='planning',deployed=s.units.filter(u=>u.pos!==null),u=s.units.find(u=>u.id===selected);
    $('tft-stats').textContent=`Ronda ${s.round}/${E.LAST_ROUND} · ${s.life} PV · ${s.gold} oro · Equipo ${deployed.length}/${s.level}`;
    $('tft-phase').textContent=paused?'En pausa':{planning:'Preparación',combat:'Combate automático',result:'Fin de ronda',victory:'¡Desafío superado!',defeat:'Equipo derrotado'}[s.phase];
    $('tft-help').textContent=u?`${G.DEX_BY[u.dex].name} ${'★'.repeat(u.star)} · ${E.moveFor(u)} · ${aiNames[E.aiFor(u.dex)]}. ${planning?'Toca una casilla azul para colocarlo o intercambiarlo.':'Toca otra unidad para consultar su ficha.'}`:planning?'Compra Pokémon, toca uno del banquillo y después una casilla azul. Tres copias del mismo nivel se fusionan y evolucionan.':'Toca una unidad del tablero para consultar sus estadísticas y habilidad.';
    $('tft-shop').innerHTML=s.shop.map((dex,i)=>dex?unitCard({dex,star:1},'shop',i):'<div class="tft-card tft-empty">Comprado</div>').join('');
    const bench=s.units.filter(u=>u.pos===null);
    $('tft-bench').innerHTML=bench.map(v=>unitCard(v,'bench')).join('')+
      Array.from({length:E.BENCH-bench.length},()=>'<div class="tft-bench-empty" aria-hidden="true">·</div>').join('');
    $('tft-bench-count').textContent=`Banquillo ${bench.length}/${E.BENCH}`;
    $('tft-shop').querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>act(()=>E.buy(s,Number(b.dataset.buy))));
    $('tft-bench').querySelectorAll('[data-unit]').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.unit);render();});
    $('tft-reroll').disabled=!planning||s.gold<2;
    $('tft-xp').disabled=!planning||s.gold<4||s.level===6;
    $('tft-xp').textContent=s.level===6?'Nivel máximo':`+4 EXP · 4 oro (${s.xp}/${E.XP[s.level+1]})`;
    $('tft-lock').disabled=!planning;$('tft-lock').textContent=s.locked?'Tienda bloqueada 🔒':'Bloquear tienda';
    $('tft-lock').setAttribute('aria-pressed',String(s.locked));
    $('tft-sell').disabled=!planning||!u;
    $('tft-sell').textContent=u?`Vender · ${E.BY[u.dex].cost*3**(u.star-1)} oro`:'Vender seleccionado';
    $('tft-return').disabled=!planning||!u||u.pos===null;
    $('tft-fight').disabled=!planning||!deployed.length;
    $('tft-pause').disabled=s.phase!=='combat';$('tft-pause').textContent=paused?'Reanudar':'Pausar';
    $('tft-speed').textContent=`Velocidad ×${speed}`;
    $('tft-next').classList.toggle('hidden',s.phase!=='result');
    $('tft-restart').classList.toggle('hidden',s.phase==='combat');
    $('tft-result').textContent=s.result?`${s.result.draw?'Tiempo agotado':s.result.won?'Victoria de ronda':'Derrota de ronda'} · +${s.result.income} oro (incluye ${s.result.interest} de interés y ${s.result.bonus} por racha). ${s.phase==='victory'?'Completaste las 12 rondas con vida.':''}`:'';
    $('tft-quit').classList.toggle('hidden',!quitPending);
    const tr=E.traits(deployed);
    $('tft-traits').innerHTML=Object.entries(tr).sort((a,b)=>b[1].count-a[1].count).map(([t,v])=>
      `<span class="tft-trait ${v.tier?'on':''}">${TYPE()[t]} ${v.count} · ${v.tier?'Nv. '+v.tier:'requiere 2'}<small>${effects[E.EFFECTS[t]]}</small></span>`).join('')||'<span class="sub">Despliega 2 o 4 familias distintas del mismo tipo para activar sus bonos.</span>';
    syncCells();renderInfo();renderReport();renderScout();
    paint(0);
  }
  function renderScout() {
    const panel=$('tft-scout');panel.classList.toggle('hidden',state.phase!=='planning');
    if(state.phase!=='planning')return;
    const foes=E.scout(state),tr=E.traits(foes);
    $('tft-scout-list').innerHTML=foes.map(u=>`<button class="btn small" data-scout="${u.id}">${G.DEX_BY[u.dex].name} ${'★'.repeat(u.star)} · ${aiNames[E.aiFor(u.dex)]}</button>`).join('');
    $('tft-scout-notes').textContent='Sinergias rivales: '+(Object.entries(tr).filter(([,v])=>v.tier).map(([t,v])=>TYPE()[t]+' Nv. '+v.tier).join(' · ')||'ninguna activa')+'. Toca un rival para consultar su habilidad. Ajusta tu primera línea frente a sus atacantes y protege a tus apoyos.';
    $('tft-scout-list').querySelectorAll('button').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.scout);syncCells();renderInfo();});
  }
  function renderReport() {
    const panel=$('tft-report');panel.classList.toggle('hidden',!state?.result);if(!state?.result)return;
    if(lastReport!==state.result){lastReport=state.result;reportScope='ally';panel.open=true;}
    $('tft-report-title').textContent=reportScope==='match'?'Informe acumulado · '+state.history.length+(state.history.length===1?' ronda':' rondas'):'Informe de combate · ronda '+state.result.round;
    panel.querySelectorAll('[data-report]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.report===reportScope)));
    const rows=E.report(state,reportScope),fmt=n=>Math.round(n).toLocaleString('es');
    $('tft-report-rows').innerHTML=rows.map(u=>`<tr><td title="Bajas: ${u.kills} · Daño recibido: ${fmt(u.taken)}">${G.DEX_BY[u.dex].name} ${'★'.repeat(u.star)}</td><td>${fmt(u.damage)}</td><td>${fmt(u.healing)}</td><td>${fmt(u.shielding)}</td><td>${fmt(u.blocked)}</td></tr>`).join('');
    const totals=rows.reduce((a,u)=>({damage:a.damage+u.damage,healing:a.healing+u.healing,shielding:a.shielding+u.shielding,blocked:a.blocked+u.blocked}),{damage:0,healing:0,shielding:0,blocked:0});
    $('tft-report-rows').insertAdjacentHTML('beforeend',`<tr class="tft-report-total"><td>Total</td><td>${fmt(totals.damage)}</td><td>${fmt(totals.healing)}</td><td>${fmt(totals.shielding)}</td><td>${fmt(totals.blocked)}</td></tr>`);
    const leader=rows[0];$('tft-report-notes').textContent=leader?`Mayor daño: ${G.DEX_BY[leader.dex].name} · ${fmt(leader.damage)}. Compara las contribuciones para ajustar tu mazo y sus posiciones.`:'Sin unidades en este informe.';
  }
  function currentUnits() {
    return state.battle&&state.phase!=='planning'?state.battle.units:[...state.units.filter(u=>u.pos!==null).map(u=>({...u,x:u.pos%6,y:Math.floor(u.pos/6),side:0})),...E.scout(state).map(u=>({...u,x:u.pos%6,y:Math.floor(u.pos/6),side:1}))];
  }
  function syncCells() {
    if(!state)return;
    const planning=state.phase==='planning',units=currentUnits();
    $('tft-cells').querySelectorAll('button').forEach((b,pos)=>{
      const unit=units.find(u=>u.x===pos%6&&u.y===Math.floor(pos/6)&&u.hp!==0);
      b.disabled=planning?pos<18&&!unit:!unit;
      b.setAttribute('aria-label',planning?`${pos<18?'Terreno rival':'Tu terreno'} fila ${Math.floor(pos/6)+1}, columna ${pos%6+1}${unit?', '+G.DEX_BY[unit.dex].name+' '+unit.star+' estrellas':''}`:
        unit?`${unit.side===0?'Aliado':'Rival'} ${G.DEX_BY[unit.dex].name}, fila ${Math.floor(pos/6)+1}, columna ${pos%6+1}`:'Casilla vacía');
      b.classList.toggle('tft-selected-cell',!!unit&&unit.id===selected);
    });
  }
  function renderInfo() {
    if(!state)return;
    const unit=state.battle&&state.phase!=='planning'?state.battle.units.find(v=>v.id===selected)||state.units.find(v=>v.id===selected):state.units.find(v=>v.id===selected)||E.scout(state).find(v=>v.id===selected);
    const box=$('tft-unit-info');
    if(!unit){box.innerHTML='<p>Toca una unidad del tablero o banquillo para ver su vida, daño, habilidad y sinergias.</p>';return;}
    const rival=unit.id<0,f=unit.maxHp?unit:E.preview(state,unit),ability=E.abilityFor(unit),entry=E.entranceFor(unit),p=G.DEX_BY[unit.dex];
    const tr=E.traits(state.units.filter(v=>v.pos!==null));
    box.innerHTML=`<h3>${p.name} ${'★'.repeat(unit.star)}${rival?' · Rival':''}</h3><p>${p.types.map(t=>TYPE()[t]).join(' · ')} · ${aiNames[E.aiFor(unit.dex)]}</p>
      <dl><div><dt>Vida</dt><dd>${Math.ceil(f.hp)}/${Math.ceil(f.maxHp)}</dd></div><div><dt>Daño/pulso</dt><dd>${Math.round(f.attack*(2*E.BEAT_SECONDS)/f.interval)}</dd></div><div><dt>Defensa</dt><dd>${f.armor}</dd></div><div><dt>Potencia de cadencia</dt><dd>×${((2*E.BEAT_SECONDS)/f.interval).toFixed(2)}</dd></div><div><dt>Maná</dt><dd>${Math.floor(f.mana)}/100</dd></div><div><dt>Escudo</dt><dd>${Math.ceil(f.shield)}</dd></div></dl>
      <div class="tft-ability tft-entry"><small>AL INICIO · una vez por combate</small><h4>${entry.name}</h4><p>${entry.description}</p></div><div class="tft-ability"><small>MOVIMIENTO · al llegar a 100 de maná</small><h4>${ability.name} · ${TYPE()[ability.type]}</h4><p>${ability.description}</p></div>
      ${rival?'':`<p class="sub">${p.types.map(t=>TYPE()[t]+': '+(tr[t]?.tier?'bono Nv. '+tr[t].tier:'sin bono')).join(' · ')}</p>`}`;
  }
  function showEvolution() {
    const e=state.effects[state.effects.length-1],box=$('tft-evolution');
    box.classList.toggle('hidden',!e);if(!e){shownEvolution=null;return;}
    if(shownEvolution===e)return;shownEvolution=e;
    box.innerHTML=`<canvas width="110" height="70" data-tft-dex="${e.fromDex}" aria-hidden="true"></canvas><div><b>${e.fromDex===e.toDex?'¡Potenciación!':'¡Evolución!'}</b><p>${G.DEX_BY[e.fromDex].name} → ${G.DEX_BY[e.toDex].name} ${'★'.repeat(e.star)}</p></div><canvas width="110" height="70" data-tft-dex="${e.toDex}" aria-hidden="true"></canvas>`;
  }
  function animator(key,dex) {
    let a=anims.get(key);
    if(!a||a.dex!==dex){a=new G.Sprites.Animator(dex);anims.set(key,a);}
    return a;
  }
  function drawSprite(ctx,key,dex,x,y,size,dt,side=0,flash=0,facing=null,alpha=1,boost=1) {
    const a=animator(key,dex),meta=G.Sprites.animMeta(dex,'Idle');
    a.scale=Math.min(size/Math.max(25,(meta?.h||32)*2),1)*boost;
    a.dir=facing??(side===0?4:0);a.update(dt);a.draw(ctx,x,y,{flash:flash>0,alpha});
  }
  function paint(dt) {
    const cv=$('tft-board'),ctx=cv.getContext('2d'),cell=100;
    ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,600,600);
    for(let y=0;y<6;y++)for(let x=0;x<6;x++){
      ctx.fillStyle=y<3?((x+y)%2?'#40314b':'#35293e'):((x+y)%2?'#193e5b':'#16354d');
      ctx.fillRect(x*cell,y*cell,cell-2,cell-2);
    }
    ctx.strokeStyle='#ffd365';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,300);ctx.lineTo(600,300);ctx.stroke();
    const combat=state.phase!=='planning'&&state.battle;
    if(combat)for(const fx of state.battle.events.filter(e=>e.kind==='area')) {
      ctx.fillStyle=G.U.TYPE_COLOR[fx.type]||'#d1b783';ctx.globalAlpha=Math.max(0,fx.ttl)*.38;
      for(let y=0;y<6;y++)for(let x=0;x<6;x++)if(Math.abs(x-fx.x)+Math.abs(y-fx.y)<=fx.radius)ctx.fillRect(x*100+3,y*100+3,94,94);
      ctx.globalAlpha=1;
    }
    const units=currentUnits(),calm=G.Settings?.get('calm');
    showEvolution();
    if(combat)for(const e of state.battle.events) {
      if(seenEvents.has(e))continue;seenEvents.add(e);
      const u=units.find(u=>u.id===e.from);if(!u)continue;
      const a=animator(`board:${u.id}`,u.dex);
      if(e.kind==='cast')a.play('Shoot');else if(e.kind==='hit')a.play('Attack');
    }
    for(const u of units) {
      const key=`board:${u.id}`,a=animator(key,u.dex);
      let v=views.get(key);if(!v||v.dex!==u.dex){v={x:u.x,y:u.y,dex:u.dex,deadAge:0};views.set(key,v);}
      const moving=Math.abs(v.x-u.x)+Math.abs(v.y-u.y)>.03;
      if(!combat||calm){v.x=u.x;v.y=u.y;}else {const k=Math.min(1,dt*14);v.x+=(u.x-v.x)*k;v.y+=(u.y-v.y)*k;}
      if(combat&&u.hp<=0){if(v.deadAge===0)a.play('Faint');v.deadAge+=dt;if(v.deadAge>=.5)continue;}
      if(['Idle','Walk'].includes(a.cur))a.loop(moving?'Walk':'Idle');
      const alpha=combat&&u.hp<=0?1-v.deadAge/.5:1;
      const target=combat&&u.hp>0?E.selectTarget(state.battle,u):null;
      const facing=target?G.Sprites.dirFromAngle(Math.atan2(target.y-u.y,target.x-u.x)):null;
      const age=combat?state.battle.time-(state.battle.beatStarted||0):1;
      const hop=!calm&&u.hp!==0&&state.phase==='combat'&&(state.battle.beat===1||state.battle.beat===3&&moving)?Math.sin(Math.PI*Math.min(1,age/.26))*11:0;
      const x=v.x*cell+50,y=v.y*cell+76-hop;
      ctx.globalAlpha=alpha;
      ctx.fillStyle=u.side===0?'#69e5b580':'#ff718b80';ctx.beginPath();ctx.ellipse(x,y-3,25,9,0,0,Math.PI*2);ctx.fill();
      if(u.id===selected){ctx.strokeStyle='#ffe08a';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y-3,32,12,0,0,Math.PI*2);ctx.stroke();}
      const evo=state.effects.find(e=>e.id===u.id);
      if(evo){ctx.strokeStyle='#ffe08a';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y-25,calm?36:28+(1.6-evo.ttl)*15,0,Math.PI*2);ctx.stroke();}
      drawSprite(ctx,key,u.dex,x,y,65,dt,u.side,calm?0:u.flash,facing,alpha,evo&&!calm?1+Math.sin(evo.ttl*10)*.1:1);
      ctx.globalAlpha=alpha;ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff';
      ctx.fillText(G.DEX_BY[u.dex].name,x,y+12);ctx.fillStyle='#ffda6b';ctx.fillText('★'.repeat(u.star),x,v.y*cell+15);
      if(combat&&u.hp>0){
        ctx.fillStyle='#111b2a';ctx.fillRect(x-34,v.y*cell+21,68,6);
        ctx.fillStyle=u.side===0?'#5df0a9':'#ff718b';ctx.fillRect(x-34,v.y*cell+21,68*u.hp/u.maxHp,6);
        ctx.fillStyle='#5dbfff';ctx.fillRect(x-34,v.y*cell+29,68*u.mana/100,3);
        if(u.shield>0){ctx.fillStyle='#a4dcff99';ctx.fillRect(x-34,v.y*cell+21,68*Math.min(.5,u.shield/u.maxHp),6);ctx.strokeStyle='#a4dcff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y-26,34,Math.PI,2*Math.PI);ctx.stroke();}
        if(u.burn) {ctx.fillStyle='#ffad59';ctx.fillText('🔥',x+27,y-28);}
        if(u.stunUntil>state.battle.time){ctx.fillStyle='#ffe08a';ctx.fillText('★',x+27,y-28);}
      }
      ctx.globalAlpha=1;
    }

    if(combat)for(const e of state.battle.events) {
      const from=units.find(u=>u.id===e.from),to=units.find(u=>u.id===e.to);if(!from)continue;
      if(to){
        const sx=(e.sx??from.x)*100+50,sy=(e.sy??from.y)*100+48,tx=(e.tx??to.x)*100+50,ty=(e.ty??to.y)*100+48;
        const p=Math.max(0,Math.min(1,1-e.ttl/.45)),col=e.kind==='shield'?'#a4dcff':e.kind==='heal'?'#83ff9e':G.U.TYPE_COLOR[e.type]||'#ffde75';
        ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=e.kind==='spell'?4:2;
        if(['heal','shield'].includes(e.kind)){ctx.beginPath();ctx.arc(tx,ty,15+p*22,0,Math.PI*2);ctx.stroke();}
        else {ctx.beginPath();ctx.arc(sx+(tx-sx)*p,sy+(ty-sy)*p,e.kind==='spell'?7:4,0,Math.PI*2);ctx.fill();}
        ctx.font='bold 17px sans-serif';ctx.fillText((['heal','shield'].includes(e.kind)?'+':'−')+e.amount,tx,ty-10-p*20);
        if(e.absorbed){ctx.font='11px sans-serif';ctx.fillStyle='#b7eaff';ctx.fillText('Escudo −'+e.absorbed,tx,ty+4);}
      } else if(e.kind==='cast'||e.kind==='entrance'&&state.battle.opening>0){
        ctx.font='bold 12px sans-serif';ctx.fillStyle='#ffdf78';ctx.fillText(e.move,from.x*100+50,from.y*100+43);
      } else if(e.kind==='beam'||e.kind==='drill'){
        ctx.strokeStyle=G.U.TYPE_COLOR[e.type]||'#ffe08a';ctx.lineWidth=e.kind==='beam'?14:8;
        ctx.globalAlpha=Math.min(.7,e.ttl);ctx.beginPath();ctx.moveTo(e.sx*100+50,e.sy*100+48);ctx.lineTo(e.tx*100+50,e.ty*100+48);ctx.stroke();ctx.globalAlpha=1;
      }
    }
    infoClock+=dt;if(state.phase==='combat'&&infoClock>=.15){infoClock=0;syncCells();renderInfo();}
    paintCards(dt);
    const beat=combat?state.battle.beat||0:0;
    if($('tft-beats').dataset.beat!==String(beat))$('tft-beats').dataset.beat=String(beat);
    const opening=state.phase==='combat'&&state.battle.opening>0;
    $('tft-entrances').classList.toggle('hidden',!opening);
    if(opening){const text='Habilidades de entrada · '+state.battle.units.map(u=>(u.side===0?'Aliado ':'Rival ')+G.DEX_BY[u.dex].name+': '+E.entranceFor(u).name).join(' · ');if($('tft-entrances').textContent!==text)$('tft-entrances').textContent=text;}
    if(state.phase==='combat')$('tft-clock').textContent=opening?'Habilidades de entrada…':`${Math.max(0,Math.ceil(45-state.battle.time))} s`;
    else $('tft-clock').textContent='';
  }
  function paintCards(dt) {
    document.querySelectorAll(editing?'#tft-deck-list canvas[data-tft-dex]':'#tft-match canvas[data-tft-dex]').forEach((c,i)=>{
      const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);x.imageSmoothingEnabled=false;
      drawSprite(x,'card:'+i,Number(c.dataset.tftDex),55,64,62,dt);
    });
  }
  function loop(now) {
    if(!active)return;
    // Keep the same simulation when the tab is hidden; no wall-clock catch-up.
    const dt=last?Math.min((now-last)/1000,.1):0;last=now;
    if(!G.UI.isOpen('scr-tft')){active=false;document.body.classList.remove('tft-active','tft-calm');return;}
    if(editing){paintCards(dt);frame=requestAnimationFrame(loop);return;}
    const before=state.phase;
    if(!paused&&!quitPending&&!document.hidden)E.tick(state,dt*speed);
    saveClock+=dt;if(state.phase!==before){persist();render();}else if(saveClock>=1){saveClock=0;persist();}
    paint(paused||quitPending?0:dt);frame=requestAnimationFrame(loop);
  }
  // Markup exists before these deferred scripts execute.
  const grid=$('tft-cells');
  for(let pos=0;pos<36;pos++) {
    const b=document.createElement('button');b.type='button';
    b.onclick=()=>{
      if(!state)return;
      if(state.phase!=='planning'){selected=currentUnits().find(u=>u.hp>0&&u.x===pos%6&&u.y===Math.floor(pos/6))?.id??null;render();return;}
      if(pos<18){selected=E.scout(state).find(u=>u.pos===pos)?.id??null;syncCells();renderInfo();return;}
      if(selected!==null&&selected>0){act(()=>E.place(state,selected,pos));selected=null;render();}
      else {selected=state.units.find(u=>u.pos===pos)?.id??null;render();}
    };grid.appendChild(b);
  }
  $('tft-report').querySelectorAll('[data-report]').forEach(b=>b.onclick=()=>{reportScope=b.dataset.report;renderReport();});
  $('tft-deck-filter').onchange=renderDeck;
  $('tft-deck-save').onclick=saveDeck;
  $('tft-deck-start').onclick=reset;
  $('btn-tft').onclick=open;
  $('tft-exit').onclick=close;$('tft-confirm-quit').onclick=close;
  $('tft-cancel-quit').onclick=()=>{quitPending=false;render();};
  $('tft-reroll').onclick=()=>act(()=>E.reroll(state));
  $('tft-xp').onclick=()=>act(()=>E.buyXP(state));
  $('tft-lock').onclick=()=>{state.locked=!state.locked;persist();render();};
  $('tft-sell').onclick=()=>act(()=>E.sell(state,selected));
  $('tft-return').onclick=()=>act(()=>E.place(state,selected,null));
  $('tft-fight').onclick=()=>{selected=null;act(()=>E.start(state));};
  $('tft-next').onclick=()=>act(()=>E.next(state));
  $('tft-restart').onclick=()=>{if(!['victory','defeat'].includes(state.phase)&&!window.confirm('¿Empezar de nuevo? Se reemplazará la partida TFT guardada.'))return;state=null;try{localStorage.removeItem(MATCH_KEY);}catch(_){}editDeck();};
  $('tft-pause').onclick=()=>{paused=!paused;render();};
  $('tft-speed').onclick=()=>{speed=speed===1?2:1;render();};
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&state){paused=state.phase==='combat';persist();if(active)render();}});
  window.addEventListener('pagehide',()=>{if(state)persist();});
  return {open,get active(){return active;},get state(){return state;}};
})();
