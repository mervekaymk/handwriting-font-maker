// The list of characters the user can draw, grouped into sections.
// Every entry becomes one cell in the glyph grid.

// Helper: turn a string like "ABC" into an array of single characters.
// (Array.from handles every character correctly, including '…'.)
function chars(text) {
  return Array.from(text);
}

const SECTIONS = [
  { id: 'upper',   title: 'Uppercase',   chars: chars('ABCDEFGHIJKLMNOPQRSTUVWXYZ') },
  { id: 'lower',   title: 'Lowercase',   chars: chars('abcdefghijklmnopqrstuvwxyz') },
  // İ (U+0130) and ı (U+0131) are their own glyphs, separate from I and i.
  { id: 'turkish', title: 'Turkish',     chars: chars('ÇĞİÖŞÜçğıöşü') },
  { id: 'digits',  title: 'Digits',      chars: chars('0123456789') },
  { id: 'punct',   title: 'Punctuation', chars: chars('.,;:!?\'"-–…()/@&%+=*#_') },
];

// Format a code point the way font tools show it, e.g. 65 -> "U+0041".
export function formatCodePoint(codePoint) {
  return 'U+' + codePoint.toString(16).toUpperCase().padStart(4, '0');
}

// Flat list of every glyph, in grid order. Each glyph looks like:
//   { id: 'U+0041', char: 'A', codePoint: 65, section: 'upper', index: 0 }
export const GLYPHS = [];
for (const section of SECTIONS) {
  for (const ch of section.chars) {
    const codePoint = ch.codePointAt(0);
    GLYPHS.push({
      id: formatCodePoint(codePoint),
      char: ch,
      codePoint: codePoint,
      section: section.id,
      index: GLYPHS.length,
    });
  }
}

export { SECTIONS };
