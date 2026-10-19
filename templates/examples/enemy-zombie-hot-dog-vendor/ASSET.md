# Asset metadata — Zombie Hot Dog Vendor (example)

> **EXAMPLE ONLY — not a real asset. No files listed here exist yet.** Copy into assets/<category>/<asset-id>/ and replace with your real details.

A shorter second example. It shows how to describe an enemy that **behaves differently** (stays put and throws things) and how to list the **extra assets** that behavior needs. Everything here is **Proposed** / **Example** except "humans are zombies" (Confirmed). For the full field-by-field model, see `templates/examples/enemy-zombie-jogger/ASSET.md`.

---

- Asset ID: `enemy-zombie-hot-dog-vendor`
- Display name: Zombie Hot Dog Vendor
- Category: enemy
- Files and purpose: see **Planned files** (all planned — not yet supplied).
- Readiness: TBD
- Visual description: Example: paper hat, stained apron, mustache, tongs in one hand. Stands behind his cart and lobs hot dogs.
- Intended role in the game: Proposed: a stationary ranged enemy. Teaches the player to time jumps and close the distance.
- Camera/view: Proposed: side-view, facing right.
- Relative size: Proposed: 48×48 frame (could be 64×64 if he's drawn large — say which).
- Transparent background: Proposed: yes, 1-bit transparency.
- Source/creator/license: TBD (also record in `design/ASSET_SOURCES.csv`).

## Planned files (planned — not yet supplied)

| File (planned — not yet supplied) | Size | Purpose |
|---|---|---|
| `zombie-vendor-idle-strip-v01.png` | 4 × 48×48 | Idle behind cart |
| `zombie-vendor-throw-strip-v01.png` | 4 × 48×48 | Throw (release on frame 2) |
| `zombie-vendor-hit-strip-v01.png` | 2 × 48×48 | Hit-react |
| `zombie-vendor-defeat-strip-v01.png` | 6 × 48×48 | Comedic defeat |
| `hot-dog-projectile-strip-v01.png` | 4 × 16×16 | **Extra required:** spinning hot dog |
| `hot-dog-splat-strip-v01.png` | 4 × 16×16 | **Extra required:** mustard splat when it lands or hits |

The cart he stands behind is a separate prop, `prop-hot-dog-cart`, with its own `ASSET.md` / `INTERACTION.md` (for example, it could be breakable or pushable).

## Animation (if applicable)
- File: one strip per animation (see Planned files — planned, not yet supplied).
- Frame width × height in pixels: Proposed: 48 × 48 for the vendor; 16 × 16 for projectile and splat.
- Grid columns / rows: one row per file; columns = frame count.
- Frame count and reading order: left to right, zero-based. See table.
- Padding / spacing: Proposed: none.
- Pivot / feet baseline: Proposed: vendor bottom-center (24, 47) zero-based; projectile/splat center (8, 8).
- Animation names and frame ranges (state whether zero- or one-based): zero-based — see table.
- Frames per second per animation: see table.
- Looping / one-shot: see table.
- Facing directions and whether mirroring is allowed: Proposed: vendor faces right, mirroring allowed; projectile may rotate/mirror freely.

| Animation | Frames (zero-based) | Count | FPS | Loop / one-shot | Notes |
|---|---|---|---|---|---|
| idle | 0–3 | 4 | 6 | loop | Flipping a hot dog with tongs |
| throw | 0–3 | 4 | 10 | one-shot | **Release frame = 2** (projectile spawns here, at hand height) |
| hit-react | 0–1 | 2 | 12 | one-shot | Paper hat flies up |
| defeat | 0–5 | 6 | 12 | one-shot | Example gag: deflates like a balloon and slumps into his own cart, hat lands on top |
| hot-dog spin (projectile) | 0–3 | 4 | 12 | loop | Spins in the air |
| splat (effect) | 0–3 | 4 | 15 | one-shot | Then disappears |

## Behavior
- What this asset does: Proposed: does not move; lobs hot dogs in an arc toward Sammy's position.
- What triggers it: Proposed: Sammy comes within Example **160 px**.
- What the player can do with it: jump over projectiles, close in and tail-whip him. Play Possum (proposed): if Sammy is within the ability's 96 px radius, he stops throwing and shrugs until the ability ends; farther away, he keeps throwing.
- Collision / hitbox intent: body Example 20 × 36 px; projectile Example 10 × 6 px (smaller than the 16×16 drawing).
- Damage, reward, cooldown, or other values (Example): HP 2; throw every 2 s; projectile 1 heart of damage; projectile disappears (splat) on ground or after 3 s.
- Required sounds / effects: Example: "Hot dogs!" groan, throw whoosh, splat, defeat "pffft" deflate.
- Missing states or assets: projectile and splat **block play** (he can't attack without them); defeat gag and voice groan are polish.
- Details that must be preserved: Example only — paper hat, mustache, tongs.
