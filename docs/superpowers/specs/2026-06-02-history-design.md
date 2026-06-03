# FlexAI Coach - History Slice

Date: 2026-06-02
Status: Approved (autonomous build)
Slice: 7

## Goal

An opt-in local history of past stretch queries. Off by default to preserve the
privacy-by-design posture; when the user turns it on, the app records what they
asked (query text, matched body area, suggestion count, timestamp) locally, viewable
on a History screen and clearable.

## Design decisions (autonomous)

- New `historyEnabled?: boolean` on `ProfilePrefs` (default falsy = off). A Settings
  toggle controls it.
- New `src/lib/history.ts` store: `HistoryEntry { ts, query, bodyArea, count }`,
  `getHistory`, `addHistory` (prepend, cap to 50), `clearHistory`. Key
  `flexai:history`.
- Chat screen: only when `historyEnabled` is true, after a response, append an entry.
  When off, nothing is written - chat stays ephemeral.
- New `src/app/history.tsx`: lists entries (most recent first) with a Clear button
  and an empty/opt-in-off state. Header gains a "History" link.
- Export/Delete my data extend to cover the history key.

## Out of scope

Re-running a past query from history, full chat-transcript storage, server sync.

## Privacy

History is strictly opt-in, local-only, never transmitted, capped at 50 entries,
clearable in one tap, and covered by Export/Delete my data. Default off.

## Testing

- `history.ts`: add prepends and caps at 50; clear empties; get returns entries.
- store: export includes history; delete clears it.
- settings: the toggle persists `historyEnabled`.
- `history.tsx`: shows entries + Clear; shows the opt-in-off/empty message when empty.
- chat: with `historyEnabled` true, sending a query writes one history entry; with it
  false, nothing is written.
