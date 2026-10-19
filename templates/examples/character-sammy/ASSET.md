# Asset metadata — Sammy (example)

> **EXAMPLE ONLY — not a real asset. No files listed here exist yet.** Copy into assets/<category>/<asset-id>/ and replace with your real details.

How to read this example:

- **Confirmed** = things you have already told us (Sammy is an opossum, "he", wakes up in Central Park with no memory, fights zombies through levels with objects, power-ups, and special abilities, 16-bit console look).
- **Proposed** / **Example** = suggestions to show the level of detail that helps Claude Code. Change anything you like. Nothing marked Proposed is decided.
- For this character you would copy this file to `assets/characters/character-sammy/ASSET.md`.

---

- Asset ID: `character-sammy`
- Display name: Sammy
- Category: character
- Files and purpose: see **Planned files** below (all planned — not yet supplied).
- Readiness: TBD — Example: the model sheet would be `reference`; each animation strip would be `ready` once it matches the frame rules below, or `needs-preparation` if frames are uneven.
- Visual description: Confirmed: an opossum, male ("he"). Example wording to replace with yours: "Grey-white fur, white face, pink nose, black rounded ears, black legs, long bare pink tail. Slightly scruffy, wide-eyed and confused but scrappy. Small torn bandana (proposed) to read clearly at small size."
- Intended role in the game: Confirmed: the playable hero. He wakes in Central Park with no memory and fights through each level using interactive objects, power-ups, and special abilities.
- Camera/view: Proposed: side-view (2D platformer/brawler), Sammy drawn in profile facing right.
- Relative size: Proposed: Sammy is about 32–40 px tall inside a 48×48 px frame on a 320×224 px screen (roughly one-sixth of the screen height). Human zombies are a bit taller than he is.
- Transparent background: Proposed: yes — transparent PNG, hard edges, 1-bit transparency only (each pixel fully see-through or fully solid; no soft/semi-transparent edges, no anti-aliasing against the background).
- Source/creator/license: TBD — Example: "Drawn by [your name], 2026, owned by me, OK to ship." Also record in `design/ASSET_SOURCES.csv`.

## Planned files (planned — not yet supplied)

| File (planned — not yet supplied) | Type | Purpose |
|---|---|---|
| `sammy-reference-v01.png` | Reference / model sheet | Turnaround (side, front, back, 3/4) and size notes. Used to keep the look consistent. Not used in the game directly. |
| `palette-line-0-sammy-hud-v01.png` | Palette swatch | The 15 colors (plus transparent) Sammy and the HUD may use. One row of 16 squares. |
| `sammy-expressions-v01.png` | Reference (optional) | Portrait/face sheet — see "Expression/portrait sheet (optional)". |
| `sammy-idle-strip-v01.png` | Production strip | 4 frames, 192×48 px |
| `sammy-run-strip-v01.png` | Production strip | 8 frames, 384×48 px |
| `sammy-jump-rise-strip-v01.png` | Production strip | 2 frames, 96×48 px |
| `sammy-fall-strip-v01.png` | Production strip | 2 frames, 96×48 px |
| `sammy-land-strip-v01.png` | Production strip | 2 frames, 96×48 px |
| `sammy-tail-whip-strip-v01.png` | Production strip | 4 frames, 192×48 px |
| `sammy-hurt-strip-v01.png` | Production strip | 2 frames, 96×48 px |
| `sammy-play-dead-strip-v01.png` | Production strip | 4 frames, 192×48 px |
| `sammy-ko-strip-v01.png` | Production strip | 6 frames, 288×48 px |
| `sammy-victory-strip-v01.png` | Production strip | 4 frames, 192×48 px |
| `sammy-wake-up-strip-v01.png` | Production strip (polish tier) | 6 frames, 288×48 px |
| `sammy-source-v01.aseprite` (or .psd / .kra) | Layered source | Your working file. Kept as the original; never overwritten. |

Strip width = frame count × 48 px (with no padding).

## Reference vs production

- A **model sheet / contact sheet** (`sammy-reference-v01.png`, planned) is **reference**: it shows what Sammy looks like, but poses are not aligned to a grid, may have labels or a background, and are not cut into game frames. Claude Code will not treat it as a sprite sheet.
- The **per-animation strips** (planned) are **production**: every frame the same 48×48 size, same baseline, transparent, in order. These go straight into the game.
- If you only have a contact sheet at first, that is fine — mark it `reference` and list which strips are still missing. Claude Code can use clearly labeled placeholders until the strips arrive.

## Animation (if applicable)
- File: one strip per animation (see Planned files — planned, not yet supplied).
- Frame width × height in pixels: Proposed: 48 × 48 for every frame of every animation.
- Grid columns / rows: one row per file; columns = frame count (e.g. run = 8 columns × 1 row).
- Frame count and reading order: left to right, starting at frame 0. Counts in the table below.
- Padding / spacing: Proposed: none (frames touch). If you prefer 1 px gaps between frames, say "1 px padding" here.
- Pivot / feet baseline: Proposed: bottom-center of the frame, pixel (24, 47) counting from 0 at the top-left. In every grounded frame the feet touch row 47 (the bottom row). Jump/fall frames may lift off that row.
- Animation names and frame ranges (state whether zero- or one-based): zero-based — see table.
- Frames per second per animation: see table.
- Looping / one-shot: see table.
- Facing directions and whether mirroring is allowed: Proposed: drawn facing RIGHT; the game flips him for left. Example note if needed: "Do not mirror — the bandana knot is always on his left side." (Replace or delete.)

### Animation table (Proposed)

| Animation | Frames (zero-based, within its strip) | Count | FPS | Loop / one-shot | Notes |
|---|---|---|---|---|---|
| idle | 0–3 | 4 | 6 | loop | Breathing; tail sways. |
| run | 0–7 | 8 | 12 | loop | Feet on row 47 on contact frames. |
| jump-rise | 0–1 | 2 | 10 | one-shot, hold last frame | Holds frame 1 while going up. |
| fall | 0–1 | 2 | 10 | loop | Tail/fur flutter. |
| land | 0–1 | 2 | 15 | one-shot | Squash on frame 0. Returns to idle/run. |
| tail-whip (attack) | 0–3 | 4 | 15 | one-shot | **Hit frame = 2** (the frame where damage happens). 0–1 wind-up, 3 recovery. |
| hurt | 0–1 | 2 | 10 | one-shot | Knock-back flinch; a white/flash frame can be done in code. |
| play-dead | 0–3 | 4 | 8 | one-shot, then hold frame 3 | Drops, rolls over, tongue out (Example). Used by the "Play Possum" ability. |
| ko (defeat) | 0–5 | 6 | 10 | one-shot | Comic faint, stars/birds optional as separate effect. |
| victory | 0–3 | 4 | 8 | loop | End-of-level celebration. |
| wake-up (intro) | 0–5 | 6 | 6 | one-shot | Polish tier. Opening scene: Sammy wakes on the grass, confused. |

At 15 fps, one frame lasts about 67 ms; at 6 fps, about 167 ms. A 4-frame attack at 15 fps takes about a quarter of a second.

## Behavior
- What this asset does: Confirmed: the player character. Proposed: runs, jumps, tail-whips zombies, picks up power-ups, uses interactive objects, and has one signature ability.
- What triggers it: player input. Proposed controls (not decided): arrows/D-pad to move, one button jump, one button attack, one button special.
- What the player can do with it: Proposed signature ability **"Play Possum"** (proposal, not approved): Sammy drops and plays dead; nearby zombies lose track of him for a short time. Example values: lasts up to 3 s (cancel after 0.5 s); 6 s cooldown after he gets up; Sammy cannot move while playing dead; zombies within 96 px wander off — see the `ability-play-possum` example.
- Collision / hitbox intent: Proposed: body hitbox narrower than the drawing so near-misses feel fair — Example: 20 px wide × 30 px tall, centered on the pivot, standing on row 47. Tail-whip hitbox only on hit frame 2, Example: 20 × 12 px in front of him. While playing dead, body hitbox lowers to Example: 28 × 14 px.
- Damage, reward, cooldown, or other values: TBD — Example: 3 hearts; tail-whip deals 1 damage; 1 s invincibility (blinking) after being hurt.
- Required sounds / effects: Example list (all TBD): jump, land, tail-whip swoosh, tail-whip hit, hurt squeak, play-dead "flop", KO jingle, victory jingle, footsteps (optional). Effects: dust puff on landing, hit spark, "Zzz/?" bubble while playing dead.
- Missing states or assets: Example of what to list: crouch, climb, wall/ledge grab, swim, pick up/carry, throw, power-up variants (e.g. holding the trash-lid shield from `item-powerup-trash-lid-shield`), damage-flash palette, idle "bored" animation, portrait for dialogue. Mark each as "blocks play" or "polish".
- Details that must be preserved: Example only — replace with yours: pink nose, bare pink tail (no fur on the tail), rounded black ears, white face with dark eye patches, the bandana color. These are details Claude Code must not "simplify away" when making placeholders or resizing.

## 16-bit console look (Proposed targets for Sammy)

These are style targets to imitate, not hard limits. Detail lives in `design/` docs.

- Native screen 320×224 px, scaled up by whole numbers (×3 or ×4) with sharp pixels.
- Colors: Sammy + HUD share one 16-slot palette line (slot 0 = transparent, so **15 usable colors**). Snap each red/green/blue value to 0, 36, 72, 108, 144, 180, 216, or 252.
- Hard pixel edges; shading ramps and dithering are fine; no blur or soft transparency.
- Draw your own Sammy. Homage to classic-era games through feel and humor is great; don't trace or copy sprites or characters from existing games.

## Expression/portrait sheet (optional)

- Planned file: `sammy-expressions-v01.png` (planned — not yet supplied).
- Example: 6 face portraits at 48×48 px (64×64 optional), in one row, zero-based: 0 neutral, 1 confused (wake-up), 2 determined, 3 scared, 4 smug/victory, 5 dizzy/KO.
- Use: dialogue boxes, intro scene, level-complete screen. Polish tier — not needed for the first playable build.
- Same palette line as Sammy if shown during gameplay.
