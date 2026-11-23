import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Stars } from '@/components/Stars';
import { usePremium } from '@/hooks/usePremium';
import { useStreak } from '@/hooks/useStreak';
import { useTaper } from '@/hooks/useTaper';
import { PACE_LABELS, parseDateKey } from '@/lib/taperPlan';
import { colors } from '@/theme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const streak = useStreak();
  const premium = usePremium();
  const taper = useTaper();
  const t = taper.taper;

  const zeroText =
    taper.zeroDate !== null
      ? new Date(parseDateKey(taper.zeroDate)).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : null;

  const confirm = (title: string, body: string, action: () => void) => {
    Alert.alert(title, body, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'OK', onPress: action },
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: Math.max(23, insets.top) }]}>
      <Stars />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.body}>
          Current level: {streak.currentLevel.name} · Streak:{' '}
          {streak.durationText} · Slips: {streak.state?.relapses ?? 0}
        </Text>

        <Text style={styles.section}>Premium</Text>
        <Pressable
          onPress={() => router.push('/paywall')}
          style={({ pressed }) => (pressed ? styles.pressed : null)}
        >
          <View style={styles.premiumCard}>
            <Text style={styles.premiumTitle}>
              {premium.isPremium ? '✓ LastPouch Premium' : '✦ LastPouch Premium'}
            </Text>
            <Text style={styles.cardBody}>
              {premium.isPremium
                ? 'Premium is active — reminders, trigger tracking, 0mg swaps, and monthly reports are unlocked.'
                : 'Smart reminders, trigger tracking, 0mg swap suggestions, and monthly reports. Free for 7 days.'}
            </Text>
            <Text style={styles.premiumCta}>
              {premium.isPremium ? 'View details ›' : 'See plans ›'}
            </Text>
          </View>
        </Pressable>

        <Text style={styles.section}>My Plan</Text>
        {!t || t.mode === 'done' ? (
          <View style={styles.card}>
            <Text style={styles.cardBody}>
              {t?.mode === 'done'
                ? 'Taper complete — your nicotine-free streak is running. Nice work.'
                : 'Quitting cold turkey, or step down gradually with a weekly plan that lowers your pouches, then the strength, to zero.'}
            </Text>
            <Pressable
              style={styles.cta}
              onPress={() => router.push('/taper-setup')}
            >
              <Text style={styles.ctaText}>Start a taper</Text>
            </Pressable>
          </View>
        ) : t.mode === 'baseline' ? (
          <View style={styles.card}>
            <Text style={styles.cardBody}>
              Tracking mode — log every pouch for 3 days, then build a plan
              from your real average.
            </Text>
            <Pressable
              style={styles.cta}
              onPress={() => router.push('/taper-setup')}
            >
              <Text style={styles.ctaText}>Build my plan</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                confirm('End tracking?', 'Your logged days will be removed.', () => {
                  void taper.endTaper();
                })
              }
            >
              <Text style={styles.danger}>End tracking</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardBody}>
              {PACE_LABELS[t.pace]} taper · {t.baselineCount} a day at{' '}
              {t.baselineMg}mg → 0{'\n'}
              Week {taper.weekIndex + 1} of {t.weeks.length}
              {zeroText ? ` · Zero Day: ${zeroText}` : ''}
              {t.mode === 'paused' ? '\nPaused — resume any time.' : ''}
              {taper.overDaysThisWeek >= 3
                ? '\nThis week ran over the ceiling on 3+ days. Holding this step for another week is a solid move, not a failure.'
                : ''}
            </Text>
            {t.mode === 'paused' ? (
              <Pressable
                style={styles.cta}
                onPress={() => {
                  void taper.resume();
                }}
              >
                <Text style={styles.ctaText}>Resume plan</Text>
              </Pressable>
            ) : (
              <>
                <Pressable
                  style={styles.cta}
                  onPress={() =>
                    confirm(
                      'Hold this week?',
                      'The same ceiling repeats next week and Zero Day moves 7 days later.',
                      () => {
                        void taper.holdWeek();
                      },
                    )
                  }
                >
                  <Text style={styles.ctaText}>Hold this week</Text>
                </Pressable>
                <Pressable
                  style={styles.secondary}
                  onPress={() =>
                    confirm(
                      'Step back?',
                      'Next week returns to the previous ceiling, then the plan continues.',
                      () => {
                        void taper.stepBack();
                      },
                    )
                  }
                >
                  <Text style={styles.secondaryText}>Step back a week</Text>
                </Pressable>
                <Pressable
                  style={styles.secondary}
                  onPress={() =>
                    confirm(
                      'Pause plan?',
                      'Logging and step changes stop. Resuming shifts the plan by the paused days.',
                      () => {
                        void taper.pause();
                      },
                    )
                  }
                >
                  <Text style={styles.secondaryText}>Pause plan</Text>
                </Pressable>
              </>
            )}
            <Pressable onPress={() => router.push('/taper-setup')}>
              <Text style={styles.link}>Adjust plan (restart setup)</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                confirm(
                  'End taper?',
                  'The plan and its logs will be removed. Your streak is not affected.',
                  () => {
                    void taper.endTaper();
                  },
                )
              }
            >
              <Text style={styles.danger}>End taper</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
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
  section: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 26,
    marginBottom: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 18,
    backgroundColor: colors.cardBg,
    padding: 18,
    gap: 12,
  },
  cardBody: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  pressed: { opacity: 0.85 },
  premiumCard: {
    borderWidth: 1,
    borderColor: colors.featuredBorder,
    borderRadius: 18,
    backgroundColor: colors.featuredBgTo,
    padding: 18,
    gap: 12,
  },
  premiumTitle: { color: colors.gold, fontSize: 16, fontWeight: '800' },
  premiumCta: { color: colors.text, fontSize: 14, fontWeight: '700' },
  cta: {
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: '#06240f', fontSize: 15, fontWeight: '800' },
  secondary: {
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.actionBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  link: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 4,
  },
  danger: {
    color: colors.panicMid,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 4,
  },
});
