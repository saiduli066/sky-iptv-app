# Home IPTV Web App — AI Agent Documentation

This folder contains the complete project instructions for an AI coding agent.

## Files

| File | Purpose |
|---|---|
| `00_MASTER_AGENT_PROMPT.md` | Main prompt to give the AI coding agent |
| `01_ARCHITECTURE.md` | Technical architecture and data flow |
| `02_UI_UX_GUIDE.md` | Visual design and UX rules |
| `03_ENGINEERING_RULES.md` | Coding, player, state, security, and performance rules |
| `04_DATA_AND_CONTENT_RULES.md` | IPTV JSON, stream, metadata, and content rules |

## Recommended Agent Usage

Give the agent:

1. `00_MASTER_AGENT_PROMPT.md`
2. The remaining `.md` files as supporting instructions.
3. The actual IPTV JSON file.
4. The existing repository, if one already exists.

The agent should read the master prompt first and then use the other files as detailed specifications.

## Product Summary

A private, premium-feeling home IPTV web application:

```text
Greeting
   ↓
Home
   ↓
Country
   ↓
Category / Language
   ↓
Channels
   ↓
Watch
   ↓
HLS / compatible stream player
```

The application is data-driven and must dynamically understand the nested IPTV catalog rather than hard-code navigation levels.
