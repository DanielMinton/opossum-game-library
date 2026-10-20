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
import os from 'node:os';
import { detectSheet, gridSplit, fitCount, draftMap, foregroundMask } from '../tools/art-detect.mjs';
import { buildCharacter, parseRecolor, parseHueShift } from '../tools/art-character.mjs';
import { loadGoreColours, makeTransform, rgbToHsv, paletteFromJson, nudgeOffReserved } from '../tools/art-colour.mjs';

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
  assert.equal(slots['sammy:run'].px, 36); // the crawl run uses a 64 px cell (2026-10-20)
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
  // Since 2026-10-20 the game's run slot is 64 wide (the crawl run from the master sheets, v02); the old v01 strip is still on disk
  // in its 48 x 48 cells, so it is imported here as a hand-described 48 x 48 slot with the old feet point (28, 47).
  const src = fs.readFileSync(p), res = importArt(src, { slot: adhocSlot({ size: '48x48', frames: 8, pivot: '28,47', feet: true }) });
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

// =====================================================================================================================
// Importer v2: character mode (--detect, --character). The pictures are painterly on purpose: soft shading, noise,
// hundreds of colours, no pixel grid, a flat dark backdrop, a row of big poses, small frames in rows and animation groups.
// =====================================================================================================================
const gameDir = path.join(here, '..');
const gore = loadGoreColours(gameDir);
let rs = 99;
const rr = () => { rs = (rs * 1664525 + 1013904223) >>> 0; return rs / 4294967296; };

// A 30 x 40 figure with no outline of its own, leaning towards +x by `lean` pixels. Returns rows of [r,g,b] or null.
function figure(f, { skin = [110, 150, 120], cloth = [200, 90, 60], lean = 4 } = {}) {
  const W = 30, H = 40, g = Array.from({ length: H }, () => Array(W).fill(null));
  const fill = (x0, y0, x1, y1, c) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) g[y][x] = c; };
  fill(9 + lean, 2, 17 + lean, 11, skin); fill(9 + lean, 2, 17 + lean, 4, [70, 50, 40]); fill(9 + lean, 5, 17 + lean, 6, [240, 220, 70]);
  fill(8 + (lean >> 1), 11, 19 + (lean >> 1), 25, cloth);
  const sw = [0, 2, 0, -2][f % 4];
  fill(10 + sw, 25, 14 + sw, 38, [60, 70, 140]); fill(15 - sw, 25, 19 - sw, 38, [60, 70, 140]);
  fill(9 + sw, 38, 15 + sw, 40, [150, 110, 80]); fill(14 - sw, 38, 20 - sw, 40, [150, 110, 80]);
  fill(19 + (f % 3) + (lean >> 1), 12, 24 + (f % 3) + (lean >> 1), 15 + (f % 2), skin);
  return g;
}
// A sheet like the image tools make: big poses on top, two rows of small frames (walk 4, attack 3, hit 2) with wider gaps between
// the animations, a noisy flat dark backdrop. truth = where every figure really is.
function painterlySheet(o = {}) {
  rs = o.seed || 99;
  const BG = [34, 39, 46], W = 1000, H = 760, d = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) d.set([BG[0] + Math.round(rr() * 3 - 1.5), BG[1] + Math.round(rr() * 3 - 1.5), BG[2] + Math.round(rr() * 3 - 1.5), 255], i * 4);
  const truth = [], groups = [4, 3, 2], k = 3, FW = 30 * k;
  const paint = (fig, ox, oy, kk) => {
    for (let y = 0; y < 40 * kk; y++) for (let x = 0; x < 30 * kk; x++) {
      const sx = o.mirror ? 29 - Math.floor(x / kk) : Math.floor(x / kk), c = fig[Math.floor(y / kk)][sx];
      if (!c) continue;
      const shade = -14 + (y / (40 * kk)) * 22 + Math.sin(x / 7) * 5;
      d.set([...c.map((v) => Math.max(0, Math.min(255, Math.round(v + shade + (rr() - 0.5) * 24)))), 255], ((oy + y) * W + ox + x) * 4);
    }
  };
  let gx = 20; const centres = [];
  groups.forEach((n, gi) => {
    const x0 = gx;
    for (let r = 0; r < 2; r++) for (let i = 0; i < n; i++) {
      const ox = x0 + i * (FW + 6), oy = 440 + r * 160, fig = figure(gi * 3 + i + r, o);
      paint(fig, ox, oy, k);
      if (o.sparks && gi === 2 && r === 0 && i === 1) for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) d.set([120, 255, 40, 255], ((oy - 30 + y) * W + ox + 30 + x) * 4);
      let bx0 = 99, bx1 = -1, by0 = 99, by1 = -1;
      fig.forEach((row, y) => row.forEach((c, x) => { if (c) { bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); } }));
      const mx0 = o.mirror ? 29 - bx1 : bx0, mx1 = o.mirror ? 29 - bx0 : bx1;
      truth.push({ group: gi, row: r, i, box: [ox + mx0 * k, oy + by0 * k, (mx1 - mx0 + 1) * k, (by1 - by0 + 1) * k] });
    }
    centres.push(x0 + (n * (FW + 6) - 6) / 2);
    gx = x0 + n * (FW + 6) + 34;
  });
  centres.forEach((cx, gi) => paint(figure(gi * 2, o), Math.round(cx - 15 * 8), 20, 8));
  return { W, H, d, png: png(W, H, d), truth, img: { w: W, h: H, d } };
}
let sheetCache = null;
const theSheet = () => (sheetCache = sheetCache || painterlySheet({ sparks: true }));
const manifest = loadSlots();
// detect, then make the slot map the way --detect does, then build
function buildFrom(sheet, opts = {}, mapEdit) {
  const det = detectSheet(sheet.img, {});
  const names = ['walk', 'attack', 'hit'], map = { slots: {} };
  det.groups.forEach((g, gi) => {
    const need = manifest['jogger:' + names[gi]].frames;
    map.slots['jogger:' + names[gi]] = { frames: fitCount(g.rows[0].frames.map((f) => ({ box: [f.box.x0, f.box.y0, f.box.x1 - f.box.x0, f.box.y1 - f.box.y0] })), need, gi === 0) };
  });
  if (mapEdit) mapEdit(map, det);
  return { det, map, res: buildCharacter({ sheet: sheet.img, map, manifest, gore, opts, sheetName: 'fixture.png' }) };
}
const solidSet = (dec) => { const s = new Set(); for (let i = 0; i < dec.px.length; i += 4) if (dec.px[i + 3]) s.add(dec.px.slice(i, i + 3).join()); return s; };
const hueZone = (palette, lo, hi, minS, minV) => palette.filter((c) => { const [h, s, v] = rgbToHsv(...c); return h >= lo && h <= hi && s >= minS && v >= minV; });

test('--detect finds the small frames, ignores the big poses, and groups them into animations', () => {
  const sh = theSheet();
  const before = new Set(); for (let i = 0; i < sh.d.length; i += 4) before.add(sh.d.slice(i, i + 3).join());
  assert.ok(before.size > 500, 'a painterly picture: ' + before.size + ' colours');
  const det = detectSheet(sh.img, {});
  assert.equal(det.heroes.length, 3, 'three big poses are ignored');
  assert.equal(det.frames.length, 18);
  assert.deepEqual(det.groups.map((g) => g.rows.map((r) => r.frames.length)), [[4, 4], [3, 3], [2, 2]]);
  assert.equal(det.rows.length, 2);
  for (const t of sh.truth) { // every real figure lies inside the box that was found for it
    const f = det.groups[t.group].rows[t.row].frames[t.i], [x, y, w, h] = t.box;
    assert.ok(f.box.x0 <= x + 3 && f.box.x1 >= x + w - 3 && f.box.y0 <= y + 3 && f.box.y1 >= y + h - 3, `figure ${t.group}.${t.row}.${t.i} is inside its box`);
  }
  const hitA = det.groups[2].rows[0].frames[1];
  assert.ok(hitA.box.y0 < hitA.body.y0 - 20, 'the loose spark above a figure was joined to it, not made a frame of its own');
  const held = fitCount([{ box: [1] }, { box: [2] }], 4, false);
  assert.equal(held.length, 2); assert.equal(held[1].hold, 3, 'a one-shot animation holds its last frame');
  assert.equal(fitCount([{ box: [1] }, { box: [2] }, { box: [3] }], 5, true).length, 5, 'a loop is stretched by ping-pong');
  // a one-shot animation far short of its frame count (8 wanted, 3 in row A) uses row B's frames too, then holds the last one
  const dm = draftMap(det, { prefix: 'jogger', slotFrames: { 'jogger:attack': 8, 'jogger:hit': 2 }, anims: ['walk', 'attack', 'hit'] });
  assert.equal(dm.slots['jogger:attack'].frames.length, 6);
  assert.equal(dm.slots['jogger:attack'].frames.reduce((n, f) => n + (f.hold || 1), 0), 8);
  assert.equal(dm.slots['jogger:hit'].frames.length, 2, 'row A alone is enough for hit');
});

test('--detect on the command line writes the overlay and a draft map, and --character builds it without hand edits', () => {
  const tmp = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'import-art-detect-'));
  const sh = theSheet(), input = path.join(tmp, 'sheet.png');
  fs.writeFileSync(input, sh.png);
  const log = console.log; let out = '';
  console.log = (...a) => { out += a.join(' ') + '\n'; };
  try {
    assert.equal(main([input, '--detect', '--out', path.join(tmp, 'o')]), 0);
    assert.deepEqual(fs.readdirSync(path.join(tmp, 'o')).sort(), ['detect-overlay.png', 'map.json']);
    const map = JSON.parse(fs.readFileSync(path.join(tmp, 'o', 'map.json'), 'utf8'));
    assert.deepEqual(Object.keys(map.slots), ['jogger:walk', 'jogger:attack', 'jogger:hit']);
    assert.equal(map.slots['jogger:walk'].frames.length, 6, 'filled up to the six frames the game slot wants');
    assert.match(map.bg, /^#[0-9a-f]{6}$/);
    assert.ok(map.scale > 0.2 && map.scale < 0.6, 'a first guess at the shared scale: ' + map.scale);
    const ov = decodeAnyPng(fs.readFileSync(path.join(tmp, 'o', 'detect-overlay.png')));
    assert.deepEqual([ov.width, ov.height], [sh.W, sh.H]);
    assert.match(out, /Found 18 small frame\(s\) in 3 animation group/);
    assert.equal(main(['--character', path.join(tmp, 'o', 'map.json'), '--out', path.join(tmp, 'c')]), 0, 'the draft map builds as it is');
    const files = fs.readdirSync(path.join(tmp, 'c'));
    for (const f of ['CHARACTER-REPORT.md', 'palette-swatch.png', 'palette.json', 'contact-sheet-4x.png', 'zombie-jogger-walk-strip-v01.png', 'zombie-jogger-walk-strip-v01-compare-4x.png', 'zombie-jogger-hit-strip-v01-report.txt']) assert.ok(files.includes(f), f + ' was written');
    assert.match(fs.readFileSync(path.join(tmp, 'c', 'CHARACTER-REPORT.md'), 'utf8'), /Verdict: READY/);
    // refuses to install over nothing it was asked to touch: no --install, nothing in assets/
    assert.ok(!files.some((f) => f.includes('installed')));
  } finally { console.log = log; }
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('--character: one shared palette, clean outline, grid and alpha rules, feet on the line, particles gone, same bytes twice', () => {
  const sh = theSheet();
  const { res, map } = buildFrom(sh);
  assert.equal(res.strips.length, 3);
  assert.ok(res.palette.length <= 15 && res.palette.length >= 6, 'palette size ' + res.palette.length);
  const palSet = new Set(res.palette.map((c) => c.join())), ol = res.outline.join();
  assert.ok(palSet.has(ol), 'the outline colour is in the palette (and counts toward the 15)');
  const union = new Set();
  for (const s of res.strips) {
    const slot = s.slot, W = slot.fw * slot.frames, H = slot.fh;
    assert.equal(s.img.w, W); assert.equal(s.img.h, H);
    assert.deepEqual(checkPng(s.png, W, H), [], 'the repo check passes for ' + s.key); // 9-bit grid, hard alpha, 15 colours
    const dec = decodeAnyPng(s.png);
    for (const c of solidSet(dec)) { assert.ok(palSet.has(c), s.key + ' uses only the shared palette'); union.add(c); }
    for (let f = 0; f < slot.frames; f++) {
      let lowest = -1, comps = 0;
      const solid = (x, y) => x >= 0 && y >= 0 && x < slot.fw && y < H && dec.px[(y * W + f * slot.fw + x) * 4 + 3] > 0;
      const seen = new Set();
      for (let y = 0; y < H; y++) for (let x = 0; x < slot.fw; x++) {
        if (!solid(x, y)) continue;
        lowest = y;
        const open = !solid(x - 1, y) || !solid(x + 1, y) || !solid(x, y - 1) || !solid(x, y + 1);
        if (open) assert.equal(dec.px.slice((y * W + f * slot.fw + x) * 4, (y * W + f * slot.fw + x) * 4 + 3).join(), ol, `${s.key} frame ${f}: every edge pixel is the outline colour`);
        if (!seen.has(y * 100 + x)) { // count 8-connected pieces
          comps++; const st = [[x, y]]; seen.add(y * 100 + x);
          while (st.length) { const [a, b] = st.pop(); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (solid(a + dx, b + dy) && !seen.has((b + dy) * 100 + a + dx)) { seen.add((b + dy) * 100 + a + dx); st.push([a + dx, b + dy]); } }
        }
      }
      assert.equal(lowest, slot.py, `${s.key} frame ${f} stands on row ${slot.py}`);
      assert.equal(comps, 1, `${s.key} frame ${f} is one piece (no loose specks)`);
    }
  }
  assert.ok(union.size >= 5 && union.size <= res.palette.length);
  assert.ok(res.strips.every((s) => s.verdict !== 'REDO'), res.strips.map((s) => s.report).join('\n'));
  const hit = res.strips.find((s) => s.key === 'jogger:hit');
  assert.match(hit.report, /Removed \d+ loose bit/, 'the report says the far-off spark was removed');
  assert.match(res.report, /Shared palette \(\d+ colours/);
  assert.ok(res.strips.every((s) => s.flicker < 0.02), 'frames do not shimmer');
  // the same input gives the same bytes
  const again = buildFrom(sh).res;
  res.strips.forEach((s, i) => assert.ok(Buffer.compare(s.png, again.strips[i].png) === 0, 'same bytes twice: ' + s.key));
  assert.equal(res.report, again.report);
  // the outline can be turned off, and a colour can be asked for
  const off = buildCharacter({ sheet: sh.img, map, manifest, gore, opts: { outline: 'off' } });
  assert.ok(off.strips[0].outlinePx === 0);
  const blue = buildCharacter({ sheet: sh.img, map, manifest, gore, opts: { outline: '#242448' } });
  assert.ok(blue.palette.some((c) => c.join() === '36,36,72'), 'a chosen outline colour joins the palette');
  assert.ok(blue.palette.length <= 15);
});

test('gore colours: acid green is moved to grey-teal, dark blood red only stays with --allow-blood', () => {
  const green = painterlySheet({ skin: [144, 216, 0], seed: 5 });
  const a = buildFrom(green).res, b = buildFrom(green, { avoidGore: false }).res;
  assert.equal(hueZone(a.palette, 68, 112, 0.5, 0.3).length, 0, 'no acid yellow-green left in ' + JSON.stringify(a.palette) + a.goreMoves.join(';'));
  assert.ok(hueZone(b.palette, 68, 112, 0.5, 0.3).length >= 1, 'with the rule off the acid green is kept');
  for (const c of a.palette) for (const r of gore.ichor) assert.ok(Math.hypot(c[0] - r[0], c[1] - r[1], c[2] - r[2]) > 44, 'clear of the reserved ichor colours');
  assert.ok(a.goreMoves.length > 0 && /->/.test(a.goreMoves[0]), 'the report lists what was moved: ' + a.goreMoves[0]);
  assert.match(a.report, /moved away from the reserved ichor/);
  const red = painterlySheet({ cloth: [144, 0, 0], seed: 6 });
  const redOf = (p) => p.filter((c) => { const [h, s, v] = rgbToHsv(...c); return (h <= 14 || h >= 346) && s >= 0.75 && v >= 0.2; });
  const r1 = buildFrom(red).res, r2 = buildFrom(red, { allowBlood: true }).res;
  assert.equal(redOf(r1.palette).length, 0, 'blood red is moved by default: ' + r1.palette.map((c) => c.join(' ')));
  assert.ok(redOf(r2.palette).length >= 1, 'blood red stays with --allow-blood');
  assert.match(r2.report, /Blood red was allowed/);
  // the exact value of a reserved colour is never in a palette (bone and meat too): it moves one grid step, keeping its hue
  const n = nudgeOffReserved([[0, 0, 0], gore.bone.slice(), gore.meat.slice()], gore.all);
  assert.equal(n.moves.length, 2);
  assert.ok(!n.palette.some((c) => gore.all.some((r) => r.join() === c.join())), 'no reserved colour left: ' + n.palette.map((c) => c.join(' ')));
  assert.deepEqual(n.moves[0][1], [252, 216, 144], 'bone cream becomes a warmer cream');
  for (const [a, b] of n.moves) assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) <= 36, 'moved by one step');
  const bony = painterlySheet({ skin: gore.bone.slice(), seed: 7 });
  const bp = buildFrom(bony).res.palette;
  assert.ok(!bp.some((c) => c.join() === gore.bone.join()), 'a bone-coloured figure is nudged off the reserved bone colour');
});

test('an enclosed pocket of background colour (inside a curled tail) is background; small dark details (eyes) are not', () => {
  // A figure painted at 3x on a flat backdrop: a body with legs, a tail that curls round into a closed loop with backdrop
  // colour inside it, and a 3 x 3 (9 x 9 painted) eye whose colour is within tolerance of the backdrop.
  const BG = [34, 39, 46], SKIN = [150, 120, 90], EYE = [36, 41, 48], k = 3, W = 300, H = 240, d = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) d.set([...BG, 255], i * 4);
  const box = (x0, y0, x1, y1, c) => { for (let y = y0 * k; y < y1 * k; y++) for (let x = x0 * k; x < x1 * k; x++) d.set([...c, 255], ((40 + y) * W + 40 + x) * 4); };
  box(20, 0, 40, 40, SKIN);            // body 20 x 40
  box(22, 36, 27, 40, [80, 60, 40]); box(33, 36, 38, 40, [80, 60, 40]); // feet
  box(0, 10, 20, 13, SKIN); box(0, 10, 3, 32, SKIN); box(0, 29, 20, 32, SKIN); // the tail: a loop 20 wide x 22 tall, 3 px thick, open side on the body
  box(28, 6, 31, 9, EYE);              // the eye, nearly backdrop-coloured
  const img = { w: W, h: H, d };
  const mask = foregroundMask(img, BG, 12);
  const at = (x, y) => mask[(40 + y * k + 1) * W + 40 + x * k + 1];
  assert.equal(at(10, 20), 0, 'the inside of the tail loop is background');
  assert.equal(at(29, 7), 1, 'the eye stays part of the figure');
  assert.equal(at(1, 20), 1, 'the tail itself is figure');
  assert.equal(at(30, 20), 1, 'the body is figure');
  // through the whole character build: the loop interior is see-through in the strip, the eye is solid and dark, no hole in the body
  const map = { slots: { 'loop:idle': { cell: [64, 64], pivot: [32, 63], feet: true, frames: [{ box: [40, 40, 120, 120] }, { box: [40, 40, 120, 120] }] } } };
  const res = buildCharacter({ sheet: img, map, manifest, gore, opts: {}, sheetName: 'loop.png' });
  const dec = decodeAnyPng(res.strips[0].png), SW = 128;
  const solid = (x, y) => x >= 0 && y >= 0 && x < 64 && y < 64 && dec.px[(y * SW + x) * 4 + 3] > 0;
  // transparent pixels that cannot be reached from the frame's edge = enclosed pockets
  const seen = new Uint8Array(64 * 64), st = [];
  for (let x = 0; x < 64; x++) for (const y of [0, 63]) if (!solid(x, y)) { seen[y * 64 + x] = 1; st.push([x, y]); }
  for (let y = 0; y < 64; y++) for (const x of [0, 63]) if (!solid(x, y) && !seen[y * 64 + x]) { seen[y * 64 + x] = 1; st.push([x, y]); }
  while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < 64 && ny < 64 && !solid(nx, ny) && !seen[ny * 64 + nx]) { seen[ny * 64 + nx] = 1; st.push([nx, ny]); } } }
  const pockets = [];
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if (!solid(x, y) && !seen[y * 64 + x]) {
    const q = [[x, y]]; seen[y * 64 + x] = 1; let n = 0;
    while (q.length) { const [a, b] = q.pop(); n++; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = a + dx, ny = b + dy; if (nx >= 0 && ny >= 0 && nx < 64 && ny < 64 && !solid(nx, ny) && !seen[ny * 64 + nx]) { seen[ny * 64 + nx] = 1; q.push([nx, ny]); } } }
    pockets.push(n);
  }
  assert.equal(pockets.length, 1, 'exactly one see-through pocket (the tail loop), no hole where the eye is: ' + JSON.stringify(pockets));
  assert.ok(pockets[0] >= 380 && pockets[0] <= 560, 'the pocket is about 21 x 24 game px (the loop interior at the shared scale): ' + pockets[0]);
  assert.ok(res.strips[0].verdict !== 'REDO', res.strips[0].report);
});

test('a big cell (96 x 96) and a new enemy type that has no game slot yet', () => {
  const sh = theSheet();
  const { res } = buildFrom(sh, { prefix: 'ogre', size: '96x96' }, (map, det) => {
    map.slots = { 'jogger:walk': { frames: det.groups[0].rows[0].frames.map((f) => ({ box: [f.box.x0, f.box.y0, f.box.x1 - f.box.x0, f.box.y1 - f.box.y0] })) } };
  });
  const s = res.strips[0];
  assert.equal(s.key, 'ogre:walk'); assert.equal(s.fileName, 'ogre-walk-strip-v01.png');
  assert.deepEqual([s.img.w, s.img.h], [384, 96]);
  assert.deepEqual(checkPng(s.png, 384, 96), []);
  const dec = decodeAnyPng(s.png);
  let top = 96, low = -1;
  for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) if (dec.px[(y * 384 + x) * 4 + 3]) { top = Math.min(top, y); low = Math.max(low, y); }
  assert.equal(low, 95); assert.ok(low - top + 1 >= 85 && low - top + 1 <= 94, 'the figure is about 90 px tall in a 96 px cell: ' + (low - top + 1));
  assert.ok(res.scale > 0.6, 'a big cell means a bigger shared scale: ' + res.scale);
  assert.ok(!s.slot.inManifest);
});

test('portrait grids are cut apart and built as one strip without a feet line', () => {
  const W = 400, H = 220, d = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) d.set([0, 0, 0, 255], i * 4);
  const want = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) {
    const x0 = c * 80 + 10 + c, y0 = r * 110 + 8 + r * 3, w = 50 + c, h = 70 - r * 4;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) d.set([90 + c * 20, 70 + r * 40 + (y % 9) * 3, 120 + ((x + y) % 7) * 4, 255], ((y0 + y) * W + x0 + x) * 4);
    want.push([x0, y0, w, h]);
  }
  const img = { w: W, h: H, d };
  assert.deepEqual(gridSplit(img, 5, 2, null), want, 'ten tight boxes, reading order');
  const tmp = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'import-art-grid-'));
  fs.writeFileSync(path.join(tmp, 'faces.png'), png(W, H, d));
  const log = console.log; console.log = () => {};
  try {
    assert.equal(main([path.join(tmp, 'faces.png'), '--grid-split', '5x2', '--size', '32x32', '--prefix', 'face', '--out', path.join(tmp, 'o')]), 0);
    const map = JSON.parse(fs.readFileSync(path.join(tmp, 'o', 'map.json'), 'utf8'));
    assert.equal(map.slots['face:faces'].frames.length, 10); assert.deepEqual(map.slots['face:faces'].cell, [32, 32]); assert.equal(map.slots['face:faces'].feet, false);
    assert.equal(main(['--character', path.join(tmp, 'o', 'map.json'), '--out', path.join(tmp, 'c')]), 0);
  } finally { console.log = log; }
  const dec = decodeAnyPng(fs.readFileSync(path.join(tmp, 'c', 'face-faces-strip-v01.png')));
  assert.deepEqual([dec.width, dec.height], [320, 32]);
  for (let f = 0; f < 10; f++) {
    let n = 0; for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if (dec.px[(y * 320 + f * 32 + x) * 4 + 3]) n++;
    assert.ok(n > 300, `portrait ${f} has art`);
  }
  assert.deepEqual(checkPng(fs.readFileSync(path.join(tmp, 'c', 'face-faces-strip-v01.png')), 320, 32), []);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('facing: a left-facing sheet is flagged, --flip fixes it', () => {
  const left = painterlySheet({ mirror: true, seed: 8 });
  const a = buildFrom(left).res;
  assert.ok(a.strips.some((s) => s.warnings.some((w) => /faces LEFT/.test(w))), 'warns about the left-facing walk');
  const b = buildFrom(left, { flip: true }).res;
  assert.ok(!b.strips.some((s) => s.warnings.some((w) => /faces LEFT/.test(w))), 'flipped, it faces right');
  assert.ok(!buildFrom(theSheet()).res.strips.some((s) => s.warnings.some((w) => /LEFT/.test(w))), 'the normal sheet is fine');
});

test('palette files, recolours and hue shifts', () => {
  const tmp = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'import-art-pal-'));
  const input = path.join(tmp, 'sheet.png');
  fs.writeFileSync(input, theSheet().png);
  const log = console.log; console.log = () => {};
  try {
    assert.equal(main([input, '--detect', '--out', path.join(tmp, 'o')]), 0);
    assert.equal(main(['--character', path.join(tmp, 'o', 'map.json'), '--out', path.join(tmp, 'c1'), '--save-palette', path.join(tmp, 'pal.json')]), 0);
    assert.equal(main(['--character', path.join(tmp, 'o', 'map.json'), '--out', path.join(tmp, 'c2'), '--palette', path.join(tmp, 'pal.json')]), 0);
  } finally { console.log = log; }
  const p1 = paletteFromJson(fs.readFileSync(path.join(tmp, 'pal.json'), 'utf8'));
  const p2 = paletteFromJson(fs.readFileSync(path.join(tmp, 'c2', 'palette.json'), 'utf8'));
  assert.deepEqual(p2.palette, p1.palette, 'the saved palette is reused as it is');
  const a = decodeAnyPng(fs.readFileSync(path.join(tmp, 'c2', 'zombie-jogger-walk-strip-v01.png')));
  for (const c of solidSet(a)) assert.ok(p1.palette.some((q) => q.join() === c), 'only palette colours');
  fs.rmSync(tmp, { recursive: true, force: true });
  // recolour and hue shift act on colours before the palette is made
  const t = makeTransform({ recolor: [parseRecolor('#90d800>#6c9090')] });
  const moved = t(144, 216, 0).map(Math.round);
  assert.ok(Math.hypot(moved[0] - 108, moved[1] - 144, moved[2] - 144) < 6, 'recolour: ' + moved);
  assert.deepEqual(t(20, 20, 200).map(Math.round), [20, 20, 200], 'colours far from the recolour are left alone');
  const h = makeTransform({ hueShifts: [parseHueShift('70-130:+70')] })(0, 200, 0);
  assert.ok(Math.abs(rgbToHsv(...h)[0] - 190) < 2, 'hue 120 moved to about 190');
  assert.throws(() => parseHueShift('green'), /70-130:\+70/);
  assert.throws(() => parseRecolor('red'), /#90d800>#6c9090/);
  // the keep-away rule is a colour change too: the acid green hue family goes grey-teal
  const g = makeTransform({ avoidIchor: true })(144, 216, 0), gh = rgbToHsv(...g);
  assert.ok(gh[0] > 150 && gh[1] < 0.45, 'acid green becomes grey-teal: ' + g.map(Math.round));
});

test('slot names can be remapped, and mistakes in the map are explained', () => {
  const sh = theSheet();
  const { res } = buildFrom(sh, { prefix: 'hippie' });
  assert.deepEqual(res.strips.map((s) => s.key), ['hippie:walk', 'hippie:attack', 'hippie:hit']);
  // hippie:* has slots in the game since 2026-10-20, so the file takes the manifest's name; a prefix with no slot keeps <prefix>-<anim>.
  assert.equal(res.strips[0].fileName, 'zombie-hippie-walk-strip-v01.png');
  assert.equal(buildFrom(sh, { prefix: 'ghoul' }).res.strips[0].fileName, 'ghoul-walk-strip-v01.png');
  const mapped = buildFrom(sh, {}, (map) => { map.slotMap = { 'jogger:hit': 'cheer:hit' }; }).res;
  assert.ok(mapped.strips.some((s) => s.key === 'cheer:hit'));
  const wrongCount = buildFrom(sh, {}, (map) => { map.slots['jogger:walk'].frames.pop(); }).res;
  assert.equal(wrongCount.verdict, 'REDO');
  assert.match(wrongCount.report, /needs 6 frame\(s\) but the map lists 5/);
  assert.throws(() => buildFrom(sh, {}, (map) => { map.slots['jogger:hit'].frames[0].box = [5, 5, 40, 40]; }), /is empty/);
});
