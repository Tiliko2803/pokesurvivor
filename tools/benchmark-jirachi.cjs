/* Native references preserve species weaknesses and legal evolved cards. */
const {simulate:run}=require('./benchmark-kyogre.cjs');
const simulate=options=>run({stage:4,...options,minorDex:385});
module.exports={simulate};
if(require.main===module)(async()=>{
  for(const stage of [4])for(const options of [{},{playerDex:386,attack:'confusion'}])console.log(JSON.stringify(await simulate({stage,...options})));
})().catch(e=>{console.error(e);process.exitCode=1;});
