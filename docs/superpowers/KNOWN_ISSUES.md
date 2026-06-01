# Known Issues / Follow-ups

Findings from the MVP code review (2026-05-29) and their status.

## Resolved

- **LLM self-reporting `risk_level: 'high'` with recommendations** (commit cebbd0f) —
  engine now hard-blocks regardless of returned content.
- **Concurrent sends scrambling state** (commit cebbd0f) — `send()` serialized via a
  busy ref + disabled send button.
- **Substring keyword false-positives** — `classifyRisk` now matches on word
  boundaries, so a high-risk keyword is not flagged when it is only a substring of an
  unrelated word ("numb" in "number", "fall" in "fallback"). See
  `tests/core/safety.test.ts`.
- **Dead `bodyArea` parameter** — `MessageBubble`'s `onEasier`/`onHarder` are now
  `() => void`; `adjust` re-queries the last typed input (spec-compliant).

## Open — safety policy decisions (intentional over-blocks for now)

These over-block (conservative, never under-block), so they are not safety holes, but
they degrade UX for the core audience. Each needs a product/design decision before
public release rather than a guess:

- **"fall" as the season / "fall asleep"** — bare `fall`/`fell` still flag high-risk.
  Kept conservative because missing a real fall is worse than over-blocking. A
  context-aware approach ("after a fall", "I fell and...") would reduce false
  positives but risks missing real phrasings; decide deliberately.
- **Historical injury** — "I had a knee injury years ago, healed fine" still triggers
  the emergency response. Options: softer medium-risk handling for past-tense injury,
  or a follow-up clarifying question. Product decision.
- **Negated medium terms** — "not persistent" / "non-persistent" still match
  `persistent`. Low impact (medium only adds a disclaimer note).
