/* Touch-first TFT screen. The survivor remains in its menu state. */
G.TFTUI = (() => {
  'use strict';
  const $=id=>document.getElementById(id),E=G.TFT;
  let state=null,selected=null,active=false,frame=0,last=0,paused=false,speed=1,quitPending=false;
  const anims=new Map();
  let seenEvents=new WeakSet();
  const TYPE=()=>G.U.TYPE_NAME;
  const aiNames={healer:'Apoyo · cura',guardian:'Guardián · protege aliados',ranged:'Distancia · retrocede',diver:'Asaltante · busca retaguardia',tank:'Tanque · primera línea',fighter:'Luchador · persigue'};
  const effects={attack:'daño +15/30%',hp:'vida +20/40%',armor:'defensa +20/40',speed:'ataques +15/30%',
    mana:'maná por golpe +5/10',regen:'cura 1,5/3% de vida por segundo',pierce:'ignora 15/30% de defensa',slow:'ralentiza ataques 15/30%'};
  function open() {
    if(G.Social.room){G.UI.toast('Sal de la sala de cooperativo para jugar TFT individual.');return;}
    if(G.Game.state!=='ui')return;
    active=true;quitPending=false;document.body.classList.add('tft-active');G.UI.chrome(false);G.UI.show('scr-tft');
    if(!state||['victory','defeat'].includes(state.phase))reset();
    paused=false;last=0;render();cancelAnimationFrame(frame);frame=requestAnimationFrame(loop);
  }
  function reset() {state=E.create();selected=null;paused=false;seenEvents=new WeakSet();anims.clear();render();}
  function close() {
    if(!quitPending&&!['victory','defeat'].includes(state.phase)) {
      quitPending=true;render();return;
    }
    active=false;quitPending=false;cancelAnimationFrame(frame);anims.clear();state=null;
    document.body.classList.remove('tft-active');G.UI.hide('scr-tft');G.Flow.goMenu();
  }
  function act(fn) {
    if(!fn()){G.UI.toast('Acción no disponible: revisa el oro, el banquillo o el límite de equipo.');return;}
    if(!state.units.some(u=>u.id===selected))selected=null;
    render();
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
    $('tft-help').textContent=u?`${G.DEX_BY[u.dex].name} ${'★'.repeat(u.star)} · ${E.moveFor(u)} · ${aiNames[E.aiFor(u.dex)]}. Toca una casilla azul para colocarlo o intercambiarlo.`:'Compra Pokémon, toca uno del banquillo y después una casilla azul. Tres copias del mismo nivel se fusionan y evolucionan.';
    $('tft-shop').innerHTML=s.shop.map((dex,i)=>dex?unitCard({dex,star:1},'shop',i):'<div class="tft-card tft-empty">Comprado</div>').join('');
    const bench=s.units.filter(u=>u.pos===null);
    $('tft-bench').innerHTML=bench.map(v=>unitCard(v,'bench')).join('')+
      Array.from({length:E.BENCH-bench.length},()=>'<div class="tft-bench-empty" aria-hidden="true">·</div>').join('');
    $('tft-bench-count').textContent=`Banquillo ${bench.length}/${E.BENCH}`;
    $('tft-shop').querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>act(()=>E.buy(s,Number(b.dataset.buy))));
    $('tft-bench').querySelectorAll('[data-unit]').forEach(b=>b.onclick=()=>{if(planning){selected=Number(b.dataset.unit);render();}});
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
    $('tft-restart').classList.toggle('hidden',!['victory','defeat'].includes(s.phase));
    $('tft-result').textContent=s.result?`${s.result.draw?'Tiempo agotado':s.result.won?'Victoria de ronda':'Derrota de ronda'} · +${s.result.income} oro (incluye ${s.result.interest} de interés y ${s.result.bonus} por racha). ${s.phase==='victory'?'Completaste las 12 rondas con vida.':''}`:'';
    $('tft-quit').classList.toggle('hidden',!quitPending);
    const tr=E.traits(deployed);
    $('tft-traits').innerHTML=Object.entries(tr).sort((a,b)=>b[1].count-a[1].count).map(([t,v])=>
      `<span class="tft-trait ${v.tier?'on':''}">${TYPE()[t]} ${v.count} · ${v.tier?'Nv. '+v.tier:'requiere 2'}<small>${effects[E.EFFECTS[t]]}</small></span>`).join('')||'<span class="sub">Despliega 2 o 4 familias distintas del mismo tipo para activar sus bonos.</span>';
    $('tft-cells').querySelectorAll('button').forEach((b,pos)=>{
      const unit=deployed.find(u=>u.pos===pos);
      b.disabled=!planning||pos<18;
      b.setAttribute('aria-label',`${pos<18?'Terreno rival':'Tu terreno'} fila ${Math.floor(pos/6)+1}, columna ${pos%6+1}${unit?', '+G.DEX_BY[unit.dex].name+' '+unit.star+' estrellas':''}`);
      b.classList.toggle('tft-selected-cell',unit?.id===selected);
    });
    paint(0);
  }
  function animator(key,dex) {
    let a=anims.get(key);
    if(!a||a.dex!==dex){a=new G.Sprites.Animator(dex);anims.set(key,a);}
    return a;
  }
  function drawSprite(ctx,key,dex,x,y,size,dt,side=0,flash=0) {
    const a=animator(key,dex),meta=G.Sprites.animMeta(dex,'Idle');
    a.scale=Math.min(size/Math.max(25,(meta?.h||32)*2),1);
    a.dir=side===0?4:0;a.update(dt);a.draw(ctx,x,y,{flash:flash>0});
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
    const units=combat?state.battle.units:state.units.filter(u=>u.pos!==null).map(u=>({...u,x:u.pos%6,y:Math.floor(u.pos/6),side:0}));
    if(combat)for(const e of state.battle.events) {
      if(seenEvents.has(e))continue;seenEvents.add(e);
      const u=units.find(u=>u.id===e.from);if(!u)continue;
      const a=animator(`board:${u.id}`,u.dex);
      if(e.kind==='cast')a.play('Shoot');
      else if(e.kind==='hit')a.play('Attack');
    }
    for(const u of units) {
      if(combat&&u.hp<=0)continue;
      const x=u.x*cell+50,y=u.y*cell+76;
      ctx.fillStyle=u.side===0?'#69e5b580':'#ff718b80';ctx.beginPath();ctx.ellipse(x,y-3,25,9,0,0,Math.PI*2);ctx.fill();
      drawSprite(ctx,`board:${u.id}`,u.dex,x,y,65,dt,u.side,u.flash);
      ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff';
      ctx.fillText(G.DEX_BY[u.dex].name,x,y+12);ctx.fillStyle='#ffda6b';ctx.fillText('★'.repeat(u.star),x,u.y*cell+15);
      if(combat){
        ctx.fillStyle='#111b2a';ctx.fillRect(x-34,u.y*cell+21,68,6);
        ctx.fillStyle=u.side===0?'#5df0a9':'#ff718b';ctx.fillRect(x-34,u.y*cell+21,68*u.hp/u.maxHp,6);
        ctx.fillStyle='#5dbfff';ctx.fillRect(x-34,u.y*cell+29,68*u.mana/100,3);
        if(u.shield>0){ctx.strokeStyle='#a4dcff';ctx.strokeRect(x-36,u.y*cell+19,72,10);}
      }
    }
    if(!combat){ctx.font='16px sans-serif';ctx.fillStyle='#c2abcb';ctx.textAlign='center';ctx.fillText('Terreno rival · aparece al combatir',300,55);}
    if(combat)for(const e of state.battle.events) {
      const from=units.find(u=>u.id===e.from),to=units.find(u=>u.id===e.to);if(!from)continue;
      if(to){
        ctx.strokeStyle=e.kind==='shield'?'#a4dcff':e.kind==='heal'?'#83ff9e':e.kind==='spell'?'#ffde75':'#ffffff85';ctx.lineWidth=e.kind==='spell'?5:2;
        ctx.beginPath();ctx.moveTo(from.x*100+50,from.y*100+48);ctx.lineTo(to.x*100+50,to.y*100+48);ctx.stroke();
        ctx.font='bold 18px sans-serif';ctx.fillStyle=e.kind==='shield'?'#a4dcff':e.kind==='heal'?'#83ff9e':'#fff';ctx.fillText((['heal','shield'].includes(e.kind)?'+':'−')+e.amount,to.x*100+50,to.y*100+45-(.5-e.ttl)*25);
      } else if(e.kind==='cast'){
        ctx.font='bold 13px sans-serif';ctx.fillStyle='#ffdf78';ctx.fillText(e.move,from.x*100+50,from.y*100+44);
      }
    }
    document.querySelectorAll('#scr-tft canvas[data-tft-dex]').forEach((c,i)=>{
      const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);x.imageSmoothingEnabled=false;
      drawSprite(x,'card:'+i,Number(c.dataset.tftDex),55,64,62,dt);
    });
    if(state.phase==='combat')$('tft-clock').textContent=`${Math.max(0,Math.ceil(45-state.battle.time))} s`;
    else $('tft-clock').textContent='';
  }
  function loop(now) {
    if(!active)return;
    // Keep the same simulation when the tab is hidden; no wall-clock catch-up.
    const dt=last?Math.min((now-last)/1000,.1):0;last=now;
    if(!G.UI.isOpen('scr-tft')){active=false;document.body.classList.remove('tft-active');return;}
    const before=state.phase;
    if(!paused&&!quitPending&&!document.hidden)E.tick(state,dt*speed);
    if(state.phase!==before)render();
    paint(paused||quitPending?0:dt);frame=requestAnimationFrame(loop);
  }
  // Markup exists before these deferred scripts execute.
  const grid=$('tft-cells');
  for(let pos=0;pos<36;pos++) {
    const b=document.createElement('button');b.type='button';
    b.onclick=()=>{
      if(state.phase!=='planning')return;
      if(selected!==null){act(()=>E.place(state,selected,pos));selected=null;render();}
      else {selected=state.units.find(u=>u.pos===pos)?.id??null;render();}
    };grid.appendChild(b);
  }
  $('btn-tft').onclick=open;
  $('tft-exit').onclick=close;$('tft-confirm-quit').onclick=close;
  $('tft-cancel-quit').onclick=()=>{quitPending=false;render();};
  $('tft-reroll').onclick=()=>act(()=>E.reroll(state));
  $('tft-xp').onclick=()=>act(()=>E.buyXP(state));
  $('tft-lock').onclick=()=>{state.locked=!state.locked;render();};
  $('tft-sell').onclick=()=>act(()=>E.sell(state,selected));
  $('tft-return').onclick=()=>act(()=>E.place(state,selected,null));
  $('tft-fight').onclick=()=>{selected=null;act(()=>E.start(state));};
  $('tft-next').onclick=()=>act(()=>E.next(state));
  $('tft-restart').onclick=reset;
  $('tft-pause').onclick=()=>{paused=!paused;render();};
  $('tft-speed').onclick=()=>{speed=speed===1?2:1;render();};
  return {open,get active(){return active;},get state(){return state;}};
})();
