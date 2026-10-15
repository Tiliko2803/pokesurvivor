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

test('Llamada de la Tormenta: inicio, 30 s y recarga de 120 s',()=>{
 const G=setup(),calls=[],me={mega:'swampertite',dead:false};
 G.Coop={active:false,isHost:false,broadcast:()=>{throw Error('no debe mandar en solitario');}};
 G.Rift={inArena:false};G.Judgment={active:false};
 G.Weather={
  current:null,
  force(kind,dur){calls.push([kind,dur]);this.current={kind};}
 };
 G.Mega.resetRain();
 assert.equal(G.Mega.tickRain(0,[me]),true);
 assert.equal(calls.length,1);
 assert.equal(calls[0][0],'rain');
 assert.equal(calls[0][1],30);
 G.Weather.current=null;
 assert.equal(G.Mega.tickRain(119,[me]),false);
 assert.equal(G.Mega.tickRain(120,[me]),true);
 assert.equal(calls.length,2);
 assert.equal(G.Mega.RAIN_COOLDOWN,120);
});
test('La invocación no modifica climas de arenas ni consume recarga si ya llueve',()=>{
 const G=setup(),me={mega:'swampertite',dead:false},calls=[];
 G.Coop={active:false,isHost:false};
 G.Rift={inArena:true};G.Judgment={active:false};
 G.Weather={current:{kind:'sun'},force(kind,dur){calls.push([kind,dur]);this.current={kind};}};
 G.Mega.resetRain();
 assert.equal(G.Mega.tickRain(0,[me]),false);
 G.Rift.inArena=false;
 G.Weather.current={kind:'rain'};
 assert.equal(G.Mega.tickRain(1,[me]),false);
 G.Weather.current={kind:'sun'};
 assert.equal(G.Mega.tickRain(2,[me]),true);
 assert.equal(calls.length,1);
 G.Judgment.active=true;G.Weather.current=null;
 assert.equal(G.Mega.tickRain(122,[me]),false);
});
test('Cooperativo: sólo anfitrión invoca lluvia para todos y con una sola recarga',()=>{
 const G=setup(),packets=[],calls=[];
 G.Coop={active:true,isHost:false,broadcast:e=>packets.push(e)};
 G.Rift={inArena:false};G.Judgment={active:false};
 G.Weather={current:null,force:(kind,dur)=>calls.push([kind,dur])};
 const team=[{mega:'swampertite',dead:false},{mega:'swampertite',dead:false}];
 G.Mega.resetRain();
 assert.equal(G.Mega.tickRain(0,team),false);
 G.Coop.isHost=true;
 assert.equal(G.Mega.tickRain(0,team),true);
 assert.equal(G.Mega.tickRain(0.5,team),false);
 assert.equal(calls.length,1);
 assert.equal(packets.length,1);
 assert.equal(packets[0][0],'wx');
 assert.equal(packets[0][1],'rain');
 assert.equal(packets[0][2],30);
});
test('Sin una Mega viva, Llamada de la Tormenta no se activa',()=>{
 const G=setup(),calls=[];
 G.Coop={active:false,isHost:false};G.Rift={inArena:false};G.Judgment={active:false};
 G.Weather={current:null,force:(kind,dur)=>calls.push([kind,dur])};
 G.Mega.resetRain();
 assert.equal(G.Mega.tickRain(0,[{mega:null,dead:false}]),false);
 assert.equal(G.Mega.tickRain(0,[{mega:'swampertite',dead:true}]),false);
 assert.equal(calls.length,0);
});
