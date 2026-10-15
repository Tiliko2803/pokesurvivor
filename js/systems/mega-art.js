/* Mega Swampert — sprites genuinos de PokeAPI (forma 10064).
 * Frente / espalda, normal / shiny. Acciones interpoladas, no hojas de PMD.
 */
G.MegaArt=(()=>{
 const DIR='assets/pokemon/260/mega/';
 const ROOT=location.pathname.includes('/dev/')?'dev/'+DIR:DIR;
 const DUR={Idle:.95,Walk:.45,Attack:.34,Shoot:.5,Charge:.78,Hurt:.34,Faint:.8};
 const images={};
 function load(name){
  if(images[name])return images[name];
  const obj=images[name]={ready:false,failed:false,img:new Image()};
  obj.img.onload=()=>{obj.ready=true;};
  obj.img.onerror=()=>{obj.failed=true;};
  obj.img.src=ROOT+name+'.png';
  return obj;
 }
 function preload(shiny=false){
  for(const side of ['front','back'])load(side+(shiny?'-shiny':''));
 }
 class Animator{
  constructor(dex,scale=1,shiny=false){
   this.dex=dex;this.scale=scale;this.shiny=shiny;this.dir=0;
   this.base='Idle';this.cur='Idle';this.t=0;this.speed=1;
   this.once=false;this.done=false;this.hold=false;
   this.fallback=new G.Sprites.Animator(dex,scale,shiny);
   preload(shiny);
  }
  _start(anim,once=false){
   this.cur=DUR[anim]?anim:'Idle';this.t=0;this.once=once;this.done=false;
   if(!once)this.hold=false;
   this.fallback._start(this.cur,once);
  }
  loop(anim,speed=1){
   this.base=DUR[anim]?anim:'Idle';
   if(!this.once&&this.cur!==this.base)this._start(this.base);
   if(!this.once)this.speed=speed;
   this.fallback.loop(anim,speed);
  }
  play(anim,opts={}){
   this._start(anim,true);
   this.speed=opts.speed||1;
   this.hold=!!opts.hold;
   this.fallback.play(anim,opts);
  }
  busy(){return this.once&&!this.done;}
  progress(){return this.done?1:Math.min(1,this.t/(DUR[this.cur]||.5));}
  update(dt){
   this.fallback.update(dt);
   if(this.done||!Number.isFinite(dt)||dt<=0)return;
   this.t+=dt*this.speed;
   const dur=DUR[this.cur]||.5;
   if(this.t>=dur){
    if(this.once){
     if(this.hold){this.t=dur;this.done=true;}
     else{this._start(this.base);this.speed=1;}
    }else this.t%=dur;
   }
  }
  draw(ctx,x,y,opts={}){
   const back=this.dir>=3&&this.dir<=5;
   const mirror=this.dir>=5&&this.dir<=7;
   const art=load((back?'back':'front')+(this.shiny?'-shiny':''));
   if(!art.ready){
    this.fallback.scale=this.scale;
    this.fallback.dir=this.dir;
    this.fallback.draw(ctx,x,y,opts);
    return;
   }
   const img=art.img,phase=Math.min(1,this.t/(DUR[this.cur]||.95));
   const pulse=Math.sin(phase*Math.PI*2),step=Math.abs(Math.sin(phase*Math.PI*4));
   let bob=0,stretch=1,lean=0,advance=0,opacity=opts.alpha==null?1:opts.alpha;
   switch(this.cur){
    case 'Idle':bob=-pulse*1.3;stretch=1+pulse*.012;break;
    case 'Walk':bob=-step*4;lean=pulse*.045;break;
    case 'Attack':bob=-Math.sin(phase*Math.PI)*6;lean=-Math.sin(phase*Math.PI)*.18;advance=Math.sin(phase*Math.PI)*5;break;
    case 'Shoot':bob=-Math.sin(phase*Math.PI)*3;stretch=1+Math.sin(phase*Math.PI)*.06;break;
    case 'Charge':bob=-step*1.7;stretch=1+Math.sin(phase*Math.PI)*.045;break;
    case 'Hurt':bob=phase<.5?-4:0;lean=pulse*.15;break;
    case 'Faint':lean=phase*.55;stretch=1-phase*.27;opacity*=1-phase*.36;break;
   }
   const k=1.4*this.scale;
   ctx.save();
   ctx.globalAlpha*=Math.max(0,opacity);
   ctx.translate(Math.round(x),Math.round(y));
   ctx.scale(mirror?-1:1,1);
   ctx.translate(advance,bob*k);
   ctx.rotate(lean);
   ctx.scale(stretch,stretch);
   if(opts.flash)ctx.filter='brightness(1.7)';
   ctx.drawImage(img,-img.width*k/2,-img.height*k*.89,img.width*k,img.height*k);
   ctx.restore();
  }
 }
 return {Animator,preload,source:'PokeAPI/sprites 10064'};
})();
