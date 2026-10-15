const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(){const G={DEX_BY:{260:{dex:260,name:'Swampert',hp:115,atk:1.31,spd:103,types:['water','ground']}}};vm.runInNewContext(fs.readFileSync('js/systems/mega.js','utf8'),{G,Date,Math,Number,Object});return G;}
function save(){return{owned:{260:{at:1}},megaStones:{},megaEquipped:{},megaProgress:{}};}
test('Swampertita permanente y equipable',()=>{
 const G=setup(),s=save(),p={dex:260,bosses:3,mon:G.DEX_BY[260]};
 assert.equal(G.Mega.equip(s,260,true),false);
 assert.equal(G.Mega.finishRun(s,{...p,bosses:2},{clean:true}),false);
 assert.equal(G.Mega.finishRun(s,p,{clean:true,coop:true}),false);
 assert.equal(G.Mega.finishRun(s,p,{clean:true,challenge:true}),false);
 assert.equal(G.Mega.finishRun(s,p,{clean:false}),false);
 assert.equal(G.Mega.finishRun(s,p,{clean:true}),true);
 assert.equal(G.Mega.finishRun(s,p,{clean:true}),false);
 assert.equal(G.Mega.equip(s,260,true),true);
 const m=G.Mega.form(p.mon,s);
 assert.equal(m.dex,260);assert.equal(m.name,'Mega Swampert');assert.equal(m.hp,124);
 assert.ok(m.atk>p.mon.atk);assert.equal(m.types.join(','),'water,ground');
 assert.equal(G.Mega.equip(s,260,false),true);assert.equal(G.Mega.form(p.mon,s),p.mon);
 assert.equal(G.Mega.has(s),true);
});
test('requiere Swampert y no acepta equiparse sin piedra',()=>{
 const G=setup(),s=save();
 s.megaEquipped={260:'swampertite'};G.Mega.sanitize(s);
 assert.equal(G.Mega.equipped(s,260),false);
 assert.equal(G.Mega.finishRun(s,{dex:25,bosses:4,mon:{dex:25}},{clean:true}),false);
});
