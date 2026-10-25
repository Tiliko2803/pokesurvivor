/* PokéSurvivor TFT — independent economy and wave ranking. */
G.TFT = (() => {
  'use strict';
  const COLS = 6, ROWS = 6, BENCH = 8, MAX_WAVE = 1000000, HISTORY_LIMIT = 20, BEAT_SECONDS = .5;
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
  // TFT adaptations: species identity, rank moves and opening tactics in one place.
  const EXPANSION=[
    {line:[46,47],cost:2,role:'healer',moves:['Absorber','Espora','Gigadrenado'],entry:'Micelio Protector',passive:['regen',.015,'Regenera un 1,5% de vida por segundo.'],
      skills:[{type:'grass',power:1.6,selfDrain:.5,text:'Drena vida y recupera la mitad del daño.'},{type:'grass',power:1.8,stun:.5,text:'Esporas que dañan y aturden medio segundo.'},{type:'grass',power:2.4,drain:.7,friends:2,text:'Gigadrenado cura a los dos aliados más heridos con parte del daño causado.'}],
      openers:[1,2,3].map(n=>({type:'grass',power:.3*n,healing:.4*n,text:'Una nube inicial daña al enemigo y cura a un aliado herido.'}))},
    {line:[129, 130],cost:2,role:"fighter",moves:["Salpicadura", "Cascada", "Vendaval Acuático"],
      entry:"Mirada Intimidante",passive:["intimidate", 0.08, "Reduce un 8% el daño rival durante el combate. No se acumula con otras intimidaciones."],
      skills:[
        {"type":"normal","power":0,"text":"Golpea al enemigo seleccionado; obtiene un escudo del 20% de su vida; recupera 20 de maná.","selfShield":0.2,"selfMana":20},
        {"type":"water","power":2.5,"text":"Golpea al enemigo seleccionado; aturde 0,4 segundos.","stun":0.4},
        {"type":"water","power":2.4,"text":"Daña a los enemigos en un radio de 1 casillas alrededor del objetivo; empuja 1 casilla libre.","shape":"area","radius":1,"center":"target","push":1}
      ],
      openers:[
        {"type":"water","power":0.55,"text":"Golpea al enemigo seleccionado; empuja 1 casilla libre.","push":1},
        {"type":"water","power":0.7,"text":"Golpea al enemigo seleccionado; empuja 1 casilla libre.","push":1},
        {"type":"water","power":0.85,"text":"Golpea al enemigo seleccionado; empuja 1 casilla libre.","push":1}
      ]
    },
    {line:[147, 148, 149],cost:4,role:"fighter",moves:["Dragoaliento", "Cola Dragón", "Enfado"],
      entry:"Multiescamas",passive:["shield", 0.18, "Empieza con un escudo del 18% de su vida."],
      skills:[
        {"type":"dragon","power":2,"text":"Golpea al enemigo seleccionado; reduce la cadencia un 20% durante 2 segundos.","slow":0.2},
        {"type":"dragon","power":2.6,"text":"Golpea al enemigo seleccionado; empuja 1 casilla libre.","push":1},
        {"type":"dragon","power":2.5,"text":"Daña a los enemigos en un radio de 1 casillas alrededor del objetivo; aumenta su cadencia un 20% durante 2 segundos.","shape":"area","radius":1,"center":"target","boost":0.2}
      ],
      openers:[
        {"type":"dragon","power":0.55,"text":"Golpea al enemigo seleccionado; obtiene un escudo del 6% de su vida.","selfShield":0.06},
        {"type":"dragon","power":0.7,"text":"Golpea al enemigo seleccionado; obtiene un escudo del 6% de su vida.","selfShield":0.06},
        {"type":"dragon","power":0.85,"text":"Golpea al enemigo seleccionado; obtiene un escudo del 6% de su vida.","selfShield":0.06}
      ]
    },
    {line:[155, 156, 157],cost:2,role:"mage",moves:["Ascuas", "Rueda Fuego", "Estallido"],
      entry:"Fogonazo",passive:["attack", 0.08, "Aumenta su daño un 8%."],
      skills:[
        {"type":"fire","power":2,"text":"Golpea al enemigo seleccionado; quema durante 3 segundos con 15% del ataque por segundo.","burn":0.15},
        {"type":"fire","power":2,"text":"Daña a los enemigos en un radio de 1 casillas alrededor del objetivo; quema durante 3 segundos con 18% del ataque por segundo.","shape":"area","radius":1,"center":"target","burn":0.18},
        {"type":"fire","power":2.5,"text":"Daña a los enemigos en un radio de 2 casillas alrededor del objetivo; quema durante 3 segundos con 20% del ataque por segundo.","shape":"area","radius":2,"center":"target","burn":0.2}
      ],
      openers:[
        {"type":"fire","power":0.55,"text":"Daña a los enemigos en un radio de 1 casillas alrededor del objetivo; quema durante 3 segundos con 10% del ataque por segundo.","shape":"area","radius":1,"center":"target","burn":0.1},
        {"type":"fire","power":0.7,"text":"Daña a los enemigos en un radio de 1 casillas alrededor del objetivo; quema durante 3 segundos con 10% del ataque por segundo.","shape":"area","radius":1,"center":"target","burn":0.1},
        {"type":"fire","power":0.85,"text":"Daña a los enemigos en un radio de 1 casillas alrededor del objetivo; quema durante 3 segundos con 10% del ataque por segundo.","shape":"area","radius":1,"center":"target","burn":0.1}
      ]
    },
    {line:[158, 159, 160],cost:2,role:"fighter",moves:["Pistola Agua", "Colmillo Hielo", "Hidroariete"],
      entry:"Mandíbula Feroz",passive:["pierce", 0.1, "Ignora un 10% adicional de defensa."],
      skills:[
        {"type":"water","power":2.2,"text":"Golpea al enemigo seleccionado."},
        {"type":"ice","power":2.4,"text":"Golpea al enemigo seleccionado; reduce la cadencia un 25% durante 2 segundos.","slow":0.25},
        {"type":"water","power":3,"text":"Golpea al enemigo seleccionado; aturde 0,5 segundos.","stun":0.5}
      ],
      openers:[
        {"type":"water","power":0.55,"text":"Golpea al enemigo seleccionado; aumenta su cadencia un 15% durante 2 segundos.","boost":0.15},
        {"type":"water","power":0.7,"text":"Golpea al enemigo seleccionado; aumenta su cadencia un 15% durante 2 segundos.","boost":0.15},
        {"type":"water","power":0.85,"text":"Golpea al enemigo seleccionado; aumenta su cadencia un 15% durante 2 segundos.","boost":0.15}
      ]
    },
    {line:[252, 253, 254],cost:2,role:"fighter",moves:["Absorber", "Hoja Aguda", "Lluevehojas"],
      entry:"Agilidad Selvática",passive:["speed", 0.1, "Aumenta un 10% su cadencia."],
      skills:[
        {"type":"grass","power":1.7,"text":"Golpea al enemigo seleccionado. Cura al aliado con menos vida proporcional por el 70% del daño efectivo.","drain":0.7},
        {"type":"grass","power":2.5,"text":"Golpea al enemigo seleccionado; ignora el 35% de defensa.","pierce":0.35},
        {"type":"grass","power":2.3,"text":"Daña a los enemigos en un radio de 2 casillas alrededor del objetivo.","shape":"area","radius":2,"center":"target"}
      ],
      openers:[
        {"type":"grass","power":0.55,"text":"Golpea al enemigo seleccionado; aumenta su cadencia un 15% durante 2 segundos.","boost":0.15},
        {"type":"grass","power":0.7,"text":"Golpea al enemigo seleccionado; aumenta su cadencia un 15% durante 2 segundos.","boost":0.15},
        {"type":"grass","power":0.85,"text":"Golpea al enemigo seleccionado; aumenta su cadencia un 15% durante 2 segundos.","boost":0.15}
      ]
    },
    {line:[349, 350],cost:3,role:"healer",moves:["Chapoteo Protector", "Pulso Cura", "Agua Renovadora"],
      entry:"Escama Especial",passive:["armor", 15, "Obtiene 15 de defensa."],
      skills:[
        {"type":"water","power":0,"text":"Golpea al enemigo seleccionado; obtiene un escudo del 20% de su vida; cura a 1 aliados con menos vida proporcional por 200% de su ataque.","selfShield":0.2,"healing":2},
        {"type":"water","power":0,"text":"Golpea al enemigo seleccionado; cura a 2 aliados con menos vida proporcional por 280% de su ataque; elimina quemadura, ralentización y aturdimiento de esos aliados.","healing":2.8,"friends":2,"cleanse":true},
        {"type":"water","power":1.7,"text":"Daña a los enemigos en un radio de 1 casillas alrededor del objetivo; cura a 2 aliados con menos vida proporcional por 200% de su ataque; elimina quemadura, ralentización y aturdimiento de esos aliados.","shape":"area","radius":1,"center":"target","healing":2,"friends":2,"cleanse":true}
      ],
      openers:[
        {"type":"water","power":0,"text":"Golpea al enemigo seleccionado; protege a 2 aliados con un escudo del 6% de la vida de cada receptor.","friendShield":0.06,"friends":2},
        {"type":"water","power":0,"text":"Golpea al enemigo seleccionado; protege a 2 aliados con un escudo del 8% de la vida de cada receptor.","friendShield":0.08,"friends":2},
        {"type":"water","power":0,"text":"Golpea al enemigo seleccionado; protege a 2 aliados con un escudo del 10% de la vida de cada receptor.","friendShield":0.1,"friends":2}
      ]
    },
    {line:[387, 388, 389],cost:2,role:"tank",moves:["Absorber", "Bomba Germen", "Terremoto"],
      entry:"Raíces Firmes",passive:["regen", 0.008, "Regenera un 0,8% de vida por segundo."],
      skills:[
        {"type":"grass","power":1.6,"text":"Golpea al enemigo seleccionado; obtiene un escudo del 12% de su vida.","selfShield":0.12},
        {"type":"grass","power":2,"text":"Daña a los enemigos en un radio de 1 casillas alrededor del objetivo; obtiene un escudo del 15% de su vida.","shape":"area","radius":1,"center":"target","selfShield":0.15},
        {"type":"ground","power":2.3,"text":"Daña a los enemigos en un radio de 2 casillas alrededor del usuario; reduce la cadencia un 20% durante 2 segundos.","shape":"area","radius":2,"center":"self","slow":0.2}
      ],
      openers:[
        {"type":"grass","power":0,"text":"Golpea al enemigo seleccionado; protege a 2 aliados con un escudo del 5% de la vida de cada receptor.","friendShield":0.05,"friends":2},
        {"type":"grass","power":0,"text":"Golpea al enemigo seleccionado; protege a 2 aliados con un escudo del 7% de la vida de cada receptor.","friendShield":0.07,"friends":2},
        {"type":"grass","power":0,"text":"Golpea al enemigo seleccionado; protege a 2 aliados con un escudo del 9% de la vida de cada receptor.","friendShield":0.09,"friends":2}
      ]
    },
    {line:[390, 391, 392],cost:2,role:"fighter",moves:["Ascuas", "Ultrapuño", "A Bocajarro"],
      entry:"Puño de Hierro",passive:["attack", 0.08, "Aumenta su daño un 8%."],
      skills:[
        {"type":"fire","power":2,"text":"Golpea al enemigo seleccionado; quema durante 3 segundos con 15% del ataque por segundo.","burn":0.15},
        {"type":"fighting","power":2.5,"text":"Golpea al enemigo seleccionado; aumenta su cadencia un 15% durante 2 segundos.","boost":0.15},
        {"type":"fighting","power":3,"text":"Golpea al enemigo seleccionado; ignora el 50% de defensa; obtiene un escudo del 12% de su vida.","pierce":0.5,"selfShield":0.12}
      ],
      openers:[
        {"type":"fighting","power":0.55,"text":"Golpea al enemigo seleccionado; ignora el 30% de defensa.","pierce":0.3},
        {"type":"fighting","power":0.7,"text":"Golpea al enemigo seleccionado; ignora el 30% de defensa.","pierce":0.3},
        {"type":"fighting","power":0.85,"text":"Golpea al enemigo seleccionado; ignora el 30% de defensa.","pierce":0.3}
      ]
    },
    {line:[393, 394, 395],cost:2,role:"tank",moves:["Burbuja", "Pico Taladro", "Hidrobomba"],
      entry:"Orgullo Imperial",passive:["armor", 15, "Obtiene 15 de defensa."],
      skills:[
        {"type":"water","power":2,"text":"Golpea al enemigo seleccionado; empuja 1 casilla libre.","push":1},
        {"type":"flying","power":2.5,"text":"Golpea al enemigo seleccionado; ignora el 30% de defensa.","pierce":0.3},
        {"type":"water","power":2.6,"text":"Atraviesa 4 casillas y daña a los enemigos en la línea; protege a 2 aliados con un escudo del 10% de la vida de cada receptor.","shape":"line","length":4,"friendShield":0.1,"friends":2}
      ],
      openers:[
        {"type":"steel","power":0,"text":"Golpea al enemigo seleccionado; protege a 2 aliados con un escudo del 6% de la vida de cada receptor.","friendShield":0.06,"friends":2},
        {"type":"steel","power":0,"text":"Golpea al enemigo seleccionado; protege a 2 aliados con un escudo del 8% de la vida de cada receptor.","friendShield":0.08,"friends":2},
        {"type":"steel","power":0,"text":"Golpea al enemigo seleccionado; protege a 2 aliados con un escudo del 10% de la vida de cada receptor.","friendShield":0.1,"friends":2}
      ]
    },
    {line:[443, 444, 445],cost:4,role:"fighter",moves:["Bucle Arena", "Garra Dragón", "Terremoto"],
      entry:"Piel Tosca",passive:["armor", 12, "Obtiene 12 de defensa."],
      skills:[
        {"type":"ground","power":1.9,"text":"Golpea al enemigo seleccionado; reduce la cadencia un 20% durante 2 segundos.","slow":0.2},
        {"type":"dragon","power":2.7,"text":"Golpea al enemigo seleccionado; ignora el 30% de defensa.","pierce":0.3},
        {"type":"ground","power":2.5,"text":"Daña a los enemigos en un radio de 2 casillas alrededor del usuario; reduce la cadencia un 20% durante 2 segundos.","shape":"area","radius":2,"center":"self","slow":0.2}
      ],
      openers:[
        {"type":"ground","power":0.55,"text":"Daña a los enemigos en un radio de 1 casillas alrededor del objetivo; reduce la cadencia un 20% durante 2 segundos.","shape":"area","radius":1,"center":"target","slow":0.2},
        {"type":"ground","power":0.7,"text":"Daña a los enemigos en un radio de 1 casillas alrededor del objetivo; reduce la cadencia un 20% durante 2 segundos.","shape":"area","radius":1,"center":"target","slow":0.2},
        {"type":"ground","power":0.85,"text":"Daña a los enemigos en un radio de 1 casillas alrededor del objetivo; reduce la cadencia un 20% durante 2 segundos.","shape":"area","radius":1,"center":"target","slow":0.2}
      ]
    },
    {line:[495, 496, 497],cost:2,role:"mage",moves:["Látigo Cepa", "Gigadrenado", "Lluevehojas"],
      entry:"Espiral Respondona",passive:["mana", 20, "Empieza con 20 de maná adicional."],
      skills:[
        {"type":"grass","power":2,"text":"Golpea al enemigo seleccionado; reduce la cadencia un 20% durante 2 segundos.","slow":0.2},
        {"type":"grass","power":2,"text":"Golpea al enemigo seleccionado. Cura al aliado con menos vida proporcional por el 80% del daño efectivo.","drain":0.8},
        {"type":"grass","power":2.3,"text":"Daña a los enemigos en un radio de 1 casillas alrededor del objetivo; aumenta su cadencia un 20% durante 2 segundos.","shape":"area","radius":1,"center":"target","boost":0.2}
      ],
      openers:[
        {"type":"grass","power":0.55,"text":"Golpea al enemigo seleccionado; reduce la cadencia un 20% durante 2 segundos.","slow":0.2},
        {"type":"grass","power":0.7,"text":"Golpea al enemigo seleccionado; reduce la cadencia un 20% durante 2 segundos.","slow":0.2},
        {"type":"grass","power":0.85,"text":"Golpea al enemigo seleccionado; reduce la cadencia un 20% durante 2 segundos.","slow":0.2}
      ]
    },
    {line:[501, 502, 503],cost:2,role:"fighter",moves:["Pistola Agua", "Concha Filo", "Hidroariete"],
      entry:"Armadura de Concha",passive:["shield", 0.15, "Empieza con un escudo del 15% de su vida."],
      skills:[
        {"type":"water","power":2.2,"text":"Golpea al enemigo seleccionado."},
        {"type":"water","power":2.5,"text":"Golpea al enemigo seleccionado; ignora el 35% de defensa.","pierce":0.35},
        {"type":"water","power":2.9,"text":"Golpea al enemigo seleccionado; empuja 1 casilla libre; obtiene un escudo del 15% de su vida.","push":1,"selfShield":0.15}
      ],
      openers:[
        {"type":"water","power":0.55,"text":"Golpea al enemigo seleccionado; ignora el 25% de defensa.","pierce":0.25},
        {"type":"water","power":0.7,"text":"Golpea al enemigo seleccionado; ignora el 25% de defensa.","pierce":0.25},
        {"type":"water","power":0.85,"text":"Golpea al enemigo seleccionado; ignora el 25% de defensa.","pierce":0.25}
      ]
    },
    {line:[633, 634, 635],cost:4,role:"mage",moves:["Mordisco", "Pulso Umbrío", "Cometa Draco"],
      entry:"Presión Tricéfala",passive:["pierce", 0.1, "Ignora un 10% adicional de defensa."],
      skills:[
        {"type":"dark","power":2.1,"text":"Golpea al enemigo seleccionado; aturde 0,3 segundos.","stun":0.3},
        {"type":"dark","power":2.1,"text":"Daña a los enemigos en un radio de 1 casillas alrededor del objetivo; reduce la cadencia un 20% durante 2 segundos.","shape":"area","radius":1,"center":"target","slow":0.2},
        {"type":"dragon","power":2.5,"text":"Daña a los enemigos en un radio de 2 casillas alrededor del objetivo.","shape":"area","radius":2,"center":"target"}
      ],
      openers:[
        {"type":"dark","power":0.55,"text":"Daña a los enemigos en un radio de 1 casillas alrededor del objetivo; reduce la cadencia un 20% durante 2 segundos.","shape":"area","radius":1,"center":"target","slow":0.2},
        {"type":"dark","power":0.7,"text":"Daña a los enemigos en un radio de 1 casillas alrededor del objetivo; reduce la cadencia un 20% durante 2 segundos.","shape":"area","radius":1,"center":"target","slow":0.2},
        {"type":"dark","power":0.85,"text":"Daña a los enemigos en un radio de 1 casillas alrededor del objetivo; reduce la cadencia un 20% durante 2 segundos.","shape":"area","radius":1,"center":"target","slow":0.2}
      ]
    },
    {line:[656, 657, 658],cost:3,role:"mage",moves:["Burbuja", "Hidropulso", "Shuriken de Agua"],
      entry:"Reflejos Ninja",passive:["speed", 0.1, "Aumenta un 10% su cadencia."],
      skills:[
        {"type":"water","power":2,"text":"Golpea al enemigo seleccionado; empuja 1 casilla libre.","push":1},
        {"type":"water","power":2,"text":"Daña a los enemigos en un radio de 1 casillas alrededor del objetivo; reduce la cadencia un 20% durante 2 segundos.","shape":"area","radius":1,"center":"target","slow":0.2},
        {"type":"water","power":2.7,"text":"Atraviesa 4 casillas y daña a los enemigos en la línea; ignora el 25% de defensa.","shape":"line","length":4,"pierce":0.25}
      ],
      openers:[
        {"type":"water","power":0.55,"text":"Atraviesa 3 casillas y daña a los enemigos en la línea.","shape":"line","length":3},
        {"type":"water","power":0.7,"text":"Atraviesa 3 casillas y daña a los enemigos en la línea.","shape":"line","length":3},
        {"type":"water","power":0.85,"text":"Atraviesa 3 casillas y daña a los enemigos en la línea.","shape":"line","length":3}
      ]
    },
    {line:[704, 705, 706],cost:4,role:"tank",moves:["Absorber", "Agua Lodosa", "Pulso Dragón"],
      entry:"Baba Protectora",passive:["regen", 0.008, "Regenera un 0,8% de vida por segundo."],
      skills:[
        {"type":"grass","power":1.6,"text":"Golpea al enemigo seleccionado. Cura al aliado con menos vida proporcional por el 80% del daño efectivo.","drain":0.8},
        {"type":"water","power":1.9,"text":"Daña a los enemigos en un radio de 1 casillas alrededor del objetivo; reduce la cadencia un 25% durante 2 segundos.","shape":"area","radius":1,"center":"target","slow":0.25},
        {"type":"dragon","power":2.2,"text":"Daña a los enemigos en un radio de 1 casillas alrededor del objetivo; obtiene un escudo del 20% de su vida.","shape":"area","radius":1,"center":"target","selfShield":0.2}
      ],
      openers:[
        {"type":"water","power":0.55,"text":"Golpea al enemigo seleccionado; reduce la cadencia un 25% durante 2 segundos.","slow":0.25},
        {"type":"water","power":0.7,"text":"Golpea al enemigo seleccionado; reduce la cadencia un 25% durante 2 segundos.","slow":0.25},
        {"type":"water","power":0.85,"text":"Golpea al enemigo seleccionado; reduce la cadencia un 25% durante 2 segundos.","slow":0.25}
      ]
    },
    {line:[722, 723, 724],cost:3,role:"mage",moves:["Follaje", "Hoja Afilada", "Puntada Sombría"],
      entry:"Acecho Silencioso",passive:["pierce", 0.1, "Ignora un 10% adicional de defensa."],
      skills:[
        {"type":"grass","power":2.1,"text":"Golpea al enemigo seleccionado."},
        {"type":"grass","power":2.3,"text":"Atraviesa 4 casillas y daña a los enemigos en la línea.","shape":"line","length":4},
        {"type":"ghost","power":2.8,"text":"Golpea al enemigo seleccionado; aturde 0,6 segundos.","stun":0.6}
      ],
      openers:[
        {"type":"ghost","power":0.55,"text":"Golpea al enemigo seleccionado; aturde 0,25 segundos.","stun":0.25},
        {"type":"ghost","power":0.7,"text":"Golpea al enemigo seleccionado; aturde 0,25 segundos.","stun":0.25},
        {"type":"ghost","power":0.85,"text":"Golpea al enemigo seleccionado; aturde 0,25 segundos.","stun":0.25}
      ]
    },
    {line:[725, 726, 727],cost:3,role:"tank",moves:["Ascuas", "Colmillo Ígneo", "Lariat Oscuro"],
      entry:"Rugido Intimidante",passive:["intimidate", 0.08, "Reduce un 8% el daño rival durante el combate. No se acumula con otras intimidaciones."],
      skills:[
        {"type":"fire","power":2,"text":"Golpea al enemigo seleccionado; quema durante 3 segundos con 15% del ataque por segundo.","burn":0.15},
        {"type":"fire","power":2.4,"text":"Golpea al enemigo seleccionado; quema durante 3 segundos con 20% del ataque por segundo.","burn":0.2},
        {"type":"dark","power":2.4,"text":"Daña a los enemigos en un radio de 1 casillas alrededor del usuario; ignora el 40% de defensa.","shape":"area","radius":1,"center":"self","pierce":0.4}
      ],
      openers:[
        {"type":"dark","power":0.55,"text":"Golpea al enemigo seleccionado; reduce la cadencia un 20% durante 2 segundos.","slow":0.2},
        {"type":"dark","power":0.7,"text":"Golpea al enemigo seleccionado; reduce la cadencia un 20% durante 2 segundos.","slow":0.2},
        {"type":"dark","power":0.85,"text":"Golpea al enemigo seleccionado; reduce la cadencia un 20% durante 2 segundos.","slow":0.2}
      ]
    },
    {line:[782, 783, 784],cost:4,role:"fighter",moves:["Placaje", "Garra Dragón", "Fragor Escamas"],
      entry:"Armadura Sonora",passive:["armor", 15, "Obtiene 15 de defensa."],
      skills:[
        {"type":"normal","power":2.2,"text":"Golpea al enemigo seleccionado; obtiene un escudo del 10% de su vida.","selfShield":0.1},
        {"type":"dragon","power":2.5,"text":"Golpea al enemigo seleccionado; ignora el 30% de defensa.","pierce":0.3},
        {"type":"dragon","power":2.2,"text":"Daña a los enemigos en un radio de 2 casillas alrededor del usuario; obtiene un escudo del 18% de su vida.","shape":"area","radius":2,"center":"self","selfShield":0.18}
      ],
      openers:[
        {"type":"dragon","power":0,"text":"Golpea al enemigo seleccionado; obtiene un escudo del 10% de su vida; protege a 2 aliados con un escudo del 5% de la vida de cada receptor.","selfShield":0.1,"friendShield":0.05,"friends":2},
        {"type":"dragon","power":0,"text":"Golpea al enemigo seleccionado; obtiene un escudo del 14% de su vida; protege a 2 aliados con un escudo del 7% de la vida de cada receptor.","selfShield":0.14,"friendShield":0.07,"friends":2},
        {"type":"dragon","power":0,"text":"Golpea al enemigo seleccionado; obtiene un escudo del 18% de su vida; protege a 2 aliados con un escudo del 9% de la vida de cada receptor.","selfShield":0.18,"friendShield":0.09,"friends":2}
      ]
    },
    {line:[885, 886, 887],cost:4,role:"mage",moves:["Impresionar", "Bola Sombra", "Dracoflechas"],
      entry:"Infiltración",passive:["pierce", 0.15, "Ignora un 15% adicional de defensa."],
      skills:[
        {"type":"ghost","power":2,"text":"Golpea al enemigo seleccionado; aturde 0,3 segundos.","stun":0.3},
        {"type":"ghost","power":2.5,"text":"Golpea al enemigo seleccionado; ignora el 40% de defensa.","pierce":0.4},
        {"type":"dragon","power":2.6,"text":"Atraviesa 4 casillas y daña a los enemigos en la línea; ignora el 40% de defensa.","shape":"line","length":4,"pierce":0.4}
      ],
      openers:[
        {"type":"ghost","power":0.55,"text":"Atraviesa 3 casillas y daña a los enemigos en la línea; ignora el 30% de defensa.","shape":"line","length":3,"pierce":0.3},
        {"type":"ghost","power":0.7,"text":"Atraviesa 3 casillas y daña a los enemigos en la línea; ignora el 30% de defensa.","shape":"line","length":3,"pierce":0.3},
        {"type":"ghost","power":0.85,"text":"Atraviesa 3 casillas y daña a los enemigos en la línea; ignora el 30% de defensa.","shape":"line","length":3,"pierce":0.3}
      ]
    },
    {line:[996, 997, 998],cost:4,role:"fighter",moves:["Colmillo Hielo", "Chuzos", "Asalto Espadón"],
      entry:"Coraza Térmica",passive:["shield", 0.15, "Empieza con un escudo del 15% de su vida."],
      skills:[
        {"type":"ice","power":2,"text":"Golpea al enemigo seleccionado; reduce la cadencia un 20% durante 2 segundos.","slow":0.2},
        {"type":"ice","power":2.1,"text":"Daña a los enemigos en un radio de 1 casillas alrededor del objetivo; aturde 0,4 segundos.","shape":"area","radius":1,"center":"target","stun":0.4},
        {"type":"dragon","power":3.2,"text":"Golpea al enemigo seleccionado; ignora el 40% de defensa; obtiene un escudo del 12% de su vida.","pierce":0.4,"selfShield":0.12}
      ],
      openers:[
        {"type":"ice","power":0.55,"text":"Daña a los enemigos en un radio de 1 casillas alrededor del objetivo; reduce la cadencia un 20% durante 2 segundos.","shape":"area","radius":1,"center":"target","slow":0.2},
        {"type":"ice","power":0.7,"text":"Daña a los enemigos en un radio de 1 casillas alrededor del objetivo; reduce la cadencia un 20% durante 2 segundos.","shape":"area","radius":1,"center":"target","slow":0.2},
        {"type":"ice","power":0.85,"text":"Daña a los enemigos en un radio de 1 casillas alrededor del objetivo; reduce la cadencia un 20% durante 2 segundos.","shape":"area","radius":1,"center":"target","slow":0.2}
      ]
    },
  ];
  // Second roster wave: ten cheap families and all remaining regional starters.
  EXPANSION.push(
    {line:[32, 33, 34],cost:1,role:"fighter",moves:["Picotazo Veneno", "Cola Veneno", "Tierra Viva"],
      entry:"Punto Tóxico",passive:["pierce", 0.08, "Ignora un 8% adicional de defensa."],
      skills:[
        {"type":"poison","power":1.9,"text":"Golpea al enemigo seleccionado; reduce la cadencia enemiga un 15% durante 2 s.","slow":0.15},
        {"type":"poison","power":2.3,"text":"Golpea al enemigo seleccionado; ignora el 25% de defensa.","pierce":0.25},
        {"type":"ground","power":2.2,"text":"Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; reduce la cadencia enemiga un 20% durante 2 s.","shape":"area","radius":1,"center":"target","slow":0.2}
      ],
      openers:[
        {"type":"poison","power":0.4,"text":"Golpea al enemigo seleccionado; reduce la cadencia enemiga un 15% durante 2 s.","slow":0.15},
        {"type":"poison","power":0.55,"text":"Golpea al enemigo seleccionado; reduce la cadencia enemiga un 15% durante 2 s.","slow":0.15},
        {"type":"poison","power":0.7,"text":"Golpea al enemigo seleccionado; reduce la cadencia enemiga un 15% durante 2 s.","slow":0.15}
      ]
    },
    {line:[173, 35, 36],cost:1,role:"healer",moves:["Encanto", "Beso Drenaje", "Luz Lunar"],
      entry:"Velo Lunar",passive:["teamShield", 0.03, "Escuda a cada aliado con el 3% de la vida de ese aliado."],
      skills:[
        {"type":"fairy","power":1.2,"text":"Golpea al enemigo seleccionado; cura a 1 aliados con menos vida proporcional por el 120% del ataque.","healing":1.2},
        {"type":"fairy","power":1.6,"text":"Golpea al enemigo seleccionado; cura a 2 aliados por el 80% del daño efectivo, repartido entre ellos.","drain":0.8,"friends":2},
        {"type":"fairy","power":0,"text":"Cura a 2 aliados con menos vida proporcional por el 220% del ataque; elimina quemadura, ralentización y aturdimiento de esos aliados.","healing":2.2,"friends":2,"cleanse":true}
      ],
      openers:[
        {"type":"fairy","power":0,"text":"Escuda a 2 aliados con menos vida proporcional con el 4% de la vida de cada receptor.","friendShield":0.04,"friends":2},
        {"type":"fairy","power":0,"text":"Escuda a 2 aliados con menos vida proporcional con el 6% de la vida de cada receptor.","friendShield":0.06,"friends":2},
        {"type":"fairy","power":0,"text":"Escuda a 2 aliados con menos vida proporcional con el 8% de la vida de cada receptor.","friendShield":0.08,"friends":2}
      ]
    },
    {line:[58, 59],cost:1,role:"fighter",moves:["Ascuas", "Colmillo Ígneo", "Envite Ígneo"],
      entry:"Ladrido Intimidante",passive:["intimidate", 0.08, "Reduce un 8% el daño rival durante el combate. No se acumula con otras intimidaciones."],
      skills:[
        {"type":"fire","power":1.8,"text":"Golpea al enemigo seleccionado; quema durante 3 s con 12% del ataque por segundo.","burn":0.12},
        {"type":"fire","power":2.2,"text":"Golpea al enemigo seleccionado; quema durante 3 s con 15% del ataque por segundo.","burn":0.15},
        {"type":"fire","power":2.8,"text":"Golpea al enemigo seleccionado; obtiene un escudo del 10% de su vida.","selfShield":0.1}
      ],
      openers:[
        {"type":"fire","power":0.4,"text":"Golpea al enemigo seleccionado; quema durante 3 s con 8% del ataque por segundo.","burn":0.08},
        {"type":"fire","power":0.55,"text":"Golpea al enemigo seleccionado; quema durante 3 s con 8% del ataque por segundo.","burn":0.08},
        {"type":"fire","power":0.7,"text":"Golpea al enemigo seleccionado; quema durante 3 s con 8% del ataque por segundo.","burn":0.08}
      ]
    },
    {line:[60, 61, 62],cost:1,role:"tank",moves:["Burbuja", "Hipnosis", "Puño Dinámico"],
      entry:"Absorción Acuática",passive:["regen", 0.006, "Regenera un 0,6% de vida por segundo."],
      skills:[
        {"type":"water","power":1.8,"text":"Golpea al enemigo seleccionado; empuja 1 casilla libre.","push":1},
        {"type":"psychic","power":1.2,"text":"Golpea al enemigo seleccionado; aturde 0,6 s.","stun":0.6},
        {"type":"fighting","power":2.5,"text":"Golpea al enemigo seleccionado; aturde 0,5 s.","stun":0.5}
      ],
      openers:[
        {"type":"water","power":0.4,"text":"Golpea al enemigo seleccionado; reduce la cadencia enemiga un 15% durante 2 s.","slow":0.15},
        {"type":"water","power":0.55,"text":"Golpea al enemigo seleccionado; reduce la cadencia enemiga un 15% durante 2 s.","slow":0.15},
        {"type":"water","power":0.7,"text":"Golpea al enemigo seleccionado; reduce la cadencia enemiga un 15% durante 2 s.","slow":0.15}
      ]
    },
    {line:[298, 183, 184],cost:1,role:"fighter",moves:["Burbuja", "Carantoña", "Acua Cola"],
      entry:"Potencia",passive:["attack", 0.12, "Aumenta su daño un 12%."],
      skills:[
        {"type":"water","power":1.9,"text":"Golpea al enemigo seleccionado."},
        {"type":"fairy","power":2.3,"text":"Golpea al enemigo seleccionado; reduce la cadencia enemiga un 20% durante 2 s.","slow":0.2},
        {"type":"water","power":2.2,"text":"Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; obtiene un escudo del 10% de su vida.","shape":"area","radius":1,"center":"target","selfShield":0.1}
      ],
      openers:[
        {"type":"fairy","power":0.4,"text":"Golpea al enemigo seleccionado; obtiene un escudo del 4% de su vida.","selfShield":0.04},
        {"type":"fairy","power":0.55,"text":"Golpea al enemigo seleccionado; obtiene un escudo del 4% de su vida.","selfShield":0.04},
        {"type":"fairy","power":0.7,"text":"Golpea al enemigo seleccionado; obtiene un escudo del 4% de su vida.","selfShield":0.04}
      ]
    },
    {line:[285, 286],cost:1,role:"fighter",moves:["Absorber", "Ultrapuño", "Puño Drenaje"],
      entry:"Esporas de Entrada",passive:["regen", 0.006, "Regenera un 0,6% de vida por segundo."],
      skills:[
        {"type":"grass","power":1.5,"text":"Golpea al enemigo seleccionado; cura a 1 aliados por el 70% del daño efectivo, repartido entre ellos.","drain":0.7},
        {"type":"fighting","power":2.2,"text":"Golpea al enemigo seleccionado; aumenta su cadencia un 10% durante 2 s.","boost":0.1},
        {"type":"fighting","power":2.4,"text":"Golpea al enemigo seleccionado; cura a 1 aliados por el 80% del daño efectivo, repartido entre ellos.","drain":0.8}
      ],
      openers:[
        {"type":"grass","power":0.3,"text":"Golpea al enemigo seleccionado; aturde 0,25 s.","stun":0.25},
        {"type":"grass","power":0.4,"text":"Golpea al enemigo seleccionado; aturde 0,35 s.","stun":0.35},
        {"type":"grass","power":0.5,"text":"Golpea al enemigo seleccionado; aturde 0,45 s.","stun":0.45}
      ]
    },
    {line:[498, 499, 500],cost:1,role:"tank",moves:["Ascuas", "Nitrocarga", "Envite Ígneo"],
      entry:"Sebo Protector",passive:["armor", 10, "Obtiene 10 de defensa."],
      skills:[
        {"type":"fire","power":1.8,"text":"Golpea al enemigo seleccionado; quema durante 3 s con 12% del ataque por segundo.","burn":0.12},
        {"type":"fire","power":2,"text":"Golpea al enemigo seleccionado; aumenta su cadencia un 15% durante 2 s.","boost":0.15},
        {"type":"fire","power":2.2,"text":"Daña a los enemigos en un radio de 1 casilla alrededor del usuario; obtiene un escudo del 15% de su vida.","shape":"area","radius":1,"center":"self","selfShield":0.15}
      ],
      openers:[
        {"type":"fire","power":0,"text":"Obtiene un escudo del 8% de su vida.","selfShield":0.08},
        {"type":"fire","power":0,"text":"Obtiene un escudo del 10% de su vida.","selfShield":0.1},
        {"type":"fire","power":0,"text":"Obtiene un escudo del 12% de su vida.","selfShield":0.12}
      ]
    },
    {line:[650, 651, 652],cost:1,role:"tank",moves:["Látigo Cepa", "Bomba Germen", "Barrera Espinosa"],
      entry:"Guardia Antibalas",passive:["shield", 0.12, "Empieza con un escudo del 12% de su vida."],
      skills:[
        {"type":"grass","power":1.9,"text":"Golpea al enemigo seleccionado; obtiene un escudo del 8% de su vida.","selfShield":0.08},
        {"type":"grass","power":2,"text":"Daña a los enemigos en un radio de 1 casilla alrededor del objetivo.","shape":"area","radius":1,"center":"target"},
        {"type":"grass","power":1.5,"text":"Daña a los enemigos en un radio de 1 casilla alrededor del usuario; escuda a 2 aliados con menos vida proporcional con el 12% de la vida de cada receptor.","shape":"area","radius":1,"center":"self","friendShield":0.12,"friends":2}
      ],
      openers:[
        {"type":"grass","power":0,"text":"Escuda a 2 aliados con menos vida proporcional con el 4% de la vida de cada receptor.","friendShield":0.04,"friends":2},
        {"type":"grass","power":0,"text":"Escuda a 2 aliados con menos vida proporcional con el 6% de la vida de cada receptor.","friendShield":0.06,"friends":2},
        {"type":"grass","power":0,"text":"Escuda a 2 aliados con menos vida proporcional con el 8% de la vida de cada receptor.","friendShield":0.08,"friends":2}
      ]
    },
    {line:[810, 811, 812],cost:1,role:"healer",moves:["Follaje", "Doble Golpe", "Batería Asalto"],
      entry:"Hierba Creadora",passive:["regen", 0.006, "Regenera un 0,6% de vida por segundo."],
      skills:[
        {"type":"grass","power":1.5,"text":"Golpea al enemigo seleccionado; cura a 1 aliados con menos vida proporcional por el 100% del ataque.","healing":1},
        {"type":"normal","power":2.1,"text":"Golpea al enemigo seleccionado; da 8 de maná a 2 aliados con menos vida proporcional.","allyMana":8,"friends":2},
        {"type":"grass","power":2,"text":"Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; reduce la cadencia enemiga un 25% durante 2 s; cura a 2 aliados con menos vida proporcional por el 150% del ataque.","shape":"area","radius":1,"center":"target","slow":0.25,"healing":1.5,"friends":2}
      ],
      openers:[
        {"type":"grass","power":0,"text":"Escuda a 2 aliados con menos vida proporcional con el 4% de la vida de cada receptor.","friendShield":0.04,"friends":2},
        {"type":"grass","power":0,"text":"Escuda a 2 aliados con menos vida proporcional con el 6% de la vida de cada receptor.","friendShield":0.06,"friends":2},
        {"type":"grass","power":0,"text":"Escuda a 2 aliados con menos vida proporcional con el 8% de la vida de cada receptor.","friendShield":0.08,"friends":2}
      ]
    },
    {line:[821, 822, 823],cost:1,role:"tank",moves:["Picotazo", "Ataque Ala", "Plancha Corporal"],
      entry:"Plumas de Acero",passive:["armor", 10, "Obtiene 10 de defensa."],
      skills:[
        {"type":"flying","power":1.9,"text":"Golpea al enemigo seleccionado."},
        {"type":"flying","power":2.1,"text":"Golpea al enemigo seleccionado; empuja 1 casilla libre.","push":1},
        {"type":"fighting","power":2.4,"text":"Golpea al enemigo seleccionado; obtiene un escudo del 18% de su vida.","selfShield":0.18}
      ],
      openers:[
        {"type":"steel","power":0,"text":"Obtiene un escudo del 6% de su vida; escuda a 1 aliados con menos vida proporcional con el 3% de la vida de cada receptor.","selfShield":0.06,"friendShield":0.03,"friends":1},
        {"type":"steel","power":0,"text":"Obtiene un escudo del 8% de su vida; escuda a 1 aliados con menos vida proporcional con el 3% de la vida de cada receptor.","selfShield":0.08,"friendShield":0.03,"friends":1},
        {"type":"steel","power":0,"text":"Obtiene un escudo del 10% de su vida; escuda a 1 aliados con menos vida proporcional con el 3% de la vida de cada receptor.","selfShield":0.1,"friendShield":0.03,"friends":1}
      ]
    },
    {line:[653, 654, 655],cost:2,role:"mage",moves:["Ascuas", "Psicorrayo", "Llama Embrujada"],
      entry:"Reserva Mágica",passive:["mana", 20, "Empieza con 20 de maná adicional."],
      skills:[
        {"type":"fire","power":1.9,"text":"Golpea al enemigo seleccionado; quema durante 3 s con 15% del ataque por segundo.","burn":0.15},
        {"type":"psychic","power":2.2,"text":"Atraviesa 3 casillas y daña a los enemigos de la línea.","shape":"line","length":3},
        {"type":"fire","power":2.2,"text":"Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; reduce la cadencia enemiga un 20% durante 2 s; quema durante 3 s con 18% del ataque por segundo.","shape":"area","radius":1,"center":"target","burn":0.18,"slow":0.2}
      ],
      openers:[
        {"type":"psychic","power":0.4,"text":"Golpea al enemigo seleccionado; reduce la cadencia enemiga un 20% durante 2 s.","slow":0.2},
        {"type":"psychic","power":0.55,"text":"Golpea al enemigo seleccionado; reduce la cadencia enemiga un 20% durante 2 s.","slow":0.2},
        {"type":"psychic","power":0.7,"text":"Golpea al enemigo seleccionado; reduce la cadencia enemiga un 20% durante 2 s.","slow":0.2}
      ]
    },
    {line:[728, 729, 730],cost:2,role:"healer",moves:["Burbuja", "Voz Cautivadora", "Aria Burbuja"],
      entry:"Voz Fluida",passive:["mana", 15, "Empieza con 15 de maná adicional."],
      skills:[
        {"type":"water","power":1.6,"text":"Golpea al enemigo seleccionado; cura a 1 aliados con menos vida proporcional por el 130% del ataque.","healing":1.3},
        {"type":"fairy","power":1.6,"text":"Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; cura a 2 aliados con menos vida proporcional por el 140% del ataque.","shape":"area","radius":1,"center":"target","healing":1.4,"friends":2},
        {"type":"water","power":1.8,"text":"Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; cura a 2 aliados con menos vida proporcional por el 200% del ataque; elimina quemadura, ralentización y aturdimiento de esos aliados.","shape":"area","radius":1,"center":"target","healing":2,"friends":2,"cleanse":true}
      ],
      openers:[
        {"type":"water","power":0,"text":"Escuda a 2 aliados con menos vida proporcional con el 4% de la vida de cada receptor.","friendShield":0.04,"friends":2},
        {"type":"water","power":0,"text":"Escuda a 2 aliados con menos vida proporcional con el 6% de la vida de cada receptor.","friendShield":0.06,"friends":2},
        {"type":"water","power":0,"text":"Escuda a 2 aliados con menos vida proporcional con el 8% de la vida de cada receptor.","friendShield":0.08,"friends":2}
      ]
    },
    {line:[813, 814, 815],cost:2,role:"fighter",moves:["Ascuas", "Nitrocarga", "Balón Ígneo"],
      entry:"Cambio de Ritmo",passive:["speed", 0.1, "Aumenta un 10% su cadencia."],
      skills:[
        {"type":"fire","power":2,"text":"Golpea al enemigo seleccionado; quema durante 3 s con 12% del ataque por segundo.","burn":0.12},
        {"type":"fire","power":2.3,"text":"Golpea al enemigo seleccionado; aumenta su cadencia un 15% durante 2 s.","boost":0.15},
        {"type":"fire","power":2.4,"text":"Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; quema durante 3 s con 18% del ataque por segundo.","shape":"area","radius":1,"center":"target","burn":0.18}
      ],
      openers:[
        {"type":"fire","power":0.4,"text":"Golpea al enemigo seleccionado; aumenta su cadencia un 12% durante 2 s.","boost":0.12},
        {"type":"fire","power":0.55,"text":"Golpea al enemigo seleccionado; aumenta su cadencia un 12% durante 2 s.","boost":0.12},
        {"type":"fire","power":0.7,"text":"Golpea al enemigo seleccionado; aumenta su cadencia un 12% durante 2 s.","boost":0.12}
      ]
    },
    {line:[816, 817, 818],cost:2,role:"mage",moves:["Pistola Agua", "Hidropulso", "Disparo Certero"],
      entry:"Francotirador",passive:["pierce", 0.12, "Ignora un 12% adicional de defensa."],
      skills:[
        {"type":"water","power":2,"text":"Golpea al enemigo seleccionado."},
        {"type":"water","power":1.9,"text":"Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; reduce la cadencia enemiga un 20% durante 2 s.","shape":"area","radius":1,"center":"target","slow":0.2},
        {"type":"water","power":2.9,"text":"Golpea al enemigo seleccionado; ignora el 50% de defensa; aumenta el daño hasta un 30% según la vida perdida del enemigo.","pierce":0.5,"execute":0.3}
      ],
      openers:[
        {"type":"water","power":0.4,"text":"Golpea al enemigo seleccionado; ignora el 25% de defensa.","pierce":0.25},
        {"type":"water","power":0.55,"text":"Golpea al enemigo seleccionado; ignora el 25% de defensa.","pierce":0.25},
        {"type":"water","power":0.7,"text":"Golpea al enemigo seleccionado; ignora el 25% de defensa.","pierce":0.25}
      ]
    },
    {line:[906, 907, 908],cost:2,role:"fighter",moves:["Follaje", "Hoja Afilada", "Truco Floral"],
      entry:"Truco de Entrada",passive:["speed", 0.08, "Aumenta un 8% su cadencia."],
      skills:[
        {"type":"grass","power":2,"text":"Golpea al enemigo seleccionado."},
        {"type":"grass","power":2.2,"text":"Atraviesa 3 casillas y daña a los enemigos de la línea.","shape":"line","length":3},
        {"type":"grass","power":2.7,"text":"Golpea al enemigo seleccionado; ignora el 50% de defensa; aumenta el daño hasta un 25% según la vida perdida del enemigo.","pierce":0.5,"execute":0.25}
      ],
      openers:[
        {"type":"grass","power":0.4,"text":"Golpea al enemigo seleccionado; ignora el 20% de defensa.","pierce":0.2},
        {"type":"grass","power":0.55,"text":"Golpea al enemigo seleccionado; ignora el 20% de defensa.","pierce":0.2},
        {"type":"grass","power":0.7,"text":"Golpea al enemigo seleccionado; ignora el 20% de defensa.","pierce":0.2}
      ]
    },
    {line:[909, 910, 911],cost:2,role:"tank",moves:["Ascuas", "Calcinación", "Canto Ardiente"],
      entry:"Fuego Imperturbable",passive:["pierce", 0.1, "Ignora un 10% adicional de defensa."],
      skills:[
        {"type":"fire","power":1.9,"text":"Golpea al enemigo seleccionado; quema durante 3 s con 12% del ataque por segundo.","burn":0.12},
        {"type":"fire","power":2,"text":"Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; quema durante 3 s con 15% del ataque por segundo.","shape":"area","radius":1,"center":"target","burn":0.15},
        {"type":"fire","power":2.2,"text":"Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; quema durante 3 s con 18% del ataque por segundo; obtiene un escudo del 15% de su vida.","shape":"area","radius":1,"center":"target","burn":0.18,"selfShield":0.15}
      ],
      openers:[
        {"type":"fire","power":0,"text":"Obtiene un escudo del 10% de su vida.","selfShield":0.1},
        {"type":"fire","power":0,"text":"Obtiene un escudo del 12% de su vida.","selfShield":0.12},
        {"type":"fire","power":0,"text":"Obtiene un escudo del 14% de su vida.","selfShield":0.14}
      ]
    },
    {line:[912, 913, 914],cost:2,role:"fighter",moves:["Pistola Agua", "Acua Jet", "Danza Acuática"],
      entry:"Paso de Autoestima",passive:["attack", 0.08, "Aumenta un 8% su daño."],
      skills:[
        {"type":"water","power":2,"text":"Golpea al enemigo seleccionado."},
        {"type":"water","power":2.2,"text":"Golpea al enemigo seleccionado; aumenta su cadencia un 15% durante 2 s.","boost":0.15},
        {"type":"water","power":2.6,"text":"Golpea al enemigo seleccionado; empuja 1 casilla libre; aumenta su cadencia un 25% durante 2 s.","boost":0.25,"push":1}
      ],
      openers:[
        {"type":"water","power":0.4,"text":"Golpea al enemigo seleccionado; aumenta su cadencia un 12% durante 2 s.","boost":0.12},
        {"type":"water","power":0.55,"text":"Golpea al enemigo seleccionado; aumenta su cadencia un 12% durante 2 s.","boost":0.12},
        {"type":"water","power":0.7,"text":"Golpea al enemigo seleccionado; aumenta su cadencia un 12% durante 2 s.","boost":0.12}
      ]
    },
    {line:[215, 461],cost:2,role:"fighter",moves:["Viento Hielo", "Tajo Umbrío", "Chuzos"],
      entry:"Foco Gélido",passive:["pierce", 0.1, "Ignora un 10% adicional de defensa."],
      skills:[
        {"type":"ice","power":1.7,"text":"Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; reduce la cadencia enemiga un 20% durante 2 s.","shape":"area","radius":1,"center":"target","slow":0.2},
        {"type":"dark","power":2.5,"text":"Golpea al enemigo seleccionado; aumenta el daño hasta un 30% según la vida perdida del enemigo.","execute":0.3},
        {"type":"ice","power":2.2,"text":"Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; aturde 0,5 s.","shape":"area","radius":1,"center":"target","stun":0.5}
      ],
      openers:[
        {"type":"ice","power":0.4,"text":"Golpea al enemigo seleccionado; reduce la cadencia enemiga un 15% durante 2 s.","slow":0.15},
        {"type":"ice","power":0.55,"text":"Golpea al enemigo seleccionado; reduce la cadencia enemiga un 20% durante 2 s.","slow":0.2},
        {"type":"ice","power":0.7,"text":"Golpea al enemigo seleccionado; reduce la cadencia enemiga un 25% durante 2 s.","slow":0.25}
      ]
    },
    {line:[446, 143],cost:3,role:"tank",moves:["Placaje", "Golpe Cuerpo", "Descanso"],
      entry:"Gran Reserva",passive:["shield", 0.18, "Empieza con un escudo del 18% de su vida."],
      skills:[
        {"type":"normal","power":2.2,"text":"Golpea al enemigo seleccionado; obtiene un escudo del 12% de su vida.","selfShield":0.12},
        {"type":"normal","power":2,"text":"Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; aturde 0,45 s.","shape":"area","radius":1,"center":"target","stun":0.45},
        {"type":"normal","power":0,"text":"Recupera vida por el 350% de su ataque, obtiene un escudo del 20% de su vida y elimina sus quemaduras, ralentizaciones y aturdimientos.","selfHealing":3.5,"selfShield":0.2,"selfCleanse":true}
      ],
      openers:[
        {"type":"normal","power":0,"text":"Obtiene un escudo del 8% de su vida.","selfShield":0.08},
        {"type":"normal","power":0,"text":"Obtiene un escudo del 10% de su vida.","selfShield":0.1},
        {"type":"normal","power":0,"text":"Obtiene un escudo del 12% de su vida.","selfShield":0.12}
      ]
    },
    {line:[304, 305, 306],cost:3,role:"tank",moves:["Garra Metal", "Avalancha", "Cuerpo Pesado"],
      entry:"Robustez Férrea",passive:["shield", 0.16, "Empieza con un escudo del 16% de su vida."],
      skills:[
        {"type":"steel","power":2.1,"text":"Golpea al enemigo seleccionado; obtiene un escudo del 12% de su vida.","selfShield":0.12},
        {"type":"rock","power":2,"text":"Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; aturde 0,4 s.","shape":"area","radius":1,"center":"target","stun":0.4},
        {"type":"steel","power":2.4,"text":"Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; obtiene un escudo del 18% de su vida.","shape":"area","radius":1,"center":"target","selfShield":0.18}
      ],
      openers:[
        {"type":"steel","power":0.45,"text":"Golpea al enemigo seleccionado; aturde 0,25 s.","stun":0.25},
        {"type":"steel","power":0.6,"text":"Golpea al enemigo seleccionado; aturde 0,35 s.","stun":0.35},
        {"type":"steel","power":0.75,"text":"Golpea al enemigo seleccionado; aturde 0,45 s.","stun":0.45}
      ]
    },
    {line:[479],cost:3,role:"mage",moves:["Impactrueno", "Bola Sombra", "Voltio Cambio"],
      entry:"Circuito Levitante",passive:["speed", 0.1, "Aumenta un 10% su cadencia."],
      skills:[
        {"type":"electric","power":2,"text":"Golpea al enemigo seleccionado; reduce la cadencia enemiga un 20% durante 2 s.","slow":0.2},
        {"type":"ghost","power":2.5,"text":"Golpea al enemigo seleccionado; ignora el 30% de defensa.","pierce":0.3},
        {"type":"electric","power":2.6,"text":"Atraviesa 4 casillas y daña a los enemigos de la línea; escuda a 2 aliados con menos vida proporcional con el 8% de la vida de cada receptor.","shape":"line","length":4,"friendShield":0.08,"friends":2}
      ],
      openers:[
        {"type":"electric","power":0.4,"text":"Atraviesa 3 casillas y daña a los enemigos de la línea; reduce la cadencia enemiga un 15% durante 2 s.","shape":"line","length":3,"slow":0.15},
        {"type":"electric","power":0.55,"text":"Atraviesa 3 casillas y daña a los enemigos de la línea; reduce la cadencia enemiga un 15% durante 2 s.","shape":"line","length":3,"slow":0.15},
        {"type":"electric","power":0.7,"text":"Atraviesa 3 casillas y daña a los enemigos de la línea; reduce la cadencia enemiga un 15% durante 2 s.","shape":"line","length":3,"slow":0.15}
      ]
    },
    {line:[597, 598],cost:3,role:"tank",moves:["Latigazo", "Giro Bola", "Drenadoras"],
      entry:"Puntas de Acero",passive:["thorns", 0.2, "Devuelve un 20% de la vida perdida por ataques básicos adyacentes como daño de Acero. No refleja movimientos especiales ni daño periódico y no provoca cadenas de reflejo."],
      skills:[
        {"type":"grass","power":2.1,"text":"Golpea al enemigo seleccionado; reduce la cadencia enemiga un 20% durante 2 s.","slow":0.2},
        {"type":"steel","power":2.2,"text":"Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; reduce la cadencia enemiga un 20% durante 2 s.","shape":"area","radius":1,"center":"target","slow":0.2},
        {"type":"grass","power":1.8,"text":"Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; cura a 2 aliados por el 80% del daño efectivo, repartido entre ellos.","shape":"area","radius":1,"center":"target","drain":0.8,"friends":2}
      ],
      openers:[
        {"type":"steel","power":0,"text":"Escuda a 2 aliados con menos vida proporcional con el 4% de la vida de cada receptor.","friendShield":0.04,"friends":2},
        {"type":"steel","power":0,"text":"Escuda a 2 aliados con menos vida proporcional con el 6% de la vida de cada receptor.","friendShield":0.06,"friends":2},
        {"type":"steel","power":0,"text":"Escuda a 2 aliados con menos vida proporcional con el 8% de la vida de cada receptor.","friendShield":0.08,"friends":2}
      ]
    },
    {line:[607, 608, 609],cost:3,role:"mage",moves:["Ascuas", "Infortunio", "Llamarada"],
      entry:"Llama Absorbente",passive:["pierce", 0.1, "Ignora un 10% adicional de defensa."],
      skills:[
        {"type":"fire","power":1.9,"text":"Golpea al enemigo seleccionado; quema durante 3 s con 15% del ataque por segundo.","burn":0.15},
        {"type":"ghost","power":2.5,"text":"Golpea al enemigo seleccionado; aumenta el daño hasta un 40% según la vida perdida del enemigo.","execute":0.4},
        {"type":"fire","power":2.4,"text":"Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; quema durante 3 s con 22% del ataque por segundo.","shape":"area","radius":1,"center":"target","burn":0.22}
      ],
      openers:[
        {"type":"fire","power":0.4,"text":"Golpea al enemigo seleccionado; quema durante 3 s con 10% del ataque por segundo.","burn":0.1},
        {"type":"fire","power":0.55,"text":"Golpea al enemigo seleccionado; quema durante 3 s con 10% del ataque por segundo.","burn":0.1},
        {"type":"fire","power":0.7,"text":"Golpea al enemigo seleccionado; quema durante 3 s con 10% del ataque por segundo.","burn":0.1}
      ]
    },
    {line:[679, 680, 681],cost:4,role:"tank",moves:["Garra Metal", "Espada Santa", "Escudo Real"],
      entry:"Cambio Táctico",passive:["armor", 15, "Obtiene 15 de defensa."],
      skills:[
        {"type":"steel","power":2.2,"text":"Golpea al enemigo seleccionado; obtiene un escudo del 15% de su vida.","selfShield":0.15},
        {"type":"fighting","power":2.8,"text":"Golpea al enemigo seleccionado; ignora el 50% de defensa.","pierce":0.5},
        {"type":"steel","power":2.2,"text":"Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; obtiene un escudo del 20% de su vida; escuda a 2 aliados con menos vida proporcional con el 10% de la vida de cada receptor.","shape":"area","radius":1,"center":"target","selfShield":0.2,"friendShield":0.1,"friends":2}
      ],
      openers:[
        {"type":"steel","power":0,"text":"Obtiene un escudo del 10% de su vida; escuda a 2 aliados con menos vida proporcional con el 4% de la vida de cada receptor.","selfShield":0.1,"friendShield":0.04,"friends":2},
        {"type":"steel","power":0,"text":"Obtiene un escudo del 13% de su vida; escuda a 2 aliados con menos vida proporcional con el 4% de la vida de cada receptor.","selfShield":0.13,"friendShield":0.04,"friends":2},
        {"type":"steel","power":0,"text":"Obtiene un escudo del 16% de su vida; escuda a 2 aliados con menos vida proporcional con el 4% de la vida de cada receptor.","selfShield":0.16,"friendShield":0.04,"friends":2}
      ]
    },
    {line:[884, 1018],cost:4,role:"tank",moves:["Garra Metal", "Foco Resplandor", "Electrorrayo"],
      entry:"Firmeza del Puente",passive:["armor", 18, "Obtiene 18 de defensa."],
      skills:[
        {"type":"steel","power":2.2,"text":"Golpea al enemigo seleccionado; obtiene un escudo del 12% de su vida.","selfShield":0.12},
        {"type":"steel","power":2.6,"text":"Atraviesa 4 casillas y daña a los enemigos de la línea; ignora el 25% de defensa.","shape":"line","length":4,"pierce":0.25},
        {"type":"electric","power":2.8,"text":"Atraviesa 4 casillas y daña a los enemigos de la línea; obtiene un escudo del 15% de su vida.","shape":"line","length":4,"selfShield":0.15}
      ],
      openers:[
        {"type":"electric","power":0.4,"text":"Atraviesa 3 casillas y daña a los enemigos de la línea.","shape":"line","length":3},
        {"type":"electric","power":0.55,"text":"Atraviesa 3 casillas y daña a los enemigos de la línea.","shape":"line","length":3},
        {"type":"electric","power":0.7,"text":"Atraviesa 3 casillas y daña a los enemigos de la línea.","shape":"line","length":3}
      ]
    }
  );
  EXPANSION.push({line:[661,662,663],cost:2,role:'fighter',moves:['Picotazo','Nitrocarga','Pájaro Osado'],
    entry:'Alas Vendaval',passive:['gale',0,'Con la vida completa actúa antes que las unidades sin prioridad dentro de cada pulso de ataque. Perder vida desactiva la prioridad; curarse al máximo la recupera. Sus básicos son de tipo Volador.'],
    skills:[
      {type:'flying',power:2.1,text:'Picotazo golpea a un enemigo con daño Volador y aumenta un 10% su cadencia durante 2 segundos.',boost:.1},
      {type:'fire',power:2.4,text:'Nitrocarga golpea y quema al objetivo durante 3 segundos con un 15% del ataque por segundo; aumenta un 15% su cadencia durante 2 segundos.',burn:.15,boost:.15},
      {type:'flying',power:2.8,text:'Pájaro Osado golpea al objetivo y a los enemigos a 1 casilla de él, ignora un 30% de defensa y aumenta el daño hasta un 25% según la vida perdida de cada enemigo.',shape:'area',radius:1,center:'target',pierce:.3,execute:.25}
    ],
    openers:[
      {type:'flying',power:0,text:'Viento Afín aumenta un 8% la cadencia de todos los aliados durante 2 segundos, sin acumular multiplicadores.',allyBoost:.08,friends:6},
      {type:'flying',power:0,text:'Viento Afín aumenta un 12% la cadencia de todos los aliados durante 2 segundos, sin acumular multiplicadores.',allyBoost:.12,friends:6},
      {type:'flying',power:0,text:'Viento Afín aumenta un 16% la cadencia de todos los aliados durante 2 segundos, sin acumular multiplicadores.',allyBoost:.16,friends:6}
    ]
  });
  // Third expansion: 25 competitive families across all nine regions, ten at one gold.
  EXPANSION.push(...[
  {
    "line": [
      10,
      11,
      12
    ],
    "cost": 1,
    "role": "mage",
    "moves": [
      "Disparo Demora",
      "Fortaleza",
      "Somnífero"
    ],
    "entry": "Polvo Somnífero · Butterfree",
    "passive": [
      "mana",
      25,
      "Empieza con 25 de maná adicional."
    ],
    "skills": [
      {
        "type": "bug",
        "power": 1.5,
        "slow": 0.2,
        "text": "Golpea al enemigo seleccionado; reduce la cadencia enemiga un 20% durante 2 s."
      },
      {
        "type": "normal",
        "power": 0,
        "selfShield": 0.25,
        "text": "obtiene un escudo del 25% de su vida."
      },
      {
        "type": "grass",
        "power": 1.4,
        "shape": "area",
        "radius": 1,
        "center": "target",
        "stun": 0.5,
        "text": "Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; aturde 0,5 s."
      }
    ],
    "openers": [
      {
        "type": "bug",
        "power": 0.35,
        "slow": 0.15,
        "text": "Golpea al enemigo seleccionado; reduce la cadencia enemiga un 15% durante 2 s."
      },
      {
        "type": "bug",
        "power": 0.5,
        "slow": 0.15,
        "text": "Golpea al enemigo seleccionado; reduce la cadencia enemiga un 15% durante 2 s."
      },
      {
        "type": "bug",
        "power": 0.65,
        "slow": 0.15,
        "text": "Golpea al enemigo seleccionado; reduce la cadencia enemiga un 15% durante 2 s."
      }
    ]
  },
  {
    "line": [
      41,
      42,
      169
    ],
    "cost": 1,
    "role": "fighter",
    "moves": [
      "Mordisco",
      "Chupavidas",
      "Tajo Aéreo"
    ],
    "entry": "Foco Interno · Crobat",
    "passive": [
      "speed",
      0.1,
      "Aumenta su potencia de cadencia un 10%."
    ],
    "skills": [
      {
        "type": "dark",
        "power": 1.8,
        "text": "Golpea al enemigo seleccionado."
      },
      {
        "type": "bug",
        "power": 2,
        "selfDrain": 0.3,
        "text": "Golpea al enemigo seleccionado; se cura un 30% del daño efectivo causado."
      },
      {
        "type": "flying",
        "power": 2.3,
        "shape": "line",
        "length": 3,
        "slow": 0.15,
        "text": "Atraviesa 3 casillas y daña a los enemigos en la línea; reduce la cadencia enemiga un 15% durante 2 s."
      }
    ],
    "openers": [
      {
        "type": "flying",
        "power": 0,
        "selfShield": 0.08,
        "selfCleanse": true,
        "text": "obtiene un escudo del 8% de su vida; limpia sus quemaduras, ralentizaciones y aturdimientos."
      },
      {
        "type": "flying",
        "power": 0,
        "selfShield": 0.08,
        "selfCleanse": true,
        "text": "obtiene un escudo del 8% de su vida; limpia sus quemaduras, ralentizaciones y aturdimientos."
      },
      {
        "type": "flying",
        "power": 0,
        "selfShield": 0.08,
        "selfCleanse": true,
        "text": "obtiene un escudo del 8% de su vida; limpia sus quemaduras, ralentizaciones y aturdimientos."
      }
    ]
  },
  {
    "line": [
      79,
      80
    ],
    "cost": 2,
    "role": "healer",
    "moves": [
      "Confusión",
      "Pulso Cura",
      "Relajo"
    ],
    "entry": "Regeneración · Slowbro",
    "passive": [
      "regen",
      0.008,
      "Regenera un 0,8% de vida por segundo."
    ],
    "skills": [
      {
        "type": "psychic",
        "power": 1.5,
        "healing": 1.2,
        "text": "Golpea al enemigo seleccionado; cura a un aliado por el 120% del ataque."
      },
      {
        "type": "psychic",
        "power": 0,
        "healing": 3,
        "friends": 2,
        "text": "cura a 2 aliados por el 300% del ataque."
      },
      {
        "type": "psychic",
        "power": 0,
        "healing": 3.4,
        "friends": 2,
        "selfHealing": 2,
        "cleanse": true,
        "text": "cura a 2 aliados por el 340% del ataque; se cura por el 200% del ataque; limpia quemadura, ralentización y aturdimiento de esos aliados."
      }
    ],
    "openers": [
      {
        "type": "psychic",
        "power": 0,
        "healing": 0.7,
        "friends": 2,
        "text": "cura a 2 aliados por el 70% del ataque."
      },
      {
        "type": "psychic",
        "power": 0,
        "healing": 0.7,
        "friends": 2,
        "text": "cura a 2 aliados por el 70% del ataque."
      },
      {
        "type": "psychic",
        "power": 0,
        "healing": 0.7,
        "friends": 2,
        "text": "cura a 2 aliados por el 70% del ataque."
      }
    ]
  },
  {
    "line": [
      187,
      188,
      189
    ],
    "cost": 1,
    "role": "healer",
    "moves": [
      "Absorber",
      "Drenadoras",
      "Algodón Espora"
    ],
    "entry": "Allanamiento · Jumpluff",
    "passive": [
      "pierce",
      0.12,
      "Ignora un 12% adicional de defensa."
    ],
    "skills": [
      {
        "type": "grass",
        "power": 1.3,
        "drain": 0.4,
        "text": "Golpea al enemigo seleccionado; reparte un 40% del daño efectivo causado como curación entre 1 aliados."
      },
      {
        "type": "grass",
        "power": 1.7,
        "drain": 0.4,
        "slow": 0.15,
        "text": "Golpea al enemigo seleccionado; reduce la cadencia enemiga un 15% durante 2 s; reparte un 40% del daño efectivo causado como curación entre 1 aliados."
      },
      {
        "type": "grass",
        "power": 1.5,
        "shape": "area",
        "radius": 1,
        "center": "target",
        "slow": 0.3,
        "healing": 1.5,
        "friends": 2,
        "text": "Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; reduce la cadencia enemiga un 30% durante 2 s; cura a 2 aliados por el 150% del ataque."
      }
    ],
    "openers": [
      {
        "type": "grass",
        "power": 0.35,
        "slow": 0.2,
        "text": "Golpea al enemigo seleccionado; reduce la cadencia enemiga un 20% durante 2 s."
      },
      {
        "type": "grass",
        "power": 0.5,
        "slow": 0.2,
        "text": "Golpea al enemigo seleccionado; reduce la cadencia enemiga un 20% durante 2 s."
      },
      {
        "type": "grass",
        "power": 0.65,
        "slow": 0.2,
        "text": "Golpea al enemigo seleccionado; reduce la cadencia enemiga un 20% durante 2 s."
      }
    ]
  },
  {
    "line": [
      214
    ],
    "cost": 3,
    "role": "fighter",
    "moves": [
      "Golpe Roca",
      "Demolición",
      "Megacuerno"
    ],
    "entry": "Autoestima · Heracross",
    "passive": [
      "attack",
      0.08,
      "Aumenta su daño un 8%."
    ],
    "skills": [
      {
        "type": "fighting",
        "power": 2,
        "pierce": 0.2,
        "text": "Golpea al enemigo seleccionado; ignora un 20% de defensa."
      },
      {
        "type": "fighting",
        "power": 2.5,
        "breakShield": 0.5,
        "text": "Golpea al enemigo seleccionado; rompe un 50% del escudo de cada objetivo."
      },
      {
        "type": "bug",
        "power": 3,
        "pierce": 0.4,
        "selfShield": 0.12,
        "text": "Golpea al enemigo seleccionado; ignora un 40% de defensa; obtiene un escudo del 12% de su vida."
      }
    ],
    "openers": [
      {
        "type": "fighting",
        "power": 0,
        "boost": 0.12,
        "selfShield": 0.1,
        "text": "obtiene un escudo del 10% de su vida; aumenta su cadencia un 12% durante 2 s."
      },
      {
        "type": "fighting",
        "power": 0,
        "boost": 0.12,
        "selfShield": 0.1,
        "text": "obtiene un escudo del 10% de su vida; aumenta su cadencia un 12% durante 2 s."
      },
      {
        "type": "fighting",
        "power": 0,
        "boost": 0.12,
        "selfShield": 0.1,
        "text": "obtiene un escudo del 10% de su vida; aumenta su cadencia un 12% durante 2 s."
      }
    ]
  },
  {
    "line": [
      227
    ],
    "cost": 2,
    "role": "tank",
    "moves": [
      "Ala de Acero",
      "Púas",
      "Pájaro Osado"
    ],
    "entry": "Robustez · Skarmory",
    "passive": [
      "shield",
      0.18,
      "Empieza con un escudo del 18% de su vida."
    ],
    "skills": [
      {
        "type": "steel",
        "power": 1.8,
        "selfShield": 0.12,
        "text": "Golpea al enemigo seleccionado; obtiene un escudo del 12% de su vida."
      },
      {
        "type": "steel",
        "power": 1.6,
        "shape": "area",
        "radius": 1,
        "center": "self",
        "slow": 0.2,
        "text": "Daña a los enemigos en un radio de 1 casilla alrededor del usuario; reduce la cadencia enemiga un 20% durante 2 s."
      },
      {
        "type": "flying",
        "power": 2.5,
        "shape": "line",
        "length": 3,
        "selfShield": 0.15,
        "text": "Atraviesa 3 casillas y daña a los enemigos en la línea; obtiene un escudo del 15% de su vida."
      }
    ],
    "openers": [
      {
        "type": "steel",
        "power": 0,
        "friendShield": 0.06,
        "friends": 2,
        "text": "escuda a 2 aliados con un 6% de la vida de cada receptor."
      },
      {
        "type": "steel",
        "power": 0,
        "friendShield": 0.06,
        "friends": 2,
        "text": "escuda a 2 aliados con un 6% de la vida de cada receptor."
      },
      {
        "type": "steel",
        "power": 0,
        "friendShield": 0.06,
        "friends": 2,
        "text": "escuda a 2 aliados con un 6% de la vida de cada receptor."
      }
    ]
  },
  {
    "line": [
      307,
      308
    ],
    "cost": 2,
    "role": "fighter",
    "moves": [
      "Palmeo",
      "Cabezazo Zen",
      "Patada Salto Alta"
    ],
    "entry": "Energía Pura · Medicham",
    "passive": [
      "attack",
      0.12,
      "Aumenta su daño un 12%."
    ],
    "skills": [
      {
        "type": "fighting",
        "power": 1.9,
        "stun": 0.25,
        "text": "Golpea al enemigo seleccionado; aturde 0,25 s."
      },
      {
        "type": "psychic",
        "power": 2.3,
        "pierce": 0.3,
        "text": "Golpea al enemigo seleccionado; ignora un 30% de defensa."
      },
      {
        "type": "fighting",
        "power": 3,
        "pierce": 0.45,
        "selfShield": 0.08,
        "text": "Golpea al enemigo seleccionado; ignora un 45% de defensa; obtiene un escudo del 8% de su vida."
      }
    ],
    "openers": [
      {
        "type": "fighting",
        "power": 0.35,
        "pierce": 0.3,
        "text": "Golpea al enemigo seleccionado; ignora un 30% de defensa."
      },
      {
        "type": "fighting",
        "power": 0.5,
        "pierce": 0.3,
        "text": "Golpea al enemigo seleccionado; ignora un 30% de defensa."
      },
      {
        "type": "fighting",
        "power": 0.65,
        "pierce": 0.3,
        "text": "Golpea al enemigo seleccionado; ignora un 30% de defensa."
      }
    ]
  },
  {
    "line": [
      322,
      323
    ],
    "cost": 1,
    "role": "mage",
    "moves": [
      "Ascuas",
      "Magnitud",
      "Estallido"
    ],
    "entry": "Llama Interior · Camerupt",
    "passive": [
      "shield",
      0.1,
      "Empieza con un escudo del 10% de su vida."
    ],
    "skills": [
      {
        "type": "fire",
        "power": 1.8,
        "burn": 0.1,
        "text": "Golpea al enemigo seleccionado; quema durante 3 s con un 10% del ataque por segundo."
      },
      {
        "type": "ground",
        "power": 1.9,
        "shape": "area",
        "radius": 1,
        "center": "target",
        "text": "Daña a los enemigos en un radio de 1 casilla alrededor del objetivo."
      },
      {
        "type": "fire",
        "power": 2.3,
        "shape": "area",
        "radius": 1,
        "center": "target",
        "burn": 0.12,
        "text": "Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; quema durante 3 s con un 12% del ataque por segundo."
      }
    ],
    "openers": [
      {
        "type": "fire",
        "power": 0.35,
        "burn": 0.06,
        "text": "Golpea al enemigo seleccionado; quema durante 3 s con un 6% del ataque por segundo."
      },
      {
        "type": "fire",
        "power": 0.5,
        "burn": 0.06,
        "text": "Golpea al enemigo seleccionado; quema durante 3 s con un 6% del ataque por segundo."
      },
      {
        "type": "fire",
        "power": 0.65,
        "burn": 0.06,
        "text": "Golpea al enemigo seleccionado; quema durante 3 s con un 6% del ataque por segundo."
      }
    ]
  },
  {
    "line": [
      302
    ],
    "cost": 2,
    "role": "mage",
    "moves": [
      "Impresionar",
      "Fuego Fatuo",
      "Pulso Umbrío"
    ],
    "entry": "Bromista · Sableye",
    "passive": [
      "mana",
      35,
      "Empieza con 35 de maná adicional."
    ],
    "skills": [
      {
        "type": "ghost",
        "power": 1.7,
        "stun": 0.25,
        "text": "Golpea al enemigo seleccionado; aturde 0,25 s."
      },
      {
        "type": "fire",
        "power": 1.3,
        "burn": 0.18,
        "text": "Golpea al enemigo seleccionado; quema durante 3 s con un 18% del ataque por segundo."
      },
      {
        "type": "dark",
        "power": 2.3,
        "shape": "area",
        "radius": 1,
        "center": "target",
        "breakShield": 0.4,
        "text": "Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; rompe un 40% del escudo de cada objetivo."
      }
    ],
    "openers": [
      {
        "type": "ghost",
        "power": 0.35,
        "slow": 0.2,
        "text": "Golpea al enemigo seleccionado; reduce la cadencia enemiga un 20% durante 2 s."
      },
      {
        "type": "ghost",
        "power": 0.5,
        "slow": 0.2,
        "text": "Golpea al enemigo seleccionado; reduce la cadencia enemiga un 20% durante 2 s."
      },
      {
        "type": "ghost",
        "power": 0.65,
        "slow": 0.2,
        "text": "Golpea al enemigo seleccionado; reduce la cadencia enemiga un 20% durante 2 s."
      }
    ]
  },
  {
    "line": [
      406,
      315,
      407
    ],
    "cost": 2,
    "role": "healer",
    "moves": [
      "Absorber",
      "Gigadrenado",
      "Danza Pétalo"
    ],
    "entry": "Cura Natural · Roserade",
    "passive": [
      "regen",
      0.006,
      "Regenera un 0,6% de vida por segundo."
    ],
    "skills": [
      {
        "type": "grass",
        "power": 1.4,
        "drain": 0.4,
        "text": "Golpea al enemigo seleccionado; reparte un 40% del daño efectivo causado como curación entre 1 aliados."
      },
      {
        "type": "grass",
        "power": 1.9,
        "drain": 0.4,
        "friends": 2,
        "text": "Golpea al enemigo seleccionado; reparte un 40% del daño efectivo causado como curación entre 2 aliados."
      },
      {
        "type": "grass",
        "power": 2.1,
        "shape": "area",
        "radius": 1,
        "center": "target",
        "drain": 0.25,
        "friends": 3,
        "text": "Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; reparte un 25% del daño efectivo causado como curación entre 3 aliados."
      }
    ],
    "openers": [
      {
        "type": "grass",
        "power": 0,
        "friendShield": 0.05,
        "friends": 2,
        "cleanse": true,
        "text": "escuda a 2 aliados con un 5% de la vida de cada receptor; limpia quemadura, ralentización y aturdimiento de esos aliados."
      },
      {
        "type": "grass",
        "power": 0,
        "friendShield": 0.05,
        "friends": 2,
        "cleanse": true,
        "text": "escuda a 2 aliados con un 5% de la vida de cada receptor; limpia quemadura, ralentización y aturdimiento de esos aliados."
      },
      {
        "type": "grass",
        "power": 0,
        "friendShield": 0.05,
        "friends": 2,
        "cleanse": true,
        "text": "escuda a 2 aliados con un 5% de la vida de cada receptor; limpia quemadura, ralentización y aturdimiento de esos aliados."
      }
    ]
  },
  {
    "line": [
      403,
      404,
      405
    ],
    "cost": 1,
    "role": "fighter",
    "moves": [
      "Chispa",
      "Colmillo Rayo",
      "Voltio Cruel"
    ],
    "entry": "Intimidación · Luxray",
    "passive": [
      "intimidate",
      0.08,
      "Reduce un 8% el daño rival. No se acumula con otras intimidaciones."
    ],
    "skills": [
      {
        "type": "electric",
        "power": 1.8,
        "slow": 0.15,
        "text": "Golpea al enemigo seleccionado; reduce la cadencia enemiga un 15% durante 2 s."
      },
      {
        "type": "electric",
        "power": 2.2,
        "stun": 0.3,
        "text": "Golpea al enemigo seleccionado; aturde 0,3 s."
      },
      {
        "type": "electric",
        "power": 2.7,
        "shape": "line",
        "length": 3,
        "breakShield": 0.25,
        "text": "Atraviesa 3 casillas y daña a los enemigos en la línea; rompe un 25% del escudo de cada objetivo."
      }
    ],
    "openers": [
      {
        "type": "electric",
        "power": 0.35,
        "slow": 0.15,
        "text": "Golpea al enemigo seleccionado; reduce la cadencia enemiga un 15% durante 2 s."
      },
      {
        "type": "electric",
        "power": 0.5,
        "slow": 0.15,
        "text": "Golpea al enemigo seleccionado; reduce la cadencia enemiga un 15% durante 2 s."
      },
      {
        "type": "electric",
        "power": 0.65,
        "slow": 0.15,
        "text": "Golpea al enemigo seleccionado; reduce la cadencia enemiga un 15% durante 2 s."
      }
    ]
  },
  {
    "line": [
      449,
      450
    ],
    "cost": 2,
    "role": "tank",
    "moves": [
      "Excavar",
      "Terremoto",
      "Relajo"
    ],
    "entry": "Chorro Arena · Hippowdon",
    "passive": [
      "armor",
      12,
      "Obtiene 12 de defensa."
    ],
    "skills": [
      {
        "type": "ground",
        "power": 1.8,
        "selfShield": 0.12,
        "text": "Golpea al enemigo seleccionado; obtiene un escudo del 12% de su vida."
      },
      {
        "type": "ground",
        "power": 2.1,
        "shape": "area",
        "radius": 1,
        "center": "self",
        "slow": 0.2,
        "text": "Daña a los enemigos en un radio de 1 casilla alrededor del usuario; reduce la cadencia enemiga un 20% durante 2 s."
      },
      {
        "type": "ground",
        "power": 1.8,
        "shape": "area",
        "radius": 1,
        "center": "self",
        "selfHealing": 3,
        "text": "Daña a los enemigos en un radio de 1 casilla alrededor del usuario; se cura por el 300% del ataque."
      }
    ],
    "openers": [
      {
        "type": "ground",
        "power": 0.35,
        "shape": "area",
        "radius": 1,
        "center": "self",
        "slow": 0.15,
        "text": "Daña a los enemigos en un radio de 1 casilla alrededor del usuario; reduce la cadencia enemiga un 15% durante 2 s."
      },
      {
        "type": "ground",
        "power": 0.5,
        "shape": "area",
        "radius": 1,
        "center": "self",
        "slow": 0.15,
        "text": "Daña a los enemigos en un radio de 1 casilla alrededor del usuario; reduce la cadencia enemiga un 15% durante 2 s."
      },
      {
        "type": "ground",
        "power": 0.65,
        "shape": "area",
        "radius": 1,
        "center": "self",
        "slow": 0.15,
        "text": "Daña a los enemigos en un radio de 1 casilla alrededor del usuario; reduce la cadencia enemiga un 15% durante 2 s."
      }
    ]
  },
  {
    "line": [
      532,
      533,
      534
    ],
    "cost": 1,
    "role": "fighter",
    "moves": [
      "Golpe Roca",
      "Machada",
      "Puño Drenaje"
    ],
    "entry": "Agallas · Conkeldurr",
    "passive": [
      "attack",
      0.08,
      "Aumenta su daño un 8%."
    ],
    "skills": [
      {
        "type": "fighting",
        "power": 1.8,
        "pierce": 0.15,
        "text": "Golpea al enemigo seleccionado; ignora un 15% de defensa."
      },
      {
        "type": "fighting",
        "power": 2.4,
        "breakShield": 0.35,
        "text": "Golpea al enemigo seleccionado; rompe un 35% del escudo de cada objetivo."
      },
      {
        "type": "fighting",
        "power": 2.5,
        "selfDrain": 0.4,
        "text": "Golpea al enemigo seleccionado; se cura un 40% del daño efectivo causado."
      }
    ],
    "openers": [
      {
        "type": "fighting",
        "power": 0,
        "boost": 0.1,
        "selfCleanse": true,
        "text": "aumenta su cadencia un 10% durante 2 s; limpia sus quemaduras, ralentizaciones y aturdimientos."
      },
      {
        "type": "fighting",
        "power": 0,
        "boost": 0.1,
        "selfCleanse": true,
        "text": "aumenta su cadencia un 10% durante 2 s; limpia sus quemaduras, ralentizaciones y aturdimientos."
      },
      {
        "type": "fighting",
        "power": 0,
        "boost": 0.1,
        "selfCleanse": true,
        "text": "aumenta su cadencia un 10% durante 2 s; limpia sus quemaduras, ralentizaciones y aturdimientos."
      }
    ]
  },
  {
    "line": [
      546,
      547
    ],
    "cost": 1,
    "role": "healer",
    "moves": [
      "Absorber",
      "Drenadoras",
      "Viento Afín"
    ],
    "entry": "Bromista · Whimsicott",
    "passive": [
      "mana",
      30,
      "Empieza con 30 de maná adicional."
    ],
    "skills": [
      {
        "type": "grass",
        "power": 1.2,
        "drain": 0.35,
        "text": "Golpea al enemigo seleccionado; reparte un 35% del daño efectivo causado como curación entre 1 aliados."
      },
      {
        "type": "grass",
        "power": 1.6,
        "drain": 0.4,
        "friends": 2,
        "text": "Golpea al enemigo seleccionado; reparte un 40% del daño efectivo causado como curación entre 2 aliados."
      },
      {
        "type": "flying",
        "power": 0,
        "healing": 2.5,
        "allyBoost": 0.15,
        "friends": 3,
        "text": "aumenta la cadencia de 3 aliados un 15% durante 2 s; cura a 3 aliados por el 250% del ataque."
      }
    ],
    "openers": [
      {
        "type": "fairy",
        "power": 0,
        "friendShield": 0.06,
        "allyMana": 10,
        "friends": 2,
        "text": "escuda a 2 aliados con un 6% de la vida de cada receptor; da 10 de maná a 2 aliados."
      },
      {
        "type": "fairy",
        "power": 0,
        "friendShield": 0.06,
        "allyMana": 10,
        "friends": 2,
        "text": "escuda a 2 aliados con un 6% de la vida de cada receptor; da 10 de maná a 2 aliados."
      },
      {
        "type": "fairy",
        "power": 0,
        "friendShield": 0.06,
        "allyMana": 10,
        "friends": 2,
        "text": "escuda a 2 aliados con un 6% de la vida de cada receptor; da 10 de maná a 2 aliados."
      }
    ]
  },
  {
    "line": [
      595,
      596
    ],
    "cost": 2,
    "role": "mage",
    "moves": [
      "Electrotela",
      "Chispazo",
      "Trueno"
    ],
    "entry": "Ojo Compuesto · Galvantula",
    "passive": [
      "pierce",
      0.1,
      "Ignora un 10% adicional de defensa."
    ],
    "skills": [
      {
        "type": "electric",
        "power": 1.5,
        "shape": "area",
        "radius": 1,
        "center": "target",
        "slow": 0.25,
        "text": "Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; reduce la cadencia enemiga un 25% durante 2 s."
      },
      {
        "type": "electric",
        "power": 2,
        "shape": "area",
        "radius": 1,
        "center": "self",
        "text": "Daña a los enemigos en un radio de 1 casilla alrededor del usuario."
      },
      {
        "type": "electric",
        "power": 2.6,
        "shape": "line",
        "length": 4,
        "stun": 0.25,
        "text": "Atraviesa 4 casillas y daña a los enemigos en la línea; aturde 0,25 s."
      }
    ],
    "openers": [
      {
        "type": "electric",
        "power": 0.35,
        "shape": "line",
        "length": 3,
        "slow": 0.15,
        "text": "Atraviesa 3 casillas y daña a los enemigos en la línea; reduce la cadencia enemiga un 15% durante 2 s."
      },
      {
        "type": "electric",
        "power": 0.5,
        "shape": "line",
        "length": 3,
        "slow": 0.15,
        "text": "Atraviesa 3 casillas y daña a los enemigos en la línea; reduce la cadencia enemiga un 15% durante 2 s."
      },
      {
        "type": "electric",
        "power": 0.65,
        "shape": "line",
        "length": 3,
        "slow": 0.15,
        "text": "Atraviesa 3 casillas y daña a los enemigos en la línea; reduce la cadencia enemiga un 15% durante 2 s."
      }
    ]
  },
  {
    "line": [
      677,
      678
    ],
    "cost": 1,
    "role": "mage",
    "moves": [
      "Confusión",
      "Psicorrayo",
      "Psíquico"
    ],
    "entry": "Vista Lince · Meowstic",
    "passive": [
      "mana",
      25,
      "Empieza con 25 de maná adicional."
    ],
    "skills": [
      {
        "type": "psychic",
        "power": 1.7,
        "text": "Golpea al enemigo seleccionado."
      },
      {
        "type": "psychic",
        "power": 2,
        "shape": "line",
        "length": 3,
        "text": "Atraviesa 3 casillas y daña a los enemigos en la línea."
      },
      {
        "type": "psychic",
        "power": 2.4,
        "shape": "area",
        "radius": 1,
        "center": "target",
        "pierce": 0.25,
        "text": "Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; ignora un 25% de defensa."
      }
    ],
    "openers": [
      {
        "type": "psychic",
        "power": 0.35,
        "slow": 0.15,
        "text": "Golpea al enemigo seleccionado; reduce la cadencia enemiga un 15% durante 2 s."
      },
      {
        "type": "psychic",
        "power": 0.5,
        "slow": 0.15,
        "text": "Golpea al enemigo seleccionado; reduce la cadencia enemiga un 15% durante 2 s."
      },
      {
        "type": "psychic",
        "power": 0.65,
        "slow": 0.15,
        "text": "Golpea al enemigo seleccionado; reduce la cadencia enemiga un 15% durante 2 s."
      }
    ]
  },
  {
    "line": [
      690,
      691
    ],
    "cost": 2,
    "role": "mage",
    "moves": [
      "Ácido",
      "Bomba Lodo",
      "Pulso Dragón"
    ],
    "entry": "Adaptable · Dragalge",
    "passive": [
      "pierce",
      0.12,
      "Ignora un 12% adicional de defensa."
    ],
    "skills": [
      {
        "type": "poison",
        "power": 1.8,
        "pierce": 0.2,
        "text": "Golpea al enemigo seleccionado; ignora un 20% de defensa."
      },
      {
        "type": "poison",
        "power": 2.1,
        "shape": "area",
        "radius": 1,
        "center": "target",
        "slow": 0.2,
        "text": "Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; reduce la cadencia enemiga un 20% durante 2 s."
      },
      {
        "type": "dragon",
        "power": 2.6,
        "shape": "line",
        "length": 4,
        "pierce": 0.35,
        "text": "Atraviesa 4 casillas y daña a los enemigos en la línea; ignora un 35% de defensa."
      }
    ],
    "openers": [
      {
        "type": "poison",
        "power": 0.35,
        "shape": "area",
        "radius": 1,
        "center": "target",
        "slow": 0.15,
        "text": "Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; reduce la cadencia enemiga un 15% durante 2 s."
      },
      {
        "type": "poison",
        "power": 0.5,
        "shape": "area",
        "radius": 1,
        "center": "target",
        "slow": 0.15,
        "text": "Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; reduce la cadencia enemiga un 15% durante 2 s."
      },
      {
        "type": "poison",
        "power": 0.65,
        "shape": "area",
        "radius": 1,
        "center": "target",
        "slow": 0.15,
        "text": "Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; reduce la cadencia enemiga un 15% durante 2 s."
      }
    ]
  },
  {
    "line": [
      701
    ],
    "cost": 3,
    "role": "fighter",
    "moves": [
      "Golpe Karate",
      "Plancha Voladora",
      "A Bocajarro"
    ],
    "entry": "Liviano · Hawlucha",
    "passive": [
      "speed",
      0.12,
      "Aumenta su potencia de cadencia un 12%."
    ],
    "skills": [
      {
        "type": "fighting",
        "power": 2,
        "pierce": 0.2,
        "text": "Golpea al enemigo seleccionado; ignora un 20% de defensa."
      },
      {
        "type": "flying",
        "power": 2.5,
        "pierce": 0.3,
        "text": "Golpea al enemigo seleccionado; ignora un 30% de defensa."
      },
      {
        "type": "fighting",
        "power": 2.6,
        "shape": "area",
        "radius": 1,
        "center": "self",
        "selfShield": 0.1,
        "text": "Daña a los enemigos en un radio de 1 casilla alrededor del usuario; obtiene un escudo del 10% de su vida."
      }
    ],
    "openers": [
      {
        "type": "flying",
        "power": 0,
        "boost": 0.1,
        "selfShield": 0.08,
        "text": "obtiene un escudo del 8% de su vida; aumenta su cadencia un 10% durante 2 s."
      },
      {
        "type": "flying",
        "power": 0,
        "boost": 0.1,
        "selfShield": 0.08,
        "text": "obtiene un escudo del 8% de su vida; aumenta su cadencia un 10% durante 2 s."
      },
      {
        "type": "flying",
        "power": 0,
        "boost": 0.1,
        "selfShield": 0.08,
        "text": "obtiene un escudo del 8% de su vida; aumenta su cadencia un 10% durante 2 s."
      }
    ]
  },
  {
    "line": [
      747,
      748
    ],
    "cost": 3,
    "role": "tank",
    "moves": [
      "Púas Tóxicas",
      "Hidroariete",
      "Recuperación"
    ],
    "entry": "Regeneración · Toxapex",
    "passive": [
      "regen",
      0.008,
      "Regenera un 0,8% de vida por segundo."
    ],
    "skills": [
      {
        "type": "poison",
        "power": 1.5,
        "shape": "area",
        "radius": 1,
        "center": "self",
        "slow": 0.2,
        "text": "Daña a los enemigos en un radio de 1 casilla alrededor del usuario; reduce la cadencia enemiga un 20% durante 2 s."
      },
      {
        "type": "water",
        "power": 2.2,
        "shape": "line",
        "length": 3,
        "selfShield": 0.12,
        "text": "Atraviesa 3 casillas y daña a los enemigos en la línea; obtiene un escudo del 12% de su vida."
      },
      {
        "type": "water",
        "power": 0,
        "selfHealing": 4,
        "selfShield": 0.15,
        "selfCleanse": true,
        "text": "obtiene un escudo del 15% de su vida; se cura por el 400% del ataque; limpia sus quemaduras, ralentizaciones y aturdimientos."
      }
    ],
    "openers": [
      {
        "type": "poison",
        "power": 0,
        "selfShield": 0.1,
        "selfHealing": 0.6,
        "text": "obtiene un escudo del 10% de su vida; se cura por el 60% del ataque."
      },
      {
        "type": "poison",
        "power": 0,
        "selfShield": 0.1,
        "selfHealing": 0.6,
        "text": "obtiene un escudo del 10% de su vida; se cura por el 60% del ataque."
      },
      {
        "type": "poison",
        "power": 0,
        "selfShield": 0.1,
        "selfHealing": 0.6,
        "text": "obtiene un escudo del 10% de su vida; se cura por el 60% del ataque."
      }
    ]
  },
  {
    "line": [
      761,
      762,
      763
    ],
    "cost": 2,
    "role": "fighter",
    "moves": [
      "Hoja Afilada",
      "Pisotón",
      "Patada Tropical"
    ],
    "entry": "Presencia Regia · Tsareena",
    "passive": [
      "shield",
      0.1,
      "Empieza con un escudo del 10% de su vida."
    ],
    "skills": [
      {
        "type": "grass",
        "power": 1.7,
        "shape": "line",
        "length": 3,
        "text": "Atraviesa 3 casillas y daña a los enemigos en la línea."
      },
      {
        "type": "normal",
        "power": 2.2,
        "stun": 0.35,
        "text": "Golpea al enemigo seleccionado; aturde 0,35 s."
      },
      {
        "type": "grass",
        "power": 2.5,
        "shape": "area",
        "radius": 1,
        "center": "target",
        "slow": 0.25,
        "text": "Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; reduce la cadencia enemiga un 25% durante 2 s."
      }
    ],
    "openers": [
      {
        "type": "grass",
        "power": 0.35,
        "shape": "area",
        "radius": 1,
        "center": "self",
        "slow": 0.2,
        "text": "Daña a los enemigos en un radio de 1 casilla alrededor del usuario; reduce la cadencia enemiga un 20% durante 2 s."
      },
      {
        "type": "grass",
        "power": 0.5,
        "shape": "area",
        "radius": 1,
        "center": "self",
        "slow": 0.2,
        "text": "Daña a los enemigos en un radio de 1 casilla alrededor del usuario; reduce la cadencia enemiga un 20% durante 2 s."
      },
      {
        "type": "grass",
        "power": 0.65,
        "shape": "area",
        "radius": 1,
        "center": "self",
        "slow": 0.2,
        "text": "Daña a los enemigos en un radio de 1 casilla alrededor del usuario; reduce la cadencia enemiga un 20% durante 2 s."
      }
    ]
  },
  {
    "line": [
      736,
      737,
      738
    ],
    "cost": 1,
    "role": "mage",
    "moves": [
      "Picadura",
      "Chispa",
      "Electrocañón"
    ],
    "entry": "Carga Eléctrica · Vikavolt",
    "passive": [
      "mana",
      25,
      "Empieza con 25 de maná adicional."
    ],
    "skills": [
      {
        "type": "bug",
        "power": 1.7,
        "text": "Golpea al enemigo seleccionado."
      },
      {
        "type": "electric",
        "power": 2,
        "pierce": 0.2,
        "text": "Golpea al enemigo seleccionado; ignora un 20% de defensa."
      },
      {
        "type": "electric",
        "power": 2.8,
        "shape": "line",
        "length": 4,
        "slow": 0.2,
        "text": "Atraviesa 4 casillas y daña a los enemigos en la línea; reduce la cadencia enemiga un 20% durante 2 s."
      }
    ],
    "openers": [
      {
        "type": "electric",
        "power": 0.35,
        "shape": "line",
        "length": 3,
        "text": "Atraviesa 3 casillas y daña a los enemigos en la línea."
      },
      {
        "type": "electric",
        "power": 0.5,
        "shape": "line",
        "length": 3,
        "text": "Atraviesa 3 casillas y daña a los enemigos en la línea."
      },
      {
        "type": "electric",
        "power": 0.65,
        "shape": "line",
        "length": 3,
        "text": "Atraviesa 3 casillas y daña a los enemigos en la línea."
      }
    ]
  },
  {
    "line": [
      856,
      857,
      858
    ],
    "cost": 3,
    "role": "healer",
    "moves": [
      "Confusión",
      "Pulso Cura",
      "Brillo Mágico"
    ],
    "entry": "Espejo Mágico · Hatterene",
    "passive": [
      "shield",
      0.12,
      "Empieza con un escudo del 12% de su vida."
    ],
    "skills": [
      {
        "type": "psychic",
        "power": 1.7,
        "healing": 1.5,
        "text": "Golpea al enemigo seleccionado; cura a un aliado por el 150% del ataque."
      },
      {
        "type": "psychic",
        "power": 0,
        "healing": 3,
        "friends": 3,
        "cleanse": true,
        "text": "cura a 3 aliados por el 300% del ataque; limpia quemadura, ralentización y aturdimiento de esos aliados."
      },
      {
        "type": "fairy",
        "power": 2.2,
        "shape": "area",
        "radius": 1,
        "center": "target",
        "healing": 2,
        "friends": 3,
        "text": "Daña a los enemigos en un radio de 1 casilla alrededor del objetivo; cura a 3 aliados por el 200% del ataque."
      }
    ],
    "openers": [
      {
        "type": "fairy",
        "power": 0,
        "friendShield": 0.06,
        "friends": 3,
        "cleanse": true,
        "text": "escuda a 3 aliados con un 6% de la vida de cada receptor; limpia quemadura, ralentización y aturdimiento de esos aliados."
      },
      {
        "type": "fairy",
        "power": 0,
        "friendShield": 0.06,
        "friends": 3,
        "cleanse": true,
        "text": "escuda a 3 aliados con un 6% de la vida de cada receptor; limpia quemadura, ralentización y aturdimiento de esos aliados."
      },
      {
        "type": "fairy",
        "power": 0,
        "friendShield": 0.06,
        "friends": 3,
        "cleanse": true,
        "text": "escuda a 3 aliados con un 6% de la vida de cada receptor; limpia quemadura, ralentización y aturdimiento de esos aliados."
      }
    ]
  },
  {
    "line": [
      859,
      860,
      861
    ],
    "cost": 3,
    "role": "tank",
    "moves": [
      "Sorpresa",
      "Reflejo",
      "Pantalla de Luz"
    ],
    "entry": "Bromista · Grimmsnarl",
    "passive": [
      "mana",
      30,
      "Empieza con 30 de maná adicional."
    ],
    "skills": [
      {
        "type": "dark",
        "power": 1.8,
        "stun": 0.3,
        "text": "Golpea al enemigo seleccionado; aturde 0,3 s."
      },
      {
        "type": "psychic",
        "power": 0,
        "friendShield": 0.15,
        "friends": 3,
        "text": "escuda a 3 aliados con un 15% de la vida de cada receptor."
      },
      {
        "type": "psychic",
        "power": 0,
        "friendShield": 0.15,
        "friends": 6,
        "allyMana": 10,
        "text": "escuda a 6 aliados con un 15% de la vida de cada receptor; da 10 de maná a 6 aliados."
      }
    ],
    "openers": [
      {
        "type": "fairy",
        "power": 0,
        "friendShield": 0.04,
        "friends": 6,
        "text": "escuda a 6 aliados con un 4% de la vida de cada receptor."
      },
      {
        "type": "fairy",
        "power": 0,
        "friendShield": 0.05,
        "friends": 6,
        "text": "escuda a 6 aliados con un 5% de la vida de cada receptor."
      },
      {
        "type": "fairy",
        "power": 0,
        "friendShield": 0.06,
        "friends": 6,
        "text": "escuda a 6 aliados con un 6% de la vida de cada receptor."
      }
    ]
  },
  {
    "line": [
      924,
      925
    ],
    "cost": 1,
    "role": "fighter",
    "moves": [
      "Placaje",
      "Bomba Germen",
      "Proliferación"
    ],
    "entry": "Compiescolta · Maushold",
    "passive": [
      "teamShield",
      0.03,
      "Concede al equipo un escudo del 3% de la vida de cada aliado."
    ],
    "skills": [
      {
        "type": "normal",
        "power": 1.7,
        "text": "Golpea al enemigo seleccionado."
      },
      {
        "type": "grass",
        "power": 2,
        "text": "Golpea al enemigo seleccionado."
      },
      {
        "type": "normal",
        "power": 3.1,
        "breakShield": 0.3,
        "text": "Golpea al enemigo seleccionado; rompe un 30% del escudo de cada objetivo."
      }
    ],
    "openers": [
      {
        "type": "normal",
        "power": 0,
        "allyBoost": 0.04,
        "friends": 3,
        "text": "aumenta la cadencia de 3 aliados un 4% durante 2 s."
      },
      {
        "type": "normal",
        "power": 0,
        "allyBoost": 0.06,
        "friends": 3,
        "text": "aumenta la cadencia de 3 aliados un 6% durante 2 s."
      },
      {
        "type": "normal",
        "power": 0,
        "allyBoost": 0.08,
        "friends": 3,
        "text": "aumenta la cadencia de 3 aliados un 8% durante 2 s."
      }
    ]
  },
  {
    "line": [
      935,
      937
    ],
    "cost": 4,
    "role": "fighter",
    "moves": [
      "Nitrocarga",
      "Garra Umbría",
      "Espada Lamento"
    ],
    "entry": "Armadura Fragmentada · Ceruledge",
    "passive": [
      "speed",
      0.1,
      "Aumenta su potencia de cadencia un 10%."
    ],
    "skills": [
      {
        "type": "fire",
        "power": 2,
        "burn": 0.12,
        "boost": 0.1,
        "text": "Golpea al enemigo seleccionado; aumenta su cadencia un 10% durante 2 s; quema durante 3 s con un 12% del ataque por segundo."
      },
      {
        "type": "ghost",
        "power": 2.5,
        "pierce": 0.4,
        "text": "Golpea al enemigo seleccionado; ignora un 40% de defensa."
      },
      {
        "type": "fire",
        "power": 2.8,
        "selfDrain": 0.5,
        "text": "Golpea al enemigo seleccionado; se cura un 50% del daño efectivo causado."
      }
    ],
    "openers": [
      {
        "type": "fire",
        "power": 0,
        "selfShield": 0.12,
        "boost": 0.08,
        "text": "obtiene un escudo del 12% de su vida; aumenta su cadencia un 8% durante 2 s."
      },
      {
        "type": "fire",
        "power": 0,
        "selfShield": 0.12,
        "boost": 0.08,
        "text": "obtiene un escudo del 12% de su vida; aumenta su cadencia un 8% durante 2 s."
      },
      {
        "type": "fire",
        "power": 0,
        "selfShield": 0.12,
        "boost": 0.08,
        "text": "obtiene un escudo del 12% de su vida; aumenta su cadencia un 8% durante 2 s."
      }
    ]
  }
]);
  EXPANSION.push(...[
  {
    "line": [
      610,
      611,
      612
    ],
    "cost": 2,
    "role": "fighter",
    "moves": [
      "Garra Dragón",
      "Danza Dragón",
      "Enfado"
    ],
    "entry": "Rompemoldes · Haxorus",
    "passive": [
      "pierce",
      0.2,
      "Adaptación TFT: ignora un 20% de defensa; no anula habilidades rivales."
    ],
    "skills": [
      {
        "type": "dragon",
        "power": 2.1,
        "pierce": 0.25,
        "text": "Golpea al objetivo e ignora un 25% de defensa."
      },
      {
        "type": "dragon",
        "power": 1.8,
        "boost": 0.2,
        "selfShield": 0.1,
        "text": "Golpea al objetivo, obtiene un escudo del 10% de su vida y aumenta su cadencia un 20% durante 2 s."
      },
      {
        "type": "dragon",
        "power": 3.2,
        "shape": "area",
        "center": "self",
        "radius": 1,
        "pierce": 0.3,
        "text": "Golpea a los enemigos a 1 casilla del usuario e ignora un 30% de defensa."
      }
    ],
    "openers": [
      {
        "type": "dragon",
        "power": 0.6,
        "pierce": 0.35,
        "breakShield": 0.2,
        "text": "golpea al objetivo ignorando un 35% de defensa y elimina un 20% de su escudo."
      },
      {
        "type": "dragon",
        "power": 0.8,
        "pierce": 0.35,
        "breakShield": 0.30000000000000004,
        "text": "golpea al objetivo ignorando un 35% de defensa y elimina un 30% de su escudo."
      },
      {
        "type": "dragon",
        "power": 1.0,
        "pierce": 0.35,
        "breakShield": 0.4,
        "text": "golpea al objetivo ignorando un 35% de defensa y elimina un 40% de su escudo."
      }
    ]
  },
  {
    "line": [
      696,
      697
    ],
    "cost": 3,
    "role": "fighter",
    "moves": [
      "Mordisco",
      "Triturar",
      "Testarazo"
    ],
    "entry": "Mandíbula Fuerte · Tyrantrum",
    "passive": [
      "attack",
      0.1,
      "Adaptación TFT: aumenta su daño un 10%."
    ],
    "skills": [
      {
        "type": "dark",
        "power": 2,
        "stun": 0.3,
        "text": "Muerde al objetivo y lo aturde durante 0,3 s."
      },
      {
        "type": "dark",
        "power": 2.6,
        "pierce": 0.4,
        "text": "Muerde al objetivo e ignora un 40% de defensa."
      },
      {
        "type": "rock",
        "power": 3.6,
        "push": 1,
        "stun": 0.5,
        "text": "Golpea al objetivo, lo empuja 1 casilla si hay espacio y lo aturde durante 0,5 s."
      }
    ],
    "openers": [
      {
        "type": "dark",
        "power": 0.7,
        "stun": 0.25,
        "text": "muerde al objetivo y lo aturde durante 0.25 s."
      },
      {
        "type": "dark",
        "power": 0.8999999999999999,
        "stun": 0.35,
        "text": "muerde al objetivo y lo aturde durante 0.35 s."
      },
      {
        "type": "dark",
        "power": 1.1,
        "stun": 0.45,
        "text": "muerde al objetivo y lo aturde durante 0.45 s."
      }
    ]
  }
]);
  // Final-form tactical reworks; lower stages retain their learning moves.
  const rework=(family,index,text)=>{EXPANSION.find(f=>f.line[0]===family).skills[index].text=text;};
  rework(924,2,'Proliferación: 10 impactos de 55% del ataque en tres pulsos (3/3/4). Sustituye básicos y no genera maná. Continúa sobre enemigos cercanos al caer la presa; aturdirse o quedar fuera de alcance pierde los impactos de ese pulso.');
  rework(679,2,'Cambio Táctico: Escudo Real concede protección del 30% de la vida. En el siguiente pulso de ataque, Forma Filo consume la mitad del escudo restante para potenciar una estocada que ignora 50% de defensa. Aturdirse retrasa la estocada.');
  rework(661,2,'Pájaro Osado: vuela hasta una casilla libre junto al enemigo más lejano, golpea a los enemigos a 1 casilla del aterrizaje con 280% del ataque e ignora 30% de defensa. Pierde 10% de su vida máxima por retroceso, sin debilitarse.');
  rework(656,2,'Shuriken de Agua atraviesa 4 casillas e ignora 25% de defensa. Greninja puede recorrer hasta dos casillas por pulso de movimiento, también al retirarse; respeta obstáculos y alcance.');
  DEFINITIONS.push(...EXPANSION.map(f=>[f.line,f.cost,f.role,f.moves]));
  const ROSTER = DEFINITIONS.map(([line,cost,role,moves]) => ({dex:line[0],line,cost,role,moves,move:moves[0]}));
  for(const f of ROSTER)f.bossOnly=f.dex===384;
  const PLAYABLE_ROSTER=ROSTER.filter(f=>!f.bossOnly);
  const BOSS_DEFINITIONS=[
    {dex:144,line:[144],cost:5,role:'mage',moves:['Rayo Hielo','Ventisca','Ventisca'],source:131,name:'Presión Glacial'},
    {dex:145,line:[145],cost:5,role:'mage',moves:['Impactrueno','Chispazo','Trueno'],source:179,name:'Presión Eléctrica'},
    {dex:146,line:[146],cost:5,role:'mage',moves:['Ascuas','Lanzallamas','Llamarada'],source:37,name:'Fuego Legendario'},
    {dex:382,line:[382],cost:5,role:'tank',moves:['Pistola Agua','Hidropulso','Hidrobomba'],source:54,name:'Llovizna Ancestral'},
    {dex:383,line:[383],cost:5,role:'tank',moves:['Lanzarrocas','Terratemblor','Terremoto'],source:74,name:'Sequía Ancestral'}
  ];
  const BY = {};
  for(const family of ROSTER) for(const [stage,dex] of family.line.entries())
    BY[dex]={...family,dex,stage,move:family.moves[stage]};
  for(const f of BOSS_DEFINITIONS)BY[f.dex]={...f,stage:0,move:f.moves[0],bossOnly:true};
  const evolvedDex=(dex,star)=>BY[dex].line[Math.min(star-1,BY[dex].line.length-1)];
  const moveFor=u=>isMega(u)?MEGAS[u.dex].move:u.dex===635?'Tres Cabezas':u.dex===373?'Vuelo Rasante':u.dex===376?'Levitación Magnética':u.dex===214?'Llave de Relevo':u.dex===254?'Danza de Hojas':u.dex===395?'Rompeolas':u.dex===212?'Puño Bala':u.dex===94?'Emboscada Sombría':BY[u.dex].moves[u.star-1];
  const DEFAULT_DECK=[1,4,7,172,92,280,529,246,374,661];
  function validDeck(deck,legacy=false) {
    return Array.isArray(deck)&&deck.length===10&&new Set(deck).size===10&&
      deck.every(d=>Number.isInteger(d)&&ROSTER.some(f=>f.dex===d)&&(legacy||!BY[d].bossOnly));
  }
  function migrateDeck(deck) {
    if(!validDeck(deck,true))return null;
    const next=deck.filter(d=>!BY[d].bossOnly);
    for(const d of [...DEFAULT_DECK,...PLAYABLE_ROSTER.map(f=>f.dex)])if(next.length<10&&!next.includes(d))next.push(d);
    return next;
  }
  const XP = [0,0,0,0,6,12,20]; // cost to reach levels 4, 5, 6
  const ODDS = {3:[75,25,0,0,0],4:[50,35,15,0,0],5:[30,35,25,10,0],6:[20,25,30,20,5]};
  function create(seed = Date.now(),deck) {
    if(deck!==undefined&&!validDeck(deck))throw new Error('Elige exactamente 10 líneas distintas.');
    const s = {seed:seed>>>0,nextId:1,round:1,life:5,gold:10,level:3,xp:0,
      deck:deck?deck.slice():PLAYABLE_ROSTER.map(p=>p.dex),recordId:String(seed>>>0),completed:0,totals:[],history:[],effects:[],units:[],shop:[],locked:false,phase:'planning',battle:null,result:null,wins:0,streak:0};
    reroll(s,true);prepareEnemy(s); return s;
  }
  function random(s) { s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0; return s.seed/4294967296; }
  const TRAINING_COSTS=[3,4,5,6,7,8];
  const MEGAS={260:{name:'Mega Swampert',move:'Diluvio Sísmico',type:'water',description:'Lanza dos frentes de inundación en direcciones opuestas, de tres casillas de ancho. Avanzan en pulsos de movimiento; cada frente golpea una vez por enemigo (180%) y empuja una casilla libre. Sus básicos salpican a enemigos adyacentes a la presa (35%).'},257:{name:'Mega Blaziken',move:'Relevos Ígneos',type:'fire',description:'Salta sucesivamente junto a hasta tres enemigos distintos a distancia 4 con casillas libres y les da una patada (160%) que quema durante 3 segundos. Impulso: cada básico gana 10% de potencia y maná, hasta 50%; aturdirlo reinicia la acumulación.'},248:{name:'Mega Tyranitar',move:'Rey de la Tormenta',type:'rock',description:'Mientras pueda actuar, su arena de radio 2 obliga a enemigos dentro a seleccionar objetivos dentro de esa misma tormenta para sus básicos. Cada pulso de movimiento daña dentro (25%). Su habilidad atrae una casilla a enemigos a distancia 3 si hay espacio, rompe sus escudos y golpea (220%). Los jefes no se desplazan.'},959:{name:'Mega Tinkaton',move:'Martillo Cataclísmico',type:'steel',description:'Prepara un martillazo de radio 2 (450%) que destruye escudos; deja una réplica (150%) en el siguiente pulso de ataque. Mantiene recuperación y puede ser interrumpida antes del primer golpe.'},47:{name:'Mega Parasect',move:'Red Fúngica',type:'ghost',description:'Infecta hasta tres enemigos a alcance 3. En cada pulso de movimiento drena 35% del ataque y cura al aliado más herido a distancia 2 de cada víctima. Cada infectado muerto propaga una sola vez a dos enemigos a distancia 2. Sin acumulación de marcas del mismo Parasect.'}};
  Object.assign(MEGAS,{
    214:{name:'Mega Heracross',move:'Batería Rompeasedios',type:'bug',description:'Artillería de alcance 3: dispara cinco impactos del 85% del ataque en un cono. Reparte los tiros entre enemigos vivos de la zona; los sobrantes se concentran en los supervivientes. Ignora 50% de defensa. El quinto duplica su daño si esa presa recibió al menos tres impactos de la ráfaga. Retrocede si se le acercan.'},
    282:{name:'Mega Gardevoir',move:'Coro Protector',type:'fairy',description:'Cura a dos aliados por 300% del ataque y los escuda con 15% de su vida; una onda de Hada daña a enemigos a 2 casillas (180%) y ralentiza 25%. Rescate conserva un uso por combate y prepara una Contravoz en el siguiente pulso de ataque: golpea con 220% alrededor del punto de llegada, empuja una casilla sin mover jefes y escuda a aliados próximos. Aturdirla interrumpe la Contravoz.'},
    530:{name:'Mega Excadrill',move:'Taladro Rompefilas',type:'ground',description:'Prepara una perforación recta de hasta 5 casillas y la ejecuta en el siguiente pulso de ataque. Atraviesa enemigos con 280% del ataque, ignora 50% de defensa y reduce a la mitad la curación recibida durante 3 segundos. Termina en la última casilla libre; los aliados bloquean el túnel. Aturdirlo cancela la preparación. Los enemigos pueden salir de la trayectoria.'},
    154:{name:'Mega Meganium',move:'Jardín Solar',type:'grass',description:'Dispara cuatro rayos cardinales de alcance 4 (150% del ataque) que ralentizan 25% durante 2 segundos. Limpia quemaduras, ralentizaciones y aturdimientos de aliados a 2 casillas. Deja un jardín fijo de radio 2 durante cuatro pulsos de movimiento: cura a los dos aliados más heridos por 75% del ataque por pulso. Aturdida pierde el pulso; al caer cesa el jardín. Planta/Hada.'}
  });
  const promotion=u=>u.promotion||0;
  const isMega=u=>promotion(u)===7&&!!MEGAS[u.dex];
  const typesFor=u=>isMega(u)&&u.dex===47?['bug','ghost']:isMega(u)&&u.dex===154?['grass','fairy']:G.DEX_BY[u.dex].types;
  const nameFor=u=>isMega(u)?MEGAS[u.dex].name:G.DEX_BY[u.dex].name;
  const maxPromotion=u=>MEGAS[u.dex]?7:6;
  const maxed=u=>promotion(u)>=maxPromotion(u);
  const rank=u=>u.star+promotion(u);
  const rankLabel=u=>isMega(u)?'Iridio ★':['Bronce','Plata','Oro'][Math.floor((rank(u)-1)/3)]+' '+ '★'.repeat((rank(u)-1)%3+1);
  const rankColor=u=>isMega(u)?'#e6dcff':['#cd9567','#d7e3ed','#ffda6b'][Math.floor((rank(u)-1)/3)];
  const unitCopies=u=>3**(u.star-1)+TRAINING_COSTS.slice(0,promotion(u)).reduce((a,b)=>a+b,0)+(isMega(u)?3:0)+(u.training||0);
  const trainingLabel=u=>u.star<3?'Tres copias para evolucionar':isMega(u)?'Máximo · Iridio ★ · '+nameFor(u):promotion(u)===6?(MEGAS[u.dex]?`Megaevolución: ${u.training||0}/3 copias`:'Máximo · Oro ★★★'):`Entrenamiento ${u.training||0}/${TRAINING_COSTS[promotion(u)]} copias · siguiente rango`;
  function roll(s,available) {
    if(!available.length)return null;
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
    const available=PLAYABLE_ROSTER.filter(p=>s.deck.includes(p.dex)&&!s.units.some(u=>BY[u.dex].line[0]===p.dex&&maxed(u)));
    if(!available.length){if(free){s.shop=Array(5).fill(null);return true;}return false;}
    if(!free)s.gold-=2;
    const counts=new Map();s.shop=[];
    for(let i=0;i<5;i++) {
      const options=available.filter(p=>(counts.get(p.dex)||0)<2);
      const dex=roll(s,options);s.shop.push(dex);if(dex)counts.set(dex,(counts.get(dex)||0)+1);
    }
    return true;
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
    const dex=s.shop[index], def=BY[dex]; if(!def||def.bossOnly||!s.deck.includes(def.line[0])||s.gold<def.cost)return false;
    const trained=s.units.filter(u=>BY[u.dex].line[0]===dex&&u.star===3).sort((a,b)=>promotion(b)-promotion(a)||a.id-b.id)[0];
    if(trained) {
      if(maxed(trained))return false;
      s.gold-=def.cost;s.shop[index]=null;trained.training=(trained.training||0)+1;
      if(trained.training>=(promotion(trained)===6?3:TRAINING_COSTS[promotion(trained)])) {
        trained.training=0;trained.promotion=promotion(trained)+1;
        s.effects.push({kind:'evolve',id:trained.id,fromDex:trained.dex,toDex:trained.dex,star:3,promotion:trained.promotion,ttl:1.6});
        if(maxed(trained))s.shop=s.shop.map(d=>d===dex?null:d);
      }
      return true;
    }
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
    s.gold=Math.min(999999999999,s.gold+BY[u.dex].cost*unitCopies(u));s.units=s.units.filter(v=>v!==u);return true;
  }
  function gainXP(s,n) { s.xp+=n;while(s.level<6&&s.xp>=XP[s.level+1]) {s.xp-=XP[s.level+1];s.level++;}if(s.level===6)s.xp=0; }
  function buyXP(s) {if(!planning(s)||s.level>=6||s.gold<4)return false;s.gold-=4;gainXP(s,4);return true;}
  function traits(units) {
    const counts={};const seen=new Set();
    for(const u of units) {
      const family=BY[u.dex].line[0];
      for(const t of typesFor(u)) {
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
  const THEMES=[
    {name:'Enjambre',pool:[13,27,285,123,650,810]},
    {name:'Vanguardia',pool:[32,58,60,66,298,529,443,661]},
    {name:'Artillería',pool:[4,172,179,37,653,816,479,607]},
    {name:'Bastión',pool:[7,194,74,821,304,597,679,884,4,172,607]},
    {name:'Expedición',pool:[1,4,7,32,58,66,172,173,280,529,258,661]}
  ];
  const BOSS_ROTATION=[144,145,146,382,383,384];
  function waveInfo(round) {
    const boss=round%10===0,elite=!boss&&round%5===0,theme=THEMES[(round-1)%THEMES.length];
    const dex=boss?BOSS_ROTATION[(Math.floor(round/10)-1)%BOSS_ROTATION.length]:null;
    return {kind:boss?'boss':elite?'elite':'normal',name:boss?'Jefe · '+G.DEX_BY[dex].name:elite?'Oleada especial · '+theme.name:theme.name,bossDex:dex};
  }
  function enemyTeam(s) {
    const info=waveInfo(s.round),boss=info.kind==='boss',elite=info.kind==='elite';
    const n=boss?1:Math.min(6,2+Math.floor((s.round-1)/3)+(elite?1:0)),cap=Math.min(4,1+Math.floor((s.round-1)/3));
    const theme=THEMES[(s.round-1)%THEMES.length],pool=PLAYABLE_ROSTER.filter(p=>p.cost<=cap&&theme.pool.includes(p.dex));
    const units=[],positions=[7,9,6,10,1,3];let healers=0,tanks=0;
    for(let i=0;i<n;i++) {
      const isBoss=boss&&i===0,star=isBoss?(s.round>=30?3:2):s.round>=12?(i<Math.max(0,1+Math.floor((s.round-25)/6))?3:2):s.round>=6&&i<1+Math.floor((s.round-6)/2)?2:1;
      const healing=p=>p.role==='healer'||aiFor(evolvedDex(p.dex,star))==='healer';
      const tank=p=>p.role==='tank'||['tank','guardian'].includes(aiFor(evolvedDex(p.dex,star)));
      const allowed=p=>(healers<1||!healing(p))&&(tanks<2||!tank(p));
      // Keep the theme when possible; its cheapest tier can contain only tanks.
      const themed=pool.filter(allowed),options=themed.length?themed:PLAYABLE_ROSTER.filter(p=>p.cost<=cap&&allowed(p));
      const f=options[Math.floor(random(s)*options.length)],dex=isBoss?info.bossDex:f.dex;
      if(healing(BY[dex]))healers++;if(tank(BY[dex]))tanks++;
      units.push({id:-(i+1),dex:evolvedDex(dex,star),star,pos:isBoss?8:positions[i],boss:isBoss,elite});
    }
    return units;
  }
  // Cache once: scouting, shopping and formation never consume encounter RNG.
  function prepareEnemy(s) {s.opponent=enemyTeam(s);s.opponentRound=s.round;s.encounter=waveInfo(s.round);s.balanceVersion=2;}
  function scout(s) {return (s.opponent||[]).map(u=>({...u}));}
  const ENTRANCES={
    1:['Espesura','regen',.008,'Regenera un 0,8% de vida por segundo.'],
    4:['Mar Llamas','attack',.08,'Aumenta su daño un 8%.'],
    7:['Caparazón','shield',.15,'Empieza con un escudo del 15% de su vida.'],
    172:['Electricidad Estática','mana',25,'Empieza con 25 de maná adicional.'],
    92:['Cuerpo Maldito','pierce',.1,'Ignora un 10% adicional de defensa.'],
    280:['Velo Protector','teamShield',.05,'Concede a cada aliado un escudo del 5% de la vida de ese aliado.'],
    529:['Entrada Sísmica','seismic',0,'Perfora y provoca un temblor al entrar.'],
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
  const ACTIVE_ENTRANCES={
    4:{name:'Aliento Inicial',mode:'flame',type:'fire',range:[3,3,4],power:[.6,.75,.9],text:'Lanza fuego en un cono de 3/3/4 casillas y quema a los enemigos alcanzados durante 2 segundos.'},
    7:{name:'Oleada Inicial',mode:'water',type:'water',range:[3,3,3],power:[.6,.75,.9],text:'Dispara agua al enemigo más cercano a un máximo de 3 casillas y lo empuja 1 casilla libre. En ★★/★★★ alcanza también sus vecinos.'},
    172:{name:'Chispa Paralizante',mode:'spark',type:'electric',range:[3,3,3],power:[.45,.6,.75],text:'Golpea al enemigo más cercano a un máximo de 3 casillas y lo aturde 0,25/0,35/0,45 segundos según las estrellas.'},
    92:{name:'Sombra Acechante',mode:'shadow',type:'ghost',range:[4,4,4],power:[.6,.75,.9],text:'Golpea al enemigo más cercano a un máximo de 4 casillas y reduce un 25% su cadencia durante 2 segundos.'},
    280:{name:'Barrera de Entrada',mode:'barrier',type:'fairy',shield:[.05,.07,.09],text:'Añade un escudo del 5/7/9% de la vida del receptor a los 2 aliados más vulnerables según las estrellas.'},
    374:{name:'Impacto Meteórico',mode:'meteor',type:'steel',range:[3,3,3],power:[.6,.7,.8],text:'Golpea al enemigo más cercano a un máximo de 3 casillas y lo aturde 0,25/0,35/0,5 segundos. En ★★/★★★ alcanza sus vecinos.'},
    131:{name:'Velo Aurora',mode:'veil',type:'ice',shield:[.04,.05,.06],text:'Añade a todos los aliados un escudo del 4/5/6% de la vida de cada receptor según las estrellas.'},
    246:{name:'Tormenta de Arena',mode:'sand',type:'rock',range:[2,2,3],power:[.6,.75,.9],text:'Daña a los enemigos en un radio de 2/2/3 casillas alrededor del usuario y reduce un 20% su cadencia durante 2 segundos.'},
    258:{name:'Oleada Lodosa',mode:'mud',type:'water',range:[3,3,3],power:[.55,.7,.85],text:'Lanza lodo al enemigo más cercano a un máximo de 3 casillas y reduce un 20% su cadencia durante 2 segundos. En ★★/★★★ alcanza sus vecinos.'}
  };
  for(const f of EXPANSION){
    ENTRANCES[f.line[0]]=[f.entry,...f.passive];
    ACTIVE_ENTRANCES[f.line[0]]={name:f.entry,mode:'tactic',type:f.openers[0].type,range:[3,3,4],ranks:f.openers};
  }
  for(const f of BOSS_DEFINITIONS){
    ENTRANCES[f.dex]=[f.name,'shield',.12,'Empieza con un escudo del 12% de su vida.'];
    const source={144:131,145:172,146:4,382:7,383:258}[f.dex];
    ACTIVE_ENTRANCES[f.dex]={...ACTIVE_ENTRANCES[source],name:f.name};
  }
  function entranceFor(u) {
    if(u.dex===212)return {name:'Experto',effect:'technician',value:.5,description:'Potencia un 50% los golpes de baja potencia de Puño Bala. La prioridad se activa durante su ráfaga de tres pulsos; respeta alcance y aturdimientos.'};
    if(BY[u.dex].line[0]===129&&u.star===1)return {name:'Salpicadura Prudente',effect:'shield',value:.2,description:'Magikarp empieza con un escudo del 20% de su vida. Al evolucionar a Gyarados gana Mirada Intimidante y una oleada que empuja enemigos.'};
    const entry=ENTRANCES[BY[u.dex].line[0]];
    if(entry[1]==='seismic') {
      const radius=u.star===3?2:1,duration=[.5,.6,.8][u.star-1];
      return {name:'Entrada Sísmica',effect:'seismic',radius,duration,control:true,active:true,
        description:(u.star===1?'Provoca un temblor alrededor del usuario.':'Perfora hasta 3 casillas en dirección al enemigo más cercano y provoca un temblor al aterrizar. No atraviesa aliados ni ocupa casillas bloqueadas.')+` Daña a los enemigos en un radio de ${radius} casilla${radius===1?'':'s'} y los aturde ${String(duration).replace('.',',')} segundos. Se activa una vez al comenzar el combate y solo aturde a enemigos; los aliados siguen actuando.`};
    }
    const base={name:entry[0],effect:entry[1],value:entry[2],description:entry[3]},active=ACTIVE_ENTRANCES[BY[u.dex].line[0]];
    return active?{...base,...active,tactic:active.ranks?.[u.star-1],name:active.name,active:true,mode:active.mode,type:active.type,range:active.range?.[u.star-1],power:active.power?.[u.star-1],shield:active.shield?.[u.star-1],description:base.description+' '+(active.ranks?.[u.star-1]?.text||active.text)+(active.ranks?.[u.star-1]?.power>0?' Alcance inicial: '+active.range[u.star-1]+' casillas.':'')+' Se activa una sola vez al comenzar el combate, sin pausar al equipo.'}:base;
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
      else if(e.effect==='thorns')a.thorns=e.value;
      else if(e.effect==='gale')a.galeWings=true;
      else if(e.effect==='intimidate'&&!intimidated.has(a.side)) {
        intimidated.add(a.side);for(const foe of b.units.filter(u=>u.side!==a.side))foe.attack*=1-e.value;
      }
      b.events.push({kind:'entrance',from:a.id,move:e.name,ttl:1.2});
    }
    // Resolve support openers before offensive entries on either team.
    const support=a=>{const e=entranceFor(a);return ['barrier','veil'].includes(e.mode)||e.tactic?.power===0;};
    for(const a of b.units)if(support(a))activeEntrance(b,a);
    for(const a of b.units) {
      if(a.hp<=0)continue;
      const e=entranceFor(a);
      if(e.effect==='seismic'){
        const target=selectTarget(b,a);if(!target)continue;
        if(a.star>=2)drill(b,a,target,a.attack*.8);
        shock(b,a,e.radius,e.duration,a.attack*.6);
        b.events.push({kind:'entryCast',from:a.id,move:e.name,type:'ground',sx:a.x,sy:a.y,tx:target.x,ty:target.y,ttl:.8});
      } else if(e.active&&!support(a))activeEntrance(b,a);
    }
  }
  function areaEvent(b,a,center,radius,type,victims,control=false) {
    b.events.push({kind:'area',from:a.id,x:center.x,y:center.y,radius,type,control,
      targets:victims.map(u=>u.id),cells:victims.map(u=>u.y*COLS+u.x),ttl:.6});
  }
  function activeEntrance(b,a) {
    const e=entranceFor(a),foes=b.units.filter(u=>u.side!==a.side&&u.hp>0&&!u.shadowed);
    let target;
    if(e.mode==='tactic'){
      target=e.tactic.power===0?a:foes.sort((x,y)=>distance(a,x)-distance(a,y)||x.id-y.id)[0];
      if(!target||e.tactic.power>0&&distance(a,target)>e.range)return;
      familyCast(b,a,target,e.tactic);
    } else if(e.mode==='barrier'||e.mode==='veil'){
      const friends=b.units.filter(u=>u.side===a.side&&u.hp>0).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp||x.armor-y.armor||x.maxHp-y.maxHp||x.id-y.id);
      for(const ally of friends.slice(0,e.mode==='veil'?6:2))shield(b,a,ally,ally.maxHp*e.shield);
      target=a;
    } else {
      target=foes.sort((x,y)=>distance(a,x)-distance(a,y)||x.id-y.id)[0];
      if(!target||distance(a,target)>e.range)return;
      let victims=[target];
      if(e.mode==='flame'){
        const dx=target.x-a.x,dy=target.y-a.y,len=Math.hypot(dx,dy)||1;
        victims=foes.filter(t=>{const x=t.x-a.x,y=t.y-a.y,d=Math.hypot(x,y)||1;return distance(a,t)<=e.range&&(x*dx+y*dy)/(len*d)>=.65;});
      } else if(e.mode==='sand')victims=foes.filter(t=>distance(a,t)<=e.range);
      else if(['water','meteor','mud'].includes(e.mode)&&a.star>=2)victims=foes.filter(t=>distance(target,t)<=1);
      if(e.mode==='sand'||['water','meteor','mud'].includes(e.mode))areaEvent(b,a,e.mode==='sand'?a:target,e.mode==='sand'?e.range:a.star>=2?1:0,e.type,victims,e.mode==='meteor');
      const control=e.mode==='spark'?[.25,.35,.45][a.star-1]:e.mode==='meteor'?[.25,.35,.5][a.star-1]:0;
      victims.sort((x,y)=>distance(a,y)-distance(a,x));
      for(const t of victims){
        hit(b,a,t,a.attack*e.power,true,e.type);
        if(t.hp<=0)continue;
        if(control)stun(b,a,t,control);
        if(e.mode==='flame')burn(b,a,t,2,a.attack*.12);
        if(e.mode==='water')push(b,a,t,1);
        if(['shadow','sand','mud'].includes(e.mode)){
          t.slowPower=Math.max(t.slowUntil>b.time?t.slowPower||0:0,e.mode==='shadow'?.25:.2);t.slowUntil=b.time+2;
        }
      }
    }
    b.events.push({kind:'entryCast',from:a.id,move:e.name,type:e.type,to:target.id,sx:a.x,sy:a.y,tx:target.x,ty:target.y,ttl:.8});
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
  function targetAllowed(b,a,t){
    return b.units.filter(u=>u.hp>0&&isMega(u)&&u.dex===248&&u.side!==a.side&&!isStunned(b,u)&&!u.shadowed&&distance(a,u)<=2).every(storm=>distance(t,storm)<=2);
  }
  function selectTarget(b,a) {
    const foes=b.units.filter(u=>u.side!==a.side&&u.hp>0&&!u.shadowed&&targetAllowed(b,a,u));
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
    const foes=b.units.filter(u=>u.side!==a.side&&u.hp>0&&!u.shadowed);
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
    const p=G.DEX_BY[u.dex],def=BY[u.dex],power=1.8**(u.star-1)*1.18**promotion(u),ai=aiFor(u.dex);
    const f={...u,side,x:u.pos%COLS,y:Math.floor(u.pos/COLS),types:typesFor(u),role:def.role,
      ai,maxHp:(def.role==='tank'?480:330)*(1+def.cost*.1)*power,
      attack:(35+def.cost*9)*power,armor:def.role==='tank'?40:20,
      interval:Math.max(.65,1.35-(p.spd-90)/100),range:['ranged','healer'].includes(ai)?3:1,
      damageDone:0,damageTaken:0,blocked:0,kills:0,healingDone:0,shieldingDone:0,mana:0,manaGain:0,regen:0,pierce:0,slow:0,shield:0,cooldown:.2,moveCD:0,flash:0};
    for(const type of f.types) {
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
    if(side===1) {
      f.maxHp*=(1+(round-1)*.025)*(u.boss?3.5:u.elite?1.18:1);
      f.attack*=(1+(round-1)*.015)*(u.boss?1.15:u.elite?1.1:1);
      if(def.role==='tank'||['tank','guardian'].includes(ai))f.attack*=.8;
    }
    if(def.line[0]===661)f.basicType='flying';
    if(isMega(u)){f.maxHp*=1.15;f.attack*=1.15;if(u.dex===47)f.types=['bug','ghost'];if(u.dex===214){f.ai='ranged';f.range=3;}}
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
      'Perfora hasta 3 casillas y acaba en una casilla libre. El aterrizaje golpea en un radio de 1 casilla y aturde 0,6 segundos.',
      'Perfora la línea y provoca una onda de Tierra en un radio de 2 casillas alrededor del aterrizaje; aturde 0,8 segundos.']},
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
  const SPECIAL_FAMILIES=new Set([133,447,131,246,258,384,371,957,...EXPANSION.map(f=>f.line[0])]);
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
  for(const f of EXPANSION)FAMILY_MOVES[f.line[0]]=f.skills;
  for(const f of BOSS_DEFINITIONS)FAMILY_MOVES[f.dex]=FAMILY_MOVES[f.source].map(m=>({...m}));
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
    if(isMega(u))return {name:MEGAS[u.dex].move,type:MEGAS[u.dex].type,description:MEGAS[u.dex].description,signature:true,special:true,area:true};
    const tactical={
      635:{type:'dragon',description:'Tres Cabezas: fija hasta tres presas dentro de alcance 3 durante dos pulsos de ataque. Cada cabeza golpea con 80% del ataque; las cabezas sin presa ayudan contra las restantes. Si una presa cae o sale de alcance, la cabeza busca otra. Sustituye básicos, sin maná ofensivo; el aturdimiento consume el pulso.'},
      373:{type:'flying',description:'Vuelo Rasante: marca una trayectoria recta hacia su presa y prepara la pasada sin moverse. En el próximo pulso de ataque golpea la línea con 300% del ataque y aterriza en la última casilla libre de la trayectoria. No desplaza aliados ni enemigos; un aturdimiento cancela la pasada.'},
      376:{type:'steel',description:'Levitación Magnética: levanta al rival adyacente hasta el siguiente pulso de ataque; ambos dejan de atacar y moverse. Lo estrella hasta dos casillas más allá si encuentra espacio, causando 260% del ataque en radio 1. Los jefes reciben el impacto sin levantarse. Aturdir o derrotar a Metagross libera a la presa sin golpe.'},
      214:{type:'fighting',description:'Llave de Relevo: golpea a un enemigo adyacente con 200/240/280% del ataque según la etapa y lo lanza a la casilla opuesta detrás de Heracross si está libre. No lanza jefes, aliados ni objetivos fuera de alcance; sin espacio conserva el daño.'},
      254:{type:'grass',description:'Danza de Hojas: tres pulsos de ataque sustituyen sus básicos. Hoja Aguda (130%) intenta un flanqueo lateral; el segundo corte (160%) intenta rodear por detrás y sólo perfora 40% de defensa si lo consigue; termina con Lluevehojas (240%) en cono de alcance 3. Los rodeos requieren dos pasos libres; aturdimiento o falta de alcance pierde el pulso. Sin maná ofensivo durante la secuencia.'},
      395:{type:'water',description:'Rompeolas: lanza una ola de hasta tres casillas de ancho hacia su objetivo. En cada pulso de movimiento avanza una franja después de moverse las unidades. Cada enemigo recibe como máximo un impacto del 250% del ataque por ola y es empujado una casilla libre en su dirección; los jefes reciben daño sin empuje. La ola conserva su rumbo aunque Empoleon se mueva.'},
      887:{type:'dragon',description:'Dracoflechas: dispara dos Dreepy por corredores paralelos distintos. Cada uno atraviesa al primer rival (110% del ataque); si encuentra un segundo explota allí (180% en radio 1). Si sólo encuentra uno regresa y golpea de nuevo a esa presa (160%). Ignora 40% de defensa; los aliados no reciben daño ni bloquean los proyectiles.'},
      94:{type:'ghost',description:'Emboscada Sombría: desaparece en el próximo pulso de movimiento y reaparece en el siguiente de ataque junto al enemigo con menor vida proporcional con espacio libre. Golpea con 340% del ataque; una baja devuelve 50 de maná. Aturdirlo interrumpe la emboscada y lo revela.'},
      282:{type:'fairy',description:'Cura y escuda a dos aliados. Rescate pasivo, una vez por combate: evita un golpe letal a otro aliado a 3 casillas, lo deja a 1 PV, lo teletransporta a una casilla libre detrás de Gardevoir y le da un escudo del 25% de la vida máxima del aliado rescatado. Requiere espacio y que Gardevoir pueda actuar.'},
      959:{type:'steel',description:'Martillo Colosal: marca un área de 1 casilla y prepara el golpe hasta el próximo pulso de ataque. Destruye los escudos enemigos en ella y golpea con 450% del ataque. Después pierde un pulso recuperándose. No se mueve durante la preparación; un aturdimiento interrumpe el golpe.'},
      212:{type:'steel',description:'Experto + Puño Bala: durante los tres siguientes pulsos de ataque sustituye su básico por dos golpes de Acero del 60% del ataque, potenciados un 50% por Experto y ajustados a su cadencia. Tiene prioridad; no genera maná ofensivo. Aturdirse o quedar fuera de alcance pierde el pulso.'}
    }[u.dex];
    if(tactical)return {name:moveFor(u),...tactical,signature:true,special:true,area:[959,254,395,887,373,376].includes(u.dex)};
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
  function start(s,options={}) {
    if(!planning(s)||!s.units.some(u=>u.pos!==null))return false;
    if(s.opponentRound!==s.round)prepareEnemy(s);
    const team=s.units.filter(u=>u.pos!==null),foes=scout(s);
    s.battle={intro:options.presentation&&foes.some(u=>u.boss)?2.8:0,time:0,acc:0,opening:1.2,beat:0,beatCount:0,beatStarted:0,nextBeat:.05,events:[],units:[...team.map(u=>fighter(u,0,traits(team),s.round)),
      ...foes.map(u=>fighter(u,1,traits(foes),s.round))]};
    if(!s.battle.intro)entrances(s.battle);s.phase='combat';s.result=null;return true;
  }
  function skipIntro(s){if(s.phase!=='combat'||!(s.battle.intro>0))return false;s.battle.intro=0;entrances(s.battle);return true;}
  const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
  function rescueAlly(b,t) {
    const guards=b.units.filter(g=>g.dex===282&&g!==t&&g.side===t.side&&g.hp>0&&!g.rescueUsed&&!isStunned(b,g)&&!g.shadowed&&distance(g,t)<=3)
      .sort((x,y)=>distance(x,t)-distance(y,t)||x.id-y.id);
    for(const g of guards){
      const free=[];for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
        if((g.side===0?y<=g.y:y>=g.y)||b.units.some(u=>u.hp>0&&u.x===x&&u.y===y))continue;
        free.push({x,y});
      }
      free.sort((x,y)=>distance(g,x)-distance(g,y)||distance(t,x)-distance(t,y)||x.y-y.y||x.x-y.x);
      if(!free.length)continue;
      const sx=t.x,sy=t.y;t.x=free[0].x;t.y=free[0].y;g.rescueUsed=true;
      b.events.push({kind:'rescue',from:g.id,to:t.id,sx,sy,tx:t.x,ty:t.y,type:'fairy',move:'Rescate',ttl:.8});
      return g;
    }
    return null;
  }
  function hit(b,a,t,power,spell=false,type=a.types[0],periodic=false,lowPower=false) {
    if(t.hp<=0||t.shadowed)return 0;
    if(lowPower&&a.dex===212)power*=1.5;
    const mult=G.Types?.mult?G.Types.mult(type,t.types):1;
    const damage=Math.max(1,Math.round(power*mult*100/(100+t.armor*(1-Math.min(.8,a.pierce)))));
    const absorbed=Math.min(t.shield,damage);let lost=Math.min(t.hp,damage-absorbed);
    const rescue=lost>=t.hp?rescueAlly(b,t):null;if(rescue)lost=Math.max(0,t.hp-1);
    t.shield-=absorbed;t.hp=Math.max(0,t.hp-lost);a.damageDone+=lost;t.damageTaken+=lost;t.blocked+=absorbed;if(t.hp===0&&lost>0)a.kills++;
    t.flash=.16;t.mana=Math.min(100,t.mana+8);
    if(a.slow)t.slowUntil=b.time+2,t.slowPower=a.slow;
    b.events.push({kind:spell?'spell':'hit',from:a.id,to:t.id,sx:a.x,sy:a.y,tx:t.x,ty:t.y,type,move:spell?moveFor(a):null,periodic,amount:lost,absorbed,beat:b.beat,ttl:.45});
    if(rescue){
      shield(b,rescue,t,t.maxHp*.25);
      if(isMega(rescue)){rescue.rescueWaveX=t.x;rescue.rescueWaveY=t.y;b.events.push({kind:'guardWarning',from:rescue.id,x:t.x,y:t.y,radius:2,type:'fairy',ttl:1,life:1});}
    }
    if(!spell&&!periodic&&isMega(a)&&a.dex===260){const center={x:t.x,y:t.y};for(const u of b.units.filter(u=>u!==t&&u.side!==a.side&&u.hp>0&&!u.shadowed&&distance(center,u)<=1))hit(b,a,u,power*.35,true,'water',true);}
    // Reflection is a spell marked periodic: it cannot reflect again or replay a cast.
    if(!spell&&!periodic&&lost>0&&t.thorns&&a.side!==t.side&&a.hp>0&&distance(a,t)<=1)hit(b,t,a,lost*t.thorns,true,'steel',true);
    return lost;
  }
  function heal(b,a,t,amount) {
    const added=Math.max(0,Math.min(t.maxHp-t.hp,Math.round(amount*(t.healCutUntil>b.time ? .5 : 1))));t.hp+=added;a.healingDone+=added;
    if(added)b.events.push({kind:'heal',from:a.id,to:t.id,sx:a.x,sy:a.y,tx:t.x,ty:t.y,amount:added,ttl:.6});return added;
  }
  function shield(b,a,t,amount) {
    const added=Math.max(0,Math.min(t.maxHp*.5-t.shield,Math.round(amount)));t.shield+=added;a.shieldingDone+=added;
    if(added)b.events.push({kind:'shield',from:a.id,to:t.id,sx:a.x,sy:a.y,tx:t.x,ty:t.y,amount:Math.round(added),ttl:.6});
  }
  function push(b,a,t,steps) {
    if(t.hp<=0||t.shadowed)return;
    const dx=t.x-a.x,dy=t.y-a.y;
    const vx=Math.abs(dx)>Math.abs(dy)?Math.sign(dx):0,vy=vx?0:Math.sign(dy)||1;
    for(let i=0;i<steps;i++){
      const x=t.x+vx,y=t.y+vy;
      if(x<0||x>=COLS||y<0||y>=ROWS||b.units.some(u=>u!==t&&u.hp>0&&u.x===x&&u.y===y))break;
      t.x=x;t.y=y;t.moveCD=Math.max(t.moveCD,.25);
    }
  }
  function burn(b,a,t,duration,power) {
    if(t.hp<=0||t.shadowed)return;
    if(!t.burn||power>=t.burn.power)t.burn={source:a.id,power,remaining:duration,cd:1};
    else t.burn.remaining=Math.max(t.burn.remaining,duration);
  }
  // Shared by Excadrill's entrance and mana move; never tunnels through allies.
  function drill(b,a,target,power) {
    const sx=a.x,sy=a.y,dx=target.x-sx,dy=target.y-sy,vx=Math.abs(dx)>Math.abs(dy)?Math.sign(dx):0,vy=vx?0:Math.sign(dy)||1;
    let landing={x:sx,y:sy},end={...landing};
    for(let i=1;i<=3;i++) {
      const x=sx+vx*i,y=sy+vy*i;
      if(x<0||x>=COLS||y<0||y>=ROWS||b.units.some(u=>u!==a&&u.side===a.side&&u.hp>0&&u.x===x&&u.y===y))break;
      end={x,y};for(const t of b.units.filter(u=>u.side!==a.side&&u.hp>0&&!u.shadowed&&u.x===x&&u.y===y))hit(b,a,t,power,true,'ground');
      if(!b.units.some(u=>u!==a&&u.hp>0&&u.x===x&&u.y===y))landing={x,y};
    }
    a.x=landing.x;a.y=landing.y;a.moveCD=.35;
    b.events.push({kind:'drill',from:a.id,sx,sy,tx:end.x,ty:end.y,type:'ground',ttl:.6});
  }
  function isStunned(b,u) {return u.hp>0&&(u.liftedBy!==undefined||Number.isFinite(u.stunUntil)&&u.stunUntil>b.time);}
  function stun(b,a,t,duration) {
    // One shared boundary: no CC can be applied to the caster or its allies.
    if(a.side===t.side||t.hp<=0||t.shadowed||!Number.isFinite(duration)||duration<=0)return false;
    if(t.boss)duration*=.5;
    const until=b.time+duration;
    if(until>(t.stunUntil||0)){t.stunUntil=until;t.stunSource=a.id;}
    if(t.dex===959){delete t.hammerX;delete t.hammerY;b.events=b.events.filter(e=>e.kind!=='warning'||e.from!==t.id);}
    if(t.rescueWaveX!==undefined){delete t.rescueWaveX;delete t.rescueWaveY;b.events=b.events.filter(e=>e.kind!=='guardWarning'||e.from!==t.id);}
    if(t.megaDrillDx!==undefined){delete t.megaDrillDx;delete t.megaDrillDy;b.events=b.events.filter(e=>e.kind!=='drillWarning'||e.from!==t.id);}
    if(isMega(t)&&t.dex===257)t.impulse=0;
    if(t.dex===94)delete t.ambushPending;
    if(t.dex===373){delete t.swoopDx;delete t.swoopDy;}
    if(t.dex===376)releaseLift(b,t);
    b.events.push({kind:'stun',from:a.id,to:t.id,type:'electric',sx:a.x,sy:a.y,tx:t.x,ty:t.y,ttl:duration,life:duration});
    return true;
  }
  function shock(b,a,radius,duration,power) {
    const victims=b.units.filter(u=>u.side!==a.side&&u.hp>0&&!u.shadowed&&distance(a,u)<=radius);
    areaEvent(b,a,a,radius,'ground',victims,true);
    for(const t of victims) {
      hit(b,a,t,power,true,'ground');
      stun(b,a,t,duration);
    }
  }
  function signature(b,a,target) {
    const family=BY[a.dex].line[0],rank=a.star,foes=()=>b.units.filter(u=>u.side!==a.side&&u.hp>0&&!u.shadowed);
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
        drill(b,a,target,a.attack*2.6);
        shock(b,a,rank===3?2:1,rank===3?.8:.6,a.attack*(rank===3?1.5:.6));
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
        const victims=foes().filter(t=>distance(center,t)<=1);areaEvent(b,a,center,1,'steel',victims,true);
        for(const t of victims){hit(b,a,t,a.attack*(t===target?3:1.5),true,'steel');stun(b,a,t,1);}
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
        if(rank!==2)stun(b,a,t,rank===1?.3:.6);
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
      } else {const victims=foes().filter(t=>distance(target,t)<=1);areaEvent(b,a,target,1,'psychic',victims,true);for(const t of victims){hit(b,a,t,a.attack*2.6,true,'psychic');stun(b,a,t,.8);}}
    } else return false;
    return true;
  }
  function areaCast(b,a,target) {
    const area=AREA_MOVES[moveFor(a)];if(!area)return false;
    const center=area.center==='self'?a:target;
    const victims=b.units.filter(u=>u.side!==a.side&&u.hp>0&&!u.shadowed&&distance(center,u)<=area.radius);
    areaEvent(b,a,center,area.radius,area.type,victims,!!area.stun);
    for(const t of victims){
      hit(b,a,t,a.attack*area.power,true,area.type);
      if(area.slow){t.slowUntil=b.time+2;t.slowPower=Math.max(t.slowPower||0,area.slow);}
      if(area.stun)stun(b,a,t,area.stun);
    }
    return true;
  }
  function boostCadence(b,a,power) {
    const active=a.boostUntil>b.time;
    if(active)a.interval*=1+a.boostPower;
    a.boostPower=Math.max(active?a.boostPower:0,power);
    a.interval/=1+a.boostPower;a.boostUntil=Math.max(active?a.boostUntil:0,b.time+2);
  }
  function familyCast(b,a,target,override) {
    const m=override||FAMILY_MOVES[BY[a.dex].line[0]]?.[a.star-1];if(!m)return false;
    const foes=b.units.filter(u=>u.side!==a.side&&u.hp>0&&!u.shadowed);
    const friends=b.units.filter(u=>u.side===a.side&&u.hp>0).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp||x.id-y.id).slice(0,m.friends||1);
    let victims=[target];
    if(m.shape==='area') {
      const center=m.center==='self'?a:{x:target.x,y:target.y};
      victims=foes.filter(t=>distance(center,t)<=m.radius);
      areaEvent(b,a,center,m.radius,m.type,victims,!!m.stun);
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
      if(m.stun)stun(b,a,t,m.stun);
      if(m.burn)burn(b,a,t,3,a.attack*m.burn);
      if(m.push)push(b,a,t,m.push);
    }
    a.pierce=oldPierce;
    if(m.selfShield)shield(b,a,a,a.maxHp*m.selfShield);
    if(m.selfHealing)heal(b,a,a,a.attack*m.selfHealing);
    if(m.selfDrain)heal(b,a,a,total*m.selfDrain);
    if(m.selfCleanse){a.burn=null;a.slowUntil=0;a.stunUntil=0;}
    if(m.selfMana)a.mana=Math.min(100,a.mana+m.selfMana);
    for(const ally of friends){
      if(m.healing)heal(b,a,ally,a.attack*m.healing);
      if(m.drain)heal(b,a,ally,total*m.drain/friends.length);
      if(m.friendShield)shield(b,a,ally,ally.maxHp*m.friendShield);
      if(m.allyMana)ally.mana=Math.min(100,ally.mana+m.allyMana);
      if(m.allyBoost)boostCadence(b,ally,m.allyBoost);
      if(m.cleanse){ally.burn=null;ally.slowUntil=0;ally.stunUntil=0;}
    }
    if(m.boost)boostCadence(b,a,m.boost);
    return true;
  }
  function adjacentFree(b,a,target){
    return [[0,-1],[-1,0],[1,0],[0,1]].map(([dx,dy])=>({x:target.x+dx,y:target.y+dy}))
      .filter(q=>q.x>=0&&q.x<COLS&&q.y>=0&&q.y<ROWS&&!b.units.some(u=>u!==a&&u.hp>0&&u.x===q.x&&u.y===q.y))
      .sort((x,y)=>distance(a,x)-distance(a,y)||x.y-y.y||x.x-y.x);
  }
  function cardinal(a,t){const dx=t.x-a.x,dy=t.y-a.y;return Math.abs(dx)>Math.abs(dy)?{dx:Math.sign(dx)||1,dy:0}:{dx:0,dy:Math.sign(dy)|| (a.side===0?-1:1)};}
  function freeCell(b,x,y,except=null){return x>=0&&x<COLS&&y>=0&&y<ROWS&&!b.units.some(u=>u!==except&&u.hp>0&&u.x===x&&u.y===y);}
  function flankStep(b,a,destination){
    if(!freeCell(b,destination.x,destination.y,a)||distance(a,destination)!==2)return false;
    const route=[[a.x,destination.y],[destination.x,a.y]].some(([x,y])=>distance(a,{x,y})===1&&distance({x,y},destination)===1&&freeCell(b,x,y,a));
    if(!route)return false;
    const sx=a.x,sy=a.y;a.x=destination.x;a.y=destination.y;
    b.events.push({kind:'flank',from:a.id,sx,sy,tx:a.x,ty:a.y,type:'grass',ttl:.6});return true;
  }
  function clearLeaves(a){delete a.leafPulse;delete a.leafTarget;delete a.leafDx;delete a.leafDy;}
  function advanceWaves(b){
    const kept=[];
    for(const w of b.waves||[]){
      w.step++;const x=w.x+w.dx*w.step,y=w.y+w.dy*w.step;if(x<0||x>=COLS||y<0||y>=ROWS)continue;
      const a=b.units.find(u=>u.id===w.source);if(!a)continue;
      const cells=[-1,0,1].map(i=>({x:x-w.dy*i,y:y+w.dx*i})).filter(q=>q.x>=0&&q.x<COLS&&q.y>=0&&q.y<ROWS);
      b.events.push({kind:'wave',from:a.id,sx:x-w.dx,sy:y-w.dy,tx:x,ty:y,type:'water',cells:cells.map(q=>q.y*COLS+q.x),dx:w.dx,dy:w.dy,ttl:.5,life:.5});
      const victims=b.units.filter(t=>t.side!==w.side&&t.hp>0&&!t.shadowed&&!w.hit.includes(t.id)&&cells.some(q=>q.x===t.x&&q.y===t.y));
      for(const t of victims){
        w.hit.push(t.id);const sx=t.x,sy=t.y;hit(b,a,t,w.power,true,'water');
        if(t.hp>0&&!t.boss&&t.x===sx&&t.y===sy&&freeCell(b,sx+w.dx,sy+w.dy,t)){t.x+=w.dx;t.y+=w.dy;t.moveCD=Math.max(t.moveCD,.25);}
      }
      if(x+w.dx>=0&&x+w.dx<COLS&&y+w.dy>=0&&y+w.dy<ROWS)kept.push(w);
    }
    if(b.waves)b.waves=kept;
  }
  function dragonDarts(b,a,target){
    const {dx,dy}=cardinal(a,target),px=-dy,py=dx;
    const laneHits=offset=>b.units.filter(t=>t.side!==a.side&&t.hp>0&&!t.shadowed&&
      (t.x-a.x)*px+(t.y-a.y)*py===offset&&(t.x-a.x)*dx+(t.y-a.y)*dy>0)
      .sort((x,y)=>distance(a,x)-distance(a,y)||x.id-y.id);
    const sides=[-1,1].filter(i=>freeLane(i));
    function freeLane(i){const x=a.x+px*i,y=a.y+py*i;return x>=0&&x<COLS&&y>=0&&y<ROWS;}
    sides.sort((x,y)=>laneHits(y).length-laneHits(x).length||x-y);
    const old=a.pierce;a.pierce=Math.max(old,.4);
    for(const offset of [0,sides[0]]){
      if(offset===undefined)continue;
      const foes=laneHits(offset),first=foes[0],second=foes[1],sx=a.x+px*offset,sy=a.y+py*offset;
      let ex=sx,ey=sy;while(ex+dx>=0&&ex+dx<COLS&&ey+dy>=0&&ey+dy<ROWS){ex+=dx;ey+=dy;}
      const end=second?{x:second.x,y:second.y}:{x:ex,y:ey};
      b.events.push({kind:'dreepy',from:a.id,to:first?.id,sx,sy,tx:end.x,ty:end.y,returning:!!first&&!second,explodes:!!second,type:'dragon',ttl:.9,life:.9});
      if(!first)continue;
      hit(b,a,first,a.attack*1.1,true,'dragon');
      if(second){
        const center={x:second.x,y:second.y},victims=b.units.filter(t=>t.side!==a.side&&t.hp>0&&!t.shadowed&&distance(center,t)<=1);
        areaEvent(b,a,center,1,'dragon',victims);for(const t of victims)hit(b,a,t,a.attack*1.8,true,'dragon');
      } else if(first.hp>0&&!first.shadowed)hit(b,a,first,a.attack*1.6,true,'dragon');
    }
    a.pierce=old;
  }
  function releaseLift(b,a){
    const t=b.units.find(t=>t.id===a.liftTarget);
    if(t?.liftedBy===a.id)delete t.liftedBy;
    delete a.liftTarget;
  }
  function pseudoPulse(b,a){
    if(a.headPulses){
      a.headPulses--;
      if(!isStunned(b,a)){
        const foes=b.units.filter(t=>t.side!==a.side&&t.hp>0&&!t.shadowed&&distance(a,t)<=3).sort((x,y)=>distance(a,x)-distance(a,y)||x.id-y.id);
        const used=new Set();
        for(let i=0;i<3;i++){
          let t=foes.find(t=>t.id===a.headTargets[i]&&t.hp>0&&!used.has(t.id))||foes.find(t=>t.hp>0&&!used.has(t.id))||foes.find(t=>t.hp>0);
          if(!t)continue;used.add(t.id);a.headTargets[i]=t.id;
          hit(b,a,t,a.attack*.8,true,'dragon');
          b.events.push({kind:'headShot',from:a.id,to:t.id,head:i,sx:a.x,sy:a.y,tx:t.x,ty:t.y,type:'dragon',ttl:.65,life:.65});
        }
      }
      if(!a.headPulses){delete a.headPulses;delete a.headTargets;}return true;
    }
    if(a.swoopDx!==undefined){
      const dx=a.swoopDx,dy=a.swoopDy;delete a.swoopDx;delete a.swoopDy;
      if(isStunned(b,a))return true;
      const sx=a.x,sy=a.y;let end={x:sx,y:sy},landing={...end};
      while(end.x+dx>=0&&end.x+dx<COLS&&end.y+dy>=0&&end.y+dy<ROWS){end={x:end.x+dx,y:end.y+dy};if(freeCell(b,end.x,end.y,a))landing={...end};}
      const foes=b.units.filter(t=>t.side!==a.side&&t.hp>0&&!t.shadowed&&(t.x-sx)*dy===(t.y-sy)*dx&&(t.x-sx)*dx+(t.y-sy)*dy>0);
      a.x=landing.x;a.y=landing.y;
      b.events.push({kind:'flight',from:a.id,sx,sy,tx:a.x,ty:a.y,type:'flying',ttl:.7,life:.7});
      b.events.push({kind:'beam',from:a.id,sx,sy,tx:end.x,ty:end.y,type:'flying',ttl:.6});
      for(const t of foes)hit(b,a,t,a.attack*3,true,'flying');return true;
    }
    if(a.liftTarget!==undefined){
      const t=b.units.find(t=>t.id===a.liftTarget);releaseLift(b,a);
      if(isStunned(b,a)||!t||t.hp<=0)return true;
      if(!t.boss){
        const {dx,dy}=cardinal(a,t),sx=t.x,sy=t.y;let end={x:sx,y:sy};
        for(let i=1;i<=2;i++)if(freeCell(b,sx+dx*i,sy+dy*i,t))end={x:sx+dx*i,y:sy+dy*i};
        t.x=end.x;t.y=end.y;b.events.push({kind:'throw',from:a.id,to:t.id,sx,sy,tx:t.x,ty:t.y,type:'steel',ttl:.6,life:.6});
      }
      const center={x:t.x,y:t.y},foes=b.units.filter(u=>u.side!==a.side&&u.hp>0&&!u.shadowed&&distance(center,u)<=1);
      areaEvent(b,a,center,1,'steel',foes);for(const u of foes)hit(b,a,u,a.attack*2.6,true,'steel');return true;
    }
    return false;
  }
  function megaDrillPath(b,a,dx,dy){
    const cells=[];let landing={x:a.x,y:a.y};
    for(let step=1;step<=5;step++){
      const x=a.x+dx*step,y=a.y+dy*step;
      if(x<0||x>=COLS||y<0||y>=ROWS||b.units.some(t=>t!==a&&t.hp>0&&t.side===a.side&&t.x===x&&t.y===y))break;
      cells.push(y*COLS+x);if(freeCell(b,x,y,a))landing={x,y};
    }
    return {cells,landing};
  }
  function megaDrillPulse(b,a){
    const dx=a.megaDrillDx,dy=a.megaDrillDy;delete a.megaDrillDx;delete a.megaDrillDy;
    if(isStunned(b,a)||a.shadowed)return;
    const sx=a.x,sy=a.y,{cells,landing}=megaDrillPath(b,a,dx,dy),last=cells.at(-1);
    const foes=b.units.filter(t=>t.side!==a.side&&t.hp>0&&!t.shadowed&&cells.includes(t.y*COLS+t.x));
    const old=a.pierce;a.pierce=Math.max(old,.5);
    for(const t of foes){hit(b,a,t,a.attack*2.8,true,'ground');if(t.hp>0)t.healCutUntil=Math.max(t.healCutUntil||0,b.time+3);}
    a.pierce=old;a.x=landing.x;a.y=landing.y;
    b.events.push({kind:'megaDrill',from:a.id,sx,sy,tx:last===undefined?sx:last%COLS,ty:last===undefined?sy:Math.floor(last/COLS),type:'ground',ttl:.7,life:.7});
  }
  function guardWave(b,a,center,power,pushEnemies=false){
    const foes=b.units.filter(t=>t.side!==a.side&&t.hp>0&&!t.shadowed&&distance(center,t)<=2);
    b.events.push({kind:'guardWave',from:a.id,x:center.x,y:center.y,radius:2,type:'fairy',ttl:.7,life:.7});
    for(const t of foes){
      hit(b,a,t,a.attack*power,true,'fairy');
      if(t.hp<=0)continue;
      t.slowPower=Math.max(t.slowUntil>b.time?t.slowPower||0:0,.25);t.slowUntil=Math.max(t.slowUntil||0,b.time+2);
      if(pushEnemies&&!t.boss)push(b,center,t,1);
    }
    if(pushEnemies)for(const ally of b.units.filter(t=>t.side===a.side&&t.hp>0&&distance(center,t)<=1))shield(b,a,ally,ally.maxHp*.15);
  }
  function megaCast(b,a,target){
    if(!isMega(a)||a.dex===959)return false;
    if(a.dex===214){
      const dx=target.x-a.x,dy=target.y-a.y,len=Math.hypot(dx,dy)||1,counts=new Map(),old=a.pierce;
      a.pierce=Math.max(old,.5);
      for(let shot=0;shot<5;shot++){
        const foes=b.units.filter(t=>t.side!==a.side&&t.hp>0&&!t.shadowed&&Math.hypot(t.x-a.x,t.y-a.y)<=3&&
          ((t.x-a.x)*dx+(t.y-a.y)*dy)/(len*(Math.hypot(t.x-a.x,t.y-a.y)||1))>=.65)
          .sort((x,y)=>(counts.get(x.id)||0)-(counts.get(y.id)||0)||distance(a,x)-distance(a,y)||x.id-y.id);
        const t=foes[0];if(!t)break;const n=counts.get(t.id)||0,final=shot===4&&n>=3;
        counts.set(t.id,n+1);hit(b,a,t,a.attack*.85*(final?2:1),true,'bug');
        b.events.push({kind:'barrageSeed',from:a.id,to:t.id,sx:a.x,sy:a.y,tx:t.x,ty:t.y,shot,finisher:final,type:'bug',ttl:.9,life:.9});
      }
      a.pierce=old;return true;
    }
    if(a.dex===282){
      const friends=b.units.filter(t=>t.side===a.side&&t.hp>0).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp||x.id-y.id).slice(0,2);
      for(const ally of friends){heal(b,a,ally,a.attack*3);shield(b,a,ally,ally.maxHp*.15);}
      guardWave(b,a,{x:a.x,y:a.y},1.8);return true;
    }
    if(a.dex===530){
      const {dx,dy}=cardinal(a,target);a.megaDrillDx=dx;a.megaDrillDy=dy;
      const {cells}=megaDrillPath(b,a,dx,dy),last=cells.at(-1);
      b.events.push({kind:'drillWarning',from:a.id,sx:a.x,sy:a.y,tx:last===undefined?a.x:last%COLS,ty:last===undefined?a.y:Math.floor(last/COLS),cells,type:'ground',ttl:1,life:1});return true;
    }
    if(a.dex===154){
      a.gardenX=a.x;a.gardenY=a.y;a.gardenTicks=4;
      for(const ally of b.units.filter(t=>t.side===a.side&&t.hp>0&&distance(a,t)<=2)){ally.burn=null;ally.slowUntil=0;ally.stunUntil=0;}
      for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){
        const tx=Math.max(0,Math.min(5,a.x+dx*4)),ty=Math.max(0,Math.min(5,a.y+dy*4));
        b.events.push({kind:'solarRay',from:a.id,sx:a.x,sy:a.y,tx,ty,type:'grass',ttl:.65,life:.65});
        for(const t of b.units.filter(t=>t.side!==a.side&&t.hp>0&&!t.shadowed)){
          const along=(t.x-a.x)*dx+(t.y-a.y)*dy,across=(t.x-a.x)*dy-(t.y-a.y)*dx;
          if(along<=0||along>4||across!==0)continue;
          hit(b,a,t,a.attack*1.5,true,'grass');
          if(t.hp>0){t.slowPower=Math.max(t.slowUntil>b.time?t.slowPower||0:0,.25);t.slowUntil=Math.max(t.slowUntil||0,b.time+2);}
        }
      }return true;
    }
    if(a.dex===260){
      const d=cardinal(a,target);for(const sign of [1,-1])if((b.waves?.length||0)<48)(b.waves??=[]).push({source:a.id,side:a.side,x:a.x,y:a.y,dx:d.dx*sign,dy:d.dy*sign,step:0,hit:[],power:a.attack*1.8});return true;
    }
    if(a.dex===257){
      const used=new Set();for(let i=0;i<3;i++){
        const foes=b.units.filter(t=>t.side!==a.side&&t.hp>0&&!t.shadowed&&!used.has(t.id)&&distance(a,t)<=4).sort((x,y)=>distance(a,x)-distance(a,y)||x.id-y.id);
        let victim=null,cell=null;for(const t of foes){const cells=adjacentFree(b,a,t);if(cells.length){victim=t;cell=cells[0];break;}}
        if(!victim)break;used.add(victim.id);const sx=a.x,sy=a.y;a.x=cell.x;a.y=cell.y;
        b.events.push({kind:'flight',from:a.id,sx,sy,tx:a.x,ty:a.y,type:'fire',ttl:.65,life:.65});hit(b,a,victim,a.attack*1.6,true,'fire');burn(b,a,victim,3,a.attack*.18);
      }return true;
    }
    if(a.dex===248){
      const foes=b.units.filter(t=>t.side!==a.side&&t.hp>0&&!t.shadowed&&distance(a,t)<=3).sort((x,y)=>distance(a,x)-distance(a,y)||x.id-y.id);
      areaEvent(b,a,a,3,'rock',foes);for(const t of foes){const {dx,dy}=cardinal(a,t);if(!t.boss&&distance(a,t)>1&&freeCell(b,t.x-dx,t.y-dy,t)){t.x-=dx;t.y-=dy;}t.shield=0;hit(b,a,t,a.attack*2.2,true,'rock');}return true;
    }
    if(a.dex===47){a.fungalIds??=[];a.fungalBurst??=[];for(const t of b.units.filter(t=>t.side!==a.side&&t.hp>0&&!t.shadowed&&distance(a,t)<=3).sort((x,y)=>distance(a,x)-distance(a,y)||x.id-y.id).slice(0,3))if(!a.fungalIds.includes(t.id))a.fungalIds.push(t.id);return true;}
    return false;
  }
  function megaMovement(b){
    for(const a of b.units.filter(u=>u.hp>0&&isMega(u)&&u.dex===154&&u.gardenTicks)){
      if(!isStunned(b,a)&&!a.shadowed){
        const center={x:a.gardenX,y:a.gardenY};
        const allies=b.units.filter(t=>t.side===a.side&&t.hp>0&&t.hp<t.maxHp&&distance(center,t)<=2).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp||x.id-y.id).slice(0,2);
        for(const ally of allies)heal(b,a,ally,a.attack*.75);
        b.events.push({kind:'garden',from:a.id,x:center.x,y:center.y,radius:2,type:'fairy',ttl:.6,life:.6});
      }
      if(--a.gardenTicks===0){delete a.gardenTicks;delete a.gardenX;delete a.gardenY;}
    }
    for(const a of b.units.filter(u=>u.hp>0&&isMega(u)&&!isStunned(b,u)&&!u.shadowed)){
      if(a.dex===248){const foes=b.units.filter(t=>t.side!==a.side&&t.hp>0&&!t.shadowed&&distance(a,t)<=2);areaEvent(b,a,a,2,'rock',foes);for(const t of foes)hit(b,a,t,a.attack*.25,true,'rock',true);}
      if(a.dex===47&&a.fungalIds){
        const ids=[...a.fungalIds];for(const id of ids){const t=b.units.find(t=>t.id===id);if(!t)continue;
          if(t.hp>0&&!t.shadowed){const dealt=hit(b,a,t,a.attack*.35,true,'ghost',true),ally=b.units.filter(u=>u.side===a.side&&u.hp>0&&distance(u,t)<=2).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp||x.id-y.id)[0];if(ally)heal(b,a,ally,dealt);}
          if(t.hp<=0&&!a.fungalBurst.includes(id)){
            a.fungalBurst.push(id);const foes=b.units.filter(u=>u.side!==a.side&&u.hp>0&&!u.shadowed&&!a.fungalIds.includes(u.id)&&distance(u,t)<=2).sort((x,y)=>distance(x,t)-distance(y,t)||x.id-y.id).slice(0,2);
            for(const u of foes)a.fungalIds.push(u.id);areaEvent(b,a,t,2,'ghost',foes);
          }
        }
      }
    }
  }
  function tacticalCast(b,a,target) {
    if(a.dex===635){a.headPulses=2;a.headTargets=b.units.filter(t=>t.side!==a.side&&t.hp>0&&!t.shadowed&&distance(a,t)<=3).sort((x,y)=>distance(a,x)-distance(a,y)||x.id-y.id).slice(0,3).map(t=>t.id);return true;}
    if(a.dex===373){const {dx,dy}=cardinal(a,target);a.swoopDx=dx;a.swoopDy=dy;let x=a.x,y=a.y;while(x+dx>=0&&x+dx<COLS&&y+dy>=0&&y+dy<ROWS){x+=dx;y+=dy;}b.events.push({kind:'beam',from:a.id,sx:a.x,sy:a.y,tx:x,ty:y,type:'flying',ttl:1,life:1});return true;}
    if(a.dex===376){if(distance(a,target)<=1&&target.hp>0&&!target.shadowed&&target.liftedBy===undefined){a.liftTarget=target.id;if(!target.boss)target.liftedBy=a.id;b.events.push({kind:'lift',from:a.id,to:target.id,sx:a.x,sy:a.y,tx:target.x,ty:target.y,type:'steel',ttl:1,life:1});}return true;}
    if(a.dex===214){
      if(target.side===a.side||distance(a,target)>1||target.hp<=0||target.shadowed)return true;
      const {dx,dy}=cardinal(a,target),x=a.x-dx,y=a.y-dy,sx=target.x,sy=target.y;
      hit(b,a,target,a.attack*[2,2.4,2.8][a.star-1],true,'fighting');
      if(target.hp>0&&!target.boss&&target.x===sx&&target.y===sy&&freeCell(b,x,y,target)){
        target.x=x;target.y=y;target.moveCD=Math.max(target.moveCD,.25);
        b.events.push({kind:'throw',from:a.id,to:target.id,sx,sy,tx:x,ty:y,type:'fighting',ttl:.6,life:.6});
      }
      return true;
    }
    if(a.dex===254){const d=cardinal(a,target);a.leafPulse=0;a.leafTarget=target.id;a.leafDx=d.dx;a.leafDy=d.dy;return true;}
    if(a.dex===395){const d=cardinal(a,target);if((b.waves?.length||0)<48)(b.waves??=[]).push({source:a.id,side:a.side,x:a.x,y:a.y,dx:d.dx,dy:d.dy,step:0,hit:[],power:a.attack*2.5});return true;}
    if(a.dex===887){dragonDarts(b,a,target);return true;}

    if(a.dex===94){a.ambushPending=true;return true;}
    if(a.dex===959){a.hammerX=target.x;a.hammerY=target.y;areaEvent(b,a,{x:a.hammerX,y:a.hammerY},isMega(a)?2:1,'steel',[]);b.events[b.events.length-1].kind='warning';b.events[b.events.length-1].ttl=1;b.events[b.events.length-1].life=1;return true;}
    if(a.dex===212){a.bulletPulses=3;return true;}
    if(a.dex===925&&a.star===3){a.populationPulse=0;a.populationTarget=target.id;return true;}
    if(a.dex===681){a.bladePending=true;shield(b,a,a,a.maxHp*.3);return true;}
    if(a.dex!==663)return false;
    const foes=b.units.filter(u=>u.side!==a.side&&u.hp>0&&!u.shadowed).sort((x,y)=>distance(a,y)-distance(a,x)||x.id-y.id);
    let landing=null,victim=null;
    for(const foe of foes){
      const cells=[[0,-1],[-1,0],[1,0],[0,1]].map(([dx,dy])=>({x:foe.x+dx,y:foe.y+dy}))
        .filter(q=>q.x>=0&&q.x<COLS&&q.y>=0&&q.y<ROWS&&!b.units.some(u=>u!==a&&u.hp>0&&u.x===q.x&&u.y===q.y));
      if(cells.length){cells.sort((x,y)=>distance(a,x)-distance(a,y)||x.y-y.y||x.x-y.x);landing=cells[0];victim=foe;break;}
    }
    if(!landing){landing={x:a.x,y:a.y};victim=target;}
    const sx=a.x,sy=a.y;a.x=landing.x;a.y=landing.y;
    b.events.push({kind:'flight',from:a.id,to:victim.id,sx,sy,tx:a.x,ty:a.y,type:'flying',ttl:.6});
    areaEvent(b,a,a,1,'flying',b.units.filter(u=>u.side!==a.side&&u.hp>0&&!u.shadowed&&distance(a,u)<=1));
    const old=a.pierce;a.pierce=Math.max(old,.3);
    for(const foe of b.units.filter(u=>u.side!==a.side&&u.hp>0&&!u.shadowed&&distance(a,u)<=1))hit(b,a,foe,a.attack*2.8,true,'flying');
    a.pierce=old;
    const recoil=Math.min(a.hp-1,a.maxHp*.1);if(recoil>0){a.hp-=recoil;a.damageTaken+=recoil;}
    return true;
  }
  function tacticalPulse(b,a) {
    if(a.rescueWaveX!==undefined){
      const center={x:a.rescueWaveX,y:a.rescueWaveY};delete a.rescueWaveX;delete a.rescueWaveY;
      if(!isStunned(b,a)&&!a.shadowed)guardWave(b,a,center,2.2,true);return true;
    }
    if(a.megaDrillDx!==undefined){megaDrillPulse(b,a);return true;}
    if(a.liftedBy!==undefined)return true;
    if(pseudoPulse(b,a))return true;
    if(a.leafPulse!==undefined){
      const stage=a.leafPulse++,target=b.units.find(t=>t.id===a.leafTarget&&t.side!==a.side&&t.hp>0&&!t.shadowed)||selectTarget(b,a);
      if(target)a.leafTarget=target.id;
      if(!isStunned(b,a)&&target){
        if(stage<2&&distance(a,target)<=1){
          if(stage===0){
            hit(b,a,target,a.attack*1.3,true,'grass');
            if(target.hp>0){const options=[{x:target.x-a.leafDy,y:target.y+a.leafDx},{x:target.x+a.leafDy,y:target.y-a.leafDx}];for(const q of options)if(flankStep(b,a,q))break;}
          }else{
            const flanked=flankStep(b,a,{x:target.x+a.leafDx,y:target.y+a.leafDy}),old=a.pierce;if(flanked)a.pierce=Math.max(old,.4);
            hit(b,a,target,a.attack*1.6,true,'grass');a.pierce=old;
          }
        }else if(stage===2&&distance(a,target)<=3){
          const dx=target.x-a.x,dy=target.y-a.y,len=Math.hypot(dx,dy)||1;
          const victims=b.units.filter(t=>t.side!==a.side&&t.hp>0&&!t.shadowed&&Math.hypot(t.x-a.x,t.y-a.y)<=3&&
            ((t.x-a.x)*dx+(t.y-a.y)*dy)/(len*(Math.hypot(t.x-a.x,t.y-a.y)||1))>=.65);
          for(const t of victims)hit(b,a,t,a.attack*2.4,true,'grass');
          b.events.push({kind:'leafFan',from:a.id,sx:a.x,sy:a.y,tx:target.x,ty:target.y,type:'grass',ttl:.65,life:.65});
        }
      }
      if(a.leafPulse>=3)clearLeaves(a);return true;
    }

    if(a.ambushPending){
      // Only reveal after a movement beat has actually hidden Gengar.
      if(!a.shadowed)return true;
      delete a.shadowed;delete a.ambushPending;
      if(isStunned(b,a))return true;
      const foes=b.units.filter(u=>u.side!==a.side&&u.hp>0&&!u.shadowed).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp||x.id-y.id);
      for(const target of foes){
        const cells=adjacentFree(b,a,target);if(!cells.length)continue;
        const sx=a.x,sy=a.y;a.x=cells[0].x;a.y=cells[0].y;
        b.events.push({kind:'blink',from:a.id,to:target.id,sx,sy,tx:a.x,ty:a.y,type:'ghost',ttl:.6});
        const kills=a.kills;hit(b,a,target,a.attack*3.4,true,'ghost');if(a.kills>kills)a.mana=Math.min(100,a.mana+50);
        break;
      }
      return true;
    }
    if(a.hammerRecovery){delete a.hammerRecovery;if(a.hammerEcho){const center=a.hammerEcho;delete a.hammerEcho;if(!isStunned(b,a)){const foes=b.units.filter(t=>t.side!==a.side&&t.hp>0&&!t.shadowed&&distance(center,t)<=2);areaEvent(b,a,center,2,'steel',foes);for(const t of foes)hit(b,a,t,a.attack*1.5,true,'steel');}}return true;}
    if(a.hammerX!==undefined){
      const center={x:a.hammerX,y:a.hammerY};delete a.hammerX;delete a.hammerY;
      if(isStunned(b,a))return true;
      a.hammerRecovery=true;
      const radius=isMega(a)?2:1;if(isMega(a))a.hammerEcho={x:center.x,y:center.y};
      const victims=b.units.filter(u=>u.side!==a.side&&u.hp>0&&!u.shadowed&&distance(center,u)<=radius);
      areaEvent(b,a,center,radius,'steel',victims);
      for(const t of victims){t.shield=0;hit(b,a,t,a.attack*4.5,true,'steel');}
      return true;
    }
    if(a.bulletPulses){
      a.bulletPulses--;if(!isStunned(b,a)){
        const rate=(2*BEAT_SECONDS)/a.interval*(a.slowUntil>b.time?1-a.slowPower:1);
        for(let i=0;i<2;i++){
          const t=selectTarget(b,a);if(!t||distance(a,t)>a.range)break;
          hit(b,a,t,a.attack*.6*rate,true,'steel',false,true);
          const e=b.events[b.events.length-1];if(e?.from===a.id){e.bullet=i;e.move='Puño Bala';}
        }
      }
      if(!a.bulletPulses)delete a.bulletPulses;return true;
    }
    if(a.populationPulse!==undefined){
      const count=[3,3,4][a.populationPulse++];
      if(!isStunned(b,a))for(let i=0;i<count;i++){
        let target=b.units.find(u=>u.id===a.populationTarget&&u.side!==a.side&&u.hp>0&&!u.shadowed);
        if(!target){target=b.units.filter(u=>u.side!==a.side&&u.hp>0&&!u.shadowed).sort((x,y)=>distance(a,x)-distance(a,y)||x.id-y.id)[0];a.populationTarget=target?.id||0;}
        if(!target||distance(a,target)>a.range)break;
        hit(b,a,target,a.attack*.55,true,'normal');
        const e=b.events[b.events.length-1];e.mouse=i;e.life=.65;e.ttl=.65;
      }
      if(a.populationPulse>=3){delete a.populationPulse;delete a.populationTarget;}
      return true;
    }
    if(a.bladePending&&!isStunned(b,a)){
      const target=selectTarget(b,a);if(!target||distance(a,target)>a.range)return false;
      const charge=a.shield*.5;a.shield-=charge;delete a.bladePending;
      b.events.push({kind:'cast',from:a.id,to:target.id,move:'Forma Filo',type:'steel',sx:a.x,sy:a.y,tx:target.x,ty:target.y,ttl:.8});
      const old=a.pierce;a.pierce=Math.max(old,.5);hit(b,a,target,a.attack*2.8+charge,true,'steel');a.pierce=old;
      return true;
    }
    return false;
  }
  function cast(b,a,target) {
    a.mana=0;b.events.push({kind:'cast',from:a.id,move:moveFor(a),to:target.id,sx:a.x,sy:a.y,tx:target.x,ty:target.y,beat:b.beat,ttl:.8});
    if(megaCast(b,a,target)||tacticalCast(b,a,target)||signature(b,a,target)||familyCast(b,a,target)||areaCast(b,a,target))return;
    if(moveFor(a)==='Fortaleza'){shield(b,a,a,a.maxHp*.3);return;}
    if(a.ai==='guardian') {
      const ally=b.units.filter(u=>u.side===a.side&&u.hp>0).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp||x.id-y.id)[0];
      shield(b,a,ally,a.maxHp*.25);hit(b,a,target,a.attack*1.5,true);
    } else if(a.ai==='healer') {
      const ally=b.units.filter(u=>u.side===a.side&&u.hp>0).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp)[0];heal(b,a,ally,a.attack*3.2);
    } else if(a.role==='tank') {
      shield(b,a,a,a.maxHp*.25);
      for(const t of b.units.filter(u=>u.side!==a.side&&u.hp>0&&!u.shadowed&&distance(a,u)<=2))hit(b,a,t,a.attack*1.5,true);
    } else if(a.role==='mage') {
      for(const t of b.units.filter(u=>u.side!==a.side&&u.hp>0&&!u.shadowed&&distance(target,u)<=1))hit(b,a,t,a.attack*2,true);
    } else hit(b,a,target,a.attack*3.5,true);
  }
  function finish(s,winner) {
    const b=s.battle,won=winner===0;
    if(won) {s.wins++;s.streak=Math.max(0,s.streak)+1;} else {
      s.streak=Math.min(0,s.streak)-1;
      s.life=Math.max(0,s.life-1);
    }
    const interest=Math.floor(s.gold/5),bonus=Math.min(3,Math.floor(Math.abs(s.streak)/2));
    const encounterBonus=won?(waveInfo(s.round).kind==='boss'?10+2*Math.floor(s.round/10):waveInfo(s.round).kind==='elite'?4:0):0;
    const baseIncome=5+Math.min(15,Math.floor((s.round-1)/5)),income=baseIncome+interest+bonus+(won?1:0)+encounterBonus;s.gold=Math.min(999999999999,s.gold+income);gainXP(s,2);
    const report=b.units.map(u=>({id:u.id,dex:u.dex,star:u.star,promotion:promotion(u),side:u.side,damage:u.damageDone,healing:u.healingDone,shielding:u.shieldingDone,taken:u.damageTaken,blocked:u.blocked,kills:u.kills}));
    s.result={won,draw:winner===-1,income,interest,bonus,baseIncome,encounterBonus,round:s.round,report};
    s.completed=(s.completed||0)+1;s.totals=aggregateReports([...(s.totals||[]),...report.filter(u=>u.side===0)]);
    s.history.push({round:s.round,won,report});if(s.history.length>HISTORY_LIMIT)s.history.shift();
    s.phase=s.life<=0?'defeat':'result';
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
  function hasAttackPriority(a) {return a.hp>0&&(!!a.bulletPulses||!!a.galeWings&&a.hp>=a.maxHp);}
  function pulse(b) {
    b.beatCount=(b.beatCount||0)+1;b.beat=(b.beatCount-1)%4+1;b.beatStarted=b.time;
    // Both teams share one clock. Alternate cell/attack initiative each bar.
    const order=Math.floor((b.beatCount-1)/4)%2?[...b.units].reverse():b.units;
    if(b.beat===1||b.beat===3) {
      for(const a of order){if(a.hp<=0)continue;
        if(a.ambushPending){if(isStunned(b,a))delete a.ambushPending;else a.shadowed=true;continue;}
        if(isStunned(b,a)||a.hammerX!==undefined||a.swoopDx!==undefined||a.liftTarget!==undefined||a.megaDrillDx!==undefined)continue;
        const steps=a.dex===658?2:1;
        for(let i=0;i<steps;i++){const target=(a.leafPulse!==undefined?b.units.find(t=>t.id===a.leafTarget&&t.side!==a.side&&t.hp>0&&!t.shadowed):null)||selectTarget(b,a);if(!target)break;
          if(i)a.moveCD=0;const x=a.x,y=a.y;moveToward(b,a,target);if(a.x===x&&a.y===y)break;
        }
      }
      advanceWaves(b);megaMovement(b);return;
    }
    // Choose attacks from the same pulse's initial formation, then resolve in order.
    const attacks=order.filter(a=>a.hp>0).map(a=>({a,target:selectTarget(b,a)}))
      .sort((p,q)=>Number(hasAttackPriority(q.a))-Number(hasAttackPriority(p.a)));
    for(const {a,target:chosen} of attacks) {
      if(a.hp<=0)continue;
      if(tacticalPulse(b,a))continue;
      if(isStunned(b,a)||a.cooldown>0)continue;
      const target=chosen?.hp>0&&!chosen.shadowed&&targetAllowed(b,a,chosen)?chosen:selectTarget(b,a);if(!target||distance(a,target)>a.range)continue;
      // One basic strike per attack beat; speed changes strike power/mana instead
      // of creating off-beat attacks. Slow affects those same values temporarily.
      const rate=(2*BEAT_SECONDS)/a.interval*(a.slowUntil>b.time?1-a.slowPower:1);
      const impulse=isMega(a)&&a.dex===257?1+.1*(a.impulse=Math.min(5,(a.impulse||0)+1)):1;
      hit(b,a,target,a.attack*rate*impulse,false,a.basicType||a.types[0]);a.mana=Math.min(100,a.mana+(25+a.manaGain)*rate*impulse);
      a.cooldown=.25;
      if(a.hp>0&&a.mana>=100) {
        const alive=target.hp>0?target:selectTarget(b,a);
        if(alive&&distance(a,alive)<=a.range)cast(b,a,alive);
      }
    }
  }
  function step(s,dt) {
    const b=s.battle;
    if(b.intro>0){b.intro=Math.max(0,b.intro-dt);if(b.intro<.00001){b.intro=0;entrances(b);}return;}
    for(const a of b.units)if(a.liftTarget!==undefined&&(a.hp<=0||isStunned(b,a)||!b.units.some(t=>t.id===a.liftTarget&&t.hp>0)))releaseLift(b,a);
    b.time+=dt;b.opening=Math.max(0,(b.opening||0)-dt);b.events=b.events.filter(e=>(e.ttl-=dt)>0);
    for(const a of b.units) {
      a.flash=Math.max(0,a.flash-dt);if(a.hp<=0)continue;
      const regen=Math.max(0,Math.min(a.maxHp-a.hp,a.maxHp*a.regen*dt*(a.healCutUntil>b.time ? .5 : 1)));a.hp+=regen;a.healingDone+=regen;
      if(a.burn) {
        const dot=a.burn;dot.remaining-=dt;dot.cd-=dt;
        if(dot.cd<=.00001){const source=b.units.find(u=>u.id===dot.source);if(source)hit(b,source,a,dot.power,true,'fire',true);dot.cd+=1;}
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
  function aggregateReports(rows) {
    const totals=new Map();
    for(const u of rows){const family=BY[u.dex].line[0];let row=totals.get(family);
      if(!row){row={id:family,dex:u.dex,star:u.star,side:0,damage:0,healing:0,shielding:0,taken:0,blocked:0,kills:0};totals.set(family,row);}
      if(rank(u)>=rank(row)){row.dex=u.dex;row.star=u.star;row.promotion=promotion(u);}
      for(const field of ['damage','healing','shielding','taken','blocked','kills'])row[field]+=u[field];
    }return [...totals.values()].sort((a,b)=>b.damage-a.damage);
  }
  function report(s,scope='ally') {
    if(scope!=='match')return (s.result?.report||[]).filter(u=>u.side===(scope==='enemy'?1:0)).map(u=>({...u})).sort((a,b)=>b.damage-a.damage);
    return (s.totals?.length?s.totals:aggregateReports(s.history.flatMap(h=>h.report.filter(u=>u.side===0)))).map(u=>({...u})).sort((a,b)=>b.damage-a.damage);
  }
  function tick(s,dt) {
    if(!Number.isFinite(dt)||dt<=0)return;
    s.effects=s.effects.filter(e=>(e.ttl-=Math.min(dt,.25))>0);
    if(s.phase!=='combat'){if(s.battle)s.battle.events=s.battle.events.filter(e=>(e.ttl-=Math.min(dt,.25))>0);return;}
    s.battle.acc+=Math.min(dt,.25);
    while(s.battle.acc>=.05&&s.phase==='combat'){s.battle.acc-=.05;step(s,.05);}
  }
  function next(s) {
    if(s.phase!=='result')return false;
    s.round++;s.phase='planning';s.battle=null;prepareEnemy(s);
    if(!s.locked)reroll(s,true);return true;
  }
  const SAVE_VERSION=3;
  function serialize(s) {return JSON.stringify({version:SAVE_VERSION,state:s});}
  function restore(raw) {
    try {
      if(typeof raw!=='string'||raw.length>300000)return null;
      const data=JSON.parse(raw),s=data.state;
      const int=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
      const trained=u=>(u.promotion===undefined||int(u.promotion,0,maxPromotion(u)))&&(u.training===undefined||int(u.training,0,(promotion(u)===6&&MEGAS[u.dex]?3:TRAINING_COSTS[promotion(u)]||1)-1))&&(!promotion(u)||u.star===3)&&(!(u.training||0)||u.star===3)&&!(u.id<0&&promotion(u));
      const unit=u=>u&&trained(u)&&int(u.id,-6,100000)&&u.id!==0&&BY[u.dex]&&int(u.star,1,3)&&evolvedDex(u.dex,u.star)===u.dex&&
        (u.pos===null||int(u.pos,0,35));
      const numbers=o=>Object.values(o).every(v=>typeof v!=='number'||Number.isFinite(v)&&Math.abs(v)<1e12);
      if(![1,2,SAVE_VERSION].includes(data.version)||!s||!numbers(s)||!validDeck(s.deck,data.version===1)||!int(s.round,1,MAX_WAVE)||!int(s.level,3,6)||
        !int(s.seed,0,4294967295)||!int(s.nextId,1,100001)||!int(s.life,0,data.version<3?50:5)||!int(s.gold,0,999999999999)||!int(s.xp,0,20)||
        s.opponentRound!==s.round||!int(s.wins,0,MAX_WAVE)||!int(s.streak,-MAX_WAVE,MAX_WAVE)||typeof s.locked!=='boolean'||
        !['planning','combat','result','defeat',...(data.version===1?['victory']:[])].includes(s.phase))return null;
      if(!Array.isArray(s.units)||s.units.length>14||!s.units.every(u=>unit(u)&&u.id>0&&u.id<s.nextId&&s.deck.includes(BY[u.dex].line[0])&&(u.pos===null||u.pos>=18))||
        new Set(s.units.map(u=>u.id)).size!==s.units.length||new Set(s.units.filter(u=>u.pos!==null).map(u=>u.pos)).size!==s.units.filter(u=>u.pos!==null).length||
        s.units.filter(u=>u.pos===null).length>BENCH||s.units.filter(u=>u.pos!==null).length>s.level)return null;
      if(!Array.isArray(s.shop)||s.shop.length>5||!s.shop.every(d=>d===null||s.deck.includes(d)))return null;
      if(!Array.isArray(s.opponent)||!s.opponent.length||s.opponent.length>6||!s.opponent.every(u=>unit(u)&&u.id<0&&u.pos<18))return null;
      const report=(rows,limit=12)=>Array.isArray(rows)&&rows.length<=limit&&rows.every(u=>BY[u.dex]&&trained(u)&&int(u.star,1,3)&&[0,1].includes(u.side)&&['damage','healing','shielding','taken','blocked','kills'].every(k=>Number.isFinite(u[k])&&u[k]>=0&&u[k]<1e12));
      if(!Array.isArray(s.history)||s.history.length>HISTORY_LIMIT||!s.history.every(h=>int(h.round,1,MAX_WAVE)&&report(h.report)))return null;
      if(s.result&&(!int(s.result.round,1,MAX_WAVE)||!report(s.result.report)||!numbers(s.result)))return null;
      if(['result','victory','defeat'].includes(s.phase)&&!s.result)return null;
      if(s.battle) {
        const b=s.battle;
        if(!numbers(b)||(b.intro!==undefined&&(!Number.isFinite(b.intro)||b.intro<0||b.intro>2.8||b.intro>0&&(b.time!==0||!b.units?.some(u=>u.boss))))||!Number.isFinite(b.time)||b.time<0||b.time>46||!Number.isFinite(b.acc)||b.acc<0||b.acc>.3||
          !Number.isFinite(b.nextBeat)||b.nextBeat<0||!int(b.beat,0,4)||!int(b.beatCount,0,100)||!Array.isArray(b.units)||b.units.length>12||!b.units.length)return null;
        if(!b.units.every(u=>unit(u)&&[0,1].includes(u.side)&&int(u.x,0,5)&&int(u.y,0,5)&&numbers(u)&&
          ['hp','maxHp','attack','armor','interval','range','mana','shield','manaGain','regen','pierce','slow','cooldown','moveCD','flash','damageDone','damageTaken','blocked','kills','healingDone','shieldingDone'].every(k=>Number.isFinite(u[k]))&&
          u.hp>=0&&u.hp<=u.maxHp&&u.maxHp>0&&u.interval>0&&u.shield>=0&&u.mana>=0&&u.mana<=100&&
          (u.leafPulse===undefined&&u.leafTarget===undefined&&u.leafDx===undefined&&u.leafDy===undefined||
            u.dex===254&&int(u.leafPulse,0,2)&&int(u.leafTarget,-6,100000)&&int(u.leafDx,-1,1)&&int(u.leafDy,-1,1)&&Math.abs(u.leafDx)+Math.abs(u.leafDy)===1)&&
          (u.megaDrillDx===undefined&&u.megaDrillDy===undefined||isMega(u)&&u.dex===530&&int(u.megaDrillDx,-1,1)&&int(u.megaDrillDy,-1,1)&&Math.abs(u.megaDrillDx)+Math.abs(u.megaDrillDy)===1)&&
          (u.gardenTicks===undefined&&u.gardenX===undefined&&u.gardenY===undefined||isMega(u)&&u.dex===154&&int(u.gardenTicks,1,4)&&int(u.gardenX,0,5)&&int(u.gardenY,0,5))&&
          (u.healCutUntil===undefined||typeof u.healCutUntil==='number'&&Number.isFinite(u.healCutUntil)&&u.healCutUntil>=0&&u.healCutUntil<=50)&&
          (u.impulse===undefined||isMega(u)&&u.dex===257&&int(u.impulse,0,5))&&
          (u.hammerEcho===undefined||isMega(u)&&u.dex===959&&u.hammerRecovery&&int(u.hammerEcho.x,0,5)&&int(u.hammerEcho.y,0,5))&&
          (u.fungalIds===undefined&&u.fungalBurst===undefined||isMega(u)&&u.dex===47&&Array.isArray(u.fungalIds)&&Array.isArray(u.fungalBurst)&&u.fungalIds.length<=12&&new Set(u.fungalIds).size===u.fungalIds.length&&new Set(u.fungalBurst).size===u.fungalBurst.length&&u.fungalIds.every(id=>b.units.some(t=>t.id===id&&t.side!==u.side))&&u.fungalBurst.every(id=>u.fungalIds.includes(id)))&&
          (u.headPulses===undefined&&u.headTargets===undefined||u.dex===635&&int(u.headPulses,1,2)&&Array.isArray(u.headTargets)&&u.headTargets.length<=3&&u.headTargets.every(id=>int(id,-6,100000)))&&
          (u.swoopDx===undefined&&u.swoopDy===undefined||u.dex===373&&int(u.swoopDx,-1,1)&&int(u.swoopDy,-1,1)&&Math.abs(u.swoopDx)+Math.abs(u.swoopDy)===1)&&
          (u.liftTarget===undefined||u.dex===376&&int(u.liftTarget,-6,100000))&&
          (u.liftedBy===undefined||!u.boss&&int(u.liftedBy,-6,100000))&&
          (u.ambushPending===undefined||u.dex===94&&u.ambushPending===true)&&
          (u.shadowed===undefined||u.dex===94&&u.shadowed===true&&u.ambushPending===true)&&
          (u.rescueWaveX===undefined&&u.rescueWaveY===undefined||isMega(u)&&u.dex===282&&u.rescueUsed===true&&int(u.rescueWaveX,0,5)&&int(u.rescueWaveY,0,5))&&
          (u.rescueUsed===undefined||u.dex===282&&typeof u.rescueUsed==='boolean')&&
          (u.bulletPulses===undefined||u.dex===212&&int(u.bulletPulses,1,3))&&
          (u.hammerRecovery===undefined||u.dex===959&&u.hammerRecovery===true)&&
          (u.hammerX===undefined&&u.hammerY===undefined||u.dex===959&&int(u.hammerX,0,5)&&int(u.hammerY,0,5))&&
          (u.populationPulse===undefined||u.dex===925&&int(u.populationPulse,0,2)&&int(u.populationTarget,-6,100000))&&
          (u.bladePending===undefined||u.dex===681&&typeof u.bladePending==='boolean')&&
          Array.isArray(u.types)&&u.types.every(t=>Object.hasOwn(EFFECTS,t))&&['tank','healer','mage','fighter'].includes(u.role)&&
          ['tank','healer','guardian','ranged','diver','fighter'].includes(u.ai)&&(!u.burn||numbers(u.burn)&&['source','power','remaining','cd'].every(k=>Number.isFinite(u.burn[k])))))return null;
        if(new Set(b.units.map(u=>u.id)).size!==b.units.length)return null;
        if(b.units.some(u=>u.leafPulse!==undefined&&!b.units.some(t=>t.id===u.leafTarget&&t.side!==u.side)))return null;
        if(b.units.some(u=>u.liftTarget!==undefined&&!b.units.some(t=>t.id===u.liftTarget&&t.side!==u.side&&(t.boss||t.liftedBy===u.id))||u.liftedBy!==undefined&&!b.units.some(t=>t.id===u.liftedBy&&t.dex===376&&t.side!==u.side&&t.liftTarget===u.id)||u.headTargets?.some(id=>!b.units.some(t=>t.id===id&&t.side!==u.side))))return null;
        if(b.waves!==undefined&&(!Array.isArray(b.waves)||b.waves.length>48||!b.waves.every(w=>w&&numbers(w)&&
          int(w.source,-6,100000)&&b.units.some(u=>u.id===w.source&&(u.dex===395||u.dex===260&&isMega(u))&&u.side===w.side)&&
          int(w.x,0,5)&&int(w.y,0,5)&&int(w.dx,-1,1)&&int(w.dy,-1,1)&&Math.abs(w.dx)+Math.abs(w.dy)===1&&int(w.step,0,5)&&
          Number.isFinite(w.power)&&w.power>0&&w.power<1e12&&Array.isArray(w.hit)&&w.hit.length<=12&&new Set(w.hit).size===w.hit.length&&
          w.hit.every(id=>Number.isInteger(id)&&b.units.some(u=>u.id===id&&u.side!==w.side)))))return null;
        const live=b.units.filter(u=>u.hp>0);if(new Set(live.map(u=>u.y*6+u.x)).size!==live.length)return null;
        // Transient particles are expendable; never trust persisted display strings.
        b.events=[];for(const u of b.units)delete u.entrance;
      } else if(s.phase==='combat')return null;
      if(data.version===1){
        s.deck=migrateDeck(s.deck);s.completed=s.history.length;s.totals=aggregateReports(s.history.flatMap(h=>h.report.filter(u=>u.side===0)));s.recordId=String(s.seed);
        for(const u of s.units.filter(u=>BY[u.dex].bossOnly))s.gold=Math.min(1000000,s.gold+BY[u.dex].cost*3**(u.star-1));
        s.units=s.units.filter(u=>!BY[u.dex].bossOnly);s.shop=s.shop.map(d=>d&&BY[d].bossOnly?null:d);
        if(s.phase==='victory')s.phase='result';
        if(s.phase==='combat'){s.phase='planning';s.battle=null;s.result=null;}
        if(s.phase==='planning')prepareEnemy(s);
      } else if(!int(s.completed,0,MAX_WAVE)||!report(s.totals,ROSTER.length)||typeof s.recordId!=='string'||s.recordId.length>40)return null;
      if(data.version<3){s.life=Math.ceil(s.life/10);delete s.rankOwner;delete s.rankRules;delete s.rankSubmitted;}
      if(s.rankOwner!==undefined&&(typeof s.rankOwner!=='string'||s.rankOwner.length>128))return null;
      // Rebalance cached planning encounters once; an active fight resumes intact.
      if(s.phase==='planning'&&s.balanceVersion!==2)prepareEnemy(s);
      s.encounter=waveInfo(s.round);s.effects=[];return s;
    } catch(_){return null;}
  }
  return {MEGAS,isMega,typesFor,nameFor,maxed,skipIntro,TRAINING_COSTS,rank,rankLabel,rankColor,unitCopies,trainingLabel,hasAttackPriority,isStunned,stun,serialize,restore,SAVE_VERSION,scout,entranceFor,COLS,ROWS,BENCH,BEAT_SECONDS,ROSTER,PLAYABLE_ROSTER,BOSS_DEFINITIONS,BY,DEFAULT_DECK,validDeck,migrateDeck,waveInfo,HISTORY_LIMIT,MAX_WAVE,evolvedDex,moveFor,abilityFor,preview,cast,report,AREA_MOVES,aiFor,selectTarget,XP,ODDS,EFFECTS,create,buy,place,sell,buyXP,reroll,traits,start,tick,next};
})();
