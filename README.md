<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Dig

[English](./README.md) | [简体中文](./README.zh-CN.md)

**A decision tool for street explorers — get structured facts about shops nearby and decide whether to walk in, in 3 seconds.**

🌐 **Live demo (AI Studio)**: https://ai.studio/apps/da74fa5a-3561-4996-a330-f3f426169bc1
▲ **Deploy on Vercel**: see [Vercel deployment](#deploy-on-vercel)

Mobile-first web app that turns your surroundings into quick, structured shop facts (payment, signature items, caveats) so you can decide on the spot. Real-time POI discovery powered by OpenStreetMap + Google Maps, enriched by a multi-source food crawler.

## Features

- **Street Explorer** — real-time POI discovery based on geolocation
- **Structured Facts** — quick-glance info: payment methods, signature items, caveats
- **Bookmark & Journal** — save and revisit places
- **Wander / Search** — purpose-built screens for browsing and finding
- **Quick Check-in & Proximity Alerts** — lightweight logging and nearby nudges
- **CORS-safe OSM proxy** — server-side fetching with multi-instance fallback, shuffling, and exponential backoff for 504/429
- **Pre-enriched dataset** — cold loads served from a crawled & summarized POI dataset so the first paint is never empty

## Tech Stack

- **Frontend**: React 19, Vite 6, Tailwind CSS 4, Zustand, Framer Motion, React Router
- **Maps**: Google Maps (`@vis.gl/react-google-maps`), OpenStreetMap (proxied)
- **Data**: Firestore, better-sqlite3 (offline scripts only)
- **AI / Enrichment**: DeepSeek (hook_tag / why_worth_it copy), Google Gemini; POI enrichment via SerpAPI + DeepSeek
- **Crawling**: Playwright (OpenRice, Reddit, Xiaohongshu)

## Architecture

The app is a Vite SPA with three serverless API routes. Locally they are served by `server.ts` (Express + Vite middleware); on Vercel the same routes live in `api/*.ts`.

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/osm` | POST | Proxy Overpass queries to 9 OSM instances with retry + backoff (CORS-safe) |
| `/api/dig` | POST | Enrich a single POI: SerpAPI → Google Maps data → DeepSeek copy |
| `/api/pre-enriched` | GET | Return the pre-crawled `src/data/dig-pois.json` dataset |

Frontend data flow:

```
geolocation
   │
   ▼
osmService ──POST /api/osm──► Overpass proxy ──► raw POIs
   │
   ├── mergeWithOSM ──GET /api/pre-enriched──► pre-crawled POIs
   │
   ▼
poiCacheService (localStorage: stable 24h + timed 24h)
   │
   └── enrichPOIsBatch ──POST /api/dig──► SerpAPI + DeepSeek enrichment
```

## Getting Started

**Prerequisites**: Node.js

```bash
npm install
cp .env.example .env   # then fill in your API keys
npm run dev
```

### Environment Variables

See [`.env.example`](./env.example) for the full list.

| Variable | Scope | Required | Purpose |
| --- | --- | --- | --- |
| `SERPAPI_KEY` | backend | for `/api/dig` enrichment | Google Maps place data via SerpAPI |
| `DEEPSEEK_API_KEY` | backend | optional | Generates `hook_tag` / `why_worth_it` copy; falls back to rule-based if unset |
| `VITE_GOOGLE_MAPS_API_KEY` | frontend | for map rendering | Injected at build time for `@vis.gl/react-google-maps` |

> `GEMINI_API_KEY` / `APP_URL` are legacy — auto-injected by Google AI Studio only, not used by Vercel.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the full-stack dev server (`tsx server.ts`) |
| `npm run build` | Production build (`vite build` → `dist/`) |
| `npm run preview` | Preview the production build |
| `npm run lint` | Type-check (`tsc --noEmit`) |
| `npm run clean` | Remove `dist/` |

## Project Structure

```
Dig/
├── api/                 # Vercel serverless functions
│   ├── dig.ts           #   POST /api/dig — SerpAPI + DeepSeek enrichment
│   ├── osm.ts           #   POST /api/osm — Overpass proxy
│   └── pre-enriched.ts  #   GET  /api/pre-enriched — static dataset
├── server.ts            # Local dev: Express + Vite middleware (same 3 routes)
├── vercel.json          # Vercel framework + SPA rewrites
├── src/
│   ├── App.tsx
│   ├── screens/         # Wander, Search, ...
│   ├── components/      # FactCard, BookmarkListSheet, ...
│   ├── services/        # osmService, poiCacheService, preEnrichedService, ...
│   ├── store/           # Zustand stores
│   ├── hooks/
│   ├── lib/             # firebase.ts
│   ├── data/            # dig-pois.json (pre-enriched POIs)
│   ├── constants/
│   ├── types/
│   └── utils/
├── scripts/             # crawlers (openrice, reddit, xiaohongshu), summarize
├── firestore.rules
└── firebase-blueprint.json
```

## Deploy on Vercel

The repo is wired for Vercel out of the box (`vercel.json` + `api/*.ts`). The Vite SPA builds to `dist/`; the three API routes run as Node serverless functions.

1. Go to [vercel.com/new](https://vercel.com/new) and import `Oliveiis/Dig`.
2. Framework preset should auto-detect as **Vite**. Confirm:
   - Build Command: `vite build`
   - Output Directory: `dist`
3. Add environment variables (Project → Settings → Environment Variables):
   - `SERPAPI_KEY`
   - `DEEPSEEK_API_KEY`
   - `VITE_GOOGLE_MAPS_API_KEY`
4. Deploy. Vercel serves `dist/` for the SPA and `api/*.ts` for the routes automatically.
5. (Optional) Connect your domain under Project → Settings → Domains.

> Firestore reads/writes go directly from the browser to Firebase using the config in `firebase-applet-config.json`, so no backend env is needed for Firestore.

## Local dev vs Vercel

| Concern | Local (`npm run dev`) | Vercel |
| --- | --- | --- |
| API routes | `server.ts` (Express) | `api/*.ts` (serverless) |
| Static assets | Vite middleware | `dist/` |
| `better-sqlite3` | available for scripts | not used at runtime |
| Firestore config | `firebase-applet-config.json` (bundled into client) | same |

## Development Notes

- **Mobile-first** — always test within `.mobile-container` (optimized for 430px width)
- **High contrast** — black accent + bold typography (`Syne` / `Inter` / `Space Mono`)
- **Proxy external requests** — any call that may hit CORS goes through `/api/osm` (or a new `api/*.ts` route on Vercel)

## Security Note

`firebase-applet-config.json` contains the Firebase web config (including `apiKey`) and is checked in. This is the public Firebase web SDK config — access is governed by `firestore.rules`, not by the apiKey. Confirm the rules are deployed before relying on them in production.
