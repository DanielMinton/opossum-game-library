# Audio metadata — Level 1 music and core SFX (example)
> **EXAMPLE ONLY — not a real asset. No files listed here exist yet.** Copy into assets/<category>/<asset-id>/ and replace with your real details.

How to use this example: real copies go in `assets/audio/music/<asset-id>/` and `assets/audio/sfx/<asset-id>/`, one `AUDIO.md` per sound or one per SFX set. Everything here is **Proposed** / **Example**.

**Sound target (Proposed):** 16-bit era console feel — FM synth (6 voices, punchy bass, bright brass/bell leads) plus a simple chip layer (3 square-wave voices + 1 noise channel for drums/hits). You can compose with any tools; it only needs to *sound* like this. Do not sample, remix or imitate specific melodies or sound effects from commercial games.

**Formats:** browser build uses **OGG**. Also keep a **WAV** master (44.1 kHz, 16-bit) and the project/source file.

## Planned files (none supplied yet)
- `music-level-01-central-park-v01.ogg`
- `music-level-01-central-park-v01.wav` (master)
- `music-level-01-central-park-v01` project file (DAW / tracker / FM editor — format TBD)
- One `.ogg` + `.wav` per SFX, named `sfx-<name>-v01` (e.g., `sfx-jump-v01.ogg`); variations as `-a`, `-b`, `-c`

## Music: music-level-01-central-park

- Asset ID: music-level-01-central-park
- File: `music-level-01-central-park-v01.ogg` (planned — not yet supplied)
- Music / sound effect / voice: music
- Trigger or scene: starts after Sammy's wake-up intro in `level-01-sheep-meadow`; plays until the end-of-level gauntlet (gauntlet may switch to a faster track — TBD)
- Style (Example): upbeat, a little spooky-silly; FM slap bass, bright lead, noise-channel hi-hats. BPM: TBD (suggest 130–150 for a run-and-fight level)
- Length (Proposed): short intro (2–4 s, plays once) + loop section of 60–90 s
- Loop and loop points: loop start TBD (seconds **and** sample number), loop end TBD (seconds and sample number). The loop must be seamless — no click or gap at the seam.
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
| sfx-zombie-groan | Zombie notices Sammy; random idle groans | 0.5–1.0 s | 3+ | Comic, not scary; keep it short so groans don't pile up |
| sfx-pickup | Collect hot dog / power-up | 0.2–0.3 s | 1 | Bright rising arpeggio |
| sfx-hurt | Sammy takes damage | 0.2–0.3 s | 2 | Squeak + noise hit |
| sfx-play-dead | Sammy starts Play Possum | 0.4–0.6 s | 1 | Thud + comic wheeze |
| sfx-zombie-defeat-comedic | Zombie's humorous defeat animation | 0.5–1.0 s | 3 (one per defeat gag: head-pop, deflate, clothes-pile) | Slapstick: pop, slide-whistle, kazoo-like fizzle |
| sfx-cart-crash | Prop breaks (hot dog cart tips over) | 0.3–0.5 s | 1 | Metal clang + rattle |
| sfx-ko | Sammy is defeated (KO) | 0.8–1.5 s | 1 | Short comic "wah-wah" fall |

**Nice to have (not required for first playable):** sfx-shield-block, sfx-shield-break, sfx-cart-rock, sfx-hot-dog-spill, sfx-checkpoint, sfx-level-clear jingle, UI select/confirm.

- Volume intent: SFX normalized to similar loudness; peaks no higher than −1 dBFS
- Creator / license / attribution: TBD (also record in design/ASSET_SOURCES.csv)
