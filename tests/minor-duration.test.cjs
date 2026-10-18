const {test}=require('node:test'),assert=require('node:assert/strict');
const {simulate,STAGES}=require('../tools/benchmark-minors.cjs');
test('The four later minor encounters retain their 1–2 minute Blaziken reference after the opening trio',async()=>{
  const levels=[14,18,26,30];
  for(const [i,stage]of STAGES.entries())for(const build of ['power','rapid'])for(const seed of [7,123,456]){
    const r=await simulate({stage,build,seed});
    assert.equal(r.dex,385);assert.equal(r.levelAtStart,levels[i]);assert.equal(r.choices,r.levelAtStart-1);
    assert.equal(r.mega,'blazikenite');assert.equal(r.maxGold,true);assert.equal(r.defeated,true);
    assert.equal(r.fused,true);assert.equal(r.phase,null);
    assert.ok(r.seconds>=60&&r.seconds<=120,JSON.stringify({stage,...r}));
  }
});
test('Minors retain type advantage and reward attacking more; health is fixed instead of enforcing a timer',async()=>{
  const neutral=await simulate({stage:3,uptime:.85});
  const faster=await simulate({stage:3,uptime:1});
  const resisted=await simulate({stage:3,minorDex:386,uptime:.85});
  assert.equal(neutral.hp,faster.hp);assert.equal(resisted.hp,neutral.hp);
  assert.ok(faster.seconds<neutral.seconds);assert.ok(resisted.seconds>neutral.seconds);
});
