# CLAUDE.md — Sammy (opossum game library)

A 16-bit Genesis-style 2D platformer prototype: Sammy the opossum fights cartoon zombies in Central Park. Today it is one playable level with **placeholder art and sound only**. The owner is non-technical: write docs in plain, short, accurate language with no jargon.

## Repo map
- `game/`: the game. Plain HTML5 canvas + classic `<script>` JS, no engine, no npm packages. Native 320×224, scaled by whole numbers of *device* pixels (`src/layout.js` `S.computeFit`, positioned on whole device pixels; don't reintroduce flex centring or CSS-point scaling). Runs by double-clicking `game/index.html` (file://).
  - `src/config.js` tuning numbers · `src/level.js` level 1 layout · `src/sim.js` game rules · `src/render.js` + `src/font.js` drawing · `src/audio.js` sound · `src/layout.js` screen-fit maths (pure, Node-tested) · `src/input.js`, `src/main.js` loop, fitting and `?test=` self-checks (results include `fit`) · `src/bot.js` test autopilot.
  - `src/assets.js`: planned art and sound names, plus frame data. `src/asset-files.js` is **generated** by `tools/scan-assets.mjs`.
  - `tools/`: `build.mjs` (makes `dist/`), `scan-assets.mjs` (+ `png.mjs` checks), `licenses.mjs` (ship rules), `convert-audio.mjs` (WAV → OGG/MP3 via ffmpeg).
  - `tests/`: `sim.test.mjs` (Node rule tests), `browser-smoke.mjs` (headless Chromium).
  - `dist/`: single-file build, **tracked in git** (until the owner decides otherwise).
- `assets/`: real art and sound go here (empty `.gitkeep` folders today). `assets/references/` is reference-only.
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
- **Desktop + mobile is a confirmed major priority.** The game must look beautiful and be fully playable on desktop and on phones and tablets (touch controls, landscape layout, crisp scaling that fills the screen). Check every visual, layout or input change at phone sizes (e.g. 844×390 and 390×844) as well as desktop. Step 1 (crisp scaling) is done; touch controls and phone layout aren't built yet; see `design/DECISIONS.md` "Desktop and mobile confirmed".

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
- Screenshots: `node tests/browser-smoke.mjs --shots <dir>`, or `index.html?test=shot&frames=N` in headless Chrome (flags in `screenshot()`).
- Update the test counts in `game/README.md` when they change.
