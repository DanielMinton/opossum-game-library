<p align="center"><img src=".github/readme/banner.svg" alt="Pixel-art banner: &quot;Sammy the Opossum — ZOMBIE HUNTER · 16-bit action platformer · working title&quot;. At night on a rain-slick Central Park terrace, Sammy the opossum, snarling in a red bandana, rips a rusty orange chainsaw (coming next in the game) through a zombie jogger in a spray of sparks and blood, while a zombie hot dog vendor and a horde of zombies close in past lamps, the bronze angel fountain, a full moon and the city skyline." width="100%"></p>

# Sammy the Opossum: Zombie Hunter

**Sammy the Opossum: Zombie Hunter** (working title) is a small 2D action platformer in the style of a 16-bit home console game. You play Sammy, an opossum who wakes up in Central Park with no memory of how he got there. Everyone in the city has turned into a zombie, and Sammy doesn't mess around with zombies. He fights his way through Central Park at night, under a full moon and amber lamps, to a last stand on Bethesda Terrace by the angel fountain, with a vicious tail-whip, a trash-can lid, a tipped-over hot dog cart his secret move: playing dead, then getting back up swinging, and a **chainsaw** somebody left on the grass right before the last stand. It's badass action-horror with deadpan, foul-mouthed humour and stylized 16-bit pixel gore (with a low-gore option).

> [!NOTE]
> **Status: playable placeholder prototype.** One level (level 1, Sheep Meadow) can be played from start to finish today. Almost all art is placeholder boxes (now in the night-time look, with a placeholder Bethesda Terrace for the final fight) and the sound effects are computer-made beeps. Real so far: **all of Sammy** (every one of his 13 animations, rebuilt on 2026-10-20 from the owner's master sheets: idle, a four-legged crawl run, jump, fall, land, tail-whip, hurt, play-dead, K.O., victory, and idle, run and rev with the chainsaw), the chainsaw pickup and its top-bar icon, and the level music (the owner's theme song, "Sammy the Opossum : Zombie Hunter", which plays in your own copy; see [Credits](#credits)). The night-time park, the chainsaw and the gore (placeholder drawing, with a low-gore option) are in. "Sammy the Opossum: Zombie Hunter" is a working title.

Every gameplay number and rule in the game is a **proposal**, not an approved decision. They can all be changed.

## I want to…

| I want to… | Go here |
|---|---|
| Play the game | [Play it now](#play-it-now) |
| Add art | [Adding real art](#adding-real-art) |
| Add sound | [Adding sound](#adding-sound) |
| See what's still missing | Run the scanner: [Adding real art, step 1](#adding-real-art) |
| Change a game number (speed, damage, timings) | [game/src/config.js](game/src/config.js) |
| See everything waiting on me | [design/OPEN_TASKS.md](design/OPEN_TASKS.md) |
| See the open questions | [design/OWNER_DECISIONS.md](design/OWNER_DECISIONS.md) |
| Get a blank drawing template | [templates/art-templates/](templates/art-templates/) and [design/ART_BRIEFS.md](design/ART_BRIEFS.md) |
| See what changed | [design/DECISIONS.md](design/DECISIONS.md) |
| Share the game | [Building a shareable copy](#building-a-shareable-copy) (`game/dist/`) |

The same game page works on desktop and on phones and tablets (with touch buttons). Phones can only open it once it's on a website (not done yet), and nobody has tried it on a real phone yet.

## Contents

- [I want to…](#i-want-to)
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

**Online:** the latest build is at **<https://sammytheopossum.vercel.app/>** — it works on phones too (hold the phone sideways). Every push to GitHub updates it.

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

The game draws at 320×224 pixels, like a classic console, and scales up by whole numbers (×2, ×3, ×4 and so on) to fill the window, so pixels stay sharp. The steps count the screen's real pixels, so phones and tablets (which pack 2–3 real pixels into each point) get a much bigger picture than before, and every game pixel is still a clean square.

## Controls

| Action | Keyboard | Gamepad (standard layout) | Touch (phones and tablets) |
|---|---|---|---|
| Move | ← → or A D | D-pad (the cross-shaped direction pad) left/right, or left stick | Arrow pad, bottom left (slide your thumb across to turn round) |
| Jump (hold for a higher jump) | Z, Space, ↑, W or K | A / Cross, or D-pad up | Green JUMP button, bottom right |
| Tail-whip | X or J | X / Square | Red WHIP button |
| Chainsaw (once picked up): hold to rip, tap for a quick cut | Hold X or J | Hold X / Square | Hold the red WHIP button |
| Play Possum (play dead) | C or L | B / Circle or Y / Triangle | Pink POSSUM button |
| Pause / start | Enter, Esc or P | Start | Blue pause button (‖); JUMP or a tap on the picture starts the game |
| Restart the level | R | Select / Back | RESTART (shown while paused) |
| Mute | M | — | MUTE (shown while paused) |
| Gore: full or low | G (also `?gore=low` in the address) | — | GORE (shown while paused) |

(Down is read too, but nothing uses it yet.)

**Chainsaw:** it lies on the grass just before the final fight. Holding the button revs it and cuts whatever is in front; revving slows Sammy down and burns fuel (the orange gauge in the top bar, 20 seconds of revving). When it's empty he goes back to the tail-whip. A K.O. loses it. The game remembers your gore choice in this browser; full gore is the default.

**Sound and the theme song:** browsers keep a page silent until you press a key or tap, so the title screen is silent. The press (or tap) that starts the game also turns sound on, and the theme song starts with it, so you only press once.

Gamepads have not been tested by a real person yet.

**Phones and tablets:** looking great and playing well on mobile as well as desktop is a **major priority**. Two steps are done: the game is bigger and sharper on phones and tablets (held sideways, in our checks it fills 90–95% of an iPhone's height instead of under 60%; with the touch buttons on, iPhones with a notch get a picture one step smaller, about 76% of the height, to make room for them), and it now has **on-screen touch buttons**. They appear only on touch screens, never on a normal computer. Sideways, they sit in the black space beside the picture and may just cover the brown dirt strip at its bottom corners (never the top bar or the grass where Sammy and the zombies walk); upright, below it. The whole level can be played by touch in our automatic checks, but **nobody has tried it on a real phone yet**, and phones still need the game put on a website to open it. See the roadmap below.

**Phone layout (step 3, done):**
- **Hold it sideways.** If a phone with touch buttons is held upright, a "TURN YOUR PHONE SIDEWAYS" message appears and the game waits, paused. Turn the phone and the message goes away; the game stays on the pause screen until you tap play. If you'd rather play upright, tap **PLAY UPRIGHT ANYWAY** (it won't ask again until you close the page). Tablets (like an iPad) play upright without the message, since the picture is still big there. This is the suggested answer to owner question 12; it's still your call.
- **Full screen:** on Android phones and tablets, a blue full-screen button (four corners) sits next to the pause button. It hides the browser's bars and tries to keep the screen sideways. iPhones don't allow this button. Instead, once the game is on a website: open it in Safari, tap **Share**, then **Add to Home Screen**. Opened from the home screen, it fills the whole screen.
- **Notches and rounded corners:** the picture and every button keep clear of the notch, the camera hole, rounded corners and the iPhone's home bar.
- **No accidental zoom, scrolling or text selection** while playing (pinch and double-tap zoom are turned off; the game already scales itself to fill the screen).
- **Auto-pause (computers too):** if the page is hidden (phone locked, another app or tab) or you click into another window, the game pauses and lets go of any held buttons. It never un-pauses by itself.

**Sound on phones (step 4, done):**
- **Sound starts on your first tap** (phones stay silent until you touch the screen; on a computer, the first key press). Any tap counts, including on the touch buttons.
- **iPhone silent switch:** today's computer-made beeps may stay silent on an iPhone with the silent switch on. Flip the switch off to hear them. No switch (newer iPhones)? Swipe down from the top-right corner to open Control Center and tap the bell to turn Silent mode on or off. Real sound files (like the theme song) should play either way.
- **After a phone call, locking the phone or switching apps,** the game is paused; sound comes back when you unpause. If it doesn't, one more tap brings it back.
- **MUTE** silences everything, including a sound that is already playing.
- Not yet heard on a real phone. To check it on real phones, follow **[design/MOBILE_TEST_CHECKLIST.md](design/MOBILE_TEST_CHECKLIST.md)** once the game is on a website.

## What's in level 1

Level 1, **Sheep Meadow**, is 12 screens long. A fast run takes about 1 minute; a first try takes about 3–5 minutes.

- **Tutorial:** on-screen prompts teach moving, jumping and the tail-whip.
- **Zombie joggers** patrol, spot Sammy, chase him and lunge. Two tail-whips defeat one, and its head pops off and bounces away.
- **Four more zombies (added 2026-10-20, placeholder art for now):** the **hippie** (slow, takes three whips, melts into a goo pool; play dead and he forgets you for 3 seconds), the **sweater** (big, never flinches, his shove throws Sammy far and takes the whole trash lid), the **cheerleader** (cheers, then leaps at you; step back or jump as she launches, and whip her while she's stuck on landing) and the **baby** (comes in a litter of three, fast, one whip each, and playing dead does nothing to it). Every one bleeds red and the chainsaw slices every one.
- **Trash lid shield** blocks 3 hits.
- **Hot dog cart and vendor:** whip the cart twice to tip it over. It spills 3 healing hot dogs and knocks nearby zombies back. The vendor zombie throws hot dogs.
- **Play Possum:** Sammy plays dead for up to 3 seconds and nearby zombies get confused. It then needs 6 seconds to recharge.
- **A pond** to fall into (costs 1 heart), lampposts with hidden hot dogs on top, and **two checkpoints**.
- **The gauntlet and the Brute:** at the end, the screen locks and 2 waves arrive (two joggers and a cheerleader; then the baby litter, a hippie and a jogger). Then **the Brute** walks in: a huge pale boss with iron gauntlets who swipes, slams the stone (jump the shockwave), spins and vomits acid. A trash lid and a chainsaw drop in for the fight; the saw cuts him any time, with the most blood in the game. When he goes flat, three hot dogs fall out of him and the park exit opens.

Sammy has 3 hearts. Losing them all (a K.O.) sends him back to the last checkpoint with full health. There are no lives in this version.

For the full screen-by-screen guide, see **[game/README.md](game/README.md)**.

## Meet the cast

<p align="center"><img src=".github/readme/cast.svg" alt="Pixel-art cast lineup at night, left to right, each with a caption: Sammy with a bloody chainsaw, which is coming next (&quot;does not mess around&quot;), a rotting Zombie Jogger (&quot;still dead&quot;), a zombie Hot Dog Vendor in a bloody apron who lobs hot dogs from afar (&quot;lobs hot dogs&quot;), the Chainsaw (&quot;coming next&quot;; it cuts zombies in half), the Hot Dog Cart (&quot;2 whips: 3 hot dogs&quot;; two whips tip it and it spills 3 healing hot dogs) and the Trash Lid Shield power-up (&quot;blocks 3 hits&quot;). The Chainsaw isn't in the game yet." width="100%"></p>

| Who or what | What it does in the game |
|---|---|
| **Sammy** | The opossum hero, and he doesn't mess around. Runs, jumps, tail-whips and plays possum. |
| **Zombie Jogger** | The main enemy. Patrols, chases Sammy and lunges at him. Two whips knock its head off. |
| **Hot Dog Vendor** | A zombie that lobs hot dogs at Sammy from a distance. Deflates when defeated. |
| **Zombie Hippie, Sweater, Cheerleader, Baby** | The rest of the roster (2026-10-20, not in these drawings yet): the slow wall that melts, the brawler who takes your lid, the leaper, and the litter of three. Coded placeholders in contrasting colours until their art is installed. |
| **The Brute** | The level 1 boss, after the final wave (not drawn here yet). Swipe, slam, spin and acid; the chainsaw cuts him any time. |
| **Chainsaw** | A power-up, in the game now with real art. Sammy picks it up before the final fight and, until the fuel runs out, revs and cuts zombies in half. The tail-whip stays his basic attack. |
| **Hot Dog Cart** | Whip it twice to tip it. It spills 3 hot dogs that heal Sammy, and knocks zombies back. |
| **Trash Lid Shield** | A power-up. Once Sammy picks it up, it blocks the next 3 hits from zombies or thrown hot dogs. It doesn't help if he falls in the pond. |

These drawings were made for this page only. They are not the game's art, and they show the proposed gore level. Their "coming next" captions date from before the chainsaw was added; it's in the game now. In the game, most things are still placeholder boxes, except Sammy himself (real art in every animation since 2026-10-20: grey-brown fur, cream face, red polka-dot bandana, cut from the owner's master sheets) and the chainsaw.

## Project status and roadmap

**Done:**
- A complete, playable level 1 with placeholder art and sound.
- **New direction (2026-10-19): Zombie Hunter.** Badass action-horror with dark humour, a chainsaw, Central Park at night. The design docs, art briefs and style guide follow it; the owner's theme song is the level music; the concept picture is saved as a reference (`assets/references/`).
- The first real art: **Sammy's run animation**, then **Sammy with the chainsaw** and the chainsaw pickup and icon.
- **Sammy rebuilt from the master sheets (2026-10-20):** all 13 of his animations are real art now, in one look (`-v02` files; the old white-faced run and the code-built chainsaw strips stay on disk as `-v01`). His run is a four-legged crawl, the owner's choice. Some frames are stand-ins until the owner generates the missing ones (listed in `design/OPEN_TASKS.md`).
- **Stage B (2026-10-19):** the chainsaw power-up (hold to rip, fuel gauge), stylized gore with a low-gore option (G key, `?gore=low`, GORE button), the night park, a placeholder Bethesda Terrace for the final fight, the "Zombie Hunter" title screen and a deadpan, foul-mouthed voice for the on-screen text.
- Bigger, sharper scaling on phones and tablets, and **on-screen touch buttons** (shown only on touch screens).
- The phone layout: a "turn your phone sideways" message, a full-screen button (Android), room for notches, no accidental zoom, and auto-pause when you leave the page.
- Reliable sound on phones: it starts on the first tap and comes back after a call or the lock screen. Plus a step-by-step checklist for testing on a real phone: [design/MOBILE_TEST_CHECKLIST.md](design/MOBILE_TEST_CHECKLIST.md).
- An automatic art and sound loader: put a correctly named file into `assets/`, run the scanner, and it replaces its placeholder.
- Checks for art files (size, colors, see-through pixels).
- A shareable build (`game/dist/`: the game page plus an `assets/` folder with the cleared real art) with license rules and a credits list.
- Automatic game-rule tests and browser checks (see [Tests](#tests)).
- Design docs, templates and worked examples for every kind of art and sound.

**Next:**
1. **You play the chainsaw and the gore** and say whether the fuel, the gore level and the jokes feel right (all Proposed). Real chainsaw sounds and real zombie art come after.
2. **Desktop and mobile (major priority):** the game now fills phone and tablet screens crisply, has on-screen touch buttons, the phone layout (sideways message, full screen, notches, no accidental zoom, auto-pause) and sound that starts on the first tap. Still to do: tests on a real iPhone and Android phone with **[design/MOBILE_TEST_CHECKLIST.md](design/MOBILE_TEST_CHECKLIST.md)**. The game must be put on a website first, which needs your go-ahead (suggested: itch.io or GitHub Pages). The plan is in [design/DECISIONS.md](design/DECISIONS.md).
3. **You (the owner) answer the open questions** in **[design/OWNER_DECISIONS.md](design/OWNER_DECISIONS.md)**. There are 22, each with a suggested answer. The short version is in **[design/OPEN_TASKS.md](design/OPEN_TASKS.md)**. Examples: the final title, exactly how gory it gets, which Suno plan the theme song was made on, who makes the art, and what goes in the first release.
4. You review the draft style guide, [design/STYLE_GUIDE.md](design/STYLE_GUIDE.md) (now with the night look and the gore rules).
5. Real art and sound arrive, starting with the most important files ("Tier 1") in [design/ASSET_REQUEST_CHECKLIST.md](design/ASSET_REQUEST_CHECKLIST.md).
6. A playtest by real people, mainly of the final gauntlet and the Brute. It may be too hard.
7. **Install the zombie art** once the strips made for the hippie, sweater, cheerleader, baby and the Brute are reviewed (the slots are ready; see [design/OPEN_TASKS.md](design/OPEN_TASKS.md)).

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
│   ├── tools/           ← build, art/sound scanner, audio converter, license rules, drawing-template maker
│   ├── tests/           ← automatic checks
│   └── dist/            ← ready-to-share copy (index.html, BUILD_INFO.txt, CREDITS.txt and an assets/ folder with the cleared real art)
├── assets/              ← real art and sound go here (so far all of Sammy's animations, the chainsaw pickup and icon, and the theme song)
│   ├── characters/  enemies/  props/  items/  environments/  npcs/  ui/
│   ├── audio/           ← sfx/ (sound effects) and music/
│   └── references/      ← reference pictures only (the Zombie Hunter concept picture); never shipped
├── design/              ← game brief, owner questions, decisions log, style guide, asset checklist, license list
├── templates/           ← blank forms for describing art, sound, levels and abilities
│   ├── art-templates/   ← blank drawing templates (exact size, with guide marks) and contact sheets
│   └── examples/        ← planning specs for every planned file (proposals only)
└── .github/readme/      ← the artwork on this page
```

The game uses no game engine and no add-on packages. It is plain web-page code (HTML5 canvas and JavaScript), which is why double-clicking works. The reasons are in [design/DECISIONS.md](design/DECISIONS.md).

## Adding real art

*New (Proposed): the game can also show real scenery art: park ground, path, lamps, benches, trees, fences, rocks, bins, puddles, drifting leaves, and Bethesda Terrace's floor, fountain, angel, balustrade, arches and stairs (18 slots, sizes in `design/ART_BRIEFS.md`, "Scenery"). Until a file exists, the game draws a coded stand-in.*

1. **See what's missing.** From the project folder, run the scanner:
   ```sh
   cd game
   node tools/scan-assets.mjs
   ```
   Under **"Still missing — art"** it lists every planned picture that has no real file yet, by folder, with its exact file name and size in pixels. For example, under `assets/characters/character-sammy/` you'll see `sammy-idle-strip-v01.png  192×48`.
2. **Optional: start from a template.** `templates/art-templates/` has a see-through PNG for each planned picture, at the exact size, with faint guide marks (frame edges, feet point, ground line). Draw over it, **erase every guide mark**, and save it under the real name. [design/ART_BRIEFS.md](design/ART_BRIEFS.md) says what each picture should show and what the guide colours mean. To make the templates again: `node tools/make-art-templates.mjs` (from the `game` folder).
3. Save the PNG in that folder, with that exact name and size.
   **Got the picture from an image tool (ChatGPT, Codex ...)?** Don't resize it by hand. From `game/` run `node tools/import-art.mjs your-picture.png --slot jogger:walk`: it removes the background, shrinks it to real pixels, fixes the colours and writes a game-ready strip, a 4x preview and a plain-language report. Prompts to paste into the tool are in [design/ART_PROMPTS.md](design/ART_PROMPTS.md). Nothing is added to the game until you add `--install`.
   **A whole zombie on one sheet?** Run `node tools/import-art.mjs sheet.png --detect` (it finds every frame and writes `detect-overlay.png` and a draft `map.json`), look at the overlay, then `node tools/import-art.mjs --character map.json`: every strip in one run, one shared size and palette, a clean outline, acid green and blood red kept off the zombie, and a plain-language `CHARACTER-REPORT.md`. Steps in [design/ART_PROMPTS.md](design/ART_PROMPTS.md).
4. Add a row for it to `design/ASSET_SOURCES.csv` (who made it and its license; see [Art and licensing rules](#art-and-licensing-rules)). You can leave this until you want to share the game: the build then prints a ready-to-paste row for any file that has none (see [Building a shareable copy](#building-a-shareable-copy)).
5. Run the scanner again (same command). It lists what it found and warns about problems.
6. Reload the game. Every picture with a real file uses it. Everything else stays a placeholder.

You don't need the build to see new art in your own copy. Run `node tools/build.mjs` only when you want to refresh the shareable copy in `game/dist/`.

**Good to know:**
- **Versions:** to update a picture, save a new copy as `-v02`, `-v03` and so on beside the old one. The highest number wins.
- **Size check:** a file of the wrong size is **not** used, because it would be cut into frames wrongly. The placeholder stays and the title screen shows "ART WARNINGS".
- **Other warnings** (they never block a file): colors or see-through pixels that don't fit the 16-bit style, or too many colors in one file.
- **Shared folders:** a few files live in another thing's folder. The hot dog the vendor throws, and its splat, go in the vendor's folder; the hot dog pickup goes in the cart's folder. The scanner's list always shows the right folder.
- **Not shown yet:** some art the docs ask for has no place in the game yet, so adding it changes nothing on screen. The list is in [game/README.md → Adding art](game/README.md#adding-art).

More details (every scanner warning, frame sizes): **[game/README.md → Adding art](game/README.md#adding-art)**. What to send first: [design/ASSET_REQUEST_CHECKLIST.md](design/ASSET_REQUEST_CHECKLIST.md).

## Adding sound

1. **See what's missing.** From the project folder, run the scanner:
   ```sh
   cd game
   node tools/scan-assets.mjs
   ```
   Under **"Still missing — sounds"** it lists every planned sound that has no real file yet, with its exact path. Each sound has its own folder, named after the sound:
   - Sound effect: `assets/audio/sfx/sfx-jump/sfx-jump-v01.ogg`
   - Music: `assets/audio/music/music-level-01-central-park/music-level-01-central-park-v01.ogg`
2. Save the file at that path (`.mp3` or `.wav` instead of `.ogg` is also fine).
3. Add a row for it to `design/ASSET_SOURCES.csv`, just like art. The build prints a ready-to-paste row for you (see [Building a shareable copy](#building-a-shareable-copy)).
4. Run the scanner again (same command).
5. Reload the game and press a key or tap the screen (browsers stay silent until you do). Each sound with a real file uses it; the rest keep their beep.

As with art, run `node tools/build.mjs` only when you want to refresh the shareable copy.

- **Formats:** `.ogg` is preferred. `.mp3` and `.wav` also work.
- **Only have WAV files?** From the project folder, run:
  ```sh
  cd game
  node tools/convert-audio.mjs
  ```
  It makes an `.ogg` next to each `.wav` that doesn't have one yet (add `--mp3` for `.mp3` copies too). It needs a free program called ffmpeg (on a Mac with Homebrew, a free installer for tools like this: `brew install ffmpeg`). It never deletes or overwrites anything. Without ffmpeg, it prints the exact commands to run instead.
- **Versions and variations:** to update a sound, save `sfx-jump-v02.ogg` beside `v01`; the highest number wins. For variety, save `sfx-land-v01-a.ogg`, `sfx-land-v01-b.ogg` and so on; the game picks one at random each time.
- **Music loops whole.** Each track plays from start to end, then starts over. A separate intro that plays only once is not supported yet, so make each track loop cleanly from its end back to its start. (The theme song is the exception for now: its quiet intro and fade-out replay every 70 seconds. A trimmed loop version can come later.)

More details (which format plays first, volume, when music restarts): **[game/README.md → Adding sound](game/README.md#adding-sound)**.

## Building a shareable copy

From the project folder, run:

```sh
cd game
node tools/build.mjs
```

This refreshes `game/dist/`. You only need it for the shareable copy; your own copy (`game/index.html`) picks up new files after the scanner runs.

| File | What it is |
|---|---|
| `index.html` | The game's code in one file. Cleared art and sound are copied into `dist/assets/` beside it (today: Sammy's 13 animations and the chainsaw pickup and icon; the theme song waits on owner question 21), so share the whole `dist/` folder. |
| `assets/` | The cleared real art and sound. |
| `BUILD_INFO.txt` | Which art and sound went in, and why any were left out. Its "Still placeholders (no real file yet):" section is your to-do list: every planned picture and sound that has no real file yet. |
| `CREDITS.txt` | A credit line for every included file whose license asks for one. |

**License rows to paste:** if a file has no row in `design/ASSET_SOURCES.csv`, the build says so near the top of what it prints, under "License rows missing in design/ASSET_SOURCES.csv (paste and check):", with one ready-to-paste row per file. Paste each row into that file, check every column, and run the build again. A new version (like `-v02`) gets a copy of the older version's row. A brand-new file gets blanks to fill in, and it stays out of the shareable copy until you do. The build never changes `ASSET_SOURCES.csv` itself.

**The license gate:** a file goes into the shareable copy only if its row in `design/ASSET_SOURCES.csv`:
- says `yes` under `commercial_use`, and
- names a license (not blank, "TBD" or "unknown"), and
- isn't a non-commercial ("NC") or reference-only license.

Anything else is left out, and `BUILD_INFO.txt` says why. Files in `assets/references/` are never included. Your own copy of the game still uses every file.

Today the real art is all of Sammy (13 animation strips) plus the chainsaw pickup and icon (each licensed in `design/ASSET_SOURCES.csv`, so they go into the build). The theme song is real too, but its row says `commercial_use` is "tbd" until the owner confirms which Suno plan it was made on (owner question 21), so the build leaves it out and plays the placeholder tune. Everything else is a placeholder. The `dist/` folder is saved in the project history for now (this is open question 9 in [design/OWNER_DECISIONS.md](design/OWNER_DECISIONS.md)).

## Put it on the web (Vercel)

The game is a plain website, so hosting is simple. Once it's online you can play it on a phone (and use "Add to Home Screen" on iPhone).

1. Go to [vercel.com](https://vercel.com), sign in with GitHub, click **Add New → Project**, and pick this repository (`opossum-game-library`).
2. Vercel reads `vercel.json` from the repo, so the settings are already filled in: it runs the game's build and publishes the `game/dist` folder. Just click **Deploy**. Leave **Root Directory** blank (the whole repo); the config also copes if it is set to `game`, but blank is simplest.
3. After a minute you get a link like `https://opossum-game-library.vercel.app`. Every push to GitHub updates it automatically.

**Two things to know:**
- The published copy only includes art and sound with a cleared licence row in `design/ASSET_SOURCES.csv`. Until the Suno plan question (number 21 in `design/OWNER_DECISIONS.md`) is answered, the theme song stays out and the placeholder tune plays.
- The link is public to anyone who has it. Vercel's free plan is fine for this.

Command-line alternative: `npm i -g vercel`, then `vercel --prod` in the project folder.

**Share picture and icons:** when the link is pasted into a chat or social post it shows the card in `game/share/og-image.png`; the tab, home-screen and app icons are beside it. The page points at `https://sammytheopossum.vercel.app/og-image.png`; if your Vercel address is different, change that line in `game/index.html` (search for `og:image`).

## Tests

The tests need Node 18 or newer (a free program for running JavaScript). Nothing else to install. From the project folder, run:

```sh
cd game
node --test tests/sim.test.mjs tests/import-art.test.mjs
node tests/browser-smoke.mjs
```

| Command | What it checks |
|---|---|
| `node --test tests/sim.test.mjs` | **116 game-rule tests:** every move, enemy and item in level 1, a full autopilot run, the screen-size, notch, touch-button and "turn sideways" message maths, starting sound on phones, the art, sound and license checks, the "still missing" lists, the suggested license rows, the drawing templates, the theme song (found, used as the level music, kept out of the build until its license is confirmed), the concept picture (reference only), the README pictures, the night palette (every colour on the 9-bit grid, gore colours kept for gore), that every game message fits on screen, the chainsaw (pickup, revving, cuts, fuel, losing it), Sammy's cell sizes and feet points (one table, so he never hops when the animation changes), that the code-made placeholder saw is never drawn over real Sammy art, the gore effects the rules send, and the gore setting (low never draws blood; the game plays the same either way), and the scenery pieces (sizes, pivots, level placement, the rules never read them). |
| `node --test tests/import-art.test.mjs` | **23 art-importer tests:** a blurry picture on a flat or checkerboard background, a contact sheet, a 500-colour picture, an already-correct strip and Sammy's run strip (these must come out exact, the same every time), the unusual PNG layouts it can read, the plain-language problem reports, and the whole-character mode: finding frames and animation groups on a painterly sheet, one shared palette and a clean outline on every strip, feet on the line, loose particles removed, the same bytes every run, acid green and blood red kept away from the gore colours, a 96x96 cell, portrait grids, left-facing sheets, saved palettes and colour shifts, the inside of a curled tail left see-through while eyes stay solid, no palette ever landing exactly on a reserved gore colour, and the chainsaw teeth pass (the chain comes back, the 1 px outline stays). |
| `node tests/browser-smoke.mjs` | **57 browser checks:** opens the game in a hidden Chromium browser, plays the whole level in both the normal and the shareable copy, presses real keys, taps the real touch buttons at phone sizes, draws every screen, loads the theme song (and, in the shareable copy, no sound until it's cleared), loads test art and sound, checks the placeholder saw never covers Sammy's real art, checks the picture is big and sharp at a phone size and a laptop size, checks the "turn your phone sideways" message (upright phones only, not tablets), auto-pause and starting sound on phones, and checks the touch buttons and the message stay hidden on a computer. Needs Chrome, Edge or another Chromium browser. |
| `?test=full` | Open `game/index.html`, click the address bar, type `?test=full` at the very end and press Enter. The game then plays itself ("autopilot") so you can watch a full run. |

If you changed the game's code, run the build (see [Building a shareable copy](#building-a-shareable-copy)) before the browser check. Otherwise the check fails and asks you to run `node tools/build.mjs`.

**Not tested by machine:** how the controls feel, difficulty, gamepads, how the sound actually sounds, Safari, Firefox and phones. See [game/README.md → Tests](game/README.md#tests) for the full lists.

## Design docs map

| File | What it's for |
|---|---|
| [design/GAME_BRIEF.md](design/GAME_BRIEF.md) | The game idea. What you've confirmed, and what is still only proposed. |
| [design/OPEN_TASKS.md](design/OPEN_TASKS.md) | **Start here:** a short list of everything waiting on your answer or your go-ahead. |
| [design/OWNER_DECISIONS.md](design/OWNER_DECISIONS.md) | The open questions only you can answer, each with a suggested answer. |
| [design/ART_BRIEFS.md](design/ART_BRIEFS.md) | What every planned picture and sound should look and sound like, and how to use the drawing templates. All Proposed. |
| [design/DECISIONS.md](design/DECISIONS.md) | A dated log of every choice made so far. "Current state" is at the top. |
| [design/MOBILE_TEST_CHECKLIST.md](design/MOBILE_TEST_CHECKLIST.md) | Step-by-step list for trying the game on a real iPhone and Android phone (once it's on a website). |
| [design/STYLE_GUIDE.md](design/STYLE_GUIDE.md) | Draft art and sound rules: sizes, colors, outlines, light. All Proposed. |
| [design/ASSET_REQUEST_CHECKLIST.md](design/ASSET_REQUEST_CHECKLIST.md) | What art and sound to send, in order of priority. |
| [design/ASSET_SOURCES.csv](design/ASSET_SOURCES.csv) | One row per art or sound file: who made it and its license. Rows so far: Sammy's 13 animations (v02) and his older run and chainsaw strips (v01), the chainsaw pickup and icon, and the theme song (waiting on owner question 21). |
| [templates/](templates/) | Blank forms for describing art (`ASSET.md`), interactive objects (`INTERACTION.md`), sound (`AUDIO.md`), levels (`LEVEL.md`), abilities (`ABILITY.md`) and the style guide. |
| [templates/art-templates/](templates/art-templates/) | Blank, see-through drawing templates at the exact size of each planned picture, plus enlarged, labelled contact sheets (`contact-sheet-*.png`). Made by `game/tools/make-art-templates.mjs`. |
| [templates/examples/README.md](templates/examples/README.md) | Filled-in examples of every form, and the planning specs for every planned file. Proposals only. Run the scanner to see which files exist. |
| [game/README.md](game/README.md) | The detailed game guide: level walk-through, extra art and sound details, build, tests. |
| [CLAUDE.md](CLAUDE.md) | Technical notes for Claude Code. |

## Art and licensing rules

- **Original work only.** The game nods to 16-bit classics through feel, gameplay ideas, colors and humor. It never copies or traces sprites, music, sound effects, logos or characters from other games.
- **No "Sega" or "Genesis"** (or other company or console names) in the title, logo or branding.
- **References never ship.** Pictures in `assets/references/` (today, the Zombie Hunter concept picture) are for inspiration only and are never put in the shareable copy.
- **Gore stays stylized.** Chunky 16-bit pixel gore in reserved colours, never realistic, and every gory picture gets a low-gore version (Proposed; see [design/STYLE_GUIDE.md](design/STYLE_GUIDE.md)).
- **Unknown rights can't ship.** Every art and sound file needs a row in `design/ASSET_SOURCES.csv`. If the license is missing, unknown, non-commercial or reference-only, the file stays out of the build.
- **Examples are planning specs.** Files in `templates/examples/` are proposals. Never copy an example into `assets/` until every TBD is filled in.

**License for this project's code:** no license chosen yet (all rights reserved).

## Credits

- The artwork on this page (banner, cast lineup and footer) is original pixel art made for this project, inspired by the owner's Zombie Hunter concept picture.
- The lettering in that artwork uses the **Ubuntu** font (Light, Medium and Bold) by Dalton Maag, under the Ubuntu Font Licence. The letters were converted to outlines inside the pictures. (GitHub pages can't change fonts, so the font appears only in the artwork.)
- **Theme song:** "Sammy the Opossum : Zombie Hunter" by **themodernopossum** (the project's owner), made with **Suno**. Whether it can be sold with the game depends on the Suno plan it was made on (owner question 21); until then it plays only in your own copy, not the shareable one.
- Apart from the theme song, the game uses no outside art, sound, fonts or code today. Its letters come from a small placeholder font drawn in code.

<p align="center"><img src=".github/readme/play-possum.svg" alt="Pixel-art footer at night: Sammy the opossum plays dead on the wet terrace with an X for an eye and his tongue out, his chainsaw (coming next in the game) lying beside him, while a confused zombie jogger bends to sniff him under a question mark. Text on the left reads &quot;Play Possum&quot; and, below it, &quot;…then the chainsaw starts.&quot;" width="100%"></p>
