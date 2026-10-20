# Asset metadata — Zombie Hippie (example)

> **EXAMPLE ONLY — planning spec, not a finished asset.** Run the scanner to see which files exist. Don't copy this into assets/ until every TBD is filled in.

How to read this example: **Confirmed** (owner, 2026-10-20) = the hippie is one of four distinct zombie types that go in level 1, each in a contrasting colour scheme; the game is full gore. Everything else (behaviour, numbers, frames) is **Proposed** from `design/ZOMBIE-ROSTER-AND-BOSSES.md` section 2.3. For the real files you would copy this to `assets/enemies/enemy-zombie-hippie/ASSET.md`.

---

- Asset ID: `enemy-zombie-hippie`
- Display name: Zombie Hippie
- Category: enemy
- Files and purpose: see **Planned files** below (all planned — not yet supplied; the owner's sheet is being cut by the importer separately).
- Readiness: TBD — `ready` once the strips below are installed with their license rows.
- Visual description: a rotting zombie hippie: long grey dreadlocks under a tie-dye headband, torn purple vest over a cream peace-sign shirt, ripped grey-blue jeans, red sneakers, grey-teal (olive) skin, glowing pale eyes, purple slime dripping from the mouth. Colour scheme: **purple and olive** (the only purple-dominant body with blue jeans), so he reads apart from Sammy, the jogger and the sweater.
- Intended role in the game: "the slow wall". The first thing that doesn't die in two hits: three whips, slow enough to walk around, half a jogger's knockback (he closes in while you recover from a swing). Play Possum fools him for 3 s of grace instead of 1.5 (too stoned to notice).
- Camera/view: side-view profile, facing right (the game mirrors him).
- Relative size: about 45 px tall in a 48×48 cell, feet at (24, 47).
- Transparent background: yes — transparent PNG, hard edges, 1-bit transparency only.
- Source/creator/license: TBD (also record in `design/ASSET_SOURCES.csv`).

## Planned files (planned — not yet supplied)

| File (planned — not yet supplied) | Size | Purpose |
|---|---|---|
| `zombie-hippie-walk-strip-v01.png` | 6 × 48×48 | Shamble (patrol and chase), 6 fps, loop |
| `zombie-hippie-attack-strip-v01.png` | 4 × 48×48 | Claw lunge, 10 fps, hit frame 2 |
| `zombie-hippie-hit-strip-v01.png` | 2 × 48×48 | Hit-react, 12 fps |
| `zombie-hippie-defeat-strip-v01.png` | 8 × 48×48 | The melt (dissolves into goo), 12 fps |
| `zombie-hippie-idle-strip-v01.png` | 4 × 48×48 | Sway in place (confused, arena drop-in), 6 fps |

## Animation

- One strip per animation, frames side by side, zero-based, no padding. Cell 48 × 48, feet point (24, 47) in every grounded frame.
- Drawn facing right; mirroring allowed.

| Animation | Count | FPS | Loop / one-shot | Notes |
|---|---|---|---|---|
| walk | 6 | 6 | loop | A shamble: the 4 drawn poses out and back (1 2 3 4 3 2). |
| attack | 4 | 10 | one-shot | **Hit frame = 2** (claws forward, the widest pose), last frame held. |
| hit | 2 | 12 | one-shot | Drawn as a white flash. |
| defeat | 8 | 12 | one-shot | The melt. The game draws a purple goo pool under him that lingers about a second after he is gone (drawing only; nothing slows Sammy). |
| idle | 4 | 6 | loop | Barely moves. |

## Behavior (Proposed; the numbers live in `game/src/config.js`, block `hippie`)

- Brain: walker (patrol, chase, claw lunge, reel, go down), like the jogger.
- HP 3 · patrol 18 px/s · chase 36 px/s · notices Sammy within 80 px · attack range 26 px · attack 0.4 s, hit frame 2, cooldown 1.6 s.
- Body 20 × 40 px; attack box 18 × 20 starting 26 px above the feet.
- Whip knockback 60 px/s (a jogger: 120); chainsaw cut knockback 20; cart spill knock 80.
- Play Possum: confused like a jogger, then ignores Sammy for **3.0 s** after he gets up.
- Deaths: whip = **melt** (goo pool, lines `PEACE. OUT.` · `FAR OUT, MAN.` · `BUMMER.`); chainsaw = sliced like anyone, no pool.
- Sounds: `sfx-zombie-melt` when he goes down from a whip (plus the usual defeat and splat sounds).

## Palette

Uses the enemy palette line (15 colours + transparent). Reserved gore colours (`blood*`, `ichor*`, `bone`, `meat` in `S.PAL`) must not appear in the strips; his slime is purple, not ichor green.
