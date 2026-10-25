# Mega Salamence and Mega Baxcalibur — first implementation

Status: development only. Do not merge this branch into Live before visual review and browser testing.

Both families already exist in TFT. Survivor grants permanent stones after three bosses in a clean normal solo run using the ordinary form, then uses the existing optional equipment and rainbow intro. TFT uses the existing 45-copy Iridium progression, identity/placement retention, resale and save validation.

- Salamence: Dragon/Flying. Survivor starts Air Slash at level 2. Ala Creciente fires three physical Flying rays every five simulation seconds, 320 units long and 34 wide at angles −0.28/0/+0.28 relative to aim. Each has base damage 24 + 2 × level; multiple rays can hit the same enemy. Existing stats/type/weather/defense calculations and walls apply. Its Mega stats are 95/145/130/120/90/120. TFT widens its interruptible flight to three cells, with 240% attack per victim; ordinary Salamence retains its existing 300% one-cell flight. Three warning beams show the expanded path. Landing uses the existing free-cell checks.
- Baxcalibur: Dragon/Ice. Survivor starts Dragon Claw at level 2, with custom multipliers of 1.12 HP and 1.25 attack; these are fork balance, not claimed official base stats. Espadón Glacial fires a physical Ice ray every seven seconds (380 × 64, base 85 + 4 × level), slowing hit enemies by 40% for two seconds (bosses 15%). TFT fires a cardinal four-cell Ice ray for 360% attack, at least 40% defense penetration and 35% cadence slow for three seconds. Allies are untouched; the caster and bosses are not displaced.

Survivor passives begin after 1.5 seconds, scale dimensions with area, stop while dead/remote/frozen, and cannot bank extra pulses over suspended frames. All new mechanics reuse existing save fields.

## Preliminary artwork

Generated through the built-in image tool. Sources, packed 880×880 atlases and manifests are stored in `assets/pokemon/{373,998}/mega/`. Shared animator supplies five source facings plus mirrored directions and existing action timings. `tools/prepare_dragon_megas.py` reproducibly packs the supplied sources. Manifest status explicitly marks draft artwork.

Remaining visual work: Salamence's crescent silhouette and some wing tips need revision; Baxcalibur's chest blade and rear attack orientation need closer matching to its official artwork. These are preliminary sprites, not final approved art. No shiny sheet is supplied. Hurt/faint use existing recoil/fade presentation rather than dedicated poses.

Official visual references: https://mega.pokemon.com/es-mx/ and https://legends.pokemon.com/es-mx/dlc (Mega Baxcalibur).

Generation prompts requested a transparent five-by-five pixel-art sheet, rows south/southwest/west/northwest/north and columns idle/step-left/step-right/windup/release. Salamence prompt specified blue body, red crescent wing, white chest and tucked forearms. Baxcalibur prompt specified navy body, pale ice chest blade, crystalline dorsal blade and red-orange claws. Keep all bodies inside cells with no labels, grid, shadows or particles.

## Validation

Automated suites cover Survivor unlock/equip/actual run entry, initial attacks, passives, pause/control guards, walls and boss slow; TFT Iridium purchases/resale/persistence, expanded flight, interruption, line damage and ally safety. Browser QA remains pending: this environment has no Playwright Chromium executable installed.

## Baxcalibur sprite revision 2

The preview now uses the corrected dorsal sword design (dark blade core, ice edges, lavender tips and short abdominal hilt). Twenty-five connected source poses were isolated separately, scaled together and foot-aligned inside padded 176px cells. Three left-facing attack source poses were mirrored for directional consistency. The new atlas retains the existing 880x880 layout and all animation timing. This replaces the earlier preliminary Baxcalibur artwork only in /dev/; Live and Salamence art are unchanged.

Repacking: `python dev/dragon-megas/tools/pack_baxcalibur_v2.py SOURCE.png OUTPUT.png`. The downloaded PNG is the normalized 5x5 atlas ready for use. The source image hash and each source crop/flip are recorded in atlas.json.

Validation: all 25 crops are nonempty with padding; the actual preview was loaded in Chromium at 1100x720 and 844x390. All 56 combinations of 8 facings and 7 animation states rendered nonempty. Survivor enters with Baxcaliburite and the correct animator, TFT resolves its shared Mega animator, and the versioned new atlas loads with no page errors or missing assets.
