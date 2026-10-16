/* Mega Swampert — sprites genuinos de PokeAPI (forma 10064).
 * Frente / espalda, normal / shiny. Acciones interpoladas, no hojas de PMD.
 */
G.MegaArt=(()=>{
 const DIR='assets/pokemon/260/mega/';
 const ROOT='dev/'+DIR; // Atlas y GIF de respaldo compartidos por versión principal y /dev/.
 const DUR={Idle:.95,Walk:.45,Attack:.34,Shoot:.5,Charge:.78,Hurt:.34,Faint:.8};
 const images={};

 // Descompresión GIF89a con transparencias y eliminación de cuadros.
 // Cada cuadro compuesto se conserva como Canvas, no se depende del primer fotograma.
 function decode(buffer){
  const bytes=new Uint8Array(buffer);let i=0;
  const one=()=>bytes[i++],two=()=>one()|(one()<<8);
  const tag=String.fromCharCode(...bytes.slice(0,6));i=6;
  if(tag!=='GIF89a'&&tag!=='GIF87a')throw Error('GIF inválido');
  const w=two(),h=two(),packed=one();one();one();
  if(w<1||h<1||w>500||h>500)throw Error('GIF fuera de tamaño');
  const palette=n=>{const a=bytes.slice(i,i+n*3);i+=n*3;return a;};
  const global=packed&128?palette(1<<((packed&7)+1)):null;
  const blocks=()=>{
   const data=[];let len=0,n;
   while((n=one())>0){data.push(bytes.subarray(i,i+n));i+=n;len+=n;}
   const joined=new Uint8Array(len);let k=0;
   for(const piece of data){joined.set(piece,k);k+=piece.length;}return joined;
  };
  function lzw(data,min,count){
   const clear=1<<min,end=clear+1,output=new Uint8Array(count);
   const prefixes=new Uint16Array(4096),suffixes=new Uint8Array(4096),stack=new Uint8Array(4097);
   let bit=0,width=min+1,next=end+1,prev=-1,first=0,pos=0;
   const read=()=>{
    const k=bit>>3;
    const word=(data[k]||0)|((data[k+1]||0)<<8)|((data[k+2]||0)<<16);
    const value=(word>>>(bit&7))&((1<<width)-1);
    bit+=width;return value;
   };
   while(bit+width<=data.length*8&&pos<count){
    let code=read();
    if(code===clear){width=min+1;next=end+1;prev=-1;continue;}
    if(code===end)break;
    if(prev<0){output[pos++]=code;first=code;prev=code;continue;}
    const original=code;let top=0,guard=0;
    if(code>=next){stack[top++]=first;code=prev;}
    while(code>=end+1){
     if(++guard>4096||code>=4096)throw Error('Código GIF corrupto');
     stack[top++]=suffixes[code];code=prefixes[code];
    }
    first=code;stack[top++]=first;
    while(top&&pos<count)output[pos++]=stack[--top];
    if(next<4096){prefixes[next]=prev;suffixes[next]=first;next++;
     if(next===(1<<width)&&width<12)width++;}
    prev=original;
   }
   if(pos!==count)throw Error('GIF incompleto: '+pos+'/'+count);
   return output;
  }
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;
  const ctx=cv.getContext('2d',{willReadFrequently:true});
  let gce={delay:100,disposal:0,transparent:-1},prev=null,prior=null,total=0;
  const frames=[];
  while(i<bytes.length&&frames.length<240){
   const marker=one();
   if(marker===0x3b)break;
   if(marker===0x21){
    if(one()===0xf9){
     if(one()!==4)throw Error('Control GIF inválido');
     const flags=one(),delay=two(),transparent=one();one();
     gce={delay:Math.max(40,delay*10||100),disposal:(flags>>2)&7,transparent:(flags&1)?transparent:-1};
    }else blocks();
    continue;
   }
   if(marker!==0x2c)throw Error('Bloque GIF desconocido');
   const x=two(),y=two(),fw=two(),fh=two(),attr=one();
   const colors=attr&128?palette(1<<((attr&7)+1)):global;
   if(!colors||!fw||!fh||x+fw>w||y+fh>h)throw Error('Marco GIF inválido');
   const min=one(),compressed=blocks();
   let pixels=lzw(compressed,min,fw*fh);
   if(attr&64){
    const sorted=new Uint8Array(pixels.length);let k=0;
    for(const [start,step] of [[0,8],[4,8],[2,4],[1,2]])
     for(let row=start;row<fh;row+=step){sorted.set(pixels.subarray(k,k+fw),row*fw);k+=fw;}
    pixels=sorted;
   }
   if(prev&&prev.disposal===2)ctx.clearRect(prev.x,prev.y,prev.fw,prev.fh);
   else if(prev&&prev.disposal===3&&prior)ctx.putImageData(prior,0,0);
   prior=gce.disposal===3?ctx.getImageData(0,0,w,h):null;
   const patch=document.createElement('canvas');patch.width=fw;patch.height=fh;
   const pc=patch.getContext('2d'),rgba=pc.createImageData(fw,fh);
   for(let k=0;k<pixels.length;k++){
    const n=pixels[k],c=n*3,j=k*4;
    rgba.data[j]=colors[c];rgba.data[j+1]=colors[c+1];rgba.data[j+2]=colors[c+2];
    rgba.data[j+3]=n===gce.transparent?0:255;
   }
   pc.putImageData(rgba,0,0);ctx.drawImage(patch,x,y);
   const frame=document.createElement('canvas');frame.width=w;frame.height=h;
   frame.getContext('2d').drawImage(cv,0,0);
   total+=gce.delay;frames.push({img:frame,end:total});
   prev={x,y,fw,fh,disposal:gce.disposal};
   gce={delay:100,disposal:0,transparent:-1};
  }
  if(frames.length<2)throw Error('GIF sin suficientes cuadros animados');
  return {frames,total,w,h};
 }

 function load(name){
  if(images[name])return images[name];
  const obj=images[name]={ready:false,failed:false};
  fetch(ROOT+name+'.gif').then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.arrayBuffer();})
   .then(decode).then(result=>{Object.assign(obj,result);obj.ready=true;})
   .catch(e=>{obj.failed=true;console.warn('[Mega Swampert] '+name,e.message);});
  return obj;
 }
 function preload(shiny=false){
  for(const side of ['front','back'])load(side+(shiny?'-shiny':''));
 }
 class Animator{
  constructor(dex,scale=1,shiny=false){
   this.dex=dex;this.scale=scale;this.shiny=shiny;this.dir=0;
   this.base='Idle';this.cur='Idle';this.t=0;this.speed=1;
   this.once=false;this.done=false;this.hold=false;this.gifT=0;
   this.fallback=new G.Sprites.Animator(dex,scale,shiny);
   preload(shiny);
  }
  _start(anim,once=false){
   this.cur=DUR[anim]?anim:'Idle';this.t=0;this.once=once;this.done=false;
   if(!once)this.hold=false;
   this.fallback._start(this.cur,once);
  }
  loop(anim,speed=1){
   this.base=DUR[anim]?anim:'Idle';
   if(!this.once&&this.cur!==this.base)this._start(this.base);
   if(!this.once)this.speed=speed;
   this.fallback.loop(anim,speed);
  }
  play(anim,opts={}){
   this._start(anim,true);
   this.speed=opts.speed||1;
   this.hold=!!opts.hold;
   this.fallback.play(anim,opts);
  }
  busy(){return this.once&&!this.done;}
  progress(){return this.done?1:Math.min(1,this.t/(DUR[this.cur]||.5));}
  update(dt){
   this.fallback.update(dt);
   if(!Number.isFinite(dt)||dt<=0)return;
   this.gifT+=dt*1000;
   if(this.done)return;
   this.t+=dt*this.speed;
   const dur=DUR[this.cur]||.5;
   if(this.t>=dur){
    if(this.once){
     if(this.hold){this.t=dur;this.done=true;}
     else{this._start(this.base);this.speed=1;}
    }else this.t%=dur;
   }
  }
  draw(ctx,x,y,opts={}){
   const back=this.dir>=3&&this.dir<=5;
   const mirror=this.dir===1||this.dir===2||this.dir===3;
   const art=load((back?'back':'front')+(this.shiny?'-shiny':''));
   if(!art.ready){
    this.fallback.scale=this.scale;
    this.fallback.dir=this.dir;
    this.fallback.draw(ctx,x,y,opts);
    return;
   }
   const ms=this.gifT%art.total;
   let f=art.frames[art.frames.length-1];
   for(const frame of art.frames){if(ms<frame.end){f=frame;break;}}
   const img=f.img,phase=Math.min(1,this.t/(DUR[this.cur]||.95));
   const pulse=Math.sin(phase*Math.PI*2),step=Math.abs(Math.sin(phase*Math.PI*4));
   let bob=0,stretch=1,lean=0,advance=0,opacity=opts.alpha==null?1:opts.alpha;
   switch(this.cur){
    case 'Idle':bob=-pulse*1.3;stretch=1+pulse*.012;break;
    case 'Walk':bob=-step*4;lean=pulse*.045;break;
    case 'Attack':bob=-Math.sin(phase*Math.PI)*6;lean=-Math.sin(phase*Math.PI)*.18;advance=Math.sin(phase*Math.PI)*5;break;
    case 'Shoot':bob=-Math.sin(phase*Math.PI)*3;stretch=1+Math.sin(phase*Math.PI)*.06;break;
    case 'Charge':bob=-step*1.7;stretch=1+Math.sin(phase*Math.PI)*.045;break;
    case 'Hurt':bob=phase<.5?-4:0;lean=pulse*.15;break;
    case 'Faint':lean=phase*.55;stretch=1-phase*.27;opacity*=1-phase*.36;break;
   }
   const k=0.96*this.scale;
   ctx.save();
   ctx.globalAlpha*=Math.max(0,opacity);
   ctx.translate(Math.round(x),Math.round(y));
   ctx.scale(mirror?-1:1,1);
   ctx.translate(advance,bob*k);
   ctx.rotate(lean);
   ctx.scale(stretch,stretch);
   if(opts.flash)ctx.filter='brightness(1.7)';
   ctx.drawImage(img,-img.width*k/2,-img.height*k*.89,img.width*k,img.height*k);
   ctx.restore();
  }
 }
 return {Animator,preload,decode,source:'PokeAPI/sprites Pokémon Showdown animated GIFs 10064'};
})();
