import type { AttendanceSnapshot } from '../data/types';

export interface CourseVisualMeta {
  hue: number;
  shortName: string;
}

const VISUALS_BY_OFFERING: Record<string, CourseVisualMeta> = {
  'off-sem5-cs301': { hue: 263, shortName: 'DSA' },
  'off-sem5-cs302': { hue: 285, shortName: 'OS' },
  'off-sem5-cs303': { hue: 205, shortName: 'DBMS' },
  'off-sem5-cs304': { hue: 160, shortName: 'Networks' },
  'off-sem5-cs399': { hue: 75, shortName: 'Seminar' },
  'off-sem4-cs201': { hue: 32, shortName: 'Discrete' },
  'off-sem4-cs202': { hue: 220, shortName: 'Comp Org' },
  'off-sem4-cs203': { hue: 145, shortName: 'OO Design' },
};

export function getCourseVisual(offeringId: string | null | undefined, fallbackName?: string): CourseVisualMeta {
  if (offeringId && VISUALS_BY_OFFERING[offeringId]) {
    return VISUALS_BY_OFFERING[offeringId]!;
  }
  return {
    hue: 263,
    shortName: fallbackName ?? 'Course',
  };
}

/** Deterministic illustrative session history matching recorded totals. */
export function buildIllustrativeHistory(snapshot: AttendanceSnapshot): boolean[] {
  if (snapshot.conducted <= 0) return [];
  const total = snapshot.conducted;
  const attended = Math.max(0, Math.min(total, snapshot.attended));
  const missed = total - attended;
  const out = Array<boolean>(total).fill(true);

  let seed =
    snapshot.offeringId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0) * 17, 0) +
    total * 31;
  const nextRand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  let placed = 0;
  let guard = 0;
  while (placed < missed && guard < total * 10) {
    guard += 1;
    const raw = snapshot.offeringId.endsWith('cs301') ? 0.3 + nextRand() * 0.7 : nextRand();
    const index = Math.min(total - 1, Math.floor(raw * total));
    if (out[index]) {
      out[index] = false;
      placed += 1;
    }
  }

  for (let i = total - 1; placed < missed && i >= 0; i -= 1) {
    if (out[i]) {
      out[i] = false;
      placed += 1;
    }
  }

  return out;
}

export function timeToMinutes(time: string): number {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return h * 60 + m;
}

export function format12hClock(timeOrMinutes: string | number): string {
  const mins = typeof timeOrMinutes === 'number' ? timeOrMinutes : timeToMinutes(timeOrMinutes);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, '0')}`;
}

export function meridiemLabel(timeOrMinutes: string | number): 'AM' | 'PM' {
  const mins = typeof timeOrMinutes === 'number' ? timeOrMinutes : timeToMinutes(timeOrMinutes);
  return mins >= 720 ? 'PM' : 'AM';
}
