# Asset metadata — Hot dog cart (example)
> **EXAMPLE ONLY — not a real asset. No files listed here exist yet.** Copy into assets/<category>/<asset-id>/ and replace with your real details.

How to use this example: this shows how a filled-in `ASSET.md` for an interactive prop might look. Real copy goes in `assets/props/prop-hot-dog-cart/`. Everything marked **Proposed** or **Example** is a suggestion, not a decision.

- Asset ID: prop-hot-dog-cart
- Display name: Hot Dog Cart
- Category: prop
- Files and purpose: see **Planned files** below (one PNG per visual state)
- Readiness: none supplied — TBD
- Visual description: **Example:** a classic NYC street hot dog cart — striped umbrella, steel box body, two wheels, mustard and ketchup bottles on top. Cartoon 16-bit style, bold dark outline, 3–4 shade ramps. TBD once real art exists.
- Intended role in the game: **Proposed:** a breakable "smash it for a reward" prop. Sammy tail-whips it until it tips over; it spills hot dogs that knock back nearby zombies and can be eaten to heal.
- Camera/view: **Proposed:** side view, same angle as Sammy.
- Relative size: **Proposed:** about 1.5× Sammy's height. Cart drawn inside a 64×48 px frame cell; cart itself roughly 56×44 px.
- Transparent background: yes (required) — hard pixel edges, 1-bit transparency, no semi-transparent pixels.
- Source/creator/license: TBD (also record in design/ASSET_SOURCES.csv)

## Planned files (none supplied yet)

| # | Planned filename | What it is | Size |
|---|---|---|---|
| 1 | `hot-dog-cart-upright-v01.png` | Upright, idle (1 frame) | 64×48 |
| 2 | `hot-dog-cart-rocking-strip-v01.png` | Rocking wobble (3 frames, horizontal strip) | 192×48 |
| 3 | `hot-dog-cart-tipping-strip-v01.png` | Falling over (3 frames, horizontal strip) | 192×48 |
| 4 | `hot-dog-cart-tipped-over-v01.png` | Lying on its side, hot dogs still inside (1 frame) | 64×48 |
| 5 | `hot-dog-cart-empty-v01.png` | Lying on its side, empty, umbrella bent (1 frame) | 64×48 |
| 6 | `hot-dog-pickup-strip-v01.png` | Spilled hot dog item, bounce/spin (4 frames) | 64×16 (16×16 each) |
| 7 | `hot-dog-cart-source-v01.aseprite` (or .psd) | Layered source for all of the above | — |

## Animation (if applicable)
- File: planned files 2, 3 and 6 above
- Frame width × height in pixels: **Proposed:** 64×48 for cart frames; 16×16 for the hot dog pickup
- Grid columns / rows: one horizontal strip per animation, 1 row
- Frame count and reading order: rocking 3, tipping 3, hot dog 4; left to right
- Padding / spacing: none (0 px)
- Pivot / feet baseline: bottom-center (32, 47) zero-based; the lowest part of the cart (wheels when upright, its side when tipped) touches row 47 in every frame
- Animation names and frame ranges (zero-based): rocking 0–2; tipping 0–2; hot-dog-spin 0–3
- Frames per second per animation: **Proposed:** rocking 12 fps; tipping 12 fps; hot-dog-spin 10 fps
- Looping / one-shot: rocking loops (until timeout or next hit); tipping one-shot then switch to tipped-over; hot-dog-spin loops
- Facing directions and whether mirroring is allowed: cart faces right; mirroring allowed so it can tip either way **unless** the umbrella stripes or a sign must read correctly — note if so

## Behavior
- What this asset does: see `INTERACTION.md` beside this file for the full state table
- What triggers it: Sammy's tail-whip hit (Proposed)
- What the player can do with it: whip it twice to tip it; collect the spilled hot dogs
- Collision / hitbox intent: **Proposed:** solid while upright/rocking (Sammy can't walk through); the umbrella top is a one-way platform while upright only (not while rocking); after tipping, a low solid block 16 px tall that Sammy can hop over
- Damage, reward, cooldown, or other values: **Proposed:** spill knocks back zombies within 48 px (no damage, or 1 damage — TBD); each hot dog heals Sammy 1 HP; 3 hot dogs per cart
- Required sounds / effects: cart-rock (wobble creak), cart-crash (metal clang), hot dog spill (splat), pickup (use shared pickup SFX); dust puff VFX on landing
- Missing states or assets: everything — no art supplied
- Details that must be preserved: TBD (for example, a hand-painted sign on the cart)

## Palette and pixel notes (Proposed)
- Palette line 2 (foreground tiles + props + items), max 15 colors + transparent index 0
- Snap colors to the 9-bit set: channel values 0, 36, 72, 108, 144, 180, 216, 252
- Larger than 32 px, so the game builds it from several hardware-sized pieces ("metasprite"); you can still draw it as one image
