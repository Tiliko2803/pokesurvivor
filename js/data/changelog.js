/* ============ changelog.js — novedades del juego ============
 * Lo que ve la gente en el botón "Novedades" de la barra de arriba: cambios
 * de juego y fallos arreglados (nada de servidores ni bases de datos).
 * La fecha más nueva, arriba. En cada fecha, por apartados:
 *   new  lo nuevo · chg  cambios y ajustes · fix  fallos arreglados
 * Cada línea en español y en inglés.
 */
G.CHANGELOG = [
  { d: '2026-10-24', title: ['TFT: habilidades que cambian la pelea', 'TFT: tactical ability reworks'], chg: [
    ['Maushold encadena 10 impactos de Proliferación en tres pulsos; perder alcance o quedar aturdido desperdicia impactos. Aegislash convierte su Escudo Real en una estocada al siguiente pulso de ataque. Talonflame vuela a la retaguardia con Pájaro Osado y sufre retroceso. Greninja recorre hasta dos casillas por pulso de movimiento, respetando obstáculos.', 'Maushold chains 10 Population Bomb hits across three attack beats; stun or lost range wastes hits. Aegislash converts King’s Shield into a thrust on the next attack beat. Talonflame flies to the backline with Brave Bird and takes recoil. Greninja travels up to two cells per movement beat while respecting obstacles.']
  ] },
  { d: '2026-10-23', title: ['TFT: Tyrantrum y Haxorus', 'TFT: Tyrantrum and Haxorus'], new: [
    ['Llegan Axew → Fraxure → Haxorus por 2 de oro y Tyrunt → Tyrantrum por 3. Ambas familias tienen habilidad de entrada y tres movimientos. Rompemoldes permite perforar defensa; Mandíbula Fuerte aumenta el daño. Son adaptaciones para TFT. El catálogo alcanza 106 familias jugables.', 'Axew → Fraxure → Haxorus joins for 2 gold and Tyrunt → Tyrantrum for 3. Both families have an entry ability and three moves. Mold Breaker pierces defense; Strong Jaw boosts damage. These are TFT adaptations. The catalogue reaches 106 playable families.']
  ] },
  { d: '2026-10-23', title: ['TFT: 25 familias competitivas', 'TFT: 25 competitive families'], new: [
    ['El catálogo alcanza 104 familias jugables. Llegan Butterfree, Crobat, Slowbro, Jumpluff, Heracross, Skarmory, Medicham, Camerupt, Sableye, Roserade, Luxray, Hippowdon, Conkeldurr, Whimsicott, Galvantula, Meowstic, Dragalge, Hawlucha, Toxapex, Tsareena, Vikavolt, Hatterene, Grimmsnarl, Maushold y Ceruledge con sus preevoluciones disponibles.',
     'The catalogue reaches 104 playable families. Butterfree, Crobat, Slowbro, Jumpluff, Heracross, Skarmory, Medicham, Camerupt, Sableye, Roserade, Luxray, Hippowdon, Conkeldurr, Whimsicott, Galvantula, Meowstic, Dragalge, Hawlucha, Toxapex, Tsareena, Vikavolt, Hatterene, Grimmsnarl, Maushold and Ceruledge join with their available pre-evolutions.'],
    ['Diez cuestan 1 oro, nueve 2, cinco 3 y una 4. Son cinco apoyos de curación, cuatro tanques y dieciséis atacantes. Cada familia tiene habilidad de entrada y tres movimientos con efectos explícitos, adaptados a TFT. Espada Lamento de Ceruledge cura al usuario la mitad del daño efectivo a la vida enemiga, sin curar por escudos ni daño excesivo.',
     'Ten cost 1 gold, nine cost 2, five cost 3 and one costs 4. They include five healing supports, four tanks and sixteen attackers. Every family has an entry ability and three moves with explicit TFT-adapted effects. Ceruledge Bitter Blade heals its user for half the effective enemy HP damage, excluding shields and overkill.']
  ] },
  { d: '2026-10-23', title: ['TFT llega al Live', 'TFT goes live'], new: [
    ['TFT · Oleadas infinitas llega al menú principal con evoluciones, rangos de Bronce/Plata/Oro, mazos de diez familias, economía, jefes en solitario y resumen de expedición. Empiezas con cinco vidas y cada derrota, incluido el tiempo agotado, consume exactamente una.',
     'TFT · Endless Waves joins the main menu with evolutions, Bronze/Silver/Gold ranks, ten-family decks, economy, solo bosses and an expedition summary. Start with five lives; every loss, including a timeout, costs exactly one.'],
    ['Nueva categoría TFT · Oleadas en el ranking, ordenada por oleada alcanzada, con tablas diarias, semanales, mensuales e históricas y filtro de amigos. Participan expediciones nuevas iniciadas con tu cuenta. Las marcas sin conexión quedan pendientes y se reintentan. Invitados, pruebas y partidas anteriores conservan récord local.',
     'New TFT · Waves leaderboard category, ordered by wave reached, with daily, weekly, monthly and all-time tables and a friends filter. New expeditions started on your account participate. Offline scores queue and retry. Guests, previews and older games retain local records.']
  ] },
  { d: '2026-10-23', title: ['TFT: jefes en solitario', 'TFT: solo bosses'], chg: [
    ['Los jefes llegan solos, sin esbirros, y ocupan una posición más centrada. Su sprite es un 22% más grande; la entrada con zoom se conserva. Su multiplicador de vida pasa de ×3 a ×3,5 para compensar parte de los apoyos retirados, sin aumentar su daño. La preparación guardada se adapta; los combates en curso continúan intactos.',
     'Bosses arrive alone, without escorts, in a more central position. Their sprite is 22% larger and the zoom introduction remains. Their health multiplier rises from ×3 to ×3.5 to partly compensate for removed support, without increasing damage. Saved preparation adapts; ongoing fights remain intact.']
  ] },
  { d: '2026-10-23', title: ['TFT: cada jefe tiene su entrada', 'TFT: every boss makes an entrance'], new: [
    ['Presentaciones de jefe con zoom al Pokémon, banda de nombre inclinada y subtítulo propio. Duran 2,8 segundos, pueden saltarse y respetan pausa, velocidad y movimiento reducido. El combate y las habilidades de entrada esperan al final de la presentación; al volver a una partida guardada se conserva el punto de la secuencia.',
     'Boss introductions zoom onto the Pokémon with an angled name banner and a unique subtitle. They last 2.8 seconds, can be skipped and respect pause, speed and reduced motion. Combat and entry abilities wait until the introduction ends; saved games preserve the sequence position.'],
    ['Nuevo resumen de fin de expedición: oleada alcanzada, marca local, victorias, daño y curación acumulados, Pokémon con mayor daño y equipo final. Acceso directo a otra partida y al informe detallado; puedes volver a abrir el resumen.',
     'New expedition finale: wave reached, local best, wins, cumulative damage and healing, top damage Pokémon and final team. Direct access to a new game and the detailed report; the summary can be reopened.']
  ] },
  { d: '2026-10-23', title: ['TFT: Bronce, Plata y Oro', 'TFT: Bronze, Silver and Gold'], new: [
    ['Nueve rangos: las tres estrellas de Bronce mantienen las evoluciones; 3/4/5/6/7/8 copias adicionales desbloquean los seis rangos de Plata y Oro. Cada rango adicional multiplica vida y daño por 1,18. La ficha muestra el entrenamiento y vender devuelve todas las copias invertidas. Los enemigos conservan sus tres rangos actuales.',
     'Nine ranks: three Bronze stars keep evolutions; 3/4/5/6/7/8 additional copies unlock six Silver and Gold ranks. Each additional rank multiplies health and damage by 1.18. Unit details show training and selling refunds all invested copies. Enemies keep their existing three ranks.']
  ], chg: [
    ['Interés de +1 por cada 5 de oro ahorrados, sin máximo de +5. El ingreso base aumenta en 1 cada cinco oleadas, hasta 20; especiales dan 4 extra y jefes 10 más 2 por cada diez oleadas. Cada tienda ofrece un máximo de dos copias por familia y excluye las completadas en Oro de tres estrellas.',
     'Interest grants +1 per 5 saved gold, without the old +5 cap. Base income increases by 1 every five waves, up to 20; specials grant 4 extra and bosses 10 plus 2 per ten waves. Each shop offers at most two copies per family and excludes completed three-star Gold families.']
  ] },
  { d: '2026-10-23', title: ['TFT: oleadas más justas', 'TFT: fairer waves'], chg: [
    ['Máximo dos tanques enemigos por oleada, contando también su IA. Los tanques enemigos hacen un 20% menos de daño. La vida escala un 2,5% y el ataque un 1,5% por oleada, en lugar de un 3,5% ambos. Las dos estrellas empiezan en la oleada 6 y las tres en la 25, con progresión gradual. Los jefes mantienen su progresión propia.',
     'At most two enemy tanks per wave, including tank AI. Enemy tanks deal 20% less damage. Health scales by 2.5% and attack by 1.5% per wave, instead of 3.5% for both. Two stars start on wave 6 and three stars on wave 25, progressing gradually. Bosses keep their own progression.']
  ] },
  { d: '2026-10-23', title: ['TFT: supervivencia PvE infinita', 'TFT: endless PvE survival'], new: [
    ['El desafío de 12 rondas se convierte en oleadas infinitas: Enjambre, Vanguardia, Artillería, Bastión y Expedición, especiales cada 5 y jefes cada 10. Articuno, Zapdos, Moltres, Kyogre, Groudon y Rayquaza rotan como jefes. Hasta 6 enemigos y un sanador por encuentro; dificultad creciente.',
     'The 12-round challenge becomes endless waves: Swarm, Vanguard, Artillery, Bastion and Expedition, specials every 5 waves and bosses every 10. Articuno, Zapdos, Moltres, Kyogre, Groudon and Rayquaza rotate as bosses. Up to 6 enemies and one healer per encounter, with increasing difficulty.'],
    ['Récords locales por oleada alcanzada y PV restantes, preparación sin límite de tiempo, botín extra en especiales y jefes, y pérdida de hasta 12 PV por derrota. Los equipos se curan entre oleadas y el interés conserva su máximo de 5 oro. Los jefes reciben la mitad de duración de aturdimiento.',
     'Local records by wave reached and remaining HP, unlimited preparation time, extra loot for specials and bosses, and up to 12 HP lost per defeat. Teams heal between waves and interest remains capped at 5 gold. Bosses take half stun duration.']
  ], chg: [
    ['Los legendarios quedan reservados para los enemigos. Rayquaza sale del editor y la tienda; los mazos anteriores se ajustan y sus copias compradas se reembolsan. Las victorias antiguas permiten continuar; los combates antiguos vuelven a preparación al convertirse. El guardado de expediciones largas conserva el informe acumulado con un historial reciente limitado.',
     'Legendaries are reserved for enemies. Rayquaza leaves the editor and shop; older decks are adjusted and purchased copies are refunded. Old victories can continue; old active battles return to preparation on conversion. Long-run saves keep cumulative reports with a bounded recent history.'],
    ['Animaciones más cuidadas: impulso de ataque, retroceso al impacto, barras de vida con caída gradual, trazos de lanzamiento, destellos de impacto y distintivos de oleada especial y jefe. Se respetan pausa, velocidad, modo tranquilo y gráficos bajos.',
     'More polished animations: attack lunges, impact recoil, trailing health bars, casting effects, impact sparks and special-wave and boss badges. Pause, speed, calm mode and low graphics are respected.']
  ] },
  { d: '2026-10-23', title: ['TFT: Talonflame y Alas Vendaval', 'TFT: Talonflame and Gale Wings'], new: [
    ['La línea Fletchling → Fletchinder → Talonflame llega por 2 oro. Alas Vendaval da prioridad dentro de los pulsos de ataque mientras conserve toda la vida; perder vida la desactiva y curarse al máximo la recupera. La ficha muestra si está activa. Es una adaptación para TFT y respeta alcance y aturdimientos.',
     'The Fletchling → Fletchinder → Talonflame line joins for 2 gold. Gale Wings grants priority within attack beats while at full HP; losing HP disables it and healing to full restores it. The unit card shows whether it is active. This TFT adaptation respects range and stuns.'],
    ['Al entrar, Viento Afín aumenta la cadencia aliada un 8/12/16% durante 2 segundos según las estrellas, sin acumular multiplicadores. Básicos Voladores, Picotazo, Nitrocarga con quemadura y Pájaro Osado en área completan la familia. El roster alcanza 80 familias.',
     'On entry, Tailwind increases allied cadence by 8/12/16% for 2 seconds based on stars, without stacking multipliers. Flying basics, Peck, burning Flame Charge and area Brave Bird complete the family. The roster reaches 80 families.']
  ] },
  { d: '2026-10-23', title: ['TFT: familias por orden de Pokédex', 'TFT: families in Pokédex order'], chg: [
    ['El editor de mazos ordena las familias por el número de Pokédex de su Pokémon inicial, también al filtrar por precio.',
     'The deck editor sorts families by the Pokédex number of their starting Pokémon, including when filtering by price.']
  ] },
  { d: '2026-10-23', title: ['TFT: 25 familias y más opciones de un oro', 'TFT: 25 families and more one-gold options'], new: [
    ['El roster crece de 54 a 79 familias. Diez nuevas cuestan 1 oro: Nidoking, Clefable, Arcanine, Poliwrath, Azumarill, Breloom, Emboar, Chesnaught, Rillaboom y Corviknight con sus preevoluciones. Otras ocho cuestan 2, cinco cuestan 3 y dos cuestan 4.',
     'The roster grows from 54 to 79 families. Ten new families cost 1 gold: Nidoking, Clefable, Arcanine, Poliwrath, Azumarill, Breloom, Emboar, Chesnaught, Rillaboom and Corviknight with their pre-evolutions. Eight more cost 2, five cost 3 and two cost 4.'],
    ['Se completan los 27 iniciales de las nueve generaciones. También llegan Weavile, Snorlax, Aggron, Rotom, Ferrothorn, Chandelure, Aegislash y Archaludon. Todas las familias tienen entrada propia y movimientos para sus tres niveles. Rotom mantiene su forma base al potenciarse.',
     'All 27 regional starters across nine generations are represented. Weavile, Snorlax, Aggron, Rotom, Ferrothorn, Chandelure, Aegislash and Archaludon also join. Every family has its own entrance and moves at all three ranks. Rotom keeps its base form when empowered.'],
    ['Puntas de Acero de Ferrothorn devuelve parte del daño de ataques básicos adyacentes, sin cadenas de reflejo; Descanso de Snorlax lo cura y limpia sus estados. Las habilidades son adaptaciones para TFT y sus fichas describen el efecto real.',
     'Ferrothorn Steel Spikes returns some damage from adjacent basic attacks without reflection chains; Snorlax Rest heals itself and clears its statuses. Abilities are TFT adaptations and their cards describe the actual effects.']
  ] },
  { d: '2026-10-23', title: ['TFT: volver a jugar al terminar', 'TFT: start again after a finished match'], fix: [
    ['Nueva partida queda junto al tablero, accesible al terminar y al recuperar una victoria o derrota guardada. Ya no está escondida dentro de Equipo y Opciones. Reinicia la partida TFT y conserva tus mazos.',
     'New match sits beside the board, accessible after finishing and when restoring a saved victory or defeat. It is no longer hidden inside Team and Options. It resets the TFT match while keeping your decks.']
  ] },
  { d: '2026-10-23', title: ['TFT: veinte familias nuevas', 'TFT: twenty new evolution families'], new: [
    ['El roster crece de 34 a 54 familias, repartidas entre las nueve generaciones. Se suman Gyarados, Dragonite, Typhlosion, Feraligatr, Sceptile, Milotic, Torterra, Infernape, Empoleon, Garchomp, Serperior, Samurott, Hydreigon, Greninja, Goodra, Decidueye, Incineroar, Kommo-o, Dragapult y Baxcalibur con sus preevoluciones.',
     'The roster grows from 34 to 54 families across all nine generations. Gyarados, Dragonite, Typhlosion, Feraligatr, Sceptile, Milotic, Torterra, Infernape, Empoleon, Garchomp, Serperior, Samurott, Hydreigon, Greninja, Goodra, Decidueye, Incineroar, Kommo-o, Dragapult and Baxcalibur join with their pre-evolutions.'],
    ['Cada familia tiene habilidades adaptadas a TFT, movimientos en sus tres niveles y una entrada propia: barreras, oleadas, quemaduras, ralentizaciones, perforación y control. Magikarp se protege; al evolucionar, Gyarados intimida y lanza una oleada. La intimidación compartida con Salamence e Incineroar no se acumula.',
     'Each family has TFT-adapted abilities, moves at all three ranks and its own entrance: barriers, waves, burns, slows, piercing and control. Magikarp protects itself; after evolving, Gyarados intimidates and launches a wave. Intimidation shared with Salamence and Incineroar does not stack.']
  ] },
  { d: '2026-10-23', title: ['TFT: más entradas activas y CC más claro', 'TFT: more active entrances and clearer crowd control'], new: [
    ['Entradas activas para las familias de Charizard, Blastoise, Raichu, Gengar, Gardevoir, Metagross, Lapras, Tyranitar y Swampert: fuego, oleadas, descargas, sombra, barreras, meteoros y arena. Se suman a la entrada sísmica de Excadrill; mejoran con estrellas y respetan el alcance y los bandos.',
     'Active entrances for the Charizard, Blastoise, Raichu, Gengar, Gardevoir, Metagross, Lapras, Tyranitar and Swampert families: fire, waves, sparks, shadow, barriers, meteors and sand. They join Excadrill seismic entrance, scale with stars and respect range and teams.']
  ], fix: [
    ['La presentación de habilidades ya no pausa a todos: el combate empieza de inmediato. El CC se identifica con una marca propia, duración y autor en la ficha. Las zonas de aturdimiento resaltan sólo a enemigos afectados, sin pintar aliados como objetivos.',
     'Ability presentation no longer pauses everyone: combat starts immediately. CC has its own marker, remaining duration and source in the unit card. Stun zones highlight affected enemies only, without marking allies as targets.'],
    ['Todos los aturdimientos pasan por una comprobación común que rechaza aliados y al lanzador. Un Pokémon aturdido durante el pulso tampoco puede ejecutar un ataque que ya estuviese preparado.',
     'All stuns pass a shared check that rejects allies and the caster. A Pokémon stunned during a beat cannot execute a strike already queued for that beat.']
  ] },
  { d: '2026-10-23', title: ['TFT: tablero siempre visible', 'TFT: keep the board in view'], chg: [
    ['Nueva disposición de TFT: tablero fijo y paneles de Tienda, Equipo, Ficha, Rival e Informe con desplazamiento independiente. En vertical los paneles van debajo y en horizontal al lado. Puedes ocultarlos para despejar el tablero.',
     'New TFT layout: a fixed board with independently scrolling Shop, Team, Unit, Opponent and Report panels. Panels sit below in portrait and beside the board in landscape. Hide them for a clearer arena.'],
    ['Durante el combate los paneles se recogen; tocar una unidad abre su ficha. El informe aparece al acabar la ronda. Avisos de evolución y habilidades de entrada quedan sobre el tablero sin mover los controles.',
     'Panels collapse during combat; tapping a unit opens its card. The report appears at round end. Evolution and entrance notices overlay the board without shifting the controls.']
  ] },
  { d: '2026-10-23', title: ['TFT: animaciones del Survivor', 'TFT: Survivor attack animations'], chg: [
    ['TFT reutiliza los sprites pixel art de ataque del Survivor: llamas, burbujas, electricidad, hielo, garras, impactos, curaciones y meteoros. Rayos y perforaciones tienen estelas; las áreas conservan las casillas afectadas.',
     'TFT reuses Survivor pixel-art attack sprites: flames, bubbles, electricity, ice, claws, impacts, healing and meteors. Beams and drills have trails; areas retain their affected-cell highlights.'],
    ['Los Pokémon usan sus poses disponibles de carga, ataque, disparo y daño, precargadas antes de combatir. Una habilidad de área reproduce una sola acción; las quemaduras no hacen repetir la animación del lanzador. Pausa, velocidad doble, gráficos bajos y modo tranquilo se respetan.',
     'Pokémon use their available charge, attack, shoot and hurt poses, preloaded before combat. An area ability plays one action; burns do not restart caster animations. Pause, double speed, low graphics and calm mode are respected.']
  ] },
  { d: '2026-10-23', title: ['TFT: entrada sísmica y sprites de frente', 'TFT: seismic entrance and front-facing sprites'], chg: [
    ['Drilbur y Excadrill son iniciadores de control: Entrada Sísmica se activa al comenzar cada combate. Excadrill perfora hasta 3 casillas y aturde alrededor del aterrizaje; radio y duración mejoran con estrellas. Sus movimientos de maná también aturden al aterrizar.',
     'Drilbur and Excadrill initiate crowd control: Seismic Entrance activates at the beginning of each battle. Excadrill drills up to 3 cells and stuns around its landing; radius and duration improve with stars. Its mana moves also stun on landing.'],
    ['Los sprites del editor de mazos, tienda, banquillo y anuncio de evolución miran de frente. En combate siguen orientándose hacia sus objetivos.',
     'Deck editor, shop, bench and evolution announcement sprites face the viewer. Combat units continue facing their targets.']
  ] },
  { d: '2026-10-23', title: ['TFT: habilidades para todas las familias', 'TFT: abilities for every family'], new: [
    ['Las 34 familias tienen habilidades de entrada propias y movimientos definidos en sus tres niveles, sin depender del movimiento genérico de su rol. Las fichas muestran el tipo y efecto de cada movimiento.',
     'All 34 families have named entrance abilities and moves defined at all three ranks, without relying on generic role moves. Cards show the actual move type and effect.'],
    ['Efectos especiales para Eevee/Vaporeon, Lucario, Lapras, Tyranitar, Swampert, Salamence, Tinkaton y Rayquaza, además de las doce familias ya personalizadas: protección de aliados, maná compartido, remates, perforación, aturdimientos y cadencia temporal.',
     'Special effects for Eevee/Vaporeon, Lucario, Lapras, Tyranitar, Swampert, Salamence, Tinkaton and Rayquaza, alongside the twelve previously customized families: ally protection, shared mana, finishers, piercing, stuns and temporary speed.']
  ] },
  { d: '2026-10-23', title: ['TFT: habilidades de entrada, guardado y exploración', 'TFT: entrance abilities, saves and scouting'], new: [
    ['Habilidades de entrada visibles antes del primer pulso: escudos, maná y bonos propios para cada familia. Los movimientos cargados conservan su activación con 100 de maná. Fichas separadas con el efecto y momento de activación.',
     'Visible entrance abilities before the first beat: shields, mana and family bonuses. Charged moves still activate at 100 mana. Separate cards explain each effect and its trigger.'],
    ['Guardado automático local de la partida, incluso en combate. Al volver, el combate queda en pausa; conserva oro, tienda, posiciones, rival e informes.',
     'Local automatic match saves, including combat. Returning to a battle pauses it; gold, shop, formation, opponent and reports are preserved.'],
    ['Explora el rival antes de luchar: formación real en el tablero, roles, sinergias y ficha de habilidades. Comprar o mover aliados no cambia el rival.',
     'Scout the next opponent: actual board formation, roles, synergies and ability cards. Buying or moving allies does not reroll the enemy.'],
    ['Movimientos propios para Venusaur, Raichu, Machamp, Meganium, Blaziken y Alakazam: drenaje, rayos encadenados, ruptura de escudos, limpieza de equipo, impulso temporal y rayos perforantes. Ya son 12 familias con movimientos únicos.',
     'Signature moves for Venusaur, Raichu, Machamp, Meganium, Blaziken and Alakazam: drain, chain lightning, shield breaking, team cleansing, temporary speed boosts and piercing beams. Twelve families now have unique moves.']
  ] },
  { d: '2026-10-22', title: ['TFT: compás, informe y más especies', 'TFT: rhythm, battle report and more species'], new: [
    ['Compás común de cuatro pulsos: salto y avance, ataque, movimiento, ataque. Cada pulso dura medio segundo; la velocidad de ataque aumenta potencia y maná por golpe sin romper el ritmo.',
     'Shared four-beat rhythm: hop and advance, attack, move, attack. Each beat lasts half a second; attack speed increases strike power and mana without breaking the rhythm.'],
    ['Informe al terminar cada ronda: daño, curación, escudos concedidos y daño bloqueado de ambos equipos; acumulado de la partida por línea evolutiva.',
     'End-of-round report: damage, healing, granted shields and blocked damage for both teams; match totals grouped by evolution family.'],
    ['34 líneas disponibles: se suman Sandshrew, Weedle, Mareep, Geodude, Lotad, Spheal, Happiny, Onix, Bagon y Tinkatink con sus evoluciones.',
     '34 available families: Sandshrew, Weedle, Mareep, Geodude, Lotad, Spheal, Happiny, Onix, Bagon and Tinkatink join with their evolutions.'],
    ['Daño en área por movimiento: Terremoto, Terratemblor, Fuerza Telúrica, Agua Lodosa, Ventisca, Chispazo, Cometa Draco y Martillo Colosal, entre otros. Las casillas afectadas se iluminan; los aliados no reciben daño.',
     'Move-specific area damage for Earthquake, Bulldoze, Earth Power, Muddy Water, Blizzard, Discharge, Draco Meteor and Gigaton Hammer, among others. Affected cells light up; allies take no damage.']
  ] },
  { d: '2026-10-22', title: ['TFT: mazos, evoluciones y habilidades propias', 'TFT: decks, evolutions and signature abilities'], new: [
    ['Intereses de TFT: cada 5 de oro ahorrados dan +1 por ronda, con un máximo de +5 al ahorrar 25.',
     'TFT interest: every 5 saved gold grants +1 per round, capped at +5 when saving 25.'],
    ['Tres mazos locales de diez líneas evolutivas. Elige entre las 24 familias; la tienda sólo ofrece las de tu mazo. Puedes consultar las líneas elegidas durante la partida.',
     'Three local decks of ten evolution families. Choose from the 24 families; the shop only offers your chosen lines. Inspect your deck during a match.'],
    ['Animación al evolucionar, desplazamiento suave, proyectiles por tipo, escudos visibles y ficha de vida, daño, defensa, maná, habilidad y sinergias al tocar unidades, también durante el combate.',
     'Evolution animations, smooth movement, type-colored projectiles, visible shields and a unit inspector for HP, damage, armor, mana, ability and synergies, including during combat.'],
    ['Habilidades propias para las líneas de Charizard, Blastoise, Excadrill, Gengar, Gardevoir y Metagross: quemaduras, empujes, perforación, robo de vida, curación con limpieza y aturdimiento en zona. Cambian al evolucionar.',
     'Signature abilities for the Charizard, Blastoise, Excadrill, Gengar, Gardevoir and Metagross families: burns, knockback, piercing, life drain, healing with cleansing and area stun. Abilities change on evolution.']
  ] },
  { d: '2026-10-22', title: ['Estadísticas al terminar la partida', 'End-of-run statistics'], new: [
    ['Al terminar una partida también puedes ver el daño y DPS de cada movimiento, estadísticas finales, objeto y cartas. El resumen guarda los valores justo al terminar y se puede desplazar en móvil.',
     'At the end of a run you can also see damage and DPS per move, final stats, held item and cards. The summary captures values at the moment the run ends and scrolls on mobile.']
  ] },
  { d: '2026-10-22', title: ['TFT · Evoluciones (alpha)', 'TFT · Evolutions (alpha)'], new: [
    ['Modo individual de 12 rondas con tienda, oro propio, banquillo, posiciones tácticas y combates automáticos. 24 familias de Pokémon; tres copias se fusionan y evolucionan con nuevo sprite, tipos y movimiento. Sinergias de 2/4 familias por tipo, experiencia y límite de equipo. Interfaz táctil, pausa y velocidad doble. Partida local de sesión, sin recompensas ni cambios al progreso del Survivor.',
     'A 12-round solo mode with a shop, separate gold, bench, tactical positioning and automatic battles. 24 Pokémon families; three copies merge and evolve with new sprites, types and moves. Type synergies at 2/4 families, experience and team limits. Touch interface, pause and double speed. Local session matches, with no rewards or changes to Survivor progression.']
  ] },
  { d: '2026-10-20', title: ['Una frase sorpresa en el menú', 'A surprise line on the menu'], new: [
    ['32 frases cortas sobre Arceus, los curanderos, las builds y la panadería de Tiliko. Cada visita al juego elige una; conserva la misma al volver al menú y evita repetir la anterior cuando es posible.',
     '32 short lines about Arceus, healers, builds and Tiliko’s bakery. Each visit chooses one; returning to the menu keeps it, and the previous line is avoided when possible.']
  ] },
  { d: '2026-10-20', title: ['Estadísticas, nuevos ataques y combates más claros', 'Stats, new moves and clearer battles'], new: [
    ['Ataque físico/especial y ambas defensas para todos los Pokémon. Danza Espada y Danza Dragón refuerzan el daño físico; Maquinación refuerza el especial. Las cartas muestran la categoría y favorecen el lado fuerte de tu compañero. Las danzas personalizadas conservan sus evoluciones y su cadencia.',
     'Physical/special attack and both defenses for every Pokémon. Swords Dance and Dragon Dance boost physical damage; Nasty Plot boosts special damage. Cards show categories and favor your partner’s stronger side. Custom dances retain their evolutions and attack speed.'],
    ['Nuevas familias de ataques del original: disparos que persiguen o rebotan, rayos cargados, giros, ondas de tierra, remolinos y aturdimientos. Juego Rudo conserva nuestra evolución física a Beso Drenaje y Mega Tinkaton conserva Potencia.',
     'New move families from the original: homing and bouncing shots, charged beams, spins, ground waves, vortexes and stuns. Play Rough retains our physical Draining Kiss evolution and Mega Tinkaton retains Huge Power.'],
    ['Movimiento inicial: mejora de 400 monedas por Pokémon para escoger su ataque de inicio, incluido su ataque original. Repertorio sigue eligiendo el segundo; las megas conservan su ataque exclusivo Nv. 2.',
     'Starting move: a 400-coin upgrade per Pokémon to choose its first move, including its default. Repertoire still chooses the second; Megas retain their exclusive level-2 move.'],
    ['La pausa muestra daño y DPS por movimiento, estadísticas, objeto y cartas. Las cartas nuevas de nivel, vínculo y objeto tienen una protección de 0,6 segundos contra selecciones accidentales.',
     'Pause shows damage and DPS per move, stats, held item and cards. New level, bond and item cards have a 0.6-second guard against accidental picks.']
  ], chg: [
    ['Como máximo aparecen tres curanderos, tres escuderos y tres invocadores a la vez. Las curas y escudos de los jefes dependen del daño reciente que reciben; no pueden renovar escudo más de una vez cada seis segundos.',
     'At most three healers, three shielders and three summoners spawn at once. Boss healing and shields depend on recently received damage; shields cannot refresh more than once every six seconds.'],
    ['Los monotipos hacen un 20% más de daño con su propio tipo. Aprender un ataque conserva el movimiento activo. Los Pokémon grandes normales tienen tamaño ajustado y colisión limitada; el arte de megas y personajes especiales conserva su tamaño.',
     'Single-type Pokémon deal 20% more damage with their own type. Learning a move keeps the current move active. Large normal Pokémon have adjusted size and capped collisions; Mega and special-character artwork keeps its size.'],
    ['Sentencia de Arceus: límite suave de velocidad, legendarios más rápidos y contacto creciente hacia el minuto 40. El veneno sigue escalando con la vida, pero crece más despacio por encima de 60.000 PV.',
     'Judgment of Arceus: a soft speed cap, faster legendaries and increasing contact damage towards minute 40. Poison still scales with HP but grows more slowly above 60,000 HP.']
  ], fix: [
    ['En cooperativo los jefes vuelven cerca si quedan perdidos lejos del grupo; no aparecen junto a un compañero que todavía está regresando de una grieta. Los remolinos y aturdimientos nuevos también funcionan para invitados.',
     'In co-op, lost bosses return near the group and do not spawn next to a teammate still returning from a rift. New vortexes and stuns also work for guests.']
  ] },
  { d: '2026-10-20', title: ['Apuntado manual y mando', 'Manual aiming and gamepad'], new: [
    ['Activa Apuntar a mano en Ajustes > Accesibilidad: apunta con el ratón o el stick derecho. Al soltar el stick vuelve el apuntado automático; cadena y meteoros conservan sus blancos. En móvil aparece un segundo joystick para apuntar mientras te mueves; puedes recolocarlo desde Controles.',
     'Enable manual aiming in Settings > Accessibility: aim with the mouse or right stick. Releasing the stick restores automatic aim; chains and meteors keep their targets. Mobile adds a second aim stick while moving; reposition it under Controls.'],
    ['Soporte de mando: stick izquierdo o cruceta para moverte, LB/RB para cambiar de ataque y Start para pausar. También puedes navegar los menús. Ajustes de mando y vibración en Controles.',
     'Gamepad support: move with the left stick or D-pad, switch attacks with LB/RB and pause with Start. Menus support gamepad navigation. Controller and rumble settings are under Controls.']
  ] },
  { d: '2026-10-18', title: ['Una entrada para las megas', 'A Mega entrance'], chg: [
    ['Símbolo de megaevolución ajustado a la referencia: silueta curva en S, aberturas diagonales, extremos triangulares y degradado arcoíris.',
     'Mega Evolution symbol matched to the reference: curved S silhouette, diagonal openings, triangular ends and a rainbow gradient.'],
    ['Las megas jugables presentan una transformación de 2,4 s al comenzar en solitario: acercamiento, energía arcoíris, capullo de cristal y ruptura. El combate y sus relojes esperan; conserva vida, mejoras y ataques. Compatible con la opción de menos sacudidas y destellos.',
     'Playable Megas now transform during a 2.4 s solo intro: zoom, rainbow energy, a crystal cocoon and a shattering reveal. Combat and its clocks wait; HP, upgrades and moves remain intact. Supports reduced shake and flashes.']
  ] },
  { d: '2026-10-18', title: ['Juego Rudo: cuerpo a cuerpo de Hada', 'Play Rough: physical Fairy combat'], new: [
    ['Juego Rudo añade un ataque físico de Hada en arco, con empuje y mejoras hasta nivel 5. Los Pokémon Hada pueden aprenderlo y Mega Tinkaton aprovecha Potencia. Se usa el nombre de Latinoamérica.',
     'Play Rough adds a physical Fairy attack in an arc, with knockback and upgrades through level 5. Fairy Pokémon can learn it and Mega Tinkaton benefits from Huge Power. The Latin American Spanish move name is used.'],
    ['Juego Rudo Nv. 5 evoluciona con Síntesis a Beso Drenaje: conserva el tipo Hada y la categoría física, gana daño y alcance, y cura un 2% de vida máxima al conectar. La curación ocurre una vez por ataque, con un máximo de dos activaciones por segundo; los golpes al aire, objetos y copias visuales de compañeros no curan.',
     'Level 5 Play Rough evolves with Synthesis into Draining Kiss: it retains its Fairy type and physical category, gains damage and reach, and heals 2% max HP on a hit. Recovery occurs once per attack, capped at two activations per second; misses, props and teammates’ visual copies do not heal.']
  ] },
  { d: '2026-10-18', title: ['Mega Tinkaton y su Martillo Colosal', 'Mega Tinkaton and Gigaton Hammer'], new: [
    ['Mega Tinkaton llega con el diseño personalizado de ivi.etz: armadura de plumas oscuras, cabello crema y un enorme martillo inspirado en Corviknight. Cuatro hojas propias animan movimiento, martillazos, lanzamiento, concentración, daño y caída en ocho direcciones.',
     'Mega Tinkaton arrives with ivi.etz’s custom design: dark feather armor, cream hair and an enormous Corviknight-inspired hammer. Four dedicated sheets animate movement, hammer swings, casting, focus, hurt and fainting in eight directions.'],
    ['Tinkatonita: vence tres jefes en una sola partida individual con Tinkaton normal y equípala desde el menú. La mega empieza con Martillo Colosal Nv. 2, exclusivo de Tinkaton, que puede evolucionar a Martillo Devastador.',
     'Tinkatonite: defeat three bosses in one solo run with normal Tinkaton and equip it from the menu. The mega starts with its exclusive Gigaton Hammer at level 2, which can evolve into Devastating Hammer.'],
    ['Estadísticas base: 85 PS, 140 Ataque, 97 Defensa, 70 Ataque Especial, 120 Defensa Especial y 94 Velocidad. Potencia duplica el daño físico final después de cartas y mejoras; los movimientos especiales usan su Ataque Especial sin recibir ese multiplicador.',
     'Base stats: 85 HP, 140 Attack, 97 Defense, 70 Sp. Atk, 120 Sp. Def and 94 Speed. Huge Power doubles final physical damage after cards and upgrades; special moves use Sp. Atk without that multiplier.']
  ] },
  { d: '2026-10-18', title: ['Hoenn Normal llega al juego', 'Hoenn Normal is live'], new: [
    ['Boss Rush · Hoenn ya está disponible desde Jugar. Supera a los tres Regis, Groudon, Latios y Latias, Kyogre, Jirachi y Rayquaza con tu Pokémon equipado, sus movimientos y sus mejoras compradas. Empiezas en nivel 8 con siete elecciones iniciales.',
     'Boss Rush · Hoenn is now available under Play. Face the three Regis, Groudon, Latios and Latias, Kyogre, Jirachi and Rayquaza using your equipped Pokémon, its moves and purchased upgrades. Start at level 8 with seven preparation choices.']
  ], chg: [
    ['El menú oficial sólo muestra la ruta completa: sin selector extra de Pokémon, dinero gratuito, mejoras al máximo ni acceso directo a Jirachi. Las Pokémonedas ganadas se guardan; los tiempos y niveles quedan fuera de los récords y rankings de supervivencia. Hoenn Normal se juega en solitario.',
     'The official menu shows the full route, without an extra Pokémon selector, free money, max-upgrade tools or a direct Jirachi test. Earned coins are saved; times and levels stay separate from survival records and rankings. Hoenn Normal is single-player.']
  ] },
  { d: '2026-10-18', title: ['Una portada para Hoenn Normal', 'Hoenn Normal gets its cover'], chg: [
    ['El selector del Boss Rush de pruebas estrena una portada en pixel art del trío de Hoenn y una preparación más clara. El recorrido, las instrucciones y las herramientas de mejoras se pueden desplegar; Jirachi conserva su acceso directo.',
     'The preview Boss Rush selector features pixel-art Hoenn trio cover art and a clearer preparation layout. The route, instructions and upgrade tools can be expanded; Jirachi keeps its direct test button.']
  ] },
  { d: '2026-10-18', title: ['Jirachi directo y ruta fija de Hoenn', 'Direct Jirachi test and fixed Hoenn route'], chg: [
    ['Jirachi es el único encuentro entre Kyogre y Rayquaza. Deoxys queda reservado para después. Jirachi entrega seis niveles base de experiencia para conservar la progresión hacia el combate final.',
     'Jirachi is the only encounter between Kyogre and Rayquaza. Deoxys is reserved for later. Jirachi grants six base levels of XP to preserve progression toward the final battle.']
  ], new: [
    ['El botón Probar solo a Jirachi permite entrar directamente en nivel 25, con 24 mejoras de preparación y dos Vínculos disponibles. Al vencerlo termina la prueba; puedes conservar tu selección de Pokémon, movimientos y mejoras de oro.',
     'The Test Jirachi only button starts directly at level 25, with 24 preparation choices and two available Bonds. Defeating Jirachi ends the test; your selected Pokémon, moves and gold upgrades are used.']
  ] },
  { d: '2026-10-18', title: ['Jirachi abre el observatorio de los deseos', 'Jirachi opens the wish observatory'], new: [
    ['Jirachi tiene un combate propio en la prueba de Hoenn con Deseo Oculto, Rapidez, Foco Resplandor y Psíquico. Sus fases cambian al 70% y 35%: primero ataques individuales, después hasta dos movimientos desfasados y finalmente avisos más rápidos.',
     'Jirachi has a dedicated Hoenn preview encounter with Doom Desire, Swift, Flash Cannon and Psychic. Phases change at 70% and 35%: single attacks first, then up to two staggered moves, followed by faster warnings.'],
    ['Deseo Oculto conserva 2.5 segundos de aviso en la fase 2; al terminar sus ataques pendientes deja una ventana para contraatacar. Las estrellas y el anillo psíquico dañan con sus posiciones visibles. Estrena arena de constelaciones y efectos en píxeles dorados, plateados y violetas.',
     'Doom Desire keeps a 2.5-second warning in phase two; after pending attacks finish, Jirachi leaves a counterattack window. Stars and the psychic ring deal damage at their visible positions. The fight features a constellation arena and gold, silver and violet pixel effects.']
  ], chg: [
    ['Jirachi tiene 600000 o 900000 PV base según su posición después de Kyogre. La referencia con Deoxys normal ronda 1–2 minutos; una Mega Blaziken optimizada gana bastante antes. Se conservan las recompensas de menor, sin Vínculo.',
     'Jirachi has 600,000 or 900,000 base HP depending on its slot after Kyogre. The normal Deoxys reference lasts around 1–2 minutes; optimized Mega Blaziken wins substantially faster. Minor rewards are preserved, without a Bond.']
  ] },
  { d: '2026-10-18', title: ['Los mayores desincronizan sus ataques', 'Major bosses stagger their attacks'], chg: [
    ['Groudon, Kyogre y Rayquaza tienen enfriamientos y desfases independientes por movimiento en la prueba del Boss Rush. Pueden preparar un ataque mientras otro sigue en curso, con hasta uno, dos o tres movimientos según la fase y separación entre avisos e impactos.',
     'Groudon, Kyogre and Rayquaza have independent move cooldowns and offsets in the Boss Rush preview. They can prepare a move while another is still running, with up to one, two or three moves by phase and spacing between warnings and impacts.'],
    ['Los avisos ya visibles conservan su duración y posición. Las combinaciones comprueban rutas alcanzables, incluso con ralentización; Terremoto, Pulso Primigenio y Cometa Draco conservan sus lanzamientos exclusivos y sus recuperaciones.',
     'Visible warnings keep their duration and position. Combinations check reachable escape routes, including slowed players; Earthquake, Origin Pulse and Draco Meteor retain exclusive casts and recovery windows.']
  ] },
  { d: '2026-10-18', title: ['El Dúo Eón llega al Boss Rush', 'The Eon Duo joins Boss Rush'], new: [
    ['Latios y Latias luchan juntos después de Groudon en la prueba de Hoenn Normal, con 190000 PV base por Pokémon. Comparten Cabezazo Zen, Pulso Dragón y Psíquico: Latios persigue de cerca y Latias mantiene distancia. Sus ataques tienen avisos fijos, relojes desfasados y efectos de píxeles propios.',
     'Latios and Latias fight together after Groudon in the Normal Hoenn preview, with 190,000 base HP each. They share Zen Headbutt, Dragon Pulse and Psychic: Latios pursues up close and Latias keeps her distance. Their attacks have fixed warnings, staggered clocks and dedicated pixel effects.'],
    ['Cada uno tiene su barra de vida; al caer uno, la barra restante se amplía. La recompensa llega al vencer a ambos: seis niveles base de experiencia y una curación del 20%, sin Vínculo. Jirachi y Deoxys conservan sus encuentros individuales después de Kyogre.',
     'Each has an independent health bar; when one falls, the remaining bar expands. Defeating both grants six base levels of XP and one 20% heal, without a Bond. Jirachi and Deoxys retain their individual encounters after Kyogre.']
  ] },
  { d: '2026-10-18', title: ['Los Tres Guardianes abren Hoenn', 'The Three Guardians open Hoenn'], new: [
    ['Regirock, Regice y Registeel luchan juntos antes de Groudon en la prueba de Hoenn Normal. Cada uno tiene 44000 PV base por jugador y su barra independiente dentro del ancho habitual. Al caer, la barra tiembla, se deforma y desaparece; las restantes se recolocan.',
     'Regirock, Regice and Registeel fight together before Groudon in the Normal Hoenn preview. Each has 44,000 base HP per player and an independent bar within the usual total width. Defeated bars shake, twist and fade; the remaining bars reflow.'],
    ['Regirock crea rocas temporales con Tumba Rocas y Avalancha; Regice ralentiza con Rayo Hielo y Viento Hielo; Registeel usa Foco Resplandor y Garra Metal. Cada movimiento tiene enfriamiento y desfase propios, con como máximo dos ataques simultáneos y salidas comprobadas para esquivar.',
     'Regirock creates temporary rocks with Rock Tomb and Rock Slide; Regice slows with Ice Beam and Icy Wind; Registeel uses Flash Cannon and Metal Claw. Each move has its own cooldown and offset, with at most two concurrent attacks and verified escape routes.']
  ], chg: [
    ['El grupo sustituye los dos menores iniciales y entrega experiencia de dos niveles base y una curación del 20% al vencer a los tres. No hay recompensa parcial ni Vínculo de los Regis; los mayores conservan sus Vínculos. Los cuatro menores posteriores no repiten a los guardianes.',
     'The group replaces the two opening minors and grants two base levels of XP and one 20% heal after all three fall. Regis grant no partial reward or Bond; majors retain their Bonds. The four later minors do not repeat the guardians.']
  ] },
  { d: '2026-10-18', title: ['Hoenn también en los menores', 'Hoenn minor legends too'], chg: [
    ['El Boss Rush de Hoenn sortea seis menores distintos entre Regirock, Regice, Registeel, Latias, Latios, Jirachi y Deoxys. Los dos singulares se incluyen en este grupo de combate; queda uno fuera al azar en cada intento. Se conserva la dificultad por tramo de la prueba.',
     'The Hoenn Boss Rush draws six distinct minors from Regirock, Regice, Registeel, Latias, Latios, Jirachi and Deoxys. The two Mythical Pokémon are included in this encounter group; one is randomly left out each attempt. Preview difficulty by route slot is preserved.']
  ] },
  { d: '2026-10-18', title: ['Los menores abren el Boss Rush', 'Minor legends open Boss Rush'], chg: [
    ['La prueba de Hoenn empieza con dos legendarios menores antes de Groudon: nueve combates y seis menores distintos durante toda la ruta. Los dos iniciales dan un nivel base de experiencia cada uno; después se conservan las recompensas de tres niveles y los bonos nativos.',
     'The Hoenn preview starts with two minor legends before Groudon: nine encounters and six distinct minors throughout the route. Each opening minor grants one base level of XP; later fights retain three-level rewards and native bonuses.'],
    ['Los menores tienen mucha más vida según el tramo, más daño y entre un 12% y un 35% más de cadencia. Se calibran para 1–2 minutos frente a una referencia potente de Mega Blaziken; la build, los tipos y la ejecución siguen afectando la duración.',
     'Minors have much more health by route slot, more damage and 12%–35% faster attack cadence. They target 1–2 minutes against a strong Mega Blaziken reference; build, typing and execution still affect duration.'],
    ['Conservan los patrones y avisos normales de PokéSurvivor. Sólo los mayores dan Vínculo; la vida de todos sigue multiplicándose por el equipo inicial. Cambios exclusivos de la versión de pruebas.',
     'They retain normal PokéSurvivor patterns and warnings. Only major legends grant Bonds; all boss health still scales with the starting team. Preview-only changes.']
  ] },
  { d: '2026-10-18', title: ['Mega Swampert y Coberturas en pruebas', 'Mega Swampert and Coverage in the preview'], chg: [
    ['La prueba de Hoenn incluye la Swampertita desbloqueada y equipada, junto a Mega Blaziken. Mega Swampert puede empezar el Boss Rush con Terratemblor Nv. 2; ambas piedras siguen siendo opcionales.',
     'The Hoenn preview includes Swampertite unlocked and equipped alongside Mega Blaziken. Mega Swampert can start Boss Rush with level-two Bulldoze; both stones remain optional.']
  ], fix: [
    ['Los selectores de ataques del Boss Rush se actualizan al volver de Mejoras para incluir las Coberturas elegidas en la tienda del Live y conservar las selecciones que sigan disponibles. Sólo afecta a la sesión temporal de pruebas.',
     'Boss Rush move selectors refresh on returning from Upgrades to include Coverage choices from the Live shop and retain selections that remain available. This only affects the temporary preview session.']
  ] },
  { d: '2026-10-18', title: ['Nieve Polvo evoluciona a Ventisca', 'Powder Snow evolves into Blizzard'], chg: [
    ['Nieve Polvo Nv. 5 evoluciona con Carrera a Ventisca: ×1,8 daño, +50% de radio y ralentización del 65% en un área completa alrededor del Pokémon, con copos en pixel art.',
     'Level 5 Powder Snow evolves with Sprint into Blizzard: ×1.8 damage, +50% radius and 65% slowing in a full area around the Pokémon, with pixel-art snowflakes.'],
    ['La evolución de Rayo Hielo se llama Rayo Polar y conserva su comportamiento y potencia de rayo. Ventisca identifica ahora la evolución de área de Nieve Polvo.',
     'Ice Beam now evolves into Polar Beam, retaining its beam behavior and power. Blizzard now identifies Powder Snow’s area evolution.'],
    ['Coberturas reconoce la rama Nieve Polvo → Ventisca cuando la especie puede aprender Ventisca, incluido Swampert. Se muestra la rama completa al elegirla.',
     'Coverage recognizes the Powder Snow → Blizzard branch when a species can learn Blizzard, including Swampert. The full branch is shown in the picker.']
  ] },
  { d: '2026-10-18', title: ['Coberturas para tu Pokémon', 'Coverage for your Pokémon'], new: [
    ['Coberturas tiene tres niveles por Pokémon: elige hasta tres movimientos compatibles de otros tipos desde Mejoras. Podrán salir al subir de nivel sin aumentar tus cuatro espacios de movimientos.',
     'Coverage has three levels per Pokémon: select up to three compatible moves from other types in Upgrades. They join level-up offers without increasing your four move slots.'],
    ['Los ataques elegidos se integran con Repertorio, Veto y Atajos, y pueden mejorarse, evolucionar y vincularse. Puedes cambiar la selección entre partidas; se guarda por Pokémon y se sincroniza entre dispositivos.',
     'Selected attacks work with Repertoire, Ban and Shortcuts, and can be upgraded, evolved and bonded. Change selections between runs; they are saved per Pokémon and synced between devices.'],
    ['Compatibilidades por especie basadas en aprendizaje por nivel, MT, tutor o crianza de los juegos principales, entre los ataques ya implementados. Mao Mao y Toji tienen listas personalizadas. Los Pokémon sin ataques adicionales compatibles muestran el motivo en Mejoras.',
     'Species compatibility follows level-up, machine, tutor or egg learning in main-series games, among implemented attacks. Mao Mao and Toji have custom lists. Pokémon without compatible extra attacks show an explanation in Upgrades.']
  ] },
  { d: '2026-10-18', title: ['Rayquaza cierra el Boss Rush de Hoenn', 'Rayquaza completes the Hoenn Boss Rush'], new: [
    ['Rayquaza llega después de Groudon, Kyogre y cuatro menores. Es el séptimo combate: conserva tu build, entrega un Vínculo al vencerlo y tiene una arena celestial a toda pantalla.',
     'Rayquaza arrives after Groudon, Kyogre and four minor legends. It is the seventh encounter: your build persists, victory grants a Bond, and it has a full-screen celestial arena.'],
    ['Usa Ascenso Draco, Velocidad Extrema, Pulso Dragón, Vendaval y Cometa Draco con sprites animados en pixel art. Pasa de uno a dos y hasta tres ataques a la vez, con avisos más rápidos por fase y una recuperación clara tras los meteoros.',
     'It uses Dragon Ascent, Extreme Speed, Dragon Pulse, Hurricane and Draco Meteor with animated pixel-art sprites. It progresses from single to double and triple attacks, with faster phase warnings and a clear recovery after meteors.']
  ], chg: [
    ['Rayquaza empieza con 5 millones de PV base multiplicados por jugadores. Las combinaciones comprueban salidas alcanzables y comparten protección contra impactos instantáneos. Cometa Draco se lanza solo.',
     'Rayquaza starts at 5 million base HP multiplied by players. Combinations check for reachable escapes and share protection against instant overlapping impacts. Draco Meteor is cast alone.']
  ] },
  { d: '2026-10-17', title: ['Ajuste de vida de Kyogre', 'Kyogre health adjustment'], chg: [
    ['Kyogre queda en 2.5 millones de PV base. Con 2, 3 y 4 jugadores tendrá 5, 7.5 y 10 millones de PV, respectivamente.',
     'Kyogre now has 2.5 million base HP. With 2, 3 and 4 players it will have 5, 7.5 and 10 million HP, respectively.']
  ] },
  { d: '2026-10-17', title: ['Kyogre resiste y sus haces se unen', 'Kyogre withstands evolved builds with continuous beams'], chg: [
    ['Kyogre pasa de 600 mil a 3 millones de PV base, multiplicados por jugadores. La referencia con Mega Blaziken, Onda Certera y Danza de Mil Espadas evolucionadas, Vínculo y oro máximo apunta a 3–5 minutos reservando tiempo para esquivar.',
     'Kyogre goes from 600,000 to 3 million base HP, multiplied by players. The reference with max-gold Mega Blaziken, evolved Focus Blast and Thousand Swords Dance, and a Bond targets 3–5 minutes while allowing time to dodge.']
  ], fix: [
    ['Surf ya no muestra un cuadrado alrededor de la ola al causar daño. Hidrobomba y Rayo Hielo usan nuevos sprites de haces continuos en pixel art, sin formar hileras de proyectiles pequeños. Se conservan los avisos previos para esquivar.',
     'Surf no longer shows a box around its damaging wave. Hydro Pump and Ice Beam use new continuous pixel-art beam sprites instead of rows of small projectiles. Advance warnings remain visible for dodging.']
  ] },
  { d: '2026-10-17', title: ['Kyogre y efectos en pixel art', 'Kyogre and pixel-art effects'], new: [
    ['Kyogre llega al Boss Rush después de Groudon y dos menores. Usa Surf, Hidrobomba, Rayo Hielo, Danza Lluvia y Pulso Primigenio. Después aparecen otros dos menores; conservas tu build y cada mayor entrega un Vínculo.',
     'Kyogre joins Boss Rush after Groudon and two minor legends. It uses Surf, Hydro Pump, Ice Beam, Rain Dance and Origin Pulse. Two more minors follow; your build persists and each major grants a Bond.'],
    ['Los ataques de Groudon y Kyogre reciben sprites animados en pixel art. Kyogre tiene arena marina a toda pantalla, olas móviles, chorros, hielo y lluvia sin ocultar las señales.',
     'Groudon and Kyogre attacks get animated pixel-art sprites. Kyogre has a full-screen marine arena, moving waves, water jets, ice and rain that preserves readable warnings.']
  ], chg: [
    ['Los avisos normales de Kyogre bajan de 1.55 a 1.20 y 0.90 segundos según fase, y pasa de ataques individuales a dobles y triples. Las combinaciones comprueban una salida alcanzable y comparten protección contra impactos instantáneos.',
     'Kyogre’s normal warnings shorten from 1.55 to 1.20 and 0.90 seconds by phase, progressing from single to double and triple attacks. Combinations check for a reachable escape and share protection against instant overlapping hits.']
  ] },
  { d: '2026-10-17', title: ['Vida de jefes por equipo', 'Boss health per team'], chg: [
    ['El Boss Rush prepara el escalado de vida para cooperativo: los mayores y menores tendrán su vida base multiplicada por el número de jugadores al iniciar la partida. Caer durante el intento no reduce esa vida. La entrada cooperativa sigue pendiente.',
     'Boss Rush prepares cooperative health scaling: major and minor bosses will have their base health multiplied by the starting player count. Going down during the run does not reduce that health. Cooperative entry is still pending.']
  ] },
  { d: '2026-10-17', title: ['Arena de Boss Rush a toda pantalla', 'Full-screen Boss Rush arena'], chg: [
    ['La arena de pruebas se adapta al ancho y alto de la pantalla, con suelo volcánico continuo hasta los bordes y sin el marco de lava. Al girar el celular, los límites y ataques se ajustan al nuevo espacio.',
     'The playtest arena adapts to the screen width and height, with continuous volcanic flooring to every edge and no lava frame. Rotating your phone adjusts the boundaries and attacks to the new space.']
  ] },
  { d: '2026-10-17', title: ['Groudon combina sus ataques', 'Groudon combines its attacks'], chg: [
    ['Groudon ataca más seguido: reduce sus esperas y recuperaciones. En la segunda fase combina dos movimientos simultáneos y en la tercera hasta tres, con todos sus avisos y efectos visibles. Terremoto conserva su franja segura y se lanza solo.',
     'Groudon attacks more often with shorter waits and recoveries. Phase two combines two simultaneous moves and phase three up to three, showing every telegraph and effect. Earthquake keeps its safe lane and is cast alone.'],
    ['Las combinaciones comprueban que exista una salida alcanzable a pie. Sus avisos se amplían si hace falta y los golpes coincidentes comparten una breve protección para evitar daño triple instantáneo.',
     'Combinations check for a reachable walking escape. Warnings lengthen when needed, and overlapping impacts share a brief damage grace period to avoid instant triple damage.']
  ] },
  { d: '2026-10-17', title: ['Mejoras de prueba en un clic', 'One-click playtest upgrades'], new: [
    ['En la preparación del Boss Rush, Mejorar al máximo completa todas las mejoras de oro del Pokémon seleccionado sin gastar monedas de prueba. El botón confirma cuándo están listas.',
     'In Boss Rush preparation, Max Upgrades completes all gold upgrades for the selected Pokémon without spending playtest coins. The button confirms when they are ready.']
  ], chg: [
    ['El Boss Rush empieza en nivel 8, con siete elecciones de mejora desde nivel 1. La experiencia de las victorias sigue permitiendo ganar tres niveles por combate sin bonos.',
     'Boss Rush starts at level 8, with seven upgrade choices from level 1. Victory experience still grants three levels per encounter without bonuses.']
  ] },
  { d: '2026-10-17', title: ['Más espacio, efectos y Vínculos en el Boss Rush', 'More space, effects and Bonds in Boss Rush'], chg: [
    ['La arena de pruebas crece a 960×560. Groudon conserva sus 400.000 PV y cada movimiento recibe efectos propios: pilares de roca, ondas de tierra, lava, estelas y fracturas, con señales claras y sonidos distintos.',
     'The playtest arena grows to 960×560. Groudon keeps 400,000 HP, and each move gets its own effects: stone pillars, ground waves, lava, trails and fissures, with clear telegraphs and distinct sounds.']
  ], new: [
    ['Derrotar a un legendario mayor otorga un Vínculo para combinar movimientos. Groudon lo entrega una vez por victoria; los menores siguen dando experiencia y recuperación de vida. El combate queda pausado mientras eliges la fusión.',
     'Defeating a major legendary grants a Bond to combine moves. Groudon awards it once per victory; minor legends still give experience and healing. Combat pauses while choosing the fusion.']
  ] },
  { d: '2026-10-17', title: ['Groudon resiste las builds al máximo', 'Groudon withstands maxed builds'], chg: [
    ['La prueba de Groudon pasa a 400.000 PV, con una duración objetivo de 3–5 minutos frente a Mega Blaziken con todas las mejoras de oro y una preparación ofensiva. La barra muestra el tiempo de combate; una build optimizada puede vencerlo antes.',
     'The Groudon playtest now has 400,000 HP, targeting 3–5 minutes against Mega Blaziken with all gold upgrades and offensive preparation. The boss bar shows combat time; an optimized build can win sooner.']
  ] },
  { d: '2026-10-17', title: ['Groudon se pone en movimiento', 'Groudon gets moving'], chg: [
    ['En las pruebas del Boss Rush, Groudon persigue entre ataques, usa Doble Filo desde la primera fase y ataca antes y más seguido. Filo del Abismo y Estallido alcanzan también a quienes se quedan en los bordes. Sus avisos siguen dando tiempo para esquivar.',
     'In the Boss Rush playtest, Groudon pursues between attacks, uses Double-Edge from phase one and attacks sooner and more often. Precipice Blades and Eruption also threaten players at the edges. Telegraphs still allow time to dodge.'],
    ['La arena crece a 720×400, con una cámara que la muestra completa, suelo de roca volcánica y lava decorativa en el perímetro. Groudon pasa a 22.000 PV para resistir mejor los ataques de las builds de prueba.',
     'The arena grows to 720×400 with a camera that fits the whole arena, volcanic rock flooring and decorative perimeter lava. Groudon now has 22,000 HP to withstand powerful playtest builds.']
  ] },
  { d: '2026-10-17', title: ['Mega Blaziken en las pruebas', 'Mega Blaziken in the playtest'], new: [
    ['La página de pruebas incluye la Blazikenita desbloqueada y equipada. Elige Blaziken para jugar como Mega Blaziken; Golpe Kárate conserva su inicio en nivel 2 en el Boss Rush.',
     'The development page includes unlocked and equipped Blazikenite. Choose Blaziken to play as Mega Blaziken; Karate Chop retains its level-2 start in Boss Rush.']
  ] },
  { d: '2026-10-17', title: ['Acceso al Boss Rush', 'Boss Rush entry'], new: [
    ['En la página de pruebas, entra desde Jugar → Boss Rush · Hoenn. Puedes volver al selector de modos y Partida normal conserva su funcionamiento.',
     'On the development page, enter through Play → Boss Rush · Hoenn. You can return to mode selection, and Normal Run keeps its usual behavior.']
  ] },
  { d: '2026-10-17', title: ['Prueba del Boss Rush de Hoenn', 'Hoenn Boss Rush playtest'], new: [
    ['La página de desarrollo permite probar a Groudon con tres fases y dos legendarios menores aleatorios con sus patrones normales. Empiezas en nivel 10 eligiendo nueve mejoras; los menores escalan su vida, daño y cadencia conservando los avisos.',
     'The development page offers a three-phase Groudon and two random minor legends with native patterns. Start at level 10 with nine upgrades; minor HP, damage and attack rate scale while telegraphs keep their timing.'],
    ['La prueba incluye 100.000 Pokémonedas temporales, Swampert, Blaziken y Sceptile desbloqueados, mejoras de oro y un botón para reponer fondos. Usa una sesión invitada aislada: no modifica tu cuenta ni publica récords.',
     'The playtest includes 100,000 temporary coins, unlocked Swampert, Blaziken and Sceptile, gold upgrades and a funds refill button. It uses an isolated guest session without changing your account or publishing records.']
  ] },
  { d: '2026-10-17', title: ['Toji al tamaño de Ferropaladín', 'Toji matches Iron Valiant’s size'], chg: [
    ['El tamaño visual de Toji se ajusta a la altura de Ferropaladín. Su presentación y miniaturas se centran usando el cuerpo visible, sin contar el espacio vacío de la hoja.',
     'Toji’s visual height now matches Iron Valiant. His menu presentation and thumbnails are centered using the visible body rather than empty sprite-sheet padding.']
  ] },
  { d: '2026-10-17', title: ['Toji más grande', 'Larger Toji'], chg: [
    ['Toji Fushiguro se ve un 50% más grande en combate y en su presentación del menú. Su área de colisión y sus estadísticas se mantienen; las miniaturas se ajustan al espacio disponible.',
     'Toji Fushiguro appears 50% larger in combat and in the main menu. His collision area and stats stay the same; thumbnails fit their available space.']
  ] },
  { d: '2026-10-17', title: ['Toji Fushiguro se une al combate', 'Toji Fushiguro joins the fight'], new: [
    ['Código TOJI1: desbloquea a Toji Fushiguro como personaje independiente de tipo Acero/Lucha, con estadísticas y movimientos basados en Cobalion. Elígelo en Pokémon → Especial.',
     'Code TOJI1 unlocks Toji Fushiguro as an independent Steel/Fighting character with Cobalion-based stats and moves. Select him under Pokémon → Special.'],
    ['Toji tiene animaciones en ocho direcciones, mejoras propias y tiempos válidos para el ranking en solitario y cooperativo. También puedes filtrar el histórico por Toji Fushiguro.',
     'Toji has eight-direction animations, his own upgrades and valid solo/co-op ranking times. You can also filter the all-time leaderboard by Toji Fushiguro.']
  ] },
  { d: '2026-10-17', title: ['Más mejoras para tu Pokémon', 'More upgrades for your Pokémon'], new: [
    ['Seis nuevas mejoras permanentes por Pokémon: Golpe Devastador (críticos hasta x2), Expansión (hasta +20% de tamaño), Persistencia (hasta +25% de duración), Drenaje, Último Aliento y Más Opciones.',
     'Six new permanent upgrades per Pokémon: Devastating Blow (up to x2 criticals), Expansion (up to +20% size), Persistence (up to +25% duration), Drain, Last Breath and More Choices.'],
    ['Drenaje recupera hasta 1 PV por baja del equipo, con un tope de 2 PV/s. Último Aliento permite resistir un golpe mortal con 1 PV y 3 segundos de invulnerabilidad una vez por partida; la Banda Focus tiene prioridad.',
     'Drain restores up to 1 HP per team kill, capped at 2 HP/s. Last Breath survives one lethal hit per run with 1 HP and 3 seconds of invulnerability; Focus Sash takes priority.'],
    ['Más Opciones tiene tres niveles: hasta cuatro, cinco o seis cartas distintas por nivel y al cambiarlas; eliges una. Usa los números 1–6 o toca la carta. Persistencia alarga buffs, minas, torretas y rastros.',
     'More Choices has three levels: up to four, five or six distinct cards on level-up and rerolls; choose one. Use keys 1–6 or tap a card. Persistence extends buffs, mines, turrets and trails.']
  ] },
  { d: '2026-10-16', title: ['Tirada Élite y mejores colecciones', 'Elite pulls and better collections'], new: [
    ['Tirada Élite: canjea un ticket ×10 por cinco Pokémon de rareza Rara o superior. Cada uno tiene un 4.5% de probabilidad de ser Legendario, el triple que en las normales. Comparte la garantía del banner.',
     'Elite pull: exchange one ×10 ticket for five Rare-or-better Pokémon. Each has a 4.5% Legendary chance, triple the normal odds. Banner pity is shared.']
  ], chg: [
    ['Las tiradas normales dan triple de peso a los Pokémon que te faltan dentro de su rareza. Las tandas normales ×10 evitan repetir especies mientras haya alternativas de esa rareza. Las tasas de rareza no cambian.',
     'Normal pulls give unowned Pokémon triple weight within their rarity. Normal ×10 batches avoid repeating species while alternatives of that rarity remain. Rarity rates are unchanged.']
  ] },
  { d: '2026-10-16', title: ['Danza del Dragón Celestial', 'Celestial Dragon Dance'], new: [
    ['Danza Dragón Nv. 5 evoluciona con Reflejos: 8 cargas de +25% de ataque y +5% de velocidad de ataque, hasta +200% y +40%, durante 12 segundos. Un dragón azul aparece al completar las cargas.',
     'Level 5 Dragon Dance evolves with Reflexes: 8 stacks of +25% attack and +5% attack speed, up to +200% and +40%, lasting 12 seconds. A blue dragon appears at full stacks.']
  ], chg: [
    ['Danza Dragón sin evolucionar alcanza +175% de ataque y +25% de velocidad de ataque en Nv. 5 con siete cargas. La cadencia multiplica tus mejoras finales y se combina con Impulso.',
     'Unevolved Dragon Dance reaches +175% attack and +25% attack speed at level 5 with seven stacks. Attack speed multiplies your final upgrades and combines with Speed Boost.']
  ] },
  { d: '2026-10-16', title: ['Danza de Mil Espadas', 'Thousand Swords Dance'], new: [
    ['Danza Espada Nv. 5 evoluciona con una mejora de Potencia: 8 acumulaciones de +30% de ataque, hasta +240%, durante 12 segundos desde el último uso. Al completar las cargas, ocho espadas doradas giran a tu alrededor.',
     'Level 5 Swords Dance evolves after taking a Might upgrade: 8 stacks of +30% attack, up to +240%, lasting 12 seconds from the last cast. At full stacks, eight golden swords circle around you.']
  ] },
  { d: '2026-10-16', title: ['Megaevolución: Mega Blaziken', 'Mega Evolution: Mega Blaziken'], new: [
    ['Consigue la Blazikenita venciendo a tres jefes en una misma partida en solitario con Blaziken normal. Equípala desde el menú para usar Mega Blaziken.',
     'Earn Blazikenite by defeating three bosses in one solo run with regular Blaziken. Equip it in the menu to use Mega Blaziken.'],
    ['Mega Blaziken comienza con Golpe Kárate Nv. 2 y tiene animaciones de combate cuerpo a cuerpo y a distancia.',
     'Mega Blaziken starts with level 2 Karate Chop and has melee and ranged attack animations.']
  ], chg: [
    ['Impulso aumenta cada 30 segundos: +5% de movimiento y +6% de velocidad de ataque, hasta +25% y +30%. La velocidad de ataque multiplica el resultado final de tus mejoras.',
     'Speed Boost adds 5% movement and 6% attack speed every 30 seconds, up to 25% and 30%. Attack speed multiplies the final result of your upgrades.']
  ] },
  { d: '2026-10-16', title: ['Repertorio a tu gusto', 'Choose your Repertoire'], chg: [
    ['Repertorio ahora tiene un botón Elegir ataque en Mejoras: selecciona el ataque extra de cada Pokémon, respeta Veto y conserva la opción Aleatorio.',
     'Repertoire now has a Choose attack button in Upgrades: pick each Pokémon’s extra starting attack, respect banned moves, or keep Random.']
  ] },
  { d: '2026-10-16', title: ['Proyectiles centrados', 'Centered projectiles'], fix: [
    ['Ascuas y los demás ataques de proyectiles mantienen un disparo centrado en el objetivo al ganar proyectiles adicionales. Los extras se abren hacia los lados.',
     'Ember and other projectile attacks keep one shot centered on the target when gaining extra projectiles. Additional shots spread to the sides.']
  ] },
  { d: '2026-10-15', title: ['Regalo de 500,000 Pokémonedas', '500,000 Pokécoins gift'], new: [
    ['Código 500KP: 500,000 Pokémonedas una vez por cuenta.', 'Code 500KP: 500,000 Pokécoins once per account.']
  ] },
  { d: '2026-10-15', title: ['Megaevolución: Mega Swampert', 'Mega Evolution: Mega Swampert'], new: [
    ['Swampert puede conseguir la Swampertita al vencer tres jefes en una misma partida en solitario. La piedra es permanente y se equipa o quita desde el menú.',
     'Swampert can earn Swampertite by defeating three bosses in a single solo run. The stone is permanent and can be equipped or removed from the menu.'],
    ['Mega Swampert llega con sprites en ocho direcciones y una Megapiedra visual común que también se utilizará para futuras megas.',
     'Mega Swampert arrives with eight-direction sprites and a shared Mega Stone icon for future Mega Evolutions.']
  ], chg: [
    ['Mega Swampert empieza cada partida con Terratemblor Nv. 2, convoca 30 segundos de lluvia con 120 segundos de recarga y conserva la forma mega durante toda la partida.',
     'Mega Swampert starts each run with level 2 Bulldoze, summons 30 seconds of rain with a 120-second cooldown, and stays Mega-Evolved for the whole run.']
  ] },
  { d: '2026-10-14', title: ['Regalo de 10 Tickets ×10', 'Gift of ten x10 tickets'], new: [
    ['Nuevo código 10X10: consigue 10 Tickets x10, equivalentes a 100 tiradas de gacha. Cada cuenta puede usarlo una sola vez sin perder los demás códigos.',
     'New 10X10 gift code: claim ten x10 tickets, worth 100 gacha pulls. Each account can redeem it once independently of other gift codes.']
  ] },
  { d: '2026-10-14', title: ['Regalo de 20,000 Pokémonedas', '20,000 Pokécoins gift'], new: [
    ['Nuevo código 20KPS: regala 20,000 Pokémonedas por cuenta. Es reutilizable entre jugadores, pero cada cuenta lo canjea una sola vez y puede seguir canjeando MAO25.',
     'New 20KPS code: grants 20,000 Pokécoins per account. Multiple players can use it, but each account can claim it once and can still redeem MAO25.']
  ] },
  { d: '2026-10-14', title: ['Botones móviles a tu gusto', 'Customize mobile controls'], new: [
    ['En Ajustes > Controles > Colocar puedes arrastrar la barra de ataques con su objeto y el botón de pausa; también puedes elegir un joystick fijo o flotante y moverlo.',
     'In Settings > Controls > Place, drag your attack bar with the item and pause button; choose a fixed or floating joystick and position it.'],
    ['Tus preferencias se guardan en este dispositivo, sin alterar tus Pokémon, partidas ni tu cuenta en la nube.',
     'Your control layout is saved on this device without changing your Pokémon, runs, or cloud account.']
  ] },
  { d: '2026-10-14', title: ['Controles y pantalla de iPhone', 'iPhone controls and screen'], fix: [
    ['En iPhone, ya puedes cambiar de ataque mientras mueves al Pokémon con otro dedo. Los toques no se duplican ni quedan bloqueados al cambiar rápidamente.',
     'On iPhone, you can switch attacks while moving your Pokémon with another finger. Taps no longer duplicate or get blocked when switching quickly.'],
    ['La pantalla de juego se adapta al espacio visible real de Safari, incluido el giro horizontal y los cambios de tamaño de las barras del navegador, sin estirar los gráficos.',
     'The game screen now adapts to Safari’s actual visible area, including landscape rotation and changes to browser bars, without stretching the graphics.']
  ] },
  { d: '2026-10-14', title: ['Maomao: prueba visual', 'Maomao: visual playtest'], new: [
    ['Prueba opcional de Maomao Veneno/Planta como invitado, con poses provisionales de movimiento, ataque y caída. Disponible sólo en la versión de pruebas con ?maomao=1.',
     'Optional guest playtest of Poison/Grass Maomao with provisional movement, attack and faint poses. Available only in the test version with ?maomao=1.']
  ] },
  { d: '2026-10-14', title: ['Modo Desafíos V0.1', 'Challenges mode V0.1'], new: [
    ['Supervivencia Extrema: sobrevive 10 minutos de juego activo en solitario, con un 25 % más de daño enemigo. Usa tu compañero y tus mejoras; tus marcas se guardan fuera del ranking normal.',
     'Extreme Survival: survive 10 minutes of active solo play with 25% more enemy damage. Keep your partner and upgrades; records are saved separately from normal leaderboards.'],
    ['La recompensa propuesta de 500 monedas queda pendiente de habilitación. Puedes repetir el desafío sin límite.',
     'The proposed 500 coin reward is pending enablement. You can retry without limits.']
  ] },
  { d: '2026-10-14', title: ['Recupera tu cuenta con Gmail', 'Recover your account with Gmail'], new: [
    ['Si juegas con nombre y contraseña, puedes vincular tu Gmail: si un día olvidas la contraseña, entras con Google y es tu misma cuenta. Te lo ofrecemos al entrar.',
     'If you play with a name and password, you can link your Gmail: if you ever forget your password, sign in with Google and it is the same account. We offer it when you sign in.']
  ] },
  { d: '2026-10-13', title: ['La Sentencia de Arceus', 'The Judgment of Arceus'], new: [
    ['La Sentencia de Arceus: al llegar al minuto 30, Arceus baja del cielo y te lleva a las Ruinas del Juicio. Es invencible, te persigue cada vez más deprisa y lanza pilares de luz, rayos y ondas; si te toca, te quita casi media vida. Cada 5 segundos acude un legendario con el doble de vida y de daño que el anterior. ¿Cuánto aguantarás?',
     'The Judgment of Arceus: at minute 30, Arceus descends from the sky and takes you to the Ruins of Judgment. It is invincible, chases you faster and faster and casts pillars of light, beams and shockwaves; if it touches you, you lose almost half your HP. Every 5 seconds a legendary joins, each with twice the HP and damage of the previous one. How long can you last?'],
    ['Tres logros nuevos: La Sentencia (llega al minuto 30), Ante el Creador (aguanta 1 minuto ante Arceus) y Desafío divino (derrota a 3 legendarios ante Arceus en una partida).',
     'Three new achievements: The Judgment (reach minute 30), Before the Creator (survive 1 minute against Arceus) and Divine challenge (defeat 3 legendaries against Arceus in a single run).'],
    ['Música nueva para la pelea contra Arceus.', 'New music for the fight against Arceus.'],
    ['Botón para reportar marcas sospechosas en el ranking (la banderita de cada fila).',
     'A button to report suspicious records on the leaderboard (the little flag on each row).']
  ], chg: [
    ['El ranking histórico empieza de cero: ahora que las partidas acaban ante Arceus, las marcas de antes ya no se podrían alcanzar. Las tablas de hoy, de la semana y del mes siguen igual.',
     'The all-time leaderboard starts from scratch: now that runs end against Arceus, older records could no longer be reached. The daily, weekly and monthly boards are unchanged.'],
    ['Se quita el tiempo extra del minuto 60 (ya no se llega hasta ahí).',
     'Overtime from minute 60 is removed (runs no longer get that far).'],
    ['Desde el minuto 28 ya no se abren grietas, para que la Sentencia no te pille dentro de una.',
     'Rifts no longer open from minute 28 on, so the Judgment does not catch you inside one.'],
    ['Ranking protegido contra trampas: el servidor comprueba que cada marca se ha jugado de verdad. Nunca se pierde nada de lo que ganas jugando.',
     'Leaderboard protected against cheating: the server checks that every record was really played. You never lose anything you earn by playing.'],
    ['Se han quitado del ranking las marcas de más de 35 minutos: con la Sentencia de Arceus ya no son posibles.',
     'Records over 35 minutes have been removed from the leaderboard: with the Judgment of Arceus they are no longer possible.']
  ], fix: [
    ['Las tiradas del gacha, los Pokémon nuevos y los premios se guardan en la nube al momento. Si abriste el juego en otro aparato o navegador y te faltaba algo, vuelve a abrirlo donde lo conseguiste: se recupera solo.',
     'Gacha pulls, new Pokémon and rewards are saved to the cloud right away. If you opened the game on another device or browser and something was missing, open it again where you got it: it comes back on its own.']
  ] },
  { d: '2026-10-12', title: ['Tiempo extra y grietas con menos azar', 'Overtime and less random rifts'], new: [
    ['Tiempo extra: desde el minuto 60 los Pokémon salvajes se vuelven cada vez más fuertes (más vida y más daño), y cada vez más deprisa. Antes, con las mejoras al máximo, algunas partidas no acababan nunca; ahora las mejores rondarán la hora y media.',
     'Overtime: from minute 60 on, wild Pokémon keep getting stronger (more HP and more damage), faster and faster. Before, with maxed upgrades, some runs never ended; now the best ones will last about an hour and a half.'],
    ['El juego se actualiza solo cuando sale una versión nueva: si estás en el menú, a los 5 segundos; si estás jugando, al acabar la partida (sin perder nada).',
     'The game now updates itself when a new version is out: within 5 seconds if you are in the menu, or after your run if you are playing (without losing anything).'],
    ['Botón de Novedades (esta ventana) con todos los cambios del juego.',
     'A "What\'s new" button (this window) with every change to the game.'],
    ['Números más fáciles de leer: el 2, el 5 y el 8 ya no se confunden.',
     'Easier to read numbers: 2, 5 and 8 no longer look alike.'],
    ['Elige la versión normal o shiny de tu compañero desde el menú principal, debajo de él.',
     'Pick the normal or shiny version of your partner right from the main menu, under it.'],
    ['Mejoras nuevas para cada Pokémon: Golpe Crítico (+3 % de críticos por nivel, que hacen x1,5 de daño), Cambio de cartas (+1 cambio de las cartas de nivel por run) y Veto (bloquea movimientos para que no te salgan en las cartas; se eligen en Mejoras).',
     'New upgrades for each Pokémon: Critical Hit (+3% critical chance per level, crits deal x1.5 damage), Card reroll (+1 level-up card reroll per run) and Ban (block moves so they never show up in your cards; pick them in Upgrades).'],
    ['Atajos de movimientos (en Mejoras, para cada Pokémon): elige qué movimiento va siempre en cada hueco, por ejemplo Confusión siempre en el 1, para la memoria muscular.',
     'Move shortcuts (in Upgrades, for each Pokémon): choose which move always goes in each slot, for example Confusion always on 1, for muscle memory.']
  ], chg: [
    ['Avalancha hace menos daño (21 en vez de 26): derrotaba casi el doble que la media de los movimientos.',
     'Rock Slide deals less damage (21 instead of 26): it defeated almost twice as many as the average move.'],
    ['Los cambios de cartas de nivel ya no se ganan venciendo jefes: tienes 1 gratis por run y el resto se compra en Mejoras.',
     'Level-up card rerolls are no longer earned by defeating bosses: you get 1 free per run and can buy more in Upgrades.'],
    ['Los legendarios de grieta ya no dan siempre tickets x10: dan uno la mitad de las veces (antes daban 2 siempre y salían demasiados).',
     'Rift legendaries no longer always drop x10 tickets: they drop one half of the time (they used to always drop 2, which was too many).'],
    ['Cooperativo: si vuestras redes no consiguen conectar entre sí, la sala lo avisa y lo reintenta sola, en vez de jugar a tirones por un servidor lento.',
     'Co-op: if your networks cannot connect to each other, the room says so and keeps retrying, instead of playing laggy through a slow server.'],
    ['Hemos cambiado de servidores para que el juego siga siendo gratis: puede que tengas que volver a iniciar sesión (con la misma cuenta y contraseña, o con Google). Tu partida y tus Pokémon siguen igual.',
     'We moved to new servers so the game can stay free: you may need to sign in again (with the same account and password, or with Google). Your save and your Pokémon are unchanged.'],
    ['Gacha: los shiny ya no salen repetidos. Si te toca uno que ya tienes, sale otro de la misma rareza que te falte.',
     'Gacha: shinies no longer come out as duplicates. If you roll one you already have, you get another of the same rarity that you are missing.'],
    ['Grietas con menos azar: cada vez que no sale una, la siguiente es más probable (como mucho 2,5 minutos sin grieta).',
     'Less random rifts: every time one does not show up, the next one is more likely (at most 2.5 minutes without a rift).'],
    ['Los legendarios que aún no has vencido salen 4 veces más en las grietas.',
     'Legendaries you have not beaten yet show up 4 times as often in rifts.'],
    ['Los curanderos curan más cuanto más fuerte pegas, pero cada vez menos y con un tope (como mucho el 2,5x).',
     'Healers heal more the harder you hit, but with diminishing returns and a cap (2.5x at most).'],
    ['Ataques cuerpo a cuerpo más fuertes: mientras llevas uno activo recibes un 25 % menos de daño, llegan un 25 % más lejos y hacen un 20 % más de daño.',
     'Stronger melee attacks: while one is active you take 25% less damage, and they reach 25% further and deal 20% more damage.'],
    ['Cooperativo: al elegir con qué objeto quedarte, la partida se para para todos (antes seguía y te pegaban mientras elegías).',
     'Co-op: choosing which held item to keep now pauses the run for everyone (it used to keep going and you got hit while choosing).'],
    ['Cooperativo: mientras alguien elige una fusión, la partida se para para todos.',
     'Co-op: while someone is choosing a fusion, the run pauses for everyone.'],
    ['Cooperativo: si el anfitrión cambia de pestaña o se le para el juego, la partida se pausa para todos hasta que vuelva.',
     'Co-op: if the host switches tabs or their game stalls, the run pauses for everyone until they are back.'],
    ['Las runs de menos de 1 minuto ya no cuentan para el ranking.',
     'Runs shorter than 1 minute no longer count for the leaderboard.']
  ], fix: [
    ['Quitadas del ranking las marcas rotas por el fallo del minuto 84 (el reloj seguía corriendo con el juego parado) y alguna imposible. Si tenías una, tu próxima partida vuelve a contar.',
     'Removed broken records from the leaderboard caused by the minute 84 bug (the clock kept running while the game was frozen) and a few impossible ones. If you had one, your next run counts again.'],
    ['iPhone (Safari y Chrome): a veces no se podía cambiar de movimiento tocando los iconos, sobre todo con el otro dedo en el joystick. Además los botones quedan por encima de la barra de inicio.',
     'iPhone (Safari and Chrome): sometimes you could not switch moves by tapping the icons, especially with your other finger on the joystick. Buttons also sit above the home bar now.'],
    ['En las partidas de más de 84 minutos la pantalla se quedaba en negro, el juego se paraba o empezabas a subir de nivel sin fin. Ya puedes jugar todo lo que aguantes.',
     'In runs longer than 84 minutes the screen went black, the game froze or you kept levelling up forever. Now you can play for as long as you survive.'],
    ['Si el juego fallara, la partida se cierra sola y se guarda (tiempo, derrotados, récords y ranking) en vez de perderse.',
     'If the game ever crashes, the run ends by itself and is saved (time, defeated, records and leaderboard) instead of being lost.'],
    ['Las partidas muy largas a veces se tomaban por trampas y no contaban para el ranking.',
     'Very long runs were sometimes flagged as cheating and did not count for the leaderboard.'],
    ['Cooperativo: si el anfitrión cambiaba de pestaña, los enemigos se quedaban quietos y los demás jugaban con ventaja.',
     'Co-op: if the host switched tabs, enemies stood still and everyone else got a free advantage.'],
    ['iPhone: mantener el dedo en el joystick sacaba "Copiar / Seleccionar todo".',
     'iPhone: holding your finger on the joystick brought up "Copy / Select all".'],
    ['iPhone: a veces no salía la pantalla completa. Ahora el botón explica cómo tenerla (Compartir y "Añadir a pantalla de inicio").',
     'iPhone: fullscreen sometimes did not show up. Now the button explains how to get it (Share and "Add to Home Screen").']
  ] },
  { d: '2026-10-11', title: ['Vínculos', 'Bonds'], new: [
    ['Vínculos: al vencer a un legendario fusionas movimientos que se lanzan a la vez desde un solo hueco (hasta 4).',
     'Bonds: defeating a legendary lets you fuse moves that fire at the same time from a single slot (up to 4).'],
    ['Botón para cambiar las cartas de subir de nivel.',
     'A button to reroll the level-up cards.']
  ], chg: [
    ['Más grietas.', 'More rifts.'],
    ['Movimientos psíquicos y curanderos más flojos.', 'Weaker psychic moves and healers.'],
    ['Las mejoras de las cartas de nivel (velocidad, recarga, experiencia, imán, coraza y potencia) tienen un tope de veces.',
     'Level-up card upgrades (speed, cooldown, experience, magnet, armor and power) can only be taken a limited number of times.'],
    ['En el móvil, la ficha del Pokémon sale al lado; entrar es más rápido y el gacha x10 se puede cerrar.',
     'On mobile, the Pokémon details show alongside; logging in is faster and the x10 gacha can be closed.']
  ], fix: [
    ['Pantalla negra en partidas de más de una hora por llenarse la memoria de imágenes.',
     'Black screen in runs longer than an hour because image memory filled up.'],
    ['Los tickets se perdían si se cerraba la pestaña antes de acabar la partida: ahora se guardan al cogerlos.',
     'Tickets were lost if the tab closed before the run ended: now they are saved as soon as you pick them up.'],
    ['Una mejora comprada justo después de guardar se cobraba y no se apuntaba.',
     'An upgrade bought right after saving was charged but not applied.'],
    ['El juego se quedaba congelado para siempre si algo fallaba a mitad de partida.',
     'The game froze forever if something went wrong mid-run.']
  ] },
  { d: '2026-10-10', title: ['Más reto', 'More challenge'], new: [
    ['Jefes y legendarios con 4 ataques avisados que se enfurecen a media vida.',
     'Bosses and legendaries with 4 telegraphed attacks that get enraged at half health.'],
    ['12 movimientos nuevos y 8 formas de atacar nuevas: bumerán, cadena, minas, meteoros, torreta, embestida, rastro y abanico.',
     '12 new moves and 8 new ways to attack: boomerang, chain, mines, meteors, turret, dash, trail and spray.'],
    ['Eventos a mitad de partida (hordas de un tipo, hora dorada, Pokémon perdidos) y Meowth y Gholdengo que huyen cargados de monedas.',
     'Mid-run events (single-type hordes, golden hour, lost Pokémon) and Meowth and Gholdengo running away loaded with coins.'],
    ['Estatuas para los Pokémon grandes.', 'Statues for big Pokémon.']
  ], chg: [
    ['Más difícil: menos enemigos pero más duros.', 'Harder: fewer but tougher enemies.'],
    ['Subir de nivel es más lento, los tickets son más raros y los jefes dan ticket x10 una de cada tres veces.',
     'Levelling up is slower, tickets are rarer and bosses drop a x10 ticket one time in three.'],
    ['Carga más rápida.', 'Faster loading.']
  ], fix: [
    ['Los enemigos rezagados desaparecían delante de ti: ahora sólo fuera de la vista.',
     'Straggling enemies vanished in front of you: now only off-screen.'],
    ['Los menús y pantallas se montaban encima de la barra de arriba.',
     'Menus and screens overlapped the top bar.']
  ] },
  { d: '2026-10-09', title: ['Móvil e inglés', 'Mobile and English'], new: [
    ['Se puede jugar en móvil y tablet con joystick táctil, e instalar como app.',
     'Play on phones and tablets with a touch joystick, and install it as an app.'],
    ['El juego, en español y en inglés.', 'The game in English and Spanish.'],
    ['Pantalla de ajustes con calidad gráfica automática.', 'Settings screen with automatic graphics quality.']
  ], chg: [
    ['Menos enemigos en pantalla pero más fuertes.', 'Fewer but stronger enemies on screen.'],
    ['Gigadrenado pasa a ser Hierba Lazo (ya no cura).', 'Giga Drain becomes Grass Knot (no more healing).']
  ] },
  { d: '2026-10-08', title: ['Misiones, grietas y cooperativo', 'Missions, rifts and co-op'], new: [
    ['Misiones diarias y semanales, logros con medallas y títulos, y perfil público.',
     'Daily and weekly missions, achievements with medals and titles, and a public profile.'],
    ['Objetos equipables, evoluciones de movimientos y enemigos que curan, protegen, invocan o explotan.',
     'Held items, move evolutions and enemies that heal, shield, summon or explode.'],
    ['Grietas que llevan a 18 arenas legendarias, una por tipo, y clima que cambia la batalla.',
     'Rifts leading to 18 legendary arenas, one per type, and weather that changes the fight.'],
    ['Cooperativo con tu lista de amigos y ranking.', 'Co-op with your friends list and leaderboards.'],
    ['Mejoras para cada Pokémon, gacha tragaperras con tickets y tabla de tipos.',
     'Upgrades for each Pokémon, a slot-machine ticket gacha and a type chart.']
  ], chg: [
    ['Cámara más lejos y enemigos que rodean los obstáculos.', 'Camera further out and enemies that walk around obstacles.']
  ] },
  { d: '2026-10-07', title: ['Primera versión', 'First version'], new: [
    ['Primera versión pública de PokéSurvivor.', 'First public version of PokéSurvivor.']
  ] }
];

