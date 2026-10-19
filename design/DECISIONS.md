# Decisions and assumptions

Record date, decision, supporting asset or requirement, and unresolved questions here. No engine selected yet.

## 2026-10-19: Library review and starter templates

**State of the library**
- `assets/` is empty (only `.gitkeep` files). There is no artwork, audio, or metadata to ingest yet.

**What was recorded or added**
- User-stated facts are recorded under "Confirmed" in `design/GAME_BRIEF.md`: Sammy the opossum, the Central Park wake-up with no memory, humans turned into zombies (humorous, cartoon-graphic slapstick), level-based fighting with interactive objects, power-ups, and special abilities, and a 16-bit Genesis-era look with nostalgic nods.
- Everything else in the brief (camera, controls, Play Possum, scope, gameplay nods) is labeled **Proposed (not approved)**.
- A Genesis-style art/audio spec, new templates, and filled-in examples were added under `templates/`. The examples are deliberately kept **outside** `assets/` so that future ingest runs don't mistake them for real inventory.
- Nostalgic nods are limited to homage through mechanics, feel, palette, structure, and humor. No ripped or traced commercial assets, and no "Sega"/"Genesis" in branding.

**Deliberately not done**
- `design/asset-index.json` was left empty because there are no assets to index.
- `design/ASSET_SOURCES.csv` is unchanged because there are no sources to record.
- No engine was chosen. A small 2D browser game is the likely default (per `CLAUDE.md`) once assets arrive.
- A placeholder-art prototype was offered but not built.

**Open questions for the user**
1. Camera: is side-view 2D action-platformer (proposed) right?
2. Rating and how graphic: cartoon pops and bounces only, or cartoon splatter? Who is the target audience?
3. First release: one Central Park level (proposed), or more?
4. Which era nods to include (see "Gameplay references" in the brief)?
5. Working title.
6. Signature ability: is Play Possum (proposed) the one you want?
7. Controls / platform: keyboard + gamepad, browser-first (proposed) — OK?

## 2026-10-19 — Character name correction
- The opossum's name is **Sammy** (user correction; an earlier draft said "Sanny"). Updated in every design doc, template and example; the example folder is now `templates/examples/character-sammy/`.

## 2026-10-19: Placeholder prototype of level 1 built (user said "make it so")

**Engine: none.** The game is plain HTML5 canvas and JavaScript, using classic `<script>` tags with no build step and no packages. It lives in `game/`.
- **Why:**
  - The brief suggests a browser game first.
  - It can be shared as one static page.
  - Double-clicking `index.html` runs it, because classic scripts work from local files and ES modules and `fetch` don't.
  - A 2D canvas maps directly onto the 320×224 Genesis-style target.
  - The game rules are separate from the drawing, so they're tested in Node without a browser.
- **Revisit if:** the game grows past a few levels or needs a tilemap editor. Phaser or Godot would then be worth the setup cost.

**Built from the proposed examples (none approved):**
- Side-view platformer.
- Level layout from `templates/examples/level-01-sheep-meadow/LEVEL.md`.
- Sammy, jogger, vendor, cart, trash lid and Play Possum values from their example docs.
- Keys Z jump, X tail-whip and C Play Possum, matching the LEVEL.md prompts.

**Open TBDs from the examples, settled in code (all Proposed, easy to change in `game/src/config.js` / `level.js`):**
- 3 hearts, no lives. A K.O. returns Sammy to the last checkpoint with full health.
- Contact damage: touching a walking or attacking jogger hurts. Touching one that is reeling from a hit or confused doesn't.
- Pond: falling in costs 1 heart, ignores the trash lid, and returns Sammy to the last safe ground.
- The cart's spill pushes zombies back without damaging them.
- The trash lid blocks hits from any direction, including thrown hot dogs. Each hit used costs 1 of its 3.
- The optional second trash lid (screen 9) is included.
- Play Possum is not usable mid-air or while hurt. Its cooldown resets on a K.O.
- Zombies that join the gauntlet don't give up the chase.
- Respawn reset rules:
  - Enemies, pickups and the cart after the checkpoint come back.
  - Spilled hot dogs and the shield are lost.
  - The gauntlet resets.
- Sammy can't walk back off the left edge of the screen, and the camera won't scroll back more than 64 px behind the last checkpoint.

**Prototype additions, not in any doc:**
- Zombies ignore Sammy for 1.5 s after he gets up from Play Possum. Without this they re-noticed him instantly and the ability was nearly useless.
- Gauntlet zombies drop in and stand for 0.6 s before they can hurt Sammy, so they can't land straight on him.
- Spilled hot dogs fly far enough to land clear of the tipped cart, where Sammy can reach them.
- A hot dog sits on the screen-11 lamppost before the arena.
- A jogger knocked into the pond disappears and doesn't count toward "zombies defeated" on the tally.
- Placeholder sound effect IDs not in `AUDIO.md`: `sfx-cart-rock`, `sfx-throw`, `sfx-splat`, `sfx-splash`, `sfx-shield-block`, `sfx-shield-break`, `sfx-checkpoint`, `sfx-gate-open`, `sfx-level-clear`, `sfx-start`.

**Placeholders:**
- All art is coded shapes, with "PLACEHOLDER ART – NOT FINAL" always on screen.
- All sound is code-generated beeps plus a short loop.
- Real files load automatically once they exist under the planned names. Run `node game/tools/scan-assets.mjs` after adding them.
- The tile sheet isn't wired up; it needs a tile map first.

**Sound file support (added 2026-10-19):**
- Real sound files replace placeholder beeps one at a time, the same way art does. Each sound lives in `assets/audio/<sfx|music>/<id>/<id>-v01.ogg`, following `AUDIO.md`.
- Files play through plain `<audio>` elements, not WebAudio buffers. Browsers block the WebAudio loading route when `index.html` is opened by double-click, and double-click is the main way to play.
- Formats: `.ogg` preferred, then `.mp3`, then `.wav`. A `.wav` beside an `.ogg`/`.mp3` of the same sound is the master copy and is skipped.
- Variations use `-a`, `-b`, … after the version (`sfx-land-v01-a.ogg`). This reads `AUDIO.md`'s "variations as -a, -b, -c" literally. A higher version number replaces a lower one.
- New planned music ID, not in `AUDIO.md`: `music-level-01-gauntlet` (AUDIO.md says the gauntlet "may switch to a faster track — TBD"). Without it the level music continues through the gauntlet.
- Music loops the whole file. `AUDIO.md`'s intro + loop-point layout is not supported yet.
- Volumes are new config values: music 0.6, sound effects 0.8 (music under the effects, per `AUDIO.md`).

**Not done / open:**
- Difficulty is untested with people. An autopilot taking normal damage loses in the gauntlet.
- Gamepad, audio quality, Safari, Firefox and touch weren't tested. Real sound files were tested for loading and playing in headless Chromium, not by ear.
- Nothing was published or uploaded.
