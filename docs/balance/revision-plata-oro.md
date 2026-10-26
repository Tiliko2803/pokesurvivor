# Revisión de balance TFT: Plata y Oro enemigos

Revisión del motor Live en commit 067805dc. No se modificó el juego ni se publicaron variantes experimentales.

## Método

3.900 combates aislados: 5 variantes × 3 equipos × 13 rondas × 20 semillas. Rondas: 21, 35, 46, 55, 66, 75, 81–86 y 90. Se usa el motor real, sus equipos enemigos, habilidades, sinergias, límite de 45 segundos y actualización de 0,05 s. Las variantes se generan en memoria; ejecutar `node tools/benchmark-tft-enemy-ranks.cjs` reproduce el experimento.

Equipo A, seis megas: Swampert, Blaziken, Tyranitar, Tinkaton, Meganium y Excadrill. Equipo B: Salamence, Baxcalibur, Metagross, Dragonite, Heracross y Gardevoir. Control Oro: las seis especies de A con promoción 6, sin mega. Posiciones fijas 20,21,19,22,26,27. Se generan los rivales de la ronda solicitada con la misma secuencia aleatoria entre variantes.

Los equipos empiezan completos: esta prueba no mide economía, probabilidad de obtenerlos, una expedición completa ni el equipo exacto del usuario. Veinte semillas por combinación y una sola formación no constituyen una estimación universal de victorias.

## Hallazgos del código

- Rivales actuales: hasta seis unidades, máximo Bronce ★★★, sin promoción. Los jefes llegan solos.
- Multiplicadores ocultos por ronda: vida 1 + 0,025 × (ronda−1), ataque 1 + 0,015 × (ronda−1). En ronda 86: ×3,125 vida y ×2,275 ataque antes de élite/jefe y sinergias.
- Cada promoción del jugador multiplica vida y ataque por 1,18; seis promociones hasta Oro ★★★ equivalen a ×2,6996. Iridio añade el bono normal del 15% y cambia habilidades. Apilar seis promociones enemigas encima de la curva actual multiplica ambas estadísticas otra vez por aproximadamente 2,7.
- El tablero admite seis unidades activas; poseer ocho megas no implica desplegar ocho.
- El guardado actual rechaza promociones en unidades de id negativo. Una implementación real necesita actualizar validación de rivales, mantener la prohibición de Iridio enemigo, migrar rivales en planificación y conservar combates ya iniciados. También debe revisar el guardado del combate, las fichas, las estrellas y el ranking/reglas de expediciones.

## Variantes

Todas las variantes con rangos usan promoción solo si la unidad ya tiene tres estrellas. Promoción por puesto i: `clamp(1 + floor((ronda−26−2*i)/10),0,6)`. Empiezan mezcladas alrededor de 26–35 y alcanzan Oro ★★★ entre 76 y 86; no se fuerzan evoluciones tempranas ni megas enemigas.

- Live: motor intacto.
- ranks-full: rangos completos sobre curva Live.
- ranks-soft: rangos completos; después de ronda 21, crecimiento adicional reducido a 1,2% vida y 0,9% ataque por ronda, conservando el crecimiento previo.
- ranks-tuned: conserva la curva Live y los rangos, pero divide el multiplicador oculto por `1,18^(promoción×0,65)`; el aumento neto de seis promociones es aproximadamente ×1,416 en ambas estadísticas respecto al Live actual.
- ranks-mid: compensación de 0,45 en lugar de 0,65; aumento neto de seis promociones aproximadamente ×1,727. Sirve como límite más exigente, no como recomendación de publicación.

## Resultados destacados

Porcentajes de victoria de los dos equipos de megas (A / B), 20 combates por equipo y casilla:

| Ronda | Live | Rangos apilados | Rangos con curva suavizada | Rangos compensados (0,65) | Compensación menor (0,45) |
|---|---|---|---|---|---|
| 46 | 100% / 100% | 100% / 100% | 100% / 100% | 100% / 100% | 100% / 100% |
| 66 | 100% / 100% | 95% / 100% | 100% / 100% | 100% / 100% | 100% / 100% |
| 81 | 100% / 100% | 25% / 100% | 75% / 100% | 100% / 100% | 100% / 100% |
| 82 | 100% / 100% | 0% / 60% | 25% / 95% | 95% / 100% | 75% / 100% |
| 83 | 100% / 100% | 0% / 0% | 5% / 5% | 100% / 95% | 55% / 60% |
| 84 | 100% / 100% | 0% / 0% | 0% / 5% | 70% / 100% | 20% / 70% |
| 85 | 100% / 100% | 0% / 15% | 0% / 40% | 50% / 100% | 5% / 80% |
| 86 | 100% / 100% | 5% / 100% | 50% / 100% | 100% / 100% | 100% / 100% |
| 90 | 100% / 100% | 0% / 0% | 100% / 100% | 100% / 100% | 100% / 100% |

## Recomendación

Sí conviene dar Plata/Oro a los enemigos, pero la primera propuesta de añadirlos sin corregir el escalado queda descartada: en rondas 83–84 produce 0 victorias para ambos equipos de megas, mientras que Live da 100%. Bajar solo la pendiente tampoco resuelve ese salto.

Usar la variante compensada 0,65 como punto inicial para Pruebas, sin megas enemigas. En ronda 84 pasa de 100%/100% a 70%/100%; en 85, a 50%/100%. Mantiene la ventaja de un equipo bien compuesto, aunque no garantiza desafío para todas las combinaciones. El control Oro en ronda 85 baja a 15%: hay que comprobar que no se convierta en obligación llevar seis megas.

No declarar estable todavía: el tema de la ronda 86 sigue siendo trivial para el equipo B (100% de victorias, 97,6% de vida restante promedio), mientras que otras rondas son mucho más exigentes para A. Los jefes de ronda 90 siguen perdiendo todos los combates ante los dos equipos Mega en la variante compensada. La composición rival y el presupuesto de los jefes requieren una segunda pasada antes de subir dificultad en Live.

Siguiente validación: incorporar otras formaciones, composiciones mixtas Plata/Oro/Iridio realistas y el equipo exacto del usuario; aumentar semillas y revisar rondas 20–40; medir tiempo, bajas, vida restante, daño, curación y resultados por tema/jefe. Separar derrotas normales de tiempo agotado. Revisar también restauración determinista de combates con rangos enemigos y compatibilidad de partidas existentes.

Los datos completos incluyen victoria, empate, duración, vida restante, promoción rival media, daño y curación por combinación. No se deduce un cambio de habilidades a partir de esta prueba y no se aplicó ningún nerf.
