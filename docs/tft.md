# TFT · Evoluciones — alpha

Development branch: `feat/tft-mode`. Test URL:
https://tiliko2803.github.io/pokesurvivor/dev/
Entry: Jugar → TFT · Evoluciones. Hoenn preview remains available.

## Decks (requested first)

- Three local slots, each exactly ten distinct evolution families out of 24.
- A family includes its complete line; species are not separate deck slots.
- Tap to select/remove families; filter by cost; save or start when count is ten.
- Browser preferences use only `ps.tft.decks.v1`. Invalid data or blocked storage
  falls back to defaults/in-memory play; it never touches account save keys.
- Default: Bulbasaur, Charmander, Squirtle, Pichu, Gastly, Ralts, Drilbur,
  Larvitar, Beldum, Rayquaza. All six signature families are included.
- A match snapshots the selected deck. Refreshes and new rounds only draw from
  its ten families. Buying an injected off-deck offer is rejected by the engine.
- Normal level rarity weights are normalized over costs present in the deck.
  If no cost has nonzero weight, the cheapest chosen tier is offered instead.
  This allows any ten valid lines, including decks without cost-1 families.
- Opposing AI keeps the full roster. Decks are independent of owned collection.
- Change decks before a new match; no changing the active deck during a run.

## Presentation (requested second)

Evolution banners show old and new species/stars, including bench merges.
Movement interpolates visually; fixed-step combat positions remain authoritative.
Type-colored projectile effects, damage/healing numbers, shield arcs and bars,
burn/stun markers, fading defeated units and facing animations clarify battles.
Touch a friendly or enemy board unit during combat, or a bench unit, to inspect
HP, attack, defense, attacks/s, mana, shields and its actual ability description.
Friendly trait activation is shown. Reduced-motion settings avoid combat flashes
and movement interpolation; OS reduced-motion disables the evolution CSS effect.

## Signature abilities (requested third)

Six complete families receive distinct behaviors at each star rank. The rest
retain role-based abilities; this is not a full 24-family move redesign.

| Family | First rank | Second rank | Third rank |
|---|---|---|---|
| Charmander | Single flame + burn | Fire cone + burn | Wider cone + stronger/longer burn |
| Squirtle | Bubble + push | Nearby water damage + push | 4-cell water beam + up to 2-cell push |
| Drilbur | Steel strike | Drill through up to 3 cells | Drill + landing ground shockwave |
| Gastly | Ghost strike + slow | Bonus vs targets below 40% HP | Larger bonus + 25% actual damage life drain |
| Ralts | Heal + psychic strike | Heal + cleanse burn/slow/stun | Heal and shield two wounded allies |
| Beldum | Tackle/push + self shield | Shield vulnerable ally + steel strike | Area meteor strike, 1-second stun + self shield |

Pushes stop at occupied cells and board edges. Drill stops at friendly blockers
and lands only in a free cell. Shields cap at 50% recipient HP. Healing caps at
missing HP; drain scales from HP actually removed. Burn is finite and refreshes
rather than stacking unboundedly. Skills use their own damage type. Inspectors
show stage-specific descriptions and the corresponding move name.

## Core rules and isolation

6×6 board, three player rows, eight bench slots, levels 3–6, 12 PvE rounds and a
final Rayquaza encounter. Three equal-star copies merge; 9 base copies make one
three-star unit. Two-stage families empower the evolved form at rank three;
single-stage species empower. Eevee currently uses Vaporeon only.

50 initial PV, 10 gold, 5 shop offers. Refresh costs 2, four XP cost 4, two XP
arrive after a round. Income: 5 + 1 per win + interest (floor(gold/5), capped at 5; maximum at 25 saved gold) +
streak bonus (one per two consecutive results of the same sign, capped at 3).
2/4 distinct deployed families activate type synergies. Fixed 50 ms simulation,
45-second round limit (timeout loses), pause and ×2. Survive 12 rounds to win.

The Survivor personality classifier is reused for grid AI: ranged retreat,
divers target backline, guardians protect wounded allies, melee roles persist.
No Survivor enemy entities, boss state, projectiles, ranking or rewards are used.
The engine never writes account data. Deck preferences persist; matches do not.
Items, PvP, full match persistence, account rewards and more signature abilities
remain future work.

## Packaging and verification

`node --test tests/tft.test.cjs tests/tft-preview.test.cjs`

`node tests/tft-browser.cjs` uses local Playwright and Chromium (CHROMIUM_PATH
optional); covers desktop, portrait and landscape when a browser is available.

`node tools/build-tft-preview.cjs` generates the existing /dev/ page with isolated
copies of changed modules/styles. Publish only its seven listed dev/ paths to
the Pages branch. Official root files and version.json remain intact. Source
and test changes are retained on feat/tft-mode for a later authorized release.

Hosted smoke checks cover the previous alpha. This iteration requires checking
saved-deck editing, launching a chosen deck and unit inspection in the hosted UI;
local automated browser runs require an installed Chromium executable.
