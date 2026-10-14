/* Prueba de migración: acceso a Firebase Tiliko sólo en un único dominio.
 * En previews y en cualquier otro host se desactiva la nube.
 * Nunca cambiar la configuración de main, fix/friend-lookup o upstream.
 */
G.FIREBASE_CONFIG = (location.protocol === 'https:' &&
  location.hostname === 'pokesurvivor-tiliko-import-test.pages.dev')
  ? {
  apiKey: 'AIzaSyBO_-FdM_k9kUIWxqpUEQc03a9IKWbJaao',
  authDomain: 'pokesurvivor-tiliko.firebaseapp.com',
  projectId: 'pokesurvivor-tiliko',
  storageBucket: 'pokesurvivor-tiliko.firebasestorage.app',
  messagingSenderId: '66123917149',
  appId: '1:66123917149:web:43aeada37f7ce9a3e36ab4',
  databaseURL: 'https://pokesurvivor-tiliko-default-rtdb.europe-west1.firebasedatabase.app'
}
  : null;
