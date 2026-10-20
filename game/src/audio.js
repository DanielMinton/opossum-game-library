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
        if (ok && finished && opts.onLate) opts.onLate(); // arrived after the game started (main.js primes it on the next tap)
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

  // ---------- starting sound on phones (pure rules, tested in Node) ----------
  // Browsers (iPhone Safari most of all) stay silent until the player touches the screen or presses a key, and
  // some only count the finger *lifting*. So every kind of touch, click and key press tries to start sound.
  S.AUDIO_UNLOCK_EVENTS = ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'mousedown', 'click', 'keydown'];
  // Which of those count as a real "the player did something" moment, when a browser lets a sound file play for good:
  // a key, a mouse button, or a finger LIFTING (touchend, or pointerup from a finger or pen). A finger going down
  // (touchstart, or pointerdown from a finger) doesn't count. Every event still restarts the sound engine, but sound
  // files are only primed on these: a phone lets a muted file play at any time, so priming it on a finger going down
  // would look like it worked while the file stayed locked.
  S.isActivationEvent = (type, pointerType) => {
    if (type === 'touchend' || type === 'click' || type === 'keydown' || type === 'mousedown') return true;
    if (type === 'pointerdown') return pointerType === 'mouse';
    if (type === 'pointerup') return !!pointerType && pointerType !== 'mouse';
    return false;
  };
  // Sound is fully started once the sound engine is running and every sound file has been "primed" (played
  // silently once during a touch, which iPhones need before they let a file play later). Until then, keep listening.
  // state: the AudioContext state, or 'none' when the browser has no WebAudio.
  S.audioUnlockDone = (state, unprimed) => (state === 'running' || state === 'none') && unprimed === 0;
  // Try to restart sound after a phone call, the lock screen or switching apps: only while the page is showing.
  S.audioShouldResume = (state, visible) => !!visible && (state === 'suspended' || state === 'interrupted');
  // Which sound files to prime now: not yet primed, and not playing (the music that should be playing is left alone).
  S.primeTargets = (elements, isPrimed, musicEl, musicOn) =>
    elements.filter((el) => !isPrimed(el) && !(el === musicEl && musicOn) && el.paused !== false);
  // Copies of each sound effect file (so a sound can overlap itself), all made and primed during the first touch.
  S.SFX_POOL = 4;

  // opts (tests only): { AudioContext, sounds } to use instead of the browser's and S.sounds.
  S.createAudio = function (opts) {
    opts = opts || {};
    let ctx = null, master = null, noiseBuf = null, timer = null, track = null, step = 0, nextT = 0;
    const api = { muted: false, ok: false };
    const V = Object.assign({ musicVolume: 0.6, sfxVolume: 0.8 }, (S.CONFIG && S.CONFIG.sound) || {});
    const quiet = (p) => { if (p && p.catch) p.catch(() => {}); }; // play() is refused until the player presses a key
    const sounds = () => opts.sounds || S.sounds;
    const musicIds = new Set([].concat(...Object.values(S.MUSIC_TRACKS || {})));
    // For the self-checks: how many times each step happened.
    const stats = { unlocks: 0, silentPlays: 0, primeEvents: 0, primeTries: 0, refused: 0, resumeTries: 0, resumeRefused: 0, armed: false, rearms: 0 };

    // Real sound effects: a few copies of each file so the same sound can overlap itself.
    const pools = new Map();
    function poolFor(el) {
      let pool = pools.get(el);
      if (!pool) { pool = [el]; pools.set(el, pool); }
      return pool;
    }
    function playFile(id) {
      S.soundPlays[id] = (S.soundPlays[id] || 0) + 1;
      const list = sounds()[id];
      const el = list[Math.floor(Math.random() * list.length)];
      const pool = poolFor(el);
      let use = pool.find((a) => a.paused || a.ended);
      if (!use && pool.length < S.SFX_POOL) { use = el.cloneNode(); pool.push(use); }
      if (!use) use = pool[0];
      use.volume = V.sfxVolume; use.muted = api.muted;
      try { use.currentTime = 0; } catch (e) { /* not seekable yet */ }
      quiet(use.play());
    }
    // Every sound file element: each variation plus its copies.
    function allElements() {
      const out = [], all = sounds();
      for (const id in all) for (const el of all[id]) { const pool = pools.get(el); if (pool) out.push(...pool); else out.push(el); }
      return out;
    }
    // Make the copies of every sound effect now (during a touch), so each one can be primed.
    function fillPools() {
      const all = sounds();
      for (const id in all) {
        if (musicIds.has(id)) continue;
        for (const el of all[id]) {
          const pool = poolFor(el);
          try { while (pool.length < S.SFX_POOL) pool.push(el.cloneNode()); } catch (e) { /* keep what we have */ }
        }
      }
    }
    // Priming: play the file muted and stop it straight away, during the touch. iPhones then let it play later.
    // Done synchronously (not after play() finishes) so it can never stop music the game has just started.
    // If the browser says "not allowed" (that touch didn't count), it is tried again on the next touch.
    const primed = new WeakSet();
    function prime(el) {
      stats.primeTries++;
      let vol = 1, t = 0;
      try { vol = el.volume; t = el.currentTime || 0; } catch (e) { /* ignore */ }
      primed.add(el);
      try {
        el.muted = true;
        try { el.volume = 0; } catch (e) { /* read-only on iPhone; muted is enough */ }
        const p = el.play();
        el.pause();
        try { el.currentTime = t; } catch (e) { /* not seekable yet */ }
        if (p && p.catch) p.catch((err) => { if (err && err.name === 'NotAllowedError') { primed.delete(el); stats.refused++; arm(); } });
      } catch (e) {
        primed.delete(el);
      } finally {
        try { el.muted = api.muted; el.volume = vol; } catch (e) { /* ignore */ }
      }
    }
    function primeAll() {
      for (const el of S.primeTargets(allElements(), (e) => primed.has(e), musicEl, musicOn)) prime(el);
    }
    // A file that is playing with sound (the music, or a sound effect) has clearly been allowed: count it as primed.
    // (Not one playing muted: phones allow that without a touch.)
    function unprimedCount() {
      let n = 0;
      for (const el of allElements()) { if (!primed.has(el) && el.paused === false && !el.muted) primed.add(el); if (!primed.has(el)) n++; }
      return n;
    }

    // Real music: one <audio> element per track, looped. Pause keeps the position.
    let musicEl = null, musicOn = false;
    function fileTrack(name) {
      const all = sounds();
      for (const id of (S.MUSIC_TRACKS && S.MUSIC_TRACKS[name]) || []) if (all[id]) { all[id][0].soundId = id; return all[id][0]; }
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
    let initTried = false;
    function init() {
      if (ctx) return;
      initTried = true;
      try {
        const AC = opts.AudioContext || globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        // A phone call, the lock screen or another app can stop the sound engine ('suspended', or 'interrupted' on
        // iPhone). Try to restart it; if the browser wants a touch first, listen for one again.
        ctx.onstatechange = onStateChange;
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
    // Called on every touch, click and key press until sound is fully started (and again after interruptions).
    // ev: the event (sound files are primed only when it is a real activation, see S.isActivationEvent);
    // called without one, the caller vouches that this is a real activation. Never throws.
    api.unlock = function (ev) {
      stats.unlocks++;
      try {
        init();
        if (ctx) { tryResume(true); playSilence(); }
        if (!ev || S.isActivationEvent(ev.type, ev.pointerType)) {
          stats.primeEvents++;
          fillPools();
          primeAll();
        }
        if (musicOn && musicEl && musicEl.paused) quiet(musicEl.play()); // music asked for before the first key press
        checkDone();
      } catch (e) { /* never let sound break the game */ }
    };
    // The classic iPhone unlock: play one silent sample through the sound engine during the touch.
    function playSilence() {
      try {
        const b = ctx.createBuffer(1, 1, 22050), src = ctx.createBufferSource();
        src.buffer = b; src.connect(ctx.destination); src.start(0);
        stats.silentPlays++;
      } catch (e) { /* ignore */ }
    }
    // 'not-started' until the first touch; 'none' when the browser has no WebAudio at all.
    const ctxState = () => (ctx ? ctx.state : (initTried ? 'none' : 'not-started'));
    // Restart the sound engine. fromTouch: called during a touch or key press (always worth a try);
    // otherwise only while the page is showing. If it doesn't restart, listen for the next touch.
    function tryResume(fromTouch) {
      if (!ctx || ctx.state === 'running' || ctx.state === 'closed') return;
      if (!fromTouch && !S.audioShouldResume(ctx.state, visible())) { arm(); return; }
      stats.resumeTries++;
      try {
        const p = ctx.resume();
        if (p && p.then) p.then(afterResume, () => { stats.resumeRefused++; arm(); }); else afterResume();
      } catch (e) { /* not allowed without a touch */ }
      if (ctx.state !== 'running') arm();
    }
    function afterResume() {
      if (!ctx || ctx.state !== 'running') { arm(); return; }
      // Music that should be playing (the game isn't paused) and was stopped by the phone: carry on.
      // While the game is paused musicOn is false, so the music waits for the normal unpause.
      if (musicOn && musicEl && musicEl.paused) quiet(musicEl.play());
      checkDone();
    }
    function onStateChange() {
      if (!ctx) return;
      if (ctx.state === 'running') afterResume();
      else if (ctx.state !== 'closed') tryResume(false);
    }

    // ---------- listening for touches and key presses ----------
    let win = null, doc = null, onGesture = null;
    const visible = () => !doc || (doc.visibilityState ? doc.visibilityState !== 'hidden' : !doc.hidden);
    const LISTEN = { capture: true, passive: true };
    function gesture(ev) { if (onGesture) onGesture(); api.unlock(ev || { type: '' }); }
    function arm() {
      if (!win || stats.armed) return;
      for (const t of S.AUDIO_UNLOCK_EVENTS) win.addEventListener(t, gesture, LISTEN);
      stats.armed = true; stats.rearms++;
    }
    function disarm() {
      if (!win || !stats.armed) return;
      for (const t of S.AUDIO_UNLOCK_EVENTS) win.removeEventListener(t, gesture, LISTEN);
      stats.armed = false;
    }
    function checkDone() { if (S.audioUnlockDone(ctxState(), unprimedCount())) disarm(); else arm(); }
    // o: { win, doc, onGesture }. Listens on the whole window in the capture phase, so every touch counts,
    // including on the touch buttons and the "turn your phone sideways" button.
    api.attach = function (o) {
      win = o.win; doc = o.doc; onGesture = o.onGesture || null;
      const back = () => { if (ctx) tryResume(false); };
      if (doc) doc.addEventListener('visibilitychange', () => { if (visible()) back(); });
      win.addEventListener('pageshow', back);
      win.addEventListener('focus', back);
      arm();
    };
    // Sound files that finished loading after the first touch still need priming: keep listening if so.
    api.soundsChanged = function () { if (win && !S.audioUnlockDone(ctxState(), unprimedCount())) arm(); };
    api.status = function () {
      const els = allElements();
      return Object.assign({}, stats, { state: ctxState(), elements: els.length, primed: els.filter((e) => primed.has(e)).length,
        mutedElements: els.filter((e) => e.muted).length, musicPlaying: !!(musicEl && !musicEl.paused) });
    };
    // Self-check only: stop the sound engine as a phone call would.
    api.suspendForTest = function () { return ctx && ctx.suspend ? ctx.suspend() : Promise.resolve(); };
    api.musicElement = () => musicEl;
    api.sfx = function (id) {
      if (api.muted) return;
      if (sounds()[id] && sounds()[id].length) { playFile(id); return; }
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
        if (ctx && !sounds()['sfx-level-clear']) [72, 76, 79, 84].forEach((n, i) => tone('square', midi(n), midi(n), 0.18, 0.15, ctx.currentTime + i * 0.12));
        return;
      }
      current = cmd; playMusic(cmd);
    };
    api.toggleMute = function () {
      api.muted = !api.muted;
      if (master) master.gain.value = api.muted ? 0 : 0.5;
      // Every sound file and every copy, including ones still playing.
      for (const el of allElements()) { try { el.muted = api.muted; } catch (e) { /* ignore */ } }
      return api.muted;
    };
    return api;
  };
})(globalThis.SAMMY = globalThis.SAMMY || {});
