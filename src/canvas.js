// The big drawing canvas: guide lines, the faint reference letter ("ghost"),
// and (from step 2 on) the user's strokes.
//
// Coordinates: the user's drawing is stored in FONT UNITS, not pixels, so it
// does not depend on screen size. y = 0 is the baseline and y grows upward
// (like in fonts). The canvas shows a square window onto that space.

import { ASCENDER, CAP_HEIGHT, X_HEIGHT, BASELINE, DESCENDER } from './config.js';

// The square area of font space the canvas shows.
const VIEW_SIZE = 1200;            // width and height, in font units
const VIEW_TOP = ASCENDER + 100;   // font y at the top edge of the canvas

const INK = '#1a1a1a';
const MUTED = '#787878';
const ROSE = '#c27c84';

export class GlyphCanvas {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.char = '';
    this.showGuides = true;
    this.showGhost = true;

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

  setChar(char) {
    this.char = char;
    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.showGhost) this.drawGhost();
    if (this.showGuides) this.drawGuides();
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
