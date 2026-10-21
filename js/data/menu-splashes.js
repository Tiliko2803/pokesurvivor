/* Frases del menú de Tiliko: cosméticas y estables durante cada visita.
 * Se evita repetir la última cuando el navegador permite guardar la preferencia.
 */
G.MenuSplashes = (() => {
  const PHRASES = [
  [
    "Arceus viene. Tú sabrás.",
    "Arceus is coming. Your move."
  ],
  [
    "Tu build era buena… hace cinco minutos.",
    "Your build was great… five minutes ago."
  ],
  [
    "Una partidita y me duermo.",
    "One quick run, then bed."
  ],
  [
    "El joystick no tuvo la culpa.",
    "The joystick was innocent."
  ],
  [
    "El verdadero legendario es tu internet.",
    "Your internet is the real Legendary."
  ],
  [
    "Recomendado por 3 de cada 3 curanderos.",
    "Recommended by 3 out of 3 healers."
  ],
  [
    "Los curanderos tienen sindicato.",
    "The healers have a union."
  ],
  [
    "Arceus no firmó el balance.",
    "Arceus never approved the balance."
  ],
  [
    "Excadrill cree en ti. No le falles.",
    "Excadrill believes in you. Make it count."
  ],
  [
    "Tu favorito también merece una oportunidad.",
    "Your favorite deserves a chance too."
  ],
  [
    "Si pierdes, claramente era lag.",
    "If you lose, it was clearly lag."
  ],
  [
    "El balance salió por Poké Balls.",
    "Balance went out for Poké Balls."
  ],
  [
    "Otro duplicado. Qué inesperado.",
    "Another duplicate. What a surprise."
  ],
  [
    "Hecho con cariño y cambios en main.",
    "Made with love and commits to main."
  ],
  [
    "Tiliko dijo: «Una mejora más».",
    "Tiliko said: “Just one more upgrade.”"
  ],
  [
    "La masa madre sobrevivió más que tú.",
    "The sourdough starter outlived you."
  ],
  [
    "Hoy se hornean récords.",
    "Freshly baked records today."
  ],
  [
    "Gepetto programa. Tiliko pone el horno.",
    "Gepetto codes. Tiliko heats the oven."
  ],
  [
    "No era una retirada. Era kiteo.",
    "It was not retreating. It was kiting."
  ],
  [
    "Tres curanderos. Cero remordimientos.",
    "Three healers. Zero regrets."
  ],
  [
    "El jefe también quiere tu experiencia.",
    "The boss wants your XP too."
  ],
  [
    "La evolución no incluye terapia.",
    "Evolution does not include therapy."
  ],
  [
    "Danza Espada no arregla el Wi-Fi.",
    "Swords Dance cannot fix your Wi-Fi."
  ],
  [
    "Más proyectiles, más responsabilidades.",
    "More projectiles, more responsibilities."
  ],
  [
    "Tu última partida tenía segunda fase.",
    "Your last run had a second phase."
  ],
  [
    "Megaevoluciona. El problema también lo hará.",
    "Mega Evolve. The problem will too."
  ],
  [
    "Pausa para respirar. Arceus no respira.",
    "Pause for a breath. Arceus does not."
  ],
  [
    "El shiny no esquiva por ti.",
    "Being shiny will not dodge for you."
  ],
  [
    "La horda pidió mesa para sesenta.",
    "The horde booked a table for sixty."
  ],
  [
    "No hay pan para tanto curandero.",
    "Not enough bread for all these healers."
  ],
  [
    "Un crítico al día no garantiza la alegría.",
    "A crit a day will not keep Arceus away."
  ],
  [
    "El horno está listo. Tu build, veremos.",
    "The oven is ready. Your build? We will see."
  ]
];
  const KEY = 'ps.menuSplash.last';
  let chosen = null;
  function text() {
    if (chosen === null) {
      let previous = -1;
      try { const value = localStorage.getItem(KEY); if (value !== null && /^\d+$/.test(value)) previous = Number(value); } catch (_) { /* Sin almacenamiento: sigue funcionando. */ }
      const options = PHRASES.map((_, i) => i).filter(i => i !== previous);
      chosen = options[Math.floor(Math.random() * options.length)];
      try { localStorage.setItem(KEY, String(chosen)); } catch (_) { /* Preferencia opcional. */ }
    }
    return PHRASES[chosen][G.I18n.lang === 'en' ? 1 : 0];
  }
  return { text, count: PHRASES.length };
})();
