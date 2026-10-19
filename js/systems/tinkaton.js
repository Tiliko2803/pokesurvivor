/* Mega Tinkaton — custom design by ivi.etz, adapted into generated game sprites.
 * Five drawn facings plus mirrored side views; every action has separate poses.
 */
G.Tinkaton=(()=>{
 const DEX=959,W=256,H=224,AX=128,AY=204;
 const ROOT='assets/pokemon/959/mega/';
 const duration={Idle:1,Walk:.56,Attack:.52,Shoot:.48,Charge:.75,Hurt:.30,Faint:.85};
 const clips={Idle:['walk',[0,2]],Walk:['walk',[0,1,2,3]],Attack:['attack',[0,1,2,3]],
  Shoot:['cast',[0,1,0]],Charge:['cast',[2,3]],Hurt:['react',[0,1]],Faint:['react',[2,3]]};
 // Source side/front poses face left; rear diagonal poses face right.
 const rows=[0,1,2,3,4,3,2,1];
 const mirror={walk:[false,true,true,false,false,true,false,false],
  cast:[false,true,true,false,false,true,false,false],
  attack:[false,false,false,false,false,true,true,true],
  react:[false,true,true,true,false,false,false,false]};
 const images={};
 function preload(){
  for(const key of ['walk','attack','cast','react']){
   if(images[key])continue;
   const img=new Image(),entry=images[key]={img,ready:false,failed:false};
   img.onload=()=>{entry.ready=img.naturalWidth===W*4&&img.naturalHeight===H*5;entry.failed=!entry.ready;};
   img.onerror=()=>{entry.failed=true;console.error('[Mega Tinkaton] Atlas unavailable:',key);};
   img.src=ROOT+key+'.webp?v=tinkaton-1';
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
   if(this.cur==='Faint')alpha*=1-phase*.55;
   if(alpha<=0)return;
   ctx.save();ctx.globalAlpha*=alpha;ctx.imageSmoothingEnabled=false;
   if(opts.flash)ctx.filter='brightness(1.7)';
   ctx.translate(Math.round(x),Math.round(y));if(mirror[key][dir])ctx.scale(-1,1);
   ctx.drawImage(entry.img,col*W,rows[dir]*H,W,H,Math.round(-AX*k),Math.round(-AY*k),W*k,H*k);
   ctx.restore();
  }
 }
 const previous=G.MegaArt;
 G.MegaArt={...previous,Animator:class{constructor(dex,scale=1,shiny=false){return +dex===DEX?new Animator(DEX,scale):new previous.Animator(dex,scale,shiny);}}};
 return {Animator,duration,preload,rows,mirror,cell:[W,H],anchor:[AX,AY],
  ready:()=>Object.values(images).length===4&&Object.values(images).every(e=>e.ready),
  failed:()=>Object.values(images).some(e=>e.failed)};
})();
