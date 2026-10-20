// Art importer tests (tools/import-art.mjs). Run from the game/ folder:  node --test tests/import-art.test.mjs
// Every picture is built here in code: a small pixel-art zombie, blown up and spoiled the way image tools do it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { png } from '../tools/png-writer.mjs';
import { decodeAnyPng, checkPng } from '../tools/png.mjs';
import { importArt, loadSlots, adhocSlot, detectPixelGrid, medianCut, quantise, main } from '../tools/import-art.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const slots = loadSlots();

// ----- test pictures -----
const OUT = [20, 20, 40], SKIN = [110, 150, 120], CLOTH = [200, 60, 60], BAND = [250, 230, 60], SHOE = [150, 110, 80], HAIR = [60, 40, 30];
// A 24 x 40 pixel-art zombie; `f` moves the legs and arm so frames differ. Returns rows of [r,g,b] or null.
function zombie(f) {
  const W = 24, H = 40, g = Array.from({ length: H }, () => Array(W).fill(null));
  const fill = (x0, y0, x1, y1, c) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) g[y][x] = c; };
  fill(8, 2, 16, 11, SKIN); fill(8, 2, 16, 4, HAIR); fill(8, 5, 16, 6, BAND); // head
  fill(7, 11, 17, 25, CLOTH); // body
  const sw = [0, 2, 0, -2][f % 4];
  fill(9 + sw, 25, 12 + sw, 38, SKIN); fill(13 - sw, 25, 16 - sw, 38, SKIN); // legs
  fill(8 + sw, 38, 13 + sw, 40, SHOE); fill(12 - sw, 38, 17 - sw, 40, SHOE);
  fill(17 + (f % 3), 12, 21 + (f % 3), 15 + (f % 2), SKIN); // arm
  const out = g.map((r) => r.slice());
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (g[y][x]) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && g[yy][xx]) out[y][x] = OUT; }
  }
  return out;
}
const ZW = 24, ZH = 40;
let seed = 12345;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

// Paints frames onto a canvas of RGBA bytes. mode: 'nearest' (crisp k-times pixel art) or 'smooth' (bilinear blur).
function paintSheet({ frames, k, cols, rows, gapPx, margin, bg, mode = 'nearest', noise = 0, jitterY = 0 }) {
  const cw = ZW * k + gapPx, ch = ZH * k + gapPx;
  const W = margin * 2 + cols * cw, H = margin * 2 + rows * ch, d = new Uint8Array(W * H * 4);
  const bgAt = (x, y) => (typeof bg === 'function' ? bg(x, y) : bg);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) d.set([...bgAt(x, y), 255], (y * W + x) * 4);
  frames.forEach((fr, n) => {
    const col = n % cols, row = Math.floor(n / cols), ox = margin + col * cw + (gapPx >> 1), oy = margin + row * ch + (gapPx >> 1) + ((n * 7) % (jitterY + 1));
    for (let y = 0; y < ZH * k; y++) for (let x = 0; x < ZW * k; x++) {
      let c;
      if (mode === 'nearest') c = fr[Math.floor(y / k)][Math.floor(x / k)];
      else { // bilinear between pixel centres; mixes with the background colour at the edges (fringe)
        const fx = (x + 0.5) / k - 0.5, fy = (y + 0.5) / k - 0.5, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
        const at = (xx, yy) => (xx < 0 || yy < 0 || xx >= ZW || yy >= ZH ? null : fr[yy][xx]);
        const parts = [[at(x0, y0), (1 - tx) * (1 - ty)], [at(x0 + 1, y0), tx * (1 - ty)], [at(x0, y0 + 1), (1 - tx) * ty], [at(x0 + 1, y0 + 1), tx * ty]];
        const cover = parts.reduce((s, [p, w]) => s + (p ? w : 0), 0);
        if (cover < 0.5) continue;
        c = [0, 1, 2].map((i) => Math.round(parts.reduce((s, [p, w]) => s + (p ? p[i] * w : 0), 0) / cover));
      }
      if (!c) continue;
      if (noise) c = c.map((v) => Math.max(0, Math.min(255, Math.round(v + (rnd() - 0.5) * noise))));
      d.set([...c, 255], ((oy + y) * W + ox + x) * 4);
    }
  });
  return { W, H, d, png: png(W, H, d) };
}

const frames6 = Array.from({ length: 6 }, (_, i) => zombie(i));
const frames8 = Array.from({ length: 8 }, (_, i) => zombie(i));
const MAGENTA = [255, 0, 255];
const checker = (x, y) => ((Math.floor(x / 16) + Math.floor(y / 16)) % 2 ? [255, 255, 255] : [204, 204, 204]);

function checkStrip(res, slot) {
  assert.ok(res.strip, 'a strip was made: ' + res.report);
  const W = slot.fw * slot.frames, H = slot.fh;
  assert.deepEqual(checkPng(res.strip, W, H), [], 'repo check passes');
  const dec = decodeAnyPng(res.strip);
  assert.equal(dec.width, W); assert.equal(dec.height, H);
  const colours = new Set();
  for (let i = 0; i < dec.px.length; i += 4) {
    const a = dec.px[i + 3];
    assert.ok(a === 0 || a === 255, 'alpha is 0 or 255');
    if (a) {
      for (let c = 0; c < 3; c++) assert.equal(dec.px[i + c] % 36, 0, 'colour on the 9-bit grid');
      colours.add((dec.px[i] << 16) | (dec.px[i + 1] << 8) | dec.px[i + 2]);
    }
  }
  assert.ok(colours.size <= 15, colours.size + ' colours');
  assert.ok(colours.size >= 3, 'still has several colours');
  // every frame has art, and its lowest solid pixel is on the feet row
  for (let f = 0; f < slot.frames; f++) {
    let lowest = -1, count = 0;
    for (let y = 0; y < H; y++) for (let x = f * slot.fw; x < (f + 1) * slot.fw; x++) if (dec.px[(y * W + x) * 4 + 3]) { lowest = y; count++; }
    assert.ok(count > 100, `frame ${f} has art`);
    if (slot.feet) assert.equal(lowest, slot.py, `frame ${f} stands on row ${slot.py}`);
  }
  return dec;
}
const run = (pic, slotKey, extra = {}) => importArt(pic.png, { slot: slots[slotKey], ...extra });
function same(a, b) { assert.ok(a.strip && b.strip); assert.ok(Buffer.compare(a.strip, b.strip) === 0, 'same bytes twice'); assert.equal(a.report, b.report); }

test('slots are read from the game manifest, not typed twice', () => {
  assert.equal(slots['jogger:walk'].frames, 6);
  assert.equal(slots['jogger:walk'].fw, 48);
  assert.equal(slots['sammy:run'].px, 28);
  assert.equal(slots['pickup:chainsaw'].fw, 32);
  const a = adhocSlot({ size: '32x32', frames: 4, pivot: '16,31' });
  assert.deepEqual([a.fw, a.fh, a.frames, a.px, a.py, a.feet], [32, 32, 4, 16, 31, true]);
});

test('blurry upscaled sprite on a flat magenta background becomes a clean strip', () => {
  seed = 1;
  const pic = paintSheet({ frames: frames6, k: 9, cols: 6, rows: 1, gapPx: 60, margin: 30, bg: MAGENTA, mode: 'smooth', jitterY: 5 });
  const res = run(pic, 'jogger:walk');
  const dec = checkStrip(res, slots['jogger:walk']);
  assert.notEqual(res.verdict, 'REDO', res.report);
  assert.match(res.report, /Removed the solid background \(#ff00ff/);
  assert.match(res.report, /Scaled the character from/);
  assert.match(res.report, /Found 6 frame/);
  // magenta fringe must be gone
  for (let i = 0; i < dec.px.length; i += 4) if (dec.px[i + 3]) assert.ok(!(dec.px[i] >= 216 && dec.px[i + 1] <= 36 && dec.px[i + 2] >= 216), 'no magenta left');
  same(res, run(pic, 'jogger:walk'));
});

test('checkerboard background and crisp pixel art: real pixel size is recovered exactly', () => {
  const pic = paintSheet({ frames: frames6, k: 8, cols: 6, rows: 1, gapPx: 48, margin: 24, bg: checker, mode: 'nearest' });
  const res = run(pic, 'jogger:walk');
  checkStrip(res, slots['jogger:walk']);
  assert.match(res.report, /checkerboard background/);
  assert.match(res.report, /each art pixel in your picture is 8 x 8/);
  // the original 24 x 40 sprite is reproduced pixel for pixel (no blur, no new colours)
  const dec = decodeAnyPng(res.strip);
  const colours = new Set();
  for (let i = 0; i < dec.px.length; i += 4) if (dec.px[i + 3]) colours.add(dec.px.slice(i, i + 3).join());
  assert.ok(colours.size <= 8, 'the sprite only has its own few colours: ' + colours.size);
  let solid = 0; for (let i = 3; i < dec.px.length; i += 4) if (dec.px[i]) solid++;
  let want = 0; for (const f of frames6) for (const r of f) for (const c of r) if (c) want++;
  assert.equal(solid, want, 'same number of solid pixels as the source art');
  same(res, run(pic, 'jogger:walk'));
});

test('blurry sprite on a fake-transparency checkerboard (the common image-tool result)', () => {
  const pic = paintSheet({ frames: frames6.slice(0, 4), k: 11, cols: 4, rows: 1, gapPx: 70, margin: 40, bg: checker, mode: 'smooth' });
  const res = run(pic, 'jogger:idle');
  checkStrip(res, slots['jogger:idle']);
  assert.match(res.report, /checkerboard/);
  same(res, run(pic, 'jogger:idle'));
});

test('a 2 x 4 contact sheet is cut into 8 frames in reading order', () => {
  const pic = paintSheet({ frames: frames8, k: 6, cols: 4, rows: 2, gapPx: 50, margin: 20, bg: MAGENTA, mode: 'nearest' });
  for (const extra of [{ cols: 4, rows: 2 }, {}]) { // told, and worked out by itself
    const res = run(pic, 'jogger:defeat', extra);
    checkStrip(res, slots['jogger:defeat']);
    assert.match(res.report, /Found 8 frame/);
    // frame order: frame 1 and frame 5 (second row, first column) must differ from each other the way the source frames do
    const dec = decodeAnyPng(res.strip), W = 384;
    const sig = (f) => { let s = ''; for (let y = 0; y < 48; y++) for (let x = f * 48; x < f * 48 + 48; x++) s += dec.px[(y * W + x) * 4 + 3] ? '1' : '0'; return s; };
    assert.notEqual(sig(0), sig(1));
    assert.notEqual(sig(0), sig(4));
    same(res, run(pic, 'jogger:defeat', extra));
  }
});

test('a picture with about 500 colours is reduced to 15 or fewer, keeping the outline colour', () => {
  seed = 7;
  const pic = paintSheet({ frames: frames6, k: 8, cols: 6, rows: 1, gapPx: 48, margin: 24, bg: MAGENTA, mode: 'nearest', noise: 70 });
  const dec0 = decodeAnyPng(pic.png);
  const before = new Set(); for (let i = 0; i < dec0.px.length; i += 4) before.add(dec0.px.slice(i, i + 3).join());
  assert.ok(before.size > 500, 'test picture really has many colours: ' + before.size);
  const res = run(pic, 'jogger:walk');
  const dec = checkStrip(res, slots['jogger:walk']);
  assert.match(res.report, /Reduced [\d,]+ colours to \d+/);
  let darkest = 999;
  for (let i = 0; i < dec.px.length; i += 4) if (dec.px[i + 3]) darkest = Math.min(darkest, dec.px[i] + dec.px[i + 1] + dec.px[i + 2]);
  assert.ok(darkest < 200, 'a dark outline colour survived');
  same(res, run(pic, 'jogger:walk'));
});

test('an already-correct strip passes through with identical pixels', () => {
  const W = 288, H = 48, px = new Uint8Array(W * H * 4);
  const cols = [[36, 36, 72], [108, 144, 108], [216, 72, 72], [252, 216, 0], [252, 252, 252]];
  for (let f = 0; f < 6; f++) for (let y = 8; y < 48; y++) for (let x = 14; x < 34; x++) {
    const i = (y * W + f * 48 + x) * 4, edge = x === 14 || x === 33 || y === 8 || y === 47;
    px.set([...(edge ? cols[0] : cols[1 + ((x + y + f) % 4)]), 255], i);
  }
  const src = png(W, H, px);
  const res = importArt(src, { slot: slots['jogger:walk'] });
  assert.ok(res.strip);
  assert.match(res.report, /already exactly 288 x 48/);
  assert.deepEqual(Array.from(decodeAnyPng(res.strip).px), Array.from(px));
  assert.deepEqual(checkPng(res.strip, W, H), []);
});

test("Sammy's approved run strip is unchanged by importing it into sammy:run", () => {
  const p = path.join(here, '..', '..', 'assets', 'characters', 'character-sammy', 'sammy-run-strip-v01.png');
  if (!fs.existsSync(p)) return; // the file is part of the repo; skip only in odd checkouts
  const src = fs.readFileSync(p), res = importArt(src, { slot: slots['sammy:run'] });
  assert.ok(res.strip);
  assert.equal(res.verdict, 'READY');
  assert.deepEqual(Array.from(decodeAnyPng(res.strip).px), Array.from(decodeAnyPng(src).px));
  assert.deepEqual(checkPng(res.strip, 384, 48), []);
});

test('problems are explained: jpg input, too-wide poses, unclear background, missing frames', () => {
  const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(40)]);
  const r1 = importArt(jpg, { slot: slots['jogger:walk'] });
  assert.equal(r1.verdict, 'REDO');
  assert.match(r1.report, /sips -s format png/);
  // noise: no single colour at the edges
  const W = 200, H = 100, d = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) d.set([Math.floor(rnd() * 256), Math.floor(rnd() * 256), Math.floor(rnd() * 256), 255], (y * W + x) * 4);
  const r2 = importArt(png(W, H, d), { slot: slots['jogger:idle'] });
  assert.equal(r2.verdict, 'REDO');
  assert.match(r2.report, /could not tell what the background is/);
  // a wide sprite that cannot fit its cell: stops, and --shrink fixes it
  const wide = new Uint8Array(100 * 60 * 4);
  for (let y = 5; y < 55; y++) for (let x = 5; x < 95; x++) wide.set(x === 5 || y === 5 || x === 94 || y === 54 ? [36, 36, 36, 255] : [108, 180, 108, 255], (y * 100 + x) * 4);
  const bg = new Uint8Array(100 * 60 * 4); for (let i = 0; i < bg.length; i += 4) bg.set([255, 0, 255, 255], i);
  for (let i = 0; i < bg.length; i += 4) if (wide[i + 3]) bg.set(wide.subarray(i, i + 4), i);
  const r3 = importArt(png(100, 60, bg), { slot: slots['jogger:hit'], frames: 1, inputName: 'x.png' });
  assert.equal(r3.verdict, 'REDO');
  assert.match(r3.report, /--shrink/);
  const r4 = importArt(png(100, 60, bg), { slot: { ...slots['jogger:hit'], frames: 1 }, shrink: true });
  assert.ok(r4.strip && r4.verdict !== 'REDO', r4.report);
});

test('pixel grid detection and the colour tools behave', () => {
  const pic = paintSheet({ frames: [zombie(0)], k: 5, cols: 1, rows: 1, gapPx: 0, margin: 0, bg: [0, 0, 0] });
  const img = { w: pic.W, h: pic.H, d: pic.d.slice() };
  for (let i = 0; i < img.d.length; i += 4) if (img.d[i] === 0 && img.d[i + 1] === 0 && img.d[i + 2] === 0) img.d[i + 3] = 0;
  assert.equal(detectPixelGrid(img).n, 5);
  assert.equal(detectPixelGrid([img, img]).phases.length, 2);
  const cut = medianCut(Array.from({ length: 40 }, (_, i) => ({ c: [(i % 8) * 36, (i * 7 % 8) * 36, (i * 3 % 8) * 36], n: 1 + i })), 15);
  assert.ok(cut.length <= 15);
  assert.deepEqual(medianCut(Array.from({ length: 40 }, (_, i) => ({ c: [(i % 8) * 36, (i * 7 % 8) * 36, (i * 3 % 8) * 36], n: 1 + i })), 15), cut, 'deterministic');
  const strip = { w: 4, h: 1, d: Uint8Array.from([100, 100, 100, 255, 101, 99, 100, 255, 10, 10, 10, 255, 0, 0, 0, 0]) };
  quantise(strip);
  assert.deepEqual(Array.from(strip.d), [108, 108, 108, 255, 108, 108, 108, 255, 0, 0, 0, 255, 0, 0, 0, 0]);
});

test('the command line writes the strip, preview and report, and installs only when asked', () => {
  const tmp = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR || '/tmp'), 'import-art-'));
  const pic = paintSheet({ frames: frames6, k: 8, cols: 6, rows: 1, gapPx: 48, margin: 24, bg: MAGENTA });
  const input = path.join(tmp, 'in.png');
  fs.writeFileSync(input, pic.png);
  const log = console.log; let out = '';
  console.log = (...a) => { out += a.join(' ') + '\n'; };
  try {
    assert.equal(main([input, '--slot', 'jogger:walk', '--out', path.join(tmp, 'o')]), 0);
    assert.equal(main([input, '--slot', 'jogger:walk', '--dry-run', '--out', path.join(tmp, 'never')]), 0);
  } finally { console.log = log; }
  const files = fs.readdirSync(path.join(tmp, 'o')).sort();
  assert.deepEqual(files, ['zombie-jogger-walk-strip-v01-preview-4x.png', 'zombie-jogger-walk-strip-v01-report.txt', 'zombie-jogger-walk-strip-v01.png']);
  assert.ok(!fs.existsSync(path.join(tmp, 'never')), 'dry run writes nothing');
  assert.match(out, /VERDICT: READY/);
  assert.match(out, /--install/);
  const prev = decodeAnyPng(fs.readFileSync(path.join(tmp, 'o', files[0])));
  assert.deepEqual([prev.width, prev.height], [288 * 4, 48 * 4]);
  fs.rmSync(tmp, { recursive: true, force: true });
});

// ----- the decoder reads the odd PNG layouts image tools produce -----
const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const ck = (type, data) => { const t = Buffer.concat([Buffer.from(type), data]), l = Buffer.alloc(4), c = Buffer.alloc(4); l.writeUInt32BE(data.length); c.writeUInt32BE(crc32(t)); return Buffer.concat([l, t, c]); };
function rawPng(w, h, ct, depth, interlace, idatBytes, extra = []) {
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = depth; ih[9] = ct; ih[12] = interlace;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ck('IHDR', ih), ...extra.map(([t, d]) => ck(t, Buffer.from(d))), ck('IDAT', zlib.deflateSync(Buffer.from(idatBytes))), ck('IEND', Buffer.alloc(0))]);
}
test('the decoder reads greyscale, palette, 16-bit and interlaced PNGs', () => {
  const g1 = decodeAnyPng(rawPng(8, 1, 0, 1, 0, [0, 0b10100101]));
  assert.deepEqual(Array.from(g1.px.filter((_, i) => i % 4 === 0)), [255, 0, 255, 0, 0, 255, 0, 255]);
  const p4 = decodeAnyPng(rawPng(4, 1, 3, 4, 0, [0, 0x01, 0x20], [['PLTE', [255, 0, 0, 0, 255, 0, 0, 0, 255]], ['tRNS', [255, 0]]]));
  assert.deepEqual(Array.from(p4.px), [255, 0, 0, 255, 0, 255, 0, 0, 0, 0, 255, 255, 255, 0, 0, 255]);
  const rgb16 = decodeAnyPng(rawPng(2, 1, 2, 16, 0, [0, 0xff, 0x00, 0x80, 0x00, 0x00, 0x00, 0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc]));
  assert.deepEqual(Array.from(rgb16.px), [255, 128, 0, 255, 0x12, 0x56, 0x9a, 255]);
  const ga = decodeAnyPng(rawPng(2, 1, 4, 8, 0, [0, 10, 255, 200, 0]));
  assert.deepEqual(Array.from(ga.px), [10, 10, 10, 255, 200, 200, 200, 0]);
  // 5 x 5 RGB, interlaced: pixel (x, y) = (x * 40, y * 40, 7)
  const W = 5, H = 5, P = [[0, 0, 8, 8], [4, 0, 8, 8], [0, 4, 4, 8], [2, 0, 4, 4], [0, 2, 2, 4], [1, 0, 2, 2], [0, 1, 1, 2]], bytes = [];
  for (const [x0, y0, dx, dy] of P) for (let y = y0; y < H; y += dy) { const row = [0]; let any = false; for (let x = x0; x < W; x += dx) { row.push(x * 40, y * 40, 7); any = true; } if (any) bytes.push(...row); }
  const il = decodeAnyPng(rawPng(W, H, 2, 8, 1, bytes));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) assert.deepEqual(Array.from(il.px.slice((y * W + x) * 4, (y * W + x) * 4 + 4)), [x * 40, y * 40, 7, 255]);
  assert.match(il.format, /interlaced/);
  assert.throws(() => decodeAnyPng(Buffer.from('RIFF....WEBPVP8 ')), /sips -s format png/);
});
