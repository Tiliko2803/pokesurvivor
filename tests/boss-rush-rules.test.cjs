const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),ctx=vm.createContext({G:{}});
for(const file of ['js/data/pokedex.js','js/data/sprites-meta.js','js/entities/player.js','dev/boss-rush-rules.js'])
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const {G}=ctx,R=G.BossRushRules;
test('Todos los mayores acordados, protagonistas DLC y personajes custom quedan fuera',()=>{
  for(const dex of [150,249,250,382,383,384,483,484,487,493,643,644,646,716,717,718,791,792,800,888,889,890,892,898,1007,1008,1017,1024,10001,10002])
    assert.equal(R.eligibleMinor({dex,leg:true},{[dex]:{}}),false,String(dex));
  assert.equal(R.eligibleMinor({dex:25,leg:false},{25:{}}),false);
  assert.equal(R.eligibleMinor({dex:377,leg:true},{}),false);
});
test('Sorteo sin repeticiones, sólo especies elegibles con sprites',()=>{
  for(let seed=0;seed<100;seed++){
    let n=seed+1;const random=()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};
    const picks=R.selectMinors(G.DEX,G.SPRITE_META,4,random);
    assert.equal(new Set(picks).size,4);
    for(const dex of picks)assert.ok(R.eligibleMinor(G.DEX_BY[dex],G.SPRITE_META));
  }
  assert.throws(()=>R.selectMinors([],{},2));
});
test('Vida crece más que daño; cadencia gradual con tope incluso en furia',()=>{
  const base=R.minorStats(1);let prev=base;
  for(let i=2;i<=12;i++){
    const cur=R.minorStats(i);
    assert.ok(cur.hp>prev.hp && cur.damage>prev.damage);
    assert.ok(cur.hp/base.hp>cur.damage/base.damage);
    assert.ok(cur.attackRate>=prev.attackRate && cur.attackRate<=1.30);
    assert.ok(R.extraCooldownDecay(cur.attackRate,true)+1.25<=1.5);
    prev=cur;
  }
  assert.throws(()=>R.minorStats(0));
});
test('Recompensas de tres victorias llevan del nivel 8 al 17 sin bonus',()=>{
  let level=8,xp=0;
  for(let encounter=0;encounter<3;encounter++){
    xp+=R.rewardXp(G.Player.xpFor,level);
    while(xp>=G.Player.xpFor(level)){xp-=G.Player.xpFor(level);level++;}
  }
  assert.equal(level,17);assert.equal(xp,0);
});
