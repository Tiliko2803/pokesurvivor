/* Mega Swampert: piedra permanente, equipo opcional, misión en solitario. */
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
 const DEF={id:ID,dex:DEX,name:'Swampertita',form:'Mega Swampert'};
 const count=n=>Number.isFinite(+n)?Math.max(0,Math.min(GOAL,Math.floor(+n))):0;
 const has=s=>!!(s&&s.megaStones&&Number.isSafeInteger(+s.megaStones[ID])&&+s.megaStones[ID]>0);
 function sanitize(s){
  const t=s.megaStones&&+s.megaStones[ID];
  s.megaStones=Number.isSafeInteger(t)&&t>0?{[ID]:t}:{};
  const chosen=s.megaEquipped&&s.megaEquipped[DEX]===ID;
  s.megaEquipped=chosen&&has(s)&&s.owned&&s.owned[DEX]?{[DEX]:ID}:{};
  s.megaProgress={swampertBosses:count(s.megaProgress&&s.megaProgress.swampertBosses)};
 }
 const equipped=(s,dex)=>!!(s&&+dex===DEX&&has(s)&&s.owned&&s.owned[DEX]&&s.megaEquipped&&s.megaEquipped[DEX]===ID);
 function equip(s,dex,on){
  if(!s||+dex!==DEX||!s.owned||!s.owned[DEX]||(on&&!has(s)))return false;
  s.megaEquipped=s.megaEquipped||{};
  if(on)s.megaEquipped[DEX]=ID;else delete s.megaEquipped[DEX];
  return true;
 }
 function form(mon,s){
  return !mon||!equipped(s,mon.dex)?mon:{...mon,megaStone:ID,name:DEF.form,
    types:['water','ground'],hp:Math.round(mon.hp*1.08),
    atk:+(mon.atk*1.23).toFixed(3),spd:Math.round(mon.spd*1.06)};
 }
 function finishRun(s,pl,{coop=false,challenge=false,clean=false}={}){
  if(!s||!pl||pl.dex!==DEX||coop||challenge||!clean||pl.mon.customPreview||has(s))return false;
  s.megaProgress=s.megaProgress||{};
  const bosses=count(pl.bosses);
  s.megaProgress.swampertBosses=Math.max(count(s.megaProgress.swampertBosses),bosses);
  if(bosses<GOAL)return false;
  s.megaStones=s.megaStones||{};
  s.megaStones[ID]=Date.now();
  return true;
 }
 function applyRemote(pl,on){
  if(!pl||pl.dex!==DEX||!!pl.mega===!!on)return;
  pl.mega=on?ID:null;
  pl.mon=on?{...G.DEX_BY[DEX],name:DEF.form,megaStone:ID}:G.DEX_BY[DEX];
 }
 return {DEF,NEED_BOSSES:GOAL,RAIN_DURATION,RAIN_COOLDOWN,sanitize,has,equipped,equip,form,finishRun,applyRemote,resetRain,tickRain};
})();
