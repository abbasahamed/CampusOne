# CampusOne attribution

## Used through Phase 08

| Source | Use |
| --- | --- |
| Project owner, CampusOne master brief | Team and participation details (`NexaCoders`, Pixelcraft 2026), scope, visual direction, stack, dates and ownership |
| OpenAI Codex (`GPT-6.2 Sol`) | Product strategy, interaction design, architecture, planning documentation and base palette contrast calculations (Phases 00–01) |
| OpenAI Codex (`GPT-6.2 Sol`) | Phase 03 Today and shared shell design, implementation, original CampusOne gate mark (`public/campusone.svg`) and Chrome verification |
| Antigravity (`Gemini 4 Hydrogen`) | Phase 02 project foundation: Git/Vite/React/TypeScript/Tailwind setup, Porcelain & Cobalt tokens, theme persistence, responsive shell, reusable primitives, and typed demo fixtures |
| Antigravity (`Gemini 4 Hydrogen`) | Phase 04–05 complete core product: pure attendance & academic calculators with unit tests, all five remaining screens, original SVG attendance ring and geometric event posters, simulated payment & event persistence, and Today/shell design refinements |
| OpenAI Codex (`GPT-6.2 Sol`) | Phase 06 design system and six-screen refinement, shared sheets, six original SVG event illustrations, synthetic event fixtures and verification |
| Antigravity (`Gemini 4 Hydrogen`) | Phase 07 & 07B–08 final design refinement, defect resolution (Marks sheet padding/grid/Clear, Events horizontal filter rail, Attendance overview deduplication & at-threshold distinction, adaptive mobile navigation sheet for `200%` text scaling), Open Graph metadata & original `public/og-image.png` artwork, root `README.md`, and release verification |
| Project owner · Vercel v0 + Claude Opus 5.5 (`project.zip`) | Phase 10 visual exploration reference: OKLCH color system, split Today hero, dot-plot Attendance field & trend visualization, segmented ExamScale bar, perforated Navy fee pass, editorial poster compositions, and screen choreography |
| Antigravity (`Gemini 4 Hydrogen`) | Phase 10 visual migration & product integration onto `feat/v0-design-integration` (adapting v0 visuals onto CampusOne pure calculators, fixtures, persistent LocalStorage state, accessibility contracts, Day-off impact logic + test, and Chrome CDP verification) |
| Independent design audits (Claude & ChatGPT) | Post-Phase-10 visual, hierarchy, contrast, and accessibility review findings (`P0`/`P1` defects: future-date day-off horizon, dock contrast/scrim, mobile gutter alignment, 200% header reflow, Attendance/Marks labels, Schedule contrast, Fees deadline clarity, Events spotlight framing) |
| Antigravity (`Gemini 4 Hydrogen`) | Phase 10B corrective engineering, 3-state absence impact calculation (`stays-above` / `deficit-recoverable` / `unreachable`), Chrome CDP verification suite, screenshot refresh, and final production release |
| [Hack4Hack Pixelcraft 2026](https://hack4hack.com/hackathons/pixelcraft-2026-ui-ux-design-challenge-3i27) | DS-05 requirements, deliverables, rubric and disclosure rules |
| [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Accessibility criteria and contrast methodology referenced for design and verification |
| [Material Design 3](https://m3.material.io) & [Laws of UX](https://lawsofux.com) | Navigation scrim/surface legibility, choice/density restraint, and responsive spacing references consulted during Phase 10B polish |

## Original CampusOne assets vs third-party packages

- **Original project assets:** CampusOne gate mark (`public/campusone.svg`), Open Graph social-sharing card (`public/og-image.png`), SVG `AttendanceRing` component, six original typographic/geometric SVG/editorial event posters (`src/features/events/EventArtwork.tsx`, Phase 10 evolved from `project.zip` poster patterns), and CampusOne's `System / Light / Dark` persistence shell. No third-party stock photography or proprietary external illustrations are used.
- **License notice:** No project-wide open-source license has been assigned to CampusOne without explicit owner authorization. Third-party runtime and font package licenses listed below remain preserved.

## Installed runtime & font packages

| Package | Version | License | Purpose |
| --- | --- | --- | --- |
| `react` / `react-dom` | `^19.1.0` | MIT | UI runtime |
| `react-router-dom` | `^7.6.0` | MIT | Client routing and query-parameter navigation |
| `lucide-react` | `^0.511.0` | ISC | Navigation and UI iconography |
| `@fontsource-variable/inter` | `^5.2.5` | OFL-1.1 | Locally bundled Inter Variable fallback typography |
| `tailwindcss` / `@tailwindcss/vite` | `^4.1.7` | MIT | Utility CSS compilation |
| `vite` / `typescript` | `^6.3.5` / `~5.8.3` | MIT / Apache-2.0 | Build tooling and strict type checking |

## Design guidance referenced (Phases 03–07)

Local skill sources referenced selectively were `.agents/skills/frontend-design` for distinctive composition, copywriting restraint and Phase 07 original SVG poster art direction, `.agents/skills/minimalist-skill` for editorial hierarchy, `.agents/skills/apple-design` for native system font pairing, translucent chrome and reduced-transparency/motion support, `.agents/skills/emil-design-eng` for interaction timing (`--ease-out`) and responsive press feedback, and the installed `learn-taste` skill for codifying visual corrections into [Design](DESIGN.md). The application uses no external UI component kits, stock photography, or third-party font files beyond locally bundled Inter Variable.

## Phase 11 experimental design refinement & Phase 11B final integration

Claude Opus 5.5 (Claude Code) independently implemented the Phase 11 six-screen refinement (`d5c5433`) and Phase 11A.1 interactive Today simplification (`909a6aa`) on `experiment/opus-design-refinement` and captured screenshots with a temporary headless Chrome DevTools Protocol script kept outside the repository. The `.agents/skills` collection was not loaded in Phase 11/11A.1. Decisions drew on WCAG 2.2 principles (contrast, target size, non-colour status wording, reduced motion) and Laws of UX ideas (proximity and common region for grouped ledgers, reduced choice and effort for the day-off shortcut) as general guidance. No new dependencies, fonts or external assets were added.

Antigravity (`Gemini 4 Hydrogen`) integrated the Opus implementation in Phase 11B: resolving Marks terminology (`Complete marks for 2 of 4 subjects`), balanced 7-chip / `4+3` zoom grade-chip layout, Today `320px`/`200%` stacked class-strip reflow, `?focus=day-off` focus preservation across `AppShell`, navigation clearance, Light/Dark Timetable contrast verification, consolidated Chrome CDP testing, final screenshot curation, and production deployment.

## Phase 13 award-level refinement

Claude Opus 5.5 (Claude Code) implemented Phase 13 on `experiment/award-level-design`. It read and applied the installed `unslop` skill by Damir Sokolovsky ([heydamir/unslop](https://github.com/heydamir/unslop), CC BY 4.0) in polish mode: icons carry text colour, one accent per surface, fewer card containers, and motion only where it explains a state change. None of the skill's scripts were run. Laws of UX principles applied: Goal-Gradient and Tesler's Law (the class register's finish line), Von Restorff (only the due fee is accented), Law of Common Region (grouped quick actions) and Peak-End (payment completion). Material Design 3 pages were not consulted during Phase 13.

## Phase 13B independent audit

OpenAI Codex audited the approved changes, corrected projection and receipt behavior, and verified local Chromium journeys. Target measurements were checked against [WCAG 2.2 SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). The installed Unslop skill metadata and accompanying license confirm Damir Sokolovsky as author and [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) as the license. No Unslop scripts or new project dependencies were used.

## Record when used

For installed libraries and bundled assets, record the actual version, upstream link, license and any notice requirements. Carry applicable notices into distribution. For externally sourced or generated visuals, record creator or tool, source, applicable license or usage terms and placement. Record material AI contributions by milestone and disclose their use in the one-page case study alongside credits for external material. [Hack4Hack rules](https://hack4hack.com/hackathons/pixelcraft-2026-ui-ux-design-challenge-3i27)
