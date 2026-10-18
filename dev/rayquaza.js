/* Final Hoenn encounter. Reuses the shared clock, bounds, phase handling and
 * Kyogre's walkable-escape validator; geometry is fixed for the entire warning. */
G.Rayquaza = (() => {
  const {ARENA,contains}=G.Groudon;
  const BASE_HP=5000000;
  const WARN=[0,1.45,1.15,.9];
  const NAMES={ascent:'Ascenso Draco',charge:'Velocidad Extrema',dragon:'Pulso Dragón',hurricane:'Vendaval',meteor:'Cometa Draco'};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  class Encounter extends G.Kyogre.Encounter {
    constructor(options){super(options);this.id='rayquaza';this.meteorPhase=0;}
    approach(dt){
      const p=this.target(),b=this.boss,dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy),stop=b.r+p.r+25;
      if(d<=stop)return;const step=Math.min(d-stop,(112+(this.phase-1)*18)*dt);
      b.x+=dx/d*step;b.y+=dy/d*step;this.bound(b);this.moving=true;
    }
    createAttack(kind){
      if(!NAMES[kind])return null;
      const b=this.boss,p=this.target();
      const a={kind,name:NAMES[kind],t:0,warn:WARN[this.phase],active:.4,recovery:.5,
        shapes:[],hit:new Set(),damage:54,type:'flying'};
      if(kind==='ascent'){
        a.shapes=[{kind:'circle',x:p.x,y:p.y,r:58}];a.damage=64;a.recovery=.85;
        a.from={x:b.x,y:b.y};a.destination={x:clamp(p.x,ARENA.left+b.r+6,ARENA.right-b.r-6),y:clamp(p.y,ARENA.top+b.r+6,ARENA.bottom-b.r-6)};
      }else if(kind==='hurricane'){
        a.shapes=this.alive().slice(0,4).map(p=>({kind:'circle',x:p.x,y:p.y,r:43}));
        a.active=.65;a.damage=46;
      }else if(kind==='meteor'){
        a.shapes=this.alive().slice(0,4).map(p=>({kind:'circle',x:p.x,y:p.y,r:60}));
        // Fixed secondary impacts keep the central arena relevant without covering every exit.
        const angle=this.sequence*Math.PI/3;
        for(let i=0;i<3;i++)a.shapes.push({kind:'circle',x:Math.cos(angle+i*Math.PI*2/3)*185,y:Math.sin(angle+i*Math.PI*2/3)*145,r:40});
        a.warn=[0,1.9,1.6,1.35][this.phase];a.damage=74;a.type='dragon';a.recovery=1.7;a.active=.5;
      }else{
        let dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy);if(d<1){dx=0;dy=1;d=1;}
        const nx=dx/d,ny=dy/d,pad=kind==='charge'?b.r+8:0;
        let length=Math.hypot(ARENA.right-ARENA.left,ARENA.bottom-ARENA.top);
        if(nx>.001)length=Math.min(length,(ARENA.right-pad-b.x)/nx);
        if(nx<-.001)length=Math.min(length,(ARENA.left+pad-b.x)/nx);
        if(ny>.001)length=Math.min(length,(ARENA.bottom-pad-b.y)/ny);
        if(ny<-.001)length=Math.min(length,(ARENA.top+pad-b.y)/ny);
        length=Math.max(0,length);
        a.shapes=[{kind:'line',ax:b.x,ay:b.y,bx:b.x+nx*length,by:b.y+ny*length,width:kind==='charge'?b.r*2+12:42}];
        a.damage=kind==='charge'?60:56;a.type=kind==='charge'?'normal':'dragon';
        a.active=kind==='charge'?Math.max(.25,length/(800+(this.phase-1)*100)):.55;
        a.recovery=kind==='charge'?.9:.5;
      }
      return a;
    }
    beginCombo(kinds){
      // The meteor shower is a readable climax with its own punish window.
      if((kinds.includes('meteor')&&kinds.length>1)||(kinds.includes('ascent')&&kinds.includes('charge')))return false;
      return super.beginCombo(kinds);
    }
    onImpact(a){if(a.kind==='ascent'){this.boss.x=a.destination.x;this.boss.y=a.destination.y;}}
    resolveHits(){
      for(const p of this.alive()){
        const hits=this.attacks.filter(a=>a.t>=a.warn&&a.t<a.warn+a.active&&!a.hit.has(p)&&
          (a.kind==='charge'?Math.hypot(p.x-this.boss.x,p.y-this.boss.y)<p.r+this.boss.r:a.shapes.some(s=>contains(s,p))));
        if(!hits.length)continue;for(const a of hits)a.hit.add(p);
        if(this.clock-(this.hitCooldown.get(p)??-99)<.9)continue;
        const a=hits.reduce((best,a)=>a.damage>best.damage?a:best);
        this.hit(p,a.damage,a.type);this.hitCooldown.set(p,this.clock);this.lastDamage=this.clock;
      }
    }
    chooseAttack(){
      if(this.phase>=2&&this.meteorPhase<this.phase){this.meteorPhase=this.phase;this.begin('meteor');return;}
      const pattern=['ascent','dragon','charge','hurricane'],kind=pattern[this.sequence++%pattern.length],kinds=[kind];
      if(this.phase>=2)kinds.push(kind==='hurricane'?'dragon':'hurricane');
      if(this.phase===3){const third=kind==='charge'||kind==='ascent'?'dragon':'charge';kinds.push(third);}
      this.beginCombo(kinds);
    }
    idleDelay(){return [0,.32,.2,.12][this.phase];}
  }
  return {Encounter,BASE_HP,WARN};
})();
