# IPTV Web App — Data & Content Rules

## Source of Truth

The supplied IPTV JSON is the initial catalog.

It currently contains:

```text
Bangladesh
India
Pakistan
Documentary
```

Bangladesh and Pakistan contain category groups.

India contains language groups and then categories.

---

## Preserve Source Structure

Do not flatten the original JSON file itself merely to make the UI easier.

Instead:

```text
raw source
    ↓
normalization layer
    ↓
application records
```

This preserves the original source while making the frontend easy to work with.

---

## Channel Object

Current channel objects follow:

```json
{
  "name": "Channel Name",
  "url": "STREAM_URL"
}
```

Optional metadata can be layered separately:

```json
{
  "channel-id": {
    "logo": "/logos/channel.png"
  }
}
```

---

## Empty Categories

Some categories are empty.

Example:

```json
"Other": []
```

and some India categories are empty.

The application must handle this safely.

Never crash because an array is empty.

---

## Stream URL Handling

Streams may include:

```text
https://...m3u8
http://...m3u8
```

and other streaming URL formats.

Do not rewrite them automatically.

Do not append random query parameters.

Do not strip existing tokens.

---

## Channel IDs

IDs should be generated deterministically.

Recommended:

```text
country-language-category-channel-name
```

normalized to:

```text
lowercase-kebab-case
```

Example:

```text
bangladesh-entertainment-ananda-tv
```

If collision is possible, include additional hierarchy.

---

## Logo Metadata

Keep logos separate from source stream data.

Suggested:

```text
public/
└── logos/
    ├── ananda-tv.png
    ├── atn-bangla.png
    └── ...
```

and:

```text
src/data/channel-metadata.json
```

---

## Fallback Logo

If no logo exists:

```text
generate initials
```

Examples:

```text
Ananda TV
→ AT

Bangla Vision
→ BV

T Sports
→ TS
```

Do not generate fake official-looking logos.

Use a neutral typographic fallback.

---

## Search Metadata

Search should use normalized metadata:

```text
name
country
language
category
```

Do not search raw URLs.

---

## Content Safety / Rights

This application is intended as a private home interface for streams the user is authorized to access.

Do not add functionality intended to bypass:

- DRM
- authentication
- access controls
- geo restrictions
- subscription restrictions

Do not implement stream ripping or recording unless separately and explicitly requested and legally appropriate.

---

## Source Reliability

A stream being present in the JSON does not guarantee:

- availability
- legality
- permanence
- browser compatibility
- CORS compatibility
- correct content

The UI should treat stream availability as dynamic.

---

## Updating the Catalog

When updating the catalog:

1. Preserve valid existing channels.
2. Add new channels without breaking IDs.
3. Do not silently remove entries.
4. Do not invent replacements.
5. Keep metadata separate where practical.
6. Validate JSON before application startup.

---

## Data Validation

At development time, validate:

```text
name exists
url exists
url is syntactically valid
```

Warn about:

```text
missing name
missing URL
duplicate IDs
duplicate channel names within same group
unsupported URL schemes
```

Do not make a single malformed channel crash the entire catalog.
