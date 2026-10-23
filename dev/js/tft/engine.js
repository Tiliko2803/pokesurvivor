/* PokéSurvivor TFT alpha — isolated rules; no survivor save, coins or rankings. */
G.TFT = (() => {
  'use strict';
  const COLS = 6, ROWS = 6, BENCH = 8, LAST_ROUND = 12;
  // cost, role, signature move; stats/types/art come from the existing Pokédex.
  const DEFINITIONS = [
    [[1,2,3],1,'healer',['Absorber','Drenadoras','Rayo Solar']],
    [[4,5,6],1,'mage',['Ascuas','Lanzallamas','Llamarada']],
    [[7,8,9],1,'tank',['Burbuja','Hidropulso','Hidrobomba']],
    [[172,25,26],1,'mage',['Impactrueno','Rayo','Trueno']],
    [[133,134],1,'mage',['Rapidez','Hidropulso','Hidrobomba']],
    [[66,67,68],1,'fighter',['Golpe Karate','Demolición','A Bocajarro']],
    [[152,153,154],1,'healer',['Absorber','Síntesis','Aromaterapia']],
    [[194,195],1,'tank',['Disparo Lodo','Agua Lodosa','Terremoto']],
    [[37,38],2,'mage',['Ascuas','Lanzallamas','Llamarada']],
    [[54,55],2,'mage',['Pistola Agua','Hidropulso','Hidrobomba']],
    [[81,82,462],2,'tank',['Chispa','Chispazo','Electrocañón']],
    [[92,93,94],2,'mage',['Lengüetazo','Bola Sombra','Infortunio']],
    [[280,281,282],2,'healer',['Confusión','Pulso Cura','Deseo']],
    [[447,448],2,'fighter',['Palmeo','Esfera Aural','A Bocajarro']],
    [[529,530],3,'fighter',['Garra Metal','Taladradora','Terremoto']],
    [[123,212],3,'fighter',['Corte','Puño Bala','Tijera X']],
    [[131],3,'tank',['Rayo Hielo','Ventisca','Ventisca']],
    [[63,64,65],3,'mage',['Confusión','Psicorrayo','Psíquico']],
    [[328,329,330],3,'mage',['Bucle Arena','Dragoaliento','Pulso Dragón']],
    [[246,247,248],4,'tank',['Lanzarrocas','Avalancha','Roca Afilada']],
    [[258,259,260],4,'tank',['Pistola Agua','Agua Lodosa','Terremoto']],
    [[255,256,257],4,'fighter',['Ascuas','Doble Patada','Patada Ígnea']],
    [[374,375,376],4,'tank',['Placaje','Garra Metal','Puño Meteoro']],
    [[384],5,'mage',['Pulso Dragón','Cometa Draco','Cometa Draco']]
  ];
  const ROSTER = DEFINITIONS.map(([line,cost,role,moves]) => ({dex:line[0],line,cost,role,moves,move:moves[0]}));
  const BY = {};
  for(const family of ROSTER) for(const [stage,dex] of family.line.entries())
    BY[dex]={...family,dex,stage,move:family.moves[stage]};
  const evolvedDex=(dex,star)=>BY[dex].line[Math.min(star-1,BY[dex].line.length-1)];
  const moveFor=u=>BY[u.dex].moves[u.star-1];
  const XP = [0,0,0,0,6,12,20]; // cost to reach levels 4, 5, 6
  const ODDS = {3:[75,25,0,0,0],4:[50,35,15,0,0],5:[30,35,25,10,0],6:[20,25,30,20,5]};
  function create(seed = Date.now()) {
    const s = {seed:seed>>>0,nextId:1,round:1,life:50,gold:10,level:3,xp:0,
      units:[],shop:[],locked:false,phase:'planning',battle:null,result:null,wins:0,streak:0};
    reroll(s,true); return s;
  }
  function random(s) { s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0; return s.seed/4294967296; }
  function roll(s) {
    let n=random(s)*100, cost=1;
    for (const chance of ODDS[s.level]) { n-=chance; if(n<0)break; cost++; }
    const pool=ROSTER.filter(p=>p.cost===cost); return pool[Math.floor(random(s)*pool.length)].dex;
  }
  function planning(s) { return s.phase==='planning'; }
  function reroll(s,free=false) {
    if(!planning(s)||(!free&&s.gold<2))return false;
    if(!free)s.gold-=2;
    s.shop=Array.from({length:5},()=>roll(s)); return true;
  }
  function addUnit(s,dex,star=1,pos=null) { const u={id:s.nextId++,dex,star,pos};s.units.push(u);return u; }
  function combine(s) {
    // Prefer the deployed copy so merges keep the player's formation.
    for (let star=1;star<3;star++) for (const def of ROSTER) {
      let copies=s.units.filter(u=>BY[u.dex].line[0]===def.dex&&u.star===star);
      while(copies.length>=3) {
        copies.sort((a,b)=>(a.pos===null)-(b.pos===null)||a.id-b.id);
        const [keep,...consumed]=copies.slice(0,3); keep.star++;keep.dex=evolvedDex(keep.dex,keep.star);
        const ids=new Set(consumed.map(u=>u.id));s.units=s.units.filter(u=>!ids.has(u.id));
        copies=s.units.filter(u=>BY[u.dex].line[0]===def.dex&&u.star===star);
      }
    }
  }
  function buy(s,index) {
    if(!planning(s))return false;
    const dex=s.shop[index], def=BY[dex]; if(!def||s.gold<def.cost)return false;
    const merges=s.units.filter(u=>u.dex===dex&&u.star===1).length>=2;
    if(s.units.filter(u=>u.pos===null).length>=BENCH&&!merges)return false;
    s.gold-=def.cost;s.shop[index]=null;addUnit(s,dex);combine(s);return true;
  }
  function place(s,id,pos) {
    if(!planning(s)||!(pos===null||(Number.isInteger(pos)&&pos>=18&&pos<36)))return false;
    const u=s.units.find(u=>u.id===id);if(!u)return false;
    const other=pos===null?null:s.units.find(u=>u.pos===pos);
    if(pos!==null&&u.pos===null&&!other&&s.units.filter(u=>u.pos!==null).length>=s.level)return false;
    if(pos===null&&u.pos!==null&&s.units.filter(u=>u.pos===null).length>=BENCH)return false;
    if(other)other.pos=u.pos;
    u.pos=pos;return true;
  }
  function sell(s,id) {
    if(!planning(s))return false;
    const u=s.units.find(u=>u.id===id);if(!u)return false;
    s.gold+=BY[u.dex].cost*3**(u.star-1);s.units=s.units.filter(v=>v!==u);return true;
  }
  function gainXP(s,n) { s.xp+=n;while(s.level<6&&s.xp>=XP[s.level+1]) {s.xp-=XP[s.level+1];s.level++;}if(s.level===6)s.xp=0; }
  function buyXP(s) {if(!planning(s)||s.level>=6||s.gold<4)return false;s.gold-=4;gainXP(s,4);return true;}
  function traits(units) {
    const counts={};const seen=new Set();
    for(const u of units) {
      const family=BY[u.dex].line[0];
      for(const t of G.DEX_BY[u.dex].types) {
        const key=family+':'+t;if(seen.has(key))continue;seen.add(key);
        counts[t]=(counts[t]||0)+1;
      }
    }
    return Object.fromEntries(Object.entries(counts).map(([t,n])=>[t,{count:n,tier:n>=4?2:n>=2?1:0}]));
  }
  // Every type has a benefit. Buffs apply to units of that type only.
  const EFFECTS={fire:'attack',fighting:'attack',dragon:'attack',dark:'attack',
    electric:'speed',flying:'speed',bug:'speed',water:'mana',psychic:'mana',
    grass:'regen',fairy:'regen',normal:'hp',rock:'hp',ground:'hp',steel:'armor',
    poison:'pierce',ghost:'pierce',ice:'slow'};
  function enemyTeam(s) {
    const n=Math.min(6,2+Math.floor(s.round/2)), cap=Math.min(5,1+Math.floor(s.round/3));
    const pool=ROSTER.filter(p=>p.cost<=cap);const units=[];
    for(let i=0;i<n;i++) {
      const dex=s.round===LAST_ROUND&&i===0?384:pool[Math.floor(random(s)*pool.length)].dex;
      const star=s.round>=10&&i===0?3:s.round>=5&&i<Math.floor(s.round/3)?2:1;
      units.push({id:-(i+1),dex:evolvedDex(dex,star),star,pos:6+i});
    }
    return units;
  }
  // Reuse the Survivor personality classifier, adapting its decisions to a grid.
  function aiFor(dex) {
    const behavior=G.Enemies?.behaviorOf?.(G.DEX_BY[dex])||'chase';
    const role=BY[dex].role;
    if(behavior==='healer'||role==='healer')return 'healer';
    if(behavior==='shielder')return 'guardian';
    if(role==='mage')return 'ranged';
    if(role==='tank')return 'tank';
    if(['ranged','fan','beamer'].includes(behavior))return 'ranged';
    if(['charger','jumper','runner'].includes(behavior)&&role==='fighter')return 'diver';
    return role==='tank'?'tank':'fighter';
  }
  function selectTarget(b,a) {
    const foes=b.units.filter(u=>u.side!==a.side&&u.hp>0);
    const priority=u=>['healer','ranged'].includes(u.ai)?0:1;
    return foes.sort((x,y)=>{
      if(a.ai==='diver')return priority(x)-priority(y)||distance(a,x)-distance(a,y)||x.id-y.id;
      if(a.ai==='ranged') {
        const xr=distance(a,x)<=a.range,yr=distance(a,y)<=a.range;
        if(xr!==yr)return yr-xr;
        if(xr)return x.hp/x.maxHp-y.hp/y.maxHp||x.id-y.id;
      }
      return distance(a,x)-distance(a,y)||x.id-y.id;
    })[0]||null;
  }
  function retreat(b,a) {
    if(!['healer','ranged'].includes(a.ai)||a.moveCD>0)return false;
    const foes=b.units.filter(u=>u.side!==a.side&&u.hp>0);
    const nearest=q=>Math.min(...foes.map(e=>distance(q,e)));
    if(nearest(a)>=2)return false;
    const occupied=new Set(b.units.filter(u=>u!==a&&u.hp>0).map(u=>u.y*COLS+u.x));
    const options=[[0,-1],[-1,0],[1,0],[0,1]].map(([dx,dy])=>({x:a.x+dx,y:a.y+dy}))
      .filter(q=>q.x>=0&&q.x<COLS&&q.y>=0&&q.y<ROWS&&!occupied.has(q.y*COLS+q.x)&&nearest(q)>nearest(a));
    options.sort((x,y)=>nearest(y)-nearest(x));
    if(!options.length)return false;
    a.x=options[0].x;a.y=options[0].y;a.moveCD=.45;return true;
  }
  function fighter(u,side,synergies,round) {
    const p=G.DEX_BY[u.dex],def=BY[u.dex],power=1.8**(u.star-1),ai=aiFor(u.dex);
    const f={...u,side,x:u.pos%COLS,y:Math.floor(u.pos/COLS),types:p.types,role:def.role,
      ai,maxHp:(def.role==='tank'?480:330)*(1+def.cost*.1)*power,
      attack:(35+def.cost*9)*power,armor:def.role==='tank'?40:20,
      interval:Math.max(.65,1.35-(p.spd-90)/100),range:['ranged','healer'].includes(ai)?3:1,
      mana:0,manaGain:0,regen:0,pierce:0,slow:0,shield:0,cooldown:.2,moveCD:0,flash:0};
    for(const type of p.types) {
      const tier=synergies[type]?.tier||0;if(!tier)continue;
      switch(EFFECTS[type]) {
        case 'attack':f.attack*=1+.15*tier;break;
        case 'hp':f.maxHp*=1+.2*tier;break;
        case 'armor':f.armor+=20*tier;break;
        case 'speed':f.interval/=1+.15*tier;break;
        case 'mana':f.manaGain+=5*tier;break;
        case 'regen':f.regen+=.015*tier;break;
        case 'pierce':f.pierce+=.15*tier;break;
        case 'slow':f.slow=Math.max(f.slow,.15*tier);break;
      }
    }
    if(side===1) {const k=1+(round-1)*.035;f.maxHp*=k;f.attack*=k;}
    f.hp=f.maxHp;return f;
  }
  function start(s) {
    if(!planning(s)||!s.units.some(u=>u.pos!==null))return false;
    const team=s.units.filter(u=>u.pos!==null),foes=enemyTeam(s);
    s.battle={time:0,acc:0,events:[],units:[...team.map(u=>fighter(u,0,traits(team),s.round)),
      ...foes.map(u=>fighter(u,1,traits(foes),s.round))]};
    s.phase='combat';s.result=null;return true;
  }
  const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
  function hit(b,a,t,power,spell=false) {
    const type=a.types[0],mult=G.Types?.mult?G.Types.mult(type,t.types):1;
    const damage=Math.max(1,Math.round(power*mult*100/(100+t.armor*(1-Math.min(.8,a.pierce)))));
    const absorbed=Math.min(t.shield,damage);t.shield-=absorbed;t.hp=Math.max(0,t.hp-(damage-absorbed));
    t.flash=.16;t.mana=Math.min(100,t.mana+8);
    if(a.slow)t.slowUntil=b.time+2,t.slowPower=a.slow;
    b.events.push({kind:spell?'spell':'hit',from:a.id,to:t.id,amount:damage,ttl:.45});
  }
  function cast(b,a,target) {
    a.mana=0;
    b.events.push({kind:'cast',from:a.id,move:moveFor(a),ttl:.8});
    if(a.ai==='guardian') {
      const ally=b.units.filter(u=>u.side===a.side&&u.hp>0).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp||x.id-y.id)[0];
      const amount=Math.round(a.maxHp*.25);ally.shield=Math.min(ally.maxHp*.5,ally.shield+amount);
      b.events.push({kind:'shield',from:a.id,to:ally.id,amount,ttl:.6});
      hit(b,a,target,a.attack*1.5,true);
    } else if(a.ai==='healer') {
      const ally=b.units.filter(u=>u.side===a.side&&u.hp>0).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp)[0];
      const amount=Math.round(a.attack*3.2);ally.hp=Math.min(ally.maxHp,ally.hp+amount);
      b.events.push({kind:'heal',from:a.id,to:ally.id,amount,ttl:.6});
    } else if(a.role==='tank') {
      a.shield=Math.min(a.maxHp*.5,a.shield+a.maxHp*.25);
      for(const t of b.units.filter(u=>u.side!==a.side&&u.hp>0&&distance(a,u)<=2))hit(b,a,t,a.attack*1.5,true);
    } else if(a.role==='mage') {
      const targets=b.units.filter(u=>u.side!==a.side&&u.hp>0&&distance(target,u)<=1);
      for(const t of targets)hit(b,a,t,a.attack*2,true);
    } else hit(b,a,target,a.attack*3.5,true);
  }
  function finish(s,winner) {
    const b=s.battle,won=winner===0;
    if(won) {s.wins++;s.streak=Math.max(0,s.streak)+1;} else {
      s.streak=Math.min(0,s.streak)-1;
      s.life=Math.max(0,s.life-4-Math.floor(s.round/2)-b.units.filter(u=>u.side===1&&u.hp>0).length);
    }
    const interest=Math.min(5,Math.floor(s.gold/10)),bonus=Math.min(3,Math.floor(Math.abs(s.streak)/2));
    const income=5+interest+bonus+(won?1:0);s.gold+=income;gainXP(s,2);
    s.result={won,draw:winner===-1,income,interest,bonus,round:s.round};
    s.phase=s.life<=0?'defeat':s.round>=LAST_ROUND?'victory':'result';
  }
  function step(s,dt) {
    const b=s.battle;b.time+=dt;
    b.events=b.events.filter(e=>(e.ttl-=dt)>0);
    // Alternate initiative to avoid a permanent first-side advantage.
    const order=Math.floor(b.time*20)%2?[...b.units].reverse():b.units;
    for(const a of order) {
      a.flash=Math.max(0,a.flash-dt);if(a.hp<=0)continue;
      a.hp=Math.min(a.maxHp,a.hp+a.maxHp*a.regen*dt);
      a.cooldown-=dt;a.moveCD-=dt;
      const enemies=b.units.filter(u=>u.side!==a.side&&u.hp>0);
      if(!enemies.length){finish(s,a.side);return;}
      const target=selectTarget(b,a);
      const retreated=retreat(b,a);
      if(distance(a,target)<=a.range) {
        if(a.cooldown<=0) {
          a.cooldown=a.interval/(a.slowUntil>b.time?1-a.slowPower:1);
          hit(b,a,target,a.attack);a.mana=Math.min(100,a.mana+25+a.manaGain);
          if(a.mana>=100) {
            const alive=target.hp>0?target:enemies.filter(t=>t.hp>0).sort((x,y)=>distance(a,x)-distance(a,y))[0];if(alive)cast(b,a,alive);
          }
        }
      } else if(!retreated&&a.moveCD<=0) {
        // BFS routes around occupied cells instead of walking through allies.
        const occupied=new Set(b.units.filter(u=>u!==a&&u.hp>0).map(u=>u.y*COLS+u.x));
        const queue=[{x:a.x,y:a.y,first:null}],seen=new Set([a.y*COLS+a.x]);let next=null;
        for(let i=0;i<queue.length;i++) {
          const q=queue[i];if(distance(q,target)<=a.range){next=q.first;break;}
          for(const [dx,dy] of [[0,-1],[-1,0],[1,0],[0,1]]) {
            const x=q.x+dx,y=q.y+dy,key=y*COLS+x;
            if(x<0||x>=COLS||y<0||y>=ROWS||seen.has(key)||occupied.has(key))continue;
            seen.add(key);queue.push({x,y,first:q.first||{x,y}});
          }
        }
        if(next){a.x=next.x;a.y=next.y;}a.moveCD=.3;
      }
    }
    const alive=[0,1].map(side=>b.units.some(u=>u.side===side&&u.hp>0));
    if(!alive[0]||!alive[1])finish(s,alive[0]?0:alive[1]?1:-1);
    else if(b.time>=45)finish(s,-1); // timeout is a loss; healing cannot stall forever
  }
  function tick(s,dt) {
    if(s.phase!=='combat'||!Number.isFinite(dt)||dt<=0)return;
    s.battle.acc+=Math.min(dt,.25);
    while(s.battle.acc>=.05&&s.phase==='combat'){s.battle.acc-=.05;step(s,.05);}
  }
  function next(s) {
    if(s.phase!=='result')return false;
    s.round++;s.phase='planning';s.battle=null;
    if(!s.locked)reroll(s,true);return true;
  }
  return {COLS,ROWS,BENCH,LAST_ROUND,ROSTER,BY,evolvedDex,moveFor,aiFor,selectTarget,XP,ODDS,EFFECTS,create,buy,place,sell,buyXP,reroll,traits,start,tick,next};
})();
