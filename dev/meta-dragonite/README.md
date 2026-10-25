# Mega Metagross and Mega Dragonite — test preview

Published only in /dev/. The new generated sheets use official visual references and the shared 880x880 atlas layout. Dragonite alpha speckles were cleaned during packing; the rear-left release reuses a correctly facing idle pose because its generated release turned toward the front. No shiny or dedicated hurt/faint artwork is claimed. Live remains unchanged.

## Survivor

Both forms use the existing permanent stone mission: three bosses in a clean normal solo run with the ordinary form. Equip is optional; initial attacks start at level 2. Dynamic save sanitization and merge retain the stones/progress.

- Mega Metagross (metagrossite): Steel/Psychic, base stats 80/145/150/105/110/110. Starts Meteor Mash. Cruz Meteórica fires four physical Steel rays every six simulation seconds, rotated from the player's aim. Each is 240 × 48 before area upgrades, base damage 38 + 2.5 × level. Walls stop rays; type, weather, physical attack and defense apply.
- Mega Dragonite (dragoninite): Dragon/Flying; custom fork modifiers 1.10 HP, 1.22 attack, 1.08 speed (not claimed official Mega base stats). Starts Dragon Breath. Pulso del Guardián fires a special Dragon beam every eight seconds, 440 × 60 before area modifiers, base damage 65 + 3 × level. At least one successful hit heals the owner by 4% max HP once per cycle; missing does not heal.

Both first trigger after 1.5 simulation seconds, stop while dead/remote/frozen and cannot bank multiple activations over suspended frames. Each requests its shared Mega animation on activation.

## TFT

Both existing families gain the standard Iridium capstone after 45 family copies total (three more beyond complete Gold), preserving identity/position, resale, save validation and the standard 15% capstone HP/attack bonus.

- Cruz Meteórica: four cardinal Steel rays of range three, 200% attack per enemy. Hits stun for 0.6 seconds (bosses half). Reaching at least one enemy grants a 20% max HP self-shield, subject to the existing 50% cap. No displacement, no diagonal hits, no allied damage. Ordinary Metagross keeps its existing lift/throw skill.
- Pulso del Guardián: cardinal Dragon beam of range five for 260% attack. If enemies are reached, heals the two most injured living allies within Manhattan radius two of the caster for 120% attack each, potentially including the caster. No contact means no heal. Normal antiheal applies; no resurrection, no out-of-range healing and no displacement.

No new transient save fields are introduced. Existing beam, shield, stun and healing events provide the UI effects. The shared animator reads dev/assets/pokemon/376/mega/poses.webp and dev/assets/pokemon/149/mega/poses.webp (880×880, 176px cells, foot anchor 88,164; rows south/southwest/west/northwest/north, columns idle/walk-left/walk-right/windup/release).

## Validation

204 automated tests passed with generated preview/build outputs during validation. Added coverage checks stone unlock/equip/starter/save merge, Survivor aiming/axes/walls/heal-on-hit and control guards; TFT covers 13 Iridium families, shield caps, boss control duration, cardinal ranges, ally safety, heal selection, antiheal, missing, and dead/stunned/hidden casters. The deployed preview uses isolated module copies, a guest session, no production ranking writes, and unlocked stones for the two new forms. Browser QA was not rerun because Chromium is unavailable; automated mechanics tests and source/asset checks passed.

Visual references reviewed directly:
- https://in.portal-pokemon.com/pokedex/0376_1/ (gold X and four large clawed arms).
- https://legends.pokemon.com/es-mx/story-world/pokemon/mega-dragonite (large cream head wings, teal back wings and iridescent tail orb).
