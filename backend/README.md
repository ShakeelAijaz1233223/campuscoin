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
| Node.js | **>= 18.0.0** (built & tested on 20.x) |
| MySQL | **8.0+** (MariaDB 10.6+ also works) |
| npm | >= 9 |

## 2. Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env        # then edit DB credentials + JWT_SECRET

# 3. Create database & tables
npm run migrate

# 4. Load development seed data
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
| `npm run seed` | Load dev/test data (idempotent; `--force` to wipe & reseed) |
| `npm run reset` | Drop, recreate, migrate and seed the database |
| `npm run create-admin` | `node scripts/create-admin.js <email> <password> [first] [last]` |
| `npm run create-test-user` | `node scripts/create-test-user.js [email] [password]` |
| `npm test` | Run the full test suite (106 tests) |
| `npm run dev` / `npm start` | Dev / production server |

## 5. Test Credentials (seed data)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@campuscoin.com` | `Admin@123` |
| Student | `student@campuscoin.com` | `Student@123` |

The seeded student comes with accounts, 2 months of transactions, budgets, goals + contributions, bills, recurring rules, tips, an insight, and notifications — so every dashboard widget has real data immediately.

> These are development/test credentials only. Never use them in production.

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

```js
// React example
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const res = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { data } = await res.json();
localStorage.setItem('token', data.token);
// Subsequent requests:
headers: { Authorization: `Bearer ${token}` }
```

Set `CLIENT_URL` in the backend `.env` to the frontend origin (e.g. `http://localhost:3000`) so CORS allows it. Multiple origins: comma-separate them.

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
- Passwords/hashes/tokens are never returned in any response; path-traversal-safe downloads; audit logging via `activities`.
- Password reset: hashed tokens, single use, expiry, all sessions of that token invalidated after use. Token is returned only outside production for testability.

## 12. Testing

```bash
npm test        # requires MySQL up + npm run migrate && npm run seed
```

106 tests across 13 suites: auth (register/login/logout/forgot/reset/suspended/admin), profile, categories, transactions (CRUD, filters, duplicates, AI, ownership), recurring (generation + idempotency), budgets (spent/remaining/alerts/exceeded), goals (milestones/completion), bills (overdue/upcoming/pay), reports (monthly/range/PDF magic-bytes/leak-check), CSV import (full pipeline, errors, duplicates, ownership), insights/tips/bookmarks/notes, admin (users, categories, announcements, tips, statistics), security (invalid/expired/forged tokens, SQL injection, XSS, cross-user access, role escalation).

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
| `Database already contains users` on seed | Expected — use `npm run seed -- --force` to reseed |
| Port 5000 in use | Change `PORT` in `.env` |
| 401 after restart | JWT secret changed or token expired — log in again |
| CSV import "Invalid account" | Pass `account_id` of one of your accounts in the upload form |
| PDF link expired | Report files auto-clean after 30 min — regenerate |
| Tests fail connecting | Start MySQL, run `npm run migrate && npm run seed` first |

## 15. Project Structure

See the repository tree — every layer (`routes → controllers → services → models → MySQL`) is fully connected; no placeholders, TODOs, or fake data. SRS coverage: authentication, profile, categories, transactions, recurring, budgets, goals, bills, dashboard, analytics, reports + PDF, AI insights, saving tips, bookmarks, notes, notifications, CSV import, exports, search, settings, content, admin, forecast, recent activity, unusual/duplicate detection, and full security architecture.
