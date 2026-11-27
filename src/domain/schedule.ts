import { DEMO_SCHEDULE, DEMO_TODAY_DATE } from '../data/demoData.ts';
import type { ScheduleMeeting } from '../data/types';

export const DEMO_WEEK_DATES = [
  '2026-11-23',
  '2026-11-24',
  '2026-11-25',
  '2026-11-26',
  '2026-11-27',
  '2026-11-28',
  '2026-11-29',
] as const;

export function isValidScheduleDate(date: string | null): date is string {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  return (DEMO_WEEK_DATES as readonly string[]).includes(date);
}

export function getValidatedScheduleDate(dateParam: string | null): string {
  return isValidScheduleDate(dateParam) ? dateParam : DEMO_TODAY_DATE;
}

export function getWeekDatesFor(selectedDate: string): readonly string[] {
  if ((DEMO_WEEK_DATES as readonly string[]).includes(selectedDate)) {
    return DEMO_WEEK_DATES;
  }
  return DEMO_WEEK_DATES;
}

export function getScheduleMeetingsByDate(date: string): ScheduleMeeting[] {
  return DEMO_SCHEDULE.filter((m) => m.date === date).sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );
}

/** Pure calendar-date arithmetic on YYYY-MM-DD (avoids local/UTC rollover drift). */
export function addCalendarDays(isoDate: string, days: number): string {
  const [y = 2026, m = 11, d = 27] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export interface UpcomingDaySchedule {
  date: string;
  isTeachingDay: boolean;
  fromRecurringTemplate: boolean;
  meetings: readonly ScheduleMeeting[];
}

/**
 * Resolves upcoming calendar dates strictly after `fromDate` using explicit fixtures
 * where defined (`2026-11-28`, `2026-11-29`) and the verified Mon–Sun recurring pattern thereafter.
 */
export function getUpcomingScheduleDays(
  fromDate = DEMO_TODAY_DATE,
  daysCount = 9,
): UpcomingDaySchedule[] {
  const days: UpcomingDaySchedule[] = [];

  for (let offset = 1; offset <= daysCount; offset += 1) {
    const date = addCalendarDays(fromDate, offset);
    if ((DEMO_WEEK_DATES as readonly string[]).includes(date)) {
      const meetings = getScheduleMeetingsByDate(date);
      days.push({
        date,
        isTeachingDay: meetings.some(
          (m) => m.kind === 'class' && m.status === 'scheduled',
        ),
        fromRecurringTemplate: false,
        meetings,
      });
      continue;
    }

    const [y = 2026, m = 11, d = 27] = date.split('-').map(Number);
    const utcDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun..6=Sat
    const weekIdx = utcDay === 0 ? 6 : utcDay - 1; // 0=Mon..6=Sun
    const templateDate = DEMO_WEEK_DATES[weekIdx]!;
    const meetings = getScheduleMeetingsByDate(templateDate).map((entry) => ({
      ...entry,
      date,
      // Single-day cancellations in the demo week do not automatically cancel future weeks
      status: 'scheduled' as const,
    }));

    days.push({
      date,
      isTeachingDay: meetings.some((entry) => entry.kind === 'class'),
      fromRecurringTemplate: true,
      meetings,
    });
  }

  return days;
}
