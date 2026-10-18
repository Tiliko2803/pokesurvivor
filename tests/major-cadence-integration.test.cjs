const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {fixture}=require('./helpers/boss-rush-fixture.cjs');
test('The preview connects independent clocks only to the three majors and preserves the group coordinators',async()=>{
  const f=fixture(),{G}=f;await G.DB.ready();G.BossRushPreview.play();f.prepare();
  for(let stage=0;stage<7;stage++){
    const e=G.BossRushPreview.encounter;
    if([1,3,6].includes(stage)){assert.ok(e.cadence);assert.equal(e.schedules.length,4);}
    else if(e){assert.equal(e.cadence,undefined);assert.ok(['regis','eon'].includes(e.id));}
    for(const b of G.BossRushPreview.bosses)b.hurt(1e12);f.tick(201);
  }
  assert.equal(G.Game.state,'over');assert.deepEqual(f.storage,f.before);assert.equal(f.rankings(),0);
  const html=fs.readFileSync(path.join(__dirname,'../dev/index.html'),'utf8');
  assert.ok(html.indexOf('dev/major-cadence.js')<html.indexOf('dev/boss-rush-preview.js'));
  const official=fs.readFileSync(path.join(__dirname,'../dev.html'),'utf8');assert.ok(!official.includes('major-cadence'));
});
test('Native pause and rotation freeze or retire every independent major timer and keep safe restart delays',async()=>{
  const f=fixture(),{G}=f;await G.DB.ready();G.BossRushPreview.play();f.prepare();
  for(const b of G.BossRushPreview.bosses)b.hurt(1e12);f.tick(201);
  const e=G.BossRushPreview.encounter;
  G.Game.player.hurt=()=>{};G.Combat.tick=()=>{};f.tick(120);
  G.Game.togglePause();const snapshot=JSON.stringify(e);f.tick(100);assert.equal(JSON.stringify(e),snapshot);G.Game.togglePause();
  G.Camera.resize(360,720,2);G.Camera.resize(960,540,2);
  assert.equal(e.attacks.length,0);assert.equal(e.hazards.length,0);assert.ok(e.schedules.every(m=>m.readyAt>e.clock));
  assert.ok(G.Game.player.invuln>=1);const clock=e.clock;f.tick(30);assert.equal(e.attacks.length,0);assert.ok(e.clock>clock);
  G.Game.quit();f.back();assert.deepEqual(f.storage,f.before);assert.equal(f.rankings(),0);
});
