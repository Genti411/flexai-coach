# App Store & Google Play Compliance Checklist

_Last updated: 2026-05-30. Status legend: [x] done in repo · [ ] developer action needed before submission._

## Legal & disclosures
- [x] Medical disclaimer authored (`docs/legal/medical-disclaimer.md`) and shown in-app
- [x] Privacy policy authored (`docs/legal/privacy-policy.md`)
- [x] Terms of use authored (`docs/legal/terms-of-use.md`)
- [x] Copyright policy + takedown process (`docs/legal/copyright-policy.md`)
- [x] Content license register (`docs/legal/content-licenses.md`)
- [x] First-run consent gate (disclaimer + privacy) in-app
- [ ] Attorney reviews all legal documents and fills `{{PLACEHOLDERS}}`
- [ ] Host the privacy policy at a public URL (required by both stores)

## Apple App Store
- [ ] App Privacy "nutrition label" completed in App Store Connect. Declare: data
      **not** collected by the developer (chat in-memory; consent/preferences local).
      If the AI fallback is enabled, disclose Gemini as a third-party processor.
- [ ] Health-related content reviewed against App Review Guideline 1.4 (physical
      harm) and 5.1 (privacy). Disclaimer and "stop / seek care" language present.
- [ ] No use of HealthKit (none used). If added later, follow HealthKit rules.
- [ ] Support URL and marketing copy avoid medical/treatment claims.
- [ ] Age rating set appropriately (not directed to children).

## Google Play
- [ ] Data safety form completed (mirror the privacy policy: minimal local data,
      optional Gemini transmission of message text).
- [ ] Health apps / sensitive data: confirm no disallowed health claims; provide
      privacy policy URL; complete any required Health declaration.
- [ ] Target API level meets current Play requirement (Expo SDK 56 default).
- [ ] Permissions: confirm the build requests no location/contacts/camera/mic.

## Privacy controls (in-app)
- [x] Use without an account
- [x] Export my data (local JSON)
- [x] Delete my data (clears local storage)
- [x] Chat never persisted

## Security
- [x] `.env` git-ignored; no secrets committed
- [x] `SECURITY.md` with disclosure contact + key posture
- [x] `npm audit` reviewed (2026-05-30): 11 moderate, 0 high/critical; all transitive Expo build tooling (`uuid` via `xcode`/`@expo/cli`), not in runtime bundle, no non-breaking fix (see SECURITY.md). Re-check each build.
- [ ] If scaling: move Gemini behind a server-side proxy (see SECURITY.md)
- [ ] Restrict the Gemini free-tier key in Google AI Studio / Cloud

## Copyright
- [x] No third-party media bundled
- [x] Generated-media policy (no logos/brands/likenesses/styles)
- [x] Takedown contact published
- [ ] Keep `content-licenses.md` updated as media is added

## Build / submission (developer accounts required)
- [ ] Apple Developer Program + Google Play Console accounts
- [ ] App icons, splash, screenshots, store listing (no medical claims)
- [ ] EAS/native builds produced and tested on device
- [ ] Store review submitted
