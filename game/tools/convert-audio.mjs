// Makes browser copies of WAV sound masters:  node tools/convert-audio.mjs [--mp3]
// Finds every .wav under assets/audio/ with no .ogg of the same name beside it, and makes that .ogg
// with ffmpeg (plus an .mp3 for older Safari with --mp3). Without ffmpeg it prints the commands to run.
// Never deletes or overwrites a file: the WAV stays as the master copy.
// Options: --root <library folder> (default: the folder above game/)   --mp3
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const gameDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Pure file selection (no ffmpeg): the WAVs under <root>/assets/audio/ that still need an .ogg (and .mp3 if asked).
// Returns [{ wav, ogg, mp3 }] with absolute paths; ogg/mp3 are null when that copy already exists.
export function findWavsToConvert(root, opts = {}) {
  const out = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir).sort()) {
      const p = path.join(dir, name);
      if (fs.statSync(p).isDirectory()) { walk(p); continue; }
      if (!/\.wav$/i.test(name)) continue;
      const base = p.slice(0, -4);
      const ogg = fs.existsSync(base + '.ogg') ? null : base + '.ogg';
      const mp3 = !opts.mp3 || fs.existsSync(base + '.mp3') ? null : base + '.mp3';
      if (ogg) out.push({ wav: p, ogg, mp3 });
    }
  };
  walk(path.join(root, 'assets', 'audio'));
  return out;
}

// ffmpeg arguments: -n = never overwrite. OGG Vorbis at quality 5; MP3 at VBR quality 2.
// Some ffmpeg builds lack libvorbis; their built-in Vorbis encoder works but needs stereo and sounds a bit worse.
export function ffmpegArgs(src, dest, builtinVorbis) {
  const codec = /\.mp3$/i.test(dest) ? ['-c:a', 'libmp3lame', '-q:a', '2']
    : builtinVorbis ? ['-c:a', 'vorbis', '-strict', '-2', '-ac', '2', '-q:a', '5'] : ['-c:a', 'libvorbis', '-q:a', '5'];
  return ['-hide_banner', '-loglevel', 'error', '-n', '-i', src, ...codec, dest];
}

const quote = (a) => (/^[\w./:=+-]+$/.test(a) ? a : "'" + a.replace(/'/g, "'\\''") + "'");

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
  const root = path.resolve(arg('--root', path.join(gameDir, '..')));
  const todo = findWavsToConvert(root, { mp3: process.argv.includes('--mp3') });
  if (!todo.length) { console.log('Nothing to convert: every .wav in assets/audio/ already has an .ogg beside it.'); process.exit(0); }
  const jobs = [];
  for (const t of todo) for (const dest of [t.ogg, t.mp3]) if (dest) jobs.push([t.wav, dest]);
  const probe = spawnSync('ffmpeg', ['-hide_banner', '-encoders'], { encoding: 'utf8' });
  if (probe.error) {
    console.log('ffmpeg was not found, so nothing was converted. Install it (e.g. `brew install ffmpeg`), or run these commands:');
    for (const [src, dest] of jobs) console.log('  ffmpeg ' + ffmpegArgs(src, dest).map(quote).join(' '));
    process.exit(1);
  }
  const builtin = !/\blibvorbis\b/.test(probe.stdout || '');
  if (builtin) console.log('This ffmpeg has no libvorbis, so the built-in Vorbis encoder is used (fine for testing; a bit lower quality).');
  let failed = 0;
  for (const [src, dest] of jobs) {
    const existed = fs.existsSync(dest);
    const r = spawnSync('ffmpeg', ffmpegArgs(src, dest, builtin), { encoding: 'utf8' });
    const ok = !existed && r.status === 0 && fs.existsSync(dest) && fs.statSync(dest).size > 0;
    if (!ok) failed += 1;
    if (!ok && !existed && fs.existsSync(dest)) fs.rmSync(dest); // a failed run can leave an empty file; never touches the WAV
    console.log((ok ? '  made ' : '  FAILED ') + path.relative(root, dest) + (ok ? '' : '  ' + (r.stderr || '').trim()));
  }
  console.log(`Converted ${jobs.length - failed} of ${jobs.length}. The .wav files were left as they are. Now run: node tools/scan-assets.mjs`);
  process.exit(failed ? 1 : 0);
}
