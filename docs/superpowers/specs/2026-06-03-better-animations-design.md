# FlexAI Coach - Better Animations Slice

Date: 2026-06-03
Status: Approved (autonomous build) - implemented
Slice: 9 (refinement of the exercise-animation slice)

## Goal

Make the stretch animations read as a fuller, friendlier figure instead of a sparse
single-limb stick figure, while keeping the same pose/track data and free/offline
rendering.

## Changes

- New `src/animation/rig-parts.ts` holds the shared draw structure (near bones, far
  bones, torso bars, stroke/offset constants) so the static and animated renderers
  draw the same body.
- `figure-rig.tsx` and `stretch-animation.tsx` now render: a ground shadow ellipse,
  a muted offset "far" arm and leg for depth, short shoulder/hip bars for torso
  width, thicker rounded limbs, and a filled accent-coloured head. Colours come from
  the theme (`text`, `textSecondary`, `accent`).
- No change to `poses.ts` or `tracks.ts` (motion data is unchanged); `SKELETON`
  remains for its test, and the renderers use `NEAR_BONES` (same segments).

## Verification

tsc clean; 104 tests pass; web bundle builds; visually confirmed the richer figure
in the running app (filled head, thicker limbs, shadow, depth).

## Out of scope

Per-stretch bespoke artwork, multi-keyframe motion, a front-view rig, 3D.
