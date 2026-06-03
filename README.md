# FlexAI Coach

A free-to-run, ChatGPT-style stretching and mobility assistant. Describe where you
feel tension and the app suggests safe, beginner-friendly stretches as cards, with
on-device safety guardrails. Not medical advice.

Built with Expo (SDK 56), expo-router, React Native, and TypeScript.

## How it works

- **On-device first.** A deterministic safety classifier runs before anything else;
  high-risk input (chest pain, numbness, injury, etc.) is blocked from receiving
  exercises. Known body areas (neck, lower back, calf, shoulders, hamstrings, chest,
  post-workout) are answered from a curated offline dataset.
- **Optional AI fallback.** Only when the on-device matcher is unsure does the app
  send that one message's text to Google's Gemini free tier. With no key configured,
  the app still works fully offline; the fallback just degrades to a prompt to pick
  an area.
- **Privacy by design.** Chat is in memory only and never persisted. The only stored
  data is a consent record and optional profile preferences, kept on-device.

## Run it (free)

```bash
npm install
npm run web      # browser
npm run ios      # iOS simulator / Expo Go
npm run android  # Android emulator / Expo Go
```

Optional AI fallback: copy `.env.example` to `.env` and set a free Google AI Studio
key:

```
EXPO_PUBLIC_GEMINI_API_KEY=your_free_restricted_key
```

Leave it empty to run entirely offline.

Optional accounts/cloud sync: create a Supabase project, run
`supabase/migrations/0001_user_data.sql`, and set EXPO_PUBLIC_SUPABASE_URL and
EXPO_PUBLIC_SUPABASE_ANON_KEY in .env. Without these, the app stays local-only and
the Account screen shows "not configured".

## Test & verify

```bash
npm test                       # unit + component tests
npx tsc --noEmit               # type check
npx expo export --platform web # production bundle (sanity build)
```

## Safety, privacy, security, copyright

- Medical disclaimer, privacy policy, terms of use, copyright policy:
  `docs/legal/` (also surfaced in-app under **Legal & Safety**). These are
  **attorney-review drafts**, not legal advice.
- Public privacy-policy URL (for store submission), live via GitHub Pages:
  https://genti411.github.io/flexai-coach-legal/#privacy
  (served from the separate public `flexai-coach-legal` repo; this app's source
  stays private. Re-push `legal-site/index.html` there when content changes.)
- Security policy and API-key posture: `SECURITY.md`.
- Content license register: `docs/legal/content-licenses.md`.
- Pre-launch checklist (App Store + Google Play): `docs/compliance-checklist.md`.

## Project docs

- Design specs: `docs/superpowers/specs/`
- Implementation plan: `docs/superpowers/plans/`
- Known issues / follow-ups: `docs/superpowers/KNOWN_ISSUES.md`

## Status

MVP chat-to-stretch core plus the legal/privacy/consent/security layer are complete
and verified (type-checked, tested, and the web target bundles). Remaining work to
publish requires actions only the developer can take: attorney review of the legal
drafts, hosting the privacy policy at a public URL, Apple/Google developer accounts,
store listings, and native builds. See `docs/compliance-checklist.md`.

## Not in this version

Accounts, routine builder, body-map screen, saved history, bundled media/animations,
monetization, and a server-side LLM proxy are intentionally deferred to later slices.
