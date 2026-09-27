# CampusCoin frontend

React 19 + Vite single-page application for the CampusCoin student finance workspace. JavaScript/JSX only; no TypeScript.

## Run
```bash
npm install
cp .env.example .env      # adjust API_PROXY_TARGET to your Express backend
npm run dev               # http://localhost:5173
npm run build && npm run preview
npm test                  # unit tests (node:test)
npm run test:e2e          # Playwright end-to-end tests against an intercepted API contract
```

## Backend connection
All requests go through `src/api/apiClient.js` to `VITE_API_BASE_URL` (default `/api/v1`, proxied by Vite to `API_PROXY_TARGET`). Session cookies are sent with `credentials: 'include'`; an `XSRF-TOKEN` cookie is echoed as `X-XSRF-TOKEN`. Responses may be raw JSON or wrapped as `{ data: ... }`. Collections return `{ items, total }` or arrays. `401` triggers a session-expired state. Failures are displayed as retryable error states; no financial data is fabricated or cached locally.

The expected endpoints and payload shapes are described in `docs/API_CONTRACT.md`. Nothing works end to end until a compatible Express/MySQL backend is running.

## Structure
`src/api` (one module per resource) → `src/hooks` (`useResource` + domain hooks) → `src/components` → `src/pages` → `src/routes`. Shared CRUD screens use `components/common/EntityWorkspace.jsx` configured in `entityConfig.js`.

## Accessibility & preferences
Light/dark theme and three reading sizes (Settings → saved locally), `prefers-reduced-motion` respected, keyboard-accessible dialogs (`<dialog>`), skip link, focus management on route changes, chart data tables.
