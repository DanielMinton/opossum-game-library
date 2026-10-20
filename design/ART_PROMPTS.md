# Art prompts: copy, paste, import

For making zombie art in an image tool (ChatGPT, Codex, Midjourney and so on) and getting it into the game with **one command**. Everything here is a **Proposed** starting point; change the wording freely. This page covers the first push: the **zombie jogger** and the **zombie hot dog vendor**. What each frame should show is in `design/ART_BRIEFS.md`; the look rules are in `design/STYLE_GUIDE.md`.

## The short version

1. Open your image tool. Attach Sammy's run strip (see "Show it Sammy" below).
2. Paste the **locked character description**, then the **animation prompt** for one strip.
3. Save the picture as a PNG (JPG or WebP: see the box below).
4. In Terminal, from the `game` folder, run the importer with that strip's slot:
   ```sh
   cd game
   node tools/import-art.mjs ~/Downloads/jogger-walk.png --slot jogger:walk
   ```
5. Open `import-out/zombie-jogger-walk-strip-v01-preview-4x.png` and read `...-report.txt`. The report ends in one of three verdicts:
   - **READY**: run the same command again with `--install` and you're done.
   - **READY WITH WARNINGS**: usable, but read the warnings; regenerate if you don't like the preview.
   - **REDO**: the report says what to ask the tool for. Regenerate and try again.

Nothing goes into the game until you add `--install`.

> **JPG or WebP?** The importer only reads PNG. On a Mac, convert first:
> `sips -s format png "jogger.jpg" --out jogger.png`

## Show it Sammy (style and size reference)

Attach `assets/characters/character-sammy/sammy-run-strip-v01.png` to the chat and say:

> "This is the approved style reference: chunky 16-bit pixel art, 1-pixel dark outline, flat shading with only a few colours, about 40 pixels tall. Match that look and that size relationship. Do **not** copy Sammy's design; the new character is a different creature."

If the tool lets you attach a second picture, a screenshot of the game (the night park) helps it pick colours that stand out.

## Rules that go in every prompt

Paste this block after the character description every time:

> "A horizontal sprite sheet of **N frames** in one row, **side view, facing right**. The **same character in every frame**, the **same size and the same scale**, standing on the **same ground line**, with clear empty space between frames. **Flat solid pure magenta #ff00ff background**, nothing else on it: no shadows, no ground, no text, no labels, no frame borders, no glow. **Chunky pixel art at about 3x scale**, crisp hard edges, **1-pixel dark outline**, **limited palette (about 12 colours)**, flat colour blocks with **3-step shading** (dark, mid, light), no gradients, no anti-aliasing, no blur. Gritty, rotting, deadpan dark humour. **Not cute, not cartoonish.**"

Why magenta? Nothing in the game is magenta, so the importer can cut it out cleanly. A checkerboard or a white background works too, but magenta is safest.

## Colour rules (so zombies don't vanish into the park)

- **Skin:** grey-blue or grey-green, rotting. Keep it away from the grass greens.
- **Accent colour:** each zombie gets one strong neon or bright accent so it pops on the night grass.
- **Blood red** and **ichor green** are reserved for gore (blood: dark reds; ichor: acid yellow-green). Don't use them for clothes or skin. Sammy's red bandana is brighter red than blood.
- Everything gets a 1-pixel dark outline.

## Slot -> prompt anchor

| Slot | Final size | Frames | Prompt anchor | Command |
|---|---|---|---|---|
| `jogger:walk` | 288x48 | 6 | lazy jogging shuffle, arms flopping | `--slot jogger:walk` |
| `jogger:attack` | 192x48 | 4 | sloppy shoulder-bump lunge (frame 3 = full lunge) | `--slot jogger:attack` |
| `jogger:hit` | 96x48 | 2 | head snaps back, then recoil | `--slot jogger:hit` |
| `jogger:defeat` | 384x48 | 8 | checks watch, head pops off (boing), crumples | `--slot jogger:defeat` (sheet: add `--cols 4 --rows 2`) |
| `jogger:idle` | 192x48 | 4 | jogging in place, puzzled | `--slot jogger:idle` |
| `vendor:idle` | 192x48 | 4 | flipping a hot dog with tongs | `--slot vendor:idle` |
| `vendor:throw` | 192x48 | 4 | wind-up, swing, release (frame 3), follow-through | `--slot vendor:throw` |
| `vendor:hit` | 96x48 | 2 | recoil, paper hat lifting off | `--slot vendor:hit` |
| `vendor:defeat` | 288x48 | 6 | deflates like a balloon, ichor hissing out | `--slot vendor:defeat` |
| `projectile:hotdog` | 64x16 | 4 | spinning hot dog | `--slot projectile:hotdog` |
| `effect:splat` | 64x16 | 4 | hot dog splat on impact | `--slot effect:splat` |

Final sizes are what the game needs. **Generate much bigger than that** (a sheet 1500 pixels wide or more is fine); the importer shrinks it.

---

## Zombie jogger

### Locked character description (paste this first, every time, unchanged)

> "A rotting zombie jogger, a morning runner who died and is still out jogging. Grey-blue decaying skin, sunken glowing yellow eyes, exposed teeth in a permanent snarl, a few dark wounds. Torn grey tracksuit (hoodie ripped at the sleeves, shorts), a **neon pink sweatband** on his forehead, headphones dangling from one ear, a step-counter watch on his wrist, one sneaker with the lace untied. Hunched, droopy posture. Gritty dark-humour 16-bit pixel art like a classic 16-bit console action game, but **not cute**. About 40 pixels tall in the final game."

### Walk (6 frames): `jogger:walk`

> *[Locked description]* + "**Walk cycle, 6 frames:** a lazy jogging shuffle, arms flopping. 1 front foot lands, arms dangling forward. 2 body low, head lolling. 3 legs passing, untied lace flapping. 4 other foot lands. 5 body low, headphones swinging. 6 legs passing." + *[Rules block with N = 6]*

```sh
node tools/import-art.mjs ~/Downloads/jogger-walk.png --slot jogger:walk
```

### Attack (4 frames): `jogger:attack`

> *[Locked description]* + "**Attack, 4 frames:** a sloppy shoulder-bump lunge toward the right. 1 wind-up, leaning back, arms raised. 2 starting the lunge. 3 full lunge, shoulder and arms forward (the hit). 4 off balance, pulling back." + *[Rules block with N = 4]*

```sh
node tools/import-art.mjs ~/Downloads/jogger-attack.png --slot jogger:attack
```

### Hit (2 frames): `jogger:hit`

> *[Locked description]* + "**Hit reaction, 2 frames:** 1 head snaps back, arms fly up. 2 recoiling, one foot off the ground. Clear body outline." + *[Rules block with N = 2]*

(The game shows this strip as a plain white silhouette, so the shape matters more than the detail.)

```sh
node tools/import-art.mjs ~/Downloads/jogger-hit.png --slot jogger:hit
```

### Defeat (8 frames): `jogger:defeat`

> *[Locked description]* + "**Defeat, 8 frames:** a dark joke, he checks his watch before he dies. 1 stops, glances at his watch. 2 shocked, eyes bulging at the watch. 3 freezes stiff. 4 head pops off upward (a little dark-red blood). 5 head in the air above the body, body still jogging in place. 6 head bouncing near the front, body wobbling. 7 body crumpling. 8 a pile of sweatsuit and one sneaker." + *[Rules block with N = 8, but keep everything inside each frame; nothing may touch the next frame]*

Eight frames in one row is long. Ask for **two rows of four** instead if the tool struggles ("a sheet of 2 rows by 4 columns, reading left to right, top to bottom"), then:

```sh
node tools/import-art.mjs ~/Downloads/jogger-defeat.png --slot jogger:defeat --cols 4 --rows 2
```

Use blood only in the reserved dark reds. A low-gore version (dust puff instead of blood) comes later.

### Idle (4 frames): `jogger:idle`

> *[Locked description]* + "**Idle, 4 frames:** jogging in place, puzzled. 1 left knee up. 2 down, glancing at his watch. 3 right knee up. 4 down, scratching his head and looking around." + *[Rules block with N = 4]*

```sh
node tools/import-art.mjs ~/Downloads/jogger-idle.png --slot jogger:idle
```

---

## Zombie hot dog vendor

### Locked character description

> "A rotting zombie hot dog vendor who never closed up shop. Grey-green decaying skin, a nasty grin with broken teeth, small dead eyes, a bristly mustache. A **white paper hat** (yellowed) on his head, a **blood-stained apron** over a torn shirt (dark red stains), a pair of metal tongs in one hand. A little taller than a small animal, stocky, standing his ground. Gritty dark-humour 16-bit pixel art, **menacing, not cute**. About 40 pixels tall in the final game."

### Idle (4 frames): `vendor:idle`

> *[Locked description]* + "**Idle, 4 frames:** flipping a hot dog with tongs. 1 tongs low, holding a hot dog. 2 flicks it, hot dog in the air above the tongs. 3 catches it. 4 slight sway, mouth open in a groan." + *[Rules block with N = 4]*

```sh
node tools/import-art.mjs ~/Downloads/vendor-idle.png --slot vendor:idle
```

### Throw (4 frames): `vendor:throw`

> *[Locked description]* + "**Throw, 4 frames:** throwing a hot dog to the right. 1 wind-up, arm back, hot dog in hand. 2 arm swinging forward. 3 release: arm out in front at shoulder height, **hand empty** (the hot dog is drawn separately). 4 follow-through, arm down." + *[Rules block with N = 4]*

```sh
node tools/import-art.mjs ~/Downloads/vendor-throw.png --slot vendor:throw
```

### Hit (2 frames): `vendor:hit`

> *[Locked description]* + "**Hit reaction, 2 frames:** 1 recoil, paper hat lifting off his head. 2 hat high above him, mustache bristling." + *[Rules block with N = 2]*

```sh
node tools/import-art.mjs ~/Downloads/vendor-hit.png --slot vendor:hit
```

### Defeat (6 frames): `vendor:defeat`

> *[Locked description]* + "**Defeat, 6 frames:** he deflates like a balloon, a little acid-green ichor hissing out. 1 surprised, puffed up round. 2 starting to sag, air escaping. Then sagging more each frame until 6, a flat empty heap of apron and paper hat." + *[Rules block with N = 6]*

```sh
node tools/import-art.mjs ~/Downloads/vendor-defeat.png --slot vendor:defeat
```

### Hot dog projectile (4 frames): `projectile:hotdog`

Small stuff: ask for it big and plain.

> "A single **hot dog in a bun**, with mustard, tumbling through the air. A horizontal sheet of **4 frames** showing it spinning (rotated a quarter turn more each frame), the same size every frame, clear space between frames, **flat solid pure magenta #ff00ff background**, chunky pixel art, **1-pixel dark outline**, about 8 colours, no shadow, no text. It should look a bit gross and old."

```sh
node tools/import-art.mjs ~/Downloads/hotdog-spin.png --slot projectile:hotdog
```

### Hot dog splat (4 frames): `effect:splat`

> "A **hot dog splat** effect: a hot dog hitting the ground and bursting, **4 frames** in one row. 1 impact, bun cracking. 2 bits flying outward (sausage, bun, mustard). 3 bits at their widest. 4 a few small crumbs and a mustard smear fading out. Same size cell every frame, **flat solid pure magenta #ff00ff background**, chunky pixel art, 1-pixel dark outline, about 8 colours, no shadow, no text."

```sh
node tools/import-art.mjs ~/Downloads/hotdog-splat.png --slot effect:splat
```

---

## What good looks like (check before you import)

- [ ] The right number of frames, in one row (or a clear grid).
- [ ] The **same character** in every frame: same size, same colours, same outfit.
- [ ] **Facing right** in every frame.
- [ ] Feet roughly on the **same ground line** in every frame.
- [ ] Clear space between frames; nothing touching its neighbour.
- [ ] One flat background colour; no shadow, text, or border.
- [ ] A dark outline all around; a handful of flat colours.
- [ ] Looks mean and gritty, not cute.

## What to regenerate (and the fix the importer will suggest)

| You see | Ask the tool for |
|---|---|
| Report says it can't tell the background | "Flat solid pure magenta #ff00ff background, nothing else on it" |
| Frames touch or the report cut them into equal slices | "Clear empty space between frames; each frame fully separate" |
| Frames are different sizes or the head jumps around | "Same character, same size and scale in every frame, same ground line" |
| Too many colours / blotchy result | "Limited palette of about 12 colours, flat shading, no gradients, no glow" |
| Blurry or soft edges | "Hard pixel edges, no anti-aliasing, no blur" |
| Character too wide to fit its box | "Arms and legs kept close to the body" (or add `--shrink`) |
| Facing left | "Facing right" |

## Tips

- **One animation at a time.** Ask for the walk, then the attack, and so on. Long sheets drift.
- **Generate big, let the importer shrink it.** Big pictures keep the details; the tool turns them into real game pixels.
- **Lock the character description.** Paste the same words, unchanged, at the start of every request. Say "same character as the previous picture" when the tool remembers.
- **Fix one frame, not the whole sheet.** If frame 4 is bad, ask for just that frame in the same style, then put it into the sheet in any picture editor, or ask for the whole strip again with "keep frames 1-3 exactly the same".
- **Matching strips.** The importer prints a `--scale` tip. Pass it to the next strip of the same character so they all come out the same size:
  `node tools/import-art.mjs ~/Downloads/jogger-attack.png --slot jogger:attack --scale 0.112`
- **Preview first.** Add `--dry-run` to read the report without writing anything.
- **Replacing a file.** Installing never overwrites. Add `--version 2` to save as `-v02` (the highest number wins), or `--force` to replace.
- **Licenses.** After `--install` the tool prints a ready-to-paste row for `design/ASSET_SOURCES.csv`. Fill in who made it and the image tool's terms (the owner confirms the tool allows selling the game).
