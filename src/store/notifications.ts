import AsyncStorage from '@react-native-async-storage/async-storage';

/** Premium notification preferences (AsyncStorage only). */
const KEY = 'quittr:notif:v1';

export interface NotifSettings {
  /** Daily morning pledge reminder (08:00). */
  morningPledge: boolean;
  /** Daily nudge shortly before the user's usual craving peak. */
  peakNudge: boolean;
  /** Immediate alert the moment the daily taper limit is reached. */
  limitAlert: boolean;
}

export const DEFAULT_NOTIF_SETTINGS: NotifSettings = {
  morningPledge: false,
  peakNudge: false,
  limitAlert: false,
};

export async function loadNotifSettings(): Promise<NotifSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const o = JSON.parse(raw) as Partial<NotifSettings>;
      return {
        morningPledge: o.morningPledge === true,
        peakNudge: o.peakNudge === true,
        limitAlert: o.limitAlert === true,
      };
    }
  } catch {
    // Fall through to defaults.
  }
  return DEFAULT_NOTIF_SETTINGS;
}

export async function saveNotifSettings(s: NotifSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Non-fatal.
  }
}
