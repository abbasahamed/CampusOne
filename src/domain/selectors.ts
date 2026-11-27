import {
  DEMO_ASSESSMENTS,
  DEMO_ATTENDANCE,
  DEMO_CLOCK_ISO,
  DEMO_COURSE_OFFERINGS,
  DEMO_CURRENT_TIME,
  DEMO_EVENTS,
  DEMO_GRADING_POLICIES,
  DEMO_INVOICES,
  DEMO_PAYMENTS,
  DEMO_SCHEDULE,
  DEMO_SEMESTERS,
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

export function getScheduleOnDate(date = DEMO_TODAY_DATE): ScheduleMeeting[] {
  return DEMO_SCHEDULE.filter((meeting) => meeting.date === date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function getCurrentClassOnDate(
  date = DEMO_TODAY_DATE,
  time = DEMO_CURRENT_TIME,
): ScheduleMeeting | undefined {
  return getScheduleOnDate(date).find(
    (meeting) => meeting.kind === 'class' && meeting.status === 'scheduled'
      && meeting.startTime <= time && time < meeting.endTime,
  );
}

export function getNextClassOnDate(
  date = DEMO_TODAY_DATE,
  afterTime = DEMO_CURRENT_TIME,
): ScheduleMeeting | undefined {
  return getScheduleOnDate(date).find(
    (meeting) => meeting.kind === 'class' && meeting.status === 'scheduled'
      && meeting.startTime > afterTime,
  );
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


export function getUpcomingEvents(after = DEMO_CLOCK_ISO): CampusEvent[] {
  const cutoff = Date.parse(after);
  return DEMO_EVENTS.filter((event) => Date.parse(event.startIso) >= cutoff)
    .sort((a, b) => Date.parse(a.startIso) - Date.parse(b.startIso));
}

/** Credit-weighted result from finalized marks under the demo's exact grade policy. */
export function getRecordedSgpa(semesterId: string): number | undefined {
  const semester = DEMO_SEMESTERS.find(({ id }) => id === semesterId);
  const policy = DEMO_GRADING_POLICIES.find(({ id }) => id === semester?.policyId);
  if (!policy || policy.roundTotalBeforeClassification || semester?.status !== 'completed') return;

  const courses = DEMO_COURSE_OFFERINGS.filter(
    (course) => course.semesterId === semesterId && course.credits > 0,
  );
  let creditTotal = 0;
  let weightedPoints = 0;

  for (const course of courses) {
    const assessments = DEMO_ASSESSMENTS.filter(
      (item) => item.offeringId === course.id && item.weightBps > 0,
    );
    let weight = 0;
    let percentage = 0;
    for (const item of assessments) {
      if (!item.posted || item.earnedMarks === null || item.maxMarks <= 0) return;
      percentage += item.earnedMarks / item.maxMarks * (item.weightBps / 100);
      weight += item.weightBps;
    }

    if (weight !== 10000) return;
    const grade = policy.bands.find((band) => percentage >= band.minPercentage);
    if (!grade) return;
    weightedPoints += grade.points * course.credits;
    creditTotal += course.credits;
  }

  return creditTotal > 0 ? weightedPoints / creditTotal : undefined;
}
