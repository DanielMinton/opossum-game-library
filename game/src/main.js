// Starts the game in the browser: screen scaling, the fixed-step loop, sound, and the ?test= self-checks.
(function (S) {
  const C = S.CONFIG;
  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');
  canvas.width = C.screenW; canvas.height = C.screenH;

  const params = new URLSearchParams(location.search);
  const errors = [];
  window.addEventListener('error', (e) => errors.push(String(e.message || e)));

  const input = S.createInput(window);
  // On-screen buttons for phones and tablets (touch.js). Off on desktops; ?touch=1 forces them on.
  const touch = S.createTouch({ input, canvas, forced: params.get('touch') === '1', onChange: () => fit() });

  // Whole-number scaling in the screen's real pixels keeps every game pixel a sharp square (maths in layout.js).
  // With touch buttons on, layout.js also places the buttons and may move or shrink the picture to keep them clear of it.
  function fit() {
    const vv = window.visualViewport;
    // The visual viewport leaves out phone browser bars; ignore it while pinch-zoomed (it shrinks then).
    const useVV = vv && Math.abs((vv.scale || 1) - 1) < 0.01;
    const viewW = useVV ? vv.width : window.innerWidth, viewH = useVV ? vv.height : window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    const opts = { viewW, viewH, dpr, gameW: C.screenW, gameH: C.screenH };
    const L = touch.active ? S.touchLayout(Object.assign({ safe: touch.safe() }, opts)) : null;
    const f = L ? L.fit : S.computeFit(opts);
    canvas.style.width = f.cssW + 'px'; canvas.style.height = f.cssH + 'px';
    canvas.style.left = f.cssLeft + 'px'; canvas.style.top = f.cssTop + 'px';
    if (L) touch.place(L);
    window.__SAMMY_FIT = Object.assign({ viewW, viewH, touch: touch.active }, f);
  }
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', fit);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', fit);
  // Browser zoom or moving the window to another screen changes the real-pixel ratio; re-fit and watch the new one.
  (function watchDpr() {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(resolution: ' + (window.devicePixelRatio || 1) + 'dppx)');
    const onChange = () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange); else if (mq.removeListener) mq.removeListener(onChange);
      fit(); watchDpr();
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange); else if (mq.addListener) mq.addListener(onChange);
  })();
  fit();

  const state = S.newGame();
  window.__SAMMY_STATE = state;
  const audio = S.createAudio();
  // Browsers only allow sound after the player does something. On phones a finger counts only when it lifts
  // (pointerup / touchend), so listen to those too. The touch buttons' events reach the window as well.
  let unlocks = 0;
  const unlock = () => { unlocks++; audio.unlock(); };
  for (const t of ['keydown', 'pointerdown', 'pointerup', 'touchend']) window.addEventListener(t, unlock);

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
    else if (params.get('test') === 'touch') touchTest();
    else if (params.has('test')) runTest(params.get('test'));
    else requestAnimationFrame(loop);
  };
  S.loadAssets({ base, probe: params.has('probe') }, (report) => {
    console.info('[sammy] art loaded:', report.loaded.length, 'of', report.expected);
    for (const w of report.warnings) console.warn('[sammy] art warning:', w);
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
    touch.update(state, state.muted);
    S.render(ctx, state);
  }

  // ---------- self-checks for headless browsers ----------
  // The current fit plus where the canvas really ended up, so tests can compare the two.
  function fitReport() {
    const b = canvas.getBoundingClientRect();
    const de = document.documentElement;
    return Object.assign({}, window.__SAMMY_FIT, { rect: { x: b.x, y: b.y, w: b.width, h: b.height },
      scrollW: de.scrollWidth, scrollH: de.scrollHeight, buttons: buttonReport() });
  }
  // Where each touch button really is on the page (shown ones only).
  function buttonReport() {
    const out = {};
    for (const n in touch.elements) {
      const b = touch.elements[n].el.getBoundingClientRect();
      if (b.width > 0 && b.height > 0) out[n] = { x: b.x, y: b.y, w: b.width, h: b.height };
    }
    return out;
  }
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
    const r = { test: 'keys', fit: fitReport(), mode: state.mode, x: Math.round(state.player.x), airborne: !state.player.grounded, errors, sounds: { loaded: S.soundReport.loaded, plays: S.soundPlays } };
    r.ok = r.mode === 'playing' && r.x > state.level.start.x + 50 && r.airborne && errors.length === 0;
    out.textContent = JSON.stringify(r);
    requestAnimationFrame(loop); // keep running normally afterwards
  }

  // ?test=touch&touch=1: real touch events on the real buttons, through the normal loop.
  function touchTest() {
    const out = document.getElementById('test-result');
    let now = 1000, nextId = 1;
    const run = (n) => { for (let i = 0; i < n; i++) { now += 1000 / 60; frame(now); } };
    const el = (n) => touch.elements[n].el;
    // A finger on a button: where on the button (0-1 across and down), and its own id so several can be down at once.
    const finger = (n, fx = 0.5, fy = 0.5) => {
      const id = nextId++;
      const at = (t, x) => {
        const b = el(n).getBoundingClientRect();
        el(n).dispatchEvent(new PointerEvent(t, { pointerId: id, pointerType: 'touch', isPrimary: id === 1, bubbles: true, cancelable: true,
          clientX: b.x + b.width * x, clientY: b.y + b.height * fy }));
      };
      at('pointerdown', fx);
      return { move: (x) => at('pointermove', x), up: () => at('pointerup', fx), cancel: () => at('pointercancel', fx), lost: () => at('lostpointercapture', fx) };
    };
    const tap = (n) => { const f = finger(n); run(1); f.up(); run(1); };
    const p = state.player, c = {};
    const noneHeld = () => { const h = touch.held(); return !Object.keys(h).some((k) => h[k]); };
    // How high Sammy rises from the ground (game pixels) while the jump finger stays down for `hold` frames.
    const rise = (hold) => {
      const y0 = p.y; let top = p.y;
      const f = finger('jump'); for (let i = 0; i < 70; i++) { if (i === hold) f.up(); run(1); top = Math.min(top, p.y); }
      run(30); return Math.round(y0 - top);
    };
    try {
      // On the title screen PAUSE is hidden (it would only start the game), and so is the pause menu.
      c.visibleOnTitle = ['pad', 'jump', 'whip', 'possum'].every((n) => buttonReport()[n]) && !buttonReport().pause && !buttonReport().restart;
      run(5);
      const unlocksBefore = unlocks;
      tap('jump');
      c.jumpStarts = state.mode === 'playing';
      run(1); c.pauseShownInPlay = !!buttonReport().pause;
      c.soundUnlocked = unlocks > unlocksBefore;
      run(5);
      // Hold the right half of the pad for a second.
      const x0 = p.x, pad = finger('pad', 0.8);
      run(60);
      c.movedRight = Math.round(p.x - x0);
      // Slide the same finger to the left half without lifting.
      const x1 = p.x; pad.move(0.2); run(20);
      c.slideLeft = p.face === -1 && p.x < x1 && touch.held().left && !touch.held().right;
      pad.up(); run(30);
      c.releasedPad = noneHeld();
      // A tap is a short hop; holding JUMP goes higher (the game reads the held button).
      c.tapRise = rise(1); c.holdRise = rise(60);
      // Move and jump at the same time with two fingers.
      const x2 = p.x, mv = finger('pad', 0.8); run(5); const jf = finger('jump'); run(10);
      c.moveAndJump = !p.grounded && p.x > x2 && touch.held().right && touch.held().jump;
      jf.up(); mv.up(); run(60);
      // Tail-whip.
      const wf = finger('whip'); run(2); c.whip = p.state === 'attack'; wf.up(); run(30);
      // Every way a finger can be lost clears what it held.
      let f = finger('pad', 0.9); run(1); f.cancel(); c.cancelClears = noneHeld();
      f = finger('jump'); run(1); f.lost(); c.lostCaptureClears = noneHeld();
      finger('pad', 0.9); finger('whip'); run(1); window.dispatchEvent(new Event('blur')); c.blurClears = noneHeld();
      finger('possum'); run(1);
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
      delete document.hidden;
      c.hiddenClears = noneHeld();
      run(5);
      // Pause shows RESTART and MUTE; MUTE toggles sound; RESTART goes back to the start.
      tap('pause');
      c.paused = state.mode === 'paused' && !!buttonReport().restart && !!buttonReport().mute;
      tap('mute'); c.muted = state.muted === true; tap('mute'); c.unmuted = state.muted === false;
      tap('restart');
      c.restarted = state.mode === 'playing' && state.player.x === state.level.start.x && !buttonReport().restart; // a new player object
      // Tapping the picture on the title screen starts the game too.
      state.mode = 'title'; run(2);
      canvas.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 99, pointerType: 'touch', bubbles: true }));
      run(2); c.tapPictureStarts = state.mode === 'playing';
    } catch (e) { errors.push(String(e && e.stack || e)); }
    const r = { test: 'touch', fit: fitReport(), mode: state.mode, checks: c, errors };
    r.ok = c.visibleOnTitle && c.jumpStarts && c.pauseShownInPlay && c.soundUnlocked && c.movedRight > 50 && c.slideLeft && c.releasedPad &&
      c.holdRise > c.tapRise + 10 && c.moveAndJump && c.whip && c.cancelClears && c.lostCaptureClears && c.blurClears &&
      c.hiddenClears && c.paused && c.muted && c.unmuted && c.restarted && c.tapPictureStarts && errors.length === 0;
    out.textContent = JSON.stringify(r);
    requestAnimationFrame(loop);
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
    const result = { test: name, ok: false, fit: fitReport(), errors, assets: { loaded: S.assetReport.loaded, warnings: S.assetReport.warnings, tried: S.assetReport.tried } };
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
      result.flashDraws = S.flashDraws;
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
      if (params.has('paused')) state.mode = 'paused';
      touch.update(state, state.muted);
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
