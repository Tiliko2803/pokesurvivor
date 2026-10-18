# Boss Rush de Hoenn — Tierra, océano y cielo

## Diseño acordado

La ruta empieza con dos menores y alterna los mayores con otras dos parejas:

1. Dos legendarios menores del juego existente.
2. Groudon.
3. Otros dos legendarios menores.
4. Kyogre.
5. Otros dos legendarios menores.
6. Rayquaza.

El jugador empieza directamente en nivel 8, elige siete mejoras antes de combatir y conserva ataques, estadísticas y experiencia entre encuentros. Los menores sirven para ganar poder antes del siguiente mayor. Las sinergias cooperativas se incorporarán después; no son requisito del prototipo individual.

## Implementado

`dev/index.html` usa los módulos actuales del juego y carga un adaptador exclusivo de pruebas. La ruta disponible es dos menores → Groudon → dos menores → Kyogre → dos menores → Rayquaza. Son nueve combates con seis menores distintos; se conserva la build durante toda la ruta. Rayquaza cierra la ruta con una arena celestial propia.

- Tres Pokémon de prueba: Swampert, Blaziken y Sceptile. Selección de dos ataques distintos; al menos uno causa daño.
- Rayquaza: jefe final con 5000000 PV base, multiplicados por el equipo inicial (5/10/15/20 millones para 1/2/3/4 jugadores). Entra en el noveno combate a nivel 28 sin bonos de XP; con todo el oro, la referencia llega al 34. Fases al 70%/35%, movimiento entre lanzamientos a 112/130/148 unidades por segundo y avisos normales de 1.45/1.15/0.90 segundos. La cadencia usa esperas de 0.32/0.20/0.12 segundos. Sigue el validador de salida a pie de Kyogre, adapta avisos a jugadores ralentizados y reduce combinaciones si hace falta. Las señales ya visibles nunca se acortan por cambiar de fase.
- Ascenso Draco (Volador): picado a un círculo fijo de 58 unidades, con elevación visible antes del impacto y 0.85 s de recuperación. Velocidad Extrema (Normal): embestida por el corredor anunciado a 800/900/1000 unidades por segundo; sólo el contacto real de Rayquaza daña, sin retroceso. Pulso Dragón (Dragón): un único haz continuo violeta de 42 unidades de grosor. Vendaval (Volador): tornados fijos de 43 unidades alrededor de las posiciones anunciadas, hasta cuatro jugadores. Cometa Draco (Dragón): impactos anunciados en posiciones de los jugadores y tres zonas secundarias fijas, avisos de 1.90/1.60/1.35 segundos y 1.7 s de recuperación. Geometría y tiempos son adaptaciones para Boss Rush de movimientos reales de Rayquaza.
- Fases 1/2/3 de Rayquaza: uno/dos/hasta tres movimientos a la vez. Cometa Draco siempre va solo al entrar en las fases 2 y 3; Ascenso Draco y Velocidad Extrema no se combinan entre sí para no exigir dos movimientos del cuerpo contradictorios. Los impactos comparten una protección de 0.9 segundos por jugador. No hereda lava, lluvia, ralentización de hielo ni daño de retroceso. Su derrota entrega exactamente un Vínculo y termina la prueba después de resolver las elecciones pendientes.
- Efectos exclusivos de Rayquaza en atlas transparente de 4×5 celdas y cuatro fotogramas por ataque: picado esmeralda/dorado, estela plateada, rayo violeta continuo, tornado jade y meteoros púrpura/dorados. Los meteoros descienden al final del aviso y explotan al empezar el daño. La arena tiene suelo de templo celestial continuo y transitable hasta los cuatro bordes, sin barreras ni charcos decorativos que alteren la velocidad. Los efectos respetan los ajustes gráficos y de sacudidas.
- Kyogre entra en el sexto combate, a nivel 19 sin bonos de experiencia, con 2500000 PV base y fases al 70%/35%. El dueño fijó esta vida después de revisar Onda Certera + Danza de Mil Espadas evolucionadas, fusionadas y con mejoras de oro máximas. Usa el mismo reloj, límites, movimiento entre lanzamientos, pausa y protección compartida de impactos que Groudon. Su arena marina ocupa toda la pantalla y tiene suelo transitable, sin penalización de velocidad por agua decorativa. Su victoria da tres niveles, recuperación y un Vínculo.
- Kyogre acelera también la señal de peligro: avisos normales de 1.55/1.20/0.90 segundos y pausas entre ataques de 0.38/0.24/0.14, según fase. Una señal ya visible nunca se acorta al cruzar un umbral. En fases 2/3 combina dos/tres movimientos. Para cada jugador se verifica una salida con 0.22 segundos de reacción, velocidad máxima de referencia 130 y su velocidad efectiva si está ralentizado. Se amplía el aviso si hace falta; se quita un movimiento secundario si supera 2.1/1.65/1.3 segundos según fase. Un ataque individual puede avisar más tiempo para permitir escapar a un jugador ralentizado.
- Surf anuncia una franja fija y la ola la cruza a 520/580/640 unidades por segundo. Sólo el frente visible causa daño, una vez por jugador. Hidrobomba y Rayo Hielo son corredores fijos desde la boca/aleta; no persiguen al jugador tras el aviso. Rayo Hielo aplica la ralentización nativa durante 0.7 segundos si el impacto realmente causa daño. Los impactos coincidentes aplican un solo golpe y comparten 0.9 segundos de protección.
- Danza Lluvia no causa daño directo: dura 12/16/20 segundos y potencia un 15% los impactos de Agua de Kyogre (adaptación de balance del Boss Rush). Se ve lluvia en píxeles sin ocultar los avisos. Pulso Primigenio se lanza solo al llegar a fases 2 y 3, cubre las zonas anunciadas con columnas de agua y deja un refugio cercano para cada jugador vivo. Avisa un 30% más que un ataque normal y deja 1.6 segundos de recuperación. Kyogre no hereda lava, retroceso ni ataques de Groudon.
- Sprites de efectos generados con Image Generation: atlas transparente de 4×8 celdas, cuatro fotogramas por efecto, compilado a celdas de 64×64 con vecino más cercano. Incluye roca, onda de tierra, lava, embestida, ola, Hidrobomba, hielo y Pulso Primigenio; se usa también en los ataques de Groudon. Los efectos se dibujan a resolución de píxel y se amplían sin suavizado, conservando las señales geométricas para la lectura de colisiones. Calidad gráfica baja reduce partículas y cantidad de sprites. Procedencia y prompt en `assets/boss-rush/README.md`.
- Hidrobomba y Rayo Hielo usan un segundo atlas específico: un haz continuo desde el origen hasta el extremo, con cuatro fotogramas por elemento y sin repetir puntas a lo largo del corredor. Surf, Hidrobomba y Rayo Hielo conservan sus avisos previos, pero durante el impacto se ve únicamente el sprite, sin el rectángulo de colisión alrededor. Las áreas y los tiempos de daño no cambian por esta corrección visual.
- Regla cooperativa preparada: vida de cada jefe = vida base de su posición × número de jugadores al iniciar la partida. Se aplica a mayores y menores una sola vez, al crearlos, sin multiplicar daño, cadencia ni recompensas. Groudon tiene 400000/800000/1200000/1600000 PV para 1/2/3/4 jugadores. La cifra del equipo queda fija durante el intento aunque alguien caiga o salga, y las fases siguen calculándose como porcentaje de la vida máxima. La entrada cooperativa y su sincronización siguen pendientes; estas pruebas verifican el escalado con equipos simulados.
- Nivel 8 con siete elecciones reales usando las cartas del juego. Los ataques empiezan en nivel 1 y se mejoran mediante cartas. El combate queda pausado durante toda la preparación.
- Estadísticas base de la especie con las compras de oro realizadas dentro de la prueba; no se importan compras de la cuenta. Velocidad base de prueba: 130, conservando el multiplicador de Zancada comprado, para que se puedan esquivar los avisos caminando.
- Victoria: los dos menores iniciales dan experiencia equivalente a un nivel base cada uno; desde Groudon se conserva la suma de los requisitos de tres niveles siguientes. Se mantienen los bonos nativos y el reparto de orbes. Todas las victorias curan el 20% de vida máxima y dejan tres segundos antes del siguiente enemigo. Cada legendario mayor (Groudon, Kyogre y Rayquaza) otorga además un Vínculo; los menores no lo otorgan. Se usa la selección y fusión nativa: el intermedio queda pausado mientras eliges y los movimientos del grupo se lanzan juntos. Si aún no se puede fusionar, se conserva el Vínculo. No hay monedas, tickets ni botín equipable.
- Los menores conservan la IA de jefes existente, las preferencias de distancia por tipo y la velocidad de movimiento estándar de las grietas. Su vida sigue presupuestos fijos por posición, descritos abajo; empieza en 240000 y termina en 3600000 PV. El daño empieza en 30 y se multiplica por 1.10 por menor hasta 48. La cadencia empieza en ×1.12 y suma 0.045 por menor, hasta ×1.345. La cadencia total con furia queda limitada a ×1.5. Sólo se reduce la espera entre ataques; no se aceleran los avisos, los proyectiles ni los movimientos. Sin hordas entre combates.
- Groudon: 400000 PV, calibrados con Mega Blaziken en nivel 10 y todas las mejoras de oro. Fases al 70% y 35%. Persigue al jugador entre ataques a 88/100/112 unidades por segundo, se detiene durante los avisos y recuperaciones y usa Doble Filo desde la primera fase. Si el jugador está lejos, sustituye Terratemblor por Estallido. Filo del Abismo y Estallido apuntan a la posición del jugador, incluidas las esquinas, y sus señales quedan fijas después de aparecer.
- Primer aviso a los 0.55 segundos; avisos individuales de 1.15–1.35 segundos y dos segundos para Terremoto. Recuperación normal de 0.55 segundos; Doble Filo recupera 1.35 segundos y Terremoto 2.5. Intervalos de 0.4/0.25/0.15 segundos según la fase. La lava dura cinco segundos y desaparece antes de Terremoto. El refugio se coloca de modo que sea alcanzable.
- Fase 1: ataques individuales más frecuentes. Fase 2: dos movimientos a la vez, incluyendo Filo del Abismo + Estallido o Doble Filo + Estallido. Fase 3: hasta tres, añadiendo Terratemblor a corta distancia o Doble Filo/Filo del Abismo a distancia. Los impactos de cada combinación comparten aviso e instante de activación, y todas las señales y efectos se muestran juntos. Terremoto siempre va solo.
- Antes de anunciar una combinación, se comprueba una salida a velocidad 130 para cada jugador, evitando tanto las áreas anunciadas como los charcos de lava. Si hace falta, el aviso común crece hasta dos segundos; si no hay salida alcanzable con 0.25 segundos de reacción, se reduce la combinación. Las formas no persiguen al jugador después del aviso. El daño coincidente se resuelve con un solo golpe y una gracia compartida de 0.9 segundos, para evitar tres impactos instantáneos.
- Arena que ocupa toda la pantalla de juego, con un mínimo de 960×560 unidades y dimensiones adaptadas a su proporción. El suelo volcánico continuo llega a los cuatro bordes, sin marco de lava ni franjas vacías; la barra y los controles se superponen. Patrones, límites de los actores y cámara comparten las dimensiones actuales, y las paredes del mundo quedan más allá de las esquinas visibles. Al girar la pantalla y reducir mucho un eje, se retiran los ataques anteriores y se concede un segundo de protección al recolocar a los Pokémon. Doble Filo conserva su velocidad de desplazamiento en arenas altas. La cámara vuelve a su escala normal al salir. El suelo de roca irregular, ceniza y grietas se dibuja una vez y se reutiliza, sin cuadrícula ni obstáculos aleatorios.
- Efectos específicos: pilares de obsidiana para Filo del Abismo, ondas y cascotes para Terratemblor, columnas de lava y burbujas para Estallido, flechas/estela y aura clara para Doble Filo, y fracturas ramificadas para Terremoto. Los sonidos varían por movimiento. Las señales de peligro permanecen fijas y la zona segura de Terremoto sigue despejada. Los efectos usan el reloj de combate, respetan la calidad gráfica y el ajuste de menos sacudidas, y no modifican daño, colisiones ni números aleatorios al dibujar.
- Se conserva la defensa, tabla de tipos y estados de daño. Un impacto por ataque y jugador; gracia de 0.9 segundos tras los golpes del patrón.

## Aislamiento

No se carga la configuración Firebase ni se registra un service worker. Se crea una sesión invitada en memoria y se conserva `ps.session`. Los métodos de ranking están deshabilitados exclusivamente en esta página. La página oficial y sus módulos de ejecución no se modifican. El changelog identifica expresamente la función como prototipo de desarrollo.

Publicación autorizada en la URL de desarrollo existente `/dev/`, la misma usada para probar las megas. Sólo se publican la página de prueba, sus módulos, documentación, pruebas y la nota de novedades; no se regenera la página oficial ni su versión. Se parte del `main` vigente para conservar los cambios de Toji.

## Regenerar y comprobar

```sh
node tools/build-boss-rush-preview.cjs
node --test tests/boss-rush-rules.test.cjs tests/groudon.test.cjs tests/groudon-integration.test.cjs tests/groudon-duration.test.cjs tests/groudon-fx.test.cjs tests/groudon-combos.test.cjs tests/kyogre.test.cjs tests/kyogre-duration.test.cjs tests/rayquaza.test.cjs tests/rayquaza-duration.test.cjs tests/boss-rush-sprites.test.cjs tests/minor-duration.test.cjs
node tools/benchmark-minors.cjs
node tools/benchmark-groudon.cjs
node tools/benchmark-kyogre.cjs
node tools/benchmark-rayquaza.cjs
python3 -m http.server 8765
```

Abrir `/dev/` y elegir **Jugar → Boss Rush · Hoenn** para la prueba. **Volver a Jugar** regresa al selector; **Partida normal** y los desafíos conservan sus modos propios. Al volver de la tienda de mejoras se recupera la preparación del Boss Rush. El generador nunca modifica `index.html`, `version.json` ni el bundle oficial.

Las pruebas de integración ejecutan `game.js`, Player, Enemy, Combat, Projectiles, Pickups y LevelUp reales con servicios de interfaz simulados. Comprueban preparación, pausas, daño, avance por los nueve enemigos, seis menores únicos, XP/niveles, tres Vínculos, victoria, reintento y conservación de sesión/guardado. Las pruebas de patrones verifican avisos, rutas de escape en horizontal/vertical, fases, daño único, lava, frente de Surf, lluvia, picado, carga sin retroceso y meteoros. Las de efectos comprueban fotogramas, coordenadas finitas, estado del lienzo y que dibujar no cambie el combate ni consuma aleatoriedad.

Pendiente: revisión en navegador y Android, balance mediante partidas reales, cooperativo y sinergias. La revisión visual de esta entrega usa el dibujo real de Canvas con los sprites, sin navegador disponible; las pruebas de motor y los renders no sustituyen una partida en el dispositivo.

## Duración de Groudon

La referencia inicial fue aproximadamente 3–5 minutos con Mega Blaziken al máximo de mejoras de oro, nivel 10 y nueve cartas de preparación. En su prueba real, el dueño obtuvo 2:30 y aceptó esa duración: se conservan los 400000 PV. La vida es fija durante el intento; no hay escudo por tiempo, regeneración que anule el daño ni ajuste oculto según el DPS. Las builds y la ejecución conservan su ventaja; configuraciones defensivas pueden tardar más. La barra del jefe muestra un contador que se pausa junto al combate y empieza después de la preparación.

`tools/benchmark-groudon.cjs` ejecuta el combate real, golpes críticos, evolución de Golpe Kárate e Impulso. Elige siete cartas iniciales y recoge las dos victorias nativas nuevas, llegando a Groudon en nivel 10 con nueve cartas legales: A Bocajarro con cinco Potencias, o A Bocajarro con Danza Espada nivel 5 y una Potencia. Ignora el daño recibido, mantiene distancia de golpe y permite reservar una fracción del tiempo sin lanzar ataques: mide duración ofensiva, no supervivencia ni habilidad humana para esquivar. Las dos victorias iniciales se saltan sólo en el benchmark para medir el combate concreto.

En la ruta nueva, semilla 123 al 85% del tiempo atacando, esta referencia dio 273.78 s para A Bocajarro y 167.30 s con Danza Espada. Como antecedente, antes de añadir la pareja inicial, con nivel 8 y siete cartas daba 331.05 s y 228.23 s respectivamente. Se conserva la vida aceptada por el dueño; los combates nuevos permiten mejorar antes de Groudon. Las pruebas actuales verifican nivel 10, nueve cartas, ambas builds con tres semillas y que atacar más permite ganar antes. Una build distinta de Onda Certera + Danza Espada da 91.98 s en el runner de ataques a distancia, con hitboxes reales: los tiempos dependen del ataque y los bancos de prueba no son intercambiables. Los tiempos reales requieren partidas del jugador.

## Movimientos oficiales

Usar movimientos reales de Pokémon con nombres en español. Sus señales, áreas y secuencias se adaptan al Boss Rush. Doble Filo causa daño Normal y retroceso equivalente a un tercio del daño efectivo causado. Los patrones de arena no son ataques nuevos.

Kyogre implementa Surf (oleada móvil), Hidrobomba (chorro anunciado), Rayo Hielo (haz con ralentización adaptada), Danza Lluvia (clima propio) y Pulso Primigenio (patrón culminante). Sus nombres y tipos son los de Pokémon; geometría, tiempos, daño y efecto de lluvia son adaptaciones para el Boss Rush.

## Selección y progreso de menores

Se sortean especies sin repetir usando la Pokédex y los sprites disponibles. Se excluyen todos los mayores indicados por el dueño (Mewtwo, aves de Johto, trío ancestral, dioses de Sinnoh, dragones de Teselia, tríos de Kalos/Alola/Galar y Koraidon/Miraidon), además de Urshifu, Calyrex, Ogerpon y Terapagos. Los personajes custom tampoco entran. Las exclusiones son explícitas: no dependen de la rareza del gacha.

Los dos menores iniciales dan un nivel base cada uno; después las victorias dan tres. Sin bonos se llega a Groudon a nivel 10, Kyogre a nivel 19 y Rayquaza a nivel 28, terminando en nivel 31. Con Sabiduría de oro al máximo y sin cartas de Aprendizaje, la referencia llega en niveles 10, 22 y 34 a los tres mayores. Aprendizaje y los demás bonos conservan su efecto. Los Vínculos siguen reservados a los mayores.

## Resistencia y duración de menores

Objetivo pedido: 60–120 segundos con una build potente. Los presupuestos son fijos por tramo; no miden DPS ni cambian al entrar con otra build. La vida se multiplica después por el equipo inicial.

| Combate de la ruta | Menor | PV base | Daño base | Cadencia |
| --- | --- | ---: | ---: | ---: |
| 1 | Primero | 240000 | 30 | ×1.12 |
| 2 | Segundo | 320000 | 33 | ×1.165 |
| 4 | Tercero | 800000 | 36 | ×1.21 |
| 5 | Cuarto | 1200000 | 40 | ×1.255 |
| 7 | Quinto | 2400000 | 44 | ×1.30 |
| 8 | Sexto | 3600000 | 48 | ×1.345 |

`tools/benchmark-minors.cjs` reutiliza el motor nativo con Entei (Lucha neutro), sus movimientos y hitbox reales, Mega Blaziken con todo el oro, Onda Certera y Danza Espada con cartas legales, victorias previas reales y Vínculo después de Groudon. Antes del primer mayor alterna manualmente la danza y el ataque; después usa la fusión nativa. Impulso empieza desde cero en el primer menor y usa el tiempo anterior de referencia hasta su máximo. Se ignora el daño recibido, se mantiene distancia 100 y se reserva un 15% del tiempo sin lanzar ataques. Es una medición ofensiva, no supervivencia humana.

En semilla 123, los tiempos por puesto fueron 82.97/94.57/87.73/91.62/85.53/86.37 s con Potencia y 82.97/94.57/85.73/92.30/101.42/103.30 s con Reflejos. Las 36 combinaciones de seis puestos, dos builds y tres semillas pasan la ventana 60–120 s. Otra prueba verifica que una debilidad de tipo y atacar más acortan el combate conservando los mismos PV: no existe invulnerabilidad ni duración mínima forzada. Otras builds, tipos y ejecución pueden salir de esa ventana. Los ataques, proyectiles, velocidad de movimiento y avisos conservan sus reglas nativas.

Referencia humana anterior: el dueño completó la ruta de siete combates en 12:11 con Mega Blaziken, nivel 39 y cuatro movimientos. La ruta nueva necesita otra prueba humana; ese tiempo no se presenta como resultado de los nueve combates.

## Duración de Rayquaza

`tools/benchmark-rayquaza.cjs` reutiliza la referencia legal de Mega Blaziken con Onda Certera y Danza de Mil Espadas evolucionadas, fusionadas y con todo el oro. Se recogen las ocho recompensas nativas previas, llegando a nivel 34 con 33 cartas; los Reflejos respetan su máximo y después se toma Potencia. Los encuentros anteriores se saltan mediante daño de prueba para ahorrar tiempo; Rayquaza recibe daño normal con sus tipos Dragón/Volador, incluida su resistencia a Lucha. Impulso está al máximo. En la ruta nueva, semilla 123 y 85% del tiempo atacando, 5000000 PV duran 138.47 s con Potencia. Se verifican tres semillas por build con una ventana amplia de 120–240 segundos. La vida y patrones de los mayores no cambian en este ajuste. La simulación ignora daño entrante y controla posición/tiempo de ataque; mide duración ofensiva, no supervivencia humana ni todas las builds posibles.

## Duración de Kyogre con la build indicada por el dueño

Los 600000 PV iniciales permitieron una victoria real en aproximadamente un minuto. `tools/benchmark-kyogre.cjs` reproduce Mega Blaziken con todas las mejoras de oro, Onda Certera (Esfera Aural evolucionada) y Danza de Mil Espadas (Danza Espada evolucionada) fusionadas mediante el Vínculo de Groudon. Se recorren las cinco victorias anteriores y se toman cartas legales; con el bono de oro de experiencia se llega a nivel 22 con 21 elecciones, no al 19 de la referencia sin bonos. Se comparan cartas restantes de Potencia o de Reflejos. Se usan hitboxes y animaciones derivadas de los metadatos reales, críticos, proyectiles, buffs y recargas nativos, y 150 segundos previos para que Impulso llegue a su máximo. Los enemigos anteriores se derrotan de inmediato para acelerar el benchmark; Kyogre recibe daño normal.

Después de probar el ajuste a 3000000, el dueño fijó 2500000 PV base (2.5/5/7.5/10 millones para 1/2/3/4 jugadores). Se conserva esa vida. En la ruta nueva, semilla 123 y 85% del tiempo atacando, la referencia con Potencia dura 130.83 s. Las pruebas admiten 110–220 segundos con tres semillas y ambas distribuciones de cartas; también comprueban que atacar más permite vencer antes. No hay duración mínima, escudo por tiempo ni reducción artificial de daño. La simulación ignora el daño entrante y controla la posición; no predice supervivencia humana ni garantiza el mismo tiempo para otras builds.

## Recursos para probar

Cada carga inicia una sesión temporal con 100000 Pokémonedas y Swampert, Blaziken y Sceptile desbloqueados. El botón Mejoras de oro abre la tienda nativa para el Pokémon seleccionado. Reponer dinero de prueba restaura 100000 monedas conservando las compras de esta sesión; no funciona durante una partida. Las compras se aplican al siguiente intento, incluyendo Zancada y Más Opciones durante la preparación. Recargar la página reinicia esta sesión temporal.

Swampert y Blaziken incluyen sus piedras desbloqueadas y equipadas al cargar. Permiten usar Mega Swampert y Mega Blaziken tanto en Boss Rush como en partida normal; Terratemblor y Golpe Kárate, respectivamente, comienzan en nivel 2 si se eligen en la preparación. Terratemblor es la selección inicial para Mega Swampert. El equipo sigue siendo opcional desde el menú nativo.

La prueba carga los módulos actuales del Live, incluidas las mejoras de oro y Coberturas (Nieve Polvo → Ventisca y Rayo Hielo → Rayo Polar). Desde **Mejoras de oro** se compran los niveles y se eligen movimientos compatibles, o se usa **Mejorar al máximo** para completar todos los niveles sin coste en esta sesión. Al regresar se reconstruyen ambos selectores con las Coberturas elegidas y se conservan los ataques válidos; se retiran las opciones deseleccionadas. Cada intento toma su propia copia de Coberturas mediante el inicio de partida nativo. Puño Hielo no está implementado en el catálogo actual del Live.

## Maximizar mejoras para probar

El botón **Mejorar al máximo** está en la preparación y completa los niveles de todas las mejoras de oro del Pokémon seleccionado, hasta los máximos nativos. Es gratuito, no consume monedas, no mejora a los otros Pokémon y no agrega cartas ni niveles de combate. Muestra una confirmación y queda desactivado cuando ya está al máximo; al cambiar de Pokémon vuelve a reflejar sus mejoras. Sólo funciona fuera de combate, en la sesión invitada temporal, y no escribe el guardado real.
