# CampusOne release verification

**Product:** CampusOne (`DS-05 — One campus app for students`)  
**Team:** NexaCoders (Solo) · Pixelcraft 2026 UI/UX Design Challenge  
**GitHub repository:** <https://github.com/abbasahamed/CampusOne> (`PUBLIC`, branch `master`)  
**Live production URL:** <https://campusone-pi-flax.vercel.app> (Vercel project `abbas1-46a5/campusone`, deployment `3fyRQCgLbvhGbn3JcHC1wDW3NhvE`)

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

- **Curated competition screens (`11` captures):** [`docs/screenshots/final/`](screenshots/final)
- **Phase 07B defect captures (`14` captures):** [`docs/screenshots/phase-07b/`](screenshots/phase-07b)
- **Attribution:** See [`docs/ATTRIBUTION.md`](ATTRIBUTION.md)

## Known limitations & unverified areas

- Physical mobile device testing (iOS/Android), Safari/Firefox cross-browser testing, interactive screen-reader (VoiceOver/NVDA) testing, and third-party external social link crawler previews were not executed.
- All student, attendance, marks, schedule, fee, and event workflows run on fictional demo fixtures and local `localStorage` persistence with no backend authentication or real payment processing.
- Release blockers remaining: **None** for interactive web demo & repository links (one-page case study pending separate Phase 09 step).
