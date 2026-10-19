// Art the game will use as soon as it exists.
// File names and frame specs come from the planned-file lists in templates/examples/.
// Paths are relative to the library's assets/ folder. Missing files are drawn as labeled placeholders.
//
// The game only loads files listed in src/asset-files.js (made by `node tools/scan-assets.mjs`),
// so missing art never causes browser errors. Add ?probe=1 to the URL to try every file anyway.
(function (S) {
  const strip = (key, path, frames, fps, loop, extra) =>
    Object.assign({ key, path, fw: 48, fh: 48, frames, fps, loop, px: 24, py: 47, feet: true }, extra || {});
  const SAM = 'characters/character-sammy/';
  const JOG = 'enemies/enemy-zombie-jogger/';
  const VEN = 'enemies/enemy-zombie-hot-dog-vendor/';
  const CART = 'props/prop-hot-dog-cart/';
  const LID = 'items/item-powerup-trash-lid-shield/';
  const ENV = 'environments/environment-central-park-tileset/';
  const cart = { fw: 64, fh: 48, px: 32, py: 47 };
  const small = { fw: 16, fh: 16, px: 8, py: 15 };
  const mid = { fw: 16, fh: 16, px: 8, py: 8, feet: false };

  S.ASSET_MANIFEST = [
    strip('sammy:idle', SAM + 'sammy-idle-strip-v01.png', 4, 6, 'loop'),
    strip('sammy:run', SAM + 'sammy-run-strip-v01.png', 8, 12, 'loop'),
    strip('sammy:jump-rise', SAM + 'sammy-jump-rise-strip-v01.png', 2, 10, 'hold'),
    strip('sammy:fall', SAM + 'sammy-fall-strip-v01.png', 2, 10, 'loop'),
    strip('sammy:land', SAM + 'sammy-land-strip-v01.png', 2, 15, 'once'),
    strip('sammy:tail-whip', SAM + 'sammy-tail-whip-strip-v01.png', 4, 15, 'once'),
    strip('sammy:hurt', SAM + 'sammy-hurt-strip-v01.png', 2, 10, 'once'),
    strip('sammy:play-dead', SAM + 'sammy-play-dead-strip-v01.png', 4, 8, 'hold'),
    strip('sammy:ko', SAM + 'sammy-ko-strip-v01.png', 6, 10, 'once'),
    strip('sammy:victory', SAM + 'sammy-victory-strip-v01.png', 4, 8, 'loop'),

    strip('jogger:walk', JOG + 'zombie-jogger-walk-strip-v01.png', 6, 8, 'loop'),
    strip('jogger:attack', JOG + 'zombie-jogger-attack-strip-v01.png', 4, 10, 'once'),
    strip('jogger:hit', JOG + 'zombie-jogger-hit-strip-v01.png', 2, 12, 'once'),
    strip('jogger:defeat', JOG + 'zombie-jogger-defeat-strip-v01.png', 8, 12, 'once'),
    strip('jogger:idle', JOG + 'zombie-jogger-idle-strip-v01.png', 4, 6, 'loop'),

    strip('vendor:idle', VEN + 'zombie-vendor-idle-strip-v01.png', 4, 6, 'loop'),
    strip('vendor:throw', VEN + 'zombie-vendor-throw-strip-v01.png', 4, 10, 'once'),
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

    strip('bg:sky', ENV + 'central-park-bg-sky-v01.png', 1, 1, 'hold', { fw: 320, fh: 224, px: 0, py: 0, feet: false }),
    strip('bg:skyline', ENV + 'central-park-bg-skyline-v01.png', 1, 1, 'hold', { fw: 512, fh: 64, px: 0, py: 0, feet: false }),
    strip('bg:treeline', ENV + 'central-park-bg-treeline-v01.png', 1, 1, 'hold', { fw: 512, fh: 32, px: 0, py: 0, feet: false }),
    strip('bg:bushes', ENV + 'central-park-bg-bushes-v01.png', 1, 1, 'hold', { fw: 512, fh: 32, px: 0, py: 0, feet: false }),
  ];
  // Not wired yet: central-park-tiles-v01.png needs a tile map (which metatile goes where) before it can be drawn.

  S.images = {};
  S.assetReport = { expected: S.ASSET_MANIFEST.length, tried: 0, loaded: [], failed: [], warnings: [], base: '' };

  S.loadAssets = function (opts, done) {
    const base = opts.base;
    const present = new Set(S.PRESENT_ASSET_FILES || []);
    const list = S.ASSET_MANIFEST.filter((m) => opts.probe || present.has(m.path));
    const R = S.assetReport;
    R.base = base; R.tried = list.length;
    if (!list.length || typeof Image === 'undefined') { done(R); return; }
    let left = list.length;
    const finish = () => { left -= 1; if (left === 0) done(R); };
    for (const m of list) {
      const img = new Image();
      img.onload = () => {
        const wantW = m.fw * m.frames, wantH = m.fh;
        if (img.width !== wantW || img.height !== wantH) {
          R.warnings.push(m.path + ': expected ' + wantW + 'x' + wantH + ' px, got ' + img.width + 'x' + img.height);
        }
        S.images[m.key] = Object.assign({ img }, m);
        R.loaded.push(m.path);
        finish();
      };
      img.onerror = () => { R.failed.push(m.path); finish(); };
      img.src = base + m.path;
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
