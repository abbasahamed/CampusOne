# CampusOne release verification

**Product:** CampusOne (`DS-05 — One campus app for students`)  
**Team:** NexaCoders (Solo) · Pixelcraft 2026 UI/UX Design Challenge  
**GitHub repository:** <https://github.com/abbasahamed/CampusOne> (`PUBLIC`, branch `master`)  
**Live production URL:** <https://campusone-pi-flax.vercel.app> (Vercel project `abbas1-46a5/campusone`)  
**Rollback checkpoint:** `62cdbce` (Phase 11B live release) · verified Codex app revision `e1f953c`

## Phase 14A + 14B final competition release

- **Scope & reconciliation:** Backed up uncommitted Phase 12 case-study changes (`docs/STATUS.md`, `docs/ATTRIBUTION.md`) outside the repository (`phase12-backup/`), reconciled them with Phase 13 (`d95bb6c`) and Phase 13B (`e1f953c`) records in `experiment/award-level-design` (`27ab99e`), and fast-forwarded `master` without altering `docs/submission/`, `project.zip`, or `CampusOne-opus`. Confirmed zero diff in `src/` between `e1f953c` and `master`.
- **Static & calculation verification (`npm run typecheck && npm run lint && npm test && npm run build`):**
  - TypeScript (`tsc -b --noEmit`): passed (`0` errors).
  - ESLint (`eslint .`): passed (`0` errors).
  - Domain calculation suite (`node --test src/domain/*.test.ts`): `8/8` tests passing in `149.52ms` (including exhaustive 256-plan `CS301` sustained-crossing matrix).
  - Production bundle (`tsc -b && vite build`): built in `876ms` (`dist/index.html` `3.48 kB`, CSS `97.21 kB`, JS `424.34 kB`).
- **Consolidated Chrome CDP smoke checks (`vite preview`, `verify-phase14.mjs`):**
  - Verified all `6` primary screens at `390×844` light/dark and `1440×900` (`0` overflow, `0` console/runtime errors).
  - Verified Attendance numbered register (`8` cells), `6`-class `75%` recovery (`76.5%`), 7-attend + 1-skip temporary crossing (`73.5%`, no finish flag, `"This plan reaches 75%, then finishes below it. Projected attendance: 73.5%, 25 of 34 classes."`), and `Today -> Day off?` focus.
  - Verified Fees Decline -> Retry -> Payment complete (`Paid · Simulated`, `₹5,250`, `"Nothing else is due for this semester."`, receipt stub), `View latest receipt` lookup, reload persistence, and Today transition to grouped `Receipts`.
  - Verified Marks planner, Timetable Day/Week, Events registration persistence, Dark appearance persistence, and direct-route refresh.

## Screenshot evidence & attribution

- **Curated final competition showcase (`18` final captures `01`–`18`):** [`docs/screenshots/final/`](screenshots/final)
- **Preserved milestone evidence:** [`docs/screenshots/phase-11-opus/`](screenshots/phase-11-opus), [`docs/screenshots/phase-11a1-today/`](screenshots/phase-11a1-today), [`docs/screenshots/phase-11b-release/`](screenshots/phase-11b-release), [`docs/screenshots/phase-13-award/`](screenshots/phase-13-award), and [`docs/screenshots/phase-13b-codex/`](screenshots/phase-13b-codex).
- **Attribution:** See [`docs/ATTRIBUTION.md`](ATTRIBUTION.md)

## Known limitations & unverified areas

- Physical mobile device testing (iOS/Android), Safari/Firefox cross-browser testing, actual browser zoom, interactive screen-reader (VoiceOver/NVDA) testing, and third-party external social link crawler previews were not executed.
- All student, attendance, marks, schedule, fee, and event workflows run on fictional demo fixtures (`27 November 2026, 09:10 IST`, `Arjun Menon · 24CS1042`) and local `localStorage` persistence with no backend authentication or real payment processing.
- Release blockers remaining: **None**. Frozen for Pixelcraft Round 1.
