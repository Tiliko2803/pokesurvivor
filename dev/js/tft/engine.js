/* PokéSurvivor TFT alpha — isolated rules; no survivor save, coins or rankings. */
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
  const moveFor=u=>BY[u.dex].moves[u.star-1];
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
    const s = {seed:seed>>>0,nextId:1,round:1,life:50,gold:10,level:3,xp:0,
      deck:deck?deck.slice():PLAYABLE_ROSTER.map(p=>p.dex),recordId:String(seed>>>0),completed:0,totals:[],history:[],effects:[],units:[],shop:[],locked:false,phase:'planning',battle:null,result:null,wins:0,streak:0};
    reroll(s,true);prepareEnemy(s); return s;
  }
  function random(s) { s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0; return s.seed/4294967296; }
  const TRAINING_COSTS=[3,4,5,6,7,8];
  const promotion=u=>u.promotion||0;
  const rank=u=>u.star+promotion(u);
  const rankLabel=u=>['Bronce','Plata','Oro'][Math.floor((rank(u)-1)/3)]+' '+ '★'.repeat((rank(u)-1)%3+1);
  const rankColor=u=>['#cd9567','#d7e3ed','#ffda6b'][Math.floor((rank(u)-1)/3)];
  const unitCopies=u=>3**(u.star-1)+TRAINING_COSTS.slice(0,promotion(u)).reduce((a,b)=>a+b,0)+(u.training||0);
  const trainingLabel=u=>u.star<3?'Tres copias para evolucionar':promotion(u)>=6?'Máximo · Oro ★★★':`Entrenamiento ${u.training||0}/${TRAINING_COSTS[promotion(u)]} copias · siguiente rango`;
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
    const available=PLAYABLE_ROSTER.filter(p=>s.deck.includes(p.dex)&&!s.units.some(u=>BY[u.dex].line[0]===p.dex&&promotion(u)===6));
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
      if(promotion(trained)>=6)return false;
      s.gold-=def.cost;s.shop[index]=null;trained.training=(trained.training||0)+1;
      if(trained.training>=TRAINING_COSTS[promotion(trained)]) {
        trained.training=0;trained.promotion=promotion(trained)+1;
        s.effects.push({kind:'evolve',id:trained.id,fromDex:trained.dex,toDex:trained.dex,star:3,promotion:trained.promotion,ttl:1.6});
        if(promotion(trained)===6)s.shop=s.shop.map(d=>d===dex?null:d);
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
    const n=boss?3:Math.min(6,2+Math.floor((s.round-1)/3)+(elite?1:0)),cap=Math.min(4,1+Math.floor((s.round-1)/3));
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
      units.push({id:-(i+1),dex:evolvedDex(dex,star),star,pos:positions[i],boss:isBoss,elite});
    }
    return units;
  }
  // Cache once: scouting, shopping and formation never consume encounter RNG.
  function prepareEnemy(s) {s.opponent=enemyTeam(s);s.opponentRound=s.round;s.encounter=waveInfo(s.round);s.balanceVersion=1;}
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
    const e=entranceFor(a),foes=b.units.filter(u=>u.side!==a.side&&u.hp>0);
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
    const p=G.DEX_BY[u.dex],def=BY[u.dex],power=1.8**(u.star-1)*1.18**promotion(u),ai=aiFor(u.dex);
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
    if(side===1) {
      f.maxHp*=(1+(round-1)*.025)*(u.boss?3:u.elite?1.18:1);
      f.attack*=(1+(round-1)*.015)*(u.boss?1.15:u.elite?1.1:1);
      if(def.role==='tank'||['tank','guardian'].includes(ai))f.attack*=.8;
    }
    if(def.line[0]===661)f.basicType='flying';
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
    s.battle={time:0,acc:0,opening:1.2,beat:0,beatCount:0,beatStarted:0,nextBeat:.05,events:[],units:[...team.map(u=>fighter(u,0,traits(team),s.round)),
      ...foes.map(u=>fighter(u,1,traits(foes),s.round))]};
    entrances(s.battle);s.phase='combat';s.result=null;return true;
  }
  const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
  function hit(b,a,t,power,spell=false,type=a.types[0],periodic=false) {
    if(t.hp<=0)return 0;
    const mult=G.Types?.mult?G.Types.mult(type,t.types):1;
    const damage=Math.max(1,Math.round(power*mult*100/(100+t.armor*(1-Math.min(.8,a.pierce)))));
    const absorbed=Math.min(t.shield,damage),lost=Math.min(t.hp,damage-absorbed);t.shield-=absorbed;t.hp=Math.max(0,t.hp-lost);a.damageDone+=lost;t.damageTaken+=lost;t.blocked+=absorbed;if(t.hp===0&&lost>0)a.kills++;
    t.flash=.16;t.mana=Math.min(100,t.mana+8);
    if(a.slow)t.slowUntil=b.time+2,t.slowPower=a.slow;
    b.events.push({kind:spell?'spell':'hit',from:a.id,to:t.id,sx:a.x,sy:a.y,tx:t.x,ty:t.y,type,move:spell?moveFor(a):null,periodic,amount:lost,absorbed,beat:b.beat,ttl:.45});
    // Reflection is a spell marked periodic: it cannot reflect again or replay a cast.
    if(!spell&&!periodic&&lost>0&&t.thorns&&a.side!==t.side&&a.hp>0&&distance(a,t)<=1)hit(b,t,a,lost*t.thorns,true,'steel',true);
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
  // Shared by Excadrill's entrance and mana move; never tunnels through allies.
  function drill(b,a,target,power) {
    const sx=a.x,sy=a.y,dx=target.x-sx,dy=target.y-sy,vx=Math.abs(dx)>Math.abs(dy)?Math.sign(dx):0,vy=vx?0:Math.sign(dy)||1;
    let landing={x:sx,y:sy},end={...landing};
    for(let i=1;i<=3;i++) {
      const x=sx+vx*i,y=sy+vy*i;
      if(x<0||x>=COLS||y<0||y>=ROWS||b.units.some(u=>u!==a&&u.side===a.side&&u.hp>0&&u.x===x&&u.y===y))break;
      end={x,y};for(const t of b.units.filter(u=>u.side!==a.side&&u.hp>0&&u.x===x&&u.y===y))hit(b,a,t,power,true,'ground');
      if(!b.units.some(u=>u!==a&&u.hp>0&&u.x===x&&u.y===y))landing={x,y};
    }
    a.x=landing.x;a.y=landing.y;a.moveCD=.35;
    b.events.push({kind:'drill',from:a.id,sx,sy,tx:end.x,ty:end.y,type:'ground',ttl:.6});
  }
  function isStunned(b,u) {return u.hp>0&&Number.isFinite(u.stunUntil)&&u.stunUntil>b.time;}
  function stun(b,a,t,duration) {
    // One shared boundary: no CC can be applied to the caster or its allies.
    if(a.side===t.side||t.hp<=0||!Number.isFinite(duration)||duration<=0)return false;
    if(t.boss)duration*=.5;
    const until=b.time+duration;
    if(until>(t.stunUntil||0)){t.stunUntil=until;t.stunSource=a.id;}
    b.events.push({kind:'stun',from:a.id,to:t.id,type:'electric',sx:a.x,sy:a.y,tx:t.x,ty:t.y,ttl:duration,life:duration});
    return true;
  }
  function shock(b,a,radius,duration,power) {
    const victims=b.units.filter(u=>u.side!==a.side&&u.hp>0&&distance(a,u)<=radius);
    areaEvent(b,a,a,radius,'ground',victims,true);
    for(const t of victims) {
      hit(b,a,t,power,true,'ground');
      stun(b,a,t,duration);
    }
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
    const victims=b.units.filter(u=>u.side!==a.side&&u.hp>0&&distance(center,u)<=area.radius);
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
    const foes=b.units.filter(u=>u.side!==a.side&&u.hp>0);
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
  function cast(b,a,target) {
    a.mana=0;b.events.push({kind:'cast',from:a.id,move:moveFor(a),to:target.id,sx:a.x,sy:a.y,tx:target.x,ty:target.y,beat:b.beat,ttl:.8});
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
      s.life=Math.max(0,s.life-Math.min(12,3+Math.floor(s.round/10)+b.units.filter(u=>u.side===1&&u.hp>0).length));
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
  function hasAttackPriority(a) {return !!a.galeWings&&a.hp>0&&a.hp>=a.maxHp;}
  function pulse(b) {
    b.beatCount=(b.beatCount||0)+1;b.beat=(b.beatCount-1)%4+1;b.beatStarted=b.time;
    // Both teams share one clock. Alternate cell/attack initiative each bar.
    const order=Math.floor((b.beatCount-1)/4)%2?[...b.units].reverse():b.units;
    if(b.beat===1||b.beat===3) {
      for(const a of order){if(a.hp<=0||isStunned(b,a))continue;const target=selectTarget(b,a);if(target)moveToward(b,a,target);}
      return;
    }
    // Choose attacks from the same pulse's initial formation, then resolve in order.
    const attacks=order.filter(a=>a.hp>0&&!isStunned(b,a)&&a.cooldown<=0)
      .map(a=>({a,target:selectTarget(b,a)})).filter(p=>p.target&&distance(p.a,p.target)<=p.a.range)
      .sort((p,q)=>Number(hasAttackPriority(q.a))-Number(hasAttackPriority(p.a)));
    for(const {a,target:chosen} of attacks) {
      if(a.hp<=0||isStunned(b,a))continue;
      const target=chosen.hp>0?chosen:selectTarget(b,a);if(!target||distance(a,target)>a.range)continue;
      // One basic strike per attack beat; speed changes strike power/mana instead
      // of creating off-beat attacks. Slow affects those same values temporarily.
      const rate=(2*BEAT_SECONDS)/a.interval*(a.slowUntil>b.time?1-a.slowPower:1);
      hit(b,a,target,a.attack*rate,false,a.basicType||a.types[0]);a.mana=Math.min(100,a.mana+(25+a.manaGain)*rate);
      a.cooldown=.25;
      if(a.hp>0&&a.mana>=100) {
        const alive=target.hp>0?target:selectTarget(b,a);
        if(alive&&distance(a,alive)<=a.range)cast(b,a,alive);
      }
    }
  }
  function step(s,dt) {
    const b=s.battle;b.time+=dt;b.opening=Math.max(0,(b.opening||0)-dt);b.events=b.events.filter(e=>(e.ttl-=dt)>0);
    for(const a of b.units) {
      a.flash=Math.max(0,a.flash-dt);if(a.hp<=0)continue;
      const regen=Math.max(0,Math.min(a.maxHp-a.hp,a.maxHp*a.regen*dt));a.hp+=regen;a.healingDone+=regen;
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
  const SAVE_VERSION=2;
  function serialize(s) {return JSON.stringify({version:SAVE_VERSION,state:s});}
  function restore(raw) {
    try {
      if(typeof raw!=='string'||raw.length>300000)return null;
      const data=JSON.parse(raw),s=data.state;
      const int=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
      const trained=u=>(u.promotion===undefined||int(u.promotion,0,6))&&(u.training===undefined||int(u.training,0,(TRAINING_COSTS[promotion(u)]||1)-1))&&(!promotion(u)||u.star===3)&&(!(u.training||0)||u.star===3)&&!(u.id<0&&promotion(u));
      const unit=u=>u&&trained(u)&&int(u.id,-6,100000)&&u.id!==0&&BY[u.dex]&&int(u.star,1,3)&&evolvedDex(u.dex,u.star)===u.dex&&
        (u.pos===null||int(u.pos,0,35));
      const numbers=o=>Object.values(o).every(v=>typeof v!=='number'||Number.isFinite(v)&&Math.abs(v)<1e12);
      if(![1,SAVE_VERSION].includes(data.version)||!s||!numbers(s)||!validDeck(s.deck,data.version===1)||!int(s.round,1,MAX_WAVE)||!int(s.level,3,6)||
        !int(s.seed,0,4294967295)||!int(s.nextId,1,100001)||!int(s.life,0,50)||!int(s.gold,0,999999999999)||!int(s.xp,0,20)||
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
      if(data.version===1){
        s.deck=migrateDeck(s.deck);s.completed=s.history.length;s.totals=aggregateReports(s.history.flatMap(h=>h.report.filter(u=>u.side===0)));s.recordId=String(s.seed);
        for(const u of s.units.filter(u=>BY[u.dex].bossOnly))s.gold=Math.min(1000000,s.gold+BY[u.dex].cost*3**(u.star-1));
        s.units=s.units.filter(u=>!BY[u.dex].bossOnly);s.shop=s.shop.map(d=>d&&BY[d].bossOnly?null:d);
        if(s.phase==='victory')s.phase='result';
        if(s.phase==='combat'){s.phase='planning';s.battle=null;s.result=null;}
        if(s.phase==='planning')prepareEnemy(s);
      } else if(!int(s.completed,0,MAX_WAVE)||!report(s.totals,ROSTER.length)||typeof s.recordId!=='string'||s.recordId.length>40)return null;
      // Rebalance cached planning encounters once; an active fight resumes intact.
      if(s.phase==='planning'&&s.balanceVersion!==1)prepareEnemy(s);
      s.encounter=waveInfo(s.round);s.effects=[];return s;
    } catch(_){return null;}
  }
  return {TRAINING_COSTS,rank,rankLabel,rankColor,unitCopies,trainingLabel,hasAttackPriority,isStunned,stun,serialize,restore,SAVE_VERSION,scout,entranceFor,COLS,ROWS,BENCH,BEAT_SECONDS,ROSTER,PLAYABLE_ROSTER,BOSS_DEFINITIONS,BY,DEFAULT_DECK,validDeck,migrateDeck,waveInfo,HISTORY_LIMIT,MAX_WAVE,evolvedDex,moveFor,abilityFor,preview,cast,report,AREA_MOVES,aiFor,selectTarget,XP,ODDS,EFFECTS,create,buy,place,sell,buyXP,reroll,traits,start,tick,next};
})();
