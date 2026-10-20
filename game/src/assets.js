// Art the game will use as soon as it exists.
// File names and frame specs come from the planned-file lists in templates/examples/.
// Paths are relative to the library's assets/ folder. Missing files are drawn as labeled placeholders.
//
// The game only loads files listed in src/asset-files.js (made by `node tools/scan-assets.mjs`),
// so missing art never causes browser errors. Add ?probe=1 to the URL to try every file anyway.
// Each path below names version 01. A newer file beside it (-v02.png, -v03.png, …) is used instead.
// hitFrame / releaseFrame count from 0: the frame where the hit lands or the hot dog leaves the hand.
// config.js timings must equal frames / fps of these strips (checked by tests/sim.test.mjs).
(function (S) {
  const strip = (key, path, frames, fps, loop, extra) =>
    Object.assign({ key, path, fw: 48, fh: 48, frames, fps, loop, px: 24, py: 47, feet: true }, extra || {});
  const SAM = 'characters/character-sammy/';
  // Sammy's feet point sits at x 28 (not the usual 24): his tail needs the extra room behind him.
  // Set from the first real strip (run, 2026-10-19). All Sammy strips use it so he doesn't jump when switching animations.
  const sam = (extra) => Object.assign({ px: 28 }, extra || {});
  const JOG = 'enemies/enemy-zombie-jogger/';
  const VEN = 'enemies/enemy-zombie-hot-dog-vendor/';
  const CART = 'props/prop-hot-dog-cart/';
  const LID = 'items/item-powerup-trash-lid-shield/';
  const SAW = 'items/item-powerup-chainsaw/';
  const saw = { fw: 64, px: 36 }; // Sammy with the chainsaw: 64x48 cells like tail-whip, so the 28 px saw fits in front
  const ENV = 'environments/environment-central-park-tileset/';
  const cart = { fw: 64, fh: 48, px: 32, py: 47 };
  const small = { fw: 16, fh: 16, px: 8, py: 15 };
  const mid = { fw: 16, fh: 16, px: 8, py: 8, feet: false };
  // Some items live in another thing's folder: the hot dog projectile and splat are in the vendor's folder (VEN),
  // and the hot dog pickup is in the cart's folder (CART). The scanner's "Still missing" list shows each exact path.

  S.ASSET_MANIFEST = [
    strip('sammy:idle', SAM + 'sammy-idle-strip-v01.png', 4, 6, 'loop', sam()),
    strip('sammy:run', SAM + 'sammy-run-strip-v01.png', 8, 12, 'loop', sam()),
    strip('sammy:jump-rise', SAM + 'sammy-jump-rise-strip-v01.png', 2, 10, 'hold', sam()),
    strip('sammy:fall', SAM + 'sammy-fall-strip-v01.png', 2, 10, 'loop', sam()),
    strip('sammy:land', SAM + 'sammy-land-strip-v01.png', 2, 15, 'once', sam()),
    // Wider 64x48 cell, pivot (36, 47) (Sammy's 28 plus 8): the whip reaches 26 px in front of Sammy, more than a 48 px cell allows.
    strip('sammy:tail-whip', SAM + 'sammy-tail-whip-strip-v01.png', 4, 15, 'once', { fw: 64, px: 36, hitFrame: 2 }),
    strip('sammy:hurt', SAM + 'sammy-hurt-strip-v01.png', 2, 10, 'once', sam()),
    strip('sammy:play-dead', SAM + 'sammy-play-dead-strip-v01.png', 4, 8, 'hold', sam()),
    strip('sammy:ko', SAM + 'sammy-ko-strip-v01.png', 6, 10, 'once', sam()),
    strip('sammy:victory', SAM + 'sammy-victory-strip-v01.png', 4, 8, 'loop', sam()),
    strip('sammy:chainsaw-idle', SAM + 'sammy-chainsaw-idle-strip-v01.png', 4, 6, 'loop', saw),
    strip('sammy:chainsaw-run', SAM + 'sammy-chainsaw-run-strip-v01.png', 8, 12, 'loop', saw),
    strip('sammy:chainsaw-rev', SAM + 'sammy-chainsaw-rev-strip-v01.png', 4, 15, 'loop', saw),

    strip('jogger:walk', JOG + 'zombie-jogger-walk-strip-v01.png', 6, 8, 'loop'),
    strip('jogger:attack', JOG + 'zombie-jogger-attack-strip-v01.png', 4, 10, 'once', { hitFrame: 2 }),
    strip('jogger:hit', JOG + 'zombie-jogger-hit-strip-v01.png', 2, 12, 'once'),
    strip('jogger:defeat', JOG + 'zombie-jogger-defeat-strip-v01.png', 8, 12, 'once'),
    strip('jogger:idle', JOG + 'zombie-jogger-idle-strip-v01.png', 4, 6, 'loop'),

    strip('vendor:idle', VEN + 'zombie-vendor-idle-strip-v01.png', 4, 6, 'loop'),
    strip('vendor:throw', VEN + 'zombie-vendor-throw-strip-v01.png', 4, 10, 'once', { releaseFrame: 2 }),
    strip('vendor:hit', VEN + 'zombie-vendor-hit-strip-v01.png', 2, 12, 'once'),
    strip('vendor:defeat', VEN + 'zombie-vendor-defeat-strip-v01.png', 6, 12, 'once'),
    strip('projectile:hotdog', VEN + 'hot-dog-projectile-strip-v01.png', 4, 12, 'loop', mid),
    strip('effect:splat', VEN + 'hot-dog-splat-strip-v01.png', 4, 15, 'once', mid),

    strip('cart:upright', CART + 'hot-dog-cart-upright-v01.png', 1, 1, 'hold', cart),
    strip('cart:rocking', CART + 'hot-dog-cart-rocking-strip-v01.png', 3, 12, 'loop', cart),
    strip('cart:tipping', CART + 'hot-dog-cart-tipping-strip-v01.png', 3, 12, 'once', cart),
    strip('cart:tipped-over', CART + 'hot-dog-cart-tipped-over-v01.png', 1, 1, 'hold', cart),
    strip('cart:empty', CART + 'hot-dog-cart-empty-v01.png', 1, 1, 'hold', cart),
    strip('pickup:hotdog', CART + 'hot-dog-pickup-strip-v01.png', 4, 8, 'loop', small),

    strip('pickup:lid', LID + 'trash-lid-pickup-strip-v01.png', 4, 8, 'loop', small),
    strip('overlay:lid', LID + 'trash-lid-held-overlay-strip-v01.png', 3, 1, 'frame', mid),
    strip('hud:lid', LID + 'hud-icon-trash-lid-v01.png', 1, 1, 'hold', { fw: 16, fh: 16, px: 0, py: 0, feet: false }),

    strip('pickup:chainsaw', SAW + 'chainsaw-pickup-strip-v01.png', 4, 8, 'loop', { fw: 32, fh: 16, px: 16, py: 15 }),
    strip('hud:chainsaw', SAW + 'hud-icon-chainsaw-v01.png', 1, 1, 'hold', { fw: 16, fh: 16, px: 0, py: 0, feet: false }),

    // Parallax bands: y = top row on screen, scroll = speed vs. the camera, fw = loop width.
    // Bands must not overlap (rows 80-143, 144-175, 176-207), as in the tileset ASSET.md.
    strip('bg:sky', ENV + 'central-park-bg-sky-v01.png', 1, 1, 'hold', { fw: 320, fh: 224, px: 0, py: 0, feet: false, y: 0, scroll: 0 }),
    strip('bg:skyline', ENV + 'central-park-bg-skyline-v01.png', 1, 1, 'hold', { fw: 512, fh: 64, px: 0, py: 0, feet: false, y: 80, scroll: 0.125 }),
    strip('bg:treeline', ENV + 'central-park-bg-treeline-v01.png', 1, 1, 'hold', { fw: 512, fh: 32, px: 0, py: 0, feet: false, y: 144, scroll: 0.25 }),
    strip('bg:bushes', ENV + 'central-park-bg-bushes-v01.png', 1, 1, 'hold', { fw: 512, fh: 32, px: 0, py: 0, feet: false, y: 176, scroll: 0.5 }),
  ];
  // Scenery pieces (2026-10-19, Proposed): placed in the world from level.js `scenery`. Cosmetic only; the rules never read them.
  // Real art replaces the coded placeholder in src/scenery.js one piece at a time. Sizes, pivots and the rows that line up with
  // the rules (bench seat, lamp ledge) are written up in design/ART_BRIEFS.md, "Scenery (park and Bethesda Terrace)".
  // Props: pivot = bottom-centre (feet on the ground line), frames side by side. Tiles: repeat every fw px, drawn from their left edge.
  const PARK = ENV;
  const BETH = 'environments/environment-bethesda-terrace/';
  const prop = (key, path, fw, fh, frames, fps, extra) =>
    strip(key, path, frames, fps, frames > 1 && fps > 0 ? 'loop' : 'hold', Object.assign({ fw, fh, px: fw >> 1, py: fh - 1, feet: true }, extra || {}));
  // Ground tiles hang from the ground line (top-left pivot, row 0 = the first row below the grass line y 192); strips are variants, not an animation.
  const tile = (key, path, variants) => strip(key, path, variants, 0, 'hold', { fw: 16, fh: 32, px: 0, py: 0, feet: false, tile: true, variants });
  S.ASSET_MANIFEST.push(
    tile('scenery:ground-park', PARK + 'scenery-ground-park-strip-v01.png', 2),
    tile('scenery:ground-path', PARK + 'scenery-ground-path-strip-v01.png', 2),
    tile('scenery:ground-terrace', BETH + 'bethesda-ground-terrace-strip-v01.png', 2),
    prop('scenery:lamp', PARK + 'scenery-lamp-v01.png', 16, 64, 1, 1),
    prop('scenery:lamp-glow', PARK + 'scenery-lamp-glow-v01.png', 48, 48, 1, 1, { px: 24, py: 24, feet: false }),
    prop('scenery:bench', PARK + 'scenery-bench-v01.png', 32, 32, 1, 1),
    prop('scenery:tree-far', PARK + 'scenery-tree-far-strip-v01.png', 64, 96, 2, 0, { variants: 2 }),
    prop('scenery:tree-near', PARK + 'scenery-tree-near-strip-v01.png', 96, 128, 2, 0, { variants: 2 }),
    prop('scenery:fence', PARK + 'scenery-fence-v01.png', 16, 24, 1, 1),
    prop('scenery:rock', PARK + 'scenery-rock-v01.png', 32, 16, 1, 1),
    prop('scenery:trashcan', PARK + 'scenery-trashcan-v01.png', 16, 24, 1, 1),
    // Foreground drifting leaves: a 320 px wide band that repeats sideways, 2 frames at 2 fps, moves at 1.3x the camera. Top-left pivot.
    strip('scenery:leaves-fg', PARK + 'scenery-leaves-fg-strip-v01.png', 2, 2, 'loop', { fw: 320, fh: 64, px: 0, py: 0, feet: false, y: 96, scroll: 1.3 }),
    // Puddle: lies flat on the ground, its top row on the ground line (y 192), pivot top-centre.
    prop('scenery:puddle', PARK + 'scenery-puddle-strip-v01.png', 32, 8, 2, 2, { py: 0, feet: false }),
    prop('scenery:bethesda-fountain', BETH + 'bethesda-fountain-strip-v01.png', 128, 96, 3, 6),
    prop('scenery:bethesda-angel', BETH + 'bethesda-angel-v01.png', 48, 64, 1, 1),
    prop('scenery:bethesda-balustrade', BETH + 'bethesda-balustrade-v01.png', 32, 24, 1, 1),
    prop('scenery:bethesda-arch', BETH + 'bethesda-arch-v01.png', 64, 80, 1, 1),
    prop('scenery:bethesda-stairs', BETH + 'bethesda-stairs-v01.png', 64, 32, 1, 1),
  );
  // Not wired yet: central-park-tiles-v01.png needs a tile map (which metatile goes where) before it can be drawn.

  // Sound the game will use as soon as it exists (names from templates/examples/audio/AUDIO.md).
  // Each sound lives in its own folder: assets/audio/sfx/<id>/<id>-v01.ogg (or .mp3 / .wav).
  // Variations: <id>-v01-a.ogg, <id>-v01-b.ogg, … — one is picked at random each time.
  // Sounds without a file keep their placeholder beep.
  const SFX_IDS = [
    // Core set from AUDIO.md
    'sfx-jump', 'sfx-land', 'sfx-tail-whip', 'sfx-hit-zombie', 'sfx-zombie-groan', 'sfx-pickup', 'sfx-hurt',
    'sfx-play-dead', 'sfx-zombie-defeat-comedic', 'sfx-cart-crash', 'sfx-ko',
    // Extra sounds the prototype uses (see design/DECISIONS.md)
    'sfx-cart-rock', 'sfx-shield-block', 'sfx-shield-break', 'sfx-throw', 'sfx-splat', 'sfx-splash',
    'sfx-checkpoint', 'sfx-gate-open', 'sfx-level-clear', 'sfx-start',
    // Stage B: chainsaw and gore (sfx-chainsaw-rev loops while the saw revs)
    'sfx-chainsaw-start', 'sfx-chainsaw-rev', 'sfx-chainsaw-cut', 'sfx-gore-splat',
  ];
  S.SOUND_MANIFEST = SFX_IDS.map((id) => ({ id, kind: 'sfx', dir: 'audio/sfx/' + id + '/' })).concat([
    { id: 'music-level-01-central-park', kind: 'music', dir: 'audio/music/music-level-01-central-park/' },
    { id: 'music-level-01-gauntlet', kind: 'music', dir: 'audio/music/music-level-01-gauntlet/' },
  ]);
  // Which music file each part of the game plays, in order of preference. If none exist, the placeholder loop plays.
  S.MUSIC_TRACKS = {
    level: ['music-level-01-central-park'],
    arena: ['music-level-01-gauntlet', 'music-level-01-central-park'],
  };
  S.SOUND_FORMATS = ['ogg', 'mp3', 'wav']; // preferred first; the browser skips formats it can't play
  // Matches a sound file name: <id>-v<version>[-<variation letter>].<format>
  S.soundFileInfo = function (id, name) {
    const m = new RegExp('^' + id.replace(/[-]/g, '\\-') + '-v(\\d+)(?:-([a-z]))?\\.(ogg|mp3|wav)$', 'i').exec(name);
    return m ? { version: parseInt(m[1], 10), variant: (m[2] || '').toLowerCase(), format: m[3].toLowerCase() } : null;
  };
  // Version number of an art file name for a manifest path, e.g. sammy-run-strip-v02.png -> 2 (null if it doesn't match).
  S.artFileVersion = function (manifestPath, name) {
    const stem = manifestPath.split('/').pop().replace(/-v\d+\.png$/i, '');
    const m = new RegExp('^' + stem.replace(/[-.]/g, '\\$&') + '-v(\\d+)\\.png$', 'i').exec(name);
    return m ? parseInt(m[1], 10) : null;
  };

  S.images = {};
  S.assetReport = { expected: S.ASSET_MANIFEST.length, tried: 0, loaded: [], failed: [], warnings: [], base: '' };

  // White copy of a strip, drawn on hurt / hit-react flash frames. Skipped where there is no canvas (Node tests).
  function whiteCopy(img) {
    if (typeof document === 'undefined') return null;
    try {
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      g.globalCompositeOperation = 'source-in';
      g.fillStyle = (S.PAL && S.PAL.white) || '#fcfcfc';
      g.fillRect(0, 0, c.width, c.height);
      return c;
    } catch (e) { return null; }
  }

  // PRESENT_ASSET_FILES maps each manifest path to the newest version found (see tools/scan-assets.mjs).
  S.loadAssets = function (opts, done) {
    const base = opts.base;
    const present = S.PRESENT_ASSET_FILES || {};
    const list = S.ASSET_MANIFEST.filter((m) => opts.probe || present[m.path]);
    const R = S.assetReport;
    R.base = base; R.tried = list.length;
    if (!list.length || typeof Image === 'undefined') { done(R); return; }
    let left = list.length;
    const finish = () => { left -= 1; if (left === 0) done(R); };
    for (const m of list) {
      const file = present[m.path] || m.path;
      const img = new Image();
      img.onload = () => {
        const wantW = m.fw * m.frames, wantH = m.fh;
        if (img.width !== wantW || img.height !== wantH) {
          // Wrong size would be cut into frames wrongly, so the placeholder stays.
          R.warnings.push(file + ': expected ' + wantW + 'x' + wantH + ' px, got ' + img.width + 'x' + img.height + ' (not used)');
        } else {
          S.images[m.key] = Object.assign({ img, file, flash: whiteCopy(img) }, m);
          R.loaded.push(file);
        }
        finish();
      };
      img.onerror = () => { R.failed.push(file); finish(); };
      img.src = base + file;
    }
  };

  // Which frame of a strip to show after `t` seconds.
  S.frameAt = function (m, t, reverse) {
    let f = Math.floor(t * m.fps);
    if (m.loop === 'loop') f = f % m.frames;
    else f = Math.min(f, m.frames - 1);
    if (reverse) f = m.frames - 1 - f;
    return Math.max(0, f);
  };
})(globalThis.SAMMY = globalThis.SAMMY || {});
