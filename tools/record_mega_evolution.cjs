// Record the real game renderer at deterministic simulation times, offline.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),out=path.resolve(process.argv[2]||path.join(root,'../mega-evolution-preview'));
const port=8884;
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
 let browser;
 try{
  for(let i=0;i<50;i++){try{await fetch(`http://127.0.0.1:${port}/`);break;}catch{await new Promise(r=>setTimeout(r,100));}}
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,
   args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
  for(const viewport of [{width:800,height:450},{width:844,height:390}]){
   const page=await browser.newPage({viewport,locale:'es-MX',serviceWorkers:'block',isMobile:viewport.width===844,hasTouch:viewport.width===844});
   const errors=[],missing=[];page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.status()>=400&&r.url().includes('127.0.0.1'))missing.push(r.url());});
   await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
   await page.route('**/js/game.js*',r=>{
    const source=fs.readFileSync(path.join(root,'js/game.js'),'utf8')
     .replaceAll('requestAnimationFrame(loop);','if (!window.__captureMega) requestAnimationFrame(loop);')
     .replace("ctx = cv.getContext('2d');","ctx = cv.getContext('2d', {willReadFrequently:true});")
     .replace('init, startRun, everyone,','_previewRender: render, init, startRun, everyone,');
    return r.fulfill({contentType:'text/javascript',body:source});
   });
   await page.goto(`http://127.0.0.1:${port}/`);
   await page.waitForFunction(()=>window.G?.DB?.mode==='local'&&document.getElementById('boot').classList.contains('hidden'));
   await page.evaluate(async()=>{
    await G.DB.register('MegaFXQA','123456');
    for(const dex of [260,257,959]){G.DB.grant(dex,'test');const d=G.Mega.definition(dex);G.DB.save.megaStones[d.id]=1;G.Mega.equip(G.DB.save,dex,true);}
    G.DB.save.partner=959;G.DB.commit(true);G.Flow.goMenu();document.getElementById('tap-start').classList.add('hidden');
    await G.Sprites.preload([260,257,959]);G.Tinkaton.preload();G.MegaArt.preload();G.Blaziken.preload();
    G.Game.debugSpeed(0);window.__captureMega=true;
   });
   await page.waitForFunction(()=>G.Tinkaton.ready()&&G.MegaArt.atlasReady()&&G.Blaziken.ready());
   await page.mouse.click(5,5); // Unlock the actual synthesized sounds.
   const frames=path.join(out,'frames');if(viewport.width===800)fs.mkdirSync(frames,{recursive:true});
   await page.evaluate(()=>G.Game.startRun());
   const settle=()=>page.evaluate(()=>G.Game._previewRender());
   const capture=async filename=>{
    await settle();
    const data=await page.evaluate(()=>document.getElementById('game').toDataURL('image/png').split(',')[1]);
    fs.writeFileSync(filename,Buffer.from(data,'base64'));
   };
   const before=await page.evaluate(()=>({hp:G.Game.player.hp,maxHp:G.Game.player.maxHp,atk:G.Game.player.atk,mega:G.Game.player.mega}));
   if(viewport.width===800){
    for(let i=0;i<78;i++){
     if(i>0)await page.evaluate(()=>G.MegaEvolution.tick(1/25));
     await capture(path.join(frames,`${String(i).padStart(3,'0')}.png`));
    }
   }else{
    for(const t of [.32,.85,1.16,1.56,2.05]){
     await page.evaluate(t=>{const s=G.MegaEvolution.state();G.MegaEvolution.tick(t-(s?.time||0));},t);
     await capture(path.join(out,`mobile-${t}.png`));
    }
    await page.evaluate(()=>G.MegaEvolution.tick(5));await settle();
   }
   const after=await page.evaluate(()=>({hp:G.Game.player.hp,maxHp:G.Game.player.maxHp,atk:G.Game.player.atk,mega:G.Game.player.mega}));
   assert.deepEqual(after,before);assert.equal(await page.evaluate(()=>G.Game.st.time),0);
   assert.equal(await page.evaluate(()=>G.MegaEvolution.active),false);
   // Remaining forms, pause/resume, and calm mode use the same production path.
   for(const dex of [260,257]){
    await page.evaluate(dex=>{G.Game.toUI();G.DB.save.partner=dex;G.Game.startRun();G.MegaEvolution.tick(.85);},dex);
    await capture(path.join(out,`cocoon-${dex}-${viewport.width}.png`));
    await page.evaluate(()=>G.MegaEvolution.tick(.7));await settle();
    await capture(path.join(out,`mega-${dex}-${viewport.width}.png`));
    await page.evaluate(()=>G.Game.togglePause());const t=await page.evaluate(()=>G.MegaEvolution.state().time);
    await settle();assert.equal(await page.evaluate(()=>G.MegaEvolution.state().time),t);
    await page.evaluate(()=>{G.Game.togglePause();G.MegaEvolution.tick(1);});await settle();
   }
   await page.evaluate(()=>{G.Settings.set('calm',true);G.Game.toUI();G.Game.startRun();G.MegaEvolution.tick(1.33);});await settle();
   await capture(path.join(out,`calm-${viewport.width}.png`));
   assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
   console.log(JSON.stringify({viewport,before,after,errors,missing}));await page.close();
  }
 }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
