import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Premium trigger log: one entry each time the user tells the Panic
 * modal what sparked a craving. AsyncStorage only, separate key —
 * the streak and taper records are never touched.
 */
const KEY = 'quittr:triggers:v1';

export type TriggerKind =
  | 'stress'
  | 'meal'
  | 'coffee'
  | 'alcohol'
  | 'boredom'
  | 'social'
  | 'drive'
  | 'break'
  | 'other';

export const TRIGGERS: readonly { kind: TriggerKind; label: string; icon: string }[] = [
  { kind: 'stress', label: 'Stress', icon: '😖' },
  { kind: 'meal', label: 'After a meal', icon: '🍽️' },
  { kind: 'coffee', label: 'Coffee', icon: '☕' },
  { kind: 'alcohol', label: 'Alcohol', icon: '🍺' },
  { kind: 'boredom', label: 'Boredom', icon: '🥱' },
  { kind: 'social', label: 'Social', icon: '👥' },
  { kind: 'drive', label: 'Driving', icon: '🚗' },
  { kind: 'break', label: 'Work break', icon: '🚶' },
  { kind: 'other', label: 'Other', icon: '•' },
];

export interface TriggerEvent {
  /** epoch ms */
  at: number;
  kind: TriggerKind;
}

const KINDS = new Set<string>(TRIGGERS.map((t) => t.kind));

function isEvent(v: unknown): v is TriggerEvent {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.at === 'number' && typeof o.kind === 'string' && KINDS.has(o.kind);
}

export async function loadTriggers(): Promise<TriggerEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(isEvent);
    }
  } catch {
    // Corrupted storage -> no events; other records are unaffected.
  }
  return [];
}

export async function addTrigger(kind: TriggerKind): Promise<TriggerEvent[]> {
  const events = await loadTriggers();
  const next = [...events, { at: Date.now(), kind }];
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Logging must never break the panic flow.
  }
  return next;
}

/** Most frequent trigger in the given events, or null when empty. */
export function topTrigger(
  events: readonly TriggerEvent[],
): { kind: TriggerKind; count: number } | null {
  if (events.length === 0) return null;
  const counts = new Map<TriggerKind, number>();
  for (const e of events) counts.set(e.kind, (counts.get(e.kind) ?? 0) + 1);
  let best: { kind: TriggerKind; count: number } | null = null;
  for (const [kind, count] of counts) {
    if (!best || count > best.count) best = { kind, count };
  }
  return best;
}

/**
 * The local hour (0-23) cravings most often hit, from the event history.
 * Needs at least 3 events to be meaningful; otherwise null.
 */
export function peakHour(events: readonly TriggerEvent[]): number | null {
  if (events.length < 3) return null;
  const byHour = new Array<number>(24).fill(0);
  for (const e of events) {
    const h = new Date(e.at).getHours();
    byHour[h] = (byHour[h] ?? 0) + 1;
  }
  let hour = 0;
  for (let h = 1; h < 24; h++) {
    if ((byHour[h] ?? 0) > (byHour[hour] ?? 0)) hour = h;
  }
  return hour;
}

export function triggerLabel(kind: TriggerKind): string {
  return TRIGGERS.find((t) => t.kind === kind)?.label ?? 'Other';
}
