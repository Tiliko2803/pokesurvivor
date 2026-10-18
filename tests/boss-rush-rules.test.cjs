const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),ctx=vm.createContext({G:{}});
for(const file of ['js/data/pokedex.js','js/data/sprites-meta.js','js/entities/player.js','dev/boss-rush-rules.js'])
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const {G}=ctx,R=G.BossRushRules;
test('Vida de mayores y menores se multiplica exactamente por jugadores',()=>{
  for(const n of [1,2,3,4]){
    assert.equal(R.bossHp(400000,n),400000*n);
    assert.equal(R.bossHp(R.minorStats(0).hp,n),R.minorStats(0).hp*n);
  }
  assert.equal(R.bossHp(400000),400000);
  assert.equal(R.bossHp(400000,0),400000);
});
test('Todos los mayores acordados, protagonistas DLC y personajes custom quedan fuera',()=>{
  for(const dex of [150,249,250,382,383,384,483,484,487,493,643,644,646,716,717,718,791,792,800,888,889,890,892,898,1007,1008,1017,1024,10001,10002])
    assert.equal(R.eligibleMinor({dex,leg:true},{[dex]:{}}),false,String(dex));
  assert.equal(R.eligibleMinor({dex:25,leg:false},{25:{}}),false);
  assert.equal(R.eligibleMinor({dex:377,leg:true},{}),false);
});
test('Only seven Hoenn candidates with native sprites are eligible, including Jirachi and Deoxys',()=>{
  const ids=G.DEX.filter(m=>R.eligibleMinor(m,G.SPRITE_META)).map(m=>m.dex).sort((a,b)=>a-b);
  assert.deepEqual(Array.from(ids),[377,378,379,380,381,385,386]);
  for(const dex of [144,145,146,243,244,245,480,481,482,488,638,639,640,641,642,645])
    assert.equal(R.eligibleMinor(G.DEX_BY[dex],G.SPRITE_META),false,String(dex));
  for(const dex of ids){assert.equal(G.DEX_BY[dex].gen,3);assert.ok(G.SPRITE_META[dex]);}
  assert.throws(()=>R.selectMinors(G.DEX,G.SPRITE_META,8));
});
test('Sorteo sin repeticiones, sólo especies elegibles con sprites',()=>{
  for(let seed=0;seed<100;seed++){
    let n=seed+1;const random=()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};
    const picks=R.selectMinors(G.DEX,G.SPRITE_META,6,random);
    assert.equal(new Set(picks).size,6);
    for(const dex of picks){assert.ok(R.eligibleMinor(G.DEX_BY[dex],G.SPRITE_META));assert.equal(G.DEX_BY[dex].gen,3);}
  }
  assert.throws(()=>R.selectMinors([],{},2));
});
test('The trio has 44k HP per Regi and later minor budgets retain their previous progression',()=>{
  const base=R.minorStats(0);let prev=base;
  for(const stage of [2,3,5,6]){
    const cur=R.minorStats(stage);
    assert.ok(cur.hp>prev.hp && cur.damage>prev.damage);
    assert.ok(cur.hp/base.hp>cur.damage/base.damage);
    assert.ok(cur.attackRate>prev.attackRate && cur.attackRate<=1.35);
    assert.ok(R.extraCooldownDecay(cur.attackRate,true)+1.25<=1.5);
    prev=cur;
  }
  assert.equal(base.hp,44000);assert.equal(base.damage,21);assert.equal(base.attackRate,1.12);
  assert.equal(prev.hp,3600000);assert.ok(prev.damage<50);
  for(const stage of [-1,1,4,7,8,9,1.5,NaN])assert.throws(()=>R.minorStats(stage));
});
test('The trio rewards two base levels once; later rewards still reach Groudon 10, Kyogre 19 and Rayquaza 28',()=>{
  let level=8,xp=0;
  const levels=[8,10,13,16,19,22,25,28];
  for(let stage=0;stage<8;stage++){
    assert.equal(level,levels[stage]);assert.equal(R.rewardLevels(stage),stage===0?2:3);
    xp+=R.rewardXp(G.Player.xpFor,level,R.rewardLevels(stage));
    while(xp>=G.Player.xpFor(level)){xp-=G.Player.xpFor(level);level++;}
  }
  assert.equal(level,31);assert.equal(xp,0);
});
