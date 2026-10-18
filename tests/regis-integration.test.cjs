const {test}=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./helpers/boss-rush-fixture.cjs');
test('The opening trio has separate HP; partial kills grant no XP, heal or victory; full victory rewards once before Groudon',async()=>{
  const f=fixture(),{G}=f;await G.DB.ready();G.BossRushPreview.play();f.prepare();
  const p=G.Game.player,bs=G.BossRushPreview.bosses;
  assert.equal(bs.map(b=>b.dex).join(','),'377,378,379');assert.ok(bs.every(b=>b.hp===44000));
  p.hp=30;p.regenFlat=0;p.buffs.regen.n=0;p.onKill=()=>{};bs[0].hurt(1e10);bs[0].die();f.tick(60);
  assert.equal(G.BossRushPreview.stage,0);assert.equal(p.level,8);assert.equal(p.xp,0);assert.equal(p.hp,30);assert.equal(p.bonds,0);
  assert.ok(bs[1].hp>0&&bs[2].hp>0);assert.equal(G.BossRushPreview.boss.dex,378);
  bs[1].hurt(1e10);f.tick(60);assert.equal(G.BossRushPreview.stage,0);
  bs[2].hurt(1e10);f.tick(201);assert.equal(G.BossRushPreview.stage,1);assert.equal(G.BossRushPreview.boss.dex,383);
  assert.equal(p.level,10);assert.equal(p.hp,30+p.maxHp*.2);assert.equal(p.bonds,0);
  assert.deepEqual(f.storage,f.before);assert.equal(f.rankings(),0);
});
test('Trio clocks and bars pause together; rotation clamps every Regi and clears old marks/obstacles',async()=>{
  const f=fixture(),{G}=f;await G.DB.ready();G.BossRushPreview.play();f.prepare();f.tick(120);
  const e=G.BossRushPreview.encounter,bars=G.BossRushPreview.bars;
  G.Game.togglePause();const [clock,barClock]=[e.clock,bars.clock];f.tick(100);
  assert.equal(e.clock,clock);assert.equal(bars.clock,barClock);G.Game.togglePause();
  G.Camera.resize(360,720,2);G.Camera.resize(960,540,2);
  assert.equal(e.attacks.length,0);assert.equal(e.hazards.length,0);
  const r=G.Groudon.ARENA;for(const b of G.BossRushPreview.bosses){assert.ok(b.x>=16+r.left+b.r+6&&b.x<=16+r.right-b.r-6);assert.ok(b.y>=16+r.top+b.r+6&&b.y<=16+r.bottom-b.r-6);}
  assert.ok(G.Game.player.invuln>=1);G.Game.quit();f.back();assert.equal(G.BossRushPreview.bosses.length,0);assert.equal(G.BossRushPreview.bars,null);
});
