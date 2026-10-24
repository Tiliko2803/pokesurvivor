/* Mega Tyranitar. Loaded after the normal game modules.
 * Sand Stream is a local aura; it never replaces the scripted Hoenn weather.
 */
G.Tyranitar = (() => {
  const STONE = 'tyranitarite', DEX = 248;
  const SAND = Object.freeze({radius:110, damage:8, interval:.75, slow:.25, reduction:.10});
  G.Mega.DEFINITIONS[DEX] = {id:STONE,dex:DEX,name:'Tyranitarita',form:'Mega Tyranitar',
    progress:'tyranitarBosses',start:'rock-throw',hp:1.15,atk:1.25,spd:1.05,shiny:false,
    help:'Lanzarrocas Nv. 2 · Chorro Arena: daño de Roca y ralentización cercanos · 10% de resistencia.'};

  const W=128,H=128,AX=64,AY=112;
  // The generator's rows turn clockwise from south toward west. Engine rows
  // turn from south toward east; remap them without rotating the artwork.
  const ROWS=[0,7,6,5,4,3,2,1];
  const frames={Idle:[0,1],Walk:[0,2,0,3],Attack:[4,5,0],Shoot:[6,7,0],Charge:[6,7],Hurt:[4],Faint:[4,5]};
  const duration={Idle:1,Walk:.58,Attack:.4,Shoot:.55,Charge:.7,Hurt:.28,Faint:.8};
  const URL='assets/pokemon/248/mega/mega-tyranitar.webp?v=tyranitar-1';
  let atlas=null,ready=false,failed=false;
  function preload() {
    if(atlas)return;
    atlas=new Image();
    atlas.onload=()=>{ready=atlas.naturalWidth===W*8&&atlas.naturalHeight===H*8;failed=!ready;};
    atlas.onerror=()=>{failed=true;console.error('[Mega Tyranitar] Sprite atlas unavailable');};
    atlas.src=URL;
  }
  class Animator {
    constructor(dex=DEX,scale=1) {
      Object.assign(this,{dex,scale,shiny:false,dir:0,base:'Idle',cur:'Idle',t:0,speed:1,once:false,done:false,hold:false});
      this.fallback=new G.Sprites.Animator(DEX,scale,false);preload();
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
      if(!ready){this.fallback.draw(ctx,x,y,opts);return;}
      const phase=this.progress(),seq=frames[this.cur],col=seq[Math.min(seq.length-1,Math.floor(phase*seq.length))];
      const row=ROWS[Math.max(0,Math.min(7,this.dir|0))],k=1.12*this.scale;
      let alpha=opts.alpha==null?1:opts.alpha;
      if(this.cur==='Faint')alpha*=1-phase*.8;
      if(alpha<=0)return;
      ctx.save();ctx.globalAlpha*=alpha;ctx.imageSmoothingEnabled=false;
      if(opts.flash)ctx.filter='brightness(1.7)';
      // Hurt/faint use recoil poses and a groundward sink; no flipped or
      // rotated standing sprites, keeping the feet and silhouette readable.
      const sink=this.cur==='Faint'?phase*16:0;
      ctx.drawImage(atlas,col*W,row*H,W,H,Math.round(x-AX*k),Math.round(y-AY*k+sink),W*k,H*k);
      ctx.restore();
    }
  }
  const art=G.MegaArt;
  G.MegaArt={...art,Animator:class {constructor(dex,scale=1,shiny=false){return dex===DEX?new Animator(dex,scale):new art.Animator(dex,scale,shiny);}}};
  const sprite=G.UI.sprite;
  G.UI.sprite=(cv,dex,opts={})=>{
    const view=sprite(cv,dex,opts);
    if(+dex===DEX&&opts.mega){view.a=new Animator(DEX,1);view.a.dir=opts.dir||0;view.a.loop(opts.anim||'Idle');}
    return view;
  };

  function radius(pl){return SAND.radius*(pl.areaMul||1);}
  function tickSand(pl,dt){
    if(pl.mega!==STONE||pl.dead||!Number.isFinite(dt)||dt<=0)return;
    pl.sandElapsed=(pl.sandElapsed||0)+dt;
    pl.sandCooldown=(pl.sandCooldown??SAND.interval)-dt;
    if(pl.sandCooldown>0)return;
    // One pulse per simulation step; a suspended tab cannot bank burst damage.
    pl.sandCooldown=SAND.interval;
    const range=radius(pl);
    for(const e of G.EnemyMgr.queryCircle(pl.x,pl.y,range)){
      if(e.dead||Math.hypot(e.x-pl.x,e.y-pl.y)>range+(e.r||0))continue;
      const type=G.Types.mult('rock',e.types),crit=Math.random()<(pl.critChance||0);
      const dmg=SAND.damage*pl.atk*type*G.Weather.mult('rock')*(crit?(pl.critMul||1.5):1);
      e.hurt(dmg,'#d6b77b',e.x-pl.x,e.y-pl.y,0,crit?'crit':G.Types.label(type));
      e.applySlow(SAND.slow,SAND.interval+.15);
      pl.onDealt(dmg);pl.dmgDealt+=dmg;
    }
  }
  function drawSand(ctx,pl){
    if(pl.mega!==STONE||pl.dead)return;
    const time=pl.sandElapsed||0,r=radius(pl),calm=G.Settings.get('calm'),n=calm?14:32;
    ctx.save();ctx.imageSmoothingEnabled=false;
    // Sparse individual pixel grains leave boss warnings and terrain visible.
    for(let i=0;i<n;i++){
      const a=time*(.65+(i%3)*.12)+i*2.39996;
      const ring=.35+(i%7)/10,rr=r*ring;
      const rise=((time*.5+i*.17)%1)*25;
      const x=Math.round(pl.x+Math.cos(a)*rr),y=Math.round(pl.y+Math.sin(a)*rr-rise);
      ctx.globalAlpha=.32+(i%4)*.10;ctx.fillStyle=['#e4ca93','#c6a065','#f4dfa9','#927546'][i%4];
      const s=i%5===0?3:2;ctx.fillRect(x,y,s,s);ctx.fillRect(x-5,y+2,2,1);
    }
    ctx.restore();
  }
  const BasePlayer=G.Player;
  G.Player=class extends BasePlayer {
    constructor(...args){super(...args);if(this.mega===STONE)this.dmgReduce-=.08;}
    get reduction(){return this.mega===STONE&&!this.dead?Math.min(.8,super.reduction+SAND.reduction):super.reduction;}
    update(dt){super.update(dt);tickSand(this,dt);}
    draw(ctx){drawSand(ctx,this);super.draw(ctx);}
  };
  const startRun=G.Game.startRun;
  G.Game.startRun=function(...args){
    const result=startRun.apply(this,args),pl=G.Game.player;
    if(G.Game.state==='playing'&&pl?.mega===STONE){
      const first=pl.moves.find(m=>m.id==='rock-throw');if(first?.lvl===1)G.Moves.levelUp(first);
    }
    return result;
  };
  // The normal Tyranitar starter is already Lanzarrocas; expose the same
  // start explicitly to the upgrades/repertoire UI for the new mega form.
  const initial=G.Repertoire.initialMove;
  G.Repertoire.initialMove=mon=>mon.dex===DEX&&mon.megaStone===STONE?'rock-throw':initial(mon);
  const merge=G.DB.merge;
  G.DB.merge=(a,b)=>{const s=merge(a,b);s.megaProgress=s.megaProgress||{};
    s.megaProgress.tyranitarBosses=Math.max(s.megaProgress.tyranitarBosses||0,a?.megaProgress?.tyranitarBosses||0,b?.megaProgress?.tyranitarBosses||0);
    G.Mega.sanitize(s);return s;};
  // Published release notes.
  G.CHANGELOG.unshift({d:'2026-10-24',title:['Mega Tyranitar llega al Live','Mega Tyranitar is live'],new:[
    ['Mega Tyranitar: +15% de vida, +25% de ataque, +5% de movimiento y Lanzarrocas Nv. 2. Chorro Arena golpea cada 0,75 s, ralentiza un 25% y da un 10% de resistencia. Danza Dragón sigue siendo una cobertura elegible.',
     'Mega Tyranitar: +15% HP, +25% attack, +5% movement and level 2 Rock Throw. Sand Stream hits every 0.75s, slows by 25% and grants 10% resistance. Dragon Dance remains a selectable Coverage move.'],
    ['Sprites nuevos en ocho direcciones, con caminata, zarpazo y rugido. La Tyranitarita sigue la misión de tres jefes en solitario; equípala desde el menú al completar la misión.',
     'New eight-direction sprites with walking, claw strikes and roaring. Tyranitarite uses the three-solo-boss mission and can be equipped from the menu after completing the mission.']
  ]});
  return {STONE,SAND,Animator,frames,duration,ROWS,preload,ready:()=>ready,failed:()=>failed,radius,tickSand,drawSand};
})();
