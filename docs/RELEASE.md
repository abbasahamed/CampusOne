# CampusOne release verification

**Product:** CampusOne (`DS-05 — One campus app for students`)  
**Team:** NexaCoders (Solo) · Pixelcraft 2026 UI/UX Design Challenge  
**GitHub repository:** <https://github.com/abbasahamed/CampusOne> (`PUBLIC`, branch `master`)  
**Live production URL:** <https://campusone-pi-flax.vercel.app> (Vercel project `abbas1-46a5/campusone`)  
**Phase 10B rollback checkpoint:** `2f0d655`

## Phase 11B final Opus integration verification (`experiment/opus-design-refinement`)

- **Scope:** Integrated Claude Code Opus Phase 11 six-screen refinement (`d5c5433`) and Phase 11A.1 simplified interactive Today companion (`909a6aa`) with targeted fixes for Marks partial-vs-finalized terminology, single-row `390px` / balanced `4+3` zoom grade chips, Today `320px`/`200%` stacked class-strip reflow, `?focus=day-off` focus preservation across `AppShell`, bottom dock clearance, and Timetable Light/Dark contrast.
- **Static & calculation verification (`npm run typecheck && npm run lint && npm test && npm run build`):**
  - TypeScript (`tsc -b --noEmit`): passed (`0` errors).
  - ESLint (`eslint .`): passed (`0` errors).
  - Domain calculation suite (`node --test src/domain/*.test.ts`): `6/6` tests passing in `142.99ms`.
  - Production bundle (`tsc -b && vite build`): built in `776ms` (`dist/index.html` `3.48 kB`, CSS `93.23 kB`, JS `422.56 kB`).
- **Chrome CDP checks (`vite preview`, `verify-phase11b.mjs`):**
  - Navigation clearance (`390×844`): all 6 routes `rootOv: 0`, equal dock cells `68.8px` (`68.81px` Events), `lastBottom <= 720.5px` vs `dockTop: 766px`, compact `Menu` fallback active at `320×640` and `390×844 @ 200%`.
  - Today interactions & `200%`: proportional class strip kept at `390×844`, `OS`/`CN` preview swaps cleanly without altering `50 min` next-class countdown, Attendance insight expands via disclosure (`69.2%`, `8` left, `76.5%` max), `Day off?` scrolls & focuses `.day-off-section` across navigation and reload, and `@ 200%` / `320px` switches to chronological stacked class list (`previewStacked: true`, `ov: 0`).
  - Marks chips: `390×844` renders 7 even chips on 1 row (`O`–`P`, `47×54px`), `200%` zoom reflows cleanly (`4+3`, `anyClipped: false`).
  - Timetable computed contrast: Light blocks `8.91:1`–`10.38:1` (`Computer Networks` canceled `6.60:1`, `9:10` chip `6.39:1`); Dark blocks `9.07:1`–`9.73:1` (`Computer Networks` canceled `7.89:1`, `9:10` chip `7.31:1`).
  - Functional end-to-end journeys: Attendance `75%` (`6` consecutive) and `85%` unreachable, Fees Decline -> Retry -> Success -> Today `Receipts` update, `0` console/runtime errors.

## Screenshot evidence & attribution

- **Curated final competition showcase (`17` matching Opus captures `01`–`17`):** [`docs/screenshots/final/`](screenshots/final)
- **Phase 11B release verification (`19` captures):** [`docs/screenshots/phase-11b-release/`](screenshots/phase-11b-release)
- **Preserved Opus milestone evidence:** [`docs/screenshots/phase-11-opus/`](screenshots/phase-11-opus) (`29`) and [`docs/screenshots/phase-11a1-today/`](screenshots/phase-11a1-today) (`12`)
- **Attribution:** See [`docs/ATTRIBUTION.md`](ATTRIBUTION.md)

## Known limitations & unverified areas

- Physical mobile device testing (iOS/Android), Safari/Firefox cross-browser testing, interactive screen-reader (VoiceOver/NVDA) testing, and third-party external social link crawler previews were not executed.
- All student, attendance, marks, schedule, fee, and event workflows run on fictional demo fixtures (`27 November 2026, 09:10 IST`, `Arjun Menon · 24CS1042`) and local `localStorage` persistence with no backend authentication or real payment processing.
- Release blockers remaining: **Pending owner authorization to resolve uncommitted whitespace edit in `/Users/abbas/Desktop/CampusOne/src/features/academics/academics.css` before fast-forwarding `master`**.
