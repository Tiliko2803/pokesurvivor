# Boss Rush de Hoenn — Tierra y océano

## Diseño acordado

La ruta completa prevista alterna un legendario mayor con dos menores:

1. Groudon.
2. Dos legendarios menores del juego existente.
3. Kyogre.
4. Otros dos legendarios menores.
5. Rayquaza.

El jugador empieza directamente en nivel 8, elige siete mejoras antes de combatir y conserva ataques, estadísticas y experiencia entre encuentros. Los menores sirven para ganar poder antes del siguiente mayor. Las sinergias cooperativas se incorporarán después; no son requisito del prototipo individual.

## Implementado

`dev/index.html` usa los módulos actuales del juego y carga un adaptador exclusivo de pruebas. La ruta disponible es Groudon → dos legendarios menores aleatorios → Kyogre → otros dos menores distintos. Se conserva la build durante los seis combates. Después del sexto encuentro termina esta prueba; Rayquaza sigue pendiente.

- Tres Pokémon de prueba: Swampert, Blaziken y Sceptile. Selección de dos ataques distintos; al menos uno causa daño.
- Kyogre entra en el cuarto combate, a nivel 17 sin bonos de experiencia, con 3000000 PV base y fases al 70%/35%. Su vida está calibrada contra Onda Certera + Danza de Mil Espadas evolucionadas, fusionadas y con mejoras de oro máximas. Usa el mismo reloj, límites, movimiento entre lanzamientos, pausa y protección compartida de impactos que Groudon. Su arena marina ocupa toda la pantalla y tiene suelo transitable, sin penalización de velocidad por agua decorativa. Su victoria da tres niveles, recuperación y un Vínculo.
- Kyogre acelera también la señal de peligro: avisos normales de 1.55/1.20/0.90 segundos y pausas entre ataques de 0.38/0.24/0.14, según fase. Una señal ya visible nunca se acorta al cruzar un umbral. En fases 2/3 combina dos/tres movimientos. Para cada jugador se verifica una salida con 0.22 segundos de reacción, velocidad máxima de referencia 130 y su velocidad efectiva si está ralentizado. Se amplía el aviso si hace falta; se quita un movimiento secundario si supera 2.1/1.65/1.3 segundos según fase. Un ataque individual puede avisar más tiempo para permitir escapar a un jugador ralentizado.
- Surf anuncia una franja fija y la ola la cruza a 520/580/640 unidades por segundo. Sólo el frente visible causa daño, una vez por jugador. Hidrobomba y Rayo Hielo son corredores fijos desde la boca/aleta; no persiguen al jugador tras el aviso. Rayo Hielo aplica la ralentización nativa durante 0.7 segundos si el impacto realmente causa daño. Los impactos coincidentes aplican un solo golpe y comparten 0.9 segundos de protección.
- Danza Lluvia no causa daño directo: dura 12/16/20 segundos y potencia un 15% los impactos de Agua de Kyogre (adaptación de balance del Boss Rush). Se ve lluvia en píxeles sin ocultar los avisos. Pulso Primigenio se lanza solo al llegar a fases 2 y 3, cubre las zonas anunciadas con columnas de agua y deja un refugio cercano para cada jugador vivo. Avisa un 30% más que un ataque normal y deja 1.6 segundos de recuperación. Kyogre no hereda lava, retroceso ni ataques de Groudon.
- Sprites de efectos generados con Image Generation: atlas transparente de 4×8 celdas, cuatro fotogramas por efecto, compilado a celdas de 64×64 con vecino más cercano. Incluye roca, onda de tierra, lava, embestida, ola, Hidrobomba, hielo y Pulso Primigenio; se usa también en los ataques de Groudon. Los efectos se dibujan a resolución de píxel y se amplían sin suavizado, conservando las señales geométricas para la lectura de colisiones. Calidad gráfica baja reduce partículas y cantidad de sprites. Procedencia y prompt en `assets/boss-rush/README.md`.
- Hidrobomba y Rayo Hielo usan un segundo atlas específico: un haz continuo desde el origen hasta el extremo, con cuatro fotogramas por elemento y sin repetir puntas a lo largo del corredor. Surf, Hidrobomba y Rayo Hielo conservan sus avisos previos, pero durante el impacto se ve únicamente el sprite, sin el rectángulo de colisión alrededor. Las áreas y los tiempos de daño no cambian por esta corrección visual.
- Regla cooperativa preparada: vida de cada jefe = vida base de su posición × número de jugadores al iniciar la partida. Se aplica a mayores y menores una sola vez, al crearlos, sin multiplicar daño, cadencia ni recompensas. Groudon tiene 400000/800000/1200000/1600000 PV para 1/2/3/4 jugadores. La cifra del equipo queda fija durante el intento aunque alguien caiga o salga, y las fases siguen calculándose como porcentaje de la vida máxima. La entrada cooperativa y su sincronización siguen pendientes; estas pruebas verifican el escalado con equipos simulados.
- Nivel 8 con siete elecciones reales usando las cartas del juego. Los ataques empiezan en nivel 1 y se mejoran mediante cartas. El combate queda pausado durante toda la preparación.
- Estadísticas base de la especie con las compras de oro realizadas dentro de la prueba; no se importan compras de la cuenta. Velocidad base de prueba: 130, conservando el multiplicador de Zancada comprado, para que se puedan esquivar los avisos caminando.
- Victoria: experiencia equivalente a la suma de los requisitos de los tres niveles siguientes, con el reparto normal de orbes; curación del 20% de vida máxima y tres segundos antes del siguiente enemigo. Cada legendario mayor (Groudon en este tramo) otorga además un Vínculo; los menores no lo otorgan. Se usa la selección y fusión nativa: el intermedio queda pausado mientras eliges y los movimientos del grupo se lanzan juntos. Si aún no se puede fusionar, se conserva el Vínculo. No hay monedas, tickets ni botín equipable.
- Los menores conservan la IA de jefes existente, las preferencias de distancia por tipo y la velocidad de movimiento estándar de las grietas. Sus estadísticas dependen de la posición en la ruta: 3200 PV y 27 de daño como base; por cada puesto posterior al primer menor, la vida se multiplica por 1.18, el daño por 1.07 y la cadencia gana 3.5 puntos porcentuales, hasta +30%. La cadencia total con furia queda limitada a ×1.5. Sólo se reduce la espera entre ataques; no se aceleran los avisos, los proyectiles ni los movimientos. Sin hordas entre combates.
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
node --test tests/boss-rush-rules.test.cjs tests/groudon.test.cjs tests/groudon-integration.test.cjs tests/groudon-duration.test.cjs tests/groudon-fx.test.cjs tests/groudon-combos.test.cjs tests/kyogre.test.cjs tests/kyogre-duration.test.cjs tests/boss-rush-sprites.test.cjs
node tools/benchmark-groudon.cjs
node tools/benchmark-kyogre.cjs
python3 -m http.server 8765
```

Abrir `/dev/` y elegir **Jugar → Boss Rush · Hoenn** para la prueba. **Volver a Jugar** regresa al selector; **Partida normal** y los desafíos conservan sus modos propios. Al volver de la tienda de mejoras se recupera la preparación del Boss Rush. El generador nunca modifica `index.html`, `version.json` ni el bundle oficial.

Las pruebas de integración ejecutan `game.js`, Player, Enemy, Combat, Projectiles, Pickups y LevelUp reales con servicios de interfaz simulados. Comprueban preparación, pausas, daño, avance por los seis enemigos, XP/niveles, dos Vínculos, victoria, reintento y conservación de sesión/guardado. Las pruebas de patrones verifican avisos, rutas de escape en horizontal/vertical, fases, daño único, lava, frente de Surf, lluvia y refugios. Las de efectos comprueban fotogramas, coordenadas finitas, estado del lienzo y que dibujar no cambie el combate ni consuma aleatoriedad.

Pendiente: revisión en navegador y Android, balance de Kyogre mediante partidas reales, Rayquaza, cooperativo y sinergias. La revisión visual de esta entrega usa el dibujo real de Canvas con los sprites, sin navegador disponible; las pruebas de motor y los renders no sustituyen una partida en el dispositivo.

## Duración de Groudon

La referencia inicial fue aproximadamente 3–5 minutos con Mega Blaziken al máximo de mejoras de oro, nivel 10 y nueve cartas de preparación. En su prueba real, el dueño obtuvo 2:30 y aceptó esa duración: se conservan los 400000 PV. La vida es fija durante el intento; no hay escudo por tiempo, regeneración que anule el daño ni ajuste oculto según el DPS. Las builds y la ejecución conservan su ventaja; configuraciones defensivas pueden tardar más. La barra del jefe muestra un contador que se pausa junto al combate y empieza después de la preparación.

`tools/benchmark-groudon.cjs` ejecuta el combate real, golpes críticos, evolución de Golpe Kárate e Impulso. Tras bajar el inicio a nivel 8, usa siete cartas legales y reproducibles: A Bocajarro con tres cartas de Potencia, o A Bocajarro con Danza Espada nivel 3 y una carta de Potencia. Ignora el daño recibido, mantiene distancia de golpe y permite reservar una fracción del tiempo sin lanzar ataques: mide duración ofensiva, no supervivencia ni habilidad humana para esquivar.

Con el inicio actual en nivel 8, semilla 123 y 85% del tiempo atacando (15% reservado para esquivar), los resultados fueron 331.05 s (5:31) para A Bocajarro y 228.23 s (3:48) con Danza Espada. Se conserva la vida de Groudon aceptada por el dueño; bajar dos niveles reduce el poder inicial. Las pruebas verifican ambas builds con tres semillas. El escenario de ataque perfecto con Danza Espada termina antes de los tres minutos; se permite para conservar la recompensa por optimizar la build. Los tiempos reales requieren más partidas del jugador.

## Movimientos oficiales

Usar movimientos reales de Pokémon con nombres en español. Sus señales, áreas y secuencias se adaptan al Boss Rush. Doble Filo causa daño Normal y retroceso equivalente a un tercio del daño efectivo causado. Los patrones de arena no son ataques nuevos.

Kyogre implementa Surf (oleada móvil), Hidrobomba (chorro anunciado), Rayo Hielo (haz con ralentización adaptada), Danza Lluvia (clima propio) y Pulso Primigenio (patrón culminante). Sus nombres y tipos son los de Pokémon; geometría, tiempos, daño y efecto de lluvia son adaptaciones para el Boss Rush.

## Selección y progreso de menores

Se sortean especies sin repetir usando la Pokédex y los sprites disponibles. Se excluyen todos los mayores indicados por el dueño (Mewtwo, aves de Johto, trío ancestral, dioses de Sinnoh, dragones de Teselia, tríos de Kalos/Alola/Galar y Koraidon/Miraidon), además de Urshifu, Calyrex, Ogerpon y Terapagos. Los personajes custom tampoco entran. Las exclusiones son explícitas: no dependen de la rareza del gacha.

Con tres niveles de experiencia por victoria y sin bonos, se llega a Kyogre a nivel 17 y se termina el sexto combate a nivel 26, antes del futuro Rayquaza. Aprendizaje y otros bonos de XP conservan su efecto. La curva requiere partidas reales para evaluar justicia, duración y dificultad con builds evolucionadas.

## Duración de Kyogre con la build indicada por el dueño

Los 600000 PV iniciales permitieron una victoria real en aproximadamente un minuto. `tools/benchmark-kyogre.cjs` reproduce Mega Blaziken con todas las mejoras de oro, Onda Certera (Esfera Aural evolucionada) y Danza de Mil Espadas (Danza Espada evolucionada) fusionadas mediante el Vínculo de Groudon. Se recorren las tres victorias anteriores y se toman cartas legales; con el bono de oro de experiencia se llega a nivel 19 con 18 elecciones, no al 17 de la referencia sin bonos. Se comparan cartas restantes de Potencia o de Reflejos. Se usan hitboxes y animaciones derivadas de los metadatos reales, críticos, proyectiles, buffs y recargas nativos, y 150 segundos previos para que Impulso llegue a su máximo. Los tres enemigos anteriores se derrotan de inmediato para acelerar el benchmark; Kyogre recibe daño normal.

La vida pasa a 3000000 PV base (3/6/9/12 millones para 1/2/3/4 jugadores). Con semilla 123, distancia 100 y 85% del tiempo atacando, la referencia nativa mide 210.88 s (3:31) con Potencia y 232.40 s (3:52) con Reflejos. Con 100% de ataque mide 178.85/198.23 s; con 75%, 235.28/263.57 s. Las pruebas verifican la ventana de 3–5 minutos al 85% con tres semillas y ambas distribuciones de cartas, y que atacar más permite vencer antes. No hay duración mínima, escudo por tiempo ni reducción artificial de daño. La simulación ignora el daño entrante y controla la posición; no predice supervivencia humana ni garantiza el mismo tiempo para otras builds.

## Recursos para probar

Cada carga inicia una sesión temporal con 100000 Pokémonedas y Swampert, Blaziken y Sceptile desbloqueados. El botón Mejoras de oro abre la tienda nativa para el Pokémon seleccionado. Reponer dinero de prueba restaura 100000 monedas conservando las compras de esta sesión; no funciona durante una partida. Las compras se aplican al siguiente intento, incluyendo Zancada y Más Opciones durante la preparación. Recargar la página reinicia esta sesión temporal.

Blaziken incluye la Blazikenita desbloqueada y equipada al cargar. Seleccionarlo permite usar Mega Blaziken tanto en Boss Rush como en partida normal; Golpe Kárate comienza en nivel 2 si se elige en la preparación del Boss Rush. El equipo sigue siendo opcional desde el menú nativo.

## Maximizar mejoras para probar

El botón **Mejorar al máximo** está en la preparación y completa los niveles de todas las mejoras de oro del Pokémon seleccionado, hasta los máximos nativos. Es gratuito, no consume monedas, no mejora a los otros Pokémon y no agrega cartas ni niveles de combate. Muestra una confirmación y queda desactivado cuando ya está al máximo; al cambiar de Pokémon vuelve a reflejar sus mejoras. Sólo funciona fuera de combate, en la sesión invitada temporal, y no escribe el guardado real.
