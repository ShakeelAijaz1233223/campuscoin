> Frontend integration is implemented. See [the root guide](../README.md) for unified startup, cookie authentication, SMTP setup and current integration tests. Browser requests use `/api/v1` through the frontend proxy to port 5000.

# CampusCoin Backend

Production-ready REST API for **CampusCoin** — a student finance management platform.
Built with **Node.js + Express.js + MySQL + JavaScript** following a strict layered architecture:

```text
React.js Frontend → HTTP → Express Router → Auth → Authorization → Validation
→ Controller → Service (business rules) → Model (SQL) → MySQL
→ Service → Controller → JSON response
```

---

## 1. Requirements

| Tool | Version |
|------|---------|
| Node.js | **>= 20** (workspace tested on Node 22) |
| MySQL | **8.0+ recommended**; local compatibility tests used MySQL 5.7.29 |
| npm | >= 9 |

## 2. Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env        # then edit DB credentials + JWT_SECRET

# 3. Create database & tables
npm run migrate

# 4. Optional reference-data repair (no users or financial activity)
npm run seed

# 5. Start
npm run dev                 # development (auto-restart via --watch)
npm start                   # production
```

The API is served at **`http://localhost:5000/api/v1`** (change `PORT` in `.env`).

Health check: `GET http://localhost:5000/health`

## 3. Environment Variables (`.env`)

See `.env.example`. Key variables:

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default 5000) |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | MySQL connection |
| `JWT_SECRET` | **Change in production.** Signs auth tokens |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `CLIENT_URL` | CORS origin of the React frontend |
| `UPLOAD_DIR` | CSV upload directory (default `uploads`) |
| `MAX_FILE_SIZE` | Upload size cap in bytes (default 5 MB) |
| `AI_PROVIDER` | `none` (default keyword engine) or `openai` |
| `AI_API_KEY` | Only needed for external AI providers |
| `RESET_TOKEN_EXPIRY` | Password-reset token lifetime in ms (default 3600000 = 1 h) |

**Never commit real secrets.** `.env` is git-ignored.

## 4. Scripts

| Command | Action |
|---------|--------|
| `npm run migrate` | Create database + apply `database/schema.sql` + `database/indexes.sql` |
| `npm run seed` | Idempotent categories/settings/tips only; sample data requires `-- --demo`; destructive `--force` rejected |
| `npm run reset` | Destructive development-only reset, requires `-- --confirm=<database_name>` |
| `npm run create-admin` | `node scripts/create-admin.js <email> <password> [first] [last]` |
| `npm run create-test-user` | `node scripts/create-test-user.js [email] [password]` |
| `npm test` | Run backend tests against disposable `campuscoin_test` |
| `npm run dev` / `npm start` | Dev / production server |

## 5. Accounts and real data

Normal setup creates no user or financial sample data. Register via the frontend.
For admin bootstrap, set `ADMIN_EMAIL`/`ADMIN_PASSWORD` and run `npm run create-admin`,
or supply explicit email/password arguments. No default administrator is created.
The optional `seed -- --demo` and `create-test-user` scripts are for disposable
local databases only; their sample records are not real financial data. Never
use them to populate a real user workspace. Production blocks both demo modes.

## 6. API Base URL & Endpoint Groups

Base URL: **`/api/v1`**

| Group | Endpoints (examples) |
|-------|----------------------|
| `/auth` | register, login, logout, me, forgot-password, reset-password, change-password |
| `/ai` | status, suggest, suggest-batch, corrections (record + history), suggestions |
| `/profile` | get/update profile, preferences |
| `/accounts` | CRUD, ownership-protected, balance management |
| `/categories` | CRUD + `/defaults`; system categories protected |
| `/transactions` | CRUD + filters/pagination/search + recently-viewed/edited + unusually-large |
| `/recurring-transactions` | CRUD + toggle + `/process` |
| `/budgets` | CRUD + `/alerts`; duplicate-per-month enforced |
| `/goals` | CRUD + contributions + milestones + completion |
| `/bills` | CRUD + pay/unpay + upcoming + overdue |
| `/dashboard` | aggregated dashboard + `/forecast` |
| `/analytics` | category/daily/weekly/monthly spending, 6-month overview, historical averages, category growth, trends, budget consumption, savings rate |
| `/reports` | monthly, range (daily/weekly/category), monthly **PDF** |
| `/insights` | generate, history, by month, latest |
| `/tips` | personalized engine, system list, dismiss, pin, history |
| `/bookmarks` | tip & insight bookmark lifecycle |
| `/notes` | CRUD |
| `/notifications` | list, unread-count, mark read, mark-all, delete |
| `/imports` | CSV upload → preview → corrections → confirm (DB-transactional) → history + errors |
| `/exports` | transactions CSV/JSON + report PDF download |
| `/search` | global search across transactions, categories, bills, goals, tips, insights, notes |
| `/settings` | user settings |
| `/content` | active announcements + system tips |
| `/admin` | dashboard, statistics, users & status, reset access, default categories, announcements, system tips |

## 7. Frontend Connection

The frontend uses `VITE_API_BASE_URL=/api/v1`, Vite port **5173**, and
`API_PROXY_TARGET=http://127.0.0.1:5000`. No browser request targets a sandbox's
localhost. `frontend/src/api/apiClient.js` sends JSON, cookies, and
`X-Requested-With: CampusCoin` automatically. Login stores the JWT in an HttpOnly
cookie, not localStorage. `/auth/me` restores the user after reload; unauthenticated
401s are expected. Bearer headers are supported for standalone API clients.

Set `CLIENT_URL=http://localhost:5173` for local direct-origin CORS. Multiple
origins may be comma-separated. Production should use a same-origin HTTPS proxy.
See the [wire contract](../frontend/docs/API_CONTRACT.md).

### Standard response envelope

```json
{ "success": true, "message": "Request successful", "data": {}, "meta": {} }
```

```json
{ "success": false, "message": "Readable error message", "errors": [] }
```

Pagination metadata lives in `meta.pagination`:
`{ totalItems, totalPages, currentPage, itemsPerPage, hasNextPage, hasPreviousPage }`.

List endpoints accept `?page=&limit=` (max 100).

## 8. CSV Import Flow

```text
POST /imports/upload (multipart, field "file", + account_id)
  → file validation (CSV only, ≤5 MB) → parse → per-row validation
  → duplicate detection (DB history + intra-file) → AI categorization suggestions
  → preview returned (nothing saved yet)
PATCH /imports/:id/rows/:rowId        → user corrections (category override / skip)
POST /imports/:id/confirm             → single MySQL transaction inserts all rows
                                        (full rollback on failure) → result + notification
GET  /imports, /imports/:id, /imports/:id/errors
POST /imports/:id/cancel
```

Expected CSV columns (flexible headers): `date, description, amount, type, category, notes, account`.
Types accept `income/expense`, `credit/debit`, `in/out`. Dates accept `YYYY-MM-DD`, `DD/MM/YYYY`, etc.

## 9. AI Service (optional by design)

- `AI_PROVIDER=none` → built-in keyword engine (works offline, no key needed).
- `AI_PROVIDER=openai` + `AI_API_KEY` → external provider with automatic fallback to the keyword engine if the API fails.
- **AI never blocks anything**: transactions can always be created manually; the AI output is advisory only and marked as such.
- The engine **learns from corrections**: `/ai/corrections` records user overrides; future suggestions for similar descriptions prefer the user's corrected category (confidence 0.99).

## 10. Scheduled Jobs

The server runs an in-process scheduler (hourly + shortly after boot):

- **Recurring generation**: creates transactions for due recurring rules with duplicate prevention (one transaction per rule per date).
- **Bill reminders**: creates `bill_reminder` notifications within each bill's `reminder_days` window and `bill_overdue` notifications after the due date (deduplicated per day).

## 11. Security

- Helmet security headers, CORS allow-list, global + auth + upload rate limiting.
- bcrypt password hashing (12 rounds), JWT bearer auth, account lockout after 5 failed logins (30 min).
- Parameterized SQL everywhere (mysql2 prepared statements) — SQL-injection safe.
- Input validation on every route (express-validator) + XSS-input sanitization middleware.
- Per-resource ownership checks; role authorization (`admin`) on every admin route.
- Upload validation: CSV extension/MIME filter, 5 MB cap.
- Password hashes are never returned; registration/login return a JWT for API clients; path-traversal-safe downloads; audit logging via `activities`.
- Password reset: hashed tokens, single use, expiry, all outstanding reset tokens invalidated after use; concurrent reuse is rejected. Token is returned only outside production for testability.

## 12. Testing

```bash
DB_NAME=campuscoin_test npm run migrate
npm test        # defaults to the disposable campuscoin_test database
```

127 backend tests: auth (register/login/logout/forgot/reset/suspended/admin), profile, categories, transactions (CRUD, filters, duplicates, AI, ownership), recurring (generation + idempotency), budgets (spent/remaining/alerts/exceeded), goals (milestones/completion), bills (overdue/upcoming/pay), reports (monthly/range/PDF magic-bytes/leak-check), CSV import (full pipeline, errors, duplicates, ownership), insights/tips/bookmarks/notes, admin (users, categories, announcements, tips, statistics), security (invalid/expired/forged tokens, SQL injection, XSS, cross-user access, role escalation).

Tests run with `NODE_ENV=test` (rate limiting no-oped, fast bcrypt rounds) and spin up the app on an ephemeral port.

## 13. Production Notes

- Set strong `JWT_SECRET`, correct `CLIENT_URL`, and `NODE_ENV=production`.
- Errors are masked in production (no stack traces / internals leaked).
- Export/report files auto-delete after 30 minutes; `uploads/` files are removed after import completes.
- Consider running behind nginx with TLS; the app binds `0.0.0.0`.
- DB pool: 20 connections (tune in `src/config/database.js`).

## 14. Troubleshooting

| Problem | Fix |
|---------|-----|
| `MySQL connection failed` | Check `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD` in `.env`; ensure MySQL is running |
| `ER_DUP_KEYNAME` during migrate | Harmless — indexes already exist (script auto-skips) |
| Existing database | `migrate`/default `seed` preserve users and finances; never force reseed |
| Port 5000 in use | Change backend `PORT` and frontend `API_PROXY_TARGET` together |
| 401 after restart | JWT secret changed or token expired — log in again |
| CSV import "Invalid account" | Pass `account_id` of one of your accounts in the upload form |
| PDF link expired | Report files auto-clean after 30 min — regenerate |
| Tests fail connecting | Start MySQL, run `DB_NAME=campuscoin_test npm run migrate` first |

## 15. Project Structure

Architecture: `routes → controllers → services → models → MySQL`. See the root audit report for executed coverage and limitations. Endpoint groups: authentication, profile, categories, transactions, recurring, budgets, goals, bills, dashboard, analytics, reports + PDF, AI insights, saving tips, bookmarks, notes, notifications, CSV import, exports, search, settings, content, admin, forecast, recent activity, unusual/duplicate detection, and full security architecture.
