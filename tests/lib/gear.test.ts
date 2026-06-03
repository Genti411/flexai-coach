import { GEAR, PREMIUM_FEATURES } from '@/lib/gear';

describe('gear data', () => {
  it('has the five accessory categories with required fields and valid urls', () => {
    expect(GEAR).toHaveLength(5);
    for (const g of GEAR) {
      expect(g.id).toBeTruthy();
      expect(g.name).toBeTruthy();
      expect(g.blurb).toBeTruthy();
      expect(g.url).toMatch(/^https?:\/\//);
    }
  });

  it('lists planned premium features', () => {
    expect(PREMIUM_FEATURES.length).toBeGreaterThan(0);
  });
});
