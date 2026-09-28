# CampusCoin frontend

React 19 + Vite application connected to the Express/MySQL backend in `../backend`.
Dark-first Nocturne UI with a complete light theme, self-hosted Inter Variable,
shared glass tokens and reduced-motion support. See [design notes](../docs/REDESIGN_NOTES.md).
See the [root setup guide](../README.md) and [implemented API contract](docs/API_CONTRACT.md).

```sh
npm ci
cp .env.example .env
npm run dev                  # :5173; proxies /api to :5000
npm test                     # adapter/validation unit tests
npm run build
npm run preview              # same API proxy, backend must remain running
npm run test:e2e              # UI fixture tests
E2E_CONNECTED=1 npm run test:e2e # adds real database/browser integration tests
```

`API_PROXY_TARGET` is loaded from `.env` by Vite. Browser-facing
`VITE_API_BASE_URL` should normally remain `/api/v1`. Never put DB, JWT or SMTP
secrets in VITE_ variables.

Structure: `api` transport/adapters → `hooks/useResource` → shared and domain
components → pages/routes. Cookies restore sessions; frontend storage contains
appearance preferences only, not auth tokens or fabricated finance records.

Light/dark theme, reading sizes, reduced motion, keyboard dialogs, skip link and
accessible chart data tables are provided. Keep both API and frontend running.
