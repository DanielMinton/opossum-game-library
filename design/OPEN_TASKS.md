# Open tasks: what's waiting on you

*Dated 2026-10-19.* A short list of everything that needs your answer or your go-ahead. Details of each question are in `design/OWNER_DECISIONS.md`. Nothing here is decided until you say so.

To reply, tell Claude in plain words, for example "go with the suggestions for 1, 2 and 6" or "yes to go-ahead items 1 and 3".

## Suggested first five

This order follows the library review and the "What's next" list in `design/DECISIONS.md`.

1. ~~**Save today's changes** (go-ahead item 1).~~ *Done 2026-10-19: saved into the project history together with the phone work (mobile steps 3 and 4).*
2. **Answer the art questions before more art is drawn:** gore level ([1](OWNER_DECISIONS.md#1-how-gory-and-who-is-it-for)), art style and palettes ([2](OWNER_DECISIONS.md#2-do-you-approve-the-art-style)), Sammy's size ([6](OWNER_DECISIONS.md#6-how-big-is-sammy-and-how-far-does-his-tail-reach)).
3. **Check the drawing tool's terms** for Sammy's run art ([13](OWNER_DECISIONS.md#13-do-the-drawing-tools-terms-let-you-sell-the-game-with-sammys-run-art)).
4. **Pick who makes the art and music** ([4](OWNER_DECISIONS.md#4-who-makes-the-art-and-the-music)), then hand them `design/ART_BRIEFS.md` and the picture templates (see "Art and sound to make").
5. **Choose where the game goes online** ([14](OWNER_DECISIONS.md#14-where-should-the-game-go-online-and-should-it-start-private)), so it can be tried on real phones with `design/MOBILE_TEST_CHECKLIST.md`. The phone layout is already built (go-ahead item 2, done).

## Needs your answer

Each line links to the full question, its suggested answer and why it matters.

1. [How gory, and who is it for?](OWNER_DECISIONS.md#1-how-gory-and-who-is-it-for)
2. [Do you approve the art style (and its palette plan)?](OWNER_DECISIONS.md#2-do-you-approve-the-art-style)
3. [What is the game called?](OWNER_DECISIONS.md#3-what-is-the-game-called)
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

## Needs your go-ahead

Work Claude can do as soon as you say "go". None of it needs a decision from you beyond yes or no.

1. **Save today's changes into the project history.** About 35 files changed or were added today (doc fixes, the "still missing" lists, this task list, the art briefs, and the picture templates with the tool that makes them). *Done 2026-10-19: saved, together with mobile steps 3 and 4.*
2. **Phone layout (step 3 of the desktop-and-mobile plan):** a "turn your phone sideways" message (see question 12), stop accidental zoom when the picture is double-tapped, and a test for notches on the left or right side, changing the code only if the test fails. Full screen waits (question 17). *Done 2026-10-19 (mobile step 3), built in parallel with this list: the sideways message (with a PLAY UPRIGHT ANYWAY button, phones only), no accidental zoom, notch tests on every side, auto-pause, and a full-screen button where the browser allows it (see question 17).*
3. **Look into 3 browser checks that fail on this computer.** On a laptop-size screen (1366×768) and a phone held sideways (852×393), the picture comes out a different size than expected, and on the sideways phone it fills only 57% of the screen height, where the check wants 90%. The test browser's window also came out smaller than asked for (for example 834×297 instead of 852×393), so the problem may be in the test set-up rather than the game. That isn't confirmed yet. These checks also failed before today's changes. All 30 other browser checks pass. *Update 2026-10-19: after merging with mobile steps 3 and 4, all 51 browser checks pass on the owner's Mac, including these three. Nothing more to do unless they fail again.*
4. **Fix the background widths in three docs.** `design/STYLE_GUIDE.md` (the line above the background table), `templates/STYLE_GUIDE.md` (the blank template: that line and the table) and row 1.6 of `design/ASSET_REQUEST_CHECKLIST.md` still say background bands can be "256 or 512" pixels wide. The game only accepts 512 (and 320 for the sky).
5. **Update one out-of-date line in `CLAUDE.md`** (Claude's own guide to this project). It says `assets/` holds only empty folders, but Sammy's run art is there now. Claude won't change that file without your OK.
6. **Wake up sound on the first tap,** once the first real sound files arrive, then test on a real iPhone. (Today's beeps don't need it.) *Done 2026-10-19 (mobile step 4), built in parallel with this list: the first tap now starts sound and readies every sound file. Still to do: the real-iPhone test, with `design/MOBILE_TEST_CHECKLIST.md`.*

## Art and sound to make

- **Still missing today:** 33 of 34 planned pictures and all 23 planned sounds. Only Sammy's run is real.
- **Not in those counts:** art the game has no place to show yet, such as the 8×8 font, the hearts, the Play Possum icon and the park tile sheet (full list in `game/README.md`, "Requested art the game can't show yet"). Also the four palette sheets, which set the colours rather than appear on screen.
- **What each one should look and sound like:** `design/ART_BRIEFS.md` (all Proposed).
- **Picture templates:** `templates/art-templates/` has a see-through template for each planned picture, at the exact size the game needs, with faint guide marks (box edges, feet point, ground line, hit frame). Erase every guide mark before saving the real art. Contact sheets (`contact-sheet-*.png`) show each group enlarged and labelled. To make the templates again, go into the `game` folder and run `node tools/make-art-templates.mjs`.
- **See exactly what's missing, with each file's name, folder and size:** go into the `game` folder and run `node tools/scan-assets.mjs`.
- **Order to send them in:** Tier 1 first, as listed in `design/ASSET_REQUEST_CHECKLIST.md`.
- **Every file needs a license row** in `design/ASSET_SOURCES.csv`, or it is left out of the ready-to-share copy.

## Later: needs direction

These can wait, but each needs a choice or input from you before work starts.

- **Park tile sheet and tile map.** The ground and platforms need a tile sheet plus a map of which tile goes where before real ground art can be drawn in the game (`game/src/assets.js`).
- **Palette sheets.** Four colour swatch sheets, one per palette, in a new folder, `assets/ui/palettes/` (`design/STYLE_GUIDE.md`). Who makes them depends on question 4.
- **Game rules still marked TBD in the examples.** Many were filled in for the playable level (3 hearts, the shield blocks from all sides, and others). They are listed in `design/DECISIONS.md` under "Open TBDs from the examples, settled in code". Change any you don't like.
- **Example choices still open.** The level's on-screen name ("Sheep Meadow" or "Wake-Up Call"), a real Central Park landmark to show, background sounds like distant groans or birds, and how fast the music is. See the examples in `templates/examples/`.
- **More levels.** The code assumes level 1's shape today (one ground height, a final zombie fight in every level, Central Park backgrounds only). A second level needs a level sketch from you first (`design/ASSET_REQUEST_CHECKLIST.md`, item 1.12).
- **A third zombie type.** Before it's added, the code that handles zombie types gets tidied into one table, as planned in `CLAUDE.md`. It needs a description and art like the first two.
- **A playtest with real players,** mainly of the final zombie fight (question 11).
