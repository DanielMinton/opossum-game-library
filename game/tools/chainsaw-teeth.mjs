// Paints the chain back onto the steel bar of Sammy's three chainsaw strips. The importer's area vote turns the source's dark
// chain and 2 px white teeth into a 1-3 px band of fur-coloured pixels between the grey bar and the 1 px outline. This pass is
// deterministic: from every steel pixel it walks outwards (up, down, left, right) through that band (at most 3 px) until it
// reaches open air. The outline pixel next to the air is left alone (the outline rule: every edge pixel stays `#242400`); the
// pixel just inside it becomes a tooth (light on every other column/row, dark between), and the band under the tooth the dark
// steel chain. Where the bar is right against the outline the bar's own outer row carries the teeth instead. Where the bar meets
// the paws or the engine the walk never reaches open air, so nothing changes there. A phase per frame shifts the pattern by one
// so the chain runs on repeated poses.
//
// Usage (from game/):  node tools/chainsaw-teeth.mjs <strip.png> <cellWidth> [phases, e.g. 0,0,1,1]
// Rewrites the strip in place. v03: idle no phases (one pose held), run 0,1,0,1,0,1,0,1, rev 0,0,1,1.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodeAnyPng } from './png.mjs';
import { png } from './png-writer.mjs';

export const STEEL = ['#b4b4b4', '#6c6c6c'];
export const OUTLINE = [36, 36, 0]; // #242400, the shared Sammy outline
export const LIGHT = [252, 252, 216], CHAIN = [108, 108, 108];
const MAX_BAND = 3;

const hexOf = (d, i) => '#' + [d[i], d[i + 1], d[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('');

// Paints into img.px in place. Returns counts: { teeth, chain, skipped } (skipped = paints refused because they were edge pixels).
export function paintTeeth(img, fw, phases = []) {
  const W = img.width, H = img.height, d = img.px, n = Math.floor(W / fw);
  const steel = new Set(STEEL);
  const at = (x, y) => (y * W + x) * 4;
  const clear = (x, y) => x < 0 || y < 0 || x >= W || y >= H || d[at(x, y) + 3] < 128;
  // The edge mask is taken before anything is painted: an edge pixel is solid with open air on one of its four sides.
  const edge = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!clear(x, y) && (clear(x - 1, y) || clear(x + 1, y) || clear(x, y - 1) || clear(x, y + 1))) edge[y * W + x] = 1;
  }
  const paint = [];
  for (let f = 0; f < n; f++) {
    const phase = phases[f] || 0, x0 = f * fw, x1 = (f + 1) * fw;
    for (let y = 0; y < H; y++) for (let x = x0; x < x1; x++) {
      if (clear(x, y) || !steel.has(hexOf(d, at(x, y)))) continue;
      for (const [dx, dy] of [[0, -1], [0, 1], [1, 0], [-1, 0]]) {
        const band = [];
        let xx = x + dx, yy = y + dy;
        while (band.length < MAX_BAND && !clear(xx, yy) && !steel.has(hexOf(d, at(xx, yy))) && xx >= x0 && xx < x1) { band.push([xx, yy]); xx += dx; yy += dy; }
        if (!band.length || !clear(xx, yy) || xx < x0 || xx >= x1) continue;
        // band[last] touches the air: it is the outline and stays. The tooth goes just inside it, or on the bar's own edge row.
        const [tx, ty] = band.length >= 2 ? band[band.length - 2] : [x, y];
        const k = dy ? tx : ty;
        paint.push([tx, ty, (k + phase) % 2 === 0 ? LIGHT : OUTLINE, 'teeth']);
        for (const [bx, by] of band.slice(0, -2)) paint.push([bx, by, CHAIN, 'chain']);
      }
    }
  }
  const counts = { teeth: 0, chain: 0, skipped: 0 };
  for (const [x, y, c, kind] of paint) {
    if (edge[y * W + x]) { counts.skipped++; continue; }
    const i = at(x, y); d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; counts[kind]++;
  }
  return counts;
}

// Every solid pixel with open air on one of its four sides, in a colour other than the outline (0 after the importer and after this pass).
export function badEdgePixels(img, outline = OUTLINE) {
  const W = img.width, H = img.height, d = img.px;
  const at = (x, y) => (y * W + x) * 4;
  const clear = (x, y) => x < 0 || y < 0 || x >= W || y >= H || d[at(x, y) + 3] < 128;
  let bad = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (clear(x, y) || !(clear(x - 1, y) || clear(x + 1, y) || clear(x, y - 1) || clear(x, y + 1))) continue;
    const i = at(x, y);
    if (d[i] !== outline[0] || d[i + 1] !== outline[1] || d[i + 2] !== outline[2]) bad++;
  }
  return bad;
}

export function main(argv) {
  const [file, fwS, phaseS] = argv;
  if (!file || !fwS || !(+fwS > 0)) {
    console.log('Usage: node tools/chainsaw-teeth.mjs <strip.png> <cellWidth> [phases e.g. 0,0,1,1]');
    return 2;
  }
  const img = decodeAnyPng(fs.readFileSync(file));
  const phases = (phaseS || '').split(',').filter(Boolean).map(Number);
  const counts = paintTeeth(img, +fwS, phases);
  fs.writeFileSync(file, png(img.width, img.height, img.px));
  const bad = badEdgePixels(img);
  console.log(`${path.basename(file)}: ${counts.teeth} teeth, ${counts.chain} chain pixels, ${counts.skipped} edge pixels left as outline; ${bad} edge pixels off the outline colour`);
  return bad ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
