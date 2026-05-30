# Privacy Policy

_Last updated: 2026-05-30_

> **Draft for attorney review.** This template is aligned to FTC guidance, the FTC
> Health Breach Notification Rule context, HIPAA applicability considerations, and
> Apple App Store and Google Play privacy expectations. It is not legal advice. Have
> a licensed attorney review and adapt it, and confirm the factual statements match
> your final build, before publishing.

## Our approach: privacy by design

FlexAI Coach ("the app", "we") is built to collect as little data as possible. You
can use the app's core features **without creating an account**. We treat anything
you type about pain, soreness, injuries, or body areas as **sensitive information**
and handle it accordingly.

## What we collect and store

**Chat content is not stored.** The messages you type and the suggestions you
receive exist only in memory while the app is open. They are not written to disk,
not saved to any server, and are gone when you close the app.

The **only** information the app stores on your device is:

- a **consent record** (that you accepted this policy and the medical disclaimer,
  plus the date) - this is not health information; and
- optional **profile preferences** you choose to set (for example, fitness level or
  goals) - stored locally on your device only.

We do **not** collect your name, email, contacts, photos, microphone, camera, or
precise location. We do not require any account.

## Data that leaves your device

The app works fully offline using an on-device library of stretches. In one
situation only - when the on-device matcher cannot confidently understand your
request - the app may send the **text of that single message** to Google's Gemini
API to generate a suggestion. In that case:

- only the message text is sent; no identifiers, profile data, or history are sent;
- Google processes the request under its own terms and privacy policy;
- this fallback is the only outbound transmission of your input, and it does not
  occur for inputs the app recognizes locally;
- if no AI key is configured in the build, this fallback is disabled entirely and
  no chat content ever leaves your device.

We do not use advertising networks, and we do **not** sell or share your personal or
health information with advertisers or data brokers.

## Analytics

This version of the app does not include third-party analytics or tracking SDKs.

## How we use information

The consent record and optional profile preferences are used only to operate the
app on your device (to avoid re-showing consent and to tailor difficulty). They are
not transmitted to us.

## Your controls

- **Export my data:** In Settings, export the locally stored data (consent record
  and profile preferences) as a JSON file you can view or save.
- **Delete my data:** In Settings, delete all locally stored data. This clears your
  consent record and profile preferences from the device.
- **Use without an account:** No account is required for core features.

Because chat is never stored, there is no chat history to export or delete.

## Data retention

Locally stored data (consent record, profile preferences) is retained on your
device until you delete it or uninstall the app. We do not retain copies.

## Security

We use the platform's standard protections for on-device storage. Data sent to the
Gemini fallback is transmitted over encrypted HTTPS. See `SECURITY.md` for our
vulnerability-disclosure process.

## Children's privacy

The app is not directed to children under 13 (or the minimum age in your region).
We do not knowingly collect personal information from children. If the app is used
by a minor, a parent or guardian should review this policy and provide consent as
required by applicable law.

## Legal framework notes (for the developer; remove before publishing if desired)

- **HIPAA:** HIPAA generally applies only when an app works with or on behalf of a
  HIPAA-covered entity or business associate. A standalone consumer app like this is
  typically not covered, but confirm with counsel.
- **FTC Health Breach Notification Rule:** This rule can apply to health apps not
  covered by HIPAA. Because the app does not store or transmit identifiable health
  records to us, exposure is minimized, but confirm applicability with counsel.
- **State privacy laws:** Some states grant rights to access, delete, and opt out.
  The Export/Delete controls support these; confirm specific obligations.

## Changes

We may update this policy. Material changes will be reflected by the "Last updated"
date and surfaced in the app.

## Contact

Privacy questions or requests: {{CONTACT_EMAIL}}
