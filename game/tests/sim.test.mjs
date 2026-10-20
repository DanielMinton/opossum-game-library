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
for (const f of ['config', 'font', 'level', 'assets', 'sim', 'bot', 'layout', 'scenery', 'render', 'audio']) {
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
  for (const e of s.enemies) assert.ok(S.isSupported(s, e.x, G), 'every zombie (litters included) stands on ground: ' + e.id + ' at ' + e.x);
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
  const after = s.level.enemies.filter((e) => e.x > 1264).reduce((n, d) => n + (d.litter || 1), 0); // a litter entry stands several
  assert.equal(s.enemies.filter((e) => e.def.x > 1264).length, after, 'enemies after the checkpoint come back');
  assert.equal(s.carts[0].state, 'upright', 'cart after the checkpoint resets');
});

// ---------- gauntlet, victory, restart ----------
test('gauntlet: arena locks, 2 typed waves (3 and 5 bodies), then the Brute; gate opens on his death, exit clears the level', () => {
  const s = start(); s.god = true;
  s.enemies = s.enemies.filter((e) => e.def.x > 9999);
  place(s, 3500, { cp: 2576 });
  step(s, { held: { right: true } }, sec(1));
  assert.equal(s.arena.state, 'fight');
  const bot = S.makeBot();
  let spawned = 0, minX = Infinity, bossDown = false;
  for (let i = 0; i < sec(120) && s.mode !== 'clear'; i++) {
    S.update(s, S.botInput(s, bot));
    s.events.length = 0;
    if (s.arena.state === 'fight') minX = Math.min(minX, s.player.x);
    spawned = Math.max(spawned, s.arena.spawnCount);
    if (s.enemies.some((e) => e.boss && (e.state === 'defeat' || e.state === 'dead'))) bossDown = true;
  }
  assert.equal(spawned, 8, 'wave 1: jogger, jogger, cheerleader; wave 2: three babies, a hippie, a jogger');
  assert.equal(s.mode, 'clear');
  assert.equal(s.arena.state, 'open');
  assert.ok(bossDown, 'the Brute came and went');
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

// ---------- level 1 placement and the typed gauntlet (zombie roster, 2026-10-20) ----------
test('level 1 places every type where the design says: 17 bodies, 7 joggers, one new idea per screen, the Brute at the end', () => {
  const L = S.LEVEL1, E = L.enemies, at = (type) => E.filter((d) => d.type === type).map((d) => d.x);
  const bodies = E.reduce((n, d) => n + (d.litter || 1), 0);
  assert.equal(bodies, 17);
  assert.deepEqual(at('jogger'), [540, 780, 1180, 1540, 2080, 2112, 2290], 'the jogger stays, about half as many (owner answer 3)');
  assert.deepEqual(at('hippie'), [940, 2150, 3440]);
  assert.deepEqual(at('cheerleader'), [1420, 3160]);
  assert.deepEqual(at('sweater'), [2720]);
  assert.deepEqual(E.filter((d) => d.type === 'baby').map((d) => [d.x, d.litter]), [[3010, 3]]);
  assert.deepEqual(at('vendor'), [1800]);
  assert.ok(!E.some((d) => d.type === 'brute'), 'the boss is spawned by the arena, never placed');
  for (const type of ['hippie', 'sweater', 'cheerleader', 'baby']) assert.ok(at(type).length, type + ' is in level 1 (owner answer 2)');
  // One new idea per screen: the screen-3 hippie is the Play Possum demo, under the moved prompt; the sweater stands on the second lid;
  // the litter is well past the Play Possum lesson and penned by the rock and the fence; the last hippie is the chainsaw's first victim.
  const prompt = (re) => L.prompts.find((p) => re.test(p.text));
  const possum = prompt(/PLAY DEAD/), lad = prompt(/BIG LAD/), saw = prompt(/CHAINSAW/);
  assert.deepEqual([possum.x0, possum.x1], [680, 760]);
  assert.ok(possum.x1 < 780 && 940 > possum.x1 && 940 < 960, 'the jogger and the first hippie come right after the Play Possum prompt');
  assert.ok(possum.touch, 'touch wording kept');
  assert.deepEqual([lad.x0, lad.x1], [2660, 2760]);
  const lid2 = L.pickups.find((pk) => pk.type === 'lid' && pk.x > 2000);
  assert.ok(Math.abs(lid2.x - 2720) <= 32, 'the sweater stands on the second lid');
  assert.ok(3010 > possum.x1 + 1000, 'the litter is nowhere near the Play Possum lesson');
  assert.ok(L.solids.some((so) => so.kind === 'rock' && so.x === 2960) && L.solids.some((so) => so.kind === 'fence' && so.x === 3100), 'the litter\'s pen');
  const sawPick = L.pickups.find((pk) => pk.type === 'chainsaw');
  assert.ok(sawPick.x === 3300 && 3440 > sawPick.x && saw.x0 <= sawPick.x && saw.x1 >= sawPick.x, 'the hippie at 3440 follows the chainsaw');
  // Prompts never overlap, and nothing new stands over the pond.
  const ps = L.prompts.slice().sort((a, b) => a.x0 - b.x0);
  for (let i = 1; i < ps.length; i++) assert.ok(ps[i].x0 >= ps[i - 1].x1, 'prompts in order: ' + ps[i].text);
  for (const d of E) assert.ok(!(d.x > 2344 - 40 && d.x < 2424 + 40), 'nothing stands over the pond: ' + d.type + ' ' + d.x);
  // The gauntlet: two typed waves then the Brute (owner answer 4).
  assert.deepEqual(C.gauntlet.waves, [['jogger', 'jogger', 'cheerleader'], [{ type: 'baby', litter: 3 }, 'hippie', 'jogger']]);
  assert.equal(C.gauntlet.boss, 'brute');
  assert.equal(C.gauntlet.waveType, undefined, 'the single wave type is gone');
});

test('typed waves: each entry drops one body from alternating sides, a litter entry drops its litter from one side, ids are unique, the counter reads waves.length', () => {
  const s = start(); s.god = true;
  s.enemies = s.enemies.filter((e) => e.def.x > 9999);
  place(s, 3600, { cp: 2576 });
  step(s, { held: { right: true } }, sec(1.2)); // the arena locks and wave 1 drops
  assert.equal(s.arena.state, 'fight');
  const A = s.level.arena;
  const w0 = s.enemies.filter((e) => e.arena && e.wave === 0);
  assert.deepEqual(w0.map((e) => [e.type, e.id, e.face]), [['jogger', 'w0-0', 1], ['jogger', 'w0-1', -1], ['cheerleader', 'w0-2', 1]]);
  assert.ok(w0[0].x === A.x0 + 64 && w0[1].x === A.gateX - 16 && w0[2].x === A.x0 + 64 + 14, 'left, right, left again a little further in');
  assert.ok(w0.every((e) => e.state === 'spawn' || e.grounded === false || e.y <= G), 'they drop in from above');
  assert.equal(s.arena.spawnCount, 3);
  // Wave 2: kill wave 1 by hand, wait out the delay.
  for (const e of w0) { e.state = 'dead'; }
  step(s, {}, sec(C.gauntlet.waveDelay) + 2);
  const w1 = s.enemies.filter((e) => e.arena && e.wave === 1);
  assert.deepEqual(w1.map((e) => [e.type, e.id]), [['baby', 'w1-0'], ['baby', 'w1-0-1'], ['baby', 'w1-0-2'], ['hippie', 'w1-1'], ['jogger', 'w1-2']]);
  const babies = w1.filter((e) => e.type === 'baby');
  assert.deepEqual(babies.map((e) => e.x - A.x0 - 64), [0, C.baby.litterGap, 2 * C.baby.litterGap], 'the litter steps inwards from the left wall');
  assert.ok(babies.every((e) => e.face === 1) && w1[3].face === -1 && w1[4].face === 1, 'sides alternate per entry, not per body');
  assert.equal(s.arena.spawnCount, 8);
  assert.equal(new Set(s.enemies.map((e) => e.id)).size, s.enemies.length, 'every id unique');
  // After the last wave: the boss, not the gate.
  for (const e of w1) e.state = 'dead';
  step(s, {}, 2);
  assert.equal(s.arena.state, 'boss');
  assert.equal(C.gauntlet.waves.length, 2, 'the HUD shows WAVE n/2');
  // Entries are validated like level entries: an unknown type throws when its wave drops.
  const bad = start(); bad.god = true; bad.enemies = []; place(bad, 3600, { cp: 2576 });
  const saved = C.gauntlet.waves; C.gauntlet.waves = [['nobody']];
  try { assert.throws(() => step(bad, { held: { right: true } }, sec(1.2)), /unknown enemy type/); } finally { C.gauntlet.waves = saved; }
});

test('full playthrough (autopilot): every type in level 1 goes down on the way, the Brute at the end, and the clear is deterministic', () => {
  const run = () => {
    const s = S.newGame(); s.god = true;
    const bot = S.makeBot(), seen = new Set();
    for (let f = 0; f < sec(120) && s.mode !== 'clear'; f++) {
      S.update(s, S.botInput(s, bot)); s.events.length = 0;
      for (const e of s.enemies) if (e.state === 'defeat') seen.add(e.type + ':' + e.defeatStyle);
    }
    return [s, seen];
  };
  const [s, seen] = run();
  assert.equal(s.mode, 'clear', 'stuck at x ' + Math.round(s.player.x));
  // (The vendor stands behind the cart and the autopilot walks past him, as it always has.)
  for (const type of ['jogger', 'hippie', 'sweater', 'cheerleader', 'baby', 'brute']) assert.ok([...seen].some((k) => k.startsWith(type + ':')), type + ' was beaten: ' + [...seen].join(' '));
  assert.ok(seen.has('brute:crawl') && [...seen].some((k) => k.endsWith(':sliced')), 'the saw was used');
  assert.ok(s.stats.defeated >= 16 + 8, 'every park body but the vendor, plus both waves: ' + s.stats.defeated);
  const [t] = run();
  assert.equal(JSON.stringify([s.stats, Math.round(s.player.x)]), JSON.stringify([t.stats, Math.round(t.player.x)]));
});

test('the game is deterministic: two identical runs give identical results', () => {
  const run = () => { const s = S.newGame(); s.god = true; const b = S.makeBot(); for (let i = 0; i < sec(40); i++) { S.update(s, S.botInput(s, b)); s.events.length = 0; } return JSON.stringify([s.stats, Math.round(s.player.x * 100)]); };
  assert.equal(run(), run());
});

// ---------- enemy type table (2026-10-20) ----------
// A stub type for the tests: a jogger with some table fields changed. Registered with a drawer, removed again after.
function withStubType(fields, fn) {
  const cfg = Object.assign({}, C.jogger, fields);
  S.defineEnemyType('stub', cfg);
  S.ENEMY_DRAW.stub = S.ENEMY_DRAW.jogger;
  try {
    const level = Object.assign({}, S.LEVEL1, { enemies: [{ type: 'stub', x: 600 }] });
    const s = S.newGame(level); step(s, { pressed: { start: true } }); s.carts = []; s.pickups = []; events(s);
    return fn(s, s.enemies[0], cfg);
  } finally { delete S.ENEMY_TYPES.stub; delete S.ENEMY_DRAW.stub; }
}

test('enemy types: every type is one complete row: config block, brain, start state, drawer, and a strip for every animation', () => {
  const names = Object.keys(S.ENEMY_TYPES);
  assert.deepEqual(names, ['jogger', 'vendor', 'hippie', 'sweater', 'cheerleader', 'baby', 'brute'], 'the types today, in config order');
  const keys = new Set(S.ASSET_MANIFEST.map((m) => m.key));
  for (const [name, T] of Object.entries(S.ENEMY_TYPES)) {
    assert.equal(T.name, name);
    assert.equal(T.cfg, C[name], name + ': its config block is the row');
    for (const f of S.ENEMY_TYPE_FIELDS) assert.notEqual(T.cfg[f], undefined, name + ' has ' + f);
    assert.equal(typeof T.update, 'function', name + ' has a brain');
    assert.ok(T.states.includes(T.cfg.start) && T.states.includes('defeat') && T.states.includes('dead') && T.states.includes('hitreact'), name + ' states');
    assert.equal(T.anims[T.cfg.start], T.cfg.startAnim, name + ' starts in the animation of its start state');
    for (const st of T.states) assert.ok(T.anims[st], name + ': state ' + st + ' has an animation');
    for (const anim of new Set(Object.values(T.anims))) assert.ok(keys.has(T.cfg.art + ':' + anim), name + ': manifest strip ' + T.cfg.art + ':' + anim);
    assert.equal(typeof S.ENEMY_DRAW[name], 'function', name + ' has a drawer in render.js');
    const STYLES = ['pop', 'deflate', 'sliced', 'melt', 'flop', 'burst', 'crawl'];
    assert.ok(STYLES.includes(T.cfg.defeatStyle) && STYLES.includes(T.cfg.sawStyle), name + ' defeat styles are drawn');
  }
  assert.equal(S.ENEMY_TYPES.jogger.brain, 'walker'); assert.equal(S.ENEMY_TYPES.vendor.brain, 'turret'); assert.equal(S.ENEMY_TYPES.brute.brain, 'boss');
  for (const d of S.LEVEL1.enemies) assert.ok(S.ENEMY_TYPES[d.type], 'level 1 places a known type: ' + d.type);
  for (const w of C.gauntlet.waves) for (const entry of w) assert.ok(S.ENEMY_TYPES[S.waveEntry(entry).type], 'the gauntlet spawns a known type: ' + JSON.stringify(entry));
  assert.ok(S.ENEMY_TYPES[C.gauntlet.boss] && S.ENEMY_TYPES[C.gauntlet.boss].brain === 'boss', 'the gauntlet boss is a boss type');
  // The table is the only place that knows the types: no "is it a jogger?" checks are left in the game code.
  for (const f of ['sim.js', 'render.js', 'main.js', 'bot.js']) {
    const code = fs.readFileSync(path.join(src, f), 'utf8');
    assert.ok(!/=== '(jogger|vendor)'|isVendor|updateJogger|updateVendor/.test(code), f + ' has no per-type if checks');
  }
});

test('enemy types: an unknown type throws at once (it is never quietly treated as a jogger)', () => {
  assert.throws(() => S.enemyType('ghoul'), /unknown enemy type "ghoul"/);
  assert.throws(() => S.newGame(Object.assign({}, S.LEVEL1, { enemies: [{ type: 'ghoul', x: 500 }] })), /unknown enemy type "ghoul"/);
  const s = start();
  s.enemies.push({ id: 'x', type: 'ghoul', x: 300, y: G, state: 'patrol', t: 0, anim: 'walk', animT: 0 });
  assert.throws(() => step(s), /unknown enemy type "ghoul"/);
  s.enemies.pop();
  assert.throws(() => S.render(colorCtx(), Object.assign({}, s, { enemies: [{ id: 'x', type: 'ghoul', x: s.player.x + 20, y: G, state: 'patrol', t: 0, anim: 'walk', animT: 0 }] })), /no drawer for enemy type "ghoul"/);
  // A half-written config block fails at registration, naming what is missing.
  const half = Object.assign({}, C.jogger); delete half.knockback;
  assert.throws(() => S.defineEnemyType('half', half), /"half" is missing "knockback"/);
  assert.throws(() => S.defineEnemyType('odd', Object.assign({}, C.jogger, { brain: 'wizard' })), /unknown brain "wizard"/);
  assert.throws(() => S.defineEnemyType('odd', Object.assign({}, C.jogger, { start: 'throw' })), /starts in "throw"/);
  assert.throws(() => S.defineEnemyType('odd', Object.assign({}, C.jogger, { possum: 'shrug' })), /Play Possum with "shrug"/);
  assert.ok(!S.ENEMY_TYPES.half && !S.ENEMY_TYPES.odd, 'nothing half-registered');
});

test('enemy types: knockback, shield push, cart knock, Play Possum grace and defeat style all come from the table', () => {
  // Whip knockback and the whip death style.
  withStubType({ knockback: 50, defeatStyle: 'deflate', shieldPush: 40, cartKnock: 0, possumIgnore: 3.0 }, (s, e) => {
    e.state = 'confused'; place(s, e.x - 22);
    step(s, { pressed: { attack: true } });
    assert.ok(runUntil(s, () => e.state === 'hitreact', sec(0.3)) >= 0, 'whipped');
    assert.equal(e.hp, C.jogger.hp - 1);
    assert.equal(Math.abs(e.vx), 50 * 0.85, 'pushed at the table speed (one frame of slowing): ' + e.vx);
    // The lid pushes it back by shieldPush.
    e.state = 'chase'; s.player.shield = 3; s.player.invuln = 0; const x0 = e.x;
    assert.equal(S.hurtPlayer(s, { fromX: e.x, source: e }), 'blocked');
    assert.equal(e.x - x0, 40);
    // Play Possum: confused, then ignores Sammy for possumIgnore after he gets up.
    e.state = 'confused'; step(s, {}, sec(0.3)); // let the whip finish
    e.state = 'chase'; e.x = s.player.x + 40; s.player.possumCd = 0; s.player.shield = 0;
    step(s, { pressed: { possum: true } });
    assert.equal(e.state, 'confused');
    step(s, {}, sec(C.possum.maxTime + C.possum.getUpTime + 0.1));
    assert.equal(s.player.state, 'normal'); assert.ok(e.ignoreT > 2.8 && e.ignoreT <= 3.0, 'grace ' + e.ignoreT);
    // Whip death uses the table's style.
    e.state = 'confused'; e.hp = 1; e.x = s.player.x + 20; s.player.face = 1;
    step(s, { pressed: { attack: true } }, sec(0.2));
    assert.equal(e.state, 'defeat'); assert.equal(e.defeatStyle, 'deflate');
  });
  // The cart knocks a type with cartKnock 0 into hitreact without moving it.
  withStubType({ cartKnock: 0 }, (s, e) => {
    s.carts = [{ id: 'cart0', def: { x: 560 }, x: 560, state: 'tipping', t: 0, tipDir: 1, anim: 'tipping', animT: 0, spill: [] }];
    e.state = 'confused'; e.x = 620; place(s, 400);
    step(s, {}, sec(C.cart.tipTime) + 1);
    assert.equal(e.state, 'hitreact'); assert.equal(e.vx, 0);
  });
  // The jogger row still says what it did before the table existed.
  assert.deepEqual([C.jogger.knockback, C.jogger.sawKnockback, C.jogger.cartKnock, C.jogger.shieldPush, C.jogger.hitY, C.jogger.possumIgnore], [120, 40, 160, 16, 26, 1.5]);
  assert.deepEqual([C.vendor.knockback, C.vendor.sawKnockback, C.vendor.cartKnock, C.vendor.shieldPush], [0, 0, 0, 0]);
});

test('enemy types: flinch false = a hit flashes it white, it keeps coming, and it still loses hit points', () => {
  withStubType({ flinch: false, hp: 3 }, (s, e) => {
    e.state = 'chase'; e.vx = 30; place(s, e.x - 22);
    step(s, { pressed: { attack: true } }, sec(0.2));
    assert.equal(e.hp, 2, 'took the hit');
    assert.ok(e.state === 'chase' || e.state === 'attack', 'never reeled: ' + e.state);
    assert.ok(e.flashT > 0 && e.flashT <= C.jogger.hitReactTime, 'flashing for hitReactTime: ' + e.flashT);
    assert.ok(events(s).includes('sfx-hit-zombie'));
    // The flash is drawn white, then fades on its own.
    e.state = 'chase'; e.x = s.player.x + 40;
    const ctx = colorCtx(); S.render(ctx, s);
    assert.ok(ctx.used.has(S.PAL.white.toLowerCase()), 'drawn white while flashing');
    step(s, {}, sec(0.3)); assert.equal(e.flashT, 0);
    // Two more whips kill it; the whip death keeps its style.
    for (let i = 0; i < 2; i++) { e.state = 'confused'; e.x = s.player.x + 20; s.player.face = 1; step(s, { pressed: { attack: true } }, sec(0.3)); }
    assert.equal(e.state, 'defeat'); assert.equal(e.defeatStyle, 'pop');
  });
});

// ---------- cheerleader and baby (zombie roster, 2026-10-20) ----------
// A game on level 1's ground with only the given enemies (no carts or pickups), Sammy stood at x.
function withEnemies(enemies, x, opts = {}) {
  const s = S.newGame(Object.assign({}, S.LEVEL1, { enemies }));
  step(s, { pressed: { start: true } });
  s.carts = []; s.pickups = [];
  place(s, x, opts); events(s);
  return s;
}
const leapFrames = (s, e, spec, max = sec(1.5)) => { // frames spent airborne; spec(e) gives the input each frame
  let n = 0, hitsInAir = 0;
  for (let i = 0; i < max; i++) {
    step(s, spec ? spec(e) : {});
    if (e.state === 'leap') { n += 1; hitsInAir = s.stats.hits; }
    if (e.state === 'land') break;
  }
  return { frames: n, hitsInAir };
};

test('cheerleader: she stops and cheers for 0.45 s (harmless, idle strip), then leaps about 72 px in about 0.42 s; the leap hurts on touch', () => {
  const s = withEnemies([{ type: 'cheerleader', x: 672 }], 600);
  const e = s.enemies[0]; e.state = 'chase'; e.face = -1; e.cd = 0;
  step(s);
  assert.equal(e.state, 'windup'); assert.equal(e.anim, 'idle', 'the tell shows the idle strip (she cheers)');
  assert.ok(events(s).includes('sfx-cheer'));
  // Harmless while she cheers, even with Sammy pressed against her.
  s.player.x = e.x - 10; step(s, {}, sec(0.2)); assert.equal(s.stats.hits, 0, 'the windup never hurts');
  s.player.x = 600;
  const more = runUntil(s, () => e.state === 'leap', sec(0.5));
  assert.ok(Math.abs(sec(0.2) + more - sec(C.cheerleader.leapWindup)) <= 2, 'the tell lasts 0.45 s: ' + (sec(0.2) + more) + ' frames');
  assert.equal(e.anim, 'attack');
  assert.ok(events(s).includes('sfx-leap'));
  const x0 = e.x;
  const r = leapFrames(s, e);
  assert.equal(e.state, 'land');
  assert.ok(Math.abs(r.frames - sec(2 * C.cheerleader.leapVy / C.gravity)) <= 2, 'about 0.42 s in the air: ' + r.frames + ' frames');
  assert.ok(Math.abs(x0 - e.x) > 64 && Math.abs(x0 - e.x) < 80, 'about 72 px long: ' + (x0 - e.x));
  assert.ok(Math.abs(S.leapLength(C.cheerleader) - 72) < 2, 'leapLength says 72');
  assert.equal(r.hitsInAir, 1, 'a Sammy who just stands there is hit by the leap');
  assert.equal(s.player.state, 'hurt');
  // Stuck on landing for 0.2 s, harmless, then back to the chase with the leap on cooldown.
  s.player.state = 'normal'; s.player.invuln = 0; s.player.x = e.x + 4; s.player.vx = 0; s.player.vy = 0; s.player.y = G; s.player.grounded = true;
  const hits = s.stats.hits;
  let stuck = 0;
  for (; stuck < sec(0.5) && e.state === 'land'; stuck++) { step(s); if (e.state === 'land') assert.equal(s.stats.hits, hits, 'the landing never hurts'); }
  assert.ok(Math.abs(stuck - sec(C.cheerleader.leapLand)) <= 2, 'stuck about 0.2 s: ' + stuck + ' frames');
  assert.equal(e.state, 'chase'); assert.ok(e.cd >= C.cheerleader.leapCooldown - 0.05, 'cooldown ' + e.cd);
});

test('cheerleader: a step back makes her land short, a jump at the launch clears her, and she never leaps where the landing is not ground', () => {
  // Step back during the cheer: she lands about 46 px short of Sammy.
  let s = withEnemies([{ type: 'cheerleader', x: 672 }], 600), e = s.enemies[0];
  e.state = 'chase'; e.face = -1; e.cd = 0;
  let r = leapFrames(s, e, () => ({ held: { left: true } }));
  assert.equal(e.state, 'land'); assert.equal(r.hitsInAir, 0, 'missed'); assert.equal(s.stats.hits, 0);
  assert.ok(e.x - s.player.x > 40, 'she lands well short: ' + (e.x - s.player.x));
  // Jump as she launches: Sammy sails over her.
  s = withEnemies([{ type: 'cheerleader', x: 672 }], 600); e = s.enemies[0];
  e.state = 'chase'; e.face = -1; e.cd = 0;
  let jumped = false;
  r = leapFrames(s, e, (q) => { if (q.state !== 'leap') return {}; const first = !jumped; jumped = true; return { pressed: { jump: first }, held: { jump: true } }; });
  assert.equal(e.state, 'land'); assert.equal(r.hitsInAir, 0, 'cleared');
  assert.ok(s.player.y < G - 40, 'Sammy is still in the air over her: ' + s.player.y);
  // The pond: her landing spot would be water, so she waits instead of leaping (chase, standing still).
  s = withEnemies([{ type: 'cheerleader', x: 2290 }], 2330, { cp: 1264 }); e = s.enemies[0];
  e.state = 'chase'; e.face = 1; e.cd = 0;
  step(s, {}, sec(1));
  assert.notEqual(e.state, 'windup'); assert.notEqual(e.state, 'leap');
  assert.ok(e.x < 2344 && e.y === G, 'still on the bank: ' + e.x);
  assert.ok(!S.isSupported(s, e.x + S.leapLength(C.cheerleader), G), 'the landing spot is the pond');
  // A fence in the lane: she doesn't leap into it (she waits on her side; the bot walks on after half a second).
  s = withEnemies([{ type: 'cheerleader', x: 1540 }], 1600); e = s.enemies[0]; // fence post at 1580, Sammy just past it
  e.state = 'chase'; e.face = 1; e.cd = 0;
  leapFrames(s, e);
  assert.ok(!events(s).includes('sfx-leap') && e.state === 'chase', 'no leap into the fence: ' + e.state);
  assert.ok(e.x < 1580, 'never passes the fence: ' + e.x);
  // A walker that doesn't leap (the jogger) is untouched by any of this: the same spot, it lunges as before.
  s = withEnemies([{ type: 'jogger', x: 1500 }], 1560); e = s.enemies[0];
  e.state = 'chase'; e.face = 1; e.cd = 0; s.player.x = 1540;
  assert.ok(runUntil(s, () => e.state === 'attack', sec(2)) >= 0);
});

test('cheerleader: Play Possum confuses her, she forgets Sammy after 0.75 s, and a leap already started finishes in the air', () => {
  const s = withEnemies([{ type: 'cheerleader', x: 660 }], 600), e = s.enemies[0];
  e.state = 'chase'; e.face = -1; e.cd = 9; s.player.possumCd = 0;
  step(s, { pressed: { possum: true } });
  assert.equal(e.state, 'confused'); assert.equal(e.anim, 'idle');
  step(s, {}, sec(C.possum.maxTime + C.possum.getUpTime + 0.1));
  assert.equal(s.player.state, 'normal'); assert.equal(e.state, 'patrol');
  assert.ok(e.ignoreT > 0.6 && e.ignoreT <= 0.75, 'short grace: ' + e.ignoreT);
  assert.equal(C.jogger.possumIgnore, 1.5, 'the jogger keeps its longer grace');
  // Playing dead under a leap: she stays airborne, lands, then stands confused (god mode here, so the bump below doesn't wake her).
  for (const god of [true, false]) {
    const t = withEnemies([{ type: 'cheerleader', x: 672 }], 600), f = t.enemies[0]; t.god = god;
    f.state = 'chase'; f.face = -1; f.cd = 0;
    step(t, {}, sec(C.cheerleader.leapWindup) + 3);
    assert.equal(f.state, 'leap'); t.player.possumCd = 0;
    step(t, { pressed: { possum: true } });
    assert.equal(f.state, 'leap', 'not frozen in mid-air'); assert.ok(f.confused);
    const r = leapFrames(t, f);
    assert.equal(f.state, 'land');
    step(t, {}, sec(C.cheerleader.leapLand) + 1);
    if (god) assert.equal(f.state, 'confused', 'confused once she lands');
    else { assert.equal(r.hitsInAir, 1, 'a bump while lying there still hurts'); assert.equal(f.state, 'chase', 'and the hit wakes her, as any hit does'); }
  }
});

test('baby: one whip pops it (red blood, its own cry), the chainsaw slices it like anyone, and a level entry with litter 3 stands three 32 px apart', () => {
  const s = withEnemies([{ type: 'baby', x: 640, litter: 3 }], 600);
  assert.deepEqual(s.enemies.map((e) => [e.id, e.x, e.home]), [['e0', 640, 640], ['e0-1', 672, 672], ['e0-2', 704, 704]], 'three babies, 32 px apart, each with its own spot');
  assert.ok(s.enemies.every((e) => e.def === s.level.enemies[0]), 'all three come from the one entry');
  assert.equal(C.baby.litterGap, 32);
  s.god = true; // the kills, not the bumps, are under test here
  const b = s.enemies[0]; b.state = 'chase'; b.x = 622; b.face = -1; b.cd = 9;
  step(s, { pressed: { attack: true } }, sec(0.2));
  assert.equal(b.state, 'defeat'); assert.equal(b.defeatStyle, 'pop'); assert.equal(b.hp, 0);
  const ev = events(s);
  assert.ok(ev.includes('sfx-baby-cry') && ev.includes('sfx-zombie-defeat-comedic'), 'its own cry plus the shared sound: ' + ev);
  assert.ok(s.effects.some((f) => f.kind === 'blood'), 'bleeds like anyone (owner answer 8)');
  // The saw: sliced, chunks, no special case.
  step(s, {}, sec(0.3)); // let the whip finish
  const c = s.enemies[1]; c.state = 'chase'; c.x = s.player.x + 20; c.face = -1; c.cd = 9;
  s.player.saw = { fuel: C.chainsaw.fuel, revving: false, tick: 0, slash: 0 };
  step(s, { pressed: { attack: true }, held: { attack: true } }, 3);
  assert.equal(c.state, 'defeat'); assert.equal(c.defeatStyle, 'sliced');
  assert.ok(s.effects.some((f) => f.kind === 'chunk'));
  // A plain entry is still one zombie; a litter respawns whole after a K.O.
  const one = withEnemies([{ type: 'baby', x: 640 }], 600);
  assert.equal(one.enemies.length, 1);
  const t = withEnemies([{ type: 'baby', x: 1400, litter: 3 }], 1300, { cp: 1264 });
  t.enemies.length = 0; t.player.hp = 1; t.player.invuln = 0; t.player.state = 'normal';
  S.hurtPlayer(t, { hazard: true }); step(t, {}, sec(C.sammy.koTime + C.sammy.koWait) + 2);
  assert.equal(t.enemies.length, 3, 'the litter is back after the restart');
  assert.deepEqual(t.enemies.map((e) => e.home), [1400, 1432, 1464]);
});

test('baby: Play Possum does nothing to it; it notices a lying Sammy, keeps coming, and its rattle reaches him on the ground', () => {
  const s = withEnemies([{ type: 'baby', x: 680 }, { type: 'jogger', x: 660 }], 600);
  const b = s.enemies[0], j = s.enemies[1];
  b.state = 'patrol'; j.state = 'chase'; s.player.possumCd = 0; s.player.face = 1;
  step(s, { pressed: { possum: true } });
  assert.equal(j.state, 'confused', 'the jogger beside it is fooled');
  assert.notEqual(b.state, 'confused'); assert.ok(!b.confused, 'the baby is not');
  step(s, {}, sec(0.5));
  assert.equal(b.state, 'chase', 'it noticed the lying Sammy and came for him');
  const t = runUntil(s, () => s.stats.hits > 0, sec(2));
  assert.ok(t >= 0, 'it bumps into Sammy while he lies there, and that hurts (owner question 10)');
  assert.ok(s.player.state === 'hurt' || s.player.state === 'ko');
  assert.equal(s.player.possumCd, C.possum.cooldown, 'a hit while playing dead costs the cooldown');
  // Its rattle smack: a standing Sammy just out of reach gets the attack (own sound), and the box starts 16 px up, not the jogger's 26.
  const u = withEnemies([{ type: 'baby', x: 640 }], 600), d = u.enemies[0];
  d.state = 'chase'; d.face = -1; d.cd = 0; d.x = 600 + C.baby.attackRange;
  step(u);
  assert.equal(d.state, 'attack'); assert.ok(events(u).includes('sfx-baby-rattle'), 'the smack has its own sound');
  assert.equal(runUntil(u, () => u.stats.hits > 0, sec(C.baby.attackTime)) >= 0, true, 'the rattle lands');
  assert.deepEqual([C.baby.hitY, C.baby.bodyH, C.baby.hp, C.baby.chaseSpeed, C.baby.possum], [16, 20, 1, 90, 'ignore']);
  assert.ok(C.baby.chaseSpeed > C.jogger.chaseSpeed && C.baby.chaseSpeed < C.sammy.runSpeed, 'faster than a jogger, slower than Sammy');
});

test('cheerleader and baby: every state draws in their own colours (maroon and cream, pastel pink and blue), gags fit the font, and the autopilot still clears a level with them in it', () => {
  const s = withEnemies([{ type: 'cheerleader', x: 640 }, { type: 'baby', x: 660 }], 600);
  const own = { cheerleader: [S.PAL.cheer, S.PAL.cream], baby: [S.PAL.babyPink, S.PAL.babyBlue, S.PAL.brain] };
  for (const e of s.enemies) {
    const T = S.enemyType(e.type);
    for (const st of T.states.concat(['flash'])) {
      const ctx = colorCtx();
      Object.assign(e, { state: st === 'flash' ? 'chase' : st, t: 0.2, anim: T.anims[st === 'flash' ? 'chase' : st], animT: 0.2, flashT: st === 'flash' ? 0.1 : 0, vy: st === 'leap' ? -50 : 0 });
      S.render(ctx, s);
      if (st === 'flash') assert.ok(ctx.used.has(S.PAL.white.toLowerCase()), e.type + ' flashes white');
      else if (!['defeat', 'dead', 'hitreact'].includes(st)) for (const c of own[e.type]) assert.ok(ctx.used.has(c.toLowerCase()), e.type + ' ' + st + ' draws ' + c);
    }
    for (const style of [T.cfg.defeatStyle, T.cfg.sawStyle]) {
      for (const t of [0.05, 0.3, 0.6]) {
        const ctx = colorCtx();
        Object.assign(e, { state: 'defeat', t, anim: 'defeat', animT: t, defeatStyle: style, sliceDir: 1 });
        S.render(ctx, s);
        assert.ok([S.PAL.blood, S.PAL.bloodHi, S.PAL.blood0].some((c) => ctx.used.has(c.toLowerCase())), e.type + ' ' + style + ' at ' + t + ' bleeds red');
      }
    }
    e.state = 'chase'; e.defeatStyle = T.cfg.defeatStyle;
  }
  for (const [type, lists] of Object.entries(S.GAGS_BY_TYPE)) for (const [style, lines] of Object.entries(lists)) for (const line of lines) {
    assert.ok(line.length <= 16, type + ' ' + style + ': "' + line + '" is 16 characters or fewer');
    for (const ch of line) assert.ok(S.GLYPHS[ch.toUpperCase()], `"${ch}" in "${line}" is in the font`);
  }
  assert.deepEqual(Object.keys(S.GAGS_BY_TYPE.cheerleader), ['burst']); assert.deepEqual(Object.keys(S.GAGS_BY_TYPE.baby), ['pop']);
  // Palette: the new colours sit on the 9-bit grid and none is a gore colour.
  const gore = new Set(Object.values(S.GORE_COLORS).map((c) => c.toLowerCase()));
  for (const k of ['cheer', 'cheerDark', 'cream', 'creamDark', 'hair', 'babyPink', 'babyBlue', 'babyBlueDark', 'babySkin', 'brain', 'rattle']) {
    assert.ok(!gore.has(S.PAL[k].toLowerCase()), k + ' is not a gore colour');
  }
  // The autopilot (god mode, as the full playthrough) clears level 1, which places two cheerleaders and the litter (2026-10-20).
  const g = S.newGame(); g.god = true;
  const bot = S.makeBot();
  let bursts = 0, pops = 0;
  for (let f = 0; f < sec(150) && g.mode !== 'clear'; f++) {
    S.update(g, S.botInput(g, bot)); g.events.length = 0;
    bursts = Math.max(bursts, g.enemies.filter((e) => e.type === 'cheerleader' && e.defeatStyle === 'burst' && e.state === 'defeat').length);
    pops = Math.max(pops, g.enemies.filter((e) => e.type === 'baby' && e.state === 'defeat').length);
  }
  assert.equal(g.mode, 'clear', 'the level is still clearable');
  assert.ok(bursts > 0 && pops > 0, 'it whipped a cheerleader and a baby on the way: ' + bursts + ', ' + pops);
});

// ---------- chainsaw (Stage B) ----------
function withSaw(x = 600) {
  const s = start();
  place(s, x);
  s.enemies = []; s.pickups = [];
  s.player.saw = { fuel: C.chainsaw.fuel, revving: false, tick: 0, slash: 0 };
  events(s);
  return s;
}
function jogAt(s, x, extra = {}) {
  const e = Object.assign({ id: 'j' + x, type: 'jogger', x, y: G, vx: 0, vy: 0, face: -1, dir: -1, grounded: true, hp: C.jogger.hp,
    state: 'confused', t: 0, home: x, cd: 9, lostT: 0, confused: true, arena: false, anim: 'idle', animT: 0, defeatStyle: 'pop', def: { x } }, extra);
  s.enemies.push(e); return e;
}
const loopEvents = (s) => s.events.filter((e) => e.type === 'sfx-loop');

test('chainsaw: lies on the grass on screen 11; grabbing it gives a full tank and plays the start sound', () => {
  const s = start();
  const pk = s.pickups.find((p) => p.type === 'chainsaw');
  assert.ok(pk && pk.x > 3200 && pk.x < 3520 && pk.y === G, 'placed on screen 11 before the arena');
  assert.ok(S.isSupported(s, pk.x, G));
  assert.ok(s.level.prompts.some((p) => p.x0 <= pk.x && p.x1 > pk.x && /CHAINSAW/.test(p.text) && /HOLD X/.test(p.text) && /HOLD WHIP/.test(p.touch)));
  s.enemies = [];
  place(s, pk.x - 20); events(s);
  step(s, { held: { right: true } }, 20);
  assert.ok(pk.collected);
  assert.deepEqual([s.player.saw.fuel > C.chainsaw.fuel - 1, s.player.saw.revving], [true, false]);
  assert.ok(events(s).includes('sfx-chainsaw-start'));
  const f0 = s.player.saw.fuel;
  step(s, {}, 60);
  assert.ok(Math.abs(f0 - s.player.saw.fuel - C.chainsaw.carryDrain) < 0.02, 'carrying burns carryDrain per second');
  assert.equal(s.player.anim, 'chainsaw-idle');
  step(s, { held: { right: true } }, 20);
  assert.equal(s.player.anim, 'chainsaw-run');
});

test('chainsaw: holding the attack button revs it instead of whipping; it slows Sammy, burns 1 fuel/s, and loops its sound', () => {
  const s = withSaw();
  step(s, { pressed: { attack: true }, held: { attack: true } });
  assert.equal(s.player.state, 'normal', 'no tail-whip while carrying the saw');
  assert.ok(s.player.saw.revving);
  assert.deepEqual(loopEvents(s), [{ type: 'sfx-loop', id: 'sfx-chainsaw-rev', on: true }]);
  events(s);
  const f0 = s.player.saw.fuel, x0 = s.player.x;
  step(s, { held: { attack: true, right: true } }, 60);
  assert.equal(loopEvents(s).length, 0, 'no repeat loop events while it keeps revving');
  assert.ok(Math.abs(f0 - s.player.saw.fuel - 1) < 0.02, 'revving burns 1 fuel per second');
  assert.equal(s.player.anim, 'chainsaw-rev');
  const revDist = s.player.x - x0;
  assert.ok(revDist < C.sammy.runSpeed * C.chainsaw.slow + 2 && revDist > C.sammy.runSpeed * C.chainsaw.slow - 15, 'slowed: ' + revDist);
  events(s);
  step(s, {});
  assert.ok(!s.player.saw.revving);
  assert.deepEqual(loopEvents(s), [{ type: 'sfx-loop', id: 'sfx-chainsaw-rev', on: false }]);
  // A quick tap still revs for slashTime.
  events(s);
  step(s, { pressed: { attack: true } });
  step(s, {}, sec(C.chainsaw.slashTime) - 2);
  assert.ok(s.player.saw.revving, 'tap keeps revving for slashTime');
  step(s, {}, 4);
  assert.ok(!s.player.saw.revving);
});

test('chainsaw: cuts a jogger in two quick cuts; it goes down "sliced" with blood, chunks, ichor, sparks, hit-stop and shake', () => {
  const s = withSaw();
  const e = jogAt(s, s.player.x + 18);
  step(s, { pressed: { attack: true }, held: { attack: true } });
  assert.equal(e.hp, C.jogger.hp - C.chainsaw.damage, 'first cut lands straight away');
  const ids = events(s);
  assert.ok(ids.includes('sfx-chainsaw-cut'));
  assert.ok(s.effects.some((f) => f.kind === 'blood' && f.n > 0 && f.dir === 1 && f.power > 0));
  assert.ok(s.effects.some((f) => f.kind === 'sparks' && f.dir === 1));
  const n = runUntil(s, () => e.state === 'defeat', 30, { held: { attack: true } });
  assert.ok(n >= 0 && n <= sec(C.chainsaw.tick) + 1, 'second cut after one tick: ' + n);
  assert.equal(e.defeatStyle, 'sliced');
  assert.equal(s.stats.defeated, 1);
  assert.ok(s.effects.filter((f) => f.kind === 'chunk' && f.dir === 1).length >= 2, 'chunks fly');
  assert.ok(s.effects.some((f) => f.kind === 'ichor' && f.n > 0));
  assert.ok(s.hitstop > 0 && s.hitstop <= 0.1, 'short hit-stop');
  assert.ok(s.shake > 0);
  assert.ok(events(s).includes('sfx-gore-splat'));
});

test('chainsaw: hit-stop freezes Sammy and the zombies but effects keep playing', () => {
  const s = withSaw();
  const far = jogAt(s, s.player.x + 200, { state: 'chase', confused: false, cd: 0 });
  s.hitstop = 0.05;
  const before = [s.player.x, far.x, far.t];
  const fx = s.effects.length ? null : (s.effects.push({ kind: 'blood', x: 0, y: 0, t: 0, life: 1, n: 1, dir: 1, power: 1 }), s.effects[0]);
  step(s, { held: { right: true } }, 2);
  assert.deepEqual([s.player.x, far.x, far.t], before, 'nothing moves');
  assert.ok(fx.t > 0, 'effects age');
  step(s, { held: { right: true } }, 4);
  assert.equal(s.hitstop, 0);
  assert.ok(s.player.x > before[0], 'moving again');
});

test('defeat styles: whip kills pop a jogger and deflate a vendor; every hit bleeds, only chainsaw kills throw chunks', () => {
  const s = start();
  place(s, 600); s.enemies = []; s.pickups = [];
  const e = jogAt(s, 616);
  assert.equal(S.newGame().enemies.find((x) => x.type === 'jogger').defeatStyle, 'pop');
  assert.equal(S.newGame().enemies.find((x) => x.type === 'vendor').defeatStyle, 'deflate');
  for (let i = 0; i < 2 && e.state !== 'defeat'; i++) { step(s, { pressed: { attack: true } }); step(s, {}, 20); }
  assert.equal(e.state === 'defeat' || e.state === 'dead', true);
  assert.equal(e.defeatStyle, 'pop');
  assert.equal(s.effects.filter((f) => f.kind === 'chunk').length, 0);
  // vendor
  const s2 = start();
  place(s2, 1760); s2.enemies = s2.enemies.filter((x) => x.type === 'vendor'); s2.carts = [];
  const v = s2.enemies[0]; v.x = 1776; events(s2);
  let blood = 0;
  for (let i = 0; i < 4 && v.state !== 'defeat' && v.state !== 'dead'; i++) {
    step(s2, { pressed: { attack: true } });
    for (let k = 0; k < 20; k++) { step(s2, {}); if (s2.effects.some((f) => f.kind === 'blood' && f.t < 0.02)) blood++; }
  }
  assert.equal(v.state === 'defeat' || v.state === 'dead', true);
  assert.equal(v.defeatStyle, 'deflate');
  assert.equal(blood, 2, 'one fresh blood effect per hit');
});

test('chainsaw: an empty tank takes it away and the button whips again', () => {
  const s = withSaw();
  s.player.saw.fuel = 0.05;
  step(s, { pressed: { attack: true }, held: { attack: true } });
  runUntil(s, () => !s.player.saw, 10, { held: { attack: true } });
  assert.equal(s.player.saw, null);
  assert.ok(s.effects.some((f) => f.kind === 'text' && /OUT OF GAS/.test(f.text)));
  const loops = loopEvents(s);
  assert.deepEqual(loops[loops.length - 1], { type: 'sfx-loop', id: 'sfx-chainsaw-rev', on: false });
  step(s, {}, 2); events(s);
  step(s, { pressed: { attack: true } });
  assert.equal(s.player.state, 'attack');
  assert.ok(events(s).includes('sfx-tail-whip'));
});

test('chainsaw: the rev sound stops on pause, KO and restart; KO drops the saw and it can be picked up again', () => {
  const s = withSaw();
  step(s, { pressed: { attack: true }, held: { attack: true } });
  events(s); s.events.length = 0;
  step(s, { pressed: { start: true }, held: { attack: true } });
  assert.equal(s.mode, 'paused');
  assert.deepEqual(loopEvents(s), [{ type: 'sfx-loop', id: 'sfx-chainsaw-rev', on: false }]);
  s.events.length = 0;
  step(s, { pressed: { start: true }, held: { attack: true } });
  step(s, { held: { attack: true } });
  assert.deepEqual(loopEvents(s), [{ type: 'sfx-loop', id: 'sfx-chainsaw-rev', on: true }], 'back on after unpause while still held');
  s.events.length = 0;
  step(s, { pressed: { restart: true } });
  assert.deepEqual(loopEvents(s), [{ type: 'sfx-loop', id: 'sfx-chainsaw-rev', on: false }]);
  assert.equal(s.player.saw, null);
  // KO after the second checkpoint: saw gone, pickup back.
  const s2 = start();
  const pk = s2.pickups.find((p) => p.type === 'chainsaw');
  s2.enemies = []; place(s2, pk.x - 10, { cp: 2576 });
  s2.checkpoint = s2.cps[1];
  step(s2, { held: { right: true } }, 10);
  assert.ok(s2.player.saw && pk.collected);
  step(s2, { pressed: { attack: true }, held: { attack: true } });
  s2.events.length = 0;
  s2.player.hp = 1; s2.player.invuln = 0;
  S.hurtPlayer(s2, { hazard: true });
  assert.deepEqual(loopEvents(s2), [{ type: 'sfx-loop', id: 'sfx-chainsaw-rev', on: false }]);
  step(s2, {}, sec(C.sammy.koTime + C.sammy.koWait) + 2);
  assert.equal(s2.player.saw, null);
  assert.equal(s2.pickups.find((p) => p.type === 'chainsaw').collected, false, 'saw is back on the grass');
});

test('chainsaw: the autopilot picks it up and still clears the level', () => {
  const s = S.newGame(); s.god = true;
  const bot = S.makeBot();
  let had = false, sliced = 0;
  for (let f = 0; f < sec(120) && s.mode !== 'clear'; f++) {
    S.update(s, S.botInput(s, bot)); s.events.length = 0;
    if (s.player.saw) had = true;
    sliced = Math.max(sliced, s.enemies.filter((e) => e.defeatStyle === 'sliced').length);
  }
  assert.equal(s.mode, 'clear');
  assert.ok(had, 'picked up the chainsaw');
  assert.ok(sliced > 0, 'used it in the gauntlet');
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
  assert.equal(m.fh, 48); assert.equal(m.py, 47);
});

test("Sammy's cells and feet points: one table, so he never hops when the animation changes", () => {
  // Rebuilt from the master sheets on 2026-10-20 (design/DECISIONS.md): most strips are 48 wide with the feet at (28, 47);
  // the crawl run, play-dead, ko, tail-whip and the chainsaw strips are wider, each with its own feet column. Since v03 (same day)
  // the chainsaw rev is 76 wide (the lifted saw reaches 47 px in front) and land is back on the plain 48/28 cell.
  const want = {
    'sammy:idle': [48, 28], 'sammy:run': [64, 36], 'sammy:jump-rise': [48, 28], 'sammy:fall': [48, 28], 'sammy:land': [48, 28],
    'sammy:tail-whip': [64, 36], 'sammy:hurt': [48, 28], 'sammy:play-dead': [64, 32], 'sammy:ko': [76, 38], 'sammy:victory': [48, 28],
    'sammy:chainsaw-idle': [64, 26], 'sammy:chainsaw-run': [64, 26], 'sammy:chainsaw-rev': [76, 26],
  };
  const sammy = S.ASSET_MANIFEST.filter((a) => a.key.startsWith('sammy:'));
  assert.deepEqual(sammy.map((a) => a.key).sort(), Object.keys(want).sort(), 'every Sammy slot is in the table');
  for (const a of sammy) {
    assert.deepEqual([a.fw, a.px], want[a.key], a.key + ' cell width and feet column');
    assert.equal(a.fh, 48, a.key + ' is 48 tall'); assert.equal(a.py, 47, a.key + ' feet on row 47'); assert.ok(a.feet, a.key + ' is a feet sprite');
    assert.ok(a.px >= 0 && a.px < a.fw, a.key + ' feet column inside the cell');
  }
});

test('chainsaw art cells are wide enough for the saw reach', () => {
  for (const k of ['idle', 'run', 'rev']) {
    const m = S.ASSET_MANIFEST.find((a) => a.key === 'sammy:chainsaw-' + k);
    assert.deepEqual([m.fw, m.fh, m.px, m.py], [k === 'rev' ? 76 : 64, 48, 26, 47], m.key);
    // The saw bar reaches 28 px in front of the feet point; the cell must hold it. Facing left needs no room on the other side:
    // render.js mirrors the whole cell around the feet column, so the same 37 px (49 while revving) lie in front either way.
    // The feet column is the same in all three, so the body never hops between idle, run and rev; only the cell is wider.
    assert.ok(m.px + C.chainsaw.reach <= m.fw, m.key + ' holds the reach in front of the feet');
    assert.equal(m.loop, 'loop');
  }
  const pk = S.ASSET_MANIFEST.find((a) => a.key === 'pickup:chainsaw');
  assert.deepEqual([pk.fw, pk.fh, pk.frames, pk.px, pk.py], [32, 16, 4, 16, 15]);
  const hud = S.ASSET_MANIFEST.find((a) => a.key === 'hud:chainsaw');
  assert.deepEqual([hud.fw, hud.fh, hud.px, hud.py, hud.feet], [16, 16, 0, 0, false]);
});

test('drawing Sammy: the code-made saw is never painted over real art (only in the placeholder Sammy\'s paws)', () => {
  // A pretend canvas that accepts every drawing call, and a pretend loaded strip for one animation.
  const ctx = new Proxy({}, { get: (o, k) => (k in o ? o[k] : () => {}), set: (o, k, v) => { o[k] = v; return true; } });
  const fake = (key) => Object.assign({ img: {}, file: key, flash: null }, S.ASSET_MANIFEST.find((a) => a.key === key));
  const saved = S.images;
  const s = S.newGame();
  const draws = (anim, state, withArt) => {
    S.images = withArt ? Object.fromEntries(withArt.map((k) => ['sammy:' + k, fake('sammy:' + k)])) : {};
    S.sawPlaceholderDraws = 0;
    Object.assign(s.player, { state, anim, animT: 0.1, t: 0.1, invuln: 0, saw: { fuel: 10, revving: anim === 'chainsaw-rev', tick: 0, slash: 0 } });
    S.drawSammy(ctx, s);
    return S.sawPlaceholderDraws;
  };
  try {
    // Real art for the current animation, with or without a saw variant: nothing extra is drawn (the top bar shows the saw).
    for (const [anim, state] of [['victory', 'victory'], ['hurt', 'hurt'], ['jump-rise', 'normal'], ['fall', 'normal'], ['land', 'normal'], ['tail-whip', 'attack']]) {
      assert.equal(draws(anim, state, [anim]), 0, anim + ' with real art');
    }
    for (const anim of ['chainsaw-idle', 'chainsaw-run', 'chainsaw-rev']) assert.equal(draws(anim, 'normal', [anim]), 0, anim + ' with real art');
    // No chainsaw strip, but plain idle/run art stands in: still nothing extra.
    assert.equal(draws('chainsaw-idle', 'normal', ['idle']), 0, 'idle art stands in for the chainsaw idle');
    assert.equal(draws('chainsaw-run', 'normal', ['run']), 0, 'run art stands in for the chainsaw run');
    // No art at all: the placeholder Sammy holds the placeholder saw (not while lying down).
    assert.equal(draws('chainsaw-idle', 'normal', null), 1, 'placeholder Sammy gets the placeholder saw');
    assert.equal(draws('victory', 'victory', null), 1, 'placeholder victory with the saw');
    assert.equal(draws('ko', 'ko', null), 0, 'lying down: no saw');
  } finally { S.images = saved; S.sawPlaceholderDraws = 0; }
});

test('scenery: slots have sizes and pivots that fit, level data only names real pieces, and the rules never read it', () => {
  const sc = S.ASSET_MANIFEST.filter((m) => m.key.startsWith('scenery:'));
  assert.equal(sc.length, 18);
  for (const m of sc) {
    assert.match(m.path, /^environments\/environment-(central-park-tileset|bethesda-terrace)\/.+-v01\.png$/, m.key);
    if (m.feet) { assert.equal(m.px, m.fw >> 1, m.key); assert.equal(m.py, m.fh - 1, m.key); }
  }
  const TYPES = new Set(['tree-far', 'tree-near', 'bench', 'lamp', 'fence', 'rock', 'trashcan', 'puddle', 'path', 'arch', 'balustrade', 'stairs', 'fountain', 'angel']);
  for (const p of S.LEVEL1.scenery) assert.ok(TYPES.has(p.type), 'scenery type ' + p.type);
  // benches and lamps sit on the platforms: seat row 12 of 32 and ledge row 12 of 64 line up with the platform tops
  const near = (type, x) => S.LEVEL1.scenery.some((p) => p.type === type && p.x === x);
  for (const p of S.LEVEL1.platforms) assert.ok(near(p.kind, p.x + p.w / 2), p.kind + ' piece at platform ' + p.x);
  assert.equal(C.groundY - 32 + 12, 172); assert.equal(C.groundY - 64 + 12, 140);
  assert.ok(!/scenery/.test(fs.readFileSync(path.join(src, 'sim.js'), 'utf8')), 'sim.js must not read scenery');
  const run = () => { const s = start(); step(s, { held: { right: true, attack: true } }, 300); return JSON.stringify([s.player.x, s.stats]); };
  const a = run(); const keep = S.LEVEL1.scenery; S.LEVEL1.scenery = []; const b = run(); S.LEVEL1.scenery = keep;
  assert.equal(a, b, 'the game plays the same with no scenery');
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
  // 'sfx-loop' is an event type (start/stop a looping sound), not a sound id.
  // Sounds named in config.js (a type's attackSfx / defeatSfx) count too: sim.js plays them without naming them.
  const cfgSrc = fs.readFileSync(path.join(src, 'config.js'), 'utf8');
  const used = [...new Set([...(simSrc + cfgSrc).matchAll(/'(sfx-[a-z0-9-]+)'/g)].map((m) => m[1]))].filter((id) => id !== 'sfx-loop');
  assert.ok(used.length > 15, 'found the sound calls in sim.js');
  for (const id of used) {
    assert.ok(ids.has(id), id + ' is in SOUND_MANIFEST');
    assert.ok(audioSrc.includes("'" + id + "':"), id + ' has a placeholder beep');
  }
  for (const id of ['sfx-cheer', 'sfx-leap', 'sfx-baby-rattle', 'sfx-baby-cry']) assert.ok(used.includes(id), id + ' is played');
  // Every planned sound has its folder in the library, so a real file has a place to land.
  for (const m of S.SOUND_MANIFEST) assert.ok(fs.existsSync(path.join(here, '..', '..', 'assets', m.dir, '.gitkeep')), m.id + ' has assets/' + m.dir + '.gitkeep');
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
    // Cheerleader: only her clocked strips (the leap's attack strip is picked by state; windup and landing are not strips).
    [C.cheerleader.hitReactTime, len('cheerleader:hit'), 'cheerleader hitReactTime'],
    [C.cheerleader.defeatTime, len('cheerleader:defeat'), 'cheerleader defeatTime'],
    [C.baby.attackTime, len('baby:attack'), 'baby attackTime'],
    [C.baby.attackHitStart, at('baby:attack', 'hitFrame'), 'baby attackHitStart'],
    [C.baby.attackHitEnd, (strip('baby:attack').hitFrame + 1) / strip('baby:attack').fps, 'baby attackHitEnd'],
    [C.baby.hitReactTime, len('baby:hit'), 'baby hitReactTime'],
    [C.baby.defeatTime, len('baby:defeat'), 'baby defeatTime'],
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
    put(SAM + 'sammy-run-strip-v01.png', png(512, 48, clear));
    put(SAM + 'sammy-run-strip-v02.png', png(512, 48, clear));   // newer: wins
    put(SAM + 'sammy-idle-strip-v01.png', png(192, 48, clear));  // only version
    put(SAM + 'sammy-hurt-strip-v03.png', png(96, 48, clear));   // v03 alone still counts
    put(SAM + 'sammy-runn-strip-v01.png', png(512, 48, clear));  // misnamed
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
  assert.ok(c.mute.x >= c.restart.x + c.restart.w && c.gore.x >= c.mute.x + c.mute.w && c.gore.y === c.mute.y, `${name}: RESTART, MUTE and GORE side by side`);
  if (L.orientation === 'landscape') {
    assert.ok(c.restart.y >= f.cssTop + 131 * s && c.restart.y + c.restart.h <= f.cssTop + f.cssH + 1e-9, `${name}: pause menu under the panel`);
  } else {
    for (const n of ['restart', 'mute', 'gore']) {
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
    for (const n of ['restart', 'mute', 'gore']) {
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
    for (const n of ['restart', 'mute', 'gore']) {
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
  assert.equal(S.ASSET_MANIFEST.length, 90); // 57 + five strips each for the hippie, sweater, cheerleader and baby + the Brute's 13 (2026-10-20)
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
      // (The "all" contact sheet is now too big for the pixel decoder's guard, so it is compared byte for byte instead.)
      const fr = fs.readFileSync(path.join(artTemplates, f)), ia = readChunks(fa), ir = readChunks(fr), pa = decodePixels(ia), pr = decodePixels(ir);
      assert.ok([ia.width, ia.height].join() === [ir.width, ir.height].join() && (pa && pr ? Buffer.from(pa).equals(Buffer.from(pr)) : fa.equals(fr)),
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
  // The level music is the owner's chosen loop edit (v02, in mp3 and ogg); the full song stays as v01 and is ignored because the newest version wins.
  const song = 'audio/music/music-level-01-central-park/music-level-01-central-park-v02.mp3';
  const songOgg = song.replace('.mp3', '.ogg');
  assert.ok(fs.existsSync(path.join(libRoot, 'assets', song)) && fs.existsSync(path.join(libRoot, 'assets', songOgg)), 'loop files are in assets/');
  assert.ok(fs.existsSync(path.join(libRoot, 'assets', song.replace('-v02', '-v01'))), 'the full song is kept as v01');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sammy-song-'));
  try {
    const r = scan(libRoot, path.join(tmp, 'asset-files.js')); // reads the real library, writes only to the temp folder
    assert.deepEqual(r.sounds['music-level-01-central-park'], [song, songOgg], 'the scanner lists the newest version (both formats), so the game loads it');
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
  const reserved = new Set(['blood0', 'blood', 'bloodHi', 'ichor0', 'ichor', 'ichorHi', 'bone', 'meat']);
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

// ---------- gore setting (drawing only) ----------
// A pretend drawing surface that records every colour drawn with.
function colorCtx() {
  const used = new Set();
  return new Proxy({}, {
    get: (o, k) => (k === 'used' ? used : k in o ? o[k] : () => {}),
    set: (o, k, v) => { if (k === 'fillStyle') used.add(String(v).toLowerCase()); o[k] = v; return true; },
  });
}
// Zombies going down in every style, plus every gore effect, shaking and frozen.
function goreScene(s) {
  const p = s.player, y = G - 20;
  const jog = s.enemies.find((e) => e.type === 'jogger'), ven = s.enemies.find((e) => e.type === 'vendor');
  const demo = [[jog, 'pop'], [Object.assign({}, jog, { id: 'j2' }), 'sliced'], [ven, 'deflate'], [Object.assign({}, ven, { id: 'v2' }), 'sliced']];
  demo.forEach(([e, style], i) => {
    Object.assign(e, { x: p.x + 30 + i * 30, y: G, face: -1, state: 'defeat', t: 0.2, anim: 'defeat', animT: 0.2, defeatStyle: style });
    if (!s.enemies.includes(e)) s.enemies.push(e);
  });
  s.effects.push({ kind: 'blood', x: p.x + 20, y, t: 0.1, life: 0.8, n: 10, dir: 1, power: 1 },
    { kind: 'chunk', x: p.x + 40, y, t: 0.1, life: 0.8, dir: 1 }, { kind: 'ichor', x: p.x + 60, y, t: 0.1, life: 0.6, n: 6 },
    { kind: 'sparks', x: p.x + 20, y, t: 0.05, life: 0.15, dir: -1 });
  s.shake = 0.2; s.hitstop = 0.05;
}

test('gore setting: low never draws a drop of blood, guts or ichor; full does', () => {
  const was = S.gore;
  const gore = new Set(Object.values(S.GORE_COLORS).map((c) => c.toLowerCase()));
  for (const g of ['full', 'low']) {
    S.setGore(g);
    const s = start(); goreScene(s);
    const ctx = colorCtx();
    S.render(ctx, s);
    const red = [...ctx.used].filter((c) => gore.has(c));
    if (g === 'low') assert.deepEqual(red, [], 'low gore drew gore colours: ' + red.join(', '));
    else assert.ok(red.length >= 3, 'full gore draws blood, guts and ichor colours: ' + red.join(', '));
  }
  S.setGore(was);
});

test('gore setting: picked from ?gore=, else what the browser remembered, else full; blocked storage is fine', () => {
  assert.equal(S.pickGore('low', null), 'low');
  assert.equal(S.pickGore('full', 'low'), 'full', '?gore=full wins over the remembered choice');
  assert.equal(S.pickGore(null, 'low'), 'low');
  assert.equal(S.pickGore('banana', 'junk'), 'full');
  assert.equal(S.setGore('nonsense'), 'full'); assert.equal(S.setGore('low'), 'low'); S.setGore('full');
  const mem = {}, store = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); } };
  assert.equal(S.readGorePref(store), 'full');
  assert.equal(S.writeGorePref(store, 'low'), true); assert.equal(mem['sammy.gore'], 'low');
  assert.equal(S.readGorePref(store), 'low');
  const blocked = { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('QuotaExceeded'); } };
  assert.equal(S.readGorePref(blocked), 'full'); assert.equal(S.writeGorePref(blocked, 'low'), false);
  assert.equal(S.readGorePref(null), 'full'); assert.equal(S.writeGorePref(undefined, 'low'), false);
});

test('gore setting: the rules never read it, G is not a game button, and the game plays the same either way', () => {
  assert.ok(!/S\.gore|GorePref/.test(fs.readFileSync(path.join(src, 'sim.js'), 'utf8')), 'sim.js must not read the gore setting');
  assert.ok(!('gore' in S.makeInput().pressed) && !('gore' in S.makeInput().held));
  const run = (g) => {
    S.setGore(g); const s = start();
    step(s, { held: { right: true, attack: true } }, 240);
    return JSON.stringify([s.player.x, s.player.y, s.stats, s.enemies.map((e) => [e.x, e.state])]);
  };
  assert.equal(run('full'), run('low'));
  S.setGore('full');
});

// ---------- zombie roster, builder 1: the hippie and the sweater (2026-10-20) ----------
// A level with only the given enemies (plus the usual ground, platforms and arena), started, with the cart and pickups removed.
function withTypes(defs, fn) {
  const level = Object.assign({}, S.LEVEL1, { enemies: defs });
  const s = S.newGame(level); step(s, { pressed: { start: true } }); s.carts = []; s.pickups = []; events(s);
  return fn(s, s.enemies[0]);
}
const bodyOf = (e) => S.footBox(e, C[e.type].bodyW, C[e.type].bodyH);

test('hippie and sweater: their rows, cells and timings match the design (ZOMBIE-ROSTER-AND-BOSSES.md 2.3 and 2.4)', () => {
  const H = C.hippie, W = C.sweater;
  assert.deepEqual([H.brain, H.hp, H.patrolSpeed, H.chaseSpeed, H.knockback, H.sawKnockback, H.cartKnock, H.hitY, H.possum, H.possumIgnore, H.defeatStyle, H.sawStyle, H.flinch],
    ['walker', 3, 18, 36, 60, 20, 80, 26, 'confused', 3.0, 'melt', 'sliced', true]);
  assert.deepEqual([W.brain, W.hp, W.patrolSpeed, W.chaseSpeed, W.knockback, W.sawKnockback, W.cartKnock, W.hitY, W.possum, W.sniffStop, W.possumIgnore, W.defeatStyle, W.sawStyle, W.flinch],
    ['walker', 3, 22, 50, 0, 0, 0, 36, 'sniff', 32, 1.5, 'flop', 'sliced', false]);
  assert.deepEqual([W.shoveKnockX, W.shoveKnockY, W.stripsLid], [240, 150, true]);
  assert.ok(W.shoveKnockX === 2 * C.sammy.hurtKnockX, 'the shove throws twice as far as a bump');
  assert.ok(W.sniffStop > W.bodyW / 2 + C.sammy.deadW / 2, 'the sniff stop keeps his body off the lying Sammy');
  assert.ok(H.pool > H.defeatTime, 'the goo pool outlives the melt');
  // Cells: the hippie in the usual 48x48, feet (24, 47); the sweater in 64x56, feet (32, 55).
  const anims = ['walk', 'attack', 'hit', 'defeat', 'idle'];
  for (const a of anims) {
    const h = S.ASSET_MANIFEST.find((m) => m.key === 'hippie:' + a), w = S.ASSET_MANIFEST.find((m) => m.key === 'sweater:' + a);
    assert.deepEqual([h.fw, h.fh, h.px, h.py, h.feet], [48, 48, 24, 47, true], 'hippie:' + a);
    assert.deepEqual([w.fw, w.fh, w.px, w.py, w.feet], [64, 56, 32, 55, true], 'sweater:' + a);
    assert.equal(h.path, 'enemies/enemy-zombie-hippie/zombie-hippie-' + a + '-strip-v01.png');
    assert.equal(w.path, 'enemies/enemy-zombie-sweater/zombie-sweater-' + a + '-strip-v01.png');
    assert.ok(fs.existsSync(path.join(libRoot, 'assets', path.posix.dirname(h.path), '.gitkeep')) && fs.existsSync(path.join(libRoot, 'assets', path.posix.dirname(w.path), '.gitkeep')), 'asset folders exist');
  }
  const frames = (k) => { const m = S.ASSET_MANIFEST.find((x) => x.key === k); return [m.frames, m.fps, m.loop, m.hitFrame]; };
  assert.deepEqual([frames('hippie:walk'), frames('hippie:attack'), frames('hippie:hit'), frames('hippie:defeat'), frames('hippie:idle')],
    [[6, 6, 'loop', undefined], [4, 10, 'once', 2], [2, 12, 'once', undefined], [8, 12, 'once', undefined], [4, 6, 'loop', undefined]]);
  assert.deepEqual([frames('sweater:walk'), frames('sweater:attack'), frames('sweater:hit'), frames('sweater:defeat'), frames('sweater:idle')],
    [[6, 6, 'loop', undefined], [4, 8, 'once', 2], [2, 12, 'once', undefined], [8, 10, 'once', undefined], [4, 6, 'loop', undefined]]);
  // Timings = frames / fps, like the jogger's.
  const strip = (key) => S.ASSET_MANIFEST.find((m) => m.key === key);
  for (const [type, art] of [['hippie', 'hippie'], ['sweater', 'sweater']]) {
    const k = C[type], at = strip(art + ':attack');
    assert.ok(Math.abs(k.attackTime - at.frames / at.fps) < 1e-9, type + ' attackTime');
    assert.ok(Math.abs(k.attackHitStart - at.hitFrame / at.fps) < 1e-9, type + ' attackHitStart');
    assert.ok(Math.abs(k.attackHitEnd - (at.hitFrame + 1) / at.fps) < 1e-9, type + ' attackHitEnd');
    assert.ok(Math.abs(k.hitReactTime - strip(art + ':hit').frames / strip(art + ':hit').fps) < 1e-9, type + ' hitReactTime');
    assert.ok(Math.abs(k.defeatTime - strip(art + ':defeat').frames / strip(art + ':defeat').fps) < 1e-9, type + ' defeatTime');
  }
  // The walker brain has the sniff state and draws it with the walk strip; sniff is a known Play Possum reaction.
  assert.ok(S.ENEMY_TYPES.sweater.states.includes('sniff')); assert.equal(S.ENEMY_TYPES.sweater.anims.sniff, 'walk');
  assert.throws(() => S.defineEnemyType('odd', Object.assign({}, C.vendor, { possum: 'sniff' })), /Play Possum with "sniff"/, 'a turret cannot sniff');
  assert.ok(!S.ENEMY_TYPES.odd);
});

test('hippie: three whips, half a jogger knockback, melts into a goo pool that outlives him; 3 s of Play Possum grace', () => {
  withTypes([{ type: 'hippie', x: 600 }], (s, e) => {
    assert.equal(e.hp, 3); assert.equal(e.defeatStyle, 'melt');
    e.state = 'confused'; place(s, e.x - 22);
    step(s, { pressed: { attack: true } });
    assert.ok(runUntil(s, () => e.state === 'hitreact', sec(0.3)) >= 0, 'whipped');
    assert.equal(e.hp, 2);
    assert.equal(Math.abs(e.vx), C.hippie.knockback * 0.85, 'pushed at 60 (one frame of slowing): ' + e.vx);
    assert.ok(Math.abs(e.vx) < C.jogger.knockback * 0.85, 'less than a jogger');
    step(s, {}, sec(0.3));
    for (let i = 0; i < 2; i++) { e.state = 'confused'; e.x = s.player.x + 20; s.player.face = 1; events(s); step(s, { pressed: { attack: true } }, sec(0.3)); }
    assert.equal(e.state, 'defeat'); assert.equal(e.defeatStyle, 'melt'); assert.equal(s.stats.defeated, 1);
    const ids = events(s);
    assert.ok(ids.includes('sfx-zombie-melt') && ids.includes('sfx-zombie-defeat-comedic') && ids.includes('sfx-gore-splat'));
    const pool = s.effects.find((f) => f.kind === 'melt-pool');
    assert.ok(pool, 'a goo pool under him');
    assert.deepEqual([pool.x, pool.y, pool.life, pool.melt, pool.type], [e.x, G, C.hippie.pool, C.hippie.defeatTime, 'hippie']);
    assert.equal(s.effects.filter((f) => f.kind === 'chunk').length, 0, 'a whip kill throws no chunks');
    // The body goes, the pool stays about a second longer, then it is gone.
    step(s, {}, sec(C.hippie.defeatTime) + 2);
    assert.equal(e.state, 'dead');
    assert.ok(s.effects.includes(pool), 'pool still there after the body');
    step(s, {}, sec(C.hippie.pool - C.hippie.defeatTime) + 2);
    assert.ok(!s.effects.includes(pool), 'pool gone');
  });
  // Play Possum: confused, then he ignores Sammy for 3.0 s (a jogger: 1.5).
  withTypes([{ type: 'hippie', x: 600 }, { type: 'jogger', x: 640 }], (s, e) => {
    const j = s.enemies[1];
    place(s, 560); step(s, {}, 2);
    assert.equal(e.state, 'chase');
    step(s, { pressed: { possum: true } });
    assert.equal(e.state, 'confused'); assert.equal(j.state, 'confused');
    step(s, {}, sec(C.possum.maxTime + C.possum.getUpTime + 0.1));
    assert.equal(s.player.state, 'normal');
    assert.ok(e.ignoreT > 2.8 && e.ignoreT <= 3.0, 'hippie grace ' + e.ignoreT);
    assert.ok(j.ignoreT > 1.3 && j.ignoreT <= 1.5, 'jogger grace ' + j.ignoreT);
    assert.equal(s.player.hp, C.sammy.maxHp);
  });
});

test('hippie: the chainsaw slices him like anyone, with no goo pool', () => {
  withTypes([{ type: 'hippie', x: 600 }], (s, e) => {
    place(s, 582); s.player.saw = { fuel: C.chainsaw.fuel, revving: false, tick: 0, slash: 0 };
    e.state = 'confused'; e.confused = true; e.cd = 9; events(s);
    step(s, { pressed: { attack: true }, held: { attack: true } });
    assert.equal(e.hp, 2);
    const n = runUntil(s, () => e.state === 'defeat', sec(1), { held: { attack: true } });
    assert.ok(n >= 0 && n <= 2 * sec(C.chainsaw.tick) + 2, 'two more cuts: ' + n);
    assert.equal(e.defeatStyle, 'sliced');
    assert.ok(!s.effects.some((f) => f.kind === 'melt-pool'), 'no pool from the saw');
    assert.ok(!events(s).includes('sfx-zombie-melt'));
    assert.ok(s.effects.some((f) => f.kind === 'chunk') && s.hitstop > 0);
  });
});

test('sweater: never flinches (a whip flashes him white and he keeps coming), three whips flop him', () => {
  withTypes([{ type: 'sweater', x: 600 }], (s, e) => {
    assert.equal(e.defeatStyle, 'flop');
    e.state = 'chase'; e.vx = 30; e.cd = 9; place(s, e.x - 26);
    step(s, { pressed: { attack: true } }, sec(0.2));
    assert.equal(e.hp, 2, 'took the hit');
    assert.ok(e.state === 'chase' || e.state === 'attack', 'never reeled: ' + e.state);
    assert.ok(e.flashT > 0 && e.flashT <= C.sweater.hitReactTime, 'flashing: ' + e.flashT);
    assert.ok(events(s).includes('sfx-hit-zombie'));
    step(s, {}, sec(0.3)); assert.equal(e.flashT, 0);
    for (let i = 0; i < 2; i++) { e.state = 'chase'; e.cd = 9; e.x = s.player.x + 24; s.player.face = 1; step(s, { pressed: { attack: true } }, sec(0.3)); }
    assert.equal(e.state, 'defeat'); assert.equal(e.defeatStyle, 'flop'); assert.equal(s.stats.defeated, 1);
    assert.ok(!s.effects.some((f) => f.kind === 'melt-pool' || f.kind === 'chunk'));
    step(s, {}, sec(C.sweater.defeatTime) + 2);
    assert.equal(e.state, 'dead');
  });
  // The cart's spill puts him in hitreact without moving him (cartKnock 0), like the stub test for the table.
  withTypes([{ type: 'sweater', x: 620 }], (s, e) => {
    s.carts = [{ id: 'cart0', def: { x: 560 }, x: 560, state: 'tipping', t: 0, tipDir: 1, anim: 'tipping', animT: 0, spill: [] }];
    e.state = 'confused'; place(s, 400);
    step(s, {}, sec(C.cart.tipTime) + 1);
    assert.equal(e.state, 'hitreact'); assert.equal(e.vx, 0);
  });
});

test('sweater: the shove throws Sammy 240 and strips the whole lid (no heart lost); unblocked it costs a heart; a plain bump is an ordinary hit', () => {
  const shoveAt = (s, e) => { e.state = 'attack'; e.t = 0; e.attackHit = false; e.cd = 0; e.face = -1; e.x = s.player.x + 26; e.y = G; }; // 26: his body clear of Sammy's, his shove box over it
  withTypes([{ type: 'sweater', x: 600 }], (s, e) => {
    const p = s.player;
    place(s, 580); p.shield = 3; p.invuln = 0;
    shoveAt(s, e);
    const n = runUntil(s, () => p.shield !== 3, sec(1));
    assert.ok(n >= 0, 'the shove landed');
    assert.equal(p.shield, 0, 'every lid charge gone in one shove');
    assert.equal(p.hp, C.sammy.maxHp, 'no heart lost');
    assert.equal(p.state, 'hurt', 'still thrown');
    assert.deepEqual([p.vx, p.vy, p.grounded], [-C.sweater.shoveKnockX, -C.sweater.shoveKnockY, false]);
    const ids = events(s);
    assert.ok(ids.includes('sfx-shield-break') && ids.includes('sfx-zombie-shove'), ids.join(','));
    assert.ok(!ids.includes('sfx-hurt'));
    assert.ok(p.invuln > 0 && p.invuln <= 0.3);
    assert.ok(e.x > p.x, 'he is not pushed back by the lid (shieldPush 0)');
    // Unblocked: a heart and the big throw.
    runUntil(s, () => p.state === 'normal' && p.grounded, sec(2));
    place(s, 580); p.invuln = 0; p.shield = 0; events(s);
    shoveAt(s, e);
    assert.ok(runUntil(s, () => p.hp < C.sammy.maxHp, sec(1)) >= 0, 'hurt');
    assert.equal(p.hp, C.sammy.maxHp - 1);
    assert.deepEqual([p.vx, p.vy], [-C.sweater.shoveKnockX, -C.sweater.shoveKnockY]);
    assert.ok(events(s).includes('sfx-zombie-shove'));
    assert.ok(p.invuln > 0.9);
    // Touching him (a bump, not the shove) is a jogger-style hit: one lid charge, no throw, no shove sound.
    runUntil(s, () => p.state === 'normal' && p.grounded, sec(2));
    place(s, 580); p.invuln = 0; p.shield = 3; events(s);
    e.state = 'chase'; e.cd = 9; e.x = p.x + 8; e.y = G; e.vx = 0;
    step(s);
    assert.equal(p.shield, 2, 'one charge');
    assert.equal(p.state, 'normal'); assert.equal(p.vx, 0);
    assert.ok(!events(s).includes('sfx-zombie-shove'));
    // A jogger's attack still knocks at the usual 120.
    const j = S.makeEnemy({ type: 'jogger', x: 700 }, 9);
    s.enemies.push(j);
    runUntil(s, () => p.state === 'normal' && p.grounded, sec(2));
    place(s, 680); p.invuln = 0; p.shield = 0; e.x = 900;
    j.state = 'attack'; j.t = 0; j.attackHit = false; j.face = -1; j.x = p.x + 22; j.y = G;
    assert.ok(runUntil(s, () => p.state === 'hurt', sec(1)) >= 0);
    assert.deepEqual([p.vx, p.vy], [-C.sammy.hurtKnockX, -C.sammy.hurtKnockY]);
  });
});

test('sweater: Play Possum makes him sniff: he walks up at patrol speed, stops 32 px away facing Sammy, never touches him, and gives 1.5 s of grace', () => {
  withTypes([{ type: 'sweater', x: 600 }], (s, e) => {
    const p = s.player;
    place(s, 530); step(s, {}, 2);
    assert.equal(e.state, 'chase');
    step(s, { pressed: { possum: true } });
    assert.equal(p.state, 'playdead'); assert.equal(e.state, 'sniff'); assert.ok(e.confused);
    step(s);
    assert.equal(e.anim, 'walk'); assert.equal(e.face, -1);
    assert.equal(e.vx, -C.sweater.patrolSpeed, 'walks over at patrol speed');
    let minGap = Infinity, touched = false, stopped = -1;
    for (let i = 0; i < sec(2.5); i++) {
      step(s);
      minGap = Math.min(minGap, Math.abs(e.x - p.x));
      if (S.overlap(bodyOf(e), S.playerBox(p))) touched = true;
      if (stopped < 0 && e.state === 'confused') stopped = i;
    }
    assert.ok(stopped > 0, 'stopped to sniff');
    assert.equal(e.state, 'confused'); assert.equal(e.vx, 0); assert.equal(e.anim, 'idle'); assert.equal(e.face, -1);
    assert.ok(minGap <= C.sweater.sniffStop + 1 && minGap >= C.sweater.sniffStop - 2, 'stands sniffStop away: ' + minGap);
    assert.ok(!touched, 'his body never touches the lying Sammy');
    assert.equal(p.hp, C.sammy.maxHp); assert.equal(p.state, 'playdead');
    assert.ok(events(s).includes('sfx-zombie-sniff'));
    // Sammy gets up: the usual grace, and he goes back to patrolling from where he stands.
    runUntil(s, () => p.state === 'normal', sec(2));
    assert.equal(e.state, 'patrol'); assert.ok(!e.confused);
    assert.ok(e.ignoreT > 1.3 && e.ignoreT <= 1.5, 'grace ' + e.ignoreT);
    assert.ok(Math.abs(e.home - e.x) < 1, 'patrols from where he stood');
  });
  // Getting up while he is still walking over releases him too (no stuck sniff).
  withTypes([{ type: 'sweater', x: 600 }], (s, e) => {
    const p = s.player;
    place(s, 510); step(s, {}, 2);
    step(s, { pressed: { possum: true } });
    assert.equal(e.state, 'sniff');
    step(s, {}, sec(0.6));
    assert.equal(e.state, 'sniff', 'still on his way');
    step(s, { pressed: { jump: true } });
    runUntil(s, () => p.state === 'normal', sec(1));
    assert.equal(e.state, 'patrol'); assert.ok(!e.confused && e.ignoreT > 1.3);
  });
  // Fooled in the middle of a shove: the shove finishes, then he sniffs (never 'confused' straight from the attack).
  withTypes([{ type: 'sweater', x: 600 }], (s, e) => {
    place(s, 560);
    e.state = 'attack'; e.t = 0; e.attackHit = true; e.face = -1;
    step(s, { pressed: { possum: true } });
    assert.equal(e.state, 'attack'); assert.ok(e.confused);
    step(s, {}, sec(C.sweater.attackTime) + 1);
    assert.equal(e.state, 'sniff');
  });
  // A ledge stops the sniff walk: he never shambles into the pond after a "dead" Sammy on the far bank.
  withTypes([{ type: 'sweater', x: 2336 }], (s, e) => {
    place(s, 2430); e.state = 'chase'; e.face = 1; // 94 px apart across the pond (2344-2424): inside the Play Possum radius
    step(s, { pressed: { possum: true } });
    assert.ok(e.state === 'sniff' || e.state === 'confused', e.state); // the ledge is right ahead: he may stop at once
    step(s, {}, sec(2));
    assert.ok(e.x < 2344 && e.y === G && e.state === 'confused', 'stopped at the pond edge: x ' + e.x + ' ' + e.state);
  });
});

test('hippie and sweater: gag lines are their own, short, and in the font; the placeholders draw every state in their colours, with and without gore', () => {
  for (const [type, style] of [['hippie', 'melt'], ['sweater', 'flop']]) {
    const lines = S.GAGS_BY_TYPE[type][style];
    assert.ok(lines && lines.length >= 3, type + ' has its own ' + style + ' lines');
    for (const t of lines) {
      assert.ok(t.length <= 16, t);
      for (const ch of t) assert.ok(S.GLYPHS[ch.toUpperCase()], `"${ch}" in "${t}" is in the font`);
      assert.ok(S.textWidth(t) < 80, t + ' fits over a zombie');
    }
  }
  assert.deepEqual(S.GAGS_BY_TYPE.hippie.melt, ['PEACE. OUT.', 'FAR OUT, MAN.', 'BUMMER.']);
  assert.deepEqual(S.GAGS_BY_TYPE.sweater.flop, ['BUNNY DOWN.', 'FASHION VICTIM.', 'NICE SWEATER.']);
  const gore = new Set(Object.values(S.GORE_COLORS).map((c) => c.toLowerCase()));
  const was = S.gore;
  const own = { hippie: [S.PAL.hippie, S.PAL.hippieSkin], sweater: [S.PAL.sweaterGold, S.PAL.sweaterTeal] };
  for (const type of ['hippie', 'sweater']) {
    withTypes([{ type, x: 600 }], (s, e) => {
      place(s, 560); e.x = 600;
      const T = S.ENEMY_TYPES[type];
      for (const g of ['full', 'low']) {
        S.setGore(g);
        for (const st of T.states) {
          if (st === 'dead') continue;
          Object.assign(e, { state: st, t: 0.2, anim: T.anims[st], animT: 0.2, flashT: 0, defeatStyle: T.cfg.defeatStyle });
          const ctx = colorCtx(); S.render(ctx, s);
          if (st !== 'hitreact') for (const c of own[type]) assert.ok(ctx.used.has(c.toLowerCase()), `${type} ${st} drawn in its own colour ${c}`); // hitreact = the white flash
          if (st === 'attack') { e.t = T.cfg.attackHitStart + 0.01; S.render(colorCtx(), s); }
        }
        // The flash is white; the saw death and the whip death both draw; the goo pool shows in both modes without a gore colour.
        Object.assign(e, { state: T.cfg.start, anim: T.cfg.startAnim, flashT: 0.1 });
        const fl = colorCtx(); S.render(fl, s); assert.ok(fl.used.has(S.PAL.white.toLowerCase())); e.flashT = 0;
        for (const style of [T.cfg.defeatStyle, 'sliced']) for (const t of [0.05, 0.4, 0.7]) {
          Object.assign(e, { state: 'defeat', t, anim: 'defeat', animT: t, defeatStyle: style, sliceDir: 1 });
          s.effects = style === 'melt' ? [{ kind: 'melt-pool', x: e.x, y: G, t, life: C.hippie.pool, melt: C.hippie.defeatTime, type }] : [];
          const ctx = colorCtx(); S.render(ctx, s);
          const red = [...ctx.used].filter((c) => gore.has(c));
          if (g === 'low') assert.deepEqual(red, [], `${type} ${style} low gore drew ${red}`);
          else if (style === 'sliced') assert.ok(red.length >= 1, type + ' sliced bleeds');
          if (style === 'melt') assert.ok(ctx.used.has(S.PAL.hippieGoo.toLowerCase()), 'the pool is purple goo');
          if (style === 'flop') assert.ok(ctx.used.has(S.PAL.slipper.toLowerCase()) && ctx.used.has(S.PAL.mustard.toLowerCase()), 'slippers and the duck fly');
        }
      }
    });
  }
  S.setGore(was);
});

test('hippie and sweater: the new sounds are planned, have beeps and folders, and the rules call them', () => {
  const simSrc = fs.readFileSync(path.join(src, 'sim.js'), 'utf8'), audioSrc = fs.readFileSync(path.join(src, 'audio.js'), 'utf8');
  const ids = new Set(S.SOUND_MANIFEST.map((m) => m.id));
  for (const id of ['sfx-zombie-melt', 'sfx-zombie-shove', 'sfx-zombie-sniff']) {
    assert.ok(ids.has(id), id + ' planned');
    assert.ok(audioSrc.includes("'" + id + "':"), id + ' beep');
    assert.ok(simSrc.includes("'" + id + "'"), id + ' called by the rules');
    assert.ok(fs.existsSync(path.join(libRoot, 'assets', 'audio', 'sfx', id, '.gitkeep')), id + ' folder');
  }
});

test('hippie and sweater: the autopilot clears level 1 with them placed where the design puts them, and the run is deterministic', () => {
  // The design's spots (3.): hippies at 940, 2150 and 3440, the sweater at 2720, placed in level.js since 2026-10-20.
  const placed = S.LEVEL1.enemies;
  assert.deepEqual(placed.filter((d) => d.type === 'hippie').map((d) => d.x), [940, 2150, 3440]);
  assert.deepEqual(placed.filter((d) => d.type === 'sweater').map((d) => d.x), [2720]);
  const run = () => {
    const s = S.newGame(); s.god = true;
    const bot = S.makeBot();
    let f = 0;
    for (; f < sec(150) && s.mode !== 'clear'; f++) { S.update(s, S.botInput(s, bot)); s.events.length = 0; }
    return s;
  };
  const s = run();
  assert.equal(s.mode, 'clear', 'stuck at x ' + Math.round(s.player.x));
  assert.ok(s.stats.defeated >= placed.length - 2, 'fought its way through: ' + s.stats.defeated);
  const a = run(), b = run();
  assert.equal(JSON.stringify([a.stats, Math.round(a.player.x * 100)]), JSON.stringify([b.stats, Math.round(b.player.x * 100)]));
});

// ---------- THE BRUTE (level 1 boss, 2026-10-20) ----------
const B = C.brute;
// The arena with the waves already cleared and the boss in: Sammy at x (left side by default), the boss at bossX (the arch by
// default), skipping his entrance unless asked. The supplies the arena drops are removed unless asked for, so they can't be
// picked up by accident. Returns [state, boss].
function bossFight(opts = {}) {
  const s = start();
  s.enemies = s.enemies.filter((e) => e.def.x > 9999);
  if (opts.god) s.god = true;
  place(s, opts.x || 3600, { cp: 2576, face: opts.face || 1 });
  s.arena = { state: 'boss', wave: C.gauntlet.waves.length, timer: 0, spawnCount: 9 };
  const e = S.spawnBoss(s);
  if (!opts.supplies) s.pickups = s.pickups.filter((pk) => !pk.supply);
  if (opts.saw) s.player.saw = { fuel: C.chainsaw.fuel, revving: false, tick: 0, slash: 0 };
  if (!opts.enter) { e.state = 'walk'; e.t = 0; e.decideT = 0; e.face = -1; }
  if (opts.bossX != null) e.x = opts.bossX;
  if (opts.hp != null) e.hp = opts.hp;
  s.effects = []; s.shake = 0; events(s);
  return [s, e];
}
const stateIn = (s, e, st, max, spec) => runUntil(s, () => e.state === st, max, spec);
// Standing inside him for a frame: does it cost a heart?
function touchHurts(s, e) {
  const p = s.player; p.x = e.x; p.y = G; p.vx = 0; p.vy = 0; p.grounded = true; p.invuln = 0; p.shield = 0; p.hp = 3; p.state = 'normal';
  step(s); return p.hp < 3;
}

test('brute: the arena brings him in after the last wave (with the banner and the supplies), keeps the walls up, and opens the exit only when he is dead', () => {
  const s = start(); s.god = true;
  s.enemies = s.enemies.filter((e) => e.def.x > 9999);
  place(s, 3700, { cp: 2576 });
  s.arena = { state: 'fight', wave: C.gauntlet.waves.length - 1, timer: 0, spawnCount: 9 }; // last wave, nobody left
  step(s);
  assert.equal(s.arena.state, 'boss'); assert.ok(s.arena.timer > 0.9, 'a moment of quiet first'); assert.ok(s.shake > 0, 'the ground shakes');
  assert.ok(S.getSolids(s).some((b) => b.kind === 'arena-wall') && S.getSolids(s).some((b) => b.kind === 'gate'), 'still locked in');
  step(s, {}, sec(C.gauntlet.bossDelay) + 1);
  const e = s.enemies.find((q) => q.boss);
  assert.ok(e && e.type === C.gauntlet.boss, 'the boss is in');
  assert.ok(Math.abs(e.x - (s.level.arena.gateX - C.gauntlet.bossArch)) < 1, 'out of the arch nearest the gate: ' + e.x);
  assert.equal(e.state, 'enter'); assert.equal(e.face, -1); assert.equal(e.hp, B.hp); assert.ok(e.arena && e.boss);
  assert.equal(s.arena.spawnCount, 9, 'he is not counted as a wave zombie');
  assert.ok(s.effects.some((f) => f.kind === 'text' && f.text === B.lines.enter), 'entrance banner');
  assert.ok(events(s).includes('sfx-boss-chains'));
  // The supplies (owner answer 4): a trash lid and a chainsaw drop in by the left wall and land on the terrace.
  const sup = s.pickups.filter((pk) => pk.supply);
  assert.deepEqual(sup.map((pk) => pk.type).sort(), ['chainsaw', 'lid']);
  step(s, {}, sec(1.5));
  for (const pk of sup) assert.ok(pk.landed && pk.y === G && pk.x > s.level.arena.x0 && pk.x < s.level.arena.gateX && !pk.collected, pk.type + ' landed inside the arena');
  // The gate stays shut while he lives, even with nothing else alive.
  step(s, {}, sec(2));
  assert.equal(s.arena.state, 'boss');
  // Dead: the gate opens as before, with the same line.
  e.hp = 1; e.state = 'walk'; place(s, e.x - 30, { cp: 2576 }); step(s, { pressed: { attack: true } }, sec(0.3));
  assert.equal(e.state, 'defeat');
  step(s, {}, sec(B.defeatTime + B.deathHold) + 2);
  assert.ok(!s.enemies.some((q) => q.boss), 'gone'); assert.equal(s.arena.state, 'open');
  assert.ok(s.effects.some((f) => f.kind === 'text' && f.text === 'EXIT OPEN. GO.'));
  assert.ok(events(s).includes('sfx-gate-open') && s.events.length === 0);
  place(s, 3810, { cp: 2576 }); step(s, { held: { right: true } }, 20);
  assert.equal(s.mode, 'clear');
});

test('brute: the entrance (walks out of the arch, roars, then comes), touching him hurts, and he never flinches from a hit', () => {
  const [s, e] = bossFight({ enter: true, x: 3540 });
  e.slamCd = 10; // far away, no slam: this test watches him walk
  const x0 = e.x;
  step(s, {}, sec(B.enterWalk));
  assert.ok(x0 - e.x > B.walkSpeed * B.enterWalk - 3 && x0 - e.x <= B.walkSpeed * B.enterWalk + 1, 'walked out of the arch: ' + (x0 - e.x));
  assert.equal(e.state, 'enter'); assert.equal(e.anim, 'walk');
  step(s, {}, 2);
  assert.ok(events(s).includes('sfx-boss-roar'), 'the roar'); assert.ok(s.shake > 0);
  step(s, {}, sec(B.enterRoar));
  assert.equal(e.state, 'walk');
  const xw = e.x; step(s, {}, sec(1)); e.slamCd = 10; assert.ok(e.x < xw - 20 && e.face === -1, 'comes for Sammy at walk speed');
  assert.ok(touchHurts(s, e), 'walking into him hurts');
  // A whip takes a hit point, flashes him white, plays the meaty thud, and changes nothing else (flinch: false; no knockback).
  e.state = 'walk'; e.t = 0; e.decideT = 9; place(s, e.x - 34, { cp: 2576 }); s.player.invuln = 5; events(s);
  const ex = e.x;
  step(s, { pressed: { attack: true } });
  assert.ok(runUntil(s, () => e.hp < B.hp, sec(0.3)) >= 0, 'whipped');
  step(s, {}, 2);
  assert.equal(e.hp, B.hp - 1); assert.equal(e.state, 'walk'); assert.ok(e.flashT > 0, 'flashing'); assert.ok(e.hitT > 0, 'portrait wince timer');
  step(s, {}, sec(0.15));
  assert.ok(Math.abs(e.x - ex) < B.walkSpeed * 0.35 + 1, 'not pushed back');
  const ids = events(s); assert.ok(ids.includes('sfx-boss-hit') && ids.includes('sfx-hit-zombie'));
  assert.ok(s.effects.some((f) => f.kind === 'blood'), 'bleeds');
  assert.equal(s.effects.filter((f) => f.kind === 'chunk').length, 0, 'a whip throws no chunks');
});

test('brute: SWIPE: tell, step, three swings that reach the floor (lying flat fails) and throw Sammy twice as far, then a safe opening', () => {
  const [s, e] = bossFight({ x: 3650, bossX: 3700 });
  s.player.invuln = 0;
  assert.ok(stateIn(s, e, 'swipe-tell', 3) >= 0, 'in front within 64: a swipe'); assert.ok(events(s).includes('sfx-boss-grunt'));
  assert.equal(e.anim, 'swipe'); assert.equal(e.face, -1);
  const f = stateIn(s, e, 'swipe-step', sec(1)); assert.ok(Math.abs(f - sec(B.swipe.tell)) <= 1, 'tell lasts ' + B.swipe.tell + ' s: ' + f);
  const xs = e.x; stateIn(s, e, 'swipe-hit', sec(0.3));
  assert.ok(Math.abs(xs - e.x - B.swipe.step) < 2, 'steps ' + B.swipe.step + ' px: ' + (xs - e.x)); assert.ok(events(s).includes('sfx-boss-swipe'));
  // Standing 40 px in front of him: hit, and flung at knockX / knockY. (His step may already have bumped Sammy: reset.)
  const p = s.player; p.x = e.x - 40; p.invuln = 0; p.vx = 0; p.hp = 3; p.state = 'normal';
  step(s, {}, 2);
  assert.equal(p.hp, 2); assert.ok(Math.abs(p.vx) > B.swipe.knockX * 0.8 && p.vx < 0, 'flung away at ' + p.vx); assert.ok(p.vy < -B.swipe.knockY + 2 * C.gravity / 60, 'and up: ' + p.vy);
  assert.ok(stateIn(s, e, 'swipe-open', sec(0.4)) >= 0);
  // The opening: safe to touch, 0.9 s, then he walks again.
  assert.ok(!touchHurts(s, e), 'the opening is safe');
  assert.ok(Math.abs(stateIn(s, e, 'walk', sec(2)) - (sec(B.swipe.opening) - 3)) <= 3, 'opening lasts ' + B.swipe.opening + ' s');
  // Lying flat does not work: the last swing scrapes the ground.
  const [s2, e2] = bossFight({ x: 3660, bossX: 3700 });
  step(s2, { pressed: { possum: true } });
  assert.equal(s2.player.state, 'playdead');
  e2.confused = false; e2.state = 'swipe-hit'; e2.t = 0; e2.attackHit = false; e2.face = -1; s2.player.invuln = 0;
  step(s2, {}, 3);
  assert.equal(s2.player.hp, 2, 'a lying Sammy is hit by the low swipe');
});

test('brute: SLAM: tell, fists down, two floor shockwaves (jump them), a stuck opening, and a cooldown (but never 3 s of walking without one)', () => {
  const [s, e] = bossFight({ x: 3600, bossX: 3700 });
  assert.ok(stateIn(s, e, 'slam-tell', 3) >= 0, '64-160 px away: a slam'); assert.ok(events(s).includes('sfx-boss-chains'));
  const f = stateIn(s, e, 'slam-hit', sec(1)); assert.ok(Math.abs(f - sec(B.slam.tell)) <= 1, 'tell ' + f);
  assert.ok(events(s).includes('sfx-boss-slam')); assert.ok(s.shake > 0);
  const waves = s.hazards.filter((h) => h.kind === 'wave');
  assert.equal(waves.length, 2); assert.deepEqual(waves.map((w) => w.dir).sort(), [-1, 1]);
  for (const w of waves) { assert.ok(Math.abs(w.x - e.x) < 4, 'from his feet'); assert.deepEqual([w.speed, w.w, w.h], [B.slam.wave.speed, B.slam.wave.w, B.slam.wave.h]); }
  assert.ok(Math.abs(e.slamCd - B.slam.cooldown) < 0.02, 'cooldown set');
  stateIn(s, e, 'slam-stuck', sec(0.3));
  assert.ok(!touchHurts(s, e), 'stuck: safe to touch');
  // A standing Sammy 100 px away is hit by the wave when it arrives (about 0.6 s); a jumping Sammy is not.
  const p = s.player; p.x = e.x - 100; p.hp = 3; p.invuln = 0; p.shield = 0;
  const hit = runUntil(s, () => p.hp < 3, sec(1.2));
  assert.ok(hit > sec(0.2) && hit < sec(0.9), 'the wave arrives after ' + hit + ' frames');
  assert.ok(p.vx < 0, 'knocked away from the wave, which came from the right (a normal hit): ' + p.vx);
  const [s3, e3] = bossFight({ x: 3600, bossX: 3700 });
  e3.state = 'slam-tell'; e3.t = B.slam.tell; step(s3);
  const p3 = s3.player; p3.x = e3.x - 100; p3.invuln = 0;
  const near = runUntil(s3, () => s3.hazards.some((h) => h.kind === 'wave' && Math.abs(h.x - p3.x) < 30), sec(1));
  assert.ok(near >= 0);
  step(s3, { held: { jump: true }, pressed: { jump: true } }, sec(0.5));
  assert.equal(p3.hp, 3, 'jumped the wave');
  assert.ok(runUntil(s3, () => s3.hazards.length === 0, sec(3)) >= 0, 'waves die at the walls or time out');
  // On cooldown he walks instead; after walkMax seconds of walking he slams anyway.
  const [s4, e4] = bossFight({ x: 3560, bossX: 3700 });
  e4.slamCd = 10; let tells = 0, t0 = -1;
  for (let i = 0; i < sec(4); i++) { step(s4); s4.player.x = e4.x - 100; s4.player.invuln = 5; if (e4.state === 'slam-tell') { tells++; t0 = i; break; } }
  assert.equal(tells, 1, 'slammed anyway'); assert.ok(t0 >= sec(B.walkMax) - 2 && t0 <= sec(B.walkMax) + sec(B.decideEvery) + 2, 'after about ' + B.walkMax + ' s: ' + t0);
});

test('brute: SPIN when Sammy is behind him: high (lie flat under it), hits both sides, then a long dizzy opening', () => {
  const [s, e] = bossFight({ x: 3740, bossX: 3700 }); // he faces left (-1); Sammy stands 40 px behind him
  assert.ok(stateIn(s, e, 'spin-tell', 3) >= 0, 'behind within 56: a spin'); assert.ok(events(s).includes('sfx-boss-roar'));
  assert.equal(e.face, -1, 'does not turn round for it');
  const f = stateIn(s, e, 'spin-hit', sec(1)); assert.ok(Math.abs(f - sec(B.spin.tell)) <= 1);
  s.player.invuln = 0; step(s, {}, 2);
  assert.equal(s.player.hp, 2, 'hit behind him');
  stateIn(s, e, 'spin-dizzy', sec(0.3));
  assert.ok(!touchHurts(s, e), 'dizzy: safe');
  assert.ok(Math.abs(stateIn(s, e, 'walk', sec(2)) - (sec(B.spin.dizzy) - 3)) <= 3, 'dizzy lasts ' + B.spin.dizzy + ' s');
  // Lying flat is under it (the box starts 20 px up; the play-dead box is 14 tall).
  const [s2, e2] = bossFight({ x: 3740, bossX: 3700 });
  step(s2, { pressed: { possum: true } });
  e2.confused = false; e2.state = 'spin-hit'; e2.t = 0; e2.attackHit = false; s2.player.invuln = 0;
  step(s2, {}, sec(B.spin.hits) + 1);
  assert.equal(s2.player.hp, 3, 'a lying Sammy is under the spin');
  // Standing in front of him during the spin is hit too (both sides).
  const [s3, e3] = bossFight({ x: 3660, bossX: 3700 });
  e3.state = 'spin-hit'; e3.t = 0; e3.attackHit = false; s3.player.invuln = 0;
  step(s3, {}, 2); assert.equal(s3.player.hp, 2);
});

test('brute: ACID VOMIT every fourth attack: a high stream (lie flat), three puddles that burn standing or lying, ignore the lid and never knock back, and dry up', () => {
  const [s, e] = bossFight({ x: 3600, bossX: 3700 });
  e.attacks = 3; // the next attack is the fourth
  assert.ok(stateIn(s, e, 'vomit-tell', 3) >= 0); assert.ok(events(s).includes('sfx-boss-gurgle')); assert.equal(e.anim, 'spin', 'the tell borrows the arms-wide pose');
  const f = stateIn(s, e, 'vomit-stream', sec(1)); assert.ok(Math.abs(f - sec(B.vomit.tell)) <= 1);
  assert.ok(events(s).includes('sfx-acid-spray')); assert.equal(e.anim, 'vomit');
  assert.equal(s.hazards.length, 0, 'no puddles until the acid has landed');
  // Standing 100 px in front: the stream gets him, no knockback, and the lid does not help.
  const p = s.player; p.x = e.x - 100; p.invuln = 0; p.shield = 3; p.vx = 0; p.hp = 3; p.state = 'normal';
  step(s, {}, 2);
  assert.equal(p.hp, 2); assert.equal(p.shield, 3, 'acid ignores the lid'); assert.equal(p.vx, 0, 'no knockback'); assert.equal(p.state, 'hurt');
  const ids = events(s); assert.ok(ids.includes('sfx-hurt'));
  // Lying flat is under the stream.
  const [s2, e2] = bossFight({ x: 3600, bossX: 3700 });
  step(s2, { pressed: { possum: true } });
  e2.confused = false; e2.state = 'vomit-stream'; e2.t = 0; e2.attackHit = false; s2.player.invuln = 0;
  step(s2, {}, sec(B.vomit.time) - 2);
  assert.equal(s2.player.hp, 3, 'a lying Sammy is under the stream');
  // When the stream ends, three puddles land ahead of him; they burn once they have spread (puddleLand).
  assert.ok(Math.abs(stateIn(s, e, 'vomit-open', sec(2)) - (sec(B.vomit.time) - 3)) <= 3, 'stream lasts ' + B.vomit.time + ' s');
  const pud = s.hazards.filter((h) => h.kind === 'puddle');
  assert.deepEqual(pud.map((h) => e.x - h.x), B.vomit.puddles, 'three puddles ahead of him');
  for (const h of pud) { assert.equal(h.w, B.vomit.puddleW); assert.equal(h.life, B.vomit.puddleLife); assert.equal(h.land, B.vomit.puddleLand); }
  assert.ok(!touchHurts(s, e), 'the opening is safe');
  // A puddle burns a standing Sammy (once per second: the usual invincibility) and a lying one; a jumping one is clear.
  const pd = pud[1]; p.x = pd.x; p.y = G; p.grounded = true; p.hp = 3; p.invuln = 0; p.shield = 3; p.state = 'normal'; p.vx = 0;
  e.state = 'confused'; e.confused = true; // park him
  step(s, {}, 2);
  assert.equal(p.hp, 3, 'still landing: harmless');
  step(s, {}, sec(B.vomit.puddleLand));
  assert.equal(p.hp, 2); assert.equal(p.shield, 3); assert.equal(p.vx, 0); assert.ok(events(s).includes('sfx-acid-burn'));
  step(s, {}, sec(0.9)); assert.equal(p.hp, 2, 'not again inside the invincibility second');
  step(s, {}, sec(0.3)); assert.equal(p.hp, 1, 'burns again after it');
  p.hp = 3; p.invuln = 0; p.possumCd = 0; p.state = 'normal'; step(s, { pressed: { possum: true } }); step(s, {}, 2);
  assert.equal(p.hp, 2, 'lying in acid burns too');
  p.state = 'normal'; p.hp = 3; p.invuln = 0; p.y = G - 30; p.vy = 0; p.grounded = false; step(s);
  assert.equal(p.hp, 3, 'in the air over it: clear');
  assert.ok(runUntil(s, () => !s.hazards.some((h) => h.kind === 'puddle'), sec(B.vomit.puddleLife + 1)) >= 0, 'puddles dry up');
  // Low gore and full gore draw the acid the same: its colours are not the reserved gore colours.
  for (const k of ['acid0', 'acid', 'acidHi']) assert.ok(!Object.values(S.GORE_COLORS).includes(S.PAL[k]), k + ' is not a gore colour');
});

test('brute: half health staggers him (a free opening); 9 hit points enrages him (shorter tells, faster walk, double shockwaves, vomit every third attack)', () => {
  const [s, e] = bossFight({ x: 3600, bossX: 3700, hp: B.staggerAt + 1 });
  place(s, e.x - 34, { cp: 2576 }); s.player.invuln = 5;
  step(s, { pressed: { attack: true } }, sec(0.25));
  assert.equal(e.hp, B.staggerAt); assert.equal(e.state, 'stagger'); assert.equal(e.anim, 'stagger'); assert.ok(events(s).includes('sfx-boss-grunt'));
  assert.ok(!touchHurts(s, e), 'staggered: safe to touch');
  const left = sec(B.staggerTime - e.t);
  assert.ok(Math.abs(stateIn(s, e, 'walk', sec(2)) - left) <= 3, 'stagger lasts ' + B.staggerTime + ' s');
  assert.ok(!e.enraged);
  // Down to enrageAt: the roar, the banner, the shake; then everything is meaner.
  e.hp = B.enrageAt + 1; e.state = 'walk'; e.t = 0; place(s, e.x - 34, { cp: 2576 }); s.player.invuln = 5; events(s);
  step(s, { pressed: { attack: true } }, sec(0.25));
  assert.equal(e.state, 'enrage'); assert.ok(e.enraged); assert.ok(events(s).includes('sfx-boss-roar')); assert.ok(s.shake > 0.2, 'shakes: ' + s.shake);
  assert.ok(s.effects.some((f) => f.kind === 'text' && f.text === B.lines.enrage));
  assert.ok(!touchHurts(s, e));
  stateIn(s, e, 'walk', sec(2));
  // Walks at the enraged speed.
  place(s, e.x - 250, { cp: 2576 }); e.decideT = 9; e.walkT = 0; e.slamCd = 9; const ex = e.x; step(s, {}, sec(0.5));
  assert.ok(Math.abs((ex - e.x) - B.enraged.walkSpeed * 0.5) < 3, 'enraged walk: ' + (ex - e.x) * 2 + ' px/s');
  // The swipe tell is 30% shorter and the step shorter.
  place(s, e.x - 40, { cp: 2576 }); s.player.invuln = 9; e.state = 'walk'; e.t = 0; e.decideT = 0; e.attacks = 0;
  assert.ok(stateIn(s, e, 'swipe-tell', 3) >= 0);
  const f = stateIn(s, e, 'swipe-step', sec(1)); assert.ok(Math.abs(f - sec(B.swipe.tell * B.enraged.tellScale)) <= 1, 'enraged tell: ' + f);
  const xs = e.x; stateIn(s, e, 'swipe-hit', sec(0.3)); assert.ok(Math.abs(xs - e.x - B.enraged.swipeStep) < 2, 'shorter step: ' + (xs - e.x));
  // The slam sends a second pair of shockwaves after a gap, and comes back sooner.
  e.state = 'slam-tell'; e.t = B.slam.tell; s.hazards = []; step(s);
  assert.equal(s.hazards.filter((h) => h.kind === 'wave').length, 2);
  assert.ok(Math.abs(e.slamCd - B.enraged.slamCooldown) < 0.02);
  step(s, {}, sec(B.enraged.waveGap) + 1);
  assert.equal(s.hazards.filter((h) => h.kind === 'wave').length, 4, 'double shockwave');
  // Vomit every third attack, for longer, with longer-lived puddles.
  e.state = 'walk'; e.t = 0; e.attacks = 2; e.decideT = 0; place(s, e.x - 100, { cp: 2576 }); s.player.invuln = 9; s.hazards = [];
  assert.ok(stateIn(s, e, 'vomit-tell', 3) >= 0, 'third attack is a vomit');
  stateIn(s, e, 'vomit-stream', sec(1));
  assert.ok(s.hazards.every((h) => h.life === B.enraged.puddleLife));
  assert.ok(Math.abs(stateIn(s, e, 'vomit-open', sec(2)) - (sec(B.enraged.vomitTime) - 3)) <= 3, 'longer stream');
});

test('brute: the chainsaw cuts him any time (gore overload): every cut bleeds hard, throws chunks, freezes 4 frames and shakes; no sliced death', () => {
  const [s, e] = bossFight({ x: 3660, bossX: 3700, saw: true });
  e.decideT = 9; // keep him walking
  step(s, { pressed: { attack: true }, held: { attack: true } });
  assert.equal(e.hp, B.hp - 1, 'cut while walking'); assert.equal(e.state, 'walk');
  const blood = s.effects.find((f) => f.kind === 'blood');
  assert.ok(blood && blood.n >= 12 && blood.power > 2, 'the most blood');
  assert.equal(s.effects.filter((f) => f.kind === 'chunk').length, B.sawChunks, 'chunks on a plain cut');
  assert.ok(Math.abs(s.hitstop - B.sawHitstop) < 1e-9, 'hit-stop ' + s.hitstop); assert.ok(s.shake > 0);
  const ids = events(s); assert.ok(ids.includes('sfx-chainsaw-cut') && ids.includes('sfx-boss-hit'));
  assert.ok(Math.abs(e.x - 3700) < 1, 'not pushed by the saw (one frame of walking at most): ' + e.x);
  // Keep the blade on him (following him around) until he goes down: the death is the crawl, never the cut-in-half.
  let n = 0;
  for (; n < sec(20) && e.state !== 'defeat'; n++) { place(s, e.x - 40, { cp: 2576 }); s.player.invuln = 9; step(s, { held: { attack: true } }); }
  assert.ok(e.state === 'defeat' && n > 0, 'went down'); assert.equal(e.defeatStyle, 'crawl'); assert.equal(e.anim, 'death');
  assert.ok(events(s).includes('sfx-boss-death'));
  assert.ok(s.stats.defeated === 1);
});

test('brute: Play Possum confuses him until Sammy gets up (an attack already started finishes first), then he ignores Sammy for a moment: the way past him', () => {
  const [s, e] = bossFight({ x: 3640, bossX: 3700 });
  e.decideT = 9; step(s, {}, 2);
  step(s, { pressed: { possum: true } });
  assert.equal(e.state, 'confused'); assert.equal(e.anim, 'walk'); assert.ok(e.confused);
  step(s, {}, sec(2.5));
  assert.equal(e.state, 'confused', 'still confused while Sammy stays down'); assert.equal(s.player.state, 'playdead');
  // Sammy gets up (at the 3 s limit): he resumes walking but ignores Sammy for possumIgnore; touching him then is safe.
  runUntil(s, () => s.player.state === 'normal', sec(1.5));
  assert.equal(e.state, 'walk'); assert.ok(e.ignoreT > B.possumIgnore - 0.05 && e.ignoreT <= B.possumIgnore);
  assert.ok(!touchHurts(s, e), 'walking through him while he looks around');
  const ex = e.x; step(s, {}, sec(1)); assert.equal(e.x, ex, 'stands still while ignoring');
  step(s, {}, sec(0.6)); assert.ok(touchHurts(s, e), 'then he is back');
  // Mid-attack (a spin: Sammy behind him, and it goes over a lying Sammy): the spin finishes, then he is confused.
  const [s2, e2] = bossFight({ x: 3740, bossX: 3700 });
  s2.player.possumCd = 0;
  assert.ok(stateIn(s2, e2, 'spin-tell', 3) >= 0);
  step(s2, { pressed: { possum: true } });
  assert.equal(e2.state, 'spin-tell', 'the attack already started'); assert.ok(e2.confused);
  assert.ok(stateIn(s2, e2, 'spin-dizzy', sec(2)) >= 0); assert.equal(s2.player.hp, 3, 'lying flat under the spin');
  assert.ok(stateIn(s2, e2, 'confused', sec(2)) >= 0, 'confused once the opening ends');
  // A hit (the low swipe reaches a lying Sammy) wakes him up again, as with a jogger.
  const [s3, e3] = bossFight({ x: 3650, bossX: 3700 });
  s3.player.possumCd = 0;
  assert.ok(stateIn(s3, e3, 'swipe-tell', 3) >= 0);
  step(s3, { pressed: { possum: true } });
  assert.ok(e3.confused);
  assert.ok(stateIn(s3, e3, 'swipe-open', sec(2)) >= 0);
  assert.equal(s3.player.hp, 2); assert.ok(!e3.confused, 'the hit released him');
});

test('brute: death: the crawl toward Sammy, the flat hold, three hot dogs out of him with the banner, then the exit opens', () => {
  const [s, e] = bossFight({ x: 3600, bossX: 3700, hp: 1 });
  place(s, e.x - 34, { cp: 2576 }); s.player.invuln = 9;
  step(s, { pressed: { attack: true } }, sec(0.25));
  assert.equal(e.state, 'defeat'); assert.ok(events(s).includes('sfx-boss-death')); assert.ok(s.shake > 0.3, 'shakes: ' + s.shake);
  s.player.hp = 1; s.stats.hotdogs = 0; // hungry for the victory lap
  const x0 = e.x;
  step(s, {}, sec(8 / 6) - sec(0.25) + 1);
  assert.ok(x0 - e.x > 20 && x0 - e.x < 32, 'crawled toward Sammy: ' + (x0 - e.x));
  assert.ok(!touchHurts(s, e), 'the crawl is harmless (deathCrawlHurts false)');
  assert.ok(!s.pickups.some((pk) => pk.type === 'hotdog' && pk.spilled), 'no hot dogs yet');
  assert.ok(runUntil(s, () => s.pickups.some((pk) => pk.type === 'hotdog' && pk.spilled), sec(2)) >= 0, 'the hot dogs come out');
  assert.ok(Math.abs(e.t - (B.defeatTime + 0.5)) < 0.05, 'half a second after he goes flat: ' + e.t);
  const dogs = s.pickups.filter((pk) => pk.type === 'hotdog' && pk.spilled);
  assert.equal(dogs.length, B.hotdogs, 'three hot dogs');
  assert.ok(s.effects.some((f) => f.kind === 'text' && f.text === B.lines.hotdogs));
  assert.ok(events(s).includes('sfx-gore-splat'));
  step(s, {}, sec(1.5));
  for (const d of dogs) assert.ok((d.collected || d.landed) && d.x > s.level.arena.x0 + 8 && d.x < s.level.arena.gateX, 'hot dog on the terrace (or already eaten) at ' + d.x);
  assert.ok(!s.enemies.includes(e) && s.arena.state === 'open', 'he is gone and the exit is open');
  for (const d of dogs) if (!d.collected) { place(s, d.x, { cp: 2576 }); step(s); }
  assert.equal(s.stats.hotdogs, 3, 'all three eaten'); assert.equal(s.player.hp, 3, 'a full heal for the victory lap');
});

test('brute: a K.O. in the fight resets it: hazards, supplies and the boss are gone; the gauntlet restarts from the first wave', () => {
  const [s, e] = bossFight({ x: 3600, bossX: 3700, supplies: true });
  e.state = 'vomit-stream'; e.t = B.vomit.time; step(s);
  assert.ok(s.hazards.length > 0 && s.pickups.some((pk) => pk.supply));
  s.checkpoint = s.cps[1]; s.player.hp = 1; s.player.invuln = 0;
  S.hurtPlayer(s, { hazard: true });
  step(s, {}, sec(C.sammy.koTime + C.sammy.koWait) + 2);
  assert.equal(s.player.x, 2576);
  assert.deepEqual([s.hazards.length, s.enemies.filter((q) => q.boss).length, s.pickups.filter((pk) => pk.supply).length, s.arena.state], [0, 0, 0, 'idle']);
});

test('brute: the chainsaw supply refuels a saw Sammy already carries; the lid gives its three blocks', () => {
  const [s] = bossFight({ x: 3560, supplies: true, saw: true });
  s.player.saw.fuel = 2;
  step(s, {}, sec(1.5)); // the supplies land
  const saw = s.pickups.find((pk) => pk.supply && pk.type === 'chainsaw'), lid = s.pickups.find((pk) => pk.supply && pk.type === 'lid');
  place(s, saw.x, { cp: 2576 }); step(s);
  assert.ok(saw.collected && s.player.saw.fuel === C.chainsaw.fuel, 'full tank again');
  place(s, lid.x, { cp: 2576 }); step(s);
  assert.ok(lid.collected && s.player.shield === C.lid.hits);
});

test('brute: beatable without god mode: the autopilot kills him with the chainsaw (cutting in his openings, dodging the rest) in 10 to 30 s, never K.O.d', () => {
  const [s, e] = bossFight({ x: 3600, enter: true, saw: true, supplies: true });
  const bot = S.makeBot();
  let f = 0;
  for (; f < sec(60) && e.state !== 'defeat'; f++) { S.update(s, S.botInput(s, bot)); s.events.length = 0; }
  assert.equal(e.state, 'defeat', 'down (hp left ' + e.hp + ')');
  assert.equal(s.stats.kos, 0, 'Sammy was never K.O.d (hits taken: ' + s.stats.hits + ')');
  assert.ok(f >= sec(10) && f <= sec(30), 'the saw fight takes 10 to 30 s with hit points and staggers doing the balancing: ' + (f / 60).toFixed(1) + ' s');
  assert.ok(s.stats.hits <= 3, 'a careful run takes few hits: ' + s.stats.hits);
  // (A whip-only kill is the long way round by design and is not proven here: the autopilot survives it but does not finish it.)
});

test('brute: the fight is deterministic, and plays the same with low gore', () => {
  const run = (gore) => {
    S.setGore(gore);
    const [s, e] = bossFight({ x: 3600, enter: true, saw: true });
    const bot = S.makeBot(), trace = [];
    for (let f = 0; f < sec(30) && e.state !== 'dead'; f++) { S.update(s, S.botInput(s, bot)); s.events.length = 0; if (f % 10 === 0) trace.push([e.state, e.hp, Math.round(e.x), Math.round(s.player.x), s.player.hp, s.hazards.length]); }
    return JSON.stringify([trace, s.stats]);
  };
  const a = run('full'); assert.equal(a, run('full')); assert.equal(a, run('low'));
  S.setGore('full');
});

test('brute: lines fit (3x5 font, 16 characters for the floating ones), his name fits the bar, the art cells match the design, and the timings match the strips', () => {
  const L = B.lines, ok = (t) => { for (const ch of t) assert.ok(S.GLYPHS[ch.toUpperCase()], `"${ch}" in "${t}"`); };
  for (const t of [L.enter, L.supplies, L.enrage, L.hotdogs, ...L.taunts, ...S.GAGS_BY_TYPE.brute.crawl, ...S.GAGS.crawl, B.name]) ok(t);
  for (const t of [L.enter, L.hotdogs, L.enrage, L.supplies]) assert.ok(S.textWidth(t) + 8 <= C.screenW - 8, t);
  for (const t of [...L.taunts, ...S.GAGS_BY_TYPE.brute.crawl, L.enrage]) assert.ok(t.length <= 16, t + ' is 16 characters or fewer');
  assert.ok(S.textWidth(B.name) <= S.BOSS_BAR.bar[2], 'name fits over the bar');
  const m = (k) => S.ASSET_MANIFEST.find((a) => a.key === k);
  assert.deepEqual([m('brute:walk').fw, m('brute:walk').fh, m('brute:walk').px, m('brute:walk').py], [96, 96, 48, 95]);
  for (const k of ['swipe', 'slam', 'spin', 'stagger', 'death']) assert.deepEqual([m('brute:' + k).fw, m('brute:' + k).fh, m('brute:' + k).px, m('brute:' + k).py], [128, 96, 64, 95], k);
  assert.deepEqual([m('brute:vomit').fw, m('brute:vomit').px, m('brute:vomit').py], [96, 40, 95]);
  assert.deepEqual([m('brute:faces').fw, m('brute:faces').fh, m('brute:faces').frames, m('brute:faces').feet], [32, 32, 17, false]);
  for (const k of ['walk', 'swipe', 'slam', 'spin', 'vomit', 'vomit-stream', 'stagger', 'death', 'faces', 'acid-splat', 'acid-smoke', 'blood-slash', 'dust']) {
    assert.match(m('brute:' + k).path, /^enemies\/enemy-zombie-brute\/brute-[a-z-]+-strip-v01\.png$/, k);
  }
  assert.ok(fs.existsSync(path.join(libRoot, 'assets', 'enemies', 'enemy-zombie-brute', '.gitkeep')));
  assert.ok(Math.abs(B.defeatTime - m('brute:death').frames / m('brute:death').fps) < 1e-9, 'death crawl = strip length');
  assert.ok(Math.abs(B.swipe.hits - 3 / m('brute:swipe').fps) < 1e-9 && Math.abs(B.spin.hits - 2 / m('brute:spin').fps) < 1e-9, 'the swings are the clocked frames');
  assert.equal(B.hp % S.BOSS_BAR.tickEvery, 4, 'ticks fall on whole hit points'); assert.ok(B.staggerAt === B.hp / 2 && B.enrageAt < B.staggerAt);
  for (const id of ['sfx-boss-grunt', 'sfx-boss-chains', 'sfx-boss-roar', 'sfx-boss-gurgle', 'sfx-boss-swipe', 'sfx-boss-slam', 'sfx-boss-hit', 'sfx-boss-death', 'sfx-acid-spray', 'sfx-acid-burn']) {
    assert.ok(S.SOUND_MANIFEST.some((m2) => m2.id === id), id); assert.ok(fs.existsSync(path.join(libRoot, 'assets', 'audio', 'sfx', id, '.gitkeep')), id + ' folder');
  }
});

test('brute: the boss bar (portrait by health band, hit, enraged, confused, dead) draws in every state, in both gore settings, with acid on screen but no gore colour in low gore', () => {
  const [s, e] = bossFight({ x: 3600, bossX: 3660 });
  const face = (patch) => S.bossFace(Object.assign({ state: 'walk', hp: B.hp, hitT: 0, enraged: false, t: 0 }, patch), B);
  assert.deepEqual([face({}).mood, face({ hp: 16 }).mood, face({ hp: B.staggerAt }).mood, face({ hp: 5, enraged: true }).mood], ['steady', 'angry', 'teeth', 'enraged']);
  assert.deepEqual([face({}).idx, face({ hp: 16 }).idx, face({ hp: B.staggerAt }).idx, face({ hp: 5, enraged: true, t: 0 }).idx, face({ hp: 5, enraged: true, t: 0.25 }).idx], [8, 6, 1, 0, 10]);
  assert.deepEqual([face({ hitT: 0.1 }).mood, face({ state: 'confused' }).mood, face({ state: 'defeat', t: 0.5 }).idx, face({ state: 'defeat', t: 2 }).idx], ['hit', 'confused', 4, 15]);
  const gore = new Set(Object.values(S.GORE_COLORS).map((c) => c.toLowerCase()));
  const T = S.ENEMY_TYPES.brute;
  for (const g of ['full', 'low']) {
    S.setGore(g);
    const used = new Set();
    s.hazards = [{ kind: 'wave', x: s.player.x - 30, dir: -1, speed: 160, w: 16, h: 10, t: 0.3, life: 1.7 }, { kind: 'puddle', x: s.player.x + 90, w: 28, t: 0.1, life: 5 }];
    for (const st of T.states) {
      if (st === 'dead') continue;
      e.state = st; e.t = 0.2; e.anim = T.anims[st]; e.animT = 0.2; e.hitT = st === 'walk' ? 0.2 : 0;
      const ctx = colorCtx(); S.render(ctx, s); for (const c of ctx.used) used.add(c);
    }
    e.state = 'defeat'; e.t = B.defeatTime + 0.3; { const ctx = colorCtx(); S.render(ctx, s); for (const c of ctx.used) used.add(c); }
    e.state = 'enter'; e.t = B.enterWalk + 0.1; e.enraged = true; { const ctx = colorCtx(); S.render(ctx, s); for (const c of ctx.used) used.add(c); }
    assert.ok(used.has(S.PAL.heart.toLowerCase()) && used.has(S.PAL.acid.toLowerCase()) && used.has(S.PAL.brute.toLowerCase()), g + ': bar, acid and the Brute drawn');
    const red = [...used].filter((c) => gore.has(c));
    if (g === 'low') assert.deepEqual(red, [], 'low gore drew gore colours: ' + red.join(', '));
    else assert.ok(red.length >= 3, 'full gore: guts and blood');
  }
  S.setGore('full');
});
