# Security Policy

## Reporting a vulnerability

Please report security issues privately to {{SECURITY_CONTACT_EMAIL}}. Do not open a
public issue for security problems. We aim to acknowledge reports within a few
business days.

## Data handling summary

- Chat content is processed in memory only and is never persisted or sent to our
  servers (we operate no server in this version).
- The only on-device storage is a consent record and optional, non-sensitive
  profile preferences.
- Outbound network calls occur only for the optional AI fallback (to Google's
  Gemini API over HTTPS), and only when the on-device matcher is unsure.

## API key posture (Gemini fallback)

This build reads the Gemini key from `EXPO_PUBLIC_GEMINI_API_KEY`. The `EXPO_PUBLIC_`
prefix means the value is embedded in the client bundle and is therefore **not
secret**. This is an accepted tradeoff for a free, rate-limited Google AI Studio key
used only for the fallback path:

- The app is fully functional with **no key** (the on-device engine handles known
  inputs; the fallback simply degrades to a "tell me which area" message).
- Use a **restricted, free-tier** key; do not use a billable or unrestricted key.
- Apply API key restrictions in Google Cloud / AI Studio (application and API
  restrictions) and monitor quota.

### Upgrade path before scaling

For a public launch at scale, move the Gemini call behind a server-side proxy
(e.g., a free-tier serverless function) so the key is not shipped in the client.
The client `LlmClient` interface already isolates this; only `gemini.ts` and the
client's base URL need to change.

## Secrets hygiene

- `.env` is git-ignored; only `.env.example` (no real values) is committed.
- No secrets are committed to the repository.

## Dependency audit

`npm audit` (2026-05-30): 11 moderate, 0 high, 0 critical. All stem from a single
advisory - `uuid` < 11.1.1 (GHSA-w5hq-g745-h8pq, a missing buffer bounds check in
uuid v3/v5/v6 when a `buf` argument is supplied) - pulled in transitively through
Expo's **build tooling** (`xcode` -> `@expo/config-plugins` -> `@expo/cli` ->
`expo`). This code runs only during local development and native builds; it is not
part of the runtime bundle shipped to users, and the app does not call uuid with a
`buf` argument. The only automated remediation (`npm audit fix --force`) downgrades
Expo to v46, an unacceptable breaking change. Resolution path: upgrade Expo when an
SDK that pins `uuid` >= 11.1.1 in its toolchain is released. Re-run `npm audit` at
each build and reassess if any high/critical appears or a non-breaking fix becomes
available.
