# CampusCoin

Repository: [`campuscoin`](https://github.com/ShakeelAijaz1233223/campuscoin).

Connected React/Vite frontend + Express API + MySQL student finance workspace.
The browser uses **same-origin `/api/v1`**; Vite proxies it to the backend on **port 5000**.
No mock financial data or local-storage authentication is used by the application.

## Local setup

Requirements: Node.js 20+ (tested with Node 22), npm, and MySQL. Docker is optional.

```sh
npm run setup
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Optional if you do not already run MySQL:
docker compose up -d db
```

Set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` in `backend/.env`.
For the optional Compose database, use host `127.0.0.1`, user `root`, password
`campuscoin_local_only`, database `campuscoin`. Wait for MySQL to become healthy.
If port 3306 is already in use, use your existing server or change the port mapping
and `DB_PORT` together.

```sh
npm run db:migrate
npm run db:seed       # development/sample data; run before registering users
npm run dev          # starts API :5000 and frontend :5173
```

Open **http://localhost:5173** (or the frontend live preview). Both processes must
be running. The API intentionally refuses to start when MySQL is unavailable.
If changing the backend port, update `API_PROXY_TARGET` in `frontend/.env` and
restart Vite. Do not set a browser API URL to a sandbox's localhost.

### Development demo logins

| Role | Email | Password |
|---|---|---|
| Student | `student@campuscoin.com` | `Student@123` |
| Admin | `admin@campuscoin.com` | `Admin@123` |

These are public **development-only** seed accounts. Never run the demo seed on a
production database. The seed skips a database already containing users; do not
use its destructive `--force` option on data you want to preserve.

## Connected features

- Registration, login, restored HttpOnly cookie session, logout, role guards,
  password reset, profile and saved settings.
- Accounts, custom categories, transactions, filters and pagination; rule-based
  category suggestions and manual overrides.
- Category budgets, monthly spending recalculation, goals/saved amounts, bills
  with paid status, recurring rules; scheduled recurring transactions/reminders.
- Month-selected dashboard, category/daily/weekly/monthly charts, date/category/
  income-source-filtered reports. PDF, CSV and JSON downloads use the same records.
- CSV preview/edit, server validation, explicit categories or optional suggestions,
  duplicate review and confirmed import into the selected account. Confirmation,
  row correction and cancellation share a database lock to prevent duplicate
  posting; failed/empty imports retain accurate status and progress.
- Monthly insights, system tips, persistent dismissal, tip/insight bookmarks,
  notes, search, notifications/read state.
- Admin statistics, users/access status, default categories, announcements and tips.

The wire contract is documented in [frontend/docs/API_CONTRACT.md](frontend/docs/API_CONTRACT.md).
`frontend/src/api/contract.js` maps the API's snake_case resource envelopes into
camelCase UI models and preserves pagination totals.

## Tests

Use a **disposable test database**. Integration tests create users and records.

```sh
npm test                       # real-DB backend tests + frontend unit tests
cd frontend
npx playwright install --with-deps chromium
npm run test:e2e                # isolated UI fixtures; connected tests skipped
# With a migrated/seeded database and API running in NODE_ENV=test:
E2E_CONNECTED=1 npm run test:e2e # includes real browser -> API -> MySQL tests
```

`E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` may override demo admin credentials.
`PLAYWRIGHT_CHROMIUM_EXECUTABLE` can point to an installed Chromium executable.
`NODE_ENV=test` disables rate limits for repeated integration-test logins; **do not
use that mode for public deployments**. Backend tests set it themselves.

Validation in this workspace: MySQL 5.7 compatibility runtime, 117 backend tests,
8 frontend unit tests, and 20 passing Playwright tests (13 real-backend flows
and 7 isolated UI tests). Production frontend build also passes. The optional MySQL 8.4
Compose configuration is provided for local setup, not claimed as executed here.

## Production and external services

1. Use a supported MySQL server, restricted application DB user, backups, HTTPS,
   and a random `JWT_SECRET` of at least 32 characters. Set `NODE_ENV=production`.
2. Build with `npm run build`. Serve `frontend/dist` with SPA fallback and reverse
   proxy `/api/` to Express. Vite dev/preview are local tooling, not production hosts.
3. Keep frontend and API on the **same origin** for the HttpOnly, SameSite=Lax
   cookie. Production cookies are Secure. Cookie-authenticated writes require
   `X-Requested-With: CampusCoin`; Bearer clients remain supported.
4. Set `CLIENT_URL` to your actual frontend URL. Do not use wildcard credentialed
   CORS in production. Store secrets only in server environment variables.
5. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`,
   `SMTP_FROM` for password-reset email. **Actual external email delivery has not
   been verified without a mail provider.** Production reset requests fail clearly
   if SMTP is absent. Development/test returns a reset token and the UI offers a
   development-only reset link; never expose development mode publicly.
6. Category suggestions/insights use the existing local keyword/statistics engine;
   a paid LLM connection is not required or claimed. Email/weekly-report settings
   store preferences; a bulk weekly-email delivery job is not implemented.

Budgets are per expense category (not named overall budgets), with an 80% warning
threshold. System categories are read-only to students; admins manage them.
Profile email is read-only. Currency is a display/recording preference, not an FX
conversion service. Bill status does not automatically debit an account: record
the payment transaction separately. Sharing sends/downloads a PDF through the
browser; it does not create a public expiring report URL. Uploaded CSVs are private,
and report downloads enforce ownership.
