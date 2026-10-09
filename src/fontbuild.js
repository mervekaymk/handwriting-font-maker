// Builds a real OpenType font (.otf, CFF outlines) from the app state, using opentype.js.
// The same font object is used for the live preview and for the download.

import opentype from '../vendor/opentype-1.3.4.module.js';
import { GLYPHS, formatCodePoint } from './glyphs.js';
import { UNITS_PER_EM, ASCENDER, DESCENDER, CAP_HEIGHT } from './config.js';
import { glyphContours, contourToPath, contoursBounds } from './outline.js';
import { isDone } from './state.js';

// Font names in the "name" table may contain any letters (also Turkish ones),
// but the PostScript name must be plain ASCII without spaces.
function postScriptName(familyName) {
  const ascii = familyName
    .normalize('NFD')                 // split "ş" into "s" + accent mark ...
    .replace(/[̀-ͯ]/g, '')  // ... and drop the accent marks
    .replace(/ı/g, 'i')
    .replace(/[^A-Za-z0-9-]/g, '');
  return (ascii || 'MyHandwriting').slice(0, 29) + '-Regular';
}

// The required ".notdef" glyph: a simple box, shown for characters the font doesn't have.
function makeNotdefGlyph() {
  const path = new opentype.Path();
  const w = 500;
  const t = 50;  // line thickness
  // Outer box, counter-clockwise.
  path.moveTo(t, 0);
  path.lineTo(w - t, 0);
  path.lineTo(w - t, CAP_HEIGHT);
  path.lineTo(t, CAP_HEIGHT);
  path.close();
  // Inner box, clockwise, makes the hole.
  path.moveTo(2 * t, t);
  path.lineTo(2 * t, CAP_HEIGHT - t);
  path.lineTo(w - 2 * t, CAP_HEIGHT - t);
  path.lineTo(w - 2 * t, t);
  path.close();
  return new opentype.Glyph({ name: '.notdef', unicode: 0, advanceWidth: w, path: path });
}

// Turn one drawn glyph into an opentype.Glyph, or null if it has no usable outline.
//
// Spacing: the drawing is moved so its left edge sits at `lsb`, and the advance
// width (how far the cursor moves after this letter) is lsb + drawing width + rsb.
function makeGlyph(glyphInfo, data) {
  const rings = glyphContours(data.strokes);
  const bounds = contoursBounds(rings);
  if (!bounds) return null;

  const shiftX = data.lsb - bounds.xMin;
  const path = new opentype.Path();
  for (const ring of rings) {
    for (const c of contourToPath(ring)) {
      if (c.type === 'M') path.moveTo(c.x + shiftX, c.y);
      else if (c.type === 'L') path.lineTo(c.x + shiftX, c.y);
      else if (c.type === 'Q') path.quadraticCurveTo(c.x1 + shiftX, c.y1, c.x + shiftX, c.y);
      else if (c.type === 'Z') path.close();
    }
  }

  const advanceWidth = Math.round(data.lsb + (bounds.xMax - bounds.xMin) + data.rsb);
  return new opentype.Glyph({
    name: 'uni' + formatCodePoint(glyphInfo.codePoint).slice(2),  // e.g. "uni0041"
    unicode: glyphInfo.codePoint,
    advanceWidth: Math.max(advanceWidth, 1),
    path: path,
  });
}

// Build the font. Returns { font, missing }:
//   font    = opentype.Font (always valid, even with nothing drawn)
//   missing = array of glyph infos that are still empty
export function buildFont(state) {
  const glyphs = [makeNotdefGlyph()];

  glyphs.push(new opentype.Glyph({
    name: 'space',
    unicode: 32,
    advanceWidth: Math.round(state.spaceWidth),
    path: new opentype.Path(),
  }));

  const missing = [];
  for (const glyphInfo of GLYPHS) {
    const data = state.glyphData[glyphInfo.id];
    const glyph = isDone(glyphInfo.id) ? makeGlyph(glyphInfo, data) : null;
    if (glyph) glyphs.push(glyph);
    else missing.push(glyphInfo);
  }

  const familyName = state.fontName.trim() || 'My Handwriting';
  const author = state.author.trim();
  const year = new Date().getFullYear();

  const font = new opentype.Font({
    familyName: familyName,
    styleName: 'Regular',
    postScriptName: postScriptName(familyName),
    designer: author || undefined,
    copyright: author ? `Copyright (c) ${year} ${author}` : undefined,
    manufacturer: 'Handwriting Font Maker',
    version: 'Version 1.000',
    weightClass: 400,  // "Regular" (opentype.js would default to 500 = Medium)
    unitsPerEm: UNITS_PER_EM,
    ascender: ASCENDER,
    descender: DESCENDER,
    glyphs: glyphs,
  });

  return { font, missing };
}
