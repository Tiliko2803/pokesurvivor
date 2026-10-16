'use strict';
// Real dev-page, asset decoding, automatic melee damage, touch/keyboard and save isolation.
// CHROMIUM_PATH=/path/to/chrome node tests/mega-blaziken-browser.cjs
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');
const root=path.join(__dirname,'..');
const port=8873;
(async()=>{
  const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
  let browser;
  try{
    for(let i=0;i<60;i++){
      try{await fetch(`http://127.0.0.1:${port}/dev/`);break;}catch{await new Promise(r=>setTimeout(r,100));}
    }
    browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,
      args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    for(const viewport of [{width:1100,height:720},{width:844,height:390}]){
      const context=await browser.newContext({viewport,locale:'es-MX',serviceWorkers:'block',
        isMobile:viewport.width===844,hasTouch:viewport.width===844});
      const page=await context.newPage(),errors=[],missing=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(`http://127.0.0.1:${port}`))missing.push(r.url());});
      await page.addInitScript(()=>{
        localStorage.setItem('ps.session','real-account-sentinel');
        localStorage.setItem('ps.save.real-account-sentinel',JSON.stringify({coins:54321,owned:{257:{at:1}}}));
      });
      await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
      await page.goto(`http://127.0.0.1:${port}/dev/`);
      await page.waitForFunction(()=>window.G?.Game&&document.getElementById('boot').classList.contains('hidden'));
      await page.locator('#tap-start').click();
      await page.waitForFunction(()=>G.UI.isOpen('scr-menu')&&G.Blaziken.ready()&&G.Blaziken.extraReady());
      assert.equal(await page.evaluate(()=>G.DB.guest),true);
      assert.equal(await page.evaluate(()=>G.DB.save.partner),260);
      const initial=await page.evaluate(()=>{
        window.rankCalls=[];window.saveCalls=[];
        G.Ranking.runStarted=()=>rankCalls.push('start');G.Ranking.submitSolo=()=>rankCalls.push('solo');
        G.DB.commit=()=>saveCalls.push('commit');
        window.previewSave=JSON.stringify(G.DB.save);
        return JSON.stringify({...localStorage});
      });
      await page.locator('#btn-blaziken-preview').scrollIntoViewIfNeeded();
      await page.screenshot({path:`/tmp/blaziken-menu-${viewport.width}.png`});
      await page.locator('#btn-blaziken-preview').click();
      await page.waitForFunction(()=>G.Game.state==='playing'&&G.Game.player.mega==='blazikenite');
      const info=await page.evaluate(()=>{
        const p=G.Game.player,m=p.activeMove();
        return {name:p.mon.name,types:p.mon.types,move:m.id,lvl:m.lvl,kind:m.kind,type:m.type,partner:G.DB.save.partner,shiny:p.shiny};
      });
      assert.equal(info.name,'Mega Blaziken');assert.deepEqual(info.types,['fire','fighting']);
      assert.equal(info.move,'karate-chop');assert.equal(info.lvl,2);assert.equal(info.kind,'melee');assert.equal(info.type,'fighting');
      assert.equal(info.partner,260);assert.equal(info.shiny,false);
      const frames=await page.evaluate(()=>{
        const a=new G.Blaziken.Animator(),cv=document.createElement('canvas');cv.width=192;cv.height=160;
        const ctx=cv.getContext('2d'),result={};
        for(const action of ['Idle','Walk','Attack','Shoot','Charge','Hurt','Faint']){
          result[action]=[];
          for(let dir=0;dir<8;dir++){
            const seen=new Set();
            for(let f=0;f<12;f++){
              a.play(action,{hold:true});a.dir=dir;a.update(G.Blaziken.duration[action]*(f/12));
              ctx.clearRect(0,0,192,160);a.draw(ctx,96,142);
              const pixels=ctx.getImageData(0,0,192,160).data;
              let n=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>32)n++;
              if(n<500)throw Error(`Empty frame ${action}, direction ${dir}, frame ${f}: ${n}`);
              seen.add(cv.toDataURL());
            }
            result[action].push(seen.size);
          }
        }
        a.play('Faint',{hold:true});a.update(2);
        if(!a.done||a.busy()||a.progress()!==1)throw Error('Faint does not hold its final frame');
        return result;
      });
      assert.ok(frames.Walk.every(n=>n>=4));assert.ok(frames.Attack.every(n=>n>=3));
      assert.ok(frames.Shoot.every(n=>n>=3),'ranged casting lacks separate poses');
      const impulses=await page.evaluate(()=>{
        const p=G.Game.player;G.EnemyMgr.clear();p.invuln=99;
        const values=[];
        for(const t of [0,29.99,30,60,150,600]){p.megaElapsed=t;values.push(p.spd/p.baseSpd);}
        p.megaElapsed=0;return values;
      });
      assert.ok(Math.abs(impulses[0]-impulses[1])<1e-8);
      assert.ok(Math.abs(impulses[2]/impulses[0]-1.05)<1e-8);
      assert.ok(Math.abs(impulses[4]/impulses[0]-1.25)<1e-8);
      assert.equal(impulses[4],impulses[5]);
      // Stay on ordinary ground and move via the real input path.
      await page.evaluate(()=>{G.EnemyMgr.clear();});
      const x=await page.evaluate(()=>G.Game.player.x);
      if(viewport.width===1100){
        await page.keyboard.down('d');await page.waitForTimeout(300);await page.keyboard.up('d');
      }else{
        const cdp=await context.newCDPSession(page);
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:260,y:210}]});
        await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:315,y:210}]});
        await page.waitForTimeout(300);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      }
      assert.notEqual(await page.evaluate(()=>G.Game.player.x),x,'movement failed');
      const hp=await page.evaluate(()=>{
        G.EnemyMgr.clear();const p=G.Game.player;p.invuln=99;
        const e=new G.Enemy({dex:19,hp:5000,spd:0,dmg:0,xp:1,behavior:'chase'},p.x+38,p.y,{hp:1,spd:1,dmg:1});
        G.EnemyMgr.add(e);window.blazikenTarget=e;return e.hp;
      });
      await page.waitForTimeout(1200);
      assert.ok(await page.evaluate(()=>blazikenTarget.hp)<hp,'automatic Fighting melee does no damage');
      const ranged=await page.evaluate(()=>{
        G.EnemyMgr.clear();const p=G.Game.player;p.setActive(1);
        if(p.activeMove().id!=='ember')throw Error('Slot 2 must contain Ascuas');
        const e=new G.Enemy({dex:1,hp:5000,spd:0,dmg:0,xp:1,behavior:'chase'},p.x+120,p.y,{hp:1,spd:1,dmg:1});
        G.EnemyMgr.add(e);window.blazikenRangedTarget=e;
        const a=new G.Blaziken.Animator(),calls=[];
        const cv=document.createElement('canvas'),ctx=cv.getContext('2d');
        const draw=ctx.drawImage.bind(ctx);ctx.drawImage=(...args)=>{calls.push([args[0].src,args[1],args[2]]);return draw(...args);};
        a.play('Shoot');a.update(.2);a.draw(ctx,100,140);
        if(!calls[0][0].includes('mega-blaziken-extra'))throw Error('Ranged attack still uses melee atlas');
        a.once=false;a.loop('Walk');a.dir=4;a.draw(ctx,100,140);
        if(calls[1][2]!==1280)throw Error('Upward walk does not use rear-facing supplement');
        return {hp:e.hp};
      });
      await page.waitForTimeout(1400);
      assert.ok(await page.evaluate(()=>blazikenRangedTarget.hp)<ranged.hp,'automatic ranged attack does no damage');
      await page.screenshot({path:`/tmp/blaziken-ranged-${viewport.width}.png`});
      await page.evaluate(()=>{
        const p=G.Game.player;p.invuln=0;p.hurt(1);
        if(p.anim.cur!=='Hurt')throw Error('damage does not trigger Hurt');
        G.Progress.event('item',{id:'lifeorb'});G.Progress.kill({boss:true,types:['normal'],dex:19});
        G.onRescue(1,'Bulbasaur');G.onShinyCaught({dex:1,name:'Bulbasaur'});
      });
      await page.screenshot({path:`/tmp/blaziken-game-${viewport.width}.png`});
      await page.evaluate(()=>G.Game.quit());
      assert.deepEqual(await page.evaluate(()=>rankCalls),[]);
      assert.deepEqual(await page.evaluate(()=>saveCalls),[]);
      assert.equal(await page.evaluate(()=>JSON.stringify(G.DB.save)===previewSave),true,'preview changes save');
      assert.equal(await page.evaluate(()=>JSON.stringify({...localStorage})),initial,'preview changes storage');
      assert.match(await page.locator('#over-title').innerText(),/Mega Blaziken/);
      await page.locator('#btn-again').click();
      // Swampert regression: same menu, same equipped Mega, same level 2 Bulldoze.
      await page.evaluate(()=>G.Game.startRun());
      assert.equal(await page.evaluate(()=>G.Game.player.mega),'swampertite');
      assert.equal(await page.evaluate(()=>G.Game.player.activeMove().id),'bulldoze');
      assert.equal(await page.evaluate(()=>G.Game.player.activeMove().lvl),2);
      assert.equal(await page.evaluate(()=>G.Game.player.anim instanceof G.Blaziken.Animator),false);
      assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
      console.log(JSON.stringify({viewport,info,frames,automaticMelee:true,automaticRanged:true,rearWalk:true,input:true,saveIsolation:true,swampertRegression:true,errors}));
      await context.close();
    }
  }finally{
    if(browser)await browser.close();server.kill();
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
