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
 V.warm([{dex:4},{dex:4},{dex:530}]);assert.equal(images.length,new Set(images).size,'each sheet requested once');
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
