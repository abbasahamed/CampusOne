# CampusOne technical blueprint

## Application boundaries

Use a single frontend with React, strict TypeScript, Vite, Tailwind CSS, React Router, Lucide React and locally bundled Inter Variable. Use CSS for routine transitions and add Motion only for a defined interaction that needs it. Keep GitHub as the source repository and target Vercel static deployment. Configure SPA fallback for direct visits to client routes while preserving asset resolution. Use Vite's static output for preview checks.

| Area | Responsibility |
| --- | --- |
| `src/app/` | Route definitions, shared shell, top-level theme and demo state wiring |
| `src/styles/`, `src/components/` | Semantic tokens, global styles and shared navigation, fields, status and dialog components |
| `src/features/` | Route composition and feature-specific UI. Today consumes shared selectors across domains |
| `src/data/` | Typed fixture records, relationships and demo policy settings |
| `src/domain/` | Pure attendance and academic calculators, date helpers and cross-screen selectors. No React or storage dependencies |
| `src/lib/` | Narrow browser adapters for preference and demo-state persistence |

Use `/today`, `/academics/attendance`, `/academics/marks`, `/schedule`, `/fees` and `/events`. Redirect `/` to Today and `/academics` to Attendance. Unknown paths recover to Today. Use browser history and validated query parameters for linked context. Attendance accepts `subject`, Marks accepts `semester` and `subject`, Schedule accepts `date` and `view`, Fees accepts `invoice`, and Events accepts `event`. Invalid or incompatible selections fall back to the screen default. Fees focuses a linked invoice in the screen and opens review only on explicit action. Event deep links can open details. Keep planner input and dialog stages in feature state.

## Demo data and shared selectors

Use stable IDs. One student has a current semester and earlier semester results. A course offering belongs to a semester and owns its credits. Attendance snapshots, assessments and class meetings reference that offering. Store assessment weight in basis points, possible and earned marks, and posting state. A zero mark is a recorded result. Unposted marks are null. Schedule meetings carry date, start/end, room and scheduled/canceled state. Breaks are separate entries. Invoices own line items with integer paise and an explicit due date. Payments reference invoices. Events own category, start/end, venue, description and a registration availability flag. Bookmarks and registrations reference event IDs.

Use a fixed campus clock for the demo, proposed as **27 November 2026, 9:10 AM IST**, with a visible demo date so links work on later judging visits. Format dates and currency for `en-IN` and the `Asia/Kolkata` campus zone. Seed a 10:00 AM Data Structures class in Room B-204, a later break and cancellation, one outstanding fee due on 30 November, a historical payment and upcoming events with overlapping categories for combined filters. Include an empty schedule day and a complete prior semester alongside the in-progress semester. Attendance includes 18/26 classes for Data Structures with five planned classes remaining and a second course at 21/26 with at least two remaining. The attendance horizon is a recorded fixture assumption for the rest of term. The visible timetable covers selected dates within that horizon.

Today and Timetable use the earliest non-canceled teaching session strictly after the demo time on the campus date. Classes underway may be labeled separately. Today reads balances from the same invoice selector as Fees, and events from the same records as Events. Build the action queue from overdue or due-within-seven-days invoices and below-target subjects. Sort overdue fees first, then below-target subjects with infeasible recovery first and larger shortfalls next, then upcoming fees by due date. Use IDs to break ties. Show upcoming events and class separately. Remove settled invoices from the queue immediately.

## Attendance calculation contract

Inputs are attended `A`, conducted `C`, remaining `R` and threshold `p/q` (default `3/4`). Counts must be finite, nonnegative safe integers with `A ≤ C`. Require `0 < p ≤ q` and guard intermediate arithmetic. Distinguish invalid data, an unrecorded rate when `C = 0`, and a valid result. For unrecorded subjects, let the planner project a valid future scenario. Aggregate by summing counts and dividing once. Determine recorded status by cross multiplication, including the exact threshold. Use percent rounding for display only and show counts plus status near the threshold.

- **Recovery.** For a scenario of attending consecutive remaining classes, already at target gives zero. Otherwise for `p < q`, the minimum is `ceil((p*C - q*A)/(q-p))`. If the minimum exceeds `R`, report unreachable and show the best possible rate `(A+R)/(C+R)` when defined. At a 100% threshold, existing absences make recovery impossible. With zero recorded classes, one attended class establishes a rate when at least one remains.
- **Safe absences.** Model misses taken immediately before any future attendance. For a recorded rate at or above threshold, the limit is `min(R, floor((q*A - p*C)/p))`. If already below threshold, show zero available and explain that recovery comes first. With no recorded classes, show that the safe limit is unavailable. With zero remaining, there are zero future classes to miss.
- **Projection.** Accept `attend` and `miss` as nonnegative integers with `attend + miss ≤ R`. Use `(A+attend)/(C+attend+miss)` and show projected numerator and denominator. Return unavailable for a zero denominator. Explain which future sessions are included. Baseline records stay intact.

Reference outcomes for targeted verification: 18/26 at 75% needs six consecutive classes, reaches 24/32 exactly, and is unreachable with five remaining. At 21/26, two immediate misses are safe and a third drops below target.

## Academic calculation contract

Configure a grading policy per semester with descending inclusive lower percentage boundaries, grade labels and points, a passing floor if used, rounding mode and precision for classification, an exam mark increment, and SGPA display precision. Fictional demo rules use a 10-point scale with O/A+/A/B+/B/C/P/F at 90/80/70/60/50/45/40/0 and 10/9/8/7/6/5/4/0 points respectively. Classify using the exact weighted total in the default policy. Display course percentages to two decimals and SGPA rounded half-up to two decimals. Use whole exam marks by default. Support configurable half-up rounding before classification when a policy specifies it.

- **Assessment totals.** Validate positive maxima, marks within range, valid credits, ordered scale and an exact 10,000 basis-point sum for course weights. Compute course percentage as the sum of each earned/max × weight percentage. Identify recorded contribution and pending weight separately. A course grade is actual once all positive-weight marks have posted. Use scaled integers or exact rational comparisons at thresholds to avoid floating-point boundary drift.
- **Grade Planner.** Select a target grade and one unposted, positive-weight exam. Require all other positive-weight marks to be posted for a single required score. When additional results are pending, explain which scores are missing and show the recorded breakdown. For exact classification, solve `recorded contribution + examWeightPercent × score/examMax ≥ target floor` and round up to the next permitted mark increment. For policies that round the total before classification, find the smallest permissible score that passes the actual classifier. Include the maximum as a permitted endpoint. Return zero if the target is already secured, and “not reachable” plus best possible grade if maximum marks are insufficient. An optional valid estimate goes through the same classifier and stays labeled as projected.
- **SGPA.** Compute `sum(points × credits) / sum(credits)` for the selected semester. Exclude zero-credit courses from both sums and show their marks separately. Show actual when all positive-credit course grades are posted and projected only when every such course has an actual grade or a valid projection. Otherwise show the reason SGPA is unavailable, including zero eligible credits.

Seed a 20% + 20% + 60% course that has 32 percentage points posted and a final exam out of 100. A+ requires 80/100 and O requires 97/100 with the default policy. Keep at least one meaningful infeasible grade scenario in the fixture. Other credited courses can be complete so a valid estimate demonstrates projected SGPA.

## Local state and simulation

Keep derived values in selectors. Use versioned, namespaced LocalStorage entries for theme, bookmarks, registrations and one success record per demo invoice. Validate persisted shape and referenced IDs. Fall back to defaults for unavailable or invalid storage. Keep controls usable in memory and disclose that changes last only for the session if persistence fails. Apply theme before first paint when possible. Default to System, observe system color changes only in that mode, and persist manual Light/Dark selection.

Payment is full-invoice only. Review lists the amount, “Simulated payment” and a labeled demo outcome control defaulting to success. A confirmed simulated failure creates no successful payment and leaves the balance unchanged. Retry returns to review with the same invoice and lets the user choose success. Prevent repeat activation while processing. Use invoice ID as the idempotency key, with a stable demo receipt ID and demo timestamp so repeats converge on the same record. Write success as a single invoice-keyed record. Update React state after commit and reconcile persisted updates via storage events. Derive history and outstanding balance from that record, with guard checks when opening and confirming review. Receipts are in-app and clearly marked simulated. Collect no payment credentials. Registration is a one-way simulated confirmation keyed by event ID. Saved events toggle independently. A repeated registration returns the prior confirmation.

Phase 02 sets up the shell and source boundaries. [Roadmap](ROADMAP.md) owns the staging and verification gates.
