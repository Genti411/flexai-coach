import { imageForStretch, slugify } from '@/lib/stretch-images';

describe('stretch images', () => {
  it('slugify makes a stable filename slug', () => {
    expect(slugify('Chin Tucks')).toBe('chin-tucks');
    expect(slugify("Child's Pose")).toBe('childs-pose');
    expect(slugify('Standing Calf Stretch Against Wall')).toBe('standing-calf-stretch-against-wall');
  });
  it('returns undefined when no image is registered (default build)', () => {
    expect(imageForStretch('Chin Tucks')).toBeUndefined();
  });
});
