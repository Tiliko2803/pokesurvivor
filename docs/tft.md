# TFT · Supervivencia PvE — alpha

Development branch: `feat/tft-mode`. Test URL:
https://tiliko2803.github.io/pokesurvivor/dev/
Entry: Jugar → TFT · Oleadas infinitas. Hoenn preview remains available.

## Decks (requested first)

- Three local slots, each exactly ten distinct evolution families out of 79 playable families.
- A family includes its complete line; species are not separate deck slots.
- Tap to select/remove families; filter by cost; save or start when count is ten.
- Browser preferences use only `ps.tft.decks.v1`. Invalid data or blocked storage
  falls back to defaults/in-memory play; it never touches account save keys.
- Default: Bulbasaur, Charmander, Squirtle, Pichu, Gastly, Ralts, Drilbur,
  Larvitar, Beldum, Fletchling. Legendaries are reserved for PvE bosses.
- A match snapshots the selected deck. Refreshes and new rounds only draw from
  its ten families. Buying an injected off-deck offer is rejected by the engine.
- Normal level rarity weights are normalized over costs present in the deck.
  If no cost has nonzero weight, the cheapest chosen tier is offered instead.
  This allows any ten valid lines, including decks without cost-1 families.
- Opposing AI uses themed compositions and six rotating legendary bosses. Decks are independent of owned collection.
- Change decks before a new match; no changing the active deck during a run.

## Presentation (requested second)

Evolution banners show old and new species/stars, including bench merges.
Movement interpolates visually; fixed-step combat positions remain authoritative.
Type-colored projectile effects, damage/healing numbers, shield arcs and bars,
burn/stun markers, fading defeated units and facing animations clarify battles.
Touch a friendly or enemy board unit during combat, or a bench unit, to inspect
HP, damage per pulse, defense, cadence multiplier, mana, shields and its actual ability description.
Friendly trait activation is shown. Reduced-motion settings avoid combat flashes
and movement interpolation; OS reduced-motion disables the evolution CSS effect.

## Signature abilities (requested third)

Six complete families receive distinct behaviors at each star rank. The rest
retain role-based abilities; this is not a full 24-family move redesign.

| Family | First rank | Second rank | Third rank |
|---|---|---|---|
| Charmander | Single flame + burn | Fire cone + burn | Wider cone + stronger/longer burn |
| Squirtle | Bubble + push | Nearby water damage + push | 4-cell water beam + up to 2-cell push |
| Drilbur | Steel strike | Drill through up to 3 cells | Drill + landing ground shockwave |
| Gastly | Ghost strike + slow | Bonus vs targets below 40% HP | Larger bonus + 25% actual damage life drain |
| Ralts | Heal + psychic strike | Heal + cleanse burn/slow/stun | Heal and shield two wounded allies |
| Beldum | Tackle/push + self shield | Shield vulnerable ally + steel strike | Area meteor strike, 1-second stun + self shield |

Pushes stop at occupied cells and board edges. Drill stops at friendly blockers
and lands only in a free cell. Shields cap at 50% recipient HP. Healing caps at
missing HP; drain scales from HP actually removed. Burn is finite and refreshes
rather than stacking unboundedly. Skills use their own damage type. Inspectors
show stage-specific descriptions and the corresponding move name.

## Core rules and isolation

6×6 board, three player rows, eight bench slots, levels 3–6 and endless PvE waves. Specials arrive every 5 waves and legendary bosses every 10. Three equal-star copies merge; 9 base copies make one
three-star unit. Two-stage families empower the evolved form at rank three;
single-stage species empower. Eevee currently uses Vaporeon only.

50 initial PV, 10 gold, 5 shop offers. Refresh costs 2, four XP cost 4, two XP
arrive after a round. Income: 5 + 1 per win + interest (floor(gold/5), capped at 5; maximum at 25 saved gold) +
streak bonus (one per two consecutive results of the same sign, capped at 3).
2/4 distinct deployed families activate type synergies. Fixed 50 ms simulation,
45-second round limit (timeout loses), pause and ×2. Continue until HP reaches zero; there is no victory cap.

The Survivor personality classifier is reused for grid AI: ranged retreat,
divers target backline, guardians protect wounded allies, melee roles persist.
No Survivor enemy entities, boss state, projectiles, ranking or rewards are used.
The engine never writes account data. Deck preferences persist; matches do not.
Items, PvP, full match persistence, account rewards and more signature abilities
remain future work.

## Packaging and verification

`node --test tests/tft.test.cjs tests/tft-preview.test.cjs`

`node tests/tft-browser.cjs` uses local Playwright and Chromium (CHROMIUM_PATH
optional); covers desktop, portrait and landscape when a browser is available.

`node tools/build-tft-preview.cjs` generates the existing /dev/ page with isolated
copies of changed modules/styles. Publish only its seven listed dev/ paths to
the Pages branch. Official root files and version.json remain intact. Source
and test changes are retained on feat/tft-mode for a later authorized release.

Hosted smoke checks cover the previous alpha. This iteration requires checking
saved-deck editing, launching a chosen deck and unit inspection in the hosted UI;
local automated browser runs require an installed Chromium executable.


## Rhythm, reports and roster expansion

A shared 0.5-second beat drives both teams: 1 hop/advance, 2 attack, 3 move,
4 attack. Normal movement takes at most one cell and only on beats 1/3. Basic
attacks and mana abilities only occur on beats 2/4 when in range; residual burn
and regeneration continue on the fixed-step status clock. Initiative alternates
by bar for collision/attack resolution. This is one shared cadence, not a
simultaneous turn-resolution system. Attack-speed differences scale damage and
mana per pulse, preserving DPS differences; slow scales those same values.
Push/drill movement is part of the ability on an attack beat. The HUD shows the
current beat and units hop while advancing; pause/×2 apply to the shared clock.

Round reports snapshot actual HP damage/healing (not overkill/overheal), shield
grants, received damage, absorbed shield damage and kills. Passive regeneration
counts as self healing. The table compares both sides; match totals aggregate
friendly contributions by evolution family across rounds/evolutions. Records
are in-memory only and are never submitted to Survivor rankings or accounts.

Ten new families bring the roster to 34:

| Cost | New family |
|---|---|
| 1 | Sandshrew → Sandslash |
| 1 | Weedle → Kakuna → Beedrill |
| 1 | Mareep → Flaaffy → Ampharos |
| 2 | Geodude → Graveler → Golem |
| 2 | Lotad → Lombre → Ludicolo |
| 2 | Spheal → Sealeo → Walrein |
| 2 | Happiny → Chansey → Blissey |
| 3 | Onix → Steelix |
| 3 | Tinkatink → Tinkatuff → Tinkaton |
| 4 | Bagon → Shelgon → Salamence |

Move-specific AoE is defined in AREA_MOVES, in addition to the six signature
families. Earthquake affects enemies within two Manhattan cells of the user;
Bulldoze uses one cell and slows. Blizzard, Discharge, Draco Meteor, Gigaton
Hammer and additional rock/water/ice moves also use explicit area definitions.
Area effects highlight exactly the included cells and never damage allies.
Excadrill keeps its signature drill plus landing shockwave at rank three.
Kakuna's Harden grants a self shield. Other new species use their role/AI and
any matching area move, rather than receiving a full bespoke three-stage kit.

Engine tests include all 34 families' local sprites, interest at 5-gold thresholds,
pulse timing, AoE targets, snapshot reports and complete collision-free matches.
Balance remains provisional; the report provides evidence for later adjustments.


Hosted verification of this iteration: the existing /dev/ page displayed all 34
families, saved an edited ten-line deck and restored it after slot switching.
A three-unit team launched correctly, inspection displayed the real Ralts
ability and current HP/mana, shared beat controls appeared, and a full first
round resolved. Its report correctly displayed both teams and match totals,
including actual healing and absorbed shields. With six saved gold, the win
paid seven total (base five + win one + interest one). Native Android visual
validation remains pending; the hosted desktop flow was verified.


## 2026-10-23 · Entradas, exploración y continuación
- La ronda almacena su rival al prepararse. `scout` devuelve copias; inspeccionar, comprar y recolocar no consume RNG ni cambia el encuentro. El tablero muestra posiciones reales, roles, sinergias y fichas rivales.
- Cada Pokémon activa una habilidad de entrada una sola vez por combate. Hay 1,8 segundos de presentación antes del primer pulso y del reloj de 45 segundos. Los nombres son adaptaciones para TFT, no una reproducción de reglas de los juegos principales. Las entradas de familia se mantienen al evolucionar; los movimientos sí cambian por estrella.
- Caparazón/Torrente/Chorro Arena añaden protección, Velo Protector escuda al equipo, Intimidación reduce 8% el daño enemigo sin acumularse por copias; otros bonos conceden maná, defensa, regeneración, perforación o cadencia. Las familias sin entrada específica tienen una de su rol. Los escudos conservan su límite global.
- Se añaden seis familias de movimientos únicos: Bulbasaur, Pichu, Machop, Chikorita, Torchic y Abra. Junto con las seis anteriores suman doce. Drenaje cuenta daño efectivo; cadenas no repiten enemigos ni golpean aliados; Demolición destruye escudo sin contarlo como daño a PV; los bonos temporales no se acumulan al refrescarse.
- Partida local en `ps.tft.match.v1`, separada de los tres mazos y del Survivor. Guarda después de acciones, al cambiar de fase, cada segundo y al ocultar/salir de la página. Conserva el estado de simulación y RNG, incluyendo estados alterados y aportes del informe. Al reabrir TFT, restaura automáticamente y deja un combate en pausa. No hay avance por tiempo transcurrido fuera de la página. Nueva partida sustituye el guardado; una partida activa pide confirmación para ese reemplazo.
- Instantáneas con versión y validación de límites, unidades, estadísticas, mazo, posiciones e informes. Las incompatibles/corruptas se ignoran. Partículas visuales se descartan al cargar. Si el almacenamiento falla se muestra aviso; salir requiere confirmación sólo en ese caso. El guardado depende del mismo navegador y dispositivo; borrar sus datos borra la partida.
- Pruebas de ida y vuelta en preparación, combate e informe: conserva resultado e ingresos, no vuelve a aplicar entradas ni paga dos veces. El combate conserva el compás 1/2/3/4 tras la presentación inicial.

### Verificación publicada
65 pruebas automáticas pasan (motor, empaquetado de la prueba, controles y aislamiento del Survivor). En el enlace /dev/ se verificó por controles reales: inspección rival, guardado de preparación con tres unidades y 5 de oro, recarga completa, habilidades de entrada, escudo de Ralts de 20 conservado al recargar durante la presentación, retorno en pausa, reanudación y victoria con 12 de oro (+7 una vez). Otra recarga conserva el informe y el oro; siguiente ronda muestra un nuevo rival de tres unidades. Revisada visualmente la ficha separada de habilidad inicial y movimiento. La ejecución automatizada de Playwright local y la revisión visual en Android nativo siguen sin ejecutarse por falta de navegador local/dispositivo.


## Todas las familias con habilidades · 2026-10-23
Las 34 familias tienen una entrada con nombre y efecto explícitos, y sus 102 combinaciones de familia/nivel tienen movimiento propio definido. Doce familias conservan su resolución a medida; las 22 restantes usan definiciones por nivel con geometría, tipo y efectos concretos. No se usa la antigua habilidad genérica por rol para ninguna familia del roster. La misma entrada se conserva dentro de una familia; los movimientos cambian con las estrellas incluso en líneas de una o dos especies.

Además de las doce familias anteriores, las fichas marcan como especiales: Eevee (maná compartido), Lucario (perforación y remate según vida perdida), Lapras (protección de equipo y hielo), Tyranitar (roca y escudo), Swampert (Terremoto con protección y ralentización), Salamence (cadencia temporal), Tinkaton (martillo con perforación/aturdimiento) y Rayquaza (rayos/cometas con protección). Son adaptaciones para TFT; cifras provisionales para balance posterior.

Las demás familias también tienen efectos concretos: Quagsire ralentiza con lodo; Ninetales quema; Golduck empuja; Magnezone protege a un aliado; Scizor acelera o perfora; Flygon controla una zona; Sandslash/Golem/Steelix combinan terreno y protección; Kakuna usa Fortaleza sin infligir daño; Ampharos controla con electricidad; Ludicolo drena y cura; Walrein combina hielo con escudo; Blissey cura y limpia estados. No se cuentan escudos destruidos como daño a PV. El drenaje usa daño efectivo y divide la curación entre sus destinatarios, y las mejoras de cadencia se refrescan sin acumularse.

Validación de esta ampliación: 69 pruebas pasan. Se ejecutan los movimientos de las 34 familias en los tres niveles (102 combinaciones), con comprobación de efecto real, tipo anunciado y seguridad de aliados. Casos específicos cubren remate/perforación, escudos de equipo, ruptura de escudo, drenaje efectivo, limpieza, maná limitado a 100, refresco sin acumulación de cadencia y guardado de esos efectos. En /dev/ se comprobó la versión d22e602775, la carga de la partida previa y la nueva ficha de Wooper con Absorbe Agua y Disparo Lodo de Tierra con ralentización. Revisión visual de escritorio; Android nativo pendiente.


## Entrada de control y sprites frontales · 2026-10-23
Drilbur/Excadrill sustituyen el bono pasivo de cadencia por Entrada Sísmica, una vez por combate. Drilbur produce un temblor de radio 1 y aturde 0,5 segundos. Excadrill ★★ perfora hasta 3 casillas hacia el enemigo más cercano, golpea la línea (0,8× ataque) y aterriza en una casilla libre; su temblor (0,6× ataque) tiene radio 1 y aturde 0,6 segundos. En ★★★ el temblor alcanza radio 2 y aturde 0,8 segundos. No atraviesa aliados, no sale del tablero y no daña/aturde al equipo. La colocación inicial importa: si no alcanza enemigos no hay impacto a distancia arbitraria.

Las defensas de entrada de ambos equipos se aplican antes de resolver las entradas ofensivas. El reloj de combate no avanza durante los 1,8 segundos de presentación, por lo que el stun se conserva hasta el primer pulso. Cargar la partida no repite la entrada. Los movimientos de maná de Excadrill usan la misma perforación segura y añaden un temblor/aturdimiento al aterrizar (0,6/0,8 segundos por rango), manteniendo el compás de ataque. Aturdimientos superpuestos refrescan hasta el mayor vencimiento, sin sumar duraciones. La ficha y las tarjetas identifican la familia como iniciador de control en área.

Las tarjetas del editor, tienda, banquillo y evolución usan la dirección frontal 0 de SpriteCollab. La orientación del tablero sigue siendo hacia el objetivo.

Validación de esta iteración: 72 pruebas pasan. Los nuevos casos cubren entrada de Excadrill por rango, Drilbur estacionario, bloqueo por aliados, radio real de CC, ausencia de daño/CC aliado, presentación sin consumir el stun, carga sin repetir daño inicial y aturdimientos superpuestos sin sumar duración. Los aturdidos tampoco hacen el salto visual del compás. En /dev/ se verificó la versión 2ebc1f4590 y se revisó visualmente el selector con sprites frontales. Revisión visual de escritorio; Android nativo pendiente.


## Animaciones compartidas con Survivor · 2026-10-23
`js/tft/visuals.js` reutiliza `G.VFX.forMove`, `forType` y `draw`, con las mismas formas pixel art del Survivor. No accede a las colas globales de `G.FX`: la vida de los efectos la controlan los eventos de TFT y no cambia las reglas ni los tiempos de daño. Si un movimiento de TFT no está en el catálogo original, usa un alias visual explícito o la forma de su tipo real. Esfera Aural conserva su paleta de aura. Se representan proyectiles con estela/impacto, garras, mordiscos, meteoros, rayos segmentados, piedras para perforación, ondas de área, corazones de cura y protección de escudo. Las casillas siguen indicando el área real de las habilidades.

Las poses `Charge`, `Attack`, `Shoot`, `Hurt` y `Faint` provienen de las hojas actuales de cada especie. Se seleccionan únicamente animaciones existentes; las ausentes tienen alternativa. Las hojas del equipo y el rival se solicitan al preparar el combate para reducir parpadeos al primer ataque. Las acciones se agrupan por Pokémon: un área no reinicia su pose por cada enemigo alcanzado; los ticks de quemadura se marcan como periódicos y no relanzan el ataque del autor. Carga y lanzamiento caben dentro del intervalo del pulso; la orientación se mantiene durante la acción. La recepción de daño usa `Hurt` cuando no interrumpe otra acción. Pausa congela la presentación; ×2 escala la reproducción. La baja calidad reduce muestras de rayos/partículas; el modo tranquilo presenta impactos y ondas estáticos con menos efectos. Todo usa un lienzo de 600×600 y cachés existentes, sin un bucle de simulación adicional.

Validación: 78 pruebas pasan. Cinco pruebas del renderizador cargan el VFX real del Survivor, comprueban vocabulario y tipos, poses existentes en los 102 rangos, solicitudes de hojas locales sin duplicados, agrupación de acciones, reducción de trabajo en calidad baja/modo tranquilo y dibujo sin modificar la simulación ni acceder a G.FX. Otra prueba comprueba que las quemaduras reales emiten daño periódico sin otro lanzamiento. En /dev/ se verificó la versión fa4ae3db24: equipo real con Squirtle, Charmander y Pichu, proyectiles eléctricos pixel art visibles, pausa con reloj estable, reanudación y ×2 hasta terminar la ronda. Sin errores registrados del juego. Revisión visual de escritorio; Android nativo pendiente.


## Disposición centrada en el tablero · 2026-10-23
La pantalla de partida ocupa el área visible (`100dvh`) sin desplazamiento global. El tablero y los controles de pausa, velocidad y ronda permanecen en su zona. Los cinco paneles (Tienda, Equipo, Ficha, Rival, Informe) comparten un área con desplazamiento propio. En móvil vertical se sitúan debajo; en horizontal y escritorio, al lado. Sus pestañas tienen roles/relaciones ARIA y navegación con flechas, Inicio y Fin. Ocultar panel lo recoge y tocar una pestaña vuelve a abrirlo.

Comprar sigue ocurriendo en Tienda; desplegar y vender se gestionan desde Equipo. Tocar una unidad del tablero o del rival abre Ficha sin mover el tablero. Al combatir se recoge el panel; al terminar se abre Informe y al pasar de ronda vuelve Tienda. Mi mazo, guardado, nueva partida y reglas quedan en Equipo. Las evoluciones y entradas se muestran sobre la parte inferior del tablero, sin capturar toques y sin alterar el tamaño de la arena. Los avisos completos de habilidades siguen disponibles en Ficha. El editor de mazos conserva su lista desplazable independiente.

Validación de la disposición: 78 pruebas del motor, renderizador, empaquetado y controles pasan. Se ejecutó también la prueba de navegador con Chromium en 1280×800, 390×844, 320×568, 844×390 y 568×320. Comprueba que todo el tablero queda dentro del área visible, que la pantalla no tiene desplazamiento global, que desplazar Equipo no mueve el tablero y que pestañas, teclado, ocultar/mostrar, compra, fusión, colocación, combate, pausa, informe y continuación guardada siguen funcionando. Se revisaron capturas vertical y horizontal. Para arrancar los casos verticales se entra al menú del Survivor en horizontal y se rota al abrir TFT, conservando el comportamiento de orientación del juego normal. Se usa un navegador de escritorio con emulación táctil; no equivale a una prueba en Android nativo.


## Más entradas activas y CC sin pausa global · 2026-10-23
Se añaden nueve entradas activas a la sísmica (10 familias en total), conservando los bonos pasivos previos: Charmander lanza un cono de fuego con quemadura; Squirtle una oleada con empuje; Pichu una descarga que aturde a un objetivo; Gastly un golpe de sombra con ralentización; Ralts una barrera para dos aliados vulnerables; Beldum un impacto de Acero con aturdimiento, en zona desde ★★; Lapras un velo de escudos al equipo; Larvitar arena alrededor del usuario con ralentización; Mudkip una oleada de lodo ralentizante, en zona desde ★★. Fuerza, alcance o protección mejoran por estrellas. No gastan maná ni sustituyen los movimientos de 100 de maná. Si la entrada ofensiva no alcanza enemigos, no se dispara a través de todo el tablero. Las defensas y barreras de ambos equipos se aplican antes de las entradas ofensivas.

El campo `opening` es ahora sólo la duración visual del anuncio (1,2 s): no bloquea ni retrasa la simulación. El primer pulso ocurre a los 0,05 s, mientras los avisos pueden seguir visibles. Se sustituye la anterior presentación de 1,8 segundos que detenía a ambos equipos y podía confundirse con aturdimiento global. Cargar la partida no vuelve a ejecutar entradas.

`stun` es la única frontera para aplicar aturdimiento: rechaza al lanzador, aliados, objetivos derrotados y duraciones inválidas. Guarda el autor y conserva el mayor vencimiento, sin sumar duraciones. Se comprueba otra vez al resolver cada ataque ya preparado, para que un stun recibido en ese mismo pulso lo cancele. La onda de Excadrill ya filtraba enemigos; no se encontró un caso de CC aliado causado por él en la simulación. El cambio visual distingue el efecto real: marca CC, autor y duración en ficha, y casillas resaltadas únicamente para víctimas rivales vivas que aún estén aturdidas. Un Excadrill del equipo contrario sí puede aturdir a nuestras unidades y su autor aparece como rival.


Validación: 85 pruebas pasan, más la prueba completa de navegador en cinco tamaños de pantalla. Los casos nuevos recorren las nueve familias activas en sus tres niveles, comprueban alcance, separación de bandos, conservación de maná y ausencia de solapamientos; reanudan cada familia sin repetir entradas; verifican CC aliado rechazado, CC enemigo válido, interrupción de ataque en el mismo pulso, expiración de estados y casillas de CC sin aliados. La regresión de Excadrill muestra a un aliado moviéndose con el anuncio aún visible mientras las víctimas rivales siguen aturdidas. Se mantiene el tablero fijo y los paneles nuevos.


### Expansión de veinte familias · 23 de octubre de 2026

El roster actual tiene 54 familias y 162 rangos de movimientos definidos. Se preservan los mazos de diez líneas, las partidas guardadas y la publicación aislada en `/dev/`. Las habilidades son adaptaciones para TFT; las fichas describen sus efectos reales, no pretenden implementar todo el sistema de habilidades de los juegos principales. Todas las nuevas familias usan sprites locales del Survivor.

| Generación | Familias añadidas (evolución final) |
|---|---|
| I | Gyarados, Dragonite |
| II | Typhlosion, Feraligatr |
| III | Sceptile, Milotic |
| IV | Torterra, Infernape, Empoleon, Garchomp |
| V | Serperior, Samurott, Hydreigon |
| VI | Greninja, Goodra |
| VII | Decidueye, Incineroar, Kommo-o |
| VIII | Dragapult |
| IX | Baxcalibur |

La configuración de cada familia reúne línea, coste, rol, habilidad, entrada por rango y tres movimientos en `EXPANSION`. Las entradas reutilizan el resolvedor de habilidades con parámetros explícitos, sin consumir maná y con alcance inicial 3/3/4 casillas. Las entradas de protección se resuelven antes de las ofensivas en ambos bandos. Magikarp tiene escudo al inicio y Salpicadura protectora; Gyarados adquiere intimidación del 8% (tope compartido con Salamence e Incineroar) y empuje. Milotic limpia estados y cura; Empoleon protege aliados; Decidueye controla objetivos; Dragapult perfora líneas; Baxcalibur combina hielo y remate dragón. No hay inmunidad permanente ni control global nuevo.

Validación de la expansión: 89 pruebas automatizadas pasan; casos nuevos recorren las 20 familias en sus tres niveles, comprueban entradas con efecto real, evoluciones, ausencia de daño/estados aliados, límites de alcance, intimidación sin acumulación y guardado determinista. Los 60 combates terminan sin solapamientos ni pagos duplicados. Se precargan y verifican los archivos de animación de todo el roster. La regresión completa de interfaz pasa en 1280×800, 390×844, 320×568, 844×390 y 568×320, con selección y persistencia de Magikarp en el mazo de diez líneas.


### Recuperación después del final · 23 de octubre de 2026

`Nueva partida` estaba dentro de Equipo → Opciones y reglas, mientras que los finales abrían Informe. Se mueve a las acciones principales junto al tablero, fuera de los paneles y de los detalles plegables, para que siempre sea accesible en victoria/derrota, incluso recuperadas del guardado. El reinicio conserva los tres mazos, elimina sólo la partida TFT y limpia pausa/aviso de salida/reloj de guardado; después abre el editor y enfoca Jugar con este mazo. En partidas en curso mantiene la confirmación previa.

Validación: 89 pruebas pasan y la regresión de navegador recorre cinco tamaños. Reproduce victoria de ronda 12 y derrota con cero vida, sale y recupera cada final del guardado, comprueba el botón desde las cinco pestañas y con panel oculto, empieza una nueva partida con ronda 1, 50 PV, 10 oro y equipo vacío, y verifica que los mazos y la cuenta Survivor no cambian.


### Segunda expansión: 25 familias y economía inicial · 23 de octubre de 2026

El roster pasa de 54 a 79 familias, con 237 rangos de movimientos definidos y los 27 iniciales de las nueve generaciones. Los diez pseudolegendarios ya estaban representados antes de esta tanda. Se amplía la selección económica: hay 21 familias de coste 1 en el roster completo, diez de ellas nuevas. Todos los sprites y animaciones provienen de los assets locales del Survivor.

| Coste de la línea | Nuevas familias (evolución final) |
|---|---|
| 1 oro · 10 | Nidoking, Clefable, Arcanine, Poliwrath, Azumarill, Breloom, Emboar, Chesnaught, Rillaboom, Corviknight |
| 2 oro · 8 | Delphox, Primarina, Cinderace, Inteleon, Meowscarada, Skeledirge, Quaquaval, Weavile |
| 3 oro · 5 | Snorlax, Aggron, Rotom, Ferrothorn, Chandelure |
| 4 oro · 2 | Aegislash, Archaludon |

Las familias incluyen sus preevoluciones; Rotom ocupa una sola especie y se potencia al subir estrellas. Poliwag sigue la rama Poliwrath, Sneasel la de Weavile y Duraludon evoluciona en Archaludon. Las habilidades son adaptaciones para TFT y las fichas describen el efecto exacto. Los costes no alteran las reglas de combinar tres copias ni el precio de venta. No se cambian los mazos existentes, ni las probabilidades por categoría de coste, ni el límite de interés, ni el final de partida.

Las opciones baratas cubren tanque, daño, curación y control; las demás añaden perforación, curación de estados, protección, ataques en línea y remates. Las entradas ofensivas siguen usando alcance 3/3/4 y sólo enemigos; las barreras se resuelven antes de las entradas ofensivas. Arcanine comparte el tope de intimidación del 8% con las demás familias que intimidan, sin acumulación.

Ferrothorn usa el nuevo efecto pasivo `thorns`: devuelve el 20% de la vida efectivamente perdida por un ataque básico adyacente como daño de Acero, mitigado normalmente. No devuelve daño absorbido por escudos, ataques a distancia, movimientos especiales ni daño periódico. El reflejo se registra como daño periódico de habilidad para evitar cadenas y animaciones de lanzamiento espurias. Si el atacante muere por el reflejo no puede lanzar su movimiento de maná después. Descanso de Snorlax usa curación y limpieza propias, incluso si otro aliado está más herido.

Validación de reglas: 93 pruebas automatizadas pasan. La cobertura de familias recorre ahora las 45 añadidas entre ambas expansiones en los tres niveles: evolución, habilidad de entrada real, alcance, separación de bandos, guardado determinista, combate sin solapamientos ni pagos duplicados. Se comprueba el reparto de precios 10/8/5/2 y la disponibilidad de los 27 iniciales, así como reflejo de contacto sin cadenas y Descanso aplicado al usuario.

Validación de interfaz: pasa la regresión completa en 1280×800, 390×844, 320×568, 844×390 y 568×320. Incluye filtro de 1 oro (21 líneas), selección y persistencia de Tepig, mazo de diez familias, despliegue, combate, pausa, reanudación y reinicio tras victoria/derrota guardada sin tocar la cuenta Survivor.


### Orden de Pokédex en el editor · 23 de octubre de 2026

El editor ordena una copia filtrada de las familias por `dex` (número de la primera etapa de la línea). El orden es numérico ascendente tanto con Todos como al filtrar por coste. No se reordena el catálogo del motor, para conservar la secuencia de RNG y el orden de los mazos guardados. Validación: dos pruebas de empaquetado y la regresión de navegador en cinco tamaños, con comprobaciones de orden en las 79 líneas y en las 21 de coste 1.

Recuento por rol declarado del catálogo: 9 sanadores, 24 tanques, 20 magos y 26 luchadores. En la segunda expansión de 25: 3 sanadores (Clefable, Rillaboom, Primarina), 10 tanques (Poliwrath, Emboar, Chesnaught, Corviknight, Skeledirge, Snorlax, Aggron, Ferrothorn, Aegislash, Archaludon), 4 magos y 8 luchadores. Algunas familias de otros roles también aportan curación o escudos.


### Talonflame: Alas Vendaval · 23 de octubre de 2026

Se añade Fletchling (#661) → Fletchinder (#662) → Talonflame (#663) por 2 oro, rol luchador. El roster llega a 80 familias y 240 rangos de movimientos definidos. La familia aparece en el lugar numérico correspondiente del editor de mazos.

Alas Vendaval se inspira en la prioridad Voladora con vida completa de los juegos principales, adaptada a la unidad de acción del TFT: mientras tenga toda su vida, su turno se resuelve antes que el de unidades sin prioridad dentro del mismo pulso de ataque. No adelanta el reloj, no genera ataques extra y no evita alcance, enfriamiento, muerte o aturdimiento. A igualdad de prioridad se conserva la iniciativa alternada del compás. Recibir daño a la vida desactiva la prioridad; volver al máximo la reactiva. Los escudos no alteran la condición de vida completa. La ficha distingue entrada y pasiva condicional, y muestra Prioridad activa/inactiva durante el combate.

La entrada Viento Afín aumenta la cadencia de todos los aliados un 8/12/16% durante 2 segundos según estrellas. Usa los temporizadores existentes; varias fuentes conservan el mayor bono activo y renuevan la duración, sin multiplicar bonos repetidos. Los básicos de toda la familia son Voladores; Picotazo aumenta temporalmente su cadencia, Nitrocarga quema y aumenta su cadencia, Pájaro Osado daña en radio 1 alrededor del objetivo, ignora el 30% de defensa y mejora hasta un 25% contra rivales heridos. No hay salto a través de aliados ni teletransporte.

Validación: 96 pruebas pasan y la regresión de interfaz completa pasa en cinco tamaños de pantalla. Casos nuevos comprueban prioridad con ambos bandos, pérdida y recuperación al curar, daño Volador de básicos, respeto de compás/alcance/CC, Viento Afín sin buff a enemigos y sin acumulación, expiración de bonos, evolución en los tres niveles, guardado determinista y final de combate.


## Estado actual: oleadas infinitas y primera mejora de animación · 23 de octubre de 2026

El modo pasa a supervivencia PvE. Se conserva la economía, mazo de diez familias, evoluciones, formación y compás de cuatro pulsos. Hay cinco plantillas de encuentro (Enjambre, Vanguardia, Artillería, Bastión, Expedición), variantes especiales cada 5 oleadas y un jefe legendario cada 10. Los jefes rotan Articuno → Zapdos → Moltres → Kyogre → Groudon → Rayquaza y repiten con más dificultad. Nunca se supera el límite de seis enemigos; como máximo hay un sanador por encuentro, contando tanto el rol declarado como las IA sanadoras de las especies (por ejemplo, Shroomish). Estrellas, coste y estadísticas crecen con la oleada; los jefes tienen triple vida y mitad de duración de CC.

Los jugadores disponen de 79 familias. Rayquaza permanece en los datos del motor como enemigo, pero no aparece en mazos, tienda ni compras. Los otros cinco jefes usan definiciones separadas fuera del catálogo del jugador, sprites existentes y movimientos reales del resolvedor de TFT. Los encuentros se generan una vez por oleada; mirar, comprar y recolocar no cambia el rival ni consume más RNG. Preparación sin temporizador, combate de 45 segundos, curación entre oleadas, derrotas de hasta 12 PV y botín extra de 2/4 oro al ganar especiales/jefes. Interés máximo 5 como antes.

Guardado: esquema 2 en la misma clave `ps.tft.match.v1`. La versión 1 se valida y migra: reemplaza la línea de Rayquaza en el mazo sin duplicados, devuelve el coste de las copias compradas, y permite continuar las antiguas victorias. Un combate antiguo vuelve a preparación de su oleada con sus otras unidades y economía conservadas. Reanudar un combate nuevo mantiene la simulación y comienza en pausa. Los informes guardan totales acumulados por familia y sólo 20 oleadas recientes para evitar crecimiento de memoria. Los validadores aceptan oleadas/counters hasta un millón como límite técnico de datos, sin final de juego asociado.

Récords: clave local `ps.tft.records.v1`, diez expediciones ordenadas por oleada resuelta/alcanzada y PV restantes, un registro por expedición que se actualiza sin duplicar. Se conservan al reiniciar partidas. No se escriben rankings online, Firebase ni cuentas Survivor; compartir clasificación entre dispositivos queda pendiente. La cabecera distingue el récord local y el panel Informe muestra la lista.

Animación: lanzamiento con un impulso breve, proyección con trayectoria suavizada, retroceso y destello al contacto, partículas de impacto, anillos de preparación, barras con rastro de daño y presentación distinta de especiales/jefes. El movimiento es visual y no altera posiciones, daño ni RNG. `TFTVisuals.pose` e `impact` son funciones puras, determinadas por el evento; la pausa congela el progreso, ×2 acompasa la reproducción y modo tranquilo elimina el impulso/retroceso/destello. Calidad baja reduce partículas. Se reutilizan sprites y VFX del Survivor sin sus pools globales.

Validación: 103 pruebas pasan (reglas, visuales, empaquetado y regresiones existentes), más navegador en cinco tamaños: 1280×800, 390×844, 320×568, 844×390 y 568×320. Se recorren 120 oleadas para validar generación, límites, seis jefes, recompensas únicas, guardado posterior a la oleada 12 y total acumulado. Se prueban oleadas tardías, migración con reembolso único de Rayquaza, victoria antigua→oleada 13, combate antiguo→preparación, habilidades de todos los jefes en tres rangos, combate activo contra Kyogre con restauración determinista, CC de jefe y visuales puros. El navegador verifica ausencia de Rayquaza en el editor, récord local persistente tras reiniciar, continuación 12→13, inspección de Articuno y conservación de la cuenta Survivor. Sigue siendo emulación táctil en navegador; no una prueba en Android nativo.

### Balance de oleadas · 23 de octubre de 2026

Máximo 2 tanques por encuentro (incluye IA tanque/guardián) y 1 sanador. Si el tema no tiene candidatos válidos, se completa con familias del mismo límite de precio. Los tanques enemigos infligen un 20% menos de daño; los aliados conservan su ataque. Crecimiento enemigo: +2,5% de vida y +1,5% de ataque por oleada. Dos estrellas desde la 6, todo el grupo a dos desde la 12; primera unidad de tres estrellas en la 25 y una adicional cada 6 oleadas. Los jefes conservan sus estrellas propias. Los encuentros guardados en preparación se regeneran una vez; los combates activos se reanudan intactos y reciben la nueva composición en la siguiente preparación.

### Rangos y economía · 23 de octubre de 2026

Las evoluciones conservan star 1–3 (Bronce). Un Pokémon de Bronce 3 absorbe nuevas compras de su familia en entrenamiento sin ocupar banquillo: 3, 4, 5, 6, 7 y 8 copias para las seis promociones (Plata 1–3 y Oro 1–3). Total 42 copias desde cero. Cada promoción multiplica vida y ataque por 1,18; conserva movimiento, habilidad y estadio final. Vender devuelve todas las copias, incluido entrenamiento parcial. Los enemigos no reciben promociones. Los guardados anteriores equivalen a promoción y entrenamiento cero; los informes conservan el rango.

Interés sin tope: floor(oro/5), calculado antes de cobrar. Base 5 + floor((oleada-1)/5), hasta 20; victoria +1, racha hasta 3. Especial +4 y jefe +10+2*floor(oleada/10) al ganar. La cartera admite hasta 999999999999 por seguridad numérica. Cada tienda conserva probabilidades por precio entre candidatos válidos, máximo 2 ofertas por familia, excluyendo familias propias en Oro 3. Si quedan menos de tres familias puede haber casillas vacías para respetar el límite; sin candidatos no se cobra una renovación.

### Presentación de jefes y final de expedición · 23 de octubre de 2026

La UI llama start(s,{presentation:true}) para jefes: intro de 2,8 s en el reloj de simulación. Hasta acabar o saltarla no se aplica entrances ni avanzan time, apertura, estados ni pulsos. Los consumidores sin interfaz pueden omitir la presentación. skipIntro comparte el mismo cierre único. La secuencia se guarda con el combate; vuelve en pausa sin repetir efectos. La cámara se calcula de forma pura en TFTVisuals.bossCamera; pausa y velocidad usan el mismo reloj. Calm y prefers-reduced-motion eliminan zoom y desplazamientos; se conserva la etiqueta sin parpadeos. Las casillas no se pueden seleccionar durante el zoom.

Al agotar los PV aparece un panel desplazable sobre el tablero, con oleada, récord local, victorias, daño/curación acumulados, MVP de daño y equipo final desplegable. Los totales usan el acumulado de toda la expedición, no sólo las últimas 20 oleadas. Ver informe cierra el panel, Ver resumen final lo reabre y Jugar de nuevo usa el reinicio habitual conservando mazos y récords. No añade rankings online.

### Jefes solos · 23 de octubre de 2026

Encuentros de jefe con una sola unidad, sin escoltas, en casilla 8 (fila 2, columna 3). Tamaño de sprite 100 en lugar de 82 (+22%); zoom y cartel se conservan. Multiplicador de vida ×3,5 en lugar de ×3, sin aumentar el ataque. Versión de composición 2: preparación antigua se regenera una vez; combates activos se conservan.

### Publicación Live y ranking · 23 de octubre de 2026

Cinco vidas al empezar, una por derrota o tiempo agotado, sin daño variable al entrenador. Guardado versión 3: las versiones anteriores convierten PV en ceil(PV/10) vidas, mantienen el progreso y quedan fuera del ranking. Los récords locales de las reglas antiguas permanecen en la clave v1; las nuevas usan v2.

Ranking TFT separado: lb/s_tft1_{periodo}/e/{uid} y lbs/s_tft1_{periodo}, compatible con las reglas single player existentes (prefijo s_). t representa oleada alcanzada; lv repite oleada, kills contiene victorias y dex el Pokémon con mayor daño. Sólo expediciones nuevas de una cuenta (rankOwner/rankRules=1), al llegar a cero vidas. Previews G.TFT_PREVIEW e invitados no escriben. Sin recompensas de Survivor ni escrituras en sus tablas. Empates de oleada conservan la marca anterior; no se desempata por tiempo.

Pendientes locales por dueño/tabla, acotados a 40, conservando el histórico. Cuatro transacciones compatibles con las reglas de entrada y resumen; sólo mejoran marcas. Subir una marca no borra un pendiente más reciente; errores y cambios de cuenta dejan la marca pendiente del dueño correcto. Reintentos al recuperar conexión, cada minuto con pendientes y desde el resumen. El ranking se puede leer por periodos y amigos; se oculta el filtro por Pokémon en TFT.

### Tercera expansión de familias · 23 de octubre de 2026

25 familias nuevas: tres de Kanto, Johto, Hoenn, Sinnoh, Teselia, Kalos y Alola; dos de Galar y Paldea. Roster de datos 105 (Rayquaza sigue reservado a jefe), 104 familias jugables. Costes nuevos 10/9/5/1 de 1/2/3/4 oro. Roles nuevos: 5 healers, 4 tanques, 7 magos y 9 luchadores. Todos los 27 iniciales y 10 pseudolegendarios ya estaban incluidos.

Familias: Caterpie, Zubat, Slowpoke; Hoppip, Heracross, Skarmory; Meditite, Numel, Sableye; Budew, Shinx, Hippopotas; Timburr, Cottonee, Joltik; Espurr, Skrelp, Hawlucha; Mareanie, Bounsweet, Grubbin; Hatenna, Impidimp; Tandemaus, Charcadet. Slowpoke sigue la rama Slowbro, Charcadet la rama Ceruledge. Las familias de una o dos etapas potencian la forma final al tercer rango.

Se reutilizan hojas locales de sprites. Las habilidades son adaptaciones explícitas, no copias exactas de todas las mecánicas de los juegos originales: Espejo Mágico limpia estados y protege aliados al entrar; Presencia Regia ralentiza enemigos cercanos; Compiescolta concede protección y cadencia. Nuevo selfDrain: curación propia proporcional al daño efectivo contra vida (hit devuelve lost), sin escudos ni overkill. Lo usan Chupavidas, Puño Drenaje y Espada Lamento. El catálogo crece sin modificar las composiciones de oleadas ni reiniciar partidas, mazos o ranking. Se eligen las familias desde el editor antes de una nueva expedición.

### Tyrantrum y Haxorus · 23 octubre 2026
- Axew → Fraxure → Haxorus: 2 oro, atacante. Rompemoldes adaptado ignora 20% de defensa (no anula habilidades). Entrada rompe 20/30/40% de escudo y perfora defensa. Garra Dragón, Danza Dragón y Enfado; este último golpea enemigos en radio de 1 casilla del usuario.
- Tyrunt → Tyrantrum: 3 oro, atacante. Mandíbula Fuerte adaptada aumenta daño 10%. Entrada mordisco con aturdimiento de 0,25/0,35/0,45 s. Mordisco, Triturar y Testarazo; este último empuja y aturde al objetivo. Tyrantrum permanece en su forma final en Bronce 3.
- 106 familias jugables; mantienen las reglas de mejoras, mazos y guardados actuales.


### Reworks tácticos · 24 octubre 2026
Aplicados a las formas finales: Maushold Bronce 3, Aegislash, Talonflame y Greninja. Las etapas previas mantienen sus movimientos. Maushold activa una cadena de 3/3/4 impactos al 55% del ataque en los tres siguientes pulsos de ataque, sin básicos ni maná ofensivo durante ella. Cada pulso aturdido o fuera de alcance pierde su lote; retoma sobre el enemigo más cercano si muere la presa. Aegislash obtiene un escudo del 30% de vida y en el siguiente pulso disponible consume la mitad del escudo restante para sumar esa cantidad a una estocada del 280% del ataque con 50% de perforación. Aturdirlo demora la estocada. Talonflame aterriza junto al enemigo más lejano con una casilla libre; si no hay aterrizaje legal ataca desde su posición. Daña enemigos a distancia Manhattan 1 del aterrizaje al 280% del ataque con 30% de perforación. Retroceso del 10% de vida máxima, sin bajar de 1 PV, registrado como daño recibido sin conceder bajas. Greninja realiza hasta dos pasos legales en cada pulso de movimiento, incluyendo retirada; no atraviesa unidades y se detiene al alcanzar su rango. Los estados pendientes se guardan y validan sin reiniciar combates existentes. Efectos visuales de ratones, vuelo y cartel de postura; movimiento reducido mantiene la información sin el arco de vuelo.


### Segunda tanda de reworks tácticos · 24 octubre 2026
- Gengar (94, tercera etapa): al lanzar Emboscada Sombría queda pendiente; desaparece en el siguiente pulso de movimiento y reaparece en el siguiente de ataque. No puede recibir daño ni ser seleccionado mientras está oculto; mantiene reservada su casilla para evitar superposición. Elige al enemigo con menor proporción de vida que tenga una casilla adyacente libre, se desplaza y golpea con 340% del ataque Fantasma. Una baja devuelve 50 de maná. Aturdirlo antes de ocultarse cancela la preparación. Sin aterrizaje legal, consume la habilidad sin golpear. No concede maná ofensivo extra por la emboscada.
- Gardevoir (282) conserva su curación/escudo. Rescate se comprueba antes de contabilizar un golpe letal: una Gardevoir viva, sin aturdimiento, a distancia Manhattan <=3 puede salvar a otro aliado una vez por combate. Lo deja a 1 PV y lo mueve a una casilla libre estrictamente detrás de ella (hacia su lado del tablero); concede un escudo del 25% de la vida máxima del receptor después de resolver el daño. Sin espacio no consume el rescate. No se rescata a sí misma ni revive; ataques posteriores pueden derrotar al receptor. El informe sólo cuenta daño efectivo, sin bajas falsas.
- Tinkaton (959): fija la casilla del objetivo al lanzar. No se desplaza mientras prepara. El siguiente pulso de ataque rompe todos los escudos enemigos a distancia Manhattan <=1 de ese punto y golpea con 450% del ataque Acero. No afecta a aliados; esquivar el área evita el golpe. Pierde el siguiente pulso de ataque por recuperación. Aturdirla cancela la preparación sin devolución de maná.
- Scizor (212, etapas segunda y tercera): sustituye el kit anterior por Puño Bala en ambas etapas. Su pasiva Experto potencia +50% exclusivamente los impactos explícitamente débiles de Puño Bala. Al lanzar obtiene tres pulsos de prioridad; cada uno sustituye el básico por dos golpes Acero al 60% del ataque antes de Experto, ajustados a cadencia/ralentización. Sin maná ofensivo durante la ráfaga; recibir daño conserva las reglas de maná normales. Aturdimiento o falta de alcance pierde el pulso. La prioridad comparte la misma cola que los básicos y las otras habilidades pendientes; empates conservan la iniciativa alternada. Scyther conserva su kit previo.
- Estados pendientes validados y guardados como campos primitivos; combates previos siguen siendo válidos. Indicadores de ocultación, rescate disponible/usado, preparación, recuperación y pulsos restantes. Efectos de portales, zona marcada y pinzas de Acero con estela roja, con variante de movimiento reducido.


### Heracross, Sceptile, Empoleon y Dragapult · 24 octubre 2026
- Heracross (214, los tres rangos): Llave de Relevo golpea al enemigo adyacente por 200/240/280% de ataque Lucha y, si sobrevive, lo lanza a la casilla cardinal opuesta detrás de Heracross. Requiere casilla libre dentro del tablero; contra jefes sólo hace daño. No lanza aliados ni deshace un teletransporte de Rescate ocurrido durante el golpe. Animación de arco para la unidad lanzada; movimiento reducido muestra la posición final.
- Sceptile (254, forma final): Danza de Hojas consume los tres siguientes pulsos de ataque, sin básicos ni maná ofensivo. Primer corte 130% Planta y un rodeo lateral, segundo 160% y un intento de llegar detrás de la presa; sólo ese flanqueo exitoso concede 40% de perforación al segundo corte. Los rodeos necesitan dos pasos por casillas libres en una esquina, sin atravesar a la presa ni aliados. Finaliza con cono de Lluevehojas al 240%, alcance euclidiano 3 y coseno angular >=0,65. Aturdirse o quedar fuera de alcance pierde el paso correspondiente. Sigue a su presa entre pulsos y busca otra si cae o desaparece. Treecko y Grovyle conservan su kit.
- Empoleon (395): Rompeolas fija origen, rumbo cardinal hacia el objetivo y potencia al lanzar. En cada pulso de movimiento, después del desplazamiento de las unidades, la ola avanza una franja de hasta tres casillas (se recorta en bordes). Cada enemigo puede recibir un único impacto por ola al 250% del ataque de lanzamiento y un empuje de una casilla libre en ese rumbo; los jefes no se empujan. No afecta aliados ni objetivos ocultos. La ola continúa si Empoleon se desplaza o cae mientras el combate siga activo. El lanzamiento permite a Empoleon seguir atacando normalmente después. Hasta 48 olas guardadas, con historial individual de víctimas validado; estado opcional para compatibilidad con partidas anteriores.
- Dragapult (887): Dracoflechas selecciona un corredor cardinal central hacia su presa y uno adyacente válido, favoreciendo el lateral con más enemigos. Dos Dreepy, corredores distintos; aliados no bloquean ni reciben daño. Cada Dreepy golpea al primer enemigo al 110% del ataque, y si hay segundo explota allí al 180% en radio Manhattan 1. Si sólo hay uno, el regreso golpea de nuevo al superviviente al 160%. Perforación 40%. Los corredores vacíos no causan daño; los efectos usan el sprite local de Dreepy. El daño resuelve en el pulso del lanzamiento; ida, regreso y explosión se representan visualmente. Dreepy y Drakloak conservan sus movimientos previos.
- Las secuencias de Sceptile y las olas se serializan y validan sin reiniciar combates. Los desplazamientos comprueban ocupación y límites. Los reportes conservan daño efectivo y bajas reales, incluyendo interacciones con Rescate.

### Pseudolegendarios: Tres Cabezas, Vuelo Rasante y Levitación Magnética

- Hydreigon sustituye sus básicos durante dos pulsos por tres disparos de 80% del ataque. Prioriza presas distintas dentro de alcance 3; concentra cabezas sobrantes y reasigna bajas. Sin maná ofensivo; el aturdimiento consume el pulso.
- Salamence marca un corredor cardinal y no se mueve durante la preparación. En el siguiente pulso de ataque golpea el corredor por 300% del ataque y aterriza en la última casilla libre. Aturdirlo cancela la pasada.
- Metagross levanta a un enemigo adyacente, impidiendo ataques y movimiento a ambos hasta el siguiente pulso de ataque. Lo estrella hasta dos casillas más allá, si hay espacio, por 260% del ataque en radio 1. Los jefes no se levantan ni desplazan. Aturdimiento o muerte del lanzador libera sin impacto. La presa conserva su casilla durante la preparación y puede recibir daño.
- Mecánicas exclusivas de sus formas finales; estados y referencias se validan al restaurar una partida.
