import { useId, useState } from 'react';
import {
  CalendarCheck,
  CalendarX2,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Receipt,
  Target,
  Ticket,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DEMO_CLOCK_ISO,
  DEMO_CURRENT_TIME,
  DEMO_PAYMENTS,
  DEMO_SEMESTERS,
  DEMO_STUDENT,
  DEMO_TIMEZONE,
  DEMO_TODAY_DATE,
} from '../../data/demoData';
import type { AttendanceSnapshot, FeePayment, ScheduleMeeting } from '../../data/types';
import { calculateRecoveryPlan } from '../../domain/attendance';
import {
  format12hClock,
  getCourseVisual,
  meridiemLabel,
  timeToMinutes,
} from '../../domain/courseVisuals';
import { formatPaise, formatPercentage } from '../../domain/format';
import {
  getAggregateAttendance,
  getBelowTargetAttendance,
  getCourseOffering,
  getCurrentClassOnDate,
  getInvoiceTotalPaise,
  getNextClassOnDate,
  getOutstandingInvoices,
  getRecordedSgpa,
  getScheduleOnDate,
  getUpcomingEvents,
} from '../../domain/selectors';
import { getScheduleLink, getTodayActions, minutesUntil, type TodayAction } from '../../domain/today';
import { PageHeader, SectionHeader } from '../../components/Typography';
import { EventArtwork } from '../events/EventArtwork';
import './today.css';

const DAY_START_MIN = 9 * 60;
const DAY_END_MIN = 15 * 60 + 40;
const scheduleLink = getScheduleLink(DEMO_TODAY_DATE);

function timeRange(m: ScheduleMeeting): string {
  const start = meridiemLabel(m.startTime);
  const end = meridiemLabel(m.endTime);
  return start === end
    ? `${format12hClock(m.startTime)}–${format12hClock(m.endTime)} ${end}`
    : `${format12hClock(m.startTime)} ${start}–${format12hClock(m.endTime)} ${end}`;
}

function stripLabel(shortName: string, title: string): string {
  if (shortName.length <= 5) return shortName;
  return title
    .split(/\s+/)
    .filter((word) => /^[A-Z]/.test(word))
    .map((word) => word[0])
    .join('');
}

function meetingStatus(m: ScheduleMeeting, focusId?: string, currentId?: string): string {
  if (m.status === 'canceled') return 'Canceled';
  if (m.id === currentId) return 'Happening now';
  if (m.id === focusId) return 'Up next';
  if (m.endTime <= DEMO_CURRENT_TIME) return 'Finished';
  return 'Later today';
}

/* Next class + interactive day strip */

function NextClassHero({
  current,
  next,
  meetings,
}: {
  current?: ScheduleMeeting;
  next?: ScheduleMeeting;
  meetings: readonly ScheduleMeeting[];
}) {
  const focus = current ?? next;
  const classes = meetings.filter((m) => m.kind !== 'break');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detailId = useId();
  const nowMin = timeToMinutes(DEMO_CURRENT_TIME);
  const span = DAY_END_MIN - DAY_START_MIN;
  const nowPct = Math.min(100, Math.max(0, ((nowMin - DAY_START_MIN) / span) * 100));

  if (!focus) {
    return (
      <section aria-label="Next class" className="today-hero today-hero--empty">
        <p className="today-hero-empty-title">No more classes today</p>
        <Link to={scheduleLink} className="today-link">
          Open timetable <ChevronRight size={14} aria-hidden="true" />
        </Link>
      </section>
    );
  }

  const course = getCourseOffering(focus.offeringId);
  const room = focus.room ?? course?.roomDefault ?? 'Room TBA';
  const deltaMins = Math.max(0, minutesUntil(current ? focus.endTime : focus.startTime));
  const hours = Math.floor(deltaMins / 60);
  const mins = deltaMins % 60;
  const countdownSpoken = hours > 0 ? `${hours} hours ${mins} minutes` : `${deltaMins} minutes`;

  const selected = classes.find((m) => m.id === selectedId) ?? null;
  const selectedCourse = selected ? getCourseOffering(selected.offeringId) : undefined;
  const isPreview = selected !== null && selected.id !== focus.id;

  return (
    <section aria-labelledby="next-class-title" className="today-hero">
      <div className="today-hero-head">
        <p className="today-hero-kicker">{current ? 'Happening now' : 'Next class'}</p>
        <p className="num today-countdown" aria-label={`${current ? 'Ends in' : 'Starts in'} ${countdownSpoken}`}>
          <span aria-hidden="true" className="today-countdown-pre">
            {current ? 'ends in' : 'in'}
          </span>
          {hours > 0 && (
            <>
              <span aria-hidden="true" className="today-countdown-num">{hours}</span>
              <span aria-hidden="true" className="today-countdown-unit">h</span>
            </>
          )}
          <span aria-hidden="true" className="today-countdown-num">{hours > 0 ? mins : deltaMins}</span>
          <span aria-hidden="true" className="today-countdown-unit">min</span>
        </p>
      </div>

      <h2 id="next-class-title" className="today-hero-title">
        {focus.title}
      </h2>
      <p className="num today-hero-meta">
        <span>{timeRange(focus)}</span>
        <span aria-hidden="true" className="today-dot" />
        <span>{room}</span>
      </p>

      <div className="today-strip" role="group" aria-label="Today’s classes. Select a class to preview it.">
        <div className="today-strip-track">
          {classes.map((m) => {
            const visual = getCourseVisual(m.offeringId, m.title);
            const left = ((timeToMinutes(m.startTime) - DAY_START_MIN) / span) * 100;
            const width = ((timeToMinutes(m.endTime) - timeToMinutes(m.startTime)) / span) * 100;
            const canceled = m.status === 'canceled';
            const done = !canceled && m.endTime <= DEMO_CURRENT_TIME && m.id !== current?.id;
            const isFocus = m.id === focus.id;
            const isSelected = m.id === selectedId;
            return (
              <button
                key={m.id}
                type="button"
                className={`today-seg press ${canceled ? '' : done ? 'tint-bg-past' : isFocus ? '' : 'tint-bg tint-ink'}`}
                data-canceled={canceled}
                data-focus={isFocus}
                data-selected={isSelected}
                aria-pressed={isSelected}
                aria-controls={detailId}
                aria-label={`${m.title}, ${timeRange(m)}, ${meetingStatus(m, focus.id, current?.id)}`}
                onFocus={(e) => e.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' })}
                onClick={() => setSelectedId(isSelected ? null : m.id)}
                style={{
                  left: `calc(${left}% + 1.5px)`,
                  width: `calc(${width}% - 3px)`,
                  '--hue': String(visual.hue),
                } as React.CSSProperties}
              >
                <span className="today-seg-short">{stripLabel(visual.shortName, m.title)}</span>
                <span className="today-seg-full">
                  <span className="today-seg-full-title">{m.title}</span>
                  <span className="num today-seg-full-meta">
                    {format12hClock(m.startTime)} {meridiemLabel(m.startTime)}
                    {canceled ? ' · Canceled' : ''}
                  </span>
                </span>
              </button>
            );
          })}
          <span className="today-strip-now" style={{ left: `${nowPct}%` }} aria-hidden="true" />
        </div>
        <div className="num today-strip-hours" aria-hidden="true">
          <span style={{ left: 0 }}>9 AM</span>
          <span style={{ left: `${((12 * 60 - DAY_START_MIN) / span) * 100}%` }} className="today-strip-mid">
            12 PM
          </span>
          <span style={{ right: 0 }}>3:40 PM</span>
        </div>
      </div>

      <div id={detailId} className="today-preview" aria-live="polite">
        {selected ? (
          <div className="today-preview-body" key={selected.id}>
            <p className="today-preview-kicker" data-preview={isPreview}>
              {isPreview
                ? `Schedule preview · ${meetingStatus(selected, focus.id, current?.id)}`
                : meetingStatus(selected, focus.id, current?.id)}
            </p>
            <p className={`today-preview-title ${selected.status === 'canceled' ? 'line-through' : ''}`}>
              {selected.title}
            </p>
            <p className="num today-preview-meta">
              {selected.status === 'canceled'
                ? `${timeRange(selected)} · This class will not take place`
                : [timeRange(selected), selected.room ?? selectedCourse?.roomDefault, selectedCourse?.faculty]
                    .filter(Boolean)
                    .join(' · ')}
            </p>
          </div>
        ) : (
          <p className="today-preview-hint">Tap a class for room, time and faculty</p>
        )}
        <Link to={scheduleLink} className="today-link">
          Timetable <ChevronRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

/* Attendance insight */

function pickAttendanceFocus(): AttendanceSnapshot | undefined {
  return getBelowTargetAttendance()
    .map((snapshot) => ({ snapshot, plan: calculateRecoveryPlan(snapshot) }))
    .sort(
      (a, b) =>
        Number(a.plan.status !== 'unreachable') - Number(b.plan.status !== 'unreachable') ||
        a.snapshot.attended / a.snapshot.conducted - b.snapshot.attended / b.snapshot.conducted,
    )[0]?.snapshot;
}

function AttendanceInsight() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const snapshot = pickAttendanceFocus();

  if (!snapshot) {
    const { attended, conducted } = getAggregateAttendance();
    return (
      <Link to="/academics/attendance" className="today-insight today-insight-toggle press" data-state="safe">
        <span className="today-insight-mark" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <strong className="today-insight-title">Every subject is above the minimum</strong>
          <span className="today-insight-sub num">
            {conducted > 0 ? `Overall ${formatPercentage(attended, conducted)}` : 'No classes recorded yet'}
          </span>
        </span>
        <ChevronRight size={16} className="today-chev" aria-hidden="true" />
      </Link>
    );
  }

  const plan = calculateRecoveryPlan(snapshot);
  const course = getCourseOffering(snapshot.offeringId);
  const name = getCourseVisual(snapshot.offeringId, course?.name).shortName;
  const target = formatPercentage(snapshot.targetNumerator, snapshot.targetDenominator, 0);
  const reachable = plan.status === 'recoverable' && plan.neededClasses !== null;

  const title = reachable
    ? `Attend your next ${plan.neededClasses} ${name} ${plan.neededClasses === 1 ? 'class' : 'classes'}`
    : `${name} can’t reach ${target} this term`;
  const sub = reachable
    ? `Reach the ${target} minimum`
    : plan.bestPossiblePercentage !== null
      ? `Attend every class to finish at ${plan.bestPossiblePercentage.toFixed(1)}%`
      : 'Talk to your department about eligibility';

  return (
    <section className="today-insight" data-state={reachable ? 'recoverable' : 'unreachable'} aria-label="Attendance">
      <button
        type="button"
        className="today-insight-toggle press"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="today-insight-mark" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <strong className="today-insight-title num">{title}</strong>
          <span className="today-insight-sub">{sub}</span>
        </span>
        <ChevronDown size={18} className="today-chev today-insight-chev" aria-hidden="true" />
      </button>
      <div id={panelId} className="today-insight-panel" hidden={!open}>
        <dl className="num today-insight-facts">
          <div>
            <dt>Now</dt>
            <dd>{formatPercentage(snapshot.attended, snapshot.conducted)}</dd>
          </div>
          <div>
            <dt>Classes left</dt>
            <dd>{snapshot.remaining}</dd>
          </div>
          <div>
            <dt>Best possible</dt>
            <dd>{plan.bestPossiblePercentage !== null ? `${plan.bestPossiblePercentage.toFixed(1)}%` : '—'}</dd>
          </div>
        </dl>
        <p className="today-insight-note num">
          {course?.name ?? name}: {snapshot.attended} of {snapshot.conducted} classes attended so far.
        </p>
        <Link to={`/academics/attendance?subject=${encodeURIComponent(snapshot.offeringId)}`} className="today-link">
          Open recovery plan <ChevronRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

/* Metrics */

function Metrics() {
  const { attended, conducted } = getAggregateAttendance();
  const below = getBelowTargetAttendance().length;
  const aggPct = conducted > 0 ? (attended / conducted) * 100 : null;
  const recorded = DEMO_SEMESTERS.map((semester) => ({ semester, sgpa: getRecordedSgpa(semester.id) })).find(
    ({ sgpa }) => sgpa !== undefined,
  );

  return (
    <div className="today-metrics">
      <Link to="/academics/attendance" className="today-metric press">
        <span className="today-metric-label">Attendance</span>
        <span className="num today-metric-value">
          {aggPct !== null ? aggPct.toFixed(1) : '—'}
          {aggPct !== null && <small>%</small>}
        </span>
        <span className="today-metric-status" data-tone={below > 0 ? 'warn' : 'ok'}>
          {aggPct === null
            ? 'No classes yet'
            : below > 0
              ? `${below} ${below === 1 ? 'subject' : 'subjects'} below minimum`
              : 'All subjects on track'}
        </span>
      </Link>
      <Link
        to={recorded ? `/academics/marks?semester=${encodeURIComponent(recorded.semester.id)}` : '/academics/marks'}
        className="today-metric press"
      >
        <span className="today-metric-label">SGPA</span>
        <span className="num today-metric-value">{recorded?.sgpa?.toFixed(2) ?? '—'}</span>
        <span className="today-metric-status">
          {recorded ? `${recorded.semester.shortLabel} · recorded` : 'Awaiting results'}
        </span>
      </Link>
    </div>
  );
}

/* Quick actions */

function QuickActions({ payments }: { payments: readonly FeePayment[] }) {
  const dueInvoice = [...getOutstandingInvoices(payments)].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  const gradeTarget = pickAttendanceFocus()?.offeringId;
  const actions = [
    { to: '/academics/attendance?focus=day-off', icon: CalendarCheck, label: 'Day off?', hint: 'Check a date' },
    {
      to: gradeTarget ? `/academics/marks?subject=${encodeURIComponent(gradeTarget)}&focus=planner` : '/academics/marks?focus=planner',
      icon: Target,
      label: 'Plan a grade',
      hint: 'Score needed',
    },
    dueInvoice
      ? {
          to: `/fees?invoice=${encodeURIComponent(dueInvoice.id)}`,
          icon: Wallet,
          label: `Pay ${formatPaise(getInvoiceTotalPaise(dueInvoice))}`,
          hint: 'Fee due',
          emphasize: true,
        }
      : { to: '/fees', icon: Receipt, label: 'Receipts', hint: 'All paid' },
    { to: '/events', icon: Ticket, label: 'Events', hint: `${getUpcomingEvents().length} coming up` },
  ];

  return (
    <nav aria-label="Quick actions" className="today-quick">
      {actions.map(({ to, icon: Icon, label, hint, emphasize }) => (
        <Link key={to} to={to} className="today-quick-item press" data-emphasis={emphasize}>
          <span className="today-quick-icon" aria-hidden="true">
            <Icon size={19} strokeWidth={1.9} />
          </span>
          <span className="num today-quick-label">{label}</span>
          <span className="today-quick-hint">{hint}</span>
        </Link>
      ))}
    </nav>
  );
}

/* Remaining unresolved items */

const ACTION_ICONS = { fee: Wallet, schedule: CalendarX2, attendance: GraduationCap } as const;

function ActionList({ actions }: { actions: readonly TodayAction[] }) {
  // Attendance recovery already leads as the insight; list only what's left.
  const rest = actions.filter((a) => a.kind !== 'attendance');
  if (rest.length === 0) return null;
  return (
    <section aria-labelledby="today-todo-title">
      <SectionHeader id="today-todo-title" title="Also today" />
      <ul className="today-todo">
        {rest.map((action) => {
          const Icon = ACTION_ICONS[action.kind];
          return (
            <li key={action.id}>
              <Link to={action.to} className="today-todo-row press" data-urgency={action.urgency}>
                <span className="today-todo-icon" aria-hidden="true">
                  <Icon size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <strong>{action.title}</strong>
                  <span className="num">{action.detail}</span>
                </span>
                <ChevronRight size={16} className="today-chev" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function AroundCampus() {
  const upcoming = getUpcomingEvents().slice(0, 3);
  if (upcoming.length === 0) return null;
  return (
    <section aria-labelledby="around-campus-title">
      <SectionHeader
        id="around-campus-title"
        title="Around campus"
        action={
          <Link to="/events" className="today-link">
            All events
          </Link>
        }
      />
      <ul className="today-events no-scrollbar">
        {upcoming.map((event) => (
          <li key={event.id}>
            <Link to={`/events?event=${encodeURIComponent(event.id)}`} className="today-event press">
              <EventArtwork event={event} variant="card" className="today-event-poster" />
              <span className="today-event-copy">
                <span className="today-event-kicker">
                  {new Intl.DateTimeFormat('en-IN', { timeZone: DEMO_TIMEZONE, day: 'numeric', month: 'short' }).format(
                    new Date(event.startIso),
                  )}
                </span>
                <strong>{event.title}</strong>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Today({ payments = DEMO_PAYMENTS }: { payments?: readonly FeePayment[] }) {
  const meetings = getScheduleOnDate();
  const current = getCurrentClassOnDate();
  const next = getNextClassOnDate();
  const actions = getTodayActions(meetings, DEMO_TODAY_DATE, payments);
  const hour = Number(DEMO_CURRENT_TIME.split(':')[0]);
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateline = new Intl.DateTimeFormat('en-IN', {
    timeZone: DEMO_TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(DEMO_CLOCK_ISO));

  return (
    <div className="today-page">
      <PageHeader
        eyebrow={dateline}
        title={`${greeting}, ${DEMO_STUDENT.name.split(' ')[0]}`}
        showMobileProfile
        compact
      />

      <div className="today-grid">
        <div className="today-col">
          <NextClassHero current={current} next={next} meetings={meetings} />
          <AttendanceInsight />
          <Metrics />
        </div>
        <div className="today-col">
          <QuickActions payments={payments} />
          <ActionList actions={actions} />
          <AroundCampus />
        </div>
      </div>
    </div>
  );
}
