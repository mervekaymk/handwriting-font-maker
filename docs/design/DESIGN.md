---
name: Pastel Bureau OS
colors:
  surface: '#fbf9f6'
  surface-dim: '#dbdad7'
  surface-bright: '#fbf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f0'
  surface-container: '#efeeeb'
  surface-container-high: '#eae8e5'
  surface-container-highest: '#e4e2df'
  on-surface: '#1b1c1a'
  on-surface-variant: '#514344'
  inverse-surface: '#30312f'
  inverse-on-surface: '#f2f0ed'
  outline: '#837374'
  outline-variant: '#d6c2c3'
  surface-tint: '#844f56'
  primary: '#844f56'
  on-primary: '#ffffff'
  primary-container: '#d8989f'
  on-primary-container: '#5e3036'
  inverse-primary: '#f9b5bc'
  secondary: '#4d5f7c'
  on-secondary: '#ffffff'
  secondary-container: '#c9dbfd'
  on-secondary-container: '#4e607d'
  tertiary: '#7c5357'
  on-tertiary: '#ffffff'
  tertiary-container: '#ce9ca0'
  on-tertiary-container: '#583337'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9dc'
  primary-fixed-dim: '#f9b5bc'
  on-primary-fixed: '#350e15'
  on-primary-fixed-variant: '#69383f'
  secondary-fixed: '#d5e3ff'
  secondary-fixed-dim: '#b5c7e9'
  on-secondary-fixed: '#071c36'
  on-secondary-fixed-variant: '#364764'
  tertiary-fixed: '#ffdadc'
  tertiary-fixed-dim: '#eeb9bd'
  on-tertiary-fixed: '#301216'
  on-tertiary-fixed-variant: '#623c40'
  background: '#fbf9f6'
  on-background: '#1b1c1a'
  surface-variant: '#e4e2df'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 30px
    letterSpacing: 0em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0em
  title-md:
    fontFamily: Space Mono
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 22px
    letterSpacing: 0.02em
  title-sm:
    fontFamily: Space Mono
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.02em
  body-lg:
    fontFamily: Space Mono
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: 0em
  body-md:
    fontFamily: Space Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Space Mono
    fontSize: 10px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0.05em
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system synthesizes late-1980s/early-1990s desktop operating systems (Classic Macintosh, early Windows) with tactile Japanese stationery and epistolary ephemera. It targets creative professionals, journalers, digital scrapbookers, and lifestyle software users who find contemporary flat SaaS interfaces sterile and uninspiring.

The interface evokes cozy nostalgia, meticulous craftsmanship, and deliberate analog tactility. The aesthetic combines:
- **Vintage Paper & Ink:** Warm parchment bases with sharp, unfeathered ink lines.
- **Early GUI Conventions:** Hard drop-shadow offsets, title bars with horizontal pinstripes, pixel-art ornamentations, and faux-physical desk artifacts.
- **Craft Accents:** Subtle cross-stitch divider bands, dotted stitch motifs, and soft dusty pastel highlights that counter rigid digital geometry.
- **Tactile Weight:** Every interactive surface mimics mechanical desktop components—stamping, pressing, stacking, and indexing.

## Colors

The palette establishes an analog stationery substrate layered with technical window framing and muted decorative washes:

- **Canvas & Paper (Neutral):** `#FAF8F5` serves as the primary window background and paper desktop canvas. High-surface paper tiers use `#FFFFFF` for input fields, index cards, and active document sheets. Recessed panels and disabled gutters use mid-cream `#F2EEE9`.
- **Ink & Structure (Ink Black):** `#1A1A1A` forms all structural 1px borders, hard offset shadows, high-contrast typography, and pixel iconography. Muted ink `#787878` handles secondary metadata and rules; `#D8D4CF` handles subtle stationery grids and interior divider rules.
- **Pressed Mauve & Dusty Rose (Primary & Tertiary):** Primary buttons, active window titles, and focus highlights utilize `#D8989F` (deep vintage mauve) with `#E8B4B8` (soft dusty rose) for gentle tint washes, hover fills, and decorative stamp backings.
- **Periwinkle Blue (Secondary):** `#9CAECF` acts as an auxiliary signal—used for informational callouts, link underlines, secondary file tags, and desk-accessory badge fills.
- **Semantic Accents:** Success states adopt a muted sage `#9EB89F`; warning states use soft butterscotch `#E5C388`; error states use faded brick `#D97E7E`. All maintain low saturation to respect the antique paper quality.

## Typography

The typographic hierarchy establishes tension between the typewriter/terminal precision of `Space Mono` and the modern geometric charm of `Space Grotesk`.

- **Headings & Window Banners:** All `Space Grotesk` headings intentionally utilize sentence case or lowercase treatments (`system settings`, `daily ledger`, `inbox archive`) to preserve an approachable, quiet stationery identity while keeping letterforms crisp and compact.
- **Data, Code, & Body Text:** Content reading and utilitarian copy strictly utilize `Space Mono`. Line-heights remain generous (`1.5` to `1.6`) to allow simulated paper rule lines or stitch borders to sit rhythmically beneath text lines.
- **Labels, Stamps, and System Badges:** Monospace micro-copy is styled with slight tracking (`0.04em` to `0.05em`) and uppercase rendering to evoke rubber stamps, docket tags, and computer terminal labels.

## Layout & Spacing

The layout is structured around an adaptive desktop canvas that mimics a desk work surface containing floating or docked document windows.

- **Grid Framework:** A 12-column fluid grid system on desktop (`>1024px`) with `1.5rem` gutters and minimum `2.5rem` outer margins. On tablet (`768px - 1023px`), the canvas drops to 8 columns with `1rem` gutters. On mobile viewports (`<768px`), windows shed floating coordinates and serialize into full-width stacked sheets with `1rem` side margins.
- **Stationery Vertical Rhythm:** Spacing increments adhere strictly to a 4px/8px modular base. Elements sit on defined horizontal baselines mimicking ruled ledger pads.
- **Touch & Accessibility Target Compliance:** All interactive touch points (buttons, segmented toggles, menu items, window controls) enforce a strict minimum bounding box of `44px x 44px` across both touch devices (iPad/tablets) and pointer desktop screens, achieved via comfortable internal padding or transparent hit-target extensions.

## Elevation & Depth

Visual depth avoids soft blurred blurs or realistic lighting gradients, relying on physical flat relief inspired by early GUIs and layered die-cut cardstock:

- **Solid Offset Hard Shadows:** Depth is produced exclusively via crisp `1px` solid borders (`#1A1A1A`) accompanied by unblurred solid offset shadows:
  - **Level 0 (Flat / Inset):** `border: 1px solid #1A1A1A; box-shadow: none;` (used for inactive canvases, embedded ledger fields, and pressed states).
  - **Level 1 (Cards, Chips, Buttons):** `border: 1px solid #1A1A1A; box-shadow: 2px 2px 0px #1A1A1A;`
  - **Level 2 (Active Windows, Floating Tool Palettes):** `border: 1px solid #1A1A1A; box-shadow: 3px 3px 0px #1A1A1A;`
  - **Level 3 (Modal Alerts, Context Menus, Stamp Popovers):** `border: 1px solid #1A1A1A; box-shadow: 4px 4px 0px #1A1A1A;`
- **Mechanical Depress State:** When buttons or interactive tabs are activated (`:active`), their offset shadow collapses to `0px 0px 0px #1A1A1A` while the element shifts down and right by `2px` (`transform: translate(2px, 2px)`), creating an authentic mechanical click.
- **Cross-Stitch and Perforated Dividers:** Layer transitions frequently incorporate decorative borders: alternating pixel dashes (`border-style: dashed` with `4px` dash-array) or repeating cross-stitch SVG symbols (`+ + + +`) acting as horizontal hairline dividers.

## Shapes

The geometric architecture is uncompromisingly square (`roundedness: 0`), reinforcing the period-accurate 1990s system GUI and precision-cut paper stationery.

- **Zero Radius Default:** Windows, input frames, system buttons, notifications, and paper panes have sharp 90-degree corners (`border-radius: 0px`).
- **Beveled Corner Exceptions:** Specialty tags, docket tabs, and card corners may feature a `3px` chamfer (diagonal cut) via CSS clip-path to resemble luggage tags, library catalog cards, or folded stationary sheets.
- **Ornamental Pixel Frames:** Corners of dialogs or special floating note cards use miniature `4px x 4px` solid square corner markers (`box-shadow` or pseudo-element dots) referencing desktop marquee selections and cross-stitch samplers.

## Components

### Buttons
- **Primary Button:** `#D8989F` background, `#1A1A1A` 1px border, 2px solid `#1A1A1A` offset shadow. Min-height `44px`, horizontal padding `1rem`. Font: `Space Mono`, bold, lowercase or uppercase tracker. On hover: background shifts to `#E8B4B8`. On active: `transform: translate(2px, 2px)` and shadow collapses to `0px`.
- **Secondary / Window Action Button:** `#FAF8F5` background, `#1A1A1A` 1px border, 2px solid `#1A1A1A` offset shadow. Hover shifts to `#F2EEE9`.
- **Icon / Desk Buttons:** 44px x 44px square, centered monochrome pixel icon with ink outline.

### Windows & Containers (The "OS Bureau Window")
- **Window Title Bar:** 32px height container with horizontal pinstripe motif (repeating 1px alternating lines of `#FAF8F5` and `#D8D4CF`). Center label sits on an opaque paper box. Top left features a square "close" icon (`8px x 8px` boxed cross); top right features miniature minimize/fold icons.
- **Window Body:** Solid `#FAF8F5` or pure white `#FFFFFF` interior bordered by 1px `#1A1A1A` outline with Level 2 offset shadow (`3px 3px 0px #1A1A1A`).

### Input Fields & Controls
- **Text Inputs:** Recessed aesthetic. `#FFFFFF` background, 1px `#1A1A1A` border, `1px 1px 0px #D8D4CF` inset shadow. Min-height `44px`, padding `0.75rem`. Caret is a solid blinking black square block (`8px x 14px`). Placeholder in `#787878`.
- **Checkboxes:** 18px x 18px square (wrapped inside a 44px touch container). Unchecked: `#FFFFFF` with 1px `#1A1A1A` border. Checked: displays an "X" or cross-stitch mark (`+`) in `#1A1A1A` over a soft periwinkle `#9CAECF` background.
- **Radio Buttons:** Retains sharp square geometry—a 18px outer square containing an 8px solid square dot when active.

### Chips & Tags
- **Stationery Index Tabs:** Min-height `32px` (extended to 44px hit-box on touch). Fixed 1px `#1A1A1A` border with flat pastel fills (`#E8B4B8`, `#9CAECF`, `#F2EEE9`). Text is formatted in `label-sm` monospace. Optional left-hand hole-punch circle perforation.

### Cards & Index Cards
- **Note Sheet Cards:** Background is white or light cream `#FAF8F5`, enclosed in a 1px `#1A1A1A` border with 2px offset shadow. Features a subtle horizontal faux-ruled background grid (`linear-gradient` spaced at 24px using `#F2EEE9`).

### Stationery Accents & Doodle Micro-Interactions
- **Hand-Drawn & Pixel Doodles:** Empty states, margins, and tooltips are accented with single-stroke pen doodles (curly brackets, corner tape strips, starburst asterisks, paperclip glyphs) rendered in monochrome `#1A1A1A` or muted `#787878`.
- **Selection Marquee:** Text and object selection applies a dusty rose background `#E8B4B8` with dark ink text `#1A1A1A`.