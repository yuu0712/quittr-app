import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Stars } from '@/components/Stars';
import { TaperLadder } from '@/components/TaperLadder';
import { useTaper } from '@/hooks/useTaper';
import {
  PACE_LABELS,
  STRENGTHS,
  generateWeeks,
  parseDateKey,
  zeroDateKey,
  type Pace,
} from '@/lib/taperPlan';
import { todayKey } from '@/store/streak';
import { colors } from '@/theme';

const PACES: Pace[] = ['gentle', 'standard', 'fast'];
const PACE_HINTS: Record<Pace, string> = {
  gentle: 'Smaller drops, more weeks',
  standard: 'Recommended for most people',
  fast: 'Bigger drops, fewer weeks',
};

export default function TaperSetupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const taper = useTaper();

  const [step, setStep] = useState(1);
  const [count, setCount] = useState(12);
  const [mg, setMg] = useState<number>(6);
  const [pace, setPace] = useState<Pace>('standard');
  const [price, setPrice] = useState('');

  const weeks = useMemo(
    () => generateWeeks(count, mg, pace),
    [count, mg, pace],
  );
  const zero = useMemo(
    () => zeroDateKey(todayKey(), weeks),
    [weeks],
  );
  const zeroText = new Date(parseDateKey(zero)).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const baselineDays = Object.keys(taper.taper?.usage ?? {}).length;
  const baselineAvg =
    taper.taper?.mode === 'baseline' && baselineDays > 0
      ? Math.round(
          Object.values(taper.taper.usage).reduce(
            (s, u) => s + u.count,
            0,
          ) / baselineDays,
        )
      : null;

  const prefilled = useRef(false);
  useEffect(() => {
    if (baselineAvg !== null && !prefilled.current) {
      prefilled.current = true;
      setCount(Math.min(40, Math.max(1, baselineAvg)));
    }
  }, [baselineAvg]);

  const start = async () => {
    const parsed = parseFloat(price);
    await taper.createPlan({
      baselineCount: count,
      baselineMg: mg,
      pace,
      pricePerCan: Number.isFinite(parsed) && parsed > 0 ? parsed : null,
    });
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.root, { paddingTop: Math.max(23, insets.top) }]}>
      <Stars />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Step down, on a schedule.</Text>
        <Text style={styles.stepLabel}>Step {step} of 4</Text>

        {step === 1 && (
          <View style={styles.block}>
            <Text style={styles.q}>
              How many pouches do you use on a normal day?
            </Text>
            {baselineAvg !== null && (
              <Text style={styles.hint}>
                Your tracked average is {baselineAvg} a day — it&apos;s
                filled in below.
              </Text>
            )}
            <View style={styles.stepper}>
              <Pressable
                style={styles.stepBtn}
                onPress={() => setCount((c) => Math.max(1, c - 1))}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </Pressable>
              <Text style={styles.countText}>{count}</Text>
              <Pressable
                style={styles.stepBtn}
                onPress={() => setCount((c) => Math.min(40, c + 1))}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </Pressable>
            </View>
            <Text style={styles.q}>What strength?</Text>
            <View style={styles.chips}>
              {STRENGTHS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setMg(s)}
                  style={[styles.chip, mg === s && styles.chipActive]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      mg === s && styles.chipTextActive,
                    ]}
                  >
                    {s} mg
                  </Text>
                </Pressable>
              ))}
            </View>
            {taper.taper?.mode !== 'baseline' && (
              <Pressable
                onPress={async () => {
                  await taper.startBaseline(mg);
                  router.replace('/(tabs)');
                }}
              >
                <Text style={styles.link}>
                  Not sure of your average? Track for 3 days first →
                </Text>
              </Pressable>
            )}
            <Pressable style={styles.cta} onPress={() => setStep(2)}>
              <Text style={styles.ctaText}>Continue</Text>
            </Pressable>
          </View>
        )}

        {step === 2 && (
          <View style={styles.block}>
            <Text style={styles.q}>How fast do you want to step down?</Text>
            {PACES.map((p) => {
              const w = generateWeeks(count, mg, p);
              return (
                <Pressable
                  key={p}
                  onPress={() => setPace(p)}
                  style={[
                    styles.option,
                    pace === p && styles.optionActive,
                  ]}
                >
                  <Text style={styles.optionTitle}>
                    {PACE_LABELS[p]} — about {w.length} weeks
                    {p === 'standard' ? ' (recommended)' : ''}
                  </Text>
                  <Text style={styles.hint}>{PACE_HINTS[p]}</Text>
                </Pressable>
              );
            })}
            <Pressable style={styles.cta} onPress={() => setStep(3)}>
              <Text style={styles.ctaText}>Continue</Text>
            </Pressable>
            <Pressable onPress={() => setStep(1)}>
              <Text style={styles.link}>‹ Back</Text>
            </Pressable>
          </View>
        )}

        {step === 3 && (
          <View style={styles.block}>
            <Text style={styles.q}>
              Your plan: {count} → 0 in {weeks.length} weeks.
            </Text>
            <Text style={styles.body}>
              Zero day: {zeroText}. A daily limit is a ceiling, not a
              target. Coming in under it is a win.
            </Text>
            <View style={styles.card}>
              <TaperLadder
                weeks={weeks}
                currentIndex={0}
                baselineCount={count}
              />
            </View>
            <Pressable style={styles.cta} onPress={() => setStep(4)}>
              <Text style={styles.ctaText}>Looks right</Text>
            </Pressable>
            <Pressable onPress={() => setStep(2)}>
              <Text style={styles.link}>‹ Back</Text>
            </Pressable>
          </View>
        )}

        {step === 4 && (
          <View style={styles.block}>
            <Text style={styles.q}>What does a can cost you?</Text>
            <Text style={styles.hint}>
              Optional — used only to show your savings. A can holds 15
              pouches.
            </Text>
            <View style={styles.priceRow}>
              <Text style={styles.dollar}>$</Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                placeholder="6.00"
                placeholderTextColor={colors.mutedDim}
                style={styles.priceInput}
              />
            </View>
            <Pressable style={styles.cta} onPress={() => void start()}>
              <Text style={styles.ctaText}>Start my taper</Text>
            </Pressable>
            <Pressable onPress={() => void start()}>
              <Text style={styles.link}>Skip</Text>
            </Pressable>
            <Text style={styles.disclaimer}>
              This app supports your plan — it isn&apos;t medical advice.
              If you&apos;re pregnant, have a heart condition, or feel
              unwell while stepping down, talk to a doctor or pharmacist.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 22 },
  back: { color: colors.muted, fontSize: 15, marginBottom: 10 },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  stepLabel: { color: colors.gold, fontSize: 12, fontWeight: '700', marginTop: 6 },
  block: { marginTop: 22, gap: 14 },
  q: { color: colors.text, fontSize: 17, fontWeight: '700', lineHeight: 24 },
  body: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
    paddingVertical: 8,
  },
  stepBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.actionBorder,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { color: colors.text, fontSize: 24, fontWeight: '700' },
  countText: { color: colors.text, fontSize: 40, fontWeight: '900', minWidth: 70, textAlign: 'center' },
  chips: { flexDirection: 'row', gap: 9, flexWrap: 'wrap' },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.actionBorder,
    backgroundColor: colors.cardBg,
  },
  chipActive: { borderColor: colors.gold, backgroundColor: colors.featuredBgTo },
  chipText: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  chipTextActive: { color: colors.text },
  option: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.cardBg,
    gap: 4,
  },
  optionActive: { borderColor: colors.gold },
  optionTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  card: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.cardBg,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dollar: { color: colors.text, fontSize: 22, fontWeight: '700' },
  priceInput: {
    flex: 1,
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    backgroundColor: colors.cardBg,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  cta: {
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  ctaText: { color: '#06240f', fontSize: 16, fontWeight: '800' },
  link: { color: colors.gold, fontSize: 14, fontWeight: '600', textAlign: 'center', paddingVertical: 6 },
  disclaimer: {
    color: colors.mutedDim,
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: 10,
  },
});
