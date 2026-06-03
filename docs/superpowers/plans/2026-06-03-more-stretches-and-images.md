# More Stretches + Image Pipeline Implementation Plan

> REQUIRED SUB-SKILL: superpowers:subagent-driven-development or executing-plans. Checkbox steps.

**Goal:** Add more stretch variety (4 new body areas + extra stretches) and an image pipeline so AI-generated illustrations show on cards (the animation stays as the fallback). Then regenerate the prompt sheet to cover everything.

**Tech Stack:** Expo SDK 56, TypeScript, expo-image (already a dep), react-native-svg, Jest. `@/` -> `src/`.

---

## Task 1: Expand the stretch dataset

**Files:** Modify `src/core/dataset.ts`, `src/core/matcher.ts`; tests stay green via the existing coverage test.

- [ ] **Step 1:** Add these 14 stretches. Author each as a full `Recommendation` object following the EXACT shape/style of the existing items (3-4 short `instructions`, `target_muscles`, realistic `sets`/`reps`/`duration`, `equipment`, `weighted: false`, a sensible `difficulty`, `safety_notes` that always include "Stop if you feel sharp pain, numbness, tingling, or dizziness.", a `media_prompt`, and the given `animationId`). Add new area keys to `STRETCH_DATASET` and entries to `AREA_SUMMARY`.

New areas + summaries (add to `AREA_SUMMARY`):
- `hips`: "These moves may help open tight hips and glutes."
- `wrists`: "These gentle stretches may help with wrist and forearm tightness."
- `upper back`: "These moves may help with mid-back and upper-back tightness."
- `ankles`: "These gentle moves may help with ankle mobility."

Stretches (area | name | animationId | equipment | motion to describe in instructions + media_prompt):
- hips | Figure-Four Glute Stretch | kneeToChest | none | lying on back, one ankle crossed over the opposite bent knee, hands pulling the supporting thigh toward the chest
- hips | Standing Hip Flexor Lunge | calfLunge | none | half-kneeling lunge, gently tucking the pelvis to feel a stretch at the front of the back hip
- hips | Seated Figure-Four | seatedTwist | chair | seated tall, one ankle resting on the opposite knee, hinging gently forward from the hips
- wrists | Wrist Flexor Stretch | crossBodyArm | none | one arm extended forward palm up, the other hand gently drawing the fingers down and back
- wrists | Wrist Extensor Stretch | crossBodyArm | none | one arm extended forward palm down, the other hand gently drawing the hand downward
- wrists | Prayer Stretch | chestOpen | none | palms pressed together at chest height, slowly lowering the hands while keeping the palms together
- upper back | Thread the Needle | seatedTwist | yoga mat | on hands and knees, threading one arm underneath the body and rotating the upper back, then returning
- upper back | Seated Thoracic Extension | catCow | chair | seated, hands behind the head, gently arching the upper back over the chair back
- upper back | Wall Angels | chestOpen | wall | standing with the back against a wall, sliding the arms up and down like a snow angel
- ankles | Ankle Circles | heelDrop | none | seated with one foot lifted, slowly circling the ankle in both directions
- ankles | Seated Ankle Dorsiflexion | heelDrop | none | seated, gently pulling the toes and foot up toward the shin
- ankles | Standing Ankle Rocks | calfLunge | none | standing, slowly rocking the body weight forward over the toes and back
- neck | Neck Rotation | neckTurnDown | none | sitting tall, slowly turning the head to look over one shoulder, then the other
- shoulders | Overhead Triceps Stretch | shoulderRoll | none | one arm reaching overhead and bent at the elbow, the other hand gently pressing the elbow

(Add `Neck Rotation` to the existing `neck` array and `Overhead Triceps Stretch` to the existing `shoulders` array. Create new `hips`, `wrists`, `upper back`, `ankles` arrays.)

- [ ] **Step 2:** In `src/core/matcher.ts`, add keyword entries to `BODY_AREA_KEYWORDS` so chat finds the new areas. Add these BEFORE the `post-workout` entry:

```ts
  ['hips', ['hip', 'hips', 'glute', 'glutes', 'piriformis']],
  ['wrists', ['wrist', 'wrists', 'forearm', 'forearms']],
  ['upper back', ['upper back', 'mid back', 'mid-back', 'between my shoulder blades', 'thoracic', 'rhomboid']],
  ['ankles', ['ankle', 'ankles']],
```

- [ ] **Step 3:** Run `npm test -- "tracks|dataset|matcher"` (the dataset coverage test must still pass: every `animationId` resolves; every item has one). `npx tsc --noEmit` clean.
- [ ] **Step 4: Commit** — `git add src/core/dataset.ts src/core/matcher.ts && git commit -m "feat(content): add hips, wrists, upper-back, ankle areas + more stretches"`

---

## Task 2: Body-map hotspots for the new areas

**Files:** Modify `src/app/body-map.tsx`

- [ ] **Step 1:** Add four entries to the `AREAS` array:

```ts
  { area: 'upper back', label: 'Upper back', top: '23%', left: '30%' },
  { area: 'hips', label: 'Hips', top: '46%', left: '30%' },
  { area: 'wrists', label: 'Wrists', top: '52%', left: '80%' },
  { area: 'ankles', label: 'Ankles', top: '92%', left: '38%' },
```

- [ ] **Step 2:** Verify `npm test -- body-map` still passes (existing tests unaffected) and `npx tsc --noEmit` clean.
- [ ] **Step 3: Commit** — `git add src/app/body-map.tsx && git commit -m "feat(bodymap): add hotspots for new areas"`

---

## Task 3: Image pipeline (show generated PNGs, animation as fallback)

**Files:** Create `assets/stretches/.gitkeep`, `scripts/gen-stretch-images.js`, `src/lib/stretch-images.ts`, `src/lib/stretch-images.generated.ts`, modify `src/components/stretch-card.tsx`, Test `tests/lib/stretch-images.test.ts`

React Native bundles assets via static `require()`, so a require to a missing file breaks the build. The generated registry only lists files that actually exist; it starts empty and is regenerated when the user adds PNGs.

- [ ] **Step 1:** Create `assets/stretches/.gitkeep` (empty file) so the directory exists.

- [ ] **Step 2:** Create `src/lib/stretch-images.generated.ts` (initially empty map - valid build with zero images):

```ts
// AUTO-GENERATED by scripts/gen-stretch-images.js. Do not edit by hand.
// Maps an image basename (slug, no extension) to its bundled require().
import type { ImageSourcePropType } from 'react-native';

export const STRETCH_IMAGES: Record<string, ImageSourcePropType> = {};
```

- [ ] **Step 3:** Create `src/lib/stretch-images.ts`:

```ts
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
```

- [ ] **Step 4:** Create `scripts/gen-stretch-images.js`:

```js
// Scans assets/stretches/*.png and writes src/lib/stretch-images.generated.ts with a
// require() for each present file, keyed by basename (slug). Run after adding images:
//   node scripts/gen-stretch-images.js
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'assets', 'stretches');
const out = path.join(__dirname, '..', 'src', 'lib', 'stretch-images.generated.ts');
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.png$/i.test(f)) : [];

const lines = files.map((f) => {
  const slug = path.basename(f, path.extname(f));
  return `  '${slug}': require('../../assets/stretches/${f}'),`;
});

const body = `// AUTO-GENERATED by scripts/gen-stretch-images.js. Do not edit by hand.
// Maps an image basename (slug, no extension) to its bundled require().
import type { ImageSourcePropType } from 'react-native';

export const STRETCH_IMAGES: Record<string, ImageSourcePropType> = {
${lines.join('\n')}
};
`;
fs.writeFileSync(out, body);
console.log(`Wrote ${files.length} image(s) to ${path.relative(process.cwd(), out)}`);
```

- [ ] **Step 5: Failing test** — `tests/lib/stretch-images.test.ts`:

```ts
import { imageForStretch, slugify } from '@/lib/stretch-images';

describe('stretch images', () => {
  it('slugify makes a stable filename slug', () => {
    expect(slugify('Chin Tucks')).toBe('chin-tucks');
    expect(slugify("Child's Pose")).toBe('childs-pose');
    expect(slugify('Standing Calf Stretch Against Wall')).toBe('standing-calf-stretch-against-wall');
  });
  it('returns undefined when no image is registered (default build)', () => {
    expect(imageForStretch('Chin Tucks')).toBeUndefined();
  });
});
```

- [ ] **Step 6: Run red** — `npm test -- stretch-images` → FAIL.

- [ ] **Step 7:** (files from steps 2-4 already implement it) Run green — `npm test -- stretch-images` → PASS.

- [ ] **Step 8:** Modify `src/components/stretch-card.tsx` to show the image when present. Add the import:

```tsx
import { Image } from 'expo-image';
import { imageForStretch } from '@/lib/stretch-images';
```

Inside the component, after `const hasAnimation = ...`:

```tsx
  const image = imageForStretch(rec.name);
```

Replace the animation block:

```tsx
      {showAnimation && hasAnimation && (
        <View style={styles.animation}><StretchAnimation animationId={rec.animationId} /></View>
      )}
```

with (image shown by default; animation available via the toggle):

```tsx
      {image && !showAnimation && (
        <Image source={image} style={styles.image} contentFit="contain" />
      )}
      {showAnimation && hasAnimation && (
        <View style={styles.animation}><StretchAnimation animationId={rec.animationId} /></View>
      )}
```

And add to the StyleSheet:

```tsx
  image: { width: '100%', height: 180, marginTop: Spacing.two, borderRadius: 12 },
```

(The "Show animation" toggle already exists when `hasAnimation`; it now toggles between the image and the animation. No behaviour change when there is no image.)

- [ ] **Step 9:** Run `npm test -- stretch-card` and `npm test -- message-bubble` → PASS (no image registered in tests, so the image branch is inert). `npx tsc --noEmit` clean.

- [ ] **Step 10: Commit** — `git add assets/stretches scripts/gen-stretch-images.js src/lib/stretch-images.ts src/lib/stretch-images.generated.ts src/components/stretch-card.tsx tests/lib/stretch-images.test.ts && git commit -m "feat(images): show per-stretch illustration when present, animation as fallback"`

---

## Task 4: Regenerate the prompt sheet for the full set

**Files:** Overwrite `docs/image-prompts.md`

- [ ] **Step 1:** Rewrite `docs/image-prompts.md` so it lists EVERY stretch now in `src/core/dataset.ts` (the original 25 + the 14 new). For each unique stretch (dedupe Child's Pose), the entry must use:
  - filename: `assets/stretches/<slugify(name)>.png` (the SAME slug as `src/lib/stretch-images.ts` produces).
  - prompt: the existing STYLE PREFIX + a one-line pose description (reuse the per-stretch motion lines; for the 14 new ones use the motion text from Task 1).
- Keep the existing header (how-to, consistency tips, copyright rules, STYLE PREFIX). Just expand the prompt list and fix any filenames to match `slugify`.

- [ ] **Step 2: Commit** — `git add docs/image-prompts.md && git commit -m "docs: expand image prompt sheet to the full stretch set"`

---

## Task 5: Full verification

- [ ] `npx tsc --noEmit` → clean.
- [ ] `npm test` → all suites pass (prior 113 + stretch-images; dataset coverage covers the new stretches).
- [ ] `npx expo export --platform web` → bundles (empty image registry is fine).

---

## Self-Review Notes

- **Coverage:** new areas + stretches with resolving animationIds (T1), chat keywords (T1), body-map hotspots (T2), image-or-animation card with generated registry + slug convention + generator (T3), prompt sheet synced to dataset + slug (T4).
- **Static-require safety:** `stretch-images.generated.ts` only requires files that exist; ships empty so the build works with zero images; user runs `node scripts/gen-stretch-images.js` after adding PNGs.
- **No breakage:** with no images, cards behave exactly as before (animation only). `slugify` is the single shared naming convention (app + generator + sheet).
- **Out of scope:** authoring the images themselves (user generates via the sheet), per-image multi-panel layouts, motion arrows in-app.
```
