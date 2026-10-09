// The app's state in one object, plus a tiny "tell everyone it changed" system.
//
// Any module can read `state`. To change it, call one of the functions below;
// they update the state and then call every listener registered with onChange().

import { GLYPHS } from './glyphs.js';
import { DEFAULT_SIDE_BEARING, DEFAULT_SPACE_WIDTH } from './config.js';

export const state = {
  // Index into GLYPHS of the character currently open on the canvas.
  selectedIndex: 0,

  // Drawing data per glyph, keyed by glyph id ('U+0041'):
  //   { strokes: [stroke, ...], lsb: 40, rsb: 40 }
  // (lsb / rsb = left / right side bearing = empty space beside the letter)
  glyphData: {},

  // Font settings from the EXPORT.EXE window.
  fontName: 'My Handwriting',
  author: '',
  spaceWidth: DEFAULT_SPACE_WIDTH,
};

// Undo / redo history per glyph. Only kept in memory, not saved.
//   history[id] = { past: [strokes, ...], future: [strokes, ...] }
// Each entry is a whole strokes array. Stroke objects are never modified after
// they are finished, so keeping old arrays around is cheap and safe.
const history = {};

const listeners = [];

// Register a function to call whenever the state changes.
export function onChange(listener) {
  listeners.push(listener);
}

export function notifyChange() {
  for (const listener of listeners) {
    listener(state);
  }
}

// ---------- Selection ----------

export function selectedGlyph() {
  return GLYPHS[state.selectedIndex];
}

export function selectGlyph(index) {
  // Wrap around at both ends so "Next" on the last glyph goes back to the first.
  const count = GLYPHS.length;
  state.selectedIndex = ((index % count) + count) % count;
  notifyChange();
}

// ---------- Glyph data ----------

// Returns the data for a glyph, creating an empty entry the first time.
export function getGlyphData(glyphId) {
  if (!state.glyphData[glyphId]) {
    state.glyphData[glyphId] = {
      strokes: [],
      lsb: DEFAULT_SIDE_BEARING,
      rsb: DEFAULT_SIDE_BEARING,
    };
  }
  return state.glyphData[glyphId];
}

function getHistory(glyphId) {
  if (!history[glyphId]) {
    history[glyphId] = { past: [], future: [] };
  }
  return history[glyphId];
}

// Replace a glyph's strokes and remember the old ones for Undo.
function commitStrokes(glyphId, newStrokes) {
  const data = getGlyphData(glyphId);
  const h = getHistory(glyphId);
  h.past.push(data.strokes);
  h.future = [];  // a new change makes the old "redo" steps meaningless
  data.strokes = newStrokes;
  notifyChange();
}

export function addStroke(glyphId, stroke) {
  const data = getGlyphData(glyphId);
  commitStrokes(glyphId, [...data.strokes, stroke]);
}

export function clearGlyph(glyphId) {
  const data = getGlyphData(glyphId);
  if (data.strokes.length === 0) return;
  commitStrokes(glyphId, []);  // Clear can be undone too
}

export function undo(glyphId) {
  const h = getHistory(glyphId);
  if (h.past.length === 0) return;
  const data = getGlyphData(glyphId);
  h.future.push(data.strokes);
  data.strokes = h.past.pop();
  notifyChange();
}

export function redo(glyphId) {
  const h = getHistory(glyphId);
  if (h.future.length === 0) return;
  const data = getGlyphData(glyphId);
  h.past.push(data.strokes);
  data.strokes = h.future.pop();
  notifyChange();
}

export function canUndo(glyphId) {
  return getHistory(glyphId).past.length > 0;
}

export function canRedo(glyphId) {
  return getHistory(glyphId).future.length > 0;
}

// side is 'lsb' or 'rsb'.
export function setBearing(glyphId, side, value) {
  getGlyphData(glyphId)[side] = value;
  notifyChange();
}

// key is 'fontName', 'author' or 'spaceWidth'.
export function setFontSetting(key, value) {
  state[key] = value;
  notifyChange();
}

// Replace everything at once (after loading, importing or "Reset all").
// `values` = { glyphData, fontName, author, spaceWidth }.
// Undo history is cleared, because it belonged to the old drawings.
export function replaceAll(values) {
  state.glyphData = values.glyphData;
  state.fontName = values.fontName;
  state.author = values.author;
  state.spaceWidth = values.spaceWidth;
  for (const id of Object.keys(history)) {
    delete history[id];
  }
  notifyChange();
}

export function emptyProjectValues() {
  return {
    glyphData: {},
    fontName: 'My Handwriting',
    author: '',
    spaceWidth: DEFAULT_SPACE_WIDTH,
  };
}

// ---------- Progress ----------

// A glyph is "done" when it has at least one stroke.
export function isDone(glyphId) {
  const data = state.glyphData[glyphId];
  return Boolean(data && data.strokes.length > 0);
}

export function countDone() {
  let done = 0;
  for (const glyph of GLYPHS) {
    if (isDone(glyph.id)) done++;
  }
  return done;
}
