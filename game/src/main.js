// Starts the game in the browser: screen scaling, the fixed-step loop, sound, and the ?test= self-checks.
(function (S) {
  const C = S.CONFIG;
  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');
  canvas.width = C.screenW; canvas.height = C.screenH;

  const params = new URLSearchParams(location.search);
  const errors = [];
  window.addEventListener('error', (e) => errors.push(String(e.message || e)));

  // Whole-number scaling keeps pixels square and sharp.
  function fit() {
    const scale = Math.max(1, Math.floor(Math.min(window.innerWidth / C.screenW, window.innerHeight / C.screenH)));
    canvas.style.width = C.screenW * scale + 'px';
    canvas.style.height = C.screenH * scale + 'px';
  }
  window.addEventListener('resize', fit); fit();

  const state = S.newGame();
  window.__SAMMY_STATE = state;
  const input = S.createInput(window);
  const audio = S.createAudio();
  const unlock = () => audio.unlock();
  window.addEventListener('keydown', unlock); window.addEventListener('pointerdown', unlock);

  function drainEvents() {
    for (const ev of state.events) {
      if (ev.type === 'sfx') audio.sfx(ev.id);
      else if (ev.type === 'music') audio.music(ev.id);
    }
    state.events.length = 0;
  }

  let last = 0, acc = 0; // frame timing (declared before loading starts)
  const base = params.get('assetBase') || globalThis.SAMMY_ASSET_BASE || '../assets/';
  // Art must load before the game starts. Sound loads alongside it, but never waits more than a few seconds.
  let pending = 2;
  const ready = () => {
    pending -= 1; if (pending) return;
    if (params.get('test') === 'keys') keysTest();
    else if (params.has('test')) runTest(params.get('test'));
    else requestAnimationFrame(loop);
  };
  S.loadAssets({ base, probe: params.has('probe') }, (report) => {
    console.info('[sammy] art loaded:', report.loaded.length, 'of', report.expected, report.warnings.length ? report.warnings : '');
    ready();
  });
  S.loadSounds({ base, probe: params.has('probe') }, (report) => {
    console.info('[sammy] sounds loaded:', report.loaded.length, 'of', report.tried, 'files found',
      report.failed.length ? { failed: report.failed } : '', report.unplayable.length ? { unplayable: report.unplayable } : '');
    ready();
  });

  function loop(now) { frame(now); requestAnimationFrame(loop); }
  function frame(now) {
    const dt = last ? Math.min(0.25, (now - last) / 1000) : C.step;
    last = now;
    acc += dt;
    if (state.mode === 'title') state.titleT = (state.titleT || 0) + dt;
    while (acc >= C.step) {
      const inp = input.poll();
      if (inp.mute) state.muted = audio.toggleMute();
      S.update(state, inp);
      drainEvents();
      acc -= C.step;
    }
    S.render(ctx, state);
  }

  // ---------- self-checks for headless browsers ----------
  // ?test=keys: real key presses through the normal loop (Enter to start, then hold Right).
  function keysTest() {
    const out = document.getElementById('test-result');
    const key = (type, code) => window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
    // Real key events through the real listeners, input polling, update, sound and drawing.
    // Frames are stepped by hand because headless browsers barely fire requestAnimationFrame.
    let now = 1000;
    const run = (n) => { for (let i = 0; i < n; i++) { now += 1000 / 60; frame(now); } };
    try {
    run(5); key('keydown', 'Enter'); key('keyup', 'Enter');
    run(5); key('keydown', 'ArrowRight');
    run(60); key('keyup', 'ArrowRight');
    run(2); key('keydown', 'KeyZ');
    run(8);
    } catch (e) { errors.push(String(e && e.stack || e)); }
    const r = { test: 'keys', mode: state.mode, x: Math.round(state.player.x), airborne: !state.player.grounded, errors, sounds: { loaded: S.soundReport.loaded, plays: S.soundPlays } };
    r.ok = r.mode === 'playing' && r.x > state.level.start.x + 50 && r.airborne && errors.length === 0;
    out.textContent = JSON.stringify(r);
    requestAnimationFrame(loop); // keep running normally afterwards
  }

  // Draw every state the autopilot can't reach (it never takes damage), to catch drawing errors.
  function renderSweep() {
    const p = state.player, saved = JSON.stringify({ mode: state.mode });
    const drawn = [];
    const draw = (label) => { S.render(ctx, state); drawn.push(label); };
    state.mode = 'playing';
    for (const st of ['hurt', 'playdead', 'getup', 'ko', 'attack', 'normal']) {
      p.state = st; p.t = st === 'ko' ? 1 : 0.15; p.anim = { hurt: 'hurt', playdead: 'play-dead', getup: 'get-up', ko: 'ko', attack: 'tail-whip', normal: 'idle' }[st];
      p.invuln = 0; draw('sammy-' + st);
    }
    p.shield = 3; draw('shield'); p.shield = 1; draw('shield-cracked'); p.possumCd = 3; draw('possum-cooldown');
    const jog = state.enemies.find((e) => e.type === 'jogger'), ven = state.enemies.find((e) => e.type === 'vendor');
    for (const e of [jog, ven]) if (e) { e.x = p.x + 40; }
    for (const st of ['confused', 'spawn', 'attack', 'hitreact', 'defeat']) if (jog) { jog.state = st; jog.t = 0.2; draw('jogger-' + st); }
    for (const st of ['shrug', 'throw', 'hitreact', 'defeat']) if (ven) { ven.state = st; ven.t = 0.2; draw('vendor-' + st); }
    for (const c of state.carts) for (const st of ['upright', 'rocking', 'tipping', 'tipped', 'empty']) { c.state = st; c.t = 0.1; c.anim = st === 'tipped' ? 'tipped-over' : st; draw('cart-' + st); }
    state.projectiles.push({ x: p.x + 20, y: p.y - 20, vx: 0, vy: 0, t: 0.1, life: 1 });
    for (const k of ['spark', 'dust', 'splat', 'splash', 'sparkle', 'bang', 'text']) state.effects.push({ kind: k, x: p.x, y: p.y - 10, t: 0.05, life: 1, text: 'TEST' });
    state.arena.state = 'fight'; state.arena.wave = 1; draw('effects-arena');
    state.mode = 'paused'; draw('paused');
    state.muted = true; draw('muted');
    state.mode = 'title'; draw('title');
    return drawn;
  }

  // ?test=full: autopilot plays the level; ?test=shot&frames=N: stop after N frames for a screenshot.
  function runTest(name) {
    const out = document.getElementById('test-result');
    const result = { test: name, ok: false, errors, assets: { loaded: S.assetReport.loaded, warnings: S.assetReport.warnings, tried: S.assetReport.tried } };
    const SR = S.soundReport;
    result.sounds = { tried: SR.tried, loaded: SR.loaded, failed: SR.failed, unplayable: SR.unplayable };
    try {
      const bot = S.makeBot();
      const frames = parseInt(params.get('frames') || '0', 10);
      state.god = params.get('god') !== '0';
      const seen = new Set();
      let f = 0;
      const limit = frames || 60 * 600;
      for (; f < limit; f++) {
        S.update(state, S.botInput(state, bot));
        state.events.length = 0;
        seen.add(state.mode);
        if (state.arena.state !== 'idle') seen.add('arena-' + state.arena.state);
        if (f % 4 === 0) S.render(ctx, state);            // exercise drawing in every game state
        if (!frames && state.mode === 'clear') break;
      }
      // Let the level-clear tally finish counting before checking restart.
      for (let i = 0; i < 120 && state.mode === 'clear'; i++) { S.update(state, S.makeInput()); if (i % 4 === 0) S.render(ctx, state); }
      result.frames = f;
      result.modesSeen = Array.from(seen);
      result.stats = state.stats;
      result.realArtDraws = S.spriteDraws;
      result.player = { x: Math.round(state.player.x), hp: state.player.hp, state: state.player.state };
      if (name === 'full') {
        result.reachedClear = state.mode === 'clear';
        const restart = S.makeInput(); restart.pressed.start = true;
        S.update(state, restart);
        result.restartOk = state.mode === 'playing' && state.player.x === state.level.start.x && state.stats.defeated === 0;
        S.update(state, S.makeInput());
        result.renderSweep = renderSweep().length;
        result.ok = result.reachedClear && result.restartOk && errors.length === 0;
        S.resetLevel(state); state.mode = 'playing';
      } else {
        result.ok = errors.length === 0;
      }
      if (params.has('title')) state.mode = 'title';
      S.render(ctx, state);
    } catch (e) {
      errors.push(String(e && e.stack || e));
    }
    result.errors = errors;
    out.textContent = JSON.stringify(result);
    if (name === 'shot') out.style.visibility = 'hidden'; // keep screenshots clean; text stays in the page for --dump-dom
    document.title = result.ok ? 'TEST PASS' : 'TEST FAIL';
  }
})(globalThis.SAMMY = globalThis.SAMMY || {});
