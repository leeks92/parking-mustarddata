# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start Next.js dev server with hot reload
- `npm run build` - Build static export to `/out` directory
- `npm run lint` - Run ESLint
- `npm start` - Start production server (rarely needed; site is static)

No test framework is configured.

## Architecture

This is a **static-export Next.js site** (parking.mustarddata.com) providing Korean parking lot search, fee comparison, and regional browsing. All pages are pre-rendered at build time — there is no runtime server or database.

### Data Flow

`data/parking-lots.json` (~20MB, 32,184개 주차장) → imported directly by `src/lib/parking-data.ts` → consumed by page components at build time via `generateStaticParams()` → static HTML in `/out`.

Raw data files (`data/raw-*.json`) are source material; only `parking-lots.json` is used by the app.

### Key Directories

- `src/app/` — Next.js App Router pages (all server components by default)
- `src/components/` — Shared React components (Header, Footer, JsonLd, etc.)
- `src/lib/` — Data access layer and types
  - `parking-data.ts` — All data queries, fee calculation, slug conversion, region aggregation
  - `types.ts` — `ParkingLot`, `Region`, `Sigungu` interfaces
  - `urls.ts` — Base URL and page constants
- `data/` — JSON data files (large; ~130MB total)
- `scripts/` — Data fetching utilities

### Route Structure

| Route | Purpose |
|-------|---------|
| `/` | Home with stats, region grid, FAQ |
| `/region/[sido]` | Province page listing districts |
| `/region/[sido]/[sigungu]` | District page listing parking lots |
| `/parking/[id]` | Individual lot detail with fee calculator |
| `/free/[sido]/[sigungu]` | Free parking lots by region |
| `/compare` | Interactive fee comparison tool |

### URL Slug Convention

- **Sido (province)**: Romanized slugs via `SIDO_SLUG_MAP` in `parking-data.ts` (e.g., 서울 → `seoul`, 경기 → `gyeonggi`)
- **Sigungu (district)**: URL-encoded Korean (e.g., 강남구 → `%EA%B0%95%EB%82%A8%EA%B5%AC`)

### Server vs Client Components

Pages are server components. Components marked `'use client'` handle interactivity:
- `CompareClient.tsx` — Fee comparison filtering/sorting
- `Header.tsx` — Mobile menu toggle
- `ScrollToTop.tsx` — Scroll button
- Fee calculator sections within parking detail pages

### Fee Calculation

`calculateFee(lot, minutes)` in `parking-data.ts`: base fee for `baseTime` minutes, then `addFee` per `addTime` increment, capped at `dailyMax`.

## Build Configuration

- `output: 'export'` — Fully static, no Node.js server needed
- `trailingSlash: true` — All URLs end with `/`
- `images: { unoptimized: true }` — Required for static export
- Path alias: `@/*` → `./src/*`
- Deploys to GitHub Pages via `.github/workflows/deploy.yml`

## Content Language

All user-facing content is Korean (ko-KR). Comments in source code are also mostly Korean.
