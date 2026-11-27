import { useEffect, useId, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Dialog } from '../../components/Dialog';
import { ProgressBar } from '../../components/ProgressBar';
import { SegmentedControl } from '../../components/SegmentedControl';
import { StatusBadge } from '../../components/StatusBadge';
import { AcademicsHeader } from './AcademicsHeader';
import {
  DEMO_ASSESSMENTS,
  DEMO_COURSE_OFFERINGS,
  DEMO_GRADING_POLICIES,
  DEMO_SEMESTERS,
  DEMO_STUDENT,
} from '../../data/demoData';
import type { CourseOffering, GradingPolicy } from '../../data/types';
import {
  calculateGradeTargetPlan,
  calculateSemesterSgpa,
  evaluateCourseAcademics,
  evaluateCourseWithEstimate,
} from '../../domain/academics';
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

function GradePlannerPanel({
  course,
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
    headlineValue = 'Target secured';
  } else if (plan.status === 'unreachable') {
    headlineValue = 'Not reachable';
  } else if (plan.status === 'complete' && summary.actualPercentage !== null) {
    headlineValue = `${summary.actualPercentage.toFixed(2)}% (${summary.actualGrade?.label})`;
  } else if (plan.status === 'multiple-pending') {
    headlineValue = 'Waiting for marks';
  }

  return (
    <section
      className={inSheet ? 'planner-sheet-body' : 'planner-panel'}
      aria-labelledby={inSheet ? undefined : `${plannerId}-heading`}
    >
      {!inSheet && (
        <div className="planner-header">
          <div>
            <p className="planner-kicker">
              {course.code} · {course.credits === 0 ? 'Audit (0 credits)' : `${course.credits} credits`}
            </p>
            <h2 id={`${plannerId}-heading`}>{course.name}</h2>
          </div>
          <StatusBadge
            label={summary.isActual ? 'Finalized' : 'In progress'}
            tone={summary.isActual ? 'success' : 'accent'}
          />
        </div>
      )}

      {inSheet && (
        <ul className="assessment-rows assessment-rows--sheet">
          {assessments.map((item) => (
            <li key={item.id} className="assessment-row">
              <span className="assessment-name">{item.title}</span>
              <span className="assessment-meta tabular-nums">
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

      {!summary.isActual && (
        <div className="grade-target-group">
          <span className="grade-target-label">Target grade</span>
          <div className="grade-chip-row" role="radiogroup" aria-label="Target grade">
            {effectivePolicy.bands
              .filter((b) => b.points > 0)
              .map((band) => {
                const selected = band.label === plan.targetBand.label;
                return (
                  <label key={band.label} className="grade-chip" data-selected={selected}>
                    <input
                      className="sr-only"
                      type="radio"
                      name={`${plannerId}-grade`}
                      checked={selected}
                      onFocus={(e) =>
                        e.currentTarget.parentElement?.scrollIntoView({
                          block: 'nearest',
                          inline: 'nearest',
                        })
                      }
                      onChange={() => onTargetChange(band.label)}
                    />
                    <span>{band.label}</span>
                    <span className="tabular-nums">{band.minPercentage}%</span>
                  </label>
                );
              })}
          </div>
        </div>
      )}

      <div className="grade-headline-box" aria-live="polite">
        <span className="grade-headline-caption">
          {summary.isActual
            ? 'Recorded course result'
            : plan.examItem
              ? `Required score in ${plan.examItem.title}`
              : 'Target feasibility'}
        </span>
        <strong className="grade-headline-score tabular-nums">{headlineValue}</strong>
        <p className="planner-insight">{plan.explanation}</p>
      </div>

      {pendingExam && (
        <div className="field-group">
          <label htmlFor={`${plannerId}-estimate`}>
            What-if {pendingExam.title} estimate (0–{pendingExam.maxMarks} marks)
          </label>
          <div className="estimate-row">
            <input
              id={`${plannerId}-estimate`}
              type="number"
              min={0}
              max={pendingExam.maxMarks}
              step={effectivePolicy.examMarkIncrement}
              placeholder="e.g. 80"
              value={estimateValue}
              onChange={(e) => onEstimateChange(e.target.value)}
            />
            {estimateValue !== '' && (
              <button
                type="button"
                className="text-clear-btn"
                onClick={() => onEstimateChange('')}
              >
                Clear
              </button>
            )}
          </div>
          {estimateResult && (
            <p
              className={`estimate-feedback ${!estimateResult.valid ? 'estimate-feedback--error' : ''}`}
              role="status"
            >
              {estimateResult.valid
                ? `Projected course total: ${estimateResult.projectedPercentage?.toFixed(2)}% (${estimateResult.projectedGrade?.label}, ${estimateResult.projectedGrade?.points} pts) — labeled Projected in SGPA.`
                : estimateResult.error}
            </p>
          )}
        </div>
      )}

      <details className="policy-box">
        <summary>
          <ChevronRight size={16} className="policy-chevron" aria-hidden="true" />
          <span>How this is graded</span>
        </summary>
        <div className="policy-box-row">
          <span>Rounding</span>
          <button type="button" className="policy-toggle-btn" onClick={onToggleRounding}>
            {roundBeforeClassify ? 'Rounded half-up (2 dp)' : 'Exact weighted total'}
          </button>
        </div>
        <p className="planner-assumption">
          10-point scale (O ≥ 90%, A+ ≥ 80%, A ≥ 70%, B+ ≥ 60%, B ≥ 50%, C ≥ 45%, P ≥ 40%). Whole
          exam mark increment ({effectivePolicy.examMarkIncrement}). Reaching an overall marks target
          is distinct from institutional pass criteria (overall passing floor{' '}
          {effectivePolicy.passingFloor}%; no separate exam minimum in demo policy).
        </p>
      </details>
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
      <section className="sgpa-strip" aria-label="Semester academic summary">
        <div className="sgpa-header">
          <div>
            <h2>{activeSemester.label.split(' · ')[0]}</h2>
            <span className="sgpa-sub">
              {sgpaResult.status === 'actual' ? 'Final results' : 'In progress'}
            </span>
          </div>
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
        <div className="sgpa-cell">
          <span className="sgpa-label">
            {sgpaResult.status === 'actual'
              ? 'Recorded SGPA'
              : sgpaResult.status === 'projected'
                ? 'Projected SGPA'
                : 'Subjects graded'}
          </span>
          <strong className="sgpa-value tabular-nums">
            {sgpaResult.sgpa !== null
              ? sgpaResult.sgpa.toFixed(2)
              : `${finalizedCount} of ${creditedCourses.length}`}
          </strong>
          <span className="sgpa-sub">
            {sgpaResult.status === 'actual'
              ? 'All credited subjects graded'
              : sgpaResult.status === 'projected'
                ? `Based on ${sgpaResult.projectedCoursesCount} exam estimates`
                : 'SGPA will appear when all grades are available. Add exam estimates to preview it.'}
          </span>
        </div>
        <p className="sgpa-credits">
          {sgpaResult.eligibleCredits} credits count toward SGPA
          {auditCourses.length > 0 ? ' · Audit courses excluded' : ''}
        </p>
      </section>

      <div className="attendance-grid">
        <section aria-labelledby="marks-ledger-heading" className="subject-ledger">
          <h2 id="marks-ledger-heading" className="section-title">
            Subjects
          </h2>
          <div className="marks-list">
            {creditedCourses.map((course) => {
              const assessments = DEMO_ASSESSMENTS.filter((a) => a.offeringId === course.id);
              const summary = evaluateCourseAcademics(course, assessments, policy);
              const isSelected = course.id === selectedCourse.id;
              const estRaw = estimates[course.id];
              const estNum = estRaw !== undefined && estRaw.trim() !== '' ? Number(estRaw) : null;
              const pendingExam =
                summary.unpostedItems.length === 1 ? summary.unpostedItems[0] : undefined;
              const proj =
                pendingExam && estNum !== null
                  ? evaluateCourseWithEstimate(course, assessments, policy, pendingExam.id, estNum)
                  : null;

              const showInlineDetails = isDesktop && isSelected;

              return (
                <article
                  key={course.id}
                  className="marks-course-card"
                  data-selected={isSelected}
                >
                  <button
                    type="button"
                    aria-expanded={isDesktop ? isSelected : mobileSheetOpen && isSelected}
                    aria-haspopup={isDesktop ? undefined : 'dialog'}
                    onClick={() => selectCourse(course.id)}
                    className="marks-course-trigger"
                  >
                    <div className="marks-course-head">
                      <span className="ledger-title">
                        <strong>{course.name}</strong>
                        <span className="ledger-code">
                          {course.code} · {course.credits} cr
                        </span>
                      </span>
                      <span className="ledger-metric tabular-nums">
                        {summary.isActual && summary.actualPercentage !== null ? (
                          <strong>
                            {summary.actualPercentage.toFixed(2)}% ({summary.actualGrade?.label})
                          </strong>
                        ) : proj?.valid && proj.projectedPercentage !== null ? (
                          <strong className="text-accent">
                            {proj.projectedPercentage.toFixed(2)}% ({proj.projectedGrade?.label} ·
                            Projected)
                          </strong>
                        ) : (
                          <strong>{summary.postedContributionPct.toFixed(2)}% posted</strong>
                        )}
                        <ChevronRight size={16} aria-hidden="true" />
                      </span>
                    </div>

                    {showInlineDetails && (
                      <ProgressBar
                        label={
                          summary.isActual
                            ? '100% graded'
                            : `${summary.postedWeightPct}% graded · ${summary.pendingWeightPct}% pending`
                        }
                        value={
                          summary.isActual && summary.actualPercentage !== null
                            ? summary.actualPercentage
                            : summary.postedContributionPct
                        }
                        valueText={
                          summary.isActual && summary.actualPercentage !== null
                            ? `${summary.actualPercentage.toFixed(2)}%`
                            : `${summary.postedContributionPct.toFixed(2)} / ${summary.postedWeightPct} pts`
                        }
                        tone={summary.isActual ? 'success' : 'accent'}
                      />
                    )}
                  </button>

                  {showInlineDetails && (
                    <ul className="assessment-rows">
                      {assessments.map((item) => (
                        <li key={item.id} className="assessment-row">
                          <span className="assessment-name">{item.title}</span>
                          <span className="assessment-meta tabular-nums">
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
                </article>
              );
            })}
          </div>

          {auditCourses.length > 0 && (
            <div className="audit-section">
              <h3 className="audit-heading">Zero-credit / Audit courses (excluded from SGPA)</h3>
              <ul className="marks-list">
                {auditCourses.map((course) => {
                  const assessments = DEMO_ASSESSMENTS.filter((a) => a.offeringId === course.id);
                  const summary = evaluateCourseAcademics(course, assessments, policy);
                  return (
                    <li key={course.id} className="marks-course-card">
                      <div className="marks-course-head">
                        <span className="ledger-title">
                          <strong>{course.name}</strong>
                          <span className="ledger-code">{course.code} · 0 credits</span>
                        </span>
                        <span className="tabular-nums font-semibold">
                          {summary.actualPercentage !== null
                            ? `${summary.actualPercentage.toFixed(2)}% (${summary.actualGrade?.label})`
                            : `${summary.postedContributionPct.toFixed(2)}%`}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        <div className="desktop-sticky-planner">
          <GradePlannerPanel
            course={selectedCourse}
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
      >
        <GradePlannerPanel
          inSheet
          course={selectedCourse}
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
