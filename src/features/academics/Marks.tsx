import { useEffect, useId, useMemo, useState, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { SegmentedControl } from '../../components/SegmentedControl';
import { StatusBadge } from '../../components/StatusBadge';
import { SectionHeader } from '../../components/Typography';
import {
  DEMO_ASSESSMENTS,
  DEMO_COURSE_OFFERINGS,
  DEMO_GRADING_POLICIES,
  DEMO_SEMESTERS,
  DEMO_STUDENT,
} from '../../data/demoData';
import type { AssessmentItem, CourseOffering, GradingPolicy } from '../../data/types';
import {
  calculateGradeTargetPlan,
  calculateSemesterSgpa,
  evaluateCourseAcademics,
  evaluateCourseWithEstimate,
} from '../../domain/academics';
import { getCourseVisual } from '../../domain/courseVisuals';
import { AcademicsHeader } from './AcademicsHeader';
import './academics.css';

function useIsDesktopLayout(): boolean {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(min-width: 960px)').matches
      : true,
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(min-width: 960px)');
    const onChange = () => setIsDesktop(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return isDesktop;
}

function ExamScale({
  course,
  assessments,
  policy,
  examItem,
  requiredScore,
  estimateScore,
}: {
  course: CourseOffering;
  assessments: readonly AssessmentItem[];
  policy: GradingPolicy;
  examItem: AssessmentItem;
  requiredScore: number | null;
  estimateScore: number | null;
}) {
  const bands = useMemo(() => {
    const out: { label: string; fromPct: number }[] = [];
    for (const band of policy.bands.filter((b) => b.points > 0)) {
      const p = calculateGradeTargetPlan(course, assessments, policy, band.label);
      if (p.status === 'required' && p.requiredScore !== null) {
        out.push({ label: band.label, fromPct: (p.requiredScore / examItem.maxMarks) * 100 });
      } else if (p.status === 'secured') {
        out.push({ label: band.label, fromPct: 0 });
      }
    }
    return out;
  }, [course, assessments, policy, examItem.maxMarks]);

  const needPct = requiredScore !== null ? (requiredScore / examItem.maxMarks) * 100 : null;
  const estPct =
    estimateScore !== null && Number.isFinite(estimateScore)
      ? Math.min(100, Math.max(0, (estimateScore / examItem.maxMarks) * 100))
      : null;

  if (bands.length === 0) return null;

  return (
    <div className="exam-scale" aria-hidden="true">
      <div className="exam-scale-bar">
        <div className="exam-scale-track">
          {bands.map((b, i) => {
            const toPct = i === 0 ? 100 : bands[i - 1]!.fromPct;
            const widthPct = Math.max(0, toPct - b.fromPct);
            if (widthPct <= 0) return null;
            return (
              <span
                key={b.label}
                className="exam-scale-seg"
                style={{
                  left: `${b.fromPct}%`,
                  width: `${widthPct}%`,
                  background: `color-mix(in oklch, var(--cobalt) ${Math.max(18, 88 - i * 13)}%, transparent)`,
                }}
              />
            );
          })}
        </div>
        {needPct !== null && (
          <span className="exam-scale-need" style={{ left: `${needPct}%` }} />
        )}
        {estPct !== null && (
          <span className="exam-scale-est" style={{ left: `${estPct}%` }} />
        )}
      </div>
      <div className="exam-scale-labels">
        {bands.map((b, i) => {
          const toPct = i === 0 ? 100 : bands[i - 1]!.fromPct;
          if (toPct - b.fromPct < 6) return null;
          return (
            <span key={b.label} style={{ left: `${(b.fromPct + toPct) / 2}%` }}>
              {b.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function GradePlannerPanel({
  course,
  semesterCourses,
  onSelectCourse,
  policy,
  targetLabel,
  onTargetChange,
  estimateValue,
  onEstimateChange,
  roundBeforeClassify,
  onToggleRounding,
  inSheet = false,
}: {
  course: CourseOffering;
  semesterCourses: readonly CourseOffering[];
  onSelectCourse: (id: string) => void;
  policy: GradingPolicy;
  targetLabel: string;
  onTargetChange: (label: string) => void;
  estimateValue: string;
  onEstimateChange: (val: string) => void;
  roundBeforeClassify: boolean;
  onToggleRounding: () => void;
  inSheet?: boolean;
}) {
  const plannerId = useId();
  const effectivePolicy: GradingPolicy = {
    ...policy,
    roundTotalBeforeClassification: roundBeforeClassify,
  };
  const assessments = DEMO_ASSESSMENTS.filter((a) => a.offeringId === course.id);
  const summary = evaluateCourseAcademics(course, assessments, effectivePolicy);
  const plan = calculateGradeTargetPlan(course, assessments, effectivePolicy, targetLabel);
  const visual = getCourseVisual(course.id, course.name);

  const pendingExam = summary.unpostedItems.length === 1 ? summary.unpostedItems[0] : undefined;
  const trimmedEstimate = estimateValue.trim();
  const numericEstimate = trimmedEstimate === '' ? null : Number(trimmedEstimate);
  const estimateResult =
    pendingExam && numericEstimate !== null
      ? evaluateCourseWithEstimate(
          course,
          assessments,
          effectivePolicy,
          pendingExam.id,
          numericEstimate,
        )
      : null;

  let headlineValue = '—';
  if (plan.status === 'required' && plan.requiredScore !== null && plan.examItem) {
    headlineValue = `${plan.requiredScore} / ${plan.examItem.maxMarks}`;
  } else if (plan.status === 'secured') {
    headlineValue = 'Secured';
  } else if (plan.status === 'unreachable') {
    headlineValue = 'Out of reach';
  } else if (plan.status === 'complete' && summary.actualPercentage !== null) {
    headlineValue = `${summary.actualPercentage.toFixed(2)}% (${summary.actualGrade?.label})`;
  } else if (plan.status === 'multiple-pending') {
    headlineValue = 'Waiting for marks';
  }

  return (
    <section
      className={inSheet ? 'planner-sheet-body' : 'grade-planner-card'}
      aria-labelledby={inSheet ? undefined : `${plannerId}-heading`}
      style={{ '--hue': String(visual.hue) } as CSSProperties}
    >
      <div className={inSheet ? 'space-y-4' : 'grade-planner-top'}>
        {!inSheet && (
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <label className="sr-only" htmlFor={`${plannerId}-course`}>
                  Select course
                </label>
                <select
                  id={`${plannerId}-course`}
                  value={course.id}
                  onChange={(e) => onSelectCourse(e.target.value)}
                  className="planner-subject-select"
                >
                  {semesterCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
                <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">
                  <span className="num">{summary.postedContributionPct.toFixed(1)}%</span> posted of{' '}
                  <span className="num">{summary.postedWeightPct}%</span> ·{' '}
                  {course.credits === 0 ? 'Audit (0 cr)' : `${course.credits} credits`}
                </p>
              </div>
              <StatusBadge
                label={summary.isActual ? 'Finalized' : 'In progress'}
                tone={summary.isActual ? 'success' : 'accent'}
              />
            </div>
          </div>
        )}

        {inSheet && (
          <ul className="assessment-rows assessment-rows--sheet">
            {assessments.map((item) => (
              <li key={item.id} className="assessment-row">
                <span className="assessment-name">{item.title}</span>
                <span className="assessment-meta num">
                  <span>Weight {(item.weightBps / 100).toFixed(0)}%</span>
                  <strong>
                    {item.posted && item.earnedMarks !== null
                      ? `${item.earnedMarks} / ${item.maxMarks}`
                      : 'Pending'}
                  </strong>
                </span>
              </li>
            ))}
          </ul>
        )}

        {!summary.isActual && (
          <div>
            <p className="mb-2 text-[0.8125rem] font-medium text-muted-foreground" id={`${plannerId}-target`}>
              Target grade
            </p>
            <div
              className="grade-band-grid"
              role="radiogroup"
              aria-labelledby={`${plannerId}-target`}
            >
              {effectivePolicy.bands
                .filter((b) => b.points > 0)
                .map((band) => {
                  const selected = band.label === plan.targetBand.label;
                  const bandPlan = calculateGradeTargetPlan(
                    course,
                    assessments,
                    effectivePolicy,
                    band.label,
                  );
                  const bandReachable =
                    bandPlan.status === 'required' ||
                    bandPlan.status === 'secured' ||
                    bandPlan.status === 'complete';

                  return (
                    <button
                      key={band.label}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => onTargetChange(band.label)}
                      className={`grade-band-btn press ${
                        selected ? 'grade-band-btn--selected' : ''
                      } ${!bandReachable && !selected ? 'opacity-55' : ''}`}
                    >
                      <span className="grade-band-letter">{band.label}</span>
                      <span className="num grade-band-min">
                        {bandReachable ? `≥${band.minPercentage}%` : '—'}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      <div className={inSheet ? 'grade-planner-bottom grade-planner-bottom--sheet' : 'grade-planner-bottom'}>
        <div aria-live="polite">
          <p className="text-[0.8125rem] text-muted-foreground">
            {summary.isActual
              ? 'Recorded course result'
              : plan.examItem
                ? `You need in ${plan.examItem.title}`
                : 'Target feasibility'}
          </p>
          <p className="num grade-hero-need">{headlineValue}</p>
          <p className="mt-1.5 text-[0.875rem] leading-snug text-muted-foreground">
            {plan.explanation}
          </p>
        </div>

        {pendingExam && (
          <>
            <ExamScale
              course={course}
              assessments={assessments}
              policy={effectivePolicy}
              examItem={pendingExam}
              requiredScore={plan.requiredScore}
              estimateScore={estimateResult?.valid ? numericEstimate : null}
            />

            <div className="estimate-block">
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor={`${plannerId}-estimate`} className="text-[0.8125rem] font-medium">
                  What-if {pendingExam.title} estimate
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={`${plannerId}-estimate`}
                    type="number"
                    min={0}
                    max={pendingExam.maxMarks}
                    step={effectivePolicy.examMarkIncrement}
                    placeholder={`0–${pendingExam.maxMarks}`}
                    value={estimateValue}
                    onChange={(e) => onEstimateChange(e.target.value)}
                    className="estimate-num-input num"
                  />
                  {estimateValue !== '' && (
                    <button
                      type="button"
                      className="text-[0.8125rem] font-medium text-cobalt hover:underline"
                      onClick={() => onEstimateChange('')}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={pendingExam.maxMarks}
                step={effectivePolicy.examMarkIncrement}
                value={
                  numericEstimate !== null && Number.isFinite(numericEstimate)
                    ? Math.min(pendingExam.maxMarks, Math.max(0, numericEstimate))
                    : 0
                }
                aria-label={`Slide what-if ${pendingExam.title} estimate`}
                onChange={(e) => onEstimateChange(e.target.value)}
                className="mt-3 h-2 w-full cursor-pointer accent-[var(--cobalt)]"
              />

              {estimateResult && (
                <p
                  className={`mt-2 text-[0.8125rem] ${
                    estimateResult.valid ? 'text-foreground' : 'text-critical'
                  }`}
                  role="status"
                >
                  {estimateResult.valid
                    ? `Projected course total: ${estimateResult.projectedPercentage?.toFixed(2)}% (${estimateResult.projectedGrade?.label}, ${estimateResult.projectedGrade?.points} pts) — updates Projected SGPA.`
                    : estimateResult.error}
                </p>
              )}
            </div>
          </>
        )}

        <details className="policy-box">
          <summary>
            <ChevronRight size={15} className="policy-chevron" aria-hidden="true" />
            <span>How this is graded</span>
          </summary>
          <div className="policy-box-row">
            <span>Classification</span>
            <button type="button" className="policy-toggle-btn" onClick={onToggleRounding}>
              {roundBeforeClassify ? 'Rounded half-up (2 dp)' : 'Exact weighted total'}
            </button>
          </div>
          <p className="mt-2 text-[0.75rem] leading-relaxed text-muted-foreground">
            10-point scale (O ≥ 90%, A+ ≥ 80%, A ≥ 70%, B+ ≥ 60%, B ≥ 50%, C ≥ 45%, P ≥ 40%).
            Whole exam mark increment ({effectivePolicy.examMarkIncrement}). Passing floor{' '}
            {effectivePolicy.passingFloor}%.
          </p>
        </details>
      </div>
    </section>
  );
}

function SgpaComparisonCard({
  sem4Sgpa,
  sem5Result,
  finalizedCount,
  creditedCount,
  auditCount,
  onApplySampleEstimates,
  hasEstimates,
  onClearEstimates,
}: {
  sem4Sgpa: number | null;
  sem5Result: ReturnType<typeof calculateSemesterSgpa>;
  finalizedCount: number;
  creditedCount: number;
  auditCount: number;
  onApplySampleEstimates: () => void;
  hasEstimates: boolean;
  onClearEstimates: () => void;
}) {
  const projected = sem5Result.status === 'projected' ? sem5Result.sgpa : null;
  const delta = projected !== null && sem4Sgpa !== null ? projected - sem4Sgpa : null;

  const W = 280;
  const H = 64;
  const min = 7.6;
  const max = 9.4;
  const y = (v: number) => H - 8 - ((v - min) / (max - min)) * (H - 16);

  return (
    <section aria-labelledby="sgpa-overview-title" className="marks-sgpa-section">
      <h2 id="sgpa-overview-title" className="sr-only">
        Semester SGPA summary
      </h2>
      <div className="marks-sgpa-split">
        <div className="pr-4">
          <p className="text-[0.8125rem] text-muted-foreground">Semester 4 · Recorded</p>
          <p className="num mt-1 text-[2.875rem] leading-none font-semibold tracking-[-0.055em]">
            {sem4Sgpa !== null ? sem4Sgpa.toFixed(2) : '—'}
          </p>
          <p className="mt-2 text-[0.75rem] text-muted-foreground">Finalized transcript</p>
        </div>

        <div className="border-l pl-4">
          <p className="text-[0.8125rem] text-muted-foreground">
            {projected !== null ? 'Semester 5 · Projected' : 'Semester 5 · Subjects'}
          </p>
          <p
            className="num mt-1 text-[2.875rem] leading-none font-semibold tracking-[-0.055em] text-cobalt"
            aria-live="polite"
          >
            {projected !== null ? (
              <span className="underline decoration-cobalt/40 decoration-dashed decoration-2 underline-offset-[6px]">
                {projected.toFixed(2)}
              </span>
            ) : (
              `${finalizedCount}/${creditedCount}`
            )}
          </p>
          <p className="mt-2 text-[0.75rem] text-muted-foreground">
            {delta !== null ? (
              <>
                <span className={`num font-medium ${delta >= 0 ? 'text-positive' : 'text-critical'}`}>
                  {delta >= 0 ? '+' : '−'}
                  {Math.abs(delta).toFixed(2)}
                </span>{' '}
                vs Sem 4
              </>
            ) : (
              'Add exam estimates to project'
            )}
          </p>
        </div>
      </div>

      {sem4Sgpa !== null && projected !== null && (
        <svg
          viewBox={`0 0 ${W} ${H + 16}`}
          className="mt-4 w-full"
          role="img"
          aria-label={`SGPA comparison: Sem 4 recorded ${sem4Sgpa.toFixed(2)}, Sem 5 projected ${projected.toFixed(2)}`}
        >
          <line
            x1="28"
            y1={y(sem4Sgpa)}
            x2={W - 28}
            y2={y(projected)}
            className="stroke-cobalt"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <circle cx="28" cy={y(sem4Sgpa)} r="4" className="fill-foreground" />
          <text x="28" y={H + 12} textAnchor="start" className="fill-muted-foreground text-[10px]">
            S4 · {sem4Sgpa.toFixed(2)}
          </text>
          <circle
            cx={W - 28}
            cy={y(projected)}
            r="4.5"
            className="fill-surface stroke-cobalt"
            strokeWidth="2"
          />
          <text x={W - 28} y={H + 12} textAnchor="end" className="fill-cobalt text-[10px] font-medium">
            S5 · {projected.toFixed(2)} (Proj.)
          </text>
        </svg>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[0.75rem] text-muted-foreground">
        <span>
          <strong className="num text-foreground">{sem5Result.eligibleCredits}</strong> credits count toward SGPA
          {auditCount > 0 ? ' · Audit courses excluded' : ''}
        </span>
        {projected === null ? (
          <button
            type="button"
            onClick={onApplySampleEstimates}
            className="font-medium text-cobalt hover:underline"
          >
            Preview with sample estimates
          </button>
        ) : hasEstimates ? (
          <button
            type="button"
            onClick={onClearEstimates}
            className="font-medium text-cobalt hover:underline"
          >
            Clear estimates
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function Marks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [targetLabel, setTargetLabel] = useState('A+');
  const [estimates, setEstimates] = useState<Record<string, string>>({});
  const [roundBeforeClassify, setRoundBeforeClassify] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const isDesktop = useIsDesktopLayout();

  const requestedSem = searchParams.get('semester');
  const activeSemester =
    DEMO_SEMESTERS.find((s) => s.id === requestedSem) ??
    DEMO_SEMESTERS.find((s) => s.id === DEMO_STUDENT.currentSemesterId) ??
    DEMO_SEMESTERS[0]!;

  const basePolicy =
    DEMO_GRADING_POLICIES.find((p) => p.id === activeSemester.policyId) ??
    DEMO_GRADING_POLICIES[0]!;
  const policy: GradingPolicy = {
    ...basePolicy,
    roundTotalBeforeClassification: roundBeforeClassify,
  };

  const semesterCourses = useMemo(
    () => DEMO_COURSE_OFFERINGS.filter((c) => c.semesterId === activeSemester.id),
    [activeSemester.id],
  );
  const creditedCourses = semesterCourses.filter((c) => c.credits > 0);
  const auditCourses = semesterCourses.filter((c) => c.credits === 0);

  const requestedSubject = searchParams.get('subject');
  const selectedCourse =
    semesterCourses.find((c) => c.id === requestedSubject) ?? semesterCourses[0]!;

  const numericEstimates: Record<string, number> = {};
  for (const [courseId, raw] of Object.entries(estimates)) {
    const trimmed = raw.trim();
    if (trimmed !== '') {
      const n = Number(trimmed);
      if (Number.isFinite(n)) numericEstimates[courseId] = n;
    }
  }

  const sgpaResult = calculateSemesterSgpa(
    semesterCourses,
    DEMO_ASSESSMENTS,
    policy,
    numericEstimates,
  );

  const sem4Courses = useMemo(
    () => DEMO_COURSE_OFFERINGS.filter((c) => c.semesterId === 'sem-4'),
    [],
  );
  const sem4Result = calculateSemesterSgpa(sem4Courses, DEMO_ASSESSMENTS, policy);

  function selectSemester(semId: string) {
    const firstCourse = DEMO_COURSE_OFFERINGS.find((c) => c.semesterId === semId);
    setMobileSheetOpen(false);
    setSearchParams(
      firstCourse ? { semester: semId, subject: firstCourse.id } : { semester: semId },
      { replace: true },
    );
  }

  function selectCourse(courseId: string) {
    setSearchParams({ semester: activeSemester.id, subject: courseId }, { replace: true });
    if (!isDesktop) {
      setMobileSheetOpen(true);
    }
  }

  const finalizedCount = creditedCourses.filter((course) => {
    const summary = evaluateCourseAcademics(
      course,
      DEMO_ASSESSMENTS.filter((a) => a.offeringId === course.id),
      policy,
    );
    return summary.isActual;
  }).length;

  return (
    <div className="academics-page">
      <AcademicsHeader />

      <div className="mb-7 max-w-xs">
        <SegmentedControl
          label="Select semester"
          value={activeSemester.id}
          onChange={selectSemester}
          options={DEMO_SEMESTERS.map((semester) => ({
            value: semester.id,
            label: semester.shortLabel,
          }))}
        />
      </div>

      <div className="marks-layout-grid">
        <div className="marks-left-col">
          {activeSemester.status === 'in-progress' ? (
            <SgpaComparisonCard
              sem4Sgpa={sem4Result.sgpa}
              sem5Result={sgpaResult}
              finalizedCount={finalizedCount}
              creditedCount={creditedCourses.length}
              auditCount={auditCourses.length}
              hasEstimates={Object.keys(numericEstimates).length > 0}
              onApplySampleEstimates={() =>
                setEstimates({
                  'off-sem5-cs301': '80',
                  'off-sem5-cs302': '90',
                })
              }
              onClearEstimates={() => setEstimates({})}
            />
          ) : (
            <section aria-labelledby="rec-sgpa-title">
              <p className="text-[0.8125rem] text-muted-foreground">
                {activeSemester.label} · <span className="font-medium text-foreground">Recorded</span>
              </p>
              <h2 id="rec-sgpa-title" className="sr-only">
                Recorded SGPA
              </h2>
              <p className="num mt-2 text-[4.25rem] leading-[0.88] font-semibold tracking-[-0.06em]">
                {sgpaResult.sgpa?.toFixed(2) ?? '—'}
              </p>
              <p className="mt-3 text-[0.875rem] text-muted-foreground">
                SGPA across <span className="num text-foreground">{sgpaResult.eligibleCredits}</span>{' '}
                credits. Finalized transcript record.
              </p>
            </section>
          )}

          {/* Credited courses list */}
          <section aria-labelledby="marks-ledger-heading">
            <SectionHeader
              id="marks-ledger-heading"
              title="Subjects"
              action={
                <span className="text-[0.75rem] text-muted-foreground">Grade / Posted</span>
              }
            />

            <ul className="marks-ledger-list">
              {creditedCourses.map((course) => {
                const assessments = DEMO_ASSESSMENTS.filter((a) => a.offeringId === course.id);
                const summary = evaluateCourseAcademics(course, assessments, policy);
                const visual = getCourseVisual(course.id, course.name);
                const isSelected = course.id === selectedCourse.id;

                const estRaw = estimates[course.id];
                const estNum =
                  estRaw !== undefined && estRaw.trim() !== '' ? Number(estRaw) : null;
                const pendingExam =
                  summary.unpostedItems.length === 1 ? summary.unpostedItems[0] : undefined;
                const proj =
                  pendingExam && estNum !== null
                    ? evaluateCourseWithEstimate(course, assessments, policy, pendingExam.id, estNum)
                    : null;

                const fillPct =
                  summary.isActual && summary.actualPercentage !== null
                    ? summary.actualPercentage
                    : proj?.valid && proj.projectedPercentage !== null
                      ? proj.projectedPercentage
                      : summary.postedContributionPct;

                const showInlineDetails = isDesktop && isSelected;

                return (
                  <li
                    key={course.id}
                    className="marks-course-item"
                    data-selected={isSelected}
                    style={{ '--hue': String(visual.hue) } as CSSProperties}
                  >
                    <button
                      type="button"
                      aria-expanded={isDesktop ? isSelected : mobileSheetOpen && isSelected}
                      aria-haspopup={isDesktop ? undefined : 'dialog'}
                      onClick={() => selectCourse(course.id)}
                      className="marks-course-btn press"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-[0.9375rem] font-medium tracking-[-0.01em]">
                            {course.name}
                          </span>
                          <span className="num shrink-0 whitespace-nowrap text-[0.75rem] text-muted-foreground">
                            {course.code}
                          </span>
                        </span>
                        <span className="mt-2 flex items-center gap-2">
                          <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                            <span
                              className="tint-bar absolute inset-y-0 left-0 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(0, fillPct))}%` }}
                            />
                          </span>
                          <span className="num w-11 text-right text-[0.75rem] text-muted-foreground">
                            {fillPct.toFixed(0)}%
                          </span>
                        </span>
                      </span>

                      <span className="w-16 shrink-0 text-right">
                        {summary.isActual && summary.actualGrade ? (
                          <span className="num block text-[1.0625rem] font-semibold text-foreground">
                            {summary.actualGrade.label}
                          </span>
                        ) : proj?.valid && proj.projectedGrade ? (
                          <span className="num block text-[1.0625rem] font-semibold text-cobalt">
                            {proj.projectedGrade.label}
                            <span className="block text-[0.625rem] font-normal">Projected</span>
                          </span>
                        ) : (
                          <span className="num block text-[0.8125rem] font-semibold text-cobalt">
                            {summary.postedContributionPct.toFixed(0)} pts
                          </span>
                        )}
                        <span className="block text-[0.6875rem] text-muted-foreground">
                          {course.credits} cr
                        </span>
                      </span>
                    </button>

                    {showInlineDetails && (
                      <ul className="assessment-rows">
                        {assessments.map((item) => (
                          <li key={item.id} className="assessment-row">
                            <span className="assessment-name">{item.title}</span>
                            <span className="assessment-meta num">
                              <span>Weight {(item.weightBps / 100).toFixed(0)}%</span>
                              <strong>
                                {item.posted && item.earnedMarks !== null
                                  ? `${item.earnedMarks} / ${item.maxMarks}`
                                  : 'Not taken yet'}
                              </strong>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>

            {auditCourses.length > 0 && (
              <div className="audit-section">
                <h3 className="audit-heading">
                  Zero-credit / Audit courses (excluded from SGPA)
                </h3>
                <ul className="marks-ledger-list">
                  {auditCourses.map((course) => {
                    const assessments = DEMO_ASSESSMENTS.filter((a) => a.offeringId === course.id);
                    const summary = evaluateCourseAcademics(course, assessments, policy);
                    return (
                      <li key={course.id} className="marks-audit-row">
                        <div className="min-w-0">
                          <strong className="block truncate text-[0.9375rem] font-medium">
                            {course.name}
                          </strong>
                          <span className="text-[0.75rem] text-muted-foreground">
                            {course.code} · 0 credits
                          </span>
                        </div>
                        <span className="num text-[0.9375rem] font-semibold">
                          {summary.actualPercentage !== null
                            ? `${summary.actualPercentage.toFixed(2)}% (${summary.actualGrade?.label})`
                            : `${summary.postedContributionPct.toFixed(2)}%`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>
        </div>

        <div className="desktop-sticky-planner">
          <SectionHeader title="Grade planner" />
          <GradePlannerPanel
            course={selectedCourse}
            semesterCourses={semesterCourses}
            onSelectCourse={selectCourse}
            policy={basePolicy}
            targetLabel={targetLabel}
            onTargetChange={setTargetLabel}
            estimateValue={estimates[selectedCourse.id] ?? ''}
            onEstimateChange={(val) =>
              setEstimates((prev) => ({ ...prev, [selectedCourse.id]: val }))
            }
            roundBeforeClassify={roundBeforeClassify}
            onToggleRounding={() => setRoundBeforeClassify((v) => !v)}
          />
        </div>
      </div>

      <Dialog
        open={!isDesktop && mobileSheetOpen}
        onClose={() => setMobileSheetOpen(false)}
        title={selectedCourse.name}
        description={`${selectedCourse.code} · ${
          selectedCourse.credits === 0 ? 'Audit (0 credits)' : `${selectedCourse.credits} credits`
        }`}
        footer={
          <Button variant="secondary" onClick={() => setMobileSheetOpen(false)}>
            Done
          </Button>
        }
      >
        <GradePlannerPanel
          inSheet
          course={selectedCourse}
          semesterCourses={semesterCourses}
          onSelectCourse={selectCourse}
          policy={basePolicy}
          targetLabel={targetLabel}
          onTargetChange={setTargetLabel}
          estimateValue={estimates[selectedCourse.id] ?? ''}
          onEstimateChange={(val) =>
            setEstimates((prev) => ({ ...prev, [selectedCourse.id]: val }))
          }
          roundBeforeClassify={roundBeforeClassify}
          onToggleRounding={() => setRoundBeforeClassify((v) => !v)}
        />
      </Dialog>
    </div>
  );
}
