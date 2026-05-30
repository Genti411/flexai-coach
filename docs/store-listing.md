# Store Listing & Privacy-Form Answers (draft)

Drafts for App Store Connect and Google Play Console. Copy avoids medical/treatment
claims (required by both stores for this category). Review before submitting.

## Name / subtitle
- **App name:** FlexAI Coach
- **Subtitle / short description (<= 30 / 80 chars):** Stretch & mobility coach chat

## Promotional text (App Store, <= 170 chars)
Tell FlexAI Coach where you feel tight or sore and get safe, beginner-friendly
stretch and mobility ideas - with clear safety guidance. Not medical advice.

## Description (both stores)
FlexAI Coach is a friendly, chat-style stretching and mobility guide. Describe where
you feel tension - neck, shoulders, lower back, calves, hamstrings, chest, or after a
workout - and get simple, beginner-friendly stretch and mobility suggestions with
step-by-step instructions and safety tips.

Highlights
- Chat-style: just say what feels tight or sore
- Curated, beginner-friendly stretches with clear steps
- "Make easier / harder" to match your level
- Works offline; no account required
- Privacy first: your chat is never stored

Important: FlexAI Coach provides general fitness and wellness information only. It is
not medical advice and does not diagnose or treat any condition. Stop and consult a
professional for sharp pain, numbness, swelling, injury, or symptoms that worsen.

## Keywords (App Store, <= 100 chars, comma-separated)
stretching,mobility,flexibility,stretch routine,neck,back,hamstring,calf,recovery,warmup

## Category
- Primary: Health & Fitness

## Age rating
- Not directed to children; rate per questionnaire (no objectionable content).

## URLs (fill before submission)
- Privacy policy URL: https://<owner>.github.io/<repo>/#privacy  (enable GitHub Pages)
- Support URL / email: gentian.hoxha91@gmail.com

---

# Apple App Privacy ("nutrition label") - answers

Based on the current build (chat in memory; only consent + optional local profile
stored on device; optional Gemini fallback sends message text only).

- **Data used to track you:** None.
- **Data linked to you:** None.
- **Data not linked to you:** None collected by the developer. The developer operates
  no server and does not receive user data.
- **Third-party processor disclosure:** If the optional AI fallback is enabled, the
  text of an unrecognized message is sent to Google (Gemini API) to generate a
  suggestion. Disclose Google as a processor; no identifiers are sent. If you ship
  with no API key, the fallback is disabled and nothing is transmitted.

Note: on-device-only storage (consent flag, profile preferences) is generally not
"collection" under Apple's definition because it is not transmitted off device.
Confirm against current App Store guidance at submission time.

---

# Google Play Data Safety - answers

- **Does your app collect or share user data?** The developer does not collect or
  receive user data. Data stays on the device, except the optional AI fallback.
- **Data types:** If the AI fallback is enabled, "Other user-generated content" (the
  message text) is **transferred** to Google for processing; not stored by the
  developer. Otherwise: none.
- **Is data encrypted in transit?** Yes (HTTPS).
- **Can users request deletion?** Yes - Delete my data clears all on-device data;
  nothing is held server-side to delete.
- **Permissions:** No location, contacts, camera, microphone, or photo permissions.
- **Health declaration:** General fitness/wellness info; no medical claims; privacy
  policy URL provided.
