# FlexAI Coach - Launch-Readiness Slice (Legal, Privacy, Security, Copyright)

Date: 2026-05-30
Status: Complete (developer-controllable items). Verified: tsc clean, 61 tests pass,
web target bundles. Remaining items are human-only (attorney review, privacy-policy
hosting, Apple/Google accounts, native builds) - see docs/compliance-checklist.md.
Slice: 2 (builds on the chat-to-stretch MVP, slice 1)

## Goal

Bring the app to a launchable posture: surface required legal/compliance content
in-app and as publishable documents, add privacy controls (consent, export,
delete), ensure copyright compliance and recordkeeping, and complete a security
pass. Keep the app free to run and privacy-by-design.

## Honest scope boundary

These are thorough, standards-aligned DRAFTS, not legal advice. Every legal
document carries a notice that it requires review by a licensed attorney and that
final App Store / Play Store submission requires the developer's own accounts,
builds, and store review. "Launch-ready" here means: all developer-controllable
legal, privacy, security, and copyright artifacts are in place and the app is
functional and tested.

## Deliverables

### A. Legal content (publishable markdown + in-app)
- `docs/legal/medical-disclaimer.md`
- `docs/legal/privacy-policy.md`
- `docs/legal/terms-of-use.md`
- `docs/legal/copyright-policy.md`
- `src/content/legal.ts` - the same content as typed string constants for in-app
  rendering (single import surface; kept in sync with the markdown).
Content aligned to: FTC Act / FTC Health Breach Notification Rule context, HIPAA
applicability note, Apple App Store and Google Play health/privacy expectations.
Health inputs (pain, soreness, body areas) treated as sensitive.

### B. In-app screens & navigation (expo-router)
- Navigation: root Stack with `index` (chat), `legal`, `settings`. Chat gains a
  compact top bar with the app name and links to Settings and Legal. Sub-screens
  show a header with a back affordance.
- `app/legal.tsx` - scrollable screen rendering the four documents in sections.
- `app/settings.tsx` (Profile/Settings) - optional local profile (fitness level,
  goals) stored locally; privacy controls: **Export my data**, **Delete my data**;
  consent status; links to all legal docs. No account required.
- First-run **consent gate**: a one-time screen acknowledging the medical
  disclaimer + privacy policy before using chat. Stores only a consent flag +
  timestamp (not health data) in AsyncStorage.

### C. Privacy / data model
- Still privacy-by-design: chat remains in-memory, never persisted.
- The ONLY persisted data: a consent record and optional profile preferences
  (fitness level, goals) - non-sensitive, local-only, never transmitted.
- Export my data: serialize the local store to JSON and share/show it.
- Delete my data: clear AsyncStorage and reset consent.
- Data flow documented in the privacy policy, including that free-text chat is sent
  to Google's Gemini API ONLY on the unsure-input fallback, and how to avoid it.

### D. Copyright
- All shipped content is original text (stretch instructions) or AI-generated
  media described by `media_prompt` fields that explicitly avoid logos, brands,
  and copyrighted styles. No third-party media is bundled.
- `docs/legal/content-licenses.md` - a content license register (recordkeeping).
- Copyright policy includes a takedown/contact process.
- No user uploads in this slice (so no user-generated infringement surface).

### E. Security
- Verify `.env` is gitignored and no secret is committed; scan history.
- `npm audit` - record and remediate where a non-breaking fix exists.
- `SECURITY.md` - vulnerability disclosure contact + the Gemini key posture.
- Gemini key: keep the free, rate-limited direct-call posture (per slice-1
  decision) but document the exposure tradeoff and the proxy upgrade path; ensure
  the app is fully functional with NO key (offline local engine).
- `docs/compliance-checklist.md` - App Store + Google Play submission checklist.

## Testing
- tsc clean; existing 55 tests stay green.
- Unit tests for the new local store (consent set/get, export shape, delete clears).
- Component test: consent gate blocks chat until accepted; settings renders the
  controls.

## Out of scope (later slices)
Accounts/auth, routine builder, body map, history, real bundled media/animations,
monetization, server-side LLM proxy, analytics.
