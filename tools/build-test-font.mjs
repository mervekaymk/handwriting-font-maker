// Developer tool: builds a test .otf outside the browser, with fake strokes
// for every glyph, using the same code as the app (src/fontbuild.js).
// Useful to check the font file with other tools (e.g. fontTools / Font Book).
//
// Run from the project folder:
//   node tools/build-test-font.mjs out.otf

import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';

// outline.js expects polygon-clipping on `window`, like in the browser.
const require = createRequire(import.meta.url);
globalThis.window = { polygonClipping: require('../vendor/polygon-clipping-0.15.7.umd.min.js') };

const { GLYPHS } = await import('../src/glyphs.js');
const { state, getGlyphData } = await import('../src/state.js');
const { buildFont } = await import('../src/fontbuild.js');

// A pen stroke from a list of [x, y] points, with pressure rising and falling.
function makeStroke(points, size = 60) {
  return {
    size,
    usePressure: true,
    points: points.map(([x, y], i) => [x, y, 0.35 + 0.4 * Math.sin((i / points.length) * Math.PI)]),
  };
}
const line = (a, b, n = 30) =>
  Array.from({ length: n + 1 }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]);
const arc = (cx, cy, rx, ry, t0, t1, n = 60) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = t0 + ((t1 - t0) * i) / n;
    return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)];
  });

// Every glyph gets a ring (makes a hole) + a crossing line + a dot: overlaps,
// holes and separate pieces in one go. Leave out a few to test missing glyphs.
for (const glyph of GLYPHS) {
  if (glyph.index % 10 === 9) continue;
  const data = getGlyphData(glyph.id);
  const h = glyph.section === 'upper' || glyph.section === 'digits' ? 700 : 500;
  data.strokes = [
    makeStroke(arc(500, h / 2, 140, h / 2, 0, 2.1 * Math.PI)),
    makeStroke(line([330, h * 0.3], [680, h * 0.7])),
    makeStroke(arc(500, h + 120, 12, 12, 0, 2 * Math.PI, 12)),
  ];
}
state.fontName = 'Test Şrift Ğı';
state.author = 'Tester';

const { font, missing } = buildFont(state);
const outFile = process.argv[2] || 'test-font.otf';
writeFileSync(outFile, Buffer.from(font.toArrayBuffer()));
console.log(`wrote ${outFile}: ${font.glyphs.length} glyphs, ${missing.length} missing`);
