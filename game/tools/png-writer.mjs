// Tiny PNG writer (no packages), used by the tests and tools/make-art-templates.mjs. pixel(x, y) returns [r, g, b, a].
// Options: chunks (extra chunks before the pixels, e.g. [['gAMA', Buffer]]), colourType 6 (RGBA, default) or 2 (RGB),
// pixel may also be a Uint8Array of all pixels, row after row (bpp bytes each), which is much faster for big images.
// filters (row filter types to cycle through, default [0]), bitDepth / interlace (header only, for layout tests).
import zlib from 'node:zlib';

const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
}

export function png(w, h, pixel, opts = {}) {
  const ct = opts.colourType || 6, bpp = ct === 2 ? 3 : 4, filters = opts.filters || [0];
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = opts.bitDepth || 8; ihdr[9] = ct; ihdr[12] = opts.interlace || 0;
  const stride = w * bpp, rows = [];
  for (let y = 0; y < h; y++) {
    const row = Buffer.alloc(stride);
    if (ArrayBuffer.isView(pixel)) row.set(pixel.subarray(y * stride, (y + 1) * stride));
    else for (let x = 0; x < w; x++) row.set(pixel(x, y).slice(0, bpp), x * bpp);
    rows.push(row);
  }
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    const type = filters[y % filters.length], cur = rows[y], prev = y ? rows[y - 1] : Buffer.alloc(stride);
    raw[y * (stride + 1)] = type;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
      let pred = 0;
      if (type === 1) pred = a; else if (type === 2) pred = b; else if (type === 3) pred = (a + b) >> 1;
      else if (type === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      raw[y * (stride + 1) + 1 + x] = (cur[x] - pred) & 255;
    }
  }
  const extra = (opts.chunks || []).map(([t, d]) => chunk(t, d));
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), ...extra,
    chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
