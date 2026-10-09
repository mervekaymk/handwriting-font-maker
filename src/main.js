// Entry point: builds the glyph grid and connects the page to the state.

import { GLYPHS, SECTIONS } from './glyphs.js';
import {
  state, onChange, selectGlyph, selectedGlyph, isDone, countDone,
  getGlyphData, addStroke, clearGlyph, undo, redo, canUndo, canRedo, setBearing,
  setFontSetting, replaceAll, emptyProjectValues,
} from './state.js';
import { GlyphCanvas, drawThumbnail } from './canvas.js';
import { BRUSH_SIZES } from './stroke.js';
import { stateToProject, readProject, safeFileName } from './project.js';
import { saveProject, loadProject } from './storage.js';
import { showDialog } from './dialog.js';

// Short helper for document.getElementById.
function $(id) {
  return document.getElementById(id);
}

const glyphCanvas = new GlyphCanvas($('draw-canvas'));

// One <button> per glyph, keyed by glyph id, so we can update them later.
const cellsById = {};

// For each glyph, the strokes array its thumbnail was last drawn from.
// Every change creates a new array, so "different array" = "needs redraw".
const thumbDrawnFrom = {};

// ---------- Glyph grid ----------

function buildGlyphGrid() {
  const grid = $('glyph-grid');
  grid.innerHTML = '';

  for (const section of SECTIONS) {
    const wrapper = document.createElement('div');
    wrapper.className = 'grid-section';
    wrapper.dataset.section = section.id;

    const title = document.createElement('h3');
    title.className = 'grid-section-title';
    title.textContent = section.title;
    wrapper.appendChild(title);

    const cells = document.createElement('div');
    cells.className = 'grid-cells';

    for (const glyph of GLYPHS) {
      if (glyph.section !== section.id) continue;

      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'glyph-cell';
      cell.innerHTML =
        `<span class="cell-char"></span>` +
        `<canvas class="cell-thumb" aria-hidden="true"></canvas>` +
        `<span class="cell-label" aria-hidden="true"></span>` +
        `<span class="cell-mark" aria-hidden="true"></span>`;
      cell.querySelector('.cell-char').textContent = glyph.char;
      cell.querySelector('.cell-label').textContent = glyph.char;
      cell.addEventListener('click', () => selectGlyph(glyph.index));

      cellsById[glyph.id] = cell;
      cells.appendChild(cell);
    }

    wrapper.appendChild(cells);
    grid.appendChild(wrapper);
  }

  $('glyph-total').textContent = `${GLYPHS.length} CHARS`;
}

// Show only one section (or all) when a tab is clicked.
function setupFilterTabs() {
  const tabs = document.querySelectorAll('.tab[data-filter]');
  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      const filter = tab.dataset.filter;
      for (const other of tabs) {
        other.setAttribute('aria-pressed', String(other === tab));
      }
      for (const section of document.querySelectorAll('.grid-section')) {
        section.hidden = filter !== 'all' && section.dataset.section !== filter;
      }
    });
  }
}

// ---------- Canvas controls ----------

function setupCanvasControls() {
  // A finished stroke is saved into the selected glyph.
  glyphCanvas.onStrokeEnd = (stroke) => addStroke(selectedGlyph().id, stroke);
  glyphCanvas.onInputType = (type) => { $('input-badge').textContent = `${type} ready`; };

  // Navigation.
  $('btn-prev').addEventListener('click', () => selectGlyph(state.selectedIndex - 1));
  $('btn-next-top').addEventListener('click', () => selectGlyph(state.selectedIndex + 1));
  $('btn-next').addEventListener('click', () => selectGlyph(state.selectedIndex + 1));

  // Editing.
  $('btn-undo').addEventListener('click', () => undo(selectedGlyph().id));
  $('btn-redo').addEventListener('click', () => redo(selectedGlyph().id));
  $('btn-clear').addEventListener('click', () => clearGlyph(selectedGlyph().id));

  // Brush size: three buttons, only one pressed at a time.
  const brushButtons = document.querySelectorAll('[data-brush]');
  for (const button of brushButtons) {
    button.addEventListener('click', () => {
      for (const other of brushButtons) {
        other.setAttribute('aria-pressed', String(other === button));
      }
      glyphCanvas.brushSize = BRUSH_SIZES[button.dataset.brush];
    });
  }
  glyphCanvas.brushSize = BRUSH_SIZES.medium;

  // Pressure sensitivity (only affects new strokes).
  $('opt-pressure').addEventListener('change', (e) => {
    glyphCanvas.pressureEnabled = e.target.checked;
  });

  // Side bearing sliders.
  for (const side of ['lsb', 'rsb']) {
    $(side).addEventListener('input', (e) => {
      setBearing(selectedGlyph().id, side, Number(e.target.value));
    });
  }

  setupToggle($('btn-guides'), (on) => { glyphCanvas.showGuides = on; glyphCanvas.draw(); });
  setupToggle($('btn-ghost'), (on) => { glyphCanvas.showGhost = on; glyphCanvas.draw(); });

  // Keyboard shortcuts, unless the user is typing in a field:
  //   left / right arrow = previous / next character
  //   Ctrl+Z = undo, Ctrl+Shift+Z or Ctrl+Y = redo (Cmd on Mac)
  document.addEventListener('keydown', (event) => {
    const tag = document.activeElement ? document.activeElement.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    const mod = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    if (mod && key === 'z' && !event.shiftKey) {
      event.preventDefault();
      undo(selectedGlyph().id);
    } else if (mod && (key === 'y' || (key === 'z' && event.shiftKey))) {
      event.preventDefault();
      redo(selectedGlyph().id);
    } else if (event.key === 'ArrowLeft') {
      selectGlyph(state.selectedIndex - 1);
    } else if (event.key === 'ArrowRight') {
      selectGlyph(state.selectedIndex + 1);
    }
  });
}

// A button with aria-pressed that flips between on and off.
function setupToggle(button, onToggle) {
  button.addEventListener('click', () => {
    const on = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(on));
    onToggle(on);
  });
}

// ---------- Rendering: update the page from the state ----------

function renderGrid() {
  for (const g of GLYPHS) {
    const cell = cellsById[g.id];
    const doneHere = isDone(g.id);
    const selected = g.index === state.selectedIndex;
    cell.classList.toggle('is-done', doneHere);
    cell.classList.toggle('is-selected', selected);
    cell.querySelector('.cell-mark').textContent = doneHere ? '✓' : '';
    cell.setAttribute('aria-label', `${g.char} (${g.id}), ${doneHere ? 'drawn' : 'empty'}`);
    if (selected) cell.setAttribute('aria-current', 'true');
    else cell.removeAttribute('aria-current');

    // Redraw the thumbnail only if this glyph's strokes changed.
    const strokes = doneHere ? state.glyphData[g.id].strokes : null;
    if (strokes && thumbDrawnFrom[g.id] !== strokes) {
      drawThumbnail(cell.querySelector('.cell-thumb'), strokes);
    }
    thumbDrawnFrom[g.id] = strokes;
  }
}

function render() {
  const glyph = selectedGlyph();
  const data = getGlyphData(glyph.id);
  const total = GLYPHS.length;
  const done = countDone();

  renderGrid();

  // Canvas header and navigation.
  const prev = GLYPHS[(glyph.index - 1 + total) % total];
  const next = GLYPHS[(glyph.index + 1) % total];
  $('canvas-title').textContent = `CANVAS.EXE — '${glyph.char}' ${glyph.id}`;
  $('char-position').textContent = `${glyph.index + 1} of ${total}`;
  $('prev-label').textContent = `prev: ${prev.char}`;
  $('next-label').textContent = `next: ${next.char}`;
  $('btn-next').setAttribute('aria-label', `Next character: ${next.char}`);
  glyphCanvas.char = glyph.char;
  glyphCanvas.setStrokes(data.strokes);

  // Editing buttons and spacing sliders for this glyph.
  $('btn-undo').disabled = !canUndo(glyph.id);
  $('btn-redo').disabled = !canRedo(glyph.id);
  $('btn-clear').disabled = data.strokes.length === 0;
  $('lsb').value = data.lsb;
  $('rsb').value = data.rsb;
  $('lsb-value').textContent = data.lsb;
  $('rsb-value').textContent = data.rsb;

  // Progress everywhere it is shown.
  const percent = Math.round((done / total) * 100);
  $('progress-count').textContent = `${done} / ${total}`;
  $('progress-fill').style.width = `${percent}%`;
  $('progress-bar').setAttribute('aria-valuemax', String(total));
  $('progress-bar').setAttribute('aria-valuenow', String(done));
  $('top-progress').textContent = `${done} / ${total} drawn (${percent}%)`;
  $('status-count').textContent = `${done} of ${total} [${percent}%]`;
}

// Font name, author and space width inputs -> state.
function setupFontSettings() {
  $('font-name').addEventListener('input', (e) => setFontSetting('fontName', e.target.value));
  $('font-author').addEventListener('input', (e) => setFontSetting('author', e.target.value));
  $('space-width').addEventListener('input', (e) => setFontSetting('spaceWidth', Number(e.target.value)));
}

function renderFontSettings() {
  // Only write into a text field if it differs, so the cursor doesn't jump while typing.
  if ($('font-name').value !== state.fontName) $('font-name').value = state.fontName;
  if ($('font-author').value !== state.author) $('font-author').value = state.author;
  $('space-width').value = state.spaceWidth;
  $('space-value').textContent = state.spaceWidth;
  $('status-path').textContent = `C:\\FONTS\\${safeFileName(state.fontName).toUpperCase()}.OTF`;
}

// ---------- Project: auto-save, export, import, reset ----------

const SAVE_DELAY_MS = 400;
let saveTimer = null;
let autoSaveEnabled = false;  // switched on after the saved project has been loaded

// Save a moment after the last change, not on every single change.
function scheduleSave() {
  if (!autoSaveEnabled) return;
  clearTimeout(saveTimer);
  $('status-save').textContent = 'saving…';
  saveTimer = setTimeout(async () => {
    const saved = await saveProject(stateToProject(state));
    $('status-save').textContent = saved ? 'saved' : 'not saved (browser storage blocked)';
  }, SAVE_DELAY_MS);
}

function hasAnyDrawing() {
  return countDone() > 0;
}

function exportProjectFile() {
  const project = stateToProject(state);
  const json = JSON.stringify(project);
  downloadFile(`${safeFileName(state.fontName)}-project.json`, json, 'application/json');
}

// Make the browser download some data as a file.
function downloadFile(fileName, data, mimeType) {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before freeing the memory.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function importProjectFile(file) {
  let project;
  try {
    project = JSON.parse(await file.text());
  } catch (err) {
    await showDialog({ title: 'IMPORT.EXE — ERROR', message: 'This file could not be read. It is not valid JSON.' });
    return;
  }

  const result = readProject(project);
  if (!result.ok) {
    await showDialog({ title: 'IMPORT.EXE — ERROR', message: result.error });
    return;
  }

  if (hasAnyDrawing()) {
    const ok = await showDialog({
      title: 'IMPORT.EXE',
      message: 'Importing replaces everything you have drawn now.\nExport your current project first if you want to keep it.',
      okLabel: 'Replace',
      cancelLabel: 'Cancel',
      danger: true,
    });
    if (!ok) return;
  }
  replaceAll(result.values);
}

function setupProjectControls() {
  $('btn-export-json').addEventListener('click', exportProjectFile);

  $('btn-import').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';  // so picking the same file again still triggers "change"
    if (file) await importProjectFile(file);
  });

  $('btn-reset').addEventListener('click', async () => {
    const ok = await showDialog({
      title: 'RESET.EXE',
      message: 'Delete all drawings and settings?\nThis cannot be undone. Export your project first if you want to keep it.',
      okLabel: 'Reset all',
      cancelLabel: 'Cancel',
      danger: true,
    });
    if (ok) replaceAll(emptyProjectValues());
  });
}

// Load the auto-saved project (if any), then start auto-saving.
async function restoreSavedProject() {
  const saved = await loadProject();
  if (saved) {
    const result = readProject(saved);
    if (result.ok) {
      replaceAll(result.values);
      $('status-save').textContent = 'restored';
    } else {
      console.warn('Saved project could not be restored:', result.error);
    }
  }
  autoSaveEnabled = true;
}

// ---------- Start ----------

buildGlyphGrid();
setupFilterTabs();
setupCanvasControls();
setupFontSettings();
setupProjectControls();
onChange(render);
onChange(renderFontSettings);
onChange(scheduleSave);
render();
renderFontSettings();
restoreSavedProject();

// The ghost and guide labels use web fonts; redraw once they have loaded.
document.fonts.ready.then(() => glyphCanvas.draw());
