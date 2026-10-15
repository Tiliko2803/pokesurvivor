/* Mega Swampert Hoja 1 — atlas del usuario. Exclusivo del entorno /dev/.
 * El atlas tiene 7 bandas verticales de 960 px (Idle,Walk,Attack,Shoot,
 * Charge,Hurt,Faint), cada una con 8 filas de 120 px; celdas 120x120.
 * Hasta que se publique el atlas se conservan los GIF de respaldo.
 */
G.MegaArt = (() => {
  const previous = G.MegaArt;
  const PATH = 'dev/assets/pokemon/260/mega/hoja1-atlas.webp';
  const W = 120, H = 120, ROWS = 8, BAND = ROWS * H;
  const names = ['Idle','Walk','Attack','Shoot','Charge','Hurt','Faint'];
  const count = {Idle:3,Walk:4,Attack:3,Shoot:3,Charge:3,Hurt:2,Faint:3};
  const duration = {Idle:.95,Walk:.45,Attack:.34,Shoot:.5,Charge:.78,Hurt:.34,Faint:.8};
  const atlas = new Image();
  let ready = false, failed = false, requested = false;
  function preload(shiny = false) {
    previous.preload(shiny);
    if (requested) return;
    requested = true;
    atlas.onload = () => {
      ready = atlas.naturalWidth === 480 && atlas.naturalHeight === names.length * BAND;
      failed = !ready;
      if (!ready) console.warn('[Mega Swampert] Atlas Hoja 1: dimensiones inesperadas');
    };
    atlas.onerror = () => {
      failed = true;
      console.info('[Mega Swampert] Falta Hoja 1; usando sprites animados de respaldo');
    };
    atlas.src = PATH + '?v=hoja1-v1';
  }

  class Animator {
    constructor(dex, scale=1, shiny=false) {
      this.dex=dex;
      this.scale=scale;
      this.shiny=shiny;
      this.dir=0;
      this.base='Idle';
      this.cur='Idle';
      this.t=0;
      this.speed=1;
      this.once=false;
      this.done=false;
      this.hold=false;
      this.backup = new previous.Animator(dex,scale,shiny);
      preload(shiny);
    }
    _start(anim,once=false) {
      this.cur=count[anim] ? anim : 'Idle';
      this.t=0;
      this.once=once;
      this.done=false;
      if(!once)this.hold=false;
      this.backup._start(this.cur,once);
    }
    loop(anim,speed=1) {
      this.base=count[anim]?anim:'Idle';
      if(!this.once && this.cur!==this.base)this._start(this.base);
      if(!this.once)this.speed=speed;
      this.backup.loop(anim,speed);
    }
    play(anim,opts={}) {
      this._start(anim,true);
      this.speed=opts.speed||1;
      this.hold=!!opts.hold;
      this.backup.play(anim,opts);
    }
    busy() { return this.once&&!this.done; }
    progress() {
      return this.done?1:Math.min(1,this.t/(duration[this.cur]||.5));
    }
    update(dt) {
      this.backup.dir=this.dir;
      this.backup.scale=this.scale;
      this.backup.update(dt);
      if(!Number.isFinite(dt)||dt<=0||this.done)return;
      this.t += dt*this.speed;
      const d=duration[this.cur]||.5;
      if(this.t>=d) {
        if(this.once) {
          if(this.hold) { this.t=d;this.done=true; }
          else { this._start(this.base);this.speed=1; }
        } else this.t %= d;
      }
    }
    draw(ctx,x,y,opts={}) {
      if(!ready || this.shiny) {
        this.backup.dir=this.dir;
        this.backup.scale=this.scale;
        this.backup.draw(ctx,x,y,opts);
        return;
      }
      const a=this.cur;
      const band=names.indexOf(a);
      const d=duration[a]||.5;
      const n=count[a]||3;
      const frame=this.done&&this.hold?n-1:Math.min(n-1,Math.floor((Math.min(this.t/d,.999999))*n));
      const dir=Math.max(0,Math.min(7,this.dir|0));
      const k=1.1*this.scale;
      const alpha=opts.alpha==null?1:opts.alpha;
      if(alpha<=0)return;
      ctx.save();
      ctx.globalAlpha*=alpha;
      ctx.imageSmoothingEnabled=false;
      if(opts.flash)ctx.filter='brightness(1.7)';
      ctx.drawImage(atlas,frame*W,(band*BAND)+(dir*H),W,H,
        Math.round(x-(W/2)*k),Math.round(y-112*k),W*k,H*k);
      ctx.restore();
    }
  }
  return {Animator,preload,source:'Hoja 1 aprobada por el usuario (8 direcciones, 7 animaciones)',
    atlasReady:()=>ready,atlasFailed:()=>failed,
    legacy:previous};
})();
