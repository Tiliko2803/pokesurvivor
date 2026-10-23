'use strict';
// Requires Playwright and an installed browser; CHROMIUM_PATH can override it.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const {spawn}=require('node:child_process'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),port=8936;
async function boardRect(page){return page.locator('.tft-board-wrap').evaluate(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});}
async function checkBoard(page,viewport){
 const r=await boardRect(page);assert.ok(r.x>=-1&&r.y>=-1&&r.x+r.width<=viewport.width+1&&r.y+r.height<=viewport.height+1,JSON.stringify({viewport,board:r}));
 assert.ok(r.width>=175,'board stays legible');
 assert.equal(await page.evaluate(()=>document.getElementById('scr-tft').scrollHeight<=document.getElementById('scr-tft').clientHeight+1),true,'screen must not scroll the board away');
}
(async()=>{
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
 let browser;
 try {
  for(let i=0;i<40;i++){try{await fetch(`http://127.0.0.1:${port}/dev.html`);break;}catch{await new Promise(r=>setTimeout(r,100));}}
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
  for(const viewport of [{width:1280,height:800},{width:390,height:844},{width:320,height:568},{width:844,height:390},{width:568,height:320}]) {
   const bootViewport=viewport.height>viewport.width?{width:viewport.height,height:viewport.width}:viewport;
   const context=await browser.newContext({viewport:bootViewport,locale:'es-MX',isMobile:viewport.width<1000,hasTouch:viewport.width<1000,serviceWorkers:'block'});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
   await page.goto(`http://127.0.0.1:${port}/dev.html?dev`);
   await page.waitForFunction(()=>window.G?.TFTUI&&document.getElementById('boot').classList.contains('hidden'));
   if(await page.locator('#tap-start').isVisible())await page.locator('#tap-start').click();
   await page.evaluate(async()=>{
    await G.DB.playAsGuest();
    G.DB.save.partner=4;G.DB.save.owned[4]={at:Date.now(),from:'test'};G.Flow.goMenu();
    localStorage.setItem('tft-account-sentinel','{"coins":54321}');
   });
   const before=await page.evaluate(()=>JSON.stringify(G.DB.save));
   await page.evaluate(()=>document.querySelector('#scr-menu [data-go="play"]').click());
   await page.locator('#btn-tft').click();await page.locator('#scr-tft').waitFor({state:'visible'});
   await page.setViewportSize(viewport);
   await page.locator('#tft-deck-panel').waitFor({state:'visible'});
   assert.equal(await page.locator('#tft-deck-list [data-family]').count(),54);
   await page.getByRole('button',{name:'Línea Bulbasaur',exact:true}).click();
   assert.equal(await page.locator('#tft-deck-start').isEnabled(),false);
   await page.getByRole('button',{name:'Línea Magikarp',exact:true}).click();
   await page.locator('#tft-deck-save').click();
   await page.getByRole('button',{name:'Mazo 2',exact:true}).click();
   await page.getByRole('button',{name:'Mazo 1',exact:true}).click();
   assert.equal(await page.getByRole('button',{name:'Línea Magikarp',exact:true}).getAttribute('aria-pressed'),'true');
   assert.equal(await page.getByRole('button',{name:'Línea Bulbasaur',exact:true}).getAttribute('aria-pressed'),'false');
   const savedDecks=await page.evaluate(()=>JSON.parse(localStorage.getItem('ps.tft.decks.v1')));
   assert.equal(savedDecks.length,3);assert.equal(savedDecks[0].length,10);assert.ok(savedDecks[0].includes(129));
   await page.locator('#tft-deck-start').click();
   assert.equal(await page.evaluate(()=>G.TFTUI.state.shop.every(d=>G.TFTUI.state.deck.includes(d))),true);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   assert.equal(await page.evaluate(()=>document.getElementById('scr-tft').scrollWidth<=document.getElementById('scr-tft').clientWidth),true);
   await page.evaluate(()=>{G.TFTUI.state.shop=[4,4,4,7,172];});
   for(let i=0;i<3;i++)await page.locator(`#tft-shop [data-buy="${i}"]`).click();
   assert.equal(await page.evaluate(()=>G.TFTUI.state.units[0].dex),5);
   assert.match(await page.locator('#tft-evolution').innerText(),/Charmeleon/);
   await page.locator('#tft-tab-team').click();
   await page.locator('#tft-bench [data-unit]').click();await page.locator('#tft-cells button').nth(20).click();
   assert.equal(await page.evaluate(()=>G.TFTUI.state.units[0].pos),20);
   await checkBoard(page,viewport);
   for(const key of ['team','info','scout','report','shop']){await page.locator('#tft-tab-'+key).click();assert.equal(await page.locator('#tft-pane-'+key).isVisible(),true);await checkBoard(page,viewport);}
   await page.locator('#tft-tab-shop').press('ArrowRight');assert.equal(await page.locator('#tft-tab-team').getAttribute('aria-selected'),'true');
   await page.locator('#tft-tab-team').click();const rect=await boardRect(page);
   await page.locator('#tft-panel-body').evaluate(e=>e.scrollTop=e.scrollHeight);assert.deepEqual(await boardRect(page),rect,'panel scroll cannot move the board');
   await page.locator('#tft-panel-toggle').click();assert.equal(await page.locator('#tft-panel-body').isVisible(),false);await checkBoard(page,viewport);
   await page.locator('#tft-tab-scout').click();
   assert.equal(await page.locator('#tft-scout-list button').count(),2);
   await page.locator('#tft-scout-list button').first().click();assert.match(await page.locator('#tft-unit-info').innerText(),/AL INICIO/);
   await page.locator('#tft-fight').click();
   await page.locator('#tft-entrances').waitFor({state:'visible'});
   await page.locator('#tft-pause').click();
   const t=await page.evaluate(()=>G.TFTUI.state.battle.time);await page.waitForTimeout(150);
   assert.equal(await page.evaluate(()=>G.TFTUI.state.battle.time),t);
   await page.locator('#tft-pause').click();
   await page.waitForFunction(()=>G.TFTUI.state.battle.time>0);
   await page.setViewportSize(bootViewport);await page.locator('#tft-exit').click();
   await page.evaluate(()=>document.querySelector('#scr-menu [data-go="play"]').click());await page.locator('#btn-tft').click();await page.setViewportSize(viewport);
   assert.match(await page.locator('#tft-phase').innerText(),/pausa/);
   const restoredTime=await page.evaluate(()=>G.TFTUI.state.battle.time);await page.waitForTimeout(150);
   assert.equal(await page.evaluate(()=>G.TFTUI.state.battle.time),restoredTime);
   await page.locator('#tft-pause').click();
   await page.evaluate(()=>{for(const u of G.TFTUI.state.battle.units)if(u.side===1)u.hp=0;});
   await page.waitForFunction(()=>G.TFTUI.state.phase==='result');
   assert.equal(await page.locator('#tft-report').isVisible(),true);await checkBoard(page,viewport);
   assert.match(await page.locator('#tft-report-rows').innerText(),/Charmeleon/);
   await page.locator('#tft-report [data-report=enemy]').click();
   assert.ok((await page.locator('#tft-report-rows').innerText()).includes('Total'));
   await page.locator('#tft-report [data-report=match]').click();
   assert.match(await page.locator('#tft-report-title').innerText(),/acumulado/);
   await page.locator('#tft-next').click();
   assert.equal(await page.evaluate(()=>G.TFTUI.state.round),2);await checkBoard(page,viewport);
   // Reproduce a saved final result: the recovery action must stay outside tabs/details.
   for(const terminal of ['victory','defeat']){
    await page.evaluate(terminal=>{
     const s=G.TFTUI.state;s.round=terminal==='victory'?12:1;s.life=terminal==='defeat'?1:50;s.opponentRound=0;
     G.TFT.start(s);
     for(const u of s.battle.units)if(u.side===(terminal==='victory'?1:0))u.hp=0;
    },terminal);
    await page.waitForFunction(terminal=>G.TFTUI.state.phase===terminal,terminal);
    await page.setViewportSize(bootViewport);await page.locator('#tft-exit').click();
    await page.evaluate(()=>document.querySelector('#scr-menu [data-go="play"]').click());await page.locator('#btn-tft').click();await page.setViewportSize(viewport);
    assert.equal(await page.evaluate(()=>G.TFTUI.state.phase),terminal);
    assert.equal(await page.locator('#tft-report').isVisible(),true);
    assert.equal(await page.locator('#tft-restart').isVisible(),true);await checkBoard(page,viewport);
    for(const tab of ['shop','team','info','scout','report']){
     await page.locator('#tft-tab-'+tab).click();assert.equal(await page.locator('#tft-restart').isVisible(),true);
    }
    await page.locator('#tft-panel-toggle').click();assert.equal(await page.locator('#tft-restart').isVisible(),true);
    await page.locator('#tft-restart').click();await page.locator('#tft-deck-panel').waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>localStorage.getItem('ps.tft.match.v1')),null);
    assert.equal(await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('ps.tft.decks.v1')))),JSON.stringify(savedDecks));
    await page.locator('#tft-deck-start').click();
    assert.equal(await page.evaluate(()=>G.TFTUI.state.phase),'planning');assert.equal(await page.evaluate(()=>G.TFTUI.state.round),1);
    assert.equal(await page.evaluate(()=>G.TFTUI.state.life),50);assert.equal(await page.evaluate(()=>G.TFTUI.state.gold),10);
    assert.equal(await page.evaluate(()=>G.TFTUI.state.units.length),0);
    // Recruit and deploy for the next terminal scenario.
    await page.evaluate(()=>{G.TFTUI.state.shop=[4];});await page.locator('#tft-shop [data-buy="0"]').click();
    await page.locator('#tft-tab-team').click();await page.locator('#tft-bench [data-unit]').click();await page.locator('#tft-cells button').nth(20).click();
   }
   assert.equal(await page.evaluate(()=>JSON.stringify(G.DB.save)),before);
   assert.equal(await page.evaluate(()=>localStorage.getItem('tft-account-sentinel')),'{"coins":54321}');
   await page.locator('#scr-tft').screenshot({path:`/workspace/scratch/tft-layout-${viewport.width}x${viewport.height}.png`});
   await page.setViewportSize(bootViewport);await page.locator('#tft-exit').click();
   assert.equal(await page.evaluate(()=>G.TFTUI.active),false);
   assert.equal(await page.locator('#scr-menu').isVisible(),true);
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log('TFT layout: 5 viewport sizes, tabs, independent scrolling, deployment, combat, pause and save/resume passed');
 } finally {if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
