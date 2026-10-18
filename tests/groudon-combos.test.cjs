const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ctx=vm.createContext({G:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../dev/groudon.js'),'utf8'),ctx);
const {Encounter,ARENA,contains}=ctx.G.Groudon;
function fixture() {
  const boss={x:0,y:-65,r:35,hp:400000,maxHp:400000,dead:false};
  const p={x:0,y:70,r:24,dead:false},hits=[],casts=[];
  let e;
  e=new Encounter({boss,players:()=>[p],hit:(...args)=>{hits.push(args);return 30;},
    signal:(kind,a)=>{if(kind==='attack')casts.push({time:e.clock,count:e.attacks.length,kind:a.kind});}});
  const tick=seconds=>{for(let i=0;i<Math.round(seconds*100);i++)e.update(.01);};
  return {boss,p,hits,casts,e,tick};
}
test('Phase one attacks sooner and more often; phases two and three cast two and three moves',()=>{
  for(const [ratio,expected] of [[1,1],[.6,2],[.3,3]]) {
    const f=fixture();f.boss.hp=f.boss.maxHp*ratio;f.tick(20);
    assert.ok(f.casts[0].time<.6);
    assert.ok(f.casts.some(c=>c.count===expected),JSON.stringify(f.casts));
    assert.ok(f.casts.every(c=>c.count<=3));
    if(expected===1) assert.ok(f.casts.length>=7,'Expected at least seven casts in 20 seconds');
    if(expected===3) {
      assert.equal(f.casts.filter(c=>c.kind==='rupture').length,1);
      assert.equal(f.casts.find(c=>c.kind==='rupture').count,1);
    }
  }
});
test('Concurrent impacts share a warning and cannot deal three instantaneous hits',()=>{
  const {e,p,hits,tick}=fixture();p.y=-65;
  assert.equal(e.beginCombo(['blades','stomp','eruption']),true);
  assert.equal(e.attacks.length,3);
  const warn=e.attack.warn;
  assert.ok(e.attacks.every(a=>a.warn===warn));assert.ok(warn>=1.35);
  tick(warn-.05);assert.equal(hits.length,0);
  tick(.1);assert.equal(hits.length,1);assert.equal(hits[0][1],44);
  assert.ok(e.attacks.every(a=>a.hit.has(p)));
  tick(.2);assert.equal(hits.length,1);
});
test('Every supported combo has a walkable escape for large and small players at corners and melee range',()=>{
  const combos=[['blades','eruption'],['charge','eruption'],['stomp','eruption'],
    ['blades','eruption','charge'],['blades','eruption','stomp']];
  for(const radius of [12,24,30]) for(const kinds of combos) for(const side of [-1,0,1]) {
    const {e,p,boss,hits}=fixture();p.r=radius;
    p.x=side*(ARENA.right-radius-6);p.y=side?(ARENA.bottom-radius-6)*side:boss.y;
    // Add a real-sized lava patch near the player, without starting inside it.
    e.hazards=[{kind:'circle',x:p.x-side*75-40,y:p.y-80,r:31,start:0,end:10}];
    assert.equal(e.beginCombo(kinds),true);
    assert.equal(e.attacks.length,kinds.length,'Unexpectedly lost part of '+kinds);
    const goal=e.findEscape(p),warn=e.attack.warn;
    assert.ok(goal && goal.distance/130+.24<=warn,kinds+' has no timely escape');
    const shapes=e.attacks.map(a=>JSON.stringify(a.shapes));
    const finish=warn+Math.max(...e.attacks.map(a=>a.active))+.05;
    for(let t=0;t<finish;t+=.01) {
      if(t>=.25) {
        const dx=goal.x-p.x,dy=goal.y-p.y,d=Math.hypot(dx,dy),step=Math.min(d,1.3);
        if(d>0) {p.x+=dx/d*step;p.y+=dy/d*step;}
      }
      e.update(.01);
    }
    assert.equal(hits.length,0,kinds+' harmed a player following its escape route');
    assert.ok(e.attacks.every((a,i)=>JSON.stringify(a.shapes)===shapes[i]),'A warning chased the player');
  }
});
test('Terremoto keeps its exclusive safe lane; pause and victory stop every concurrent attack',()=>{
  const {e,boss,p,tick,hits}=fixture();
  assert.equal(e.beginCombo(['rupture','blades']),false);
  e.beginCombo(['blades','eruption','charge']);
  const timers=e.attacks.map(a=>a.t);e.update(0);e.update(NaN);
  assert.deepEqual(Array.from(e.attacks,a=>a.t),timers);
  boss.dead=true;tick(.01);assert.equal(e.attacks.length,0);assert.equal(e.hazards.length,0);
  assert.equal(e.begin('eruption'),false);tick(5);assert.equal(hits.length,0);
});
