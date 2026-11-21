import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  addDaysKey,
  generateWeeks,
  mgForTap,
  moneySaved as calcMoneySaved,
  parseDateKey,
  weekIndexFor,
  zeroDateKey,
  type Pace,
  type TaperWeek,
} from '../lib/taperPlan';
import {
  clearTaper,
  loadTaper,
  saveTaper,
  type TaperState,
} from '../store/taper';
import { loadStreak, saveStreak, todayKey } from '../store/streak';

export interface TaperDerived {
  taper: TaperState | null;
  loading: boolean;
  active: boolean;
  /** current week (clamped to the last week) */
  currentWeek: TaperWeek | null;
  weekIndex: number;
  /** yyyy-mm-dd of Zero Day, or null when there is no plan */
  zeroDate: string | null;
  daysToZero: number | null;
  todayCount: number;
  todayMg: number;
  /** pouches left under today's ceiling; null in baseline mode */
  remaining: number | null;
  overBy: number;
  /** 0..100 across all steps */
  taperProgress: number;
  moneySaved: number | null;
  /** days over the ceiling in the current week */
  overDaysThisWeek: number;
  startBaseline: (mg: number) => Promise<void>;
  createPlan: (input: {
    baselineCount: number;
    baselineMg: number;
    pace: Pace;
    pricePerCan: number | null;
  }) => Promise<void>;
  logPouch: () => Promise<void>;
  undoPouch: () => Promise<void>;
  holdWeek: () => Promise<void>;
  stepBack: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  endTaper: () => Promise<void>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function useTaper(): TaperDerived {
  const [taper, setTaper] = useState<TaperState | null>(null);
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState<string>(() => todayKey());
  const ref = useRef<TaperState | null>(null);
  ref.current = taper;

  useEffect(() => {
    let alive = true;
    void (async () => {
      const loaded = await loadTaper();
      if (!alive) return;
      if (loaded && loaded.mode === 'tapering') {
        // Zero Day reached? Hand off to the existing streak record.
        const zero = zeroDateKey(loaded.startDate, loaded.weeks);
        if (todayKey() >= zero && loaded.weeks.length > 0) {
          const done: TaperState = { ...loaded, mode: 'done' };
          await saveTaper(done);
          const streak = await loadStreak();
          const [y, m, d] = zero.split('-').map((s) => parseInt(s, 10));
          await saveStreak({
            startAt: new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).getTime(),
            relapses: streak.relapses,
            pledgedOn: null,
          });
          if (alive) setTaper(done);
          setLoading(false);
          return;
        }
      }
      if (alive) setTaper(loaded);
      setLoading(false);
    })();
    const id = setInterval(() => setToday(todayKey()), 30_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const persist = useCallback(async (next: TaperState | null) => {
    setTaper(next);
    if (next) await saveTaper(next);
  }, []);

  const startBaseline = useCallback(
    async (mg: number) => {
      await persist({
        version: 1,
        mode: 'baseline',
        pace: 'standard',
        baselineCount: 0,
        baselineMg: mg,
        pricePerCan: null,
        pouchesPerCan: 15,
        startDate: todayKey(),
        weeks: [],
        usage: {},
        pausedAt: null,
      });
    },
    [persist],
  );

  const createPlan = useCallback(
    async (input: {
      baselineCount: number;
      baselineMg: number;
      pace: Pace;
      pricePerCan: number | null;
    }) => {
      const cur = ref.current;
      const weeks = generateWeeks(
        input.baselineCount,
        input.baselineMg,
        input.pace,
      );
      await persist({
        version: 1,
        mode: 'tapering',
        pace: input.pace,
        baselineCount: input.baselineCount,
        baselineMg: input.baselineMg,
        pricePerCan: input.pricePerCan,
        pouchesPerCan: 15,
        startDate: todayKey(),
        weeks,
        // Keep any baseline-tracking days already logged.
        usage: cur?.mode === 'baseline' ? cur.usage : {},
        pausedAt: null,
      });
    },
    [persist],
  );

  const weekFor = useCallback(
    (state: TaperState, key: string): { week: TaperWeek | null; index: number } => {
      if (state.weeks.length === 0) return { week: null, index: 0 };
      const idx = Math.min(
        weekIndexFor(state.startDate, key),
        state.weeks.length - 1,
      );
      return { week: state.weeks[idx] ?? null, index: idx };
    },
    [],
  );

  const logPouch = useCallback(async () => {
    const cur = ref.current;
    if (!cur || cur.mode === 'done' || cur.mode === 'paused') return;
    const key = todayKey();
    const day = cur.usage[key] ?? { count: 0, mgTotal: 0 };
    const { week } = weekFor(cur, key);
    const mg = week
      ? mgForTap(week, day.count)
      : cur.baselineMg || 6;
    await persist({
      ...cur,
      usage: {
        ...cur.usage,
        [key]: { count: day.count + 1, mgTotal: day.mgTotal + mg },
      },
    });
  }, [persist, weekFor]);

  const undoPouch = useCallback(async () => {
    const cur = ref.current;
    if (!cur || cur.mode === 'done' || cur.mode === 'paused') return;
    const key = todayKey();
    const day = cur.usage[key];
    if (!day || day.count <= 0) return;
    const { week } = weekFor(cur, key);
    const mg = week
      ? mgForTap(week, day.count - 1)
      : cur.baselineMg || 6;
    await persist({
      ...cur,
      usage: {
        ...cur.usage,
        [key]: {
          count: day.count - 1,
          mgTotal: Math.max(0, day.mgTotal - mg),
        },
      },
    });
  }, [persist, weekFor]);

  /** Insert a copy of the current week after it: Zero Day moves +7 days. */
  const insertWeekAfterCurrent = useCallback(
    async (held: boolean, usePrevious: boolean) => {
      const cur = ref.current;
      if (!cur || cur.mode !== 'tapering') return;
      const { index } = weekFor(cur, todayKey());
      const source =
        cur.weeks[usePrevious ? Math.max(0, index - 1) : index];
      if (!source) return;
      const inserted: TaperWeek = { ...source, held, kind: source.kind };
      const weeks = [
        ...cur.weeks.slice(0, index + 1),
        inserted,
        ...cur.weeks.slice(index + 1),
      ].map((w, i) => ({ ...w, index: i }));
      await persist({ ...cur, weeks });
    },
    [persist, weekFor],
  );

  const holdWeek = useCallback(
    () => insertWeekAfterCurrent(true, false),
    [insertWeekAfterCurrent],
  );
  const stepBack = useCallback(
    () => insertWeekAfterCurrent(false, true),
    [insertWeekAfterCurrent],
  );

  const pause = useCallback(async () => {
    const cur = ref.current;
    if (!cur || cur.mode !== 'tapering') return;
    await persist({ ...cur, mode: 'paused', pausedAt: todayKey() });
  }, [persist]);

  const resume = useCallback(async () => {
    const cur = ref.current;
    if (!cur || cur.mode !== 'paused' || !cur.pausedAt) return;
    // Shift the whole plan by the paused span so no steps are lost.
    const pausedDays = Math.max(
      0,
      Math.round(
        (parseDateKey(todayKey()) - parseDateKey(cur.pausedAt)) / DAY_MS,
      ),
    );
    await persist({
      ...cur,
      mode: 'tapering',
      pausedAt: null,
      startDate: addDaysKey(cur.startDate, pausedDays),
    });
  }, [persist]);

  const endTaper = useCallback(async () => {
    setTaper(null);
    await clearTaper();
  }, []);

  const derived = useMemo(() => {
    const empty = {
      active: false,
      currentWeek: null as TaperWeek | null,
      weekIndex: 0,
      zeroDate: null as string | null,
      daysToZero: null as number | null,
      todayCount: 0,
      todayMg: 0,
      remaining: null as number | null,
      overBy: 0,
      taperProgress: 0,
      moneySaved: null as number | null,
      overDaysThisWeek: 0,
    };
    if (!taper) return empty;
    const day = taper.usage[today] ?? { count: 0, mgTotal: 0 };
    if (taper.mode === 'baseline') {
      return { ...empty, active: true, todayCount: day.count, todayMg: day.mgTotal };
    }
    if (taper.weeks.length === 0) return { ...empty, todayCount: day.count };
    const idx = Math.min(
      weekIndexFor(taper.startDate, today),
      taper.weeks.length - 1,
    );
    const week = taper.weeks[idx] ?? null;
    const zero = zeroDateKey(taper.startDate, taper.weeks);
    const daysToZero = Math.max(
      0,
      Math.round((parseDateKey(zero) - parseDateKey(today)) / DAY_MS),
    );
    let overDays = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(taper.startDate);
      d.setDate(d.getDate() + idx * 7 + i);
      const m = `${d.getMonth() + 1}`.padStart(2, '0');
      const dd = `${d.getDate()}`.padStart(2, '0');
      const key = `${d.getFullYear()}-${m}-${dd}`;
      const u = taper.usage[key];
      if (week && u && u.count > week.limit) overDays += 1;
    }
    return {
      active: taper.mode === 'tapering' || taper.mode === 'paused',
      currentWeek: week,
      weekIndex: idx,
      zeroDate: zero,
      daysToZero,
      todayCount: day.count,
      todayMg: day.mgTotal,
      remaining: week ? Math.max(0, week.limit - day.count) : null,
      overBy: week ? Math.max(0, day.count - week.limit) : 0,
      taperProgress:
        taper.mode === 'done'
          ? 100
          : Math.floor((idx / taper.weeks.length) * 100),
      moneySaved: calcMoneySaved(
        taper.usage,
        taper.baselineCount,
        taper.pouchesPerCan,
        taper.pricePerCan,
      ),
      overDaysThisWeek: overDays,
    };
  }, [taper, today]);

  return {
    taper,
    loading,
    ...derived,
    startBaseline,
    createPlan,
    logPouch,
    undoPouch,
    holdWeek,
    stepBack,
    pause,
    resume,
    endTaper,
  };
}
