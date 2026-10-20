# Asset metadata — Sammy (example)

> **EXAMPLE ONLY — planning spec, not a finished asset.** Run the scanner to see which files exist. Don't copy this into assets/ until every TBD is filled in.

How to read this example:

- **Confirmed** = things you have already told us (Sammy is an opossum, "he", wakes up in Central Park with no memory, fights zombies through levels with objects, power-ups, and special abilities, 16-bit console look).
- **Proposed** / **Example** = suggestions to show the level of detail that helps Claude Code. Change anything you like. Nothing marked Proposed is decided.
- For this character you would copy this file to `assets/characters/character-sammy/ASSET.md`.

---

- Asset ID: `character-sammy`
- Display name: Sammy
- Category: character
- Files and purpose: see **Planned files** below. All 13 animation strips exist as `-v02.png` files since 2026-10-20 (cut from the owner's two master sheets with the art importer); run the scanner to see which files exist.
- Readiness: TBD — Example: the model sheet would be `reference`; each animation strip would be `ready` once it matches the frame rules below, or `needs-preparation` if frames are uneven.
- Visual description: Confirmed: an opossum, male ("he"). Example wording to replace with yours: "Grey-white fur, white face, pink nose, black rounded ears, black legs, long bare pink tail. Slightly scruffy, wide-eyed and confused but scrappy. Small torn bandana (proposed) to read clearly at small size."
- Intended role in the game: Confirmed: the playable hero. He wakes in Central Park with no memory and fights through each level using interactive objects, power-ups, and special abilities.
- Camera/view: Proposed: side-view (2D platformer/brawler), Sammy drawn in profile facing right.
- Relative size: Proposed: Sammy is about 32–40 px tall inside a 48×48 px frame on a 320×224 px screen (roughly one-sixth of the screen height). Human zombies are a bit taller than he is.
- Transparent background: Proposed: yes — transparent PNG, hard edges, 1-bit transparency only (each pixel fully see-through or fully solid; no soft/semi-transparent edges, no anti-aliasing against the background).
- Source/creator/license: TBD — Example: "Drawn by [your name], 2026, owned by me, OK to ship." Also record in `design/ASSET_SOURCES.csv`.

## Planned files (all 13 strips supplied as v02 on 2026-10-20)

| File (planned) | Type | Purpose |
|---|---|---|
| `sammy-reference-v01.png` | Reference / model sheet | Turnaround (side, front, back, 3/4) and size notes. Used to keep the look consistent. Not used in the game directly. |
| `palette-line-0-sammy-hud-v01.png` | Palette swatch | The 15 colors (plus transparent) Sammy and the HUD may use. One row of 16 squares. Saved in `assets/ui/palettes/` with the other palette sheets, not in Sammy's folder. |
| `sammy-expressions-v01.png` | Reference (optional) | Portrait/face sheet — see "Expression/portrait sheet (optional)". |
| `sammy-idle-strip-v01.png` | Production strip | 4 frames, 192×48 px |
| `sammy-run-strip-v01.png` | Production strip | 8 frames, 512×48 px (64×48 cells, feet (36, 47): the run is a four-legged crawl, long and low; v02 is the real one) |
| `sammy-jump-rise-strip-v01.png` | Production strip | 2 frames, 96×48 px |
| `sammy-fall-strip-v01.png` | Production strip | 2 frames, 96×48 px |
| `sammy-land-strip-v01.png` | Production strip | 2 frames, 96×48 px (feet (28, 47) again since v03; v02's frames lunged forward with the feet at (17, 47)) |
| `sammy-tail-whip-strip-v01.png` | Production strip | 4 frames, 256×48 px (wider 64×48 cells, see below) |
| `sammy-hurt-strip-v01.png` | Production strip | 2 frames, 96×48 px |
| `sammy-play-dead-strip-v01.png` | Production strip | 4 frames, 256×48 px (64×48 cells, feet (32, 47): lying down is long) |
| `sammy-ko-strip-v01.png` | Production strip | 6 frames, 456×48 px (76×48 cells, feet (38, 47): the tumble and the slide are long) |
| `sammy-victory-strip-v01.png` | Production strip | 4 frames, 192×48 px |
| `sammy-wake-up-strip-v01.png` | Production strip (polish tier) | 6 frames, 288×48 px |
| `sammy-chainsaw-idle-strip-v01.png` | Production strip (Stage B, Proposed) | 4 frames, 256×48 px (64×48 cells, feet (26, 47), holding the chainsaw) |
| `sammy-chainsaw-run-strip-v01.png` | Production strip (Stage B, Proposed) | 8 frames, 512×48 px (64×48 cells, feet (26, 47)) |
| `sammy-chainsaw-rev-strip-v01.png` | Production strip (Stage B, Proposed) | 4 frames, 304×48 px (76×48 cells, feet (26, 47): the lifted saw reaches 47 px in front; saw revving and shaking) |
| `sammy-source-v01.aseprite` (or .psd / .kra) | Layered source | Your working file. Kept as the original; never overwritten. |

Strip width = frame count × cell width (with no padding). Most cells are 48×48 with the feet point at (28, 47). The wider cells, each with its own feet point so Sammy's body stays in the same place on screen (updated 2026-10-20 when every strip was rebuilt from the master sheets): run 64×48, feet (36, 47) (the four-legged crawl is long and low); tail-whip 64×48, feet (36, 47); play-dead 64×48, feet (32, 47); ko 76×48, feet (38, 47); chainsaw idle and run 64×48, feet (26, 47), because the saw bar reaches 37 px in front of the feet (the cutting reach is 28); chainsaw rev 76×48 with the same feet column (26, 47), because the lifted saw reaches 47 px in front (since v03, 2026-10-20; it was 64 wide and two frames had to slide). Land is a plain 48×48 cell with the feet at (28, 47) again since v03 (v02's two frames lunged forward and had them at (17, 47)).

## Reference vs production

- A **model sheet / contact sheet** (`sammy-reference-v01.png`, planned) is **reference**: it shows what Sammy looks like, but poses are not aligned to a grid, may have labels or a background, and are not cut into game frames. Claude Code will not treat it as a sprite sheet.
- The **per-animation strips** (planned) are **production**: every frame the same 48×48 size, same baseline, transparent, in order. These go straight into the game.
- If you only have a contact sheet at first, that is fine — mark it `reference` and list which strips are still missing. Claude Code can use clearly labeled placeholders until the strips arrive.

## Animation (if applicable)
- File: one strip per animation (see Planned files).
- Frame width × height in pixels: Proposed: 48 × 48 for most animations; **64 × 48** for tail-whip (the whip reaches 26 px in front of the feet point), run, play-dead and the chainsaw strips; **76 × 48** for ko. Cells and feet points per strip are in the table above and in `game/src/assets.js`.
- Grid columns / rows: one row per file; columns = frame count (e.g. run = 8 columns × 1 row).
- Frame count and reading order: left to right, starting at frame 0. Counts in the table below.
- Padding / spacing: Proposed: none (frames touch). If you prefer 1 px gaps between frames, say "1 px padding" here.
- Pivot / feet baseline: Proposed: pixel (28, 47) counting from 0 at the top-left in the 48-wide cells (4 px right of centre, so the tail has room behind him). In every grounded frame the feet touch row 47 (the bottom row). Jump/fall frames may lift off that row. Wider cells have their own feet column (run and tail-whip (36, 47), play-dead (32, 47), ko (38, 47), chainsaw idle and run (26, 47), chainsaw rev 76 wide (26, 47)); land uses (28, 47) too (since v03; v02 had (17, 47)). The feet column is where Sammy's body stands, so he never hops sideways when the animation changes; the run is drawn lower (a crawl, about 30 px tall) on purpose.
- Animation names and frame ranges (state whether zero- or one-based): zero-based — see table.
- Frames per second per animation: see table.
- Looping / one-shot: see table.
- Facing directions and whether mirroring is allowed: Proposed: drawn facing RIGHT; the game flips him for left. Example note if needed: "Do not mirror — the bandana knot is always on his left side." (Replace or delete.)

### Animation table (Proposed)

| Animation | Frames (zero-based, within its strip) | Count | FPS | Loop / one-shot | Notes |
|---|---|---|---|---|---|
| idle | 0–3 | 4 | 6 | loop | Breathing; tail sways. |
| run | 0–7 | 8 | 12 | loop | A four-legged crawl (owner's choice, 2026-10-19), about 30 px tall. 64×48 cells, pivot (36, 47). Feet on row 47. |
| jump-rise | 0–1 | 2 | 10 | one-shot, hold last frame | Holds frame 1 while going up. |
| fall | 0–1 | 2 | 10 | loop | Tail/fur flutter. |
| land | 0–1 | 2 | 15 | one-shot | Squash on frame 0. Returns to idle/run. Pivot (28, 47) like idle (since v03; v02's frames lunged forward at (17, 47)). Today the fall crouch is held for both frames; two real landing frames are still wanted. |
| tail-whip (attack) | 0–3 | 4 | 15 | one-shot | **Hit frame = 2** (the frame where damage happens). 0–1 wind-up, 3 recovery. 64×48 cells, pivot (36, 47). |
| hurt | 0–1 | 2 | 10 | one-shot | Knock-back flinch; a white/flash frame can be done in code. |
| play-dead | 0–3 | 4 | 8 | one-shot, then hold frame 3 | Drops, rolls over, tongue out (Example). Used by the "Play Possum" ability. 64×48 cells, pivot (32, 47). |
| ko (defeat) | 0–5 | 6 | 10 | one-shot | Comic faint, stars/birds optional as separate effect. 76×48 cells, pivot (38, 47). |
| victory | 0–3 | 4 | 8 | loop | End-of-level celebration. |
| wake-up (intro) | 0–5 | 6 | 6 | one-shot | Polish tier. Opening scene: Sammy wakes on the grass, confused. |

At 15 fps, one frame lasts about 67 ms; at 6 fps, about 167 ms. A 4-frame attack at 15 fps takes about a quarter of a second.

## Behavior
- What this asset does: Confirmed: the player character. Proposed: runs, jumps, tail-whips zombies, picks up power-ups, uses interactive objects, and has one signature ability.
- What triggers it: player input. Proposed controls (not decided): arrows/D-pad to move, one button jump, one button attack, one button special.
- What the player can do with it: Proposed signature ability **"Play Possum"** (proposal, not approved): Sammy drops and plays dead; nearby zombies lose track of him for a short time. Example values: lasts up to 3 s (cancel after 0.5 s); 6 s cooldown after he gets up; Sammy cannot move while playing dead; zombies within 96 px wander off — see the `ability-play-possum` example.
- Collision / hitbox intent: Proposed: body hitbox narrower than the drawing so near-misses feel fair — Example: 20 px wide × 30 px tall, centered on the pivot, standing on row 47. Tail-whip hitbox only on hit frame 2: 20 × 12 px, from 6 to 26 px in front of his feet point and 10 to 22 px above the ground (as in `game/src/config.js`). While playing dead, body hitbox lowers to Example: 28 × 14 px.
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
