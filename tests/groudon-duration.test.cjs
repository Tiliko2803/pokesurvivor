const { test } = require('node:test'), assert = require('node:assert/strict');
const { simulate } = require('../tools/benchmark-groudon.cjs');

test('Level-8 reference builds finish with seven preparation cards and max gold upgrades',async()=>{
  for (const build of ['melee','dance']) for (const seed of [7,123,456]) {
    const result=await simulate({build,seed,uptime:0.85});
    assert.equal(result.mega,'blazikenite'); assert.equal(result.maxGold,true);
    assert.equal(result.levelAtStart,8); assert.equal(result.choices,7);
    assert.equal(result.defeated,true); assert.equal(result.phase,3);
    assert.ok(result.seconds>=180 && result.seconds<=360,JSON.stringify(result));
  }
});
test('Better attack uptime wins sooner: Groudon has no minimum-time shield',async()=>{
  const fast=await simulate({build:'dance',uptime:1});
  const dodge=await simulate({build:'dance',uptime:0.75});
  assert.equal(fast.hp,dodge.hp);assert.equal(fast.defeated,true);assert.equal(dodge.defeated,true);
  assert.ok(fast.seconds<180);assert.ok(dodge.seconds>fast.seconds+30);
});
