# Asset request checklist — what to send first

This is the prioritized list of source resources Claude Code needs to build a **first playable vertical slice: one Central Park level** for Sammy's game. Send Tier 1 first. Tier 2 and Tier 3 can follow while the level is being built.

**Confirmed (from you):** Sammy is an opossum ("he"). He wakes up in Central Park (NYC) with no memory of how he got there. Humans have turned into zombies, with humorous cartoon/slapstick-graphic animations *(tone superseded 2026-10-19, see next line)*. Sammy fights through levels using interactive objects, power-ups, and special abilities. The game will eventually look like a 16-bit Genesis-era game with nostalgic nods to that era.

**New direction (Confirmed by you, 2026-10-19):** badass action-horror with dark humour. Sammy fights zombies with a **chainsaw**, in Central Park **at night** (Bethesda Terrace inspiration), and it gets gorier. Your theme song is in (1.11). Mood picture: `assets/references/zombie-hunter-concept-v01.jpg` (reference only). Proposed details: stylized pixel gore with a low-gore option (owner question 1), the night palette and gore colours in `design/STYLE_GUIDE.md`, and the chainsaw as a power-up (1.14, 1.15).

**Everything else on this page is Proposed** — sizes, frame counts, ability names, enemy types, level names, and scope. Change anything that doesn't fit your vision and record the change in `design/GAME_BRIEF.md` or `design/DECISIONS.md`.

Worked examples of every template live in `templates/examples/` (see `templates/examples/README.md`). They are planning specs (proposals only) for every planned file. The first real file, Sammy's run animation, is in. To see which files exist and which are still missing, with exact names and sizes, run the scanner (see "Adding real art" in `README.md`).

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
| Outline and light | 1 px dark outline on every sprite and foreground tile; none on background bands. Light from the top-left; 3-step shading ramps (see `design/STYLE_GUIDE.md`) |
| Sprite frames | **48×48 px** cell for Sammy and normal zombies (large zombies 64×64). Sammy ~32–40 px tall; normal zombies ~40–46 px tall. Transparent PNG, every frame in a strip the same size. One exception: Sammy's tail-whip strip uses a **64×48** cell (see 1.3) |
| Baseline | Feet at bottom-center **(24, 47)** zero-based; **Sammy: (28, 47)** (**(36, 47)** in his 64×48 tail-whip cell), to leave room for his tail; feet touch row 47 in every grounded frame |
| Facing | Draw facing **right**; Claude mirrors for left unless you note an asymmetric detail |
| Sheet layout | One horizontal strip per animation, frames left→right, zero-based, no padding (or state "1 px padding") |
| Audio | Music: your theme song (2026-10-19). Sound effects: FM-synth + PSG feel (YM2612 + SN76489 style), punchy and gnarly rather than comic. Deliver **OGG** (plus an MP3 beside it for older Safari), or **WAV masters** and Claude converts them. New music should loop cleanly end-to-start with no separate intro (loop points aren't supported yet). **Exception:** the theme song is used as it is, so for now it loops whole, quiet build-in and fade-out included, every 70 s; a trimmed loop edit can come later |

---

## Tier 1 — needed for the first playable level (placeholders can stand in for any of these)

Without these, Claude can only build with grey placeholder boxes.

**Folders that don't exist yet:** `assets/ui/palettes/`, `assets/ui/ui-font-8x8/`, `assets/ui/ui-hud/`, `design/abilities/`, `design/levels/` and `work/` are the intended homes. Each folder is created when its first file arrives.

- **Blocks play** (the level can't be played without at least a placeholder): 1.1, 1.3, 1.4, 1.5, 1.7, 1.8, 1.9, 1.10, 1.12.
- **Feel** (the level plays without it, but the first playable needs it to feel right): 1.2, 1.6, 1.11.
- **The new direction** (planned for step B; the game has no slot for these files yet): 1.14, 1.15.
- **Blocks shipping, not play:** 1.13.

| # | What to supply | Format / dimensions | Template to fill | Goes in |
|---|---|---|---|---|
| 1.1 | **Filled game brief** — at minimum: camera (side-view proposed), controls, goal, failure/recovery, session length, what to borrow from which era games | Text | `design/GAME_BRIEF.md` (edit in place) | `design/` |
| 1.2 | **Style guide + palette sheets** — the 4 palette lines as swatches, plus a short "do / don't" | PNG swatch strip per line (16 swatches, index 0 = transparent key), values snapped to the 9-bit levels | `design/STYLE_GUIDE.md` (draft; review and change it) | `assets/ui/palettes/` (all palette sheets live here, including Sammy's line 0) |
| 1.3 | **Sammy — core strips:** idle 4 @ 6 fps loop · run 8 @ 12 fps loop · jump-rise 2 @ 10 fps hold-last · fall 2 @ 10 fps loop · tail-whip 4 @ 15 fps one-shot (hit frame 2; **64×48 cells, pivot (36, 47)**, strip 256×48, because the whip reaches 26 px in front of him) · hurt 2 @ 10 fps one-shot · KO/defeat 6 @ 10 fps one-shot | One PNG strip per animation, 48×48 cells (tail-whip 64×48), feet point (28, 47) (tail-whip (36, 47)), facing right. **Run: supplied 2026-10-19** (`sammy-run-strip-v01.png`) | `templates/ASSET.md` | `assets/characters/character-sammy/` |
| 1.4 | **One zombie (e.g. enemy-zombie-jogger):** shamble/walk 6 @ 8 fps loop · attack 4 @ 10 fps (hit frame 2) · hit-react 2 @ 12 fps · defeat 6–8 @ 12 fps one-shot (~~comedic~~ *2026-10-19:* dark and gory, with a low-gore version; the chainsaw's cut-in-half defeat is 1.14) | PNG strips, 48×48 cells, same baseline rules. Zombies look rotting and menacing, not cute | `templates/ASSET.md` (behavior section: speed, damage, how it notices Sammy) | `assets/enemies/enemy-zombie-jogger/` |
| 1.5 | **One tileset + collision notes** (e.g. environment-central-park-tileset): ground, path, grass edges, one-way platforms, walls, slopes if wanted, plus a level exit / goal marker (e.g. a park exit gate) | PNG on an 8×8 grid, organized in 16×16 metatiles. Collision notes: which tiles are solid / one-way / hazard / decoration | `templates/ASSET.md` | `assets/environments/environment-central-park-tileset/` |
| 1.6 | **One background / parallax set** — sky, far skyline, mid trees, near bushes as separate bands | Separate PNG per band, 256 or 512 px wide (real plane widths are 256/512/1024), tiling horizontally; palette line 3. Game today: sky 320×224; skyline 512×64 on rows 80–143; trees 512×32 on rows 144–175; bushes 512×32 on rows 176–207. Bands must not overlap | `templates/ASSET.md` (list band order + scroll speed intent) | `assets/environments/environment-central-park-tileset/` (or its own `environment-central-park-background/`) |
| 1.6b | **Scenery pieces (Proposed, 2026-10-19):** park ground, wet path, lamp (+ glow), bench, far and near trees, fence, rock, bin, drifting leaves, puddle, and Bethesda ground, fountain (3 frames), angel, balustrade, arch, stairs | One PNG per piece at the exact size in `design/ART_BRIEFS.md` "Scenery (park and Bethesda Terrace)" (18 files); 9-bit palette, 1 px dark outline on foreground pieces; blank templates in `templates/art-templates/` | `templates/examples/environment-central-park-tileset/ASSET.md` and `environment-bethesda-terrace/ASSET.md` | `assets/environments/environment-central-park-tileset/` and `assets/environments/environment-bethesda-terrace/` |
| 1.7 | **One interactive prop with every state** (e.g. prop-hot-dog-cart: upright → rocking → tipping → tipped-over → empty) | One PNG per state (or a strip per animated state), same cell size across states | `templates/ASSET.md` + `templates/INTERACTION.md` | `assets/props/prop-hot-dog-cart/` |
| 1.8 | **One power-up** (e.g. item-powerup-trash-lid-shield): pickup sprite (small loop) + "active" look on/around Sammy + HUD icon (the icon lives in the item's own folder) | Pickup 16×16 or 24×24 strip; active overlay: either a 48×48 strip aligned to Sammy's cell and pivot (24, 47), or a small sprite plus a per-frame hand point (x, y) — say which; icon 16×16 | `templates/ASSET.md` + `templates/ABILITY.md` (duration, effect, how it ends) | `ASSET.md`, art and HUD icon in `assets/items/item-powerup-trash-lid-shield/`; `ABILITY.md` in `design/abilities/item-powerup-trash-lid-shield.md` |
| 1.9 | **Signature ability description** (proposed: "Play Possum" — Sammy plays dead and nearby zombies lose track of him for a short time). Art is Tier 2 (play-dead strip); the rules are needed now | Text | `templates/ABILITY.md` | `design/abilities/ability-play-possum.md` |
| 1.10 | **HUD basics:** 8×8 pixel font (A–Z, 0–9, basic punctuation), health display (hearts/pips/bar), ability icons (e.g. Play Possum) | Font as a grid PNG of 8×8 cells with the character order written down; icons 8×8 or 16×16. An 8×8 font fits only 40 characters across the screen (see `design/STYLE_GUIDE.md`) | `templates/ASSET.md` | Font: `assets/ui/ui-font-8x8/`. Hearts and ability icons: `assets/ui/ui-hud/`. A power-up's HUD icon goes in that power-up's folder (see 1.8) |
| 1.11 | **Minimum audio:** 1 level music loop (music-level-01-central-park; **supplied 2026-10-19:** your theme song, `music-level-01-central-park-v01.mp3`, which waits on owner question 21 before it can ship) + core SFX (IDs as in the audio example): sfx-jump, sfx-land, sfx-tail-whip, sfx-hit-zombie, sfx-zombie-groan, sfx-pickup, sfx-hurt, sfx-play-dead, sfx-zombie-defeat-comedic, sfx-cart-crash (prop break), sfx-ko. Extra IDs the game already has slots for are in 2.10 | OGG, plus an MP3 beside it for older Safari; or WAV masters (44.1 kHz or 48 kHz, 16-bit) and Claude converts them. Music should loop cleanly end-to-start, with no separate intro (loop points aren't supported yet). Exception: the theme song loops whole for now (see the Audio row above) | `templates/AUDIO.md` (one per music track; one per SFX or one per SFX set) | One folder per sound, named after it: `assets/audio/music/music-level-01-central-park/`, `assets/audio/sfx/sfx-jump/`, … |
| 1.12 | **Level layout sketch** (e.g. level-01-sheep-meadow): start point, where enemies/props/items go, the goal/exit | Any rough drawing, photo, or a list; tile-grid mockup if you have one | `templates/LEVEL.md` | `design/levels/<level-id>.md` (e.g. `design/levels/level-01-sheep-meadow.md`; the folder is created with the first level) |
| 1.13 | **Source + license for every file above** | One row per file | `design/ASSET_SOURCES.csv` | `design/` |
| 1.14 | **Chainsaw power-up art** (planned for step B; Proposed): pickup 4 @ 8 fps loop (32×16 frames) · Sammy with the chainsaw: idle 4 @ 6 fps loop, run 8 @ 12 fps loop, rev 2 @ 15 fps loop, cut 4 @ 15 fps one-shot (hit frame 2), **or** a held-saw overlay instead of full strips · a cut-in-half defeat for each zombie, plus a low-gore version · spark and blood/ichor splat effects · 16×16 HUD icon | Sammy-with-saw strips 64×48 frames, feet point (36, 47); defeats 48×48; effects 16×16. Sizes may change when step B is built | `templates/ASSET.md` (+ `ABILITY.md` for how long it lasts). Brief: `design/ART_BRIEFS.md`, "Chainsaw power-up" | `assets/items/item-powerup-chainsaw/`, Sammy's and each zombie's folders |
| 1.15 | **Chainsaw sounds** (planned for step B; Proposed): `sfx-chainsaw-start` (pull-cord start) · `sfx-chainsaw-rev` (engine, **loops**) · `sfx-chainsaw-cut` (the chain biting a zombie) · `sfx-gore-splat` (wet splat; a dry thud for low gore) | As 1.11; the rev sound must loop cleanly | `templates/AUDIO.md` | `assets/audio/sfx/<id>/` (the ids aren't in the game's sound list until step B) |

---

## Tier 2 — makes it feel finished

| # | What to supply | Format / dimensions | Template | Goes in |
|---|---|---|---|---|
| 2.1 | Sammy **play-dead** 4 @ 8 fps one-shot, then hold last frame (art for the proposed signature ability) | 48×48 strip | `ASSET.md` | `assets/characters/character-sammy/` |
| 2.2 | Sammy **land** 2 @ 15 fps one-shot; **victory** 4 @ 8 fps loop | 48×48 strips | `ASSET.md` | `assets/characters/character-sammy/` |
| 2.3 | Sammy **wake-up intro** 6 @ 6 fps one-shot (the opening moment in Central Park) | 48×48 strip | `ASSET.md` | `assets/characters/character-sammy/` |
| 2.4 | **Second and third zombie types** (e.g. enemy-zombie-hot-dog-vendor) — same minimum animations as 1.4, plus what makes each one behave differently. Walk can be skipped for stationary enemies (e.g. the hot-dog vendor), but list what replaces it (idle / throw) | 48×48 (or 64×64 for large) strips | `ASSET.md` | `assets/enemies/<enemy-id>/` |
| 2.5 | **Defeat variants** (~~comedic~~ *2026-10-19: dark humour, stylized gore*: head knocked off, cut in half, deflates hissing ichor, collapses into a pile of clothes…), each with a low-gore version | 6–8 frame strips, same cell size as the zombie | `ASSET.md` (note which attack triggers which) | the zombie's folder |
| 2.6 | **Title screen** (art + logo in your own original style) | 320×224 PNG, or layered pieces | `ASSET.md` | `assets/ui/ui-title-screen/` |
| 2.7 | **Game-over screen** and continue/restart prompt | 320×224 PNG | `ASSET.md` | `assets/ui/ui-game-over/` |
| 2.8 | **More props** (benches, trash cans, lamp posts, park signs) with every state | PNG per state | `ASSET.md` + `INTERACTION.md` | `assets/props/<prop-id>/` |
| 2.9 | **Second and third power-ups** | as 1.8 | `ASSET.md` + `ABILITY.md` | `ASSET.md` + art in `assets/items/<item-id>/`; `ABILITY.md` in `design/abilities/<item-id>.md` |
| 2.10 | Extra SFX the game already has slots for: sfx-cart-rock, sfx-shield-block, sfx-shield-break, sfx-throw, sfx-splat, sfx-splash, sfx-checkpoint, sfx-gate-open, sfx-level-clear (jingle), sfx-start. Gauntlet music: music-level-01-gauntlet (optional; same loop rule as 1.11). Game-over jingle (no slot yet) | As 1.11 | `AUDIO.md` | `assets/audio/sfx/<id>/`, `assets/audio/music/music-level-01-gauntlet/` |

## Tier 3 — polish and nostalgic nods

| # | What to supply | Format / dimensions | Template | Goes in |
|---|---|---|---|---|
| 3.1 | **Attract mode / demo** idea (the game plays itself on the title screen) | Text notes | `LEVEL.md` or `design/DECISIONS.md` | `design/` |
| 3.2 | **End-of-level boss** or zombie gauntlet (large sprite built from 64×64 or bigger cells, with attack patterns) | PNG strips | `ASSET.md` + `ABILITY.md` for its attacks | `ASSET.md` + art in `assets/enemies/<boss-id>/`; attack notes in `design/abilities/<boss-id>.md` |
| 3.3 | **Extra parallax bands** (e.g. water reflections, skyline layers, line-by-line scrolling ground) | Separate PNG per band | `ASSET.md` | `assets/environments/...` |
| 3.4 | **Portrait sheet** for Sammy (dialogue, title, game-over faces) | 48×48 per expression (64×64 optional) | `ASSET.md` | `assets/characters/character-sammy/` |
| 3.5 | **Credits** screen text + any font/logo art | Text + PNG | `ASSET.md` | `assets/ui/` |
| 3.6 | Era nods list: which feel/structure/humor beats you want to echo (e.g. "collected pickups scatter when Sammy is hit and can be grabbed back", "a fast downhill run section", "a single-screen boss arena at the end of the level") | Text | `design/STYLE_GUIDE.md` ("Nostalgic nods") | `design/` |

**Nostalgic nods rule:** homage through mechanics, feel, palette, structure, and humor only. Never copy, trace, or rip sprites, music, sound effects, logos, or named characters from commercial games, and don't use "Sega" or "Genesis" in the title or branding (they are trademarks). Reference screenshots belong in `assets/references/` and are reference-only — never shipped.

---

## What Claude Code can do with each kind of input

| You send | Claude Code can… | Notes |
|---|---|---|
| Contact sheet / concept art | Use as **reference only**: design decisions, color/feel matching, and choosing or drawing placeholders | A contact sheet is not a sprite sheet. Claude won't cut sprites from it unless you say which parts are final and how they're aligned |
| Aligned sprite strips + filled `ASSET.md` | **Animate directly** in the game | Fastest path. Frame size, count, fps, loop and baseline must be written down |
| Loose individual frames | **Pack into strips** in `work/` (created when first needed) if the files are numbered in order (e.g. `run-00.png … run-07.png` (planned — not yet supplied)) and the same size | Originals stay untouched; the packed strip is recorded with its source |
| Layered source files (`.aseprite`, `.psd`) | Keep as **source**; also send a **PNG export** | Claude may not be able to open layered formats directly; the PNG is what goes in the game |
| Audio WAV masters | **Convert to OGG** (and MP3) beside the WAV with `node tools/convert-audio.mjs` (from `game/`) | Keep the WAV as the master. It never ships when an OGG or MP3 sits beside it. Music loops whole, so make it loop cleanly end-to-start |
| Text only (no art yet) | Build the level with **clearly labeled placeholders** | Placeholders get swapped when real art arrives |

---

## Top 10 mistakes that cost prep time

1. **Inconsistent frame size** — every frame in an animation must use the same cell. Sammy uses 48×48 for everything except the tail whip (64×48, so the tail fits).
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

**Columns in `design/ASSET_SOURCES.csv`** (one row per file; a new version like `-v02` needs its own row):

| Column | Allowed values |
|---|---|
| `asset_id` | Short name, e.g. `sammy-run` |
| `path` | The file, starting with `assets/`, e.g. `assets/characters/character-sammy/sammy-run-strip-v02.png` |
| `creator` | Who made it |
| `source_url` | Link to where it came from (blank for your own work) |
| `license` | Exact license name, e.g. `CC0`, `CC-BY 4.0`, `Original work`. Not blank, `TBD` or `unknown` |
| `commercial_use` | `yes` or `no` |
| `attribution_required` | `yes` or `no` |
| `notes` | Free text |

**What the build ships:** only files with `commercial_use` = `yes` and a filled-in license that isn't non-commercial (`NC`, "non-commercial") or `reference-only`. Everything else is left out, and `game/dist/BUILD_INFO.txt` says why. Files with `attribution_required` = `yes` are listed in `game/dist/CREDITS.txt`.
