/* Boss Rush minor combat in the native engine, legal Mega Blaziken cards and prior XP/Bonds.
 * Jirachi now uses its scripted encounter; Deoxys retains its native patterns.
 * Incoming damage is ignored; 85% casting uptime approximates time spent dodging.
 * These are offensive references, not a promise for every species, build or player. */
const {simulate:run}=require('./benchmark-kyogre.cjs');
const STAGES=[4,5];
const simulate=options=>run({minorDex:385,...options});
module.exports={simulate,STAGES};
if(require.main===module)(async()=>{
  for(const stage of STAGES)for(const build of ['power','rapid'])console.log(JSON.stringify(await simulate({stage,build})));
})().catch(e=>{console.error(e);process.exitCode=1;});
