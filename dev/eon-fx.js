/* Shared pixel animation for both Eon Pokémon; collision remains in eon.js. */
G.EonFX=(()=>{
  const colors={zen:{warning:'#c18bff30',impact:'#d1a4ff80',edge:'#e1bdff',light:'#fff4ff'},dragonPulse:{warning:'#8077fa30',impact:'#a08aff80',edge:'#c5b7ff',light:'#f4eaff'},psychic:{warning:'#eb80ca30',impact:'#ed90da80',edge:'#ffb6ef',light:'#fff0ff'}};
  const palette=kind=>colors[kind]||colors.psychic;
  function pixel(c,x,y,size,color){c.fillStyle=color;c.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,size,size);}
  function ring(c,x,y,r,color,t=0){for(let i=0;i<32;i++){const a=i*Math.PI/16+t;pixel(c,x+Math.cos(a)*r-2,y+Math.sin(a)*r-2,4,color);}}
  function draw(c,e){
    c.save();c.imageSmoothingEnabled=false;
    for(const a of e.attacks){
      if(a.t<a.warn||a.t>=a.warn+a.active)continue;
      const col=palette(a.kind),t=(a.t-a.warn)/a.active;
      if(a.kind==='psychic')for(const s of a.shapes){
        for(let j=0;j<3;j++)ring(c,s.x,s.y,s.r*(.35+j*.22)+Math.sin(t*Math.PI*4)*3,j===1?col.light:col.edge,t*.8);
        for(let j=0;j<8;j++){const angle=j*Math.PI/4+t*2;pixel(c,s.x+Math.cos(angle)*24,s.y+Math.sin(angle)*24,6,col.light);}
      }else{
        const s=a.shapes[0],p=e.hitShapes(a)[0],angle=Math.atan2(s.by-s.ay,s.bx-s.ax);
        c.save();c.translate(p.x,p.y);c.rotate(angle);
        // One joined, tapered plume: a single pulse or a charge wake.
        for(let j=10;j>=0;j--){const size=Math.max(4,Math.round((a.kind==='zen'?24:32)*(1-j/14)/2)*2);pixel(c,-j*4-size/2,-size/2,size,j<3?col.edge:'#7761c4');}
        pixel(c,-8,-8,16,col.light);pixel(c,4,-4,8,'#ffffff');c.restore();
        if(a.kind==='zen')ring(c,p.x,p.y,a.owner.r+1,col.edge,t*3);
      }
    }
    c.restore();
  }
  return {palette,draw};
})();
