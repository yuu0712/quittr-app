import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Pace, TaperWeek } from '../lib/taperPlan';

/**
 * Tapering persistence: AsyncStorage ONLY, separate key from the streak
 * record (`quittr:streak:v1` stays untouched and keeps working).
 */
const KEY = 'quittr:taper:v1';

export type TaperMode = 'baseline' | 'tapering' | 'paused' | 'done';

export interface DayUsage {
  count: number;
  mgTotal: number;
}

export interface TaperState {
  version: 1;
  mode: TaperMode;
  pace: Pace;
  baselineCount: number;
  baselineMg: number;
  pricePerCan: number | null;
  pouchesPerCan: number;
  /** yyyy-mm-dd (local) the plan (or baseline tracking) started */
  startDate: string;
  weeks: TaperWeek[];
  /** yyyy-mm-dd -> pouches used that day */
  usage: Record<string, DayUsage>;
  pausedAt: string | null;
}

function isTaperState(v: unknown): v is TaperState {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    o.version === 1 &&
    (o.mode === 'baseline' ||
      o.mode === 'tapering' ||
      o.mode === 'paused' ||
      o.mode === 'done') &&
    (o.pace === 'gentle' || o.pace === 'standard' || o.pace === 'fast') &&
    typeof o.baselineCount === 'number' &&
    typeof o.baselineMg === 'number' &&
    typeof o.startDate === 'string' &&
    Array.isArray(o.weeks) &&
    typeof o.usage === 'object' &&
    o.usage !== null
  );
}

export async function loadTaper(): Promise<TaperState | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isTaperState(parsed)) return parsed;
    }
  } catch {
    // corrupted storage -> treat as no plan; streak is unaffected
  }
  return null;
}

export async function saveTaper(state: TaperState): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
}

export async function clearTaper(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
