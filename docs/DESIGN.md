# CampusOne design system

CampusOne pairs a neutral OKLCH grouped canvas with cobalt (`--cobalt` / `--on-cobalt`) and shared `--shadow-card` depth for important actions, selection, progress visualizations, and the unified Today class card. Use the CampusOne gate mark in the desktop sidebar (`220px`), preserve editorial serif page titles (`PageHeader`) on mobile and desktop, and keep `AM` profile appearance access on mobile Today and the desktop sidebar / header actions.

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

- **Typography**: Native Apple UI sans stack with locally bundled Inter Variable (`--font-sans`) and Georgia / editorial serif (`--font-serif`) applied selectively to page titles (`.page-title`), the Today countdown preposition, the Marks graded-subjects headline, featured print titles and event posters. Numbers always stay in tabular sans. Use tabular numerals (`.num`) across countdowns, attendance ratios, marks, fee amounts, and schedule times. Avoid viewport-proportional headline scaling that collapses at enlarged root font sizes (`200%`) and ensure wrapping uses word boundaries rather than mid-word breaks.
- **Responsive grids & forms**: Multi-column cards use `minmax(0, 1fr)` with `box-sizing: border-box` and inset selection rings (`box-shadow: inset 0 0 0 1.5px`) so mobile (`320px`–`390px`) gutters remain symmetrical without edge clipping. Editable `<input>` controls keep a `1rem` (`16px` default) minimum font size to prevent iOS Safari focus zoom.
- **Navigation chrome**: Desktop keeps a `220px` persistent sidebar with shared academic sub-tabs (`Attendance` / `Marks`). Mobile (`<= 860px`) renders a floating translucent dock (`5` equal grid columns, `68.8px` cell width & `46px` height / `18px` capsule radius at `390×844`, `12px` single-line labels) over a subtle pointer-events-none gradient scrim, adapting automatically via canvas text measurement into a single-row current-route pill + accessible `Menu` `<Dialog>` sheet at narrow widths (`320px`, `360px`) or `200%` root text enlargement.
- **Accessible dialogs**: Shared `<Dialog>` modals focus the initial heading, close on `Escape`, lock background scroll, respect safe-area insets, and restore focus to the triggering element on dismissal. Motion respects `prefers-reduced-motion: reduce`.

## Composition across six screens

| Screen | Composition |
| --- | --- |
| Today | Unified porcelain next-class hero (`in 50 min`) with interactive proportional class strip opening inline `Schedule preview` rows (stacking chronologically with full class labels at `320px` and `200%` text zoom), expandable `AttendanceInsight` disclosure, quiet Attendance (`80.2%`) + recorded Sem 4 SGPA (`8.91`) links, one grouped quick-action bar (`Day off?` -> `?focus=day-off`, with contextual cobalt emphasis on due fee), concise `Also today` reminders, and compact event previews. |
| Attendance | Answer-first recovery planner with `Now` (`18 of 26`) / `End of term` (`26 of 34`) counts, interactive numbered attend/skip class register (`>= 48px` cells with check/cross icons and sustained `75%` finish flag), full-width trajectory chart, overall dot-plot field, native `<Dialog>` target stepper (`75%`–`100%`), mobile `Can I take a day off?` shortcut, and future-only Day-off checker (`Sat 28`..`Sun 06`). |
| Marks | Sem 5 primary (`"Complete marks for 2 of 4 subjects"` with segment meter) vs `Sem 4 recorded 8.91`, grouped subject ledger (`In progress` badge), 0-credit `CS399` audit separation, seven single-row target grade chips (`O`–`P`, `4+3` zoom reflow), `ExamScale` banded ruler, synced `What-if` slider (`Try 80`), and desktop sticky panel / mobile `<Dialog>` sheet. |
| Timetable | Proportional vertical clock timeline (`08:00`–`18:00`) with `9:10` red time chip, subject-tinted blocks (`.tint-bg-past`), Day/Week switcher (`No classes` Sunday column), narrow/zoom agenda fallback, and `<Dialog>` Class Sheet. |
| Fees | Perforated dark-navy `Financial Pass` with light numeral (`₹5,250`), raised currency sign, quiet ring texture, explicit `Mon, 30 Nov, 2026 · 3 days remaining` deadline, itemized ledger, `RCPT-*` rows (`View latest receipt`), and simulated `<Dialog>` checkout (`Demo controls`, `"Demo payment · No money will be transferred."`, reduced-motion-safe completion check + receipt stub). |
| Events | Searchable, category-filtered showcase with compact side-by-side mobile featured poster + serif headline so `Coming up` reaches the first fold, six original posters (`SYS / 01`–`ZIN / 06`), bookmarking, and persistent demo registrations. |

[Product](PRODUCT.md) defines acceptance. [Architecture](ARCHITECTURE.md) defines calculations and route context.
