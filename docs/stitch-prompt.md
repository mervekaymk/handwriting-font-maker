# Stitch prompt

## Main prompt (paste first)

```
Design a single-page web app called "Handwriting Font Maker". Users draw their own handwriting letter by letter and download it as a real font file (.otf). It runs fully in the browser, free, no accounts.

Target devices: iPad (landscape and portrait) with Apple Pencil, and desktop browsers. All buttons and touch targets at least 44px tall. UI language: English.

Visual style: cute retro desktop OS, like a late-90s computer mixed with a soft vintage stationery feel.
- Every panel is a retro OS window: thin 1px black outlines, a title bar with a small monospace title and tiny square window buttons (minimize / maximize / close) on the right, flat greyscale scrollbars with small arrow boxes. Name the windows like files: "GLYPHS.EXE", "CANVAS.EXE - A", "PREVIEW.TXT", "EXPORT.EXE", "HELP.TXT".
- A thin menu bar inside windows in light grey uppercase monospace (e.g. FILE  OPTIONS  HELP) and a status bar at the bottom of the page like a file path: "C:\fonts\my_handwriting.otf" on the left and "34 of 98" on the right.
- Typography: a clean monospace / pixel-ish font for all UI text and labels; one big, bold, tightly spaced sans-serif headline for the page title "handwriting font maker" in lowercase.
- Colors: off-white / very light warm grey background, black ink for lines and text, mid greys for inactive UI, and one accent: dusty pastel pink / mauve (for selected cell, primary button, progress). Small touches of periwinkle blue for focus outlines and the selected-cell border.
- Decoration: cross-stitch / pixel embroidery style lace and flower borders in pale pink and light grey along the page edges or window corners, and a few small hand-drawn black line doodles (a sketchy bunny, stars, a question mark) as if drawn with a pen.
- Buttons are flat retro rectangles with a 1px black border and slight offset shadow; pressed state looks inset. Sliders and toggles are simple and pixel-like.
- Overall mood: cozy, cute, a little nostalgic, minimal. Plenty of white space, no gradients, no glassmorphism, no rounded modern cards.

Layout (iPad landscape / desktop):
- Left panel: GLYPH GRID. A scrollable grid of small square cells, one per character. Each cell shows the character label in a small light font. Drawn cells show a small preview of the user's drawing and a "done" mark; empty cells look clearly empty (lighter, dashed border). Group the grid by sections with small headers: "Uppercase", "Lowercase", "Turkish" (Ç Ğ İ Ö Ş Ü ç ğ ı ö ş ü), "Digits", "Punctuation". Show progress at the top, e.g. "34 / 98 drawn".
- Center: DRAWING CANVAS. A large square canvas for the selected character, with the current character shown big in a corner. Horizontal guide lines across the canvas, each labeled at the side: ascender, cap height, x-height, baseline, descender. Baseline is the most prominent line.
- Toolbar next to the canvas: brush size slider, "Pressure sensitivity" toggle, Undo, Clear, Previous / Next character arrows. Below the canvas: "Spacing" control with left and right side bearing sliders.
- Right panel or bottom strip: LIVE PREVIEW. A large text box where the user types text and sees it rendered in their own handwriting font. Placeholder: "The quick brown fox · Çağrı ışığı söndü".
- EXPORT panel: "Font name" text input, optional "Author" input, primary button "Download .otf". A soft warning area listing still-empty characters (warning, not an error).
- Secondary menu / header: "Export project (.json)", "Import project", "Reset all" (destructive, needs a confirmation dialog).
- Footer / help section: short "How to use" in 3 steps (Draw → Check preview → Download), "How to install the font" (desktop: double-click the file; Canva: upload under Brand fonts, may need a paid plan), privacy line "Everything stays in your browser. Nothing is uploaded.", and "Fonts you draw belong to you."

Keep it simple, calm and uncluttered. The drawing canvas is the hero of the page.
```

## Follow-up prompts (one at a time, after the first screen looks right)

```
Now show the same app on iPad portrait. Stack the layout: canvas + toolbar on top, live preview below, glyph grid as a collapsible bottom drawer or horizontal strip.
```

```
Show the "Reset all" confirmation dialog and the export warning state: user clicks "Download .otf" while 12 characters are still empty. Show the list of missing characters and two buttons: "Download anyway" and "Keep drawing".
```

```
Show the empty first-run state: no characters drawn yet, a short friendly hint pointing to the first cell "A".
```
