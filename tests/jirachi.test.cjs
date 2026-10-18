const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function fixture({phase=1,width=960,height=560,radius=24,spd=130}={}){
  const ctx=vm.createContext({G:{}});for(const f of ['groudon','major-cadence','jirachi'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../dev',f+'.js'),'utf8'),ctx);
  const G=ctx.G;G.Groudon.resizeArena(width,height);
  const b={x:0,y:-65,r:20,hp:G.Jirachi.BASE_HP*[0,1,.6,.3][phase],maxHp:G.Jirachi.BASE_HP,dead:false},p={x:0,y:80,r:radius,source:{spd},dead:false},ps=[p],hits=[],events=[];
  let e;e=new G.Jirachi.Encounter({boss:b,players:()=>ps,hit:(...a)=>{hits.push(a);return a[1];},signal:(kind,a)=>events.push({kind,a,at:e.clock})});e.phase=phase;
  const tick=s=>{for(let i=0;i<Math.round(s*100);i++)e.update(.01);};return {G,e,b,p,ps,hits,events,tick};
}
test('Four real moves have independent clocks; phase two preserves 2.5-second Doom Desire and phase three speeds new tells',()=>{
  for(const phase of [1,2,3]){
    const {e,tick}=fixture({phase}),before=e.schedules.map(m=>m.readyAt);tick(.75);
    assert.equal(e.attack.name,'Deseo Oculto');assert.equal(e.attack.type,'steel');assert.equal(e.attack.warn,phase===3?2:2.5);
    assert.equal(e.schedules[0].casts,1);assert.ok(e.schedules[0].readyAt>before[0]);
    for(let i=1;i<before.length;i++)assert.equal(e.schedules[i].readyAt,before[i]);
    const swift=e.createAttack('swift');assert.equal(swift.shapes.length,[0,3,5,7][phase]);assert.equal(e.createAttack('flash').name,'Foco Resplandor');assert.equal(e.createAttack('psychic').name,'Psíquico');
  }
  const {e,b,p,tick}=fixture();e.begin('doom');const a=e.attack,s=JSON.stringify(a.shapes);b.hp=b.maxHp*.3;p.x=300;tick(.1);
  assert.equal(e.phase,3);assert.equal(a.warn,2.5);assert.equal(JSON.stringify(a.shapes),s);
});
test('Phase two actually prepares Swift one second after Doom Desire, with at most two moves and fixed marks',()=>{
  const {e,p,events}=fixture({phase:2});let goal=null,count=0,react=0;
  for(let i=0;i<450;i++){
    const starts=events.filter(x=>x.kind==='attack');if(starts.length!==count){count=starts.length;goal=e.findEscape(p);react=.25;}
    if(react>0)react-=.01;else if(goal){const dx=goal.x-p.x,dy=goal.y-p.y,d=Math.hypot(dx,dy),step=Math.min(1.3,d);if(d){p.x+=dx/d*step;p.y+=dy/d*step;}}
    e.update(.01);assert.ok(e.attacks.length<=2);
  }
  const starts=events.filter(x=>x.kind==='attack'),doom=starts.find(x=>x.a.kind==='doom'),swift=starts.find(x=>x.a.kind==='swift');
  assert.ok(doom&&swift);assert.ok(Math.abs(swift.at-doom.at-1)<.02,JSON.stringify(starts.map(x=>({at:x.at,kind:x.a.kind}))));
  assert.equal(doom.a.warn,2.5);assert.ok(events.filter(x=>x.kind==='impact').every(x=>x.at>=x.a.warn));
});
test('Every single warning has a reachable exit in three aspect ratios, at corners and melee, including large slowed players',()=>{
  for(const [width,height]of [[960,560],[960,1920],[1800,560]])for(const phase of [1,2,3])for(const radius of [12,40])for(const spd of [130,65])for(const side of [-1,0,1]){
    const {G,e,p}=fixture({phase,width,height,radius,spd}),r=G.Groudon.ARENA;p.x=side*(r.right-radius-6);p.y=side*(r.bottom-radius-6);
    for(const kind of ['doom','swift','flash','psychic']){
      e.attacks=[];e.cadence.lastStart=-99;e.cadence.lastImpact=-99;
      assert.ok(e.begin(kind),JSON.stringify({phase,width,height,radius,spd,side,kind}));
      const q=e.findEscape(p);assert.ok(q&&q.distance/spd+.25<=e.attack.warn+1e-9);
    }
  }
});
test('Psychic damages only its moving ring front; Swift uses actual stars, not its entire corridor',()=>{
  const {e,p,G,hits}=fixture();e.cooldown=999;
  const a=e.createAttack('psychic');a.t=a.warn+.5;e.attacks=[a];p.x=a.shapes[0].x;p.y=a.shapes[0].y;
  e.resolveHits();assert.equal(hits.length,0);p.x+=130;e.resolveHits();assert.equal(hits.length,1);
  assert.equal(G.Groudon.contains({kind:'ring',x:0,y:0,inner:30,outer:60},{x:0,y:0,r:12}),false);
  const star=e.createAttack('swift');star.t=star.warn+.05;const shapes=e.hitShapes(star);assert.ok(shapes.every(s=>s.kind==='circle'&&s.r===7));
  assert.ok(shapes.every(s=>Math.hypot(s.x-e.boss.x,s.y-e.boss.y)<20));
});
test('Doom Desire allows a full punish window after the pending attacks finish; interrupt, pause and death clear safely',()=>{
  const {e,tick,b,events}=fixture({phase:2});for(const m of e.schedules)if(m.kind!=='doom')m.readyAt=999;
  tick(4.1);assert.equal(e.attacks.length,0);assert.ok(e.cadence.restUntil>e.clock);assert.equal(e.recovering,true);
  const position=[b.x,b.y];tick(.3);assert.deepEqual([b.x,b.y],position);assert.equal(e.begin('flash'),false);
  const clock=e.clock,snapshot=JSON.stringify(e);e.update(0);e.update(NaN);assert.equal(e.clock,clock);assert.equal(JSON.stringify(e),snapshot);
  e.interrupt();assert.equal(e.attacks.length,0);assert.equal(e.cadence.restPending,false);assert.ok(e.schedules.every(m=>m.readyAt>e.clock));
  b.dead=true;tick(.01);assert.equal(e.finished,true);assert.equal(e.attacks.length,0);tick(1);assert.equal(events.filter(x=>x.kind==='victory').length,1);
});
test('All four simulated teammates receive reachable fixed Doom Desire marks and share per-player hit grace',()=>{
  const {e,p,ps,hits}=fixture({phase:3});ps.length=0;
  for(const sx of [-1,1])for(const sy of [-1,1])ps.push({...p,x:sx*400,y:sy*200,source:{spd:65}});
  e.begin('doom');assert.equal(e.attack.shapes.length,4);for(const p of ps)assert.ok(e.findEscape(p));
  const a=e.attack;a.t=a.warn+.01;e.resolveHits();assert.equal(hits.length,4);
  for(const p of ps)a.hit.delete(p);e.resolveHits();assert.equal(hits.length,4);
});
module.exports={fixture};
