'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function fixture(){
 const G={Challenges:{mergeProgress:(a,b)=>({...a,...b})}};
 const ctx=vm.createContext({G,console,localStorage:{getItem:()=>null,setItem(){},removeItem(){}}});
 for(const f of ['js/data/pokedex.js','js/data/moves.js','js/data/starters.js','js/data/upgrades.js','js/systems/mega.js','js/systems/repertoire.js','js/core/db.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx);
 return G;
}
const save=()=>({owned:{257:{at:1},260:{at:1}},upgrades:{},stats:{},pity:{},coins:0,tickets:{t1:0,t10:0}});
test('Blazikenita requiere tres jefes en una sola partida normal individual',()=>{
 const G=fixture(),s=save(),p={dex:257,mon:G.DEX_BY[257],bosses:2};
 assert.equal(G.Mega.finishRun(s,p,{clean:true}),false);
 p.bosses=1;assert.equal(G.Mega.finishRun(s,p,{clean:true}),false);
 assert.equal(s.megaProgress.blazikenBosses,2);
 p.bosses=3;
 for(const opts of [{coop:true,clean:true},{challenge:true,clean:true},{clean:false}])assert.equal(G.Mega.finishRun(s,p,opts),false);
 assert.equal(G.Mega.finishRun(s,{...p,mega:'blazikenite'},{clean:true}),false);
 assert.equal(G.Mega.finishRun(s,{...p,mon:{...p.mon,customPreview:true}},{clean:true}),false);
 assert.equal(G.Mega.finishRun(s,p,{clean:true}),true);
 const at=s.megaStones.blazikenite;
 assert.ok(at>0);assert.equal(G.Mega.finishRun(s,p,{clean:true}),false);assert.equal(s.megaStones.blazikenite,at);
});
test('Equipar cada piedra es independiente y mantiene el inicio y Repertorio de ambas megas',()=>{
 const G=fixture(),s=save();
 assert.equal(G.Mega.equip(s,257,true),false);
 s.megaStones={blazikenite:1,swampertite:2};s.pupg={257:{moves:1},260:{moves:1}};
 for(const dex of [257,260])assert.equal(G.Mega.equip(s,dex,true),true);
 const b=G.Mega.form(G.DEX_BY[257],s),w=G.Mega.form(G.DEX_BY[260],s);
 assert.equal(b.name,'Mega Blaziken');assert.equal(b.hp,111);assert.equal(b.atk,1.673);assert.equal(b.spd,121);assert.equal(b.megaNoShiny,true);
 assert.equal(G.Repertoire.initialMove(b),'karate-chop');assert.equal(G.Repertoire.initialMove(w),'bulldoze');
 assert.ok(!G.Repertoire.pool(b,s).includes('karate-chop'));
 assert.equal(G.Repertoire.choose(b,s,'ember'),true);
 assert.equal(G.Mega.equip(s,257,false),true);assert.equal(G.Mega.equipped(s,260),true);
 assert.equal(G.Mega.form(G.DEX_BY[257],s),G.DEX_BY[257]);
});
test('La fusión entre dispositivos conserva ambas piedras y la mejor misión, con equipo más reciente',()=>{
 const G=fixture(),a={...save(),updated:1,megaStones:{blazikenite:5},megaProgress:{blazikenBosses:3},megaEquipped:{257:'blazikenite'}};
 const b={...save(),updated:2,megaStones:{swampertite:6},megaProgress:{blazikenBosses:1,swampertBosses:3},megaEquipped:{260:'swampertite'}};
 for(const [x,y] of [[a,b],[b,a]]){
  const r=G.DB.merge(x,y);assert.equal(G.Mega.has(r,257),true);assert.equal(G.Mega.has(r,260),true);
  assert.equal(r.megaProgress.blazikenBosses,3);assert.equal(r.megaProgress.swampertBosses,3);
  assert.equal(G.Mega.equipped(r,257),false);assert.equal(G.Mega.equipped(r,260),true);
 }
});
test('Cooperativo reconoce el arte de ambas megas y restaura shiny al quitar Blazikenita',()=>{
 const G=fixture();G.Sprites={bodyHeight:()=>70,Animator:class{}};G.MegaArt={Animator:class{}};
 const p={dex:257,shiny:true};G.Mega.applyRemote(p,true);
 assert.equal(p.mega,'blazikenite');assert.equal(p.shiny,false);assert.equal(p.mon.name,'Mega Blaziken');
 G.Mega.applyRemote(p,false);assert.equal(p.shiny,true);assert.equal(p.mon.name,'Blaziken');
 const w={dex:260,shiny:true};G.Mega.applyRemote(w,true);assert.equal(w.mega,'swampertite');assert.equal(w.shiny,true);
});
