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
npm run db:migrate   # schema, indexes, essential reference categories/settings/tips
npm run db:seed      # optional, idempotent reference-data repair; no demo finances
npm run dev          # starts API :5000 and frontend :5173
```

Open **http://localhost:5173** (or the frontend live preview). Both processes must
be running. The API intentionally refuses to start when MySQL is unavailable.
If changing the backend port, update `API_PROXY_TARGET` in `frontend/.env` and
restart Vite. Do not set a browser API URL to a sandbox's localhost.

### Real data by default

Normal setup creates **no demo users, balances, transactions, goals or insights**.
Register your own account; its Cash Wallet starts at zero. Dashboards and reports
read saved MySQL records. Reference categories and educational tips are not
financial activity. Existing user records are not deleted or rewritten by setup.

For an administrator, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the ignored
`backend/.env`, then run `npm --prefix backend run create-admin`. There are no
default administrator credentials. Remove those bootstrap variables afterward.

Legacy sample data is available only via explicit `npm --prefix backend run seed
-- --demo` against an **empty, disposable development database**. It was not used
for this audit. `--force` seeding is rejected. Never run `reset` on real data;
reset now requires `--confirm=<database_name>` and is blocked in production.

### Registration and sessions

Passwords require **8+ characters, uppercase, lowercase and a number** on both
registration and reset forms. The name adapter sends `first_name`/`last_name`;
academic year is optional and maps UI year labels to the API enum. The form shows
validation details instead of hiding a 422. Duplicate email is a 409, including
concurrent submissions. Registration creates a user/profile/zero-balance account;
sign in afterward to establish the browser session.

An anonymous `/auth/me` returning **401 is expected**. Login sets an **HttpOnly
JWT cookie** automatically sent by `credentials: include`; reload restores it.
No JWT is placed in localStorage/sessionStorage. Separate API clients can use
the returned token as `Authorization: Bearer <token>`. Browser logout clears its
cookie and auth state and revokes existing sessions (including Bearer tokens) via
`users.session_version`. Password reset/change and administrator access changes
also invalidate older sessions; password change rotates the current session.

## Connected features

- Registration, login, restored HttpOnly cookie session, logout, role guards,
  password reset, change password (Profile page), profile and saved settings.
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
# Shell examples (use the equivalent environment syntax on Windows):
DB_NAME=campuscoin_test npm run db:migrate
npm test                       # backend defaults to campuscoin_test + frontend units
cd frontend
npx playwright install --with-deps chromium
npm run test:e2e                # isolated UI fixtures; connected tests skipped
```

For connected browser tests, run the API with `NODE_ENV=test` and
`DB_NAME=campuscoin_test`, and the Vite frontend. Create a test administrator using
`create-admin` **in that same disposable database**. Then run from the repo root:

```sh
E2E_CONNECTED=1 DB_NAME=campuscoin_test E2E_ADMIN_EMAIL=<test-admin-email> E2E_ADMIN_PASSWORD=<test-admin-password> npm run test:e2e
```

The API and browser test runner must target the **same test database**: one
browser test directly verifies its registration in SQL. Fixtures exist only in
the test DB/test code, never as application fallback data.
`PLAYWRIGHT_CHROMIUM_EXECUTABLE` can point to an installed Chromium executable.
`NODE_ENV=test` disables rate limits for repeated integration-test logins; **do not
use that mode for public deployments**. No lint script is defined.

### Frontend redesign and verification

The **Nocturne** redesign is dark-first with a complete light theme: restrained
cyan/violet glass, self-hosted variable typography, cinematic CSS illustration,
responsive working pages and reduced-motion behavior. Focused backend/security
fixes and an additive session migration support the connected experience; the
working React/Express/MySQL architecture was retained.

See [design notes](docs/REDESIGN_NOTES.md), the
[A–W end-to-end audit](docs/END_TO_END_AUDIT.md), and
[fresh screenshots and verification results](docs/verification/nocturne/).

Latest verification (2026-09-28): **143 backend tests, 13 frontend unit tests,
31 Playwright tests (24 connected + seven fixture-based), production build** —
all passed. Both npm dependency audits reported zero known vulnerabilities.
The student routes were checked at 320–1920px in both themes; public/admin routes
were also checked on mobile, tablet and desktop. MySQL 5.7.29 was a disposable
compatibility runtime, not a recommended production version; MySQL 8.4 Compose
and external mail/hosting were not executed here.

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
