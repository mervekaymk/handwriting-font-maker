// Converting the app state to / from a "project" object.
// The same format is used for auto-save (IndexedDB) and for the
// "Export project (.json)" / "Import project" buttons.
//
// Project format (version 1):
// {
//   app: "handwriting-font-maker",
//   version: 1,
//   fontName: "My Handwriting",
//   author: "",
//   spaceWidth: 300,
//   metrics: { unitsPerEm, ascender, capHeight, xHeight, descender },
//   glyphs: {
//     "U+0041": { char: "A", lsb: 40, rsb: 40, strokes: [ { size, usePressure, points: [[x, y, p], ...] } ] },
//     ...  (only glyphs that have strokes or changed spacing)
//   }
// }

import { GLYPHS } from './glyphs.js';
import {
  UNITS_PER_EM, ASCENDER, CAP_HEIGHT, X_HEIGHT, DESCENDER,
  DEFAULT_SIDE_BEARING, DEFAULT_SPACE_WIDTH,
} from './config.js';

export const APP_ID = 'handwriting-font-maker';
export const PROJECT_VERSION = 1;

// Glyph ids we know about, for quick lookups during import.
const KNOWN_IDS = new Set(GLYPHS.map((g) => g.id));

// ---------- State -> project ----------

export function stateToProject(state) {
  const glyphs = {};
  for (const glyph of GLYPHS) {
    const data = state.glyphData[glyph.id];
    if (!data) continue;
    const changedSpacing = data.lsb !== DEFAULT_SIDE_BEARING || data.rsb !== DEFAULT_SIDE_BEARING;
    if (data.strokes.length === 0 && !changedSpacing) continue;  // keep files small
    glyphs[glyph.id] = {
      char: glyph.char,  // not needed by the app, but makes the JSON easier to read
      lsb: data.lsb,
      rsb: data.rsb,
      strokes: data.strokes,
    };
  }

  return {
    app: APP_ID,
    version: PROJECT_VERSION,
    fontName: state.fontName,
    author: state.author,
    spaceWidth: state.spaceWidth,
    metrics: {
      unitsPerEm: UNITS_PER_EM,
      ascender: ASCENDER,
      capHeight: CAP_HEIGHT,
      xHeight: X_HEIGHT,
      descender: DESCENDER,
    },
    glyphs: glyphs,
  };
}

// ---------- Project -> state (with checks) ----------

// Checks a project object (e.g. from an imported file).
// Returns { ok: true, values } or { ok: false, error: "message for the user" }.
// `values` has the shape replaceAll() in state.js expects.
export function readProject(project) {
  if (!isObject(project)) {
    return fail('This file is not a project file.');
  }
  if (project.app !== APP_ID) {
    return fail('This file was not made with Handwriting Font Maker.');
  }
  if (typeof project.version !== 'number') {
    return fail('The project file has no version number.');
  }
  if (project.version > PROJECT_VERSION) {
    return fail(`This project was saved by a newer version of the app (file version ${project.version}, this app supports up to ${PROJECT_VERSION}). Please use the latest version of the site.`);
  }
  if (!isObject(project.glyphs)) {
    return fail('The project file has no glyph data.');
  }

  const glyphData = {};
  for (const id of Object.keys(project.glyphs)) {
    if (!KNOWN_IDS.has(id)) continue;  // ignore characters this version doesn't have
    const entry = project.glyphs[id];
    if (!isObject(entry) || !Array.isArray(entry.strokes)) {
      return fail(`Glyph ${id} is damaged in this file.`);
    }
    for (const stroke of entry.strokes) {
      if (!isValidStroke(stroke)) {
        return fail(`A stroke in glyph ${id} is damaged in this file.`);
      }
    }
    glyphData[id] = {
      strokes: entry.strokes.map((s) => ({ size: s.size, usePressure: s.usePressure, points: s.points })),
      lsb: numberOr(entry.lsb, DEFAULT_SIDE_BEARING),
      rsb: numberOr(entry.rsb, DEFAULT_SIDE_BEARING),
    };
  }

  return {
    ok: true,
    values: {
      glyphData: glyphData,
      fontName: typeof project.fontName === 'string' ? project.fontName : 'My Handwriting',
      author: typeof project.author === 'string' ? project.author : '',
      spaceWidth: numberOr(project.spaceWidth, DEFAULT_SPACE_WIDTH),
    },
  };
}

function isValidStroke(stroke) {
  if (!isObject(stroke)) return false;
  if (typeof stroke.size !== 'number' || stroke.size <= 0) return false;
  if (typeof stroke.usePressure !== 'boolean') return false;
  if (!Array.isArray(stroke.points) || stroke.points.length === 0) return false;
  for (const p of stroke.points) {
    if (!Array.isArray(p) || p.length !== 3) return false;
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1]) || !Number.isFinite(p[2])) return false;
  }
  return true;
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function numberOr(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function fail(message) {
  return { ok: false, error: message };
}

// Turn a font name into a safe file name: "Merve'nin Yazısı!" -> "Mervenin-Yazisi".
export function safeFileName(name) {
  const cleaned = name
    .normalize('NFD')                 // split "ş" into "s" + accent mark ...
    .replace(/[̀-ͯ]/g, '')  // ... and drop the accent marks
    .replace(/ı/g, 'i')
    .trim()
    .replace(/[^A-Za-z0-9 _-]+/g, '')
    .replace(/\s+/g, '-');
  return cleaned || 'my-handwriting';
}
