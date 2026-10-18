const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {fixture}=require('./helpers/boss-rush-fixture.cjs');
function setup(){
  const f=fixture('real-account',{live:true}),{G}=f;
  G.DB.playAsGuest();G.DB.save.partner=260;G.DB.save.owned[260]={at:1};G.DB.save.coins=1234;
  G.DB.save.pupg[260]={};G.DB.save.stats.bestTime=999;G.DB.save.stats.bestLevel=60;
  f.before=new Map(f.storage);return f;
}
test('Live uses the equipped owned Pokemon and native loadout without trial account or free upgrades',()=>{
  const f=setup(),{G}=f,s=G.DB.save,ready=G.DB.ready,rank=G.Ranking.runStarted,updater=G.Updater.init;
  const before=JSON.stringify(s);G.BossRush.open();const markup=f.nodes.get('scr-boss-rush').innerHTML;
  assert.doesNotMatch(markup,/rush-(?:partner\"|move-|jirachi\"|max\"|refill\"|upgrades\")|de prueba|sin recompensas/i);
  assert.match(markup,/hoenn-normal-v1.webp/);assert.equal(G.BossRush.maxUpgrades,undefined);
  assert.equal(G.BossRush.refillFunds,undefined);assert.equal(G.DB.ready,ready);assert.equal(G.Ranking.runStarted,rank);assert.equal(G.Updater.init,updater);
  assert.equal(JSON.stringify(s),before);G.BossRush.play();const p=G.Game.player;
  assert.equal(G.Game.mode,'hoenn-normal');assert.equal(p.dex,260);assert.equal(p.level,8);assert.equal(p.moves.length,1);
  assert.equal(p.moves[0].id,'water-gun');assert.equal(p.moves[0].lvl,1);assert.equal(p.mega,null);
  assert.equal(G.Game.state,'paused');assert.equal(f.rankings(),0);f.tick(60);assert.equal(G.BossRush.encounter.clock,0);
  assert.equal(f.prepare(),7);assert.equal(G.Game.state,'playing');assert.equal(JSON.stringify(s),before);
});
test('Live preserves owned Mega, selected Repertoire, Coverage and gold perks',()=>{
  const f=setup(),{G}=f,s=G.DB.save;
  s.megaStones.swampertite=1;G.Mega.equip(s,260,true);for(const u of G.Upgrades.LIST)s.pupg[260][u.id]=u.max;
  assert.equal(G.Coverage.choose(G.DEX_BY[260],s,['ice-beam']),true);
  assert.equal(G.Repertoire.choose(G.Mega.form(G.DEX_BY[260],s),s,'ice-beam'),true);s.pban={260:['bubble']};s.pbind={260:['bulldoze','ice-beam']};
  const before=JSON.stringify(s);G.BossRush.play();const p=G.Game.player;
  assert.equal(p.moves[1].id,'ice-beam');assert.ok(p.coverage.includes('ice-beam'));assert.ok(p.banned.has('bubble'));assert.equal(p.bind['ice-beam'],1);
  assert.equal(p.mega,'swampertite');assert.equal(p.moves[0].id,'bulldoze');assert.equal(p.moves[0].lvl,2);assert.equal(p.moves.length,2);
  assert.ok(p.maxHp>100);assert.equal(typeof p.banned.has,'function');assert.equal(JSON.stringify(s),before);f.prepare();
});
test('Full live route awards earned coins once, keeps survival records/rankings separate and restores normal play',()=>{
  const f=setup(),{G}=f,s=G.DB.save;const money=s.coins;
  G.BossRush.play();f.prepare();G.Game.player.hurt=()=>{};
  const seen=[];for(let i=0;i<6;i++){
    seen.push(...G.BossRush.bosses.map(b=>b.dex));for(const b of G.BossRush.bosses)b.hurt(1e12);f.tick(240);
  }
  assert.deepEqual(seen,[377,378,379,383,381,380,382,385,384]);assert.equal(G.Game.state,'over');
  assert.equal(f.result().bosses,9);assert.equal(f.result().kills,9);assert.equal(f.result().record,false);
  assert.ok(f.result().coins>=720);assert.equal(s.coins,money+f.result().coins);assert.equal(s.stats.bestTime,999);assert.equal(s.stats.bestLevel,60);
  assert.equal(f.rankings(),0);assert.equal(f.nodes.get('over-title').textContent,'¡Hoenn Normal superado!');
  const earned=s.coins;G.Game.quit();assert.equal(s.coins,earned);f.back();assert.equal(G.BossRush.running,false);assert.equal(G.Game.mode,null);
  G.Game.startRun();assert.equal(G.Game.mode,null);assert.equal(G.Game.player.level,1);assert.equal(f.rankings(),1);
  G.Game.quit();assert.equal(f.rankings(),2);assert.equal(s.stats.bestTime,999);assert.deepEqual(f.storage,f.before);
});
test('Coop rooms and unowned partners cannot start live Boss Rush',()=>{
  const f=setup(),{G}=f;G.Social.room={id:'room'};G.BossRush.play();assert.equal(G.Game.state,'ui');
  G.Game.startRun(null,null,null,'hoenn-normal');assert.equal(G.Game.state,'ui');G.Social.room=null;
  G.DB.save.partner=384;G.BossRush.play();assert.equal(G.Game.state,'ui');assert.equal(G.BossRush.running,false);
});
test('Production source contains only live adapter and keeps the real boot/updater',()=>{
  const html=fs.readFileSync(require('node:path').join(__dirname,'../dev.html'),'utf8');
  assert.match(html,/js\/systems\/boss-rush.js/);assert.match(html,/js\/main.js/);assert.match(html,/js\/core\/updater.js/);
  assert.doesNotMatch(html,/boss-rush-(?:preview|boot).js|dev\/tyranitar.js/);
});

test('Leaving to UI during preparation retires the arena and ordinary games keep their native flow',()=>{
  const f=setup(),{G}=f;G.BossRush.play();assert.equal(G.BossRush.preparing,true);G.Game.toUI();
  assert.equal(G.BossRush.preparing,false);assert.equal(G.BossRush.running,false);assert.equal(G.BossRush.encounter,null);
  assert.equal(G.Game.mode,null);G.Game.startRun();assert.equal(G.Game.player.level,1);assert.equal(G.Game.state,'playing');
  G.Game.togglePause();assert.equal(G.Game.state,'paused');G.Game.togglePause();assert.equal(G.Game.state,'playing');
});
