// On-screen touch buttons for phones and tablets: a left/right pad, JUMP, WHIP, POSSUM and PAUSE
// (plus RESTART and MUTE while paused). They feed the same buttons as the keyboard (input.js).
// Shown only on touch screens: when the browser says the main pointer is a finger, on the first touch, or with ?touch=1.
// Where each button goes is worked out in layout.js (S.touchLayout); this file builds, draws and listens to them.
(function (S) {
  const K = S.PAL;
  // Button colours (9-bit palette): face, highlight, shadow.
  const COLORS = {
    pad: ['#6c6c6c', '#909090', '#484848'],
    jump: ['#48b424', '#90d848', '#246c24'],
    whip: ['#d82424', '#fc6c48', '#902424'],
    possum: ['#d86c90', '#fcb4b4', '#904848'],
    menu: ['#244890', '#486cb4', '#002448'],
  };
  // Small pixel icons ('#' = filled), drawn at 2x with a dark shadow.
  const ICONS = {
    up: ['...#...', '..###..', '.#####.', '#######', '..###..', '..###..', '..###..'],
    tail: ['....##.', '.....##', '......#', '#.....#', '##...##', '.#####.', '..###..'],
    dead: ['#...#', '##.##', '.###.', '##.##', '#...#'],
    left: ['....#', '...##', '..###', '.####', '#####', '.####', '..###', '...##', '....#'],
    right: ['#....', '##...', '###..', '####.', '#####', '####.', '###..', '##...', '#....'],
    pause: ['##.##', '##.##', '##.##', '##.##', '##.##', '##.##', '##.##'],
    play: ['#....', '##...', '###..', '####.', '###..', '##...', '#....'],
  };
  // name -> what it does. press: one-shot button; hold: also held while the finger stays down.
  const BUTTONS = {
    pad: { label: 'Move left or right', color: 'pad' },
    jump: { label: 'Jump', color: 'jump', icon: 'up', text: 'JUMP', press: 'jump', hold: 'jump' },
    whip: { label: 'Tail-whip', color: 'whip', icon: 'tail', text: 'WHIP', press: 'attack', hold: 'attack' },
    possum: { label: 'Play Possum', color: 'possum', icon: 'dead', text: 'POSSUM', press: 'possum', hold: 'possum' },
    pause: { label: 'Pause', color: 'menu', icon: 'pause', press: 'start' },
    restart: { label: 'Restart the level', color: 'menu', text: 'RESTART', press: 'restart', menu: true },
    mute: { label: 'Sound on or off', color: 'menu', text: 'MUTE', press: 'mute', menu: true },
  };

  const R = (g, col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  function icon(g, name, x, y, col, s) {
    const rows = ICONS[name];
    for (let pass = 0; pass < 2; pass++) {
      const c = pass ? col : K.black, o = pass ? 0 : 1;
      rows.forEach((row, r) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') R(g, c, x + i * s + o, y + r * s + o, s, s); });
    }
  }
  const iconW = (n, s) => ICONS[n][0].length * s, iconH = (n, s) => ICONS[n].length * s;

  // A chunky pixel button: black outline with cut corners, a light top edge and a dark lip at the bottom.
  // Pressed: darker, no lip, and the picture on it moves down 2 pixels.
  function body(g, x, y, w, h, col, down) {
    const [face, hi, lo] = col;
    R(g, K.black, x + 2, y, w - 4, h); R(g, K.black, x + 1, y + 1, w - 2, h - 2); R(g, K.black, x, y + 2, w, h - 4);
    const ix = x + 1, iy = y + 1, iw = w - 2, ih = h - 2;
    R(g, down ? lo : face, ix + 1, iy, iw - 2, ih); R(g, down ? lo : face, ix, iy + 1, iw, ih - 2);
    if (!down) {
      R(g, lo, ix + 1, iy + ih - 3, iw - 2, 3); R(g, lo, ix, iy + ih - 4, iw, 2);
      R(g, hi, ix + 2, iy + 1, iw - 4, 1); R(g, hi, ix + 1, iy + 2, 1, ih - 7);
    } else {
      R(g, K.black, ix + 1, iy, iw - 2, 1); // shadow along the top while pushed in
    }
  }

  function drawButton(cv, name, down, extra) {
    const g = cv.getContext('2d'), w = cv.width, h = cv.height, B = BUTTONS[name];
    g.clearRect(0, 0, w, h);
    const lift = down ? 2 : 0, base = 4; // content sits above the 3-4 px bottom lip
    if (name === 'pad') {
      // One rounded pad with a groove down the middle; the half under the thumb pushes in.
      const half = Math.floor(w / 2), [, hi, lo] = COLORS.pad;
      body(g, 0, 0, w, h, COLORS.pad, false);
      for (const [x0, x1, on] of [[2, half - 1, extra.left], [half + 1, w - 2, extra.right]]) {
        if (!on) continue;
        R(g, lo, x0, 1, x1 - x0, h - 2); R(g, K.black, x0, 1, x1 - x0, 1); // pushed in: darker, shadow along the top
      }
      R(g, K.black, half - 1, 1, 2, h - 2); R(g, hi, half + 1, 2, 1, h - 7); // the groove, lit on its right edge
      for (const [side, x0, on] of [['left', 0, extra.left], ['right', half, extra.right]]) {
        const s = Math.max(2, Math.floor(h / 18)), iw = iconW(side, s), ih = iconH(side, s);
        icon(g, side, x0 + Math.round((half - iw) / 2), Math.round((h - base - ih) / 2) + (on ? 2 : 0), K.white, s);
      }
      return;
    }
    body(g, 0, 0, w, h, COLORS[B.color], down);
    const text = name === 'mute' && extra.muted ? 'UNMUTE' : B.text;
    const ic = name === 'pause' && extra.paused ? 'play' : B.icon;
    const s = 2;
    const ih = ic ? iconH(ic, s) : 0, th = text ? 5 : 0, gap = ic && text ? 3 : 0;
    let y = Math.round((h - base - (ih + gap + th)) / 2) + lift;
    if (ic) { icon(g, ic, Math.round((w - iconW(ic, s)) / 2), y, K.white, s); y += ih + gap; }
    if (text) S.drawText(g, text, Math.round((w - S.textWidth(text)) / 2), y, K.white, 1, K.black);
  }
  // Buttons are always solid, even where one dips over the picture: they only ever cover the plain dirt strip at its
  // bottom corners (layout.js), and a see-through button showed a seam where the picture's edge crossed it.

  // input: from S.createInput. canvas: the game screen (tapping it on the title screen starts the game).
  // forced: ?touch=1. onChange: called when the buttons appear or disappear (main.js then re-fits the screen).
  S.createTouch = function (opts) {
    const input = opts.input, forced = !!opts.forced;
    const coarse = () => !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    const root = document.createElement('div');
    root.id = 'touch-controls';
    document.body.appendChild(root);
    // Reads the notch / rounded-corner margins the browser reports (all 0 on screens without them).
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
      'padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
    root.appendChild(probe);

    const els = {}, down = {}; // down[name] = true while pushed in
    let mode = 'title', muted = false, padDir = { left: false, right: false };
    const pointers = new Map(); // pointerId -> { name, dir }
    for (const name in BUTTONS) {
      const el = document.createElement('div');
      el.className = 'tbtn tbtn-' + name + (BUTTONS[name].menu || name === 'pause' ? ' hide' : '');
      el.setAttribute('role', 'button'); el.setAttribute('aria-label', BUTTONS[name].label);
      const cv = document.createElement('canvas');
      el.appendChild(cv); root.appendChild(el);
      els[name] = { el, cv };
      el.addEventListener('pointerdown', (e) => onDown(e, name));
      el.addEventListener('pointermove', onMove);
      for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(t, onUp);
    }
    for (const t of ['contextmenu', 'selectstart', 'dblclick']) root.addEventListener(t, (e) => e.preventDefault());

    function redraw(name) {
      const cv = els[name].cv;
      if (!cv.width) return;
      drawButton(cv, name, !!down[name], { left: padDir.left, right: padDir.right, muted, paused: mode === 'paused' });
      els[name].el.classList.toggle('down', name === 'pad' ? padDir.left || padDir.right : !!down[name]);
    }
    // Left or right from where the finger is on the pad. Near the middle line it keeps the current direction,
    // so a resting thumb doesn't flicker; sliding across switches without lifting.
    function dirAt(e, prev) {
      const r = els.pad.el.getBoundingClientRect(), mid = r.left + r.width / 2, dead = r.width * 0.06;
      if (prev && Math.abs(e.clientX - mid) < dead) return prev;
      return e.clientX < mid ? 'left' : 'right';
    }
    // Recompute what is held from every finger still down, and hand it to the input.
    function sync() {
      const held = { left: false, right: false, jump: false, attack: false, possum: false };
      const was = Object.assign({}, down), wasDir = padDir;
      for (const n in down) down[n] = false;
      for (const p of pointers.values()) {
        down[p.name] = true;
        if (p.name === 'pad') held[p.dir] = true;
        else if (BUTTONS[p.name].hold) held[BUTTONS[p.name].hold] = true;
      }
      padDir = { left: held.left, right: held.right };
      for (const k in held) input.setHeld('touch', k, held[k]);
      for (const n in BUTTONS) if (!!was[n] !== !!down[n] || (n === 'pad' && (wasDir.left !== padDir.left || wasDir.right !== padDir.right))) redraw(n);
    }
    function onDown(e, name) {
      e.preventDefault();
      if (!api.active) activate();
      try { els[name].el.setPointerCapture(e.pointerId); } catch (err) { /* not a live pointer (self-check) */ }
      const p = { name };
      if (name === 'pad') { p.dir = dirAt(e); input.press(p.dir); }
      else if (BUTTONS[name].press) input.press(BUTTONS[name].press);
      pointers.set(e.pointerId, p);
      sync();
    }
    function onMove(e) {
      const p = pointers.get(e.pointerId);
      if (!p || p.name !== 'pad') return;
      const d = dirAt(e, p.dir);
      if (d !== p.dir) { p.dir = d; input.press(d); sync(); }
    }
    function onUp(e) { if (pointers.delete(e.pointerId)) sync(); }
    function releaseAll() { pointers.clear(); input.releaseAll('touch'); sync(); }
    window.addEventListener('blur', releaseAll);
    document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });

    // Tapping the picture on the title or level-clear screen starts the game, like JUMP.
    opts.canvas.addEventListener('pointerdown', (e) => {
      if (api.active && e.pointerType !== 'mouse' && (mode === 'title' || mode === 'clear')) input.press('start');
    });

    function setActive(on) {
      if (api.active === on) return;
      api.active = on; S.touchActive = on;
      root.classList.toggle('on', on);
      if (!on) releaseAll();
      if (opts.onChange) opts.onChange();
    }
    function activate() { setActive(true); }
    // The first real touch anywhere turns the buttons on.
    window.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') activate(); }, true);
    // A key press on a screen without a touch-first pointer hides them again (a laptop with a touch screen).
    window.addEventListener('keydown', () => { if (!forced && !coarse()) setActive(false); }, true);

    const api = {
      active: false,
      // Notch and rounded-corner margins in CSS px.
      safe() {
        const cs = getComputedStyle(probe);
        return { top: parseFloat(cs.paddingTop) || 0, right: parseFloat(cs.paddingRight) || 0, bottom: parseFloat(cs.paddingBottom) || 0, left: parseFloat(cs.paddingLeft) || 0 };
      },
      // Put every button where layout.js says, at an exact whole number of real pixels per button pixel.
      place(L) {
        for (const name in BUTTONS) {
          const c = L.controls[name], { el, cv } = els[name];
          if (!c) continue;
          el.style.left = c.x + 'px'; el.style.top = c.y + 'px'; el.style.width = c.w + 'px'; el.style.height = c.h + 'px';
          if (cv.width !== c.artW || cv.height !== c.artH) { cv.width = c.artW; cv.height = c.artH; }
          redraw(name);
        }
        api.layout = L;
        S.touchMenuPanel = L.menuPanel || null;
      },
      // Called every frame: show PAUSE only during play (on the title and level-clear screens it would just start the
      // game), RESTART and MUTE only while paused, and keep the PAUSE and MUTE pictures current.
      update(state, isMuted) {
        if (state.mode !== mode) {
          const wasPaused = mode === 'paused';
          mode = state.mode;
          for (const n of ['restart', 'mute']) els[n].el.classList.toggle('hide', mode !== 'paused');
          els.pause.el.classList.toggle('hide', mode !== 'playing' && mode !== 'paused');
          if (wasPaused !== (mode === 'paused')) redraw('pause');
          if (mode !== 'paused') { for (const [id, p] of pointers) if (BUTTONS[p.name].menu) pointers.delete(id); sync(); }
        }
        if (!!isMuted !== muted) { muted = !!isMuted; redraw('mute'); }
      },
      held: () => input.held(),
      elements: els,
      releaseAll,
    };
    if (forced || coarse()) { api.active = true; S.touchActive = true; root.classList.add('on'); }
    return api;
  };
})(globalThis.SAMMY = globalThis.SAMMY || {});
