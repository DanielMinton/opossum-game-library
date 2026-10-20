# Game brief

## Confirmed
- Main character: an opossum named **Sammy** ("he").
- Opening: Sammy wakes up in Central Park (New York City) with no memory of how he got there.
- World: the humans have all turned into zombies. Their animations are humorous and graphic in a cartoon/slapstick way. *(Tone superseded 2026-10-19 by the "Zombie Hunter" direction below: still darkly funny, but badass action-horror rather than cute slapstick.)*
- **New direction (2026-10-19, from the owner):** unchain Sammy as a badass opossum who doesn't mess around with zombies (the owner's exact words are in `design/DECISIONS.md`, "New direction — Zombie Hunter"). Supplied with a concept picture (`assets/references/zombie-hunter-concept-v01.jpg`) and a theme song. What that confirms:
  - **Tone:** badass action-horror with dark humour. Sammy is a ferocious zombie hunter, not a confused little critter.
  - **Weapon:** Sammy fights with a **chainsaw**. *(How it works in the game, for example as a power-up, is Proposed; see below. The tail-whip stays his basic attack: Proposed.)*
  - **Setting:** Central Park **at night**, with **Bethesda Terrace** as the inspiration: the angel fountain, a full moon, the Manhattan skyline, amber lamps, rain-slick stone, autumn leaves, a horde of rotting zombies.
  - **Gorier than before:** sparks and gore are part of the picture. *(The exact level is Proposed; see "Tone and audience".)*
  - **Theme song:** "Sammy the Opossum : Zombie Hunter" by the owner (themodernopossum), made with Suno. It is now the level music: `assets/audio/music/music-level-01-central-park/music-level-01-central-park-v01.mp3`. Whether it can be sold with the game depends on the Suno plan it was made on (owner question 21).
- Progression: level-based. Sammy fights his way through each level.
- Sammy's tools: interactive objects, power-ups, and special abilities.
- Presentation: the game will eventually look and feel like a 16-bit Sega Genesis–era game, with several nostalgic nods to popular games of that era. (Nods mean homage through mechanics, feel, palette, structure, and humor. No copied sprites, music, sound effects, logos, or named characters, and no "Sega"/"Genesis" in the title or branding.)
- Priority: a fun, compact indie game that can be deployed quickly. (from the original brief)
- **Major priority: desktop AND mobile.** The game must look beautiful and be fully playable on desktop computers and on mobile devices (phones and tablets): sharp pixels that fill the screen well at any size, and on-screen touch controls on phones and tablets. (Confirmed by the owner on 2026-10-19, who says this was intended from the start.)
- Art and contact sheets will be supplied through this library. (from the original brief; as of 2026-10-19, `assets/` is empty.)

## Decisions to fill in (TBD is okay)
Lines marked **Proposed (not approved)** are suggestions to react to, not decisions.

- Working title: TBD (avoid "Sega", "Genesis", or other trademarks in the name)
  - Proposed (not approved, 2026-10-19): **"Sammy the Opossum: Zombie Hunter"**, taken from the theme song's title. Still the owner's call (owner question 3).
- Camera: TBD
  - Proposed (not approved): side-view 2D action-platformer, scrolling left to right.
- First platform: **web browsers on desktop and on mobile (phones and tablets): Confirmed major priority** (see above).
  - Proposed (not approved): a native canvas of 320×224 px scaled up by whole numbers (×3 = 960×672, ×4 = 1280×896) with no smoothing.
- Controls: TBD
  - Confirmed: on-screen touch controls on phones and tablets (part of the desktop + mobile priority).
  - Proposed (not approved): keyboard + gamepad on desktop. Example layout: move, jump, attack (tail-whip), ability (Play Possum). *(Superseded 2026-10-19: this line used to end "Touch later, if at all.")*
- Player fantasy: TBD
  - ~~Proposed (not approved): a scrappy, confused little opossum improvising his way through a zombie-filled New York.~~ *(Superseded 2026-10-19 by the owner's new direction.)*
  - Proposed (not approved, 2026-10-19): a ferocious, unchained opossum who hunts zombies through Central Park at night, tail-whip first and chainsaw when he finds one. Still plays dead when it helps (Play Possum), then gets back up swinging.
- Core action repeated by the player: TBD
  - Proposed (not approved): run, jump, and tail-whip through zombies while grabbing objects and power-ups.
  - Proposed (not approved, 2026-10-19): the chainsaw arrives as a **power-up** Sammy picks up: for a while, his attack becomes a chainsaw rev and cut that tears through zombies (cutting them in half). The tail-whip stays his basic attack. This is being built next (step B); the numbers are Proposed.
- Signature mechanic: TBD
  - Proposed (not approved): **Play Possum**. Sammy drops and plays dead, and nearby zombies lose track of him for a short time. Cooldown and duration TBD.
- Goal / victory: TBD
  - Proposed (not approved): reach the end of each level. An optional short boss or gauntlet closes the level.
- Failure and recovery: TBD
  - Proposed (not approved): a health or hit system, with restart from the last checkpoint and a short KO animation. Exact rules TBD.
- Target play-session length: TBD
  - Proposed (not approved): a 5–10 minute session for the first level, including retries from checkpoints (a first clean clear is about 3–5 minutes).
- Tone and audience: ~~humorous, cartoon-graphic zombie slapstick. Audience and age rating: TBD.~~ *(Superseded 2026-10-19.)*
  - ~~Still to decide: how graphic (e.g., pops, bounces, and deflating with no realistic gore vs. cartoon splatter). This affects art, rating, and where the game can be shared.~~ *(Superseded 2026-10-19: the owner chose a gorier direction.)*
  - **Confirmed (2026-10-19):** badass action-horror with dark humour, and gorier than before.
  - Proposed (not approved): **stylized 16-bit gore**: chunky pixel blood in a few solid colours, zombies cut in half by the chainsaw, green zombie ichor, sparks. Never photo-real, no lingering close-ups, no gore on Sammy himself. A **"low gore" option** swaps blood for ichor and dust puffs and keeps bodies in one piece. Rules for artists: `design/STYLE_GUIDE.md`.
  - Proposed (not approved): audience **13 and up**. Final rating and the exact gore level are still the owner's call (owner question 1).
- Gameplay references and exactly what to borrow: TBD. See "Gameplay references (proposed)" below.
- Must-have features: TBD
  - Proposed (not approved): one complete level loop with start, play, victory, failure, and restart; Play Possum; 2–3 zombie types; 2–3 power-ups.
- Excluded from first release: TBD
  - Proposed (not approved): extra levels beyond Central Park, cutscenes beyond a short wake-up intro, online features. *(Updated 2026-10-19: touch controls removed from this list; they are now required.)*
- First-release scope: TBD
  - Proposed (not approved): one Central Park level (example name `level-01-sheep-meadow`), one signature ability, 2–3 zombie types, 2–3 power-ups, an optional short end-of-level boss or gauntlet. More levels come later.
- Desired release date: TBD
- Audio direction: TBD
  - Proposed (not approved): an FM-synth + chiptune feel (in the style of the era's YM2612 + PSG sound), delivered as OGG files (plus MP3 for older Safari) with WAV/source masters; Claude can convert WAV masters. Music loops cleanly end-to-start with no separate intro (loop points aren't supported yet).
  - **Confirmed (2026-10-19):** the owner's theme song "Sammy the Opossum : Zombie Hunter" (made with Suno). Proposed: it is the level 1 track for now (and the final fight's, until a separate track exists), and it also starts on the title screen's first key press or tap. It loops whole: its quiet 5-second build-in and its fade-out replay every 70 seconds until a trimmed loop edit or loop points exist. The FM-synth target above still applies to sound effects.
- Visual direction: 16-bit Genesis-era look (confirmed). **Night-time Central Park** with Bethesda Terrace as the inspiration (confirmed 2026-10-19); the night palette and gore rules in the style guide are Proposed. In-game Sammy keeps his cartoon style with the red bandana (Proposed). The exact targets are proposed (not approved): 320×224 canvas, 8×8 tiles, 9-bit color (8 levels per channel), 4 palette lines × 15 usable colors, hard pixel edges, no semi-transparency. See the draft style guide, `design/STYLE_GUIDE.md` (all Proposed).
- Accessibility needs: TBD
  - Proposed (not approved): remappable keys, a reduced screen-shake option, and the option to tone down gore effects. *(2026-10-19: the "low gore" option is now part of the gore plan above, not only an accessibility extra.)*

## Gameplay references (proposed, not approved)
These are era-typical ideas to borrow as **mechanics and feel only**. We don't copy any art, audio, characters, logos, or level layouts. The user picks which ones to keep.

| Nod | What we'd borrow | Status |
|---|---|---|
| Multi-band parallax side-scrolling | Layered backgrounds that scroll at different speeds (Central Park skyline, trees, lawn) | Proposed |
| Scatter-on-hit collectibles | When hit, Sammy drops some collected items (e.g., snacks) that bounce away and can be re-grabbed for a moment | Proposed |
| Boss at the end of a level/act | A short, readable boss or gauntlet with a clear pattern | Proposed |
| Title-screen attract mode | The title screen plays a short demo loop if left idle | Proposed |
| Item boxes / breakable containers | Smash an object to reveal a power-up | Proposed |
| Score tally at level end | Time, combo, or bonus count-up screen | Proposed |
| Beat-'em-up crowd moments | Brief "clear the zombies" stops before moving on | Proposed |

Which nods to include: TBD (user decision).

## Earlier starting idea (superseded)
Superseded by the user's zombie-survival direction above. For the record, the old optional idea was a short nighttime opossum scavenging game with a play-dead mechanic.
