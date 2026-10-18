/* Groudon's visual language. Deterministic canvas effects; never change collision, damage or RNG. */
G.GroudonFX = (() => {
  const COLORS = {
    blades: { warning:'#b77b3e38', impact:'#d9964e80', edge:'#ffd69a', light:'#ffdc96', dark:'#41272c' },
    stomp: { warning:'#c7a56c30', impact:'#caaa6f60', edge:'#ffe4aa', light:'#e7ce9e', dark:'#514036' },
    eruption: { warning:'#e352493b', impact:'#f47b4670', edge:'#ffa98b', light:'#ffe7a6', dark:'#802c33' },
    charge: { warning:'#c4d5ed30', impact:'#e2ecff55', edge:'#f1f6ff', light:'#ffffff', dark:'#71839e' },
    rupture: { warning:'#da784434', impact:'#dc8a4e65', edge:'#ffd19a', light:'#ffc77a', dark:'#572a2b' }
  };
  const palette = kind => COLORS[kind] || COLORS.blades;
  const clamp = n => Math.max(0,Math.min(1,n));
  const noise = n => { const x=Math.sin(n*12.9898+383)*43758.5453; return x-Math.floor(x); };
  function line(c,points,color,width=2) {
    c.beginPath(); points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
    c.strokeStyle=color; c.lineWidth=width; c.stroke();
  }
  function poly(c,points,color) {
    c.beginPath(); points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
    c.closePath(); c.fillStyle=color; c.fill();
  }
  function ring(c,x,y,r,color,width=2,flat=1) {
    c.beginPath(); c.ellipse(x,y,Math.max(.1,r),Math.max(.1,r*flat),0,0,Math.PI*2);
    c.strokeStyle=color; c.lineWidth=width; c.stroke();
  }
  function rock(c,x,y,size,rise=0) {
    c.fillStyle='#18172280'; c.fillRect(x-size*.7,y-2,size*1.5,4);
    poly(c,[[x-size,y-rise],[x-size*.4,y-rise-size],[x+size*.7,y-rise-size*.7],[x+size,y-rise+size*.3],[x-size*.5,y-rise+size*.4]],'#514047');
    poly(c,[[x-size*.4,y-rise-size],[x+size*.7,y-rise-size*.7],[x,y-rise],[x-size,y-rise]],'#a3856e');
  }
  function sparks(c,x,y,r,count,time,color,up=0) {
    c.fillStyle=color;
    for(let i=0;i<count;i++) {
      const t=(time*.8+noise(i+19))%1, a=noise(i+43)*Math.PI*2;
      c.globalAlpha*=1-t*.35;
      c.fillRect(Math.round(x+Math.cos(a)*r*t),Math.round(y+Math.sin(a)*r*t-up*t),i%3?2:4,i%3?3:5);
      c.globalAlpha/=1-t*.35;
    }
  }
  function blades(c,a,progress,active,fade,density) {
    for(const s of a.shapes) {
      const count=Math.min(Math.round(8+8*density),Math.ceil((s.by-s.ay)/64));
      for(let i=0;i<count;i++) {
        const y=s.ay+35+i*(s.by-s.ay-70)/Math.max(1,count-1), x=s.ax, h=(38+noise(i)*30)*active;
        line(c,[[x-4,y-25],[x+5,y-9],[x-4,y+9],[x+3,y+26]],'#ffbe73',1+progress*2);
        if(active>0) {
          c.globalAlpha=fade;
          poly(c,[[x-18,y+7],[x-11,y-h*.65],[x+1,y-h],[x+14,y-h*.45],[x+20,y+7]],'#34232b');
          poly(c,[[x-11,y-h*.65],[x+1,y-h],[x+6,y+4],[x-6,y+6]],'#b14a35');
          line(c,[[x+1,y-h],[x+5,y-h*.4],[x+6,y+4]],'#ffbf6d',3);
          ring(c,x,y+6,21,'#bfa08280',2,.35);
          if(i%2===0) sparks(c,x,y,24,Math.round(5*density),a.t,'#ffcd88',8);
        }
      }
    }
  }
  function stomp(c,a,progress,active,fade,density) {
    const s=a.shapes[0];
    if(!active) {
      ring(c,s.x,s.y,s.r*(.4+.6*progress),'#eac98670',2);
      for(let i=0;i<8;i++) { const angle=i*Math.PI/4; rock(c,s.x+Math.cos(angle)*s.r*.8,s.y+Math.sin(angle)*s.r*.8,3,progress*5); }
      return;
    }
    c.globalAlpha=fade;
    const t=clamp((a.t-a.warn)/.65);
    for(let i=0;i<3;i++) ring(c,s.x,s.y,s.r*clamp(t*1.5-i*.2),'#f8d79e',4-i);
    for(let i=0;i<Math.round(16*density);i++) {
      const angle=i*Math.PI*2/Math.round(16*density), r=s.r*(.3+t*.6);
      rock(c,s.x+Math.cos(angle)*r,s.y+Math.sin(angle)*r,4+noise(i)*4,Math.sin(t*Math.PI)*16);
    }
  }
  function eruption(c,a,progress,active,fade,density) {
    for(const s of a.shapes) {
      ring(c,s.x,s.y,s.r*.7,'#f27957',3,.65);
      line(c,[[s.x-20,s.y+5],[s.x-7,s.y-5],[s.x+2,s.y+4],[s.x+17,s.y-9]],'#ffd29a',2+progress*2);
      if(!active) { sparks(c,s.x,s.y,22,Math.round(6*density),a.t,'#f8b47b',12); continue; }
      c.globalAlpha=fade;
      const h=(72+Math.sin(a.t*7)*8)*active;
      poly(c,[[s.x-31,s.y+12],[s.x-23,s.y-h*.5],[s.x-13,s.y-h*.8],[s.x-6,s.y-h*.55],
        [s.x+3,s.y-h*1.3],[s.x+14,s.y-h*.8],[s.x+21,s.y-h*.6],[s.x+32,s.y+10]],'#b93530');
      poly(c,[[s.x-20,s.y+9],[s.x-12,s.y-h*.55],[s.x-3,s.y-h*.45],[s.x+4,s.y-h],[s.x+16,s.y-h*.4],[s.x+21,s.y+9]],'#f5843c');
      poly(c,[[s.x-11,s.y+5],[s.x-4,s.y-h*.35],[s.x+2,s.y-h*.7],[s.x+10,s.y+5]],'#ffe2a0');
      ring(c,s.x,s.y,36,'#ffc284',3,.5);
      sparks(c,s.x,s.y,65,Math.round(18*density),a.t,'#ffca7d',88);
    }
  }
  function charge(c,a,progress,active,fade,boss,calm) {
    const s=a.shapes[0], dx=s.bx-s.ax,dy=s.by-s.ay,length=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);
    c.save(); c.translate(s.ax,s.ay); c.rotate(angle);
    if(!active) {
      c.globalAlpha=.55+progress*.4;
      const shift=calm?0:(a.t*65)%65;
      for(let x=30+shift;x<length-15;x+=65) line(c,[[x-10,-9],[x,0],[x-10,9]],'#f4f5ff',3);
    } else {
      c.globalAlpha=fade;
      const distance=Math.hypot(boss.x-s.ax,boss.y-s.ay);
      for(let i=0;i<7;i++) {
        const y=(i-3)*8, back=Math.max(0,distance-80-noise(i)*75);
        line(c,[[back,y],[Math.max(back,distance-8),y]],i%2?'#f5f5ff':'#b4c4df',i%2?2:4);
      }
    }
    c.restore();
    if(active) { c.globalAlpha=fade*.75; ring(c,boss.x,boss.y-25,35,'#f4f4ff',3,1.4); }
  }
  function rupture(c,a,progress,active,fade,density) {
    for(const s of a.shapes) {
      c.save(); c.beginPath(); c.rect(s.left,s.top,s.right-s.left,s.bottom-s.top); c.clip();
      c.globalAlpha=active?fade:.35+progress*.5;
      const count=Math.min(60,Math.ceil((s.right-s.left)*(s.bottom-s.top)/8500));
      for(let n=0;n<count;n++) {
        const x=s.left+noise(n+99)*(s.right-s.left), y=s.top+noise(n+181)*(s.bottom-s.top);
        const angle=noise(n+217)*Math.PI*2, points=[[x,y]];
        for(let i=0;i<4;i++) {
          const turn=angle+(noise(n*7+i)-.5)*1.6, length=20+noise(n*11+i)*25;
          const last=points[points.length-1];points.push([last[0]+Math.cos(turn)*length,last[1]+Math.sin(turn)*length]);
        }
        line(c,points,'#51262b',active?10:5);
        line(c,points,active?'#ffc183':'#cc895f',active?4:2);
        const root=points[2];
        line(c,[root,[root[0]+Math.cos(angle+1.3)*30,root[1]+Math.sin(angle+1.3)*30]],active?'#e8a16e':'#a66953',active?3:1);
        if(active&&n%Math.max(1,Math.round(2/density))===0) rock(c,x+15,y+10,7+noise(n)*7,Math.sin(clamp((a.t-a.warn)/.8)*Math.PI)*22);
      }
      c.restore();
    }
  }
  function draw(c,e,boss,{quality=2,calm=false}={}) {
    const density=(quality===0?.4:quality===1?.7:1)*(calm?.65:1);
    c.save(); c.setLineDash([]);
    for(const h of e.hazards) {
      c.save(); c.globalAlpha=e.clock<h.start?.45:.9;
      for(let i=0;i<3;i++) {
        const angle=i*2.1+noise(i)*2, r=h.r*(.3+noise(i)*.4);
        ring(c,h.x+Math.cos(angle)*r,h.y+Math.sin(angle)*r,2+(calm?1:(e.clock*6+i)%4),'#ffda89',2,.6);
      }
      c.restore();
    }
    for (const a of e.attacks || (e.attack ? [e.attack] : [])) {
    const elapsed=a.t-a.warn;
    if(elapsed>a.active+.65) continue;
    c.save();
    const progress=clamp(a.t/a.warn), active=elapsed>=0?clamp(elapsed/.08):0;
    const fade=elapsed<a.active?1:clamp(1-(elapsed-a.active)/.65);
    if(a.kind==='blades') blades(c,a,progress,active,fade,density);
    else if(a.kind==='stomp') stomp(c,a,progress,active,fade,density);
    else if(a.kind==='eruption') eruption(c,a,progress,active,fade,density);
    else if(a.kind==='charge') charge(c,a,progress,active,fade,boss,calm);
    else if(a.kind==='rupture') rupture(c,a,progress,active,fade,density);
    c.restore();
    }
    c.restore();
    if(G.BossRushSprites)G.BossRushSprites.draw(c,e,boss,{quality,calm});
  }
  return { draw, palette };
})();
