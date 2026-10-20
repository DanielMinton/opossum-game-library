# Asset metadata — Zombie Cheerleader (example)

> **EXAMPLE ONLY — planning spec, not a finished asset.** Run the scanner to see which files exist. Don't copy this into assets/ until every TBD is filled in. The design is in `design/ZOMBIE-ROSTER-AND-BOSSES.md` (2.5) and `design/ROSTER.md`; the owner's sheet is being cut into these strips separately (importer character mode, `--prefix cheerleader`).

- Asset ID: `enemy-zombie-cheerleader`
- Display name: Zombie Cheerleader
- Category: enemy
- Files and purpose: see **Planned files** below (all planned — not yet supplied).
- Visual description: Proposed: a dead cheerleader in a **maroon and cream** uniform (the contrasting scheme the owner asked for), blonde hair with a bow, two pom-poms. Olive-grey skin. Nothing green (that's the jogger) and no red that could pass for blood.
- Intended role in the game: Proposed: "the dodge test". She stops and cheers (0.45 s, her only tell), then leaps about 72 px at Sammy. The leap hurts on touch; the cheer and the landing (0.2 s) are harmless. Jump her or step back, then whip her while she's stuck on landing. Two whips. Play Possum confuses her, but she forgets in 0.75 s.
- Camera/view: side view, facing right; mirrored by the game.
- Relative size: about 44 px tall in a 48×48 frame.
- Transparent background: yes — transparent PNG, hard edges, 1-bit transparency only.
- Source/creator/license: TBD (also record in `design/ASSET_SOURCES.csv`).

## Planned files (planned — not yet supplied)

| File (planned — not yet supplied) | Type | Purpose |
|---|---|---|
| `zombie-cheerleader-walk-strip-v01.png` | Production strip | A bouncy skip, 6 frames, 288×48 px |
| `zombie-cheerleader-attack-strip-v01.png` | Production strip | The leap, 4 frames, 192×48 px. **Picked by state, not by a clock:** frame 1 rising, 2 falling, 3 landing; frame 0 is spare |
| `zombie-cheerleader-hit-strip-v01.png` | Production strip | 2 frames, 96×48 px |
| `zombie-cheerleader-defeat-strip-v01.png` | Production strip | The burst, 8 frames, 384×48 px |
| `zombie-cheerleader-idle-strip-v01.png` | Production strip | The cheer, 4 frames, 192×48 px. Also the tell before her leap, and her confused pose |

## Animation
- Frame width × height in pixels: 48 × 48. Pivot / feet baseline: bottom-centre (24, 47), feet on row 47 in every grounded frame.
- One row per file; columns = frames, zero-based, left to right. No padding.

| Animation | Count | FPS | Loop / one-shot | Notes |
|---|---|---|---|---|
| walk | 6 | 8 | loop | a skip (patrol and chase) |
| attack | 4 | by state | — | 1 = rising, 2 = falling (hurts), 3 = landing (harmless); 0 spare |
| hit-react | 2 | 12 | one-shot | drawn with a white flash |
| defeat | 8 | 12 | one-shot | the burst: she comes apart; the game throws the pom-poms and the bow as bits |
| idle | 4 | 6 | loop | the cheer: tell (0.45 s), confused, arena drop-in |

## Behavior (Proposed; numbers in `game/src/config.js` `cheerleader`)
- HP 2. Patrol 36 px/s, chase 70 px/s, notices Sammy within 112 px. Leap from 72 px: 0.45 s cheer, then 170 px/s forward and 190 px/s up (about 0.42 s in the air, 20 px high). Stuck 0.2 s on landing, then 2 s before the next leap. She never leaps where the landing spot isn't ground.
- Body box 16 × 40 px; the leap hurts with the body box (no separate attack box).
- Whip death: `burst` (gag lines `GO TEAM. DEAD.` · `RAH RAH. SHIT.` · `SPIRIT: ZERO.`). Chainsaw: `sliced`.
- Sounds: `sfx-cheer` (the tell), `sfx-leap` (launch); the shared hit and defeat sounds.
