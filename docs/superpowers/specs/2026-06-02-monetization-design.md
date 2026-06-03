# FlexAI Coach - Monetization (Gear & Support) Slice

Date: 2026-06-02
Status: Approved (autonomous build) - implemented
Slice: 8

## Goal

Lay down honest monetization scaffolding without faking payments: a Gear & Support
screen with affiliate gear recommendations (with disclosure) and a "Premium coming
soon" feature list.

## Honest boundary

Real revenue requires Apple/Google in-app purchase or a payment processor plus the
developer's store/business accounts and tax/banking setup - all human-gated, like
the launch steps. This slice ships only what is buildable and truthful: affiliate
links (placeholder URLs to replace) and a description of planned premium features.
No fake checkout, no premium entitlement gating.

## Design

- `src/lib/gear.ts` - `GearItem[]` (foam roller, yoga mat, massage ball, resistance
  band, light dumbbells) with placeholder shop URLs, plus a `PREMIUM_FEATURES` list.
- `src/app/support.tsx` - "Gear & support" screen: affiliate disclosure + "not
  medical devices" note, the gear list (each with a Shop link via `Linking.openURL`),
  and a "Premium (coming soon)" section stating the app is fully free today.
- `src/app/index.tsx` - a "Gear" header link; header links now wrap (six items).

## Compliance with the brief

- Affiliate disclosure shown. Gear framed as "general fitness accessories, not
  medical devices" (the brief forbids recommending medical devices/supplements
  without disclaimers; no supplements or devices are recommended).
- No medical claims. Premium is clearly "coming soon," not sold.

## Out of scope

In-app purchase / Stripe integration, premium entitlement gating, business/clinic
portal, real affiliate accounts.

## Testing

- `gear.ts`: five items with valid https urls; premium list non-empty.
- `support.tsx`: renders gear, the affiliate disclosure, the "not medical devices"
  note, and the premium section.
