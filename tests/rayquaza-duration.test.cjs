const {test}=require('node:test'),assert=require('node:assert/strict');
const {simulate}=require('../tools/benchmark-rayquaza.cjs');
test('Final Rayquaza uses the level-34 evolved Blaziken build after seven encounter victories',async()=>{
  for(const build of ['power','rapid'])for(const seed of [7,123,456]){
    const r=await simulate({build,seed,uptime:.85});
    assert.equal(r.dex,384);assert.equal(r.hp,5000000);assert.equal(r.levelAtStart,34);assert.equal(r.choices,33);
    assert.equal(r.mega,'blazikenite');assert.equal(r.maxGold,true);assert.equal(r.fused,true);
    assert.ok(r.moves.every(m=>m.evolved));assert.equal(r.defeated,true);assert.equal(r.phase,3);
    assert.ok(r.seconds>=120&&r.seconds<=240,JSON.stringify(r));
  }
});
