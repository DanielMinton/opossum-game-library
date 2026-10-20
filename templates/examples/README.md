# Template examples

> **EXAMPLE ONLY — planning spec, not a finished asset.** Run the scanner to see which files exist. Don't copy this into assets/ until every TBD is filled in.

**What this folder is:** the planning specs for every art and sound file the game plans to use. Each file name and size here must match the list in `game/src/assets.js`. A test checks this for art (not for sound names), so if you change a name or size, change it in both places.

To see which planned files exist and which are still missing, run the scanner (see "Adding real art" in the main `README.md`).

**Tone update (2026-10-19):** these examples were written for a cute, comedic, no-blood game. The owner has since chosen a badass action-horror direction with dark humour: a chainsaw, night-time Central Park and stylized gore with a low-gore option (see `design/DECISIONS.md`, "New direction — Zombie Hunter", and `design/ART_BRIEFS.md`). Lines that say "comedic", "not scary", "no blood" or "early morning" are marked superseded; sizes, frame counts and names still apply.

This README is the index of the examples folder; it is itself not an asset.

These are **filled-in examples** of the templates in `templates/`, written for Sammy's Central Park game. They show what "good enough" metadata looks like so you can copy the pattern. All details (sizes, frame counts, ability names, enemy types, level names) are **Proposed / Example** — not decisions, and not real assets.

For what to send first, see `design/ASSET_REQUEST_CHECKLIST.md`.

## What each example demonstrates

| Example folder | Template(s) shown | Demonstrates |
|---|---|---|
| `character-sammy/` | `ASSET.md` | The player character: 48×48 frame cells, feet point (28, 47), facing right, one strip per animation with frame counts, fps, loop/one-shot, hit frames |
| `enemy-zombie-jogger/` | `ASSET.md` | The main enemy example: walk/attack/hit-react/comedic defeat strips plus behavior values (speed, damage, how it notices Sammy) |
| `enemy-zombie-hot-dog-vendor/` | `ASSET.md` | A brief second enemy — how little you need to write when it reuses the first enemy's layout |
| `prop-hot-dog-cart/` | `ASSET.md` + `INTERACTION.md` | An interactive object with every visual state and the transitions between them |
| `item-powerup-trash-lid-shield/` | `ASSET.md` + `ABILITY.md` | A power-up: pickup sprite, "active" look, HUD icon, duration and how it ends |
| `item-powerup-chainsaw/` | `ASSET.md` | A second power-up (Stage B): pickup strip and HUD icon; Sammy's chainsaw strips are in `character-sammy/` |
| `ability-play-possum/` | `ABILITY.md` | The proposed signature ability (play dead → nearby zombies lose track of Sammy) — rules, timing, cooldown, feedback |
| `environment-central-park-tileset/` | `ASSET.md` | An 8×8 / 16×16 tileset with collision notes and a parallax background band list |
| `audio/` | `AUDIO.md` | A looping music track (`music-level-01-central-park`) that loops end-to-start, a core SFX set, and the extra sounds the game supports |
| `level-01-sheep-meadow/` | `LEVEL.md` | The Central Park wake-up level: start, enemy/prop/item placement, goal, failure/restart |

New blank templates used by these examples: `templates/STYLE_GUIDE.md`, `templates/LEVEL.md`, `templates/ABILITY.md` (alongside the original `ASSET.md`, `INTERACTION.md`, `AUDIO.md`).

## The banner rule

Every file in this folder starts with this line right after its title:

> **EXAMPLE ONLY — planning spec, not a finished asset.** Run the scanner to see which files exist. Don't copy this into assets/ until every TBD is filled in.

Level and ability examples (`LEVEL.md`, `ABILITY.md`) describe rules, not art, so theirs says `design/` instead:

> **EXAMPLE ONLY — planning spec, not approved design.** Don't copy this into design/ until every TBD is filled in.

Any filename mentioned in an example is marked "(planned — not yet supplied)" or listed under a section clearly titled as planned files. Some of those files may exist by now (Sammy's run strip does); the scanner shows which. This keeps Claude Code from mistaking an example for real inventory.

## How to use an example for a real asset

Fill in every TBD first, while the copy is still outside `assets/` (for example, in a working folder of your own). Then:

1. **Copy** the finished folder into the matching `assets/` category, e.g. `templates/examples/prop-hot-dog-cart/` → `assets/props/prop-hot-dog-cart/`.
   - **Exception:** `LEVEL.md` and `ABILITY.md` files never go in `assets/`. Copy them to `design/levels/<level-id>.md` and `design/abilities/<ability-id>.md` (so `level-01-sheep-meadow/` and `ability-play-possum/` go entirely to `design/`, and the trash lid's `ABILITY.md` goes to `design/abilities/item-powerup-trash-lid-shield.md` while its `ASSET.md` goes to `assets/items/`). Only art-bearing `ASSET.md`, `INTERACTION.md` and `AUDIO.md` files go in `assets/`.
2. **Rename** the folder to your real asset ID if it differs (lowercase kebab-case, e.g. `prop-park-bench`).
3. **Replace every planned file** with your real files (PNG, WAV, etc.), and update every number, name, and description to match what you actually made. Unknowns stay `TBD`.
4. **Delete the EXAMPLE banner line** — only after the real files are in the folder.
5. Add a row per file to `design/ASSET_SOURCES.csv` (creator, source, license).

## Warning

**Never leave an example inside `assets/`.** Claude Code reads every `ASSET.md` and `INTERACTION.md` under `assets/` as real inventory. An unedited example there would be recorded as a real asset with files that don't exist. If you copy one in and don't finish it, move it back out or delete it.
