const {test}=require('node:test'),assert=require('node:assert/strict');
const {simulate}=require('../tools/benchmark-eon.cjs');
test('The whole Eon duo stays near one to two minutes for the native evolved Blaziken and normal Deoxys references',async()=>{
  for(const seed of [7,123,456])for(const options of [{},{playerDex:386,attack:'confusion'}]){
    const r=await simulate({seed,...options});assert.equal(r.dex,381);assert.equal(r.hp,190000);assert.equal(r.totalHp,380000);
    assert.equal(r.levelAtStart,14);assert.equal(r.choices,13);assert.ok(r.fused&&r.maxGold&&r.defeated);
    assert.ok(r.moves.every(m=>m.evolved));assert.ok(r.seconds>=50&&r.seconds<=125,JSON.stringify(r));
    assert.equal(r.mega,options.playerDex?null:'blazikenite');
  }
});
