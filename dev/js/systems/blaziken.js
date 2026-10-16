/* Mega Blaziken — development playtest using the user's 167333.png poses.
 * Original directions are approximate; no invented rear view or shiny palette.
 * Uses the existing Fighting melee move, with real damage/type interactions.
 */
G.Blaziken = (() => {
  const W=192,H=160,AX=96,AY=142;
  const frames={Idle:[0,1],Walk:[2,3,4,5,6],Attack:[6,7,8,9],
    Shoot:[6,7,8,9],Charge:[0,1],Hurt:[10],Faint:[10]};
  const duration={Idle:.9,Walk:.52,Attack:.36,Shoot:.4,Charge:.65,Hurt:.28,Faint:.65};
  const url='dev/assets/pokemon/257/mega/mega-blaziken.webp?v=blaziken-1';
  let atlas=null,ready=false,failed=false;
  function preload(){
    if(atlas)return;
    atlas=new Image();
    atlas.onload=()=>{
      ready=atlas.naturalWidth===W*11&&atlas.naturalHeight===H*8;
      failed=!ready;
      if(failed)console.error('[Mega Blaziken] Invalid atlas dimensions');
    };
    atlas.onerror=()=>{failed=true;console.error('[Mega Blaziken] Atlas failed to load');};
    atlas.src=url;
  }
  class Animator {
    constructor(dex=257,scale=1,shiny=false){
      Object.assign(this,{dex,scale,shiny:false,dir:0,base:'Idle',cur:'Idle',t:0,speed:1,once:false,done:false,hold:false});
      this.fallback=new G.Sprites.Animator(257,scale,false);
      preload();
    }
    _start(anim,once=false){
      this.cur=frames[anim]?anim:'Idle';this.t=0;this.once=once;this.done=false;
      if(!once)this.hold=false;
    }
    loop(anim,speed=1){
      this.base=frames[anim]?anim:'Idle';
      if(!this.once&&this.cur!==this.base)this._start(this.base);
      if(!this.once)this.speed=speed;
    }
    play(anim,opts={}){this._start(anim,true);this.speed=opts.speed||1;this.hold=!!opts.hold;}
    busy(){return this.once&&!this.done;}
    progress(){return this.done?1:Math.min(1,this.t/duration[this.cur]);}
    update(dt){
      this.fallback.dir=this.dir;this.fallback.scale=this.scale;
      this.fallback.loop(this.base,this.speed);this.fallback.update(dt);
      if(!Number.isFinite(dt)||dt<=0||this.done)return;
      this.t+=dt*this.speed;
      const d=duration[this.cur];
      if(this.t>=d){
        if(this.once){
          if(this.hold){this.t=d;this.done=true;}
          else{this._start(this.base);this.speed=1;}
        }else this.t%=d;
      }
    }
    draw(ctx,x,y,opts={}){
      if(!ready){this.fallback.draw(ctx,x,y,opts);return;}
      const sequence=frames[this.cur];
      const phase=this.progress();
      const col=sequence[Math.min(sequence.length-1,Math.floor(phase*sequence.length))];
      const row=Math.max(0,Math.min(7,this.dir|0));
      const k=.78*this.scale;
      let alpha=opts.alpha==null?1:opts.alpha;
      if(this.cur==='Faint')alpha*=1-phase*.65;
      if(alpha<=0)return;
      ctx.save();ctx.globalAlpha*=alpha;ctx.imageSmoothingEnabled=false;
      if(opts.flash)ctx.filter='brightness(1.7)';
      ctx.drawImage(atlas,col*W,row*H,W,H,Math.round(x-AX*k),Math.round(y-AY*k),W*k,H*k);
      ctx.restore();
    }
  }
  const mon=Object.freeze({...G.DEX_BY[257],name:'Mega Blaziken',megaStone:'blazikenite',
    hp:Math.round(G.DEX_BY[257].hp*1.05),atk:+(G.DEX_BY[257].atk*1.23).toFixed(3),
    spd:Math.round(G.DEX_BY[257].spd*1.08),start:'karate-chop',customPreview:true});
  const active=()=>!!(G.Game&&G.Game.player&&G.Game.player.mega==='blazikenite');
  const allowed=()=>location.pathname.includes('/dev/')&&G.DB.save&&G.Game.state==='ui'&&!G.Coop.active&&!G.Social.room;
  // Shared systems report mission events: ignore them during this visual test.
  for(const name of ['event','kill','grant','checkAch']){
    const original=G.Progress[name];
    G.Progress[name]=function(...args){
      if(!active())return original.apply(this,args);
      if(name==='kill'&&G.Judgment.active&&args[0]&&args[0].boss)G.Judgment.bossDown();
    };
  }
  const previous=G.MegaArt;
  class MegaAnimator {
    constructor(dex,scale=1,shiny=false){
      return dex===257?new Animator(dex,scale,shiny):new previous.Animator(dex,scale,shiny);
    }
  }
  G.MegaArt={...previous,Animator:MegaAnimator};
  return {mon,Animator,duration,allowed,active,preload,ready:()=>ready,failed:()=>failed,
    impulse:elapsed=>1+Math.min(.25,Math.floor(Math.max(0,elapsed)/30)*.05)};
})();
