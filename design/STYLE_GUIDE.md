# Style guide: Sammy (draft)

This is Sammy's filled-in copy of `templates/STYLE_GUIDE.md`. **Every answer here is Proposed (not approved), except the lines marked Confirmed.** The answers come from the example `ASSET.md` files in `templates/examples/` and from the 2026-10-19 review. The owner approves or changes them (see `design/OWNER_DECISIONS.md`).

> These are **aesthetic targets for a browser build** that should look and sound like a classic 16-bit home console game. They are not hardware limits the game enforces. The game's art checker (the scanner: `node tools/scan-assets.mjs`, run from the `game/` folder) warns about breaks from these targets but never blocks a file. The one exception is wrong-size art, which the game doesn't use.

## Project choices

- Working title: TBD — the owner's call (see `design/OWNER_DECISIONS.md`). **Proposed (2026-10-19):** "Sammy the Opossum: Zombie Hunter". Do not use console brand names or trademarks in the title or logo.
- Mood: **Confirmed by the owner (2026-10-19):** badass action-horror with dark humour, Sammy with a chainsaw, Central Park at night (Bethesda Terrace inspiration), gorier than before. The concept picture is `assets/references/zombie-hunter-concept-v01.jpg` (mood only, never copied or traced). How that turns into pixels is below, all **Proposed**.
- Camera: **Proposed:** side-view platformer, scrolling left to right (the prototype is built this way).
- Scale on screen: **Proposed:** whole-number scaling to fit the window (x3 = 960×672, x4 = 1280×896), no smoothing. The prototype already does this.
- Outline style: **Proposed:** a **1 px dark outline on every sprite and every foreground tile** (Sammy, zombies, props, items, ground and platforms). This is required, not optional, so characters and things you can touch stand out from the background. **No outline on background bands** (sky, skyline, trees, bushes), so they sit back.
- Light direction: **Proposed:** from the **top-left**. Highlights on top and left edges, shadows on bottom and right.
- Shading style: **Proposed:** **3-step ramps** (shadow, base, highlight) for each material, such as fur, skin and cloth. **Dithering is allowed inside sprites** and tiles, but not along a sprite's outer edge.
- Palette files supplied: none yet. Palette sheets go in `assets/ui/palettes/` when they arrive.
- Font supplied: none yet (the game uses a small placeholder font). See **HUD and font** for the size limit.
- Audio tools / composer: TBD — the owner's call (see `design/OWNER_DECISIONS.md`).

## Outline, light and shading (Proposed)

| Rule | Sprites (Sammy, zombies, props, items) | Foreground tiles (ground, platforms, rocks, fences) | Background bands |
|---|---|---|---|
| Outline | 1 px dark outline, required | 1 px dark outline, required | None |
| Light | Top-left | Top-left | Top-left, soft |
| Shading | 3-step ramps; dithering inside is fine | 3-step ramps; dithering inside is fine | Flat colours or 2-step; dithered seams are fine |
| Edge against transparency | Hard pixels, no halo | Hard pixels | — |

- **Zombie skin colours:** keep zombie skin away from the park's greens (grass, trees, bushes), **or** give each zombie a strong accent colour (like the jogger's neon sweatband) that stands out on grass. The placeholder art shows the problem: the green jogger box (`#6cb46c`) is hard to pick out against the grass (`#48b424`). Greyish or bluish-green skin, plus the 1 px outline, reads better.
- **Readability test:** at 1× size, each character should be recognisable from its outline shape alone.


## Night mood: the Zombie Hunter look (Proposed, 2026-10-19)

The owner's direction (Confirmed) is night-time Central Park, Bethesda Terrace as the inspiration, a ferocious Sammy and a gorier fight. Everything in this section is **Proposed**: a way to draw that direction within the 16-bit rules above.

**Voice and humour (owner rule, Confirmed 2026-10-19)**
- **Uncensored deadpan humour with cursing and swearing is encouraged** for Sammy and the zombies: dry, matter-of-fact and profane, never bleeped. Examples in the game: "HE DOESN'T FUCK AROUND WITH ZOMBIES.", "ZOMBIES ARE DUMB AS SHIT.", "THE DEAD CAN FUCKING WAIT."
- Keep lines short and flat, like someone stating a fact. The joke is the calm delivery, not shouting.
- Control hints come first in a prompt, the joke after, so the instruction is still clear.

**Scene and light**
- **Night sky:** navy at the top, through indigo, to a dusky purple glow just above the skyline. Flat bands with dithered seams, no smooth gradients. A few stars (single pixels).
- **Full moon:** big and pale, with 2–3 crater shades. The moon is the main light: keep light from the **top-left** (the moon sits upper left or behind the scene). *The README banner draws its moon upper right, behind the angel fountain, for the picture's layout; it's page art, not game art, so this rule still holds for the game.*
- **Amber lamplight:** the park's lamps are warm amber pools. Show the glow with a **dithered halo** (a checkerboard thinning out from the lamp), never see-through pixels.
- **Wet stone:** the terrace and paths are rain-slick. Show reflections as short **vertical dithered streaks** of lamp amber and moon white under each light source, on dark blue-grey stone. Reflections are part of the tile or background art, not a see-through layer.
- **Bethesda Terrace nods:** the angel fountain, arched arcade, stone balustrades and staircases, the lake beyond. Draw your own simplified version; don't trace photos.
- **Autumn accents:** orange, rust and gold leaves on the ground and drifting in the air: a few bright pixels that pop against the cool night colours.
- **Keep it readable:** the night palette is dark, so sprites need their 1 px dark outline **plus** a lighter rim or highlight on their top-left edges so they don't vanish into the background. Keep the ground lane (where Sammy and the zombies walk) a little lighter than the sky behind it.

**Suggested colours** (all snapped to the 9-bit grid; R, G, B):

| Use | Colours |
|---|---|
| Sky, top to horizon | 0,0,36 · 0,0,72 · 36,36,108 · 72,36,108 |
| Moon (light, mid, craters) and stars | 252,252,216 · 216,216,180 · 180,180,144 · stars 216,216,252 |
| Lamplight (bulb, glow, halo dither) | 252,216,108 · 252,180,36 · 216,144,0 · 144,72,0 |
| Wet stone (dark, mid, light) | 36,36,72 · 72,72,108 · 108,108,144 |
| Night grass and trees (blue-green, dark) | 0,36,36 · 36,72,36 · 36,108,72 |
| Autumn leaves | 252,180,0 · 216,108,0 · 180,72,0 · 108,36,0 |
| Skyline silhouettes and lit windows | 0,0,36 · 36,36,72 · windows 252,216,108 |

**Reserved colours** (used **only** for gore, so the player always knows what they mean):

| Reserved for | Dark · base · highlight | Notes |
|---|---|---|
| **Blood red** | 72,0,0 · 144,0,0 · 180,0,36 | Deeper and darker than Sammy's bandana (216,36,36 and 216,72,72 in his v02 strips; its darkest shadow is a crimson 108,36,36), so the bandana never reads as blood. |
| **Zombie ichor green** | 72,108,0 · 144,216,0 · 216,252,72 | An acid yellow-green, brighter than any grass or zombie skin, so ichor never reads as scenery. Zombie skin stays grey-green or grey-blue (see above). |

**Sammy: ferocious, still cartoon**
- In the game Sammy is the opossum from the owner's **master sheets** (2026-10-20): grey-brown fur, cream face, blue eye with a dark mask, dark ears, thick pink tail, **red polka-dot bandana**, one shared 14-colour palette with a 1 px outline. *(Superseded: this used to say he keeps the white-faced cartoon style of the first run strip.)* The README artwork shows the attitude: narrowed eyes, bared fangs, ears back, a snarl when he attacks.
- Expressions: a **snarl** (fangs showing) for attacks and the chainsaw, **gritted teeth** when hurt, a **cocky grin** on victory. Play Possum stays comic (X eyes, tongue out); dark humour is welcome.
- He's an opossum, not a monster: keep him likeable and readable at 1× size.

**Gore rules for artists**
- **Stylized, never realistic:** chunky pixel blood in the reserved colours (2–3 shades), drawn as solid pixels and short arcs of droplets. No soft sprays, no see-through pixels, no realistic wounds or organs, no lingering close-ups.
- **What can happen to zombies:** the chainsaw can **cut a zombie in half** (top half falls, legs stagger then drop), with sparks and a burst of blood or ichor. The tail-whip knocks heads off and sends zombies flying. Dark slapstick is still welcome: a jogger checking his watch before he drops.
- **Sammy never bleeds.** When hurt he flashes and flinches; no wounds on him.
- **Gore stays brief:** a splat or pool fades within a second or two (blinking, not see-through), so the screen stays readable.
- **Low-gore version:** every gory picture also needs a **low-gore** version (the planned game option). Blood becomes green ichor or a grey dust puff, and a zombie that would be cut in half instead **crumples into a pile of dust and clothes** in one piece. Name it with `-lowgore` before the version, for example `zombie-jogger-defeat-cut-lowgore-strip-v01.png` (Proposed naming; the game has no slot for these files yet).
- The exact amount of blood, and whether low gore is on when the game starts, are the owner's call (owner question 1).

## Screen and grid

| Target | Value |
|---|---|
| Native canvas | 320×224 px (classic wide 16-bit mode; a 256×224 mode also existed, but we target 320×224) |
| Upscaling | Whole numbers only (x3 = 960×672, x4 = 1280×896), nearest-neighbor, no smoothing |
| Tile grid | 8×8 px |
| Level metatiles | 16×16 px (**Proposed**) |
| One "screen" of level length | 320 px wide |
| Layers | Two scrolling background planes (plane A = foreground, plane B = background) plus sprites |
| Parallax | Per-line horizontal scroll allows multi-band parallax (sky, skyline, trees, ground moving at different speeds) |

## Color and palettes

**Proposed:** the colour rules below are **targets to aim for, not hard limits**. Aim for **15 colours or fewer per sprite or per tile set**, each snapped to the 9-bit grid. The art checker warns about more than 15 colours in a file, and about colours off the grid, but still uses the file.

- Color depth: 9-bit RGB = 8 levels per channel, 512 colors total.
- Snap every 8-bit channel value to one of: **0, 36, 72, 108, 144, 180, 216, 252**.
  - Example: 200 → 216; 30 → 36; 255 → 252.
- 4 palette lines × 16 colors. Index 0 of each line is transparent, so **15 usable colors per line**; about **61 colors on screen** at most.

| Palette line | Used for (**Proposed**) | Palette file (planned — not yet supplied) |
|---|---|---|
| 0 | Sammy + HUD | `assets/ui/palettes/palette-line-0-sammy-hud-v01.png` |
| 1 | Zombies / enemies (all zombie types share it, so pick skin and shadow colours they can all use) | TBD |
| 2 | Foreground tiles + props + items | TBD |
| 3 | Backgrounds / parallax | TBD |

### Palette sheet instructions

- Palette sheets go in `assets/ui/palettes/` (the folder is created when the first one arrives).
- Provide one **16-swatch PNG per palette line** (e.g., 16×1 px, or 16 swatches of 8×8 px in a row — say which).
- Swatch 0 = transparent key color, e.g., **magenta 252, 0, 252**. It must never appear as a visible color in art.
- Swatches 1–15 = usable colors, all snapped to the 8 levels above.
- Order swatches dark → light within each ramp, and note which swatches form a ramp (e.g., "fur: 2–5").
- Each sprite or tile should use colors from **one** palette line only. If a sprite needs two lines, note it.

| Line | Swatch | R, G, B | Name / use |
|---|---|---|---|
| TBD | 0 | 252, 0, 252 | Transparent key |
| TBD | 1 | TBD | TBD |

## Sprites

- Hardware-style sprite pieces are 8–32 px per side. Larger characters are built from several pieces ("metasprites"); the artist can draw them as one image.
- Feel targets: up to 80 sprites on screen, 20 per scanline. Keep crowd scenes modest so they read clearly.
- **No alpha blending or semi-transparency.** Hard pixel edges, 1-bit transparency only.
- No anti-aliasing against the transparent background. Dithering and shading ramps inside the sprite are fine.
- Effects like ghosts or shadows: use dithered or flickering pixels, not partial transparency.

### Frame cells (**Proposed**)

| Asset type | Cell size | Character height in cell |
|---|---|---|
| Sammy | 48×48 px, feet at **(28, 47)**. Wider cells with their own feet column (since the 2026-10-20 rebuild from the master sheets): run and tail-whip **64×48**, feet (36, 47); play-dead **64×48**, feet (32, 47); K.O. **76×48**, feet (38, 47); the three chainsaw strips **64×48**, feet (26, 47); land 48×48 with the feet at (17, 47) | about 42 px standing (idle, with ears); the run is a four-legged crawl about 30 px tall (owner's choice) |
| Standard zombie | 48×48 px | about 40–46 px (a little taller than Sammy) |
| Large zombie / boss | 64×64 px | TBD |
| Items / power-ups | 16×16 px (pickups: feet at (8, 15)) | — |
| Props | Multiples of 8; the hot dog cart is **64×48 px**, feet at (32, 47) | — |
| Small effects and thrown things (hot dog, splat) | 16×16 px, centred at (8, 8) | — |

The exact size of every planned file is in `game/src/assets.js`. Sammy's cell size and whip reach are still the owner's call (see `design/OWNER_DECISIONS.md`).

### Sprite sheet layout rules

- Transparent PNG. All frames of one character use the **same cell size**.
- One horizontal strip per animation, frames left to right.
- Frame numbers are **zero-based** (first frame = 0).
- No padding between frames, or exactly 1 px padding if stated in `ASSET.md`.
- A contact sheet or turnaround is reference art, not a sprite sheet. Label it as reference.
- Record frame size, count, fps, loop/one-shot, and hit frames in the asset's `ASSET.md`.

### Pivot and baseline rules

- Pivot = **bottom-center**. In a 48×48 cell that is **(24, 47)**, zero-based. **Exception: Sammy** uses **(28, 47)** in his 48-wide cells: his long tail needs room behind him, so his body sits 4 px right of centre. His wider cells have their own feet column (run and tail-whip (36, 47), play-dead (32, 47), K.O. (38, 47), chainsaw (26, 47)) and land uses (17, 47); the table is in `game/src/assets.js` and the point is always where his body stands, so he never hops sideways when the animation changes *(updated 2026-10-20; this used to say every Sammy strip uses (28, 47))*.
- Feet touch **row 47** in every grounded frame (64×64 cell: (32, 63), row 63).
- Jump and fall frames may lift off the baseline; keep the body centered horizontally.
- Characters face **RIGHT** by default. Mirroring for left is allowed unless an asymmetric detail must stay on one side — note it.

## Backgrounds and parallax

- Build each layer as a **repeating horizontal strip** that loops seamlessly.
- Widths are multiples of 8; ideally **256 or 512 px** wide loops (real scroll-plane widths are 256/512/1024 px, so a loop should divide evenly into them). A static sky that never scrolls can be 320 px.
- Heights are multiples of 8.
- Background layers use palette line 3; foreground tiles use line 2.

| Layer (far → near) | Width | Height | Screen rows | Scroll speed (**Proposed**) | File |
|---|---|---|---|---|---|
| Sky | 320 (doesn't move) | 224 | 0–223 (behind everything) | 0% | `central-park-bg-sky-v01.png` |
| Far skyline | 512 | 64 | 80–143 | 12.5% | `central-park-bg-skyline-v01.png` |
| Mid trees | 512 | 32 | 144–175 | 25% | `central-park-bg-treeline-v01.png` |
| Near bushes | 512 | 32 | 176–207 (ground covers 192 and below) | 50% | `central-park-bg-bushes-v01.png` |
| Near ground / foreground tiles | tileset | 16×16 metatiles | — | 100% | `central-park-tiles-v01.png` |

- **Proposed:** these rows, speeds and widths are what the game uses today (the `bg:` lines in `game/src/assets.js`). The skyline, trees and bushes are 512 px wide; the sky is 320 px and doesn't move. The game only uses these exact sizes; the scanner shows them.
- The scrolling bands **must not overlap** (on the real hardware each screen line belongs to one band). The game reads each band's row, speed and width from `game/src/assets.js`, which matches this table and the Central Park tileset `ASSET.md`.

- Tilesets: one PNG on an 8×8 grid (16×16 metatiles), with a note listing which tiles are solid, one-way platforms, hazards, or decoration.

## HUD and font

- Font: an **8×8 bitmap font sheet** (PNG), monospaced, on an 8×8 grid.
- **Proposed:** one 8×8 font, with the long lines of game text shortened to fit (see the width limit below). The other choice is two fonts. That's the owner's call (see `design/OWNER_DECISIONS.md`).
- Character order: TBD (ASCII order from space (32) to tilde (126) suggested, then any extra glyphs such as `×` appended after 126 — list their order). List the order in the font's `ASSET.md`.
- Minimum set: A–Z, 0–9, and `: . , ! ? - /`, plus `×` as an extra glyph after 126 (or use `x`).
- **Width limit:** an 8×8 font fits at most **40 characters** across the 320 px screen. Keep each line of text to **38 characters or fewer** so it has a margin.
- The game's current text was written for the small placeholder font (3–5 px wide letters), and some lines are longer than 38 characters (the title screen's controls line is 47 characters, the two intro lines are 43 and 39, and the Play Possum tip is 42). When the 8×8 font arrives, **either** those lines get shortened **or** a second, smaller font is used for long text. That's your decision.
- HUD icons: 8×8 or 16×16, palette line 0. A power-up's icon lives in that power-up's folder (e.g. `assets/items/item-powerup-trash-lid-shield/`); hearts and ability icons live in `assets/ui/ui-hud/`.
- **Proposed HUD:** a **16 px tall bar** across the top of the screen, with **16×16 icons**. Left to right, as the game draws it today: 3 hearts, the trash-lid icon with up to 3 pips (hits left), the Play Possum icon with its cooldown bar, zombies defeated, time, and the gauntlet wave. No lives and no score.

## Naming conventions

- **Exact file names: run the scanner or see `game/src/assets.js`.** The game only uses files with the exact names it expects. The scanner (`node tools/scan-assets.mjs`, run from the `game/` folder) lists every missing file with its exact name, folder and size.
- Lowercase kebab-case, version suffix `-v01`, `-v02`, …
- Pattern: `<asset>-<animation or state>-<kind>-v01.png`
- Kind words: `strip` = one horizontal strip for one animation (the normal case); `sheet` = a multi-row sheet or a tile sheet; `reference` = not for the game. A single picture (one frame) has no kind word, e.g. `hot-dog-cart-upright-v01.png`.
- Background bands use `<place>-bg-<band>-v01.png`, e.g. `central-park-bg-sky-v01.png` (see the table under **Backgrounds and parallax**).
- Examples (naming patterns; only `sammy-run-strip-v01.png` exists so far):
  - `sammy-run-strip-v01.png`
  - `sammy-reference-v01.png`
  - `zombie-jogger-walk-strip-v01.png`
  - `central-park-bg-sky-v01.png`
  - `palette-line-0-sammy-hud-v01.png`
  - `music-level-01-central-park-v01.ogg`
- Never overwrite the only original. Save a new version instead.

## Export checklist (art)

- [ ] PNG format, 1× scale — **do not upscale** (the game scales it).
- [ ] No embedded color profile surprises (export as plain sRGB or strip the profile).
- [ ] No semi-transparent pixels: every pixel fully opaque or fully transparent.
- [ ] Colors snapped to the 8 levels per channel; aim for 15 colors or fewer per sprite or tile set (a target, not a hard limit).
- [ ] Exact frame grid: sheet width = cell width × frame count.
- [ ] Feet on the baseline row in grounded frames; facing right.
- [ ] File named in kebab-case with `-v01` suffix; layered source file kept beside it.
- [ ] `ASSET.md` filled in; source/license recorded in `design/ASSET_SOURCES.csv`.

## Audio

Feel target: a classic FM synth chip (6 channels) plus a simple PSG chip (3 square-wave + 1 noise channel). Real chip emulation is optional; the goal is the sound.

| Item | Spec |
|---|---|
| Game format | OGG, plus an MP3 of the same sound beside it for older Safari (optional) |
| Masters | WAV (and tracker / DAW / VGM source files if available). Sending only WAV is fine: Claude converts with `node tools/convert-audio.mjs` |
| Music | Must loop cleanly from the end straight back to the start, with no separate intro. Loop points aren't supported yet |
| SFX | Short, one file per sound; trim silence at the start |
| Variations | Optional: 2–3 variants for frequent sounds (hits, footsteps) |
| Loudness | **Proposed:** music sits under the sound effects. The game plays music at 60% and effects at 80% volume |
| Sample rate | **Proposed:** 44.1 kHz (48 kHz is fine), 16-bit WAV masters |

- Fill in `templates/AUDIO.md` for every music track and sound.
- Tracks needed: **Proposed:** level music (`music-level-01-central-park`), optional gauntlet music (`music-level-01-gauntlet`), and a level-clear jingle (`sfx-level-clear`). Title, boss and game-over tracks have no slot in the game yet.
- **Theme song (2026-10-19):** the owner's song "Sammy the Opossum : Zombie Hunter" (made with Suno, 70 s, MP3) is now the level music (Confirmed as the theme; Proposed as the level track). It is a full produced song, not FM chiptune, so the FM-synth feel above now applies to **sound effects** (and to any future tracks, if the owner wants them to match). It breaks the "loops cleanly, no intro" rule: it has a quiet ~5 s build-in and a fade-out, so for now the whole song simply replays every 70 s. A trimmed loop edit (or loop-point support in the game) can fix that later. It also starts on the title screen's first key press or tap, which starts the game too.
- **Sound mood (Proposed, 2026-10-19):** sound effects move from "comic" to **punchy and gnarly with dark humour**: meaty hits, wet splats, a chainsaw that sputters, revs and screams. Groans can be creepy now.

## Nostalgic nods — do and don't

| Do (homage) | Don't (copying) |
|---|---|
| Borrow *mechanics and feel*: speed, momentum, bouncy hits, ring-style collectibles with your own design | Copy, trace, or rip sprites, tiles, or backgrounds from commercial games |
| Use a similar *palette mood* and multi-band parallax | Use or imitate trademarked logos, title screens, or console brand names |
| Echo *level structure*: act cards, end-of-level tally, boss at the end | Use named characters or close look-alikes |
| Write *original music* in an FM-synth style | Sample, cover, or closely recreate commercial songs or jingles |
| Make *original sound effects* that feel chip-like | Rip sound effects from games or ROMs |
| Visual jokes and parody that are clearly your own | Put "Sega" or "Genesis" in the game's title or branding |

- Keep reference screenshots in `assets/references/`. They are **reference-only** and never ship in the game.
- List each intended nod and exactly what is borrowed (feel, structure, humor) in the level's `LEVEL.md`.
