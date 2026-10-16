'use strict';
// Real dev-page, asset decoding, automatic melee damage, touch/keyboard and save isolation.
// CHROMIUM_PATH=/path/to/chrome node tests/mega-blaziken-browser.cjs
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');
const root=path.join(__dirname,'..');
const port=8874;
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
      await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
      await page.goto(`http://127.0.0.1:${port}/`);
      await page.waitForFunction(()=>window.G?.DB?.mode==='local'&&document.getElementById('boot').classList.contains('hidden'));
      await page.evaluate(async()=>{
        await G.DB.register('LiveBlaziken','123456');G.DB.grant(257,'starter');G.DB.grant(260,'test');
        G.DB.save.partner=257;G.DB.commit(true);G.Flow.goMenu();document.getElementById('tap-start').classList.add('hidden');
      });
      assert.match(await page.locator('#menu-mega').innerText(),/Blazikenita/);
      assert.equal(await page.locator('#menu-mega button').isDisabled(),true);
      await page.evaluate(()=>G.Game.startRun());
      assert.equal(await page.evaluate(()=>G.Game.player.mega),null);
      await page.evaluate(()=>{G.Game.player.bosses=3;G.Game.quit();});
      assert.match(await page.locator('#scr-over').innerText(),/Blazikenita/);
      await page.locator('#btn-again').click();
      await page.locator('#menu-mega button').click();
      assert.match(await page.locator('#menu-mega button').innerText(),/Mega equipada/);
      await page.reload();
      await page.waitForFunction(()=>G.DB.save?.partner===257&&document.getElementById('boot').classList.contains('hidden'));
      await page.evaluate(()=>{G.Flow.goMenu();document.getElementById('tap-start').classList.add('hidden');});
      assert.equal(await page.evaluate(()=>G.Mega.equipped(G.DB.save,257)),true);
      await page.evaluate(()=>G.Game.startRun());
      await page.waitForFunction(()=>G.Blaziken.ready()&&G.Blaziken.extraReady());
      assert.equal(await page.evaluate(()=>G.Game.player.moves.length),1,'must not grant a free ranged attack');
      assert.equal(await page.evaluate(()=>G.Game.player.moves[0].id),'karate-chop');
      assert.equal(await page.evaluate(()=>G.Game.player.moves[0].lvl),2);
      await page.evaluate(()=>{G.Game.quit();G.DB.save.pupg[257]={moves:1};G.DB.save.prepertoire={257:'ember'};});
      await page.locator('#btn-again').click();
      await page.evaluate(()=>G.Game.startRun());
      assert.deepEqual(await page.evaluate(()=>G.Game.player.moves.map(m=>m.id)),['karate-chop','ember']);
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
      const attackImpulse=await page.evaluate(()=>{
        const levels=G.Upgrades.perks({cd:8});
        const card=G.LevelUp.STATS.find(s=>s.id==='cd');
        const first=new G.Player(G.Mega.form(G.DEX_BY[257],G.DB.save),levels);
        const second=new G.Player(G.Mega.form(G.DEX_BY[257],G.DB.save),levels);
        const normal=new G.Player(G.DEX_BY[257],levels);
        const swampert=new G.Player({...G.DEX_BY[260],megaStone:'swampertite'},levels);
        const move=G.Moves.instance('karate-chop',1);
        for(let i=0;i<10;i++)card.apply(first);
        const before=first.cooldownFor(move),cardsMultiplier=first.cdMul;
        const steps=[0,29.99,30,60,90,120,150,600].map(t=>{first.megaElapsed=t;return first.attackSpeed;});
        first.megaElapsed=150;
        second.megaElapsed=150;
        for(let i=0;i<10;i++){card.apply(second);card.apply(normal);card.apply(swampert);}
        const after=first.cooldownFor(move);
        if(Math.abs(second.cooldownFor(move)-after)>1e-12)throw Error('Card/Impulso order changes final rate');
        if(Math.abs(normal.cooldownFor(move)-before)>1e-12||Math.abs(swampert.cooldownFor(move)-before)>1e-12)throw Error('Other Pokémon gained Blaziken attack speed');
        // Exercise the actual combat scheduler, not only the stat getter.
        first.addMove('karate-chop');const active=first.activeMove();active.t=0;
        first.target={x:first.x+10,y:first.y};
        G.Combat.tick(0,first,0);
        if(Math.abs(active.t-after)>1e-12)throw Error('Combat does not use final Impulso cooldown');
        if(first.cdMul!==cardsMultiplier)throw Error('Impulso consumed or rewrote card modifiers');
        first.cdMul=.00001;
        const atFloor=first.cooldownFor(move);
        // A fresh run/player starts at zero stacks, and later modifiers stay inside the final factor.
        const fresh=new G.Player(G.Mega.form(G.DEX_BY[257],G.DB.save),levels);
        second.cdMul*=.8;
        const extraModifier=second.cooldownFor(move);
        const extraExpected=Math.max(.05,move.cd*cardsMultiplier*.8)/1.3;
        if(Math.abs(extraModifier-extraExpected)>1e-12)throw Error('Later modifier bypasses final factor');
        const orbit=G.Moves.ALL.find(m=>m.kind==='orbit');
        first.addMove(orbit.id);first.setActive(1);first.megaElapsed=0;
        G.Combat.tick(0,first,0);
        const orb=G.Projectiles.all().find(p=>p.owner===first&&p.orb);
        const orbitBefore=orb.rehit;first.megaElapsed=150;
        G.Combat.tick(0,first,0);
        if(Math.abs(orbitBefore/orb.rehit-1.3)>1e-12)throw Error('Existing orbit does not gain final attack factor');
        G.Projectiles.clearOrbs(first);
        return {steps,before,after,ratio:before/after,atFloor,fresh:fresh.attackSpeed,orbit:true};
      });
      assert.deepEqual(attackImpulse.steps,[1,1,1.06,1.12,1.18,1.24,1.3,1.3]);
      assert.ok(Math.abs(attackImpulse.ratio-1.3)<1e-12);
      assert.ok(Math.abs(attackImpulse.atFloor-.05/1.3)<1e-12);
      assert.equal(attackImpulse.fresh,1);
      // Restore default cooldown on the run player after independent stat checks.
      await page.evaluate(()=>{G.Game.player.megaElapsed=0;G.EnemyMgr.clear();});
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
      await page.evaluate(()=>{const p=G.Game.player;p.invuln=0;p.hurt(1);if(p.anim.cur!=='Hurt')throw Error('Hurt animation missing');G.Game.quit();});
      await page.locator('#btn-again').click();
      await page.evaluate(()=>{G.DB.save.partner=260;G.DB.save.megaStones.swampertite=1;G.Mega.equip(G.DB.save,260,true);G.Game.startRun();});
      assert.equal(await page.evaluate(()=>G.Game.player.moves[0].id),'bulldoze');
      assert.equal(await page.evaluate(()=>G.Game.player.moves[0].lvl),2);
      assert.equal(await page.evaluate(()=>G.Game.player.anim instanceof G.Blaziken.Animator),false);
      assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
      console.log(JSON.stringify({viewport,mission:true,equipReload:true,repertoire:true,attackImpulse,melee:true,ranged:true,swampert:true,errors}));
      await context.close();
    }
  }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
