import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEMO_ASSESSMENTS,
  DEMO_ATTENDANCE,
  DEMO_COURSE_OFFERINGS,
  DEMO_GRADING_POLICIES,
  DEMO_TODAY_DATE,
} from '../data/demoData.ts';
import {
  calculateAttendanceProjection,
  calculateRecoveryPlan,
  calculateSafeAbsences,
  evaluateDayAbsenceImpact,
  meetsAttendanceTarget,
} from './attendance.ts';
import {
  calculateGradeTargetPlan,
  calculateSemesterSgpa,
  evaluateCourseWithEstimate,
} from './academics.ts';
import { getUpcomingScheduleDays } from './schedule.ts';

test('attendance recovery contract: 18/26 at 75% needs 6 consecutive classes', () => {
  const ds = DEMO_ATTENDANCE.find((a) => a.offeringId === 'off-sem5-cs301')!;
  assert.equal(ds.remaining, 8);
  const plan = calculateRecoveryPlan(ds);
  assert.equal(plan.status, 'recoverable');
  assert.equal(plan.neededClasses, 6);
  assert.equal(plan.projectedAttended, 24);
  assert.equal(plan.projectedConducted, 32);
  assert.equal(plan.projectedPercentage, 75);
  assert.equal(plan.bestPossibleAttended, 26);
  assert.equal(plan.bestPossibleConducted, 34);
  assert.equal(Number(plan.bestPossiblePercentage?.toFixed(1)), 76.5);

  // Unreachable with 5 remaining
  const unreachable = calculateRecoveryPlan({ ...ds, remaining: 5 });
  assert.equal(unreachable.status, 'unreachable');
  assert.equal(unreachable.neededClasses, 6);
  assert.equal(unreachable.bestPossibleAttended, 23);
  assert.equal(unreachable.bestPossibleConducted, 31);
});

test('attendance safe absences contract: 21/26 allows 2 misses, 3rd drops below 75%', () => {
  const os = DEMO_ATTENDANCE.find((a) => a.offeringId === 'off-sem5-cs302')!;
  const safe = calculateSafeAbsences(os);
  assert.equal(safe.status, 'available');
  assert.equal(safe.safeAbsences, 2);
  assert.equal(meetsAttendanceTarget(21, 28, 3, 4), true);
  assert.equal(meetsAttendanceTarget(21, 29, 3, 4), false);

  const proj3 = calculateAttendanceProjection(os, 0, 3);
  assert.equal(proj3.valid, true);
  assert.equal(proj3.meetsTarget, false);
});

test('attendance edge cases: exact threshold, 0 conducted, invalid inputs, 100% target', () => {
  assert.equal(meetsAttendanceTarget(3, 4, 3, 4), true);
  assert.equal(
    calculateRecoveryPlan({
      offeringId: 'x',
      attended: 0,
      conducted: 0,
      remaining: 4,
      targetNumerator: 3,
      targetDenominator: 4,
    }).status,
    'unrecorded-recoverable',
  );
  assert.equal(
    calculateRecoveryPlan({
      offeringId: 'x',
      attended: 5,
      conducted: 4,
      remaining: 4,
      targetNumerator: 3,
      targetDenominator: 4,
    }).status,
    'invalid',
  );
  assert.equal(
    calculateRecoveryPlan(
      {
        offeringId: 'x',
        attended: 4,
        conducted: 5,
        remaining: 4,
        targetNumerator: 1,
        targetDenominator: 1,
      },
    ).status,
    'unreachable',
  );
});

test('academic grade planner contract: CS301 requires 80 for A+ and 97 for O; CS302 O unreachable', () => {
  const policy = DEMO_GRADING_POLICIES[0]!;
  const cs301 = DEMO_COURSE_OFFERINGS.find((c) => c.id === 'off-sem5-cs301')!;
  const cs301Assessments = DEMO_ASSESSMENTS.filter((a) => a.offeringId === cs301.id);

  const planAPlus = calculateGradeTargetPlan(cs301, cs301Assessments, policy, 'A+');
  assert.equal(planAPlus.status, 'required');
  assert.equal(planAPlus.requiredScore, 80);

  const planO = calculateGradeTargetPlan(cs301, cs301Assessments, policy, 'O');
  assert.equal(planO.status, 'required');
  assert.equal(planO.requiredScore, 97);

  const cs302 = DEMO_COURSE_OFFERINGS.find((c) => c.id === 'off-sem5-cs302')!;
  const cs302Assessments = DEMO_ASSESSMENTS.filter((a) => a.offeringId === cs302.id);
  const cs302O = calculateGradeTargetPlan(cs302, cs302Assessments, policy, 'O');
  assert.equal(cs302O.status, 'unreachable');
  assert.equal(cs302O.bestPossibleGrade?.label, 'A+');
});

test('SGPA contract: Sem 4 actual is 8.91; Sem 5 excludes 0-credit CS399 and supports projected SGPA', () => {
  const policy = DEMO_GRADING_POLICIES[0]!;
  const sem4Courses = DEMO_COURSE_OFFERINGS.filter((c) => c.semesterId === 'sem-4');
  const sem4Sgpa = calculateSemesterSgpa(sem4Courses, DEMO_ASSESSMENTS, policy);
  assert.equal(sem4Sgpa.status, 'actual');
  assert.equal(sem4Sgpa.sgpa, 8.91);

  const sem5Courses = DEMO_COURSE_OFFERINGS.filter((c) => c.semesterId === 'sem-5');
  const sem5Pending = calculateSemesterSgpa(sem5Courses, DEMO_ASSESSMENTS, policy);
  assert.equal(sem5Pending.status, 'unavailable');
  assert.equal(sem5Pending.zeroCreditCourses.length, 1);

  // Supplying exam estimates for CS301 (80) and CS302 (90 -> 26+54=80 -> A+) gives projected SGPA
  const sem5Projected = calculateSemesterSgpa(sem5Courses, DEMO_ASSESSMENTS, policy, {
    'off-sem5-cs301': 80,
    'off-sem5-cs302': 90,
  });
  assert.equal(sem5Projected.status, 'projected');
  assert.equal(sem5Projected.eligibleCredits, 14);
  assert.equal(sem5Projected.sgpa, 8.79);

  // Check estimate helper
  const cs301 = sem5Courses[0]!;
  const proj = evaluateCourseWithEstimate(
    cs301,
    DEMO_ASSESSMENTS.filter((a) => a.offeringId === cs301.id),
    policy,
    'asm-cs301-3',
    80,
  );
  assert.equal(proj.valid, true);
  assert.equal(proj.projectedPercentage, 80);
  assert.equal(proj.projectedGrade?.label, 'A+');
});

test('day-off absence impact & upcoming future dates: excludes past dates and separates safe vs deficit-recoverable vs unreachable', () => {
  const cs301Impact = evaluateDayAbsenceImpact(DEMO_ATTENDANCE, {
    'off-sem5-cs301': 1,
    'off-sem5-cs303': 1,
  });
  assert.equal(cs301Impact.safe, false);
  assert.equal(cs301Impact.status, 'unsafe');
  assert.equal(cs301Impact.blockingOfferingId, 'off-sem5-cs301');

  const wedImpact = evaluateDayAbsenceImpact(DEMO_ATTENDANCE, {
    'off-sem5-cs302': 1,
    'off-sem5-cs304': 1,
  });
  assert.equal(wedImpact.safe, true);
  assert.equal(wedImpact.status, 'safe');
  assert.equal(wedImpact.blockingOfferingId, null);

  // At 80% target, missing 1 CS302 class drops 21/26 (80.8%) -> 21/27 (77.8% < 80%), recoverable via 5 remaining (26/32 = 81.3%)
  const deficitRecoverable = evaluateDayAbsenceImpact(
    DEMO_ATTENDANCE,
    { 'off-sem5-cs302': 1 },
    { numerator: 4, denominator: 5 },
  );
  assert.equal(deficitRecoverable.status, 'recoverable-deficit');
  assert.equal(deficitRecoverable.safe, false);
  assert.equal(deficitRecoverable.courses[0]?.status, 'deficit-recoverable');

  const upcoming = getUpcomingScheduleDays(DEMO_TODAY_DATE, 9);
  assert.equal(upcoming.length, 9);
  assert.ok(upcoming.every((d) => d.date > DEMO_TODAY_DATE));
  assert.equal(upcoming[0]?.date, '2026-11-28');
  assert.equal(upcoming[0]?.isTeachingDay, true);
  assert.equal(upcoming[1]?.date, '2026-11-29');
  assert.equal(upcoming[1]?.isTeachingDay, false);
});
