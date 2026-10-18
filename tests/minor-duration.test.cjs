const {test}=require('node:test'),assert=require('node:assert/strict');
const {simulate,STAGES}=require('../tools/benchmark-minors.cjs');
test('The remaining native Deoxys encounters retain their fixed budgets, legal progression and original patterns',async()=>{
  for(const [i,stage]of STAGES.entries())for(const build of ['power','rapid']){
    const r=await simulate({stage,minorDex:386,build});
    assert.equal(r.dex,386);assert.equal(r.hp,i===0?2400000:3600000);assert.equal(r.levelAtStart,i===0?25:29);
    assert.equal(r.choices,r.levelAtStart-1);assert.equal(r.mega,'blazikenite');assert.ok(r.maxGold&&r.fused&&r.defeated);assert.equal(r.phase,null);
  }
});
test('Fixed-health matchup references preserve type advantage and reward better attack uptime',async()=>{
  const neutral=await simulate({stage:5}),faster=await simulate({stage:5,uptime:1});
  const resisted=await simulate({stage:5,minorDex:386,hp:neutral.hp});
  assert.equal(neutral.hp,faster.hp);assert.equal(resisted.hp,neutral.hp);
  assert.ok(faster.seconds<neutral.seconds);assert.ok(resisted.seconds>neutral.seconds);
});
