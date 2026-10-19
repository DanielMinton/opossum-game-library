// Runs the game in a headless browser and checks it end to end.
// Run from game/:  node tests/browser-smoke.mjs [--shots <folder>]
// Needs a Chromium-based browser. Set CHROME_PATH if it isn't found automatically.
//
// Checks:
//  1. game/index.html: autopilot plays title -> level -> gauntlet -> clear -> restart, with no errors.
//  2. game/dist/index.html (run `node tools/build.mjs` first): the same.
//  3. Real-art loading: a temporary copy of the library with generated test images (a correct run strip,
//     a wrong-size idle strip, and a hurt strip in two versions) — proves the newest version loads and is drawn,
//     the hit flash uses real art, and a wrong-size file is reported and not drawn.
//  4. Real-sound loading: the same copy gets two generated WAV files (a sound effect and the level music)
//     — proves they are found, load in the browser, and play through real key presses without errors.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { scan } from '../tools/scan-assets.mjs';
import { png } from './png-writer.mjs';

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

// Tiny WAV writer (16-bit mono) for the generated test sounds.
function wav(seconds, hz) {
  const rate = 22050, n = Math.round(seconds * rate), data = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) data.writeInt16LE(Math.round(Math.sin(i / rate * hz * 2 * Math.PI) * 8000), i * 2);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
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
  check(label + ': no sound files expected yet, so none loaded', r.sounds && r.sounds.tried === 0, 'tried ' + (r.sounds && r.sounds.tried));
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
// Two versions of the hurt strip (2 frames = 96x48): v02 must win. The old v01 is the wrong size, so it would warn if used.
fs.writeFileSync(path.join(sam, 'sammy-hurt-strip-v01.png'), png(48, 48, () => [216, 36, 36, 255]));
fs.writeFileSync(path.join(sam, 'sammy-hurt-strip-v02.png'), png(96, 48, (x, y) => ((x % 48) > 10 && (x % 48) < 38 && y > 20 ? [216, 216, 0, 255] : [0, 0, 0, 0])));
const put = (rel, buf) => { const f = path.join(tmp, 'assets', rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, buf); };
put('audio/sfx/sfx-jump/sfx-jump-v01.wav', wav(0.15, 660));
put('audio/music/music-level-01-central-park/music-level-01-central-park-v01.wav', wav(1.0, 220));
const scanned = scan(tmp, path.join(tmp, 'game', 'src', 'asset-files.js'));
const hurtFile = 'characters/character-sammy/sammy-hurt-strip-v02.png';
check('art scan finds the 3 test strips and picks v02 of the hurt strip', scanned.found.length === 3 && scanned.found.includes(hurtFile), scanned.found.join(', '));
check('art scan warns about the wrong-size idle strip only', scanned.warnings.length === 1 && /sammy-idle-strip-v01\.png: wrong size/.test(scanned.warnings[0]), JSON.stringify(scanned.warnings));
check('sound scan finds the 2 test sounds', Object.keys(scanned.sounds).length === 2, JSON.stringify(scanned.sounds));
const a = runPage(path.join(tmp, 'game', 'index.html'), 'test=full');
check('correct test images load in the browser (newest hurt version)', a.assets && a.assets.loaded.length === 2 && a.assets.loaded.includes(hurtFile), JSON.stringify(a.assets && a.assets.loaded));
check('wrong-size image is reported and not drawn', a.assets && a.assets.warnings.length === 1 && /sammy-idle-strip/.test(a.assets.warnings[0]) && a.realArtDraws && !a.realArtDraws['sammy:idle'],
  JSON.stringify(a.assets && a.assets.warnings));
check('real art is drawn instead of the placeholder', a.realArtDraws && a.realArtDraws['sammy:run'] > 0, JSON.stringify(a.realArtDraws));
check('hit flash on real art uses the white copy of the strip', a.flashDraws && a.flashDraws['sammy:hurt'] > 0, JSON.stringify(a.flashDraws));
check('no errors with real art (full playthrough and every screen)', a.ok && a.errors.length === 0 && a.renderSweep >= 27, `sweep ${a.renderSweep}, errors ${JSON.stringify(a.errors)}`);
check('test sounds load in the browser', a.sounds && a.sounds.loaded.length === 2 && a.sounds.failed.length === 0, JSON.stringify(a.sounds));
const ks = runPage(path.join(tmp, 'game', 'index.html'), 'test=keys');
check('real sounds play through real key presses without errors (start music, jump sound)',
  ks.ok && ks.sounds.loaded.length === 2 && ks.sounds.plays['sfx-jump'] > 0 && ks.sounds.plays['music-level-01-central-park'] > 0,
  `mode ${ks.mode}, errors ${JSON.stringify(ks.errors)}, sounds ${JSON.stringify(ks.sounds)}`);

if (shots) {
  fs.mkdirSync(shots, { recursive: true });
  const src = path.join(gameDir, 'index.html');
  for (const [n, q] of [['title', 'frames=1&title=1'], ['level', 'frames=1060'], ['arena', 'frames=2700'], ['clear', 'frames=3265']]) screenshot(src, 'test=shot&' + q, path.join(shots, n + '.png'));
  screenshot(path.join(tmp, 'game', 'index.html'), 'test=shot&frames=120', path.join(shots, 'real-art-test.png'));
  screenshot(path.join(tmp, 'game', 'index.html'), 'test=shot&frames=1&title=1', path.join(shots, 'real-art-title.png'));
  console.log('Screenshots written to ' + shots);
}
fs.rmSync(tmp, { recursive: true, force: true });

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed} of ${results.length} browser checks passed.`);
process.exit(failed ? 1 : 0);
