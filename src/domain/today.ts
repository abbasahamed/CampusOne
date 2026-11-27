import { DEMO_CURRENT_TIME, DEMO_PAYMENTS, DEMO_TODAY_DATE } from '../data/demoData';
import type { AttendanceSnapshot, FeePayment, ScheduleMeeting } from '../data/types';
import { calculateRecoveryPlan } from './attendance';
import { formatPaise, formatPercentage, formatShortDate } from './format';
import {
  getBelowTargetAttendance,
  getCourseOffering,
  getInvoiceTotalPaise,
  getOutstandingInvoices,
} from './selectors';

export type TodayAction = {
  id: string;
  kind: 'attendance' | 'fee' | 'schedule';
  urgency: 'high' | 'medium' | 'normal';
  title: string;
  detail: string;
  label: string;
  to: string;
};

export function getScheduleLink(date: string): string {
  return `/schedule?date=${encodeURIComponent(date)}&view=day`;
}

function attendanceGap(snapshot: AttendanceSnapshot): number {
  return (
    snapshot.targetNumerator / snapshot.targetDenominator -
    snapshot.attended / snapshot.conducted
  );
}

function canRecover(snapshot: AttendanceSnapshot): boolean {
  return (
    (snapshot.attended + snapshot.remaining) * snapshot.targetDenominator >=
    (snapshot.conducted + snapshot.remaining) * snapshot.targetNumerator
  );
}

export function minutesUntil(time: string, now = DEMO_CURRENT_TIME): number {
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  const [currentHour = 0, currentMinute = 0] = now.split(':').map(Number);
  return (hour - currentHour) * 60 + minute - currentMinute;
}

export function getTodayActions(
  meetings: readonly ScheduleMeeting[],
  date = DEMO_TODAY_DATE,
  payments: readonly FeePayment[] = DEMO_PAYMENTS,
): TodayAction[] {
  const fees = getOutstandingInvoices(payments)
    .map((invoice) => ({
      invoice,
      daysUntilDue: (Date.parse(invoice.dueDate) - Date.parse(date)) / 86_400_000,
    }))
    .filter(({ daysUntilDue }) => daysUntilDue <= 7)
    .sort(
      (a, b) =>
        a.daysUntilDue - b.daysUntilDue || a.invoice.id.localeCompare(b.invoice.id),
    )
    .map(({ invoice, daysUntilDue }): TodayAction & { overdue: boolean } => ({
      id: invoice.id,
      kind: 'fee',
      urgency: daysUntilDue < 0 ? 'high' : 'medium',
      title: invoice.title,
      detail: `${formatPaise(getInvoiceTotalPaise(invoice))} ${daysUntilDue < 0 ? 'overdue since' : 'due'} ${formatShortDate(invoice.dueDate)}`,
      label: 'Review fee',
      to: `/fees?invoice=${encodeURIComponent(invoice.id)}`,
      overdue: daysUntilDue < 0,
    }));

  const attendance = getBelowTargetAttendance()
    .sort(
      (a, b) =>
        Number(canRecover(a)) - Number(canRecover(b)) ||
        attendanceGap(b) - attendanceGap(a) ||
        a.offeringId.localeCompare(b.offeringId),
    )
    .map((snapshot): TodayAction => {
      const recovery = calculateRecoveryPlan(snapshot);
      const targetPct = formatPercentage(
        snapshot.targetNumerator,
        snapshot.targetDenominator,
        0,
      );
      const currentPct = formatPercentage(snapshot.attended, snapshot.conducted);
      const insight =
        recovery.status === 'recoverable' && recovery.neededClasses !== null
          ? `Attend the next ${recovery.neededClasses} ${recovery.neededClasses === 1 ? 'class' : 'classes'} to reach ${targetPct}`
          : recovery.status === 'unreachable'
            ? recovery.neededClasses !== null
              ? `Needs ${recovery.neededClasses} classes. Only ${snapshot.remaining} left, so best is ${recovery.bestPossiblePercentage?.toFixed(1)}%.`
              : recovery.explanation
            : `Below ${targetPct} target`;

      return {
        id: snapshot.offeringId,
        kind: 'attendance',
        urgency: recovery.status === 'unreachable' ? 'high' : 'medium',
        title: getCourseOffering(snapshot.offeringId)?.name ?? 'Subject attendance',
        detail: `${currentPct} (${snapshot.attended}/${snapshot.conducted}) · ${insight}`,
        label: 'Plan recovery',
        to: `/academics/attendance?subject=${encodeURIComponent(snapshot.offeringId)}`,
      };
    });

  const changes = meetings
    .filter(
      (meeting) =>
        meeting.kind === 'class' &&
        meeting.status === 'canceled' &&
        minutesUntil(meeting.endTime) > 0,
    )
    .map((meeting): TodayAction => ({
      id: meeting.id,
      kind: 'schedule',
      urgency: 'normal',
      title: `${meeting.title} canceled`,
      detail: `The ${meeting.startTime} class will not take place`,
      label: 'See schedule',
      to: getScheduleLink(date),
    }));

  return [
    ...fees.filter(({ overdue }) => overdue),
    ...attendance,
    ...changes,
    ...fees.filter(({ overdue }) => !overdue),
  ];
}
