import { useSearchParams } from 'react-router-dom';
import type { CSSProperties } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, IconButton } from '../../components/Button';
import { SegmentedControl } from '../../components/SegmentedControl';
import { StatusBadge } from '../../components/StatusBadge';
import { PageHeader } from '../../components/Typography';
import { DEMO_CURRENT_TIME, DEMO_TIMEZONE, DEMO_TODAY_DATE } from '../../data/demoData';
import type { ScheduleMeeting } from '../../data/types';
import { formatCampusDate } from '../../domain/format';
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
import { minutesUntil } from '../../domain/today';
import './schedule.css';

type ScheduleView = 'day' | 'week';

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

function DaySchedule({ meetings, date, currentId, nextId }: {
  meetings: readonly ScheduleMeeting[];
  date: string;
  currentId?: string;
  nextId?: string;
}) {
  const startAt = (time: string) => minutesUntil(time, '00:00');
  const first = startAt(meetings[0]!.startTime);
  const last = Math.max(...meetings.map((meeting) => startAt(meeting.endTime)));
  const now = startAt(DEMO_CURRENT_TIME);
  const start = Math.floor(Math.min(first, date === DEMO_TODAY_DATE && now >= first - 60 ? now : first) / 60) * 60;
  const end = Math.ceil(last / 60) * 60;
  const positioned = meetings.every((meeting, index) => {
    const previous = meetings[index - 1];
    return startAt(meeting.endTime) - startAt(meeting.startTime) >= 45
      && (!previous || startAt(previous.endTime) <= startAt(meeting.startTime));
  });
  const showNow = date === DEMO_TODAY_DATE && now >= start && now <= end;
  const hours = Array.from({ length: (end - start) / 60 + 1 }, (_, index) => start + index * 60);

  return (
    <div className="day-plan" data-positioned={positioned} style={{ '--span': end - start } as CSSProperties}>
      {positioned && (
        <div className="clock-grid" aria-hidden="true">
          {hours.map((hour) => (
            <div key={hour} className="clock-line" style={{ '--offset': hour - start } as CSSProperties}>
              <span>{String(Math.floor(hour / 60)).padStart(2, '0')}:00</span>
            </div>
          ))}
        </div>
      )}
      {showNow && (
        <div className="clock-now" style={{ '--offset': now - start } as CSSProperties}>
          <span><span className="sr-only">Campus time </span>{DEMO_CURRENT_TIME}</span>
        </div>
      )}
      {showNow && <p className="agenda-now"><time dateTime={DEMO_CURRENT_TIME}>{DEMO_CURRENT_TIME}</time><span>Now</span></p>}
      <ol className="timetable-rail">
        {meetings.map((meeting) => {
          const state = getMeetingState(meeting, date, currentId, nextId);
          const course = getCourseOffering(meeting.offeringId);
          return (
            <li key={meeting.id} className="rail-entry" data-state={state} data-course={course?.code}
              style={{ '--offset': startAt(meeting.startTime) - start, '--length': startAt(meeting.endTime) - startAt(meeting.startTime) } as CSSProperties}>
              <div className="rail-time tabular-nums">
                <time dateTime={meeting.startTime}>{meeting.startTime}</time>
                <time dateTime={meeting.endTime}>{meeting.endTime}</time>
              </div>
              <div className="rail-card">
                <div className="rail-card-top">
                  <h3>{meeting.title}</h3>
                  {['Next', 'In progress', 'Canceled'].includes(state) && <span className="rail-state">{state}</span>}
                </div>
                <p className="rail-meta">
                  <span className="calendar-event-time tabular-nums">{meeting.startTime}–{meeting.endTime}</span>
                  {meeting.room && <span>{meeting.room}</span>}
                  {course?.faculty && <span>{course.faculty}</span>}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function Timetable() {
  const [searchParams, setSearchParams] = useSearchParams();
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

  return (
    <div className="schedule-page">
      <PageHeader
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

        <div className="week-strip" role="group" aria-label="Week days">
          {DEMO_WEEK_DATES.map((date) => {
            const { weekday, day } = formatDayChip(date);
            const active = date === selectedDate;
            const hasItems = getScheduleMeetingsByDate(date).some(
              (m) => m.kind === 'class' && m.status === 'scheduled',
            );
            const dateIsToday = date === DEMO_TODAY_DATE;

            return (
              <button
                key={date}
                type="button"
                aria-pressed={active}
                aria-current={dateIsToday ? 'date' : undefined}
                onClick={() => {
                  updateQuery(date);
                  if (view === 'week') document.getElementById(`week-day-${date}`)?.scrollIntoView({ block: 'nearest' });
                }}
                className="day-chip"
                data-selected={active}
                data-today={dateIsToday}
              >
                <span className="day-chip-weekday">{weekday}</span>
                <strong className="day-chip-num tabular-nums">{day}</strong>
                <span
                  className="day-chip-dot"
                  data-has-items={hasItems}
                  aria-hidden="true"
                />
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
            <h2 id="selected-day-heading">{formatCampusDate(selectedDate)}</h2>
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
          ) : (
            <DaySchedule meetings={meetings} date={selectedDate} currentId={current?.id} nextId={next?.id} />
          )}
        </section>
      ) : (
        <section aria-label="Weekly timetable" className="week-view-section">
          <div className="week-columns">
            {DEMO_WEEK_DATES.map((date) => {
              const dayMeetings = getScheduleMeetingsByDate(date);
              const dateIsToday = date === DEMO_TODAY_DATE;
              const isSelected = date === selectedDate;
              const dayCurrent = dateIsToday ? getCurrentClassOnDate(date) : undefined;
              const dayNext = dateIsToday ? getNextClassOnDate(date) : undefined;

              return (
                <section
                  key={date}
                  id={`week-day-${date}`}
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
                          <li key={m.id} className="week-day-item" data-state={state}>
                            <span className="tabular-nums week-item-time">
                              {m.startTime}–{m.endTime}
                            </span>
                            <div className="week-item-copy">
                              <strong>{m.title}</strong>
                              <span>
                                {[m.room, ['Next', 'In progress', 'Canceled'].includes(state) ? state : ''].filter(Boolean).join(' · ')}
                              </span>
                            </div>
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
    </div>
  );
}
