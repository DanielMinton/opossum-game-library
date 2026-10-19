// Sound: real files when they exist (see S.SOUND_MANIFEST in assets.js), placeholder beeps otherwise.
// Real files play through plain <audio> elements, which also work when index.html is opened by double-click.
// The placeholder beeps and chiptune loop are made in code with WebAudio.
(function (S) {
  // type, start Hz, end Hz, seconds, volume
  const SFX = {
    'sfx-jump': ['square', 300, 700, 0.15, 0.25],
    'sfx-land': ['noise', 200, 100, 0.08, 0.2],
    'sfx-tail-whip': ['noise', 1200, 400, 0.12, 0.2],
    'sfx-hit-zombie': ['square', 220, 80, 0.12, 0.3],
    'sfx-zombie-groan': ['sawtooth', 110, 70, 0.5, 0.15],
    'sfx-zombie-defeat-comedic': ['square', 900, 120, 0.5, 0.25],
    'sfx-pickup': ['square', 600, 1200, 0.2, 0.25],
    'sfx-hurt': ['square', 500, 150, 0.25, 0.3],
    'sfx-play-dead': ['triangle', 400, 60, 0.5, 0.35],
    'sfx-cart-rock': ['noise', 500, 300, 0.1, 0.2],
    'sfx-cart-crash': ['noise', 900, 100, 0.4, 0.35],
    'sfx-ko': ['triangle', 400, 100, 1.0, 0.35],
    'sfx-shield-block': ['square', 1400, 1000, 0.1, 0.25],
    'sfx-shield-break': ['noise', 1600, 200, 0.3, 0.3],
    'sfx-throw': ['noise', 600, 900, 0.1, 0.15],
    'sfx-splat': ['noise', 300, 80, 0.15, 0.2],
    'sfx-splash': ['noise', 800, 200, 0.3, 0.25],
    'sfx-checkpoint': ['square', 800, 1600, 0.25, 0.2],
    'sfx-gate-open': ['triangle', 200, 800, 0.6, 0.3],
    'sfx-level-clear': ['square', 523, 1046, 0.6, 0.25],
    'sfx-start': ['square', 440, 880, 0.2, 0.2],
  };
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const TRACKS = {
    level: { bpm: 132, bass: [36, 0, 43, 0, 39, 0, 43, 39, 41, 0, 48, 0, 43, 0, 38, 43],
      lead: [72, 0, 75, 77, 79, 0, 77, 75, 72, 0, 70, 72, 75, 0, 0, 0, 72, 0, 75, 77, 79, 0, 82, 79, 77, 0, 75, 74, 72, 0, 0, 0] },
    arena: { bpm: 160, bass: [36, 36, 48, 36, 39, 39, 51, 39, 41, 41, 53, 41, 43, 43, 55, 42],
      lead: [84, 0, 82, 0, 79, 0, 82, 84, 86, 0, 84, 0, 82, 79, 77, 79] },
  };

  // ---------- loading real sound files ----------
  const MIME = { ogg: 'audio/ogg', mp3: 'audio/mpeg', wav: 'audio/wav' };
  S.sounds = {};       // id -> [<audio> element per variation]
  S.soundPlays = {};   // id -> times a real file was played (used by the tests)
  S.soundReport = { expected: 0, tried: 0, loaded: [], failed: [], unplayable: [], base: '' };

  // Groups an id's files by variation and picks the first format this browser can play.
  function pickFiles(id, files) {
    const groups = {};
    for (const f of files) {
      const name = f.split('/').pop();
      const info = S.soundFileInfo(id, name);
      if (!info) continue;
      (groups[info.variant] = groups[info.variant] || {})[info.format] = f;
    }
    const probe = typeof Audio !== 'undefined' ? new Audio() : null;
    const picked = [], unplayable = [];
    for (const key of Object.keys(groups).sort()) {
      const fmt = S.SOUND_FORMATS.find((x) => groups[key][x] && probe && probe.canPlayType(MIME[x]));
      if (fmt) picked.push(groups[key][fmt]); else unplayable.push(...Object.values(groups[key]));
    }
    return { picked, unplayable };
  }

  // Loads every sound that exists. Calls done(report) when all have loaded or failed, or after `timeout` ms,
  // so a large or broken file can't hold up the game. Sounds still loading after that keep loading.
  S.loadSounds = function (opts, done) {
    const R = S.soundReport;
    const present = S.PRESENT_SOUND_FILES || {};
    R.base = opts.base; R.expected = S.SOUND_MANIFEST.length;
    const want = [];
    for (const m of S.SOUND_MANIFEST) {
      const files = opts.probe ? [m.dir + m.id + '-v01.ogg'] : (present[m.id] || []);
      if (!files.length) continue;
      const { picked, unplayable } = pickFiles(m.id, files);
      R.unplayable.push(...unplayable);
      for (const f of picked) want.push({ id: m.id, path: f });
    }
    R.tried = want.length;
    if (!want.length || typeof Audio === 'undefined') { done(R); return; }
    let left = want.length, finished = false;
    const finish = () => { if (!finished) { finished = true; done(R); } };
    const timer = setTimeout(finish, opts.timeout || 4000);
    for (const w of want) {
      const el = new Audio();
      let settled = false;
      const settle = (ok) => {
        if (settled) return; settled = true;
        if (ok) { (S.sounds[w.id] = S.sounds[w.id] || []).push(el); R.loaded.push(w.path); } else R.failed.push(w.path);
        left -= 1; if (left === 0) { clearTimeout(timer); finish(); }
      };
      el.preload = 'auto';
      el.addEventListener('canplaythrough', () => settle(true), { once: true });
      el.addEventListener('loadeddata', () => settle(true), { once: true });
      el.addEventListener('error', () => settle(false), { once: true });
      el.src = opts.base + w.path;
      el.load();
    }
  };

  S.createAudio = function () {
    let ctx = null, master = null, noiseBuf = null, timer = null, track = null, step = 0, nextT = 0;
    const api = { muted: false, ok: false };
    const V = Object.assign({ musicVolume: 0.6, sfxVolume: 0.8 }, (S.CONFIG && S.CONFIG.sound) || {});
    const quiet = (p) => { if (p && p.catch) p.catch(() => {}); }; // play() is refused until the player presses a key

    // Real sound effects: a few copies of each file so the same sound can overlap itself.
    const pools = new Map();
    function playFile(id) {
      S.soundPlays[id] = (S.soundPlays[id] || 0) + 1;
      const list = S.sounds[id];
      const el = list[Math.floor(Math.random() * list.length)];
      let pool = pools.get(el);
      if (!pool) { pool = [el]; pools.set(el, pool); }
      let use = pool.find((a) => a.paused || a.ended);
      if (!use && pool.length < 4) { use = el.cloneNode(); pool.push(use); }
      if (!use) use = pool[0];
      use.volume = V.sfxVolume;
      try { use.currentTime = 0; } catch (e) { /* not seekable yet */ }
      quiet(use.play());
    }

    // Real music: one <audio> element per track, looped. Pause keeps the position.
    let musicEl = null, musicOn = false;
    function fileTrack(name) {
      for (const id of (S.MUSIC_TRACKS && S.MUSIC_TRACKS[name]) || []) if (S.sounds[id]) { S.sounds[id][0].soundId = id; return S.sounds[id][0]; }
      return null;
    }
    function startFile(el) {
      S.soundPlays[el.soundId] = (S.soundPlays[el.soundId] || 0) + 1;
      musicEl = el; musicOn = true;
      el.loop = true; el.volume = V.musicVolume; el.muted = api.muted;
      try { el.currentTime = 0; } catch (e) { /* not seekable yet */ }
      quiet(el.play());
    }
    function stopFile(keepPlace) {
      musicOn = false;
      if (!musicEl) return;
      musicEl.pause();
      if (!keepPlace) { try { musicEl.currentTime = 0; } catch (e) { /* ignore */ } musicEl = null; }
    }
    function init() {
      if (ctx) return;
      try {
        const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        master = ctx.createGain(); master.gain.value = api.muted ? 0 : 0.5; master.connect(ctx.destination);
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        api.ok = true;
      } catch (e) { ctx = null; }
    }
    function tone(type, f0, f1, dur, vol, when) {
      if (!ctx) return;
      const t = when || ctx.currentTime;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      g.connect(master);
      if (type === 'noise') {
        const src = ctx.createBufferSource(); src.buffer = noiseBuf;
        const flt = ctx.createBiquadFilter(); flt.type = 'bandpass';
        flt.frequency.setValueAtTime(f0, t); flt.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
        src.connect(flt); flt.connect(g); src.start(t); src.stop(t + dur);
      } else {
        const o = ctx.createOscillator(); o.type = type;
        o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
        o.connect(g); o.start(t); o.stop(t + dur);
      }
    }
    function schedule() {
      if (!ctx || !track) return;
      const sd = 60 / track.bpm / 2;
      while (nextT < ctx.currentTime + 0.12) {
        const b = track.bass[step % track.bass.length], l = track.lead[step % track.lead.length];
        if (b) tone('triangle', midi(b), midi(b), sd * 0.9, 0.22, nextT);
        if (l) tone('square', midi(l), midi(l), sd * 0.8, 0.07, nextT);
        nextT += sd; step += 1;
      }
    }
    // Placeholder loop: keepPlace (pause) remembers the step so resume carries on from there.
    let heldStep = 0;
    function stopMusic(keepPlace) {
      heldStep = keepPlace && track ? step : 0;
      track = null; if (timer) { clearInterval(timer); timer = null; } stopFile(keepPlace);
    }
    function playMusic(name, fromStep) {
      const el = fileTrack(name);
      if (el && el === musicEl) { // same file already playing or paused (e.g. no gauntlet track, R while paused): keep going
        if (!musicOn) { musicOn = true; quiet(el.play()); }
        return;
      }
      stopMusic();
      if (el) { startFile(el); return; }
      if (!ctx || !TRACKS[name]) return;
      track = TRACKS[name]; step = fromStep || 0; nextT = ctx.currentTime + 0.05;
      timer = setInterval(schedule, 25);
    }
    let current = null;
    api.unlock = function () {
      init(); if (ctx && ctx.state === 'suspended') ctx.resume();
      if (musicOn && musicEl && musicEl.paused) quiet(musicEl.play()); // music asked for before the first key press
    };
    api.sfx = function (id) {
      if (api.muted) return;
      if (S.sounds[id] && S.sounds[id].length) { playFile(id); return; }
      const d = SFX[id]; if (d && ctx) tone(d[0], d[1], d[2], d[3], d[4]);
    };
    api.music = function (cmd) {
      if (cmd === 'stop') { stopMusic(); current = null; return; }
      if (cmd === 'pause') { stopMusic(true); return; }
      if (cmd === 'resume') {
        if (musicEl) { musicOn = true; quiet(musicEl.play()); } else if (current) playMusic(current, heldStep);
        return;
      }
      if (cmd === 'clear') {
        stopMusic(); current = null;
        // A real level-clear sound replaces the placeholder jingle (sfx-level-clear plays at the same moment).
        if (ctx && !S.sounds['sfx-level-clear']) [72, 76, 79, 84].forEach((n, i) => tone('square', midi(n), midi(n), 0.18, 0.15, ctx.currentTime + i * 0.12));
        return;
      }
      current = cmd; playMusic(cmd);
    };
    api.toggleMute = function () {
      api.muted = !api.muted;
      if (master) master.gain.value = api.muted ? 0 : 0.5;
      if (musicEl) musicEl.muted = api.muted;
      return api.muted;
    };
    return api;
  };
})(globalThis.SAMMY = globalThis.SAMMY || {});
