// Phone and tablet page behaviour: the "turn your phone sideways" message, full screen, and guards against
// accidental zooming, scrolling and long-press menus. main.js decides when the message shows (layout.js maths).
(function (S) {
  const K = S.PAL;
  const R = (g, col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  // A curved arrow turning to the right (drawn at 2x with a dark shadow, like the button icons).
  const TURN = [
    '...#####.....',
    '.##.....##...',
    '#.........#..',
    '#.........#..',
    '#.......#####',
    '#........###.',
    '..........#..',
  ];

  // The message card, in card pixels (each one k x k real pixels on screen; layout.js S.promptLayout).
  const CARD_W = 168, CARD_H = 126;
  const BTN_TEXT = 'PLAY UPRIGHT ANYWAY';
  const BTN = { w: 0, h: 16, x: 0, y: 100 };
  BTN.w = S.textWidth(BTN_TEXT) + 16; BTN.x = Math.round((CARD_W - BTN.w) / 2);

  function drawCard(g, down) {
    const W = CARD_W, H = CARD_H;
    g.clearRect(0, 0, W, H);
    // The same box as the game's PAUSED and title panels: black edge, dark blue, a lighter blue band on top.
    R(g, K.black, 0, 0, W, H); R(g, K.hud, 1, 1, W - 2, H - 2); R(g, K.sky1, 1, 1, W - 2, 2);
    // Upright phone (grey, dim) -> arrow -> sideways phone showing a tiny bit of the game.
    const y0 = 16;
    const ux = 39, uy = y0;                                // upright phone, 16 x 28
    R(g, K.black, ux - 1, uy - 1, 18, 30); R(g, K.sammyDark, ux, uy, 16, 28); R(g, K.grey, ux + 1, uy, 14, 1);
    R(g, K.dark, ux + 2, uy + 3, 12, 20); R(g, K.dark, ux + 6, uy + 1, 4, 1); R(g, K.dark, ux + 7, uy + 25, 2, 1);
    drawBitmap(g, TURN, 64, y0 + 4, K.umbrella, 2);
    const sx = 98, sy = y0 + 6;                            // sideways phone, 30 x 16
    R(g, K.black, sx - 1, sy - 1, 32, 18); R(g, K.sammy, sx, sy, 30, 16); R(g, K.white, sx + 1, sy, 28, 1);
    R(g, K.sky1, sx + 3, sy + 2, 24, 8); R(g, K.sky2, sx + 3, sy + 7, 24, 2);
    R(g, K.trees, sx + 3, sy + 9, 24, 1); R(g, K.grass, sx + 3, sy + 10, 24, 1); R(g, K.dirt, sx + 3, sy + 11, 24, 3);
    R(g, K.sammy, sx + 9, sy + 8, 4, 2); R(g, K.nose, sx + 13, sy + 9, 1, 1);                  // Sammy
    R(g, K.jogger, sx + 19, sy + 6, 2, 4); R(g, K.band, sx + 19, sy + 6, 2, 1);                 // a zombie
    R(g, K.sammyDark, sx + 1, sy + 7, 1, 2);               // button on the side
    // Words.
    S.drawTextCentered(g, 'TURN YOUR PHONE', W / 2, 56, K.white, 2, K.black);
    S.drawTextCentered(g, 'SIDEWAYS', W / 2, 70, K.umbrella, 2, K.black);
    S.drawTextCentered(g, 'THE GAME FITS BEST THIS WAY', W / 2, 88, K.grey);
    // The button (same pixel-art button as the touch controls).
    S.pixelArt.body(g, BTN.x, BTN.y, BTN.w, BTN.h, S.pixelArt.COLORS.menu, down);
    S.drawText(g, BTN_TEXT, BTN.x + 8, BTN.y + 4 + (down ? 2 : 0), K.white, 1, K.black);
  }
  function drawBitmap(g, rows, x, y, col, s) {
    for (let pass = 0; pass < 2; pass++) {
      const c = pass ? col : K.black, o = pass ? 0 : 1;
      rows.forEach((row, r) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') R(g, c, x + i * s + o, y + r * s + o, s, s); });
    }
  }

  // opts: { onDismiss, onFullscreenChange, dismissed (start with the message already put away, ?upright=1) }
  S.createPhone = function (opts) {
    const doc = document, root = doc.documentElement;

    // ---------- "turn your phone sideways" message ----------
    const box = doc.createElement('div');
    box.id = 'sideways';
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Turn your phone sideways to play');
    const cv = doc.createElement('canvas');
    cv.width = CARD_W; cv.height = CARD_H;
    const btn = doc.createElement('button');
    btn.type = 'button'; btn.textContent = 'Play upright anyway'; btn.setAttribute('data-tap-ok', '');
    box.appendChild(cv); box.appendChild(btn);
    doc.body.appendChild(box);
    drawCard(cv.getContext('2d'), false);

    let dismissed = !!opts.dismissed;
    try { if (sessionStorage.getItem('sammy-upright') === '1') dismissed = true; } catch (e) { /* storage blocked: ask again next visit */ }
    const press = (on) => drawCard(cv.getContext('2d'), on);
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true; press(false);
      try { sessionStorage.setItem('sammy-upright', '1'); } catch (e) { /* storage blocked: fine for this visit */ }
      if (opts.onDismiss) opts.onDismiss();
    };
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); press(true); });
    btn.addEventListener('pointerleave', () => press(false));
    btn.addEventListener('pointercancel', () => press(false));
    btn.addEventListener('pointerup', dismiss);
    btn.addEventListener('click', dismiss); // keyboard and screen readers

    // ---------- full screen ----------
    const fsAvailable = !!(doc.fullscreenEnabled || doc.webkitFullscreenEnabled) &&
      !!(root.requestFullscreen || root.webkitRequestFullscreen);
    const isFullscreen = () => !!(doc.fullscreenElement || doc.webkitFullscreenElement);
    const quiet = (p) => { if (p && p.catch) p.catch(() => {}); };
    function lockSideways() {
      try { if (screen.orientation && screen.orientation.lock) quiet(screen.orientation.lock('landscape')); } catch (e) { /* not allowed here */ }
    }
    function toggleFullscreen() {
      try {
        if (isFullscreen()) { quiet((doc.exitFullscreen || doc.webkitExitFullscreen).call(doc)); return; }
        const req = root.requestFullscreen || root.webkitRequestFullscreen;
        const p = req.call(root, { navigationUI: 'hide' });
        if (p && p.then) p.then(lockSideways, () => {}); else lockSideways();
      } catch (e) { /* the browser said no */ }
    }
    const fsChanged = () => { if (opts.onFullscreenChange) opts.onFullscreenChange(isFullscreen()); };
    doc.addEventListener('fullscreenchange', fsChanged);
    doc.addEventListener('webkitfullscreenchange', fsChanged);

    // ---------- no accidental zoom, scroll or long-press menu ----------
    // Pinch zoom on iPhone (Safari ignores the page's "no zoom" setting).
    const stop = (e) => { if (e.cancelable) e.preventDefault(); };
    for (const t of ['gesturestart', 'gesturechange', 'gestureend']) doc.addEventListener(t, stop, { passive: false });
    // Two-finger moves (pinch) and double-tap zoom. Taps on the message's button are left alone.
    doc.addEventListener('touchmove', (e) => { if (e.touches && e.touches.length > 1) stop(e); }, { passive: false });
    let lastEnd = -1e9;
    doc.addEventListener('touchend', (e) => {
      const ok = e.target && e.target.closest && e.target.closest('[data-tap-ok]');
      if (!ok && e.timeStamp - lastEnd < 350) stop(e);
      lastEnd = e.timeStamp;
    }, { passive: false });
    // Long-press menus ("save image", "copy") on the game, the buttons and the message: blocked for fingers only,
    // so right-click on a computer works as before.
    let lastPointer = 'mouse';
    window.addEventListener('pointerdown', (e) => { lastPointer = e.pointerType || 'mouse'; }, true);
    doc.addEventListener('contextmenu', (e) => { if (lastPointer !== 'mouse') e.preventDefault(); });

    const api = {
      promptVisible: false,
      get dismissed() { return dismissed; },
      // Show or hide the message; layout: { viewW, viewH, dpr, safe } for placing the card.
      showPrompt(on, o) {
        api.promptVisible = !!on;
        box.classList.toggle('on', !!on);
        if (!on) return;
        const L = S.promptLayout({ viewW: o.viewW, viewH: o.viewH, dpr: o.dpr, safe: o.safe, artW: CARD_W, artH: CARD_H, maxW: 520 });
        Object.assign(cv.style, { left: L.x + 'px', top: L.y + 'px', width: L.w + 'px', height: L.h + 'px' });
        // The tap area covers the drawn button and is at least 48 x 48 points.
        const u = L.w / CARD_W, bw = Math.max(48, BTN.w * u), bh = Math.max(48, BTN.h * u);
        Object.assign(btn.style, { left: (L.x + (BTN.x + BTN.w / 2) * u - bw / 2) + 'px', top: (L.y + (BTN.y + BTN.h / 2) * u - bh / 2) + 'px',
          width: bw + 'px', height: bh + 'px' });
        api.promptLayout = L;
      },
      promptButton: btn,
      fullscreenAvailable: fsAvailable,
      isFullscreen,
      toggleFullscreen,
    };
    return api;
  };
})(globalThis.SAMMY = globalThis.SAMMY || {});
