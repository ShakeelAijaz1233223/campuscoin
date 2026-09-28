# CampusCoin frontend redesign notes

This pass redesigns the **frontend only**. The Express API, MySQL schema,
authentication, business logic, financial calculations and API contracts are
untouched: the UI continues to consume the same `/api/v1` endpoints through
`src/api/*`, with real records only. Every rupee shown on screen comes from
the backend; empty states are shown whenever there is genuinely no data.

## Design language

Light premium fintech/edtech, implemented as a token-driven CSS system in
`frontend/src/styles/`:

- `variables.css` — design tokens: bright blue-tinted canvas, white surfaces,
  navy ink (`--heading:#0e2233`), emerald primary (`#0eaf7e`), cyan accents,
  violet AI accents, pale-blue borders, 20px card radius, soft layered
  shadows. A matching dark variant (`data-theme=dark`) keeps the theme toggle
  functional.
- `workspace.css` — workspace shell surfaces: hero, summary cards, spending
  rhythm, AI insight card, recent transaction rows, budget ring, category
  bars, tips, admin chrome, landing and auth scenes.
- Reduced motion is respected globally (`prefers-reduced-motion` in
  `animations.css` plus per-chart `matchMedia` guards).

## Key composition

- **Sidebar** — brand mark + "Learn • Earn • Grow" tagline, workspace
  selector, grouped navigation (MAIN / YOUR ADVANTAGE / ORGANIZER / optional
  ADMINISTRATION), gradient "A little guidance?" card, account area with
  avatar, name, role and sign-out.
- **Header** — breadcrumb (`Workspace > …`), global search, quick-add
  transaction (real modal → `POST /transactions`), theme toggle,
  notifications, profile link.
- **Dashboard** — hero ("A little clarity. A lot of possibility."), month
  selector + Add transaction, three summary cards with animated sparklines
  (cumulative daily income/expense/net from `GET /dashboard`), Spending
  rhythm (Jan–Dec for the selected year from `GET /reports/range`), AI
  insight card (generate via `POST /insights/generate`), recent transactions,
  budget check-in with a real gradient ring (`budget_summary`), plus Top
  categories, Monthly overview, Budget vs actual and Saving tips.
- **Auth** — split story/form layout with custom SVG illustration; login,
  register, forgot/reset password unchanged in behavior.
- **Admin** — same light system with a distinct admin banner + section tabs.

## Illustrations

`frontend/src/components/illustrations/Illustrations.jsx` contains custom SVG
scenes (hero laptop/cap/coin/plant/books, insight brain, empty-state art,
auth scene). No external or hotlinked imagery.

## Verification

- `npm test` — 127 backend + 11 frontend unit tests (138 total, 0 failures).
- `npm run build` — production build.
- Connected Playwright suite — 23 tests against a real Vite → Express → MySQL
  stack, including registration → SQL verification, full CRUD, CSV import,
  report downloads, password change from the Profile page, and admin flows.
- A responsive probe measured `scrollWidth − clientWidth = 0px` for the
  dashboard, transactions, reports and settings at 320–1920px (one 320px case
  scrolls inside its table container, which is intentional).
- Fresh screenshots and the Playwright run log are committed under
  `docs/verification/` (19 captures). The one-off GitHub-runner relay
  workflows that produced them — this sandbox cannot download browser or
  MySQL binaries — were removed once the audit completed. The same
  verification reproduces anywhere with `npm test`, `npm run build`, and
  `E2E_CONNECTED=1 npm run test:e2e` (see the README "Tests" section).
