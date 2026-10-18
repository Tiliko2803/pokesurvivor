const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('Generated atlas has 64px cells; every move renders pixel sprites with bounded frames and restores canvas state',()=>{
  const bytes=fs.readFileSync(path.join(__dirname,'../assets/boss-rush/attack-atlas-v1.png'));
  assert.equal(bytes.readUInt32BE(16),256);assert.equal(bytes.readUInt32BE(20),512);
  const beamBytes=fs.readFileSync(path.join(__dirname,'../assets/boss-rush/kyogre-beams-v1.png'));
  assert.equal(beamBytes.readUInt32BE(16),512);assert.equal(beamBytes.readUInt32BE(20),64);
  const ctx=vm.createContext({G:{},Image:class{constructor(){this.complete=true;this.naturalWidth=256;}set src(v){this.url=v;this.naturalWidth=v.includes('kyogre-beams')?512:256;}}});
  for(const file of ['dev/groudon.js','dev/kyogre.js','dev/boss-rush-sprites.js','dev/groudon-fx.js','dev/kyogre-fx.js'])vm.runInContext(read(file),ctx);
  vm.runInContext('Math.random=()=>{throw new Error("Renderer consumed combat randomness")}',ctx);
  for(const who of ['Groudon','Kyogre'])for(const kinds of who==='Groudon'?[['blades'],['stomp'],['eruption'],['charge'],['rupture'],['blades','eruption','charge']]:[['surf'],['hydro'],['ice'],['rain'],['pulse'],['surf','hydro','ice']])for(const calm of [false,true])for(const state of ['warning','impact','recovery']){
    const boss={x:0,y:-65,r:35,hp:600000,maxHp:600000},p={x:20,y:70,r:24};
    const e=new ctx.G[who].Encounter({boss,players:()=>[p],hit:()=>assert.fail('Art caused damage')});
    e.beginCombo(kinds);e.rainUntil=20;
    for(const a of e.attacks)a.t=state==='warning'?a.warn*.6:state==='impact'?a.warn+a.active*.4:a.warn+a.active+.2;
    const snapshots=[],stack=[],target={globalAlpha:1,imageSmoothingEnabled:true,
      save(){stack.push([this.globalAlpha,this.imageSmoothingEnabled]);},restore(){[this.globalAlpha,this.imageSmoothingEnabled]=stack.pop();},
      drawImage(image,sx,sy,sw,sh,...dest){assert.equal(this.imageSmoothingEnabled,false);const beam=image.url.includes('kyogre-beams');assert.equal(sw,beam?126:64);assert.equal(sh,beam?28:64);assert.ok(sx>=0&&sx+sw<=(beam?512:256)&&sy>=0&&sy+sh<=(beam?64:512));assert.ok(dest.every(Number.isFinite));snapshots.push([image.url,sx,sy,...dest]);}};
    const c=new Proxy(target,{get:(o,k)=>k in o?o[k]:(...args)=>{for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n),String(k));}});
    const before=JSON.stringify({e,boss,p});ctx.G[who+'FX'].draw(c,e,boss,{quality:calm?0:2,calm});
    assert.equal(JSON.stringify({e,boss,p}),before);assert.equal(stack.length,0);assert.equal(c.globalAlpha,1);assert.equal(c.imageSmoothingEnabled,true);
    if(state!=='warning'&&!kinds.includes('rain')&&!(kinds.length===1&&kinds[0]==='surf'&&state==='recovery'))assert.ok(snapshots.length>0,who+' '+kinds+' '+state);
    assert.ok(snapshots.length<200);
    if(state!=='warning'&&who==='Kyogre'&&kinds.length===1&&['hydro','ice'].includes(kinds[0]))assert.equal(snapshots.length,1,'A beam must be a single continuous sprite');
  }
});
