'use strict';
// Uses the same installed Playwright/Chromium runtime as coverage-browser.cjs.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const {spawn}=require('node:child_process'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),port=8898;
(async()=>{
  const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
  let browser;
  try{
    for(let i=0;i<50;i++){try{await fetch(`http://127.0.0.1:${port}/dev/`);break;}catch{await new Promise(r=>setTimeout(r,100));}}
    const runtime=process.env.CHROMIUM_PACKAGE?(await import(process.env.CHROMIUM_PACKAGE)).default:null;
    browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,
      args:runtime?runtime.args.filter(a=>!['--single-process','--in-process-gpu'].includes(a)):['--no-sandbox','--disable-dev-shm-usage']});
    for(const viewport of [{width:1100,height:720},{width:844,height:390},{width:568,height:320}]){
      const context=await browser.newContext({viewport,locale:'es-MX',serviceWorkers:'block',isMobile:viewport.width<1000,hasTouch:viewport.width<1000});
      const page=await context.newPage(),errors=[];page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
      await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
      await page.addInitScript(()=>{localStorage.setItem('ps.session','real-account-sentinel');localStorage.setItem('ps.save.real-account-sentinel','{"coins":54321}');});
      await page.goto(`http://127.0.0.1:${port}/dev/`);
      await page.waitForFunction(()=>window.G?.Tyranitar&&document.getElementById('boot').classList.contains('hidden'));
      await page.evaluate(()=>{document.getElementById('tap-start').classList.add('hidden');G.DB.save.partner=248;G.Flow.goMenu();});
      await page.waitForFunction(()=>G.Tyranitar.ready());
      assert.match(await page.locator('#menu-mega').innerText(),/Tyranitarita/);
      assert.match(await page.locator('#menu-mega button').innerText(),/Mega equipada/);
      const art=await page.evaluate(()=>{
        const cv=document.createElement('canvas');cv.width=240;cv.height=180;const ctx=cv.getContext('2d'),a=new G.Tyranitar.Animator();
        const hashes=[],alpha=new Set();
        for(let dir=0;dir<8;dir++){
          a.dir=dir;a.loop('Walk');a.t=.2;ctx.clearRect(0,0,240,180);a.draw(ctx,120,150);
          const pixels=ctx.getImageData(0,0,240,180).data;let hash=0;
          for(let i=0;i<pixels.length;i++){hash=(hash*31+pixels[i])|0;if(i%4===3)alpha.add(pixels[i]);}
          hashes.push(hash);
        }
        return {hashes,alpha:[...alpha],ready:G.Tyranitar.ready(),failed:G.Tyranitar.failed()};
      });
      assert.equal(art.failed,false);assert.equal(new Set(art.hashes).size,8,'all eight facing directions render differently');
      assert.ok(art.alpha.includes(0)&&art.alpha.includes(255),'transparent padding and solid character');
      await page.evaluate(()=>G.BossRushPreview.open());
      await page.locator('#rush-partner').selectOption('248');await page.locator('#rush-max').click();
      await page.evaluate(()=>{G.Coverage.choose(G.DEX_BY[248],G.DB.save,['dragon-dance']);document.getElementById('rush-partner').onchange();});
      await page.locator('#rush-move-2').selectOption('dragon-dance');
      await page.locator('#rush-start').click();
      assert.equal(await page.evaluate(()=>G.Game.player.mega),'tyranitarite');
      assert.equal(await page.evaluate(()=>G.Game.player.moves.find(m=>m.id==='rock-throw').lvl),2);
      for(let i=0;i<7;i++)await page.locator('#cards .card').first().click();
      await page.waitForFunction(()=>!G.BossRushPreview.preparing&&G.Game.state==='playing');
      const paused=await page.evaluate(()=>{G.Game.togglePause();return {state:G.Game.state,sand:G.Game.player.sandElapsed||0};});
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate(()=>G.Game.player.sandElapsed||0),paused.sand,'pause stops sand simulation');
      await page.evaluate(()=>{
        const p=G.Game.player;p.hp=p.maxHp;p.invuln=100;p.setActive(p.slots.findIndex(g=>g.some(m=>m.id==='dragon-dance')));
        const dance=p.moves.find(m=>m.id==='dragon-dance');while(dance.lvl<5)G.Moves.levelUp(dance);
        p.statsTaken.cd=1;G.Moves.evolve(dance);for(let i=0;i<8;i++)p.addBuff('atk',dance.amount,dance.dur,dance.stacks,dance);
      });
      await page.evaluate(()=>G.Game.togglePause());
      await page.waitForFunction(()=>G.Game.player.sandElapsed>.1);
      await page.screenshot({path:`/tmp/mega-tyranitar-${viewport.width}.png`});
      assert.equal(await page.evaluate(()=>G.Game.player.buffs.atk.dragonCelestial),true);
      assert.equal(await page.evaluate(()=>localStorage.getItem('ps.session')),'real-account-sentinel');
      assert.equal(await page.evaluate(()=>localStorage.getItem('ps.save.real-account-sentinel')),'{"coins":54321}');
      assert.deepEqual(errors,[]);console.log('PASS Mega Tyranitar browser',viewport.width);await context.close();
    }
  }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
