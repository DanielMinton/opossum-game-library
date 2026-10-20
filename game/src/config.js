// Tuning values for the placeholder prototype.
// Every number comes from the example docs in templates/examples/ (all PROPOSED, not approved).
// Change values here, not inside the game code.
(function (S) {
  S.CONFIG = {
    screenW: 320,              // Genesis H40 mode width
    screenH: 224,
    step: 1 / 60,              // fixed simulation step (seconds)
    groundY: 192,              // top of the grass in level 1

    sound: {                   // volume of real sound files, 0 to 1 (placeholder beeps are unchanged)
      musicVolume: 0.6,        // AUDIO.md: music sits under the sound effects
      sfxVolume: 0.8,
    },

    gravity: 900,              // px/s^2
    maxFall: 320,

    sammy: {
      maxHp: 3,
      runSpeed: 110,           // faster than a chasing jogger (60)
      accel: 900,
      decel: 1400,
      jumpSpeed: 330,          // ~60 px jump height
      jumpCutSpeed: 120,       // releasing jump early cuts the jump
      coyoteTime: 0.08,
      jumpBuffer: 0.1,
      bodyW: 20, bodyH: 30,    // character-sammy ASSET.md
      deadW: 28, deadH: 14,    // body box while playing dead
      invulnTime: 1.0,
      hurtTime: 0.2,           // hurt strip: 2 frames @ 10 fps
      hurtKnockX: 120, hurtKnockY: 150,
      attackTime: 4 / 15,      // tail-whip: 4 frames @ 15 fps
      attackHitStart: 2 / 15,  // hit frame = 2
      attackHitEnd: 3 / 15,
      whipW: 20, whipH: 12,
      landTime: 2 / 15,
      koTime: 0.6,             // ko strip: 6 frames @ 10 fps
      koWait: 1.0,             // pause before checkpoint restart
    },

    possum: {                  // ability-play-possum ABILITY.md
      radius: 96,
      maxTime: 3.0,
      minTime: 0.5,
      dropTime: 0.5,           // play-dead strip: 4 frames @ 8 fps
      getUpTime: 0.25,
      cooldown: 6.0,
      ignoreAfter: 1.5,        // prototype addition: zombies ignore Sammy briefly after he gets up
      readyFlash: 1.0,         // prototype addition: HUD icon flashes this long when the cooldown ends
    },

    jogger: {                  // enemy-zombie-jogger ASSET.md
      hp: 2,
      patrolSpeed: 30,
      chaseSpeed: 60,
      patrolRange: 64,
      notice: 96,
      giveUpDist: 160,
      giveUpTime: 2.0,
      attackRange: 26,
      attackTime: 0.4,         // 4 frames @ 10 fps
      attackHitStart: 0.2,     // hit frame = 2
      attackHitEnd: 0.3,
      attackCooldown: 1.2,
      hitW: 16, hitH: 20,
      bodyW: 18, bodyH: 38,
      hitReactTime: 2 / 12,
      defeatTime: 8 / 12,
    },

    vendor: {                  // enemy-zombie-hot-dog-vendor ASSET.md
      hp: 2,
      notice: 160,
      throwEvery: 2.0,
      throwTime: 0.4,
      releaseAt: 0.2,          // release frame = 2
      bodyW: 20, bodyH: 36,
      hitReactTime: 2 / 12,
      defeatTime: 6 / 12,
      projW: 10, projH: 6,
      projFlight: 0.9,
      projGravity: 500,
      projLife: 3.0,
    },

    cart: {                    // prop-hot-dog-cart INTERACTION.md
      w: 64, h: 48,
      rockWindow: 1.5,
      tipTime: 0.25,           // 3 frames @ 12 fps
      spillCount: 3,
      knockRadius: 48,
      hotDogLife: 10.0,
    },

    lid: { hits: 3 },          // item-powerup-trash-lid-shield ABILITY.md

    chainsaw: {                // Stage B (Proposed): pickup on screen 11; WHIP button (held) revs it instead of whipping
      fuel: 20,                // seconds of revving in a full tank
      carryDrain: 0.25,        // fuel per second used just carrying it (not revving); revving uses 1 per second
      reach: 28,               // cutting box in front of Sammy's feet point, px
      tick: 0.12,              // one cut every this many seconds while revving
      damage: 1,               // per cut (joggers and vendors have 2 hp: two cuts)
      slow: 0.6,               // run speed while revving
      slashTime: 0.2,          // a quick tap still revs (and cuts) this long
    },

    gauntlet: { waves: [2, 3, 4], waveDelay: 1.0 },
  };

  // 9-bit colour: each channel snapped to 0,36,72,...,252 (templates/STYLE_GUIDE.md)
  // Night palette (Zombie Hunter look, design/STYLE_GUIDE.md "Night mood"). Proposed.
  S.PAL = {
    black: '#000000', white: '#fcfcfc', grey: '#909090', dark: '#242424',
    sky0: '#000024', sky1: '#000048', sky2: '#24246c', sky3: '#482448', sky4: '#48246c', // night sky; sky3/sky4 = thin horizon haze above the skyline
    skyline: '#242448', trees: '#002424', bushes: '#244824',
    grass: '#246c48', dirt: '#48486c', dirtDark: '#242448',                          // night grass; wet blue-grey earth
    water: '#00246c', waterHi: '#6c90d8',
    sammy: '#d8d8d8', sammyDark: '#909090', nose: '#fc90b4',
    jogger: '#6cb46c', joggerDark: '#246c24', band: '#fc24fc',
    vendor: '#b4b46c', vendorDark: '#6c6c24', hat: '#fcfcfc',
    cart: '#d82424', cartDark: '#902424', umbrella: '#fcd824',
    hotdog: '#fcb424', mustard: '#fcfc24',
    lid: '#909090', lidHi: '#d8d8d8',
    bench: '#906c24', rock: '#6c6c90', fence: '#6c4824', pole: '#242424', lamp: '#fcd86c', lampOff: '#6c6c48',
    heart: '#fc2424', gate: '#484848', hud: '#242448', hudHi: '#48486c',
    // Night extras
    moon: '#fcfcd8', moonMid: '#d8d8b4', moonCrater: '#b4b490', star: '#d8d8fc', window: '#fcd86c',
    lampGlow: '#fcb424', lampHalo: '#d89000', lampDeep: '#904800',
    stone: '#242448', stoneMid: '#48486c', stoneLight: '#6c6c90', arch: '#000024',
    leaf0: '#fcb400', leaf1: '#d86c00', leaf2: '#b44800',
    // Scenery extras (2026-10-19, Proposed): foliage ramp, earth, lit stone, water foam, wood, bins. None of these are gore colours.
    grassHi: '#48906c', grassLo: '#004824', soilWarm: '#6c4848', soilWarmDk: '#482424', slateHi: '#9090b4', stoneMoon: '#b4b4d8',
    leaf3: '#6c2400', woodDk: '#482400', waterMid: '#2448b4', foam: '#b4d8fc', canMid: '#486c48',
    // Reserved for gore only (STYLE_GUIDE "Reserved colours")
    blood0: '#480000', blood: '#900000', bloodHi: '#b40024', ichor0: '#486c00', ichor: '#90d800', ichorHi: '#d8fc48',
    bone: '#fcd8b4', meat: '#d86c6c',
  };
})(globalThis.SAMMY = globalThis.SAMMY || {});
