export type SemesterStatus = 'in-progress' | 'completed';

export interface StudentProfile {
  id: string;
  name: string;
  rollNumber: string;
  program: string;
  department: string;
  currentSemesterId: string;
}

export interface GradeBand {
  label: string;
  minPercentage: number;
  points: number;
}

export interface GradingPolicy {
  id: string;
  scaleName: string;
  passingFloor: number;
  examMarkIncrement: number;
  roundTotalBeforeClassification: boolean;
  bands: readonly GradeBand[];
}

export interface Semester {
  id: string;
  label: string;
  shortLabel: string;
  status: SemesterStatus;
  policyId: string;
}

export interface CourseOffering {
  id: string;
  semesterId: string;
  code: string;
  name: string;
  credits: number;
  faculty: string;
  roomDefault: string;
}

export interface AttendanceSnapshot {
  offeringId: string;
  attended: number;
  conducted: number;
  remaining: number;
  targetNumerator: number;
  targetDenominator: number;
}

export interface AssessmentItem {
  id: string;
  offeringId: string;
  title: string;
  weightBps: number;
  maxMarks: number;
  earnedMarks: number | null;
  posted: boolean;
}

export type ScheduleEntryKind = 'class' | 'break';
export type ScheduleEntryStatus = 'scheduled' | 'canceled';

export interface ScheduleMeeting {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  kind: ScheduleEntryKind;
  status: ScheduleEntryStatus;
  offeringId: string | null;
  title: string;
  room: string | null;
}

export interface InvoiceLineItem {
  id: string;
  label: string;
  amountPaise: number;
}

export interface FeeInvoice {
  id: string;
  title: string;
  semesterId: string;
  dueDate: string;
  lineItems: readonly InvoiceLineItem[];
}

export interface FeePayment {
  id: string;
  invoiceId: string;
  paidAtIso: string;
  amountPaise: number;
  methodLabel: string;
  receiptNumber: string;
  simulated: boolean;
}

export type EventCategory = 'Academic' | 'Technical' | 'Cultural' | 'Career';

export interface CampusEvent {
  id: string;
  title: string;
  category: EventCategory;
  startIso: string;
  endIso: string;
  venue: string;
  organizer?: string;
  summary: string;
  description: string;
  registrationAvailable: boolean;
  featured?: boolean;
}
