# CampusOne design system

CampusOne pairs a neutral OKLCH grouped canvas with cobalt (`--cobalt` / `--on-cobalt`) for primary actions, active navigation selection, progress visualizations, and the Today class countdown card. Use the CampusOne gate mark in the desktop sidebar (`220px`), preserve generous top page headers (`PageHeader`) on mobile and desktop, and keep `AM` profile appearance access on mobile Today and the desktop sidebar footer.

## Appearance

Use semantic OKLCH values from [`src/styles/tokens.css`](../src/styles/tokens.css). Appearance follows the saved `System`, `Light`, or `Dark` preference synchronized via `data-theme` and `.dark` (`campusone.theme.v1`). Translucency belongs to the floating dock and top header fade, using a `92%` light / `91%` dark frosted glass surface with `-webkit-backdrop-filter` and opaque fallbacks when transparency is reduced or unsupported.

| Role | Light (`tokens.css`) | Dark (`tokens.css`) |
| --- | --- | --- |
| Canvas (`--background`) | `oklch(0.972 0.004 255)` | `oklch(0.155 0.006 262)` |
| Surface (`--surface`) | `oklch(1 0 0)` | `oklch(0.2 0.007 262)` |
| Neutral control fill (`--surface-2`) | `oklch(0.948 0.005 255)` | `oklch(0.245 0.008 262)` |
| Primary / muted ink | `oklch(0.2 0.018 262)` / `oklch(0.46 0.016 262)` | `oklch(0.965 0.004 255)` / `oklch(0.72 0.012 262)` |
| Hairline separator (`--hairline`) | `oklch(0.905 0.007 255)` | `oklch(0.3 0.009 262)` |
| Cobalt (`--cobalt` / `--on-cobalt`) | `oklch(0.49 0.2 263)` / `oklch(0.99 0 0)` | `oklch(0.68 0.16 263)` / `oklch(0.16 0.02 263)` |
| Status (`--positive` / `--warning` / `--critical`) | `oklch(0.47 0.125 158)` / `oklch(0.53 0.14 62)` / `oklch(0.51 0.2 25)` | `oklch(0.74 0.13 158)` / `oklch(0.8 0.13 72)` / `oklch(0.72 0.16 25)` |
| Glass dock surface (`--glass`) | `oklch(0.99 0.002 255 / 0.92)` | `oklch(0.21 0.007 262 / 0.91)` |

Foreground/background pairs, cobalt actions (`--on-cobalt` on `--cobalt`), Timetable subject-tinted blocks (`.tint-bg` and `.tint-bg-past`), Fee pass (`--on-cobalt` / deep navy card), and event poster surfaces maintain accessible contrast without relying on lowered element opacity to dim past events or empty states. See [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) for contrast criteria.

## Type, geometry and navigation

- **Typography**: Native Apple UI sans stack with locally bundled Inter Variable (`--font-sans`) and Georgia / editorial serif (`--font-serif`) applied selectively to featured print titles and event posters. Use tabular numerals (`.num`) across countdowns, attendance ratios, marks, fee amounts, and schedule times. Avoid viewport-proportional headline scaling that collapses at enlarged root font sizes (`200%`) and ensure wrapping uses word boundaries rather than mid-word breaks.
- **Responsive grids & forms**: Multi-column cards use `minmax(0, 1fr)` with `box-sizing: border-box` and inset selection rings (`box-shadow: inset 0 0 0 1.5px`) so mobile (`320px`–`390px`) gutters remain symmetrical without edge clipping. Editable `<input>` controls keep a `1rem` (`16px` default) minimum font size to prevent iOS Safari focus zoom.
- **Navigation chrome**: Desktop keeps a `220px` persistent sidebar with shared academic sub-tabs (`Attendance` / `Marks`). Mobile (`<= 860px`) renders a floating translucent dock (`5` equal grid columns, `68.8px` cell width & `46px` height / `18px` capsule radius at `390×844`, `12px` single-line labels) over a subtle pointer-events-none gradient scrim, adapting automatically via canvas text measurement into a single-row current-route pill + accessible `Menu` `<Dialog>` sheet at narrow widths (`320px`, `360px`) or `200%` root text enlargement.
- **Accessible dialogs**: Shared `<Dialog>` modals focus the initial heading, close on `Escape`, lock background scroll, respect safe-area insets, and restore focus to the triggering element on dismissal. Motion respects `prefers-reduced-motion: reduce`.

## Composition across six screens

| Screen | Composition |
| --- | --- |
| Today | Split Cobalt hero (`min` countdown card beside right-hand live timeline) with compact responsive stacking below `344px`, grouped Attendance (`89 of 111 classes attended`) + SGPA (`8.91` recorded, `Sem 4` · `Sem 5 in progress`) vitals, concise single-line priority action queue, and upcoming events. |
| Attendance | Overall standing summary + subject dot-plot field (`75% minimum` reference rule, `80.2% overall`, `"0 spare"` / `"2 spare"` / `"Below target"`), native `<Dialog>` threshold stepper/presets (`75%`–`100%`), SVG trajectory (`Sample attendance history`, `"Filled = attend / Outline = skip"`), `Recover / Safe misses / What if?` action strip (`"Get back to 75%"`), and future-only Day-off checker (`Sat 28`..`Sun 06`, marking `'stays-above'`, `'deficit-recoverable'`, and `'unreachable'`). |
| Marks | Sem 5 primary (`"Marks available for 2 of 4 subjects"`) vs recorded Sem 4 (`8.91`), `Previous semester · Recorded 8.91`, 0-credit `CS399` audit separation, `ExamScale` banded distribution strip, synced required-mark slider + numeric estimate (`Try 80` helper), rounding toggle, and desktop sticky panel / mobile `<Dialog>` planner sheet. |
| Timetable | Proportional vertical clock timeline (`08:00`–`18:00`) with subject-tinted cards (`.tint-bg-past` using neutral surface tokens rather than element `opacity`), `09:10 IST` needle, Day/Week switcher (empty Sundays labeled `"No classes"`), narrow/enlarged-text agenda fallback, and `<Dialog>` Class Sheet. |
| Fees | Perforated dark-navy `Financial Pass` leading with net due balance (`₹5,250`), explicit `Payment deadline` (`Mon, 30 Nov, 2026 · 3 days remaining`), itemized fee list, persistent `RCPT-*` rows, and simulated `<Dialog>` checkout (`UPI` / `Net banking` / `Debit card`, `Demo controls`, `"Demo payment · No money will be transferred."`). |
| Events | Searchable, category-filtered showcase (`All`, `Technical`, `Career`, `Academic`, `Cultural`, `Saved`) with horizontal scroll-fade cue, compact featured event spotlight, six original poster artworks (`SYS / 01`–`ZIN / 06`), two-line clamped titles, bookmarking, and persistent demo registrations. |

[Product](PRODUCT.md) defines acceptance. [Architecture](ARCHITECTURE.md) defines calculations and route context.
