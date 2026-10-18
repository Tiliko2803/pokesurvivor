const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
function recordingContext() {
  const calls=[],stack=[];
  const target={globalAlpha:1,save(){stack.push(this.globalAlpha);calls.push(['save']);},
    restore(){this.globalAlpha=stack.pop();calls.push(['restore']);}};
  const context=new Proxy(target,{get:(o,key)=>key in o?o[key]:(...args)=>{
    for(const arg of args) if(typeof arg==='number') assert.ok(Number.isFinite(arg),key+' received a non-finite coordinate');
    calls.push([key,...args]);
  }});
  return {context,calls};
}
test('All five move effects render at warning, impact and recovery without altering combat or consuming randomness',()=>{
  const ctx=vm.createContext({G:{}});
  for(const file of ['dev/groudon.js','dev/groudon-fx.js']) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
  vm.runInContext('Math.random=()=>{throw new Error("Visual renderer must not consume combat randomness")}',ctx);
  for(const kinds of [['blades'],['stomp'],['eruption'],['charge'],['rupture'],['blades','eruption'],['charge','eruption','blades']]) for(const calm of [true,false]) for(const state of ['warning','impact','recovery']) {
    const boss={x:0,y:-65,r:35,hp:400000,maxHp:400000,dead:false},p={x:10,y:70,r:24};
    const encounter=new ctx.G.Groudon.Encounter({boss,players:()=>[p],hit:()=>assert.fail('Rendering caused damage')});
    encounter.beginCombo(kinds);encounter.clock=12;
    assert.equal(encounter.attacks.length,kinds.length);
    for(const a of encounter.attacks) a.t=state==='warning'?a.warn*.6:state==='impact'?a.warn+.15:a.warn+a.active+.3;
    const before=JSON.stringify({encounter,boss,p}),{context,calls}=recordingContext();
    ctx.G.GroudonFX.draw(context,encounter,boss,{quality:calm?0:2,calm});
    const first=JSON.stringify(calls);calls.length=0;
    ctx.G.GroudonFX.draw(context,encounter,boss,{quality:calm?0:2,calm});
    assert.equal(JSON.stringify(calls),first,'Paused visual state must stay deterministic');
    assert.equal(JSON.stringify({encounter,boss,p}),before,'Rendering changed combat state');
    assert.equal(context.globalAlpha,1);assert.ok(calls.length>10&&calls.length<6000);
  }
});
