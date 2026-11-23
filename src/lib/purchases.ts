import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

/**
 * Thin wrapper around RevenueCat (react-native-purchases).
 *
 * The API key is a *public* SDK key (it ships inside the app binary by
 * design) and is injected at build time via the EXPO_PUBLIC_ env var.
 * Every function fails soft: billing problems must never crash the app
 * or lock a paying user out of the free features.
 */

export const PREMIUM_ENTITLEMENT = 'premium';

const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_KEY ?? '';

let configured = false;

/** True when the SDK can actually run (native build + key present). */
export function purchasesAvailable(): boolean {
  return Platform.OS !== 'web' && API_KEY.length > 0;
}

export function configurePurchases(): void {
  if (configured) return;
  configured = true;
  if (!purchasesAvailable()) return;
  try {
    Purchases.configure({ apiKey: API_KEY });
  } catch {
    // Ignore: paywall will simply report plans as unavailable.
  }
}

export function isPremiumInfo(info: CustomerInfo | null): boolean {
  if (!info) return false;
  return info.entitlements.active[PREMIUM_ENTITLEMENT] != null;
}

export async function fetchCustomerInfo(): Promise<CustomerInfo | null> {
  if (!purchasesAvailable()) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

export async function fetchIsPremium(): Promise<boolean> {
  return isPremiumInfo(await fetchCustomerInfo());
}

/** The "current" offering configured in the RevenueCat dashboard. */
export async function fetchCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!purchasesAvailable()) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch {
    return null;
  }
}

export type PurchaseOutcome =
  | { status: 'success'; isPremium: boolean }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

export async function purchasePackage(
  pkg: PurchasesPackage,
): Promise<PurchaseOutcome> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { status: 'success', isPremium: isPremiumInfo(customerInfo) };
  } catch (e) {
    const err = e as { userCancelled?: boolean; message?: string };
    if (err?.userCancelled) return { status: 'cancelled' };
    return {
      status: 'error',
      message: err?.message ?? 'The purchase could not be completed.',
    };
  }
}

/** Returns the premium state after restoring. */
export async function restorePurchases(): Promise<boolean> {
  if (!purchasesAvailable()) return false;
  try {
    const info = await Purchases.restorePurchases();
    return isPremiumInfo(info);
  } catch {
    return false;
  }
}

/** Subscribe to entitlement changes (purchase on another device, renewal…). */
export function onCustomerInfoUpdated(
  listener: (isPremium: boolean) => void,
): () => void {
  if (!purchasesAvailable()) return () => {};
  const wrapped = (info: CustomerInfo) => listener(isPremiumInfo(info));
  Purchases.addCustomerInfoUpdateListener(wrapped);
  return () => {
    try {
      Purchases.removeCustomerInfoUpdateListener(wrapped);
    } catch {
      // No-op.
    }
  };
}
