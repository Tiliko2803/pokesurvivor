# Ataques desincronizados de los mayores

`dev/major-cadence.js` conecta un coordinador independiente a Groudon, Kyogre y Rayquaza en `/dev/`. Conserva los modelos existentes como fuente de geometría, daño, tipos, efectos, desplazamientos y protección contra impactos. No altera los encuentros de los Regis ni del Dúo Eón, ni la IA del modo normal.

## Relojes y fases

Cada movimiento normal tiene un enfriamiento y un primer momento de disponibilidad propios. El enfriamiento se cuenta desde que se acepta su lanzamiento; los otros relojes no se reinician. Si una combinación es insegura, el movimiento espera y se vuelve a intentar, sin modificar avisos ya visibles. El orden de disponibilidad resuelve los candidatos pendientes.

| Jefe | Movimiento | Primer intento | Enfriamiento fases 1 / 2 / 3 |
| --- | --- | ---: | --- |
| Groudon | Filo del Abismo | 0.55 s | 6 / 5 / 4 s |
| Groudon | Doble Filo | 2.2 s | 8 / 6.8 / 5.8 s |
| Groudon | Estallido | 4 s | 7 / 5.8 / 4.8 s |
| Groudon | Terratemblor | 6 s, si hay objetivo cercano | 6.5 / 5.5 / 4.5 s |
| Kyogre | Danza Lluvia | 0.55 s y entrada de fase | 14 / 18 / 22 s, sólo si la lluvia terminó |
| Kyogre | Hidrobomba | 2.8 s | 6.8 / 5.6 / 4.6 s |
| Kyogre | Surf | 4.5 s | 8.4 / 7 / 6 s |
| Kyogre | Rayo Hielo | 6.3 s | 7.5 / 6.2 / 5.2 s |
| Rayquaza | Ascenso Draco | 0.55 s | 8.4 / 7 / 6 s |
| Rayquaza | Pulso Dragón | 2.1 s | 6.8 / 5.6 / 4.8 s |
| Rayquaza | Velocidad Extrema | 4.2 s | 9.5 / 8 / 6.5 s |
| Rayquaza | Vendaval | 6 s | 7.8 / 6.5 / 5.5 s |

Se mantienen fases al 70% y 35% de vida. Cada fase permite hasta 1 / 2 / 3 movimientos simultáneos, contando sus recuperaciones. Los inicios se separan al menos 0.95 / 0.8 / 0.7 s; los impactos programados, 0.85 / 0.7 / 0.65 s. Los candidatos conservan sus propios avisos: no se igualan al del resto del grupo.

Kyogre y Rayquaza conservan sus avisos más rápidos por fase. Las transiciones no acortan señales existentes ni reinician todos los relojes a la vez. El siguiente lanzamiento usa el enfriamiento de la fase actual. Groudon conserva las duraciones propias de sus señales.

## Seguridad y movimientos especiales

Antes de aceptar un aviso se busca una posición segura contra la unión de las señales y la lava. La ruta debe ser alcanzable usando el radio y la velocidad real del jugador (limitada a 130 para esta comprobación), con 0.25 s de reacción si necesita desplazarse, antes del aviso más próximo. Si ya hay un ataque haciendo daño, también se comprueba que el trayecto no cruce su zona anunciada. Es una comprobación conservadora: Surf reserva su corredor completo mientras está activo.

Un movimiento aislado puede alargar su aviso para un jugador grande o ralentizado. Un ataque nuevo nunca acorta o desplaza una marca anterior. Las embestidas y picados no se preparan a la vez que otro desplazamiento ni con haces o Terratemblor todavía activos; pueden aprovechar las recuperaciones cuando el desplazamiento anterior ya terminó. Las áreas independientes sí pueden solaparse con un desplazamiento compatible.

- **Terremoto:** exclusivo al entrar en la fase 3 de Groudon; limpia lava y conserva el refugio y su recuperación de 2.5 s. En equipos simulados añade refugios locales para compañeros separados, evitando que el especial quede bloqueado por una ruta imposible; la entrada cooperativa del modo sigue pendiente.
- **Danza Lluvia:** exclusiva; no hace daño. Se renueva al entrar en fase y, si expira, cuando vuelva a estar disponible.
- **Pulso Primigenio:** exclusivo al entrar en fases 2 y 3 de Kyogre; conserva los refugios por jugador y su recuperación de 1.6 s.
- **Cometa Draco:** exclusivo al entrar en fases 2 y 3 de Rayquaza; conserva su recuperación de 1.7 s.

Una transición espera a que terminen los ataques anteriores para ejecutar el especial; no añade otros avisos mientras espera. Se considera ejecutado cuando llega su impacto, por lo que una rotación que cancele su preparación permite reintentarlo. La gracia compartida de daño sigue siendo de 0.9 s.

## Movimiento, pausa y aislamiento

Los jefes se acercan durante las esperas sin ataques pendientes. Una vez anunciada una trayectoria, sólo el movimiento propio de la embestida o picado desplaza al jefe. Cada ataque se retira al terminar su recuperación individual.

Pausa congela relojes, señales, efectos y recuperaciones. Una reducción grande de la arena llama a `interrupt()`, retira los ataques y lava anteriores y retrasa las siguientes disponibilidades. La derrota cancela todo y emite una sola victoria. La vida de los jefes, las recompensas, los Vínculos y la cuenta invitada mantienen sus reglas anteriores.

## Verificación

`tests/major-cadence.test.cjs` cubre relojes independientes, solapamientos reales, separación entre inicios e impactos, límites por fase, señales fijas, rutas en tres proporciones de pantalla, esquinas, jugadores grandes y ralentizados, desplazamientos compatibles, recuperación exclusiva, pausa, rotación y muerte. La integración usa el motor nativo y comprueba que se carga el coordinador sólo para los tres mayores. Las pruebas de geometría de los modelos originales siguen verificando sus formas y daño; las pruebas nuevas comprueban el coordinador que usa la página.

Los bancos nativos de duración de los tres mayores y los grupos se ejecutan con el coordinador activado en la página simulada. Son referencias ofensivas con daño recibido ignorado y posición controlada; no sustituyen la prueba humana de dificultad. La revisión visual usa Canvas y sprites reales, sin afirmar una prueba en navegador o Android.


Referencia con semilla 123, oro máximo, cartas legales y 85% de tiempo atacando: Groudon 170.17 s (build Danza, nivel 10), Kyogre 142.82 s (Onda Certera + Danza de Mil Espadas, nivel 21) y Rayquaza 152.65 s (misma combinación, nivel 33). No se cambia la vida: 400000 / 2500000 / 5000000 PV base. Los rangos de duración se verifican también con otras semillas y builds.
