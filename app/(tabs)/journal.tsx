import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Stars } from '@/components/Stars';
import { useTaper } from '@/hooks/useTaper';
import { parseDateKey, weekIndexFor } from '@/lib/taperPlan';
import { colors } from '@/theme';

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const taper = useTaper();

  const entries = taper.taper
    ? Object.entries(taper.taper.usage)
        .filter(([, u]) => u.count > 0)
        .sort(([a], [b]) => (a < b ? 1 : -1))
    : [];

  return (
    <View style={[styles.root, { paddingTop: Math.max(23, insets.top) }]}>
      <Stars />
      <Text style={styles.title}>Journal</Text>
      {!taper.taper || entries.length === 0 ? (
        <Text style={styles.body}>
          Daily entries and craving logs live here. When a taper plan is
          running, every pouch you log shows up below — date, count,
          nicotine total, and whether the day stayed under its ceiling.
        </Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {entries.map(([key, u]) => {
            const t = taper.taper;
            const week =
              t && t.weeks.length > 0
                ? t.weeks[
                    Math.min(
                      weekIndexFor(t.startDate, key),
                      t.weeks.length - 1,
                    )
                  ]
                : undefined;
            const over = week ? u.count > week.limit : false;
            const label = new Date(parseDateKey(key)).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
            return (
              <View key={key} style={styles.row}>
                <View>
                  <Text style={styles.date}>{label}</Text>
                  <Text style={styles.sub}>
                    {u.mgTotal}mg total
                    {week ? ` · ceiling ${week.limit}` : ' · tracking'}
                  </Text>
                </View>
                <View style={styles.right}>
                  <Text style={styles.count}>{u.count}</Text>
                  {over && <Text style={styles.over}>over</Text>}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 22 },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  body: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    backgroundColor: colors.cardBg,
  },
  date: { color: colors.text, fontSize: 14, fontWeight: '700' },
  sub: { color: colors.muted, fontSize: 12, marginTop: 3 },
  right: { alignItems: 'flex-end' },
  count: { color: colors.text, fontSize: 18, fontWeight: '800' },
  over: { color: colors.gold, fontSize: 11, fontWeight: '700', marginTop: 2 },
});
