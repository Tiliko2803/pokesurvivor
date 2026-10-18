const {test}=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./helpers/boss-rush-fixture.cjs');
async function setup({party=1}={}){
  const f=fixture(),{G}=f;G.BossRushRules.selectMinors=()=>{throw Error('The route must be fixed');};await G.DB.ready();
  const mates=Array.from({length:party-1},()=>({x:16,y:101,r:12,dead:true}));G.Game.everyone=()=>[G.Game.player,...mates];
  G.BossRushPreview.play();f.prepare();for(let i=0;i<4;i++){for(const b of G.BossRushPreview.bosses)b.hurt(1e12);f.tick(201);}return f;
}
test('Jirachi has scripted phases in the fixed minor slot, per-roster HP scaling and no native contact attacks',async()=>{
  for(const party of [1,4]){
    const f=await setup({party}),{G}=f,e=G.BossRushPreview.encounter,b=G.BossRushPreview.boss;
    assert.equal(b.dex,385);assert.equal(e.id,'jirachi');assert.equal(b.maxHp,G.Jirachi.hpForStage(4)*party);
    assert.equal(b.rushMinor,true);assert.equal(b.rushBoss,false);assert.equal(b.rushScripted,true);assert.equal(b.touchCd,999);
    assert.equal(G.World.arena.type,'flying');b.hp=b.maxHp*.7;f.tick(1);assert.equal(e.phase,2);assert.equal(e.cadence.limit,2);
    b.hp=b.maxHp*.35;f.tick(1);assert.equal(e.phase,3);assert.equal(e.cadence.limit,2);assert.equal(G.Game.player.bonds,0);
    assert.deepEqual(f.storage,f.before);assert.equal(f.rankings(),0);
  }
});
test('Jirachi grants one six-level XP reward and one 20% heal, without a Bond or account writes',async()=>{
  const f=await setup(),{G}=f,p=G.Game.player,b=G.BossRushPreview.boss,level=p.level;
  p.hp=30;p.regenFlat=0;p.buffs.regen.n=0;p.onKill=()=>{};const offer=G.LevelUp.offer;
  G.LevelUp.offer=pl=>{for(let i=0;i<100;i++){const c=offer(pl,100).find(c=>c.key==='stat:atk');if(c)return [c];}throw Error('No legal reward card');};
  const drops=[],drop=G.Pickups.dropXp;G.Pickups.dropXp=(...args)=>{drops.push(args);return drop(...args);};
  b.hurt(1e12);b.die();f.tick(201);assert.equal(G.BossRushPreview.stage,5);assert.equal(G.BossRushPreview.boss.dex,384);
  assert.equal(p.level,level+6);assert.equal(drops.length,1);assert.equal(drops[0][2],b.xp);assert.equal(p.hp,30+p.maxHp*.2);assert.equal(p.bonds,0);
  assert.deepEqual(f.storage,f.before);assert.equal(f.rankings(),0);
});
test('Native pause freezes Jirachi; rotating retires all old marks and quitting restores the original session',async()=>{
  const f=await setup(),{G}=f,p=G.Game.player,e=G.BossRushPreview.encounter;
  p.hurt=()=>{};G.Combat.tick=()=>{};f.tick(100);assert.ok(e.attacks.length);
  G.Game.togglePause();const snapshot=JSON.stringify(e);f.tick(100);assert.equal(JSON.stringify(e),snapshot);G.Game.togglePause();
  G.Camera.resize(360,720,2);G.Camera.resize(960,540,2);assert.equal(e.attacks.length,0);assert.ok(e.schedules.every(m=>m.readyAt>e.clock));
  assert.ok(p.invuln>=1);G.Game.quit();f.back();assert.equal(G.BossRushPreview.encounter,null);assert.deepEqual(f.storage,f.before);assert.equal(f.rankings(),0);
});
