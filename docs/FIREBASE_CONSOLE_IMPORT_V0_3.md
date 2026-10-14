# Activación guiada de migración desde Firebase Console

**Estado:** reglas propuestas todavía NO publicadas en Firebase. Sitio Cloudflare de pruebas mantiene Firebase desactivado.

Proyecto correcto: `pokesurvivor-tiliko`. No usar `pokesurvivor-free` (original).

## Antes de cambiar reglas

- Copiar y guardar el texto actual de **Firestore Database → Reglas**.
- Comparar con `firestore.rules` de la rama actual. No modificar reglas de amigos ni ranking.
- Ejecutar las pruebas de Firestore Emulator (proyecto DEMO solamente); aprobar únicamente si todas pasan.
- Tener un respaldo del archivo original exportado `pokesurvivor-respaldo-*.json`.

## Copiar reglas desde Android

Usar la página de copiado en Cloudflare Pages de pruebas: https://pokesurvivor-tiliko-reglas-test.pages.dev/tools/migration/firebase-console.html . El botón lee `/firestore.rules` desde ese mismo despliegue y permite copiar el archivo completo con un toque. Se debe esperar a que el despliegue de pruebas termine exitosamente antes de usarlo.

## Reglas propuestas

Rama: `test/firebase-migration-security-v0.3`; archivo `firestore.rules`.

1. Abrir **Firestore Database → Reglas** del proyecto `pokesurvivor-tiliko`.
2. Reemplazar el código completo por el archivo de la rama, solo cuando se hayan validado los tests.
3. Revisar que arriba figure **pokesurvivor-tiliko** y pulsar **Publicar**.

## Autorizar UNA cuenta

Solo después de que el titular haya creado y sincronizado **saves/{uid}** en el Firebase de Tiliko:

1. En **Authentication → Usuarios** identificar su `UID`. No compartirlo públicamente.
2. En **Firestore Database → Datos**, crear colección `migrationGrants`, documento ID exactamente igual a `UID`.
3. Crear campo `approved`: **boolean** `true`.
4. Crear campo `expiresAt`: **timestamp** futuro (por ejemplo, 24 horas después).
5. Guardar. Un JSON sin firma no demuestra autenticidad: autorizar solo a cuentas propias verificadas.
6. El juego de importación conectada **debe usar config de Firebase Tiliko** y permiso del titular. El HTML de test con Firebase desactivado NO permite esta operación. No reutilizar el Firebase original.
7. Iniciar sesión en el juego de migración con cuenta Tiliko, ir a **Ajustes → Cuenta → Importar respaldo JSON** y elegir la copia descargada. Confirmar resumen.
8. Comprobar la colección, los tickets, las mejoras y la marca `migrationImported: true` dentro de `saves/{uid}.save`.
9. Eliminar `migrationGrants/{uid}` tras confirmar éxito. Cuando existe un grant, las reglas impiden recrear una partida borrada (evita migrar varias veces con el mismo permiso).

### Atención

- Las nuevas reglas NO autorizan libremente a usuarios a importar JSON a Firebase.
- La excepción de importación solo acepta cuentas específicamente aprobadas y conserva el sello de una sola vez.
- Las reglas de amigos y rankings no se modifican; la marca `sus` nunca se borra por importar.
- La compilación de Cloudflare local con Firebase desactivado NO activa migraciones a nube.
- No editar los datos directamente a mano en Firestore Console.
- Si el editor informa errores de compilación o los tests del emulador fallan, **NO publicar**.
