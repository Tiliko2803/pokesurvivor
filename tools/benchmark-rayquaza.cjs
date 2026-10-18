/* Uses seven native encounter rewards, legal cards and the shared evolved Blaziken
 * reference. Earlier bosses are skipped; Rayquaza receives normal typed damage. */
const {simulate:run}=require('./benchmark-kyogre.cjs');
const simulate=options=>run({...options,stage:7});
module.exports={simulate};
if(require.main===module)(async()=>{
  for(const build of ['power','rapid'])console.log(JSON.stringify(await simulate({build,uptime:.85})));
})().catch(e=>{console.error(e);process.exitCode=1;});
