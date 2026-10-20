// Level 1 layout, from templates/examples/level-01-sheep-meadow/LEVEL.md (PROPOSED).
// Coordinates are in pixels. x = left→right, y = down. Feet stand at y = CONFIG.groundY (192) on the grass.
// Characters and pickups use x = centre, y = bottom (feet).
// One screen is 320 px wide; screen n starts at x = (n - 1) * 320.
(function (S) {
  const G = S.CONFIG.groundY; // config.js loads first
  // The scenery list is built from the layout numbers below so it can't drift from the platforms and solids it decorates.
  S.buildScenery1 = function () {
    const out = [];
    const add = (type, x, o) => out.push(Object.assign({ type, x }, o || {}));
    // Far trees: world-locked, standing just behind the walking lane, one every 200-ish px (not on Bethesda Terrace).
    [90, 300, 520, 770, 1010, 1240, 1470, 1700, 1930, 2150, 2490, 2720, 2950, 3180, 3400].forEach((x, i) => add('tree-far', x, { v: (i * 7 + 3) % 5 < 2 ? 1 : 0 }));
    // Paths: wet stone stretches where people would walk, round the benches and lamps.
    out.push({ type: 'path', x0: 368, x1: 656 }, { type: 'path', x0: 1280, x1: 1568 }, { type: 'path', x0: 2480, x1: 2768 }, { type: 'path', x0: 3216, x1: 3520 });
    // Platforms: benches (seat at row 12 of the 32 px picture) and lamps (the ledge is row 12 of 64).
    add('bench', 420 + 16); add('bench', 2368 + 16);
    for (const x of [1352, 1492, 3352]) add('lamp', x + 12);
    for (const x of [650, 2050, 2690, 3130]) add('lamp', x);          // lamps nobody can stand on (the ledge is just decoration)
    // Solids: rocks (32x16) and fences (8x24 post with railing either side).
    for (const x of [720, 872, 2960]) add('rock', x + 16);
    for (const x of [1580, 3100, 3260]) add('fence', x + 4, { run: 3 });
    for (const x of [330, 1230, 1900, 2540, 3060]) add('trashcan', x);
    for (const x of [190, 560, 820, 1300, 1700, 2020, 2260, 2780, 3200, 3440]) add('puddle', x + (x % 3) * 4);
    // Foreground trees: drawn in front of everyone, drifting past a little faster than the camera. Few, thin trunks.
    [250, 900, 1660, 2210, 2840, 3400].forEach((x, i) => add('tree-near', x, { v: i & 1, y: G + 4 }));
    // Bethesda Terrace (the arena, x 3520-3840): arcade wall of 5 arches, balustrade on top (lamps stand behind it), stairs, the angel fountain.
    const A0 = 3520;
    for (let i = 0; i < 5; i++) add('arch', A0 + 32 + 64 * i);
    for (let i = 0; i < 10; i++) add('balustrade', A0 + 16 + 32 * i, { y: 112 });
    for (const x of [A0 + 64, A0 + 256]) add('lamp', x, { y: 110, terrace: true });
    add('stairs', A0 + 32);
    add('fountain', A0 + 160);
    add('angel', A0 + 160, { y: G - 67 });                              // feet on top of the fountain's pedestal
    return out;
  };
  S.LEVEL1 = {
    id: 'level-01-sheep-meadow',
    name: 'SHEEP MEADOW',
    width: 3840,
    start: { x: 48, y: G },

    // Solid ground. The gap between the two pieces is the pond (screen 8).
    ground: [ { x0: 0, x1: 2344 }, { x0: 2424, x1: 3840 } ],
    water: [ { x0: 2344, x1: 2424, y: 198 } ],

    // Solid blocks: rocks and fences. x/y = top-left corner.
    solids: [
      { kind: 'rock',  x: 720,  y: 176, w: 32, h: 16 },
      { kind: 'rock',  x: 872,  y: 176, w: 32, h: 16 },
      { kind: 'fence', x: 1580, y: 168, w: 8,  h: 24 },
      { kind: 'rock',  x: 2960, y: 176, w: 32, h: 16 },
      { kind: 'fence', x: 3100, y: 168, w: 8,  h: 24 },
      { kind: 'fence', x: 3260, y: 168, w: 8,  h: 24 },
    ],

    // One-way platforms: Sammy can jump up through them and land on top.
    platforms: [
      { kind: 'bench', x: 420,  y: 172, w: 32 },
      { kind: 'lamp',  x: 1352, y: 140, w: 24 },
      { kind: 'lamp',  x: 1492, y: 140, w: 24 },
      { kind: 'bench', x: 2368, y: 172, w: 32 },   // bench over the pond
      { kind: 'lamp',  x: 3352, y: 140, w: 24 },
    ],

    checkpoints: [ { id: 'C1', x: 1264 }, { id: 'C2', x: 2576 } ],

    // Zombie roster (2026-10-20, owner answer 2: all four new types in level 1, the jogger kept at 7). One new idea per screen,
    // each introduced alone, then mixed. 17 bodies: 7 joggers, 3 hippies, 2 cheerleaders, 1 sweater, 3 babies, 1 vendor.
    enemies: [
      { type: 'jogger', x: 540 },                                         // screen 2: first zombie, under the whip prompt
      { type: 'jogger', x: 780 }, { type: 'hippie', x: 940 },             // screen 3: a jogger under the Play Possum prompt, then the first hippie by the second rock (three whips, or play dead and walk past)
      { type: 'jogger', x: 1180 },                                        // screen 4: guards the lid
      { type: 'cheerleader', x: 1420 }, { type: 'jogger', x: 1540 },      // screen 5: the first leap, between the two lamps (jump onto one to dodge her)
      { type: 'vendor', x: 1800 },                                        // screen 6: behind the cart
      { type: 'jogger', x: 2080 }, { type: 'jogger', x: 2112 }, { type: 'hippie', x: 2150 }, // screen 7: the clump (the Ringmaster's spot in level 2)
      { type: 'jogger', x: 2290 },                                        // screen 8: pond edge (the far-bank jogger is gone; the pond is the hazard)
      { type: 'sweater', x: 2720 },                                       // screen 9: right after C2, standing on the second lid. He takes it off you in one shove
      { type: 'baby', x: 3010, litter: 3 },                               // screen 10: the litter, penned between the rock (2960) and the fence (3100). Play Possum does nothing to them
      { type: 'cheerleader', x: 3160 },                                   // screen 10: penned between the two fences
      { type: 'hippie', x: 3440 },                                        // screen 11: after the chainsaw (3300): your first saw victim
    ],

    carts: [ { x: 1688 } ],                  // screen 6; x = left edge, 64 px wide

    pickups: [
      { type: 'lid',    x: 1120, y: 172 },   // screen 4
      { type: 'hotdog', x: 1504, y: 140 },   // secret: on top of the screen-5 lamp
      { type: 'lid',    x: 2700, y: 172 },   // optional second lid (TBD in LEVEL.md)
      { type: 'hotdog', x: 3364, y: 140 },   // screen 11 lamp top, before the arena (prototype addition)
      { type: 'chainsaw', x: 3300, y: G },   // screen 11, on the grass: the chainsaw (Stage B, Proposed)
    ],

    // Gauntlet arena = last screen. Camera locks; fences block both sides.
    arena: { x0: 3520, x1: 3840, trigger: 3560, gateX: 3800, gateW: 24, exitX: 3820 },

    // Scenery: where the pretty pieces stand. Cosmetic only (sim.js never reads it; the solids, platforms and arena above are what count).
    // type = a scenery piece (see S.ASSET_MANIFEST 'scenery:*'); x = centre of its feet (or left edge for runs); y = feet row (default ground line).
    // v = which variant of a 2-variant strip. 'path' = a stretch of wet path stone instead of grass (x0..x1, multiples of 16).
    // Lamps and benches sit exactly on the lamp/bench platforms above; fences and rocks on the solids.
    scenery: S.buildScenery1(),

    // On-screen tutorial prompts by x range (screen-by-screen beats in LEVEL.md).
    // touch: the wording used instead when the on-screen touch buttons are showing.
    // Voice: deadpan and profane on purpose (owner rule, CLAUDE.md "Tone"). One line each, 3x5 font, fits 312 px.
    prompts: [
      { x0: 0,    x1: 300,  text: 'ARROWS: MOVE   Z: JUMP   IT\'S NIGHT. IT\'S ZOMBIES. FINE.', touch: 'ARROW PAD: MOVE   JUMP BUTTON: JUMP   FUCK ZOMBIES.' },
      { x0: 340,  x1: 660,  text: 'X: TAIL-WHIP. SMACK THE DEAD BASTARDS.', touch: 'WHIP BUTTON: TAIL-WHIP. SMACK THE DEAD BASTARDS.' },
      { x0: 680,  x1: 760,  text: 'C: PLAY DEAD. ZOMBIES ARE DUMB AS SHIT.', touch: 'POSSUM BUTTON: PLAY DEAD. ZOMBIES ARE DUMB AS SHIT.' }, // moved from screen 7 (2026-10-20): the screen-3 hippie is the demo
      { x0: 1060, x1: 1160, text: 'TRASH LID: BLOCKS 3 HITS. CLASSY AS SHIT.' },
      { x0: 1620, x1: 1760, text: 'WHIP THE CART TWICE. FREE HOT DOGS. THEY HEAL. DON\'T ASK.' },
      { x0: 2660, x1: 2760, text: 'BIG LAD. HE WANTS YOUR LID.' },                                                                      // screen 9: the sweater
      { x0: 3270, x1: 3380, text: "SOMEBODY LEFT A CHAINSAW. HOLD X. FUCK 'EM UP.", touch: "SOMEBODY LEFT A CHAINSAW. HOLD WHIP. FUCK 'EM UP." },
      { x0: 3380, x1: 3520, text: 'BETHESDA TERRACE AHEAD. SHIT GETS REAL.' },
    ],
  };
})(globalThis.SAMMY = globalThis.SAMMY || {});
