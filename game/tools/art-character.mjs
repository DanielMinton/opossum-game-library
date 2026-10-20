// Character mode of the art importer: builds ALL the strips of one character from one sheet in a single run.
//   node tools/import-art.mjs sheet.png --detect          (finds the frames, writes map.json + detect-overlay.png)
//   node tools/import-art.mjs --character map.json        (builds every strip with one shared scale, anchor and palette)
// What it does, in order: cuts each frame out (leaving neighbours' pieces behind), tidies the colours (saturation, hue shifts, the
// "keep away from the game's gore colours" rule), builds ONE palette from all frames, flattens each frame to those colours, shrinks it
// with an area average at one shared scale, snaps to the palette, smooths lightly, removes specks and far-off particles, and adds a
// 1 px outline. Same input -> same bytes. No packages needed (Node 18+).
import path from 'node:path';
import { labelPieces, foregroundMask, sheetBackground, autoTolerance, median, hexOf } from './art-detect.mjs';
import {
  snap9, luma, hex6, parseHex6, makeTransform, makeHistogram, kmeans, finishPalette, ensureColour, keepClearOf, nudgeOffReserved, nearestIndex,
} from './art-colour.mjs';
import { stripPreview, compareImage, contactSheet, swatchImage, toPng, pickScale } from './art-preview.mjs';

const fmt = (n) => Math.round(n).toLocaleString('en-US');
const LOOPING = /^(walk|run|idle|rev)/;

// ---------- the map ----------
export function resolveSlots(map, opts, manifest) {
  const defs = [], problems = [];
  const slotMap = Object.assign({}, map.slotMap || {});
  const prefix = opts.prefix || map.prefix || null;
  const sizeOpt = opts.size ? /^(\d+)x(\d+)$/.exec(opts.size) : null;
  if (opts.size && !sizeOpt) throw new Error('--size must look like 48x48');
  for (const [mapKey, def] of Object.entries(map.slots || {})) {
    const anim = mapKey.split(':').slice(1).join(':') || mapKey;
    let key = slotMap[mapKey] || mapKey;
    if (prefix && !slotMap[mapKey]) key = `${prefix}:${anim}`;
    const m = manifest[key] || null;
    const entries = [];
    for (const f of def.frames || []) {
      const b = f.box;
      if (!Array.isArray(b) || b.length !== 4 || b.some((v) => !Number.isFinite(+v))) throw new Error(`${mapKey}: every frame needs "box": [x, y, width, height]`);
      const hold = Math.max(1, Math.round(+(f.hold || f.repeat || 1)));
      for (let i = 0; i < hold; i++) entries.push({ box: b.map(Math.round), flip: !!f.flip !== !!opts.flip });
    }
    if (!entries.length) throw new Error(`${mapKey}: no frames listed`);
    const cell = def.cell || (m ? [m.fw, m.fh] : sizeOpt ? [+sizeOpt[1], +sizeOpt[2]] : map.cell || [48, 48]);
    const [fw, fh] = cell.map(Math.round);
    if (!(fw >= 8 && fh >= 8 && fw <= 192 && fh <= 192)) throw new Error(`${mapKey}: the cell must be between 8x8 and 192x192`);
    const feet = def.feet != null ? !!def.feet : m ? !!m.feet : opts.noFeet ? false : map.feet != null ? !!map.feet : true;
    const pivot = def.pivot || (m && !def.cell ? [m.px, m.py] : feet ? [fw >> 1, fh - 1] : [0, 0]);
    const slot = {
      key, mapKey, anim, fw, fh, frames: entries.length, px: pivot[0], py: pivot[1], feet,
      fps: def.fps != null ? def.fps : m ? m.fps : 8, loop: def.loop || (m ? m.loop : LOOPING.test(anim) ? 'loop' : 'once'),
      path: m && m.path ? m.path : null, inManifest: !!m,
    };
    const ns = prefix || key.split(':')[0];
    slot.fileName = m && m.path ? path.posix.basename(m.path) : `${ns}-${anim.replace(/[^a-z0-9]+/gi, '-')}-strip-v01.png`;
    if (m && m.frames !== entries.length) problems.push(`${mapKey}: the game slot ${key} needs ${m.frames} frame(s) but the map lists ${entries.length}`);
    if (m && (m.fw !== fw || m.fh !== fh)) problems.push(`${mapKey}: the game slot ${key} is ${m.fw} x ${m.fh} per frame but the map says ${fw} x ${fh}`);
    defs.push({ slot, entries, def, group: def.palette || 'main', problemsSlot: problems.filter((p) => p.startsWith(mapKey + ':')) });
  }
  if (!defs.length) throw new Error('the map has no "slots"');
  return { defs, problems };
}

// ---------- cutting frames out ----------
function boxCounts(sheet, box) { // how many pixels of each sheet piece lie inside a box
  if (!sheet.bc) sheet.bc = new Map();
  const k = box.join(',');
  let m = sheet.bc.get(k);
  if (m) return m;
  m = new Map();
  const [bx, by, bw, bh] = box;
  for (let y = Math.max(0, by); y < Math.min(sheet.h, by + bh); y++) for (let x = Math.max(0, bx); x < Math.min(sheet.w, bx + bw); x++) {
    const l = sheet.labels[y * sheet.w + x]; if (l) m.set(l, (m.get(l) || 0) + 1);
  }
  sheet.bc.set(k, m);
  return m;
}
const inside = (b, x, y) => x >= b[0] && y >= b[1] && x < b[0] + b[2] && y < b[1] + b[3];
// A pixel inside only this frame's box belongs to the frame. Where boxes overlap (frames whose arms or tails reach into the next box),
// the pixel goes to the box that holds most of the piece it is part of, so neighbours' pieces are left behind.
function cropFrame(sheet, box, flip, allBoxes) {
  const [bx, by, bw, bh] = box, W = sheet.w, H = sheet.h;
  const others = allBoxes.filter((o) => o !== box && o.join() !== box.join() && o[0] < bx + bw && o[0] + o[2] > bx && o[1] < by + bh && o[1] + o[3] > by);
  const mine = boxCounts(sheet, box), share = (b, l) => (boxCounts(sheet, b).get(l) || 0) / sheet.comps[l - 1].area;
  const d = new Uint8Array(bw * bh * 4);
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    const sx = bx + x, sy = by + y;
    if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue;
    const l = sheet.labels[sy * W + sx];
    if (!l) continue;
    let ok = true;
    if (others.length) {
      const rivals = others.filter((o) => inside(o, sx, sy));
      if (rivals.length) {
        const me = share(box, l);
        for (const o of rivals) {
          const th = share(o, l);
          if (th > me + 1e-9 || (Math.abs(th - me) <= 1e-9 && Math.abs(o[0] + o[2] / 2 - sx) < Math.abs(bx + bw / 2 - sx))) { ok = false; break; }
        }
      }
    }
    if (!ok) continue;
    const tx = flip ? bw - 1 - x : x, o = (y * bw + tx) * 4, si = (sy * W + sx) * 4;
    d[o] = sheet.d[si]; d[o + 1] = sheet.d[si + 1]; d[o + 2] = sheet.d[si + 2]; d[o + 3] = 255;
  }
  void mine;
  return { w: bw, h: bh, d, box, flip };
}

// Pieces inside a frame; the "main" ones (the body, big limbs) versus detached bits (sparks, slime flecks).
function analyseFrame(f) {
  const { w, h, d } = f, mask = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) mask[p] = d[p * 4 + 3] ? 1 : 0;
  const { labels, comps } = labelPieces(mask, w, h);
  const largest = comps.reduce((a, c) => Math.max(a, c.area), 0);
  for (const c of comps) c.main = c.area >= largest * 0.06;
  f.mask = mask; f.labels = labels; f.comps = comps;
  const mains = comps.filter((c) => c.main);
  f.body = mains.length ? { x0: Math.min(...mains.map((c) => c.x0)), y0: Math.min(...mains.map((c) => c.y0)), x1: Math.max(...mains.map((c) => c.x1)), y1: Math.max(...mains.map((c) => c.y1)) } : null;
  f.all = comps.length ? { x0: Math.min(...comps.map((c) => c.x0)), y0: Math.min(...comps.map((c) => c.y0)), x1: Math.max(...comps.map((c) => c.x1)), y1: Math.max(...comps.map((c) => c.y1)) } : null;
  f.area = comps.reduce((a, c) => a + c.area, 0);
  // feet column: where the legs and hips are (lowest 45% of the body), so a walking figure stays put while the arms swing
  if (f.body) {
    const bh = f.body.y1 - f.body.y0, from = f.body.y1 - Math.max(2, Math.round(bh * 0.45));
    let sx = 0, n = 0, tx = 0, tn = 0;
    const topTo = f.body.y0 + Math.round(bh * 0.4);
    for (let y = f.body.y0; y < f.body.y1; y++) for (let x = f.body.x0; x < f.body.x1; x++) {
      const l = labels[y * w + x];
      if (!l || !comps[l - 1].main) continue;
      if (y >= from) { sx += x + 0.5; n++; }
      if (y < topTo) { tx += x + 0.5; tn++; }
    }
    f.ax = n ? sx / n : (f.body.x0 + f.body.x1) / 2;
    f.topX = tn ? tx / tn : f.ax;
  }
  return f;
}

// ---------- colour clean-up for one palette group ----------
function modePass(idx, w, h) {
  const out = Int8Array.from(idx), cnt = new Int8Array(16);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    if (idx[i] < 0) continue;
    cnt.fill(0);
    let bc = idx[i], bn = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const c = idx[i + dy * w + dx]; if (c < 0) continue;
      if (++cnt[c] > bn) { bn = cnt[c]; bc = c; }
    }
    out[i] = bn >= 4 ? bc : idx[i];
  }
  return out;
}

// Per-channel median over the solid pixels within radius R: removes grain and texture, keeps edges.
function medianRGB(t, d, w, h, R) {
  const out = Uint8Array.from(t), buf = [[], [], []];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = y * w + x; if (!d[p * 4 + 3]) continue;
    buf[0].length = buf[1].length = buf[2].length = 0;
    for (let yy = Math.max(0, y - R); yy <= Math.min(h - 1, y + R); yy++) for (let xx = Math.max(0, x - R); xx <= Math.min(w - 1, x + R); xx++) {
      const q = yy * w + xx; if (!d[q * 4 + 3]) continue;
      buf[0].push(t[q * 3]); buf[1].push(t[q * 3 + 1]); buf[2].push(t[q * 3 + 2]);
    }
    for (let c = 0; c < 3; c++) { buf[c].sort((a, b) => a - b); out[p * 3 + c] = buf[c][buf[c].length >> 1]; }
  }
  return out;
}

function cleanGroup(frames, o) {
  const stats = {};
  const tf = makeTransform({
    recolor: o.recolor, hueShifts: o.hueShifts, saturation: o.saturation, contrast: o.contrast, lift: o.lift, avoidIchor: o.avoidIchor, avoidBlood: o.avoidBlood,
  }, stats);
  const hist = makeHistogram();
  let fg = 0;
  const info = { fg: 0, stats, gorePalette: [], outlineNote: '' };
  for (const f of frames) {
    f.t = new Uint8Array(f.w * f.h * 3);
    for (let p = 0; p < f.w * f.h; p++) {
      if (!f.d[p * 4 + 3]) continue;
      const c = tf(f.d[p * 4], f.d[p * 4 + 1], f.d[p * 4 + 2]);
      f.t[p * 3] = Math.round(c[0]); f.t[p * 3 + 1] = Math.round(c[1]); f.t[p * 3 + 2] = Math.round(c[2]);
    }
    if (o.smoothR > 0) f.t = medianRGB(f.t, f.d, f.w, f.h, o.smoothR);
  }
  // levels: stretch the brightness so the lightest tones reach about 235 and the middle is not murky (night parks are dark)
  if (o.levels !== 'off') {
    const ls = [];
    for (const f of frames) for (let p = 0; p < f.w * f.h; p += 3) if (f.d[p * 4 + 3]) ls.push(luma(f.t[p * 3], f.t[p * 3 + 1], f.t[p * 3 + 2]));
    ls.sort((a, b) => a - b);
    if (ls.length > 50) {
      const p98 = ls[Math.floor(ls.length * 0.98)], med = ls[ls.length >> 1];
      const sc = Math.max(1, Math.min(1.7, 235 / Math.max(60, p98))), want = typeof o.levels === 'number' ? o.levels : 85;
      const m1 = Math.min(254, med * sc);
      const gamma = m1 >= want ? 1 : Math.max(0.55, Math.log(want / 255) / Math.log(m1 / 255));
      info.levels = { scale: sc, gamma, median: med, p98 };
      if (sc > 1.001 || gamma < 0.999) for (const f of frames) for (let p = 0; p < f.w * f.h; p++) {
        if (!f.d[p * 4 + 3]) continue;
        const r = f.t[p * 3], g = f.t[p * 3 + 1], b = f.t[p * 3 + 2], L = luma(r, g, b);
        if (L < 1) continue;
        const L2 = 255 * Math.pow(Math.min(1, L * sc / 255), gamma), fct = Math.min(L2 / L, 255 / Math.max(r, g, b, 1)); // never clamp a channel: that would shift the hue
        f.t[p * 3] = Math.min(255, Math.round(r * fct)); f.t[p * 3 + 1] = Math.min(255, Math.round(g * fct)); f.t[p * 3 + 2] = Math.min(255, Math.round(b * fct));
      }
    }
  }
  for (const f of frames) for (let p = 0; p < f.w * f.h; p++) if (f.d[p * 4 + 3]) { hist.add(f.t[p * 3], f.t[p * 3 + 1], f.t[p * 3 + 2]); fg++; }
  info.fg = fg;
  const pts = hist.points();
  const distinctBefore = new Set();
  for (const f of frames) for (let p = 0; p < f.w * f.h; p += 3) if (f.d[p * 4 + 3]) distinctBefore.add((f.d[p * 4] << 16) | (f.d[p * 4 + 1] << 8) | f.d[p * 4 + 2]);
  let palette;
  if (o.palette) { palette = o.palette.slice(); info.fromFile = true; }
  else {
    const k = Math.max(3, o.maxColours - (o.outline === 'off' ? 0 : 1));
    palette = finishPalette(kmeans(pts, k));
  }
  // keep clear of the reserved colours
  const reserved = [...(o.avoidIchor ? o.gore.ichor : []), ...(o.avoidBlood ? o.gore.blood : [])];
  if (reserved.length && !o.palette) {
    const r = keepClearOf(palette, reserved, 44);
    palette = r.palette; info.gorePalette = r.moves;
  }
  // never the exact value of ANY reserved colour (bone and meat included): nothing but gore may use them
  if (!o.palette) {
    const r = nudgeOffReserved(palette, o.gore.all);
    palette = r.palette; info.gorePalette = [...info.gorePalette, ...r.moves];
  }
  // outline colour
  let outline = null;
  if (o.outline !== 'off') {
    if (o.outline !== 'auto') outline = o.outline;
    else if (o.palette && o.paletteOutline) outline = o.paletteOutline;
    else if (luma(...palette[0]) <= 64) outline = palette[0];
    else outline = [snap9(palette[0][0] * 0.45), snap9(palette[0][1] * 0.45), snap9(palette[0][2] * 0.5)];
    if (o.outline === 'auto' && o.gore.all.some((r) => Math.hypot(r[0] - outline[0], r[1] - outline[1], r[2] - outline[2]) < 44)) outline = [36, 36, 72]; // an outline is never a gore colour
    const r = ensureColour(palette, outline, o.maxColours);
    palette = r.palette; info.outlineNote = r.replaced ? `the outline colour ${hex6(outline)} took the place of ${hex6(r.replaced)} (the palette was full)` : '';
  }
  // flatten every frame to palette colours (with a light 3 x 3 clean-up at full size)
  const cache = new Map();
  const pal = palette;
  for (const f of frames) {
    let idx = new Int8Array(f.w * f.h).fill(-1);
    for (let p = 0; p < f.w * f.h; p++) {
      if (!f.d[p * 4 + 3]) continue;
      const key = (f.t[p * 3] << 16) | (f.t[p * 3 + 1] << 8) | f.t[p * 3 + 2];
      let c = cache.get(key);
      if (c === undefined) { c = nearestIndex([f.t[p * 3], f.t[p * 3 + 1], f.t[p * 3 + 2]], pal); cache.set(key, c); }
      idx[p] = c;
    }
    for (let pass = 0; pass < (o.cleanPasses != null ? o.cleanPasses : 2); pass++) idx = modePass(idx, f.w, f.h);
    f.idx = idx;
  }
  info.palette = palette; info.outline = outline; info.distinctBefore = distinctBefore.size * 3;
  const oi = outline ? palette.findIndex((c) => c.join() === outline.join()) : -1;
  // did the source already have a dark edge?
  let edge = 0, dark = 0;
  for (const f of frames) for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
    const i = y * f.w + x;
    if (f.idx[i] < 0) continue;
    const open = (xx, yy) => xx < 0 || yy < 0 || xx >= f.w || yy >= f.h || f.idx[yy * f.w + xx] < 0;
    if (open(x - 1, y) || open(x + 1, y) || open(x, y - 1) || open(x, y + 1)) { edge++; if (oi >= 0 ? f.idx[i] === oi || luma(...palette[f.idx[i]]) <= luma(...outline) + 24 : luma(...palette[f.idx[i]]) <= 70) dark++; }
  }
  info.sourceEdgeDark = edge ? dark / edge : 0;
  return info;
}

// ---------- shrinking one frame into its cell ----------
// ctx: { fw, fh, K, ax, ay, by, feet, px, gyB, liftG, rm } ; returns { idx (Int8 palette index or -1), rgb (Float32), cov, trimmed, clip }
function renderFrame(f, grp, ctx, o) {
  const { fw, fh, K, feet } = ctx;
  const sxOf = feet ? (i) => ctx.ax + (i - ctx.dcx) / K : (i) => f.cx + (i - fw / 2) / K;
  const syOf = feet ? (j) => f.body.y1 + (j - (ctx.gyB - ctx.liftG)) / K : (j) => f.cy + (j - fh / 2) / K;
  // pieces to leave out: detached bits that fall outside the cell (or too far above the body)
  const drop = new Set(), trimmedInfo = { pieces: 0, area: 0 };
  if (feet && o.trim !== 'off' && !o.keepEffects) {
    const lim = { x0: sxOf(ctx.rm), x1: sxOf(fw - ctx.rm), y0: syOf(ctx.rm), y1: syOf(ctx.gyB) };
    const far = typeof o.trim === 'number' ? f.body.y0 - o.trim : -1e9;
    for (const c of f.comps) {
      if (c.main) continue;
      if (c.x0 < lim.x0 - 0.01 || c.x1 > lim.x1 + 0.01 || c.y0 < lim.y0 - 0.01 || c.y1 > lim.y1 + 0.01 || c.y1 < far) { drop.add(c.id); trimmedInfo.pieces++; trimmedInfo.area += c.area; }
    }
  }
  const rgb = new Float32Array(fw * fh * 3), cov = new Float32Array(fw * fh), idx = new Int8Array(fw * fh).fill(-1);
  const xs = Array.from({ length: fw + 1 }, (_, i) => sxOf(i)), ys = Array.from({ length: fh + 1 }, (_, j) => syOf(j));
  const pal = grp.palette, vote = o.downscale === 'vote', wts = new Float64Array(pal.length);
  for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) {
    const xa = xs[i], xb = xs[i + 1], ya = ys[j], yb = ys[j + 1], area = (xb - xa) * (yb - ya);
    let sr = 0, sg = 0, sb = 0, sw = 0;
    if (vote) wts.fill(0);
    for (let y = Math.max(0, Math.floor(ya)); y < Math.min(f.h, Math.ceil(yb)); y++) {
      const wy = Math.min(y + 1, yb) - Math.max(y, ya); if (wy <= 0) continue;
      for (let x = Math.max(0, Math.floor(xa)); x < Math.min(f.w, Math.ceil(xb)); x++) {
        const p = y * f.w + x, c = f.idx[p];
        if (c < 0) continue;
        if (drop.size && drop.has(f.labels[p])) continue;
        const wx = Math.min(x + 1, xb) - Math.max(x, xa); if (wx <= 0) continue;
        const wgt = wx * wy;
        if (o.flatten === false) { sr += f.t[p * 3] * wgt; sg += f.t[p * 3 + 1] * wgt; sb += f.t[p * 3 + 2] * wgt; }
        else { const col = pal[c]; sr += col[0] * wgt; sg += col[1] * wgt; sb += col[2] * wgt; }
        sw += wgt;
        if (vote) wts[c] += wgt * (pal[c][0] + pal[c][1] + pal[c][2] < 150 ? 1.4 : 1); // dark pixels count extra so thin dark lines survive
      }
    }
    const k = j * fw + i;
    cov[k] = sw / area;
    if (cov[k] >= 0.5) {
      rgb[k * 3] = sr / sw; rgb[k * 3 + 1] = sg / sw; rgb[k * 3 + 2] = sb / sw;
      if (vote) { let bi = 0; for (let c = 1; c < pal.length; c++) if (wts[c] > wts[bi]) bi = c; idx[k] = bi; }
      else idx[k] = nearestIndex([rgb[k * 3], rgb[k * 3 + 1], rgb[k * 3 + 2]], pal);
    }
  }
  // how much of the body would be cut off by the cell?
  const clip = [];
  const gx = (sx) => (feet ? ctx.dcx + (sx - ctx.ax) * K : fw / 2 + (sx - f.cx) * K), gy = (sy) => (feet ? ctx.gyB - ctx.liftG + (sy - f.body.y1) * K : fh / 2 + (sy - f.cy) * K);
  const bb = f.body, L = gx(bb.x0), R = gx(bb.x1), T = gy(bb.y0), B = gy(bb.y1);
  if (L < ctx.rm - 0.6) clip.push(`left by ${(ctx.rm - L).toFixed(1)} px`);
  if (R > fw - ctx.rm + 0.6) clip.push(`right by ${(R - fw + ctx.rm).toFixed(1)} px`);
  if (T < ctx.rm - 0.6) clip.push(`top by ${(ctx.rm - T).toFixed(1)} px`);
  if (!feet && B > fh - ctx.rm + 0.6) clip.push(`bottom by ${(B - fh + ctx.rm).toFixed(1)} px`);
  return { idx, rgb, cov, trimmed: trimmedInfo, clip };
}

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function modeLight(idx, w, h) { // replace a pixel when 6 or more of its 8 neighbours share one other colour
  const out = Int8Array.from(idx), cnt = new Int8Array(16);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x; if (idx[i] < 0) continue;
    cnt.fill(0); let bc = -1, bn = 0, solid = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const c = idx[i + dy * w + dx]; if (c < 0) continue;
      solid++;
      if (++cnt[c] > bn) { bn = cnt[c]; bc = c; }
    }
    if (bn >= 6 && bc !== idx[i] && solid >= 7) out[i] = bc;
  }
  return out;
}
function fillHoles(idx, w, h) { // a clear pixel with solid pixels on 3 or 4 sides is a hole: fill it
  let n = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x; if (idx[i] >= 0) continue;
    let solid = 0, c = -1; const cnt = {};
    for (const [dx, dy] of N4) { const v = idx[i + dy * w + dx]; if (v >= 0) { solid++; cnt[v] = (cnt[v] || 0) + 1; if (c < 0 || cnt[v] > cnt[c]) c = v; } }
    if (solid >= 3) { idx[i] = c; n++; }
  }
  return n;
}
function despeckle(idx, w, h, minArea) {
  const seen = new Uint8Array(w * h); let removed = 0, pieces = 0;
  for (let s = 0; s < w * h; s++) {
    if (idx[s] < 0 || seen[s]) continue;
    const comp = [s]; seen[s] = 1;
    for (let k = 0; k < comp.length; k++) {
      const p = comp[k], x = p % w, y = (p - x) / w;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx; if (!seen[q] && idx[q] >= 0) { seen[q] = 1; comp.push(q); }
      }
    }
    if (comp.length < minArea) { for (const p of comp) idx[p] = -1; removed += comp.length; pieces++; }
  }
  return { removed, pieces };
}
function addOutline(idx, w, h, oi) {
  const add = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (idx[i] >= 0) continue;
    for (const [dx, dy] of N4) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const v = idx[ny * w + nx]; if (v >= 0 && v !== oi) { add.push(i); break; }
    }
  }
  for (const i of add) idx[i] = oi;
  return add.length;
}

// ---------- the report numbers ----------
export function flickerOf(frames, fw, fh) { // frames: [{idx, rgb}] of one strip
  let flips = 0, still = 0;
  for (let n = 1; n < frames.length; n++) {
    const a = frames[n - 1], b = frames[n];
    for (let p = 0; p < fw * fh; p++) {
      if (a.idx[p] < 0 || b.idx[p] < 0 || a.cov[p] < 0.5 || b.cov[p] < 0.5) continue;
      // "still": the picture itself barely changed here (only noise); a colour flip there is shimmer
      if (Math.hypot(a.rgb[p * 3] - b.rgb[p * 3], a.rgb[p * 3 + 1] - b.rgb[p * 3 + 1], a.rgb[p * 3 + 2] - b.rgb[p * 3 + 2]) > 30) continue;
      still++;
      if (a.idx[p] !== b.idx[p]) flips++;
    }
  }
  return still ? flips / still : 0;
}

// ---------- the whole run ----------
// input: { sheet: {w, h, d}, map, opts, manifest (slot table), gore (loadGoreColours result), sheetName }
// opts: see --help; all optional. Returns { verdict, strips:[...], palette, report (markdown), ... }
export function buildCharacter(input) {
  const { sheet: img, map, manifest } = input;
  const o0 = input.opts || {};
  const gore = input.gore;
  const maxColours = o0.colours ? +o0.colours : 15;
  const o = {
    maxColours, outline: o0.outline == null ? 'auto' : o0.outline === 'auto' || o0.outline === 'off' ? o0.outline : parseHex6(o0.outline),
    avoidIchor: o0.avoidGore !== false && !o0.allowIchor, avoidBlood: o0.avoidGore !== false && !o0.allowBlood, gore,
    recolor: (o0.recolor || []).map((r) => (typeof r === 'string' ? parseRecolor(r) : r)), hueShifts: (o0.hueShift || []).map((r) => (typeof r === 'string' ? parseHueShift(r) : r)),
    saturation: o0.saturationBoost != null ? +o0.saturationBoost : 1.55, contrast: o0.contrast != null ? +o0.contrast : 1.2, lift: o0.lift != null ? +o0.lift : 0.05,
    palette: o0.palette ? o0.palette.palette : null, paletteOutline: o0.palette ? o0.palette.outline : null,
    stabilize: o0.stabilize !== false, despeckle: o0.despeckle != null ? +o0.despeckle : 2, keepEffects: !!o0.keepEffects,
    trim: o0.trimParticles == null || o0.trimParticles === 'auto' ? 'auto' : o0.trimParticles === 'off' ? 'off' : +o0.trimParticles,
    cleanPasses: 2, levels: o0.levels === 'off' ? 'off' : o0.levels != null && o0.levels !== 'auto' ? +o0.levels : 'auto', flatten: o0.flatten !== false, downscale: o0.downscale === 'average' ? 'average' : 'vote', smoothR: o0.smooth != null ? +o0.smooth : 0,
  };
  if (o.trim !== 'auto' && o.trim !== 'off' && !(o.trim > 0)) throw new Error('--trim-particles must be auto, off or a number of pixels');
  const { defs, problems: mapProblems } = resolveSlots(map, o0, manifest);
  const notes = [], warnings = [];

  // ---- sheet: background, foreground, pieces ----
  const bgSpec = o0.bg || map.bg;
  const bgInfo = bgSpec ? { colour: String(bgSpec).split(',').map(parseHex6)[0], transparent: false, noise: 0 } : sheetBackground(img);
  const tol = o0.tolerance != null ? +o0.tolerance : map.tolerance != null ? +map.tolerance : autoTolerance(bgInfo);
  const mask = foregroundMask(img, bgInfo.colour, tol);
  const { labels, comps } = labelPieces(mask, img.w, img.h);
  const sheet = { w: img.w, h: img.h, d: img.d, labels, comps };
  notes.push(`Sheet: ${fmt(img.w)} x ${fmt(img.h)} px, background ${bgInfo.colour ? hexOf(...bgInfo.colour) : 'see-through'}${bgSpec ? ' (from the map or your flag)' : ' (found automatically)'}, tolerance ${tol}.`);

  // ---- frames (each distinct box once) ----
  const fcache = new Map();
  const allBoxes = [...new Map(defs.flatMap((d) => d.entries.map((e) => [e.box.join(','), e.box]))).values()];
  const frameOf = (e, group) => {
    const k = e.box.join(',') + (e.flip ? 'f' : '') + '@' + group;
    let f = fcache.get(k);
    if (!f) {
      f = analyseFrame(cropFrame(sheet, e.box, e.flip, allBoxes)); f.key = k;
      if (!f.body) throw new Error(`the frame at box [${e.box.join(', ')}] is empty (nothing but background; check the numbers in the map against detect-overlay.png)`);
      fcache.set(k, f);
    }
    return f;
  };
  for (const d of defs) d.list = d.entries.map((e) => frameOf(e, d.group));

  // ---- palette groups ----
  const groups = new Map();
  for (const d of defs) {
    if (!groups.has(d.group)) groups.set(d.group, { name: d.group, frames: new Map(), defs: [] });
    const g = groups.get(d.group); g.defs.push(d);
    for (const f of d.list) g.frames.set(f.key, f);
  }
  for (const g of groups.values()) g.cleaned = [...g.frames.values()];
  // ---- shared scale ----
  const feetFrames = new Map();
  for (const d of defs) if (d.slot.feet) for (const f of d.list) feetFrames.set(f.key, f);
  const refDefs = defs.filter((d) => d.slot.feet && /^(walk|run|idle)/.test(d.slot.anim));
  const refList = refDefs.length ? refDefs.flatMap((d) => d.list) : [...feetFrames.values()];
  const refH = median([...new Map(refList.map((f) => [f.key, f])).values()].map((f) => f.body.y1 - f.body.y0));
  const refCell = (refDefs.length ? refDefs[0] : defs.find((d) => d.slot.feet) || defs[0]).slot;
  const targetH = o0.height ? +o0.height : map.height ? +map.height : Math.max(8, Math.min(refCell.fh - 3, Math.round(refCell.fh * 0.93)));
  let K = o0.scale ? +o0.scale : map.scale ? +map.scale : refH ? targetH / refH : 1;
  const wantedK = K;
  const outlineOn = (d) => (d.def.outline != null ? d.def.outline !== 'off' : o.outline !== 'off');
  // ground line per sheet row: frames standing on the same row of the sheet share a ground
  const sheetBottoms = [...feetFrames.values()].map((f) => ({ f, y: f.box[1] + f.body.y1 })).sort((a, b) => a.y - b.y);
  const rowsG = [];
  for (const e of sheetBottoms) { const r = rowsG[rowsG.length - 1]; if (r && e.y - r.last <= Math.max(10, refH * 0.35)) { r.items.push(e); r.last = e.y; } else rowsG.push({ items: [e], last: e.y }); }
  for (const r of rowsG) { const g = median(r.items.map((e) => e.y)); for (const e of r.items) e.f.groundLift = g - e.y; }
  // fit: the body of every feet frame must fit its cell (1 px kept for the outline)
  let fitK = Infinity, fitWhy = '';
  for (const d of defs) {
    if (!d.slot.feet) continue;
    const rm = outlineOn(d) ? 1 : 0, gyB = outlineOn(d) ? d.slot.py : d.slot.py + 1;
    for (const f of d.list) {
      const bh = f.body.y1 - f.body.y0, bw = f.body.x1 - f.body.x0;
      const lift = Math.max(0, f.groundLift || 0);
      const m = Math.min((d.slot.fw - 2 * rm) / bw, (gyB - rm) / (bh + lift));
      if (m / 0.85 < fitK) { fitK = m / 0.85; fitWhy = `${d.slot.anim} frame ${d.list.indexOf(f) + 1}`; }
    }
  }
  if (K > fitK * 0.9995) {
    const newK = Math.floor(fitK * 0.9995 * 10000) / 10000;
    warnings.push(`The scale was lowered from ${wantedK.toFixed(3)} to ${newK.toFixed(3)} game px per picture px because the widest/tallest pose (${fitWhy}) is more than 15% too big for its cell. Everything shrank together so the animations still match. If the figure got too small, cut the loose bits off that pose or use a bigger cell (--size).`);
    K = newK;
  }
  notes.push(`Shared scale: ${K.toFixed(3)} game pixels per picture pixel (${refH ? `a standing figure is ${Math.round(refH)} px tall in the picture, about ${Math.round(refH * K)} px in the game` : 'no standing figure to measure'}).`);

  const gInfo = new Map();
  for (const g of groups.values()) {
    const gdef = g.defs[0].def;
    const goreMode = gdef.gore || 'none';
    const oo = { ...o, avoidIchor: o.avoidIchor && !(goreMode === 'all' || goreMode === 'ichor'), avoidBlood: o.avoidBlood && !(goreMode === 'all' || goreMode === 'blood') };
    if (gdef.outline != null) oo.outline = gdef.outline === 'auto' || gdef.outline === 'off' ? gdef.outline : parseHex6(gdef.outline);
    oo.smoothR = o0.smooth != null ? +o0.smooth : Math.max(1, Math.min(4, Math.round(0.6 / K)));
    const info = cleanGroup(g.cleaned, oo);
    info.opts = oo; g.info = info; g.palette = info.palette; g.outline = info.outline; gInfo.set(g.name, info);
  }

  // ---- render every slot ----
  const strips = [];
  for (const d of defs) {
    const slot = d.slot, grp = [...groups.values()].find((g) => g.defs.includes(d));
    const sNotes = [], sWarn = [], sProblems = [...mapProblems.filter((p) => p.startsWith(d.slot.mapKey + ':'))], sAsks = [];
    const on = outlineOn(d), rm = on ? 1 : 0;
    const keepFx = o.keepEffects || !!d.def.keepEffects;
    const sK = (() => {
      if (slot.feet) return d.def.scale ? +d.def.scale : d.def.height ? +d.def.height / median(d.list.map((f) => f.body.y1 - f.body.y0)) : K;
      if (d.def.scale) return +d.def.scale;
      let k = Math.min(...d.list.map((f) => Math.min((slot.fw - 2 * rm) / (f.body.x1 - f.body.x0), (slot.fh - 2 * rm) / (f.body.y1 - f.body.y0))));
      if (d.def.height) k = Math.min(k, +d.def.height / Math.max(...d.list.map((f) => f.body.y1 - f.body.y0)));
      return Math.floor(k * 0.9995 * 10000) / 10000;
    })();
    const rendered = [];
    let shifted = 0, shiftMax = 0, ownShrunk = 0, ownMax = 0;
    const optsR = { trim: o.trim, keepEffects: keepFx, flatten: o.flatten, downscale: o.downscale };
    for (const f of d.list) {
      let kf = sK;
      if (slot.feet) { // a pose a little too big for the cell is shrunk on its own (by at most 15%) instead of shrinking the whole character
        const bh = f.body.y1 - f.body.y0, bw = f.body.x1 - f.body.x0, lf = Math.max(0, f.groundLift || 0);
        const mf = Math.min((slot.fw - 2 * rm) / bw, ((on ? slot.py : slot.py + 1) - rm) / (bh + lf)) * 0.9995;
        if (mf < sK) { kf = mf; ownShrunk++; ownMax = Math.max(ownMax, 1 - mf / sK); }
      }
      const ctx = { fw: slot.fw, fh: slot.fh, K: kf, feet: slot.feet, dcx: slot.px + 0.5, gyB: on ? slot.py : slot.py + 1, liftG: 0, rm };
      if (!slot.feet) { f.cx = (f.body.x0 + f.body.x1) / 2; f.cy = (f.body.y0 + f.body.y1) / 2; }
      else {
        const lift = Math.max(0, f.groundLift || 0) * kf;
        ctx.liftG = lift >= 1.6 ? Math.round(lift) : 0;
        // keep the whole body inside the cell: slide a frame sideways (as little as possible) when its reach does not fit around the feet column
        const axMax = f.body.x0 + (ctx.dcx - rm) / kf, axMin = f.body.x1 - (slot.fw - rm - ctx.dcx) / kf;
        let ax = f.ax;
        if (axMin <= axMax) ax = Math.min(axMax, Math.max(axMin, f.ax));
        ctx.ax = ax;
        if (Math.abs(ax - f.ax) * kf >= 0.75) { shifted++; shiftMax = Math.max(shiftMax, Math.abs(ax - f.ax) * kf); }
      }
      rendered.push({ f, r: renderFrame(f, grp, ctx, optsR), ctx });
    }
    // per-frame finishing: light clean-up, stabilise, specks, outline
    const pal = grp.palette, oi = grp.outline ? pal.findIndex((c) => c.join() === grp.outline.join()) : -1;
    let shiftedDown = 0, prev = null, trimmedPieces = 0, trimmedArea = 0, specks = 0, holes = 0, outlinePx = 0, stabilised = 0;
    const finals = [];
    rendered.forEach(({ f, r, ctx }, n) => {
      let idx = modeLight(r.idx, slot.fw, slot.fh);
      if (o.stabilize && prev) {
        for (let p = 0; p < idx.length; p++) {
          if (idx[p] >= 0 && prev.idx[p] >= 0 && idx[p] !== prev.idx[p] && r.cov[p] >= 0.5 && prev.cov[p] >= 0.5) {
            const dd = Math.hypot(r.rgb[p * 3] - prev.rgb[p * 3], r.rgb[p * 3 + 1] - prev.rgb[p * 3 + 1], r.rgb[p * 3 + 2] - prev.rgb[p * 3 + 2]);
            if (dd <= 30) { idx[p] = prev.idx[p]; stabilised++; }
          }
        }
      }
      holes += fillHoles(idx, slot.fw, slot.fh);
      if (!keepFx && o.despeckle > 1) { const s = despeckle(idx, slot.fw, slot.fh, o.despeckle); specks += s.pieces; }
      if (on && oi >= 0) outlinePx += addOutline(idx, slot.fw, slot.fh, oi);
      if (slot.feet && ctx.liftG === 0) { // a standing frame whose lowest pixel is one row above the ground line (e.g. a dark sole that needs no outline under it) moves down 1 px
        let low = -1;
        for (let p = 0; p < idx.length; p++) if (idx[p] >= 0) low = Math.max(low, Math.floor(p / slot.fw));
        if (low === slot.py - 1) {
          const fw = slot.fw;
          idx.copyWithin(fw, 0, idx.length - fw); idx.fill(-1, 0, fw);
          r.rgb.copyWithin(fw * 3, 0, r.rgb.length - fw * 3); r.rgb.fill(0, 0, fw * 3);
          r.cov.copyWithin(fw, 0, r.cov.length - fw); r.cov.fill(0, 0, fw);
          shiftedDown++;
        }
      }
      trimmedPieces += r.trimmed.pieces; trimmedArea += r.trimmed.area;
      if (r.clip.length) sWarn.push(`Frame ${n + 1} is cut off by the cell: ${r.clip.join(', ')}.`);
      finals.push({ idx, cov: r.cov, rgb: r.rgb });
      prev = { idx: r.idx, rgb: r.rgb, cov: r.cov };
      // for stabilising we compare against the previous frame as drawn
      prev.idx = idx;
    });
    // the strip picture
    const W = slot.fw * slot.frames, H = slot.fh, sd = new Uint8Array(W * H * 4);
    finals.forEach((fr, n) => {
      for (let y = 0; y < slot.fh; y++) for (let x = 0; x < slot.fw; x++) {
        const v = fr.idx[y * slot.fw + x]; if (v < 0) continue;
        sd.set([pal[v][0], pal[v][1], pal[v][2], 255], (y * W + n * slot.fw + x) * 4);
      }
    });
    const strip = { w: W, h: H, d: sd };
    // stats
    const used = new Set(); for (const fr of finals) for (const v of fr.idx) if (v >= 0) used.add(v);
    const flick = slot.frames > 1 ? flickerOf(finals, slot.fw, slot.fh) : 0;
    // feet check
    const feetRows = finals.map((fr) => { let low = -1; for (let y = 0; y < slot.fh; y++) for (let x = 0; x < slot.fw; x++) if (fr.idx[y * slot.fw + x] >= 0) low = y; return low; });
    const empty = feetRows.map((v, i) => (v < 0 ? i + 1 : 0)).filter(Boolean);
    if (empty.length) sProblems.push(`Frame(s) ${empty.join(', ')} came out empty.`);
    if (slot.feet) {
      const off = feetRows.map((v, i) => [i + 1, slot.py - v]).filter(([, dlt]) => dlt !== 0 && dlt < 2 && dlt > -99);
      if (off.length) sWarn.push(`Feet wobble: frame(s) ${off.map(([i, dlt]) => `${i} (${dlt > 0 ? dlt + ' px above' : -dlt + ' px below'})`).join(', ')} not exactly on the ground line (row ${slot.py}).`);
      const air = feetRows.map((v, i) => [i + 1, slot.py - v]).filter(([, dlt]) => dlt >= 2);
      if (air.length) sNotes.push(`Off the ground line in frame(s) ${air.map(([i, dlt]) => `${i} (${dlt} px up)`).join(', ')}; kept because the figure really is in the air there.`);
    }
    if (ownShrunk) sNotes.push(`${ownShrunk} frame(s) are up to ${Math.round(ownMax * 100)}% smaller than the rest, because that pose is bigger than the cell allows at the shared scale.`);
    if (shiftedDown) sNotes.push(`${shiftedDown} frame(s) were moved down 1 px so their feet stand on the ground line.`);
    if (shifted) sNotes.push(`${shifted} frame(s) were slid sideways by up to ${shiftMax.toFixed(1)} px so that a wide pose fits the cell.`);
    if (trimmedPieces) sNotes.push(`Removed ${trimmedPieces} loose bit(s) (sparks, slime flecks, about ${fmt(trimmedArea)} picture px in all) that were detached and fell outside the cell, so the frames stay inside it.`);
    if (specks) sNotes.push(`Removed ${specks} tiny detached speck(s) after shrinking (--despeckle ${o.despeckle}).`);
    if (holes) sNotes.push(`Filled ${holes} single-pixel hole(s).`);
    if (stabilised) sNotes.push(`Kept ${fmt(stabilised)} pixel(s) the same colour as the frame before (--stabilize).`);
    const flickLimit = 0.1;
    if (flick > flickLimit && slot.frames > 1) sWarn.push(`Colours shimmer between frames: ${(flick * 100).toFixed(1)}% of the pixels that hardly changed in the picture still change colour from one frame to the next. Try --stabilize.`);
    const compareBefore = renderBefore(d, sK, on ? slot.py : slot.py + 1, rm, sheet, slot);
    // output
    const verdict = sProblems.length ? 'REDO' : sWarn.length ? 'READY WITH WARNINGS' : 'READY';
    strips.push({
      slot, key: slot.key, mapKey: slot.mapKey, fileName: slot.fileName, img: strip, scale: sK, frameFinals: finals, used: [...used].sort((a, b) => a - b),
      flicker: flick, verdict, warnings: sWarn, notes: sNotes, problems: sProblems, asks: sAsks, group: grp.name,
      trimmed: { pieces: trimmedPieces, area: trimmedArea }, outlinePx, before: compareBefore, frameKeys: d.list.map((f) => f.key), facing: facing(d.list),
    });
  }
  // ---- previews, palettes, text ----
  for (const s of strips) {
    const k = pickScale(s.img.w);
    s.previewImg = stripPreview(s.img, s.slot, k);
    s.compareImg = compareImage(s.before, s.img, s.slot, k);
    s.png = toPng(s.img); s.previewPng = toPng(s.previewImg); s.comparePng = toPng(s.compareImg);
  }
  const contactK = pickScale(Math.max(...strips.map((s) => s.img.w)), 2400);
  const contact = contactSheet(strips.map((s) => ({ img: s.img, fw: s.slot.fw })), contactK);
  const palInfo = [...groups.values()].map((g) => ({ name: g.name, palette: g.palette, outline: g.outline, info: g.info }));
  const main = palInfo[0];
  const swatch = swatchImage(main.palette, main.outline);
  const result = {
    strips, palettes: palInfo, palette: main.palette, outline: main.outline, scale: K, wantedScale: wantedK, contactPng: toPng(contact), swatchPng: toPng(swatch),
    notes, warnings, mapProblems, sheetInfo: { w: img.w, h: img.h, bg: bgInfo.colour, tolerance: tol }, refHeight: refH, targetHeight: targetH,
  };
  finishReports(result, input, o);
  return result;
}

function facing(list) {
  const leans = [];
  for (const f of list) {
    const bh = f.body.y1 - f.body.y0;
    if (bh > 0) leans.push((f.topX - f.ax) / bh);
  }
  const mean = leans.length ? leans.reduce((a, b) => a + b, 0) / leans.length : 0;
  return mean;
}

// "Before": the same frames shrunk with plain nearest-pixel sampling of the original colours, no clean-up.
function renderBefore(d, K, gyB, rm, sheet, slot) {
  const W = slot.fw * slot.frames, H = slot.fh, out = new Uint8Array(W * H * 4);
  d.list.forEach((f, n) => {
    const liftG = slot.feet ? (() => { const l = Math.max(0, f.groundLift || 0) * K; return l >= 1.6 ? Math.round(l) : 0; })() : 0;
    for (let j = 0; j < slot.fh; j++) for (let i = 0; i < slot.fw; i++) {
      const sx = slot.feet ? f.ax + (i + 0.5 - (slot.px + 0.5)) / K : f.cx + (i + 0.5 - slot.fw / 2) / K;
      const sy = slot.feet ? f.body.y1 + (j + 0.5 - (gyB - liftG)) / K : f.cy + (j + 0.5 - slot.fh / 2) / K;
      const x = Math.floor(sx), y = Math.floor(sy);
      if (x < 0 || y < 0 || x >= f.w || y >= f.h) continue;
      const p = (y * f.w + x) * 4; if (!f.d[p + 3]) continue;
      out.set([f.d[p], f.d[p + 1], f.d[p + 2], 255], (j * W + n * slot.fw + i) * 4);
    }
  });
  void rm; void sheet;
  return { w: W, h: H, d: out };
}

// ---------- flag parsing helpers ----------
export function parseRecolor(s) {
  const m = /^\s*(#[0-9a-f]{6})\s*>\s*(#[0-9a-f]{6})\s*(?::\s*(\d+))?\s*$/i.exec(s);
  if (!m) throw new Error('--recolor must look like "#90d800>#6c9090"');
  return { from: parseHex6(m[1]), to: parseHex6(m[2]), tol: m[3] ? +m[3] : 70 };
}
export function parseHueShift(s) {
  const m = /^\s*(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)\s*:\s*([+-]?\d+(?:\.\d+)?)\s*$/.exec(s);
  if (!m) throw new Error('--hue-shift must look like "70-130:+70" (hue range in degrees : shift)');
  return { lo: +m[1], hi: +m[2], delta: +m[3] };
}

// ---------- reports ----------
function finishReports(res, input, o) {
  const { strips, palettes } = res;
  const shared = palettes[0].palette.map((c) => c.join());
  const name = input.sheetName || 'your sheet';
  const gi = palettes[0].info, st = gi.stats || {};
  const fgTotal = gi.fg || 1;
  // gore remaps
  const moves = [];
  if (st.moved && st.moved.size) {
    const list = [...st.moved.values()].sort((a, b) => b.n - a.n).slice(0, 4);
    for (const e of list) moves.push(`${hex6(e.from.map(Math.round))} -> ${hex6(e.to.map(Math.round))} (${(100 * e.n / fgTotal).toFixed(1)}% of the picture)`);
  }
  for (const [a, b] of gi.gorePalette) moves.push(`palette colour ${hex6(a)} was ${a.join() === b.join() ? '' : 'too close to or exactly '}a reserved gore colour and moved to ${hex6(b)}`);
  res.goreMoves = moves;
  const goreShare = ((st.ichor || 0) + (st.blood || 0)) / fgTotal;
  res.sourceHadOutline = gi.sourceEdgeDark >= 0.6;

  for (const s of strips) {
    const usedHex = s.used.map((i) => gi.palette.length > i ? 1 : 0);
    void usedHex;
    const gp = palettes.find((p) => p.name === s.group).palette.map((c) => c.join());
    const sd = s.img.d, seenC = new Set();
    for (let i = 0; i < sd.length; i += 4) if (sd[i + 3]) seenC.add(`${sd[i]},${sd[i + 1]},${sd[i + 2]}`);
    if ([...seenC].some((c) => !gp.includes(c))) s.problems.push('Internal check failed: a colour outside the shared palette.');
    const f = s.facing;
    s.facingHint = !/^(walk|run|idle|attack)/.test(s.slot.anim) || !s.slot.feet ? 'not checked' : f < -0.04 ? 'probably facing LEFT' : f > 0.04 ? 'facing right' : 'cannot tell which way it faces';
    if (f < -0.04 && /^(walk|run|idle|attack)/.test(s.slot.anim)) s.warnings.push('The figure looks like it faces LEFT (its head and reach lean to the left of its feet). The game expects right. Run again with --flip, or regenerate facing right.');
    s.verdict = s.problems.length ? 'REDO' : s.warnings.length ? 'READY WITH WARNINGS' : 'READY';
    const L = [];
    L.push(`ART IMPORT REPORT: ${name} -> ${s.key}`);
    L.push(`Target: ${s.img.w} x ${s.img.h} px = ${s.slot.frames} frame(s) of ${s.slot.fw} x ${s.slot.fh}, ${s.slot.feet ? `feet at (${s.slot.px}, ${s.slot.py})` : `centred, pivot (${s.slot.px}, ${s.slot.py})`}. File: ${s.fileName}${s.slot.inManifest ? '' : ' (no game slot of this name yet)'}`);
    L.push('');
    L.push('VERDICT: ' + s.verdict);
    L.push('');
    L.push('What I did:');
    L.push(`  - Cut ${s.slot.frames} frame(s) out of the sheet and shrank them by ${s.scale.toFixed(3)} (area average, one scale for the whole character${s.slot.feet ? '' : '; this picture is fitted to its own cell'}).`);
    L.push(`  - Colours: ${s.used.length} of the ${shared.length} shared palette colours are used here (one palette for all strips${palettes.length > 1 ? `; this strip is in the "${s.group}" palette` : ''}); all on the 9-bit grid.`);
    if (s.outlinePx) L.push(`  - Drew a 1 px outline in ${hex6(palettes.find((p) => p.name === s.group).outline)} (${s.outlinePx} pixels).`);
    L.push(`  - Shimmer between frames: ${(s.flicker * 100).toFixed(1)}% of still pixels flip colour.`);
    L.push(`  - Facing: ${s.facingHint}.`);
    L.push('');
    if (s.warnings.length) { L.push('Warnings:'); for (const w of s.warnings) L.push('  - ' + w); L.push(''); }
    if (s.notes.length) { L.push('Notes:'); for (const w of s.notes) L.push('  - ' + w); L.push(''); }
    if (s.problems.length) { L.push('Problems:'); for (const w of s.problems) L.push('  - ' + w); L.push(''); }
    s.report = L.join('\n') + '\n';
  }
  const overall = strips.some((s) => s.verdict === 'REDO') ? 'REDO' : strips.some((s) => s.verdict === 'READY WITH WARNINGS') || res.warnings.length ? 'READY WITH WARNINGS' : 'READY';
  res.verdict = overall;
  // prompt tweaks
  const tips = [];
  const painterly = gi.distinctBefore > 3000;
  if (painterly) tips.push(`The picture has about ${fmt(gi.distinctBefore)} different colours (painterly, soft shading). Ask for: "chunky pixel art at about 3x scale, flat colours, about 12 colours, 3-step shading, no dithering, no painterly texture".`);
  if (gi.sourceEdgeDark < 0.6) tips.push('The figures have no clean dark outline. Ask for: "1 px dark outline around every sprite".');
  if (goreShare > 0.003) tips.push('Acid yellow-green (or blood-red) was used on the figure, which the game keeps for ichor and blood. Ask for: "skin desaturated grey-teal, slime purple, no bright green or red on the body".');
  if (strips.some((s) => s.trimmed.pieces)) tips.push('Loose particles floated far from the body. Ask for: "no detached particles, sparks or slime flecks outside the body".');
  if (strips.some((s) => s.flicker > 0.1)) tips.push('Frames shimmered. Ask for: "identical colours and the same scale in every frame, no dithering".');
  if (strips.some((s) => s.facing < -0.04 && /^(walk|run|idle|attack)/.test(s.slot.anim))) tips.push('Some frames face left. Ask for: "facing right in every frame".');
  if (res.wantedScale > res.scale * 1.02) tips.push('One pose was much wider or taller than the rest and forced everything smaller. Ask for: "same scale in all frames, poses that stay within the same width".');
  res.tips = tips;
  // markdown
  const M = [];
  M.push(`# Character report: ${name}`);
  M.push('');
  M.push(`**Verdict: ${overall}**`);
  M.push('');
  M.push(`- Sheet: ${fmt(res.sheetInfo.w)} x ${fmt(res.sheetInfo.h)} px, background ${res.sheetInfo.bg ? hexOf(...res.sheetInfo.bg) : 'see-through'}.`);
  M.push(`- One shared scale: ${res.scale.toFixed(3)} game px per picture px${res.refHeight ? ` (a standing figure: ${Math.round(res.refHeight)} px in the picture, about ${Math.round(res.refHeight * res.scale)} px in the game)` : ''}.`);
  M.push(`- Shared palette (${palettes[0].palette.length} colours${palettes[0].info.fromFile ? ', from your palette file' : ''}): ${palettes[0].palette.map(hex6).join(' ')}. Outline colour: ${palettes[0].outline ? hex6(palettes[0].outline) : 'none'}.`);
  if (palettes.length > 1) for (const p of palettes.slice(1)) M.push(`- Extra palette "${p.name}" (${p.palette.length} colours): ${p.palette.map(hex6).join(' ')}.`);
  M.push(`- Outline: ${o.outline === 'off' ? 'off.' : `${res.sourceHadOutline ? 'the pictures already had a dark edge (' + Math.round(gi.sourceEdgeDark * 100) + '% of edge pixels), so I only completed it' : 'the pictures had no clean dark outline (' + Math.round(gi.sourceEdgeDark * 100) + '% dark edge), so I drew one'}.`}`);
  M.push(`- Gore colours: ${o.avoidIchor || o.avoidBlood ? (moves.length ? 'moved away from the reserved ichor' + (o.avoidBlood ? ' and blood' : '') + ' colours: ' + moves.join('; ') + '.' : 'nothing needed moving.') : 'left alone (you turned the rule off).'}${o.avoidBlood ? '' : ' Blood red was allowed (--allow-blood).'}`);
  for (const n of res.notes) M.push(`- ${n}`);
  for (const w of res.warnings) M.push(`- WARNING: ${w}`);
  for (const p of res.mapProblems) M.push(`- PROBLEM: ${p}`);
  M.push('');
  M.push('## Strips');
  M.push('');
  M.push('| Slot | File | Frames | Verdict | Colours used | Shimmer | Facing |');
  M.push('|---|---|---|---|---|---|---|');
  for (const s of strips) M.push(`| ${s.key} | ${s.fileName} | ${s.slot.frames} @ ${s.slot.fw}x${s.slot.fh} | ${s.verdict} | ${s.used.length}/${shared.length} | ${(s.flicker * 100).toFixed(1)}% | ${s.facingHint} |`);
  M.push('');
  for (const s of strips) {
    if (!s.warnings.length && !s.notes.length && !s.problems.length) continue;
    M.push(`### ${s.key}`);
    for (const w of s.problems) M.push(`- PROBLEM: ${w}`);
    for (const w of s.warnings) M.push(`- WARNING: ${w}`);
    for (const w of s.notes) M.push(`- ${w}`);
    M.push('');
  }
  if (tips.length) { M.push('## Next time, ask the art tool for'); M.push(''); for (const t of tips) M.push(`- ${t}`); M.push(''); }
  M.push('## Pictures');
  M.push('');
  M.push('- `contact-sheet-4x.png`: every strip, enlarged.');
  M.push('- `palette-swatch.png`: the shared palette (the outline colour has a white frame).');
  M.push('- `<strip>-compare-4x.png`: before (plain shrink of your picture) above after.');
  M.push('- `<strip>-preview-4x.png`: the strip on the cell backdrop.');
  M.push('');
  res.report = M.join('\n');
}
