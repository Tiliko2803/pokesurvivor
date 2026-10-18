# Boss Rush de Hoenn — primer tramo

## Diseño acordado

La ruta completa prevista alterna un legendario mayor con dos menores:

1. Groudon.
2. Dos legendarios menores del juego existente.
3. Kyogre.
4. Otros dos legendarios menores.
5. Rayquaza.

El jugador empieza directamente en nivel 10, elige nueve mejoras antes de combatir y conserva ataques, estadísticas y experiencia entre encuentros. Los menores sirven para ganar poder antes del siguiente mayor. Las sinergias cooperativas se incorporarán después; no son requisito del prototipo individual.

## Implementado

`dev/index.html` usa los módulos actuales del juego y carga un adaptador exclusivo de pruebas. El primer tramo es Groudon → dos legendarios menores aleatorios. La pantalla indica que Kyogre está pendiente; al vencer al segundo menor concluye este tramo, no la ruta completa.

- Tres Pokémon de prueba: Swampert, Blaziken y Sceptile. Selección de dos ataques distintos; al menos uno causa daño.
- Nivel 10 con nueve elecciones reales usando las cartas del juego. Los ataques empiezan en nivel 1 y se mejoran mediante cartas. El combate queda pausado durante toda la preparación.
- Estadísticas base de la especie con las compras de oro realizadas dentro de la prueba; no se importan compras de la cuenta. Velocidad base de prueba: 130, conservando el multiplicador de Zancada comprado, para que se puedan esquivar los avisos caminando.
- Victoria: experiencia equivalente a la suma de los requisitos de los tres niveles siguientes, con el reparto normal de orbes; curación del 20% de vida máxima y tres segundos antes del siguiente enemigo. No hay monedas, tickets ni botín equipable.
- Los menores conservan la IA de jefes existente, las preferencias de distancia por tipo y la velocidad de movimiento estándar de las grietas. Sus estadísticas dependen de la posición en la ruta: 3200 PV y 27 de daño como base; por cada puesto posterior al primer menor, la vida se multiplica por 1.18, el daño por 1.07 y la cadencia gana 3.5 puntos porcentuales, hasta +30%. La cadencia total con furia queda limitada a ×1.5. Sólo se reduce la espera entre ataques; no se aceleran los avisos, los proyectiles ni los movimientos. Sin hordas entre combates.
- Groudon: 10000 PV provisionales. Fases al 70% y 35%; Filo del Abismo y Terratemblor en fase 1, Estallido y Doble Filo desde fase 2, patrones más seguidos y Terremoto desde fase 3.
- Avisos de 1.25–1.4 segundos y dos segundos para Terremoto. Doble Filo recupera tres segundos; Terremoto cuatro. La lava dura cinco segundos y desaparece antes de Terremoto. El refugio se coloca de modo que sea alcanzable.
- Se conserva la defensa, tabla de tipos y estados de daño. Un impacto por ataque y jugador; gracia de 0.9 segundos tras los golpes del patrón.

## Aislamiento

No se carga la configuración Firebase ni se registra un service worker. Se crea una sesión invitada en memoria y se conserva `ps.session`. Los métodos de ranking están deshabilitados exclusivamente en esta página. La página oficial y sus módulos de ejecución no se modifican. El changelog identifica expresamente la función como prototipo de desarrollo.

Publicación autorizada en la URL de desarrollo existente `/dev/`, la misma usada para probar las megas. Sólo se publican la página de prueba, sus módulos, documentación, pruebas y la nota de novedades; no se regenera la página oficial ni su versión. Se parte del `main` vigente para conservar los cambios de Toji.

## Regenerar y comprobar

```sh
node tools/build-boss-rush-preview.cjs
node --test tests/boss-rush-rules.test.cjs tests/groudon.test.cjs tests/groudon-integration.test.cjs
python3 -m http.server 8765
```

Abrir `/dev/` para la prueba. El generador nunca modifica `index.html`, `version.json` ni el bundle oficial.

Las pruebas de integración ejecutan `game.js`, Player, Enemy, Combat, Projectiles, Pickups y LevelUp reales con servicios de interfaz simulados. Comprueban preparación, pausas, daño, avance por los tres enemigos, XP/niveles, victoria, reintento y conservación de sesión/guardado. Las pruebas del patrón verifican avisos, rutas de escape, fases, daño único, lava y refugio de Terremoto.

Pendiente: revisión en navegador y Android, balance mediante partidas reales, Kyogre, Rayquaza, cooperativo y sinergias. El entorno de trabajo no disponía de Chromium y su descarga no se pudo completar; las pruebas de motor no sustituyen esa revisión visual.

## Movimientos oficiales

Usar movimientos reales de Pokémon con nombres en español. Sus señales, áreas y secuencias se adaptan al Boss Rush. Doble Filo causa daño Normal y retroceso equivalente a un tercio del daño efectivo causado. Los patrones de arena no son ataques nuevos.

Para Kyogre, el diseño propuesto se basará en Surf (oleadas), Hidrobomba (chorro anunciado), Rayo Hielo (haz con ralentización adaptada), Danza Lluvia (clima) y Pulso Primigenio (patrón culminante). Su implementación y balance siguen pendientes.

## Selección y progreso de menores

Se sortean especies sin repetir usando la Pokédex y los sprites disponibles. Se excluyen todos los mayores indicados por el dueño (Mewtwo, aves de Johto, trío ancestral, dioses de Sinnoh, dragones de Teselia, tríos de Kalos/Alola/Galar y Koraidon/Miraidon), además de Urshifu, Calyrex, Ogerpon y Terapagos. Los personajes custom tampoco entran. Las exclusiones son explícitas: no dependen de la rareza del gacha.

Con tres niveles de experiencia por victoria y sin bonos, el primer tramo lleva del nivel 10 al 19 antes del próximo mayor. Aprendizaje y otros bonos de XP conservan su efecto. La curva es provisional y requiere partidas reales para evaluar justicia y dificultad.

## Recursos para probar

Cada carga inicia una sesión temporal con 100000 Pokémonedas y Swampert, Blaziken y Sceptile desbloqueados. El botón Mejoras de oro abre la tienda nativa para el Pokémon seleccionado. Reponer dinero de prueba restaura 100000 monedas conservando las compras de esta sesión; no funciona durante una partida. Las compras se aplican al siguiente intento, incluyendo Zancada y Más Opciones durante la preparación. Recargar la página reinicia esta sesión temporal.
