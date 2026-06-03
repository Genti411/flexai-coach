# FlexAI Coach - Light Weights Mode Slice

Date: 2026-06-02
Status: Approved (autonomous build) - implemented
Slice: 6

## Goal

A "Light weights" toggle on the chat screen that surfaces the weighted/resistance
exercises already present in the dataset, without the user having to phrase the
request precisely.

## Design

- A toggle button above the input ("Light weights: on/off"), state in `src/app/index.tsx`.
- When on, `send()` builds the engine query as `advanced <text> with weights` (the
  weighted dataset items are authored at `advanced` difficulty, so the difficulty
  bump is required to surface them). The matcher then sets `wantsWeights`, and
  `buildResponse` includes weighted items.
- Safety is unchanged and authoritative: the engine still drops weighted items at
  medium/high risk (`buildResponse` allows weights only at low risk; `sanitize`
  strips them otherwise). So enabling the toggle never overrides a safety block.

## Out of scope

A separate weighted-only screen, per-exercise weight selection, equipment filters.

## Testing

`tests/app/home-weights.test.tsx`: with the toggle off, "Shoulder soreness" shows a
beginner shoulder stretch but NOT the weighted "Light Dumbbell External Rotation";
with the toggle on, the weighted item appears.
