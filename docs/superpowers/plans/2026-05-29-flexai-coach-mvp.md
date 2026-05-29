# FlexAI Coach MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a free-to-run, ChatGPT-style stretching assistant: a chat screen where a user describes muscle tension and gets safe stretch recommendations as cards, with deterministic on-device safety guardrails and a Gemini free-tier fallback.

**Architecture:** Three layers. (1) A pure-TypeScript core "engine" (`src/core/`) that classifies risk, matches body areas against a curated offline dataset, and orchestrates the decision flow. (2) A thin Gemini service used only as a fallback when local matching is unsure. (3) An expo-router UI with a single chat screen that renders text and stretch-card messages. Safety always runs first, on-device, before any network call.

**Tech Stack:** Expo SDK ~56, expo-router, React Native, TypeScript (strict), Jest + @testing-library/react-native. Mirrors the sibling `beauty-ai` app's conventions (`@/` alias, `ThemedText`/`ThemedView`, `Colors`/`Spacing`).

**Reference app:** `../beauty-ai` (same SDK, same conventions). Copy config from it where noted.

---

## File Structure

```
flexai-coach/
  app.json                      # Expo config (name/slug flexai-coach, no auth plugin)
  package.json                  # trimmed from beauty-ai (no supabase/apple-auth)
  tsconfig.json                 # @/* -> src/*
  jest.config.js                # single "unit" project
  jest.setup.ws.js              # noop setup (copied)
  css.d.ts                      # CSS ambient module decls (copied)
  .env.example                  # EXPO_PUBLIC_GEMINI_API_KEY=
  src/
    global.css                  # web font vars (copied)
    constants/theme.ts          # Colors (+ accent), Fonts, Spacing
    hooks/
      use-color-scheme.ts       # copied
      use-color-scheme.web.ts   # copied
      use-theme.ts              # copied
    components/
      themed-text.tsx           # copied
      themed-view.tsx           # copied
      stretch-card.tsx          # NEW: renders one Recommendation
      message-bubble.tsx        # NEW: renders one chat message (text or recs)
      prompt-chips.tsx          # NEW: suggested prompt chips
      disclaimer-banner.tsx     # NEW: persistent disclaimer + expander
    core/
      types.ts                  # StretchResponse, Recommendation, enums
      safety.ts                 # classifyRisk + highRiskResponse
      matcher.ts                # matchInput (body area, weights, difficulty)
      dataset.ts                # curated stretches + buildResponse
      validate.ts               # validateResponse (schema guard) + sanitize
      gemini.ts                 # LlmClient interface + geminiClient
      engine.ts                 # getStretchResponse orchestrator
    app/
      _layout.tsx               # Stack, headerShown:false
      index.tsx                 # chat screen
  tests/
    core/
      safety.test.ts
      matcher.test.ts
      dataset.test.ts
      validate.test.ts
      gemini.test.ts
      engine.test.ts
    components/
      stretch-card.test.tsx
      message-bubble.test.tsx
```

---

## Task 1: Scaffold the project from beauty-ai base config

**Files:**
- Create: `package.json`, `tsconfig.json`, `app.json`, `jest.config.js`, `jest.setup.ws.js`, `css.d.ts`, `.gitignore`, `.env.example`
- Create: `src/global.css`, `src/constants/theme.ts`, `src/hooks/use-color-scheme.ts`, `src/hooks/use-color-scheme.web.ts`, `src/hooks/use-theme.ts`, `src/components/themed-text.tsx`, `src/components/themed-view.tsx`
- Create: `src/app/_layout.tsx`, `src/app/index.tsx` (placeholder)

- [ ] **Step 1: Copy the verbatim infra files from beauty-ai**

Run (from `C:/Users/Genti/flexai-coach`):
```bash
cp ../beauty-ai/jest.setup.ws.js ./jest.setup.ws.js
cp ../beauty-ai/css.d.ts ./css.d.ts
cp ../beauty-ai/.gitignore ./.gitignore
mkdir -p src/constants src/hooks src/components src/core src/app tests/core tests/components
cp ../beauty-ai/src/global.css ./src/global.css
cp ../beauty-ai/src/constants/theme.ts ./src/constants/theme.ts
cp ../beauty-ai/src/hooks/use-color-scheme.ts ./src/hooks/use-color-scheme.ts
cp ../beauty-ai/src/hooks/use-color-scheme.web.ts ./src/hooks/use-color-scheme.web.ts
cp ../beauty-ai/src/hooks/use-theme.ts ./src/hooks/use-theme.ts
cp ../beauty-ai/src/components/themed-text.tsx ./src/components/themed-text.tsx
cp ../beauty-ai/src/components/themed-view.tsx ./src/components/themed-view.tsx
```

- [ ] **Step 2: Write `package.json`** (trimmed: drop supabase, apple-auth, async-storage mock)

```json
{
  "name": "flexai-coach",
  "main": "expo-router/entry",
  "version": "1.0.0",
  "dependencies": {
    "@expo/ui": "~56.0.13",
    "expo": "~56.0.4",
    "expo-constants": "~56.0.15",
    "expo-font": "~56.0.5",
    "expo-image": "~56.0.9",
    "expo-linking": "~56.0.11",
    "expo-router": "~56.2.6",
    "expo-splash-screen": "~56.0.10",
    "expo-status-bar": "~56.0.4",
    "expo-system-ui": "~56.0.5",
    "expo-web-browser": "~56.0.5",
    "jest-expo": "~56.0.4",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "react-native": "0.85.3",
    "react-native-gesture-handler": "~2.31.1",
    "react-native-reanimated": "4.3.1",
    "react-native-safe-area-context": "~5.7.0",
    "react-native-screens": "4.25.2",
    "react-native-web": "~0.21.0",
    "react-native-worklets": "0.8.3"
  },
  "devDependencies": {
    "@react-native/jest-preset": "^0.85.3",
    "@testing-library/react-native": "^13.3.3",
    "@types/jest": "^29.5.14",
    "@types/react": "~19.2.2",
    "jest": "^29.7.0",
    "typescript": "~6.0.3",
    "ws": "^8.21.0"
  },
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "lint": "expo lint",
    "test": "jest"
  },
  "private": true
}
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "types": ["jest", "node"],
    "paths": {
      "@/*": ["./src/*"],
      "@/assets/*": ["./assets/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

- [ ] **Step 4: Write `app.json`** (no apple-auth plugin, no custom icons)

```json
{
  "expo": {
    "name": "FlexAI Coach",
    "slug": "flexai-coach",
    "version": "1.0.0",
    "orientation": "portrait",
    "scheme": "flexaicoach",
    "userInterfaceStyle": "automatic",
    "web": { "output": "static" },
    "plugins": ["expo-router"],
    "experiments": { "typedRoutes": true, "reactCompiler": true }
  }
}
```

- [ ] **Step 5: Write `jest.config.js`** (single unit project, no supabase mapper)

```js
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.ws.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|react-native-url-polyfill))',
  ],
};
```

- [ ] **Step 6: Write `.env.example`**

```
# Optional. Without it, the app still works fully offline via the local dataset;
# only the "unsure input" LLM fallback is disabled.
EXPO_PUBLIC_GEMINI_API_KEY=
```

- [ ] **Step 7: Write `src/app/_layout.tsx`** (simple Stack, no auth)

```tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 8: Write `src/app/index.tsx`** (temporary placeholder, replaced in Task 9)

```tsx
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function Home() {
  return (
    <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ThemedText type="title">FlexAI Coach</ThemedText>
    </ThemedView>
  );
}
```

- [ ] **Step 9: Install dependencies**

Run: `npm install`
Expected: completes without errors; `node_modules` created.

- [ ] **Step 10: Verify typecheck and test runner boot**

Run: `npx tsc --noEmit`
Expected: no errors.
Run: `npm test -- --passWithNoTests`
Expected: Jest runs, 0 tests, exits 0.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: scaffold flexai-coach expo app from beauty-ai base"
```

---

## Task 2: Core types

**Files:**
- Create: `src/core/types.ts`

- [ ] **Step 1: Write the types**

```ts
export type RiskLevel = 'low' | 'medium' | 'high';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type ExerciseType = 'mobility' | 'stretch' | 'strength';

export interface Recommendation {
  name: string;
  type: ExerciseType;
  target_muscles: string[];
  instructions: string[];
  sets: number;
  reps: number;
  duration: string;
  equipment: string;
  weighted: boolean;
  difficulty: Difficulty;
  safety_notes: string[];
  media_prompt: string;
}

export interface StretchResponse {
  disclaimer: string;
  risk_level: RiskLevel;
  body_area: string;
  summary: string;
  seek_medical_help_if: string[];
  recommendations: Recommendation[];
}

export const DISCLAIMER =
  'FlexAI Coach provides general fitness, stretching, and wellness information. ' +
  'It does not diagnose, treat, or replace medical advice. Stop immediately if you feel ' +
  'sharp pain, numbness, tingling, dizziness, or worsening symptoms. For serious, persistent, ' +
  'or unexplained pain, consult a licensed healthcare professional.';

export const DIFFICULTY_RANK: Record<Difficulty, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/core/types.ts
git commit -m "feat(core): add shared StretchResponse types"
```

---

## Task 3: Safety classifier

**Files:**
- Create: `src/core/safety.ts`
- Test: `tests/core/safety.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { classifyRisk, highRiskResponse } from '@/core/safety';

describe('classifyRisk', () => {
  it.each([
    'I have sharp pain in my back',
    'my arm is numb',
    'numbness and tingling in my hand',
    'my leg is swollen and painful',
    "I can't move my shoulder",
    'I got injured in a fall',
    'I have chest pain',
    'shortness of breath after exercise',
    'sudden severe pain',
  ])('flags high risk: "%s"', (input) => {
    expect(classifyRisk(input).risk).toBe('high');
  });

  it.each([
    'my back pain keeps coming back',
    'my shoulder hurts when lifting',
    'persistent tightness for weeks',
  ])('flags medium risk: "%s"', (input) => {
    expect(classifyRisk(input).risk).toBe('medium');
  });

  it.each([
    'my neck is tight',
    'hamstrings are sore',
    'post workout recovery stretches',
  ])('flags low risk: "%s"', (input) => {
    expect(classifyRisk(input).risk).toBe('low');
  });

  it('builds a high-risk response with no recommendations', () => {
    const res = highRiskResponse();
    expect(res.risk_level).toBe('high');
    expect(res.recommendations).toHaveLength(0);
    expect(res.summary.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- safety`
Expected: FAIL (`Cannot find module '@/core/safety'`).

- [ ] **Step 3: Write the implementation**

```ts
import { DISCLAIMER, RiskLevel, StretchResponse } from './types';

const HIGH_RISK_KEYWORDS = [
  'sharp pain', 'numbness', 'numb', 'tingling', 'swelling', 'swollen',
  "can't move", 'cant move', 'cannot move', 'injury', 'injured', 'fall', 'fell',
  'accident', 'chest pain', 'shortness of breath', "can't breathe", 'cant breathe',
  'severe pain',
];

const MEDIUM_RISK_PATTERNS = [
  'keeps coming back', 'recurring', 'persistent', 'for weeks', 'for months',
  'hurts when lifting', 'hurts when i lift', 'pain when lifting', 'hurts when i run',
];

export interface SafetyResult {
  risk: RiskLevel;
  matched: string[];
}

export function classifyRisk(input: string): SafetyResult {
  const text = input.toLowerCase();
  const high = HIGH_RISK_KEYWORDS.filter((k) => text.includes(k));
  if (high.length) return { risk: 'high', matched: high };
  const medium = MEDIUM_RISK_PATTERNS.filter((k) => text.includes(k));
  if (medium.length) return { risk: 'medium', matched: medium };
  return { risk: 'low', matched: [] };
}

export const HIGH_RISK_SUMMARY =
  "I'm sorry you're dealing with that. Because you mentioned symptoms that could be " +
  'serious (such as severe pain, numbness, tingling, swelling, or a recent injury), I ' +
  "can't safely recommend stretches or exercises. Please contact a licensed healthcare " +
  'professional or urgent care. If this feels like an emergency, call your local emergency number.';

export function highRiskResponse(): StretchResponse {
  return {
    disclaimer: DISCLAIMER,
    risk_level: 'high',
    body_area: 'unknown',
    summary: HIGH_RISK_SUMMARY,
    seek_medical_help_if: [
      'sharp or severe pain',
      'numbness or tingling',
      'swelling or inability to move a limb',
      'pain after an accident or fall',
      'chest pain or shortness of breath',
    ],
    recommendations: [],
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- safety`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/core/safety.ts tests/core/safety.test.ts
git commit -m "feat(core): add deterministic risk classifier"
```

---

## Task 4: Body-area matcher

**Files:**
- Create: `src/core/matcher.ts`
- Test: `tests/core/matcher.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { matchInput } from '@/core/matcher';

describe('matchInput', () => {
  it.each([
    ['my neck feels tight after sleeping', 'neck'],
    ['lower back is tight', 'lower back'],
    ['I have a cramp in my calf', 'calf'],
    ['my shoulders are sore', 'shoulders'],
    ['my hamstrings are tight', 'hamstrings'],
    ['can I stretch my chest', 'chest'],
    ['what should I do after leg day soreness', 'post-workout'],
  ])('maps "%s" -> %s', (input, area) => {
    expect(matchInput(input).bodyArea).toBe(area);
  });

  it('prefers a specific body part over post-workout', () => {
    expect(matchInput('my shoulders are sore after working out').bodyArea).toBe('shoulders');
  });

  it('returns null bodyArea when unsure', () => {
    expect(matchInput('I feel weird today').bodyArea).toBeNull();
  });

  it('detects weight intent', () => {
    expect(matchInput('stretch my chest with light dumbbells').wantsWeights).toBe(true);
    expect(matchInput('stretch my chest').wantsWeights).toBe(false);
  });

  it('detects difficulty, defaulting to beginner', () => {
    expect(matchInput('neck stretches').difficulty).toBe('beginner');
    expect(matchInput('advanced neck stretches').difficulty).toBe('advanced');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- matcher`
Expected: FAIL (`Cannot find module '@/core/matcher'`).

- [ ] **Step 3: Write the implementation**

```ts
import { Difficulty } from './types';

export interface MatchResult {
  bodyArea: string | null;
  wantsWeights: boolean;
  difficulty: Difficulty;
}

// Order matters: specific body parts are checked before 'post-workout'.
const BODY_AREA_KEYWORDS: [string, string[]][] = [
  ['neck', ['neck', 'traps', 'trapezius', 'crick']],
  ['lower back', ['lower back', 'low back', 'lumbar', 'lower-back']],
  ['calf', ['calf', 'calves', 'gastrocnemius']],
  ['shoulders', ['shoulder', 'shoulders', 'delts', 'rotator cuff']],
  ['hamstrings', ['hamstring', 'hamstrings', 'back of my leg', 'back of the thigh']],
  ['chest', ['chest', 'pecs', 'pectoral']],
  ['post-workout', ['post workout', 'post-workout', 'after working out', 'after my workout', 'leg day', 'after lifting', 'after a workout']],
];

const WEIGHT_KEYWORDS = ['weight', 'weights', 'dumbbell', 'dumbbells', 'kettlebell', 'resistance band', 'goblet', 'barbell'];

function detectDifficulty(text: string): Difficulty {
  if (text.includes('advanced')) return 'advanced';
  if (text.includes('intermediate')) return 'intermediate';
  return 'beginner';
}

export function matchInput(input: string): MatchResult {
  const text = input.toLowerCase();
  let bodyArea: string | null = null;
  for (const [area, keywords] of BODY_AREA_KEYWORDS) {
    if (keywords.some((k) => text.includes(k))) {
      bodyArea = area;
      break;
    }
  }
  const wantsWeights = WEIGHT_KEYWORDS.some((k) => text.includes(k));
  return { bodyArea, wantsWeights, difficulty: detectDifficulty(text) };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- matcher`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/matcher.ts tests/core/matcher.test.ts
git commit -m "feat(core): add body-area / weights / difficulty matcher"
```

---

## Task 5: Curated dataset and response builder

**Files:**
- Create: `src/core/dataset.ts`
- Test: `tests/core/dataset.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { buildResponse, STRETCH_DATASET } from '@/core/dataset';

describe('dataset', () => {
  it('has entries for all seven areas', () => {
    expect(Object.keys(STRETCH_DATASET).sort()).toEqual(
      ['calf', 'chest', 'hamstrings', 'lower back', 'neck', 'post-workout', 'shoulders'].sort(),
    );
  });

  it('every recommendation has the required fields', () => {
    for (const recs of Object.values(STRETCH_DATASET)) {
      expect(recs.length).toBeGreaterThanOrEqual(3);
      for (const r of recs) {
        expect(r.name).toBeTruthy();
        expect(r.instructions.length).toBeGreaterThan(0);
        expect(r.safety_notes.length).toBeGreaterThan(0);
        expect(r.media_prompt).toBeTruthy();
      }
    }
  });

  it('builds a low-risk response with beginner items by default', () => {
    const res = buildResponse('neck', { wantsWeights: false, difficulty: 'beginner', riskLevel: 'low' });
    expect(res.body_area).toBe('neck');
    expect(res.risk_level).toBe('low');
    expect(res.recommendations.length).toBeGreaterThan(0);
    expect(res.recommendations.every((r) => r.difficulty === 'beginner')).toBe(true);
  });

  it('excludes weighted items unless weights are requested at low risk', () => {
    const noWeights = buildResponse('chest', { wantsWeights: false, difficulty: 'advanced', riskLevel: 'low' });
    expect(noWeights.recommendations.every((r) => !r.weighted)).toBe(true);

    const withWeights = buildResponse('chest', { wantsWeights: true, difficulty: 'advanced', riskLevel: 'low' });
    expect(withWeights.recommendations.some((r) => r.weighted)).toBe(true);
  });

  it('never returns weighted items at medium risk even if requested', () => {
    const res = buildResponse('chest', { wantsWeights: true, difficulty: 'advanced', riskLevel: 'medium' });
    expect(res.recommendations.every((r) => !r.weighted)).toBe(true);
    expect(res.summary.toLowerCase()).toContain('professional');
  });

  it('higher difficulty includes lower-difficulty items', () => {
    const beginner = buildResponse('neck', { wantsWeights: false, difficulty: 'beginner', riskLevel: 'low' });
    const advanced = buildResponse('neck', { wantsWeights: false, difficulty: 'advanced', riskLevel: 'low' });
    expect(advanced.recommendations.length).toBeGreaterThanOrEqual(beginner.recommendations.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- dataset`
Expected: FAIL (`Cannot find module '@/core/dataset'`).

- [ ] **Step 3: Write the implementation**

Author a curated dataset. Each area lists 3-5 items; include at least one `intermediate` item per area and at least one `weighted` item in `chest` and `shoulders`. The block below is complete for `neck` and `chest`; replicate the same shape for `lower back`, `calf`, `shoulders`, `hamstrings`, and `post-workout` using common, safe beginner stretches (Standing Calf Stretch, Cat-Cow, Child's Pose, Standing Hamstring Stretch, Cross-Body Shoulder Stretch, Foam-roll/gentle full-body cooldown moves, etc.). Keep instructions to 3-4 short steps and always include a "stop if you feel sharp pain, numbness, tingling, or dizziness" safety note.

```ts
import { DIFFICULTY_RANK, DISCLAIMER, Difficulty, Recommendation, RiskLevel, StretchResponse } from './types';

export const STRETCH_DATASET: Record<string, Recommendation[]> = {
  neck: [
    {
      name: 'Chin Tucks',
      type: 'mobility',
      target_muscles: ['deep neck flexors', 'upper neck'],
      instructions: [
        'Sit or stand tall.',
        'Gently pull your chin straight back, like making a double chin.',
        'Keep your eyes level.',
        'Hold for 5 seconds, then release.',
      ],
      sets: 2,
      reps: 10,
      duration: '5 seconds each rep',
      equipment: 'none',
      weighted: false,
      difficulty: 'beginner',
      safety_notes: ['Do not force the movement.', 'Stop if you feel dizziness, sharp pain, numbness, or tingling.'],
      media_prompt: 'Clean fitness animation of a person sitting upright performing chin tucks, side view, neutral background, no logos.',
    },
    {
      name: 'Upper Trap Stretch',
      type: 'stretch',
      target_muscles: ['upper trapezius'],
      instructions: [
        'Sit tall.',
        'Gently tilt your right ear toward your right shoulder.',
        'Hold 20-30 seconds, then switch sides.',
      ],
      sets: 1,
      reps: 2,
      duration: '20-30 seconds per side',
      equipment: 'none',
      weighted: false,
      difficulty: 'beginner',
      safety_notes: ['Keep the stretch gentle.', 'Stop if you feel sharp pain, numbness, tingling, or dizziness.'],
      media_prompt: 'Clean fitness animation of a person performing an upper trapezius neck stretch, front view, neutral background, no logos.',
    },
    {
      name: 'Levator Scapulae Stretch',
      type: 'stretch',
      target_muscles: ['levator scapulae'],
      instructions: [
        'Turn your head about 45 degrees to the right.',
        'Gently look down toward your armpit.',
        'Hold 20-30 seconds, then switch sides.',
      ],
      sets: 1,
      reps: 2,
      duration: '20-30 seconds per side',
      equipment: 'none',
      weighted: false,
      difficulty: 'intermediate',
      safety_notes: ['Do not pull hard on your head.', 'Stop if you feel sharp pain, numbness, tingling, or dizziness.'],
      media_prompt: 'Clean fitness animation of a person performing a levator scapulae neck stretch, three-quarter view, neutral background, no logos.',
    },
  ],
  chest: [
    {
      name: 'Doorway Chest Stretch',
      type: 'stretch',
      target_muscles: ['pectorals', 'front shoulders'],
      instructions: [
        'Place your forearms on a doorway frame.',
        'Step forward slowly until you feel a gentle stretch across your chest.',
        'Hold 20-30 seconds.',
      ],
      sets: 2,
      reps: 1,
      duration: '20-30 seconds',
      equipment: 'doorway',
      weighted: false,
      difficulty: 'beginner',
      safety_notes: ['Keep the stretch gentle.', 'Stop if you feel sharp pain, numbness, tingling, or dizziness.'],
      media_prompt: 'Clean fitness animation of a person doing a doorway chest stretch, side view, neutral background, no logos.',
    },
    {
      name: 'Floor Angels',
      type: 'mobility',
      target_muscles: ['chest', 'upper back'],
      instructions: [
        'Lie on your back with knees bent.',
        'Slide your arms overhead along the floor, then back down.',
        'Move slowly and keep your low back gently flat.',
      ],
      sets: 2,
      reps: 10,
      duration: 'slow and controlled',
      equipment: 'none',
      weighted: false,
      difficulty: 'intermediate',
      safety_notes: ['Move only as far as is comfortable.', 'Stop if you feel sharp pain, numbness, tingling, or dizziness.'],
      media_prompt: 'Clean fitness animation of a person performing floor angels on their back, top view, neutral background, no logos.',
    },
    {
      name: 'Light Dumbbell Chest Opener',
      type: 'stretch',
      target_muscles: ['pectorals'],
      instructions: [
        'Lie on your back holding a light dumbbell in each hand, arms above your chest.',
        'Lower your arms out to the sides until you feel a gentle stretch.',
        'Bring them back up slowly.',
      ],
      sets: 2,
      reps: 8,
      duration: 'slow and controlled',
      equipment: 'light dumbbells',
      weighted: true,
      difficulty: 'advanced',
      safety_notes: [
        'Use very light weight.',
        'Do not let your shoulders feel strained.',
        'Stop if you feel sharp pain, numbness, tingling, or dizziness.',
      ],
      media_prompt: 'Clean fitness animation of a person doing a light dumbbell chest fly stretch lying on a bench, side view, neutral background, no logos.',
    },
  ],
  // TODO-AUTHOR: 'lower back', 'calf', 'shoulders', 'hamstrings', 'post-workout'
  // Replicate the same Recommendation shape above. >=3 items each, at least one
  // 'intermediate', and at least one weighted item in 'shoulders'.
  'lower back': [],
  calf: [],
  shoulders: [],
  hamstrings: [],
  'post-workout': [],
};

const AREA_SUMMARY: Record<string, string> = {
  neck: 'These gentle stretches may help with general neck tightness.',
  chest: 'These moves may help open up a tight chest.',
  'lower back': 'These gentle movements may help with general lower-back tightness.',
  calf: 'These stretches may help with general calf tightness.',
  shoulders: 'These moves may help with general shoulder tightness or soreness.',
  hamstrings: 'These stretches may help with general hamstring tightness.',
  'post-workout': 'These gentle moves may help you cool down and recover after a workout.',
};

const SEEK_HELP = [
  'sharp pain',
  'numbness or tingling',
  'dizziness',
  'pain after an accident',
  'symptoms that worsen or do not improve',
];

export interface BuildOptions {
  wantsWeights: boolean;
  difficulty: Difficulty;
  riskLevel: RiskLevel;
}

export function buildResponse(area: string, opts: BuildOptions): StretchResponse {
  const all = STRETCH_DATASET[area] ?? [];
  const maxRank = DIFFICULTY_RANK[opts.difficulty];
  const allowWeights = opts.wantsWeights && opts.riskLevel === 'low';

  const recommendations = all.filter((r) => {
    if (DIFFICULTY_RANK[r.difficulty] > maxRank) return false;
    if (r.weighted && !allowWeights) return false;
    return true;
  });

  const summary =
    opts.riskLevel === 'medium'
      ? `${AREA_SUMMARY[area] ?? 'These gentle moves may help.'} Because this has been bothering you, consider seeing a healthcare professional if symptoms persist.`
      : AREA_SUMMARY[area] ?? 'These gentle moves may help.';

  return {
    disclaimer: DISCLAIMER,
    risk_level: opts.riskLevel,
    body_area: area,
    summary,
    seek_medical_help_if: SEEK_HELP,
    recommendations,
  };
}
```

Note: the empty `lower back`/`calf`/`shoulders`/`hamstrings`/`post-workout` arrays will make the "all seven areas" key test pass but the "every recommendation" test will pass vacuously for empty arrays — so you MUST author those arrays before Step 4 (the `length >= 3` assertion enforces it).

- [ ] **Step 4: Author the remaining five areas, then run the test**

Fill in the five empty arrays with curated stretches following the shape above.
Run: `npm test -- dataset`
Expected: PASS (all assertions, including `length >= 3` per area).

- [ ] **Step 5: Commit**

```bash
git add src/core/dataset.ts tests/core/dataset.test.ts
git commit -m "feat(core): add curated stretch dataset and response builder"
```

---

## Task 6: Response validation + sanitize, and the Gemini client

**Files:**
- Create: `src/core/validate.ts`
- Create: `src/core/gemini.ts`
- Test: `tests/core/validate.test.ts`
- Test: `tests/core/gemini.test.ts`

- [ ] **Step 1: Write the failing test for validate**

```ts
import { sanitize, validateResponse } from '@/core/validate';
import { StretchResponse } from '@/core/types';

const good: StretchResponse = {
  disclaimer: 'd',
  risk_level: 'low',
  body_area: 'neck',
  summary: 's',
  seek_medical_help_if: ['x'],
  recommendations: [
    {
      name: 'Chin Tucks',
      type: 'mobility',
      target_muscles: ['neck'],
      instructions: ['a'],
      sets: 2,
      reps: 10,
      duration: '5s',
      equipment: 'none',
      weighted: false,
      difficulty: 'beginner',
      safety_notes: ['stop if it hurts'],
      media_prompt: 'p',
    },
  ],
};

describe('validateResponse', () => {
  it('accepts a well-formed response', () => {
    expect(validateResponse(good)).toBe(true);
  });

  it.each([
    null,
    {},
    { ...good, risk_level: 'extreme' },
    { ...good, recommendations: 'nope' },
    { ...good, recommendations: [{ name: 'x' }] },
  ])('rejects malformed payload %#', (bad) => {
    expect(validateResponse(bad)).toBe(false);
  });
});

describe('sanitize', () => {
  it('strips weighted recommendations when risk is medium', () => {
    const withWeight: StretchResponse = {
      ...good,
      risk_level: 'medium',
      recommendations: [
        good.recommendations[0],
        { ...good.recommendations[0], name: 'Weighted', weighted: true },
      ],
    };
    const out = sanitize(withWeight, 'medium');
    expect(out.recommendations.every((r) => !r.weighted)).toBe(true);
    expect(out.risk_level).toBe('medium');
  });
});
```

- [ ] **Step 2: Run validate test to verify it fails**

Run: `npm test -- validate`
Expected: FAIL (`Cannot find module '@/core/validate'`).

- [ ] **Step 3: Write `src/core/validate.ts`**

```ts
import { Difficulty, ExerciseType, Recommendation, RiskLevel, StretchResponse } from './types';

const RISK: RiskLevel[] = ['low', 'medium', 'high'];
const DIFF: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
const TYPES: ExerciseType[] = ['mobility', 'stretch', 'strength'];

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

function isRecommendation(v: unknown): v is Recommendation {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.name === 'string' &&
    TYPES.includes(r.type as ExerciseType) &&
    isStringArray(r.target_muscles) &&
    isStringArray(r.instructions) &&
    typeof r.sets === 'number' &&
    typeof r.reps === 'number' &&
    typeof r.duration === 'string' &&
    typeof r.equipment === 'string' &&
    typeof r.weighted === 'boolean' &&
    DIFF.includes(r.difficulty as Difficulty) &&
    isStringArray(r.safety_notes) &&
    typeof r.media_prompt === 'string'
  );
}

export function validateResponse(v: unknown): v is StretchResponse {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.disclaimer === 'string' &&
    RISK.includes(r.risk_level as RiskLevel) &&
    typeof r.body_area === 'string' &&
    typeof r.summary === 'string' &&
    isStringArray(r.seek_medical_help_if) &&
    Array.isArray(r.recommendations) &&
    r.recommendations.every(isRecommendation)
  );
}

export function sanitize(res: StretchResponse, risk: RiskLevel): StretchResponse {
  if (risk === 'low') return res;
  return { ...res, recommendations: res.recommendations.filter((r) => !r.weighted) };
}
```

- [ ] **Step 4: Run validate test to verify it passes**

Run: `npm test -- validate`
Expected: PASS.

- [ ] **Step 5: Write the failing test for the Gemini client**

The client takes an injectable `fetchFn` so tests never hit the network.

```ts
import { GeminiClient } from '@/core/gemini';
import { StretchResponse } from '@/core/types';

const sample: StretchResponse = {
  disclaimer: 'd',
  risk_level: 'low',
  body_area: 'neck',
  summary: 's',
  seek_medical_help_if: ['x'],
  recommendations: [
    {
      name: 'Chin Tucks',
      type: 'mobility',
      target_muscles: ['neck'],
      instructions: ['a'],
      sets: 2,
      reps: 10,
      duration: '5s',
      equipment: 'none',
      weighted: false,
      difficulty: 'beginner',
      safety_notes: ['stop if it hurts'],
      media_prompt: 'p',
    },
  ],
};

function fakeFetch(body: unknown) {
  return async () =>
    ({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(body) }] } }],
      }),
    }) as unknown as Response;
}

describe('GeminiClient', () => {
  it('parses a valid JSON response into a StretchResponse', async () => {
    const client = new GeminiClient('FAKE_KEY', fakeFetch(sample));
    const res = await client.suggest('my neck is weird');
    expect(res.body_area).toBe('neck');
  });

  it('throws when the API key is missing', async () => {
    const client = new GeminiClient(undefined, fakeFetch(sample));
    await expect(client.suggest('x')).rejects.toThrow();
  });

  it('throws when the payload fails validation', async () => {
    const client = new GeminiClient('FAKE_KEY', fakeFetch({ nonsense: true }));
    await expect(client.suggest('x')).rejects.toThrow();
  });
});
```

- [ ] **Step 6: Run gemini test to verify it fails**

Run: `npm test -- gemini`
Expected: FAIL (`Cannot find module '@/core/gemini'`).

- [ ] **Step 7: Write `src/core/gemini.ts`**

```ts
import { DISCLAIMER, StretchResponse } from './types';
import { validateResponse } from './validate';

export interface LlmClient {
  suggest(input: string): Promise<StretchResponse>;
}

type FetchFn = typeof fetch;

const MODEL = 'gemini-2.0-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are a cautious fitness mobility assistant. The user describes muscle tension, soreness, or cramps. Respond ONLY with JSON matching this shape:
{"disclaimer": string, "risk_level": "low"|"medium"|"high", "body_area": string, "summary": string, "seek_medical_help_if": string[], "recommendations": [{"name": string, "type": "mobility"|"stretch"|"strength", "target_muscles": string[], "instructions": string[], "sets": number, "reps": number, "duration": string, "equipment": string, "weighted": boolean, "difficulty": "beginner"|"intermediate"|"advanced", "safety_notes": string[], "media_prompt": string}]}
Rules: 3-5 gentle, beginner-friendly recommendations. Never diagnose. Only suggest weighted exercises when clearly safe and requested. Always include safety_notes telling the user to stop if they feel sharp pain, numbness, tingling, or dizziness. Set disclaimer to a short general-fitness disclaimer.`;

export class GeminiClient implements LlmClient {
  constructor(
    private readonly apiKey: string | undefined,
    private readonly fetchFn: FetchFn = fetch,
  ) {}

  async suggest(input: string): Promise<StretchResponse> {
    if (!this.apiKey) throw new Error('Gemini API key not configured');

    const res = await this.fetchFn(`${ENDPOINT}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\nUser: ${input}` }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (!res.ok) throw new Error(`Gemini request failed: ${res.status}`);
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini returned no content');

    const parsed = JSON.parse(text) as unknown;
    if (!validateResponse(parsed)) throw new Error('Gemini returned an invalid payload');
    return { ...parsed, disclaimer: parsed.disclaimer || DISCLAIMER };
  }
}

export const geminiClient = new GeminiClient(process.env.EXPO_PUBLIC_GEMINI_API_KEY);
```

- [ ] **Step 8: Run gemini test to verify it passes**

Run: `npm test -- gemini`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/core/validate.ts src/core/gemini.ts tests/core/validate.test.ts tests/core/gemini.test.ts
git commit -m "feat(core): add response validation, sanitize, and Gemini fallback client"
```

---

## Task 7: Engine orchestrator

**Files:**
- Create: `src/core/engine.ts`
- Test: `tests/core/engine.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { getStretchResponse } from '@/core/engine';
import { LlmClient } from '@/core/gemini';
import { StretchResponse } from '@/core/types';

function spyLlm(): { client: LlmClient; calls: number } {
  const state = { calls: 0 };
  const client: LlmClient = {
    async suggest() {
      state.calls += 1;
      return {
        disclaimer: 'd',
        risk_level: 'low',
        body_area: 'general',
        summary: 'from llm',
        seek_medical_help_if: [],
        recommendations: [],
      } as StretchResponse;
    },
  };
  return { client, get calls() { return state.calls; } } as any;
}

describe('getStretchResponse', () => {
  it('returns a high-risk safety response and never calls the LLM', async () => {
    const llm = spyLlm();
    const res = await getStretchResponse('I have chest pain and numbness', { llm: llm.client });
    expect(res.risk_level).toBe('high');
    expect(res.recommendations).toHaveLength(0);
    expect(llm.calls).toBe(0);
  });

  it('answers a known body area locally without the LLM', async () => {
    const llm = spyLlm();
    const res = await getStretchResponse('my neck is tight', { llm: llm.client });
    expect(res.body_area).toBe('neck');
    expect(res.recommendations.length).toBeGreaterThan(0);
    expect(llm.calls).toBe(0);
  });

  it('falls back to the LLM when the input is unsure', async () => {
    const llm = spyLlm();
    const res = await getStretchResponse('something feels off all over', { llm: llm.client });
    expect(llm.calls).toBe(1);
    expect(res.summary).toBe('from llm');
  });

  it('returns a graceful fallback when the LLM throws', async () => {
    const llm: LlmClient = { async suggest() { throw new Error('no key'); } };
    const res = await getStretchResponse('something feels off all over', { llm });
    expect(res.recommendations).toHaveLength(0);
    expect(res.summary.toLowerCase()).toContain('try');
  });

  it('does not return weighted items when risk is medium even if requested', async () => {
    const res = await getStretchResponse('my chest hurts when lifting, can I use dumbbells', {});
    expect(res.risk_level).toBe('medium');
    expect(res.recommendations.every((r) => !r.weighted)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- engine`
Expected: FAIL (`Cannot find module '@/core/engine'`).

- [ ] **Step 3: Write `src/core/engine.ts`**

```ts
import { buildResponse } from './dataset';
import { geminiClient, LlmClient } from './gemini';
import { matchInput } from './matcher';
import { classifyRisk, highRiskResponse } from './safety';
import { DISCLAIMER, StretchResponse } from './types';
import { sanitize, validateResponse } from './validate';

export interface EngineDeps {
  llm?: LlmClient;
}

function fallbackResponse(): StretchResponse {
  return {
    disclaimer: DISCLAIMER,
    risk_level: 'low',
    body_area: 'unknown',
    summary:
      "I'm not sure I caught that. Try telling me which area feels tense - for example: neck, " +
      'lower back, calf, shoulders, hamstrings, or chest - or pick one of the suggestions.',
    seek_medical_help_if: [],
    recommendations: [],
  };
}

export async function getStretchResponse(input: string, deps: EngineDeps = {}): Promise<StretchResponse> {
  const safety = classifyRisk(input);
  if (safety.risk === 'high') return highRiskResponse();

  const match = matchInput(input);
  if (match.bodyArea) {
    return buildResponse(match.bodyArea, {
      wantsWeights: match.wantsWeights,
      difficulty: match.difficulty,
      riskLevel: safety.risk,
    });
  }

  const llm = deps.llm ?? geminiClient;
  try {
    const res = await llm.suggest(input);
    if (validateResponse(res)) return sanitize(res, safety.risk);
  } catch {
    // fall through to graceful fallback
  }
  return fallbackResponse();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- engine`
Expected: PASS.

- [ ] **Step 5: Run the whole core suite and typecheck**

Run: `npm test`
Expected: all core tests PASS.
Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/core/engine.ts tests/core/engine.test.ts
git commit -m "feat(core): add engine orchestrator wiring safety, match, dataset, LLM"
```

---

## Task 8: Theme accent colors

**Files:**
- Modify: `src/constants/theme.ts`

- [ ] **Step 1: Add accent + risk colors to the `Colors` object**

In `src/constants/theme.ts`, add these keys inside both `light` and `dark` (keep existing keys):

```ts
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    accent: '#2F8F83',
    accentText: '#ffffff',
    bubbleUser: '#2F8F83',
    bubbleAssistant: '#F0F0F3',
    warning: '#B54708',
    danger: '#B42318',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    accent: '#3FB8A8',
    accentText: '#04201C',
    bubbleUser: '#2F8F83',
    bubbleAssistant: '#212225',
    warning: '#F5A623',
    danger: '#F97066',
  },
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (`ThemeColor` now includes the new keys automatically).

- [ ] **Step 3: Commit**

```bash
git add src/constants/theme.ts
git commit -m "feat(ui): add accent and risk-tier theme colors"
```

---

## Task 9: Disclaimer banner and prompt chips components

**Files:**
- Create: `src/components/disclaimer-banner.tsx`
- Create: `src/components/prompt-chips.tsx`

- [ ] **Step 1: Write `src/components/disclaimer-banner.tsx`**

```tsx
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { DISCLAIMER } from '@/core/types';

export function DisclaimerBanner() {
  const [open, setOpen] = useState(false);
  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <Pressable onPress={() => setOpen((v) => !v)}>
        <ThemedText type="small" themeColor="textSecondary">
          {open ? DISCLAIMER : 'Not medical advice. Tap to read the full disclaimer.'}
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
```

- [ ] **Step 2: Write `src/components/prompt-chips.tsx`**

```tsx
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export const SUGGESTED_PROMPTS = [
  'Neck tension',
  'Lower back tightness',
  'Calf cramp',
  'Shoulder soreness',
  'Stretch with weights',
  'Post-workout recovery',
];

export function PromptChips({ onSelect }: { onSelect: (text: string) => void }) {
  const theme = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {SUGGESTED_PROMPTS.map((p) => (
        <Pressable
          key={p}
          onPress={() => onSelect(p)}
          style={[styles.chip, { backgroundColor: theme.backgroundElement }]}
        >
          <ThemedText type="small">{p}</ThemedText>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999 },
});
```

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/disclaimer-banner.tsx src/components/prompt-chips.tsx
git commit -m "feat(ui): add disclaimer banner and prompt chips"
```

---

## Task 10: StretchCard and MessageBubble components

**Files:**
- Create: `src/components/stretch-card.tsx`
- Create: `src/components/message-bubble.tsx`
- Test: `tests/components/stretch-card.test.tsx`
- Test: `tests/components/message-bubble.test.tsx`

- [ ] **Step 1: Write the failing test for StretchCard**

```tsx
import { render, screen } from '@testing-library/react-native';

import { StretchCard } from '@/components/stretch-card';
import { Recommendation } from '@/core/types';

const rec: Recommendation = {
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
};

describe('StretchCard', () => {
  it('renders the name, instructions, and an easier/harder control', () => {
    render(<StretchCard rec={rec} onEasier={() => {}} onHarder={() => {}} />);
    expect(screen.getByText('Chin Tucks')).toBeTruthy();
    expect(screen.getByText('Sit tall.')).toBeTruthy();
    expect(screen.getByText('Make easier')).toBeTruthy();
    expect(screen.getByText('Make harder')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- stretch-card`
Expected: FAIL (`Cannot find module '@/components/stretch-card'`).

- [ ] **Step 3: Write `src/components/stretch-card.tsx`**

```tsx
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Recommendation } from '@/core/types';

export function StretchCard({
  rec,
  onEasier,
  onHarder,
}: {
  rec: Recommendation;
  onEasier: () => void;
  onHarder: () => void;
}) {
  const theme = useTheme();
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">{rec.name}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {rec.target_muscles.join(', ')} · {rec.difficulty}
        {rec.weighted ? ' · weights' : ''}
      </ThemedText>

      {rec.instructions.map((line, i) => (
        <ThemedText key={i} type="small" style={styles.step}>
          {i + 1}. {line}
        </ThemedText>
      ))}

      <ThemedText type="small" themeColor="textSecondary" style={styles.meta}>
        {rec.sets} sets · {rec.reps} reps · {rec.duration}
      </ThemedText>

      {rec.safety_notes.map((note, i) => (
        <ThemedText key={i} type="small" themeColor="warning">
          ⚠ {note}
        </ThemedText>
      ))}

      <View style={styles.actions}>
        <Pressable
          accessibilityState={{ disabled: true }}
          style={[styles.btn, { backgroundColor: theme.backgroundSelected, opacity: 0.5 }]}
        >
          <ThemedText type="small">Show animation</ThemedText>
        </Pressable>
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
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },
  btn: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999 },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- stretch-card`
Expected: PASS.

- [ ] **Step 5: Write the failing test for MessageBubble**

```tsx
import { render, screen } from '@testing-library/react-native';

import { MessageBubble } from '@/components/message-bubble';
import { ChatMessage } from '@/components/message-bubble';

const textMsg: ChatMessage = { id: '1', role: 'user', kind: 'text', text: 'my neck hurts' };
const recMsg: ChatMessage = {
  id: '2',
  role: 'assistant',
  kind: 'response',
  response: {
    disclaimer: 'd',
    risk_level: 'low',
    body_area: 'neck',
    summary: 'These may help.',
    seek_medical_help_if: ['sharp pain'],
    recommendations: [
      {
        name: 'Chin Tucks',
        type: 'mobility',
        target_muscles: ['neck'],
        instructions: ['Sit tall.'],
        sets: 2,
        reps: 10,
        duration: '5s',
        equipment: 'none',
        weighted: false,
        difficulty: 'beginner',
        safety_notes: ['Stop if it hurts.'],
        media_prompt: 'p',
      },
    ],
  },
};

describe('MessageBubble', () => {
  it('renders a plain text message', () => {
    render(<MessageBubble message={textMsg} onEasier={() => {}} onHarder={() => {}} />);
    expect(screen.getByText('my neck hurts')).toBeTruthy();
  });

  it('renders a response with summary and a stretch card', () => {
    render(<MessageBubble message={recMsg} onEasier={() => {}} onHarder={() => {}} />);
    expect(screen.getByText('These may help.')).toBeTruthy();
    expect(screen.getByText('Chin Tucks')).toBeTruthy();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- message-bubble`
Expected: FAIL (`Cannot find module '@/components/message-bubble'`).

- [ ] **Step 7: Write `src/components/message-bubble.tsx`**

```tsx
import { StyleSheet, View } from 'react-native';

import { StretchCard } from '@/components/stretch-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { StretchResponse } from '@/core/types';

export type ChatMessage =
  | { id: string; role: 'user' | 'assistant'; kind: 'text'; text: string }
  | { id: string; role: 'assistant'; kind: 'response'; response: StretchResponse };

export function MessageBubble({
  message,
  onEasier,
  onHarder,
}: {
  message: ChatMessage;
  onEasier: (bodyArea: string) => void;
  onHarder: (bodyArea: string) => void;
}) {
  if (message.kind === 'text') {
    const isUser = message.role === 'user';
    return (
      <ThemedView
        type={isUser ? 'bubbleUser' : 'bubbleAssistant'}
        style={[styles.textBubble, isUser ? styles.right : styles.left]}
      >
        <ThemedText type="small" themeColor={isUser ? 'accentText' : 'text'}>
          {message.text}
        </ThemedText>
      </ThemedView>
    );
  }

  const res = message.response;
  return (
    <View style={[styles.left, styles.responseWrap]}>
      <ThemedText type="small">{res.summary}</ThemedText>
      {res.recommendations.map((rec, i) => (
        <StretchCard
          key={`${rec.name}-${i}`}
          rec={rec}
          onEasier={() => onEasier(res.body_area)}
          onHarder={() => onHarder(res.body_area)}
        />
      ))}
      {res.seek_medical_help_if.length > 0 && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.seek}>
          Seek medical help if: {res.seek_medical_help_if.join('; ')}.
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  textBubble: { maxWidth: '85%', borderRadius: 16, padding: Spacing.three, marginVertical: Spacing.one },
  responseWrap: { maxWidth: '95%', marginVertical: Spacing.one },
  right: { alignSelf: 'flex-end' },
  left: { alignSelf: 'flex-start' },
  seek: { marginTop: Spacing.two },
});
```

- [ ] **Step 8: Run both component tests to verify they pass**

Run: `npm test -- message-bubble stretch-card`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/components/stretch-card.tsx src/components/message-bubble.tsx tests/components
git commit -m "feat(ui): add stretch card and message bubble components"
```

---

## Task 11: Chat screen wiring everything together

**Files:**
- Modify: `src/app/index.tsx` (replace placeholder)

- [ ] **Step 1: Write the chat screen**

```tsx
import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DisclaimerBanner } from '@/components/disclaimer-banner';
import { ChatMessage, MessageBubble } from '@/components/message-bubble';
import { PromptChips } from '@/components/prompt-chips';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { getStretchResponse } from '@/core/engine';
import { Difficulty, DIFFICULTY_RANK } from '@/core/types';
import { useTheme } from '@/hooks/use-theme';

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  kind: 'text',
  text:
    "Hi, I'm your AI mobility coach. Tell me where you feel tension, soreness, or cramps, " +
    'and I’ll suggest safe stretches, mobility drills, or light exercises that may help.',
};

let counter = 0;
const nextId = () => `m${counter++}`;

export default function Home() {
  const theme = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [draft, setDraft] = useState('');
  const lastInput = useRef<{ text: string; difficulty: Difficulty }>({ text: '', difficulty: 'beginner' });

  const send = useCallback(async (raw: string, difficulty: Difficulty = 'beginner') => {
    const text = raw.trim();
    if (!text) return;
    lastInput.current = { text, difficulty };
    const userMsg: ChatMessage = { id: nextId(), role: 'user', kind: 'text', text };
    setMessages((prev) => [...prev, userMsg]);
    setDraft('');

    const prompt = difficulty === 'beginner' ? text : `${difficulty} ${text}`;
    const response = await getStretchResponse(prompt);
    setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', kind: 'response', response }]);
  }, []);

  const adjust = useCallback(
    (delta: number) => {
      const order: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
      const current = DIFFICULTY_RANK[lastInput.current.difficulty];
      const next = order[Math.max(0, Math.min(2, current + delta))];
      void send(lastInput.current.text, next);
    },
    [send],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <DisclaimerBanner />
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              onEasier={() => adjust(-1)}
              onHarder={() => adjust(1)}
            />
          )}
        />
        <PromptChips onSelect={(t) => void send(t)} />
        <SafeAreaView edges={['bottom']} style={{ backgroundColor: theme.background }}>
          <ThemedText style={styles.hidden} />
          <Pressable style={styles.inputRow}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Where do you feel tension?"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              onSubmitEditing={() => void send(draft)}
              returnKeyType="send"
            />
            <Pressable
              onPress={() => void send(draft)}
              style={[styles.sendBtn, { backgroundColor: theme.accent }]}
            >
              <ThemedText type="small" themeColor="accentText">
                Send
              </ThemedText>
            </Pressable>
          </Pressable>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.three, gap: Spacing.one },
  inputRow: { flexDirection: 'row', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingBottom: Spacing.two },
  input: { flex: 1, borderRadius: 999, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  sendBtn: { borderRadius: 999, paddingHorizontal: Spacing.four, justifyContent: 'center' },
  hidden: { height: 0 },
});
```

- [ ] **Step 2: Verify typecheck and full test suite**

Run: `npx tsc --noEmit`
Expected: no errors.
Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 3: Manual smoke test on web**

Run: `npm run web`
Verify in the browser:
- Welcome message and disclaimer banner show.
- Tapping "Neck tension" chip adds a user bubble and an assistant response with stretch cards.
- Typing "I have chest pain" returns the high-risk safety message with NO stretch cards.
- "Make easier" / "Make harder" on a card re-queries and changes which cards appear.
- Toggle OS dark mode; colors adapt.

- [ ] **Step 4: Commit**

```bash
git add src/app/index.tsx
git commit -m "feat(ui): wire chat screen to the stretch engine"
```

---

## Self-Review Notes (for the implementer)

- **Spec coverage:** chat UI (Task 11), suggested chips (Task 9/11), structured JSON shape (Task 2), local rules+dataset (Tasks 3-5), Gemini fallback direct call (Task 6), engine routing with safety-first (Task 7), high/medium/low risk tiers (Tasks 3, 5, 7), weighted-only-when-safe (Tasks 5, 7), light/dark (Task 8 + themed components), inline disclaimer (Task 9), privacy-by-design ephemeral chat (Task 11 keeps messages in component state only — nothing persisted), graceful error fallback (Task 7).
- **Out of scope (per spec):** accounts, routine builder, body-map, history persistence, real media, profile/settings, full legal pages, monetization, server proxy. Do NOT add these.
- **Type consistency:** `StretchResponse`/`Recommendation`/`Difficulty`/`RiskLevel` defined once in `types.ts` and reused everywhere; `getStretchResponse`, `buildResponse`, `validateResponse`, `sanitize`, `matchInput`, `classifyRisk` signatures are stable across tasks.
- **Free-to-run guarantee:** with no `EXPO_PUBLIC_GEMINI_API_KEY`, `geminiClient.suggest` throws immediately and the engine returns the graceful fallback; all known body areas still work fully offline.
```
