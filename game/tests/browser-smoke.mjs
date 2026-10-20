// Runs the game in a headless browser and checks it end to end.
// Run from game/:  node tests/browser-smoke.mjs [--shots <folder>]
// Needs a Chromium-based browser. Set CHROME_PATH if it isn't found automatically.
//
// Checks:
//  0. game/dist/ is up to date with game/src/ (fails with "run node tools/build.mjs" if not).
//  1. game/index.html: autopilot plays title -> level -> gauntlet -> clear -> restart, with no errors.
//  2. game/dist/index.html (run `node tools/build.mjs` first): the same.
//  3. Real-art loading: a temporary copy of the library with generated test images (a correct run strip,
//     a wrong-size idle strip, and a hurt strip in two versions) — proves the newest version loads and is drawn,
//     the hit flash uses real art, and a wrong-size file is reported and not drawn.
//  4. Real-sound loading: the same copy gets two generated WAV files (a sound effect and the level music)
//     — proves they are found, load in the browser, and play through real key presses without errors.
//  5. Screen fitting: at a landscape phone size (852x393, 3 real pixels per point) and a common laptop size
//     (1366x768), the canvas is the size layout.js works out, fills the phone's height, the page doesn't scroll,
//     and a screenshot shows every game pixel as an exact square block of real pixels (sharp, not blurred).
//     Neither size shows the touch buttons (a headless browser has a mouse, not a finger).
//  6. Touch buttons (?test=touch&touch=1) at a sideways phone (852x393) in both the source and built game, and an
//     upright phone (393x852): real touch events on the real buttons start the game, move, jump higher when held,
//     tail-whip, pause, mute and restart, two fingers at once work, and every way of lifting a finger lets go.
//  7. Phone layout: an upright phone with touch buttons shows the "turn your phone sideways" message (an upright iPad doesn't), keeps the game paused
//     and PLAY UPRIGHT ANYWAY puts it away; sideways and on computers it never shows, and computers show no
//     full-screen button. Hiding the page or leaving the window pauses the game (keys and touch).
//  8. Sound on phones (?test=audio, in the temporary copy with the test sounds): every kind of touch tries to start
//     sound, a refused try is retried, it stops listening once on, restarts after interruptions (not while hidden),
//     primes every sound file silently (only when the finger lifts), music stays paused while the game is, and mute silences every copy.
import fs from 'node:fs';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { scan } from '../tools/scan-assets.mjs';
import { parseCsv, cleared } from '../tools/licenses.mjs';
import { png } from './png-writer.mjs';
import { readChunks, decodePixels } from '../tools/png.mjs';

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

// extraFlags: more Chrome flags, e.g. a window size and pixel ratio to act like a phone.
function runPage(file, query, extraFlags = []) {
  const url = pathToFileURL(file).href + '?' + query;
  const r = spawnSync(chrome, ['--headless', '--disable-gpu', '--no-first-run', '--virtual-time-budget=60000', ...extraFlags, '--dump-dom', url],
    { encoding: 'utf8', timeout: 120000 });
  const m = /<pre id="test-result"[^>]*>([^<]*)<\/pre>/.exec(r.stdout || '');
  if (!m || !m[1]) return { ok: false, errors: ['no test result in page; stderr: ' + (r.stderr || '').slice(0, 300)] };
  return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
}
function screenshot(file, query, out, extraFlags = ['--window-size=960,672']) {
  const url = pathToFileURL(file).href + '?' + query;
  spawnSync(chrome, ['--headless', '--disable-gpu', '--hide-scrollbars', ...extraFlags, '--virtual-time-budget=20000', '--screenshot=' + out, url], { timeout: 120000 });
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

// 0: dist/ is fresh (no browser needed). Every source file except asset-files.js (which the build replaces)
// must appear unchanged in dist/index.html, and BUILD_INFO.txt must carry that file's hash.
const distHtml = path.join(gameDir, 'dist', 'index.html');
if (!fs.existsSync(distHtml)) {
  check('dist/index.html has the current code of every src/ file', false, 'dist/index.html missing — run node tools/build.mjs');
  check('dist/BUILD_INFO.txt names the hash of dist/index.html', false, 'dist/index.html missing — run node tools/build.mjs');
} else {
  const built = fs.readFileSync(distHtml, 'utf8');
  const stale = fs.readdirSync(path.join(gameDir, 'src')).filter((f) => f.endsWith('.js') && f !== 'asset-files.js')
    .filter((f) => !built.includes(fs.readFileSync(path.join(gameDir, 'src', f), 'utf8')));
  check('dist/index.html has the current code of every src/ file', !stale.length,
    stale.length ? 'out of date: ' + stale.join(', ') + ' — run node tools/build.mjs' : '');
  const info = fs.existsSync(path.join(gameDir, 'dist', 'BUILD_INFO.txt')) ? fs.readFileSync(path.join(gameDir, 'dist', 'BUILD_INFO.txt'), 'utf8') : '';
  const hash = crypto.createHash('sha256').update(built).digest('hex').slice(0, 12);
  check('dist/BUILD_INFO.txt names the hash of dist/index.html', info.includes('code ' + hash + ' '),
    info.includes('code ' + hash + ' ') ? hash : 'expected ' + hash + ' — run node tools/build.mjs');
}

// How many real sound files the scanner found in assets/ (from the generated src/asset-files.js);
// onlyCleared: just those whose design/ASSET_SOURCES.csv row lets them ship.
function presentSoundCount(onlyCleared) {
  const box = {};
  vm.runInNewContext(fs.readFileSync(path.join(gameDir, 'src', 'asset-files.js'), 'utf8'), box);
  const rows = parseCsv(fs.readFileSync(path.join(gameDir, '..', 'design', 'ASSET_SOURCES.csv'), 'utf8'));
  const ok = (f) => !onlyCleared || cleared(rows.find((r) => r.path === 'assets/' + f));
  // The game loads ONE format per sound (and per variation), so .mp3 and .ogg of the same recording count once.
  return Object.values(box.SAMMY.PRESENT_SOUND_FILES || {}).reduce((n, list) => n + new Set(list.filter(ok).map((f) => f.replace(/\.[a-z0-9]+$/i, ''))).size, 0);
}

const chrome = findChrome();
if (!chrome) { console.error('No Chromium-based browser found. Set CHROME_PATH.'); process.exit(2); }
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
  check(label + ': hiding the page or leaving the window pauses the game and lets go of keys (no auto-resume)',
    k.hiddenPauses && k.staysPaused && k.resumes && k.blurPauses, JSON.stringify({ hidden: k.hiddenPauses, stays: k.staysPaused, resumes: k.resumes, blur: k.blurPauses }));
  const t = runPage(file, 'test=touch&touch=1', ['--window-size=852,393', '--force-device-scale-factor=3']);
  check(label + ': touch buttons on a sideways phone play the game (move, jump, whip, pause, mute, restart)', t.ok,
    `checks ${JSON.stringify(t.checks)}, errors ${JSON.stringify(t.errors)}`);
  check(label + ': sideways phone: no "turn your phone sideways" message, full-screen button shown, leaving the page pauses',
    t.checks && t.checks.promptOnLoad === false && t.checks.fullButton && t.fit && t.fit.fullscreenAvailable && t.checks.blurPauses && t.checks.hiddenPauses,
    JSON.stringify({ prompt: t.checks && t.checks.promptOnLoad, full: t.checks && t.checks.fullButton, blur: t.checks && t.checks.blurPauses, hidden: t.checks && t.checks.hiddenPauses }));
  // Real art in assets/ (if any) must all load, at the right size.
  check(label + ': every real art file loads with no size warnings', r.assets && r.assets.loaded.length === r.assets.tried && r.assets.warnings.length === 0,
    `tried ${r.assets && r.assets.tried}, loaded ${JSON.stringify(r.assets && r.assets.loaded)}, warnings ${JSON.stringify(r.assets && r.assets.warnings)}`);
  // Real sound files: the source game loads every one the scanner listed (today the theme song); the built game only
  // the cleared ones (none yet: the theme song waits on its license, owner question 21).
  const wantSounds = presentSoundCount(!label.startsWith('source'));
  check(label + ': ' + (wantSounds ? 'every real sound file loads (' + wantSounds + ')' : 'no cleared sound files, so none loaded'),
    r.sounds && r.sounds.tried === wantSounds && r.sounds.loaded.length === wantSounds && r.sounds.failed.length === 0,
    `tried ${r.sounds && r.sounds.tried}, loaded ${JSON.stringify(r.sounds && r.sounds.loaded)}, failed ${JSON.stringify(r.sounds && r.sounds.failed)}`);
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

// 8: starting sound on phones (?test=audio), with the two test sounds as real <audio> files.
// Headless browsers can't make a real touch, so the first run lets sound start without one (as a real tap would)
// and the second uses the normal rule (sound needs a real touch): there, nothing may break and it keeps listening.
{
  const tmpGame = path.join(tmp, 'game', 'index.html');
  const au = runPage(tmpGame, 'test=audio&touch=1', ['--autoplay-policy=no-user-gesture-required', '--window-size=852,393', '--force-device-scale-factor=3']);
  const c = au.checks || {}, s = au.status || {};
  check('sound on phones (pretend engine): every kind of touch, click and key press tries; a refused try is retried; stops listening once sound runs',
    au.ok && au.fake.everyEventTries && au.fake.refusedStillListening && au.fake.silentSample && au.fake.runningAfterTouch && au.fake.listenersRemoved,
    JSON.stringify(au.fake || au.errors));
  check('sound on phones (pretend engine): restarts after a phone call, the lock screen, the back button or switching windows; never while hidden',
    au.ok && au.fake.interruptTriesAtOnce && au.fake.interruptListensAgain && au.fake.touchAfterInterrupt && au.fake.noTryWhileHidden &&
    au.fake.backOnShow && au.fake.backOnpageshow && au.fake.backOnfocus, JSON.stringify(au.fake || au.errors));
  check('sound on phones (real engine): a tap on a touch button starts it with a silent sample, primes all 5 files (music + 4 jump copies) silently when the finger lifts (not when it goes down), then stops listening',
    au.ok && c.touchButtonTries && c.silentSample && c.noPrimeOnFingerDown && c.primeOnFingerUp && c.running && c.elements === 5 && c.primed === 5 && c.stopsListening && c.noSoundCounted && c.restoredUnmuted,
    JSON.stringify({ c, errors: au.errors }));
  check('sound on phones (real engine): stopped while hidden it keeps listening; a tap on the sideways button restarts it',
    au.ok && c.suspended && c.listensWhileStopped && c.sidewaysButtonTries && c.runningAfterTap, JSON.stringify(c));
  check('sound on phones (real engine): music pauses with the game, does not come back by itself, comes back on unpause',
    au.ok && c.started && c.musicPlays && c.pausedOnHide && c.resumedOnShow && c.musicWaitsWhilePaused && c.musicBackOnUnpause, JSON.stringify(c));
  check('sound on phones (real engine): mute silences every sound file and copy, unmute brings them back', au.ok && c.muteAll && c.unmuteAll,
    JSON.stringify({ muteAll: c.muteAll, unmuteAll: c.unmuteAll, status: s }));
  const blocked = runPage(tmpGame, 'test=audio&touch=1', ['--window-size=852,393', '--force-device-scale-factor=3']);
  const bs = blocked.status || {};
  check('sound on phones without a real touch (normal browser rule): no errors, sound stays off and it keeps listening for a real tap',
    blocked.ok && blocked.errors.length === 0 && bs.state !== 'running' && bs.armed === true && blocked.checks.touchButtonTries &&
      blocked.checks.noPrimeOnFingerDown,
    JSON.stringify({ state: bs.state, armed: bs.armed, primed: bs.primed, errors: blocked.errors }));
}

// 5: screen fitting at a phone and a laptop size. The expected numbers come from layout.js itself.
const L = {}; vm.runInNewContext(fs.readFileSync(path.join(gameDir, 'src', 'layout.js'), 'utf8'), { globalThis: { SAMMY: L } });
const fitTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sammy-fit-test-'));
for (const [label, w, h, dpr, minFill] of [['landscape phone 852x393, 3 real px per point', 852, 393, 3, 0.9], ['laptop 1366x768', 1366, 768, 1, 0.85]]) {
  const flags = ['--window-size=' + w + ',' + h, '--force-device-scale-factor=' + dpr];
  const want = L.computeFit({ viewW: w, viewH: h, dpr, gameW: 320, gameH: 224 });
  const r = runPage(path.join(gameDir, 'index.html'), 'test=shot&frames=60', flags);
  const f = r.fit || {}, rect = f.rect || {};
  const close = (a, b) => Math.abs(a - b) < 0.01;
  check(`${label}: canvas is x${want.scale} (${want.cssW.toFixed(1)}x${want.cssH.toFixed(1)}) and centred, as layout.js works out`,
    r.ok && f.scale === want.scale && close(rect.w, want.cssW) && close(rect.h, want.cssH) && close(rect.x, want.cssLeft) && close(rect.y, want.cssTop),
    `got ${JSON.stringify(f)}`);
  check(`${label}: no touch buttons, full-screen button or "turn sideways" message (not a touch screen)`,
    r.fit && r.fit.touch === false && Object.keys(f.buttons || {}).length === 0 && f.promptVisible === false,
    `touch ${f.touch}, buttons ${JSON.stringify(f.buttons)}, message ${f.promptVisible}`);
  check(`${label}: game fills at least ${minFill * 100}% of the screen height, nothing cut off, page doesn't scroll`,
    rect.h / h >= minFill && rect.x >= 0 && rect.y >= 0 && rect.x + rect.w <= w + 0.01 && rect.y + rect.h <= h + 0.01 && f.scrollW <= w && f.scrollH <= h,
    `height ${(rect.h / h * 100).toFixed(1)}%, page ${f.scrollW}x${f.scrollH}`);
  // Sharpness: every game pixel must be one solid square of scale x scale real pixels, with a hard black edge outside.
  const out = path.join(fitTmp, 'fit.png');
  screenshot(path.join(gameDir, 'index.html'), 'test=shot&frames=1060', out, flags);
  let detail = 'no screenshot', sharp = false;
  if (fs.existsSync(out)) {
    const info = readChunks(fs.readFileSync(out)), px = decodePixels(info), s = want.scale;
    const x0 = Math.round(want.cssLeft * dpr), y0 = Math.round(want.cssTop * dpr);
    const at = (x, y) => { const i = (y * info.width + x) * 4; return (px[i] << 16) | (px[i + 1] << 8) | px[i + 2]; };
    let blurred = 0, colours = new Set();
    for (let gy = 0; gy < 224; gy++) for (let gx = 0; gx < 320; gx++) {
      const c = at(x0 + gx * s, y0 + gy * s); colours.add(c);
      outer: for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) if (at(x0 + gx * s + dx, y0 + gy * s + dy) !== c) { blurred++; break outer; }
    }
    const black = [at(x0 - 1, y0 + 100), at(x0 + 320 * s, y0 + 100), at(x0 + 100, y0 + 224 * s)].every((c) => c === 0) && (y0 === 0 || at(x0 + 100, y0 - 1) === 0);
    sharp = info.width === Math.round(w * dpr) && blurred === 0 && black && colours.size > 10;
    detail = `screenshot ${info.width}x${info.height}, ${blurred} blurred game pixels of ${320 * 224}, ${colours.size} colours, black edges ${black}`;
  }
  check(`${label}: screenshot is sharp (each game pixel is an exact block of real pixels)`, sharp, detail);
}
fs.rmSync(fitTmp, { recursive: true, force: true });

// 7: computers never show the message or any button, even in a tall narrow window.
for (const [w, h, dpr] of [[1920, 1080, 1], [1440, 900, 2], [500, 900, 1]]) {
  const r = runPage(path.join(gameDir, 'index.html'), 'test=shot&frames=60', ['--window-size=' + w + ',' + h, '--force-device-scale-factor=' + dpr]);
  const f = r.fit || {};
  check(`computer ${w}x${h}: no "turn sideways" message, no touch or full-screen buttons`, r.ok && f.touch === false && f.promptVisible === false &&
    Object.keys(f.buttons || {}).length === 0, `touch ${f.touch}, message ${f.promptVisible}, buttons ${JSON.stringify(f.buttons)}`);
}

// 6: touch buttons on an upright phone: the picture at the top, every button below it, and the game plays.
{
  const t = runPage(path.join(gameDir, 'index.html'), 'test=touch&touch=1', ['--window-size=393,852', '--force-device-scale-factor=3']);
  const f = t.fit || {}, b = f.buttons || {}, bottom = (f.rect ? f.rect.y + f.rect.h : 0);
  check('upright phone 393x852: touch buttons sit below the picture and play the game', t.ok &&
    ['pad', 'jump', 'whip', 'possum', 'pause'].every((n) => b[n] && b[n].y >= bottom - 0.01 && b[n].y + b[n].h <= 852.01),
    `buttons ${JSON.stringify(b)}, picture bottom ${bottom}, checks ${JSON.stringify(t.checks)}, errors ${JSON.stringify(t.errors)}`);
  const c = t.checks || {};
  check('upright phone 393x852: "turn your phone sideways" shows over the buttons and keeps the game paused',
    c.promptOnLoad && c.promptKeepsPaused && c.promptButtonOnTop, JSON.stringify({ shown: c.promptOnLoad, paused: c.promptKeepsPaused, onTop: c.promptButtonOnTop }));
  check('upright phone 393x852: PLAY UPRIGHT ANYWAY (at least 48x48 points) puts the message away; the game stays paused until PLAY',
    c.promptButtonBig && c.promptDismissed && c.stillPausedAfterDismiss, JSON.stringify({ big: c.promptButtonBig, gone: c.promptDismissed, paused: c.stillPausedAfterDismiss }));
  const u = runPage(path.join(gameDir, 'index.html'), 'test=shot&frames=60&touch=1&upright=1', ['--window-size=393,852', '--force-device-scale-factor=3']);
  check('upright phone 393x852 with ?upright=1: no message (screenshots of upright play)', u.ok && u.fit && u.fit.promptVisible === false && u.fit.buttons.pad,
    JSON.stringify(u.fit && { message: u.fit.promptVisible }));
  const ip = runPage(path.join(gameDir, 'index.html'), 'test=shot&frames=60&touch=1', ['--window-size=820,1180', '--force-device-scale-factor=2']);
  check('upright tablet 820x1180 (iPad): no "turn your phone sideways" message; plays upright with the touch buttons',
    ip.ok && ip.fit && ip.fit.promptVisible === false && ip.fit.buttons && ip.fit.buttons.pad, JSON.stringify(ip.fit && { message: ip.fit.promptVisible }));
}

if (shots) {
  fs.mkdirSync(shots, { recursive: true });
  const src = path.join(gameDir, 'index.html');
  for (const [n, q] of [['title', 'frames=1&title=1'], ['level', 'frames=1060'], ['arena', 'frames=2700'], ['clear', 'frames=3265']]) screenshot(src, 'test=shot&' + q, path.join(shots, n + '.png'));
  for (const [n, q] of [['touch-phone-level', 'frames=1060'], ['touch-phone-paused', 'frames=1060&paused=1']]) screenshot(src, 'test=shot&touch=1&' + q, path.join(shots, n + '.png'), ['--window-size=852,393', '--force-device-scale-factor=3']);
  for (const [n, q] of [['touch-upright-message', 'frames=1060'], ['touch-upright-play', 'frames=1060&upright=1']]) screenshot(src, 'test=shot&touch=1&' + q, path.join(shots, n + '.png'), ['--window-size=393,852', '--force-device-scale-factor=3']);
  screenshot(path.join(tmp, 'game', 'index.html'), 'test=shot&frames=120', path.join(shots, 'real-art-test.png'));
  screenshot(path.join(tmp, 'game', 'index.html'), 'test=shot&frames=1&title=1', path.join(shots, 'real-art-title.png'));
  console.log('Screenshots written to ' + shots);
}
fs.rmSync(tmp, { recursive: true, force: true });

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed} of ${results.length} browser checks passed.`);
process.exit(failed ? 1 : 0);
