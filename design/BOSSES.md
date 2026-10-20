# The two boss fights: THE RINGMASTER and THE BRUTE

**Status (2026-10-20):** the first draft of the two boss fights, kept for its detail (every attack, the face table, the cells and frame map, the prompts for missing frames). The consolidated design is `ZOMBIE-ROSTER-AND-BOSSES.md`, section 4, and the owner has since decided: **the Brute is level 1's boss, after the final gauntlet wave, before the exit**, with a power-up and a chainsaw refuel or second pickup right before him; **the chainsaw cuts him any time** (so the "saw only when staggered / only in openings" ideas on both pages are superseded, and he is balanced with hit points and staggers instead); **the Ringmaster goes to level 2** (not built now; section 3 is his notes); **no low-gore work** (section 6 is superseded; the G toggle stays as it is). The old sections 7 (scope) and 8 (builder list) are dropped here: the consolidated page's plan replaces them. Written from the two boss sheets (`boss/sheet.png` = the Brute, `boss2/sheet.png` = the Ringmaster). Everything not marked Confirmed is still Proposed.

Numbers are given in game pixels (the screen is 320 wide by 224 tall; the ground line is at 192; Sammy's body is 20 wide and 30 tall; he jumps about 60 px high and runs at 110 px a second).

---

## 1. Short version

- **Yes to two distinct bosses, built in this order: the Brute first, the Ringmaster second.** The Brute is the payoff of the whole level (Bethesda Terrace, the chainsaw, your song's big finish). The Ringmaster is a smaller "learn the rules" fight in the middle. If time runs short, the Ringmaster can wait for level 2 without hurting level 1.
- **Honest cost:** two locked boss fights are the biggest piece of game work since Stage B. The first one costs the most (the enemy-type rewrite CLAUDE.md asks for, a boss health bar, floor hazards, camera lock changes, new sounds, tests, autopilot changes). The second one reuses most of that. The "smallest fun version" of each is in section 7.
- **The chainsaw question (#22):** the Brute is where the chainsaw shines. Keep the 20 seconds of fuel, cut the final fight from 3 waves to 2 and let the Brute cap it. His health is tuned so one tank kills him **if you rev only when he's open**. Hold the button the whole time and you'll finish him with the tail-whip, which still works, just slowly. Details in section 8.
- **Both sheets are usable as they are**, with four gaps: neither boss has a "got hit" picture (we flash the current picture white, as the joggers do today), both walk rows are half walking and half turning (so the walk loop is 5 frames, not 10), the acid pictures have only one frame each, and the Brute has 17 face portraits, not 20 (counted on the sheet: 10 on one row, 7 on the next). The Ringmaster has 16. Prompts to generate the missing pieces are in section 5.
- **Low gore:** every blood splash, the red attack arcs, the Brute's death trail and the gore in the sheets themselves get a tamer version. The green acid stays in both modes because you have to be able to see it to dodge it. Section 6.

---

## 2. Rules both bosses share

These keep the two fights consistent with each other and with the joggers, so the player learns one language.

- **A boss doesn't flinch.** Whip hits and chainsaw cuts take health off but never interrupt him (the joggers reel back; a boss does not). Each hit flashes him white for a tenth of a second, sprays a little blood (dust in low gore) and freezes the picture for 2 frames (the existing hit-stop, shorter than the chainsaw-kill freeze).
- **Every attack has a tell, then a hit, then an opening.** The tell is a held pose (0.4 to 0.6 seconds) with its own sound. The opening is a held pose after the attack (0.6 to 1.2 seconds) during which **touching him doesn't hurt** and he can't start anything. Openings are when you hit him. They're drawn with the same "off balance" pose each time so the player learns "arms out = go".
- **Touching a walking or attacking boss hurts**, like the joggers today. Touching a stuck, dizzy, staggered, confused or dying boss doesn't (except the Brute's death crawl, which is a deliberate last scare).
- **Play Possum works on bosses, with limits.** Dropping dead within 96 px of a walking boss confuses him: he stops and looks around with a "?" **for as long as Sammy stays down** (up to the 3 s limit, exactly the jogger rule today: confused until Sammy gets up), and when Sammy gets up the boss ignores him for 1.5 s, also as joggers do. Touching a confused boss doesn't hurt. That's the way out when you're cornered: play dead, get up, walk past him. An attack that already started still finishes (same rule as joggers), so it isn't a panic button. (Where the sections below say "confused for 1.2 s", read "confused until Sammy gets up, 1.2 s being the typical case".)
- **Lying flat also dodges any attack that swings high.** Sammy's play-dead box is 14 px tall; his standing box is 30. Attacks marked "high" below hit from 20 px above the ground upward, so a lying Sammy is under them. Attacks marked "low" reach the floor and hit him anyway. Each boss has one of each, so the player has to read which is coming.
- **Acid is a floor hazard:** it burns a standing, running or lying Sammy, the trash lid doesn't block it, there's no knockback (so you aren't flung into the next puddle; the usual 0.2 s hurt flinch still plays), and the usual 1 second of invulnerability follows. Puddles time out; nothing is permanent.
- **Phases.** At half health the boss staggers for about a second (a free opening), his face in the health bar changes and his attacks get a little faster. The Brute also has an enrage at 30%.
- **Boss health bar.** A strip under the top bar: a 32×32 portrait at the left (cut from the sheet's face row), the boss's name, and a 120 px bar with a tick every few hits. The portrait changes with health, winces for a quarter second after each hit, and gets a special face for confused, enraged and dead (section 4.4). Phones: it sits inside the picture, so it's already inside the safe area.
- **Music:** both fights use the gauntlet music slot (`music-level-01-gauntlet`, which already exists in `assets.js` and falls back to your theme song). A separate optional boss track id can be added to the list later with no code change beyond one line.
- **Camera lock:** the fight happens on one screen with the camera held still and a wall each side, exactly like the gauntlet today. The Ringmaster gets velvet ropes on brass posts (he's a circus act); the Brute uses the Bethesda arena that exists.
- **Dying at a boss** puts you back at a checkpoint just before the fight, with the boss reset at full health. A beaten boss stays beaten for the rest of that run (today the game recreates every enemy past the checkpoint on respawn, so this needs a small "bosses defeated" memory added).
- **No luck.** The game's rules have no random numbers (that's what keeps the tests repeatable), so each boss picks attacks by distance and a fixed cycle, never by chance. Players can learn the cycle; that's a feature in a 16-bit boss.

---

## 3. THE RINGMASTER (mid-level mini-boss)

**Who:** a tall, thin zombie in a torn red tailcoat and top hat, with curved blade claws and chains hung with bells. He's a showman. Everything he does is a performance, and he's about to die for it.

**Where:** screen 7 (x 1920 to 2240), the flat stretch right after the hot dog cart and the vendor. Today that screen holds three joggers (x 2080, 2112, 2144) and the "C: PLAY DEAD" prompt. Proposed: the three joggers go (he replaces them), the prompt moves 100 px earlier (x 1820 to 1915) so you read it on the way in, and a new checkpoint "C1B" goes at x 1900 so a death costs you 2 seconds, not the walk from C1 at 1264. The hot dog cart just before is the "heal up before the boss" moment, which it already is by accident.

**Why he's here:** he teaches the boss language before the finale, with the tail-whip only (the chainsaw is on screen 11, after him): watch the tell, hit in the opening, lie flat under a high swing, jump a low one, and use Play Possum to get out of a corner. He also delivers a 45–75 second set piece at the midpoint of a 3–5 minute level, which is where a level like this sags today.

### 3.1 Size and boxes

| Thing | Value |
|---|---|
| Height on screen | about 84 px with the hat (the sheet figure is ~190 picture px; shared scale ≈ 0.44) |
| Body box (what the whip and saw hit, and what hurts to touch) | 24 wide × 72 tall above the feet (the hat doesn't count) |
| Crawl box (during the lunge and the death crawl) | 40 wide × 28 tall |
| Walk speed | 45 px/s (slower than a chasing jogger's 60; Sammy is 110, so you can always get away from him) |
| Health | **12 tail-whip hits** (MVP: 8). Phase 2 starts at 6. |
| Fight length, first clean clear | about 60 s; a good player about 40 s |

### 3.2 Attacks

**A. CLAW SLASH (close range, high).** Used when Sammy is within 56 px.
- **Tell (0.40 s; phase 2: 0.30 s):** he plants his feet and raises both claws, blades catching the light (sheet row 2, picture 1). Sound: a metal scrape.
- **Step (0.10 s):** a lunge step forward of 20 px (row 2, picture 2, the one with the dust).
- **Hits (0.25 s):** two slashes, pictures 3 and 4 of row 2 (the ones with the red arcs), 8 frames a second. Hit box: 8 to 48 px in front of his feet, from 20 px to 48 px above the ground. **High:** a lying Sammy is under it.
- **Phase 2 adds a third swing (0.125 s):** the overhead (row 2, picture 5), hit box 8 to 40 px in front, floor to 56 px up. **Low:** it catches a lying Sammy. Since playing dead takes at least half a second, a Sammy who dropped for the first two swings can't get up in time. The lesson: in act two, the same tell gets a new ending, so back off instead.
- **Opening (0.80 s; phase 2: 0.60 s):** arms down, chest heaving (row 2, picture 6). Whip him twice, three times if you were already close.
- **Safe responses:** step back (he reaches 68 px from where he started; from the 56 px trigger edge, a quarter second to react leaves 0.15 s of tell in phase 1, 16 px of retreat, which is enough with 4 px to spare; in phase 2 the tell is 0.30 s and it's 6 px, so phase 2 wants you to react to the *bells* and the walk, not the claws); or play dead (phase 1 only); or jump straight up at the second swing and come down on the opening (the jump clears the high swing by about 10 px at the top, so it's the stylish one, not the safe one).

**B. ACID SPRAY (mid range, high, then floor hazard).** Used when Sammy is 64 to 160 px away, and in any case every third attack.
- **Tell (0.60 s; phase 2: 0.45 s):** he throws his arms up like a ringmaster introducing an act; the chains and bells shake (row 3, picture 1). Sound: bells. This is the one tell the player hears before seeing.
- **Spray (0.60 s; phase 2: 0.90 s):** row 3, picture 4, the spraying pose. The stream is a hazard box 112 px long in front of him, 18 to 34 px above the ground. **High:** a lying Sammy (14 px tall) is under it with 4 px to spare. A standing Sammy is hit. A jump clears it only for about half a second, which is less than the spray lasts, so jumping is for players who were near the far end anyway.
- **Puddles:** three acid splats land at 40, 72 and 104 px in front of him (the splat pictures on the sheet, then the green smoke looping over them), each 24 px wide, lasting 4 s (phase 2: 6 s). They burn anyone who touches them, lying or standing. They cut the 272 px of floor into pieces for a while, which is the point: you can't just hide at one end.
- **Opening (0.70 s):** hunched, claws down, coughing (row 3, picture 2). Run in and whip.
- **Safe responses:** play dead where you stand (the easy answer, and the game just taught it on the way in); or be more than 112 px away when it fires; or, if you're close, jump over the stream toward him and whip from the far side after it stops. Then don't walk through the puddles.

**C. LUNGE (phase 2 only, low).** Used when Sammy is more than 96 px away, every other time he'd otherwise walk.
- **Tell (0.50 s):** he bends double, hands to the floor, hat tipping (row 4, picture 10 then picture 9). Sound: a growl.
- **Scuttle (up to 1.2 s):** he drops to all fours and comes at you at 170 px/s, using row 4 pictures 1, 2, 3 and 5 as a 4-frame loop at 12 fps. His box is the 40×28 crawl box, so he hurts anything he runs into. He stops when he hits the rope, or 24 px past Sammy.
- **Dodge:** jump over him (he's 28 px tall; the jump is 60). **Playing dead fails here:** he runs you over. That's the contrast with the spray, learned the hard way exactly once.
- **Opening:** if he hit the rope, he sprawls (row 4, picture 4) for 1.0 s, the longest opening in the fight; if he stopped short, he gets up through pictures 7 and 9 in 0.6 s.

**Stagger at 6 health ("act two"):** he folds, hat askew (row 4, picture 10) for 1.0 s, safe to touch and worth two whips; the health-bar face changes; banner "ACT TWO, RAT."; he opens act two with a spray straight away.

**Confused (Play Possum):** arms up, looking left and right (row 3, picture 1) with a "?" for 1.2 s.

**Death (health 0):** the whole of row 4 played in this order, 10 frames at 4 fps (2.5 s): picture 10 (bent double), 9, 7 (on one knee), 8, 1, 2, 3 (crawling 24 px toward Sammy, harmless), 5 (one last push), 4 (sprawled), 6 (flat), then held flat for 1.5 s. Full gore: a green pool spreads under him and the hat rolls off. Low gore: he sinks into the path, as chainsawed zombies do today. Lines: "SHOW'S OVER." over him; a second later "TOUGH CROWD." over Sammy.

### 3.3 Attack cycle (no luck involved)

He walks toward Sammy. When he arrives at a decision point (every 1.2 s of walking, or right after an opening ends):
1. Sammy within 56 px: slash. Else Sammy 64–160 px: spray. Else: walk (phase 2: every other time, lunge).
2. Every third attack is a spray regardless of distance, so the puddles keep coming.
3. Phase 2 shortens the tells by a quarter and the openings by a quarter, and adds the third swing and the lunge.

### 3.4 What it teaches, in order
1. Tells before hits; openings after. 2. Lie flat under high things. 3. Acid on the floor is a clock, not a wall. 4. Act two: don't trust the old answer; read the arms. 5. Jump the low thing. 6. Cornered? Play dead, get up, walk past.

### 3.5 Lines (widths in px with the game's font; the 16-character limit is 66 px)
- Entrance banner (one-off, centred over the screen): **"THE RINGMASTER. DINNER IS SERVED."** (136 px, fits the 312 px banner rule.)
- Taunts, floated over him at the start of every third tell: **"STEP RIGHT UP."** (55), **"NO REFUNDS."** (45), **"FEED THE SHOW."** (57).
- Act two banner: **"ACT TWO, RAT."** (53). Death: **"SHOW'S OVER."** (49). Sammy, a second later: **"TOUGH CROWD."** (49).
- All of these use only letters the font has (checked against the font's character list).

### 3.6 Reward
- The velvet ropes drop; two hot dogs land where he died (heal two of three hearts; the third is at the cart behind you if you left one).
- The checkpoint at 1900 is already yours, so the pond screen and the walk to C2 are the only things between you and the second half.
- **Optional gag (cheap, cosmetic only):** his top hat lands on Sammy and he wears it for the rest of the level ("NICE HAT.", 36 px). Drawn like the trash lid overlay, it needs a head point in each of Sammy's 13 strips, which is a small drawing-side table and no rules change. It would tilt on the four-legged crawl, which is funny on its own.

### 3.7 The chainsaw and the Ringmaster
He's before the saw, so he's a whip fight by design: that's what makes the saw feel like a reward 4 screens later. If you'd rather he had the saw, the alternative is moving the chainsaw pickup to screen 6 (by the cart) and lowering screens 9–11 to match, which turns the whole second half into saw time and weakens the Brute's reveal. I'd keep him whip-only.

---

## 4. THE BRUTE (final boss, Bethesda Terrace)

**Who:** a huge bloated zombie in spiked gauntlets and chains, guts out, mouth full of acid. He ate the other zombies. He's slow, he's wide, and he does not stop.

**Where:** the Bethesda arena that exists (x 3520 to 3840; floor from 3528 to 3800, so 272 px of room). Proposed: the gauntlet drops from 3 waves (2, 3, 4 joggers) to 2 (2 and 3), and **the Brute is the third "wave"**. The top bar reads "WAVE 1/2", "WAVE 2/2", then the boss bar replaces it (today's "WAVE n/3" text and the `gauntlet.waves` list change together, otherwise the HUD would print 4/3).

**Entrance:** a second after wave 2 dies, the screen shakes, the banner reads "THE BRUTE. HE ATE THE OTHER ZOMBIES." and he walks out of the fourth arch (x 3744) toward the camera using the two back-view walk pictures (row 1, pictures 6 and 7) for 0.6 s, turns (picture 8, 0.2 s), and roars with his arms wide (row 3, picture 3) for 0.8 s. Then he comes.

### 4.1 Size and boxes

| Thing | Value |
|---|---|
| Height on screen | about 85 px (the sheet's shared scale is 0.471, which gives 89; I'd nudge it to 0.45 so the wide attack poses need less squeezing into 128 px cells) |
| Body box | 44 wide × 80 tall above the feet |
| Walk speed | 32 px/s; enraged 48 (Sammy is 110: you're never outrun, only cornered by the walls) |
| Health | **30** (MVP: 24). Stagger at 15. Enrage at 9. |
| Fight length with the chainsaw used well | 35–50 s. Tail-whip only: about 2 minutes (see 4.6) |

He can't be jumped over (80 px tall, 60 px jump). Getting past him is done on purpose: through him during a stuck/dizzy opening, or with the play-dead trick. Being cornered costs a hit, not a life: after a hit you're invulnerable for a second, which is enough to get through him.

### 4.2 Attacks

**A. SWIPE (close, low, big knockback).** Used when Sammy is within 64 px in front of him.
- **Tell (0.45 s; enraged 0.30 s):** he draws the gauntlet arm back and points at you with the other (row 2, picture 1). Grunt.
- **Step (0.10 s):** 24 px forward (row 2, picture 2).
- **Hits (0.30 s):** three swings at 10 fps: the big side arc, the overhead, the low arc (row 2, pictures 5, 6, 7). Hit box 8 to 64 px in front, floor to 64 px up. **Low:** the last swing scrapes the ground, so lying flat doesn't work. A hit knocks Sammy back twice as far as a jogger does (240 px/s instead of 120): swatted across the terrace.
- **Opening (0.90 s; enraged 0.60 s):** off balance, reaching (row 2, picture 4). Chainsaw: about 7 cuts. Whip: 2–3.
- **Safe response:** back off. The reach is 88 px from where he started the tell. You can't jump this one (the box goes to 64 px and the jump tops out at 60 for an instant). Don't be in front of him when his arm goes back.
- **Tuning note:** at the 64 px trigger edge, a player who needs a quarter second to see the arm go back has 0.20 s of tell left in phase 1 (22 px of retreat: 64 + 22 = 86, just short of 88, so a step back plus the jogger-style 10 px body half-width saves you). Enraged, the tell is 0.30 s, which leaves 0.05 s and 6 px: backing off from the edge fails. That's a knob, not an accident: either the enraged tell stays at 0.35 s, or the step shrinks to 16 px when enraged. Suggested: the 16 px step, so the enrage still *looks* faster.

**B. SLAM (mid range, floor shockwave).** Used when Sammy is 64 to 160 px away and the slam isn't on its 4 s cooldown.
- **Tell (0.50 s; enraged 0.35 s):** both fists over his head (row 3, picture 1). Chains clank.
- **Hit (0.15 s):** fists into the stone with the arc and the dust (row 3, picture 2). Direct hit box 8 to 56 px in front, floor to 40 px up. **Two shockwaves** leave his feet at 160 px/s, one each way, 16 px wide and 10 px tall, running along the floor to the walls (gone within 1.7 s). They hit anyone on the ground, standing or lying. Screen shake 0.3 s; the big dust picture from the sheet under his fist.
- **Enraged:** a second pair of waves follows 0.35 s after the first. One jump (0.73 s in the air) clears both if you leave the ground as the first wave is about 30 px away. That timing is the enrage's test.
- **Stuck (1.00 s; enraged 0.70 s):** his fist is buried in the terrace (row 2, picture 3, the ground-punch picture). Safe to touch, the best time to run past him, and 8 chainsaw cuts.
- **Safe response:** jump. Any jump clears a 10 px wave. If you're in front of him, step back first (the direct hit box).

**C. SPIN (close, high, hits both sides).** Used when Sammy is behind him within 56 px, so standing at his back isn't free.
- **Tell (0.60 s; enraged 0.40 s):** one arm up, roaring (row 3, picture 4). The roar is a distinct sound.
- **Spin (0.20 s):** row 3 picture 2 shown twice, the second time mirrored, 10 fps (a one-picture spin reads fine at this size). Hit box 56 px each side, 20 to 72 px up. **High:** lie flat and the gauntlets go over you.
- **Dizzy (1.20 s; enraged 0.80 s):** arms wide, swaying (row 3, picture 3). The longest opening: 10 cuts.
- **Safe response:** play dead where you are, or be 60+ px away.

**D. ACID VOMIT (area denial).** Every fourth attack (enraged: every third), aimed at Sammy's side.
- **Tell (0.60 s; enraged 0.45 s):** he doubles over, mouth gaping (row 3, picture 3, the same arms-wide pose as the dizzy, but with a long wet gurgle: the sound is the tell; see the missing-frames list for a better one).
- **Stream (1.00 s; enraged 1.30 s):** row 3, picture 5, the vomiting pose. Hazard box 24 to 144 px in front, 24 to 44 px above the ground. **High:** lying flat clears it by 10 px; standing takes it.
- **Puddles:** three, at 48, 88 and 128 px in front, 28 px wide, 5 s each (enraged 7 s), with the green smoke rising. Because he aims at you, the puddles land between the two of you. With 272 px of floor, a fresh set eats 84 px of it for a few seconds.
- **Opening (0.50 s):** the vomit pose held, dripping. Short.
- **Safe response:** play dead (the stream is over you), then get up before he moves; or be more than 144 px away.

**Stagger at 15 health:** he drops, clutching his belly (row 4, picture 1) for 0.8 s. Safe to touch. The face changes. Grunt, no banner.

**Enrage at 9 health:** he goes down on his knees and roars (row 4, picture 10) for 1.0 s, screen shake, banner **"HE'S PISSED NOW."**, the health-bar face becomes the snarl. After it: tells 30% shorter, openings a third shorter, walk 48, double shockwaves, longer vomit, vomit every third attack. Drawing only: the red arcs get a brighter edge.

**Confused (Play Possum):** he stops in the first walk picture with a "?" for 1.2 s. Walking through him then is the intended escape from a corner.

**Death (health 0):** row 4 in this order at 6 fps: picture 1 (he drops), pictures 2 to 8 (he crawls toward Sammy at 24 px/s for 1.2 s, **and this still hurts to touch**: the last scare), picture 10 (up on his knees for a last roar), picture 9 (flat), held 1.5 s. Line **"BIG FUCKER DOWN."** when he goes flat. Then the gag: three hot dogs bounce out of him the way they spill from the cart, with the banner **"HE HAD HOT DOGS IN HIM."** (he ate the vendor). Low gore: the hot dogs still drop, there's just no trail and he sinks. Then the gate opens as today: "EXIT OPEN. GO."

### 4.3 Attack cycle (fixed, no luck)

He walks at Sammy. At each decision point (every 1.0 s of walking, or when an opening ends):
1. Count attacks. Every 4th (enraged: 3rd) is a vomit.
2. Else: Sammy behind him within 56 px: spin. Sammy in front within 64 px: swipe. Sammy 64–160 px and the slam is off cooldown: slam. Else walk (he never walks for more than 3 s without a slam, so a player who runs away is still under pressure).
3. Enraged: the slam cooldown drops from 4 s to 2.5 s.

### 4.4 The health bar and the 17 faces

The sheet has 17 portraits: 10 on the fifth row (call them A1–A10) and 7 on the sixth (B1–B7). We don't need all of them; a face for each state is enough, the rest are spares:

| When | Face |
|---|---|
| 30–22 health | A9 (steady glare) |
| 21–16 | A7 (angry) |
| 15–10 (after the stagger) | A2 (teeth bared) |
| 9–1 (enraged) | A1 and B1 alternating at 4 fps (snarling) |
| For 0.25 s after any hit | A3 (eyes shut) |
| Confused by Play Possum | B7 (the dumb look) |
| Dead | A5 (head back), then B6 |

Ringmaster (16 faces: A1–A9 on his fifth row, B1–B7 on the sixth): 12–9 A1 (glowing grin); 8–7 A5 (snarl); 6–4 A7 (roar); 3–1 A2 (drooling); hit B2 (wince); confused B3 (squint); dead B7 (head down, tongue out).

**Where it goes:** a strip just under the 16 px top bar: portrait 32×32 at (4, 18), the name at (40, 20) in the small font, the bar at (40, 28), 120 px wide and 6 px tall (the Brute: 4 px per hit, a tick every 5; the Ringmaster: 10 px per hit, a tick every hit). It covers only sky, and only during the fight. The portraits are imported once more at a 32×32 cell for this (the character import put them at 48×48; the HUD needs them smaller).

### 4.5 Lines
- Entrance banner: **"THE BRUTE. HE ATE THE OTHER ZOMBIES."** (145 px).
- Taunts over him at the start of every third tell: **"MEAT."** (21), **"SMALL MEAT."** (47), **"NEED. MEAT."** (46).
- Enrage: **"HE'S PISSED NOW."** (66, exactly 16 characters). Death: **"BIG FUCKER DOWN."** (66). After: **"HE HAD HOT DOGS IN HIM."** (94, banner).
- Sammy, if the saw runs dry mid-fight: the existing "OUT OF GAS. SHIT." already covers it.

### 4.6 The chainsaw and the Brute (owner question #22)

- The saw cuts every 0.12 s for 1 damage: about 8 damage a second while the blade is on him. His openings give 7 (swipe), 8 (slam), 10 (spin) and 7–8 (staggers) cuts each. **30 health is four good openings, about 3.6 s of actual revving.**
- Fuel today: 20 s, and just carrying the saw drains a quarter of that rate. Over a 50 s fight, carrying alone uses about 12 s. Rev only in the openings and you finish with 4–6 s to spare. Hold the button while walking and you run dry around the 30 s mark with half his health left, and finish with the whip.
- The whip can hit him 2–3 times per opening, so whip-only is about 12 openings, around 2 minutes of careful play. That's the "you lost the saw" fallback, long but fair; and a K.O. at the arena sends you to C2 (x 2576) with the saw back on the grass at 3300, so every attempt starts with a full tank.
- You can also cut him while backing away: the saw reaches 28 px and his body is 22 px from his centre, so there's an 18 px band where the blade touches him and he doesn't touch you. He walks at 32 px/s, so that's about 4 free cuts per approach before he's on you or you're at a wall.
- **Recommendation for #22:** neither A nor B as written. Keep 20 s of fuel and the carry drain, shrink the waves to 2 and 3, and let the Brute be the fuel sink. Option A (10–12 s of fuel) would leave even a careful player dry before he's dead (12 s of carry drain alone over a 50 s fight), which turns the finale into a whip grind. Option B's bigger waves (3, 4, 6) plus a boss would make the terrace 2–3 minutes long and bury the boss under crowd fights.

### 4.7 Reward
The level ends: the gate opens, the clear screen plays. Proposed extras: the three hot dogs (a full heal for the victory lap), and a "BOSSES 2/2" line on the clear screen next to the zombie count.

---

## 5. The sheets: cells, feet points, frame map, what's missing

### 5.1 Cells and feet points

Both sheets are 1536×1024, black background, painterly (the importer flagged ~229,000 colours and no outline on the Brute; it adds its own outline and reduces to a 14-colour shared palette, and its report says READY for every strip). One shared scale per character so he's the same size in every picture; separate strips for the effects and the faces on their own palettes.

**The rule that matters (the Sammy lesson):** every strip of one character must put his feet at the same spot on screen, so wide cells must have their feet column where the body is, not at the cell's centre. Pictures that have a long effect to one side (the vomit stream, the big red arcs) either get a feet column off-centre or get the effect cut off and drawn separately.

| Strip | Cell | Feet point | Note |
|---|---|---|---|
| Brute walk, confused, turn | 96×96 | (48, 95) | 10 pictures on the sheet: 1–5 walk, 6–7 back view, 8–10 turn/side (the importer couldn't tell the facing, which fits). Walk loop = 1–5 at 8 fps; turn = 6, 7, 8 once at 10 fps. |
| Brute swipe tell/step/hits/opening, slam stuck | 128×96 | (64, 95) | Row 2 pictures 1–7. Pictures 5–7 have arcs to one side; keep the feet under the body (the importer already slid one frame 3.6 px to fit; check `compare-4x.png`). |
| Brute slam tell/hit, spin, dizzy, vomit tell | 128×96 | (64, 95) | Row 3 pictures 1–4. The importer squeezed these up to 8%; the 0.45 scale fixes that. |
| Brute vomit | 96×96 body + separate 64×48 stream effect | (40, 95) for the body | Row 3 picture 5 is 300 picture px wide with the stream. Cut the stream off and draw it as an effect at his mouth (x+40, y−64), so the body doesn't jump sideways when the animation changes. |
| Brute death, stagger, enrage | 128×96 | (64, 95) | Row 4, 10 pictures. |
| Brute faces (HUD) | 32×32 | none | 17 pictures, own palette, own smaller scale. |
| Brute dust, acid splat, acid smoke, red arcs | 128×48, 96×48, 40×56, 96×64 | centred | As the importer map already has them; the arcs are only needed if we want extra trails, since the attack pictures have arcs baked in. |
| Ringmaster walk, confused | 96×96 | (48, 95) | Row 1: 1–5 walk, 6–7 back view, 8–10 turn. Same split as the Brute. |
| Ringmaster slash tell/step/hits/overhead/opening | 128×96 | (64, 95) | Row 2 pictures 1–7 (7 is a spare slash; could be the enraged third swing instead of 5). |
| Ringmaster spray tell, spray opening, slam (unused), spray | 128×96; spray body 96×96 + separate stream | (64, 95); (40, 95) | Row 3: 1 arms-up, 2 hunched, 3 claw-slam with dust (spare: a possible extra attack), 4 spray, 5 the green smoke (effect). |
| Ringmaster lunge, kneel, stagger, death | 128×96 | (64, 95) | Row 4, 10 pictures: 1–3 and 5 crawl, 4 sprawled, 6 flat, 7–8 kneeling, 9–10 bent over. |
| Ringmaster faces (HUD) | 32×32 | none | 16 pictures. |

Sim boxes (section 3.1 and 4.1) are deliberately narrower than the pictures: the Brute's 44 px body box inside a 96 px cell means his spikes and chains don't count as "him", which feels fair.

### 5.2 Frame map, state by state

Timing rule from CLAUDE.md: each config timing must equal frames ÷ fps of its strip (a test checks it). So every multi-frame state below is its own small strip with a whole-number fps, and every held pose is a one-frame "hold" strip (like the cart's upright picture), whose length is a plain config number.

**Brute**

| State | Sheet pictures (row, columns) | Frames | fps | Time | Plays |
|---|---|---|---|---|---|
| walk | 1: 1–5 | 5 | 8 | 0.625 loop | loop |
| turn | 1: 6, 7, 8 | 3 | 10 | 0.30 | once |
| enter (back view) | 1: 6, 7 | 2 | 4 | 0.50 | loop, then turn |
| confused | 1: 1 | 1 | hold | 1.20 | hold |
| swipe tell | 2: 1 | 1 | hold | 0.45 / 0.30 | hold |
| swipe step | 2: 2 | 1 | hold | 0.10 | hold |
| swipe hits | 2: 5, 6, 7 | 3 | 10 | 0.30 (hits on all three) | once |
| swipe opening / dizzy | 2: 4 | 1 | hold | 0.90 / 1.20 | hold |
| slam tell | 3: 1 | 1 | hold | 0.50 | hold |
| slam hit | 3: 2 | 1 | hold | 0.15 | hold |
| slam stuck | 2: 3 | 1 | hold | 1.00 | hold |
| spin tell | 3: 4 | 1 | hold | 0.60 | hold |
| spin | 3: 2, then 2 mirrored | 2 | 10 | 0.20 | once (the mirrored copy is baked into the strip at import time, since the game flips a whole sprite by which way he faces, not frame by frame; the importer map lists the same picture box twice) |
| vomit tell | 3: 3 | 1 | hold | 0.60 | hold |
| vomit | 3: 5 (body only) | 1 | hold | 1.00 / 1.30 | hold; stream effect drawn separately |
| stagger (half) | 4: 1 | 1 | hold | 0.80 | hold |
| enrage roar | 4: 10 | 1 | hold | 1.00 | hold |
| death | 4: 1, 2, 3, 4, 5, 6, 7, 8, 10, 9 | 10 | 6 | 1.67, then hold 1.5 | once |
| faces | 5: 1–10, 6: 1–7 | 17 | – | – | by state |

**Ringmaster**

| State | Sheet pictures (row, columns) | Frames | fps | Time | Plays |
|---|---|---|---|---|---|
| walk | 1: 1–5 | 5 | 8 | 0.625 loop | loop |
| turn | 1: 6, 7, 8 | 3 | 10 | 0.30 | once |
| idle / taunt / bow / confused | 3: 1 | 1 | hold | varies | hold |
| slash tell | 2: 1 | 1 | hold | 0.40 / 0.30 | hold |
| slash step | 2: 2 | 1 | hold | 0.10 | hold |
| slash hits | 2: 3, 4 | 2 | 8 | 0.25 | once |
| slash overhead (phase 2) | 2: 5 | 1 | 8 | 0.125 | once |
| slash opening | 2: 6 | 1 | hold | 0.80 / 0.60 | hold |
| spray tell | 3: 1 | 1 | hold | 0.60 / 0.45 | hold |
| spray | 3: 4 (body only) | 1 | hold | 0.60 / 0.90 | hold; stream drawn separately |
| spray opening | 3: 2 | 1 | hold | 0.70 | hold |
| lunge tell | 4: 10, 9 | 2 | 4 | 0.50 | once |
| lunge scuttle | 4: 1, 2, 3, 5 | 4 | 12 | 0.33 loop | loop |
| lunge sprawl (hit the rope) | 4: 4 | 1 | hold | 1.00 | hold |
| lunge get-up | 4: 7, 9 | 2 | 4 | 0.50 | once |
| stagger (act two) | 4: 10 | 1 | hold | 1.00 | hold |
| death | 4: 10, 9, 7, 8, 1, 2, 3, 5, 4, 6 | 10 | 4 | 2.50, then hold 1.5 | once |
| faces | 5: 1–9, 6: 1–7 | 16 | – | – | by state |
| effects | 5: splat ×2, drips ×2, smoke ×4; 6: dust ×1, red arcs ×3 | | | | |

### 5.3 What's missing on the sheets, and what to ask the image tool for

Use the importer's own advice as the base of every prompt: *"same character as the attached sheet, side view facing right, feet on one ground line, black background, chunky pixel art at about 3x scale, flat colours, about 12 colours, 3-step shading, no dithering, no painterly texture, 1 px dark outline around the figure, no detached particles, sparks or slime flecks outside the body"*. Then add:

| Gap | Who | Prompt wording to add |
|---|---|---|
| **Got-hit picture** (neither sheet has one; we flash white meanwhile) | both | "2 frames of the same character flinching from a hit to the shins: head snaps back, arms fly up, feet planted; same size as the walk frames" |
| **Walk loop is only 5 forward frames** (the other 5 are back views and turns) | both | "6-frame walking cycle, side view, facing right, feet on one line, the same character, no turning frames" (optional: the 5 we have loop acceptably) |
| **Acid stream has one frame** | both | "3 frames of the same acid spray pose, the stream in three slightly different shapes (thick, thin, breaking into drops), the body identical in all three" |
| **Brute's vomit tell shares a pose with the dizzy** | Brute | "1 frame: the same character doubled over, cheeks bulging, hands on his knees, mouth shut, green drips at the lips" |
| **Brute spin** (we mirror one picture) | Brute | "3 frames of the same character spinning on the spot with both gauntlets out, seen from the side, back and side again" |
| **Stuck fist in the ground** exists (row 2, picture 3) but he's leaning; a straighter one reads better as "stuck" | Brute | optional: "1 frame: fist buried in the ground, pulling, straining, the other arm out for balance" |
| **Chains as an attack** | Brute | nothing on the sheet shows a chain swing or throw, so no chain attack in v1. If you want one later: "3 frames: whips the chain from his belt in a circle over his head; 1 frame: the chain flung forward full length with a hook at the end" |
| **Ringmaster lunge** reuses the death crawl frames | Ringmaster | optional: "4 frames of the same character scuttling on all fours, fast, claws forward, hat clamped on" |
| **Ringmaster entrance / bow** reuses the arms-up pose | Ringmaster | optional: "1 frame: a deep showman's bow, hat swept off in one hand" |
| **Low-gore versions** | both | "the same sheet with no blood: wounds are dark bruises and stitches, the belly is closed and stitched, no red splashes, no red arcs (pale grey motion arcs instead); the green acid stays" (or see section 6 for the recolour route) |
| **A 32×32 portrait set** is just the existing faces at a smaller import scale | both | nothing to generate |

---

## 6. Low gore: what changes (superseded 2026-10-20 by owner answer 6: no low-gore work; kept for history)

The rule stays as it is: `S.gore` is drawing only, the fight plays identically either way, and the tests check both.

| Full gore | Low gore |
|---|---|
| Hits: red spray off the boss, smears on the stone | Dust puff and a white flash |
| Red attack arcs (baked into the attack pictures) | A recoloured copy of the strips (`-lowgore` files) with the arc reds mapped to pale grey, which the importer's colour control can do from the same sheet |
| The Brute's guts-out belly and blood-soaked skin; the Ringmaster's blood-streaked coat | Recoloured strips: reds to bruise purple and dirt brown. The belly stays open (he's a zombie), unless you'd rather have a regenerated "stitched" sheet (prompt in 5.3). Your call: this is the one place where "low gore" and "ugly zombie" overlap. |
| Death: the Brute's crawl leaves a blood trail, ends in a pool; the Ringmaster ends in an ichor pool, hat rolling | No trail or pool; both sink into the ground as chainsawed zombies do today; the hat still rolls |
| Hot dogs bounce out of the Brute | They still do (it's a joke, not gore); the "HE HAD HOT DOGS IN HIM." banner stays |
| Acid stream, puddles, smoke | **Unchanged.** It's a hazard you have to see. It uses its own acid greens (three new palette colours), **not** the reserved ichor colours, so the gore test and the rule that only gore uses those colours both still hold. The importer already keeps the sheet's acid off the ichor colours. |
| Lines "BIG FUCKER DOWN." etc. | Unchanged (words aren't gore) |

---

## 9. Things only you can decide

*Answered 2026-10-20 (Confirmed, see `OWNER_DECISIONS.md` 23 to 30): 1 = the Brute now, the Ringmaster in level 2; 2 = the saw cuts the Brute any time and he always has a saw for the fight (a refuel or second pickup in the arena), so the fuel-sink idea is off; 3 = no low-gore work at all. Items 4 to 7 are still open (4 and 7 only matter for level 2 now).*

1. ~~**Two bosses in level 1, or the Brute now and the Ringmaster in level 2?** (Suggested: both, Brute first.)~~ Answered: the Brute now, the Ringmaster in level 2.
2. ~~**Chainsaw (#22):** keep 20 s and let the Brute be the fuel sink, with 2 waves instead of 3? (Suggested: yes.)~~ Answered: the saw cuts him any time; a second pickup or refuel inside the arena.
3. ~~**Low gore for the Brute's open belly:** recolour (belly stays open) or a regenerated stitched sheet? (Suggested: recolour, it's cheaper and still reads as "low".)~~ Answered: no low-gore work.
4. **The hat gag** (Sammy wears the Ringmaster's top hat afterwards): yes or no? (Suggested: yes, it's cheap and it's your kind of joke.)
5. **The Brute's death crawl still hurting** (a last scare): fine, or too mean? (Suggested: keep; it's 1.2 s and you've just been taught to back off.)
6. **Portrait placement:** under the top bar (suggested) or a strip along the bottom over the earth?
7. **Taunt lines:** keep, change, or add your own (16 characters or fewer for the floating ones; the one-off banners can be longer, up to about 75 characters).
