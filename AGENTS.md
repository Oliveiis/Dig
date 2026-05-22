# Project: Dig - First Complete Version (v1.0.0)

This file documents the baseline settings, UI design style, and technical architecture for the "Dig" application as of April 9, 2026. All future modifications should respect these core principles.

## 1. Core Identity
- **Name:** Dig
- **Tagline:** A decision tool for street explorers. Get structured facts about shops nearby to decide whether to enter in 3 seconds.
- **Target Platform:** Mobile-first (optimized for 430px width).

## 2. UI Design Style (Baseline)
- **Typography:**
  - **Display:** `Syne` (Bold/Extra Bold) for impact.
  - **Body:** `Inter` for readability.
  - **Technical/Metadata:** `Space Mono` for a "structured facts" feel.
- **Color Palette:**
  - **Background:** `#F8F9FA` (Soft grey)
  - **Surface:** `#FFFFFF` (Pure white)
  - **Accent:** `#000000` (High contrast black)
  - **Category Colors:**
    - Cafe: `#c8f04a` (Lime)
    - Restaurant: `#4da6ff` (Blue)
    - Bar: `#ff4d4d` (Red)
- **Visual Language:**
  - **Apple-style Blurs:** `backdrop-blur-2xl` with subtle borders.
  - **Structured Tags:** `claude-tag` style (mono, uppercase, small text).
  - **Shadows:** iOS-style soft shadows (`ios-shadow`, `ios-shadow-lg`).
  - **Layout:** Full-screen mobile container with hidden scrollbars.

## 3. Technical Architecture
- **Framework:** React 19 + Vite 6.
- **Styling:** Tailwind CSS 4.
- **Backend:** Express + Vite Middleware (Full-stack).
- **State Management:** Zustand.
- **Animations:** Motion (Framer Motion).
- **External APIs:**
  - **OpenStreetMap (OSM):** Proxied via server-side `/api/osm` to bypass CORS.
  - **Google Maps:** Used for map rendering via `@vis.gl/react-google-maps`.

## 4. Key Features
- **Street Explorer:** Real-time POI discovery based on geolocation.
- **Structured Facts:** Quick-glance information (payment, signature items, caveats).
- **CORS-safe OSM:** Server-side fetching with multi-instance fallback, shuffling, and exponential backoff retries for 504/429 errors.

## 5. Development Guidelines
- **Maintain Mobile-First:** Always test within the `.mobile-container` constraints.
- **Preserve High Contrast:** Stick to the black accent and bold typography.
- **Proxy External Requests:** All external API calls that might hit CORS issues must be proxied through `server.ts`.
