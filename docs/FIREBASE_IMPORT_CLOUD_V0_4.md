# Importación Firebase Tiliko V0.4

Página de pruebas: https://pokesurvivor-tiliko-import-test.pages.dev/

Solo iniciar sesión con la cuenta ya existente del proyecto `pokesurvivor-tiliko`. Deben existir `saves/{uid}` y `migrationGrants/{uid}` con `approved=true` y `expiresAt` futuro. En Ajustes → Cuenta, descargar una copia, elegir Importar respaldo JSON y confirmar el resumen. La cuenta original no se modifica. Después verificar `save.migrationImported=true` en Firestore y borrar el grant.

Para cuentas Google, autorizar primero el dominio `pokesurvivor-tiliko-import-test.pages.dev` en Firebase Authentication → Configuración → Dominios autorizados.

La configuración de Firebase de esta rama está habilitada exclusivamente desde ese dominio por HTTPS. No fusionar con ramas estables; sin otras modificaciones a producción.
