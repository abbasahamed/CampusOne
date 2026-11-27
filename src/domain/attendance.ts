import type { AttendanceSnapshot } from '../data/types';

export type AttendanceDataState = 'invalid' | 'unrecorded' | 'valid';

export interface AttendanceStatusResult {
  state: AttendanceDataState;
  attended: number;
  conducted: number;
  remaining: number;
  targetNumerator: number;
  targetDenominator: number;
  targetPercentage: number;
  percentage: number | null;
  meetsTarget: boolean;
  reason?: string;
}

export interface RecoveryPlanResult {
  status:
    | 'invalid'
    | 'at-target'
    | 'recoverable'
    | 'unreachable'
    | 'unrecorded-recoverable'
    | 'unrecorded-no-remaining';
  neededClasses: number | null;
  projectedAttended: number;
  projectedConducted: number;
  projectedPercentage: number | null;
  bestPossibleAttended: number;
  bestPossibleConducted: number;
  bestPossiblePercentage: number | null;
  explanation: string;
}

export interface SafeAbsenceResult {
  status: 'invalid' | 'unrecorded' | 'below-target' | 'no-remaining' | 'available';
  safeAbsences: number;
  projectedAttendedAfterMisses: number;
  projectedConductedAfterMisses: number;
  projectedPercentageAfterMisses: number | null;
  explanation: string;
  assumptionNote: string;
}

export interface AttendanceProjectionResult {
  valid: boolean;
  attended: number;
  conducted: number;
  percentage: number | null;
  meetsTarget: boolean;
  error?: string;
}

function isSafeNonnegativeInt(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function isValidTarget(p: number, q: number): boolean {
  return Number.isSafeInteger(p) && Number.isSafeInteger(q) && p > 0 && p <= q;
}

function isProductSafe(a: number, b: number): boolean {
  return Number.isSafeInteger(a * b);
}

export function validateAttendanceInputs(
  attended: number,
  conducted: number,
  remaining: number,
  targetNumerator: number,
  targetDenominator: number,
): string | null {
  if (
    !isSafeNonnegativeInt(attended) ||
    !isSafeNonnegativeInt(conducted) ||
    !isSafeNonnegativeInt(remaining)
  ) {
    return 'Class counts must be whole nonnegative numbers.';
  }
  if (attended > conducted) {
    return 'Attended classes cannot exceed conducted classes.';
  }
  if (!isValidTarget(targetNumerator, targetDenominator)) {
    return 'Attendance target must be a valid ratio between 1% and 100%.';
  }
  if (
    !isProductSafe(attended + remaining, targetDenominator) ||
    !isProductSafe(conducted + remaining, targetNumerator)
  ) {
    return 'Class counts exceed safe calculation limits.';
  }
  return null;
}

/** Exact cross-multiplication eligibility check — never rounds percentages first. */
export function meetsAttendanceTarget(
  attended: number,
  conducted: number,
  targetNumerator: number,
  targetDenominator: number,
): boolean {
  if (conducted <= 0) return false;
  return attended * targetDenominator >= targetNumerator * conducted;
}

export function evaluateAttendanceStatus(
  snapshot: AttendanceSnapshot,
  overrideTarget?: { numerator: number; denominator: number },
): AttendanceStatusResult {
  const p = overrideTarget?.numerator ?? snapshot.targetNumerator;
  const q = overrideTarget?.denominator ?? snapshot.targetDenominator;
  const validationError = validateAttendanceInputs(
    snapshot.attended,
    snapshot.conducted,
    snapshot.remaining,
    p,
    q,
  );

  if (validationError) {
    return {
      state: 'invalid',
      attended: snapshot.attended,
      conducted: snapshot.conducted,
      remaining: snapshot.remaining,
      targetNumerator: p,
      targetDenominator: q,
      targetPercentage: p > 0 && q > 0 ? (p / q) * 100 : 0,
      percentage: null,
      meetsTarget: false,
      reason: validationError,
    };
  }

  const targetPercentage = (p / q) * 100;
  if (snapshot.conducted === 0) {
    return {
      state: 'unrecorded',
      attended: 0,
      conducted: 0,
      remaining: snapshot.remaining,
      targetNumerator: p,
      targetDenominator: q,
      targetPercentage,
      percentage: null,
      meetsTarget: false,
      reason: 'No classes conducted yet.',
    };
  }

  return {
    state: 'valid',
    attended: snapshot.attended,
    conducted: snapshot.conducted,
    remaining: snapshot.remaining,
    targetNumerator: p,
    targetDenominator: q,
    targetPercentage,
    percentage: (snapshot.attended / snapshot.conducted) * 100,
    meetsTarget: meetsAttendanceTarget(snapshot.attended, snapshot.conducted, p, q),
  };
}

export function calculateRecoveryPlan(
  snapshot: AttendanceSnapshot,
  overrideTarget?: { numerator: number; denominator: number },
): RecoveryPlanResult {
  const p = overrideTarget?.numerator ?? snapshot.targetNumerator;
  const q = overrideTarget?.denominator ?? snapshot.targetDenominator;
  const validationError = validateAttendanceInputs(
    snapshot.attended,
    snapshot.conducted,
    snapshot.remaining,
    p,
    q,
  );

  if (validationError) {
    return {
      status: 'invalid',
      neededClasses: null,
      projectedAttended: snapshot.attended,
      projectedConducted: snapshot.conducted,
      projectedPercentage: null,
      bestPossibleAttended: snapshot.attended,
      bestPossibleConducted: snapshot.conducted,
      bestPossiblePercentage: null,
      explanation: validationError,
    };
  }

  const { attended: A, conducted: C, remaining: R } = snapshot;
  const bestA = A + R;
  const bestC = C + R;
  const bestPct = bestC > 0 ? (bestA / bestC) * 100 : null;
  const targetLabel = `${((p / q) * 100).toFixed(p % q === 0 || (p * 100) % q === 0 ? 0 : 1)}%`;

  if (C === 0) {
    if (R >= 1) {
      return {
        status: 'unrecorded-recoverable',
        neededClasses: 1,
        projectedAttended: 1,
        projectedConducted: 1,
        projectedPercentage: 100,
        bestPossibleAttended: bestA,
        bestPossibleConducted: bestC,
        bestPossiblePercentage: bestPct,
        explanation: `No classes conducted yet. Attending the next class establishes a 100% rate (1/1), meeting ${targetLabel}.`,
      };
    }
    return {
      status: 'unrecorded-no-remaining',
      neededClasses: null,
      projectedAttended: 0,
      projectedConducted: 0,
      projectedPercentage: null,
      bestPossibleAttended: 0,
      bestPossibleConducted: 0,
      bestPossiblePercentage: null,
      explanation: 'No classes conducted and no remaining classes scheduled.',
    };
  }

  if (meetsAttendanceTarget(A, C, p, q)) {
    return {
      status: 'at-target',
      neededClasses: 0,
      projectedAttended: A,
      projectedConducted: C,
      projectedPercentage: (A / C) * 100,
      bestPossibleAttended: bestA,
      bestPossibleConducted: bestC,
      bestPossiblePercentage: bestPct,
      explanation: `Already at or above the ${targetLabel} requirement (${A}/${C}).`,
    };
  }

  if (p === q) {
    return {
      status: 'unreachable',
      neededClasses: null,
      projectedAttended: bestA,
      projectedConducted: bestC,
      projectedPercentage: bestPct,
      bestPossibleAttended: bestA,
      bestPossibleConducted: bestC,
      bestPossiblePercentage: bestPct,
      explanation: `100% attendance is unreachable after an absence. Best possible is ${bestPct?.toFixed(1)}% (${bestA}/${bestC}).`,
    };
  }

  const deficit = p * C - q * A;
  const step = q - p;
  const needed = Math.floor((deficit + step - 1) / step);

  if (needed > R) {
    return {
      status: 'unreachable',
      neededClasses: needed,
      projectedAttended: bestA,
      projectedConducted: bestC,
      projectedPercentage: bestPct,
      bestPossibleAttended: bestA,
      bestPossibleConducted: bestC,
      bestPossiblePercentage: bestPct,
      explanation: `Needs ${needed} consecutive classes, exceeding the ${R} remaining classes. Best possible is ${bestPct?.toFixed(1)}% (${bestA}/${bestC}).`,
    };
  }

  const projA = A + needed;
  const projC = C + needed;
  return {
    status: 'recoverable',
    neededClasses: needed,
    projectedAttended: projA,
    projectedConducted: projC,
    projectedPercentage: (projA / projC) * 100,
    bestPossibleAttended: bestA,
    bestPossibleConducted: bestC,
    bestPossiblePercentage: bestPct,
    explanation: `Attend the next ${needed} consecutive ${needed === 1 ? 'class' : 'classes'} to reach ${((projA / projC) * 100).toFixed(1)}% (${projA}/${projC}).`,
  };
}

export function calculateSafeAbsences(
  snapshot: AttendanceSnapshot,
  overrideTarget?: { numerator: number; denominator: number },
): SafeAbsenceResult {
  const p = overrideTarget?.numerator ?? snapshot.targetNumerator;
  const q = overrideTarget?.denominator ?? snapshot.targetDenominator;
  const validationError = validateAttendanceInputs(
    snapshot.attended,
    snapshot.conducted,
    snapshot.remaining,
    p,
    q,
  );
  const assumptionNote =
    'Assumes misses occur immediately before any future attendance within the planned remaining classes; baseline records remain unchanged.';

  if (validationError) {
    return {
      status: 'invalid',
      safeAbsences: 0,
      projectedAttendedAfterMisses: snapshot.attended,
      projectedConductedAfterMisses: snapshot.conducted,
      projectedPercentageAfterMisses: null,
      explanation: validationError,
      assumptionNote,
    };
  }

  const { attended: A, conducted: C, remaining: R } = snapshot;
  const targetLabel = `${((p / q) * 100).toFixed((p * 100) % q === 0 ? 0 : 1)}%`;

  if (C === 0) {
    return {
      status: 'unrecorded',
      safeAbsences: 0,
      projectedAttendedAfterMisses: 0,
      projectedConductedAfterMisses: 0,
      projectedPercentageAfterMisses: null,
      explanation: 'Safe absence limit is unavailable until at least one class is recorded.',
      assumptionNote,
    };
  }

  if (!meetsAttendanceTarget(A, C, p, q)) {
    return {
      status: 'below-target',
      safeAbsences: 0,
      projectedAttendedAfterMisses: A,
      projectedConductedAfterMisses: C,
      projectedPercentageAfterMisses: (A / C) * 100,
      explanation: `0 safe absences available — attendance is below ${targetLabel}. Recovery comes first.`,
      assumptionNote,
    };
  }

  if (R === 0) {
    return {
      status: 'no-remaining',
      safeAbsences: 0,
      projectedAttendedAfterMisses: A,
      projectedConductedAfterMisses: C,
      projectedPercentageAfterMisses: (A / C) * 100,
      explanation: 'No remaining classes are scheduled to miss this term.',
      assumptionNote,
    };
  }

  const rawLimit = Math.floor((q * A - p * C) / p);
  const safeAbsences = Math.min(R, Math.max(0, rawLimit));
  const projC = C + safeAbsences;
  const projPct = (A / projC) * 100;

  return {
    status: 'available',
    safeAbsences,
    projectedAttendedAfterMisses: A,
    projectedConductedAfterMisses: projC,
    projectedPercentageAfterMisses: projPct,
    explanation:
      safeAbsences === 0
        ? `0 immediate misses are safe — missing the next class drops you below ${targetLabel}.`
        : `You can miss up to ${safeAbsences} immediate ${safeAbsences === 1 ? 'class' : 'classes'} and remain at ${projPct.toFixed(1)}% (${A}/${projC}).`,
    assumptionNote,
  };
}

export function calculateAttendanceProjection(
  snapshot: AttendanceSnapshot,
  attendFuture: number,
  missFuture: number,
  overrideTarget?: { numerator: number; denominator: number },
): AttendanceProjectionResult {
  const p = overrideTarget?.numerator ?? snapshot.targetNumerator;
  const q = overrideTarget?.denominator ?? snapshot.targetDenominator;
  const baseError = validateAttendanceInputs(
    snapshot.attended,
    snapshot.conducted,
    snapshot.remaining,
    p,
    q,
  );
  if (baseError) {
    return {
      valid: false,
      attended: snapshot.attended,
      conducted: snapshot.conducted,
      percentage: null,
      meetsTarget: false,
      error: baseError,
    };
  }
  if (!isSafeNonnegativeInt(attendFuture) || !isSafeNonnegativeInt(missFuture)) {
    return {
      valid: false,
      attended: snapshot.attended,
      conducted: snapshot.conducted,
      percentage: null,
      meetsTarget: false,
      error: 'Future attended and missed counts must be whole nonnegative numbers.',
    };
  }
  if (attendFuture + missFuture > snapshot.remaining) {
    return {
      valid: false,
      attended: snapshot.attended,
      conducted: snapshot.conducted,
      percentage: null,
      meetsTarget: false,
      error: `Planned sessions (${attendFuture + missFuture}) exceed remaining scheduled classes (${snapshot.remaining}).`,
    };
  }

  const nextA = snapshot.attended + attendFuture;
  const nextC = snapshot.conducted + attendFuture + missFuture;
  if (nextC === 0) {
    return {
      valid: false,
      attended: 0,
      conducted: 0,
      percentage: null,
      meetsTarget: false,
      error: 'Projected rate is unavailable when total conducted classes is zero.',
    };
  }

  return {
    valid: true,
    attended: nextA,
    conducted: nextC,
    percentage: (nextA / nextC) * 100,
    meetsTarget: meetsAttendanceTarget(nextA, nextC, p, q),
  };
}

export function aggregateAttendanceSnapshots(
  snapshots: readonly AttendanceSnapshot[],
  overrideTarget?: { numerator: number; denominator: number },
): AttendanceStatusResult {
  const first = snapshots[0];
  const p = overrideTarget?.numerator ?? first?.targetNumerator ?? 3;
  const q = overrideTarget?.denominator ?? first?.targetDenominator ?? 4;

  let attended = 0;
  let conducted = 0;
  let remaining = 0;

  for (const item of snapshots) {
    const err = validateAttendanceInputs(
      item.attended,
      item.conducted,
      item.remaining,
      item.targetNumerator,
      item.targetDenominator,
    );
    if (err) {
      return {
        state: 'invalid',
        attended: 0,
        conducted: 0,
        remaining: 0,
        targetNumerator: p,
        targetDenominator: q,
        targetPercentage: (p / q) * 100,
        percentage: null,
        meetsTarget: false,
        reason: err,
      };
    }
    attended += item.attended;
    conducted += item.conducted;
    remaining += item.remaining;
  }

  return evaluateAttendanceStatus(
    {
      offeringId: 'aggregate',
      attended,
      conducted,
      remaining,
      targetNumerator: p,
      targetDenominator: q,
    },
    overrideTarget,
  );
}

export type CourseAbsenceStatus = 'stays-above' | 'deficit-recoverable' | 'unreachable';
export type DayAbsenceStatus = 'safe' | 'recoverable-deficit' | 'unsafe';

export interface CourseAbsenceImpact {
  offeringId: string;
  missedSessions: number;
  currentPercentage: number | null;
  afterPercentage: number | null;
  bestPossibleAfterMissPercentage: number | null;
  status: CourseAbsenceStatus;
  safeToMiss: boolean;
  exceedsRemaining: boolean;
}

export interface DayAbsenceImpactResult {
  status: DayAbsenceStatus;
  safe: boolean;
  courses: readonly CourseAbsenceImpact[];
  blockingOfferingId: string | null;
}

/**
 * Evaluates whether skipping all scheduled sessions in `missedCountsByOffering`
 * keeps every affected course at/above target, creates a recoverable deficit,
 * or makes the selected target mathematically unreachable.
 */
export function evaluateDayAbsenceImpact(
  snapshots: readonly AttendanceSnapshot[],
  missedCountsByOffering: Readonly<Record<string, number>>,
  overrideTarget?: { numerator: number; denominator: number },
): DayAbsenceImpactResult {
  const courses: CourseAbsenceImpact[] = [];
  let blockingOfferingId: string | null = null;
  let hasRecoverableDeficit = false;
  let hasUnreachable = false;

  for (const snapshot of snapshots) {
    const missed = missedCountsByOffering[snapshot.offeringId] ?? 0;
    if (missed <= 0) continue;

    const current = evaluateAttendanceStatus(snapshot, overrideTarget);
    const exceedsRemaining = missed > snapshot.remaining;
    const boundedMiss = Math.min(missed, snapshot.remaining);

    const immediate = calculateAttendanceProjection(snapshot, 0, boundedMiss, overrideTarget);
    const futureAttend = Math.max(0, snapshot.remaining - missed);
    const bestAfter = calculateAttendanceProjection(
      snapshot,
      futureAttend,
      boundedMiss,
      overrideTarget,
    );

    let status: CourseAbsenceStatus;
    if (exceedsRemaining || !bestAfter.valid || !bestAfter.meetsTarget) {
      status = 'unreachable';
      hasUnreachable = true;
      if (blockingOfferingId === null) blockingOfferingId = snapshot.offeringId;
    } else if (!immediate.valid || !immediate.meetsTarget) {
      status = 'deficit-recoverable';
      hasRecoverableDeficit = true;
      if (blockingOfferingId === null) blockingOfferingId = snapshot.offeringId;
    } else {
      status = 'stays-above';
    }

    const safeToMiss = status === 'stays-above';

    courses.push({
      offeringId: snapshot.offeringId,
      missedSessions: missed,
      currentPercentage: current.percentage,
      afterPercentage: exceedsRemaining
        ? null
        : immediate.valid
          ? immediate.percentage
          : null,
      bestPossibleAfterMissPercentage: exceedsRemaining
        ? null
        : bestAfter.valid
          ? bestAfter.percentage
          : null,
      status,
      safeToMiss,
      exceedsRemaining,
    });
  }

  const dayStatus: DayAbsenceStatus = hasUnreachable
    ? 'unsafe'
    : hasRecoverableDeficit
      ? 'recoverable-deficit'
      : 'safe';

  return {
    status: dayStatus,
    safe: dayStatus === 'safe',
    courses,
    blockingOfferingId,
  };
}
