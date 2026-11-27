# CampusOne release verification

**Product:** CampusOne (`DS-05 — One campus app for students`)  
**Team:** NexaCoders (Solo) · Pixelcraft 2026 UI/UX Design Challenge  
**GitHub repository:** <https://github.com/abbasahamed/CampusOne> (`PUBLIC`, branch `master`)  
**Live production URL:** <https://campusone-pi-flax.vercel.app> (Vercel project `abbas1-46a5/campusone`, deployment `3fyRQCgLbvhGbn3JcHC1wDW3NhvE`)

## Phase 08D navigation capsule refinement

- **Capsule geometry (`390×844`):** `68.80×46px` (`68.81px` on Events, `0.01px` max delta) with `18px` border radius via `::before`, `52px` touch height, `500` unselected / `680` selected font weight, `70.80–70.81px` icon-center spacing (`0.01px` delta), and `0` overflow across Light/Dark and `320px`/`360px`/`390px @ 200%` adaptive Menu fallback.
- **Evidence:** [`docs/screenshots/phase-08d/`](screenshots/phase-08d) (`7` captures) and refreshed `01`–`06` in [`docs/screenshots/final/`](screenshots/final).

## Phase 08C corrective patch verification

- **Scope:** Equalized 5-column mobile dock geometry (`repeat(5, minmax(0, 1fr))`), canvas-based non-oscillating Menu fallback (`320px`, `360px`, `390px @ 200%`), restored actionable Attendance overview insight, `>= 1rem` (`16px` default) editable inputs, and `-webkit-backdrop-filter` support.
- **Static checks (`npm run typecheck && npm run lint && npm test && npm run build`):** Passed (`0` TS errors, `0` ESLint errors, `5/5` domain tests passing in `129.88ms`, `dist/` built in `777ms`).
- **Objective `390×844` mobile dock measurements (all 5 routes):**
  - Cell widths: `68.8, 68.8, 68.8, 68.8, 68.81` px (max delta `0.01` px).
  - Consecutive icon-center spacing: `70.8, 70.79, 70.8, 70.81` px (max delta `0.02` px; vertical delta `0` px).
  - Selected capsule dimensions: `68.8` px width (`68.81` px on Events, `0.01` px delta) × `52` px height; outer clearance `7` px left / `7` px right.
  - Responsive adaptive dock: `Menu` sheet fallback active at `320px`, `360px`, and `390px @ 200%` (`0` overflow, `Escape` restores focus); 5 equal cells active at `390px` and `430px` (`0` clipping).
- **Attendance & Safari precautions:** Mobile `75%` overview (`bottomY: 490 <= 844`) shows `"Attend the next 6 CS301 classes to reach 75%."` + `"8 classes remain."`; `85%` shows `"CS301 cannot reach 85% this term."` (`28` needed, `8` remaining). Computed font sizes on Event search, Marks estimate, and Attendance `What if?` inputs measure `16px` at default scaling; `-webkit-backdrop-filter` verified in compiled CSS.

## Build and calculation verification

Executed after final UI/metadata updates (`index.html`, `src/`, `public/`):

| Check | Command / Scope | Observed Result |
| --- | --- | --- |
| TypeScript | `npm run typecheck` | Passed (`0` errors) |
| ESLint | `npm run lint` | Passed (`0` errors) |
| Calculation unit tests | `npm test` (`node --test src/domain/*.test.ts`) | `5/5` passed (`138.08ms`) |
| Production build | `npm run build` | Passed (`797ms`; `dist/index.html` `3.40 kB`, CSS `71.07 kB`, JS `382.37 kB`) |

## Signed-out live production verification (`https://campusone-pi-flax.vercel.app`)

Tested in a clean ephemeral headless Chrome CDP profile (`0` console errors, `0` runtime exceptions, `0` failed network responses):

- **Public access & assets:** Homepage, `/academics/attendance` SPA route, `/campusone.svg` (`image/svg+xml`), and `/og-image.png` (`image/png`, `202,772` bytes) all respond `HTTP 200` without authentication walls. Canonical link, `og:url`, `og:image`, and `twitter:image` resolve to `https://campusone-pi-flax.vercel.app/`.
- **Deep links & reload:** Direct access and browser reload succeeded across `/today`, `/academics/attendance?subject=off-sem5-cs301`, `/academics/marks?semester=sem-4`, `/schedule?date=2026-11-25&view=day`, `/fees?invoice=inv-sem5-lab`, `/events?event=evt-design-systems-26`, and invalid fallback queries (`?subject=invalid-id`, `?date=9999-99-99`) with `0` horizontal overflow.
- **Core judge flows:** Verified Today countdown routing (`/schedule?date=2026-11-27&view=day`), Attendance `75%` reachable DSA recovery (`6` consecutive classes -> `24/32`, `76.5%` max) and `85%` unreachable state (`28` needed, `76.5%` `26/34`), Marks `O` target (`97 / 100`), Timetable canceled class & date change, Fees Decline (`₹5,250` retained) -> Retry -> Success -> reload (`₹0`) -> Today fee reminder cleared, Events category filter + bookmark (`Saved (1)`) + registration (`REG-2026-TEMS26`) persisted on reload, and Dark mode reload persistence.

## Responsive & accessibility summary

- **Verified locally (`vite preview` Chrome CDP):** Reflow across `320×640`, `360×740`, `390×844` (Light & Dark), `768×1024`, `1024×768`, `1440×900` (Light, Dark, and `200%`), and `390×844` at `200%` root font scaling (`0` overflow, compact single-row bottom navigation bar & full-row Navigation `<Dialog>` sheet). Verified Escape & trigger focus restoration on modals, keyboard focus scrolling on filter pills, regular body copy weight (`400`) under Marks score, `7.13:1` light exact-threshold mini ring contrast, and `prefers-reduced-motion: reduce`.
- **Verified live (`390×844`):** `200%` root font enlargement triggered `.campus-dock--compact` with `0` horizontal overflow.

## Screenshot evidence & attribution

- **Curated competition screens (`11` captures, `01`–`06` refreshed in Phase 08C):** [`docs/screenshots/final/`](screenshots/final)
- **Phase 08C corrective captures (`11` captures):** [`docs/screenshots/phase-08c/`](screenshots/phase-08c)
- **Phase 07B defect captures (`14` captures):** [`docs/screenshots/phase-07b/`](screenshots/phase-07b)
- **Attribution:** See [`docs/ATTRIBUTION.md`](ATTRIBUTION.md)

## Known limitations & unverified areas

- Physical mobile device testing (iOS/Android), Safari/Firefox cross-browser testing, interactive screen-reader (VoiceOver/NVDA) testing, and third-party external social link crawler previews were not executed.
- All student, attendance, marks, schedule, fee, and event workflows run on fictional demo fixtures and local `localStorage` persistence with no backend authentication or real payment processing.
- Release blockers remaining: **None** for interactive web demo & repository links (one-page case study pending separate Phase 09 step).
