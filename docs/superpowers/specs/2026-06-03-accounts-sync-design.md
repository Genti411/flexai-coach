# FlexAI Coach - Optional Accounts & Cloud Sync Slice

Date: 2026-06-03
Status: Approved (autonomous build)
Slice: 10

## Goal

Add an OPTIONAL account so users can back up and restore their routines, history,
and profile across devices. No account remains the default; the app stays fully
functional offline and local-only unless the user explicitly signs in.

## Honest boundary

The client is fully built here, but activating it requires the developer to create a
Supabase project, run the included SQL migration, and set
`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`. With no config the
Account screen shows "Cloud sync is not configured" and the rest of the app is
unaffected (exactly like the optional Gemini key).

## Design decisions (autonomous)

- Backend: Supabase (matches the developer's `beauty-ai` stack). Auth via **email
  one-time code** (`signInWithOtp` / `verifyOtp`) - no passwords stored.
- Data model: a single `user_data` row per user holding `routines`, `history`, and
  `profile` as JSONB, protected by row-level security (a user can only read/write
  their own row).
- Sync is explicit and safe, not real-time: **Back up to cloud** (push local ->
  cloud, upsert) and **Restore from cloud** (pull cloud -> replace local). Two clear
  buttons; no silent overwrite.
- Graceful when unconfigured: `supabase` is null and `isSupabaseConfigured` is false;
  the Account screen explains this and nothing else changes.

## Privacy

Accounts are opt-in. Routines (saved exercises) and history (queries, itself opt-in)
sync to the user's own Supabase row ONLY after they sign in and tap Back up. This is
disclosed in the privacy copy (it changes the "stays on your device" statement to
"unless you sign in and back up"). Sign-out + local Delete remain available; cloud
deletion is via Restore-then-clear or the developer's data-deletion process.

## Components / files

- `src/lib/supabase.ts` - guarded client (`supabase` or null, `isSupabaseConfigured`).
- `src/lib/__mocks__/supabase.ts` - jest mock; mapped in `jest.config.js`.
- `src/lib/auth.ts` - `getSession`, `sendCode(email)`, `verifyCode(email, token)`, `signOut`.
- `src/lib/sync.ts` - `backupToCloud()` (push), `restoreFromCloud()` (pull -> replace local).
- `src/lib/routines.ts` / `src/lib/history.ts` - add `replaceRoutines(list)` / `replaceHistory(list)` setters for restore.
- `src/app/account.tsx` - the opt-in Account screen (sign-in flow / signed-in actions / unconfigured state).
- `src/app/index.tsx` - "Account" header link.
- `supabase/migrations/0001_user_data.sql` - table + RLS.
- `.env.example`, privacy copy (legal.ts + privacy-policy.md + legal-site), README - document setup.

## Testing

- `supabase.ts`: `isSupabaseConfigured` is false with no env (and the client is null).
- `sync.ts`: with the supabase mock + a fake session, `backupToCloud` upserts the
  local data; `restoreFromCloud` writes cloud data into the local stores.
- `routines.ts`/`history.ts`: `replaceRoutines`/`replaceHistory` overwrite local.
- `account.tsx`: renders the "not configured" state when `isSupabaseConfigured` is
  false (the default in the test/unconfigured environment).

## Out of scope

Real-time sync, conflict resolution beyond last-action-wins, social/profile features,
password auth, Apple/Google sign-in, server-side data-deletion automation.
