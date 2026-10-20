// Scenery: the park and Bethesda Terrace. Real art from S.images ('scenery:*' in assets.js) is drawn when it has loaded;
// otherwise each piece is drawn here in code, once, onto a small hidden canvas of the same size as the real picture would be,
// and that canvas is stamped into the world. Nothing here is random (hash noise only), so screenshots are always the same.
// Cosmetic only: sim.js never reads any of this. Without a canvas (Node tests) the pieces are simply skipped.
// Pixel rules (STYLE_GUIDE): S.PAL colours only, hard edges, dithering instead of see-through, light from the top-left.
(function (S) {
  const K = S.PAL, C = S.CONFIG, G = C.groundY, W = C.screenW;
  const hasDom = typeof document !== 'undefined';
  const hash = (n) => (((Math.imul(n | 0, 2654435761) ^ (n >> 5)) >>> 0) % 1000) / 1000;
  const O = K.arch; // outline colour: the deepest night blue, never pure black
  const ST = [K.stone, K.stoneMid, K.stoneLight, K.slateHi];          // moonlit stone, dark to light
  const FOL = [K.trees, K.grassLo, K.bushes, K.grass, K.grassHi];     // night foliage, dark to light
  const RUST = [K.leaf3, K.leaf2, K.leaf1, K.leaf0];                  // autumn leaves, dark to light
  const WOOD = [K.woodDk, K.fence, K.bench];

  // ---------- a tiny pixel buffer (so shapes can be shaded, outlined and then stamped as plain rectangles) ----------
  class Buf {
    constructor(w, h) { this.w = w; this.h = h; this.c = new Array(w * h).fill(null); }
    set(x, y, c) { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && x < this.w && y >= 0 && y < this.h) this.c[y * this.w + x] = c; }
    get(x, y) { return x >= 0 && x < this.w && y >= 0 && y < this.h ? this.c[y * this.w + x] : null; }
    rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
    hline(x, y, w, c) { this.rect(x, y, w, 1, c); }
    // Checkerboard of c over a rectangle (the 16-bit way to blend). Only paints where `only` is true, when given.
    dither(x, y, w, h, c, ph, only) {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (((x + i + y + j + (ph || 0)) & 1) === 0 && (!only || this.get(x + i, y + j))) this.set(x + i, y + j, c);
    }
    // Filled ellipse; fn(dx, dy, x, y) gives each pixel's colour (dx, dy run -1..1 across the shape) or null to skip it.
    ell(cx, cy, rx, ry, fn) {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) { const c = typeof fn === 'string' ? fn : fn(dx, dy, x, y); if (c) this.set(x, y, c); }
      }
    }
    // Autumn patch: inside an ellipse, painted pixels are swapped for a ramp colour, thinning out towards the edge (ragged, not a ball).
    patch(cx, cy, rx, ry, ramp, seed) {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
        if (d > 1 || !this.get(x, y) || hash(x * 7 + y * 131 + seed) > 0.95 - d * 0.7) continue;
        this.set(x, y, shade(ramp, 0.5 + 0.45 * -(dx * 0.6 + dy * 0.8) + (hash(x * 3 + y * 17 + seed) - 0.5) * 0.5, x, y));
      }
    }
    // Thick line, w pixels wide.
    line(x0, y0, x1, y1, w, c) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let i = 0; i <= n; i++) this.rect(Math.round(x0 + (x1 - x0) * i / n - (w - 1) / 2), Math.round(y0 + (y1 - y0) * i / n - (w - 1) / 2), w, w, c);
    }
    // 1 px outline around everything painted (only on empty pixels).
    outline(c) {
      const src = this.c.slice(), at = (x, y) => (x >= 0 && x < this.w && y >= 0 && y < this.h ? src[y * this.w + x] : null);
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        if (!at(x, y) && (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1))) this.c[y * this.w + x] = c;
      }
    }
    // Moonlit rim: painted pixels whose left or upper neighbour is empty step up one colour of the ramp.
    rim(ramp) {
      const src = this.c.slice(), at = (x, y) => (x >= 0 && x < this.w && y >= 0 && y < this.h ? src[y * this.w + x] : null);
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        const c = at(x, y), i = c ? ramp.indexOf(c) : -1;
        if (i >= 0 && i < ramp.length - 1 && (!at(x - 1, y) || !at(x, y - 1))) this.c[y * this.w + x] = ramp[i + 1];
      }
    }
    // Scatter 1-2 px specks that step one colour up or down the ramp, only on pixels already in the ramp.
    speckle(ramp, seed, count, big) {
      for (let n = 0; n < count; n++) {
        const x = Math.floor(hash(seed + n * 3) * this.w), y = Math.floor(hash(seed + n * 3 + 1) * this.h), c = this.get(x, y), i = c ? ramp.indexOf(c) : -1;
        if (i < 0) continue;
        const j = hash(seed + n * 3 + 2) < 0.5 ? Math.max(0, i - 1) : Math.min(ramp.length - 1, i + 1);
        this.set(x, y, ramp[j]); if (big && ramp.indexOf(this.get(x + 1, y)) >= 0) this.set(x + 1, y, ramp[j]);
      }
    }
    flush(g, ox, oy) {
      for (let y = 0; y < this.h; y++) {
        for (let x = 0; x < this.w;) {
          const c = this.c[y * this.w + x];
          if (!c) { x++; continue; }
          let e = x + 1; while (e < this.w && this.c[y * this.w + e] === c) e++;
          g.fillStyle = c; g.fillRect(ox + x, oy + y, e - x, 1); x = e;
        }
      }
    }
  }
  // Pick a colour from a dark-to-light ramp for v in 0..1, with a checkerboard blend between neighbouring steps.
  function shade(ramp, v, x, y) {
    const f = Math.max(0, Math.min(0.999, v)) * ramp.length, i = Math.floor(f), fr = f - i, chk = (x + y) & 1;
    if (fr > 0.72 && chk && i < ramp.length - 1) return ramp[i + 1];
    if (fr < 0.28 && chk && i > 0) return ramp[i - 1];
    return ramp[i];
  }
  // A round shape lit from the top-left.
  const lit = (ramp, bias) => (dx, dy, x, y) => shade(ramp, 0.5 + 0.5 * -(dx * 0.6 + dy * 0.8) * 0.9 + (bias || 0), x, y);
  // A puffy cluster of round blobs [cx, cy, rx, ry] (drawn in order, so later ones sit in front).
  function puffs(b, blobs, ramp, bias) { for (const [cx, cy, rx, ry] of blobs) b.ell(cx, cy, rx, ry, lit(ramp, bias)); }

  // ---------- the pieces (each draws into a Buf the size of its picture; variant = frame number of 2-variant strips) ----------
  const GEN = {};

  // Park ground: 16 px wide, repeats. Row 0 is the first row below the ground line. Grass edge, wet earth, pebbles, three shading steps.
  GEN['scenery:ground-park'] = (b, v) => {
    const s = v * 97 + 5;
    b.rect(0, 0, 16, 32, K.dirt);
    b.rect(0, 0, 16, 4, K.grass);                                   // grass cap
    for (let x = 0; x < 16; x++) {
      b.set(x, 0, hash(s + x) > 0.55 ? K.grassHi : K.grass);
      if (hash(s + x + 40) > 0.5) b.set(x, 3, K.grassLo);
      b.set(x, 4, (x & 1) ? K.grassLo : K.dirt);                    // ragged edge between grass and earth
      if (hash(s + x + 70) > 0.6) b.set(x, 5, K.grassLo);
    }
    b.rect(0, 6, 16, 3, K.dirt);
    b.dither(0, 14, 16, 8, K.dirtDark, 0);                          // earth darkens with depth: dither, then flat
    b.rect(0, 22, 16, 10, K.dirtDark);
    b.dither(0, 20, 16, 2, K.dirtDark, 1);
    for (let i = 0; i < 3; i++) {                                   // pebbles: light top-left, shadow under
      const x = Math.floor(hash(s + i * 5) * 12) + 1, y = 8 + Math.floor(hash(s + i * 5 + 1) * 16);
      b.rect(x, y, 2, 1, K.stoneLight); b.set(x, y + 1, K.soilWarm); b.set(x + 1, y + 1, K.stone);
    }
    for (let i = 0; i < 3; i++) b.rect(Math.floor(hash(s + i * 9 + 2) * 14), 7 + Math.floor(hash(s + i * 9 + 3) * 18), 2, 1, K.soilWarm); // warm clay flecks
    b.set(3 + v * 7, 11, K.waterHi); b.set(11 - v * 6, 17, K.waterHi); b.set(7, 26, K.waterMid); // wet glints
    b.set(5 + v * 4, 1, K.leaf1); b.set(6 + v * 4, 1, K.leaf2); b.set(12 - v * 5, 2, K.leaf0); // fallen leaves on the grass
  };
  // Wet path stone: staggered flagstones, light top-left edges, dark joints, a few glints.
  GEN['scenery:ground-path'] = (b, v) => {
    const s = v * 53 + 11;
    b.rect(0, 0, 16, 32, K.stoneMid);
    b.hline(0, 0, 16, K.stoneLight); b.hline(0, 1, 16, K.stoneLight); b.dither(0, 2, 16, 1, K.stoneLight, 0);
    const rows = [[2, 9], [11, 10], [21, 11]];
    rows.forEach(([y0, h], r) => {
      b.hline(0, y0 + h - 1, 16, K.stone);                          // joint under the course
      b.dither(0, y0 + h - 2, 16, 1, K.stone, r);
      const jx = (r * 5 + v * 7) % 16;                              // staggered vertical joint (every course differs)
      for (let y = y0; y < y0 + h - 1; y++) b.set(jx, y, K.stone);
      for (let y = y0 + 1; y < y0 + 3; y++) b.set((jx + 1) % 16, y, K.stoneLight);
    });
    b.dither(0, 22, 16, 10, K.stone, 0);
    b.rect(0, 28, 16, 4, K.stone);
    for (let i = 0; i < 4; i++) b.set(Math.floor(hash(s + i) * 15), 2 + Math.floor(hash(s + i + 9) * 18), K.waterHi);
    for (let i = 0; i < 3; i++) b.rect(Math.floor(hash(s + i + 30) * 13), 3 + Math.floor(hash(s + i + 31) * 17), 1, 2, K.slateHi);
    b.set(4 + v * 6, 1, K.leaf2); b.set(5 + v * 6, 1, K.leaf1);
  };
  // Bethesda flagstone: big pale slabs, rain-slick, with a moon glint on each lit edge and cracks.
  GEN['scenery:ground-terrace'] = (b, v) => {
    b.rect(0, 0, 16, 32, K.stoneMid);
    b.hline(0, 0, 16, K.slateHi); b.hline(0, 1, 16, K.stoneLight);
    const joints = [[2, 9, 0], [12, 9, 8], [22, 10, 0]];
    joints.forEach(([y0, h, jx], r) => {
      b.hline(0, y0 + h - 1, 16, K.stone);
      for (let y = y0; y < y0 + h - 1; y++) b.set((jx + (v ? 3 : 0)) % 16, y, K.stone);
      for (let x = 0; x < 16; x++) if (hash(x * 3 + r * 17 + v * 29) > 0.8) b.set(x, y0 + 1, K.stoneLight);
    });
    b.dither(0, 20, 16, 12, K.stone, 1);
    b.rect(0, 28, 16, 4, K.stone);
    if (v) { b.set(5, 5, K.stone); b.set(6, 6, K.stone); b.set(6, 7, K.stone); b.set(7, 8, K.stone); } // a crack
    b.set(10 - v * 5, 4, K.waterHi); b.set(3 + v * 8, 15, K.waterHi); b.set(12, 24, K.stoneLight);
  };

  // Lamp post, 16x64, lit. Row 12 is the ledge Sammy stands on (the lamp platforms are at y 140: 192 - 64 + 12).
  GEN['scenery:lamp'] = (b) => {
    const IR = ST;
    b.rect(7, 0, 2, 1, IR[2]); b.rect(6, 1, 4, 2, IR[2]);              // finial ball
    b.rect(7, 3, 2, 1, IR[1]); b.rect(6, 4, 4, 2, IR[1]); b.rect(5, 6, 6, 3, IR[1]); b.rect(4, 9, 8, 3, IR[1]); // crown
    b.set(6, 4, IR[2]); b.set(5, 6, IR[2]); b.set(4, 9, IR[2]);
    b.hline(0, 12, 16, IR[3]); b.hline(0, 13, 16, IR[2]); b.hline(1, 14, 14, IR[0]); // the ledge: moon-lit top
    b.dither(2, 14, 12, 1, IR[1], 0);
    b.rect(3, 15, 1, 16, IR[1]); b.rect(12, 15, 1, 16, IR[0]);          // lantern frame
    b.rect(4, 15, 8, 16, K.lamp);                                       // glass: bright core, warm edges
    b.rect(4, 15, 1, 16, K.lampHalo); b.rect(11, 15, 1, 16, K.lampHalo);
    b.rect(5, 15, 1, 16, K.lampGlow); b.rect(10, 15, 1, 16, K.lampGlow);
    b.rect(7, 18, 2, 10, K.moon);
    b.hline(4, 22, 8, K.lampHalo);                                      // glazing bar
    b.hline(4, 15, 8, K.lampGlow);
    b.hline(4, 31, 8, K.lampHalo);
    b.hline(4, 32, 8, IR[1]); b.rect(5, 33, 6, 2, IR[2]); b.set(5, 33, IR[3]); // lantern foot and collar
    b.rect(6, 35, 4, 17, IR[1]); b.rect(6, 35, 1, 17, IR[2]); b.rect(9, 35, 1, 17, IR[0]); // shaft: light left, dark right
    b.rect(5, 40, 6, 2, IR[2]); b.rect(5, 48, 6, 2, IR[2]);              // rings
    b.rect(5, 52, 6, 3, IR[1]); b.rect(4, 55, 8, 2, IR[1]);              // flare
    b.rect(3, 57, 10, 4, IR[1]); b.hline(3, 57, 10, IR[2]); b.rect(3, 57, 1, 4, IR[3]);
    b.rect(2, 61, 12, 3, IR[1]); b.hline(2, 61, 12, IR[2]); b.hline(2, 63, 12, IR[0]);
    b.outline(O);
  };
  // Lamp glow: a dithered amber pool, 48x48, centre at (24, 24). Thins out with distance; never see-through pixels.
  GEN['scenery:lamp-glow'] = (b) => {
    for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) {
      const dx = x - 23.5, dy = y - 23.5, d = Math.sqrt(dx * dx + dy * dy) / 24;
      if (d < 0.25) b.set(x, y, (x + y) & 1 ? K.lampGlow : K.lampHalo);
      else if (d < 0.45) { if ((x + y) & 1) b.set(x, y, K.lampHalo); }
      else if (d < 0.65) { if (((x + y) & 1) && (y & 1)) b.set(x, y, K.lampHalo); }
      else if (d < 0.92) { if ((x & 3) === 0 && (y & 3) === ((x & 4) ? 2 : 0)) b.set(x, y, K.lampDeep); }
    }
  };
  // Park bench, 32x32. The seat top is row 12 (the bench platforms are at y 172: 192 - 32 + 12). Slatted back, iron ends.
  GEN['scenery:bench'] = (b) => {
    const IR = ST;
    for (const x of [3, 26]) { b.rect(x, 0, 3, 14, IR[1]); b.rect(x, 0, 1, 14, IR[2]); }  // back posts
    for (const y of [1, 4, 7]) { b.rect(3, y, 26, 2, WOOD[1]); b.hline(3, y, 26, WOOD[2]); b.hline(3, y + 2, 26, WOOD[0]); }
    b.rect(0, 12, 32, 3, WOOD[1]); b.hline(0, 12, 32, WOOD[2]); b.hline(0, 15, 32, WOOD[0]);  // seat: lit top, dark underside
    b.dither(0, 12, 32, 1, K.lamp, 0);                                    // amber lamplight catching the seat
    b.rect(1, 9, 3, 2, IR[1]); b.rect(28, 9, 3, 2, IR[1]);                // arm rests
    for (const x of [2, 27]) { b.rect(x, 16, 3, 14, IR[1]); b.rect(x, 16, 1, 14, IR[2]); b.rect(x - 1, 30, 5, 2, IR[1]); }
    b.hline(5, 16, 22, IR[0]);                                            // apron shadow
    b.outline(O);
  };
  // Park trees. tree-far: soft dark canopy in the world just behind the lane, no outline.
  GEN['scenery:tree-far'] = (b, v) => {
    const TR = [K.arch, K.stone, K.stoneMid];
    // trunk with root flare, a fork into the canopy
    for (let y = 50; y < 96; y++) {
      const t = (y - 50) / 45, half = 3 + Math.floor(t * t * 4), cx = v ? 32 : 31;
      b.rect(cx - half, y, half * 2, 1, TR[1]); b.set(cx - half, y, TR[2]); b.set(cx - half + 1, y, TR[2]); b.set(cx + half - 1, y, TR[0]);
      if (hash(y * 7 + v) > 0.6) b.set(cx - 1 + (y & 1), y, TR[0]);
    }
    b.line(31, 56, 18, 38, 3, TR[1]); b.line(33, 56, 46, 40, 3, TR[1]);
    const blobs = v
      ? [[32, 30, 19, 27], [19, 42, 11, 14], [45, 43, 11, 14], [32, 12, 14, 12], [22, 24, 10, 12], [43, 26, 10, 11], [32, 50, 16, 8]]
      : [[32, 26, 27, 22], [14, 36, 14, 12], [50, 36, 14, 12], [24, 13, 15, 12], [41, 13, 15, 12], [32, 46, 22, 9], [18, 28, 12, 12], [47, 27, 12, 12]];
    puffs(b, blobs, FOL.slice(0, 4), 0);
    b.speckle(FOL, 17 + v * 101, 140, true);
    b.patch(v ? 41 : 20, v ? 35 : 22, 10, 8, RUST.slice(0, 3), 5 + v);              // autumn: ragged rust patches in the canopy
    b.patch(v ? 24 : 46, v ? 18 : 33, 8, 6, RUST.slice(0, 3), 77 + v);
    b.dither(8, 52, 48, 3, FOL[0], 0, true);                           // dark underside of the crown
    b.rim(FOL);
  };
  // tree-near: a foreground tree in front of everything: dark, outlined, slim trunk, canopy high above Sammy's head.
  GEN['scenery:tree-near'] = (b, v) => {
    const TR = [K.arch, K.stone, K.stoneMid, K.stoneLight];
    const cx = v ? 47 : 48;
    for (let y = 56; y < 128; y++) {
      const t = Math.max(0, (y - 112) / 15), half = 4 + Math.floor(t * 5) + (y < 70 ? 1 : 0), x0 = cx - half;
      b.rect(x0, y, half * 2, 1, TR[1]); b.set(x0, y, TR[2]); b.set(x0 + 1, y, TR[2]); b.set(x0 + half * 2 - 1, y, TR[0]); b.set(x0 + half * 2 - 2, y, TR[0]);
      if (hash(y * 3 + v * 19) > 0.55) b.set(x0 + 3 + Math.floor(hash(y) * (half * 2 - 6)), y, TR[0]);   // bark grooves
    }
    b.line(cx - 2, 64, v ? 16 : 22, 40, 4, TR[1]); b.line(cx + 2, 62, v ? 82 : 76, 38, 4, TR[1]);
    const blobs = v
      ? [[48, 30, 24, 24], [22, 32, 18, 17], [74, 34, 18, 17], [34, 14, 16, 13], [62, 15, 16, 13], [48, 54, 20, 9]]
      : [[48, 28, 30, 22], [20, 36, 20, 17], [76, 36, 20, 17], [32, 14, 18, 13], [64, 14, 18, 13], [48, 52, 26, 10]];
    puffs(b, blobs, [K.arch, K.trees, K.grassLo, K.bushes], 0);
    b.speckle([K.trees, K.grassLo, K.bushes, K.grass], 211 + v * 53, 160, true);
    b.patch(v ? 28 : 70, v ? 24 : 40, 13, 10, [K.leaf3, K.leaf3, K.leaf2, K.leaf1], 41 + v);  // autumn patches
    b.patch(v ? 66 : 28, v ? 40 : 22, 11, 8, [K.leaf3, K.leaf3, K.leaf2, K.leaf1], 9 + v);
    b.rim([K.arch, K.trees, K.grassLo, K.bushes, K.grass]);
    b.rim([K.leaf3, K.leaf2, K.leaf1, K.leaf0]);
    b.outline(O);
  };
  // Iron railing, 16x24, repeats every 16 px: spear-topped pickets between two rails.
  GEN['scenery:fence'] = (b) => {
    for (const x of [1, 5, 9, 13]) {
      b.rect(x, 3, 2, 21, ST[1]); b.rect(x, 3, 1, 21, ST[2]); b.set(x + 1, 3, ST[0]); b.rect(x + 1, 4, 1, 20, ST[0]);
      b.set(x, 1, ST[2]); b.rect(x, 2, 2, 1, ST[2]);                      // spear tip
    }
    for (const y of [6, 17]) { b.hline(0, y, 16, ST[2]); b.hline(0, y + 1, 16, ST[1]); b.hline(0, y + 2, 16, ST[0]); }
    b.outline(O);
    for (const y of [6, 17]) b.hline(0, y, 16, ST[2]);
  };
  // Boulder of Manhattan schist, 32x16, flat at the bottom. Facets, a crack, a bit of moss on top.
  GEN['scenery:rock'] = (b) => {
    const R2 = [K.stone, K.stoneMid, K.stoneLight, K.slateHi];
    b.ell(16, 11, 15.5, 8, lit(R2, 0.05)); b.ell(9, 9, 8, 6.5, lit(R2, 0.1)); b.ell(23, 10, 9, 7, lit(R2, 0));
    for (let y = 0; y < 16; y++) for (let x = 0; x < 32; x++) if (y > 13 && b.get(x, y)) b.set(x, y, (x + y) & 1 ? R2[0] : R2[1]);
    for (let i = 0; i < 7; i++) { b.set(14 + i, 3 + i, R2[0]); }          // crack
    b.line(21, 8, 26, 12, 1, R2[0]); b.line(5, 9, 8, 13, 1, R2[0]);
    for (let x = 6; x < 24; x++) {                                       // moss along the top edge
      let y = 0; while (y < 16 && !b.get(x, y)) y++;
      if (y < 16 && hash(x * 5) > 0.5) { b.set(x, y, K.grassLo); b.set(x, y + 1, (x & 1) ? K.grass : K.grassLo); }
    }
    b.outline(O);
  };
  // Wire-basket litter bin, 16x24, with a lid and a tiny glint.
  GEN['scenery:trashcan'] = (b) => {
    const CN = [K.bushes, K.canMid, K.grassHi];
    b.ell(8, 5.5, 6.5, 3.5, lit([K.stone, K.stoneMid, K.stoneLight], 0.1)); b.rect(6, 0, 4, 2, ST[2]);    // lid and handle
    for (let y = 6; y < 24; y++) { const half = 5 + (y > 12 ? 1 : 0); b.rect(8 - half, y, half * 2, 1, CN[1]); b.set(8 - half, y, CN[2]); b.set(8 - half + 1, y, CN[2]); b.set(8 + half - 1, y, CN[0]); b.set(8 + half - 2, y, CN[0]); }
    for (const y of [10, 15, 20]) b.hline(2, y, 12, CN[0]);
    b.hline(3, 23, 10, CN[0]);
    b.outline(O);
  };
  // Puddle, 32x8, lying flat. Two frames: the glints move. Moon streak in the middle.
  GEN['scenery:puddle'] = (b, f) => {
    b.ell(16, 3.5, 15.5, 3.5, (dx, dy, x, y) => (dy > 0.45 ? K.waterMid : dy < -0.5 ? K.stone : K.water));
    for (let y = 1; y < 6; y++) if (y & 1) b.set(11 + (y >> 1), y, K.waterHi);      // moon streak
    b.dither(6, 2, 20, 3, K.waterMid, 0, true);
    const g = f ? [[11, 2], [23, 3], [6, 4]] : [[8, 3], [20, 4], [26, 2]];
    for (const [x, y] of g) b.set(x, y, K.foam);
    b.hline(4, 6, 24, K.stone);
  };

  // Foreground leaves: 320x64, two frames. A few autumn leaves (2-3 px) turning over as they fall.
  GEN['scenery:leaves-fg'] = (b, f) => {
    const cols = [K.leaf0, K.leaf1, K.leaf2, K.leaf1];
    for (let i = 0; i < 16; i++) {
      const x = 6 + Math.floor(hash(i * 11 + 3) * 308), y = 2 + Math.floor(hash(i * 11 + 5) * 56) + f * 3, c = cols[i & 3];
      if ((i + f) & 1) { b.rect(x, y, 2, 1, c); b.set(x + 2, y + 1, c); b.set(x, y - 1, K.leaf3); }
      else { b.set(x, y, c); b.rect(x + 1, y + 1, 2, 1, c); b.set(x + 1, y, K.leaf3); }
    }
  };

  // ---------- Bethesda Terrace pieces ----------
  // Arcade wall with one arch, 64x80: stone blocks, a lit arch ring and keystone, a dark opening with warm light inside.
  GEN['scenery:bethesda-arch'] = (b) => {
    b.rect(0, 0, 64, 80, K.stoneMid);
    for (let c = 0; c < 10; c++) {                                  // block courses, 8 rows each, staggered joints
      const y0 = c * 8; b.hline(0, y0 + 7, 64, K.stone);
      for (let x = (c & 1) * 8; x < 64; x += 16) for (let y = y0; y < y0 + 7; y++) b.set(x, y, K.stone);
      for (let x = (c & 1) * 8 + 1; x < 64; x += 16) b.hline(x, y0, 15, hash(x + c * 31) > 0.5 ? K.stoneLight : K.stoneMid);
    }
    b.rect(0, 0, 3, 80, K.stoneLight); b.rect(3, 0, 1, 80, K.stone); b.rect(60, 0, 4, 80, K.stone); b.rect(59, 0, 1, 80, K.stoneMid); // pilasters
    b.hline(0, 0, 64, K.slateHi);
    const cx = 32, r = 19, spring = 34;
    for (let y = 8; y < 80; y++) for (let x = 8; x < 56; x++) {      // ring: voussoirs lit on the left
      const dy = y < spring ? spring - y : 0, d = Math.sqrt((x + 0.5 - cx) * (x + 0.5 - cx) + dy * dy);
      if (d >= r && d < r + 3 && (y < spring || Math.abs(x + 0.5 - cx) < r + 3 && y < spring)) b.set(x, y, x < cx ? K.slateHi : K.stoneLight);
      else if (d >= r + 3 && d < r + 4 && y < spring) b.set(x, y, K.stone);
    }
    for (let y = 8; y < spring; y++) for (let x = 8; x < 56; x++) { // radial joints in the ring
      const ang = Math.atan2(spring - y, x + 0.5 - cx), d = Math.hypot(x + 0.5 - cx, spring - y);
      if (d >= r && d < r + 3 && Math.abs(((ang * 8 / Math.PI) % 1 + 1) % 1 - 0.5) < 0.08) b.set(x, y, K.stone);
    }
    b.rect(13, spring, 38, 46, O);                                   // opening, with a rounded top
    b.ell(cx, spring, r, r, (dx, dy, x, y) => (y < spring ? O : null));
    // inside: a dark passage with a far wall, two lit lanterns with dithered halos, and warm light on the floor
    b.rect(19, 38, 26, 42, K.stone); b.dither(19, 38, 26, 42, O, 0);
    b.rect(19, 38, 2, 42, O); b.rect(43, 38, 2, 42, O);
    for (const lx of [24, 40]) {
      for (let y = 38; y < 62; y++) for (let x = lx - 9; x <= lx + 9; x++) {
        const d = Math.hypot(x - lx, (y - 46) * 1.2);
        if (b.get(x, y) && x > 14 && x < 49 && (d < 4 ? (x + y) & 1 : d < 8 ? ((x + y) & 1) && (y & 1) : d < 11 && (x & 3) === 0 && (y & 3) === 2)) b.set(x, y, d < 4 ? K.lampGlow : d < 8 ? K.lampHalo : K.lampDeep);
      }
      b.rect(lx - 1, 44, 3, 4, K.lamp); b.set(lx, 45, K.moon); b.rect(lx, 40, 1, 4, K.stoneMid);
    }
    b.dither(14, 68, 36, 12, K.lampDeep, 0, true); b.dither(18, 74, 28, 6, K.lampHalo, 1, true);
    b.hline(13, 79, 38, K.lampDeep);
    b.rect(28, 11, 8, 7, K.stoneLight); b.hline(28, 11, 8, K.slateHi); b.rect(28, 17, 8, 1, K.stone); b.rect(28, 11, 1, 7, K.stone); b.rect(35, 11, 1, 7, K.stone); // keystone
    b.rect(0, 72, 64, 8, K.stone); b.hline(0, 72, 64, K.stoneLight); b.dither(0, 73, 64, 1, K.stoneMid, 0); // plinth
  };
  // Four steps seen from the front, 64x32. Each tread catches the moon, each riser is in shade.
  GEN['scenery:bethesda-stairs'] = (b) => {
    for (let i = 0; i < 4; i++) {
      const y0 = 24 - i * 8, w = 64 - i * 8, x0 = i * 4;
      b.rect(x0, y0, w, 8, K.stoneMid);
      b.hline(x0, y0, w, K.slateHi); b.hline(x0, y0 + 1, w, K.stoneLight);
      b.rect(x0, y0 + 2, 2, 6, K.stoneLight);
      b.dither(x0, y0 + 6, w, 2, K.stone, 0);
      b.hline(x0, y0 + 7, w, K.stone);
      for (let x = x0 + 12; x < x0 + w - 4; x += 20) b.rect(x, y0 + 3, 1, 3, K.stone);
    }
    b.outline(O);
  };
  // Balustrade, 32x24, repeats every 32 px: cap rail, four vase balusters, base rail.
  GEN['scenery:bethesda-balustrade'] = (b) => {
    b.hline(0, 0, 32, ST[3]); b.hline(0, 1, 32, ST[2]); b.rect(0, 2, 32, 2, ST[1]); b.hline(0, 4, 32, ST[0]);
    b.hline(0, 19, 32, ST[2]); b.rect(0, 20, 32, 2, ST[1]); b.rect(0, 22, 32, 2, ST[0]);
    const prof = [2, 3, 3, 1, 1, 2, 3, 3, 2, 1, 1, 2, 2, 2];       // half widths, rows 5..18
    for (const cx of [4, 12, 20, 28]) prof.forEach((hw, i) => {
      b.rect(cx - hw, 5 + i, hw * 2, 1, ST[1]); b.set(cx - hw, 5 + i, ST[2]); b.set(cx + hw - 1, 5 + i, ST[0]);
    });
    b.outline(O);
    b.hline(0, 0, 32, ST[3]);
  };
  // The Angel of the Waters, 48x64: stone angel on a plinth, wings spread, one arm raised. Moon catches every upper-left edge.
  GEN['scenery:bethesda-angel'] = (b) => {
    // wings behind the body: fans of feathers from the shoulders
    const tipsL = [[5, 4], [1, 11], [0, 19], [2, 27], [7, 34], [13, 38]];
    for (const [tx, ty] of tipsL) for (const side of [0, 1]) {
      const sx = side ? 29 : 19, x1 = side ? 47 - tx : tx;
      b.line(sx, 25, x1, ty, 4, ST[1]);
    }
    for (const [tx, ty] of tipsL) { b.line(19, 25, tx + 1, ty + 1, 1, ST[2]); b.line(29, 25, 46 - tx, ty + 1, 1, ST[2]); }
    for (const [tx, ty] of tipsL) { b.set(tx + 1, ty + 3, ST[0]); b.set(46 - tx, ty + 3, ST[0]); }   // dark feather tips
    b.ell(14, 28, 6, 8, lit(ST, 0)); b.ell(33, 28, 6, 8, lit(ST, -0.1));                            // shoulder coverts
    // plinth
    b.rect(10, 58, 28, 6, ST[1]); b.hline(11, 57, 26, ST[2]); b.hline(10, 58, 28, ST[3]); b.rect(10, 62, 28, 2, ST[0]);
    // robe: narrow shoulders flaring to the hem, folds as dark lines
    for (let y = 22; y < 58; y++) {
      const half = Math.round(4 + (y - 22) * 5.5 / 35), x0 = 24 - half;
      b.rect(x0, y, half * 2, 1, ST[1]); b.set(x0, y, ST[2]); b.set(x0 + 1, y, ST[2]); b.set(x0 + half * 2 - 1, y, ST[0]);
      if (y > 34) for (const fx of [-3, 1, 5]) if (hash(y + fx * 7) > 0.18) b.set(24 + fx, y, ST[0]);
    }
    b.hline(15, 56, 18, ST[0]);
    // arms: right one raised, left one low
    b.line(28, 25, 36, 11, 3, ST[2]); b.line(20, 26, 17, 40, 3, ST[1]);
    b.rect(35, 7, 3, 4, ST[3]); b.set(36, 5, K.moon); b.set(36, 6, K.moon);                           // hand with a lily
    b.rect(15, 40, 3, 3, ST[2]);
    // head and hair
    b.ell(24, 17, 4, 4.5, lit(ST, 0.1)); b.rect(20, 14, 9, 2, ST[0]); b.rect(20, 14, 2, 8, ST[0]); b.set(21, 15, ST[1]);
    b.rim(ST);
    b.outline(O);
  };
  // Fountain, 128x96, three frames: a wide basin, two tiers, a pedestal on top (row 32 is where the angel stands),
  // and water falling from tier to tier. Each frame moves the water 2 px, so three frames loop.
  GEN['scenery:bethesda-fountain'] = (b, f) => {
    // lower basin: back lip, pool, front lip, fluted wall
    b.rect(2, 74, 124, 2, ST[1]); b.hline(2, 74, 124, ST[2]);
    b.rect(4, 76, 120, 4, K.water); b.dither(4, 76, 120, 2, K.waterMid, 0);
    b.rect(0, 80, 128, 3, ST[2]); b.hline(0, 80, 128, ST[3]); b.hline(0, 82, 128, ST[1]);
    b.rect(0, 83, 128, 13, ST[1]); b.rect(0, 83, 3, 13, ST[2]); b.rect(125, 83, 3, 13, ST[0]);
    for (let x = 6; x < 124; x += 8) { b.rect(x, 86, 1, 7, ST[0]); b.rect(x + 1, 86, 1, 7, ST[2]); }
    b.rect(0, 94, 128, 2, ST[0]); b.hline(0, 94, 128, ST[1]);
    b.dither(0, 90, 128, 4, ST[0], 0, true);
    // pedestal rising from the pool, then a thick stem with rings
    b.rect(46, 66, 36, 10, ST[1]); b.hline(46, 66, 36, ST[3]); b.rect(46, 67, 3, 9, ST[2]); b.rect(79, 67, 3, 9, ST[0]);
    b.rect(54, 58, 20, 8, ST[1]); b.rect(54, 58, 3, 8, ST[2]); b.rect(71, 58, 3, 8, ST[0]);
    for (const y of [60, 63]) b.rect(52, y, 24, 1, ST[2]);
    // tier 2: wide bowl. back lip, water, rim, curved underside
    b.rect(26, 46, 76, 1, ST[1]); b.rect(29, 47, 70, 3, K.water); b.dither(29, 47, 70, 1, K.waterMid, 0);
    b.rect(24, 50, 80, 1, ST[3]); b.rect(24, 51, 80, 2, ST[2]);
    [[25, 102], [26, 101], [28, 99], [31, 96], [35, 92], [41, 86], [48, 79]].forEach(([a, z], i) => { b.rect(a, 53 + i, z - a + 1, 1, ST[1]); b.set(a, 53 + i, ST[2]); b.set(z, 53 + i, ST[0]); });
    b.dither(30, 55, 68, 4, ST[0], 0, true);
    // tier 3: a smaller bowl on a thinner stem, and the pedestal the angel stands on (row 29)
    b.rect(60, 38, 8, 20, ST[1]); b.rect(60, 38, 2, 20, ST[2]); b.rect(66, 38, 2, 20, ST[0]); b.rect(58, 54, 12, 2, ST[2]);
    b.rect(46, 32, 36, 1, ST[1]); b.rect(48, 33, 32, 2, K.water); b.dither(48, 33, 32, 1, K.waterMid, 0);
    b.rect(45, 35, 38, 1, ST[3]); b.rect(45, 36, 38, 2, ST[2]);
    [[46, 81], [48, 79], [51, 76], [55, 72]].forEach(([a, z], i) => { b.rect(a, 38 + i, z - a + 1, 1, ST[1]); b.set(a, 38 + i, ST[2]); b.set(z, 38 + i, ST[0]); });
    b.rect(56, 29, 16, 3, ST[1]); b.hline(56, 29, 16, ST[3]); b.rect(58, 32, 12, 3, ST[0]);
    b.rim(ST);
    b.outline(O);
    // falling water: curtains over each lip, dashed, moving down 2 px per frame so three frames loop
    const fall = (x, y0, y1, ph) => { for (let y = y0; y < y1; y++) if ((y + f * 2 + ph) % 6 < 4) b.set(x, y, ((y + ph) & 3) ? K.waterHi : K.foam); };
    for (let x = 47; x <= 80; x += 3) fall(x, 40 + (x < 52 ? 2 : x > 75 ? 2 : 0), 46, x);
    for (let x = 27; x <= 100; x += 3) fall(x, 56 + (x < 36 ? 2 : x > 91 ? 2 : 0), 76, x * 2);
    for (let x = 29; x <= 98; x += 3) { b.set(x + ((f + x) % 3) - 1, 74 + ((x + f) & 1), K.foam); b.set(x + 1, 76, K.waterHi); }   // splash
    for (let i = 0; i < 9; i++) b.set(8 + ((i * 13 + f * 5) % 112), 77 + (i & 1), K.foam);                                     // ripples in the pool
    for (let i = 0; i < 6; i++) b.set(32 + ((i * 11 + f * 4) % 64), 48, K.foam);
  };

  // ---------- turning the pieces into canvases ----------
  const cache = {};
  const manifestFor = {};
  for (const m of S.ASSET_MANIFEST) if (m.key.startsWith('scenery:')) manifestFor[m.key] = m;
  function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  // The picture to stamp for a scenery key: the real art when it loaded, else the coded placeholder. Null where there is no canvas.
  function piece(key) {
    const real = S.images[key];
    if (real) return real;
    if (!hasDom || !GEN[key]) return null;
    if (!cache[key]) {
      const m = manifestFor[key], cv = makeCanvas(m.fw * m.frames, m.fh), g = cv.getContext('2d');
      for (let f = 0; f < m.frames; f++) { const b = new Buf(m.fw, m.fh); GEN[key](b, f); b.flush(g, f * m.fw, 0); }
      cache[key] = Object.assign({ img: cv, placeholder: true }, m);
    }
    return cache[key];
  }
  S.sceneryPiece = piece;
  S.sceneryPlaceholderKeys = () => Object.keys(GEN);
  // Stamp frame f of a piece with its pivot at (x, y). Feet pieces: the pivot row sits just above y, like sprites.
  function blit(ctx, key, f, x, y, clipX0, clipX1) {
    const m = piece(key);
    if (!m) return false;
    if (!m.placeholder) (S.spriteDraws = S.spriteDraws || {})[key] = (S.spriteDraws[key] || 0) + 1;
    const dx = Math.round(x) - m.px, dy = Math.round(y) - m.py - (m.feet ? 1 : 0);
    const a = clipX0 == null ? 0 : Math.max(0, clipX0 - dx), z = clipX1 == null ? m.fw : Math.min(m.fw, clipX1 - dx);
    if (z <= a) return true;
    ctx.drawImage(m.img, Math.min(f, m.frames - 1) * m.fw + a, 0, z - a, m.fh, dx + a, dy, z - a, m.fh);
    return true;
  }
  S.blitScenery = blit;
  const pickFrame = (key, v) => { const m = manifestFor[key]; return m ? (v || 0) % m.frames : 0; };
  const animFrame = (key, t) => { const m = manifestFor[key]; return Math.floor(t * m.fps) % m.frames; };

  // ---------- the three background bands (placeholders for bg:skyline, bg:treeline, bg:bushes) ----------
  const bands = {};
  const BANDS = {
    'bg:skyline': (b) => {
      const sky = K.skyline;
      for (let i = 0; i < 16; i++) {
        const bw = 16 + Math.floor(hash(i + 7) * 20), bh = 16 + Math.floor(hash(i + 31) * 40), bx = i * 32 + Math.floor(hash(i + 90) * 8), y = 64 - bh;
        b.rect(bx, y, bw, bh, sky);
        b.rect(bx, y, 1, bh, K.stone);                                    // moon-side edge
        if (hash(i + 3) > 0.6) b.rect(bx + (bw >> 1) - 1, y - 8, 2, 8, sky);
        if (hash(i + 13) > 0.5) b.rect(bx + 2, y - 2, bw - 4, 2, sky);    // roof step
        for (let wy = y + 4; wy < 60; wy += 5) for (let wx = bx + 3; wx < bx + bw - 3; wx += 4) if (hash(wx * 7 + wy * 13 + i) > 0.82) b.rect(wx, wy, 2, 2, K.window);
      }
    },
    // Two rows of canopy: a dark back row with a few trunks showing, a lighter front row, moonlit tops, a few rust clumps.
    'bg:treeline': (b) => {
      b.rect(0, 16, 512, 16, K.trees);
      const blob = (cx, cy, rx, ry, ramp, bias) => { for (const o of [-512, 0, 512]) b.ell(cx + o, cy, rx, ry, lit(ramp, bias)); };
      for (let i = 0; i < 24; i++) {                                   // trunks between the canopies
        const x = Math.floor(i * 21.3 + hash(i + 200) * 8);
        b.rect(x, 20, 2, 12, O); b.set(x, 21, K.stone);
      }
      for (let i = 0; i < 26; i++) blob(i * 19.7 + hash(i + 41) * 7, 17, 8 + hash(i + 77) * 7, 8 + hash(i + 12) * 6, [K.arch, K.trees, K.trees, K.grassLo], -0.1);
      for (let i = 0; i < 30; i++) blob(i * 17.1 + 6 + hash(i + 9) * 6, 25, 7 + hash(i + 5) * 5, 7 + hash(i + 19) * 4, FOL.slice(0, 4), -0.12);
      for (let i = 0; i < 7; i++) { const x = Math.floor(hash(i * 5 + 601) * 500); b.ell(x, 12 + Math.floor(hash(i + 650) * 5), 4, 3, lit(RUST, -0.35)); }
      b.speckle(FOL, 733, 150, true);
      b.rect(0, 28, 512, 4, K.trees);
      b.dither(0, 26, 512, 2, K.trees, 0, true);
    },
    // Near bushes, only the top 16 rows show: round shrubs with leaf texture and a few autumn leaves, solid underneath.
    'bg:bushes': (b) => {
      b.rect(0, 0, 512, 32, K.trees);
      const blob = (cx, cy, rx, ry, ramp, bias) => { for (const o of [-512, 0, 512]) b.ell(cx + o, cy, rx, ry, lit(ramp, bias)); };
      for (let i = 0; i < 30; i++) blob(i * 17.3 + hash(i + 3) * 6, 14, 7 + hash(i + 8) * 6, 6 + hash(i + 14) * 6, FOL.slice(0, 4), -0.12);
      for (let i = 0; i < 26; i++) blob(i * 19.9 + 9 + hash(i + 4) * 6, 17, 6 + hash(i + 28) * 5, 5 + hash(i + 21) * 4, FOL.slice(0, 4), -0.08);
      b.speckle(FOL.slice(0, 4), 911, 220, true);
      for (let i = 0; i < 40; i++) {
        const x = Math.floor(hash(i + 810) * 512), y = 4 + Math.floor(hash(i + 850) * 12);
        if (b.get(x, y)) b.set(x, y, [K.leaf0, K.leaf1, K.leaf2][i % 3]);
      }
      b.rect(0, 18, 512, 14, K.trees); b.dither(0, 16, 512, 2, K.trees, 0, true);
    },
  };
  S.sceneryBand = function (key) {
    if (!hasDom || !BANDS[key]) return null;
    if (!bands[key]) {
      const m = manifestFor[key] || S.ASSET_MANIFEST.find((a) => a.key === key), cv = makeCanvas(m.fw, m.fh), b = new Buf(m.fw, m.fh);
      BANDS[key](b); b.flush(cv.getContext('2d'), 0, 0);
      bands[key] = cv;
    }
    return bands[key];
  };

  // ---------- drawing into the world ----------
  // The little blades of grass that stand up above the ground line (placeholder only; real tiles carry their own).
  let fringe = null;
  function fringeCanvas() {
    if (!hasDom) return null;
    if (!fringe) {
      fringe = makeCanvas(32, 3);
      const b = new Buf(32, 3);
      for (let x = 0; x < 32; x++) {
        const h = hash(x * 13 + 5);
        if (h > 0.45) { b.set(x, 2, (x & 1) ? K.grass : K.grassHi); if (h > 0.75) b.set(x, 1, K.grassHi); if (h > 0.93) b.set(x, 0, K.grassHi); }
      }
      b.flush(fringe.getContext('2d'), 0, 0);
    }
    return fringe;
  }
  // Ground tiles for [x0, x1): kind = 'park' | 'path' | 'terrace'. Tiles are 16 px wide, picked by position so the pattern never repeats evenly.
  S.drawGroundRun = function (ctx, kind, x0, x1) {
    const key = 'scenery:ground-' + kind;
    for (let x = Math.floor(x0 / 16) * 16; x < x1; x += 16) {
      const v = hash((x >> 4) * 7 + (kind === 'path' ? 3 : kind === 'terrace' ? 5 : 1)) > 0.5 ? 1 : 0;
      blit(ctx, key, v, x, G, x0, x1);
    }
    const real = S.images[key];
    if (kind === 'park' && !real) {
      const fr = fringeCanvas();
      if (fr) for (let x = Math.floor(x0 / 32) * 32; x < x1; x += 32) {
        const a = Math.max(0, x0 - x), z = Math.min(32, x1 - x);
        if (z > a) ctx.drawImage(fr, a, 0, z - a, 3, x + a, G - 3, z - a, 3);
      }
    }
  };

  // Warm reflection streaks of a lamp on wet ground: short vertical dithered bars below its base.
  function lampReflection(ctx, lx) {
    for (let i = -2; i <= 2; i++) for (let y = G + 3; y < G + 30 - Math.abs(i) * 8; y += 2) {
      ctx.fillStyle = i ? K.lampHalo : K.lampGlow; ctx.fillRect(Math.round(lx) + i * 3 + ((y >> 1) & 1), y, i ? 1 : 2, 1);
    }
  }
  // Terrace lamp light on the flagstones: a warm dithered pool plus a short bright streak.
  function terracePool(ctx, lx) {
    for (let y = G + 1; y < G + 13; y++) for (let x = -26; x <= 26; x++) {
      const d = Math.hypot(x / 26, (y - G - 5) / 7), px = lx + x;
      if (d < 0.5 ? (px + y) & 1 : d < 1 && ((px + y) & 3) === 0 && (y & 1)) { ctx.fillStyle = d < 0.5 ? K.lampHalo : K.lampDeep; ctx.fillRect(px, y, 1, 1); }
    }
    for (let y = G + 2; y < G + 26; y += 2) { ctx.fillStyle = K.lampGlow; ctx.fillRect(lx + ((y >> 1) & 1), y, 1, 1); }
  }
  S.drawGroundDecor = function (ctx, s, x0, x1) {
    const list = s.level.scenery || [];
    for (const p of list) if (p.type === 'path') {
      const a = Math.max(p.x0, x0), z = Math.min(p.x1, x1);
      if (a < z) S.drawGroundRun(ctx, 'path', a, z);
    }
    const t = s.t || 0;
    for (const p of list) {
      if (p.x < x0 - 40 || p.x > x1 + 40) continue;
      if (p.type === 'puddle') blit(ctx, 'scenery:puddle', animFrame('scenery:puddle', t + p.x * 0.01), p.x, G);
      else if (p.type === 'lamp' && !p.terrace) lampReflection(ctx, p.x);
      else if (p.type === 'lamp' && p.terrace) terracePool(ctx, p.x);
    }
  };

  // Layers: 'back' (everything behind the characters, incl. the near trees), 'front' (in front of them: drifting leaves only).
  const BACK_ORDER = ['tree-far', 'arch', 'lamp', 'balustrade', 'rock', 'fence', 'bench', 'trashcan', 'fountain', 'angel', 'stairs'];
  const TILED = { fence: ['scenery:fence', 16], balustrade: ['scenery:bethesda-balustrade', 32] };
  const KEYS = { 'tree-far': 'scenery:tree-far', arch: 'scenery:bethesda-arch', rock: 'scenery:rock', bench: 'scenery:bench', trashcan: 'scenery:trashcan',
    lamp: 'scenery:lamp', fountain: 'scenery:bethesda-fountain', angel: 'scenery:bethesda-angel', stairs: 'scenery:bethesda-stairs' };
  S.drawScenery = function (ctx, s, layer, camX) {
    const list = s.level.scenery;
    if (!list) return;
    const t = s.t || 0, lo = camX - 80, hi = camX + W + 80;
    if (layer === 'back') {
      for (const type of BACK_ORDER) {
        for (const p of list) {
          if (p.type !== type || p.x < lo - 40 || p.x > hi + 40) continue;
          const y = p.y == null ? G : p.y;
          if (TILED[type]) {
            const [key, fw] = TILED[type], n = p.run || 1;
            for (let i = 0; i < n; i++) blit(ctx, key, 0, p.x + (i - (n - 1) / 2) * fw, y);
          } else if (type === 'lamp') {
            blit(ctx, 'scenery:lamp-glow', 0, p.x, y - 39);
            blit(ctx, 'scenery:lamp', 0, p.x, y);
          } else if (type === 'fountain') blit(ctx, KEYS[type], animFrame(KEYS[type], t), p.x, y);
          else blit(ctx, KEYS[type], pickFrame(KEYS[type], p.v), p.x, y);
        }
      }
      // Near trees slide past a little faster than the camera for depth, but stay BEHIND the characters: a trunk must never hide Sammy.
      for (const p of list) if (p.type === 'tree-near') {
        const sx = 160 + (p.x - camX - 160) * 1.15;
        if (sx < -60 || sx > W + 60) continue;
        blit(ctx, 'scenery:tree-near', pickFrame('scenery:tree-near', p.v), camX + sx, p.y == null ? G : p.y);
      }
    } else if (layer === 'front') {
      const m = manifestFor['scenery:leaves-fg'];
      if (m) {
        const f = animFrame('scenery:leaves-fg', t), off = ((camX * m.scroll + t * 9) % m.fw + m.fw) % m.fw;
        for (let ox = -off; ox < W; ox += m.fw) blit(ctx, 'scenery:leaves-fg', f, camX + Math.round(ox), m.y);
      }
    }
  };
})(globalThis.SAMMY = globalThis.SAMMY || {});
