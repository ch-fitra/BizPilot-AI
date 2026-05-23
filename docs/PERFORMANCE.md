# Performance Guide

## Phase 12 Bundle Strategy

BizPilot AI uses route-level lazy loading for demo, reporting, CRM, forecasting, automation, chat, team, settings, and authentication screens. The dashboard shell stays small enough for a fast first paint, while heavier workflows are fetched when the user opens them.

## Bundle Analysis

Run:

```bash
npm run analyze
```

The command creates `dist/stats.html` with a Rollup treemap report and preserves existing production artifacts in `dist`. Use it before major releases to confirm that heavy libraries remain in lazy chunks.

## Manual Chunks

Vite separates large dependencies into stable vendor chunks:

- `react-vendor`: React runtime.
- `chart-vendor`: Recharts and chart dependencies.
- `pdf-vendor`: jsPDF.
- `canvas-vendor`: html2canvas and DOMPurify for PDF rendering.
- `ui-vendor`: icon and animation libraries.
- `api-vendor`: Supabase or HTTP client dependencies when bundled.

Do not move Gemini SDK usage to the frontend. AI calls should stay behind backend routes so API keys remain server-side.

## Current Build Result

Before Phase 12, the main client bundle was approximately `1,520.35 kB` minified and `442.49 kB` gzip.

After Phase 12, the dashboard entry chunk is approximately `117.67 kB` minified and `29.44 kB` gzip. Heavy tabs now load as separate chunks, including CRM, Forecasting, Reports, AI Analyzer, AI Chat, and Judge Demo overlay.

Largest lazy vendor chunks after optimization:

- `pdf-vendor`: about `391.28 kB` minified, `129.08 kB` gzip.
- `chart-vendor`: about `355.70 kB` minified, `105.51 kB` gzip.
- `react-vendor`: about `242.45 kB` minified, `71.30 kB` gzip.
- `canvas-vendor`: about `228.62 kB` minified, `57.77 kB` gzip.

## Runtime Notes

- CRM search uses a debounced input to reduce repeated filtering work.
- Report PDF export is dynamically imported only when the user exports.
- Chart and table screens use skeleton fallbacks while lazy modules or remote data load.
- Shared report preview lazy-loads the report renderer and PDF export path.
- Dashboard-level computed state uses memoization where it is shared across heavy tabs.

## PWA Cache Review

The service worker caches only the app shell, offline page, and static assets. API routes and non-GET requests bypass the cache, which prevents workspace data, auth responses, tokens, and automation payloads from being stored in Cache Storage.

## Release Checklist

Run before deployment:

```bash
npm run lint
npm run typecheck
npm run build
npm run security:scan
npm run qa:check
npm run analyze
```

Open `dist/stats.html` and verify no unexpected SDK, secret-bearing client package, or large feature module has moved into the entry chunk.
