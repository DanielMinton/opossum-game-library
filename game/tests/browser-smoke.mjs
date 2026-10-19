// Runs the game in a headless browser and checks it end to end.
// Run from game/:  node tests/browser-smoke.mjs [--shots <folder>]
// Needs a Chromium-based browser. Set CHROME_PATH if it isn't found automatically.
//
// Checks:
//  1. game/index.html: autopilot plays title -> level -> gauntlet -> clear -> restart, with no errors.
//  2. game/dist/index.html (run `node tools/build.mjs` first): the same.
//  3. Real-art loading: a temporary copy of the library with two generated test images
//     (one correct, one the wrong size) — proves files load, are drawn, and size mistakes are reported.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { scan } from '../tools/scan-assets.mjs';

const gameDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shotsArg = process.argv.indexOf('--shots');
const shots = shotsArg > 0 ? path.resolve(process.argv[shotsArg + 1]) : null;

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const home = os.homedir();
  const cache = path.join(home, 'Library', 'Caches', 'ms-playwright');
  const found = [];
  if (fs.existsSync(cache)) {
    for (const d of fs.readdirSync(cache).filter((d) => d.startsWith('chromium_headless_shell')).sort().reverse()) {
      for (const sub of fs.readdirSync(path.join(cache, d))) {
        const p = path.join(cache, d, sub, 'chrome-headless-shell');
        if (fs.existsSync(p)) found.push(p);
      }
    }
  }
  found.push(
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  );
  return found.find((p) => fs.existsSync(p));
}

const chrome = findChrome();
if (!chrome) { console.error('No Chromium-based browser found. Set CHROME_PATH.'); process.exit(2); }

function runPage(file, query) {
  const url = pathToFileURL(file).href + '?' + query;
  const r = spawnSync(chrome, ['--headless', '--disable-gpu', '--no-first-run', '--virtual-time-budget=60000', '--dump-dom', url],
    { encoding: 'utf8', timeout: 120000 });
  const m = /<pre id="test-result"[^>]*>([^<]*)<\/pre>/.exec(r.stdout || '');
  if (!m || !m[1]) return { ok: false, errors: ['no test result in page; stderr: ' + (r.stderr || '').slice(0, 300)] };
  return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
}
function screenshot(file, query, out) {
  const url = pathToFileURL(file).href + '?' + query;
  spawnSync(chrome, ['--headless', '--disable-gpu', '--hide-scrollbars', '--window-size=960,672', '--virtual-time-budget=20000', '--screenshot=' + out, url], { timeout: 120000 });
}

// Tiny PNG writer (RGBA) for the generated test images.
function png(w, h, pixel) {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) raw.set(pixel(x, y), y * (w * 4 + 1) + 1 + x * 4);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const results = [];
function check(name, cond, detail) { results.push({ name, ok: !!cond, detail }); console.log((cond ? 'PASS ' : 'FAIL ') + name + (detail ? '  — ' + detail : '')); }

console.log('Browser: ' + chrome);

// 1 + 2: source and built game
for (const [label, file] of [['source game (game/index.html)', path.join(gameDir, 'index.html')], ['built game (game/dist/index.html)', path.join(gameDir, 'dist', 'index.html')]]) {
  if (!fs.existsSync(file)) { check(label, false, 'missing — run node tools/build.mjs'); continue; }
  const r = runPage(file, 'test=full');
  check(label + ': plays to level clear and restarts, no errors', r.ok && r.reachedClear && r.restartOk && r.errors.length === 0,
    `modes ${JSON.stringify(r.modesSeen)}, frames ${r.frames}, errors ${JSON.stringify(r.errors)}`);
  check(label + ': every hurt/K.O./play-dead/pause/mute screen draws without errors', r.ok && r.renderSweep >= 27, 'states drawn: ' + r.renderSweep);
  const k = runPage(file, 'test=keys');
  check(label + ': real key presses start the game and move Sammy', k.ok, `mode ${k.mode}, x ${k.x}, errors ${JSON.stringify(k.errors)}`);
  check(label + ': no art files expected yet, so none loaded', r.assets && r.assets.tried === 0, 'tried ' + (r.assets && r.assets.tried));
}

// 3: real-art loading in a temporary copy of the library
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sammy-art-test-'));
fs.cpSync(path.join(gameDir, 'index.html'), path.join(tmp, 'game', 'index.html'));
fs.cpSync(path.join(gameDir, 'src'), path.join(tmp, 'game', 'src'), { recursive: true });
const sam = path.join(tmp, 'assets', 'characters', 'character-sammy');
fs.mkdirSync(sam, { recursive: true });
// Correct size: run strip, 8 frames of 48x48 = 384x48. A blue block standing on row 47.
fs.writeFileSync(path.join(sam, 'sammy-run-strip-v01.png'), png(384, 48, (x, y) => ((x % 48) > 12 && (x % 48) < 36 && y > 14 ? [36, 72, 216, 255] : [0, 0, 0, 0])));
// Wrong size on purpose: idle strip 100x48 instead of 192x48.
fs.writeFileSync(path.join(sam, 'sammy-idle-strip-v01.png'), png(100, 48, () => [216, 36, 36, 255]));
const scanned = scan(tmp, path.join(tmp, 'game', 'src', 'asset-files.js'));
check('art scan finds the 2 test images', scanned.found.length === 2, scanned.found.join(', '));
const a = runPage(path.join(tmp, 'game', 'index.html'), 'test=smoke&frames=600');
check('test images load in the browser', a.assets && a.assets.loaded.length === 2, JSON.stringify(a.assets && a.assets.loaded));
check('wrong-size image is reported', a.assets && a.assets.warnings.length === 1 && /sammy-idle-strip/.test(a.assets.warnings[0]), JSON.stringify(a.assets && a.assets.warnings));
check('real art is drawn instead of the placeholder', a.realArtDraws && a.realArtDraws['sammy:run'] > 0, JSON.stringify(a.realArtDraws));
check('no errors with real art', a.ok && a.errors.length === 0, JSON.stringify(a.errors));

if (shots) {
  fs.mkdirSync(shots, { recursive: true });
  const src = path.join(gameDir, 'index.html');
  for (const [n, q] of [['title', 'frames=1&title=1'], ['level', 'frames=1060'], ['arena', 'frames=2700'], ['clear', 'frames=3265']]) screenshot(src, 'test=shot&' + q, path.join(shots, n + '.png'));
  screenshot(path.join(tmp, 'game', 'index.html'), 'test=shot&frames=120', path.join(shots, 'real-art-test.png'));
  console.log('Screenshots written to ' + shots);
}
fs.rmSync(tmp, { recursive: true, force: true });

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed} of ${results.length} browser checks passed.`);
process.exit(failed ? 1 : 0);
