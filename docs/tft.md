# TFT · Evoluciones — alpha

Development branch: `feat/tft-mode`. Test URL:
https://tiliko2803.github.io/pokesurvivor/dev/
Entry: Jugar → TFT · Evoluciones. Hoenn preview remains available.

## Decks (requested first)

- Three local slots, each exactly ten distinct evolution families out of 34.
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
HP, damage per pulse, defense, cadence multiplier, mana, shields and its actual ability description.
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


## Rhythm, reports and roster expansion

A shared 0.5-second beat drives both teams: 1 hop/advance, 2 attack, 3 move,
4 attack. Normal movement takes at most one cell and only on beats 1/3. Basic
attacks and mana abilities only occur on beats 2/4 when in range; residual burn
and regeneration continue on the fixed-step status clock. Initiative alternates
by bar for collision/attack resolution. This is one shared cadence, not a
simultaneous turn-resolution system. Attack-speed differences scale damage and
mana per pulse, preserving DPS differences; slow scales those same values.
Push/drill movement is part of the ability on an attack beat. The HUD shows the
current beat and units hop while advancing; pause/×2 apply to the shared clock.

Round reports snapshot actual HP damage/healing (not overkill/overheal), shield
grants, received damage, absorbed shield damage and kills. Passive regeneration
counts as self healing. The table compares both sides; match totals aggregate
friendly contributions by evolution family across rounds/evolutions. Records
are in-memory only and are never submitted to Survivor rankings or accounts.

Ten new families bring the roster to 34:

| Cost | New family |
|---|---|
| 1 | Sandshrew → Sandslash |
| 1 | Weedle → Kakuna → Beedrill |
| 1 | Mareep → Flaaffy → Ampharos |
| 2 | Geodude → Graveler → Golem |
| 2 | Lotad → Lombre → Ludicolo |
| 2 | Spheal → Sealeo → Walrein |
| 2 | Happiny → Chansey → Blissey |
| 3 | Onix → Steelix |
| 3 | Tinkatink → Tinkatuff → Tinkaton |
| 4 | Bagon → Shelgon → Salamence |

Move-specific AoE is defined in AREA_MOVES, in addition to the six signature
families. Earthquake affects enemies within two Manhattan cells of the user;
Bulldoze uses one cell and slows. Blizzard, Discharge, Draco Meteor, Gigaton
Hammer and additional rock/water/ice moves also use explicit area definitions.
Area effects highlight exactly the included cells and never damage allies.
Excadrill keeps its signature drill plus landing shockwave at rank three.
Kakuna's Harden grants a self shield. Other new species use their role/AI and
any matching area move, rather than receiving a full bespoke three-stage kit.

Engine tests include all 34 families' local sprites, interest at 5-gold thresholds,
pulse timing, AoE targets, snapshot reports and complete collision-free matches.
Balance remains provisional; the report provides evidence for later adjustments.


Hosted verification of this iteration: the existing /dev/ page displayed all 34
families, saved an edited ten-line deck and restored it after slot switching.
A three-unit team launched correctly, inspection displayed the real Ralts
ability and current HP/mana, shared beat controls appeared, and a full first
round resolved. Its report correctly displayed both teams and match totals,
including actual healing and absorbed shields. With six saved gold, the win
paid seven total (base five + win one + interest one). Native Android visual
validation remains pending; the hosted desktop flow was verified.
