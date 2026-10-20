# The zombie roster: four new types, one boss, and where they go

**Status (2026-10-20):** the first draft of the roster, kept for its detail (frame maps, importer commands, the words to ask the image tool for). The consolidated design is `ZOMBIE-ROSTER-AND-BOSSES.md`, which fixes a few things here (the hippie's slow puddle is cut, the sweater never flinches, the cheerleader's tell is 0.45 s on her cheer strip, the litter stands 32 px apart) and carries the owner's answers of 2026-10-20 (types not skins; all four in level 1; keep the jogger; **the baby bleeds red and is sliced like anyone else**, so the "pop, not sliced" suggestion below is superseded; no low-gore work; the Ringmaster is level 2's boss). Where the two pages differ, the consolidated page wins; where that page and the owner differ, the owner wins. Its last three sections (the boss summary, "Skins vs types" and the code map) are dropped here because the consolidated page replaces them. Lines in CAPITALS are the game's own voice (deadpan and profane on purpose, per the owner's rule). Numbers are in the style of `game/src/config.js`.

Sources read: `CLAUDE.md`, `design/GAME_BRIEF.md`, `design/DECISIONS.md` (Stage B, chainsaw, gore), `design/OWNER_DECISIONS.md` (incl. question 22), `design/ART_BRIEFS.md`, `game/src/sim.js`, `config.js`, `level.js`, `assets.js`, `render.js`, your six sheets, and the importer's reports and 4x contact sheets for hippie, cheerleader, baby, sweater and the brute.

---

## The short version

| Type | Job in one line | HP | Speed (walk / chase) | What it does to you | Play Possum | Whip death | Saw death |
|---|---|---|---|---|---|---|---|
| Jogger (exists) | The default: fast and dumb | 2 | 30 / 60 | shoulder-bump | confused, stands still | pop (head off) | sliced |
| Vendor (exists) | Turret: lobs hot dogs | 2 | stays put | thrown hot dog | shrugs, stops throwing | deflate | sliced |
| **Hippie** | Slow wall. Three whips. Leaves a slime puddle that slows you | 3 | 18 / 36 | claw lunge | confused, and ignores Sammy for 3 s after he gets up (he's stoned) | **melt** (new) + puddle | sliced, no puddle |
| **Cheerleader** | The dodge test: crouches, then leaps at you | 2 | 36 / 70 | pom-pom leap, telegraphed 0.3 s | confused, but forgets fast | **burst** (new): pom-poms fly | sliced |
| **Baby** | A litter of three. One whip each, but they keep coming | 1 | 30 / 90 | rattle smack on contact | **ignores it**: toddlers don't know what dead is | pop (rattle flies off) | pop (see the rating note) |
| **Sweater** | The brawler: shoves you across the screen and knocks the lid clean off | 3 | 22 / 50 | two-handed shove | **sniffs**: walks over and stands on top of you | **flop** (new): keels over, slippers fly | sliced |
| **Brute** (boss) | The Bethesda Terrace finale | 16 | 24 / 40 | swipe, ground slam, acid vomit | ignores it | crawl | crawl |
| Ringmaster | Saved for level 2's finale (see "Bosses") | | | | | | |

**Recommendation: distinct types, not skins** (reasons in the last section). **One boss per level: the Brute at Bethesda; the Ringmaster closes level 2.**

---

## How the four fit the game that exists

- All four are **walkers**: they share the jogger's brain (patrol, chase, attack, hit-react, defeat, confused) with a few extra states (the cheerleader's leap, the sweater's sniff, the hippie's puddle, the baby's litter spawn). `CLAUDE.md` already says the third type must bring the `ENEMY_TYPES` table refactor; this roster is designed so that table carries nearly all the difference as numbers, with four small hooks.
- They all use the **jogger's five strips** (walk, attack, hit, defeat, idle). The importer has already cut all four from your sheets as `jogger:*` strips at 48x48 and reports READY on every one. Re-running with `--prefix <type>` (and a different cell for the baby and the sweater, below) gives the real files.
- The whip box sits 10 to 22 px above Sammy's feet and reaches 26 px ahead. The chainsaw cuts a box 28 px ahead, 24 px tall, every 0.12 s. Those two facts drive the hit boxes below.

---

## Hippie: "the slow wall"

**Role:** the first thing that doesn't die in two hits. Slow enough to walk around, tough enough that you learn to count whips. The melt leaves a slime puddle that slows Sammy to half speed, so killing him with the whip has a cost; killing him with the saw does not.

**Config (Proposed):**
```js
hippie: {                  // enemy-zombie-hippie: stoned, rotting, 3 whips
  hp: 3,
  patrolSpeed: 18, chaseSpeed: 36,      // a shamble; Sammy runs at 110
  patrolRange: 48,
  notice: 80,                            // short: he's not paying attention
  giveUpDist: 128, giveUpTime: 2.0,
  attackRange: 26,
  attackTime: 0.4,                       // 4 frames @ 10 fps
  attackHitStart: 0.2, attackHitEnd: 0.3, // hit frame = 2
  attackCooldown: 1.6,
  hitW: 18, hitH: 20,
  bodyW: 20, bodyH: 40,
  hitReactTime: 2 / 12,
  defeatTime: 8 / 12,                    // the melt
  knockback: 60,                         // whip pushes him half as far as a jogger (120)
  puddleW: 32, puddleLife: 6.0,          // slime left where he melted (whip kills only)
  puddleSlow: 0.5,                       // Sammy's run speed while standing in it
  possumIgnore: 3.0,                     // stays off Sammy twice as long as a jogger after Play Possum (1.5)
},
```

**Attack:** a slow claw lunge (the sheet's attack frames). The toxic burp was the other option; the sheet has no burp frames and the lunge frames are the best strip on the sheet, so the lunge wins. (Burp: a 3-frame "cheeks puff, cloud out" strip would be needed; prompt in "Missing frames" if you want it later.)

**Play Possum:** confused like a jogger, but when Sammy gets up the hippie ignores him for 3 s instead of 1.5 s. Reason: a slow tank you can always walk past is the right difficulty for the first new type, and "too stoned to notice" is the joke.

**Deaths:**
- Whip: **melt** (new style). The sheet's defeat is the zombie dissolving into a puddle; the last frame *is* the puddle, and it stays on the ground for 6 s as the slow hazard. Low gore: the puddle is drawn as a grey-brown smear, same size, same slow (the rule doesn't change, only the drawing).
- Chainsaw: **sliced**, like everyone else. No puddle. That's the reward for using the saw on him.
- Slime colour: purple-ish (`#904890` is already in his importer palette), never the reserved ichor green, so it reads as his slime and not as gore.

**Gag lines (melt):** `PEACE. OUT.` · `FAR OUT, MAN.` · `BUMMER.`

**Frame map (48x48 cells, feet point (24, 47), importer scale 0.306 = about 45 px standing):**

| Strip | Game state | Sheet frames (small rows: A = upper, B = lower, numbered as the importer's overlay) | Count @ fps | Length | Notes |
|---|---|---|---|---|---|
| walk | patrol, chase | A1 A2 A3 A4 A3 A2 (4 real, ping-pong) | 6 @ 6 | 1.0 s loop | 6 fps, not 8: it's a shamble. Row B is the same cycle with one bigger heel-kick (B6) if you prefer it |
| attack | attack | A9 A10 A11 A11 (3 real + hold) | 4 @ 10 | 0.4 s | **hit frame 2** (A11, claws forward, widest) |
| hit | hitreact | A15 A16 | 2 @ 12 | 0.17 s | drawn as a white flash |
| defeat | defeat (melt) | A19 A20 A21 B22 B23 B24 B24 B24 (6 real + 2 hold) | 8 @ 12 | 0.67 s | then frame 8 stays as the puddle for `puddleLife` |
| idle | confused, arena drop-in | A25 A26 A27 A26 | 4 @ 6 | 0.67 s loop | barely moves; fine for "stoned" |

Importer: `node tools/import-art.mjs --character <hippie>/map.json --prefix hippie --out <hippie>/out` (the map in `importer-v2/hippie/map.json` already lists these boxes).

---

## Cheerleader: "the dodge test"

**Role:** the first enemy that makes you move. She crouches for 0.3 s (the tell), then leaps about 70 px at you. Jump over her or step back and she lands in front of you, open for a whip. Fast on foot too, so you can't stroll away.

**Config (Proposed):**
```js
cheerleader: {             // enemy-zombie-cheerleader: pom-poms, leaping lunge
  hp: 2,
  patrolSpeed: 36, chaseSpeed: 70,
  patrolRange: 64,
  notice: 112,
  giveUpDist: 160, giveUpTime: 2.0,
  leapRange: 72,                         // starts the leap from this far
  leapWindup: 0.3,                       // the crouch: her only tell. Attack frame 0 held
  leapVx: 170, leapVy: 190,              // about 0.42 s in the air, 20 px high, 72 px long
  leapMaxAir: 0.6,                       // safety: lands by then whatever happens
  leapLand: 0.2,                         // stuck on landing: the punish window
  leapCooldown: 2.0,
  hitW: 18, hitH: 24,                    // hurts while airborne (the whole leap), centred on her body
  bodyW: 16, bodyH: 40,
  hitReactTime: 2 / 12,
  defeatTime: 8 / 12,
  knockback: 120,                        // same as a jogger
  possumIgnore: 0.75,                    // forgets fast: half a jogger's 1.5 s
},
```

**Attack:** `windup` (0.3 s, frame 0) → `leap` (airborne, frames 1 then 2, hurts on touch the whole time) → `land` (0.2 s, frame 3, harmless, whip her now). No contact damage during windup or landing. The states are new, but the body physics already exist (`moveBody` handles enemy gravity for the arena drop-in).

**Play Possum:** confused like a jogger (she cheers in place: the idle frames are a cheer stance), but only 0.75 s of ignoring Sammy afterwards. Reason: she's the "keep moving" enemy; Play Possum should buy a breath, not a free kill.

**Deaths:**
- Whip: **burst** (new style, from the sheet): she comes apart into the slime splash. Code throws out **two pom-poms and the hair bow** as bits (like the jogger's head today), because the importer trims anything flying outside the cell.
- Chainsaw: **sliced**.

**Gag lines (burst):** `GO TEAM. DEAD.` · `RAH RAH. SHIT.` · `SPIRIT: ZERO.`

**Frame map (48x48, feet (24, 47), importer scale 0.278 = about 44 px):**

| Strip | Game state | Sheet frames | Count @ fps | Length | Notes |
|---|---|---|---|---|---|
| walk | patrol, chase | A1 A2 A3 A4 A3 A2 (4 real) | 6 @ 8 | 0.75 s loop | a bouncy skip; 8 fps suits it |
| attack | windup / leap / land | A9 (crouch, pom-poms back) · A10 (launch) · A11 (reaching, airborne) · A12 (small recover) | 4, **picked by state**, not by a clock | | frame 0 = windup, 1 = rising, 2 = falling (hurts), 3 = land. Loop mode `frame` (like `overlay:lid`) so the timing test does not apply |
| hit | hitreact | A17 A19 | 2 @ 12 | 0.17 s | |
| defeat | defeat (burst) | A23 A24 A25 B26 B27 B28 B28 B28 (6 real + 2 hold) | 8 @ 12 | 0.67 s | plus the pom-pom/bow bits in code |
| idle | confused, drop-in | A29 A30 A31 A30 | 4 @ 6 | 0.67 s loop | |

Check facing on the 4x preview: the importer could not tell which way her walk faces. The game draws right-facing art and flips it; add `--flip` if she looks left.

---

## Baby: "the litter"

**Role:** three at a time, one hit each, faster than a jogger. The pressure is numbers and speed, not toughness. The whip takes one per swing (sometimes two); the chainsaw sweeps all three in a third of a second. Also the one enemy that Play Possum does nothing about.

**Config (Proposed):**
```js
baby: {                    // enemy-zombie-baby: exposed brain, eyeball on a stalk, rattle. Comes in threes
  hp: 1,
  patrolSpeed: 30, chaseSpeed: 90,       // faster than a jogger (60), slower than Sammy (110)
  patrolRange: 40,
  notice: 128,
  giveUpDist: 200, giveUpTime: 3.0,      // tenacious
  attackRange: 18,
  attackTime: 4 / 12,                    // rattle smack
  attackHitStart: 2 / 12, attackHitEnd: 3 / 12, // hit frame = 2
  attackCooldown: 0.8,
  hitW: 12, hitH: 14, hitY: 16,          // the rattle box starts 16 px above its feet (the jogger's is hard-coded at 26: too high for a toddler)
  bodyW: 12, bodyH: 20,                  // 30 px sprite, 20 px body: the whip (10..22 px up) still overlaps the top 10 px
  hitReactTime: 2 / 12,                  // never seen in play (1 hp), kept for the manifest check
  defeatTime: 8 / 12,
  knockback: 0,
  litter: 3, litterGap: 24,              // level entries and wave entries spawn three, 24 px apart
  possum: 'ignore',                      // never confused; keeps coming
},
```

**Honest note on "low hitbox":** the whip box runs from 10 to 22 px above Sammy's feet. Anything 11 px or taller standing on the ground is whippable, so a 20 px baby is hit by a normal standing whip. A baby that is truly *under* the whip would need a crawl pose (body 10 px or less), which is not on the sheet (it toddles upright in every frame), plus a low whip for Sammy, which is new Sammy art and a new input. Not for level 1. The timing pressure comes from spacing instead: at 90 px/s and 24 px apart they arrive one every 0.27 s, exactly one whip's length (4 frames @ 15 fps), so each swing gets one baby and a missed swing costs a hit. The whip box is 20 px wide, so when they bunch up a swing takes two. The chainsaw box (28 px) sweeps the whole litter.

**Play Possum:** exempt from the confusion flag entirely; they keep coming. Per owner question 10, a bump while lying down still hurts, so Play Possum next to a litter is a mistake the game lets you make once. That gives the ability a counter without making it useless (nothing else counters it).

**Deaths:**
- Whip: **pop** (existing style), with code bits: the **rattle, the bonnet and the eyeball** fly off.
- Chainsaw: **Proposed: pop as well, not sliced.** A chainsawed toddler is the one picture on this page that could move the game's rating or get it refused by a store; it also wouldn't read at 30 px. One line in `damageEnemy` (`type.sawStyle || 'sliced'`). **Your call** (owner question 1 territory); the gorier option is one word.

**Gag lines (baby):** `NAP TIME.` · `LITTLE SHIT.` · `GOO GOO. GONE.`
(Today `render.js` keys gag lines by defeat style. The baby shares `pop` with the jogger, so the table should be keyed by **type first, then style**; a small change.)

**Frame map (32x32 cells, feet (16, 31), import at about 30 px standing = scale about 0.21):**

Why 32x32: the importer's shared scale made the baby 45 px tall, the same as the hippie, so it reads as an adult. A toddler should be about two thirds of Sammy (42 px) → 28 to 30 px. At that scale the widest frame (A11, 123 picture px) is 26 px and the tallest (A18, 157 px) is 33 px (the importer shrinks that one hit frame by a few percent, as it already does). 32x32 fits with 1 px to spare and keeps the file small. **Risk:** the eyeball on its stalk, the exposed brain and the rattle may turn to mush at 30 px; check the 4x preview. Fallback: 40x40 at about 36 px tall.

| Strip | Game state | Sheet frames | Count @ fps | Length | Notes |
|---|---|---|---|---|---|
| walk | patrol, chase | A1 A2 A3 A4 A3 A2 (4 real) | 6 @ 10 | 0.6 s loop | fast toddle |
| attack | attack | A9 A10 A11 A11 (3 real + hold) | 4 @ 12 | 0.33 s | **hit frame 2** (A11, rattle up) |
| hit | hitreact | A15 A18 | 2 @ 12 | 0.17 s | the sliced pose also uses frame 0 of this strip if the saw style stays `sliced` |
| defeat | defeat (pop) | A23 A24 A25 B26 B27 B28 B28 B28 (6 real + 2 hold) | 8 @ 12 | 0.67 s | plus rattle/bonnet/eyeball bits in code |
| idle | arena drop-in (never confused) | A29 A30 A31 A30 | 4 @ 6 | 0.67 s loop | |

Importer: `node tools/import-art.mjs --character <baby>/map.json --prefix baby --size 32x32 --height 30 --out <baby>/out` (`--prefix`, `--size WxH` and `--height` are all real character-mode flags; `--scale 0.21` is the exact-scale alternative).

---

## Sweater: "the brawler"

**Role:** the big one. Takes three whips, doesn't flinch, and his shove throws Sammy twice as far as a jogger's bump and **knocks the trash lid clean off** (all three charges, in one go). He's placed right after the second lid, so the joke lands.

**Config (Proposed):**
```js
sweater: {                 // enemy-zombie-sweater: loud zigzag sweater, bunny slippers, rubber duck. Shoves
  hp: 3,
  patrolSpeed: 22, chaseSpeed: 50,
  patrolRange: 48,
  notice: 100,
  giveUpDist: 144, giveUpTime: 2.5,
  attackRange: 32,
  attackTime: 4 / 8,                     // 4 frames @ 8 fps: a slow, heavy shove
  attackHitStart: 2 / 8, attackHitEnd: 3 / 8, // hit frame = 2
  attackCooldown: 1.5,
  hitW: 24, hitH: 26, hitY: 36,          // the shove box starts 36 px up: his arms are higher than a jogger's
  bodyW: 24, bodyH: 48,
  hitReactTime: 2 / 12,
  defeatTime: 8 / 10,                    // the flop: 8 real frames, slower
  knockback: 0,                          // the whip doesn't move him
  shoveKnockX: 240, shoveKnockY: 150,    // Sammy's hurtKnockX is 120: twice as far
  stripsLid: true,                       // a shove takes every lid charge, not one
  sniffStop: 32,                         // Play Possum: walks up and stops this far from Sammy
},
```

**Attack:** a two-handed shove (the sheet's attack frames are exactly that: a lumbering reach with both arms). If the lid blocks it, the lid is gone (`sfx-shield-break`) and Sammy is still thrown back, no heart lost. Unblocked: one heart and the big throw. Bear-hug was the other idea; it needs a hold state, "Sammy held" art for Sammy himself and a mash-out input, so: shove now, hug never (or much later).

**Play Possum: sniffs.** He's fooled, but instead of standing where he is, he shambles over at patrol speed and stops 32 px from Sammy, facing him, in his idle. When Sammy gets up, the usual 1.5 s grace applies, so you stand up under a 3-hp brawler with a second and a half to get clear. (32 px keeps his 24 px body off Sammy's 28 px lying body, so the sniff never bumps him.)

**Deaths:**
- Whip: **flop** (new style, from the sheet): reels, topples backwards, lands in a heap. Code bits: **both bunny slippers and the rubber duck** fly off (they're outside the cell on the sheet, so they can't be in the strip).
- Chainsaw: **sliced**. The biggest body in the level cut in half is the saw's best moment before the boss.

**Gag lines (flop):** `BUNNY DOWN.` · `FASHION VICTIM.` · `NICE SWEATER.`

**Frame map (64x56 cells, feet (32, 55), import at about 52 px standing = scale about 0.35):**

Why 64x56: at the importer's shared scale he is 44 px tall, no bigger than the hippie, and "big" has to be visible, not written in a doc. Sammy stands 42 px; the joggers 44 to 46; the sweater should loom at about 52. The widest defeat frame (B29, 141 picture px) is 49 px at that scale, so 48 px wide clips it: 64 wide. Two defeat frames (A24, B28, 193 px tall: slippers in the air above him) are 67 px, taller than 56, so the importer trims the loose slippers (they become code bits anyway) or shrinks those two frames a little, which it already does. 56 tall (not 48) is the whole point.

| Strip | Game state | Sheet frames | Count @ fps | Length | Notes |
|---|---|---|---|---|---|
| walk | patrol, chase | A1 A2 A3 A4 A3 A2 (4 real) | 6 @ 6 | 1.0 s loop | a plod; row B has the same with a wider stride if preferred |
| attack | attack (shove) | A9 A10 A12 A13 (the importer skipped A11) | 4 @ 8 | 0.5 s | **hit frame 2** (A12, both arms out, widest) |
| hit | hitreact | A19 A20 | 2 @ 12 | 0.17 s | no knockback |
| defeat | defeat (flop) | A23 A24 A25 A26 B27 B28 B29 B30 (all 8 real) | 8 @ 10 | 0.8 s | plus slippers/duck bits in code |
| idle | sniff, drop-in | A31 A32 A33 A32 | 4 @ 6 | 0.67 s loop | |

Importer: `node tools/import-art.mjs --character <sweater>/map.json --prefix sweater --size 64x56 --height 52 --out <sweater>/out`.

---

## Play Possum, side by side

| Type | Reaction | Why |
|---|---|---|
| Jogger | confused, stands still, ignores Sammy 1.5 s after | the baseline |
| Vendor | shrugs, stops throwing | the baseline |
| Hippie | confused, ignores Sammy **3.0 s** after | he's slow anyway; make the ability generous on the tank, and he's stoned |
| Cheerleader | confused, ignores Sammy **0.75 s** after | buys a breath, not a kill; she's the "keep moving" enemy |
| Baby | **never fooled, keeps coming** | the ability's one counter; bumps hurt while lying down (owner Q10), so it stings once |
| Sweater | **sniffs:** walks to 32 px, stands over Sammy, 1.5 s after | tension: you get up under the big one |
| Brute | ignores it | bosses don't fall for it; also he never leaves the arena |

Code: today `startPossum` flags every enemy within 96 px as `confused` and `releaseConfused` grants `ignoreAfter`. The table needs per-type `possum: 'confused' | 'shrug' | 'sniff' | 'ignore'` and `possumIgnore` seconds.

---

## Missing from the sheets (and the exact words to ask for)

All four sheets are complete for the five basic strips. What's missing is only for the extras above. Paste the character's locked description, then the animation line, then the usual rules block from `design/ART_PROMPTS.md` (magenta background, facing right, same scale, 1 px dark outline, about 12 colours, 3-step shading, no particles outside the body).

**Locked descriptions (short, so every extra frame matches the sheet):**
- Hippie: "A rotting zombie hippie: long grey dreadlocks under a tie-dye headband, torn purple vest over a cream peace-sign shirt, ripped grey-blue jeans, red sneakers, grey-teal skin, glowing pale eyes, purple slime dripping from the mouth."
- Cheerleader: "A zombie cheerleader: blonde pigtails with a red bow, torn red and white cheer top and pleated skirt, red pom-poms in both hands, red high-top sneakers, grey-teal skin, glowing pale eyes."
- Baby: "A zombie toddler: frilly bonnet with a blue bow, exposed pink brain on top of the head, one eyeball hanging out on a stalk, duck-print bib, nappy, pink bunny slippers, a rattle in one hand, grey-teal skin."
- Sweater: "A big heavy zombie in a loud zigzag sweater (orange, purple, teal), a rubber duck on a chain round his neck, torn purple trousers, pink bunny slippers, exposed pink brain, one eyeball hanging out, grey-teal skin, wide grin."

| For | What's missing | Animation line to paste |
|---|---|---|
| Cheerleader leap | an airborne tuck and a landing | "**Leap, 3 frames:** 1 deep crouch, pom-poms pulled back, knees bent. 2 **in the air**, body horizontal, both pom-poms thrust forward, legs trailing behind, clearly off the ground. 3 landing: both feet down, knees bent deep, pom-poms down at her sides, head low. Same scale as the walk." (Use 1 and 2 to replace the sheet's A9/A11 if the sheet's frames read as a run rather than a jump on the 4x preview; the current frames only leave the ground by 2 px.) |
| Sweater bear-hug (only if you want it later) | a grab pose and a held pose | "**Bear hug, 3 frames:** 1 both arms wide open, leaning forward. 2 arms closed in front of the chest as if crushing something, cheeks puffed. 3 arms open again, shoving forward." Plus Sammy: "**Held, 2 frames:** the opossum squeezed sideways, legs kicking, tail thrashing." Not recommended for level 1. |
| Hippie burp (only if you want it instead of the lunge) | a 3-frame burp | "**Toxic burp, 3 frames:** 1 cheeks puffed, eyes bulging. 2 mouth wide, a thick cloud of purple gas leaving it, attached to the face. 3 slumped, mouth open, a last wisp." Plus a separate 3-frame purple gas cloud, 32x32, no figure. |
| Baby crawl (only if you want a true under-the-whip baby) | a crawl cycle | "**Crawl, 4 frames:** on all fours, head up, rattle still in one hand, body no taller than half the standing height. 1 right arm forward. 2 both arms down, body low. 3 left arm forward. 4 both arms down." (Needs a low whip for Sammy too. Not recommended.) |
| All four | nothing else | the flying props (rattle, bonnet, eyeball, pom-poms, bow, slippers, duck) are drawn by the game as bits, the way the jogger's head is today, so they do not need frames. If you'd rather have them as pictures: one 16x16 picture each, "**Prop, 1 frame, 16x16:** a red pom-pom" and so on. |

Reminder from the importer reports, for the next sheet you make: ask for chunky pixel art at about 3x, a 1 px dark outline, about 12 colours, no particles outside the body, grey-teal skin and purple slime (not acid green or blood red: the game keeps those for gore). All four current sheets needed the importer to fix those; it did, and they're READY.

---

## Level 1 placement (Proposed)

Today: 15 enemies (14 joggers, 1 vendor). Proposed: **17 bodies, 7 of them joggers**, same screens, same feel for the first two screens so the tutorial prompts still make sense. Three of the 17 are babies with 1 hp each, so it is only a little tougher than today in hit points (35 hp vs 30); the difficulty comes from the mix, not the count.

```js
enemies: [
  { type: 'jogger', x: 540 },                                           // screen 2: first zombie, under the whip prompt (unchanged)
  { type: 'jogger', x: 780 }, { type: 'hippie', x: 940 },               // screen 3: first hippie, by the second rock. Three whips. Learn it here
  { type: 'jogger', x: 1180 },                                          // screen 4: guards the lid (unchanged)
  { type: 'cheerleader', x: 1420 }, { type: 'jogger', x: 1540 },        // screen 5: first leap, between the two lamps (jump up onto one to dodge her)
  { type: 'vendor', x: 1800 },                                          // screen 6: behind the cart (unchanged)
  { type: 'jogger', x: 2080 }, { type: 'jogger', x: 2112 }, { type: 'hippie', x: 2150 }, // screen 7: the Play Possum demo clump; the hippie stays fooled longest
  { type: 'jogger', x: 2290 },                                          // screen 8: pond edge (the far-bank jogger is dropped; the pond is the hazard)
  { type: 'sweater', x: 2720 },                                         // screen 9: right after checkpoint 2, standing on the second lid. He knocks it off. Met with the whip
  { type: 'baby', x: 3010 }, { type: 'baby', x: 3034 }, { type: 'baby', x: 3058 }, // screen 10: the litter, penned between the rock (2960) and the fence (3100)
  { type: 'cheerleader', x: 3160 },                                     // screen 10: penned between the two fences
  { type: 'hippie', x: 3440 },                                          // screen 11: after the chainsaw (3300): your first saw victim, 3 hp, 0.36 s of revving
],
```

Why this order: one new idea per screen, each introduced alone, then mixed. Screen 3 teaches "count whips". Screen 5 teaches "move". Screen 7 keeps the Play Possum tutorial on enemies that fall for it (the litter does **not** go here: putting the one Play-Possum-proof enemy right after the "PLAY DEAD" prompt would teach the wrong lesson). Screen 9's sweater is the mid-level spike, after a checkpoint. Screen 10 is the exam: a litter, then a leaper, before the saw. Screen 11's hippie is the saw's demo dummy. Nothing new goes near the pond (enemies that fall below y 260 just vanish; a leaper over water would be wasted).

Prompt to add (screen 9, x 2660 to 2760): `BIG LAD. HE WANTS YOUR LID.` Optional, 27 characters, fits.

### Gauntlet waves (Bethesda Terrace)

Today: `waves: [2, 3, 4]`, all joggers, 9 bodies, 18 hp. Proposed, typed:

```js
gauntlet: {
  waves: [
    ['jogger', 'jogger', 'cheerleader'],                 // 1: warm-up with a leaper. 3 bodies, 6 hp
    ['baby*3', 'hippie', 'jogger'],                      // 2: the litter from the left (one entry spawns three), the tank and a jogger from the right. 5 bodies, 8 hp
    ['sweater', 'sweater', 'cheerleader', 'jogger'],     // 3: two brawlers. 4 bodies, 10 hp
  ],
  waveDelay: 1.0,
},
```

12 bodies, 24 hp, versus 9 and 18 today. This is how the fight gets "bigger" without a crowd: mixing types makes it harder than adding joggers. It fits either answer to owner question 22: with option A (less fuel) it's a real fight with the saw running dry around wave 3; with option B (keep the fuel) it's the power-fantasy fight as planned, and the Brute after it is the tension. `spawnWave` alternates sides today; a wave entry like `'baby*3'` spawns the litter from one side, 24 px apart.

---

