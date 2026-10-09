// Turns a stroke (the points the user drew) into a filled outline shape.
//
// We use the perfect-freehand library for this. It takes the pen points
// (with pressure) and returns the polygon around the stroke. The same polygon
// is drawn on screen AND (in a later step) put into the font, so what you see
// is exactly what you get.
//
// A stroke is stored as plain data, so it can be saved to JSON:
//   { size: 60, usePressure: true, points: [[x, y, pressure], ...] }
// x / y are in font units (see canvas.js), pressure is 0..1.

import { getStroke } from '../vendor/perfect-freehand-1.2.2.js';

// Brush diameters in font units (a capital letter is 700 units tall).
export const BRUSH_SIZES = {
  small: 35,
  medium: 60,
  large: 95,
};

// Outlines of finished strokes never change, so remember them instead of
// recalculating on every redraw. A WeakMap forgets entries when the stroke is deleted.
const outlineCache = new WeakMap();

// Returns the outline polygon as an array of [x, y] points in font units.
// `isComplete` is false while the user is still drawing the stroke.
export function strokeOutline(stroke, isComplete = true) {
  if (isComplete && outlineCache.has(stroke)) {
    return outlineCache.get(stroke);
  }

  const outline = getStroke(stroke.points, {
    size: stroke.size,
    // thinning > 0 means "pressure changes the width". 0 = constant width.
    thinning: stroke.usePressure ? 0.6 : 0,
    smoothing: 0.5,
    streamline: 0.4,
    simulatePressure: false,  // only use real pen pressure, never fake it from speed
    last: isComplete,
  });

  if (isComplete) {
    outlineCache.set(stroke, outline);
  }
  return outline;
}
