# Audio metadata — Level 1 music and core SFX (example)
> **EXAMPLE ONLY — planning spec, not a finished asset.** Run the scanner to see which files exist. Don't copy this into assets/ until every TBD is filled in.

How to use this example: real copies go in `assets/audio/music/<asset-id>/` and `assets/audio/sfx/<asset-id>/`, one `AUDIO.md` per sound or one per SFX set. Everything here is **Proposed** / **Example**.

**Sound target (Proposed):** 16-bit era console feel — FM synth (6 voices, punchy bass, bright brass/bell leads) plus a simple chip layer (3 square-wave voices + 1 noise channel for drums/hits). You can compose with any tools; it only needs to *sound* like this. Do not sample, remix or imitate specific melodies or sound effects from commercial games.

**Formats:** the game plays **OGG**. Send OGG, with an **MP3** of the same sound beside it if you want older Safari covered (it can't play OGG). Or send just **WAV** masters (44.1 kHz, 16-bit) and Claude makes the OGG and MP3 with `node tools/convert-audio.mjs` (run from `game/`). Keep the WAV master and the project/source file either way.

**Music loops (what the game can do today):** each music file loops whole, from its last sample straight back to its first. Loop points and a separate intro that plays once are **not supported yet**. Make the end flow seamlessly into the start, with no click or gap.

## Planned files (none supplied yet)
- `music-level-01-central-park-v01.ogg` (plus `music-level-01-central-park-v01.mp3` for older Safari, optional)
- `music-level-01-central-park-v01.wav` (master)
- `music-level-01-gauntlet-v01.ogg` (optional: faster track for the end-of-level gauntlet; without it the level music keeps playing)
- `music-level-01-central-park-v01` project file (DAW / tracker / FM editor — format TBD)
- One `.ogg` + `.wav` per SFX, named `sfx-<name>-v01` (e.g., `sfx-jump-v01.ogg`); variations as `-a`, `-b`, `-c` after the version (e.g., `sfx-land-v01-a.ogg`)
- Each sound in its own folder: `assets/audio/sfx/<id>/` and `assets/audio/music/<id>/`

## Music: music-level-01-central-park

- Asset ID: music-level-01-central-park
- File: `music-level-01-central-park-v01.ogg` (planned — not yet supplied)
- Music / sound effect / voice: music
- Trigger or scene: starts after Sammy's wake-up intro in `level-01-sheep-meadow`; plays until the end-of-level gauntlet, which switches to `music-level-01-gauntlet` if that file exists
- Style (Example): upbeat, a little spooky-silly; FM slap bass, bright lead, noise-channel hi-hats. BPM: TBD (suggest 130–150 for a run-and-fight level) *(Superseded 2026-10-19: the level track is now the owner's theme song "Sammy the Opossum : Zombie Hunter", made with Suno; see `design/DECISIONS.md`.)*
- Length (Proposed): one loop of 60–90 s, no separate intro
- Loop: the whole file loops end-to-start. It must be seamless — no click or gap at the seam. (Loop points are not supported yet. If you want an intro later, write the loop start and end in seconds **and** sample number here, and ask for loop-point support.)
- Volume intent: background — about −14 LUFS integrated (Proposed); SFX must stay audible over it
- Variations: optional "low health" or "Play Possum" muffled version — TBD (polish)
- Creator / license / attribution: TBD (also record in design/ASSET_SOURCES.csv)

## Minimum SFX set (Proposed)

| SFX ID | Trigger | Target length | Variations | Notes |
|---|---|---|---|---|
| sfx-jump | Sammy leaves the ground | 0.15–0.25 s | 1 | Rising chip "boing" |
| sfx-land | Sammy lands (after a fall, not every tiny step) | 0.1 s | 2 | Soft thud |
| sfx-tail-whip | Tail-whip starts (frame 0) | 0.15–0.2 s | 2 | Whoosh |
| sfx-hit-zombie | Tail-whip connects (hit frame 2) | 0.1–0.2 s | 3 | Cartoon smack/bonk |
| sfx-zombie-groan | Zombie notices Sammy; random idle groans | 0.5–1.0 s | 3+ | Comic, not scary; keep it short so groans don't pile up *(Superseded 2026-10-19: see the "Zombie Hunter" direction in `design/DECISIONS.md`.)* |
| sfx-pickup | Collect hot dog / power-up | 0.2–0.3 s | 1 | Bright rising arpeggio |
| sfx-hurt | Sammy takes damage | 0.2–0.3 s | 2 | Squeak + noise hit |
| sfx-play-dead | Sammy starts Play Possum | 0.4–0.6 s | 1 | Thud + comic wheeze |
| sfx-zombie-defeat-comedic | Zombie's humorous defeat animation | 0.5–1.0 s | 3 (one per defeat gag: head-pop, deflate, clothes-pile) | Slapstick: pop, slide-whistle, kazoo-like fizzle *(Superseded 2026-10-19: see the "Zombie Hunter" direction in `design/DECISIONS.md`.)* |
| sfx-cart-crash | Prop breaks (hot dog cart tips over) | 0.3–0.5 s | 1 | Metal clang + rattle |
| sfx-ko | Sammy is defeated (KO) | 0.8–1.5 s | 1 | Short comic "wah-wah" fall |

**Extra sounds the game already has slots for** (not required for first playable; each keeps a placeholder beep until its file arrives):

| SFX ID | Trigger |
|---|---|
| sfx-cart-rock | Cart wobbles after the first whip |
| sfx-shield-block | Trash lid blocks a hit |
| sfx-shield-break | Trash lid's last hit |
| sfx-throw | Vendor throws a hot dog |
| sfx-splat | Thrown hot dog lands or hits |
| sfx-splash | Sammy falls in the pond |
| sfx-checkpoint | Checkpoint reached |
| sfx-gate-open | Gauntlet cleared, exit gate opens |
| sfx-level-clear | Level-clear jingle |
| sfx-start | Start pressed on the title screen |
| sfx-cheer | Zombie cheerleader stops and cheers: the tell before her leap (2026-10-20) |
| sfx-leap | Zombie cheerleader launches her leap |
| sfx-baby-rattle | Zombie baby's rattle smack |
| sfx-baby-cry | Zombie baby goes down |

Not in the game yet: a UI select/confirm sound (no menus to use it).

- Volume intent: SFX normalized to similar loudness; peaks no higher than −1 dBFS
- Creator / license / attribution: TBD (also record in design/ASSET_SOURCES.csv)
