/* Native DPS reference for Mega Blaziken: Onda Certera + Danza de Mil Espadas.
 * Uses legal level-up cards, max gold, Groudon's native Bond and earlier
 * native encounter rewards (three for Kyogre, six for Rayquaza). Only those preceding enemies are skipped for speed.
 * Incoming damage is ignored and position/uptime are controlled: this measures
 * offensive duration, not human survival. Impulso carries 150s from earlier fights. */
const vm=require('node:vm');
const {fixture}=require('../tests/helpers/boss-rush-fixture.cjs');
const CORE=['up:aura-sphere','up:aura-sphere','up:aura-sphere','up:aura-sphere','stat:cd','evo:aura-sphere','stat:atk',
  'up:swords-dance','up:swords-dance','up:swords-dance','up:swords-dance','evo:swords-dance'];
async function simulate({seed=123,uptime=.85,hp,build='power',distance=100,stage=3,minorDex,playerDex=257,gold=true,attack='aura-sphere'}={}){
  if(!Number.isInteger(stage)||stage<0||stage>6)throw new Error('Unsupported reference encounter');
  if(!['power','rapid'].includes(build)||uptime<=0||uptime>1)throw new Error('Invalid reference build');
  const f=fixture(),{G}=f;f.ctx.benchmarkSeed=seed;
  // Use the real metadata-derived hitboxes, not the fixture's small UI placeholders.
  f.load('js/core/sprites.js');
  vm.runInContext('Math.random=()=>{benchmarkSeed=(Math.imul(benchmarkSeed,1664525)+1013904223)>>>0;return benchmarkSeed/4294967296;}',f.ctx);
  if(minorDex!==undefined){
    const eligible=G.DEX.filter(m=>G.BossRushRules.eligibleMinor(m,G.SPRITE_META)&&[385,386].includes(m.dex)).map(m=>m.dex);
    if(stage===0||!G.BossRushRules.MINOR_STAGES.includes(stage)||!eligible.includes(minorDex))throw new Error('Invalid reference minor');
    const choices=eligible.slice(),target=G.BossRushRules.MINOR_STAGES.indexOf(stage)-1,from=choices.indexOf(minorDex);
    [choices[target],choices[from]]=[choices[from],choices[target]];
    G.BossRushRules.selectMinors=()=>choices;
  }
  await G.DB.ready();
  if(!G.DEX_BY[playerDex]||!G.Moves.poolFor(G.DEX_BY[playerDex]).includes(attack))throw new Error('Invalid native player reference');
  // The test guest can select any native species without unlocking a real account.
  G.DB.save.owned[playerDex]={at:1,from:'native-benchmark'};
  if(gold)for(const u of G.Upgrades.LIST)G.DB.upgradesOf(playerDex)[u.id]=u.max;
  G.BossRushPreview.open();
  const select=f.nodes.get('rush-partner');select.value=String(playerDex);select.onchange();
  f.nodes.get('rush-move-1').value=attack;f.nodes.get('rush-move-2').value='swords-dance';
  const need=G.Moves.EVO[attack][1];
  const plan=CORE.map(k=>k.replace('aura-sphere',attack));plan[4]='stat:'+need;
  if(need==='atk')plan[6]='stat:cd';
  const offer=G.LevelUp.offer;
  let choices=0;
  G.LevelUp.offer=p=>{
    const key=plan.length?plan.shift():(build==='rapid'&&(p.statsTaken.cd||0)<10?'stat:cd':'stat:atk');
    for(let i=0;i<100;i++){
      const card=offer(p,100).find(c=>c.key===key);if(card){choices++;return [card];}
    }
    throw new Error('Unavailable legal card '+key);
  };
  G.RunUI.showLevelUp=(lv,cards,pick)=>pick(cards[0]);
  f.nodes.get('rush-start').onclick();
  for(let i=0;i<stage;i++){for(const b of G.BossRushPreview.bosses)b.hurt(999999999);f.tick(201);}
  const p=G.Game.player,boss=G.BossRushPreview.boss,targets=G.BossRushPreview.bosses,encounter=G.BossRushPreview.encounter;
  if((minorDex!==undefined&&boss.dex!==minorDex)||choices!==p.level-1||p.moves.length!==2||(stage>=2&&(plan.length||!p.moves.every(m=>m.evolved))))throw new Error('Invalid boss reference setup '+JSON.stringify({dex:boss.dex,level:p.level,choices,remaining:plan.length,moves:p.moves.map(m=>({id:m.id,lvl:m.lvl,evolved:m.evolved})),state:G.Game.state,stage:G.BossRushPreview.stage}));
  const levelAtStart=p.level,choicesAtStart=choices,fusedAtStart=p.activeGroup().length===2;
  const movesAtStart=p.moves.map(m=>({id:m.id,name:m.name,evolved:m.evolved}));
  if(hp!==undefined){boss.maxHp=hp;boss.hp=hp;}
  p.megaElapsed=Math.min(150,stage*90);p.hurt=()=>{};if(encounter)encounter.hit=()=>0;
  const tick=G.Combat.tick;let casting=true;
  G.Combat.tick=(...args)=>{if(casting)tick(...args);};
  let frames=0;
  while(targets.some(b=>!b.dead)&&frames<900*60){
    const target=targets.find(b=>!b.dead);p.x=target.x;p.y=target.y+distance;
    const dance=p.moves.find(m=>m.id==='swords-dance');
    if(p.slots.length>1)p.setActive(p.buffs.atk.n<dance.stacks||p.buffs.atk.t<1?1:0);
    casting=(frames/60%10)<uptime*10;f.tick(1);frames++;
  }
  return {build,seed,uptime,distance,dex:boss.dex,hp:boss.maxHp,totalHp:targets.reduce((n,b)=>n+b.maxHp,0),seconds:+(frames/60).toFixed(2),defeated:targets.every(b=>b.dead),
    playerDex,mega:p.mega,levelAtStart,choices:choicesAtStart,maxGold:G.Upgrades.LIST.every(u=>G.DB.upgradesOf(playerDex)[u.id]===u.max),
    moves:movesAtStart,fused:fusedAtStart,phase:encounter?.phase||null};
}
module.exports={simulate};
if(require.main===module)(async()=>{
  for(const build of ['power','rapid'])for(const uptime of [1,.85,.75])console.log(JSON.stringify(await simulate({build,uptime,hp:process.argv[2]?Number(process.argv[2]):undefined})));
})().catch(e=>{console.error(e);process.exitCode=1;});
