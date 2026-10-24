'use strict';
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const {spawn}=require('node:child_process'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),port=8937;
(async()=>{const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});let browser;
 try{
  for(let i=0;i<40;i++){try{await fetch(`http://127.0.0.1:${port}/index.html`);break;}catch{await new Promise(r=>setTimeout(r,100));}}
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
  for(const viewport of [{width:1280,height:800},{width:390,height:844}]){
   const boot=viewport.width<viewport.height?{width:844,height:390}:viewport,context=await browser.newContext({viewport:boot,locale:'es-MX',serviceWorkers:'block'}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
   await page.goto(`http://127.0.0.1:${port}/index.html?dev`);await page.waitForFunction(()=>window.G?.TFTUI&&document.getElementById('boot').classList.contains('hidden'));
   if(await page.locator('#tap-start').isVisible())await page.locator('#tap-start').click();
   await page.evaluate(async()=>{await G.DB.playAsGuest();G.DB.save.partner=4;G.DB.save.owned[4]={at:Date.now(),from:'test'};G.Flow.goMenu();});
   await page.evaluate(()=>document.querySelector('#scr-menu [data-go="play"]').click());await page.getByRole('button',{name:'TFT · Oleadas infinitas',exact:true}).click();await page.locator('#tft-deck-start').click();await page.setViewportSize(viewport);
   assert.match(await page.locator('#tft-stats').innerText(),/5 vidas/);assert.equal(await page.evaluate(()=>!!G.TFT_PREVIEW),false);assert.equal(await page.evaluate(()=>G.TFTUI.state.rankOwner),undefined);
   await page.evaluate(()=>{const s=G.TFTUI.state;s.shop=[4];G.TFT.buy(s,0);G.TFT.place(s,s.units[0].id,20);G.TFTUI.open();});
   for(let loss=1;loss<=5;loss++){
    await page.evaluate(()=>{G.TFT.start(G.TFTUI.state);for(const u of G.TFTUI.state.battle.units)if(u.side===0)u.hp=0;});
    await page.waitForFunction(()=>G.TFTUI.state.phase!=='combat');assert.equal(await page.evaluate(()=>G.TFTUI.state.life),5-loss);
    if(loss<5)await page.locator('#tft-next').click();
   }
   await page.locator('#tft-finale').waitFor({state:'visible'});assert.match(await page.locator('#tft-rank-status').textContent(),/cuenta/,JSON.stringify(errors));
   assert.equal(await page.evaluate(()=>localStorage.getItem('ps.tft.rank.pending.v1')),null);
   await page.locator('#scr-tft').screenshot({animations:'disabled',path:`/workspace/scratch/tft-live-finale-${viewport.width}.png`});
   await page.setViewportSize(boot);await page.locator('#tft-exit').click();
   await page.evaluate(()=>{
    G.SocialUI.needOnline=()=>true;Object.defineProperty(G.Social,'started',{get:()=>true});Object.defineProperty(G.Social,'me',{get:()=>({name:'Tiliko'})});
    G.Ranking.top=async()=>[{id:'test',t:24,uids:['test'],names:['Tiliko'],dex:[6],shiny:[false],lv:24,kills:19}];G.Ranking.myRank=async()=>null;G.RankingUI.open('tft');
   });await page.setViewportSize(viewport);
   await page.waitForFunction(()=>document.getElementById('rk-list').textContent.includes('Oleada 24'));
   assert.equal(await page.locator('#rk-poke').isVisible(),false);assert.equal(await page.getByRole('button',{name:'Sólo amigos',exact:true}).isVisible(),true);
   assert.match(await page.locator('#rk-metric').innerText(),/oleada alcanzada/);assert.match(await page.locator('#rk-list').innerText(),/19 oleadas ganadas/);
   await page.locator('#scr-rank').screenshot({animations:'disabled',path:`/workspace/scratch/tft-live-ranking-mock-${viewport.width}.png`});
   await page.getByRole('button',{name:'Solo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#rk-list .time')?.textContent==='0:24');assert.equal(await page.locator('#rk-poke').isVisible(),true);
   assert.deepEqual(errors,[]);await context.close();
  }console.log('Live TFT: published modules boot, five losses end the run, guests never upload, TFT ranking displays waves and survival still displays time; desktop and portrait passed.');
 }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
