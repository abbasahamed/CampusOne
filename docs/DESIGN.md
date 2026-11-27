# CampusOne design system

Porcelain & Cobalt pairs a neutral grouped canvas with cobalt for important actions, selection, progress and Today’s class ticket. Use the CampusOne gate mark in the desktop sidebar. Keep the mobile header clear for the page title and place the student avatar on Today.

## Appearance

Use semantic values from `src/styles/tokens.css`. Appearance follows the saved System, Light or Dark preference. Translucency belongs to the dock, which uses a 93% surface, restrained blur, an inset highlight and an opaque fallback for unsupported browsers or reduced transparency.

| Role | Light | Dark |
| --- | --- | --- |
| Canvas | `#F2F2F7` | `#000000` |
| Grouped / elevated surface | `#FFFFFF` | `#1C1C1E` / `#2C2C2E` |
| Neutral control fill | `#EEEEF3` | `#2C2C2E` |
| Primary / secondary text | `#111111` / `#616169` | `#FFFFFF` / `#AEAEB2` |
| Separator | `#E5E5EA` | `#38383A` |
| Interactive accent | `#244CE5` | `#829BFF` |
| Success / warning / error text | `#267345` / `#926018` / `#B4232D` | `#30D158` / `#FF9F0A` / `#FF6961` |

Use brand cobalt `#244CE5` for the gate and light ticket (with subtle tonal cobalt gradient and top inset highlight). Use `#172D80` for the dark ticket with white lettering. Checked contrasts include white on the two ticket fills (`6.05:1` and `10.68:1` live gradient-adjusted; `6.48:1` and `12.18:1` base solids), primary/secondary ink (`16.92:1` / `6.14:1` light, `21:1` / `7.69:1` dark), status ink on surface (`>= 5.37:1` light, `>= 6.03:1` dark), and neutral filled inputs (`--color-surface-secondary` with `--color-divider` boundary, `16.33:1` / `13.94:1` text contrast). Essential outlines are independent of decorative dividers. [WCAG 2.2](https://www.w3.org/TR/WCAG22/)

## Type, geometry and feedback

- Use native Apple system aliases, locally bundled Inter Variable and a system fallback. Use 34 px bold page titles, 20–22 px semibold section headings, 16–17 px row text, and 13–14 px supporting text. Use 56–64 px semibold tabular figures for key metrics where there is room, and scale them down in compact cells. Keep body text regular and tracking neutral outside display type.
- Use open sections or a single 20 px grouped surface with inset separators. Use 12 px fields and inner elements (`>= 12 px` single-line dock labels), capsules for primary buttons and the dock, and 24 px sheet corners. Keep boundaries for neutral filled inputs and controls whose shape needs a clear affordance.
- Give each decision one prominent action. Use neutral-filled secondary buttons, plain accent links and row chevrons for navigation. Use a tint and a checkmark for selection, and pair urgent wording with color or an icon. Repeated ordinary states belong in the row text.
- On mobile, the five-link dock clears the safe area and page content; when narrow widths or enlarged text (`200%`) prevent single-line dock labels without clipping, mobile adapts into a current-route capsule and accessible `<Dialog>` navigation sheet. Desktop keeps the five-link sidebar. Both academic routes share one Attendance / Marks control under Academics. The Today avatar and desktop profile row open the same appearance sheet.
- Shared dialogs use native modal behavior, an initial heading focus, Escape, trigger restoration, background scroll lock, an internally scrolling body and safe-area padding. Use short entry and confirmation motion with a static reduced-motion state. Attendance’s ring reveals once on entry.

## Composition and copy rules

Keep related rows in one group so the eye follows a single list. Reserve a strong fill for a decision or selection. Remove decoration that competes with urgent information, including colored edge bars, repeated badges and arrows on ordinary links. Lead with the figure or next step and keep the language students use. Preserve deadlines, the policy assumptions that affect calculations, and simulation disclosures.

| Screen | Composition |
| --- | --- |
| Today | Make the linked class ticket’s countdown the main figure with subtle tonal depth. Pair compact attendance ring + recorded SGPA summaries with a separate action group; omit demo labels from the dateline. Put risk and feasibility in the action text. |
| Attendance | Pair the hero ring and inline threshold tick with a `<Dialog>` threshold picker sheet and separate subject-risk summary. Use mini rings and selection checks in a grouped subject list. Keep recorded and best-possible or projected results labeled. |
| Marks | Lead with the selected semester’s result or subjects graded. Use expandable subject rows with rotating Lucide chevrons, right-aligned marks, `"Not taken yet"` pending state, sticky side-by-side planner on desktop and `<Dialog>` bottom sheet on mobile (`< 960px`) with scrollable `>= 48px` grade chips. |
| Timetable | Use the clock rail and duration blocks where there is room. Keep a flowing agenda for narrow, short or overlapping sessions. Mark campus time on the current date and cancellations in text. |
| Fees | Lead with the balance and one Pay action. Keep grouped invoice/receipt lists with sheets on mobile (`< 960px`) and a master-detail invoice workspace with itemized detail panel on desktop (`>= 960px`). Put the simulation notice before confirmation and outcome toggles under Demo controls. |
| Events | Use an original SVG + typographic editorial print for the featured event, a `3:4` `Upcoming prints` gallery rail/grid, and coordinated thumbnails in open, dated rows with distinct artwork (`SYS / 01`–`ZIN / 06`). Retain real event metadata as text and `>= 44×44px` filter controls. |

[Product](PRODUCT.md) defines acceptance. [Architecture](ARCHITECTURE.md) defines calculations and route context.
