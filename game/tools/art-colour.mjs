// Colour tools for the art importer's character mode: clean-up (saturation, contrast, hue shifts, recolours, the
// "keep away from the game's gore colours" rule), a deterministic shared palette (weighted k-means), palette files.
// Pure functions, no files read here (except loadGoreColours), same input -> same output. No packages needed (Node 18+).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

export const GRID = 36;
export const snap9 = (v) => Math.min(252, Math.max(0, Math.round(v / GRID) * GRID));
export const luma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
export const hex6 = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
export function parseHex6(s) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(s).trim());
  if (!m) throw new Error(`"${s}" is not a colour like #ff00ff`);
  const v = parseInt(m[1], 16); return [v >> 16, (v >> 8) & 255, v & 255];
}
const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const smooth = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

export function rgbToHsv(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d > 0) {
    if (mx === r) h = ((g - b) / d + 6) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, mx === 0 ? 0 : d / mx, mx / 255];
}
export function hsvToRgb(h, s, v) {
  h = ((h % 360) + 360) % 360;
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  let r, g, b;
  if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0]; else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c]; else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

// ---------- the game's reserved gore colours ----------
// Reads S.PAL from src/config.js (never typed twice). Returns { blood:[[r,g,b]..], ichor:[...], bone, meat, all }.
export function loadGoreColours(gameDir) {
  const ctx = {}; ctx.globalThis = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(gameDir, 'src', 'config.js'), 'utf8'), ctx);
  const P = ctx.SAMMY.PAL, get = (k) => parseHex6(P[k]);
  const g = { blood: ['blood0', 'blood', 'bloodHi'].map(get), ichor: ['ichor0', 'ichor', 'ichorHi'].map(get), bone: get('bone'), meat: get('meat') };
  g.all = [...g.blood, ...g.ichor, g.bone, g.meat];
  return g;
}

// ---------- the clean-up transform ----------
// Builds f(r, g, b) -> [r, g, b] (floats) that applies, in order: recolours, hue shifts, saturation, contrast, lift, gore avoidance.
// opts: recolor [{from, to, tol}], hueShifts [{lo, hi, delta}], saturation (1 = none), contrast (1 = none), lift (0 = none),
//       avoidIchor, avoidBlood. `stats` (optional) collects how many pixels the gore rule moved, by source colour.
export function makeTransform(opts = {}, stats = null) {
  const rec = (opts.recolor || []).map((r) => ({ from: r.from, to: r.to, tol: r.tol || 70 }));
  const hs = opts.hueShifts || [], sat = opts.saturation != null ? +opts.saturation : 1, con = opts.contrast != null ? +opts.contrast : 1, lift = +opts.lift || 0;
  const out = [0, 0, 0];
  if (stats && !stats.moved) stats.moved = new Map();
  return (r0, g0, b0) => {
    let r = r0, g = g0, b = b0, moved = false;
    for (const e of rec) {
      const d = Math.hypot(r - e.from[0], g - e.from[1], b - e.from[2]);
      if (d < e.tol * 1.5) {
        const w = d <= e.tol ? 1 : 1 - (d - e.tol) / (e.tol * 0.5);
        r += (e.to[0] - e.from[0]) * w; g += (e.to[1] - e.from[1]) * w; b += (e.to[2] - e.from[2]) * w;
      }
    }
    if (hs.length || sat !== 1 || con !== 1 || lift || opts.avoidIchor || opts.avoidBlood) {
      let [h, s, v] = rgbToHsv(clamp255(r), clamp255(g), clamp255(b));
      for (const e of hs) {
        const inside = e.lo <= e.hi ? h >= e.lo && h <= e.hi : h >= e.lo || h <= e.hi;
        if (inside && s > 0.12) h += e.delta;
      }
      s = Math.min(1, s * sat);
      if (con !== 1) v = Math.max(0, Math.min(1, (v - 0.4) * con + 0.4));
      if (lift) v = v + (1 - v) * lift * (1 - v) * 2.2; // brightens the dark and middle tones, leaves the highlights alone
      if (opts.avoidIchor) {
        const hh = ((h % 360) + 360) % 360;
        const hw = Math.min(smooth(62, 68, hh), 1 - smooth(106, 118, hh)); // acid yellow-green to green (the ichor family; plain yellow stays yellow)
        const w = hw * smooth(0.34, 0.58, s) * smooth(0.2, 0.38, v);
        if (w > 0.001) {
          const th = 172, ts = Math.min(s, 0.5) * 0.42, tv = v * 0.95; // grey-teal
          const dh = ((th - hh + 540) % 360) - 180;
          h = hh + dh * w; s = s + (ts - s) * w; v = v + (tv - v) * w;
          if (stats && w > 0.5) { stats.ichor = (stats.ichor || 0) + 1; moved = true; }
        }
      }
      if (opts.avoidBlood) {
        const hh = ((h % 360) + 360) % 360, hd = Math.min(hh, 360 - hh);
        const w = (1 - smooth(10, 22, hd)) * smooth(0.7, 0.85, s) * smooth(0.18, 0.3, v) * (1 - smooth(0.7, 0.8, v)); // dark, saturated red
        if (w > 0.001) {
          h = hh + 22 * w; s = s * (1 - 0.3 * w);
          if (stats && w > 0.5) { stats.blood = (stats.blood || 0) + 1; moved = true; }
        }
      }
      [r, g, b] = hsvToRgb(h, s, v);
    }
    out[0] = clamp255(r); out[1] = clamp255(g); out[2] = clamp255(b);
    if (stats && moved) { // remember what the gore rule changed, by source colour, for the report
      const k = ((r0 >> 4) << 8) | ((g0 >> 4) << 4) | (b0 >> 4);
      let e = stats.moved.get(k);
      if (!e) { e = { n: 0, from: [r0, g0, b0], to: [out[0], out[1], out[2]] }; stats.moved.set(k, e); }
      e.n++;
    }
    return out;
  };
}

// ---------- palette ----------
const CW = [0.5, 1, 0.8];
const wdist = (a, b) => { const x = (a[0] - b[0]) * CW[0], y = (a[1] - b[1]) * CW[1], z = (a[2] - b[2]) * CW[2]; return x * x + y * y + z * z; };
export const nearestIndex = (c, palette) => { let bi = 0, bd = 1e18; for (let i = 0; i < palette.length; i++) { const d = wdist(c, palette[i]); if (d < bd) { bd = d; bi = i; } } return bi; };

// Colour histogram in 32 x 32 x 32 bins. add(r, g, b) per pixel; points() gives [{c:[r,g,b] (mean), n}] in bin order.
export function makeHistogram() {
  const n = new Float64Array(32768), sr = new Float64Array(32768), sg = new Float64Array(32768), sb = new Float64Array(32768);
  return {
    add(r, g, b) { const k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3); n[k]++; sr[k] += r; sg[k] += g; sb[k] += b; },
    points() { const p = []; for (let k = 0; k < 32768; k++) if (n[k]) p.push({ c: [sr[k] / n[k], sg[k] / n[k], sb[k] / n[k]], n: n[k] }); return p; },
  };
}

// Weighted k-means with a fixed start (the heaviest colour, then always the point farthest from the chosen ones) and 24 rounds.
// Same input gives the same answer. Weights are n^0.8 so small bright details (eyes, a red hat) still get a colour.
export function kmeans(points, k, rounds = 24) {
  if (!points.length) return [];
  const W = points.map((p) => Math.pow(p.n, 0.8));
  let first = 0; for (let i = 1; i < points.length; i++) if (W[i] > W[first]) first = i;
  const cs = [points[first].c.slice()];
  const dmin = points.map((p) => wdist(p.c, cs[0]));
  while (cs.length < Math.min(k, points.length)) {
    let bi = -1, bs = -1;
    for (let i = 0; i < points.length; i++) { const sc = dmin[i] * Math.pow(points[i].n, 0.35); if (sc > bs) { bs = sc; bi = i; } }
    if (bs <= 0) break;
    cs.push(points[bi].c.slice());
    for (let i = 0; i < points.length; i++) dmin[i] = Math.min(dmin[i], wdist(points[i].c, cs[cs.length - 1]));
  }
  for (let it = 0; it < rounds; it++) {
    const sum = cs.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < points.length; i++) {
      const b = nearestIndex(points[i].c, cs), s = sum[b], w = W[i];
      s[0] += points[i].c[0] * w; s[1] += points[i].c[1] * w; s[2] += points[i].c[2] * w; s[3] += w;
    }
    let moved = 0;
    cs.forEach((c, i) => { if (sum[i][3]) { const n = [sum[i][0] / sum[i][3], sum[i][1] / sum[i][3], sum[i][2] / sum[i][3]]; moved += dist(n, c); cs[i] = n; } });
    if (moved < 0.01) break;
  }
  return cs;
}

// Snaps centres to the 9-bit grid, removes duplicates, sorts dark to light. `used` (optional) maps centre -> pixel count.
export function finishPalette(centres) {
  const seen = new Map();
  for (const c of centres) { const s = [snap9(c[0]), snap9(c[1]), snap9(c[2])]; seen.set(s.join(), s); }
  return [...seen.values()].sort((a, b) => luma(...a) - luma(...b) || a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
}

// Makes sure `colour` is in the palette (limit `max`). Returns { palette, replaced } ; replaced = the colour that made room, if any.
export function ensureColour(palette, colour, max, usage) {
  const key = colour.join();
  if (palette.some((c) => c.join() === key)) return { palette: palette.slice(), replaced: null };
  if (palette.length < max) return { palette: [...palette, colour].sort((a, b) => luma(...a) - luma(...b)), replaced: null };
  // full: give up the least-used colour that is closest to the new one
  let bi = 0, bs = 1e18;
  palette.forEach((c, i) => { const s = (usage ? usage[i] : 1) * 1000 + dist(c, colour); if (s < bs) { bs = s; bi = i; } });
  const rep = palette[bi], out = palette.slice(); out[bi] = colour;
  return { palette: out.sort((a, b) => luma(...a) - luma(...b)), replaced: rep };
}

// Two colours are "the same hue" when both are coloured and their hues differ by less than 9 degrees (a yellow is not an acid green).
function sameHue(a, b) {
  const [ha, sa] = rgbToHsv(...a), [hb, sb] = rgbToHsv(...b);
  if (sa < 0.2 || sb < 0.2) return true;
  const d = Math.abs(ha - hb);
  return Math.min(d, 360 - d) < 9;
}

// Palette colours that sit too close to a reserved gore colour are nudged lighter (never darker) until they are clear of it.
export function keepClearOf(palette, reserved, minDist = 44) {
  const moves = [];
  const out = palette.map((c) => {
    let cur = c.slice();
    for (let n = 0; n < 6; n++) {
      const hit = reserved.find((r) => dist(cur, r) < minDist && sameHue(cur, r));
      if (!hit) break;
      const away = [0, 1, 2].map((i) => cur[i] - hit[i]);
      const dir = Math.hypot(...away) < 1 ? [1, 1, 1] : away;
      const norm = Math.hypot(...dir);
      cur = cur.map((v, i) => snap9(v + dir[i] / norm * GRID * 1.2));
    }
    if (cur.join() !== c.join()) moves.push([c, cur]);
    return cur;
  });
  return { palette: [...new Map(out.map((c) => [c.join(), c])).values()].sort((a, b) => luma(...a) - luma(...b)), moves };
}

// A palette colour that lands EXACTLY on a reserved gore colour (bone, meat, blood, ichor) moves one grid step: of the six
// single-channel neighbours, the one that changes the hue least, then the brightness least. (Sammy's cream face snaps to the
// same value as the bone colour, for example; it becomes a slightly warmer cream.) Returns { palette, moves }.
export function nudgeOffReserved(palette, reserved) {
  const moves = [];
  const isRes = (c) => reserved.some((r) => r.join() === c.join());
  const hueGap = (a, b) => { const [ha, sa] = rgbToHsv(...a), [hb, sb] = rgbToHsv(...b); if (sa < 0.08 || sb < 0.08) return 0; const d = Math.abs(ha - hb); return Math.min(d, 360 - d); };
  const out = palette.map((c) => {
    if (!isRes(c)) return c;
    const options = [];
    for (let ch = 0; ch < 3; ch++) for (const step of [-GRID, GRID]) {
      const n = c.slice(); n[ch] = c[ch] + step;
      if (n[ch] < 0 || n[ch] > 252 || isRes(n)) continue;
      options.push({ n, hue: hueGap(c, n), lum: Math.abs(luma(...c) - luma(...n)) });
    }
    options.sort((a, b) => a.hue - b.hue || a.lum - b.lum || a.n.join().localeCompare(b.n.join()));
    const pick = options.length ? options[0].n : c;
    if (pick !== c) moves.push([c, pick]);
    return pick;
  });
  return { palette: [...new Map(out.map((c) => [c.join(), c])).values()].sort((a, b) => luma(...a) - luma(...b)), moves };
}

// Palette files: { "colours": ["#rrggbb", ...], "outline": "#rrggbb" }
export function paletteToJson(palette, outline) { return JSON.stringify({ colours: palette.map(hex6), outline: outline ? hex6(outline) : null }, null, 2) + '\n'; }
export function paletteFromJson(text) {
  const j = JSON.parse(text);
  if (!j || !Array.isArray(j.colours) || !j.colours.length) throw new Error('a palette file must look like {"colours": ["#242448", ...]}');
  const palette = finishPalette(j.colours.map(parseHex6));
  if (palette.length > 15) throw new Error(`the palette file has ${palette.length} colours; the limit is 15`);
  return { palette, outline: j.outline ? parseHex6(j.outline) : null };
}
