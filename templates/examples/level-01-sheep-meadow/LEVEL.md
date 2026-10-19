# Level — Sheep Meadow wake-up (example)
> **EXAMPLE ONLY — not a real asset. No files listed here exist yet.** Copy into assets/<category>/<asset-id>/ and replace with your real details.

> **Where the real copy goes:** `design/levels/level-01-sheep-meadow.md` (per `templates/LEVEL.md`) — **not** `assets/`. Level docs describe layout, not artwork.

**Confirmed by the user:** Sammy (an opossum, "he") wakes up in Central Park with no memory of how he got there; humans have become zombies with humorous, slapstick-graphic animations; Sammy fights through levels using interactive objects, power-ups and special abilities; 16-bit console presentation. **Everything below is Proposed / Example.**

## Overview

- Level ID: `level-01-sheep-meadow`
- Display name: TBD (e.g., "Sheep Meadow" or "Wake-Up Call")
- Location: Sheep Meadow, Central Park, early morning
- Order in game: first (also the tutorial — teaches move, jump, tail-whip, props, power-up, and Play Possum one at a time)
- Story beat: Sammy wakes on the grass with no memory, finds the park full of zombies, and fights his way to the park exit.
- Length in screens: **12** (3840×224 px = 240×14 metatiles of 16×16)
- Scroll direction: left→right (east, toward the park exit); no backtracking past checkpoints (Proposed)
- Target play time: first clear **3–5 minutes**. With retries from checkpoints, a first session lands in the brief's proposed **5–10 minutes** for the first level.
- Difficulty: 1 (of 5)
- Status: proposed

## Look and sound

- Tileset: `environment-central-park-tileset`
- Palette lines used: 0 = Sammy + HUD · 1 = zombies · 2 = foreground tiles, props, items · 3 = background/parallax (see `STYLE_GUIDE.md`)
- Music: `music-level-01-central-park` (loop points in its `AUDIO.md`; the gauntlet may switch to a faster track — TBD)
- Ambient sounds: TBD (e.g., distant zombie groans, birds that stop when zombies appear)

| Parallax layer (far → near) | Asset ID / file | Scroll speed | Notes |
|---|---|---|---|
| Sky | `environment-central-park-tileset` — sky bands | 0% | Static dawn bands |
| Far | same — Manhattan skyline silhouette | 12.5% | 512 px loop |
| Mid | same — tree line | 25% | 512 px loop |
| Near bushes (extra band) | same — near bushes | 50% | 512 px loop, just behind the ground line |
| Near / foreground | foreground tiles | 100% | Ground, benches, lampposts, fences |

## Flow

- Start point: screen 1, x 48 px, feet on the ground top at y 192 (Example). Sammy is lying on the grass and plays the wake-up intro (polish — placeholder: idle).
- Goal / exit: the park exit gate at the east end of screen 12. It opens once the gauntlet is cleared; walking through ends the level (victory animation, then "Level clear").

| Checkpoint | Location (screen # / x px) | What it looks like | Restores health? |
|---|---|---|---|
| Start | screen 1 / x 48 | Wake-up spot on the grass | — (start at full HP) |
| C1 | end of screen 4 / x 1264 | TBD (e.g., a park lamppost that lights up) | No on touch; respawning here gives full HP (Proposed) |
| C2 | start of screen 9 / x 2576 | Same as C1 | No on touch; respawning here gives full HP (Proposed) |

## Enemies

| Enemy ID | Count | Placement (screen # / x px) | Behavior here | Notes |
|---|---|---|---|---|
| `enemy-zombie-jogger` | 1 | screen 2 | Patrols, chases on notice | First zombie. Prompt "X: tail-whip" |
| `enemy-zombie-jogger` | 2 | screen 3, spaced apart | Patrol | Practice |
| `enemy-zombie-jogger` | 1 | screen 4 | Patrol | Guards the first power-up |
| `enemy-zombie-jogger` | 2 | screen 5 | Patrol between lampposts | Verticality |
| `enemy-zombie-hot-dog-vendor` | 1 | screen 6, behind the cart | Stationary, lobs hot dogs | Teaches jumping projectiles |
| `enemy-zombie-jogger` | 3 | screen 7, grouped ahead | Chase together | Teaches Play Possum |
| `enemy-zombie-jogger` | 2 | screen 8, at the pond edges | Patrol | Hazard section |
| `enemy-zombie-jogger` | 3 | screen 10 | Patrol | Mixed fight |
| `enemy-zombie-jogger` | 9 | screens 11–12 (arena) | Waves of 2, 3, then 4 | See **Boss or gauntlet** |

## Interactive props

| Prop ID | Count | Placement | What it does (see its `INTERACTION.md`) |
|---|---|---|---|
| `prop-hot-dog-cart` | 1 | screen 6 | Whip twice to tip it; spills 3 hot dogs that heal and knock back zombies. Prompt "Whip the cart!" |
| Benches, lampposts, rock outcrops, fences | several | screens 2–10 | Tiles from the tileset, not interactive props: one-way or solid platforms (see the tileset `ASSET.md`) |

## Power-ups and pickups

| Item / ability ID | Count | Placement | Hidden or visible | Notes (see `ABILITY.md`) |
|---|---|---|---|---|
| `item-powerup-trash-lid-shield` | 1 (+1 optional, TBD) | screen 4; optional second on screen 9 | visible | Blocks 3 hits |
| Hot dog (from the cart) | 3 | screen 6, after the spill | visible | Each heals 1 HP; vanish after 10 s |
| `ability-play-possum` | — | taught on screen 7 | — | Innate; prompt "C: Play Possum — zombies lose track of you" |

## Hazards

| Hazard | Placement | Effect on Sammy | Effect on zombies | Art needed |
|---|---|---|---|---|
| Pond water | screen 8 | Lose 1 HP, respawn at the last safe ground | TBD (walk around it, or fall in with a comic splash) | Water surface (2-frame shimmer) + splash effect |

## Secrets

| Secret | How to find it | Reward |
|---|---|---|
| TBD — Example: a lamppost top on screen 5 | Jump from the fence to the lamp top | One hot dog (heal) |

## Failure and recovery

- How Sammy gets hurt: zombie attacks, thrown hot dogs, pond water
- Health / lives: 3 HP (TBD); no lives in the first release (Proposed)
- What happens on defeat: KO animation, then restart at the last checkpoint with full HP
- Pits or instant-fail spots: none (Proposed)
- What resets on respawn (enemies, items, props): enemies after the checkpoint respawn; the cart resets to upright if the checkpoint is before it; a used trash lid comes back (TBD)
- Game over / continue rules: none in the first release — unlimited checkpoint restarts (Proposed)

## Boss or gauntlet (optional)

- Type: enemy gauntlet
- Enemy or boss ID: `enemy-zombie-jogger` (+ `enemy-zombie-hot-dog-vendor` in the last wave — TBD)
- Arena size: 1 screen; the camera locks in front of the exit gate, and fences block both sides
- Pattern / phases: 3 short waves — 2, then 3, then 4 joggers
- How to win: defeat every zombie in all 3 waves
- Reward: the exit gate opens; level-clear tally (Proposed)

## Nostalgic nod

- Nod: an arena "lock-in" gauntlet before the exit, a level-clear tally screen, a 3-button control layout, multi-band parallax
- What is borrowed (feel / structure / humor only): the camera lock and wave structure, the end-of-level count-up, the button layout feel, layered scrolling speeds
- What is original: all art, music, sounds, characters, and the level layout
- Reference screenshots (reference-only, in `assets/references/`): TBD — none supplied

## Missing assets

Matches Tier 1 of `design/ASSET_REQUEST_CHECKLIST.md`. Clearly labeled placeholders (colored boxes, silent or beep SFX) can stand in for any of these until art arrives.

| Asset | Blocks play? (yes / polish) | Placeholder plan |
|---|---|---|
| `character-sammy` core animations | yes | Labeled colored box |
| `enemy-zombie-jogger` (walk, attack, hit-react, defeat) | yes | Labeled colored box |
| `environment-central-park-tileset` ground + platform tiles | yes | Flat-color tiles |
| Park exit gate (goal marker) | yes | Labeled box "EXIT" |
| `prop-hot-dog-cart` (all states) | yes (interactive objects are a confirmed feature) | Colored rectangles labeled by state |
| `item-powerup-trash-lid-shield` | yes (power-ups are a confirmed feature) | Grey circle "LID" |
| HUD: health, font, ability + power-up icons | yes | Plain text and boxes |
| One background band set (sky + at least one parallax band) | no — feel, but needed for the first playable (Tier 1) | Flat sky color |
| `music-level-01-central-park` loop + core SFX | no — feel, but needed for the first playable (Tier 1) | Silence / beeps |
| `enemy-zombie-hot-dog-vendor` | polish (Tier 2) | Leave out, or a jogger stands in |
| Sammy wake-up intro | polish (Tier 2) | Idle animation |
| Extra parallax bands | polish (Tier 3) | Fewer bands |
| Level-clear jingle | polish (Tier 2) | Silence |

## ASCII map

Not to scale — each block ≈ 1 screen (not one character per metatile).

```text
screen:  |  1   |  2   |  3   |  4   |  5   |  6   |  7   |  8   |  9   |  10  |  11      12  |
         |      |      |      |      |  _   |      |      |      |      |      |  [ ARENA ]   |
         |      |      |      |      | |  _ |      |      |  ==  |      |      |              |
         |      |  ==  |   ^^ |   L  | |  | |   H  |      |  ==  |      |   ^^ | F          F |
         |  S   |   j  |j   j |  j  C| j  jF|   V  | jjj  | j~~j | C  (L)|j j j | F jj jjj  FX|
ground:  |######|######|######|######|######|######|######|##~~##|######|######|##############|
```

| Symbol | Meaning |
|---|---|
| `S` | Start (Sammy wakes up) |
| `C` | Checkpoint |
| `X` | Exit / goal (park exit gate) |
| `#` | Solid ground (grass + dirt tiles) |
| `==` | Bench (one-way platform) |
| `\|` and `_` | Lamppost pole and lamp top (one-way platform) |
| `^^` | Rock outcrop (solid, walkable top) |
| `F` | Fence (solid, jump over) / arena walls in the gauntlet |
| `~~` | Hazard: pond water |
| `j` | `enemy-zombie-jogger` |
| `V` | `enemy-zombie-hot-dog-vendor` |
| `H` | `prop-hot-dog-cart` |
| `L` | `item-powerup-trash-lid-shield` (`(L)` = optional, TBD) |

## Extra: screen-by-screen beats (Proposed)

| Screen | Beat | Prompt shown |
|---|---|---|
| 1 | Wake-up intro (amnesia): Sammy lying on the grass, wakes, looks around confused | "Arrows: move · Z: jump" |
| 2 | First zombie; bench platform | "X: tail-whip" |
| 3 | Practice; rock outcrops | — |
| 4 | First power-up; **C1** at the end | — |
| 5 | Verticality: lampposts (one-way tops), fence | — |
| 6 | Interactive prop: hot dog cart + vendor | "Whip the cart!" |
| 7 | Teach Play Possum: 3 joggers in a group | "C: Play Possum — zombies lose track of you" |
| 8 | Hazard: pond edge, bench over the water | — |
| 9 | Breather: **C2**; optional second trash lid (TBD) | — |
| 10 | Mixed fight; rock outcrop, fence | — |
| 11–12 | Gauntlet arena, then the exit gate opens; victory animation; "Level clear" | — |

## Extra: pacing (Proposed, first clear)

| Minutes | What the player is doing |
|---|---|
| 0:00–0:30 | Intro, moving, first jump, first zombie |
| 0:30–1:30 | Tail-whip practice, power-up, checkpoint 1 |
| 1:30–2:30 | Platforms, hot dog cart, Play Possum lesson |
| 2:30–3:30 | Pond hazard, checkpoint 2, mixed fight |
| 3:30–5:00 | Gauntlet and level clear |

## Open questions (TBD is fine)

- Is 12 screens / 3–5 min first clear the right size for a first release? TBD
- End with a gauntlet, or a single mini-boss zombie? TBD
