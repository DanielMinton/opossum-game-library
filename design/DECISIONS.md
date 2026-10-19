# Decisions and assumptions

Record date, decision, supporting asset or requirement, and unresolved questions here. Engine: none — the game is plain HTML5 canvas and JavaScript (see "Placeholder prototype of level 1 built" below). *(Updated 2026-10-19; this line used to say "No engine selected yet".)*

## Current state (2026-10-19)

- **What exists:** a playable placeholder version of level 1 (Sheep Meadow) in `game/`. Open `game/index.html` to play. It has Sammy, two zombie types (jogger and hot dog vendor), the hot dog cart, the trash-lid shield, Play Possum, a pond, two checkpoints and a 3-wave gauntlet. A shareable one-file copy is in `game/dist/`.
- **What's placeholder:** almost all art (coloured boxes) and all sound (code-made beeps). The first real art, Sammy's 8-frame run (`assets/characters/character-sammy/sammy-run-strip-v01.png`), was added on 2026-10-19. Real files replace placeholders one at a time when added (see `game/README.md`).
- **What's still only proposed:** every gameplay number, size and rule. They come from the examples in `templates/examples/`, plus the choices listed below. Nothing has been approved.
- **What's next:** the owner answers the questions in `design/OWNER_DECISIONS.md`, reviews the draft style guide in `design/STYLE_GUIDE.md`, and supplies the Tier 1 items in `design/ASSET_REQUEST_CHECKLIST.md`. Then a playtest, mainly of the gauntlet.
- **Decisions only the owner can make:** `design/OWNER_DECISIONS.md`.
- **Confirmed major priority, being built:** the game must look beautiful and play well on desktop **and** on phones and tablets. Step 1 (sharper, bigger scaling) and step 2 (on-screen touch buttons) are done; the phone layout (step 3) is not built yet, and nothing has been tried on a real phone. See "Desktop and mobile confirmed" below.

## 2026-10-19: Desktop and mobile confirmed as a major priority

**Decision (Confirmed by the owner):** the game must render beautifully and be fully playable on desktop and on mobile devices (phones and tablets). The owner says this was intended from the start; earlier docs had wrongly proposed "touch later, if at all" and listed touch controls as excluded. Those lines are corrected in `design/GAME_BRIEF.md`.

**Where the prototype stands today (checked with screenshots at 390×844 and 844×390, common phone sizes):**
- **Too small on phones.** Scaling uses whole numbers of *screen points*, so on a phone the game is stuck at its smallest size (×1): a small strip with big black borders. In landscape it uses about 320 of 844 points of width. *(Fixed by step 1, below.)*
- **Not playable on phones.** There are no touch controls, and phones have no keyboard. *(Fixed by step 2, below.)*
- **Phones can't double-click a file.** On mobile, the game has to be opened from a website (for example itch.io or GitHub Pages). Double-click still works on desktop.

**Work this needs (Proposed order):**
1. Sharper, bigger scaling: count whole-number steps in the screen's real pixels (phones have 2–3 real pixels per point), so the game fills far more of the screen and stays crisp. *(Done 2026-10-19; see "Step 1 done" below.)*
2. On-screen touch controls (move, jump, tail-whip, Play Possum, pause) that appear only on touch screens and sit outside or beside the picture where possible. *(Done 2026-10-19; see "Step 2 done" below.)*
3. Phone layout: landscape play, a "turn your phone sideways" prompt in portrait, full-screen button, respect for notches and rounded corners, no accidental scrolling or zooming.
4. Sound: start sound on the first tap (phones block sound until the player touches the screen). *(Partly done in step 2: sound also starts when the finger lifts; still needs a check on a real phone.)*
5. Checks: automatic browser checks at phone sizes with touch, plus tests on a real iPhone and Android phone.
6. Art impact: text and the HUD must stay readable at phone sizes (another reason for the planned 8×8 font).

**Step 1 done: sharper, bigger scaling (2026-10-19).** Choices below are **Proposed (reversible)**.
- **What changed:** the game now scales by whole steps of the screen's *real* pixels instead of screen points. Every game pixel is still an exact square block of real pixels, so it stays sharp, but phones and tablets get a much bigger picture. The maths is in `game/src/layout.js` (tested in Node); `game/src/main.js` uses it.
- **Measured sizes (screen size in points, game size before → after, in points; "x5" means each game pixel is 5×5 real pixels):**

  | Screen | Before | After | Height filled before → after |
  |---|---|---|---|
  | iPhone SE landscape 667×375 | 320×224 | 480×336 (x3) | 60% → 90% |
  | iPhone 15 landscape 852×393 | 320×224 | 533×373 (x5) | 57% → 95% |
  | Pixel 7 landscape 915×412 | 320×224 | 488×341 (x4) | 54% → 83% |
  | iPad landscape 1180×820 | 960×672 | 1120×784 (x7) | 82% → 96% |
  | iPad portrait 820×1180 | 640×448 | 800×560 (x5) | width 78% → 98% |
  | iPhone SE / iPhone 15 portrait | 320×224 | 320×224 (x2 / x3) | same size |
  | Laptop 1440×900 (Retina) | 1280×896 | 1280×896 (x8) | same |
  | Desktop 1920×1080 and 1366×768 | 1280×896 and 960×672 | the same | same |

  Desktop computers look exactly as before. Phones held sideways get the big gain. Phones held upright stay the same size (the screen is only 375–393 points wide), which is why step 3 plans a "turn your phone sideways" prompt.
- **Whole steps, not any size:** the Pixel 7 sideways fills 83% of the height, because the next whole step (x5) wouldn't fit. The other option is stretching to fill the screen exactly, which makes some game pixels one real pixel wider than others (slightly uneven, a little soft). Sharp, even pixels were kept; this is easy to revisit after a look on a real phone.
- **Exact placement:** the picture is centred, then nudged to the nearest whole real pixel, so its edges line up with the screen's pixels. Plain centring could land half a pixel off, which blurs every pixel. A browser check now takes a screenshot at phone size and confirms every game pixel is one solid block.
- **When it re-fits:** on window resize, turning the phone, the phone browser's bars sliding in and out, and browser zoom or moving the window to another screen. While someone has pinch-zoomed, it uses the normal window size instead of the zoomed area (otherwise the game would shrink while they zoom in). Step 3 will decide about blocking zoom.
- **Room for touch buttons:** the maths can keep space free at the bottom, left or right of the screen for on-screen buttons (step 2). It's built and tested but not used yet. *(Superseded: step 2's upright layout now uses it.)*
- **Page settings:** the page can't scroll, the borders stay black, and the page may draw into the notch area (`viewport-fit=cover`). Keeping the picture clear of notches comes in step 3. Zoom is still allowed.
- **Not checked:** real phones, Safari and Firefox. The sizes above come from Chromium pretending to be each device. Real phone browsers show address bars that take some height, so the real picture may be one step smaller in some cases.

**Step 2 done: on-screen touch buttons (2026-10-19).** Choices below are **Proposed (reversible)**.
- **What's there:** a left/right arrow pad (bottom left), JUMP, WHIP and POSSUM (bottom right), a pause button, and RESTART and MUTE while paused. Code: `game/src/touch.js` (the buttons) and `S.touchLayout` in `game/src/layout.js` (where they go; tested in Node). They feed the same buttons as the keyboard, so holding JUMP gives the higher jump and two fingers (move + jump) work.
- **When they show:** when the browser says the main pointer is a finger, or on the first touch, or with `?touch=1` in the address. Never on a normal computer. On a laptop with a touch screen, touching shows them and pressing a key hides them again.
- **Button layout:** right thumb gets JUMP in the corner, WHIP to its left and a little higher, POSSUM above JUMP (the most-used buttons are closest to the thumb). The left thumb's pad is one piece: sliding across the middle turns Sammy round without lifting. Buttons are 56–84 points (POSSUM at least 56, pause at least 44), about a sixth of the screen's short side. Other options: a round joystick (harder to make crisp in pixel art; left/right is all the game needs), or one row of three action buttons (wider, covers more of the picture).
- **Where they go, sideways:** in the black space beside the picture. Where that space is too narrow, they may cover only the outer bottom corners of the picture (the outer 64 game pixels on each side, lower 96 rows), never the top bar, the tutorial message or the middle where Sammy usually is. If even that isn't possible, the picture first moves to the top of the screen, then shrinks one step. In our checks no device had to shrink: iPhone SE, iPhone 15, Pixel 7 and iPad all keep their biggest picture. Buttons over the picture are see-through (60%). *(Superseded by the review fixes below: only the brown dirt strip may be covered, iPad and notched iPhones shrink one step, and only the covered part is see-through.)*
- **Pause button:** top right of the screen when there's room. On an iPad held sideways the picture leaves only 30 points at the sides, so the pause button goes above the arrow pad instead of shrinking the whole picture for one small button. *(Superseded by the review fixes below: the iPad picture is now one step smaller, so PAUSE fits top right.)*
- **Upright:** picture at the top, buttons below it, raised a tenth of the screen from the bottom for comfortable thumbs. This leaves a black gap in the middle; step 3's "turn your phone sideways" message is meant to deal with upright play. *(Superseded by the second review fixes: the picture is now centred above the buttons.)*
- **Notches:** only the buttons keep clear of notches and rounded corners (`env(safe-area-inset-*)`); the picture doesn't move for them yet (step 3).
- **Look:** chunky pixel-art buttons drawn with the game's own font and 9-bit colours (green JUMP, red WHIP, pink POSSUM to match the HUD's "PP", blue menu buttons, grey pad), black outline, a light top edge and a dark lip that disappears when pressed. Each button pixel is a whole number of real pixels, so they stay as sharp as the game.
- **Game text:** with the buttons on, the title says "TAP JUMP TO START", the tutorial messages name the buttons ("WHIP BUTTON: TAIL-WHIP"), pause says "TAP PLAY TO RESUME". Tapping the picture on the title or level-clear screen also starts. The "PLACEHOLDER ART" label moves to the bottom middle and "MUTED" to the top bar, so the buttons never hide them. Keyboard wording is unchanged on desktop.
- **Sound:** phones only allow sound after a touch, and a finger only counts when it *lifts*. So sound now also starts on finger-up (`pointerup`, `touchend`), not only finger-down. The automatic check confirms the first tap reaches this code; whether a real phone then plays sound is **untested**.
- **Not checked:** real phones and tablets, Safari, Firefox, how the buttons feel under real thumbs, and real notches (headless Chromium reports none; a Node test covers an iPhone-sized notch).

**Step 2 review fixes (2026-10-19).** Choices below are **Proposed (reversible)**.
- **Buttons keep off the grass lane:** buttons may now cover only the brown dirt strip below the grass (game rows 192–224) in the outer 64 game pixels on each side, so they can't hide Sammy or a zombie walking in. Where the side strip is too narrow for the usual action cluster, JUMP, WHIP and POSSUM stack in one column (JUMP at the bottom). Other option: keep the larger corner (rows 128–224) and the bigger picture, but then a button could hide a zombie.
- **Some screens now get a one-step-smaller picture:** iPad held sideways goes from x7 to x6 (all buttons in or near the black sides instead of faded over the picture), and an iPhone 15 held sideways *with its notch margins* goes from x5 to x4. iPhone SE, iPhone 15 (no notch margins, as headless Chrome reports), Pixel 7 and every upright screen keep their biggest picture. This follows the rule "shrink one step rather than cover the picture".
- **See-through only where it covers the picture:** the part of a button over the black border stays solid; only the part over the picture is faded (to 75%), so the buttons keep their bright colours. *(Superseded by the second review fixes below: buttons are now fully solid.)*
- **PAUSE shows only during play** (on the title and level-clear screens it would just start the game).
- **Upright pause menu:** RESTART and MUTE sit in the black space below the picture, next to the play button, instead of covering the small picture.
- **Look:** POSSUM is a little wider than tall so its label has room; the arrow pad is one body with a groove down the middle, so it reads as one control you can slide across.
- **Not changed:** the black gap between picture and buttons when upright stays until step 3 (turn-your-phone message). *(Superseded by the second review fixes below.)*

**Step 2 second review fixes (2026-10-19).** Choices below are **Proposed (reversible)**.
- **Buttons are fully solid:** fading only the part of a button over the picture left a hard line across it (two shades of red on WHIP on an iPad). Fading the whole button evenly still showed a line where the picture's edge crossed it. Since buttons only ever cover the plain dirt strip at the bottom corners, they are now simply solid. Other option: fade the whole button evenly (about 85%); the line is fainter but still there.
- **Upright: picture centred above the buttons:** instead of sitting at the very top with a big black gap below, the picture is centred in the space above the buttons (below any notch), with the pause button just under it. The buttons stay where they were for thumb reach. Other option: picture just above the buttons with all the black space at the top.
- **Sideways: picture as close to centred as the rule allows:** where the buttons need the picture moved up (iPhone SE), it now moves up only as far as needed. On iPhone SE that is just 6 points off the top instead of 0 (centred would be about 20); more would put the arrow pad over the grass.
- **Sideways pause menu:** the PAUSED box now grows to hold RESTART and MUTE as well, so the scene no longer peeks out between and around them. Upright, the menu stays in the black space below the picture.

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
- **Tail-whip frames are 64×48 (feet point (32, 47), changed to (36, 47) later the same day; see "First real art"), strip 256×48.** Only this strip changes; every other Sammy strip stays 48×48. The whip reaches 26 px in front of Sammy's feet point and a 48 px frame only has 23 px. Gameplay reach is unchanged. The other option was shortening the whip to fit 48 px.
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

## 2026-10-19: First real art — Sammy's run

- **Added:** `assets/characters/character-sammy/sammy-run-strip-v01.png`, 8 frames of 48×48 (384×48), 12 fps loop. Supplied by the owner; drawn as pixel geometry in code (Pillow) with an AI coding assistant. License row added to `design/ASSET_SOURCES.csv` (Original work, commercial use yes). **Owner to confirm** the tool's terms allow selling the game.
- **Checked:** exact size; transparent; hard edges; 10 colours, all on the 9-bit grid; no colour-profile chunks; the tail fits inside each frame; 2 px body bob; both feet off the ground on the flight frames; opposite-leg frames differ; the planted foot moves back about as fast as the ground scrolls (no skating). Seen in the game over the level background.
- **Sammy's feet point is now (28, 47) for every Sammy strip (tail-whip: (36, 47)).** Proposed (reversible). In this strip his body is centred about 4 px right of the frame centre to leave room for the tail; moving the drawing left would clip the tail. One shared value keeps him from jumping sideways when he switches animations, so every future Sammy strip must be drawn with his body centred on x 28.
- **Notes for the next Sammy strips (polish, not blocking):** he is about 43 px tall with ears (spec 32–40), so he now stands taller than the placeholder zombies, which should be a little taller than him; a 1–2 px tail sway would add life; a darker ear rim would read more clearly as an ear at 1×. The supplied notes say 12.5 fps; the game uses 12.

