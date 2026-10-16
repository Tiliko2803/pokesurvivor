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
  260:{id:ID,dex:DEX,name:'Swampertita',form:'Mega Swampert',progress:'swampertBosses',start:'bulldoze',hp:1.08,atk:1.23,spd:1.06,
    help:'Mega Swampert comienza con Terratemblor Nv. 2.'},
  257:{id:'blazikenite',dex:257,name:'Blazikenita',form:'Mega Blaziken',progress:'blazikenBosses',start:'karate-chop',hp:1.05,atk:1.23,spd:1.08,shiny:false,
    help:'Golpe Kárate Nv. 2 · Impulso: hasta +25% de movimiento y +30% de velocidad de ataque.'}
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
  return {...mon,megaStone:d.id,name:d.form,hp:Math.round(mon.hp*d.hp),
    atk:+(mon.atk*d.atk).toFixed(3),spd:Math.round(mon.spd*d.spd),megaNoShiny:d.shiny===false};
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
 return {DEF,DEFINITIONS,definition,NEED_BOSSES:GOAL,RAIN_DURATION,RAIN_COOLDOWN,sanitize,has,equipped,equip,form,finishRun,applyRemote,resetRain,tickRain};
})();
