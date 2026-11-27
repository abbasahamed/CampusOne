import { DEMO_SCHEDULE, DEMO_TODAY_DATE } from '../data/demoData';
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
