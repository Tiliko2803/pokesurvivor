/* Pixel-aligned water and frost particles; actual impact art is BossRushSprites. */
G.KyogreFX = (() => {
  const COLORS={
    surf:{warning:'#20bce538',impact:'#167eab55',edge:'#7ce9ff',light:'#ccfbff'},
    hydro:{warning:'#1f7ff53b',impact:'#248be888',edge:'#70cfff',light:'#d7f9ff'},
    ice:{warning:'#a4dfff35',impact:'#b7f2ff77',edge:'#dcfbff',light:'#ffffff'},
    rain:{warning:'#31668b20',impact:'#3888b220',edge:'#77b8d4',light:'#b8e3ff'},
    pulse:{warning:'#12b8bd40',impact:'#19c5cf88',edge:'#73fff1',light:'#e6fff7'}
  };
  function draw(c,e,boss,{quality=2,calm=false}={}){
    const r=G.Groudon.ARENA,n=quality===0?18:quality===1?32:52;
    c.save();c.setLineDash([]);
    if(e.raining){
      c.fillStyle='#286c9a12';c.fillRect(r.left,r.top,r.right-r.left,r.bottom-r.top);
      c.fillStyle='#a5e8f870';
      for(let i=0;i<n;i++){
        const k=calm?0:e.clock*(120+i%5*12);
        const x=Math.round(r.left+((i*137.7+k*.2)%(r.right-r.left))),y=Math.round(r.top+((i*211+k)%(r.bottom-r.top)));
        c.fillRect(x,y,2,calm?4:8);
      }
    }
    for(const a of e.attacks){
      if(a.t>=a.warn+a.active+.3)continue;
      const warning=a.t<a.warn,p=COLORS[a.kind];c.fillStyle=p.light;
      if(warning){
        const k=Math.max(0,Math.min(1,a.t/a.warn));
        for(const s of a.shapes){
          const x=s.kind==='line'?(s.ax+s.bx)/2:(s.left+s.right)/2,y=s.kind==='line'?(s.ay+s.by)/2:(s.top+s.bottom)/2;
          // Countdown of square pips stays legible under rain, without flashing the arena.
          for(let i=0;i<5;i++)if(i/5<=k)c.fillRect(Math.round(x-18+i*8),Math.round(y-17),5,5);
        }
      }
    }
    c.restore();
    G.BossRushSprites.draw(c,e,boss,{quality,calm});
  }
  return {draw,palette:kind=>COLORS[kind]||COLORS.surf};
})();
