const {test}=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./helpers/boss-rush-fixture.cjs');
function setup(dex=959){
 const f=fixture('real-account',{live:true}),{G}=f;f.load('js/systems/mega-evolution.js');
 G.Blaziken.ready=()=>true;
 G.DB.playAsGuest();const s=G.DB.save;s.partner=dex;s.owned[dex]={at:1};s.megaStones[G.Mega.definition(dex).id]=1;
 G.Mega.equip(s,dex,true);return f;
}
test('Solo intros run for every playable Mega and do not touch stats, HP or moves',()=>{
 for(const dex of [260,257,959]){
  const f=setup(dex),{G}=f;G.Game.startRun();const p=G.Game.player;
  const before=JSON.stringify({hp:p.hp,maxHp:p.maxHp,atk:p.atk,spd:p.baseSpd,moves:p.moves.map(({id,lvl,dmg,cd})=>({id,lvl,dmg,cd})),mega:p.mega});
  assert.equal(G.MegaEvolution.active,true);assert.equal(G.MegaEvolution.state().phase,'awaken');
  p.invuln=0;p.hurt(99999,null,true);assert.equal(p.hp,p.maxHp,'the transformation protects against asynchronous hits too');
  f.tick(50);assert.equal(G.Game.st.time,0);assert.equal(G.EnemyMgr.all().length,0);assert.equal(p.megaElapsed,0);assert.ok(p.moves.every(m=>m.t===0));
  f.tick(95);assert.equal(G.MegaEvolution.active,false);
  assert.equal(JSON.stringify({hp:p.hp,maxHp:p.maxHp,atk:p.atk,spd:p.baseSpd,moves:p.moves.map(({id,lvl,dmg,cd})=>({id,lvl,dmg,cd})),mega:p.mega}),before);
  f.tick(3);assert.ok(G.Game.st.time>0);
 }
});
test('Cinematic phases and callbacks fire exactly once even when a frame crosses several boundaries',()=>{
 const f=setup(),{G}=f;G.Game.startRun();const p=G.Game.player;G.MegaEvolution.reset();let reveals=0,ends=0;
 const sounds=[];G.Audio.sfx=n=>sounds.push(n);
 assert.equal(G.MegaEvolution.begin(p,{onReveal:()=>reveals++,onComplete:()=>ends++}),true);
 assert.equal(G.MegaEvolution.begin(p),false);G.MegaEvolution.tick(.48);
 assert.equal(G.MegaEvolution.state().phase,'cocoon');G.MegaEvolution.tick(.83);
 assert.equal(G.MegaEvolution.state().phase,'reveal');assert.equal(reveals,1);
 G.MegaEvolution.tick(9);G.MegaEvolution.tick(9);assert.equal(ends,1);assert.equal(reveals,1);
 assert.deepEqual(sounds,['mega-awaken','mega-charge','mega-break']);assert.equal(G.MegaEvolution.begin(p),false);
});
test('Pausing, cancellation, a new run and normal partners keep their existing flow',()=>{
 const f=setup(),{G}=f;G.Game.startRun();f.tick(10);G.Game.togglePause();const t=G.MegaEvolution.state().time;
 f.tick(60);assert.equal(G.MegaEvolution.state().time,t);assert.equal(G.Game.st.time,0);
 G.Game.togglePause();f.tick(10);assert.ok(G.MegaEvolution.state().time>t);
 G.Game.toUI();assert.equal(G.MegaEvolution.active,false);G.Game.startRun();assert.equal(G.MegaEvolution.active,true);
 G.Game.toUI();G.Mega.equip(G.DB.save,959,false);G.Game.startRun();assert.equal(G.MegaEvolution.active,false);
 f.tick(5);assert.ok(G.Game.st.time>0);
});
test('Boss Rush preparation waits before the intro; cinematic time never advances boss attacks',()=>{
 const f=setup(260),{G}=f;G.BossRush.play();assert.equal(G.Game.state,'paused');
 const t=G.MegaEvolution.state().time;f.tick(60);assert.equal(G.MegaEvolution.state().time,t);
 f.prepare();f.tick(60);assert.equal(G.BossRush.encounter.clock,0);assert.equal(G.Game.st.time,0);
 f.tick(100);assert.ok(G.BossRush.encounter.clock>0);
});
test('Live group battles never get an unsynchronized local pause; reset retires callbacks',()=>{
 const f=setup(),{G}=f;G.Game.startRun();const p=G.Game.player;G.MegaEvolution.reset();G.Coop.active=true;
 assert.equal(G.MegaEvolution.begin(p),false);G.Coop.active=false;let done=0;
 G.MegaEvolution.begin(p,{onReveal:()=>done++,onComplete:()=>done++});G.MegaEvolution.reset();G.MegaEvolution.tick(10);
 assert.equal(done,0);assert.equal(G.MegaEvolution.owns(p),false);
});
test('A cold sprite cache waits inside the cocoon and resumes; a failed load cannot trap the run',()=>{
 const f=setup(257),{G}=f;G.Blaziken.ready=()=>false;G.Blaziken.failed=()=>false;
 G.Game.startRun();G.MegaEvolution.tick(1.4);assert.equal(G.MegaEvolution.state().revealed,false);
 assert.equal(G.MegaEvolution.state().phase,'cocoon');assert.equal(G.Game.st.time,0);
 G.Blaziken.ready=()=>true;G.MegaEvolution.tick(.1);assert.equal(G.MegaEvolution.state().revealed,true);
 G.MegaEvolution.reset();G.Blaziken.ready=()=>false;G.MegaEvolution.begin(G.Game.player);
 for(let i=0;i<450;i++)G.MegaEvolution.tick(1/60);
 assert.equal(G.MegaEvolution.active,false,'loading has a bounded wait');
});
