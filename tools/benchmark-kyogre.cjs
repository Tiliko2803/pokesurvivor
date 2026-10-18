/* Native DPS reference for Mega Blaziken: Onda Certera + Danza de Mil Espadas.
 * Uses legal level-up cards, max gold, Groudon's native Bond and all three
 * preceding victory rewards. Only those preceding enemies are skipped for speed.
 * Incoming damage is ignored and position/uptime are controlled: this measures
 * offensive duration, not human survival. Impulso carries 150s from earlier fights. */
const vm=require('node:vm');
const {fixture}=require('../tests/helpers/boss-rush-fixture.cjs');
const CORE=['up:aura-sphere','up:aura-sphere','up:aura-sphere','up:aura-sphere','stat:cd','evo:aura-sphere','stat:atk',
  'up:swords-dance','up:swords-dance','up:swords-dance','up:swords-dance','evo:swords-dance'];
async function simulate({seed=123,uptime=.85,hp,build='power',distance=100}={}){
  if(!['power','rapid'].includes(build)||uptime<=0||uptime>1)throw new Error('Invalid reference build');
  const f=fixture(),{G}=f;f.ctx.benchmarkSeed=seed;
  // Use the real metadata-derived hitboxes, not the fixture's small UI placeholders.
  f.load('js/core/sprites.js');
  vm.runInContext('Math.random=()=>{benchmarkSeed=(Math.imul(benchmarkSeed,1664525)+1013904223)>>>0;return benchmarkSeed/4294967296;}',f.ctx);
  await G.DB.ready();G.BossRushPreview.maxUpgrades(257);G.BossRushPreview.open();
  const select=f.nodes.get('rush-partner');select.value='257';select.onchange();
  f.nodes.get('rush-move-1').value='aura-sphere';f.nodes.get('rush-move-2').value='swords-dance';
  const plan=[...CORE],offer=G.LevelUp.offer;
  let choices=0;
  G.LevelUp.offer=p=>{
    const key=plan.length?plan.shift():(build==='rapid'?'stat:cd':'stat:atk');
    for(let i=0;i<100;i++){
      const card=offer(p,100).find(c=>c.key===key);if(card){choices++;return [card];}
    }
    throw new Error('Unavailable legal card '+key);
  };
  G.RunUI.showLevelUp=(lv,cards,pick)=>pick(cards[0]);
  f.nodes.get('rush-start').onclick();
  for(let i=0;i<3;i++){G.BossRushPreview.boss.hurt(999999999);f.tick(201);}
  const p=G.Game.player,boss=G.BossRushPreview.boss,encounter=G.BossRushPreview.encounter;
  if(boss.dex!==382||choices!==p.level-1||plan.length||p.moves.length!==2||!p.moves.every(m=>m.evolved))throw new Error('Invalid Kyogre setup '+JSON.stringify({dex:boss.dex,level:p.level,choices,remaining:plan.length,moves:p.moves.map(m=>({id:m.id,lvl:m.lvl,evolved:m.evolved})),state:G.Game.state,stage:G.BossRushPreview.stage}));
  const levelAtStart=p.level,choicesAtStart=choices;
  if(hp!==undefined){boss.maxHp=hp;boss.hp=hp;}
  p.megaElapsed=150;encounter.hit=()=>0;
  const tick=G.Combat.tick;let casting=true;
  G.Combat.tick=(...args)=>{if(casting)tick(...args);};
  let frames=0;
  while(!boss.dead&&frames<900*60){
    p.x=boss.x;p.y=boss.y+distance;
    casting=(frames/60%10)<uptime*10;f.tick(1);frames++;
  }
  return {build,seed,uptime,distance,hp:boss.maxHp,seconds:+(frames/60).toFixed(2),defeated:boss.dead,
    mega:p.mega,levelAtStart,choices:choicesAtStart,maxGold:G.Upgrades.LIST.every(u=>G.DB.upgradesOf(257)[u.id]===u.max),
    moves:p.moves.map(m=>({id:m.id,name:m.name,evolved:m.evolved})),fused:p.activeGroup().length===2,phase:encounter.phase};
}
module.exports={simulate};
if(require.main===module)(async()=>{
  for(const build of ['power','rapid'])for(const uptime of [1,.85,.75])console.log(JSON.stringify(await simulate({build,uptime,hp:process.argv[2]?Number(process.argv[2]):undefined})));
})().catch(e=>{console.error(e);process.exitCode=1;});
