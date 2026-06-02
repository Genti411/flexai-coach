# Exercise Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show an owned, looping schematic animation for each curated stretch, inline on the stretch card, free and offline.

**Architecture:** A pure geometry layer (`src/animation/poses.ts`, `tracks.ts`) defines a stick-figure skeleton as named joint coordinates and a registry of two-keyframe motion "tracks" (relaxed pose A ↔ stretched pose B). A static SVG renderer (`figure-rig.tsx`) draws one pose; an animated wrapper (`stretch-animation.tsx`) interpolates A↔B with react-native-reanimated on the UI thread and loops, honoring OS reduce-motion. Each dataset stretch carries an optional `animationId` mapping it to a track.

**Tech Stack:** Expo SDK 56, TypeScript, react-native-svg (new), react-native-reanimated (already present), Jest.

**Reference:** geometry is a side-view figure in a `0 0 100 120` viewBox, y increasing downward.

---

## File Structure

```
src/animation/
  poses.ts             # Joint, Pose, NEUTRAL, SKELETON, pose(), lerpPose() — pure, no RN
  tracks.ts            # Track, TRACKS registry, getTrack() — pure, no RN
  figure-rig.tsx       # FigureRig: renders one static Pose as SVG
  stretch-animation.tsx# StretchAnimation: animated loop A↔B + reduce-motion
src/core/types.ts      # + optional animationId on Recommendation
src/core/dataset.ts    # + animationId on every item
src/components/stretch-card.tsx  # enable + inline toggle of the animation
tests/animation/poses.test.ts
tests/animation/tracks.test.ts
tests/animation/figure-rig.test.tsx
tests/animation/stretch-animation.test.tsx
tests/components/stretch-card.test.tsx  # (exists; extend)
```

---

## Task 1: Install react-native-svg and wire jest for svg + reanimated

**Files:**
- Modify: `package.json` (via expo install), `jest.config.js`, `jest.setup.ws.js`

- [ ] **Step 1: Install the SDK-matched react-native-svg**

Run: `npx expo install react-native-svg`
Expected: adds `react-native-svg` to `package.json` dependencies at the SDK-56-compatible version, installs without error. Do NOT hardcode a version.

- [ ] **Step 2: Add reanimated + svg to jest transform allowlist and mock reanimated**

Edit `jest.config.js` — replace the `transformIgnorePatterns` array entry so these libs are transformed, and keep the existing `.css` mapper:

```js
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.ws.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|react-native-url-polyfill|react-native-svg|react-native-reanimated|react-native-worklets))',
  ],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/jest.mock.css.js',
  },
};
```

- [ ] **Step 3: Mock reanimated in the jest setup**

Append to `jest.setup.ws.js`:

```js
// Reanimated ships a Jest mock so animated components render without the native runtime.
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
```

- [ ] **Step 4: Verify the toolchain still boots**

Run: `npx tsc --noEmit`
Expected: no errors.
Run: `npm test`
Expected: existing 61 tests still pass.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json jest.config.js jest.setup.ws.js
git commit -m "chore(anim): add react-native-svg and wire jest for svg/reanimated"
```

---

## Task 2: Pose geometry (pure)

**Files:**
- Create: `src/animation/poses.ts`
- Test: `tests/animation/poses.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run it red**

Run: `npm test -- poses`
Expected: FAIL (`Cannot find module '@/animation/poses'`).

- [ ] **Step 3: Implement**

```ts
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
```

- [ ] **Step 4: Run it green**

Run: `npm test -- poses`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/animation/poses.ts tests/animation/poses.test.ts
git commit -m "feat(anim): add pose geometry and skeleton"
```

---

## Task 3: Motion track registry (pure)

**Files:**
- Create: `src/animation/tracks.ts`
- Test: `tests/animation/tracks.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run it red**

Run: `npm test -- tracks`
Expected: FAIL (`Cannot find module '@/animation/tracks'`).

- [ ] **Step 3: Implement (author all 14 tracks)**

Coordinates are an initial pass — they are validated for structure by tests and **visually tuned** in Task 8. `a` is usually `NEUTRAL`; `b` is the stretched pose.

```ts
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
```

- [ ] **Step 4: Run it green**

Run: `npm test -- tracks`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/animation/tracks.ts tests/animation/tracks.test.ts
git commit -m "feat(anim): add motion track registry"
```

---

## Task 4: Wire animationId into types and dataset

**Files:**
- Modify: `src/core/types.ts`, `src/core/dataset.ts`
- Test: `tests/animation/tracks.test.ts` (add a coverage block)

- [ ] **Step 1: Add the coverage test (failing)**

Append this `describe` block to `tests/animation/tracks.test.ts`:

```ts
import { STRETCH_DATASET } from '@/core/dataset';
import { getTrack as resolve } from '@/animation/tracks';

describe('dataset animation coverage', () => {
  it('every curated stretch has an animationId that resolves to a track', () => {
    for (const recs of Object.values(STRETCH_DATASET)) {
      for (const r of recs) {
        expect(r.animationId).toBeTruthy();
        expect(resolve(r.animationId)).not.toBeNull();
      }
    }
  });
});
```

- [ ] **Step 2: Run it red**

Run: `npm test -- tracks`
Expected: FAIL (`r.animationId` is undefined / type error or null resolve).

- [ ] **Step 3: Add the optional field to the type**

In `src/core/types.ts`, add `animationId?: string;` to the `Recommendation` interface (place it after `media_prompt`):

```ts
  media_prompt: string;
  animationId?: string;
```

- [ ] **Step 4: Assign an animationId to every dataset item**

In `src/core/dataset.ts`, add an `animationId` field to each recommendation object using this exact mapping (by `name`):

```
Chin Tucks                          -> 'chinTuck'
Upper Trap Stretch                  -> 'neckTiltSide'
Levator Scapulae Stretch            -> 'neckTurnDown'
Doorway Chest Stretch               -> 'chestOpen'
Floor Angels                        -> 'chestOpen'
Light Dumbbell Chest Opener         -> 'chestOpen'
Cat-Cow                             -> 'catCow'
Child's Pose                        -> 'childsPose'   (both the lower-back and post-workout entries)
Knee-to-Chest Stretch               -> 'kneeToChest'
Seated Spinal Twist                 -> 'seatedTwist'
Standing Calf Stretch Against Wall  -> 'calfLunge'
Seated Towel Calf Stretch           -> 'hamstringReach'
Downward-Dog Calf Pedal             -> 'calfLunge'
Step Heel Drop                      -> 'heelDrop'
Cross-Body Shoulder Stretch         -> 'crossBodyArm'
Shoulder Rolls                      -> 'shoulderRoll'
Doorway Shoulder Opener             -> 'chestOpen'
Light Dumbbell External Rotation    -> 'crossBodyArm'
Standing Hamstring Stretch          -> 'hamstringReach'
Supine Hamstring Stretch with Towel -> 'hamstringReach'
Seated Forward Fold                 -> 'hamstringReach'
Standing Quad Stretch               -> 'quadStretch'
World's Greatest Stretch            -> 'calfLunge'
Pigeon Pose Hip Opener              -> 'childsPose'
```

Example (the first item becomes):

```ts
    {
      name: 'Chin Tucks',
      type: 'mobility',
      // ...existing fields unchanged...
      media_prompt: 'Clean fitness animation of a person sitting upright performing chin tucks, side view, neutral background, no logos.',
      animationId: 'chinTuck',
    },
```

- [ ] **Step 5: Run it green + full suite**

Run: `npm test -- tracks`
Expected: PASS (coverage test green).
Run: `npx tsc --noEmit`
Expected: no errors.
Run: `npm test`
Expected: all pass (validate.test.ts still green — `animationId` is optional and `validateResponse` ignores unknown/extra fields, so LLM payloads without it still validate).

- [ ] **Step 6: Commit**

```bash
git add src/core/types.ts src/core/dataset.ts tests/animation/tracks.test.ts
git commit -m "feat(anim): map every curated stretch to a motion track"
```

---

## Task 5: Static figure renderer

**Files:**
- Create: `src/animation/figure-rig.tsx`
- Test: `tests/animation/figure-rig.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from '@testing-library/react-native';

import { FigureRig } from '@/animation/figure-rig';
import { NEUTRAL } from '@/animation/poses';

describe('FigureRig', () => {
  it('renders an svg for a pose without throwing', () => {
    const { UNSAFE_root } = render(<FigureRig pose={NEUTRAL} color="#000" />);
    expect(UNSAFE_root).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run it red**

Run: `npm test -- figure-rig`
Expected: FAIL (`Cannot find module '@/animation/figure-rig'`).

- [ ] **Step 3: Implement**

```tsx
import Svg, { Circle, Line } from 'react-native-svg';

import { Pose, SKELETON } from '@/animation/poses';

export function FigureRig({ pose, color, size = 140 }: { pose: Pose; color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 120">
      {SKELETON.map(([from, to], i) => (
        <Line
          key={i}
          x1={pose[from].x}
          y1={pose[from].y}
          x2={pose[to].x}
          y2={pose[to].y}
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
        />
      ))}
      <Circle cx={pose.head.x} cy={pose.head.y} r={8} stroke={color} strokeWidth={3} fill="none" />
    </Svg>
  );
}
```

- [ ] **Step 4: Run it green**

Run: `npm test -- figure-rig`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/animation/figure-rig.tsx tests/animation/figure-rig.test.tsx
git commit -m "feat(anim): add static SVG figure renderer"
```

---

## Task 6: Animated stretch component

**Files:**
- Create: `src/animation/stretch-animation.tsx`
- Test: `tests/animation/stretch-animation.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from '@testing-library/react-native';

import { StretchAnimation } from '@/animation/stretch-animation';

describe('StretchAnimation', () => {
  it('renders for a known animationId without throwing', () => {
    const { UNSAFE_root } = render(<StretchAnimation animationId="chinTuck" />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders nothing for an unknown id', () => {
    const { toJSON } = render(<StretchAnimation animationId="nope" />);
    expect(toJSON()).toBeNull();
  });
});
```

- [ ] **Step 2: Run it red**

Run: `npm test -- stretch-animation`
Expected: FAIL (`Cannot find module '@/animation/stretch-animation'`).

- [ ] **Step 3: Implement**

Note: each animated bone is its own component so `useAnimatedProps` is a top-level hook (Rules of Hooks). Under the jest reanimated mock, these hooks are no-ops and the component renders without the native runtime.

```tsx
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';

import { FigureRig } from '@/animation/figure-rig';
import { getTrack } from '@/animation/tracks';
import { Joint, lerpPose, Pose, SKELETON } from '@/animation/poses';
import { useTheme } from '@/hooks/use-theme';

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function Bone({ from, to, a, b, progress, color }: { from: Joint; to: Joint; a: Pose; b: Pose; progress: SharedValue<number>; color: string }) {
  const animatedProps = useAnimatedProps(() => ({
    x1: interpolate(progress.value, [0, 1], [a[from].x, b[from].x]),
    y1: interpolate(progress.value, [0, 1], [a[from].y, b[from].y]),
    x2: interpolate(progress.value, [0, 1], [a[to].x, b[to].x]),
    y2: interpolate(progress.value, [0, 1], [a[to].y, b[to].y]),
  }));
  return <AnimatedLine animatedProps={animatedProps} stroke={color} strokeWidth={3} strokeLinecap="round" />;
}

function Head({ a, b, progress, color }: { a: Pose; b: Pose; progress: SharedValue<number>; color: string }) {
  const animatedProps = useAnimatedProps(() => ({
    cx: interpolate(progress.value, [0, 1], [a.head.x, b.head.x]),
    cy: interpolate(progress.value, [0, 1], [a.head.y, b.head.y]),
  }));
  return <AnimatedCircle animatedProps={animatedProps} r={8} stroke={color} strokeWidth={3} fill="none" />;
}

export function StretchAnimation({ animationId, size = 140 }: { animationId?: string; size?: number }) {
  const theme = useTheme();
  const track = getTrack(animationId);
  const progress = useSharedValue(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => active && setReduceMotion(v));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!track || reduceMotion) return;
    progress.value = 0;
    progress.value = withRepeat(withTiming(1, { duration: track.durationMs }), -1, true);
  }, [track, reduceMotion, progress]);

  if (!track) return null;

  if (reduceMotion) {
    return <FigureRig pose={lerpPose(track.a, track.b, 0.5)} color={theme.text} size={size} />;
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 100 120">
      {SKELETON.map(([from, to], i) => (
        <Bone key={i} from={from} to={to} a={track.a} b={track.b} progress={progress} color={theme.text} />
      ))}
      <Head a={track.a} b={track.b} progress={progress} color={theme.text} />
    </Svg>
  );
}
```

- [ ] **Step 4: Run it green**

Run: `npm test -- stretch-animation`
Expected: PASS (the reanimated mock makes the animated hooks no-ops; unknown id returns null).

- [ ] **Step 5: Commit**

```bash
git add src/animation/stretch-animation.tsx tests/animation/stretch-animation.test.tsx
git commit -m "feat(anim): add looping animated stretch figure with reduce-motion"
```

---

## Task 7: Enable and toggle the animation on the stretch card

**Files:**
- Modify: `src/components/stretch-card.tsx`
- Test: `tests/components/stretch-card.test.tsx`

- [ ] **Step 1: Extend the test (failing)**

Replace the contents of `tests/components/stretch-card.test.tsx` with:

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';

import { StretchCard } from '@/components/stretch-card';
import { Recommendation } from '@/core/types';

const base: Recommendation = {
  name: 'Chin Tucks',
  type: 'mobility',
  target_muscles: ['deep neck flexors'],
  instructions: ['Sit tall.', 'Pull your chin back.'],
  sets: 2,
  reps: 10,
  duration: '5 seconds each rep',
  equipment: 'none',
  weighted: false,
  difficulty: 'beginner',
  safety_notes: ['Stop if you feel sharp pain.'],
  media_prompt: 'p',
  animationId: 'chinTuck',
};

describe('StretchCard', () => {
  it('renders the name, instructions, and easier/harder controls', () => {
    render(<StretchCard rec={base} onEasier={() => {}} onHarder={() => {}} />);
    expect(screen.getByText('Chin Tucks')).toBeTruthy();
    expect(screen.getByText('Sit tall.')).toBeTruthy();
    expect(screen.getByText('Make easier')).toBeTruthy();
    expect(screen.getByText('Make harder')).toBeTruthy();
  });

  it('shows an enabled "Show animation" control when a valid animationId is present, and toggles it', () => {
    render(<StretchCard rec={base} onEasier={() => {}} onHarder={() => {}} />);
    const btn = screen.getByText('Show animation');
    expect(btn).toBeTruthy();
    fireEvent.press(btn); // expand
    expect(screen.getByText('Hide animation')).toBeTruthy();
  });

  it('hides the animation control when there is no animationId (e.g. LLM result)', () => {
    const noAnim: Recommendation = { ...base, animationId: undefined };
    render(<StretchCard rec={noAnim} onEasier={() => {}} onHarder={() => {}} />);
    expect(screen.queryByText('Show animation')).toBeNull();
  });
});
```

- [ ] **Step 2: Run it red**

Run: `npm test -- stretch-card`
Expected: FAIL (no toggle / button always present).

- [ ] **Step 3: Implement**

Replace the whole `src/components/stretch-card.tsx` with:

```tsx
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { StretchAnimation } from '@/animation/stretch-animation';
import { getTrack } from '@/animation/tracks';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Recommendation } from '@/core/types';

export function StretchCard({ rec, onEasier, onHarder }: { rec: Recommendation; onEasier: () => void; onHarder: () => void }) {
  const theme = useTheme();
  const hasAnimation = getTrack(rec.animationId) !== null;
  const [showAnimation, setShowAnimation] = useState(false);

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">{rec.name}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {rec.target_muscles.join(', ')} · {rec.difficulty}{rec.weighted ? ' · weights' : ''}
      </ThemedText>
      {rec.instructions.map((line, i) => (
        <ThemedText key={i} type="small" style={styles.step}>{i + 1}. <ThemedText type="small">{line}</ThemedText></ThemedText>
      ))}
      <ThemedText type="small" themeColor="textSecondary" style={styles.meta}>
        {rec.sets} sets · {rec.reps} reps · {rec.duration}
      </ThemedText>
      {rec.safety_notes.map((note, i) => (
        <ThemedText key={i} type="small" themeColor="warning">⚠ {note}</ThemedText>
      ))}

      {showAnimation && hasAnimation && (
        <View style={styles.animation}>
          <StretchAnimation animationId={rec.animationId} />
        </View>
      )}

      <View style={styles.actions}>
        {hasAnimation && (
          <Pressable onPress={() => setShowAnimation((v) => !v)} style={[styles.btn, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="small">{showAnimation ? 'Hide animation' : 'Show animation'}</ThemedText>
          </Pressable>
        )}
        <Pressable onPress={onEasier} style={[styles.btn, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="small">Make easier</ThemedText>
        </Pressable>
        <Pressable onPress={onHarder} style={[styles.btn, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="small">Make harder</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: Spacing.three, gap: Spacing.one, marginTop: Spacing.two },
  step: { marginTop: Spacing.half },
  meta: { marginTop: Spacing.one },
  animation: { alignItems: 'center', marginTop: Spacing.two },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },
  btn: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999 },
});
```

- [ ] **Step 4: Run it green**

Run: `npm test -- stretch-card`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/stretch-card.tsx tests/components/stretch-card.test.tsx
git commit -m "feat(anim): show/hide inline stretch animation on the card"
```

---

## Task 8: Full verification and visual tuning

**Files:** none (verification only), optional `babel.config.js`

- [ ] **Step 1: Typecheck and full test suite**

Run: `npx tsc --noEmit`
Expected: no errors.
Run: `npm test`
Expected: all suites pass (prior 61 + new poses/tracks/figure-rig/stretch-animation + updated stretch-card).

- [ ] **Step 2: Confirm the bundle builds**

Run: `npx expo export --platform web`
Expected: bundles all routes with no errors. (If it errors complaining about reanimated worklets/babel, create `babel.config.js` with:

```js
module.exports = function (api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};
```

`babel-preset-expo` includes the reanimated/worklets plugin. Re-run the export.)

- [ ] **Step 3: Visual smoke test and tune**

Run: `npm run web`
- Accept consent, tap a chip (e.g. "Neck tension"), tap **Show animation** on a card — the figure should loop the motion (head tilting, etc.). Toggle hides it.
- Tap through one stretch per body area (neck, lower back, calf, shoulders, hamstrings, chest, post-workout) and confirm each animation is recognizable for its motion.
- If any pose looks wrong, adjust that track's `b` coordinates in `src/animation/tracks.ts` (the structure tests still guard it). Keep edits to coordinates only.
- Enable OS "reduce motion" and confirm the figure shows a static mid-pose instead of looping.

- [ ] **Step 4: Commit any tuning**

```bash
git add src/animation/tracks.ts
git commit -m "fix(anim): tune track poses from visual review"
```

---

## Self-Review Notes (for the implementer)

- **Spec coverage:** rendering via reanimated+SVG (Tasks 5–6), figure rig (Task 5), tracks library + getTrack (Task 3), optional animationId on Recommendation + dataset mapping + backward-compatible validation (Task 4), inline "Show animation" toggle enabled only for known ids (Task 7), reduce-motion static pose (Task 6), full dataset coverage via shared tracks (Task 4 coverage test), react-native-svg via expo install (Task 1).
- **Out of scope (do NOT add):** Exercise Detail screen, timer, video/3D, bespoke per-stretch art, animating LLM-returned stretches.
- **Type consistency:** `Pose`, `Joint`, `SKELETON`, `lerpPose`, `pose`, `NEUTRAL` (poses.ts); `Track`, `TRACKS`, `TRACK_IDS`, `getTrack` (tracks.ts); `Recommendation.animationId?: string` (types.ts) — all referenced consistently across tasks.
- **Free/offline:** all geometry is local code; no network, no media files. App still works without a Gemini key; LLM stretches simply show no animation button.
- **Risk flagged:** reanimated needs its jest mock (Task 1 Step 3) and may need `babel.config.js` for the web bundle (Task 8 Step 2). Pose coordinates are a first pass; Task 8 Step 3 tunes them visually.
```
