# FlexAI Coach - Body Map Slice

Date: 2026-06-02
Status: Approved (autonomous build)
Slice: 5

## Goal

A screen where the user taps a body area on a simple figure and immediately sees
recommended stretches for that area. Free, offline, reuses the existing engine.

## Design decisions (autonomous)

- New screen `src/app/body-map.tsx`, reached from a "Body" header link.
- A relative container holds a decorative SVG front-view silhouette plus six
  absolutely-positioned tappable hotspot buttons (labelled) at body positions for
  the six anatomical areas: **neck, shoulders, chest, lower back, hamstrings, calf**
  (the dataset's `post-workout` is not a body part, so it is excluded here).
- Tapping a hotspot calls the pure `buildResponse(area, { wantsWeights:false,
  difficulty:'beginner', riskLevel:'low' })` from `src/core/dataset.ts` and renders
  the summary + non-interactive `StretchCard`s (animation only) below the figure.
  No LLM, no network.
- Cards here are non-interactive (no easier/harder, no save) to keep the slice
  contained; users get the full interactive experience (save, adjust) via chat.

## Out of scope

Editing the figure, wrist/hip/other areas not in the dataset, saving from this
screen, weighted toggle (that is a separate slice).

## Components / files

- `src/app/body-map.tsx` - the screen (figure + hotspots + results).
- `src/app/index.tsx` - add the "Body" header link.

## Data flow

tap hotspot -> `setArea(area)` -> `buildResponse(area, opts)` -> render summary +
cards.

## Testing

- renders all six area labels.
- tapping "Neck" shows a known neck stretch ("Chin Tucks"); tapping "Calf" shows a
  calf stretch.
- bundles cleanly (`/body-map` route).

## Privacy

No input stored or transmitted; tapping an area is a local lookup.
