const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function fixture(){
  const ctx=vm.createContext({G:{}});for(const f of ['dev/groudon.js','dev/regis.js','dev/eon.js','dev/boss-rush-bars.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx);
  const G=ctx.G,bosses=[381,380].map((dex,i)=>({dex,name:i?'Latias':'Latios',x:i?220:-110,y:-65,r:25,hp:G.Eon.BASE_HP,maxHp:G.Eon.BASE_HP,dead:false}));
  const p={x:0,y:85,r:12,dead:false,source:{spd:130}},events=[],hits=[];
  const e=new G.Eon.Encounter({bosses,players:()=>[p],hit:(...a)=>hits.push(a),signal:(kind,a)=>events.push({kind,at:e.clock,a})});
  const tick=s=>{for(let i=0;i<Math.ceil(s*100);i++)e.update(.01);};return {G,e,p,bosses,events,hits,tick};
}
test('Both Eon Pokemon share all three moves and stagger six independent clocks; overlap stays bounded',()=>{
  const {e,events}=fixture();for(let i=0;i<12000;i++){e.update(.01);assert.ok(e.attacks.length<=2);}
  const starts=events.filter(x=>x.kind==='attack'),impacts=events.filter(x=>x.kind==='impact');
  assert.equal(new Set(starts.map(x=>x.a.owner.dex+':'+x.a.kind)).size,6);
  assert.ok(starts.length>20);
  for(let i=1;i<starts.length;i++)assert.ok(starts[i].at-starts[i-1].at>=.69);
  for(let i=1;i<impacts.length;i++)assert.ok(impacts[i].at-impacts[i-1].at>=.63);
  const f=fixture();f.e.beginMove(f.e.schedules[0]);assert.ok(f.e.schedules[0].readyAt>7);assert.equal(f.e.schedules[1].readyAt,2.2);
});
test('Latios closes distance while Latias retreats and moves around the arena',()=>{
  const {e,p,bosses}=fixture();for(const b of bosses){b.x=0;b.y=0;}p.x=0;p.y=150;
  e.moveMembers(.05);assert.ok(bosses[0].y>0);assert.ok(bosses[1].y<0);
  for(let i=0;i<2000;i++)e.moveMembers(.05);
  assert.ok(Math.hypot(bosses[0].x-p.x,bosses[0].y-p.y)<120);
  assert.ok(Math.hypot(bosses[1].x-p.x,bosses[1].y-p.y)>200);
});
test('Every move leaves a reachable exit in melee and all corners, for slowed large players in three aspect ratios',()=>{
  const {G,e,p}=fixture();
  for(const [w,h]of [[960,560],[960,1920],[1800,560]])for(const r of [12,30,40])for(const spd of [130,65])for(const point of [[0,85],[-w/2+r+6,-h/2+r+6],[w/2-r-6,h/2-r-6]]){
    G.Groudon.resizeArena(w,h);Object.assign(p,{x:point[0],y:point[1],r,source:{spd}});
    for(const move of e.schedules){
      e.attacks=[];e.lastStart=-99;e.lastImpact=-99;
      assert.ok(e.beginMove(move),JSON.stringify({kind:move.kind,dex:move.dex,w,h,r,spd,point}));
      const q=e.findEscape(p);assert.ok(q&&q.distance/spd+.25<=e.attack.warn+1e-8);
    }
  }
});
test('Zen Headbutt moves the caster along the fixed warning; damage follows its body, not the whole corridor',()=>{
  const {e,p,bosses,tick}=fixture();for(const m of e.schedules)m.readyAt=999;
  assert.ok(e.beginMove(e.schedules[0]));const a=e.attack,s=JSON.stringify(a.shapes),start=bosses[0].x;
  p.x+=200;tick(.5);assert.equal(JSON.stringify(a.shapes),s);assert.equal(bosses[0].x,start);
  tick(a.warn-.5+.3);assert.ok(bosses[0].x>start);
  const shape=e.hitShapes(a)[0];assert.ok(Math.hypot(shape.x-bosses[0].x,shape.y-bosses[0].y)<1e-6);
  const line=a.shapes[0],far={x:line.bx,y:line.by,r:12};assert.ok(!e.hitShapes(a).some(s=>Math.hypot(s.x-far.x,s.y-far.y)<s.r+far.r));
});
test('Dragon Pulse has one moving hitbox and Psychic keeps the announced circles fixed',()=>{
  const {e,p}=fixture();
  const a=e.createMove(e.schedules[1]);a.t=a.warn+.01;const start=e.hitShapes(a)[0];a.t=a.warn+a.active*.8;const end=e.hitShapes(a)[0];
  assert.equal(e.hitShapes(a).length,1);assert.ok(Math.hypot(end.x-start.x,end.y-start.y)>20);
  const psy=e.createMove(e.schedules[3]),s=JSON.stringify(psy.shapes);p.x+=200;assert.equal(JSON.stringify(psy.shapes),s);
});
test('Combined hits share grace; defeated actors cancel their attacks; survivor bar expands; pause and interrupt are safe',()=>{
  const {G,e,p,bosses,hits,tick}=fixture();const a=e.createMove(e.schedules[3]);a.shapes=[{kind:'circle',x:p.x,y:p.y,r:55}];a.t=a.warn+.01;
  const b={...a,owner:bosses[0],hit:new Set()};e.attacks=[a,b];e.resolveHits();assert.equal(hits.length,1);
  const clock=e.clock;e.update(0);e.update(NaN);assert.equal(e.clock,clock);
  bosses[1].dead=true;e.update(.01);assert.ok(e.attacks.every(a=>a.owner===bosses[0]));assert.equal(e.finished,false);
  const bars=new G.BossRushBars(bosses);for(let i=0;i<240;i++)bars.update(.01);assert.ok(bars.entries[0].w>.999);
  e.interrupt();assert.equal(e.attacks.length,0);assert.ok(e.schedules.every(m=>m.readyAt>e.clock));
  bosses[0].dead=true;tick(.01);assert.equal(e.finished,true);assert.equal(e.attacks.length,0);
});
module.exports={fixture};
