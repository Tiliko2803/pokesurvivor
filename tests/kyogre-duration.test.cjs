const {test}=require('node:test'),assert=require('node:assert/strict');
const {simulate}=require('../tools/benchmark-kyogre.cjs');
test('Kyogre withstands evolved Aura Sphere and Swords Dance, max gold and a native Bond',async()=>{
  for(const build of ['power','rapid'])for(const seed of [7,123,456]){
    const r=await simulate({build,seed,uptime:.85});
    assert.equal(r.hp,2500000);assert.equal(r.maxGold,true);assert.equal(r.mega,'blazikenite');
    assert.equal(r.levelAtStart,19);assert.equal(r.choices,18);assert.equal(r.fused,true);
    assert.equal(r.moves[0].name,'Onda Certera');assert.equal(r.moves[1].name,'Danza de Mil Espadas');
    assert.ok(r.moves.every(m=>m.evolved));assert.equal(r.defeated,true);assert.equal(r.phase,3);
    assert.ok(r.seconds>=150&&r.seconds<=250,JSON.stringify(r));
  }
});
test('Kyogre has fixed HP and rewards better attack uptime with an earlier victory',async()=>{
  const fast=await simulate({uptime:1}),dodge=await simulate({uptime:.75});
  assert.equal(fast.hp,dodge.hp);assert.ok(fast.defeated&&dodge.defeated);
  assert.ok(dodge.seconds>fast.seconds+35);
});
