/* PokéSurvivor TFT alpha — isolated rules; no survivor save, coins or rankings. */
G.TFT = (() => {
  'use strict';
  const COLS = 6, ROWS = 6, BENCH = 8, LAST_ROUND = 12, BEAT_SECONDS = .5;
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
    [[384],5,'mage',['Pulso Dragón','Cometa Draco','Cometa Draco']],
    [[27,28],1,'fighter',['Arañazo','Terratemblor','Terremoto']],
    [[13,14,15],1,'fighter',['Picotazo Veneno','Fortaleza','Tijera X']],
    [[179,180,181],1,'mage',['Impactrueno','Chispazo','Trueno']],
    [[74,75,76],2,'tank',['Lanzarrocas','Terratemblor','Terremoto']],
    [[270,271,272],2,'healer',['Absorber','Síntesis','Gigadrenado']],
    [[363,364,365],2,'tank',['Nieve Polvo','Rayo Hielo','Ventisca']],
    [[440,113,242],2,'healer',['Encanto','Pulso Cura','Amortiguador']],
    [[95,208],3,'tank',['Tumba Rocas','Terremoto','Fuerza Telúrica']],
    [[371,372,373],4,'fighter',['Mordisco','Dragoaliento','Cometa Draco']],
    [[957,958,959],3,'fighter',['Golpe Roca','Martillazo','Martillo Colosal']]
  ];
  const ROSTER = DEFINITIONS.map(([line,cost,role,moves]) => ({dex:line[0],line,cost,role,moves,move:moves[0]}));
  const BY = {};
  for(const family of ROSTER) for(const [stage,dex] of family.line.entries())
    BY[dex]={...family,dex,stage,move:family.moves[stage]};
  const evolvedDex=(dex,star)=>BY[dex].line[Math.min(star-1,BY[dex].line.length-1)];
  const moveFor=u=>BY[u.dex].moves[u.star-1];
  const DEFAULT_DECK=[1,4,7,172,92,280,529,246,374,384];
  function validDeck(deck) {
    return Array.isArray(deck)&&deck.length===10&&new Set(deck).size===10&&
      deck.every(d=>Number.isInteger(d)&&BY[d]?.line[0]===d);
  }
  const XP = [0,0,0,0,6,12,20]; // cost to reach levels 4, 5, 6
  const ODDS = {3:[75,25,0,0,0],4:[50,35,15,0,0],5:[30,35,25,10,0],6:[20,25,30,20,5]};
  function create(seed = Date.now(),deck) {
    if(deck!==undefined&&!validDeck(deck))throw new Error('Elige exactamente 10 líneas distintas.');
    const s = {seed:seed>>>0,nextId:1,round:1,life:50,gold:10,level:3,xp:0,
      deck:deck?deck.slice():ROSTER.map(p=>p.dex),history:[],effects:[],units:[],shop:[],locked:false,phase:'planning',battle:null,result:null,wins:0,streak:0};
    reroll(s,true);prepareEnemy(s); return s;
  }
  function random(s) { s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0; return s.seed/4294967296; }
  function roll(s) {
    const available=ROSTER.filter(p=>s.deck.includes(p.dex));
    const weights=ODDS[s.level].map((w,i)=>available.some(p=>p.cost===i+1)?w:0);
    const sum=weights.reduce((a,b)=>a+b,0);
    let cost;
    if(!sum)cost=Math.min(...available.map(p=>p.cost));
    else {
      let n=random(s)*sum;cost=1;
      for(const w of weights){n-=w;if(n<0)break;cost++;}
    }
    const pool=available.filter(p=>p.cost===cost);
    return pool[Math.floor(random(s)*pool.length)].dex;
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
        const [keep,...consumed]=copies.slice(0,3),fromDex=keep.dex;
        keep.star++;keep.dex=evolvedDex(keep.dex,keep.star);
        s.effects.push({kind:'evolve',id:keep.id,fromDex,toDex:keep.dex,star:keep.star,ttl:1.6});
        const ids=new Set(consumed.map(u=>u.id));s.units=s.units.filter(u=>!ids.has(u.id));
        copies=s.units.filter(u=>BY[u.dex].line[0]===def.dex&&u.star===star);
      }
    }
  }
  function buy(s,index) {
    if(!planning(s))return false;
    const dex=s.shop[index], def=BY[dex]; if(!def||!s.deck.includes(def.line[0])||s.gold<def.cost)return false;
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
  // Cache once: scouting never rerolls the encounter or consumes additional RNG.
  function prepareEnemy(s) {s.opponent=enemyTeam(s);s.opponentRound=s.round;}
  function scout(s) {return (s.opponent||[]).map(u=>({...u}));}
  const ENTRANCES={
    1:['Espesura','regen',.008,'Regenera un 0,8% de vida por segundo.'],
    4:['Mar Llamas','attack',.08,'Aumenta su daño un 8%.'],
    7:['Caparazón','shield',.15,'Empieza con un escudo del 15% de su vida.'],
    172:['Electricidad Estática','mana',25,'Empieza con 25 de maná adicional.'],
    92:['Cuerpo Maldito','pierce',.1,'Ignora un 10% adicional de defensa.'],
    280:['Velo Protector','teamShield',.05,'Concede a cada aliado un escudo del 5% de la vida de ese aliado.'],
    529:['Ímpetu Arena','speed',.1,'Aumenta un 10% su potencia de cadencia.'],
    374:['Cuerpo Puro','armor',12,'Obtiene 12 de defensa.'],
    246:['Chorro Arena','shield',.18,'La arena lo protege con un escudo del 18% de su vida.'],
    371:['Intimidación','intimidate',.08,'Reduce un 8% el daño de los rivales durante este combate. No se acumula.'],
    258:['Torrente','shield',.15,'Empieza con un escudo del 15% de su vida.'],
    255:['Impulso','speed',.1,'Aumenta un 10% su potencia de cadencia.']
  };
  Object.assign(ENTRANCES,{
    "133":["Adaptabilidad","mana",25,"Empieza con 25 de maná adicional."],
    "66":["Agallas","attack",0.08,"Aumenta su daño un 8%."],
    "152":["Defensa Hoja","armor",12,"Obtiene 12 de defensa."],
    "194":["Absorbe Agua","regen",0.008,"Regenera un 0,8% de vida por segundo."],
    "37":["Absorbe Fuego","pierce",0.1,"Sus ataques ignoran un 10% adicional de defensa."],
    "54":["Aclimatación","mana",25,"Empieza con 25 de maná adicional."],
    "81":["Imán","armor",15,"Obtiene 15 de defensa."],
    "447":["Foco Interno","pierce",0.12,"Sus ataques ignoran un 12% adicional de defensa."],
    "123":["Experto","speed",0.1,"Aumenta un 10% su potencia de cadencia."],
    "131":["Cura Lluvia","teamShield",0.04,"Concede a cada aliado un escudo del 4% de la vida de ese aliado."],
    "63":["Muro Mágico","shield",0.12,"Empieza con un escudo del 12% de su vida."],
    "328":["Levitación","speed",0.1,"Aumenta un 10% su potencia de cadencia."],
    "384":["Bucle Aire","teamShield",0.06,"Concede a cada aliado un escudo del 6% de la vida de ese aliado."],
    "27":["Velo Arena","shield",0.12,"Empieza con un escudo del 12% de su vida."],
    "13":["Enjambre","attack",0.07,"Aumenta su daño un 7%."],
    "179":["Lana Protectora","shield",0.12,"Empieza con un escudo del 12% de su vida."],
    "74":["Robustez","shield",0.16,"Empieza con un escudo del 16% de su vida."],
    "270":["Nado Rápido","mana",25,"Empieza con 25 de maná adicional."],
    "363":["Sebo","armor",15,"Obtiene 15 de defensa."],
    "440":["Dicha","mana",30,"Empieza con 30 de maná adicional."],
    "95":["Coraza","armor",18,"Obtiene 18 de defensa."],
    "957":["Rompemoldes","pierce",0.12,"Sus ataques ignoran un 12% adicional de defensa."]
  });
  function entranceFor(u) {
    const entry=ENTRANCES[BY[u.dex].line[0]];
    return {name:entry[0],effect:entry[1],value:entry[2],description:entry[3]};
  }
  function entrances(b) {
    const intimidated=new Set();
    for(const a of b.units) {
      const e=entranceFor(a);a.entrance=e.name;
      if(e.effect==='shield')shield(b,a,a,a.maxHp*e.value);
      else if(e.effect==='teamShield')for(const ally of b.units.filter(u=>u.side===a.side))shield(b,a,ally,ally.maxHp*e.value);
      else if(e.effect==='attack')a.attack*=1+e.value;
      else if(e.effect==='speed')a.interval/=1+e.value;
      else if(e.effect==='mana')a.mana=Math.min(100,a.mana+e.value);
      else if(e.effect==='armor')a.armor+=e.value;
      else if(e.effect==='regen')a.regen+=e.value;
      else if(e.effect==='pierce')a.pierce+=e.value;
      else if(e.effect==='intimidate'&&!intimidated.has(a.side)) {
        intimidated.add(a.side);for(const foe of b.units.filter(u=>u.side!==a.side))foe.attack*=1-e.value;
      }
      b.events.push({kind:'entrance',from:a.id,move:e.name,ttl:1.8});
    }
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
      damageDone:0,damageTaken:0,blocked:0,kills:0,healingDone:0,shieldingDone:0,mana:0,manaGain:0,regen:0,pierce:0,slow:0,shield:0,cooldown:.2,moveCD:0,flash:0};
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
  const SIGNATURES={
    4:{types:['fire','fire','fire'],text:[
      'Una llama golpea al objetivo y lo quema durante 3 segundos.',
      'Lanza fuego en cono; daña y quema a los enemigos alcanzados.',
      'Una llamarada amplia daña en cono y aplica una quemadura de 4 segundos.']},
    7:{types:['water','water','water'],text:[
      'Golpea con una burbuja y empuja al objetivo una casilla libre.',
      'Hidropulso golpea al objetivo y sus vecinos; los empuja una casilla.',
      'Dispara un chorro en línea de 4 casillas que daña y empuja hasta 2 casillas.']},
    529:{types:['steel','ground','ground'],text:[
      'Un golpe de Acero potente contra un enemigo.',
      'Perfora hasta 3 casillas, golpea a los enemigos de la línea y acaba en una casilla libre.',
      'Perfora la línea y provoca una onda de Tierra alrededor del aterrizaje.']},
    92:{types:['ghost','ghost','ghost'],text:[
      'Golpea y ralentiza los ataques del objetivo durante 2 segundos.',
      'Bola Sombra hace un 50% más de daño a objetivos por debajo del 40% de vida.',
      'Infortunio hace un 80% más de daño a objetivos por debajo del 40% de vida y roba el 25% de la vida quitada.']},
    280:{types:['psychic','psychic','fairy'],text:[
      'Cura al aliado más herido y golpea al enemigo con Confusión.',
      'Cura al aliado más herido y elimina quemadura, ralentización y aturdimiento.',
      'Cura y escuda a los 2 aliados con menos vida proporcional.']},
    374:{types:['normal','steel','steel'],text:[
      'Embiste al objetivo, lo empuja una casilla y obtiene un pequeño escudo.',
      'Escuda al aliado más vulnerable y golpea con Garra Metal.',
      'Puño Meteoro golpea una zona, aturde durante 1 segundo y concede un escudo a Metagross.']}
  };
  Object.assign(SIGNATURES,{
    1:{types:['grass','grass','grass'],text:['Absorbe vida del objetivo y se cura el 50% del daño causado.','Planta drenadoras: daña, ralentiza y se cura el 60% del daño causado.','Rayo Solar atraviesa una línea de 5 casillas y cura al usuario el 30% del daño total.']},
    172:{types:['electric','electric','electric'],text:['Descarga contra un objetivo y lo aturde 0,3 segundos.','Rayo salta hasta 3 enemigos, con daño decreciente.','Trueno salta hasta 4 enemigos y los aturde 0,6 segundos.']},
    66:{types:['fighting','fighting','fighting'],text:['Golpe Karate ignora parte de la defensa.','Demolición destruye el escudo antes de golpear.','A Bocajarro rompe el escudo y golpea con gran potencia, pero reduce su propia defensa en 10 durante 2 segundos.']},
    152:{types:['grass','grass','grass'],text:['Absorbe vida y cura al aliado más herido.','Síntesis cura a los 2 aliados más heridos.','Aromaterapia cura a todos los aliados y elimina quemaduras, ralentizaciones y aturdimientos.']},
    255:{types:['fire','fighting','fire'],text:['Ascuas quema al objetivo durante 3 segundos.','Doble Patada golpea dos veces y gana 10% de cadencia durante 2 segundos.','Patada Ígnea daña, quema y gana 20% de cadencia durante 2 segundos.']},
    63:{types:['psychic','psychic','psychic'],text:['Confusión golpea y reduce la cadencia del objetivo durante 2 segundos.','Psicorrayo atraviesa una línea de 4 casillas.','Psíquico golpea una zona y aturde 0,8 segundos.']}
  });
  // Per-stage move definitions for every family that does not use the bespoke resolver.
  const SPECIAL_FAMILIES=new Set([133,447,131,246,258,384,371,957]);
  const FAMILY_MOVES={
    "133":[
      {"type":"normal","power":2,"text":"Estrellas que golpean al objetivo y recuperan 10 de maná.","selfMana":10},
      {"type":"water","power":1.8,"text":"Explota alrededor del objetivo y da 10 de maná a los 2 aliados más heridos.","shape":"area","radius":1,"center":"target","allyMana":10,"friends":2},
      {"type":"water","power":2.5,"text":"Un chorro atraviesa 4 casillas y da 15 de maná a los 2 aliados más heridos.","shape":"line","length":4,"allyMana":15,"friends":2}
    ],
    "194":[
      {"type":"ground","power":1.8,"text":"Lanza lodo que reduce un 20% la cadencia del objetivo durante 2 segundos.","slow":0.2},
      {"type":"water","power":1.8,"text":"Agua Lodosa daña alrededor del usuario y reduce un 20% la cadencia durante 2 segundos.","shape":"area","radius":2,"center":"self","slow":0.2},
      {"type":"ground","power":2.4,"text":"Terremoto daña en un radio de 2 casillas y concede un escudo del 15% de su vida.","shape":"area","radius":2,"center":"self","selfShield":0.15}
    ],
    "37":[
      {"type":"fire","power":1.9,"text":"Una llama daña y quema al objetivo durante 3 segundos.","burn":0.18},
      {"type":"fire","power":2.3,"text":"Lanzallamas atraviesa 4 casillas y quema durante 3 segundos.","shape":"line","length":4,"burn":0.18},
      {"type":"fire","power":2.4,"text":"Llamarada daña una zona y quema a los enemigos durante 3 segundos.","shape":"area","radius":1,"center":"target","burn":0.22}
    ],
    "54":[
      {"type":"water","power":2.2,"text":"Un chorro golpea y empuja al objetivo una casilla libre.","push":1},
      {"type":"water","power":2,"text":"Hidropulso daña una zona y reduce un 20% la cadencia durante 2 segundos.","shape":"area","radius":1,"center":"target","slow":0.2},
      {"type":"water","power":2.7,"text":"Hidrobomba atraviesa 4 casillas y empuja a los enemigos una casilla libre.","shape":"line","length":4,"push":1}
    ],
    "81":[
      {"type":"electric","power":1.8,"text":"Descarga contra un objetivo y obtiene un escudo del 12% de su vida.","selfShield":0.12},
      {"type":"electric","power":1.7,"text":"Chispazo daña en un radio de 3 casillas y le concede un escudo del 15% de su vida.","shape":"area","radius":3,"center":"self","selfShield":0.15},
      {"type":"electric","power":3,"text":"Electrocañón golpea y aturde al objetivo durante 0,8 segundos; protege al aliado más herido con un escudo del 20% de la vida de ese aliado.","stun":0.8,"friendShield":0.2,"friends":1}
    ],
    "447":[
      {"type":"fighting","power":2.2,"text":"Palmeo golpea y aturde al objetivo durante 0,4 segundos.","stun":0.4},
      {"type":"fighting","power":2.8,"text":"Esfera Aural ignora el 50% de defensa y obtiene un escudo del 15% de su vida.","pierce":0.5,"selfShield":0.15},
      {"type":"fighting","power":3.2,"text":"A Bocajarro ignora el 60% de defensa; su daño aumenta hasta un 50% según la vida perdida del objetivo y obtiene un escudo del 20% de su vida.","pierce":0.6,"execute":0.5,"selfShield":0.2}
    ],
    "123":[
      {"type":"bug","power":2.4,"text":"Corte golpea ignorando el 30% de defensa.","pierce":0.3},
      {"type":"steel","power":2.3,"text":"Puño Bala golpea y aumenta un 15% su cadencia durante 2 segundos.","boost":0.15},
      {"type":"bug","power":1.9,"text":"Tijera X golpea una zona ignorando el 40% de defensa.","shape":"area","radius":1,"center":"target","pierce":0.4}
    ],
    "131":[
      {"type":"ice","power":2,"text":"Rayo Hielo golpea y reduce un 25% la cadencia durante 2 segundos; escuda al aliado más herido con el 10% de su vida.","slow":0.25,"friendShield":0.1,"friends":1},
      {"type":"ice","power":2.1,"text":"Ventisca golpea una zona de 2 casillas y reduce un 25% la cadencia durante 2 segundos; escuda a los 2 aliados más heridos con el 12% de su vida.","shape":"area","radius":2,"center":"target","slow":0.25,"friendShield":0.12,"friends":2},
      {"type":"ice","power":2.1,"text":"Ventisca protege a todos los aliados con un escudo del 12% de su vida y ralentiza un 25% a los enemigos de la zona durante 2 segundos.","shape":"area","radius":2,"center":"target","slow":0.25,"friendShield":0.12,"friends":6}
    ],
    "328":[
      {"type":"ground","power":1.7,"text":"Bucle Arena golpea alrededor del objetivo y reduce un 20% su cadencia durante 2 segundos.","shape":"area","radius":1,"center":"target","slow":0.2},
      {"type":"dragon","power":2.2,"text":"Dragoaliento atraviesa 4 casillas y reduce un 20% la cadencia durante 2 segundos.","shape":"line","length":4,"slow":0.2},
      {"type":"dragon","power":2.3,"text":"Pulso Dragón golpea una zona y aturde durante 0,5 segundos.","shape":"area","radius":1,"center":"target","stun":0.5}
    ],
    "246":[
      {"type":"rock","power":2,"text":"Lanzarrocas golpea y obtiene un escudo del 15% de su vida.","selfShield":0.15},
      {"type":"rock","power":2,"text":"Avalancha golpea una zona, aturde durante 0,35 segundos y obtiene un escudo del 18% de su vida.","shape":"area","radius":1,"center":"target","stun":0.35,"selfShield":0.18},
      {"type":"rock","power":2.2,"text":"Roca Afilada golpea una zona de 2 casillas ignorando el 40% de defensa y obtiene un escudo del 20% de su vida.","shape":"area","radius":2,"center":"target","pierce":0.4,"selfShield":0.2}
    ],
    "258":[
      {"type":"water","power":2,"text":"Pistola Agua golpea y escuda al aliado más herido con el 12% de su vida.","friendShield":0.12,"friends":1},
      {"type":"water","power":1.8,"text":"Agua Lodosa golpea alrededor del usuario, ralentiza un 20% durante 2 segundos y obtiene un escudo del 15% de su vida.","shape":"area","radius":2,"center":"self","slow":0.2,"selfShield":0.15},
      {"type":"ground","power":2.4,"text":"Terremoto golpea alrededor de Swampert, reduce un 25% la cadencia rival durante 2 segundos y escuda a los 2 aliados más heridos con el 15% de su vida.","shape":"area","radius":2,"center":"self","slow":0.25,"friendShield":0.15,"friends":2}
    ],
    "384":[
      {"type":"dragon","power":2.5,"text":"Pulso Dragón atraviesa 5 casillas y protege a los 2 aliados más heridos con un escudo del 8% de su vida.","shape":"line","length":5,"friendShield":0.08,"friends":2},
      {"type":"dragon","power":2.4,"text":"Cometa Draco golpea una zona de 2 casillas y escuda a todos los aliados con el 8% de su vida.","shape":"area","radius":2,"center":"target","friendShield":0.08,"friends":6},
      {"type":"dragon","power":2.6,"text":"Cometa Draco golpea una zona de 2 casillas, aturde durante 0,5 segundos y escuda a todos los aliados con el 10% de su vida.","shape":"area","radius":2,"center":"target","stun":0.5,"friendShield":0.1,"friends":6}
    ],
    "27":[
      {"type":"normal","power":2.3,"text":"Arañazo golpea ignorando el 25% de defensa.","pierce":0.25},
      {"type":"ground","power":1.7,"text":"Terratemblor golpea alrededor del usuario y ralentiza un 20% durante 2 segundos.","shape":"area","radius":1,"center":"self","slow":0.2},
      {"type":"ground","power":2.4,"text":"Terremoto daña en un radio de 2 casillas y obtiene un escudo del 12% de su vida.","shape":"area","radius":2,"center":"self","selfShield":0.12}
    ],
    "13":[
      {"type":"poison","power":2,"text":"Picotazo Veneno golpea ignorando el 35% de defensa.","pierce":0.35},
      {"type":"normal","power":0,"text":"Fortaleza concede un escudo del 30% de su vida y recupera 15 de maná.","selfShield":0.3,"selfMana":15},
      {"type":"bug","power":1.9,"text":"Tijera X golpea una zona ignorando el 35% de defensa.","shape":"area","radius":1,"center":"target","pierce":0.35}
    ],
    "179":[
      {"type":"electric","power":1.9,"text":"Impactrueno golpea y reduce un 20% la cadencia durante 2 segundos.","slow":0.2},
      {"type":"electric","power":1.7,"text":"Chispazo daña en un radio de 3 casillas y reduce un 20% la cadencia durante 2 segundos.","shape":"area","radius":3,"center":"self","slow":0.2},
      {"type":"electric","power":2.6,"text":"Trueno golpea una zona y aturde durante 0,5 segundos.","shape":"area","radius":1,"center":"target","stun":0.5}
    ],
    "74":[
      {"type":"rock","power":2,"text":"Lanzarrocas golpea y obtiene un escudo del 12% de su vida.","selfShield":0.12},
      {"type":"ground","power":1.7,"text":"Terratemblor golpea alrededor del usuario y ralentiza un 20% durante 2 segundos.","shape":"area","radius":1,"center":"self","slow":0.2},
      {"type":"ground","power":2.4,"text":"Terremoto golpea en un radio de 2 casillas y obtiene un escudo del 18% de su vida.","shape":"area","radius":2,"center":"self","selfShield":0.18}
    ],
    "270":[
      {"type":"grass","power":1.6,"text":"Absorbe vida del objetivo y cura al aliado más herido por el 80% del daño efectivo.","drain":0.8,"friends":1},
      {"type":"grass","power":0,"text":"Síntesis cura a los 2 aliados más heridos por el 220% del ataque.","healing":2.2,"friends":2},
      {"type":"grass","power":1.6,"text":"Gigadrenado absorbe vida de una zona y reparte el 60% del daño efectivo como curación entre los 2 aliados más heridos.","shape":"area","radius":1,"center":"target","drain":0.6,"friends":2}
    ],
    "363":[
      {"type":"ice","power":1.6,"text":"Nieve Polvo daña una zona y ralentiza un 20% durante 2 segundos.","shape":"area","radius":1,"center":"target","slow":0.2},
      {"type":"ice","power":2.2,"text":"Rayo Hielo daña y aturde al objetivo durante 0,5 segundos.","stun":0.5},
      {"type":"ice","power":2.1,"text":"Ventisca golpea una zona de 2 casillas, ralentiza un 25% durante 2 segundos y obtiene un escudo del 15% de su vida.","shape":"area","radius":2,"center":"target","slow":0.25,"selfShield":0.15}
    ],
    "440":[
      {"type":"fairy","power":1.2,"text":"Encanto daña, reduce un 25% la cadencia del objetivo durante 2 segundos y cura al aliado más herido por el 160% del ataque.","slow":0.25,"healing":1.6,"friends":1},
      {"type":"normal","power":0,"text":"Pulso Cura restaura al aliado más herido por el 350% del ataque y lo escuda con el 10% de su vida.","healing":3.5,"friendShield":0.1,"friends":1},
      {"type":"normal","power":0,"text":"Amortiguador cura a los 2 aliados más heridos por el 250% del ataque y elimina sus quemaduras, ralentizaciones y aturdimientos.","healing":2.5,"cleanse":true,"friends":2}
    ],
    "95":[
      {"type":"rock","power":1.8,"text":"Tumba Rocas daña una zona, ralentiza un 20% durante 2 segundos y obtiene un escudo del 15% de su vida.","shape":"area","radius":1,"center":"target","slow":0.2,"selfShield":0.15},
      {"type":"ground","power":2.4,"text":"Terremoto golpea alrededor del usuario y obtiene un escudo del 20% de su vida.","shape":"area","radius":2,"center":"self","selfShield":0.2},
      {"type":"ground","power":2.6,"text":"Fuerza Telúrica golpea alrededor del usuario y escuda a los 2 aliados más heridos con el 15% de su vida.","shape":"area","radius":2,"center":"self","friendShield":0.15,"friends":2}
    ],
    "371":[
      {"type":"dark","power":2,"text":"Mordisco daña y aturde al objetivo durante 0,3 segundos.","stun":0.3},
      {"type":"dragon","power":2.2,"text":"Dragoaliento atraviesa 4 casillas y aumenta un 10% su cadencia durante 2 segundos.","shape":"line","length":4,"boost":0.1},
      {"type":"dragon","power":2.4,"text":"Cometa Draco daña una zona de 2 casillas y aumenta un 20% su cadencia durante 2 segundos.","shape":"area","radius":2,"center":"target","boost":0.2}
    ],
    "957":[
      {"type":"fighting","power":2.2,"text":"Golpe Roca ignora el 40% de defensa.","pierce":0.4},
      {"type":"steel","power":2.8,"text":"Martillazo destruye la mitad del escudo antes de golpear.","breakShield":0.5},
      {"type":"steel","power":2.7,"text":"Martillo Colosal golpea una zona ignorando el 50% de defensa, aturde durante 0,5 segundos y obtiene un escudo del 12% de su vida.","shape":"area","radius":1,"center":"target","pierce":0.5,"stun":0.5,"selfShield":0.12}
    ]
  };
  const AREA_MOVES={
    'Terremoto':{type:'ground',radius:2,power:2.4,center:'self'},
    'Terratemblor':{type:'ground',radius:1,power:1.7,center:'self',slow:.2},
    'Fuerza Telúrica':{type:'ground',radius:2,power:2.6,center:'self'},
    'Agua Lodosa':{type:'water',radius:2,power:1.8,center:'self'},
    'Nieve Polvo':{type:'ice',radius:1,power:1.6,center:'target',slow:.2},
    'Ventisca':{type:'ice',radius:2,power:2.1,center:'target',slow:.25},
    'Chispazo':{type:'electric',radius:3,power:1.7,center:'self'},
    'Trueno':{type:'electric',radius:1,power:2.6,center:'target'},
    'Avalancha':{type:'rock',radius:1,power:2,center:'target',stun:.35},
    'Roca Afilada':{type:'rock',radius:1,power:2.2,center:'target'},
    'Tumba Rocas':{type:'rock',radius:1,power:1.8,center:'target',slow:.2},
    'Tijera X':{type:'bug',radius:1,power:1.9,center:'target'},
    'Cometa Draco':{type:'dragon',radius:2,power:2.4,center:'target'},
    'Martillo Colosal':{type:'steel',radius:1,power:2.7,center:'target'}
  };
  function abilityFor(u) {
    const family=BY[u.dex].line[0],signature=SIGNATURES[family],i=u.star-1,move=FAMILY_MOVES[family]?.[i];
    if(move)return {name:moveFor(u),type:move.type,description:move.text,signature:true,special:SPECIAL_FAMILIES.has(family),area:move.shape==='area'};
    if(signature)return {name:moveFor(u),type:signature.types[i],description:signature.text[i],signature:true,special:true};
    const area=AREA_MOVES[moveFor(u)];
    if(area)return {name:moveFor(u),type:area.type,description:`Golpea a los enemigos en un área de ${area.radius} casillas alrededor ${area.center==='self'?'del usuario':'del objetivo'}.${area.slow?' Ralentiza sus ataques durante 2 segundos.':''}${area.stun?' Aturde brevemente.':''}`,area:true};
    if(moveFor(u)==='Fortaleza')return {name:'Fortaleza',type:'normal',description:'Obtiene un escudo del 30% de su vida máxima.'};
    const ai=aiFor(u.dex),role=BY[u.dex].role;
    const description=ai==='healer'?'Cura al aliado con menos vida proporcional.':ai==='guardian'?'Escuda al aliado más vulnerable y golpea al enemigo.':
      role==='tank'?'Obtiene un escudo y daña a los enemigos cercanos.':role==='mage'?'Daña al objetivo y a los enemigos junto a él.':'Da un golpe potente a un enemigo.';
    return {name:moveFor(u),type:G.DEX_BY[u.dex].types[0],description};
  }
  function preview(s,u) {const rival=u.id<0;return fighter(u,rival?1:0,traits(rival?s.opponent:s.units.filter(v=>v.pos!==null)),rival?s.round:1);}
  function start(s) {
    if(!planning(s)||!s.units.some(u=>u.pos!==null))return false;
    if(s.opponentRound!==s.round)prepareEnemy(s);
    const team=s.units.filter(u=>u.pos!==null),foes=scout(s);
    s.battle={time:0,acc:0,opening:1.8,beat:0,beatCount:0,beatStarted:0,nextBeat:.05,events:[],units:[...team.map(u=>fighter(u,0,traits(team),s.round)),
      ...foes.map(u=>fighter(u,1,traits(foes),s.round))]};
    entrances(s.battle);s.phase='combat';s.result=null;return true;
  }
  const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
  function hit(b,a,t,power,spell=false,type=a.types[0]) {
    if(t.hp<=0)return 0;
    const mult=G.Types?.mult?G.Types.mult(type,t.types):1;
    const damage=Math.max(1,Math.round(power*mult*100/(100+t.armor*(1-Math.min(.8,a.pierce)))));
    const absorbed=Math.min(t.shield,damage),lost=Math.min(t.hp,damage-absorbed);t.shield-=absorbed;t.hp=Math.max(0,t.hp-lost);a.damageDone+=lost;t.damageTaken+=lost;t.blocked+=absorbed;if(t.hp===0&&lost>0)a.kills++;
    t.flash=.16;t.mana=Math.min(100,t.mana+8);
    if(a.slow)t.slowUntil=b.time+2,t.slowPower=a.slow;
    b.events.push({kind:spell?'spell':'hit',from:a.id,to:t.id,sx:a.x,sy:a.y,tx:t.x,ty:t.y,type,amount:lost,absorbed,beat:b.beat,ttl:.45});
    return lost;
  }
  function heal(b,a,t,amount) {
    const added=Math.max(0,Math.min(t.maxHp-t.hp,Math.round(amount)));t.hp+=added;a.healingDone+=added;
    if(added)b.events.push({kind:'heal',from:a.id,to:t.id,sx:a.x,sy:a.y,tx:t.x,ty:t.y,amount:added,ttl:.6});return added;
  }
  function shield(b,a,t,amount) {
    const added=Math.max(0,Math.min(t.maxHp*.5-t.shield,Math.round(amount)));t.shield+=added;a.shieldingDone+=added;
    if(added)b.events.push({kind:'shield',from:a.id,to:t.id,sx:a.x,sy:a.y,tx:t.x,ty:t.y,amount:Math.round(added),ttl:.6});
  }
  function push(b,a,t,steps) {
    const dx=t.x-a.x,dy=t.y-a.y;
    const vx=Math.abs(dx)>Math.abs(dy)?Math.sign(dx):0,vy=vx?0:Math.sign(dy)||1;
    for(let i=0;i<steps;i++){
      const x=t.x+vx,y=t.y+vy;
      if(x<0||x>=COLS||y<0||y>=ROWS||b.units.some(u=>u!==t&&u.hp>0&&u.x===x&&u.y===y))break;
      t.x=x;t.y=y;t.moveCD=Math.max(t.moveCD,.25);
    }
  }
  function burn(b,a,t,duration,power) {
    if(t.hp<=0)return;
    if(!t.burn||power>=t.burn.power)t.burn={source:a.id,power,remaining:duration,cd:1};
    else t.burn.remaining=Math.max(t.burn.remaining,duration);
  }
  function signature(b,a,target) {
    const family=BY[a.dex].line[0],rank=a.star,foes=()=>b.units.filter(u=>u.side!==a.side&&u.hp>0);
    const allies=()=>b.units.filter(u=>u.side===a.side&&u.hp>0).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp||x.id-y.id);
    if(family===4) {
      const dx=target.x-a.x,dy=target.y-a.y,len=Math.hypot(dx,dy)||1;
      const victims=rank===1?[target]:foes().filter(t=>{
        const vx=t.x-a.x,vy=t.y-a.y,d=Math.hypot(vx,vy)||1;
        return d<= (rank===3?4:3)&&(vx*dx+vy*dy)/(len*d)>=.65;
      });
      for(const t of victims){hit(b,a,t,a.attack*(rank===3?2.5:rank===2?2:1.9),true,'fire');burn(b,a,t,rank===3?4:3,a.attack*(rank===3?.25:.18));}
    } else if(family===7) {
      if(rank<3) {
        const victims=rank===1?[target]:foes().filter(t=>distance(target,t)<=1);
        victims.sort((x,y)=>distance(a,y)-distance(a,x));
        for(const t of victims){hit(b,a,t,a.attack*(rank===1?2.2:1.9),true,'water');if(t.hp>0)push(b,a,t,1);}
      } else {
        const dx=target.x-a.x,dy=target.y-a.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;
        const victims=foes().filter(t=>{
          const x=t.x-a.x,y=t.y-a.y,d=x*ux+y*uy;
          return d>=0&&d<=4&&Math.abs(x*uy-y*ux)<=.65;
        }).sort((x,y)=>distance(a,y)-distance(a,x));
        b.events.push({kind:'beam',from:a.id,sx:a.x,sy:a.y,tx:Math.max(0,Math.min(5,a.x+ux*4)),ty:Math.max(0,Math.min(5,a.y+uy*4)),type:'water',ttl:.6});
        for(const t of victims){hit(b,a,t,a.attack*2.5,true,'water');if(t.hp>0)push(b,a,t,2);}
      }
    } else if(family===529) {
      if(rank===1)hit(b,a,target,a.attack*2.8,true,'steel');
      else {
        const sx=a.x,sy=a.y,dx=target.x-sx,dy=target.y-sy,vx=Math.abs(dx)>Math.abs(dy)?Math.sign(dx):0,vy=vx?0:Math.sign(dy)||1;
        let landing={x:sx,y:sy},end={...landing};
        for(let i=1;i<=3;i++) {
          const x=sx+vx*i,y=sy+vy*i;
          if(x<0||x>=COLS||y<0||y>=ROWS||b.units.some(u=>u!==a&&u.side===a.side&&u.hp>0&&u.x===x&&u.y===y))break;
          end={x,y};for(const t of foes().filter(t=>t.x===x&&t.y===y))hit(b,a,t,a.attack*2.6,true,'ground');
          if(!b.units.some(u=>u!==a&&u.hp>0&&u.x===x&&u.y===y))landing={x,y};
        }
        a.x=landing.x;a.y=landing.y;a.moveCD=.35;
        b.events.push({kind:'drill',from:a.id,sx,sy,tx:end.x,ty:end.y,type:'ground',ttl:.6});
        if(rank===3){b.events.push({kind:'area',from:a.id,x:a.x,y:a.y,radius:2,type:'ground',ttl:.6});for(const t of foes().filter(t=>distance(a,t)<=2))hit(b,a,t,a.attack*1.5,true,'ground');}
      }
    } else if(family===92) {
      const weak=target.hp/target.maxHp<.4;
      const amount=hit(b,a,target,a.attack*(rank===1?2.2:2.7)*(weak?(rank===3?1.8:rank===2?1.5:1):1),true,'ghost');
      if(rank===1){target.slowUntil=b.time+2;target.slowPower=.25;}
      if(rank===3)heal(b,a,a,amount*.25);
    } else if(family===280) {
      const friends=allies();
      if(rank===1){heal(b,a,friends[0],a.attack*1.8);hit(b,a,target,a.attack*1.1,true,'psychic');}
      else if(rank===2){const ally=friends[0];heal(b,a,ally,a.attack*3.2);ally.burn=null;ally.slowUntil=0;ally.stunUntil=0;}
      else for(const ally of friends.slice(0,2)){heal(b,a,ally,a.attack*3.5);shield(b,a,ally,a.maxHp*.15);}
    } else if(family===374) {
      if(rank===1){hit(b,a,target,a.attack*2,true,'normal');if(target.hp>0)push(b,a,target,1);shield(b,a,a,a.maxHp*.12);}
      else if(rank===2){shield(b,a,allies()[0],a.maxHp*.25);hit(b,a,target,a.attack*1.8,true,'steel');}
      else {
        const center={x:target.x,y:target.y};
        for(const t of foes().filter(t=>distance(center,t)<=1)){hit(b,a,t,a.attack*(t===target?3:1.5),true,'steel');t.stunUntil=b.time+1;}
        shield(b,a,a,a.maxHp*.25);
      }
    } else if(family===1) {
      let total=0;
      if(rank<3){total=hit(b,a,target,a.attack*(rank===1?1.8:2.3),true,'grass');if(rank===2){target.slowUntil=b.time+3;target.slowPower=.25;}}
      else {
        const dx=target.x-a.x,dy=target.y-a.y,len=Math.hypot(dx,dy)||1;
        for(const t of foes()){const x=t.x-a.x,y=t.y-a.y,d=(x*dx+y*dy)/len;if(d>=0&&d<=5&&Math.abs(x*dy-y*dx)/len<=.7)total+=hit(b,a,t,a.attack*2.8,true,'grass');}
        b.events.push({kind:'beam',from:a.id,sx:a.x,sy:a.y,tx:Math.max(0,Math.min(5,a.x+dx/len*5)),ty:Math.max(0,Math.min(5,a.y+dy/len*5)),type:'grass',ttl:.6});
      }
      heal(b,a,a,total*(rank===1?.5:rank===2?.6:.3));
    } else if(family===172) {
      let t=target;const seen=new Set();
      for(let i=0;i<(rank===1?1:rank===2?3:4)&&t;i++) {
        seen.add(t.id);hit(b,a,t,a.attack*(rank===1?2:2.2)*(.8**i),true,'electric');
        if(rank!==2)t.stunUntil=b.time+(rank===1?.3:.6);
        const previous=t;t=foes().filter(u=>!seen.has(u.id)&&distance(previous,u)<=3).sort((x,y)=>distance(previous,x)-distance(previous,y)||x.id-y.id)[0];
      }
    } else if(family===66) {
      if(rank>=2)target.shield=0;
      const old=a.pierce;if(rank===1)a.pierce=Math.max(a.pierce,.5);
      hit(b,a,target,a.attack*(rank===3?4:rank===2?3:2.7),true,'fighting');a.pierce=old;
      if(rank===3){if(!a.exposedUntil||a.exposedUntil<=b.time)a.armor-=10;a.exposedUntil=b.time+2;}
    } else if(family===152) {
      if(rank===1){const lost=hit(b,a,target,a.attack*1.6,true,'grass');heal(b,a,allies()[0],lost);}
      else for(const ally of allies().slice(0,rank===2?2:6)){heal(b,a,ally,a.attack*(rank===2?2:1.6));if(rank===3){ally.burn=null;ally.slowUntil=0;ally.stunUntil=0;}}
    } else if(family===255) {
      if(rank===2){hit(b,a,target,a.attack*1.5,true,'fighting');hit(b,a,target,a.attack*1.5,true,'fighting');}
      else {hit(b,a,target,a.attack*(rank===1?2:3.2),true,'fire');burn(b,a,target,3,a.attack*.2);}
      if(rank>=2){if(a.boostUntil>b.time)a.interval*=1+a.boostPower;a.boostPower=rank===2?.1:.2;a.interval/=1+a.boostPower;a.boostUntil=b.time+2;}
    } else if(family===63) {
      if(rank===1){hit(b,a,target,a.attack*2,true,'psychic');target.slowUntil=b.time+2;target.slowPower=.25;}
      else if(rank===2){
        const dx=target.x-a.x,dy=target.y-a.y,len=Math.hypot(dx,dy)||1;
        for(const t of foes()){const x=t.x-a.x,y=t.y-a.y,d=(x*dx+y*dy)/len;if(d>=0&&d<=4&&Math.abs(x*dy-y*dx)/len<=.7)hit(b,a,t,a.attack*2.4,true,'psychic');}
        b.events.push({kind:'beam',from:a.id,sx:a.x,sy:a.y,tx:Math.max(0,Math.min(5,a.x+dx/len*4)),ty:Math.max(0,Math.min(5,a.y+dy/len*4)),type:'psychic',ttl:.6});
      } else {b.events.push({kind:'area',from:a.id,x:target.x,y:target.y,radius:1,type:'psychic',ttl:.6});for(const t of foes().filter(t=>distance(target,t)<=1)){hit(b,a,t,a.attack*2.6,true,'psychic');t.stunUntil=b.time+.8;}}
    } else return false;
    return true;
  }
  function areaCast(b,a,target) {
    const area=AREA_MOVES[moveFor(a)];if(!area)return false;
    const center=area.center==='self'?a:target;
    b.events.push({kind:'area',from:a.id,x:center.x,y:center.y,radius:area.radius,type:area.type,ttl:.6});
    for(const t of b.units.filter(u=>u.side!==a.side&&u.hp>0&&distance(center,u)<=area.radius)){
      hit(b,a,t,a.attack*area.power,true,area.type);
      if(area.slow){t.slowUntil=b.time+2;t.slowPower=Math.max(t.slowPower||0,area.slow);}
      if(area.stun)t.stunUntil=b.time+area.stun;
    }
    return true;
  }
  function familyCast(b,a,target) {
    const m=FAMILY_MOVES[BY[a.dex].line[0]]?.[a.star-1];if(!m)return false;
    const foes=b.units.filter(u=>u.side!==a.side&&u.hp>0);
    const friends=b.units.filter(u=>u.side===a.side&&u.hp>0).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp||x.id-y.id).slice(0,m.friends||1);
    let victims=[target];
    if(m.shape==='area') {
      const center=m.center==='self'?a:{x:target.x,y:target.y};
      victims=foes.filter(t=>distance(center,t)<=m.radius);
      b.events.push({kind:'area',from:a.id,x:center.x,y:center.y,radius:m.radius,type:m.type,ttl:.6});
    } else if(m.shape==='line') {
      const dx=target.x-a.x,dy=target.y-a.y,len=Math.hypot(dx,dy)||1;
      victims=foes.filter(t=>{const x=t.x-a.x,y=t.y-a.y,d=(x*dx+y*dy)/len;return d>=0&&d<=m.length&&Math.abs(x*dy-y*dx)/len<=.7;});
      b.events.push({kind:'beam',from:a.id,sx:a.x,sy:a.y,tx:Math.max(0,Math.min(5,a.x+dx/len*m.length)),ty:Math.max(0,Math.min(5,a.y+dy/len*m.length)),type:m.type,ttl:.6});
    }
    // Resolve furthest first so knockbacks cannot accidentally move another victim
    // into/out of the snapshotted area. Temporary pierce never changes basic attacks.
    victims.sort((x,y)=>distance(a,y)-distance(a,x)||x.id-y.id);
    let total=0;const oldPierce=a.pierce;a.pierce=Math.max(a.pierce,m.pierce||0);
    for(const t of victims) {
      if(!m.power)continue;
      if(m.breakShield)t.shield*=1-m.breakShield;
      total+=hit(b,a,t,a.attack*m.power*(1+(m.execute||0)*(1-t.hp/t.maxHp)),true,m.type);
      if(t.hp<=0)continue;
      if(m.slow){t.slowPower=Math.max(t.slowUntil>b.time?t.slowPower||0:0,m.slow);t.slowUntil=b.time+2;}
      if(m.stun)t.stunUntil=Math.max(t.stunUntil||0,b.time+m.stun);
      if(m.burn)burn(b,a,t,3,a.attack*m.burn);
      if(m.push)push(b,a,t,m.push);
    }
    a.pierce=oldPierce;
    if(m.selfShield)shield(b,a,a,a.maxHp*m.selfShield);
    if(m.selfMana)a.mana=Math.min(100,a.mana+m.selfMana);
    for(const ally of friends){
      if(m.healing)heal(b,a,ally,a.attack*m.healing);
      if(m.drain)heal(b,a,ally,total*m.drain/friends.length);
      if(m.friendShield)shield(b,a,ally,ally.maxHp*m.friendShield);
      if(m.allyMana)ally.mana=Math.min(100,ally.mana+m.allyMana);
      if(m.cleanse){ally.burn=null;ally.slowUntil=0;ally.stunUntil=0;}
    }
    if(m.boost){if(a.boostUntil>b.time)a.interval*=1+a.boostPower;a.boostPower=m.boost;a.interval/=1+a.boostPower;a.boostUntil=b.time+2;}
    return true;
  }
  function cast(b,a,target) {
    a.mana=0;b.events.push({kind:'cast',from:a.id,move:moveFor(a),beat:b.beat,ttl:.8});
    if(signature(b,a,target)||familyCast(b,a,target)||areaCast(b,a,target))return;
    if(moveFor(a)==='Fortaleza'){shield(b,a,a,a.maxHp*.3);return;}
    if(a.ai==='guardian') {
      const ally=b.units.filter(u=>u.side===a.side&&u.hp>0).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp||x.id-y.id)[0];
      shield(b,a,ally,a.maxHp*.25);hit(b,a,target,a.attack*1.5,true);
    } else if(a.ai==='healer') {
      const ally=b.units.filter(u=>u.side===a.side&&u.hp>0).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp)[0];heal(b,a,ally,a.attack*3.2);
    } else if(a.role==='tank') {
      shield(b,a,a,a.maxHp*.25);
      for(const t of b.units.filter(u=>u.side!==a.side&&u.hp>0&&distance(a,u)<=2))hit(b,a,t,a.attack*1.5,true);
    } else if(a.role==='mage') {
      for(const t of b.units.filter(u=>u.side!==a.side&&u.hp>0&&distance(target,u)<=1))hit(b,a,t,a.attack*2,true);
    } else hit(b,a,target,a.attack*3.5,true);
  }
  function finish(s,winner) {
    const b=s.battle,won=winner===0;
    if(won) {s.wins++;s.streak=Math.max(0,s.streak)+1;} else {
      s.streak=Math.min(0,s.streak)-1;
      s.life=Math.max(0,s.life-4-Math.floor(s.round/2)-b.units.filter(u=>u.side===1&&u.hp>0).length);
    }
    const interest=Math.min(5,Math.floor(s.gold/5)),bonus=Math.min(3,Math.floor(Math.abs(s.streak)/2));
    const income=5+interest+bonus+(won?1:0);s.gold+=income;gainXP(s,2);
    const report=b.units.map(u=>({id:u.id,dex:u.dex,star:u.star,side:u.side,damage:u.damageDone,healing:u.healingDone,shielding:u.shieldingDone,taken:u.damageTaken,blocked:u.blocked,kills:u.kills}));
    s.result={won,draw:winner===-1,income,interest,bonus,round:s.round,report};
    s.history.push({round:s.round,won,report});
    s.phase=s.life<=0?'defeat':s.round>=LAST_ROUND?'victory':'result';
  }
  function moveToward(b,a,target) {
    if(a.moveCD>0||retreat(b,a)||distance(a,target)<=a.range)return;
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
  function pulse(b) {
    b.beatCount=(b.beatCount||0)+1;b.beat=(b.beatCount-1)%4+1;b.beatStarted=b.time;
    // Both teams share one clock. Alternate cell/attack initiative each bar.
    const order=Math.floor((b.beatCount-1)/4)%2?[...b.units].reverse():b.units;
    if(b.beat===1||b.beat===3) {
      for(const a of order){if(a.hp<=0||a.stunUntil>b.time)continue;const target=selectTarget(b,a);if(target)moveToward(b,a,target);}
      return;
    }
    // Choose attacks from the same pulse's initial formation, then resolve in order.
    const attacks=order.filter(a=>a.hp>0&&!(a.stunUntil>b.time)&&a.cooldown<=0)
      .map(a=>({a,target:selectTarget(b,a)})).filter(p=>p.target&&distance(p.a,p.target)<=p.a.range);
    for(const {a,target:chosen} of attacks) {
      if(a.hp<=0)continue;
      const target=chosen.hp>0?chosen:selectTarget(b,a);if(!target||distance(a,target)>a.range)continue;
      // One basic strike per attack beat; speed changes strike power/mana instead
      // of creating off-beat attacks. Slow affects those same values temporarily.
      const rate=(2*BEAT_SECONDS)/a.interval*(a.slowUntil>b.time?1-a.slowPower:1);
      hit(b,a,target,a.attack*rate);a.mana=Math.min(100,a.mana+(25+a.manaGain)*rate);
      a.cooldown=.25;
      if(a.mana>=100) {
        const alive=target.hp>0?target:selectTarget(b,a);
        if(alive&&distance(a,alive)<=a.range)cast(b,a,alive);
      }
    }
  }
  function step(s,dt) {
    const b=s.battle;b.time+=dt;b.events=b.events.filter(e=>(e.ttl-=dt)>0);
    for(const a of b.units) {
      a.flash=Math.max(0,a.flash-dt);if(a.hp<=0)continue;
      const regen=Math.max(0,Math.min(a.maxHp-a.hp,a.maxHp*a.regen*dt));a.hp+=regen;a.healingDone+=regen;
      if(a.burn) {
        const dot=a.burn;dot.remaining-=dt;dot.cd-=dt;
        if(dot.cd<=.00001){const source=b.units.find(u=>u.id===dot.source);if(source)hit(b,source,a,dot.power,true,'fire');dot.cd+=1;}
        if(dot.remaining<=.00001)a.burn=null;
      }
      if(a.exposedUntil&&a.exposedUntil<=b.time){a.armor+=10;a.exposedUntil=0;}
      if(a.boostUntil&&a.boostUntil<=b.time){a.interval*=1+a.boostPower;a.boostUntil=0;}
      a.cooldown-=dt;a.moveCD-=dt;
    }
    b.nextBeat??=.05;
    if(b.time+.00001>=b.nextBeat){pulse(b);b.nextBeat+=BEAT_SECONDS;}
    const alive=[0,1].map(side=>b.units.some(u=>u.side===side&&u.hp>0));
    if(!alive[0]||!alive[1])finish(s,alive[0]?0:alive[1]?1:-1);
    else if(b.time>=45)finish(s,-1);
  }
  function report(s,scope='ally') {
    if(scope!=='match')return (s.result?.report||[]).filter(u=>u.side===(scope==='enemy'?1:0)).map(u=>({...u})).sort((a,b)=>b.damage-a.damage);
    const rows=new Map();
    for(const round of s.history)for(const u of round.report.filter(u=>u.side===0)){
      const family=BY[u.dex].line[0];let row=rows.get(family);
      if(!row){row={id:family,dex:u.dex,star:u.star,side:0,damage:0,healing:0,shielding:0,taken:0,blocked:0,kills:0};rows.set(family,row);}
      if(u.star>=row.star){row.dex=u.dex;row.star=u.star;}
      for(const field of ['damage','healing','shielding','taken','blocked','kills'])row[field]+=u[field];
    }
    return [...rows.values()].sort((a,b)=>b.damage-a.damage);
  }
  function tick(s,dt) {
    if(!Number.isFinite(dt)||dt<=0)return;
    s.effects=s.effects.filter(e=>(e.ttl-=Math.min(dt,.25))>0);
    if(s.phase!=='combat'){if(s.battle)s.battle.events=s.battle.events.filter(e=>(e.ttl-=Math.min(dt,.25))>0);return;}
    if(s.battle.opening>0){s.battle.opening=Math.max(0,s.battle.opening-Math.min(dt,.25));return;}
    s.battle.acc+=Math.min(dt,.25);
    while(s.battle.acc>=.05&&s.phase==='combat'){s.battle.acc-=.05;step(s,.05);}
  }
  function next(s) {
    if(s.phase!=='result')return false;
    s.round++;s.phase='planning';s.battle=null;prepareEnemy(s);
    if(!s.locked)reroll(s,true);return true;
  }
  const SAVE_VERSION=1;
  function serialize(s) {return JSON.stringify({version:SAVE_VERSION,state:s});}
  function restore(raw) {
    try {
      if(typeof raw!=='string'||raw.length>300000)return null;
      const data=JSON.parse(raw),s=data.state;
      const int=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
      const unit=u=>u&&int(u.id,-6,100000)&&u.id!==0&&BY[u.dex]&&int(u.star,1,3)&&evolvedDex(u.dex,u.star)===u.dex&&
        (u.pos===null||int(u.pos,0,35));
      const numbers=o=>Object.values(o).every(v=>typeof v!=='number'||Number.isFinite(v)&&Math.abs(v)<1e12);
      if(data.version!==SAVE_VERSION||!s||!numbers(s)||!validDeck(s.deck)||!int(s.round,1,LAST_ROUND)||!int(s.level,3,6)||
        !int(s.seed,0,4294967295)||!int(s.nextId,1,100001)||!int(s.life,0,50)||!int(s.gold,0,1000000)||!int(s.xp,0,20)||
        s.opponentRound!==s.round||!int(s.wins,0,12)||!int(s.streak,-12,12)||typeof s.locked!=='boolean'||
        !['planning','combat','result','victory','defeat'].includes(s.phase))return null;
      if(!Array.isArray(s.units)||s.units.length>14||!s.units.every(u=>unit(u)&&u.id>0&&u.id<s.nextId&&s.deck.includes(BY[u.dex].line[0])&&(u.pos===null||u.pos>=18))||
        new Set(s.units.map(u=>u.id)).size!==s.units.length||new Set(s.units.filter(u=>u.pos!==null).map(u=>u.pos)).size!==s.units.filter(u=>u.pos!==null).length||
        s.units.filter(u=>u.pos===null).length>BENCH||s.units.filter(u=>u.pos!==null).length>s.level)return null;
      if(!Array.isArray(s.shop)||s.shop.length>5||!s.shop.every(d=>d===null||s.deck.includes(d)))return null;
      if(!Array.isArray(s.opponent)||!s.opponent.length||s.opponent.length>6||!s.opponent.every(u=>unit(u)&&u.id<0&&u.pos<18))return null;
      const report=rows=>Array.isArray(rows)&&rows.length<=12&&rows.every(u=>BY[u.dex]&&int(u.star,1,3)&&[0,1].includes(u.side)&&['damage','healing','shielding','taken','blocked','kills'].every(k=>Number.isFinite(u[k])&&u[k]>=0&&u[k]<1e10));
      if(!Array.isArray(s.history)||s.history.length>12||!s.history.every(h=>int(h.round,1,12)&&report(h.report)))return null;
      if(s.result&&(!int(s.result.round,1,12)||!report(s.result.report)||!numbers(s.result)))return null;
      if(['result','victory','defeat'].includes(s.phase)&&!s.result)return null;
      if(s.battle) {
        const b=s.battle;
        if(!numbers(b)||!Number.isFinite(b.time)||b.time<0||b.time>46||!Number.isFinite(b.acc)||b.acc<0||b.acc>.3||
          !Number.isFinite(b.nextBeat)||b.nextBeat<0||!int(b.beat,0,4)||!int(b.beatCount,0,100)||!Array.isArray(b.units)||b.units.length>12||!b.units.length)return null;
        if(!b.units.every(u=>unit(u)&&[0,1].includes(u.side)&&int(u.x,0,5)&&int(u.y,0,5)&&numbers(u)&&
          ['hp','maxHp','attack','armor','interval','range','mana','shield','manaGain','regen','pierce','slow','cooldown','moveCD','flash','damageDone','damageTaken','blocked','kills','healingDone','shieldingDone'].every(k=>Number.isFinite(u[k]))&&
          u.hp>=0&&u.hp<=u.maxHp&&u.maxHp>0&&u.interval>0&&u.shield>=0&&u.mana>=0&&u.mana<=100&&
          Array.isArray(u.types)&&u.types.every(t=>Object.hasOwn(EFFECTS,t))&&['tank','healer','mage','fighter'].includes(u.role)&&
          ['tank','healer','guardian','ranged','diver','fighter'].includes(u.ai)&&(!u.burn||numbers(u.burn)&&['source','power','remaining','cd'].every(k=>Number.isFinite(u.burn[k])))))return null;
        if(new Set(b.units.map(u=>u.id)).size!==b.units.length)return null;
        const live=b.units.filter(u=>u.hp>0);if(new Set(live.map(u=>u.y*6+u.x)).size!==live.length)return null;
        // Transient particles are expendable; never trust persisted display strings.
        b.events=[];for(const u of b.units)delete u.entrance;
      } else if(s.phase==='combat')return null;
      s.effects=[];return s;
    } catch(_){return null;}
  }
  return {serialize,restore,SAVE_VERSION,scout,entranceFor,COLS,ROWS,BENCH,LAST_ROUND,BEAT_SECONDS,ROSTER,BY,DEFAULT_DECK,validDeck,evolvedDex,moveFor,abilityFor,preview,cast,report,AREA_MOVES,aiFor,selectTarget,XP,ODDS,EFFECTS,create,buy,place,sell,buyXP,reroll,traits,start,tick,next};
})();
