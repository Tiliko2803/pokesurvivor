'use strict';
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.join(__dirname,'..'),port=8895;
(async()=>{
  const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
  let browser;
  try {
    for(let i=0;i<50;i++) {try{await fetch(`http://127.0.0.1:${port}/`);break;}catch{await new Promise(r=>setTimeout(r,100));}}
    browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
    for(const viewport of [{width:1100,height:720},{width:844,height:390},{width:568,height:320}]) {
      const context=await browser.newContext({viewport,locale:'es-MX',serviceWorkers:'block',isMobile:viewport.width<1000,hasTouch:viewport.width<1000});
      const page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
      await page.goto(`http://127.0.0.1:${port}/`);
      await page.waitForFunction(()=>window.G?.DB?.mode==='local'&&document.getElementById('boot').classList.contains('hidden'));
      await page.evaluate(async()=>{
        await G.DB.register('GoldTest','123456');G.DB.grant(1,'starter');G.DB.grant(4,'test');
        G.DB.save.partner=1;G.DB.save.coins=100000;G.DB.commit(true);G.Flow.goMenu();
        document.getElementById('tap-start').classList.add('hidden');
      });
      await page.locator('[data-go="upgrades"]').click();
      const names=['Golpe Devastador','Expansión','Persistencia','Drenaje','Último Aliento','Más Opciones'];
      for(const name of names)assert.equal(await page.locator('.upg-item').filter({has:page.locator('b',{hasText:new RegExp('^'+name+'$')})}).count(),1);
      const row=page.locator('.upg-item').filter({has:page.locator('b',{hasText:'Más Opciones'})});
      for(const [level,price] of [2000,6000,15000].entries()) {
        assert.match(await row.locator('[data-buy]').innerText(),new RegExp(String(price)));
        const before=await page.evaluate(()=>G.DB.save.coins);
        await row.locator('[data-buy]').click();
        assert.equal(await page.evaluate(()=>G.DB.save.pupg[1].options),level+1);
        assert.equal(await page.evaluate(()=>G.DB.save.coins),before-price);
      }
      assert.equal(await row.locator('[data-buy]').isDisabled(),true);
      for(const name of names.slice(0,5)) {
        const other=page.locator('.upg-item').filter({has:page.locator('b',{hasText:new RegExp('^'+name+'$')})});
        await other.locator('[data-buy]').click();
      }
      await page.reload();
      await page.waitForFunction(()=>G.DB.save?.partner===1&&document.getElementById('boot').classList.contains('hidden'));
      assert.deepEqual(await page.evaluate(()=>G.DB.save.pupg[1]),{critDamage:1,area:1,duration:1,drain:1,lastBreath:1,options:3});
      assert.deepEqual(await page.evaluate(()=>G.DB.upgradesOf(4)),{});
      await page.evaluate(()=>{G.Flow.goMenu();document.getElementById('tap-start').classList.add('hidden');G.Game.startRun();});
      await page.evaluate(()=>{
        G.UI.show('scr-pause');
        const p=G.Game.player;p.frozen=true;
        window.__picked=0;
        G.RunUI.showLevelUp(2,G.LevelUp.offer(p),c=>{window.__picked++;c.apply(p);});
      });
      assert.equal(await page.locator('#cards .card').count(),6);
      assert.match(await page.locator('#lvl-hint').textContent(),/6/);
      await page.locator('#lvl-reroll').click();assert.equal(await page.locator('#cards .card').count(),6);
      const sixth=page.locator('#cards .card').nth(5);
      await sixth.scrollIntoViewIfNeeded();assert.equal(await sixth.isVisible(),true);
      const box=await sixth.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=viewport.width+1);
      const dialog=await page.locator('#scr-levelup .box').boundingBox();assert.ok(dialog.y>=-1&&dialog.y+dialog.height<=viewport.height+1,JSON.stringify(dialog));
      await page.screenshot({path:`/tmp/gold-upgrades-${viewport.width}.png`});
      await sixth.click();assert.equal(await page.evaluate(()=>window.__picked),1);
      // Exercise the real game's key handler (state is set by the real level-up path).
      await page.evaluate(()=>{G.UI.hide('scr-pause');G.Game.player.invuln=999;G.Game.debugLevelUp();});
      await page.waitForFunction(()=>!document.getElementById('scr-levelup').classList.contains('hidden'));
      await page.keyboard.press('6');await page.waitForFunction(()=>document.getElementById('scr-levelup').classList.contains('hidden'));
      assert.deepEqual(errors,[]);
      console.log(`PASS ${viewport.width}x${viewport.height}: purchases, costs, save reload, per-Pokémon isolation, six cards, reroll, touch and key 6`);
      await context.close();
    }
  } finally {if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
