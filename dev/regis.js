/* Los Tres Guardianes. Per-move clocks, fixed telegraphs and shared hit grace.
 * Pure encounter rules: relative arena coordinates, no DOM, account or network. */
G.Regis = (() => {
  const {ARENA,contains,segmentDistance}=G.Groudon;
  const IDS=Object.freeze([377,378,379]), BASE_HP=44000, DAMAGE=21;
  const MOVES=Object.freeze([
    {dex:377,kind:'rocks',name:'Tumba Rocas',type:'rock',cd:8.4,offset:1.0},
    {dex:377,kind:'slide',name:'Avalancha',type:'rock',cd:7.2,offset:4.8},
    {dex:378,kind:'ice',name:'Rayo Hielo',type:'ice',cd:7.8,offset:1.9},
    {dex:378,kind:'wind',name:'Viento Hielo',type:'ice',cd:6.6,offset:5.7},
    {dex:379,kind:'steel',name:'Foco Resplandor',type:'steel',cd:6.9,offset:2.8},
    {dex:379,kind:'claw',name:'Garra Metal',type:'steel',cd:8.1,offset:6.6}
  ]);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  class Encounter extends G.Groudon.Encounter {
    constructor({bosses,...options}) {
      super({...options,boss:bosses[0]});this.id='regis';this.members=bosses;
      this.schedules=MOVES.map(m=>({...m,readyAt:m.offset,casts:0}));
      this.lastStart=-99;this.lastImpact=-99;this.movingMembers=new Set();
    }
    get living(){return this.members.filter(b=>!b.dead&&b.hp>0);}
    targetFor(b){const ps=this.alive();return ps.reduce((best,p)=>!best||Math.hypot(p.x-b.x,p.y-b.y)<Math.hypot(best.x-b.x,best.y-b.y)?p:best,null)||{x:0,y:80,r:12};}
    createMove(m) {
      const b=this.members.find(b=>b.dex===m.dex),p=this.targetFor(b);
      const a={kind:m.kind,name:m.name,type:m.type,owner:b,t:0,warn:1.35,active:.32,recovery:.6,shapes:[],hit:new Set(),damage:DAMAGE};
      if(m.kind==='rocks'||m.kind==='slide') {
        const targets=this.alive().slice(0,4);
        a.shapes=targets.map(p=>({kind:'circle',x:p.x,y:p.y,r:m.kind==='rocks'?35:43}));
        if(m.kind==='rocks'&&targets.length===1)for(const side of [-1,1])a.shapes.push({kind:'circle',x:clamp(p.x+side*72,ARENA.left+40,ARENA.right-40),y:p.y-12,r:31});
        a.warn=m.kind==='rocks'?1.5:1.35;a.damage=m.kind==='slide'?23:19;
      }else if(m.kind==='claw'){
        a.shapes=[{kind:'circle',x:b.x,y:b.y,r:95}];a.warn=1.25;a.damage=24;
      }else{
        const angle=Math.atan2(p.y-b.y,p.x-b.x),spread=m.kind==='ice'?[0]:[-.20,0,.20];
        a.shapes=spread.map(turn=>{
          const nx=Math.cos(angle+turn),ny=Math.sin(angle+turn);
          let length=m.kind==='ice'?420:380;
          if(nx>.001)length=Math.min(length,(ARENA.right-b.x)/nx);
          if(nx<-.001)length=Math.min(length,(ARENA.left-b.x)/nx);
          if(ny>.001)length=Math.min(length,(ARENA.bottom-b.y)/ny);
          if(ny<-.001)length=Math.min(length,(ARENA.top-b.y)/ny);
          return {kind:'line',ax:b.x,ay:b.y,bx:b.x+nx*length,by:b.y+ny*length,width:m.kind==='ice'?28:18};
        });
        a.warn=m.kind==='ice'?1.4:1.25;a.damage=m.kind==='ice'?22:18;
        a.active=m.kind==='ice'?.45:Math.max(...a.shapes.map(s=>Math.hypot(s.bx-s.ax,s.by-s.ay)))/230+.24;
      }
      return a;
    }
    hitShapes(a){
      if(!['wind','steel'].includes(a.kind))return a.shapes;
      return a.shapes.flatMap((s,i)=>{
        const distance=(a.t-a.warn-i*.11)*230,len=Math.hypot(s.bx-s.ax,s.by-s.ay);
        return distance<0||distance>len?[]:[{kind:'circle',x:s.ax+(s.bx-s.ax)*distance/(len||1),y:s.ay+(s.by-s.ay)*distance/(len||1),r:8}];
      });
    }
    canBegin(a){
      if(this.finished||a.owner.dead||this.attacks.length>=2||this.clock-this.lastStart<.7||this.attacks.some(b=>b.owner===a.owner))return false;
      const impact=this.clock+a.warn;
      if(impact-this.lastImpact<.65||this.attacks.some(b=>Math.abs(impact-(this.clock+b.warn-b.t))<.65))return false;
      const all=[...this.attacks,a];
      for(const p of this.alive()){
        const q=this.findEscape(p,all);if(!q)return false;
        const speed=Math.max(1,Math.min(130,p.source?.spd??130));
        const deadline=Math.min(a.warn,...this.attacks.map(b=>Math.max(0,b.warn-b.t)));
        if(q.distance/speed+.25>deadline)return false;
      }
      return true;
    }
    beginMove(schedule){
      const a=this.createMove(schedule);
      if(!this.attacks.length)for(const p of this.alive()){
        const route=this.findEscape(p,[a]);if(!route)return false;
        a.warn=Math.max(a.warn,route.distance/Math.max(1,Math.min(130,p.source?.spd??130))+.25);
      }
      if(!this.canBegin(a))return false;
      this.attacks.push(a);this.lastStart=this.clock;schedule.casts++;
      schedule.readyAt=this.clock+schedule.cd*(a.owner.hp<=a.owner.maxHp*.5?.85:1);
      this.signal('attack',a);return true;
    }
    constrain(p){
      this.bound(p);
      for(const h of this.hazards){
        const dx=p.x-h.x,dy=p.y-h.y,d=Math.hypot(dx,dy),limit=h.r+p.r+2;
        if(d<limit){
          const base=d?Math.atan2(dy,dx):Math.atan2(-h.y,-h.x),candidates=[];
          for(const turn of [0,Math.PI/2,-Math.PI/2,Math.PI]){
            const q={x:h.x+Math.cos(base+turn)*limit,y:h.y+Math.sin(base+turn)*limit,r:p.r};this.bound(q);
            if(this.hazards.every(o=>Math.hypot(q.x-o.x,q.y-o.y)>=o.r+p.r+1))candidates.push(q);
          }
          candidates.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
          if(candidates[0]){p.x=candidates[0].x;p.y=candidates[0].y;}
          else h.end=this.clock; // Retire a rock if bounds/other rocks leave no legal displacement.
        }
      }
    }
    moveMembers(dt){
      this.movingMembers.clear();
      for(const b of this.living){
        this.bound(b);if(this.attacks.some(a=>a.owner===b))continue;
        const p=this.targetFor(b),dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy);
        const clawDue=b.dex===379&&this.schedules.find(m=>m.kind==='claw').readyAt<=this.clock;
        const stop=b.dex===377?120:clawDue?90:210;
        if(d>stop){const slow=b.source?.slowT>0?1-b.source.slow:1,step=Math.min(d-stop,55*slow*dt);b.x+=dx/d*step;b.y+=dy/d*step;this.movingMembers.add(b);}
        this.constrain(b);
      }
    }
    resolveHits(){
      for(const p of this.alive()){
        const hits=this.attacks.filter(a=>a.t>=a.warn&&a.t<a.warn+a.active&&!a.hit.has(p)&&this.hitShapes(a).some(s=>contains(s,p)));
        if(!hits.length)continue;for(const a of hits)a.hit.add(p);
        if(this.clock-(this.hitCooldown.get(p)??-99)<.9)continue;
        const a=hits.reduce((x,y)=>x.damage>=y.damage?x:y);
        this.hit(p,a.damage,a.type,{slow:hits.some(a=>a.owner.dex===378)?.65:0});
        this.hitCooldown.set(p,this.clock);this.lastDamage=this.clock;
      }
    }
    interrupt(){
      this.attacks=[];this.hazards=[];this.lastStart=this.clock;
      for(const [i,m]of this.schedules.entries())m.readyAt=Math.max(m.readyAt,this.clock+1+i*.4);
    }
    update(dt){
      if(this.finished||!Number.isFinite(dt)||dt<=0)return;
      dt=Math.min(.05,dt);this.clock+=dt;
      this.hazards=this.hazards.filter(h=>h.end>this.clock&&!h.owner.dead);
      this.attacks=this.attacks.filter(a=>!a.owner.dead&&a.owner.hp>0);
      if(!this.living.length){this.finished=true;this.attacks=[];this.hazards=[];this.hitCooldown.clear();this.signal('victory');return;}
      for(const p of this.alive())this.constrain(p);
      this.moveMembers(dt);
      for(const a of this.attacks){
        const before=a.t;a.t+=dt;
        if(before<a.warn&&a.t>=a.warn){this.lastImpact=this.clock;this.signal('impact',a);}
        if(before<a.warn+a.active&&a.t>=a.warn+a.active){
          if(a.kind==='rocks')for(const s of a.shapes.slice(0,3)){
            this.hazards.push({kind:'circle',x:s.x,y:s.y,r:18,start:this.clock,end:this.clock+5,owner:a.owner});
            if(this.hazards.length>3)this.hazards.shift();
          }
          this.signal('recovery',a);
        }
      }
      this.resolveHits();
      this.attacks=this.attacks.filter(a=>a.t<a.warn+a.active+a.recovery);
      const ready=this.schedules.filter(m=>m.readyAt<=this.clock&&(m.retryAt||0)<=this.clock&&this.living.some(b=>b.dex===m.dex)).sort((a,b)=>a.readyAt-b.readyAt);
      for(const m of ready){
        const b=this.living.find(b=>b.dex===m.dex),p=this.targetFor(b);
        if(m.kind==='claw'&&Math.hypot(p.x-b.x,p.y-b.y)>125)continue;
        if(this.beginMove(m))break;
        m.retryAt=this.clock+.25;
      }
    }
    get recovering(){return this.attacks.length>0&&this.attacks.every(a=>a.t>=a.warn+a.active);}
    get label(){return this.attacks.map(a=>a.owner.name+' · '+a.name).join(' + ')||'Los Tres Guardianes · Busca una buena posición';}
  }
  return {Encounter,IDS,BASE_HP,DAMAGE,MOVES};
})();
