# Power-up & special ability

Copy to `design/abilities/<ability-id>.md`. If the power-up has pickup artwork, also put an `ASSET.md` beside that art in `assets/items/<asset-id>/`. Leave unknowns as `TBD`; mark undecided ideas as **Proposed**.

## Basics

- Ability ID: TBD (e.g., `ability-<name>` or `item-powerup-<name>`)
- Display name: TBD
- Type: TBD (pickup power-up / innate ability / consumable)
- Status: TBD (idea / proposed / approved)
- One-line description: TBD

## Getting and using it

- How acquired: TBD (start with it / pickup / found in a prop / earned / bought)
- Where it appears: TBD (levels; see `LEVEL.md`)
- Input: TBD (button / hold / combo; keyboard and gamepad)
- Can Sammy use it while: running TBD · jumping TBD · hurt TBD

## Rules

| Rule | Value |
|---|---|
| Effect | TBD |
| Duration | TBD (seconds / number of hits / until hit / permanent) |
| Cooldown | TBD (seconds; none) |
| Uses / charges | TBD |
| Stacking | TBD (refresh timer / add charges / replace other power-up / not allowed) |
| Lost when | TBD (hit / timer ends / level ends / Sammy is defeated) |
| Kept between levels | TBD |

## Interactions

| With | What happens |
|---|---|
| Zombies (each type) | TBD |
| Bosses | TBD |
| Interactive props | TBD |
| Hazards | TBD |
| Other power-ups | TBD |

## Counterplay and limits

- What stops it from being too strong: TBD
- Zombies or situations it does not work on: TBD
- Risk to the player while using it: TBD

## Presentation

- Sammy's visual state while active: TBD (palette swap / overlay sprite on top of Sammy / alternate sprite set)
  - If overlay: either a 48×48 strip aligned to Sammy's cell and pivot (24, 47), or a small sprite plus a per-frame hand point (x, y) — say which. Overlay frame size: TBD
  - If alternate sprite set: which animations need redrawing: TBD
- Pickup sprite: TBD (size, frames, fps)
- HUD icon: TBD (8×8 or 16×16, palette line 0)
- VFX: TBD (start, active, ending-soon warning, end). Hard pixels only — no semi-transparency.
- SFX: TBD (start / loop / hit / end; see `AUDIO.md`)
- Music change: TBD

## Missing art and sound

| Needed | Blocks play? (yes / polish) | Placeholder plan |
|---|---|---|
| TBD | TBD | TBD |

## Notes and open questions

- TBD
