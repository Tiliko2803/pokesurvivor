/* Native offensive reference for the complete opening trio, not three isolated fights.
 * No incoming damage; seven legal level-8 cards, real hitboxes and 85% casting uptime.
 * Deoxys is injected only into the temporary benchmark guest to compare a normal Pokémon. */
const {simulate:run}=require('./benchmark-kyogre.cjs');
const simulate=options=>run({...options,stage:0});
module.exports={simulate};
if(require.main===module)(async()=>{
  console.log(JSON.stringify(await simulate()));
  console.log(JSON.stringify(await simulate({playerDex:386,attack:'confusion'})));
})().catch(e=>{console.error(e);process.exitCode=1;});
