/* TFT season 1. Reuses single-player Firestore entry/summary rules, never survival scores. */
G.TFTRanking = (() => {
  'use strict';
  const KEY='ps.tft.rank.pending.v1';let busy=null;
  const fb=()=>!G.TFT_PREVIEW&&G.DB.online?G.DB.fb:null;
  const valid=j=>j&&typeof j.owner==='string'&&j.owner.length<=128&&/^s_tft1_(all2|d\d{8}|w\d{4}-\d{2}|m\d{6})$/.test(j.board)&&Number.isInteger(j.wave)&&j.wave>=1&&j.wave<=G.TFT.MAX_WAVE&&Number.isInteger(j.wins)&&j.wins>=0&&j.wins<j.wave&&!!G.DEX_BY[j.dex];
  function read(){try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a.filter(valid).slice(-40):[];}catch(_){return [];}}
  const write=a=>localStorage.setItem(KEY,JSON.stringify(a));
  const eligible=s=>!!s&&s.phase==='defeat'&&s.life===0&&s.rankRules===1&&typeof s.rankOwner==='string'&&!G.TFT_PREVIEW;
  function enqueue(s) {
    if(!eligible(s))return false;
    const leader=G.TFT.report(s,'match')[0]?.dex||s.units.find(u=>u.pos!==null)?.dex||s.deck[0];
    s.rankPeriods??=G.Ranking.periodIds();const rows=read();
    for(const p of ['d','w','m','a']){
      const j={owner:s.rankOwner,board:'s_tft1_'+s.rankPeriods[p],wave:s.round,wins:s.wins,dex:leader};
      if(!valid(j))throw new Error('Invalid TFT record');
      const old=rows.findIndex(r=>r.owner===j.owner&&r.board===j.board);
      if(old<0)rows.push(j);else if(rows[old].wave<j.wave)rows[old]=j;
    }
    const historic=rows.filter(j=>j.board.endsWith('_all2')),recent=rows.filter(j=>!j.board.endsWith('_all2'));write([...recent.slice(-Math.max(0,40-historic.length)),...historic].slice(-40));return true;
  }
  async function send(j,session) {
    const fs=session.fs,entry=fs.collection('lb').doc(j.board).collection('e').doc(j.owner),summary=fs.collection('lbs').doc(j.board);
    await fs.runTransaction(async tx=>{
      const [old,snap]=await Promise.all([tx.get(entry),tx.get(summary)]);
      if(old.exists&&old.data().t>=j.wave)return;
      const top={...(snap.exists?snap.data().top:{})};
      const row={t:j.wave,uids:[j.owner],names:[G.Social.me.name],dex:[j.dex],lv:j.wave,kills:j.wins},data={...row,shiny:[false],at:firebase.firestore.FieldValue.serverTimestamp()};
      tx.set(entry,data);
      let ev='';
      if(!(j.owner in top)&&Object.keys(top).length>=50){
        const low=Object.entries(top).sort((a,b)=>a[1].t-b[1].t)[0];
        if(low[1].t>=j.wave)return;
        ev=low[0];delete top[ev];
      }
      top[j.owner]=row;tx.set(summary,{top,me:j.owner,ev});
    });
    G.Ranking.invalidateBoard(j.board);
  }
  async function drain(){
    const session=fb();if(!session||!G.Social.me||navigator.onLine===false)return {ok:false};
    const jobs=read().filter(j=>j.owner===session.uid);let failed=false;
    for(const j of jobs){
      if(!fb()||fb().uid!==session.uid){failed=true;break;}
      try {
        await send(j,session);
        // A newer score can be queued while this transaction is in flight.
        write(read().filter(r=>!(r.owner===j.owner&&r.board===j.board&&r.wave<=j.wave)));
      } catch(e){failed=true;console.warn('[TFT ranking]',e.code||e.message);}
    }
    return {ok:!failed&&!read().some(j=>j.owner===session.uid),owner:session.uid};
  }
  function flush(){if(!busy)busy=drain().finally(()=>busy=null);return busy;}
  window.addEventListener('online',()=>flush());
  // No reads or writes without a queued record and its signed-in owner.
  setInterval(()=>{if(read().length)flush();},60000);
  return {eligible,enqueue,flush};
})();
