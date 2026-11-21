import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { RecoveryRing } from '@/components/RecoveryRing';
import { TaperLadder } from '@/components/TaperLadder';
import { useStreak } from '@/hooks/useStreak';
import { useTaper } from '@/hooks/useTaper';
import { parseDateKey, plannedMg } from '@/lib/taperPlan';
import { SOBER_GOAL_DAYS } from '@/theme';

const DAY = 24 * 60 * 60 * 1000;

function ShareIcon() {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 15V4m0 0L8 8m4-4 4 4"
        stroke="#e8ecf3"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 12v7a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-7"
        stroke="#e8ecf3"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

interface Benefit {
  icon: string;
  title: string;
  body: string;
}

const BENEFITS: readonly Benefit[] = [
  {
    icon: '☆',
    title: 'Healthier Gums & Breath',
    body: 'No more pouches sitting against your gums all day. Your mouth gets a break, your breath freshens up, and that constant dry, irritated feeling fades.',
  },
  {
    icon: '◎',
    title: 'Sharper Focus',
    body: 'No more nicotine spike-and-crash cycle. Without planning your day around the next pouch, concentrating on work and the people in front of you gets easier.',
  },
  {
    icon: '↗',
    title: 'Money Back in Your Pocket',
    body: 'A can a day quietly adds up to a serious monthly bill. Every pouch-free day is money that stays yours instead of going up in nicotine.',
  },
] as const;

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const streak = useStreak();
  const taper = useTaper();

  if (taper.active && taper.taper) {
    const t = taper.taper;
    const zeroText = taper.zeroDate
      ? new Date(parseDateKey(taper.zeroDate)).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '';
    const firstMg = t.weeks[0] ? plannedMg(t.weeks[0]) : 0;
    const nowMg = taper.currentWeek ? plannedMg(taper.currentWeek) : 0;
    const mgDrop =
      firstMg > 0 ? Math.round((1 - nowMg / firstMg) * 100) : 0;
    return (
      <LinearGradient
        colors={['#0a1526', '#050a14', '#03060c']}
        locations={[0, 0.45, 1]}
        style={styles.root}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: Math.max(18, insets.top) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Tapering</Text>
              <Text style={styles.subtitle}>
                Week {taper.weekIndex + 1} of {t.weeks.length} ·{' '}
                {t.baselineCount} a day → 0
              </Text>
            </View>
          </View>

          <Text style={styles.message}>
            You&apos;re stepping down on schedule. Each week the ceiling
            drops a little — small enough that your week barely notices.
          </Text>

          <Text style={styles.onTrack}>You&apos;re on track to:</Text>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Zero Day: {zeroText}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardIcon}>↘</Text>
              <Text style={styles.cardTitle}>Your ladder</Text>
            </View>
            <TaperLadder
              weeks={t.weeks}
              currentIndex={taper.weekIndex}
              baselineCount={t.baselineCount}
            />
          </View>

          <View style={styles.benefits}>
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardIcon}>◎</Text>
                <Text style={styles.cardTitle}>
                  Nicotine per day: {firstMg}mg → {nowMg}mg
                  {mgDrop > 0 ? ` (−${mgDrop}%)` : ''}
                </Text>
              </View>
              <Text style={styles.cardBody}>
                That&apos;s the planned dose at your daily ceiling. Coming
                in under the ceiling lowers it further.
              </Text>
            </View>
            {taper.moneySaved !== null && (
              <View style={styles.card}>
                <View style={styles.cardHead}>
                  <Text style={styles.cardIcon}>↗</Text>
                  <Text style={styles.cardTitle}>
                    Money kept: ${taper.moneySaved.toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.cardBody}>
                  Compared with your old pace of {t.baselineCount} a day,
                  based on the can price you entered.
                </Text>
              </View>
            )}
            {BENEFITS.map((b) => (
              <View key={b.title} style={styles.card}>
                <View style={styles.cardHead}>
                  <Text style={styles.cardIcon}>{b.icon}</Text>
                  <Text style={styles.cardTitle}>{b.title}</Text>
                </View>
                <Text style={styles.cardBody}>{b.body}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  const days = streak.days;
  const percent = streak.rewiringPercent;

  const startAt = streak.state?.startAt ?? Date.now();
  const target = new Date(startAt + SOBER_GOAL_DAYS * DAY);
  const targetText = target.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const milestone = Math.floor(days / 10) * 10;
  const lead =
    milestone >= 10
      ? `You're over ${milestone} days in!`
      : `You're ${days} days in!`;
  const message =
    `${lead} The cravings may still come, ` +
    'but each one peaks and passes in just a few minutes, ' +
    'and your brain is relearning how to focus without nicotine. ' +
    'Stay the course and trust the process.';

  const onShare = () => {
    void Share.share({
      message: `I'm on a ${days} day streak without nicotine pouches — ${percent}% recovered.`,
    }).catch(() => undefined);
  };

  return (
    <LinearGradient
      colors={['#0a1526', '#050a14', '#03060c']}
      locations={[0, 0.45, 1]}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(18, insets.top) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── header ─────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Recovery</Text>
            <Text style={styles.subtitle}>Demo</Text>
          </View>
          <Pressable
            onPress={onShare}
            style={styles.share}
            accessibilityRole="button"
            accessibilityLabel="Share"
          >
            <ShareIcon />
            <Text style={styles.shareText}>Share</Text>
          </Pressable>
        </View>

        {/* ── recovery ring ──────────────────────────────────── */}
        <View style={styles.ringWrap}>
          <RecoveryRing percent={percent} days={days} />
        </View>

        {/* ── encouragement ──────────────────────────────────── */}
        <Text style={styles.message}>{message}</Text>

        {/* ── on track to ────────────────────────────────────── */}
        <Text style={styles.onTrack}>You&apos;re on track to:</Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>ZYN-Free by {targetText}</Text>
        </View>

        {/* ── benefits ───────────────────────────────────────── */}
        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b.title} style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardIcon}>{b.icon}</Text>
                <Text style={styles.cardTitle}>{b.title}</Text>
              </View>
              <Text style={styles.cardBody}>{b.body}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
  },
  subtitle: {
    marginTop: 2,
    color: '#aeb6c4',
    fontSize: 15,
  },
  share: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 6,
  },
  shareText: {
    color: '#e8ecf3',
    fontSize: 14,
    fontWeight: '600',
  },

  ringWrap: {
    marginTop: 26,
    alignItems: 'center',
  },

  message: {
    marginTop: 26,
    color: '#c2c7d1',
    fontSize: 14.5,
    lineHeight: 21,
    textAlign: 'center',
  },

  onTrack: {
    marginTop: 22,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  pill: {
    marginTop: 12,
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: '#131c2e',
    paddingVertical: 12,
    paddingHorizontal: 22,
  },
  pillText: {
    color: '#dbe2ee',
    fontSize: 14,
    fontWeight: '600',
  },

  benefits: {
    marginTop: 28,
    gap: 14,
  },
  card: {
    borderRadius: 18,
    backgroundColor: '#0c1424',
    padding: 18,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  cardIcon: {
    color: '#e8ecf3',
    fontSize: 16,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  cardBody: {
    marginTop: 9,
    color: '#8a93a6',
    fontSize: 12.5,
    lineHeight: 18,
  },
});
