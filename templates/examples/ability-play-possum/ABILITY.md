# Ability — Play Possum (example)
> **EXAMPLE ONLY — not a real asset. No files listed here exist yet.** Copy into assets/<category>/<asset-id>/ and replace with your real details.

> **Where the real copy goes:** `design/abilities/ability-play-possum.md` (per `templates/ABILITY.md`) — **not** `assets/`. Ability docs describe rules, not artwork.

**Proposed signature ability — not approved.** It fits the user's opossum hero and echoes the play-dead idea in the brief's earlier starting concept, but it still needs the creator's yes. All values are examples.

## Basics

- Ability ID: `ability-play-possum`
- Display name: Play Possum
- Type: innate ability
- Status: proposed
- One-line description: Sammy drops and plays dead, and nearby zombies lose track of him for a short time.

## Getting and using it

- How acquired: start with it — available from the start of level 1. The first use is taught by an on-screen prompt in `level-01-sheep-meadow` (Example).
- Where it appears: every level (Proposed)
- Input: Proposed: a dedicated button (keyboard **C**; gamepad face button 3) — a nod to 3-button controllers. Keyboard Z = jump, X = tail-whip (Proposed).
- Can Sammy use it while: running **yes** (he stops and drops) · jumping **no** (grounded only) · hurt **no** (wait until the hurt animation ends)

## Rules

| Rule | Value |
|---|---|
| Effect | Sammy drops and plays dead. Zombies within **96 px** lose track of him: they stop, sniff around, then wander away in their current direction. Zombies already mid-attack finish their swing (it can still hit). |
| Duration | Up to **3 s**. Sammy can cancel by pressing any button after a minimum of **0.5 s**. |
| Cooldown | **6 s**, starting after Sammy gets back up |
| Uses / charges | Unlimited — limited only by the cooldown |
| Stacking | Not allowed — can't be used again until the cooldown ends |
| Lost when | Never lost (innate). If Sammy is defeated, the cooldown resets (TBD). |
| Kept between levels | Yes |

## Interactions

| With | What happens |
|---|---|
| Zombies (each type) | `enemy-zombie-jogger`: stops chasing, jogs in place confused ("?" bubble) for the rest of the ability, then returns to patrol. `enemy-zombie-hot-dog-vendor`: stops throwing and shrugs until the ability ends — only if Sammy is within the 96 px radius. |
| Bosses | TBD — suggest immune, so the end-of-level gauntlet or boss can't be skipped |
| Interactive props | None. Sammy cannot play dead while standing on the cart's umbrella (TBD). |
| Hazards | Doesn't work in the pond water hazard. Hazards still hurt Sammy while he plays dead. |
| Other power-ups | Can be used while holding the Trash Lid Shield (`item-powerup-trash-lid-shield`); the lid is kept. |

## Counterplay and limits

- What stops it from being too strong: the 6 s cooldown; Sammy can't move or attack while playing dead; it doesn't heal.
- Zombies or situations it does not work on: bosses (TBD), mid-air, pond water.
- Risk to the player while using it: zombies farther than 96 px when he drops are still tracking him and can walk into him (normal damage); a zombie already mid-swing can still hit.

## Presentation

- Sammy's visual state while active: alternate animation — uses `character-sammy` **play-dead**: 4 frames @ 8 fps, one-shot, then hold the last frame (tongue out, eyes X'd — comedic). Getting up: play-dead frames reversed (Proposed, saves art). Feet/body stay on baseline row 47.
  - If overlay: not used.
  - If alternate sprite set: only the play-dead strip (already in Sammy's animation list).
- Pickup sprite: none (innate ability)
- HUD icon: 16×16 possum-face icon, palette line 0. Greyed out with a filling bar during cooldown; flashes when ready.
- VFX: start — small "?" pixel balloon over each zombie that lost track; active — "Z z" or stink-lines over Sammy; ending-soon — TBD; end — icon flash when ready again. Solid pixels only, no transparency.
- SFX: start — `sfx-play-dead` (comic "thud + wheeze"); zombies — optional "huh?" variation of `sfx-zombie-groan`; loop / end — none (TBD). See the example `audio/AUDIO.md`.
- Music change: none. An optional muffled music variant is polish (TBD).

## Missing art and sound

| Needed | Blocks play? (yes / polish) | Placeholder plan |
|---|---|---|
| Sammy play-dead strip (4 frames) | yes — a placeholder can stand in until the real art (checklist Tier 2, row 2.1) | Sammy's idle frame flipped upside down, labeled "PLAY DEAD" |
| HUD icon + cooldown bar | yes (the player must see when it's ready) | Grey 16×16 box with "PP" and a plain bar |
| "?" balloon over zombies (8×8 or 16×16) | polish | Text "?" drawn in the HUD font |
| Stink-lines / "Z z" over Sammy (8×8) | polish | None |
| `sfx-play-dead` | polish | Short beep |

## Notes and open questions

- Is "Play Possum" the signature mechanic you want? TBD
- Button, or hold Down for 0.3 s? TBD
