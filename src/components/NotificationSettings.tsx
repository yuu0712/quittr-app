import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { usePremium } from '../hooks/usePremium';
import {
  ensureNotificationPermission,
  rescheduleNotifications,
} from '../lib/notifications';
import {
  loadNotifSettings,
  saveNotifSettings,
  type NotifSettings,
} from '../store/notifications';
import { loadTriggers, peakHour } from '../store/triggers';
import { colors } from '../theme';

const ROWS: readonly {
  key: keyof NotifSettings;
  title: string;
  body: string;
}[] = [
  {
    key: 'morningPledge',
    title: 'Morning pledge',
    body: 'A daily 8:00 reminder to start the day pouch-free.',
  },
  {
    key: 'peakNudge',
    title: 'Craving-peak nudge',
    body: 'A heads-up 30 minutes before the time your cravings usually hit, learned from your trigger log.',
  },
  {
    key: 'limitAlert',
    title: 'Daily limit alert',
    body: 'An alert the moment you reach today’s taper ceiling.',
  },
];

/** Premium notification settings, shown on the Profile tab. */
export function NotificationSettings() {
  const router = useRouter();
  const premium = usePremium();
  const [settings, setSettings] = useState<NotifSettings | null>(null);

  useFocusEffect(
    useCallback(() => {
      void loadNotifSettings().then(setSettings);
    }, []),
  );

  if (premium.isPremium === null) return null;

  if (!premium.isPremium) {
    return (
      <Pressable
        onPress={() => router.push('/paywall')}
        style={({ pressed }) => (pressed ? styles.pressed : null)}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔔 Smart reminders</Text>
          <Text style={styles.cardBody}>
            Morning pledge, craving-peak nudges, and daily limit alerts are
            part of Premium.
          </Text>
          <Text style={styles.cta}>See plans ›</Text>
        </View>
      </Pressable>
    );
  }

  const toggle = async (key: keyof NotifSettings, value: boolean) => {
    if (!settings) return;
    if (value) {
      const granted = await ensureNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Notifications are off',
          'Allow notifications for LastPouch in your iPhone Settings to use reminders.',
        );
        return;
      }
    }
    const next = { ...settings, [key]: value };
    setSettings(next);
    await saveNotifSettings(next);
    const events = await loadTriggers();
    await rescheduleNotifications(next, peakHour(events));
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>🔔 Smart reminders</Text>
      {ROWS.map((row) => (
        <View key={row.key} style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>{row.title}</Text>
            <Text style={styles.cardBody}>{row.body}</Text>
          </View>
          <Switch
            value={settings?.[row.key] ?? false}
            onValueChange={(v) => void toggle(row.key, v)}
            trackColor={{ true: colors.green, false: colors.progressTrack }}
            thumbColor="#ffffff"
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 18,
    backgroundColor: colors.cardBg,
    padding: 18,
    gap: 12,
  },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  cardBody: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  cta: { color: colors.text, fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.85 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: 12,
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
});
