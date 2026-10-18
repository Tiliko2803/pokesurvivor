const {test}=require('node:test'),assert=require('node:assert/strict');
const {simulate}=require('../tools/benchmark-regis.cjs');
test('The full trio takes 1–2 minutes with normal Deoxys; Mega Blaziken retains its offensive advantage',async()=>{
  for(const seed of [7,123,456]){
    const normal=await simulate({seed,playerDex:386,attack:'confusion'}),mega=await simulate({seed});
    assert.equal(normal.mega,null);assert.equal(normal.levelAtStart,8);assert.equal(normal.choices,7);
    assert.equal(normal.totalHp,132000);assert.equal(normal.defeated,true);assert.equal(normal.fused,false);
    assert.ok(normal.seconds>=60&&normal.seconds<=120,JSON.stringify(normal));
    assert.equal(mega.totalHp,normal.totalHp);assert.equal(mega.defeated,true);assert.ok(mega.seconds<normal.seconds);
  }
});
