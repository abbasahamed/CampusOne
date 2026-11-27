import type {
  AssessmentItem,
  CourseOffering,
  GradeBand,
  GradingPolicy,
} from '../data/types';

interface Fraction {
  num: number;
  den: number;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function makeFraction(num: number, den: number): Fraction {
  const d = gcd(num, den);
  return { num: num / d, den: den / d };
}

function addFractions(a: Fraction, b: Fraction): Fraction {
  return makeFraction(a.num * b.den + b.num * a.den, a.den * b.den);
}

/** Half-up rounding to 2 decimal places using exact rational comparison. */
export function roundHalfUp(fraction: Fraction, decimals = 2): number {
  const scale = 10 ** decimals;
  const scaledNum = fraction.num * scale;
  const quotient = Math.floor(scaledNum / fraction.den);
  const remainder = scaledNum % fraction.den;
  const roundedInt = remainder * 2 >= fraction.den ? quotient + 1 : quotient;
  return roundedInt / scale;
}

export function classifyPercentage(
  percentage: Fraction,
  policy: GradingPolicy,
): GradeBand {
  if (policy.roundTotalBeforeClassification) {
    const rounded = roundHalfUp(percentage, 2);
    return (
      policy.bands.find((band) => rounded >= band.minPercentage) ??
      policy.bands[policy.bands.length - 1] ?? {
        label: 'F',
        minPercentage: 0,
        points: 0,
      }
    );
  }

  return (
    policy.bands.find((band) => percentage.num >= band.minPercentage * percentage.den) ??
    policy.bands[policy.bands.length - 1] ?? {
      label: 'F',
      minPercentage: 0,
      points: 0,
    }
  );
}

export function validateCourseAssessments(
  course: CourseOffering,
  assessments: readonly AssessmentItem[],
  policy: GradingPolicy,
): string | null {
  if (!Number.isFinite(course.credits) || course.credits < 0) {
    return 'Course credits must be nonnegative.';
  }
  if (policy.bands.length === 0) {
    return 'Grading policy has no grade bands.';
  }
  for (let i = 1; i < policy.bands.length; i++) {
    const prev = policy.bands[i - 1];
    const curr = policy.bands[i];
    if (prev && curr && prev.minPercentage <= curr.minPercentage) {
      return 'Grading scale thresholds must be strictly descending.';
    }
  }

  let weightSum = 0;
  for (const item of assessments) {
    if (!Number.isFinite(item.maxMarks) || item.maxMarks <= 0) {
      return `Assessment "${item.title}" has invalid maximum marks.`;
    }
    if (!Number.isInteger(item.weightBps) || item.weightBps < 0) {
      return `Assessment "${item.title}" has invalid weight.`;
    }
    if (item.posted) {
      if (
        item.earnedMarks === null ||
        !Number.isFinite(item.earnedMarks) ||
        item.earnedMarks < 0 ||
        item.earnedMarks > item.maxMarks
      ) {
        return `Assessment "${item.title}" has marks outside 0–${item.maxMarks}.`;
      }
    }
    weightSum += item.weightBps;
  }

  if (weightSum !== 10000) {
    return `Assessment weights total ${(weightSum / 100).toFixed(2)}% instead of 100%.`;
  }

  return null;
}

export interface CourseAcademicSummary {
  valid: boolean;
  error?: string;
  offeringId: string;
  postedContributionPct: number;
  postedWeightPct: number;
  pendingWeightPct: number;
  isActual: boolean;
  actualPercentage: number | null;
  actualGrade: GradeBand | null;
  bestPossiblePercentage: number | null;
  bestPossibleGrade: GradeBand | null;
  unpostedItems: readonly AssessmentItem[];
  meetsPassFloor: boolean | null;
}

export function evaluateCourseAcademics(
  course: CourseOffering,
  assessments: readonly AssessmentItem[],
  policy: GradingPolicy,
): CourseAcademicSummary {
  const error = validateCourseAssessments(course, assessments, policy);
  if (error) {
    return {
      valid: false,
      error,
      offeringId: course.id,
      postedContributionPct: 0,
      postedWeightPct: 0,
      pendingWeightPct: 0,
      isActual: false,
      actualPercentage: null,
      actualGrade: null,
      bestPossiblePercentage: null,
      bestPossibleGrade: null,
      unpostedItems: [],
      meetsPassFloor: null,
    };
  }

  let postedFraction: Fraction = { num: 0, den: 1 };
  let postedWeightBps = 0;
  let pendingWeightBps = 0;
  const unpostedItems: AssessmentItem[] = [];

  for (const item of assessments) {
    if (item.weightBps === 0) continue;
    if (item.posted && item.earnedMarks !== null) {
      // earnedMarks * (weightBps / 100) / maxMarks -> scale integers cleanly
      const scaledEarned = Math.round(item.earnedMarks * 100);
      const scaledMax = Math.round(item.maxMarks * 100);
      const contrib = makeFraction(scaledEarned * item.weightBps, scaledMax * 100);
      postedFraction = addFractions(postedFraction, contrib);
      postedWeightBps += item.weightBps;
    } else {
      pendingWeightBps += item.weightBps;
      unpostedItems.push(item);
    }
  }

  const isActual = unpostedItems.length === 0;
  const postedContributionPct = postedFraction.num / postedFraction.den;
  const bestFraction = addFractions(
    postedFraction,
    makeFraction(pendingWeightBps, 100),
  );
  const actualGrade = isActual ? classifyPercentage(postedFraction, policy) : null;
  const bestGrade = classifyPercentage(bestFraction, policy);

  return {
    valid: true,
    offeringId: course.id,
    postedContributionPct,
    postedWeightPct: postedWeightBps / 100,
    pendingWeightPct: pendingWeightBps / 100,
    isActual,
    actualPercentage: isActual ? roundHalfUp(postedFraction, 2) : null,
    actualGrade,
    bestPossiblePercentage: roundHalfUp(bestFraction, 2),
    bestPossibleGrade: bestGrade,
    unpostedItems,
    meetsPassFloor: isActual
      ? postedFraction.num >= policy.passingFloor * postedFraction.den
      : null,
  };
}

export interface GradeTargetPlanResult {
  status:
    | 'invalid'
    | 'complete'
    | 'multiple-pending'
    | 'secured'
    | 'required'
    | 'unreachable';
  targetBand: GradeBand;
  examItem?: AssessmentItem;
  requiredScore: number | null;
  requiredPercentageOnExam: number | null;
  recordedContributionPct: number;
  bestPossiblePercentage: number | null;
  bestPossibleGrade: GradeBand | null;
  missingTitles: readonly string[];
  passesInstitutionalFloor: boolean;
  explanation: string;
}

function buildPermissibleScores(maxMarks: number, increment: number): number[] {
  const step = increment > 0 ? increment : 1;
  const scores: number[] = [];
  const maxSteps = Math.floor(maxMarks / step);
  for (let i = 0; i <= maxSteps; i++) {
    scores.push(Number((i * step).toFixed(4)));
  }
  const last = scores[scores.length - 1];
  if (last === undefined || last < maxMarks) {
    scores.push(maxMarks);
  }
  return scores;
}

export function calculateGradeTargetPlan(
  course: CourseOffering,
  assessments: readonly AssessmentItem[],
  policy: GradingPolicy,
  targetBandLabel: string,
): GradeTargetPlanResult {
  const targetBand =
    policy.bands.find((b) => b.label === targetBandLabel) ??
    policy.bands[0] ?? { label: 'O', minPercentage: 90, points: 10 };

  const summary = evaluateCourseAcademics(course, assessments, policy);
  if (!summary.valid) {
    return {
      status: 'invalid',
      targetBand,
      requiredScore: null,
      requiredPercentageOnExam: null,
      recordedContributionPct: 0,
      bestPossiblePercentage: null,
      bestPossibleGrade: null,
      missingTitles: [],
      passesInstitutionalFloor: false,
      explanation: summary.error ?? 'Course assessment data is invalid.',
    };
  }

  if (summary.isActual) {
    const achieved =
      summary.actualPercentage !== null &&
      summary.actualPercentage >= targetBand.minPercentage;
    return {
      status: 'complete',
      targetBand,
      requiredScore: null,
      requiredPercentageOnExam: null,
      recordedContributionPct: summary.postedContributionPct,
      bestPossiblePercentage: summary.bestPossiblePercentage,
      bestPossibleGrade: summary.bestPossibleGrade,
      missingTitles: [],
      passesInstitutionalFloor: summary.meetsPassFloor ?? false,
      explanation: achieved
        ? `Final course result is ${summary.actualPercentage?.toFixed(2)}% (${summary.actualGrade?.label}), meeting ${targetBand.label}.`
        : `Final course result is ${summary.actualPercentage?.toFixed(2)}% (${summary.actualGrade?.label}), below ${targetBand.label}.`,
    };
  }

  if (summary.unpostedItems.length > 1) {
    const missingTitles = summary.unpostedItems.map((i) => i.title);
    return {
      status: 'multiple-pending',
      targetBand,
      requiredScore: null,
      requiredPercentageOnExam: null,
      recordedContributionPct: summary.postedContributionPct,
      bestPossiblePercentage: summary.bestPossiblePercentage,
      bestPossibleGrade: summary.bestPossibleGrade,
      missingTitles,
      passesInstitutionalFloor: false,
      explanation: `Multiple assessments are still pending (${missingTitles.join(', ')}). A single required exam score is available once all other weighted items are posted.`,
    };
  }

  const exam = summary.unpostedItems[0]!;
  let postedFraction: Fraction = { num: 0, den: 1 };
  for (const item of assessments) {
    if (item.id === exam.id || item.weightBps === 0 || !item.posted || item.earnedMarks === null) {
      continue;
    }
    const scaledEarned = Math.round(item.earnedMarks * 100);
    const scaledMax = Math.round(item.maxMarks * 100);
    postedFraction = addFractions(
      postedFraction,
      makeFraction(scaledEarned * item.weightBps, scaledMax * 100),
    );
  }

  const permissible = buildPermissibleScores(exam.maxMarks, policy.examMarkIncrement);
  let requiredScore: number | null = null;

  for (const candidate of permissible) {
    const scaledScore = Math.round(candidate * 100);
    const scaledMax = Math.round(exam.maxMarks * 100);
    const examContrib = makeFraction(scaledScore * exam.weightBps, scaledMax * 100);
    const totalFraction = addFractions(postedFraction, examContrib);
    const grade = classifyPercentage(totalFraction, policy);
    if (grade.minPercentage >= targetBand.minPercentage) {
      requiredScore = candidate;
      break;
    }
  }

  if (requiredScore === null) {
    return {
      status: 'unreachable',
      targetBand,
      examItem: exam,
      requiredScore: null,
      requiredPercentageOnExam: null,
      recordedContributionPct: summary.postedContributionPct,
      bestPossiblePercentage: summary.bestPossiblePercentage,
      bestPossibleGrade: summary.bestPossibleGrade,
      missingTitles: [],
      passesInstitutionalFloor:
        (summary.bestPossiblePercentage ?? 0) >= policy.passingFloor,
      explanation: `Target ${targetBand.label} (${targetBand.minPercentage}%) is not reachable. Even with ${exam.maxMarks}/${exam.maxMarks}, the maximum overall total is ${summary.bestPossiblePercentage?.toFixed(2)}% (${summary.bestPossibleGrade?.label}).`,
    };
  }

  if (requiredScore === 0) {
    return {
      status: 'secured',
      targetBand,
      examItem: exam,
      requiredScore: 0,
      requiredPercentageOnExam: 0,
      recordedContributionPct: summary.postedContributionPct,
      bestPossiblePercentage: summary.bestPossiblePercentage,
      bestPossibleGrade: summary.bestPossibleGrade,
      missingTitles: [],
      passesInstitutionalFloor: targetBand.minPercentage >= policy.passingFloor,
      explanation: `Grade ${targetBand.label} (${targetBand.minPercentage}%) is already secured from recorded marks (${summary.postedContributionPct.toFixed(2)}% posted).`,
    };
  }

  const requiredPct = (requiredScore / exam.maxMarks) * 100;
  return {
    status: 'required',
    targetBand,
    examItem: exam,
    requiredScore,
    requiredPercentageOnExam: requiredPct,
    recordedContributionPct: summary.postedContributionPct,
    bestPossiblePercentage: summary.bestPossiblePercentage,
    bestPossibleGrade: summary.bestPossibleGrade,
    missingTitles: [],
    passesInstitutionalFloor: targetBand.minPercentage >= policy.passingFloor,
    explanation: `Score at least ${requiredScore}/${exam.maxMarks} (${requiredPct.toFixed(1)}%) in ${exam.title} to reach ${targetBand.label} (${targetBand.minPercentage}%).`,
  };
}

export interface CourseEstimateProjection {
  valid: boolean;
  error?: string;
  projectedPercentage: number | null;
  projectedGrade: GradeBand | null;
  passesFloor: boolean;
}

export function evaluateCourseWithEstimate(
  course: CourseOffering,
  assessments: readonly AssessmentItem[],
  policy: GradingPolicy,
  examId: string,
  estimateScore: number,
): CourseEstimateProjection {
  const exam = assessments.find((a) => a.id === examId);
  if (!exam) {
    return {
      valid: false,
      error: 'Selected exam not found.',
      projectedPercentage: null,
      projectedGrade: null,
      passesFloor: false,
    };
  }
  if (!Number.isFinite(estimateScore) || estimateScore < 0 || estimateScore > exam.maxMarks) {
    return {
      valid: false,
      error: `Estimate must be between 0 and ${exam.maxMarks}.`,
      projectedPercentage: null,
      projectedGrade: null,
      passesFloor: false,
    };
  }

  const simulated = assessments.map((item) =>
    item.id === examId ? { ...item, posted: true, earnedMarks: estimateScore } : item,
  );
  const result = evaluateCourseAcademics(course, simulated, policy);
  if (!result.valid) {
    return {
      valid: false,
      error: result.error,
      projectedPercentage: null,
      projectedGrade: null,
      passesFloor: false,
    };
  }
  if (!result.isActual || result.actualPercentage === null || !result.actualGrade) {
    return {
      valid: false,
      error: 'Additional weighted assessments are still pending.',
      projectedPercentage: null,
      projectedGrade: null,
      passesFloor: false,
    };
  }

  return {
    valid: true,
    projectedPercentage: result.actualPercentage,
    projectedGrade: result.actualGrade,
    passesFloor: result.meetsPassFloor ?? false,
  };
}

export interface SemesterSgpaResult {
  status: 'actual' | 'projected' | 'unavailable';
  sgpa: number | null;
  eligibleCredits: number;
  actualCoursesCount: number;
  projectedCoursesCount: number;
  pendingCoursesCount: number;
  zeroCreditCourses: readonly CourseOffering[];
  reason?: string;
}

export function calculateSemesterSgpa(
  courses: readonly CourseOffering[],
  assessments: readonly AssessmentItem[],
  policy: GradingPolicy,
  examEstimates: Readonly<Record<string, number>> = {},
): SemesterSgpaResult {
  const zeroCreditCourses = courses.filter((c) => c.credits === 0);
  const creditedCourses = courses.filter((c) => c.credits > 0);

  if (creditedCourses.length === 0) {
    return {
      status: 'unavailable',
      sgpa: null,
      eligibleCredits: 0,
      actualCoursesCount: 0,
      projectedCoursesCount: 0,
      pendingCoursesCount: 0,
      zeroCreditCourses,
      reason: 'No positive-credit courses are enrolled in this semester.',
    };
  }

  let totalCredits = 0;
  let weightedPoints = 0;
  let actualCount = 0;
  let projectedCount = 0;
  const missingCourses: string[] = [];

  for (const course of creditedCourses) {
    const courseAssessments = assessments.filter((a) => a.offeringId === course.id);
    const summary = evaluateCourseAcademics(course, courseAssessments, policy);

    if (summary.valid && summary.isActual && summary.actualGrade) {
      totalCredits += course.credits;
      weightedPoints += summary.actualGrade.points * course.credits;
      actualCount += 1;
      continue;
    }

    if (summary.valid && summary.unpostedItems.length === 1) {
      const pendingExam = summary.unpostedItems[0]!;
      const estimate = examEstimates[course.id];
      if (estimate !== undefined) {
        const proj = evaluateCourseWithEstimate(
          course,
          courseAssessments,
          policy,
          pendingExam.id,
          estimate,
        );
        if (proj.valid && proj.projectedGrade) {
          totalCredits += course.credits;
          weightedPoints += proj.projectedGrade.points * course.credits;
          projectedCount += 1;
          continue;
        }
      }
    }

    missingCourses.push(course.code);
  }

  if (missingCourses.length > 0 || totalCredits === 0) {
    return {
      status: 'unavailable',
      sgpa: null,
      eligibleCredits: creditedCourses.reduce((sum, c) => sum + c.credits, 0),
      actualCoursesCount: actualCount,
      projectedCoursesCount: projectedCount,
      pendingCoursesCount: missingCourses.length,
      zeroCreditCourses,
      reason: `Enter exam estimates for ${missingCourses.join(', ')} to preview projected SGPA.`,
    };
  }

  const sgpa = roundHalfUp(makeFraction(weightedPoints, totalCredits), 2);
  return {
    status: projectedCount > 0 ? 'projected' : 'actual',
    sgpa,
    eligibleCredits: totalCredits,
    actualCoursesCount: actualCount,
    projectedCoursesCount: projectedCount,
    pendingCoursesCount: 0,
    zeroCreditCourses,
  };
}
