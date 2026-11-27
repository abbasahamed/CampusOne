import { useEffect, useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin, User } from 'lucide-react';
import { Button, IconButton } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { SegmentedControl } from '../../components/SegmentedControl';
import { StatusBadge } from '../../components/StatusBadge';
import { PageHeader } from '../../components/Typography';
import {
  DEMO_ATTENDANCE,
  DEMO_CURRENT_TIME,
  DEMO_TIMEZONE,
  DEMO_TODAY_DATE,
} from '../../data/demoData';
import type { ScheduleMeeting } from '../../data/types';
import {
  format12hClock,
  getCourseVisual,
  meridiemLabel,
  timeToMinutes,
} from '../../domain/courseVisuals';
import { formatCampusDate, formatPercentage } from '../../domain/format';
import {
  DEMO_WEEK_DATES,
  getScheduleMeetingsByDate,
  getValidatedScheduleDate,
} from '../../domain/schedule';
import {
  getCourseOffering,
  getCurrentClassOnDate,
  getNextClassOnDate,
} from '../../domain/selectors';
import './schedule.css';

type ScheduleView = 'day' | 'week';

const GRID_START_MIN = 8 * 60 + 30;
const GRID_END_MIN = 16 * 60;
const GRID_PX_PER_MIN = 1.15;
const GRID_HOURS = [9, 10, 11, 12, 13, 14, 15, 16];

function getMeetingState(
  meeting: ScheduleMeeting,
  date: string,
  currentId?: string,
  nextId?: string,
): string {
  if (meeting.status === 'canceled') return 'Canceled';
  if (meeting.kind === 'break') return 'Break';
  if (date < DEMO_TODAY_DATE) return 'Completed';
  if (date > DEMO_TODAY_DATE) return 'Scheduled';
  if (meeting.id === currentId) return 'In progress';
  if (meeting.id === nextId) return 'Next';
  if (meeting.endTime <= DEMO_CURRENT_TIME) return 'Completed';
  return 'Upcoming';
}

function formatDayChip(date: string) {
  const d = new Date(`${date}T00:00:00+05:30`);
  const weekday = new Intl.DateTimeFormat('en-IN', {
    timeZone: DEMO_TIMEZONE,
    weekday: 'short',
  }).format(d);
  const day = new Intl.DateTimeFormat('en-IN', {
    timeZone: DEMO_TIMEZONE,
    day: 'numeric',
  }).format(d);
  return { weekday, day };
}

function useAllowProportionalGrid(): boolean {
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    const evaluate = () => {
      const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const vw = document.documentElement.clientWidth || window.innerWidth;
      setAllowed(rootPx <= 21 && vw >= 340);
    };
    evaluate();
    window.addEventListener('resize', evaluate);
    const mo =
      typeof MutationObserver !== 'undefined' ? new MutationObserver(evaluate) : null;
    mo?.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });
    return () => {
      window.removeEventListener('resize', evaluate);
      mo?.disconnect();
    };
  }, []);

  return allowed;
}

function HourRail() {
  return (
    <div
      className="hour-rail"
      style={{ height: (GRID_END_MIN - GRID_START_MIN) * GRID_PX_PER_MIN }}
      aria-hidden="true"
    >
      {GRID_HOURS.map((h) => (
        <span
          key={h}
          className="num hour-rail-label"
          style={{ top: (h * 60 - GRID_START_MIN) * GRID_PX_PER_MIN }}
        >
          {((h + 11) % 12) + 1} {h >= 12 ? 'PM' : 'AM'}
        </span>
      ))}
    </div>
  );
}

function ProportionalDayColumn({
  date,
  meetings,
  currentId,
  nextId,
  compact = false,
  onOpenClass,
}: {
  date: string;
  meetings: readonly ScheduleMeeting[];
  currentId?: string;
  nextId?: string;
  compact?: boolean;
  onOpenClass: (m: ScheduleMeeting) => void;
}) {
  const nowMin = timeToMinutes(DEMO_CURRENT_TIME);
  const showNow =
    date === DEMO_TODAY_DATE && nowMin >= GRID_START_MIN && nowMin <= GRID_END_MIN;

  return (
    <ol
      className="prop-day-col"
      style={{ height: (GRID_END_MIN - GRID_START_MIN) * GRID_PX_PER_MIN }}
      aria-label={`Schedule on ${formatCampusDate(date)}`}
    >
      {GRID_HOURS.map((h) => (
        <li
          key={h}
          aria-hidden="true"
          className="prop-hour-line"
          style={{ top: (h * 60 - GRID_START_MIN) * GRID_PX_PER_MIN }}
        />
      ))}

      {meetings.length === 0 && (
        <li className="prop-empty-day-note">
          <span>No classes</span>
        </li>
      )}

      {meetings.map((m) => {
        const startMin = timeToMinutes(m.startTime);
        const endMin = timeToMinutes(m.endTime);
        const top = (startMin - GRID_START_MIN) * GRID_PX_PER_MIN;
        const height = Math.max(28, (endMin - startMin) * GRID_PX_PER_MIN);

        if (m.kind === 'break') {
          return (
            <li
              key={m.id}
              className="prop-break-slot"
              style={{ top: top + 2, height: height - 4 }}
            >
              <span>{m.title}</span>
            </li>
          );
        }

        const course = getCourseOffering(m.offeringId);
        const visual = getCourseVisual(m.offeringId, m.title);
        const state = getMeetingState(m, date, currentId, nextId);
        const canceled = m.status === 'canceled';
        const done = state === 'Completed';
        const live = state === 'In progress';
        const roomShort = m.room ?? course?.roomDefault ?? 'TBA';

        return (
          <li
            key={m.id}
            className="prop-class-slot"
            style={
              {
                top: top + 1.5,
                height: height - 3,
                '--hue': String(visual.hue),
              } as CSSProperties
            }
          >
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => onOpenClass(m)}
              className={`prop-class-btn press ${
                canceled
                  ? 'prop-class-btn--canceled'
                  : done
                    ? 'tint-bg-past tint-ink'
                    : 'tint-bg tint-ink'
              } ${live ? 'prop-class-btn--live' : ''}`}
            >
              <span className={`prop-class-title ${canceled ? 'line-through' : ''}`}>
                {compact ? (course?.code ?? visual.shortName) : m.title}
              </span>
              <span className="num prop-class-meta">
                {canceled
                  ? 'Canceled'
                  : compact
                    ? roomShort
                    : `${format12hClock(m.startTime)}–${format12hClock(m.endTime)}${m.room ? ` · ${m.room}` : ''}`}
              </span>
              {compact && height > 74 && !canceled && (
                <span className="num prop-class-faculty">{format12hClock(m.startTime)}–{format12hClock(m.endTime)}</span>
              )}
              {!compact && height > 74 && !canceled && course?.faculty && (
                <span className="prop-class-faculty">{course.faculty}</span>
              )}
            </button>
          </li>
        );
      })}

      {showNow && (
        <li
          aria-label={`Campus time ${format12hClock(DEMO_CURRENT_TIME)} ${meridiemLabel(DEMO_CURRENT_TIME)}`}
          className="prop-now-line"
          style={{ top: (nowMin - GRID_START_MIN) * GRID_PX_PER_MIN }}
        >
          <span className="prop-now-dot" />
          <span className="prop-now-rule" />
        </li>
      )}
    </ol>
  );
}

function AgendaFallbackDay({
  date,
  meetings,
  currentId,
  nextId,
  onOpenClass,
}: {
  date: string;
  meetings: readonly ScheduleMeeting[];
  currentId?: string;
  nextId?: string;
  onOpenClass: (m: ScheduleMeeting) => void;
}) {
  return (
    <ol className="agenda-fallback-list">
      {meetings.map((m) => {
        const state = getMeetingState(m, date, currentId, nextId);
        const visual = getCourseVisual(m.offeringId, m.title);
        if (m.kind === 'break') {
          return (
            <li key={m.id} className="agenda-fallback-break">
              <span className="num">
                {m.startTime}–{m.endTime}
              </span>
              <span>{m.title}</span>
            </li>
          );
        }
        return (
          <li
            key={m.id}
            style={{ '--hue': String(visual.hue) } as CSSProperties}
          >
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => onOpenClass(m)}
              className={`agenda-fallback-card press ${
                m.status === 'canceled' ? 'prop-class-btn--canceled' : 'tint-bg tint-ink'
              }`}
            >
              <span className="num text-[0.75rem] opacity-85">
                {m.startTime}–{m.endTime} IST
              </span>
              <strong className={m.status === 'canceled' ? 'line-through' : undefined}>
                {m.title}
              </strong>
              <span className="text-[0.8125rem] opacity-85">
                {[m.room, state !== 'Scheduled' && state !== 'Upcoming' ? state : '']
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export function Timetable() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [openMeeting, setOpenMeeting] = useState<ScheduleMeeting | null>(null);
  const allowProportional = useAllowProportionalGrid();

  const selectedDate = getValidatedScheduleDate(searchParams.get('date'));
  const rawView = searchParams.get('view');
  const view: ScheduleView = rawView === 'week' ? 'week' : 'day';

  const meetings = getScheduleMeetingsByDate(selectedDate);
  const isToday = selectedDate === DEMO_TODAY_DATE;
  const current = isToday ? getCurrentClassOnDate(DEMO_TODAY_DATE) : undefined;
  const next = isToday ? getNextClassOnDate(DEMO_TODAY_DATE) : undefined;
  const selectedIndex = DEMO_WEEK_DATES.indexOf(
    selectedDate as (typeof DEMO_WEEK_DATES)[number],
  );

  const classesOnly = meetings.filter((m) => m.kind === 'class');
  const scheduledClasses = classesOnly.filter((m) => m.status === 'scheduled');
  const canceledCount = classesOnly.length - scheduledClasses.length;
  const hoursTotal =
    scheduledClasses.reduce(
      (sum, m) => sum + timeToMinutes(m.endTime) - timeToMinutes(m.startTime),
      0,
    ) / 60;

  function updateQuery(nextDate: string, nextView: ScheduleView = view) {
    setSearchParams({ date: nextDate, view: nextView }, { replace: true });
  }

  function stepDate(delta: number) {
    const idx = Math.max(
      0,
      Math.min(DEMO_WEEK_DATES.length - 1, (selectedIndex >= 0 ? selectedIndex : 4) + delta),
    );
    const target = DEMO_WEEK_DATES[idx];
    if (target) updateQuery(target);
  }

  const openCourse = openMeeting ? getCourseOffering(openMeeting.offeringId) : undefined;
  const openSnapshot = openMeeting?.offeringId
    ? DEMO_ATTENDANCE.find((a) => a.offeringId === openMeeting.offeringId)
    : undefined;

  return (
    <div className="schedule-page">
      <PageHeader
        eyebrow="November 2026"
        title="Timetable"
        actions={
          <div className="schedule-header-actions">
            {!isToday && (
              <Button variant="secondary" onClick={() => updateQuery(DEMO_TODAY_DATE)}>
                Today
              </Button>
            )}
            <SegmentedControl
              label="Timetable view"
              value={view}
              onChange={(v) => updateQuery(selectedDate, v)}
              options={[
                { value: 'day', label: 'Day' },
                { value: 'week', label: 'Week' },
              ]}
            />
          </div>
        }
      />

      <section className="week-strip-wrap" aria-label="Select date in week">
        <IconButton
          label="Previous day"
          variant="secondary"
          disabled={selectedIndex <= 0}
          onClick={() => stepDate(-1)}
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </IconButton>

        <div className="week-strip" role="radiogroup" aria-label="Week days">
          {DEMO_WEEK_DATES.map((date) => {
            const { weekday, day } = formatDayChip(date);
            const active = date === selectedDate;
            const dateIsToday = date === DEMO_TODAY_DATE;

            return (
              <button
                key={date}
                type="button"
                role="radio"
                aria-checked={active}
                aria-current={dateIsToday ? 'date' : undefined}
                onClick={() => {
                  updateQuery(date);
                  if (view === 'week') {
                    document
                      .getElementById(`week-day-${date}`)
                      ?.scrollIntoView({ block: 'nearest' });
                  }
                }}
                className="day-chip press"
                data-selected={active}
                data-today={dateIsToday}
              >
                <span className="day-chip-weekday">{weekday}</span>
                <strong className="day-chip-num num">{day}</strong>
                <span className="day-chip-dot" aria-hidden="true" />
                {dateIsToday && <span className="sr-only"> (today)</span>}
              </button>
            );
          })}
        </div>

        <IconButton
          label="Next day"
          variant="secondary"
          disabled={selectedIndex >= DEMO_WEEK_DATES.length - 1}
          onClick={() => stepDate(1)}
        >
          <ChevronRight size={18} aria-hidden="true" />
        </IconButton>
      </section>

      {view === 'day' ? (
        <section aria-labelledby="selected-day-heading" className="day-agenda-section">
          <div className="day-agenda-head">
            <div>
              <h2 id="selected-day-heading">{formatCampusDate(selectedDate)}</h2>
              {meetings.length > 0 && (
                <p className="day-agenda-meta">
                  <span className="num">{scheduledClasses.length}</span>{' '}
                  {scheduledClasses.length === 1 ? 'class' : 'classes'} ·{' '}
                  <span className="num">{hoursTotal.toFixed(1)}</span> hrs
                  {canceledCount > 0 && (
                    <span className="text-critical"> · {canceledCount} canceled</span>
                  )}
                </p>
              )}
            </div>
            {isToday && <span className="day-timezone">Campus time · IST</span>}
          </div>

          {meetings.length === 0 ? (
            <div className="schedule-empty">
              <h3>No classes scheduled</h3>
              <p>
                There are no teaching sessions or campus blocks recorded for{' '}
                {formatCampusDate(selectedDate)}.
              </p>
              {!isToday && (
                <Button variant="secondary" onClick={() => updateQuery(DEMO_TODAY_DATE)}>
                  Return to Today
                </Button>
              )}
            </div>
          ) : allowProportional ? (
            <div className="prop-day-grid">
              <HourRail />
              <ProportionalDayColumn
                date={selectedDate}
                meetings={meetings}
                currentId={current?.id}
                nextId={next?.id}
                onOpenClass={setOpenMeeting}
              />
            </div>
          ) : (
            <AgendaFallbackDay
              date={selectedDate}
              meetings={meetings}
              currentId={current?.id}
              nextId={next?.id}
              onOpenClass={setOpenMeeting}
            />
          )}
        </section>
      ) : (
        <section aria-label="Weekly timetable" className="week-view-section">
          {allowProportional && (
            <div className="desktop-week-grid">
              <div className="desktop-week-headers">
                <span />
                {DEMO_WEEK_DATES.map((date) => {
                  const { weekday, day } = formatDayChip(date);
                  const active = date === selectedDate;
                  const dateIsToday = date === DEMO_TODAY_DATE;
                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => updateQuery(date, 'day')}
                      className="desktop-week-day-btn press"
                      data-selected={active}
                      data-today={dateIsToday}
                    >
                      <span>{weekday}</span>
                      <strong className="num">{day}</strong>
                    </button>
                  );
                })}
              </div>

              <div className="desktop-week-columns">
                <HourRail />
                {DEMO_WEEK_DATES.map((date) => {
                  const dayMeetings = getScheduleMeetingsByDate(date);
                  const dateIsToday = date === DEMO_TODAY_DATE;
                  const dayCurrent = dateIsToday ? getCurrentClassOnDate(date) : undefined;
                  const dayNext = dateIsToday ? getNextClassOnDate(date) : undefined;
                  return (
                    <div
                      key={date}
                      id={`week-day-${date}`}
                      className="desktop-week-col"
                      data-selected={date === selectedDate}
                    >
                      <ProportionalDayColumn
                        date={date}
                        meetings={dayMeetings}
                        currentId={dayCurrent?.id}
                        nextId={dayNext?.id}
                        compact
                        onOpenClass={setOpenMeeting}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className={allowProportional ? 'mobile-week-cards' : 'mobile-week-cards mobile-week-cards--always'}>
            {DEMO_WEEK_DATES.map((date) => {
              const dayMeetings = getScheduleMeetingsByDate(date);
              const dateIsToday = date === DEMO_TODAY_DATE;
              const isSelected = date === selectedDate;
              const dayCurrent = dateIsToday ? getCurrentClassOnDate(date) : undefined;
              const dayNext = dateIsToday ? getNextClassOnDate(date) : undefined;

              return (
                <section
                  key={date}
                  id={`week-day-card-${date}`}
                  className="week-day-group"
                  data-selected={isSelected}
                >
                  <header className="week-day-header">
                    <button
                      type="button"
                      onClick={() => updateQuery(date, 'day')}
                      className="week-day-title-btn"
                    >
                      <span>{formatCampusDate(date)}</span>
                      {dateIsToday && <StatusBadge label="Today" tone="accent" />}
                    </button>
                  </header>
                  {dayMeetings.length === 0 ? (
                    <p className="week-day-empty">No classes scheduled</p>
                  ) : (
                    <ul className="week-day-list">
                      {dayMeetings.map((m) => {
                        const state = getMeetingState(m, date, dayCurrent?.id, dayNext?.id);
                        return (
                          <li key={m.id}>
                            <button
                              type="button"
                              aria-haspopup="dialog"
                              disabled={m.kind === 'break'}
                              onClick={() => m.kind === 'class' && setOpenMeeting(m)}
                              className="week-day-item"
                              data-state={state}
                            >
                              <span className="num week-item-time">
                                {m.startTime}–{m.endTime}
                              </span>
                              <div className="week-item-copy">
                                <strong className={m.status === 'canceled' ? 'line-through' : undefined}>
                                  {m.title}
                                </strong>
                                <span>
                                  {[
                                    m.room,
                                    ['Next', 'In progress', 'Canceled'].includes(state)
                                      ? state
                                      : '',
                                  ]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </span>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        </section>
      )}

      <Dialog
        open={openMeeting !== null}
        onClose={() => setOpenMeeting(null)}
        title={openMeeting?.title ?? 'Class details'}
        description={
          openCourse
            ? `${openCourse.code} · ${openCourse.credits === 0 ? 'Audit' : `${openCourse.credits} credits`}`
            : undefined
        }
        footer={
          openMeeting?.offeringId ? (
            <Link
              to={`/academics/attendance?subject=${encodeURIComponent(openMeeting.offeringId)}`}
              className="class-sheet-link press"
              onClick={() => setOpenMeeting(null)}
            >
              Open attendance plan
            </Link>
          ) : (
            <Button variant="secondary" onClick={() => setOpenMeeting(null)}>
              Done
            </Button>
          )
        }
      >
        {openMeeting && (
          <div className="class-sheet-body">
            {openMeeting.status === 'canceled' && (
              <p className="class-sheet-canceled">
                <strong>Canceled.</strong> This session will not take place as scheduled.
              </p>
            )}
            <dl className="class-sheet-dl">
              <div>
                <dt>Time</dt>
                <dd className="num">
                  {format12hClock(openMeeting.startTime)} –{' '}
                  {format12hClock(openMeeting.endTime)} {meridiemLabel(openMeeting.endTime)} IST
                </dd>
              </div>
              <div>
                <dt>
                  <MapPin size={15} aria-hidden="true" />
                  <span>Room</span>
                </dt>
                <dd>{openMeeting.room ?? openCourse?.roomDefault ?? 'To be announced'}</dd>
              </div>
              {openCourse?.faculty && (
                <div>
                  <dt>
                    <User size={15} aria-hidden="true" />
                    <span>Faculty</span>
                  </dt>
                  <dd>{openCourse.faculty}</dd>
                </div>
              )}
              {openSnapshot && (
                <div>
                  <dt>Your attendance</dt>
                  <dd
                    className={`num font-semibold ${
                      openSnapshot.conducted > 0 &&
                      openSnapshot.attended * openSnapshot.targetDenominator <
                        openSnapshot.targetNumerator * openSnapshot.conducted
                        ? 'text-critical'
                        : 'text-foreground'
                    }`}
                  >
                    {formatPercentage(openSnapshot.attended, openSnapshot.conducted)} ·{' '}
                    {openSnapshot.attended}/{openSnapshot.conducted}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </Dialog>
    </div>
  );
}
