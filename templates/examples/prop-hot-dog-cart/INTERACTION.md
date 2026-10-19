# Interactive asset states — Hot dog cart (example)
> **EXAMPLE ONLY — planning spec, not a finished asset.** Run the scanner to see which files exist. Don't copy this into assets/ until every TBD is filled in.

All behavior below is **Proposed** — an example of how to describe an interactive prop. Not approved design.

- Asset ID: prop-hot-dog-cart
- Initial state: upright

| State | Visual file / animation | Collision | What the player can do |
|---|---|---|---|
| upright | `hot-dog-cart-upright-v01.png` (planned — not yet supplied) | Solid body; umbrella top is a one-way platform | Tail-whip it; stand on the umbrella |
| rocking | `hot-dog-cart-rocking-strip-v01.png` (planned — not yet supplied), 3 frames @ 12 fps, loop | Solid body; umbrella not standable while rocking | Tail-whip again to tip it; or wait and it settles |
| tipping (short transition) | `hot-dog-cart-tipping-strip-v01.png` (planned — not yet supplied), 3 frames @ 12 fps, one-shot | No collision while falling | Nothing — watch it fall |
| tipped-over | `hot-dog-cart-tipped-over-v01.png` (planned — not yet supplied) | Low solid block, 16 px tall | Hop over it; collect spilled hot dogs |
| empty | `hot-dog-cart-empty-v01.png` (planned — not yet supplied) | Low solid block, 16 px tall | Nothing — scenery from now on |

## Transitions

| From | Trigger / input | Condition | To | Gameplay effect | Sound / feedback |
|---|---|---|---|---|---|
| upright | Sammy tail-whip hits cart (hit frame 2) | Sammy is within whip range (about 24 px) | rocking | None yet — it's a warning wobble | cart-rock creak; 2-frame white flash on cart |
| rocking | 1.5 s pass with no hit | — | upright | Resets | small settle clunk |
| rocking | Sammy tail-whip hits cart again | Within 1.5 s of the first hit | tipping | Cart falls away from Sammy | cart-crash clang + screen shake 2 px for 0.2 s |
| tipping | Tipping animation ends | — | tipped-over | Spills 3 hot dog pickups in an arc; zombies within 48 px are knocked back (damage TBD: 0 or 1) | hot dog splat; dust puff VFX |
| tipped-over | All 3 hot dogs collected **or** 10 s pass (uncollected ones blink, then vanish) | — | empty | Each hot dog collected heals Sammy 1 HP | shared pickup SFX per hot dog |
| upright / rocking | Zombie attack hits cart | TBD — do zombies affect props? | TBD | TBD | TBD |

## Rules
- Can the transition be reversed? **Proposed:** only rocking → upright (if Sammy stops hitting). Once tipped, it stays tipped.
- Is the object consumed, reset, or persistent? **Proposed:** consumed for the rest of the level. Restarting from a checkpoint before the cart resets it to upright.
- What happens if interaction repeats or is interrupted? Extra hits while tipping/tipped/empty do nothing (no sound, no score). If Sammy is hurt mid-whip, the hit doesn't count.
- Interaction distance / input: tail-whip attack button (proposed); the whip's hitbox must touch the cart's body box.
- Missing visuals and acceptable placeholders: all missing. Acceptable placeholders: colored rectangles labeled with the state name; a 16×16 yellow box for each hot dog. Placeholders must be clearly marked and never shipped.

## Open questions (answer if you know; TBD is fine)
- Should the hot-dog-vendor zombie (`enemy-zombie-hot-dog-vendor`) guard this cart, or are they unrelated? TBD
- Does the spill damage zombies, or only push them back? TBD
- One-hit tip for faster pacing instead of two? TBD
