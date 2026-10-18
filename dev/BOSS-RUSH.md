# Boss Rush de Hoenn · versión de pruebas

La URL `/dev/` usa los módulos actuales del Live y un adaptador aislado. La cuenta real no se modifica. La ruta actual tiene ocho encuentros y diez enemigos:

1. **Regirock + Regice + Registeel juntos**, Los Tres Guardianes.
2. **Groudon**.
3. Dos menores de Hoenn, uno por encuentro.
4. **Kyogre**.
5. Los otros dos menores de Hoenn, uno por encuentro.
6. **Rayquaza**.

Los cuatro menores posteriores son Latias, Latios, Jirachi y Deoxys, barajados sin repetir; los Regis iniciales no reaparecen. Jirachi y Deoxys son singulares incluidos expresamente en el grupo de encuentros menores del juego. Los mayores y personajes custom no se sortean como menores.

## Los Tres Guardianes

Diseño, relojes independientes, seguridad de combinaciones, barras y referencias de duración en [REGIS.md](REGIS.md).

Cada Regi tiene 44000 PV base y su propia barra; el trío suma 132000 PV en solitario. Regirock crea obstáculos temporales con Tumba Rocas y Avalancha; Regice usa Rayo Hielo y Viento Hielo con ralentización; Registeel combina Foco Resplandor y Garra Metal. Son adaptaciones de movimientos Pokémon para este modo.

Cada movimiento tiene enfriamiento y desfase propios, con como máximo dos lanzamientos simultáneos entre los tres. Se respetan salidas alcanzables, avisos fijos, velocidad del jugador ralentizado y una protección compartida de 0.9 s contra impactos coincidentes. La revisión comprobó que la IA nativa sólo usa `ai.cd`; el nuevo coordinador se aplica a los Regis de esta prueba. La IA normal y los patrones de los mayores se conservan.

Las tres barras comparten el ancho habitual. Al caer un Regi, su barra tiembla, se deforma y se desvanece; las restantes se redistribuyen. El grupo termina sólo cuando caen los tres. Las bajas parciales no curan ni entregan experiencia o Vínculo.

## Preparación y progresión

- Nivel 8 con siete cartas reales. El combate queda congelado hasta elegirlas.
- Cuatro Pokémon de prueba: Swampert, Blaziken, Sceptile y Tyranitar. Las tres piedras Mega están desbloqueadas y equipadas; se pueden quitar desde el menú. Mega Tyranitar: [MEGA-TYRANITAR.md](MEGA-TYRANITAR.md).
- Dos ataques iniciales distintos, al menos uno de daño. El movimiento propio de cada Mega empieza en nivel 2 si se elige: Terratemblor, Golpe Kárate o Lanzarrocas.
- Se conservan movimientos, cartas y estadísticas durante todos los encuentros. Sólo los mayores dan un Vínculo; se usa el sistema nativo de fusión, con intermedio pausado mientras se elige.
- El trío inicial entrega una única recompensa de dos niveles base y 20% de vida al caer los tres. Desde Groudon, cada victoria da XP equivalente a los requisitos de tres niveles siguientes, 20% de curación y tres segundos de intermedio. Se conservan bonos de experiencia y reparto nativo de orbes.
- Sin bonos se llega a Groudon a nivel 10, Kyogre a 19 y Rayquaza a 28, terminando en 31. Con Sabiduría de oro máxima y sin cartas de Aprendizaje, las referencias llegan en niveles 10/22/34.
- La vida de cada enemigo se multiplica una sola vez por el número de jugadores inicial. Las bajas y salidas no reducen esa cifra. La entrada cooperativa y sincronización del modo siguen pendientes; el escalado se verifica con equipos simulados.

## Vida y dificultad

| Encuentro | PV base por enemigo | Daño de referencia | Cadencia de menores |
| --- | ---: | ---: | ---: |
| Tres Regis juntos | 44000 cada uno | 21 base, movimientos 18–24 | Relojes por movimiento |
| Groudon | 400000 | Patrones propios | Por fases |
| Menor posterior 1 | 800000 | 36 | ×1.21 |
| Menor posterior 2 | 1200000 | 40 | ×1.255 |
| Kyogre | 2500000 | Patrones propios | Por fases |
| Menor posterior 3 | 2400000 | 44 | ×1.30 |
| Menor posterior 4 | 3600000 | 48 | ×1.345 |
| Rayquaza | 5000000 | Patrones propios | Por fases |

No hay vida adaptativa al DPS, regeneración del jefe para alargar peleas ni invulnerabilidad por tiempo. Se conservan tipos, defensa, críticos y estados. En los menores individuales sólo se reduce la espera entre ataques; sus avisos, proyectiles y movimiento conservan las reglas normales. La cadencia total con furia no supera ×1.5.

La revisión anterior con Deoxys mostró que 240000 PV para un primer menor individual podían dar 5:54 contra Jirachi incluso con oro máximo. El trío no reutiliza tres veces ese presupuesto. La referencia nueva completa dura aproximadamente 1:25 con Deoxys y 0:32 con Mega Blaziken. Son simulaciones ofensivas, con daño recibido ignorado y posición controlada, no partidas humanas.

Los menores posteriores conservan la referencia de 1–2 minutos con Mega Blaziken potente, oro máximo, evoluciones, Vínculo y 85% de tiempo atacando; las builds, tipos y ejecución cambian la duración. La referencia anterior de 12:11 del dueño corresponde a la ruta antigua de siete combates.

## Mayores

**Groudon:** 400000 PV aceptados tras una prueba humana de 2:30. Fases al 70%/35%, movimiento entre lanzamientos a 88/100/112 y esperas de 0.4/0.25/0.15 s. Usa Filo del Abismo, Terratemblor, Estallido, Doble Filo y Terremoto. En fases 2/3 combina dos/hasta tres movimientos; Terremoto es exclusivo y deja refugio. Se valida salida a velocidad 130 con reacción de 0.25 s; si hace falta se alarga el aviso o reduce la combinación. Las áreas se fijan al anunciarse. Doble Filo usa contacto real y retroceso de un tercio del daño efectivo. Lava temporal y protección compartida de impactos.

**Kyogre:** 2500000 PV fijados por el dueño. Fases al 70%/35%, movimiento 92/104/116, avisos 1.55/1.20/0.90 s y esperas 0.38/0.24/0.14 s. Surf daña con el frente de ola visible; Hidrobomba y Rayo Hielo son haces continuos fijos. Rayo Hielo ralentiza 0.7 s sólo con daño real. Danza Lluvia dura 12/16/20 s y potencia un 15% los golpes de Agua (adaptación de balance). Pulso Primigenio es exclusivo al entrar en fases 2/3 y deja refugios cercanos. Se validan combinaciones a pie incluyendo ralentización. La lluvia, lava y retroceso no se heredan entre jefes.

**Rayquaza:** 5000000 PV. Fases al 70%/35%, movimiento 112/130/148, avisos 1.45/1.15/0.90 s y esperas 0.32/0.20/0.12 s. Ascenso Draco, Velocidad Extrema, Pulso Dragón, Vendaval y Cometa Draco. Ascenso Draco y Velocidad Extrema no se combinan entre sí. Cometa Draco va solo y deja recuperación de 1.7 s; sus avisos son 1.90/1.60/1.35 s. Picado a destino fijo, embestida con contacto real sin retroceso, haz continuo y meteoros con descenso visible. Da un tercer Vínculo al vencer y cierra la prueba.

Los mayores conservan su protección compartida de 0.9 s. Sus relojes y avisos se detienen con pausa. Una fase nueva nunca acorta una señal ya visible.

## Arena y efectos

Arena a pantalla completa: mínimo de 960×560 unidades, tamaño adaptado a la proporción y paredes fuera de las esquinas. Suelo continuo, sin cuadrícula, marco ni obstáculos aleatorios. Los mayores usan roca volcánica, fondo marino y templo celestial. Toda la decoración es transitable; las rocas temporales anunciadas de Regirock sí tienen colisión.

Actores, patrones y cámara comparten `G.Groudon.ARENA`. Al girar y reducir mucho un eje, se eliminan señales anteriores y se concede un segundo de protección al recolocar todos los actores. Al salir se restaura la cámara normal.

Los efectos se dibujan en un lienzo de baja resolución ampliado sin suavizado. Los atlas generados existentes aportan roca/lava/agua/hielo y ataques de Rayquaza; procedencia en `assets/boss-rush/README.md`. Los Regis usan el haz de hielo continuo existente y píxeles propios de roca/acero/garras. Los renders no cambian el combate ni consumen su azar. Las opciones gráficas reducen partículas; pausa congela efectos y barras.

## Recursos y aislamiento

Cada recarga crea una sesión invitada en memoria con 100000 Pokémonedas y los cuatro Pokémon de prueba. **Mejoras de oro** abre la tienda nativa; **Mejorar al máximo** completa todas las mejoras del Pokémon seleccionado gratis, fuera de combate, sin agregar cartas ni niveles. **Reponer dinero de prueba** restaura 100000 conservando las compras de la sesión. Recargar reinicia la prueba.

Coberturas, Repertorio, Veto y Atajos usan los módulos del Live. Los selectores se reconstruyen al volver de la tienda y conservan ataques todavía válidos. Swampert puede elegir Rayo Hielo → Rayo Polar o Nieve Polvo → Ventisca por Coberturas; Puño Hielo no está implementado. La selección de Coberturas se copia al empezar cada intento.

No se carga configuración Firebase ni se registra service worker. Se conserva `ps.session` y no se escribe progreso real. No hay monedas, tickets, objetos equipables, rankings ni recompensas persistentes. **Volver a Jugar** restaura el selector normal; partida normal y desafíos conservan sus modos.

## Generar y verificar

Sólo para cambios de este prototipo se ejecuta `node tools/build-boss-rush-preview.cjs`; genera exclusivamente `dev/index.html`. Nunca se regenera el `index.html` oficial, bundle ni `version.json`. Se publica con los archivos concretos sobre el `main` más reciente para conservar trabajo concurrente.

Pruebas relevantes: `tests/regis.test.cjs`, `tests/regis-integration.test.cjs`, `tests/regis-duration.test.cjs`, `tests/boss-rush-rules.test.cjs` y las de integración, duración, geometría y efectos de los tres mayores. También se mantienen las regresiones de Coberturas, mejoras de oro y las Megas. Bancos nativos: `tools/benchmark-regis.cjs`, `tools/benchmark-minors.cjs`, `tools/benchmark-groudon.cjs`, `tools/benchmark-kyogre.cjs` y `tools/benchmark-rayquaza.cjs`.

Las pruebas de integración usan el Game, Player, Enemy, Combat, Projectiles, Pickups y LevelUp reales con interfaz simulada. La revisión visual usa Canvas nativo y sprites reales; no sustituye probar en navegador o Android. Pendientes: cooperativo del modo y balance humano de la ruta nueva.

Hoenn Primigenio se hará después: cinco Regis o Regigigas al 50% de la vida conjunta, y Mega Latias/Latios. No forman parte de esta entrega del encuentro inicial normal.
