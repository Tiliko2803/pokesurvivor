# Boss Rush attack art

## Rayquaza attack atlas

`rayquaza-attacks-v1.png` is a transparent 256×320 PNG: four columns and five rows of 64×64 cells, four animation frames per effect. Rows: Dragon Ascent, Extreme Speed, Dragon Pulse, Hurricane, Draco Meteor. Dragon Pulse is drawn as one continuous beam using a central 64×24 strip. Meteor and dive descent frames play before impact; explosion frames begin when damage activates. The runtime disables smoothing and uses the shared low-resolution effects canvas.

Integrated on 2026-10-18. Created with the built-in Image Generation tool; generated source 1122×1402 RGBA, compiled with nearest-neighbor sampling to the uniform atlas, preserving alpha. Consumed by `dev/rayquaza-fx.js`. The PNG only supplies cosmetic art; collision geometry is computed independently.

### Rayquaza generation prompt

undefined

## Continuous Kyogre beams

`kyogre-beams-v1.png` is a transparent 512×64 PNG: four columns and two rows, with 128×32 cells. Row 1: Hydro Pump; row 2: Ice Beam. Four animation frames per beam. The renderer samples the inner 126×28 content rectangle and draws it once from the casting origin to the corridor endpoint. Each beam has one continuous core and a single tip. It is never repeated as a row of projectiles. Surf uses the original atlas; its collision rectangle is no longer painted during impact.

Created with the built-in Image Generation tool on 2026-10-17. The source was 1774×887 RGBA (4×2 cells). Each cell was trimmed to its nonempty content and packed with nearest-neighbor sampling and alpha preserved, adding 1px horizontal and 2px vertical padding. The source image remains available through the generated-image conversation output.

### Beam generation prompt

Use case: stylized-concept. Asset type: production transparent pixel-art BEAM animation atlas for a top-down Nintendo DS style monster action game. ONE PNG 1536x768 pixels, exact 4 columns by 2 rows of 384x384 cells. NO text, labels, grid, characters, backgrounds, logos or terrain. In each cell draw ONE SINGLE LONG CONTINUOUS HORIZONTAL ENERGY STREAM from LEFT to RIGHT, centered at y=192 within its cell. It spans x=32 to352 and has a CONSTANT 50-pixel thickness along its central 260 pixels. It must read as one sustained laser-like jet, NOT bullets, NOT multiple little attacks, NOT a chain of disconnected ice chunks, NOT a comet tapering to a needle. Keep 28 transparent pixels of empty margin at every side; all art strictly inside its own cell. Columns are four consecutive frames of the same beam: stable silhouette, moving fluid streaks/small edge details, no changes of direction, size or origin. Row 1 is HYDRO PUMP: a powerful uninterrupted dark/cobalt blue water stream with a bright cyan and white continuous core, blocky white foam on its outer edges and a single short frothy splash at its right end. Row 2 is ICE BEAM: an uninterrupted solid white/cyan energy core of equal constant thickness, sapphire blue pixel outline, short angular frost glints on outer edges, one crystalline flare at its right end; do not divide it into ice projectiles. TRUE crisp 16-bit pixel art, hard squared clusters, limited 8-12 colors per beam, as if designed at 96x96 per cell then nearest-neighbor enlarged 4x, absolutely no blur, gradients, smooth glows, antialiasing, vector linework or photorealism. High contrast, clean game-ready silhouettes. All eight complete beams isolated on real alpha transparency.

## Original attack atlas

`attack-atlas-v1.png` is a transparent 256×512 PNG, four columns and eight rows of 64×64 cells. Frames run left to right: emergence, buildup, impact, fade. Rows: volcanic spike, ground shockwave, lava geyser, rushing burst, Surf wave, water jet, ice burst, water column.

Created with the built-in Image Generation tool on 2026-10-17 for PokéSurvivor. The generated source was 887×1774 RGBA, preserving the 1:2 atlas ratio. It was compiled to 256×512 with nearest-neighbor sampling for runtime pixel art; no background was added and alpha was preserved. Rendering clips each frame to its cell and disables smoothing. This art is cosmetic; warnings and collision geometry remain authoritative.

The runtime loads this file through `dev/boss-rush-sprites.js`. Sprite effects are bounded by quality settings and drawn on a shared low-resolution effects canvas. `dev/groudon-fx.js` retains its existing terrain detail and danger tells underneath the sprite effects.

## Generation prompt

Use case: stylized-concept. Asset type: production pixel-art animated attack sprite atlas for a 2D top-down Pokemon Mystery Dungeon style action game. Create ONE transparent PNG sprite sheet exactly 1024 pixels wide by 2048 pixels tall, 4 columns by 8 rows, every cell 256x256. No visible grid, no text, no labels, no characters, no terrain, no baked backgrounds. Genuine crisp 16-bit Nintendo DS pixel art, designed at 64x64 pixels per frame then nearest-neighbor enlarged 4x. Hard stair-step pixel edges and clusters, limited palettes, NO smooth gradients, blur, vector style or photorealism. Each cell contains only ONE isolated effect with transparent empty padding at least 24 pixels at every side, identical center/baseline in all four cells of each row, no effect can cross a cell boundary. Columns show FOUR CLEARLY DIFFERENT consecutive animation stages: emergence, buildup, strongest impact, fading fragments. All frames stay on the exact evenly spaced grid. Rows from top to bottom: 1 a jagged dark volcanic rock spike rising with orange glowing cracks and small debris, grounded at cell bottom center; 2 a golden-brown ground shockwave ring with chunks of stone seen from slightly above; 3 a tall vivid red-orange lava geyser with a bright yellow core and basalt flecks, grounded at cell bottom center; 4 a white silver comet impact/slashing speed burst for a rushing body, oriented horizontally to the right; 5 a curling cyan ocean wave crest with dark-blue base and chunky white foam, facing right, viewed slightly above; 6 a bright blue narrow high-pressure water jet burst to the right, crystalline white highlights and flying droplets; 7 a sharp cyan-white ice beam impact with angular blue ice shards, diamond frost and glints; 8 a powerful turquoise water column emerging upward with a large foamy base and cobalt swirls, for Origin Pulse. Make each row visually distinct and beautiful with strong silhouettes and readable small-scale animation. Preserve REAL alpha transparency.
