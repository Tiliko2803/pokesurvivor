# Mega Parasect

Fan design reference: [ivi.etz — Mega Parasect](https://www.instagram.com/reel/De42loYhFIx/).
Gameplay sprites were generated with the built-in image-generation tool, then cropped and packed with `tools/prepare_mega_parasect.py`. Original generated pose sheets are preserved next to the atlases under `assets/pokemon/47/mega/`.

- Type: Bug/Ghost. Base stats: 60 HP / 95 Attack / 100 Defense / 120 Sp. Attack / 100 Sp. Defense / 30 Speed (505 total).
- Parasectite: defeat three bosses in one clean normal solo run as ordinary Parasect. Equip permanently from its menu; starting move becomes level-2 Shadow Ball.
- Red Fúngica is this game's adaptation, not a claim about the creator's ability: after a 1.5 s warmup, pulse every 6 s in radius 150. Ghost special damage is `22 + level × 1.5`, scaled by the player's special attack, type matchups and special defense. The pulse slows ordinary enemies by 35% and bosses by 15% for 2 s.
- Infection lasts 4 s. Infected deaths produce radius-90 clouds with base damage `30 + level × 2` and heal 2% max HP. At most three secondary clouds/heals per pulse cycle. Each corpse can trigger only once. Infection tracking is bounded to 128 enemies per owner. Area upgrades affect both radii.
- All timers use simulation time. Dead, remote and frozen players do not trigger the passive. Damage/status use existing enemy methods, including their cooperative replication.
- Forty generated poses: five facings with four walking frames, and five facings with cast windup, cast release, hurt and faint. Side directions are mirrored to cover eight directions. Spectral-veil alpha is retained.

## Sprite prompts

Walking sheet: production pixel art sprite sheet for a Pokémon Mystery Dungeon style top-down action game. Use only the creature shown in the reference video. Fanmade Mega Parasect: three-tier pagoda mushroom canopy, dusty-magenta wide bottom cap, smaller brick-red middle cap, ochre pointed top with two pale bulb stalks and pale-yellow shelf fungi. Pale lavender spectral stem and veil above a small crab head with blank white eyes, thin golden legs and curved golden claws. Exactly 20 full-body poses in four columns and five rows facing south, southwest, west, northwest and north; four coherent floating walking frames per row. Consistent scale, transparent margins, crisp outlined pixel art, no text, grid or extra objects.

Action sheet: keep the generated walking reference's exact character appearance and four-column/five-row layout. Rows show front, front-left, left, back-left and back. Columns: raised claws and skirt for casting; claws extended for release; lean sideways with legs tucked; sit resting with caps drooping. Preserve the stacked ochre/red/magenta caps, bulb stalks, lavender stem/veil and gold limbs. All 20 complete poses separated on a transparent background, no detached effects, labels, shadows or extra objects.

Validation: `node --test tests/mega-parasect.test.cjs` covers mission, form/type conversion, special stats, pulse timing, range, boss control, bounded propagation/healing, expiration, independent owners, disabled states and the actual game's start/cinematic/un-equip flow. Existing mega, repertoire, coverage, publishing and TFT tests were also run.
