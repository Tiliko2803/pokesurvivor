'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
function fixture(){
 const values=new Map(),docs=new Map(),writes=[],invalidated=[];let failures=0;
 const ref=p=>({path:p,collection:n=>ref(p+'/'+n),doc:n=>ref(p+'/'+n)});
 const firestore={collection:n=>ref(n),runTransaction:async fn=>{
  if(failures-->0)throw new Error('offline');
  const staged=[];await fn({get:async r=>({exists:docs.has(r.path),data:()=>structuredClone(docs.get(r.path))}),set:(r,d)=>staged.push([r.path,structuredClone(d)])});
  for(const [p,d]of staged){docs.set(p,d);writes.push([p,d]);}
 }};
 const G={DB:{online:true,fb:{uid:'owner',fs:firestore}},Social:{me:{name:'Tiliko'}},DEX_BY:{6:{}},TFT:{MAX_WAVE:1000000,report:()=>[{dex:6}]},Ranking:{periodIds:()=>({d:'d20261023',w:'w2026-43',m:'m202610',a:'all2'}),invalidateBoard:b=>invalidated.push(b)}};
 const ctx=vm.createContext({G,localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},navigator:{onLine:true},window:{addEventListener(){}},setInterval(){},console:{warn(){}},firebase:{firestore:{FieldValue:{serverTimestamp:()=>123}}}});
 vm.runInContext(fs.readFileSync(path.join(root,'js/tft/ranking.js'),'utf8'),ctx);
 const run=wave=>({phase:'defeat',life:0,rankRules:1,rankOwner:'owner',round:wave,wins:wave-5,units:[],deck:[6]});
 return {G,ctx,run,docs,writes,values,invalidated,fail:n=>failures=n};
}
test('TFT writes four isolated rule-compatible boards and only improves wave records',async()=>{
 const {G,run,docs,writes}=fixture();assert.ok(G.TFTRanking.enqueue(run(24)));assert.equal((await G.TFTRanking.flush()).ok,true);assert.equal(writes.length,8);
 for(const [p,d]of docs){assert.match(p,/^(lb|lbs)\/s_tft1_/);if(p.startsWith('lb/')){assert.deepEqual(Object.keys(d).sort(),['at','dex','kills','lv','names','shiny','t','uids']);assert.equal(d.t,24);assert.equal(d.kills,19);assert.deepEqual(d.uids,['owner']);}else{assert.equal(d.me,'owner');assert.equal(d.top.owner.t,24);}}
 G.TFTRanking.enqueue(run(23));await G.TFTRanking.flush();assert.equal(writes.length,8);
 G.TFTRanking.enqueue(run(25));await G.TFTRanking.flush();assert.equal(writes.length,16);assert.equal(docs.get('lb/s_tft1_all2/e/owner').t,25);
});
test('preview, guest and old expeditions never submit; offline and wrong-owner jobs remain queued',async()=>{
 const {G,ctx,run,writes,values}=fixture();const old=run(24);delete old.rankRules;assert.equal(G.TFTRanking.enqueue(old),false);
 G.TFT_PREVIEW=true;assert.equal(G.TFTRanking.enqueue(run(24)),false);G.TFT_PREVIEW=false;
 const guest=run(24);delete guest.rankOwner;assert.equal(G.TFTRanking.enqueue(guest),false);
 G.TFTRanking.enqueue(run(24));ctx.navigator.onLine=false;assert.equal((await G.TFTRanking.flush()).ok,false);assert.equal(writes.length,0);
 ctx.navigator.onLine=true;G.DB.fb.uid='other';await G.TFTRanking.flush();assert.equal(writes.length,0);assert.equal(JSON.parse(values.get('ps.tft.rank.pending.v1')).length,4);
 G.DB.fb.uid='owner';assert.equal((await G.TFTRanking.flush()).ok,true);assert.equal(JSON.parse(values.get('ps.tft.rank.pending.v1')).length,0);
});
test('failed upload retries idempotently and a full summary evicts only a lower wave',async()=>{
 const {G,run,docs,fail,writes}=fixture();G.TFTRanking.enqueue(run(24));fail(2);assert.equal((await G.TFTRanking.flush()).ok,false);assert.equal((await G.TFTRanking.flush()).ok,true);assert.equal(writes.length,8);
 const top={};for(let i=0;i<50;i++)top['u'+i]={t:i+1,uids:['u'+i],names:['x'],dex:[6],lv:1,kills:0};docs.set('lbs/s_tft1_all2',{top});docs.delete('lb/s_tft1_all2/e/owner');
 G.TFTRanking.enqueue(run(30));await G.TFTRanking.flush();const out=docs.get('lbs/s_tft1_all2');assert.equal(Object.keys(out.top).length,50);assert.equal(out.ev,'u0');assert.equal(out.top.owner.t,30);
});
test('TFT board names use single-player Firestore rules while survival names stay unchanged',()=>{
 const s=fs.readFileSync(path.join(root,'js/net/ranking.js'),'utf8');assert.match(s,/mode==='tft'\?'s_tft1_'/);
 const rules=fs.readFileSync(path.join(root,'firestore.rules'),'utf8');assert.match(rules,/board.matches\('s_\.\*'\)/);
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert.match(html,/js\/tft\/ranking.js\?v=/);assert.doesNotMatch(html,/G.TFT_PREVIEW = true/);
 const preview=fs.readFileSync(path.join(root,'dev/index.html'),'utf8');assert.match(preview,/G.TFT_PREVIEW = true/);
});
