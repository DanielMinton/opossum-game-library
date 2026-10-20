# Sammy: placeholder prototype (level 1, Sheep Meadow)

This is a playable first level that uses **placeholder art and sound**. Real art so far: all of Sammy (his 13 animations, cut from the owner's master sheets on 2026-10-20: grey-brown fur, cream face, red bandana; the run is a four-legged crawl) and the chainsaw pickup and top-bar icon. The level music is real too: the owner's theme song "Sammy the Opossum : Zombie Hunter" (made with Suno; it plays here but is left out of `dist/` until its license is confirmed, owner question 21). Otherwise zombies are green boxes, and every sound effect is a code-generated beep. The look is now the "Zombie Hunter" night park (placeholder boxes: night sky, full moon, stars, lit skyline windows, amber lamp glow, wet ground) with a placeholder Bethesda Terrace (stone floor, arches, balustrade, angel fountain) for the final fight. The game's text is deadpan and swears on purpose (owner rule). The chainsaw is in: it lies on the grass just before the final fight; hold WHIP (X) to rip, and the orange top-bar gauge shows its fuel. Gore is stylized placeholder drawing (blood, chunks, zombies cut in half) with a low-gore setting: G, `?gore=low` or the GORE button while paused; the browser remembers it. The gore setting changes drawing only, never the rules (see `design/DECISIONS.md`, Stage B). The on-screen label "PLACEHOLDER ART – NOT FINAL" stays visible the whole time. Your real art and sound replace the placeholders automatically, one file at a time, as you add them (see **Adding art** and **Adding sound** below).

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
| Chainsaw (after pickup): hold to rip | Hold X or J | Hold X / Square | Hold WHIP |
| Play Possum | C or L | B / Circle or Y / Triangle | POSSUM |
| Pause / start | Enter, Esc or P | Start | Pause button; JUMP or a tap on the picture starts |
| Restart level | R | Select / Back | RESTART (while paused) |
| Mute | M | — | MUTE (while paused) |
| Gore full / low | G (or `?gore=low`) | — | GORE (while paused) |

With the touch buttons showing, the title screen and the tutorial messages use touch wording ("TAP JUMP TO START", "WHIP BUTTON: TAIL-WHIP"), and the "PLACEHOLDER ART" label moves to the bottom middle so a button never hides it. Sound starts on the first tap (phones don't allow sound before that). MUTE silences everything, including a sound already playing.

### What's in the level

The level is 12 screens long, about 1 minute for a fast run and 3–5 minutes for a first try.

1. **Start and tutorial:** Sammy starts on the grass. Prompts teach moving, jumping and the tail-whip.
2. **First zombies (screens 2–3):** zombie joggers patrol, spot Sammy within 96 px, chase him, and lunge.
   - Two whips defeat a jogger. Its head pops off and bounces away.
   - **Play Possum lesson (screen 3, moved here 2026-10-20):** press **C** to play dead for up to 3 s. Zombies within 96 px get confused. The ability has a 6 s cooldown: the "PP" icon in the top bar turns grey during it, with a bar beside it that fills up, and flashes when it's ready again. The **hippie** by the second rock is the demo: slow, three whips, melts into goo, and forgets a "dead" Sammy for 3 s.
3. **Trash lid shield (screen 4):** blocks 3 hits.
4. **Checkpoint C1:** the end of screen 4.
5. **Lampposts and the cheerleader (screen 5):** one lamp hides a hot dog on top. The **cheerleader** cheers, then leaps 72 px at Sammy: step back or jump as she launches, and whip her while she's stuck on landing.
6. **Hot dog cart and vendor (screen 6):**
   - Whip the cart twice to tip it. It spills 3 healing hot dogs and knocks nearby zombies back.
   - The vendor zombie lobs hot dogs at Sammy and deflates when defeated.
7. **The clump (screen 7):** two joggers and a hippie together; play dead if it goes wrong.
8. **Pond (screen 8):** falling in costs 1 heart and puts Sammy back on safe ground. A bench helps him cross.
9. **Checkpoint C2 and the sweater (screen 9):** the start of screen 9. The **sweater** stands on the second trash lid: big, never flinches, three whips, and his shove throws Sammy far and takes the whole lid in one go ("BIG LAD. HE WANTS YOUR LID.").
    - **Screen 10:** the **baby litter** (three, fast, one whip each, penned by a rock and a fence; playing dead does nothing to them) and a second cheerleader between the fences.
    - **Screen 11:** the chainsaw lies on the grass, with a hippie right after it to try it on.
10. **Gauntlet (screen 12):**
    - The camera locks and 2 waves drop in: two joggers and a cheerleader, then the baby litter, a hippie and a jogger (8 bodies).
    - Then **the Brute** walks out of the arch (boss bar at the top left): swipe (back off), slam (jump the shockwave), spin and acid vomit (lie flat, mind the puddles), a stagger at half health, a rage at the end. A trash lid and a chainsaw drop in by the left wall as he enters; the saw cuts him any time. Three hot dogs fall out of him when he goes flat, and the park exit opens.
    - Walking through the exit shows the level-clear tally: time, zombies, hot dogs, hits and K.O.s.

**Losing:** Sammy has 3 hearts. A K.O. sends him back to the last checkpoint with full health, and there are no lives in this version. **R** restarts the level at any time, including from the pause screen. Enter on the tally screen plays again.

## Adding art

**The steps are in the main README: [Adding real art](../README.md#adding-real-art).** In short: from the `game/` folder, run `node tools/scan-assets.mjs` to see every missing file with its exact path and size, save the PNG there, add its license row, and run the scanner again. This section only adds details.

**Blank drawing templates:** `templates/art-templates/` has a see-through PNG for every planned picture, at its exact size, with guide marks to erase before saving. What each picture should show, and what the guide colours mean, is in [design/ART_BRIEFS.md](../design/ART_BRIEFS.md). To make the templates again, run `node tools/make-art-templates.mjs` from the `game/` folder.

### Got art from an image tool? Use the importer

Pictures from ChatGPT, Codex and similar tools are almost never game-ready: blurry edges, hundreds of colours, a solid or checkerboard background, the wrong size. `tools/import-art.mjs` fixes that in one command. It needs no packages. From the `game/` folder:

```sh
node tools/import-art.mjs ~/Downloads/jogger-walk.png --slot jogger:walk
```

- **What it does:** reads the slot's size, frame count and feet point from `src/assets.js`; removes the background (solid colour or checkerboard, found automatically, or `--bg "#ff00ff"`); finds the frames (a strip, a sheet with `--cols 4 --rows 2`, or one picture); recovers the real pixel size and shrinks the picture to game size; snaps colours to the 9-bit palette and keeps 15 or fewer (the darkest becomes the outline); puts the feet on the baseline row and the feet point on the slot's column; writes a PNG; and runs the same check as the scanner.
- **What you get** (in `import-out/`): the strip under its manifest name, `...-preview-4x.png` (4x enlargement with frame edges) and `...-report.txt`. The report says in plain words what was changed and ends with **READY**, **READY WITH WARNINGS** or **REDO** (with what to ask the art tool for).
- **PNG only.** For a JPG or WebP, convert first. On a Mac: `sips -s format png "in.jpg" --out out.png`.
- **Nothing touches `assets/` until you add `--install`.** `--install` never overwrites (use `--force`, or `--version 2` for a `-v02` file) and prints a ready-to-paste `ASSET_SOURCES.csv` row. `--dry-run` prints the report and writes nothing.
- **Other options:** `--list` (every slot), `--frames N`, `--src-pixel N`, `--height H`, `--scale K` (match a strip you already made), `--anchor-x X`, `--shrink` (if a pose is too wide for the cell), `--relayout`, `--tolerance N`. Art with no slot yet: `--size 32x32 --frames 4 --pivot 16,31` (add `--no-feet` for things that float). `--help` lists everything.
- **A picture that is already the right size and see-through** keeps its layout; only the colours are tidied. Sammy's old run strip (v01) comes out unchanged.
- **A whole zombie from one sheet (character mode):** `node tools/import-art.mjs sheet.png --detect` finds every frame (even with a row of big poses on top), writes `detect-overlay.png` (numbered boxes, one colour per animation) and a draft `map.json`; `node tools/import-art.mjs --character map.json` builds **all** the strips at once with one shared scale, one shared palette (15 colours at most), a clean 1 px outline, loose particles removed, gore colours (acid green, blood red) moved away from the zombie, and writes `CHARACTER-REPORT.md`, a contact sheet, a palette swatch and before/after pictures. `--prefix NAME` for a new enemy type, `--size 96x96` (up to 192x192) or `"cell"` in the map for big ones, `--grid-split 10x2` for portrait grids, `--palette` / `--save-palette`, `--recolor`, `--hue-shift`, `--allow-blood`, `--flip`. Steps and the best prompt: [design/ART_PROMPTS.md](../design/ART_PROMPTS.md).
- Prompts to paste into the image tool, and a checklist of what to regenerate: [design/ART_PROMPTS.md](../design/ART_PROMPTS.md). The reasons for the choices are in `design/DECISIONS.md` ("Art import tool").

**What the scanner warns about** (a warning never stops a file from being listed):
- **Wrong size**, for example "expected 384x48 px, got 100x48". The game does **not** use a wrong-size file, because it would be cut into frames wrongly. The placeholder stays, the browser console says why, and the title screen shows "ART WARNINGS".
- **Colour-profile or gamma data** in the PNG. Colours may shift. Export without a profile.
- **Semi-transparent pixels.** Every pixel must be fully clear or fully solid.
- **Colours off the 9-bit grid.** Each red, green and blue value must be one of 0, 36, 72, 108, 144, 180, 216, 252.
- **More than 15 solid colours** in one file (one palette line).
- Some PNG types (16-bit, interlaced, greyscale) can't have their pixels checked; the scanner says "pixel checks skipped". Size is still checked, even when the rest of the file is damaged.

**Licenses:** art only goes into the shareable build when its row in `design/ASSET_SOURCES.csv` clears it (see **Build a shareable copy**). The game on your own computer uses every file either way.

Frame sizes, frame counts, speeds and the feet point (24, 47) follow the draft style guide (`design/STYLE_GUIDE.md`) and each example's animation table. Exceptions for Sammy: his feet point is (28, 47), not (24, 47), so his tail has room behind him, and some of his strips use wider cells with their own feet point so his body stays put when the animation changes (since 2026-10-20): run and tail-whip 64×48 with the feet at (36, 47), play-dead 64×48 at (32, 47), K.O. 76×48 at (38, 47), chainsaw idle and run 64×48 at (26, 47), chainsaw rev 76×48 at (26, 47), and land 48×48 at (28, 47) like idle (since v03; v02 had (17, 47)). The full table is in `game/src/assets.js` and a test checks it. Background band rows, scroll speeds and loop widths are in the `bg:` lines of `game/src/assets.js`.


### Scenery art (2026-10-19, Proposed)

The park and Bethesda Terrace are drawn in code today (ground, path, trees, lamps, benches, fences, rocks, bins, puddles, drifting leaves, and the terrace arches, balustrade, stairs, angel and fountain). Each piece has a slot, and a real picture replaces its coded drawing as soon as the file exists at the right size. Files go in `assets/environments/environment-central-park-tileset/` (`scenery-*`) and `assets/environments/environment-bethesda-terrace/` (`bethesda-*`). Slots: ground-park (32×32, 2 tiles), ground-path (32×32), lamp (16×64), lamp-glow (48×48), bench (32×32), tree-far (128×96, 2 trees), tree-near (192×128, 2 trees), fence (16×24), rock (32×16), trashcan (16×24), leaves-fg (640×64, 2 frames), puddle (64×8, 2 frames), bethesda ground (32×32), fountain (384×96, 3 frames), angel (48×64), balustrade (32×24), arch (64×80), stairs (64×32). Where each one stands is in `level.js` (`scenery`); it is cosmetic only. Briefs: `design/ART_BRIEFS.md`, "Scenery (park and Bethesda Terrace)".

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

**Music:** `music-level-01-central-park` plays during the level. Today that is a loop edit of the owner's theme song (`music-level-01-central-park-v02.mp3`/`.ogg`, 56 s: the groove plus the drum build, cut on the beat so the end runs straight back into the start; the full 70 s song is kept as `-v01` and the newest version wins). It starts with the key press or tap that starts the game (browsers keep the title screen silent until then), so nobody presses twice. Loop points are still not supported, so the loop is simply a whole file cut to repeat cleanly. `music-level-01-gauntlet` plays during the gauntlet; without it, the level music keeps playing there without restarting. Real music also carries on (rather than restarting) after a checkpoint respawn or **R**; a K.O. starts it over. Pausing keeps the music's place, for both real music and the placeholder tune.

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
- `assets/`: the cleared real art and sound (today: Sammy's 13 animations plus the chainsaw pickup and icon; the theme song isn't cleared yet). Share the whole `dist/` folder.
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

A file is copied **only if** `commercial_use` is `yes` **and** the license is filled in (not blank, TBD or unknown) **and** the license isn't non-commercial (NC) or reference-only. Anything else is left out, with the reason in `BUILD_INFO.txt`. Nothing from `assets/references/` is ever copied. Today the real files are Sammy's 13 animation strips and the chainsaw pickup and icon (cleared, so they are in the build) and the theme song (left out: its `commercial_use` is "tbd" until the owner confirms the Suno plan); everything else is a placeholder.

**Publishing (not done; needs your go-ahead).** The `dist/` folder is a static website, so it can be zipped and uploaded as an HTML game to itch.io, or hosted with GitHub Pages or Netlify. Before any public release:
- Replace the placeholders.
- Clear every art and audio license.
- Choose a final title. Avoid "Sega" and "Genesis" in it.

## Tests

From the `game/` folder (needs Node 18 or newer; no packages to install):

| Command | What it checks |
|---|---|
| `node --test tests/sim.test.mjs` | 116 game-rule checks (see the list below) |
| `node --test tests/import-art.test.mjs` | 23 art-importer checks (`npm test` runs both test files: 139 in all) |
| `node tools/build.mjs` then `node tests/browser-smoke.mjs` | 57 browser checks (see the list below). Add `--shots <folder>` to save screenshots. Needs a Chromium-based browser; set `CHROME_PATH` if it isn't found. |
| `index.html?test=full` | The same autopilot check by hand, in your own browser |
| `index.html?test=touch&touch=1` | The touch-button check by hand (it taps the real buttons for you) |
| `index.html?test=audio&touch=1` | The phone-sound check by hand (result appears as text in the top left) |
| `index.html?test=shot&frames=N` | Stops after N frames for a screenshot. Add `&god=0` to let the autopilot take hits, or `&pose=hurt`, `ko`, `playdead`, `attack`, `victory`, `jump`, `fall`, `land`, `sawidle`, `sawrun` or `sawrev` to put Sammy in that state at the end (art the autopilot rarely shows) |

**Game-rule checks** cover:
- startup, level layout, movement, jumping, one-way platforms and rocks
- tail-whip; jogger patrol, chase and attack; invincibility after a hit
- Sammy's art cells: one table of cell widths and feet points (48-wide strips at (28, 47); run, tail-whip, play-dead, K.O. and the chainsaw strips wider, the chainsaw rev 76 wide, each with its own feet column; land back at (28, 47)), and the chainsaw cells hold the saw's reach
- Play Possum (confusion, cancel, cooldown, range, the "ready" flash)
- cart (tip, spill, heal, settle), trash lid, vendor, pond, and falling into a dry pit (no splash)
- K.O. and checkpoints; the gauntlet and exit; finishing in mid-air
- pause, restart (also from the pause screen) and play again
- the chainsaw: where it lies, grabbing it, revving (slower, 1 fuel a second, its sound loops and stops on pause, K.O. and restart), quick cuts that slice zombies (blood, chunks, hit-stop, shake), running out of fuel, getting it back after a K.O., and the autopilot using it in the gauntlet; how whip kills look (jogger pops, vendor deflates)
- a full autopilot playthrough, repeatable results, and the art list vs. the example docs (file names and sizes)
- the enemy type table: every type is one complete row (settings, brain, start state, drawer, a strip for every animation) and no "is it a jogger?" checks are left in the code; an unknown or half-written type is refused at once; knockback, shield push, cart knock, Play Possum grace and the defeat style come from the table; a type that doesn't flinch flashes white, keeps coming and still loses health
- the hippie and the sweater (2026-10-20): their rows, cells (48×48 and 64×56) and timings match the design; the hippie takes three whips, is pushed half as far as a jogger, melts into a goo pool that outlives him (never from the saw) and gives 3 s of Play Possum grace; the sweater never flinches, flops after three whips, his shove throws Sammy 240 and takes the whole lid in one go (a plain bump is an ordinary hit), and Play Possum makes him walk over and sniff from 32 px without ever touching Sammy (and never off a ledge); their gag lines, placeholder colours and the goo pool draw in every state with full and low gore; their three sounds are planned; the autopilot still clears a level with them placed
- the cheerleader: a harmless 0.45 s cheer, then a 72 px leap that hurts in the air and leaves her stuck on landing; a step back makes her land short and a jump at the launch clears her; no leap into the pond or through a fence; Play Possum fools her for 0.75 s and never freezes her in mid-air
- the baby: one whip pops it (red, its own cry), the chainsaw slices it, a level entry with `litter: 3` stands three 32 px apart (and brings them back after a K.O.), Play Possum does nothing to it (it bumps a lying Sammy), its rattle has its own sound; both types draw in their own colours in every state, their gag lines fit the font, and the autopilot still clears a level with them in it
- the Brute (the level 1 boss): the arena brings him in after the last wave with the banner and the supplies (lid and chainsaw) and opens the exit only when he is dead; his entrance; each attack in turn (swipe: tell, step, low swings, big knockback, safe opening; slam: tell, two floor shockwaves that are jumpable, stuck opening, cooldown; spin: high, both sides, dizzy; acid vomit every fourth attack: high stream, puddles that land when it ends and burn standing or lying, ignore the lid, never knock back, dry up); the stagger at half health and the enrage (shorter tells, faster walk, double shockwaves, vomit every third attack); the chainsaw cutting him any time with the most gore; Play Possum (confused until Sammy gets up, an attack already started finishes, then a moment of grace to walk through him); his death (the crawl, the hot dogs, the exit); a K.O. resetting the fight; the chainsaw supply refuelling; the autopilot beating him without god mode in 10 to 30 s; determinism and low gore; his lines and art cells; the boss bar portrait in every state with no gore colour in low gore
- level 1 placement (2026-10-20): 17 bodies, 7 joggers, every new type where the design puts it (the hippie under the moved Play Possum prompt, the sweater on the second lid, the litter far from the lesson and penned, the last hippie after the chainsaw), prompts in order, nothing over the pond; the typed gauntlet waves (entries drop from alternating sides, a litter from one side, unique ids, an unknown type throws) and then the Brute; the full autopilot run beats every type on the way and is repeatable
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
- scenery: 18 slots with bottom-centre pivots, level data only names real pieces, benches and lamps sit on their platforms, `sim.js` never reads scenery and the game plays the same without it
- the gore setting: low gore never draws a gore colour and full does; it's picked from `?gore=`, then the remembered choice, then full, and blocked storage is fine; the rules never read it, G is not a game button, and the game plays the same in full and low

**Browser checks** cover:
- real scenery art (lamp, bench, ground) in a temporary copy loads and is drawn instead of the coded placeholder; a wrong-size rock is reported and not used
- the shareable copy is up to date: `dist/index.html` has the current code from `src/`, and `BUILD_INFO.txt` has the matching code. If not, it says "run node tools/build.mjs". (So after changing anything in `src/`, build before running this test.)
- the source game and the built game each play title → level → gauntlet → clear → restart with no errors
- real key presses through the normal game loop start the game and move Sammy
- every screen the autopilot never reaches draws without errors: hurt, K.O., play-dead, shield, confused zombies, every state of every zombie type and of the Brute (with his health bar and the floor hazards), Sammy with the chainsaw (idle, run, rev, low fuel), every defeat style and gore effect in full and low gore, pause and mute
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

**Difficulty note:** the autopilot clears the level when it can't take damage (about 90 s of game time with the full roster and the Brute). Taking normal damage it only proves the Brute fight itself (a scripted chainsaw kill in 10–30 s, never K.O.d); in the park it dies to the first zombies, because it never jumps away or plays possum. A human player can do both, but the gauntlet and the boss may still be too hard. This needs a playtest.

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
| `src/scenery.js` | Scenery: coded placeholders for the park and Bethesda Terrace, and the drawing of real scenery art |
| `src/bot.js` | Autopilot used only by the tests |
| `tools/` | Art and sound scanner (with PNG checks in `png.mjs`), WAV-to-OGG converter, build script, license rules (`licenses.mjs`), the drawing-template maker (`make-art-templates.mjs`, which writes blank templates and contact sheets to `templates/art-templates/`; `png-writer.mjs` saves its PNGs), and `chainsaw-teeth.mjs`, the small pass that paints the chain teeth back onto Sammy's three chainsaw strips after the importer (see `design/DECISIONS.md`, "Sammy v03") |
| `tests/` | Game-rule tests and the browser check |
| `dist/` | Latest shareable build (made by `tools/build.mjs`) |

Engine: none. It's plain HTML5 canvas and JavaScript at the Genesis-style 320×224 resolution, scaled up by whole numbers of the screen's real pixels (so phones get a bigger picture and every pixel stays sharp). The reasons are in `design/DECISIONS.md`.
