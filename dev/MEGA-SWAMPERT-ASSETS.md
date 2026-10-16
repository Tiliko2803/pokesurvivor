# Mega Swampert — sprites animados y procedencia

La versión de prueba utiliza **sprites de Mega Swampert animados**, y no
imágenes estáticas ni recolores de Swampert normal.

Fuente: [PokeAPI/sprites](https://github.com/PokeAPI/sprites);
archivos originarios de las animaciones de Pokémon Showdown,
específicamente la forma Mega Swampert (número interno 10064):

- `sprites/pokemon/other/showdown/10064.gif` — frontal, 79 cuadros.
- `sprites/pokemon/other/showdown/back/10064.gif` — trasera, 79 cuadros.
- `sprites/pokemon/other/showdown/shiny/10064.gif` — frontal shiny, 79 cuadros.
- `sprites/pokemon/other/showdown/back/shiny/10064.gif` — trasera shiny, 79 cuadros.

El programa descomprime los GIF localmente a 79 cuadros de Canvas
por vista, después los reproduce durante las partidas. Las animaciones
de caminar, atacar, proyectar, cargar, recibir daño y caer añaden
desplazamientos a los cuadros reales, para distinguir las acciones.

**Límite artístico:** SpriteCollab no tiene un spritesheet PMD
específico para la Mega en `sprite/0260/0001/`. Las vistas laterales
y diagonales se aproximan a partir de vistas frontal y trasera,
por lo tanto todavía no existen ocho direcciones distintas dibujadas.

Los personajes Pokémon y sus imágenes pertenecen a sus titulares.
Uso como fan game no comercial con indicación de procedencia.

Los sprites normales de Swampert y el juego principal permanecen intactos.

## Hoja 1 aprobada — integración /dev/

El usuario aprobó el atlas propio con las siete animaciones Idle, Walk, Attack,
Shoot, Charge, Hurt y Faint, ocho direcciones por animación. Se acepta el
pequeño defecto visual de Attack C9. El nuevo reproductor está en
`dev/js/systems/mega-sheet.js` y espera `dev/assets/pokemon/260/mega/hoja1-atlas.webp`.

Dimensiones requeridas: 480 × 6720 píxeles, bandas verticales en el orden
Idle/Walk/Attack/Shoot/Charge/Hurt/Faint, cada banda de 960 píxeles,
filas Down, DownRight, Right, UpRight, Up, UpLeft, Left, DownLeft;
celdas de 120 × 120 y cuadros 3/4/3/3/3/2/3 respectivamente.

**El atlas binario tiene que cargarse por separado:** si falta, el juego de
prueba mantiene los GIF de respaldo. El juego público no usa este reproductor.
