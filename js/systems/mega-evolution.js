/* Reusable, simulation-clock transformation cinematic inspired by XY/ORAS.
 * Drawn effects, not a video: the GIF preview records this exact renderer.
 * Forms/stats are owned by Mega; this module never multiplies or restores them.
 */
G.MegaEvolution = (() => {
  const TAU = Math.PI * 2, DURATION = 2.4;
  const COLORS = ['#ff73b7','#ffb85f','#f6ef9a','#83f5bd','#79dfff','#ad9cff'];
  const clamp = x => Math.max(0, Math.min(1, x));
  const ease = x => { x = clamp(x); return x*x*(3-2*x); };
  let current = null, played = new WeakSet();
  const sound = name => G.Audio?.sfx(name);
  const calm = () => !!G.Settings?.get('calm');
  function assetsReady(subject) {
    const pack = subject.dex===959 ? G.Tinkaton : subject.dex===257 ? G.Blaziken : null;
    if (pack?.ready) return pack.ready() || pack.failed();
    if (subject.dex===260 && G.MegaArt.atlasReady) return G.MegaArt.atlasReady() || G.MegaArt.atlasFailed();
    return true;
  }

  function begin(subject, options = {}) {
    if (current || !subject || subject.dead || played.has(subject)) return false;
    if (!subject.mega && !options.after) return false;
    // A local cutscene must never freeze only one peer's simulation.
    // Group battles retain their existing start until a shared intro is added.
    if (G.Coop?.active && !options.preview) return false;
    const before = options.before || new G.Sprites.Animator(subject.dex, 1, !!subject.megaPriorShiny || subject.shiny);
    before.dir = 0; before.loop('Idle');
    const after = options.after || subject.anim;
    played.add(subject);
    current = { subject, before, after, label:options.label || subject.mon?.name || 'Megaevolución',
      kind:options.kind || 'mega', color:options.color || '#b99aff',
      duration:Number.isFinite(options.duration)&&options.duration>0?options.duration:DURATION,
      t:0, waiting:0, charged:false, revealed:false, onReveal:options.onReveal, onComplete:options.onComplete };
    G.Touch?.reset();
    sound('mega-awaken');
    return true;
  }
  function tick(dt) {
    const c = current;
    if (!c || !Number.isFinite(dt) || dt <= 0) return;
    c.t = Math.min(c.duration, c.t + dt);
    // On a cold mobile cache, finish loading under the opaque shell rather
    // than revealing the regular fallback sprite with a Mega caption.
    if ((c.waiting>0 || c.t/c.duration*DURATION>=1.3) && !c.revealed && !assetsReady(c.subject) && c.waiting<4) {
      c.waiting+=dt; c.t=c.duration*1.28/DURATION;
    }
    const t = c.t / c.duration * DURATION;
    c.before.update(dt); c.after.update(dt);
    if (t >= .48 && !c.charged) { c.charged = true; sound('mega-charge'); }
    if (t >= 1.3 && !c.revealed) {
      c.revealed = true;
      // Mark before calling out: completion/re-entrance cannot reveal twice.
      if (c.onReveal) c.onReveal(c.subject);
      sound('mega-break');
    }
    if (current === c && c.t >= c.duration) {
      current = null;
      G.Touch?.reset();
      if (c.onComplete) c.onComplete(c.subject);
    }
  }
  function cancel() { current = null; }
  function reset() { cancel(); played = new WeakSet(); }
  function state() {
    if (!current) return null;
    const t = current.t/current.duration*DURATION;
    return { time:current.t, duration:current.duration, phase:t < .48 ? 'awaken' : t < 1.3 ? 'cocoon' : 'reveal',
      revealed:current.revealed, subject:current.subject, label:current.label };
  }
  function view(w, h, cam) {
    if (!current) return null;
    const t = current.t/current.duration*DURATION;
    const focus = ease(t/.42) * (1-ease((t-2.02)/.38));
    const sx = (current.subject.x-cam.left())*cam.scale, sy = (current.subject.y-cam.top())*cam.scale;
    const zoom = 1 + (calm() ? .28 : .66)*focus;
    const jolt = calm() ? 0 : Math.sin(t*68)*3*clamp(1-(t-1.3)/.25)*(t>=1.3?1:0);
    return { sx, sy, x:sx+(w*.5-sx)*focus+jolt, y:sy+(h*.70-sy)*focus, zoom, focus, t };
  }
  function camera(ctx, w, h, cam) {
    const v = view(w,h,cam); if (!v) return;
    ctx.translate(v.x,v.y); ctx.scale(v.zoom,v.zoom); ctx.translate(-v.sx,-v.sy);
  }
  function polygon(ctx, points, fill, stroke) {
    ctx.beginPath(); points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath();
    if (fill) { ctx.fillStyle=fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle=stroke; ctx.stroke(); }
  }
  function star(ctx,x,y,r,col,alpha=1) {
    ctx.save(); ctx.globalAlpha*=alpha; ctx.fillStyle=col;
    ctx.fillRect(x-r,y-1,r*2,2); ctx.fillRect(x-1,y-r,2,r*2); ctx.restore();
  }
  function symbol(ctx,x,y,r,alpha,kind) {
    ctx.save(); ctx.translate(x,y); ctx.globalAlpha*=alpha;
    const halo=ctx.createRadialGradient(0,0,0,0,0,r*1.6);
    halo.addColorStop(0,kind==='mega'?'#6540ff55':'#f5e7ff90');halo.addColorStop(1,'#6540ff00');
    ctx.fillStyle=halo;ctx.fillRect(-r*1.6,-r*1.6,r*3.2,r*3.2);
    ctx.lineCap='round';
    // Broad S-shaped Mega sigil: tapered ends, two diagonal openings and
    // triangular end cutouts, matching the user's XY reference silhouette.
    if (kind === 'mega') {
      ctx.scale(r,r);
      ctx.beginPath();
      ctx.moveTo(.25,-1);
      ctx.bezierCurveTo(-.12,-.98,-.63,-.65,-.70,-.25);
      ctx.bezierCurveTo(-.80,.18,-.42,.36,-.19,.61);
      ctx.bezierCurveTo(-.04,.77,-.02,.93,-.01,1);
      ctx.bezierCurveTo(.35,.93,.73,.67,.76,.35);
      ctx.bezierCurveTo(.80,.04,.56,-.17,.32,-.37);
      ctx.bezierCurveTo(.10,-.56,.14,-.80,.25,-1);
      ctx.closePath();
      // Openings are actual transparency, keeping the cocoon visible behind.
      ctx.moveTo(-.27,-.62);ctx.lineTo(-.04,-.72);ctx.lineTo(.01,-.47);ctx.closePath();
      ctx.moveTo(-.49,-.45);
      ctx.bezierCurveTo(-.10,-.32,.24,-.17,.49,.12);
      ctx.bezierCurveTo(.14,.01,-.24,-.15,-.55,-.30);
      ctx.closePath();
      ctx.moveTo(-.49,-.08);
      ctx.bezierCurveTo(-.18,.08,.18,.26,.56,.32);
      ctx.lineTo(.51,.49);
      ctx.bezierCurveTo(.13,.44,-.23,.24,-.43,.09);
      ctx.closePath();
      ctx.moveTo(.08,.58);ctx.lineTo(.36,.70);ctx.lineTo(.13,.81);ctx.closePath();
      const rainbow=ctx.createLinearGradient(-.62,-.72,.65,.60);
      rainbow.addColorStop(0,'#6a24ff');rainbow.addColorStop(.21,'#ed12f5');
      rainbow.addColorStop(.40,'#ff3973');rainbow.addColorStop(.56,'#fff754');
      rainbow.addColorStop(.73,'#80ff5c');rainbow.addColorStop(1,'#20ffd0');
      ctx.fillStyle=rainbow;ctx.shadowColor='#6545ff';ctx.shadowBlur=r*.24;
      ctx.fill('evenodd');
    } else {
      const red=kind==='primal-red';ctx.fillStyle=red?'#fa705f':'#69ccff';
      ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();ctx.strokeStyle='#fff2bd';ctx.lineWidth=2;ctx.stroke();
      ctx.font=`bold ${r*1.5}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff4d1';ctx.fillText(red?'Ω':'α',0,1);
    }
    ctx.restore();
  }
  function draw(ctx,w,h,cam) {
    const c=current,v=view(w,h,cam);if(!c||!v)return;
    const {t,focus}=v, exit=1-ease((t-2.02)/.38), charge=ease(t/.48);
    const scale=Math.min(cam.scale*v.zoom, h/300), r=Math.min(h*.235,w*.19);
    const x=v.x,feet=v.y,cy=feet-r*.93;
    const intro=ease(t/.20)*exit, burst=clamp((t-1.3)/.65);
    ctx.save();
    ctx.fillStyle=`rgba(8,9,28,${focus*.77})`;ctx.fillRect(0,0,w,h);
    const glow=ctx.createRadialGradient(x,cy,0,x,cy,r*2.5);
    glow.addColorStop(0,'#9874e844');glow.addColorStop(1,'#41275900');
    ctx.globalAlpha=intro;ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);ctx.globalAlpha=1;
    // Soft cinematic bars leave room for the hero and the final name banner.
    ctx.fillStyle=`rgba(3,5,18,${intro*.72})`;ctx.fillRect(0,0,w,h*.075);ctx.fillRect(0,h*.925,w,h*.075);
    ctx.save();ctx.translate(x,feet);ctx.scale(scale,scale);
    const actor=t<1.3?c.before:c.after;
    actor.dir=0;actor.draw(ctx,0,0,{alpha:t<1.3?1-ease((t-.45)/.20):1,
      flash:t>.38&&t<.60,softFlash:true,color:'#eee3ff'});ctx.restore();

    if(t<1.3) {
      // Rising particles spiral inward and three coloured bands close the shell.
      const count=(G.Settings?.fx===0?12:30),open=1-ease((t-.48)/.35);
      ctx.save();ctx.globalAlpha=intro*(t<.85?1:1-ease((t-.85)/.4));
      for(let i=0;i<count;i++) {
        const p=(i/count+t*.72)%1,a=i*2.399+t*2.6,rr=r*(1.65-p*.95);
        star(ctx,x+Math.cos(a)*rr,cy+Math.sin(a)*rr*.75,r*.035,COLORS[i%6],.35+p*.65);
      }
      ctx.restore();
      for(let band=0;band<3;band++) {
        ctx.save();ctx.translate(x,cy);ctx.rotate(band*1.05+t*.8);
        ctx.globalAlpha=intro*(.70+open*.2);ctx.strokeStyle=COLORS[band*2];ctx.lineWidth=2+charge*3;
        ctx.beginPath();ctx.ellipse(0,0,r*(1.32-open*.3),r*.38,0,t*4+band,t*4+band+Math.PI*1.45);ctx.stroke();ctx.restore();
      }
      const shell=ease((t-.45)/.25);
      if(shell>0) {
        ctx.save();ctx.translate(x,cy);ctx.scale(1,.99);ctx.globalAlpha=shell;
        const g=ctx.createRadialGradient(-r*.28,-r*.34,3,0,0,r*1.25);
        g.addColorStop(0,'#fffdf8');g.addColorStop(.48,'#f0e5ff');g.addColorStop(.8,'#b7a2e7');g.addColorStop(1,'#6a619f');
        const outline=[];for(let i=0;i<12;i++){const a=-Math.PI/2+i*TAU/12;outline.push([Math.cos(a)*r*.77,Math.sin(a)*r]);}
        ctx.lineWidth=2;polygon(ctx,outline,g,'#fff4ff');
        // Triangular facets move in brightness, while the geometry stays solid.
        for(let i=0;i<12;i++) {
          const a=outline[i],b=outline[(i+1)%12];
          polygon(ctx,[[r*.12,-r*.08],a,b],['#ffffff38','#bc9be84a','#85e6ea36','#ffb9e53c'][i%4],'#ffffff2b');
        }
        if(t>1.02) {
          ctx.lineWidth=2.5;ctx.strokeStyle='#fff';ctx.beginPath();
          ctx.moveTo(-r*.12,-r*.95);ctx.lineTo(r*.13,-r*.58);ctx.lineTo(-r*.12,-r*.29);
          ctx.lineTo(r*.16,r*.10);ctx.lineTo(-r*.1,r*.40);ctx.lineTo(r*.15,r*.93);ctx.stroke();
          ctx.beginPath();ctx.moveTo(-r*.12,-r*.29);ctx.lineTo(-r*.50,-r*.14);ctx.lineTo(-r*.75,r*.10);ctx.stroke();
        }
        ctx.restore();
        symbol(ctx,x,cy,r*.29,shell*.95,c.kind);
      }
    } else {
      const p=burst,fade=1-ease(p);
      // One expanding pulse, coloured crystal shards, then a clear hero reveal.
      ctx.save();ctx.globalAlpha=fade*.85;ctx.strokeStyle=c.color;ctx.lineWidth=7*(1-p)+1;
      ctx.beginPath();ctx.ellipse(x,cy,r*(.5+p*2.6),r*(.45+p*1.9),0,0,TAU);ctx.stroke();
      const n=G.Settings?.fx===0?10:22;
      for(let i=0;i<n;i++){
        const a=i*TAU/n,dist=r*(.42+p*(1.8+(i%3)*.25));
        ctx.save();ctx.translate(x+Math.cos(a)*dist,cy+Math.sin(a)*dist*.8+p*p*r*.45);ctx.rotate(a+p*3);
        const size=r*(.11+(i%3)*.028);polygon(ctx,[[-size,-size*.4],[size*.5,-size],[size,size*.6],[-size*.4,size*.5]],COLORS[i%6],'#fff');ctx.restore();
      }
      ctx.restore();
      const hero=ease((t-1.34)/.16)*exit;
      symbol(ctx,x,Math.max(h*.20,cy-r*1.32),r*.27,hero,c.kind);
      for(let i=0;i<8;i++) {
        const a=i*2.4+t*.5;star(ctx,x+Math.cos(a)*r*1.3,cy+Math.sin(a)*r*.9,3,COLORS[i%6],hero*(.55+.4*Math.sin(t*7+i)));
      }
      const flash=Math.max(0,1-(t-1.3)/.18)*(calm()?.055:.18);
      ctx.fillStyle=`rgba(245,229,255,${flash})`;ctx.fillRect(0,0,w,h);
    }
    // A single caption replaces the HUD during transformation.
    const reveal=t>=1.3,caption=reveal?ease((t-1.3)/.18):ease(t/.25);
    ctx.save();ctx.globalAlpha=caption*exit;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font=`700 ${Math.round(Math.min(24,h*.055))}px Pixelify, monospace`;
    ctx.shadowColor='#08061c';ctx.shadowBlur=8;ctx.fillStyle='#f8edff';
    ctx.fillText(G.I18n?G.I18n.t(reveal?c.label:'¡Megaevolución!'):(reveal?c.label:'¡Megaevolución!'),w/2,h*.835);
    ctx.restore();ctx.restore();
  }
  return { DURATION,begin,tick,cancel,reset,state,camera,draw,
    get active(){return !!current;},owns:subject=>current?.subject===subject };
})();
