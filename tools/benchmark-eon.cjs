/* Offensive references only: native cards, types and Bond; incoming damage ignored. */
const {simulate:run}=require('./benchmark-kyogre.cjs');
const simulate=options=>run({...options,stage:2});
module.exports={simulate};
if(require.main===module)(async()=>{
  for(const options of [{},{playerDex:386,attack:'confusion'}])console.log(JSON.stringify(await simulate(options)));
})().catch(e=>{console.error(e);process.exitCode=1;});
