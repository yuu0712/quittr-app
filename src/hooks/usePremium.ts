import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import type { PurchasesOffering } from 'react-native-purchases';

/**
 * Web-preview scaffolding ONLY: on web (never on iOS/Android) setting
 * localStorage 'lp_dev_premium' = '1' renders the premium UI so the
 * design can be checked in a browser. Has no effect in the real app.
 */
function devWebPremium(): boolean {
  if (Platform.OS !== 'web') return false;
  try {
    return globalThis.localStorage?.getItem('lp_dev_premium') === '1';
  } catch {
    return false;
  }
}

import {
  fetchCurrentOffering,
  fetchIsPremium,
  onCustomerInfoUpdated,
  purchasePackage,
  restorePurchases,
  type PurchaseOutcome,
} from '../lib/purchases';
import type { PurchasesPackage } from 'react-native-purchases';

export interface PremiumDerived {
  /** null while the first check is still running */
  isPremium: boolean | null;
  offering: PurchasesOffering | null;
  loading: boolean;
  refresh: () => Promise<void>;
  purchase: (pkg: PurchasesPackage) => Promise<PurchaseOutcome>;
  restore: () => Promise<boolean>;
}

/**
 * Premium (RevenueCat) state for screens. Mirrors the other hooks:
 * loads on mount, reloads on focus, and follows live entitlement
 * updates pushed by the SDK.
 */
export function usePremium(): PremiumDerived {
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (devWebPremium()) {
      setIsPremium(true);
      setLoading(false);
      return;
    }
    const [premium, off] = await Promise.all([
      fetchIsPremium(),
      fetchCurrentOffering(),
    ]);
    setIsPremium(premium);
    setOffering(off);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    const unsubscribe = onCustomerInfoUpdated((premium) => {
      setIsPremium(premium);
    });
    return unsubscribe;
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const purchase = useCallback(
    async (pkg: PurchasesPackage): Promise<PurchaseOutcome> => {
      const outcome = await purchasePackage(pkg);
      if (outcome.status === 'success') {
        setIsPremium(outcome.isPremium);
      }
      return outcome;
    },
    [],
  );

  const restore = useCallback(async (): Promise<boolean> => {
    const premium = await restorePurchases();
    setIsPremium(premium);
    return premium;
  }, []);

  return { isPremium, offering, loading, refresh, purchase, restore };
}
