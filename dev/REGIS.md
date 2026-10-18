# Los Tres Guardianes · Hoenn Normal

Regirock, Regice y Registeel entran juntos antes de Groudon. Sustituyen los dos menores iniciales. Son tres enemigos reales, con selección de objetivo, daño y vida independientes; derrotar a uno no derrota al grupo ni cambia la vida de los demás.

## Balance de entrada

- 44000 PV por Regi y jugador inicial: 132000 PV totales en solitario.
- Punto de partida: 55% de los 80000 PV de la variante individual estudiada con Deoxys, y 70% del daño base de 30 (21). Los movimientos concretos usan 18–24 de daño antes de tipos y defensa.
- La vida permanece fija durante todo el intento. No se adapta al DPS ni impone un tiempo mínimo. El equipo inicial multiplica una sola vez los PV de cada Regi; bajas posteriores no los reducen. La entrada cooperativa al Boss Rush sigue pendiente.
- Siete cartas legales, nivel 8. El grupo completo entrega experiencia de dos niveles base, con bonos nativos; no entrega XP por cada baja. El 20% de curación se aplica una vez al vencer a los tres. No dan Vínculo.
- Groudon conserva 400000 PV y sigue después del grupo. Los menores posteriores no repiten a los Regis.

## Roles y movimientos

| Regi | Movimientos | Función |
| --- | --- | --- |
| Regirock | Tumba Rocas, Avalancha | Círculos anunciados y hasta tres rocas sólidas temporales. |
| Regice | Rayo Hielo, Viento Hielo | Haz fijo continuo y abanico de proyectiles; ralentiza durante 0.65 s sólo si causa daño real. |
| Registeel | Foco Resplandor, Garra Metal | Ráfaga de acero y ataque cercano anunciado. |

Se usan nombres de movimientos Pokémon; áreas, proyectiles y tiempos son adaptaciones del Boss Rush. Las marcas capturan la posición al anunciarse. Los rayos no siguen al jugador durante el aviso. Las rocas duran cinco segundos, se limitan a tres y desaparecen al caer Regirock; bloquean el movimiento mediante colisión circular. Los ataques de proyectiles dañan sólo donde está el proyectil visible, no en todo el corredor de aviso.

## Desincronización

La revisión del código encontró `Enemy.bossMove()` con un único `ai.cd`, no un sistema de relojes independientes. El encuentro nuevo implementa esos relojes en `dev/regis.js`, sin cambiar la IA del modo normal ni los patrones actuales de los mayores.

Cada una de las seis entradas de `G.Regis.MOVES` tiene su propio enfriamiento, desfase inicial, próximo instante y contador. Desfases: 1.0/4.8 s para Regirock, 1.9/5.7 s para Regice y 2.8/6.6 s para Registeel. Enfriamientos: 8.4/7.2, 7.8/6.6 y 6.9/8.1 s. Al bajar un Regi a la mitad, sus próximos enfriamientos se multiplican por 0.85; las señales que ya existen no se acortan.

- Máximo dos movimientos simultáneos entre los tres y uno por Regi.
- Al menos 0.7 s entre anuncios nuevos y 0.65 s entre impactos programados.
- Se comprueba una salida por jugador con radio real, obstáculos, 0.25 s de reacción y velocidad de referencia máxima de 130, reducida si el jugador está ralentizado.
- Si la combinación no deja una salida, se pospone. Un aviso individual se amplía si un jugador lento lo necesita. Los reintentos se limitan a uno cada 0.25 s por movimiento para reducir trabajo por fotograma.
- Los impactos comparten 0.9 s de protección por jugador. Si coinciden, se aplica el mayor daño base una sola vez.
- Caer un Regi cancela sus ataques pendientes; los otros siguen. La victoria completa elimina todo. Pausa, preparación y menús detienen relojes y animaciones.
- Una rotación que reduce mucho un eje retira avisos y rocas, recoloca a todos los actores y deja protección temporal; los nuevos desfases no disparan una ráfaga acumulada.

## Barras y efectos

`dev/boss-rush-bars.js` mantiene tres barras independientes dentro del mismo ancho total de una barra de jefe: tercios al entrar, mitades con dos supervivientes y ancho completo para el último. Cada barra muestra su propio nombre y PV. Al caer un Regi, tiembla, se deforma y desvanece durante 0.85 s; después las restantes se recolocan con interpolación. Todo usa el reloj de combate, no el del navegador.

`dev/regis-fx.js` reutiliza el atlas de hielo existente para el haz continuo y dibuja rocas, proyectiles de acero y garras como píxeles definidos. No crea recursos gráficos externos ni consume azar del combate. Se verificaron cinco renders nativos de Canvas, incluidos roca sólida, rayo, muerte de una barra, redistribución y vista vertical. No equivalen a una partida en Android.

## Referencias y límites

`node tools/benchmark-regis.cjs` ejecuta el combate ofensivo nativo completo. Siete cartas, tipos, críticos, animaciones y hitboxes reales; 85% del tiempo lanzando ataques, daño recibido ignorado y posición controlada a distancia 100 del objetivo vivo. Deoxys se incorpora sólo al invitado del banco de prueba, no a una cuenta real.

Con semilla 123: Deoxys normal con Psicocarga y Danza Espada, oro máximo, 85.23 s; Mega Blaziken con Onda Certera y Danza Espada, oro máximo, 32.12 s. Las pruebas comprueban tres semillas, 60–120 s para esa build de Deoxys y la ventaja de Mega Blaziken. Otras builds y una partida humana pueden dar otros tiempos.

Las pruebas puras verifican los seis movimientos, independencia de relojes, límites y desfases, salidas en esquinas y en vertical con radios 12/30/40 y velocidades 130/65, señales fijas, obstáculos, ralentización, protección de impactos, bajas y redistribución. La integración verifica tres enemigos, daño y PV separados, ausencia de recompensas parciales, XP y curación únicas, pausa, rotación, escalado por equipo y conservación de cuenta.

Primigenio permanece reservado: cinco Regis o invocación de Regigigas al 50% de la suma de vida de los tres, además de Mega Latias/Latios. Esta entrega implementa sólo el encuentro inicial de Hoenn Normal.
