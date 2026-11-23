import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SWAPS, swapForToday } from '../data/swaps';
import { TRIGGERS, type TriggerKind } from '../store/triggers';
import { colors } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Extra line shown while a taper plan is active. */
  taperLine?: string | undefined;
  /** Premium state; null while unknown (extras stay hidden). */
  isPremium?: boolean | null;
  /** Current taper week, used to rotate the 0mg swap suggestion. */
  weekIndex?: number;
  onLogTrigger?: (kind: TriggerKind) => void;
  onOpenPaywall?: () => void;
}

/** Panic Button overlay — comp only defines the button; this is the destination. */
export function PanicModal({
  visible,
  onClose,
  taperLine,
  isPremium,
  weekIndex = 0,
  onLogTrigger,
  onOpenPaywall,
}: Props) {
  const [logged, setLogged] = useState<TriggerKind | null>(null);
  const [swapOffset, setSwapOffset] = useState(0);

  useEffect(() => {
    if (visible) {
      setLogged(null);
      setSwapOffset(0);
    }
  }, [visible]);

  const baseSwap = swapForToday(weekIndex);
  const baseIndex = SWAPS.indexOf(baseSwap);
  const swap = SWAPS[(baseIndex + swapOffset) % SWAPS.length] ?? baseSwap;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}
          >
            <Text style={styles.title}>Ride it out.</Text>
            <Text style={styles.body}>
              A nicotine craving peaks and passes in{"\n"}
              about 3–5 minutes. You just have to outlast it.
            </Text>
            <Text style={styles.body}>
              Drink a glass of cold water, chew gum,{"\n"}
              step outside, and breathe — in for 4,{"\n"}
              hold for 4, out for 6. No pouch.
            </Text>
            {taperLine ? <Text style={styles.body}>{taperLine}</Text> : null}

            {isPremium ? (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionLabel}>What sparked it?</Text>
                {logged ? (
                  <Text style={styles.loggedText}>
                    ✓ Logged — your patterns show up in Progress.
                  </Text>
                ) : (
                  <View style={styles.chips}>
                    {TRIGGERS.map((t) => (
                      <Pressable
                        key={t.kind}
                        onPress={() => {
                          setLogged(t.kind);
                          onLogTrigger?.(t.kind);
                        }}
                        style={({ pressed }) => [
                          styles.chip,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.chipText}>
                          {t.icon} {t.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                <View style={styles.swapCard}>
                  <Text style={styles.swapLabel}>🌿 0mg swap idea</Text>
                  <Text style={styles.swapTitle}>{swap.title}</Text>
                  <Text style={styles.swapBody}>{swap.body}</Text>
                  <Pressable
                    onPress={() => setSwapOffset((o) => o + 1)}
                    hitSlop={8}
                  >
                    <Text style={styles.swapNext}>Another idea ›</Text>
                  </Pressable>
                </View>
              </>
            ) : isPremium === false ? (
              <>
                <View style={styles.divider} />
                <Pressable
                  onPress={onOpenPaywall}
                  style={({ pressed }) => [
                    styles.lockedCard,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.lockedTitle}>✦ Premium</Text>
                  <Text style={styles.lockedBody}>
                    Track what triggers your cravings and get a 0mg swap idea
                    for moments exactly like this.
                  </Text>
                  <Text style={styles.lockedCta}>See plans ›</Text>
                </Pressable>
              </>
            ) : null}

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.buttonText}>I&apos;m okay</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  sheet: {
    width: '100%',
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 24,
    backgroundColor: colors.cardBg,
    overflow: 'hidden',
  },
  sheetContent: {
    padding: 24,
    alignItems: 'center',
    gap: 14,
  },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  body: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  divider: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: colors.cardBorder,
    marginVertical: 2,
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    alignSelf: 'stretch',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignSelf: 'stretch',
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.actionBorder,
    backgroundColor: colors.actionBgTo,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: { color: colors.actionText, fontSize: 13, fontWeight: '600' },
  loggedText: { color: colors.green, fontSize: 14, fontWeight: '600' },
  swapCard: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 16,
    backgroundColor: colors.rewiringBg,
    padding: 14,
    gap: 6,
  },
  swapLabel: { color: colors.green, fontSize: 12, fontWeight: '700' },
  swapTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  swapBody: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  swapNext: { color: colors.text, fontSize: 13, fontWeight: '700', marginTop: 2 },
  lockedCard: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: colors.featuredBorder,
    borderRadius: 16,
    backgroundColor: colors.featuredBgTo,
    padding: 14,
    gap: 6,
  },
  lockedTitle: { color: colors.gold, fontSize: 14, fontWeight: '800' },
  lockedBody: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  lockedCta: { color: colors.text, fontSize: 13, fontWeight: '700' },
  button: {
    marginTop: 6,
    height: 50,
    alignSelf: 'stretch',
    borderRadius: 25,
    backgroundColor: colors.panicMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
  buttonText: { color: colors.panicText, fontSize: 16, fontWeight: '800' },
});
