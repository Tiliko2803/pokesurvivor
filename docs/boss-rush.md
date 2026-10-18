# Hoenn Normal · Live

Entrada: Jugar → Boss Rush · Hoenn. Sólo solitario; no permite empezar desde una sala de cooperativo. Se usa el Pokémon equipado y poseído de la cuenta: Mega opcional, shiny, mejoras compradas, Coberturas, Repertorio, Veto y Atajos nativos. No se recrea ni sustituye el guardado de la cuenta.

La ruta es Regis → Groudon → Latios/Latias → Kyogre → Jirachi → Rayquaza: seis encuentros y nueve jefes. Empieza en nivel 8 con siete cartas nativas y el combate detenido durante la selección. Conserva la progresión, fases y efectos de la versión aprobada.

No hay selector extra de Pokémon o movimientos, dinero gratuito, mejoras al máximo, desbloqueos de Megas ni acceso directo a Jirachi en Live. Esas herramientas siguen sólo en `/dev/`, que conserva su adaptador aislado de la cuenta real.

Se usa `js/systems/boss-rush.js` como adaptador oficial y los módulos de encuentros de `dev/` compartidos con el prototipo. El arranque oficial conserva Firebase, el actualizador y el service worker. La interfaz y la portada aprobadas se reutilizan.

Al terminar se entrega el cálculo habitual de Pokémonedas (tiempo, bajas y jefes), una sola vez. No añade premios especiales. Las bajas cuentan para los contadores habituales. Los tiempos y niveles del modo no cambian los récords de supervivencia y nunca se envían a su ranking. Los objetivos de finalizar runs normales y las misiones de megapiedras no usan el resultado del Boss Rush. Las cartas y Vínculos de la partida son temporales.

`tests/boss-rush-live.test.cjs` comprueba el guardado sin sustituciones, equipo nativo, preparación, ruta completa, monedas únicas, exclusión del ranking, regreso a partidas normales, restricciones de sala y limpieza incluso al salir durante la preparación. La suite del prototipo comprueba los encuentros y sus patrones compartidos.

Publicar el fork: `node tools/build.js --github-pages`, `node tools/export_data.js`, `python tools/make_seo_pages.py --github-pages`; la página de pruebas se genera por separado con `node tools/build-boss-rush-preview.cjs`. El generador incluye los módulos de encuentros y el CSS en la huella de actualización.
