# Ability — Trash Lid Shield (example)
> **EXAMPLE ONLY — planning spec, not approved design.** Don't copy this into design/ until every TBD is filled in.

> **Where the real copy goes:** `design/abilities/item-powerup-trash-lid-shield.md` (per `templates/ABILITY.md`) — **not** `assets/`. Only the art's `ASSET.md` (the example beside this file) goes in `assets/items/item-powerup-trash-lid-shield/`.

Every value here is **Proposed** — an example of how to describe a power-up's behavior. Not approved design. The art is described in the example `ASSET.md` beside this file.

## Basics

- Ability ID: `item-powerup-trash-lid-shield`
- Display name: Trash Lid Shield
- Type: pickup power-up
- Status: proposed
- One-line description: a dented trash can lid that blocks the next 3 zombie hits on Sammy.

## Getting and using it

- How acquired: pickup — walk into the floating lid. Placed by hand in levels (e.g., 1 per level section); never dropped by zombies (TBD).
- Where it appears: `level-01-sheep-meadow` screen 4, optional second lid on screen 9 (TBD) — see the example `LEVEL.md`
- Input: none — it works automatically while held
- Can Sammy use it while: running **yes** · jumping **yes** · hurt **n/a** (it blocks the hit, so Sammy isn't hurt)

## Rules

| Rule | Value |
|---|---|
| Effect | Blocks the next zombie hit on Sammy's front **or** back (Proposed: all directions, for simplicity). A blocked hit does no damage and pushes the zombie back about 16 px. |
| Duration | Until all hits are used. No timer (Proposed). |
| Cooldown | None |
| Uses / charges | **3 hits** |
| Stacking | Does not stack. Grabbing a second lid while holding one refills it to 3 hits. |
| Lost when | All 3 hits are used, Sammy is KO'd, the level ends, or the player restarts from a checkpoint |
| Kept between levels | TBD (suggest no) |

## Interactions

| With | What happens |
|---|---|
| Zombies (each type) | Blocks bites, swipes, and shoulder-bumps from `enemy-zombie-jogger`. Thrown hot dogs from `enemy-zombie-hot-dog-vendor`: TBD (suggest blocked, 1 hit each). A large zombie's attack (64×64 type, if any) uses 2 hits (TBD). |
| Bosses | TBD |
| Interactive props | None — tail-whip still works normally while holding the lid. Does not affect the hot dog cart. |
| Hazards | Does **not** block hazards (pond water, falling objects) — TBD |
| Other power-ups | Play Possum (`ability-play-possum`): Sammy keeps the lid while playing dead; the lid shows lying beside him (TBD). |

## Counterplay and limits

- What stops it from being too strong: one lid at a time, max 3 hits, no refills except another placed lid.
- Zombies or situations it does not work on: hazards; boss attacks TBD.
- Risk to the player while using it: none extra. The lid cannot be thrown or used to attack (could be a later idea).

## Presentation

- Sammy's visual state while active: overlay sprite on top of Sammy.
  - If overlay: this example uses the **small sprite + hand point** option — a 16×16 held-lid overlay (3 frames: intact, dented, cracked) placed at a "hand point" the artist lists per frame (x, y for each frame of idle, run, jump, fall, land, tail-whip). The other option is a 48×48 overlay strip aligned to Sammy's cell and pivot (24, 47). A full second set of Sammy animations holding the lid is not recommended for the first release.
  - If alternate sprite set: not used.
- Pickup sprite: 16×16, 4 frames @ 8 fps, loop (see the example `ASSET.md`)
- HUD icon: 16×16 lid icon beside the health display, palette line 0, with 3 small pips showing hits left; the icon blinks on the last hit
- VFX: start — none; active — none; on block — 2-frame white flash on the lid + 3 tiny spark pixels; ending-soon — icon blinks on the last hit; end — lid break animation, pieces fall off-screen. Flashes are solid-color swaps — no transparency effects.
- SFX: start — `sfx-pickup` (shared); hit — `sfx-shield-block` (metal clang); end — `sfx-shield-break` (clang + rattle). See the example `audio/AUDIO.md`.
- Music change: none

## Missing art and sound

| Needed | Blocks play? (yes / polish) | Placeholder plan |
|---|---|---|
| Pickup strip (4 frames) | yes | Grey 16×16 circle labeled "LID" |
| Held overlay (3 damage stages) + per-frame hand points for Sammy | yes | Grey 16×16 circle drawn at a fixed offset in front of Sammy |
| HUD icon with hit pips | yes | Grey 16×16 box + 3 text pips |
| Break strip (4 frames) | polish | Lid simply disappears |
| `sfx-shield-block`, `sfx-shield-break` | polish | Short beep |

## Notes and open questions

- Block from the front only (more skill) or all directions (simpler)? TBD
- 3 hits feels right for a short level; tune after playtesting. TBD
