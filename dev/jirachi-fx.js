/* Code-native pixel art, rendered through the shared nearest-neighbour FX canvas. */
G.JirachiFX=(()=>{
  const colors={doom:{warning:'#f6cc5730',impact:'#ffe47780',edge:'#ffdd85',light:'#fff8d4'},swift:{warning:'#e6bb4c25',impact:'#ffdd6680',edge:'#fbe18f',light:'#fffce3'},flash:{warning:'#d0d5eb30',impact:'#e9edff80',edge:'#e3eaff',light:'#ffffff'},psychic:{warning:'#b681dc25',impact:'#c491ef80',edge:'#ddaeff',light:'#ffedff'}};
  const star=['....o....','...olo...','ooolllooo','.olllllo.','..lllll..','.olllllo.','.ollo.llo.','.oo...oo.'];
  function stamp(c,x,y,s=2){
    const ink={o:'#aa813c',l:'#ffe694'};
    for(let j=0;j<star.length;j++)for(let i=0;i<star[j].length;i++)if(ink[star[j][i]]){c.fillStyle=ink[star[j][i]];c.fillRect(Math.round(x)-4*s+i*s,Math.round(y)-4*s+j*s,s,s);}
    c.fillStyle='#fffbea';c.fillRect(Math.round(x)-s,Math.round(y)-s,s*2,s*2);
  }
  function drawRing(c,x,y,r,color,width){
    c.beginPath();for(let i=0;i<=64;i++){const a=i*Math.PI/32,px=Math.round(x+Math.cos(a)*r),py=Math.round(y+Math.sin(a)*r);if(i)c.lineTo(px,py);else c.moveTo(px,py);}c.strokeStyle=color;c.lineWidth=width;c.stroke();
  }
  function draw(c,e,b,{quality=2,calm=false}={}){
    c.save();c.imageSmoothingEnabled=false;c.setLineDash([]);
    for(const a of e.attacks){
      if(a.t>=a.warn+a.active)continue;
      const p=colors[a.kind];
      if(a.kind==='doom')for(const s of a.shapes){
        if(a.t<a.warn){
          stamp(c,s.x,s.y,3);const n=5,k=Math.min(n,Math.floor(a.t/a.warn*n)+1);c.fillStyle=p.light;
          for(let i=0;i<k;i++)c.fillRect(Math.round(s.x)-18+i*8,Math.round(s.y+s.r+8),5,5);
        }else{
          const t=(a.t-a.warn)/a.active,h=130+Math.sin(t*Math.PI)*25;
          c.fillStyle='#d3953d';c.fillRect(Math.round(s.x)-15,Math.round(s.y-h),30,h+4);
          c.fillStyle='#ffe58c';c.fillRect(Math.round(s.x)-9,Math.round(s.y-h),18,h+4);
          c.fillStyle=p.light;c.fillRect(Math.round(s.x)-3,Math.round(s.y-h),6,h+4);
          drawRing(c,s.x,s.y,s.r*(.35+t*.65),p.edge,6);
          if(quality>0&&!calm)for(let i=0;i<6;i++){const q=i*Math.PI/3;stamp(c,s.x+Math.cos(q)*s.r*t,s.y+Math.sin(q)*s.r*t,1);}
        }
      }
      if(a.t<a.warn)continue;
      if(a.kind==='swift')for(const s of e.hitShapes(a))stamp(c,s.x,s.y,2);
      if(a.kind==='flash'){
        const s=a.shapes[0],len=Math.hypot(s.bx-s.ax,s.by-s.ay);c.save();c.translate(s.ax,s.ay);c.rotate(Math.atan2(s.by-s.ay,s.bx-s.ax));
        c.fillStyle='#9098b9';c.fillRect(0,-15,len,30);c.fillStyle=p.edge;c.fillRect(0,-10,len,20);c.fillStyle='#fff6c9';c.fillRect(0,-5,len,10);c.fillStyle='#ffffff';c.fillRect(0,-2,len,4);c.restore();
      }
      if(a.kind==='psychic'){
        const s=e.hitShapes(a)[0],r=(s.inner+s.outer)/2;drawRing(c,s.x,s.y,r,'#81499a',20);drawRing(c,s.x,s.y,r,p.edge,12);drawRing(c,s.x,s.y,r,p.light,4);
      }
    }
    c.restore();
  }
  return {draw,palette:kind=>colors[kind]||colors.doom};
})();
