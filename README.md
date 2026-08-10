# Dig

**An AI-assisted place decision map for travellers exploring Hong Kong Island.**

[简体中文](./README.zh-CN.md) · [Product requirements](./docs/PRD-HK-ISLAND-MVP.md) · [UI language](./docs/UI-DESIGN-LANGUAGE.md)

Dig reduces the work between “there are many places nearby” and “this one is worth walking to”. Instead of covering the map with every available POI, it ranks a small number of current winners and turns recent place content into structured, store-level guidance:

- why the place is worth considering;
- representative items rather than a single generic rating;
- queueing, sell-out, booking and opening-status risks;
- evidence volume, freshness and direct source links;
- walking directions, saves, proximity reminders and visit journals.

The current build is a mobile-first Hong Kong Island MVP and is optimized for a 430px viewport.

## Product experience

### A map that helps users decide

- **City scale:** Dig POIs stay hidden so the base map remains readable.
- **Neighbourhood scale:** ranked POIs appear progressively; the Top 3 receive visual priority and lower-ranked candidates fall back to small dots.
- **Street scale:** labels appear only when collision rules allow them.
- **Stable navigation:** dragging the map does not automatically refetch, rerank or move the camera.
- **Compact comparison rail:** 3–5 nearby stores can be compared without obscuring most of the map.

### One clear detail layer

Selecting a marker or comparison card opens a single half-height store sheet. It contains:

1. storefront and food imagery;
2. current status, payment and walking time;
3. an AI-ready store-level synthesis based on valid claims and recent sources;
4. a representative signature-item set;
5. timing and visit risks;
6. practical information and direct Google Maps, Xiaohongshu or official links.

There is no duplicate SKU sheet, second full-screen detail page or generated “evidence article”. Each interaction must add new decision value.

### Evidence before copy

Dig models recommendations as structured claims rather than free-form marketing text.

```text
Place
├── claim: signature item
│   ├── support count
│   ├── source IDs
│   ├── confidence
│   └── last verified time
├── claim: timing or availability risk
└── source snapshots
```

Only evidence-qualified places enter the main recommendation layer. When evidence is insufficient, the UI reports that limitation instead of inventing labels such as “hidden gem” or “must visit”.

## Current MVP scope

- Hong Kong Island district selection and location fallback.
- Nine editorial seed places with structured decisions, claims and sources.
- Ranked Top POIs and zoom-aware MapLibre markers.
- Store comparison cards and a glass-style half sheet.
- Natural-language, place-name, category and SKU search.
- Local-first saves, nearby reminders, check-ins and journals.
- OSM/Overpass candidate discovery with a server-side proxy and fallbacks.
- Optional Google place enrichment through SerpAPI and DeepSeek.

## Tech stack

| Layer | Technology |
| --- | --- |
| UI | React 19, TypeScript, Vite 6, Tailwind CSS 4 |
| State | Zustand with local persistence |
| Map | MapLibre GL JS, Geoapify Klokantech Basic tiles, OSM fallback |
| Local backend | Express + Vite middleware |
| Vercel API | TypeScript serverless functions in `api/` |
| Local MVP storage | SQLite via `better-sqlite3` |
| Enrichment | SerpAPI + DeepSeek, with pre-enriched editorial fallback |

## Architecture

```text
Browser
├── MapLibre + Geoapify/OSM base map
├── /api/pre-enriched ── curated place decisions and evidence
├── /api/osm ─────────── Overpass candidate discovery
└── /api/dig ─────────── optional SerpAPI + DeepSeek enrichment

Decision pipeline
raw place data → normalized sources → structured claims
→ confidence/freshness checks → store-level synthesis → ranked map result
```

The local server additionally exposes SQLite-backed demo endpoints for places, saves and feedback. The deployed MVP keeps saves and journals local-first in the browser; durable multi-user storage is a post-MVP backend task.

## Getting started

Requirements: Node.js 20 or later.

```bash
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_GEOAPIFY_API_KEY` | Recommended | Loads the bright Klokantech Basic map tiles. The app falls back to OSM tiles when absent. |
| `SERPAPI_KEY` | Optional | Enables Google place and review enrichment through `/api/dig`. |
| `DEEPSEEK_API_KEY` | Optional | Produces enrichment summaries; rules and the pre-enriched dataset remain available without it. |

`VITE_*` values are embedded into the frontend at build time. Never place a private server key under a `VITE_` name.

### Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the full local Express + Vite app |
| `npm run lint` | Type-check with `tsc --noEmit` |
| `npm run build` | Create the production Vite build in `dist/` |
| `npm run preview` | Preview the static production build |

## Project structure

```text
Dig/
├── api/                         # Vercel serverless API routes
├── docs/
│   ├── PRD-HK-ISLAND-MVP.md     # Product and implementation requirements
│   └── UI-DESIGN-LANGUAGE.md    # Shared visual and interaction rules
├── scripts/                     # Local data and SQLite utilities
├── src/
│   ├── components/              # Map, decision rail, half sheet, journal UI
│   ├── data/hk-island-mvp.ts    # Editorial MVP dataset
│   ├── screens/                 # Wander, Search, Journal and Settings
│   ├── services/                # OSM and pre-enriched data clients
│   ├── store/                   # Zustand state and local persistence
│   └── utils/poiRanking.ts      # Evidence-aware recommendation ranking
├── server.ts                    # Local Express + Vite server
├── vercel.json                  # Vercel build and SPA routing
└── vite.config.ts
```

## Deploy to Vercel

The repository is configured for Vercel with `vercel.json`.

```bash
npx vercel
```

Use the Vite preset, `vite build` as the build command and `dist` as the output directory. Add `VITE_GEOAPIFY_API_KEY` to Preview and Production before the final production deployment. Add `SERPAPI_KEY` and `DEEPSEEK_API_KEY` only if on-demand enrichment is required.

For a production release:

```bash
npx vercel --prod
```

## Data and prototype limitations

- The bundled photographs are licensed mood images with source labels, not authenticated store uploads. The schema already distinguishes storefront, signature-item, interior and community photos.
- Community data in the seed dataset is prototype/editorial content. A production ingestion pipeline must use authorized data access and preserve source traceability.
- Opening state and recommendation confidence are time-sensitive and must be refreshed before expanding beyond the MVP.
- SQLite is for local development only; production accounts, saves, feedback and geofencing require durable managed storage.

## Quality checks

Before publishing a change:

```bash
npm run lint
npm run build
```

The map should also be checked at city, neighbourhood and street zoom levels in a 430px mobile viewport.
