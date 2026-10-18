/* Normal Hoenn: same moves, different positioning. Uses the Guardians' fair scheduler. */
G.Eon = (() => {
  const IDS=Object.freeze([381,380]),BASE_HP=190000;
  const MOVES=Object.freeze([
    {dex:381,kind:'zen',name:'Cabezazo Zen',type:'psychic',cd:7.2,offset:1.1},
    {dex:380,kind:'dragonPulse',name:'Pulso Dragón',type:'dragon',cd:7.7,offset:2.2},
    {dex:381,kind:'dragonPulse',name:'Pulso Dragón',type:'dragon',cd:8.2,offset:4.3},
    {dex:380,kind:'psychic',name:'Psíquico',type:'psychic',cd:9,offset:5.5},
    {dex:381,kind:'psychic',name:'Psíquico',type:'psychic',cd:10,offset:7.6},
    {dex:380,kind:'zen',name:'Cabezazo Zen',type:'psychic',cd:11,offset:9.1}
  ]);
  class Encounter extends G.Regis.Encounter {
    constructor(options){super(options);this.id='eon';this.schedules=MOVES.map(m=>({...m,readyAt:m.offset,casts:0}));}
    createMove(m){
      const b=this.members.find(b=>b.dex===m.dex),p=this.targetFor(b);
      const a={kind:m.kind,name:m.name,type:m.type,owner:b,t:0,warn:1.35,active:.5,recovery:.65,shapes:[],hit:new Set(),damage:34};
      if(m.kind==='psychic'){
        a.shapes=this.alive().slice(0,4).map(p=>({kind:'circle',x:p.x,y:p.y,r:55}));
        a.warn=1.5;a.damage=33;return a;
      }
      const dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy),nx=dx/(d||1),ny=d?dy/d:1;
      const end={x:b.x+nx*Math.min(m.kind==='zen'?430:650,d+100),y:b.y+ny*Math.min(m.kind==='zen'?430:650,d+100),r:b.r};this.bound(end);
      const s={kind:'line',ax:b.x,ay:b.y,bx:end.x,by:end.y,width:m.kind==='zen'?b.r*2+6:36};
      a.shapes=[s];a.active=m.kind==='zen'?.7:Math.max(.2,Math.hypot(s.bx-s.ax,s.by-s.ay)/320);a.damage=m.kind==='zen'?40:34;
      return a;
    }
    hitShapes(a){
      if(a.kind==='psychic')return a.shapes;
      const s=a.shapes[0],t=Math.max(0,Math.min(1,(a.t-a.warn)/a.active));
      return [{kind:'circle',x:s.ax+(s.bx-s.ax)*t,y:s.ay+(s.by-s.ay)*t,r:a.kind==='zen'?a.owner.r+3:18}];
    }
    moveMembers(dt){
      this.movingMembers.clear();
      for(const b of this.living){
        this.bound(b);const a=this.attacks.find(a=>a.owner===b);
        if(a){
          if(a.kind==='zen'&&a.t+dt>=a.warn&&a.t<a.warn+a.active){
            const s=a.shapes[0],t=Math.min(1,(a.t+dt-a.warn)/a.active);
            b.x=s.ax+(s.bx-s.ax)*t;b.y=s.ay+(s.by-s.ay)*t;this.movingMembers.add(b);
          }
          continue;
        }
        const p=this.targetFor(b),dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy)||1;
        const defensive=b.dex===380,desired=defensive?265:95;
        let vx=0,vy=0;
        if(d>desired+20){vx=dx/d;vy=dy/d;}
        else if(defensive&&d<desired-25){vx=-dx/d;vy=-dy/d;}
        else if(defensive){vx=-dy/d*.65;vy=dx/d*.65;}
        const slow=b.source?.slowT>0?1-b.source.slow:1,step=(defensive?75:95)*slow*dt;
        const old={x:b.x,y:b.y};b.x+=vx*step;b.y+=vy*step;this.bound(b);
        // At a wall Latias slides sideways rather than repeatedly pushing into it.
        if(defensive&&Math.hypot(b.x-old.x,b.y-old.y)<step*.15){b.x=old.x-dy/d*step;b.y=old.y+dx/d*step;this.bound(b);}
        if(Math.hypot(b.x-old.x,b.y-old.y)>.01)this.movingMembers.add(b);
      }
    }
    get label(){return this.attacks.map(a=>a.owner.name+' · '+a.name).join(' + ')||'Dúo Eón · Latios persigue, Latias toma distancia';}
  }
  return {Encounter,IDS,BASE_HP,MOVES};
})();
