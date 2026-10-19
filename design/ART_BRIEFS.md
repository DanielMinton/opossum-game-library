# Art and sound briefs

> **Proposed (not approved).** Everything on this page is a suggestion for an artist or composer to work from. Only these facts are Confirmed by the owner: Sammy is an opossum ("he"), he wakes up in Central Park with no memory, the humans are cartoon zombies with funny, slapstick deaths, and the game should look and sound like a 16-bit console game from that era. Sizes, frame counts and speeds below are what the game uses **today**; changing them means changing the game too.
>
> **How gory?** This page assumes the suggested answer to question 1 in `design/OWNER_DECISIONS.md`: **cartoon slapstick, no blood** (heads pop off and bounce, zombies deflate, hot dogs splat). That question is still open. If the owner chooses differently, the defeat and splat pictures below change.

*Last updated 2026-10-19.*

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

## Sammy (10 strips)

Folder: `assets/characters/character-sammy/`. Templates: `templates/art-templates/characters/character-sammy/`.

**Look (example, change freely):** grey-white fur, white face with dark eye patches, pink nose, rounded black ears, black legs, long bare pink tail. Scruffy, wide-eyed and confused, but scrappy. About 32–40 px tall. Uses the Sammy + top-bar colour set (palette line 0).

**Feet point (28, 47)** in every 48×48 frame. That's 4 px right of centre, so his tail has room behind him. The tail-whip uses a wider 64×48 box with the feet point at **(36, 47)**, so his body lands in the same place. Every Sammy strip must use these points, or he will jump sideways when the animation changes.

### Idle: `sammy-idle-strip-v01.png`
- Save as `assets/characters/character-sammy/sammy-idle-strip-v01.png`
- Template: `templates/art-templates/characters/character-sammy/sammy-idle-strip-TEMPLATE.png`
- Size: **192×48** (4 frames of 48×48)
- Speed: 6 fps; total time 0.67 s. Plays: **loops**. Feet point (28, 47).
- When: standing still.
- Frames (breathing, tail sways; feet stay on the bottom row in all 4):
  1. Standing, weight even, tail curved low behind him.
  2. Breathing in: chest up 1 px, tail tip lifts.
  3. Full breath: ears perk, tail tip at its highest. Maybe a blink.
  4. Breathing out, halfway back to frame 1.

### Run: `sammy-run-strip-v01.png`: **done (v01 exists); template for redraws**
- Save as `assets/characters/character-sammy/sammy-run-strip-v01.png` (a redraw goes beside it as `-v02.png`)
- Template: `templates/art-templates/characters/character-sammy/sammy-run-strip-TEMPLATE.png`
- Size: **384×48** (8 frames of 48×48)
- Speed: 12 fps; total time 0.67 s. Plays: **loops**. Feet point (28, 47).
- When: moving along the ground. Sammy covers about 73 px during one full loop at top speed; match the step length to that so his feet don't slide.
- Frames: 1 front foot lands · 2 body at its lowest · 3 pushing off · 4 both feet in the air · 5 other foot lands · 6 lowest · 7 pushing off · 8 in the air. Feet touch the bottom row on the landing frames. Tail streams behind and bobs against the body.

### Jump (going up): `sammy-jump-rise-strip-v01.png`
- Save as `assets/characters/character-sammy/sammy-jump-rise-strip-v01.png`
- Template: `templates/art-templates/characters/character-sammy/sammy-jump-rise-strip-TEMPLATE.png`
- Size: **96×48** (2 frames of 48×48)
- Speed: 10 fps; total time 0.2 s. Plays: **holds the last frame** while he rises. Feet point (28, 47), but the feet may leave the bottom row.
- Frames:
  1. Take-off: legs pushing down, body stretched upward, front paws up.
  2. Rising: legs tucked, tail trailing down. Held until he starts to fall.

### Fall: `sammy-fall-strip-v01.png`
- Save as `assets/characters/character-sammy/sammy-fall-strip-v01.png`
- Template: `templates/art-templates/characters/character-sammy/sammy-fall-strip-TEMPLATE.png`
- Size: **96×48** (2 frames of 48×48)
- Speed: 10 fps; total time 0.2 s. Plays: **loops**. Feet point (28, 47); feet may leave the bottom row.
- Frames:
  1. Paws and legs spread, fur and tail blown upward, eyes wide.
  2. Same pose, with the fur tufts and tail tip flicked the other way (a flutter).

### Land: `sammy-land-strip-v01.png`
- Save as `assets/characters/character-sammy/sammy-land-strip-v01.png`
- Template: `templates/art-templates/characters/character-sammy/sammy-land-strip-TEMPLATE.png`
- Size: **96×48** (2 frames of 48×48)
- Speed: 15 fps; total time 0.13 s. Plays: **once**, then idle or run. Feet point (28, 47).
- When: only after a real fall, not after tiny hops. The game adds a dust puff itself; don't draw dust here.
- Frames:
  1. Squash: knees deeply bent, body 2–3 px lower, feet flat on the bottom row.
  2. Halfway back up to standing.

### Tail-whip (attack): `sammy-tail-whip-strip-v01.png`
- Save as `assets/characters/character-sammy/sammy-tail-whip-strip-v01.png`
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
- Save as `assets/characters/character-sammy/sammy-hurt-strip-v01.png`
- Template: `templates/art-templates/characters/character-sammy/sammy-hurt-strip-TEMPLATE.png`
- Size: **96×48** (2 frames of 48×48)
- Speed: 10 fps; total time 0.2 s. Plays: **once**. Feet point (28, 47).
- **Good to know:** today the game shows this whole strip as a **solid white silhouette** (a hit flash), so only the outline shape shows, not colours or small details. Afterwards Sammy blinks for 1 s while he can't be hurt.
- Frames:
  1. Flinch: head snapped back, eyes squeezed shut, body leaning backward.
  2. Knocked back: legs lifting off the ground, paws flung forward.

### Play dead (Play Possum): `sammy-play-dead-strip-v01.png`
- Save as `assets/characters/character-sammy/sammy-play-dead-strip-v01.png`
- Template: `templates/art-templates/characters/character-sammy/sammy-play-dead-strip-TEMPLATE.png`
- Size: **192×48** (4 frames of 48×48)
- Speed: 8 fps; total time 0.5 s. Plays: **holds the last frame** for as long as he plays dead (up to 3 s). Feet point (28, 47).
- **Getting up uses the same strip played backwards at double speed** (0.25 s). There's no separate get-up strip, so frames 4 → 1 must also look right as "getting up".
- When lying down, his body is about 28 px wide and 14 px tall. The game draws "Z z" above him for now.
- Frames:
  1. Dramatic clutch: paw to chest, knees buckling.
  2. Toppling sideways.
  3. Hits the ground with a small bounce.
  4. **Held pose:** flat on his back, legs stiff in the air, tongue out, X eyes. Funny, not sad.

### KO (out of hearts): `sammy-ko-strip-v01.png`
- Save as `assets/characters/character-sammy/sammy-ko-strip-v01.png`
- Template: `templates/art-templates/characters/character-sammy/sammy-ko-strip-TEMPLATE.png`
- Size: **288×48** (6 frames of 48×48)
- Speed: 10 fps; total time 0.6 s. Plays: **once**, then frame 6 stays on screen for about 1 more second before the restart. Feet point (28, 47).
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
- Save as `assets/characters/character-sammy/sammy-victory-strip-v01.png`
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

**Look (example):** a morning jogger turned zombie. Neon sweatband, headphones dangling from one ear, sweat-stained tank top, one sneaker untied, step-counter watch. Grey-blue or grey-green skin (keep it away from the grass greens, see `design/STYLE_GUIDE.md`), droopy eyes, tongue out. Funny, not scary. About 40–46 px tall, a little taller than Sammy. Uses the zombie colour set (palette line 1), shared by all zombies.

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
- Frames (cartoon gag, no blood, pending the gore decision):
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

**Look (example):** paper hat, stained apron, mustache, tongs in one hand. He stays in one place and lobs hot dogs. About Sammy's height plus a bit, in a 48×48 box (the game is set up for 48×48, not 64×64). Zombie colour set (palette line 1).

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
- Frames (he deflates like a balloon, no blood):
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
- Drawn on top of Sammy, with its centre 12 px in front of his feet and 14 px up: about **(40, 34)** in his 48×48 frame. It stays at that spot in every animation and is hidden while he plays dead or is KO'd. It flips with Sammy.
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

## Central Park background (4 layers)

Folder: `assets/environments/environment-central-park-tileset/`. Templates: `templates/art-templates/environments/environment-central-park-tileset/`.

**Look (example):** early-morning Central Park. A banded dawn sky, a flat Manhattan skyline silhouette (recognisable, but not copied from a photo or logo), a tree line, then near bushes just behind the grass. **No outlines** on background layers, and only a few colours each. All layers share the background colour set (palette line 3). No see-through haze; use dithering instead.

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
- Picture: 6–8 flat colour bands, dark blue at the top, through lighter blue and lavender, to pink and peach near the horizon. Dithered seams between bands are fine; smooth gradients are not.

### Skyline: `central-park-bg-skyline-v01.png`
- Save as `assets/environments/environment-central-park-tileset/central-park-bg-skyline-v01.png`
- Template: `templates/art-templates/environments/environment-central-park-tileset/central-park-bg-skyline-TEMPLATE.png`
- Size: **512×64** (1 picture). See-through above the buildings, so the sky shows.
- Picture: a flat silhouette of tall Manhattan buildings in 2–3 colours, with a few lit windows if you like. Seamless left-to-right loop.

### Tree line: `central-park-bg-treeline-v01.png`
- Save as `assets/environments/environment-central-park-tileset/central-park-bg-treeline-v01.png`
- Template: `templates/art-templates/environments/environment-central-park-tileset/central-park-bg-treeline-TEMPLATE.png`
- Size: **512×32** (1 picture). See-through above the treetops; fill the bottom rows solid.
- Picture: rounded tree canopies of different heights, 2–3 greens. Seamless loop.

### Bushes: `central-park-bg-bushes-v01.png`
- Save as `assets/environments/environment-central-park-tileset/central-park-bg-bushes-v01.png`
- Template: `templates/art-templates/environments/environment-central-park-tileset/central-park-bg-bushes-TEMPLATE.png`
- Size: **512×32** (1 picture). Only the **top 16 rows** are ever seen (the grass covers the rest).
- **Fill it solid, with no see-through pixels.** Only the sky is behind this layer, so any gap would look like a hole. Fill the spaces between bushes with a darker tree or shadow colour.
- Picture: round bushes just behind the grass, a bit brighter than the tree line. Seamless loop.

---

## Sounds

**Feel (Proposed):** 16-bit era console sound: FM-synth bass and bright leads plus simple chip beeps and noise drums. Original sounds only: don't sample or imitate sounds or tunes from commercial games.

**How to deliver:** each sound has its own folder. Save it as `<id>-v01.ogg` (an `.mp3` beside it helps older Safari, and `.wav` also works). Or send WAV masters (44.1 kHz, 16-bit) and Claude converts them with `node tools/convert-audio.mjs`. Trim silence from the start. **Variations:** save extra versions as `<id>-v01-a.ogg`, `<id>-v01-b.ogg`, and so on. The game picks **one at random** each time. Until a file arrives, each sound plays a placeholder beep.

**Volume:** the game plays music at 60% and effects at 80%. Keep effects at similar loudness to each other, and never quite at full volume (peaks at −1 dB).

### Music (2 tracks)

Music **loops whole**: the end must flow straight back into the start with no click or gap. A separate intro that plays once isn't possible yet.

| Sound | Save in | When it plays | Suggested length and feel |
|---|---|---|---|
| `music-level-01-central-park` | `assets/audio/music/music-level-01-central-park/` | From pressing Start, through the level. Pauses with the game. Stops when Sammy is KO'd, then starts again from the top when he comes back at the checkpoint. A restart from the pause menu keeps it playing. Stops when the level is cleared. | 60–90 s loop. Upbeat and a little spooky-silly, about 130–150 beats a minute: slap bass, bright lead, noise hi-hats. |
| `music-level-01-gauntlet` (optional) | `assets/audio/music/music-level-01-gauntlet/` | The final zombie fight (3 waves), until the exit opens; then the level music comes back. Without this file, the level music just keeps playing. | 30–60 s loop. Faster and more urgent, the same mood and instruments. |

### Sound effects (21)

All play once (none loop). Save each in `assets/audio/sfx/<id>/`, for example `assets/audio/sfx/sfx-jump/sfx-jump-v01.ogg`.

| Sound | When it plays in the game | Suggested length and feel | Variations |
|---|---|---|---|
| `sfx-jump` | Sammy leaves the ground | 0.15–0.25 s, rising chip "boing" | 1 |
| `sfx-land` | Sammy lands after a real fall (not small hops) | about 0.1 s, soft thud | 2 |
| `sfx-tail-whip` | The tail-whip starts | 0.15–0.2 s, whoosh | 2 |
| `sfx-hit-zombie` | The whip hits a zombie | 0.1–0.2 s, cartoon smack or bonk | 3 |
| `sfx-zombie-groan` | A jogger first notices Sammy (at most once every 1.5 s), and when each wave of the final fight drops in | 0.5–1 s, comic groan, not scary; short so groans don't pile up | 3 or more |
| `sfx-pickup` | Sammy grabs a hot dog or a trash lid | 0.2–0.3 s, bright rising notes | 1 |
| `sfx-hurt` | Sammy loses a heart (also plays with the splash when he falls in the pond) | 0.2–0.3 s, squeak plus a noise hit | 2 |
| `sfx-play-dead` | Sammy starts playing dead | 0.4–0.6 s, thud plus a comic wheeze | 1 |
| `sfx-zombie-defeat-comedic` | Any zombie is defeated (jogger or vendor) | 0.5–1 s, slapstick: pop, slide whistle, kazoo-like fizzle | up to 3, but see "Needs direction" |
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
