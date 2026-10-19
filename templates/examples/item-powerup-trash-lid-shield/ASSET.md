# Asset metadata — Trash can lid shield (example)
> **EXAMPLE ONLY — not a real asset. No files listed here exist yet.** Copy into assets/<category>/<asset-id>/ and replace with your real details.

How to use this example: a filled-in `ASSET.md` for a power-up pickup. Real copy goes in `assets/items/item-powerup-trash-lid-shield/`. What the power-up *does* is in the example `ABILITY.md` beside this file; its real copy goes in `design/abilities/item-powerup-trash-lid-shield.md`, not in `assets/`. Everything marked **Proposed** or **Example** is a suggestion, not a decision.

- Asset ID: item-powerup-trash-lid-shield
- Display name: Trash Lid Shield
- Category: item
- Files and purpose: see **Planned files** below
- Readiness: none supplied — TBD
- Visual description: **Example:** a dented, round, galvanized-steel trash can lid with a handle, catching a sparkle highlight. Bold outline, 3-shade metal ramp. TBD once real art exists.
- Intended role in the game: **Proposed:** a pickup that lets Sammy block a few zombie hits.
- Camera/view: **Proposed:** side view; the pickup is shown slightly tilted toward the camera so it reads as a lid, not a line.
- Relative size: pickup 16×16 px (about half Sammy's height); the held lid is about 14×16 px
- Transparent background: yes — hard pixel edges, 1-bit transparency
- Source/creator/license: TBD (also record in design/ASSET_SOURCES.csv)

## Planned files (none supplied yet)

| # | Planned filename | What it is | Size |
|---|---|---|---|
| 1 | `trash-lid-pickup-strip-v01.png` | Pickup floating/spinning in the level (4 frames) | 64×16 (16×16 each) |
| 2 | `trash-lid-held-overlay-strip-v01.png` | Lid Sammy holds, drawn on top of his sprite (3 frames: intact, dented, cracked) | 48×16 (16×16 each) |
| 3 | `trash-lid-break-strip-v01.png` | Lid breaks / flies off (4 frames) | 128×32 (32×32 each) |
| 4 | `hud-icon-trash-lid-v01.png` | HUD icon with room for hit pips | 16×16 |
| 5 | `trash-lid-source-v01.aseprite` (or .psd) | Layered source | — |

## Animation (if applicable)
- File: planned files 1, 2 and 3 above
- Frame width × height in pixels: pickup 16×16; held overlay 16×16; break 32×32 (Proposed)
- Grid columns / rows: one horizontal strip per animation, 1 row
- Frame count and reading order: pickup 4; held overlay 3 (one per remaining-hits stage, not an animation); break 4; left to right
- Padding / spacing: none
- Pivot / feet baseline: pickup — center (8, 8); held overlay — center (8, 8), attached to a per-frame hand point on Sammy (this example uses the "small sprite + hand point" overlay option rather than a 48×48 overlay strip aligned to Sammy's cell; see `ABILITY.md`); break — center (16, 16)
- Animation names and frame ranges (zero-based): pickup-spin 0–3; held 0 = 3 hits left, 1 = 2 left, 2 = 1 left; break 0–3
- Frames per second per animation: pickup-spin 8 fps; break 15 fps (Proposed)
- Looping / one-shot: pickup-spin loops; break one-shot
- Facing directions and whether mirroring is allowed: mirroring allowed (a round lid is symmetrical)

## Behavior
- What this asset does: power-up; see `ABILITY.md`
- What triggers it: Sammy touches the pickup
- What the player can do with it: block zombie hits automatically
- Collision / hitbox intent: pickup trigger box 12×12 centered on the sprite; no solid collision
- Damage, reward, cooldown, or other values: **Proposed:** blocks 3 hits; see `ABILITY.md`
- Required sounds / effects: pickup, shield-block clang, shield-break (see the example `audio/AUDIO.md`)
- Missing states or assets: everything — no art supplied
- Details that must be preserved: TBD

## Palette and pixel notes (Proposed)
- Pickup: palette line 2 (props + items). Held overlay and HUD icon: palette line 0 (Sammy + HUD) so it can be drawn with Sammy. Ask the artist to use only colors that exist in both lines, or supply two recolors.
- Snap colors to 0, 36, 72, 108, 144, 180, 216, 252 per channel. No semi-transparency for the sparkle — use solid pixels.
