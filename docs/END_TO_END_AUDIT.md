# CampusCoin end-to-end audit

Date: **2026-09-27**. Scope: this repository and the local sandbox deployment.
This is not a claim that an external/production database or mail provider was tested.

## Problems found and fixes

- **Registration/reset validation:** forms enforced 12 characters while the API
  accepted 8, and the frontend helper accepted passwords missing required character
  classes. Forms now use the API's 8+/uppercase/lowercase/number policy and explain
  violations before submitting. Server validation remains enabled.
- **Field conversion:** retained and tested full name → `first_name`/`last_name`,
  year labels → `academic_year`, and allowance → `monthly_allowance`. Empty optional
  years are omitted; canonical year values are not discarded. Financial form
  limits/options were aligned with their API validators.
- **Concurrent auth requests:** simultaneous duplicate registration now yields
  201/409 rather than 201/500. Reset tokens are rechecked under a user/row lock so
  concurrent reuse yields 200/400 rather than resetting twice.
- **Logout:** a browser whose session already expired can still clear stale UI state.
- **Dates:** month boundaries no longer shift to the previous day in Karachi;
  date-only UI values retain their date in western time zones. Recurring month/year
  steps clamp to valid calendar days. MySQL sessions explicitly use UTC so SQL
  timestamps and JS-generated password-reset expiry agree.
- **Recurring generation:** posting and progress update share a rule lock to prevent
  concurrent duplicate posting. Rules catch up through their end date, not beyond
  it. Updates validate category/type consistency.
- **Setup/data safety:** migration/default seeding add only reference categories,
  settings and educational tips, not user finances. They preserve existing data.
  Index creation skips duplicates individually instead of abandoning later indexes.
  Demo seeding is explicit and production-blocked; destructive force seeding is
  rejected. Reset requires an explicit database confirmation and rejects production.
- **Scripts/config:** fixed missing `path` imports in user/admin scripts and sample
  account balance reconciliation. Admin bootstrap requires chosen credentials and
  creates records atomically without printing passwords. Backend `.env` loading is
  independent of the working directory. Vite uses port 5173 with `strictPort`, the
  configured proxy target, and browser-relative `/api/v1`. CORS list entries are
  trimmed. The root browser-test command now forwards test filter flags correctly.
- **Documentation:** removed outdated port-3000/localStorage instructions and unsafe
  force-seeding advice. Test fixtures are clearly separated from application data.

Regression tests were added before fixes for password policy, date boundaries,
concurrent registration/reset, and expired recurring catch-up. Those tests
reproduced failures before the implementation was changed.

## Database verification

- Actual MySQL **5.7.29** compatibility runtime; application database **`campuscoin`**.
  MySQL 8.4 Compose is provided but was not executed. Use a supported MySQL release
  and restricted credentials for a real deployment, not this disposable runtime.
- Verified connection settings through successful SQL connections; local secrets
  remain in ignored `.env` files, not committed source.
- Inspected **26 tables / 261 expected columns** against `information_schema`.
  No missing columns in the tested schema; no destructive schema repair needed.
- Verified all **10** additional performance indexes after migration rerun.
- Compared users/password hashes/roles/statuses and account balances before/after
  migration and default seeding in the test DB: unchanged.
- The regression suite uses **`campuscoin_test`**. Normal `campuscoin` setup had
  zero users and zero transactions, plus 12 reference categories.
- A final development-mode browser run registered
  `test-agent-final-1790511824659@example.com` in **`campuscoin`**, queried its user,
  profile, bcrypt hash and zero-balance wallet, exercised authentication, and then
  removed **only that newly created test identity**. The application DB returned
  to zero users/transactions. No pre-existing user data was deleted.

## Authentication and final connected run

Executed in development mode, with no API interception:

| Operation | Result |
|---|---|
| `GET /health` | 200 |
| Homepage, registration and login pages | Loaded |
| Valid UI registration → Vite → API → MySQL | 201; user/profile/wallet saved |
| Password storage | bcrypt hash verified; not plaintext |
| Login through the form | 200; dashboard redirect |
| `GET /auth/me` with cookie | 200 |
| `GET /auth/me` with Bearer JWT | 200 |
| Dashboard and reload | Real DB response; zero finances for a new account |
| Change password | 200 |
| Forgot/reset password through forms | Passed using development reset link |
| Login with reset password | Passed |
| UI logout | Cookie and frontend auth state cleared |
| Anonymous `/auth/me` before login/after logout | Expected 401 |
| Frontend runtime errors in final smoke run | None |

Browser JWTs remain in the existing **HttpOnly cookie**, automatically sent with
`credentials: include`. No JWT is stored in localStorage/sessionStorage. Standalone
Bearer authentication is also tested. Logout clears the browser session; standalone
JWTs remain stateless until their configured expiry. Reset invalidates outstanding
reset tokens, not every previously issued access JWT.

## Broader executed coverage

- Auth/session/roles; profile/settings; accounts/categories; transactions and balances;
  budgets; goals/contributions; bills/reminders; recurring rules/generation.
- Dashboard, forecast, all ten analytics endpoints, monthly/range reports, PDF/CSV/JSON
  downloads, search, insights/tips/bookmarks/notes, notifications, content and admin APIs.
- CSV upload/validation/correction/duplicates/confirmation/ownership and concurrency.
- Browser student/admin route sweeps with runtime/API error collection; persisted CRUD;
  CSV imports; report downloads; registration and password reset; reload and logout.
- Expected invalid-input/authorization errors are asserted, not hidden or turned into
  fake successful responses. A normal anonymous 401 is not counted as a project bug.

## Final validation results

| Check | Result |
|---|---|
| Backend integration/regression tests | **127 passed** |
| Frontend unit tests | **11 passed** |
| Playwright | **22 passed**: 15 real-backend flows + 7 isolated UI fixtures |
| Production frontend build | Passed |
| Backend JS syntax checks | Passed |
| Dependency audit | 0 reported vulnerabilities in both dependency audits |
| Migration/reference-seed rerun | Passed, existing records preserved |
| Admin/test-user bootstrap scripts | Executed successfully in test DB |
| Destructive reset / force-seed guards | Rejection verified; no destructive operation executed |
| `git diff --check` | Passed |
| Lint | No lint script defined; none invented |

Commands and environment requirements are in the root README. Browser execution
used an installed Chromium executable via `PLAYWRIGHT_CHROMIUM_EXECUTABLE`; no
browser binary, DB files, logs, `.env`, or build output is included in Git.

## Remaining deployment dependencies and limits

- **External email delivery is unverified.** Configure SMTP to deliver production
  reset links. Development/test reset generation, expiry, single use and password
  updates were executed. Never expose development reset links in production.
- The normal development preview runs against `campuscoin`, not the test DB. This
  local verification does not update or validate your separate deployed environment.
- Weekly-report/email toggles persist preferences; there is no bulk weekly-email
  sender. The local keyword/statistical insight engine is not an external LLM.
- Existing product semantics remain: currency labels are not FX conversion; marking
  a bill paid does not create a debit transaction; report sharing uses browser files.
- MySQL 8.4, production HTTPS/cookie/proxy deployment, and third-party iframe cookie
  behavior were not certified by this local compatibility run.

## Changed files

- `README.md`
- `backend/.env.example`
- `backend/README.md`
- `backend/database/README.md`
- `backend/database/defaults.js`
- `backend/database/seed.sql`
- `backend/scripts/create-admin.js`
- `backend/scripts/create-test-user.js`
- `backend/scripts/migrate.js`
- `backend/scripts/reset.js`
- `backend/scripts/seed.js`
- `backend/src/app.js`
- `backend/src/config/database.js`
- `backend/src/config/env.js`
- `backend/src/models/recurring.model.js`
- `backend/src/services/auth.service.js`
- `backend/src/services/dashboard.service.js`
- `backend/src/services/recurring.service.js`
- `backend/src/utils/dates.js`
- `backend/tests/admin.test.js`
- `backend/tests/auth.test.js`
- `backend/tests/connectivity.test.js`
- `backend/tests/dates.test.js`
- `backend/tests/helpers.js`
- `backend/tests/recurring.test.js`
- `docs/END_TO_END_AUDIT.md`
- `frontend/docs/API_CONTRACT.md`
- `frontend/src/api/contract.js`
- `frontend/src/components/common/entityConfig.js`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/pages/AuthPage.jsx`
- `frontend/src/pages/Settings.jsx`
- `frontend/src/utils/formatDate.js`
- `frontend/src/utils/validators.js`
- `frontend/tests/contract.test.js`
- `frontend/tests/e2e/connected.spec.js`
- `frontend/tests/validators.test.js`
- `frontend/vite.config.js`
- `package.json`
