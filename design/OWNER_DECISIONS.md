# Decisions only you can make

These are open questions about Sammy's game that only you, the owner, can answer. Each one has a **suggested answer** that the game or the docs use for now, and a note on why it matters. Nothing here is decided until you say so.

To answer, edit this file, or just tell Claude (for example, "go with the suggestions for 1, 3 and 7"). Claude then records your answer in `design/DECISIONS.md` and changes the game and docs to match.

*Last updated 2026-10-19.*

---

### 1. How gory, and who is it for?
- **Suggested:** cartoon slapstick with no blood. Heads pop off and bounce, zombies deflate like balloons, hot dogs splat. Aimed at players about 10 and up.
- **Why it matters:** it changes what the artist draws, which websites and stores will take the game, and who can play it. It's much easier to add splatter later than to take it out.

### 2. Do you approve the art style?
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
- **Suggested:** keep today's sizes. Sammy is drawn in a 48×48 pixel box (his tail-whip pictures use a wider 64×48 box), and the whip hits up to 26 pixels in front of him.
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
- **Suggested:** sideways (landscape) only. If a phone is held upright, show a friendly "turn your phone sideways" message.
- **Why it matters:** the game screen is wider than it is tall, like a TV. Upright, it would be tiny with the touch buttons crowded below it. Supporting upright play means a different layout to design and test.
- **What the game does now (2026-10-19):** the suggestion. Held upright, a "TURN YOUR PHONE SIDEWAYS" message shows and the game waits (phones only; tablets such as an iPad play upright without it); a "PLAY UPRIGHT ANYWAY" button lets people play upright if they prefer. This is still your call: say "sideways only" (we remove the button), "both" (we keep it as it is), or "upright too" (we drop the message).
