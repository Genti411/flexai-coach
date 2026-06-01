# App Store & Google Play Compliance Checklist

_Last updated: 2026-05-30. Status legend: [x] done in repo · [ ] developer action needed before submission._

## Legal & disclosures
- [x] Medical disclaimer authored (`docs/legal/medical-disclaimer.md`) and shown in-app
- [x] Privacy policy authored (`docs/legal/privacy-policy.md`)
- [x] Terms of use authored (`docs/legal/terms-of-use.md`)
- [x] Copyright policy + takedown process (`docs/legal/copyright-policy.md`)
- [x] Content license register (`docs/legal/content-licenses.md`)
- [x] First-run consent gate (disclaimer + privacy) in-app
- [~] Placeholders pre-filled with best-effort values (owner: Gentian Hoxha; contact: gentian.hoxha91@gmail.com; governing law: State of New York, US, inferred from timezone). **Confirm/replace these and have an attorney review all legal documents before publishing.** A dedicated support address is recommended over a personal email.
- [x] Public privacy-policy URL is **LIVE**: https://genti411.github.io/flexai-coach-legal/#privacy
      (served from the public `Genti411/flexai-coach-legal` repo via GitHub Pages; app
      source stays private). Source for that page: `legal-site/index.html` here - re-push
      it to the legal repo when the content changes.

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
- [x] App icons + splash + favicon generated (`assets/images/`, via `scripts/gen-icons.js`) and wired in `app.json` (placeholder art - swap for designed artwork before submission)
- [x] Native build identifiers set: `ios.bundleIdentifier` + `android.package` = `com.flexaicoach.app` (rename if desired before first submission - these are permanent)
- [x] `eas.json` build profiles (development/preview/production)
- [x] Web target verified to bundle (`npx expo export --platform web`)
- [ ] Apple Developer Program + Google Play Console accounts (paid; identity required)
- [ ] Run `eas build` (needs an Expo account login) and test on device
- [ ] Store screenshots + listing copy (no medical/treatment claims)
- [ ] Store review submitted
