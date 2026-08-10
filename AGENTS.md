# Project: Dig — Hong Kong Island MVP

This file defines the active product, design and implementation baseline. Detailed requirements live in `docs/PRD-HK-ISLAND-MVP.md`; visual rules live in `docs/UI-DESIGN-LANGUAGE.md`.

## 1. Product identity

- **Name:** Dig
- **Purpose:** Help travellers decide which nearby store is worth visiting, what is representative, and what risks matter.
- **Current scope:** Hong Kong Island MVP.
- **Primary viewport:** Mobile-first, optimized for 430px width.
- **Core principle:** Build structured evidence before generating recommendation copy.

## 2. Experience rules

- Do not fill the map with every available POI.
- City zoom hides Dig POIs; neighbourhood and street zooms reveal ranked candidates progressively.
- Top recommendations, saved places and risk states must remain visually distinct.
- Panning the map must not automatically refetch, rerank or recenter it.
- Horizontal store cards do not move the map.
- Selecting a card or marker opens one half-height store detail sheet. Do not reintroduce a duplicate SKU sheet or full-screen evidence page.
- The store sheet prioritizes photos, store-level AI synthesis, signature-item set, risks, practical information and direct links.
- When evidence is weak, show uncertainty instead of marketing labels.

## 3. UI language

- **Tone:** Bright, calm and information-led, with restrained Apple-style glass surfaces.
- **Map:** Never use a dark overlay or brightness filter to solve label readability.
- **Typography:** System sans-serif stack with PingFang HK/TC and Noto Sans HK. Do not use serif Chinese body text.
- **Accent:** Blue-green (`#16778D`) with cool white and pale blue-grey surfaces.
- **Hand-drawn elements:** Reserved for bookmarks, empty states and small memorable accents; never compete with map labels.
- **Borders and shadows:** Light, narrow and sparse. Avoid thick black outlines and oversized rounded cards.

## 4. Technical architecture

- React 19, TypeScript, Vite 6 and Tailwind CSS 4.
- MapLibre GL JS with Geoapify Klokantech Basic tiles and OSM fallback.
- Zustand for local-first state.
- Express + Vite middleware for local full-stack development.
- TypeScript serverless functions in `api/` for Vercel.
- SQLite is local MVP storage only; do not treat it as production persistence on Vercel.
- OSM/Overpass requests go through `/api/osm`.
- Optional Google place enrichment goes through `/api/dig`; do not expose private API keys to the frontend.

## 5. Development checks

- Preserve unrelated user changes in the worktree.
- Keep the 430px mobile experience usable before adding desktop enhancements.
- Run `npm run lint` and `npm run build` before publishing.
- Browser-test map visibility, zoom tiers, card height, half-sheet scrolling and direct links.
