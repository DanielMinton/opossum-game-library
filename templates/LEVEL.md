# Level design

Copy to `design/levels/<level-id>.md` (e.g., `level-01-sheep-meadow.md`). Leave unknowns as `TBD`. Mark ideas that are not decided as **Proposed**.

## Overview

- Level ID: TBD (e.g., `level-01-<place>`)
- Display name: TBD
- Location: TBD
- Order in game: TBD (first / second / …)
- Story beat: TBD (what happens to Sammy here)
- Length in screens: TBD (1 screen = 320 px wide; 224 px tall)
- Scroll direction: TBD (left→right / vertical / mixed)
- Target play time: TBD (first clear / speedrun)
- Difficulty: TBD (1–5)
- Status: TBD (idea / proposed / approved)

## Look and sound

- Tileset: TBD (asset ID)
- Palette lines used: TBD (see `STYLE_GUIDE.md`)
- Music: TBD (asset ID; loop points in its `AUDIO.md`)
- Ambient sounds: TBD

| Parallax layer (far → near) | Asset ID / file | Scroll speed | Notes |
|---|---|---|---|
| Sky | TBD | TBD | TBD |
| Far | TBD | TBD | TBD |
| Mid | TBD | TBD | TBD |
| Near / foreground | TBD | 100% | TBD |

## Flow

- Start point: TBD (screen #, x/y in px, how Sammy enters)
- Goal / exit: TBD (what ends the level and where)

| Checkpoint | Location (screen # / x px) | What it looks like | Restores health? |
|---|---|---|---|
| TBD | TBD | TBD | TBD |

## Enemies

| Enemy ID | Count | Placement (screen # / x px) | Behavior here | Notes |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

## Interactive props

| Prop ID | Count | Placement | What it does (see its `INTERACTION.md`) |
|---|---|---|---|
| TBD | TBD | TBD | TBD |

## Power-ups and pickups

| Item / ability ID | Count | Placement | Hidden or visible | Notes (see `ABILITY.md`) |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

## Hazards

| Hazard | Placement | Effect on Sammy | Effect on zombies | Art needed |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

## Secrets

| Secret | How to find it | Reward |
|---|---|---|
| TBD | TBD | TBD |

## Failure and recovery

- How Sammy gets hurt: TBD
- Health / lives: TBD
- What happens on defeat: TBD (KO animation, restart at checkpoint, lives lost)
- Pits or instant-fail spots: TBD
- What resets on respawn (enemies, items, props): TBD
- Game over / continue rules: TBD

## Boss or gauntlet (optional)

- Type: TBD (boss / enemy gauntlet / none)
- Enemy or boss ID: TBD
- Arena size: TBD (screens)
- Pattern / phases: TBD
- How to win: TBD
- Reward: TBD

## Nostalgic nod

- Nod: TBD
- What is borrowed (feel / structure / humor only): TBD
- What is original: TBD
- Reference screenshots (reference-only, in `assets/references/`): TBD

## Missing assets

| Asset | Blocks play? (yes / polish) | Placeholder plan |
|---|---|---|
| TBD | TBD | TBD |

## ASCII map

One character per 16×16 metatile is suggested; say if you use a different scale. 1 screen = 20 metatiles wide × 14 tall.

```text
TBD — draw the level here. Example shape only:

                                         E
  S        Z      P          ?      ZZ  ===     C          X
#######  #####  ######   #######~~~########  ##########  #####
```

| Symbol | Meaning |
|---|---|
| `S` | Start |
| `C` | Checkpoint |
| `X` | Exit / goal |
| `#` | Solid ground |
| `=` | One-way platform |
| `~` | Hazard (TBD type) |
| (space under ground row) | Pit |
| `Z` | Zombie (say which type in the enemy table) |
| `B` | Boss |
| `P` | Interactive prop |
| `E` | Power-up / item |
| `?` | Secret |
| TBD | TBD |
