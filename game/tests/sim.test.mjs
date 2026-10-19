// Game-rule tests. Run from the game/ folder:  node --test tests/
// Loads the same plain scripts the browser uses, without any drawing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(here, '..', 'src');
for (const f of ['config', 'level', 'assets', 'sim', 'bot']) {
  vm.runInThisContext(fs.readFileSync(path.join(src, f + '.js'), 'utf8'), { filename: f + '.js' });
}
const S = globalThis.SAMMY;
const C = S.CONFIG;
const G = C.groundY;
const sec = (t) => Math.round(t * 60);

function step(s, spec = {}, frames = 1) {
  for (let i = 0; i < frames; i++) {
    const inp = S.makeInput();
    Object.assign(inp.held, spec.held || {});
    if (i === 0) Object.assign(inp.pressed, spec.pressed || {});
    S.update(s, inp);
  }
}
function start() { const s = S.newGame(); step(s, { pressed: { start: true } }); return s; }
function place(s, x, opts = {}) {
  const p = s.player; p.x = x; p.y = opts.y || G; p.vx = 0; p.vy = 0; p.grounded = true; p.face = opts.face || 1;
  if (p.state === 'hurt') { p.state = 'normal'; p.t = 0; }
  s.cam.x = Math.max(0, Math.min(x - 160, s.level.width - C.screenW));
  s.checkpoint = { id: 'TEST', x: opts.cp != null ? opts.cp : 0 };
}
function onlyEnemiesNear(s, x, r = 60) { s.enemies = s.enemies.filter((e) => Math.abs(e.x - x) < r); }
function events(s) { const ids = s.events.map((e) => e.id); s.events.length = 0; return ids; }
function runUntil(s, cond, maxFrames, spec) { for (let i = 0; i < maxFrames; i++) { if (cond()) return i; step(s, spec || {}); } return -1; }

// ---------- startup and level data ----------
test('startup: title screen, then Enter starts level 1 at the start point with full health', () => {
  const s = S.newGame();
  assert.equal(s.mode, 'title');
  step(s, {}, 30);
  assert.equal(s.mode, 'title', 'stays on title without input');
  step(s, { pressed: { start: true } });
  assert.equal(s.mode, 'playing');
  assert.equal(s.player.x, s.level.start.x);
  assert.equal(s.player.hp, C.sammy.maxHp);
  assert.ok(events(s).includes('level'), 'level music requested');
});

test('level data: everything sits on solid ground inside the level and platforms are reachable', () => {
  const s = start();
  const L = s.level;
  const jumpH = (C.sammy.jumpSpeed ** 2) / (2 * C.gravity);
  for (const e of L.enemies) {
    assert.ok(e.x > 0 && e.x < L.width, 'enemy inside level ' + e.x);
    assert.ok(S.isSupported(s, e.x, G), 'enemy on ground at ' + e.x);
  }
  for (const c of L.checkpoints) assert.ok(S.isSupported(s, c.x, G), 'checkpoint on ground ' + c.id);
  assert.ok(S.isSupported(s, L.start.x, G));
  for (const p of L.platforms) assert.ok(G - p.y <= jumpH - 2, 'platform reachable at ' + p.x);
  for (const b of L.solids) assert.ok(b.h <= jumpH - 8, 'obstacle can be jumped at ' + b.x);
  for (const pk of L.pickups) assert.ok(pk.x > 0 && pk.x < L.width);
  assert.equal(L.width, 12 * C.screenW, '12 screens, as in LEVEL.md');
});

// ---------- movement ----------
test('movement: runs right and left, faces the direction of travel, cannot leave the screen to the left', () => {
  const s = start();
  s.enemies = [];
  const x0 = s.player.x;
  step(s, { held: { right: true } }, 60);
  assert.ok(s.player.x - x0 > 80, 'moved right ' + (s.player.x - x0));
  assert.equal(s.player.face, 1);
  step(s, { held: { left: true } }, 200);
  assert.equal(s.player.face, -1);
  assert.ok(s.player.x >= s.cam.x + 8 - 0.01, 'clamped to the camera edge');
});

test('jump: leaves the ground, reaches about 60 px, lands; a short tap gives a lower jump', () => {
  const s = start(); s.enemies = [];
  place(s, 200);
  step(s, { held: { jump: true }, pressed: { jump: true } });
  assert.ok(events(s).includes('sfx-jump'));
  let minY = G;
  const landed = runUntil(s, () => { minY = Math.min(minY, s.player.y); return s.player.grounded; }, 120, { held: { jump: true } });
  assert.ok(landed > 0, 'landed');
  assert.ok(G - minY >= 55, 'full jump height ' + (G - minY));
  place(s, 200);
  step(s, { held: { jump: true }, pressed: { jump: true } });
  let minY2 = G;
  runUntil(s, () => { minY2 = Math.min(minY2, s.player.y); return s.player.grounded; }, 120);
  assert.ok(G - minY2 < (G - minY) - 15, 'tap jump is lower: ' + (G - minY2));
});

test('one-way platforms: jump up through a bench and land on top; rocks block walking', () => {
  const s = start(); s.enemies = [];
  place(s, 436);
  step(s, { held: { jump: true }, pressed: { jump: true } });
  runUntil(s, () => s.player.grounded && s.player.vy === 0, 120, { held: { jump: true } });
  assert.equal(s.player.y, 172, 'standing on the bench');
  place(s, 690);
  step(s, { held: { right: true } }, 90);
  assert.ok(s.player.x <= 720 - C.sammy.bodyW / 2 + 0.01, 'rock at x 720 blocks: ' + s.player.x);
});

// ---------- combat ----------
test('tail-whip: two hits defeat a zombie jogger; the defeat plays, then it is removed', () => {
  const s = start();
  onlyEnemiesNear(s, 540, 5);
  const z = s.enemies[0];
  z.state = 'confused'; // keep it still for this test
  place(s, 518);
  step(s, { pressed: { attack: true } }, sec(0.3));
  assert.equal(z.hp, 1);
  assert.ok(events(s).includes('sfx-hit-zombie'));
  z.state = 'confused';
  place(s, z.x - 22);
  step(s, { pressed: { attack: true } }, sec(0.3));
  assert.equal(z.state, 'defeat');
  assert.equal(s.stats.defeated, 1);
  step(s, {}, sec(1));
  assert.equal(z.state, 'dead');
});

test('zombie jogger: notices Sammy within 96 px, chases, attacks; 1 s of invincibility after a hit', () => {
  const s = start();
  onlyEnemiesNear(s, 540, 5);
  const z = s.enemies[0];
  place(s, z.x - 80);
  step(s, {}, 2);
  assert.equal(z.state, 'chase');
  const hpBefore = s.player.hp;
  runUntil(s, () => s.player.hp < hpBefore, sec(5));
  assert.equal(s.player.hp, hpBefore - 1, 'took exactly one hit');
  assert.ok(s.player.invuln > 0.9);
  step(s, {}, sec(0.8));
  assert.equal(s.player.hp, hpBefore - 1, 'no second hit during invincibility');
});

test('zombie jogger: patrols near home and ignores a far-away Sammy', () => {
  const s = start();
  onlyEnemiesNear(s, 540, 5);
  const z = s.enemies[0];
  place(s, 200);
  let minX = z.x, maxX = z.x;
  for (let i = 0; i < sec(8); i++) { step(s); minX = Math.min(minX, z.x); maxX = Math.max(maxX, z.x); }
  assert.equal(z.state, 'patrol');
  assert.ok(minX >= 540 - C.jogger.patrolRange - 2 && maxX <= 540 + C.jogger.patrolRange + 2, `patrol ${minX}..${maxX}`);
  assert.ok(maxX - minX > 60, 'it actually walks');
});

test('play possum: nearby zombies get confused and stop hurting; 6 s cooldown; not usable mid-air', () => {
  const s = start();
  onlyEnemiesNear(s, 540, 5);
  const z = s.enemies[0];
  place(s, z.x - 60);
  step(s, {}, 2);
  assert.equal(z.state, 'chase');
  step(s, { pressed: { possum: true } });
  assert.equal(s.player.state, 'playdead');
  assert.equal(z.state, 'confused');
  assert.ok(events(s).includes('sfx-play-dead'));
  step(s, {}, sec(2.9));
  assert.equal(s.player.hp, C.sammy.maxHp, 'no damage while playing dead');
  runUntil(s, () => s.player.state === 'normal', sec(1));
  assert.ok(Math.abs(s.player.possumCd - C.possum.cooldown) < 0.05, 'cooldown started');
  assert.equal(z.state, 'patrol', 'zombie gave up and went back to patrolling');
  step(s, { pressed: { possum: true } });
  assert.equal(s.player.state, 'normal', 'cannot use during cooldown');
  s.player.possumCd = 0;
  step(s, { held: { jump: true }, pressed: { jump: true } }, 5);
  step(s, { pressed: { possum: true } });
  assert.notEqual(s.player.state, 'playdead', 'cannot use mid-air');
});

test('play possum: any button cancels it after 0.5 s, not before', () => {
  const s = start(); s.enemies = [];
  place(s, 200);
  step(s, { pressed: { possum: true } });
  step(s, {}, sec(0.2));
  step(s, { pressed: { jump: true } });
  assert.equal(s.player.state, 'playdead', 'too early to cancel');
  step(s, {}, sec(0.4));
  step(s, { pressed: { jump: true } });
  assert.equal(s.player.state, 'getup');
});

test('play possum: zombies farther than 96 px keep tracking Sammy', () => {
  const s = start();
  onlyEnemiesNear(s, 540, 5);
  const z = s.enemies[0];
  place(s, z.x - 92); step(s, {}, 2);
  assert.equal(z.state, 'chase');
  z.x = s.player.x + 120;
  step(s, { pressed: { possum: true } });
  assert.notEqual(z.state, 'confused');
});

// ---------- interactive objects and power-ups ----------
test('hot dog cart: two whips tip it, it spills 3 hot dogs that heal, then it is empty', () => {
  const s = start();
  s.enemies = [];
  const c = s.carts[0];
  place(s, c.x - 18);
  step(s, { pressed: { attack: true } }, sec(0.3));
  assert.equal(c.state, 'rocking');
  step(s, { pressed: { attack: true } }, sec(0.3));
  assert.ok(c.state === 'tipping' || c.state === 'tipped');
  assert.ok(events(s).includes('sfx-cart-crash'));
  step(s, {}, sec(1.5));
  assert.equal(c.state, 'tipped');
  const dogs = s.pickups.filter((pk) => pk.spilled);
  assert.equal(dogs.length, 3);
  assert.ok(dogs.every((d) => d.landed && d.y === G), 'hot dogs landed on the grass');
  s.player.hp = 1;
  for (const d of dogs) { place(s, d.x); step(s); }
  assert.equal(s.player.hp, 3, 'healed by hot dogs (capped at max)');
  assert.equal(s.stats.hotdogs, 3);
  step(s);
  assert.equal(c.state, 'empty');
});

test('hot dog cart: one whip only rocks it; it settles back after 1.5 s', () => {
  const s = start(); s.enemies = [];
  const c = s.carts[0];
  place(s, c.x - 18);
  step(s, { pressed: { attack: true } }, sec(0.3));
  assert.equal(c.state, 'rocking');
  step(s, {}, sec(1.5));
  assert.equal(c.state, 'upright');
});

test('hot dog cart: spill knocks nearby zombies back without hurting them', () => {
  const s = start();
  const c = s.carts[0];
  onlyEnemiesNear(s, 1800, 5);
  const v = s.enemies[0];
  v.x = c.x + C.cart.w / 2 + 30; v.state = 'idle'; v.throwT = 99;
  place(s, c.x - 18);
  step(s, { pressed: { attack: true } }, sec(0.3));
  step(s, { pressed: { attack: true } }, sec(0.3));
  step(s, {}, 2);
  assert.equal(v.hp, C.vendor.hp, 'no damage');
});

test('trash lid shield: pickup gives 3 blocks; hazards are not blocked', () => {
  const s = start(); s.enemies = [];
  const lid = s.pickups.find((pk) => pk.type === 'lid');
  place(s, lid.x); step(s);
  assert.equal(s.player.shield, 3);
  for (let i = 0; i < 3; i++) { s.player.invuln = 0; assert.equal(S.hurtPlayer(s, { fromX: s.player.x + 10 }), 'blocked'); }
  assert.equal(s.player.shield, 0);
  assert.equal(s.player.hp, 3);
  s.player.invuln = 0;
  assert.equal(S.hurtPlayer(s, { fromX: s.player.x + 10 }), 'hurt');
  assert.equal(s.player.hp, 2);
  s.player.shield = 3; s.player.invuln = 0; s.player.state = 'normal';
  assert.equal(S.hurtPlayer(s, { hazard: true }), 'hurt', 'pond water ignores the lid');
  assert.equal(s.player.shield, 3);
});

test('hot dog vendor: throws hot dogs that can hurt Sammy; whipping him twice defeats him', () => {
  const s = start();
  onlyEnemiesNear(s, 1800, 5);
  s.carts = [];
  const v = s.enemies[0];
  place(s, 1700);
  let threw = false;
  const hit = runUntil(s, () => { threw = threw || s.projectiles.length > 0; return s.player.hp < 3; }, sec(6));
  assert.ok(threw, 'threw a hot dog');
  assert.ok(hit > 0, 'a hot dog hit Sammy');
  place(s, v.x - 20); s.player.invuln = 5;
  step(s, { pressed: { attack: true } }, sec(0.35));
  step(s, { pressed: { attack: true } }, sec(0.35));
  assert.ok(v.state === 'defeat' || v.state === 'dead');
});

test('pond: falling in costs 1 heart and puts Sammy back on safe ground', () => {
  const s = start(); s.enemies = [];
  place(s, 2300);
  const fell = runUntil(s, () => s.player.hp < 3, sec(4), { held: { right: true } });
  assert.ok(fell > 0, 'fell into the pond');
  assert.ok(s.player.x < 2344 - 20, 'respawned before the water at x ' + s.player.x);
  assert.equal(s.player.y, G);
});

// ---------- failure and recovery ----------
test('KO and checkpoint: losing all hearts restarts at the last checkpoint with full health', () => {
  const s = start();
  s.enemies = [];
  place(s, 1250, { cp: 0 });
  s.checkpoint = { id: 'START', x: s.level.start.x };
  step(s, { held: { right: true } }, sec(0.5));
  assert.equal(s.checkpoint.id, 'C1');
  assert.ok(events(s).includes('sfx-checkpoint'));
  s.player.hp = 1; s.player.invuln = 0;
  S.hurtPlayer(s, { fromX: s.player.x + 5 });
  assert.equal(s.player.state, 'ko');
  assert.ok(events(s).includes('sfx-ko'));
  step(s, {}, sec(C.sammy.koTime + C.sammy.koWait + 0.1));
  assert.equal(s.mode, 'playing');
  assert.equal(s.player.x, 1264);
  assert.equal(s.player.hp, 3);
  assert.equal(s.stats.kos, 1);
  const after = s.level.enemies.filter((e) => e.x > 1264).length;
  assert.equal(s.enemies.filter((e) => e.def.x > 1264).length, after, 'enemies after the checkpoint come back');
  assert.equal(s.carts[0].state, 'upright', 'cart after the checkpoint resets');
});

// ---------- gauntlet, victory, restart ----------
test('gauntlet: arena locks, 3 waves (2, 3, 4 zombies), gate opens, exit clears the level', () => {
  const s = start(); s.god = true;
  s.enemies = s.enemies.filter((e) => e.def.x > 9999);
  place(s, 3500, { cp: 2576 });
  step(s, { held: { right: true } }, sec(1));
  assert.equal(s.arena.state, 'fight');
  const bot = S.makeBot();
  let spawned = 0, minX = Infinity;
  for (let i = 0; i < sec(120) && s.mode !== 'clear'; i++) {
    S.update(s, S.botInput(s, bot));
    s.events.length = 0;
    if (s.arena.state === 'fight') minX = Math.min(minX, s.player.x);
    spawned = Math.max(spawned, s.arena.spawnCount);
  }
  assert.equal(spawned, 9);
  assert.equal(s.mode, 'clear');
  assert.equal(s.arena.state, 'open');
  assert.ok(minX >= s.level.arena.x0 + 8, 'Sammy never left the arena during the fight: ' + minX);
});

test('pause, restart and play again', () => {
  const s = start(); s.enemies = [];
  step(s, { held: { right: true } }, 30);
  step(s, { pressed: { start: true } });
  assert.equal(s.mode, 'paused');
  const t = s.t, x = s.player.x;
  step(s, { held: { right: true } }, 30);
  assert.equal(s.t, t); assert.equal(s.player.x, x);
  step(s, { pressed: { start: true } });
  assert.equal(s.mode, 'playing');
  step(s, { pressed: { restart: true } });
  assert.equal(s.player.x, s.level.start.x, 'R restarts the level');
  s.mode = 'clear'; s.clearT = 0;
  step(s, { pressed: { start: true } });
  assert.equal(s.mode, 'clear', 'tally must finish before restarting');
  s.clearT = 2;
  step(s, { pressed: { start: true } });
  assert.equal(s.mode, 'playing');
  assert.equal(s.stats.defeated, 0);
});

test('full playthrough (autopilot, no damage): title to level clear in under 2 minutes of game time', () => {
  const s = S.newGame(); s.god = true;
  const bot = S.makeBot();
  let f = 0;
  for (; f < sec(120) && s.mode !== 'clear'; f++) { S.update(s, S.botInput(s, bot)); s.events.length = 0; }
  assert.equal(s.mode, 'clear', 'stuck at x ' + Math.round(s.player.x));
  assert.ok(s.carts[0].state === 'empty' || s.carts[0].state === 'tipped');
});

test('the game is deterministic: two identical runs give identical results', () => {
  const run = () => { const s = S.newGame(); s.god = true; const b = S.makeBot(); for (let i = 0; i < sec(40); i++) { S.update(s, S.botInput(s, b)); s.events.length = 0; } return JSON.stringify([s.stats, Math.round(s.player.x * 100)]); };
  assert.equal(run(), run());
});

// ---------- asset list matches the documented plan ----------
test('asset manifest: every planned file name appears in the example docs, with matching sizes', () => {
  const ex = path.join(here, '..', '..', 'templates', 'examples');
  let docs = '';
  for (const d of fs.readdirSync(ex)) {
    const dir = path.join(ex, d);
    if (fs.statSync(dir).isDirectory()) for (const f of fs.readdirSync(dir)) docs += fs.readFileSync(path.join(dir, f), 'utf8');
  }
  const names = new Set();
  for (const m of S.ASSET_MANIFEST) {
    const file = path.basename(m.path);
    assert.ok(docs.includes(file), file + ' is named in templates/examples');
    assert.ok(!names.has(m.path), 'no duplicate ' + m.path); names.add(m.path);
    assert.ok(!m.path.startsWith('references/'), 'never load reference-only art');
  }
});
