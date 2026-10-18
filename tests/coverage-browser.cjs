'use strict';
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const {spawn}=require('node:child_process'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),port=8897;
(async()=>{
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
 let browser;
 try {
  for(let i=0;i<50;i++){try{await fetch(`http://127.0.0.1:${port}/`);break;}catch{await new Promise(r=>setTimeout(r,100));}}
  const runtime=process.env.CHROMIUM_PACKAGE?(await import(process.env.CHROMIUM_PACKAGE)).default:null;
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(runtime?await runtime.executablePath():undefined),
    args:runtime?runtime.args.filter(a=>!['--single-process','--in-process-gpu'].includes(a)):['--no-sandbox','--disable-dev-shm-usage']});
  for(const config of [{width:1100,height:720,lang:'es'},{width:844,height:390,lang:'es'},{width:568,height:320,lang:'es'},{width:1100,height:720,lang:'en'}]){
   const {lang,...viewport}=config;
   const context=await browser.newContext({viewport,locale:lang==='en'?'en-US':'es-MX',serviceWorkers:'block',isMobile:viewport.width<1000,hasTouch:viewport.width<1000});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
   await page.goto(`http://127.0.0.1:${port}/`);
   await page.waitForFunction(()=>window.G?.DB?.mode==='local'&&document.getElementById('boot').classList.contains('hidden'));
   await page.evaluate(async()=>{
    await G.DB.register('CoverageBrowser','123456');for(const d of [260,257,25,129])G.DB.grant(d,'starter');
    G.DB.save.partner=260;G.DB.save.coins=100000;G.DB.commit(true);G.Flow.goMenu();
    document.getElementById('tap-start').classList.add('hidden');
   });
   await page.locator('[data-go="upgrades"]').click();
   const row=id=>page.locator('.upg-item').filter({has:page.locator('b',{hasText:new RegExp('^'+id+'$')})});
   const coverage=row(lang==='en'?'Coverage':'Coberturas');
   for(const [i,id]of ['ice-beam','rock-slide','toxic'].entries()){
    const price=[1500,4000,10000][i],before=await page.evaluate(()=>G.DB.save.coins);
    assert.match(await coverage.locator('[data-buy]').innerText(),new RegExp(String(price)));
    await coverage.locator('[data-buy]').click();
    assert.equal(await page.evaluate(()=>G.DB.save.coins),before-price);
    await page.locator(`[data-coverage-id="${id}"]`).click();
    assert.equal(await page.locator(`[data-coverage-id="${id}"]`).getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('[data-coverage-count]').innerText(),`${i+1}/${i+1}`);
   }
   assert.equal(await coverage.locator('[data-buy]').isDisabled(),true);
   await row(lang==='en'?'Repertoire':'Repertorio').locator('[data-buy]').click();
   await page.locator('[data-repertoire]').click();await page.locator('[data-repertoire-id="ice-beam"]').click();
   assert.equal(await page.evaluate(()=>G.DB.save.prepertoire[260]),'ice-beam');
   await row(lang==='en'?'Ban':'Veto').locator('[data-buy]').click();await page.locator('[data-ban]').click();
   await page.locator('.ban-picker:not(.coverage-picker):not(.repertoire-picker) [data-id="ice-beam"]').click();
   assert.equal(await page.evaluate(()=>G.Repertoire.selected(G.DEX_BY[260],G.DB.save)),null);
   await page.locator('.ban-picker:not(.coverage-picker):not(.repertoire-picker) [data-id="ice-beam"]').click();
   assert.equal(await page.evaluate(()=>G.Repertoire.selected(G.DEX_BY[260],G.DB.save)),'ice-beam');
   const selection=await page.evaluate(()=>G.Coverage.selected(G.DEX_BY[260],G.DB.save));assert.deepEqual(selection,['ice-beam','rock-slide','toxic']);
   assert.ok(await page.locator('[data-slot="0"] option[value="ice-beam"]').count());
   const button=page.locator('[data-coverage-id="toxic"]');await button.scrollIntoViewIfNeeded();
   const box=await button.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=viewport.width+1,JSON.stringify(box));
   await page.screenshot({path:`/tmp/coverage-${viewport.width}-${lang}.png`});
   await page.reload();await page.waitForFunction(()=>G.DB.save?.partner===260&&document.getElementById('boot').classList.contains('hidden'));
   assert.deepEqual(await page.evaluate(()=>G.Coverage.selected(G.DEX_BY[260],G.DB.save)),selection);
   await page.evaluate(()=>{G.Flow.goMenu();document.getElementById('tap-start').classList.add('hidden');G.Game.startRun();G.Game.player.invuln=999;});
   assert.deepEqual(await page.evaluate(()=>G.Game.player.coverage),selection);
   assert.deepEqual(await page.evaluate(()=>G.Game.player.moves.map(m=>m.id)),['water-gun','ice-beam']);
   assert.equal(await page.evaluate(()=>G.Game.player.maxMoves),4);
   // End only the local test run; do not touch live Firebase or real accounts.
   await page.evaluate(()=>{G.Game.quit();G.Flow.goMenu();});await page.locator('[data-go="upgrades"]').click();
   if(!(await page.locator('[data-coverage-id="ice-beam"]').count()))await page.locator('[data-coverage]').click();
   await page.locator('[data-coverage-clear]').click();
   assert.deepEqual(await page.evaluate(()=>G.Coverage.selected(G.DEX_BY[260],G.DB.save)),[]);
   await page.locator('#upg-mon').selectOption('129');assert.equal(await coverage.locator('[data-buy]').isDisabled(),true);
   assert.match(await page.locator('.coverage-empty').innerText(),lang==='en'?/no compatible coverage/:/no tiene coberturas/);
   await page.locator('#upg-mon').selectOption('25');await coverage.locator('[data-buy]').click();
   assert.equal(await coverage.locator('[data-buy]').isDisabled(),true,'Pikachu only has one useful coverage tier in the current catalog');
   assert.deepEqual(await page.evaluate(()=>G.Coverage.selected(G.DEX_BY[257],G.DB.save)),[]);
   assert.deepEqual(errors,[]);
   console.log(`PASS ${viewport.width}x${viewport.height} ${lang}: prices, picker, Repertoire, Veto, shortcuts, reload, real start and empty/limited species`);
   await context.close();
  }
 }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
