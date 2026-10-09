# Handwriting Font Maker — Requirements

A small, free web tool where anyone can draw their own handwriting, letter by letter, and download it as a real font file (`.otf`) that works in Canva, on a computer, and in game engines like Unity.

**Owner:** Merve (portfolio / weekly mini project, pushed to GitHub)
**Deadline for a first working version:** Sunday, 11 Oct 2026
**UI language:** English only (Turkish characters must still be supported in the font itself)

---

## 1. Goals

- Draw each character in a grid cell with mouse, finger or Apple Pencil.
- Download a working `.otf` font containing everything drawn.
- Runs fully in the browser. No backend, no accounts, no uploads.
- Hosted free on GitHub Pages. Works on desktop browsers and on iPad Safari.

## 2. Tech constraints

- Plain HTML + CSS + JavaScript (ES modules). **No build step** if possible, so GitHub Pages can serve the repo as-is. (A small bundler setup is acceptable only if there is no reasonable alternative.)
- Font generation: `opentype.js` (builds the font and exports `.otf`).
- Drawing-to-outline: trace the drawn strokes into filled vector outlines with a potrace-style library (JS or WASM). Alternative: build outlines directly from stroke geometry. Pick whichever is more reliable; document the choice in the README.
- Pin library versions. Load from a CDN or vendor the files into `/vendor`.
- Persistence: IndexedDB (localStorage as a fallback). Wrap every storage call in try/catch; the app must still work if storage is blocked.
- Code should be readable and commented. The owner mainly works in C++, Python and C# and uses AI help for JavaScript, so prefer simple, explicit code over clever abstractions.

## 3. Features (MVP, must work by Sunday)

### 3.1 Drawing
- A glyph grid shows every required character as a cell. Clicking a cell opens it in a large drawing canvas.
- The drawing canvas shows guide lines: **baseline, x-height, cap-height, ascender/descender**. Guides are not part of the font.
- Input via **Pointer Events** (one code path for mouse, touch and pen).
  - `pointerType === 'pen'`: line width follows `pressure`.
  - Mouse and touch: constant width.
  - A "Pressure sensitivity" toggle (default on) lets the user force constant width.
- `touch-action: none` on the canvas so the page never scrolls or zooms while drawing on iPad.
- Basic palm rejection: while a pen is active, ignore `touch` pointers on the canvas.
- Brush size slider.
- Per-glyph **Undo** (stroke by stroke), **Clear**, and a mark showing which glyphs are done.
- Strokes are stored as data (points + width), not only as a bitmap, so undo and re-editing work.

### 3.2 Character set (must all be present)
- `A–Z`, `a–z`
- Turkish: `Ç Ğ İ Ö Ş Ü ç ğ ı ö ş ü`
  - `İ` (U+0130, dotted capital I) and `ı` (U+0131, dotless small i) are **separate glyphs** from `I` and `i`.
- Digits `0–9`
- Punctuation and symbols: `. , ; : ! ? ' " - – … ( ) / @ & % + = * # _`
- Space (no drawing needed; user can adjust its width)
- A `.notdef` glyph (simple box) so the font is valid.

Missing glyphs must not break export. Export whatever is drawn, plus space and `.notdef`.

### 3.3 Font metrics
- `unitsPerEm = 1000`, ascender 800, descender −200 (adjustable constants in one place).
- Each glyph's advance width = drawn width + left/right side bearing (default ~40 units each).
- Per-glyph **side bearing / spacing** control (simple left/right nudge or slider). Sensible defaults so a first export already looks usable.

### 3.4 Live preview
- A text box on the page. Whatever the user types is rendered in **the font being built**, updating as glyphs are drawn or changed.
- Implementation hint: build the font in memory with `opentype.js`, load it via the `FontFace` API (or draw with the opentype.js renderer), and refresh on change (debounced).

### 3.5 Export
- **Font name** input. The name goes into the font's family name and the downloaded file name (sanitize unsafe characters).
- **Download `.otf`** button. The file must install on macOS and Windows and be accepted by Canva and Unity (TextMeshPro).
- Optional author name field written to the font's copyright/designer field.
- Warn (don't block) if some required characters are still empty, and list which ones.

### 3.6 Project save / load
- Auto-save to IndexedDB on every change.
- **Export project** → a `.json` file (include a `version` field, font name, metrics, all strokes).
- **Import project** → loads that JSON and restores everything. Reject invalid or newer-version files with a clear message.
- **Reset all** with a confirmation step.

### 3.7 Help and information (on the page)
- Short "How to use" section: draw → check preview → download.
- How to install the font: desktop (double-click the file) and how to upload it to Canva (note: custom font upload in Canva may require a paid plan).
- A one-line privacy note: "Everything stays in your browser. Nothing is uploaded."
- A note that fonts you draw belong to you.

## 4. Non-functional requirements
- Works on current Chrome, Safari (macOS and iPadOS) and Firefox.
- Layout works on iPad portrait/landscape and on desktop. Buttons at least 44px tall for touch.
- Exported glyph outlines must be clean: no tiny stray specks (add a minimum-area filter in tracing), smooth curves, correct winding so fills are not inverted.
- Drawing must feel responsive (no visible lag while drawing; do tracing on stroke end or when leaving the cell, not per point).
- Accessibility basics: labels on controls, keyboard-reachable buttons, sufficient contrast.

## 5. Visual design
- Simple and friendly. A notebook/paper feel is suggested (paper background, hand-drawn-style accents), but the final look is up to Merve. Ask her before adding heavy styling.
- The glyph grid should clearly show done vs. empty cells.

## 6. Repository
- Public GitHub repo, deployed with GitHub Pages.
- Suggested structure:
  ```
  /index.html
  /src/        (js modules: drawing, glyph store, tracing, font build, storage, ui)
  /styles/
  /vendor/     (pinned third-party libs, if vendored)
  /README.md
  /LICENSE     (MIT for the code, unless Merve says otherwise)
  ```
- README must include: what it is, a screenshot or GIF, how to use, how to run locally (a static server), tech used, known limitations.
- Commit in small, meaningful steps.

## 7. Acceptance checklist
- [ ] Draw `a`, `b`, `İ`, `ı`, `ş` with mouse; they appear in the preview text box.
- [ ] On iPad Safari with Apple Pencil: drawing works, the page does not scroll, line width follows pressure.
- [ ] Download `.otf`; install it on a computer; Turkish letters render correctly in another app.
- [ ] Upload the `.otf` to Canva (or any app that accepts custom fonts); it works.
- [ ] Reload the page: drawings are still there.
- [ ] Export project JSON, reset, import it back: identical state.
- [ ] Exporting with missing glyphs shows a warning but still works.

## 8. Stretch goals (only after the MVP works)
- Multiple variants per letter (2–3 drawings), randomly alternating in the preview.
- Kerning pairs or auto-spacing.
- Export `.woff2` and `.ttf` as well.
- Build accented letters from a base letter plus a drawn mark.
- Undo/redo history across glyphs, copy a glyph to another cell.
- Printable template: print a sheet, draw on paper, scan/upload it.
- Dark mode, language toggle.

## 9. Out of scope
- Accounts, cloud sync, any server or database.
- Selling or sharing fonts through the site.
- Support for non-Latin scripts.

## 10. Design decisions (added 9 Oct 2026)
- Visual design comes from Google Stitch (`docs/design/`: `screen.png`, `DESIGN.md`, `code.html`). It is a reference, not something to copy 1:1. Implemented as plain CSS (no Tailwind CDN) using the tokens in `DESIGN.md`.
- Left out of the MVP even though Stitch drew them: `.ttf` / `.woff2` buttons, "Add Unicode", kerning/ligature info.
- **Reference ghost:** each canvas shows the current character faintly in the browser's default sans-serif, scaled so capitals sit on the cap-height line. User traces over it. Toggleable. Never exported.
- **Undo and Redo** per glyph.
- **"Next" button under the canvas** to move on to the next character after finishing one (plus prev/next arrows above).
- Help/install text is low priority; the short version from 3.7 is enough.
- **Outlines (3.1 / 4):** no potrace. Each stroke's outline comes from perfect-freehand (same shape as on screen); all strokes of a glyph are merged with polygon-clipping (union), simplified, tiny specks (< 200 sq. units) dropped, rings oriented (outer CCW, holes CW) and turned into smooth quadratic curves with sharp corners kept. "Font view" toggle on the canvas shows the result.

## 11. Working notes for Claude Code
- Build in this order, committing after each step: (1) page + glyph grid, (2) drawing canvas with guides and pointer input, (3) storage + project JSON, (4) tracing to outlines, (5) in-memory font build + live preview, (6) `.otf` export, (7) help text, README, license, Pages setup.
- If a requirement is unclear or a choice affects how the site looks, ask Merve one short question before building it.
- Keep the app working at every step; do not leave the main branch broken.
