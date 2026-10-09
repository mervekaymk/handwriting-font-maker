// All font metrics and app constants live here, in one place.
// Units are font units: 1000 units = 1 em (the full font size).

export const UNITS_PER_EM = 1000;
export const ASCENDER = 800;    // top of tall letters like 'b', 'd', 'l'
export const CAP_HEIGHT = 700;  // top of capital letters
export const X_HEIGHT = 500;    // top of small letters like 'x', 'a'
export const BASELINE = 0;      // letters sit on this line
export const DESCENDER = -200;  // bottom of 'g', 'p', 'y'

// Default empty space on the left / right of every glyph (side bearings).
export const DEFAULT_SIDE_BEARING = 40;

// Width of the space character when the user has not changed it.
export const DEFAULT_SPACE_WIDTH = 300;
