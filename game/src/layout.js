// Screen fitting: how big to draw the 320x224 game on this screen. Pure maths, no browser APIs (tested in Node).
// Scaling counts whole steps of the screen's REAL pixels (device pixels), not CSS points. Phones have 2-3 real pixels
// per point, so this fills far more of a phone screen while every game pixel stays an exact square block of real pixels.
(function (S) {
  // view: available size in CSS px; dpr: real pixels per CSS px; game: native size in game pixels.
  // reserveTop/Bottom/Left/Right: CSS px kept free (for on-screen buttons later). Default 0.
  S.computeFit = function computeFit(o) {
    const dpr = o.dpr > 0 ? o.dpr : 1;
    const rt = o.reserveTop || 0, rb = o.reserveBottom || 0, rl = o.reserveLeft || 0, rr = o.reserveRight || 0;
    // Available area in device pixels (never negative).
    const availW = Math.max(0, (o.viewW - rl - rr) * dpr);
    const availH = Math.max(0, (o.viewH - rt - rb) * dpr);
    // Tiny epsilon so 1920/320 = 6 isn't read as 5.999...
    const fits = Math.floor(Math.min(availW / o.gameW, availH / o.gameH) + 1e-9);
    const scale = Math.max(1, fits);
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
})(globalThis.SAMMY = globalThis.SAMMY || {});
