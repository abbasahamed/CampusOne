import { useId, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, ChevronRight, TriangleAlert } from 'lucide-react';
import { Dialog } from '../../components/Dialog';
import { SegmentedControl } from '../../components/SegmentedControl';
import { StatusBadge } from '../../components/StatusBadge';
import { AcademicsHeader } from './AcademicsHeader';
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
  { id: '75', label: '75%', description: 'Standard university minimum', numerator: 3, denominator: 4 },
  { id: '80', label: '80%', description: 'Honours / scholarship buffer', numerator: 4, denominator: 5 },
  { id: '85', label: '85%', description: 'High-standing target', numerator: 17, denominator: 20 },
  { id: '100', label: '100%', description: 'Zero remaining absences', numerator: 1, denominator: 1 },
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
  targetLabel,
}: {
  snapshot: AttendanceSnapshot;
  target: { numerator: number; denominator: number };
  targetLabel: string;
}) {
  const plannerId = useId();
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

  let scenarioLabel = recovery.status === 'unreachable' ? 'Best possible' : 'After recovery';
  let projectedPct = recovery.projectedPercentage;
  let projectedCounts = `${recovery.projectedAttended}/${recovery.projectedConducted}`;
  let headlineText =
    recovery.status === 'recoverable' && recovery.neededClasses !== null
      ? `Attend the next ${recovery.neededClasses} consecutive ${course?.code ?? ''} ${recovery.neededClasses === 1 ? 'class' : 'classes'} to reach ${targetLabel} (${recovery.projectedAttended}/${recovery.projectedConducted}). Best possible with all ${snapshot.remaining} remaining classes: ${recovery.bestPossiblePercentage?.toFixed(1)}%.`
      : recovery.neededClasses !== null && recovery.status === 'unreachable'
        ? `You need ${recovery.neededClasses} consecutive classes to reach ${targetLabel}. With ${snapshot.remaining} remaining, your best possible result is ${recovery.bestPossiblePercentage?.toFixed(1)}% (${recovery.bestPossibleAttended}/${recovery.bestPossibleConducted}).`
        : recovery.explanation;
  let meetsInScenario =
    recovery.status === 'at-target' ||
    recovery.status === 'recoverable' ||
    recovery.status === 'unrecorded-recoverable';

  if (mode === 'safe') {
    scenarioLabel = 'After safe absences';
    projectedPct = safe.projectedPercentageAfterMisses;
    projectedCounts = `${safe.projectedAttendedAfterMisses}/${safe.projectedConductedAfterMisses}`;
    headlineText = safe.explanation;
    meetsInScenario = safe.status === 'available';
  } else if (mode === 'project') {
    scenarioLabel = 'Your projection';
    projectedPct = projection.valid ? projection.percentage : null;
    projectedCounts = projection.valid ? `${projection.attended}/${projection.conducted}` : '—';
    headlineText = projection.valid
      ? `After attending ${parsedAttend} and missing ${parsedMiss} of ${snapshot.remaining} remaining classes: ${projection.percentage?.toFixed(1)}% (${projection.attended}/${projection.conducted}).`
      : projection.error ?? 'Enter valid future session counts.';
    meetsInScenario = projection.valid && projection.meetsTarget;
  }

  return (
    <section
      id={plannerId}
      className="planner-panel"
      aria-labelledby={`${plannerId}-subject`}
    >
      <div className="planner-header">
        <div>
          <p className="planner-kicker">
            {course?.code} · {snapshot.remaining} teaching sessions left this term
          </p>
          <h2 id={`${plannerId}-subject`} tabIndex={-1}>
            {course?.name ?? 'Selected subject'}
          </h2>
        </div>
        <StatusBadge
          label={
            status.state === 'unrecorded'
              ? 'Unrecorded'
              : !status.meetsTarget
                ? 'Below target'
                : snapshot.attended * target.denominator === target.numerator * snapshot.conducted
                  ? 'At threshold'
                  : 'On target'
          }
          tone={
            status.state === 'unrecorded'
              ? 'neutral'
              : !status.meetsTarget
                ? 'warning'
                : snapshot.attended * target.denominator === target.numerator * snapshot.conducted
                  ? 'neutral'
                  : 'success'
          }
        />
      </div>

      <SegmentedControl
        label="Planner mode"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'recover', label: 'Recover' },
          { value: 'safe', label: 'Safe absences' },
          { value: 'project', label: 'What if?' },
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

      <div className="planner-callout" data-feasible={meetsInScenario} role="status">
        <p className="planner-insight">{headlineText}</p>
      </div>

      {mode === 'safe' && <p className="planner-assumption">{safe.assumptionNote}</p>}

      {mode === 'project' && (
        <div className="planner-inputs">
          <div className="field-group">
            <label htmlFor={`${plannerId}-attend`}>
              Attend next (max {snapshot.remaining})
            </label>
            <input
              id={`${plannerId}-attend`}
              type="number"
              min={0}
              max={snapshot.remaining}
              step={1}
              value={attendFuture}
              onChange={(e) => setAttendFuture(e.target.value)}
            />
          </div>
          <div className="field-group">
            <label htmlFor={`${plannerId}-miss`}>
              Miss next (total ≤ {snapshot.remaining})
            </label>
            <input
              id={`${plannerId}-miss`}
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
          Assumes consecutive attendance from baseline ({snapshot.attended}/{snapshot.conducted}) across{' '}
          {snapshot.remaining} remaining term sessions (including classes beyond this week’s timetable).
        </p>
      )}
    </section>
  );
}

export function Attendance() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [targetId, setTargetId] = useState<TargetPresetId>('75');
  const [pickerOpen, setPickerOpen] = useState(false);

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

  const risk = belowTargetCount ? ranked[0] : undefined;
  const riskPlan = risk ? calculateRecoveryPlan(risk, activeTarget) : undefined;
  const riskCourse = risk ? getCourseOffering(risk.offeringId) : undefined;

  function selectSubject(offeringId: string) {
    setSearchParams({ subject: offeringId }, { replace: true });
  }

  function focusRecoveryPlanner(offeringId?: string) {
    if (offeringId) selectSubject(offeringId);
    window.requestAnimationFrame(() => {
      const desktopMode = window.matchMedia?.('(min-width: 960px)').matches;
      const root = desktopMode
        ? document.querySelector<HTMLElement>('.desktop-sticky-planner .planner-panel')
        : document.querySelector<HTMLElement>('.mobile-inline-planner .planner-panel');
      if (!root) return;
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      root.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
      root.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    });
  }

  return (
    <div className="academics-page">
      <AcademicsHeader />

      <section className="attendance-summary" aria-labelledby="overall-attendance">
        <div className="attendance-hero">
          <AttendanceRing
            size="hero"
            percentage={aggregate.percentage}
            targetPercentage={aggregate.targetPercentage}
            meetsTarget={aggregate.meetsTarget}
            label={`Overall attendance ${aggregate.percentage?.toFixed(1) ?? 'unrecorded'} percent, ${aggregate.attended} of ${aggregate.conducted} classes against ${activeTarget.label} minimum`}
          />
          <div className="attendance-hero-meta">
            <h2 id="overall-attendance">Overall attendance</h2>
            <p className="hero-counts tabular-nums">
              {aggregate.attended} of {aggregate.conducted} classes
            </p>
            <button
              type="button"
              className="threshold-trigger"
              aria-haspopup="dialog"
              onClick={() => setPickerOpen(true)}
            >
              <span className="threshold-trigger-label">Minimum target</span>
              <span className="threshold-trigger-value tabular-nums">{activeTarget.label}</span>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="attendance-insight" aria-live="polite">
          <h3>
            {belowTargetCount
              ? `${belowTargetCount} ${belowTargetCount === 1 ? 'subject' : 'subjects'} below ${activeTarget.label}`
              : `All subjects meet ${activeTarget.label}`}
          </h3>
          {risk && riskCourse && riskPlan ? (
            <>
              {riskPlan.status === 'recoverable' && riskPlan.neededClasses !== null ? (
                <>
                  <p className="insight-action-summary">
                    Attend the next {riskPlan.neededClasses} {riskCourse.code}{' '}
                    {riskPlan.neededClasses === 1 ? 'class' : 'classes'} to reach{' '}
                    {activeTarget.label}.
                  </p>
                  <p className="hero-summary">
                    {risk.remaining} {risk.remaining === 1 ? 'class remains' : 'classes remain'}
                    {belowTargetCount > 1
                      ? ` · ${belowTargetCount - 1} more below ${activeTarget.label}`
                      : ''}
                    .
                  </p>
                </>
              ) : riskPlan.status === 'unreachable' ? (
                <>
                  <p className="insight-action-summary" data-unreachable="true">
                    {riskCourse.code} cannot reach {activeTarget.label} this term.
                  </p>
                  <p className="hero-summary">
                    {riskPlan.neededClasses !== null
                      ? `${riskPlan.neededClasses} consecutive classes needed with ${risk.remaining} ${risk.remaining === 1 ? 'class' : 'classes'} remaining.`
                      : `${risk.attended}/${risk.conducted} recorded with ${risk.remaining} remaining.`}
                  </p>
                </>
              ) : (
                <p className="insight-action-summary">
                  {riskCourse.code}: {riskPlan.explanation}
                </p>
              )}
              <button
                type="button"
                className="insight-action"
                onClick={() => focusRecoveryPlanner(risk.offeringId)}
              >
                Open {riskCourse.code} recovery planner
              </button>
            </>
          ) : (
            <p className="hero-summary">
              Every recorded course satisfies the {activeTarget.label} requirement.
            </p>
          )}
        </div>
      </section>

      <div className="attendance-grid">
        <section aria-labelledby="ledger-heading" className="subject-ledger">
          <h2 id="ledger-heading" className="section-title">
            Subjects
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

              const standing =
                status.state !== 'valid'
                  ? ('unrecorded' as const)
                  : !status.meetsTarget
                    ? ('below' as const)
                    : snapshot.attended * activeTarget.denominator ===
                        activeTarget.numerator * snapshot.conducted
                      ? ('exact' as const)
                      : ('above' as const);

              let statusLine = 'On track · 0 safe misses';
              if (standing === 'unrecorded') {
                statusLine = 'No classes conducted yet';
              } else if (standing === 'below') {
                statusLine =
                  recovery.status === 'recoverable' && recovery.neededClasses !== null
                    ? `Below target · Attend next ${recovery.neededClasses}`
                    : 'Below target · Unreachable this term';
              } else if (standing === 'exact') {
                statusLine = 'At threshold · 0 safe misses';
              } else if (safe.status === 'available' && safe.safeAbsences > 0) {
                statusLine = `On track · ${safe.safeAbsences} safe ${safe.safeAbsences === 1 ? 'miss' : 'misses'}`;
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
                      standing={standing}
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
                      {isSelected ? (
                        <Check size={16} aria-hidden="true" />
                      ) : (
                        <ChevronRight size={16} aria-hidden="true" />
                      )}
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
                        targetLabel={activeTarget.label}
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
            targetLabel={activeTarget.label}
          />
        </div>
      </div>

      <Dialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Minimum attendance"
        description="Choose the minimum threshold used for eligibility and recovery calculations."
      >
        <div className="threshold-picker-list" role="radiogroup" aria-label="Minimum attendance requirement">
          {TARGET_PRESETS.map((preset) => {
            const selected = preset.id === targetId;
            return (
              <button
                key={preset.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className="threshold-option"
                data-selected={selected}
                onClick={() => {
                  setTargetId(preset.id);
                  setPickerOpen(false);
                }}
              >
                <span>
                  <strong className="tabular-nums">{preset.label}</strong>
                  <span>{preset.description}</span>
                </span>
                {selected && <Check size={18} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </Dialog>
    </div>
  );
}
