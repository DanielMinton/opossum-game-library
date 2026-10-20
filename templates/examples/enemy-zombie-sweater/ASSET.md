# Asset metadata — Zombie Sweater (example)

> **EXAMPLE ONLY — planning spec, not a finished asset.** Run the scanner to see which files exist. Don't copy this into assets/ until every TBD is filled in.

How to read this example: **Confirmed** (owner, 2026-10-20) = the sweater is one of four distinct zombie types that go in level 1, each in a contrasting colour scheme; the game is full gore. Everything else (behaviour, numbers, frames) is **Proposed** from `design/ZOMBIE-ROSTER-AND-BOSSES.md` section 2.4. For the real files you would copy this to `assets/enemies/enemy-zombie-sweater/ASSET.md`.

---

- Asset ID: `enemy-zombie-sweater`
- Display name: Zombie Sweater ("the brawler")
- Category: enemy
- Files and purpose: see **Planned files** below (all planned — not yet supplied; the owner's sheet is being cut by the importer separately).
- Readiness: TBD — `ready` once the strips below are installed with their license rows.
- Visual description: a big heavy zombie in a loud zigzag sweater (gold, purple, teal), a rubber duck on a chain round his neck, torn teal trousers, pink bunny slippers, exposed pink brain, one eyeball hanging out, dark brown skin, wide grin. Colour scheme: **gold knit with purple and teal zigzags** over brown skin: no greys, no reds, so he reads apart from Sammy, the jogger and the purple-and-olive hippie.
- Intended role in the game: the big one. Three whips, **never flinches** (a hit flashes him white and changes nothing), and his two-handed shove throws Sammy twice as far as a jogger's bump and knocks the trash lid clean off (every charge in one go). Play Possum fools him, but he walks over and stands over Sammy ("sniffs"), 32 px away.
- Camera/view: side-view profile, facing right (the game mirrors him).
- Relative size: about 52 px tall in a 64×56 cell, feet at (32, 55). The bigger cell is the point: he must loom over the 44-46 px zombies.
- Transparent background: yes — transparent PNG, hard edges, 1-bit transparency only.
- Source/creator/license: TBD (also record in `design/ASSET_SOURCES.csv`).

## Planned files (planned — not yet supplied)

| File (planned — not yet supplied) | Size | Purpose |
|---|---|---|
| `zombie-sweater-walk-strip-v01.png` | 6 × 64×56 | Plod (patrol, chase, the sniff walk-up), 6 fps, loop |
| `zombie-sweater-attack-strip-v01.png` | 4 × 64×56 | Two-handed shove, 8 fps, hit frame 2 (frames 0-1 = both arms up, the tell) |
| `zombie-sweater-hit-strip-v01.png` | 2 × 64×56 | Hit pose (shown as the white flash; he never reels), 12 fps |
| `zombie-sweater-defeat-strip-v01.png` | 8 × 64×56 | The flop (topples backwards into a heap), 10 fps |
| `zombie-sweater-idle-strip-v01.png` | 4 × 64×56 | Standing (sniffing over Sammy, arena drop-in), 6 fps |

## Animation

- One strip per animation, frames side by side, zero-based, no padding. Cell 64 × 56, feet point (32, 55) in every grounded frame.
- Drawn facing right; mirroring allowed.

| Animation | Count | FPS | Loop / one-shot | Notes |
|---|---|---|---|---|
| walk | 6 | 6 | loop | A plod: the 4 drawn poses out and back (1 2 3 4 3 2). |
| attack | 4 | 8 | one-shot | Frames 0-1 both arms up (0.25 s: the tell, step back or jump); **hit frame = 2** (both arms out, the shove). |
| hit | 2 | 12 | one-shot | Only ever drawn as the white flash. |
| defeat | 8 | 10 | one-shot | The flop. The game throws out both bunny slippers and the rubber duck as code-drawn bits. |
| idle | 4 | 6 | loop | |

## Behavior (Proposed; the numbers live in `game/src/config.js`, block `sweater`)

- Brain: walker (patrol, chase, shove, go down), with `flinch: false` and the `sniff` reaction to Play Possum.
- HP 3 · patrol 22 px/s · chase 50 px/s · notices Sammy within 100 px · attack range 32 px · attack 0.5 s, hit frame 2, cooldown 1.5 s.
- Body 24 × 48 px; shove box 24 × 26 starting 36 px above the feet (his arms are high).
- No knockback from the whip, the saw or the cart; the lid doesn't push him back either.
- The shove throws Sammy 240 px/s sideways and 150 up (a jogger's bump: 120 and 150). If the lid blocks it, the lid loses **every** charge, Sammy is still thrown, and no heart is lost. A plain bump (touching him) is an ordinary jogger-style hit.
- Play Possum: **sniff**. He walks over at patrol speed, stops 32 px from Sammy (his 24 px body never touches Sammy's 28 px lying body), faces him and stands there. When Sammy gets up, the usual 1.5 s of grace.
- Deaths: whip = **flop** (lines `BUNNY DOWN.` · `FASHION VICTIM.` · `NICE SWEATER.`); chainsaw = sliced (the biggest body in the level cut in half).
- Sounds: `sfx-zombie-shove` when the shove lands, `sfx-zombie-sniff` when he reaches a playing-dead Sammy.
- Suggested prompt where he stands (level placement, not part of this asset): `BIG LAD. HE WANTS YOUR LID.`

## Palette

Uses the enemy palette line (15 colours + transparent). Reserved gore colours (`blood*`, `ichor*`, `bone`, `meat` in `S.PAL`) must not appear in the strips; his goo is magenta-pink, not ichor green.
