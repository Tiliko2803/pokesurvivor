const {test}=require('node:test'),assert=require('node:assert/strict');
const {simulate}=require('../tools/benchmark-jirachi.cjs');
test('Jirachi remains playable for normal Deoxys; Mega Blaziken retains its faster matchup instead of forcing a timer',async()=>{
  for(const stage of [4])for(const seed of [7,123,456]){
    const normal=await simulate({stage,seed,playerDex:386,attack:'confusion'}),mega=await simulate({stage,seed});
    for(const r of [normal,mega]){
      assert.equal(r.hp,600000);assert.equal(r.dex,385);assert.equal(r.levelAtStart,25);
      assert.equal(r.choices,r.levelAtStart-1);assert.ok(r.maxGold&&r.fused&&r.defeated);assert.ok(r.moves.every(m=>m.evolved));assert.equal(r.phase,3);
    }
    assert.equal(normal.mega,null);assert.equal(mega.mega,'blazikenite');
    assert.ok(normal.seconds>=80&&normal.seconds<=130,JSON.stringify(normal));assert.ok(mega.seconds>=18&&mega.seconds<=40,JSON.stringify(mega));
    assert.ok(normal.seconds>mega.seconds*2);
  }
});
