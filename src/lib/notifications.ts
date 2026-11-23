import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import type { NotifSettings } from '../store/notifications';

/**
 * Local notifications engine (Premium). Everything is scheduled on the
 * device — no push server, no remote notifications. All calls are
 * guarded: on web or without permission they quietly do nothing.
 */

const MORNING_HOUR = 8;

export function notificationsSupported(): boolean {
  return Platform.OS !== 'web';
}

export function initNotifications(): void {
  if (!notificationsSupported()) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch {
    // Non-fatal.
  }
}

/** Ask for permission (only call from a user action). Returns granted. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

async function scheduleDaily(
  hour: number,
  minute: number,
  title: string,
  body: string,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/**
 * Rebuild every scheduled notification from the current settings.
 * peak: the user's usual craving hour from the trigger log (nullable).
 */
export async function rescheduleNotifications(
  settings: NotifSettings,
  peak: number | null,
): Promise<void> {
  if (!notificationsSupported()) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!settings.morningPledge && !settings.peakNudge) return;
    const granted = (await Notifications.getPermissionsAsync()).granted;
    if (!granted) return;

    if (settings.morningPledge) {
      await scheduleDaily(
        MORNING_HOUR,
        0,
        'Morning pledge',
        "Another pouch-free day starts now. Say it, mean it — you've got this.",
      );
    }
    if (settings.peakNudge) {
      // 30 minutes before the usual peak; falls back to 15:00.
      const peakHour = peak ?? 15;
      const total = peakHour * 60 - 30;
      const hour = Math.floor(((total + 1440) % 1440) / 60);
      const minute = ((total % 60) + 60) % 60;
      await scheduleDaily(
        hour,
        minute,
        'Your usual craving window is coming',
        'Water, gum, fresh air — be ready and ride out the next few minutes.',
      );
    }
  } catch {
    // Scheduling must never break the app.
  }
}

/** Immediate alert fired when today's taper ceiling is reached. */
export async function fireLimitReachedAlert(): Promise<void> {
  if (!notificationsSupported()) return;
  try {
    const granted = (await Notifications.getPermissionsAsync()).granted;
    if (!granted) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Daily limit reached",
        body: "That's today's ceiling — the plan is working. Nothing more today; tomorrow you step down again.",
      },
      trigger: null,
    });
  } catch {
    // Non-fatal.
  }
}
