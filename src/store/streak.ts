import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Persistence is AsyncStorage ONLY (no SQLite / SecureStore / MMKV).
 * Single key, single JSON record.
 */
const KEY = 'quittr:streak:v1';

export interface StreakState {
  /** epoch ms when the current streak started */
  startAt: number;
  /** total relapse count */
  relapses: number;
  /** yyyy-mm-dd (local) of the last pledge, or null */
  pledgedOn: string | null;
}

const DAY = 24 * 60 * 60 * 1000;

/**
 * First launch seeds a streak of exactly 90d 1h 1m so the first screen
 * matches the design comp 1:1. Reset replaces it with `now`.
 */
export function seedState(now: number = Date.now()): StreakState {
  return {
    startAt: now - (90 * DAY + 60 * 60 * 1000 + 60 * 1000),
    relapses: 2,
    pledgedOn: null,
  };
}

function isStreakState(v: unknown): v is StreakState {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.startAt === 'number' &&
    typeof o.relapses === 'number' &&
    (o.pledgedOn === null || typeof o.pledgedOn === 'string')
  );
}

export async function loadStreak(): Promise<StreakState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isStreakState(parsed)) return parsed;
    }
  } catch {
    // corrupted storage -> fall through to seed
  }
  const seeded = seedState();
  await saveStreak(seeded);
  return seeded;
}

export async function saveStreak(state: StreakState): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
}

export function todayKey(d: Date = new Date()): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
