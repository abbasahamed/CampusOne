import { useState } from 'react';
import { Button } from '../components/Button';
import { Dialog } from '../components/Dialog';
import { ProgressBar } from '../components/ProgressBar';
import { SegmentedControl } from '../components/SegmentedControl';
import { StatusBadge } from '../components/StatusBadge';
import { Surface } from '../components/Surface';
import { PageHeader, SectionHeader } from '../components/Typography';
import {
  DEMO_ATTENDANCE,
  DEMO_EVENTS,
  DEMO_SCHEDULE,
  DEMO_SEMESTERS,
  DEMO_TODAY_DATE,
} from '../data/demoData';
import {
  formatCampusDate,
  formatPaise,
} from '../domain/format';
import {
  getAggregateAttendance,
  getInvoiceTotalPaise,
  getOutstandingInvoices,
} from '../domain/selectors';

export function AttendanceScaffold() {
  const aggregate = getAggregateAttendance();
  const pct = aggregate.conducted > 0 ? (aggregate.attended / aggregate.conducted) * 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academics"
        title="Attendance"
        subtitle="Phase 02 route scaffold wired to centralized attendance fixtures."
      />
      <Surface>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionHeader title="Semester 5 aggregate" />
            <StatusBadge label="75% policy target" tone="accent" />
          </div>
          <ProgressBar
            label="Attended vs conducted"
            value={pct}
            valueText={`${aggregate.attended}/${aggregate.conducted} (${pct.toFixed(1)}%)`}
          />
          <p className="text-[0.875rem] text-text-secondary">
            Tracking {DEMO_ATTENDANCE.length} enrolled offerings. Full ledger and planner land in Phases 04–05.
          </p>
        </div>
      </Surface>
    </div>
  );
}

export function MarksScaffold() {
  const [semesterId, setSemesterId] = useState(DEMO_SEMESTERS[0]?.id ?? 'sem-5');

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academics"
        title="Marks & Academics"
        subtitle="Phase 02 route scaffold wired to semester and grading fixtures."
        actions={
          <SegmentedControl
            label="Select semester"
            value={semesterId}
            options={DEMO_SEMESTERS.map((s) => ({ value: s.id, label: s.shortLabel }))}
            onChange={setSemesterId}
          />
        }
      />
      <Surface>
        <SectionHeader
          title={DEMO_SEMESTERS.find((s) => s.id === semesterId)?.label ?? 'Semester'}
          supporting="Assessment ledger and Grade Planner land in Phases 04–05."
        />
      </Surface>
    </div>
  );
}

export function ScheduleScaffold() {
  const [view, setView] = useState<'day' | 'week'>('day');
  const todayMeetings = DEMO_SCHEDULE.filter((m) => m.date === DEMO_TODAY_DATE);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={formatCampusDate(DEMO_TODAY_DATE)}
        title="Timetable"
        subtitle="Phase 02 route scaffold wired to schedule fixtures."
        actions={
          <SegmentedControl
            label="Schedule view"
            value={view}
            options={[
              { value: 'day', label: 'Day' },
              { value: 'week', label: 'Week' },
            ]}
            onChange={setView}
          />
        }
      />
      <Surface>
        <SectionHeader
          title={`${view === 'day' ? 'Day' : 'Week'} schedule preview`}
          supporting={`${todayMeetings.length} entries scheduled for ${formatCampusDate(DEMO_TODAY_DATE)}.`}
        />
      </Surface>
    </div>
  );
}

export function FeesScaffold() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const outstanding = getOutstandingInvoices();
  const totalPaise = outstanding.reduce((sum, inv) => sum + getInvoiceTotalPaise(inv), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Fees & Payments"
        subtitle="Phase 02 route scaffold wired to invoice and payment fixtures."
      />
      <Surface>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.875rem] font-medium text-text-secondary">Total outstanding</p>
            <p className="tabular-nums mt-1 text-[2rem] font-extrabold text-text-primary">
              {formatPaise(totalPaise)}
            </p>
          </div>
          <Button variant="secondary" onClick={() => setDialogOpen(true)}>
            Preview dialog primitive
          </Button>
        </div>
      </Surface>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Fee scaffold preview"
        description="Accessible dialog and mobile bottom-sheet primitive."
        footer={
          <Button variant="primary" onClick={() => setDialogOpen(false)}>
            Close
          </Button>
        }
      >
        <p className="text-[0.9375rem] text-text-secondary">
          Simulated payment review and receipt retrieval will be implemented in Phase 05.
        </p>
      </Dialog>
    </div>
  );
}

export function EventsScaffold() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Campus life"
        title="Campus Events"
        subtitle="Phase 02 route scaffold wired to upcoming event fixtures."
      />
      <Surface>
        <SectionHeader
          title={`${DEMO_EVENTS.length} upcoming campus events`}
          supporting="Search, category filters, bookmarks, and simulated registration land in Phases 04–05."
        />
      </Surface>
    </div>
  );
}
