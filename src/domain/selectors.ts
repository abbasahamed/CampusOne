import {
  DEMO_ATTENDANCE,
  DEMO_COURSE_OFFERINGS,
  DEMO_CURRENT_TIME,
  DEMO_EVENTS,
  DEMO_INVOICES,
  DEMO_PAYMENTS,
  DEMO_SCHEDULE,
  DEMO_TODAY_DATE,
} from '../data/demoData';
import type {
  AttendanceSnapshot,
  CampusEvent,
  CourseOffering,
  FeeInvoice,
  ScheduleMeeting,
} from '../data/types';

export function getCourseOffering(offeringId: string | null): CourseOffering | undefined {
  if (!offeringId) return undefined;
  return DEMO_COURSE_OFFERINGS.find((o) => o.id === offeringId);
}

export function getNextClassOnDate(
  date = DEMO_TODAY_DATE,
  afterTime = DEMO_CURRENT_TIME,
): ScheduleMeeting | undefined {
  return DEMO_SCHEDULE.filter(
    (m) =>
      m.date === date &&
      m.kind === 'class' &&
      m.status === 'scheduled' &&
      m.startTime > afterTime,
  ).sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
}

export function getAggregateAttendance(): { attended: number; conducted: number } {
  return DEMO_ATTENDANCE.reduce(
    (acc, item) => ({
      attended: acc.attended + item.attended,
      conducted: acc.conducted + item.conducted,
    }),
    { attended: 0, conducted: 0 },
  );
}

export function getBelowTargetAttendance(): AttendanceSnapshot[] {
  return DEMO_ATTENDANCE.filter(
    (a) => a.conducted > 0 && a.attended * a.targetDenominator < a.targetNumerator * a.conducted,
  );
}

export function getInvoiceTotalPaise(invoice: FeeInvoice): number {
  return invoice.lineItems.reduce((sum, li) => sum + li.amountPaise, 0);
}

export function getOutstandingInvoices(): FeeInvoice[] {
  const paidIds = new Set(DEMO_PAYMENTS.map((p) => p.invoiceId));
  return DEMO_INVOICES.filter((inv) => !paidIds.has(inv.id));
}

export function getFeaturedEvent(): CampusEvent | undefined {
  return DEMO_EVENTS.find((e) => e.featured) ?? DEMO_EVENTS[0];
}
