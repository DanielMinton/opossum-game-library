# Asset metadata — Zombie Jogger (example)

> **EXAMPLE ONLY — planning spec, not a finished asset.** Run the scanner to see which files exist. Don't copy this into assets/ until every TBD is filled in.

How to read this example: **Confirmed** = humans have turned into zombies, with humorous, graphic (cartoon/slapstick) animations *(only the tone words "humorous" and "cartoon/slapstick" are superseded, 2026-10-19, by the owner's "Zombie Hunter" direction: badass action-horror with dark humour, a chainsaw, night-time Central Park, stylized gore with a low-gore option; see `design/DECISIONS.md`)*. Everything else (this enemy type, its behavior, numbers) is **Proposed** / **Example**, and still stands as an example. For a real enemy you would copy this file to `assets/enemies/enemy-zombie-jogger/ASSET.md`.

---

- Asset ID: `enemy-zombie-jogger`
- Display name: Zombie Jogger
- Category: enemy
- Files and purpose: see **Planned files** below (all planned — not yet supplied).
- Readiness: TBD — Example: concept sketch = `reference`; strips = `ready` once they follow the frame rules.
- Visual description: Example: a Central Park morning jogger turned zombie. Neon sweatband, headphones dangling from one ear, sweat-stained running tank, one sneaker untied, step-counter watch still beeping. Greenish-grey skin, droopy eyes, tongue out mid-stride. ~~Comedic, not scary.~~ *(Superseded 2026-10-19: rotting and menacing, with dark humour; see `design/DECISIONS.md`.)*
- Intended role in the game: Proposed: the basic, most common enemy in `level-01-sheep-meadow` (the Central Park wake-up level). Teaches the player to attack and to use Play Possum.
- Camera/view: Proposed: side-view profile, facing right.
- Relative size: Proposed: about 40–46 px tall in a 48×48 frame — a little taller than Sammy.
- Transparent background: Proposed: yes — transparent PNG, hard edges, 1-bit transparency only.
- Source/creator/license: TBD (also record in `design/ASSET_SOURCES.csv`).

## Planned files (planned — not yet supplied)

| File (planned — not yet supplied) | Type | Purpose |
|---|---|---|
| `zombie-jogger-reference-v01.png` | Reference | Concept / model sheet. Not used in game. |
| `zombie-jogger-walk-strip-v01.png` | Production strip | Shamble/jog, 6 frames, 288×48 px |
| `zombie-jogger-attack-strip-v01.png` | Production strip | 4 frames, 192×48 px |
| `zombie-jogger-hit-strip-v01.png` | Production strip | 2 frames, 96×48 px |
| `zombie-jogger-defeat-strip-v01.png` | Production strip | 8 frames, 384×48 px |
| `zombie-jogger-idle-strip-v01.png` | Production strip (optional) | 4 frames, 192×48 px |
| `zombie-jogger-head-v01.png` | Effect sprite (optional) | 16×16 bouncing head used in the defeat gag, if drawn separately |

## Animation (if applicable)
- File: one strip per animation (see Planned files — planned, not yet supplied).
- Frame width × height in pixels: Proposed: 48 × 48.
- Grid columns / rows: one row per file; columns = frame count.
- Frame count and reading order: left to right, zero-based. See table.
- Padding / spacing: Proposed: none.
- Pivot / feet baseline: Proposed: bottom-center (24, 47) zero-based; feet on row 47 in every grounded frame.
- Animation names and frame ranges (state whether zero- or one-based): zero-based — see table.
- Frames per second per animation: see table.
- Looping / one-shot: see table.
- Facing directions and whether mirroring is allowed: Proposed: drawn facing right; mirroring allowed. Example note: "Headphones can swap sides when mirrored — that's fine."

### Animation table (Proposed)

| Animation | Frames (zero-based) | Count | FPS | Loop / one-shot | Notes |
|---|---|---|---|---|---|
| walk (shamble-jog) | 0–5 | 6 | 8 | loop | Lazy jogging shuffle, arms flopping. |
| attack | 0–3 | 4 | 10 | one-shot | **Hit frame = 2.** Example: a sloppy shoulder-bump lunge. |
| hit-react | 0–1 | 2 | 12 | one-shot | Head snaps back, sweat drops fly. |
| defeat | 0–7 | 8 | 12 | one-shot | Comedic gag — see below. Ends on an empty or "pile" frame. |
| idle (optional) | 0–3 | 4 | 6 | loop | Jogging in place, checking the watch. |

**Comedic defeat (Example):** frames 0–2 the jogger stops and looks at his watch in shock; frame 3 his head pops off with a cartoon "boing"; frames 4–5 the head bounces away (can be the separate 16×16 head sprite) while the body keeps jogging in place; frames 6–7 the body collapses into a pile of sweatsuit and one sneaker. Slapstick, no realistic gore — cartoon "graphic" only. *(Superseded 2026-10-19: see the "Zombie Hunter" direction in `design/DECISIONS.md`.)*

## Behavior
- What this asset does: Proposed: patrols back and forth; chases Sammy when he gets close.
- What triggers it: Proposed: Sammy enters its **notice range of 96 px** (horizontal, same ground level). Loses interest if Sammy is more than 160 px away for 2 s.
- What the player can do with it: tail-whip it, avoid it, or use **Play Possum** (proposed): while Sammy plays dead within its notice range, the jogger stops chasing, jogs in place confused ("?" bubble) for the rest of the ability, then returns to patrol.
- Collision / hitbox intent: Proposed body hitbox: Example 18 px wide × 38 px tall, centered on the pivot. Attack hitbox only on hit frame 2: 16 × 20 px, from 4 to 20 px in front of its feet point and 6 to 26 px above the ground (as in `game/src/config.js`). No damage from touching its back while it's in hit-react.
- Damage, reward, cooldown, or other values (all Example, Proposed):

| Value | Example |
|---|---|
| HP | 2 tail-whip hits |
| Patrol speed | 30 px/s |
| Chase speed | 60 px/s (a bit slower than Sammy's run) |
| Patrol distance | 64 px each way from spawn |
| Contact / attack damage | 1 heart |
| Attack cooldown | 1.2 s |
| Reward | Example: small score bonus; may drop a pickup 20% of the time |

- Required sounds / effects: Example (TBD): groan loop, footstep slaps, watch "beep-beep" on notice, attack grunt, hit "thwack", head "boing" + pop on defeat. Effects: sweat drops, "!" when noticing, "?" when Sammy plays dead.
- Missing states or assets: Example: turn-around frame, fall/land (if it can walk off ledges), spawn/rise-from-ground animation, stunned state. Mark "blocks play" vs "polish".
- Details that must be preserved: Example only — replace with yours: neon sweatband, dangling headphones, untied sneaker, watch.

## Palette (Proposed)

Uses the enemy palette line (line 1): 15 colors + transparent, shared with other zombie types — so pick skin/shadow colors all zombies can reuse. Snap RGB values to 0, 36, 72, 108, 144, 180, 216, 252.
