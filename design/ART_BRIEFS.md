# Art and sound briefs

> **Proposed (not approved).** Everything on this page is a suggestion for an artist or composer to work from. Only these facts are Confirmed by the owner: Sammy is an opossum ("he"), he wakes up in Central Park with no memory, the humans are zombies, and the game should look and sound like a 16-bit console game from that era. **New direction, Confirmed 2026-10-19:** badass action-horror with dark humour: a ferocious Sammy with a **chainsaw**, Central Park **at night** (Bethesda Terrace inspiration), gorier than before, and the owner's theme song. Mood picture: `assets/references/zombie-hunter-concept-v01.jpg` (reference only). *(Superseded: this line used to say "cartoon zombies with funny, slapstick deaths".)* Sizes, frame counts and speeds below are what the game uses **today**; changing them means changing the game too.
>
> **How gory?** This page now assumes the new suggested answer to question 1 in `design/OWNER_DECISIONS.md`: **stylized 16-bit gore** (chunky pixel blood and green ichor in the reserved colours, zombies cut in half by the chainsaw, sparks; never realistic; Sammy never bleeds), plus a **low-gore version** of every gory picture. Gore rules and colours: `design/STYLE_GUIDE.md`, "Night mood". The exact level is still the owner's call. *(Superseded 2026-10-19: this page used to assume "cartoon slapstick, no blood".)*
>
> **Tone for every brief below (2026-10-19):** zombies are **rotting and menacing**, not cute: torn clothes, grey-green or grey-blue skin, exposed teeth, a few dark wounds, but still readable cartoons with a streak of dark humour. Sammy is **ferocious**: snarling, fangs, the red bandana. Where a brief below still says "funny, not scary" or "no blood", read it with this tone; those words are marked superseded.

*Last updated 2026-10-19 (new "Zombie Hunter" tone, chainsaw brief).*

---

## Words used on this page

- **Strip:** one PNG that holds one animation. Its frames sit side by side, left to right, touching (no gaps).
- **Frame / box:** one picture in a strip. Every frame in a strip is the same size.
- **Frame numbers count from 1 on this page** (frame 1 is the leftmost). The game's code counts from 0, so its "hit frame 2" is **frame 3** here.
- **Feet point:** the pixel that sits on the ground. Written as (across, down), counting from 0 at the top-left corner of each frame. In a 48×48 frame, (28, 47) means 28 pixels in from the left, on the bottom row.
- **Speed:** frames shown per second (fps). "Total time" is how long the whole strip takes once.
- **Plays:** *loops* (repeats while it's needed) · *plays once* (then stays on its last frame until the game switches to another animation) · *holds the last frame* (plays once and keeps the last frame for as long as the move lasts) · *chosen by the game* (not animated: the game picks one frame to show).
- **Facing:** draw everything facing **right**. The game flips Sammy, the zombies and the tipping cart to face left. Pickups, the thrown hot dog and the splat are never flipped.

**Rules for every picture** (from `design/STYLE_GUIDE.md`, all Proposed): PNG at real size (don't enlarge it); every pixel fully solid or fully see-through (no soft edges); colours snapped to 0, 36, 72, 108, 144, 180, 216 or 252 on each of red, green and blue; 15 colours or fewer per file; a 1-pixel dark outline on characters, props and items, but none on the background; light from the top-left; three shades per material (dark, middle, light); dithering (a checkerboard of two colours) is fine inside a picture. Draw your own designs: no tracing or copying from other games.

---

## How to use the templates

Each planned picture has a **template**: a see-through PNG at the exact size the game needs, with faint guide marks showing the frame boxes, the feet point, the ground line, the hit or release frame and the loop edges.

1. The templates are in `templates/art-templates/`, in folders that match `assets/`. If that folder is missing or out of date, open a terminal in the `game/` folder and run `node tools/make-art-templates.mjs`.
2. Open the template that ends in `-TEMPLATE.png` (the real-size one, not a contact sheet) in a pixel-art editor, such as Aseprite or LibreSprite.
3. Draw on a new layer over it. Keep each frame inside its box, and keep the feet on the ground line in every frame where the character is standing.
4. **Erase or hide every guide mark** before you save. The guides are slightly see-through on purpose: if one is left behind, the scanner warns about "semi-transparent pixels".
5. Save the PNG with the **real name** shown below (for example `sammy-idle-strip-v01.png`) in the `assets/` folder shown. Don't keep "-TEMPLATE" in the name.
6. From the `game/` folder, run `node tools/scan-assets.mjs`. It tells you if the size is wrong (wrong-size art is not used) or if anything else looks off.
7. Add a row to `design/ASSET_SOURCES.csv` saying who made it and its license. Running `node tools/build.mjs` prints a ready-to-paste row for any file that doesn't have one.

**What the guide colours mean.** In the templates the guides are part see-through (the "see-through" column below: 0 is fully clear, 255 fully solid). On the contact sheets the same colours are drawn fully solid so they're easy to see. Every other pixel in a template is fully clear.

| Colour | Colour value (red, green, blue) | See-through | What it marks |
|---|---|---|---|
| Blue | 0, 108, 216 | 128 | The 1-pixel edge of each frame |
| Green | 0, 180, 0 | 160 | The ground line: the feet stand on this row. Only on things that stand on the ground. |
| Red cross | 216, 0, 0 | 224 | The feet point (or anchor point): the pixel at the centre of the cross. The game puts this pixel at the character's or object's position, so keep it in the same place in every frame. |
| Orange | 252, 144, 0 | 192 | The hit frame, shown as a 2-pixel thick edge (Sammy's tail-whip and the jogger's attack) |
| Purple | 180, 0, 216 | 192 | The release frame, shown as a 2-pixel thick edge (the frame where the vendor lets go of the hot dog) |
| Teal | 0, 180, 180 | 192 | The loop edges: the left and right edges of the skyline, treeline and bushes, which must join up when the picture repeats |

No guide pixel is ever fully solid, so a guide left in by mistake makes the scanner warn about "semi-transparent pixels".

**Frame numbers on the contact sheets count from 0, like the game** (the leftmost frame is 0). This page counts from 1, so frame "2 HIT" on a contact sheet is **frame 3** here.

### Contact sheets

A contact sheet is an enlarged, labelled preview of the templates, for looking at and printing. **Don't draw on a contact sheet**; the game can't use it.

| Contact sheet | What it shows |
|---|---|
| `templates/art-templates/contact-sheet-sammy.png` | Sammy's 10 strips |
| `templates/art-templates/contact-sheet-jogger.png` | The zombie jogger's 5 strips |
| `templates/art-templates/contact-sheet-vendor.png` | The zombie hot dog vendor's 4 strips, plus the thrown hot dog and its splat |
| `templates/art-templates/contact-sheet-cart.png` | The hot dog cart's 5 pictures, plus the hot dog pickup |
| `templates/art-templates/contact-sheet-lid.png` | The trash lid pickup, the lid Sammy holds, and its icon at the top of the screen |
| `templates/art-templates/contact-sheet-background.png` | The 4 background layers |
| `templates/art-templates/contact-sheet-all.png` | All 34 of the above on one page |

---

## Sammy (10 strips, plus the 3 chainsaw strips below)

Folder: `assets/characters/character-sammy/`. Templates: `templates/art-templates/characters/character-sammy/`.

> **Status (2026-10-20): all 13 Sammy strips exist as real art (`-v03.png`; the `-v02` and `-v01` files stay on disk unused, the game takes the newest).** They were cut from the owner's two master sheets plus the frames the owner generated afterwards (both made with ChatGPT image generation) with `game/tools/import-art.mjs` in character mode: one scale (0.35 game px per sheet px; 0.32 for jump, fall and land, so those big poses fit), one 15-colour palette (the 14 Sammy colours plus two steel greys for the chainsaw bar) and a 1 px outline for all 13. The owner chose the sheets' **four-legged crawl** as the run, so the run is long and low (about 30 px tall) while idle stands about 42 px. v03 added the owner's frames: three crawl in-betweens (the run now cycles forward), a real falling frame, the settled play-dead pose, the K.O. air and bounce frames and the full 8-frame chainsaw run. Still stand-ins: the victory (the sunglasses pose), the land (the fall crouch held), the chainsaw idle (one frame held); the frames still wanted, and where they slot in, are listed in `design/OPEN_TASKS.md`, "Sammy frames still wanted". New frames land as the next version number (`-v04`). The briefs below describe the ideal version and are kept for that.

**Look (set by the master sheets, 2026-10-20):** grey-brown fur, cream face, blue eye with a dark eye mask, dark rounded ears, thick pink tail with a curl, **red polka-dot bandana** with a loose knot (the dots turn to noise at game size, so it reads as plain red). *(Superseded: "grey-white fur, white face ... same cartoon style as his run strip", the look of the first, white-faced run strip, which is replaced.)* **Ferocious:** narrowed eyes, bared fangs, ears back when he attacks; a cocky grin when he wins. About 42 px tall standing (with ears); the crawl run is about 30 px. One shared 15-colour palette for all 13 strips (the importer's `palette.json`: 14 Sammy colours plus the steel greys `#b4b4b4` and `#6c6c6c` for the chainsaw bar); it is the Sammy + top-bar colour set (palette line 0).

**Feet point (28, 47)** in every 48×48 frame (idle, jump, fall, land, hurt, victory). That's 4 px right of centre, so his tail has room behind him. Wider boxes have their own feet point so his body lands in the same place: run and tail-whip **64×48** at **(36, 47)**, play-dead **64×48** at **(32, 47)**, K.O. **76×48** at **(38, 47)**, chainsaw idle and run **64×48** at **(26, 47)**, chainsaw rev **76×48** at **(26, 47)** (the lifted saw reaches 47 px in front). *(Superseded 2026-10-20, v03: land's feet point was (17, 47) in v02 because both frames lunged forward; it is (28, 47) again.)* Use the point its strip has, or he will jump sideways when the animation changes.

### Idle: `sammy-idle-strip-v01.png`
- Save as `assets/characters/character-sammy/sammy-idle-strip-v04.png` (the next version number: v03 is in the game today and the game uses the newest)
- Template: `templates/art-templates/characters/character-sammy/sammy-idle-strip-TEMPLATE.png`
- Size: **192×48** (4 frames of 48×48)
- Speed: 6 fps; total time 0.67 s. Plays: **loops**. Feet point (28, 47).
- When: standing still.
- Frames (breathing, tail sways; feet stay on the bottom row in all 4):
  1. Standing, weight even, tail curved low behind him.
  2. Breathing in: chest up 1 px, tail tip lifts.
  3. Full breath: ears perk, tail tip at its highest. Maybe a blink.
  4. Breathing out, halfway back to frame 1.

### Run: `sammy-run-strip-v01.png`: **done (v03 exists: the four-legged crawl, a forward 8-frame cycle); a new version goes beside it as `-v04.png`**
- Save as `assets/characters/character-sammy/sammy-run-strip-v04.png` (the next version number: the game uses the newest; v03 is the crawl from the master sheets with the owner's in-betweens, v02 the same crawl played out and back, v01 the old white-faced upright run, all three no longer used except v03)
- Template: `templates/art-templates/characters/character-sammy/sammy-run-strip-TEMPLATE.png`
- Size: **512×48** (8 frames of **64×48**; was 48×48 until 2026-10-20)
- Speed: 12 fps; total time 0.67 s. Plays: **loops**. Feet point **(36, 47)**.
- **Today (v03):** a four-legged crawl (the owner's choice): 5 sheet poses plus 3 in-betweens the owner generated, played as one forward cycle (v02 played the 5 poses out and back).
- When: moving along the ground. Sammy covers about 73 px during one full loop at top speed; match the step length to that so his feet don't slide.
- Frames: 1 front foot lands · 2 body at its lowest · 3 pushing off · 4 both feet in the air · 5 other foot lands · 6 lowest · 7 pushing off · 8 in the air. Feet touch the bottom row on the landing frames. Tail streams behind and bobs against the body.

### Jump (going up): `sammy-jump-rise-strip-v01.png`
- Save as `assets/characters/character-sammy/sammy-jump-rise-strip-v04.png` (the next version number: v03 is in the game today and the game uses the newest)
- Template: `templates/art-templates/characters/character-sammy/sammy-jump-rise-strip-TEMPLATE.png`
- Size: **96×48** (2 frames of 48×48)
- Speed: 10 fps; total time 0.2 s. Plays: **holds the last frame** while he rises. Feet point (28, 47), but the feet may leave the bottom row.
- Frames:
  1. Take-off: legs pushing down, body stretched upward, front paws up.
  2. Rising: legs tucked, tail trailing down. Held until he starts to fall.

### Fall: `sammy-fall-strip-v01.png`
- Save as `assets/characters/character-sammy/sammy-fall-strip-v04.png` (the next version number: v03 is in the game today and the game uses the newest)
- Template: `templates/art-templates/characters/character-sammy/sammy-fall-strip-TEMPLATE.png`
- Size: **96×48** (2 frames of 48×48)
- Speed: 10 fps; total time 0.2 s. Plays: **loops**. Feet point (28, 47); feet may leave the bottom row.
- Frames:
  1. Paws and legs spread, fur and tail blown upward, eyes wide.
  2. Same pose, with the fur tufts and tail tip flicked the other way (a flutter).

### Land: `sammy-land-strip-v01.png`
- Save as `assets/characters/character-sammy/sammy-land-strip-v04.png` (the next version number: v03 is in the game today and the game uses the newest)
- Template: `templates/art-templates/characters/character-sammy/sammy-land-strip-TEMPLATE.png`
- Size: **96×48** (2 frames of 48×48)
- Speed: 15 fps; total time 0.13 s. Plays: **once**, then idle or run. Feet point **(28, 47)**. *(v03 holds the fall crouch for both frames as a stand-in, with no pasted dust; v02's two lunging frames, feet at (17, 47), are superseded. Two real landing frames are still wanted.)*
- When: only after a real fall, not after tiny hops. The game adds a dust puff itself (`sim.js` fires it on landing); **don't draw dust in the frames** (v02's pasted puff doubled it, which is why v03 dropped it).
- Frames:
  1. Squash: knees deeply bent, body 2–3 px lower, feet flat on the bottom row.
  2. Halfway back up to standing.

### Tail-whip (attack): `sammy-tail-whip-strip-v01.png`
- Save as `assets/characters/character-sammy/sammy-tail-whip-strip-v04.png` (the next version number: v03 is in the game today and the game uses the newest)
- Template: `templates/art-templates/characters/character-sammy/sammy-tail-whip-strip-TEMPLATE.png`
- Size: **256×48** (4 frames of **64×48**, wider than his other strips)
- Speed: 15 fps; total time 0.27 s. Plays: **once**. Feet point **(36, 47)**.
- **Hit frame: frame 3** (the code's "hit frame 2"). It is on screen from 0.13 s to 0.2 s, and only then can the whip hurt a zombie.
- Frames (feet stay on the bottom row):
  1. Wind-up: body twists away, tail swings far back (use the extra room behind him).
  2. Spin: body turning, tail sweeping round low.
  3. **HIT:** tail stretched out in front. The game checks for hits in columns 42–61 and rows 26–37 of this frame, so the tail tip should reach into that area.
  4. Recovery: tail snapping back, body returning to standing.

### Hurt: `sammy-hurt-strip-v01.png`
- Save as `assets/characters/character-sammy/sammy-hurt-strip-v04.png` (the next version number: v03 is in the game today and the game uses the newest)
- Template: `templates/art-templates/characters/character-sammy/sammy-hurt-strip-TEMPLATE.png`
- Size: **96×48** (2 frames of 48×48)
- Speed: 10 fps; total time 0.2 s. Plays: **once**. Feet point (28, 47).
- **Good to know:** today the game shows this whole strip as a **solid white silhouette** (a hit flash), so only the outline shape shows, not colours or small details. Afterwards Sammy blinks for 1 s while he can't be hurt.
- Frames:
  1. Flinch: head snapped back, eyes squeezed shut, body leaning backward.
  2. Knocked back: legs lifting off the ground, paws flung forward.

### Play dead (Play Possum): `sammy-play-dead-strip-v01.png`
- Save as `assets/characters/character-sammy/sammy-play-dead-strip-v04.png` (the next version number: v03 is in the game today and the game uses the newest)
- Template: `templates/art-templates/characters/character-sammy/sammy-play-dead-strip-TEMPLATE.png`
- Size: **256×48** (4 frames of **64×48**; was 48×48 until 2026-10-20, lying down is long)
- Speed: 8 fps; total time 0.5 s. Plays: **holds the last frame** for as long as he plays dead (up to 3 s). Feet point **(32, 47)**.
- **Getting up uses the same strip played backwards at double speed** (0.25 s). There's no separate get-up strip, so frames 4 → 1 must also look right as "getting up".
- When lying down, his body is about 28 px wide and 14 px tall. The game draws "Z z" above him for now.
- Frames:
  1. Dramatic clutch: paw to chest, knees buckling.
  2. Toppling sideways.
  3. Hits the ground with a small bounce.
  4. **Held pose:** flat on his back, legs stiff in the air, tongue out, X eyes. Funny, not sad.

### KO (out of hearts): `sammy-ko-strip-v01.png`
- Save as `assets/characters/character-sammy/sammy-ko-strip-v04.png` (the next version number: v03 is in the game today and the game uses the newest)
- Template: `templates/art-templates/characters/character-sammy/sammy-ko-strip-TEMPLATE.png`
- Size: **456×48** (6 frames of **76×48**; was 48×48 until 2026-10-20, the tumble and the slide are long)
- Speed: 10 fps; total time 0.6 s. Plays: **once**, then frame 6 stays on screen for about 1 more second before the restart. Feet point **(38, 47)**.
- The game draws spinning stars ("* * *") above his head, so leave a little room above him.
- Suggestion: make it clearly different from play dead, so the player knows he really lost.
- Frames:
  1. Stagger, eyes spinning.
  2. Wobble the other way.
  3. Knees give way.
  4. Falling backward.
  5. Hits the ground with a bounce.
  6. Flat out and dizzy (spiral eyes), tongue out.

### Victory: `sammy-victory-strip-v01.png`
- Save as `assets/characters/character-sammy/sammy-victory-strip-v04.png` (the next version number: v03 is in the game today and the game uses the newest)
- Template: `templates/art-templates/characters/character-sammy/sammy-victory-strip-TEMPLATE.png`
- Size: **192×48** (4 frames of 48×48)
- Speed: 8 fps; total time 0.5 s. Plays: **loops** on the level-clear screen. Feet point (28, 47); feet may leave the bottom row in frames 2–3.
- Frames:
  1. Crouch, grinning.
  2. Hop up, one paw punching the air, tail curled.
  3. Top of the hop, big grin.
  4. Landing back down.

---

## Zombie jogger (5 strips)

Folder: `assets/enemies/enemy-zombie-jogger/`. Templates: `templates/art-templates/enemies/enemy-zombie-jogger/`.

**Look (example):** a morning jogger turned zombie. Neon sweatband, headphones dangling from one ear, sweat-stained tank top, one sneaker untied, step-counter watch. Grey-blue or grey-green skin (keep it away from the grass greens, see `design/STYLE_GUIDE.md`), droopy eyes, tongue out. ~~Funny, not scary.~~ *(Superseded 2026-10-19:)* **rotting and menacing**: torn tracksuit, sunken glowing eyes, exposed teeth, a few dark wounds; the dark joke is that he's still out jogging. About 40–46 px tall, a little taller than Sammy. Uses the zombie colour set (palette line 1), shared by all zombies.

**Feet point (24, 47)** in every 48×48 frame.

### Walk: `zombie-jogger-walk-strip-v01.png`
- Save as `assets/enemies/enemy-zombie-jogger/zombie-jogger-walk-strip-v01.png`
- Template: `templates/art-templates/enemies/enemy-zombie-jogger/zombie-jogger-walk-strip-TEMPLATE.png`
- Size: **288×48** (6 frames of 48×48)
- Speed: 8 fps; total time 0.75 s. Plays: **loops**. Feet point (24, 47).
- When: wandering back and forth (slowly) and chasing Sammy (twice as fast). The same strip is used for both, so the feet will slide a little at one of the speeds (see "Needs direction" below).
- Frames (a lazy jogging shuffle, arms flopping):
  1. Front foot lands, arms dangling forward.
  2. Body low, head lolling.
  3. Legs passing, untied lace flapping.
  4. Other foot lands.
  5. Body low, headphones swinging.
  6. Legs passing.

### Attack: `zombie-jogger-attack-strip-v01.png`
- Save as `assets/enemies/enemy-zombie-jogger/zombie-jogger-attack-strip-v01.png`
- Template: `templates/art-templates/enemies/enemy-zombie-jogger/zombie-jogger-attack-strip-TEMPLATE.png`
- Size: **192×48** (4 frames of 48×48)
- Speed: 10 fps; total time 0.4 s. Plays: **once**. Feet point (24, 47).
- **Hit frame: frame 3** (the code's "hit frame 2"), on screen from 0.2 s to 0.3 s.
- Frames (a sloppy shoulder-bump lunge):
  1. Wind-up: leaning back, arms raised.
  2. Starting the lunge.
  3. **HIT:** full lunge, shoulder and arms forward. The game checks for hits in columns 28–43 and rows 22–41 of this frame.
  4. Off balance, pulling back.

### Hit: `zombie-jogger-hit-strip-v01.png`
- Save as `assets/enemies/enemy-zombie-jogger/zombie-jogger-hit-strip-v01.png`
- Template: `templates/art-templates/enemies/enemy-zombie-jogger/zombie-jogger-hit-strip-TEMPLATE.png`
- Size: **96×48** (2 frames of 48×48)
- Speed: 12 fps; total time 0.17 s. Plays: **once**. Feet point (24, 47).
- **Good to know:** like Sammy's hurt strip, the game shows this as a **solid white silhouette**, so only the outline shape shows. Make sweat drops part of the outline if you want them seen.
- Frames:
  1. Head snaps back, arms fly up.
  2. Recoiling, one foot off the ground.

### Defeat: `zombie-jogger-defeat-strip-v01.png`
- Save as `assets/enemies/enemy-zombie-jogger/zombie-jogger-defeat-strip-v01.png`
- Template: `templates/art-templates/enemies/enemy-zombie-jogger/zombie-jogger-defeat-strip-TEMPLATE.png`
- Size: **384×48** (8 frames of 48×48)
- Speed: 12 fps; total time 0.67 s. Plays: **once**, then the zombie **disappears** straight away (frame 8 is on screen for only 1/12 s). Feet point (24, 47).
- The game writes "BOING" above him for the first 0.3 s. Keep everything, including the bouncing head, inside this 48×48 box. A separate head picture isn't used yet.
- **Which attack:** this strip is the **tail-whip** defeat. The chainsaw's cut-in-half defeat is a separate strip, planned for step B (see "Chainsaw power-up" below).
- Frames (dark gag; ~~no blood~~ *superseded 2026-10-19*: a little stylized blood or ichor when the head comes off, in the reserved colours; low-gore version: dust puff instead):
  1. Stops, glances at his watch.
  2. Shocked, eyes bulging at the watch.
  3. Freezes stiff.
  4. Head pops off upward ("boing").
  5. Head in the air at the top of the box; body still jogging in place.
  6. Head bouncing near the front edge; body wobbling.
  7. Body crumpling.
  8. A pile of sweatsuit and one sneaker.

### Idle: `zombie-jogger-idle-strip-v01.png`
- Save as `assets/enemies/enemy-zombie-jogger/zombie-jogger-idle-strip-v01.png`
- Template: `templates/art-templates/enemies/enemy-zombie-jogger/zombie-jogger-idle-strip-TEMPLATE.png`
- Size: **192×48** (4 frames of 48×48)
- Speed: 6 fps; total time 0.67 s. Plays: **loops**. Feet point (24, 47).
- When: the game uses it for zombies **dropping into the final fight** (a red "!" over them) and for zombies **confused by Play Possum** (a "?" over them). So it's needed, even though the jogger's planning spec calls it optional.
- Frames (jogging in place, puzzled):
  1. Left knee up.
  2. Down, glancing at his watch.
  3. Right knee up.
  4. Down, scratching his head and looking around.

---

## Zombie hot dog vendor (4 strips, plus the hot dog he throws and its splat)

Folder: `assets/enemies/enemy-zombie-hot-dog-vendor/`. Templates: `templates/art-templates/enemies/enemy-zombie-hot-dog-vendor/`.

**Look (example):** paper hat, ~~stained~~ **blood-stained** apron, mustache, tongs in one hand, rotting grey skin, a nasty grin (2026-10-19 tone: menacing, not cute). He stays in one place and lobs hot dogs. About Sammy's height plus a bit, in a 48×48 box (the game is set up for 48×48, not 64×64). Zombie colour set (palette line 1).

**Feet point (24, 47)** for the vendor. The thrown hot dog and the splat are centred on **(8, 8)** and have no ground line.

### Idle: `zombie-vendor-idle-strip-v01.png`
- Save as `assets/enemies/enemy-zombie-hot-dog-vendor/zombie-vendor-idle-strip-v01.png`
- Template: `templates/art-templates/enemies/enemy-zombie-hot-dog-vendor/zombie-vendor-idle-strip-TEMPLATE.png`
- Size: **192×48** (4 frames of 48×48)
- Speed: 6 fps; total time 0.67 s. Plays: **loops**. Feet point (24, 47).
- When: between throws, **and** while Sammy plays dead nearby (there's no separate shrug strip, so this is all the player sees then).
- Frames (flipping a hot dog with tongs):
  1. Tongs low, holding a hot dog.
  2. Flicks it: hot dog in the air above the tongs.
  3. Catches it.
  4. Slight sway, mouth open in a groan.

### Throw: `zombie-vendor-throw-strip-v01.png`
- Save as `assets/enemies/enemy-zombie-hot-dog-vendor/zombie-vendor-throw-strip-v01.png`
- Template: `templates/art-templates/enemies/enemy-zombie-hot-dog-vendor/zombie-vendor-throw-strip-TEMPLATE.png`
- Size: **192×48** (4 frames of 48×48)
- Speed: 10 fps; total time 0.4 s. Plays: **once**. Feet point (24, 47).
- **Release frame: frame 3** (the code's "release frame 2"), at 0.2 s. The flying hot dog appears at about **(34, 20)** in this frame, so put his throwing hand there.
- Frames:
  1. Wind-up: arm back, hot dog in hand.
  2. Arm swinging forward.
  3. **RELEASE:** arm out in front at about (34, 20), hand **empty** (the game draws the flying hot dog).
  4. Follow-through, arm down.

### Hit: `zombie-vendor-hit-strip-v01.png`
- Save as `assets/enemies/enemy-zombie-hot-dog-vendor/zombie-vendor-hit-strip-v01.png`
- Template: `templates/art-templates/enemies/enemy-zombie-hot-dog-vendor/zombie-vendor-hit-strip-TEMPLATE.png`
- Size: **96×48** (2 frames of 48×48)
- Speed: 12 fps; total time 0.17 s. Plays: **once**. Feet point (24, 47).
- **Good to know:** shown as a **solid white silhouette** today, so the shape is what counts.
- Frames:
  1. Recoil; paper hat lifting off his head.
  2. Hat high above him, mustache bristling.

### Defeat: `zombie-vendor-defeat-strip-v01.png`
- Save as `assets/enemies/enemy-zombie-hot-dog-vendor/zombie-vendor-defeat-strip-v01.png`
- Template: `templates/art-templates/enemies/enemy-zombie-hot-dog-vendor/zombie-vendor-defeat-strip-TEMPLATE.png`
- Size: **288×48** (6 frames of 48×48)
- Speed: 12 fps; total time 0.5 s. Plays: **once**, then he **disappears** straight away. Feet point (24, 47).
- The game writes "PFFFT" above him. Keep it inside his own box (the cart is a separate picture).
- **2026-10-19:** this is still his tail-whip defeat (Proposed: keep the deflate gag as dark humour, with a little ichor hissing out instead of plain air; low-gore version: plain air). The chainsaw's cut-in-half defeat is a separate strip, planned for step B.
- Frames (he deflates like a balloon; ~~no blood~~ *superseded 2026-10-19*, see above):
  1. Surprised, puffed up round.
  2. Starting to sag, air escaping.
  3. Half size, hat slipping.
  4. Wrinkly and floppy.
  5. Nearly flat.
  6. A flat apron on the ground with the paper hat on top.

### Thrown hot dog: `hot-dog-projectile-strip-v01.png`
- Save as `assets/enemies/enemy-zombie-hot-dog-vendor/hot-dog-projectile-strip-v01.png` (in the vendor's folder)
- Template: `templates/art-templates/enemies/enemy-zombie-hot-dog-vendor/hot-dog-projectile-strip-TEMPLATE.png`
- Size: **64×16** (4 frames of 16×16)
- Speed: 12 fps; total time 0.33 s. Plays: **loops** while it flies (about 1 s). Centre point (8, 8), no ground line. Never flipped.
- The part that can hit Sammy is 10×6 px, so keep the hot dog about 12×6 px.
- Frames (spinning, with a squiggle of mustard):
  1. Lying flat.
  2. Tilted 45°.
  3. Standing upright.
  4. Tilted 45° the other way (frame 1 comes next, so the spin is smooth).

### Hot dog splat: `hot-dog-splat-strip-v01.png`
- Save as `assets/enemies/enemy-zombie-hot-dog-vendor/hot-dog-splat-strip-v01.png` (in the vendor's folder)
- Template: `templates/art-templates/enemies/enemy-zombie-hot-dog-vendor/hot-dog-splat-strip-TEMPLATE.png`
- Size: **64×16** (4 frames of 16×16)
- Speed: 15 fps; total time 0.27 s. Plays: **once**, then disappears. Centre point (8, 8), no ground line.
- When it hits the ground, the centre of the picture sits on the grass line, so spread the splat sideways from the middle row.
- Frames (mustard and bun, no blood):
  1. Impact: hot dog squashed flat.
  2. Mustard bursting outward.
  3. Widest, flattest splash, with a few drops.
  4. Small leftover drips (solid pixels, no fading).

---

## Hot dog cart (5 pictures, plus the hot dog pickup)

Folder: `assets/props/prop-hot-dog-cart/`. Templates: `templates/art-templates/props/prop-hot-dog-cart/`.

**Look (example):** a classic New York hot dog cart: striped umbrella, steel box body, two wheels, mustard and ketchup bottles on top. The cart itself is about 56×44 px, about 1.5 times Sammy's height. Uses the props, items and ground colour set (palette line 2).

**Feet point (32, 47)** in every 64×48 frame. The lowest part (wheels when standing, its side when tipped) touches the bottom row. The hot dog pickup sits on **(8, 15)**, resting on its bottom row.

**How it works in the game:** the first tail-whip makes it rock. A second whip within 1.5 s tips it over, away from Sammy, and 3 hot dogs spill out. When it falls to the left, the game flips the picture, so draw it falling to the right. Sammy can stand on the umbrella top while the cart is upright.

### Upright: `hot-dog-cart-upright-v01.png`
- Save as `assets/props/prop-hot-dog-cart/hot-dog-cart-upright-v01.png`
- Template: `templates/art-templates/props/prop-hot-dog-cart/hot-dog-cart-upright-TEMPLATE.png`
- Size: **64×48** (1 picture). Plays: **one still picture**. Feet point (32, 47).
- Sammy stands on the **top row** of this box (the umbrella), across its full width, so keep the umbrella top flat and touching the top edge. The solid body is the bottom 28 rows, columns 4–59.
- Picture: the whole cart standing on both wheels, umbrella open, bottles on top.

### Rocking: `hot-dog-cart-rocking-strip-v01.png`
- Save as `assets/props/prop-hot-dog-cart/hot-dog-cart-rocking-strip-v01.png`
- Template: `templates/art-templates/props/prop-hot-dog-cart/hot-dog-cart-rocking-strip-TEMPLATE.png`
- Size: **192×48** (3 frames of 64×48)
- Speed: 12 fps; total time 0.25 s. Plays: **loops** for up to 1.5 s, then the cart settles. Feet point (32, 47).
- Frames (small tilts, 1–2 px, so the jump from frame 3 back to frame 1 isn't jarring):
  1. Leaning slightly back; front wheel just off the ground.
  2. Level, bottles wobbling.
  3. Leaning slightly forward; back wheel just off the ground.

### Tipping: `hot-dog-cart-tipping-strip-v01.png`
- Save as `assets/props/prop-hot-dog-cart/hot-dog-cart-tipping-strip-v01.png`
- Template: `templates/art-templates/props/prop-hot-dog-cart/hot-dog-cart-tipping-strip-TEMPLATE.png`
- Size: **192×48** (3 frames of 64×48)
- Speed: 12 fps; total time 0.25 s. Plays: **once**, then "tipped over". Feet point (32, 47).
- Frames (falling to the right):
  1. About 30° over, back wheel in the air.
  2. About 60° over, umbrella swinging down, lid flying open.
  3. Almost on its side, hot dogs starting to fly out.

### Tipped over: `hot-dog-cart-tipped-over-v01.png`
- Save as `assets/props/prop-hot-dog-cart/hot-dog-cart-tipped-over-v01.png`
- Template: `templates/art-templates/props/prop-hot-dog-cart/hot-dog-cart-tipped-over-TEMPLATE.png`
- Size: **64×48** (1 picture). Plays: **one still picture**. Feet point (32, 47).
- Picture: lying on its side, hot dogs still visible inside, umbrella on the ground. Low: Sammy can hop over it, as the game treats it as a block 16 px tall.

### Empty: `hot-dog-cart-empty-v01.png`
- Save as `assets/props/prop-hot-dog-cart/hot-dog-cart-empty-v01.png`
- Template: `templates/art-templates/props/prop-hot-dog-cart/hot-dog-cart-empty-TEMPLATE.png`
- Size: **64×48** (1 picture). Plays: **one still picture**. Feet point (32, 47).
- When: after all 3 hot dogs are eaten, or after 10 s.
- Picture: same position as "tipped over", but empty, with the umbrella bent. Scenery from now on.

### Hot dog pickup: `hot-dog-pickup-strip-v01.png`
- Save as `assets/props/prop-hot-dog-cart/hot-dog-pickup-strip-v01.png` (in the cart's folder)
- Template: `templates/art-templates/props/prop-hot-dog-cart/hot-dog-pickup-strip-TEMPLATE.png`
- Size: **64×16** (4 frames of 16×16)
- Speed: 8 fps; total time 0.5 s. Plays: **loops**. Feet point (8, 15). Never flipped.
- When: spilled from the cart, and placed on two lamp tops in the level. Eating one gives back 1 heart. Spilled ones blink before they vanish (the game does the blinking).
- Frames (a tasty hot dog in a bun, inviting to grab):
  1. Resting in its bun.
  2. Small hop, 1 px up.
  3. Back down, with a sparkle glint on the mustard.
  4. Resting, glint fading.

---

## Trash lid shield (3 pictures)

Folder: `assets/items/item-powerup-trash-lid-shield/`. Templates: `templates/art-templates/items/item-powerup-trash-lid-shield/`.

**Look (example):** a dented, round, galvanised-steel trash can lid with a handle and a sparkle highlight. Three shades of metal. The pickup uses the props colour set (palette line 2); the held lid and its icon use Sammy's colour set (palette line 0). Use colours that exist in both, or say so.

**How it works:** Sammy picks it up and it blocks the next 3 hits (from zombies or thrown hot dogs).

### Lid pickup: `trash-lid-pickup-strip-v01.png`
- Save as `assets/items/item-powerup-trash-lid-shield/trash-lid-pickup-strip-v01.png`
- Template: `templates/art-templates/items/item-powerup-trash-lid-shield/trash-lid-pickup-strip-TEMPLATE.png`
- Size: **64×16** (4 frames of 16×16)
- Speed: 8 fps; total time 0.5 s. Plays: **loops**. Feet point (8, 15). Never flipped.
- The game already bobs it up and down by 2 px, so don't draw a bob.
- Frames (turning slowly so it reads as a lid):
  1. Face-on, tilted toward the viewer: a full circle with the handle.
  2. Turned three-quarters.
  3. Edge-on: a thin band with the handle sticking out.
  4. Three-quarters the other way.

### Lid Sammy holds: `trash-lid-held-overlay-strip-v01.png`
- Save as `assets/items/item-powerup-trash-lid-shield/trash-lid-held-overlay-strip-v01.png`
- Template: `templates/art-templates/items/item-powerup-trash-lid-shield/trash-lid-held-overlay-strip-TEMPLATE.png`
- Size: **48×16** (3 frames of 16×16)
- Plays: **chosen by the game**, one frame for each number of hits left. Centre point (8, 8).
- Drawn on top of Sammy, with its centre 12 px in front of his **feet point** and 14 px up, so it sits in the same place on screen whatever the strip's cell is: about **(40, 34)** in a 48×48 frame with the feet at (28, 47), (48, 34) in the 64-wide run cell with the feet at (36, 47). While he carries the chainsaw it is slung on his back instead, 8 px behind the feet point, and drawn under him so it never hides the saw. It stays at that spot in every animation and is hidden while he plays dead or is KO'd. It flips with Sammy.
- About 14×16 px, seen mostly side-on (he holds it out in front like a shield).
- Frames:
  1. Intact (3 hits left).
  2. Dented (2 hits left).
  3. Cracked and bent (1 hit left).

### Lid icon (top bar): `hud-icon-trash-lid-v01.png`
- Save as `assets/items/item-powerup-trash-lid-shield/hud-icon-trash-lid-v01.png`
- Template: `templates/art-templates/items/item-powerup-trash-lid-shield/hud-icon-trash-lid-TEMPLATE.png`
- Size: **16×16** (1 picture). Plays: **one still picture**. Placed by its top-left corner (0, 0); no feet point.
- Shown in the 16 px bar across the top of the screen while Sammy holds a lid, at screen columns 34–49. The bar behind it is very dark navy.
- **Don't draw the hit pips:** the game draws them to the right of the icon.
- Picture: a small, bold lid face-on, readable at a glance.

---

## Chainsaw power-up (in the game since Stage B; Sammy's three saw strips are real art since 2026-10-20)

**All Proposed (2026-10-19; updated 2026-10-20).** The owner confirmed that Sammy fights with a chainsaw. Stage B put it in the game: the pickup, the top-bar icon and Sammy's idle, run and rev strips have slots in `game/src/assets.js`, templates, and real art (the pickup and icon are code-drawn pixel art; the three Sammy strips are `-v03` cuts from the owner's sheets and generated frames). The cut strip and the cut-in-half defeats below are still only planned. *(Superseded: "The game doesn't have it yet: step B adds it. These files have no slot in the game today.")*

**Proposed rules:** the chainsaw is a **power-up** lying in the level. Sammy picks it up and, for a limited time (or a limited amount of fuel), his attack button revs and cuts with the chainsaw instead of the tail-whip. The cut **slices zombies in half**. When it runs out, he's back to the tail-whip, which always stays his basic attack.

**Look (example):** a rusty orange chainsaw with a scuffed engine, a pull cord and a long grey bar with a chunky chain, like the concept picture, but drawn in the game's own 16-bit cartoon style. Sammy holds it in both front paws, bar pointing forward.

### Chainsaw pickup: `chainsaw-pickup-strip-v01.png`
- Folder: `assets/items/item-powerup-chainsaw/` (new)
- Size: about **128×16** (4 frames of **32×16**). Feet point (16, 15), resting on its bottom row. Never flipped.
- Speed: 8 fps; **loops**. The game bobs it like the trash lid, so don't draw a bob.
- Frames: 1 resting · 2 a glint runs along the bar · 3 a small puff of exhaust · 4 resting.

### Sammy with the chainsaw: two ways to draw it (pick one; Proposed: **A**)
- **A. Full strips (Proposed, and what the game has):** Sammy drawn holding the saw. **64×48** frames for idle and run, **76×48** for the rev, all with the feet point at **(26, 47)** since 2026-10-20 (the sheets' saw is big: the bar reaches 37 px in front of the feet, 47 px when lifted to rev, so the feet moved left from 36 to 26 and the rev cell grew to 76 so no frame has to slide). The v03 strips: idle and rev from the master sheets, the run the owner's generated 8-frame cycle; the bar is steel grey (`#b4b4b4` / `#6c6c6c`) with the chain teeth painted on after import. Still wanted: two breathing frames for the idle (`design/OPEN_TASKS.md`):
  - `sammy-chainsaw-idle-strip-v01.png`: 4 frames, 6 fps, loops (engine idling: the saw shakes 1 px, a puff of smoke). *(v03 holds one frame for all four.)*
  - `sammy-chainsaw-run-strip-v01.png`: 8 frames, 12 fps, loops (same leg timing as his run strip, saw held forward).
  - `sammy-chainsaw-rev-strip-v01.png`: 4 frames of **76×48**, 15 fps, loops (revving before the cut: snarl, saw lifted, chain blurred). *(Was planned as 2 frames; the game plays 4.)*
  - `sammy-chainsaw-cut-strip-v01.png`: 4 frames, 15 fps, plays once, **hit frame 3** (a big forward sweep; sparks at the tip).
- **B. Overlay:** the saw drawn alone, placed on top of Sammy's normal strips at a hand point (like the trash lid he holds). Much less drawing, but the saw can't change his pose.
  - `chainsaw-held-overlay-strip-v01.png`: about 4 frames of **32×16**, chosen by the game (idle, rev, cut, cut with sparks).

### Effects and defeats
- **Zombie cut in half:** a new defeat strip per zombie, for example `zombie-jogger-defeat-cut-strip-v01.png` and `zombie-vendor-defeat-cut-strip-v01.png` (48×48 frames, about 6–8 frames, 12 fps, plays once): the top half slides off and falls, the legs take a step and drop, a burst of blood or ichor in the reserved colours. Ends on a small pile.
- **Low-gore versions** of each: `...-defeat-cut-lowgore-strip-v01.png`, the zombie crumpling into a pile of dust and clothes in one piece (rules: `design/STYLE_GUIDE.md`, "Gore rules for artists").
- **Sparks and splats:** a small spark burst and a blood splat, about 16×16 frames, centred (8, 8); plus a green ichor version.
- **Top-bar icon:** a 16×16 chainsaw icon, with the game drawing a fuel or time bar beside it.

### Chainsaw sounds (planned for step B)

| Sound | When | Feel | Loops? |
|---|---|---|---|
| `sfx-chainsaw-start` | Sammy picks up the saw (pull-cord start) | 0.5–1 s, pull-cord rasp, sputter, catch | no |
| `sfx-chainsaw-rev` | While the saw is running or revving | 1–2 s, engine buzz that loops cleanly | **yes** (the first looping sound effect; needs a small game change) |
| `sfx-chainsaw-cut` | The saw hits a zombie | 0.3–0.6 s, the chain biting: a scream of the engine plus a crunch | no (2–3 variations) |
| `sfx-gore-splat` | A zombie is cut in half or bursts | 0.2–0.4 s, wet, chunky splat (low gore: a dry thud) | no (2–3 variations) |

These sound names aren't in the game's sound list yet, so the scanner doesn't ask for them. Step B adds them.

---

## Central Park background (4 layers)

Folder: `assets/environments/environment-central-park-tileset/`. Templates: `templates/art-templates/environments/environment-central-park-tileset/`.

**Look (example):** ~~early-morning Central Park. A banded dawn sky,~~ *(Superseded 2026-10-19: the owner chose night.)* **Central Park at night**, inspired by Bethesda Terrace: a navy-to-indigo night sky with a full moon, amber lamps with dithered halos, rain-slick stone with dithered reflections, autumn leaves (colours: `design/STYLE_GUIDE.md`, "Night mood"). Original (not copied) details: a flat Manhattan skyline silhouette (recognisable, but not copied from a photo or logo), a tree line, then near bushes just behind the grass. **No outlines** on background layers, and only a few colours each. All layers share the background colour set (palette line 3). No see-through haze; use dithering instead.

All layers are placed by their top-left corner, with no feet point. They are single pictures (no animation). The bar at the top of the screen covers rows 0–15.

| Layer | Size | Screen rows | Moves at | Loops sideways? |
|---|---|---|---|---|
| Sky | 320×224 | 0–223 (behind everything) | doesn't move | no |
| Skyline | 512×64 | 80–143 | 1/8 of camera speed | yes |
| Tree line | 512×32 | 144–175 | 1/4 of camera speed | yes |
| Bushes | 512×32 | 176–207 (only 176–191 show) | 1/2 of camera speed | yes |

"Loops sideways" means the right edge must join the left edge with no seam, because the picture repeats.

### Sky: `central-park-bg-sky-v01.png`
- Save as `assets/environments/environment-central-park-tileset/central-park-bg-sky-v01.png`
- Template: `templates/art-templates/environments/environment-central-park-tileset/central-park-bg-sky-TEMPLATE.png`
- Size: **320×224** (1 picture). Fully solid: no see-through pixels.
- **Paint all 224 rows.** The sky shows clearly in rows 16–79, but it also shows through every gap in the skyline and trees below, so carry it down to the bottom.
- Picture: 6–8 flat colour bands, ~~dark blue at the top, through lighter blue and lavender, to pink and peach near the horizon~~ *(superseded 2026-10-19)* navy at the top, through indigo, to a dusky purple city glow near the horizon, with a big pale **full moon** in the upper left and a few single-pixel stars. Dithered seams between bands are fine; smooth gradients are not.

### Skyline: `central-park-bg-skyline-v01.png`
- Save as `assets/environments/environment-central-park-tileset/central-park-bg-skyline-v01.png`
- Template: `templates/art-templates/environments/environment-central-park-tileset/central-park-bg-skyline-TEMPLATE.png`
- Size: **512×64** (1 picture). See-through above the buildings, so the sky shows.
- Picture: a flat silhouette of tall Manhattan buildings in 2–3 dark colours, with scattered amber lit windows (night). Seamless left-to-right loop.

### Tree line: `central-park-bg-treeline-v01.png`
- Save as `assets/environments/environment-central-park-tileset/central-park-bg-treeline-v01.png`
- Template: `templates/art-templates/environments/environment-central-park-tileset/central-park-bg-treeline-TEMPLATE.png`
- Size: **512×32** (1 picture). See-through above the treetops; fill the bottom rows solid.
- Picture: rounded tree canopies of different heights, 2–3 dark blue-greens at night, with a few autumn orange and rust clumps. Seamless loop.

### Bushes: `central-park-bg-bushes-v01.png`
- Save as `assets/environments/environment-central-park-tileset/central-park-bg-bushes-v01.png`
- Template: `templates/art-templates/environments/environment-central-park-tileset/central-park-bg-bushes-TEMPLATE.png`
- Size: **512×32** (1 picture). Only the **top 16 rows** are ever seen (the grass covers the rest).
- **Fill it solid, with no see-through pixels.** Only the sky is behind this layer, so any gap would look like a hole. Fill the spaces between bushes with a darker tree or shadow colour.
- Picture: round bushes just behind the grass, a bit brighter than the tree line. Optional (Proposed): a stone balustrade in front of them, like Bethesda Terrace's, lit amber here and there. Seamless loop.

---

## Scenery (park and Bethesda Terrace)

*Proposed (not approved), 2026-10-19.* The park is drawn in code today and looks decent; each piece below can be replaced by a real picture. Folders: `assets/environments/environment-central-park-tileset/` (park) and `assets/environments/environment-bethesda-terrace/` (terrace). Templates: `templates/art-templates/environments/...` (blank, exact size, plus contact sheets `contact-sheet-scenery.png` and `contact-sheet-bethesda.png`). Mood only: `assets/references/zombie-hunter-concept-v01.jpg`.

**Look for all of it:** Central Park at night. Cool blue-green and indigo, rain-slick wet stone, a few warm **amber lamp** pools (dithered, never see-through), and **autumn leaves** (orange, rust, gold) as small bright accents. Light from the top-left (the moon). Foreground pieces get a **1 px dark outline** and 3 shades per material; background-ish pieces (far trees, the leaves band) have no outline. 9-bit colours, 15 colours or fewer per file, hard pixels, dither instead of fading. The ground lane must stay a bit lighter than what is behind it so Sammy and the zombies stand out. Feet pieces stand on the **bottom-centre** pixel. Everything is cosmetic: nothing here changes how the game plays.

| Piece | File | Size | Frames |
|---|---|---|---|
| Park ground | `scenery-ground-park-strip-v01.png` | 32×32 | 2 tiles of 16×32 |
| Wet path | `scenery-ground-path-strip-v01.png` | 32×32 | 2 tiles of 16×32 |
| Terrace floor | `bethesda-ground-terrace-strip-v01.png` | 32×32 | 2 tiles of 16×32 |
| Lamp post | `scenery-lamp-v01.png` | 16×64 | 1 |
| Lamp glow | `scenery-lamp-glow-v01.png` | 48×48 | 1 |
| Bench | `scenery-bench-v01.png` | 32×32 | 1 |
| Far tree | `scenery-tree-far-strip-v01.png` | 128×96 | 2 trees of 64×96 |
| Near tree | `scenery-tree-near-strip-v01.png` | 192×128 | 2 trees of 96×128 |
| Fence | `scenery-fence-v01.png` | 16×24 | 1 |
| Rock | `scenery-rock-v01.png` | 32×16 | 1 |
| Litter bin | `scenery-trashcan-v01.png` | 16×24 | 1 |
| Drifting leaves | `scenery-leaves-fg-strip-v01.png` | 640×64 | 2 @ 2 fps |
| Puddle | `scenery-puddle-strip-v01.png` | 64×8 | 2 @ 2 fps |
| Fountain | `bethesda-fountain-strip-v01.png` | 384×96 | 3 @ 6 fps |
| Angel | `bethesda-angel-v01.png` | 48×64 | 1 |
| Balustrade | `bethesda-balustrade-v01.png` | 32×24 | 1 |
| Arch | `bethesda-arch-v01.png` | 64×80 | 1 |
| Stairs | `bethesda-stairs-v01.png` | 64×32 | 1 |

### Ground tiles (park, path, terrace)
- A tile strip holds **2 variants side by side** (not an animation). The game picks one per 16 px column, so the ground doesn't repeat evenly. Every tile repeats sideways: its left and right edges must join up.
- **Row 0 is the first row below the grass line.** Park: a grass edge (3-4 rows) then wet blue-grey earth with pebbles, leaf specks, glints; darker with depth. The game adds a few grass blades above the line in the placeholder only, so put any blades inside the tile. Path: staggered flagstones, light top-left edges, dark joints, wet glints. Terrace: big pale slabs, moon glints, cracks.

### Lamp and glow
- **Lamp:** cast-iron post, lit lantern. **Row 12 is the ledge Sammy stands on** (lamp platforms are at y 140 = 192 - 64 + 12); finial above, post below. Warm bright glass (amber to pale), dark iron with a moon rim on the left.
- **Glow:** drawn behind the lamp, centred on the lantern (centre pixel (24, 24)). Checkerboard amber that thins out with distance. No see-through pixels.

### Bench
Slatted wooden back, wooden seat, iron ends. **Row 12 is the seat top** (bench platforms are at y 172 = 192 - 32 + 12). Amber light catching the seat edge.

### Trees
- **Far tree** (64×96, 2 variants): round canopy and a trunk with a root flare, dark blue-greens with a few rust patches, no outline. Stands behind the walking lane.
- **Near tree** (96×128, 2 variants): drawn **behind the characters** (so a trunk can never hide Sammy), drifting past a little faster than the camera. Dark, outlined, a **thin trunk** (so it hides little) and a canopy high above Sammy's head. Keep the canopy in the top 70 rows.

### Fence, rock, bin
- **Fence:** wrought-iron railing, spear tops, repeats every 16 px (the game uses 3 in a row around each fence post).
- **Rock:** Manhattan schist boulder, flat at the bottom, a crack, a little moss; matches the 32×16 rock blocks.
- **Bin:** a green wire-basket litter bin with a lid, 1 px outline.

### Drifting leaves
320×64, 2 frames, faint and sparse (about 16 leaves of 2-3 pixels in orange, rust and gold). It sits in front of everything and moves at 1.3 times the camera's speed, so **the left and right edges must join up** and it must not hide Sammy.

### Puddle
32×8, lies flat; its top row sits on the ground line. Dark blue water, a moon streak, a pale glint that moves between the 2 frames.

### Bethesda Terrace
- **Fountain** (128×96, 3 frames at 6 fps): a wide fluted basin with water, two bowls and a pedestal, water falling bowl to bowl. The water moves a little each frame and the 3 frames loop. **Row 29 is the pedestal top the angel stands on.**
- **Angel** (48×64): the Angel of the Waters: wings spread, one arm raised, a plinth. Stone in 3-4 steps with a lit moon edge on every upper-left edge. The game puts its feet point 67 px above the ground line, on the fountain.
- **Balustrade** (32×24): cap rail, 4 vase-shaped balusters, base rail. Repeats every 32 px along the top of the arcade wall.
- **Arch** (64×80): one bay of the arcade wall: stone blocks, a lit arch ring with a keystone, a dark opening with **warm amber light inside** (lanterns, lit floor). Five side by side fill the 320 px screen.
- **Stairs** (64×32): four stone steps seen from the front, moonlit treads and shaded risers.

---

## Sounds

**Feel (Proposed):** 16-bit era console sound: FM-synth bass and bright leads plus simple chip beeps and noise drums. Original sounds only: don't sample or imitate sounds or tunes from commercial games. **2026-10-19:** sound effects are now **punchy and gnarly with dark humour** rather than comic (meaty hits, wet splats, creepy groans); where a line below says "comic" or "not scary", it's superseded by this. Music: the owner's theme song is now the level track (below).

**How to deliver:** each sound has its own folder. Save it as `<id>-v01.ogg` (an `.mp3` beside it helps older Safari, and `.wav` also works). Or send WAV masters (44.1 kHz, 16-bit) and Claude converts them with `node tools/convert-audio.mjs`. Trim silence from the start. **Variations:** save extra versions as `<id>-v01-a.ogg`, `<id>-v01-b.ogg`, and so on. The game picks **one at random** each time. Until a file arrives, each sound plays a placeholder beep.

**Volume:** the game plays music at 60% and effects at 80%. Keep effects at similar loudness to each other, and never quite at full volume (peaks at −1 dB).

### Music (2 tracks)

Music **loops whole**: the end must flow straight back into the start with no click or gap. A separate intro that plays once isn't possible yet.

| Sound | Save in | When it plays | Suggested length and feel |
|---|---|---|---|
| `music-level-01-central-park` | `assets/audio/music/music-level-01-central-park/` | **Supplied 2026-10-19:** the owner's theme song "Sammy the Opossum : Zombie Hunter" (`music-level-01-central-park-v01.mp3`, 70 s, made with Suno; plays in your own copy, left out of the shareable copy until owner question 21 is answered). It loops whole, so its quiet intro and fade-out replay every 70 s; a trimmed loop edit could come later. From the first key press or tap on the title screen (which also starts the game), through the level. Pauses with the game. Stops when Sammy is KO'd, then starts again from the top when he comes back at the checkpoint. A restart from the pause menu keeps it playing. Stops when the level is cleared. | ~~60–90 s loop. Upbeat and a little spooky-silly, about 130–150 beats a minute: slap bass, bright lead, noise hi-hats.~~ *(Superseded by the theme song.)* A loop edit, if made: cut the quiet build-in and the fade so the end flows straight back into the start. |
| `music-level-01-gauntlet` (optional) | `assets/audio/music/music-level-01-gauntlet/` | The final zombie fight (3 waves), until the exit opens; then the level music comes back. Without this file, the level music just keeps playing. | 30–60 s loop. Faster and more urgent, in the theme song's mood (heavy, driving). |

### Sound effects (21)

All play once (none loop). Save each in `assets/audio/sfx/<id>/`, for example `assets/audio/sfx/sfx-jump/sfx-jump-v01.ogg`.

| Sound | When it plays in the game | Suggested length and feel | Variations |
|---|---|---|---|
| `sfx-jump` | Sammy leaves the ground | 0.15–0.25 s, rising chip "boing" | 1 |
| `sfx-land` | Sammy lands after a real fall (not small hops) | about 0.1 s, soft thud | 2 |
| `sfx-tail-whip` | The tail-whip starts | 0.15–0.2 s, whoosh | 2 |
| `sfx-hit-zombie` | The whip hits a zombie | 0.1–0.2 s, meaty smack or crunch | 3 |
| `sfx-zombie-groan` | A jogger first notices Sammy (at most once every 1.5 s), and when each wave of the final fight drops in | 0.5–1 s, rotten, creepy groan (~~comic, not scary~~, superseded 2026-10-19); short so groans don't pile up | 3 or more |
| `sfx-pickup` | Sammy grabs a hot dog or a trash lid | 0.2–0.3 s, bright rising notes | 1 |
| `sfx-hurt` | Sammy loses a heart (also plays with the splash when he falls in the pond) | 0.2–0.3 s, squeak plus a noise hit | 2 |
| `sfx-play-dead` | Sammy starts playing dead | 0.4–0.6 s, thud plus a comic wheeze | 1 |
| `sfx-zombie-defeat-comedic` | Any zombie is defeated (jogger or vendor) | 0.5–1 s, wet splat or crunch with a darkly funny tail (~~slapstick: pop, slide whistle, kazoo-like fizzle~~, superseded 2026-10-19). The id keeps its old name ("comedic") because the game uses it. | up to 3, but see "Needs direction" |
| `sfx-cart-crash` | The cart tips over (the screen also shakes) | 0.3–0.5 s, metal clang and rattle | 1 |
| `sfx-ko` | Sammy runs out of hearts (the music stops) | 0.8–1.5 s, comic "wah-wah" fall | 1 |
| `sfx-cart-rock` | The first whip on the cart makes it wobble | about 0.1–0.2 s, creak and small clunk | 1 |
| `sfx-shield-block` | The trash lid blocks a hit (with hits still left) | about 0.1–0.2 s, metal clang | 2 |
| `sfx-shield-break` | The lid blocks its last hit and is gone | about 0.3 s, clang plus rattle | 1 |
| `sfx-throw` | The vendor throws a hot dog | about 0.1–0.2 s, light whoosh | 1 |
| `sfx-splat` | A thrown hot dog hits the ground or Sammy | about 0.15–0.2 s, wet comic splat | 2 |
| `sfx-splash` | Sammy falls into the pond | about 0.3–0.4 s, water splash | 1 |
| `sfx-checkpoint` | Sammy reaches a checkpoint | about 0.25–0.4 s, cheerful two-note chime | 1 |
| `sfx-gate-open` | The final fight is won and the exit gate opens | about 0.6–1 s, rising rumble or fanfare | 1 |
| `sfx-level-clear` | The level is cleared (the music stops; this replaces the built-in jingle) | about 1.5–3 s, short victory jingle | 1 |
| `sfx-start` | Start is pressed on the title screen | about 0.2–0.4 s, bright confirm sound | 1 |

---

## Later: needs direction

These are named in the planning docs, but the game has no place to show or play them yet, so adding the files changes nothing today. Each needs a decision (and some game work) first.

| Item | Planned file and size | What's needed first |
|---|---|---|
| Foreground tile sheet (ground, path, bench, lamppost, rocks, pond edge, fence) | `central-park-tiles-v01.png`, 256×256 (8×8 tiles in 16×16 blocks) | A map of which tile goes where, and which tiles are solid, standable or water |
| Sammy wake-up intro | `sammy-wake-up-strip-v01.png`, 288×48 (6 frames of 48×48, 6 fps, plays once) | An opening scene in the game |
| Sammy face sheet (optional) | `sammy-expressions-v01.png`, 6 faces of 48×48 | Dialogue boxes or an intro scene |
| Play Possum icon for the top bar | 16×16, in `assets/ui/ui-hud/` (no name yet) | A name and a slot in the game (the grey "PP" box stays for now) |
| Hearts | 8×8 or 16×16, in `assets/ui/ui-hud/` (no name yet) | A name and a slot in the game |
| 8×8 font | sheet of 8×8 letters, in `assets/ui/ui-font-8x8/` | Owner question 7 (one text size or two) and the letter order |
| Trash lid breaking | `trash-lid-break-strip-v01.png`, 128×32 (4 frames of 32×32, 15 fps) | A slot in the game (the lid just vanishes today) |
| Jogger's bouncing head | `zombie-jogger-head-v01.png`, 16×16 | A slot in the game (the head stays in the defeat strip today) |
| Checkpoint marker and park exit gate | not named yet | Names, sizes and slots in the game |
| Effects: hit spark, dust puff, pond splash, pickup sparkle, "?" and "!" bubbles | not named yet | Names, sizes and slots in the game |
| Palette sheets (one per colour set) | `palette-line-0-sammy-hud-v01.png` and three more, in `assets/ui/palettes/` | Owner question 2 (art style); these guide artists, not the game |
| Reference pictures: model sheets, full-screen mock-up | `sammy-reference-v01.png`, `zombie-jogger-reference-v01.png`, `central-park-mockup-v01.png` (320×224) | Nothing: reference only, never shown in the game |
| Title screen, game-over screen | 320×224 each | Owner question 3 (the game's name) and slots in the game |
| A menu "select" sound, a game-over jingle, title music | not named yet | Menus and screens that would use them |

### Needs direction (questions these briefs raise)

- **Zombie defeat sound variations:** the planning docs suggest one defeat sound per gag (head pop, deflate, clothes pile), but the game picks variations at random, so a jogger could get the deflate sound. Either keep one general "comic defeat" sound, or give each zombie type its own sound (a small game change).
- **Jogger walk speed:** one walk strip is used for slow wandering and for chasing at twice the speed, so the feet slide at one of them. Accept it, or ask for a separate chase strip.
- **Zombie groans:** the planning doc mentions random idle groans, but the game only groans when a jogger notices Sammy and when a wave drops in. Say if you want random groans too.
- **White hit flash:** Sammy's hurt strip and both zombies' hit strips show only as white silhouettes today. Keep that (artists can keep those strips simple), or show the real colours with a shorter flash.
- **Sammy's first strip:** the run strip's license row says the owner still has to confirm that the drawing tool's terms allow selling the game.
