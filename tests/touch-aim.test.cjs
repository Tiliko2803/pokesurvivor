'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(pointer=false){
 const events={},globalEvents={},values={aimManual:true,stick:1,stickMode:'float',pad:null};
 const G={Settings:{touch:true,get:k=>values[k],on:()=>{}},Game:{state:'playing'}};
 const cv={clientWidth:800,clientHeight:400,getBoundingClientRect:()=>({left:10,top:20,width:400,height:200}),addEventListener:(k,v)=>events[k]=v,setPointerCapture:()=>{}};
 vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../js/core/touch.js'),'utf8'),{G,window:pointer?{}:{ontouchstart:null},document:{body:{classList:{add(){}}},addEventListener(){}},addEventListener:(k,v)=>globalEvents[k]=v,performance:{now:()=>1000}});G.Touch.init(cv);
 const touch=(id,x,y)=>({identifier:id,clientX:10+x/2,clientY:20+y/2});
 const send=(type,list)=>events[type]({changedTouches:list,cancelable:true,preventDefault(){}});
 const p=(type,id,x,y)=>events[type]({pointerType:'touch',pointerId:id,clientX:10+x/2,clientY:20+y/2,preventDefault(){}});
 return {G,events,globalEvents,values,touch,send,p};
}
test('Two touch sticks work simultaneously; release and cancellation affect only their owner',()=>{
 const {G,touch,send}=setup(),b=G.Touch.aimBase();
 send('touchstart',[touch(1,100,270),touch(2,b.x,b.y)]);
 send('touchmove',[touch(1,140,270),touch(2,b.x,b.y-35)]);
 assert.ok(G.Touch.vector()[0]>.9);assert.deepEqual(Array.from(G.Touch.aim()),[0,-1]);
 send('touchend',[touch(2,b.x,b.y-35)]);assert.equal(G.Touch.aim(),null);assert.ok(G.Touch.vector()[0]>.9);
 send('touchstart',[touch(3,b.x+35,b.y)]);assert.deepEqual(Array.from(G.Touch.aim()),[1,0]);
 send('touchcancel',[touch(1,140,270)]);assert.equal(G.Touch.vector(),null);assert.ok(G.Touch.aim());
 send('touchcancel',[touch(3,b.x+35,b.y)]);assert.equal(G.Touch.aim(),null);
});
test('Aim may start before movement; HUD buttons keep priority while using both sticks',()=>{
 const {G,touch,send}=setup(),b=G.Touch.aimBase();let n=0;
 send('touchstart',[touch(2,b.x+30,b.y),touch(1,100,270)]);
 G.Touch.addButton(380,310,54,54,()=>n++);
 send('touchstart',[touch(3,400,330)]);assert.equal(n,1);assert.ok(G.Touch.aim());assert.ok(G.Touch.stick);
});
test('Pointer fallback, dead zone and resets preserve independent movement/aim',()=>{
 const {G,p,globalEvents}=setup(true),b=G.Touch.aimBase();
 p('pointerdown',1,100,270);p('pointerdown',2,b.x,b.y);assert.equal(G.Touch.aim(),null);
 p('pointermove',1,140,270);p('pointermove',2,b.x+30,b.y);assert.ok(G.Touch.vector()[0]>.9);assert.ok(G.Touch.aim());
 p('pointercancel',2,b.x+30,b.y);assert.equal(G.Touch.aim(),null);assert.ok(G.Touch.stick);
 globalEvents.blur();assert.equal(G.Touch.stick,null);
});
test('Disabled manual aim retains original single stick and custom aim positions are honored',()=>{
 const {G,values,touch,send}=setup();values.aimManual=false;
 send('touchstart',[touch(1,690,280)]);send('touchmove',[touch(1,720,280)]);assert.ok(G.Touch.vector()[0]>.9);assert.equal(G.Touch.aim(),null);
 G.Touch.reset();values.aimManual=true;values.pad={aim:[.8,.3]};assert.equal(G.Touch.aimBase().x,640);assert.equal(G.Touch.aimBase().y,120);
 send('touchstart',[touch(2,640,120)]);send('touchmove',[touch(2,640,150)]);assert.deepEqual(Array.from(G.Touch.aim()),[0,1]);
 G.Game.state='paused';assert.equal(G.Touch.aim(),null);
});
