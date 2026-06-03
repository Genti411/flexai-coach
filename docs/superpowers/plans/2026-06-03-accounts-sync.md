# Optional Accounts & Cloud Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or executing-plans. Checkbox steps.

**Goal:** Optional Supabase account with explicit Back up / Restore of routines, history, and profile. No account stays the default; the app is fully functional and graceful when Supabase is not configured.

**Architecture:** A guarded `supabase` client (null when env is unset). Thin `auth.ts` (email OTP) and `sync.ts` (push/pull via dependency injection so it is unit-testable). Local stores gain `replace*` setters for restore. An opt-in `account.tsx` screen. SQL migration + RLS. Privacy copy updated.

**Tech Stack:** Expo SDK 56, @supabase/supabase-js, react-native-url-polyfill, AsyncStorage, expo-router, TypeScript, Jest. `@/` -> `src/`.

---

## Task 1: Dependencies + guarded Supabase client

**Files:** `package.json` (via expo install), `jest.config.js`, Create `src/lib/supabase.ts`, `tests/lib/supabase.test.ts`

- [ ] **Step 1: Install deps** — `npx expo install @supabase/supabase-js react-native-url-polyfill`

- [ ] **Step 2: Allow supabase in jest transforms** — in `jest.config.js`, add `@supabase/.*` to the `transformIgnorePatterns` negative-lookahead group (keep all existing entries). The group should include: `...|react-native-url-polyfill|react-native-svg|react-native-reanimated|react-native-worklets|@supabase/.*`.

- [ ] **Step 3: Failing test** — `tests/lib/supabase.test.ts`:

```ts
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

describe('supabase client', () => {
  it('is unconfigured (null) when env vars are absent', () => {
    expect(isSupabaseConfigured).toBe(false);
    expect(supabase).toBeNull();
  });
});
```

- [ ] **Step 4: Run red** — `npm test -- supabase` → FAIL (module missing).

- [ ] **Step 5: Implement `src/lib/supabase.ts`**

```ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
    })
  : null;

if (supabase) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
```

- [ ] **Step 6: Run green** — `npm test -- supabase` → PASS. `npx tsc --noEmit` → clean.
- [ ] **Step 7: Commit** — `git add package.json package-lock.json jest.config.js src/lib/supabase.ts tests/lib/supabase.test.ts && git commit -m "feat(account): add guarded Supabase client"`

---

## Task 2: Auth helpers

**Files:** Create `src/lib/auth.ts`, `tests/lib/auth.test.ts`

- [ ] **Step 1: Failing test** — `tests/lib/auth.test.ts`:

```ts
import { getSession, sendCode } from '@/lib/auth';

describe('auth (unconfigured env)', () => {
  it('getSession returns null when Supabase is not configured', async () => {
    expect(await getSession()).toBeNull();
  });
  it('sendCode reports not configured', async () => {
    const r = await sendCode('a@b.com');
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run red** — `npm test -- auth` → FAIL.

- [ ] **Step 3: Implement `src/lib/auth.ts`**

```ts
import { supabase } from '@/lib/supabase';

export type Result = { ok: true } | { ok: false; error: string };

export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function sendCode(email: string): Promise<Result> {
  if (!supabase) return { ok: false, error: 'Cloud sync is not configured' };
  const { error } = await supabase.auth.signInWithOtp({ email });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function verifyCode(email: string, token: string): Promise<Result> {
  if (!supabase) return { ok: false, error: 'Cloud sync is not configured' };
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function signOut(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
}
```

- [ ] **Step 4: Run green** — `npm test -- auth` → PASS.
- [ ] **Step 5: Commit** — `git add src/lib/auth.ts tests/lib/auth.test.ts && git commit -m "feat(account): add email-OTP auth helpers"`

---

## Task 3: Local replace setters

**Files:** Modify `src/lib/routines.ts`, `src/lib/history.ts`, Test additions

- [ ] **Step 1: Failing tests** — add to `tests/lib/routines.test.ts`:

```ts
import { replaceRoutines } from '@/lib/routines';
it('replaceRoutines overwrites the stored list', async () => {
  await addToRoutine('A', rec('x'));
  await replaceRoutines([]);
  expect(await getRoutines()).toEqual([]);
});
```

and to `tests/lib/history.test.ts`:

```ts
import { replaceHistory } from '@/lib/history';
it('replaceHistory overwrites and caps at 50', async () => {
  await replaceHistory(Array.from({ length: 60 }, (_, i) => ({ ts: 't', query: `q${i}`, bodyArea: 'neck', count: 1 })));
  expect(await getHistory()).toHaveLength(50);
});
```

- [ ] **Step 2: Run red** — `npm test -- "routines.test|history.test"` → FAIL.

- [ ] **Step 3: Implement** — add to `src/lib/routines.ts`:

```ts
export async function replaceRoutines(routines: Routine[]): Promise<void> {
  await AsyncStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
}
```

add to `src/lib/history.ts`:

```ts
export async function replaceHistory(entries: HistoryEntry[]): Promise<void> {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX)));
}
```

- [ ] **Step 4: Run green** — `npm test -- "routines.test|history.test"` → PASS.
- [ ] **Step 5: Commit** — `git add src/lib/routines.ts src/lib/history.ts tests/lib/routines.test.ts tests/lib/history.test.ts && git commit -m "feat(account): add replace setters for restore"`

---

## Task 4: Sync (push / pull) with dependency injection

**Files:** Create `src/lib/sync.ts`, `tests/lib/sync.test.ts`

- [ ] **Step 1: Failing test** — `tests/lib/sync.test.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { backupToCloud, restoreFromCloud } from '@/lib/sync';
import { addToRoutine, getRoutines } from '@/lib/routines';

beforeEach(async () => { await AsyncStorage.clear(); });

const recX = {
  name: 'a', type: 'mobility' as const, target_muscles: ['x'], instructions: ['a'], sets: 1, reps: 1,
  duration: '5s', equipment: 'none', weighted: false, difficulty: 'beginner' as const, safety_notes: ['n'], media_prompt: 'p',
};

function fakeClient(opts: { cloud?: any }) {
  const captured: any = {};
  return {
    captured,
    auth: { getUser: async () => ({ data: { user: { id: 'u1', email: 'e@x.com' } } }) },
    from() {
      return {
        upsert: async (row: any) => { captured.upserted = row; return { error: null }; },
        select() { return this; },
        eq() { return this; },
        single: async () => ({ data: opts.cloud ?? null, error: null }),
      };
    },
  } as any;
}

describe('sync', () => {
  it('backupToCloud upserts the local data for the signed-in user', async () => {
    await addToRoutine('R', recX);
    const client = fakeClient({});
    const r = await backupToCloud(client);
    expect(r.ok).toBe(true);
    expect(client.captured.upserted.user_id).toBe('u1');
    expect(client.captured.upserted.routines[0].name).toBe('R');
  });

  it('restoreFromCloud writes cloud data into local stores', async () => {
    const client = fakeClient({ cloud: { routines: [{ id: 'r1', name: 'Cloud', createdAt: 't', items: [recX] }], history: [], profile: {} } });
    const r = await restoreFromCloud(client);
    expect(r.ok).toBe(true);
    expect((await getRoutines())[0].name).toBe('Cloud');
  });

  it('fails gracefully with no client', async () => {
    expect((await backupToCloud(null)).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run red** — `npm test -- sync` → FAIL.

- [ ] **Step 3: Implement `src/lib/sync.ts`**

```ts
import type { SupabaseClient } from '@supabase/supabase-js';

import { getHistory, replaceHistory } from '@/lib/history';
import { getRoutines, replaceRoutines } from '@/lib/routines';
import { getProfile, setProfile } from '@/lib/store';
import { supabase } from '@/lib/supabase';

export type SyncResult = { ok: true } | { ok: false; error: string };

const TABLE = 'user_data';

export async function backupToCloud(client: SupabaseClient | null = supabase): Promise<SyncResult> {
  if (!client) return { ok: false, error: 'Cloud sync is not configured' };
  const { data } = await client.auth.getUser();
  const user = data?.user;
  if (!user) return { ok: false, error: 'Not signed in' };
  const [routines, history, profile] = await Promise.all([getRoutines(), getHistory(), getProfile()]);
  const { error } = await client
    .from(TABLE)
    .upsert({ user_id: user.id, routines, history, profile, updated_at: new Date().toISOString() });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function restoreFromCloud(client: SupabaseClient | null = supabase): Promise<SyncResult> {
  if (!client) return { ok: false, error: 'Cloud sync is not configured' };
  const { data: userData } = await client.auth.getUser();
  const user = userData?.user;
  if (!user) return { ok: false, error: 'Not signed in' };
  const { data, error } = await client.from(TABLE).select('routines,history,profile').eq('user_id', user.id).single();
  if (error) return { ok: false, error: error.message };
  if (data) {
    await replaceRoutines(data.routines ?? []);
    await replaceHistory(data.history ?? []);
    await setProfile(data.profile ?? {});
  }
  return { ok: true };
}
```

- [ ] **Step 4: Run green** — `npm test -- sync` → PASS.
- [ ] **Step 5: Commit** — `git add src/lib/sync.ts tests/lib/sync.test.ts && git commit -m "feat(account): add back up / restore sync"`

---

## Task 5: Account screen + header link

**Files:** Create `src/app/account.tsx`, modify `src/app/index.tsx`, Test `tests/app/account.test.tsx`

- [ ] **Step 1: Failing test** — `tests/app/account.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';

import AccountScreen from '@/app/account';

describe('AccountScreen', () => {
  it('shows the not-configured state when Supabase is unset', async () => {
    render(<AccountScreen />);
    expect(await screen.findByText(/not configured/i)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run red** — `npm test -- account` → FAIL.

- [ ] **Step 3: Implement `src/app/account.tsx`**

```tsx
import type { Session } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { getSession, sendCode, signOut, verifyCode } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { backupToCloud, restoreFromCloud } from '@/lib/sync';
import { useTheme } from '@/hooks/use-theme';

export default function AccountScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    getSession().then(setSession);
  }, []);

  const doSend = async () => {
    const r = await sendCode(email.trim());
    setStatus(r.ok ? 'Code sent. Check your email.' : r.error);
    if (r.ok) setCodeSent(true);
  };
  const doVerify = async () => {
    const r = await verifyCode(email.trim(), code.trim());
    if (r.ok) {
      setSession(await getSession());
      setStatus('Signed in.');
      setCode('');
      setCodeSent(false);
    } else setStatus(r.error);
  };
  const doBackup = async () => {
    const r = await backupToCloud();
    setStatus(r.ok ? 'Backed up to cloud.' : r.error);
  };
  const doRestore = async () => {
    const r = await restoreFromCloud();
    setStatus(r.ok ? 'Restored from cloud.' : r.error);
  };
  const doSignOut = async () => {
    await signOut();
    setSession(null);
    setStatus('Signed out.');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <ThemedText type="link">{'‹'} Back</ThemedText>
      </Pressable>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Account</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Optional. The app works fully without an account. Sign in only if you want to back up your routines and history across devices.
        </ThemedText>

        {!isSupabaseConfigured ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.h}>
            Cloud sync is not configured in this build. Accounts become available once the developer sets up Supabase.
          </ThemedText>
        ) : session ? (
          <View style={styles.section}>
            <ThemedText type="smallBold">Signed in as {session.user.email}</ThemedText>
            <Pressable onPress={() => void doBackup()} style={[styles.btn, { backgroundColor: theme.accent }]}>
              <ThemedText type="small" themeColor="accentText">Back up to cloud</ThemedText>
            </Pressable>
            <Pressable onPress={() => void doRestore()} style={[styles.btn, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="small">Restore from cloud (replaces local)</ThemedText>
            </Pressable>
            <Pressable onPress={() => void doSignOut()} style={[styles.btn, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="small" themeColor="danger">Sign out</ThemedText>
            </Pressable>
          </View>
        ) : (
          <View style={styles.section}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
            <Pressable onPress={() => void doSend()} style={[styles.btn, { backgroundColor: theme.accent }]}>
              <ThemedText type="small" themeColor="accentText">Send sign-in code</ThemedText>
            </Pressable>
            {codeSent && (
              <>
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="6-digit code"
                  keyboardType="number-pad"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                />
                <Pressable onPress={() => void doVerify()} style={[styles.btn, { backgroundColor: theme.accent }]}>
                  <ThemedText type="small" themeColor="accentText">Verify & sign in</ThemedText>
                </Pressable>
              </>
            )}
          </View>
        )}
        {status && <ThemedText type="small" themeColor="accent" style={styles.h}>{status}</ThemedText>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  back: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  content: { padding: Spacing.three, gap: Spacing.one },
  h: { marginTop: Spacing.three },
  section: { gap: Spacing.two, marginTop: Spacing.two },
  input: { borderRadius: 12, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  btn: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999, alignSelf: 'flex-start' },
});
```

- [ ] **Step 4: Header link** — inside `headerLinks` in `src/app/index.tsx`, add after the Gear link:

```tsx
            <Link href="/account" asChild>
              <Pressable><ThemedText type="link">Account</ThemedText></Pressable>
            </Link>
```

- [ ] **Step 5: Run green** — `npm test -- account` → PASS. `npx tsc --noEmit` → clean.
- [ ] **Step 6: Commit** — `git add src/app/account.tsx src/app/index.tsx tests/app/account.test.tsx && git commit -m "feat(account): add opt-in Account screen and header link"`

---

## Task 6: SQL migration, env, privacy copy, README

**Files:** Create `supabase/migrations/0001_user_data.sql`, modify `.env.example`, `src/content/legal.ts`, `docs/legal/privacy-policy.md`, `legal-site/index.html`, `README.md`

- [ ] **Step 1: Migration `supabase/migrations/0001_user_data.sql`**

```sql
-- One JSONB row per user holding their synced app data.
create table if not exists public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  routines jsonb not null default '[]'::jsonb,
  history jsonb not null default '[]'::jsonb,
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

create policy "user_data_select_own" on public.user_data
  for select using (auth.uid() = user_id);
create policy "user_data_insert_own" on public.user_data
  for insert with check (auth.uid() = user_id);
create policy "user_data_update_own" on public.user_data
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

- [ ] **Step 2: `.env.example`** — append:

```
# Optional account / cloud sync (Supabase). Leave unset to keep the app local-only.
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 3: Privacy copy** — in `src/content/legal.ts` PRIVACY_POLICY "Data that leaves your device" section body, append:

```
 If you create an optional account and tap Back up, your routines, history, and preferences are stored in your own private row in the app's Supabase database (protected so only you can read it) until you delete them. Accounts are entirely optional; without one, nothing syncs.
```

In `docs/legal/privacy-policy.md` under "Data that leaves your device", add a bullet:

```
- if you create an **optional account** and tap **Back up**, your routines, history,
  and preferences are stored in your own row-level-secured record in the app's
  Supabase project until you delete them. No account = no sync.
```

In `legal-site/index.html`, append the same sentence (as the legal.ts change) to the "Data that leaves your device" paragraph.

- [ ] **Step 4: README** — under "Run it (free)" add a note:

```
Optional accounts/cloud sync: create a Supabase project, run
`supabase/migrations/0001_user_data.sql`, and set EXPO_PUBLIC_SUPABASE_URL and
EXPO_PUBLIC_SUPABASE_ANON_KEY in .env. Without these, the app stays local-only and
the Account screen shows "not configured".
```

- [ ] **Step 5: Verify + commit** — `npm test` (legal tests unaffected), `npx tsc --noEmit` clean.
`git add supabase .env.example src/content/legal.ts docs/legal/privacy-policy.md legal-site/index.html README.md && git commit -m "docs(account): add SQL migration, env, and privacy disclosure for cloud sync"`

---

## Task 7: Full verification

- [ ] `npx tsc --noEmit` → clean.
- [ ] `npm test` → all suites pass (prior 104 + supabase + auth + replace setters + sync + account).
- [ ] `npx expo export --platform web` → bundles; `/account` route present.

---

## Self-Review Notes

- **Spec coverage:** guarded client (T1), email-OTP auth (T2), restore setters (T3), push/pull sync with DI (T4), Account screen + nav (T5), SQL+RLS+env+privacy+README (T6).
- **Graceful unconfigured:** `supabase` is null with no env; auth/sync/account all report "not configured"; the rest of the app is unaffected and tests run in this unconfigured state.
- **Type consistency:** `isSupabaseConfigured`, `supabase` (supabase.ts); `getSession`/`sendCode`/`verifyCode`/`signOut` (auth.ts); `backupToCloud`/`restoreFromCloud` (sync.ts, DI param defaults to `supabase`); `replaceRoutines`/`replaceHistory` (stores).
- **Privacy:** opt-in; per-user RLS row; disclosed in all privacy copy; local Delete/sign-out remain.
- **Out of scope:** real-time sync, conflict resolution, password/Apple/Google auth.
- **Activation is a documented developer step** (Supabase project + migration + env), like the Gemini key.
