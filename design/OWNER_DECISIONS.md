# Decisions only you can make

These are open questions about Sammy's game that only you, the owner, can answer. Each one has a **suggested answer** that the game or the docs use for now, and a note on why it matters. Nothing here is decided until you say so.

To answer, edit this file, or just tell Claude (for example, "go with the suggestions for 1, 3 and 7"). Claude then records your answer in `design/DECISIONS.md` and changes the game and docs to match.

*Last updated 2026-10-19.*

---

### 1. How gory, and who is it for?
- **Suggested:** cartoon slapstick with no blood. Heads pop off and bounce, zombies deflate like balloons, hot dogs splat. Aimed at players about 10 and up.
- **Why it matters:** it changes what the artist draws, which websites and stores will take the game, and who can play it. It's much easier to add splatter later than to take it out.

### 2. Do you approve the art style?
- **Update (2026-10-19):** the four palette sheets (the colour swatches each kind of art draws from) have not been made yet. Approving the style guide includes its palette plan: which palette is used for what. The sheets go in `assets/ui/palettes/` when they arrive.
- **Suggested:** the draft in `design/STYLE_GUIDE.md`. A thin dark outline around Sammy, the zombies and anything you can touch or stand on, but none on the background. Light comes from the top-left, and each colour has three shades (dark, middle, light).
- **Why it matters:** the artist needs this before drawing anything. Changing it after art arrives means redrawing.

### 3. What is the game called?
- **Suggested:** keep "Sammy" as a working name for now. Avoid "Sega", "Genesis" and other company or console names.
- **Why it matters:** the title screen, the logo art and any store or website page all need it.

### 4. Who makes the art and the music?
- **Suggested:** you choose an artist and a composer, or use free art and music that allows selling a game, with the credit lines it asks for.
- **Why it matters:** everything on screen is a placeholder until real art arrives. Every file also needs a row saying who made it and what you're allowed to do with it, or it can't go into the shareable copy.

### 5. What's in the first release?
- **Suggested:** one Central Park level (the one that's playable now), Sammy's tail-whip and Play Possum, two zombie types, the hot dog cart and the trash-lid shield.
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
- **Suggested:** sideways is best, but upright still works. If a phone is held upright, show a friendly "turn your phone sideways" hint that doesn't stop the game.
- **Why it matters:** the game screen is wider than it is tall, like a TV. Upright play already works, but the picture is small, with the touch buttons below it. A block would stop upright play completely.

### 13. Do the drawing tool's terms let you sell the game with Sammy's run art?
- **Suggested:** you check the terms of the AI coding assistant used to draw `sammy-run-strip-v01.png`, and tell Claude what they say. Until then, treat the run art as fine for testing but not for selling.
- **Why it matters:** the run art is already in the shareable copy. Its row in `design/ASSET_SOURCES.csv` says "owner to confirm the tool's terms allow selling the game". Answer this before the game goes on a public website or store.

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
