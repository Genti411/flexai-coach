# Known Issues / Follow-ups

Deferred findings from the MVP code review (2026-05-29). None is a safety hole;
all are over-blocking (conservative) or cosmetic. Address before public release.

## Safety keyword false-positives (over-blocking)

`src/core/safety.ts` matches bare substrings, which conservatively over-blocks:

- **"fall" / "fell"** — matches the season ("this fall") or "fell" inside other
  words. Consider injury-context phrasing ("after a fall", "from a fall") or word
  boundaries.
- **"injury" / "injured"** — fires on historical injuries ("I had a knee injury
  years ago, healed fine"), giving the emergency response to the app's core
  audience. Consider "recent injury" / "new injury" phrasing, or a softer
  medium-risk response for injury history rather than the emergency block.
- **"persistent"** — matches "not persistent" / "non-persistent". Low impact
  (medium risk only adds a disclaimer note).

Direction of all three is safe (over-block, never under-block). Any change must
keep tests in `tests/core/safety.test.ts` green and not introduce under-blocking.

## UI

- **Dead `bodyArea` parameter** — `MessageBubble`'s `onEasier`/`onHarder` declare
  `(bodyArea: string)` but `index.tsx` ignores it; `adjust` always re-queries the
  last typed input. Spec-compliant but misleading; either use the per-card area or
  drop the parameter.

## Resolved in commit cebbd0f

- LLM self-reporting `risk_level: 'high'` with recommendations now hard-blocks.
- Concurrent sends serialized via a busy ref + disabled send button.
