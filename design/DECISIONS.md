# Decisions and assumptions

Record date, decision, supporting asset or requirement, and unresolved questions here. Engine: none — the game is plain HTML5 canvas and JavaScript (see "Placeholder prototype of level 1 built" below). *(Updated 2026-10-19; this line used to say "No engine selected yet".)*

## Current state (2026-10-19)

- **What exists:** a playable placeholder version of level 1 (Sheep Meadow) in `game/`. Open `game/index.html` to play. It has Sammy, two zombie types (jogger and hot dog vendor), the hot dog cart, the trash-lid shield, Play Possum, a pond, two checkpoints and a 3-wave gauntlet. A shareable one-file copy is in `game/dist/`.
- **What's placeholder:** all art (coloured boxes) and all sound (code-made beeps). No real art or sound has been supplied yet; `assets/` holds empty folders only. Real files replace placeholders one at a time when added (see `game/README.md`).
- **What's still only proposed:** every gameplay number, size and rule. They come from the examples in `templates/examples/`, plus the choices listed below. Nothing has been approved.
- **What's next:** the owner answers the questions in `design/OWNER_DECISIONS.md`, reviews the draft style guide in `design/STYLE_GUIDE.md`, and supplies the Tier 1 items in `design/ASSET_REQUEST_CHECKLIST.md`. Then a playtest, mainly of the gauntlet.
- **Decisions only the owner can make:** `design/OWNER_DECISIONS.md`.
- **Confirmed major priority, not built yet:** the game must look beautiful and play well on desktop **and** on phones and tablets. See "Desktop and mobile confirmed" below.

## 2026-10-19: Desktop and mobile confirmed as a major priority

**Decision (Confirmed by the owner):** the game must render beautifully and be fully playable on desktop and on mobile devices (phones and tablets). The owner says this was intended from the start; earlier docs had wrongly proposed "touch later, if at all" and listed touch controls as excluded. Those lines are corrected in `design/GAME_BRIEF.md`.

**Where the prototype stands today (checked with screenshots at 390×844 and 844×390, common phone sizes):**
- **Too small on phones.** Scaling uses whole numbers of *screen points*, so on a phone the game is stuck at its smallest size (×1): a small strip with big black borders. In landscape it uses about 320 of 844 points of width.
- **Not playable on phones.** There are no touch controls, and phones have no keyboard.
- **Phones can't double-click a file.** On mobile, the game has to be opened from a website (for example itch.io or GitHub Pages). Double-click still works on desktop.

**Work this needs (Proposed order, none built yet):**
1. Sharper, bigger scaling: count whole-number steps in the screen's real pixels (phones have 2–3 real pixels per point), so the game fills far more of the screen and stays crisp.
2. On-screen touch controls (move, jump, tail-whip, Play Possum, pause) that appear only on touch screens and sit outside or beside the picture where possible.
3. Phone layout: landscape play, a "turn your phone sideways" prompt in portrait, full-screen button, respect for notches and rounded corners, no accidental scrolling or zooming.
4. Sound: start sound on the first tap (phones block sound until the player touches the screen).
5. Checks: automatic browser checks at phone sizes with touch, plus tests on a real iPhone and Android phone.
6. Art impact: text and the HUD must stay readable at phone sizes (another reason for the planned 8×8 font).

## 2026-10-19: Library review and starter templates

**State of the library**
- `assets/` is empty (only `.gitkeep` files). There is no artwork, audio, or metadata to ingest yet.

**What was recorded or added**
- User-stated facts are recorded under "Confirmed" in `design/GAME_BRIEF.md`: Sammy the opossum, the Central Park wake-up with no memory, humans turned into zombies (humorous, cartoon-graphic slapstick), level-based fighting with interactive objects, power-ups, and special abilities, and a 16-bit Genesis-era look with nostalgic nods.
- Everything else in the brief (camera, controls, Play Possum, scope, gameplay nods) is labeled **Proposed (not approved)**.
- A Genesis-style art/audio spec, new templates, and filled-in examples were added under `templates/`. The examples are deliberately kept **outside** `assets/` so that future ingest runs don't mistake them for real inventory.
- Nostalgic nods are limited to homage through mechanics, feel, palette, structure, and humor. No ripped or traced commercial assets, and no "Sega"/"Genesis" in branding.

**Deliberately not done**
- `design/asset-index.json` was left empty because there are no assets to index. *(Superseded 2026-10-19: removed, with its schema, during the review fixes. Nothing read them; the art and sound list now lives in `game/src/assets.js`.)*
- `design/ASSET_SOURCES.csv` is unchanged because there are no sources to record.
- No engine was chosen. A small 2D browser game is the likely default once assets arrive. *(Superseded: later the same day the game was built with no engine, in plain canvas; see below. This line first said "per `CLAUDE.md`", but there was no `CLAUDE.md` in the library then. The current `CLAUDE.md` was written on 2026-10-19 as part of the review fixes.)*
- A placeholder-art prototype was offered but not built. *(Superseded: it was built later that day; see "Placeholder prototype of level 1 built".)*

**Open questions for the user**
1. Camera: is side-view 2D action-platformer (proposed) right?
2. Rating and how graphic: cartoon pops and bounces only, or cartoon splatter? Who is the target audience?
3. First release: one Central Park level (proposed), or more?
4. Which era nods to include (see "Gameplay references" in the brief)?
5. Working title.
6. Signature ability: is Play Possum (proposed) the one you want?
7. Controls / platform: keyboard + gamepad, browser-first (proposed) — OK?

*(2026-10-19: the up-to-date list of open owner questions is now `design/OWNER_DECISIONS.md`.)*

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

## 2026-10-19: Review fixes

Bug fixes from a code review. Each choice below is **Proposed (reversible)**.

**Step 2: gameplay bugs**
- **R works on the pause screen.** It restarts the level and unpauses. Before, only Enter did anything while paused.
- **Mid-air finish:** reaching the exit in the air now lets Sammy fall and land. He keeps the victory pose while falling, and he doesn't drift sideways.
- **Play Possum "ready" flash:** the PP icon flashes for 1 s every time the cooldown ends (`possum.readyFlash` in `config.js`). Before, it flashed only during the first 30 s of play. There is no flash at the start of the level, because the cooldown hasn't ended yet.
- **HUD bar is 16 px tall (was 14 px)** so the 16×16 trash-lid icon fits. The shield pips moved to the right of the icon. Text and the tutorial prompt moved down 1–2 px to match.
- **Mirrored sprites:** a sprite facing left now flips around its feet point, not 1 px to the left of it.
- **Falling off the world vs. the pond:** only the pond splashes. A fall into a dry pit (none in level 1 today) still costs 1 heart, but there's no splash. The "last safe spot" Sammy returns to is now at least 24 px from any pit edge, not just the pond, and only where the middle of his feet is on solid ground.
- **Music on pause:** the placeholder tune now carries on from where it was paused instead of starting over. Pressing R on the pause screen continues a real music file that was already playing, the same as R during play. The placeholder tune starts over, as before.

**Step 3: art and audio requests match what the game can do**
- **Music:** the requests now say music loops whole, end-to-start, with no separate intro, because loop points aren't built. The other option was building loop-point support now; it can still be added later, and then the "intro + loop" ask comes back.
- **Audio formats:** send OGG (plus MP3 for older Safari), or just WAV masters. The new `game/tools/convert-audio.mjs` makes an `.ogg` beside each `.wav` that has none (`--mp3` adds any missing `.mp3`, even when the `.ogg` already exists, so running it again with `--mp3` later works). It only adds files, and needs ffmpeg; without it, it prints the commands. When ffmpeg has no libvorbis (like the Homebrew build on this machine), it uses ffmpeg's built-in Vorbis encoder, which makes stereo files of slightly lower quality.
- **Parallax rows:** the game now uses the tileset doc's rows (skyline 80–143, trees 144–175, bushes 176–207, no overlap) instead of its old overlapping rows (96 / 144 / 160). Each band's row, speed and loop width now live in the `bg:` entries of `game/src/assets.js`. The placeholder shapes were moved to fit inside their rows. The other option was changing the doc to match the old code, but overlapping bands can't be done on the real hardware the look is based on.
- **Tail-whip frames are 64×48 (feet point (32, 47)), strip 256×48.** Only this strip changes; every other Sammy strip stays 48×48. The whip reaches 26 px in front of Sammy's feet point and a 48 px frame only has 23 px. Gameplay reach is unchanged. The other option was shortening the whip to fit 48 px.
- **Placeholder font:** M and W are now 5 px wide and N 4 px, so they no longer look like H. Text is a few pixels wider; nothing was rewritten.
- **8×8 font limit:** an 8×8 font fits 40 characters across the screen. Four lines of game text are longer than 38 characters. When the real font arrives, either those lines get shorter or a second, smaller font is used. That's the owner's call.
- **Docs now match the code** (code was treated as correct): jogger attack hitbox 16×20 px, 6–26 px above the ground; trash-lid pickup feet point (8, 15) and 16×16 pickup box; hot dog pickup spin 8 fps; the held lid's fixed hand point.
- **Folders:** `assets/ui/palettes/`, `assets/ui/ui-font-8x8/`, `assets/ui/ui-hud/`, `design/abilities/`, `design/levels/` and `work/` stay the planned homes and are made when their first file arrives. All palette sheets go in `assets/ui/palettes/` (including Sammy's line 0). A power-up's HUD icon goes in that power-up's folder; hearts and ability icons go in `assets/ui/ui-hud/`.

**Step 4: art pipeline**
- **Art versions:** the scanner picks the highest `-vNN.png` for each planned file, like sound already did. Older versions stay in the folder and aren't flagged. The license row must name the exact version that ships.
- **License allowlist:** the build ships a file only when `commercial_use` is `yes` and the license is filled in and isn't non-commercial or reference-only. Before, anything not marked "no" or "unknown" shipped, so "CC-BY-NC" or a "yes" on a reference image got through. Rules live in `game/tools/licenses.mjs`.
- **CREDITS.txt is always written** to `game/dist/`, saying "No file in this build needs a credit line" when none do. The other option was writing it only when needed; always having it makes it obvious where credits go.
- **Wrong-size art is not used.** The placeholder stays, the console says why, and the title screen shows "ART WARNINGS: N - SEE CONSOLE". The other option was drawing it anyway, which cuts it into frames wrongly.
- **Hit flash on real art:** for the whole hurt / hit-react state, an all-white copy of the strip's current frame is drawn, the same length as the placeholder flash (Sammy 0.2 s, zombies 0.17 s). The other option was blinking white on alternate frames, which shows more of the hit pose; it's a one-line change if playtesting prefers it.
- **State marks on real art:** "?", "!", "BOING", "PFFFT", "Z z" and "* * *" are now drawn over real sprites too, not only over placeholders. They're placeholder-style text and may be replaced by drawn effects later.
- **Hit frames in the art list:** the tail-whip and jogger attack strips have `hitFrame: 2` and the vendor throw strip `releaseFrame: 2`, counted from 0 (so the hit lands on the third frame, as `config.js` already assumed). The hit lasts one frame. A test now checks every animation timing in `config.js` against frames ÷ fps; no gameplay values changed.
- **Scanner PNG checks are warnings only.** Size, colour-profile chunks, semi-transparent pixels, off-grid colours and more than 15 colours are reported, but the file is still listed. Pixels are checked only for 8-bit RGB, RGBA and palette PNGs that aren't interlaced; other kinds get "pixel checks skipped". The 15-colour limit is counted per file, ignoring transparent pixels.
- **Browser test images:** the real-art test now also has a hurt strip in two versions (v01 the wrong size, v02 correct), so it checks versions and the hit flash in a real browser. Two correct images load (run and hurt v02), not one.

**Step 5: docs and build**
- **`CLAUDE.md`** added at the top of the library: a short guide for future Claude sessions (layout, rules, how to add art, sound, an enemy type or a level, and the test commands).
- **Draft style guide:** `design/STYLE_GUIDE.md` is the project's filled-in copy of `templates/STYLE_GUIDE.md`. Every answer is Proposed. The colour limits are written as targets to aim for (15 colours or fewer per sprite or tile set), not hard rules. This matches the scanner, which warns but never blocks. The other option was keeping them as strict limits, which real art might not meet.
- **Style guide links:** docs that send people to the style guide for the project's answers (`game/README.md`, `design/GAME_BRIEF.md`, the checklist) now point to `design/STYLE_GUIDE.md`. `templates/STYLE_GUIDE.md` stays as the blank template. The comments in `font.js` and `config.js` still name the template; the rules they mention are the same in both.
- **Owner decisions:** `design/OWNER_DECISIONS.md` lists the questions only the owner can answer, each with a suggested default. The older "Open questions for the user" list above is kept as history.
- **Removed** `design/asset-index.json` and `design/asset-index.schema.json`. Nothing read them.
- **Repeatable build:** `game/dist/BUILD_INFO.txt` now starts with a 12-character code (a hash of `dist/index.html`) instead of the build time. Rebuilding with nothing changed leaves `dist/` unchanged in git.
- **Stale-build check:** the browser test now first checks that `dist/index.html` contains the current code of every `game/src/` file (except `asset-files.js`, which the build replaces) and that `BUILD_INFO.txt` names the right hash. If not, it says "run node tools/build.mjs". This check runs before the browser is needed. The other option was putting it in the game-rule tests, but then those would fail after every code edit until a rebuild.
- **Ground height in one place:** `level.js` now reads `CONFIG.groundY` instead of keeping its own copy of 192, so changing the ground height in `config.js` moves level 1's start, platforms and pickups too. The other option was only noting in `CLAUDE.md` that the two numbers must be kept in step.
- **Missing build:** if `game/dist/index.html` doesn't exist, the browser test now reports both build checks as failed ("run node tools/build.mjs") instead of skipping them.
- **`.gitignore` unchanged:** it already ignores only `.DS_Store`, `.idea/` and `node_modules/`. `game/dist/` stays in git until the owner decides (see `OWNER_DECISIONS.md`).
