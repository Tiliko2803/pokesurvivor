/* TFT renderer: reuse Survivor pixel sprites without touching its global FX pools. */
G.TFTVisuals = (() => {
  'use strict';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const aliases={'Hidropulso':'bubble-beam','Rayo Solar':'solar-beam','Llamarada':'heat-wave','Trueno':'thunderbolt',
    'Terremoto':'bulldoze','Fuerza Telúrica':'bulldoze','Ventisca':'powder-snow','Cometa Draco':'meteor-mash',
    'Martillo Colosal':'meteor-mash','Martillazo':'meteor-mash','Puño Meteoro':'meteor-mash','Rapidez':'swift',
    'Gigadrenado':'giga-drain','Pulso Cura':'giga-drain','Deseo':'giga-drain','Síntesis':'giga-drain',
    'Amortiguador':'giga-drain','Aromaterapia':'giga-drain','Taladradora':'metal-claw','Demolición':'karate-chop',
    'A Bocajarro':'karate-chop','Doble Patada':'rolling-kick','Patada Ígnea':'rolling-kick'};
  const moves=new Map((G.Moves?.ALL||[]).map(m=>[m.name,m]));
  function style(u,e) {
    const name=e.move||(e.kind==='spell'?G.TFT.moveFor(u):''),move=moves.get(name);
    const type=e.type||move?.type||u.types?.[0]||G.TFT.abilityFor(u).type;
    const vis=G.VFX.forMove({id:aliases[name]||move?.id||'',type});
    // The TFT move's actual damage type wins over the Survivor catalogue type.
    if(vis.pal!=='aura')vis.pal=type;
    return {...vis,name,meteor:/Cometa|Avalancha|Meteoro|Martillo Colosal/.test(name)};
  }
  function animation(u,e) {
    const meta=G.Sprites.meta(u.dex)?.a||{};
    const choose=names=>names.find(n=>meta[n])||'Idle';
    const special=e.kind==='cast'||e.kind==='entryCast'||e.kind==='drill'||e.kind==='entrance';
    const melee=e.kind==='drill'||u.range<=1;
    const strike=choose(melee?['Attack','Shoot']:['Shoot','Attack']);
    if(special&&meta.Charge)return [{name:'Charge',duration:.1},{name:strike,duration:.25}];
    return [{name:strike,duration:special?.35:.25}];
  }
  function animationSpeed(dex,name,duration) {
    const m=G.Sprites.animMeta(dex,name);
    return m?clamp(m.d.reduce((a,n)=>a+n,0)/60/Math.max(.05,duration),.25,12):1;
  }
  function warm(units) {
    for(const dex of new Set(units.map(u=>u.dex)))for(const name of ['Idle','Walk','Attack','Shoot','Charge','Hurt','Faint'])
      if(G.Sprites.meta(dex)?.a[name])G.Sprites.sheet(dex,name);
  }
  function actions(events) {
    const actions=new Map(),hurt=new Set();
    for(const e of events){
      if(e.to&&['hit','spell'].includes(e.kind))hurt.add(e.to);
      if(e.periodic)continue;
      const priority={hit:1,spell:2,cast:3,entryCast:3,drill:4}[e.kind]||0;
      if(priority&&(!actions.has(e.from)||actions.get(e.from).priority<priority))actions.set(e.from,{e,priority});
    }
    return {actions,hurt};
  }
  function life(e) {return e.life||(['hit','spell'].includes(e.kind)?.45:['cast','entryCast'].includes(e.kind)?.8:e.kind==='entrance'?1.2:.6);}
  function progress(e) {return clamp(1-e.ttl/life(e),0,1);}
  function impact(e) {
    if(!e)return 0;
    const distance=Math.hypot((e.tx??e.sx??0)-(e.sx??0),(e.ty??e.sy??0)-(e.sy??0));
    const delay=e.periodic?0:distance<=1.55?.18:.55;
    return clamp((progress(e)-delay)/(1-delay),0,1);
  }
  function pose(u,action,hurt,options={}) {
    if(options.calm)return {x:0,y:0,scale:1,flash:0};
    let x=0,y=0,scale=1,flash=0;
    if(action&&action.ttl>0){
      const p=progress(action),dx=(action.tx??action.sx??0)-(action.sx??0),dy=(action.ty??action.sy??0)-(action.sy??0),len=Math.hypot(dx,dy)||1;
      const t=clamp((p-.08)/.72,0,1),lunge=Math.sin(t*Math.PI)*(u.range<=1?12:4);
      x+=dx/len*lunge;y+=dy/len*lunge;scale+=Math.sin(p*Math.PI)*.045;
    }
    if(hurt&&hurt.ttl>0){
      const p=impact(hurt);if(p>0){const dx=(hurt.tx??u.x)-(hurt.sx??u.x),dy=(hurt.ty??u.y)-(hurt.sy??u.y),len=Math.hypot(dx,dy)||1,recoil=Math.sin(p*Math.PI)*5;
        x+=dx/len*recoil;y+=dy/len*recoil;scale-=Math.sin(p*Math.PI)*.035;flash=p<.22?1:0;}
    }
    return {x,y,scale,flash};
  }
  function areaCells(e,units,time=0) {
    if(e.control){
      const source=units.find(u=>u.id===e.from);
      return units.filter(u=>source&&u.side!==source.side&&u.hp>0&&e.targets?.includes(u.id)&&u.stunUntil>time).map(u=>u.y*6+u.x);
    }
    const cells=[];for(let y=0;y<6;y++)for(let x=0;x<6;x++)if(Math.abs(x-e.x)+Math.abs(y-e.y)<=e.radius)cells.push(y*6+x);
    return cells;
  }
  function draw(ctx,e,units,options={}) {
    const from=units.find(u=>u.id===e.from),to=units.find(u=>u.id===e.to);if(!from)return;
    const vis=style(from,e),p=progress(e),calm=!!options.calm,low=options.quality===0;
    const sx=(e.sx??from.x)*100+50,sy=(e.sy??from.y)*100+48;
    const tx=(e.tx??to?.x??from.x)*100+50,ty=(e.ty??to?.y??from.y)*100+48;
    const angle=Math.atan2(ty-sy,tx-sx),frame=Math.floor(p*6),fade=calm?.8:Math.min(1,(1-p)*3);
    const sprite=(shape,pal,x,y,scale=1,alpha=fade,rotation=0)=>{
      if(!G.VFX.SHAPES[shape])shape='impact';
      G.VFX.draw(ctx,shape,pal,clamp(x,0,600),clamp(y,0,600),{scale,alpha,angle:rotation,frame:calm?0:frame});
    };
    ctx.save();ctx.imageSmoothingEnabled=false;
    if(['cast','entryCast'].includes(e.kind)) {
      sprite('ring',vis.pal,sx,sy,1+p*1.4,fade*.35);
      if(!calm&&!low)for(let i=0;i<3;i++){const a=i*Math.PI*2/3+p*2;sprite('star',vis.pal,sx+Math.cos(a)*22,sy+Math.sin(a)*12,.35,fade*.5,a);}
    } else if(e.kind==='area') {
      const x=e.x*100+50,y=e.y*100+48,r=Math.max(1,e.radius)*67;
      sprite('ring',vis.pal,x,y,calm?r/13:(.35+p*.65)*r/13,calm?.45:fade*.6);
      if(!calm)for(let i=0;i<(low?4:8);i++){
        const a=i*Math.PI*2/(low?4:8),d=r*(.25+.65*p),shape=['ground','rock'].includes(e.type)?'rock':vis.aura||vis.proj;
        sprite(shape,vis.pal,x+Math.cos(a)*d,y+Math.sin(a)*d,.6,fade,a);
      }
    } else if(e.kind==='beam'||e.kind==='drill') {
      const length=Math.hypot(tx-sx,ty-sy),count=Math.min(low?8:16,Math.max(2,Math.ceil(length/24)));
      for(let i=0;i<count;i++){
        const t=i/(count-1),shape=e.kind==='drill'?'rock':vis.beam==='lightning'?'bolt':vis.beam||vis.proj;
        sprite(shape,e.kind==='drill'?'ground':vis.pal,sx+(tx-sx)*t,sy+(ty-sy)*t,e.kind==='drill'?.7:1,calm?.65:fade,angle);
      }
      if(!calm)sprite('impact',vis.pal,tx,ty,1.4,fade);
    } else if(to&&e.kind==='stun') {
      if(to.hp>0)sprite('star','electric',tx,ty-22,.8,fade);
    } else if(to&&['heal','shield'].includes(e.kind)) {
      const pal=e.kind==='heal'?'grass':'ice';
      sprite('ring',pal,tx,ty,1.1+p,fade*.7);
      const n=calm||low?1:3;
      for(let i=0;i<n;i++)sprite(e.kind==='heal'?'heart':'star',pal,tx+(i-(n-1)/2)*16,ty-(calm?0:p*28),.8,fade);
    } else if(to&&['hit','spell'].includes(e.kind)) {
      const melee=e.kind==='hit'&&from.range<=1||vis.melee&&Math.hypot(tx-sx,ty-sy)<=155;
      const travel=1-(1-clamp((p-.08)/.5,0,1))**3;
      if(e.periodic||calm||melee||options.beamCovered) {
        const shape=e.periodic?(e.type==='fire'?'fire':'impact'):melee?vis.melee||'impact':'impact';
        sprite(shape,vis.pal,tx,ty,e.kind==='spell'?1.3:.9,fade,angle);
      } else if(vis.meteor) {
        sprite('rock',vis.pal,tx+24*(1-travel),ty-90*(1-travel),1.3,fade,p*3);
      } else {
        const shape=vis.proj||'ball';
        if(!low)for(let i=2;i>0;i--){const t=Math.max(0,travel-i*.12);sprite(shape,vis.pal,sx+(tx-sx)*t,sy+(ty-sy)*t,.65,fade*.18,angle);}
        sprite(shape,vis.pal,sx+(tx-sx)*travel,sy+(ty-sy)*travel,e.kind==='spell'?1.15:.75,fade,angle);
      }
      const contact=impact(e);
      if(contact>0){
        sprite('impact',vis.pal,tx,ty,(e.kind==='spell'?1.35:.85)*(1-contact*.45),fade);
        if(!calm&&!low)for(let i=0;i<4;i++){const a=angle+i*Math.PI/2,r=8+contact*18;sprite('star',vis.pal,tx+Math.cos(a)*r,ty+Math.sin(a)*r,.28,fade*(1-contact),a);}
      }
    }
    ctx.restore();
  }
  return {style,animation,animationSpeed,warm,actions,areaCells,progress,impact,pose,draw};
})();
