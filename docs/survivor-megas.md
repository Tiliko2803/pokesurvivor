# Mega Excadrill and Mega Meganium — Survivor

These forms belong to Survivor. The TFT Mega roster and Iridium progression are unchanged.

Both use the existing permanent-stone mission: defeat three bosses in one clean normal solo run using the ordinary form. Equip or remove the stone in the partner menu. Their starting move is level 2; existing save sanitization and cross-device merging retain both stones and mission progress. The shared rainbow transformation cinematic waits for their atlas to load. Shiny artwork is not supplied for these forms.

## Mega Excadrill

Ground/Steel, base stats 110/165/100/65/65/103. Starts with Metal Claw. **Taladro Rompefilas**, a custom Survivor passive, fires after 1.5 seconds and every 4 seconds thereafter. A physical Ground ray follows the player's current aim, passes through all enemies along its 360-unit length and 52-unit width, and stops at walls. Base damage is `65 + level * 4`, with the player's physical attack, type matchups, weather and target defense applied. Healers and shielders take 50% extra damage; ordinary enemies are knocked back. It does not teleport the player, bypass shields, or alter enemy healing globally.

## Mega Meganium

Grass/Fairy, base stats 80/92/115/143/115/80. Starts with Solar Beam. Solar Beam and its evolved instance execute immediately as beams; their source move remains a charge move for ordinary Meganium and other Pokémon. **Jardín Solar**, a custom Survivor passive, triggers after 1.5 seconds and every 8 seconds thereafter. Four Grass special rays, spaced by 90 degrees from the player's aim, extend 300 units with width 34. Each has base damage `28 + level * 2`, respecting special attack, types, weather, special defense and walls. A pulse within radius 150 slows ordinary enemies by 35% and bosses by 15% for two seconds. Connecting at least one ray heals the owner by 4% max HP once per cycle.

Area upgrades scale both forms' ray dimensions and Meganium's pulse radius once. Passives are local-owner only, disabled while dead, frozen or remote, and driven by combat simulation time. Long suspended frames cannot bank multiple pulses. Damage uses normal enemy methods, including their cooperative replication. These custom passives do not replace scripted weather.

## Artwork and prompts

Generated with the built-in image-generation tool from visual references:

- [Official Mega Excadrill artwork](https://zukan.pokemon.co.jp/detail/0530-1).
- [Official Mega Meganium design and description](https://legends.pokemon.com/es-mx/story-world/pokemon/mega-meganium).

Final assets: `assets/pokemon/530/mega/poses.webp` and `assets/pokemon/154/mega/poses.webp`. Each folder also retains the source sheet and `atlas.json`. Run `python tools/prepare_survivor_megas.py excadrill.png meganium.png` to repack the supplied sheets. All atlases are 880×880 with 176×176 cells and foot anchor (88,164). Five generated facings plus mirrored side views cover eight directions. Idle/walk/windup/release use supplied poses; hurt and faint use recoil/sinking/fading of those poses. Two clipped front antenna poses in the Meganium source are replaced with intact front walking poses during packing. No dedicated shiny or faint sheet is claimed.

Prompt — Excadrill:

> Production transparent pixel-art sprite sheet for a top-down Pokémon Mystery Dungeon action game. Reference is official Mega Excadrill; preserve its dark brown mole body, white face, red chest marks, immense silver drills with red-orange ridges, and triangular steel plates. Five columns and five rows, 25 separate evenly spaced full-body sprites with consistent scale and padding. Rows: front, front-left, left, back-left, back. Columns: neutral, walking left foot, walking right foot, attack windup lifting drills, attack release thrusting drills. Actual backs in back views; all feet and drills inside each cell. Crisp outlined pixel clusters; no text, labels, grid, shadows or external effects. Transparent background.

Prompt — Meganium:

> Production transparent pixel-art sprite sheet for a top-down Pokémon Mystery Dungeon action game. Reference is official Mega Meganium; preserve its green quadrupedal long-neck body, enormous layered four-flower red/pink/pale-pink/white collar, tall curled gold antennae, yellow eyes, leafy ankle cuffs, white claws and green tail. Five columns and five rows, 25 separate evenly spaced full-body sprites with consistent scale and padding. Rows: front, front-left, left, back-left, back. Columns: neutral, walking left feet, walking right feet, solar windup lowering neck, solar release lifting head and spreading flowers. Back views show no face. Keep antennae, feet and tail inside cells. Crisp outlined pixel art; no text, grid, labels, shadows, particles or background motifs. Transparent background.

Validation: `node --test tests/survivor-megas.test.cjs`; `node tests/survivor-megas-browser.cjs` with an installed Playwright Chromium. The latter checks the published module entry point at desktop and mobile landscape sizes, all eight facings, atlas readiness, action completion, menu equip, level-2 starts, intro completion, real enemy damage, pause and removal of each Mega.
