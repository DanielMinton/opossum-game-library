// Makes a see-through template PNG for every planned picture in src/assets.js, plus enlarged, labelled contact sheets.
// Run from game/:   node tools/make-art-templates.mjs   (writes ../templates/art-templates/; --out <folder> writes elsewhere)
// Each template is the exact size the game needs. Its guide marks are half see-through, so the scanner warns if one is left in.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { png } from './png-writer.mjs';

const gameDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const libRoot = path.resolve(gameDir, '..');
export const DEFAULT_OUT = path.join(libRoot, 'templates', 'art-templates');

// The art list and the game's pixel font, read straight from the game's own files so the templates can't drift.
export function loadLists() {
  const ctx = {};
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of ['assets.js', 'font.js']) vm.runInContext(fs.readFileSync(path.join(gameDir, 'src', f), 'utf8'), ctx);
  return ctx.SAMMY;
}

// Guide colours. In the 1x templates each mark uses the alpha below (never fully solid). Contact sheets draw them solid.
export const GUIDES = {
  border: { rgb: [0, 108, 216], a: 128, name: 'BLUE', text: 'EDGE OF EACH FRAME' },
  ground: { rgb: [0, 180, 0], a: 160, name: 'GREEN', text: 'GROUND LINE. FEET STAND ON THIS ROW' },
  feet: { rgb: [216, 0, 0], a: 224, name: 'RED CROSS', text: 'ANCHOR POINT (CENTRE OF THE CROSS). THE GAME PUTS THIS PIXEL AT THE THING\'S POSITION. KEEP IT STILL FROM FRAME TO FRAME' },
  hit: { rgb: [252, 144, 0], a: 192, name: 'ORANGE', text: 'HIT FRAME (THICK EDGE). THE HIT LANDS ON THIS FRAME' },
  release: { rgb: [180, 0, 216], a: 192, name: 'PURPLE', text: 'RELEASE FRAME (THICK EDGE). THE HOT DOG LEAVES THE HAND ON THIS FRAME' },
  seam: { rgb: [0, 180, 180], a: 192, name: 'TEAL', text: 'LOOP EDGES. THE PICTURE REPEATS SIDEWAYS, SO THE LEFT AND RIGHT EDGES MUST JOIN UP' },
};

// Contact-sheet groups, by the folder each planned file lives in.
export const GROUPS = [
  { id: 'sammy', folder: 'characters/character-sammy', title: 'SAMMY' },
  { id: 'jogger', folder: 'enemies/enemy-zombie-jogger', title: 'ZOMBIE JOGGER' },
  { id: 'vendor', folder: 'enemies/enemy-zombie-hot-dog-vendor', title: 'ZOMBIE HOT DOG VENDOR AND HIS HOT DOGS' },
  { id: 'brute', folder: 'enemies/enemy-zombie-brute', title: 'THE BRUTE (BOSS): BODY, FACES, ACID, DUST' },
  { id: 'cart', folder: 'props/prop-hot-dog-cart', title: 'HOT DOG CART AND HOT DOG PICKUP' },
  { id: 'lid', folder: 'items/item-powerup-trash-lid-shield', title: 'TRASH LID SHIELD' },
  { id: 'chainsaw', folder: 'items/item-powerup-chainsaw', title: 'CHAINSAW' },
  { id: 'background', folder: 'environments/environment-central-park-tileset', title: 'CENTRAL PARK BACKGROUND', match: (m) => m.key.startsWith('bg:') },
  { id: 'scenery', folder: 'environments/environment-central-park-tileset', title: 'CENTRAL PARK SCENERY (GROUND, LAMPS, BENCHES, TREES, LEAVES)', match: (m) => m.key.startsWith('scenery:') },
  { id: 'bethesda', folder: 'environments/environment-bethesda-terrace', title: 'BETHESDA TERRACE SCENERY' },
];

// Extra notes for files whose frames mean something special.
const NOTES = {
  'overlay:lid': 'THE GAME PICKS THE FRAME: 0 = 3 BLOCKS LEFT, 1 = 2 LEFT, 2 = 1 LEFT',
  'hud:lid': 'SCREEN ICON (TOP OF THE SCREEN), NOT IN THE PARK. ANCHOR IS THE TOP-LEFT PIXEL',
  'scenery:ground-park': 'TWO 16 X 32 VARIANTS SIDE BY SIDE (NOT AN ANIMATION). TOP-LEFT ANCHOR: ROW 0 IS THE FIRST ROW BELOW THE GROUND LINE. REPEATS EVERY 16 PX',
  'scenery:ground-path': 'TWO 16 X 32 VARIANTS (NOT AN ANIMATION). REPEATS EVERY 16 PX. DRAWN OVER THE GRASS ON PATH STRETCHES',
  'scenery:ground-terrace': 'TWO 16 X 32 VARIANTS (NOT AN ANIMATION). REPEATS EVERY 16 PX. THE TERRACE FLOOR',
  'scenery:lamp': 'ROW 12 IS THE LEDGE SAMMY STANDS ON (LAMP PLATFORMS ARE AT Y 140). LANTERN IS LIT',
  'scenery:lamp-glow': 'DRAWN BEHIND THE LAMP, CENTRED ON THE LANTERN. DITHERED, NO SEE-THROUGH PIXELS',
  'scenery:bench': 'ROW 12 IS THE SEAT TOP (BENCH PLATFORMS ARE AT Y 172)',
  'scenery:tree-far': 'TWO TREE VARIANTS (NOT AN ANIMATION). NO OUTLINE. STANDS BEHIND THE WALKING LANE',
  'scenery:tree-near': 'TWO TREE VARIANTS (NOT AN ANIMATION). OUTLINED. DRAWN IN FRONT OF EVERYONE, KEEP THE TRUNK THIN',
  'scenery:fence': 'REPEATS EVERY 16 PX. PLACED IN RUNS OF THREE AROUND EACH FENCE POST',
  'scenery:leaves-fg': 'TWO FRAMES OF DRIFTING LEAVES, FAINT AND SPARSE. LEFT AND RIGHT EDGES MUST JOIN UP',
  'scenery:puddle': 'LIES FLAT: TOP ROW SITS ON THE GROUND LINE. TWO FRAMES, THE GLINTS MOVE',
  'scenery:bethesda-fountain': 'THREE FRAMES, THE WATER FALLS AND LOOPS. ROW 29 IS THE PEDESTAL TOP THE ANGEL STANDS ON',
  'scenery:bethesda-angel': 'STANDS ON TOP OF THE FOUNTAIN (ITS FEET POINT IS 67 PX ABOVE THE GROUND LINE)',
  'scenery:bethesda-balustrade': 'REPEATS EVERY 32 PX, ON TOP OF THE ARCADE WALL',
  'scenery:bethesda-arch': 'FIVE OF THESE SIDE BY SIDE MAKE THE ARCADE WALL. WARM LIGHT INSIDE THE OPENING',
  'hud:chainsaw': 'SCREEN ICON (TOP OF THE SCREEN), NEXT TO THE FUEL GAUGE. ANCHOR IS THE TOP-LEFT PIXEL',
};
const LOOPS = { loop: 'LOOPS', once: 'PLAYS ONCE', hold: 'PLAYS ONCE, HOLDS THE LAST FRAME', frame: 'DOES NOT ANIMATE' };

const isBand = (m) => m.scroll !== undefined;
const repeats = (m) => isBand(m) && m.scroll > 0; // the sky is drawn once and never repeats
export const templatePath = (m) => m.path.replace(/-v\d+\.png$/i, '-TEMPLATE.png');
export const groupOf = (m) => {
  const folder = path.posix.dirname(m.path);
  const g = GROUPS.find((x) => x.folder === folder && (!x.match || x.match(m)));
  if (!g) throw new Error(`no contact-sheet group for folder ${folder} (add it to GROUPS in tools/make-art-templates.mjs)`);
  return g;
};

// Guide marks for one planned file: [x, y, kind] in template pixels. Later marks win where they overlap.
export function guideMarks(m) {
  const marks = [];
  for (let f = 0; f < m.frames; f++) {
    const ox = f * m.fw;
    const special = f === m.hitFrame ? 'hit' : f === m.releaseFrame ? 'release' : null;
    const rings = special ? 2 : 1;
    for (let r = 0; r < rings; r++) {
      const kind = special || 'border';
      for (let x = r; x < m.fw - r; x++) { marks.push([ox + x, r, kind]); marks.push([ox + x, m.fh - 1 - r, kind]); }
      for (let y = r; y < m.fh - r; y++) {
        marks.push([ox + r, y, repeats(m) ? 'seam' : kind]);
        marks.push([ox + m.fw - 1 - r, y, repeats(m) ? 'seam' : kind]);
      }
    }
    if (m.feet) for (let x = 0; x < m.fw; x++) marks.push([ox + x, m.py, 'ground']);
    if (!isBand(m)) {
      for (const [dx, dy] of [[0, 0], [-1, 0], [-2, 0], [1, 0], [2, 0], [0, -1], [0, -2], [0, 1], [0, 2]]) {
        const x = m.px + dx, y = m.py + dy;
        if (x >= 0 && x < m.fw && y >= 0 && y < m.fh) marks.push([ox + x, y, 'feet']);
      }
    }
  }
  return marks;
}

// A plain RGB(A) pixel buffer with rectangle fill and the game's pixel font.
class Picture {
  constructor(w, h, bpp, fill) {
    this.w = w; this.h = h; this.bpp = bpp; this.px = new Uint8Array(w * h * bpp);
    if (fill) this.rect(0, 0, w, h, fill);
  }
  rect(x, y, w, h, c) {
    const { px, bpp } = this, x0 = Math.max(0, x), x1 = Math.min(this.w, x + w);
    for (let j = Math.max(0, y); j < Math.min(this.h, y + h); j++) {
      for (let i = x0, at = (j * this.w + x0) * bpp; i < x1; i++) for (let k = 0; k < bpp; k++) px[at++] = c[k];
    }
  }
  text(S, str, x, y, c, scale) {
    for (const ch of String(str).toUpperCase()) if (!S.GLYPHS[ch]) throw new Error(`the pixel font has no "${ch}" (in "${str}")`);
    const me = this;
    S.drawText({ fillStyle: c, fillRect(a, b, w, h) { me.rect(a, b, w, h, this.fillStyle); } }, str, x, y, c, scale);
  }
  encode() {
    return png(this.w, this.h, this.px, { colourType: this.bpp === 4 ? 6 : 2 });
  }
}

export function templatePng(m) {
  const pic = new Picture(m.fw * m.frames, m.fh, 4, null);
  for (const [x, y, kind] of guideMarks(m)) pic.rect(x, y, 1, 1, [...GUIDES[kind].rgb, GUIDES[kind].a]);
  return pic.encode();
}

// ---- contact sheets ----
const INK = [24, 24, 24], SOFT = [84, 84, 84], PAPER = [224, 224, 224], CHECK = [[255, 255, 255], [238, 238, 238]];
const TS = 2, LINE = 7 * TS + 4, GAP = 28, MARGIN = 16; // text scale, line height, space between files

const sheetScale = (m) => (isBand(m) ? 2 : m.fh <= 16 ? 6 : m.fh <= 48 ? 4 : 2);
const fraction = (s) => (Number.isInteger(1 / s) ? '1/' + (1 / s) : String(s));
function infoLines(m) {
  const lines = [
    'SAVE AS: ASSETS/' + m.path,
    `WHOLE FILE ${m.fw * m.frames} X ${m.fh} PX. ` +
      (m.frames > 1 ? `${m.frames} FRAMES OF ${m.fw} X ${m.fh}, ${m.fps} PER SECOND, ${LOOPS[m.loop]}` : 'ONE PICTURE'),
  ];
  if (isBand(m)) {
    lines.push(repeats(m)
      ? `TOP ROW ON SCREEN: ${m.y}. MOVES AT ${fraction(m.scroll)} OF THE CAMERA'S SPEED. REPEATS EVERY ${m.fw} PX, SO THE LEFT AND RIGHT EDGES MUST JOIN UP`
      : 'FILLS THE WHOLE SCREEN BEHIND EVERYTHING. DOES NOT MOVE OR REPEAT');
  } else {
    let l = `ANCHOR POINT: X ${m.px}, Y ${m.py} (FROM THE TOP-LEFT OF EACH FRAME). ` + (m.feet ? 'STANDS ON THE GROUND LINE' : 'NO GROUND LINE');
    if (m.hitFrame !== undefined) l += `. HIT FRAME: ${m.hitFrame}`;
    if (m.releaseFrame !== undefined) l += `. RELEASE FRAME: ${m.releaseFrame}`;
    lines.push(l);
  }
  if (NOTES[m.key]) lines.push(NOTES[m.key]);
  return lines;
}

const legendLines = (kinds, scaleNote) => [
  ...Object.keys(GUIDES).filter((k) => kinds.has(k)).map((k) => [GUIDES[k], GUIDES[k].name + ': ' + GUIDES[k].text]),
  [null, 'GUIDE MARKS ARE HALF SEE-THROUGH IN THE TEMPLATE FILES. ERASE THEM ALL BEFORE SAVING THE REAL ART'],
  [null, 'CHECKERED = SEE-THROUGH. FRAMES COUNT FROM 0, LEFT TO RIGHT. ' + scaleNote],
  [null, 'NAMES ARE SHOWN IN CAPITALS. SAVE FILES WITH LOWERCASE NAMES, VERSION V01 FIRST'],
];

// Lays out (and, when pic is given, draws) one contact sheet. Returns its size.
function layout(S, sections, half, pic) {
  let y = MARGIN, w = 0;
  const T = (str, x, c, scale) => { if (pic) pic.text(S, str, x, y, c, scale); w = Math.max(w, x + S.textWidth(str, scale)); };
  T(sections.length > 1 ? 'SAMMY: ALL ART TEMPLATES' : sections[0].group.title + ': ART TEMPLATES', MARGIN, INK, 3);
  y += 5 * 3 + 6;
  T('PROPOSED GUIDES, MADE FROM THE GAME\'S ART LIST. ONE TEMPLATE FILE PER PICTURE IN TEMPLATES/ART-TEMPLATES/', MARGIN, SOFT, TS);
  y += LINE + 6;
  const scaleNote = half ? 'SHOWN SMALLER THAN THE GROUP SHEETS.' : 'SHOWN ENLARGED (SIZE NEXT TO EACH NAME). TEMPLATE FILES ARE 1X.';
  const kinds = new Set();
  for (const { items } of sections) for (const m of items) for (const mk of guideMarks(m)) kinds.add(mk[2]);
  for (const [g, str] of legendLines(kinds, scaleNote)) {
    if (g && pic) pic.rect(MARGIN, y, 24, 10, g.rgb);
    T(str, MARGIN + 32, INK, TS);
    y += LINE;
  }
  y += GAP / 2;
  for (const { group, items } of sections) {
    if (sections.length > 1) { y += GAP / 2; T(group.title, MARGIN, INK, 3); y += 5 * 3 + 10; }
    for (const m of items) {
      const sc = half ? Math.max(1, sheetScale(m) / 2) : sheetScale(m);
      const lines = infoLines(m);
      lines[0] += `  (SHOWN ${sc}X)`;
      for (const [i, l] of lines.entries()) { T(l, MARGIN, i ? SOFT : INK, TS); y += LINE; }
      // Frame numbers, and HIT / RELEASE over the marked frame.
      for (let f = 0; f < m.frames && m.frames > 1; f++) {
        const label = f + (f === m.hitFrame ? ' HIT' : f === m.releaseFrame ? ' RELEASE' : '');
        const cx = MARGIN + f * m.fw * sc + Math.floor(m.fw * sc / 2);
        const tw = S.textWidth(label, TS);
        T(label, Math.max(MARGIN + f * m.fw * sc, cx - Math.floor(tw / 2)), INK, TS);
      }
      y += LINE;
      if (pic) {
        const unit = sc >= 4 ? 1 : 4; // checker square in template pixels
        for (let ty = 0; ty < m.fh; ty += unit) for (let tx = 0; tx < m.fw * m.frames; tx += unit) {
          pic.rect(MARGIN + tx * sc, y + ty * sc, unit * sc, unit * sc, CHECK[(Math.floor(tx / unit) + Math.floor(ty / unit)) % 2]);
        }
        for (const [x, yy, kind] of guideMarks(m)) pic.rect(MARGIN + x * sc, y + yy * sc, sc, sc, GUIDES[kind].rgb);
      }
      w = Math.max(w, MARGIN + m.fw * m.frames * sc);
      y += m.fh * sc + GAP;
    }
  }
  return { w: w + MARGIN, h: y - GAP + MARGIN };
}

function sheetPng(S, sections, half) {
  const size = layout(S, sections, half, null);
  const pic = new Picture(size.w, size.h, 3, PAPER);
  layout(S, sections, half, pic);
  return pic.encode();
}

// Refuses any output folder inside the library's assets/ folder (the scanner reads everything there).
export function checkOutDir(outDir) {
  const assetsDir = path.join(libRoot, 'assets');
  // Compared without case: on a Mac (and Windows), "ASSETS/x" is the same folder as "assets/x".
  const rel = path.relative(assetsDir.toLowerCase(), path.resolve(outDir).toLowerCase());
  if (rel === '' || !(rel.startsWith('..') || path.isAbsolute(rel))) {
    throw new Error('refusing to write templates inside assets/ (the game would scan them): ' + outDir);
  }
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

// Writes every template and contact sheet into outDir; removes old ones this run no longer makes.
export function makeTemplates(outDir = DEFAULT_OUT) {
  checkOutDir(outDir);
  outDir = path.resolve(outDir);
  const S = loadLists();
  const written = [];
  const put = (rel, buf) => {
    const file = path.join(outDir, ...rel.split('/'));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, buf);
    written.push(rel);
  };
  for (const m of S.ASSET_MANIFEST) put(templatePath(m), templatePng(m));
  const sections = GROUPS.map((group) => ({ group, items: S.ASSET_MANIFEST.filter((m) => groupOf(m) === group) }));
  for (const sec of sections) if (sec.items.length) put(`contact-sheet-${sec.group.id}.png`, sheetPng(S, [sec], false));
  put('contact-sheet-all.png', sheetPng(S, sections.filter((s) => s.items.length), true));
  // Clean up only our own kinds of file, only inside our own folder.
  const keep = new Set(written.map((r) => path.join(outDir, ...r.split('/'))));
  const removed = [];
  for (const f of walk(outDir)) {
    const base = path.basename(f);
    if ((/-TEMPLATE\.png$/.test(base) || /^contact-sheet-.*\.png$/.test(base)) && !keep.has(f)) { fs.unlinkSync(f); removed.push(f); }
  }
  for (const f of removed) {
    for (let d = path.dirname(f); d !== outDir && d.startsWith(outDir) && fs.existsSync(d) && !fs.readdirSync(d).length; d = path.dirname(d)) fs.rmdirSync(d);
  }
  return { outDir, written, removed };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--out');
  if (i > 0 && !process.argv[i + 1]) { console.error('Usage: node tools/make-art-templates.mjs [--out <folder>]'); process.exit(1); }
  const out = i > 0 ? path.resolve(process.argv[i + 1]) : DEFAULT_OUT;
  try {
    const r = makeTemplates(out);
    const sheets = r.written.filter((f) => f.startsWith('contact-sheet-')).length;
    console.log(`Wrote ${r.written.length - sheets} art templates and ${sheets} contact sheets to ${path.relative(process.cwd(), r.outDir) || '.'}`);
    for (const f of r.removed) console.log('  removed old file ' + path.relative(process.cwd(), f));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
