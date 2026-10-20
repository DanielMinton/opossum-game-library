# Asset metadata — Zombie Baby (example)

> **EXAMPLE ONLY — planning spec, not a finished asset.** Run the scanner to see which files exist. Don't copy this into assets/ until every TBD is filled in. The design is in `design/ZOMBIE-ROSTER-AND-BOSSES.md` (2.6) and `design/ROSTER.md`; the owner's sheet is being cut into these strips separately (importer character mode, `--prefix baby --size 32x32 --height 30`).

- Asset ID: `enemy-zombie-baby`
- Display name: Zombie Baby
- Category: enemy
- Files and purpose: see **Planned files** below (all planned — not yet supplied).
- Visual description: Proposed: a zombie toddler in **pastel pink and blue** (bonnet, romper), mint skin, the brain showing out of the top of the head, one eyeball on a stalk, a rattle. Comes in threes ("the litter").
- Intended role in the game: Proposed: three at a time, one whip each, faster than a jogger (chase 90 px/s). The pressure is rhythm and numbers. The one zombie Play Possum does nothing about: it keeps coming, and a bump while Sammy lies there still hurts. Owner answer 8 (2026-10-20): no guard rails; it bleeds red and the chainsaw slices it like anyone.
- Camera/view: side view, facing right; mirrored by the game.
- Relative size: about 30 px tall in a **32×32** frame (smaller cell than the other zombies).
- Transparent background: yes — transparent PNG, hard edges, 1-bit transparency only.
- Source/creator/license: TBD (also record in `design/ASSET_SOURCES.csv`).

## Planned files (planned — not yet supplied)

| File (planned — not yet supplied) | Type | Purpose |
|---|---|---|
| `zombie-baby-walk-strip-v01.png` | Production strip | A fast toddle, 6 frames, 192×32 px |
| `zombie-baby-attack-strip-v01.png` | Production strip | Rattle smack, 4 frames, 128×32 px, hit frame 2 |
| `zombie-baby-hit-strip-v01.png` | Production strip | 2 frames, 64×32 px (frame 0 is also the chainsaw-cut pose) |
| `zombie-baby-defeat-strip-v01.png` | Production strip | The pop, 8 frames, 256×32 px |
| `zombie-baby-idle-strip-v01.png` | Production strip | 4 frames, 128×32 px (arena drop-in; it is never confused) |

## Animation
- Frame width × height in pixels: 32 × 32. Pivot / feet baseline: bottom-centre (16, 31), feet on row 31 in every grounded frame.
- One row per file; columns = frames, zero-based, left to right. No padding.

| Animation | Count | FPS | Loop / one-shot | Notes |
|---|---|---|---|---|
| walk | 6 | 10 | loop | fast toddle (patrol and chase) |
| attack | 4 | 12 | one-shot | **hit frame = 2** (rattle up) |
| hit-react | 2 | 12 | one-shot | never seen in play (1 hp); frame 0 is the sliced pose |
| defeat | 8 | 12 | one-shot | the pop; the game throws the rattle (and the head) as bits |
| idle | 4 | 6 | loop | arena drop-in |

## Behavior (Proposed; numbers in `game/src/config.js` `baby`)
- HP 1. Patrol 30 px/s, chase 90 px/s, notices Sammy within 128 px (lying down or not), gives up after 3 s beyond 200 px.
- Attack: rattle smack, 4 frames at 12 fps, hit frame 2, box 12 × 14 px starting 16 px above its feet (low enough to hit a lying Sammy). Cooldown 0.8 s.
- Body box 12 × 20 px (the whip, 10 to 22 px up, overlaps the top 10 px). No knockback from a whip.
- A level entry `{ type: 'baby', x: 3010, litter: 3 }` stands three of them 32 px apart (3010, 3042, 3074).
- Whip death: `pop` (gag lines `NAP TIME.` · `LITTLE SHIT.` · `GOO GOO. GONE.`). Chainsaw: `sliced`, red, like anyone.
- Sounds: `sfx-baby-rattle` (the smack), `sfx-baby-cry` (going down); the shared hit and defeat sounds.
