/* Mega Swampert Hoja 1 — atlas del usuario. Exclusivo del entorno /dev/.
 * El atlas tiene 7 bandas verticales de 960 px (Idle,Walk,Attack,Shoot,
 * Charge,Hurt,Faint), cada una con 8 filas de 120 px; celdas 120x120.
 * Hasta que se publique el atlas se conservan los GIF de respaldo.
 */
G.MegaArt = (() => {
  const previous = G.MegaArt;
  const PATH = 'dev/assets/pokemon/260/mega/mega_swampert_hoja1_atlas.webp';
  const W = 120, H = 120, ROWS = 8, BAND = ROWS * H;
  const names = ['Idle','Walk','Attack','Shoot','Charge','Hurt','Faint'];
  const count = {Idle:3,Walk:4,Attack:3,Shoot:3,Charge:3,Hurt:2,Faint:3};
  const duration = {Idle:.95,Walk:.45,Attack:.34,Shoot:.5,Charge:.78,Hurt:.34,Faint:.8};
  const atlas = new Image();
  const atlasURL = new URL(PATH, document.baseURI).href;
  const versionedURL = atlasURL + '?v=hoja1-v3';
  let ready = false, failed = false, requested = false;
  let diagnostic = 'pendiente';

  // Diagnóstico visible solo en el entorno de pruebas, incluso dentro de una run.
  // Evita confundir el GIF de respaldo con la Hoja 1 cuando algo falla.
  function status(message, ok = null) {
    diagnostic = message;
    let el = document.getElementById('mega-atlas-status');
    if (!el) {
      el = document.createElement('div');
      el.id = 'mega-atlas-status';
      el.setAttribute('role', 'status');
      el.style.cssText = [
        'position:fixed','left:50%','bottom:calc(5px + env(safe-area-inset-bottom))',
        'transform:translateX(-50%)','z-index:9999','pointer-events:none',
        'background:rgba(4,15,29,.84)','border:1px solid #8994a8',
        'color:#fff','border-radius:5px','padding:2px 8px',
        'font:700 11px sans-serif','white-space:nowrap'
      ].join(';');
      document.body.appendChild(el);
    }
    el.textContent = 'Mega · ' + message;
    el.style.borderColor = ok === true ? '#6bd696' : ok === false ? '#ff8b82' : '#8994a8';
  }
  function preload(shiny = false) {
    if (requested) return;
    requested = true;
    status('Hoja 1 cargando…');
    atlas.onload = () => {
      ready = atlas.naturalWidth === 480 && atlas.naturalHeight === names.length * BAND;
      failed = !ready;
      if (ready) status('Hoja 1 cargada ✓', true);
      else {
        status('Error: atlas ' + atlas.naturalWidth + '×' + atlas.naturalHeight, false);
        console.error('[Mega Swampert] Dimensiones inesperadas', atlas.naturalWidth, atlas.naturalHeight, versionedURL);
      }
    };
    atlas.onerror = () => {
      failed = true;
      status('Error al cargar Hoja 1 — comprobando HTTP', false);
      console.error('[Mega Swampert] Falló carga de atlas', versionedURL);
      fetch(versionedURL, {cache:'no-store'}).then(r => {
        status(r.ok ? 'Error al decodificar atlas (HTTP ' + r.status + ')' : 'Atlas HTTP ' + r.status, false);
      }).catch(() => status('Atlas no disponible: conexión', false));
    };
    atlas.src = versionedURL;
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
      this.backup = null;
      preload(shiny);
    }
    _start(anim,once=false) {
      this.cur=count[anim] ? anim : 'Idle';
      this.t=0;
      this.once=once;
      this.done=false;
      if(!once)this.hold=false;
      if (this.backup) this.backup._start(this.cur,once);
    }
    loop(anim,speed=1) {
      this.base=count[anim]?anim:'Idle';
      if(!this.once && this.cur!==this.base)this._start(this.base);
      if(!this.once)this.speed=speed;
      if (this.backup) this.backup.loop(anim,speed);
    }
    play(anim,opts={}) {
      this._start(anim,true);
      this.speed=opts.speed||1;
      this.hold=!!opts.hold;
      if (this.backup) this.backup.play(anim,opts);
    }
    busy() { return this.once&&!this.done; }
    progress() {
      return this.done?1:Math.min(1,this.t/(duration[this.cur]||.5));
    }
    update(dt) {
      if (this.backup) {
        this.backup.dir=this.dir;
        this.backup.scale=this.scale;
        this.backup.update(dt);
      }
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
        // GIF de respaldo: se crea solo cuando realmente se necesita.
        if (!this.backup) {
          this.backup = new previous.Animator(this.dex,this.scale,this.shiny);
          this.backup.dir=this.dir;
          this.backup.loop(this.base,this.speed);
          if (this.once) this.backup.play(this.cur,{speed:this.speed,hold:this.hold});
        }
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
      // 20 % más grande, conservando el anclaje de los pies.
      const k=1.32*this.scale;
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
    atlasReady:()=>ready,atlasFailed:()=>failed,atlasStatus:()=>diagnostic,atlasURL:()=>versionedURL,
    legacy:previous};
})();
