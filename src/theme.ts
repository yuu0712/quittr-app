/**
 * Design tokens extracted 1:1 from quittr-home.html (GitHub Copilot design).
 * Do not tweak casually — every value below maps to a CSS value in that file.
 */
export const colors = {
  bg: '#08090b',
  bgTop: '#0b0c0e',
  bgBottom: '#0a0b0d',
  text: '#f4f3f5',
  muted: '#929297',
  mutedDim: '#68696e',
  encouragement: '#77777b',

  cardBg: '#17181b',
  cardBorder: '#242529',
  featuredBgFrom: '#211f14',
  featuredBgTo: '#1a1912',
  featuredBorder: '#79671e',
  metricLabel: '#aaa9ad',
  pink: '#f36a9c',
  gold: '#f0c84b',
  green: '#64d18b',

  badgeFrom: '#f8cf56',
  badgeTo: '#eea921',
  badgeText: '#34240d',

  actionBorder: '#303135',
  actionBgFrom: '#202124',
  actionBgTo: '#18191c',
  actionText: '#dedde0',

  rewiringBg: '#191a1d',
  rewiringBorder: '#292a2e',
  progressTrack: '#34353a',
  progressFrom: '#397bff',
  progressTo: '#24d3b0',

  panicFrom: '#fa514e',
  panicMid: '#e3212b',
  panicTo: '#bf1723',
  panicText: '#fff7f7',

  tabBarBg: '#0a0b0d',
  tabBarBorder: '#1d1e21',
  tabActive: '#f0eff1',
  tabInactive: '#818287',

  orbBorder: 'rgba(255,255,255,0.16)',
} as const;

/** Level ladder. Current level = last entry whose `days` <= streak days. */
export interface Level {
  days: number;
  name: string;
}

export const LEVELS: readonly Level[] = [
  { days: 0, name: 'First Step' },
  { days: 3, name: '72 Hours' },
  { days: 7, name: 'One Week' },
  { days: 30, name: 'One Month' },
  { days: 60, name: 'Two Months' },
  { days: 90, name: 'Nicotine-Free' },
] as const;

/** Pouch-free goal used by the TIL NIC-FREE metric and Brain Rewiring %. */
export const SOBER_GOAL_DAYS = 90;
