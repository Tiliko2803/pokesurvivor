# PokéSurvivor Tiliko — GitHub Pages

**Enlace:** https://tiliko2803.github.io/pokesurvivor/

El juego vive en el proyecto GitHub Pages del fork `Tiliko2803/pokesurvivor`, bajo el subdirectorio **/pokesurvivor/**. El dominio `tiliko2803.github.io` es el host (necesario como dominio autorizado en Firebase Authentication).

## Publicación

1. Entra en https://github.com/Tiliko2803/pokesurvivor/settings/pages
2. En **Build and deployment**, selecciona **Deploy from a branch**.
3. Usa la rama **main** y la carpeta **/(root)**, pulsa **Save**.
4. Si aparece un dominio personalizado heredado (`pokesurvivor.com`), **no lo utilices**: es del repositorio de origen. El archivo `CNAME` heredado fue retirado del fork.
5. Espera la publicación y abre https://tiliko2803.github.io/pokesurvivor/ (no el dominio sin ruta, que puede mostrar otro sitio o un 404).

## Progreso y Google

Firebase **pokesurvivor-tiliko** se utiliza SOLO para:
- `https://tiliko2803.github.io/pokesurvivor/`
- `https://pokesurvivor-tiliko.pages.dev/`
- `https://pokesurvivor-tiliko-maomao-cloud-test.pages.dev/`

Las demás rutas de github.io y sitios ajenos no se conectan. Asegúrate de que **tiliko2803.github.io** aparece en [Firebase Authentication → Configuración → Dominios autorizados](https://console.firebase.google.com/project/pokesurvivor-tiliko/authentication/settings).

No se toca `pokesurvivor-free` ni el repositorio original. El mismo inicio de sesión Google abre la partida Tiliko guardada en Firebase. **El código MAO25 requiere reglas Firestore en producción**: el archivo `firestore.rules` ya incorpora su validación, pero esas reglas no se publican automáticamente en Firebase y no deben copiarse sin respaldo/revisión.

## Versión y caché

Al sincronizar `main` con `fix/friend-lookup`, la página carga inicialmente los 74 módulos actuales como respaldo. El workflow existente `.github/workflows/build-friend-test.yml` genera automáticamente un **bundle compilado y ofuscado** (`js/app.min.js`), el `index.html` correcto y `version.json`, y los publica mediante GitHub Pages. Por eso el resultado final es rápido y no expone el objeto global del juego. El archivo fuente `dev.html` contiene la URL canónica GitHub.io; los futuros builds no deben introducir el dominio del repositorio original. La caché del Service Worker usa una versión nueva para evitar que un Android conserve archivos anteriores.

Mao Mao: **Veneno/Planta, Picotazo Veneno, ataque 1.52 (igual a Kyogre)**, animaciones V0.3 y código `MAO25`.

La rama `backup/main-before-github-pages-v0.5` conserva una copia del estado anterior de `main`.
