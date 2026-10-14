# Firebase Tiliko — plan de activación de migraciones V0.3

**Rama:** test/firebase-migration-security-v0.3 (derivada de test/migration-map-v0.2).
**Estado:** NO desplegada a Firebase real. La versión de pruebas Cloudflare desactiva Firebase.

## Propósito

Trasladar una vez el progreso de una cuenta propia del PokéSurvivor original a la cuenta **Firebase Tiliko** elegida, conservando la protección normal de Firestore y rankings. El archivo local del original es un JSON sin firma: NO acredita por sí mismo el origen o propietario. Se precisa autorización expresa del administrador para el UID receptor.

## Proyecto correcto

- Destino: **pokesurvivor-tiliko** (confirmar el project ID en la consola autenticada).
- NUNCA actuar sobre **pokesurvivor-free** del proyecto original.
- Rama pública y jugable: NO desplegar ni fusionar sin pruebas y aprobación.
- El fichero .firebaserc de esta rama señala a pokesurvivor-tiliko, pero todos los comandos deben pasar de forma explícita el parámetro --project.
- Ningún archivo JSON del usuario debe subirse al repositorio, GitHub Issues, Workers ni servicios públicos.

## Validaciones previas

1. Ejecutar el emulador con el workflow .github/workflows/firebase-migration-emulator.yml, exclusivamente con el proyecto **demo-tiliko-migration**. Exige los nueve casos de pruebas tests/firebase/firestore-migration.emulator.cjs.
2. Verificar las 33 pruebas de regresión Node anteriores y que Cloudflare Pages sigue sin Firebase.
3. Leer reglas actuales en Firebase Tiliko y guardar copia del texto + fecha. Si las reglas actuales han cambiado respecto a nuestra rama, **reconciliar y probar esas diferencias antes** de publicar, NO sobrescribir ciegamente.
4. Verificar que las otras colecciones de amistad, autenticación, presencia y rankings mantienen sus permisos intactos.
5. Identificar de forma inequívoca el UID de la cuenta receptora en Firebase Authentication. Confirmar con el titular que es la cuenta correcta y que ha exportado **su propio** progreso.
6. Verificar existencia de saves/{uid} y que la sincronización funciona, además de registrar si actualmente tiene marca sus (NO eliminarla en la migración).

## Cambios del código

- firestore.rules incluye migrationGrants/{uid} solo-lectura para ese usuario y acceso administrado mediante Firebase Console/Admin SDK. No permite a usuarios conceder permisos.
- authorizedMigration(uid) sólo permite un cambio entre migrationImported=false y true mientras el grant sigue vigente y validando saneSave.
- El sello migrationImported es IRREVERSIBLE: toda actualización (normal o migración) debe mantenerlo después de activarse. Una partida nueva no puede nacer con el sello utilizado.
- db.js fusiona progreso del destino con la partida entrante bajo una sola transacción de Firestore, conservando nombre y fecha original de registro del destino y nunca eliminando una marca sus ya existente. La interfaz exige confirmación.
- Cualquier fallo no confirma una escritura de Cloud y mantiene la copia actual.
- Una autorización temporal NO asegura que el JSON sea legítimo. El administrador revisa el origen y autoriza explícitamente por UID, no de manera general.

## Procedimiento DESPUÉS de aprobar validaciones y tener conexión autorizada

1. Publicar SÓLO firestore.rules en Firebase proyecto **pokesurvivor-tiliko**. Confirmar que no cambia realtime database, Cloud Functions ni Firebase Auth.
2. Crear mediante consola/SDK administrativo migrationGrants/{uid} con:
   - approved: true (boolean)
   - expiresAt: timestamp Firestore a corto plazo, por ejemplo 24 horas desde la creación
3. Publicar de forma separada la interfaz de importación en el fork Tiliko con configuración Firebase correcta, después de pruebas en un staging conectado a un Firebase staging (nunca usar el proyecto original para las pruebas).
4. El titular inicia sesión en la cuenta destino, descarga su copia de seguridad desde Ajustes > Cuenta y selecciona su JSON exportado del original. Revisar vista previa, confirmar.
5. Revisar el documento saves/{uid}; debe incluir migrationImported:true, progreso fusionado y no aparecer una marca nueva sus.
6. Comprobar sincronización tras cerrar y reabrir la sesión en el teléfono.
7. Eliminar migrationGrants/{uid} cuando termine (aunque el sello impide reutilizarlo).

## Riesgos y límites

- El JSON puede superar el límite de tamaño de documento de Firestore; la transacción fallará sin confirmar si lo supera.
- Requiere acceso administrativo real a Firebase Tiliko. GitHub y Cloudflare NO permiten editar por sí solos las reglas de Firestore ni los grant de Firebase.
- **No usar cuentas invitadas** como destino; solo cuentas registradas.
- La prueba simulada con mocks NO sustituye a las pruebas del emulador. Hasta confirmar el workflow y la conexión Firebase, NO afirmar que el esquema se ha desplegado.
