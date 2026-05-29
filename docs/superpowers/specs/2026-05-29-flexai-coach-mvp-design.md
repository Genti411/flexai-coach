# FlexAI Coach - MVP Design (Chat-to-Stretch Core)

Date: 2026-05-29
Status: Approved
Slice: 1 of N (first vertical slice of a larger product)

## Goal

Deliver the core product experience: a ChatGPT-style chat screen where a user
describes muscle tension/soreness/cramps, and the app responds with safe,
beginner-friendly stretch recommendations rendered as cards, with deterministic
safety guardrails. Must run for free.

## Constraints

- **Free to run.** No paid APIs. Runs on web (`expo start --web`) and on a phone
  via Expo Go at $0.
- **Not medical advice.** No diagnosis. Inline disclaimer always visible. High-risk
  inputs are blocked from receiving exercise suggestions.
- **Privacy by design.** Chat is in-memory only this slice; nothing about pain or
  body input is persisted.
- **Stack parity.** Match the existing `beauty-ai` app: Expo SDK 56, expo-router,
  TypeScript, Jest.

## Stack

- New Expo app `flexai-coach`, sibling to `beauty-ai`.
- Expo SDK ~56, expo-router, React Native, TypeScript.
- Jest + @testing-library/react-native for tests.
- No Supabase, no account, no backend this slice.

## Architecture

Three layers: UI, pure-TS core domain ("the engine"), and a thin LLM service.

### 1. UI (expo-router)

Single chat screen `app/index.tsx`:

- Welcome message from the AI mobility coach.
- Suggested prompt chips: Neck tension, Lower back tightness, Calf cramp,
  Shoulder soreness, Stretch with weights, Post-workout recovery.
- Text input pinned to the bottom.
- Persistent disclaimer banner with a link/expander to the full disclaimer text.
- Message list renders two message kinds:
  - plain text
  - a **recommendation payload** rendered as a set of stretch cards.
- `StretchCard` shows: name, target muscles, step-by-step instructions,
  sets/reps/duration, difficulty badge, safety notes, placeholder image.
  - Buttons: *Show animation* (placeholder/disabled this slice),
    *Make easier* / *Make harder* (re-query the engine at the new difficulty).
  - *Save to routine* is hidden this slice (deferred).
- Light and dark mode, following the `beauty-ai` theme pattern.

### 2. Core domain (pure TypeScript, fully unit-tested)

- **`safety.ts`** - risk classifier. Scans input for high-risk keywords:
  sharp pain, numbness, tingling, swelling, can't move, injury, fall, accident,
  chest pain, shortness of breath, severe pain. On match: return the canned
  high-risk response with **no stretches and no LLM call**. Also flags
  medium-risk signals (persistent/recurring, "hurts when lifting") which force
  non-weighted options and append a "see a professional if it persists" note.
- **`matcher.ts`** - maps phrasing to a body area via a synonym keyword map;
  detects weight/equipment intent and requested difficulty. Returns a match with
  a confidence signal (matched vs. unsure).
- **`dataset.ts`** - curated, typed stretch library covering the six chip areas
  (neck, lower back, calf, shoulders, hamstrings, chest) plus post-workout
  recovery. ~4-5 stretches each, authored to the exact response schema below.
  100% free, offline, deterministic.
- **`engine.ts`** (orchestrator) - the decision flow:
  1. Run safety check first.
  2. If high risk -> return safety response (stop; no LLM).
  3. Else run local matcher. If confident -> return local recommendation.
  4. Else -> Gemini fallback (see service). Validate result against the schema.
  5. On any fallback error -> graceful local fallback message + chips.
  - Weighted exercises are returned only when risk is low **and** the user
    explicitly asked for weights/equipment.

### 3. Service

- **`gemini.ts`** - direct call to the Google Gemini free tier
  (`generateContent`) with a JSON response schema and the system prompt.
  Validates the returned JSON against the shared schema. API key read from app
  config (`expo-constants` `extra`) / env. Direct client call is accepted for
  this free, rate-limited MVP (documented tradeoff; a server-side proxy is a
  later slice if the app moves toward launch).

## Data shape

One shared TypeScript type drives both the local dataset and LLM validation, so
cards render identically regardless of source.

```jsonc
{
  "disclaimer": "string",
  "risk_level": "low | medium | high",
  "body_area": "string",
  "summary": "string",
  "seek_medical_help_if": ["string"],
  "recommendations": [
    {
      "name": "string",
      "type": "mobility | stretch | strength",
      "target_muscles": ["string"],
      "instructions": ["string"],
      "sets": 0,
      "reps": 0,
      "duration": "string",
      "equipment": "string",
      "weighted": false,
      "difficulty": "beginner | intermediate | advanced",
      "safety_notes": ["string"],
      "media_prompt": "string"
    }
  ]
}
```

For a high-risk input, `recommendations` is empty and `summary` is the safety
message directing the user to professional/emergency care.

## Safety logic (tiers)

- **High risk** (keyword match): block. Return safety response, no stretches,
  no LLM. Example: "Because you mentioned numbness, severe pain, swelling,
  injury, or symptoms that could be serious, I can't safely recommend stretches
  or exercises. Please contact a licensed healthcare professional or urgent care.
  If this feels like an emergency, call emergency services."
- **Medium risk** (persistent/recurring/pain-on-load): gentle non-weighted
  options only + "consider seeing a healthcare professional if symptoms persist."
- **Low risk**: normal recommendations; weighted options allowed if explicitly
  requested.

## Error handling

- No network / Gemini error / malformed JSON -> graceful local fallback message
  ("I'm not sure I caught that - try one of these areas") with the chips.
- Empty/whitespace input -> ignored (no message sent).
- The high-risk path never depends on the network or any external service.

## Testing (TDD, Jest)

- `safety.ts`: every high-risk keyword -> blocked and no LLM invoked; medium-risk
  signals -> non-weighted enforced.
- `matcher.ts`: representative phrasings for each body area -> correct area;
  unsure inputs -> unsure.
- schema validation: rejects malformed LLM payloads.
- `engine.ts` routing: high risk never reaches Gemini; weighted only when
  low-risk + explicitly requested; unsure -> fallback path.
- component: a recommendation payload renders the expected stretch cards;
  high-risk response renders the safety message and no cards.

## Out of scope this slice (deferred to later slices)

Accounts / Supabase, routine builder, body-map screen, history persistence,
real animation/video (placeholder images only), profile/settings, full legal
pages (inline disclaimer only), monetization, server-side LLM proxy.

Each becomes its own spec -> plan -> build cycle.
