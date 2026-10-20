# Asset metadata — The Brute (level 1 boss, example)

> **EXAMPLE ONLY — planning spec, not a finished asset.** Run the scanner to see which files exist. Don't copy this into assets/ until every TBD is filled in.

The boss of level 1 (Confirmed by the owner, 2026-10-20: he comes after the final gauntlet wave, before the exit). The design is `design/ZOMBIE-ROSTER-AND-BOSSES.md` section 4 and `design/BOSSES.md` section 4; the numbers the game uses are the `brute` block in `game/src/config.js`. Everything here is **Proposed** except where those pages say Confirmed.

---

- Asset ID: `enemy-zombie-brute`
- Display name: The Brute
- Category: enemy (boss)
- Files and purpose: see **Planned files** (all planned — not yet supplied; the strips are being cut from the owner's boss sheet and will be installed later).
- Readiness: TBD
- Visual description: a huge bloated zombie, pale sickly olive-yellow skin, guts out, spiked iron gauntlets and chains, navy vest and pants, mouth full of acid. He ate the other zombies. Contrasting scheme: nothing like Sammy's grey-brown and red, nothing like the four walkers.
- Intended role in the game: the final fight on Bethesda Terrace. Slow, wide, never flinches; four attacks on a fixed cycle (swipe, slam with floor shockwaves, spin, acid vomit), a stagger at half health, an enrage at 9 hit points, a death crawl, three hot dogs out of him.
- Camera/view: side view, facing right; mirrored by the game.
- Relative size: about 86 px tall (the sheet at scale 0.45). Body box 44×80 for the rules; the spikes and chains don't count.
- Transparent background: yes, 1-bit transparency, 1 px dark outline.
- Source/creator/license: TBD (owner's sheet, made with an image tool; also record in `design/ASSET_SOURCES.csv`).

## Planned files (planned — not yet supplied)

All body strips put his feet on row 95. 96-wide cells have the feet column at x 48, 128-wide ones at x 64 (the wide attack poses), the vomit body at x 40. Several poses share one strip; the game picks the frame from his state and holds it for the time in `config.js` (so these strips are `frame` mode, not clocked, except the walk loop and the death).

| File (planned — not yet supplied) | Size | Purpose |
|---|---|---|
| `brute-walk-strip-v01.png` | 6 × 96×96 (576×96) | Walk loop, 8 fps. Frame 0 held = confused ("?"). |
| `brute-swipe-strip-v01.png` | 6 × 128×96 (768×96) | 0 tell (arm back, pointing), 1 step, 2–4 the three swings (10 fps, hit on all three), 5 the opening (off balance) |
| `brute-slam-strip-v01.png` | 3 × 128×96 (384×96) | 0 tell (fists over his head), 1 fists into the stone, 2 stuck (fist buried) |
| `brute-spin-strip-v01.png` | 4 × 128×96 (512×96) | 0 tell (one arm up), 1–2 the spin (10 fps), 3 dizzy (arms wide; also the entrance roar and the vomit tell) |
| `brute-vomit-strip-v01.png` | 1 × 96×96 (96×96) | The vomiting pose, body only (feet at x 40), held for the stream and the opening |
| `brute-vomit-stream-strip-v01.png` | 1 × 64×96 (64×96) | The acid stream, drawn with its top-left at his feet + (39, −85) so it joins his mouth |
| `brute-stagger-strip-v01.png` | 2 × 128×96 (256×96) | 0 half-health stagger (clutching his belly), 1 the enrage roar (on his knees) |
| `brute-death-strip-v01.png` | 10 × 128×96 (1280×96) | Death at 6 fps: drops, crawls (frames 1–7), up on his knees, flat; the last frame is held 1.5 s |
| `brute-faces-strip-v01.png` | 17 × 32×32 (544×32) | HUD portraits: 0–9 = A1–A10, 10–16 = B1–B7 (steady A9, angry A7, teeth A2, snarl A1/B1, hit A3, confused B7, dead A5 then B6) |
| `brute-acid-splat-strip-v01.png` | 2 × 96×48 (192×48) | Effect: a puddle landing, 8 fps, once |
| `brute-acid-smoke-strip-v01.png` | 4 × 40×56 (160×56) | Effect: green smoke rising over a puddle, 8 fps, loop (feet point at the puddle's centre) |
| `brute-blood-slash-strip-v01.png` | 3 × 96×64 (288×64) | Effect (optional): red arcs for extra swing trails, 12 fps, once |
| `brute-dust-strip-v01.png` | 1 × 128×48 (128×48) | Effect (optional): the dust under his fist on the slam |

## Animation (if applicable)
- File: one strip per animation (see Planned files — planned, not yet supplied).
- Frame width × height in pixels: 96 × 96 for the walk and the vomit body, 128 × 96 for the attacks, stagger and death; 32 × 32 faces; effect cells as listed.
- Grid columns / rows: one row per file; columns = frame count.
- Frame count and reading order: left to right, zero-based. See table.
- Padding / spacing: none.
- Pivot / feet baseline: feet on row 95 in every body strip; feet column 48 (96 wide), 64 (128 wide), 40 (vomit body). Effects: centre of the cell (the smoke: bottom-centre).
- Facing directions and whether mirroring is allowed: drawn facing right; mirrored by the game.

### Animation table (Proposed)

| Animation | Frames (zero-based) | Count | FPS | Loop / one-shot | Notes |
|---|---|---|---|---|---|
| walk | 0–5 | 6 | 8 | loop | 32 px/s (48 enraged) |
| swipe | 0–5 | 6 | held / 10 | by state | tell 0.45 s, step 0.1 s, swings 0.3 s, opening 0.9 s |
| slam | 0–2 | 3 | held | by state | tell 0.5 s, hit 0.15 s, stuck 1.0 s |
| spin | 0–3 | 4 | held / 10 | by state | tell 0.6 s, spin 0.2 s, dizzy 1.2 s |
| vomit | 0 | 1 | held | by state | tell uses spin frame 3 (0.6 s); stream 1.0 s; opening 0.5 s |
| stagger | 0–1 | 2 | held | by state | stagger 0.8 s; enrage 1.0 s |
| death | 0–9 | 10 | 6 | one-shot | 1.67 s, then held flat 1.5 s |
| faces | 0–16 | 17 | – | by state | the boss bar portrait |

## Behavior
- What this asset does: walks at Sammy; at each decision point (every 1 s of walking, or when an opening ends) picks an attack by distance and a fixed count: every 4th attack is the vomit; Sammy behind him within 56 px: spin; in front within 64 px: swipe; 64–160 px with the slam off its 4 s cooldown: slam; else walk (never more than 3 s without a slam).
- What triggers it: the arena, after the last gauntlet wave (`config.js` `gauntlet.boss`). He walks out of the arch nearest the gate; a trash lid and a chainsaw drop in at the same time (owner answer 4).
- What the player can do with it: whip him any time (1 damage), cut him with the chainsaw any time (1 per cut, owner answer 7, with the most gore), back off from the swipe, jump the shockwaves, lie flat under the spin and the acid stream, play dead to confuse him and walk past.
- Collision / hitbox intent: body 44 × 80. Swipe box 8–64 px ahead, floor to 64 up (low). Slam direct box 8–56 ahead, floor to 40 up; shockwaves 16 × 10 at 160 px/s each way. Spin 56 px each side, 20–72 up (high). Acid stream 24–144 ahead, 24–44 up (high); puddles 28 wide at 48, 88 and 128 px ahead for 5 s (7 enraged).
- Damage, reward, cooldown, or other values: 24 hit points (stagger at 12, enrage at 9); touching him hurts while he walks, winds up or swings, never in an opening; the swipe knocks Sammy back twice as far as a jogger. Reward: three hot dogs, then the exit opens.
- Required sounds / effects: `sfx-boss-grunt`, `sfx-boss-chains`, `sfx-boss-roar`, `sfx-boss-gurgle` (the four tells), `sfx-boss-swipe`, `sfx-boss-slam`, `sfx-boss-hit`, `sfx-boss-death`, `sfx-acid-spray`, `sfx-acid-burn`. Effects: shockwaves, acid puddles with smoke, the stream, blood and chunks on every saw cut.
- Missing states or assets: a got-hit picture (the game flashes him white), a true 6-frame walk cycle, real spin frames (one picture mirrored today), a vomit tell of his own (the dizzy pose is reused), extra acid stream shapes. Prompts in `design/BOSSES.md` section 5.3.

## Palette (Proposed)

Fourteen shared colours plus a 1 px outline (`#242448`): pale olive-yellow skin (`#fcd890`, `#b4b46c`, `#909048`, `#6c6c24`, `#484800`), iron (`#909090`, `#6c6c6c`, `#484848`), navy cloth (`#242448`), and his painted blood (`#b42400`, `#902424`, `#b44848`, `#240000`). The acid uses its own greens, never the reserved ichor colours.
