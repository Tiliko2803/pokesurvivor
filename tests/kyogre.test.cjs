const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function fixture({phase=1,width=960,height=560,radius=24}={}){
  const ctx=vm.createContext({G:{}});
  for(const f of ['dev/groudon.js','dev/kyogre.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx);
  const {G}=ctx;G.Groudon.resizeArena(width,height);
  const boss={x:0,y:-65,r:35,hp:600000,maxHp:600000,dead:false},p={x:0,y:70,r:radius,dead:false};
  const ps=[p],hits=[],events=[],e=new G.Kyogre.Encounter({boss,players:()=>ps,hit:(...args)=>{hits.push(args);return args[1];},signal:(...args)=>events.push(args)});
  e.phase=phase;boss.hp=boss.maxHp*[0,1,.6,.3][phase];
  const tick=s=>{for(let i=0;i<Math.round(s*100);i++)e.update(.01);};
  return {G,boss,p,ps,hits,events,e,tick};
}
test('Five real moves have correct types; tells get shorter in each phase without changing an active warning',()=>{
  const names={surf:'Surf',hydro:'Hidrobomba',ice:'Rayo Hielo',rain:'Danza Lluvia',pulse:'Pulso Primigenio'};
  for(const [kind,name]of Object.entries(names)){
    const tells=[];
    for(const phase of [1,2,3]){
      const f=fixture({phase});f.e.begin(kind);assert.equal(f.e.attack.name,name);
      assert.equal(f.e.attack.type,kind==='ice'?'ice':'water');tells.push(f.e.attack.warn);
    }
    assert.ok(tells[0]>tells[1]&&tells[1]>tells[2],kind+' '+tells);
  }
  const f=fixture();f.e.begin('hydro');const warn=f.e.attack.warn,shapes=JSON.stringify(f.e.attack.shapes);
  f.boss.hp=f.boss.maxHp*.3;f.p.x=320;f.tick(.1);
  assert.equal(f.e.phase,3);assert.equal(f.e.attack.warn,warn);assert.equal(JSON.stringify(f.e.attack.shapes),shapes);
});
test('Singles and combinations leave walkable exits in every phase, portrait and landscape, including large players at corners',()=>{
  for(const [width,height]of [[960,560],[960,1920],[1280,560]])for(const phase of [1,2,3])for(const radius of [12,30])for(const side of [-1,0,1])
    for(const kinds of [['surf'],['hydro'],['ice'],['surf','ice'],['hydro','ice'],['surf','hydro','ice']]){
      const f=fixture({phase,width,height,radius}),{e,p,G,hits}=f,r=G.Groudon.ARENA;
      p.x=side*(r.right-radius-6);p.y=side*(r.bottom-radius-6);
      assert.equal(e.beginCombo(kinds),true);
      const route=e.findEscape(p);assert.ok(route);assert.ok(route.distance/130+.22<=e.attack.warn+1e-9);
      const snapshot=JSON.stringify(e.attacks.map(a=>a.shapes));
      const finish=e.attack.warn+Math.max(...e.attacks.map(a=>a.active))+.02;
      for(let t=0;t<finish;t+=.01){
        if(t>=.22){const dx=route.x-p.x,dy=route.y-p.y,d=Math.hypot(dx,dy),step=Math.min(1.3,d);if(d){p.x+=dx/d*step;p.y+=dy/d*step;}}
        e.update(.01);
      }
      assert.equal(hits.length,0,`${kinds} phase${phase} ${width}x${height} r${radius} side${side}`);
      assert.equal(JSON.stringify(e.attacks.map(a=>a.shapes)),snapshot);
    }
});
test('Surf damage follows the visible wave front and hits each player only once',()=>{
  const f=fixture(),{e,p,hits,tick}=f;e.begin('surf');const a=e.attack;
  tick(a.warn+.1);assert.equal(hits.length,0,'No full-lane damage ahead of the wave');
  tick(a.active);assert.equal(hits.length,1);assert.equal(hits[0][0],p);
  tick(.2);assert.equal(hits.length,1);
});
test('Rain has no direct damage, strengthens water but not ice, and stops on victory or pause',()=>{
  const f=fixture(),{e,hits,tick,boss}=f;e.begin('rain');tick(e.attack.warn+.3);
  assert.equal(e.raining,true);assert.equal(hits.length,0);
  e.attacks=[];e.begin('hydro');tick(e.attack.warn+.05);assert.equal(hits.length,1);assert.ok(Math.abs(hits[0][1]-58*1.15)<1e-9);
  e.attacks=[];e.cooldown=99;tick(1);e.begin('ice');tick(e.attack.warn+.05);
  assert.equal(hits[1][1],40);assert.equal(hits[1][2],'ice');assert.equal(hits[1][3].slow,.7);
  const clock=e.clock,rain=e.rainUntil;e.update(0);e.update(NaN);assert.equal(e.clock,clock);assert.equal(e.rainUntil,rain);
  boss.dead=true;tick(.01);assert.equal(e.raining,false);assert.equal(e.attacks.length,0);
  assert.equal(e.begin('surf'),false);const count=hits.length;tick(10);assert.equal(hits.length,count);
});
test('Concurrent water and ice impacts share damage grace and preserve the ice effect',()=>{
  const f=fixture({phase:3}),{e,hits,tick}=f;e.beginCombo(['hydro','ice']);const warn=e.attack.warn;
  tick(warn-.03);assert.equal(hits.length,0);tick(.08);assert.equal(hits.length,1);
  assert.equal(hits[0][1],58);assert.equal(hits[0][3].slow,.7);tick(.5);assert.equal(hits.length,1);
});
test('Origin Pulse gives each of four separated teammates a nearby refuge and never combines with another move',()=>{
  for(const height of [560,1920]){
    const f=fixture({phase:3,height}),{e,ps,p,G,hits,tick}=f;
    ps.length=0;const r=G.Groudon.ARENA;
    for(const sx of [-1,1])for(const sy of [-1,1])ps.push({...p,x:sx*(r.right-36),y:sy*(r.bottom-36),r:30});
    assert.equal(e.beginCombo(['pulse','ice']),false);e.begin('pulse');
    assert.ok(e.attack.safes.length>=2);
    for(const q of ps){const escape=e.findEscape(q);assert.ok(escape&&escape.distance/130+.22<=e.attack.warn);q.x=escape.x;q.y=escape.y;}
    tick(e.attack.warn+.56);assert.equal(hits.length,0);assert.equal(e.recovering,true);
  }
});
test('Kyogre moves between casts, attacks early, and progresses from singles to doubles and triples',()=>{
  for(const phase of [1,2,3]){
    const f=fixture({phase}),{e,boss,p,events,tick}=f;p.x=300;const x=boss.x;tick(.4);assert.ok(boss.x>x);
    tick(30);const casts=events.filter(ev=>ev[0]==='attack');assert.ok(casts.length>=6);
    assert.equal(casts[0][1].kind,'rain');
    assert.ok(casts.some(ev=>(ev[1].comboName||'').split(' + ').length===phase));
    assert.ok(!events.some(ev=>ev[0]==='recoil'));
  }
});
