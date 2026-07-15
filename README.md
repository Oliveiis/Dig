<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Dig

[English](./README.md) | [简体中文](./README.zh-CN.md)

**A decision tool for street explorers — get structured facts about shops nearby and decide whether to walk in, in 3 seconds.**

🌐 **Live demo**: https://ai.studio/apps/da74fa5a-3561-4996-a330-f3f426169bc1

Mobile-first web app that turns your surroundings into quick, structured shop facts (payment, signature items, caveats) so you can decide on the spot. Real-time POI discovery powered by OpenStreetMap + Google Maps, enriched by a multi-source food crawler.

## Features

- **Street Explorer** — real-time POI discovery based on geolocation
- **Structured Facts** — quick-glance info: payment methods, signature items, caveats
- **Bookmark & Journal** — save and revisit places
- **Wander / Search** — purpose-built screens for browsing and finding
- **Quick Check-in & Proximity Alerts** — lightweight logging and nearby nudges
- **CORS-safe OSM proxy** — server-side fetching with multi-instance fallback, shuffling, and exponential backoff for 504/429

## Tech Stack

- **Frontend**: React 19, Vite 6, Tailwind CSS 4, Zustand, Framer Motion, React Router
- **Backend**: Express + Vite middleware (`tsx server.ts`)
- **Maps**: Google Maps (`@vis.gl/react-google-maps`), OpenStreetMap (proxied)
- **Data**: Firestore, better-sqlite3
- **AI / Enrichment**: Google Gemini, Anthropic Claude; POI enrichment via SerpAPI + DeepSeek (pre-enriched dataset for cold loads)
- **Crawling**: Playwright (OpenRice, Reddit, Xiaohongshu)

## Getting Started

**Prerequisites**: Node.js

```bash
npm install
cp .env.example .env   # then fill in your API keys
npm run dev
```

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the full-stack dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Type-check (`tsc --noEmit`) |
| `npm run clean` | Remove `dist/` |

## Project Structure

```
Dig/
├── server.ts            # Express + Vite middleware, OSM proxy
├── src/
│   ├── App.tsx
│   ├── screens/         # Wander, Search, ...
│   ├── components/      # FactCard, BookmarkListSheet, ...
│   ├── services/        # preEnrichedService, ...
│   ├── store/           # Zustand stores
│   ├── hooks/
│   ├── lib/
│   ├── data/            # dig-pois.json (pre-enriched POIs)
│   ├── constants/
│   ├── types/
│   └── utils/
├── scripts/             # crawlers (openrice, reddit, xiaohongshu), summarize
├── firestore.rules
└── firebase-blueprint.json
```

## Development Notes

- **Mobile-first** — always test within `.mobile-container` (optimized for 430px width)
- **High contrast** — black accent + bold typography (`Syne` / `Inter` / `Space Mono`)
- **Proxy external requests** — any call that may hit CORS goes through `server.ts`
