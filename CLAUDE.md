# CLAUDE.md — Sammy (opossum game library)

A 16-bit Genesis-style 2D platformer prototype, "Sammy the Opossum: Zombie Hunter" (working title): Sammy the opossum hunts zombies in Central Park at night, ending on Bethesda Terrace. Today it is one playable level with **placeholder art and sound only**. The owner is non-technical: write docs in plain, short, accurate language with no jargon.

## Tone
- **Owner rule (Confirmed 2026-10-19): uncensored deadpan humour with cursing and swearing is encouraged** for Sammy and the zombies, in game text (title, prompts, banners, gags). Dry, matter-of-fact, profane. Don't bleep it, don't use symbols like `F***`. Short lines: the 3×5 font only has A–Z, 0–9 and `.,!?:-+/'()*=><%"#_` (no `;` or `&`).
- Badass action-horror with dark humour (Confirmed 2026-10-19). Sammy is a badass "who doesn't fuck around with zombies".
- **Gore (direction Confirmed 2026-10-19: "gorier"; exact level Proposed):** stylized 16-bit only, reserved gore colours (`S.PAL` `blood*`, `ichor*`, `bone`, `meat`; nothing else may use them); Sammy never bleeds. Every gory picture or effect needs a low-gore version (`-lowgore` art files). The setting `S.gore` ('full'|'low', G key, `?gore=low`, GORE pause button, localStorage `sammy.gore`) is **drawing only**: `sim.js` never reads it, and the game must play identically either way (tests check both).
- Docs written **to the owner** stay plain, short and polite; the swearing is for the game's own voice.

## Repo map
- `game/`: the game. Plain HTML5 canvas + classic `<script>` JS, no engine, no npm packages. Native 320×224, scaled by whole numbers of *device* pixels (`src/layout.js` `S.computeFit`, positioned on whole device pixels; don't reintroduce flex centring or CSS-point scaling). Runs by double-clicking `game/index.html` (file://).
  - `src/config.js` tuning numbers · `src/level.js` level 1 layout · `src/sim.js` game rules · `src/render.js` + `src/font.js` drawing · `src/audio.js` sound · `src/layout.js` screen-fit and touch-button layout maths (pure, Node-tested) · `src/touch.js` on-screen touch buttons (DOM, pixel-art canvases; feed `input.js` via `press`/`setHeld`; shown only on coarse pointers, first touch, or `?touch=1`) · `src/phone.js` "turn your phone sideways" message, full screen, zoom/long-press guards (`?upright=1` starts with the message put away) · `src/input.js`, `src/main.js` loop, fitting and `?test=` self-checks (results include `fit`) · `src/bot.js` test autopilot.
  - `src/assets.js`: planned art and sound names, plus frame data. `src/asset-files.js` is **generated** by `tools/scan-assets.mjs`.
  - `tools/`: `build.mjs` (makes `dist/`), `scan-assets.mjs` (+ `png.mjs` checks), `licenses.mjs` (ship rules), `convert-audio.mjs` (WAV → OGG/MP3 via ffmpeg).
  - `tests/`: `sim.test.mjs` (Node rule tests), `browser-smoke.mjs` (headless Chromium).
  - `dist/`: single-file build, **tracked in git** (until the owner decides otherwise).
- `assets/`: real art and sound go here (mostly empty `.gitkeep` folders; real so far: Sammy's run and chainsaw strips, the chainsaw pickup and HUD icon, the theme song). `assets/references/` is reference-only.
- `design/`: `GAME_BRIEF.md`, `DECISIONS.md` (dated log; "Current state" at top), `OWNER_DECISIONS.md` (open owner questions), `STYLE_GUIDE.md` (draft, all Proposed), `ASSET_REQUEST_CHECKLIST.md`, `ASSET_SOURCES.csv` (license rows).
- `templates/`: blank templates; `templates/examples/*/` are **proposed** example specs, not real assets. Never copy an unfinished example into `assets/`.

## Hard conventions
- **No dependencies.** Node built-ins only in tools/tests; nothing to install.
- **Classic scripts only in the game** (no ES modules, no `fetch`, no WebAudio file loading) so file:// double-click keeps working. Sound files play through `<audio>` elements.
- **`sim.js` has no browser APIs** and is deterministic (fixed 1/60 s step). Keep it that way; it runs in Node tests.
- **`assets.js` is the single source of truth** for art/sound names, frame sizes, counts, fps, pivots, hit frames and parallax rows. `config.js` timings must equal frames ÷ fps (a test checks this).
- **Never hand-edit** `game/src/asset-files.js` or `game/dist/*`. Run `node tools/build.mjs` from `game/` (it also runs the scanner). Never run the scanner with a custom `--out` into the repo.
- **Proposed vs Confirmed:** in design docs, only owner-stated facts are "Confirmed". Everything else is "Proposed (not approved)". Record any choice between two defensible options in `design/DECISIONS.md` under a dated heading, marked Proposed (reversible). Mark superseded lines; don't delete history.
- **Licenses:** a file ships in `dist/` only when its `design/ASSET_SOURCES.csv` row has `commercial_use` = `yes` and a license that is filled in (not blank/TBD/unknown/none) and isn't non-commercial (`NC`, "non-commercial") or reference-only. Rules: `game/tools/licenses.mjs`. `attribution_required` = `yes` adds a line to `dist/CREDITS.txt`. **Never ship `assets/references/`.**
- No "Sega"/"Genesis" in titles or branding; homage through feel only, never copied art or audio.
- **Desktop + mobile is a confirmed major priority.** The game must look beautiful and be fully playable on desktop and on phones and tablets (touch controls, landscape layout, crisp scaling that fills the screen). Check every visual, layout or input change at phone sizes (e.g. 844×390 and 390×844) as well as desktop. Steps 1 (crisp scaling), 2 (touch buttons), 3 (phone layout: sideways message, full screen, notch-safe picture, no zoom, auto-pause) and 4 (reliable phone sound) are done; real-phone checks follow `design/MOBILE_TEST_CHECKLIST.md`; see `design/DECISIONS.md` "Desktop and mobile confirmed". The picture and every control must stay inside the safe area (`touch.safe()` feeds both fit paths). Pausing from outside the rules goes through `pauseNow()` in `main.js` (never put browser APIs in `sim.js`). Starting and restarting sound lives in `audio.js` (`attach`/`unlock`: window capture listeners, silent sample, priming every `<audio>` element and pool copy); don't add separate unlock listeners elsewhere, and keep music from starting while paused (`musicOn` is false then). `?test=audio` checks it (smoke runs it in the temp library with and without `--autoplay-policy=no-user-gesture-required`).

## How to…

**Add art:** put the PNG at the path named in `S.ASSET_MANIFEST` (`game/src/assets.js`), e.g. `assets/characters/character-sammy/sammy-run-strip-v01.png`. Highest `-vNN` wins. Add an `ASSET_SOURCES.csv` row, then run `node tools/build.mjs`. Wrong-size art is not used: the placeholder stays, the console says why, and the title screen shows "ART WARNINGS". Other PNG problems are warnings only. A new kind of art needs a manifest entry plus a `sprite(...)` call in `render.js`.

**Add a sound:** `assets/audio/<sfx|music>/<id>/<id>-v01.ogg` (or `.mp3`/`.wav`; variations `-v01-a`). The id must be in `S.SOUND_MANIFEST`. A new id also needs a placeholder beep in `audio.js` and a `sfx(s, id)` call in `sim.js` (tests check every triggered id has both). Music loops whole; there are no loop points.

**Add an enemy type:** today two types (`jogger`, `vendor`) are handled by `if` checks, and **anything not `vendor` is treated as a jogger**. Places that branch on type:
- `sim.js`: `makeEnemy` (vendor vs jogger stats), `hurtPlayer` (shield pushes a jogger back), `damageEnemy` (knockback), `startPossum` (confused vs shrug), `whipHits` (which config block), `updateCart` (spill knocks joggers), `spawnWave` (gauntlet spawns joggers only), and the `S.update` dispatch (`updateVendor` vs `updateJogger`).
- `render.js`: the enemy draw dispatch (`drawVendor` vs `drawJogger`) and each placeholder.
- `main.js`: `renderSweep` state lists per type.
- `bot.js` doesn't branch on type; it whips whatever is in front and walks to the nearest enemy in the arena. A ranged or non-whippable type would need bot changes.
- Also: a `config.js` block, `assets.js` manifest keys (`<type>:<anim>`), `level.js` `enemies` entries, and tests.

When a **third type** starts, do the planned refactor first: an `ENEMY_TYPES` table (config, update, draw, possum reaction, knockback) that replaces these `if`s.

**Add a level:** the code assumes level 1's shape. Hard-coded today:
- One ground height for everything: `CONFIG.groundY` (192), used by `sim.js`, `render.js` and `level.js`.
- Every level must have an `arena` (gauntlet). `getSolids`, `updateArena` and `updateCamera` use it without checking.
- Fall-out planes: player `y > 260`, enemy `y > 260`, projectile `y > 240`, pickup `y > 230` (in `sim.js`). The splash happens only over `level.water`.
- Gauntlet waves are in `CONFIG.gauntlet.waves`, not in the level.
- Music ids: `S.MUSIC_TRACKS` in `assets.js` names `music-level-01-*`. `sim.js` asks for `'level'`/`'arena'`.
- `S.newGame` defaults to `S.LEVEL1`; there's no level select or level-to-level flow.
- Parallax bands (`bg:` in `assets.js`) are Central Park only.

## Test and build
From `game/` (Node 18+, a Chromium-based browser for the smoke test; set `CHROME_PATH` if needed):
```
node --test tests/sim.test.mjs                       # game rules (Node only)
node tools/build.mjs && node tests/browser-smoke.mjs  # rebuild dist/, then browser checks
```
- The smoke test first checks that `dist/index.html` contains the current code of every `src/*.js` file (except `asset-files.js`) and that `dist/BUILD_INFO.txt` carries its hash. After any `src/` edit, rebuild before running it.
- The build is repeatable: `BUILD_INFO.txt` holds a 12-character hash of `index.html`, not a time, so rebuilding unchanged code leaves git clean.
- Touch: `index.html?test=touch&touch=1` taps the real buttons (the smoke test runs it at 852×393 and 393×852; upright, it first checks and dismisses the sideways message). `?touch=1` also works with `?test=shot` (add `&paused=1` for the pause menu). Desktop must never show the buttons.
- Screenshots: `node tests/browser-smoke.mjs --shots <dir>`, or `index.html?test=shot&frames=N` in headless Chrome (flags in `screenshot()`). The autopilot grabs the chainsaw at frame ~2218 and slices zombies on Bethesda Terrace from ~2440 (good frames for rev and kill shots); add `&gore=low` for low gore, `&goredemo=0.2` for every defeat style at once.
- Update the test counts in `game/README.md` when they change.
