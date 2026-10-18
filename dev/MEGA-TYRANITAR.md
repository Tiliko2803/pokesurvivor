# Mega Tyranitar · preview

Available only at the existing `/dev/` URL. Production scripts, version and
player accounts remain independent of this preview.

- Base stats: 132 HP, 1.800 attack, 109 movement; Rock/Dark.
- Rock Throw starts at level 2. Four move slots, normal bonds and coverage rules.
- Sand Stream: 110-unit radius, 8 base Rock damage every 0.75 s, 25% slow for
  0.9 s. Attack, type effectiveness, weather, critical and Expansion apply.
  No cooldown or attack-speed scaling for the passive; damage scales with
  Dragon Dance's attack bonus. Sparse pixel grains keep warning marks visible.
- Resistance: 10 percentage points while alive, with the usual 80% total cap.
- Tyranitarite: three bosses in one clean solo normal-form run, matching the
  existing mega mission. Preview guests already own and equip all three stones.
- Dragon Dance must be chosen from Coverage in gold upgrades; it is not granted
  free. The Boss Rush move selectors accept the chosen coverage, including buffs.
- Art: new image-generated eight-direction sprite sheet. Idle, walk, claw strike
  and charge/roar have separate poses. Hurt/faint use recoil frames and fade.
  Shiny mega art is not provided, so this form uses the normal palette.

Implementation is isolated in `dev/tyranitar.js`; load after normal modules and
before `dev/boss-rush-preview.js`. Regenerate with
`node tools/build-boss-rush-preview.cjs`. Run
`node --test tests/mega-tyranitar.test.cjs tests/groudon-integration.test.cjs`.
