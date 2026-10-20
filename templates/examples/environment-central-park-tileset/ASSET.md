# Asset metadata — Central Park tileset + parallax (example)
> **EXAMPLE ONLY — planning spec, not a finished asset.** Run the scanner to see which files exist. Don't copy this into assets/ until every TBD is filled in.

How to use this example: a filled-in `ASSET.md` for a level tileset and its scrolling background layers. Real copy goes in `assets/environments/environment-central-park-tileset/`. Setting (Central Park, NYC) is confirmed by the user; everything marked **Proposed** or **Example** is a suggestion.

- Asset ID: environment-central-park-tileset
- Display name: Central Park — Tileset and Parallax
- Category: environment
- Files and purpose: see **Planned files** below
- Readiness: none supplied — TBD
- Visual description: **Example:** early-morning Central Park. Bright grass, packed-dirt paths, green benches, black iron lampposts, grey schist rock outcrops, a pond edge, low iron fences. Behind it: a tree line, then the Manhattan skyline as a flat silhouette, then a banded dawn sky. 16-bit era look: bold outlines on foreground, softer (outline-free) background, dithered shading allowed.
- Intended role in the game: ground, platforms and scenery for `level-01-sheep-meadow` and later park levels
- Camera/view: **Proposed:** side view, horizontal scrolling
- Relative size: native screen 320×224 px; Sammy about 32–40 px tall, so a bench is about Sammy's height
- Transparent background: foreground tiles yes (index 0 transparent); the sky layer is fully opaque
- Source/creator/license: TBD (also record in design/ASSET_SOURCES.csv)

## Planned files (none supplied yet)

| # | Planned filename | What it is | Size |
|---|---|---|---|
| 1 | `central-park-tiles-v01.png` | Foreground tile sheet, 8×8 tiles arranged as 16×16 metatiles | 256×256 (16×16 metatiles) |
| 2 | `central-park-metatiles-v01.json` (or a simple list in this file) | Names + collision type for each 16×16 metatile | — |
| 3 | `central-park-bg-sky-v01.png` | Sky gradient bands | 320×224 |
| 4 | `central-park-bg-skyline-v01.png` | Manhattan skyline silhouette, tiles seamlessly left↔right | 512×64 |
| 5 | `central-park-bg-treeline-v01.png` | Distant tree line, seamless loop | 512×32 |
| 6 | `central-park-bg-bushes-v01.png` | Near bushes strip, seamless loop | 512×32 |
| 7 | `central-park-mockup-v01.png` | One full 320×224 screen mock-up showing all layers together (reference) | 320×224 |
| 8 | `central-park-source-v01.aseprite` (or .psd) | Layered source | — |

## Grid (Proposed)
- Base tile: **8×8 px**. Level building block ("metatile"): **16×16 px** = 2×2 tiles.
- One screen = 20×14 metatiles (320×224).
- Draw on the grid; every edge that should repeat must line up with the 8 px grid.

## Planned tile list (Proposed, foreground — palette line 2)

| Metatile | Variants | Collision |
|---|---|---|
| Grass top (surface edge) | flat, left end, right end, slope up/down 1:2 (optional) | Solid |
| Dirt fill (under grass) | 2 variants to avoid repetition | Solid |
| Path (paved/packed dirt) | flat, left end, right end | Solid |
| Bench | 3 metatiles wide (48×32) — seat is standable | Seat = one-way platform; legs = no collision |
| Lamppost | 1 wide × 4 tall (16×64) | Lamp top = one-way platform; pole = no collision |
| Rock outcrop | small (2×2), large (4×3) | Solid (top is walkable) |
| Pond edge | shore left/right, water surface (2-frame shimmer @ 4 fps) | Shore solid; water = **hazard** (Proposed: lose 1 HP and respawn at last safe ground) |
| Fence | post, rail section, broken rail | Low fence = solid wall you jump over; broken section = no collision |
| Decoration (optional) | flowers, litter, sign "Keep Off the Grass", lamppost light | None |

Collision types used: **solid**, **one-way platform** (stand on from above, pass through from below), **hazard**, **none**.

## Parallax layers (Proposed — palette line 3)
The 16-bit target has only **two scrolling planes**: plane A (foreground tiles above) and plane B (background). All four background bands below live on plane B and are separated by scrolling each horizontal band of lines at a different speed. So: **bands must not overlap vertically.**

| Layer (back to front) | Size (px) | Vertical position on screen (rows) | Scroll speed vs camera | Notes |
|---|---|---|---|---|
| Sky gradient bands | 320×224 | 0–79 visible | 0% (static) | 6–8 flat color bands, no smooth gradient; optional dithered seams between bands |
| Manhattan skyline silhouette | 512×64 | 80–143 | 12.5% | 2–3 colors, flat; recognizable but not a copy of any photo or logo |
| Tree line | 512×32 | 144–175 | 25% | Rounded canopy shapes |
| Near bushes | 512×32 | 176–207 | 50% | Just behind the ground line. The ground starts at row 192, so only rows 176–191 show; fill any gaps between bushes with tree or shadow colour, because only the sky is behind this band |

Widths are multiples of 8 and loop seamlessly; scrolling bands are 256 or 512 px wide so they divide the real plane widths (256/512/1024). Speeds match `design/STYLE_GUIDE.md`. Vertical rows are a starting suggestion — adjust to your art, but keep bands separate. The game uses exactly these rows, speeds and widths (the `bg:` entries in `game/src/assets.js`); if you change them here, ask Claude to change them there too.

## Palette (Proposed)
- Line 2 = foreground tiles + props + items (15 colors + transparent). Shared with the hot dog cart and pickups — leave room for them.
- Line 3 = all background layers (15 colors + index 0). Keep the skyline and trees to a few colors each.
- Snap to 9-bit colors: channel values 0, 36, 72, 108, 144, 180, 216, 252.
- No semi-transparency anywhere; fog or haze must be dithered.

## Animation (if applicable)
- File: water shimmer inside planned file 1; lamppost glow (optional)
- Frame width × height in pixels: 16×16 metatiles
- Frame count and reading order: water 2 frames, left to right (zero-based 0–1)
- Frames per second: 4 fps, loop
- Facing directions and whether mirroring is allowed: tiles may be mirrored to save space, except the sign (text)

## Behavior
- What this asset does: builds the level and its backdrop
- Collision / hitbox intent: per metatile, as listed above
- Required sounds / effects: water splash (if pond hazard is used)
- Missing states or assets: everything — no art supplied
- Details that must be preserved: TBD (e.g., a real Central Park landmark you want included — note it)

## Nostalgic nod (Proposed)
Classic multi-band parallax and a dawn sky palette shift are homages to the feel of the era. Draw original art only; do not trace screenshots. Any reference screenshots go in `assets/references/` and are never shipped.
