/* The Wish Maker: fixed delayed marks, pixel stars and a travelling psychic ring. */
G.Jirachi=(()=>{
  const {ARENA,contains}=G.Groudon,BASE_HP=600000,DAMAGE=44;
  const PROFILE=[['doom',.7,[10,8.5,7]],['swift',1.7,[6,5,4.2]],['flash',5,[8,6.8,5.6]],['psychic',8,[10,8.5,7]]];
  const NAMES={doom:'Deseo Oculto',swift:'Rapidez',flash:'Foco Resplandor',psychic:'Psíquico'};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const hpForStage=stage=>Math.round(BASE_HP*(stage===5?1.5:1));
  function ray(b,angle,width,length=650){
    const nx=Math.cos(angle),ny=Math.sin(angle);
    if(nx>.001)length=Math.min(length,(ARENA.right-b.x)/nx);
    if(nx<-.001)length=Math.min(length,(ARENA.left-b.x)/nx);
    if(ny>.001)length=Math.min(length,(ARENA.bottom-b.y)/ny);
    if(ny<-.001)length=Math.min(length,(ARENA.top-b.y)/ny);
    length=Math.max(0,length);return {kind:'line',ax:b.x,ay:b.y,bx:b.x+nx*length,by:b.y+ny*length,width};
  }
  class Encounter extends G.Groudon.Encounter {
    constructor({damageScale=1,...options}){
      super(options);this.id='jirachi';this.damageScale=damageScale;
      G.MajorCadence.attach(this,{profile:PROFILE,limits:[0,1,2,2],restAfter:['doom'],rest:1});
    }
    approach(dt){
      if(this.clock<this.cadence.restUntil)return;
      const b=this.boss,p=this.target(),dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy)||1;
      const radial=clamp((d-175)/75,-1,1),orbit=Math.sin(this.clock*.45)>.0?.55:-.55;
      const slow=b.source?.slowT>0?1-b.source.slow:1,step=(72+this.phase*4)*slow*dt;
      const x=b.x,y=b.y;b.x+=(dx/d*radial-dy/d*orbit)*step;b.y+=(dy/d*radial+dx/d*orbit)*step;this.bound(b);
      this.moving=Math.hypot(b.x-x,b.y-y)>.01;
    }
    createAttack(kind){
      if(!NAMES[kind])return null;
      const b=this.boss,p=this.target(),angle=Math.atan2(p.y-b.y,p.x-b.x);
      const a={kind,name:NAMES[kind],t:0,warn:1.2,active:.4,recovery:.45,damage:36,type:'psychic',shapes:[],hit:new Set()};
      if(kind==='doom'){
        a.warn=this.phase<3?2.5:2;a.damage=48;a.type='steel';a.active=.35;
        a.shapes=this.alive().slice(0,4).map(p=>({kind:'circle',x:p.x,y:p.y,r:46}));
        if(this.phase>=2&&a.shapes.length===1)for(const side of [-1,1])a.shapes.push({kind:'circle',x:clamp(p.x+Math.cos(angle+Math.PI/2)*side*105,ARENA.left+36,ARENA.right-36),y:clamp(p.y+Math.sin(angle+Math.PI/2)*side*105,ARENA.top+36,ARENA.bottom-36),r:34});
      }else if(kind==='swift'){
        a.warn=[0,1.1,.8,.65][this.phase];a.damage=24;a.type='normal';a.speed=[0,220,240,260][this.phase];
        const n=[0,3,5,7][this.phase],d=Math.hypot(p.x-b.x,p.y-b.y),spacing=Math.min(.95,Math.max(.3,2*Math.asin(Math.min(.8,(p.r+15)/Math.max(120,d)))));
        a.shapes=Array.from({length:n},(_,i)=>ray(b,angle+(i-(n-1)/2)*spacing,14,500));
        a.active=Math.max(...a.shapes.map(s=>Math.hypot(s.bx-s.ax,s.by-s.ay)))/a.speed+.05;
      }else if(kind==='flash'){
        a.warn=[0,1.25,1.1,.85][this.phase];a.damage=38;a.type='steel';a.active=.55;
        a.shapes=[ray(b,angle,30,Math.hypot(ARENA.right-ARENA.left,ARENA.bottom-ARENA.top))];
      }else{
        a.warn=[0,1.4,1.2,.95][this.phase];a.damage=30;a.active=[0,1,.9,.8][this.phase];
        a.shapes=[{kind:'ring',x:b.x,y:b.y,inner:30,outer:230}];
      }
      a.damage*=this.damageScale;return a;
    }
    hitShapes(a){
      if(a.kind==='swift')return a.shapes.flatMap(s=>{
        const d=(a.t-a.warn)*a.speed,len=Math.hypot(s.bx-s.ax,s.by-s.ay);
        return d<0||d>len?[]:[{kind:'circle',x:s.ax+(s.bx-s.ax)*d/(len||1),y:s.ay+(s.by-s.ay)*d/(len||1),r:7}];
      });
      if(a.kind==='psychic'){
        const s=a.shapes[0],r=40+180*clamp((a.t-a.warn)/a.active,0,1);return [{kind:'ring',x:s.x,y:s.y,inner:r-10,outer:r+10}];
      }
      return a.shapes;
    }
    resolveHits(){
      for(const p of this.alive()){
        const hits=this.attacks.filter(a=>a.t>=a.warn&&a.t<a.warn+a.active&&!a.hit.has(p)&&this.hitShapes(a).some(s=>contains(s,p)));
        if(!hits.length)continue;for(const a of hits)a.hit.add(p);
        if(this.clock-(this.hitCooldown.get(p)??-99)<.9)continue;
        const a=hits.reduce((x,y)=>x.damage>=y.damage?x:y);this.hit(p,a.damage,a.type);this.hitCooldown.set(p,this.clock);this.lastDamage=this.clock;
      }
    }
    onRecovery(){}
    updateHazards(){}
    get recovering(){return this.clock<(this.cadence?.restUntil||0)||super.recovering;}
    get label(){return this.clock<this.cadence.restUntil?'¡Jirachi se recupera! ¡Ataca!':super.label;}
  }
  return {Encounter,BASE_HP,DAMAGE,PROFILE,hpForStage};
})();
