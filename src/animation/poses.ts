export const JOINTS = ['head', 'neck', 'shoulder', 'elbow', 'hand', 'hip', 'knee', 'ankle'] as const;
export type Joint = (typeof JOINTS)[number];
export type Point = { x: number; y: number };
export type Pose = Record<Joint, Point>;

// Side-view figure, facing right, viewBox 0 0 100 120 (y down). Standing neutral.
export const NEUTRAL: Pose = {
  head: { x: 47, y: 20 },
  neck: { x: 48, y: 34 },
  shoulder: { x: 48, y: 40 },
  elbow: { x: 54, y: 54 },
  hand: { x: 52, y: 68 },
  hip: { x: 48, y: 70 },
  knee: { x: 44, y: 92 },
  ankle: { x: 46, y: 114 },
};

// Bones to draw as line segments (head is drawn as a circle separately).
export const SKELETON: [Joint, Joint][] = [
  ['neck', 'hip'],
  ['shoulder', 'elbow'],
  ['elbow', 'hand'],
  ['hip', 'knee'],
  ['knee', 'ankle'],
];

export function pose(overrides: Partial<Pose>): Pose {
  return { ...NEUTRAL, ...overrides };
}

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const out = {} as Pose;
  for (const j of JOINTS) {
    out[j] = { x: a[j].x + (b[j].x - a[j].x) * t, y: a[j].y + (b[j].y - a[j].y) * t };
  }
  return out;
}
