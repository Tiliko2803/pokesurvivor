'use strict';
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const {spawn}=require('node:child_process'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),port=8897;
(async()=>{
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
 let browser;
 try{
  for(let i=0;i<50;i++){try{await fetch(`http://127.0.0.1:${port}/`);break;}catch{await new Promise(r=>setTimeout(r,100));}}
  const runtime=process.env.CHROMIUM_PACKAGE?(await import(process.env.CHROMIUM_PACKAGE)).default:null;
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(runtime?await runtime.executablePath():undefined),
   args:runtime?runtime.args.filter(a=>!['--single-process','--in-process-gpu'].includes(a)):['--no-sandbox','--disable-dev-shm-usage']});
  for(const viewport of (process.env.MOBILE_ONLY?[{width:844,height:390}]:[{width:1100,height:720},{width:844,height:390}])){
   const context=await browser.newContext({viewport,locale:'es-MX',serviceWorkers:'block',isMobile:viewport.width<1000,hasTouch:viewport.width<1000});
   const page=await context.newPage(),errors=[],missing=[];page.setDefaultTimeout(15000);
   page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()===404)missing.push(r.url());});
   await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
   await page.goto(`http://127.0.0.1:${port}/`);
   await page.waitForFunction(()=>window.G?.SurvivorMegas&&window.G?.Flow&&document.getElementById('boot').classList.contains('hidden'));
   await page.evaluate(()=>{document.getElementById('tap-start').classList.add('hidden');G.DB.playAsGuest();});
   for(const dex of (process.env.MEGA_DEXES?process.env.MEGA_DEXES.split(',').map(Number):[530,154,214,282])){
    await page.evaluate(dex=>{
     const s=G.DB.save;s.partner=dex;s.owned[dex]={at:1};s.megaStones[G.Mega.definition(dex).id]=1;
     G.Mega.equip(s,dex,true);G.Flow.goMenu();
    },dex);
    await page.waitForFunction(dex=>G.SurvivorMegas.pack(dex).ready(),dex);
    assert.match(await page.locator('#menu-mega button').innerText(),/Mega equipada/);
    const pixels=await page.evaluate(dex=>{
     const cv=document.createElement('canvas');cv.width=220;cv.height=200;const ctx=cv.getContext('2d'),a=new G.SurvivorMegas.Animator(dex),hashes=[];
     for(let dir=0;dir<8;dir++){
      a.dir=dir;ctx.clearRect(0,0,220,200);a.draw(ctx,110,180);
      let h=0;for(const v of ctx.getImageData(0,0,220,200).data)h=(h*31+v)|0;hashes.push(h);
     }
     a.loop('Walk');a.play('Shoot');a.update(1);const returned=a.cur;
     a.play('Faint',{hold:true});a.update(1);
     return {directions:new Set(hashes).size,returned,held:a.done,failed:G.SurvivorMegas.pack(dex).failed()};
    },dex);
    assert.deepEqual(pixels,{directions:8,returned:'Walk',held:true,failed:false});
    await page.evaluate(()=>G.Game.startRun());
    assert.equal(await page.evaluate(()=>G.Game.player.moves[0].lvl),2);
    await page.waitForFunction(()=>!G.MegaEvolution.active&&G.Game.st.time>.2);
    const sim=await page.evaluate(()=>{
     const p=G.Game.player;p.invuln=100;
     const e=new G.Enemy({dex:19,hp:100000,spd:0,dmg:1,xp:1,behavior:'melee'},p.x+70,p.y,{hp:1,spd:1,dmg:1});e.hp=e.maxHp=100000;e.stunT=100;G.EnemyMgr.add(e);G.EnemyMgr.rebuildGrid();
     return {before:e.hp};
    });
    await page.waitForFunction(before=>G.EnemyMgr.all().some(e=>e.maxHp===100000&&e.hp<before),sim.before);
    await page.screenshot({path:`/tmp/survivor-mega-art-${dex}-${viewport.width}.png`});
    await page.evaluate(()=>G.Game.togglePause());
    const time=await page.evaluate(()=>G.Game.st.time);await page.waitForTimeout(120);
    assert.equal(await page.evaluate(()=>G.Game.st.time),time);
    await page.evaluate(()=>{G.Game.toUI();G.Mega.equip(G.DB.save,G.DB.save.partner,false);G.Game.startRun();});
    assert.equal(await page.evaluate(()=>G.Game.player.mega),null);await page.evaluate(()=>G.Game.toUI());
    console.log('PASS form',dex,viewport.width);
   }
   assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);console.log('PASS Survivor Megas browser',viewport.width);await context.close();
  }
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
