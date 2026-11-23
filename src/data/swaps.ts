/**
 * 0mg swap suggestions shown in the Panic modal (Premium).
 * Generic nicotine-free alternatives only — no brands, no efficacy
 * claims. The idea is to keep the hand-to-mouth ritual busy for the
 * few minutes a craving lasts.
 */
export interface Swap {
  title: string;
  body: string;
}

export const SWAPS: readonly Swap[] = [
  {
    title: 'Nicotine-free (0mg) pouch',
    body: 'Same ritual, zero nicotine. Keep a tin of 0mg pouches for the moments that feel automatic — after meals, on breaks.',
  },
  {
    title: 'Caffeine pouch',
    body: 'A coffee- or tea-based pouch keeps the format you know. Check the caffeine per pouch if you are sensitive to it.',
  },
  {
    title: 'Strong mint + cold water',
    body: 'The sharpest mint you can find, then a full glass of ice water. The cold and the burn together crowd out the craving.',
  },
  {
    title: 'Chewing gum',
    body: 'Sugar-free gum gives your jaw the job the pouch used to do. Keep a pack exactly where the tin used to live.',
  },
  {
    title: 'Cinnamon toothpicks',
    body: 'Old-school and surprisingly effective: strong flavour, something in your mouth, nothing to swallow.',
  },
  {
    title: 'Sunflower seeds',
    body: 'Shelling seeds one by one is a whole activity. Perfect for driving and desk work, the two hardest slots.',
  },
  {
    title: 'Crunchy snack break',
    body: 'Carrot sticks, ice, or a handful of nuts. Crunch is a craving killer — it is hard to want a pouch mid-bite.',
  },
  {
    title: 'Two-minute walk',
    body: 'Stand up and change rooms or step outside. Cravings are tied to places; moving breaks the association.',
  },
  {
    title: 'Brush your teeth',
    body: 'Toothpaste resets your mouth completely. A fresh-mint mouth makes a pouch feel wrong, not tempting.',
  },
];

/** Deterministic pick that changes daily and steps with the taper week. */
export function swapForToday(weekIndex: number): Swap {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return SWAPS[(dayOfYear + Math.max(0, weekIndex)) % SWAPS.length] ?? SWAPS[0]!;
}
