# Asset request checklist — what to send first

This is the prioritized list of source resources Claude Code needs to build a **first playable vertical slice: one Central Park level** for Sammy's game. Send Tier 1 first. Tier 2 and Tier 3 can follow while the level is being built.

**Confirmed (from you):** Sammy is an opossum ("he"). He wakes up in Central Park (NYC) with no memory of how he got there. Humans have turned into zombies, with humorous cartoon/slapstick-graphic animations. Sammy fights through levels using interactive objects, power-ups, and special abilities. The game will eventually look like a 16-bit Genesis-era game with nostalgic nods to that era.

**Everything else on this page is Proposed** — sizes, frame counts, ability names, enemy types, level names, and scope. Change anything that doesn't fit your vision and record the change in `design/GAME_BRIEF.md` or `design/DECISIONS.md`.

Worked examples of every template live in `templates/examples/` (see `templates/examples/README.md`). They are examples only — nothing in them exists yet.

---

## Proposed technical targets (apply to all art)

These are *looks to emulate* in a browser build, not hardware limits Claude will enforce.

| Topic | Proposed target |
|---|---|
| Screen | Native canvas **320×224 px**, scaled up by whole numbers (×3 = 960×672, ×4 = 1280×896), nearest-neighbor, no smoothing |
| Tiles | 8×8 px tile grid; level building blocks ("metatiles") 16×16 px |
| Color | 9-bit RGB: snap each channel to **0, 36, 72, 108, 144, 180, 216, 252** (512 possible colors) |
| Palettes | 4 palette lines × 16 colors; index 0 = transparent → 15 usable per line, ~61 on screen |
| Palette lines | 0 = Sammy + HUD · 1 = zombies/enemies · 2 = foreground tiles, props, items · 3 = backgrounds/parallax |
| Edges | Hard pixel edges, 1-bit transparency only. **No** semi-transparent pixels, no anti-aliasing against transparency. Dithering and shading ramps are fine |
| Sprite frames | **48×48 px** cell for Sammy and normal zombies (large zombies 64×64). Sammy ~32–40 px tall; normal zombies ~40–46 px tall. Transparent PNG, every frame the same size |
| Baseline | Feet at bottom-center **(24, 47)** zero-based; feet touch row 47 in every grounded frame |
| Facing | Draw facing **right**; Claude mirrors for left unless you note an asymmetric detail |
| Sheet layout | One horizontal strip per animation, frames left→right, zero-based, no padding (or state "1 px padding") |
| Audio | FM-synth + PSG feel (YM2612 + SN76489 style). Deliver **WAV masters**; Claude makes OGG. Music must loop, with loop points written down |

---

## Tier 1 — needed for the first playable level (placeholders can stand in for any of these)

Without these, Claude can only build with grey placeholder boxes.

- **Blocks play** (the level can't be played without at least a placeholder): 1.1, 1.3, 1.4, 1.5, 1.7, 1.8, 1.9, 1.10, 1.12.
- **Feel** (the level plays without it, but the first playable needs it to feel right): 1.2, 1.6, 1.11.
- **Blocks shipping, not play:** 1.13.

| # | What to supply | Format / dimensions | Template to fill | Goes in |
|---|---|---|---|---|
| 1.1 | **Filled game brief** — at minimum: camera (side-view proposed), controls, goal, failure/recovery, session length, what to borrow from which era games | Text | `design/GAME_BRIEF.md` (edit in place) | `design/` |
| 1.2 | **Style guide + palette sheets** — the 4 palette lines as swatches, plus a short "do / don't" | PNG swatch strip per line (16 swatches, index 0 = transparent key), values snapped to the 9-bit levels | `templates/STYLE_GUIDE.md` | `assets/ui/palettes/` (or beside the style guide in `design/`) |
| 1.3 | **Sammy — core strips:** idle 4 @ 6 fps loop · run 8 @ 12 fps loop · jump-rise 2 @ 10 fps hold-last · fall 2 @ 10 fps loop · tail-whip 4 @ 15 fps one-shot (hit frame 2) · hurt 2 @ 10 fps one-shot · KO/defeat 6 @ 10 fps one-shot | One PNG strip per animation, 48×48 cells, baseline (24, 47), facing right | `templates/ASSET.md` | `assets/characters/character-sammy/` |
| 1.4 | **One zombie (e.g. enemy-zombie-jogger):** shamble/walk 6 @ 8 fps loop · attack 4 @ 10 fps (hit frame 2) · hit-react 2 @ 12 fps · comedic defeat 6–8 @ 12 fps one-shot | PNG strips, 48×48 cells, same baseline rules | `templates/ASSET.md` (behavior section: speed, damage, how it notices Sammy) | `assets/enemies/enemy-zombie-jogger/` |
| 1.5 | **One tileset + collision notes** (e.g. environment-central-park-tileset): ground, path, grass edges, one-way platforms, walls, slopes if wanted, plus a level exit / goal marker (e.g. a park exit gate) | PNG on an 8×8 grid, organized in 16×16 metatiles. Collision notes: which tiles are solid / one-way / hazard / decoration | `templates/ASSET.md` | `assets/environments/environment-central-park-tileset/` |
| 1.6 | **One background / parallax set** — sky, far skyline, mid trees, near bushes as separate bands | Separate PNG per band, 256 or 512 px wide (real plane widths are 256/512/1024), tiling horizontally; heights noted; palette line 3 | `templates/ASSET.md` (list band order + scroll speed intent) | `assets/environments/environment-central-park-tileset/` (or its own `environment-central-park-background/`) |
| 1.7 | **One interactive prop with every state** (e.g. prop-hot-dog-cart: upright → rocking → tipping → tipped-over → empty) | One PNG per state (or a strip per animated state), same cell size across states | `templates/ASSET.md` + `templates/INTERACTION.md` | `assets/props/prop-hot-dog-cart/` |
| 1.8 | **One power-up** (e.g. item-powerup-trash-lid-shield): pickup sprite (small loop) + "active" look on/around Sammy + HUD icon | Pickup 16×16 or 24×24 strip; active overlay: either a 48×48 strip aligned to Sammy's cell and pivot (24, 47), or a small sprite plus a per-frame hand point (x, y) — say which; icon 16×16 | `templates/ASSET.md` + `templates/ABILITY.md` (duration, effect, how it ends) | `ASSET.md` + art in `assets/items/item-powerup-trash-lid-shield/`; `ABILITY.md` in `design/abilities/item-powerup-trash-lid-shield.md` |
| 1.9 | **Signature ability description** (proposed: "Play Possum" — Sammy plays dead and nearby zombies lose track of him for a short time). Art is Tier 2 (play-dead strip); the rules are needed now | Text | `templates/ABILITY.md` | `design/abilities/ability-play-possum.md` |
| 1.10 | **HUD basics:** 8×8 pixel font (A–Z, 0–9, basic punctuation), health display (hearts/pips/bar), ability + power-up icons | Font as a grid PNG of 8×8 cells with the character order written down; icons 8×8 or 16×16 | `templates/ASSET.md` | `assets/ui/ui-font-8x8/`, `assets/ui/ui-hud/` |
| 1.11 | **Minimum audio:** 1 level music loop (e.g. music-level-01-central-park) + core SFX (IDs as in the audio example): sfx-jump, sfx-land, sfx-tail-whip, sfx-hit-zombie, sfx-zombie-groan, sfx-pickup, sfx-hurt, sfx-play-dead, sfx-zombie-defeat-comedic, sfx-cart-crash (prop break), sfx-ko | WAV masters (44.1 kHz or 48 kHz, 16-bit). Music: loop start + end points (in seconds or samples) | `templates/AUDIO.md` (one per music track; one per SFX or one per SFX set) | `assets/audio/music/music-level-01-central-park/`, `assets/audio/sfx/` |
| 1.12 | **Level layout sketch** (e.g. level-01-sheep-meadow): start point, where enemies/props/items go, the goal/exit | Any rough drawing, photo, or a list; tile-grid mockup if you have one | `templates/LEVEL.md` | `design/levels/<level-id>.md` (e.g. `design/levels/level-01-sheep-meadow.md`) |
| 1.13 | **Source + license for every file above** | One row per file | `design/ASSET_SOURCES.csv` | `design/` |

---

## Tier 2 — makes it feel finished

| # | What to supply | Format / dimensions | Template | Goes in |
|---|---|---|---|---|
| 2.1 | Sammy **play-dead** 4 @ 8 fps one-shot, then hold last frame (art for the proposed signature ability) | 48×48 strip | `ASSET.md` | `assets/characters/character-sammy/` |
| 2.2 | Sammy **land** 2 @ 15 fps one-shot; **victory** 4 @ 8 fps loop | 48×48 strips | `ASSET.md` | `assets/characters/character-sammy/` |
| 2.3 | Sammy **wake-up intro** 6 @ 6 fps one-shot (the opening moment in Central Park) | 48×48 strip | `ASSET.md` | `assets/characters/character-sammy/` |
| 2.4 | **Second and third zombie types** (e.g. enemy-zombie-hot-dog-vendor) — same minimum animations as 1.4, plus what makes each one behave differently. Walk can be skipped for stationary enemies (e.g. the hot-dog vendor), but list what replaces it (idle / throw) | 48×48 (or 64×64 for large) strips | `ASSET.md` | `assets/enemies/<enemy-id>/` |
| 2.5 | **Comedic defeat variants** (head pops off and bounces, deflates like a balloon, collapses into a pile of clothes…) | 6–8 frame strips, same cell size as the zombie | `ASSET.md` (note which attack triggers which) | the zombie's folder |
| 2.6 | **Title screen** (art + logo in your own original style) | 320×224 PNG, or layered pieces | `ASSET.md` | `assets/ui/ui-title-screen/` |
| 2.7 | **Game-over screen** and continue/restart prompt | 320×224 PNG | `ASSET.md` | `assets/ui/ui-game-over/` |
| 2.8 | **More props** (benches, trash cans, lamp posts, park signs) with every state | PNG per state | `ASSET.md` + `INTERACTION.md` | `assets/props/<prop-id>/` |
| 2.9 | **Second and third power-ups** | as 1.8 | `ASSET.md` + `ABILITY.md` | `ASSET.md` + art in `assets/items/<item-id>/`; `ABILITY.md` in `design/abilities/<item-id>.md` |
| 2.10 | Full SFX set + level-clear jingle + game-over jingle | WAV | `AUDIO.md` | `assets/audio/` |

## Tier 3 — polish and nostalgic nods

| # | What to supply | Format / dimensions | Template | Goes in |
|---|---|---|---|---|
| 3.1 | **Attract mode / demo** idea (the game plays itself on the title screen) | Text notes | `LEVEL.md` or `design/DECISIONS.md` | `design/` |
| 3.2 | **End-of-level boss** or zombie gauntlet (large sprite built from 64×64 or bigger cells, with attack patterns) | PNG strips | `ASSET.md` + `ABILITY.md` for its attacks | `ASSET.md` + art in `assets/enemies/<boss-id>/`; attack notes in `design/abilities/<boss-id>.md` |
| 3.3 | **Extra parallax bands** (e.g. water reflections, skyline layers, line-by-line scrolling ground) | Separate PNG per band | `ASSET.md` | `assets/environments/...` |
| 3.4 | **Portrait sheet** for Sammy (dialogue, title, game-over faces) | 48×48 per expression (64×64 optional) | `ASSET.md` | `assets/characters/character-sammy/` |
| 3.5 | **Credits** screen text + any font/logo art | Text + PNG | `ASSET.md` | `assets/ui/` |
| 3.6 | Era nods list: which feel/structure/humor beats you want to echo (e.g. "collected pickups scatter when Sammy is hit and can be grabbed back", "a fast downhill run section", "a single-screen boss arena at the end of the level") | Text | `templates/STYLE_GUIDE.md` | `design/` |

**Nostalgic nods rule:** homage through mechanics, feel, palette, structure, and humor only. Never copy, trace, or rip sprites, music, sound effects, logos, or named characters from commercial games, and don't use "Sega" or "Genesis" in the title or branding (they are trademarks). Reference screenshots belong in `assets/references/` and are reference-only — never shipped.

---

## What Claude Code can do with each kind of input

| You send | Claude Code can… | Notes |
|---|---|---|
| Contact sheet / concept art | Use as **reference only**: design decisions, color/feel matching, and choosing or drawing placeholders | A contact sheet is not a sprite sheet. Claude won't cut sprites from it unless you say which parts are final and how they're aligned |
| Aligned sprite strips + filled `ASSET.md` | **Animate directly** in the game | Fastest path. Frame size, count, fps, loop and baseline must be written down |
| Loose individual frames | **Pack into strips** in `work/` if the files are numbered in order (e.g. `run-00.png … run-07.png` (planned — not yet supplied)) and the same size | Originals stay untouched; the packed strip is recorded with its source |
| Layered source files (`.aseprite`, `.psd`) | Keep as **source**; also send a **PNG export** | Claude may not be able to open layered formats directly; the PNG is what goes in the game |
| Audio WAV masters | **Convert to OGG** in `work/` for the browser build | Keep the WAV as the master; write loop points in `AUDIO.md` |
| Text only (no art yet) | Build the level with **clearly labeled placeholders** | Placeholders get swapped when real art arrives |

---

## Top 10 mistakes that cost prep time

1. **Inconsistent frame size** — every frame in an animation (and ideally every Sammy animation) must use the same cell, e.g. 48×48.
2. **Shifting feet baseline** — if the feet move up/down between frames, Sammy will jitter. Keep feet on row 47.
3. **Semi-transparent edges** — soft/anti-aliased edges against transparency show as halos. Use hard 1-bit edges.
4. **Upscaled exports** — send art at native size (1×). Claude scales the whole screen; a 4× export breaks the pixel grid and the palette.
5. **Missing state images** — a prop that breaks needs a picture of every state (intact, hit, broken…).
6. **Unnamed frame order** — say which frame is first and which is the hit frame; number loose files.
7. **JPEG** — compression adds blurry off-palette colors and no transparency. Use PNG.
8. **Mixed scales** — Sammy, zombies, props and tiles must be drawn at the same pixel scale.
9. **Ripped or traced reference art in shippable folders** — anything from a commercial game goes only in `assets/references/` and never ships.
10. **Unknown license** — if you don't know who made it or what rights you have, it cannot ship.

---

## Licensing

- Add a row to `design/ASSET_SOURCES.csv` for **every** file you supply: creator, source, license, and whether it's cleared to ship.
- **Unknown rights = cannot ship.** Claude can still use the file privately as a placeholder or reference, but it stays out of release builds until rights are confirmed.
- Your own original art and audio: write "original — <your name>" and your chosen terms.
- Free/stock assets: include the link and the exact license name (e.g. CC0, CC-BY 4.0) and any attribution text.
- Reference screenshots and commercial-game material: mark as **reference-only**.
