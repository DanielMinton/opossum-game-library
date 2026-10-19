// PLACEHOLDER SOUND: beeps and a short chiptune loop made in code with WebAudio.
// Replace with the real files listed in templates/examples/audio/AUDIO.md.
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

  S.createAudio = function () {
    let ctx = null, master = null, noiseBuf = null, timer = null, track = null, step = 0, nextT = 0;
    const api = { muted: false, ok: false };
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
    function stopMusic() { track = null; if (timer) { clearInterval(timer); timer = null; } }
    function playMusic(name) {
      stopMusic();
      if (!ctx || !TRACKS[name]) return;
      track = TRACKS[name]; step = 0; nextT = ctx.currentTime + 0.05;
      timer = setInterval(schedule, 25);
    }
    let current = null;
    api.unlock = function () { init(); if (ctx && ctx.state === 'suspended') ctx.resume(); };
    api.sfx = function (id) { const d = SFX[id]; if (d && ctx && !api.muted) tone(d[0], d[1], d[2], d[3], d[4]); };
    api.music = function (cmd) {
      if (cmd === 'stop' || cmd === 'pause') { stopMusic(); if (cmd === 'stop') current = null; return; }
      if (cmd === 'resume') { if (current) playMusic(current); return; }
      if (cmd === 'clear') {
        stopMusic(); current = null;
        if (ctx) [72, 76, 79, 84].forEach((n, i) => tone('square', midi(n), midi(n), 0.18, 0.15, ctx.currentTime + i * 0.12));
        return;
      }
      current = cmd; playMusic(cmd);
    };
    api.toggleMute = function () { api.muted = !api.muted; if (master) master.gain.value = api.muted ? 0 : 0.5; return api.muted; };
    return api;
  };
})(globalThis.SAMMY = globalThis.SAMMY || {});
