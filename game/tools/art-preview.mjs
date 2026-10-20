// Pictures for the art importer's reports: palette swatch, before/after strip comparison, contact sheet.
// Images are { w, h, d } with RGBA bytes. No packages needed (Node 18+).
import { png as encodePng } from './png-writer.mjs';
import { hex6 } from './art-colour.mjs';

const mk = (w, h, fill) => { const d = new Uint8Array(w * h * 4); for (let i = 0; i < w * h; i++) d.set(fill, i * 4); return { w, h, d }; };
export const toPng = (img) => encodePng(img.w, img.h, img.d);

// Draws `src` (RGBA, alpha 0/255) enlarged k times onto `dst` at (x, y). Clear pixels show the checker backdrop when `back` is given.
export function blit(dst, src, x, y, k, back) {
  for (let sy = 0; sy < src.h; sy++) for (let sx = 0; sx < src.w; sx++) {
    const si = (sy * src.w + sx) * 4;
    const solid = src.d[si + 3] > 0;
    if (!solid && !back) continue;
    for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) {
      const X = x + sx * k + dx, Y = y + sy * k + dy;
      if (X < 0 || Y < 0 || X >= dst.w || Y >= dst.h) continue;
      const o = (Y * dst.w + X) * 4;
      if (solid) { dst.d[o] = src.d[si]; dst.d[o + 1] = src.d[si + 1]; dst.d[o + 2] = src.d[si + 2]; dst.d[o + 3] = 255; }
      else { const t = back(sx, sy); dst.d[o] = t[0]; dst.d[o + 1] = t[1]; dst.d[o + 2] = t[2]; dst.d[o + 3] = 255; }
    }
  }
}

const cellBack = (fw) => (sx) => { const c = Math.floor(sx / fw) % 2; return c ? [50, 50, 66] : [58, 58, 72]; };
export const pickScale = (w, max = 2400) => Math.max(1, Math.min(4, Math.floor(max / w)));

// A strip enlarged on the dark cell backdrop with frame borders, optionally the feet line.
export function stripPreview(strip, slot, k) {
  const out = mk(strip.w * k, strip.h * k, [40, 40, 52]);
  blit(out, strip, 0, 0, k, cellBack(slot.fw));
  for (let f = 1; f < strip.w / slot.fw; f++) for (let y = 0; y < out.h; y++) out.d.set([110, 110, 130, 255], (y * out.w + f * slot.fw * k) * 4);
  if (slot.feet) { // the ground line, drawn on empty backdrop only
    const y = (slot.py + 1) * k - 1;
    for (let x = 0; x < out.w; x++) { const o = (y * out.w + x) * 4; if (!strip.d[((Math.floor(y / k)) * strip.w + Math.floor(x / k)) * 4 + 3]) out.d.set([40, 110, 60, 255], o); }
  }
  return out;
}

// "Before" (the picture as it came, shrunk the plain way) above "after" (the strip), both enlarged.
export function compareImage(before, after, slot, k) {
  const gap = 6, W = after.w * k, H = before.h * k + gap + after.h * k;
  const out = mk(W, H, [24, 24, 32]);
  blit(out, before, 0, 0, k, cellBack(slot.fw));
  blit(out, after, 0, before.h * k + gap, k, cellBack(slot.fw));
  return out;
}

// Rows of strips stacked, each enlarged k times, left aligned.
export function contactSheet(strips, k) {
  const W = Math.max(...strips.map((s) => s.img.w)) * k, gap = 6;
  const H = strips.reduce((a, s) => a + s.img.h * k + gap, gap);
  const out = mk(W, H, [24, 24, 32]);
  let y = gap;
  for (const s of strips) { blit(out, s.img, 0, y, k, cellBack(s.fw)); y += s.img.h * k + gap; }
  return out;
}

// The shared palette as big squares (outline colour first, marked with a light frame).
export function swatchImage(palette, outline) {
  const sq = 48, pad = 6, W = (sq + pad) * Math.max(1, palette.length) + pad, H = sq + pad * 2;
  const out = mk(W, H, [24, 24, 32]);
  palette.forEach((c, i) => {
    const x0 = pad + i * (sq + pad), isOut = outline && c.join() === outline.join();
    for (let y = 0; y < sq; y++) for (let x = 0; x < sq; x++) {
      const edge = isOut && (x < 2 || y < 2 || x >= sq - 2 || y >= sq - 2);
      out.d.set(edge ? [255, 255, 255, 255] : [c[0], c[1], c[2], 255], ((pad + y) * W + x0 + x) * 4);
    }
  });
  return out;
}
export const paletteLine = (palette) => palette.map(hex6).join(' ');
