# CampusOne release verification

**Product:** CampusOne (`DS-05 — One campus app for students`)  
**Team:** NexaCoders (Solo) · Pixelcraft 2026 UI/UX Design Challenge  
**GitHub repository:** <https://github.com/abbasahamed/CampusOne> (`PUBLIC`, branch `master`)  
**Live production URL:** <https://campusone-pi-flax.vercel.app> (Vercel project `abbas1-46a5/campusone`, deployment `HvRNvGsv8x3oAcXd1VsgWgzpobTe`, immutable deployment URL <https://campusone-3nsaacc5p-abbas1-46a5.vercel.app>)  
**Integration branch:** `feat/v0-design-integration` merged onto `master` at `4ce7e87` (`0a1df72` preserved as pre-v0 rollback checkpoint)

## Phase 10B final release verification

- **Scope:** Resolved P0/P1 visual, hierarchy, calculation, contrast, and accessibility defects across the integrated OKLCH v0 system: future-only Day-off checker (`Sat 28`–`Sun 06`) with 3-state `evaluateDayAbsenceImpact` classification, raised dock opacity (`92%` light / `91%` dark) + subtle scrim + bottom scroll clearance, semantic Today attendance/SGPA grouping and `<= 344px` hero stacking, `200%` root zoom Academics headers & symmetrical `19.9px` mobile gutters, Timetable `.tint-bg-past` contrast (`>= 6.61:1`) & Sunday `No classes`, explicit Fees payment deadline without misleading progress track, and compact mobile Events spotlight.
- **Static & calculation verification (`npm run typecheck && npm run lint && npm test && npm run build`):**
  - TypeScript (`tsc -b --noEmit`): passed (`0` errors).
  - ESLint (`eslint .`): passed (`0` errors).
  - Domain calculation suite (`node --test src/domain/*.test.ts`): `6/6` tests passing in `153.13ms` (covering attendance recovery, safe misses, edge cases, exam target planning, Sem 4/Sem 5 SGPA with audit exclusion, and future-only Day-off 3-way absence classification).
  - Production bundle (`tsc -b && vite build`): built in `782ms` (`dist/index.html` `3.48 kB`, CSS `87.98 kB`, JS `417.70 kB`).
- **Floating dock & responsive checks (`vite preview` Chrome CDP):**
  - Preserved exact `390×844` five-column dock (`68.80px` cells, `46px` capsule height, `18px` radius, `70.8px` center spacing), adaptive `Menu` sheet fallback under `320px`, `360px`, and `390px @ 200%` text scaling, and `0` horizontal overflow across `320×640`, `360×740`, `375×812`, `390×844` (Light/Dark, `200%` text enlargement, `2x` browser zoom), `768×1024`, and `1440×900`.

## Signed-out live production verification (`https://campusone-pi-flax.vercel.app`)

Tested in a clean ephemeral headless Chrome CDP profile (`0` console errors, `0` runtime exceptions, `0` failed network responses):

- **Public access & assets:** `/`, `/today`, `/academics/attendance`, `/academics/marks`, `/schedule`, `/fees`, `/events`, `/og-image.png` (`image/png`, `202,772` bytes), and `/campusone.svg` (`image/svg+xml`, `274` bytes) all responded `HTTP 200` without authentication prompts. Open Graph metadata resolves to `https://campusone-pi-flax.vercel.app/og-image.png`.
- **Deep links & reload:** Direct access and browser reload succeeded across `/today`, `/academics/attendance?subject=off-sem5-cs301`, `/academics/marks?semester=sem-4`, `/schedule?date=2026-11-27&view=day`, `/fees?invoice=inv-sem5-lab`, and `/events?event=evt-print-lab-26` with `0` horizontal overflow and loaded typography (`document.fonts.status === 'loaded'`).
- **Interactive journeys:** Verified future-only `Sat 28` Day-off chips, `75% minimum` rule, `Get back to 75%` CTA, Fees explicit `Mon, 30 Nov, 2026` (`3 days remaining`) deadline without removed progress track, simulated Decline -> Retry -> Payment complete -> `₹0` reload persistence, Events registration reload persistence, desktop Week `No classes` & `.tint-bg-past`, and `390×844 @ 200%` `.campus-dock--compact` fallback.

## Screenshot evidence & attribution

- **Curated competition screens (`15` refreshed v0 captures, `01`–`15`):** [`docs/screenshots/final/`](screenshots/final)
- **Phase 10B corrective captures (`26` captures):** [`docs/screenshots/phase-10b/`](screenshots/phase-10b)
- **Phase 10 v0 integration captures (`19` captures):** [`docs/screenshots/phase-10-v0/`](screenshots/phase-10-v0)
- **Attribution:** See [`docs/ATTRIBUTION.md`](ATTRIBUTION.md)

## Known limitations & unverified areas

- Physical mobile device testing (iOS/Android), Safari/Firefox cross-browser testing, interactive screen-reader (VoiceOver/NVDA) testing, and third-party external social link crawler previews were not executed.
- All student, attendance, marks, schedule, fee, and event workflows run on fictional demo fixtures (`27 November 2026, 09:10 IST`, `Arjun Menon · 24CS1042`) and local `localStorage` persistence with no backend authentication or real payment processing.
- Release blockers remaining: **None**.
