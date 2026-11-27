import { useEffect, useId, useMemo, useState, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  CircleDot,
  Minus,
  Plus,
} from 'lucide-react';
import { Dialog } from '../../components/Dialog';
import { SegmentedControl } from '../../components/SegmentedControl';
import { SectionHeader } from '../../components/Typography';
import { DEMO_ATTENDANCE, DEMO_TIMEZONE } from '../../data/demoData';
import type { AttendanceSnapshot } from '../../data/types';
import {
  aggregateAttendanceSnapshots,
  calculateAttendanceProjection,
  calculateRecoveryPlan,
  calculateSafeAbsences,
  evaluateAttendanceStatus,
  evaluateDayAbsenceImpact,
} from '../../domain/attendance';
import { buildIllustrativeHistory, getCourseVisual } from '../../domain/courseVisuals';
import { DEMO_WEEK_DATES, getScheduleMeetingsByDate } from '../../domain/schedule';
import { getCourseOffering } from '../../domain/selectors';
import { AcademicsHeader } from './AcademicsHeader';
import './academics.css';

type PlannerMode = 'recover' | 'safe' | 'project';

const TARGET_PRESETS = [
  { id: '75', pct: 75, label: '75%', description: 'Standard university minimum', numerator: 3, denominator: 4 },
  { id: '80', pct: 80, label: '80%', description: 'Honours / scholarship buffer', numerator: 4, denominator: 5 },
  { id: '85', pct: 85, label: '85%', description: 'High-standing target', numerator: 17, denominator: 20 },
  { id: '100', pct: 100, label: '100%', description: 'Zero remaining absences', numerator: 1, denominator: 1 },
] as const;

type TargetPresetId = (typeof TARGET_PRESETS)[number]['id'];

const SCALE_MIN = 50;
function fieldPos(percentage: number): string {
  const clamped = Math.min(100, Math.max(SCALE_MIN, percentage));
  return `${((clamped - SCALE_MIN) / (100 - SCALE_MIN)) * 100}%`;
}

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

function RiskPill({
  meetsTarget,
  close,
  unrecorded,
}: {
  meetsTarget: boolean;
  close: boolean;
  unrecorded: boolean;
}) {
  if (unrecorded) {
    return (
      <span className="att-risk-label text-muted-foreground">
        <CircleDot size={14} aria-hidden="true" />
        Unrecorded
      </span>
    );
  }
  if (!meetsTarget) {
    return (
      <span className="att-risk-label text-critical">
        <AlertTriangle size={14} strokeWidth={2.2} aria-hidden="true" />
        Below minimum
      </span>
    );
  }
  if (close) {
    return (
      <span className="att-risk-label text-warning">
        <CircleDot size={14} strokeWidth={2.2} aria-hidden="true" />
        Close to minimum
      </span>
    );
  }
  return (
    <span className="att-risk-label text-positive">
      <CheckCircle2 size={14} strokeWidth={2.2} aria-hidden="true" />
      Comfortable
    </span>
  );
}

function RecoveryPlannerPanel({
  snapshot,
  target,
  targetLabel,
  targetPct,
  onSelectSubject,
}: {
  snapshot: AttendanceSnapshot;
  target: { numerator: number; denominator: number };
  targetLabel: string;
  targetPct: number;
  onSelectSubject: (offeringId: string) => void;
}) {
  const plannerId = useId();
  const [mode, setMode] = useState<PlannerMode>('recover');
  const [futureAttendFlags, setFutureAttendFlags] = useState<boolean[]>(() =>
    Array(snapshot.remaining).fill(true),
  );
  const [attendInput, setAttendInput] = useState(() => String(snapshot.remaining));
  const [missInput, setMissInput] = useState('0');

  useEffect(() => {
    setFutureAttendFlags(Array(snapshot.remaining).fill(true));
    setAttendInput(String(snapshot.remaining));
    setMissInput('0');
  }, [snapshot.offeringId, snapshot.remaining, targetLabel]);

  const course = getCourseOffering(snapshot.offeringId);
  const visual = getCourseVisual(snapshot.offeringId, course?.name);
  const status = evaluateAttendanceStatus(snapshot, target);
  const recovery = calculateRecoveryPlan(snapshot, target);
  const safe = calculateSafeAbsences(snapshot, target);
  const pastHistory = useMemo(() => buildIllustrativeHistory(snapshot), [snapshot]);

  const activeFutureFlags = useMemo(() => {
    if (mode === 'safe' && safe.status === 'available') {
      return Array.from({ length: snapshot.remaining }, (_, idx) => idx >= safe.safeAbsences);
    }
    return futureAttendFlags;
  }, [mode, safe, snapshot.remaining, futureAttendFlags]);

  const attendCount =
    mode === 'project'
      ? Number(attendInput)
      : activeFutureFlags.filter(Boolean).length;
  const missCount =
    mode === 'project'
      ? Number(missInput)
      : snapshot.remaining - attendCount;

  const projection = calculateAttendanceProjection(
    snapshot,
    Number.isInteger(attendCount) ? attendCount : -1,
    Number.isInteger(missCount) ? missCount : -1,
    target,
  );

  // Build trajectory series for SVG chart (50%..100%)
  const chartModel = useMemo(() => {
    const pts: number[] = [];
    let a = 0;
    pastHistory.forEach((present, i) => {
      if (present) a += 1;
      pts.push((a / (i + 1)) * 100);
    });

    const futurePts: number[] = [];
    let fa = snapshot.attended;
    let crossIndex: number | null = status.meetsTarget ? 0 : null;
    for (let i = 0; i < snapshot.remaining; i += 1) {
      const attendsThis = i < activeFutureFlags.length ? activeFutureFlags[i] : i < Math.max(0, attendCount);
      if (attendsThis) fa += 1;
      const pctAtStep = (fa / (snapshot.conducted + i + 1)) * 100;
      futurePts.push(pctAtStep);
      if (crossIndex === null && fa * target.denominator >= target.numerator * (snapshot.conducted + i + 1)) {
        crossIndex = i + 1;
      }
    }

    const total = Math.max(2, snapshot.conducted + snapshot.remaining);
    const W = 320;
    const H = 84;
    const x = (idx: number) => (idx / (total - 1)) * W;
    const y = (p: number) => H - ((Math.max(SCALE_MIN, Math.min(100, p)) - SCALE_MIN) / (100 - SCALE_MIN)) * H;

    const pastPath = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(p).toFixed(1)}`)
      .join(' ');
    const futureSeries = pts.length > 0 ? [pts[pts.length - 1]!, ...futurePts] : futurePts;
    const futurePath = futureSeries
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(Math.max(0, snapshot.conducted - 1) + i).toFixed(1)} ${y(p).toFixed(1)}`)
      .join(' ');

    return { W, H, x, y, pastPath, futurePath, crossIndex };
  }, [pastHistory, snapshot, activeFutureFlags, attendCount, status.meetsTarget, target]);

  function handleModeChange(nextMode: PlannerMode) {
    setMode(nextMode);
    if (nextMode === 'safe' && safe.status === 'available') {
      const attend = Math.max(0, snapshot.remaining - safe.safeAbsences);
      setAttendInput(String(attend));
      setMissInput(String(safe.safeAbsences));
    } else if (nextMode === 'recover') {
      const allAttend = Array(snapshot.remaining).fill(true);
      setFutureAttendFlags(allAttend);
      setAttendInput(String(snapshot.remaining));
      setMissInput('0');
    } else if (nextMode === 'project') {
      const a = activeFutureFlags.filter(Boolean).length;
      setAttendInput(String(a));
      setMissInput(String(snapshot.remaining - a));
    }
  }

  function handleToggleFuturePill(index: number) {
    const next = activeFutureFlags.map((v, i) => (i === index ? !v : v));
    setFutureAttendFlags(next);
    const a = next.filter(Boolean).length;
    setAttendInput(String(a));
    setMissInput(String(snapshot.remaining - a));
    setMode('project');
  }

  const endPct = projection.valid ? projection.percentage : null;
  const endCounts = projection.valid
    ? `${projection.attended}/${projection.conducted}`
    : '—';
  const meetsInScenario = projection.valid && projection.meetsTarget;

  let calloutText = '';
  if (mode === 'safe') {
    calloutText = safe.explanation;
  } else if (mode === 'project' && (!projection.valid || attendCount !== snapshot.remaining)) {
    calloutText = projection.valid
      ? `Attending ${attendCount} and missing ${missCount} of ${snapshot.remaining} remaining sessions ends at ${projection.percentage?.toFixed(1)}% (${projection.attended}/${projection.conducted}).`
      : projection.error ?? 'Enter valid future session counts.';
  } else if (recovery.status === 'recoverable' && recovery.neededClasses !== null) {
    calloutText = `Attend the next ${recovery.neededClasses} consecutive ${course?.code ?? ''} ${recovery.neededClasses === 1 ? 'class' : 'classes'} to reach ${targetLabel} (${recovery.projectedAttended}/${recovery.projectedConducted}). All ${snapshot.remaining} remaining reach ${recovery.bestPossiblePercentage?.toFixed(1)}%.`;
  } else if (recovery.status === 'unreachable') {
    calloutText =
      recovery.neededClasses !== null
        ? `Needs ${recovery.neededClasses} consecutive classes to reach ${targetLabel}. With ${snapshot.remaining} remaining, best possible is ${recovery.bestPossiblePercentage?.toFixed(1)}% (${recovery.bestPossibleAttended}/${recovery.bestPossibleConducted}).`
        : recovery.explanation;
  } else {
    calloutText = safe.explanation;
  }

  const isClose =
    status.meetsTarget &&
    status.percentage !== null &&
    status.percentage < targetPct + 5;

  return (
    <section
      id={plannerId}
      className="planner-section"
      aria-labelledby={`${plannerId}-heading`}
      style={{ '--hue': String(visual.hue) } as CSSProperties}
    >
      <SectionHeader
        id={`${plannerId}-heading`}
        title="Recovery plan"
        action={
          <RiskPill
            meetsTarget={status.meetsTarget}
            close={isClose}
            unrecorded={status.state === 'unrecorded'}
          />
        }
      />

      <div className="planner-card">
        <div className="planner-card-head">
          <label className="sr-only" htmlFor={`${plannerId}-select`}>
            Select subject
          </label>
          <select
            id={`${plannerId}-select`}
            value={snapshot.offeringId}
            onChange={(e) => onSelectSubject(e.target.value)}
            className="planner-subject-select"
          >
            {DEMO_ATTENDANCE.map((snap) => {
              const offering = getCourseOffering(snap.offeringId);
              return (
                <option key={snap.offeringId} value={snap.offeringId}>
                  {offering ? `${offering.name} (${offering.code})` : snap.offeringId}
                </option>
              );
            })}
          </select>
          <p className="planner-counts-line">
            <span className="num">
              {snapshot.attended} of {snapshot.conducted}
            </span>{' '}
            attended · <span className="num">{snapshot.remaining}</span> sessions left
          </p>
        </div>

        <SegmentedControl
          label="Planner mode"
          value={mode}
          onChange={handleModeChange}
          options={[
            { value: 'recover', label: 'Recover' },
            { value: 'safe', label: 'Safe misses' },
            { value: 'project', label: 'What if?' },
          ]}
          className="mt-4"
        />

        <div className="planner-stat-pair" aria-live="polite">
          <div>
            <p className="planner-stat-kicker">Now</p>
            <p className={`num planner-stat-num ${!status.meetsTarget ? 'text-critical' : ''}`}>
              {status.percentage !== null ? `${status.percentage.toFixed(1)}%` : '—'}
            </p>
          </div>
          <span className="planner-arrow" aria-hidden="true">
            →
          </span>
          <div className="text-right">
            <p className="planner-stat-kicker">End of term ({endCounts})</p>
            <p
              className={`num planner-stat-num ${
                meetsInScenario ? 'text-cobalt' : 'text-critical'
              }`}
            >
              {endPct !== null ? `${endPct.toFixed(1)}%` : '—'}
            </p>
          </div>
        </div>

        <svg
          viewBox={`0 0 ${chartModel.W} ${chartModel.H}`}
          className="planner-trend-svg"
          role="img"
          aria-label={`Attendance trajectory for ${course?.name ?? snapshot.offeringId}, projected to ${endPct?.toFixed(1) ?? 'unavailable'} percent`}
        >
          <line
            x1="0"
            x2={chartModel.W}
            y1={chartModel.y(targetPct)}
            y2={chartModel.y(targetPct)}
            className="stroke-foreground/40"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
          <text
            x={chartModel.W}
            y={Math.max(10, chartModel.y(targetPct) - 4)}
            textAnchor="end"
            className="fill-muted-foreground text-[9px]"
          >
            {targetLabel}
          </text>
          <rect
            x={chartModel.x(Math.max(0, snapshot.conducted - 1))}
            y="0"
            width={Math.max(0, chartModel.W - chartModel.x(Math.max(0, snapshot.conducted - 1)))}
            height={chartModel.H}
            className="fill-cobalt/[0.07]"
          />
          {chartModel.pastPath && (
            <path
              d={chartModel.pastPath}
              fill="none"
              className="stroke-foreground/55"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
          )}
          {chartModel.futurePath && (
            <path
              d={chartModel.futurePath}
              fill="none"
              className={meetsInScenario ? 'stroke-cobalt' : 'stroke-critical'}
              strokeWidth="2.25"
              strokeDasharray="4 3"
              strokeLinejoin="round"
            />
          )}
          {endPct !== null && (
            <circle
              cx={chartModel.W}
              cy={chartModel.y(endPct)}
              r="3.75"
              className={meetsInScenario ? 'fill-cobalt' : 'fill-critical'}
            />
          )}
        </svg>

        <div className="planner-sessions">
          <div className="planner-sessions-head">
            <span>Recorded · illustrative</span>
            <span>Remaining · tap to toggle</span>
          </div>
          <div className="planner-pills-row">
            <div
              className="planner-past-bars"
              role="img"
              aria-label={`${snapshot.attended} attended, ${snapshot.conducted - snapshot.attended} missed`}
            >
              {pastHistory.map((present, idx) => (
                <span
                  key={idx}
                  className={present ? 'past-bar past-bar--on' : 'past-bar past-bar--miss'}
                />
              ))}
            </div>
            <span className="planner-pills-sep" aria-hidden="true" />
            <ul className="planner-future-list" aria-label="Plan remaining sessions">
              {activeFutureFlags.map((attending, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    aria-pressed={attending}
                    aria-label={`Remaining session ${idx + 1}: ${attending ? 'attending' : 'skipping'}`}
                    onClick={() => handleToggleFuturePill(idx)}
                    className={`future-pill press ${
                      attending ? 'future-pill--on' : 'future-pill--off'
                    } ${chartModel.crossIndex === idx + 1 ? 'future-pill--cross' : ''}`}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>

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
                value={attendInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setAttendInput(val);
                  const n = Number(val);
                  if (Number.isInteger(n) && n >= 0 && n <= snapshot.remaining) {
                    setFutureAttendFlags(
                      Array.from({ length: snapshot.remaining }, (_, idx) => idx < n),
                    );
                  }
                }}
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
                value={missInput}
                onChange={(e) => setMissInput(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="planner-callout" data-feasible={meetsInScenario} role="status">
          <p>{calloutText}</p>
        </div>

        <p className="planner-assumption">
          {mode === 'safe'
            ? safe.assumptionNote
            : `Based on recorded ${snapshot.attended}/${snapshot.conducted} with ${snapshot.remaining} remaining sessions. Past tick strip is an illustrative distribution matching recorded totals.`}
        </p>

        {attendCount !== snapshot.remaining && mode !== 'safe' && (
          <button
            type="button"
            onClick={() => handleModeChange('recover')}
            className="planner-reset-btn"
          >
            Reset to attend all
          </button>
        )}
      </div>
    </section>
  );
}

function DayOffChecker({
  target,
}: {
  target: { numerator: number; denominator: number };
}) {
  const activeDates = useMemo(
    () =>
      DEMO_WEEK_DATES.filter((date) =>
        getScheduleMeetingsByDate(date).some(
          (m) => m.kind === 'class' && m.status === 'scheduled',
        ),
      ),
    [],
  );

  const [selectedDate, setSelectedDate] = useState<string>(activeDates[2] ?? activeDates[0]!);

  const missedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of getScheduleMeetingsByDate(selectedDate)) {
      if (m.kind === 'class' && m.status === 'scheduled' && m.offeringId) {
        counts[m.offeringId] = (counts[m.offeringId] ?? 0) + 1;
      }
    }
    return counts;
  }, [selectedDate]);

  const impact = evaluateDayAbsenceImpact(DEMO_ATTENDANCE, missedCounts, target);
  const blocker = impact.blockingOfferingId
    ? getCourseOffering(impact.blockingOfferingId)
    : undefined;

  return (
    <section aria-labelledby="day-off-heading" className="day-off-section">
      <SectionHeader id="day-off-heading" title="Can I take a day off?" />
      <div className="day-off-chips no-scrollbar" role="radiogroup" aria-label="Timetable day">
        {activeDates.map((date) => {
          const d = new Date(`${date}T00:00:00+05:30`);
          const label = new Intl.DateTimeFormat('en-IN', {
            timeZone: DEMO_TIMEZONE,
            weekday: 'short',
            day: 'numeric',
          }).format(d);
          const active = date === selectedDate;
          return (
            <button
              key={date}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSelectedDate(date)}
              className="event-chip num press"
              data-selected={active}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="day-off-result">
        <p
          className={`day-off-verdict ${impact.safe ? 'text-positive' : 'text-critical'}`}
          aria-live="polite"
        >
          {impact.safe
            ? 'Yes — this day is safe to skip.'
            : `Better not. ${blocker?.code ?? 'One course'} can’t afford missing it.`}
        </p>

        <ul className="day-off-list">
          {impact.courses.map((row) => {
            const course = getCourseOffering(row.offeringId);
            const visual = getCourseVisual(row.offeringId, course?.name);
            return (
              <li
                key={row.offeringId}
                className="day-off-row"
                style={{ '--hue': String(visual.hue) } as CSSProperties}
              >
                <span className="day-off-dot tint-bar" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-[0.875rem] font-medium">
                    {course?.name ?? row.offeringId}
                  </strong>
                  <span className="text-[0.75rem] text-muted-foreground">
                    Misses <span className="num">{row.missedSessions}</span>{' '}
                    {row.missedSessions === 1 ? 'session' : 'sessions'}
                  </span>
                </span>
                <span className="num shrink-0 text-right text-[0.875rem]">
                  <span className="text-muted-foreground">
                    {row.currentPercentage?.toFixed(1) ?? '—'}
                  </span>
                  <span className="mx-1 text-muted-foreground" aria-hidden="true">
                    →
                  </span>
                  <span className={`font-semibold ${row.safeToMiss ? 'text-foreground' : 'text-critical'}`}>
                    {row.afterPercentage !== null ? `${row.afterPercentage.toFixed(1)}%` : 'Exceeds left'}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-[0.75rem] text-muted-foreground">
          Simulated impact of missing all scheduled classes on that day against remaining term sessions.
        </p>
      </div>
    </section>
  );
}

export function Attendance() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [targetId, setTargetId] = useState<TargetPresetId>('75');
  const [pickerOpen, setPickerOpen] = useState(false);

  const presetIndex = TARGET_PRESETS.findIndex((t) => t.id === targetId);
  const activeTarget = TARGET_PRESETS[Math.max(0, presetIndex)]!;

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
  const aggPct = aggregate.percentage ?? 0;
  const aggMargin = aggPct - activeTarget.pct;

  function selectSubject(offeringId: string) {
    setSearchParams({ subject: offeringId }, { replace: true });
  }

  function stepPreset(delta: number) {
    const nextIdx = Math.max(0, Math.min(TARGET_PRESETS.length - 1, presetIndex + delta));
    const next = TARGET_PRESETS[nextIdx];
    if (next) setTargetId(next.id);
  }

  return (
    <div className="academics-page">
      <AcademicsHeader />

      <div className="att-layout-grid">
        <div className="att-left-col">
          {/* Editorial Attendance Overview */}
          <section aria-labelledby="overall-attendance">
            <h2 id="overall-attendance" className="sr-only">
              Overall attendance
            </h2>
            <div className="att-hero-row">
              <p className="num att-hero-number">
                {aggPct.toFixed(1)}
                <span>%</span>
              </p>

              <div className="att-target-box">
                <p className="text-[0.75rem] text-muted-foreground">Minimum</p>
                <div className="att-target-stepper">
                  <button
                    type="button"
                    onClick={() => stepPreset(-1)}
                    disabled={presetIndex <= 0}
                    aria-label="Lower minimum attendance target"
                    className="stepper-icon-btn press"
                  >
                    <Minus size={14} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    onClick={() => setPickerOpen(true)}
                    className="num stepper-val-btn"
                  >
                    {activeTarget.label}
                  </button>
                  <button
                    type="button"
                    onClick={() => stepPreset(1)}
                    disabled={presetIndex >= TARGET_PRESETS.length - 1}
                    aria-label="Raise minimum attendance target"
                    className="stepper-icon-btn press"
                  >
                    <Plus size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            <p className="att-hero-copy">
              <strong className="num font-medium text-foreground">
                {aggregate.attended} of {aggregate.conducted}
              </strong>{' '}
              classes attended.{' '}
              {aggMargin >= 0 ? (
                <>
                  Overall{' '}
                  <span className="num font-medium text-positive">
                    +{aggMargin.toFixed(1)} points
                  </span>{' '}
                  above {activeTarget.label}.
                </>
              ) : (
                <>
                  Overall{' '}
                  <span className="num font-medium text-critical">
                    {Math.abs(aggMargin).toFixed(1)} points
                  </span>{' '}
                  below {activeTarget.label}.
                </>
              )}
            </p>
          </section>

          {/* Dot-plot Field Visualization */}
          <section aria-labelledby="att-subjects-heading">
            <SectionHeader
              id="att-subjects-heading"
              title="By subject"
              action={
                <span className="text-[0.75rem] text-muted-foreground">Can still miss</span>
              }
            />

            <div className="att-field-wrap">
              <div className="att-field-guides" aria-hidden="true">
                <div
                  className="att-field-threshold-line"
                  style={{ left: fieldPos(activeTarget.pct) }}
                >
                  <span className="num">{activeTarget.pct}</span>
                </div>
                <div className="att-field-agg-line" style={{ left: fieldPos(aggPct) }} />
                {[50, 100].map((tick) => (
                  <span key={tick} className="num att-field-tick" style={{ left: fieldPos(tick) }}>
                    {tick}
                  </span>
                ))}
              </div>

              <ul className="att-field-list">
                {ranked.map((snapshot) => {
                  const course = getCourseOffering(snapshot.offeringId);
                  const visual = getCourseVisual(snapshot.offeringId, course?.name);
                  const status = evaluateAttendanceStatus(snapshot, activeTarget);
                  const safe = calculateSafeAbsences(snapshot, activeTarget);
                  const p = status.percentage ?? 0;
                  const active = snapshot.offeringId === selectedSnapshot.offeringId;
                  const below = !status.meetsTarget;
                  const close = !below && p < activeTarget.pct + 5;
                  const miss = safe.status === 'available' ? safe.safeAbsences : 0;

                  return (
                    <li key={snapshot.offeringId}>
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => selectSubject(snapshot.offeringId)}
                        aria-label={`${course?.name ?? snapshot.offeringId}: ${p.toFixed(1)}%. ${below ? 'Below minimum.' : `Can miss ${miss} more.`} Select recovery planner.`}
                        className="att-field-row"
                        data-selected={active}
                        style={{ '--hue': String(visual.hue) } as CSSProperties}
                      >
                        <span className="att-field-name">{visual.shortName}</span>

                        <span className="att-field-track">
                          <span className="att-field-rail" />
                          <span
                            className={`att-field-fill ${below ? 'bg-critical/35' : 'bg-foreground/15'}`}
                            style={{ width: fieldPos(p) }}
                          />
                          <span
                            className={`num att-field-pill ${
                              below
                                ? 'att-field-pill--below'
                                : close
                                  ? 'att-field-pill--close'
                                  : ''
                            }`}
                            style={{ left: fieldPos(p) }}
                          >
                            {Math.round(p)}
                          </span>
                        </span>

                        <span className="att-field-right">
                          {below ? (
                            <span className="text-[0.75rem] font-semibold text-critical">
                              Below
                            </span>
                          ) : (
                            <span
                              className={`num text-[0.9375rem] font-semibold ${
                                miss === 0 ? 'text-warning' : 'text-foreground'
                              }`}
                            >
                              {miss}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <p className="mt-1 text-[0.75rem] leading-snug text-muted-foreground">
              Numbers on the right are classes you can still skip this term and finish at or above{' '}
              {activeTarget.label}. Tap any subject to plan.
            </p>
          </section>
        </div>

        <div className="att-right-col">
          <RecoveryPlannerPanel
            snapshot={selectedSnapshot}
            target={{
              numerator: activeTarget.numerator,
              denominator: activeTarget.denominator,
            }}
            targetLabel={activeTarget.label}
            targetPct={activeTarget.pct}
            onSelectSubject={selectSubject}
          />
          <DayOffChecker target={activeTarget} />
        </div>
      </div>

      <Dialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Minimum attendance"
        description="Choose the minimum threshold used for eligibility and recovery calculations."
      >
        <div
          className="threshold-picker-list"
          role="radiogroup"
          aria-label="Minimum attendance requirement"
        >
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
                  <strong className="num">{preset.label}</strong>
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
