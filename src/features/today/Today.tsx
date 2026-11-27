import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DEMO_ATTENDANCE,
  DEMO_CLOCK_ISO,
  DEMO_CURRENT_TIME,
  DEMO_PAYMENTS,
  DEMO_SEMESTERS,
  DEMO_STUDENT,
  DEMO_TIMEZONE,
  DEMO_TODAY_DATE,
} from '../../data/demoData';
import type { FeePayment, ScheduleMeeting } from '../../data/types';
import { calculateRecoveryPlan } from '../../domain/attendance';
import {
  format12hClock,
  getCourseVisual,
  meridiemLabel,
  timeToMinutes,
} from '../../domain/courseVisuals';
import { formatPercentage } from '../../domain/format';
import {
  getAggregateAttendance,
  getBelowTargetAttendance,
  getCourseOffering,
  getCurrentClassOnDate,
  getNextClassOnDate,
  getRecordedSgpa,
  getScheduleOnDate,
  getUpcomingEvents,
} from '../../domain/selectors';
import {
  getScheduleLink,
  getTodayActions,
  minutesUntil,
  type TodayAction,
} from '../../domain/today';
import { PageHeader, SectionHeader } from '../../components/Typography';
import { EventArtwork } from '../events/EventArtwork';
import './today.css';

const DAY_START_MIN = 9 * 60;
const DAY_END_MIN = 15 * 60 + 40;
const scheduleLink = getScheduleLink(DEMO_TODAY_DATE);

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
  const nowMin = timeToMinutes(DEMO_CURRENT_TIME);
  const posPct = Math.min(
    100,
    Math.max(0, ((nowMin - DAY_START_MIN) / (DAY_END_MIN - DAY_START_MIN)) * 100),
  );

  if (!focus) {
    return (
      <section aria-label="Next class" className="today-hero-empty">
        <p>Classes are done for today.</p>
        <Link to={scheduleLink} className="today-inline-link">
          Open timetable
        </Link>
      </section>
    );
  }

  const course = getCourseOffering(focus.offeringId);
  const visual = getCourseVisual(focus.offeringId, course?.name);
  const snapshot = DEMO_ATTENDANCE.find((a) => a.offeringId === focus.offeringId);
  const recovery = snapshot ? calculateRecoveryPlan(snapshot) : null;
  const belowMin =
    snapshot && snapshot.conducted > 0 && snapshot.attended * snapshot.targetDenominator < snapshot.targetNumerator * snapshot.conducted;

  const deltaMins = Math.max(0, minutesUntil(current ? focus.endTime : focus.startTime));
  const hoursPart = Math.floor(deltaMins / 60);
  const minsPart = deltaMins % 60;
  const room = focus.room ?? course?.roomDefault ?? 'Room TBA';

  return (
    <section
      aria-labelledby="next-class-title"
      className="today-hero-card"
      style={{ '--hue': String(visual.hue) } as React.CSSProperties}
    >
      <Link to={scheduleLink} className="today-hero-top press">
        <div className="today-hero-countdown">
          <p className="today-countdown-label">{current ? 'Ends in' : 'Starts in'}</p>
          <p className="num today-countdown-value">
            {hoursPart > 0 ? (
              <>
                <span className="today-countdown-num">{hoursPart}h</span>
                <span className="today-countdown-unit"> {minsPart}m</span>
              </>
            ) : (
              <>
                <span className="today-countdown-num">{deltaMins}</span>
                <span className="today-countdown-unit">min</span>
              </>
            )}
            <span className="today-countdown-sub">
              {current ? 'In progress' : `At ${format12hClock(focus.startTime)} ${meridiemLabel(focus.startTime)}`}
            </span>
          </p>
        </div>

        <div className="today-hero-body">
          <p className="today-hero-kicker">
            {current ? 'Happening now' : 'Next class'}
            {course ? ` · ${course.code}` : ''}
          </p>
          <h2 id="next-class-title" className="today-hero-title">
            {focus.title}
          </h2>
          <dl className="today-hero-dl">
            <div>
              <dt className="sr-only">Time</dt>
              <dd className="num today-hero-time">
                <span className="whitespace-nowrap">
                  {format12hClock(focus.startTime)} – {format12hClock(focus.endTime)}{' '}
                  <span>{meridiemLabel(focus.endTime)} IST</span>
                </span>
              </dd>
            </div>
            <div>
              <dt className="sr-only">Room and faculty</dt>
              <dd className="today-hero-room">
                <MapPin size={14} className="shrink-0" aria-hidden="true" />
                <span>
                  Room {room}
                  {course?.faculty ? (
                    <>
                      {' · '}
                      <span className="whitespace-nowrap">{course.faculty}</span>
                    </>
                  ) : ''}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </Link>

      <div className="today-timeline-band">
        <div
          className="today-timeline-track"
          role="img"
          aria-label={`Day timeline from 9 AM to 3:40 PM. Campus time ${format12hClock(nowMin)} ${meridiemLabel(nowMin)}.`}
        >
          <div className="today-timeline-rail" />
          {meetings.map((m) => {
            if (m.kind === 'break') return null;
            const left = ((timeToMinutes(m.startTime) - DAY_START_MIN) / (DAY_END_MIN - DAY_START_MIN)) * 100;
            const width = ((timeToMinutes(m.endTime) - timeToMinutes(m.startTime)) / (DAY_END_MIN - DAY_START_MIN)) * 100;
            const isFocus = m.id === focus.id;
            const done = timeToMinutes(m.endTime) <= nowMin;
            return (
              <div
                key={m.id}
                className="today-timeline-seg"
                data-canceled={m.status === 'canceled'}
                data-focus={isFocus}
                data-done={done}
                style={{ left: `calc(${left}% + 1px)`, width: `calc(${width}% - 2px)` }}
              />
            );
          })}
          <div className="today-timeline-needle" style={{ left: `${posPct}%` }}>
            <span />
          </div>
        </div>
        <div className="num today-timeline-labels">
          <span>9 AM</span>
          <span>12 PM</span>
          <span>3:40 PM</span>
        </div>

        {belowMin && snapshot && (
          <Link
            to={`/academics/attendance?subject=${encodeURIComponent(snapshot.offeringId)}`}
            className="today-hero-alert press"
          >
            <strong>This one counts.</strong>{' '}
            <span>
              {course?.code ?? visual.shortName} is at{' '}
              <span className="num font-semibold">
                {formatPercentage(snapshot.attended, snapshot.conducted)}
              </span>
              {recovery?.status === 'recoverable' && recovery.neededClasses !== null
                ? ` — attend the next ${recovery.neededClasses} consecutive classes to reach 75%.`
                : ' — every remaining session matters.'}
            </span>
          </Link>
        )}
      </div>
    </section>
  );
}

function AcademicVitals() {
  const { attended, conducted } = getAggregateAttendance();
  const belowTarget = getBelowTargetAttendance();
  const aggPct = conducted > 0 ? (attended / conducted) * 100 : 0;
  const margin = aggPct - 75;

  const publishedResult = DEMO_SEMESTERS.map((semester) => ({
    semester,
    sgpa: getRecordedSgpa(semester.id),
  })).find(({ sgpa }) => sgpa !== undefined);
  const sgpa = publishedResult?.sgpa;
  const marksLink = publishedResult
    ? `/academics/marks?semester=${encodeURIComponent(publishedResult.semester.id)}`
    : '/academics/marks';

  return (
    <section aria-label="Academic vitals" className="today-vitals">
      <Link to="/academics/attendance" className="today-vital-cell press">
        <p className="today-vital-label">Attendance</p>
        <p className="num today-vital-value">
          {aggPct.toFixed(1)}
          <span>%</span>
        </p>
        <div className="today-vital-bar" aria-hidden="true">
          <div className="today-vital-fill" style={{ width: `${Math.min(100, aggPct)}%` }} />
          <div className="today-vital-mark" style={{ left: '75%' }} />
        </div>
        <p className="today-vital-foot">
          {conducted > 0 ? (
            <>
              <span className="num font-medium text-foreground">
                {attended} of {conducted} classes attended
              </span>
              <span className="block">
                <span className={`num font-medium ${margin >= 0 ? 'text-positive' : 'text-critical'}`}>
                  {margin >= 0 ? `+${margin.toFixed(1)}` : margin.toFixed(1)}
                </span>{' '}
                vs 75% min
                {belowTarget.length > 0 ? ` · ${belowTarget.length} subject below target` : ''}
              </span>
            </>
          ) : (
            'No classes recorded'
          )}
        </p>
      </Link>

      <Link to={marksLink} className="today-vital-cell today-vital-cell--right press">
        <p className="today-vital-label">Recorded SGPA</p>
        <p className="num today-vital-value">{sgpa !== undefined ? sgpa.toFixed(2) : '—'}</p>
        <p className="today-vital-subhead">
          {publishedResult ? publishedResult.semester.shortLabel : 'Semester result'}
        </p>
        <p className="today-vital-foot">
          {publishedResult ? 'Finalized result' : 'Awaiting results'}
          {publishedResult?.semester.id !== DEMO_STUDENT.currentSemesterId ? ' · Sem 5 in progress' : ''}
        </p>
      </Link>
    </section>
  );
}

function DoNextList({ actions }: { actions: readonly TodayAction[] }) {
  return (
    <section aria-labelledby="do-next-title">
      <SectionHeader id="do-next-title" title="Needs your attention" />
      {actions.length === 0 ? (
        <p className="text-sm text-muted-foreground">You’re all caught up.</p>
      ) : (
        <ol className="today-actions-card">
          {actions.map((action, index) => (
            <li key={action.id} className={index > 0 ? 'today-action-divider' : undefined}>
              <Link to={action.to} className="today-action-row press">
                <span className="num today-action-num">{index + 1}</span>
                <span className="min-w-0 flex-1">
                  <strong className="today-action-title">{action.title}</strong>
                  <span className="today-action-detail">{action.detail}</span>
                </span>
                <span className="today-action-badge" data-urgency={action.urgency}>
                  {action.label}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function TodayScheduleList({
  meetings,
  current,
  next,
}: {
  meetings: readonly ScheduleMeeting[];
  current?: ScheduleMeeting;
  next?: ScheduleMeeting;
}) {
  return (
    <section aria-labelledby="today-schedule-title">
      <SectionHeader
        id="today-schedule-title"
        title="Today’s schedule"
        action={
          <Link to={`/schedule?date=${encodeURIComponent(DEMO_TODAY_DATE)}&view=week`} className="today-inline-link">
            Week
          </Link>
        }
      />
      {meetings.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing scheduled today.</p>
      ) : (
        <ol className="today-schedule-list">
          {meetings.map((m) => {
            if (m.kind === 'break') {
              return (
                <li key={m.id} className="today-break-row">
                  <span className="num today-sched-time">{format12hClock(m.startTime)}</span>
                  <span className="today-break-line" />
                  <span>{m.title}</span>
                  <span className="today-break-line today-break-line--short" />
                </li>
              );
            }

            const visual = getCourseVisual(m.offeringId, m.title);
            const canceled = m.status === 'canceled';
            const done = !canceled && m.endTime <= DEMO_CURRENT_TIME;
            const live = m.id === current?.id;
            const isNext = m.id === next?.id;

            return (
              <li
                key={m.id}
                className={`today-sched-row ${done ? 'opacity-50' : ''}`}
                style={{ '--hue': String(visual.hue) } as React.CSSProperties}
              >
                <span className="num today-sched-time">
                  {format12hClock(m.startTime)}
                  <span>{meridiemLabel(m.startTime)}</span>
                </span>
                <span className={`today-sched-pill ${canceled ? 'bg-hairline' : 'tint-bar'}`} />
                <span className="min-w-0 flex-1">
                  <span className={`today-sched-title ${canceled ? 'line-through text-muted-foreground' : ''}`}>
                    {m.title}
                  </span>
                  <span className="today-sched-sub">
                    {canceled ? (
                      <span className="font-medium text-critical">Canceled</span>
                    ) : (
                      <>
                        {m.room ? `Room ${m.room}` : 'Room TBA'}
                        {live && <span className="ml-1.5 font-medium text-cobalt">· Now</span>}
                        {!live && isNext && <span className="ml-1.5 font-medium text-cobalt">· Next</span>}
                      </>
                    )}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function AroundCampus() {
  const upcoming = getUpcomingEvents().slice(0, 3);
  return (
    <section aria-labelledby="around-campus-title">
      <SectionHeader
        id="around-campus-title"
        title="Around campus"
        action={
          <Link to="/events" className="today-inline-link">
            All events
          </Link>
        }
      />
      <ul className="today-events-list no-scrollbar">
        {upcoming.map((event) => (
          <li key={event.id} className="today-event-item">
            <Link
              to={`/events?event=${encodeURIComponent(event.id)}`}
              className="today-event-link press"
            >
              <EventArtwork event={event} variant="card" className="today-event-poster" />
              <span className="today-event-copy">
                <span className="today-event-kicker">
                  {event.category} · {new Intl.DateTimeFormat('en-IN', {
                    timeZone: DEMO_TIMEZONE,
                    day: 'numeric',
                    month: 'short',
                  }).format(new Date(event.startIso))}
                </span>
                <strong>{event.title}</strong>
                <span>{event.venue}</span>
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
      />

      <div className="today-grid">
        <div className="today-main-col">
          <NextClassHero current={current} next={next} meetings={meetings} />
          <AcademicVitals />
          <div className="today-actions-mobile">
            <DoNextList actions={actions} />
          </div>
          <TodayScheduleList meetings={meetings} current={current} next={next} />
        </div>

        <div className="today-side-col">
          <div className="today-actions-desktop">
            <DoNextList actions={actions} />
          </div>
          <AroundCampus />
        </div>
      </div>
    </div>
  );
}
