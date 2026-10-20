// Starts the game in the browser: screen scaling, the fixed-step loop, sound, and the ?test= self-checks.
(function (S) {
  const C = S.CONFIG;
  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');
  canvas.width = C.screenW; canvas.height = C.screenH;

  const params = new URLSearchParams(location.search);
  const errors = [];
  window.addEventListener('error', (e) => errors.push(String(e.message || e)));

  // Gore setting (render.js; drawing only): ?gore=low|full, else what this browser remembered, else full.
  let store = null;
  try { store = window.localStorage; } catch (e) { /* blocked storage: the setting just isn't remembered */ }
  S.setGore(S.pickGore(params.get('gore'), S.readGorePref(store)));
  S.goreNote = 0;
  function toggleGore() {
    S.writeGorePref(store, S.setGore(S.gore === 'low' ? 'full' : 'low'));
    S.goreNote = 90; // frames of "GORE: LOW" feedback on screen
  }

  const input = S.createInput(window);
  const state = S.newGame();
  window.__SAMMY_STATE = state;
  const audio = S.createAudio();
  // Phone page behaviour (phone.js): the "turn your phone sideways" message, full screen, no accidental zoom.
  // ?upright=1 starts with the message already put away (for screenshots of upright play).
  const phone = S.createPhone({
    dismissed: params.get('upright') === '1',
    onDismiss: () => fit(),
    onFullscreenChange: (on) => { touch.setFullscreen(on); fit(); },
  });
  // On-screen buttons for phones and tablets (touch.js). Off on desktops; ?touch=1 forces them on.
  const touch = S.createTouch({ input, canvas, forced: params.get('touch') === '1', onChange: () => fit(),
    fullscreen: { available: phone.fullscreenAvailable, toggle: phone.toggleFullscreen } });

  // Pause straight away (only during play), through the normal pause path so the music pauses too.
  // Used when the page is hidden or loses focus, and while the "turn your phone sideways" message is up.
  function pauseNow() {
    if (state.mode !== 'playing') return;
    const inp = S.makeInput(); inp.pressed.start = true;
    S.update(state, inp);
    drainEvents();
  }
  // Phone locked, app or tab switched, or another window clicked: pause (never resume by itself).
  // Held keys and touch buttons are let go by input.js and touch.js.
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseNow(); });
  window.addEventListener('blur', pauseNow);

  // Whole-number scaling in the screen's real pixels keeps every game pixel a sharp square (maths in layout.js).
  // With touch buttons on, layout.js also places the buttons and may move or shrink the picture to keep them clear of it.
  function fit() {
    const vv = window.visualViewport;
    // The visual viewport leaves out phone browser bars; ignore it while pinch-zoomed (it shrinks then).
    const useVV = vv && Math.abs((vv.scale || 1) - 1) < 0.01;
    const viewW = useVV ? vv.width : window.innerWidth, viewH = useVV ? vv.height : window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    // Notch, rounded-corner and home-bar margins: the picture and every button keep clear of them.
    const safe = touch.safe();
    const opts = { viewW, viewH, dpr, gameW: C.screenW, gameH: C.screenH, safe };
    const L = touch.active ? S.touchLayout(opts) : null;
    const f = L ? L.fit : S.computeFit(opts);
    canvas.style.width = f.cssW + 'px'; canvas.style.height = f.cssH + 'px';
    canvas.style.left = f.cssLeft + 'px'; canvas.style.top = f.cssTop + 'px';
    if (L) touch.place(L);
    // Upright with touch buttons: "turn your phone sideways" (until the player picks "play upright anyway").
    const prompt = S.needsSidewaysPrompt({ viewW, viewH, touch: touch.active, dismissed: phone.dismissed });
    const wasUp = phone.promptVisible;
    phone.showPrompt(prompt, { viewW, viewH, dpr, safe });
    if (prompt && !wasUp) { touch.releaseAll(); pauseNow(); }
    window.__SAMMY_FIT = Object.assign({ viewW, viewH, touch: touch.active, safe, prompt }, f);
  }
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', fit);
  // Rotating can report the new size a moment late on some phones; check again shortly after.
  window.addEventListener('orientationchange', () => setTimeout(fit, 300));
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

  // Browsers only allow sound after the player does something, and some phones count a finger only when it lifts.
  // audio.js listens to every touch, click and key press on the whole window (touch buttons and the "turn your
  // phone sideways" button included) until sound is running, and again after a phone call or the lock screen.
  let unlocks = 0;
  audio.attach({ win: window, doc: document, onGesture: () => { unlocks++; } });

  function drainEvents() {
    for (const ev of state.events) {
      if (ev.type === 'sfx') audio.sfx(ev.id);
      else if (ev.type === 'music') audio.music(ev.id);
      else if (ev.type === 'sfx-loop') audio.sfxLoop(ev.id, ev.on);
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
    else if (params.get('test') === 'audio') audioTest();
    else if (params.has('test')) runTest(params.get('test'));
    else requestAnimationFrame(loop);
  };
  S.loadAssets({ base, probe: params.has('probe') }, (report) => {
    console.info('[sammy] art loaded:', report.loaded.length, 'of', report.expected);
    for (const w of report.warnings) console.warn('[sammy] art warning:', w);
    ready();
  });
  S.loadSounds({ base, probe: params.has('probe'), onLate: () => audio.soundsChanged() }, (report) => {
    console.info('[sammy] sounds loaded:', report.loaded.length, 'of', report.tried, 'files found',
      report.failed.length ? { failed: report.failed } : '', report.unplayable.length ? { unplayable: report.unplayable } : '');
    audio.soundsChanged(); // files that arrived after the first tap still need priming on the next one
    ready();
  });

  function loop(now) { frame(now); requestAnimationFrame(loop); }
  function frame(now) {
    const dt = last ? Math.min(0.25, (now - last) / 1000) : C.step;
    last = now;
    acc += dt;
    if (state.mode === 'title') state.titleT = (state.titleT || 0) + dt;
    if (phone.promptVisible) pauseNow(); // a key on a tablet could still start the game behind the message
    while (acc >= C.step) {
      const inp = input.poll();
      if (inp.mute) state.muted = audio.toggleMute();
      if (inp.gore) toggleGore();
      if (S.goreNote > 0) S.goreNote--;
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
      scrollW: de.scrollWidth, scrollH: de.scrollHeight, buttons: buttonReport(), promptVisible: promptShown(),
      fullscreenAvailable: phone.fullscreenAvailable });
  }
  // Whether the "turn your phone sideways" message is really on screen.
  function promptShown() {
    const b = document.getElementById('sideways').getBoundingClientRect();
    return phone.promptVisible && b.width > 0 && b.height > 0;
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
    // Auto-pause: the page going hidden (phone locked, tab switched) pauses play and lets go of held keys;
    // coming back does not resume by itself; Enter resumes.
    try {
      key('keydown', 'ArrowRight'); run(2);
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
      r.hiddenPauses = state.mode === 'paused' && !input.held().right;
      delete document.hidden; delete document.visibilityState;
      document.dispatchEvent(new Event('visibilitychange'));
      run(10); r.staysPaused = state.mode === 'paused';
      key('keyup', 'ArrowRight'); key('keydown', 'Enter'); key('keyup', 'Enter'); run(2);
      r.resumes = state.mode === 'playing';
      window.dispatchEvent(new Event('blur')); r.blurPauses = state.mode === 'paused';
      key('keydown', 'Enter'); key('keyup', 'Enter'); run(2);
    } catch (e) { errors.push(String(e && e.stack || e)); }
    r.ok = r.ok && r.hiddenPauses && r.staysPaused && r.resumes && r.blurPauses && state.mode === 'playing' && !r.fit.promptVisible && errors.length === 0;
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
    // An upright phone (not a tablet: tablets play upright without the message).
    const portrait = S.needsSidewaysPrompt({ viewW: window.__SAMMY_FIT.viewW, viewH: window.__SAMMY_FIT.viewH, touch: true, dismissed: false });
    try {
      // Upright phone: the "turn your phone sideways" message is up, covers the buttons and keeps the game paused.
      // Sideways, and on tablets: it never shows.
      c.promptOnLoad = promptShown();
      if (portrait) {
        run(2);
        input.press('start'); run(3);
        c.promptKeepsPaused = state.mode === 'paused';
        const btn = phone.promptButton, b = btn.getBoundingClientRect();
        c.promptButtonBig = b.width >= 48 && b.height >= 48;
        const top = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
        c.promptButtonOnTop = top === btn;
        const ev = (t) => btn.dispatchEvent(new PointerEvent(t, { pointerId: 50, pointerType: 'touch', bubbles: true, cancelable: true,
          clientX: b.x + b.width / 2, clientY: b.y + b.height / 2 }));
        ev('pointerdown'); run(1); ev('pointerup'); run(2);
        c.promptDismissed = !promptShown() && phone.dismissed;
        c.stillPausedAfterDismiss = state.mode === 'paused'; // never un-pauses by itself
        state.mode = 'title'; run(2);
      }
      // On the title screen PAUSE is hidden (it would only start the game), and so is the pause menu.
      c.visibleOnTitle = ['pad', 'jump', 'whip', 'possum'].every((n) => buttonReport()[n]) && !buttonReport().pause && !buttonReport().restart;
      run(5);
      const unlocksBefore = unlocks;
      tap('jump');
      c.jumpStarts = state.mode === 'playing';
      run(1); c.pauseShownInPlay = !!buttonReport().pause;
      c.soundUnlocked = unlocks > unlocksBefore || !audio.status().armed; // (stops listening once sound is fully on)
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
      // Leaving the page lets go of every button and pauses (it never resumes by itself); PLAY resumes.
      finger('pad', 0.9); finger('whip'); run(1); window.dispatchEvent(new Event('blur')); c.blurClears = noneHeld();
      c.blurPauses = state.mode === 'paused'; run(5); tap('pause'); c.resumeAfterBlur = state.mode === 'playing';
      finger('possum'); run(1);
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
      delete document.hidden; delete document.visibilityState;
      c.hiddenClears = noneHeld();
      c.hiddenPauses = state.mode === 'paused';
      run(5); tap('pause'); c.resumeAfterHidden = state.mode === 'playing';
      run(5);
      // Pause shows RESTART, MUTE and GORE; MUTE toggles sound, GORE full/low gore; RESTART goes back to the start.
      tap('pause');
      c.paused = state.mode === 'paused' && !!buttonReport().restart && !!buttonReport().mute;
      tap('mute'); c.muted = state.muted === true; tap('mute'); c.unmuted = state.muted === false;
      { const g0 = S.gore; tap('gore'); c.goreToggles = S.gore !== g0 && !!buttonReport().gore; tap('gore'); c.goreBack = S.gore === g0; }
      tap('restart');
      c.restarted = state.mode === 'playing' && state.player.x === state.level.start.x && !buttonReport().restart; // a new player object
      // Tapping the picture on the title screen starts the game too.
      state.mode = 'title'; run(2);
      canvas.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 99, pointerType: 'touch', bubbles: true }));
      run(2); c.tapPictureStarts = state.mode === 'playing';
    } catch (e) { errors.push(String(e && e.stack || e)); }
    const r = { test: 'touch', fit: fitReport(), mode: state.mode, checks: c, errors };
    const fullOk = phone.fullscreenAvailable ? !!buttonReport().full : !buttonReport().full;
    c.fullButton = !!buttonReport().full;
    r.ok = (portrait ? c.promptOnLoad && c.promptKeepsPaused && c.promptButtonBig && c.promptButtonOnTop && c.promptDismissed &&
      c.stillPausedAfterDismiss : !c.promptOnLoad) && fullOk && c.blurPauses && c.resumeAfterBlur && c.hiddenPauses && c.resumeAfterHidden &&
      c.visibleOnTitle && c.jumpStarts && c.pauseShownInPlay && c.soundUnlocked && c.movedRight > 50 && c.slideLeft && c.releasedPad &&
      c.holdRise > c.tapRise + 10 && c.moveAndJump && c.whip && c.cancelClears && c.lostCaptureClears && c.blurClears &&
      c.hiddenClears && c.paused && c.muted && c.unmuted && c.goreToggles && c.goreBack && c.restarted && c.tapPictureStarts && errors.length === 0;
    out.textContent = JSON.stringify(r);
    requestAnimationFrame(loop);
  }

  // ?test=audio: starting sound on phones. Headless browsers can't make a real touch, so this checks the steps:
  // (1) a pretend sound engine (same code, fake AudioContext) proves every kind of touch tries to start sound, a
  //     refused try is retried on the next touch, it stops listening once sound runs, and it restarts after a phone
  //     call, the lock screen or switching apps (only while the page shows);
  // (2) the real sound engine and the real sound files: a touch starts it, every file is primed, it stops listening;
  //     after being stopped it starts again, music stays paused while the game is paused, and mute silences every copy.
  // Run with --autoplay-policy=no-user-gesture-required for (2) to succeed; without it, it must just not break.
  function audioTest() {
    const out = document.getElementById('test-result');
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    // Waits for the sound engine, which runs in real time. Headless test browsers fast-forward timers, so this yields
    // without timers (real time passes) as well as with them.
    const yieldNow = () => new Promise((r) => { const ch = new MessageChannel(); ch.port1.onmessage = () => r(); ch.port2.postMessage(0); });
    const until = async (cond, ms) => {
      for (let t = 0; t < (ms || 3000); t += 25) {
        for (let i = 0; i < 400; i++) { if (cond()) return true; await yieldNow(); }
        await wait(25);
      }
      return !!cond();
    };
    let now = 1000;
    const run = (n) => { for (let i = 0; i < n; i++) { now += 1000 / 60; frame(now); } };
    const hide = (on) => {
      if (on) {
        Object.defineProperty(document, 'hidden', { value: true, configurable: true });
        Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      } else { delete document.hidden; delete document.visibilityState; }
    };
    const f = {}, c = {};
    (async () => {
      // ---- (1) pretend sound engine ----
      try {
        const fake = { allow: false, made: null };
        function FakeAC() {
          this.state = 'suspended'; this.currentTime = 0; this.sampleRate = 22050; this.destination = {};
          this.resumes = 0; this.silent = 0; fake.made = this;
        }
        const node = () => ({ connect() {}, start() {}, stop() {}, gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
          frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} } });
        FakeAC.prototype.createGain = node; FakeAC.prototype.createOscillator = node; FakeAC.prototype.createBiquadFilter = node;
        FakeAC.prototype.createBuffer = (ch, len) => ({ length: len, getChannelData: () => new Float32Array(len) });
        FakeAC.prototype.createBufferSource = function () { const self = this, n = node(); n.start = () => { self.silent++; }; return n; };
        FakeAC.prototype.set = function (st) { this.state = st; if (this.onstatechange) this.onstatechange(); };
        FakeAC.prototype.resume = function () {
          this.resumes++;
          if (!fake.allow) return Promise.reject(new Error('not allowed without a touch'));
          this.set('running'); return Promise.resolve();
        };
        const fw = new EventTarget(), fd = new EventTarget();
        fd.visibilityState = 'visible';
        let gestures = 0;
        const fa = S.createAudio({ AudioContext: FakeAC, sounds: {} });
        fa.attach({ win: fw, doc: fd, onGesture: () => { gestures++; } });
        const tick = () => wait(5);
        f.armedBeforeTouch = fa.status().armed;
        // Every kind of touch, click and key press tries; the browser refuses (that touch didn't count).
        for (const t of S.AUDIO_UNLOCK_EVENTS) { fw.dispatchEvent(new Event(t)); await tick(); }
        f.everyEventTries = gestures === S.AUDIO_UNLOCK_EVENTS.length;
        f.refusedStillListening = fake.made.state === 'suspended' && fa.status().armed && fake.made.resumes >= S.AUDIO_UNLOCK_EVENTS.length;
        f.silentSample = fake.made.silent >= S.AUDIO_UNLOCK_EVENTS.length;
        // The next touch counts: running, and it stops listening.
        fake.allow = true; fw.dispatchEvent(new Event('touchend')); await tick();
        f.runningAfterTouch = fake.made.state === 'running';
        f.stopsListening = !fa.status().armed;
        const g0 = gestures; fw.dispatchEvent(new Event('click')); await tick(); f.listenersRemoved = gestures === g0;
        // A phone call ('interrupted', iPhone) while showing: it tries at once; refused, so it listens for a touch.
        fake.allow = false; let r0 = fake.made.resumes;
        fake.made.set('interrupted'); await tick();
        f.interruptTriesAtOnce = fake.made.resumes > r0;
        f.interruptListensAgain = fa.status().armed;
        fake.allow = true; fw.dispatchEvent(new Event('pointerup')); await tick();
        f.touchAfterInterrupt = fake.made.state === 'running' && !fa.status().armed;
        // Locked phone: no tries while hidden; showing again restarts it by itself.
        fd.visibilityState = 'hidden'; r0 = fake.made.resumes;
        fake.made.set('suspended'); await tick();
        f.noTryWhileHidden = fake.made.resumes === r0 && fake.made.state === 'suspended';
        fd.visibilityState = 'visible'; fd.dispatchEvent(new Event('visibilitychange')); await tick();
        f.backOnShow = fake.made.state === 'running' && !fa.status().armed;
        // Coming back through the back button (pageshow) or to the window (focus).
        for (const ev of ['pageshow', 'focus']) {
          fd.visibilityState = 'hidden'; fake.made.set('suspended'); await tick(); fd.visibilityState = 'visible';
          fw.dispatchEvent(new Event(ev)); await tick();
          f['backOn' + ev] = fake.made.state === 'running';
        }
      } catch (e) { errors.push('fake: ' + String(e && e.stack || e)); }

      // ---- (2) the real sound engine and real sound files ----
      try {
        c.elementsBefore = audio.status().elements;
        c.armedBeforeTouch = audio.status().armed;
        // The first touch lands on a touch button (it reaches audio.js through the window). A finger going down
        // restarts the engine but primes no sound file (phones don't count it); the finger lifting primes them.
        touch.elements.jump.el.dispatchEvent(new Event('touchstart', { bubbles: true }));
        c.touchButtonTries = unlocks === 1;
        c.silentSample = audio.status().silentPlays >= 1;
        c.noPrimeOnFingerDown = audio.status().primed === 0 && audio.status().primeEvents === 0;
        touch.elements.jump.el.dispatchEvent(new Event('touchend', { bubbles: true }));
        c.primeOnFingerUp = unlocks === 2 && audio.status().primeEvents === 1;
        c.running = await until(() => audio.status().state === 'running');
        await until(() => !audio.status().armed, 500);
        let s = audio.status();
        c.elements = s.elements; c.primed = s.primed; c.stopsListening = !s.armed;
        c.noSoundCounted = Object.keys(S.soundPlays).length === 0; // priming isn't playing
        c.restoredUnmuted = s.mutedElements === 0;
        // Stopped while the page is hidden (lock screen): it waits, listening; a tap on the sideways button restarts it.
        hide(true); document.dispatchEvent(new Event('visibilitychange'));
        await audio.suspendForTest();
        c.suspended = await until(() => audio.status().state === 'suspended', 500);
        await wait(50);
        c.listensWhileStopped = audio.status().armed;
        hide(false);
        phone.promptButton.dispatchEvent(new Event('touchstart', { bubbles: true }));
        c.sidewaysButtonTries = unlocks === 3;
        c.runningAfterTap = await until(() => audio.status().state === 'running');
        // Music: playing during play; paused (and staying paused) when the page hides and comes back; plays on unpause.
        input.press('start'); run(3);
        c.started = state.mode === 'playing';
        c.musicPlays = await until(() => audio.status().musicPlaying, 800);
        hide(true); document.dispatchEvent(new Event('visibilitychange'));
        c.pausedOnHide = state.mode === 'paused' && !audio.status().musicPlaying;
        await audio.suspendForTest();
        hide(false);
        document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('pageshow')); window.dispatchEvent(new Event('focus'));
        c.resumedOnShow = await until(() => audio.status().state === 'running');
        await wait(200); run(3);
        c.musicWaitsWhilePaused = state.mode === 'paused' && !audio.status().musicPlaying;
        input.press('start'); run(3);
        c.musicBackOnUnpause = state.mode === 'playing' && await until(() => audio.status().musicPlaying, 800);
        // Mute (M or the MUTE button) silences every file and every copy; unmute brings them back.
        input.press('jump'); run(2);
        input.press('mute'); run(1); s = audio.status();
        c.muteAll = state.muted && s.mutedElements === s.elements && s.elements > 0;
        input.press('mute'); run(1); s = audio.status();
        c.unmuteAll = !state.muted && s.mutedElements === 0;
      } catch (e) { errors.push(String(e && e.stack || e)); }
      const r = { test: 'audio', fake: f, checks: c, status: audio.status(), errors };
      r.fakeOk = Object.keys(f).length >= 14 && Object.keys(f).every((k) => f[k] === true || k === 'armedBeforeTouch') && f.armedBeforeTouch;
      r.ok = errors.length === 0 && r.fakeOk;
      out.textContent = JSON.stringify(r);
      requestAnimationFrame(loop);
    })();
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
    // Chainsaw: idle, run and rev with a full and an almost-empty tank (HUD gauge blinks).
    for (const [anim, fuel] of [['chainsaw-idle', 20], ['chainsaw-run', 20], ['chainsaw-rev', 3]]) {
      p.state = 'normal'; p.anim = anim; p.animT = 0.2; p.saw = { fuel, revving: anim === 'chainsaw-rev', tick: 0, slash: 0 }; draw('sammy-' + anim);
    }
    p.saw = null; p.anim = 'idle';
    p.shield = 3; draw('shield'); p.shield = 1; draw('shield-cracked'); p.possumCd = 3; draw('possum-cooldown');
    // Every enemy type in every state its brain has (dead is never drawn), plus the no-flinch flash, in its placeholder or real art.
    for (const [type, T] of Object.entries(S.ENEMY_TYPES)) {
      // A type the level doesn't place yet is made on the spot, so every drawer gets drawn.
      const e = state.enemies.find((q) => q.type === type && q.state !== 'dead') || state.enemies.find((q) => q.type === type) || S.makeEnemy({ type, x: p.x + 40 }, 0, { id: 'sweep-' + type });
      if (!state.enemies.includes(e)) state.enemies.push(e);
      e.x = p.x + 40;
      for (const st of T.states) {
        if (st === 'dead') continue;
        e.state = st; e.t = 0.2; e.anim = T.anims[st]; e.animT = 0.2; e.flashT = 0; draw(type + '-' + st);
      }
      e.state = T.cfg.start; e.anim = T.cfg.startAnim; e.flashT = 0.1; draw(type + '-flash'); e.flashT = 0;
    }
    for (const c of state.carts) for (const st of ['upright', 'rocking', 'tipping', 'tipped', 'empty']) { c.state = st; c.t = 0.1; c.anim = st === 'tipped' ? 'tipped-over' : st; draw('cart-' + st); }
    state.projectiles.push({ x: p.x + 20, y: p.y - 20, vx: 0, vy: 0, t: 0.1, life: 1 });
    for (const k of ['spark', 'dust', 'splat', 'splash', 'sparkle', 'bang', 'text']) state.effects.push({ kind: k, x: p.x, y: p.y - 10, t: 0.05, life: 1, text: 'TEST' });
    state.arena.state = 'fight'; state.arena.wave = 1; draw('effects-arena');
    // Gore: every defeat style and gore effect, early and late in its life, with full and low gore, shaking and frozen.
    const goreWas = S.gore;
    goreDemo(p.x + 40);
    for (const g of ['full', 'low']) {
      S.setGore(g);
      for (const t of [0.05, 0.35]) {
        for (const e of state.enemies) if (e.state === 'defeat') e.t = t;
        for (const f of state.effects) f.t = Math.min(t, f.life);
        state.shake = 0.2; state.hitstop = 0.05; draw('gore-' + g + '-' + t);
      }
    }
    state.shake = 0; state.hitstop = 0; S.setGore(goreWas);
    state.mode = 'paused'; draw('paused');
    state.muted = true; draw('muted');
    state.mode = 'title'; draw('title');
    return drawn;
  }

  // Puts zombies going down in every defeat style, plus every gore effect, near x (render sweep and ?goredemo=T shots).
  function goreDemo(x, t) {
    t = t || 0.2;
    // Every type's whip death and saw death (jogger pop + sliced, vendor deflate + sliced, …), side by side.
    const styles = [];
    for (const [type, T] of Object.entries(S.ENEMY_TYPES)) styles.push([type, T.cfg.defeatStyle], [type, T.cfg.sawStyle]);
    styles.forEach(([type, style], i) => {
      const e = state.enemies.find((q) => q.type === type && !q.goreDemo && q.state !== 'dead') ||
        Object.assign({}, state.enemies.find((q) => q.type === type) || S.makeEnemy({ type, x }, 0), { id: 'demo' + i });
      Object.assign(e, { goreDemo: true, x: x + i * 36, y: C.groundY, face: -1, state: 'defeat', t, anim: 'defeat', animT: t, defeatStyle: style });
      if (!state.enemies.includes(e)) state.enemies.push(e);
    });
    const y = C.groundY - 20;
    state.effects.push({ kind: 'blood', x: x + 36, y, t, life: 0.8, n: 10, dir: 1, power: 1 },
      { kind: 'chunk', x: x + 108, y, t, life: 0.8, dir: 1 }, { kind: 'ichor', x: x + 72, y, t, life: 0.6, n: 6 },
      { kind: 'sparks', x: x + 30, y: y + 4, t: Math.min(t, 0.1), life: 0.15, dir: -1 });
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
      result.player = { x: Math.round(state.player.x), hp: state.player.hp, state: state.player.state, anim: state.player.anim, grounded: !!state.player.grounded };
      // ?test=shot&pose=hurt|ko|playdead|attack: put Sammy in that state for a screenshot of art the autopilot rarely shows
      if (name === 'shot' && params.has('pose')) {
        const pose = params.get('pose'), p = state.player;
        const anims = { hurt: 'hurt', ko: 'ko', playdead: 'play-dead', attack: 'tail-whip' };
        if (anims[pose]) { p.state = pose; p.t = pose === 'ko' ? 0.5 : 0.1; p.anim = anims[pose]; p.invuln = 0; }
      }
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
      if (params.has('goredemo')) goreDemo(state.player.x + 30, parseFloat(params.get('goredemo')) || 0.2);
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
