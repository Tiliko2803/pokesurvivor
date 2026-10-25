/* Megapiedras permanentes: misión individual y equipo opcional por Pokémon. */
G.Mega=(()=>{
 const ID='swampertite', DEX=260, GOAL=3;
 // Recarga compartida por todo el equipo para evitar lluvias encadenadas.
 const RAIN_DURATION=30, RAIN_COOLDOWN=120;
 let nextRainAt=0;
 const resetRain=()=>{nextRainAt=0;};
 function tickRain(time,players){
  if(!Number.isFinite(time)||!Array.isArray(players))return false;
  if(G.Coop.active&&!G.Coop.isHost)return false; // sólo el anfitrión decide el clima
  if(G.Rift.inArena||G.Judgment.active)return false; // no sobreescribir climas especiales
  if(time<nextRainAt)return false;
  if(!players.some(p=>p&&p.mega===ID&&!p.dead))return false;
  const climate=G.Weather.current;
  if(climate&&climate.kind==='rain')return false; // no gastar la recarga si ya llueve
  G.Weather.force('rain',RAIN_DURATION);
  if(G.Coop.active&&G.Coop.isHost)G.Coop.broadcast(['wx','rain',RAIN_DURATION]);
  nextRainAt=time+RAIN_COOLDOWN;
  return true;
 }
 const DEFINITIONS={
  214:{id:'heracronite',dex:214,name:'Heracronita',form:'Mega Heracross',progress:'heracrossBosses',start:'karate-chop',hp:1,atk:1,spd:1,shiny:false,
    types:['bug','fighting'],stats:{hp:80,atk:185,def:115,spa:40,spd:105,spe:75},
    help:'Golpe Kárate Nv. 2 · Encadenado: cinco disparos perforantes cada 5 s; el último duplica su daño si la presa recibió al menos tres de esa ráfaga.'},
  282:{id:'gardevoirite',dex:282,name:'Gardevoirita',form:'Mega Gardevoir',progress:'gardevoirBosses',start:'hyper-voice',hp:1,atk:1,spd:1,shiny:false,
    types:['psychic','fairy'],stats:{hp:68,atk:85,def:65,spa:165,spd:135,spe:100},
    help:'Vozarrón Nv. 2 · Piel Feérica: Vozarrón es Hada y +20% daño · Dominio Psíquico: zona fija que ralentiza y termina en una explosión de Hada.'},
  530:{id:'excadrillite',dex:530,name:'Excadrillita',form:'Mega Excadrill',progress:'excadrillBosses',start:'metal-claw',hp:1,atk:1,spd:1,shiny:false,
    types:['ground','steel'],stats:{hp:110,atk:165,def:100,spa:65,spd:65,spe:103},
    help:'Garra Metal Nv. 2 · Taladro Rompefilas: perforación cada 4 s, atraviesa hordas y hace +50% de daño a sanadores y escuderos.'},
  154:{id:'meganiumite',dex:154,name:'Meganiumita',form:'Mega Meganium',progress:'meganiumBosses',start:'solar-beam',hp:1,atk:1,spd:1,shiny:false,
    types:['grass','fairy'],stats:{hp:80,atk:92,def:115,spa:143,spd:115,spe:80},
    help:'Rayo Solar Nv. 2 sin carga · Jardín Solar: cada 8 s lanza cuatro rayos, ralentiza enemigos cercanos y cura 4% de vida al acertar.'},
  47:{id:'parasectite',dex:47,name:'Parasectita',form:'Mega Parasect',progress:'parasectBosses',start:'shadow-ball',hp:1,atk:1,spd:1,shiny:false,
    types:['bug','ghost'],stats:{hp:60,atk:95,def:100,spa:120,spd:100,spe:30},
    help:'Bicho/Fantasma · Bola Sombra Nv. 2 · Red Fúngica: esporas cada 6 s; los infectados caídos liberan otra nube y te curan. Diseño: ivi.etz.'},
  260:{id:ID,dex:DEX,name:'Swampertita',form:'Mega Swampert',progress:'swampertBosses',start:'bulldoze',hp:1.08,atk:1.23,spd:1.06,
    help:'Mega Swampert comienza con Terratemblor Nv. 2.'},
  257:{id:'blazikenite',dex:257,name:'Blazikenita',form:'Mega Blaziken',progress:'blazikenBosses',start:'karate-chop',hp:1.05,atk:1.23,spd:1.08,shiny:false,
    help:'Golpe Kárate Nv. 2 · Impulso: hasta +25% de movimiento y +30% de velocidad de ataque.'},
  959:{id:'tinkatonite',dex:959,name:'Tinkatonita',form:'Mega Tinkaton',progress:'tinkatonBosses',start:'gigaton-hammer',hp:1,atk:1,spd:1,shiny:false,
    stats:{hp:85,atk:140,def:97,spa:70,spd:120,spe:94},
    help:'Martillo Colosal Nv. 2 · Ataque base 140 · Potencia: ×2 al daño físico final. Diseño: ivi.etz.'}
 };
 const DEF=DEFINITIONS[DEX];
 const definition=dex=>DEFINITIONS[+dex]||null;
 const count=n=>Number.isFinite(+n)?Math.max(0,Math.min(GOAL,Math.floor(+n))):0;
 const has=(s,dex=DEX)=>{const d=definition(dex);return !!(d&&s&&s.megaStones&&Number.isSafeInteger(+s.megaStones[d.id])&&+s.megaStones[d.id]>0);};
 function sanitize(s){
  const stones={},equips={},progress={};
  for(const d of Object.values(DEFINITIONS)){
    const t=s.megaStones&&+s.megaStones[d.id];
    if(Number.isSafeInteger(t)&&t>0)stones[d.id]=t;
    if(stones[d.id]&&s.owned&&s.owned[d.dex]&&s.megaEquipped&&s.megaEquipped[d.dex]===d.id)equips[d.dex]=d.id;
    progress[d.progress]=count(s.megaProgress&&s.megaProgress[d.progress]);
  }
  s.megaStones=stones;s.megaEquipped=equips;s.megaProgress=progress;
 }
 const equipped=(s,dex)=>{const d=definition(dex);return !!(d&&s&&has(s,d.dex)&&s.owned&&s.owned[d.dex]&&s.megaEquipped&&s.megaEquipped[d.dex]===d.id);};
 function equip(s,dex,on){
  const d=definition(dex);
  if(!d||!s||!s.owned||!s.owned[d.dex]||(on&&!has(s,d.dex)))return false;
  s.megaEquipped=s.megaEquipped||{};
  if(on)s.megaEquipped[d.dex]=d.id;else delete s.megaEquipped[d.dex];
  return true;
 }
 function transform(mon,d){
  const form={...mon,megaStone:d.id,name:d.form,hp:Math.round(mon.hp*d.hp),
    atk:+(mon.atk*d.atk).toFixed(3),spd:Math.round(mon.spd*d.spd),megaNoShiny:d.shiny===false};
  if(d.types)form.types=[...d.types];
  if(d.stats){
   form.baseStats={...d.stats};form.bst=Object.values(d.stats).reduce((a,b)=>a+b,0);
   // Same conversion as tools/fetch_pokedex.py; Potencia is applied separately.
   form.hp=Math.round(70+d.stats.hp*.45);form.spd=Math.round(78+d.stats.spe*.42);
   form.atk=+(.70+d.stats.atk*.0055).toFixed(2);
   form.specialAtk=+(.70+d.stats.spa*.0055).toFixed(2);
  }
  form.pa = (mon.pa ?? mon.atk) * d.atk;
  form.sa = (mon.sa ?? mon.specialAtk ?? mon.atk) * d.atk;
  form.df = mon.df ?? 75; form.sd = mon.sd ?? 75;
  if (d.stats) {
    form.pa = +(.70 + d.stats.atk * .0055).toFixed(2);
    form.sa = +(.70 + d.stats.spa * .0055).toFixed(2);
    form.df = d.stats.def; form.sd = d.stats.spd;
    form.atk=Math.max(form.pa,form.sa);
  }
  return form;
 }
 function damageMultiplier(pl,m){
  if(pl?.mega==='gardevoirite'&&m?.id==='hyper-voice')return 1.2;
  if(!pl||pl.mega!=='tinkatonite'||!m||!(m.dmg>0))return 1;
  const category=m.category||(m.def&&m.def.category);
  if(category==='physical')return 2;
  // A special move uses Sp. Atk 70, retaining the same cards and buffs.
  return category==='special' && !G.Stats ? (pl.mon.specialAtk||1.08)/(pl.mon.atk||1.47) : 1;
 }
 function form(mon,s){
  return !mon||!equipped(s,mon.dex)?mon:transform(mon,definition(mon.dex));
 }
 function finishRun(s,pl,{coop=false,challenge=false,clean=false}={}){
  const d=pl&&definition(pl.dex);
  if(!d||!s||!pl.mon||!s.owned||!s.owned[d.dex]||coop||challenge||!clean||pl.mon.customPreview||pl.mega||pl.mon.megaStone||has(s,d.dex))return false;
  s.megaProgress=s.megaProgress||{};
  const bosses=count(pl.bosses);
  s.megaProgress[d.progress]=Math.max(count(s.megaProgress[d.progress]),bosses);
  if(bosses<GOAL)return false;
  s.megaStones=s.megaStones||{};
  s.megaStones[d.id]=Date.now();
  return true;
 }
 function applyRemote(pl,on){
  const d=pl&&definition(pl.dex);
  if(!d||!!pl.mega===!!on)return;
  if(on)pl.megaPriorShiny=pl.shiny;
  pl.mega=on?d.id:null;
  pl.mon=on?transform(G.DEX_BY[d.dex],d):G.DEX_BY[d.dex];
  pl.shiny=on&&d.shiny===false?false:!!pl.megaPriorShiny;
  pl.bodyH=on?Math.max(100,G.Sprites.bodyHeight(d.dex)):G.Sprites.bodyHeight(d.dex);
  pl.anim=on?new G.MegaArt.Animator(d.dex,1,pl.shiny):new G.Sprites.Animator(d.dex,1,pl.shiny);
 }
 return {DEF,DEFINITIONS,definition,damageMultiplier,NEED_BOSSES:GOAL,RAIN_DURATION,RAIN_COOLDOWN,sanitize,has,equipped,equip,form,finishRun,applyRemote,resetRain,tickRain};
})();
