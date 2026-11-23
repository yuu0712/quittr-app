import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PurchasesPackage } from 'react-native-purchases';

import { Stars } from '@/components/Stars';
import { usePremium } from '@/hooks/usePremium';
import { purchasesAvailable } from '@/lib/purchases';
import { colors } from '@/theme';

const BENEFITS: readonly { icon: string; title: string; body: string }[] = [
  {
    icon: '⏰',
    title: 'Smart reminders',
    body: 'Morning pledge, daily-limit alerts, and a nudge before your usual craving peaks.',
  },
  {
    icon: '⚡',
    title: 'Trigger tracking',
    body: 'Log what sparked each craving from the Panic Button and see your patterns over time.',
  },
  {
    icon: '🌿',
    title: '0mg swap suggestions',
    body: 'Nicotine-free pouch swaps for your hardest moments, matched to your taper week.',
  },
  {
    icon: '📊',
    title: 'Monthly reports',
    body: 'Progress graphs, CSV export, and a shareable image of how far you have come.',
  },
];

interface PlanView {
  pkg: PurchasesPackage | null;
  key: 'annual' | 'monthly';
  name: string;
  priceText: string;
  perText: string;
  hasTrial: boolean;
}

function isAnnual(pkg: PurchasesPackage): boolean {
  return (
    (pkg.packageType as unknown as string) === 'ANNUAL' ||
    pkg.identifier === '$rc_annual'
  );
}

function isMonthly(pkg: PurchasesPackage): boolean {
  return (
    (pkg.packageType as unknown as string) === 'MONTHLY' ||
    pkg.identifier === '$rc_monthly'
  );
}

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const premium = usePremium();
  const [selected, setSelected] = useState<'annual' | 'monthly'>('annual');
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const plans = useMemo<PlanView[]>(() => {
    const pkgs = premium.offering?.availablePackages ?? [];
    const annual = pkgs.find(isAnnual) ?? null;
    const monthly = pkgs.find(isMonthly) ?? null;
    const toView = (
      pkg: PurchasesPackage | null,
      key: 'annual' | 'monthly',
      fallbackPrice: string,
    ): PlanView => {
      if (!pkg) {
        return {
          pkg: null,
          key,
          name: key === 'annual' ? 'Yearly' : 'Monthly',
          priceText: fallbackPrice,
          perText: key === 'annual' ? 'per year' : 'per month',
          hasTrial: true,
        };
      }
      const p = pkg.product;
      const trial = p.introPrice != null && p.introPrice.price === 0;
      let perText = key === 'annual' ? 'per year' : 'per month';
      if (key === 'annual' && p.price > 0) {
        try {
          const monthlyEq = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: p.currencyCode,
          }).format(p.price / 12);
          perText = `per year · ≈ ${monthlyEq}/mo`;
        } catch {
          // Keep the plain label.
        }
      }
      return {
        pkg,
        key,
        name: key === 'annual' ? 'Yearly' : 'Monthly',
        priceText: p.priceString,
        perText,
        hasTrial: trial,
      };
    };
    return [toView(annual, 'annual', '$29.99'), toView(monthly, 'monthly', '$6.99')];
  }, [premium.offering]);

  const selectedPlan = plans.find((p) => p.key === selected) ?? plans[0];
  const plansReady = plans.every((p) => p.pkg != null);

  const onPurchase = async () => {
    if (!selectedPlan?.pkg || busy) return;
    setBusy(true);
    const outcome = await premium.purchase(selectedPlan.pkg);
    setBusy(false);
    if (outcome.status === 'success') {
      if (outcome.isPremium) {
        Alert.alert('Welcome to Premium', 'All premium features are now unlocked.');
        router.back();
      } else {
        Alert.alert(
          'Purchase received',
          'Your purchase is being processed. Premium will unlock as soon as Apple confirms it.',
        );
      }
    } else if (outcome.status === 'error') {
      Alert.alert('Purchase failed', outcome.message);
    }
    // 'cancelled' → stay silent, user simply changed their mind.
  };

  const onRestore = async () => {
    if (restoring) return;
    setRestoring(true);
    const ok = await premium.restore();
    setRestoring(false);
    Alert.alert(
      ok ? 'Premium restored' : 'Nothing to restore',
      ok
        ? 'Your premium access is active again.'
        : 'No previous purchase was found for this Apple ID.',
    );
    if (ok) router.back();
  };

  return (
    <View style={[styles.root, { paddingTop: Math.max(23, insets.top) }]}>
      <Stars />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>

        <Text style={styles.title}>LastPouch Premium</Text>
        <Text style={styles.subtitle}>
          Everything in the free app stays free. Premium adds the tools that
          make the hard days easier.
        </Text>

        {premium.isPremium ? (
          <View style={styles.activeCard}>
            <Text style={styles.activeTitle}>✓ Premium is active</Text>
            <Text style={styles.activeBody}>
              All premium features are unlocked on this device. You can manage
              or cancel your subscription anytime in your App Store account.
            </Text>
            <Pressable
              onPress={() =>
                void Linking.openURL('https://apps.apple.com/account/subscriptions')
              }
              hitSlop={8}
            >
              <Text style={styles.link}>Manage subscription</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.benefits}>
              {BENEFITS.map((b) => (
                <View key={b.title} style={styles.benefitRow}>
                  <Text style={styles.benefitIcon}>{b.icon}</Text>
                  <View style={styles.benefitText}>
                    <Text style={styles.benefitTitle}>{b.title}</Text>
                    <Text style={styles.benefitBody}>{b.body}</Text>
                  </View>
                </View>
              ))}
            </View>

            {plans.map((plan) => {
              const active = selected === plan.key;
              return (
                <Pressable
                  key={plan.key}
                  onPress={() => setSelected(plan.key)}
                  style={[styles.planCard, active && styles.planCardActive]}
                >
                  <View style={styles.planHead}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    {plan.key === 'annual' && (
                      <View style={styles.bestBadge}>
                        <Text style={styles.bestBadgeText}>BEST VALUE</Text>
                      </View>
                    )}
                    {plan.hasTrial && (
                      <View style={styles.trialBadge}>
                        <Text style={styles.trialBadgeText}>7 DAYS FREE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.planPrice}>
                    {plan.priceText}
                    <Text style={styles.planPer}> {plan.perText}</Text>
                  </Text>
                  {plan.hasTrial && (
                    <Text style={styles.planTrial}>
                      Free for 7 days, then {plan.priceText}
                      {plan.key === 'annual' ? '/year' : '/month'}. Cancel anytime.
                    </Text>
                  )}
                </Pressable>
              );
            })}

            <Pressable
              onPress={() => void onPurchase()}
              disabled={!plansReady || busy}
              style={({ pressed }) => (pressed ? styles.pressed : null)}
            >
              <LinearGradient
                colors={[colors.badgeFrom, colors.badgeTo]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.cta, (!plansReady || busy) && styles.ctaDisabled]}
              >
                {busy ? (
                  <ActivityIndicator color={colors.badgeText} />
                ) : (
                  <Text style={styles.ctaText}>
                    {selectedPlan?.hasTrial
                      ? 'Start 7-day free trial'
                      : 'Subscribe'}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>

            {!plansReady && (
              <Text style={styles.unavailable}>
                {premium.loading
                  ? 'Loading plans…'
                  : purchasesAvailable()
                    ? 'Plans could not be loaded. Check your connection and reopen this page.'
                    : 'Plans are available in the iOS app.'}
              </Text>
            )}

            <Pressable
              onPress={() => void onRestore()}
              disabled={restoring}
              hitSlop={8}
              style={styles.restoreBtn}
            >
              <Text style={styles.restoreText}>
                {restoring ? 'Restoring…' : 'Restore purchases'}
              </Text>
            </Pressable>

            <Text style={styles.finePrint}>
              Subscriptions renew automatically until cancelled. Payment is
              charged to your Apple ID at confirmation, and renewals are
              charged within 24 hours before the end of the current period.
              Cancel anytime in App Store settings; a free trial converts to a
              paid subscription unless cancelled before it ends.
            </Text>
            <View style={styles.legalRow}>
              <Pressable
                onPress={() =>
                  void Linking.openURL(
                    'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
                  )
                }
                hitSlop={8}
              >
                <Text style={styles.link}>Terms of Use</Text>
              </Pressable>
              <Text style={styles.legalDot}>·</Text>
              <Pressable
                onPress={() =>
                  void Linking.openURL(
                    'https://yuu0712.github.io/quittr-app/privacy-policy.html',
                  )
                }
                hitSlop={8}
              >
                <Text style={styles.link}>Privacy Policy</Text>
              </Pressable>
            </View>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20 },
  back: { color: colors.muted, fontSize: 16, paddingVertical: 6 },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', marginTop: 6 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 8 },
  benefits: { marginTop: 22, gap: 14 },
  benefitRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  benefitIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  benefitText: { flex: 1 },
  benefitTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  benefitBody: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 2 },
  planCard: {
    marginTop: 16,
    backgroundColor: colors.cardBg,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  planCardActive: {
    borderColor: colors.featuredBorder,
    backgroundColor: colors.featuredBgTo,
  },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planName: { color: colors.text, fontSize: 17, fontWeight: '700' },
  bestBadge: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  bestBadgeText: { color: colors.badgeText, fontSize: 10, fontWeight: '800' },
  trialBadge: {
    borderColor: colors.green,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  trialBadgeText: { color: colors.green, fontSize: 10, fontWeight: '700' },
  planPrice: { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: 8 },
  planPer: { color: colors.muted, fontSize: 13, fontWeight: '400' },
  planTrial: { color: colors.muted, fontSize: 12, marginTop: 4 },
  cta: {
    marginTop: 22,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { color: colors.badgeText, fontSize: 17, fontWeight: '800' },
  pressed: { opacity: 0.85 },
  unavailable: {
    color: colors.mutedDim,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
  restoreBtn: { alignItems: 'center', marginTop: 16, paddingVertical: 6 },
  restoreText: { color: colors.muted, fontSize: 14, textDecorationLine: 'underline' },
  finePrint: {
    color: colors.mutedDim,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 18,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  legalDot: { color: colors.mutedDim },
  link: { color: colors.muted, fontSize: 13, textDecorationLine: 'underline' },
  activeCard: {
    marginTop: 22,
    backgroundColor: colors.cardBg,
    borderColor: colors.green,
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    gap: 8,
  },
  activeTitle: { color: colors.green, fontSize: 17, fontWeight: '700' },
  activeBody: { color: colors.muted, fontSize: 13, lineHeight: 19 },
});
