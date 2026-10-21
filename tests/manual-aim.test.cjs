'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {fixture}=require('./helpers/boss-rush-fixture.cjs');
function setup({touch=false}={}) {
 const f=fixture(null,{live:true}),{G,ctx}=f;
 let pad=null,clock=10;
 ctx.navigator.getGamepads=()=>pad?[pad]:[];
 ctx.document.querySelectorAll=()=>[];
 ctx.performance.now=()=>clock++;
 G.Settings.get=k=>({gamepad:true,padRumble:false,aimManual:true})[k];
 G.Settings.touch=touch;G.Touch={active:false,vector:()=>[0,0]};
 for(const file of ['js/core/input.js','js/core/gamepad.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
 G.DB.playAsGuest(); G.DB.save.partner=260; G.Game.startRun(); G.Pad.poll(.016);
 const pl=G.Game.player;pl.x=0;pl.y=0;
 return {...f,pl,setPad(axes=[0,0,0,0],pressed=[]){pad={connected:true,id:'Test standard pad',axes,buttons:Array.from({length:16},(_,i)=>({pressed:pressed.includes(i),value:pressed.includes(i)?1:0}))};G.Pad.poll(.016);}};
}
test('Right stick aims on PC and mobile; releasing it returns to automatic aim',()=>{
 for(const touch of [false,true]){
  const {G,pl,setPad}=setup({touch});assert.equal(pl.handAim(),null);
  setPad([.7,0,0,-1]);assert.equal(pl.handAim(),-Math.PI/2);assert.ok(G.Input.axis()[0]>0);
  setPad();assert.equal(pl.handAim(),null);
  pl.remote=true;setPad([0,0,1,0]);assert.equal(pl.handAim(),null);
 }
});
test('Mouse aims in world space; touch ignores synthetic mouse movement; last input wins',()=>{
 const {G,pl,setPad}=setup();
 G.Input={mouseMovedAt:50,mouseWorld:()=>({x:100,y:-G.LIFT*.5}),virtual:()=>{}};
 assert.equal(pl.handAim(),0);
 setPad([0,0,0,1]);assert.equal(pl.handAim(),Math.PI/2);
 G.Input.mouseMovedAt=1;setPad();assert.equal(pl.handAim(),null);
 G.Input.mouseMovedAt=100;assert.equal(pl.handAim(),0);
 G.Settings.touch=true;assert.equal(pl.handAim(),null);
});
test('Directional attacks fire without a target only while manually aiming',()=>{
 const {G,pl}=setup();const move=G.Moves.instance('ember');
 pl.activeGroup=()=>[move];pl.cast=()=>{};pl.target=null;pl.aim=Math.PI/2;
 G.Projectiles.clear();G.Combat.tick(0,pl,0);assert.equal(G.Projectiles.all().length,0);
 pl.manualAim=true;move.t=0;G.Combat.tick(0,pl,0);
 assert.ok(G.Projectiles.all().length>0);assert.ok(Math.abs(G.Projectiles.all()[0].vx)<1e-8);
});
test('Manual target selection prefers living enemies inside the aiming cone',()=>{
 const {pl}=setup(),front={x:100,y:0},side={x:0,y:10},dead={x:5,y:0,dead:true};
 assert.equal(pl.enemyAlong([side,dead,front],0),front);
 assert.equal(pl.enemyAlong([side,dead],0),null);
});
test('Controller switches attacks and pauses once per press, with a stick dead zone',()=>{
 const {G,setPad}=setup();setPad([.1,.1,0,0],[5,9]);
 assert.equal(G.Input.tap('keye'),true);assert.equal(G.Input.tap('escape'),true);
 assert.deepEqual(Array.from(G.Input.axis()),[0,0]);G.Input.endFrame();
 setPad([0,0,0,0],[5,9]);assert.equal(G.Input.tap('keye'),false);
});
