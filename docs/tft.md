# TFT · Evoluciones — alpha

Development branch: `feat/tft-mode`. Entry: Jugar → TFT · Evoluciones (Alpha).
This is an integrated game mode, reusing the local Pokédex, type chart and PMD
sprites. It is a solo PvE challenge, not an online eight-player TFT lobby.

## Implemented rules

- 6×6 board; three player deployment rows, up to six active units, eight bench slots.
- 24 purchasable evolution families; shops offer the first stage only.
- Three copies of equal star rank merge; 9 base copies produce a three-star unit.
  Three-stage families change species at each merge. Two-stage families evolve
  once and empower their final form at three stars. Single-stage species empower.
- Merges preserve the deployed unit's ID and position where possible. Evolving
  updates sprite, types, move name, speed and star-scaled combat stats.
- Eevee → Vaporeon is the sole Eevee branch in this alpha; branching choices remain future work.
- Moves currently use shared role behavior (healing, shielding + nearby damage,
  single-target burst or area damage), rather than the Survivor projectile system.
- Twelve generated enemy encounters, scaling stats and evolved foes. The final
  encounter includes Rayquaza. Survive all twelve rounds with PV remaining to win.
- Fixed 50 ms simulation steps, occupied-cell pathfinding, basic attacks, mana,
  role abilities, type affinities, shields, regeneration and attack slows.
- 45-second timeout counts as a loss; pause/hidden tab stops progression.
- 50 player PV; round loss costs 4 + floor(round/2) + surviving enemies.
- 10 starting gold, five shop offers. Refresh 2 gold; buy 4 XP for 4 gold.
- Levels 3–6; XP required for next level: 6, 12, 20. Each round grants 2 XP.
- Round income: 5 + victory (1) + interest (floor(gold/10), max 5) + streak
  (floor(abs(streak)/2), max 3). Interest uses pre-income gold.
- 2/4 distinct families of a type activate two synergy tiers. Duplicate species
  or different stages of the same family count once per type. Only deployed
  units count. Members of the type receive the displayed bonuses.
- Shop lock persists until unlocked; starting combat requires a deployed unit.
- Touch selection and placement, swapping, returning to bench, selling, pause,
  double speed, quit confirmation and restart after victory/defeat.

## Isolation

The engine never calls DB, localStorage, Firebase, rewards or rankings. The match
lasts this session; leaving TFT discards it. Account ownership/perks are not used.
The updater waits while TFT is open. Normal and Boss Rush retain their entry paths.
The mode is not deployed to Live by this development change. The authorized test
publication uses the existing https://tiliko2803.github.io/pokesurvivor/dev/ URL.
`node tools/build-tft-preview.cjs` preserves Hoenn preview adapters and writes
isolated copies of changed modules/styles under dev/. Only those preview files
are published on the Pages branch; official root files remain byte-for-byte intact.

## Requested future: decks of 10 evolution lines

Tiliko requested on 2026-10-22 a future deck system: select **10 Pokémon evolution
lines** to use in TFT. Each family occupies one deck slot and contains all its
stages, e.g. Charmander → Charmeleon → Charizard. The player's shop should draw
from those ten selected families. This is recorded scope, not an implemented
feature in this alpha. `ROSTER[].line` and `BY[dex].line` provide stable family
identity for deck composition and merges.

Pending design: deck editing/saving, collection restrictions (if any), branching
evolution choices, rarity balance within decks, opposing deck rules and PvP.
No restrictions or monetization are assumed. Also pending: items, bespoke move
mechanics, richer battle animation, balancing, persistence and account rewards.

## Validation

`node --test tests/tft.test.cjs`

`node tests/tft-browser.cjs` (Playwright + installed Chromium; honors CHROMIUM_PATH).

Source integration: `dev.html`, `js/tft/engine.js`, `js/tft/ui.js`, `css/style.css`.
For a later authorized Pages release: `node tools/build.js --github-pages`.

Development verification (2026-10-22): 30 engine/integration/regression checks passed,
including TFT, manual/touch aim, Pages packaging and live Boss Rush isolation.
Browser validation remains pending: this environment has no Chromium executable;
Playwright's browser download failed with an invalid/truncated archive. The
browser test is prepared, but visual layouts have not been verified here.


## Reused Survivor AI (2026-10-22)

The existing `G.Enemies.behaviorOf` personality classifier is exposed as a pure
function and reused by TFT. Its behavior is adapted to two teams and grid cells:
healers support, shielders protect the most vulnerable ally (e.g. Metang),
chargers/jumpers with a melee role dive toward enemy backline (e.g. Lucario),
ranged units focus wounded enemies in range and retreat from adjacent enemies.
Tanks and melee identities remain intact: Excadrill and Blaziken stay melee.

BFS pursues targets without occupying another living unit's cell; retreat also
checks occupancy and board limits. Spell, movement and selection rules are local
TFT rules; the Survivor enemy entity, its world, projectiles, summoning and boss
state are not instantiated or changed. Additional beam/zone/summon mechanics
remain future work.
