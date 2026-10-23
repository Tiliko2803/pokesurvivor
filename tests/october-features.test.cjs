'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {fixture}=require('./helpers/boss-rush-fixture.cjs');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`),noop=()=>{};
function setup(dex=68){const f=fixture(null,{live:true}),{G}=f;G.DB.playAsGuest();G.DB.save.partner=dex;G.DB.save.owned[dex]={at:1};G.Game.startRun();return {...f,p:G.Game.player};}
test('All 966 Pokémon have physical/special attack and bounded defenses; the stronger side retains original damage',()=>{
 const {G}=setup();for(const mon of G.DEX){for(const k of ['pa','sa','df','sd'])assert.ok(Number.isFinite(mon[k])&&mon[k]>0,`${mon.dex} ${k}`);near(Math.max(mon.pa,mon.sa),mon.atk);for(const cat of ['physical','special']){assert.ok(G.Stats.fit(mon,cat)>0&&G.Stats.fit(mon,cat)<=1);assert.ok(G.Stats.taken(mon,cat)>=.78&&G.Stats.taken(mon,cat)<=1.25);}}
});
test('Dances boost only physical attack; Nasty Plot boosts special; monotypes gain exactly 20% with their own type',()=>{
 const {G,p}=setup(68),before=p.atkFor({cat:'special'});p.addBuff('patk',.25,10,5);near(p.atkFor({cat:'special'}),before);near(p.atkFor({cat:'physical'}),p.atk*1.25);p.addBuff('satk',.3,10,5);near(p.atkFor({cat:'special'}),before*1.3);
 const q=new G.Player(G.DEX_BY[25],{});near(q.atkFor({cat:'special',type:'electric'}),q.atk*G.Stats.fit(q.mon,'special')*1.2);near(q.atkFor({cat:'special',type:'normal'}),q.atk*G.Stats.fit(q.mon,'special'));
 assert.equal(G.Moves.BY_ID['nasty-plot'].stat,'satk');
});
test('Mega Tinkaton applies special attack once and final physical Potencia once; custom missions remain equipped',()=>{
 const {G}=setup(959),save=G.DB.save;save.megaStones.tinkatonite=1;G.Mega.equip(save,959,true);const mon=G.Mega.form(G.DEX_BY[959],save),p=new G.Player(mon,{});
 near(p.atkFor({cat:'physical'}),1.47);near(p.atkFor({cat:'special'}),1.08);near(G.Mega.damageMultiplier(p,G.Moves.instance('gigaton-hammer')),2);near(G.Mega.damageMultiplier(p,G.Moves.instance('flash-cannon')),1);
 assert.equal(G.Moves.evoInfo(G.Moves.instance('play-rough',5),{rgn:1}).name,'Beso Drenaje');
});
test('Move catalog has unique ids, five attacks per type, and all 37 newly added ids execute and evolve without invalid projectiles',()=>{
 const f=setup(),{G,p}=f;
 assert.equal(new Set(G.Moves.ALL.map(m=>m.id)).size,G.Moves.ALL.length);
 for(const type of Object.keys(G.U.TYPE_NAME))assert.ok((G.Moves.POOL[type]||[]).length>=5,type);
 const beforeSrc=require('node:child_process').execFileSync('git',['show','d67a3a98:js/data/moves.js'],{cwd:path.join(__dirname,'..')}).toString(),old={};vm.runInNewContext(beforeSrc,{G:old});const oldIds=new Set(old.Moves.ALL.map(m=>m.id));const added=G.Moves.ALL.filter(m=>!oldIds.has(m.id)&&m.id!=='nasty-plot');assert.equal(added.length,37);
 G.FX=new Proxy({},{get:()=>noop});G.VFX={forMove:()=>({}),forType:()=>({}),spins:()=>false};
 for(const def of added){for(const evolved of [false,true]){
  G.Projectiles.clear();G.Combat.clearFields();G.EnemyMgr.clear();const target=new G.Enemy({dex:19,hp:10000,spd:1,dmg:1,xp:1,behavior:'chase'},90,0,{hp:1,spd:1,dmg:1});G.EnemyMgr.add(target);G.EnemyMgr.rebuildGrid();
  const m=G.Moves.instance(def.id,5);if(evolved)assert.equal(G.Moves.evolve(m),true,def.id);p.moves=[m];p.slots=[[m]];p.active=0;p.target=target;p.aim=0;p.cast=noop;
  G.Combat.tick(0,p,0);for(let i=0;i<80;i++)G.Combat.updateFields(.025);
  for(const shot of G.Projectiles.all())for(const k of (shot.orb?['x','y','dmg']:['x','y','vx','vy','dmg','life']))assert.ok(Number.isFinite(shot[k]),`${def.id} ${k}`);
 }}
});
test('New homing/bounce evolutions count their original projectile and keep the first projectile centered',()=>{
 const {G,p}=setup();p.cast=noop;p.aim=.7;p.target={x:100,y:80};for(const def of G.Moves.ALL.filter(m=>['homing','bounce'].includes(m.kind))){const m=G.Moves.instance(def.id,5),count=m.count;G.Moves.evolve(m);assert.equal(m.count,count+(def.kind==='homing'?2:1));p.moves=[m];p.slots=[[m]];p.active=0;G.Projectiles.clear();G.Combat.tick(0,p,0);assert.equal(G.Projectiles.all().length,m.count);near(Math.atan2(G.Projectiles.all()[0].vy,G.Projectiles.all()[0].vx),p.aim);}
});
test('Starting move selection requires its upgrade, survives saving, includes off-type defaults, and learning preserves active slot',()=>{
 const {G,p}=setup(54);assert.ok(G.startChoices(54).includes(G.baseStartOf(54)));G.DB.save.pstart[54]='water-gun';assert.equal(G.startMoveOf(54),G.baseStartOf(54));G.DB.save.pupg[54]={start:1};assert.equal(G.startMoveOf(54),'water-gun');G.DB.commit();assert.equal(G.DB.save.pstart[54],'water-gun');
 const active=p.active;p.addMove('tackle');assert.equal(p.active,active);assert.ok(p.moves.every(m=>Number.isFinite(m.since)));
});
test('Healer, shielder and summoner each cap at three; replacing capped supports still spawns regular enemies',()=>{
 for(const behavior of ['healer','shielder','summoner']){const f=setup(),{G,p}=f;G.Enemies={BOSSES:[],rollRun:noop,upcomingDex:()=>[],bagAt:()=>[{dex:19,hp:50,spd:1,dmg:1,xp:1,behavior},{dex:19,hp:50,spd:1,dmg:1,xp:1,behavior:'chase'}],scale:()=>({hp:1,spd:1,dmg:1})};G.U.pick=a=>a[0];G.Coop.scaleRate=()=>1;G.Coop.scaleHp=()=>1;G.World.isFree=()=>true;f.load('js/systems/spawner.js');G.Spawner.reset();for(let i=0;i<20;i++)G.Spawner.update(1,[p],i);assert.equal(G.EnemyMgr.all().filter(e=>e.behavior===behavior).length,3);assert.ok(G.EnemyMgr.all().some(e=>e.behavior==='chase'));}
});
test('Boss healing and shielding are limited by recent DPS and have a shared 6-second shield interval',()=>{
 const {G}=setup();const boss=new G.Enemy({dex:95,hp:20000,spd:1,dmg:1,xp:1,behavior:'chase'},0,0,{hp:1,spd:1,dmg:1},true),healer=new G.Enemy({dex:113,hp:100,spd:1,dmg:1,xp:1,behavior:'healer'},0,0,{hp:1,spd:1,dmg:1});
 G.EnemyMgr.add(boss);G.EnemyMgr.rebuildGrid();boss.hurt(600);const hp=boss.hp;healer.healAround();assert.ok(boss.hp-hp<=40);healer.castShields();assert.ok(boss.shield<=120);const shield=boss.shield;boss.rd=6000;healer.castShields();assert.equal(boss.shield,shield);boss.shieldT=2;healer.castShields();assert.ok(boss.shield>shield);
});
test('Large normal sprites shrink and collisions cap at 18; special character display sizes remain unchanged',()=>{
 const f=setup(),{G}=f;f.load('js/core/sprites.js');assert.ok(G.Sprites.playerScale(95)<1);assert.ok(G.Sprites.playerRadius(95)<=18);f.load('js/data/toji.js');assert.equal(new G.Player(G.Toji.mon,{}).scale,1);
});
test('Arceus soft speed cap applies only in Judgment and pure damage ignores physical/special defense',()=>{
 const {G,p}=setup();G.World.liquidEffect=()=>({});G.Weather.speedFor=()=>1;p.baseSpd=300;near(p.spd,300);G.Judgment.active=true;G.Judgment.capSpd=s=>130+(s-130)*.25;near(p.spd,172.5);p.invuln=0;const hp=p.hp;p.hurt(10,null,true,false,'physical');near(p.hp,hp-10);
});
test('Pause summary renders real move damage and its DPS without losing area/mega damage attribution',()=>{
 const f=setup(68),{G,p,ctx}=f;G.Icons={html:()=>''};G.Items={BY:{}};f.load('js/ui/run-ui.js');p.areaMul=1.2;p.moves=[];p.slots=[];p.addMove('karate-chop');p.target={x:20,y:0};p.aim=0;p.cast=noop;
 const target={x:20,y:0,r:8,hp:10000,mon:{df:75,sd:75},types:['normal'],hurt(d){this.hp-=d;}};G.EnemyMgr.queryCircle=()=>[target];G.Combat.tick(0,p,0);assert.ok(p.moves[0].dealt>0);G.Game={...G.Game,st:{time:10}};G.RunUI.showPause();const summary=f.nodes.get('pause-sum').innerHTML;assert.match(summary,/Tus ataques/);assert.match(summary,/Físico/);assert.match(summary,/Por segundo/);assert.doesNotMatch(summary,/NaN|undefined/);
});
test('Newly shown level, item and bond cards reject accidental picks for 600ms',()=>{
 let clock=0;const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{classList:{add:noop,remove:noop,toggle:noop},children:[],appendChild(n){this.children.push(n);},querySelector:()=>({classList:{add:noop}}),innerHTML:'',textContent:''});return nodes.get(id);};
 const G={I18n:{t:s=>s},UI:{$:node,show:noop,hide:noop},Game:{player:{rerolls:0,rerollBonus:0}},Icons:{html:()=>''},Audio:{sfx:noop},Items:{BY:{berry:{name:'Baya',desc:'Cura'}}},U:{TYPE_COLOR:{normal:'#fff'},TYPE_NAME:{normal:'Normal'}}};
 const ctx=vm.createContext({G,performance:{now:()=>clock},setTimeout:()=>1,clearTimeout:noop,document:{createElement:()=>({dataset:{},classList:{add:noop,remove:noop}}),querySelectorAll:()=>[]}});vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/ui/run-ui.js'),'utf8'),ctx);
 let picked=0;G.RunUI.showLevelUp(2,[{title:'Potencia',desc:'Daño',icon:'fist'}],()=>picked++);G.RunUI.pick(0);assert.equal(picked,0);clock=601;G.RunUI.pick(0);assert.equal(picked,1);
 G.RunUI.showItemChoice('berry','berry',()=>picked++);const item=node('item-cards').children.at(-1);item.onclick();assert.equal(picked,1);clock+=601;item.onclick();assert.equal(picked,2);
});
test('Poison retains normal scaling up to 60k HP and grows with square-root effective HP beyond it',()=>{
 const {G,p}=setup();for(const [hp,effective]of [[60000,60000],[240000,120000],[6000000,600000]]){const e=new G.Enemy({dex:19,hp,spd:0,dmg:1,xp:1,behavior:'chase'},0,0,{hp:1,spd:1,dmg:1});let dealt=0;e.hurt=d=>dealt+=d;e.applyPoison(1);e.stunT=1;e.update(.01,p);near(dealt,effective*.012+1);}
});
test('Lost non-Judgment bosses return near a living player after four seconds without healing',()=>{
 const {G,p}=setup();const e=new G.Enemy({dex:95,hp:10000,spd:0,dmg:1,xp:1,behavior:'chase'},5000,5000,{hp:1,spd:1,dmg:1},true);e.update=noop;e.hp=1234;G.EnemyMgr.add(e);let returned=0;G.Spawner.ahead=(enemy,near)=>{returned++;enemy.x=near.x+200;enemy.y=near.y;return true;};for(let i=0;i<8;i++)G.EnemyMgr.update(.5,[p]);assert.equal(returned,0);G.EnemyMgr.update(.5,[p]);assert.equal(returned,1);assert.equal(e.hp,1234);
});
test('Final report reuses pause details and freezes Judgment-adjusted stats before run cleanup',()=>{
 const f=setup(68),{G,p}=f;G.Icons={html:()=>''};G.Items={BY:{}};const get=G.UI.$;G.UI.$=id=>id==='over-ask'?null:get(id);f.load('js/ui/run-ui.js');
 p.moves[0].dealt=12345;p.baseSpd=300;G.Judgment.active=true;G.Judgment.capSpd=s=>130+(s-130)*.25;G.Judgment.reset=()=>{G.Judgment.active=false;};
 const expected=G.RunUI.runSummary(p,G.Game.st.time);G.RunUI.showPause();assert.equal(f.nodes.get('pause-sum').innerHTML,expected);
 let report;const show=G.RunUI.showOver;G.RunUI.showOver=(r,back)=>{report=r;show(r,back);};G.Game.quit();assert.equal(G.Game.state,'over');
 assert.equal(report.summaryHtml,expected);assert.equal(f.nodes.get('over-summary').innerHTML,expected);assert.match(expected,/Tus ataques|Por segundo/);assert.match(expected,/12[.,]345/);assert.notEqual(G.RunUI.runSummary(),expected,'effective speed changes after Judgment cleanup');
});
test('Defeat report includes zero remaining HP, final attacks, item and cards',()=>{
 const f=setup(68),{G,p}=f;G.Icons={html:()=>''};G.Items={BY:{leftovers:{name:'Restos',desc:'Regeneración'}}};const get=G.UI.$;G.UI.$=id=>id==='over-ask'?null:get(id);f.load('js/ui/run-ui.js');
 p.item='leftovers';p.statsTaken.atk=3;p.hp=0;p.dead=true;f.tick(82);assert.equal(G.Game.state,'over');const html=f.nodes.get('over-summary').innerHTML;assert.match(html,/Vida/);assert.match(html,/>0 \/ /);assert.match(html,/Restos/);assert.match(html,/Potencia ×3/);assert.match(html,/Tus ataques/);assert.doesNotMatch(html,/NaN|undefined/);
});
