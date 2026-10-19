// Builds a shareable copy of the game in game/dist/ (one index.html plus cleared art and sound).
// Run:  node tools/build.mjs
// Art and sound are only copied when design/ASSET_SOURCES.csv clears them (rules in tools/licenses.mjs).
// CREDITS.txt lists every copied file whose row says attribution_required "yes".
// Nothing from assets/references/ is ever copied. Nothing is uploaded or published.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scan } from './scan-assets.mjs';
import { parseCsv, cleared, excludeReason, needsCredit } from './licenses.mjs';

const gameDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.join(gameDir, '..');
const dist = path.join(gameDir, 'dist');

const scanResult = scan(root, path.join(gameDir, 'src', 'asset-files.js'));
const sources = parseCsv(fs.readFileSync(path.join(root, 'design', 'ASSET_SOURCES.csv'), 'utf8'));
const byPath = new Map(sources.map((r) => [r.path.replace(/^\.?\//, ''), r]));

const rowFor = (p) => byPath.get('assets/' + p);
const why = (p) => p + '  (' + excludeReason(rowFor(p)) + ')';
// Art: keyed by the planned name; the file is the newest version the scanner found.
const included = {}, excluded = [];
for (const [planned, p] of Object.entries(scanResult.files)) {
  if (p.startsWith('references/')) excluded.push(p + '  (reference-only folder)');
  else if (cleared(rowFor(p))) included[planned] = p;
  else excluded.push(why(p));
}
const artFiles = Object.values(included);
const soundsIncluded = {}, soundsExcluded = [];
for (const [id, files] of Object.entries(scanResult.sounds)) {
  for (const p of files) {
    if (cleared(rowFor(p))) (soundsIncluded[id] = soundsIncluded[id] || []).push(p);
    else soundsExcluded.push(why(p));
  }
}
const soundFiles = [].concat(...Object.values(soundsIncluded));

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
for (const p of artFiles.concat(soundFiles)) {
  const to = path.join(dist, 'assets', p);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(path.join(root, 'assets', p), to);
}

// Inline every script from index.html, in order, into a single page.
const html = fs.readFileSync(path.join(gameDir, 'index.html'), 'utf8');
const order = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
let js = "globalThis.SAMMY_ASSET_BASE = 'assets/';\n";
for (const rel of order) {
  let code = fs.readFileSync(path.join(gameDir, rel), 'utf8');
  if (rel.endsWith('asset-files.js')) {
    code = '(function (S) { S.PRESENT_ASSET_FILES = ' + JSON.stringify(included) + '; S.PRESENT_SOUND_FILES = ' +
      JSON.stringify(soundsIncluded) + '; })(globalThis.SAMMY = globalThis.SAMMY || {});\n';
  }
  if (/<\/script/i.test(code)) throw new Error(rel + ' contains "</script" and cannot be inlined');
  js += `\n// ---- ${rel} ----\n` + code;
}
const out = html
  .replace(/\s*<!-- Plain scripts[^>]*-->/, '')
  .replace(/(\s*<script src="[^"]+"><\/script>)+/, () => '\n  <script>\n' + js + '\n  </script>'); // function form: no $-pattern surprises
fs.writeFileSync(path.join(dist, 'index.html'), out);

const info = [
  'Sammy placeholder prototype — build ' + new Date().toISOString(),
  'Open index.html in a browser. Everything is in this folder; nothing is fetched from the internet.',
  '',
  `Art included (${artFiles.length}):`, ...artFiles.map((p) => '  ' + p),
  `Art left out (${excluded.length}):`, ...excluded.map((p) => '  ' + p),
  `Sound files included (${soundFiles.length}):`, ...soundFiles.map((p) => '  ' + p),
  `Sound files left out (${soundsExcluded.length}):`, ...soundsExcluded.map((p) => '  ' + p),
  '',
  'Placeholder shapes and code-generated beeps are used for everything not included.',
  'A file is included only when design/ASSET_SOURCES.csv says commercial_use "yes" and names a commercial-use license.',
].join('\n');
fs.writeFileSync(path.join(dist, 'BUILD_INFO.txt'), info + '\n');

const credits = artFiles.concat(soundFiles).filter((p) => needsCredit(rowFor(p))).map((p) => {
  const r = rowFor(p);
  return `${p}\n  by ${r.creator || 'unknown'}, ${r.license}, ${r.source_url || 'no source link'}`;
});
fs.writeFileSync(path.join(dist, 'CREDITS.txt'), ['Sammy — credits for art and sound in this build', '',
  ...(credits.length ? credits : ['No file in this build needs a credit line.'])].join('\n') + '\n');

console.log(`Built ${path.relative(process.cwd(), path.join(dist, 'index.html'))} (${(out.length / 1024).toFixed(0)} KB)`);
console.log(`Art included: ${artFiles.length}. Art left out: ${excluded.length}.`);
for (const p of excluded) console.log('  - ' + p);
console.log(`Sound files included: ${soundFiles.length}. Sound files left out: ${soundsExcluded.length}.`);
for (const p of soundsExcluded) console.log('  - ' + p);
if (credits.length) console.log(`Credits needed: ${credits.length} (see dist/CREDITS.txt).`);
if (!scanResult.found.length) console.log('No art files exist yet, so the build uses placeholders only.');
