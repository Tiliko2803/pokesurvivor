// CPU-only preview of the production cinematic, with the real sprite atlases.
// Useful when a browser executable is unavailable. No GIF frame is retouched.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createCanvas,Image,GlobalFonts}=require('@napi-rs/canvas');
const root=path.join(__dirname,'..'),out=path.resolve(process.argv[2]||path.join(root,'../mega-icon-updated-frames'));
GlobalFonts.registerFromPath(path.join(root,'assets/fonts/PixelifyPS-700.ttf'),'Pixelify');
const G={};
class AssetImage extends Image {
 set src(value){super.src=typeof value==='string'?fs.readFileSync(path.join(root,value.split('?')[0])):value;}
}
const context=vm.createContext({G,window:{G},console,Image:AssetImage,performance,setTimeout,clearTimeout,
 document:{createElement:()=>createCanvas(1,1)}});
const load=file=>vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
for(const f of ['js/core/util.js','js/data/sprites-meta.js','js/core/sprites.js'])load(f);
G.MegaArt={Animator:G.Sprites.Animator};G.Settings={get:()=>false,fx:2};G.Touch={reset(){}};G.Audio={sfx(){}};
load('js/systems/tinkaton.js');load('js/systems/mega-evolution.js');
(async()=>{
 fs.mkdirSync(out,{recursive:true});await G.Sprites.preload([959]);G.Tinkaton.preload();
 for(let i=0;i<100&&!G.Tinkaton.ready();i++)await new Promise(r=>setTimeout(r,10));
 if(!G.Tinkaton.ready())throw Error('Mega sprite atlas did not decode');
 const p={dex:959,mega:'tinkatonite',x:0,y:0,mon:{name:'Mega Tinkaton'},anim:new G.Tinkaton.Animator()};
 const cv=createCanvas(800,450),ctx=cv.getContext('2d'),cam={scale:800/768,left:()=>-384,top:()=>-216};
 G.MegaEvolution.begin(p);
 for(let i=0;i<78;i++){
  if(i)G.MegaEvolution.tick(1/25);
  const gradient=ctx.createRadialGradient(400,215,10,400,215,450);
  gradient.addColorStop(0,'#28213f');gradient.addColorStop(1,'#07091b');ctx.fillStyle=gradient;ctx.fillRect(0,0,800,450);
  ctx.save();ctx.strokeStyle='#8674b91a';ctx.lineWidth=1;
  for(let j=0;j<20;j++){const a=j*Math.PI*2/20;ctx.beginPath();ctx.moveTo(400+Math.cos(a)*160,230+Math.sin(a)*80);ctx.lineTo(400+Math.cos(a)*550,230+Math.sin(a)*275);ctx.stroke();}
  ctx.restore();G.MegaEvolution.draw(ctx,800,450,cam);
  if(!G.MegaEvolution.active){ctx.save();ctx.translate(400,225);ctx.scale(cam.scale,cam.scale);p.anim.update(1/25);p.anim.draw(ctx,0,0);ctx.restore();}
  fs.writeFileSync(path.join(out,`${String(i).padStart(3,'0')}.png`),cv.toBuffer('image/png'));
 }
 console.log('78 preview frames rendered from the production cinematic and actual Tinkaton atlases.');
})().catch(e=>{console.error(e);process.exitCode=1;});
