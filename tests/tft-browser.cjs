'use strict';
// Requires Playwright and an installed browser; CHROMIUM_PATH can override it.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const {spawn}=require('node:child_process'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),port=8936;
(async()=>{
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
 let browser;
 try {
  for(let i=0;i<40;i++){try{await fetch(`http://127.0.0.1:${port}/dev.html`);break;}catch{await new Promise(r=>setTimeout(r,100));}}
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
  for(const viewport of [{width:1280,height:800},{width:390,height:844},{width:844,height:390}]) {
   const context=await browser.newContext({viewport,locale:'es-MX',isMobile:viewport.width<1000,hasTouch:viewport.width<1000,serviceWorkers:'block'});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
   await page.goto(`http://127.0.0.1:${port}/dev.html?dev`);
   await page.waitForFunction(()=>window.G?.TFTUI&&document.getElementById('boot').classList.contains('hidden'));
   await page.evaluate(async()=>{
    document.getElementById('tap-start').classList.add('hidden');await G.DB.playAsGuest();
    G.DB.save.partner=4;G.DB.save.owned[4]={at:Date.now(),from:'test'};G.Flow.goMenu();
    localStorage.setItem('tft-account-sentinel','{"coins":54321}');
   });
   const before=await page.evaluate(()=>JSON.stringify(G.DB.save));
   await page.evaluate(()=>document.querySelector('#scr-menu [data-go="play"]').click());
   await page.locator('#btn-tft').click();await page.locator('#scr-tft').waitFor({state:'visible'});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   assert.equal(await page.evaluate(()=>document.getElementById('scr-tft').scrollWidth<=document.getElementById('scr-tft').clientWidth),true);
   await page.evaluate(()=>{G.TFTUI.state.shop=[4,4,4,7,172];});
   for(let i=0;i<3;i++)await page.locator(`#tft-shop [data-buy="${i}"]`).click();
   assert.equal(await page.evaluate(()=>G.TFTUI.state.units[0].dex),5);
   await page.locator('#tft-bench [data-unit]').click();await page.locator('#tft-cells button').nth(20).click();
   assert.equal(await page.evaluate(()=>G.TFTUI.state.units[0].pos),20);
   await page.locator('#tft-fight').click();
   await page.locator('#tft-pause').click();
   const t=await page.evaluate(()=>G.TFTUI.state.battle.time);await page.waitForTimeout(150);
   assert.equal(await page.evaluate(()=>G.TFTUI.state.battle.time),t);
   await page.locator('#tft-pause').click();
   await page.waitForFunction(()=>G.TFTUI.state.battle.time>0);
   await page.locator('#tft-exit').click();await page.locator('#tft-cancel-quit').click();
   await page.evaluate(()=>{for(const u of G.TFTUI.state.battle.units)if(u.side===1)u.hp=0;});
   await page.waitForFunction(()=>G.TFTUI.state.phase==='result');
   await page.locator('#tft-next').click();
   assert.equal(await page.evaluate(()=>G.TFTUI.state.round),2);
   assert.equal(await page.evaluate(()=>JSON.stringify(G.DB.save)),before);
   assert.equal(await page.evaluate(()=>localStorage.getItem('tft-account-sentinel')),'{"coins":54321}');
   await page.locator('#scr-tft').screenshot({path:`/tmp/tft-${viewport.width}x${viewport.height}.png`});
   await page.locator('#tft-exit').click();await page.locator('#tft-confirm-quit').click();
   assert.equal(await page.evaluate(()=>G.TFTUI.active),false);
   assert.equal(await page.locator('#scr-menu').isVisible(),true);
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log('TFT desktop, portrait and landscape browser checks passed');
 } finally {if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
