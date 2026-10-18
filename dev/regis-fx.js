/* Pixel effects use the existing generated rock/ice atlas plus code-native steel glints. */
G.RegisFX=(()=>{
  const colors={rock:{warning:'#b77b3e38',impact:'#d9964e80',edge:'#ffd69a',light:'#ffdc96'},ice:{warning:'#4bd4f330',impact:'#6ce1fa55',edge:'#99f0ff',light:'#e5fdff'},steel:{warning:'#b7c7e638',impact:'#d0dcf455',edge:'#e5f0ff',light:'#ffffff'}};
  const palette=kind=>colors[['rocks','slide'].includes(kind)?'rock':['ice','wind'].includes(kind)?'ice':'steel'];
  const stone=['...oo....','..ommoo..','.ommmhho.','ommmhhhho','ommhhhllo','ommmhhllo','.ommmhlo.','..ommmlo.','...oooo..'];
  const ink={o:'#302c31',m:'#74604c',h:'#a88d68',l:'#d5c29d'};
  function rock(c,x,y){for(let y0=0;y0<stone.length;y0++)for(let x0=0;x0<stone[y0].length;x0++){const col=ink[stone[y0][x0]];if(col){c.fillStyle=col;c.fillRect(Math.round(x)-18+x0*4,Math.round(y)-30+y0*4,4,4);}}}
  function draw(c,e,b,{quality=2}={}){
    c.save();c.imageSmoothingEnabled=false;
    for(const h of e.hazards){
      rock(c,h.x,h.y);
    }
    for(const a of e.attacks){
      if(a.t<a.warn||a.t>a.warn+a.active+.2)continue;
      const t=Math.min(.99,(a.t-a.warn)/Math.max(.3,a.active));
      if(['rocks','slide'].includes(a.kind))for(const s of a.shapes)rock(c,s.x,s.y);
      else if(a.kind==='ice')G.BossRushSprites?.draw(c,{attacks:[a]},a.owner,{quality});
      else if(a.kind==='claw'){
        c.fillStyle='#e4efff';for(let j=-1;j<=1;j++)for(let i=-6;i<=6;i++)c.fillRect(Math.round(a.owner.x+i*4),Math.round(a.owner.y+i*3+j*16),5,5);
      }
      else for(const s of e.hitShapes(a)){
        const x=s.kind==='circle'?s.x:(s.ax+s.bx)/2,y=s.kind==='circle'?s.y:(s.ay+s.by)/2;
        c.fillStyle=palette(a.kind).edge;c.fillRect(Math.round(x)-6,Math.round(y)-6,12,12);
        c.fillStyle=palette(a.kind).light;c.fillRect(Math.round(x)-2,Math.round(y)-9,4,18);
        c.fillRect(Math.round(x)-9,Math.round(y)-2,18,4);
      }
    }
    c.restore();
  }
  return {palette,draw};
})();
