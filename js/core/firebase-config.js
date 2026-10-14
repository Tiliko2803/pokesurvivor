/* ENTORNO ÚNICO de migración de PokéSurvivor Tiliko.
 * Esta conexión funciona SOLO en el dominio de importación de Cloudflare.
 * En cualquier otro dominio se desactiva Firebase (modo local).
 * Las claves del SDK web Firebase son identificadores públicos, NO secretos.
 * No incorporar este archivo a main ni a fix/friend-lookup.
 */
G.FIREBASE_CONFIG = location.protocol === 'https:' &&
  location.hostname === 'pokesurvivor-tiliko-import-test.pages.dev'
  ? {
  apiKey: 'AIzaSyBO_-FdM_k9kUIWxqpUEQc03a9IKWbJaao',
  authDomain: 'pokesurvivor-tiliko.firebaseapp.com',
  projectId: 'pokesurvivor-tiliko',
  storageBucket: 'pokesurvivor-tiliko.firebasestorage.app',
  messagingSenderId: '66123917149',
  appId: '1:66123917149:web:43aeada37f7ce9a3e36ab4',
  databaseURL: 'https://pokesurvivor-tiliko-default-rtdb.europe-west1.firebasedatabase.app'
;
