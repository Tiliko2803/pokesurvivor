# Modelo de transformación aprobado

Aprobado por Tiliko el 18 de octubre de 2026. Implementación canónica:
`js/systems/mega-evolution.js`. La forma curva en S del símbolo, las aberturas
diagonales, los extremos triangulares y el degradado arcoíris son la versión
aprobada. Reutilizar este renderer en futuras transformaciones.

## Secuencia y estado actual

- 0–0,48 s: acercamiento y concentración de energía.
- 0,48–1,30 s: capullo facetado, símbolo y grietas.
- 1,30–2,40 s: ruptura, fragmentos, forma Mega y regreso de la cámara.
- Los efectos son procedurales; los sprites vienen de los atlas del juego.
- En solitario, las tres megas jugables activan la secuencia al empezar.
- `Game.update` detiene combate, reloj, proyectiles, mejoras y clima durante la
  secuencia. El reloj de desafíos tampoco avanza. Pausar detiene la animación.
- No se recalculan estadísticas, vida, mejoras ni movimientos. `Player.hurt`
  protege al protagonista mientras está dentro de la secuencia.
- Cada sujeto se presenta una sola vez por partida; al salir se cancela la
  animación y se limpia el estado. La red conserva su inicio actual: todavía no
  se utiliza una pausa cinematográfica local en cooperativo.
- Una caché fría puede esperar hasta 4 s bajo el capullo para cargar la forma.
  El tiempo de espera tiene límite para que un archivo fallido no bloquee la run.
- La opción de menos sacudidas/destellos reduce zoom, brillo y vibración visual.

## Reutilización para las formas primigenias

`G.MegaEvolution.begin(subject, options)` acepta una entidad con `dex`, `x`,
`y`, `dead` y `anim`. Devuelve `false` si ya hay una secuencia, el sujeto murió
o ya se transformó en esta partida. Para una entidad que no tenga `mega`, pasar
explícitamente el animador de destino mediante `after`.

| Opción | Uso |
| --- | --- |
| `before` | Animador de la forma normal; por defecto se crea el de su especie. |
| `after` | Animador de destino; por defecto usa el actual de la entidad. |
| `duration` | Duración nominal. Usar `3` para una futura transformación de jefe. |
| `label` | Nombre que se muestra al revelar la forma. |
| `kind` | `mega` para el símbolo aprobado, `primal-red` para orbe Ω rojo, `primal-blue` para orbe α azul. |
| `color` | Color del pulso de ruptura. |
| `onReveal(subject)` | Aplicar el cambio real al romperse el capullo; se ejecuta una vez. |
| `onComplete(subject)` | Reanudar la lógica propia del encuentro al terminar. |

Ejemplo de integración futura, cuando estén listos el modo primigenio y sus atlas:

```js
const started = G.MegaEvolution.begin(boss, {
  before: normalAnimator,
  after: primalAnimator,
  duration: 3,
  kind: 'primal-red', // Kyogre: 'primal-blue'; Rayquaza: 'mega'.
  color: '#ff705e',
  label: 'Groudon Primigenio',
  onReveal(subject) {
    subject.anim = primalAnimator;
    // Aplicar aquí la forma preparada por el encuentro, conservando su vida.
  }
});
if (started) {
  // Retirar telegráficos/impactos pendientes antes de reanudar el encuentro.
}
```

El disparador de 50% de vida pertenece al encuentro, no al renderer. Este modelo
guardado no activa ni publica formas primigenias ni modifica Hoenn Normal.
Las paletas del capullo y el texto de carga pueden ampliarse al integrar esas formas.

## Verificación y grabación

`tests/mega-evolution.test.cjs` cubre fases, invulnerabilidad, pausa, carga fría,
cancelación, repetición, conservación de estadísticas y preparación del Boss Rush.

`tools/record_mega_evolution.cjs` graba el renderer dentro del juego en escritorio
y móvil. `tools/render_mega_evolution.cjs` exporta el mismo módulo y los atlas
reales en un escenario neutro mediante Canvas cuando no hay navegador disponible.
Ambos son utilidades de desarrollo; no se cargan como scripts de producción.
