// Command-line parts of the art importer's character mode (--detect, --character, --grid-split).
// import-art.mjs calls these; they take the already-parsed flags `a` and the slot table from src/assets.js.
import fs from 'node:fs';
import path from 'node:path';
import { decodeAnyPng } from './png.mjs';
import { detectSheet, overlayImage, draftMap, gridSplit, hexOf, median, DEFAULT_ANIMS, GROUP_COLOURS } from './art-detect.mjs';
import { buildCharacter } from './art-character.mjs';
import { loadGoreColours, paletteToJson, paletteFromJson, parseHex6, hex6 } from './art-colour.mjs';
import { toPng } from './art-preview.mjs';

const num = (v, name) => { if (v == null) return undefined; const n = Number(v); if (!Number.isFinite(n)) throw new Error(`--${name} needs a number`); return n; };
const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

function readSheet(file) {
  let buf;
  try { buf = fs.readFileSync(file); } catch (e) { throw new Error(`Cannot open "${file}": ${e.message}`); }
  const dec = decodeAnyPng(buf);
  // a see-through sheet is fine: pieces are found on the alpha channel
  return { w: dec.width, h: dec.height, d: dec.px, hasAlpha: dec.hasAlpha, format: dec.format };
}

// ---- --detect ----
export function runDetect(a, slots) {
  const input = a._[0];
  if (!input) throw new Error('Tell me which sheet: node tools/import-art.mjs sheet.png --detect');
  const img = readSheet(input);
  const outDir = path.resolve(a.out || 'import-out');
  fs.mkdirSync(outDir, { recursive: true });
  const bgColour = a.bg ? String(a.bg).split(',').map(parseHex6)[0] : undefined;
  const groups = a.groups ? String(a.groups).split(',').map((v) => +v) : undefined;
  if (groups && groups.some((v) => !(v >= 1))) throw new Error('--groups must look like 4,3,2,3,3 (frames per animation in one row)');
  const sheetRel = path.relative(outDir, path.resolve(input)) || path.basename(input);
  let map, det, overlayImg;
  if (a['grid-split']) {
    const m = /^(\d+)\s*x\s*(\d+)$/i.exec(a['grid-split']);
    if (!m) throw new Error('--grid-split must look like 10x2 (columns x rows)');
    const region = a.region ? String(a.region).split(',').map(Number) : null;
    if (region && (region.length !== 4 || region.some((v) => !Number.isFinite(v)))) throw new Error('--region must look like x,y,width,height');
    const boxes = gridSplit(img, +m[1], +m[2], region, bgColour, num(a.tolerance, 'tolerance'));
    if (!boxes.length) throw new Error('nothing found in the grid cells');
    const prefix = a.prefix || 'portrait';
    const cell = a.size && /^(\d+)x(\d+)$/.test(a.size) ? a.size.split('x').map(Number) : [32, 32];
    map = {
      sheet: sheetRel, bg: bgColour ? hexOf(...bgColour) : null, slots: { [`${prefix}:faces`]: { cell, feet: false, frames: boxes.map((b) => ({ box: b })) } },
      found: { how: `an even grid of ${m[1]} across by ${m[2]} down, each cell tightened to the art in it`, boxes: boxes.length },
    };
    if (!map.bg) delete map.bg;
    // overlay: draw the boxes
    det = { heroes: [], groups: [{ index: 0, rows: [{ row: 0, frames: boxes.map((b, i) => ({ num: i + 1, box: { x0: b[0], y0: b[1], x1: b[0] + b[2], y1: b[1] + b[3] } })) }] }] };
    console.log(`Found ${boxes.length} cell(s) in a ${m[1]} x ${m[2]} grid.`);
  } else {
    det = detectSheet(img, {
      bgColour, tolerance: num(a.tolerance, 'tolerance'), minHeight: num(a['min-height'], 'min-height'), maxHeight: num(a['max-height'], 'max-height'),
      groups, gap: num(a.gap, 'gap'), noHeroes: !!a['no-heroes'],
    });
    const anims = a.anims ? String(a.anims).split(',').map((v) => v.trim()) : DEFAULT_ANIMS;
    const prefix = a.prefix || 'jogger';
    const slotFrames = {};
    for (const [k, v] of Object.entries(slots)) if (k.startsWith(prefix + ':')) slotFrames[k] = v.frames;
    // a first guess at the shared scale: a standing figure ~45 px tall in a 48 px cell
    const stand = det.groups.filter((g, i) => i === 0 || i === det.groups.length - 1).flatMap((g) => g.rows.flatMap((r) => r.frames));
    const hs = stand.map((f) => f.body.y1 - f.body.y0);
    const target = a.height ? +a.height : 45;
    const scale = a.scale ? +a.scale : hs.length ? Math.round(target / median(hs) * 1000) / 1000 : null;
    map = draftMap(det, { anims, prefix, slotFrames, scale, sheetName: sheetRel });
    console.log(`Sheet ${img.w} x ${img.h} px, background ${hexOf(...det.bg.colour)}.`);
    console.log(`Found ${det.frames.length} small frame(s) in ${det.groups.length} animation group(s), ${det.rows.length} row(s); ignored ${det.heroes.length} big pose(s) (${det.how}).`);
    for (const g of det.groups) console.log(`  ${(anims[g.index] || 'group ' + (g.index + 1)).padEnd(8)} ${g.rows.map((r) => r.frames.length).join(' + ')} frame(s) per row`);
    for (const w of det.warnings) console.log('  note: ' + w);
    overlayImg = overlayImage(img, det);
  }
  if (!overlayImg) {
    const d = Uint8Array.from(img.d); for (let i = 3; i < d.length; i += 4) d[i] = 255;
    overlayImg = overlayImage({ w: img.w, h: img.h, d }, det);
  }
  const overlayPath = path.join(outDir, 'detect-overlay.png'), mapPath = path.join(outDir, 'map.json');
  fs.writeFileSync(overlayPath, toPng(overlayImg));
  fs.writeFileSync(mapPath, JSON.stringify(map, null, 2) + '\n');
  console.log(`\nWrote ${overlayPath}\n      ${mapPath}`);
  console.log('Open detect-overlay.png: every frame has a number and a coloured box (one colour per animation).');
  console.log('If something is wrong, edit map.json (the boxes are [x, y, width, height]) or run --detect again with --groups 4,3,2,3,3 (frames per animation).');
  console.log(`Then: node tools/import-art.mjs --character ${path.relative(process.cwd(), mapPath) || 'map.json'}${a.out ? ' --out ' + a.out : ''}`);
  return 0;
}

// ---- --character ----
export function runCharacter(a, slots, ctx) {
  const mapPath = path.resolve(a.character);
  let map;
  try { map = JSON.parse(fs.readFileSync(mapPath, 'utf8')); } catch (e) { throw new Error(`Cannot read the map "${a.character}": ${e.message}`); }
  const sheetFile = a._[0] || path.resolve(path.dirname(mapPath), map.sheet || 'sheet.png');
  const img = readSheet(sheetFile);
  const outDir = path.resolve(a.out || 'import-out');
  const gore = loadGoreColours(ctx.gameDir);
  let palette = null;
  if (a.palette) { try { palette = paletteFromJson(fs.readFileSync(a.palette, 'utf8')); } catch (e) { throw new Error(`Cannot use the palette file "${a.palette}": ${e.message}`); } }
  const opts = {
    bg: a.bg, tolerance: num(a.tolerance, 'tolerance'), height: num(a.height, 'height'), scale: num(a.scale, 'scale'), size: a.size, noFeet: !!a['no-feet'],
    outline: a.outline, palette, avoidGore: !a['no-avoid-gore-colours'], allowBlood: !!a['allow-blood'], allowIchor: !!a['allow-ichor'],
    recolor: list(a.recolor), hueShift: list(a['hue-shift']), saturationBoost: num(a['saturation-boost'], 'saturation-boost'), contrast: num(a.contrast, 'contrast'), lift: num(a.lift, 'lift'),
    stabilize: a['no-stabilize'] ? false : true, flatten: a['no-flatten'] ? false : undefined, smooth: num(a.smooth, 'smooth'), levels: a.levels, downscale: a.downscale, despeckle: num(a.despeckle, 'despeckle'), trimParticles: a['trim-particles'], keepEffects: !!a['keep-effects'], flip: !!a.flip, prefix: a.prefix, colours: num(a.colours, 'colours'),
  };
  const res = buildCharacter({ sheet: img, map, opts, manifest: slots, gore, sheetName: path.basename(sheetFile) });
  fs.mkdirSync(outDir, { recursive: true });
  const wrote = [];
  const put = (name, data) => { const p = path.join(outDir, name); fs.writeFileSync(p, data); wrote.push(p); return p; };
  for (const s of res.strips) {
    const base = s.fileName.replace(/\.png$/, '');
    put(s.fileName, s.png);
    put(base + '-preview-4x.png', s.previewPng);
    put(base + '-compare-4x.png', s.comparePng);
    put(base + '-report.txt', s.report);
  }
  put('contact-sheet-4x.png', res.contactPng);
  put('palette-swatch.png', res.swatchPng);
  put('palette.json', paletteToJson(res.palette, res.outline));
  put('CHARACTER-REPORT.md', res.report);
  if (a['save-palette']) { fs.mkdirSync(path.dirname(path.resolve(a['save-palette'])), { recursive: true }); fs.writeFileSync(a['save-palette'], paletteToJson(res.palette, res.outline)); wrote.push(path.resolve(a['save-palette'])); }
  // console summary
  console.log(`CHARACTER IMPORT: ${path.basename(sheetFile)}   VERDICT: ${res.verdict}`);
  console.log(`Scale ${res.scale.toFixed(3)} (a standing figure is about ${Math.round(res.refHeight * res.scale)} px tall), shared palette of ${res.palette.length} colours: ${res.palette.map(hex6).join(' ')}`);
  for (const s of res.strips) console.log(`  ${s.key.padEnd(22)} ${String(s.slot.frames).padStart(2)} x ${s.slot.fw}x${s.slot.fh}  ${s.verdict.padEnd(20)} shimmer ${(s.flicker * 100).toFixed(1)}%  ${s.fileName}`);
  for (const w of [...res.warnings, ...res.mapProblems]) console.log('  ! ' + w);
  for (const s of res.strips) { for (const w of s.problems) console.log(`  ! ${s.key}: ${w}`); for (const w of s.warnings) console.log(`  ! ${s.key}: ${w}`); }
  if (res.goreMoves.length) console.log('  Gore colours moved: ' + res.goreMoves.join('; '));
  if (res.tips.length) { console.log('  Next time, ask the art tool for:'); for (const t of res.tips) console.log('   - ' + t); }
  console.log(`\nWrote ${wrote.length} file(s) into ${outDir} (start with CHARACTER-REPORT.md and contact-sheet-4x.png).`);
  let code = res.verdict === 'REDO' ? 1 : 0;
  if (a.install) {
    for (const s of res.strips) {
      if (s.verdict === 'REDO') { console.log(`Not installed: ${s.key} (verdict REDO).`); continue; }
      if (!s.slot.path) { console.log(`Not installed: ${s.key} has no slot in the game yet.`); continue; }
      const r = ctx.install(a, s.slot, path.join(outDir, s.fileName));
      if (r) code = 1;
    }
  }
  return code;
}
