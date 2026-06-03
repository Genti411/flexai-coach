// Shared structure for the figure renderers (static FigureRig and animated
// StretchAnimation), so both draw the same body from the same pose data.

import { Joint } from './poses';

export const STROKE = 5;
export const FAR_DX = 6; // x-offset for the far-side limb (adds depth)
export const BAR_HALF = 6; // half-width of the shoulder/hip bars (torso width)
export const HEAD_R = 7;

// Near-side bones, drawn in the main colour.
export const NEAR_BONES: [Joint, Joint][] = [
  ['neck', 'hip'], // spine
  ['shoulder', 'elbow'],
  ['elbow', 'hand'],
  ['hip', 'knee'],
  ['knee', 'ankle'],
];

// Far-side limbs, drawn offset and muted to suggest a three-dimensional body.
export const FAR_BONES: [Joint, Joint][] = [
  ['shoulder', 'elbow'],
  ['elbow', 'hand'],
  ['hip', 'knee'],
  ['knee', 'ankle'],
];

// Joints that get a short horizontal bar to suggest shoulder / hip width.
export const BARS: Joint[] = ['shoulder', 'hip'];
