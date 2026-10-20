// Reads a PNG file's header and pixels to catch art problems before the game loads it. No packages needed.
// checkPng(buffer, wantW, wantH) returns a list of plain-language warnings (empty when all is well).
// It never throws: a file it can't read gets a warning, and the game still tries to load it.
import zlib from 'node:zlib';

const SIG = [137, 80, 78, 71, 13, 10, 26, 10];
const COLOUR_CHUNKS = ['gAMA', 'iCCP', 'sRGB', 'cHRM'];
const MAX_PIXELS = 4096 * 4096; // skip pixel checks on anything bigger

export function readChunks(buf) {
  if (buf.length < 8 || SIG.some((b, i) => buf[i] !== b)) throw new Error('not a PNG file');
  const chunks = [];
  for (let at = 8; at + 8 <= buf.length;) {
    const len = buf.readUInt32BE(at), type = buf.toString('latin1', at + 4, at + 8);
    if (at + 12 + len > buf.length) throw new Error('file is cut short');
    chunks.push({ type, data: buf.subarray(at + 8, at + 8 + len) });
    at += 12 + len;
    if (type === 'IEND') break;
  }
  const ihdr = chunks[0] && chunks[0].type === 'IHDR' ? chunks[0].data : null;
  if (!ihdr || ihdr.length < 13) throw new Error('no IHDR header');
  return {
    chunks, width: ihdr.readUInt32BE(0), height: ihdr.readUInt32BE(4),
    bitDepth: ihdr[8], colourType: ihdr[9], interlace: ihdr[12],
  };
}

// Undo the per-row PNG filters (None, Sub, Up, Average, Paeth). Returns raw pixel bytes, row after row.
export function unfilter(data, width, height, bpp) {
  const stride = width * bpp, out = Buffer.alloc(stride * height);
  if (data.length < (stride + 1) * height) throw new Error('pixel data is cut short');
  for (let y = 0; y < height; y++) {
    const type = data[y * (stride + 1)], src = y * (stride + 1) + 1, row = y * stride, up = row - stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[row + x - bpp] : 0, b = y ? out[up + x] : 0, c = x >= bpp && y ? out[up + x - bpp] : 0;
      let v = data[src + x];
      if (type === 1) v += a;
      else if (type === 2) v += b;
      else if (type === 3) v += (a + b) >> 1;
      else if (type === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      } else if (type !== 0) throw new Error('unknown row filter ' + type);
      out[row + x] = v & 255;
    }
  }
  return out;
}

// RGBA for every pixel, or null when the layout isn't one we decode (8-bit RGB, palette or RGBA, not interlaced).
export function decodePixels(info) {
  const { width, height, bitDepth, colourType, interlace, chunks } = info;
  const bpp = { 2: 3, 3: 1, 6: 4 }[colourType];
  if (bitDepth !== 8 || interlace !== 0 || !bpp || width * height > MAX_PIXELS) return null;
  const idat = zlib.inflateSync(Buffer.concat(chunks.filter((c) => c.type === 'IDAT').map((c) => c.data)));
  const raw = unfilter(idat, width, height, bpp);
  const plte = (chunks.find((c) => c.type === 'PLTE') || {}).data, trns = (chunks.find((c) => c.type === 'tRNS') || {}).data;
  if (colourType === 3 && !plte) throw new Error('palette image without a palette');
  const key = colourType === 2 && trns && trns.length >= 6 ? [trns.readUInt16BE(0), trns.readUInt16BE(2), trns.readUInt16BE(4)] : null;
  const px = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    let r, g, b, a = 255;
    if (colourType === 6) { r = raw[i * 4]; g = raw[i * 4 + 1]; b = raw[i * 4 + 2]; a = raw[i * 4 + 3]; }
    else if (colourType === 2) { r = raw[i * 3]; g = raw[i * 3 + 1]; b = raw[i * 3 + 2]; if (key && r === key[0] && g === key[1] && b === key[2]) a = 0; }
    else {
      const k = raw[i];
      if (k * 3 + 2 >= plte.length) throw new Error('palette index out of range');
      r = plte[k * 3]; g = plte[k * 3 + 1]; b = plte[k * 3 + 2]; if (trns && k < trns.length) a = trns[k];
    }
    px.set([r, g, b, a], i * 4);
  }
  return px;
}

export function checkPng(buf, wantW, wantH) {
  const warn = [];
  // Size first, straight from the header bytes, so a file damaged later on still gets its size checked.
  const head = buf.length >= 24 && SIG.every((b, i) => buf[i] === b) && buf.toString('latin1', 12, 16) === 'IHDR';
  if (!head) return ['could not read this PNG (not a PNG file)'];
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  if (w !== wantW || h !== wantH) warn.push(`wrong size: expected ${wantW}x${wantH} px, got ${w}x${h} (the game will not use it)`);
  let info;
  try { info = readChunks(buf); } catch (e) { warn.push('could not read this PNG (' + e.message + ')'); return warn; }
  const colour = COLOUR_CHUNKS.filter((t) => info.chunks.some((c) => c.type === t));
  if (colour.length) warn.push('has colour-profile data (' + colour.join(', ') + '); colours may shift. Export without a profile or gamma.');
  let px;
  try { px = decodePixels(info); } catch (e) { warn.push('pixel checks skipped (' + e.message + ')'); return warn; }
  if (!px) { warn.push('pixel checks skipped (unsupported PNG layout)'); return warn; }
  let semi = 0, offGrid = 0, firstSemi = null, firstOff = null;
  const colours = new Set();
  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3];
    if (a === 0) continue;
    const at = () => `(${(i / 4) % info.width}, ${Math.floor(i / 4 / info.width)})`;
    if (a !== 255) { semi += 1; if (!firstSemi) firstSemi = at(); continue; }
    const r = px[i], g = px[i + 1], b = px[i + 2];
    if (r % 36 || g % 36 || b % 36) { offGrid += 1; if (!firstOff) firstOff = at() + ` is ${r},${g},${b}`; }
    colours.add((r << 16) | (g << 8) | b);
  }
  if (semi) warn.push(`${semi} semi-transparent pixel(s), first at ${firstSemi}; every pixel must be fully clear or fully solid`);
  if (offGrid) warn.push(`${offGrid} pixel(s) off the 9-bit colour grid (0, 36, 72 … 252), first at ${firstOff}`);
  if (colours.size > 15) warn.push(`${colours.size} solid colours; one palette line allows 15`);
  return warn;
}

// ---- Full decoder for the art importer (tools/import-art.mjs). checkPng above is unchanged. ----
// decodeAnyPng(buffer) -> { width, height, px (RGBA bytes, row after row), format (plain-language layout), hasAlpha }.
// Reads 1/2/4/8/16-bit greyscale, RGB, palette (with tRNS), grey+alpha and RGBA, interlaced or not.
// Throws an Error with a plain-language message (including how to convert JPG/WebP on a Mac) for anything else.
const CONVERT_HELP = 'Convert it to PNG first. On a Mac: sips -s format png "your-file.jpg" --out your-file.png';
export function sniffImageType(buf) {
  if (buf.length >= 8 && SIG.every((b, i) => buf[i] === b)) return 'png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8) return 'jpeg';
  if (buf.length >= 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  if (buf.length >= 6 && buf.toString('latin1', 0, 3) === 'GIF') return 'gif';
  if (buf.length >= 2 && buf.toString('latin1', 0, 2) === 'BM') return 'bmp';
  return 'unknown';
}
export function decodeAnyPng(buf) {
  const kind = sniffImageType(buf);
  if (kind !== 'png') {
    const names = { jpeg: 'a JPG picture', webp: 'a WebP picture', gif: 'a GIF picture', bmp: 'a BMP picture', unknown: 'not a PNG picture' };
    throw new Error(`this file is ${names[kind]}, and the importer only reads PNG. ${CONVERT_HELP}`);
  }
  const info = readChunks(buf);
  const { width, height, bitDepth, colourType, interlace, chunks } = info;
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colourType];
  if (!channels || ![1, 2, 4, 8, 16].includes(bitDepth)) throw new Error('unusual PNG layout (colour type ' + colourType + ', ' + bitDepth + '-bit). ' + CONVERT_HELP);
  if (width * height > 64 * 1024 * 1024) throw new Error('the picture is huge (' + width + 'x' + height + '); shrink it to under about 8000 px wide first');
  const plte = (chunks.find((c) => c.type === 'PLTE') || {}).data, trns = (chunks.find((c) => c.type === 'tRNS') || {}).data;
  if (colourType === 3 && !plte) throw new Error('palette picture without a palette');
  const bitsPP = channels * bitDepth, bpp = Math.max(1, bitsPP >> 3);
  const idat = zlib.inflateSync(Buffer.concat(chunks.filter((c) => c.type === 'IDAT').map((c) => c.data)));
  const px = new Uint8Array(width * height * 4);
  const maxv = (1 << bitDepth) - 1;
  const sample = (row, i) => { // i-th sample in a de-filtered row
    if (bitDepth === 8) return row[i];
    if (bitDepth === 16) return (row[i * 2] << 8) | row[i * 2 + 1];
    const bit = i * bitDepth, shift = 8 - bitDepth - (bit & 7);
    return (row[bit >> 3] >> shift) & maxv;
  };
  const to8 = (v) => (bitDepth === 8 ? v : bitDepth === 16 ? v >> 8 : Math.round(v * 255 / maxv));
  const key = trns && colourType === 0 && trns.length >= 2 ? trns.readUInt16BE(0) : null;
  const key3 = trns && colourType === 2 && trns.length >= 6 ? [trns.readUInt16BE(0), trns.readUInt16BE(2), trns.readUInt16BE(4)] : null;
  const hasAlpha = colourType === 4 || colourType === 6 || !!trns;
  // Decode one (sub)image of w x h starting at byte `off`; calls put(x, y, r, g, b, a) per pixel. Returns the bytes used.
  const pass = (off, w, h, put) => {
    if (!w || !h) return 0;
    const stride = Math.ceil(w * bitsPP / 8);
    if (idat.length < off + (stride + 1) * h) throw new Error('pixel data is cut short');
    let prev = Buffer.alloc(stride);
    for (let y = 0; y < h; y++) {
      const type = idat[off + y * (stride + 1)], src = off + y * (stride + 1) + 1, row = Buffer.alloc(stride);
      for (let x = 0; x < stride; x++) {
        const a = x >= bpp ? row[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
        let v = idat[src + x];
        if (type === 1) v += a; else if (type === 2) v += b; else if (type === 3) v += (a + b) >> 1;
        else if (type === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
        else if (type !== 0) throw new Error('unknown row filter ' + type);
        row[x] = v & 255;
      }
      for (let x = 0; x < w; x++) {
        let r, g, b, a = 255;
        if (colourType === 0) { const v = sample(row, x); r = g = b = to8(v); if (key !== null && v === key) a = 0; }
        else if (colourType === 4) { r = g = b = to8(sample(row, x * 2)); a = to8(sample(row, x * 2 + 1)); }
        else if (colourType === 2) {
          const R = sample(row, x * 3), G = sample(row, x * 3 + 1), B = sample(row, x * 3 + 2);
          r = to8(R); g = to8(G); b = to8(B); if (key3 && R === key3[0] && G === key3[1] && B === key3[2]) a = 0;
        } else if (colourType === 3) {
          const k = sample(row, x);
          if (k * 3 + 2 >= plte.length) throw new Error('palette index out of range');
          r = plte[k * 3]; g = plte[k * 3 + 1]; b = plte[k * 3 + 2]; if (trns && k < trns.length) a = trns[k];
        } else { r = to8(sample(row, x * 4)); g = to8(sample(row, x * 4 + 1)); b = to8(sample(row, x * 4 + 2)); a = to8(sample(row, x * 4 + 3)); }
        put(x, y, r, g, b, a);
      }
      prev = row;
    }
    return (stride + 1) * h;
  };
  const set = (x, y, r, g, b, a) => { const i = (y * width + x) * 4; px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a; };
  if (!interlace) pass(0, width, height, set);
  else {
    const P = [[0, 0, 8, 8], [4, 0, 8, 8], [0, 4, 4, 8], [2, 0, 4, 4], [0, 2, 2, 4], [1, 0, 2, 2], [0, 1, 1, 2]];
    let off = 0;
    for (const [x0, y0, dx, dy] of P) {
      const w = Math.ceil((width - x0) / dx), h = Math.ceil((height - y0) / dy);
      off += pass(off, w, h, (x, y, r, g, b, a) => set(x0 + x * dx, y0 + y * dy, r, g, b, a));
    }
  }
  const layout = { 0: 'greyscale', 2: 'RGB', 3: 'palette', 4: 'greyscale+alpha', 6: 'RGBA' }[colourType];
  return { width, height, px, hasAlpha, format: `${bitDepth}-bit ${layout}${interlace ? ', interlaced' : ''}` };
}
