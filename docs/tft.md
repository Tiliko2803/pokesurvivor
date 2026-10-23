# TFT · Evoluciones — alpha

Development branch: `feat/tft-mode`. Test URL:
https://tiliko2803.github.io/pokesurvivor/dev/
Entry: Jugar → TFT · Evoluciones. Hoenn preview remains available.

## Decks (requested first)

- Three local slots, each exactly ten distinct evolution families out of 34.
- A family includes its complete line; species are not separate deck slots.
- Tap to select/remove families; filter by cost; save or start when count is ten.
- Browser preferences use only `ps.tft.decks.v1`. Invalid data or blocked storage
  falls back to defaults/in-memory play; it never touches account save keys.
- Default: Bulbasaur, Charmander, Squirtle, Pichu, Gastly, Ralts, Drilbur,
  Larvitar, Beldum, Rayquaza. All six signature families are included.
- A match snapshots the selected deck. Refreshes and new rounds only draw from
  its ten families. Buying an injected off-deck offer is rejected by the engine.
- Normal level rarity weights are normalized over costs present in the deck.
  If no cost has nonzero weight, the cheapest chosen tier is offered instead.
  This allows any ten valid lines, including decks without cost-1 families.
- Opposing AI keeps the full roster. Decks are independent of owned collection.
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

6×6 board, three player rows, eight bench slots, levels 3–6, 12 PvE rounds and a
final Rayquaza encounter. Three equal-star copies merge; 9 base copies make one
three-star unit. Two-stage families empower the evolved form at rank three;
single-stage species empower. Eevee currently uses Vaporeon only.

50 initial PV, 10 gold, 5 shop offers. Refresh costs 2, four XP cost 4, two XP
arrive after a round. Income: 5 + 1 per win + interest (floor(gold/5), capped at 5; maximum at 25 saved gold) +
streak bonus (one per two consecutive results of the same sign, capped at 3).
2/4 distinct deployed families activate type synergies. Fixed 50 ms simulation,
45-second round limit (timeout loses), pause and ×2. Survive 12 rounds to win.

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
