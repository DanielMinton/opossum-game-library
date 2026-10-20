# Sammy: placeholder prototype (level 1, Sheep Meadow)

This is a playable first level that uses **placeholder art and sound**. The first real art is in: Sammy's run animation. The level music is real too: the owner's theme song "Sammy the Opossum : Zombie Hunter" (made with Suno; it plays here but is left out of `dist/` until its license is confirmed, owner question 21). Otherwise Sammy is a grey box with ears and a pink nose, zombies are green boxes, and every sound effect is a code-generated beep. The look is now the "Zombie Hunter" night park (placeholder boxes: night sky, full moon, stars, lit skyline windows, amber lamp glow, wet ground) with a placeholder Bethesda Terrace (stone floor, arches, balustrade, angel fountain) for the final fight. The game's text is deadpan and swears on purpose (owner rule). The chainsaw and gore come next (see `design/DECISIONS.md`). The on-screen label "PLACEHOLDER ART – NOT FINAL" stays visible the whole time. Your real art and sound replace the placeholders automatically, one file at a time, as you add them (see **Adding art** and **Adding sound** below).

Every gameplay value comes from the examples in `templates/examples/`, which are **proposals, not approved design**. Changes the prototype made are listed in `design/DECISIONS.md`. The questions only you can answer (title, art style, how gory, and more) are in `design/OWNER_DECISIONS.md`, each with a suggested answer.

## Play it

- **Easiest:** double-click `game/index.html` (or `game/dist/index.html`). It should run in Chrome, Edge, Safari or Firefox (only Chromium has been tested). Nothing to install, and no internet needed.
- **If a browser blocks local files:** in Terminal, from the library folder, run `python3 -m http.server 8000` and open <http://localhost:8000/game/>.
- **Screen size:** the game fills as much of the window as it can in whole steps, counting the screen's real pixels, so every game pixel stays a sharp square. Black borders fill the rest.
- **Phones and tablets:** the game is bigger and sharper there (held sideways, it fills 83–95% of the height of the phones we checked, up from 54–60%), and it has on-screen touch buttons (see **Controls**). They show up only on touch screens. Held sideways, they sit beside the picture and may just cover the brown dirt strip at its bottom corners (never the top bar or the grass where Sammy and the zombies walk); held upright, the picture sits above the buttons. Not yet tried on a real phone. Phones also can't open a file by double-clicking; the game will need to be put on a website for that (not done). To see the buttons on a computer, add `?touch=1` to the address.
- **Phone layout:** a phone held upright with the touch buttons on (short side under 600 points) shows a "TURN YOUR PHONE SIDEWAYS" message that covers the screen and keeps the game paused; turning the phone hides it (the game stays paused until you tap play), and **PLAY UPRIGHT ANYWAY** puts it away until the page is closed. Tablets (an upright iPad) play upright without the message. Where the browser allows it (Android), a full-screen button sits next to pause; on iPhone, use Share → Add to Home Screen once the game is on a website. The picture and buttons keep clear of notches, rounded corners and the home bar. Pinch and double-tap zoom, page scrolling and long-press menus are blocked on touch screens. Never shown on a computer. Code: `src/phone.js`, maths in `src/layout.js`. Add `&upright=1` to the address to start with the message put away.
- **Auto-pause:** hiding the page (phone locked, app or tab switched) or clicking into another window pauses the game and lets go of held keys and buttons, on computers too. It never resumes by itself.
- **Sound on phones:** sound starts on the first tap (or key press). Every kind of tap counts, including on the touch buttons and the sideways message; if a phone refuses one, the next tap tries again. When the finger lifts (or on a click or key press; phones don't count a finger going down), every sound file is played once, muted, because iPhones may otherwise refuse to play it later. After a phone call, the lock screen or another app, sound restarts when the page is back; music waits until you unpause. On an iPhone with the silent switch on, the placeholder beeps may be silent (real sound files should still play); flip the switch off to hear them. No switch (newer iPhones)? Swipe down from the top-right corner to open Control Center and tap the bell to turn Silent mode on or off. Code: `src/audio.js` (`attach`, `unlock`). Real-phone checklist: `design/MOBILE_TEST_CHECKLIST.md`.

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

With the touch buttons showing, the title screen and the tutorial messages use touch wording ("TAP JUMP TO START", "WHIP BUTTON: TAIL-WHIP"), and the "PLACEHOLDER ART" label moves to the bottom middle so a button never hides it. Sound starts on the first tap (phones don't allow sound before that). MUTE silences everything, including a sound already playing.

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

**The steps are in the main README: [Adding real art](../README.md#adding-real-art).** In short: from the `game/` folder, run `node tools/scan-assets.mjs` to see every missing file with its exact path and size, save the PNG there, add its license row, and run the scanner again. This section only adds details.

**Blank drawing templates:** `templates/art-templates/` has a see-through PNG for every planned picture, at its exact size, with guide marks to erase before saving. What each picture should show, and what the guide colours mean, is in [design/ART_BRIEFS.md](../design/ART_BRIEFS.md). To make the templates again, run `node tools/make-art-templates.mjs` from the `game/` folder.

**What the scanner warns about** (a warning never stops a file from being listed):
- **Wrong size**, for example "expected 384x48 px, got 100x48". The game does **not** use a wrong-size file, because it would be cut into frames wrongly. The placeholder stays, the browser console says why, and the title screen shows "ART WARNINGS".
- **Colour-profile or gamma data** in the PNG. Colours may shift. Export without a profile.
- **Semi-transparent pixels.** Every pixel must be fully clear or fully solid.
- **Colours off the 9-bit grid.** Each red, green and blue value must be one of 0, 36, 72, 108, 144, 180, 216, 252.
- **More than 15 solid colours** in one file (one palette line).
- Some PNG types (16-bit, interlaced, greyscale) can't have their pixels checked; the scanner says "pixel checks skipped". Size is still checked, even when the rest of the file is damaged.

**Licenses:** art only goes into the shareable build when its row in `design/ASSET_SOURCES.csv` clears it (see **Build a shareable copy**). The game on your own computer uses every file either way.

Frame sizes, frame counts, speeds and the feet point (24, 47) follow the draft style guide (`design/STYLE_GUIDE.md`) and each example's animation table. Exceptions for Sammy: his feet point is (28, 47), not (24, 47), so his tail has room behind him; and his tail-whip strip uses wider 64×48 frames with the feet point at (36, 47). Background band rows, scroll speeds and loop widths are in the `bg:` lines of `game/src/assets.js`.

### Requested art the game can't show yet

The docs ask for these, but the game has no place to draw them yet, so adding the files changes nothing on screen (and the scanner's missing list leaves them out):
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

**The steps are in the main README: [Adding sound](../README.md#adding-sound)** (including how to turn WAV files into `.ogg`). In short: from the `game/` folder, run `node tools/scan-assets.mjs` to see every missing sound with its exact path, save the file there, add its license row, and run the scanner again. The scanner also flags any audio file with a name it doesn't recognize. This section only adds details.

**Which sounds are planned:** the scanner's "Still missing — sounds" list shows every planned sound that has no file yet (the full list is `S.SOUND_MANIFEST` in `game/src/assets.js`).

**Music:** `music-level-01-central-park` plays during the level. Today that is the owner's theme song (`music-level-01-central-park-v01.mp3`, 70 s). It starts with the key press or tap that starts the game (browsers keep the title screen silent until then), so nobody presses twice. It loops whole, so its quiet ~5 s build-in and its fade-out replay every 70 s until a trimmed loop edit or loop points exist. `music-level-01-gauntlet` plays during the gauntlet; without it, the level music keeps playing there without restarting. Real music also carries on (rather than restarting) after a checkpoint respawn or **R**; a K.O. starts it over. Pausing keeps the music's place, for both real music and the placeholder tune.

**Formats:**
- Use `.ogg` (what `AUDIO.md` asks for). `.mp3` and `.wav` also work. If a sound has more than one format, the game uses the first one the browser can play, in the order ogg → mp3 → wav. Adding an `.mp3` next to each `.ogg` covers older Safari, which can't play `.ogg`.
- A `.wav` next to an `.ogg` or `.mp3` of the same sound is treated as the master copy. It isn't loaded or copied into the build.

**Volume:** `sound.musicVolume` and `sound.sfxVolume` in `game/src/config.js` (0 to 1). **M** mutes everything.

**Level-clear jingle:** if `sfx-level-clear` has a file, it replaces the placeholder jingle.

**Not supported yet: loop points.** Music loops the whole file from start to end. An intro that plays once before the loop needs loop-point support, which isn't built. Until then, make the file loop cleanly end-to-start, with no separate intro. **Exception:** the theme song (`music-level-01-central-park-v01.mp3`) is used as supplied, so it loops whole: its quiet build-in and fade-out are heard every 70 seconds. A trimmed loop edit can come later.

## Build a shareable copy

```
cd game
node tools/build.mjs
```

This makes `game/dist/`. You only need it for the shareable copy; `game/index.html` picks up new files after the scanner runs.
- `index.html`: the game's code in one file.
- `assets/`: the cleared real art and sound (today: Sammy's run animation; the theme song isn't cleared yet). Share the whole `dist/` folder.
- `BUILD_INFO.txt`: what art and sound was included, and why anything was left out. Its "Still placeholders (no real file yet):" section lists every planned picture and sound that has no real file yet. Its first line has a 12-character code that only changes when the game itself changes, so building again with nothing new leaves `dist/` exactly as it was.
- `CREDITS.txt`: the credit line for every included file that needs one.

**License rules.** Each art or sound file needs its own row in `design/ASSET_SOURCES.csv` (a new version, like `-v02`, needs a new row). Near the top of what it prints, the build lists any file without a row under "License rows missing in design/ASSET_SOURCES.csv (paste and check):", with a ready-to-paste row for each; it never changes the CSV itself (see [Building a shareable copy](../README.md#building-a-shareable-copy)). Columns:

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

A file is copied **only if** `commercial_use` is `yes` **and** the license is filled in (not blank, TBD or unknown) **and** the license isn't non-commercial (NC) or reference-only. Anything else is left out, with the reason in `BUILD_INFO.txt`. Nothing from `assets/references/` is ever copied. Today the real files are Sammy's run animation (cleared, so it is in the build) and the theme song (left out: its `commercial_use` is "tbd" until the owner confirms the Suno plan); everything else is a placeholder.

**Publishing (not done; needs your go-ahead).** The `dist/` folder is a static website, so it can be zipped and uploaded as an HTML game to itch.io, or hosted with GitHub Pages or Netlify. Before any public release:
- Replace the placeholders.
- Clear every art and audio license.
- Choose a final title. Avoid "Sega" and "Genesis" in it.

## Tests

From the `game/` folder (needs Node 18 or newer; no packages to install):

| Command | What it checks |
|---|---|
| `node --test tests/sim.test.mjs` | 67 game-rule checks (see the list below) |
| `node tools/build.mjs` then `node tests/browser-smoke.mjs` | 51 browser checks (see the list below). Add `--shots <folder>` to save screenshots. Needs a Chromium-based browser; set `CHROME_PATH` if it isn't found. |
| `index.html?test=full` | The same autopilot check by hand, in your own browser |
| `index.html?test=touch&touch=1` | The touch-button check by hand (it taps the real buttons for you) |
| `index.html?test=audio&touch=1` | The phone-sound check by hand (result appears as text in the top left) |

**Game-rule checks** cover:
- startup, level layout, movement, jumping, one-way platforms and rocks
- tail-whip; jogger patrol, chase and attack; invincibility after a hit
- Play Possum (confusion, cancel, cooldown, range, the "ready" flash)
- cart (tip, spill, heal, settle), trash lid, vendor, pond, and falling into a dry pit (no splash)
- K.O. and checkpoints; the gauntlet and exit; finishing in mid-air
- pause, restart (also from the pause screen) and play again
- the chainsaw: where it lies, grabbing it, revving (slower, 1 fuel a second, its sound loops and stops on pause, K.O. and restart), quick cuts that slice zombies (blood, chunks, hit-stop, shake), running out of fuel, getting it back after a K.O., and the autopilot using it in the gauntlet; how whip kills look (jogger pops, vendor deflates)
- a full autopilot playthrough, repeatable results, and the art list vs. the example docs (file names and sizes)
- the background bands (rows match the tileset doc and don't overlap), the tail-whip frame width, and the placeholder font (M, W, H and N look different)
- the sound list: every sound the game triggers has a planned name and a beep; file names, versions and variations are read correctly
- the audio converter picks only `.wav` files missing an `.ogg` (or an `.mp3` with `--mp3`), and never overwrites
- animation timings in `config.js` match the frame counts and speeds of the art strips
- art versions (the newest wins), the license rules for the build, and the scanner's PNG checks (size, colour profile, semi-transparent pixels, off-grid colours, too many colours, broken files)
- the scanner's "Still missing" lists (exact file names, folders and sizes, and nothing listed that already exists) and the license rows the build suggests (a new file gets blanks and stays out of the build; a new version copies the older version's row)
- the screen-size maths (`layout.js`) for ten phones, tablets and computers: the right whole-number size, centred on whole real pixels, never cut off, never smaller than ×1, and space kept free for touch buttons
- the touch-button layout for seven phones and tablets (plus notches and a narrow screen): every button at least 56 points (pause 44), on screen and clear of notches, not on top of each other, sharp, and covering only the dirt strip at the bottom corners of the picture, never the top bar or the grass lane; upright, all buttons below the picture
- the touch wording fits on screen
- notches: with and without touch buttons, the picture (and every button, including full screen, RESTART and MUTE) keeps clear of notch, camera-hole and home-bar margins on seven phones and tablets, centred in what's left; computers are unchanged
- the "turn your phone sideways" message: shown only on an upright phone (not a tablet) with touch buttons and until put away; its card is sharp, big enough and clear of notches
- starting sound on phones (with a pretend sound engine and sound files): every kind of tap tries, a refused try is retried, a silent sample plays, every file and copy is primed without a sound and gets its volume back, files are primed only when a finger lifts, a click or a key press (a pretend phone that, like a real one, lets muted files play any time but unlocks them only then: a finger going down must not count), it stops listening once sound is on, it restarts after a call or the lock screen but never while hidden, music waits for the unpause, and mute reaches every copy
- the drawing templates: one for every planned picture at its exact size, kept outside `assets/`; their guide marks are part see-through, so the scanner warns about a guide left in; making them again gives the same files
- the "Zombie Hunter" files: the theme song is found by the scanner, is the level track (and the gauntlet's fallback), starts with the first press on the title screen, and its license row keeps it out of the build with a clear reason; the concept picture stays reference-only; the three README pictures are self-contained and the cast's numbers (3 lid hits, 3 hot dogs) match the game
- the night look: every palette colour is on the 9-bit grid, the gore colours are used for nothing else, the HUD stands out from the sky; the title, quips, prompts (keyboard and touch) and arena banners fit their boxes and use only letters the font has

**Browser checks** cover:
- the shareable copy is up to date: `dist/index.html` has the current code from `src/`, and `BUILD_INFO.txt` has the matching code. If not, it says "run node tools/build.mjs". (So after changing anything in `src/`, build before running this test.)
- the source game and the built game each play title → level → gauntlet → clear → restart with no errors
- real key presses through the normal game loop start the game and move Sammy
- every screen the autopilot never reaches draws without errors: hurt, K.O., play-dead, shield, confused zombies, pause and mute
- art scanning: the newest version of a strip is picked, and a wrong-size file is warned about
- art loading: correct test images load and are drawn, the hit flash works on real art, and a wrong-size test image is reported and not drawn
- sound loading: a test sound effect and test music load, and real key presses play them instead of the beeps; the source game loads every real sound file in `assets/` (today the theme song), and the built game loads none until one is cleared
- touch buttons at a sideways phone (source and built game) and an upright phone: real touch events on the real buttons start the game, move (and turn by sliding), jump higher when held, tail-whip, move and jump with two fingers, pause, mute and restart; every way a finger can be lost (lifted, cancelled, the page losing focus or being hidden) lets go of the button; the first tap unlocks sound
- phone layout: upright (393×852), the "turn your phone sideways" message covers the buttons and keeps the game paused, and PLAY UPRIGHT ANYWAY (at least 48×48 points) puts it away without un-pausing; an upright iPad (820×1180) shows no message; sideways, no message and a full-screen button; on computers (1920×1080, 1440×900, a tall 500×900 window) no message and no buttons
- auto-pause: hiding the page or leaving the window pauses the game and lets go of keys and touch buttons (keys and touch, source and built game); it doesn't resume by itself
- sound on phones (`?test=audio`, with the two test sounds): every kind of tap, click and key press tries to start sound; a refused try is retried; a tap on a touch button starts the real sound engine on the finger going down but primes no file until the finger lifts, then primes all 5 files silently (music plus 4 copies of the jump sound) and stops listening; stopped while hidden, it keeps listening and a tap on the sideways message's button restarts it; after a pretend lock screen, music stays paused until unpause; mute silences every copy. A second run uses the normal browser rule (no real tap possible): no errors, sound stays off, and it keeps listening
- screen size at a sideways phone (852×393, 3 real pixels per point) and a laptop (1366×768): the picture is the size `layout.js` works out, fills the phone's height (95%), the page doesn't scroll, a screenshot shows every game pixel as one solid square (sharp, not blurred), and no touch buttons show

The test art and test sounds live in a temporary copy of the library, never your `assets/` folder.

**Not tested by machine:**
- how the controls feel in human hands
- the difficulty balance (see below)
- gamepads
- whether the beeps sound right, and whether real sound files are audible (headless browsers have no speakers)
- Safari and Firefox (only Chromium was run headless)
- real phones and tablets (phone sizes and touches are only imitated in Chromium): how the buttons feel under real thumbs, real notches (headless Chromium reports none; Node tests cover typical margins), full screen and screen locking (Android), Add to Home Screen (iPhone), whether blocking zoom works in Safari, whether sound really starts on the first tap and comes back after a call or the lock screen, and the iPhone silent switch. See `design/MOBILE_TEST_CHECKLIST.md`

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
| `src/audio.js` | Plays real sound files when present, placeholder beeps otherwise; starts sound on the first tap and restarts it after interruptions |
| `src/layout.js` | Works out how big to draw the game on this screen (whole steps of real pixels) |
| `src/input.js`, `src/main.js` | Controls, screen fitting, main loop and `?test=` self-checks |
| `src/touch.js` | On-screen touch buttons for phones and tablets (where they go is worked out in `layout.js`) |
| `src/phone.js` | Phone page behaviour: the "turn your phone sideways" message, full screen, no accidental zoom or long-press menus |
| `src/bot.js` | Autopilot used only by the tests |
| `tools/` | Art and sound scanner (with PNG checks in `png.mjs`), WAV-to-OGG converter, build script, license rules (`licenses.mjs`), and the drawing-template maker (`make-art-templates.mjs`, which writes blank templates and contact sheets to `templates/art-templates/`; `png-writer.mjs` saves its PNGs) |
| `tests/` | Game-rule tests and the browser check |
| `dist/` | Latest shareable build (made by `tools/build.mjs`) |

Engine: none. It's plain HTML5 canvas and JavaScript at the Genesis-style 320×224 resolution, scaled up by whole numbers of the screen's real pixels (so phones get a bigger picture and every pixel stays sharp). The reasons are in `design/DECISIONS.md`.
