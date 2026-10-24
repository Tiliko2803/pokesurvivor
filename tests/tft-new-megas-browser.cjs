'use strict';
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const {spawn}=require('node:child_process'),fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),port=8896;
(async()=>{
 const server=spawn('python',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});let browser;
 try{
  for(let i=0;i<40;i++){try{await fetch(`http://127.0.0.1:${port}/`);break;}catch{await new Promise(r=>setTimeout(r,100));}}
  const runtime=process.env.CHROMIUM_PACKAGE?(await import(process.env.CHROMIUM_PACKAGE)).default:null;
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,
   args:runtime?runtime.args.filter(a=>!['--single-process','--in-process-gpu'].includes(a)):['--no-sandbox','--disable-dev-shm-usage']});
  for(const config of [{url:'/index.html',viewport:{width:1100,height:720}},{url:'/dev/',viewport:{width:390,height:844}}]){
   const portrait=config.viewport.width<config.viewport.height;
   const context=await browser.newContext({viewport:portrait?{width:844,height:390}:config.viewport,locale:'es-MX',serviceWorkers:'block'});
   const page=await context.newPage(),errors=[],missing=[];page.setDefaultTimeout(20000);
   page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()===404)missing.push(r.url());});
   await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
   await page.addInitScript(()=>{
    const deck=[152,4,7,172,92,280,529,246,374,661];localStorage.setItem('ps.tft.decks.v1',JSON.stringify([deck,deck,deck]));
   });
   await page.goto(`http://127.0.0.1:${port}${config.url}`);
   await page.waitForFunction(()=>window.G?.TFTUI&&document.getElementById('boot').classList.contains('hidden'));
   await page.evaluate(()=>{document.getElementById('tap-start').classList.add('hidden');G.DB.playAsGuest();G.DB.save.partner=4;G.Flow.goMenu();G.TFTUI.open();});
   await page.locator('#tft-deck-start').click();await page.setViewportSize(config.viewport);
   const ranks=await page.evaluate(()=>{
    const E=G.TFT,s=G.TFTUI.state;s.gold=10000;s.level=6;
    for(const family of [529,152])for(let i=0;i<45;i++){s.shop=[family];if(!E.buy(s,0))throw Error('Purchase rejected');}
    for(const [i,u] of s.units.entries())E.place(s,u.id,20+i);
    s.shop=[7];E.buy(s,0);E.place(s,s.units.find(u=>u.dex===7).id,22);
    s.opponent=[{id:-1,dex:7,star:1,pos:8},{id:-2,dex:7,star:1,pos:9},{id:-3,dex:7,star:1,pos:14}];s.opponentRound=s.round;
    G.TFTUI.open();return s.units.filter(u=>E.isMega(u)).map(u=>({name:E.nameFor(u),rank:E.rankLabel(u),copies:E.unitCopies(u)}));
   });
   assert.deepEqual(ranks,[{name:'Mega Excadrill',rank:'Iridio ★',copies:45},{name:'Mega Meganium',rank:'Iridio ★',copies:45}]);
   await page.waitForFunction(()=>[530,154].every(d=>G.SurvivorMegas.pack(d).ready()));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.locator('#tft-fight').click();await page.locator('#tft-pause').click();
   const flags=await page.evaluate(()=>{
    const E=G.TFT,s=G.TFTUI.state,b=s.battle,a=b.units.find(u=>u.dex===530&&u.side===0),m=b.units.find(u=>u.dex===154&&u.side===0);
    for(const u of b.units){u.cooldown=u.moveCD=99;u.hp=u.maxHp=50000;}
    a.x=2;a.y=4;m.x=3;m.y=4;const foe=b.units.find(u=>u.id===-1);foe.x=2;foe.y=1;
    E.cast(b,a,foe);E.cast(b,m,foe);
    localStorage.setItem('ps.tft.match.v1',E.serialize(s));
    return {warning:b.events.some(e=>e.kind==='drillWarning'),rays:b.events.filter(e=>e.kind==='solarRay').length,garden:m.gardenTicks,save:!!E.restore(E.serialize(s))};
   });
   assert.deepEqual(flags,{warning:true,rays:4,garden:4,save:true});
   await page.waitForTimeout(120);
   fs.writeFileSync(`/tmp/tft-new-megas-${config.viewport.width}.png`,Buffer.from(await page.locator('#tft-board').evaluate(cv=>cv.toDataURL().split(',')[1]),'base64'));
   await page.reload();await page.waitForFunction(()=>window.G?.TFTUI&&document.getElementById('boot').classList.contains('hidden'));
   await page.evaluate(()=>{document.getElementById('tap-start').classList.add('hidden');G.TFTUI.open();});
   const resumed=await page.evaluate(()=>{
    const s=G.TFTUI.state,a=s.battle.units.find(u=>u.dex===530&&u.side===0),m=s.battle.units.find(u=>u.dex===154&&u.side===0);
    return {phase:s.phase,pending:a.megaDrillDx!==undefined,garden:m.gardenTicks};
   });
   assert.deepEqual(resumed,{phase:'combat',pending:true,garden:4});
   assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);console.log('PASS TFT new Megas',config.url,config.viewport.width);await context.close();
  }
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
