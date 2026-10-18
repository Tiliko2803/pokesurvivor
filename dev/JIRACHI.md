# Jirachi · El observatorio de los deseos

Encuentro propio para Jirachi (385) en la prueba de Hoenn Normal. Conserva su lugar de menor posterior a Kyogre: Jirachi y Deoxys siguen barajándose entre los encuentros 4 y 5 (índices desde cero). Deoxys conserva por ahora sus patrones nativos.

## Fases y ataques

Jirachi usa cuatro movimientos reales. Sus patrones son adaptaciones para el Boss Rush, no una reproducción literal del combate por turnos.

| Movimiento | Aviso fases 1 / 2 / 3 | Patrón y daño bruto |
| --- | --- | --- |
| Deseo Oculto | 2.5 / 2.5 / 2 s | Columnas doradas sobre posiciones fijadas al anunciarse; 48, Acero |
| Rapidez | 1.1 / 0.8 / 0.65 s | Abanicos de 3 / 5 / 7 estrellas, daño con cada proyectil visible; 24, Normal |
| Foco Resplandor | 1.25 / 1.1 / 0.85 s | Un haz continuo fijo, sin perseguir al jugador; 38, Acero |
| Psíquico | 1.4 / 1.2 / 0.95 s | Anillo expansivo; sólo daña su frente visible de 20 unidades de grosor; 30, Psíquico |

Los umbrales son 70% y 35% de vida. En fase 1 se usan movimientos individuales. En fases 2 y 3 hay como máximo dos movimientos simultáneos, contando sus recuperaciones. Deseo Oculto mantiene sus 2.5 s de aviso en la fase 2; allí empieza la combinación con otros ataques. En solitario añade dos marcas laterales desde la fase 2; con varios jugadores simulados marca a cada jugador, hasta cuatro, sin multiplicar esas marcas adicionales.

El primer Deseo Oculto está disponible a los 0.7 s y Rapidez a los 1.7 s. En fase 2, si el jugador ya salió de las marcas y la combinación tiene salida, Rapidez puede prepararse un segundo después de Deseo Oculto. La prueba de patrón verifica esa secuencia. Si no es segura, el movimiento nuevo espera.

Cada ataque tiene reloj propio: Deseo Oculto 10 / 8.5 / 7 s; Rapidez 6 / 5 / 4.2 s; Foco Resplandor 8 / 6.8 / 5.6 s; Psíquico 10 / 8.5 / 7 s. Sólo el lanzamiento aceptado reinicia su reloj. Se reutiliza el coordinador de los mayores con un perfil y límites propios, sin cambiar los límites de Groudon, Kyogre o Rayquaza.

## Salidas y recuperación

Los avisos y sus posiciones se fijan al lanzarse. Un cambio de fase no acorta los avisos anteriores. El coordinador comprueba una salida contra la unión de amenazas, con radio y velocidad del jugador, hasta 130 unidades/s y reacción de 0.25 s. Un jugador grande o ralentizado puede recibir un aviso aislado más largo si lo necesita. Los impactos mantienen separación y gracia compartida de 0.9 s.

La separación angular de Rapidez contempla el tamaño del objetivo y su distancia. Su colisión sigue las estrellas reales, no el corredor completo. Psíquico anuncia el anillo barrido y deja visible su hueco interior; su colisión usa únicamente el frente que se expande. Las pruebas cubren esquinas, combate cercano, tres proporciones de pantalla y ralentización.

Tras el impacto de Deseo Oculto se dejan terminar los ataques ya pendientes y sus recuperaciones; entonces hay **un segundo adicional de recuperación**, sin lanzar nuevos movimientos ni alejarse. Se puede seguir dañando a Jirachi durante todo ese tiempo. No se usa regeneración, invulnerabilidad o una duración mínima artificial.

Jirachi se desplaza en curvas a distancia media entre lanzamientos, se detiene durante sus preparaciones y flota ligeramente. La arena es un observatorio continuo índigo con constelaciones decorativas transitables. Los efectos dorados, plateados y violetas se dibujan en píxeles mediante el lienzo compartido de baja resolución, sin modificar el azar del combate.

## Vida y progresión

La vida inicial es **600000 PV** si aparece en el encuentro 4 y **900000 PV** en el 5. La segunda posición conserva el aumento de poder del jugador y eleva también el daño en proporción a 48/44. Cada cifra de vida se multiplica por el tamaño inicial del equipo; el cooperativo del modo todavía no tiene entrada ni sincronización y se comprueba con equipos simulados.

La recompensa conserva la del menor: XP equivalente a tres niveles base, bonos nativos y una sola curación del 20%. **No concede Vínculo.** No cambia monedas, rankings, cuenta ni progreso persistente.

`tools/benchmark-jirachi.cjs` usa el motor y las cartas legales del juego, oro máximo, Vínculo, 85% de tiempo atacando y posición controlada. Ignora el daño recibido para medir duración ofensiva. En el primer tramo, semilla 123:

| Referencia | Movimientos evolucionados | Duración |
| --- | --- | ---: |
| Deoxys normal, nivel 25 | Psicocarga + Danza de Mil Espadas | 111.05 s |
| Mega Blaziken, nivel 25 | Onda Certera + Danza de Mil Espadas | 23.77 s |

El objetivo aproximado de 1–2 minutos se alcanza con esa referencia de Deoxys. La build de Mega Blaziken lo derrota bastante antes; se conserva esa ventaja de tipos, estadísticas e Impulso. Inflar la vida para obligar a esa Mega a durar un minuto alargaría demasiado el combate de Deoxys. No se promete el mismo tiempo para todas las builds. Las referencias de duración verifican tres semillas y ambas posiciones de la ruta; queda pendiente la dificultad humana en navegador y Android.

## Archivos y verificaciones

- `dev/jirachi.js`: geometría, colisiones móviles, perfil de fases y desplazamiento.
- `dev/jirachi-fx.js`: estrellas, columnas, haz y anillo de píxeles.
- `dev/major-cadence.js`: admite perfil, límites y recuperación configurables; los mayores conservan su configuración.
- `tests/jirachi.test.cjs`, `tests/jirachi-integration.test.cjs`, `tests/jirachi-duration.test.cjs`: patrones, seguridad, progresión, pausa, rotación, recompensas y referencias nativas.

La revisión visual usa Canvas nativo con sprites reales en horizontal y vertical. Sólo se genera `dev/index.html` con `node tools/build-boss-rush-preview.cjs`.
