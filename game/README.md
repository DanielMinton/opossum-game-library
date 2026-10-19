# Sammy: placeholder prototype (level 1, Sheep Meadow)

This is a playable first level that uses **placeholder art and sound**. Sammy is a grey box with ears and a pink nose, zombies are green boxes, and every sound is a code-generated beep. The on-screen label "PLACEHOLDER ART – NOT FINAL" stays visible the whole time. Your real art and sound replace the placeholders automatically, one file at a time, as you add them (see **Adding art** and **Adding sound** below).

Every gameplay value comes from the examples in `templates/examples/`, which are **proposals, not approved design**. Changes the prototype made are listed in `design/DECISIONS.md`. The questions only you can answer (title, art style, how gory, and more) are in `design/OWNER_DECISIONS.md`, each with a suggested answer.

## Play it

- **Easiest:** double-click `game/index.html` (or `game/dist/index.html`). It should run in Chrome, Edge, Safari or Firefox (only Chromium has been tested). Nothing to install, and no internet needed.
- **If a browser blocks local files:** in Terminal, from the library folder, run `python3 -m http.server 8000` and open <http://localhost:8000/game/>.
- **Screen size:** the game fills as much of the window as it can in whole steps, counting the screen's real pixels, so every game pixel stays a sharp square. Black borders fill the rest.
- **Phones and tablets:** the game is bigger and sharper there (held sideways, it fills 83–95% of the height of the phones we checked, up from 54–60%), and it has on-screen touch buttons (see **Controls**). They show up only on touch screens. Held sideways, they sit beside the picture and may just cover the brown dirt strip at its bottom corners (never the top bar or the grass where Sammy and the zombies walk); held upright, the picture sits above the buttons. Not yet tried on a real phone. Phones also can't open a file by double-clicking; the game will need to be put on a website for that (not done). To see the buttons on a computer, add `?touch=1` to the address.

### Controls

| Action | Keyboard | Gamepad (standard layout) | Touch |
|---|---|---|---|
| Move | ← → or A D | D-pad / left stick | Arrow pad (slide across to turn) |
| Jump (hold for higher) | Z, Space, ↑ or W | A / Cross | JUMP (hold for higher) |
| Tail-whip | X or J | X / Square | WHIP |
| Play Possum | C or L | B / Circle or Y / Triangle | POSSUM |
| Pause / start | Enter, Esc or P | Start | Pause button; JUMP or a tap on the picture starts |
| Restart level | R | Select / Back | RESTART (while paused) |
| Mute | M | — | MUTE (while paused) |

With the touch buttons showing, the title screen and the tutorial messages use touch wording ("TAP JUMP TO START", "WHIP BUTTON: TAIL-WHIP"), and the "PLACEHOLDER ART" label moves to the bottom middle so a button never hides it. Sound starts after the first tap (phones don't allow sound before that).

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
2. Run `node game/tools/scan-assets.mjs` from the library folder. It lists the files it found, any images whose names the game doesn't recognize, and any art warnings (below).
3. Reload the game. Any sprite with a real file uses it; everything else stays a placeholder.

**New versions:** save `sammy-run-strip-v02.png` beside `v01`. The highest version wins; older ones stay in the folder and are skipped quietly. Run the scanner again afterwards.

**What the scanner warns about** (a warning never stops a file from being listed):
- **Wrong size**, for example "expected 384x48 px, got 100x48". The game does **not** use a wrong-size file, because it would be cut into frames wrongly. The placeholder stays, the browser console says why, and the title screen shows "ART WARNINGS".
- **Colour-profile or gamma data** in the PNG. Colours may shift. Export without a profile.
- **Semi-transparent pixels.** Every pixel must be fully clear or fully solid.
- **Colours off the 9-bit grid.** Each red, green and blue value must be one of 0, 36, 72, 108, 144, 180, 216, 252.
- **More than 15 solid colours** in one file (one palette line).
- Some PNG types (16-bit, interlaced, greyscale) can't have their pixels checked; the scanner says "pixel checks skipped". Size is still checked, even when the rest of the file is damaged.

**Licenses:** art only goes into the shareable build when its row in `design/ASSET_SOURCES.csv` clears it (see **Build a shareable copy**). The game on your own computer uses every file either way.

Frame sizes, frame counts, speeds and the feet point (24, 47) follow the draft style guide (`design/STYLE_GUIDE.md`) and each example's animation table. One exception: Sammy's tail-whip strip uses wider 64×48 frames with the feet point at (32, 47), so the tail has room. Background band rows, scroll speeds and loop widths are in the `bg:` lines of `game/src/assets.js`.

### Requested art the game can't show yet

The docs ask for these, but the game has no place to draw them yet, so adding the files changes nothing on screen:
- Play Possum HUD icon (the "PP" box stays)
- hearts
- Sammy wake-up strip (`sammy-wake-up-strip-v01.png`)
- Sammy face sheet (`sammy-expressions-v01.png`, optional reference)
- the 8×8 font
- trash lid break strip (`trash-lid-break-strip-v01.png`)
- zombie jogger head (`zombie-jogger-head-v01.png`)
- checkpoint marker and park exit gate
- spark, dust, splash and sparkle effects
- the tile sheet (`central-park-tiles-v01.png`): it needs a map of which tile goes where

To try every planned file without scanning, add `?probe=1` to the address. Missing files will show as errors in the browser console.

## Adding sound

1. Put each sound in its own folder under `assets/audio/`, named after the folder plus a version:
   - Sound effects: `assets/audio/sfx/sfx-jump/sfx-jump-v01.ogg`
   - Music: `assets/audio/music/music-level-01-central-park/music-level-01-central-park-v01.ogg`
2. Run `node game/tools/scan-assets.mjs`. It lists the sounds it found and flags any audio file with a name it doesn't recognize.
3. Reload the game and press a key (browsers stay silent until you do). Each sound with a file uses it; the rest keep their beep.

**Only have WAV files?** From the `game/` folder, run `node tools/convert-audio.mjs` (or `npm run convert`). It makes an `.ogg` beside every `.wav` in `assets/audio/` that doesn't have one yet. Add `--mp3` to also make any missing `.mp3` copies for older Safari (this works even after the `.ogg` files exist). It needs ffmpeg (`brew install ffmpeg`); without it, it prints the exact commands to run. It never deletes or overwrites anything, and the `.wav` stays as the master copy. Then run the scanner (step 2).

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

**Not supported yet: loop points.** Music loops the whole file from start to end. An intro that plays once before the loop needs loop-point support, which isn't built. Until then, make the file loop cleanly end-to-start, with no separate intro.

## Build a shareable copy

```
cd game
node tools/build.mjs
```

This makes `game/dist/`:
- `index.html`: the whole game in one file.
- `BUILD_INFO.txt`: what art and sound was included, and why anything was left out. Its first line has a 12-character code that only changes when the game itself changes, so building again with nothing new leaves `dist/` exactly as it was.
- `CREDITS.txt`: the credit line for every included file that needs one.

**License rules.** Each art or sound file needs its own row in `design/ASSET_SOURCES.csv` (a new version, like `-v02`, needs a new row). Columns:

| Column | What to write |
|---|---|
| `asset_id` | A short name, e.g. `sammy-run` |
| `path` | The file, starting with `assets/`, e.g. `assets/characters/character-sammy/sammy-run-strip-v02.png` |
| `creator` | Who made it |
| `source_url` | Where it came from (blank for your own work) |
| `license` | The exact license, e.g. `CC0`, `CC-BY 4.0`, `Original work` |
| `commercial_use` | `yes` or `no` |
| `attribution_required` | `yes` or `no`. `yes` adds it to `CREDITS.txt` |
| `notes` | Anything else |

A file is copied **only if** `commercial_use` is `yes` **and** the license is filled in (not blank, TBD or unknown) **and** the license isn't non-commercial (NC) or reference-only. Anything else is left out, with the reason in `BUILD_INFO.txt`. Nothing from `assets/references/` is ever copied. Today no art or sound exists, so the build is placeholders only.

**Publishing (not done; needs your go-ahead).** The `dist/` folder is a static website, so it can be zipped and uploaded as an HTML game to itch.io, or hosted with GitHub Pages or Netlify. Before any public release:
- Replace the placeholders.
- Clear every art and audio license.
- Choose a final title. Avoid "Sega" and "Genesis" in it.

## Tests

From the `game/` folder (needs Node 18 or newer; no packages to install):

| Command | What it checks |
|---|---|
| `node --test tests/sim.test.mjs` | 44 game-rule checks (see the list below) |
| `node tools/build.mjs` then `node tests/browser-smoke.mjs` | 33 browser checks (see the list below). Add `--shots <folder>` to save screenshots. Needs a Chromium-based browser; set `CHROME_PATH` if it isn't found. |
| `index.html?test=full` | The same autopilot check by hand, in your own browser |
| `index.html?test=touch&touch=1` | The touch-button check by hand (it taps the real buttons for you) |

**Game-rule checks** cover:
- startup, level layout, movement, jumping, one-way platforms and rocks
- tail-whip; jogger patrol, chase and attack; invincibility after a hit
- Play Possum (confusion, cancel, cooldown, range, the "ready" flash)
- cart (tip, spill, heal, settle), trash lid, vendor, pond, and falling into a dry pit (no splash)
- K.O. and checkpoints; the gauntlet and exit; finishing in mid-air
- pause, restart (also from the pause screen) and play again
- a full autopilot playthrough, repeatable results, and the art list vs. the example docs (file names and sizes)
- the background bands (rows match the tileset doc and don't overlap), the tail-whip frame width, and the placeholder font (M, W, H and N look different)
- the sound list: every sound the game triggers has a planned name and a beep; file names, versions and variations are read correctly
- the audio converter picks only `.wav` files missing an `.ogg` (or an `.mp3` with `--mp3`), and never overwrites
- animation timings in `config.js` match the frame counts and speeds of the art strips
- art versions (the newest wins), the license rules for the build, and the scanner's PNG checks (size, colour profile, semi-transparent pixels, off-grid colours, too many colours, broken files)
- the screen-size maths (`layout.js`) for ten phones, tablets and computers: the right whole-number size, centred on whole real pixels, never cut off, never smaller than ×1, and space kept free for touch buttons
- the touch-button layout for seven phones and tablets (plus notches and a narrow screen): every button at least 56 points (pause 44), on screen and clear of notches, not on top of each other, sharp, and covering only the dirt strip at the bottom corners of the picture, never the top bar or the grass lane; upright, all buttons below the picture
- the touch wording fits on screen

**Browser checks** cover:
- the shareable copy is up to date: `dist/index.html` has the current code from `src/`, and `BUILD_INFO.txt` has the matching code. If not, it says "run node tools/build.mjs". (So after changing anything in `src/`, build before running this test.)
- the source game and the built game each play title → level → gauntlet → clear → restart with no errors
- real key presses through the normal game loop start the game and move Sammy
- every screen the autopilot never reaches draws without errors: hurt, K.O., play-dead, shield, confused zombies, pause and mute
- art scanning: the newest version of a strip is picked, and a wrong-size file is warned about
- art loading: correct test images load and are drawn, the hit flash works on real art, and a wrong-size test image is reported and not drawn
- sound loading: a test sound effect and test music load, and real key presses play them instead of the beeps
- touch buttons at a sideways phone (source and built game) and an upright phone: real touch events on the real buttons start the game, move (and turn by sliding), jump higher when held, tail-whip, move and jump with two fingers, pause, mute and restart; every way a finger can be lost (lifted, cancelled, the page losing focus or being hidden) lets go of the button; the first tap unlocks sound
- screen size at a sideways phone (852×393, 3 real pixels per point) and a laptop (1366×768): the picture is the size `layout.js` works out, fills the phone's height (95%), the page doesn't scroll, a screenshot shows every game pixel as one solid square (sharp, not blurred), and no touch buttons show

The art and sound checks use a temporary copy of the library, never your `assets/` folder.

**Not tested by machine:**
- how the controls feel in human hands
- the difficulty balance (see below)
- gamepads
- whether the beeps sound right, and whether real sound files are audible (headless browsers have no speakers)
- Safari and Firefox (only Chromium was run headless)
- real phones and tablets (phone sizes and touches are only imitated in Chromium): how the buttons feel under real thumbs, notches, and whether sound really starts on the first tap

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
| `src/layout.js` | Works out how big to draw the game on this screen (whole steps of real pixels) |
| `src/input.js`, `src/main.js` | Controls, screen fitting, main loop and `?test=` self-checks |
| `src/touch.js` | On-screen touch buttons for phones and tablets (where they go is worked out in `layout.js`) |
| `src/bot.js` | Autopilot used only by the tests |
| `tools/` | Art and sound scanner (with PNG checks in `png.mjs`), WAV-to-OGG converter, build script, and license rules (`licenses.mjs`) |
| `tests/` | Game-rule tests and the browser check |
| `dist/` | Latest shareable build (made by `tools/build.mjs`) |

Engine: none. It's plain HTML5 canvas and JavaScript at the Genesis-style 320×224 resolution, scaled up by whole numbers of the screen's real pixels (so phones get a bigger picture and every pixel stays sharp). The reasons are in `design/DECISIONS.md`.
