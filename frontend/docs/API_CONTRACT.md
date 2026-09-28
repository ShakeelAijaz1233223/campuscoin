# CampusCoin frontend ↔ backend contract

Implemented REST base: `/api/v1`. Browser calls are same-origin through Vite's
proxy (development/preview) or a production reverse proxy. Default API port: 5000.

## Transport and authentication

- Success: `{success, message, data}`. Paginated responses additionally carry
  `meta.pagination: {totalItems, totalPages, currentPage, itemsPerPage, ...}`.
- Errors: `{success:false, message, errors?:[{field,message}]}` with HTTP status.
- Login sets `campuscoin_session`: HttpOnly, SameSite=Lax, path `/api/v1`, Secure
  in production. The browser sends credentials and `X-Requested-With: CampusCoin`.
  Cookie-authenticated writes without that header receive 403. Bearer-token API
  clients are still supported. Public auth POST bodies must be JSON (415 otherwise).
  Logout clears the browser cookie and revokes prior cookie/Bearer sessions.
- Tokens are not stored in browser local/session storage. Authorization and record
  ownership are enforced on the backend, not just by route guards.

Registration/reset share the 8+ character, uppercase/lowercase/number password
policy. Name and academic-year conversion live in `api/contract.js`; optional
blank academic year is omitted so the API can apply its default. Registration
returns a JWT but intentionally asks the user to sign in before browser session
creation. JWTs are HS256 and checked against the user’s `session_version`, not
merely accepted until expiry. Logout, password reset/change and admin access/status
changes revoke prior sessions; password change issues a fresh current session.
Run the additive migration before deploying this authentication code.

## Wire endpoints (snake_case)

| Area | Actual endpoint / payload |
|---|---|
| Auth | `POST /auth/register {first_name,last_name,email,password,academic_year,monthly_allowance}`; `POST /auth/login {email,password}`; `GET /auth/me`; `POST /auth/logout` |
| Reset | `POST /auth/forgot-password {email}`; `POST /auth/reset-password {token,password}`. The **frontend page** is `/reset-password/:token`, not the API endpoint. |
| Profile | `GET/PATCH /profile`: `first_name,last_name,academic_year,monthly_allowance,monthly_savings_goal,currency`; email is not editable. GET returns `{user,profile,preferences}`. |
| Accounts | CRUD `/accounts`, key `accounts`/`account`: `name,type,balance,currency` |
| Categories | CRUD `/categories`, key `categories`/`category`: `name,type,color,icon`. System categories cannot be changed by students. Existing category type is immutable. |
| Transactions | CRUD `/transactions`, key `transactions`/`transaction`: `account_id,category_id,type,amount,date,description,notes`; filters `search,type,category_id,account_id,start_date,end_date,min_amount,max_amount,sort,order,page,limit` |
| Category suggestion | `POST /ai/suggest {description,type}` → `{suggestion:{category_id,category_name,confidence,...}}` |
| Recurring | CRUD `/recurring-transactions`, keys `recurring_transactions`/`recurring_transaction`: `account_id,category_id,type,amount,description,frequency,start_date,end_date,is_active`; start date is immutable in edit form. |
| Budgets | CRUD `/budgets`, keys `budgets`/`budget`: `category_id,amount,month:1..12,year`; GET filters `month,year`. Display name comes from expense category. |
| Goals | CRUD `/goals`, keys `goals`/`goal`: `name,target_amount,current_amount,target_date,description`; `GET/POST /goals/:id/contributions` and `DELETE /goals/:id/contributions/:contributionId` are connected in the UI (`amount,note`). Contributions track savings but do not debit accounts. |
| Bills | CRUD `/bills`, keys `bills`/`bill`: `name,amount,due_date,category_id,reminder_days,notes,is_paid` |
| Dashboard | `GET /dashboard?month=9&year=2026`: `balance:{total,currency}`, `month_summary`, `recent_transactions`, `spending_trend`, `budgets`, `category_spending`, `monthly_overview`, `current_insight`, `saving_tips`, `budget_alerts`, `active_goals` (amounts/progress), `upcoming_bills` |
| Reports | `GET /reports/range?start_date&end_date&category_id&income_category_id` → `{report:{totals,daily,weekly,monthly,categories,transactions,currency,...}}`; optional `include_transactions=false` omits transaction rows from the response for charts (it does not eliminate underlying aggregation work). Monthly legacy API remains available. |
| Report export | `GET /reports/range/export?...same filters...&format=pdf|csv|json` → authenticated file. Six-month UI derives first day of the month five months before `to`. |
| Insights | `GET /insights?month=9&year=2026&page&limit`, `POST /insights/generate {month,year}`, `GET /insights/:id`; keys `insights`/`insight` |
| Tips | `GET /tips?page&limit`; `POST /tips/dismiss {tip_id}`. Dismissal is per user and survives reload. |
| Bookmarks | `GET /bookmarks/tips`, `GET /bookmarks/insights`; `POST/DELETE /bookmarks/tips/:tipId` or `/bookmarks/insights/:insightId` |
| Notes | CRUD `/notes`, keys `notes`/`note`: `title,content` |
| Notifications | `GET /notifications?is_read=0&page&limit`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`; keys `notifications`, `unread_count` |
| CSV | `POST /imports/upload` multipart `file,account_id,use_ai` → import preview; `GET /imports/:id` → stored rows; `POST /imports/:id/confirm {include_duplicates,skip_duplicates}` → result counts |
| Search | `GET /search?q=` → `{results:{transactions,categories,goals,tips,insights,notes},total_results}` |
| Settings | `GET/PATCH /settings` → `{settings}`; `notifications_enabled,email_notifications,weekly_report` are persisted preferences. In-app opt-out suppresses new notifications, retaining history. Email flags store preferences; weekly delivery is not automated. Theme/font have local appearance controls. |
| Admin users | `GET /admin/users?search&page&limit`; `PATCH /admin/users/:id/status {status:active|suspended|inactive}`; `POST /admin/users/:id/reset-access` |
| Admin content | CRUD `/admin/default-categories`, `/admin/announcements`, `/admin/tips`; **PUT** for edits. Announcements use `content,is_active,expires_at`; tips use `content,status:active|inactive`. |
| Admin statistics | `GET /admin/dashboard`, `GET /admin/statistics/categories` |

Generic CRUD means GET collection, GET item where supported, POST collection,
PATCH item (PUT for admin content), DELETE item. The UI uses only supported actions.
Backend list limits are capped at 100 for paginated resources; categories/accounts
are returned as full collections and paginated for display in the adapter.

## UI mapping

`src/api/contract.js` explicitly maps camelCase inputs to wire fields and unwraps
resource envelopes. Examples: `savedAmount ↔ current_amount`, `body ↔ content`,
`enabled ↔ is_active`, bill `status:paid ↔ is_paid:true`, `month:YYYY-MM ↔ month/year`.
`apiClient.js` retains server pagination metadata before adapters return
`{items,total}` to `useResource`. Each specialized API module maps compound data
such as dashboard, reports, search, profile and bookmarks.

No `/imports/validate`, `/exports/share`, `/transactions/suggest-category`, or
`/admin/system-tips` requests are made: these were proposed endpoints that did not
exist. Report sharing now uses the browser's PDF file share/download capability.

## Validation and import consistency

- Calendar validation rejects impossible dates (for example, February 30) before
  SQL insertion. Valid leap days and the documented CSV date formats still work.
- Failed CSV validation records a failed import and removes the uploaded file.
  Changing a category cannot make an invalid amount/date row valid; edit and
  revalidate the row first.
- Confirmation, row correction and cancellation serialize on the import record.
  Concurrent confirmations cannot double-post transactions or change a completed
  import back to another status, including when every row is skipped.
- Confirmation always returns `total_rows`, `imported`, `skipped`, `failed`, and
  `duplicates_skipped`, including zero-row imports. The UI preserves server counts.
- Empty CSV files clear any previous preview and show an error; preview controls
  are disabled while a validation or confirmation request is in flight.
- New budget forms inherit the selected budget month. Deleting the last item on
  a paginated screen returns to the preceding page instead of stranding the UI.


## Product semantics

- Bill payment status and goal contributions are tracking actions, not bank debits.
- The AI engine is local keyword/correction/rule logic; external LLM configuration
  falls back with a warning rather than pretending to contact a provider.
- Currency preferences are not exchange-rate conversion; mixed-currency aggregate
  figures must not be treated as a converted portfolio balance.
- Export downloads require an exact owner-prefixed generated filename and reject
  directory components. CSV outputs neutralize spreadsheet formulas.
