/* Generated attack art, compiled to a 4x8 atlas of 64px cells.
 * Gameplay shapes stay independent of the art. No smoothing, network retries or per-frame allocation. */
G.BossRushSprites = (() => {
  const image=new Image();image.src='assets/boss-rush/attack-atlas-v1.png?v=1';
  const rows={blades:0,stomp:1,eruption:2,charge:3,surf:4,hydro:5,ice:6,pulse:7};
  function frame(c,kind,x,y,w,h,t,{angle=0,flipX=false,anchor=.5,alpha=1}={}) {
    if(!image.complete||!image.naturalWidth||rows[kind]===undefined)return false;
    const col=Math.min(3,Math.max(0,Math.floor(t*4)));
    c.save();c.imageSmoothingEnabled=false;c.globalAlpha*=alpha;
    c.translate(Math.round(x),Math.round(y));if(angle)c.rotate(angle);if(flipX)c.scale(-1,1);
    c.drawImage(image,col*64,rows[kind]*64,64,64,Math.round(-w/2),Math.round(-h*anchor),w,h);c.restore();return true;
  }
  function draw(c,e,boss,{quality=2,calm=false}={}) {
    const limit=quality===0?5:quality===1?8:12;
    for(const a of e.attacks){
      const elapsed=a.t-a.warn;if(elapsed<0||elapsed>a.active+.45)continue;
      const t=Math.min(.999,elapsed/Math.max(.3,a.active+.3)),alpha=elapsed>a.active?Math.max(0,1-(elapsed-a.active)/.45):1;
      if(a.kind==='blades')for(const s of a.shapes) {
        const n=Math.min(limit,Math.ceil((s.by-s.ay)/90));
        for(let i=0;i<n;i++)frame(c,a.kind,s.ax,s.ay+40+i*(s.by-s.ay-80)/Math.max(1,n-1),64,90,t,{anchor:.84,alpha});
      }
      else if(a.kind==='stomp') {const s=a.shapes[0];frame(c,a.kind,s.x,s.y,Math.min(240,s.r*2),140,t,{alpha});}
      else if(a.kind==='eruption') for(const s of a.shapes)frame(c,a.kind,s.x,s.y+16,92,145,t,{anchor:.85,alpha});
      else if(a.kind==='charge') {const s=a.shapes[0];frame(c,a.kind,boss.x,boss.y,130,82,t,{angle:Math.atan2(s.by-s.ay,s.bx-s.ax),alpha});}
      else if(a.kind==='surf') for(const s of e.hitShapes(a)) {
        frame(c,a.kind,(s.left+s.right)/2,(s.top+s.bottom)/2,110,s.bottom-s.top+24,calm?.5:t,{flipX:a.direction<0,alpha});
      }
      else if(a.kind==='hydro'||a.kind==='ice') for(const s of a.shapes) {
        const angle=Math.atan2(s.by-s.ay,s.bx-s.ax),length=Math.hypot(s.bx-s.ax,s.by-s.ay);
        const n=Math.min(limit,Math.max(1,Math.ceil(length/90)));
        for(let i=0;i<n;i++) {const k=(i+.5)/n;frame(c,a.kind,s.ax+(s.bx-s.ax)*k,s.ay+(s.by-s.ay)*k,length/n+18,s.width+22,t,{angle,alpha});}
      }
      else if(a.kind==='pulse'||a.kind==='rupture') for(const s of a.shapes){
        c.save();c.beginPath();c.rect(s.left,s.top,s.right-s.left,s.bottom-s.top);c.clip();
        const nx=Math.min(limit,Math.ceil((s.right-s.left)/100)),ny=Math.min(5,Math.ceil((s.bottom-s.top)/100));
        for(let ix=0;ix<nx;ix++)for(let iy=0;iy<ny;iy++)frame(c,a.kind==='rupture'?'blades':a.kind,s.left+(ix+.5)*(s.right-s.left)/nx,s.top+(iy+.7)*(s.bottom-s.top)/ny,90,115,t,{anchor:.8,alpha});
        c.restore();
      }
    }
  }
  return {draw,frame};
})();
