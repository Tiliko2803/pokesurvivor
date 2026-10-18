const {test}=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./helpers/boss-rush-fixture.cjs');
test('The Eon duo follows Groudon; partial kills give nothing, full victory pays six base levels once and leads to Kyogre',async()=>{
  const f=fixture(),{G}=f;await G.DB.ready();G.BossRushPreview.play();f.prepare();
  for(let i=0;i<2;i++){for(const b of G.BossRushPreview.bosses)b.hurt(1e12);f.tick(201);}
  const p=G.Game.player,bs=G.BossRushPreview.bosses,e=G.BossRushPreview.encounter;
  assert.equal(e.id,'eon');assert.equal(bs.map(b=>b.dex).join(','),'381,380');assert.equal(p.level,13);assert.ok(bs.every(b=>b.hp===190000));
  const xp=p.xp;p.hp=30;p.regenFlat=0;p.buffs.regen.n=0;p.onKill=()=>{};bs[0].hurt(1e12);bs[0].die();f.tick(60);
  assert.equal(G.BossRushPreview.stage,2);assert.equal(p.level,13);assert.equal(p.xp,xp);assert.equal(p.hp,30);assert.equal(p.bonds,0);assert.equal(e.finished,false);
  G.Game.togglePause();const clock=e.clock,barClock=G.BossRushPreview.bars.clock;f.tick(100);assert.equal(e.clock,clock);assert.equal(G.BossRushPreview.bars.clock,barClock);G.Game.togglePause();
  G.Camera.resize(360,720,2);G.Camera.resize(960,540,2);assert.equal(e.attacks.length,0);assert.ok(e.schedules.every(m=>m.readyAt>e.clock));
  const offer=G.LevelUp.offer;G.LevelUp.offer=pl=>{for(let i=0;i<100;i++){const card=offer(pl,100).find(c=>c.key==='stat:atk');if(card)return [card];}throw Error('Legal reward card unavailable');};
  bs[1].hurt(1e12);bs[1].die();f.tick(201);
  assert.equal(G.BossRushPreview.stage,3);assert.equal(G.BossRushPreview.boss.dex,382);assert.equal(p.level,19);assert.equal(p.hp,30+p.maxHp*.2);assert.equal(p.bonds,0);
  assert.deepEqual(f.storage,f.before);assert.equal(f.rankings(),0);
});
