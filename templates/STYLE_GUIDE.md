# Style guide: 16-bit console-style art & audio spec

One guide for the whole project. Copy to `design/STYLE_GUIDE.md` and fill in the `TBD` fields.

> These are **aesthetic targets for a browser build** that should look and sound like a classic 16-bit home console game. They are not hardware limits the game enforces. Values marked **Proposed** are suggestions, not decisions.

## Project choices (fill in)

- Working title: TBD (do not use console brand names or trademarks in the title or logo)
- Camera: TBD (side-view platformer is **Proposed**)
- Scale on screen: TBD (x3 = 960×672 and x4 = 1280×896 are **Proposed**)
- Outline style: TBD (e.g., 1 px dark outline / colored outline / none)
- Light direction: TBD (e.g., top-left)
- Shading style: TBD (e.g., 3-step ramps, dithering allowed yes/no)
- Palette files supplied: TBD
- Font supplied: TBD
- Audio tools / composer: TBD

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

- Color depth: 9-bit RGB = 8 levels per channel, 512 colors total.
- Snap every 8-bit channel value to one of: **0, 36, 72, 108, 144, 180, 216, 252**.
  - Example: 200 → 216; 30 → 36; 255 → 252.
- 4 palette lines × 16 colors. Index 0 of each line is transparent, so **15 usable colors per line**; about **61 colors on screen** at most.

| Palette line | Used for (**Proposed**) | Palette file |
|---|---|---|
| 0 | Sammy + HUD | TBD |
| 1 | Zombies / enemies | TBD |
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
| Sammy | 48×48 px (tail whip only: 64×48 px, feet at (32, 47)) | about 32–40 px |
| Standard zombie | 48×48 px | about 40–46 px (a little taller than Sammy) |
| Large zombie / boss | 64×64 px | TBD |
| Items / power-ups | TBD (16×16 suggested) | — |
| Props | TBD (multiples of 8) | — |

### Sprite sheet layout rules

- Transparent PNG. All frames of one character use the **same cell size**.
- One horizontal strip per animation, frames left to right.
- Frame numbers are **zero-based** (first frame = 0).
- No padding between frames, or exactly 1 px padding if stated in `ASSET.md`.
- A contact sheet or turnaround is reference art, not a sprite sheet. Label it as reference.
- Record frame size, count, fps, loop/one-shot, and hit frames in the asset's `ASSET.md`.

### Pivot and baseline rules

- Pivot = **bottom-center**. In a 48×48 cell that is **(24, 47)**, zero-based.
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
| Sky | 320 (static) or 512 | 224 | 0–223 (behind everything) | 0% | `central-park-bg-sky-v01.png` |
| Far skyline | 256 or 512 | 64 | 80–143 | 12.5% | `central-park-bg-skyline-v01.png` |
| Mid trees | 256 or 512 | 32 | 144–175 | 25% | `central-park-bg-treeline-v01.png` |
| Near bushes | 256 or 512 | 32 | 176–207 (ground covers 192 and below) | 50% | `central-park-bg-bushes-v01.png` |
| Near ground / foreground tiles | tileset | 16×16 metatiles | — | 100% | `central-park-tiles-v01.png` |

- The scrolling bands **must not overlap** (on the real hardware each screen line belongs to one band). The game reads each band's row, speed and width from `game/src/assets.js`, which matches this table and the Central Park tileset `ASSET.md`.

- Tilesets: one PNG on an 8×8 grid (16×16 metatiles), with a note listing which tiles are solid, one-way platforms, hazards, or decoration.

## HUD and font

- Font: an **8×8 bitmap font sheet** (PNG), monospaced, on an 8×8 grid.
- Character order: TBD (ASCII order from space (32) to tilde (126) suggested, then any extra glyphs such as `×` appended after 126 — list their order). List the order in the font's `ASSET.md`.
- Minimum set: A–Z, 0–9, and `: . , ! ? - /`, plus `×` as an extra glyph after 126 (or use `x`).
- **Width limit:** an 8×8 font fits at most **40 characters** across the 320 px screen. Keep each line of text to **38 characters or fewer** so it has a margin.
- The game's current text was written for the small placeholder font (3–5 px wide letters), and some lines are longer than 38 characters (the title screen's controls line is 47 characters, the two intro lines are 43 and 39, and the Play Possum tip is 42). When the 8×8 font arrives, **either** those lines get shortened **or** a second, smaller font is used for long text. That's your decision.
- HUD icons: 8×8 or 16×16, palette line 0. A power-up's icon lives in that power-up's folder (e.g. `assets/items/item-powerup-trash-lid-shield/`); hearts and ability icons live in `assets/ui/ui-hud/`.
- HUD elements: TBD (health, lives, score, ability meter, power-up icon).

## Naming conventions

- Lowercase kebab-case, version suffix `-v01`, `-v02`, …
- Pattern: `<asset>-<animation or state>-<kind>-v01.png`
- Kind words: `strip` = one horizontal strip for one animation (the normal case); `sheet` = a multi-row sheet or a tile sheet; `loop` = a repeating background band; `reference` = not for the game.
- Examples (naming patterns only — these files do not exist):
  - `sammy-run-strip-v01.png`
  - `sammy-reference-v01.png`
  - `zombie-jogger-walk-strip-v01.png`
  - `central-park-sky-loop-v01.png`
  - `palette-line-0-sammy-hud-v01.png`
  - `music-level-01-central-park-v01.ogg`
- Never overwrite the only original. Save a new version instead.

## Export checklist (art)

- [ ] PNG format, 1× scale — **do not upscale** (the game scales it).
- [ ] No embedded color profile surprises (export as plain sRGB or strip the profile).
- [ ] No semi-transparent pixels: every pixel fully opaque or fully transparent.
- [ ] Colors snapped to the 8 levels per channel; 15 colors max per palette line.
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
| Loudness | TBD (keep music below SFX; note target level) |
| Sample rate | TBD (44.1 kHz suggested) |

- Fill in `templates/AUDIO.md` for every music track and sound.
- Tracks needed: TBD (title, level music, boss, victory jingle, game over jingle).

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
