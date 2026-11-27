# CampusOne roadmap

Round 1 work is planned for **27 November 2026 IST**, with active development from **6:00 PM**, an internal submission target of **11:15 PM** and a project deadline of **11:59 PM**. See [Status](STATUS.md) for organizer timing and the current checkpoint.

| Phase | Owner | Depends on | Exit gate |
| --- | --- | --- | --- |
| 00 · Product strategy and research | GPT-6.2 | Organizer and project briefs | Scope, audience hypotheses, evidence limits, journeys and acceptance documented. |
| 01 · Design and architecture | GPT-6.2 | 00 | Six compositions, interaction and accessibility specs, shared data and calculation contracts, handoff documented. |
| 02 · Foundation | Hydrogen | 01 | React, strict TypeScript, Vite and Tailwind wired. Six routes, responsive nav shell, theme controls and fixture entry point are ready. Type check, build and route/theme smoke checks pass. |
| 03 · Today | GPT-6.2 | 02 | The dated briefing, next class and action queue follow product acceptance, using shared fixtures and selectors. Linked context works against available shell routes. |
| 04–05 · Complete core product | Hydrogen | 03 | Merged phase: all five remaining screens, attendance and academic calculators, timetable views, end-to-end simulated payment, persistent event bookmarks/registrations, and Today/shell design corrections verified. |
| 06 · Visual and UX refinement | GPT-6.2 | 04–05 | Review all six screens in both themes. Refine hierarchy, consistency, navigation and feedback while preserving working flows. |
| 07 · Responsive, accessibility and testing | Hydrogen | 06 | Check keyboard and focus flow, screen-reader smoke paths, contrast and reflow in both themes. Verify at 320, 390, 768, 1024 and 1440 CSS px and 200% text resize. Fix failures and record evidence. |
| 08 · Independent audit and deployment | GPT-6.2 audit, then Hydrogen fixes and deploys | 07 | Independently run the acceptance journeys, record issues and retest fixes. Verify public Vercel URL, deep links and refresh behavior in a signed-out browser. |
| 09 · Case study and submission | GPT-6.2 and project owner | 08 | One-page case study explains the problem, audience and decisions with honest evidence and AI disclosure. Owner verifies links, portal requirements and submits before the target. |

Prioritize the four mandatory DS-05 experiences while preserving all six primary screens. Next protect the two planners, the Today-to-action links and their verification. Trim optional motion or embellishment first if time is tight. Keep one implementation owner for overlapping files and stop after each assigned checkpoint.

Score against UX and information architecture (25), research and problem understanding (20), visual design (20), accessibility and inclusivity (15), prototype interactions (10), and presentation (10). During final review, use [Product](PRODUCT.md) for behavior, [Design](DESIGN.md) for presentation and [Architecture](ARCHITECTURE.md) for edge cases. [Hack4Hack evaluation rubric](https://hack4hack.com/hackathons/pixelcraft-2026-ui-ux-design-challenge-3i27)
