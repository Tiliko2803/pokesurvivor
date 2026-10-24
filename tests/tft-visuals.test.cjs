'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
function fixture(){
 const calls=[],images=[];
 const canvasContext=()=>new Proxy({globalAlpha:1},{get(o,k){if(k in o)return o[k];return (...args)=>{calls.push({kind:k,args});};},set(o,k,v){o[k]=v;return true;}});
 class Image {set src(v){images.push(v);this.width=256;this.height=256;this.onload?.();}}
 const G={},ctx=vm.createContext({G,window:{G},console,Date,Image,performance:{now:()=>0},document:{createElement:()=>({getContext:canvasContext})}});
 for(const f of ['js/core/util.js','js/data/pokedex.js','js/data/sprites-meta.js','js/data/enemies.js','js/data/types.js','js/data/moves.js','js/core/sprites.js','js/entities/vfx.js','js/tft/engine.js','js/tft/visuals.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
 G.FX=new Proxy({}, {get(){throw Error('TFT must not access Survivor global FX pools');}});
 return {G,E:G.TFT,V:G.TFTVisuals,calls,images,ctx:canvasContext()};
}
test('TFT resolves the existing Survivor visual vocabulary and uses actual TFT damage types',()=>{
 const {V}=fixture(),u={dex:7,star:1,types:['water'],range:1};
 assert.equal(V.style(u,{kind:'spell',move:'Burbuja',type:'water'}).proj,'bubble');
 assert.equal(V.style(u,{kind:'spell',move:'Ascuas',type:'fire'}).proj,'fire');
 assert.equal(V.style(u,{kind:'spell',move:'Rayo',type:'electric'}).beam,'lightning');
 assert.equal(V.style(u,{kind:'spell',move:'Esfera Aural',type:'fighting'}).pal,'aura');
 assert.equal(V.style(u,{kind:'spell',move:'Disparo Lodo',type:'ground'}).pal,'ground');
 assert.equal(V.style(u,{kind:'spell',move:'Puño Meteoro',type:'steel'}).meteor,true);
});
test('every roster rank has a real available pose and can prewarm its local sprite sheets',()=>{
 const {G,E,V,images}=fixture();
 for(const family of E.ROSTER)for(let star=1;star<=3;star++){
  const dex=E.evolvedDex(family.dex,star),u={dex,star,range:family.role==='fighter'?1:3};
  for(const kind of ['hit','cast','drill']){
   const plan=V.animation(u,{kind});assert.ok(plan.length>=1&&plan.length<=2);
   for(const step of plan){assert.ok(G.Sprites.meta(dex).a[step.name],dex+' '+step.name);assert.ok(Number.isFinite(V.animationSpeed(dex,step.name,step.duration)));}
  }
 }
 V.warm([...[...E.ROSTER,...E.BOSS_DEFINITIONS].flatMap(f=>f.line.map(dex=>({dex}))),{dex:4},{dex:530}]);assert.equal(images.length,new Set(images).size,'each sheet requested once');
 assert.ok(images.some(p=>p.endsWith('/Attack.png')));assert.ok(images.some(p=>p.endsWith('/Shoot.png')));
 for(const p of images)assert.ok(fs.existsSync(path.join(root,p)),'local asset '+p);
});
test('one area cast animates once while periodic burn only animates the victim',()=>{
 const {V}=fixture(),events=[{kind:'hit',from:1,to:2},{kind:'cast',from:1,to:2},{kind:'spell',from:1,to:2},{kind:'spell',from:1,to:3},{kind:'spell',from:4,to:2,periodic:true}];
 const before=JSON.stringify(events),plan=V.actions(events);
 assert.equal(plan.actions.size,1);assert.equal(plan.actions.get(1).e.kind,'cast');assert.ok(plan.hurt.has(2)&&plan.hurt.has(3));assert.equal(JSON.stringify(events),before);
});
test('real Survivor sprites draw every TFT event without changing combat state or global FX',()=>{
 const {E,V,ctx,calls}=fixture(),s=E.create(1,E.DEFAULT_DECK),units=[{id:1,dex:4,star:1,x:2,y:3,range:3,types:['fire']},{id:-1,dex:7,star:1,x:2,y:2,range:1,types:['water']}];
 const base={from:1,to:-1,sx:2,sy:3,tx:2,ty:2,type:'fire',ttl:.3},events=[
  {...base,kind:'hit'},{...base,kind:'spell',move:'Ascuas'},{...base,kind:'spell',periodic:true},
  {...base,kind:'heal'},{...base,kind:'shield'},{...base,kind:'beam',move:'Hidrobomba',type:'water'},
  {...base,kind:'drill',type:'ground'},{...base,kind:'area',x:2,y:3,radius:2,type:'ground'},
  {...base,kind:'spell',move:'Cometa Draco',type:'dragon'}];
 const before=JSON.stringify({s,units,events});
 for(const e of events){const start=calls.length;V.draw(ctx,e,units,{quality:2});assert.ok(calls.slice(start).some(c=>c.kind==='drawImage'),e.kind);}
 assert.equal(JSON.stringify({s,units,events}),before);
 assert.equal(calls.filter(c=>c.kind==='save').length,calls.filter(c=>c.kind==='restore').length);
});
test('low graphics and calm mode reduce sprite work; progress remains fixed while paused',()=>{
 const {V,ctx,calls}=fixture(),units=[{id:1,dex:4,star:1,x:2,y:3,range:3,types:['fire']}],e={kind:'area',from:1,x:2,y:3,type:'ground',radius:3,ttl:.4};
 const count=options=>{calls.length=0;V.draw(ctx,e,units,options);return calls.filter(c=>c.kind==='drawImage').length;};
 const full=count({quality:2}),low=count({quality:0}),calm=count({quality:2,calm:true});assert.ok(full>low&&low>calm);
 const p=V.progress(e);V.draw(ctx,e,units);assert.equal(V.progress(e),p);assert.equal(V.progress({...e,ttl:0}),1);
});

test('CC highlights only living affected enemies and never friendly occupied cells',()=>{
 const {V}=fixture(),units=[{id:1,side:0,hp:100,x:2,y:2},{id:2,side:0,hp:100,x:3,y:2,stunUntil:4},{id:-1,side:1,hp:100,x:2,y:1,stunUntil:.8},{id:-2,side:1,hp:100,x:3,y:1},{id:-3,side:1,hp:0,x:1,y:1,stunUntil:4}];
 const area={kind:'area',from:1,control:true,targets:[2,-1,-2,-3],x:2,y:2,radius:2};
 assert.equal(JSON.stringify(V.areaCells(area,units,.1)),JSON.stringify([8]));assert.equal(V.areaCells(area,units,.9).length,0,'expired CC loses its highlight');
});

test('attack anticipation and impact recoil are stateless, pause-stable and disabled in calm mode',()=>{
 const {V}=fixture(),u={dex:4,range:1,x:2,y:3},e={kind:'hit',from:1,to:2,sx:2,sy:3,tx:2,ty:2,ttl:.3},hurt={...e,ttl:.2};
 const before=JSON.stringify({u,e,hurt}),p=V.pose(u,e,hurt);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.scale>.8&&p.scale<1.2);assert.notEqual(p.y,0);
 assert.equal(JSON.stringify(V.pose(u,e,hurt)),JSON.stringify(p));assert.equal(JSON.stringify({u,e,hurt}),before);
 assert.equal(JSON.stringify(V.pose(u,e,hurt,{calm:true})),JSON.stringify({x:0,y:0,scale:1,flash:0}));
 const long={...e,tx:5,ty:0,ttl:.3};assert.equal(V.impact(long),0);assert.ok(V.impact({...long,ttl:.1})>0);assert.ok(V.impact({...long,periodic:true})>0);
});

test('boss camera is deterministic, centres on the boss and removes motion in calm mode',()=>{
 const {G}=fixture(),V=G.TFTVisuals,b={intro:2.8,units:[{boss:true,x:1,y:1}]};
 const initial=V.bossCamera(b);assert.equal(initial.zoom,1);assert.equal(initial.x,0);assert.equal(initial.active,true);
 b.intro=1.4;const before=JSON.stringify(b),camera=V.bossCamera(b);assert.equal(JSON.stringify(b),before);assert.ok(camera.zoom>2);assert.ok(Math.abs(150*camera.zoom+camera.x-300)<1e-8);
 assert.equal(V.bossCamera(b,true).zoom,1);assert.equal(V.bossCamera(b,true).x,0);assert.equal(V.bossCamera(b,true).reveal,1);
 b.intro=0;assert.equal(V.bossCamera(b).active,false);assert.equal(V.bossCamera(null).zoom,1);
});
test('rework mouse volleys and flights render without changing simulation and flight respects reduced motion',()=>{
 const {V,ctx,calls}=fixture(),units=[{id:1,dex:925,star:3,x:2,y:3,types:['normal'],range:1},{id:-1,dex:133,star:1,x:2,y:2,types:['normal'],range:1}];
 for(const e of [{kind:'spell',mouse:2,life:.65,ttl:.3},{kind:'flight',ttl:.3}]){
  Object.assign(e,{from:1,to:-1,sx:2,sy:3,tx:2,ty:2,type:'normal'});const before=JSON.stringify(e);V.draw(ctx,e,units);assert.equal(JSON.stringify(e),before);
 }
 assert.ok(calls.some(c=>c.kind==='ellipse'));
 const flight={kind:'flight',from:1,sx:2,sy:3,tx:2,ty:0,ttl:.3};assert.ok(V.pose(units[0],flight,null).y<-50);assert.equal(V.pose(units[0],flight,null,{calm:true}).y,0);
});
test('second tactical wave renders rescue portals, ambush, hammer warning and Bullet Punch in calm and full modes',()=>{
 const {V,ctx,calls}=fixture(),units=[{id:1,dex:212,star:3,x:2,y:3,types:['steel'],range:1},{id:-1,dex:7,star:1,x:2,y:2,types:['water'],range:1}];
 const events=[{kind:'rescue',move:'Rescate',type:'fairy',ttl:.4},{kind:'blink',type:'ghost',ttl:.3},{kind:'warning',type:'steel',x:2,y:2,radius:1,ttl:.5,life:1},{kind:'spell',type:'steel',move:'Puño Bala',bullet:1,ttl:.3}];
 for(const e of events){Object.assign(e,{from:1,to:-1,sx:2,sy:3,tx:2,ty:2});const before=JSON.stringify(e);for(const calm of [false,true]){const count=calls.length;V.draw(ctx,e,units,{calm});assert.ok(calls.length>count);}assert.equal(JSON.stringify(e),before);}
 assert.equal(V.areaCells(events[2],units).length,5);assert.equal(calls.filter(c=>c.kind==='save').length,calls.filter(c=>c.kind==='restore').length);
});
