const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function fixture({phase=1,width=960,height=560,radius=24}={}){
  const ctx=vm.createContext({G:{}});
  for(const file of ['dev/groudon.js','dev/kyogre.js','dev/rayquaza.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
  const {G}=ctx;G.Groudon.resizeArena(width,height);
  const boss={x:0,y:-65,r:35.2,hp:G.Rayquaza.BASE_HP*[0,1,.6,.3][phase],maxHp:G.Rayquaza.BASE_HP,dead:false};
  const p={x:0,y:80,r:radius,dead:false,source:{spd:130}},ps=[p],hits=[],events=[];
  const e=new G.Rayquaza.Encounter({boss,players:()=>ps,hit:(...args)=>{hits.push(args);return 30;},signal:(...args)=>events.push(args)});
  e.phase=phase;
  const tick=s=>{for(let i=0;i<Math.round(s*100);i++)e.update(.01);};
  return {G,boss,p,ps,hits,events,e,tick};
}
test('Rayquaza has five real moves, correct types and progressively shorter fixed warnings',()=>{
  const moves={ascent:['Ascenso Draco','flying'],charge:['Velocidad Extrema','normal'],dragon:['Pulso Dragón','dragon'],hurricane:['Vendaval','flying'],meteor:['Cometa Draco','dragon']};
  for(const [kind,[name,type]]of Object.entries(moves)){
    const warnings=[];
    for(const phase of [1,2,3]){const f=fixture({phase});assert.equal(f.e.begin(kind),true);assert.equal(f.e.attack.name,name);assert.equal(f.e.attack.type,type);warnings.push(f.e.attack.warn);}
    assert.ok(warnings[0]>warnings[1]&&warnings[1]>warnings[2],kind+' '+warnings);
  }
  const f=fixture();f.e.begin('hurricane');const warn=f.e.attack.warn,shape=JSON.stringify(f.e.attack.shapes);
  f.boss.hp=f.boss.maxHp*.3;f.p.x=300;f.tick(.1);assert.equal(f.e.phase,3);
  assert.equal(f.e.attack.warn,warn);assert.equal(JSON.stringify(f.e.attack.shapes),shape);
});
test('All Rayquaza patterns have reachable escapes across phases, screen shapes, sprite sizes and corners',()=>{
  const combos=[['ascent'],['charge'],['dragon'],['hurricane'],['meteor'],['ascent','hurricane'],['charge','hurricane'],['dragon','hurricane'],['ascent','hurricane','dragon'],['charge','hurricane','dragon']];
  for(const [width,height]of [[960,560],[960,1920],[1280,560]])for(const phase of [1,2,3])for(const radius of [12,30,40])for(const side of [-1,0,1])for(const kinds of combos){
    const f=fixture({phase,width,height,radius}),{e,G,p,hits}=f,r=G.Groudon.ARENA;
    p.x=side*(r.right-radius-6);p.y=side*(r.bottom-radius-6);
    assert.equal(e.beginCombo(kinds),true,JSON.stringify({phase,radius,side,kinds}));
    const goal=e.findEscape(p);assert.ok(goal&&goal.distance/130+.22<=e.attack.warn+1e-9);
    const shapes=JSON.stringify(e.attacks.map(a=>a.shapes)),finish=e.attack.warn+Math.max(...e.attacks.map(a=>a.active))+.02;
    for(let t=0;t<finish;t+=.01){
      if(t>=.22){const dx=goal.x-p.x,dy=goal.y-p.y,d=Math.hypot(dx,dy),step=Math.min(d,1.3);if(d){p.x+=dx/d*step;p.y+=dy/d*step;}}
      e.update(.01);
    }
    assert.equal(hits.length,0,JSON.stringify({phase,width,height,radius,side,kinds}));
    assert.equal(JSON.stringify(e.attacks.map(a=>a.shapes)),shapes);
  }
});
test('Dragon Ascent dives only after its full warning at a fixed marked destination',()=>{
  const {e,p,boss,hits,tick}=fixture();e.begin('ascent');const a=e.attack,destination={...a.destination};
  const start=[boss.x,boss.y];tick(a.warn-.03);assert.deepEqual([boss.x,boss.y],start);assert.equal(hits.length,0);
  tick(.05);assert.equal(hits.length,1);assert.deepEqual([boss.x,boss.y],[destination.x,destination.y]);
  p.x=300;assert.deepEqual({...a.destination},destination);tick(.2);assert.equal(hits.length,1);
});
test('Extreme Speed follows its corridor without recoil, early contact or repeated damage',()=>{
  const {e,p,boss,hits,events,tick}=fixture();p.y=170;e.begin('charge');const a=e.attack,y=boss.y;
  tick(a.warn-.03);assert.equal(boss.y,y);assert.equal(hits.length,0);
  tick(a.active+.05);assert.ok(boss.y>y);assert.equal(hits.length,1);assert.equal(hits[0][2],'normal');
  assert.ok(!events.some(ev=>ev[0]==='recoil'));assert.equal(e.hazards.length,0);
});
test('Meteor shower is exclusive and leaves a punish window; movement attacks never contradict each other',()=>{
  const {e,tick}=fixture({phase:3});assert.equal(e.beginCombo(['meteor','dragon']),false);assert.equal(e.beginCombo(['ascent','charge']),false);
  e.begin('meteor');const a=e.attack;assert.ok(a.shapes.length>=4);assert.ok(a.recovery>=1.5);
  tick(a.warn+a.active+.1);assert.equal(e.recovering,true);assert.equal(e.attack,a);
});
test('A simultaneous dive and hurricane share one hit and grace per player, including four players',()=>{
  const {e,p,ps,hits,tick}=fixture({phase:3});for(let i=0;i<3;i++)ps.push({...p});
  e.beginCombo(['ascent','hurricane','dragon']);tick(e.attack.warn+.06);
  assert.equal(hits.length,4);assert.ok(hits.every(h=>h[1]===64&&h[2]==='flying'));tick(.3);assert.equal(hits.length,4);
});
test('Rayquaza pursues, progresses through single/double/triple attacks, and cleans up on pause and victory',()=>{
  for(const phase of [1,2,3]){
    const {e,boss,p,events,tick}=fixture({phase});p.x=300;const x=boss.x;tick(.4);assert.ok(boss.x>x);
    tick(30);const casts=events.filter(ev=>ev[0]==='attack');assert.ok(casts.length>=6);
    assert.ok(casts.some(ev=>(ev[1].comboName||'').split(' + ').length===phase));
    if(phase>1)assert.ok(casts.some(ev=>ev[1].kind==='meteor'));
    const clock=e.clock,shape=JSON.stringify(e.attacks);e.update(0);e.update(NaN);assert.equal(e.clock,clock);assert.equal(JSON.stringify(e.attacks),shape);
    boss.dead=true;tick(.01);assert.equal(e.attacks.length,0);assert.equal(e.hazards.length,0);assert.equal(e.begin('dragon'),false);
    assert.equal(events.filter(ev=>ev[0]==='victory').length,1);
  }
});
