// Screen fitting: how big to draw the 320x224 game on this screen. Pure maths, no browser APIs (tested in Node).
// Scaling counts whole steps of the screen's REAL pixels (device pixels), not CSS points. Phones have 2-3 real pixels
// per point, so this fills far more of a phone screen while every game pixel stays an exact square block of real pixels.
(function (S) {
  // view: available size in CSS px; dpr: real pixels per CSS px; game: native size in game pixels.
  // reserveTop/Bottom/Left/Right: CSS px kept free (for on-screen buttons). Default 0.
  // safe: { top, right, bottom, left } CSS px the screen's notch, rounded corners or home bar take (optional);
  // kept free as well, so the picture never goes under them.
  // maxScale: never bigger than this (optional).
  S.computeFit = function computeFit(o) {
    const dpr = o.dpr > 0 ? o.dpr : 1, sf = o.safe || {};
    const rt = (o.reserveTop || 0) + (sf.top || 0), rb = (o.reserveBottom || 0) + (sf.bottom || 0);
    const rl = (o.reserveLeft || 0) + (sf.left || 0), rr = (o.reserveRight || 0) + (sf.right || 0);
    // Available area in device pixels (never negative).
    const availW = Math.max(0, (o.viewW - rl - rr) * dpr);
    const availH = Math.max(0, (o.viewH - rt - rb) * dpr);
    // Tiny epsilon so 1920/320 = 6 isn't read as 5.999...
    const fits = Math.floor(Math.min(availW / o.gameW, availH / o.gameH) + 1e-9);
    const scale = Math.max(1, o.maxScale > 0 ? Math.min(fits, o.maxScale) : fits);
    const devW = o.gameW * scale, devH = o.gameH * scale;
    // Centre in the available area, rounded to whole device pixels so pixel edges line up with the screen's.
    // If the screen is too small even at x1, pin to the top-left so the HUD stays visible.
    const devLeft = Math.max(0, Math.round(rl * dpr + (availW - devW) / 2));
    const devTop = Math.max(0, Math.round(rt * dpr + (availH - devH) / 2));
    return {
      scale, dpr,
      cssW: devW / dpr, cssH: devH / dpr,
      cssLeft: devLeft / dpr, cssTop: devTop / dpr,
      deviceW: devW, deviceH: devH,
      overflows: fits < 1, // the screen is smaller than the game even at its smallest size
    };
  };

  // ---------- on-screen touch buttons ----------
  // Parts of the picture (in game pixels) that buttons may cover: only the dirt below the grass line (row 192,
  // CONFIG.groundY) in the outer 64 pixels on each side. Everything else is kept clear: the HUD and tutorial prompt at
  // the top, and the grass lane where Sammy and the zombies walk.
  S.TOUCH_CORNERS = [{ x0: 0, x1: 64, y0: 192, y1: 224 }, { x0: 256, x1: 320, y0: 192, y1: 224 }];

  // Where the picture and each button go when touch controls are on.
  // o: { viewW, viewH, dpr, gameW, gameH, safe: { top, right, bottom, left } } (sizes in CSS px; safe = notch/rounded-corner margins).
  // Buttons are pixel art: each button pixel is k x k real pixels, so they stay as sharp as the game.
  // Returns { fit (like computeFit), orientation, unit (CSS px per button pixel), controls: { name: { x, y, w, h, artW, artH, over } } }.
  S.touchLayout = function touchLayout(o) {
    const dpr = o.dpr > 0 ? o.dpr : 1, gw = o.gameW, gh = o.gameH;
    const sf = o.safe || {};
    const DW = Math.round(o.viewW * dpr), DH = Math.round(o.viewH * dpr);
    const portrait = o.viewH > o.viewW;
    // Thumb size: about a sixth of the short side, 56-84 CSS px.
    const B = Math.min(84, Math.max(56, Math.round(Math.min(o.viewW, o.viewH) * 0.17)));
    const k = Math.max(2, Math.round(B * dpr / 40)); // real pixels per button pixel (buttons are ~40 button pixels)
    const u = k / dpr;                                // CSS px per button pixel
    const a = Math.ceil(B / u);                        // button size in button pixels (never under B CSS px)
    const px = (n) => Math.ceil(n / u);               // CSS px -> button pixels (rounded up)
    const art = {
      pad: [2 * a, a], jump: [a + Math.round(a * 0.15), a + Math.round(a * 0.15)], whip: [a, a],
      // POSSUM is a little wider than tall so its 6-letter label has room on each side.
      possum: [Math.max(Math.round(a * 0.8), 29, px(56)) + Math.max(4, Math.round(a * 0.12)), Math.max(Math.round(a * 0.8), 29, px(56))],
      pause: [Math.max(Math.round(a * 0.8), px(44)), Math.max(Math.round(a * 0.7), px(44))],
      restart: [Math.max(Math.round(a * 1.6), 40), Math.max(Math.round(a * 0.75), px(44))],
      mute: [Math.max(Math.round(a * 1.6), 40), Math.max(Math.round(a * 0.75), px(44))],
    };
    const g = Math.max(2, Math.round(a * 0.2)) * k;   // gap between buttons (real px)
    const m = px(16) * k;                              // margin from the screen edge (real px)
    const edge = (inset) => Math.max(m, Math.ceil((inset || 0) * dpr) + Math.round(6 * dpr));
    const eL = edge(sf.left), eR = edge(sf.right), eT = edge(sf.top), eB = edge(sf.bottom);
    const size = (n) => ({ w: art[n][0] * k, h: art[n][1] * k });
    // The notch-free part of the screen (real px): the picture stays inside it.
    const sL = Math.ceil((sf.left || 0) * dpr), sR = Math.ceil((sf.right || 0) * dpr);
    const sT = Math.ceil((sf.top || 0) * dpr), sB = Math.ceil((sf.bottom || 0) * dpr);

    // The action buttons at the bottom right. bottom: real px from the screen's bottom edge to the lowest button.
    // 'wide': JUMP in the corner, WHIP to its left (a little higher), POSSUM above JUMP.
    // 'stacked': one column in the right-hand black strip: JUMP at the bottom, WHIP above it, POSSUM above that
    // (used when the strip is too narrow for the wide cluster).
    function place(bottom, arrange) {
      const c = {};
      const J = size('jump'), Wh = size('whip'), P = size('possum'), Pd = size('pad');
      c.pad = { x: eL, y: DH - bottom - Pd.h, w: Pd.w, h: Pd.h };
      c.jump = { x: DW - eR - J.w, y: DH - bottom - J.h, w: J.w, h: J.h };
      if (arrange === 'stacked') {
        c.whip = { x: DW - eR - Wh.w, y: c.jump.y - g - Wh.h, w: Wh.w, h: Wh.h };
        c.possum = { x: DW - eR - P.w, y: c.whip.y - g - P.h, w: P.w, h: P.h };
      } else {
        c.whip = { x: c.jump.x - g - Wh.w, y: DH - bottom - Wh.h - Math.round(a * 0.35) * k, w: Wh.w, h: Wh.h };
        c.possum = { x: c.jump.x + Math.round((J.w - P.w) / 2 / k) * k, y: c.jump.y - g - P.h, w: P.w, h: P.h };
      }
      return c;
    }
    const inGame = (r, pic) => { // a control's rectangle in game pixels, clipped to the picture (null if outside)
      const x0 = Math.max(r.x, pic.x), y0 = Math.max(r.y, pic.y), x1 = Math.min(r.x + r.w, pic.x + pic.w), y1 = Math.min(r.y + r.h, pic.y + pic.h);
      if (x0 >= x1 || y0 >= y1) return null;
      return { x0: (x0 - pic.x) / pic.s, y0: (y0 - pic.y) / pic.s, x1: (x1 - pic.x) / pic.s, y1: (y1 - pic.y) / pic.s };
    };
    const allowed = (r, pic) => {
      const q = inGame(r, pic);
      return !q || S.TOUCH_CORNERS.some((z) => q.x0 >= z.x0 - 1e-9 && q.x1 <= z.x1 + 1e-9 && q.y0 >= z.y0 - 1e-9 && q.y1 <= z.y1 + 1e-9);
    };
    // Centred in the notch-free part of the screen.
    const picAt = (s, top) => {
      const w = gw * s, h = gh * s;
      return { s, w, h, x: Math.max(sL, Math.round(sL + (DW - sL - sR - w) / 2)), y: top == null ? Math.max(sT, Math.round(sT + (DH - sT - sB - h) / 2)) : top };
    };
    const inSafe = (p) => p.x >= sL && p.y >= sT && p.x + p.w <= DW - sR && p.y + p.h <= DH - sB;
    const maxScale = S.computeFit({ viewW: o.viewW, viewH: o.viewH, dpr, gameW: gw, gameH: gh, safe: sf }).scale;
    let pic = null, c = null;

    if (!portrait) {
      // Landscape: buttons in the bottom corners. Use the biggest picture whose overlap with the buttons stays in the
      // allowed corners; try it centred first, then moved to the top, with the wide action cluster first, then the
      // stacked column. Otherwise shrink one step and try again.
      const P = size('pause');
      const pauseSpots = (cc) => [
        { x: DW - eR - P.w, y: eT }, { x: eL, y: eT },                              // top corners of the screen
        { x: eL, y: cc.pad.y - g - P.h }, { x: DW - eR - P.w, y: cc.possum.y - g - P.h }, // above the pad / above POSSUM
      ].map((p) => Object.assign(p, P));
      search: for (let s = maxScale; s >= 1; s--) {
        // Picture heights to try: centred first, then nudged up a little at a time towards the top edge, so the
        // picture stays as close to centred as the corner rule allows.
        const centre = picAt(s).y, topMin = sT, tops = [centre];
        for (let t = centre - k; t > topMin; t -= k) tops.push(t);
        if (topMin !== centre) tops.push(topMin);
        for (const top of tops) {
          for (const arrange of ['wide', 'stacked']) {
            const cand = picAt(s, top), cc = place(eB, arrange);
            if (cc.possum.y < eT || !inSafe(cand)) continue;
            if (!['pad', 'jump', 'whip', 'possum'].every((n) => allowed(cc[n], cand))) continue;
            const spot = pauseSpots(cc).find((p) => allowed(p, cand) && !(p.y + p.h > cc.possum.y - g && p.x + p.w > cc.possum.x - g));
            if (!spot) continue;
            pic = cand; c = cc; c.pause = spot; break search;
          }
        }
      }
      if (!pic) { pic = picAt(1); c = place(eB, 'wide'); c.pause = pauseSpots(c)[0]; }
    } else {
      // Portrait: buttons near the bottom, raised a tenth of the screen above the bottom edge so thumbs rest on them
      // comfortably; the picture is centred in the space above them (below any notch), with PAUSE just under it.
      const bottom = Math.max(eB, Math.round(DH * 0.1));
      c = place(bottom, 'wide');
      const clusterTop = Math.min(c.pad.y, c.whip.y, c.possum.y);
      const P = size('pause');
      const below = P.h + 2 * g + (DH - clusterTop);    // room the buttons need under the picture (real px)
      const f = S.computeFit({ viewW: o.viewW, viewH: o.viewH, dpr, gameW: gw, gameH: gh, reserveTop: sT / dpr, reserveBottom: below / dpr,
        reserveLeft: sL / dpr, reserveRight: sR / dpr });
      pic = picAt(f.scale, Math.round(f.cssTop * dpr));
      c.pause = Object.assign({ x: DW - eR - P.w, y: pic.y + pic.h + g }, P);
    }

    // Pause menu (shown only while paused): RESTART and MUTE side by side.
    // Sideways: over the picture, under the PAUSED panel. Upright: in the empty band below the picture, on the same
    // row as the PAUSE button (to its left), so the small picture stays visible.
    const R = size('restart'), Mu = size('mute');
    const rowW = R.w + g + Mu.w;
    let rowX = Math.round((DW - rowW) / 2), rowY = pic.y + Math.round(140 * pic.s);
    if (portrait) {
      rowY = c.pause.y;
      rowX = Math.max(eL, Math.round((c.pause.x - g - rowW) / 2));
      if (rowX + rowW > c.pause.x - g) { rowX = Math.round((DW - rowW) / 2); rowY = c.pause.y + c.pause.h + g; } // too narrow: below PAUSE
    }
    c.restart = Object.assign({ x: rowX, y: rowY }, R);
    c.mute = Object.assign({ x: c.restart.x + R.w + g, y: rowY }, Mu);
    // Sideways, the game draws its PAUSED box big enough to hold RESTART and MUTE too (in game pixels; render.js),
    // so the scene doesn't peek out around the buttons.
    let menuPanel = null;
    if (!portrait) {
      const gx = (v) => (v - pic.x) / pic.s, gy = (v) => (v - pic.y) / pic.s;
      menuPanel = {
        x0: Math.max(1, Math.min(100, Math.floor(gx(c.restart.x - g)))), y0: 80,
        x1: Math.min(gw - 1, Math.max(220, Math.ceil(gx(c.mute.x + Mu.w + g)))),
        y1: Math.min(gh - 1, Math.max(130, Math.ceil(gy(rowY + Math.max(R.h, Mu.h) + g)))),
      };
    }

    // FULL SCREEN button (same size as PAUSE), in the first free spot next to PAUSE: below it, the other PAUSE spots,
    // left of it, above it. It must keep off the picture entirely, clear of notches, and not touch
    // any other button (RESTART and MUTE included). It never makes the picture smaller; if no spot is free it is left out.
    {
      const F = size('pause'), p = c.pause;
      const spots = [{ x: p.x, y: p.y + p.h + g }, { x: p.x - g - F.w, y: p.y }, { x: p.x, y: p.y - g - F.h }, { x: p.x + p.w + g, y: p.y }];
      if (!portrait) {
        spots.splice(1, 0, { x: DW - eR - F.w, y: eT }, { x: eL, y: eT });
        spots.push({ x: eL, y: c.pad.y - g - F.h });
      }
      const others = Object.keys(c).map((n) => c[n]);
      const clear = (r) => others.every((o2) => r.x + r.w + g <= o2.x || o2.x + o2.w + g <= r.x || r.y + r.h + g <= o2.y || o2.y + o2.h + g <= r.y);
      const spot = spots.map((s) => Object.assign(s, F)).find((r) => r.x >= eL && r.y >= eT && r.x + r.w <= DW - eR && r.y + r.h <= DH - eB &&
        !inGame(r, pic) && clear(r));
      if (spot) c.full = spot;
    }

    const controls = {};
    for (const n in c) {
      const r = c[n];
      controls[n] = { x: r.x / dpr, y: r.y / dpr, w: r.w / dpr, h: r.h / dpr, artW: r.w / k, artH: r.h / k,
        over: !!inGame(r, pic), dev: { x: r.x, y: r.y, w: r.w, h: r.h } };
    }
    return {
      orientation: portrait ? 'portrait' : 'landscape', unit: u, k, maxScale, menuPanel,
      fit: { scale: pic.s, dpr, cssW: pic.w / dpr, cssH: pic.h / dpr, cssLeft: pic.x / dpr, cssTop: pic.y / dpr,
        deviceW: pic.w, deviceH: pic.h, overflows: pic.w > DW || pic.h > DH },
      controls,
    };
  };

  // ---------- "turn your phone sideways" message ----------
  // Shown only with the touch buttons on, on a phone-sized screen (short side under PHONE_MAX_SHORT_SIDE CSS px) held
  // upright, until the player picks "play upright anyway". Tablets play upright without it (an upright iPad still gets
  // a big x5 picture, and the message says "phone").
  S.isPortrait = (viewW, viewH) => viewH > viewW;
  S.PHONE_MAX_SHORT_SIDE = 600;
  S.needsSidewaysPrompt = (o) => !!(o.touch && !o.dismissed && S.isPortrait(o.viewW, o.viewH) &&
    Math.min(o.viewW, o.viewH) < S.PHONE_MAX_SHORT_SIDE);

  // Where the message's pixel-art card goes: artW x artH card pixels, each k x k real pixels (whole numbers, so it is as
  // sharp as the game), as big as fits in 92% of the notch-free width and 80% of its height (and no wider than maxW CSS
  // px, if given), centred in it.
  // o: { viewW, viewH, dpr, artW, artH, safe, maxW }. Returns { k, x, y, w, h } (CSS px) and dev (the same in real px).
  S.promptLayout = function promptLayout(o) {
    const dpr = o.dpr > 0 ? o.dpr : 1, sf = o.safe || {};
    const sL = Math.ceil((sf.left || 0) * dpr), sR = Math.ceil((sf.right || 0) * dpr);
    const sT = Math.ceil((sf.top || 0) * dpr), sB = Math.ceil((sf.bottom || 0) * dpr);
    const aw = Math.max(0, Math.round(o.viewW * dpr) - sL - sR), ah = Math.max(0, Math.round(o.viewH * dpr) - sT - sB);
    let k = Math.floor(Math.min(aw * 0.92 / o.artW, ah * 0.8 / o.artH));
    if (o.maxW > 0) k = Math.min(k, Math.floor(o.maxW * dpr / o.artW));
    k = Math.max(1, k);
    const w = o.artW * k, h = o.artH * k;
    const x = Math.max(sL, Math.round(sL + (aw - w) / 2)), y = Math.max(sT, Math.round(sT + (ah - h) / 2));
    return { k, x: x / dpr, y: y / dpr, w: w / dpr, h: h / dpr, dev: { x, y, w, h } };
  };
})(globalThis.SAMMY = globalThis.SAMMY || {});
