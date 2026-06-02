export const JOINTS = ['head', 'neck', 'shoulder', 'elbow', 'hand', 'hip', 'knee', 'ankle'] as const;
export type Joint = (typeof JOINTS)[number];
export type Point = { x: number; y: number };
export type Pose = Record<Joint, Point>;

// Side-view figure, facing right, viewBox 0 0 100 120 (y down). Standing neutral.
export const NEUTRAL: Pose = {
  head: { x: 50, y: 26 },
  neck: { x: 50, y: 40 },
  shoulder: { x: 50, y: 44 },
  elbow: { x: 50, y: 58 },
  hand: { x: 50, y: 72 },
  hip: { x: 50, y: 74 },
  knee: { x: 50, y: 96 },
  ankle: { x: 50, y: 118 },
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
