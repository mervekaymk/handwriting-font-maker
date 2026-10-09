// Live preview: rebuilds the font in memory when the drawing changes and
// shows the PREVIEW.TXT text box in it.
//
// How: buildFont() -> font.toArrayBuffer() (the bytes of a real .otf file) ->
// the browser's FontFace API loads those bytes as a web font -> the text box
// uses that font. Characters not drawn yet fall back to the normal font.

import { buildFont } from './fontbuild.js';

const REBUILD_DELAY_MS = 300;

// Give every strokes array a number, so we can tell cheaply whether anything
// changed since the last build (every edit creates a new strokes array).
const arrayIds = new WeakMap();
let nextArrayId = 1;
function idOf(array) {
  if (!arrayIds.has(array)) arrayIds.set(array, nextArrayId++);
  return arrayIds.get(array);
}

// A short text that changes whenever something that affects the font changes.
// Selecting another glyph or typing a font name does not change it.
function fontSignature(state) {
  const parts = [state.spaceWidth];
  for (const id of Object.keys(state.glyphData)) {
    const data = state.glyphData[id];
    if (data.strokes.length === 0) continue;
    parts.push(`${id}:${idOf(data.strokes)}:${data.lsb}:${data.rsb}`);
  }
  return parts.join('|');
}

export class FontPreview {
  constructor(textArea, hintElement) {
    this.textArea = textArea;
    this.hint = hintElement;
    this.timer = null;
    this.lastSignature = null;
    this.currentFace = null;
    this.buildCount = 0;
  }

  // Call on every state change; the actual rebuild happens a moment later.
  scheduleUpdate(state) {
    const signature = fontSignature(state);
    if (signature === this.lastSignature) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.update(state, signature), REBUILD_DELAY_MS);
  }

  async update(state, signature) {
    this.lastSignature = signature;
    try {
      const { font, missing } = buildFont(state);
      const drawnCount = font.glyphs.length - 2;  // minus .notdef and space
      if (drawnCount === 0) {
        this.useFont(null);
        this.hint.textContent = 'The preview uses your font once you start drawing.';
        return;
      }

      // A new family name each time, so the browser never shows an old cached version.
      this.buildCount++;
      const familyName = `HFM Preview ${this.buildCount}`;
      const face = new FontFace(familyName, font.toArrayBuffer());
      await face.load();
      // A newer build may have started while this one was loading; then skip this one.
      if (signature !== this.lastSignature) return;

      document.fonts.add(face);
      this.useFont(face, familyName);
      this.hint.textContent = missing.length > 0
        ? `${drawnCount} characters drawn. The others show in a normal font for now.`
        : 'All characters drawn. This is exactly your font.';
    } catch (err) {
      console.error('Building the preview font failed', err);
      this.hint.textContent = 'The preview could not be updated (see browser console).';
    }
  }

  useFont(face, familyName) {
    if (this.currentFace) document.fonts.delete(this.currentFace);
    this.currentFace = face;
    // Fallback list: undrawn characters use a plain font.
    this.textArea.style.fontFamily = face ? `"${familyName}", "Space Mono", monospace` : '';
  }
}
