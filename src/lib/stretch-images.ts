import type { ImageSourcePropType } from 'react-native';

import { STRETCH_IMAGES } from '@/lib/stretch-images.generated';

// Deterministic filename slug for a stretch name. Must match scripts/gen-stretch-images.js
// and the prompt sheet (docs/image-prompts.md).
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function imageForStretch(name: string): ImageSourcePropType | undefined {
  return STRETCH_IMAGES[slugify(name)];
}
