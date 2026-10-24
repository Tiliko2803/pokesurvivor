/* Mega Parasect — fan design by ivi.etz, adapted into generated gameplay sprites.
 * Red Fúngica belongs to its player: no shared timers, no frame-based damage.
 */
G.Parasect=(()=>{
 const DEX=47,W=192,H=176,AX=96,AY=164,ROOT='assets/pokemon/47/mega/';
 const duration={Idle:1,Walk:.64,Attack:.48,Shoot:.48,Charge:.72,Hurt:.30,Faint:.85};
 const clips={Idle:['walk',[0,2]],Walk:['walk',[0,1,2,3]],Attack:['actions',[0,1]],
  Shoot:['actions',[0,1]],Charge:['actions',[0,1,0]],Hurt:['actions',[2]],Faint:['actions',[3]]};
 const rows=[0,1,2,3,4,3,2,1],mirror=[false,true,true,true,false,false,false,false];
 const images={};
 function preload(){
  for(const key of ['walk','actions']){
   if(images[key])continue;
   const img=new Image(),entry=images[key]={img,ready:false,failed:false};
   img.onload=()=>{entry.ready=img.naturalWidth===W*4&&img.naturalHeight===H*5;entry.failed=!entry.ready;};
   img.onerror=()=>{entry.failed=true;console.error('[Mega Parasect] Atlas unavailable:',key);};
   img.src=ROOT+key+'.webp?v=parasect-1';
  }
 }
 class Animator{
  constructor(dex=DEX,scale=1){
   Object.assign(this,{dex,scale,shiny:false,dir:0,base:'Idle',cur:'Idle',t:0,speed:1,once:false,done:false,hold:false});
   this.fallback=new G.Sprites.Animator(DEX,scale,false);preload();
  }
  _start(anim,once=false){this.cur=clips[anim]?anim:'Idle';this.t=0;this.once=once;this.done=false;if(!once)this.hold=false;}
  loop(anim,speed=1){this.base=clips[anim]?anim:'Idle';if(!this.once&&this.cur!==this.base)this._start(this.base);if(!this.once)this.speed=speed;}
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
   const [key,seq]=clips[this.cur],entry=images[key];
   if(!entry?.ready){this.fallback.draw(ctx,x,y,opts);return;}
   const phase=this.progress(),col=seq[Math.min(seq.length-1,Math.floor(phase*seq.length))];
   const dir=Math.max(0,Math.min(7,this.dir|0)),k=this.scale;
   let alpha=opts.alpha==null?1:opts.alpha;
   if(this.cur==='Faint')alpha*=1-phase*.6;
   if(alpha<=0)return;
   ctx.save();ctx.globalAlpha*=alpha;ctx.imageSmoothingEnabled=false;
   if(opts.flash)ctx.filter='brightness(1.7)';
   ctx.translate(Math.round(x),Math.round(y));if(mirror[dir])ctx.scale(-1,1);
   ctx.drawImage(entry.img,col*W,rows[dir]*H,W,H,Math.round(-AX*k),Math.round(-AY*k),W*k,H*k);
   ctx.restore();
  }
 }
 const states=new WeakMap(),COOLDOWN=6,INFECTION=4,MAX_INFECTED=128,MAX_BURSTS=3;
 const move={id:'parasect-spores',name:'Red Fúngica',type:'ghost',cat:'special',category:'special'};
 function cloud(pl,s,x,y,radius,base){
  G.FX.ring(x,y,12,radius,'#c7afea',.65,3);
  G.FX.burst(x,y-18,'#ead6a3',12,55);
  for(const e of G.EnemyMgr.queryCircle(x,y,radius)){
   if(e.dead||!(e.hp>0))continue;
   const dmg=base*pl.atkFor(move)*G.Types.mult(move.type,e.types)*G.Weather.mult(move.type)*G.Stats.taken(e.mon,move.cat);
   if(dmg>0){e.hurt(dmg,'#c7afea');pl.onDealt(dmg);pl.dmgDealt+=dmg;}
   if(!e.dead){
    e.applySlow(e.boss ? .15 : .35,2);
    if(s.infected.has(e)||s.infected.size<MAX_INFECTED)s.infected.set(e,INFECTION);
   }else if(s.infected.size<MAX_INFECTED){
    // A lethal first cloud still counts as infection, but never duplicates a corpse.
    s.infected.set(e,INFECTION);
   }
  }
 }
 function tick(dt,pl){
  if(pl.mega!=='parasectite'||pl.dead||pl.remote||pl.frozen||!Number.isFinite(dt)||dt<=0)return;
  let s=states.get(pl);
  if(!s){s={timer:1.5,infected:new Map(),bursts:0,spent:new WeakSet()};states.set(pl,s);}
  s.timer-=dt;
  if(s.timer<=0){
   s.timer=COOLDOWN;s.bursts=0;
   cloud(pl,s,pl.x,pl.y,150*(pl.areaMul||1),22+pl.level*1.5);
  }
  // Snapshot: secondary clouds can mark new enemies, but never recurse this frame.
  for(const [e,left] of [...s.infected]){
   if(e.dead||e.hp<=0){
    s.infected.delete(e);
    if(s.spent.has(e)||s.bursts>=MAX_BURSTS)continue;
    s.spent.add(e);s.bursts++;
    pl.heal(pl.maxHp*.02);
    cloud(pl,s,e.x,e.y,90*(pl.areaMul||1),30+pl.level*2);
   }else if(left-dt<=0)s.infected.delete(e);
   else s.infected.set(e,left-dt);
  }
 }
 const previous=G.MegaArt;
 if(previous)G.MegaArt={...previous,Animator:class{constructor(dex,scale=1,shiny=false){return +dex===DEX?new Animator(DEX,scale):new previous.Animator(dex,scale,shiny);}}};
 return {Animator,duration,preload,tick,COOLDOWN,MAX_BURSTS,cell:[W,H],anchor:[AX,AY],
  ready:()=>Object.keys(images).length===2&&Object.values(images).every(e=>e.ready),
  failed:()=>Object.values(images).some(e=>e.failed)};
})();
