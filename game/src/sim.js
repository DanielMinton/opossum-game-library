// Game rules for the Sammy prototype. No drawing, no browser APIs: it runs the same in Node tests.
// One call to SAMMY.update(state, input) advances the game by one fixed 1/60 s step.
// Sounds and music are requested by pushing { type, id } objects onto state.events.
(function (S) {
  const C = S.CONFIG;
  const P = C.sammy;
  const DT = C.step;
  const G = C.groundY;

  // ---------- small helpers ----------
  const sign = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function footBox(e, w, h) { return { x: e.x - w / 2, y: e.y - h, w, h }; }
  function playerBox(p) {
    const dead = p.state === 'playdead' || p.state === 'getup' || p.state === 'ko';
    return dead ? footBox(p, P.deadW, P.deadH) : footBox(p, P.bodyW, P.bodyH);
  }
  function setAnim(e, name) { if (e.anim !== name) { e.anim = name; e.animT = 0; } }
  function sfx(s, id) { s.events.push({ type: 'sfx', id }); }
  function music(s, id) { s.events.push({ type: 'music', id }); }
  function effect(s, kind, x, y, life, extra) {
    s.effects.push(Object.assign({ kind, x, y, t: 0, life }, extra || {}));
  }
  // Looping sound (the chainsaw's rev): one event when it starts, one when it stops, never every frame.
  function sawLoop(s, on) {
    if (!!s.sawLoop === on) return;
    s.sawLoop = on;
    s.events.push({ type: 'sfx-loop', id: 'sfx-chainsaw-rev', on });
  }

  S.makeInput = function () {
    return {
      held: { left: false, right: false, up: false, down: false, jump: false, attack: false, possum: false },
      pressed: { left: false, right: false, jump: false, attack: false, possum: false, start: false, restart: false },
    };
  };

  // ---------- creating things ----------
  function makePlayer(x, y) {
    return {
      x, y, vx: 0, vy: 0, face: 1, grounded: true, groundKind: 'ground',
      hp: P.maxHp, shield: 0, state: 'normal', t: 0, invuln: 0,
      coyote: 0, buffer: 0, landT: 0, possumCd: 0, possumFlash: 0, hitSet: null,
      saw: null, // chainsaw while carried: { fuel (seconds), revving, tick (s to next cut), slash (s of tap-rev left) }
      anim: 'idle', animT: 0,
    };
  }
  // ---------- enemy types ----------
  // S.ENEMY_TYPES: type name -> { name, cfg, brain, update, states, anims }. One row per type, built from every config.js block
  // that has a `brain`. Nothing else in this file asks "is it a jogger?": every difference between types is a field of its
  // config block (see config.js, "enemy types") read through typeOf(e). An enemy whose type has no row is an error, never a jogger.
  const BRAINS = {
    // brain: { update(s, e), states: every state the brain can put an enemy in (the render sweep draws each), anims: state -> animation,
    //   resume: the state it goes back to when Sammy gets up after Play Possum,
    //   confusable (optional): the only states Play Possum can interrupt (default: anything but attack and hitreact) }
    walker: { update: (s, e) => updateWalker(s, e), states: ['spawn', 'patrol', 'chase', 'attack', 'hitreact', 'confused', 'defeat', 'dead'], resume: 'patrol',
      anims: { spawn: 'idle', patrol: 'walk', chase: 'walk', attack: 'attack', hitreact: 'hit', confused: 'idle', defeat: 'defeat', dead: 'defeat' } },
    turret: { update: (s, e) => updateTurret(s, e), states: ['idle', 'throw', 'hitreact', 'shrug', 'defeat', 'dead'], resume: 'idle',
      anims: { idle: 'idle', shrug: 'idle', throw: 'throw', hitreact: 'hit', defeat: 'defeat', dead: 'defeat' } },
    // The boss (the Brute): one state per pose, so each attack is tell -> hit -> opening with its own picture. The animation names are
    // the combined strips the art comes in (swipe = tell, step, 3 hits, opening in one strip); the drawer picks the frame from the state.
    boss: { update: (s, e) => updateBoss(s, e), resume: 'walk', confusable: ['walk', 'enter'],
      states: ['enter', 'walk', 'swipe-tell', 'swipe-step', 'swipe-hit', 'swipe-open', 'slam-tell', 'slam-hit', 'slam-stuck',
        'spin-tell', 'spin-hit', 'spin-dizzy', 'vomit-tell', 'vomit-stream', 'vomit-open', 'stagger', 'enrage', 'confused', 'hitreact', 'defeat', 'dead'],
      anims: { enter: 'walk', walk: 'walk', 'swipe-tell': 'swipe', 'swipe-step': 'swipe', 'swipe-hit': 'swipe', 'swipe-open': 'swipe',
        'slam-tell': 'slam', 'slam-hit': 'slam', 'slam-stuck': 'slam', 'spin-tell': 'spin', 'spin-hit': 'spin', 'spin-dizzy': 'spin',
        'vomit-tell': 'spin', 'vomit-stream': 'vomit', 'vomit-open': 'vomit', stagger: 'stagger', enrage: 'stagger', confused: 'walk',
        hitreact: 'walk', defeat: 'death', dead: 'death' } },
  };
  // Boss states in which touching him hurts (walking, winding up, swinging). Openings, stuck, dizzy, confused, staggering: safe.
  const BOSS_TOUCH_HURTS = new Set(['enter', 'walk', 'swipe-tell', 'swipe-step', 'swipe-hit', 'slam-tell', 'slam-hit', 'spin-tell', 'spin-hit', 'vomit-tell', 'vomit-stream']);
  S.BOSS_TOUCH_HURTS = BOSS_TOUCH_HURTS;
  const TYPE_FIELDS = ['brain', 'art', 'start', 'startAnim', 'hp', 'bodyW', 'bodyH', 'hitReactTime', 'defeatTime', 'flinch', 'knockback',
    'sawKnockback', 'cartKnock', 'shieldPush', 'hitY', 'possum', 'possumIgnore', 'defeatStyle', 'sawStyle'];
  const POSSUM_KINDS = ['confused', 'shrug'];
  S.ENEMY_TYPES = {};
  S.ENEMY_TYPE_FIELDS = TYPE_FIELDS;
  // Registers (or replaces) an enemy type from a config block. Throws on a missing field or an unknown brain, so a half-written
  // type fails at load, not in the middle of a level. Tests use it for stub types.
  S.defineEnemyType = function (name, cfg) {
    for (const f of TYPE_FIELDS) if (cfg[f] === undefined) throw new Error('enemy type "' + name + '" is missing "' + f + '" in config.js');
    const brain = BRAINS[cfg.brain];
    if (!brain) throw new Error('enemy type "' + name + '" has unknown brain "' + cfg.brain + '" (known: ' + Object.keys(BRAINS).join(', ') + ')');
    if (!brain.states.includes(cfg.start)) throw new Error('enemy type "' + name + '" starts in "' + cfg.start + '", which its brain has no state for');
    if (!POSSUM_KINDS.includes(cfg.possum)) throw new Error('enemy type "' + name + '" has unknown possum reaction "' + cfg.possum + '"');
    if (!brain.states.includes(cfg.possum)) throw new Error('enemy type "' + name + '" reacts to Play Possum with "' + cfg.possum + '", which its brain has no state for');
    const T = { name, cfg, brain: cfg.brain, update: brain.update, states: brain.states, anims: brain.anims, resume: brain.resume, confusable: brain.confusable || null };
    S.ENEMY_TYPES[name] = T;
    return T;
  };
  S.enemyType = function (name) {
    const T = S.ENEMY_TYPES[name];
    if (!T) throw new Error('unknown enemy type "' + name + '" (known: ' + Object.keys(S.ENEMY_TYPES).join(', ') + ')');
    return T;
  };
  const typeOf = (e) => S.enemyType(e.type);
  for (const name of Object.keys(C)) if (C[name] && typeof C[name] === 'object' && C[name].brain) S.defineEnemyType(name, C[name]);

  function makeEnemy(def, idx, extra) {
    const T = typeOf(def), k = T.cfg;
    return Object.assign({
      id: (extra && extra.id) || ('e' + idx), type: def.type, def,
      x: def.x, y: def.y != null ? def.y : G, vx: 0, vy: 0, face: -1, dir: -1,
      grounded: true, hp: k.hp, state: k.start, t: 0,
      home: def.x, cd: 0, lostT: 0, throwT: 0.5, released: false, attackHit: false,
      confused: false, arena: false, anim: k.startAnim, animT: 0,
      defeatStyle: k.defeatStyle, // how it goes down; k.sawStyle ('sliced') when the chainsaw does it
    }, extra || {});
  }
  S.makeEnemy = makeEnemy; // for the render sweep and tests (a boss is only made by the arena)
  function makeCart(def, idx) {
    return { id: 'cart' + idx, def, x: def.x, state: 'upright', t: 0, anim: 'upright', animT: 0, spill: [] };
  }
  function makePickup(def, idx) {
    return { id: 'pk' + idx, type: def.type, def, x: def.x, y: def.y, vx: 0, vy: 0,
      collected: false, spilled: false, landed: true, life: 0, t: 0 };
  }

  S.newGame = function (level) {
    const s = { level: level || S.LEVEL1, mode: 'title', t: 0, events: [], effects: [], god: false };
    resetLevel(s);
    return s;
  };

  function resetLevel(s) {
    const L = s.level;
    s.player = makePlayer(L.start.x, L.start.y);
    s.enemies = L.enemies.map((d, i) => makeEnemy(d, i));
    s.carts = L.carts.map((d, i) => makeCart(d, i));
    s.pickups = L.pickups.map((d, i) => makePickup(d, i));
    s.projectiles = [];
    s.hazards = []; // floor hazards from the boss: shockwaves (kind 'wave') and acid puddles (kind 'puddle')
    s.effects = [];
    s.cps = L.checkpoints.map((c) => ({ id: c.id, x: c.x, active: false }));
    s.checkpoint = { id: 'START', x: L.start.x };
    s.arena = { state: 'idle', wave: -1, timer: 0, spawnCount: 0 };
    s.cam = { x: 0 };
    s.stats = { time: 0, defeated: 0, hotdogs: 0, hits: 0, kos: 0 };
    s.lastSafeX = L.start.x;
    s.shake = 0;
    s.hitstop = 0; // seconds of freeze-frame after a chainsaw kill (effects keep playing)
    sawLoop(s, false);
    s.clearT = 0;
    s.nextId = 1000;
  }
  S.resetLevel = resetLevel;

  // ---------- world collision ----------
  function arenaLocked(s) { return s.arena.state === 'fight' || s.arena.state === 'boss' || s.arena.state === 'open'; }

  function getSolids(s) {
    const L = s.level;
    const out = [];
    for (const g of L.ground) out.push({ kind: 'ground', x: g.x0, y: G, w: g.x1 - g.x0, h: 64 });
    for (const b of L.solids) out.push(b);
    out.push({ kind: 'wall', x: -16, y: -400, w: 16, h: 700 });
    out.push({ kind: 'wall', x: L.width, y: -400, w: 16, h: 700 });
    for (const c of s.carts) {
      const b = cartBody(c);
      if (b) out.push(b);
    }
    const A = L.arena;
    if (arenaLocked(s)) out.push({ kind: 'arena-wall', x: A.x0, y: -400, w: 8, h: 600 });
    if (s.arena.state !== 'open') out.push({ kind: 'gate', x: A.gateX, y: -400, w: A.gateW, h: 400 + G });
    return out;
  }
  function getPlatforms(s) {
    const out = s.level.platforms.slice();
    for (const c of s.carts) if (c.state === 'upright') out.push({ kind: 'umbrella', x: c.x, y: G - C.cart.h, w: C.cart.w });
    return out;
  }
  function cartBody(c) {
    if (c.state === 'upright' || c.state === 'rocking') return { kind: 'cart', x: c.x + 4, y: G - 28, w: 56, h: 28 };
    if (c.state === 'tipped' || c.state === 'empty') return { kind: 'cart', x: c.x - 8, y: G - 16, w: 80, h: 16 };
    return null; // tipping: no collision while falling
  }

  // Is there ground or a platform directly under the point (x, y)?
  function isSupported(s, x, y) {
    for (const b of getSolids(s)) if (x > b.x && x < b.x + b.w && y + 1 > b.y && y + 1 < b.y + b.h && Math.abs(b.y - y) < 2) return true;
    for (const p of getPlatforms(s)) if (x > p.x && x < p.x + p.w && Math.abs(p.y - y) < 2) return true;
    return false;
  }
  S.isSupported = isSupported;

  // Move a body (feet at e.x, e.y) with gravity and collide with the world.
  function moveBody(s, e, w, h) {
    const solids = getSolids(s);
    e.blocked = false;
    // horizontal
    e.x += e.vx * DT;
    let box = footBox(e, w, h);
    for (const b of solids) {
      if (!overlap(box, b)) continue;
      if (b.kind === 'ground' && box.y + box.h - b.y < 4) continue;
      const mid = b.x + b.w / 2;
      if (e.x < mid) e.x = b.x - w / 2; else e.x = b.x + b.w + w / 2;
      e.vx = 0; e.blocked = true;
      box = footBox(e, w, h);
    }
    // vertical
    const wasGrounded = e.grounded;
    e.vy = Math.min(e.vy + C.gravity * DT, C.maxFall);
    const prevY = e.y;
    e.y += e.vy * DT;
    e.grounded = false;
    box = footBox(e, w, h);
    for (const b of solids) {
      if (!overlap(box, b)) continue;
      if (e.vy >= 0 && prevY <= b.y + 4) { e.y = b.y; e.grounded = true; e.groundKind = b.kind; }
      else if (e.vy < 0) { e.y = b.y + b.h + h; }
      e.vy = 0;
      box = footBox(e, w, h);
    }
    if (e.vy >= 0 && !e.grounded) {
      for (const p of getPlatforms(s)) {
        if (prevY <= p.y + 0.01 && e.y >= p.y && e.x + w / 2 > p.x && e.x - w / 2 < p.x + p.w) {
          e.y = p.y; e.vy = 0; e.grounded = true; e.groundKind = p.kind;
        }
      }
    }
    return wasGrounded;
  }

  // ---------- damage ----------
  function hurtPlayer(s, opts) {
    const p = s.player;
    if (p.state === 'ko' || s.mode !== 'playing') return false;
    if (s.god) return false;
    if (p.invuln > 0) return false;
    if (!opts.hazard && p.shield > 0) {
      p.shield -= 1;
      p.invuln = 0.3;
      sfx(s, p.shield > 0 ? 'sfx-shield-block' : 'sfx-shield-break');
      effect(s, 'spark', p.x + p.face * 10, p.y - 18, 0.2);
      if (opts.source) { const push = typeOf(opts.source).cfg.shieldPush; if (push) opts.source.x += sign(opts.source.x - p.x) * push; }
      return 'blocked';
    }
    if (p.state === 'playdead' || p.state === 'getup') p.possumCd = C.possum.cooldown;
    p.hp -= 1;
    s.stats.hits += 1;
    sfx(s, 'sfx-hurt');
    releaseConfused(s);
    if (p.hp <= 0) {
      p.hp = 0; p.state = 'ko'; p.t = 0; p.vx = 0; p.shield = 0;
      s.stats.kos += 1;
      sawLoop(s, false);
      sfx(s, 'sfx-ko');
      music(s, 'stop');
      return 'ko';
    }
    p.state = 'hurt'; p.t = 0; p.invuln = P.invulnTime;
    if (!opts.hazard) {
      const dir = opts.fromX != null ? (sign(p.x - opts.fromX) || -p.face) : -p.face;
      p.vx = dir * (opts.knockX || P.hurtKnockX); p.vy = -(opts.knockY || P.hurtKnockY); p.grounded = false; // knockX/knockY: a bigger hit (the Brute's swipe)
    }
    return 'hurt';
  }
  S.hurtPlayer = hurtPlayer;

  // opts.source: 'whip' (default), 'chainsaw' or 'cart'. Gore is effect data only; render.js decides how much to show.
  function damageEnemy(s, e, fromX, opts) {
    if (e.state === 'defeat' || e.state === 'dead') return;
    const k = typeOf(e).cfg;
    const saw = !!opts && opts.source === 'chainsaw';
    const dir = sign(e.x - fromX) || 1;
    e.hp -= saw ? C.chainsaw.damage : 1;
    e.hitT = 0.25; // just hit (the boss bar's portrait winces this long)
    if (!saw) { sfx(s, 'sfx-hit-zombie'); effect(s, 'spark', e.x, e.y - 24, 0.15); }
    // Chainsaw gore starts past the blade tip and flies away from Sammy, so it never covers him.
    const gx = saw ? fromX + dir * Math.max(Math.abs(e.x - fromX), C.chainsaw.reach + 12) : e.x;
    const big = saw && k.sawHitstop; // gore overload (owner answer 7): a boss throws the most blood and chunks on every cut, with hit-stop and shake
    effect(s, 'blood', gx, e.y - 24, 0.6, { n: big ? 14 : saw ? 8 : 4, dir, power: big ? 2.5 : saw ? 2 : 1 });
    if (k.sawHitstop) sfx(s, 'sfx-boss-hit');
    if (big) {
      for (let i = 0; i < k.sawChunks; i++) effect(s, 'chunk', gx, e.y - 36 + i * 10, 0.9, { dir, i });
      s.hitstop = Math.max(s.hitstop || 0, k.sawHitstop);
      s.shake = Math.max(s.shake, 0.15);
    }
    if (e.hp <= 0) {
      e.state = 'defeat'; e.t = 0; e.vx = 0; e.confused = false;
      e.defeatStyle = saw ? k.sawStyle : k.defeatStyle;
      e.sliceDir = dir; // the cut top half slides this way (away from Sammy)
      s.stats.defeated += 1;
      sfx(s, 'sfx-zombie-defeat-comedic');
      sfx(s, 'sfx-gore-splat');
      effect(s, 'ichor', gx, e.y - (saw ? 22 : 36), 0.8, { n: saw ? 10 : 6 });
      if (saw) {
        for (let i = 0; i < 3; i++) effect(s, 'chunk', gx, e.y - 30 + i * 8, 0.9, { dir, i });
        s.hitstop = Math.max(s.hitstop || 0, 0.06);
        s.shake = Math.max(s.shake, 0.25);
      }
      return;
    }
    // flinch: false (the big ones, the bosses): the hit flashes it white for hitReactTime and changes nothing else; it keeps coming.
    if (!k.flinch) { e.flashT = k.hitReactTime; return; }
    e.state = 'hitreact'; e.t = 0;
    e.vx = dir * (saw ? k.sawKnockback : k.knockback);
  }

  function releaseConfused(s) {
    for (const e of s.enemies) {
      if (!e.confused) continue;
      e.confused = false;
      if (e.state === 'confused') { e.state = typeOf(e).resume; e.home = e.x; e.t = 0; }
      e.ignoreT = typeOf(e).cfg.possumIgnore; // lost interest: won't re-notice Sammy straight away
      if (e.state === 'shrug') { e.state = 'idle'; e.t = 0; }
    }
  }

  // ---------- player ----------
  function anyPressed(inp) {
    const q = inp.pressed;
    return q.jump || q.attack || q.possum || q.left || q.right;
  }

  function startPossum(s) {
    const p = s.player;
    p.state = 'playdead'; p.t = 0; p.vx = 0;
    sfx(s, 'sfx-play-dead');
    for (const e of s.enemies) {
      if (e.state === 'defeat' || e.state === 'dead') continue;
      if (Math.abs(e.x - p.x) <= C.possum.radius && Math.abs(e.y - p.y) < 48) {
        e.confused = true;
        const T = typeOf(e), how = T.cfg.possum;
        // An attack already started still finishes (its brain then goes to 'confused' because e.confused is set).
        const free = T.confusable ? T.confusable.includes(e.state) : (e.state !== 'attack' && e.state !== 'hitreact');
        if (how === 'confused' && free) { e.state = 'confused'; e.t = 0; e.vx = 0; }
        if (how === 'shrug' && e.state !== 'hitreact') { e.state = 'shrug'; e.t = 0; }
      }
    }
  }

  function updatePlayer(s, inp) {
    const p = s.player;
    p.invuln = Math.max(0, p.invuln - DT);
    const cdBefore = p.possumCd;
    p.possumCd = Math.max(0, p.possumCd - DT);
    p.possumFlash = Math.max(0, p.possumFlash - DT);
    if (cdBefore > 0 && p.possumCd === 0) p.possumFlash = C.possum.readyFlash; // HUD icon flashes: ready again
    p.landT = Math.max(0, p.landT - DT);
    p.t += DT;

    if (p.state === 'ko') {
      p.vx = 0;
      moveBody(s, p, P.deadW, P.deadH);
      if (p.t >= P.koTime + P.koWait) respawn(s);
      return;
    }

    const h = inp.held;
    if (inp.pressed.jump) p.buffer = P.jumpBuffer; else p.buffer = Math.max(0, p.buffer - DT);

    if (p.state === 'hurt' && p.t >= P.hurtTime) { p.state = 'normal'; p.t = 0; }
    if (p.state === 'playdead') {
      p.vx = 0;
      if (p.t >= C.possum.maxTime || (p.t >= C.possum.minTime && anyPressed(inp))) { p.state = 'getup'; p.t = 0; p.buffer = 0; }
    } else if (p.state === 'getup') {
      p.vx = 0;
      if (p.t >= C.possum.getUpTime) { p.state = 'normal'; p.t = 0; p.possumCd = C.possum.cooldown; releaseConfused(s); }
    }

    const canControl = p.state === 'normal' || p.state === 'attack';
    if (p.saw) updateSaw(s, p, inp, canControl);
    if (canControl) {
      const dir = (h.right ? 1 : 0) - (h.left ? 1 : 0);
      const slow = (p.state === 'attack' && p.grounded ? 0.3 : 1) * (p.saw && p.saw.revving ? C.chainsaw.slow : 1);
      const target = dir * P.runSpeed * slow;
      const rate = dir !== 0 ? P.accel : P.decel;
      if (p.vx < target) p.vx = Math.min(target, p.vx + rate * DT);
      else if (p.vx > target) p.vx = Math.max(target, p.vx - rate * DT);
      if (dir !== 0 && p.state !== 'attack') p.face = dir;

      if (p.buffer > 0 && (p.grounded || p.coyote > 0)) {
        p.vy = -P.jumpSpeed; p.grounded = false; p.coyote = 0; p.buffer = 0;
        sfx(s, 'sfx-jump');
      }
      if (!h.jump && p.vy < -P.jumpCutSpeed) p.vy = -P.jumpCutSpeed;

      if (inp.pressed.attack && p.state === 'normal' && !p.saw) { // with the chainsaw, the same button revs it instead
        p.state = 'attack'; p.t = 0; p.hitSet = new Set();
        sfx(s, 'sfx-tail-whip');
      } else if (inp.pressed.possum && p.state === 'normal' && p.grounded && p.possumCd <= 0) {
        startPossum(s);
      }
    } else if (p.state === 'hurt') {
      p.vx *= 0.92;
    }

    if (p.state === 'attack') {
      if (p.t >= P.attackHitStart && p.t < P.attackHitEnd) whipHits(s);
      if (p.t >= P.attackTime) { p.state = 'normal'; p.t = 0; }
    }

    const fallSpeed = p.vy;
    const box = playerBox(p);
    const wasGrounded = moveBody(s, p, box.w, box.h);
    if (!wasGrounded && p.grounded && fallSpeed > 150) { p.landT = P.landTime; sfx(s, 'sfx-land'); effect(s, 'dust', p.x, p.y, 0.2); }
    p.coyote = p.grounded ? P.coyoteTime : Math.max(0, p.coyote - DT);

    // Can't walk back off the left of the screen (no backtracking past the camera).
    const minX = s.cam.x + 8;
    if (p.x < minX) { p.x = minX; if (p.vx < 0) p.vx = 0; }

    // Remember the last safe spot on solid ground: not within 24 px of the pond or the edge of a pit.
    if (p.grounded && p.groundKind === 'ground' && isSupported(s, p.x, p.y)) {
      const L = s.level;
      let nearHole = false;
      for (const w of L.water) if (p.x > w.x0 - 24 && p.x < w.x1 + 24) nearHole = true;
      for (const g of L.ground) {
        if (g.x0 > 0 && Math.abs(p.x - g.x0) < 24) nearHole = true;
        if (g.x1 < L.width && Math.abs(p.x - g.x1) < 24) nearHole = true;
      }
      if (!nearHole) s.lastSafeX = p.x;
    }
    // Pond water (splash) or falling out of the world (no splash). Both cost a heart.
    let pond = null;
    for (const w of s.level.water) if (p.x > w.x0 && p.x < w.x1 && p.y >= w.y) pond = w;
    if (pond || p.y > 260) {
      if (pond) { sfx(s, 'sfx-splash'); effect(s, 'splash', clamp(p.x, pond.x0, pond.x1), pond.y, 0.4); }
      const result = hurtPlayer(s, { hazard: true });
      if (result !== 'ko') {
        p.x = s.lastSafeX; p.y = G; p.vx = 0; p.vy = 0; p.grounded = true; p.groundKind = 'ground';
        if (p.state === 'normal' || p.state === 'hurt') { p.state = 'hurt'; p.t = 0; }
        p.invuln = Math.max(p.invuln, P.invulnTime);
      } else {
        p.y = G; p.x = s.lastSafeX;
      }
    }
  }

  function whipHits(s) {
    const p = s.player;
    const r = { x: p.face > 0 ? p.x + 6 : p.x - 6 - P.whipW, y: p.y - 22, w: P.whipW, h: P.whipH };
    s.lastWhip = r;
    for (const e of s.enemies) {
      if (e.state === 'defeat' || e.state === 'dead' || p.hitSet.has(e.id)) continue;
      const k = typeOf(e).cfg;
      if (overlap(r, footBox(e, k.bodyW, k.bodyH))) { p.hitSet.add(e.id); damageEnemy(s, e, p.x, { source: 'whip' }); }
    }
    for (const c of s.carts) {
      if (p.hitSet.has(c.id)) continue;
      if (overlap(r, { x: c.x, y: G - C.cart.h, w: C.cart.w, h: C.cart.h })) { p.hitSet.add(c.id); hitCart(s, c); }
    }
  }

  // ---------- chainsaw ----------
  // Holding the attack button revs it (a tap revs for slashTime). Revving burns 1 fuel per second, carrying it burns
  // carryDrain. While revving it cuts whatever is in reach every `tick` seconds. Empty tank: it's gone, back to the whip.
  function updateSaw(s, p, inp, canControl) {
    const K = C.chainsaw, w = p.saw;
    w.slash = Math.max(0, (w.slash || 0) - DT);
    if (canControl && inp.pressed.attack) w.slash = K.slashTime;
    const rev = canControl && (inp.held.attack || w.slash > 0) && w.fuel > 0;
    if (rev && !w.revving) w.tick = 0; // first cut straight away
    w.revving = rev;
    w.fuel = Math.max(0, w.fuel - (rev ? 1 : K.carryDrain) * DT);
    if (rev) {
      w.tick -= DT;
      if (w.tick <= 0) { w.tick += K.tick; sawCut(s, p); }
    }
    if (w.fuel <= 0) {
      p.saw = null;
      effect(s, 'text', p.x, p.y - 44, 1.2, { text: 'OUT OF GAS. SHIT.' });
    }
    sawLoop(s, !!(p.saw && p.saw.revving));
  }

  function sawCut(s, p) {
    const K = C.chainsaw;
    const r = { x: p.face > 0 ? p.x : p.x - K.reach, y: p.y - 24, w: K.reach, h: 18 };
    s.lastSaw = r;
    let cut = false;
    for (const e of s.enemies) {
      if (e.state === 'defeat' || e.state === 'dead' || e.state === 'spawn') continue;
      const k = typeOf(e).cfg;
      if (overlap(r, footBox(e, k.bodyW, k.bodyH))) { damageEnemy(s, e, p.x, { source: 'chainsaw' }); cut = true; }
    }
    for (const c of s.carts) {
      if ((c.state === 'upright' || c.state === 'rocking') && overlap(r, { x: c.x, y: G - C.cart.h, w: C.cart.w, h: C.cart.h })) { hitCart(s, c); cut = true; }
    }
    if (cut) {
      sfx(s, 'sfx-chainsaw-cut');
      effect(s, 'sparks', p.x + p.face * Math.round(K.reach * 0.7), p.y - 16, 0.15, { dir: p.face });
    }
  }

  function respawn(s) {
    const cp = s.checkpoint;
    const L = s.level;
    s.player = makePlayer(cp.x, G);
    s.player.invuln = 1.0;
    s.enemies = s.enemies.filter((e) => !e.arena && e.def.x <= cp.x);
    L.enemies.forEach((d, i) => { if (d.x > cp.x) s.enemies.push(makeEnemy(d, i)); });
    s.carts = s.carts.map((c, i) => (c.def.x > cp.x ? makeCart(c.def, i) : c));
    s.pickups = s.pickups.filter((pk) => !pk.spilled);
    for (const pk of s.pickups) if (pk.def.x > cp.x) pk.collected = false;
    s.projectiles = [];
    s.hazards = [];
    s.arena = { state: 'idle', wave: -1, timer: 0, spawnCount: 0 };
    s.lastSafeX = cp.x;
    s.cam.x = clamp(cp.x - 64, 0, L.width - C.screenW);
    music(s, 'level');
    s.events.push({ type: 'respawn', id: cp.id });
  }

  // ---------- enemies ----------
  function playerHidden(p) { return p.state === 'playdead' || p.state === 'getup'; }

  // The "walker" brain (jogger, hippie, sweater, cheerleader, baby): patrol near home, notice Sammy, chase, lunge, reel, go down.
  // Every number comes from the type's config block (J); the type's hooks are its flags (flinch, possum, knockback…).
  function updateWalker(s, e) {
    const J = typeOf(e).cfg;
    const p = s.player;
    e.t += DT; e.cd = Math.max(0, e.cd - DT); e.ignoreT = Math.max(0, (e.ignoreT || 0) - DT);
    const dx = p.x - e.x, dy = p.y - e.y;
    const canNotice = p.state !== 'ko' && !playerHidden(p) && e.ignoreT <= 0 && Math.abs(dx) <= J.notice && Math.abs(dy) < 40;
    const aheadSupported = () => !e.grounded || isSupported(s, e.x + e.face * (J.bodyW / 2 + 2), e.y);

    switch (e.state) {
      case 'patrol': {
        e.face = e.dir;
        e.vx = e.dir * J.patrolSpeed;
        if ((e.x <= e.home - J.patrolRange && e.dir < 0) || (e.x >= e.home + J.patrolRange && e.dir > 0) || !aheadSupported() || e.blocked) {
          e.dir = -e.dir; e.face = e.dir; e.vx = e.dir * J.patrolSpeed;
        }
        if (canNotice) { e.state = 'chase'; e.t = 0; e.lostT = 0; effect(s, 'bang', e.x, e.y - 44, 0.5); if (s.t - (s.groanT || -9) > 1.5) { s.groanT = s.t; sfx(s, 'sfx-zombie-groan'); } }
        break;
      }
      case 'chase': {
        if (p.state === 'ko') { e.state = 'patrol'; e.home = e.x; break; }
        if (Math.abs(dx) > 2) e.face = sign(dx);
        e.vx = Math.abs(dx) > J.attackRange - 6 ? e.face * J.chaseSpeed : 0;
        if (!aheadSupported()) e.vx = 0;
        if (Math.abs(dx) > J.giveUpDist && !e.arena) { e.lostT += DT; if (e.lostT > J.giveUpTime) { e.state = 'patrol'; e.home = e.x; } }
        else e.lostT = 0;
        if (Math.abs(dx) <= J.attackRange && Math.abs(dy) < 30 && e.cd <= 0) { e.state = 'attack'; e.t = 0; e.attackHit = false; e.vx = 0; }
        break;
      }
      case 'attack': {
        e.vx = 0;
        if (e.t >= J.attackHitStart && e.t < J.attackHitEnd && !e.attackHit) {
          const r = { x: e.face > 0 ? e.x + 4 : e.x - 4 - J.hitW, y: e.y - J.hitY, w: J.hitW, h: J.hitH };
          if (overlap(r, playerBox(p))) { e.attackHit = true; hurtPlayer(s, { fromX: e.x, source: e }); }
        }
        if (e.t >= J.attackTime) { e.state = e.confused ? 'confused' : 'chase'; e.t = 0; e.cd = J.attackCooldown; }
        break;
      }
      case 'hitreact': {
        e.vx *= 0.85;
        if (e.t >= J.hitReactTime) { e.state = e.confused ? 'confused' : 'chase'; e.t = 0; e.cd = Math.max(e.cd, 0.4); }
        break;
      }
      case 'spawn': e.vx = 0; if (e.grounded && e.t > 0.6) { e.state = 'chase'; e.t = 0; } break;
      case 'confused': e.vx = 0; break;
      case 'defeat': e.vx = 0; if (e.t >= J.defeatTime) e.state = 'dead'; break;
    }
    // Touching a zombie that is walking or attacking hurts (not while it reels back or is confused).
    if ((e.state === 'patrol' || e.state === 'chase' || e.state === 'attack') && overlap(footBox(e, J.bodyW, J.bodyH), playerBox(p))) {
      hurtPlayer(s, { fromX: e.x, source: e });
    }
    if (e.state !== 'dead') moveBody(s, e, J.bodyW, J.bodyH);
    if (e.y > 260) e.state = 'dead';
    setAnim(e, BRAINS.walker.anims[e.state]);
  }

  // The "turret" brain (the hot dog vendor): stands still, faces Sammy, throws when he is in range, shrugs at Play Possum.
  function updateTurret(s, e) {
    const V = typeOf(e).cfg;
    const p = s.player;
    e.t += DT;
    const dx = p.x - e.x;
    const inRange = Math.abs(dx) <= V.notice && p.state !== 'ko';
    switch (e.state) {
      case 'idle':
        if (inRange) e.face = sign(dx) || e.face;
        e.throwT -= DT;
        if (inRange && e.throwT <= 0) { e.state = 'throw'; e.t = 0; e.released = false; }
        break;
      case 'throw':
        if (e.t >= V.releaseAt && !e.released) { e.released = true; throwHotDog(s, e); }
        if (e.t >= V.throwTime) { e.state = e.confused ? 'shrug' : 'idle'; e.t = 0; e.throwT = V.throwEvery; }
        break;
      case 'hitreact':
        if (e.t >= V.hitReactTime) { e.state = e.confused ? 'shrug' : 'idle'; e.t = 0; e.throwT = Math.max(e.throwT, 0.8); }
        break;
      case 'shrug': break;
      case 'defeat': if (e.t >= V.defeatTime) e.state = 'dead'; break;
    }
    e.vx = 0;
    if (e.state !== 'dead') moveBody(s, e, V.bodyW, V.bodyH);
    setAnim(e, BRAINS.turret.anims[e.state]);
  }

  // The "boss" brain (the Brute): walks at Sammy and picks an attack by distance and a fixed count, never by chance. Every attack
  // is a tell (a held pose with its own sound), the hit, then an opening (a held pose: safe to touch, the time to hit him).
  // He never flinches; the chainsaw cuts him any time (owner answer 7). Half health = a stagger, enrageAt = the enrage roar: both free
  // openings. Play Possum confuses him until Sammy gets up (an attack already started finishes first), then he ignores Sammy for a moment.
  const TELL_SFX = { swipe: 'sfx-boss-grunt', slam: 'sfx-boss-chains', spin: 'sfx-boss-roar', vomit: 'sfx-boss-gurgle' };
  function updateBoss(s, e) {
    const B = typeOf(e).cfg, E = B.enraged, p = s.player, A = s.level.arena, L = B.lines || {};
    e.t += DT; e.slamCd = Math.max(0, (e.slamCd || 0) - DT); e.ignoreT = Math.max(0, (e.ignoreT || 0) - DT);
    const dx = p.x - e.x, enr = !!e.enraged;
    const tellOf = (t) => (enr ? t * E.tellScale : t);
    const openOf = (t) => (enr ? t * E.openScale : t);
    const go = (st) => { e.state = st; e.t = 0; e.vx = 0; e.attackHit = false; };
    // After an attack, an opening or a stagger: back to walking (deciding at once), or confused if Sammy played dead meanwhile.
    const resume = () => { if (e.confused) go('confused'); else { go('walk'); e.decideT = 0; } };
    // A hit box in front of him (x0..x1 ahead of his feet, y0..y1 up from the ground), or centred on him for both sides.
    const box = (b, both) => (both ? { x: e.x - b.x1, y: e.y - b.y1, w: 2 * b.x1, h: b.y1 - b.y0 }
      : { x: e.face > 0 ? e.x + b.x0 : e.x - b.x1, y: e.y - b.y1, w: b.x1 - b.x0, h: b.y1 - b.y0 });
    const strike = (r, extra) => {
      if (e.attackHit || !overlap(r, playerBox(p))) return;
      if (hurtPlayer(s, Object.assign({ fromX: e.x, source: e }, extra || {}))) e.attackHit = true;
    };
    const shockwaves = () => {
      const w = B.slam.wave;
      for (const dir of [-1, 1]) s.hazards.push({ kind: 'wave', x: e.x, dir, speed: w.speed, w: w.w, h: w.h, t: 0, life: w.life });
    };
    const puddles = () => {
      const life = enr ? E.puddleLife : B.vomit.puddleLife;
      for (const d of B.vomit.puddles) {
        const x = clamp(e.x + e.face * d, A.x0 + 8 + B.vomit.puddleW / 2, A.gateX - B.vomit.puddleW / 2);
        s.hazards.push({ kind: 'puddle', x, w: B.vomit.puddleW, t: 0, land: B.vomit.puddleLand, life });
      }
    };
    // Which attack now? Every Nth is a vomit; Sammy behind him = spin; close in front = swipe; mid range = slam (off cooldown, or
    // whenever he has walked too long without one); else keep walking.
    const pick = () => {
      const n = (e.attacks || 0) + 1, front = dx === 0 || sign(dx) === e.face, ax = Math.abs(dx);
      let a = null;
      if (n % (enr ? E.vomitEvery : B.vomit.every) === 0) a = 'vomit';
      else if (!front && ax <= B.spin.range) a = 'spin';
      else if (front && ax <= B.swipe.range) a = 'swipe';
      else if ((ax <= B.slam.range && e.slamCd <= 0) || e.walkT >= B.walkMax) a = 'slam';
      if (!a) return null;
      e.attacks = n; e.walkT = 0;
      if (a !== 'spin' && dx !== 0) e.face = sign(dx);
      e.tells = (e.tells || 0) + 1;
      if (L.taunts && L.taunts.length && e.tells % 3 === 0) effect(s, 'text', e.x, e.y - B.bodyH - 12, 1.0, { text: L.taunts[(e.tells / 3 - 1) % L.taunts.length] });
      go(a + '-tell'); sfx(s, TELL_SFX[a]);
      return a;
    };

    // Phase changes interrupt anything but his death and each other: half health = the stagger, enrageAt = the enrage roar.
    const busy = e.state === 'defeat' || e.state === 'dead' || e.state === 'stagger' || e.state === 'enrage';
    if (!busy && !e.staggered && e.hp <= B.staggerAt) { e.staggered = true; go('stagger'); sfx(s, 'sfx-boss-grunt'); }
    else if (!busy && !e.enraged && e.hp <= B.enrageAt) {
      e.enraged = true; go('enrage'); sfx(s, 'sfx-boss-roar'); s.shake = Math.max(s.shake, 0.4);
      if (L.enrage) effect(s, 'text', (A.x0 + A.x1) / 2, 60, 1.5, { text: L.enrage });
    }
    // The enraged slam's second pair of shockwaves follows the first after a gap.
    if (e.waveT > 0) { e.waveT -= DT; if (e.waveT <= 0) shockwaves(); }

    switch (e.state) {
      case 'enter': // out of the arch toward the camera, then a roar with his arms wide
        if (e.t < B.enterWalk) { e.face = -1; e.vx = -B.walkSpeed; }
        else { e.vx = 0; if (!e.roared) { e.roared = true; sfx(s, 'sfx-boss-roar'); s.shake = Math.max(s.shake, 0.3); } if (dx !== 0) e.face = sign(dx); }
        if (e.t >= B.enterWalk + B.enterRoar) resume();
        break;
      case 'walk': {
        if (e.ignoreT > 0 || p.state === 'ko') { e.vx = 0; e.decideT = 0; break; } // just fooled by Play Possum: looks around a moment
        e.walkT = (e.walkT || 0) + DT; e.decideT = (e.decideT || 0) - DT;
        if (e.decideT <= 0) { e.decideT = B.decideEvery; if (pick()) break; }
        if (Math.abs(dx) > 2) e.face = sign(dx);
        e.vx = Math.abs(dx) > B.bodyW / 2 ? e.face * (enr ? E.walkSpeed : B.walkSpeed) : 0;
        break;
      }
      case 'swipe-tell': if (e.t >= tellOf(B.swipe.tell)) { go('swipe-step'); e.vx = e.face * ((enr ? E.swipeStep : B.swipe.step) / B.swipe.stepTime); } break;
      case 'swipe-step': if (e.t >= B.swipe.stepTime) { go('swipe-hit'); sfx(s, 'sfx-boss-swipe'); } break;
      case 'swipe-hit': strike(box(B.swipe.box), { knockX: B.swipe.knockX, knockY: B.swipe.knockY }); if (e.t >= B.swipe.hits) go('swipe-open'); break;
      case 'swipe-open': if (e.t >= openOf(B.swipe.opening)) resume(); break;
      case 'slam-tell':
        if (e.t >= tellOf(B.slam.tell)) {
          go('slam-hit'); sfx(s, 'sfx-boss-slam'); s.shake = Math.max(s.shake, 0.3); effect(s, 'dust', e.x + e.face * 24, e.y, 0.3);
          shockwaves(); e.slamCd = enr ? E.slamCooldown : B.slam.cooldown; e.waveT = enr ? E.waveGap : 0;
        }
        break;
      case 'slam-hit': strike(box(B.slam.box)); if (e.t >= B.slam.hit) go('slam-stuck'); break;
      case 'slam-stuck': if (e.t >= openOf(B.slam.stuck)) resume(); break;
      case 'spin-tell': if (e.t >= tellOf(B.spin.tell)) { go('spin-hit'); sfx(s, 'sfx-boss-swipe'); } break;
      case 'spin-hit': strike(box(B.spin.box, true)); if (e.t >= B.spin.hits) go('spin-dizzy'); break;
      case 'spin-dizzy': if (e.t >= openOf(B.spin.dizzy)) resume(); break;
      case 'vomit-tell': if (e.t >= tellOf(B.vomit.tell)) { go('vomit-stream'); sfx(s, 'sfx-acid-spray'); } break;
      case 'vomit-stream': strike(box(B.vomit.box), { hazard: true }); if (e.t >= (enr ? E.vomitTime : B.vomit.time)) { go('vomit-open'); puddles(); } break;
      case 'vomit-open': if (e.t >= B.vomit.opening) resume(); break;
      case 'stagger': if (e.t >= B.staggerTime) resume(); break;
      case 'enrage': if (e.t >= B.enrageTime) resume(); break;
      case 'confused': e.vx = 0; break;
      case 'hitreact': if (e.t >= B.hitReactTime) resume(); break; // only the cart's tip puts him here; he shrugs it off
      case 'defeat': {
        // He drops, drags himself toward Sammy through the crawl frames, goes flat; then the hot dogs bounce out of him.
        if (!e.deathSfx) { e.deathSfx = true; sfx(s, 'sfx-boss-death'); s.shake = Math.max(s.shake, 0.5); }
        const crawl = e.t >= 1 / 6 && e.t < 8 / 6;
        if (crawl && dx !== 0) e.face = sign(dx);
        e.vx = crawl ? e.face * B.deathCrawlSpeed : 0;
        if (crawl && B.deathCrawlHurts && overlap(footBox(e, B.bodyW, B.bodyH / 2), playerBox(p))) hurtPlayer(s, { fromX: e.x, source: e });
        if (e.t >= B.defeatTime + 0.5 && !e.dropped) {
          e.dropped = true;
          const speeds = [60, 110, 160], dir = sign(dx) || -e.face;
          for (let i = 0; i < B.hotdogs; i++) {
            s.pickups.push({ id: 'hd' + (s.nextId++), type: 'hotdog', def: { x: e.x }, x: e.x, y: e.y - 20, vx: dir * speeds[i % speeds.length], vy: -220,
              collected: false, spilled: true, landed: false, life: 30, t: 0 });
          }
          effect(s, 'ichor', e.x, e.y - 20, 0.8, { n: 8 });
          sfx(s, 'sfx-gore-splat');
          if (L.hotdogs) effect(s, 'text', (A.x0 + A.x1) / 2, 60, 2.0, { text: L.hotdogs });
        }
        if (e.t >= B.defeatTime + B.deathHold) e.state = 'dead';
        break;
      }
    }
    // Touching him while he walks, winds up or swings hurts (not while he is open, stuck, dizzy, confused, staggering or dead).
    if (BOSS_TOUCH_HURTS.has(e.state) && !(e.state === 'walk' && e.ignoreT > 0) && overlap(footBox(e, B.bodyW, B.bodyH), playerBox(p))) {
      hurtPlayer(s, { fromX: e.x, source: e });
    }
    if (e.state !== 'dead') moveBody(s, e, B.bodyW, B.bodyH);
    setAnim(e, BRAINS.boss.anims[e.state]);
  }

  function throwHotDog(s, e) {
    const V = typeOf(e).cfg;
    const p = s.player;
    const x = e.x + e.face * 10, y = e.y - 28;
    const T = V.projFlight;
    const vx = clamp((p.x - x) / T, -150, 150);
    const vy = (p.y - 15 - y - 0.5 * V.projGravity * T * T) / T;
    // The projectile carries its own size and gravity, so any throwing type's numbers work (the vendor's today).
    s.projectiles.push({ id: 'pr' + (s.nextId++), x, y, vx, vy, life: V.projLife, t: 0, w: V.projW, h: V.projH, g: V.projGravity });
    sfx(s, 'sfx-throw');
  }

  function updateProjectiles(s) {
    const p = s.player;
    const solids = getSolids(s);
    for (const pr of s.projectiles) {
      pr.t += DT; pr.life -= DT;
      pr.vy += pr.g * DT;
      pr.x += pr.vx * DT; pr.y += pr.vy * DT;
      const box = { x: pr.x - pr.w / 2, y: pr.y - pr.h / 2, w: pr.w, h: pr.h };
      if (overlap(box, playerBox(p)) && p.state !== 'ko') {
        hurtPlayer(s, { fromX: pr.x });
        pr.dead = true; effect(s, 'splat', pr.x, pr.y, 0.27); sfx(s, 'sfx-splat');
        continue;
      }
      let hit = pr.life <= 0 || pr.y > 240;
      for (const b of solids) if (b.kind !== 'wall' && overlap(box, b)) hit = true;
      if (hit) { pr.dead = true; effect(s, 'splat', pr.x, Math.min(pr.y, G), 0.27); sfx(s, 'sfx-splat'); }
    }
    s.projectiles = s.projectiles.filter((pr) => !pr.dead);
  }

  // ---------- hot dog cart ----------
  function hitCart(s, c) {
    if (c.state === 'upright') { c.state = 'rocking'; c.t = 0; sfx(s, 'sfx-cart-rock'); }
    else if (c.state === 'rocking') {
      c.state = 'tipping'; c.t = 0; c.tipDir = sign(c.x + C.cart.w / 2 - s.player.x) || 1;
      sfx(s, 'sfx-cart-crash'); s.shake = 0.2;
    }
  }

  function updateCart(s, c) {
    const K = C.cart;
    c.t += DT;
    if (c.state === 'rocking' && c.t >= K.rockWindow) { c.state = 'upright'; c.t = 0; }
    if (c.state === 'tipping' && c.t >= K.tipTime) {
      c.state = 'tipped'; c.t = 0;
      const cx = c.x + K.w / 2;
      const speeds = [90, 130, 170]; // far enough to land clear of the tipped cart
      for (let i = 0; i < K.spillCount; i++) {
        const pk = { id: 'hd' + (s.nextId++), type: 'hotdog', def: { x: cx }, x: cx, y: G - 30,
          vx: c.tipDir * speeds[i], vy: -220, collected: false, spilled: true, landed: false, life: K.hotDogLife, t: 0 };
        s.pickups.push(pk); c.spill.push(pk.id);
      }
      effect(s, 'dust', cx, G, 0.3);
      for (const e of s.enemies) {
        if (e.state === 'defeat' || e.state === 'dead') continue;
        if (Math.abs(e.x - cx) <= K.knockRadius) {
          const knock = typeOf(e).cfg.cartKnock;
          e.state = 'hitreact'; e.t = 0;
          if (knock) e.vx = (sign(e.x - cx) || 1) * knock;
        }
      }
    }
    if (c.state === 'tipped') {
      const left = s.pickups.filter((pk) => c.spill.includes(pk.id) && !pk.collected);
      if (left.length === 0) { c.state = 'empty'; c.t = 0; }
    }
    setAnim(c, c.state === 'tipped' ? 'tipped-over' : c.state);
  }

  // ---------- pickups ----------
  function updatePickups(s) {
    const p = s.player;
    for (const pk of s.pickups) {
      if (pk.collected) continue;
      pk.t += DT;
      if (pk.spilled) {
        pk.life -= DT;
        if (pk.life <= 0) { pk.collected = true; pk.expired = true; continue; }
        if (!pk.landed) {
          pk.vy = Math.min(pk.vy + C.gravity * DT, C.maxFall);
          pk.x += pk.vx * DT; pk.y += pk.vy * DT;
          if (pk.y >= G) {
            if (isSupported(s, pk.x, G)) { pk.y = G; pk.vx = 0; pk.vy = 0; pk.landed = true; }
            else if (pk.y > 230) { pk.collected = true; pk.expired = true; continue; }
          }
          if (pk.x < 4 || pk.x > s.level.width - 4) pk.vx = 0;
          // Inside the locked arena nothing bounces out over the walls (the boss's hot dogs, the supplies).
          if (arenaLocked(s)) { const A = s.level.arena; if (pk.x < A.x0 + 12) { pk.x = A.x0 + 12; pk.vx = 0; } if (pk.x > A.gateX - 8) { pk.x = A.gateX - 8; pk.vx = 0; } }
        }
      }
      if (p.state === 'ko') continue;
      if (overlap({ x: pk.x - 8, y: pk.y - 16, w: 16, h: 16 }, playerBox(p))) {
        pk.collected = true;
        sfx(s, 'sfx-pickup');
        effect(s, 'sparkle', pk.x, pk.y - 8, 0.3);
        if (pk.type === 'hotdog') { p.hp = Math.min(P.maxHp, p.hp + 1); s.stats.hotdogs += 1; }
        if (pk.type === 'lid') p.shield = C.lid.hits;
        if (pk.type === 'chainsaw') {
          p.saw = { fuel: C.chainsaw.fuel, revving: false, tick: 0, slash: 0 };
          sfx(s, 'sfx-chainsaw-start');
        }
      }
    }
  }

  // ---------- checkpoints, arena, camera ----------
  function updateCheckpoints(s) {
    const p = s.player;
    for (const cp of s.cps) {
      if (!cp.active && p.x >= cp.x && p.state !== 'ko') {
        cp.active = true; s.checkpoint = cp; sfx(s, 'sfx-checkpoint');
        effect(s, 'text', cp.x, G - 60, 1.0, { text: 'CHECKPOINT' });
      }
    }
  }

  function spawnWave(s, n) {
    const A = s.level.arena;
    const count = C.gauntlet.waves[n];
    for (let i = 0; i < count; i++) {
      const left = i % 2 === 0;
      const step = (i >> 1) * 14;
      const x = left ? A.x0 + 64 + step : A.gateX - 16 - step; // left side drops in by the second arch, not at the screen edge
      const e = makeEnemy({ type: C.gauntlet.waveType, x, y: 100 }, 0, { id: 'w' + n + '-' + i, arena: true, state: 'spawn', wave: n });
      e.y = 100; e.grounded = false; e.face = left ? 1 : -1;
      s.enemies.push(e);
    }
    s.arena.spawnCount += count;
    effect(s, 'text', (A.x0 + A.x1) / 2, 80, 1.2, { text: 'WAVE ' + (n + 1) });
    sfx(s, 'sfx-zombie-groan');
  }

  function updateArena(s) {
    const a = s.arena, A = s.level.arena, p = s.player;
    if (a.state === 'idle' && p.x >= A.trigger && p.state !== 'ko') {
      a.state = 'fight'; a.wave = 0; a.timer = 0.6;
      music(s, 'arena');
      effect(s, 'text', (A.x0 + A.x1) / 2, 60, 1.2, { text: 'BETHESDA TERRACE. NOBODY LEAVES.' });
    } else if (a.state === 'fight') {
      if (a.timer > 0) {
        a.timer -= DT;
        if (a.timer <= 0) spawnWave(s, a.wave);
      } else {
        const alive = s.enemies.some((e) => e.arena && e.wave === a.wave && e.state !== 'dead');
        if (!alive) {
          a.wave += 1;
          if (a.wave >= C.gauntlet.waves.length) {
            // Last wave down: the boss walks in (gauntlet.boss), or the gate just opens when there is none.
            if (C.gauntlet.boss) { a.state = 'boss'; a.timer = C.gauntlet.bossDelay; s.shake = Math.max(s.shake, 0.3); }
            else openGate(s);
          } else a.timer = C.gauntlet.waveDelay;
        }
      }
    } else if (a.state === 'boss') {
      if (a.timer > 0) { a.timer -= DT; if (a.timer <= 0) spawnBoss(s); }
      else if (!s.enemies.some((e) => e.boss && e.state !== 'dead')) openGate(s);
    } else if (a.state === 'open' && p.x >= A.exitX && p.state !== 'ko') {
      s.mode = 'clear'; s.clearT = 0;
      sawLoop(s, false);
      p.state = 'victory'; p.vx = 0; setAnim(p, 'victory');
      music(s, 'clear');
      sfx(s, 'sfx-level-clear');
    }
  }

  function openGate(s) {
    const A = s.level.arena;
    s.arena.state = 'open'; sfx(s, 'sfx-gate-open'); music(s, 'level');
    effect(s, 'text', A.gateX, 120, 1.5, { text: 'EXIT OPEN. GO.' });
  }

  // The boss walks out of the arch nearest the gate; the supplies (owner answer 4: a lid and a chainsaw, so Sammy always has a
  // saw and a shield for him) drop in by the left wall at the same moment. Also used by the render sweep and the tests.
  function spawnBoss(s) {
    const A = s.level.arena, GA = C.gauntlet;
    const e = makeEnemy({ type: GA.boss, x: A.gateX - GA.bossArch, y: G }, 0, { id: 'boss', arena: true, boss: true });
    e.face = -1; e.decideT = 0; e.walkT = 0; e.attacks = 0; e.tells = 0; e.slamCd = 0; e.waveT = 0;
    s.enemies.push(e);
    s.arena.bossId = e.id;
    for (const sp of GA.supplies || []) {
      s.pickups.push({ id: 'sup' + (s.nextId++), type: sp.type, def: { x: A.x0 + sp.dx }, x: A.x0 + sp.dx, y: 60, vx: 0, vy: 0,
        collected: false, spilled: true, landed: false, life: 1e9, t: 0, supply: true });
    }
    const lines = typeOf(e).cfg.lines || {};
    if (lines.enter) effect(s, 'text', (A.x0 + A.x1) / 2, 60, 2.0, { text: lines.enter });
    if (lines.supplies) effect(s, 'text', A.x0 + 88, 100, 1.5, { text: lines.supplies });
    sfx(s, 'sfx-boss-chains');
    return e;
  }
  S.spawnBoss = spawnBoss;

  // Floor hazards: shockwaves run along the ground from the boss's slam (a normal hit: the lid blocks it, it knocks back);
  // acid puddles burn anyone standing or lying in them (hazard: no lid, no knockback). Both time out.
  function updateHazards(s) {
    const p = s.player, A = s.level.arena;
    for (const h of s.hazards) {
      h.t += DT;
      if (h.kind === 'wave') { h.x += h.dir * h.speed * DT; if (h.x < A.x0 + 8 || h.x > A.gateX) h.dead = true; }
      if (h.t >= h.life) h.dead = true;
      if (h.dead || p.state === 'ko' || h.t < (h.land || 0)) continue; // a puddle still landing (the splat) doesn't burn yet
      const box = h.kind === 'wave' ? { x: h.x - h.w / 2, y: G - h.h, w: h.w, h: h.h } : { x: h.x - h.w / 2, y: G - 4, w: h.w, h: 4 };
      if (!overlap(box, playerBox(p))) continue;
      if (h.kind === 'wave') hurtPlayer(s, { fromX: h.x });
      else if (hurtPlayer(s, { hazard: true })) sfx(s, 'sfx-acid-burn');
    }
    s.hazards = s.hazards.filter((h) => !h.dead);
  }

  function updateCamera(s) {
    const p = s.player, L = s.level, W = C.screenW;
    let minX = Math.max(0, s.checkpoint.x - 64);
    let target = p.x - W / 2 + p.face * 32;
    if (arenaLocked(s)) { target = L.arena.x0; minX = L.arena.x0; }
    target = clamp(target, minX, L.width - W);
    s.cam.x += (target - s.cam.x) * Math.min(1, 6 * DT);
    s.cam.x = clamp(s.cam.x, 0, L.width - W);
  }

  function playerAnim(p) {
    if (p.state === 'victory') return 'victory';
    if (p.state === 'ko') return 'ko';
    if (p.state === 'hurt') return 'hurt';
    if (p.state === 'playdead') return 'play-dead';
    if (p.state === 'getup') return 'get-up';
    if (p.state === 'attack') return 'tail-whip';
    if (p.saw && p.saw.revving) return 'chainsaw-rev';
    if (!p.grounded) return p.vy < 0 ? 'jump-rise' : 'fall';
    if (p.landT > 0) return 'land';
    if (Math.abs(p.vx) > 10) return p.saw ? 'chainsaw-run' : 'run';
    return p.saw ? 'chainsaw-idle' : 'idle';
  }

  function updateEffects(s) {
    for (const f of s.effects) f.t += DT;
    s.effects = s.effects.filter((f) => f.t < f.life);
    s.shake = Math.max(0, s.shake - DT);
  }

  // ---------- main step ----------
  S.update = function (s, inp) {
    const q = inp.pressed;
    if (s.mode === 'title') {
      if (q.start || q.jump) { s.mode = 'playing'; music(s, 'level'); sfx(s, 'sfx-start'); }
      return;
    }
    if (s.mode === 'paused') {
      if (q.restart) { resetLevel(s); s.mode = 'playing'; music(s, 'level'); }
      else if (q.start) { s.mode = 'playing'; music(s, 'resume'); }
      return;
    }
    if (s.mode === 'clear') {
      s.clearT += DT;
      const p = s.player;
      // Reached the exit mid-air: keep falling until he lands.
      if (!p.grounded) { p.vx = 0; const b = playerBox(p); moveBody(s, p, b.w, b.h); }
      p.animT += DT;
      updateEffects(s);
      if ((q.start || q.jump || q.restart) && s.clearT > 1.5) { resetLevel(s); s.mode = 'playing'; music(s, 'level'); }
      return;
    }
    // playing
    if (q.start) { sawLoop(s, false); s.mode = 'paused'; music(s, 'pause'); return; }
    if (q.restart) { resetLevel(s); music(s, 'level'); return; }
    // Hit-stop after a chainsaw kill: everything holds still for a few frames; effects (and the shake) keep going.
    if (s.hitstop > 0) { s.hitstop = Math.max(0, s.hitstop - DT); s.t += DT; updateEffects(s); return; }
    s.t += DT;
    s.stats.time += DT;
    updatePlayer(s, inp);
    for (const e of s.enemies) { typeOf(e).update(s, e); e.animT += DT; e.flashT = Math.max(0, (e.flashT || 0) - DT); e.hitT = Math.max(0, (e.hitT || 0) - DT); }
    s.enemies = s.enemies.filter((e) => !(e.arena && e.state === 'dead'));
    updateHazards(s);
    for (const c of s.carts) { updateCart(s, c); c.animT += DT; }
    updatePickups(s);
    updateProjectiles(s);
    updateCheckpoints(s);
    updateArena(s);
    updateCamera(s);
    updateEffects(s);
    const p = s.player;
    if (s.mode === 'playing') setAnim(p, playerAnim(p));
    p.animT += DT;
  };

  // Exposed for tests and the renderer.
  S.overlap = overlap;
  S.footBox = footBox;
  S.playerBox = playerBox;
  S.getSolids = getSolids;
  S.getPlatforms = getPlatforms;
  S.cartBody = cartBody;
})(globalThis.SAMMY = globalThis.SAMMY || {});
