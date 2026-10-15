/* PokéSurvivor Tiliko: códigos promocionales públicos de cinco caracteres.
 * Reutilizables entre jugadores: cada cuenta recibe el premio sólo una vez.
 * IMPORTANTE: el navegador no es la autoridad. En nube las reglas de Firebase
 * deben validar el canje y proteger el Pokémon 10001 frente a escrituras normales.
 * La rama de pruebas permanece sin Firebase hasta activar las reglas expresamente.
 */
G.GiftCodes = (() => {
  'use strict';
  const MAOMAO_CODE = 'MAO25';
  const MAOMAO_DEX = 10001;
  const COINS_CODE = '20KPS';
  const COINS_AMOUNT = 20000;
  const normalize = value => String(value || '').trim().toUpperCase();
  const validFormat = code => /^[A-Z0-9]{5}$/.test(code);
  const isMaomao = code => validFormat(code) && code === MAOMAO_CODE;
  const isCoins = code => validFormat(code) && code === COINS_CODE;
  return { MAOMAO_CODE, MAOMAO_DEX, COINS_CODE, COINS_AMOUNT, normalize, validFormat, isMaomao, isCoins };
})();
