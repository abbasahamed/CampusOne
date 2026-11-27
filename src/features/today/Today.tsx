import {
  ArrowRight, ArrowUpRight, CalendarX2, Clock3, MapPin, TriangleAlert, Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DEMO_ATTENDANCE, DEMO_CLOCK_ISO, DEMO_CURRENT_TIME, DEMO_SEMESTERS, DEMO_STUDENT,
  DEMO_TODAY_DATE, DEMO_TIMEZONE,
} from '../../data/demoData';
import type { ScheduleMeeting } from '../../data/types';
import { formatCampusDate, formatPercentage, formatShortDate, formatTimeRange } from '../../domain/format';
import {
  getAggregateAttendance, getBelowTargetAttendance, getCurrentClassOnDate, getNextClassOnDate,
  getRecordedSgpa, getScheduleOnDate, getUpcomingEvents,
} from '../../domain/selectors';
import { getScheduleLink, getTodayActions, minutesUntil, type TodayAction } from '../../domain/today';
import './today.css';

const actionIcons = { attendance: TriangleAlert, fee: Wallet, schedule: CalendarX2 };
const scheduleLink = getScheduleLink(DEMO_TODAY_DATE);

function ClassTicket({ current, next, hasClasses }: {
  current?: ScheduleMeeting;
  next?: ScheduleMeeting;
  hasClasses: boolean;
}) {
  const meeting = current ?? next;
  const minutes = meeting ? minutesUntil(current ? meeting.endTime : meeting.startTime) : 0;
  const remaining = minutes >= 60
    ? `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}`
    : `${minutes} min`;

  return (
    <section className="class-ticket" aria-labelledby="class-title">
      <div className="ticket-heading">
        <p className="ticket-status">
          <span aria-hidden="true" />
          {current ? 'In progress' : meeting ? 'Next class' : 'Timetable'}
        </p>
        <h2 id="class-title">{meeting?.title ?? (hasClasses ? 'Classes are done for today' : 'No classes today')}</h2>
        {meeting && (
          <div className="ticket-details">
            <span><Clock3 size={16} aria-hidden="true" />{formatTimeRange(meeting.startTime, meeting.endTime)}</span>
            <span><MapPin size={16} aria-hidden="true" />{meeting.room ? `Room ${meeting.room}` : 'Room to be announced'}</span>
          </div>
        )}
        <Link to={scheduleLink} className="ticket-link">
          View timetable <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </div>
      {meeting && (
        <div className="ticket-countdown">
          <span>{current ? 'Time left' : 'Starts in'}</span>
          <strong>{remaining}</strong>
        </div>
      )}
    </section>
  );
}

function ActionCentre({ actions }: { actions: readonly TodayAction[] }) {
  return (
    <section className="today-actions" aria-labelledby="action-title">
      <h2 id="action-title">Action centre</h2>
      {actions.length === 0 ? <p className="today-muted today-empty">You’re all caught up.</p> : (
        <ul className="action-list">
          {actions.map(({ id, kind, title, detail, label, to }) => {
            const Icon = actionIcons[kind];
            return (
              <li key={id}>
                <Link to={to} className="action-row">
                  <span className={`action-icon action-icon--${kind}`}><Icon size={19} aria-hidden="true" /></span>
                  <span className="action-copy">
                    <strong>{title}</strong>
                    <span className="today-muted">{detail}</span>
                  </span>
                  <span className="action-link">{label}<ArrowRight size={16} aria-hidden="true" /></span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function AcademicOverview() {
  const { attended, conducted } = getAggregateAttendance();
  const belowTarget = getBelowTargetAttendance().length;
  const firstSnapshot = DEMO_ATTENDANCE[0];
  const commonTarget = firstSnapshot && DEMO_ATTENDANCE.every(
    (entry) => entry.targetNumerator * firstSnapshot.targetDenominator
      === firstSnapshot.targetNumerator * entry.targetDenominator,
  ) ? firstSnapshot.targetNumerator / firstSnapshot.targetDenominator * 100 : undefined;
  const publishedResult = DEMO_SEMESTERS
    .map((semester) => ({ semester, sgpa: getRecordedSgpa(semester.id) }))
    .find(({ sgpa }) => sgpa !== undefined);
  const sgpa = publishedResult?.sgpa;
  const marksLink = publishedResult
    ? `/academics/marks?semester=${encodeURIComponent(publishedResult.semester.id)}`
    : '/academics/marks';

  return (
    <section className="today-academics" aria-labelledby="academic-title">
      <h2 id="academic-title">Academic overview</h2>
      <div className="overview-metrics">
        <Link to="/academics/attendance" className="overview-metric">
          <span className="metric-label">Attendance <ArrowUpRight size={15} aria-hidden="true" /></span>
          <strong className="metric-value">{formatPercentage(attended, conducted)}</strong>
          {conducted > 0 ? (
            <>
              <span className="attendance-track" aria-hidden="true">
                <span className="attendance-fill" style={{ width: `${attended / conducted * 100}%` }} />
                {commonTarget !== undefined && <span className="attendance-target" style={{ left: `${commonTarget}%` }} />}
              </span>
              <span className="today-muted">
                {attended} of {conducted} classes{commonTarget !== undefined && ` · ${Number(commonTarget.toFixed(1))}% target`}
              </span>
              {belowTarget > 0 && (
                <span className="metric-risk"><TriangleAlert size={14} aria-hidden="true" />{belowTarget} {belowTarget === 1 ? 'subject' : 'subjects'} below target</span>
              )}
            </>
          ) : <span className="today-muted">No classes recorded</span>}
        </Link>
        <Link to={marksLink} className="overview-metric">
          <span className="metric-label">Recorded SGPA <ArrowUpRight size={15} aria-hidden="true" /></span>
          <strong className="metric-value">{sgpa?.toFixed(2) ?? '—'}</strong>
          <span className="today-muted">{publishedResult ? `${publishedResult.semester.shortLabel} result` : 'Awaiting a published result'}</span>
          {publishedResult?.semester.id !== DEMO_STUDENT.currentSemesterId && (
            <span className="today-muted">Current semester in progress</span>
          )}
        </Link>
      </div>
    </section>
  );
}

function TodayAgenda({ meetings, current, next }: {
  meetings: readonly ScheduleMeeting[];
  current?: ScheduleMeeting;
  next?: ScheduleMeeting;
}) {
  return (
    <section className="today-agenda" aria-labelledby="agenda-title">
      <h2 id="agenda-title">Today’s schedule</h2>
      {meetings.length === 0 ? <p className="today-muted today-empty">Nothing scheduled today.</p> : (
        <ol className="agenda-list">
          {meetings.map((meeting) => {
            const { id, startTime, endTime, status, kind, title, room } = meeting;
            const state = status === 'canceled' ? 'Canceled'
              : id === current?.id ? 'In progress'
              : id === next?.id ? 'Next'
              : endTime <= DEMO_CURRENT_TIME ? 'Completed'
              : kind === 'break' ? 'Break' : 'Upcoming';
            return (
              <li key={id} className="agenda-item" data-state={state}>
                <div className="agenda-time">
                  <time dateTime={startTime}>{startTime}</time>
                  <time dateTime={endTime}>{endTime}</time>
                </div>
                <div className="agenda-content">
                  <strong>{title}</strong>
                  <span className="agenda-detail">
                    {room && <span>{room}</span>}
                    <span className="agenda-state">{state}</span>
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function CampusDiscovery() {
  const upcoming = getUpcomingEvents();
  const featured = upcoming.find(({ featured }) => featured);
  const events = featured ? [featured, ...upcoming.filter(({ id }) => id !== featured.id)].slice(0, 2) : upcoming.slice(0, 2);

  return (
    <section className="today-discovery" aria-labelledby="discovery-title">
      <div className="discovery-header">
        <h2 id="discovery-title">Around campus</h2>
        <Link to="/events" className="discovery-all">All events <ArrowUpRight size={16} aria-hidden="true" /></Link>
      </div>
      {events.length === 0 ? <p className="today-muted today-empty">No upcoming campus events.</p> : (
        <ul className="discovery-list">
          {events.map((event) => {
            const [day, month] = formatShortDate(event.startIso).split(' ');
            return (
              <li key={event.id}>
                <Link to={`/events?event=${encodeURIComponent(event.id)}`} className="discovery-link">
                  <time dateTime={event.startIso} className="discovery-date">
                    <strong>{day}</strong><span>{month}</span>
                  </time>
                  <span className="discovery-copy">
                    <span className="discovery-category">{event.category}</span>
                    <strong>{event.title}</strong>
                    <span className="today-muted">{event.venue}</span>
                  </span>
                  <ArrowUpRight size={17} className="discovery-arrow" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function Today() {
  const meetings = getScheduleOnDate();
  const current = getCurrentClassOnDate();
  const next = getNextClassOnDate();
  const actions = getTodayActions(meetings);
  const hour = Number(DEMO_CURRENT_TIME.split(':')[0]);
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const eventDate = new Intl.DateTimeFormat('en-IN', {
    timeZone: DEMO_TIMEZONE, weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date(DEMO_CLOCK_ISO));

  return (
    <div className="today">
      <header className="today-header">
        <p className="today-dateline">
          <time dateTime={DEMO_TODAY_DATE} title={formatCampusDate(DEMO_TODAY_DATE)}>{eventDate}</time>
          <span>Demo · {DEMO_CURRENT_TIME} IST</span>
        </p>
        <h1 tabIndex={-1}>{greeting}, {DEMO_STUDENT.name.split(' ')[0]}</h1>
      </header>

      <div className="today-layout">
        <ClassTicket current={current} next={next} hasClasses={meetings.some((meeting) => meeting.kind === 'class' && meeting.status === 'scheduled')} />
        <AcademicOverview />
        <ActionCentre actions={actions} />
        <TodayAgenda meetings={meetings} current={current} next={next} />
        <CampusDiscovery />
      </div>
    </div>
  );
}
