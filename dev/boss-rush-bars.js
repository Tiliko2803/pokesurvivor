/* Independent HP, one shared HUD width. The combat clock owns death/reflow animation. */
G.BossRushBars = class {
  constructor(bosses){this.clock=0;this.entries=bosses.map((boss,i)=>({boss,x:i/bosses.length,w:1/bosses.length,deadAt:null}));}
  update(dt){
    if(!Number.isFinite(dt)||dt<=0)return;this.clock+=Math.min(.05,dt);
    for(const e of this.entries)if(e.boss.dead&&e.deadAt===null)e.deadAt=this.clock;
    const visible=this.entries.filter(e=>e.deadAt===null||this.clock-e.deadAt<.85),n=visible.length;
    for(const [i,e]of visible.entries()){
      const k=Math.min(1,dt*10);e.x+=(i/n-e.x)*k;e.w+=(1/n-e.w)*k;
    }
  }
  draw(c,w){
    const width=Math.min(420,w-80),x=(w-width)/2;
    for(const e of this.entries){
      const age=e.deadAt===null?0:this.clock-e.deadAt;if(e.deadAt!==null&&age>=.85)continue;
      const dying=e.deadAt!==null,fade=dying?Math.max(0,1-age/.85):1;
      const bw=e.w*width,cx=x+e.x*width+bw/2,shake=dying?Math.sin(age*65)*3*fade:0;
      c.save();c.translate(cx+shake,77);c.globalAlpha*=fade;
      if(dying){c.rotate(Math.sin(age*22)*.11);c.transform(1,0,Math.sin(age*14)*.22,1,0,0);}
      c.fillStyle='#15121ef5';c.fillRect(-bw/2,-14,bw,37);
      c.textAlign='center';c.font='bold 11px monospace';c.fillStyle='#f1eadc';c.fillText(e.boss.name,-0,0,Math.max(1,bw-8));
      c.fillStyle='#4e2b35';c.fillRect(-bw/2+3,6,bw-6,7);
      c.fillStyle=e.boss.dex===377?'#dbaf72':e.boss.dex===378?'#83dff5':'#c2d4e8';
      c.fillRect(-bw/2+3,6,(bw-6)*Math.max(0,e.boss.hp/e.boss.maxHp),7);
      c.font='9px monospace';c.fillStyle='#ffffff';c.fillText(dying?'DERROTADO':Math.ceil(Math.max(0,e.boss.hp)).toLocaleString('es-MX')+' PV',0,22,Math.max(1,bw-8));c.restore();
    }
  }
};
