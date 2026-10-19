# Game brief

## Confirmed
- Main character: an opossum named **Sammy** ("he").
- Opening: Sammy wakes up in Central Park (New York City) with no memory of how he got there.
- World: the humans have all turned into zombies. Their animations are humorous and graphic in a cartoon/slapstick way.
- Progression: level-based. Sammy fights his way through each level.
- Sammy's tools: interactive objects, power-ups, and special abilities.
- Presentation: the game will eventually look and feel like a 16-bit Sega Genesis–era game, with several nostalgic nods to popular games of that era. (Nods mean homage through mechanics, feel, palette, structure, and humor. No copied sprites, music, sound effects, logos, or named characters, and no "Sega"/"Genesis" in the title or branding.)
- Priority: a fun, compact indie game that can be deployed quickly. (from the original brief)
- Art and contact sheets will be supplied through this library. (from the original brief; as of 2026-10-19, `assets/` is empty.)

## Decisions to fill in (TBD is okay)
Lines marked **Proposed (not approved)** are suggestions to react to, not decisions.

- Working title: TBD (avoid "Sega", "Genesis", or other trademarks in the name)
- Camera: TBD
  - Proposed (not approved): side-view 2D action-platformer, scrolling left to right.
- First platform: TBD
  - Proposed (not approved): browser first (desktop), with a native canvas of 320×224 px scaled up by whole numbers (×3 = 960×672, ×4 = 1280×896) with no smoothing.
- Controls: TBD
  - Proposed (not approved): keyboard + gamepad. Example layout: move, jump, attack (tail-whip), ability (Play Possum). Touch later, if at all.
- Player fantasy: TBD
  - Proposed (not approved): a scrappy, confused little opossum improvising his way through a zombie-filled New York.
- Core action repeated by the player: TBD
  - Proposed (not approved): run, jump, and tail-whip through zombies while grabbing objects and power-ups.
- Signature mechanic: TBD
  - Proposed (not approved): **Play Possum**. Sammy drops and plays dead, and nearby zombies lose track of him for a short time. Cooldown and duration TBD.
- Goal / victory: TBD
  - Proposed (not approved): reach the end of each level. An optional short boss or gauntlet closes the level.
- Failure and recovery: TBD
  - Proposed (not approved): a health or hit system, with restart from the last checkpoint and a short KO animation. Exact rules TBD.
- Target play-session length: TBD
  - Proposed (not approved): a 5–10 minute session for the first level, including retries from checkpoints (a first clean clear is about 3–5 minutes).
- Tone and audience: humorous, cartoon-graphic zombie slapstick. Audience and age rating: TBD.
  - Still to decide: how graphic (e.g., pops, bounces, and deflating with no realistic gore vs. cartoon splatter). This affects art, rating, and where the game can be shared.
- Gameplay references and exactly what to borrow: TBD. See "Gameplay references (proposed)" below.
- Must-have features: TBD
  - Proposed (not approved): one complete level loop with start, play, victory, failure, and restart; Play Possum; 2–3 zombie types; 2–3 power-ups.
- Excluded from first release: TBD
  - Proposed (not approved): extra levels beyond Central Park, cutscenes beyond a short wake-up intro, online features, touch controls.
- First-release scope: TBD
  - Proposed (not approved): one Central Park level (example name `level-01-sheep-meadow`), one signature ability, 2–3 zombie types, 2–3 power-ups, an optional short end-of-level boss or gauntlet. More levels come later.
- Desired release date: TBD
- Audio direction: TBD
  - Proposed (not approved): an FM-synth + chiptune feel (in the style of the era's YM2612 + PSG sound), delivered as OGG files (plus MP3 for older Safari) with WAV/source masters; Claude can convert WAV masters. Music loops cleanly end-to-start with no separate intro (loop points aren't supported yet).
- Visual direction: 16-bit Genesis-era look (confirmed). The exact targets are proposed (not approved): 320×224 canvas, 8×8 tiles, 9-bit color (8 levels per channel), 4 palette lines × 15 usable colors, hard pixel edges, no semi-transparency. See the draft style guide, `design/STYLE_GUIDE.md` (all Proposed).
- Accessibility needs: TBD
  - Proposed (not approved): remappable keys, a reduced screen-shake option, and the option to tone down gore effects.

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
