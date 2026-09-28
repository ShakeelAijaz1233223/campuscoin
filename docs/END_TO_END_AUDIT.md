# CampusCoin — repository audit and implementation verification

**Date:** 2026-09-28 · **Scope:** this checkout and the local sandbox stack.

This report supersedes the earlier light-theme audit. The initial repository review was followed by the requested implementation: Nocturne redesign, connected feature improvements, additive session migration, financial/security fixes, and a second verification pass. It is not a production deployment certificate or an assertion that every possible defect has been eliminated.

## A. Outcome

- Dark-first, token-driven Nocturne UI across public, student and administrator routes, with a complete light theme.
- Working React → Express → MySQL architecture retained; no replacement backend, fake balance fallback, generated production ledger, or local-storage session token.
- **143 backend tests + 13 frontend unit tests + 31 browser tests passed**, with no failures or skips in the final runs. Of the browser tests, 24 use the connected stack and seven use explicit UI fixtures; one connected test deliberately intercepts a report request to verify failure/retry behavior.
- Production Vite build passed. Both package-tree npm audits reported zero known vulnerabilities at verification time.
- Migration/reference-seed rerun preserved existing user and financial rows in the test database.
- Remaining product and deployment limits are explicit in section V.

## B. Repository and scope

The actual checkout is `ShakeelAijaz1233223/campuscoin`, based on `4b2dabe37d3ea13f927b36102b8734a211293292`. Work is constrained to session branch `arena/01a0e910-campuscoin`; it must not be represented as a push to `main`.

The review covered root scripts/configuration, frontend routes/layouts/forms/adapters/hooks/styles, backend routes/controllers/services/models/middleware/jobs, SQL schema/indexes/migrations, tests and operational documentation. Generated dependencies, build output and credentials were excluded from source inventory. No separate design attachment was present; the textual dark-luxury/glass/aurora direction informed the implementation.

## C. Architecture and runtime

- Frontend: React 19, React Router 7, Vite 6, Recharts 2, Lucide, PapaParse, CSS custom properties; self-hosted Inter Variable. No new animation framework or WebGL runtime.
- Backend: Express, mysql2, JWT, bcrypt, express-validator, Helmet, Multer, CSV parsing, PDFKit, Nodemailer and in-process jobs.
- Local verification: Node 22, genuine disposable MySQL **5.7.29**, Chromium/Playwright. MySQL 5.7 is end-of-life and was a compatibility runtime only; supported MySQL 8.x/8.4 deployment remains to be verified.
- Browser requests use `/api/v1`; Vite binds `0.0.0.0:5173` and proxies to Express on port 5000. There are no new browser-to-localhost service calls. SPA fallback/reverse proxy/TLS belong to the production hosting layer.
- Root scripts remain `setup`, `dev`, `db:migrate`, `db:seed`, `build`, `test`, and `test:e2e`.

## D. Routes and feature coverage

| Surface | Implementation / connected behavior |
|---|---|
| Home, help, sitemap, errors | Nocturne branding, responsive typography, navigation, honest capability descriptions, 403/404 states |
| Login, register, forgot/reset password | Shared cinematic split layout; actual auth API, validation, cookie session and development reset flow |
| Dashboard | Selected-month totals; all-time account balance; annual cash flow; six-month overview; recent entries, budgets, goals, upcoming bills and stored/generated local insights |
| Transactions | CRUD, detail view, pagination, filters/search, account/category selection and category suggestions |
| CSV import | File/row validation, server preview, corrections, duplicates, confirm/result counts; no fabricated import success |
| Categories / recurring | Connected CRUD; immutable category type; recurrence remains server-driven |
| Budgets | Selected month, real spent/remaining figures, alerts and progress |
| Savings goals | CRUD plus newly exposed contribution history/add/remove; completion and reopening update atomically |
| Bills | CRUD, due/upcoming/overdue status and mark-paid; payment is tracking, not a bank transfer |
| Reports | Real period/category filters, charts, PDF/CSV/JSON export and browser share/download |
| Insights / tips / saved | Local analytics and keyword suggestions, generation, per-user dismissal/bookmarks, saved notes |
| Notifications / search | Real unread state, read actions, backend search results; no synthetic notification feed |
| Profile / settings / accounts | Profile/password changes, local theme/font preferences, persisted notification preferences, connected accounts |
| Administration | Protected dashboard, users/access reset/status, default categories, announcements, tips and statistics |

Shared `EntityWorkspace`, `EntityForm`, `UI`, layout and token changes propagate to the thin route wrappers; rewriting every stable page file was neither necessary nor desirable.

## E. Design system

`styles/variables.css` defines dark/light canvas, text, muted text, cyan/violet accents, semantic states, chart colors, borders, radii, spacing, shadows and motion timing. `styles/nocturne.css` composes the new system over the existing structural CSS. Main, secondary and tertiary glass surfaces use restrained translucency and hairlines rather than indiscriminate blur. The shell, auth, marketing, tables, dialogs, cards, empty states, admin and settings share this vocabulary.

The geometric coin/orbit artwork is CSS, not a stock image, financial chart or external asset. Inter is served from the application's own build, not an external font CDN. Existing structural CSS remains for compatibility; a future CSS consolidation would reduce overlapping selectors but was not required for this redesign.

## F. Frontend structure and new components

New: `AnimatedAmount`, `Hologram`, `UpcomingBills`, `GoalOverview`, `GoalContributions`, `useMobileNavigation`, `utils/chartData`, `nocturne.css` and dedicated regression tests.

Modified areas include Dashboard/Home/Auth/Help/Settings, sidebar/brand, summary/hero/budget/chart components, shared forms/workspaces/UI, theme/notification/resource lifecycle, goal/report/search adapters and transaction filters. Detailed design decisions are in [REDESIGN_NOTES.md](REDESIGN_NOTES.md).

## G. Transport and contracts

The existing JSON envelope, pagination metadata, snake_case wire fields and camelCase adapter layer remain intact. Additions are backward-compatible: `include_transactions=false` for range responses, dashboard goal amounts, and the session-version column/claim. Existing contribution endpoints are now exposed in the UI. Report filenames/headers and authenticated download handling were hardened without replacing export flows.

The [API contract](../frontend/docs/API_CONTRACT.md) documents authentication revocation and contribution semantics. No imaginary endpoint was introduced to back a decorative button.

## H. Loading, error and mutation handling

- Shared loading skeletons are decorative and announced through a status message, not presented as data.
- Empty records show real empty states; API failures show retry/error states rather than plausible amounts.
- `useResource` cancels superseded/unmounted requests, debounces text search by 200ms and coalesces mutation invalidations by 80ms.
- Header quick-add refreshes an already mounted ledger and annual dashboard chart; regression tests cover both.
- Form account/category requests are abortable, have retry/error/loading states and block submission while unavailable. Mutation buttons disable duplicate submissions; busy form dialogs cannot be dismissed mid-write.
- Existing server pagination and page correction after deletion remain functional.

## I. Authentication and session fixes

JWTs are explicitly HS256 and backed by `users.session_version`. Authentication checks the current user/status/version. Logout revokes all existing sessions, including separately held Bearer tokens; reset, password change, admin reset-access and status changes also invalidate previous sessions. Password change issues a fresh session for the current client. There is no unsupported promise of selective per-device logout.

Cookies remain HttpOnly, SameSite=Lax, `/api/v1`, Secure in production. Cookie writes require the custom request header. Public auth actions reject non-JSON, form-compatible content types, preventing an easy login-CSRF path. JWTs are not persisted in browser storage. Password validation errors do not reflect submitted secrets. Production requires a sufficiently long JWT secret and disallows wildcard credentialed CORS. Existing bcrypt, lockout, rate limiting and single-use hashed reset-token behavior are preserved.

## J. Authorization and exports

Backend ownership and role checks remain authoritative. Tests cover invalid/forged/expired sessions, suspended users, cross-user resources, imports/reports, category restrictions and administrator routes.

A concrete report-download issue was fixed: checking an owner's prefix before calling `basename` could hide a directory component. Download now requires the exact current user's generated-report filename pattern, rejects directory components, resolves inside the export directory and uses `sendFile` error handling. An encoded-directory regression is included. Uploaded financial CSVs remain private, not a public static directory.

## K. Validation and input/output safety

Transactions reject unsupported transfer requests, fractional cents and forged import/recurrence metadata. Category type is immutable on update so historical transaction classification cannot be changed through an unchecked property. Note create/update limits now match the form's 10,000-character ceiling. Existing date, category/type, account ownership, CSV validation and parameterized query behavior are retained.

CSV cells are formula-neutralized and quote-escaped at export; stored user data is not rewritten to achieve this. React text escaping remains the rendering boundary; no raw HTML or dynamic code execution was added. Static source scans found no TODO/FIXME, raw HTML assignment, `eval`/`new Function`, browser-stored auth-token pattern or private-key block in the scanned scope. This is not a substitute for an independent penetration test or complete secret-history scan.

## L. Financial correctness

- Transaction create/update/delete use database transactions and locks for balance adjustments. Concurrent delete reverses once; concurrent update preserves the balance invariant.
- Budget changes lock and recalculate applicable totals rather than trusting client-supplied spent amounts.
- Goal contributions validate amounts, lock the goal, update the balance and completion together, and support deletion/reopening without exposing another user's contribution.
- Goal contributions and paid bills **do not debit financial accounts**. Their UI/help text describes tracking rather than claiming movement of money.
- Dashboard insight selection and monthly comparison use the selected month. Growth/expense-anomaly logic and currency labels were corrected in the local insight/tip paths.
- Annual charts leave unrecorded future periods blank rather than drawing a false collapse to zero. Recorded future entries remain visible. Unit tests cover both cases.
- Values are backed by database records; screenshots with balances use explicitly isolated test fixtures. Multi-currency limits remain in section V.

## M. Database and preservation

The only new schema field is `users.session_version INT UNSIGNED NOT NULL DEFAULT 0`, supplied in the fresh schema and an additive, repeatable migration. Migration scripts apply it to existing installations. There are **26 tables / 262 columns** in the verified schema. Existing reference seeding remains idempotent and does not generate user finances; destructive/demo seed modes were not used on the application database.

Verification hashed ordered row snapshots of `users`, `profiles`, `accounts`, `transactions`, `budgets`, `goals` and `goal_contributions` before and after rerunning migrate and default seed in `campuscoin_test`: every compared snapshot was unchanged. This includes existing password hashes/roles and financial amounts without printing them. Secrets stayed in ignored/local environment files. No production database was accessed.

After the integration suite, the preview API was returned to development mode
on the separate `campuscoin` application database and its migration was applied.
A final real-form smoke check verified registration, SQL bcrypt storage, zero
initial balance, login, dashboard, reload and logout. Only that newly created
smoke identity was then removed; original application counts remained zero users
and zero transactions. Test-suite financial fixtures are not served by the final
preview. A preview-host HTTP probe returned 200; proxied anonymous `/auth/me`
returned the expected 401.

## N. Forms and accessibility behavior

Labels, validation details, visible focus, semantic buttons, dialog busy states, chart data tables and screen-reader amounts remain available. Animated money has one stable accessible final value, with the visual animation hidden from assistive technology. The mobile drawer traps focus, supports Escape, restores the trigger, locks body scrolling and marks the background/offscreen navigation inert.

Automated axe WCAG 2 A/AA and 2.1 AA checks passed on login, dark dashboard, transaction dialog and light settings. This is a sample audit, not a complete WCAG certification. Human screen-reader/browser-matrix testing remains unperformed.

## O. Notifications and preferences

Disabling in-app notifications suppresses new notification insertion while preserving existing history. Defaults are in-app on, email/weekly preferences off. The frontend refreshes unread state without invented alerts. Email preferences persist, but there is **no implemented weekly-email scheduler**; Settings and Help now say so. SMTP password-reset delivery is a deployment dependency, not a tested external success.

## P. Reports and analytics

Monthly/range filters, PDF/CSV/JSON downloads, account ownership and financial content are exercised through real endpoints. Annual dashboard requests can omit transaction rows to reduce response payload. This does **not** claim that the server's underlying range aggregation stopped loading ledger rows; large-ledger memory/query work remains a scalability limit. Dedicated transaction CSV export has a 10,000-row cap. Temporary report cleanup behavior is unchanged.

## Q. AI and generated content

The running implementation is deterministic local keyword categorization, stored corrections and rule-based insights/tips, using actual user records. A pretend external-provider success path was removed. Unsupported external-provider configuration warns and falls back to the local engine; it does not contact OpenAI or any other LLM. The environment sample and backend guide were corrected. Suggestions remain advisory and are never silently applied as financial truth.

## R. Responsiveness

The final browser sweep visited all 15 student routes at **320, 390, 768, 1440 and 1920px in both themes**, checking document overflow and runtime errors. A 320px dashboard check also passed at the largest reading size. Public and six admin routes passed at 320, 768 and 1440px. A genuine Help-header overflow at 320px was found and fixed with responsive wrapping. Tables may scroll inside their intended containers; the page itself did not overflow in these checks.

## S. Motion and performance

Amount entrances, hover/focus elevation, skeleton shimmer, chart drawing and a calm transform-based orbit/aurora provide motion without a canvas render loop or 3D library. Reduced-motion disables decorative movement and bypasses amount tweening; a browser assertion verifies the hologram has no animation. Mobile reduces effects.

Production build: **9.95s** in the final recorded run. Main JS **322.25kB / 102.13kB gzip**; separate chart chunk **424.58kB / 114.91kB gzip**. Routes remain lazy-loaded. These are build measurements, not Lighthouse/Core Web Vitals scores. Recharts is still a substantial chart payload. No sustained load, battery or low-end-device benchmark was run.

## T. Tests and evidence

| Check | Final result |
|---|---|
| `npm test` backend (real MySQL) | **143/143**, zero failures/skips, 15.44s |
| `npm test` frontend units | **13/13**, zero failures/skips |
| Connected + fixture Playwright suite | **31/31**, zero failures/skips, 5.8 minutes |
| `npm run build` | Passed, 9.95s |
| Frontend and backend `npm audit` | Zero known vulnerabilities reported |
| Repeat migration/default seed | Compared user/financial row snapshots unchanged |
| Static diff/secret/status review | Performed before commit; credentials/build artifacts excluded |

Backend coverage includes auth, ownership, CRUD, recurrence, budgets/goals/bills, CSV correction/duplicates/concurrency, reports, tips/bookmarks/notes, admin and new hardening cases. Browser coverage includes registration with SQL verification, reload/logout/password change/reset, CRUD, downloads, import, bookmarks/settings/admin, mutation refresh, failure recovery, goal contributions, mobile keyboard behavior, themes and accessibility.

Fresh screenshots and a concise execution log are in [verification/nocturne](verification/nocturne/). Earlier screenshots outside that directory represent the previous design. Populated captures contain synthetic transactions created through actual APIs in the isolated test database, not real personal finances and not application fallback data.

## U. Reproduction

1. Follow the root setup guide using restricted local DB credentials and run `npm run db:migrate`.
2. Create/migrate an explicitly disposable `campuscoin_test` database and run `npm test`.
3. Run the API with `NODE_ENV=test DB_NAME=campuscoin_test` and start Vite. Provision a test administrator using the existing bootstrap script.
4. Set `E2E_CONNECTED=1`, the matching database environment and `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` through environment variables; run `npm run test:e2e`. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` if using an already installed Chromium.
5. Run `npm run build` and package audits. Never serve public deployments with `NODE_ENV=test`.

No lint script exists; a lint pass is not claimed. Modified implementation files were formatted, not the entire repository.

## V. Genuine remaining limits

1. **Deployment not verified:** production hosting, TLS/reverse proxy, secrets, backups/restore, supported MySQL 8.x and SMTP delivery were not exercised. Docker Compose was not run here.
2. **Currency is not FX:** the app has currency preferences/account currency fields but no exchange-rate conversion. Mixed-currency aggregates should not be interpreted as a converted portfolio value. This remains a product limitation, not an implemented currency-conversion feature.
3. **Email automation:** weekly email is not implemented; settings store preferences only. Password-reset SMTP needs configured/verified delivery. Development reset links are not a production mail substitute.
4. **AI:** local rules only; no external LLM integration was implemented or verified.
5. **Scale:** range-report ledger loading, the capped transaction CSV endpoint, chart bundle size, and in-process jobs need evaluation for large workloads. Multi-instance scheduler/notification deduplication and distributed deployment were not load-tested.
6. **Mutation follow-up:** some activity/notification work occurs after a committed financial mutation. A downstream failure can still require reconciliation/retry UX; no outbox/idempotency-key architecture was introduced.
7. **Coverage boundaries:** Chromium only, sampled axe checks, no full manual assistive-technology or low-end-device audit, independent security assessment or production penetration test.

These do not negate the passing local tests, but preclude claiming unconditional production readiness.

## W. Git and handoff

Only the fixed session branch `arena/01a0e910-campuscoin` is eligible for commit/push in this environment. The implementation report must give the actual commit/push outcome and must not claim that `main` was updated. Migration must run alongside deployment before serving the new authentication code. All schema changes are additive; no existing user/financial data was intentionally removed or reseeded.
