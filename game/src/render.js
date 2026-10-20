// Drawing. Uses real art from S.images when it has loaded; otherwise draws clearly marked placeholders.
(function (S) {
  const C = S.CONFIG, K = S.PAL, G = C.groundY, W = C.screenW, H = C.screenH;
  const rnd = (n) => (((n * 2654435761) >>> 0) % 1000) / 1000;
  const R = (ctx, col, x, y, w, h) => { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

  // Draw a frame from a real sprite strip. Returns false when no art is loaded for that key.
  // white = draw the all-white copy instead (hit flash), when one was made at load time.
  function sprite(ctx, key, t, x, y, face, reverse, frame, white) {
    const m = S.images[key];
    if (!m) return false;
    const f = frame != null ? Math.min(frame, m.frames - 1) : S.frameAt(m, t, reverse);
    S.spriteDraws[key] = (S.spriteDraws[key] || 0) + 1; // counted for the ?test= self-check
    const src = white && m.flash ? m.flash : m.img;
    if (src !== m.img) S.flashDraws[key] = (S.flashDraws[key] || 0) + 1;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (face < 0) { ctx.translate(1, 0); ctx.scale(-1, 1); } // mirror around the pivot column, not 1 px left of it
    // Feet-pivot sprites: the pivot row sits on the pixel row just above the ground line.
    ctx.drawImage(src, f * m.fw, 0, m.fw, m.fh, -m.px, -m.py - (m.feet ? 1 : 0), m.fw, m.fh);
    ctx.restore();
    return true;
  }
  S.drawSprite = sprite;
  S.spriteDraws = {};
  S.flashDraws = {};

  // ---------- background (parallax) ----------
  // Band rows, scroll speeds and loop widths come from the bg:* entries in assets.js.
  const BG = {};
  for (const m of S.ASSET_MANIFEST) if (m.key.startsWith('bg:')) BG[m.key] = m;
  function drawBackground(ctx, camX) {
    if (!sprite(ctx, 'bg:sky', 0, 0, BG['bg:sky'].y, 1)) {
      // Night sky: flat bands, a checkerboard dither row at each seam, stars, and a dithered full moon (light from the top-left).
      const bands = [K.sky0, K.sky1, K.sky2, K.sky3, K.sky4];
      bands.forEach((c, i) => R(ctx, c, 0, i * 28, W, 28));
      R(ctx, K.sky4, 0, 140, W, 84);
      for (let i = 1; i < bands.length; i++) dither(ctx, bands[i - 1], 0, i * 28, W, 2);
      for (let i = 0; i < 46; i++) {
        const sx = Math.floor(rnd(i + 401) * W), sy = 18 + Math.floor(rnd(i + 733) * 70);
        R(ctx, K.star, sx, sy, 1, 1);
        if (rnd(i + 57) > 0.85) { R(ctx, K.sky2, sx - 1, sy, 1, 1); R(ctx, K.sky2, sx + 1, sy, 1, 1); R(ctx, K.sky2, sx, sy - 1, 1, 1); R(ctx, K.sky2, sx, sy + 1, 1, 1); }
      }
      drawMoon(ctx, 52, 50, 13);
    }
    // Placeholder shapes stay inside each band's rows, like real art would.
    tiled(ctx, 'bg:skyline', camX, (ox, y, w, h) => {
      for (let i = 0; i < w / 32; i++) {
        const bw = 16 + Math.floor(rnd(i + 7) * 20), bh = 16 + Math.floor(rnd(i + 31) * 40);
        const bx = ox + i * 32;
        R(ctx, K.skyline, bx, y + h - bh, bw, bh);
        if (rnd(i + 3) > 0.6) R(ctx, K.skyline, bx + bw / 2 - 1, y + h - bh - 8, 2, 8);
        // Lit windows: a few warm squares per building, on a 4 px grid.
        for (let wy = y + h - bh + 4; wy < y + h - 4; wy += 5) for (let wx = bx + 3; wx < bx + bw - 3; wx += 4) {
          if (rnd(wx * 7 + wy * 13 + i) > 0.82) R(ctx, K.window, wx, wy, 2, 2);
        }
      }
    });
    tiled(ctx, 'bg:treeline', camX, (ox, y, w, h) => {
      for (let i = 0; i < w / 16; i++) {
        const r = 4 + Math.floor(rnd(i + 99) * 10);
        R(ctx, K.trees, ox + i * 16, y + 14 - r, 18, r);
      }
      R(ctx, K.trees, ox, y + 12, w, h - 12);
    });
    tiled(ctx, 'bg:bushes', camX, (ox, y, w, h) => {
      R(ctx, K.trees, ox, y, w, 8); // band is solid, so its top rows continue the tree line
      for (let i = 0; i < w / 22; i++) {
        const r = 4 + Math.floor(rnd(i + 55) * 8);
        R(ctx, K.bushes, ox + i * 22, y + 12 - r, 20, r);
        if (rnd(i + 17) > 0.6) R(ctx, [K.leaf0, K.leaf1, K.leaf2][i % 3], ox + i * 22 + 6, y + 14 - r, 1, 1); // autumn leaf
      }
      R(ctx, K.bushes, ox, y + 8, w, h - 8);
    });
  }
  // Checkerboard of colour c over a rectangle (the 16-bit way to blend two colours).
  function dither(ctx, c, x, y, w, h) {
    ctx.fillStyle = c;
    for (let yy = 0; yy < h; yy++) for (let xx = (yy + y + x) & 1; xx < w; xx += 2) ctx.fillRect(x + xx, y + yy, 1, 1);
  }
  // Full moon: pale disc, dithered shadow edge on the lower right, a few craters, a faint dithered halo.
  function drawMoon(ctx, cx, cy, r) {
    for (let y = -r - 3; y <= r + 3; y++) for (let x = -r - 3; x <= r + 3; x++) {
      const d = Math.sqrt(x * x + y * y);
      let c = null;
      if (d <= r) c = (x + y > r * 0.9 && ((x + y) & 1)) ? K.moonMid : K.moon;
      else if (d <= r + 3 && ((x + y) & 1) === 0 && d > r + 1) c = K.sky2;
      if (c) R(ctx, c, cx + x, cy + y, 1, 1);
    }
    R(ctx, K.moonCrater, cx - 5, cy - 3, 4, 3); R(ctx, K.moonCrater, cx + 3, cy + 2, 3, 3);
    R(ctx, K.moonCrater, cx - 1, cy + 6, 2, 2); R(ctx, K.moonMid, cx + 4, cy - 6, 2, 2);
  }
  // Amber lamp glow: a dithered halo that thins out with distance. Never see-through pixels.
  function lampGlow(ctx, cx, cy) {
    for (let y = -14; y <= 14; y++) for (let x = -16; x <= 16; x++) {
      const d = Math.sqrt(x * x + y * y * 1.3), px = cx + x, py = cy + y;
      if (d < 5) { if ((px + py) & 1) R(ctx, K.lampGlow, px, py, 1, 1); }
      else if (d < 10) { if (((px + py) & 1) && (py & 1)) R(ctx, K.lampHalo, px, py, 1, 1); }
      else if (d < 15) { if ((px & 3) === 0 && (py & 3) === (px & 4 ? 2 : 0)) R(ctx, K.lampDeep, px, py, 1, 1); }
    }
  }
  function tiled(ctx, key, camX, fallback) {
    const b = BG[key], m = S.images[key];
    const off = -((camX * b.scroll) % b.fw);
    for (let ox = off; ox < W; ox += b.fw) {
      if (m) ctx.drawImage(m.img, Math.round(ox), b.y);
      else fallback(Math.round(ox), b.y, b.fw, b.fh);
    }
  }

  // ---------- world ----------
  // The last screen (the gauntlet arena) is Bethesda Terrace: stone floor instead of grass and earth.
  function drawGround(ctx, s, x0, x1) {
    const A = s.level.arena;
    for (const g of s.level.ground) {
      const a = Math.max(g.x0, x0), b = Math.min(g.x1, Math.min(x1, A.x0));
      if (a < b) {
        R(ctx, K.dirt, a, G, b - a, H - G);
        R(ctx, K.grass, a, G, b - a, 4);
        for (let x = Math.floor(a / 8) * 8; x < b; x += 8) {
          if (rnd(x) > 0.5) R(ctx, K.grass, x + 2, G - 2, 2, 2);
          if (rnd(x + 1) > 0.7) R(ctx, K.dirtDark, x + 3, G + 10 + Math.floor(rnd(x + 2) * 18), 3, 2);
          if (rnd(x + 5) > 0.82) R(ctx, [K.leaf0, K.leaf1, K.leaf2][x % 3], x + 5, G + 1, 2, 1);           // fallen leaves
          if (rnd(x + 9) > 0.8) { R(ctx, K.stoneLight, x + 1, G + 6 + Math.floor(rnd(x + 3) * 8), 1, 2); }  // wet glint
        }
      }
      // Bethesda Terrace: rain-slick stone slabs.
      const sa = Math.max(g.x0, x0, A.x0), sb = Math.min(g.x1, x1);
      if (sa < sb) {
        R(ctx, K.stoneMid, sa, G, sb - sa, H - G);
        R(ctx, K.stoneLight, sa, G, sb - sa, 2);
        for (let row = 0; row < 3; row++) {
          const y = G + 2 + row * 10;
          R(ctx, K.stone, sa, y + 9, sb - sa, 1);
          for (let x = Math.floor(sa / 24) * 24 + (row & 1) * 12; x < sb; x += 24) if (x >= sa) R(ctx, K.stone, x, y, 1, 9);
        }
        for (let x = Math.floor(sa / 8) * 8; x < sb; x += 8) if (rnd(x + 21) > 0.7) dither(ctx, K.stoneLight, x + 2, G + 4, 1, 4 + Math.floor(rnd(x) * 6));
      }
    }
    // Lamp reflections on the wet ground: short vertical dithered amber streaks under each lamp.
    for (const p of s.level.platforms) if (p.kind === 'lamp') {
      const lx = p.x + p.w / 2;
      if (lx < x0 || lx > x1) continue;
      for (let i = -1; i <= 1; i++) for (let y = G + 3; y < G + 20 - Math.abs(i) * 8; y += 2) R(ctx, i ? K.lampHalo : K.lampGlow, lx + i * 3 + ((y >> 1) & 1), y, 1, 1);
    }
    for (const w of s.level.water) {
      R(ctx, K.water, w.x0, w.y, w.x1 - w.x0, H - w.y);
      const ph = Math.floor(s.t * 4) % 2;
      for (let x = w.x0 + ph * 4; x < w.x1 - 4; x += 8) R(ctx, K.waterHi, x, w.y + 2 + ((x / 8) % 2) * 6, 4, 1);
    }
  }

  // Bethesda Terrace backdrop for the arena (decoration only; nothing here is solid):
  // an arcade wall with arches, a balustrade on top, and the angel fountain in the middle.
  function drawTerrace(ctx, A) {
    const x0 = A.x0, x1 = A.x1, wallTop = 140;
    R(ctx, K.stoneMid, x0, wallTop, x1 - x0, G - wallTop);
    R(ctx, K.stoneLight, x0, wallTop, x1 - x0, 2);
    for (let ax = x0 + 12; ax + 28 <= x1; ax += 44) {                // arches: dark openings with round tops
      R(ctx, K.arch, ax + 4, wallTop + 14, 20, G - wallTop - 14);
      R(ctx, K.arch, ax + 6, wallTop + 11, 16, 3); R(ctx, K.arch, ax + 9, wallTop + 9, 10, 2);
      R(ctx, K.stoneLight, ax + 2, wallTop + 14, 2, G - wallTop - 14); // pillar highlight, light from the left
      dither(ctx, K.stone, ax + 4, G - 6, 20, 6);
    }
    R(ctx, K.stoneLight, x0, 124, x1 - x0, 3);                         // balustrade rail
    for (let bx = x0 + 2; bx < x1; bx += 6) { R(ctx, K.stoneMid, bx, 127, 3, 13); R(ctx, K.stoneLight, bx, 128, 1, 10); }
    R(ctx, K.stone, x0, 138, x1 - x0, 2);
    // Angel fountain: wide basin, column, upper bowl, angel with spread wings.
    const cx = Math.round((x0 + x1) / 2);
    R(ctx, K.stone, cx - 3, 112, 6, G - 112);                          // column
    R(ctx, K.stoneLight, cx - 3, 112, 1, G - 124);
    R(ctx, K.stone, cx - 16, 132, 32, 4); R(ctx, K.stoneLight, cx - 16, 132, 32, 1); R(ctx, K.stone, cx - 10, 136, 20, 3); // upper bowl
    for (let y = 137; y < G - 12; y += 2) { R(ctx, K.waterHi, cx - 15 + (y & 2), y, 1, 1); R(ctx, K.waterHi, cx + 14 - (y & 2), y, 1, 1); } // spill
    R(ctx, K.arch, cx - 4, 92, 8, 20);                                // angel body
    R(ctx, K.arch, cx - 2, 86, 4, 5);                                 // head
    R(ctx, K.arch, cx - 18, 90, 14, 4); R(ctx, K.arch, cx - 14, 94, 10, 4); R(ctx, K.arch, cx - 9, 98, 5, 4); // wings
    R(ctx, K.arch, cx + 4, 90, 14, 4); R(ctx, K.arch, cx + 4, 94, 10, 4); R(ctx, K.arch, cx + 4, 98, 5, 4);
    R(ctx, K.arch, cx + 3, 80, 2, 12);                                // raised arm
    R(ctx, K.stoneLight, cx - 18, 90, 14, 1); R(ctx, K.stoneLight, cx - 2, 86, 1, 5); R(ctx, K.stoneLight, cx - 4, 92, 1, 20); R(ctx, K.stoneLight, cx + 3, 80, 1, 10); // moonlit edges
    R(ctx, K.stoneMid, cx - 48, G - 12, 96, 12);                       // lower basin
    R(ctx, K.stoneLight, cx - 48, G - 12, 96, 2);
    R(ctx, K.water, cx - 44, G - 10, 88, 3);
    dither(ctx, K.waterHi, cx - 44, G - 10, 88, 1);
    R(ctx, K.stone, cx - 48, G - 2, 96, 2);
  }

  function drawStatic(ctx, s) {
    const A = s.level.arena;
    if (A.x1 > s.cam.x - 16 && A.x0 < s.cam.x + W + 16) drawTerrace(ctx, A);
    for (const b of s.level.solids) {
      if (b.kind === 'rock') { R(ctx, K.rock, b.x, b.y, b.w, b.h); R(ctx, K.grey, b.x + 3, b.y + 2, b.w - 10, 3); }
      else if (b.kind === 'fence') { R(ctx, K.fence, b.x, b.y, b.w, b.h); R(ctx, K.fence, b.x - 6, b.y + 6, b.w + 12, 3); R(ctx, K.fence, b.x - 6, b.y + 15, b.w + 12, 3); }
    }
    for (const p of s.level.platforms) {
      if (p.kind === 'bench') {
        R(ctx, K.bench, p.x, p.y, p.w, 4); R(ctx, K.bench, p.x, p.y - 10, p.w, 3);
        R(ctx, K.dark, p.x + 2, p.y + 4, 3, G - p.y - 4); R(ctx, K.dark, p.x + p.w - 5, p.y + 4, 3, G - p.y - 4);
      } else if (p.kind === 'lamp') {
        lampGlow(ctx, p.x + p.w / 2, p.y + 6);
        R(ctx, K.pole, p.x + p.w / 2 - 2, p.y + 4, 4, G - p.y - 4);
        R(ctx, K.pole, p.x, p.y, p.w, 4); R(ctx, K.lamp, p.x + 4, p.y + 4, p.w - 8, 3);
      }
    }
    for (const cp of s.cps) {
      R(ctx, K.pole, cp.x - 1, G - 40, 3, 40);
      R(ctx, cp.active ? K.umbrella : K.lampOff, cp.x + 2, G - 40, 12, 8);
      S.drawText(ctx, cp.id, cp.x + 3, G - 39, K.black);
    }
    if (s.arena.state !== 'idle') {
      R(ctx, K.fence, A.x0, 128, 8, G - 128);
      for (let y = 136; y < G; y += 14) R(ctx, K.fence, A.x0, y, 14, 3);
    }
    // Exit gate: bars rise when the gauntlet is cleared.
    const barH = s.arena.state === 'open' ? 6 : G - 126;
    R(ctx, K.dark, A.gateX - 4, 120, A.gateW + 8, 6);
    for (let x = A.gateX; x < A.gateX + A.gateW; x += 6) R(ctx, K.gate, x, 126, 3, barH);
    R(ctx, K.umbrella, A.gateX - 2, 108, A.gateW + 4, 10);
    S.drawText(ctx, 'EXIT', A.gateX + 2, 110, K.black);
  }

  function drawCart(ctx, c, t) {
    const key = 'cart:' + c.anim;
    const cx = c.x + C.cart.w / 2;
    if (sprite(ctx, key, c.animT, cx, G, c.tipDir < 0 ? -1 : 1)) return;
    ctx.save();
    ctx.translate(cx, G);
    let ang = 0;
    if (c.state === 'rocking') ang = Math.sin(c.t * 30) * 0.08;
    if (c.state === 'tipping') ang = (c.t / C.cart.tipTime) * (Math.PI / 2) * (c.tipDir || 1);
    if (c.state === 'tipped' || c.state === 'empty') ang = (Math.PI / 2) * (c.tipDir || 1);
    ctx.rotate(ang);
    const body = c.state === 'empty' ? K.cartDark : K.cart;
    R(ctx, body, -28, -28, 56, 22);
    R(ctx, K.white, -24, -24, 48, 4);
    S.drawText(ctx, 'HOT DOGS', -16, -18, K.white);
    R(ctx, K.dark, -22, -7, 7, 7); R(ctx, K.dark, 15, -7, 7, 7);
    R(ctx, K.pole, -1, -46, 2, 18);
    if (c.state !== 'empty') { R(ctx, K.umbrella, -32, -48, 64, 5); R(ctx, K.cart, -32, -44, 64, 2); }
    else R(ctx, K.umbrella, -20, -48, 30, 4);
    ctx.restore();
  }

  function drawPickup(ctx, pk, t) {
    if (pk.collected) return;
    if (pk.spilled && pk.life < 3 && Math.floor(pk.life * 8) % 2 === 0) return; // blink before vanishing
    if (pk.type === 'hotdog') {
      if (sprite(ctx, 'pickup:hotdog', pk.t, pk.x, pk.y, 1)) return;
      R(ctx, K.hotdog, pk.x - 7, pk.y - 7, 14, 6);
      R(ctx, K.cartDark, pk.x - 8, pk.y - 6, 16, 3);
      R(ctx, K.mustard, pk.x - 5, pk.y - 7, 10, 1);
    } else if (pk.type === 'lid') {
      const bob = Math.round(Math.sin(pk.t * 4) * 2);
      if (sprite(ctx, 'pickup:lid', pk.t, pk.x, pk.y + bob, 1)) return;
      R(ctx, K.lid, pk.x - 7, pk.y - 14 + bob, 14, 12); R(ctx, K.lid, pk.x - 5, pk.y - 16 + bob, 10, 16);
      R(ctx, K.lidHi, pk.x - 2, pk.y - 15 + bob, 4, 2);
      S.drawText(ctx, 'LID', pk.x - 5, pk.y - 11 + bob, K.black);
    }
  }

  // Enemies and Sammy: real sprite or placeholder first, then the state marks (?, !, BOING…) on top of either.
  function drawJogger(ctx, e) {
    const flash = e.state === 'hitreact';
    if (!sprite(ctx, 'jogger:' + e.anim, e.animT, e.x, e.y, e.face, false, null, flash)) drawJoggerPlaceholder(ctx, e, flash);
    const x = Math.round(e.x), y = Math.round(e.y);
    if ((e.state === 'defeat' || e.state === 'dead') && e.t < 0.3) S.drawTextCentered(ctx, 'BOING', x, y - 56, K.white, 1, K.black);
    if (e.state === 'confused') S.drawTextCentered(ctx, '?', x, y - 50, K.white, 2, K.black);
    if (e.state === 'spawn') S.drawTextCentered(ctx, '!', x, y - 50, K.heart, 2, K.black);
  }

  function drawJoggerPlaceholder(ctx, e, flash) {
    const x = Math.round(e.x), y = Math.round(e.y), f = e.face;
    if (e.state === 'defeat' || e.state === 'dead') {
      // Placeholder comedy: the head pops off and bounces away, the body sinks into a pile of sweatsuit.
      const t = e.t;
      const sink = Math.min(1, t / 0.5);
      R(ctx, K.jogger, x - 9, y - 30 * (1 - sink) - 8, 18, 30 * (1 - sink) + 8);
      R(ctx, K.band, x - 10, y - 4, 20, 4);
      const hx = x - f * t * 70, hy = y - 40 - Math.abs(Math.sin(t * 9)) * 24 * (1 - t);
      R(ctx, K.jogger, hx - 4, hy - 8, 8, 8); R(ctx, K.band, hx - 4, hy - 7, 8, 2);
      return;
    }
    const lean = e.state === 'attack' && e.t > 0.15 && e.t < 0.32 ? f * 4 : 0;
    const step = Math.floor(e.animT * 8) % 2;
    R(ctx, K.joggerDark, x - 7 + step * 2, y - 12, 5, 12); R(ctx, K.joggerDark, x + 2 - step * 2, y - 12, 5, 12);
    R(ctx, flash ? K.white : K.jogger, x - 9 + lean, y - 38, 18, 27);
    R(ctx, K.band, x - 9 + lean, y - 34, 18, 3);
    R(ctx, K.black, x + f * 4 - 1 + lean, y - 30, 2, 2);
    R(ctx, K.nose, x + f * 7 + lean, y - 24, 3 * f, 2);  // tongue
    R(ctx, flash ? K.white : K.jogger, x + f * 8 + lean, y - 26, f * (e.state === 'attack' ? 10 : 6), 3); // arms out
  }

  function drawVendor(ctx, e) {
    const flash = e.state === 'hitreact';
    if (!sprite(ctx, 'vendor:' + e.anim, e.animT, e.x, e.y, e.face, false, null, flash)) drawVendorPlaceholder(ctx, e, flash);
    const x = Math.round(e.x), y = Math.round(e.y);
    if (e.state === 'shrug') S.drawTextCentered(ctx, '?', x, y - 50, K.white, 2, K.black);
    if (e.state === 'defeat') S.drawTextCentered(ctx, 'PFFFT', x, y - 48, K.white, 1, K.black);
  }

  function drawVendorPlaceholder(ctx, e, flash) {
    const x = Math.round(e.x), y = Math.round(e.y), f = e.face;
    let hgt = 36;
    if (e.state === 'defeat' || e.state === 'dead') hgt = Math.max(6, 36 * (1 - e.t / C.vendor.defeatTime)); // deflates like a balloon
    R(ctx, flash ? K.white : K.vendor, x - 10, y - hgt, 20, hgt);
    R(ctx, K.white, x - 8, y - hgt + 14, 16, Math.max(0, hgt - 18)); // apron
    R(ctx, K.hat, x - 7, y - hgt - 5, 14, 5);
    if (hgt > 20) { R(ctx, K.black, x + f * 4 - 1, y - hgt + 6, 2, 2); R(ctx, K.vendorDark, x + f * 2 - 3, y - hgt + 10, 7, 2); }
    if (e.state === 'throw') R(ctx, K.vendor, x + f * 8, y - hgt - 2, 4 * f, 10);
  }

  function drawProjectile(ctx, pr) {
    if (sprite(ctx, 'projectile:hotdog', pr.t, pr.x, pr.y, 1)) return;
    const spin = Math.floor(pr.t * 12) % 2;
    if (spin) { R(ctx, K.hotdog, pr.x - 6, pr.y - 2, 12, 4); R(ctx, K.cartDark, pr.x - 5, pr.y - 1, 10, 2); }
    else { R(ctx, K.hotdog, pr.x - 2, pr.y - 6, 4, 12); R(ctx, K.cartDark, pr.x - 1, pr.y - 5, 2, 10); }
  }

  function drawSammy(ctx, s) {
    const p = s.player;
    if (p.invuln > 0 && p.state !== 'ko' && Math.floor(p.invuln * 15) % 2 === 0) return; // blink while invincible
    const anim = p.anim === 'get-up' ? 'play-dead' : p.anim;
    const flash = p.state === 'hurt';
    const real = sprite(ctx, 'sammy:' + anim, p.anim === 'get-up' ? p.animT * 2 : p.animT, p.x, p.y, p.face, p.anim === 'get-up', null, flash);
    if (!real) drawSammyPlaceholder(ctx, s, flash);
    const x = Math.round(p.x), y = Math.round(p.y);
    if (p.state === 'playdead') S.drawTextCentered(ctx, 'Z z', x, y - 26, K.white, 1, K.black);
    if (p.state === 'ko') S.drawTextCentered(ctx, '* * *', x, y - 24 - Math.round(Math.sin(p.t * 8) * 2), K.umbrella, 1, K.black);
    if (p.shield > 0 && p.state !== 'playdead' && p.state !== 'ko') {
      const ox = p.x + p.face * 12, oy = p.y - 14;
      if (!sprite(ctx, 'overlay:lid', 0, ox, oy, p.face, false, 3 - p.shield)) {
        R(ctx, K.lid, ox - 3, oy - 7, 6, 14); R(ctx, K.lidHi, ox - 1, oy - 5, 2, 4 - (3 - p.shield));
      }
    }
  }

  function drawSammyPlaceholder(ctx, s, flash) {
    const p = s.player, x = Math.round(p.x), y = Math.round(p.y), f = p.face;
    const body = flash ? K.white : K.sammy;
    if (p.state === 'playdead' || p.state === 'getup' || p.state === 'ko') {
      // Lying flat on his back, feet up, X eyes, tongue out.
      R(ctx, body, x - 14, y - 12, 28, 12);
      R(ctx, K.sammyDark, x - 10, y - 16, 3, 4); R(ctx, K.sammyDark, x + 6, y - 16, 3, 4);
      S.drawText(ctx, 'X', x + f * 8 - 1, y - 10, K.black);
      R(ctx, K.nose, x + f * 13, y - 8, 2 * f, 3);
      R(ctx, K.nose, x - f * 14, y - 3, -f * 10, 2); // tail
      return;
    }
    const squash = p.anim === 'land' ? 3 : 0;
    const run = p.anim === 'run' ? Math.floor(p.animT * 12) % 2 : 0;
    R(ctx, K.sammyDark, x - 7 + run * 2, y - 6, 4, 6); R(ctx, K.sammyDark, x + 3 - run * 2, y - 6, 4, 6);
    R(ctx, body, x - 10, y - 28 + squash, 20, 23 - squash);
    R(ctx, K.sammyDark, x - 7, y - 32 + squash, 4, 5); R(ctx, K.sammyDark, x + 3, y - 32 + squash, 4, 5); // ears
    R(ctx, K.white, f > 0 ? x + 2 : x - 11, y - 26 + squash, 9, 7);                                    // face
    R(ctx, K.black, x + f * 5, y - 24 + squash, 2, 2);                                                // eye
    R(ctx, K.nose, x + f * 11 - (f < 0 ? 2 : 0), y - 21 + squash, 3, 2);                              // pink nose
    // Bare tail. During the tail-whip's hit frame it swings out in front.
    if (p.state === 'attack' && p.t >= C.sammy.attackHitStart && p.t < C.sammy.attackHitEnd) {
      R(ctx, K.nose, x + f * 6 - (f < 0 ? 24 : 0), y - 18, 24, 3);
      R(ctx, K.white, x + f * 28 - 2, y - 20, 4, 6);
    } else if (p.state === 'attack' && p.t < C.sammy.attackHitStart) {
      R(ctx, K.nose, x - f * 10 - 2, y - 30, 3, 14);
    } else {
      R(ctx, K.nose, x - f * 10 - (f > 0 ? 10 : 0), y - 12, 10, 2);
    }
  }

  function drawEffects(ctx, s) {
    for (const f of s.effects) {
      const k = f.t / f.life;
      if (f.kind === 'spark') { R(ctx, K.white, f.x - 1, f.y - 5, 2, 10); R(ctx, K.white, f.x - 5, f.y - 1, 10, 2); }
      else if (f.kind === 'dust') { for (let i = -1; i <= 1; i++) R(ctx, K.grey, f.x + i * (6 + k * 10) - 2, f.y - 4 - k * 4, 4, 4); }
      else if (f.kind === 'splat') { if (!sprite(ctx, 'effect:splat', f.t, f.x, f.y, 1)) { R(ctx, K.mustard, f.x - 5 - k * 4, f.y - 2, 10 + k * 8, 3); R(ctx, K.hotdog, f.x - 2, f.y - 4, 4, 2); } }
      else if (f.kind === 'splash') { for (let i = -2; i <= 2; i++) R(ctx, K.waterHi, f.x + i * 6, f.y - 14 * (1 - k) - Math.abs(i) * 2, 2, 4); }
      else if (f.kind === 'sparkle') { R(ctx, K.mustard, f.x - 1, f.y - 8 - k * 8, 2, 2); R(ctx, K.white, f.x + 5, f.y - 4 - k * 8, 2, 2); R(ctx, K.white, f.x - 6, f.y - 3 - k * 8, 2, 2); }
      else if (f.kind === 'bang') S.drawTextCentered(ctx, '!', f.x, f.y, K.heart, 2, K.black);
      else if (f.kind === 'text') S.drawTextCentered(ctx, f.text, f.x, Math.round(f.y - k * 10), K.white, 1, K.black);
    }
  }

  // ---------- HUD ----------
  function heart(ctx, x, y, full) {
    const c = full ? K.heart : K.dark;
    R(ctx, c, x + 1, y, 2, 1); R(ctx, c, x + 4, y, 2, 1); R(ctx, c, x, y + 1, 7, 2); R(ctx, c, x + 1, y + 3, 5, 1); R(ctx, c, x + 2, y + 4, 3, 1); R(ctx, c, x + 3, y + 5, 1, 1);
  }
  function drawHud(ctx, s) {
    const p = s.player;
    // 16 px bar, tall enough for the 16x16 HUD icons. Left to right:
    // hearts 4-29 | lid icon 34-49, pips 52-61 | PP 66-79, cooldown bar 82-101 | zombies 120 | time 200 | wave 240.
    R(ctx, K.hud, 0, 0, W, 16);
    for (let i = 0; i < C.sammy.maxHp; i++) heart(ctx, 4 + i * 9, 5, i < p.hp);
    if (p.shield > 0) {
      if (!sprite(ctx, 'hud:lid', 0, 34, 0, 1)) { R(ctx, K.lid, 37, 4, 9, 8); S.drawText(ctx, 'L', 40, 6, K.black); }
      for (let i = 0; i < p.shield; i++) R(ctx, K.lidHi, 52 + i * 4, 6, 2, 4);
    }
    // Play Possum icon: greyed with a filling bar during the cooldown; flashes for a moment when ready again.
    const ready = p.possumCd <= 0 && p.state !== 'playdead' && p.state !== 'getup';
    const blinkReady = ready && p.possumFlash > 0 && Math.floor(p.possumFlash * 6) % 2 === 1;
    R(ctx, ready ? K.nose : K.grey, 66, 3, 14, 10);
    S.drawText(ctx, 'PP', 68, 6, blinkReady ? K.white : K.black);
    if (!ready) {
      const frac = p.state === 'playdead' || p.state === 'getup' ? 0 : 1 - p.possumCd / C.possum.cooldown;
      R(ctx, K.dark, 82, 7, 20, 3); R(ctx, K.nose, 82, 7, Math.round(20 * frac), 3);
    }
    S.drawText(ctx, 'ZOMBIES ' + s.stats.defeated, 120, 6, K.white);
    const secs = Math.floor(s.stats.time);
    S.drawText(ctx, Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0'), 200, 6, K.white);
    if (s.arena.state === 'fight') S.drawText(ctx, 'WAVE ' + (s.arena.wave + 1) + '/' + C.gauntlet.waves.length, 240, 6, K.umbrella);
    // Tutorial prompt for the current part of the level.
    for (const pr of s.level.prompts) {
      if (p.x >= pr.x0 && p.x < pr.x1) {
        const text = (S.touchActive && pr.touch) || pr.text;
        const w = S.textWidth(text) + 8;
        R(ctx, K.hud, (W - w) / 2, 22, w, 11);
        S.drawTextCentered(ctx, text, W / 2, 25, K.white);
      }
    }
    if (p.state === 'ko') {
      S.drawTextCentered(ctx, 'K.O.!', W / 2, 80, K.heart, 4, K.black);
      if (p.t > C.sammy.koTime) S.drawTextCentered(ctx, 'BACK TO THE LAST CHECKPOINT...', W / 2, 110, K.white, 1, K.black);
    }
  }

  // Bottom right; centred at the bottom when touch buttons are showing, so they never hide it.
  function watermark(ctx) {
    const t = 'PLACEHOLDER ART - NOT FINAL', tw = S.textWidth(t);
    const x = S.touchActive ? Math.round((W - tw) / 2) : W - tw - 3;
    R(ctx, K.black, x - 3, H - 9, tw + 6, 9);
    S.drawText(ctx, t, x, H - 7, K.umbrella);
  }

  // ---------- screens ----------
  // Screen text for keyboard players and for the on-screen touch buttons (the tests check every line fits).
  S.TEXT = {
    keys: {
      title1: 'ARROWS/WASD MOVE  Z JUMP  X WHIP  C PLAY POSSUM', title2: 'ENTER PAUSE   R RESTART   M MUTE',
      start: 'PRESS ENTER OR Z TO START', again: 'PRESS ENTER TO PLAY AGAIN', paused: 'ENTER TO RESUME  R RESTART',
    },
    touch: {
      title1: 'BUTTONS: MOVE, JUMP, WHIP, PLAY POSSUM', title2: 'PAUSE BUTTON: RESTART AND MUTE',
      start: 'TAP JUMP TO START', again: 'TAP JUMP TO PLAY AGAIN', paused: 'TAP PLAY TO RESUME',
    },
    // Deadpan, profane, on purpose (owner rule, CLAUDE.md "Tone").
    title: {
      name: 'SAMMY THE OPOSSUM', hunter: 'ZOMBIE HUNTER',
      tag1: 'CENTRAL PARK. NIGHT. EVERY HUMAN IS A ZOMBIE.', tag2: "HE DOESN'T FUCK AROUND WITH ZOMBIES.",
      level: 'LEVEL 1: SHEEP MEADOW, AFTER DARK',
    },
    quips: { paused: 'THE DEAD CAN FUCKING WAIT.', clear: 'THE PARK IS A LITTLE LESS DEAD.', end: "THAT'S THE PROTOTYPE. GO WASH YOUR PAWS." },
  };
  function panel(ctx, x, y, w, h) { R(ctx, K.black, x - 1, y - 1, w + 2, h + 2); R(ctx, K.hud, x, y, w, h); R(ctx, K.hudHi, x, y, w, 2); }

  function drawTitle(ctx, s) {
    drawBackground(ctx, (s.titleT || 0) * 20);
    R(ctx, K.dirt, 0, G, W, H - G); R(ctx, K.grass, 0, G, W, 4);
    panel(ctx, 40, 24, 240, 150);
    S.drawTextCentered(ctx, S.TEXT.title.name, W / 2, 31, K.sammy, 3, K.black);
    S.drawTextCentered(ctx, S.TEXT.title.hunter, W / 2, 50, K.heart, 4, K.black);
    S.drawTextCentered(ctx, '(WORKING TITLE)', W / 2, 73, K.grey);
    S.drawTextCentered(ctx, S.TEXT.title.tag1, W / 2, 83, K.white);
    S.drawTextCentered(ctx, S.TEXT.title.tag2, W / 2, 91, K.lamp);
    S.drawTextCentered(ctx, S.TEXT.title.level, W / 2, 103, K.umbrella);
    const t = S.TEXT[S.touchActive ? 'touch' : 'keys'];
    S.drawTextCentered(ctx, t.title1, W / 2, 116, K.white);
    S.drawTextCentered(ctx, t.title2, W / 2, 124, K.white);
    if (Math.floor((s.titleT || 0) * 2) % 2 === 0) S.drawTextCentered(ctx, t.start, W / 2, 142, K.nose, 1);
    const r = S.assetReport;
    S.drawTextCentered(ctx, 'REAL ART LOADED: ' + r.loaded.length + ' OF ' + r.expected + ' FILES', W / 2, 160, K.grey);
    if (r.warnings.length) S.drawTextCentered(ctx, 'ART WARNINGS: ' + r.warnings.length + ' - SEE CONSOLE', W / 2, 167, K.heart);
    watermark(ctx);
  }

  function drawClear(ctx, s) {
    panel(ctx, 60, 40, 200, 136);
    S.drawTextCentered(ctx, 'LEVEL CLEAR!', W / 2, 50, K.umbrella, 2, K.black);
    const st = s.stats, k = Math.min(1, s.clearT / 1.2); // count-up tally
    const secs = Math.floor(st.time);
    const rows = [
      ['TIME', Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0')],
      ['ZOMBIES DEFEATED', Math.round(st.defeated * k)],
      ['HOT DOGS EATEN', Math.round(st.hotdogs * k)],
      ['HITS TAKEN', Math.round(st.hits * k)],
      ['K.O.S', Math.round(st.kos * k)],
    ];
    rows.forEach((r, i) => { S.drawText(ctx, r[0], 76, 76 + i * 12, K.white); S.drawText(ctx, String(r[1]), 220, 76 + i * 12, K.umbrella); });
    if (s.clearT > 1.5 && Math.floor(s.clearT * 2) % 2 === 0) S.drawTextCentered(ctx, S.TEXT[S.touchActive ? 'touch' : 'keys'].again, W / 2, 152, K.nose);
    S.drawTextCentered(ctx, S.TEXT.quips.clear, W / 2, 66, K.white);
    S.drawTextCentered(ctx, S.TEXT.quips.end, W / 2, 164, K.grey);
  }

  S.render = function (ctx, s) {
    ctx.imageSmoothingEnabled = false;
    if (s.mode === 'title') { drawTitle(ctx, s); return; }
    const camX = Math.round(s.cam.x);
    ctx.save();
    if (s.shake > 0) ctx.translate(Math.round(Math.sin(s.t * 90) * 2), 0);
    drawBackground(ctx, camX);
    ctx.translate(-camX, 0);
    drawGround(ctx, s, camX - 16, camX + W + 16);
    drawStatic(ctx, s);
    for (const c of s.carts) if (c.x + 80 > camX && c.x - 16 < camX + W) drawCart(ctx, c, s.t);
    for (const pk of s.pickups) if (pk.x > camX - 16 && pk.x < camX + W + 16) drawPickup(ctx, pk, s.t);
    for (const e of s.enemies) {
      if (e.x < camX - 64 || e.x > camX + W + 64) continue;
      if (e.state === 'dead') continue;
      if (e.type === 'vendor') drawVendor(ctx, e); else drawJogger(ctx, e);
    }
    for (const pr of s.projectiles) drawProjectile(ctx, pr);
    drawSammy(ctx, s);
    drawEffects(ctx, s);
    ctx.restore();
    drawHud(ctx, s);
    if (s.mode === 'paused') {
      // With touch buttons held sideways, the box also holds the RESTART and MUTE buttons (layout.js menuPanel).
      const mp = S.touchActive && S.touchMenuPanel;
      if (mp) panel(ctx, mp.x0, mp.y0, mp.x1 - mp.x0, mp.y1 - mp.y0); else panel(ctx, 100, 80, 120, 50);
      S.drawTextCentered(ctx, 'PAUSED', W / 2, 88, K.white, 2, K.black);
      S.drawTextCentered(ctx, S.TEXT.quips.paused, W / 2, 102, K.lamp);
      S.drawTextCentered(ctx, S.TEXT[S.touchActive ? 'touch' : 'keys'].paused, W / 2, 112, K.grey);
    }
    if (s.mode === 'clear') drawClear(ctx, s);
    if (s.muted) { if (S.touchActive) S.drawText(ctx, 'MUTED', W - 26, 6, K.grey); else S.drawText(ctx, 'MUTED', 4, H - 7, K.grey); }
    watermark(ctx);
  };
})(globalThis.SAMMY = globalThis.SAMMY || {});
