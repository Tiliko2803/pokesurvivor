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
    const special=e.kind==='cast'||e.kind==='drill'||e.kind==='entrance';
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
      const priority={hit:1,spell:2,cast:3,drill:4}[e.kind]||0;
      if(priority&&(!actions.has(e.from)||actions.get(e.from).priority<priority))actions.set(e.from,{e,priority});
    }
    return {actions,hurt};
  }
  function life(e) {return e.life||(['hit','spell'].includes(e.kind)?.45:e.kind==='cast'?.8:e.kind==='entrance'?1.8:.6);}
  function progress(e) {return clamp(1-e.ttl/life(e),0,1);}
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
    if(e.kind==='area') {
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
    } else if(to&&['heal','shield'].includes(e.kind)) {
      const pal=e.kind==='heal'?'grass':'ice';
      sprite('ring',pal,tx,ty,1.1+p,fade*.7);
      const n=calm||low?1:3;
      for(let i=0;i<n;i++)sprite(e.kind==='heal'?'heart':'star',pal,tx+(i-(n-1)/2)*16,ty-(calm?0:p*28),.8,fade);
    } else if(to&&['hit','spell'].includes(e.kind)) {
      const melee=e.kind==='hit'&&from.range<=1||vis.melee&&Math.hypot(tx-sx,ty-sy)<=155;
      const travel=clamp(p/.45,0,1);
      if(e.periodic||calm||melee||options.beamCovered) {
        const shape=e.periodic?'fire':melee?vis.melee||'impact':'impact';
        sprite(shape,vis.pal,tx,ty,e.kind==='spell'?1.3:.9,fade,angle);
      } else if(vis.meteor) {
        sprite('rock',vis.pal,tx+24*(1-travel),ty-90*(1-travel),1.3,fade,p*3);
      } else {
        const shape=vis.proj||'ball';
        if(!low)for(let i=2;i>0;i--){const t=Math.max(0,travel-i*.12);sprite(shape,vis.pal,sx+(tx-sx)*t,sy+(ty-sy)*t,.65,fade*.18,angle);}
        sprite(shape,vis.pal,sx+(tx-sx)*travel,sy+(ty-sy)*travel,e.kind==='spell'?1.15:.75,fade,angle);
      }
      if(!calm&&p>.35)sprite('impact',vis.pal,tx,ty,(e.kind==='spell'?1.2:.7)*(1-p*.4),fade);
    }
    ctx.restore();
  }
  return {style,animation,animationSpeed,warm,actions,progress,draw};
})();
