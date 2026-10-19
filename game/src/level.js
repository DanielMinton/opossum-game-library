// Level 1 layout, from templates/examples/level-01-sheep-meadow/LEVEL.md (PROPOSED).
// Coordinates are in pixels. x = left→right, y = down. Feet stand at y = 192 on the grass.
// Characters and pickups use x = centre, y = bottom (feet).
// One screen is 320 px wide; screen n starts at x = (n - 1) * 320.
(function (S) {
  const G = 192;
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

    enemies: [
      { type: 'jogger', x: 540 },                                         // screen 2: first zombie
      { type: 'jogger', x: 780 }, { type: 'jogger', x: 940 },             // screen 3
      { type: 'jogger', x: 1180 },                                        // screen 4: guards the lid
      { type: 'jogger', x: 1420 }, { type: 'jogger', x: 1540 },           // screen 5
      { type: 'vendor', x: 1800 },                                        // screen 6: behind the cart
      { type: 'jogger', x: 2080 }, { type: 'jogger', x: 2112 }, { type: 'jogger', x: 2144 }, // screen 7
      { type: 'jogger', x: 2290 }, { type: 'jogger', x: 2490 },           // screen 8: pond edges
      { type: 'jogger', x: 2930 }, { type: 'jogger', x: 3040 }, { type: 'jogger', x: 3160 }, // screen 10
    ],

    carts: [ { x: 1688 } ],                  // screen 6; x = left edge, 64 px wide

    pickups: [
      { type: 'lid',    x: 1120, y: 172 },   // screen 4
      { type: 'hotdog', x: 1504, y: 140 },   // secret: on top of the screen-5 lamp
      { type: 'lid',    x: 2700, y: 172 },   // optional second lid (TBD in LEVEL.md)
      { type: 'hotdog', x: 3364, y: 140 },   // screen 11 lamp top, before the arena (prototype addition)
    ],

    // Gauntlet arena = last screen. Camera locks; fences block both sides.
    arena: { x0: 3520, x1: 3840, trigger: 3560, gateX: 3800, gateW: 24, exitX: 3820 },

    // On-screen tutorial prompts by x range (screen-by-screen beats in LEVEL.md).
    prompts: [
      { x0: 0,    x1: 300,  text: 'ARROWS: MOVE   Z: JUMP' },
      { x0: 340,  x1: 660,  text: 'X: TAIL-WHIP' },
      { x0: 1060, x1: 1160, text: 'GRAB THE TRASH LID: BLOCKS 3 HITS' },
      { x0: 1620, x1: 1760, text: 'WHIP THE CART!' },
      { x0: 1920, x1: 2080, text: 'C: PLAY POSSUM - ZOMBIES LOSE TRACK OF YOU' },
      { x0: 3380, x1: 3520, text: 'THE PARK EXIT IS AHEAD...' },
    ],
  };
})(globalThis.SAMMY = globalThis.SAMMY || {});
