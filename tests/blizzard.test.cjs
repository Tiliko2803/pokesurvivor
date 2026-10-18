'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),noop=()=>{},near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
function fixture(){
 const G={},ctx=vm.createContext({G,window:{G},performance:{now:()=>0}});
 for(const f of ['js/core/util.js','js/data/pokedex.js','js/data/starters.js','js/data/moves.js','js/data/upgrades.js','js/data/coverage-data.js','js/systems/coverage.js','js/systems/repertoire.js','js/systems/levelup.js','js/systems/combat.js','js/entities/player.js'])
  vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
 const particles=[];G.VFX={forMove:()=>({aura:'snowflake',pal:'ice'}),spins:()=>true};
 G.FX={ring:noop,sp:(...args)=>particles.push(args),burst:noop};G.Audio={sfx:noop};G.Progress={event:noop};G.Coop={active:false};
 G.Types={mult:()=>1,label:()=>null};G.Weather={mult:()=>1};G.World={propsInCircle:()=>[]};
 const p={mon:G.DEX_BY[260],x:0,y:0,aim:0,atk:2,cdMul:1,moves:[],slots:[],maxMoves:4,statsTaken:{},banned:new Set(),cast:noop,
  activeGroup(){return this.moves;},onDealt:noop,dmgDealt:0,critChance:0};
 return {G,ctx,p,particles};
}
test('Nieve Polvo conserva sus niveles y evoluciona con Carrera a Ventisca de área',()=>{
 const {G,p}=fixture();for(let lvl=1;lvl<5;lvl++)assert.equal(G.Moves.evoInfo(G.Moves.instance('powder-snow',lvl),{spd:1}),null);
 const m=G.Moves.instance('powder-snow',5);p.moves=[m];p.slots=[[m]];
 assert.equal(G.Moves.evoInfo(m,{}).ready,false);assert.equal(G.Moves.evoInfo(m,{atk:1}).ready,false);
 const info=G.Moves.evoInfo(m,{spd:1});assert.equal(info.name,'Ventisca');assert.equal(info.ready,true);
 const original={dmg:m.dmg,radius:m.radius,cd:m.cd};G.Moves.evolve(m);
 assert.equal(m.kind,'aura');assert.equal(m.name,'Ventisca');near(m.dmg,original.dmg*1.8);near(m.radius,original.radius*1.5);near(m.cd,original.cd);near(m.slow,0.65);
 assert.equal(G.Moves.evolve(m),false);assert.equal(G.Moves.evoInfo(m,{spd:1}),null);
});
test('Ventisca golpea en 360°, respeta el radio y aplica el 65% de ralentización',()=>{
 const {G,p,particles}=fixture(),m=G.Moves.instance('powder-snow',5);G.Moves.evolve(m);p.moves=[m];
 const hits=[],slows=[];const enemies=[0,Math.PI/2,Math.PI,Math.PI*1.5].map((a,i)=>({id:i,x:Math.cos(a)*(m.radius-1),y:Math.sin(a)*(m.radius-1),types:['normal'],hurt:d=>hits.push(d),applySlow:n=>slows.push(n)}));
 enemies.push({id:5,x:m.radius+1,y:0,types:['normal'],hurt:()=>assert.fail('outside target hit'),applySlow:noop});
 G.EnemyMgr={queryCircle:(x,y,r)=>enemies.filter(e=>Math.hypot(e.x-x,e.y-y)<=r)};G.Combat.tick(0,p,0);
 assert.equal(hits.length,4);hits.forEach(d=>near(d,m.dmg*p.atk));assert.deepEqual(slows,[0.65,0.65,0.65,0.65]);
 assert.equal(particles.length,14);assert.ok(particles.every(args=>args[0]==='snowflake'&&args[1]==='ice'));
});
test('Expansión aumenta Ventisca una sola vez; el fantasma conserva área sin duplicar daño',()=>{
 const {G,p}=fixture(),m=G.Moves.instance('powder-snow',5);G.Moves.evolve(m);p.moves=[m];p.areaMul=1.2;
 let radius=0;G.EnemyMgr={queryCircle:(_x,_y,r)=>{radius=r;return []}};
 G.Combat.tick(0,p,0);near(radius,m.radius*1.2);m.t=0;G.Combat.tick(0,p,1);near(radius,m.radius*1.2);
 radius=0;G.Combat.ghostCast(p,'powder-snow',5,0,true,1.2,1);assert.equal(radius,0);
});
test('Rayo Hielo evoluciona a Rayo Polar con los mismos números y familia de rayo',()=>{
 const {G}=fixture(),m=G.Moves.instance('ice-beam',5),before={dmg:m.dmg,radius:m.radius,width:m.width,cd:m.cd};
 assert.equal(G.Moves.evoInfo(m,{atk:1}).name,'Rayo Polar');G.Moves.evolve(m);assert.equal(m.kind,'beam');assert.equal(m.name,'Rayo Polar');
 near(m.dmg,before.dmg*1.8);near(m.radius,before.radius*1.2);near(m.width,before.width*1.5);near(m.cd,before.cd*0.85);
 const n=G.Moves.instance('bulldoze',5);assert.equal(G.Moves.evoInfo(n,{atk:1}).name,'Terremoto');
});
test('Swampert puede elegir Nieve Polvo por su compatibilidad con Ventisca; Veto y Repertorio la respetan',()=>{
 const {G}=fixture(),mon=G.DEX_BY[260],s={pupg:{260:{coverage:1,moves:1,ban:1}},pcoverage:{},pban:{}};
 assert.deepEqual(JSON.parse(JSON.stringify(G.CoverageData.families)),{'powder-snow':['blizzard']});
 assert.ok(G.Coverage.eligible(mon).includes('powder-snow'));assert.ok(!G.Coverage.eligible(G.DEX_BY[257]).includes('powder-snow'));
 assert.equal(G.Coverage.choose(mon,s,['powder-snow']),true);assert.equal(G.Repertoire.choose(mon,s,'powder-snow'),true);assert.equal(G.Repertoire.selected(mon,s),'powder-snow');
 s.pban[260]=['powder-snow'];assert.equal(G.Repertoire.selected(mon,s),null);
});
test('El copo nativo tiene dos fotogramas de píxeles definidos y conserva transparencia',()=>{
 const {G,ctx}=fixture();G.Sprites={PX:2};vm.runInContext(fs.readFileSync(path.join(root,'js/entities/vfx.js'),'utf8'),ctx);
 const shape=G.VFX.SHAPES.snowflake;assert.equal(shape.w,11);assert.equal(shape.h,11);assert.equal(shape.frames,2);
 const frames=[];for(let f=0;f<2;f++){
  const grid=Array.from({length:11},()=>Array(11).fill(null));shape.gen({set(x,y,c){assert.ok(x>=0&&x<11&&y>=0&&y<11);grid[y][x]=c;}},f);
  assert.equal(grid[0][0],null);assert.equal(grid[5][5],'w');assert.ok(grid.flat().filter(Boolean).length>25);frames.push(grid);
 }
 assert.notDeepEqual(frames[0],frames[1]);assert.equal(G.VFX.forMove(G.Moves.instance('powder-snow')).aura,'snowflake');
});
test('Ventisca y Terremoto vinculados se ejecutan juntos sin ocupar más huecos',()=>{
 const {G}=fixture();G.Sprites={Animator:class{},bodyRadius:()=>10,bodyHeight:()=>30};G.Projectiles={clearOrbs:noop};
 const p=new G.Player(G.DEX_BY[260]);p.cast=noop;p.addMove('bulldoze');p.addMove('powder-snow');
 for(const m of p.moves){while(m.lvl<m.def.maxLvl)G.Moves.levelUp(m);G.Moves.evolve(m);m.t=0;}
 p.bonds=1;p.fuse(p.moves.slice());assert.equal(p.slots.length,1);assert.equal(p.slots[0].length,2);assert.equal(p.maxMoves,4);
 const hits=[],slow=[];const enemy={x:20,y:0,types:['normal'],hurt:d=>hits.push(d),applySlow:n=>slow.push(n)};
 G.EnemyMgr={queryCircle:()=>[enemy]};G.Combat.tick(0,p,0);
 assert.equal(hits.length,2);near(hits.reduce((a,b)=>a+b,0),p.moves.reduce((a,m)=>a+m.dmg*p.atk,0));
 assert.ok(slow.includes(0.65));assert.ok(p.moves.every(m=>m.t>0));
});
