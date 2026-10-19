// A simple autopilot used only by tests (Node tests and the in-browser ?test= check).
// It runs right, jumps over obstacles and gaps, and tail-whips anything in front of it.
// It proves the level can be finished; it is not a good player.
(function (S) {
  S.makeBot = function () { return { frame: 0, lastX: 0, stall: 0, jumpHold: 0 }; };

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

    // In the arena, walk toward the nearest zombie.
    if (s.arena.state === 'fight') {
      let best = null;
      for (const e of alive) if (!best || Math.abs(e.x - p.x) < Math.abs(best.x - p.x)) best = e;
      if (best) dir = Math.abs(best.x - p.x) < 18 ? 0 : Math.sign(best.x - p.x);
      else dir = 0;
    }

    // Whip zombies and the cart when they are just in front.
    const front = (x) => (x - p.x) * p.face > -4 && Math.abs(x - p.x) < 34;
    let whip = alive.some((e) => front(e.x) && Math.abs(e.y - p.y) < 30);
    for (const c of s.carts) if ((c.state === 'upright' || c.state === 'rocking') && front(c.x + 8)) whip = true;
    if (alive.some((e) => Math.abs(e.x - p.x) < 34 && Math.abs(e.y - p.y) < 30 && Math.sign(e.x - p.x) !== p.face && dir === 0)) {
      dir = -p.face; // turn to face a zombie behind us
    }
    // Outside the arena: stop and fight a zombie that is close ahead instead of running into it.
    if (s.arena.state !== 'fight' && alive.some((e) => (e.x - p.x) * dir > 0 && Math.abs(e.x - p.x) < 40 && Math.abs(e.y - p.y) < 30)) dir = 0;
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
})(globalThis.SAMMY = globalThis.SAMMY || {});
