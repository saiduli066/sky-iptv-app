# IPTV Web App — Engineering Rules

## Non-Negotiable Rules

1. TypeScript first.
2. No unnecessary `any`.
3. No hard-coded channel lists in JSX.
4. JSON is the initial channel source of truth.
5. Never invent stream URLs.
6. Never silently alter stream URLs.
7. Never hide stream errors.
8. Never create unsafe arbitrary URL proxy endpoints.
9. Keep player logic isolated.
10. Keep parsing logic isolated.
11. Keep persistence isolated.
12. Prefer small reusable components.
13. Test after significant changes.
14. Preserve existing working project code unless replacement is justified.

---

## Data Rules

Raw:

```ts
{
  name: string;
  url: string;
}
```

Normalized:

```ts
{
  id: string;
  name: string;
  url: string;
  logo?: string;
  country?: string;
  language?: string;
  category?: string;
  groupPath: string[];
}
```

Do not require `logo` in the raw source.

---

## URL Rules

Treat external stream URLs as untrusted external resources.

Validate basic shape:

```ts
new URL(url)
```

Do not assume:

```text
.m3u8 = guaranteed playable
```

Some streams may fail for reasons outside the app.

---

## Player Rules

On mount:

```text
create player
→ attach source
→ listen for events
```

On unmount:

```text
destroy HLS instance
→ detach listeners
→ clean up
```

Never leave old HLS instances running after changing channels.

---

## React Rules

Avoid:

```tsx
useEffect(() => {
  ...
}, [])
```

when the effect actually depends on props/state.

Be explicit with dependencies.

Avoid unnecessary effects.

Prefer derived values over synchronized state.

---

## State Rules

Use:

```text
React state
```

for local UI.

Use:

```text
Zustand
```

for cross-component application state.

Use:

```text
localStorage
```

for persistence.

Do not duplicate the same state in all three.

---

## Storage Rules

Store IDs:

```json
["ananda-tv", "atn-bangla"]
```

instead of full channel objects.

For recent channels:

```json
[
  {
    "channelId": "ananda-tv",
    "lastWatched": 1750000000000
  }
]
```

Recover gracefully if localStorage contains invalid data.

---

## Component Rules

Avoid giant components.

If a component becomes responsible for:

- parsing
- fetching
- playback
- rendering
- persistence

split it.

---

## Styling Rules

Prefer Tailwind utility classes.

Create shared CSS variables for design tokens.

Avoid random one-off colors.

Avoid arbitrary spacing values unless needed.

---

## Accessibility Rules

Every button must have an accessible name.

Icon-only:

```tsx
aria-label="Add to favorites"
```

Never use:

```tsx
<div onClick={...}>
```

for primary interactive controls.

Prefer:

```tsx
<button>
```

or:

```tsx
<Link>
```

---

## Performance Rules

Avoid:

```text
loading every logo immediately
initializing player on home page
parsing JSON repeatedly
global state for every UI interaction
```

Prefer:

```text
lazy loading
memoized normalized data
dynamic imports
local state
```

---

## Error Handling

Errors must be actionable.

Bad:

```text
Error
```

Good:

```text
Unable to play this stream.

The stream may be offline, expired,
blocked by the browser, or temporarily unavailable.

Retry
```

---

## Security Rules

Never add:

- arbitrary URL proxy
- open redirect
- secret tokens in source
- server-side fetching of arbitrary user-supplied URLs
- credentials in JSON
- unnecessary external scripts

---

## Git Rules

Use small commits where appropriate.

Examples:

```text
feat: add channel catalog parser
feat: add country browser
feat: add HLS player
feat: add favorites persistence
fix: clean up HLS instance on channel change
style: polish channel cards
```

---

## Before Finishing

Run:

```bash
npm run lint
npm run build
```

and the project's available typecheck/test commands.

Do not claim success if the build fails.

Report any stream-specific failures separately from application failures.
