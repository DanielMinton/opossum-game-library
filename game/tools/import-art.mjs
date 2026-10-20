// Art importer: turns a picture from an image tool (ChatGPT, Codex, Midjourney ...) into a game-ready strip.
//
//   node tools/import-art.mjs <picture.png> --slot jogger:walk            (run from the game/ folder)
//
// It reads the slot's cell size, frame count and feet point from src/assets.js, then: removes the background,
// finds the frames, recovers the real pixel size, scales the character to fit, snaps colours to the 9-bit palette,
// keeps at most 15 colours, puts every frame on the same ground line and feet point, writes the strip, a 4x preview
// and a plain-language report, and runs the same check the scanner uses. Nothing is written into assets/ unless
// you add --install. Run with --help for every option. No packages needed (Node 18+).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { decodeAnyPng, checkPng } from './png.mjs';
import { png as encodePng } from './png-writer.mjs';
import { parseCsv, suggestRow } from './licenses.mjs';

const gameDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = path.resolve(gameDir, '..');

// ---------- slots (read from src/assets.js, never typed twice) ----------
export function loadSlots() {
  const ctx = { globalThis: {} };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(gameDir, 'src', 'assets.js'), 'utf8'), ctx);
  const out = {};
  for (const m of ctx.SAMMY.ASSET_MANIFEST) out[m.key] = m;
  return out;
}
// An ad-hoc slot for art that has no manifest key yet.
export function adhocSlot({ size, frames = 1, pivot, feet = true, loop = 'once' }) {
  const mm = /^(\d+)x(\d+)$/.exec(size || '');
  if (!mm) throw new Error('--size must look like 48x48');
  const fw = +mm[1], fh = +mm[2];
  let px = fw >> 1, py = feet ? fh - 1 : fh >> 1;
  if (pivot) { const pm = /^(\d+),(\d+)$/.exec(pivot); if (!pm) throw new Error('--pivot must look like 24,47'); px = +pm[1]; py = +pm[2]; }
  return { key: 'custom', path: null, fw, fh, frames: +frames, px, py, feet: !!feet, loop };
}

// ---------- small helpers ----------
const GRID_STEP = 36;
export const snap9 = (v) => Math.min(252, Math.round(v / GRID_STEP) * GRID_STEP);
const luma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const hex = (r, g, b) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
const parseHex = (s) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(s).trim());
  if (!m) throw new Error('--bg must look like #ff00ff');
  const v = parseInt(m[1], 16); return [v >> 16, (v >> 8) & 255, v & 255];
};
const mkImg = (w, h) => ({ w, h, d: new Uint8Array(w * h * 4) });
const cloneImg = (img) => ({ w: img.w, h: img.h, d: Uint8Array.from(img.d) });
const colDist = (d, i, c) => Math.hypot(d[i] - c[0], d[i + 1] - c[1], d[i + 2] - c[2]);

// ---------- background ----------
// Looks at the border of the picture. Returns { kind: 'transparent' | 'solid' | 'checker' | 'unknown', colours }.
export function detectBackground(img) {
  const { w, h, d } = img, border = [];
  for (let x = 0; x < w; x++) { border.push(x, (h - 1) * w + x); }
  for (let y = 1; y < h - 1; y++) { border.push(y * w, y * w + w - 1); }
  let clear = 0;
  const clusters = [];
  for (const p of border) {
    const i = p * 4;
    if (d[i + 3] < 128) { clear++; continue; }
    let c = null;
    for (const k of clusters) if (Math.hypot(k.r / k.n - d[i], k.g / k.n - d[i + 1], k.b / k.n - d[i + 2]) <= 28) { c = k; break; }
    if (!c) { c = { r: 0, g: 0, b: 0, n: 0 }; clusters.push(c); }
    c.r += d[i]; c.g += d[i + 1]; c.b += d[i + 2]; c.n++;
  }
  if (clear / border.length >= 0.5) return { kind: 'transparent', colours: [], share: clear / border.length };
  clusters.sort((a, b) => b.n - a.n);
  const col = (k) => [Math.round(k.r / k.n), Math.round(k.g / k.n), Math.round(k.b / k.n)];
  const total = border.length - clear;
  if (clusters.length && clusters[0].n / total >= 0.6) return { kind: 'solid', colours: [col(clusters[0])] };
  if (clusters.length > 1 && (clusters[0].n + clusters[1].n) / total >= 0.6 && clusters[1].n / total >= 0.12) {
    return { kind: 'checker', colours: [col(clusters[0]), col(clusters[1])] };
  }
  return { kind: 'unknown', colours: [] };
}

// Removes the background by flooding in from the picture's edges (so same-coloured pixels inside the art stay).
// Returns { img, removedShare }. tolerance = how far a pixel's colour may be from the background colour (0-441).
export function removeBackground(img, bgColours, tolerance = 40, fringe = 1) {
  const { w, h } = img, out = cloneImg(img), d = out.d, bg = new Uint8Array(w * h);
  const near = (p, tol) => { const i = p * 4; if (d[i + 3] < 128) return true; for (const c of bgColours) if (colDist(d, i, c) <= tol) return true; return false; };
  const stack = [];
  const seed = (p) => { if (!bg[p] && near(p, tolerance)) { bg[p] = 1; stack.push(p); } };
  for (let x = 0; x < w; x++) { seed(x); seed((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { seed(y * w); seed(y * w + w - 1); }
  while (stack.length) {
    const p = stack.pop(), x = p % w, y = (p - x) / w;
    if (x > 0) seed(p - 1);
    if (x < w - 1) seed(p + 1);
    if (y > 0) seed(p - w);
    if (y < h - 1) seed(p + w);
  }
  // Fringe: pixels touching the background that are tinted by it (anti-aliased edges) go too.
  for (let pass = 0; pass < fringe && bgColours.length; pass++) {
    const add = [];
    for (let p = 0; p < w * h; p++) {
      if (bg[p]) continue;
      const x = p % w, y = (p - x) / w;
      if ((x > 0 && bg[p - 1]) || (x < w - 1 && bg[p + 1]) || (y > 0 && bg[p - w]) || (y < h - 1 && bg[p + w])) if (near(p, tolerance * 1.6)) add.push(p);
    }
    for (const p of add) bg[p] = 1;
  }
  let removed = 0;
  for (let p = 0; p < w * h; p++) {
    if (bg[p]) { out.d.fill(0, p * 4, p * 4 + 4); removed++; } else out.d[p * 4 + 3] = d[p * 4 + 3] >= 128 ? 255 : 0;
  }
  return { img: out, removedShare: removed / (w * h) };
}

// Hard-threshold alpha and remove tiny disconnected specks. Returns { img, specks }.
export function removeSpecks(img, minArea) {
  const { w, h } = img, out = cloneImg(img), d = out.d;
  const seen = new Uint8Array(w * h);
  let opaque = 0;
  for (let p = 0; p < w * h; p++) { if (d[p * 4 + 3] >= 128) { d[p * 4 + 3] = 255; opaque++; } else d.fill(0, p * 4, p * 4 + 4); }
  const limit = minArea != null ? minArea : Math.max(3, Math.floor(opaque * 0.0005));
  let specks = 0;
  for (let s = 0; s < w * h; s++) {
    if (seen[s] || !d[s * 4 + 3]) continue;
    const comp = [s]; seen[s] = 1;
    for (let k = 0; k < comp.length; k++) {
      const p = comp[k], x = p % w, y = (p - x) / w;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx;
        if (!seen[q] && d[q * 4 + 3]) { seen[q] = 1; comp.push(q); }
      }
    }
    if (comp.length < limit) { for (const p of comp) d.fill(0, p * 4, p * 4 + 4); specks++; }
  }
  return { img: out, specks };
}

// ---------- pixel-grid recovery ----------
// If the picture is pixel art that was blown up by a whole number n, finds n and where the grid starts.
// `images` is a list of pictures (one per frame, since each frame may sit on its own grid offset).
// Returns { n, phases: [{x, y}, ...], score } or null (blurry or painterly pictures have no grid).
export function detectPixelGrid(images, forced) {
  if (!Array.isArray(images)) images = [images];
  const per = images.map((img) => {
    const { w, h, d } = img, cx = new Float64Array(w + 1), cy = new Float64Array(h + 1);
    let tx = 0, ty = 0;
    const diff = (i, j) => Math.abs(d[i] - d[j]) + Math.abs(d[i + 1] - d[j + 1]) + Math.abs(d[i + 2] - d[j + 2]);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (!d[i + 3]) continue;
      if (x > 0 && d[i - 1]) if (diff(i, i - 4) > 60) { cx[x]++; tx++; }
      if (y > 0 && d[i - w * 4 + 3]) if (diff(i, i - w * 4) > 60) { cy[y]++; ty++; }
    }
    return { cx, cy, tx, ty, w, h };
  });
  const TX = per.reduce((s, p) => s + p.tx, 0), TY = per.reduce((s, p) => s + p.ty, 0);
  // A plain box has edges in only a few places, which fit any grid by accident: ask for a varied outline first.
  const distinct = (key) => per.reduce((m, p) => { for (let i = 0; i < p[key].length; i++) if (p[key][i]) m += 1; return m; }, 0);
  if (TX < 80 * images.length / 2 || TY < 80 * images.length / 2 || distinct('cx') < 8 * images.length || distinct('cy') < 8 * images.length) return forced ? { n: forced, phases: images.map(() => ({ x: 0, y: 0 })), score: 0 } : null;
  const best = (cnt, n) => {
    const sums = new Float64Array(n);
    for (let i = 1; i < cnt.length; i++) sums[i % n] += cnt[i];
    let p = 0; for (let k = 1; k < n; k++) if (sums[k] > sums[p]) p = k;
    return { p, v: sums[p] };
  };
  const eval_ = (n) => {
    let sx = 0, sy = 0; const phases = [];
    for (const p of per) { const a = best(p.cx, n), b = best(p.cy, n); sx += a.v; sy += b.v; phases.push({ x: a.p, y: b.p }); }
    return { phases, score: Math.min(sx / TX, sy / TY) };
  };
  if (forced) return { n: forced, ...eval_(forced) };
  const limit = Math.min(64, Math.floor(Math.min(...per.map((p) => Math.min(p.w, p.h))) / 6));
  for (let n = limit; n >= 2; n--) {
    const r = eval_(n);
    if (r.score >= 0.88) return { n, ...r };
  }
  return null;
}

// ---------- resampling ----------
// Each output pixel looks at a box of the source (box size s, top-left ox,oy + i*s) and takes the most common colour
// among its solid pixels (dark pixels count extra, so 1 px outlines survive). The box is solid when half of it is.
// No colour is ever invented by blending: output colours are averages inside the winning colour group only.
export function resample(img, s, ox, oy, ow, oh) {
  const out = mkImg(ow, oh), { w, h, d } = img;
  for (let j = 0; j < oh; j++) {
    const ya = Math.round(oy + j * s), yb = Math.max(ya + 1, Math.round(oy + (j + 1) * s));
    for (let i = 0; i < ow; i++) {
      const xa = Math.round(ox + i * s), xb = Math.max(xa + 1, Math.round(ox + (i + 1) * s));
      const area = (xb - xa) * (yb - ya);
      const groups = new Map();
      let solid = 0;
      for (let y = Math.max(0, ya); y < Math.min(h, yb); y++) {
        for (let x = Math.max(0, xa); x < Math.min(w, xb); x++) {
          const k = (y * w + x) * 4;
          if (d[k + 3] < 128) continue;
          solid++;
          const key = ((d[k] >> 4) << 8) | ((d[k + 1] >> 4) << 4) | (d[k + 2] >> 4);
          let g = groups.get(key);
          if (!g) { g = { wgt: 0, r: 0, g: 0, b: 0, n: 0 }; groups.set(key, g); }
          g.wgt += luma(d[k], d[k + 1], d[k + 2]) < 70 ? 1.5 : 1;
          g.r += d[k]; g.g += d[k + 1]; g.b += d[k + 2]; g.n++;
        }
      }
      if (solid * 2 < area || !solid) continue;
      let bestK = -1, best = null;
      for (const [key, g] of groups) if (!best || g.wgt > best.wgt || (g.wgt === best.wgt && key < bestK)) { best = g; bestK = key; }
      const o = (j * ow + i) * 4;
      out.d[o] = Math.round(best.r / best.n); out.d[o + 1] = Math.round(best.g / best.n); out.d[o + 2] = Math.round(best.b / best.n); out.d[o + 3] = 255;
    }
  }
  return out;
}

// ---------- frames ----------
function opaqueBBox(img, x0 = 0, y0 = 0, x1 = img.w, y1 = img.h) {
  let bx0 = 1e9, by0 = 1e9, bx1 = -1, by1 = -1;
  for (let y = Math.max(0, y0); y < Math.min(img.h, y1); y++) for (let x = Math.max(0, x0); x < Math.min(img.w, x1); x++) {
    if (img.d[(y * img.w + x) * 4 + 3]) { if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; }
  }
  return bx1 < 0 ? null : { x0: bx0, y0: by0, x1: bx1 + 1, y1: by1 + 1 };
}
function occupancy(img, axis, a0, a1, b0, b1) { // solid pixels per column (axis 'x') or row (axis 'y') inside the box
  const n = axis === 'x' ? img.w : img.h, c = new Int32Array(n);
  for (let y = b0; y < b1; y++) for (let x = a0; x < a1; x++) if (img.d[(y * img.w + x) * 4 + 3]) c[axis === 'x' ? x : y]++;
  return c;
}
function segments(counts, a, b) {
  const segs = [];
  for (let i = a; i < b; i++) {
    if (counts[i]) { if (segs.length && segs[segs.length - 1].b === i) segs[segs.length - 1].b = i + 1; else segs.push({ a: i, b: i + 1 }); }
  }
  return segs;
}
function mergeTo(segs, n) {
  segs = segs.map((s) => ({ ...s }));
  while (segs.length > n) {
    let bi = 0, bg = 1e9;
    for (let i = 0; i + 1 < segs.length; i++) if (segs[i + 1].a - segs[i].b < bg) { bg = segs[i + 1].a - segs[i].b; bi = i; }
    segs.splice(bi, 2, { a: segs[bi].a, b: segs[bi + 1].b });
  }
  return segs;
}
function valleyCuts(counts, a, b, k) { // k-1 cut positions between a and b at the emptiest spots near an even split
  const cuts = [], cell = (b - a) / k, win = Math.max(1, Math.floor(cell * 0.3));
  let prev = a;
  for (let i = 1; i < k; i++) {
    const nominal = Math.round(a + cell * i);
    let bp = nominal, bv = 1e18;
    for (let p = Math.max(prev + 1, nominal - win); p <= Math.min(b - 1, nominal + win); p++) {
      const v = counts[p] * 1000 + Math.abs(p - nominal);
      if (v < bv) { bv = v; bp = p; }
    }
    cuts.push(bp); prev = bp;
  }
  return cuts;
}
const evenParts = (a, b, k) => Array.from({ length: k }, (_, i) => ({ a: Math.round(a + (b - a) * i / k), b: Math.round(a + (b - a) * (i + 1) / k) }));
function rowBands(img) {
  const rc = occupancy(img, 'y', 0, img.w, 0, img.h);
  const segs = segments(rc, 0, img.h);
  if (!segs.length) return [];
  const tallest = Math.max(...segs.map((s) => s.b - s.a));
  // thin bands (a floating hat, a dangling arm) join their nearest neighbour
  let list = segs.map((s) => ({ ...s }));
  for (;;) {
    const small = list.findIndex((s) => s.b - s.a < tallest * 0.35);
    if (small < 0 || list.length < 2) break;
    const left = small > 0 ? list[small].a - list[small - 1].b : 1e9, right = small < list.length - 1 ? list[small + 1].a - list[small].b : 1e9;
    const j = left <= right ? small - 1 : small;
    list.splice(j, 2, { a: list[j].a, b: list[j + 1].b });
  }
  return list;
}

// Splits the cleaned picture into n frame regions. Returns { regions: [{x0,y0,x1,y1}], how, warnings }.
export function findFrames(img, n, o = {}) {
  const warnings = [];
  const full = { x0: 0, y0: 0, x1: img.w, y1: img.h };
  if (n === 1 && !(o.cols > 1 || o.rows > 1)) return { regions: [full], how: 'a single picture', warnings };
  const grid = o.cols || o.rows;
  let rowsSpec = null, how;
  if (grid) {
    const cols = o.cols || Math.ceil(n / o.rows), rows = o.rows || Math.ceil(n / cols);
    const rc = occupancy(img, 'y', 0, img.w, 0, img.h);
    const yc = valleyCuts(rc, 0, img.h, rows);
    const ys = [0, ...yc, img.h];
    rowsSpec = [];
    for (let r = 0; r < rows; r++) {
      const xc = valleyCuts(occupancy(img, 'x', 0, img.w, ys[r], ys[r + 1]), 0, img.w, cols);
      const xs = [0, ...xc, img.w];
      for (let c = 0; c < cols; c++) rowsSpec.push({ x0: xs[c], y0: ys[r], x1: xs[c + 1], y1: ys[r + 1] });
    }
    how = `a sheet of ${cols} across by ${rows} down`;
    if (rowsSpec.length < n) return { regions: [], how, warnings, fatal: `the sheet grid has ${rowsSpec.length} cells but this slot needs ${n} frames` };
    if (rowsSpec.length > n) warnings.push(`the sheet has ${rowsSpec.length} cells; only the first ${n} (left to right, top to bottom) were used`);
    return { regions: rowsSpec.slice(0, n), how, warnings };
  }
  const bands = rowBands(img);
  if (bands.length >= 2 && bands.length <= n && n % bands.length === 0) {
    const per = n / bands.length, regions = [];
    for (const b of bands) {
      const cc = occupancy(img, 'x', 0, img.w, b.a, b.b);
      let segs = segments(cc, 0, img.w);
      if (segs.length < per) segs = evenParts(0, img.w, per);
      else segs = mergeTo(segs, per);
      // cut halfway through each gap, so every frame keeps all of its own pixels
      for (let i = 0; i < segs.length; i++) {
        regions.push({ x0: i ? Math.floor((segs[i - 1].b + segs[i].a) / 2) : 0, y0: b.a, x1: i + 1 < segs.length ? Math.ceil((segs[i].b + segs[i + 1].a) / 2) : img.w, y1: b.b });
      }
    }
    return { regions, how: `a sheet of ${per} across by ${bands.length} down (found by looking for the gaps)`, warnings };
  }
  const cc = occupancy(img, 'x', 0, img.w, 0, img.h);
  const segs = segments(cc, 0, img.w);
  if (segs.length >= n) {
    const m = mergeTo(segs, n), regions = m.map((s, i) => ({
      x0: i ? Math.floor((m[i - 1].b + s.a) / 2) : 0, y0: 0, x1: i + 1 < m.length ? Math.ceil((s.b + m[i + 1].a) / 2) : img.w, y1: img.h,
    }));
    return { regions, how: segs.length === n ? 'one row, split at the gaps' : `one row, split at the gaps (${segs.length} pieces joined into ${n} frames)`, warnings };
  }
  const bb = opaqueBBox(img);
  const parts = img.w % n === 0 ? evenParts(0, img.w, n) : evenParts(bb.x0, bb.x1, n);
  warnings.push(`I could only see ${segs.length} separate figure(s) but this slot needs ${n}; the frames touch or overlap, so I cut the picture into ${n} equal slices. Check the preview. Next time ask for clear space between frames.`);
  return { regions: parts.map((p) => ({ x0: p.a, y0: 0, x1: p.b, y1: img.h })), how: `one row cut into ${n} equal slices`, warnings };
}

// ---------- colours ----------
const CW = [2, 4, 3];
const cdist = (a, b) => CW[0] * (a[0] - b[0]) ** 2 + CW[1] * (a[1] - b[1]) ** 2 + CW[2] * (a[2] - b[2]) ** 2;
// Median cut: repeatedly splits the box of colours with the biggest weighted spread at its popularity-median.
export function medianCut(colours, k) { // colours: [{c:[r,g,b], n}]
  let boxes = [colours.slice()];
  const spread = (box) => {
    let best = 0, ch = 0;
    for (let c = 0; c < 3; c++) {
      let lo = 255, hi = 0; for (const e of box) { lo = Math.min(lo, e.c[c]); hi = Math.max(hi, e.c[c]); }
      const r = (hi - lo) * CW[c]; if (r > best) { best = r; ch = c; }
    }
    return { best, ch };
  };
  while (boxes.length < k) {
    let bi = -1, bs = 0, bch = 0;
    boxes.forEach((box, i) => {
      if (box.length < 2) return;
      const { best, ch } = spread(box), pop = box.reduce((s, e) => s + e.n, 0), score = best * Math.sqrt(pop);
      if (score > bs) { bs = score; bi = i; bch = ch; }
    });
    if (bi < 0) break;
    const box = boxes[bi].slice().sort((a, b) => a.c[bch] - b.c[bch] || a.c[0] - b.c[0] || a.c[1] - b.c[1] || a.c[2] - b.c[2]);
    const pop = box.reduce((s, e) => s + e.n, 0);
    let acc = 0, cut = 1;
    for (let i = 0; i < box.length - 1; i++) { acc += box[i].n; cut = i + 1; if (acc * 2 >= pop) break; }
    boxes.splice(bi, 1, box.slice(0, cut), box.slice(cut));
  }
  return boxes.map((box) => {
    const pop = box.reduce((s, e) => s + e.n, 0);
    return [0, 1, 2].map((c) => snap9(box.reduce((s, e) => s + e.c[c] * e.n, 0) / pop));
  });
}

// Snap to the 9-bit grid, then reduce to at most maxColours (keeping a dark outline colour). Edits strip.d in place.
export function quantise(strip, maxColours = 15) {
  const d = strip.d, counts = new Map();
  let opaque = 0, distinctBefore = new Set(), changed = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) { d[i] = d[i + 1] = d[i + 2] = 0; continue; }
    d[i + 3] = 255; opaque++;
    distinctBefore.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
    const r = snap9(d[i]), g = snap9(d[i + 1]), b = snap9(d[i + 2]);
    if (r !== d[i] || g !== d[i + 1] || b !== d[i + 2]) changed++;
    d[i] = r; d[i + 1] = g; d[i + 2] = b;
    const key = (r << 16) | (g << 8) | b;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const entries = [...counts].sort((a, b) => a[0] - b[0]).map(([key, n]) => ({ c: [key >> 16, (key >> 8) & 255, key & 255], n }));
  const info = { opaque, colourCountBefore: distinctBefore.size, colourCountSnapped: entries.length, snappedPixels: changed, finalCount: entries.length, error: 0 };
  if (entries.length <= maxColours) return info;
  // Keep the outline: the darkest colour that is common enough to be an outline.
  let outline = null;
  for (const e of entries) if (luma(...e.c) < 90 && e.n >= opaque * 0.015 && (!outline || luma(...e.c) < luma(...outline.c))) outline = e;
  const rest = outline ? entries.filter((e) => e !== outline) : entries;
  const palette = medianCut(rest, outline ? maxColours - 1 : maxColours);
  if (outline) palette.push(outline.c);
  const uniq = [...new Map(palette.map((c) => [c.join(), c])).values()];
  const cache = new Map();
  let err = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const key = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
    let m = cache.get(key);
    if (!m) {
      let bd = 1e18; const c = [d[i], d[i + 1], d[i + 2]];
      for (const p of uniq) { const v = cdist(c, p); if (v < bd) { bd = v; m = p; } }
      cache.set(key, m);
    }
    err += Math.hypot(d[i] - m[0], d[i + 1] - m[1], d[i + 2] - m[2]);
    d[i] = m[0]; d[i + 1] = m[1]; d[i + 2] = m[2];
  }
  info.error = err / opaque;
  info.finalCount = new Set(Array.from({ length: d.length / 4 }, (_, p) => d[p * 4 + 3] ? (d[p * 4] << 16) | (d[p * 4 + 1] << 8) | d[p * 4 + 2] : -1).filter((v) => v >= 0)).size;
  return info;
}

// ---------- output pictures ----------
export function encodeStrip(img) { return encodePng(img.w, img.h, img.d); }
// 4x enlargement on a dark backdrop with frame edges, the ground line and the feet point marked on empty pixels only.
export function makePreview(strip, slot, scale = 4) {
  const W = strip.w * scale, H = strip.h * scale, out = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const cell = Math.floor(x / scale / slot.fw), o = (y * W + x) * 4;
    const sx = Math.floor(x / scale), sy = Math.floor(y / scale), si = (sy * strip.w + sx) * 4;
    if (strip.d[si + 3]) { out[o] = strip.d[si]; out[o + 1] = strip.d[si + 1]; out[o + 2] = strip.d[si + 2]; out[o + 3] = 255; continue; }
    const tone = cell % 2 ? 50 : 58;
    let c = [tone, tone, tone + 14];
    const lx = x % (slot.fw * scale), ly = y;
    if (lx === 0 && cell > 0) c = [110, 110, 130];
    else if (slot.feet && ly === (slot.py + 1) * scale - 1) c = [40, 110, 60];
    else if (Math.abs(lx - (slot.px * scale + scale / 2)) < 1.5 && Math.abs(ly - ((slot.py + 0.5) * scale)) < scale * 1.5 && slot.feet) c = [200, 60, 60];
    out[o] = c[0]; out[o + 1] = c[1]; out[o + 2] = c[2]; out[o + 3] = 255;
  }
  return encodePng(W, H, out);
}

// ---------- the main pipeline ----------
const hueFamily = (r, g, b) => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (mx - mn < 24) return mx < 80 ? 'dark neutral' : mx > 200 ? 'light neutral' : 'grey';
  let h;
  if (mx === r) h = ((g - b) / (mx - mn) + 6) % 6; else if (mx === g) h = (b - r) / (mx - mn) + 2; else h = (r - g) / (mx - mn) + 4;
  h *= 60;
  return h < 20 || h >= 340 ? 'red' : h < 45 ? 'orange' : h < 70 ? 'yellow' : h < 165 ? 'green' : h < 200 ? 'cyan' : h < 260 ? 'blue' : h < 340 ? 'purple/pink' : 'red';
};
function families(d) {
  const f = new Map();
  for (let i = 0; i < d.length; i += 4) if (d[i + 3]) { const k = hueFamily(d[i], d[i + 1], d[i + 2]); f.set(k, (f.get(k) || 0) + 1); }
  const tot = [...f.values()].reduce((a, b) => a + b, 0) || 1;
  return [...f].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 3).map(([k, n]) => `${k} ${Math.round(100 * n / tot)}%`);
}

const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; };

// importArt(buffer, options) -> { verdict, strip (PNG bytes or null), preview, report, warnings, problems, changes, img, slot }
// options: slot (object from loadSlots/adhocSlot, required), bg, tolerance, cols, rows, frames, srcPixel, height, scale,
//          anchorX, shrink, relayout, name, referenceStrip (Buffer, optional, for the colour hint), inputName
export function importArt(buf, options) {
  const slot = Object.assign({}, options.slot);
  if (options.frames) slot.frames = +options.frames;
  if (options.anchorX != null) slot.px = +options.anchorX;
  if (options.feet === false) slot.feet = false;
  if (slot.scroll !== undefined) throw new Error('background bands (sky, skyline, treeline ...) repeat sideways and are not supported by the importer yet; draw those by hand');
  const N = slot.frames, SW = slot.fw * N, SH = slot.fh;
  const changes = [], warnings = [], problems = [], asks = [];
  const result = (extra) => finish(Object.assign({ slot, changes, warnings, problems, asks, options }, extra));

  let dec;
  try { dec = decodeAnyPng(buf); } catch (e) { problems.push(e.message); return result({ img: null, srcInfo: null }); }
  const srcInfo = { w: dec.width, h: dec.height, format: dec.format };
  let img = { w: dec.width, h: dec.height, d: dec.px };
  changes.push(`Read your picture: ${fmt(img.w)} x ${fmt(img.h)} px (${dec.format}).`);

  // --- already the right size and see-through? keep the layout, just tidy colours ---
  const clearPx = (() => { let c = 0; for (let i = 3; i < img.d.length; i += 4) if (img.d[i] < 128) c++; return c; })();
  const exact = img.w === SW && img.h === SH && clearPx > 0 && !options.relayout;
  let strip;
  let colourSource;
  if (exact) {
    changes.push(`It is already exactly ${SW} x ${SH} px with see-through background, so I kept your layout and only tidied the colours.`);
    strip = cloneImg(img);
    colourSource = strip;
  } else {
    // --- background ---
    let bgInfo;
    if (options.bg) bgInfo = { kind: 'solid', colours: String(options.bg).split(',').map(parseHex) };
    else bgInfo = detectBackground(img);
    const tol = options.tolerance != null ? +options.tolerance : 40;
    if (bgInfo.kind === 'unknown') {
      problems.push('I could not tell what the background is (the edges of the picture are not one flat colour or a checkerboard).');
      asks.push('Ask for a flat solid background in one colour with nothing else on it, for example pure magenta #ff00ff, and no shadows, gradients or ground.');
      return result({ img: null, srcInfo });
    }
    if (bgInfo.kind === 'transparent') {
      changes.push('The background is already see-through; kept it.');
      img = removeSpecks(img, 0).img;
    } else {
      const r = removeBackground(img, bgInfo.colours, tol, options.fringe != null ? +options.fringe : 1);
      img = r.img;
      const names = bgInfo.colours.map((c) => hex(...c)).join(' and ');
      changes.push(`Removed the ${bgInfo.kind === 'checker' ? 'checkerboard' : 'solid'} background (${names}${options.bg ? ', as you asked' : ', found automatically'}); it was ${Math.round(r.removedShare * 100)}% of the picture.`);
    }
    const sp = removeSpecks(img);
    img = sp.img;
    if (sp.specks) changes.push(`Cleaned away ${sp.specks} stray speck(s) left over from the background.`);
    const solidBox = opaqueBBox(img);
    if (!solidBox) { problems.push('Nothing was left after removing the background.'); asks.push('Ask for the character to be clearly different in colour from the background.'); return result({ img: null, srcInfo }); }

    // --- frames (found on the full-size picture) ---
    const fr = findFrames(img, N, { cols: options.cols ? +options.cols : 0, rows: options.rows ? +options.rows : 0 });
    if (fr.fatal) { problems.push(fr.fatal); return result({ img: null, srcInfo }); }
    warnings.push(...fr.warnings);
    changes.push(`Found ${N} frame(s): ${fr.how}.`);
    let frames = [];
    for (let i = 0; i < fr.regions.length; i++) {
      const rg = fr.regions[i], bb = opaqueBBox(img, rg.x0, rg.y0, rg.x1, rg.y1);
      if (!bb) { problems.push(`Frame ${i + 1} is empty (nothing drawn where I expected it).`); asks.push('Ask for exactly ' + N + ' frames with the same character in every one, with clear space between them.'); return result({ img: null, srcInfo }); }
      const sub = mkImg(rg.x1 - rg.x0, rg.y1 - rg.y0);
      for (let y = 0; y < sub.h; y++) sub.d.set(img.d.subarray(((rg.y0 + y) * img.w + rg.x0) * 4, ((rg.y0 + y) * img.w + rg.x1) * 4), y * sub.w * 4);
      frames.push({ rg, sub, bbSrc: bb });
    }
    // Ground line per row of the sheet, measured on the full-size picture (so a second row of a sheet is not "in the air").
    const groundOf = new Map();
    for (const f of frames) groundOf.set(f.rg.y0, Math.max(groundOf.get(f.rg.y0) || 0, f.bbSrc.y1));
    for (const f of frames) f.groundSrc = groundOf.get(f.rg.y0);

    // --- pixel grid / reduction (each frame may sit on its own grid offset) ---
    let gridFactor = 1;
    const big = img.w > SW * 1.5 || img.h > SH * 1.5 || options.srcPixel;
    const grid = big ? detectPixelGrid(frames.map((f) => f.sub), options.srcPixel ? +options.srcPixel : null) : null;
    if (grid && grid.n > 1) {
      frames.forEach((f, i) => {
        const ph = grid.phases[i], ox = ph.x ? ph.x - grid.n : 0, oy = ph.y ? ph.y - grid.n : 0;
        f.sub = resample(f.sub, grid.n, ox, oy, Math.ceil((f.sub.w - ox) / grid.n), Math.ceil((f.sub.h - oy) / grid.n));
      });
      gridFactor = grid.n;
      changes.push(`Found the real pixel size: each art pixel in your picture is ${grid.n} x ${grid.n} screen pixels${options.srcPixel ? ' (you told me)' : ''}. Shrank the picture by ${grid.n} to get back to true pixels.`);
    } else if (big) {
      changes.push('No clean pixel grid found (the picture is smooth or painterly), so I shrank it to size instead.');
    }
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      f.bb = opaqueBBox(f.sub);
      if (!f.bb) { problems.push(`Frame ${i + 1} disappeared when shrinking (it is too faint or too small).`); return result({ img: null, srcInfo }); }
      f.bh = f.bb.y1 - f.bb.y0;
      f.lift = (f.groundSrc - f.bbSrc.y1) / gridFactor; // how far above its row's ground line this frame ends, in true pixels
    }

    // --- scale, ground line and anchors ---
    const feet = slot.feet;
    const unionH = Math.max(...frames.map((f) => f.bh + (feet ? f.lift : 0)));
    const dcx = feet ? slot.px + 0.5 : (slot.px === 0 && slot.py === 0 ? slot.fw / 2 : slot.px);
    const dcy = feet ? slot.py + 1 : (slot.px === 0 && slot.py === 0 ? slot.fh / 2 : slot.py);
    let targetH;
    if (options.height) targetH = +options.height;
    else if (feet) targetH = slot.fh >= 32 ? Math.round(slot.fh * 40 / 48) : slot.fh - 2;
    else targetH = slot.fh - 2;
    for (const f of frames) {
      if (feet) { // where the feet are: the middle of the lowest 12% of the figure
        const band = Math.max(2, Math.round(f.bh * 0.12));
        let sum = 0, cnt = 0;
        for (let y = f.bb.y1 - band; y < f.bb.y1; y++) for (let x = 0; x < f.sub.w; x++) if (f.sub.d[(y * f.sub.w + x) * 4 + 3]) { sum += x + 0.5; cnt++; }
        f.ax = cnt ? sum / cnt : (f.bb.x0 + f.bb.x1) / 2;
      } else { f.ax = (f.bb.x0 + f.bb.x1) / 2; f.ay = (f.bb.y0 + f.bb.y1) / 2; }
    }
    let s;
    if (options.scale) s = 1 / (+options.scale * gridFactor);
    else if (options.height) s = unionH / targetH;
    else s = Math.max(1, unionH / targetH);
    const needS = (sNow) => { // smallest box size that keeps every frame inside the cell
      let need = sNow;
      for (const f of frames) {
        need = Math.max(need, (f.ax - f.bb.x0) / dcx, (f.bb.x1 - f.ax) / (slot.fw - dcx));
        if (feet) need = Math.max(need, (f.bh + f.lift) / (slot.py + 1));
        else need = Math.max(need, (f.ay - f.bb.y0) / dcy, (f.bb.y1 - f.ay) / (slot.fh - dcy));
      }
      return need;
    };
    if (Math.abs(s - 1) < 0.02) s = 1;
    const sFit = needS(s);
    if (sFit > s * 1.0001) {
      if (options.shrink) { s = Math.ceil(sFit * 1000) / 1000; if (Math.abs(s - 1) < 0.02) s = 1; changes.push('The subject was too big for the cell, so I shrank it a little more to fit (--shrink).'); }
      else {
        const wouldBe = Math.round(unionH / sFit);
        problems.push(`The character does not fit in a ${slot.fw} x ${slot.fh} cell at the planned size: a pose is too wide or too tall, and part of it would be cut off. Run it again with --shrink to scale everything down to fit (about ${wouldBe} px tall).`);
        asks.push('Ask for poses that stay narrower (arms and legs closer to the body), or accept a smaller character with --shrink.');
        return result({ img: null, srcInfo });
      }
    }
    const totalScale = gridFactor * s;
    changes.push(s === 1 && gridFactor > 1
      ? `Scale: the character is ${Math.round(unionH)} px tall at true pixel size, so no further shrinking was needed.`
      : `Scaled the character from ${fmt(unionH * gridFactor)} px to ${fmt(unionH / s)} px tall (1 pixel in the result = ${(Math.round(totalScale * 10) / 10)} px of your picture).`);
    if (!options.height && !options.scale && s === 1 && unionH < targetH * 0.7) warnings.push(`The character is only ${Math.round(unionH)} px tall (about ${targetH} is normal for this slot). I did not enlarge it. Ask for a larger image, or use --height ${targetH} to enlarge.`);
    const tip = `To match other strips of the same character, use --scale ${(1 / totalScale).toPrecision(3)} (game pixels per source pixel)`;

    // --- draw each frame into its cell ---
    strip = mkImg(SW, SH);
    const snapTol = 1.2; // in result pixels
    let snapped = 0;
    frames.forEach((f, i) => {
      let ox, oy;
      if (feet) {
        const lifted = f.lift / s;
        let up = 0;
        if (lifted > snapTol) up = Math.round(lifted); else if (lifted > 0.25) snapped++;
        ox = f.ax - dcx * s; oy = f.bb.y1 + up * s - dcy * s;
      } else { ox = f.ax - dcx * s; oy = f.ay - dcy * s; }
      if (s === 1) { ox = Math.round(ox); oy = Math.round(oy); }
      const cell = resample(f.sub, s, ox, oy, slot.fw, slot.fh);
      for (let y = 0; y < slot.fh; y++) strip.d.set(cell.d.subarray(y * slot.fw * 4, (y + 1) * slot.fw * 4), (y * SW + i * slot.fw) * 4);
    });
    if (feet) changes.push(`Put the feet of every frame on row ${slot.py} and centred them on column ${slot.px}${options.anchorX != null ? ' (your --anchor-x)' : ''}.`);
    else changes.push(`Centred the art in each ${slot.fw} x ${slot.fh} cell.`);
    if (snapped) changes.push(`Straightened the ground line: ${snapped} frame(s) had feet sitting about 1 px off the others and were lined up.`);
    colourSource = strip;
    changes.tip = tip;
  }

  // --- colours ---
  const q = quantise(strip, options.colours ? +options.colours : 15);
  if (q.snappedPixels > 0) changes.push(`Snapped colours to the game's 16-bit palette (${fmt(q.snappedPixels)} pixels moved to the nearest allowed shade).`);
  if (q.colourCountSnapped > (options.colours ? +options.colours : 15)) {
    changes.push(`Reduced ${fmt(q.colourCountBefore)} colours to ${q.finalCount} (one palette line allows 15), keeping the darkest colour for the outline.`);
    if (q.colourCountSnapped > 60 || q.error > 30) warnings.push(`The picture needed a lot of colours (${fmt(q.colourCountBefore)}), so the reduced version may look blotchy. Ask the art tool for a limited palette (about 12 colours) and flat shading.`);
    if (q.error > 60) { problems.push('The colours were too varied to reduce cleanly (the result would look muddy).'); asks.push('Ask for flat colours with a limited palette (about 12 colours) and no gradients, glow, texture or lighting effects.'); }
  } else if (q.opaque) changes.push(`Colours: ${q.finalCount} (limit 15).`);
  strip.q = q;
  return result({ img: strip, srcInfo, exact });
}

function analyse(strip, slot, warnings, notes, exact) {
  const { fw, fh } = slot, N = slot.frames, st = [];
  for (let i = 0; i < N; i++) {
    const bb = opaqueBBox(strip, i * fw, 0, (i + 1) * fw, fh);
    st.push(bb && { w: bb.x1 - bb.x0, h: bb.y1 - bb.y0, top: bb.y0, bottom: bb.y1 - 1, left: bb.x0 - i * fw, right: bb.x1 - 1 - i * fw });
  }
  const real = st.filter(Boolean);
  if (real.length < N) warnings.push(`${N - real.length} frame(s) came out empty.`);
  if (!real.length) return st;
  const loops = slot.loop === 'loop';
  const mh = median(real.map((s) => s.h)), mw = median(real.map((s) => s.w));
  st.forEach((s, i) => {
    if (!s) return;
    if (loops && (Math.abs(s.h - mh) > Math.max(4, mh * 0.15) || Math.abs(s.w - mw) > Math.max(6, mw * 0.25))) warnings.push(`Frame ${i + 1} is a different size from the others (${s.w} x ${s.h} px against a typical ${mw} x ${mh}). In a looping animation that shows as a jump.`);
    if (s.left === 0 || s.right === fw - 1 || s.top === 0) warnings.push(`Frame ${i + 1} touches the edge of its cell, so part of it may be cut off.`);
  });
  if (loops) {
    const tops = real.map((s) => s.top), drift = Math.max(...tops) - Math.min(...tops);
    if (drift > 2) (exact ? notes : warnings).push(`The head/top moves ${drift} px up and down between frames (more than 2 px can look like jitter in a loop; fine for a run or bounce).`);
  }
  if (slot.feet) {
    const base = slot.py, off = st.map((s, i) => (s ? [i, base - s.bottom] : null)).filter((v) => v && v[1] !== 0);
    const wobble = off.filter(([, d]) => d < 0 || d === 1), air = off.filter(([, d]) => d >= 2);
    const say = (l) => l.map(([i, d]) => `frame ${i + 1} (${d > 0 ? d + ' px above' : -d + ' px below'})`).join(', ');
    if (wobble.length) (exact ? notes : warnings).push(`Feet wobble: not exactly on the ground line (row ${base}) in ${say(wobble)}.`);
    if (air.length) notes.push(`Off the ground line (row ${base}) in ${say(air)}. Normal for jumps, steps and falls; if the character should be standing, regenerate those frames.`);
  }
  return st;
}

function outlineShare(strip) {
  const { w, h, d } = strip, count = new Map();
  let edge = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (!d[i + 3]) continue;
    const open = (xx, yy) => xx < 0 || yy < 0 || xx >= w || yy >= h || !d[(yy * w + xx) * 4 + 3];
    if (open(x - 1, y) || open(x + 1, y) || open(x, y - 1) || open(x, y + 1)) {
      edge++;
      const key = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
      count.set(key, (count.get(key) || 0) + 1);
    }
  }
  if (!edge) return null;
  let bk = 0, bn = -1;
  for (const [k, n] of count) if (n > bn) { bn = n; bk = k; }
  return { share: bn / edge, colour: [bk >> 16, (bk >> 8) & 255, bk & 255] };
}

function finish(ctx) {
  const { slot, changes, warnings, problems, asks, options, img, srcInfo } = ctx;
  const notes = [];
  let st = null, pngBytes = null, preview = null, checks = [];
  if (img) {
    st = analyse(img, slot, warnings, notes, ctx.exact);
    const ol = outlineShare(img);
    if (ol && (luma(...ol.colour) > 110 || ol.share < 0.5)) warnings.push(`The edge of the character does not have a clear 1 px dark outline (${Math.round(ol.share * 100)}% of edge pixels are ${hex(...ol.colour)}). The style guide wants a dark outline on every sprite.`);
    pngBytes = encodeStrip(img);
    checks = checkPng(pngBytes, slot.fw * slot.frames, slot.fh);
    for (const c of checks) problems.push('Internal check failed: ' + c);
    preview = makePreview(img, slot);
  }
  if (!img && !problems.length) problems.push('Nothing could be made.');
  const verdict = problems.length ? 'REDO' : warnings.length ? 'READY WITH WARNINGS' : 'READY';
  const L = [];
  const fileName = slot.path ? path.posix.basename(slot.path) : 'custom-strip.png';
  L.push(`ART IMPORT REPORT: ${options.inputName || 'your picture'} -> ${slot.key}`);
  L.push(`Target: ${slot.fw * slot.frames} x ${slot.fh} px = ${slot.frames} frame(s) of ${slot.fw} x ${slot.fh}, facing right, ${slot.feet ? `feet at (${slot.px}, ${slot.py})` : `centre at (${slot.px}, ${slot.py})`}. File: ${fileName}`);
  if (srcInfo) L.push(`Your picture: ${fmt(srcInfo.w)} x ${fmt(srcInfo.h)} px, ${srcInfo.format}`);
  L.push('');
  L.push('VERDICT: ' + verdict);
  if (verdict === 'READY') L.push('This strip is game-ready. Look at the 4x preview to make sure it looks right, then install it.');
  if (verdict === 'READY WITH WARNINGS') L.push('The strip works, but check the warnings below and the 4x preview. If they bother you, regenerate and try again.');
  if (verdict === 'REDO') L.push('This one cannot be made game-ready from this picture. See below for what to ask the art tool for.');
  L.push('');
  if (changes.length) { L.push('What I did:'); for (const c of changes) L.push('  - ' + c); L.push(''); }
  if (changes.tip) { L.push('Tip: ' + changes.tip + '.'); L.push(''); }
  if (warnings.length) { L.push('Warnings:'); for (const w of warnings) L.push('  - ' + w); L.push(''); }
  if (notes.length) { L.push('Notes:'); for (const w of notes) L.push('  - ' + w); L.push(''); }
  if (problems.length) {
    L.push('Problems:'); for (const p of problems) L.push('  - ' + p); L.push('');
    L.push('What to ask the art tool for:');
    for (const a of [...new Set(asks)]) L.push('  - ' + a);
    L.push('  - Keep the same character, same size and same facing (right) in every frame; see design/ART_PROMPTS.md.');
    L.push('');
  }
  if (img && img.q) {
    L.push(`Result: ${slot.fw * slot.frames} x ${slot.fh} px, ${img.q.finalCount} colour(s), see-through background, all colours on the 9-bit grid.`);
    L.push('Repo check (same as the scanner): ' + (checks.length ? checks.join('; ') : 'passed, no problems.'));
    if (options.referenceStrip) {
      try {
        const ref = decodeAnyPng(options.referenceStrip);
        L.push(`Colour hint only (not a rule): Sammy's run strip is mostly ${families(ref.px).join(', ')}; this one is ${families(img.d).join(', ')}.`);
      } catch (e) { /* hint only */ }
    }
  }
  return { verdict, strip: pngBytes, preview, report: L.join('\n') + '\n', warnings, problems, changes, img, slot, stats: st, checks };
}

// ---------- command line ----------
const HELP = `Art importer: turns a picture from an image tool into a game-ready strip.

Usage (from the game/ folder):
  node tools/import-art.mjs <picture.png> --slot <key> [options]

Examples:
  node tools/import-art.mjs ~/Downloads/jogger-walk.png --slot jogger:walk
  node tools/import-art.mjs sheet.png --slot jogger:defeat --cols 4 --rows 2 --bg "#ff00ff"
  node tools/import-art.mjs thing.png --size 32x32 --frames 4 --pivot 16,31 --feet   (art with no slot yet)

Slot (what the art is for):
  --slot <key>        a key from src/assets.js, such as jogger:walk, vendor:throw, projectile:hotdog
  --size WxH --frames N --pivot x,y [--feet|--no-feet]   describe a slot by hand
  --list              print every slot key with its size

Picture:
  --bg "#rrggbb"      the background colour (default: found automatically; "#a,#b" for two checker colours)
  --tolerance N       how close to the background colour counts as background (default 40)
  --cols N --rows M   the picture is a sheet of N across and M down (frames read left to right, top to bottom)
  --frames N          number of frames (default: from the slot)
  --src-pixel N       each art pixel in your picture is N x N pixels (default: found automatically)
  --height H          make the character H px tall (default: about 40 px in a 48 px cell; never enlarges unless you ask)
  --scale K           exact scale factor (game pixels per source pixel), to match a strip you already made
  --anchor-x X        put the feet centre on column X (default: the slot's feet column)
  --shrink            if a pose is too big for the cell, shrink everything to fit instead of stopping
  --relayout          re-process even when the picture is already the right size
  --colours N         colour limit (default 15)

Output:
  --out <dir>         where to write (default ./import-out/)
  --dry-run           print the report only; write nothing
  --install           also copy the strip into assets/ (never overwrites unless --force)
  --version N         with --install: save as -vNN (for example --version 2) instead of -v01
  --force             allow --install to overwrite an existing file

JPG or WebP? Convert first. On a Mac: sips -s format png "in.jpg" --out out.png
`;

function parseArgs(argv) {
  const o = { _: [] }, flags = new Set(['dry-run', 'install', 'force', 'shrink', 'feet', 'no-feet', 'relayout', 'help', 'list']);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      if (flags.has(k)) o[k] = true;
      else { if (i + 1 >= argv.length) throw new Error(`--${k} needs a value`); o[k] = argv[++i]; }
    } else o._.push(a);
  }
  return o;
}

export function main(argv) {
  let a;
  try { a = parseArgs(argv); } catch (e) { console.error(e.message); return 2; }
  const slots = loadSlots();
  if (a.help || (!a._.length && !a.list)) { console.log(HELP); return a.help ? 0 : 2; }
  if (a.list) { for (const s of Object.values(slots)) console.log(`${s.key.padEnd(24)} ${s.fw * s.frames}x${s.fh}  (${s.frames} frame(s) of ${s.fw}x${s.fh}, pivot ${s.px},${s.py})`); return 0; }
  const input = a._[0];
  let slot;
  try {
    if (a.slot) {
      slot = slots[a.slot];
      if (!slot) {
        const near = Object.keys(slots).filter((k) => k.split(':')[0] === a.slot.split(':')[0] || k.includes(a.slot)).slice(0, 8);
        console.error(`No slot called "${a.slot}". ${near.length ? 'Did you mean: ' + near.join(', ') + '? ' : ''}Run with --list to see them all.`);
        return 2;
      }
    } else if (a.size) slot = adhocSlot({ size: a.size, frames: a.frames || 1, pivot: a.pivot, feet: !a['no-feet'] });
    else { console.error('Tell me what the art is for: --slot <key> (see --list), or --size WxH --frames N --pivot x,y.'); return 2; }
    if (a.pivot && a.slot) { const [x, y] = a.pivot.split(',').map(Number); slot = { ...slot, px: x, py: y }; }
    if (a.size && a.slot) { const m = /^(\d+)x(\d+)$/.exec(a.size); if (m) slot = { ...slot, fw: +m[1], fh: +m[2] }; }
  } catch (e) { console.error(e.message); return 2; }
  let buf;
  try { buf = fs.readFileSync(input); } catch (e) { console.error(`Cannot open "${input}": ${e.message}`); return 2; }
  const refPath = path.join(repoDir, 'assets', 'characters', 'character-sammy', 'sammy-run-strip-v01.png');
  let res;
  try {
    res = importArt(buf, {
      slot, bg: a.bg, tolerance: a.tolerance, cols: a.cols, rows: a.rows, frames: a.frames && a.slot ? a.frames : undefined,
      srcPixel: a['src-pixel'], height: a.height, scale: a.scale, anchorX: a['anchor-x'], shrink: a.shrink, relayout: a.relayout,
      colours: a.colours, feet: a['no-feet'] ? false : undefined, inputName: path.basename(input),
      referenceStrip: fs.existsSync(refPath) ? fs.readFileSync(refPath) : undefined,
    });
  } catch (e) { console.error('Problem: ' + e.message); return 2; }
  console.log(res.report);
  const fileName = slot.path ? path.posix.basename(slot.path) : 'custom-strip-v01.png';
  const base = fileName.replace(/\.png$/, '');
  if (a['dry-run']) { console.log('(dry run: nothing was written)'); return res.verdict === 'REDO' ? 1 : 0; }
  const outDir = path.resolve(a.out || 'import-out');
  fs.mkdirSync(outDir, { recursive: true });
  const reportPath = path.join(outDir, base + '-report.txt');
  fs.writeFileSync(reportPath, res.report);
  if (!res.strip) { console.log('Wrote ' + reportPath); return 1; }
  const stripPath = path.join(outDir, fileName);
  fs.writeFileSync(stripPath, res.strip);
  fs.writeFileSync(path.join(outDir, base + '-preview-4x.png'), res.preview);
  console.log(`Wrote ${stripPath}\n      ${path.join(outDir, base + '-preview-4x.png')}\n      ${reportPath}`);
  if (a.install) {
    if (!slot.path) { console.log('Cannot install: this is a hand-described slot with no file name in the manifest.'); return 1; }
    if (res.verdict === 'REDO') { console.log('Not installed: the verdict is REDO.'); return 1; }
    let rel = slot.path;
    if (a.version) rel = rel.replace(/-v\d+(?=\.png$)/, '-v' + String(a.version).padStart(2, '0'));
    const dest = path.join(repoDir, 'assets', rel);
    if (fs.existsSync(dest) && !a.force) {
      console.log(`Not installed: ${path.relative(repoDir, dest)} already exists. Add --force to replace it, or --version ${(/-v(\d+)\.png$/.exec(rel) || [0, 1])[1] * 1 + 1} to save it as a newer version (the highest number wins).`);
      return 1;
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(stripPath, dest);
    console.log('Installed: ' + path.relative(repoDir, dest));
    let rows = [];
    try { rows = parseCsv(fs.readFileSync(path.join(repoDir, 'design', 'ASSET_SOURCES.csv'), 'utf8')); } catch (e) { /* no csv */ }
    console.log('\nAdd this row to design/ASSET_SOURCES.csv (fill in who made it and the license):');
    console.log(suggestRow('assets/' + rel, rows));
    console.log('\nThen from the game/ folder: node tools/scan-assets.mjs   (and node tools/build.mjs when you want a fresh shareable copy).');
  } else if (res.verdict !== 'REDO' && slot.path) {
    console.log(`\nLooks good? Run the same command again with --install to copy it into assets/${slot.path}.`);
  }
  return res.verdict === 'REDO' ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
