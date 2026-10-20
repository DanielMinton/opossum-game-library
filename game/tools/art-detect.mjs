// Frame finder for the art importer's character mode (node tools/import-art.mjs sheet.png --detect).
// Finds every frame on a sheet of animation frames drawn on a flat background: foreground mask, connected pieces,
// pieces joined into frames (little detached bits join the nearest body), frames sorted into rows and into animation groups.
// Pure functions, no files read here, deterministic. No packages needed (Node 18+).

export const hexOf = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
export const median = (a) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; };

// ---------- background and foreground mask ----------
// Reads the border of the picture. Returns { colour:[r,g,b] | null, transparent, noise }.
export function sheetBackground(img) {
  const { w, h, d } = img, hist = new Map();
  let clear = 0, total = 0;
  const take = (p) => {
    const i = p * 4; total++;
    if (d[i + 3] < 128) { clear++; return; }
    const k = ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3);
    hist.set(k, (hist.get(k) || 0) + 1);
  };
  for (let x = 0; x < w; x++) { take(x); take((h - 1) * w + x); }
  for (let y = 1; y < h - 1; y++) { take(y * w); take(y * w + w - 1); }
  if (clear / total >= 0.5) return { colour: null, transparent: true, noise: 0 };
  let bk = -1, bn = 0;
  for (const [k, n] of [...hist].sort((a, b) => a[0] - b[0])) if (n > bn) { bn = n; bk = k; }
  // average the real pixels in the winning bucket
  let sr = 0, sg = 0, sb = 0, n = 0;
  const near = [];
  const collect = (p) => {
    const i = p * 4;
    if (d[i + 3] < 128) return;
    if ((((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3)) === bk) { sr += d[i]; sg += d[i + 1]; sb += d[i + 2]; n++; near.push(p); }
  };
  for (let x = 0; x < w; x++) { collect(x); collect((h - 1) * w + x); }
  for (let y = 1; y < h - 1; y++) { collect(y * w); collect(y * w + w - 1); }
  const c = [Math.round(sr / n), Math.round(sg / n), Math.round(sb / n)];
  let noise = 0;
  for (const p of near) { const i = p * 4; noise = Math.max(noise, Math.hypot(d[i] - c[0], d[i + 1] - c[1], d[i + 2] - c[2])); }
  return { colour: c, transparent: false, noise };
}

// Default tolerance: how far from the background colour a pixel may be and still count as background.
// Dark backgrounds get a smaller number, because dark art (outlines, jeans) would otherwise be eaten.
export function autoTolerance(bg) {
  if (!bg.colour) return 0;
  const m = Math.max(...bg.colour);
  const base = m < 40 ? 26 : m < 90 ? 30 : 34;
  return Math.max(12, Math.min(base, Math.round(bg.noise * 1.6 + 10)));
}

// True where the picture is foreground. Background = pixels close to the background colour that connect to the border.
export function foregroundMask(img, bgColour, tolerance) {
  const { w, h, d } = img, bgm = new Uint8Array(w * h), stack = [];
  const isBg = (p) => {
    const i = p * 4;
    if (d[i + 3] < 128) return true;
    return bgColour ? Math.hypot(d[i] - bgColour[0], d[i + 1] - bgColour[1], d[i + 2] - bgColour[2]) <= tolerance : false;
  };
  const seed = (p) => { if (!bgm[p] && isBg(p)) { bgm[p] = 1; stack.push(p); } };
  for (let x = 0; x < w; x++) { seed(x); seed((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { seed(y * w); seed(y * w + w - 1); }
  while (stack.length) {
    const p = stack.pop(), x = p % w;
    if (x > 0) seed(p - 1);
    if (x < w - 1) seed(p + 1);
    if (p >= w) seed(p - w);
    if (p < w * (h - 1)) seed(p + w);
  }
  const fg = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) fg[p] = bgm[p] ? 0 : 1;
  return fg;
}

// ---------- connected pieces ----------
// 8-connected labelling. Returns { labels (Int32, 0 = none, 1.. = piece), comps: [{id, area, x0, y0, x1, y1}] } (x1,y1 exclusive).
export function labelPieces(mask, w, h) {
  const labels = new Int32Array(w * h), comps = [], stack = [];
  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || labels[s]) continue;
    const id = comps.length + 1;
    const c = { id, area: 0, x0: w, y0: h, x1: 0, y1: 0 };
    labels[s] = id; stack.push(s);
    while (stack.length) {
      const p = stack.pop(), x = p % w, y = (p - x) / w;
      c.area++;
      if (x < c.x0) c.x0 = x; if (x + 1 > c.x1) c.x1 = x + 1; if (y < c.y0) c.y0 = y; if (y + 1 > c.y1) c.y1 = y + 1;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy; if (yy < 0 || yy >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx; if (xx < 0 || xx >= w || (!dx && !dy)) continue;
          const q = yy * w + xx;
          if (mask[q] && !labels[q]) { labels[q] = id; stack.push(q); }
        }
      }
    }
    comps.push(c);
  }
  return { labels, comps };
}

const boxGap = (a, b) => {
  const dx = Math.max(0, a.x0 - b.x1, b.x0 - a.x1), dy = Math.max(0, a.y0 - b.y1, b.y0 - a.y1);
  return Math.hypot(dx, dy);
};

// Splits sizes into "bodies" and "bits": the cut that best separates log(area) into two groups (Otsu).
function bodyCut(areas) {
  const v = areas.map((a) => Math.log(a)).sort((a, b) => a - b);
  if (v.length < 4) return 0;
  let best = -1, cut = 0;
  const tot = v.reduce((s, x) => s + x, 0);
  let acc = 0;
  for (let i = 0; i < v.length - 1; i++) {
    acc += v[i];
    const n1 = i + 1, n2 = v.length - n1, m1 = acc / n1, m2 = (tot - acc) / n2, bw = n1 * n2 * (m1 - m2) ** 2;
    if (bw > best) { best = bw; cut = (v[i] + v[i + 1]) / 2; }
  }
  // only a real split when the two groups are far apart (a factor of 6 or more in area)
  const lo = v.filter((x) => x <= cut), hi = v.filter((x) => x > cut);
  if (!lo.length || !hi.length) return 0;
  const mlo = lo.reduce((s, x) => s + x, 0) / lo.length, mhi = hi.reduce((s, x) => s + x, 0) / hi.length;
  return Math.exp(mhi - mlo) >= 6 ? Math.exp(cut) : 0;
}

// Joins pieces into frames. Returns [{ id, comps:[ids], box:{x0,y0,x1,y1} (everything), body:{x0,y0,x1,y1} (big pieces only), area }].
export function buildFrames(comps, opts = {}) {
  const real = comps.filter((c) => c.area >= (opts.minArea || 6));
  if (!real.length) return { frames: [], dropped: comps.length };
  let cut = bodyCut(real.map((c) => c.area));
  const bodies = real.filter((c) => c.area >= cut);
  const bits = real.filter((c) => c.area < cut);
  const medH = median(bodies.map((c) => c.y1 - c.y0)) || 1;
  const reach = (opts.attach != null ? opts.attach : 0.45) * medH;
  const medArea = median(bodies.map((c) => c.area));
  // A big piece that is much smaller than the others and sits against another one is a detached limb: treat it as a bit.
  const mains = [], extra = [];
  for (const c of bodies.slice().sort((a, b) => b.area - a.area)) {
    if (c.area < medArea * 0.18 && mains.some((m) => boxGap(m, c) <= reach * 0.5)) extra.push(c);
    else mains.push(c);
  }
  const fr = mains.map((c) => ({ id: c.id, comps: [c.id], box: { x0: c.x0, y0: c.y0, x1: c.x1, y1: c.y1 }, body: { x0: c.x0, y0: c.y0, x1: c.x1, y1: c.y1 }, area: c.area, mainArea: c.area }));
  let dropped = comps.length - real.length, attached = 0;
  const loose = [...extra, ...bits].sort((a, b) => b.area - a.area || a.id - b.id);
  for (const pass of [0, 1]) {
    for (let k = loose.length - 1; k >= 0; k--) {
      const c = loose[k];
      let bf = null, bd = 1e18;
      for (const f of fr) {
        const dd = boxGap(pass ? f.box : f.body, c);
        if (dd < bd) { bd = dd; bf = f; }
      }
      if (bf && bd <= reach) {
        bf.comps.push(c.id); bf.area += c.area;
        bf.box = { x0: Math.min(bf.box.x0, c.x0), y0: Math.min(bf.box.y0, c.y0), x1: Math.max(bf.box.x1, c.x1), y1: Math.max(bf.box.y1, c.y1) };
        if (c.area >= medArea * 0.18 || extra.includes(c)) bf.body = { x0: Math.min(bf.body.x0, c.x0), y0: Math.min(bf.body.y0, c.y0), x1: Math.max(bf.body.x1, c.x1), y1: Math.max(bf.body.y1, c.y1) };
        loose.splice(k, 1); attached++;
      }
    }
  }
  dropped += loose.length;
  return { frames: fr, dropped, attached, bodyCut: cut };
}

// ---------- cutting pieces apart ----------
// Cuts piece `id` into parts at the given columns. Edits labels and comps in place; returns the new piece ids.
function cutPiece(labels, comps, w, h, id, cutXs) {
  const c = comps[id - 1];
  const newIds = cutXs.map((_, i) => comps.length + 1 + i), ids = [id, ...newIds];
  const blank = () => ({ area: 0, x0: w, y0: h, x1: 0, y1: 0 });
  const parts = [c, ...newIds.map((nid) => ({ id: nid, ...blank() }))];
  const partOf = (x) => { let k = 0; while (k < cutXs.length && x >= cutXs[k]) k++; return k; };
  const acc = parts.map(() => blank());
  for (let y = c.y0; y < c.y1; y++) for (let x = c.x0; x < c.x1; x++) {
    if (labels[y * w + x] !== id) continue;
    const k = partOf(x), t = acc[k];
    if (k) labels[y * w + x] = parts[k].id;
    t.area++; if (x < t.x0) t.x0 = x; if (x + 1 > t.x1) t.x1 = x + 1; if (y < t.y0) t.y0 = y; if (y + 1 > t.y1) t.y1 = y + 1;
  }
  Object.assign(c, acc[0]);
  for (let i = 1; i < parts.length; i++) { Object.assign(parts[i], acc[i]); comps.push(parts[i]); }
  return ids;
}
function columnCounts(labels, c, w) {
  const cnt = new Int32Array(c.x1 - c.x0);
  for (let y = c.y0; y < c.y1; y++) for (let x = c.x0; x < c.x1; x++) if (labels[y * w + x] === c.id) cnt[x - c.x0]++;
  return cnt;
}

// Frames that touch their neighbours come out as one piece. Cuts such a piece apart at the narrow places (columns with almost
// no art) when both halves are big enough to be figures. Edits `labels` and `comps` in place; returns how many cuts were made.
export function splitTouching(labels, comps, w, h, ids) {
  let cuts = 0;
  const queue = ids.slice();
  while (queue.length) {
    const c = comps[queue.shift() - 1];
    const cw = c.x1 - c.x0, ch = c.y1 - c.y0;
    if (cw < ch * 0.7) continue;
    const cnt = columnCounts(labels, c, w);
    const peak = Math.max(...cnt), lim = Math.max(2, peak * 0.025), minSide = Math.max(8, ch * 0.3);
    let best = -1;
    for (let x = Math.ceil(minSide); x < cw - minSide; x++) {
      if (cnt[x] <= lim && (best < 0 || cnt[x] < cnt[best] || (cnt[x] === cnt[best] && Math.abs(x - cw / 2) < Math.abs(best - cw / 2)))) best = x;
    }
    if (best < 0) continue;
    let left = 0; for (let i = 0; i < best; i++) left += cnt[i];
    if (left < c.area * 0.2 || left > c.area * 0.8) continue;
    queue.push(...cutPiece(labels, comps, w, h, c.id, [c.x0 + best]));
    cuts++;
  }
  return cuts;
}

// Cuts piece `id` into k frames: cut columns at the emptiest spots near an even split.
export function splitInto(labels, comps, w, h, id, k) {
  const c = comps[id - 1], cnt = columnCounts(labels, c, w), cw = c.x1 - c.x0, cuts = [];
  let prev = 0;
  for (let i = 1; i < k; i++) {
    const nominal = Math.round(cw * i / k), win = Math.max(2, Math.round(cw / k * 0.3));
    let bp = nominal, bv = 1e18;
    for (let p = Math.max(prev + 1, nominal - win); p <= Math.min(cw - 1, nominal + win); p++) {
      const v = cnt[p] * 1000 + Math.abs(p - nominal);
      if (v < bv) { bv = v; bp = p; }
    }
    cuts.push(c.x0 + bp); prev = bp;
  }
  return cutPiece(labels, comps, w, h, id, cuts);
}

// ---------- rows, groups ----------
const fh = (f) => f.body.y1 - f.body.y0;
// What the sheets from the image tools usually hold, per animation: walk 4, attack 3, hit 2, defeat 3, idle 3 (frames per row).
export const USUAL_COUNTS = [4, 3, 2, 3, 3];

// The whole detection. img = { w, h, d }. Options: bgColour [r,g,b], tolerance, minHeight, maxHeight, groups ([4,3,2...] frames per
// animation row), gap (px), noHeroes, noSplit. Returns everything the overlay and the map need.
export function detectSheet(img, opts = {}) {
  const warnings = [];
  const bgInfo = opts.bgColour ? { colour: opts.bgColour, transparent: false, noise: 0 } : sheetBackground(img);
  if (!bgInfo.colour && !bgInfo.transparent) throw new Error('could not find a flat background colour');
  const tol = opts.tolerance != null ? +opts.tolerance : autoTolerance(bgInfo);
  const mask = foregroundMask(img, bgInfo.colour, tol);
  const { labels, comps } = labelPieces(mask, img.w, img.h);
  const minH = opts.minHeight != null ? +opts.minHeight : 0;
  const wantCounts = opts.groups && opts.groups.length ? opts.groups : null;

  // One pass: pieces -> frames -> heroes / small -> rows -> groups.
  const analyse = () => {
    const built = buildFrames(comps, { minArea: opts.minArea, attach: opts.attach });
    const frames = built.frames.map((f, i) => ({ ...f, id: i + 1 }));
    if (!frames.length) throw new Error('found nothing on the sheet (is the background colour right? try --bg "#rrggbb")');
    const medH = median(frames.map(fh));
    const maxH = opts.maxHeight != null ? +opts.maxHeight : (opts.noHeroes ? 1e9 : medH * 2.0);
    // The oversized "hero" row (or anything outside --min-height/--max-height) is not part of the game strips.
    const heroes = frames.filter((f) => fh(f) > maxH);
    // a loose piece of a big pose (a floating hand, a splash) sits inside the big pose's box or beside it in the top band: it goes with it
    const heroBottom = heroes.length ? Math.max(...heroes.map((hh) => hh.box.y1)) : -1;
    const inHero = (f) => (f.box.y0 + f.box.y1) / 2 < heroBottom || heroes.some((hh) => {
      const m = (hh.box.y1 - hh.box.y0) * 0.08, cx = (f.box.x0 + f.box.x1) / 2, cy = (f.box.y0 + f.box.y1) / 2;
      return cx >= hh.box.x0 - m && cx <= hh.box.x1 + m && cy >= hh.box.y0 - m && cy <= hh.box.y1 + m;
    });
    let small = frames.filter((f) => fh(f) <= maxH && fh(f) >= minH && !inHero(f));
    const smallMed = median(small.map(fh));
    const tinyCut = opts.minHeight != null ? 0 : smallMed * 0.2;
    const tiny = small.filter((f) => fh(f) < tinyCut); // tiny leftovers are dropped
    small = small.filter((f) => fh(f) >= tinyCut);
    if (!small.length) throw new Error('every piece on the sheet was ignored by the height limits');
    // rows: by where the bodies stand (their bottom edge)
    const mh = median(small.map(fh)), rowTol = mh * 0.45;
    const rows = [];
    for (const f of small.slice().sort((a, b) => a.body.y1 - b.body.y1 || a.body.x0 - b.body.x0)) {
      const r = rows[rows.length - 1];
      if (r && f.body.y1 - r.ref <= rowTol) { r.frames.push(f); r.ref = r.frames.reduce((s, q) => s + q.body.y1, 0) / r.frames.length; }
      else rows.push({ frames: [f], ref: f.body.y1 });
    }
    for (const r of rows) r.frames.sort((a, b) => a.box.x0 - b.box.x0 || a.id - b.id);
    // groups
    let groups, how = '';
    if (wantCounts) {
      // you said how many frames each animation has in a row: every row is dealt out in that order
      groups = wantCounts.map(() => []);
      for (const r of rows) { let at = 0; wantCounts.forEach((n, gi) => { for (const f of r.frames.slice(at, at + n)) groups[gi].push(f); at += n; }); }
      groups = groups.filter((g) => g.length);
      how = 'you gave the number of frames per animation (--groups)';
    } else if (heroes.length >= 2 && heroes.length <= 8) {
      // The big poses on top are one per animation: each small frame joins the hero whose centre is closest sideways.
      const hs = heroes.slice().sort((a, b) => (a.body.x0 + a.body.x1) - (b.body.x0 + b.body.x1));
      const cx = (f) => (f.body.x0 + f.body.x1) / 2;
      groups = hs.map(() => []);
      for (const f of small) { let bi = 0, bd = 1e18; hs.forEach((hh, i) => { const dd = Math.abs(cx(f) - (hh.body.x0 + hh.body.x1) / 2); if (dd < bd) { bd = dd; bi = i; } }); groups[bi].push(f); }
      groups = groups.filter((g) => g.length);
      how = `the ${hs.length} big poses along the top mark the ${hs.length} animations`;
    } else {
      // Gaps along the sideways direction, shared by all rows: empty stretches of columns across the whole sheet.
      const iv = small.map((f) => [f.box.x0, f.box.x1]).sort((a, b) => a[0] - b[0]);
      const merged = [];
      for (const [a, b] of iv) { const m = merged[merged.length - 1]; if (m && a <= m[1]) m[1] = Math.max(m[1], b); else merged.push([a, b]); }
      const gaps = merged.slice(1).map((m, i) => m[0] - merged[i][1]);
      const mw = median(small.map((f) => f.body.x1 - f.body.x0));
      const cuts = [];
      const thr = opts.gap != null ? +opts.gap : Math.max(median(gaps) * 2.2, mw * 0.22, 6);
      merged.slice(1).forEach((m, i) => { if (m[0] - merged[i][1] >= thr) cuts.push((m[0] + merged[i][1]) / 2); });
      how = `found by looking for the wider gaps between animations (gap of ${Math.round(thr)} px or more)`;
      groups = Array.from({ length: cuts.length + 1 }, () => []);
      for (const f of small) { const c = (f.box.x0 + f.box.x1) / 2; let g = 0; while (g < cuts.length && c > cuts[g]) g++; groups[g].push(f); }
      groups = groups.filter((g) => g.length);
    }
    const rowOf = new Map();
    rows.forEach((r, i) => r.frames.forEach((f) => rowOf.set(f.id, i)));
    const out = groups.map((g, gi) => {
      const byRow = [];
      for (const f of g.slice().sort((a, b) => rowOf.get(a.id) - rowOf.get(b.id) || a.box.x0 - b.box.x0)) {
        const ri = rowOf.get(f.id);
        let r = byRow.find((q) => q.row === ri);
        if (!r) { r = { row: ri, frames: [] }; byRow.push(r); }
        r.frames.push(f);
      }
      return { index: gi, rows: byRow };
    });
    return { built, heroes, small, tiny, rows, groups: out, how, mh };
  };

  let A = analyse();
  const note = [];
  if (!opts.noSplit) {
    // 1) frames that touch: cut at the narrow places
    const splits = splitTouching(labels, comps, img.w, img.h, A.small.map((f) => f.comps[0]));
    if (splits) { A = analyse(); note.push(`${splits} frame(s) were touching their neighbour, so I cut them apart at the narrow place`); }
    // 2) a group whose rows disagree (or fall short of what you said / what is usual) has a merged frame: cut the widest one
    for (let round = 0; round < 40 && wantCounts; round++) {
      const total = wantCounts.reduce((a, b) => a + b, 0);
      const r = A.rows.find((q) => q.frames.length < total);
      if (!r) break;
      const f = r.frames.slice().sort((a, b) => (b.body.x1 - b.body.x0) - (a.body.x1 - a.body.x0))[0];
      const main = f.comps.map((id) => comps[id - 1]).sort((a, b) => b.area - a.area)[0];
      if (main.x1 - main.x0 < (f.body.y1 - f.body.y0) * 0.5) break;
      splitInto(labels, comps, img.w, img.h, main.id, 2);
      note.push('one frame looked like two frames stuck together, so I cut it in two');
      A = analyse();
    }
    for (let round = 0; round < 24 && !wantCounts; round++) {
      let did = false;
      for (const g of A.groups) {
        const counts = g.rows.map((r) => r.frames.length);
        const big = Math.max(...counts);
        if (A.groups.length !== 5 || !A.heroes.length) continue;
        const want = Math.max(big, USUAL_COUNTS[g.index]);
        for (const r of g.rows) {
          if (r.frames.length >= want) continue;
          const f = r.frames.slice().sort((a, b) => (b.body.x1 - b.body.x0) - (a.body.x1 - a.body.x0))[0];
          const main = f.comps.map((id) => comps[id - 1]).sort((a, b) => b.area - a.area)[0];
          const k = Math.min(want - r.frames.length + 1, 4);
          if (main.x1 - main.x0 < (f.body.y1 - f.body.y0) * 0.6) continue;
          splitInto(labels, comps, img.w, img.h, main.id, k);
          note.push(`animation ${g.index + 1}: one frame looked like ${k} frames stuck together, so I cut it into ${k}`);
          did = true; break;
        }
        if (did) break;
      }
      if (!did) break;
      A = analyse();
    }
  }
  warnings.push(...note);
  const { built, heroes, small, tiny, rows, groups, how } = A;
  // reading order ids (group, row, left to right)
  let n = 0;
  for (const g of groups) for (const r of g.rows) for (const f of r.frames) f.num = ++n;
  if (wantCounts && wantCounts.length !== groups.length) warnings.push(`you asked for ${wantCounts.length} animations but I found ${groups.length}`);
  const rowCountsOf = (g) => g.rows.map((r) => r.frames.length);
  for (const g of groups) { const rc = rowCountsOf(g); if (rc.length > 1 && Math.min(...rc) !== Math.max(...rc)) warnings.push(`animation ${g.index + 1}: the rows have different numbers of frames (${rc.join(' and ')}); check the picture and, if needed, say how many with --groups`); }
  if (built.dropped) warnings.push(`${built.dropped} tiny speck(s) were ignored`);
  if (tiny.length) warnings.push(`${tiny.length} very small piece(s) were ignored`);
  return { bg: bgInfo, tolerance: tol, mask, labels, comps, frames: small, heroes, tiny, rows, groups, how, warnings, medianHeight: A.mh, w: img.w, h: img.h };
}

// ---------- evenly spaced grids (portraits, icons) ----------
// Splits a region into cols x rows cells and tightens each to the art inside it. Returns boxes [x, y, w, h], reading order.
export function gridSplit(img, cols, rows, region, bgColour, tolerance) {
  const bgInfo = bgColour ? { colour: bgColour } : sheetBackground(img);
  const tol = tolerance != null ? +tolerance : autoTolerance(bgInfo);
  const mask = foregroundMask(img, bgInfo.colour, tol);
  const [rx, ry, rw, rh] = region || [0, 0, img.w, img.h];
  const boxes = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x0 = Math.round(rx + rw * c / cols), x1 = Math.round(rx + rw * (c + 1) / cols), y0 = Math.round(ry + rh * r / rows), y1 = Math.round(ry + rh * (r + 1) / rows);
    let bx0 = 1e9, by0 = 1e9, bx1 = -1, by1 = -1;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (mask[y * img.w + x]) { if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; }
    if (bx1 >= 0) boxes.push([bx0, by0, bx1 - bx0 + 1, by1 - by0 + 1]);
  }
  return boxes;
}

// ---------- overlay picture ----------
const DIGITS = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
function drawText(d, W, H, x, y, text, c, k = 2) {
  let cx = x;
  for (const ch of String(text)) {
    const g = DIGITS[+ch];
    if (g) for (let i = 0; i < 15; i++) if (g[i] === '1') for (let sy = 0; sy < k; sy++) for (let sx = 0; sx < k; sx++) {
      const px = cx + (i % 3) * k + sx, py = y + Math.floor(i / 3) * k + sy;
      if (px >= 0 && py >= 0 && px < W && py < H) d.set([c[0], c[1], c[2], 255], (py * W + px) * 4);
    }
    cx += 4 * k;
  }
}
export const GROUP_COLOURS = [[255, 90, 90], [90, 200, 255], [255, 220, 70], [120, 255, 120], [255, 130, 255], [255, 170, 60], [140, 140, 255], [90, 255, 220]];
// The sheet with a numbered box round every frame; colour = animation group. Ignored pieces get a dim box.
export function overlayImage(img, det) {
  const { w: W, h: H } = img, d = Uint8Array.from(img.d);
  for (let i = 3; i < d.length; i += 4) d[i] = 255;
  const rect = (b, c, dash) => {
    for (let x = b.x0; x < b.x1; x++) for (const y of [b.y0, b.y1 - 1]) if (!dash || (x >> 2) % 2 === 0) if (x >= 0 && y >= 0 && x < W && y < H) d.set([...c, 255], (y * W + x) * 4);
    for (let y = b.y0; y < b.y1; y++) for (const x of [b.x0, b.x1 - 1]) if (!dash || (y >> 2) % 2 === 0) if (x >= 0 && y >= 0 && x < W && y < H) d.set([...c, 255], (y * W + x) * 4);
  };
  for (const f of det.heroes) rect(f.box, [150, 150, 150], true);
  det.groups.forEach((g, gi) => {
    const c = GROUP_COLOURS[gi % GROUP_COLOURS.length];
    for (const r of g.rows) for (const f of r.frames) {
      rect(f.box, c, false);
      drawText(d, W, H, f.box.x0 + 2, Math.max(0, f.box.y0 - 12), f.num, c, 2);
    }
  });
  return { w: W, h: H, d };
}

// ---------- the draft map ----------
export const DEFAULT_ANIMS = ['walk', 'attack', 'hit', 'defeat', 'idle'];
const LOOPING = /^(walk|run|idle)/;
// Stretches or trims a list of frames to the wanted count: loops ping-pong, one-shot animations hold their last frame.
export function fitCount(list, need, looping) {
  if (!need || list.length === need) return list.map((e) => ({ ...e }));
  if (list.length > need) return Array.from({ length: need }, (_, i) => ({ ...list[Math.round(i * (list.length - 1) / Math.max(1, need - 1))] }));
  const out = list.map((e) => ({ ...e }));
  if (looping && list.length > 2) {
    const back = list.slice(1, -1).reverse();
    for (let i = 0; out.length < need; i++) out.push({ ...back[i % back.length] });
    return out;
  }
  out[out.length - 1].hold = 1 + (need - out.length); // the last frame is held for the missing ones
  return out;
}
export function draftMap(det, o = {}) {
  const names = o.anims && o.anims.length ? o.anims : DEFAULT_ANIMS;
  const prefix = o.prefix || 'jogger';
  const slots = {};
  const groupsInfo = [];
  det.groups.forEach((g, gi) => {
    const anim = names[gi] || `anim${gi + 1}`;
    const key = `${prefix}:${anim}`;
    const need = o.slotFrames ? o.slotFrames[key] : 0;
    // row A is the main take; a one-shot animation that is far short of its frame count (defeat: 3 frames for 8) also uses row B's frames after row A's
    const useB = !LOOPING.test(anim) && need && need - g.rows[0].frames.length >= 2 && g.rows.length > 1;
    const rowA = useB ? g.rows.flatMap((r) => r.frames) : g.rows[0].frames;
    const list = rowA.map((f) => ({ box: [f.box.x0, f.box.y0, f.box.x1 - f.box.x0, f.box.y1 - f.box.y0] }));
    slots[key] = { frames: fitCount(list, need, LOOPING.test(anim)) };
    groupsInfo.push({ animation: anim, rows: g.rows.map((r) => r.frames.map((f) => ({ n: f.num, box: [f.box.x0, f.box.y0, f.box.x1 - f.box.x0, f.box.y1 - f.box.y0] }))) });
  });
  const m = { sheet: o.sheetName || 'sheet.png', bg: hexOf(...det.bg.colour), tolerance: det.tolerance, scale: o.scale || null, slots, found: { how: det.how, groups: groupsInfo } };
  if (!m.scale) delete m.scale;
  return m;
}
