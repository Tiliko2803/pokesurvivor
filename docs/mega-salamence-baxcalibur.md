# Mega Salamence and Mega Baxcalibur — approved Live release

Both forms use Survivor's permanent-stone mission: defeat three bosses in a clean normal solo run with the ordinary form, then equip the stone in the partner menu. Both start with a level-2 move and use the shared Mega intro. TFT uses the existing 45-copy Iridium progression; the last three family copies beyond complete Gold trigger the Mega. Existing identity, placement, resale and saved progression are preserved.

## Mega Salamence

Dragon/Flying; Mega base stats 95/145/130/120/90/120. Survivor starts Air Slash level 2. Ala Creciente fires three physical Flying rays every five simulation seconds, at angles −0.28/0/+0.28 relative to aim. Each ray is 320 units long and 34 wide before area modifiers, with base damage 24 + 2 × level. Rays can hit the same enemy. Walls and normal type/weather/attack/defense calculations apply.

TFT prepares an interruptible flight in a three-cell-wide cardinal band, then releases on the next attack pulse for 240% attack per enemy. It lands in the last free cell in the center line. Ordinary Salamence retains its narrower 300% flight. Enemies can dodge and stun cancels the preparation.

## Mega Baxcalibur

Dragon/Ice; Survivor balance uses multipliers 1.12 HP and 1.25 attack, not claimed official Mega base stats. It starts Dragon Claw level 2. Espadón Glacial fires a physical Ice ray every seven simulation seconds, 380 × 64 units before area modifiers, base damage 85 + 4 × level. Enemies actually hit receive 40% movement slow for two seconds, reduced to 15% for bosses. Walls block the ray.

TFT fires a cardinal four-cell Ice line for 360% attack with at least 40% armor penetration and 35% cadence slow for three seconds. It does not move the caster or its targets and does not hit allies.

## Art and release checks

The approved Baxcalibur revision-3 atlas places the dorsal sword in the head-spine-tail plane: front/rear views show the narrow edge, profile views show its broad dark side. Both forms use 880×880 atlases with 176×176 cells, anchor (88,164), and the shared Mega animator. There are no dedicated shiny sheets.

Root assets are now in `assets/pokemon/{373,998}/mega/`; Live no longer depends on the test-only atlas paths. Test mode retains its own isolated guest session and unlocked dragon stones. New atlas and module URLs are versioned to invalidate earlier art.

Validation: 200 automated tests pass, including dragon stone unlock/equip/run entry, starting moves, control guards, walls, cooldowns, boss slow, Iridium progression/persistence/resale, broad flight, interruption and ally-safe line damage. The corrected atlas was previously rendered in the browser preview on desktop and mobile. A fresh browser launch for this release was unavailable because the Chromium download failed; no new browser verification is claimed.
