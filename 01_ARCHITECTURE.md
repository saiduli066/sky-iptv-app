# IPTV Web App — Architecture

## Architecture Goal

Build a lightweight client-first IPTV application where the channel catalog is data-driven and the browser handles navigation, state, and playback.

```text
                    ┌───────────────────┐
                    │    Next.js App    │
                    └─────────┬─────────┘
                              │
              ┌───────────────┼────────────────┐
              │               │                │
              ▼               ▼                ▼
        Channel Data       UI Layer       Application State
              │               │                │
              ▼               ▼                ▼
       Normalized Data    Components       Zustand/localStorage
              │               │                │
              └───────────────┼────────────────┘
                              ▼
                         Video Player
                              │
                              ▼
                       External Stream
```

---

## Recommended Directory

```text
src/
├── app/
│   ├── page.tsx
│   ├── browse/
│   │   └── [[...segments]]/
│   │       └── page.tsx
│   ├── watch/
│   │   └── [channelId]/
│   │       └── page.tsx
│   └── globals.css
│
├── components/
│   ├── shell/
│   ├── navigation/
│   ├── country/
│   ├── category/
│   ├── channel/
│   ├── player/
│   ├── search/
│   └── ui/
│
├── data/
│   ├── channels.json
│   └── channel-metadata.json
│
├── lib/
│   ├── channel-parser.ts
│   ├── channel-utils.ts
│   ├── stream-utils.ts
│   ├── logo-utils.ts
│   └── storage.ts
│
├── stores/
│   └── iptv-store.ts
│
├── hooks/
│   ├── use-hls-player.ts
│   └── use-local-storage.ts
│
└── types/
    └── channel.ts
```

---

## Data Flow

```text
channels.json
     │
     ▼
parseChannelCatalog()
     │
     ▼
ChannelRecord[]
     │
 ┌───┼─────────────┐
 ▼   ▼             ▼
Home Search      Browser
 │    │             │
 └────┼─────────────┘
      ▼
 Channel
      │
      ▼
 Watch Route
      │
      ▼
 HLS Player
```

---

## Data Model

```ts
export type RawChannel = {
  name: string;
  url: string;
};

export type ChannelRecord = {
  id: string;
  name: string;
  url: string;
  logo?: string;

  country?: string;
  language?: string;
  category?: string;

  groupPath: string[];
};
```

---

## Why Normalize?

The source JSON has variable nesting.

For example:

```text
Bangladesh
  Entertainment
    channels[]

India
  Bengali
    Entertainment
      channels[]
```

Instead of forcing every component to understand this structure, normalize it once.

Then every channel becomes:

```ts
{
  id,
  name,
  url,
  country,
  language,
  category,
  groupPath
}
```

This simplifies:

- search
- filtering
- favorites
- recent history
- routing
- breadcrumbs
- channel cards

---

## Navigation Strategy

Navigation should be generated from the hierarchy.

Pseudo-logic:

```ts
function traverse(node, path = []) {
  if (isChannelArray(node)) {
    return normalizeChannels(node, path);
  }

  if (isObject(node)) {
    for (const [key, value] of Object.entries(node)) {
      traverse(value, [...path, key]);
    }
  }
}
```

Do not assume exactly two or three levels.

---

## Player Architecture

Use a dedicated player component:

```text
VideoPlayer
├── PlayerContainer
├── HTMLVideoElement
├── HLS adapter
├── Loading state
├── Error state
└── Player controls
```

The player should own:

- HLS lifecycle
- video element events
- buffering state
- error state
- cleanup

It should not own:

- favorites
- channel catalog parsing
- search
- routing

---

## State Architecture

### Local component state

Use for:

- menu open/closed
- hover state
- local player UI
- temporary errors

### Zustand

Use for shared state:

```ts
favorites
recentChannels
playerPreferences
```

### localStorage

Persist:

```text
favorites
recent channels
volume
muted state
theme preference if needed
```

Do not persist large objects unnecessarily.

Store IDs rather than complete channel objects where practical.

---

## Routing Strategy

Prefer semantic routes:

```text
/
 /browse/bangladesh
 /browse/bangladesh/entertainment
 /browse/india/bengali
 /browse/india/bengali/news
 /watch/bangladesh-entertainment-ananda-tv
```

Never put a full stream URL into a route.

---

## Performance Strategy

1. Do not initialize HLS until watch screen loads.
2. Lazy-load player dependencies.
3. Lazy-load channel logos.
4. Normalize the catalog once.
5. Memoize derived lists where necessary.
6. Avoid global state for local UI.
7. Avoid rendering thousands of hidden channel cards.
8. Use responsive image sizing.

---

## Error Boundaries

Use appropriate error boundaries for application-level failures.

Player-level failures should remain inside the player UI and provide recovery.

Example:

```text
Application error
→ error boundary

Stream unavailable
→ player error state
```

Do not confuse the two.

---

## Dependency Policy

Before adding a package:

1. Check whether the framework already provides the capability.
2. Check existing dependencies.
3. Prefer lightweight, mature libraries.
4. Add a dependency only when it provides clear value.

---

## Future Extension Points

The architecture should leave room for:

- EPG
- TV guide
- PWA installation
- keyboard TV remote mode
- Chromecast support
- multiple playlists
- local network discovery
- optional backend
- optional server-side metadata
- optional WebSocket features

But none of these belong in v1 unless explicitly requested.
