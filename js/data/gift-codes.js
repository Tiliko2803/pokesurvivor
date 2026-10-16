/* PokéSurvivor Tiliko: códigos promocionales públicos de cinco caracteres.
 * Reutilizables entre jugadores: cada cuenta recibe el premio sólo una vez.
 * IMPORTANTE: el navegador no es la autoridad. En nube las reglas de Firebase
 * deben validar cada premio y proteger sus marcas frente a escrituras normales.
 * Las reglas deben publicarse por separado desde Firebase Console o CLI.
 */
G.GiftCodes = (() => {
  'use strict';
  const MAOMAO_CODE = 'MAO25';
  const MAOMAO_DEX = 10001;
  const COINS_CODE = '20KPS';
  const COINS_AMOUNT = 20000;
  const BONUS_COINS_CODE = '500KP';
  const BONUS_COINS_AMOUNT = 500000;
  const TICKETS_CODE = '10X10';
  const TICKETS_AMOUNT = 10;  // 10 tickets que equivalen a 10 tiradas cada uno
  const normalize = value => String(value || '').trim().toUpperCase();
  const validFormat = code => /^[A-Z0-9]{5}$/.test(code);
  const isMaomao = code => validFormat(code) && code === MAOMAO_CODE;
  const isCoins = code => validFormat(code) && code === COINS_CODE;
  const isBonusCoins = code => validFormat(code) && code === BONUS_COINS_CODE;
  const isTickets = code => validFormat(code) && code === TICKETS_CODE;
  return { BONUS_COINS_CODE, BONUS_COINS_AMOUNT, isBonusCoins, MAOMAO_CODE, MAOMAO_DEX, COINS_CODE, COINS_AMOUNT, TICKETS_CODE, TICKETS_AMOUNT, normalize, validFormat, isMaomao, isCoins, isTickets };
})();
