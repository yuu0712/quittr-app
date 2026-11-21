/**
 * Tapering plan generation — pure functions, no UI / storage imports.
 * Spec: quit-zyn-tapering-spec-v1.md §3 (as built, v1.1 notes at the bottom).
 *
 * Two phases, one lever at a time:
 *  1. Count ladder: pouches/day stepped down by a pace rate until 2/day.
 *  2. Strength ladder: at 2/day, step the mg down (mixed week, then full
 *     week at the lower strength), then Zero Day.
 */

export type Pace = 'gentle' | 'standard' | 'fast';

export const PACE_RATES: Record<Pace, number> = {
  gentle: 0.15,
  standard: 0.2,
  fast: 0.33,
};

export const PACE_LABELS: Record<Pace, string> = {
  gentle: 'Gentle',
  standard: 'Standard',
  fast: 'Fast',
};

/** ZYN strengths actually sold, descending. */
export const STRENGTHS: readonly number[] = [8, 6, 3, 1.5];

export interface MgPart {
  mg: number;
  count: number;
}

export interface TaperWeek {
  /** 0-based week index from plan start */
  index: number;
  /** daily ceiling in pouches (a ceiling, not a target) */
  limit: number;
  /** how the day's pouches split across strengths */
  mgPlan: MgPart[];
  held: boolean;
  kind: 'count' | 'strength';
}

/** Count ladder only, e.g. standard 12 -> [12, 10, 8, 6, 5, 4, 3, 2]. */
export function countLadder(baselineCount: number, pace: Pace): number[] {
  const start = Math.max(1, Math.round(baselineCount));
  if (start <= 2) return [start];
  const rate = PACE_RATES[pace];
  const ladder: number[] = [start];
  let cur = start;
  while (cur > 2) {
    let next = Math.round(cur * (1 - rate));
    if (next >= cur) next = cur - 1;
    if (next < 2) next = 2;
    ladder.push(next);
    cur = next;
  }
  return ladder;
}

/**
 * Strength weeks at 2 pouches/day, stepping down from `baselineMg`.
 * Each step down is: one mixed week (1 high + 1 low), then one full week
 * at the lower strength. Stepping stops at 3mg (or 1.5mg when starting
 * at 3mg) — from there the drop to zero is small.
 */
export function strengthWeeks(baselineMg: number): MgPart[][] {
  const weeks: MgPart[][] = [];
  const idx = STRENGTHS.indexOf(baselineMg);
  if (idx < 0) return weeks;
  // Target floor: 3mg when starting above it, otherwise the lowest sold.
  const floor = baselineMg > 3 ? 3 : 1.5;
  let cur = baselineMg;
  while (cur > floor) {
    const next = STRENGTHS[STRENGTHS.indexOf(cur) + 1];
    if (next === undefined) break;
    weeks.push([
      { mg: cur, count: 1 },
      { mg: next, count: 1 },
    ]);
    weeks.push([{ mg: next, count: 2 }]);
    cur = next;
  }
  return weeks;
}

export function generateWeeks(
  baselineCount: number,
  baselineMg: number,
  pace: Pace,
): TaperWeek[] {
  const weeks: TaperWeek[] = [];
  const counts = countLadder(baselineCount, pace);
  counts.forEach((limit) => {
    weeks.push({
      index: weeks.length,
      limit,
      mgPlan: [{ mg: baselineMg, count: limit }],
      held: false,
      kind: 'count',
    });
  });
  // Strength phase only makes sense once the count is at 2/day.
  if (counts[counts.length - 1] === 2) {
    strengthWeeks(baselineMg).forEach((mgPlan) => {
      weeks.push({
        index: weeks.length,
        limit: 2,
        mgPlan,
        held: false,
        kind: 'strength',
      });
    });
  }
  return weeks;
}

/** mg delivered by the n-th pouch (0-based) of a day under this week. */
export function mgForTap(week: TaperWeek, tapIndex: number): number {
  let remaining = tapIndex;
  for (const part of week.mgPlan) {
    if (remaining < part.count) return part.mg;
    remaining -= part.count;
  }
  // Over the ceiling: count it at the week's lowest strength.
  return week.mgPlan[week.mgPlan.length - 1]?.mg ?? 0;
}

/** Total planned mg for a full day at the ceiling. */
export function plannedMg(week: TaperWeek): number {
  return week.mgPlan.reduce((sum, p) => sum + p.mg * p.count, 0);
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function parseDateKey(key: string): number {
  const [y, m, d] = key.split('-').map((s) => parseInt(s, 10));
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).getTime();
}

export function dateKeyOf(ms: number): string {
  const d = new Date(ms);
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function addDaysKey(key: string, days: number): string {
  return dateKeyOf(parseDateKey(key) + days * DAY_MS);
}

/** 0-based week index for a date key within a plan starting at startDate. */
export function weekIndexFor(startDate: string, key: string): number {
  const diff = Math.floor(
    (parseDateKey(key) - parseDateKey(startDate)) / (7 * DAY_MS),
  );
  return Math.max(0, diff);
}

export function zeroDateKey(startDate: string, weeks: TaperWeek[]): string {
  return addDaysKey(startDate, weeks.length * 7);
}

export function moneySaved(
  usage: Record<string, { count: number; mgTotal: number }>,
  baselineCount: number,
  pouchesPerCan: number,
  pricePerCan: number | null,
): number | null {
  if (pricePerCan === null || pouchesPerCan <= 0) return null;
  let avoided = 0;
  for (const day of Object.values(usage)) {
    avoided += Math.max(0, baselineCount - day.count);
  }
  return (avoided / pouchesPerCan) * pricePerCan;
}
