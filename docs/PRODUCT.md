# CampusOne product requirements

**CampusOne · NexaCoders · Solo**  
Everything campus. In one place.

CampusOne is a Round 1 concept for Pixelcraft 2026, DS-05. Students currently have to piece together campus tasks across portals and messaging groups. Bring the next class, academic risks, payment deadlines and events into one place, with a direct path from each signal to the relevant action. The submission is a public live web prototype with six key screens and a one-page case study. [Hack4Hack organizer brief](https://hack4hack.com/hackathons/pixelcraft-2026-ui-ux-design-challenge-3i27)

## Audience and evidence

Design for Indian undergraduate students checking small, time-sensitive details on a phone between classes. A first-year student locating a room and a student planning around an attendance shortage or exam target are design scenarios. Device, behavior and comprehension are hypotheses derived from the brief. The team has collected no student interviews, observations or usability results. University policies and student records in the demo are fictional. See [Status](STATUS.md) for open assumptions.

When student access is available, ask participants to recall how they found a class change or fee deadline and where they checked first. Then observe them finding their next room, planning recovery, and retrieving a simulated receipt. Record completion, the first wrong turn and confusing terms. Keep evidence separate from hypotheses in the case study.

## Information architecture and acceptance

The primary navigation matches on mobile and desktop. Academics opens Attendance by default and exposes two secondary links. Schedule opens Timetable. Links from Today may select a subject, date, fee, or event directly. Dialogs and sheets live within these six screens.

| Destination | Primary screen | Acceptance |
| --- | --- | --- |
| Today | Today | Shows the student's daily briefing, next class with room and time, attendance and academic summaries, prioritized actions, a fee reminder when due and an upcoming event. Every action opens its relevant context. A clear rest-of-day state replaces the next-class block when the day is done. |
| Academics | Attendance | Shows aggregate and subject counts, recorded percentages and text shortage indicators. Selecting a subject exposes the recovery and safe absence planners. A valid scenario shows projected counts and percentage with feasible guidance. Invalid, empty and impossible cases have clear messages. |
| Academics | Marks & Academics | Switching semesters updates the assessments and result status. Students can inspect earned/max marks and weights, select a grade target, and see the minimum exam mark or an explanation of infeasibility. Actual and projected results are labeled. Credit-weighted SGPA appears when supported. |
| Schedule | Timetable | Day and week views share one selected date. Date controls work by keyboard and touch. Schedule entries show times and rooms, with explicit breaks and cancellations. The next class agrees with Today. |
| Fees | Fees & Payments | Shows total outstanding, line items, due dates and payment history. Review states the amount and simulation. Success updates the balance and produces one retrievable receipt. A simulated failure preserves the balance, gives a reason and allows retry. |
| Events | Campus Events | Shows a featured event and a list with search and category filters, including a clearable empty state. Details show time, venue and registration state. Bookmarks persist and can be filtered. Simulated registration confirms once and stays visible when reopened. |

## Primary journeys

- **Get to class.** Open Today, read the time and room, then open Timetable on the matching class date. The schedule flags cancellation and identifies the next eligible class.
- **Recover attendance.** Follow the highest-risk subject from Today, see how many classes to attend consecutively, and explore planned misses. The planner explains when the target is beyond the available classes and shows the best attainable result.
- **Plan a grade.** Open Marks & Academics, inspect recorded work and choose a target. Use the required exam score to decide whether to pursue that grade or pick a lower target. An optional exam estimate updates the projected grade.
- **Resolve a fee or find an event.** Review the demo fee, recover from a failed attempt and open the receipt. For events, filter or search, inspect details, save and simulate registration.

All visible controls need working outcomes, including empty and error states. Use plain English, meaningful status text, a keyboard-accessible path through each journey and readable layouts at narrow widths. Theme changes persist across routes. [Design](DESIGN.md) specifies the accessibility and layout contract.

The demo recognizes one fictional student. Use frontend fixtures and simulated payment and registration. Authentication, live integrations, production payment collection and student data storage are outside the scope.
