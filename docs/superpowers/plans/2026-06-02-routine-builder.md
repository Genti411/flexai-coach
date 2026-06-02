# Routine Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Save stretches into named local routines, view them on a Routines screen, and remove items.

**Architecture:** A local AsyncStorage store (`src/lib/routines.ts`) holds `Routine[]`, each with full `Recommendation` items so cards re-render identically. The stretch card gains a "Save to routine" inline picker; a new `app/routines.tsx` screen lists routines and renders their saved cards (reusing `StretchCard` with adjust controls hidden). Settings export/delete extend to cover routines.

**Tech Stack:** Expo SDK 56, TypeScript, AsyncStorage, Jest. Path alias `@/` -> `src/`.

---

## Task 1: Routines store

**Files:** Create `src/lib/routines.ts`, `tests/lib/routines.test.ts`

- [ ] **Step 1: Failing test**

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addToRoutine, deleteRoutine, getRoutines, removeItem } from '@/lib/routines';
import { Recommendation } from '@/core/types';

const rec = (name: string): Recommendation => ({
  name, type: 'mobility', target_muscles: ['x'], instructions: ['a'], sets: 1, reps: 1,
  duration: '5s', equipment: 'none', weighted: false, difficulty: 'beginner', safety_notes: ['n'], media_prompt: 'p',
});

beforeEach(async () => { await AsyncStorage.clear(); });

describe('routines store', () => {
  it('starts empty', async () => { expect(await getRoutines()).toEqual([]); });

  it('adding creates a new routine with the item', async () => {
    await addToRoutine('Morning', rec('Chin Tucks'));
    const rs = await getRoutines();
    expect(rs).toHaveLength(1);
    expect(rs[0].name).toBe('Morning');
    expect(rs[0].items.map((i) => i.name)).toEqual(['Chin Tucks']);
  });

  it('adding to an existing name (case-insensitive) appends', async () => {
    await addToRoutine('Morning', rec('Chin Tucks'));
    await addToRoutine('morning', rec('Cat-Cow'));
    const rs = await getRoutines();
    expect(rs).toHaveLength(1);
    expect(rs[0].items.map((i) => i.name)).toEqual(['Chin Tucks', 'Cat-Cow']);
  });

  it('ignores blank names', async () => {
    await addToRoutine('   ', rec('x'));
    expect(await getRoutines()).toEqual([]);
  });

  it('removeItem drops one item, deleteRoutine removes the routine', async () => {
    await addToRoutine('R', rec('a'));
    await addToRoutine('R', rec('b'));
    const [{ id }] = await getRoutines();
    await removeItem(id, 0);
    expect((await getRoutines())[0].items.map((i) => i.name)).toEqual(['b']);
    await deleteRoutine(id);
    expect(await getRoutines()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run red** — `npm test -- routines` → FAIL (module missing).

- [ ] **Step 3: Implement `src/lib/routines.ts`**

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Recommendation } from '@/core/types';

export interface Routine {
  id: string;
  name: string;
  createdAt: string;
  items: Recommendation[];
}

export const ROUTINES_KEY = 'flexai:routines';
let seq = 0;
const newId = () => `r${Date.now()}_${seq++}`;

export async function getRoutines(): Promise<Routine[]> {
  const raw = await AsyncStorage.getItem(ROUTINES_KEY);
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as Routine[];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

async function persist(routines: Routine[]): Promise<void> {
  await AsyncStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
}

export async function addToRoutine(name: string, rec: Recommendation): Promise<Routine[]> {
  const trimmed = name.trim();
  if (!trimmed) return getRoutines();
  const routines = await getRoutines();
  const existing = routines.find((r) => r.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) {
    existing.items.push(rec);
  } else {
    routines.push({ id: newId(), name: trimmed, createdAt: new Date().toISOString(), items: [rec] });
  }
  await persist(routines);
  return routines;
}

export async function removeItem(routineId: string, index: number): Promise<Routine[]> {
  const routines = await getRoutines();
  const r = routines.find((x) => x.id === routineId);
  if (r) r.items.splice(index, 1);
  await persist(routines);
  return routines;
}

export async function deleteRoutine(id: string): Promise<Routine[]> {
  const routines = (await getRoutines()).filter((r) => r.id !== id);
  await persist(routines);
  return routines;
}
```

- [ ] **Step 4: Run green** — `npm test -- routines` → PASS.
- [ ] **Step 5: Commit** — `git add src/lib/routines.ts tests/lib/routines.test.ts && git commit -m "feat(routines): add local routines store"`

---

## Task 2: Include routines in Settings export/delete

**Files:** Modify `src/lib/store.ts`, `tests/lib/store.test.ts`

- [ ] **Step 1: Extend the store test (failing)**

Add to `tests/lib/store.test.ts` (it already imports from `@/lib/store` and clears AsyncStorage in `beforeEach`):

```ts
import { addToRoutine } from '@/lib/routines';

it('export includes routines and delete clears them', async () => {
  await addToRoutine('R', {
    name: 'a', type: 'mobility', target_muscles: ['x'], instructions: ['a'], sets: 1, reps: 1,
    duration: '5s', equipment: 'none', weighted: false, difficulty: 'beginner', safety_notes: ['n'], media_prompt: 'p',
  });
  const data = await exportData();
  expect(data.routines).toHaveLength(1);
  await deleteData();
  expect((await exportData()).routines).toEqual([]);
});
```

(Ensure `exportData` and `deleteData` are imported in that test file — they already are.)

- [ ] **Step 2: Run red** — `npm test -- store` → FAIL (`data.routines` undefined).

- [ ] **Step 3: Update `src/lib/store.ts`**

Add the import at the top:

```ts
import { getRoutines, ROUTINES_KEY, type Routine } from '@/lib/routines';
```

Add `routines` to `LocalData`:

```ts
export interface LocalData {
  consent: ConsentRecord;
  profile: ProfilePrefs;
  routines: Routine[];
}
```

Update `exportData` to include routines:

```ts
export async function exportData(): Promise<LocalData> {
  const [consent, profile, routines] = await Promise.all([getConsent(), getProfile(), getRoutines()]);
  return { consent, profile, routines };
}
```

Update `deleteData` to also clear the routines key:

```ts
export async function deleteData(): Promise<void> {
  await AsyncStorage.multiRemove([CONSENT_KEY, PROFILE_KEY, ROUTINES_KEY]);
}
```

- [ ] **Step 4: Run green** — `npm test -- store` → PASS. Also `npm test -- routines` still PASS.
- [ ] **Step 5: Commit** — `git add src/lib/store.ts tests/lib/store.test.ts && git commit -m "feat(routines): include routines in export/delete my data"`

---

## Task 3: Save-to-routine inline picker

**Files:** Create `src/components/save-to-routine.tsx`, `tests/components/save-to-routine.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { SaveToRoutine } from '@/components/save-to-routine';
import { addToRoutine } from '@/lib/routines';

beforeEach(async () => { await AsyncStorage.clear(); });

const recX = {
  name: 'a', type: 'mobility' as const, target_muscles: ['x'], instructions: ['a'], sets: 1, reps: 1,
  duration: '5s', equipment: 'none', weighted: false, difficulty: 'beginner' as const, safety_notes: ['n'], media_prompt: 'p',
};

describe('SaveToRoutine', () => {
  it('lists existing routine names and calls onSave when one is tapped', async () => {
    await addToRoutine('Morning', recX);
    const onSave = jest.fn();
    render(<SaveToRoutine onSave={onSave} />);
    const chip = await screen.findByText('Morning');
    fireEvent.press(chip);
    expect(onSave).toHaveBeenCalledWith('Morning');
  });

  it('creates a new routine name from the input', () => {
    const onSave = jest.fn();
    render(<SaveToRoutine onSave={onSave} />);
    fireEvent.changeText(screen.getByPlaceholderText('New routine name'), 'Evening');
    fireEvent.press(screen.getByText('Create'));
    expect(onSave).toHaveBeenCalledWith('Evening');
  });
});
```

- [ ] **Step 2: Run red** — `npm test -- save-to-routine` → FAIL (module missing).

- [ ] **Step 3: Implement `src/components/save-to-routine.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getRoutines } from '@/lib/routines';

export function SaveToRoutine({ onSave }: { onSave: (name: string) => void }) {
  const theme = useTheme();
  const [names, setNames] = useState<string[]>([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    let active = true;
    getRoutines().then((rs) => active && setNames(rs.map((r) => r.name)));
    return () => {
      active = false;
    };
  }, []);

  const create = () => {
    if (draft.trim()) {
      onSave(draft);
      setDraft('');
    }
  };

  return (
    <View style={styles.wrap}>
      <ThemedText type="small" themeColor="textSecondary">Save to a routine:</ThemedText>
      {names.length > 0 && (
        <View style={styles.row}>
          {names.map((n) => (
            <Pressable key={n} onPress={() => onSave(n)} style={[styles.chip, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="small">{n}</ThemedText>
            </Pressable>
          ))}
        </View>
      )}
      <View style={styles.row}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="New routine name"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
          onSubmitEditing={create}
          returnKeyType="done"
        />
        <Pressable onPress={create} style={[styles.chip, { backgroundColor: theme.accent }]}>
          <ThemedText type="small" themeColor="accentText">Create</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.one, marginTop: Spacing.two },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, alignItems: 'center' },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999 },
  input: { flex: 1, minWidth: 120, borderRadius: 999, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
});
```

- [ ] **Step 4: Run green** — `npm test -- save-to-routine` → PASS.
- [ ] **Step 5: Commit** — `git add src/components/save-to-routine.tsx tests/components/save-to-routine.test.tsx && git commit -m "feat(routines): add save-to-routine inline picker"`

---

## Task 4: Card "Save to routine" + optional adjust controls

**Files:** Modify `src/components/stretch-card.tsx`, `tests/components/stretch-card.test.tsx`

`onEasier`/`onHarder` become optional. When both are provided (chat context) the card shows Make easier/harder AND Save to routine; when absent (routines screen) those are hidden. `message-bubble.tsx` already passes both, so it is unaffected.

- [ ] **Step 1: Extend the test (failing)**

Add these cases to `tests/components/stretch-card.test.tsx` (keep existing ones):

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRoutines } from '@/lib/routines';

it('saves the stretch to a routine via the inline picker', async () => {
  await AsyncStorage.clear();
  render(<StretchCard rec={base} onEasier={() => {}} onHarder={() => {}} />);
  fireEvent.press(screen.getByText('Save to routine'));
  fireEvent.changeText(screen.getByPlaceholderText('New routine name'), 'My Routine');
  fireEvent.press(screen.getByText('Create'));
  // store write is async; allow microtasks to flush
  await new Promise((r) => setTimeout(r, 0));
  const rs = await getRoutines();
  expect(rs[0]?.name).toBe('My Routine');
  expect(rs[0]?.items[0]?.name).toBe('Chin Tucks');
});

it('hides adjust and save controls when no handlers are provided (saved context)', () => {
  render(<StretchCard rec={base} />);
  expect(screen.queryByText('Make easier')).toBeNull();
  expect(screen.queryByText('Save to routine')).toBeNull();
});
```

- [ ] **Step 2: Run red** — `npm test -- stretch-card` → FAIL.

- [ ] **Step 3: Replace `src/components/stretch-card.tsx`**

```tsx
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { SaveToRoutine } from '@/components/save-to-routine';
import { StretchAnimation } from '@/animation/stretch-animation';
import { getTrack } from '@/animation/tracks';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addToRoutine } from '@/lib/routines';
import { Recommendation } from '@/core/types';

export function StretchCard({ rec, onEasier, onHarder }: { rec: Recommendation; onEasier?: () => void; onHarder?: () => void }) {
  const theme = useTheme();
  const interactive = !!onEasier && !!onHarder;
  const hasAnimation = getTrack(rec.animationId) !== null;
  const [showAnimation, setShowAnimation] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [savedTo, setSavedTo] = useState<string | null>(null);

  const save = (name: string) => {
    void addToRoutine(name, rec).then(() => {
      setSavedTo(name.trim());
      setShowSave(false);
    });
  };

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">{rec.name}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {rec.target_muscles.join(', ')} · {rec.difficulty}{rec.weighted ? ' · weights' : ''}
      </ThemedText>
      {rec.instructions.map((line, i) => (
        <ThemedText key={i} type="small" style={styles.step}>{i + 1}. <ThemedText type="small">{line}</ThemedText></ThemedText>
      ))}
      <ThemedText type="small" themeColor="textSecondary" style={styles.meta}>
        {rec.sets} sets · {rec.reps} reps · {rec.duration}
      </ThemedText>
      {rec.safety_notes.map((note, i) => (
        <ThemedText key={i} type="small" themeColor="warning">⚠ {note}</ThemedText>
      ))}

      {showAnimation && hasAnimation && (
        <View style={styles.animation}><StretchAnimation animationId={rec.animationId} /></View>
      )}

      <View style={styles.actions}>
        {hasAnimation && (
          <Pressable onPress={() => setShowAnimation((v) => !v)} style={[styles.btn, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="small">{showAnimation ? 'Hide animation' : 'Show animation'}</ThemedText>
          </Pressable>
        )}
        {interactive && (
          <>
            <Pressable onPress={onEasier} style={[styles.btn, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="small">Make easier</ThemedText>
            </Pressable>
            <Pressable onPress={onHarder} style={[styles.btn, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="small">Make harder</ThemedText>
            </Pressable>
            <Pressable onPress={() => { setShowSave((v) => !v); setSavedTo(null); }} style={[styles.btn, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="small">Save to routine</ThemedText>
            </Pressable>
          </>
        )}
      </View>

      {showSave && <SaveToRoutine onSave={save} />}
      {savedTo && <ThemedText type="small" themeColor="accent">Saved to {savedTo}.</ThemedText>}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: Spacing.three, gap: Spacing.one, marginTop: Spacing.two },
  step: { marginTop: Spacing.half },
  meta: { marginTop: Spacing.one },
  animation: { alignItems: 'center', marginTop: Spacing.two },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },
  btn: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999 },
});
```

- [ ] **Step 4: Run green** — `npm test -- stretch-card` and `npm test -- message-bubble` → PASS (message-bubble passes both handlers so behaviour is unchanged).
- [ ] **Step 5: Commit** — `git add src/components/stretch-card.tsx tests/components/stretch-card.test.tsx && git commit -m "feat(routines): add Save to routine on cards; optional adjust controls"`

---

## Task 5: Routines screen + header link

**Files:** Create `app/routines.tsx` (i.e. `src/app/routines.tsx`), modify `src/app/index.tsx`, Test `tests/app/routines.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen } from '@testing-library/react-native';

import RoutinesScreen from '@/app/routines';
import { addToRoutine } from '@/lib/routines';

beforeEach(async () => { await AsyncStorage.clear(); });

const recN = (name: string) => ({
  name, type: 'mobility' as const, target_muscles: ['x'], instructions: ['a'], sets: 1, reps: 1,
  duration: '5s', equipment: 'none', weighted: false, difficulty: 'beginner' as const, safety_notes: ['n'], media_prompt: 'p',
});

describe('RoutinesScreen', () => {
  it('lists saved routines and opens one to show its stretches', async () => {
    await addToRoutine('Morning', recN('Chin Tucks'));
    render(<RoutinesScreen />);
    const item = await screen.findByText('Morning (1)');
    fireEvent.press(item);
    expect(await screen.findByText('Chin Tucks')).toBeTruthy();
  });

  it('shows an empty state when there are no routines', async () => {
    render(<RoutinesScreen />);
    expect(await screen.findByText(/No routines yet/i)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run red** — `npm test -- routines.test` → FAIL (module missing). (Use the `tests/app/routines.test.tsx` path; the store test is `tests/lib/routines.test.ts`, distinct.)

- [ ] **Step 3: Implement `src/app/routines.tsx`**

```tsx
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { StretchCard } from '@/components/stretch-card';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { deleteRoutine, getRoutines, removeItem, Routine } from '@/lib/routines';
import { useTheme } from '@/hooks/use-theme';

export default function RoutinesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    getRoutines().then(setRoutines);
  }, []);

  useFocusEffect(refresh);

  const open = routines.find((r) => r.id === openId) ?? null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <ThemedText type="link">{'‹'} Back</ThemedText>
      </Pressable>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Routines</ThemedText>

        {routines.length === 0 && (
          <ThemedText type="small" themeColor="textSecondary">
            No routines yet. Tap “Save to routine” on a stretch to start one.
          </ThemedText>
        )}

        {!open &&
          routines.map((r) => (
            <View key={r.id} style={styles.routineRow}>
              <Pressable onPress={() => setOpenId(r.id)} style={[styles.routineBtn, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold">{r.name} ({r.items.length})</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => deleteRoutine(r.id).then(setRoutines)}
                style={[styles.del, { backgroundColor: theme.backgroundElement }]}
              >
                <ThemedText type="small" themeColor="danger">Delete</ThemedText>
              </Pressable>
            </View>
          ))}

        {open && (
          <View>
            <Pressable onPress={() => setOpenId(null)} style={styles.back}>
              <ThemedText type="link">{'‹'} All routines</ThemedText>
            </Pressable>
            <ThemedText type="smallBold">{open.name}</ThemedText>
            {open.items.map((rec, i) => (
              <View key={`${rec.name}-${i}`}>
                <StretchCard rec={rec} />
                <Pressable
                  onPress={() => removeItem(open.id, i).then(setRoutines)}
                  style={[styles.del, { alignSelf: 'flex-start', backgroundColor: theme.backgroundElement }]}
                >
                  <ThemedText type="small" themeColor="danger">Remove</ThemedText>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  back: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  content: { padding: Spacing.three, gap: Spacing.two },
  routineRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  routineBtn: { flex: 1, padding: Spacing.three, borderRadius: 12 },
  del: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999, marginTop: Spacing.one },
});
```

Note: `useFocusEffect` is imported from `expo-router`. If the test environment cannot resolve `useFocusEffect`, fall back to a `useEffect(refresh, [refresh])` plus the screen still works; but prefer `useFocusEffect` so the list refreshes when navigating back. The provided test renders the component directly (no navigator), so the implementation must not throw if `useFocusEffect` runs once on mount — it won't.

- [ ] **Step 4: Add the header link in `src/app/index.tsx`**

Inside the `headerLinks` View (which currently holds Legal and Settings links), add a Routines link as the first child:

```tsx
            <Link href="/routines" asChild>
              <Pressable><ThemedText type="link">Routines</ThemedText></Pressable>
            </Link>
```

- [ ] **Step 5: Run green** — `npm test -- routines.test` → PASS. `npx tsc --noEmit` → clean.
- [ ] **Step 6: Commit** — `git add src/app/routines.tsx src/app/index.tsx tests/app/routines.test.tsx && git commit -m "feat(routines): add Routines screen and header link"`

---

## Task 6: Full verification

- [ ] **Step 1:** `npx tsc --noEmit` → clean.
- [ ] **Step 2:** `npm test` → all suites pass (prior 73 + routines store + store extension + save-to-routine + stretch-card additions + routines screen).
- [ ] **Step 3:** `npx expo export --platform web` → bundles with no errors (confirms `/routines` route + `useFocusEffect` resolve).
- [ ] **Step 4 (smoke, optional):** `npm run web` → accept consent, get neck stretches, "Save to routine" → create "Test" → open Routines from the header → see the saved card → Remove works.

---

## Self-Review Notes

- **Spec coverage:** routines store (T1), export/delete coverage (T2), inline save picker (T3), card Save-to-routine + reusable card with hidden adjust controls (T4), Routines screen + nav (T5).
- **Out of scope (do NOT add):** reminders/notifications, routine sharing/reordering, cloud sync.
- **Type consistency:** `Routine`, `getRoutines`, `addToRoutine`, `removeItem`, `deleteRoutine`, `ROUTINES_KEY` (routines.ts); `StretchCard` now takes optional `onEasier?`/`onHarder?`; `LocalData.routines` (store.ts).
- **Privacy:** routines are user-saved exercises (no chat/pain text), local only, covered by Export/Delete my data.
