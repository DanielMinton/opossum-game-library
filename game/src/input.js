// Keyboard and gamepad -> the abstract buttons the game rules use.
// Defaults match the on-screen prompts in LEVEL.md: Z jump, X tail-whip, C Play Possum.
(function (S) {
  const KEYS = {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    ArrowDown: 'down', KeyS: 'down',
    KeyZ: 'jump', Space: 'jump', ArrowUp: 'jump', KeyW: 'jump', KeyK: 'jump',
    KeyX: 'attack', KeyJ: 'attack',
    KeyC: 'possum', KeyL: 'possum',
    Enter: 'start', Escape: 'start', KeyP: 'start',
    KeyR: 'restart', KeyM: 'mute',
  };
  // Standard gamepad layout: A/Cross = jump, X/Square = whip, B/Circle or Y/Triangle = Play Possum.
  const PAD = { 0: 'jump', 2: 'attack', 1: 'possum', 3: 'possum', 9: 'start', 8: 'restart', 12: 'jump', 14: 'left', 15: 'right', 13: 'down' };

  S.createInput = function (target) {
    const keyHeld = {};
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
    target.addEventListener('blur', () => { for (const k in keyHeld) keyHeld[k] = false; });

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

    // Called once per simulation step. Presses are only reported once.
    return {
      poll() {
        const inp = S.makeInput();
        const pad = readPad();
        for (const k in pad) if (pad[k] && !padPrev[k]) pending.add(k);
        padPrev = pad;
        for (const k in inp.held) inp.held[k] = !!(keyHeld[k] || pad[k]);
        for (const k of pending) if (k in inp.pressed) inp.pressed[k] = true;
        inp.mute = pending.has('mute');
        pending.clear();
        return inp;
      },
    };
  };
})(globalThis.SAMMY = globalThis.SAMMY || {});
