// Entry point: builds the glyph grid and connects the page to the state.

import { GLYPHS, SECTIONS } from './glyphs.js';
import { state, onChange, selectGlyph, selectedGlyph, isDone, countDone } from './state.js';
import { GlyphCanvas } from './canvas.js';

// Short helper for document.getElementById.
function $(id) {
  return document.getElementById(id);
}

const glyphCanvas = new GlyphCanvas($('draw-canvas'));

// One <button> per glyph, keyed by glyph id, so we can update them later.
const cellsById = {};

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
      cell.innerHTML = `<span class="cell-char"></span><span class="cell-mark" aria-hidden="true"></span>`;
      cell.querySelector('.cell-char').textContent = glyph.char;
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
  $('btn-prev').addEventListener('click', () => selectGlyph(state.selectedIndex - 1));
  $('btn-next-top').addEventListener('click', () => selectGlyph(state.selectedIndex + 1));
  $('btn-next').addEventListener('click', () => selectGlyph(state.selectedIndex + 1));

  setupToggle($('btn-guides'), (on) => { glyphCanvas.showGuides = on; glyphCanvas.draw(); });
  setupToggle($('btn-ghost'), (on) => { glyphCanvas.showGhost = on; glyphCanvas.draw(); });

  // Left / right arrow keys switch characters, unless the user is typing in a field.
  document.addEventListener('keydown', (event) => {
    const tag = document.activeElement ? document.activeElement.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (event.key === 'ArrowLeft') selectGlyph(state.selectedIndex - 1);
    if (event.key === 'ArrowRight') selectGlyph(state.selectedIndex + 1);
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

function render() {
  const glyph = selectedGlyph();
  const total = GLYPHS.length;
  const done = countDone();

  // Grid cells: selected / done / empty.
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
  }

  // Canvas header and navigation.
  const prev = GLYPHS[(glyph.index - 1 + total) % total];
  const next = GLYPHS[(glyph.index + 1) % total];
  $('canvas-title').textContent = `CANVAS.EXE — '${glyph.char}' ${glyph.id}`;
  $('char-position').textContent = `${glyph.index + 1} of ${total}`;
  $('prev-label').textContent = `prev: ${prev.char}`;
  $('next-label').textContent = `next: ${next.char}`;
  $('btn-next').setAttribute('aria-label', `Next character: ${next.char}`);
  glyphCanvas.setChar(glyph.char);

  // Progress everywhere it is shown.
  const percent = Math.round((done / total) * 100);
  $('progress-count').textContent = `${done} / ${total}`;
  $('progress-fill').style.width = `${percent}%`;
  $('progress-bar').setAttribute('aria-valuemax', String(total));
  $('progress-bar').setAttribute('aria-valuenow', String(done));
  $('top-progress').textContent = `${done} / ${total} drawn (${percent}%)`;
  $('status-count').textContent = `${done} of ${total} [${percent}%]`;
}

// Keep the file path in the status bar in sync with the font name.
function setupFontNameEcho() {
  const input = $('font-name');
  const update = () => {
    const safe = (input.value.trim() || 'my handwriting').replace(/[^A-Za-z0-9_-]+/g, '_');
    $('status-path').textContent = `C:\\FONTS\\${safe.toUpperCase()}.OTF`;
  };
  input.addEventListener('input', update);
  update();
}

// ---------- Start ----------

buildGlyphGrid();
setupFilterTabs();
setupCanvasControls();
setupFontNameEcho();
onChange(render);
render();

// The ghost and guide labels use web fonts; redraw once they have loaded.
document.fonts.ready.then(() => glyphCanvas.draw());
