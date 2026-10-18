/* Independent move clocks for the three preview majors. Geometry, damage, FX and
 * native hit grace stay in their encounter models; group encounters are untouched. */
G.MajorCadence=(()=>{
  const {contains}=G.Groudon;
  const PROFILES={
    groudon:[['blades',.55,[6,5,4]],['charge',2.2,[8,6.8,5.8]],['eruption',4,[7,5.8,4.8]],['stomp',6,[6.5,5.5,4.5]]],
    kyogre:[['rain',.55,[14,18,22]],['hydro',2.8,[6.8,5.6,4.6]],['surf',4.5,[8.4,7,6]],['ice',6.3,[7.5,6.2,5.2]]],
    rayquaza:[['ascent',.55,[8.4,7,6]],['dragon',2.1,[6.8,5.6,4.8]],['charge',4.2,[9.5,8,6.5]],['hurricane',6,[7.8,6.5,5.5]]]
  };
  const EXCLUSIVE=new Set(['rupture','rain','pulse','meteor']);
  const MOVING=new Set(['charge','ascent']);
  const ANCHORED=new Set(['stomp','hydro','ice','dragon']);
  const startGap=phase=>[0,.95,.8,.7][phase];
  const impactGap=phase=>[0,.85,.7,.65][phase];
  const speed=p=>Math.max(1,Math.min(130,p.source?.spd??130));
  function teamRefuges(a,players){
    // A phase special must not wait forever when teammates are far apart.
    const r=G.Groudon.ARENA,bands=players.map(p=>{
      const half=Math.max(50,p.r+24),y=Math.max(r.top+half,Math.min(r.bottom-half,p.y));
      return {top:y-half,bottom:y+half};
    }).sort((a,b)=>a.top-b.top),merged=[];
    for(const band of bands){const last=merged[merged.length-1];if(last&&band.top<=last.bottom)last.bottom=Math.max(last.bottom,band.bottom);else merged.push({...band});}
    a.safes=merged.map(b=>({kind:'rect',left:r.left,right:r.right,...b}));delete a.safe;a.shapes=[];
    let top=r.top;for(const b of merged){if(b.top>top)a.shapes.push({kind:'rect',left:r.left,right:r.right,top,bottom:b.top});top=b.bottom;}
    if(top<r.bottom)a.shapes.push({kind:'rect',left:r.left,right:r.right,top,bottom:r.bottom});
  }
  class Cadence {
    constructor(e){
      Object.defineProperty(this,'e',{value:e});this.id=e.id||'groudon';this.lastStart=-99;this.lastImpact=-99;
      this.schedules=PROFILES[this.id].map(([kind,offset,cd])=>({kind,offset,cd,readyAt:offset,casts:0,retryAt:0}));
    }
    specialDue(){
      const e=this.e;
      if(this.id==='groudon')return e.phase===3&&!e.ruptured?'rupture':null;
      if(this.id==='kyogre')return e.rainPhase<e.phase?'rain':e.phase>=2&&e.pulsePhase<e.phase?'pulse':null;
      return e.phase>=2&&e.meteorPhase<e.phase?'meteor':null;
    }
    compatible(a,checkImpact=true){
      const e=this.e;
      if(e.finished||e.boss.dead||e.boss.hp<=0||e.attacks.length>=e.phase||this.e.clock-this.lastStart<startGap(e.phase)-1e-9)return false;
      if(e.attacks.some(b=>b.kind===a.kind||EXCLUSIVE.has(b.kind)||EXCLUSIVE.has(a.kind)))return false;
      const live=e.attacks.filter(b=>b.t<b.warn+b.active);
      // A boss cannot charge/dive while emitting a beam or anchoring a stomp.
      if(live.some(b=>(MOVING.has(a.kind)&&(MOVING.has(b.kind)||ANCHORED.has(b.kind)))||(ANCHORED.has(a.kind)&&MOVING.has(b.kind))))return false;
      const impact=e.clock+a.warn,gap=impactGap(e.phase);
      if(checkImpact&&(impact-this.lastImpact<gap-1e-9||live.some(b=>Math.abs(impact-(e.clock+b.warn-b.t))<gap-1e-9)))return false;
      return true;
    }
    escapeFor(p,a){
      const e=this.e,live=e.attacks.filter(b=>b.t<b.warn+b.active),q=e.findEscape(p,[...live,a]);
      if(!q)return null;
      const duration=q.distance/speed(p)+(q.distance>.01?.25:0);
      const deadline=Math.min(a.warn,...live.filter(b=>b.t<b.warn).map(b=>b.warn-b.t));
      if(duration>deadline+1e-9)return null;
      // Also validate the route itself against attacks already dealing damage.
      const active=live.filter(b=>b.t>=b.warn);
      if(active.length)for(let i=0,n=Math.max(1,Math.ceil(q.distance/4));i<=n;i++){
        const t=i/n,point={x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t,r:p.r};
        if(active.some(b=>b.shapes.some(s=>contains(s,point))))return null;
      }
      return q;
    }
    begin(kind){
      const e=this.e,a=e.createAttack(kind);if(!a||!this.compatible(a,false))return false;
      a.phase=e.phase;
      if(kind==='rupture'&&e.alive().length>1)teamRefuges(a,e.alive());
      const oldHazards=e.hazards;if(kind==='rupture'&&!e.attacks.length)e.hazards=[];
      // Singles retain a generous warning for a slowed/large player.
      if(!e.attacks.some(b=>b.t<b.warn+b.active))for(const p of e.alive()){
        const q=e.findEscape(p,[a]);if(!q){e.hazards=oldHazards;return false;}
        a.warn=Math.max(a.warn,q.distance/speed(p)+.25);
      }
      if(!this.compatible(a)||e.alive().some(p=>!this.escapeFor(p,a))){e.hazards=oldHazards;return false;}
      e.attacks.push(a);this.lastStart=e.clock;e.sequence++;
      const m=this.schedules.find(m=>m.kind===kind);
      if(m){m.casts++;m.readyAt=e.clock+m.cd[e.phase-1];m.retryAt=0;}
      e.signal('attack',a);return true;
    }
    choose(){
      const e=this.e;if(e.cooldown>0||e.attacks.length>=e.phase||e.clock-this.lastStart<startGap(e.phase)-1e-9||e.attacks.some(a=>EXCLUSIVE.has(a.kind)))return;
      const special=this.specialDue();
      if(special){if(!e.attacks.length&&e.clock>=(this.specialRetry||0)&&!this.begin(special))this.specialRetry=e.clock+.25;return;}
      const due=this.schedules.filter(m=>m.readyAt<=e.clock&&m.retryAt<=e.clock).sort((a,b)=>a.readyAt-b.readyAt);
      for(const m of due){
        if(m.kind==='rain'&&e.raining)continue;
        if(m.kind==='stomp'&&Math.hypot(e.target().x-e.boss.x,e.target().y-e.boss.y)>130)continue;
        if(this.begin(m.kind))break;m.retryAt=e.clock+.25;
      }
    }
    impact(a){
      const e=this.e;this.lastImpact=e.clock;
      if(a.kind==='rupture')e.ruptured=true;
      if(a.kind==='rain')e.rainPhase=Math.max(e.rainPhase,a.phase);
      if(a.kind==='pulse')e.pulsePhase=Math.max(e.pulsePhase,a.phase);
      if(a.kind==='meteor')e.meteorPhase=Math.max(e.meteorPhase,a.phase);
      e.onImpact(a);e.signal('impact',a);
    }
    interrupt(){
      const e=this.e;e.attacks=[];e.hazards=[];this.lastStart=e.clock;e.cooldown=1;this.specialRetry=e.clock+1;
      for(const [i,m]of this.schedules.entries()){m.readyAt=Math.max(m.readyAt,e.clock+1+i*.25);m.retryAt=0;}
    }
    update(dt){
      const e=this.e;if(e.finished||!Number.isFinite(dt)||dt<=0)return;
      dt=Math.min(.05,dt);e.clock+=dt;e.moving=false;e.cooldown=Math.max(0,e.cooldown-dt);
      for(const p of e.alive())e.bound(p);e.bound(e.boss);
      if(e.boss.dead||e.boss.hp<=0){e.finished=true;e.attacks=[];e.hazards=[];e.hitCooldown.clear();if(this.id==='kyogre')e.rainUntil=0;e.signal('victory');return;}
      const ratio=e.boss.hp/e.boss.maxHp,phase=ratio<=.35?3:ratio<=.7?2:1;
      if(phase>e.phase){e.phase=phase;e.signal('phase',phase);}
      e.hazards=e.hazards.filter(h=>h.end>e.clock);
      for(const a of e.attacks){
        const before=a.t;a.t+=dt;
        if(before<a.warn&&a.t>=a.warn)this.impact(a);
        if(a.kind==='charge'&&a.t>=a.warn&&a.t<a.warn+a.active){
          const s=a.shapes[0],t=Math.min(1,(a.t-a.warn)/a.active);e.boss.x=s.ax+(s.bx-s.ax)*t;e.boss.y=s.ay+(s.by-s.ay)*t;
        }
        if(before<a.warn+a.active&&a.t>=a.warn+a.active){
          if(a.kind==='charge'){const s=a.shapes[0];e.boss.x=s.bx;e.boss.y=s.by;}
          e.onRecovery(a);e.signal('recovery',a);
        }
      }
      e.resolveHits();e.attacks=e.attacks.filter(a=>a.t<a.warn+a.active+a.recovery);
      if(!e.attacks.length)e.approach(dt);
      this.choose();e.updateHazards();
    }
  }
  function attach(e){
    if(!e||e.members||e.cadence)return e;
    const c=e.cadence=new Cadence(e);e.schedules=c.schedules;
    e.update=dt=>c.update(dt);e.begin=kind=>c.begin(kind);e.chooseAttack=()=>c.choose();e.interrupt=()=>c.interrupt();
    // Legacy tooling starts the first eligible move; later casts belong to the scheduler.
    e.beginCombo=kinds=>Array.isArray(kinds)&&kinds.some(kind=>c.begin(kind));
    return e;
  }
  return {attach,PROFILES,startGap,impactGap};
})();
