// Turns a glyph's strokes into clean outlines ("contours") ready for the font.
//
// Why not potrace? potrace traces a bitmap. We already have exact vector shapes
// for every stroke (from perfect-freehand), so we use those directly. That keeps
// the font identical to what the user saw on screen.
//
// Steps for one glyph:
//   1. Get each stroke's outline polygon (stroke.js).
//   2. Merge ("union") all polygons into one shape with polygon-clipping, so
//      overlapping strokes don't leave odd overlaps or holes in the font.
//   3. Simplify each ring (fewer points, same look) and drop tiny specks.
//   4. Fix the direction of each ring: outer shapes counter-clockwise, holes
//      clockwise (the font convention, with y pointing up).
//   5. contourToPath() turns a ring into smooth curve commands for drawing / the font.
//
// A ring is an array of [x, y] points in font units, not repeating the first point at the end.

import { strokeOutline } from './stroke.js';

// polygon-clipping is loaded with a normal <script> tag in index.html
// (its download is a single "UMD" file), which puts it on window.
const polygonClipping = window.polygonClipping;

// Rings smaller than this (in square font units) are removed as stray specks.
// For scale: the smallest brush dot is about 35 x 35 units = ~960 square units.
export const MIN_CONTOUR_AREA = 200;

// How far (font units) simplification may move the outline. 1 unit = 1/1000 em.
const SIMPLIFY_TOLERANCE = 1.0;

// Long straight pieces are cut into pieces of at most this length, so the
// curve smoothing in contourToPath() stays close to the real shape.
const MAX_SEGMENT_LENGTH = 30;

// A point where the outline turns more sharply than this stays a sharp corner.
const CORNER_ANGLE_DEGREES = 60;

// The contours of a strokes array only change when the array changes
// (every edit creates a new array), so cache the result per array.
const contourCache = new WeakMap();

// Returns the cleaned contours (array of rings) for a glyph's strokes.
export function glyphContours(strokes) {
  if (contourCache.has(strokes)) return contourCache.get(strokes);

  const polygons = [];
  for (const stroke of strokes) {
    const ring = cleanRing(strokeOutline(stroke));
    if (ring.length >= 3) polygons.push(ring);
  }

  let rings;
  try {
    rings = mergePolygons(polygons);
  } catch (err) {
    // The merge library can fail on very unusual shapes. Fall back to the raw
    // stroke shapes, all turned the same way, which fonts still fill correctly.
    console.warn('Merging strokes failed, using unmerged outlines', err);
    rings = polygons
      .map((ring) => finishRing(ring, true))
      .filter((ring) => ring !== null);
  }

  contourCache.set(strokes, rings);
  return rings;
}

// Union all polygons and return the finished rings (outer + holes).
function mergePolygons(polygons) {
  if (polygons.length === 0) return [];

  // polygon-clipping wants: union(polygon1, polygon2, ...) where each polygon is
  // [outerRing, ...holes]. Its result is a list of polygons in the same shape.
  const merged = polygonClipping.union(...polygons.map((ring) => [ring]));

  const rings = [];
  for (const polygon of merged) {
    const outer = finishRing(dropClosingPoint(polygon[0]), true);
    if (!outer) continue;  // whole piece too small: drop it with its holes
    rings.push(outer);
    for (let i = 1; i < polygon.length; i++) {
      const hole = finishRing(dropClosingPoint(polygon[i]), false);
      if (hole) rings.push(hole);
    }
  }
  return rings;
}

// Simplify, size-check and orient one ring. Returns null if it should be dropped.
function finishRing(ring, isOuter) {
  let points = simplifyClosed(ring, SIMPLIFY_TOLERANCE);
  if (points.length < 3) return null;
  const area = signedArea(points);
  if (Math.abs(area) < MIN_CONTOUR_AREA) return null;

  // Positive area = counter-clockwise (with y up). Outer: CCW, hole: CW.
  if ((isOuter && area < 0) || (!isOuter && area > 0)) {
    points = points.slice().reverse();
  }
  return splitLongSegments(points, MAX_SEGMENT_LENGTH);
}

// ---------- Small geometry helpers ----------

// Round coordinates and remove repeated / invalid points.
function cleanRing(points) {
  const ring = [];
  for (const p of points) {
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) continue;
    const x = Math.round(p[0] * 100) / 100;
    const y = Math.round(p[1] * 100) / 100;
    const last = ring[ring.length - 1];
    if (last && last[0] === x && last[1] === y) continue;
    ring.push([x, y]);
  }
  if (ring.length > 1) {
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] === last[0] && first[1] === last[1]) ring.pop();
  }
  return ring;
}

function dropClosingPoint(ring) {
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (ring.length > 1 && first[0] === last[0] && first[1] === last[1]) {
    return ring.slice(0, -1);
  }
  return ring;
}

// Shoelace formula. Positive = counter-clockwise when y points up.
export function signedArea(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    sum += x1 * y2 - x2 * y1;
  }
  return sum / 2;
}

// Distance from point p to the line segment a-b.
function distanceToSegment(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lengthSq = dx * dx + dy * dy;
  let t = lengthSq === 0 ? 0 : ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  const x = a[0] + t * dx - p[0];
  const y = a[1] + t * dy - p[1];
  return Math.sqrt(x * x + y * y);
}

// Ramer–Douglas–Peucker: keep only the points needed to stay within `tolerance`.
function simplifyOpen(points, tolerance) {
  if (points.length <= 2) return points.slice();
  const keep = new Array(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;

  // Iterative version (a stack instead of recursion), so long rings can't overflow.
  const stack = [[0, points.length - 1]];
  while (stack.length > 0) {
    const [start, end] = stack.pop();
    let maxDistance = 0;
    let maxIndex = -1;
    for (let i = start + 1; i < end; i++) {
      const d = distanceToSegment(points[i], points[start], points[end]);
      if (d > maxDistance) {
        maxDistance = d;
        maxIndex = i;
      }
    }
    if (maxDistance > tolerance) {
      keep[maxIndex] = true;
      stack.push([start, maxIndex], [maxIndex, end]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

// RDP for a closed ring: split it at the point farthest from the first point,
// simplify both halves, and join them again.
function simplifyClosed(ring, tolerance) {
  if (ring.length <= 4) return ring.slice();
  let farIndex = 0;
  let farDistance = -1;
  for (let i = 1; i < ring.length; i++) {
    const d = Math.hypot(ring[i][0] - ring[0][0], ring[i][1] - ring[0][1]);
    if (d > farDistance) {
      farDistance = d;
      farIndex = i;
    }
  }
  const firstHalf = simplifyOpen(ring.slice(0, farIndex + 1), tolerance);
  const secondHalf = simplifyOpen(ring.slice(farIndex).concat([ring[0]]), tolerance);
  // Both halves include the split points; drop the duplicates when joining.
  return firstHalf.concat(secondHalf.slice(1, -1));
}

// Add points along long straight pieces (see MAX_SEGMENT_LENGTH).
function splitLongSegments(ring, maxLength) {
  const result = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    result.push(a);
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const pieces = Math.ceil(length / maxLength);
    for (let k = 1; k < pieces; k++) {
      const t = k / pieces;
      result.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return result;
}

// Angle (degrees) the outline turns at point b, coming from a, going to c.
function turnAngle(a, b, c) {
  const angle1 = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const angle2 = Math.atan2(c[1] - b[1], c[0] - b[0]);
  let diff = Math.abs(angle2 - angle1) * (180 / Math.PI);
  if (diff > 180) diff = 360 - diff;
  return diff;
}

// ---------- Ring -> smooth path ----------

// Converts a ring into path commands with smooth curves:
//   { type: 'M', x, y }                 move to
//   { type: 'L', x, y }                 straight line to
//   { type: 'Q', x1, y1, x, y }         quadratic curve (control x1,y1) to x,y
//   { type: 'Z' }                       close
//
// Smoothing trick: at a gentle point, the curve uses that point as its control
// point and passes through the midpoints of the neighbouring segments. At a
// sharp corner, the path goes straight to the point so the corner stays sharp.
export function contourToPath(ring) {
  const n = ring.length;
  const midpoint = (i) => {
    const a = ring[i];
    const b = ring[(i + 1) % n];
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  };
  const isCorner = (i) => turnAngle(ring[(i - 1 + n) % n], ring[i], ring[(i + 1) % n]) > CORNER_ANGLE_DEGREES;

  // Where the path is after handling point i: on the point itself (corner)
  // or on the midpoint of the next segment (smooth).
  const positionAfter = (i) => (isCorner(i) ? ring[i] : midpoint(i));

  const start = positionAfter(n - 1);
  const commands = [{ type: 'M', x: start[0], y: start[1] }];
  for (let i = 0; i < n; i++) {
    const p = ring[i];
    if (isCorner(i)) {
      commands.push({ type: 'L', x: p[0], y: p[1] });
    } else {
      const end = midpoint(i);
      commands.push({ type: 'Q', x1: p[0], y1: p[1], x: end[0], y: end[1] });
    }
  }
  commands.push({ type: 'Z' });
  return commands;
}

// The box around all contours, or null for an empty glyph.
export function contoursBounds(rings) {
  let xMin = Infinity, yMin = Infinity, xMax = -Infinity, yMax = -Infinity;
  for (const ring of rings) {
    for (const [x, y] of ring) {
      if (x < xMin) xMin = x;
      if (x > xMax) xMax = x;
      if (y < yMin) yMin = y;
      if (y > yMax) yMax = y;
    }
  }
  return rings.length === 0 ? null : { xMin, yMin, xMax, yMax };
}
