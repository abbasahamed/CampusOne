# Porcelain & Cobalt design blueprint

Use Inter Variable, editorial headlines and restrained cobalt accents. Lead each page with the information that drives the student's next decision. Build the visual identity from type, structure and a recurring vertical cobalt rule for the current item. Use flat surfaces and hairline dividers for supporting information. Reserve elevation for floating navigation and dialogs. Skip decorative gradients, glass and filler labels.

## Tokens

Define the locked colors once as CSS variables. Map Tailwind utilities to semantic roles and alias the roles for component states.

| Role | Light | Dark |
| --- | --- | --- |
| Canvas | `#F8F9FC` | `#101218` |
| Surface | `#FFFFFF` | `#1A1D26` |
| Secondary surface | `#EAEFFB` | `#242936` |
| Accent and focus | `#244CE5` | `#829BFF` |
| Primary text | `#151923` | `#F4F5FA` |
| Secondary text | `#596579` | `#A0A9BB` |
| Divider | `#E1E5EE` | `#2D3240` |
| Success | `#23764E` | `#72D6A1` |
| Warning | `#A35C12` | `#F1BE70` |
| Error | `#C43D45` | `#FF8991` |
| Text on accent | `#FFFFFF` | `#101218` |
| Essential control outline | `#77849C` | `#77849C` |

Computed token contrasts use WCAG sRGB relative luminance. On the three base surfaces, primary, secondary and accent text are at least 5.12:1 in light and 5.59:1 in dark. Text on accent is 6.48:1 light and 7.20:1 dark. Light warning and error are 5.13:1 and 5.12:1 on white and approximately 4.45:1 on the light secondary surface. Place both on white or pair a colored icon with primary text on the tinted surface. Light success is at least 4.83:1 across base surfaces. Dark status text is at least 6.39:1. The essential outline is at least 3.28:1 light and 3.85:1 dark against base surfaces. Use the divider for decoration. Audit rendered combinations, including hover, selected, focus, overlays, and dark theme. [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)

| Type role | Size / line height | Weight |
| --- | --- | --- |
| Display metric | 48–56 / 52–60 px | 800 |
| Page heading | 32–36 / 36–40 px | 800 |
| Section heading | 22–24 / 28–32 px | 700 |
| Component heading | 16–18 / 22–24 px | 600 |
| Body | 15–16 / 22–24 px | 400–500 |
| Supporting | 13–14 / 18–20 px | 400–500 |

Use rem equivalents, mild negative tracking for page headings and metrics, and tabular numerals for times, counts, money and grades. Use spacing steps of 4, 8, 12, 16, 24, 32, 40 and 48 px. Use 12 px controls, 16 px panels and 24 px prominent surfaces or the mobile nav.

## Shell and components

- **Shell.** Under 960 px, a single reading column and a five-destination floating bottom nav with icon and label. Use 16 px page gutters, growing to 24 px from 600 px. The nav has flexible item widths, centered max width around 540 px, and safe-area inset. Reserve its full height plus 24 px at the end of content and set scroll padding so focused controls clear it. From 960 px, use a 224 px sidebar and a centered main area up to 1120 px wide with 32 px gutters. Secondary columns collapse whenever content needs the width. At 320 CSS px and 200% text size, labels wrap, panels grow, and reading order stays intact.
- **Navigation.** Use Lucide at 20–24 px with consistent stroke; hide decorative icons from assistive tech. Current links use text, weight or marker, and `aria-current="page"` on the exact route. Give Academics a parent selection treatment on both child pages. Attendance and Marks use styled links with their own current state. Keep the System / Light / Dark setting discoverable in the header or sidebar with a labeled native control.
- **Controls and rows.** Use semantic links for navigation and buttons for actions. Aim for at least 44 × 44 CSS px for standalone targets. Use accent fill and theme-specific text for the main CTA, outlined secondary controls and underlined inline links. Keep focus visible with a 2 px accent outline and surface gap. Rows show the entity, supporting context and a single obvious action. Status pairs a short text label with an optional icon. Bars always have visible numbers and labels.
- **Forms and feedback.** Put units and constraints next to visible labels. Link field errors programmatically and keep valid values on error. On explicit calculation or simulation, announce the result or error once. Use empty states with a next step when one exists. Dialogs have a title, close button, managed initial focus, contained Tab order, Escape dismissal and focus restoration. Use a bottom sheet presentation on narrow screens with the same dialog semantics, a scrollable body and reachable actions.
- **Motion.** Use 120–180 ms opacity or color transitions for feedback. Suppress nonessential transitions and movement with reduced motion. Use main and nav landmarks, a skip link and predictable heading focus on route changes. [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)

## Screen compositions

| Screen | Reading order and layout | Key states |
| --- | --- | --- |
| Today | Dated greeting → leading next-class panel with time, room and one schedule action → ruled action queue → compact attendance and marks summary → upcoming event. On desktop, align the class panel and queue in the main column with summaries and event in a narrow side column. The queue owns fee urgency. | Today's last class has ended, no pending actions, event list empty. |
| Attendance | Large overall percentage with attended/conducted count → ranked subject ledger with target markers and textual states → planner. On desktop place the planner beside the ledger. On mobile put it directly after the selected subject and link to it from that row. | Show “Below target” and the attendance needed in classes. Planner modes are Recover attendance and Safe absences. Show recorded and projected rates side by side with text that names the scenario. |
| Marks & Academics | Heading and semester selector → semester result strip → assessment ledger grouped by subject → Grade Planner beside the selected subject on desktop and below it on mobile. Assessment rows put earned/max and weight near the name. | Clearly label recorded marks, pending marks and projected grade. The required exam score is the planner's headline. Explain missing inputs or unreachable targets beside it. |
| Timetable | Day/Week controls and selected date → chronological agenda, with a left time rail and rooms alongside course names. Desktop Week uses weekday columns when they fit. At narrow widths Week is a list grouped by date, with date jump controls. | Mark Next class with a cobalt rule and text. Keep canceled entries in sequence with a text label and breaks with their time range. Show a useful empty-day message. |
| Fees & Payments | One receipt-like balance panel with due date and review CTA → itemized ledger → history. On desktop align the balance beside the ledger and let history span the main area. | Outstanding and paid states, review with simulation label, failure and retry, success with receipt action, receipt dialog accessible from history. |
| Campus Events | Editorial featured event with title, date and venue → search and category controls → list of upcoming events grouped by date. Use date blocks and short summaries. | Filtered and saved views, clear filters and no-results state, event detail sheet with save/register actions and persistent demo registration confirmation. |

Follow [Product](PRODUCT.md) for route-level acceptance and [Architecture](ARCHITECTURE.md) for what each state means.
