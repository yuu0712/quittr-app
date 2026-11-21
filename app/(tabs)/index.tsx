import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';

import { MetricCard } from '@/components/MetricCard';
import { Orb } from '@/components/Orb';
import { PanicModal } from '@/components/PanicModal';
import { SideOrb } from '@/components/SideOrb';
import { Stars } from '@/components/Stars';
import { useStreak } from '@/hooks/useStreak';
import { useTaper } from '@/hooks/useTaper';
import { colors } from '@/theme';

interface QuickAction {
  icon: string;
  label: string;
  onPress: () => void;
  active?: boolean;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const compact = height <= 760;
  const [panicOpen, setPanicOpen] = useState(false);
  const streak = useStreak();
  const taper = useTaper();
  const router = useRouter();

  const taperMode = taper.taper?.mode;
  const isTapering = taperMode === 'tapering' || taperMode === 'paused';
  const isBaseline = taperMode === 'baseline';
  const taperWeeks = taper.taper?.weeks.length ?? 0;

  const days = streak.days;
  const previous = isTapering || isBaseline ? null : streak.previousLevel;
  const encouragement = isTapering
    ? taper.overBy > 0
      ? `Over by ${taper.overBy} — logged. Tomorrow's ceiling is the same.`
      : `Week ${taper.weekIndex + 1} of ${taperWeeks}. A ceiling, not a target.`
    : isBaseline
      ? 'Tracking only — no limits yet. Just log honestly.'
      : days >= 90
        ? `Congratulations on reaching ${days} days nicotine-free. You've got this.`
        : `Day ${days} without a pouch. You've got this.`;

  const confirmReset = () => {
    Alert.alert(
      'Reset streak?',
      'This restarts your streak from today and counts one slip.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            void streak.reset();
          },
        },
      ],
    );
  };

  const soon = (label: string) => {
    Alert.alert(label, 'This screen is not part of the home comp yet.');
  };

  const actions: QuickAction[] = [
    {
      icon: '✋',
      label: 'Pledged',
      onPress: () => {
        void streak.pledge();
      },
      active: streak.pledgedToday,
    },
    { icon: '▤', label: 'Melius', onPress: () => soon('Melius') },
    { icon: '✿', label: 'Meditate', onPress: () => soon('Meditate') },
    { icon: '↻', label: 'Reset', onPress: confirmReset },
  ];

  return (
    <View
      style={[
        styles.app,
        { paddingTop: Math.max(23, insets.top) },
      ]}
    >
      <Stars />

      {/* ── topbar ─────────────────────────────────────────── */}
      <View style={styles.topbar}>
        <View>
          <Text style={styles.wordmark}>Quit Pouches</Text>
          <Text style={styles.wordmarkSub}>◡</Text>
        </View>
        <LinearGradient
          colors={[colors.badgeFrom, colors.badgeTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.35 }}
          style={styles.dayBadge}
        >
          <Text style={styles.flame}>♨</Text>
          <Text style={styles.dayBadgeText}>{days}</Text>
        </LinearGradient>
      </View>

      {/* ── hero ───────────────────────────────────────────── */}
      <View
        style={[
          styles.hero,
          compact ? styles.heroCompact : null,
        ]}
      >
        {previous ? (
          <>
            <View style={styles.sideOrbPos}>
              <SideOrb />
            </View>
            <View style={styles.sideCaption}>
              <Text style={styles.sideCaptionName}>{previous.name}</Text>
              <Text style={styles.sideCaptionDays}>
                {previous.days} days
              </Text>
            </View>
          </>
        ) : null}

        <View style={styles.orbPos}>
          <Orb />
        </View>

        <View style={styles.heroCaption}>
          <Text style={styles.heroCaptionStrong}>
            {isTapering
              ? `Week ${taper.weekIndex + 1} of ${taperWeeks}`
              : isBaseline
                ? 'Tracking'
                : streak.currentLevel.name}
          </Text>
          <Text style={styles.heroCaptionDays}>
            {isTapering
              ? taper.remaining !== null && taper.remaining > 0
                ? `${taper.remaining} left today`
                : 'Ceiling reached today'
              : isBaseline
                ? `${taper.todayCount} logged today`
                : `${days} days`}
          </Text>
        </View>
      </View>

      {/* ── metrics ────────────────────────────────────────── */}
      {isTapering ? (
        <View style={styles.metrics}>
          <MetricCard
            icon="◉"
            iconColor={colors.pink}
            label="TODAY"
            value={`${taper.todayCount} / ${taper.currentWeek?.limit ?? '–'}`}
            flex={1}
          />
          <MetricCard
            icon="◷"
            iconColor={colors.gold}
            label="DAY LIMIT"
            value={
              taper.overBy > 0
                ? `Over by ${taper.overBy}`
                : `${taper.remaining ?? 0} left`
            }
            featured
            flex={1.08}
          />
          <MetricCard
            icon="▰"
            iconColor={colors.green}
            label="ZERO DAY"
            value={`in ${taper.daysToZero ?? 0}d`}
            flex={1}
          />
        </View>
      ) : isBaseline ? (
        <View style={styles.metrics}>
          <MetricCard
            icon="◉"
            iconColor={colors.pink}
            label="TODAY"
            value={`${taper.todayCount}`}
            flex={1}
          />
          <MetricCard
            icon="◷"
            iconColor={colors.gold}
            label="MODE"
            value="Tracking"
            featured
            flex={1.08}
          />
          <MetricCard
            icon="▰"
            iconColor={colors.green}
            label="STREAK"
            value={streak.durationText}
            flex={1}
          />
        </View>
      ) : (
        <View style={styles.metrics}>
          <MetricCard
            icon="◉"
            iconColor={colors.pink}
            label="SLIPS"
            value={`${streak.state?.relapses ?? 0}`}
            flex={1}
          />
          <MetricCard
            icon="◷"
            iconColor={colors.gold}
            label="STREAK"
            value={streak.durationText}
            featured
            flex={1.08}
          />
          <MetricCard
            icon="▰"
            iconColor={colors.green}
            label="TIL NIC-FREE"
            value={`${streak.tilSoberDays}d`}
            flex={1}
          />
        </View>
      )}

      {/* ── quick actions ──────────────────────────────────── */}
      <View
        style={[
          styles.actions,
          compact ? styles.actionsCompact : null,
        ]}
      >
        {actions.map((a) => (
          <Pressable
            key={a.label}
            onPress={a.onPress}
            style={styles.action}
            accessibilityRole="button"
            accessibilityLabel={a.label}
          >
            <LinearGradient
              colors={[colors.actionBgFrom, colors.actionBgTo]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.actionIcon,
                compact ? styles.actionIconCompact : null,
                a.active ? styles.actionIconActive : null,
              ]}
            >
              <Text style={styles.actionGlyph}>{a.icon}</Text>
            </LinearGradient>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* ── brain rewiring / taper progress ────────────────── */}
      <View style={styles.rewiring}>
        <Text style={styles.rewiringTitle}>
          {isTapering ? 'Taper Progress' : 'Brain Rewiring'}
        </Text>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={[colors.progressFrom, colors.progressTo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.progressFill,
              {
                width: `${
                  isTapering ? taper.taperProgress : streak.rewiringPercent
                }%`,
              },
            ]}
          />
        </View>
        <Text style={styles.percent}>
          {isTapering ? taper.taperProgress : streak.rewiringPercent}%
        </Text>
      </View>

      {/* ── log pouch (taper / baseline only) ──────────────── */}
      {isTapering || isBaseline ? (
        <Pressable
          onPress={() => {
            void taper.logPouch();
          }}
          onLongPress={() => {
            void taper.undoPouch();
          }}
          accessibilityRole="button"
          accessibilityLabel="Log pouch"
          style={({ pressed }) => (pressed ? styles.pressed : null)}
        >
          <View style={styles.logBtn}>
            <Text style={styles.logBtnText}>
              + Log pouch{taperMode === 'paused' ? ' (paused)' : ''}
            </Text>
            <Text style={styles.logBtnHint}>long-press to undo</Text>
          </View>
        </Pressable>
      ) : null}
      {isBaseline ? (
        <Pressable
          onPress={() => router.push('/taper-setup')}
          accessibilityRole="button"
          accessibilityLabel="Build my plan"
        >
          <Text style={styles.buildPlan}>Build my plan →</Text>
        </Pressable>
      ) : null}

      {/* ── panic button ───────────────────────────────────── */}
      <Pressable
        onPress={() => setPanicOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Panic Button"
        style={({ pressed }) => (pressed ? styles.pressed : null)}
      >
        <LinearGradient
          colors={[colors.panicFrom, colors.panicMid, colors.panicTo]}
          locations={[0, 0.62, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.panic}
        >
          <Text style={styles.panicMark}>▲</Text>
          <Text style={styles.panicText}>Panic Button</Text>
        </LinearGradient>
      </Pressable>

      <Text style={styles.encouragement}>{encouragement}</Text>

      <PanicModal
        visible={panicOpen}
        onClose={() => setPanicOpen(false)}
        taperLine={
          isTapering
            ? 'Or delay the next one by 10 minutes. Set it down, set a timer, do something else first.'
            : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: 22,
    paddingBottom: 10,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },

  /* topbar — comp: flex 0 0 42px, space-between */
  topbar: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -1.7,
    lineHeight: 24,
  },
  wordmarkSub: {
    marginTop: 1,
    color: colors.text,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 3,
    lineHeight: 8,
  },
  dayBadge: {
    height: 34,
    minWidth: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  flame: { color: colors.badgeText, fontSize: 16 },
  dayBadgeText: {
    color: colors.badgeText,
    fontSize: 15,
    fontWeight: '800',
  },

  /* hero — comp: flex 1 1 288px, min 245, max 325 */
  hero: {
    flex: 1,
    minHeight: 245,
    maxHeight: 325,
    position: 'relative',
  },
  heroCompact: { flexBasis: 254 },
  orbPos: {
    position: 'absolute',
    top: 16,
    left: '50%',
    marginLeft: -106,
  },
  sideOrbPos: {
    position: 'absolute',
    top: 94,
    left: -13,
  },
  sideCaption: {
    position: 'absolute',
    top: 203,
    left: -9,
    width: 111,
    alignItems: 'center',
  },
  sideCaptionName: {
    color: colors.muted,
    fontSize: 11,
    textAlign: 'center',
  },
  sideCaptionDays: {
    marginTop: 4,
    color: colors.mutedDim,
    fontSize: 9,
    textAlign: 'center',
  },
  heroCaption: {
    position: 'absolute',
    top: 214,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  heroCaptionStrong: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroCaptionDays: {
    marginTop: 4,
    color: colors.text,
    fontSize: 14,
    textAlign: 'center',
  },

  /* metrics — comp: flex 0 0 65px, gap 9 */
  metrics: {
    height: 65,
    flexDirection: 'row',
    gap: 9,
  },

  /* actions — comp: flex 0 0 128px, padding-top 22 */
  actions: {
    height: 128,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 22,
  },
  actionsCompact: { height: 112, paddingTop: 14 },
  action: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 7,
  },
  actionIcon: {
    width: 59,
    height: 59,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.actionBorder,
    borderRadius: 30,
  },
  actionIconCompact: { width: 53, height: 53, borderRadius: 27 },
  actionIconActive: { borderColor: colors.gold },
  actionGlyph: { color: '#e8e7e9', fontSize: 23 },
  actionLabel: { color: colors.actionText, fontSize: 12 },

  /* rewiring — comp: flex 0 0 55px, radius 30 */
  rewiring: {
    height: 55,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 17,
    borderWidth: 1,
    borderColor: colors.rewiringBorder,
    borderRadius: 30,
    backgroundColor: colors.rewiringBg,
  },
  rewiringTitle: { color: colors.text, fontSize: 13 },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 4,
    backgroundColor: colors.progressTrack,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  percent: { color: colors.text, fontSize: 12 },

  /* panic — comp: flex 0 0 54px, margin-top 12, radius 30 */
  panic: {
    height: 54,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 30,
    shadowColor: '#e0232d',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.23,
    shadowRadius: 24,
    elevation: 6,
  },
  pressed: { opacity: 0.9 },

  /* log pouch */
  logBtn: {
    height: 46,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: colors.green,
    backgroundColor: colors.cardBg,
  },
  logBtnText: { color: colors.green, fontSize: 15, fontWeight: '800' },
  logBtnHint: { color: colors.mutedDim, fontSize: 11 },
  buildPlan: {
    marginTop: 10,
    color: colors.gold,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  panicMark: { color: colors.panicText, fontSize: 14 },
  panicText: {
    color: colors.panicText,
    fontSize: 17,
    fontWeight: '800',
  },

  /* encouragement — comp: flex 0 0 29px, padding-top 9 */
  encouragement: {
    height: 29,
    paddingTop: 9,
    color: colors.encouragement,
    fontSize: 11,
    textAlign: 'center',
  },
});
