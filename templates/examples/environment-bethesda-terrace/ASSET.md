# Asset metadata — Bethesda Terrace scenery (example)
> **EXAMPLE ONLY — planning spec, not a finished asset (Proposed, 2026-10-19).** Real copy goes in `assets/environments/environment-bethesda-terrace/`.

- Asset ID: environment-bethesda-terrace
- Display name: Bethesda Terrace — arcade, balustrade, stairs, angel fountain
- Category: environment
- Visual description: night, rain-slick pale stone, moonlit upper-left edges, warm amber light inside the arches, an angel statue on a tiered fountain. Simplified original drawings; never traced from photos. 1 px dark outline on foreground pieces.
- Intended role: backdrop and floor of the final gauntlet arena (the last screen, x 3520-3840). Nothing here is solid; it is cosmetic.
- Camera/view: side view. Palette: 9-bit grid, 15 colours or fewer per file, no see-through shading (dither instead).
- Source/creator/license: TBD (record in design/ASSET_SOURCES.csv)

## Planned files (none supplied yet)

| # | Planned filename | What it is | Size |
|---|---|---|---|
| 1 | `bethesda-ground-terrace-strip-v01.png` | Flagstone floor tile, 2 variants of 16×32; repeats every 16 px | 32×32 (2 × 16×32) |
| 2 | `bethesda-fountain-strip-v01.png` | Basin, two tiers and falling water, 3 frames of 128×96 at 6 fps; row 29 is the pedestal top | 384×96 (3 × 128×96) |
| 3 | `bethesda-angel-v01.png` | Winged angel statue; stands on the fountain (feet 67 px above the ground line) | 48×64 |
| 4 | `bethesda-balustrade-v01.png` | Balustrade, repeats every 32 px, sits on top of the arcade wall | 32×24 |
| 5 | `bethesda-arch-v01.png` | Arcade wall with one lit arch; five side by side fill the screen | 64×80 |
| 6 | `bethesda-stairs-v01.png` | Stone steps seen from the front | 64×32 |

All props use a bottom-centre feet point. See `design/ART_BRIEFS.md` for tone and notes.
