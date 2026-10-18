/* Dedicated generated pixel-art effects. One continuous Dragon Pulse, no tiled beam tips. */
G.RayquazaFX = (() => {
  const image=new Image();image.src='assets/boss-rush/rayquaza-attacks-v1.png?v=1';
  const rows={ascent:0,charge:1,dragon:2,hurricane:3,meteor:4};
  const COLORS={
    ascent:{warning:'#33dba638',impact:'#60f4b955',edge:'#a4ffb5',light:'#e7ffb2'},
    charge:{warning:'#d6f4ff35',impact:'#dffaff55',edge:'#efffff',light:'#ffffff'},
    dragon:{warning:'#bd77f038',impact:'#b67bf466',edge:'#e0aaff',light:'#fadfff'},
    hurricane:{warning:'#85dcca35',impact:'#a2ece955',edge:'#caffee',light:'#effff9'},
    meteor:{warning:'#f295633b',impact:'#eba04b55',edge:'#ffd28e',light:'#ffe4bc'}
  };
  function sprite(c,kind,x,y,w,h,t,{angle=0,anchor=.5,alpha=1}={}){
    if(!image.complete||!image.naturalWidth)return false;
    const col=Math.min(3,Math.max(0,Math.floor(t*4)));
    c.save();c.imageSmoothingEnabled=false;c.globalAlpha*=alpha;c.translate(Math.round(x),Math.round(y));if(angle)c.rotate(angle);
    if(kind==='dragon')c.drawImage(image,col*64,2*64+20,64,24,-w/2,-h/2,w,h);
    else c.drawImage(image,col*64,rows[kind]*64,64,64,-w/2,-h*anchor,w,h);
    c.restore();return true;
  }
  function draw(c,e,boss,{quality=2,calm=false}={}){
    c.save();c.setLineDash([]);
    for(const a of e.attacks){
      const elapsed=a.t-a.warn;if(elapsed>a.active+.45)continue;
      const warning=elapsed<0,progress=Math.min(1,a.t/a.warn),p=COLORS[a.kind];
      if(warning){
        c.strokeStyle=p.edge;c.lineWidth=2;
        for(const s of a.shapes)if(s.kind==='circle'){
          c.beginPath();c.arc(s.x,s.y,Math.max(3,s.r*progress),0,Math.PI*2);c.stroke();
          c.fillStyle=p.light;
          for(let i=0;i<4;i++){const q=i*Math.PI/2;c.fillRect(Math.round(s.x+Math.cos(q)*s.r*.7)-2,Math.round(s.y+Math.sin(q)*s.r*.7)-2,4,4);}
        }
        if(a.kind==='charge'){
          const s=a.shapes[0],angle=Math.atan2(s.by-s.ay,s.bx-s.ax),length=Math.hypot(s.bx-s.ax,s.by-s.ay);
          c.save();c.translate(s.ax,s.ay);c.rotate(angle);c.strokeStyle=p.light;
          const count=quality===0?5:10;
          for(let i=1;i<=count;i++){const x=length*i/(count+1);c.beginPath();c.moveTo(x-8,-7);c.lineTo(x,0);c.lineTo(x-8,7);c.stroke();}c.restore();
        }
        if(a.kind==='meteor'&&a.warn-a.t<.4)for(const s of a.shapes)sprite(c,a.kind,s.x,s.y+18,s.r*2+32,130,Math.min(.49,(.4-(a.warn-a.t))/.4*.49),{anchor:.82});
        if(a.kind==='ascent'&&a.warn-a.t<.3)for(const s of a.shapes)sprite(c,a.kind,s.x,s.y+18,s.r*2+32,150,Math.min(.49,(.3-(a.warn-a.t))/.3*.49),{anchor:.82});
        continue;
      }
      const t=calm?.55:Math.min(.999,elapsed/Math.max(.35,a.active+.2));
      const alpha=elapsed>a.active?Math.max(0,1-(elapsed-a.active)/.45):1;
      if(a.kind==='dragon')for(const s of a.shapes)sprite(c,a.kind,(s.ax+s.bx)/2,(s.ay+s.by)/2,Math.hypot(s.bx-s.ax,s.by-s.ay),s.width,t,{angle:Math.atan2(s.by-s.ay,s.bx-s.ax),alpha});
      else if(a.kind==='charge'){
        const s=a.shapes[0];sprite(c,a.kind,boss.x,boss.y,140,80,t,{angle:Math.atan2(s.by-s.ay,s.bx-s.ax),alpha});
      }else for(const s of a.shapes){
        const w=a.kind==='hurricane'?s.r*2+20:s.r*2+32,h=a.kind==='hurricane'?145:a.kind==='ascent'?150:130;
        sprite(c,a.kind,s.x,s.y+18,w,h,a.kind==='meteor'||a.kind==='ascent'?.5+t*.49:t,{anchor:.82,alpha});
      }
    }
    c.restore();
  }
  return {draw,palette:kind=>COLORS[kind]||COLORS.dragon};
})();
