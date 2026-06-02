import { JOINTS, lerpPose, NEUTRAL, pose, SKELETON } from '@/animation/poses';

describe('poses', () => {
  it('NEUTRAL has every joint with numeric coords', () => {
    for (const j of JOINTS) {
      expect(typeof NEUTRAL[j].x).toBe('number');
      expect(typeof NEUTRAL[j].y).toBe('number');
    }
  });

  it('pose() merges overrides onto NEUTRAL', () => {
    const p = pose({ head: { x: 10, y: 20 } });
    expect(p.head).toEqual({ x: 10, y: 20 });
    expect(p.hip).toEqual(NEUTRAL.hip); // untouched
  });

  it('SKELETON only references known joints', () => {
    for (const [a, b] of SKELETON) {
      expect(JOINTS).toContain(a);
      expect(JOINTS).toContain(b);
    }
  });

  it('lerpPose at t=0 equals a, t=1 equals b, t=0.5 is the midpoint', () => {
    const a = NEUTRAL;
    const b = pose({ head: { x: 0, y: 0 } });
    expect(lerpPose(a, b, 0).head).toEqual(a.head);
    expect(lerpPose(a, b, 1).head).toEqual(b.head);
    expect(lerpPose(a, b, 0.5).head).toEqual({ x: a.head.x / 2, y: a.head.y / 2 });
  });
});
