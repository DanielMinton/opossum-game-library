<p align="center"><img src=".github/readme/banner.svg" alt="Pixel-art banner: &quot;Sammy — An opossum vs. the zombie joggers of Central Park · working title · 16-bit platformer · prototype&quot;. At night in the park, Sammy the opossum tail-whips a zombie jogger whose head boings off on a spring, while hot dogs fly from a tipped hot dog cart and another zombie reaches out of the bushes." width="100%"></p>

# Sammy

**Sammy** is a small 2D platformer in the style of a 16-bit home console game. You play Sammy, an opossum who wakes up in Central Park with no memory of how he got there. Everyone in the city has turned into a zombie. Sammy fights his way through with his tail, a trash-can lid, a tipped-over hot dog cart, and his secret move: playing dead. The zombies are funny, not scary: heads pop off and bounce, and vendors deflate like balloons.

> [!NOTE]
> **Status: playable placeholder prototype.** One level (level 1, Sheep Meadow) can be played from start to finish today. All art is placeholder boxes and all sound is computer-made beeps. No real art or sound has been added yet. "Sammy" is a working title.

Every gameplay number and rule in the game is a **proposal**, not an approved decision. They can all be changed.

## Contents

- [Play it now](#play-it-now)
- [Controls](#controls)
- [What's in level 1](#whats-in-level-1)
- [Meet the cast](#meet-the-cast)
- [Project status and roadmap](#project-status-and-roadmap)
- [How the project is organized](#how-the-project-is-organized)
- [Adding real art](#adding-real-art)
- [Adding sound](#adding-sound)
- [Building a shareable copy](#building-a-shareable-copy)
- [Tests](#tests)
- [Design docs map](#design-docs-map)
- [Art and licensing rules](#art-and-licensing-rules)
- [Credits](#credits)

---

## Play it now

1. On GitHub, click the green **Code** button, then **Download ZIP**, and unzip it. (Developers can use `git clone` instead.)
2. Double-click **`game/index.html`**. It opens in your web browser and the game starts.

That's it. There is nothing to install and no internet connection is needed. The ready-to-share copy, **`game/dist/index.html`**, works the same way.

**If your browser refuses to open local files,** start a tiny local web server instead. Open Terminal, go to the project folder, and run:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000/game/> in your browser.

"The project folder" means the `opossum-game-library` folder. In Terminal, type `cd ` (with a space), drag the folder onto the window and press Enter. Every command on this page starts from there.

**Browsers:** the game is tested automatically in Chromium (the engine behind Chrome and Edge). It should also run in Safari and Firefox, but those have not been tested yet.

The game draws at 320×224 pixels, like a classic console, and scales up by whole numbers (×2, ×3, ×4 and so on) to fill the window, so pixels stay sharp.

## Controls

| Action | Keyboard | Gamepad (standard layout) |
|---|---|---|
| Move | ← → or A D | D-pad (the cross-shaped direction pad) left/right, or left stick |
| Jump (hold for a higher jump) | Z, Space, ↑, W or K | A / Cross, or D-pad up |
| Tail-whip | X or J | X / Square |
| Play Possum (play dead) | C or L | B / Circle or Y / Triangle |
| Pause / start | Enter, Esc or P | Start |
| Restart the level | R | Select / Back |
| Mute | M | — |

(Down is read too, but nothing uses it yet.)

Gamepads have not been tested by a real person yet. Touch controls for phones are not built.

## What's in level 1

Level 1, **Sheep Meadow**, is 12 screens long. A fast run takes about 1 minute; a first try takes about 3–5 minutes.

- **Tutorial:** on-screen prompts teach moving, jumping and the tail-whip.
- **Zombie joggers** patrol, spot Sammy, chase him and lunge. Two tail-whips defeat one, and its head pops off and bounces away.
- **Trash lid shield** blocks 3 hits.
- **Hot dog cart and vendor:** whip the cart twice to tip it over. It spills 3 healing hot dogs and knocks nearby zombies back. The vendor zombie throws hot dogs.
- **Play Possum:** Sammy plays dead for up to 3 seconds and nearby zombies get confused. It then needs 6 seconds to recharge.
- **A pond** to fall into (costs 1 heart), lampposts with hidden hot dogs on top, and **two checkpoints**.
- **The gauntlet:** at the end, the screen locks and 3 waves of joggers arrive (2, then 3, then 4). Beat them all to open the park exit and see your score tally.

Sammy has 3 hearts. Losing them all (a K.O.) sends him back to the last checkpoint with full health. There are no lives in this version.

For the full screen-by-screen guide, see **[game/README.md](game/README.md)**.

## Meet the cast

<p align="center"><img src=".github/readme/cast.svg" alt="Pixel-art lineup of the cast, left to right: Sammy, Zombie Jogger, Hot Dog Vendor, Hot Dog Cart and Trash Lid Shield, each with a short caption." width="100%"></p>

| Who or what | What it does in the game |
|---|---|
| **Sammy** | The opossum hero. Runs, jumps, tail-whips and plays possum. |
| **Zombie Jogger** | The main enemy. Patrols, chases Sammy and lunges at him. Two whips knock its head off. |
| **Hot Dog Vendor** | A zombie that lobs hot dogs at Sammy from a distance. Deflates when defeated. |
| **Hot Dog Cart** | Whip it twice to tip it. It spills 3 hot dogs that heal Sammy, and knocks zombies back. |
| **Trash Lid Shield** | A power-up. Once Sammy picks it up, it blocks the next 3 hits from zombies or thrown hot dogs. It doesn't help if he falls in the pond. |

These drawings were made for this page only. They are not the game's art. In the game itself, everyone is still a placeholder box.

## Project status and roadmap

**Done:**
- A complete, playable level 1 with placeholder art and sound.
- An automatic art and sound loader: put a correctly named file into `assets/`, run the scanner, and it replaces its placeholder.
- Checks for art files (size, colors, see-through pixels).
- A shareable build (one file today, plus an `assets/` folder once real art is cleared) with license rules and a credits list.
- Automatic game-rule tests and browser checks (see [Tests](#tests)).
- Design docs, templates and worked examples for every kind of art and sound.

**Next:**
1. **You (the owner) answer the open questions** in **[design/OWNER_DECISIONS.md](design/OWNER_DECISIONS.md)**. There are 11, each with a suggested answer. Examples: the final title, how gory it gets, who makes the art and music, and what goes in the first release.
2. You review the draft style guide, [design/STYLE_GUIDE.md](design/STYLE_GUIDE.md).
3. Real art and sound arrive, starting with the most important files ("Tier 1") in [design/ASSET_REQUEST_CHECKLIST.md](design/ASSET_REQUEST_CHECKLIST.md).
4. A playtest by real people, mainly of the final gauntlet. It may be too hard.

There is no release date. Publishing (for example on itch.io) has not been done and needs your go-ahead.

## How the project is organized

```
opossum-game-library/
├── README.md            ← this page
├── CLAUDE.md            ← working notes for Claude Code (the AI helper)
├── game/                ← the game itself
│   ├── index.html       ← double-click to play
│   ├── README.md        ← detailed game guide
│   ├── src/             ← the game's code (rules, drawing, sound, controls, level layout)
│   ├── tools/           ← build, art/sound scanner, audio converter, license rules
│   ├── tests/           ← automatic checks
│   └── dist/            ← ready-to-share copy (index.html, BUILD_INFO.txt, CREDITS.txt; later an assets/ folder)
├── assets/              ← real art and sound go here (empty folders for now)
│   ├── characters/  enemies/  props/  items/  environments/  npcs/  ui/
│   ├── audio/           ← sfx/ (sound effects) and music/
│   └── references/      ← reference pictures only; never shipped
├── design/              ← game brief, owner questions, decisions log, style guide, asset checklist, license list
├── templates/           ← blank forms for describing art, sound, levels and abilities
│   └── examples/        ← filled-in examples (proposals only, not real files)
└── .github/readme/      ← the artwork on this page
```

The game uses no game engine and no add-on packages. It is plain web-page code (HTML5 canvas and JavaScript), which is why double-clicking works. The reasons are in [design/DECISIONS.md](design/DECISIONS.md).

## Adding real art

1. Look up the exact file name in the art list in `game/src/assets.js` (34 planned files). For example: `assets/characters/character-sammy/sammy-run-strip-v01.png`.
2. Save the PNG at that path.
3. Add a row for it to `design/ASSET_SOURCES.csv` (who made it and its license; see [Art and licensing rules](#art-and-licensing-rules)).
4. From the project folder, run the scanner. It lists what it found and warns about problems.
   ```sh
   cd game
   node tools/scan-assets.mjs
   ```
5. Reload the game. Every picture with a real file uses it. Everything else stays a placeholder.

**Good to know:**
- **Versions:** to update a picture, save a new copy as `-v02`, `-v03` and so on beside the old one. The highest number wins.
- **Size check:** a file of the wrong size is **not** used, because it would be cut into frames wrongly. The placeholder stays and the title screen shows "ART WARNINGS".
- **Other warnings** (they never block a file): colors or see-through pixels that don't fit the 16-bit style, or too many colors in one file.

Full details: **[game/README.md → Adding art](game/README.md#adding-art)**. What to send first: [design/ASSET_REQUEST_CHECKLIST.md](design/ASSET_REQUEST_CHECKLIST.md).

## Adding sound

1. Give each sound its own folder under `assets/audio/`, named after the sound, with a version on the file:
   - Sound effect: `assets/audio/sfx/sfx-jump/sfx-jump-v01.ogg`
   - Music: `assets/audio/music/music-level-01-central-park/music-level-01-central-park-v01.ogg`
2. From the project folder, run the scanner:
   ```sh
   cd game
   node tools/scan-assets.mjs
   ```
3. Reload the game and press a key (browsers stay silent until you do).

There are 23 planned sounds: 21 sound effects and 2 music tracks (level music and gauntlet music). The full list is in `game/src/assets.js`.

- **Formats:** `.ogg` is preferred. `.mp3` and `.wav` also work.
- **Only have WAV files?** From the project folder, run:
  ```sh
  cd game
  node tools/convert-audio.mjs
  ```
  It makes an `.ogg` next to each `.wav` that doesn't have one yet (add `--mp3` for `.mp3` copies too). It needs a free program called ffmpeg (on a Mac with Homebrew, a free installer for tools like this: `brew install ffmpeg`). It never deletes or overwrites anything.
- **Music loops whole.** Each track plays from start to end, then starts over. A separate intro that plays only once is not supported yet, so make each track loop cleanly from its end back to its start.

Full details: **[game/README.md → Adding sound](game/README.md#adding-sound)**.

## Building a shareable copy

From the project folder, run:

```sh
cd game
node tools/build.mjs
```

This refreshes `game/dist/`:

| File | What it is |
|---|---|
| `index.html` | The game's code in one file. Today that is the whole game. Once cleared art and sound exist, they are copied into `dist/assets/` beside it, so share the whole `dist/` folder. |
| `BUILD_INFO.txt` | Which art and sound went in, and why any were left out. |
| `CREDITS.txt` | A credit line for every included file whose license asks for one. |

**The license gate:** a file goes into the shareable copy only if its row in `design/ASSET_SOURCES.csv`:
- says `yes` under `commercial_use`, and
- names a license (not blank, "TBD" or "unknown"), and
- isn't a non-commercial ("NC") or reference-only license.

Anything else is left out, and `BUILD_INFO.txt` says why. Files in `assets/references/` are never included. Your own copy of the game still uses every file.

Today there is no real art or sound, so the build is placeholders only. The `dist/` folder is saved in the project history for now (this is open question 9 in [design/OWNER_DECISIONS.md](design/OWNER_DECISIONS.md)).

## Tests

The tests need Node 18 or newer (a free program for running JavaScript). Nothing else to install. From the project folder, run:

```sh
cd game
node --test tests/sim.test.mjs
node tests/browser-smoke.mjs
```

| Command | What it checks |
|---|---|
| `node --test tests/sim.test.mjs` | **38 game-rule tests:** every move, enemy and item in level 1, a full autopilot run, and the art, sound and license checks. |
| `node tests/browser-smoke.mjs` | **22 browser checks:** opens the game in a hidden Chromium browser, plays the whole level in both the normal and the shareable copy, presses real keys, draws every screen, and loads test art and sound. Needs Chrome, Edge or another Chromium browser. |
| `?test=full` | Open `game/index.html`, click the address bar, type `?test=full` at the very end and press Enter. The game then plays itself ("autopilot") so you can watch a full run. |

If you changed the game's code, run the build (see [Building a shareable copy](#building-a-shareable-copy)) before the browser check. Otherwise the check fails and asks you to run `node tools/build.mjs`.

**Not tested by machine:** how the controls feel, difficulty, gamepads, how the sound actually sounds, Safari, Firefox and phones. See [game/README.md → Tests](game/README.md#tests) for the full lists.

## Design docs map

| File | What it's for |
|---|---|
| [design/GAME_BRIEF.md](design/GAME_BRIEF.md) | The game idea. What you've confirmed, and what is still only proposed. |
| [design/OWNER_DECISIONS.md](design/OWNER_DECISIONS.md) | The open questions only you can answer, each with a suggested answer. |
| [design/DECISIONS.md](design/DECISIONS.md) | A dated log of every choice made so far. "Current state" is at the top. |
| [design/STYLE_GUIDE.md](design/STYLE_GUIDE.md) | Draft art and sound rules: sizes, colors, outlines, light. All Proposed. |
| [design/ASSET_REQUEST_CHECKLIST.md](design/ASSET_REQUEST_CHECKLIST.md) | What art and sound to send, in order of priority. |
| [design/ASSET_SOURCES.csv](design/ASSET_SOURCES.csv) | One row per art or sound file: who made it and its license. Empty today. |
| [templates/](templates/) | Blank forms for describing art (`ASSET.md`), interactive objects (`INTERACTION.md`), sound (`AUDIO.md`), levels (`LEVEL.md`), abilities (`ABILITY.md`) and the style guide. |
| [templates/examples/README.md](templates/examples/README.md) | Filled-in examples of every form. Proposals only; none of these files exist yet. |
| [game/README.md](game/README.md) | The detailed game guide: level walk-through, adding art and sound, build, tests. |
| [CLAUDE.md](CLAUDE.md) | Technical notes for Claude Code. |

## Art and licensing rules

- **Original work only.** The game nods to 16-bit classics through feel, gameplay ideas, colors and humor. It never copies or traces sprites, music, sound effects, logos or characters from other games.
- **No "Sega" or "Genesis"** (or other company or console names) in the title, logo or branding.
- **References never ship.** Pictures in `assets/references/` are for inspiration only and are never put in the shareable copy.
- **Unknown rights can't ship.** Every art and sound file needs a row in `design/ASSET_SOURCES.csv`. If the license is missing, unknown, non-commercial or reference-only, the file stays out of the build.
- **Examples are not real.** Files in `templates/examples/` are proposals. Never leave an unfinished example inside `assets/`.

**License for this project's code:** no license chosen yet (all rights reserved).

## Credits

- The artwork on this page (banner, cast lineup and footer) is original pixel art made for this project.
- The lettering in that artwork uses the **Ubuntu** font (Light) by Dalton Maag, under the Ubuntu Font Licence. The letters were converted to outlines inside the pictures. (GitHub pages can't change fonts, so the font appears only in the artwork.)
- The game itself uses no outside art, sound, fonts or code today. Its letters come from a small placeholder font drawn in code.

<p align="center"><img src=".github/readme/play-possum.svg" alt="Pixel-art footer: Sammy lies on his back on the grass with his feet in the air, playing dead, with an X for an eye, his tongue out and a &quot;Z z&quot; above him. A zombie jogger peers over a bush with a question mark over its head. Text on the left reads &quot;Play Possum&quot; and, below it, &quot;he's fine. probably.&quot; A hot dog lies in the grass on the right." width="100%"></p>
