# Sammy: placeholder prototype (level 1, Sheep Meadow)

This is a playable first level that uses **placeholder art and sound**. Sammy is a grey box with ears and a pink nose, zombies are green boxes, and every sound is a code-generated beep. The on-screen label "PLACEHOLDER ART – NOT FINAL" stays visible the whole time. Your real art and sound replace the placeholders automatically, one file at a time, as you add them (see **Adding art** and **Adding sound** below).

Every gameplay value comes from the examples in `templates/examples/`, which are **proposals, not approved design**. Changes the prototype made are listed in `design/DECISIONS.md`.

## Play it

- **Easiest:** double-click `game/index.html` (or `game/dist/index.html`). It should run in Chrome, Edge, Safari or Firefox (only Chromium has been tested). Nothing to install, and no internet needed.
- **If a browser blocks local files:** in Terminal, from the library folder, run `python3 -m http.server 8000` and open <http://localhost:8000/game/>.

### Controls

| Action | Keyboard | Gamepad (standard layout) |
|---|---|---|
| Move | ← → or A D | D-pad / left stick |
| Jump (hold for higher) | Z, Space, ↑ or W | A / Cross |
| Tail-whip | X or J | X / Square |
| Play Possum | C or L | B / Circle or Y / Triangle |
| Pause / start | Enter, Esc or P | Start |
| Restart level | R | Select / Back |
| Mute | M | — |

### What's in the level

The level is 12 screens long, about 1 minute for a fast run and 3–5 minutes for a first try.

1. **Start and tutorial:** Sammy starts on the grass. Prompts teach moving, jumping and the tail-whip.
2. **First zombies:** zombie joggers patrol, spot Sammy within 96 px, chase him, and lunge.
   - Two whips defeat a jogger. Its head pops off and bounces away.
3. **Trash lid shield (screen 4):** blocks 3 hits.
4. **Checkpoint C1:** the end of screen 4.
5. **Lampposts (screen 5):** one hides a hot dog on top.
6. **Hot dog cart and vendor (screen 6):**
   - Whip the cart twice to tip it. It spills 3 healing hot dogs and knocks nearby zombies back.
   - The vendor zombie lobs hot dogs at Sammy and deflates when defeated.
7. **Play Possum lesson (screen 7):** a group of 3 joggers.
   - Press **C** to play dead for up to 3 s. Zombies within 96 px get confused.
   - The ability has a 6 s cooldown. The "PP" icon in the top bar turns grey during the cooldown, with a bar beside it that fills up, and flashes when it's ready again.
8. **Pond (screen 8):** falling in costs 1 heart and puts Sammy back on safe ground. A bench helps him cross.
9. **Checkpoint C2:** the start of screen 9, with a second trash lid nearby.
10. **Gauntlet (screen 12):**
    - The camera locks and 3 waves of joggers arrive (2, then 3, then 4).
    - Clearing all three opens the park exit.
    - Walking through the exit shows the level-clear tally: time, zombies, hot dogs, hits and K.O.s.

**Losing:** Sammy has 3 hearts. A K.O. sends him back to the last checkpoint with full health, and there are no lives in this version. **R** restarts the level at any time, including from the pause screen. Enter on the tally screen plays again.

## Adding art

1. Put real files in `assets/` using the exact names from `templates/examples/` (for example, `assets/characters/character-sammy/sammy-run-strip-v01.png`). The full list is in `game/src/assets.js`.
2. Run `node game/tools/scan-assets.mjs` from the library folder. It reports which files it found, and any images whose names the game doesn't recognize.
3. Reload the game. Any sprite with a real file uses it; everything else stays a placeholder.
4. If a strip is the wrong size, the browser console says so, for example "expected 384x48 px, got 100x48".

Frame sizes, frame counts, speeds and the feet point (24, 47) follow `templates/STYLE_GUIDE.md` and each example's animation table. The large tile sheet (`central-park-tiles-v01.png`) is **not wired up yet**, because it needs a map of which tile goes where.

To try every planned file without scanning, add `?probe=1` to the address. Missing files will show as errors in the browser console.

## Adding sound

1. Put each sound in its own folder under `assets/audio/`, named after the folder plus a version:
   - Sound effects: `assets/audio/sfx/sfx-jump/sfx-jump-v01.ogg`
   - Music: `assets/audio/music/music-level-01-central-park/music-level-01-central-park-v01.ogg`
2. Run `node game/tools/scan-assets.mjs`. It lists the sounds it found and flags any audio file with a name it doesn't recognize.
3. Reload the game and press a key (browsers stay silent until you do). Each sound with a file uses it; the rest keep their beep.

**Sound names.** The full list is `S.SOUND_MANIFEST` in `game/src/assets.js`:
- The 11 core sounds from `templates/examples/audio/AUDIO.md` (`sfx-jump`, `sfx-land`, `sfx-tail-whip`, `sfx-hit-zombie`, `sfx-zombie-groan`, `sfx-pickup`, `sfx-hurt`, `sfx-play-dead`, `sfx-zombie-defeat-comedic`, `sfx-cart-crash`, `sfx-ko`).
- 10 extra sounds the prototype uses: `sfx-cart-rock`, `sfx-shield-block`, `sfx-shield-break`, `sfx-throw`, `sfx-splat`, `sfx-splash`, `sfx-checkpoint`, `sfx-gate-open`, `sfx-level-clear`, `sfx-start`.
- Music: `music-level-01-central-park` plays during the level. `music-level-01-gauntlet` plays during the gauntlet; without it, the level music keeps playing there without restarting. Real music also carries on (rather than restarting) after a checkpoint respawn or **R**; a K.O. starts it over. Pausing keeps the music's place, for both real music and the placeholder tune.

**Formats and versions:**
- Use `.ogg` (what `AUDIO.md` asks for). `.mp3` and `.wav` also work. If a sound has more than one format, the game uses the first one the browser can play, in the order ogg → mp3 → wav. Adding an `.mp3` next to each `.ogg` covers older Safari, which can't play `.ogg`.
- A `.wav` next to an `.ogg` or `.mp3` of the same sound is treated as the master copy. It isn't loaded or copied into the build.
- Variations: `sfx-land-v01-a.ogg`, `sfx-land-v01-b.ogg`, and so on. One is picked at random each time.
- New version: save `sfx-jump-v02.ogg` beside `v01`. The highest version wins.

**Volume:** `sound.musicVolume` and `sound.sfxVolume` in `game/src/config.js` (0 to 1). **M** mutes everything.

**Level-clear jingle:** if `sfx-level-clear` has a file, it replaces the placeholder jingle.

**Not supported yet: loop points.** Music loops the whole file from start to end. An intro that plays once before the loop needs loop-point support, which isn't built. Until then, make the file loop cleanly end-to-start.

## Build a shareable copy

```
cd game
node tools/build.mjs
```

This makes `game/dist/`:
- `index.html`: the whole game in one file.
- `BUILD_INFO.txt`: what art was included or left out.

Art and sound are copied **only if** `design/ASSET_SOURCES.csv` records a license for them, and nothing from `assets/references/` is ever copied. Today no art or sound exists, so the build is placeholders only.

**Publishing (not done; needs your go-ahead).** The `dist/` folder is a static website, so it can be zipped and uploaded as an HTML game to itch.io, or hosted with GitHub Pages or Netlify. Before any public release:
- Replace the placeholders.
- Clear every art and audio license.
- Choose a final title. Avoid "Sega" and "Genesis" in it.

## Tests

From the `game/` folder (needs Node 18 or newer; no packages to install):

| Command | What it checks |
|---|---|
| `node --test tests/sim.test.mjs` | 29 game-rule checks (see the list below) |
| `node tools/build.mjs` then `node tests/browser-smoke.mjs` | 18 browser checks (see the list below). Add `--shots <folder>` to save screenshots. Needs a Chromium-based browser; set `CHROME_PATH` if it isn't found. |
| `index.html?test=full` | The same autopilot check by hand, in your own browser |

**Game-rule checks** cover:
- startup, level layout, movement, jumping, one-way platforms and rocks
- tail-whip; jogger patrol, chase and attack; invincibility after a hit
- Play Possum (confusion, cancel, cooldown, range, the "ready" flash)
- cart (tip, spill, heal, settle), trash lid, vendor, pond, and falling into a dry pit (no splash)
- K.O. and checkpoints; the gauntlet and exit; finishing in mid-air
- pause, restart (also from the pause screen) and play again
- a full autopilot playthrough, repeatable results, and the art list vs. the example docs
- the sound list: every sound the game triggers has a planned name and a beep; file names, versions and variations are read correctly

**Browser checks** cover:
- the source game and the built game each play title → level → gauntlet → clear → restart with no errors
- real key presses through the normal game loop start the game and move Sammy
- every screen the autopilot never reaches draws without errors: hurt, K.O., play-dead, shield, confused zombies, pause and mute
- art loading: a correct test image loads and is drawn, and a wrong-size test image is reported
- sound loading: a test sound effect and test music load, and real key presses play them instead of the beeps

These two checks use a temporary copy of the library, never your `assets/` folder.

**Not tested by machine:**
- how the controls feel in human hands
- the difficulty balance (see below)
- gamepads
- whether the beeps sound right, and whether real sound files are audible (headless browsers have no speakers)
- Safari and Firefox (only Chromium was run headless)
- phones (touch controls aren't built)

**Difficulty note:** the autopilot clears the level when it can't take damage. Taking normal damage, it reaches the gauntlet but loses at wave 2, because it never jumps away or plays possum. A human player can do both, but the gauntlet may still be too hard. This needs a playtest.

## Files

| Path | What it is |
|---|---|
| `index.html` | The page; loads the scripts below in order (plain scripts, so double-clicking works) |
| `src/config.js` | Every tuning number (speeds, damage, timings, colors). Change values here. |
| `src/level.js` | Level 1 layout: ground, pond, rocks, benches, lampposts, enemies, pickups, checkpoints, arena, prompts |
| `src/sim.js` | Game rules (no drawing, so it can be tested in Node) |
| `src/render.js`, `src/font.js` | Drawing: real art when present, placeholders otherwise |
| `src/assets.js`, `src/asset-files.js` | Planned art and sound lists, and the generated list of files that exist |
| `src/audio.js` | Plays real sound files when present, placeholder beeps otherwise |
| `src/input.js`, `src/main.js` | Controls, main loop and `?test=` self-checks |
| `src/bot.js` | Autopilot used only by the tests |
| `tools/` | Art and sound scanner, and build script |
| `tests/` | Game-rule tests and the browser check |
| `dist/` | Latest shareable build (made by `tools/build.mjs`) |

Engine: none. It's plain HTML5 canvas and JavaScript at the Genesis-style 320×224 resolution, scaled up by whole numbers. The reasons are in `design/DECISIONS.md`.
