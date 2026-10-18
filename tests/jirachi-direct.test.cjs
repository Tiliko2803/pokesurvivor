const {test}=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./helpers/boss-rush-fixture.cjs');
test('The direct Jirachi button spawns only Jirachi, freezes all 24 preparation choices and offers native Bonds',async()=>{
  const f=fixture(),{G}=f;await G.DB.ready();G.BossRushPreview.open();
  const born=[],add=G.EnemyMgr.add.bind(G.EnemyMgr);G.EnemyMgr.add=b=>{born.push(b.dex);return add(b);};
  f.nodes.get('rush-jirachi').onclick();const p=G.Game.player,e=G.BossRushPreview.encounter;
  assert.equal(G.BossRushPreview.stage,4);assert.equal(e.id,'jirachi');assert.deepEqual(born,[385]);assert.equal(p.level,25);assert.equal(p.bonds,2);
  assert.equal(G.Game.state,'paused');f.tick(60);assert.equal(e.clock,0);assert.equal(G.BossRushPreview.preparing,true);
  assert.equal(f.prepare(),24);assert.equal(G.Game.state,'playing');assert.equal(p.hp,p.maxHp);
  f.tick(3);assert.ok(p.activeGroup().length>=2);assert.deepEqual(f.storage,f.before);assert.equal(f.rankings(),0);
});
test('Defeating Jirachi ends the direct test without spawning Rayquaza; retrying the full route starts at level eight',async()=>{
  const f=fixture(),{G}=f;await G.DB.ready();G.BossRushPreview.open();f.nodes.get('rush-jirachi').onclick();f.prepare();
  const born=[],add=G.EnemyMgr.add.bind(G.EnemyMgr);G.EnemyMgr.add=b=>{born.push(b.dex);return add(b);};
  G.BossRushPreview.boss.hurt(1e12);f.tick(240);
  assert.equal(G.Game.state,'over');assert.equal(G.BossRushPreview.stage,4);assert.deepEqual(born,[]);
  assert.equal(f.nodes.get('over-title').textContent,'¡Jirachi derrotado!');assert.equal(f.result().coins,0);assert.equal(f.result().record,false);
  f.back();G.BossRushPreview.play();assert.equal(G.BossRushPreview.stage,0);assert.equal(G.Game.player.level,8);assert.equal(G.Game.player.bonds,0);
  assert.equal(f.prepare(),7);assert.deepEqual(f.storage,f.before);assert.equal(f.rankings(),0);
});
test('Direct testing validates the selected attacks before starting',async()=>{
  const f=fixture(),{G}=f;await G.DB.ready();G.BossRushPreview.open();
  f.nodes.get('rush-move-2').value=f.nodes.get('rush-move-1').value;f.nodes.get('rush-jirachi').onclick();
  assert.equal(G.Game.state,'ui');assert.equal(G.BossRushPreview.running,false);assert.match(f.nodes.get('rush-error').textContent,/distintos/);
});
