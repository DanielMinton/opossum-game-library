// Tiny pixel font, 5 px tall, drawn with fillRect, so text stays crisp when the screen is scaled up.
// Most letters are 3 px wide; M and W are 5 px and N is 4 px so they can't be mistaken for H.
// PLACEHOLDER: replace with the 8x8 font sheet described in templates/STYLE_GUIDE.md.
(function (S) {
  const RAW = {
    A: '.#.|#.#|###|#.#|#.#', B: '##.|#.#|##.|#.#|##.', C: '.##|#..|#..|#..|.##', D: '##.|#.#|#.#|#.#|##.',
    E: '###|#..|##.|#..|###', F: '###|#..|##.|#..|#..', G: '.##|#..|#.#|#.#|.##', H: '#.#|#.#|###|#.#|#.#',
    I: '###|.#.|.#.|.#.|###', J: '..#|..#|..#|#.#|.#.', K: '#.#|#.#|##.|#.#|#.#', L: '#..|#..|#..|#..|###',
    M: '#...#|##.##|#.#.#|#...#|#...#', N: '#..#|##.#|#.##|#..#|#..#', O: '.#.|#.#|#.#|#.#|.#.', P: '##.|#.#|##.|#..|#..',
    Q: '.#.|#.#|#.#|##.|.##', R: '##.|#.#|##.|#.#|#.#', S: '.##|#..|.#.|..#|##.', T: '###|.#.|.#.|.#.|.#.',
    U: '#.#|#.#|#.#|#.#|###', V: '#.#|#.#|#.#|#.#|.#.', W: '#...#|#...#|#.#.#|##.##|#...#', X: '#.#|#.#|.#.|#.#|#.#',
    Y: '#.#|#.#|.#.|.#.|.#.', Z: '###|..#|.#.|#..|###',
    0: '###|#.#|#.#|#.#|###', 1: '.#.|##.|.#.|.#.|###', 2: '##.|..#|.#.|#..|###', 3: '##.|..#|.#.|..#|##.',
    4: '#.#|#.#|###|..#|..#', 5: '###|#..|##.|..#|##.', 6: '.##|#..|###|#.#|###', 7: '###|..#|.#.|.#.|.#.',
    8: '###|#.#|###|#.#|###', 9: '###|#.#|###|..#|##.',
    '.': '...|...|...|...|.#.', ',': '...|...|...|.#.|#..', '!': '.#.|.#.|.#.|...|.#.', '?': '##.|..#|.#.|...|.#.',
    ':': '...|.#.|...|.#.|...', '-': '...|...|###|...|...', '+': '...|.#.|###|.#.|...', '/': '..#|..#|.#.|#..|#..',
    "'": '.#.|.#.|...|...|...', '(': '.#.|#..|#..|#..|.#.', ')': '.#.|..#|..#|..#|.#.', '*': '...|#.#|.#.|#.#|...',
    '=': '...|###|...|###|...', '>': '#..|.#.|..#|.#.|#..', '<': '..#|.#.|#..|.#.|..#', '%': '#.#|..#|.#.|#..|#.#',
    '"': '#.#|#.#|...|...|...', '#': '#.#|###|#.#|###|#.#', ' ': '...|...|...|...|...', '_': '...|...|...|...|###',
  };
  const GLYPHS = {};
  for (const k in RAW) GLYPHS[k] = RAW[k].split('|');
  S.GLYPHS = GLYPHS; // read by the tests

  // Draw text at (x, y) top-left. scale = whole-number size multiplier.
  S.drawText = function (ctx, text, x, y, color, scale, shadow) {
    scale = scale || 1;
    const str = String(text).toUpperCase();
    if (shadow) S.drawText(ctx, str, x + 1, y + 1, shadow, scale, null);
    ctx.fillStyle = color;
    let cx = x;
    for (const ch of str) {
      const g = GLYPHS[ch] || GLYPHS['?'];
      for (let r = 0; r < 5; r++) for (let c = 0; c < g[r].length; c++) if (g[r][c] === '#') ctx.fillRect(cx + c * scale, y + r * scale, scale, scale);
      cx += (g[0].length + 1) * scale;
    }
  };
  // Width in pixels, without the gap after the last letter.
  S.textWidth = function (text, scale) {
    let w = 0;
    for (const ch of String(text).toUpperCase()) w += (GLYPHS[ch] || GLYPHS['?'])[0].length + 1;
    return Math.max(0, w - 1) * (scale || 1);
  };
  S.drawTextCentered = function (ctx, text, cx, y, color, scale, shadow) {
    S.drawText(ctx, text, Math.round(cx - S.textWidth(text, scale) / 2), y, color, scale, shadow);
  };
})(globalThis.SAMMY = globalThis.SAMMY || {});
