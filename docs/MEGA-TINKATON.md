# Mega Tinkaton

Custom visual design: [ivi.etz's reel](https://www.instagram.com/reel/DepaAfDsy1a/).
The generated adaptation keeps the cream/pink pigtails, dark feather armor and
the oversized ornamental Corviknight-shaped hammer. Shiny art is not supplied;
equipping the mega preserves ownership of the original shiny without recoloring
these sheets.

## Unlock and stats

Defeat three bosses in one clean solo run as normal Tinkaton, then equip the
permanent Tinkatonite in the partner menu. Coop/challenge/preview runs do not
unlock the stone. Cloud merges preserve the best mission and both stones and
equipment choices use the existing save format.

Base stats: HP 85 / Attack 140 / Defense 97 / Sp. Atk 70 / Sp. Def 120 / Speed 94
(606 total). The game's existing conversion produces 108 HP, 117 movement speed,
1.47 physical attack and 1.08 special attack. Defense remains the game's shared
8% mega resistance; the engine does not have separate incoming Defense/Sp. Def
formulas. Potencia multiplies physical move damage by two independently of
attack cards/buffs and never doubles special moves or status effects.

Gigaton Hammer starts at level 2 when mega-equipped, is exclusive to Tinkaton's
move pool, and evolves into Devastating Hammer using the existing melee ladder.
Repertoire still chooses a second move and respects Veto and coverage purchases.

## Animation assets

`assets/pokemon/959/mega/`: four generated source sheets, four gameplay atlases,
`atlas.json` (crop boxes/anchors) and `art-source.json` (reference and prompts).
`tools/prepare_mega_tinkaton.py` performs deterministic slicing/packing, using
transparent components rather than assuming the generator's requested size.
Each atlas has 4 columns × 5 drawn facings, 256×224 cells and anchor (128,204).
`js/systems/tinkaton.js` maps those facings to eight engine directions with
action-specific mirrors. No standing sprite is rotated to fake walking or attacks.

Actions: Idle, Walk, Attack, Shoot, Charge, Hurt and Faint; the last can hold its
final pose. Menu, solo play and remote coop players use the same animator.

## Validation

`node --test tests/mega-tinkaton.test.cjs` checks the mission, persistence, exact
stats, physical/special damage, critical and card stacking, projectiles, delayed
meteors and remote transformation. `tests/mega-tinkaton-browser.cjs` exercises
the real published page locally on desktop and landscape phones, including
unlock/equip/reload, level-2 start, decoding every action in all eight directions,
missing assets and browser exceptions. Portrait phones retain the existing rotate-to-landscape notice.
