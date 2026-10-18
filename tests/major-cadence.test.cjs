const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function fixture(id='groudon',{phase=1,width=960,height=560,radius=24,spd=130}={}){
  const ctx=vm.createContext({G:{}});for(const f of ['groudon','kyogre','rayquaza','major-cadence'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../dev',f+'.js'),'utf8'),ctx);
  const G=ctx.G;G.Groudon.resizeArena(width,height);
  const Model=G[{groudon:'Groudon',kyogre:'Kyogre',rayquaza:'Rayquaza'}[id]];
  const boss={x:0,y:-65,r:35,hp:Model.BASE_HP*[0,1,.6,.3][phase],maxHp:Model.BASE_HP,dead:false};
  const p={x:0,y:80,r:radius,dead:false,source:{spd}},ps=[p],events=[],hits=[];
  let e;e=G.MajorCadence.attach(new Model.Encounter({boss,players:()=>ps,hit:(...args)=>{hits.push(args);return args[1];},signal:(kind,a)=>events.push({kind,a,at:e.clock,count:e.attacks.length,phase:e.phase})}));
  e.phase=phase;const tick=s=>{for(let i=0;i<Math.round(s*100);i++)e.update(.01);};return {G,e,boss,p,ps,events,hits,tick};
}
test('All three majors own independent move clocks and update only the move that actually launches',()=>{
  for(const id of ['groudon','kyogre','rayquaza']){
    const {e,tick}=fixture(id),before=e.schedules.map(m=>m.readyAt);tick(.6);
    assert.equal(e.attacks.length,1);assert.equal(e.schedules[0].casts,1);
    assert.ok(e.schedules[0].readyAt>before[0]);
    for(let i=1;i<before.length;i++)assert.equal(e.schedules[i].readyAt,before[i]);
  }
});
test('Moving players see genuinely overlapping, staggered attacks and bounded density in every phase',()=>{
  const peaks={};
  for(const id of ['groudon','kyogre','rayquaza'])for(const phase of [1,2,3]){
    const {e,p,events,G}=fixture(id,{phase});let peak=0,revision=-1,goal=null;
    for(let i=0;i<12000;i++){
      if(revision!==events.length){revision=events.length;goal=e.findEscape(p);}
      if(goal){const dx=goal.x-p.x,dy=goal.y-p.y,d=Math.hypot(dx,dy),step=Math.min(1.3,d);if(d){p.x+=dx/d*step;p.y+=dy/d*step;}}
      e.update(.01);peak=Math.max(peak,e.attacks.length);assert.ok(e.attacks.length<=phase);
      for(const a of e.attacks)if(['rupture','rain','pulse','meteor'].includes(a.kind))assert.equal(e.attacks.length,1);
      assert.ok(e.attacks.filter(a=>['ascent','charge'].includes(a.kind)&&a.t<a.warn+a.active).length<=1);
    }
    const starts=events.filter(x=>x.kind==='attack'),impacts=events.filter(x=>x.kind==='impact');
    assert.ok(starts.length>=10,JSON.stringify({id,phase,starts:starts.length}));
    for(let i=1;i<starts.length;i++)assert.ok(starts[i].at-starts[i-1].at>=G.MajorCadence.startGap(phase)-.011);
    for(let i=1;i<impacts.length;i++)assert.ok(impacts[i].at-impacts[i-1].at>=G.MajorCadence.impactGap(phase)-.011);
    if(phase>1)assert.ok(peak>=2,JSON.stringify({id,phase,peak}));peaks[id+phase]=peak;
  }
});
test('Singles preserve reachable warnings in corners and melee for slowed large players and three screen shapes',()=>{
  for(const id of ['groudon','kyogre','rayquaza'])for(const [width,height]of [[960,560],[960,1920],[1800,560]])for(const phase of [1,2,3])for(const radius of [12,40])for(const spd of [130,65])for(const side of [-1,0,1]){
    const {G,e,p}=fixture(id,{phase,width,height,radius,spd}),r=G.Groudon.ARENA;
    p.x=side*(r.right-radius-6);p.y=side*(r.bottom-radius-6);
    const kinds=e.schedules.map(m=>m.kind).concat(id==='groudon'?['rupture']:id==='kyogre'?['pulse']:['meteor']);
    for(const kind of kinds){
      e.attacks=[];e.hazards=[];e.cadence.lastStart=-99;e.cadence.lastImpact=-99;
      assert.ok(e.begin(kind),JSON.stringify({id,kind,phase,width,height,radius,spd,side}));
      const q=e.findEscape(p);assert.ok(q&&q.distance/spd+.25<=e.attack.warn+1e-9);
    }
  }
});
test('A phase change keeps visible marks and warning times fixed; new cooldowns shorten with phase',()=>{
  for(const id of ['groudon','kyogre','rayquaza']){
    const {e,p,boss,tick}=fixture(id);const kind=id==='groudon'?'eruption':id==='kyogre'?'ice':'hurricane';
    e.begin(kind);const a=e.attack,warn=a.warn,shapes=JSON.stringify(a.shapes);p.x=300;boss.hp=boss.maxHp*.3;tick(.1);
    assert.equal(e.phase,3);assert.equal(a.warn,warn);assert.equal(JSON.stringify(a.shapes),shapes);
    assert.ok(e.schedules.every(m=>m.cd[2]<m.cd[0]||m.kind==='rain'));
  }
});
test('A new area attack can be warned during a charge while preserving a walkable route; late unsafe additions wait',()=>{
  const {e,p,tick,hits}=fixture('groudon',{phase:3});e.cooldown=999;
  assert.ok(e.begin('charge'));p.x=180;tick(1.2);
  assert.ok(e.begin('eruption'));assert.equal(e.attacks.length,2);
  const a=e.attacks[1],snapshot=JSON.stringify(a.shapes),q=e.findEscape(p);assert.ok(q);
  for(let t=0;t<a.warn+a.active+.02;t+=.01){
    if(t>=.25){const dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy),step=Math.min(1.3,d);if(d){p.x+=dx/d*step;p.y+=dy/d*step;}}
    e.update(.01);
  }
  assert.equal(hits.length,0);assert.equal(JSON.stringify(a.shapes),snapshot);
  const f=fixture('groudon',{phase:3});f.e.cooldown=999;f.e.begin('blades');f.tick(1);
  assert.equal(f.e.begin('eruption'),false);assert.equal(f.e.attacks.length,1);
});
test('Movement and anchored attacks do not contradict each other; independent area marks remain fixed',()=>{
  for(const id of ['groudon','kyogre','rayquaza']){
    const {e,tick}=fixture(id,{phase:3});e.cooldown=999;
    const first=id==='groudon'?'charge':id==='kyogre'?'hydro':'ascent';assert.ok(e.begin(first));
    const a=e.attack,snapshot=JSON.stringify(a.shapes);tick(.8);
    const blocked=id==='groudon'?'stomp':id==='kyogre'?'hydro':'charge';assert.equal(e.begin(blocked),false);
    assert.equal(JSON.stringify(a.shapes),snapshot);
  }
});
test('Exclusive phase moves are queued until old attacks finish; rotation retries unexecuted specials and death cancels all',()=>{
  for(const id of ['groudon','kyogre','rayquaza']){
    const {e,boss,events,tick}=fixture(id),kind=id==='groudon'?'eruption':id==='kyogre'?'ice':'hurricane',special=id==='groudon'?'rupture':id==='kyogre'?'rain':'meteor';
    assert.ok(e.begin(kind));boss.hp=boss.maxHp*.3;tick(.1);assert.equal(e.attacks.length,1);assert.equal(e.attack.kind,kind);
    tick(4);assert.ok(events.some(x=>x.kind==='attack'&&x.a.kind===special));
    e.interrupt();assert.equal(e.attacks.length,0);assert.equal(e.hazards.length,0);assert.ok(e.schedules.every(m=>m.readyAt>e.clock));
    const clock=e.clock,dates=JSON.stringify(e.schedules);e.update(0);e.update(NaN);assert.equal(e.clock,clock);assert.equal(JSON.stringify(e.schedules),dates);
    boss.dead=true;tick(.01);assert.equal(e.finished,true);assert.equal(e.attacks.length,0);assert.equal(e.begin(kind),false);
    tick(1);assert.equal(events.filter(x=>x.kind==='victory').length,1);
  }
});
test('Rotation requeues a phase special if its warning was cancelled before impact',()=>{
  for(const id of ['groudon','kyogre','rayquaza']){
    const {e,events,tick}=fixture(id,{phase:3});tick(.6);const special=e.attack.kind;
    assert.ok(['rupture','rain','meteor'].includes(special));e.interrupt();tick(1.1);
    assert.equal(events.filter(x=>x.kind==='attack'&&x.a.kind===special).length,2);
    assert.ok(e.attack.t<e.attack.warn);
  }
});
test('Separated simulated teammates all receive a reachable refuge without stalling the phase special',()=>{
  for(const id of ['groudon','kyogre'])for(const height of [560,1920]){
    const {e,ps,p,G,tick,events}=fixture(id,{phase:3,height}),r=G.Groudon.ARENA;
    ps.length=0;for(const sx of [-1,1])for(const sy of [-1,1])ps.push({...p,x:sx*(r.right-46),y:sy*(r.bottom-46),r:40,source:{spd:65}});
    tick(id==='groudon'?.6:2.3);const a=e.attack;assert.equal(a.kind,id==='groudon'?'rupture':'pulse');assert.ok(a.safes.length>=2);
    for(const p of ps){const q=e.findEscape(p);assert.ok(q&&q.distance/65+.25<=a.warn);p.x=q.x;p.y=q.y;}
    tick(8);assert.ok(events.filter(x=>x.kind==='attack').length>=2);assert.equal(e.cadence.specialDue(),null);
  }
});
module.exports={fixture};
