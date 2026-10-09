// The big drawing canvas: guide lines, the faint reference letter ("ghost"),
// the user's strokes, and pen / mouse / touch input.
//
// Coordinates: the drawing is stored in FONT UNITS, not pixels, so it does not
// depend on screen size. y = 0 is the baseline and y grows upward (like in fonts).
// The canvas shows a square window onto that space.

import { ASCENDER, CAP_HEIGHT, X_HEIGHT, BASELINE, DESCENDER } from './config.js';
import { strokeOutline } from './stroke.js';

// The square area of font space the canvas shows.
const VIEW_SIZE = 1200;            // width and height, in font units
const VIEW_TOP = ASCENDER + 100;   // font y at the top edge of the canvas

const INK = '#1a1a1a';
const MUTED = '#787878';
const ROSE = '#c27c84';

// Pressure used when there is no real pen pressure (mouse, finger, toggle off).
const CONSTANT_PRESSURE = 0.5;

export class GlyphCanvas {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.char = '';
    this.showGuides = true;
    this.showGhost = true;

    // Finished strokes of the current glyph (set from main.js).
    this.strokes = [];

    // Brush settings (set from main.js).
    this.brushSize = 60;
    this.pressureEnabled = true;

    // Called with the new stroke when the user lifts the pen. Set from main.js.
    this.onStrokeEnd = null;
    // Called with 'pen' / 'mouse' / 'touch' when a stroke starts. Set from main.js.
    this.onInputType = null;

    // The stroke being drawn right now (null when not drawing).
    this.liveStroke = null;
    this.activePointerId = null;
    // Once an Apple Pencil (or any pen) is used, finger touches on the canvas are
    // ignored so a resting palm does not draw. Reloading the page resets this.
    this.penSeen = false;
    this.redrawQueued = false;

    this.setupPointerEvents();

    // Redraw whenever the canvas changes size on screen (window resize, rotation).
    const observer = new ResizeObserver(() => this.resize());
    observer.observe(this.canvas);
    this.resize();
  }

  // Match the canvas's internal pixel size to its on-screen size, so lines are sharp
  // on high-DPI screens like the iPad (devicePixelRatio is 2 there).
  resize() {
    const dpr = window.devicePixelRatio || 1;
    const cssSize = this.canvas.clientWidth;
    this.canvas.width = Math.round(cssSize * dpr);
    this.canvas.height = Math.round(cssSize * dpr);
    this.draw();
  }

  // How many canvas pixels one font unit takes.
  get scale() {
    return this.canvas.width / VIEW_SIZE;
  }

  // Font units -> canvas pixels.
  toCanvasX(fontX) { return fontX * this.scale; }
  toCanvasY(fontY) { return (VIEW_TOP - fontY) * this.scale; }

  // Mouse / pen position on the page -> font units.
  eventToFont(event) {
    const rect = this.canvas.getBoundingClientRect();
    const unitsPerCssPixel = VIEW_SIZE / rect.width;
    const x = (event.clientX - rect.left) * unitsPerCssPixel;
    const y = VIEW_TOP - (event.clientY - rect.top) * unitsPerCssPixel;
    return { x, y };
  }

  setChar(char) {
    this.char = char;
    this.draw();
  }

  setStrokes(strokes) {
    this.strokes = strokes;
    this.draw();
  }

  // ---------- Input ----------

  setupPointerEvents() {
    const canvas = this.canvas;
    canvas.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
    canvas.addEventListener('pointermove', (e) => this.handlePointerMove(e));
    canvas.addEventListener('pointerup', (e) => this.handlePointerUp(e));
    canvas.addEventListener('pointercancel', (e) => this.handlePointerUp(e));
    // Stop the iPad long-press menu / text selection from popping up.
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  handlePointerDown(event) {
    if (event.pointerType === 'pen') this.penSeen = true;

    // Palm rejection: ignore fingers once a pen has been used.
    if (event.pointerType === 'touch' && this.penSeen) return;
    // Only one stroke at a time (ignore a second finger, right mouse button, ...).
    if (this.activePointerId !== null) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    event.preventDefault();
    this.activePointerId = event.pointerId;
    // Keep receiving events even if the pointer leaves the canvas mid-stroke.
    try {
      this.canvas.setPointerCapture(event.pointerId);
    } catch (err) {
      // Can fail for pointers the browser no longer tracks; drawing still works.
    }

    const usePressure = this.pressureEnabled && event.pointerType === 'pen';
    this.liveStroke = {
      size: this.brushSize,
      usePressure: usePressure,
      points: [],
    };
    this.addPoint(event);
    if (this.onInputType) this.onInputType(event.pointerType);
    this.queueRedraw();
  }

  handlePointerMove(event) {
    if (event.pointerId !== this.activePointerId || !this.liveStroke) return;
    event.preventDefault();

    // Browsers group fast movements into one event; getCoalescedEvents() gives us
    // all the in-between points too, so quick strokes stay smooth.
    const events = event.getCoalescedEvents ? event.getCoalescedEvents() : [];
    if (events.length > 0) {
      for (const e of events) this.addPoint(e);
    } else {
      this.addPoint(event);
    }
    this.queueRedraw();
  }

  handlePointerUp(event) {
    if (event.pointerId !== this.activePointerId) return;
    this.activePointerId = null;

    const stroke = this.liveStroke;
    this.liveStroke = null;
    if (stroke && stroke.points.length > 0 && this.onStrokeEnd) {
      this.onStrokeEnd(stroke);  // main.js saves it, which redraws the canvas
    } else {
      this.draw();
    }
  }

  addPoint(event) {
    const { x, y } = this.eventToFont(event);
    let pressure = CONSTANT_PRESSURE;
    if (this.liveStroke.usePressure && event.pressure > 0) {
      pressure = event.pressure;
    }
    // Round to 0.1 unit to keep saved files small; far finer than anyone can see.
    this.liveStroke.points.push([
      Math.round(x * 10) / 10,
      Math.round(y * 10) / 10,
      Math.round(pressure * 1000) / 1000,
    ]);
  }

  // Redraw at most once per screen frame, no matter how many points arrive.
  queueRedraw() {
    if (this.redrawQueued) return;
    this.redrawQueued = true;
    requestAnimationFrame(() => {
      this.redrawQueued = false;
      this.draw();
    });
  }

  // ---------- Drawing ----------

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.showGhost) this.drawGhost();
    if (this.showGuides) this.drawGuides();

    ctx.fillStyle = INK;
    for (const stroke of this.strokes) {
      fillOutline(ctx, strokeOutline(stroke), this.scale, VIEW_TOP);
    }
    if (this.liveStroke) {
      fillOutline(ctx, strokeOutline(this.liveStroke, false), this.scale, VIEW_TOP);
    }
  }

  drawGuides() {
    const guides = [
      { name: 'ascender',   y: ASCENDER,   color: MUTED, dash: [6, 6] },
      { name: 'cap height', y: CAP_HEIGHT, color: MUTED, dash: [6, 6] },
      { name: 'x-height',   y: X_HEIGHT,   color: ROSE,  dash: [3, 4] },
      { name: 'baseline',   y: BASELINE,   color: INK,   dash: [] },
      { name: 'descender',  y: DESCENDER,  color: MUTED, dash: [6, 6] },
    ];

    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.font = `${11 * dpr}px "Space Mono", monospace`;
    ctx.textBaseline = 'bottom';

    for (const guide of guides) {
      // +0.5 keeps 1px lines crisp instead of blurry across two pixels.
      const y = Math.round(this.toCanvasY(guide.y)) + 0.5;
      ctx.strokeStyle = guide.color;
      ctx.lineWidth = guide.name === 'baseline' ? 2 * dpr : 1 * dpr;
      ctx.setLineDash(guide.dash.map((d) => d * dpr));
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();

      ctx.fillStyle = guide.color;
      ctx.fillText(guide.name, 8 * dpr, y - 3 * dpr);
    }
    ctx.restore();
  }

  // Draw the current character very faintly in the default sans-serif font,
  // sized so a capital letter reaches exactly the cap-height line.
  drawGhost() {
    if (!this.char) return;
    const ctx = this.ctx;
    ctx.save();

    // Measure how tall 'H' is at 100px, then scale the font size to fit CAP_HEIGHT.
    ctx.font = '100px sans-serif';
    const hHeightAt100 = ctx.measureText('H').actualBoundingBoxAscent || 72;
    const capHeightPx = CAP_HEIGHT * this.scale;
    const fontPx = (capHeightPx / hHeightAt100) * 100;

    ctx.font = `${fontPx}px sans-serif`;
    ctx.fillStyle = 'rgba(26, 26, 26, 0.10)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(this.char, this.canvas.width / 2, this.toCanvasY(BASELINE));
    ctx.restore();
  }
}

// Fill one outline polygon (font units) onto a 2D context.
function fillOutline(ctx, outline, scale, viewTop) {
  if (outline.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(outline[0][0] * scale, (viewTop - outline[0][1]) * scale);
  for (let i = 1; i < outline.length; i++) {
    ctx.lineTo(outline[i][0] * scale, (viewTop - outline[i][1]) * scale);
  }
  ctx.closePath();
  ctx.fill();
}

// Draw a glyph's strokes into a small canvas (used for the grid thumbnails).
export function drawThumbnail(thumbCanvas, strokes) {
  const dpr = window.devicePixelRatio || 1;
  const cssSize = thumbCanvas.clientWidth || 48;
  thumbCanvas.width = Math.round(cssSize * dpr);
  thumbCanvas.height = Math.round(cssSize * dpr);

  const ctx = thumbCanvas.getContext('2d');
  ctx.clearRect(0, 0, thumbCanvas.width, thumbCanvas.height);
  ctx.fillStyle = INK;
  const scale = thumbCanvas.width / VIEW_SIZE;
  for (const stroke of strokes) {
    fillOutline(ctx, strokeOutline(stroke), scale, VIEW_TOP);
  }
}
