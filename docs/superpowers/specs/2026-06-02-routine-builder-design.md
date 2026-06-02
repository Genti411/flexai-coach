# FlexAI Coach - Routine Builder Slice

Date: 2026-06-02
Status: Approved (autonomous build)
Slice: 4

## Goal

Let users save individual stretches into named routines, view their routines, and
re-open a routine to see its stretch cards again. Local-only, free, offline,
privacy-preserving (routines are user-chosen exercises, not chat logs).

## Design decisions (made autonomously)

- Persist routines locally via AsyncStorage (same pattern as consent/profile). One
  key `flexai:routines` holding a `Routine[]`.
- A routine stores the full `Recommendation` objects so cards re-render identically
  (including `animationId`). Self-contained JSON; no external refs.
- "Save to routine" on the card opens an inline picker (existing routine names +
  a "New routine" text field) - no native-only Alert.prompt, works on web + native.
- A new `app/routines.tsx` screen lists routines and, when one is opened, shows its
  saved stretch cards (reusing `StretchCard`, with easier/harder hidden and a Remove
  control). Header gains a "Routines" link beside Legal/Settings.

## Out of scope

Reminders/notifications (would need notification permission - against the
minimal-permission posture), sharing/export of routines, reordering, cloud sync.

## Components / files

- `src/lib/routines.ts` - store: `Routine` type, `getRoutines`, `addToRoutine(name, rec)`
  (creates the routine if absent, appends the rec), `deleteRoutine(id)`,
  `removeItem(routineId, index)`. Pure-ish over AsyncStorage; new-id generation uses
  a counter + timestamp.
- `src/components/save-to-routine.tsx` - the inline picker shown from the card.
- `src/components/stretch-card.tsx` - add the "Save to routine" control (replaces the
  removed placeholder), toggling the inline picker.
- `app/routines.tsx` - the routines screen.
- `src/app/index.tsx` - add the "Routines" header link.

## Data flow

card "Save to routine" -> inline picker -> `addToRoutine(name, rec)` -> persisted.
Routines screen -> `getRoutines()` -> list -> open -> render saved cards -> Remove ->
`removeItem` / `deleteRoutine`.

## Testing

- `routines.ts`: add creates a new routine; adding to an existing name appends;
  `getRoutines` returns them; `removeItem` drops one; `deleteRoutine` clears it.
  (AsyncStorage jest mock; clear between tests.)
- `save-to-routine.tsx`: renders existing routine names + a create field; selecting
  calls the provided `onSave(name)`.
- `stretch-card.tsx`: "Save to routine" present; tapping reveals the picker.
- `routines.tsx`: renders saved routine names; opening shows the stretch names.

## Privacy

Routines are user-initiated saved exercises (no pain/chat text). They live only on
the device, are included in Settings "Export my data" and cleared by "Delete my
data" (extend those to cover the routines key).
