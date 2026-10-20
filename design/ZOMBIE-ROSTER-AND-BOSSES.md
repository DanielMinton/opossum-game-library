# Zombie roster and bosses: the consolidated design

**Status (2026-10-20):** this is the design the roster work is built from. It was written before the owner answered, so **where the owner's answers below differ, the answers win**; the lines they overrule are marked *(superseded)* in place and kept for history. Everything not marked Confirmed is still Proposed (not approved). It replaces the two drafts beside it (`ROSTER.md`, `BOSSES.md`): it keeps what was good in them, fixes what was wrong, and cuts what a solo owner plus Claude should not build first. Lines in CAPITALS are the game's own voice (deadpan and profane on purpose, owner rule). Numbers are in the style of `game/src/config.js`. Step 1 of the plan (section 5) is done; see `DECISIONS.md`, "2026-10-20: Zombie roster and the Brute".

> **The owner's answers (Confirmed 2026-10-20; full wording in `OWNER_DECISIONS.md`, questions 23 to 30):**
> 1. **Distinct types** on one shared walker brain, built in the order hippie, sweater, cheerleader, baby.
> 2. **All four types go in level 1**, each in a contrasting colour scheme (real art is being made separately; the coded placeholders must also use contrasting colours).
> 3. **Keep the jogger** (about 7 placements instead of 14).
> 4. **The Brute comes after the final gauntlet wave, before the exit.** Right before him Sammy gets a power-up (a trash lid or a hot dog cache: the builder picks, marked Proposed) **and** the chainsaw: today's pickup at x 3300 stays, and a second pickup or a refuel appears inside the arena when the boss starts, so he always has a saw for the boss.
> 5. **The Ringmaster goes to level 2.** Not built now; notes only.
> 6. **No low-gore work.** The game is full gore. The existing G toggle stays as it is and is not extended.
> 7. **The chainsaw cuts the Brute any time** ("gore overload"): balanced with hit points and staggers, with the most blood, chunks and hit-stop on saw hits. *(Overrules "cuts only land while he is open" below.)*
> 8. **The baby gets no guard rails:** red gore, sliced like anyone else. *(Overrules the "never red, never sliced" lines below.)*

Sources: `CLAUDE.md`, `design/GAME_BRIEF.md`, `design/DECISIONS.md` ("Current state", Stage B chainsaw and gore), `design/OWNER_DECISIONS.md` (questions 1, 10, 16, 22), `design/ART_BRIEFS.md` (zombie sections), `game/src/sim.js` (every enemy branch, line numbers below are from today's file), `config.js`, `level.js`, `assets.js`, `render.js`, `main.js`, `bot.js`, the six sheets, and the importer's five character reports.

---

## 0. The short version

| Decision | Taken here | Why (one line) |
|---|---|---|
| Skins or types | **Types.** One brain ("walker") with numbers per type and three small hooks | the table refactor is owed anyway; four costumes with one brain wastes the sheets |
| Build order | hippie → sweater → cheerleader → baby (baby behind an owner gate) | cheapest and most readable first; the baby carries a rating risk |
| Bosses in level 1 | **Both, but the Brute's machinery first** (step 4a), the Ringmaster as the mid-level fight only if the owner says so (step 4b) | the Brute reuses the arena, gate, waves and music that exist; the Ringmaster needs a rope lock and hasn't been through the importer |
| Gauntlet | **2 typed waves, then the Brute** (not 3 waves plus a boss) | 3 waves plus a 24-hp boss is 2 to 3 minutes of terrace |
| Chainsaw on a boss | *(superseded by owner answer 7: the saw cuts him **any time**, balanced with hp and staggers, with the most gore on saw hits)* ~~cuts only land while he is **open** (opening, stuck, dizzy, staggered); otherwise sparks and `CLANG.`~~ The whip always lands | ~~stops the "stand inside him and rev" win (maths in 4.5)~~ the owner wants the saw to be the Brute's "gore overload" moment |
| Play Possum on bosses | works: confused until Sammy gets up, then 1.5 s of grace, same as a jogger | an 80 px boss can't be jumped; this is the only way past him |
| Hippie puddle | **cut from the first version** (a drawn pool only, no slow) | a slow-zone is unreadable at 320x224 next to the cosmetic puddles already on the ground; the hazard list arrives with the bosses anyway |
| Sweater | **never flinches** (white flash, keeps coming); the whip still hurts him | as written he was stun-locked by three fast whips, same as a jogger; this is also the rehearsal for the boss rule |
| Cheerleader tell | 0.45 s, drawn with her **cheer (idle) strip** | the sheet has no crouch; "she does a cheer, then she jumps you" reads at 48 px |
| Baby litter | three placed entries in the level, `'baby*3'` only in waves; 32 px apart | one whip per baby needs a little slack, and owner question 16 (early whip presses) matters here |
| Chainsaw fuel (#22) | keep 20 s, **carry drain 0.25 → 0.1** | with 0.25, a careful player runs dry inside the Brute fight even revving only in openings (4.5) |

---

## 1. Critique of the two drafts

### 1.1 Fun and readability at 320x224

- **Hippie puddle (ROSTER):** a half-speed zone drawn as a purple smear on wet blue-grey earth, beside the cosmetic `puddle` scenery that already lies on the ground on ten screens. The player can't tell the two apart, and for the first ten screens the "cost" of a whip kill is a tax with no alternative (the saw is on screen 11). Also, the draft says "the last frame stays as the puddle", but the renderer does not draw dead zombies at all (`render.js:595`), so the puddle would have to be its own thing anyway. Verdict: cut the slow; keep a drawn pool as a 6 s effect. If the owner wants the slow later, it rides on the boss hazard list.
- **Cheerleader leap (ROSTER):** the tell is 0.3 s on "attack frame 0 held", and the sheet's attack frames are a reach, a step and an arm-out, none of them a crouch (the draft admits the frames leave the ground by 2 px). A 0.3 s unreadable tell at this size is a cheap hit, not a dodge test. Fix: a 0.45 s windup drawn with the idle strip (she stops and cheers, pom-poms up), then the leap on the attack strip. New "leap" art is optional polish, not a requirement.
- **Sweater "doesn't flinch" (ROSTER):** the config sets `knockback: 0` but keeps `hitReactTime` and the shared `hitreact` state, which stops him (`e.vx *= 0.85`, `sim.js:484`) and gives him a 0.4 s attack cooldown after every hit (`sim.js:485`). Three fast whips kill him before he ever shoves. He's a jogger with more hit points. Fix: `flinch: false` means a hit flashes him white (`e.flashT`) and changes nothing else; he keeps walking and his shove still finishes. That makes "whip him from 33 to 38 px, then step back when both arms come up" a real decision, and it's exactly the boss rule, built once and tested on a small body first.
- **Baby litter (ROSTER):** at 90 px/s and 24 px apart the babies arrive every 0.27 s, which is Sammy's whole whip (4 frames at 15 fps = 0.267 s), with zero slack. Today a whip pressed a split second early is dropped (owner question 16), so on a keyboard this is a guaranteed hit. 32 px (0.36 s) gives one whip of slack; the owner should also answer question 16 before the litter ships.
- **Brute vomit tell (BOSSES):** it reuses row 3 picture 3, the arms-wide pose that is also the "dizzy" opening. One pose meaning both "hit me" and "run" is a tell collision, not polish. The MVP (swipe and slam only) avoids it; the full version needs the regenerated frame (prompt in BOSSES 5.3) or a different pose.
- **Brute and the chainsaw (both drafts disagree):** *(superseded by owner answer 7: cuts land any time; the "stand inside him" problem is handled with hit points and staggers instead)* ROSTER gates saw damage to the post-slam stagger only (the saw then feels broken for the first ten seconds: "I'm cutting him and nothing happens"). BOSSES lets cuts land any time. With "any time", standing inside him and holding the button is a win: he hurts on touch once a second, the lid eats three touches at 0.3 s each, then three hearts last 3 s, and 8 cuts a second over those 4 s is 32 damage, more than his 30 hp. The fix is in between: cuts land in **every opening** (openings, stuck, dizzy, stagger: 7 to 10 cuts each), and outside them the saw sparks off the spiked gauntlets with a `CLANG.` so the player gets feedback instead of silence. The whip lands any time for 1.
- **Play Possum on the Brute:** ROSTER says he ignores it; BOSSES uses it as the escape from a corner. He is 80 px tall and the jump is 60, so without it the only way past him is taking a hit. BOSSES wins.
- **Too many systems in BOSSES:** four attacks, a stagger, an enrage with double shockwaves, a seven-state face table, a crawl that still hurts, hot dogs out of the body, a hat Sammy wears, velvet ropes, a second arena, a new checkpoint, a "stays beaten" memory, eight sounds, taunts. Each is fine; together they are the biggest piece of work since Stage B. Section 7 of that draft already had the right MVP tables; this page uses them and moves the rest to "later".
- **Does each type create a different decision?** After the fixes: jogger = whip twice (baseline); hippie = count to three, step back between swings (he closes while you recover); sweater = spacing and the tell (whip from the edge, back off when the arms come up); cheerleader = move (jump her or step back, then punish the landing); baby = rhythm and numbers (one swing each, and Play Possum does nothing). Vendor = ranged pressure. Yes, five different answers, and none needs a new button.

### 1.2 Scope (a solo owner plus Claude)

- **MVP of the roster:** step 1 (the table) plus the hippie and the sweater. Both are numbers plus one flag (`flinch`) and one small state (`sniff`). The cheerleader adds three states and a physics path; the baby adds a litter spawner, a smaller cell, and a rating decision. Build those two after the first two are in the level and someone has played them.
- **MVP of the bosses:** the Brute with swipe and slam, 24 hp, one stagger, 3 faces, a plain death. The Ringmaster MVP is two attacks and 8 hp. Everything else in BOSSES is "full" and listed in 4.7 as one-liners.
- **The Ringmaster's hidden costs:** a lock (without one, Sammy at 110 px/s simply leaves him at 45 px/s, and the pond one screen on kills him for free), a checkpoint, a "stays beaten" memory, and an importer run that hasn't happened (`boss2/` holds only `sheet.png`). None is big; together they are about half a Brute.
- **No `-lowgore` art files exist in the loader.** `CLAUDE.md` says every gory picture needs one, but `assets.js`, `render.js` and `tools/scan-assets.mjs` have no variant key for it (grep finds nothing). The four roster sheets don't need it (the importer already moved their slime off the reserved colours). The bosses have blood and red arcs baked into their attack frames, so low gore for them means either a recoloured second set of strips plus a small loader change, or accepting the arcs in both modes. *(Answered: owner answer 6, no low-gore work; the game is full gore and the G toggle stays as it is.)*

### 1.3 Consistency with the sim

- **The enemy-type branches:** `CLAUDE.md` names eight in `sim.js` plus the render dispatch and `renderSweep`. The code has two more it doesn't mention: `sawCut` (`sim.js:413`, the same `C.vendor : C.jogger` pick as `whipHits`) and `releaseConfused` (`sim.js:245-247`, confused→patrol vs shrug→idle). `render.js` also keys gag lines by style, not type (`GAGS`, line 194). Thirteen sites in all (listed in step 1), and `CLAUDE.md` should be corrected after the refactor.
- **Hard-coded jogger geometry:** the attack box sits 26 px up (`sim.js:477`); the baby (20 px body) and the sweater (arms higher) need it per type (`hitY`).
- **Play Possum:** `startPossum` flags everyone within 96 px and picks the state by type; `releaseConfused` gives everyone the global `C.possum.ignoreAfter`. The per-type table (`possum`, `possumIgnore`) slots in exactly there. Owner question 10 (bumps still hurt while lying down) is unchanged, and the baby relies on it.
- **Determinism:** no random numbers anywhere in the drafts; boss attack choice is distance plus a counter; gag lines already hash the enemy id. Good. The `'baby*3'` wave entry must spawn in a fixed order and fixed offsets.
- **Timings test:** every multi-frame state on a clock needs `config = frames / fps`. Boss "holds" are one-frame `hold` strips with a plain seconds number (the cart's upright picture already works this way). The cheerleader's attack strip is picked by state (`frame` loop mode, as `overlay:lid`), so it is exempt, and `sprite()` already takes a `frame` argument.
- **Gauntlet:** the HUD prints `WAVE n/` + `C.gauntlet.waves.length` (`render.js:490`), so shrinking the list keeps the counter right; the boss "wave" replaces the counter with the boss bar. The arena filters dead arena enemies every step (`sim.js:749`), and `respawn` drops them all, so a "stays beaten" memory is needed for the Ringmaster only.
- **Bot:** it holds the attack button when a zombie is in front, so with the saw it revs, it never whips. Against a Brute whose cuts only land in openings it still wins in god mode (it stands in him, eats the swipe, cuts the opening); the full-playthrough test's 120 s budget may need to become 150 s.

---

## 2. The roster

### 2.1 Rules all walkers share

- **One brain, "walker":** patrol → chase → attack → hit-react → defeat → dead, plus `spawn` (arena drop-in) and `confused` (Play Possum), exactly the jogger's code today, driven by the type's config block. Three hooks, each behind a flag: `flinch: false` (sweater, bosses), `leap` (cheerleader: windup / leap / land replace `attack`), `sniff` (sweater's Play Possum walk-up).
- **Boxes:** the whip box is 20x12 px, 10 to 22 px above Sammy's feet, from 6 to 26 px ahead; the saw box is 28 px ahead and 18 tall. A type's `bodyW x bodyH` is what both hit and what hurts to touch. A type's attack box starts `hitY` px above its feet (the jogger's 26 is today's hard-coded number).
- **Touch hurts** while a walker is patrolling, chasing or attacking; never while it reels, is confused, sniffs, winds up, lands or dies.
- **Defeat styles** are a gag list, a set of flying bits and (until real art) a placeholder drawing: `pop` (jogger, baby), `deflate` (vendor), `melt` (hippie), `burst` (cheerleader), `flop` (sweater), `sliced` (any chainsaw kill unless the type says otherwise), `crawl` (bosses). With real art, the defeat strip plays and the style only picks the words and the bits.
- **Gag lines** are keyed by type first, then style, and fall back to the shared lists. All lines below are 16 characters or fewer, use only letters the 3x5 font has, and were checked against the font (the game's own text-fit test covers every line once it is in the code).

### 2.2 Play Possum, side by side

| Type | Reaction | Grace after Sammy gets up | Why |
|---|---|---|---|
| Jogger | confused, stands still | 1.5 s | baseline |
| Vendor | shrugs, stops throwing | 1.5 s | baseline |
| Hippie | confused | **3.0 s** | the tank you can always walk past; "too stoned to notice" |
| Sweater | **sniffs:** shambles to 32 px, stops, faces Sammy | 1.5 s | you get up under the big one |
| Cheerleader | confused (she cheers in place) | **0.75 s** | buys a breath, not a kill |
| Baby | **never fooled** | – | the ability's one counter; a bump still hurts while lying down (owner Q10) |
| Ringmaster, Brute | confused until Sammy gets up | 1.5 s | the way past a boss who corners you; an attack already started still finishes |

Config: `possum: 'confused' | 'shrug' | 'sniff' | 'ignore'` and `possumIgnore` seconds in each type block.

### 2.3 Hippie: "the slow wall" (build first)

**Role:** the first thing that doesn't die in two hits. Slow enough to walk around, tough enough to make you count. Half a jogger's knockback, so he closes in while you recover from a swing: whip, whip, step back, whip.

```js
hippie: {                  // enemy-zombie-hippie: stoned, rotting, 3 whips. Brain: walker
  brain: 'walker', art: 'hippie',
  hp: 3, patrolSpeed: 18, chaseSpeed: 36, patrolRange: 48,
  notice: 80, giveUpDist: 128, giveUpTime: 2.0,
  attackRange: 26, attackTime: 0.4, attackHitStart: 0.2, attackHitEnd: 0.3, attackCooldown: 1.6, // 4 frames @ 10 fps, hit frame 2
  hitW: 18, hitH: 20, hitY: 26, bodyW: 20, bodyH: 40,
  hitReactTime: 2 / 12, defeatTime: 8 / 12,
  flinch: true, knockback: 60, sawKnockback: 20, cartKnock: 80,
  possum: 'confused', possumIgnore: 3.0,
  defeatStyle: 'melt', sawStyle: 'sliced',
},
```

- **Attack:** the claw lunge (the sheet's attack frames; best strip on the sheet). The toxic burp needs frames that don't exist: later, if ever.
- **Deaths:** whip = `melt` (the sheet's dissolve) plus a drawn pool effect for 6 s (purple `#904890` from his palette, grey-brown in low gore; drawing only, no rule). Saw = `sliced`, no pool. Lines: `PEACE. OUT.` · `FAR OUT, MAN.` · `BUMMER.`
- **Frames (48x48, feet (24, 47), scale 0.306 ≈ 45 px):** walk A1 A2 A3 A4 A3 A2 at 6 fps (a shamble); attack A9 A10 A11 A11 at 10 fps, hit frame 2; hit A15 A16 at 12 fps; defeat A19 A20 A21 B22 B23 B24 B24 B24 at 12 fps; idle A25 A26 A27 A26 at 6 fps. The importer map in `importer-v2/hippie/map.json` already lists these boxes: `node tools/import-art.mjs --character <hippie>/map.json --prefix hippie --out <hippie>/out`. Check facing on the 4x preview (`--flip` if he looks left).

### 2.4 Sweater: "the brawler" (build second)

**Role:** the big one. Three whips, never flinches, and his two-handed shove throws Sammy twice as far as a jogger's bump and knocks the trash lid clean off (all charges). Placed right after the second lid so the joke lands.

```js
sweater: {                 // enemy-zombie-sweater: loud zigzag sweater, bunny slippers, rubber duck. Brain: walker, no flinch
  brain: 'walker', art: 'sweater',
  hp: 3, patrolSpeed: 22, chaseSpeed: 50, patrolRange: 48,
  notice: 100, giveUpDist: 144, giveUpTime: 2.5,
  attackRange: 32, attackTime: 4 / 8, attackHitStart: 2 / 8, attackHitEnd: 3 / 8, attackCooldown: 1.5, // 4 frames @ 8 fps, hit frame 2
  hitW: 24, hitH: 26, hitY: 36, bodyW: 24, bodyH: 48,
  hitReactTime: 2 / 12, defeatTime: 8 / 10,
  flinch: false, knockback: 0, sawKnockback: 0, cartKnock: 0,   // a hit flashes him white for hitReactTime and changes nothing else
  shoveKnockX: 240, shoveKnockY: 150, stripsLid: true,          // Sammy's hurtKnockX is 120; a blocked shove still throws him and takes every lid charge
  possum: 'sniff', sniffStop: 32, possumIgnore: 1.5,
  defeatStyle: 'flop', sawStyle: 'sliced',
},
```

- **The decision:** the whip reaches a 24 px body whose centre is up to 38 px away; his shove starts at 32. So there's a thin band to whip him from, and when both arms come up (frames 0 and 1, 0.25 s) you step back or jump. Numbers to be tuned by a person playing.
- **Play Possum:** sniff. He's fooled, but walks up at patrol speed, stops 32 px away (his 24 px body never touches Sammy's 28 px lying body), faces him, idles. The usual grace when Sammy gets up.
- **Deaths:** whip = `flop` (the sheet's topple) with both slippers and the duck as code bits. Saw = `sliced` (the biggest body in the level cut in half: the saw's best moment before the boss). Lines: `BUNNY DOWN.` · `FASHION VICTIM.` · `NICE SWEATER.`
- **Bear hug:** never (needs a hold state, "Sammy held" art and a mash-out input).
- **Frames (64x56, feet (32, 55), import at about 52 px standing):** walk A1 A2 A3 A4 A3 A2 at 6 fps; attack A9 A10 A12 A13 at 8 fps, hit frame 2; hit A19 A20 at 12 fps; defeat A23 A24 A25 A26 B27 B28 B29 B30 at 10 fps; idle A31 A32 A33 A32 at 6 fps. The bigger cell is the point: at the importer's shared scale he was 44 px, no bigger than the hippie. `node tools/import-art.mjs --character <sweater>/map.json --prefix sweater --size 64x56 --height 52 --out <sweater>/out`. The two defeat frames with slippers in the air (67 px tall) get trimmed or shrunk by the importer; the slippers are code bits anyway.
- **Prompt (screen 9, x 2660-2760):** `BIG LAD. HE WANTS YOUR LID.`

### 2.5 Cheerleader: "the dodge test" (build third)

**Role:** the first enemy that makes you move. She stops, cheers (the tell), then leaps about 70 px at you. Jump her or step back; she lands in front of you, open for a whip. Fast on foot, so you can't stroll away.

```js
cheerleader: {             // enemy-zombie-cheerleader: pom-poms, leaping lunge. Brain: walker + leap
  brain: 'walker', art: 'cheerleader', leap: true,
  hp: 2, patrolSpeed: 36, chaseSpeed: 70, patrolRange: 64,
  notice: 112, giveUpDist: 160, giveUpTime: 2.0,
  leapRange: 72, leapWindup: 0.45,        // the tell: she stops and cheers (idle strip). Was 0.3 in the draft: too short to read
  leapVx: 170, leapVy: 190, leapMaxAir: 0.6, leapLand: 0.2, leapCooldown: 2.0, // 0.42 s in the air, 20 px high, 72 px long
  hitW: 18, hitH: 24, hitY: 0, bodyW: 16, bodyH: 40, // hurts on touch the whole leap (the box is her body, 16x40); no separate attack box
  hitReactTime: 2 / 12, defeatTime: 8 / 12,
  flinch: true, knockback: 120, sawKnockback: 40, cartKnock: 160,
  possum: 'confused', possumIgnore: 0.75,
  defeatStyle: 'burst', sawStyle: 'sliced',
},
```

- **States:** `windup` (0.45 s, idle strip, harmless) → `leap` (airborne, attack strip frames 1 and 2, hurts on touch) → `land` (0.2 s, attack frame 3, harmless: whip her now). `moveBody` already does enemy gravity (the arena drop-in uses it). She never leaps where the ground ahead isn't supported (the jogger's `aheadSupported` check), so she can't leap into the pond.
- **Why both dodges work:** from the 72 px trigger a step back (0.42 s at 110 = 46 px) makes her land 46 px short; a jump (0.73 s, 60 px high) clears a 20 px leap with room.
- **Deaths:** whip = `burst` (the sheet's splash) with two pom-poms and the bow as bits. Saw = `sliced`. Lines: `GO TEAM. DEAD.` · `RAH RAH. SHIT.` · `SPIRIT: ZERO.`
- **Frames (48x48, feet (24, 47), scale 0.278 ≈ 44 px):** walk A1 A2 A3 A4 A3 A2 at 8 fps (a skip); attack A9 A10 A11 A12 in `frame` mode (0 unused, 1 rising, 2 falling, 3 land); hit A17 A19 at 12 fps; defeat A23 A24 A25 B26 B27 B28 B28 B28 at 12 fps; idle A29 A30 A31 A30 at 6 fps (also the tell). Check facing (`--flip`). Optional later: a real 3-frame leap (prompt in `ROSTER.md`, "Missing from the sheets").

### 2.6 Baby: "the litter" (build fourth, owner gate)

**Role:** three at a time, one hit each, faster than a jogger. The pressure is rhythm and numbers, and it's the one enemy Play Possum does nothing about.

**Owner gate (answered 2026-10-20, answer 8: no guard rails; the baby bleeds red and is sliced like anyone else; the "never red, never sliced" lines in this section are superseded):** a zombie toddler the player whips and chainsaws is the one picture here that can move the rating or get the game refused by a store. The suggested version below never bleeds red (pop into its own purple-teal goo in both gore modes), is never sliced, and ships only if the owner accepts the risk. If not, the sheet keeps for a later cameo and the level list below drops its three entries.

```js
baby: {                    // enemy-zombie-baby: exposed brain, eyeball on a stalk, rattle. Comes in threes. Brain: walker
  brain: 'walker', art: 'baby',
  hp: 1, patrolSpeed: 30, chaseSpeed: 90, patrolRange: 40,
  notice: 128, giveUpDist: 200, giveUpTime: 3.0,
  attackRange: 18, attackTime: 4 / 12, attackHitStart: 2 / 12, attackHitEnd: 3 / 12, attackCooldown: 0.8, // rattle smack, hit frame 2
  hitW: 12, hitH: 14, hitY: 16, bodyW: 12, bodyH: 20, // 30 px sprite, 20 px body: the whip (10..22 px up) overlaps the top 10 px
  hitReactTime: 2 / 12, defeatTime: 8 / 12,
  flinch: true, knockback: 0, sawKnockback: 0, cartKnock: 160,
  possum: 'ignore',
  defeatStyle: 'pop', sawStyle: 'sliced',               // owner answer 8: sliced and red like everyone (was sawStyle 'pop', noBlood: true; superseded)
  litterGap: 32,                                        // wave entry 'baby*3': three, 32 px apart (0.36 s apart at 90 px/s: one whip plus slack)
},
```

- **Honest note on "under the whip":** anything 11 px or taller standing on the ground is whippable, so the baby is hit by a normal whip. A true under-the-whip baby needs a crawl pose and a low whip for Sammy: not for level 1.
- **Deaths:** `pop` with the rattle, bonnet and eyeball as bits. Lines: `NAP TIME.` · `LITTLE SHIT.` · `GOO GOO. GONE.`
- **Frames (32x32, feet (16, 31), import at about 30 px standing):** walk A1 A2 A3 A4 A3 A2 at 10 fps; attack A9 A10 A11 A11 at 12 fps, hit frame 2; hit A15 A18 at 12 fps; defeat A23 A24 A25 B26 B27 B28 B28 B28 at 12 fps; idle A29 A30 A31 A30 at 6 fps. `node tools/import-art.mjs --character <baby>/map.json --prefix baby --size 32x32 --height 30 --out <baby>/out`. Risk: the eyeball, brain and rattle may turn to mush at 30 px; check the 4x preview; fallback 40x40 at 36 px.

### 2.7 Jogger and vendor (unchanged in play)

The jogger keeps every number it has; the table just makes them explicit (`flinch: true, knockback: 120, sawKnockback: 40, cartKnock: 160, shieldPush: 16, hitY: 26, possum: 'confused', possumIgnore: 1.5, defeatStyle: 'pop'`). The vendor is the only `turret` brain (`possum: 'shrug'`, `defeatStyle: 'deflate'`). Keep the jogger: screen 2's prompt needs a dumb, fast, two-hit body to learn the whip on, and the gauntlet needs filler that dies fast. He stays placeholder art until a jogger sheet exists; that's the honest cost of four real sheets landing.

---

## 3. Level 1 placement and the gauntlet

Today: 15 enemies (14 joggers, 1 vendor). Proposed, with the screen-7 clump (the default until the owner says yes to the Ringmaster): **17 bodies, 7 of them joggers** (14 without the baby). With the Ringmaster on screen 7 instead: 15 bodies including him, 5 joggers (12 without the baby). Same first two screens, so the tutorial prompts still make sense. One new idea per screen, each introduced alone, then mixed.

```js
enemies: [
  { type: 'jogger', x: 540 },                                            // screen 2: first zombie, under the whip prompt (unchanged)
  { type: 'jogger', x: 780 }, { type: 'hippie', x: 940 },                // screen 3: first hippie by the second rock. Three whips, or play dead and walk past (prompt moves here)
  { type: 'jogger', x: 1180 },                                           // screen 4: guards the lid (unchanged)
  { type: 'cheerleader', x: 1420 }, { type: 'jogger', x: 1540 },         // screen 5: first leap, between the two lamps (jump onto one to dodge her)
  { type: 'vendor', x: 1800 },                                           // screen 6: behind the cart (unchanged)
  // screen 7 (1920-2240): THE RINGMASTER if the owner says yes (4b); otherwise { type: 'jogger', x: 2080 }, { type: 'jogger', x: 2112 }, { type: 'hippie', x: 2150 }
  { type: 'jogger', x: 2290 },                                           // screen 8: pond edge (the far-bank jogger is dropped; the pond is the hazard)
  { type: 'sweater', x: 2720 },                                          // screen 9: right after C2, standing on the second lid. He knocks it off
  { type: 'baby', x: 3010 }, { type: 'baby', x: 3042 }, { type: 'baby', x: 3074 }, // screen 10: the litter, penned between the rock (2960) and the fence (3100). Owner gate
  { type: 'cheerleader', x: 3160 },                                      // screen 10: penned between the two fences
  { type: 'hippie', x: 3440 },                                           // screen 11: after the chainsaw (3300): your first saw victim
],
```

- **Play Possum prompt moves to screen 3** (x 680-760, before the jogger and the hippie): `C: PLAY DEAD. ZOMBIES ARE DUMB AS SHIT.` The hippie's 3 s of ignoring Sammy is the demo. This frees screen 7 for the Ringmaster and keeps the litter (the one Play-Possum-proof enemy) far from the lesson. If the Ringmaster is not built, screen 7 keeps a clump (two joggers and a hippie) and the prompt can stay where it is.
- **Nothing new near the pond:** an enemy that falls below y 260 vanishes; a leaper over water is wasted.
- ~~**Unknown types degrade to joggers.**~~ *(Changed in step 1: an unknown type **throws** at once, so a typo or a half-built type is caught by the tests, never played as a jogger. Only place a type in the level once its block is in `config.js`.)*

### 3.1 Gauntlet (Bethesda Terrace): two typed waves, then the Brute

```js
gauntlet: {
  waves: [
    ['jogger', 'jogger', 'cheerleader'],                 // 1: warm-up with a leaper. 3 bodies, 6 hp
    ['hippie', 'jogger', 'sweater', 'jogger'],           // 2: the tank from the left, the brawler from the right. 4 bodies, 10 hp
  ],
  waveDelay: 1.0,
  boss: 'brute',                                         // after the last wave: the boss bar replaces "WAVE n/2"; the gate opens when he's dead
},
```

7 bodies and 16 hp before the boss, versus 9 and 18 today, then a 24-hp boss. `spawnWave` keeps alternating sides; a `'baby*3'` entry (if the owner wants the litter in the fight) spawns three from one side, 32 px apart, in a fixed order. The HUD counter already reads `waves.length`.

---

## 4. The bosses

### 4.1 Two bosses in level 1: the honest verdict

- **For:** level 1 sags between the cart (screen 6) and the saw (screen 11): a jogger clump, a pond, a lid, more joggers. A 40 to 60 s whip-only fight at screen 7 fixes that and teaches the boss language (tell, hit, opening; lie flat under high swings; jump low ones; play dead to get past) before the finale, where the chainsaw changes everything. The two sheets are visual opposites (tall thin red showman, huge pale bloated brute), so the two fights look different. Many 16-bit levels had a mid-boss; it isn't a strange shape.
- **Against:** the code has one arena. The Ringmaster needs a lock (two temporary solids, the velvet ropes; the camera can keep following, since the ropes keep both fighters inside 320 px), a checkpoint just before him, and a "stays beaten" memory so a later death doesn't bring him back. His sheet hasn't been through the importer. He displaces the Play Possum tutorial, which moves to screen 3. Every one of these is small; together they are about half of what the Brute costs, on top of the Brute.
- **Verdict:** build the boss machinery and the Brute first (steps 4a and 5). Build the Ringmaster (4b) if the owner wants the mid-level fight; if not, he is a ready-made level 2 boss and nothing in level 1 is worse for his absence. The task's step order below keeps "4 Ringmaster, 5 Brute" and splits 4 into the shared part (4a) and the Ringmaster's own part (4b), so 4a plus 5 can ship without 4b.

### 4.2 Rules both bosses share (trimmed from BOSSES.md)

- **A boss never flinches:** hits take health, flash him white for 0.1 s, spray a little (dust in low gore), and freeze the picture for 2 frames (the existing hit-stop). Nothing interrupts him.
- **Tell → hit → opening.** The tell is a held pose (0.4 to 0.6 s) with its own sound. The opening is a held pose after the attack (0.6 to 1.2 s) in which touching him doesn't hurt and he can't start anything. Openings use the same off-balance pose each time: "arms out = go".
- **Touching a walking or attacking boss hurts** (like a jogger). Touching a stuck, dizzy, staggered, confused or dying boss doesn't.
- **High and low:** Sammy's play-dead box is 14 px tall, his standing box 30. An attack marked high hits from 20 px up; lying flat is under it. A low attack reaches the floor. Each boss has one of each.
- *(superseded by owner answer 7)* ~~**The chainsaw only cuts an open boss** (opening, stuck, dizzy, stagger). Otherwise the blade sparks off him: `sfx-chainsaw-cut` sparks, no blood, `CLANG.` over the blade once a second at most.~~ **The chainsaw cuts a boss any time** (Confirmed): balance with hit points and staggers; saw hits throw the most blood, chunks and hit-stop. The whip lands any time for 1.
- **Play Possum:** confused until Sammy gets up (3 s limit), then 1.5 s of grace, exactly the jogger rule. An attack already started finishes. This is the escape from a corner.
- **Acid is a floor hazard:** burns standing, running or lying; the lid doesn't block it; no knockback (the 0.2 s hurt flinch still plays); then the usual 1 s of invulnerability. Puddles time out. Acid keeps its own greens in both gore modes (three new palette colours, not the reserved ichor), because you have to see it to dodge it.
- **Half health:** a 0.8 to 1.0 s stagger (free opening), the face in the bar changes, attacks get a little faster.
- **Boss bar:** a strip under the 16 px top bar: 32x32 portrait at (4, 18), the name at (40, 20), a 120 px bar at (40, 28), 6 px tall, a tick every few hits. Three faces in the MVP (healthy, hurt, dead) plus a 0.25 s wince after a hit; the full face tables are in BOSSES 4.4 and can wait.
- **Music:** `music(s, 'boss')`; `S.MUSIC_TRACKS.boss = ['music-level-01-boss', 'music-level-01-gauntlet', 'music-level-01-central-park']` so it falls back to what exists.
- **No luck:** attacks are chosen by distance and a fixed counter.
- **Sounds (8 new ids, placeholder beeps until files come):** `sfx-boss-roar`, `sfx-boss-slam`, `sfx-boss-swipe`, `sfx-boss-hit`, `sfx-boss-death`, `sfx-acid-spray`, `sfx-acid-burn`, `sfx-bells` (Ringmaster only).

### 4.3 THE BRUTE (final boss, Bethesda Terrace)

**Who:** a huge bloated zombie in spiked gauntlets and chains, guts out, mouth full of acid. He ate the other zombies. Slow, wide, and he does not stop. About 85 px tall (sheet scale nudged from 0.471 to 0.45 so the wide attack poses need less squeezing into 128 px cells). Body box 44x80. Walk 32 px/s. He can't be jumped (80 px tall, 60 px jump); you get past him through an opening or with Play Possum.

**Entrance:** a second after wave 2 dies, the screen shakes, banner `THE BRUTE. HE ATE THE OTHER ZOMBIES.`, he walks out of the fourth arch (x 3744) and turns. Full version: back-view walk, turn, roar; MVP: he walks in from the right.

```js
brute: {                   // boss: walk, swipe, slam (MVP); + spin, vomit, enrage (full). Brain: boss
  brain: 'boss', art: 'brute', name: 'THE BRUTE',
  hp: 24, staggerAt: 12,                   // full: 30, stagger 15, enrage 9
  walkSpeed: 32, bodyW: 44, bodyH: 80,
  swipe: { range: 64, tell: 0.45, step: 24, stepTime: 0.1, hits: 3 / 10, box: { x0: 8, x1: 64, y0: 0, y1: 64 }, opening: 0.9, knockX: 240, knockY: 150 }, // low: lying flat does not work
  slam:  { range: 160, tell: 0.5, hit: 0.15, box: { x0: 8, x1: 56, y0: 0, y1: 40 }, wave: { speed: 160, w: 16, h: 10 }, stuck: 1.0, cooldown: 4.0 }, // jump the shockwave
  staggerTime: 0.8, confusedTime: 1.2,
  deathTime: 10 / 6, deathHold: 1.5,
  flinch: false, possum: 'confused', possumIgnore: 1.5, sawOpenOnly: false, // owner answer 7: the saw cuts him any time (was true; superseded)
  defeatStyle: 'crawl', sawStyle: 'crawl',
},
```

**Attacks (MVP):**
- **SWIPE (close, low, big knockback).** Within 64 px in front. Tell 0.45 s (row 2 picture 1: gauntlet arm back, pointing). Step 24 px. Three swings at 10 fps (row 2 pictures 5, 6, 7), box 8 to 64 px ahead, floor to 64 up: the last swing scrapes the ground, so lying flat fails; the jump tops out at 60, so jumping fails too. Back off: the reach is 88 px from where the tell started. The margin is thin on purpose and is a knob: a player who needs a quarter second to see the arm go back has 0.2 s of tell left, 22 px of retreat from the 64 px trigger edge (86 vs 88, saved by Sammy's 10 px half-body); if backing off from the edge feels unfair in play, the tell goes to 0.5 s or the step to 16 px. Knockback 240 (twice a jogger). Opening 0.9 s (row 2 picture 4): 7 cuts or 2 to 3 whips.
- **SLAM (mid range, floor shockwave).** 64 to 160 px, off a 4 s cooldown. Tell 0.5 s (row 3 picture 1: fists over his head). Fists into the stone (row 3 picture 2) with the dust strip; direct box 8 to 56 ahead, floor to 40 up; two shockwaves leave his feet at 160 px/s, one each way, 16x10, to the walls (gone in 1.7 s), hitting anyone on the ground, standing or lying. Jump. Stuck 1.0 s (row 2 picture 3, fist buried): safe to touch, the best time to run past, 8 cuts.
- **Cycle:** at each decision point (every 1.0 s of walking, or when an opening ends): in front within 64 → swipe; 64 to 160 and the slam is ready → slam; else walk; never more than 3 s of walking without a slam.
- **Stagger at 12:** clutching his belly (row 4 picture 1) for 0.8 s, safe to touch, face changes, grunt.
- **Death:** row 4 pictures 1 to 8, 10, 9 at 6 fps (1.67 s), then held 1.5 s. MVP: harmless. Line `BIG FUCKER DOWN.` when he goes flat; then three hot dogs bounce out of him the way they spill from the cart, banner `HE HAD HOT DOGS IN HIM.` (he ate the vendor; a joke, not gore, so it stays in low gore). Then `EXIT OPEN. GO.` as today.
- **Full version (later, in this order):** VOMIT (every 4th attack; stream 24 to 144 px ahead, 24 to 44 px up, high: lie flat; three puddles at 48, 88, 128 px for 5 s; needs the regenerated tell frame, see 1.1); SPIN (behind him within 56 px; high; dizzy 1.2 s = 10 cuts); enrage at 9 (`HE'S PISSED NOW.`, tells 30% shorter, double shockwaves, walk 48; the enraged swipe step shrinks to 16 px so backing off from the trigger edge still works); the crawl that still hurts; the back-view entrance; the seven-face table.
- **Taunts** over him at the start of every third tell: `MEAT.` · `SMALL MEAT.` · `NEED. MEAT.`

### 4.4 THE RINGMASTER (owner answer 5: **level 2**, not built now; kept as notes for the level 2 boss)

**Who:** a tall thin zombie in a torn red tailcoat and top hat, curved blade claws, chains hung with bells. A showman about to die for it. About 84 px with the hat; body box 24x72 (the hat doesn't count); crawl box 40x28 during the lunge and the death. Walk 45 px/s (slower than a chasing jogger).

**Where (suggested):** screen 7 (x 1920-2240), the flat stretch after the cart and the vendor: the cart is the heal before the boss. The three joggers there go. New checkpoint `C1B` at x 1900. Velvet ropes at x 1932 and 2228 are scenery plus two temporary solids while he lives; the camera keeps following (the ropes keep both inside one screen). Alternative: screen 9 (after C2 at 2576, lid inside the ring, no new checkpoint; but it's at 75% of the level, not the middle, and shoves the sweater to screen 10). Owner question.

```js
ringmaster: {              // mini-boss, whip only (he's before the saw). Brain: boss
  brain: 'boss', art: 'ringmaster', name: 'THE RINGMASTER',
  hp: 8, staggerAt: 4,                     // full: 12, stagger ("act two") at 6
  walkSpeed: 45, bodyW: 24, bodyH: 72,
  slash: { range: 56, tell: 0.4, step: 20, stepTime: 0.1, hits: 2 / 8, box: { x0: 8, x1: 48, y0: 20, y1: 48 }, opening: 0.8 }, // high: lie flat
  spray: { range: [64, 160], every: 3, tell: 0.6, time: 0.6, box: { x0: 0, x1: 112, y0: 18, y1: 34 }, puddles: [40, 72, 104], puddleW: 24, puddleLife: 4.0, opening: 0.7 }, // high, then floor hazard
  staggerTime: 1.0, confusedTime: 1.2,
  deathTime: 10 / 4, deathHold: 1.5,
  flinch: false, possum: 'confused', possumIgnore: 1.5, sawOpenOnly: true,
  defeatStyle: 'crawl', sawStyle: 'crawl', staysBeaten: true,
},
```

- **SLASH (close, high):** tell 0.4 s (row 2 picture 1, claws up: a metal scrape), step 20 px, two slashes at 8 fps (row 2 pictures 3 and 4, the red arcs), box 8 to 48 ahead, 20 to 48 up. Lie flat or step back (reach 68 px). Opening 0.8 s (row 2 picture 6): two or three whips.
- **ACID SPRAY (mid range, high, then puddles):** 64 to 160 px, and every third attack regardless. Tell 0.6 s (row 3 picture 1, arms up, bells: the one tell you hear first). Spray 0.6 s (row 3 picture 4), stream 112 px long, 18 to 34 px up: lying flat is under it with 4 px to spare. Three puddles at 40, 72, 104 px for 4 s. Opening 0.7 s (row 3 picture 2, hunched, coughing).
- **Cycle:** within 56 → slash; 64 to 160 → spray; else walk; every third attack a spray.
- **Stagger at 4 ("act two"):** folds, hat askew (row 4 picture 10), 1.0 s, banner `ACT TWO, RAT.`, then a spray straight away. Full version: shorter tells, a third low overhead swing (row 2 picture 5) that catches a lying Sammy, and the LUNGE (row 4 crawl frames at 170 px/s, low: jump it; play dead fails).
- **Death:** row 4 in the order 10, 9, 7, 8, 1, 2, 3, 5, 4, 6 at 4 fps, held 1.5 s; `SHOW'S OVER.` over him, a second later `TOUGH CROWD.` over Sammy. Full gore: a pool and the hat rolls off; low gore: he sinks. Reward: the ropes drop, two hot dogs land where he died.
- **Lines:** banner `THE RINGMASTER. DINNER IS SERVED.`; taunts `STEP RIGHT UP.` · `NO REFUNDS.` · `FEED THE SHOW.`
- **Later:** the hat gag (Sammy wears it; needs a head point per Sammy strip, drawing only), the bow entrance, the real lunge frames.

### 4.5 The chainsaw and the Brute (owner question 22; partly superseded by answers 4 and 7: the saw cuts any time, and a second pickup or a refuel inside the arena means he always has a saw for the boss, so the fuel maths below is history)

- The saw cuts every 0.12 s for 1: about 8 a second while the blade is on him. His openings give 7 (swipe), 8 (slam stuck), 7 (stagger) cuts. **24 hp is three good openings plus a whip or two (7 + 8 + 7 = 22), about 3 s of actual revving.**
- **Fuel, honestly:** from the pickup at 3300 to the Brute's death Sammy carries the saw for about 60 s (3 s of walking, the screen-11 hippie, two waves of about 15 s, the entrance, a 40 s fight). At today's carry drain (0.25/s) that is 15 s of the 20 s tank gone before any revving: a careful player who revs only in openings (7 s over waves and boss) runs dry inside the fight. The BOSSES draft's "4 to 6 s to spare" forgot the waves and the walk.
- **Recommendation for #22:** neither A (less fuel) nor B (bigger waves). Keep 20 s, drop `carryDrain` to **0.1** (6 s over the same minute), shrink the waves to two, and let the Brute's openings be the fuel sink. Holding the button the whole time still empties the tank in 20 s and leaves you whipping him (2 to 3 per opening: about 10 openings, 1.5 to 2 minutes, long but fair; a KO at the arena sends you to C2 with the saw back on the grass, so every try starts full).
- **Why cuts only land in openings:** with cuts landing any time, standing inside him and holding the button wins (the lid eats three touches, then three hearts last 3 s: 4 s of revving is 32 damage). Openings-only kills that plan and reads as "the gauntlets block the saw; open him up first". The sparks and `CLANG.` are the feedback.

### 4.6 Low gore (superseded by owner answer 6: no low-gore work; the G toggle stays as it is and is not extended to the new zombies or the boss)

The rule stays: `S.gore` is drawing only, the fight plays identically, tests check both. Hits: dust instead of spray. Deaths: sink instead of pool and trail. Hot dogs still drop. Acid unchanged. **The sheets themselves:** the Brute's open belly and both bosses' blood and red arcs are baked into the attack frames. First version: the same strips in both modes with the code effects suppressed (honest label: "low gore = less, not none"). Full version: recoloured `-lowgore` strips from the importer's colour control (reds to bruise purple and dirt, arcs to pale grey) plus a small loader change (a `lowgore` path per manifest entry; `sprite()` picks it when `S.gore === 'low'`). Owner question 6.

### 4.7 Cut from the first version (kept as one-liners)

- Hippie slime puddle as a slow hazard (rides on `s.hazards` after step 4a if wanted); hippie toxic burp; sweater bear hug; baby crawl and a low whip.
- Brute: vomit, spin, enrage and double shockwaves, the hurting death crawl, the back-view entrance, the seven-face table, chain attacks.
- Ringmaster: the lunge, the third overhead swing, act-two speed-up, the bow, the hat gag on Sammy.
- `-lowgore` strips and the loader's variant key (owner question 6).
- A separate boss music track (the slot is there; the file isn't).
- Portraits in the bar (the bar works with the name alone until the 32x32 import is done).

---

## 5. Implementation plan

Each step: files touched, tests to add, and a "done when" check. Run from `game/`: `node --test tests/sim.test.mjs tests/import-art.test.mjs`, then `node tools/build.mjs && node tests/browser-smoke.mjs`. Update the test counts in `game/README.md` and add a dated Proposed entry to `design/DECISIONS.md` at each step.

### Step 1: the `ENEMY_TYPES` refactor (no change in play) — **done 2026-10-20**

*What was built differs a little from the sketch below: the config block is the row (`brain`, `art`, `start`, `startAnim`, `flinch`, `knockback`, `sawKnockback`, `cartKnock`, `shieldPush`, `hitY`, `possum`, `possumIgnore`, `defeatStyle`, `sawStyle` next to the numbers), `sim.js` builds `S.ENEMY_TYPES` from every block with a `brain` and **throws** for an unknown type or a missing field (nothing degrades to a jogger), `render.js` has a `DRAW` table and gag lists keyed by type then style, and the sweep draws every state of every type. Placeholder looks stay in each type's drawer rather than a `placeholder` block. The sites list below was the map; `CLAUDE.md` "Add an enemy type" is now the guide.*

**Shape:** one block per type in `config.js` (`C.jogger`, `C.vendor`, later `C.hippie` …), each carrying its behaviour fields next to its numbers: `brain` ('walker' | 'turret' | 'boss'), `art` (manifest prefix), `start` state and anim, `possum`, `possumIgnore`, `flinch`, `knockback`, `sawKnockback`, `cartKnock`, `shieldPush`, `hitY`, `defeatStyle`, `sawStyle`, and the placeholder look (`placeholder: { colour, dark, w, h }`). `sim.js` gets `const typeOf = (e) => C[e.type] && C[e.type].brain ? C[e.type] : C.jogger;` and `const BRAINS = { walker: updateWalker, turret: updateVendor }`. `S.ENEMY_TYPES` (in `config.js`) is the list of type names, for tests and the sweep.

**The thirteen branch sites that the table replaces:**
1. `sim.js` `makeEnemy` (51-62): stats block, start state and anim, default `defeatStyle`.
2. `sim.js` `hurtPlayer` (187): the shield pushes a jogger back 16 px → `T.shieldPush`.
3. `sim.js` `damageEnemy` (224): defeat style → `T.defeatStyle` / `T.sawStyle`; (238) knockback → `T.knockback` / `T.sawKnockback`; add the `flinch: false` path (set `e.flashT`, no state change).
4. `sim.js` `releaseConfused` (245-247): confused → patrol vs shrug → idle, and `C.possum.ignoreAfter` → `T.possumIgnore`.
5. `sim.js` `startPossum` (265-266): the state by `T.possum`.
6. `sim.js` `whipHits` (375): the body box from `typeOf(e)`.
7. `sim.js` `sawCut` (413): same (not in `CLAUDE.md`'s list).
8. `sim.js` `updateJogger` → `updateWalker` (446-499): every `J.` becomes `T.`; the attack box's `e.y - 26` becomes `e.y - T.hitY`.
9. `sim.js` `updateCart` (587): the spill knocks joggers → `T.cartKnock`.
10. `sim.js` `spawnWave` (643-657): `'jogger'` → the wave's typed list (step 3 fills it; here it still reads `[2, 3, 4]` as jogger counts).
11. `sim.js` `S.update` (748): the dispatch → `BRAINS[T.brain]`.
12. `render.js` `styleOf` / `GAGS` (191-199) and the draw dispatch (596) → one `drawEnemy(ctx, e)` that uses `T.art + ':' + e.anim`, a placeholder from `T.placeholder`, and gag lists keyed by type then style.
13. `main.js` `renderSweep` (481-484) and `goreDemo` (510): loop over `S.ENEMY_TYPES` and each brain's state list.
(`bot.js` doesn't branch; `level.js` and `assets.js` are untouched in this step.)

**Tests to add:** (a) every type in `S.ENEMY_TYPES` has the required fields and a manifest strip for every anim its brain can show; (b) a type with `flinch: false` keeps its state and velocity when hit and still takes damage; (c) the 77 existing tests pass unchanged (they are the "no change in play" check); (d) `renderSweep` covers every type and state. Fix `CLAUDE.md` "How to add an enemy type" afterwards (the list now says: one config block, manifest keys, a level entry, tests; no `if`s).

**Done when:** all existing tests pass, the smoke run passes, a deterministic 40 s autopilot run gives byte-identical stats before and after the refactor, and `grep -n "=== 'vendor'\|=== 'jogger'" src/*.js` finds nothing outside the table.

### Step 2: the hippie, first new type

**Files:** `config.js` (the block in 2.3); `assets.js` (`hippie:walk/attack/hit/defeat/idle`, 48x48, feet (24, 47), under `enemies/enemy-zombie-hippie/zombie-hippie-<anim>-strip-v01.png`); `level.js` (x 940, 2150 or the screen-7 clump, 3440; the Play Possum prompt to 680-760 if the Ringmaster is coming, else unchanged); `render.js` (the `melt` gag list and the drawn pool effect `'melt-pool'`, grey-brown in low gore; placeholder colours); `sim.js` (`effect(s, 'melt-pool', …)` on a melt kill: nothing else); `main.js` (sweep states); the importer run with `--prefix hippie` and `--install`, plus `design/ASSET_SOURCES.csv` rows (owner-generated art, tool terms to confirm: owner question 13); `design/ART_BRIEFS.md` hippie section; `audio.js`: no new sounds.

**Tests:** three whips defeat a hippie and the pool effect appears for 6 s; the saw kill is `sliced` with no pool; Play Possum confuses him and he ignores Sammy for 3.0 s after (jogger still 1.5); the whip pushes him 60 (jogger 120); timings = frames / fps for all five strips; every hippie gag line fits; the gore test still finds no blood colour in low gore with a pool on screen; the level list only names built types.

**Done when:** the hippie stands on screen 3 in real art, dies in three whips with `PEACE. OUT.` over him, the pool shows in both gore modes, and all tests and the smoke run pass.

### Step 3: sweater, cheerleader, baby (in that order)

**Sweater.** `config.js` block (2.4); `assets.js` five `sweater:*` strips at 64x56, feet (32, 55); `sim.js`: the `sniff` state in the walker (walks toward Sammy at patrol speed until `|dx| <= sniffStop`, then idles; released like `confused`), `hurtPlayer` takes `knockX`, `knockY` and `stripLid` from `opts.source`'s block (a blocked shove: `p.shield = 0`, `sfx-shield-break`, Sammy still thrown, no heart lost); `render.js`: `flop` gag list and bits (slippers, duck); `level.js`: x 2720 and the prompt `BIG LAD. HE WANTS YOUR LID.` at 2660-2760. Tests: no flinch (he keeps walking through a whip), three whips kill, the shove throws Sammy 240 and empties a 3-charge lid in one hit, the sniff stops at 32 px and never bumps a lying Sammy, timings, gags, prompt width.

**Cheerleader.** `config.js` block (2.5); `assets.js` five `cheerleader:*` strips (attack in `frame` mode); `sim.js`: `windup` / `leap` / `land` states in the walker behind `T.leap` (leap starts at `leapRange`, never off an unsupported edge; airborne = hurts on touch; `leapMaxAir` safety; `land` harmless), `moveBody` as is; `render.js`: `burst` gags and bits (pom-poms, bow); `level.js`: x 1420 and 3160. Tests: the windup is harmless for 0.45 s and shows the idle strip; the leap covers about 72 px in about 0.42 s and hurts on touch; a Sammy who steps back is missed; a Sammy who jumps at the trigger clears her; the landing is harmless for 0.2 s; she never leaps into the pond; Play Possum grace 0.75 s; timings for the clocked strips only.

**Baby (owner said yes, answer 8: no guard rails, so `noBlood` and the "never sliced" rule are dropped).** `config.js` block (2.6); `assets.js` five `baby:*` strips at 32x32, feet (16, 31); `sim.js`: `possum: 'ignore'` skips the flag in `startPossum`; ~~`noBlood` makes `damageEnemy` emit ichor-style effects only (purple-teal, not the reserved reds) in both modes~~ *(superseded)*; `spawnWave` parses `'baby*3'` (fixed order, `litterGap` apart); `level.js` three entries at 3010, 3042, 3074; `render.js`: pop gags by type (`NAP TIME.` …) and bits (rattle, bonnet, eyeball). Tests: one whip kills; three placed babies 32 px apart arrive one whip apart at chase speed; Play Possum confuses the jogger beside them and not them; the litter wave entry spawns three; no red drop in either gore mode from a baby; timings. Also ask the owner about question 16 (early whip presses) before this ships.

**Done when (step 3):** screens 5, 9 and 10 play as described in section 3, the gauntlet's typed waves spawn the right bodies in a fixed order (`spawned` count test updated from 9), and the full autopilot run still clears the level in god mode.

### Step 4: boss machinery (4a) and the Ringmaster (4b) — **4a and the Brute (step 5) built 2026-10-20**

*What was built differs a little from the sketch: the boss brain has one state per pose (`swipe-tell`, `slam-stuck`, `vomit-stream`…) rather than generic `tell`/`hit`/`opening`; all four attacks, the stagger and the enrage are in (not only the MVP two); cuts land any time (answer 7) with hit-stop, chunks and blood on every cut; `sawOpenOnly` does not exist; the puddles land when the stream ends; the supplies are a lid and a chainsaw (answer 4); the death crawl is harmless; the manifest follows the combined strips the importer made from the sheet. See `DECISIONS.md`, "Steps 4a and 5". The level placement (`gauntlet.waves` as typed lists, the gauntlet shrinking to two waves) is the integrator's step.*

**4a, shared (needed by either boss):**
- `sim.js`: the `boss` brain: states `enter`, `walk`, `turn`, `tell`, `hit`, `opening`, `stuck`, `dizzy`, `confused`, `stagger`, `death`, `dead`, driven by the type block's attack sub-blocks (each: trigger range, tell, step, hit window and box, opening); attack choice by distance plus a fixed counter; `s.hazards` (puddles with a life, shockwaves with a speed) checked against Sammy's box every step through `hurtPlayer({ hazard: true, acid: true })` (no knockback, lid doesn't block); `sawOpenOnly` in `sawCut` (sparks and `CLANG.` otherwise); boss hits add 2 frames of hit-stop; `damageEnemy` never gives a boss `sliced`; bosses never fall out of the world; `music(s, 'boss')`.
- `render.js`: boss drawing with wide cells and the feet columns from `assets.js`, the white-flash copy, puddles and smoke, shockwaves as cracks, the boss bar and portrait, `crawl` gags; `?` over a confused boss.
- `assets.js`: the strips per 5.2 of `BOSSES.md` (holds as one-frame strips), a 32x32 face strip per boss, the effects; `S.MUSIC_TRACKS.boss`; the optional `music-level-01-boss` slot.
- `audio.js`: eight placeholder beeps. `main.js`: sweep states for the boss brain. `bot.js`: in a boss fight, walk to the boss and hold attack (it already does); raise the full-playthrough budget to 150 s if needed.
- Tests: the timings table for the clocked strips; every new sfx id has a beep and a call; the boss bar text fits; a scripted-input kill of a stub boss in Node (tell → hit → opening, damage only in openings for the saw, any time for the whip); the attack cycle is the same across two runs; a hazard hurts a lying Sammy and ignores the lid; both gore modes play identically with a boss on screen.
- **Done when 4a:** a stub boss (the Brute's walk, swipe and slam numbers, placeholder drawing) can be killed in a Node test with the whip and with the saw, the saw kills faster, and the sim is deterministic with him in it.

**4b, the Ringmaster (owner answer 5: level 2. Do not build in level 1; the notes stay for the level 2 boss):**
- Importer: `--detect` on `boss2/sheet.png`, a map with the cells from `BOSSES.md` 5.1, `--prefix ringmaster`, faces at 32x32.
- `level.js`: `{ type: 'ringmaster', x: 2140 }`; the three screen-7 joggers removed; checkpoint `C1B` at 1900; the Play Possum prompt moved to 680-760; ropes as scenery at 1932 and 2228.
- `sim.js`: a `ring` lock: two temporary solids from `T.ring` while the boss is alive (`getSolids` adds them; the camera is unchanged); `staysBeaten`: `s.beaten` set of def ids that `respawn` skips; the reward (two hot dogs) and the rope drop on death.
- `render.js`: velvet ropes on brass posts, drop on death.
- Tests: Sammy can't leave the ring while he lives and can after; a KO at screen 8 after beating him doesn't bring him back; C1B activates; a whip-only kill in Node in under 90 s of game time with scripted dodges; text widths.
- **Done when 4b:** the Ringmaster is beatable with the whip only in a Node test and in the browser, the bar and music switch on and off, and dying after him doesn't respawn him.

### Step 5: the Brute finale (owner answer 4: he comes after the final gauntlet wave, before the exit; right before him a power-up (lid or hot dog cache, builder's pick, Proposed) and a chainsaw refuel or second pickup inside the arena; answer 7: cuts land any time)

- Importer: re-run `boss/map.json` at scale 0.45 with `--prefix brute`, the vomit body cut from its stream, faces at 32x32, `--install`.
- `config.js`: the block in 4.3; `gauntlet.waves` to the two typed lists and `gauntlet.boss: 'brute'`; `chainsaw.carryDrain` to 0.1 (Proposed under #22).
- `sim.js`: `updateArena` spawns the boss after the last wave (`a.state = 'boss'`), the gate opens on his death; the entrance banner and shake; hot dogs on death (`'HE HAD HOT DOGS IN HIM.'`).
- `render.js`: the bar replaces `WAVE n/2` during the boss; the death gag; the arch entrance.
- Tests: the gauntlet test becomes "2 waves (7 bodies), then the Brute; gate opens on his death"; a scripted kill with the saw in under 60 s and with the whip in under 150 s; cuts outside openings do no damage and spark; the fuel maths (a careful run finishes with fuel left at carry drain 0.1); Play Possum lets Sammy walk through him; low gore plays identically; the full autopilot run reaches `clear`.
- **Done when:** the level ends on the Brute in real art with the bar, the banner, the hot dogs and `EXIT OPEN. GO.`, both tests pass, and `?test=shot` frames exist for the entrance, a swipe opening with the saw in him, and the death.

