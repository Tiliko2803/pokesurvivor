# Mega Blaziken — primera prueba jugable

Disponible en el entorno existente `/dev/`, mediante **Probar Mega Blaziken**.
La página crea una sesión de invitado en memoria con `dev/preview-init.js`;
no carga la cuenta real ni escribe premios, Pokémon o marcas de ranking.
El compañero de prueba anterior sigue siendo Mega Swampert.

## Combate

- Fuego / Lucha, a partir de las estadísticas normales de Blaziken.
- Golpe Kárate de tipo Lucha, cuerpo a cuerpo, a nivel 2 desde el inicio.
  Reutiliza el movimiento y sus mejoras del juego; no cambia el ataque de otros Pokémon.
- Vida: 111 (+5 % redondeado). Ataque: 1.673 (+23 %). Velocidad: 121 (+8 % redondeado).
- Conserva la reducción mega existente de 8 % y el beneficio de defensa del combate cuerpo a cuerpo.
- Impulso: +5 % de velocidad cada 30 segundos de juego activo; máximo +25 %
  después de 150 segundos. Se reinicia en cada partida y se detiene al pausar.
- No se habilitan todavía Blazikenita, misión de desbloqueo ni versión shiny.

## Arte

Fuente: `167333.png`, hoja creada y adjuntada por el usuario el 15 de octubre de 2026,
1402 × 1122, transparente, 11 columnas y 8 filas.

`tools/prepare_mega_blaziken.py` recorta las celdas reales, alinea los pies
sin escalar cada pose por separado y produce el atlas WebP sin pérdida
`dev/assets/pokemon/257/mega/mega-blaziken.webp`, de 2112 × 1280.
No se usan sprites de terceros para esta mega.

Reposo: columnas 1–2. Caminar: 3–7. Ataque: 7–10, con la patada en la 8.
Daño: 11. La caída reutiliza daño con un desvanecimiento, porque la hoja no
incluye una caída dibujada. Shoot reutiliza la secuencia de ataque y Charge
la guardia: son adaptaciones, no animaciones adicionales originales.

Las ocho filas se conservan, pero varios perfiles y vistas traseras de la fuente
son aproximados. No se promete una espalda completa que la hoja no dibuja.

## Validación

`CHROMIUM_PATH=/path/to/chrome node tests/mega-blaziken-browser.cjs`

Prueba la página real en 1100 × 720 y 844 × 390 con controles táctiles:
carga/decodificación del atlas, poses no vacías en ocho filas, cambios reales
de cuadros, movimiento, ataque automático contra un enemigo, límites de
Impulso, reacción al daño, resumen de salida, ausencia de escrituras y de
llamadas al ranking, y una partida posterior con Mega Swampert/Terratemblor Nv. 2.

Además pasan 43 regresiones de regalos, publicación principal, controles iOS,
interfaz móvil y animaciones de Mao Mao, y las seis pruebas existentes de
Mega Swampert. Todos los scripts de `/dev/` pasan `node --check`.

La suite histórica completa tiene pruebas con mocks anteriores a `G.Mega`,
que fallan por `G.Mega.sanitize` ausente; se reprodujo ese fallo también sobre
el `main` anterior a este cambio. No se modifican esos sistemas de producción.

## Suplemento V2 — brazos y espalda

La hoja `167351.png` aportada por el usuario añade lanzamiento con brazos y
caminado de espalda. El original RGB tenía el cuadriculado dibujado; se usó
la herramienta integrada de imágenes para extraer el fondo, y se empaquetó
el resultado con `tools/prepare_blaziken_extra.py` (Pillow, NumPy, SciPy).
El prompt de extracción solicitó conservar diseños/poses/disposición y
convertir únicamente el fondo gris en alfa transparente. El resultado de
la herramienta es una imagen derivada, no una copia píxel por píxel del RGB.

El atlas adicional `mega-blaziken-extra.webp` contiene ocho filas de lanzamiento
y una fila de cuatro poses de caminar de espalda. Mantiene el mismo punto de
apoyo y escala que el atlas anterior. Los lanzamientos izquierdos se reflejan
para que las manos apunten hacia la izquierda. Las vistas diagonales y los
lanzamientos verticales todavía son aproximados.

Shoot usa guardia/preparación/extensión de brazos/recuperación; Charge usa
guardia/preparación. Se excluye la bola de fuego viajera que venía dibujada en
el fotograma: los proyectiles y su tipo los sigue dibujando el combate del juego.
Caminar hacia arriba usa la nueva fila de espalda; reposo y patadas conservan
el atlas previo. Si el suplemento no carga, se conserva la animación anterior.

La prueba empieza con Golpe Kárate Nv. 2 seleccionado y Ascuas en el hueco 2.
El test de navegador comprueba daño automático de ambos ataques, que Shoot
usa el atlas adicional y que caminar hacia arriba usa la fila de espalda.
Estos cambios se publican en `/dev/`; Mega Blaziken sigue pendiente de pasar
a la versión oficial.

## Impulso V3 — velocidad de ataque al final

Además del movimiento (+5% por escalón, hasta +25%), Impulso concede +6% de
velocidad de ataque cada 30 segundos activos, hasta +30% a los 150 segundos.

`Player.cooldownFor()` calcula primero la recarga normal con todas las mejoras
en `cdMul` y su mínimo habitual; después divide el intervalo por el factor de
Impulso, de 1 a 1.30. Por tanto, 2000 ataques/unidad de tiempo pasan a 2600:
no se suma 30% a las cartas ni se resta 30% a la recarga. Las diez cartas y las
compras permanentes conservan sus modificadores y sus límites independientes.
Al aplicarse al final también del mínimo normal de 0.05 s, ese intervalo puede
quedar en 0.05/1.30 s para Mega Blaziken. La ejecución sigue ligada a los frames.

El combate, la animación y la barra de recarga usan el mismo cálculo. Los
orbes mantienen su movimiento y reciben el factor final en el intervalo entre
impactos repetidos. El resto de Pokémon, incluido Mega Swampert, conserva
factor 1 y sus intervalos anteriores. Las acumulaciones empiezan de cero en
cada partida; el reloj sólo avanza mientras el jugador se actualiza en juego.

Se usa una copia de HUD bajo `/dev/` para mostrar la recarga real; los archivos
de la versión oficial no cambian. Se conservan el proyectil centrado y las
modificaciones recientes de Repertorio de `main`.

El test de navegador aplica las diez cartas reales con Reflejos permanente
al máximo, comprueba ambos órdenes de aplicación, modificadores posteriores,
el programador real de ataques, el mínimo de recarga y Pokémon sin Impulso.
