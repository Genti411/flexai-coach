import { NEUTRAL, Pose, pose } from './poses';

export interface Track {
  a: Pose;
  b: Pose;
  durationMs: number;
}

export const TRACKS: Record<string, Track> = {
  // --- neck ---
  chinTuck: { a: NEUTRAL, b: pose({ head: { x: 46, y: 28 }, neck: { x: 49, y: 40 } }), durationMs: 1600 },
  neckTiltSide: { a: NEUTRAL, b: pose({ head: { x: 42, y: 28 }, neck: { x: 49, y: 40 } }), durationMs: 1800 },
  neckTurnDown: { a: NEUTRAL, b: pose({ head: { x: 47, y: 32 } }), durationMs: 1800 },
  // --- chest / shoulders open ---
  chestOpen: { a: NEUTRAL, b: pose({ shoulder: { x: 48, y: 44 }, elbow: { x: 40, y: 52 }, hand: { x: 34, y: 46 } }), durationMs: 2000 },
  crossBodyArm: { a: NEUTRAL, b: pose({ shoulder: { x: 50, y: 44 }, elbow: { x: 58, y: 50 }, hand: { x: 44, y: 52 } }), durationMs: 1800 },
  shoulderRoll: { a: NEUTRAL, b: pose({ shoulder: { x: 50, y: 40 }, elbow: { x: 54, y: 54 }, hand: { x: 50, y: 70 } }), durationMs: 1600 },
  // --- back ---
  catCow: { a: pose({ neck: { x: 40, y: 56 }, head: { x: 32, y: 52 }, shoulder: { x: 40, y: 58 }, hip: { x: 64, y: 64 } }),
           b: pose({ neck: { x: 40, y: 50 }, head: { x: 30, y: 44 }, shoulder: { x: 40, y: 52 }, hip: { x: 64, y: 70 } }), durationMs: 2400 },
  childsPose: { a: NEUTRAL, b: pose({ neck: { x: 66, y: 72 }, head: { x: 76, y: 70 }, shoulder: { x: 64, y: 72 }, elbow: { x: 78, y: 74 }, hand: { x: 90, y: 74 }, hip: { x: 50, y: 80 }, knee: { x: 60, y: 92 }, ankle: { x: 64, y: 100 } }), durationMs: 2400 },
  kneeToChest: { a: NEUTRAL, b: pose({ knee: { x: 44, y: 78 }, ankle: { x: 40, y: 92 } }), durationMs: 1800 },
  seatedTwist: { a: NEUTRAL, b: pose({ head: { x: 56, y: 27 }, shoulder: { x: 52, y: 44 }, elbow: { x: 60, y: 52 }, hand: { x: 58, y: 64 } }), durationMs: 2000 },
  // --- legs ---
  calfLunge: { a: NEUTRAL, b: pose({ hip: { x: 44, y: 74 }, knee: { x: 38, y: 94 }, ankle: { x: 30, y: 116 }, neck: { x: 46, y: 40 }, head: { x: 44, y: 26 } }), durationMs: 2200 },
  heelDrop: { a: NEUTRAL, b: pose({ hip: { x: 50, y: 78 }, knee: { x: 50, y: 100 }, ankle: { x: 50, y: 120 } }), durationMs: 1800 },
  hamstringReach: { a: NEUTRAL, b: pose({ neck: { x: 62, y: 52 }, head: { x: 72, y: 48 }, shoulder: { x: 62, y: 54 }, elbow: { x: 66, y: 66 }, hand: { x: 60, y: 86 }, hip: { x: 50, y: 74 } }), durationMs: 2200 },
  quadStretch: { a: NEUTRAL, b: pose({ knee: { x: 56, y: 92 }, ankle: { x: 60, y: 74 } }), durationMs: 2000 },
};

export type TrackId = keyof typeof TRACKS;
export const TRACK_IDS = Object.keys(TRACKS) as TrackId[];

export function getTrack(id: string | undefined | null): Track | null {
  if (id && id in TRACKS) return TRACKS[id];
  return null;
}
