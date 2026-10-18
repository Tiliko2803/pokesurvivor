/* Volcanic arena scenery. Cached at pixel-art resolution; decoration has no collision or damage. */
G.BossRushArena = (() => {
  let cache, cacheKey;
  const PAD = 64;
  function make(bounds,theme) {
    const { left, right, top, bottom } = bounds, w = right - left, h = bottom - top;
    const canvas = document.createElement('canvas');
    canvas.width = (w + PAD * 2) / 2; canvas.height = (h + PAD * 2) / 2;
    const c = canvas.getContext('2d'); c.scale(0.5, 0.5); c.translate(PAD - left, PAD - top);
    let seed = 383;
    const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const between = (a, b) => a + rand() * (b - a);
    const polygon = (points, fill, stroke, width = 2) => {
      c.beginPath(); points.forEach(([x,y],i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.closePath();
      c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
    };
    if(theme==='flying') {
      // A continuous floating temple floor with cloud-shaped stone inlays, no outside frame.
      c.fillStyle='#304153';c.fillRect(left-PAD,top-PAD,w+PAD*2,h+PAD*2);
      const colors=['#354d5b','#3b5360','#2b3b50','#435b64'];
      for(let i=0;i<105;i++){
        const x=between(left,right),y=between(top,bottom),rx=between(20,70),ry=between(8,26);
        polygon([[x-rx,y],[x-rx*.5,y-ry],[x+rx*.4,y-ry],[x+rx,y],[x+rx*.5,y+ry],[x-rx*.4,y+ry]],colors[i%4]);
      }
      for(let i=0;i<45;i++){
        const x=between(left,right),y=between(top,bottom);
        c.strokeStyle='#a4cfcb40';c.lineWidth=2;c.beginPath();c.moveTo(x-20,y);c.lineTo(x-8,y-8);c.lineTo(x+10,y-8);c.lineTo(x+20,y);c.lineTo(x+8,y+8);c.stroke();
      }
      for(let i=0;i<600;i++){c.fillStyle=i%2?'#b1e5cd25':'#0d1c3025';c.fillRect(between(left,right),between(top,bottom),2,2);}
      return canvas;
    }
    if(theme==='water') {
      c.fillStyle='#173946';c.fillRect(left-PAD,top-PAD,w+PAD*2,h+PAD*2);
      const colors=['#1b4352','#204a58','#15323f','#24505a'];
      for(let i=0;i<110;i++){
        const x=between(left,right),y=between(top,bottom),rx=between(15,65),ry=between(8,25);
        polygon([[x-rx,y],[x-rx*.5,y-ry],[x+rx*.6,y-ry],[x+rx,y],[x+rx*.4,y+ry],[x-rx*.6,y+ry]],colors[i%4]);
      }
      for(let i=0;i<85;i++){
        const x=Math.round(between(left,right)/2)*2,y=Math.round(between(top,bottom)/2)*2;
        c.fillStyle='#48949a55';c.fillRect(x,y,between(8,25),2);c.fillRect(x+6,y-4,between(4,14),2);
      }
      for(let i=0;i<600;i++){c.fillStyle=i%2?'#78bbc525':'#071f3030';c.fillRect(between(left,right),between(top,bottom),2,2);}
      return canvas;
    }
    // Continuous floor includes a little overscan for camera shake; no frame or moat.
    c.fillStyle = '#393033'; c.fillRect(left-PAD,top-PAD,w+PAD*2,h+PAD*2);
    const rockColors = ['#342c30','#403437','#3d3234','#30292e','#443738'];
    for (let i=0;i<135;i++) {
      const x=between(left,right), y=between(top,bottom), rx=between(16,64), ry=between(8,25);
      polygon([[x-rx,y],[x-rx*.5,y-ry],[x+rx*.6,y-ry*.8],[x+rx,y+ry*.2],[x+rx*.3,y+ry],[x-rx*.8,y+ry*.7]],
        rockColors[Math.floor(rand()*rockColors.length)]);
    }
    // Hairline fractures and ash replace the old square grid.
    for (let i=0;i<32;i++) {
      let x=between(left+10,right-10), y=between(top+10,bottom-10);
      const angle=between(0,Math.PI*2); c.beginPath(); c.moveTo(x,y);
      for (let n=0;n<4;n++) { x+=Math.cos(angle+between(-.7,.7))*between(9,21); y+=Math.sin(angle+between(-.7,.7))*between(7,15); c.lineTo(x,y); }
      c.strokeStyle='#29252b'; c.lineWidth=3; c.stroke();
      c.strokeStyle='#51403d'; c.lineWidth=1; c.stroke();
    }
    for (let i=0;i<1100;i++) {
      c.fillStyle=i%3?'#211f252b':'#76605b27';
      c.fillRect(Math.round(between(left,right)/2)*2,Math.round(between(top,bottom)/2)*2,between(2,5),2);
    }
    // Worn, broken rings in the central bedrock, deliberately low contrast.
    for(let i=0;i<9;i++) {
      const angle=i*Math.PI*2/9;
      c.beginPath(); c.ellipse(0,0,100,65,0,angle,angle+.42);
      c.strokeStyle='#503c38'; c.lineWidth=6; c.stroke();
      c.beginPath(); c.ellipse(0,0,110,73,0,angle+.02,angle+.40);
      c.strokeStyle='#2b252b'; c.lineWidth=3; c.stroke();
    }
    return canvas;
  }
  function draw(ctx, bounds,theme='fire') {
    const key = [theme,bounds.left,bounds.right,bounds.top,bounds.bottom].join(',');
    if (!cache || key !== cacheKey) { cache = make(bounds,theme); cacheKey = key; }
    ctx.save(); ctx.imageSmoothingEnabled=false;
    ctx.drawImage(cache,bounds.left-PAD,bounds.top-PAD,bounds.right-bounds.left+PAD*2,bounds.bottom-bounds.top+PAD*2);
    ctx.restore();
  }
  return { draw };
})();
