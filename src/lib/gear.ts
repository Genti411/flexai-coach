// Recommended gear shown on the Gear & Support screen. The URLs are placeholders —
// replace them with your own affiliate links before publishing, and keep the
// affiliate disclosure + "not medical devices" note on the screen.

export interface GearItem {
  id: string;
  name: string;
  blurb: string;
  url: string;
}

export const GEAR: GearItem[] = [
  { id: 'foam-roller', name: 'Foam roller', blurb: 'For gentle self-massage and warm-ups.', url: 'https://example.com/foam-roller' },
  { id: 'yoga-mat', name: 'Yoga mat', blurb: 'Cushioned surface for floor stretches.', url: 'https://example.com/yoga-mat' },
  { id: 'massage-ball', name: 'Massage ball', blurb: 'Targeted pressure for tight spots.', url: 'https://example.com/massage-ball' },
  { id: 'resistance-band', name: 'Resistance band', blurb: 'Light assistance and mobility work.', url: 'https://example.com/resistance-band' },
  { id: 'light-dumbbells', name: 'Light dumbbells', blurb: 'For the optional light-weights exercises.', url: 'https://example.com/light-dumbbells' },
];

// Planned paid features. Not implemented — the app is fully free today. Real
// purchases require Apple/Google in-app purchase or a payment processor plus the
// developer's store/business accounts (out of scope here).
export const PREMIUM_FEATURES: string[] = [
  'Custom saved routines with reminders',
  'Personalized recovery plans',
  'Advanced animations and variations',
  'A version for gyms, trainers, and clinics',
];
