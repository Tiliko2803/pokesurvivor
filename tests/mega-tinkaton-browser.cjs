'use strict';
// Real local game, persistent stone unlock, sprite decoding, and phone layouts.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs'),{spawn}=require('node:child_process');
const root=path.join(__dirname,'..'),port=8879;
(async()=>{
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
 let browser;
 try{
  for(let i=0;i<50;i++){try{await fetch(`http://127.0.0.1:${port}/`);break;}catch{await new Promise(r=>setTimeout(r,100));}}
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,
   args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  for(const viewport of (process.env.PORTRAIT_ONLY?[{width:390,height:844}]:[{width:1100,height:720},{width:844,height:390},{width:390,height:844}])){
   const context=await browser.newContext({viewport,locale:'es-MX',serviceWorkers:'block',isMobile:viewport.width!==1100,hasTouch:viewport.width!==1100});
   const page=await context.newPage(),errors=[],missing=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().includes('127.0.0.1'))missing.push(r.url());});
   await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
   console.log('Loading',viewport);await page.goto(`http://127.0.0.1:${port}/`);
   await page.waitForFunction(()=>window.G?.DB?.mode==='local'&&document.getElementById('boot').classList.contains('hidden'));
   await page.evaluate(async()=>{
    await G.DB.register('TinkatonQA','123456');G.DB.grant(959,'test');G.DB.save.partner=959;
    G.DB.commit(true);G.Flow.goMenu();document.getElementById('tap-start').classList.add('hidden');
   });
   assert.match(await page.locator('#menu-mega').innerText(),/Tinkatonita/);
   assert.equal(await page.locator('#menu-mega button').isDisabled(),true);
   await page.evaluate(()=>G.Game.startRun());assert.equal(await page.evaluate(()=>G.Game.player.mega),null);
   if(viewport.height>viewport.width){
    assert.equal(await page.locator('#rotate').isVisible(),true,'portrait retains the game’s landscape notice');
    console.log(JSON.stringify({viewport,requiresLandscape:true,errors,missing}));await context.close();continue;
   }
   await page.evaluate(()=>{G.Game.player.bosses=3;G.Game.quit();});
   assert.match(await page.locator('#scr-over').innerText(),/Tinkatonita/);
   await page.locator('#btn-again').click();await page.locator('#menu-mega button').click();
   await page.reload();await page.waitForFunction(()=>G.DB.save?.partner===959&&document.getElementById('boot').classList.contains('hidden'));
   await page.evaluate(()=>{G.Flow.goMenu();document.getElementById('tap-start').classList.add('hidden');});
   await page.waitForFunction(()=>G.Tinkaton.ready());
   assert.equal(await page.evaluate(()=>G.Mega.equipped(G.DB.save,959)),true);
   if(viewport.width===1100)await page.screenshot({path:path.join(root,'../tinkaton-menu.png')});
   await page.evaluate(()=>G.Game.startRun());
   assert.deepEqual(await page.evaluate(()=>({mega:G.Game.player.mega,move:G.Game.player.moves[0].id,lvl:G.Game.player.moves[0].lvl,atk:G.Game.player.baseAtk})),
    {mega:'tinkatonite',move:'gigaton-hammer',lvl:2,atk:1.47});
   console.log('Checking frames',viewport);const result=await page.evaluate(()=>{
    const cv=document.createElement('canvas');cv.width=256;cv.height=224;const ctx=cv.getContext('2d');
    const output={};
    for(const action of Object.keys(G.Tinkaton.duration)){
     output[action]=[];
     for(let dir=0;dir<8;dir++){
      const seen=new Set();
      for(let frame=0;frame<8;frame++){
       const a=new G.Tinkaton.Animator();a.dir=dir;a.play(action,{hold:true});a.update(G.Tinkaton.duration[action]*frame/8);
       ctx.clearRect(0,0,256,224);a.draw(ctx,128,204);
       const rgba=ctx.getImageData(0,0,256,224).data;let visible=0;
       for(let i=3;i<rgba.length;i+=4)if(rgba[i]>32)visible++;
       if(visible<1000)throw Error(`Empty pose: ${action} ${dir} ${frame}`);
       seen.add(cv.toDataURL());
      }
      output[action].push(seen.size);
     }
    }
    G.EnemyMgr.clear();G.Game.player.invuln=0;return output;
   });
   for(const action of ['Walk','Attack'])assert.ok(result[action].every(n=>n>=4),action+' needs four actual poses');
   for(const action of ['Shoot','Charge','Hurt','Faint'])assert.ok(result[action].every(n=>n>=2),action+' needs separate poses');
   if(viewport.width===1100){
    await page.screenshot({path:path.join(root,'../tinkaton-game.png')});

   }
   assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
   console.log(JSON.stringify({viewport,frames:result,errors,missing}));await context.close();
  }
 }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
