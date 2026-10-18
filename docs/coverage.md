# Coberturas

Permanent upgrade per Pokémon, priced at 1,500 / 4,000 / 10,000 Pokémonedas.
Each level lets the player select one additional compatible move before a run,
up to three. Selected moves join the level-up pool and can be chosen through
Repertoire, banned, bound to a slot, leveled, evolved and bonded. The four-slot
limit and two-buff offer limit stay in effect. A run snapshots its selection.

## Compatibility

Generated offline from [PokéAPI's CSV dataset](https://github.com/PokeAPI/pokeapi/tree/6fd69dfe90465ba96534f6816fc817737d1f97f6/data/v2/csv),
commit `6fd69dfe90465ba96534f6816fc817737d1f97f6`.
[PokéAPI documentation](https://pokeapi.co/docs/v2) describes learning methods
and version groups. Only level-up, egg, tutor and machine records are used.
Colosseum, XD and Champions are excluded. Compatibility in any included main
series version group is enough; this is not a competitive ruleset for a single
generation. Event-only and special learning methods are excluded.

Each game species maps to the matching default PokéAPI Pokémon ID. Alternate
form IDs are never treated as National Dex numbers. No learnset is inferred
from another family member. Current Megas share their base species and types;
if later transformations change types, the ordinary pool is filtered at runtime.
Already available same-type and Normal moves are removed from the coverage list.
Only the 64 implemented moves are considered, not their evolution names as
separate attacks. For example, Sludge Bomb is represented by evolved Sludge.

The snapshot yields extra choices for 919 of the 966 catalog species. Species
without extra implemented moves show an explanation and cannot buy the upgrade.
Species with fewer than three extra moves can only buy useful levels.
Smeargle's Sketch mechanic is not inferred into a universal learnset.

Custom gift characters use explicit, local design lists rather than PokéAPI IDs:

- Mao Mao (10001): Thunderbolt, Rock Slide, Confusion. Thunderbolt and Rock Slide
  preserve the requested extra-attack direction for this custom character.
- Toji (10002): Aerial Ace, Psycho Cut, Rock Slide, Bite, for his weapon/fighting theme.

## Updating the data

Run `python tools/build_coverage.py`. It downloads the pinned CSVs into ignored
`tools/cache/coverage/<commit>/`, reads the current game catalog, checks species
and move IDs, and writes `js/data/coverage-data.js`. Source file SHA-256 hashes are
embedded. Repeated generation from the same snapshot is deterministic. There are
no runtime API requests, build dependencies or per-player requests to PokéAPI.

## Storage

`save.pupg[dex].coverage` is the bought tier. `save.pcoverage[dex]` stores
`{ moves: [move IDs], at: integer timestamp }`. Empty lists are explicit clears.
Selections merge independently per Pokémon using their timestamps and a stable
tie-breaker, preserving edits when another device makes unrelated coin changes.
Stored selections are checked for existing species, compatible moves, duplicates
and the three-move maximum. Active selections additionally respect bought tiers.

The existing fork Firestore rules accept this optional save field; no rule update
or new backend endpoint is required. Old saves receive an empty default. Older
clients may retain the field without understanding it; the updater remains in
place so players receive the new module and data together.
