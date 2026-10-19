// Builds a shareable copy of the game in game/dist/ (one index.html plus cleared art and sound).
// Run:  node tools/build.mjs
// Art and sound are only copied when design/ASSET_SOURCES.csv records a known license for them.
// Nothing from assets/references/ is ever copied. Nothing is uploaded or published.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scan } from './scan-assets.mjs';

const gameDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.join(gameDir, '..');
const dist = path.join(gameDir, 'dist');

// Minimal CSV reader (handles quoted fields).
function parseCsv(text) {
  const rows = []; let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; } else if (ch === '"') q = false; else field += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(field); rows.push(row); row = []; field = ''; }
    else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((c) => c.trim()));
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] || '').trim()])));
}

const unresolved = /^(|tbd|unknown|todo|\?|n\/a|none)$/i;
function cleared(row) {
  return row && !unresolved.test(row.license) && !/^(no|tbd|unknown)$/i.test(row.commercial_use || 'tbd') ? true : false;
}

const scanResult = scan(root, path.join(gameDir, 'src', 'asset-files.js'));
const sources = parseCsv(fs.readFileSync(path.join(root, 'design', 'ASSET_SOURCES.csv'), 'utf8'));
const byPath = new Map(sources.map((r) => [r.path.replace(/^\.?\//, ''), r]));

const included = [], excluded = [];
for (const p of scanResult.found) {
  const row = byPath.get('assets/' + p);
  if (p.startsWith('references/')) excluded.push(p + '  (reference-only)');
  else if (cleared(row)) included.push(p);
  else excluded.push(p + (row ? `  (license "${row.license || 'blank'}", commercial use "${row.commercial_use || 'blank'}")` : '  (no row in design/ASSET_SOURCES.csv)'));
}

function licenseNote(p) {
  const row = byPath.get('assets/' + p);
  return p + (row ? `  (license "${row.license || 'blank'}", commercial use "${row.commercial_use || 'blank'}")` : '  (no row in design/ASSET_SOURCES.csv)');
}
const soundsIncluded = {}, soundsExcluded = [];
for (const [id, files] of Object.entries(scanResult.sounds)) {
  for (const p of files) {
    if (cleared(byPath.get('assets/' + p))) (soundsIncluded[id] = soundsIncluded[id] || []).push(p);
    else soundsExcluded.push(licenseNote(p));
  }
}
const soundFiles = [].concat(...Object.values(soundsIncluded));

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
for (const p of included.concat(soundFiles)) {
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
  `Art included (${included.length}):`, ...included.map((p) => '  ' + p),
  `Art left out (${excluded.length}):`, ...excluded.map((p) => '  ' + p),
  `Sound files included (${soundFiles.length}):`, ...soundFiles.map((p) => '  ' + p),
  `Sound files left out (${soundsExcluded.length}):`, ...soundsExcluded.map((p) => '  ' + p),
  '',
  'Placeholder shapes and code-generated beeps are used for everything not included.',
].join('\n');
fs.writeFileSync(path.join(dist, 'BUILD_INFO.txt'), info + '\n');

console.log(`Built ${path.relative(process.cwd(), path.join(dist, 'index.html'))} (${(out.length / 1024).toFixed(0)} KB)`);
console.log(`Art included: ${included.length}. Art left out: ${excluded.length}.`);
for (const p of excluded) console.log('  - ' + p);
console.log(`Sound files included: ${soundFiles.length}. Sound files left out: ${soundsExcluded.length}.`);
for (const p of soundsExcluded) console.log('  - ' + p);
if (!scanResult.found.length) console.log('No art files exist yet, so the build uses placeholders only.');
