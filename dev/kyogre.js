/* Kyogre shares the tested encounter clock, movement bounds and damage grace with Groudon.
 * Attack geometry is locked when telegraphed; only Surf's announced wave front travels. */
G.Kyogre = (() => {
  const {ARENA,contains}=G.Groudon;
  const BASE_HP=3000000; // Calibrated against fused Onda Certera + Danza de Mil Espadas, max-gold Mega Blaziken.
  const WARN=[0,1.55,1.2,.9], MAX_WARN=[0,2.1,1.65,1.3];
  const NAMES={surf:'Surf',hydro:'Hidrobomba',ice:'Rayo Hielo',rain:'Danza Lluvia',pulse:'Pulso Primigenio'};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  class Encounter extends G.Groudon.Encounter {
    constructor(options) {super(options);this.id='kyogre';this.rainUntil=0;this.rainPhase=0;this.pulsePhase=0;}
    approach(dt) {
      const p=this.target(),b=this.boss,dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy),stop=b.r+p.r+32;
      if(d<=stop)return;
      const step=Math.min(d-stop,(92+(this.phase-1)*12)*dt);
      b.x+=dx/d*step;b.y+=dy/d*step;this.bound(b);this.moving=true;
    }
    createAttack(kind) {
      if(!NAMES[kind])return null;
      const b=this.boss,p=this.target();
      const a={kind,name:NAMES[kind],t:0,warn:WARN[this.phase],active:.36,recovery:.55,
        shapes:[],hit:new Set(),damage:50,type:'water'};
      if(kind==='surf') {
        const y=clamp(p.y,ARENA.top+20,ARENA.bottom-20);
        a.shapes=[{kind:'rect',left:ARENA.left,right:ARENA.right,top:y-30,bottom:y+30}];
        a.direction=this.sequence%2?1:-1;
        a.active=(ARENA.right-ARENA.left+200)/(520+(this.phase-1)*60);
        a.damage=48;
      } else if(kind==='hydro'||kind==='ice') {
        const fromX=kind==='ice'?clamp(b.x-55,ARENA.left+8,ARENA.right-8):b.x,fromY=b.y;
        let dx=p.x-fromX,dy=p.y-fromY,d=Math.hypot(dx,dy);
        if(d<1){dx=0;dy=1;d=1;}
        const nx=dx/d,ny=dy/d;
        let length=Math.hypot(ARENA.right-ARENA.left,ARENA.bottom-ARENA.top);
        if(nx>.001)length=Math.min(length,(ARENA.right-fromX)/nx);
        if(nx<-.001)length=Math.min(length,(ARENA.left-fromX)/nx);
        if(ny>.001)length=Math.min(length,(ARENA.bottom-fromY)/ny);
        if(ny<-.001)length=Math.min(length,(ARENA.top-fromY)/ny);
        // Long fixed line reaches the arena edge even in portrait. No tracking after the tell.
        a.shapes=[{kind:'line',ax:fromX,ay:fromY,bx:fromX+nx*length,by:fromY+ny*length,width:kind==='hydro'?46:34}];
        a.damage=kind==='hydro'?58:40;a.type=kind==='ice'?'ice':'water';
        a.active=kind==='ice'?.45:.55;
      } else if(kind==='rain') {
        a.damage=0;a.active=.25;a.recovery=.45;
      } else if(kind==='pulse') {
        // One refuge per living player, merged into horizontal clear channels.
        // Every teammate can shelter locally, including a large sprite at a corner.
        const bands=this.alive().map(p=>{
          const half=Math.max(54,p.r+28),y=clamp(p.y,ARENA.top+half,ARENA.bottom-half);
          return {top:y-half,bottom:y+half};
        }).sort((a,b)=>a.top-b.top);
        const merged=[];
        for(const band of bands){const last=merged[merged.length-1];if(last&&band.top<=last.bottom)last.bottom=Math.max(last.bottom,band.bottom);else merged.push({...band});}
        a.safes=merged.map(s=>({kind:'rect',left:ARENA.left,right:ARENA.right,...s}));
        let top=ARENA.top;
        for(const safe of a.safes){if(safe.top>top)a.shapes.push({kind:'rect',left:ARENA.left,right:ARENA.right,top,bottom:safe.top});top=safe.bottom;}
        if(top<ARENA.bottom)a.shapes.push({kind:'rect',left:ARENA.left,right:ARENA.right,top,bottom:ARENA.bottom});
        a.warn*=1.3;a.damage=70;a.active=.55;a.recovery=1.6;
      }
      return a;
    }
    beginCombo(kinds) {
      if(this.finished||this.attacks.length||!kinds.length||kinds.length>3||new Set(kinds).size!==kinds.length)return false;
      if(kinds.length>1&&kinds.some(k=>k==='rain'||k==='pulse'))return false;
      let attacks=kinds.map(k=>this.createAttack(k));if(attacks.some(a=>!a))return false;
      let warn;
      while(attacks.length){
        const needed=this.alive().map(p=>{
          const route=this.findEscape(p,attacks),speed=Math.min(130,p.source?.spd??130);
          return route?route.distance/Math.max(1,speed)+.22:Infinity;
        });
        warn=Math.max(...attacks.map(a=>a.warn),...needed);
        if(warn<=MAX_WARN[this.phase])break;
        if(attacks.length===1) {
          // A slowed player still gets a fair single tell; never silently cancel the encounter.
          if(!Number.isFinite(warn))return false;
          break;
        }
        attacks.pop();
      }
      warn=Math.ceil((warn-1e-9)*100)/100;
      for(const a of attacks)a.warn=warn;
      this.attacks=attacks;attacks[0].comboName=attacks.map(a=>a.name).join(' + ');
      this.signal('attack',attacks[0]);return true;
    }
    hitShapes(a) {
      if(a.kind!=='surf')return a.shapes;
      const s=a.shapes[0],k=clamp((a.t-a.warn)/a.active,0,1);
      const x=a.direction>0?s.left-100+k*(s.right-s.left+200):s.right+100-k*(s.right-s.left+200);
      return [{...s,left:Math.max(s.left,x-50),right:Math.min(s.right,x+50)}].filter(s=>s.right>s.left);
    }
    resolveHits() {
      for(const p of this.alive()){
        const hits=this.attacks.filter(a=>a.damage>0&&a.t>=a.warn&&a.t<a.warn+a.active&&!a.hit.has(p)&&this.hitShapes(a).some(s=>contains(s,p)));
        if(!hits.length)continue;
        for(const a of hits)a.hit.add(p);
        if(this.clock-(this.hitCooldown.get(p)??-99)<.9)continue;
        const a=hits.reduce((best,a)=>a.damage>best.damage?a:best);
        const rain=a.type==='water'&&this.raining?1.15:1;
        this.hit(p,a.damage*rain,a.type,{slow:hits.some(a=>a.kind==='ice')?.7:0});
        this.hitCooldown.set(p,this.clock);this.lastDamage=this.clock;
      }
    }
    onImpact(a) {if(a.kind==='rain')this.rainUntil=this.clock+[0,12,16,20][this.phase];}
    onRecovery() {} // Kyogre does not inherit lava or recoil.
    updateHazards() {}
    idleDelay(){return [0,.38,.24,.14][this.phase];}
    chooseAttack() {
      if(this.rainPhase<this.phase){this.rainPhase=this.phase;this.begin('rain');return;}
      if(this.phase>=2&&this.pulsePhase<this.phase){this.pulsePhase=this.phase;this.begin('pulse');return;}
      if(!this.raining&&this.sequence%4===0){this.begin('rain');this.sequence++;return;}
      const order=['surf','hydro','ice'],kind=order[this.sequence++%order.length],kinds=[kind];
      if(this.phase>=2)kinds.push(kind==='ice'?'surf':'ice');
      if(this.phase===3)kinds.push(order.find(k=>!kinds.includes(k)));
      this.beginCombo(kinds);
    }
    update(dt){super.update(dt);if(this.finished)this.rainUntil=0;}
    get raining(){return !this.finished&&this.clock<this.rainUntil;}
    get label(){return (this.raining?'Lluvia · ':'')+super.label;}
  }
  return {Encounter,BASE_HP,WARN};
})();
