# IPTV Web App — UI/UX Design Guide

## Design Objective

The application should feel like a premium personal TV lounge.

The design should communicate:

- calm
- cinematic
- modern
- premium
- fast
- focused

Avoid dashboard aesthetics.

---

# 1. Design System

## Background

Use a dark-first background.

Suggested direction:

```text
#06070B
#0A0D14
#0D1220
```

Do not use pure black everywhere.

Create depth with subtle tonal differences.

---

## Accent

A restrained indigo/violet accent is recommended.

Example:

```text
#6366F1
```

Use it for:

- active navigation
- focus
- selected states
- primary actions
- small highlights

Do not color every component.

---

## Surfaces

Use layers:

```text
Page background
    ↓
Section surface
    ↓
Card surface
    ↓
Hover surface
```

Borders should be subtle.

---

# 2. Typography

Use a modern sans-serif font.

Hierarchy:

```text
Hero heading
    ↓
Section heading
    ↓
Channel name
    ↓
Metadata
    ↓
Secondary text
```

Avoid excessive font sizes.

Typography should create hierarchy before decorative effects do.

---

# 3. Splash Screen

The splash should be short.

Example:

```text
                         ✦

                  WELCOME BACK

              Your personal TV lounge
```

Possible animation:

```text
logo fade
→ text fade
→ interface reveal
```

Do not delay the application unnecessarily.

---

# 4. Home Page

Recommended composition:

```text
┌─────────────────────────────────────────────────────────┐
│ IPTV                                  Search     ⚙     │
│                                                         │
│ Welcome back                                            │
│ What would you like to watch?                          │
│                                                         │
│ Countries                                               │
│                                                         │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│ │ 🇧🇩           │ │ 🇮🇳           │ │ 🇵🇰           │     │
│ │ Bangladesh   │ │ India        │ │ Pakistan     │     │
│ └──────────────┘ └──────────────┘ └──────────────┘     │
│                                                         │
│ Continue watching                                      │
│                                                         │
│ [card] [card] [card] [card]                            │
│                                                         │
│ Favorites                                              │
│                                                         │
│ [card] [card] [card]                                  │
└─────────────────────────────────────────────────────────┘
```

---

# 5. Country Cards

Country cards should be visually distinct.

Possible structure:

```text
┌────────────────────────┐
│                        │
│        🇧🇩             │
│                        │
│      BANGLADESH        │
│      18 channels       │
│                        │
└────────────────────────┘
```

The channel count should be calculated dynamically.

Do not hard-code it.

---

# 6. Category Screen

Header:

```text
← Home / Bangladesh

Bangladesh
Choose what you want to watch.
```

Cards:

```text
Entertainment
News
Sports
Movies / Dramas
```

Use iconography carefully.

Examples:

- Entertainment → spark/play icon
- News → newspaper
- Sports → trophy
- Movies → film

Avoid emoji as the primary UI icon unless the design specifically calls for it.

---

# 7. Channel Grid

Desktop:

```text
4–6 columns
```

Tablet:

```text
3–4 columns
```

Mobile:

```text
2 columns
```

Adapt based on actual available width rather than hard-coded device assumptions.

---

# 8. Channel Card

Recommended:

```text
┌──────────────────────────┐
│                          │
│        CHANNEL LOGO      │
│                          │
│ ● LIVE                   │
├──────────────────────────┤
│ Ananda TV            ☆   │
└──────────────────────────┘
```

Rules:

- consistent logo area
- consistent card height
- no stretched logos
- clear channel name
- favorite button accessible
- entire card clickable
- keyboard focus visible

---

# 9. Logo Treatment

Logos should not touch card edges.

Use:

```text
object-contain
```

rather than:

```text
object-cover
```

for channel logos.

If logo is missing:

```text
first letters
```

Example:

```text
ANANDA TV
→
AT
```

---

# 10. Watch Screen

The watch screen is the centerpiece.

```text
← Back

Ananda TV                              ☆

┌───────────────────────────────────────────────┐
│                                               │
│                                               │
│                    VIDEO                      │
│                                               │
│                                               │
│                  Connecting...                │
│                                               │
├───────────────────────────────────────────────┤
│ ▶ LIVE     Ananda TV                          │
│                                               │
│                    🔊   ⛶                     │
└───────────────────────────────────────────────┘

Bangladesh / Entertainment

Previous channel                 Next channel
```

The player should dominate the page.

---

# 11. Player UX

States:

### Loading

```text
Connecting to Ananda TV...
```

### Buffering

```text
Buffering...
```

### Playing

Normal controls.

### Error

```text
Unable to play this channel.

The stream may be offline or blocked by the browser.

[Retry]
```

---

# 12. Search UX

Search should feel instant.

Open search:

```text
┌───────────────────────────────────────────┐
│ 🔍 Search channels...                     │
├───────────────────────────────────────────┤
│                                           │
│ Ananda TV                                 │
│ ATN Bangla                                │
│ Bangla Vision                             │
│                                           │
└───────────────────────────────────────────┘
```

Keyboard:

```text
/
```

can focus search.

Escape closes it.

---

# 13. Navigation

Desktop:

- top navigation or sidebar depending on final composition

Mobile:

- compact top bar
- back navigation
- optional bottom navigation

Always show the user's current location.

Example:

```text
Home / India / Bengali / Entertainment
```

---

# 14. Empty States

Example:

```text
No channels here

There are currently no channels available
in this category.
```

Provide a clear way back.

---

# 15. Favorites

Favorite button:

```text
☆
```

Selected:

```text
★
```

Use accessible labels:

```text
Add Ananda TV to favorites
Remove Ananda TV from favorites
```

---

# 16. Motion Rules

Animation should communicate state.

Good:

- card hover
- route transition
- favorite feedback
- logo loading
- player state transitions

Bad:

- constant floating elements
- excessive particles
- long entrance animations
- animation that delays content

---

# 17. Responsive Rules

Mobile is not a scaled-down desktop.

On mobile:

- reduce padding
- prioritize player
- keep buttons thumb-friendly
- simplify navigation
- maintain readable channel names
- keep favorites accessible

---

# 18. Accessibility

Every interactive element must be:

- keyboard accessible
- focusable
- labeled
- visually understandable

Do not depend only on color.

Example:

Bad:

```text
red = error
```

Better:

```text
red indicator + "Stream unavailable"
```

---

# 19. Premium Design Rule

Do not try to make the app look premium by adding more visual effects.

Premium comes from:

```text
Consistency
+
Spacing
+
Typography
+
Motion
+
Hierarchy
+
Fast interaction
```

---

# 20. UX North Star

At every screen ask:

> "Would this feel natural if I were sitting on my sofa controlling my personal TV?"

If not, simplify it.
