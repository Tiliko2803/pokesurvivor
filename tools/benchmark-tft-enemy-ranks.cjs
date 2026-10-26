'use strict';
// Read-only experiment: variants exist only in isolated VM contexts.
const fs=require('fs'),path=require('path'),vm=require('vm');const root=path.join(__dirname,'..');
const files=['js/core/util.js','js/data/pokedex.js','js/data/sprites-meta.js','js/data/enemies.js','js/data/types.js','js/tft/engine.js'];
function engine(variant){const ctx=vm.createContext({G:{},window:{},console});for(const f of files){let code=fs.readFileSync(path.join(root,f),'utf8');if(f.endsWith('engine.js')&&variant!=='live'){
 code=code.replace('star,pos:isBoss?8:positions[i],boss:isBoss,elite','star,promotion:star===3?Math.min(6,Math.max(0,1+Math.floor((s.round-26-i*2)/10))):0,pos:isBoss?8:positions[i],boss:isBoss,elite');
 if(variant==='ranks-soft')code=code.replace('1+(round-1)*.025','1+Math.min(round-1,20)*.025+Math.max(0,round-21)*.012').replace('1+(round-1)*.015','1+Math.min(round-1,20)*.015+Math.max(0,round-21)*.009');
 if(['ranks-tuned','ranks-mid'].includes(variant)){const exponent=variant==='ranks-tuned'?.65:.45;code=code.replace('if(side===1) {',`if(side===1) {const compensation=1.18**(promotion(u)*${exponent});f.maxHp/=compensation;f.attack/=compensation;`);}
 }vm.runInContext(code,ctx);}return ctx.G.TFT;}
const rounds=[21,35,46,55,66,75,81,82,83,84,85,86,90],teams={megaA:[260,257,248,959,154,530],megaB:[373,998,376,149,214,282],gold:[260,257,248,959,154,530]},positions=[20,21,19,22,26,27],rows=[];
for(const variant of ['live','ranks-full','ranks-soft','ranks-tuned','ranks-mid']){const E=engine(variant);for(const [name,dexes]of Object.entries(teams))for(const round of rounds){let wins=0,draws=0,time=0,hp=0,promotion=0,damage=0,healing=0;for(let seed=1;seed<=20;seed++){
 const s=E.create(seed*9301+round);s.round=round;s.opponentRound=0;s.level=6;s.units=dexes.map((dex,i)=>({id:i+1,dex,star:3,promotion:name==='gold'?6:7,pos:positions[i]}));s.nextId=7;E.start(s);
 promotion+=s.battle.units.filter(u=>u.side===1).reduce((n,u)=>n+(u.promotion||0),0)/s.opponent.length;
 for(let k=0;k<200&&s.phase==='combat';k++)E.tick(s,.25);
 if(!s.result)throw Error('No result');wins+=s.result.won?1:0;draws+=s.result.draw?1:0;time+=s.battle.time;const allies=s.battle.units.filter(u=>u.side===0);hp+=allies.reduce((n,u)=>n+u.hp,0)/allies.reduce((n,u)=>n+u.maxHp,0);damage+=allies.reduce((n,u)=>n+u.damageDone,0);healing+=allies.reduce((n,u)=>n+u.healingDone,0);
 }rows.push({variant,team:name,round,seeds:20,winPct:wins*5,drawPct:draws*5,seconds:+(time/20).toFixed(2),remainingHpPct:+(hp/20*100).toFixed(1),enemyPromotion:+(promotion/20).toFixed(2),damage:Math.round(damage/20),healing:Math.round(healing/20)});}
 process.stderr.write('Completed '+variant+'\n');}
fs.mkdirSync(path.join(root,'docs/balance'),{recursive:true});fs.writeFileSync(path.join(root,'docs/balance/enemy-ranks-results.json'),JSON.stringify({seedFormula:'seed*9301+round',teams,positions,rows},null,2)+'\n');console.log('Battles',rows.length*20);
for(const round of [46,66,81,82,83,84,85,86,90])console.log(round,rows.filter(r=>r.round===round).map(r=>`${r.variant}/${r.team}: ${r.winPct}% ${r.seconds}s HP${r.remainingHpPct}%`).join(' | '));
