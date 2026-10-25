/* Survivor Mega sprite packs and passives. Timers belong to each
 * local player and advance exclusively through the combat simulation. */
G.SurvivorMegas=(()=>{
 const W=176,H=176,AX=88,AY=164;
 const duration={Idle:1,Walk:.58,Attack:.42,Shoot:.48,Charge:.65,Hurt:.28,Faint:.85};
 const frames={Idle:[0],Walk:[0,1,0,2],Attack:[3,4,0],Shoot:[3,4,0],Charge:[3,4],Hurt:[3],Faint:[0]};
 const rows=[0,1,2,3,4,3,2,1],mirror=[false,true,true,true,false,false,false,false];
 const images=new Map();
 const DEXES=[530,154,214,282,373,998,376,149];
 function pack(dex){
  if(!DEXES.includes(+dex))return null;
  const entry=images.get(+dex);
  return {ready:()=>!!entry?.ready,failed:()=>!!entry?.failed};
 }
 function preload(dex){
  dex=+dex;if(!pack(dex)||images.has(dex))return;
  const img=new Image(),entry={img,ready:false,failed:false};images.set(dex,entry);
  img.onload=()=>{entry.ready=img.naturalWidth===W*5&&img.naturalHeight===H*5;entry.failed=!entry.ready;};
  img.onerror=()=>{entry.failed=true;console.error('[Survivor Mega] Atlas unavailable',dex);};
  img.src=`assets/pokemon/${dex}/mega/poses.webp?v=mega-meta-dragonite-live-1`;
 }
 class Animator{
  constructor(dex,scale=1){
   Object.assign(this,{dex:+dex,scale,shiny:false,dir:0,base:'Idle',cur:'Idle',t:0,speed:1,once:false,done:false,hold:false});
   this.fallback=new G.Sprites.Animator(+dex,scale,false);preload(dex);
  }
  _start(anim,once=false){this.cur=frames[anim]?anim:'Idle';this.t=0;this.once=once;this.done=false;if(!once)this.hold=false;}
  loop(anim,speed=1){this.base=frames[anim]?anim:'Idle';if(!this.once&&this.cur!==this.base)this._start(this.base);if(!this.once)this.speed=speed;}
  play(anim,opts={}){this._start(anim,true);this.speed=opts.speed||1;this.hold=!!opts.hold;}
  busy(){return this.once&&!this.done;}
  progress(){return this.done?1:Math.min(1,this.t/duration[this.cur]);}
  update(dt){
   this.fallback.dir=this.dir;this.fallback.scale=this.scale;this.fallback.loop(this.base,this.speed);this.fallback.update(dt);
   if(!Number.isFinite(dt)||dt<=0||this.done)return;
   this.t+=dt*this.speed;const d=duration[this.cur];
   if(this.t>=d){if(this.once){if(this.hold){this.t=d;this.done=true;}else{this._start(this.base);this.speed=1;}}else this.t%=d;}
  }
  draw(ctx,x,y,opts={}){
   const entry=images.get(this.dex);if(!entry?.ready){this.fallback.draw(ctx,x,y,opts);return;}
   const phase=this.progress(),seq=frames[this.cur],col=seq[Math.min(seq.length-1,Math.floor(phase*seq.length))];
   const dir=Math.max(0,Math.min(7,this.dir|0)),k=this.scale;
   let alpha=opts.alpha??1;if(this.cur==='Faint')alpha*=1-phase*.8;if(alpha<=0)return;
   ctx.save();ctx.globalAlpha*=alpha;ctx.imageSmoothingEnabled=false;
   if(opts.flash)ctx.filter='brightness(1.7)';
   const bob=this.cur==='Idle'?-Math.sin(phase*Math.PI*2):0;
   const sink=this.cur==='Faint'?phase*22:0,recoil=this.cur==='Hurt'?Math.sin(phase*Math.PI)*5:0;
   ctx.translate(Math.round(x+recoil),Math.round(y+bob+sink));if(mirror[dir])ctx.scale(-1,1);
   ctx.drawImage(entry.img,col*W,rows[dir]*H,W,H,Math.round(-AX*k),Math.round(-AY*k),W*k,H*k);ctx.restore();
  }
 }
 const previous=G.MegaArt;
 G.MegaArt={...previous,Animator:class{constructor(dex,scale=1,shiny=false){return pack(dex)?new Animator(dex,scale):new previous.Animator(dex,scale,shiny);}}};
 const states=new WeakMap();
 const drill={id:'mega-drill',type:'ground',cat:'physical',category:'physical'};
 const solar={id:'mega-solar',type:'grass',cat:'special',category:'special'};
 const psychic={id:'gardevoir-domain',type:'psychic',cat:'special',category:'special'};
 const voice={id:'gardevoir-crescendo',type:'fairy',cat:'special',category:'special'};
 const seed={id:'heracross-barrage',type:'bug',cat:'physical',category:'physical'};
 function projectileMultiplier(p,e){
  if(!p.heracrossVolley)return 1;
  const n=p.heracrossVolley.get(e)||0;p.heracrossVolley.set(e,n+1);
  return p.heracrossFinisher&&n>=3?2:1;
 }
 function heracrossTick(dt,pl,s){
  s.timer-=dt;
  if(s.timer<=0&&!s.shots){s.timer=5;s.shots=5;s.shotT=0;s.angle=Number.isFinite(pl.aim)?pl.aim:0;s.volley=new WeakMap();pl.anim?.play('Shoot');}
  if(!s.shots)return;
  s.shotT-=dt;if(s.shotT>0)return;
  const angle=s.angle,area=pl.areaMul||1;s.shotT=.12;
  G.Projectiles.spawn({x:pl.x+Math.cos(angle)*8,y:pl.y+Math.sin(angle)*8,
   vx:Math.cos(angle)*430,vy:Math.sin(angle)*430,dmg:(14+pl.level*1.1)*pl.atkFor(seed),
   r:6*area,life:1,pierce:2,hits:new Set(),owner:pl,color:'#bed16d',vis:G.VFX.forType('bug'),
   mtype:'bug',mcat:'physical',heracrossVolley:s.volley,heracrossFinisher:s.shots===1});
  s.shots--;if(!s.shots)s.volley=null;
 }
 function domainPulse(pl,zone,final=false){
  const radius=zone.radius,move=final?voice:psychic;
  G.FX.ring(zone.x,zone.y,final?20:radius*.8,radius,final?'#ffb5dd':'#b7a8f1',final ? .65 : .45,3);
  for(const e of G.EnemyMgr.queryCircle(zone.x,zone.y,radius)){
   if(Math.hypot(e.x-zone.x,e.y-zone.y)>radius+(e.r||0))continue;
   const touched=hit(pl,e,move,final?70+pl.level*3:12+pl.level*.7,final?'#ffb5dd':'#b7a8f1',e.x-zone.x,e.y-zone.y,final&&!e.boss?180:0);
   if(touched&&!final&&!e.dead)e.applySlow(e.boss ? .15 : .35,.8);
  }
 }
 function gardevoirTick(dt,pl,s){
  s.timer-=dt;
  if(s.zone){
   const z=s.zone;z.left-=dt;z.pulse-=dt;
   if(z.left<=0){domainPulse(pl,z,true);pl.anim?.play('Shoot');s.zone=null;}
   else if(z.pulse<=0){z.pulse=.5;domainPulse(pl,z);}
  }
  if(s.timer>0||s.zone)return;
  s.timer=8;const a=Number.isFinite(pl.aim)?pl.aim:0;
  const target=pl.target&&!pl.target.dead&&Math.hypot(pl.target.x-pl.x,pl.target.y-pl.y)<=320?pl.target:null;
  let x=target?target.x:pl.x+Math.cos(a)*140,y=target?target.y:pl.y+Math.sin(a)*140;
  const length=Math.hypot(x-pl.x,y-pl.y),dx=(x-pl.x)/(length||1),dy=(y-pl.y)/(length||1);
  for(let d=8;d<=length;d+=8)if(G.World.isWall(pl.x+dx*d,pl.y+dy*d)){x=pl.x+dx*Math.max(0,d-8);y=pl.y+dy*Math.max(0,d-8);break;}
  s.zone={x,y,radius:160*(pl.areaMul||1),left:4,pulse:.5};pl.anim?.play('Charge');domainPulse(pl,s.zone);
 }
 function hit(pl,e,move,base,color,dx=0,dy=0,knock=0){
  if(e.dead||!(e.hp>0))return false;
  const dmg=base*pl.atkFor(move)*G.Types.mult(move.type,e.types)*G.Weather.mult(move.type)*G.Stats.taken(e.mon,move.cat);
  if(!(dmg>0))return false;
  e.hurt(dmg,color,dx,dy,knock);pl.onDealt(dmg);pl.dmgDealt+=dmg;return true;
 }
 function ray(pl,angle,length,width,move,base,color,bonus=false,touched=null){
  const ca=Math.cos(angle),sa=Math.sin(angle);
  // Pass through enemies, but respect arena walls just like ordinary beams.
  for(let d=8;d<length;d+=8)if(G.World.isWall(pl.x+ca*d,pl.y+sa*d)){length=d;break;}
  G.FX.beam(pl.x,pl.y-(G.LIFT||0),angle,length,width,color,G.VFX.forType(move.type));
  let hits=0;
  for(const e of G.EnemyMgr.queryCircle(pl.x+ca*length/2,pl.y+sa*length/2,length/2+width)){
   const dx=e.x-pl.x,dy=e.y-pl.y,r=e.r||0,along=dx*ca+dy*sa;
   if(along< -r||along>length+r||Math.abs(-dx*sa+dy*ca)>width/2+r)continue;
   const support=bonus&&(e.behavior==='healer'||e.behavior==='shielder');
   if(hit(pl,e,move,base*(support?1.5:1),color,ca,sa,bonus&&!e.boss?100:0)){hits++;touched?.add(e);}
  }
  return hits;
 }
 function tick(dt,pl){
  if(!['excadrillite','meganiumite','heracronite','gardevoirite','salamencite','baxcaliburite','metagrossite','dragoninite'].includes(pl.mega)||pl.dead||pl.remote||pl.frozen||!Number.isFinite(dt)||dt<=0)return;
  let s=states.get(pl);if(!s){s={timer:1.5};states.set(pl,s);}
  if(pl.mega==='heracronite'){heracrossTick(dt,pl,s);return;}
  if(pl.mega==='gardevoirite'){gardevoirTick(dt,pl,s);return;}
  s.timer-=dt;if(s.timer>0)return;
  const area=pl.areaMul||1,angle=Number.isFinite(pl.aim)?pl.aim:0;
  if(pl.mega==='metagrossite'){
   s.timer=6;const steel={id:'mega-meteor-cross',type:'steel',cat:'physical',category:'physical'};
   pl.anim?.play('Attack');for(let i=0;i<4;i++)ray(pl,angle+i*Math.PI/2,240*area,48*area,steel,38+pl.level*2.5,'#d9dfed');
  }else if(pl.mega==='dragoninite'){
   s.timer=8;const dragon={id:'mega-guardian-pulse',type:'dragon',cat:'special',category:'special'};
   pl.anim?.play('Shoot');if(ray(pl,angle,440*area,60*area,dragon,65+pl.level*3,'#b9e8dd'))pl.heal(pl.maxHp*.04);
  }else if(pl.mega==='salamencite'){
   s.timer=5;const wind={id:'mega-crescent',type:'flying',cat:'physical',category:'physical'};
   for(const offset of [-.28,0,.28])ray(pl,angle+offset,320*area,34*area,wind,24+pl.level*2,'#c6e9ff');
  }else if(pl.mega==='baxcaliburite'){
   s.timer=7;const ice={id:'mega-glaive',type:'ice',cat:'physical',category:'physical'};
   const touched=new Set();
   ray(pl,angle,380*area,64*area,ice,85+pl.level*4,'#a6f4ff',false,touched);
   for(const e of touched)e.applySlow(e.boss?.15:.4,2);
  }else if(pl.mega==='excadrillite'){
   s.timer=4;ray(pl,angle,360*area,52*area,drill,65+pl.level*4,'#e7b080',true);
  }else{
   s.timer=8;let hits=0;
   for(let i=0;i<4;i++)hits+=ray(pl,angle+i*Math.PI/2,300*area,34*area,solar,28+pl.level*2,'#e5f799');
   G.FX.ring(pl.x,pl.y,12,150*area,'#f4add7',.7,3);
   for(const e of G.EnemyMgr.queryCircle(pl.x,pl.y,150*area)){
    if(!e.dead&&e.hp>0&&Math.hypot(e.x-pl.x,e.y-pl.y)<=150*area+(e.r||0))e.applySlow(e.boss ? .15 : .35,2);
   }
   if(hits)pl.heal(pl.maxHp*.04);
  }
 }
 return {Animator,duration,frames,rows,mirror,cell:[W,H],anchor:[AX,AY],preload,pack,tick,ray,projectileMultiplier,DEXES};
})();
