// Game-rule tests. Run from the game/ folder:  node --test tests/
// Loads the same plain scripts the browser uses, without any drawing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(here, '..', 'src');
for (const f of ['config', 'font', 'level', 'assets', 'sim', 'bot', 'layout', 'render', 'audio']) {
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

test('play possum: the HUD icon flashes for 1 s each time the cooldown ends', () => {
  const s = start(); s.enemies = [];
  place(s, 200);
  assert.equal(s.player.possumFlash, 0, 'no flash at the start');
  for (let round = 0; round < 2; round++) {
    step(s, { pressed: { possum: true } });
    runUntil(s, () => s.player.state === 'normal', sec(4));
    assert.equal(s.player.possumFlash, 0, 'no flash during the cooldown');
    runUntil(s, () => s.player.possumCd === 0, sec(7));
    assert.ok(s.player.possumFlash > 0.9, 'flash starts when ready (round ' + (round + 1) + ')');
    step(s, {}, sec(C.possum.readyFlash) + 2);
    assert.equal(s.player.possumFlash, 0, 'flash stops after 1 s');
  }
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
  assert.ok(events(s).includes('sfx-splash'), 'splash sound');
  const sp = s.effects.find((f) => f.kind === 'splash');
  assert.ok(sp && sp.x >= 2344 && sp.x <= 2424 && sp.y === 198, 'splash drawn on the water');
});

test('dry pit: falling out of the world costs 1 heart with no splash, back on safe ground', () => {
  const L = JSON.parse(JSON.stringify(S.LEVEL1));
  L.water = []; // the pond's gap (x 2344..2424) becomes a dry pit
  const s = S.newGame(L); step(s, { pressed: { start: true } }); s.enemies = [];
  place(s, 2300);
  events(s);
  const fell = runUntil(s, () => s.player.hp < 3, sec(4), { held: { right: true } });
  assert.ok(fell > 0, 'fell into the pit');
  assert.ok(!events(s).includes('sfx-splash'), 'no splash sound');
  assert.ok(!s.effects.some((f) => f.kind === 'splash'), 'no splash effect');
  assert.equal(s.player.y, G);
  assert.ok(s.player.x < 2344 - 20, 'back before the pit at x ' + s.player.x);
  assert.ok(S.isSupported(s, s.player.x, G), 'standing on solid ground');
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

test('victory: reaching the exit mid-air, Sammy falls and lands instead of freezing in the air', () => {
  const s = start(); s.god = true; s.enemies = [];
  s.arena.state = 'open';
  place(s, 3812);
  const p = s.player; p.y = G - 40; p.grounded = false; p.vy = 0; p.vx = C.sammy.runSpeed;
  runUntil(s, () => s.mode === 'clear', 10, { held: { right: true } });
  assert.equal(s.mode, 'clear');
  assert.ok(p.y < G, 'still in the air');
  const x = p.x;
  step(s, { held: { right: true } }, sec(1));
  assert.equal(p.y, G); assert.ok(p.grounded); assert.equal(p.vy, 0);
  assert.equal(p.x, x, 'no sideways drift');
  assert.equal(p.anim, 'victory');
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
  step(s, { held: { right: true } }, 30);
  step(s, { pressed: { start: true } });
  events(s);
  step(s, { pressed: { restart: true } });
  assert.equal(s.mode, 'playing', 'R while paused restarts and unpauses');
  assert.equal(s.player.x, s.level.start.x, 'R while paused restarts the level');
  assert.ok(events(s).includes('level'), 'level music requested');
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

test('asset sizes: each planned file size in the example docs matches the art list', () => {
  const ex = path.join(here, '..', '..', 'templates', 'examples');
  const lines = [];
  for (const d of fs.readdirSync(ex)) {
    const dir = path.join(ex, d);
    if (fs.statSync(dir).isDirectory()) for (const f of fs.readdirSync(dir)) lines.push(...fs.readFileSync(path.join(dir, f), 'utf8').split('\n'));
  }
  for (const m of S.ASSET_MANIFEST) {
    const file = path.basename(m.path);
    const row = lines.find((l) => l.startsWith('|') && l.includes(file));
    assert.ok(row, file + ' has a row in a planned-file table');
    const whole = m.fw * m.frames + '×' + m.fh, cells = m.frames + ' × ' + m.fw + '×' + m.fh;
    assert.ok(row.includes(whole) || row.includes(cells), file + ': doc row should say ' + whole + ' — ' + row);
  }
});

test('parallax: background bands match the tileset doc, do not overlap, and loop at 256 or 512 px', () => {
  const doc = fs.readFileSync(path.join(here, '..', '..', 'templates', 'examples', 'environment-central-park-tileset', 'ASSET.md'), 'utf8');
  const bands = ['bg:skyline', 'bg:treeline', 'bg:bushes'].map((k) => S.ASSET_MANIFEST.find((m) => m.key === k));
  const names = { 'bg:skyline': 'Manhattan skyline', 'bg:treeline': 'Tree line', 'bg:bushes': 'Near bushes' };
  let prevEnd = -1;
  for (const b of bands) {
    assert.ok([256, 512].includes(b.fw), b.key + ' loop width');
    assert.ok(b.y > prevEnd, b.key + ' starts below the band above it'); prevEnd = b.y + b.fh - 1;
    assert.ok(prevEnd < C.screenH, b.key + ' fits on screen');
    assert.ok(b.scroll > 0 && b.scroll < 1, b.key + ' scrolls slower than the camera');
    const row = doc.split('\n').find((l) => l.startsWith('| ' + names[b.key]));
    assert.ok(row && row.includes(b.fw + '×' + b.fh) && row.includes(b.y + '–' + prevEnd) && row.includes(b.scroll * 100 + '%'), b.key + ' doc row: ' + row);
  }
  const sky = S.ASSET_MANIFEST.find((m) => m.key === 'bg:sky');
  assert.equal(sky.y, 0); assert.equal(sky.scroll, 0);
});

test('tail-whip art cell is wide enough for the whip hitbox', () => {
  const m = S.ASSET_MANIFEST.find((a) => a.key === 'sammy:tail-whip');
  const reach = 6 + C.sammy.whipW; // whipHits in sim.js: starts 6 px in front of the feet point
  assert.ok(m.px + reach <= m.fw, 'reach ' + reach + ' px fits right of the pivot');
  assert.ok(m.px - reach >= 0, 'and left of it when mirrored');
  assert.equal(m.fh, 48); assert.equal(m.py, 47);
  for (const a of S.ASSET_MANIFEST) if (a.key.startsWith('sammy:') && a !== m) assert.equal(a.fw, 48, a.key + ' stays 48 wide');
});

test('placeholder font: M, W, H and N look different, and text width matches drawing', () => {
  const g = S.GLYPHS;
  const pick = ['M', 'W', 'H', 'N'];
  for (const a of pick) for (const b of pick) if (a < b) assert.notEqual(g[a].join('|'), g[b].join('|'), a + ' vs ' + b);
  for (const k in g) { assert.equal(g[k].length, 5, k + ' is 5 rows'); for (const r of g[k]) assert.equal(r.length, g[k][0].length, k + ' rows same width'); }
  let maxX = 0;
  const ctx = { fillRect: (x, y, w) => { maxX = Math.max(maxX, x + w); } };
  S.drawText(ctx, 'MWHN', 0, 0, '#fff', 2);
  assert.equal(maxX, S.textWidth('MWHN', 2));
});

test('audio converter: picks only .wav files missing an .ogg (or an .mp3 with --mp3)', async () => {
  const os = await import('node:os');
  const { findWavsToConvert, ffmpegArgs } = await import('../tools/convert-audio.mjs');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sammy-convert-'));
  try {
    const put = (rel) => { const f = path.join(tmp, 'assets', rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, ''); };
    put('audio/sfx/sfx-jump/sfx-jump-v01.wav');          // needs an .ogg
    put('audio/sfx/sfx-land/sfx-land-v01.wav');
    put('audio/sfx/sfx-land/sfx-land-v01.ogg');          // already done
    put('audio/sfx/sfx-hurt/sfx-hurt-v01.WAV');          // upper-case extension
    put('audio/sfx/sfx-hurt/sfx-hurt-v01.mp3');          // has mp3 but no ogg: still needs ogg
    put('audio/music/music-level-01-central-park/music-level-01-central-park-v01.wav');
    put('characters/character-sammy/not-audio.wav');     // outside assets/audio: ignored
    const rel = (p) => p && path.relative(path.join(tmp, 'assets'), p).split(path.sep).join('/');
    const got = findWavsToConvert(tmp).map((t) => [rel(t.wav), rel(t.ogg), t.mp3]);
    assert.deepEqual(got, [
      ['audio/music/music-level-01-central-park/music-level-01-central-park-v01.wav', 'audio/music/music-level-01-central-park/music-level-01-central-park-v01.ogg', null],
      ['audio/sfx/sfx-hurt/sfx-hurt-v01.WAV', 'audio/sfx/sfx-hurt/sfx-hurt-v01.ogg', null],
      ['audio/sfx/sfx-jump/sfx-jump-v01.wav', 'audio/sfx/sfx-jump/sfx-jump-v01.ogg', null],
    ]);
    const withMp3 = findWavsToConvert(tmp, { mp3: true }).map((t) => [rel(t.wav), rel(t.ogg), rel(t.mp3)]);
    assert.deepEqual(withMp3, [
      ['audio/music/music-level-01-central-park/music-level-01-central-park-v01.wav', 'audio/music/music-level-01-central-park/music-level-01-central-park-v01.ogg', 'audio/music/music-level-01-central-park/music-level-01-central-park-v01.mp3'],
      ['audio/sfx/sfx-hurt/sfx-hurt-v01.WAV', 'audio/sfx/sfx-hurt/sfx-hurt-v01.ogg', null],
      ['audio/sfx/sfx-jump/sfx-jump-v01.wav', 'audio/sfx/sfx-jump/sfx-jump-v01.ogg', 'audio/sfx/sfx-jump/sfx-jump-v01.mp3'],
      ['audio/sfx/sfx-land/sfx-land-v01.wav', null, 'audio/sfx/sfx-land/sfx-land-v01.mp3'], // .ogg done earlier, --mp3 added later
    ]);
    assert.deepEqual(findWavsToConvert(path.join(tmp, 'missing')), []);
    const args = ffmpegArgs('a.wav', 'a.ogg');
    assert.ok(args.includes('-n') && !args.includes('-y'), 'never overwrites');
    assert.equal(args[args.length - 1], 'a.ogg');
    assert.ok(fs.existsSync(path.join(tmp, 'assets', 'audio/sfx/sfx-jump/sfx-jump-v01.wav')), 'WAV untouched');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

// ---------- sound list ----------
test('sound manifest: every sound the game triggers has a planned file name and a placeholder beep', () => {
  const simSrc = fs.readFileSync(path.join(src, 'sim.js'), 'utf8');
  const audioSrc = fs.readFileSync(path.join(src, 'audio.js'), 'utf8');
  const ids = new Set(S.SOUND_MANIFEST.map((m) => m.id));
  assert.equal(ids.size, S.SOUND_MANIFEST.length, 'no duplicate sound ids');
  const used = [...new Set([...simSrc.matchAll(/'(sfx-[a-z0-9-]+)'/g)].map((m) => m[1]))];
  assert.ok(used.length > 15, 'found the sound calls in sim.js');
  for (const id of used) {
    assert.ok(ids.has(id), id + ' is in SOUND_MANIFEST');
    assert.ok(audioSrc.includes("'" + id + "':"), id + ' has a placeholder beep');
  }
  for (const m of S.SOUND_MANIFEST) assert.equal(m.dir, 'audio/' + m.kind + '/' + m.id + '/');
  for (const [key, list] of Object.entries(S.MUSIC_TRACKS)) for (const id of list) assert.ok(ids.has(id), key + ' music ' + id + ' is planned');
  const music = [...simSrc.matchAll(/music\(s, ?'([^']+)'\)/g)].map((m) => m[1]).filter((k) => !['stop', 'pause', 'resume', 'clear'].includes(k));
  for (const k of music) assert.ok(S.MUSIC_TRACKS[k], 'music "' + k + '" has a track list');
});

test('sound file names: versions, variations and formats are read correctly', () => {
  assert.deepEqual(S.soundFileInfo('sfx-land', 'sfx-land-v01.ogg'), { version: 1, variant: '', format: 'ogg' });
  assert.deepEqual(S.soundFileInfo('sfx-land', 'sfx-land-v02-b.WAV'), { version: 2, variant: 'b', format: 'wav' });
  assert.equal(S.soundFileInfo('sfx-land', 'sfx-land.ogg'), null);
  assert.equal(S.soundFileInfo('sfx-land', 'sfx-landing-v01.ogg'), null);
  assert.equal(S.soundFileInfo('sfx-land', 'sfx-land-v01.m4a'), null);
});

test('sound scan: picks the newest version, skips .wav masters, and flags misnamed files', async () => {
  const os = await import('node:os');
  const { scan } = await import('../tools/scan-assets.mjs');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sammy-sound-scan-'));
  try {
    const put = (rel) => { const f = path.join(tmp, 'assets', rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, ''); };
    put('audio/sfx/sfx-jump/sfx-jump-v01.ogg');
    put('audio/sfx/sfx-jump/sfx-jump-v01.wav');          // master copy: skipped
    put('audio/sfx/sfx-land/sfx-land-v01-a.ogg');
    put('audio/sfx/sfx-land/sfx-land-v02-a.ogg');        // newer version wins
    put('audio/sfx/sfx-land/sfx-land-v01-b.wav');        // only copy of variation b: kept
    put('audio/sfx/sfx-hurt/hurt.ogg');                  // misnamed
    put('audio/music/music-level-01-central-park/music-level-01-central-park-v01.mp3');
    const out = path.join(tmp, 'asset-files.js');
    const r = scan(tmp, out);
    assert.deepEqual(r.sounds, {
      'sfx-jump': ['audio/sfx/sfx-jump/sfx-jump-v01.ogg'],
      'sfx-land': ['audio/sfx/sfx-land/sfx-land-v01-b.wav', 'audio/sfx/sfx-land/sfx-land-v02-a.ogg'],
      'music-level-01-central-park': ['audio/music/music-level-01-central-park/music-level-01-central-park-v01.mp3'],
    });
    assert.deepEqual(r.masters, ['audio/sfx/sfx-jump/sfx-jump-v01.wav']);
    assert.deepEqual(r.unusedSounds, ['audio/sfx/sfx-hurt/hurt.ogg']);
    assert.equal(r.found.length, 0, 'art list unaffected');
    assert.ok(fs.readFileSync(out, 'utf8').includes('PRESENT_SOUND_FILES'));
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

// ---------- starting sound on phones (audio.js) ----------
// A pretend sound engine and pretend <audio> elements, so the steps can be checked without a browser.
function fakeSoundKit() {
  // Like a phone: a muted file may always play; a file plays WITH sound only once it has been played (muted or not)
  // during a real activation (a key, a click, a finger lifting). kit.fire(target, type, pointerType) dispatches an event
  // and remembers it while the listeners run. This list is the fake phone's own rule, written out separately on purpose.
  const ACTIVATION = (type, pt) => ['touchend', 'click', 'keydown', 'mousedown'].includes(type) ||
    (type === 'pointerup' && pt && pt !== 'mouse') || (type === 'pointerdown' && pt === 'mouse');
  const kit = { allowResume: true, ctx: null, event: null };
  kit.fire = (target, type, pointerType) => {
    const ev = new Event(type); if (pointerType) ev.pointerType = pointerType;
    kit.event = ev; try { target.dispatchEvent(ev); } finally { kit.event = null; }
  };
  function FakeAC() { this.state = 'suspended'; this.currentTime = 0; this.sampleRate = 22050; this.destination = {}; this.silent = 0; this.resumes = 0; kit.ctx = this; }
  const node = () => ({ connect() {}, start() {}, stop() {}, gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
    frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} } });
  FakeAC.prototype.createGain = node; FakeAC.prototype.createOscillator = node; FakeAC.prototype.createBiquadFilter = node;
  FakeAC.prototype.createBuffer = (ch, len) => ({ length: len, getChannelData: () => new Float32Array(len) });
  FakeAC.prototype.createBufferSource = function () { const n = node(); n.start = () => { this.silent++; }; return n; };
  FakeAC.prototype.set = function (st) { this.state = st; if (this.onstatechange) this.onstatechange(); };
  FakeAC.prototype.resume = function () {
    this.resumes++;
    if (!kit.allowResume) return Promise.reject(new Error('needs a touch'));
    this.set('running'); return Promise.resolve();
  };
  class FakeEl {
    constructor(src) { this.src = src; this.paused = true; this.muted = false; this.volume = 1; this.currentTime = 0; this.plays = 0; this.heard = 0; this.unlocked = false; }
    play() {
      this.plays++;
      if (kit.event && ACTIVATION(kit.event.type, kit.event.pointerType)) this.unlocked = true;
      if (!this.muted && !this.unlocked) return Promise.reject(Object.assign(new Error('not allowed'), { name: 'NotAllowedError' }));
      this.paused = false; if (!this.muted && this.volume > 0) this.heard++;
      return Promise.resolve();
    }
    pause() { this.paused = true; }
    cloneNode() { return new FakeEl(this.src); }
  }
  kit.FakeAC = FakeAC; kit.FakeEl = FakeEl;
  kit.win = new EventTarget(); kit.doc = new EventTarget(); kit.doc.visibilityState = 'visible';
  return kit;
}
const flush = () => new Promise((r) => setTimeout(r, 0));

test('sound on phones: the rules for when to listen, when to restart, and what to prime', () => {
  for (const t of ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'mousedown', 'click', 'keydown']) assert.ok(S.AUDIO_UNLOCK_EVENTS.includes(t), t);
  assert.equal(S.audioUnlockDone('running', 0), true);
  assert.equal(S.audioUnlockDone('running', 1), false, 'a sound file still needs priming');
  assert.equal(S.audioUnlockDone('suspended', 0), false);
  assert.equal(S.audioUnlockDone('interrupted', 0), false);
  assert.equal(S.audioUnlockDone('not-started', 0), false, 'never stops listening before the first touch');
  assert.equal(S.audioUnlockDone('none', 0), true, 'a browser without WebAudio still gets its files primed');
  assert.equal(S.audioShouldResume('suspended', true), true);
  assert.equal(S.audioShouldResume('interrupted', true), true);
  assert.equal(S.audioShouldResume('suspended', false), false, 'not while the page is hidden');
  assert.equal(S.audioShouldResume('running', true), false);
  assert.equal(S.audioShouldResume('closed', true), false);
  const a = { paused: true }, b = { paused: true }, music = { paused: true }, playing = { paused: false };
  const done = new Set([b]);
  assert.deepEqual(S.primeTargets([a, b, music, playing], (e) => done.has(e), music, true), [a], 'skips primed, playing, and music that should be on');
  assert.deepEqual(S.primeTargets([a, music], () => false, music, false), [a, music], 'paused music (game paused) is primed');
});

test('sound on phones: a touch starts the engine, plays a silent sample, primes every file silently, then stops listening', async () => {
  const kit = fakeSoundKit();
  const sfx = new kit.FakeEl('jump.ogg'), song = new kit.FakeEl('music.ogg');
  song.volume = 0.6;
  const sounds = { 'sfx-jump': [sfx], 'music-level-01-central-park': [song] };
  const audio = S.createAudio({ AudioContext: kit.FakeAC, sounds });
  let gestures = 0;
  audio.attach({ win: kit.win, doc: kit.doc, onGesture: () => gestures++ });
  assert.equal(audio.status().armed, true);
  assert.equal(audio.status().state, 'not-started');
  // A finger goes down: the browser refuses (it only counts the finger lifting). No file is primed yet.
  kit.allowResume = false;
  kit.fire(kit.win, 'pointerdown', 'touch'); await flush();
  let st = audio.status();
  assert.equal(st.state, 'suspended'); assert.equal(st.armed, true, 'keeps listening');
  assert.equal(st.silentPlays, 1); assert.equal(st.primed, 0, 'not primed on a finger going down');
  // The finger lifts: allowed now.
  kit.allowResume = true;
  kit.fire(kit.win, 'touchend'); await flush();
  st = audio.status();
  assert.equal(st.elements, 5, 'jump sound gets 4 copies, music 1');
  assert.equal(st.state, 'running'); assert.equal(st.primed, 5); assert.equal(st.armed, false, 'stops listening');
  assert.equal(kit.ctx.silent, 2);
  assert.equal(sfx.heard + song.heard, 0, 'priming makes no sound');
  assert.equal(sfx.muted, false); assert.equal(song.muted, false); assert.equal(song.volume, 0.6, 'volume put back');
  assert.ok(sfx.paused && song.paused);
  assert.deepEqual(S.soundPlays, {}, 'priming is not counted as playing');
  kit.fire(kit.win, 'click'); await flush();
  assert.equal(gestures, 2, 'no more listening once sound is on');
});

test('sound on phones: only a key, a click or a finger lifting counts for sound files', () => {
  const yes = [['touchend'], ['click'], ['keydown'], ['mousedown'], ['pointerup', 'touch'], ['pointerup', 'pen'], ['pointerdown', 'mouse']];
  const no = [['touchstart'], ['pointerdown', 'touch'], ['pointerdown', 'pen'], ['pointerup', 'mouse'], ['pointerdown'], ['pointerup'], ['']];
  for (const [t, p] of yes) assert.equal(S.isActivationEvent(t, p), true, t + ' ' + p);
  for (const [t, p] of no) assert.equal(S.isActivationEvent(t, p), false, t + ' ' + p);
});

test('sound on phones: a finger going down (muted play allowed, but not a real activation) does not count; lifting it unlocks every file', async () => {
  const kit = fakeSoundKit();
  const sfx = new kit.FakeEl('jump.ogg'), song = new kit.FakeEl('music.ogg');
  const audio = S.createAudio({ AudioContext: kit.FakeAC, sounds: { 'sfx-jump': [sfx], 'music-level-01-central-park': [song] } });
  audio.attach({ win: kit.win, doc: kit.doc });
  kit.fire(kit.win, 'touchstart'); kit.fire(kit.win, 'pointerdown', 'touch'); await flush();
  assert.equal(audio.status().primed, 0, 'nothing primed'); assert.equal(audio.status().armed, true);
  kit.fire(kit.win, 'pointerup', 'touch'); kit.fire(kit.win, 'touchend'); kit.fire(kit.win, 'click'); await flush();
  const st = audio.status();
  assert.equal(st.elements, 5); assert.equal(st.primed, 5); assert.equal(st.armed, false);
  // Every file and copy is now really unlocked: later sounds, outside any touch, play with sound.
  audio.sfx('sfx-jump'); audio.music('level'); await flush();
  assert.ok(song.heard > 0, 'music heard');
  assert.equal(st.refused, 0);
  for (const k in S.soundPlays) delete S.soundPlays[k];
});

test('sound on phones: restarts after interruptions, but music waits for the game to unpause; mute silences every copy', async () => {
  const kit = fakeSoundKit();
  const sfx = new kit.FakeEl('jump.ogg'), song = new kit.FakeEl('music.ogg');
  const audio = S.createAudio({ AudioContext: kit.FakeAC, sounds: { 'sfx-jump': [sfx], 'music-level-01-central-park': [song] } });
  audio.attach({ win: kit.win, doc: kit.doc });
  kit.fire(kit.win, 'keydown'); await flush();
  assert.equal(audio.status().state, 'running', 'a key press on a computer starts sound at once');
  audio.music('level');
  assert.equal(song.paused, false); assert.ok(song.heard > 0, 'music plays');
  // Priming never stops music that is playing.
  audio.unlock(); assert.equal(song.paused, false);
  // Phone locked: the game pauses (music pauses), the engine is stopped. Nothing restarts while hidden.
  audio.music('pause'); kit.doc.visibilityState = 'hidden'; kit.ctx.set('suspended'); await flush();
  assert.equal(kit.ctx.state, 'suspended'); assert.equal(audio.status().armed, true);
  // Unlocked again: the engine restarts by itself, but the music stays paused with the game.
  kit.doc.visibilityState = 'visible'; kit.doc.dispatchEvent(new Event('visibilitychange')); await flush();
  assert.equal(kit.ctx.state, 'running'); assert.equal(song.paused, true, 'music waits for the unpause');
  audio.music('resume'); assert.equal(song.paused, false);
  // A phone call while playing (iPhone: 'interrupted'), and the browser wants a touch to restart: listen again.
  kit.allowResume = false; kit.ctx.set('interrupted'); song.pause(); await flush();
  assert.equal(audio.status().armed, true);
  kit.allowResume = true; kit.fire(kit.win, 'touchend'); await flush();
  assert.equal(kit.ctx.state, 'running'); assert.equal(song.paused, false, 'music the phone stopped mid-play carries on');
  // Mute: every file and every copy, even one that is playing right now.
  audio.sfx('sfx-jump');
  const copies = audio.status().elements;
  assert.equal(audio.toggleMute(), true);
  assert.equal(audio.status().mutedElements, copies);
  audio.sfx('sfx-jump');
  assert.equal(audio.toggleMute(), false);
  assert.equal(audio.status().mutedElements, 0);
  for (const k in S.soundPlays) delete S.soundPlays[k];
});

// ---------- art pipeline ----------
test('animation timings in config.js match frames / fps of their art strips', () => {
  const strip = (key) => S.ASSET_MANIFEST.find((m) => m.key === key);
  const len = (key) => strip(key).frames / strip(key).fps;
  const at = (key, field) => strip(key)[field] / strip(key).fps;
  // [config value, expected seconds, what it is]
  const table = [
    [C.sammy.attackTime, len('sammy:tail-whip'), 'sammy attackTime'],
    [C.sammy.attackHitStart, at('sammy:tail-whip', 'hitFrame'), 'sammy attackHitStart'],
    [C.sammy.attackHitEnd, (strip('sammy:tail-whip').hitFrame + 1) / strip('sammy:tail-whip').fps, 'sammy attackHitEnd'],
    [C.sammy.hurtTime, len('sammy:hurt'), 'sammy hurtTime'],
    [C.sammy.landTime, len('sammy:land'), 'sammy landTime'],
    [C.sammy.koTime, len('sammy:ko'), 'sammy koTime'],
    [C.possum.dropTime, len('sammy:play-dead'), 'possum dropTime'],
    [C.jogger.attackTime, len('jogger:attack'), 'jogger attackTime'],
    [C.jogger.attackHitStart, at('jogger:attack', 'hitFrame'), 'jogger attackHitStart'],
    [C.jogger.attackHitEnd, (strip('jogger:attack').hitFrame + 1) / strip('jogger:attack').fps, 'jogger attackHitEnd'],
    [C.jogger.hitReactTime, len('jogger:hit'), 'jogger hitReactTime'],
    [C.jogger.defeatTime, len('jogger:defeat'), 'jogger defeatTime'],
    [C.vendor.throwTime, len('vendor:throw'), 'vendor throwTime'],
    [C.vendor.releaseAt, at('vendor:throw', 'releaseFrame'), 'vendor releaseAt'],
    [C.vendor.hitReactTime, len('vendor:hit'), 'vendor hitReactTime'],
    [C.vendor.defeatTime, len('vendor:defeat'), 'vendor defeatTime'],
    [C.cart.tipTime, len('cart:tipping'), 'cart tipTime'],
  ];
  for (const [value, want, name] of table) {
    assert.ok(Number.isFinite(want), name + ': strip has the frame info');
    assert.ok(Math.abs(value - want) < 1e-9, `${name} is ${value}, art says ${want}`);
  }
});

test('art versions: the newest -vNN.png wins; older versions are not flagged as unused', async () => {
  const os = await import('node:os');
  const { scan } = await import('../tools/scan-assets.mjs');
  const { png } = await import('./png-writer.mjs');
  assert.equal(S.artFileVersion('a/sammy-run-strip-v01.png', 'sammy-run-strip-v12.PNG'), 12);
  assert.equal(S.artFileVersion('a/sammy-run-strip-v01.png', 'sammy-run-strip-v1.png'), 1);
  assert.equal(S.artFileVersion('a/sammy-run-strip-v01.png', 'sammy-run-strip.png'), null);
  assert.equal(S.artFileVersion('a/hot-dog-cart-upright-v01.png', 'hot-dog-cart-upright-strip-v01.png'), null);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sammy-art-scan-'));
  try {
    const put = (rel, buf) => { const f = path.join(tmp, 'assets', rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, buf); };
    const SAM = 'characters/character-sammy/';
    const clear = () => [0, 0, 0, 0];
    put(SAM + 'sammy-run-strip-v01.png', png(384, 48, clear));
    put(SAM + 'sammy-run-strip-v02.png', png(384, 48, clear));   // newer: wins
    put(SAM + 'sammy-idle-strip-v01.png', png(192, 48, clear));  // only version
    put(SAM + 'sammy-hurt-strip-v03.png', png(96, 48, clear));   // v03 alone still counts
    put(SAM + 'sammy-runn-strip-v01.png', png(384, 48, clear));  // misnamed
    const out = path.join(tmp, 'asset-files.js');
    const r = scan(tmp, out);
    assert.deepEqual(r.files, {
      [SAM + 'sammy-idle-strip-v01.png']: SAM + 'sammy-idle-strip-v01.png',
      [SAM + 'sammy-run-strip-v01.png']: SAM + 'sammy-run-strip-v02.png',
      [SAM + 'sammy-hurt-strip-v01.png']: SAM + 'sammy-hurt-strip-v03.png',
    });
    assert.deepEqual(r.older, [SAM + 'sammy-run-strip-v01.png']);
    assert.deepEqual(r.unused, [SAM + 'sammy-runn-strip-v01.png']);
    assert.deepEqual(r.warnings, [], 'right-size, clear images give no warnings');
    const ctx = { globalThis: {} }; ctx.globalThis = ctx; vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(out, 'utf8'), ctx);
    assert.equal(ctx.SAMMY.PRESENT_ASSET_FILES[SAM + 'sammy-run-strip-v01.png'], SAM + 'sammy-run-strip-v02.png');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('license gate: only commercial-use licenses ship; reasons and credits are reported', async () => {
  const { cleared, excludeReason, needsCredit, parseCsv } = await import('../tools/licenses.mjs');
  const row = (license, commercial_use, attribution_required = 'no') => ({ license, commercial_use, attribution_required });
  assert.equal(cleared(row('CC0', 'yes')), true);
  assert.equal(cleared(row('CC0', '')), false);
  assert.equal(cleared(row('CC-BY-NC 4.0', 'yes')), false);
  assert.equal(cleared(row('reference-only', 'yes')), false);
  assert.equal(cleared(row('Original work', 'yes')), true);
  assert.equal(cleared(row('CC-BY 4.0', ' Yes ')), true);
  assert.equal(cleared(row('Non-commercial only', 'yes')), false);
  assert.equal(cleared(row('TBD', 'yes')), false);
  assert.equal(cleared(row('CC0', 'maybe')), false);
  assert.equal(cleared(undefined), false);
  assert.match(excludeReason(undefined), /no row/);
  assert.match(excludeReason(row('CC0', '')), /commercial_use/);
  assert.match(excludeReason(row('', 'yes')), /license/);
  assert.match(excludeReason(row('CC-BY-NC 4.0', 'yes')), /non-commercial/);
  assert.equal(needsCredit(row('CC-BY 4.0', 'yes', 'YES')), true);
  assert.equal(needsCredit(row('CC0', 'yes', 'no')), false);
  const rows = parseCsv('asset_id,path,license,notes\r\nsammy-run,assets/a.png,"CC-BY 4.0","says ""hi"", ok"\n');
  assert.deepEqual(rows, [{ asset_id: 'sammy-run', path: 'assets/a.png', license: 'CC-BY 4.0', notes: 'says "hi", ok' }]);
  assert.deepEqual(parseCsv('asset_id,path\n'), []);
});

test('missing lists: every planned file without a real file is listed once, with its size, in a fixed order', async () => {
  const os = await import('node:os');
  const { scan, missingArtLines, missingSoundLines } = await import('../tools/scan-assets.mjs');
  const { png } = await import('./png-writer.mjs');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sammy-missing-'));
  try {
    const put = (rel, buf) => { const f = path.join(tmp, 'assets', rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, buf); };
    const SAM = 'characters/character-sammy/';
    put(SAM + 'sammy-run-strip-v02.png', png(384, 48, () => [0, 0, 0, 0]));
    put('audio/sfx/sfx-jump/sfx-jump-v01.wav', Buffer.alloc(0));
    const r = scan(tmp, path.join(tmp, 'asset-files.js'));
    assert.equal(r.missingArt.length, S.ASSET_MANIFEST.length - 1);
    assert.equal(r.missingSounds.length, S.SOUND_MANIFEST.length - 1);
    assert.ok(!r.missingArt.some((a) => a.path === 'assets/' + SAM + 'sammy-run-strip-v01.png'), 'found art is not missing');
    assert.ok(!r.missingSounds.some((m) => m.id === 'sfx-jump'), 'found sound is not missing');
    // Sizes are the whole strip: frame width x frames, by frame height.
    for (const a of r.missingArt) {
      const m = S.ASSET_MANIFEST.find((x) => 'assets/' + x.path === a.path);
      assert.equal(a.w, m.fw * m.frames); assert.equal(a.h, m.fh);
      assert.equal(a.folder + '/' + a.file, m.path);
    }
    const whip = r.missingArt.find((a) => a.file === 'sammy-tail-whip-strip-v01.png');
    assert.deepEqual([whip.w, whip.h], [256, 48]);
    assert.deepEqual(r.missingSounds.find((m) => m.id === 'sfx-land'),
      { id: 'sfx-land', kind: 'sfx', path: 'assets/audio/sfx/sfx-land/sfx-land-v01.ogg' });
    // Each folder appears as one block (files sharing a folder, like the hot dog pickup in the cart folder, stay together).
    const folders = r.missingArt.map((a) => a.folder).filter((f, i, all) => f !== all[i - 1]);
    assert.equal(new Set(folders).size, folders.length, 'no folder is split');
    assert.equal(folders[0], 'characters/character-sammy');
    // Printed lines: contract headings, one folder line per folder, then the files.
    const art = missingArtLines(r), snd = missingSoundLines(r);
    assert.equal(art[0], `Still missing — art (${r.missingArt.length}):`);
    assert.equal(art[1], '  assets/characters/character-sammy/');
    assert.ok(art.includes('    sammy-tail-whip-strip-v01.png  256×48'));
    assert.equal(art.length, 1 + folders.length + r.missingArt.length);
    assert.equal(snd[0], `Still missing — sounds (${r.missingSounds.length}):`);
    assert.ok(snd.includes('  assets/audio/sfx/sfx-land/sfx-land-v01.ogg'));
    // Same input, same output.
    const again = scan(tmp, path.join(tmp, 'asset-files.js'));
    assert.deepEqual(again.missingArt, r.missingArt);
    assert.deepEqual(again.missingSounds, r.missingSounds);
    // An empty library lists everything.
    const empty = scan(path.join(tmp, 'nothing-here'), path.join(tmp, 'asset-files.js'));
    assert.equal(empty.missingArt.length, S.ASSET_MANIFEST.length);
    assert.equal(empty.missingSounds.length, S.SOUND_MANIFEST.length);
    assert.deepEqual(missingArtLines({ missingArt: [] }), ['Still missing — art (0):']);
    assert.deepEqual(missingSoundLines({ missingSounds: [] }), ['Still missing — sounds (0):']);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('license row suggestions: new files get a blank row that will not ship; new versions copy the older row', async () => {
  const { suggestRow, parseCsv, cleared, CSV_COLUMNS } = await import('../tools/licenses.mjs');
  const header = CSV_COLUMNS.join(',') + '\n';
  const rows = parseCsv(header +
    'sammy-run-strip,assets/characters/character-sammy/sammy-run-strip-v01.png,Owner,,Original work,yes,no,"First art, drawn by hand"\n' +
    'sfx-land,assets/audio/sfx/sfx-land/sfx-land-v01-a.ogg,"Kit Co, Ltd",https://example.com/kit,CC-BY 4.0,yes,yes,ok\n');
  // A brand-new file: TBD license and blank commercial_use, so it is left out of the build.
  const fresh = suggestRow('assets/characters/character-sammy/sammy-idle-strip-v01.png', rows);
  assert.equal(fresh, 'sammy-idle-strip,assets/characters/character-sammy/sammy-idle-strip-v01.png,,,TBD,,,"New file; check every column"');
  assert.equal(cleared(parseCsv(header + fresh)[0]), false);
  // A newer version of a file that has a row: creator, source and license copied.
  const v2 = suggestRow('assets/characters/character-sammy/sammy-run-strip-v02.png', rows);
  assert.equal(v2, 'sammy-run-strip,assets/characters/character-sammy/sammy-run-strip-v02.png,Owner,,Original work,yes,no,' +
    '"Copied from assets/characters/character-sammy/sammy-run-strip-v01.png; check it still applies"');
  assert.equal(cleared(parseCsv(header + v2)[0]), true);
  // Sound variations match too; commas and quotes are quoted so the line reads back the same.
  const snd = parseCsv(header + suggestRow('assets/audio/sfx/sfx-land/sfx-land-v02-b.ogg', rows))[0];
  assert.equal(snd.asset_id, 'sfx-land');
  assert.equal(snd.creator, 'Kit Co, Ltd');
  assert.equal(snd.attribution_required, 'yes');
  const odd = parseCsv(header + suggestRow('assets/audio/sfx/sfx-hurt/sfx-hurt-v01.ogg',
    parseCsv(header + 'x,assets/audio/sfx/sfx-hurt/sfx-hurt-v00.ogg,"Ann ""AJ"" Lee",,CC0,yes,no,\n')))[0];
  assert.equal(odd.creator, 'Ann "AJ" Lee');
  assert.equal(odd.license, 'CC0');
  // Not tied to a different file whose name only starts the same way.
  assert.match(suggestRow('assets/characters/character-sammy/sammy-run-strip-x-v01.png', rows), /New file/);
});

test('PNG checks: size, colour profile, semi-transparency, off-grid colours, and bad files never crash', async () => {
  const { checkPng } = await import('../tools/png.mjs');
  const { png } = await import('./png-writer.mjs');
  const art = (x, y) => (x % 8 < 4 && y > 2 ? [36, 72, 216, 255] : x % 3 === 0 ? [252, 216, 0, 255] : [0, 0, 0, 0]);
  // Right size, all five row filters, RGBA and RGB: no warnings.
  assert.deepEqual(checkPng(png(32, 16, art, { filters: [0, 1, 2, 3, 4] }), 32, 16), []);
  assert.deepEqual(checkPng(png(32, 16, (x, y) => [x % 2 ? 252 : 36, y * 36 % 288 % 252, 108, 255], { colourType: 2, filters: [4, 3, 2, 1, 0] }), 32, 16), []);
  // Wrong size.
  const w = checkPng(png(30, 16, art), 32, 16);
  assert.equal(w.length, 1); assert.match(w[0], /wrong size: expected 32x16 px, got 30x16/);
  // Colour profile / gamma chunk.
  const gama = Buffer.alloc(4); gama.writeUInt32BE(45455);
  assert.ok(checkPng(png(32, 16, art, { chunks: [['gAMA', gama]] }), 32, 16).some((s) => /colour-profile.*gAMA/.test(s)));
  // Semi-transparent pixel.
  const semi = checkPng(png(32, 16, (x, y) => (x === 5 && y === 7 ? [36, 36, 36, 128] : art(x, y)), { filters: [4] }), 32, 16);
  assert.equal(semi.length, 1); assert.match(semi[0], /1 semi-transparent pixel\(s\), first at \(5, 7\)/);
  // Colour off the 9-bit grid.
  const off = checkPng(png(32, 16, (x, y) => (x === 9 && y === 3 ? [100, 72, 216, 255] : art(x, y)), { filters: [3] }), 32, 16);
  assert.equal(off.length, 1); assert.match(off[0], /off the 9-bit colour grid.*\(9, 3\) is 100,72,216/);
  // Too many colours for one palette line.
  assert.ok(checkPng(png(32, 16, (x) => [x % 8 * 36, Math.floor(x / 8) * 36, 0, 255]), 32, 16).some((s) => /32 solid colours/.test(s)));
  // Layouts not decoded, and broken files: a note, never a crash.
  assert.deepEqual(checkPng(png(32, 16, art, { interlace: 1 }), 32, 16), ['pixel checks skipped (unsupported PNG layout)']);
  assert.match(checkPng(Buffer.from('not a png at all'), 32, 16)[0], /could not read/);
  const good = png(32, 16, art);
  assert.ok(Array.isArray(checkPng(good.subarray(0, good.length - 30), 32, 16)));
  // Cut short after a good header: size is still checked, then the damage is reported.
  const cut = checkPng(png(100, 48, () => [36, 36, 36, 255]).subarray(0, 60), 192, 48);
  assert.equal(cut.length, 2); assert.match(cut[0], /wrong size: expected 192x48 px, got 100x48/); assert.match(cut[1], /could not read this PNG \(file is cut short\)/);
  assert.deepEqual(checkPng(good.subarray(0, 60), 32, 16), ['could not read this PNG (file is cut short)']);
  assert.ok(Array.isArray(checkPng(Buffer.alloc(0), 32, 16)));
});

// ---------- screen fitting (layout.js) ----------
const fitFor = (viewW, viewH, dpr, extra = {}) => S.computeFit(Object.assign({ viewW, viewH, dpr, gameW: C.screenW, gameH: C.screenH }, extra));
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-6, `${msg}: ${a} vs ${b}`);

test('screen fit: whole steps of real pixels on common phones, tablets and computers', () => {
  // [name, css width, css height, real pixels per css px, expected scale, expected css width, expected css height]
  const table = [
    ['iPhone SE landscape', 667, 375, 2, 3, 480, 336],
    ['iPhone SE portrait', 375, 667, 2, 2, 320, 224],
    ['iPhone 15 landscape', 852, 393, 3, 5, 1600 / 3, 1120 / 3],
    ['iPhone 15 portrait', 393, 852, 3, 3, 320, 224],
    ['Pixel 7 landscape', 915, 412, 2.625, 4, 1280 / 2.625, 896 / 2.625],
    ['iPad landscape', 1180, 820, 2, 7, 1120, 784],
    ['iPad portrait', 820, 1180, 2, 5, 800, 560],
    ['laptop', 1440, 900, 2, 8, 1280, 896],
    ['desktop 1920x1080', 1920, 1080, 1, 4, 1280, 896],
    ['desktop 1366x768', 1366, 768, 1, 3, 960, 672],
  ];
  for (const [name, w, h, dpr, scale, cssW, cssH] of table) {
    const f = fitFor(w, h, dpr);
    assert.equal(f.scale, scale, name + ' scale');
    near(f.cssW, cssW, name + ' css width'); near(f.cssH, cssH, name + ' css height');
    assert.equal(f.overflows, false, name);
    // Crisp: size and position are whole real pixels; centred to within one real pixel; nothing cut off.
    assert.equal(f.deviceW, C.screenW * scale); assert.equal(f.deviceH, C.screenH * scale);
    assert.ok(Number.isInteger(Math.round(f.cssLeft * dpr * 1e6) / 1e6) && Number.isInteger(Math.round(f.cssTop * dpr * 1e6) / 1e6), name + ' whole-pixel position');
    assert.ok(Math.abs((w - f.cssW) / 2 - f.cssLeft) <= 1 / dpr && Math.abs((h - f.cssH) / 2 - f.cssTop) <= 1 / dpr, name + ' centred');
    assert.ok(f.cssLeft >= 0 && f.cssTop >= 0 && f.cssLeft + f.cssW <= w + 1e-9 && f.cssTop + f.cssH <= h + 1e-9, name + ' fits on screen');
  }
  // The old way (whole steps of CSS points) left a big phone at x1: 320x224 of 852x393.
  const iphone = fitFor(852, 393, 3);
  assert.ok(iphone.cssH / 393 > 0.9, 'fills over 90% of the height of a landscape iPhone 15');
});

test('screen fit: room kept for on-screen buttons shrinks the game, and it is never smaller than x1', () => {
  // 100 css px kept free at the bottom of a landscape iPhone 15: 293 px tall left -> x3 (672 real px).
  const b = fitFor(852, 393, 3, { reserveBottom: 100 });
  assert.equal(b.scale, 3);
  assert.ok(b.cssTop + b.cssH <= 393 - 100 + 1e-9, 'stays above the kept space');
  near(b.cssTop, 104 / 3, 'centred in the space left');
  // Space kept on the left only: the game moves right, past it.
  const l = fitFor(852, 393, 3, { reserveLeft: 200 });
  assert.equal(l.scale, 5);
  assert.ok(l.cssLeft >= 200, 'right of the kept space');
  near(l.cssLeft, 778 / 3, 'centred in what is left');
  // Both sides: still centred on the screen.
  const lr = fitFor(852, 393, 3, { reserveLeft: 150, reserveRight: 150 });
  assert.equal(lr.scale, 5); near(lr.cssLeft, 478 / 3, 'centred');
  // Desktop 1920x1080 with 200 px kept at the bottom: 880 tall -> x3.
  assert.equal(fitFor(1920, 1080, 1, { reserveBottom: 200 }).scale, 3);
  // Defaults: no reserve given is the same as zero.
  assert.deepEqual(fitFor(852, 393, 3, { reserveBottom: 0, reserveLeft: 0, reserveRight: 0 }), fitFor(852, 393, 3));
});

test('screen fit: tiny or odd screens never go below x1 and keep the top-left (HUD) on screen', () => {
  const tiny = fitFor(100, 50, 1);
  assert.equal(tiny.scale, 1); assert.equal(tiny.overflows, true);
  assert.equal(tiny.cssLeft, 0); assert.equal(tiny.cssTop, 0);
  assert.equal(fitFor(0, 0, 2).scale, 1);
  assert.equal(fitFor(852, 393, 3, { reserveBottom: 1000 }).scale, 1, 'reserve bigger than the screen');
  assert.equal(fitFor(640, 448, 0).scale, 2, 'missing pixel ratio is read as 1');
  // Exact fits are not lost to rounding: 320x224 at 1.5 real px per css px = 480x336 real px -> x1; 640x448@1 -> x2.
  assert.equal(fitFor(320, 224, 1.5).scale, 1);
  assert.equal(fitFor(1280, 896, 1).scale, 4);
  assert.equal(fitFor(1920 / 3, 1344 / 3, 3).scale, 6);
});

// ---------- on-screen touch buttons (layout.js) ----------
const touchFor = (viewW, viewH, dpr, safe) => S.touchLayout({ viewW, viewH, dpr, gameW: C.screenW, gameH: C.screenH, safe });
const TOUCH_DEVICES = [
  // [name, css width, css height, real px per css px, expected picture scale]
  ['iPhone SE landscape', 667, 375, 2, 3], ['iPhone SE portrait', 375, 667, 2, 2],
  ['iPhone 15 landscape', 852, 393, 3, 5], ['iPhone 15 portrait', 393, 852, 3, 3],
  ['Pixel 7 landscape', 915, 412, 2.625, 4], ['iPad landscape', 1180, 820, 2, 6], ['iPad portrait', 820, 1180, 2, 5],
];
// Checks every rule for one layout: thumb-sized, on screen and clear of notches, not on top of each other,
// and covering only the allowed bottom corners of the picture (never the HUD or the middle).
function checkTouchLayout(name, L, w, h, dpr, safe = {}) {
  const c = L.controls, f = L.fit, s = f.scale / dpr; // css px per game px
  const play = ['pad', 'jump', 'whip', 'possum', 'pause'];
  for (const n of play) {
    const r = c[n];
    assert.ok(Math.min(r.w, r.h) >= (n === 'pause' ? 44 : 56) - 1e-9, `${name}: ${n} is thumb-sized (${r.w.toFixed(0)}x${r.h.toFixed(0)})`);
    assert.ok(r.x >= (safe.left || 0) && r.y >= (safe.top || 0) && r.x + r.w <= w - (safe.right || 0) + 1e-9 && r.y + r.h <= h - (safe.bottom || 0) + 1e-9, `${name}: ${n} on screen, clear of notches`);
    // Sharp: whole real pixels, and a whole number of real pixels per button pixel.
    for (const v of [r.dev.x, r.dev.y, r.dev.w, r.dev.h]) assert.ok(Number.isInteger(v), `${name}: ${n} on whole real pixels`);
    assert.ok(Number.isInteger(r.artW) && Number.isInteger(r.artH), `${name}: ${n} whole button pixels`);
    // Overlap with the picture only inside the allowed corners.
    const x0 = Math.max(r.x, f.cssLeft), x1 = Math.min(r.x + r.w, f.cssLeft + f.cssW), y0 = Math.max(r.y, f.cssTop), y1 = Math.min(r.y + r.h, f.cssTop + f.cssH);
    if (x0 < x1 - 1e-9 && y0 < y1 - 1e-9) {
      const g = { x0: (x0 - f.cssLeft) / s, x1: (x1 - f.cssLeft) / s, y0: (y0 - f.cssTop) / s, y1: (y1 - f.cssTop) / s };
      assert.ok(S.TOUCH_CORNERS.some((z) => g.x0 >= z.x0 - 1e-6 && g.x1 <= z.x1 + 1e-6 && g.y0 >= z.y0 - 1e-6 && g.y1 <= z.y1 + 1e-6),
        `${name}: ${n} covers only a bottom corner of the picture (${JSON.stringify(g)})`);
      assert.ok(g.y0 >= 128, `${name}: ${n} keeps clear of the HUD`);
    }
  }
  // FULL SCREEN button: next to PAUSE, off the picture, clear of notches, touching no other button (menu ones included).
  const fb = c.full;
  assert.ok(fb, `${name}: has a full-screen button`);
  assert.ok(fb.x >= (safe.left || 0) && fb.y >= (safe.top || 0) && fb.x + fb.w <= w - (safe.right || 0) + 1e-9 && fb.y + fb.h <= h - (safe.bottom || 0) + 1e-9, `${name}: full-screen button on screen, clear of notches`);
  assert.equal(fb.over, false, `${name}: full-screen button off the picture`);
  assert.ok(Math.min(fb.w, fb.h) >= 44 - 1e-9, `${name}: full-screen button big enough`);
  for (const n of Object.keys(c).filter((n) => n !== 'full')) {
    const b = c[n];
    assert.ok(fb.x + fb.w <= b.x + 1e-9 || b.x + b.w <= fb.x + 1e-9 || fb.y + fb.h <= b.y + 1e-9 || b.y + b.h <= fb.y + 1e-9, `${name}: full-screen button and ${n} don't overlap`);
  }
  // The picture stays clear of notches, rounded corners and the home bar.
  assert.ok(f.cssLeft >= (safe.left || 0) - 1e-9 && f.cssTop >= (safe.top || 0) - 1e-9 && f.cssLeft + f.cssW <= w - (safe.right || 0) + 1e-9 &&
    f.cssTop + f.cssH <= h - (safe.bottom || 0) + 1e-9, `${name}: picture clear of notches`);
  for (let i = 0; i < play.length; i++) for (let j = i + 1; j < play.length; j++) {
    const a = c[play[i]], b = c[play[j]];
    assert.ok(a.x + a.w <= b.x + 1e-9 || b.x + b.w <= a.x + 1e-9 || a.y + a.h <= b.y + 1e-9 || b.y + b.h <= a.y + 1e-9, `${name}: ${play[i]} and ${play[j]} don't overlap`);
  }
  // Left thumb: the pad on the left half; right thumb: the action buttons on the right half.
  assert.ok(c.pad.x + c.pad.w <= w / 2 && ['jump', 'whip', 'possum'].every((n) => c[n].x >= w / 2), `${name}: pad left, actions right`);
  // Pause menu: sideways, RESTART and MUTE sit over the picture under the PAUSED panel; upright, they sit in the empty
  // band below the picture (the small picture stays visible) without touching PAUSE. Always side by side.
  assert.ok(c.mute.x >= c.restart.x + c.restart.w, `${name}: RESTART and MUTE side by side`);
  if (L.orientation === 'landscape') {
    assert.ok(c.restart.y >= f.cssTop + 131 * s && c.restart.y + c.restart.h <= f.cssTop + f.cssH + 1e-9, `${name}: pause menu under the panel`);
  } else {
    for (const n of ['restart', 'mute']) {
      const r = c[n], p = c.pause;
      assert.ok(r.y >= f.cssTop + f.cssH - 1e-9, `${name}: ${n} below the picture`);
      assert.ok(r.x >= 0 && r.x + r.w <= w + 1e-9, `${name}: ${n} on screen`);
      assert.ok(r.x + r.w <= p.x + 1e-9 || p.x + p.w <= r.x + 1e-9 || r.y + r.h <= p.y + 1e-9 || p.y + p.h <= r.y + 1e-9, `${name}: ${n} doesn't cover PAUSE`);
    }
  }
  // Picture still sharp: whole steps, whole real-pixel position.
  assert.ok(Number.isInteger(Math.round(f.cssLeft * dpr * 1e6) / 1e6) && Number.isInteger(Math.round(f.cssTop * dpr * 1e6) / 1e6), `${name}: picture on whole real pixels`);
}

test('touch layout: thumb-sized buttons that cover only the bottom corners, at the biggest picture size', () => {
  for (const [name, w, h, dpr, scale] of TOUCH_DEVICES) {
    const L = touchFor(w, h, dpr);
    checkTouchLayout(name, L, w, h, dpr);
    assert.equal(L.fit.scale, scale, name + ' keeps the biggest picture');
    if (L.orientation === 'portrait') {
      // Portrait: picture centred in the space above the buttons (not stuck to the top with a big empty gap under it),
      // every button below it.
      // (Space above the picture = space between PAUSE, just under the picture, and the other buttons.)
      const clusterTop = Math.min(...['pad', 'whip', 'possum'].map((n) => L.controls[n].y)), P = L.controls.pause;
      const below = clusterTop - (P.y + P.h) - (P.y - L.fit.cssTop - L.fit.cssH);
      assert.ok(L.fit.cssTop > 0 && Math.abs(L.fit.cssTop - below) <= 2, `${name}: picture centred above the buttons (${L.fit.cssTop} vs ${below})`);
      for (const n of ['pad', 'jump', 'whip', 'possum', 'pause']) assert.ok(L.controls[n].y >= L.fit.cssTop + L.fit.cssH, `${name}: ${n} below the picture`);
    }
  }
  // Sideways, the PAUSED box grows to hold RESTART and MUTE, staying inside the picture.
  for (const [name, w, h, dpr] of TOUCH_DEVICES) {
    const L = touchFor(w, h, dpr), mp = L.menuPanel;
    if (L.orientation === 'portrait') { assert.equal(mp, null); continue; }
    const s = L.fit.scale / dpr, gx = (v) => (v - L.fit.cssLeft) / s, gy = (v) => (v - L.fit.cssTop) / s;
    assert.ok(mp.x0 >= 1 && mp.x1 <= C.screenW - 1 && mp.y1 <= C.screenH - 1 && mp.x0 <= 100 && mp.x1 >= 220 && mp.y0 === 80, name + ' menu panel');
    for (const n of ['restart', 'mute']) {
      const r = L.controls[n];
      assert.ok(gx(r.x) >= mp.x0 && gx(r.x + r.w) <= mp.x1 && gy(r.y + r.h) <= mp.y1, `${name}: ${n} inside the PAUSED box`);
    }
  }
  // iPhone SE sideways: the picture sits as low as the corner rule allows rather than stuck to the top edge.
  assert.ok(touchFor(667, 375, 2).fit.cssTop > 0, 'SE landscape picture not pinned to the top');
  // Landscape iPhone 15: no play button touches the picture at all (the action buttons stack in the right-hand strip).
  const i15 = touchFor(852, 393, 3);
  assert.deepEqual(['pad', 'jump', 'whip', 'possum', 'pause'].filter((n) => i15.controls[n].over), []);
});

test('touch layout: notches push buttons inward, and too-narrow sides shrink the picture one step instead of covering it', () => {
  // iPhone 15 sideways with its notch and home bar margins.
  const safe = { left: 59, right: 59, bottom: 21 };
  const n = touchFor(852, 393, 3, safe);
  checkTouchLayout('iPhone 15 landscape with notch', n, 852, 393, 3, safe);
  // The notch margins leave too little black at the sides for a thumb-sized pad at x5 without covering the grass lane,
  // so the picture is one step smaller.
  assert.equal(n.fit.scale, 4);
  // Upright with a notch at the top: the picture moves below the notch.
  const p = touchFor(393, 852, 3, { top: 59, bottom: 34 });
  checkTouchLayout('iPhone 15 portrait with notch', p, 393, 852, 3, { top: 59, bottom: 34 });
  assert.ok(p.fit.cssTop >= 59);
  // Narrow black sides: the full-size picture would put buttons over the middle,
  // so it shrinks one step (and stays sharp).
  // (680x470 at 1 real px per point: x2 leaves only 20 px at each side.)
  const narrow = touchFor(680, 470, 1);
  assert.equal(narrow.maxScale, 2); assert.equal(narrow.fit.scale, 1);
  checkTouchLayout('narrow-sided screen', narrow, 680, 470, 1);
  // computeFit's maxScale limit.
  assert.equal(S.computeFit({ viewW: 1920, viewH: 1080, dpr: 1, gameW: 320, gameH: 224, maxScale: 3 }).scale, 3);
});

test('touch wording: every touch prompt and screen line fits on the screen', () => {
  for (const pr of S.LEVEL1.prompts) assert.ok(S.textWidth(pr.touch || pr.text) + 8 <= C.screenW - 8, pr.touch || pr.text);
  assert.ok(S.LEVEL1.prompts.filter((p) => p.touch).length >= 3, 'move/jump, whip and possum prompts have touch wording');
  for (const mode of ['keys', 'touch']) for (const k in S.TEXT[mode]) assert.ok(S.textWidth(S.TEXT[mode][k]) <= 232, `${mode}.${k} fits in the title panel`);
  assert.equal(S.TEXT.touch.start, 'TAP JUMP TO START');
});

// ---------- notches, rounded corners and the home bar (safe areas) ----------
// Typical margins phones report (CSS px). iPhones: notch or Dynamic Island + home bar; Pixel: a camera hole in one corner.
const SAFE = {
  'iPhone 15 landscape': [852, 393, 3, { left: 59, right: 59, bottom: 21 }],
  'iPhone 15 portrait': [393, 852, 3, { top: 59, bottom: 34 }],
  'iPhone SE landscape': [667, 375, 2, {}],
  'Pixel 7 landscape (camera on the left)': [915, 412, 2.625, { left: 32 }],
  'Pixel 7 portrait': [412, 915, 2.625, { top: 32 }],
  'iPad landscape': [1180, 820, 2, { bottom: 20 }],
  'iPad portrait': [820, 1180, 2, { top: 24, bottom: 20 }],
};

test('notches: without the buttons, the picture keeps clear of notches and the home bar, centred in the space left', () => {
  // iPhone 15 sideways: the home bar takes 21 px at the bottom, so x5 (373 px tall) no longer fits in 372: x4.
  const i15 = fitFor(852, 393, 3, { safe: { left: 59, right: 59, bottom: 21 } });
  assert.equal(i15.scale, 4);
  near(i15.cssTop, Math.round((372 * 3 - 896) / 2) / 3, 'centred above the home bar');
  for (const [name, [w, h, dpr, safe]] of Object.entries(SAFE)) {
    const f = fitFor(w, h, dpr, { safe });
    assert.ok(f.cssLeft >= (safe.left || 0) - 1e-9 && f.cssTop >= (safe.top || 0) - 1e-9 && f.cssLeft + f.cssW <= w - (safe.right || 0) + 1e-9 &&
      f.cssTop + f.cssH <= h - (safe.bottom || 0) + 1e-9, name + ': clear of notches');
    assert.ok(Number.isInteger(Math.round(f.cssLeft * dpr * 1e6) / 1e6) && Number.isInteger(Math.round(f.cssTop * dpr * 1e6) / 1e6), name + ': whole real pixels');
    // Centred in the notch-free part (to within one real pixel).
    const midX = ((safe.left || 0) + w - (safe.right || 0)) / 2, midY = ((safe.top || 0) + h - (safe.bottom || 0)) / 2;
    assert.ok(Math.abs(f.cssLeft + f.cssW / 2 - midX) <= 1 / dpr + 1e-9 && Math.abs(f.cssTop + f.cssH / 2 - midY) <= 1 / dpr + 1e-9, name + ': centred');
  }
  // A camera hole on one side only: the picture moves over, away from it.
  const px = fitFor(915, 412, 2.625, { safe: { left: 32 } });
  assert.ok(px.cssLeft > fitFor(915, 412, 2.625).cssLeft, 'Pixel 7: picture moves away from the camera');
  // Computers report no margins: exactly as before.
  for (const [w, h, dpr] of [[1920, 1080, 1], [1366, 768, 1], [1440, 900, 2]]) {
    assert.deepEqual(fitFor(w, h, dpr, { safe: { top: 0, right: 0, bottom: 0, left: 0 } }), fitFor(w, h, dpr));
  }
});

test('notches: with the touch buttons on, the picture and every button keep clear of them on every phone and tablet', () => {
  for (const [name, [w, h, dpr, safe]] of Object.entries(SAFE)) {
    const L = touchFor(w, h, dpr, safe);
    checkTouchLayout(name + ' with notch margins', L, w, h, dpr, safe);
    for (const n of ['restart', 'mute']) {
      const r = L.controls[n];
      assert.ok(r.x >= (safe.left || 0) && r.y >= (safe.top || 0) && r.x + r.w <= w - (safe.right || 0) + 1e-9 && r.y + r.h <= h - (safe.bottom || 0) + 1e-9, `${name}: ${n} clear of notches`);
    }
  }
});

test('sideways message: shown only upright, only with the touch buttons on, until put away', () => {
  assert.equal(S.isPortrait(393, 852), true); assert.equal(S.isPortrait(852, 393), false); assert.equal(S.isPortrait(500, 500), false);
  const ask = (viewW, viewH, touch, dismissed) => S.needsSidewaysPrompt({ viewW, viewH, touch, dismissed });
  assert.equal(ask(393, 852, true, false), true, 'upright phone with touch buttons');
  assert.equal(ask(375, 667, true, false), true, 'upright iPhone SE');
  assert.equal(ask(412, 915, true, false), true, 'upright Pixel 7');
  assert.equal(ask(440, 956, true, false), true, 'upright big phone');
  assert.equal(ask(820, 1180, true, false), false, 'upright iPad: plays upright, no message');
  assert.equal(ask(744, 1133, true, false), false, 'upright iPad mini');
  assert.equal(ask(600, 960, true, false), false, 'upright small tablet');
  assert.equal(ask(852, 393, true, false), false, 'sideways phone');
  assert.equal(ask(393, 852, true, true), false, 'after PLAY UPRIGHT ANYWAY');
  assert.equal(ask(393, 852, false, false), false, 'a narrow computer window (no touch buttons)');
  for (const [w, h] of [[1920, 1080], [1366, 768], [1440, 900]]) assert.equal(ask(w, h, false, false), false, 'computer');
});

test('sideways message: the card is big, sharp, centred and clear of notches on every upright screen', () => {
  const card = (w, h, dpr, safe) => S.promptLayout({ viewW: w, viewH: h, dpr, safe, artW: 168, artH: 126, maxW: 520 });
  for (const [name, w, h, dpr, safe] of [['iPhone SE', 375, 667, 2, {}], ['iPhone 15', 393, 852, 3, { top: 59, bottom: 34 }],
    ['Pixel 7', 412, 915, 2.625, { top: 32 }], ['iPad', 820, 1180, 2, { top: 24, bottom: 20 }], ['tiny', 200, 300, 1, {}]]) {
    const L = card(w, h, dpr, safe);
    assert.ok(Number.isInteger(L.k) && L.k >= 1, name + ': whole real pixels per card pixel');
    for (const v of [L.dev.x, L.dev.y, L.dev.w, L.dev.h]) assert.ok(Number.isInteger(v), name + ': on whole real pixels');
    assert.ok(L.x >= (safe.left || 0) - 1e-9 && L.y >= (safe.top || 0) - 1e-9 && L.x + L.w <= w - (safe.right || 0) + 1e-9 && L.y + L.h <= h - (safe.bottom || 0) + 1e-9, name + ': on screen, clear of notches');
    assert.ok(L.w <= 520 + 1e-9, name + ': not oversized');
    // Phones: most of the width. Tablets: capped at 520 points so it isn't huge (still at least 400).
    if (name !== 'tiny') assert.ok(L.w >= Math.min(w * 0.75, 400), `${name}: big enough (${L.w.toFixed(0)} of ${w})`);
  }
  assert.equal(card(393, 852, 3, {}).k, 6);
  assert.equal(card(375, 667, 2, {}).k, 4);
});

// ---- art templates (tools/make-art-templates.mjs) ----
const libRoot = path.join(here, '..', '..');
const artTemplates = path.join(libRoot, 'templates', 'art-templates');
const listPngs = (dir) => {
  const out = [];
  const walk = (d) => { for (const n of fs.readdirSync(d).sort()) { const p = path.join(d, n); if (fs.statSync(p).isDirectory()) walk(p); else if (n.endsWith('.png')) out.push(path.relative(dir, p).split(path.sep).join('/')); } };
  walk(dir);
  return out;
};

test('art templates: every planned picture has a template of the exact size, outside assets/, and in a contact sheet', async () => {
  const T = await import('../tools/make-art-templates.mjs');
  const { readChunks } = await import('../tools/png.mjs');
  assert.equal(S.ASSET_MANIFEST.length, 34);
  for (const m of S.ASSET_MANIFEST) {
    const rel = T.templatePath(m);
    assert.match(rel, /-TEMPLATE\.png$/);
    assert.equal(S.artFileVersion(m.path, path.posix.basename(rel)), null, 'a template name must never look like real art: ' + rel);
    const file = path.join(artTemplates, rel);
    assert.ok(fs.existsSync(file), 'missing template (run node tools/make-art-templates.mjs): ' + rel);
    const info = readChunks(fs.readFileSync(file));
    assert.deepEqual([info.width, info.height], [m.fw * m.frames, m.fh], rel);
    assert.ok(T.groupOf(m), m.key);
  }
  for (const g of T.GROUPS.map((x) => x.id).concat('all')) {
    const f = path.join(artTemplates, `contact-sheet-${g}.png`);
    assert.ok(fs.existsSync(f), 'missing ' + f);
    assert.ok(fs.statSync(f).size < 1024 * 1024, f + ' should stay under 1 MB');
  }
});

test('art templates: guide marks are only half see-through, so the scanner flags a guide left in', async () => {
  const T = await import('../tools/make-art-templates.mjs');
  const { checkPng, readChunks, decodePixels } = await import('../tools/png.mjs');
  for (const m of S.ASSET_MANIFEST) {
    const buf = T.templatePng(m);
    const px = decodePixels(readChunks(buf));
    let semi = 0;
    for (let i = 3; i < px.length; i += 4) { assert.notEqual(px[i], 255, m.key + ': a guide pixel is fully solid'); if (px[i]) semi += 1; }
    assert.ok(semi > 0, m.key + ' has guide marks');
    const warns = checkPng(buf, m.fw * m.frames, m.fh);
    assert.ok(warns.some((w) => /semi-transparent/.test(w)), m.key);
    assert.ok(!warns.some((w) => /wrong size/.test(w)), m.key);
  }
  // Hit / release frames and loop edges get their own colours; floating things get no ground line.
  const kinds = (key) => new Set(T.guideMarks(S.ASSET_MANIFEST.find((m) => m.key === key)).map((k) => k[2]));
  assert.ok(kinds('sammy:tail-whip').has('hit') && kinds('jogger:attack').has('hit') && kinds('vendor:throw').has('release'));
  assert.ok(kinds('bg:skyline').has('seam') && !kinds('bg:sky').has('seam'));
  assert.ok(!kinds('projectile:hotdog').has('ground') && kinds('sammy:idle').has('ground'));
});

test('art templates: making them again gives the same pictures; old ones are cleaned up; never writes into assets/', async () => {
  const T = await import('../tools/make-art-templates.mjs');
  const { readChunks, decodePixels } = await import('../tools/png.mjs');
  const tmp = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'sammy-templates-'));
  try {
    const a = path.join(tmp, 'a'), b = path.join(tmp, 'b');
    fs.mkdirSync(path.join(a, 'old'), { recursive: true });
    fs.writeFileSync(path.join(a, 'old', 'gone-TEMPLATE.png'), 'x');
    fs.writeFileSync(path.join(a, 'contact-sheet-gone.png'), 'x');
    fs.writeFileSync(path.join(a, 'keep-me.txt'), 'x');
    const r = T.makeTemplates(a);
    assert.equal(r.removed.length, 2);
    assert.ok(fs.existsSync(path.join(a, 'keep-me.txt')) && !fs.existsSync(path.join(a, 'old')));
    T.makeTemplates(b);
    const files = listPngs(a);
    assert.deepEqual(files, listPngs(b));
    assert.deepEqual(files, listPngs(artTemplates), 'templates/art-templates/ is out of date: run node tools/make-art-templates.mjs');
    for (const f of files) {
      const fa = fs.readFileSync(path.join(a, f));
      assert.ok(fa.equals(fs.readFileSync(path.join(b, f))), 'same bytes every run: ' + f);
      // Same pixels as the saved copies (compared as pixels, so a different Node zlib can't fail it).
      const ia = readChunks(fa), ir = readChunks(fs.readFileSync(path.join(artTemplates, f)));
      assert.ok([ia.width, ia.height].join() === [ir.width, ir.height].join() && Buffer.from(decodePixels(ia)).equals(Buffer.from(decodePixels(ir))),
        'templates/art-templates/ is out of date (run node tools/make-art-templates.mjs): ' + f);
    }
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  for (const bad of [path.join(libRoot, 'assets'), path.join(libRoot, 'assets', 'templates'), path.join(libRoot, 'ASSETS', 'x')]) {
    assert.throws(() => T.makeTemplates(bad), /inside assets/);
  }
  assert.ok(!fs.existsSync(path.join(libRoot, 'assets', 'templates')));
});

// ---------- the "Zombie Hunter" direction: theme song, concept picture, README art ----------
test('theme song: found in the real library as the level music (started by the first press on the title screen, kept through the gauntlet), but held out of the build until its Suno plan is confirmed', async () => {
  const { scan } = await import('../tools/scan-assets.mjs');
  const { parseCsv, excludeReason, cleared } = await import('../tools/licenses.mjs');
  const song = 'audio/music/music-level-01-central-park/music-level-01-central-park-v01.mp3';
  assert.ok(fs.existsSync(path.join(libRoot, 'assets', song)), 'song file is in assets/');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sammy-song-'));
  try {
    const r = scan(libRoot, path.join(tmp, 'asset-files.js')); // reads the real library, writes only to the temp folder
    assert.deepEqual(r.sounds['music-level-01-central-park'], [song], 'the scanner lists it, so the game loads it');
    assert.ok(!r.unusedSounds.includes(song), 'its name is recognised');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  assert.equal(S.MUSIC_TRACKS.level[0], 'music-level-01-central-park', 'level track');
  assert.ok(S.MUSIC_TRACKS.arena.includes('music-level-01-central-park'), 'the gauntlet falls back to it');
  // Starting the game from the title screen asks for the level track on that same key press (one press: sound unlock + start + song).
  const s = S.newGame();
  step(s, { pressed: { jump: true } });
  assert.equal(s.mode, 'playing');
  assert.ok(events(s).includes('level'), 'first press starts the level music');
  const rows = parseCsv(fs.readFileSync(path.join(libRoot, 'design', 'ASSET_SOURCES.csv'), 'utf8'));
  const row = rows.find((x) => x.path === 'assets/' + song);
  assert.ok(row, 'has a license row');
  assert.equal(row.creator, 'themodernopossum');
  assert.match(row.source_url, /Suno/);
  // Until the owner confirms a paid Suno plan (question 21), the row keeps it out of the build and says why.
  if (!cleared(row)) assert.match(excludeReason(row), /commercial_use/, 'the build says why');
  else assert.equal(row.commercial_use.toLowerCase(), 'yes');
});

test('concept picture: kept in assets/references (never shipped), explained in its README, and not cleared by any license row', async () => {
  const { parseCsv, cleared } = await import('../tools/licenses.mjs');
  const ref = path.join(libRoot, 'assets', 'references');
  const jpg = fs.readFileSync(path.join(ref, 'zombie-hunter-concept-v01.jpg'));
  assert.equal(jpg[0], 0xff); assert.equal(jpg[1], 0xd8, 'a JPEG');
  const readme = fs.readFileSync(path.join(ref, 'README.md'), 'utf8');
  assert.match(readme, /zombie-hunter-concept-v01\.jpg/);
  assert.match(readme, /mood and direction only/i);
  const rows = parseCsv(fs.readFileSync(path.join(libRoot, 'design', 'ASSET_SOURCES.csv'), 'utf8'));
  for (const r of rows.filter((x) => x.path.startsWith('assets/references/'))) assert.equal(cleared(r), false, r.path);
  assert.match(fs.readFileSync(path.join(here, '..', 'tools', 'build.mjs'), 'utf8'), /startsWith\('references\/'\)/, 'the build skips references/');
});

test('README art: three self-contained pixel-art SVGs with a title and description, and cast captions that match the game', () => {
  const dir = path.join(libRoot, '.github', 'readme');
  const sizes = { 'banner.svg': [1280, 420], 'cast.svg': [1280, 320], 'play-possum.svg': [1280, 160] };
  for (const [f, [w, h]] of Object.entries(sizes)) {
    const svg = fs.readFileSync(path.join(dir, f), 'utf8');
    assert.ok(svg.includes(`viewBox="0 0 ${w} ${h}"`), f + ' size');
    assert.ok(svg.includes('<title') && svg.includes('<desc'), f + ' has a title and description');
    for (const bad of ['<text', '<image', '<script', 'href', 'url(', 'opacity']) assert.ok(!svg.includes(bad), f + ' has no ' + bad);
    assert.ok(svg.length < 300 * 1024, f + ' stays small');
  }
  const cast = fs.readFileSync(path.join(dir, 'cast.svg'), 'utf8').toLowerCase();
  for (const who of ['Sammy', 'Zombie Jogger', 'Hot Dog Vendor', 'Chainsaw', 'Hot Dog Cart', 'Trash Lid Shield']) assert.ok(cast.includes(who.toLowerCase()), 'cast description names ' + who);
  // The captions are drawn as outlines, so check the picture's description and the README alt text say the
  // same facts, and that those facts match the game's numbers.
  const readme = fs.readFileSync(path.join(libRoot, 'README.md'), 'utf8');
  const alt = (readme.match(/<img src="\.github\/readme\/cast\.svg" alt="([^"]*)"/) || [])[1] || '';
  for (const [where, text] of [['cast.svg description', (cast.match(/<desc[^>]*>([\s\S]*?)<\/desc>/) || [])[1] || ''], ['README cast alt text', alt.toLowerCase()]]) {
    for (const fact of ['blocks 3 hits', 'two whips tip it', '3 healing hot dogs', 'lobs hot dogs from afar', 'coming next']) {
      assert.ok(text.includes(fact), where + ' says "' + fact + '"');
    }
    for (const wrong of ['then bites', 'blocks one hit', 'rip and tear', 'until it isn']) assert.ok(!text.includes(wrong), where + ' does not say "' + wrong + '"');
  }
  assert.equal(C.lid.hits, 3, 'the lid blocks 3 hits');
  assert.equal(C.cart.spillCount, 3, 'the cart spills 3 hot dogs');  // (two whips tipping the cart is checked by the cart tests: upright -> rocking -> tipping)
});

test('night look: every palette colour is on the 9-bit grid, and the HUD and panels stand out from the night sky', () => {
  const K = S.PAL;
  const grid = new Set([0, 36, 72, 108, 144, 180, 216, 252]);
  for (const [k, v] of Object.entries(K)) {
    assert.match(v, /^#[0-9a-f]{6}$/, k);
    for (let i = 1; i < 7; i += 2) assert.ok(grid.has(parseInt(v.slice(i, i + 2), 16)), `${k} ${v} is on the 9-bit grid`);
  }
  for (const k of ['moon', 'star', 'window', 'lampGlow', 'lampHalo', 'stone', 'stoneMid', 'stoneLight', 'leaf0', 'blood', 'ichor']) assert.ok(K[k], 'night colour ' + k);
  assert.notEqual(K.hud, K.sky0, 'HUD bar is not the same colour as the top of the sky');
  assert.notEqual(K.hudHi, K.hud, 'panel highlight stripe shows');
  const lum = (v) => parseInt(v.slice(1, 3), 16) + parseInt(v.slice(3, 5), 16) + parseInt(v.slice(5, 7), 16);
  assert.ok(lum(K.grass) > lum(K.trees), 'walking lane is lighter than the trees behind it');
  // Gore colours are reserved: nothing else may use them.
  const reserved = new Set(['blood0', 'blood', 'bloodHi', 'ichor0', 'ichor', 'ichorHi']);
  for (const [k, v] of Object.entries(K)) if (!reserved.has(k)) for (const r of reserved) assert.notEqual(v, K[r], `${k} does not reuse gore colour ${r}`);
});

test('voice: title, quips, prompts and arena banners fit their boxes', () => {
  const T = S.TEXT.title;
  assert.equal(T.name, 'SAMMY THE OPOSSUM'); assert.equal(T.hunter, 'ZOMBIE HUNTER');
  assert.ok(S.textWidth(T.name, 3) <= 232 && S.textWidth(T.hunter, 4) <= 232, 'big title lines fit the title panel');
  for (const k of ['tag1', 'tag2', 'level']) assert.ok(S.textWidth(T[k]) <= 232, k + ' fits the title panel');
  assert.ok(S.textWidth(S.TEXT.quips.paused) <= 118, 'pause quip fits the pause box');
  for (const k of ['clear', 'end']) assert.ok(S.textWidth(S.TEXT.quips[k]) <= 196, k + ' fits the level-clear box');
  for (const pr of S.LEVEL1.prompts) for (const t of [pr.text, pr.touch].filter(Boolean)) {
    assert.ok(S.textWidth(t) + 8 <= C.screenW - 8, t);
    for (const ch of t) assert.ok(S.GLYPHS[ch.toUpperCase()], `"${ch}" in "${t}" is in the font`);
  }
  // The exit banner is centred on the gate near the arena's right edge, so it must stay narrow enough to show.
  const A = S.LEVEL1.arena, src = fs.readFileSync(path.join(here, '..', 'src', 'sim.js'), 'utf8');
  const exit = (src.match(/A\.gateX, 120, [\d.]+, \{ text: '([^']+)' \}/) || [])[1];
  assert.ok(exit && A.gateX + S.textWidth(exit) / 2 <= A.x1, 'exit banner stays on screen: ' + exit);
});
