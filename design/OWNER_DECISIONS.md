# Decisions only you can make

These are open questions about Sammy's game that only you, the owner, can answer. Each one has a **suggested answer** that the game or the docs use for now, and a note on why it matters. Nothing here is decided until you say so.

To answer, edit this file, or just tell Claude (for example, "go with the suggestions for 1, 3 and 7"). Claude then records your answer in `design/DECISIONS.md` and changes the game and docs to match.

*Last updated 2026-10-20 (the zombie roster and the Brute: questions 23 to 30, all answered; question 22 partly answered by them).*

---

### 1. How gory, and who is it for?
- **Your new direction (2026-10-19):** a badass opossum who doesn't mess around with zombies: action-horror with dark humour, a chainsaw, sparks and gore, at night in Central Park. So the game is going **gorier**; that part is decided.
- **Suggested now:** **stylized 16-bit gore.** Chunky pixel blood in a few solid colours, zombies cut in half by the chainsaw, green zombie ichor, sparks. Not realistic, no lingering close-ups, and Sammy himself never bleeds. Plus a **"low gore" option** in the game that swaps blood for green ichor and dust and keeps bodies in one piece. Aimed at players **13 and up**.
- *(Earlier suggestion, superseded 2026-10-19 by your new direction: cartoon slapstick with no blood, heads popping off and bouncing, zombies deflating like balloons, aimed at about 10 and up.)*
- **Still your call:** exactly how much blood, whether the low-gore option is on or off when the game starts, and the age you aim for.
- **Why it matters:** it changes what the artist draws, which websites and stores will take the game, and who can play it. Some stores and sites ask for an age rating, and gore raises it.

### 2. Do you approve the art style?
- **Update (2026-10-19):** the four palette sheets (the colour swatches each kind of art draws from) have not been made yet. Approving the style guide includes its palette plan: which palette is used for what. The sheets go in `assets/ui/palettes/` when they arrive.
- **Suggested:** the draft in `design/STYLE_GUIDE.md`. A thin dark outline around Sammy, the zombies and anything you can touch or stand on, but none on the background. Light comes from the top-left, and each colour has three shades (dark, middle, light).
- **Why it matters:** the artist needs this before drawing anything. Changing it after art arrives means redrawing.

### 3. What is the game called?
- **Suggested now (2026-10-19):** **"Sammy the Opossum: Zombie Hunter"**, taken from your theme song's title, as the working title. The README banner already uses it, marked "working title". Avoid "Sega", "Genesis" and other company or console names.
- *(Earlier suggestion, superseded 2026-10-19: keep "Sammy" as a working name for now.)*
- **Still your call:** the final name. The browser tab and the game's title screen still say "Sammy" until you decide.
- **Why it matters:** the title screen, the logo art and any store or website page all need it.

### 4. Who makes the art and the music?
- **Suggested:** you choose an artist and a composer, or use free art and music that allows selling a game, with the credit lines it asks for.
- **Why it matters:** everything on screen is a placeholder until real art arrives. Every file also needs a row saying who made it and what you're allowed to do with it, or it can't go into the shareable copy.

### 5. What's in the first release?
- **Suggested:** one Central Park level (the one that's playable now), Sammy's tail-whip and Play Possum, two zombie types, the hot dog cart and the trash-lid shield. *(Update 2026-10-20: you've since asked for four more zombie types and the Brute boss in level 1 (questions 23 to 30), so the first release is "level 1 with the full roster and the Brute" unless you say otherwise.)*
- **Why it matters:** a small first release can come out much sooner. Every extra level or zombie type adds art, sound and testing.

### 6. How big is Sammy, and how far does his tail reach?
- **Update (2026-10-19):** Sammy's run art (the first real art) shows him about 43 pixels tall with his ears, taller than the 32–40 pixels the plan asks for. If that height stays, the zombies should be drawn a little taller than him. Every new Sammy picture must also centre his body 28 pixels from the left of its box (36 for the tail-whip), so he doesn't jump sideways between animations. The notes with the run art said 12.5 frames a second; the game uses 12.
- **Suggested:** accept Sammy at about 43 pixels tall, change the plan to match, and draw the zombies a little taller than him. Keep today's box sizes too. Sammy is drawn in a 48×48 pixel box (his tail-whip pictures use a wider 64×48 box), and the whip hits up to 26 pixels in front of him.
- **Why it matters:** the artist draws every picture of Sammy at this size. Changing it later means redrawing all of them. A shorter whip would fit in the normal box but makes fights harder.

### 7. One text size or two?
- **Suggested:** one simple 8×8 pixel font, and shorten the few long lines of on-screen text so they fit (about 38 letters per line).
- **Why it matters:** an 8×8 font fits only 40 letters across the screen. Four lines of game text are longer than that today. The other choice is a second, smaller font for long text, which is one more thing to draw.

### 8. Double-click to play, or only on a website?
- **Update (2026-10-19):** desktop and mobile are now a confirmed major priority. Phones and tablets can't open a game by double-clicking a file, so the mobile version must be played from a website (for example itch.io or GitHub Pages).
- **Suggested:** both. Keep double-click working on desktop, and also put the game on a website for phones and tablets.
- **Why it matters:** when the game is opened by double-click, the browser blocks the sound method needed to play a music track's opening once and then loop only the rest smoothly. So, for now, each music track must loop whole, from end to start. If the game only ever runs on a website, music with a separate opening becomes possible.

### 9. Keep the ready-to-share copy in the project history?
- **Suggested:** yes, for now. The ready-to-share copy (`game/dist/`) stays saved alongside everything else, so you can always grab the latest playable version.
- **Why it matters:** it's convenient, but every change to the game also changes this copy, so the project history gets bigger and noisier. The alternative is making it fresh only when you want to share.

### 10. Should playing dead protect Sammy from zombies that bump into him?
- **Suggested:** no, as now. Playing dead makes nearby zombies lose track of Sammy, but a zombie that was too far away to be fooled can still walk into him and hurt him.
- **Why it matters:** if playing dead also made Sammy safe from bumps, it would be much stronger and the level easier. If not, players need to time it.

### 11. Is the final zombie fight too hard?
- **Suggested:** keep it as it is (3 waves: 2 zombies, then 3, then 4) until someone plays it, then decide.
- **Why it matters:** nobody has tested it with real players yet. The computer player that tests the game loses at the second wave when it can be hurt. A person who jumps away and plays dead may do fine, or may find it too hard. Easy fixes are fewer zombies, longer gaps between waves, or a hot dog in the arena.

### 12. How should phones be held?
- **Update (2026-10-19):** the game already plays upright today, with the picture above the touch buttons. So the "turn your phone sideways" message can be a hint (upright still works) or a block (upright stops the game). The library review recommends a hint.
- **Suggested:** sideways is best, but upright still works. If a phone is held upright, show a friendly "turn your phone sideways" message, with a button to play upright anyway. *(Earlier suggestion, before upright play was known to work: sideways (landscape) only.)*
- **Why it matters:** the game screen is wider than it is tall, like a TV. Upright play already works, but the picture is small, with the touch buttons below it. A block would stop upright play completely; a hint that never pauses the game is the other choice.
- **What the game does now (2026-10-19):** the suggestion. Held upright, a "TURN YOUR PHONE SIDEWAYS" message shows and the game waits (phones only; tablets such as an iPad play upright without it); a "PLAY UPRIGHT ANYWAY" button lets people play upright if they prefer. This is still your call: say "sideways only" (we remove the button), "both" (we keep it as it is), or "upright too" (we drop the message).

### 13. Do the drawing tool's terms let you sell the game with Sammy's run art?
- **Suggested:** you check the terms of the AI coding assistant used to draw `sammy-run-strip-v01.png`, and tell Claude what they say. Until then, treat the run art as fine for testing but not for selling.
- **Why it matters:** the run art is already in the shareable copy. Its row in `design/ASSET_SOURCES.csv` says "owner to confirm the tool's terms allow selling the game". Answer this before the game goes on a public website or store.
- **Update (2026-10-20):** the same question now covers all 13 of Sammy's animations, which were cut from your two master sheets made with **ChatGPT image generation** (the old run strip is no longer used). Their rows in `design/ASSET_SOURCES.csv` say the same thing: please confirm that the image tool's current terms allow selling a game made with its pictures.

### 14. Where should the game go online, and should it start private?
- **Suggested:** a private draft page on itch.io first (only people with the link can play), so it can be tried on a real iPhone and Android phone. Go public later. GitHub Pages is the other choice. Before going public, change the browser-tab title, which still says "placeholder prototype".
- **Why it matters:** phones can't open the game by double-clicking a file (see question 8), so nobody can test on a real phone until it's on a website. Claude can prepare the files, but uploading needs your go-ahead and your account.

### 15. May new art change attack timing by itself?
- **Suggested:** no, for now. Keep each attack's timing as its own setting, and keep the automatic check that catches art and timing that don't match.
- **Why it matters:** today each animation's timing is written twice, once with the art list and once with the game settings. Writing it once would be simpler, but then a slower tail-whip drawing would also make a slower attack, and the moment the hit lands would move with it.

### 16. Should a tail-whip pressed a split second early still count?
- **Suggested:** yes. Jump already accepts a press made up to 0.1 seconds early. Doing the same for the whip would make it feel more responsive, especially on touch screens.
- **Why it matters:** today a whip pressed just before Sammy is ready is dropped, which can feel like lag. Accepting it changes the game's feel slightly, so it's your call.

### 17. Full screen on phones and tablets (later)
- **Suggested:** decide after the game has been tried on real phones. If you want it, add a full-screen button to the pause menu.
- **Why it matters:** iPads and Android phones allow full screen for web games. iPhones don't, so it would help some players, not all.
- **What the game does now (2026-10-19):** the phone layout work added a small full-screen button next to PAUSE, shown only where the browser allows full screen (not on iPhones; there, "Add to Home Screen" gives a similar result). It was built while this question was being written. If you'd rather wait, say so and it comes out; otherwise it stays, and the question is only whether to also put it in the pause menu.

### 18. A faster way to play sound files (later, only if needed)
- **Suggested:** keep the current way unless tests on real phones show sounds clearly lagging behind the action.
- **Why it matters:** the faster way doesn't work when the game is opened by double-click. Switching would undo a recorded decision ("Sound file support" in `design/DECISIONS.md`) and one of the project's set rules, so double-click play would lose real sounds.

### 19. Optional: naming choices
- **Suggested:** leave things as they are. (a) Art file names don't have to start with their folder's name (sound names already do). (b) In `design/ASSET_SOURCES.csv`, the first column (`asset_id`) keeps today's style: the file's name without the version number, like `sammy-run-strip`, rather than the game's own name for that art, like `sammy:run`.
- **Why it matters:** matching names make files easier to find and check, but renaming the planned files means changing the game's art list too. Neither choice blocks any work.

### 20. Confirm the basics the playable level already uses
- **Suggested:** yes, as built. These were never formally approved, but the playable level already works this way:
  - (a) Seen from the side, scrolling left to right.
  - (b) Controls: keyboard and gamepad on computers, touch buttons on phones and tablets.
  - (c) Play Possum (Sammy plays dead) is his special move.
  - (d) Nods to games of that era: keep the ones listed in `design/GAME_BRIEF.md` ("Gameplay references"), or pick your own.
  - (e) Options for players who need them (for example, bigger text or no screen flashing): none for now, add later if asked.
  - (f) A target date to release the game: none yet.
- **Why it matters:** `design/GAME_BRIEF.md` still marks these "TBD". A "yes" lets Claude mark them settled. A "no" on (a), (b) or (c) would mean big changes, so it's best to say early.

### 21. Which Suno plan was the theme song made on?
- **Answered 2026-10-20: a paid plan.** Commercial use is granted, so the song now ships in the public build and plays as the level music online.
- **Added 2026-10-19.** Your theme song "Sammy the Opossum : Zombie Hunter" was made with Suno. Suno lets you use songs commercially (for example, in a game you sell) only if they were made while you had a **paid plan** (Pro or Premier). Songs made on the **free plan** are for non-commercial use only. It's worth checking Suno's current terms too, since they can change.
- **Suggested:** tell Claude which plan you were on when you made it. If it was a paid plan, Claude marks the song's row in `design/ASSET_SOURCES.csv` as cleared and it goes into the shareable copy. If it was the free plan, the song can stay for testing, and you can re-make it on a paid plan or choose other music before release.
- **What the game does now:** the song plays as the level music in your own copy (`game/index.html`), but the shareable copy (`game/dist/`) leaves it out ("commercial_use is tbd") and plays the placeholder tune instead.
- **Why it matters:** without commercial rights, the song can't go into a game you sell or put on a public store page.

### 22. How strong should the chainsaw be?
- **Added 2026-10-19, from a computer playtest (the game's autopilot), not a person.** The chainsaw is very generous. With it, the autopilot clears the whole level in about 55 seconds and never runs low on fuel: a full tank (20 seconds of revving) covers roughly 80 kills, and the final fight has only 9 zombies. Without it, the autopilot dies in the final fight every time (partly because it never dodges, so that says little about a person).
- **Option A, scarcer:** cut the fuel to 10–12 seconds and make just carrying it drain faster. Wasting fuel on the way to the fight can then leave you dry before wave 3.
- **Option B, power fantasy with tension:** keep the fuel and make the final fight bigger, for example waves of 3, 4 and 6 zombies.
- **Suggested:** nothing changes until a person has played it. Then pick A or B, or tell Claude what felt wrong.
- **What the game does now:** 20 seconds of fuel, carrying drains a quarter as fast as revving, waves of 2, 3 and 4. All numbers are in `game/src/config.js`.
- **Why it matters:** the chainsaw is the payoff of the whole level. Too strong and the final fight is a walkover; too weak and it isn't the "badass" moment you asked for.
- **Update (2026-10-20):** your answers on the Brute (questions 26 and 29 below) settle most of this: the saw cuts the boss any time, and Sammy always has a saw for the boss (a refuel or a second pickup inside the arena). Still open: whether the fuel for the walk and the waves before him should change (A or B above). Best answered after a person plays the finished finale.

### 23. Zombie roster: skins or types?
- **Your answer (Confirmed 2026-10-20): distinct types** on one shared "walker" brain, built in the order **hippie, sweater, cheerleader, baby**. Each is its own set of numbers and a few small hooks on the jogger's brain, so each plays differently (a tank, a brawler, a leaper, a litter).
- **What the game does now:** the one-table-of-types rewrite is done (`design/DECISIONS.md`, "2026-10-20: Zombie roster and the Brute"); the four types follow.

### 24. Which types go in level 1?
- **Your answer (Confirmed 2026-10-20): all four**, each in a contrasting colour scheme. The real art is being produced separately; until it lands, the coded placeholders also use contrasting colours (hippie purple and olive, sweater zigzag purple, teal and gold, cheerleader maroon and cream, baby pastel pink and blue with a pink brain, the Brute huge and pale with dark gauntlets).
- **Placed (2026-10-20, Proposed):** 17 zombies in level 1: a hippie on screen 3 (the Play Possum demo, so that prompt moved from screen 7 to screen 3), a cheerleader on screen 5, the clump on screen 7 (two joggers and a hippie), the sweater on the second lid after checkpoint 2, the baby litter and a second cheerleader on screen 10, a hippie right after the chainsaw. The gauntlet is two mixed waves (two joggers and a cheerleader; then the litter, a hippie and a jogger), then the Brute. Say so if you'd rather the Play Possum lesson stayed on screen 7, or want the sweater in a wave.

### 25. Keep the jogger?
- **Your answer (Confirmed 2026-10-20): yes.** He drops from 14 placements to about 7; the other spots become the new types.
- **Done (2026-10-20):** 7 jogger placements in the park, plus 3 in the gauntlet waves.

### 26. Where does the Brute go, and what does Sammy get before him?
- **Your answer (Confirmed 2026-10-20):** the Brute comes **after the final gauntlet wave, before the exit**. Right before him Sammy gets a **power-up** (a trash lid or a hot dog cache: Claude picks one and marks it Proposed) **and the chainsaw**: today's pickup on screen 11 (x 3300) stays, and a second pickup or a refuel appears inside the arena when the boss starts, so he always has a saw for the boss.
- **Built (2026-10-20, Proposed): the trash lid.** A lid and a chainsaw drop in by the arena's left wall the moment he walks in; the chainsaw refills a saw Sammy already has. The lid was picked over a hot dog cache because his swipe is the one hit you can't always dodge, and three hot dogs come out of him when he dies anyway. Say so if you'd rather have the hot dogs. Two small things you can still change: his death crawl is harmless (the design's "last scare" is one switch), and the acid puddles only start burning 0.6 s after they land, so lying flat under the stream isn't a trap.

### 27. The Ringmaster
- **Your answer (Confirmed 2026-10-20): level 2.** He is not built now; his notes stay in `design/BOSSES.md` and `design/ZOMBIE-ROSTER-AND-BOSSES.md` for the level 2 boss.

### 28. Low-gore versions of the new zombies and the boss
- **Your answer (Confirmed 2026-10-20): no low-gore work.** The game is full gore. The existing G toggle stays exactly as it is (not extended to the new zombies or the boss). *(This also settles the "how gory" part of question 1: full gore. The age you aim for is still open.)*

### 29. The chainsaw on the Brute
- **Your answer (Confirmed 2026-10-20): the chainsaw cuts the Brute any time** ("gore overload"). He is balanced with hit points and staggers instead of blocking the blade, and saw hits on him throw the most blood, chunks and freeze-frame. *(Supersedes the design's "the saw only cuts him while he's open" suggestion.)*

### 30. The baby zombie and the age rating
- **Your answer (Confirmed 2026-10-20): no guard rails.** The baby bleeds red and is sliced by the chainsaw like anyone else. *(Supersedes the design's "pops into its own goo, never red, never sliced" suggestion.)*
