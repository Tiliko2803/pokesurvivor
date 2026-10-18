/* ============ changelog.js — novedades del juego ============
 * Lo que ve la gente en el botón "Novedades" de la barra de arriba: cambios
 * de juego y fallos arreglados (nada de servidores ni bases de datos).
 * La fecha más nueva, arriba. En cada fecha, por apartados:
 *   new  lo nuevo · chg  cambios y ajustes · fix  fallos arreglados
 * Cada línea en español y en inglés.
 */
G.CHANGELOG = [
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

