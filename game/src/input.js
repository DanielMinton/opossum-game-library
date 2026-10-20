// Keyboard, gamepad and other sources (the on-screen touch buttons in touch.js) -> the abstract buttons the game rules use.
// Defaults match the on-screen prompts in LEVEL.md: Z jump, X tail-whip, C Play Possum.
(function (S) {
  const KEYS = {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    ArrowDown: 'down', KeyS: 'down',
    KeyZ: 'jump', Space: 'jump', ArrowUp: 'jump', KeyW: 'jump', KeyK: 'jump',
    KeyX: 'attack', KeyJ: 'attack',
    KeyC: 'possum', KeyL: 'possum',
    Enter: 'start', Escape: 'start', KeyP: 'start',
    KeyR: 'restart', KeyM: 'mute', KeyG: 'gore',
  };
  // Standard gamepad layout: A/Cross = jump, X/Square = whip, B/Circle or Y/Triangle = Play Possum.
  const PAD = { 0: 'jump', 2: 'attack', 1: 'possum', 3: 'possum', 9: 'start', 8: 'restart', 12: 'jump', 14: 'left', 15: 'right', 13: 'down' };

  S.createInput = function (target) {
    const keyHeld = {};
    const sources = {}; // held buttons from other sources, e.g. sources.touch = { right: true }
    const pending = new Set();
    let padPrev = {};
    target.addEventListener('keydown', (e) => {
      const a = KEYS[e.code];
      if (!a) return;
      e.preventDefault();
      if (!e.repeat) pending.add(a);
      keyHeld[a] = true;
    });
    target.addEventListener('keyup', (e) => { const a = KEYS[e.code]; if (a) keyHeld[a] = false; });
    // Leaving the page (another window, app or tab) lets go of every key and forgets presses not yet used.
    const letGo = () => { for (const k in keyHeld) keyHeld[k] = false; pending.clear(); };
    target.addEventListener('blur', letGo);
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.hidden) letGo(); });

    function readPad() {
      const out = {};
      const pads = (navigator.getGamepads && navigator.getGamepads()) || [];
      for (const gp of pads) {
        if (!gp) continue;
        gp.buttons.forEach((b, i) => { if (b && b.pressed && PAD[i]) out[PAD[i]] = true; });
        if (gp.axes[0] < -0.5) out.left = true;
        if (gp.axes[0] > 0.5) out.right = true;
        if (gp.axes[1] > 0.6) out.down = true;
      }
      return out;
    }

    const fromSources = (k) => { for (const n in sources) if (sources[n][k]) return true; return false; };

    return {
      // Called once per simulation step. Presses are only reported once.
      poll() {
        const inp = S.makeInput();
        const pad = readPad();
        for (const k in pad) if (pad[k] && !padPrev[k]) pending.add(k);
        padPrev = pad;
        for (const k in inp.held) inp.held[k] = !!(keyHeld[k] || pad[k] || fromSources(k));
        for (const k of pending) if (k in inp.pressed) inp.pressed[k] = true;
        inp.mute = pending.has('mute');
        inp.gore = pending.has('gore'); // gore setting: drawing only, so it never reaches the rules' buttons
        pending.clear();
        return inp;
      },
      // Other sources: a one-shot press (like a key going down) and held buttons (like a key staying down).
      press(action) { pending.add(action); },
      setHeld(source, action, on) { (sources[source] = sources[source] || {})[action] = !!on; },
      releaseAll(source) { if (sources[source]) for (const k in sources[source]) sources[source][k] = false; },
      // Which buttons are held right now, from every source (for the self-checks).
      held() { const pad = readPad(), out = {}; for (const k in S.makeInput().held) out[k] = !!(keyHeld[k] || pad[k] || fromSources(k)); return out; },
    };
  };
})(globalThis.SAMMY = globalThis.SAMMY || {});
