'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const noop=()=>{},root=path.join(__dirname,'..');
function fixture(){
 const G={Challenges:{mergeProgress:(a,b)=>({...a,...b})}};
 const ctx=vm.createContext({G,window:{G},console,performance:{now:()=>0},Image:class{},
  localStorage:{getItem:()=>null,setItem:noop,removeItem:noop}});
 const load=f=>vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
 for(const f of ['js/core/util.js','js/data/pokedex.js','js/data/moves.js','js/data/types.js','js/data/starters.js','js/data/upgrades.js','js/systems/mega.js','js/systems/repertoire.js','js/core/db.js'])load(f);
 G.Sprites={hasShiny:()=>true,bodyHeight:()=>60,bodyRadius:()=>12,animMeta:()=>({d:[6,6]}),Animator:class{
  update(){}loop(){}play(){}draw(){}busy(){return false;}progress(){return 1;}
 }};
 G.MegaArt={Animator:G.Sprites.Animator};load('js/systems/tinkaton.js');load('js/entities/player.js');
 G.Coop={active:false};G.World={propsInCircle:()=>[],isWall:()=>false};G.Weather={mult:()=>1};
 G.FX=new Proxy({},{get:()=>noop});G.Audio={sfx:noop};G.Camera={kick:noop,sees:()=>true};
 G.VFX={forMove:()=>({pal:'steel',proj:'orb'})};G.EnemyMgr={queryCircle:()=>[]};
 const shots=[];G.Projectiles={spawn:p=>shots.push(p),all:()=>shots};load('js/systems/combat.js');
 return {G,shots};
}
const save=()=>({owned:{959:{at:1}},upgrades:{},stats:{},pity:{},coins:0,tickets:{t1:0,t10:0}});
function player(G){const s={...save(),megaStones:{tinkatonite:1},megaEquipped:{959:'tinkatonite'}};
 return new G.Player(G.Mega.form(G.DEX_BY[959],s),{atkMul:3});}
test('Tinkatonita: three bosses in a single solo run, independent equip and cross-device merge',()=>{
 const {G}=fixture(),s=save(),p={dex:959,mon:G.DEX_BY[959],bosses:2};
 assert.equal(G.Mega.equip(s,959,true),false);
 assert.equal(G.Mega.finishRun(s,p,{clean:true}),false);p.bosses=3;
 for(const opts of [{clean:true,coop:true},{clean:true,challenge:true},{clean:false}])assert.equal(G.Mega.finishRun(s,p,opts),false);
 assert.equal(G.Mega.finishRun(s,{...p,mega:'tinkatonite'},{clean:true}),false);
 assert.equal(G.Mega.finishRun(s,p,{clean:true}),true);assert.equal(G.Mega.equip(s,959,true),true);
 const later={...save(),updated:2,megaProgress:{tinkatonBosses:1},megaEquipped:{959:'tinkatonite'}};
 s.updated=1;const merged=G.DB.merge(s,later);
 assert.equal(merged.megaProgress.tinkatonBosses,3);assert.ok(G.Mega.has(merged,959));assert.ok(G.Mega.equipped(merged,959));
});
test('Agreed base stats total 606; conversion preserves HP/speed and never bakes Potencia into Attack',()=>{
 const {G}=fixture(),p=player(G),m=p.mon;
 assert.deepEqual(JSON.parse(JSON.stringify(m.baseStats)),{hp:85,atk:140,def:97,spa:70,spd:120,spe:94});
 assert.equal(m.bst,606);assert.equal(m.hp,108);assert.equal(m.spd,117);assert.equal(m.atk,1.47);assert.equal(m.specialAtk,1.08);
 assert.equal(p.atk,1.47*3);assert.equal(p.shiny,false);assert.equal(p.reduction,.08);
 assert.equal(G.Repertoire.initialMove(m),'gigaton-hammer');
 assert.ok(G.Moves.poolFor(m).includes('gigaton-hammer'));
 assert.ok(!G.Moves.poolFor(G.DEX_BY[260]).includes('gigaton-hammer'));
});
test('Physical hammer applies Potencia exactly once after run cards, buffs, type and critical',()=>{
 const {G}=fixture(),p=player(G);p.x=p.y=0;p.aim=0;p.critChance=1;p.critMul=2;
 p.buffs.atk={n:2,amount:.25,t:7};p.onDealt=noop;
 const hits=[],e={x:10,y:0,r:5,types:['ice'],hurt:d=>hits.push(d)};
 G.EnemyMgr.queryCircle=()=>[e];p.target=e;
 const m=G.Moves.instance('gigaton-hammer');m.dmg=10;p.activeGroup=()=>[m];
 G.Combat.tick(.1,p,0);
 assert.equal(hits.length,1);assert.ok(Math.abs(hits[0]-10*(1.47*3*1.5)*2*1.6*2)<1e-8);
 assert.equal(m.dmg,10,'the learned move is not permanently multiplied');
 m.t=0;G.Combat.tick(.1,p,1);assert.equal(hits[1],hits[0]);
});
test('Physical projectiles and delayed meteors get Potencia; special beams use Sp. Atk 70',()=>{
 const {G,shots}=fixture(),p=player(G);p.x=p.y=0;p.aim=0;p.onDealt=noop;
 const hits=[],e={id:1,x:10,y:0,r:5,types:['normal'],hurt:d=>hits.push(d)};
 G.EnemyMgr.queryCircle=()=>[e];p.target=e;
 const rock=G.Moves.instance('rock-throw');rock.dmg=10;p.activeGroup=()=>[rock];G.Combat.tick(.1,p,0);
 assert.ok(Math.abs(shots[0].dmg-10*1.47*3*2)<1e-8);
 const meteor=G.Moves.instance('rock-slide');meteor.dmg=10;meteor.count=1;p.activeGroup=()=>[meteor];
 G.Combat.tick(.1,p,0);G.Combat.updateFields(1);assert.ok(Math.abs(hits.pop()-10*1.47*3*2)<1e-8);
 const beam=G.Moves.instance('flash-cannon');beam.dmg=10;p.activeGroup=()=>[beam];G.Combat.tick(.1,p,0);
 assert.ok(Math.abs(hits.pop()-10*1.08*3)<1e-8);
 p.mega=null;assert.equal(G.Mega.damageMultiplier(p,rock),1);
});
test('Remote mega restores original shiny; sprites return to walk and hold their faint pose',()=>{
 const {G}=fixture(),p={dex:959,shiny:true};G.Mega.applyRemote(p,true);
 assert.equal(p.mega,'tinkatonite');assert.equal(p.shiny,false);assert.equal(p.mon.atk,1.47);
 assert.ok(p.anim instanceof G.Tinkaton.Animator);G.Mega.applyRemote(p,false);assert.equal(p.shiny,true);
 const a=new G.Tinkaton.Animator();a.loop('Walk');a.play('Attack');a.update(1);assert.equal(a.cur,'Walk');
 a.play('Faint',{hold:true});a.update(2);assert.equal(a.progress(),1);assert.equal(a.busy(),false);
});
