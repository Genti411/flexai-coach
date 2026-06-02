import { lerpPose } from '@/animation/poses';
import { getTrack, TRACK_IDS, TRACKS } from '@/animation/tracks';

describe('tracks', () => {
  it('getTrack returns a track for known ids and null otherwise', () => {
    expect(getTrack('chinTuck')).not.toBeNull();
    expect(getTrack('does-not-exist')).toBeNull();
  });

  it('every track has two full poses, a positive duration, and is non-trivial (a != b)', () => {
    for (const id of TRACK_IDS) {
      const tr = TRACKS[id];
      expect(tr.durationMs).toBeGreaterThan(0);
      // a and b must differ somewhere, else the "animation" would not move
      const mid = lerpPose(tr.a, tr.b, 0.5);
      const movedSomewhere = JSON.stringify(mid) !== JSON.stringify(tr.a);
      expect(movedSomewhere).toBe(true);
    }
  });
});
