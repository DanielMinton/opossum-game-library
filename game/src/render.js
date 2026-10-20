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

  // ---------- gore setting (drawing only: the game rules never read it) ----------
  // 'full' = red blood, guts, cut-in-half zombies. 'low' = grey puffs and dust, nobody gets cut in half on screen.
  // Set by ?gore=low, the G key or the GORE button in the touch pause menu; remembered in the browser (main.js).
  S.GORE_KEY = 'sammy.gore';
  S.gore = 'full';
  S.setGore = function (v) { S.gore = v === 'low' ? 'low' : 'full'; return S.gore; };
  // storage: localStorage or anything with getItem/setItem. Private windows and blocked storage throw; that's fine.
  S.readGorePref = function (storage) {
    try { return storage && storage.getItem(S.GORE_KEY) === 'low' ? 'low' : 'full'; } catch (e) { return 'full'; }
  };
  S.writeGorePref = function (storage, v) {
    if (!storage) return false;
    try { storage.setItem(S.GORE_KEY, v === 'low' ? 'low' : 'full'); return true; } catch (e) { return false; }
  };
  // ?gore=low or ?gore=full wins over the remembered choice.
  S.pickGore = function (query, stored) { return query === 'low' || query === 'full' ? query : stored === 'low' ? 'low' : 'full'; };
  // Gore colours: the reserved gore keys of S.PAL (one set, STYLE_GUIDE "Reserved colours"). Low gore never draws any of them.
  const GORE = { blood: K.blood, bloodDark: K.blood0, bloodHi: K.bloodHi, ichor: K.ichor, ichorDark: K.ichor0, bone: K.bone, meat: K.meat };
  S.GORE_COLORS = GORE;
  const LOWPUFF = ['#d8d8d8', '#909090'];
  const gravity = 300; // px/s² for flying bits (looks only)
  S.spriteDraws = {};
  S.flashDraws = {};

  // ---------- background (parallax) ----------
  // Band rows, scroll speeds and loop widths come from the bg:* entries in assets.js.
  const BG = {};
  for (const m of S.ASSET_MANIFEST) if (m.key.startsWith('bg:')) BG[m.key] = m;
  function drawBackground(ctx, camX) {
    if (!sprite(ctx, 'bg:sky', 0, 0, BG['bg:sky'].y, 1)) {
      // Night sky: flat bands, a checkerboard dither row at each seam, stars, and a dithered full moon (light from the top-left).
      // Bands top to bottom; the last two are a thin haze just above the building tops, not a wide dusk glow.
      const bands = [[K.sky0, 0], [K.sky1, 32], [K.sky2, 66], [K.sky3, 108], [K.sky4, 120]];
      bands.forEach(([c, y], i) => R(ctx, c, 0, y, W, (bands[i + 1] ? bands[i + 1][1] : H) - y));
      for (let i = 1; i < bands.length; i++) dither(ctx, bands[i - 1][0], 0, bands[i][1], W, 2);
      for (let i = 0; i < 46; i++) {
        const sx = Math.floor(rnd(i + 401) * W), sy = 18 + Math.floor(rnd(i + 733) * 70);
        R(ctx, K.star, sx, sy, 1, 1);
        if (rnd(i + 57) > 0.85) { R(ctx, K.sky2, sx - 1, sy, 1, 1); R(ctx, K.sky2, sx + 1, sy, 1, 1); R(ctx, K.sky2, sx, sy - 1, 1, 1); R(ctx, K.sky2, sx, sy + 1, 1, 1); }
      }
      drawMoon(ctx, 52, 50, 13);
    }
    // Placeholder bands are drawn in scenery.js (cached canvases of the real bands' size), so they stay inside their rows like real art.
    tiled(ctx, 'bg:skyline', camX);
    tiled(ctx, 'bg:treeline', camX);
    tiled(ctx, 'bg:bushes', camX);
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
  function tiled(ctx, key, camX) {
    const b = BG[key], m = S.images[key], placeholder = m ? null : S.sceneryBand && S.sceneryBand(key);
    const off = -((camX * b.scroll) % b.fw);
    for (let ox = off; ox < W; ox += b.fw) {
      if (m) ctx.drawImage(m.img, Math.round(ox), b.y);
      else if (placeholder) ctx.drawImage(placeholder, Math.round(ox), b.y);
    }
  }

  // ---------- world ----------
  // The last screen (the gauntlet arena) is Bethesda Terrace: flagstones instead of grass and earth.
  // Ground, paths, puddles and lamp light come from scenery.js (real 'scenery:ground-*' art when it exists).
  function drawGround(ctx, s, x0, x1) {
    const A = s.level.arena;
    for (const g of s.level.ground) {
      const a = Math.max(g.x0, x0), b = Math.min(g.x1, Math.min(x1, A.x0));
      if (a < b) S.drawGroundRun(ctx, 'park', a, b);
      const sa = Math.max(g.x0, x0, A.x0), sb = Math.min(g.x1, x1);
      if (sa < sb) S.drawGroundRun(ctx, 'terrace', sa, sb);
    }
    S.drawGroundDecor(ctx, s, x0, x1);
    for (const w of s.level.water) {
      R(ctx, K.water, w.x0, w.y, w.x1 - w.x0, H - w.y);
      R(ctx, K.waterMid, w.x0, w.y, w.x1 - w.x0, 1);
      const ph = Math.floor(s.t * 4) % 2;
      for (let x = w.x0 + ph * 4; x < w.x1 - 4; x += 8) R(ctx, K.waterHi, x, w.y + 2 + ((x / 8) % 2) * 6, 4, 1);
    }
  }

  function drawStatic(ctx, s) {
    const A = s.level.arena;
    // Trees, the terrace, rocks, fences, benches, lamps: scenery.js. The solids and platforms they sit on are in level.js.
    S.drawScenery(ctx, s, 'back', camNow);
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
    } else if (pk.type === 'chainsaw') {
      if (sprite(ctx, 'pickup:chainsaw', pk.t, pk.x, pk.y, 1)) return;
      const x = Math.round(pk.x), y = Math.round(pk.y);
      R(ctx, K.black, x - 15, y - 11, 31, 10);                 // outline
      R(ctx, K.hotdog, x - 14, y - 10, 11, 8);                 // engine
      R(ctx, K.dark, x - 12, y - 13, 7, 3);                    // handle
      R(ctx, K.grey, x - 3, y - 8, 18, 4);                     // bar
      for (let i = 0; i < 4; i++) R(ctx, K.white, x - 1 + i * 4, y - 9, 2, 1); // teeth
      if (Math.floor(pk.t * 3) % 2 === 0) R(ctx, K.white, x + 10, y - 7, 2, 1); // glint
    }
  }

  // Enemies and Sammy: real sprite or placeholder first, then the state marks (?, !, gag text…) on top of either.
  // How a zombie goes down: e.defeatStyle from the rules ('pop' jogger, 'deflate' vendor, 'sliced' by the chainsaw).
  const defeated = (e) => e.state === 'defeat' || e.state === 'dead';
  const styleOf = (e) => e.defeatStyle || (e.type === 'vendor' ? 'deflate' : 'pop');
  const hashId = (id) => { let h = 0; for (const ch of String(id || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
  // Deadpan one-liners over a zombie as it goes down. Picked from its id, so the same zombie always says the same thing.
  const GAGS = {
    pop: ['POP.', 'BOINK.', 'NOPE.'],
    deflate: ['PFFFT.', 'SAD HISS.', 'FFFFFT.'],
    sliced: ['RIIIP.', 'WELL, SHIT.', 'HALVSIES.', 'FUCK ME.'],
    low: ['SHHK.', 'WELL, SHIT.', 'DONE.'],
  };
  // Gags drawn this frame (reset in S.render), so several kills at once stack instead of printing over each other.
  let gagsShown = [], camNow = 0;
  function gag(ctx, e, style, y) {
    if (e.t > 0.6) return;
    const list = GAGS[style === 'sliced' && S.gore === 'low' ? 'low' : style] || GAGS.pop;
    const txt = list[hashId(e.id) % list.length], w = S.textWidth(txt);
    // Keep the whole word on screen, even for a kill right at the arena wall.
    const cx = Math.round(Math.max(camNow + w / 2 + 2, Math.min(camNow + W - w / 2 - 2, e.x)));
    let ty = y - Math.round(e.t * 12);
    for (let bumped = true; bumped;) {
      bumped = false;
      for (const g of gagsShown) if (Math.abs(g.x - cx) < 40 + (g.w + w) / 2 && Math.abs(g.y - ty) < 8) { ty = g.y - 8; bumped = true; }
    }
    gagsShown.push({ x: cx, y: ty, w });
    const red = style === 'sliced' && S.gore !== 'low';
    if (red) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]]) S.drawTextCentered(ctx, txt, cx + dx, ty + dy, K.black); // full outline: readable over blood
    S.drawTextCentered(ctx, txt, cx, ty, red ? K.heart : K.white, 1, red ? null : K.black);
  }
  // Chainsaw kill: the standing pose cut at the waist. Full gore: the top half slides off and falls, red cut faces and
  // drips. Low gore: no split; the whole zombie sinks into the ground in a grey puff.
  function drawSliced(ctx, e, drawPose, height) {
    const x = Math.round(e.x), y = Math.round(e.y), t = e.t, f = -(e.sliceDir || -(e.face || 1));
    const cut = y - Math.round(height * 0.5);
    if (S.gore === 'low') {
      const sink = Math.min(height, Math.round(t * height * 2.2));
      ctx.save(); ctx.beginPath(); ctx.rect(x - 40, y - 80, 80, 80); ctx.clip();
      ctx.translate(0, sink); drawPose(); ctx.restore();
      for (let i = -2; i <= 2; i++) R(ctx, LOWPUFF[i & 1], x + i * (5 + t * 12) - 2, y - 4 - t * 10 - (i & 1) * 3, 4, 4);
      return;
    }
    // Bottom half stays a moment, then buckles.
    const buckle = Math.round(Math.max(0, t - 0.25) * 40);
    ctx.save(); ctx.beginPath(); ctx.rect(x - 40, cut, 80, y - cut); ctx.clip();
    ctx.translate(0, buckle); drawPose(); ctx.restore();
    R(ctx, GORE.blood, x - 8, cut + buckle, 16, 2);
    // Top half: slides back off the cut, then falls.
    const dx = Math.round(-f * (t * 40)), top = Math.min(Math.round(Math.max(0, t - 0.1) ** 2 * gravity), y - cut - 4);
    ctx.save(); ctx.beginPath(); ctx.rect(x - 40 + dx, cut - 80 + top, 80, 80); ctx.clip();
    ctx.translate(dx, top); drawPose(); ctx.restore();
    R(ctx, GORE.bloodHi, x - 8 + dx, cut - 2 + top, 16, 2);
    // Drips from the bottom half's cut face.
    for (let i = 0; i < 4; i++) {
      const dl = Math.min(y - cut - buckle - 2, Math.round(t * 30 + rnd(i + 3) * 6));
      if (dl > 0) R(ctx, i & 1 ? GORE.bloodDark : GORE.blood, x - 6 + i * 4, cut + buckle + 2, 1, dl);
    }
    // Spreading pool.
    const pool = Math.min(26, Math.round(t * 50));
    R(ctx, GORE.bloodDark, x - pool / 2, y - 1, pool, 2);
  }

  function drawJogger(ctx, e) {
    const flash = e.state === 'hitreact', style = styleOf(e), x = Math.round(e.x), y = Math.round(e.y);
    if (defeated(e) && style === 'sliced') {
      drawSliced(ctx, e, () => { if (!sprite(ctx, 'jogger:hit', 0, e.x, e.y, e.face, false, 0)) drawJoggerPlaceholder(ctx, e, false, true); }, 38);
    } else if (!sprite(ctx, 'jogger:' + e.anim, e.animT, e.x, e.y, e.face, false, null, flash)) drawJoggerPlaceholder(ctx, e, flash);
    if (defeated(e)) gag(ctx, e, style, y - 56);
    if (e.state === 'confused') S.drawTextCentered(ctx, '?', x, y - 50, K.white, 2, K.black);
    if (e.state === 'spawn') S.drawTextCentered(ctx, '!', x, y - 50, K.heart, 2, K.black);
  }

  // standing: draw the upright pose even while defeated (the chainsaw cut uses it).
  function drawJoggerPlaceholder(ctx, e, flash, standing) {
    const x = Math.round(e.x), y = Math.round(e.y), f = e.face;
    if (!standing && defeated(e)) {
      // Placeholder comedy: the head pops off and bounces away, the body sinks into a pile of sweatsuit.
      const t = e.t;
      const sink = Math.min(1, t / 0.5);
      R(ctx, K.jogger, x - 9, y - 30 * (1 - sink) - 8, 18, 30 * (1 - sink) + 8);
      R(ctx, K.band, x - 10, y - 4, 20, 4);
      const hx = x - f * t * 70, hy = y - 40 - Math.abs(Math.sin(t * 9)) * 24 * (1 - t);
      R(ctx, K.jogger, hx - 4, hy - 8, 8, 8); R(ctx, K.band, hx - 4, hy - 7, 8, 2);
      // Full gore: the neck stump squirts for a moment.
      if (S.gore !== 'low' && t < 0.4) {
        const ny = y - 30 * (1 - sink) - 8;
        R(ctx, GORE.blood, x - 2, ny - 4 - t * 10, 4, 4); R(ctx, GORE.bloodHi, x - 1, ny - 8 - t * 30, 2, 3);
      }
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
    const flash = e.state === 'hitreact', style = styleOf(e), x = Math.round(e.x), y = Math.round(e.y);
    if (defeated(e) && style === 'sliced') {
      drawSliced(ctx, e, () => { if (!sprite(ctx, 'vendor:hit', 0, e.x, e.y, e.face, false, 0)) drawVendorPlaceholder(ctx, e, false, true); }, 36);
    } else if (!sprite(ctx, 'vendor:' + e.anim, e.animT, e.x, e.y, e.face, false, null, flash)) drawVendorPlaceholder(ctx, e, flash);
    if (e.state === 'shrug') S.drawTextCentered(ctx, '?', x, y - 50, K.white, 2, K.black);
    if (defeated(e)) gag(ctx, e, style, y - 48);
  }

  function drawVendorPlaceholder(ctx, e, flash, standing) {
    const x = Math.round(e.x), y = Math.round(e.y), f = e.face;
    let hgt = 36;
    if (!standing && defeated(e)) hgt = Math.max(6, 36 * (1 - e.t / C.vendor.defeatTime)); // deflates like a balloon
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
    const sawArt = anim.startsWith('chainsaw-');
    // Trash lid: held in front normally; with the chainsaw it is slung on his back (drawn first) so it never hides the saw.
    const lidOn = p.shield > 0 && p.state !== 'playdead' && p.state !== 'ko';
    const drawLid = () => {
      const ox = p.x + p.face * (p.saw ? -8 : 12), oy = p.y - 14;
      if (!sprite(ctx, 'overlay:lid', 0, ox, oy, p.face, false, 3 - p.shield)) {
        R(ctx, K.lid, ox - 3, oy - 7, 6, 14); R(ctx, K.lidHi, ox - 1, oy - 5, 2, 4 - (3 - p.shield));
      }
    };
    if (lidOn && p.saw) drawLid();
    let real = sprite(ctx, 'sammy:' + anim, p.anim === 'get-up' ? p.animT * 2 : p.animT, p.x, p.y, p.face, p.anim === 'get-up', null, flash);
    // No chainsaw strip yet: plain Sammy (idle or run art, or the placeholder) holding a placeholder saw.
    if (!real && sawArt) real = sprite(ctx, anim === 'chainsaw-run' ? 'sammy:run' : 'sammy:idle', p.animT, p.x, p.y, p.face, false, null, flash);
    if (!real) drawSammyPlaceholder(ctx, s, flash);
    const lying = p.state === 'playdead' || p.state === 'getup' || p.state === 'ko';
    if (p.saw && !lying && !(sawArt && S.images['sammy:' + anim])) drawSawPlaceholder(ctx, p, s.t);
    const x = Math.round(p.x), y = Math.round(p.y);
    if (p.state === 'playdead') S.drawTextCentered(ctx, 'Z z', x, y - 26, K.white, 1, K.black);
    if (p.state === 'ko') S.drawTextCentered(ctx, '* * *', x, y - 24 - Math.round(Math.sin(p.t * 8) * 2), K.umbrella, 1, K.black);
    if (lidOn && !p.saw) drawLid();
  }

  // Placeholder chainsaw in Sammy's paws: engine, handle, 16 px bar reaching 28 px in front (the cutting reach).
  // Revving: it shudders and the teeth run.
  function drawSawPlaceholder(ctx, p, t) {
    const x = Math.round(p.x), f = p.face, rev = p.saw.revving;
    const y = Math.round(p.y) + (rev ? Math.floor(t * 30) % 2 : 0);
    const at = (a, w) => (f > 0 ? x + a : x - a - w); // a px in front of the feet point, w wide
    R(ctx, K.black, at(1, 28), y - 21, 28, 10);
    R(ctx, K.hotdog, at(2, 10), y - 20, 10, 8);
    R(ctx, K.dark, at(4, 6), y - 23, 6, 3);
    R(ctx, K.grey, at(12, 16), y - 18, 16, 4);
    const run = rev ? Math.floor(t * 40) % 4 : 0;
    for (let i = 0; i < 4; i++) { R(ctx, K.white, at(12 + ((i * 4 + run) % 16), 2), y - 19, 2, 1); R(ctx, K.white, at(12 + ((i * 4 + 16 - run) % 16), 2), y - 14, 2, 1); }
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

  // Two passes: layer 'back' (gore, dust, splashes) goes under Sammy so it never hides him; 'front' (sparks, words) on top.
  const FRONT = new Set(['spark', 'sparkle', 'bang', 'text', 'sparks']);
  function drawEffects(ctx, s, layer) {
    for (const f of s.effects) {
      if (layer && FRONT.has(f.kind) !== (layer === 'front')) continue;
      const k = f.t / f.life;
      if (f.kind === 'spark') { R(ctx, K.white, f.x - 1, f.y - 5, 2, 10); R(ctx, K.white, f.x - 5, f.y - 1, 10, 2); }
      else if (f.kind === 'dust') { for (let i = -1; i <= 1; i++) R(ctx, K.grey, f.x + i * (6 + k * 10) - 2, f.y - 4 - k * 4, 4, 4); }
      else if (f.kind === 'splat') { if (!sprite(ctx, 'effect:splat', f.t, f.x, f.y, 1)) { R(ctx, K.mustard, f.x - 5 - k * 4, f.y - 2, 10 + k * 8, 3); R(ctx, K.hotdog, f.x - 2, f.y - 4, 4, 2); } }
      else if (f.kind === 'splash') { for (let i = -2; i <= 2; i++) R(ctx, K.waterHi, f.x + i * 6, f.y - 14 * (1 - k) - Math.abs(i) * 2, 2, 4); }
      else if (f.kind === 'sparkle') { R(ctx, K.mustard, f.x - 1, f.y - 8 - k * 8, 2, 2); R(ctx, K.white, f.x + 5, f.y - 4 - k * 8, 2, 2); R(ctx, K.white, f.x - 6, f.y - 3 - k * 8, 2, 2); }
      else if (f.kind === 'bang') S.drawTextCentered(ctx, '!', f.x, f.y, K.heart, 2, K.black);
      else if (f.kind === 'text') {
        // Keep the whole line on screen (e.g. "OUT OF GAS. SHIT." when Sammy stands at the left fence).
        const tw = S.textWidth(f.text), tx = Math.max(camNow + tw / 2 + 2, Math.min(camNow + W - tw / 2 - 2, f.x));
        S.drawTextCentered(ctx, f.text, Math.round(tx), Math.round(f.y - k * 10), K.white, 1, K.black);
      }
      else if (f.kind === 'blood') drawBits(ctx, f, f.n || 6, f.dir || 1, f.power || 1, [GORE.blood, GORE.bloodHi, GORE.bloodDark]);
      else if (f.kind === 'ichor') drawBits(ctx, f, f.n || 5, f.dir || 0, 0.6, [GORE.ichor, GORE.ichorDark]);
      else if (f.kind === 'chunk') drawChunks(ctx, f);
      else if (f.kind === 'sparks') drawSparks(ctx, f);
    }
  }
  // Droplets thrown from a hit, worked out from the effect's age alone (no stored state), landing as flat smears.
  // Low gore: a few grey puffs drifting up instead.
  function drawBits(ctx, f, n, dir, power, cols) {
    const seed = Math.round(f.x * 3 + f.y * 7), t = f.t;
    if (S.gore === 'low') {
      if (f.t / f.life > 0.7) return;
      for (let i = 0; i < Math.min(3, Math.ceil(n / 3)); i++) R(ctx, LOWPUFF[i & 1], f.x + (i - 1) * 5 + dir * t * 20 - 2, f.y - 3 - t * 16 - rnd(seed + i) * 4, 3, 3);
      return;
    }
    for (let i = 0; i < n; i++) {
      const a = rnd(seed + i * 13), b = rnd(seed + i * 29 + 5);
      const d = dir || (a < 0.5 ? -1 : 1);
      const vx = d * (25 + a * 95) * power, vy = -(40 + b * 110) * power;
      const x = f.x + vx * t, y = f.y + vy * t + gravity * t * t;
      if (y >= G - 1) R(ctx, cols[2] || cols[1], x - 2, G - 1, 4 + (i % 3), 1); // landed: a smear on the path
      else R(ctx, cols[i % cols.length], x, y, i % 3 ? 2 : 3, i % 3 ? 2 : 3);
    }
  }
  // Chainsaw kill: lumps of zombie and a bit of bone tumble out in the saw's direction, bouncing once.
  // Low gore: a dust cloud.
  function drawChunks(ctx, f) {
    const t = f.t, dir = f.dir || 1, seed = Math.round(f.x * 5);
    if (S.gore === 'low') { for (let i = -1; i <= 1; i++) R(ctx, K.grey, f.x + i * (6 + t * 20) - 3, f.y - 6 - t * 12, 6, 5); return; }
    for (let i = 0; i < 4; i++) {
      const a = rnd(seed + i * 17), vx = dir * (40 + a * 80), vy = -(90 + rnd(seed + i * 31) * 90);
      let y = f.y + vy * t + gravity * t * t;
      const x = f.x + vx * t;
      if (y > G - 3) y = G - 3 - Math.abs(Math.sin(t * 12)) * 6 * Math.max(0, 1 - t * 2);
      const col = i === 3 ? GORE.bone : i === 2 ? K.jogger : GORE.meat;
      R(ctx, col, x - 2, y - 2, i === 3 ? 4 : 5, i === 3 ? 2 : 4);
      R(ctx, GORE.bloodDark, x - 2, y + 1, 2, 1);
      R(ctx, GORE.blood, x - dir * 4, y, 2, 1); // trail
    }
  }
  // The saw biting: hot sparks spraying from the blade (same in both gore settings).
  function drawSparks(ctx, f) {
    const t = f.t, dir = f.dir || 1, seed = Math.round(f.x * 11 + f.y);
    for (let i = 0; i < 5; i++) {
      const a = rnd(seed + i * 7), b = rnd(seed + i * 19);
      const x = f.x + dir * (10 + a * 50) * t * 3, y = f.y - b * 40 * t * 3 + gravity * t * t;
      R(ctx, i & 1 ? K.mustard : K.white, x, y, i & 1 ? 2 : 1, 1);
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
    // hearts 4-29 | lid icon 34-49, pips 52-61 | PP 66-79, cooldown bar 82-101 | chainsaw icon 104-119, fuel 122-145
    // | zombies 150 | time 200 | wave 240.
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
    // Chainsaw: icon and fuel gauge while carried; the gauge goes red and blinks when nearly empty.
    if (p.saw) {
      if (!sprite(ctx, 'hud:chainsaw', 0, 104, 0, 1)) { R(ctx, K.hotdog, 105, 5, 7, 6); R(ctx, K.dark, 106, 3, 4, 2); R(ctx, K.grey, 112, 7, 7, 3); }
      const frac = Math.max(0, Math.min(1, p.saw.fuel / C.chainsaw.fuel));
      const low = frac < 0.25;
      R(ctx, K.dark, 122, 7, 24, 3);
      if (!low || Math.floor(s.t * 6) % 2 === 0) R(ctx, low ? K.heart : K.hotdog, 122, 7, Math.ceil(24 * frac), 3);
    }
    S.drawText(ctx, 'ZOMBIES ' + s.stats.defeated, 150, 6, K.white);
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
      title1: 'ARROWS/WASD MOVE  Z JUMP  X WHIP  C PLAY POSSUM', title2: 'ENTER PAUSE   R RESTART   M MUTE   G GORE',
      start: 'PRESS ENTER OR Z TO START', again: 'PRESS ENTER TO PLAY AGAIN', paused: 'ENTER TO RESUME  R RESTART',
    },
    touch: {
      title1: 'BUTTONS: MOVE, JUMP, WHIP, PLAY POSSUM', title2: 'PAUSE BUTTON: RESTART, MUTE, GORE',
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
    S.drawGroundRun(ctx, 'park', 0, W);
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
    // Screen shake (cart crash, chainsaw kill): bigger the more shake is left. Hitstop (the rules freeze for a few
    // frames on a chainsaw kill) adds a hard one-pixel judder so the freeze reads as impact, not a stall.
    const shake = s.shake || 0, hitstop = s.hitstop || 0;
    if (shake > 0 || hitstop > 0) {
      const amp = Math.min(4, 2 + shake * 6);
      const dx = shake > 0 ? Math.round(Math.sin(s.t * 90) * amp) : 0, dy = shake > 0 ? Math.round(Math.cos(s.t * 77) * amp * 0.5) : 0;
      ctx.translate(dx + (hitstop > 0 ? (Math.floor(hitstop * 120) & 1 ? 1 : -1) : 0), dy);
    }
    drawBackground(ctx, camX);
    ctx.translate(-camX, 0);
    camNow = camX; gagsShown = [];
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
    drawEffects(ctx, s, 'back');
    drawSammy(ctx, s);
    drawEffects(ctx, s, 'front');
    S.drawScenery(ctx, s, 'front', camX);              // drifting leaves, in front of everyone
    ctx.restore();
    drawHud(ctx, s);
    if (s.mode === 'paused') {
      // With touch buttons held sideways, the box also holds the RESTART and MUTE buttons (layout.js menuPanel).
      const mp = S.touchActive && S.touchMenuPanel;
      if (mp) panel(ctx, mp.x0, mp.y0, mp.x1 - mp.x0, mp.y1 - mp.y0); else panel(ctx, 100, 80, 120, 50);
      S.drawTextCentered(ctx, 'PAUSED', W / 2, 88, K.white, 2, K.black);
      S.drawTextCentered(ctx, S.TEXT.quips.paused, W / 2, 102, K.lamp);
      S.drawTextCentered(ctx, S.TEXT[S.touchActive ? 'touch' : 'keys'].paused, W / 2, 112, K.grey);
      if (!S.touchActive) S.drawTextCentered(ctx, 'G: GORE ' + (S.gore === 'low' ? 'LOW' : 'FULL'), W / 2, 121, K.grey);
    }
    // A moment of feedback after G or the GORE button (main.js counts it down).
    if (S.goreNote > 0 && s.mode === 'playing') S.drawTextCentered(ctx, S.gore === 'low' ? 'GORE: LOW. FINE.' : 'GORE: FULL. HELL YES.', W / 2, H - 20, K.white, 1, K.black);
    if (s.mode === 'clear') drawClear(ctx, s);
    if (s.muted) { if (S.touchActive) S.drawText(ctx, 'MUTED', W - 26, 6, K.grey); else S.drawText(ctx, 'MUTED', 4, H - 7, K.grey); }
    watermark(ctx);
  };
})(globalThis.SAMMY = globalThis.SAMMY || {});
