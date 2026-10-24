# TFT: Mega Excadrill and Mega Meganium

Both families already exist in TFT. This adds their Iridium capstone without adding shop species or importing Survivor's action-game passive timers. Each uses 45 regular-price family copies in total: complete Gold, then buy three additional copies of Drilbur or Chikorita. Iridium retains the deployed unit's identity and position, adds the existing 15% HP/attack capstone bonus, removes the completed family from rerolls, and preserves all invested copies in resale and saved games. The new Survivor sprite atlases are reused by the TFT Mega animator.

## Mega Excadrill — formation breaker

**Taladro Rompefilas** locks a cardinal tunnel of up to five cells toward its current target. Its cells are highlighted until the next attack beat. Excadrill stays still while preparing; enemies can step off the line. An applied stun immediately cancels the windup and removes its warning. Being disabled when its attack beat arrives also cancels it.

On release, every living, visible enemy in the tunnel takes 280% attack as Ground damage with at least 50% armor penetration. Survivors receive a three-second, non-stacking 50% reduction to direct healing and regeneration. The drill does not reduce shields or move bosses. It passes through enemy-occupied cells, stops at the first living allied blocker or board boundary, and lands only on the last unoccupied cell; with no landing space it deals its damage without moving. Ordinary Excadrill's existing entry drill and earthquake remain unchanged.

## Mega Meganium — solar support

**Jardín Solar** grants Grass/Fairy traits and fires four cardinal Grass rays of range four. Each ray deals 150% attack and applies a 25% cadence slow for two seconds. Only enemies exactly on those axes are hit. Adjacent allies do not block the rays or take damage.

The initial cast removes burns, slows and stuns from living allies within Manhattan radius two. It plants a fixed garden at the cast location for four movement beats. Each available beat heals the two most injured living allies inside its radius by 75% attack each. The source can move without moving the garden. Stun or concealment loses that garden beat; a dead source cannot heal. Recasting refreshes a single four-beat garden instead of stacking gardens. The garden does not cleanse the drill's antiheal.

## Presentation, persistence and checks

- Both units show their real Mega sprites in cards, board, evolution and results. The new atlas timings drive TFT attacks.
- Excadrill has a distinct tunnel warning and drilling effects. Meganium has four ray effects, a persistent garden boundary, floral pulses and remaining-pulse labels. Wounded targets show `CURACIÓN −50%` while the antiheal is active. Reduced motion and low graphics use the same mechanics.
- New optional save fields validate cardinal direction, garden location/count and antiheal expiry. Existing saves remain valid. Transient effects are discarded on restore; unit state continues deterministically.
- `node --test tests/tft*.test.cjs tests/survivor-megas.test.cjs tests/mega-*.test.cjs tests/github-pages-publish.test.cjs` covers all seven Iridium families, resale, caps, allies, boundaries, bosses, interruption, dodge, healing, regeneration, fixed gardens, invalid saves and deterministic mixed battles.
- `node tests/tft-new-megas-browser.cjs` checks the source entry point on desktop and the development entry point in mobile portrait: 45-copy purchases, Mega atlases, Mega sprite integration, ability events, active-save reload and absence of horizontal page overflow or missing assets.

The Survivor release is already on `main`; these TFT changes are prepared separately for review.
