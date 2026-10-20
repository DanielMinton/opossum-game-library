# Open tasks: what's waiting on you

*Dated 2026-10-19 (updated for the "Zombie Hunter" direction).* A short list of everything that needs your answer or your go-ahead. Details of each question are in `design/OWNER_DECISIONS.md`. Nothing here is decided until you say so.

To reply, tell Claude in plain words, for example "go with the suggestions for 1, 2 and 6" or "yes to go-ahead items 1 and 3".

## New direction (2026-10-19): Zombie Hunter

You chose a new direction: a badass opossum who doesn't mess around with zombies, with a chainsaw, at night in Central Park (Bethesda Terrace), gorier, with your theme song. What's done and what's waiting:
- **Done (step A):** the design docs now follow it (old "comedic, not scary" and "no blood" lines are marked superseded), your song is the level music in your own copy, your concept picture is saved as a reference, and the README has new artwork. Details: `design/DECISIONS.md`, "New direction — Zombie Hunter".
- **Done (step B, 2026-10-19):** the chainsaw is in the game with real art (Sammy idle, run and rev with the saw, the pickup and the top-bar icon), plus stylized gore with a low-gore setting (G key, `?gore=low`, GORE button), the night park, a placeholder Bethesda Terrace for the final fight, the "Zombie Hunter" title screen and the swearing deadpan voice. All Proposed: please play it and say if the fuel (20 seconds of revving), the gore and the jokes feel right. Details: `design/DECISIONS.md`, "Stage B".
- **Scenery (2026-10-19, Proposed):** the park and Bethesda Terrace now look much better in code, and 18 scenery slots are ready for real art (briefs in `design/ART_BRIEFS.md`). Please look and say what to change (trees, lamps, the angel), (foreground trees now pass behind Sammy, so a trunk can never hide him; say if you'd rather have them in front). Details: `design/DECISIONS.md`, "2026-10-19: Scenery slots and park look".
- **Art importer v2 (2026-10-19, Proposed):** the importer can now build a whole zombie (every strip, one shared size and palette, a clean outline, acid green and blood red kept off it) from one sheet: `--detect`, look at the overlay, then `--character map.json` (steps in `design/ART_PROMPTS.md`). Nothing for you to decide yet; when you have a zombie you like, say so and Claude installs it (that also needs the new enemy type added to the game, see CLAUDE.md "Add an enemy type"). Details: `design/DECISIONS.md`, "2026-10-19: Importer v2".
- **Sammy rebuilt from your master sheets (2026-10-20; your choice B, Confirmed):** all 13 of Sammy's animations are now real art cut from your two sheets (grey-brown fur, cream face, red polka-dot bandana), one look everywhere, with the four-legged crawl as his run (your choice). The old white-faced run and the code-built chainsaw strips are no longer used (they stay on disk as `-v01`). Please play it and say whether the crawl feels right at speed, and whether the hurt flinch and the K.O. tumble read well. The frames still to generate are listed under **Sammy frames still wanted** below. Details: `design/DECISIONS.md`, "2026-10-20: Sammy rebuilt from the master sheets (option B)".
- **Small leftovers from step B:** the README pictures (banner, cast, footer) still say the chainsaw is "coming next" and need redrawing; the chainsaw "cut" strip from the art brief isn't drawn yet (the rev strip covers cutting for now); the browser tab still says "Sammy (placeholder prototype)".
- **Waiting on you:** which Suno plan the song was made on ([21](OWNER_DECISIONS.md#21-which-suno-plan-was-the-theme-song-made-on)), the exact gore level and age ([1](OWNER_DECISIONS.md#1-how-gory-and-who-is-it-for)), and the title ([3](OWNER_DECISIONS.md#3-what-is-the-game-called); suggested: "Sammy the Opossum: Zombie Hunter").

## Suggested first five

This order follows the library review and the "What's next" list in `design/DECISIONS.md`.

1. ~~**Save today's changes** (go-ahead item 1).~~ *Done 2026-10-19: saved into the project history together with the phone work (mobile steps 3 and 4).*
2. **Answer the art questions before more art is drawn:** gore level ([1](OWNER_DECISIONS.md#1-how-gory-and-who-is-it-for); *2026-10-19: you chose "gorier"; the exact level and age are left*), art style and palettes ([2](OWNER_DECISIONS.md#2-do-you-approve-the-art-style)), Sammy's size ([6](OWNER_DECISIONS.md#6-how-big-is-sammy-and-how-far-does-his-tail-reach)).
3. **Check the drawing tool's terms** for Sammy's run art ([13](OWNER_DECISIONS.md#13-do-the-drawing-tools-terms-let-you-sell-the-game-with-sammys-run-art)).
4. **Pick who makes the art and music** ([4](OWNER_DECISIONS.md#4-who-makes-the-art-and-the-music)), then hand them `design/ART_BRIEFS.md` and the picture templates (see "Art and sound to make").
5. **Choose where the game goes online** ([14](OWNER_DECISIONS.md#14-where-should-the-game-go-online-and-should-it-start-private)), so it can be tried on real phones with `design/MOBILE_TEST_CHECKLIST.md`. The phone layout is already built (go-ahead item 2, done).

## Needs your answer

Each line links to the full question, its suggested answer and why it matters.

1. [How gory, and who is it for?](OWNER_DECISIONS.md#1-how-gory-and-who-is-it-for) (direction set: gorier; exact level and age still open)
2. [Do you approve the art style (and its palette plan)?](OWNER_DECISIONS.md#2-do-you-approve-the-art-style)
3. [What is the game called?](OWNER_DECISIONS.md#3-what-is-the-game-called) (new suggestion: "Sammy the Opossum: Zombie Hunter")
4. [Who makes the art and the music?](OWNER_DECISIONS.md#4-who-makes-the-art-and-the-music)
5. [What's in the first release?](OWNER_DECISIONS.md#5-whats-in-the-first-release)
6. [How big is Sammy? (His run art is taller than planned.)](OWNER_DECISIONS.md#6-how-big-is-sammy-and-how-far-does-his-tail-reach)
7. [One text size or two?](OWNER_DECISIONS.md#7-one-text-size-or-two)
8. [Double-click to play, or only on a website?](OWNER_DECISIONS.md#8-double-click-to-play-or-only-on-a-website)
9. [Keep the ready-to-share copy in the project history?](OWNER_DECISIONS.md#9-keep-the-ready-to-share-copy-in-the-project-history)
10. [Should playing dead protect Sammy from bumps?](OWNER_DECISIONS.md#10-should-playing-dead-protect-sammy-from-zombies-that-bump-into-him)
11. [Is the final zombie fight too hard?](OWNER_DECISIONS.md#11-is-the-final-zombie-fight-too-hard) (best answered after someone plays it)
12. [How should phones be held? (Hint or block when upright.)](OWNER_DECISIONS.md#12-how-should-phones-be-held)
13. [Do the drawing tool's terms let you sell the game with Sammy's run art?](OWNER_DECISIONS.md#13-do-the-drawing-tools-terms-let-you-sell-the-game-with-sammys-run-art)
14. [Where should the game go online, and should it start private?](OWNER_DECISIONS.md#14-where-should-the-game-go-online-and-should-it-start-private)
15. [May new art change attack timing by itself?](OWNER_DECISIONS.md#15-may-new-art-change-attack-timing-by-itself)
16. [Should a tail-whip pressed a split second early still count?](OWNER_DECISIONS.md#16-should-a-tail-whip-pressed-a-split-second-early-still-count)
17. [Full screen on phones and tablets](OWNER_DECISIONS.md#17-full-screen-on-phones-and-tablets-later) (later)
18. [A faster way to play sound files](OWNER_DECISIONS.md#18-a-faster-way-to-play-sound-files-later-only-if-needed) (later, only if needed)
19. [Naming choices](OWNER_DECISIONS.md#19-optional-naming-choices) (optional)
20. [Confirm the basics the playable level already uses](OWNER_DECISIONS.md#20-confirm-the-basics-the-playable-level-already-uses) (side view, controls, Play Possum, nods, player options, release date)
21. [Which Suno plan was the theme song made on?](OWNER_DECISIONS.md#21-which-suno-plan-was-the-theme-song-made-on) (added 2026-10-19; decides whether the song can go in the shareable copy)

## Needs your go-ahead

Work Claude can do as soon as you say "go". None of it needs a decision from you beyond yes or no.

1. **Save today's changes into the project history.** About 35 files changed or were added today (doc fixes, the "still missing" lists, this task list, the art briefs, and the picture templates with the tool that makes them). *Done 2026-10-19: saved, together with mobile steps 3 and 4.*
2. **Phone layout (step 3 of the desktop-and-mobile plan):** a "turn your phone sideways" message (see question 12), stop accidental zoom when the picture is double-tapped, and a test for notches on the left or right side, changing the code only if the test fails. Full screen waits (question 17). *Done 2026-10-19 (mobile step 3), built in parallel with this list: the sideways message (with a PLAY UPRIGHT ANYWAY button, phones only), no accidental zoom, notch tests on every side, auto-pause, and a full-screen button where the browser allows it (see question 17).*
3. **Look into 3 browser checks that fail on this computer.** On a laptop-size screen (1366×768) and a phone held sideways (852×393), the picture comes out a different size than expected, and on the sideways phone it fills only 57% of the screen height, where the check wants 90%. The test browser's window also came out smaller than asked for (for example 834×297 instead of 852×393), so the problem may be in the test set-up rather than the game. That isn't confirmed yet. These checks also failed before today's changes. All 30 other browser checks pass. *Update 2026-10-19: after merging with mobile steps 3 and 4, all 51 browser checks pass on the owner's Mac, including these three. Nothing more to do unless they fail again.*
4. **Fix the background widths in three docs.** `design/STYLE_GUIDE.md` (the line above the background table), `templates/STYLE_GUIDE.md` (the blank template: that line and the table) and row 1.6 of `design/ASSET_REQUEST_CHECKLIST.md` still say background bands can be "256 or 512" pixels wide. The game only accepts 512 (and 320 for the sky).
5. **Update `CLAUDE.md`** (Claude's own guide to this project). Claude won't change that file without your OK. (a) It says `assets/` holds only empty folders, but Sammy's run art and the theme song are there now. (b) *Added 2026-10-19:* it still describes "cartoon zombies" and has no gore rule. *Update 2026-10-19 (Stage B): the new tone, the swearing rule and a gore rule are now in `CLAUDE.md`, following your direction; (a) is fixed too.* The proposed new lines (the new tone, "stylized gore only; Sammy never bleeds; every gory picture needs a low-gore version") are written out in `design/DECISIONS.md`, "New direction — Zombie Hunter".
6. **Wake up sound on the first tap,** once the first real sound files arrive, then test on a real iPhone. (Today's beeps don't need it.) *Done 2026-10-19 (mobile step 4), built in parallel with this list: the first tap now starts sound and readies every sound file. Still to do: the real-iPhone test, with `design/MOBILE_TEST_CHECKLIST.md`.*

## Art and sound to make

- **Still missing today:** 42 of 57 planned pictures and 26 of 27 planned sounds. Real: all 13 of Sammy's animations, the chainsaw pickup and icon, and the level music (your theme song). *(Updated 2026-10-20.)*
- **Chainsaw sounds still needed:** `sfx-chainsaw-start`, `sfx-chainsaw-rev` (loops), `sfx-chainsaw-cut`, `sfx-gore-splat`. Their folders are ready in `assets/audio/sfx/`; the game beeps until they arrive.
- **Not in those counts:** art the game has no place to show yet, such as the 8×8 font, the hearts, the Play Possum icon and the park tile sheet (full list in `game/README.md`, "Requested art the game can't show yet"). Also the four palette sheets, which set the colours rather than appear on screen.
- **What each one should look and sound like:** `design/ART_BRIEFS.md` (all Proposed).
- **Picture templates:** `templates/art-templates/` has a see-through template for each planned picture, at the exact size the game needs, with faint guide marks (box edges, feet point, ground line, hit frame). Erase every guide mark before saving the real art. Contact sheets (`contact-sheet-*.png`) show each group enlarged and labelled. To make the templates again, go into the `game` folder and run `node tools/make-art-templates.mjs`.
- **See exactly what's missing, with each file's name, folder and size:** go into the `game` folder and run `node tools/scan-assets.mjs`.
- **Order to send them in:** Tier 1 first, as listed in `design/ASSET_REQUEST_CHECKLIST.md`.
- **Every file needs a license row** in `design/ASSET_SOURCES.csv`, or it is left out of the ready-to-share copy.

## Sammy frames still wanted (2026-10-20)

Every Sammy animation plays today (holds and repeats fill the gaps). These are the frames the image tool still has to produce, and exactly where each one drops in. Generated frames are cut in with `game/tools/import-art.mjs` and land as `-v03` strips. Add the shared style line to every prompt:

> Same Sammy the opossum as the master sheet: grey-brown fur, cream face, blue eye with dark eye mask, dark ears, thick pink tail, red polka-dot bandana with a loose knot. 16-bit pixel art, facing right, side view, clean 1 px dark outline, plain solid black background, no text, no dust, no speed lines, no motion arcs, single character, same camera distance and scale as the master sheet (standing idle about 120 px tall on a 1536x1024 sheet).

**Priority 1 (so the animations do not look broken)**

| Strip (today) | Wanted | Where it slots in |
|---|---|---|
| Chainsaw run (`sammy-chainsaw-run`, the one sheet frame repeated 8 times: it slides instead of running) | **7 frames**: a full run cycle with the saw held out in both paws, mouth open roaring: contact, down, passing, up, contact, down, passing, up; tail streaming behind | replaces frames 2-8 (keep the sheet frame as frame 1); 64×48 cells, feet (26, 47); the saw tip no more than 37 px in front of the feet |
| Run (`sammy-run`, 5 crawl poses played out and back) | **3 in-betweens**: A front paws mid-reach and hind paws pushing off; B all four paws tucked, body highest; C hind paws landing, front paws extended | new order: pose 1, A, 2, 3, B, 4, C, 6 (drops the backwards 4/3/2); 64×48 cells, feet (36, 47); same crawl camera as the sheet's row 2 |
| Fall (`sammy-fall`, frame 2 is a back view with no face) | **1 frame**: head-down fall, arms flung back, legs trailing up, mouth open | replaces frame 2; airborne, fits 48×48 at scale 0.32 |
| Play dead (`sammy-play-dead`, frame 4 repeats frame 3) | **1 frame**: settled belly-up, paw curled on the chest, tongue out, one X eye, calm | replaces frame 4 (the held frame); 64×48 cells, feet (32, 47) |
| K.O. (`sammy-ko`, frames 1-2 are the same tumble) | **2 frames**: thrown backwards through the air (X eyes, flailing), then a bounce on the back (feet up, one small puff) | the air frame replaces frame 2, the bounce replaces frame 3; 76×48 cells, feet (38, 47) |

**Priority 2 (polish)**

| Strip (today) | Wanted | Where |
|---|---|---|
| Victory (`sammy-victory`, the sunglasses "cool" pose, 3 poses) | **4 frames** cheer: crouch, jump with fists up, peak, landing | replaces all 4; 48×48, feet (28, 47) |
| Play dead | **1 frame** sag: collapsing sideways, paw to the forehead, tongue out, X eye | replaces frame 1 |
| Hurt (`sammy-hurt`, frame 2 reads as a reach) | **1 frame** flinch: head snapped back, eyes shut, arms in, no dust | replaces frame 2; must fit 48×48 with the feet at 28 (both current poses lean past the box and were slid back) |
| Land (`sammy-land`, both frames lunge forward, feet at 17) | **2 frames**: a landing crouch with a small puff, the whole body inside 48×48 with the feet at column 28 | replaces both frames and lets the feet point go back to (28, 47) in `game/src/assets.js` |
| Chainsaw idle (`sammy-chainsaw-idle`, 2 poses alternating) | **2 frames** breathing: body 1 px lower, saw bar bobbing | replaces frames 3 and 4 |

Also open, not frames: the X eyes (play-dead, K.O.) could use a hand repaint (a 3×3 black X on a white dot; the sheet's X marks blur to a blob at game size); the tail curl is wider than the 48 px cell, so idle and victory lose about 7 px of tail tip; the chainsaw rev's second frame slides 8 px to keep the long saw inside the box, so the body shakes while revving (it reads as revving, but a redraw with a shorter bar would be calmer).

## Later: needs direction

These can wait, but each needs a choice or input from you before work starts.

- **Park tile sheet and tile map.** The ground and platforms need a tile sheet plus a map of which tile goes where before real ground art can be drawn in the game (`game/src/assets.js`).
- **Palette sheets.** Four colour swatch sheets, one per palette, in a new folder, `assets/ui/palettes/` (`design/STYLE_GUIDE.md`). Who makes them depends on question 4.
- **Game rules still marked TBD in the examples.** Many were filled in for the playable level (3 hearts, the shield blocks from all sides, and others). They are listed in `design/DECISIONS.md` under "Open TBDs from the examples, settled in code". Change any you don't like.
- **Example choices still open.** The level's on-screen name ("Sheep Meadow" or "Wake-Up Call"), a real Central Park landmark to show, background sounds like distant groans or birds, and how fast the music is. See the examples in `templates/examples/`.
- **More levels.** The code assumes level 1's shape today (one ground height, a final zombie fight in every level, Central Park backgrounds only). A second level needs a level sketch from you first (`design/ASSET_REQUEST_CHECKLIST.md`, item 1.12).
- **A third zombie type.** Before it's added, the code that handles zombie types gets tidied into one table, as planned in `CLAUDE.md`. It needs a description and art like the first two.
- **A playtest with real players,** mainly of the final zombie fight (question 11).
