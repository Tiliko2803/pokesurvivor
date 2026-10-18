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

`dev/index.html` usa los módulos actuales del juego y carga un adaptador exclusivo de pruebas. El primer tramo es Groudon → Regirock → Regice. La pantalla indica que Kyogre está pendiente; al vencer a Regice concluye este tramo, no la ruta completa.

- Tres Pokémon de prueba: Swampert, Blaziken y Sceptile. Selección de dos ataques distintos; al menos uno causa daño.
- Nivel 10 con nueve elecciones reales usando las cartas del juego. Los ataques empiezan en nivel 1 y se mejoran mediante cartas. El combate queda pausado durante toda la preparación.
- Estadísticas base de la especie, sin compras de la cuenta. Velocidad base de prueba: 130, para que se puedan esquivar los avisos caminando.
- Victoria: experiencia equivalente al 220% del requisito del nivel actual, con el reparto normal de orbes; curación del 20% de vida máxima y tres segundos antes del siguiente enemigo. No hay monedas, tickets ni botín equipable.
- Los menores conservan la IA de jefes existente, con HP/daño propios de la ruta: Regirock 3200/27 y Regice 4000/30. Sin hordas entre combates.
- Groudon: 10000 PV provisionales. Fases al 70% y 35%; Filo del Abismo y Pisotón en fase 1, Erupción y Carga desde fase 2, patrones más seguidos y una Ruptura Continental desde fase 3.
- Avisos de 1.25–1.4 segundos y dos segundos para Ruptura. Carga recupera tres segundos; Ruptura cuatro. La lava dura cinco segundos y desaparece antes de Ruptura. El refugio se coloca de modo que sea alcanzable.
- Se conserva la defensa, tabla de tipos y estados de daño. Un impacto por ataque y jugador; gracia de 0.9 segundos tras los golpes del patrón.

## Aislamiento

No se carga la configuración Firebase ni se registra un service worker. Se crea una sesión invitada en memoria y se conserva `ps.session`. Los métodos de ranking están deshabilitados exclusivamente en esta página. La página oficial y sus módulos de ejecución no se modifican. El changelog identifica expresamente la función como prototipo de desarrollo.

El borrador no se publica en `main`. Cuando se decida publicar la prueba, se usará la URL de desarrollo existente, sin crear otro enlace de pruebas.

## Regenerar y comprobar

```sh
node tools/build-boss-rush-preview.cjs
node --test tests/groudon.test.cjs tests/groudon-integration.test.cjs
python3 -m http.server 8765
```

Abrir `/dev/` para la prueba. El generador nunca modifica `index.html`, `version.json` ni el bundle oficial.

Las pruebas de integración ejecutan `game.js`, Player, Enemy, Combat, Projectiles, Pickups y LevelUp reales con servicios de interfaz simulados. Comprueban preparación, pausas, daño, avance por los tres enemigos, XP/niveles, victoria, reintento y conservación de sesión/guardado. Las pruebas del patrón verifican avisos, rutas de escape, fases, daño único, lava y refugio de Ruptura.

Pendiente: revisión en navegador y Android, balance mediante partidas reales, Kyogre, Rayquaza, selección variable de menores, cooperativo y sinergias. El entorno de trabajo no disponía de Chromium y su descarga no se pudo completar; las pruebas de motor no sustituyen esa revisión visual.
