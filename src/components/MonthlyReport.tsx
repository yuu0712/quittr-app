import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

import { usePremium } from '../hooks/usePremium';
import { useTaper } from '../hooks/useTaper';
import { todayKey } from '../store/streak';
import {
  loadTriggers,
  topTrigger,
  triggerLabel,
  type TriggerEvent,
} from '../store/triggers';
import { colors } from '../theme';

const DAY_MS = 24 * 60 * 60 * 1000;

function last30Keys(): string[] {
  const keys: string[] = [];
  const now = Date.now();
  for (let i = 29; i >= 0; i--) keys.push(todayKey(new Date(now - i * DAY_MS)));
  return keys;
}

/**
 * Premium monthly report for the Progress tab: this month's numbers,
 * a 30-day usage graph, CSV export, and a shareable image.
 */
export function MonthlyReport() {
  const router = useRouter();
  const premium = usePremium();
  const taper = useTaper();
  const [events, setEvents] = useState<TriggerEvent[]>([]);
  const cardRef = useRef<ComponentRef<typeof View> | null>(null);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void loadTriggers().then(setEvents);
    }, []),
  );

  const usage = taper.taper?.usage ?? {};
  const monthPrefix = todayKey().slice(0, 7);
  const monthName = new Date().toLocaleDateString('en-US', { month: 'long' });

  const stats = useMemo(() => {
    let pouches = 0;
    let days = 0;
    for (const [key, day] of Object.entries(usage)) {
      if (key.startsWith(monthPrefix)) {
        pouches += day.count;
        if (day.count >= 0) days += 1;
      }
    }
    const monthEvents = events.filter(
      (e) => todayKey(new Date(e.at)).startsWith(monthPrefix),
    );
    const top = topTrigger(events);
    return {
      pouches,
      days,
      cravings: monthEvents.length,
      topLabel: top ? triggerLabel(top.kind) : '—',
      topCount: top?.count ?? 0,
    };
  }, [usage, events, monthPrefix]);

  const series = useMemo(() => {
    const keys = last30Keys();
    const fromUsage = keys.map((k) => usage[k]?.count ?? 0);
    if (fromUsage.some((c) => c > 0)) return { values: fromUsage, label: 'Pouches per day' };
    const counts = keys.map(
      (k) => events.filter((e) => todayKey(new Date(e.at)) === k).length,
    );
    return { values: counts, label: 'Cravings ridden out per day' };
  }, [usage, events]);

  const maxVal = Math.max(1, ...series.values);

  if (premium.isPremium === null) return null;

  if (!premium.isPremium) {
    return (
      <Pressable
        onPress={() => router.push('/paywall')}
        style={({ pressed }) => (pressed ? styles.pressed : null)}
      >
        <View style={styles.lockedCard}>
          <Text style={styles.lockedTitle}>✦ Monthly reports — Premium</Text>
          <Text style={styles.lockedBody}>
            Your month in one card: pouches, cravings ridden out, top
            triggers, a 30-day graph, CSV export, and a shareable image.
          </Text>
          <Text style={styles.lockedCta}>See plans ›</Text>
        </View>
      </Pressable>
    );
  }

  const exportCsv = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const lines: string[] = ['date,pouches,mg_total'];
      for (const key of Object.keys(usage).sort()) {
        const day = usage[key];
        if (day) lines.push(`${key},${day.count},${day.mgTotal}`);
      }
      lines.push('', 'datetime,trigger');
      for (const e of [...events].sort((a, b) => a.at - b.at)) {
        lines.push(
          `${new Date(e.at).toISOString()},${triggerLabel(e.kind)}`,
        );
      }
      const uri = `${FileSystem.cacheDirectory ?? ''}lastpouch-report.csv`;
      await FileSystem.writeAsStringAsync(uri, lines.join('\n'));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'text/csv',
          dialogTitle: 'LastPouch monthly report (CSV)',
        });
      } else {
        Alert.alert('Export ready', 'Sharing is not available on this device.');
      }
    } catch {
      Alert.alert('Export failed', 'The CSV could not be created. Please try again.');
    }
    setBusy(false);
  };

  const shareImage = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const uri = cardRef.current
        ? await captureRef(cardRef, { format: 'png', quality: 0.92, result: 'tmpfile' })
        : null;
      if (uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share my LastPouch month',
        });
      }
    } catch {
      Alert.alert('Share failed', 'The image could not be created. Please try again.');
    }
    setBusy(false);
  };

  return (
    <View style={styles.wrap}>
        <View ref={cardRef} collapsable={false} style={styles.card}>
          <Text style={styles.cardTitle}>📊 {monthName} report</Text>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{stats.pouches}</Text>
              <Text style={styles.statLabel}>pouches logged</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{stats.cravings}</Text>
              <Text style={styles.statLabel}>cravings ridden out</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{stats.days}</Text>
              <Text style={styles.statLabel}>days tracked</Text>
            </View>
          </View>
          <Text style={styles.topTrigger}>
            Top trigger so far: {stats.topLabel}
            {stats.topCount > 0 ? ` (×${stats.topCount})` : ''}
          </Text>
          <Text style={styles.graphLabel}>{series.label} · last 30 days</Text>
          <View style={styles.graph}>
            {series.values.map((v, i) => (
              <View
                key={i}
                style={[
                  styles.bar,
                  {
                    height: Math.max(3, Math.round((v / maxVal) * 56)),
                    backgroundColor:
                      i === series.values.length - 1
                        ? colors.gold
                        : colors.progressTo,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      <View style={styles.actions}>
        <Pressable
          onPress={() => void exportCsv()}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
        >
          <Text style={styles.actionText}>{busy ? 'Working…' : 'Export CSV'}</Text>
        </Pressable>
        <Pressable
          onPress={() => void shareImage()}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
        >
          <Text style={styles.actionText}>Share image</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 22 },
  card: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 18,
    backgroundColor: colors.cardBg,
    padding: 18,
    gap: 12,
  },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  statRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1 },
  statValue: { color: colors.text, fontSize: 24, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 11, marginTop: 2 },
  topTrigger: { color: colors.muted, fontSize: 13 },
  graphLabel: { color: colors.mutedDim, fontSize: 11 },
  graph: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 60,
  },
  bar: { flex: 1, borderRadius: 2, minHeight: 3 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.actionBorder,
    backgroundColor: colors.actionBgTo,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionText: { color: colors.actionText, fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.85 },
  lockedCard: {
    marginTop: 22,
    borderWidth: 1,
    borderColor: colors.featuredBorder,
    borderRadius: 18,
    backgroundColor: colors.featuredBgTo,
    padding: 18,
    gap: 8,
  },
  lockedTitle: { color: colors.gold, fontSize: 16, fontWeight: '800' },
  lockedBody: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  lockedCta: { color: colors.text, fontSize: 14, fontWeight: '700' },
});
