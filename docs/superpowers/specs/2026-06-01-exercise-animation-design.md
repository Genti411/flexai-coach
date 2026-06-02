# FlexAI Coach - Exercise Animation Slice

Date: 2026-06-01
Status: Approved
Slice: 3 (builds on the chat-to-stretch MVP and launch-readiness slices)

## Goal

Each curated stretch shows an owned, looping schematic animation, inline on the
stretch card via the existing "Show animation" toggle. Free, offline,
copyright-clean, no new screen.

## Constraints (carried over)

- **Free to run**, offline-capable. No paid services, no runtime media downloads.
- **Copyright-clean.** All animation content is original to this app (no scraped,
  licensed-third-party, or AI-generated-in-someone-else's-style assets).
- **Stack parity.** Expo SDK 56, expo-router, TypeScript, Jest.

## Honest fidelity boundary

This slice delivers clean **schematic single-figure motion** - recognizable
("head tilts toward shoulder", "knee draws to chest"), not polished character
animation. High-fidelity/per-stretch bespoke art is a later designer/Lottie slice.

## Rendering approach

`react-native-reanimated` (already a dependency) drives an original SVG figure rig
(`react-native-svg`, installed via `npx expo install` so the version matches SDK
56). No Lottie runtime: the loop is reanimated keyframes over owned SVG shapes -
simpler to author, fully owned, works on web + native.

## Components (`src/animation/`)

- **`figure-rig.tsx`** - one reusable, original SVG figure (head, torso, upper
  arm/forearm, thigh/shin as positioned parts) parameterized by joint
  angles/offsets. Purely presentational; receives animated joint values, renders
  the figure. No animation logic inside.
- **`tracks.ts`** - a library of ~12-15 reusable motion *tracks*. Each track is a
  set of keyframes (joint params over time) + duration, designed to loop. Tracks
  are shared across similar stretches. Indicative set:
  `chinTuck`, `neckTiltSide`, `neckTurnDown`, `torsoHingeForward`, `seatedTwist`,
  `kneeToChest`, `childsPose`, `calfLunge`, `heelDrop`, `crossBodyArm`,
  `shoulderRoll`, `doorwayChest`, `quadStretch`, `hamstringReach`, `catCow`.
  Exposes `getTrack(id): Track | null`.
- **`stretch-animation.tsx`** - takes an `animationId`, resolves the track via
  `getTrack`, drives the rig with reanimated (`withRepeat`/`withTiming`), loops.
  Honors OS **reduce-motion** (`AccessibilityInfo.isReduceMotionEnabled`): when on,
  renders a single static mid-pose frame instead of looping.

## Data wiring

- Add **optional** `animationId?: string` to `Recommendation` (`src/core/types.ts`).
- Assign an `animationId` to every item in `src/core/dataset.ts`, mapping each
  stretch to the best-fit track (reuse across similar motions).
- `validateResponse` stays backward-compatible: `animationId` is optional, so
  LLM-returned stretches (which omit it) still validate and simply show no
  animation.

## UI change (`src/components/stretch-card.tsx`)

- The "Show animation" button is enabled only when `rec.animationId` resolves to a
  known track. Otherwise it stays hidden (current disabled placeholder is removed).
- Tapping toggles an inline `<StretchAnimation>` rendered below the step list
  (play/hide). State is local to the card.

## Data flow

card render -> `rec.animationId` present and resolves? -> show enabled "Show
animation" -> on tap, mount `<StretchAnimation animationId=...>` -> resolve track
-> reanimated loops the rig (or static pose under reduce-motion).

## Error handling / edge cases

- Unknown or missing `animationId` -> no animation button (graceful; covers LLM
  results and any unmapped item).
- Reduce-motion enabled -> static mid-pose, no looping.
- Web vs native: react-native-svg + reanimated both support web; verify the loop
  renders on `expo export` / web during implementation.

## Testing

- **`tracks.ts`**: `getTrack` returns a track for known ids and null for unknown;
  every track has well-formed keyframes (defined start/end, positive duration).
- **dataset coverage**: every `animationId` used in `dataset.ts` resolves to a real
  track (no dangling ids); every curated stretch has an `animationId`.
- **`StretchCard`**: with a valid `animationId`, "Show animation" is present and
  toggles the animation container; without one, the button is absent.
- **`stretch-animation.tsx`**: renders without throwing for a valid id; renders the
  static pose under a mocked reduce-motion = true. (Reanimated may require a jest
  mock/setup - flagged as an implementation risk to resolve in the plan.)

## Scope

- Full coverage of the curated dataset (~25-30 stretches) via the shared
  ~12-15-track library. One original figure style (clean line/silhouette).

## Out of scope (later slices)

- Lifelike / per-stretch bespoke character art, video, 3D.
- The Exercise Detail screen and timer.
- Animating LLM-returned (fallback) stretches.
- Generating raster image assets.

## Dependencies

- Add `react-native-svg` via `npx expo install react-native-svg` (SDK-matched
  version; do not hardcode).
- `react-native-reanimated` and `react-native-worklets` already present.
