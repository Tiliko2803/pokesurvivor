const {test}=require('node:test'),assert=require('node:assert/strict');
const {simulate,STAGES}=require('../tools/benchmark-minors.cjs');
test('The active minor reference is fixed to Jirachi and retains its fixed HP across attack uptimes',async()=>{
  assert.deepEqual(STAGES,[4]);
  const normal=await simulate({stage:4}),faster=await simulate({stage:4,uptime:1});
  assert.equal(normal.dex,385);assert.equal(normal.hp,600000);assert.equal(normal.levelAtStart,25);
  assert.equal(normal.hp,faster.hp);assert.ok(normal.defeated&&faster.defeated);assert.ok(faster.seconds<normal.seconds);
});
test('A reserved Deoxys cannot be injected as an active encounter by the benchmark',async()=>{
  await assert.rejects(simulate({stage:4,minorDex:386}),/Only Jirachi/);
});
