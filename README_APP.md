# Sky IPTV

Run locally with:

```bash
npm install
npm run dev
```

The app reads `channels.json` as its source of truth, normalizes arbitrary nested groups, and stores favorites and recently watched channel IDs in localStorage. Stream URLs are never rewritten.
