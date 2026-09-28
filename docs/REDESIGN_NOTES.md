# CampusCoin — Nocturne redesign

**Implemented 2026-09-28.** This supersedes the earlier light-first, frontend-only redesign. It includes focused backend/security fixes and an additive migration, not just a visual reskin. Full findings, API behavior, evidence and remaining limits are in [END_TO_END_AUDIT.md](END_TO_END_AUDIT.md).

## 1. Direction

A dark financial workspace with quiet cinematic depth: near-black ink, restrained cyan, lavender and muted magenta, translucent surfaces, deliberate typography and a geometric coin/orbit motif. The app should feel composed, not like a glowing game dashboard. Light mode is a complete alternative, not an inverted screenshot.

No stock dashboard screenshots, external image calls, fake balances, random activity, disconnected marketing CTAs or WebGL runtime were added. Illustrations are decorative CSS/SVG; charts and financial cards consume the API.

## 2. Tokens and surfaces

- `frontend/src/styles/variables.css`: semantic dark/light color, border, shadow, radius, chart, spacing, typography and timing tokens.
- `frontend/src/styles/nocturne.css`: reusable glass tiers, shell, scene, illustration, card, form, table, chart, empty/loading, responsive and interaction treatments.
- Primary glass carries important summaries; secondary glass groups working content; tertiary surfaces support controls and lightweight panels. Blur is selective, not layered on every row.
- Self-hosted Inter Variable supplies actual intermediate weights and tabular financial figures. The existing system-font stack is the fallback; no runtime Google Fonts call is needed.
- Semantic income/expense/danger/warning colors remain distinct. Primary controls are cyan in dark mode and deeper teal in light mode for readable contrast.
- Existing structural CSS remains in use; this is an incremental redesign of a working app, not an unrelated architecture replacement.

## 3. Compositions

**Public:** immersive but restrained Home, responsive navigation and actual register/login/help links. Shared auth scene and focused forms for sign-in, registration and password recovery. Help accurately distinguishes tracking from bank transfers and stored email preferences from automation.

**Workspace:** narrow grouped sidebar, workspace switcher, breadcrumb, real search, quick-add transaction, theme control, notifications and profile. Mobile has a focus-trapped drawer and bottom navigation, not just a shrunken desktop sidebar.

**Dashboard:** greeting and selected month; balance/coin hero; upcoming seven-day bills; income/expense/savings summaries; annual cash flow and local insight; recent ledger entries and budget ring; category/six-month/budget charts; saving tips and active goals. Balance remains all-time; period summaries and insights use the selected month. Future unrecorded chart months are blank, never a made-up zero-value forecast.

**Working pages:** shared filters, tables/cards, forms, import previews, dialogs, pagination and asynchronous states bring the same design to transactions, recurring rules, categories, budgets, goals, bills, reports, insights, tips, saved items/notes, notifications, search, profile, settings/accounts and administration. Stable thin page wrappers were preserved.

## 4. New reusable pieces

| Piece | Purpose |
|---|---|
| `AnimatedAmount` | Short first-load/update tween, stable screen-reader amount, reduced-motion bypass |
| `Hologram` | CSS geometric coin and orbit; purely decorative, no GPU-heavy 3D library |
| `UpcomingBills` | Actual upcoming records, amount/date/link or real empty state |
| `GoalOverview` | Real amounts and goal progress on Dashboard |
| `GoalContributions` | Actual contribution history, add/remove, completion/reopening |
| `useMobileNavigation` | Trap, Escape, focus return, inert background and scroll locking |
| `utils/chartData` | Explicit annual-series handling, including unrecorded future periods |

Shared `UI` now supplies loading shimmer and stronger busy-dialog semantics. `EntityForm` has cancellable option loading and retry; `useResource` cancels stale work and coalesces/debounces refreshes. Theme storage is validated and guarded against unavailable browser storage, with the browser theme-color updated to match.

## 5. Motion

- Slow orbit/aurora movement adds atmosphere without a canvas render loop.
- Cards/buttons have restrained hover, pressed and focus feedback.
- Amounts and charts enter briefly rather than constantly bouncing.
- Skeletons represent loading only; no placeholder amount pretends to be a balance.
- Reduced-motion disables decorative motion and number animation. Mobile reduces background effects.

Native select background was excluded from animated transitions after a Chromium light-theme repaint/contrast defect was reproduced. Screen-reader amount markup was corrected after axe flagged the original span label. A 320px public Help-header overflow was also found and fixed during the final sweep.

## 6. Backend work supporting the UI

- Additive `users.session_version` migration and revocable JWT sessions.
- JSON-only public auth, secret-safe validation errors and production CORS/secret checks.
- Locked transaction/budget/goal mutations; precision/type/metadata validation.
- Protected report filenames/downloads and spreadsheet-formula-safe CSV exports.
- Real goal contributions connected to the UI.
- Selected-period insight/growth/currency fixes; explicit local-only AI fallback.
- In-app notification opt-out enforced without deleting old history.
- Smaller chart response payload through `include_transactions=false`.

See the audit for exact scope. FX conversion, a payment integration, a weekly-email service and an external LLM were not invented or silently simulated.

## 7. Verification

- **143 backend + 13 frontend unit tests passed.**
- **31 browser tests passed** (24 connected, seven fixture-based), including actual SQL registration checks, CRUD/import/downloads, mutation refresh, failed-chart recovery, contributions, password changes, admin and keyboard behavior.
- All 15 student routes checked at 320/390/768/1440/1920px in both themes; public/admin routes at 320/768/1440px; large reading size on the 320px dashboard.
- Automated axe checks passed on login, dark dashboard, transaction dialog and light settings; reduced-motion checked in Chromium. This is not a full WCAG certification.
- Production build passed; frontend/backend npm audits each reported zero known vulnerabilities.
- Repeated migration/default seeding preserved compared existing user/financial rows.

Fresh captures live in [verification/nocturne](verification/nocturne/). These include an honest empty new-user dashboard and populated dark/light/mobile states. Populated screens use clearly isolated API-created **test fixtures**, never production fallback finances. Older verification images elsewhere in the repository show the previous design.

## 8. Deployment boundary

Apply the additive migration before serving the new auth code. Use supported MySQL, production secrets, same-origin HTTPS/API proxying, backups and real SMTP configuration. External delivery, production hosting, multi-instance/large-ledger performance and non-Chromium/manual assistive-technology behavior have not been certified by this local pass.
