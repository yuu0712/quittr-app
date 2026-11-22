import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { LEVELS, SOBER_GOAL_DAYS, type Level } from '../theme';
import {
  loadStreak,
  saveStreak,
  todayKey,
  type StreakState,
} from '../store/streak';

const DAY = 24 * 60 * 60 * 1000;

export interface StreakDerived {
  state: StreakState | null;
  loading: boolean;
  /** whole days of the current streak */
  days: number;
  /** "90d 1h 1m" — exactly the format shown in the comp */
  durationText: string;
  /** whole days left until the sober goal (0 when reached) */
  tilSoberDays: number;
  /** 0..100, Brain Rewiring bar */
  rewiringPercent: number;
  currentLevel: Level;
  previousLevel: Level | null;
  pledgedToday: boolean;
  pledge: () => Promise<void>;
  reset: () => Promise<void>;
}

export function useStreak(): StreakDerived {
  const [state, setState] = useState<StreakState | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const stateRef = useRef<StreakState | null>(null);
  stateRef.current = state;

  // Tab screens now stay mounted (real Tabs navigator), so data is
  // reloaded on focus as well as on mount to stay fresh across tabs.
  const reload = useCallback(async () => {
    setState(await loadStreak());
  }, []);

  useEffect(() => {
    void reload();
    const id = setInterval(() => setNow(Date.now()), 20_000);
    return () => clearInterval(id);
  }, [reload]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const persist = useCallback(async (next: StreakState) => {
    setState(next);
    setNow(Date.now());
    await saveStreak(next);
  }, []);

  const pledge = useCallback(async () => {
    const cur = stateRef.current;
    if (!cur) return;
    const today = todayKey();
    await persist({
      ...cur,
      pledgedOn: cur.pledgedOn === today ? null : today,
    });
  }, [persist]);

  const reset = useCallback(async () => {
    const cur = stateRef.current;
    if (!cur) return;
    await persist({
      startAt: Date.now(),
      relapses: cur.relapses + 1,
      pledgedOn: null,
    });
  }, [persist]);

  const derived = useMemo(() => {
    const startAt = state?.startAt ?? now;
    const elapsed = Math.max(0, now - startAt);
    const totalMinutes = Math.floor(elapsed / 60_000);
    const d = Math.floor(totalMinutes / (24 * 60));
    const h = Math.floor((totalMinutes % (24 * 60)) / 60);
    const m = totalMinutes % 60;

    let current: Level = LEVELS[0] ?? { days: 0, name: 'Beginning' };
    let previous: Level | null = null;
    for (const lv of LEVELS) {
      if (d >= lv.days) {
        previous = current === lv ? previous : current;
        current = lv;
      }
    }
    if (current === LEVELS[0]) previous = null;

    return {
      days: d,
      durationText: `${d}d ${h}h ${m}m`,
      tilSoberDays: Math.max(0, SOBER_GOAL_DAYS - Math.floor(elapsed / DAY)),
      rewiringPercent: Math.min(
        100,
        Math.floor((elapsed / (SOBER_GOAL_DAYS * DAY)) * 100),
      ),
      currentLevel: current,
      previousLevel: previous,
    };
  }, [state, now]);

  return {
    state,
    loading: state === null,
    days: derived.days,
    durationText: derived.durationText,
    tilSoberDays: derived.tilSoberDays,
    rewiringPercent: derived.rewiringPercent,
    currentLevel: derived.currentLevel,
    previousLevel: derived.previousLevel,
    pledgedToday: state?.pledgedOn === todayKey(new Date(now)),
    pledge,
    reset,
  };
}
