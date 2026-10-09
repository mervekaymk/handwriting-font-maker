// The app's state in one object, plus a tiny "tell everyone it changed" system.
//
// Any module can read `state`. To change it, call one of the functions below;
// they update the state and then call every listener registered with onChange().

import { GLYPHS } from './glyphs.js';

export const state = {
  // Index into GLYPHS of the character currently open on the canvas.
  selectedIndex: 0,

  // Drawing data per glyph, keyed by glyph id ('U+0041').
  // Filled in later steps: { strokes: [...], lsb: 40, rsb: 40 }
  glyphData: {},
};

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

export function selectedGlyph() {
  return GLYPHS[state.selectedIndex];
}

export function selectGlyph(index) {
  // Wrap around at both ends so "Next" on the last glyph goes back to the first.
  const count = GLYPHS.length;
  state.selectedIndex = ((index % count) + count) % count;
  notifyChange();
}

// A glyph is "done" when it has at least one stroke.
export function isDone(glyphId) {
  const data = state.glyphData[glyphId];
  return Boolean(data && data.strokes && data.strokes.length > 0);
}

export function countDone() {
  let done = 0;
  for (const glyph of GLYPHS) {
    if (isDone(glyph.id)) done++;
  }
  return done;
}
