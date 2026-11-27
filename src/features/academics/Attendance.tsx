import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronRight, TriangleAlert } from 'lucide-react';
import { SegmentedControl } from '../../components/SegmentedControl';
import { StatusBadge } from '../../components/StatusBadge';
import { PageHeader } from '../../components/Typography';
import { DEMO_ATTENDANCE } from '../../data/demoData';
import type { AttendanceSnapshot } from '../../data/types';
import {
  aggregateAttendanceSnapshots,
  calculateAttendanceProjection,
  calculateRecoveryPlan,
  calculateSafeAbsences,
  evaluateAttendanceStatus,
} from '../../domain/attendance';
import { getCourseOffering } from '../../domain/selectors';
import { AttendanceRing } from './AttendanceRing';
import './academics.css';

type PlannerMode = 'recover' | 'safe' | 'project';

const TARGET_PRESETS = [
  { id: '75', label: '75%', numerator: 3, denominator: 4 },
  { id: '80', label: '80%', numerator: 4, denominator: 5 },
  { id: '85', label: '85%', numerator: 17, denominator: 20 },
  { id: '100', label: '100%', numerator: 1, denominator: 1 },
] as const;

type TargetPresetId = (typeof TARGET_PRESETS)[number]['id'];

function rankSnapshots(
  snapshots: readonly AttendanceSnapshot[],
  target: { numerator: number; denominator: number },
) {
  return [...snapshots].sort((a, b) => {
    const statusA = evaluateAttendanceStatus(a, target);
    const statusB = evaluateAttendanceStatus(b, target);
    if (statusA.meetsTarget !== statusB.meetsTarget) {
      return statusA.meetsTarget ? 1 : -1;
    }
    const pctA = statusA.percentage ?? -1;
    const pctB = statusB.percentage ?? -1;
    return pctA - pctB || a.offeringId.localeCompare(b.offeringId);
  });
}

function RecoveryPlannerPanel({
  snapshot,
  target,
}: {
  snapshot: AttendanceSnapshot;
  target: { numerator: number; denominator: number };
}) {
  const [mode, setMode] = useState<PlannerMode>('recover');
  const [attendFuture, setAttendFuture] = useState('2');
  const [missFuture, setMissFuture] = useState('0');

  const course = getCourseOffering(snapshot.offeringId);
  const status = evaluateAttendanceStatus(snapshot, target);
  const recovery = calculateRecoveryPlan(snapshot, target);
  const safe = calculateSafeAbsences(snapshot, target);

  const parsedAttend = Number(attendFuture);
  const parsedMiss = Number(missFuture);
  const projection = calculateAttendanceProjection(
    snapshot,
    Number.isInteger(parsedAttend) ? parsedAttend : -1,
    Number.isInteger(parsedMiss) ? parsedMiss : -1,
    target,
  );

  let scenarioLabel = 'Consecutive recovery scenario';
  let projectedPct = recovery.projectedPercentage;
  let projectedCounts = `${recovery.projectedAttended}/${recovery.projectedConducted}`;
  let headlineText = recovery.explanation;
  let meetsInScenario =
    recovery.status === 'at-target' ||
    recovery.status === 'recoverable' ||
    recovery.status === 'unrecorded-recoverable';

  if (mode === 'safe') {
    scenarioLabel = 'Immediate absences scenario';
    projectedPct = safe.projectedPercentageAfterMisses;
    projectedCounts = `${safe.projectedAttendedAfterMisses}/${safe.projectedConductedAfterMisses}`;
    headlineText = safe.explanation;
    meetsInScenario = safe.status === 'available';
  } else if (mode === 'project') {
    scenarioLabel = 'Custom future plan';
    projectedPct = projection.valid ? projection.percentage : null;
    projectedCounts = projection.valid ? `${projection.attended}/${projection.conducted}` : '—';
    headlineText = projection.valid
      ? `After attending ${parsedAttend} and missing ${parsedMiss} of ${snapshot.remaining} remaining classes: ${projection.percentage?.toFixed(1)}% (${projection.attended}/${projection.conducted}).`
      : projection.error ?? 'Enter valid future session counts.';
    meetsInScenario = projection.valid && projection.meetsTarget;
  }

  return (
    <section
      id="recovery-planner"
      className="planner-panel"
      aria-labelledby="planner-subject-title"
    >
      <div className="planner-header">
        <div>
          <p className="planner-kicker">
            {course?.code} · {snapshot.remaining} classes remaining this term
          </p>
          <h2 id="planner-subject-title">{course?.name ?? 'Selected subject'}</h2>
        </div>
        <StatusBadge
          label={
            status.state === 'unrecorded'
              ? 'Unrecorded'
              : status.meetsTarget
                ? 'On target'
                : 'Below target'
          }
          tone={
            status.state === 'unrecorded'
              ? 'neutral'
              : status.meetsTarget
                ? 'success'
                : 'warning'
          }
        />
      </div>

      <SegmentedControl
        label="Planner mode"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'recover', label: 'Recover attendance' },
          { value: 'safe', label: 'Safe absences' },
          { value: 'project', label: 'What-if plan' },
        ]}
      />

      <div className="planner-comparison" aria-live="polite">
        <div className="planner-stat">
          <span>Recorded</span>
          <strong className="tabular-nums">
            {status.percentage !== null ? `${status.percentage.toFixed(1)}%` : '—'}
          </strong>
          <span className="tabular-nums planner-counts">
            {snapshot.attended}/{snapshot.conducted} classes
          </span>
        </div>
        <div className="planner-stat" data-highlight={meetsInScenario}>
          <span>{scenarioLabel}</span>
          <strong className="tabular-nums">
            {projectedPct !== null ? `${projectedPct.toFixed(1)}%` : '—'}
          </strong>
          <span className="tabular-nums planner-counts">{projectedCounts} classes</span>
        </div>
      </div>

      <p className="planner-insight" role="status">
        {headlineText}
      </p>

      {mode === 'safe' && <p className="planner-assumption">{safe.assumptionNote}</p>}

      {mode === 'project' && (
        <div className="planner-inputs">
          <div className="field-group">
            <label htmlFor="attend-future-input">
              Attend next (max {snapshot.remaining})
            </label>
            <input
              id="attend-future-input"
              type="number"
              min={0}
              max={snapshot.remaining}
              step={1}
              value={attendFuture}
              onChange={(e) => setAttendFuture(e.target.value)}
            />
          </div>
          <div className="field-group">
            <label htmlFor="miss-future-input">
              Miss next (total ≤ {snapshot.remaining})
            </label>
            <input
              id="miss-future-input"
              type="number"
              min={0}
              max={snapshot.remaining}
              step={1}
              value={missFuture}
              onChange={(e) => setMissFuture(e.target.value)}
            />
          </div>
        </div>
      )}

      {mode === 'recover' && (
        <p className="planner-assumption">
          Assumes attending consecutive scheduled classes from the current baseline ({snapshot.attended}/
          {snapshot.conducted}) within the {snapshot.remaining}-class remaining horizon.
        </p>
      )}
    </section>
  );
}

export function Attendance() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [targetId, setTargetId] = useState<TargetPresetId>('75');
  const activeTarget =
    TARGET_PRESETS.find((t) => t.id === targetId) ?? TARGET_PRESETS[0];

  const ranked = useMemo(
    () =>
      rankSnapshots(DEMO_ATTENDANCE, {
        numerator: activeTarget.numerator,
        denominator: activeTarget.denominator,
      }),
    [activeTarget],
  );

  const requestedSubject = searchParams.get('subject');
  const selectedSnapshot =
    ranked.find((s) => s.offeringId === requestedSubject) ?? ranked[0]!;

  const aggregate = aggregateAttendanceSnapshots(DEMO_ATTENDANCE, {
    numerator: activeTarget.numerator,
    denominator: activeTarget.denominator,
  });

  const belowTargetCount = ranked.filter(
    (s) =>
      !evaluateAttendanceStatus(s, {
        numerator: activeTarget.numerator,
        denominator: activeTarget.denominator,
      }).meetsTarget,
  ).length;

  function selectSubject(offeringId: string) {
    setSearchParams({ subject: offeringId }, { replace: true });
  }

  return (
    <div className="academics-page">
      <PageHeader
        eyebrow="Academics · Semester 5"
        title="Attendance"
        subtitle="Prioritized subject standing, threshold checks and recovery planning."
        actions={
          <SegmentedControl
            label="Minimum attendance requirement"
            value={targetId}
            onChange={setTargetId}
            options={TARGET_PRESETS.map((t) => ({ value: t.id, label: t.label }))}
          />
        }
      />

      <section className="attendance-hero" aria-label="Overall attendance standing">
        <AttendanceRing
          size="hero"
          percentage={aggregate.percentage}
          targetPercentage={aggregate.targetPercentage}
          meetsTarget={aggregate.meetsTarget}
          label={`Overall attendance ${aggregate.percentage?.toFixed(1) ?? '0'} percent, ${aggregate.attended} of ${aggregate.conducted} classes against ${activeTarget.label} target`}
        />
        <div className="attendance-hero-copy">
          <p className="hero-kicker">Aggregate Semester Standing</p>
          <p className="hero-counts tabular-nums">
            {aggregate.attended} of {aggregate.conducted} classes attended
          </p>
          <p className="hero-summary">
            {belowTargetCount === 0
              ? `Every enrolled subject currently meets the ${activeTarget.label} requirement.`
              : `${belowTargetCount} ${belowTargetCount === 1 ? 'subject is' : 'subjects are'} below the ${activeTarget.label} requirement and prioritized first.`}
          </p>
        </div>
      </section>

      <div className="attendance-grid">
        <section aria-labelledby="ledger-heading" className="subject-ledger">
          <h2 id="ledger-heading" className="section-title">
            Subject ledger
          </h2>
          <ul className="ledger-list">
            {ranked.map((snapshot) => {
              const course = getCourseOffering(snapshot.offeringId);
              const status = evaluateAttendanceStatus(snapshot, {
                numerator: activeTarget.numerator,
                denominator: activeTarget.denominator,
              });
              const recovery = calculateRecoveryPlan(snapshot, {
                numerator: activeTarget.numerator,
                denominator: activeTarget.denominator,
              });
              const safe = calculateSafeAbsences(snapshot, {
                numerator: activeTarget.numerator,
                denominator: activeTarget.denominator,
              });
              const isSelected = snapshot.offeringId === selectedSnapshot.offeringId;

              let statusLine = 'At threshold';
              if (status.state === 'unrecorded') {
                statusLine = 'No classes conducted yet';
              } else if (!status.meetsTarget) {
                statusLine =
                  recovery.status === 'recoverable' && recovery.neededClasses !== null
                    ? `Below target · Attend next ${recovery.neededClasses}`
                    : 'Below target · Unreachable this term';
              } else if (safe.status === 'available' && safe.safeAbsences > 0) {
                statusLine = `On track · ${safe.safeAbsences} safe ${safe.safeAbsences === 1 ? 'miss' : 'misses'}`;
              } else {
                statusLine = 'At threshold · 0 safe misses';
              }

              return (
                <li key={snapshot.offeringId} className="ledger-item-wrap">
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => selectSubject(snapshot.offeringId)}
                    className="ledger-row"
                    data-selected={isSelected}
                    data-risk={!status.meetsTarget}
                  >
                    <AttendanceRing
                      size="mini"
                      percentage={status.percentage}
                      targetPercentage={status.targetPercentage}
                      meetsTarget={status.meetsTarget}
                      label={`${course?.name ?? snapshot.offeringId} ${status.percentage?.toFixed(1) ?? '0'} percent`}
                    />
                    <span className="ledger-copy">
                      <span className="ledger-title">
                        <strong>{course?.name}</strong>
                        <span className="ledger-code">{course?.code}</span>
                      </span>
                      <span className="ledger-sub tabular-nums">
                        {snapshot.attended}/{snapshot.conducted} classes · {snapshot.remaining}{' '}
                        remaining
                      </span>
                      <span className="ledger-status" data-risk={!status.meetsTarget}>
                        {!status.meetsTarget && (
                          <TriangleAlert size={13} aria-hidden="true" />
                        )}
                        {statusLine}
                      </span>
                    </span>
                    <span className="ledger-metric tabular-nums">
                      <strong>
                        {status.percentage !== null ? `${status.percentage.toFixed(1)}%` : '—'}
                      </strong>
                      <ChevronRight size={16} aria-hidden="true" />
                    </span>
                  </button>

                  {isSelected && (
                    <div className="mobile-inline-planner">
                      <RecoveryPlannerPanel
                        snapshot={selectedSnapshot}
                        target={{
                          numerator: activeTarget.numerator,
                          denominator: activeTarget.denominator,
                        }}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <div className="desktop-sticky-planner">
          <RecoveryPlannerPanel
            snapshot={selectedSnapshot}
            target={{
              numerator: activeTarget.numerator,
              denominator: activeTarget.denominator,
            }}
          />
        </div>
      </div>
    </div>
  );
}
