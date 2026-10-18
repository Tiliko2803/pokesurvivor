# Boss Rush de Hoenn · versión de pruebas

La URL `/dev/` usa los módulos actuales del Live y un adaptador aislado. La cuenta real no se modifica. La ruta actual tiene seis encuentros y nueve enemigos:

1. **Regirock + Regice + Registeel juntos**, Los Tres Guardianes.
2. **Groudon**.
3. **Latios + Latias juntos**, el Dúo Eón.
4. **Kyogre**.
5. **Jirachi**, único combate entre Kyogre y Rayquaza.
6. **Rayquaza**.

El Dúo Eón ocupa un solo encuentro después de Groudon. La ruta está fijada: Kyogre → Jirachi → Rayquaza. Deoxys queda reservado para después y no es elegible para encuentros de esta prueba; sigue disponible como especie del juego y referencia de jugador.

## Los Tres Guardianes

Diseño, relojes independientes, seguridad de combinaciones, barras y referencias de duración en [REGIS.md](REGIS.md).

Cada Regi tiene 44000 PV base y su propia barra; el trío suma 132000 PV en solitario. Regirock crea obstáculos temporales con Tumba Rocas y Avalancha; Regice usa Rayo Hielo y Viento Hielo con ralentización; Registeel combina Foco Resplandor y Garra Metal. Son adaptaciones de movimientos Pokémon para este modo.

Cada movimiento tiene enfriamiento y desfase propios, con como máximo dos lanzamientos simultáneos entre los tres. Se respetan salidas alcanzables, avisos fijos, velocidad del jugador ralentizado y una protección compartida de 0.9 s contra impactos coincidentes. La revisión comprobó que la IA nativa sólo usa `ai.cd`; el nuevo coordinador se aplica a los grupos de esta prueba. El Dúo Eón reutiliza ese coordinador; la IA normal se conserva. Los mayores usan su propio coordinador de movimientos independientes.

Las tres barras comparten el ancho habitual. Al caer un Regi, su barra tiembla, se deforma y se desvanece; las restantes se redistribuyen. El grupo termina sólo cuando caen los tres. Las bajas parciales no curan ni entregan experiencia o Vínculo.

## Dúo Eón

Detalle del modelo, seguridad, efectos y balance en [EON.md](EON.md). Latios y Latias tienen 190000 PV cada uno (380000 conjuntos en solitario), sin Megas. Comparten Cabezazo Zen, Pulso Dragón y Psíquico con las mismas animaciones: Latios persigue a corta distancia y Latias retrocede y orbita. Cabezazo Zen desplaza al lanzador por una trayectoria fija anunciada y daña con su cuerpo; Pulso Dragón es un proyectil único; Psíquico marca áreas fijas.

Usan el mismo coordinador de desincronización que los Regis: seis relojes independientes, desfases de inicio, como máximo dos movimientos simultáneos, salidas alcanzables y protección compartida. Cada barra tiene el color de su Pokémon y la superviviente se amplía al caer el otro. No se entrega nada por bajas parciales; al vencer a ambos se reciben seis niveles base de XP y una curación del 20%. No dan Vínculo.

## Jirachi

Jirachi tiene un encuentro propio en el observatorio de los deseos: [JIRACHI.md](JIRACHI.md). Usa Deseo Oculto, Rapidez, Foco Resplandor y Psíquico, con fases al 70%/35%. En fase 2 combina hasta dos movimientos conservando 2.5 s para Deseo Oculto; en fase 3 acelera los avisos nuevos y conserva el límite de dos. Tras terminar Deseo Oculto y los movimientos pendientes deja un segundo adicional para contraatacar.

Su vida es 600000 PV base. La referencia ofensiva inicial dura 1:51 con Deoxys normal y 0:24 con Mega Blaziken; no se infla la vida para igualar builds y resistencias distintas. El anillo psíquico y las estrellas dañan con sus frentes y proyectiles visibles, no con toda el área anunciada. Da seis niveles base de experiencia y ningún Vínculo, para conservar el poder de llegada a Rayquaza.

## Selector de Hoenn Normal

El selector muestra una tarjeta de Hoenn Normal con [portada en pixel art](assets/hoenn-normal-v1.webp), seis combates y nueve jefes. La preparación agrupa Pokémon y los dos ataques; el recorrido, las herramientas de oro y las instrucciones quedan en desplegables nativos accesibles por teclado. La prueba directa de Jirachi conserva su botón visible. El diseño usa dos columnas en pantalla amplia y una columna con desplazamiento vertical en móvil.

La portada se generó con la herramienta integrada de imágenes. Su fuente y prompt están documentados en [assets/HOENN-NORMAL.md](assets/HOENN-NORMAL.md). No se cambian reglas de combate ni progresión.

## Preparación y progresión

- Nivel 8 con siete cartas reales. El combate queda congelado hasta elegirlas.
- Cuatro Pokémon de prueba: Swampert, Blaziken, Sceptile y Tyranitar. Las tres piedras Mega están desbloqueadas y equipadas; se pueden quitar desde el menú. Mega Tyranitar: [MEGA-TYRANITAR.md](MEGA-TYRANITAR.md).
- Dos ataques iniciales distintos, al menos uno de daño. El movimiento propio de cada Mega empieza en nivel 2 si se elige: Terratemblor, Golpe Kárate o Lanzarrocas.
- Se conservan movimientos, cartas y estadísticas durante todos los encuentros. Sólo los mayores dan un Vínculo; se usa el sistema nativo de fusión, con intermedio pausado mientras se elige.
- El trío inicial entrega una única recompensa de dos niveles base y 20% de vida al caer los tres. El Dúo Eón entrega seis niveles base en una única recompensa; Jirachi entrega otros seis niveles base en una única victoria. Los mayores dan XP equivalente a los requisitos de tres niveles siguientes, 20% de curación y tres segundos de intermedio. Se conservan bonos de experiencia y reparto nativo de orbes.
- Sin bonos se llega a Groudon a nivel 10, Kyogre a 19 y Rayquaza a 28, terminando en 31. Con Sabiduría de oro máxima y sin cartas de Aprendizaje, las referencias llegan en niveles 10/21/33; los bonos se aplican a las recompensas conjuntas del dúo y Jirachi.
- La vida de cada enemigo se multiplica una sola vez por el número de jugadores inicial. Las bajas y salidas no reducen esa cifra. La entrada cooperativa y sincronización del modo siguen pendientes; el escalado se verifica con equipos simulados.

## Vida y dificultad

| Encuentro | PV base por enemigo | Daño de referencia | Cadencia de menores |
| --- | ---: | ---: | ---: |
| Tres Regis juntos | 44000 cada uno | 21 base, movimientos 18–24 | Relojes por movimiento |
| Groudon | 400000 | Patrones propios | Por fases |
| Dúo Eón | 190000 cada uno | Movimientos 33–40 | Relojes por movimiento |
| Kyogre | 2500000 | Patrones propios | Por fases |
| Jirachi | 600000 | Movimientos 24–48 | Relojes por movimiento |
| Rayquaza | 5000000 | Patrones propios | Por fases |

No hay vida adaptativa al DPS, regeneración del jefe para alargar peleas ni invulnerabilidad por tiempo. Se conservan tipos, defensa, críticos y estados. En los menores que aún usan la IA nativa sólo se reduce la espera entre ataques; sus avisos, proyectiles y movimiento conservan las reglas normales. La cadencia total con furia no supera ×1.5.

La revisión anterior con Deoxys mostró que 240000 PV para un primer menor individual podían dar 5:54 contra Jirachi incluso con oro máximo. El trío no reutiliza tres veces ese presupuesto. La referencia nueva completa dura aproximadamente 1:25 con Deoxys y 0:32 con Mega Blaziken. El Dúo Eón completo da 1:06 con Mega Blaziken y 1:52 con Deoxys. Son simulaciones ofensivas, con daño recibido ignorado y posición controlada, no partidas humanas.

Los menores nativos anteriores se calibraron contra Mega Blaziken potente, oro máximo, evoluciones, Vínculo y 85% de tiempo atacando. Jirachi se calibra ahora también con Deoxys normal; las builds, tipos y ejecución cambian la duración. La referencia anterior de 12:11 del dueño corresponde a la ruta antigua de siete combates.

## Mayores

**Groudon:** 400000 PV aceptados tras una prueba humana de 2:30. Fases al 70%/35%, movimiento entre lanzamientos a 88/100/112. Usa Filo del Abismo, Terratemblor, Estallido, Doble Filo y Terremoto. Sus movimientos tienen relojes independientes y pueden solaparse hasta dos/hasta tres en fases 2/3; Terremoto es exclusivo y deja refugio. Se valida salida a velocidad 130 con reacción de 0.25 s; si hace falta se alarga el aviso aislado o se retrasa el movimiento nuevo. Las áreas se fijan al anunciarse. Doble Filo usa contacto real y retroceso de un tercio del daño efectivo. Lava temporal y protección compartida de impactos.

Los tres mayores usan ahora [MAJOR-CADENCE.md](MAJOR-CADENCE.md): cada movimiento tiene enfriamiento y desfase propios. Sus inicios e impactos se separan; los avisos no se igualan entre movimientos. Los desplazamientos no contradicen haces activos y los ataques especiales esperan una ventana exclusiva.

**Kyogre:** 2500000 PV fijados por el dueño. Fases al 70%/35%, movimiento 92/104/116, avisos 1.55/1.20/0.90 s para cada lanzamiento nuevo. Surf daña con el frente de ola visible; Hidrobomba y Rayo Hielo son haces continuos fijos. Rayo Hielo ralentiza 0.7 s sólo con daño real. Danza Lluvia dura 12/16/20 s y potencia un 15% los golpes de Agua (adaptación de balance). Pulso Primigenio es exclusivo al entrar en fases 2/3 y deja refugios cercanos. Se validan combinaciones a pie incluyendo ralentización. La lluvia, lava y retroceso no se heredan entre jefes.

**Rayquaza:** 5000000 PV. Fases al 70%/35%, movimiento 112/130/148, avisos 1.45/1.15/0.90 s para cada lanzamiento nuevo. Ascenso Draco, Velocidad Extrema, Pulso Dragón, Vendaval y Cometa Draco. Ascenso Draco y Velocidad Extrema no se ejecutan a la vez. Cometa Draco va solo y deja recuperación de 1.7 s; sus avisos son 1.90/1.60/1.35 s. Picado a destino fijo, embestida con contacto real sin retroceso, haz continuo y meteoros con descenso visible. Da un tercer Vínculo al vencer y cierra la prueba.

Los mayores conservan su protección compartida de 0.9 s. Sus relojes y avisos se detienen con pausa. Una fase nueva nunca acorta una señal ya visible.

## Arena y efectos

Arena a pantalla completa: mínimo de 960×560 unidades, tamaño adaptado a la proporción y paredes fuera de las esquinas. Suelo continuo, sin cuadrícula, marco ni obstáculos aleatorios. Los mayores usan roca volcánica, fondo marino y templo celestial. El Dúo Eón combate también en el templo celestial. Toda la decoración es transitable; las rocas temporales anunciadas de Regirock sí tienen colisión.

Actores, patrones y cámara comparten `G.Groudon.ARENA`. Al girar y reducir mucho un eje, se eliminan señales anteriores y se concede un segundo de protección al recolocar todos los actores. Al salir se restaura la cámara normal.

Los efectos se dibujan en un lienzo de baja resolución ampliado sin suavizado. Los atlas generados existentes aportan roca/lava/agua/hielo y ataques de Rayquaza; procedencia en `assets/boss-rush/README.md`. Los Regis usan el haz de hielo continuo existente y píxeles propios de roca/acero/garras. Los renders no cambian el combate ni consumen su azar. El Dúo Eón añade estelas, pulsos y anillos dibujados a píxeles, sin consumir azar del combate. Las opciones gráficas reducen partículas; pausa congela efectos y barras.

## Recursos y aislamiento

**Probar solo a Jirachi** inicia directamente su combate en nivel 25, con 24 cartas de preparación y dos Vínculos disponibles para el sistema normal de combinación. Mega Blaziken empieza con Impulso acumulado de 150 s para aproximar su llegada por la ruta. El reloj queda congelado durante la preparación. Al vencer a Jirachi termina la prueba sin pasar a Rayquaza. La ruta completa conserva su inicio en nivel 8.

Cada recarga crea una sesión invitada en memoria con 100000 Pokémonedas y los cuatro Pokémon de prueba. **Mejoras de oro** abre la tienda nativa; **Mejorar al máximo** completa todas las mejoras del Pokémon seleccionado gratis, fuera de combate, sin agregar cartas ni niveles. **Reponer dinero de prueba** restaura 100000 conservando las compras de la sesión. Recargar reinicia la prueba.

Coberturas, Repertorio, Veto y Atajos usan los módulos del Live. Los selectores se reconstruyen al volver de la tienda y conservan ataques todavía válidos. Swampert puede elegir Rayo Hielo → Rayo Polar o Nieve Polvo → Ventisca por Coberturas; Puño Hielo no está implementado. La selección de Coberturas se copia al empezar cada intento.

No se carga configuración Firebase ni se registra service worker. Se conserva `ps.session` y no se escribe progreso real. No hay monedas, tickets, objetos equipables, rankings ni recompensas persistentes. **Volver a Jugar** restaura el selector normal; partida normal y desafíos conservan sus modos.

## Generar y verificar

Sólo para cambios de este prototipo se ejecuta `node tools/build-boss-rush-preview.cjs`; genera exclusivamente `dev/index.html`. Nunca se regenera el `index.html` oficial, bundle ni `version.json`. Se publica con los archivos concretos sobre el `main` más reciente para conservar trabajo concurrente.

Pruebas relevantes: `tests/jirachi-direct.test.cjs`, `tests/jirachi.test.cjs`, `tests/jirachi-integration.test.cjs`, `tests/jirachi-duration.test.cjs`, `tests/major-cadence.test.cjs`, `tests/major-cadence-integration.test.cjs`, `tests/eon.test.cjs`, `tests/eon-integration.test.cjs`, `tests/eon-duration.test.cjs`, `tests/regis.test.cjs`, `tests/regis-integration.test.cjs`, `tests/regis-duration.test.cjs`, `tests/boss-rush-rules.test.cjs` y las de integración, duración, geometría y efectos de los tres mayores. También se mantienen las regresiones de Coberturas, mejoras de oro y las Megas. Bancos nativos: `tools/benchmark-jirachi.cjs`, `tools/benchmark-eon.cjs`, `tools/benchmark-regis.cjs`, `tools/benchmark-minors.cjs`, `tools/benchmark-groudon.cjs`, `tools/benchmark-kyogre.cjs` y `tools/benchmark-rayquaza.cjs`.

Las pruebas de integración usan el Game, Player, Enemy, Combat, Projectiles, Pickups y LevelUp reales con interfaz simulada. La revisión visual usa Canvas nativo y sprites reales; no sustituye probar en navegador o Android. Pendientes: cooperativo del modo y balance humano de la ruta nueva.

Hoenn Primigenio se hará después: cinco Regis o Regigigas al 50% de la vida conjunta, y Mega Latias/Latios. No forman parte de Hoenn Normal.
