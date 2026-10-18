const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function fixture(){
  const ctx=vm.createContext({G:{}});for(const f of ['dev/groudon.js','dev/regis.js','dev/boss-rush-bars.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx);
  const G=ctx.G,bosses=[377,378,379].map((dex,i)=>({dex,name:['Regirock','Regice','Registeel'][i],x:(i-1)*170,y:-65,r:25,hp:44000,maxHp:44000,dead:false}));
  const p={x:0,y:85,r:12,dead:false,source:{spd:130}},events=[],hits=[];
  const e=new G.Regis.Encounter({bosses,players:()=>[p],hit:(...a)=>hits.push(a),signal:(kind,a)=>events.push({kind,at:e.clock,a})});
  const tick=(seconds)=>{for(let n=0;n<Math.ceil(seconds*100);n++)e.update(.01);};
  return {G,e,p,bosses,events,hits,tick};
}
test('Each move owns its cooldown and offset; casts and impacts are staggered with at most two attacks',()=>{
  const {e,events,tick}=fixture(),before=e.schedules.map(m=>m.readyAt);tick(1.01);
  assert.equal(events.filter(x=>x.kind==='attack').length,1);
  assert.ok(e.schedules[0].readyAt>8);assert.equal(e.schedules[1].readyAt,before[1]);assert.equal(e.schedules[2].readyAt,before[2]);
  for(let i=0;i<5000;i++){e.update(.01);assert.ok(e.attacks.length<=2);}
  const starts=events.filter(x=>x.kind==='attack'),impacts=events.filter(x=>x.kind==='impact');
  assert.equal(new Set(starts.map(x=>x.a.owner.dex)).size,3);
  assert.equal(new Set(starts.map(x=>x.a.kind)).size,6);
  for(let i=1;i<starts.length;i++)assert.ok(starts[i].at-starts[i-1].at>=.69);
  for(let i=1;i<impacts.length;i++)assert.ok(impacts[i].at-impacts[i-1].at>=.63);
});
test('All six telegraphs have reachable exits at corners and melee range, including slowed large players and portrait arenas',()=>{
  const {G,e,p}=fixture();
  for(const [w,h]of [[960,560],[960,1920],[1800,560]])for(const r of [12,30,40])for(const spd of [130,65])for(const point of [[0,85],[-w/2+r+6,-h/2+r+6],[w/2-r-6,h/2-r-6]]){
    G.Groudon.resizeArena(w,h);Object.assign(p,{x:point[0],y:point[1],r,source:{spd}});
    for(const move of e.schedules){
      e.attacks=[];e.hazards=[];e.lastStart=-99;e.lastImpact=-99;
      assert.equal(e.beginMove(move),true,JSON.stringify({move:move.kind,w,h,r,spd,point}));
      const route=e.findEscape(p);assert.ok(route);assert.ok(route.distance/spd+.25<=e.attacks[0].warn+1e-9);
    }
  }
});
test('Warnings snapshot their targets; rocks are solid, capped and temporary; rotation retires warnings',()=>{
  const {e,p,tick}=fixture();const rock=e.schedules.find(m=>m.kind==='rocks');
  assert.equal(e.beginMove(rock),true);const shapes=JSON.stringify(e.attacks[0].shapes);
  p.x+=200;tick(.5);assert.equal(JSON.stringify(e.attacks[0].shapes),shapes);
  tick(1.4);assert.ok(e.hazards.length>0&&e.hazards.length<=3);
  const h=e.hazards[0];p.x=h.x;p.y=h.y;e.constrain(p);assert.ok(Math.hypot(p.x-h.x,p.y-h.y)>=h.r+p.r);
  for(const m of e.schedules)m.readyAt=999;tick(6);assert.equal(e.hazards.length,0);
  e.interrupt();assert.equal(e.attacks.length,0);assert.equal(e.hazards.length,0);
  assert.ok(e.schedules.every(m=>m.readyAt>e.clock));
});
test('Concurrent hits share grace and ice metadata; deaths cancel the defeated owner, victory clears everything, pause freezes clocks',()=>{
  const {e,p,bosses,hits}=fixture();p.x=0;p.y=0;
  e.attacks=[e.createMove(e.schedules.find(m=>m.kind==='ice')),e.createMove(e.schedules.find(m=>m.kind==='slide'))];
  for(const a of e.attacks){a.shapes=[{kind:'circle',x:0,y:0,r:40}];a.t=a.warn+.01;}
  e.resolveHits();assert.equal(hits.length,1);assert.equal(hits[0][3].slow,.65);
  for(const a of e.attacks)a.hit.clear();e.resolveHits();assert.equal(hits.length,1);
  const clock=e.clock;e.update(0);e.update(NaN);assert.equal(e.clock,clock);
  bosses[1].dead=true;e.update(.01);assert.ok(e.attacks.every(a=>a.owner.dex!==378));assert.equal(e.finished,false);
  for(const b of bosses)b.dead=true;e.update(.01);assert.equal(e.finished,true);assert.equal(e.attacks.length,0);assert.equal(e.hazards.length,0);
});
test('A rock at an arena corner cannot pin a player against the boundary',()=>{
  const {G,e,p,bosses}=fixture(),r=G.Groudon.ARENA;
  for(const [x,y]of [[r.left+18,r.top+18],[r.right-18,r.top+18],[r.right-18,r.bottom-18],[r.left+18,r.bottom-18]]){
    const h={kind:'circle',x,y,r:18,end:5,owner:bosses[0]};e.hazards=[h];p.x=x;p.y=y;p.r=40;e.constrain(p);
    assert.ok(h.end<=e.clock||Math.hypot(p.x-x,p.y-y)>=h.r+p.r);
    assert.ok(p.x>=r.left+p.r+6&&p.x<=r.right-p.r-6&&p.y>=r.top+p.r+6&&p.y<=r.bottom-p.r-6);
  }
});
test('Three independent bars share exactly one width, then shake/fade before survivors expand',()=>{
  const {G,bosses}=fixture(),bars=new G.BossRushBars(bosses);
  assert.equal(bars.entries.reduce((n,b)=>n+b.w,0),1);
  bosses[0].hp=0;bosses[0].dead=true;bars.update(.02);assert.notEqual(bars.entries[0].deadAt,null);
  for(let i=0;i<120;i++)bars.update(.02);
  assert.ok(Math.abs(bars.entries[1].w-.5)<1e-6);assert.ok(Math.abs(bars.entries[2].w-.5)<1e-6);
  bosses[1].dead=true;for(let i=0;i<120;i++)bars.update(.02);
  assert.ok(Math.abs(bars.entries[2].w-1)<1e-6);assert.ok(bars.entries[2].x<1e-6);
});
