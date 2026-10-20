// A simple autopilot used only by tests (Node tests and the in-browser ?test= check).
// It runs right, jumps over obstacles and gaps, and tail-whips anything in front of it.
// It proves the level can be finished; it is not a good player.
(function (S) {
  S.makeBot = function () { return { frame: 0, lastX: 0, stall: 0, jumpHold: 0, wait: 0 }; };

  S.botInput = function (s, b) {
    const inp = S.makeInput();
    b.frame += 1;
    if (s.mode === 'title' || s.mode === 'clear' || s.mode === 'paused') {
      if (b.frame % 2 === 0) inp.pressed.start = true;
      return inp;
    }
    const p = s.player;
    const alive = s.enemies.filter((e) => e.state !== 'defeat' && e.state !== 'dead');
    let dir = 1;

    // In the arena, walk toward the nearest zombie. Against the boss: grab the chainsaw the arena drops if he has none, then
    // fight him (S.botBoss: cut him in his openings, back off from his swipe, jump his shockwaves, lie flat under the high ones).
    const boss = s.arena.state === 'boss' ? alive.find((e) => e.boss) : null;
    if (boss) return S.botBoss(s, b, inp, boss);
    if (s.arena.state === 'fight' || s.arena.state === 'boss') {
      let best = null;
      for (const e of alive) if (!best || Math.abs(e.x - p.x) < Math.abs(best.x - p.x)) best = e;
      if (best) dir = Math.abs(best.x - p.x) < 18 ? 0 : Math.sign(best.x - p.x);
      else dir = 0;
    }

    // Whip zombies and the cart when they are just in front.
    const front = (x) => (x - p.x) * p.face > -4 && Math.abs(x - p.x) < 34;
    let whip = alive.some((e) => front(e.x) && Math.abs(e.y - p.y) < 30);
    for (const c of s.carts) if ((c.state === 'upright' || c.state === 'rocking') && front(c.x + 8)) whip = true;
    // Outside the arena: stop and fight a zombie that is close ahead instead of running into it, and stop for one right behind
    // that is coming for us (a leaper that just landed, a toddler that caught up). One that keeps its distance (a cheerleader
    // waiting to leap, or anything behind a fence) is not worth waiting for: after half a second, walk on.
    const travel = dir;
    if (s.arena.state !== 'fight' && alive.some((e) => (e.x - p.x) * dir > 0 && Math.abs(e.x - p.x) < 40 && Math.abs(e.y - p.y) < 30)) dir = 0;
    if (s.arena.state !== 'fight' && dir !== 0 && alive.some((e) => (e.x - p.x) * dir < 0 && Math.abs(e.x - p.x) < 28 && Math.abs(e.y - p.y) < 30 && (e.state === 'chase' || e.state === 'attack' || e.state === 'land'))) dir = 0;
    b.wait = dir === 0 && !whip && s.arena.state !== 'fight' ? b.wait + 1 : 0;
    if (b.wait > 30) dir = travel;
    // Standing still with a zombie behind us: turn to face it (one step that way flips the facing; then the whip takes it).
    if (alive.some((e) => Math.abs(e.x - p.x) < 34 && Math.abs(e.y - p.y) < 30 && Math.sign(e.x - p.x) !== p.face && dir === 0)) {
      dir = -p.face;
    }
    inp.held.right = dir > 0;
    inp.held.left = dir < 0;
    inp.pressed.attack = whip;
    inp.held.attack = whip;

    // Jump when stuck, at a ledge, or when a wall is just ahead.
    if (Math.abs(p.x - b.lastX) < 0.3 && dir !== 0) b.stall += 1; else b.stall = 0;
    b.lastX = p.x;
    let wallAhead = false;
    if (dir !== 0) {
      const probe = { x: p.x + dir * 12 - 2, y: p.y - 20, w: 4, h: 16 };
      for (const so of S.getSolids(s)) if (so.kind !== 'ground' && S.overlap(probe, so)) wallAhead = true;
    }
    const gapAhead = dir !== 0 && p.grounded && !S.isSupported(s, p.x + dir * 14, p.y);
    if (p.grounded && (b.stall > 12 || gapAhead || wallAhead)) { inp.pressed.jump = true; b.jumpHold = 24; b.stall = 0; }
    if (b.jumpHold > 0) { inp.held.jump = true; b.jumpHold -= 1; }
    return inp;
  };

  // The boss fight, by his state (the boss brain's state names, read off the enemy; no "is it the Brute?" checks).
  // Openings (swipe-open, slam-stuck, spin-dizzy, vomit-open, stagger, enrage, confused): get in, hit him, leave before it ends.
  // Otherwise keep well outside his swipe (so he slams, and the shockwaves can be jumped). Swipe tell: back off. Spin or vomit
  // tell: lie flat (Play Possum) when it is ready, else get out of range. Cornered: play dead, then walk through him while he is
  // confused or still looking around (touching him is harmless then), or through an opening. Picks up the chainsaw the arena
  // drops when Sammy has none. Hops acid puddles. With the saw it also cuts him from the edge whenever he walks onto the blade.
  S.botBoss = function (s, b, inp, e) {
    const p = s.player, A = s.level.arena, st = e.state, T = S.enemyType(e.type).cfg, K = S.CONFIG;
    const dx = e.x - p.x, ax = Math.abs(dx), toward = Math.sign(dx) || 1;
    const open = /-open$|-stuck$|-dizzy$/.test(st) || st === 'stagger' || st === 'enrage' || st === 'confused' || st === 'hitreact';
    const supply = s.pickups.find((pk) => pk.supply && !pk.collected && pk.type === 'chainsaw');
    const reach = (p.saw ? K.chainsaw.reach : 6 + K.sammy.whipW) + T.bodyW / 2 - 4; // standing this far away, the saw (or the whip) is on him
    // With the saw: just outside his swipe trigger, so he walks onto the blade and his openings are a step away.
    // Whip only: further out, so he slams (jumpable) more than he swipes; the whip fight is the long way round by design.
    const hover = T.swipe.range + (p.saw ? 8 : 32);
    // How long the opening has left: leave early enough to be out of reach when he swings again (the whip roots Sammy for a moment).
    const openLen = { 'swipe-open': T.swipe.opening, 'slam-stuck': T.slam.stuck, 'spin-dizzy': T.spin.dizzy, 'vomit-open': T.vomit.opening, stagger: T.staggerTime, enrage: T.enrageTime, confused: 3, hitreact: T.hitReactTime }[st] || 0;
    const left = openLen * (e.enraged && /-open$|-stuck$|-dizzy$/.test(st) && st !== 'vomit-open' ? T.enraged.openScale : 1) - e.t;
    const leave = p.saw ? 0.12 : K.sammy.attackTime + 0.02;
    const canPossum = p.state === 'normal' && p.grounded && p.possumCd <= 0;
    // Cornered (little floor behind Sammy): the way past him is through him while he is harmless.
    const roomBehind = toward > 0 ? p.x - (A.x0 + 18) : (A.gateX - 10) - p.x;
    const roomAhead = toward > 0 ? (A.gateX - 10) - e.x - T.bodyW / 2 : e.x - T.bodyW / 2 - (A.x0 + 18);
    const cornered = roomBehind < 50 && roomAhead > 120 && ax < 120;
    const passable = st === 'confused' || (st === 'walk' && e.ignoreT > 0) || (open && left >= 0.8);
    // Going through him is committed: keep the direction until Sammy is clear on the far side (or it stops being safe).
    if (b.passDir && (!(passable || open) || (Math.sign(dx) === -b.passDir && ax > T.bodyW / 2 + 40))) b.passDir = 0;
    let dir = 0, attack = false;
    if (!p.saw && supply && supply.landed) dir = Math.abs(supply.x - p.x) < 4 ? 0 : Math.sign(supply.x - p.x);
    else if (b.passDir) dir = b.passDir;
    else if (cornered && passable) { b.passDir = toward; dir = toward; }
    else if (cornered && st === 'walk' && canPossum && ax < 90) inp.pressed.possum = true;
    else if (open) {
      // Worth going in only if there is time to get there, hit, and get out again.
      const need = Math.max(0, ax - reach) / K.sammy.runSpeed + leave;
      if (left < leave || left < need) dir = -toward;
      else if (ax > reach) dir = toward;
      else if (ax < T.bodyW / 2 + 10) dir = -toward;
      else attack = true;
    }
    else if (st === 'defeat') dir = ax < 60 ? -toward : 0;
    else if (st === 'swipe-tell' || st === 'swipe-step' || st === 'swipe-hit') dir = ax < T.swipe.box.x1 + T.swipe.step + 20 ? -toward : 0;
    else if (st === 'spin-tell' || st === 'spin-hit' || st === 'vomit-tell' || st === 'vomit-stream') {
      const far = st.startsWith('spin') ? T.spin.range + 14 : T.vomit.box.x1 + 14;
      if (ax < far) { if (canPossum) inp.pressed.possum = true; else dir = -toward; }
    } else { // walking in, walking, or the slam: hold the hover distance; with the saw, cut from the edge when he comes onto the blade
      dir = ax > hover + 10 ? toward : ax < hover - 8 ? -toward : 0;
      if (p.saw && ax <= reach + 4) attack = true;
    }
    // Walls: don't push into them.
    if (dir < 0 && p.x <= A.x0 + 20) dir = 0;
    if (dir > 0 && p.x >= A.gateX - 12) dir = 0;
    // A jump keeps its direction until Sammy lands (otherwise he dithers in the air and comes down where he started).
    const inPuddle = (x) => s.hazards.some((h) => h.kind === 'puddle' && Math.abs(h.x - x) < h.w / 2 + 10);
    const hop = (d) => { inp.pressed.jump = true; b.jumpHold = 22; b.airDir = d; b.airHold = true; dir = d; };
    if (p.grounded) b.airHold = false;
    for (const h of s.hazards) {
      // A wave: jump on the spot unless the landing stays clear of him (a running jump covers about 80 px).
      if (h.kind === 'wave' && Math.sign(p.x - h.x) === h.dir && Math.abs(p.x - h.x) < 36 && p.grounded) hop(dir === toward && ax - 80 < T.bodyW / 2 + 12 ? 0 : dir);
      if (h.kind === 'puddle' && dir !== 0 && (h.x - p.x) * dir > 0 && Math.abs(h.x - p.x) < h.w / 2 + 18 && p.grounded && p.state === 'normal') hop(dir);
    }
    if (inPuddle(p.x) && p.grounded && p.state === 'normal') {
      const clear = (d) => { const lx = Math.max(A.x0 + 18, Math.min(A.gateX - 10, p.x + d * 80)); return !inPuddle(lx) && Math.abs(lx - e.x) > T.bodyW / 2 + 12; };
      hop(clear(-toward) ? -toward : toward);
    }
    if (!p.grounded && b.airHold) dir = b.airDir;
    if (p.state === 'playdead' && !(st === 'spin-tell' || st === 'spin-hit' || st === 'vomit-tell' || st === 'vomit-stream')) inp.pressed.jump = true; // it passed: get up
    if (b.jumpHold > 0) { inp.held.jump = true; b.jumpHold -= 1; }
    inp.held.right = dir > 0; inp.held.left = dir < 0;
    if (attack && p.face !== toward) { inp.held.right = toward > 0; inp.held.left = toward < 0; } // turn to face him first
    inp.pressed.attack = attack; inp.held.attack = attack;
    return inp;
  };
})(globalThis.SAMMY = globalThis.SAMMY || {});
