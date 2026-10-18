# Dúo Eón · Hoenn Normal

Latios (381) y Latias (380) combaten juntos entre Groudon y Kyogre. Después de Kyogre aparece únicamente Jirachi y después Rayquaza. Deoxys queda reservado. No hay Mega Evolución en Normal. La variante con Mega Latios y Mega Latias al 50% queda para Primigenio.

## Mismos movimientos, distintas posiciones

Los dos usan Cabezazo Zen, Pulso Dragón y Psíquico. Se verificaron como movimientos compartidos en las listas de [Latios](https://pokemondb.net/pokedex/latios/moves/9) y [Latias](https://pokemondb.net/pokedex/latias/moves/9). Geometría, daño y animación se comparten; las áreas y tiempos son adaptaciones al combate del juego.

| Movimiento | Aviso mínimo | Daño bruto | Ejecución |
| --- | ---: | ---: | --- |
| Cabezazo Zen | 1.35 s | 40 | Embestida de 0.7 s por corredor fijo; daño junto al cuerpo en movimiento |
| Pulso Dragón | 1.35 s | 34 | Un proyectil de radio 18 a velocidad 320 por trayectoria fija |
| Psíquico | 1.50 s | 33 | Círculos de radio 55 fijados en las posiciones anunciadas |

Latios persigue a velocidad 95 hasta quedar a unas 95 unidades. Latias usa velocidad 75, retrocede si el jugador se acerca y orbita alrededor de 265 unidades; se desliza lateralmente al encontrar una pared. Ninguno puede moverse libremente durante la preparación, ejecución o recuperación de un ataque. Cabezazo Zen sí desplaza al lanzador cuando termina el aviso.

## Desincronización y seguridad

`G.Eon.Encounter` reutiliza el coordinador de `G.Regis.Encounter`, sin duplicar ni cambiar su planificador. Cada uno de los seis movimientos tiene reloj propio:

| Lanzador | Movimiento | Primer intento | Enfriamiento |
| --- | --- | ---: | ---: |
| Latios | Cabezazo Zen | 1.1 s | 7.2 s |
| Latias | Pulso Dragón | 2.2 s | 7.7 s |
| Latios | Pulso Dragón | 4.3 s | 8.2 s |
| Latias | Psíquico | 5.5 s | 9.0 s |
| Latios | Psíquico | 7.6 s | 10.0 s |
| Latias | Cabezazo Zen | 9.1 s | 11.0 s |

Son momentos de disponibilidad, no una obligación de disparar. El coordinador retrasa combinaciones sin salida: máximo dos movimientos, uno por lanzador, al menos 0.7 s entre inicios y 0.65 s entre impactos programados. Comprueba rutas alcanzables usando radio y velocidad real del jugador, reacción de 0.25 s y los avisos ya activos. Un movimiento aislado amplía su aviso si hace falta. Latios puede embestir mientras Latias prepara un ataque compatible.

Las trayectorias nunca persiguen al jugador después del aviso. Los proyectiles usan su posición real y Cabezazo Zen usa la posición real del cuerpo, sin daño instantáneo sobre todo el corredor. El daño pasa por las defensas y tipos nativos, con una gracia compartida de 0.9 s. Al bajar del 50% de vida, sólo el enfriamiento del siguiente uso baja a ×0.85; un aviso visible no se acorta. No hay curación, escudos ni invulnerabilidad artificial.

Morir cancela únicamente los ataques del dueño. Girar la pantalla y reducir mucho un eje cancela las señales anteriores, recoloca todos los actores y concede la protección habitual. Pausa congela movimiento, efectos y barras.

## Vida, progresión y referencias

Cada uno tiene **190000 PV base**, multiplicados por el tamaño inicial del equipo. La interfaz sigue siendo individual: el cooperativo del modo está pendiente. Las barras comparten el ancho habitual, azul para Latios y rosa para Latias; la derrotada tiembla y se desvanece y la superviviente se amplía.

No se da XP, curación ni Vínculo por una baja parcial. Al caer ambos se entrega una sola recompensa de seis niveles base de experiencia, un 20% de curación y un intermedio. Sin bonos se pasa de nivel 13 a 19; con oro máximo y sin cartas de Aprendizaje, la referencia llega a Kyogre en 21. Sólo los mayores conceden Vínculos.

`tools/benchmark-eon.cjs` utiliza Game, Player, Enemy, Combat, tipos, mejoras de oro, evoluciones y Vínculo nativos. Con semilla 123, nivel 14, trece elecciones legales, 85% de tiempo atacando y distancia controlada:

| Referencia | Movimientos evolucionados | Dúo completo |
| --- | --- | ---: |
| Mega Blaziken | Onda Certera + Danza de Mil Espadas | 66.28 s |
| Deoxys normal | Psicocarga + Danza de Mil Espadas | 112.17 s |

Son simulaciones ofensivas con daño recibido ignorado, no pruebas humanas de supervivencia ni tiempos garantizados para toda build. Las pruebas de duración repiten tres semillas y comprueban la derrota de ambos, no sólo del primer objetivo. La vida permanece fija durante cada intento.

## Efectos y comprobación

`dev/eon-fx.js` dibuja anillos psíquicos, un pulso con estela continua y el aura de embestida mediante píxeles; los dos Pokémon comparten el mismo render. No requiere nuevos atlas ni cambia el azar del combate. Se usa el templo celestial existente. El lienzo de efectos se amplía sin suavizado.

Pruebas: `tests/eon.test.cjs`, `tests/eon-integration.test.cjs`, `tests/eon-duration.test.cjs` y regresiones de toda la ruta. Cubren los seis relojes, tres proporciones de arena, esquinas, jugadores grandes y ralentizados, trayectorias fijas, colisiones móviles, bajas parciales, pausa, giro, barras y aislamiento de la cuenta. Se revisan renders Canvas con sprites reales en horizontal y vertical; queda pendiente la prueba humana en navegador y Android.
