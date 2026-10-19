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
for (const f of ['config', 'font', 'level', 'assets', 'sim', 'bot']) {
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

test('audio converter: picks only .wav files that have no .ogg beside them', async () => {
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
    const withMp3 = findWavsToConvert(tmp, { mp3: true }).map((t) => rel(t.mp3));
    assert.deepEqual(withMp3, ['audio/music/music-level-01-central-park/music-level-01-central-park-v01.mp3', null, 'audio/sfx/sfx-jump/sfx-jump-v01.mp3']);
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
