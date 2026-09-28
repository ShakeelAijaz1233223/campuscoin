# CampusCoin Database

MySQL schema (8.0+ recommended; tested locally on MySQL 5.7.29) for the CampusCoin student finance platform.

## Files

| File | Purpose |
|------|---------|
| `schema.sql` | All 26 tables (262 columns after the session migration): users, profiles, password_resets, accounts, categories, transactions, recurring_transactions, budgets, goals, goal_contributions, bills, insights, tips, tip_bookmarks, insight_bookmarks, notes, notifications, announcements, imports, import_rows, ai_category_suggestions, ai_correction_history, activities, settings, analytics_snapshots, system_settings |
| `migrations/001-session-version.js` | Repeatable additive `users.session_version` upgrade for existing databases |
| `indexes.sql` | Additional composite performance indexes |
| `defaults.js` | Idempotent reference categories/settings/educational tips; no user financial data |
| `seed.sql` | Legacy sample SQL, not used by normal setup; do not apply to real databases |

## Apply

```bash
npm run migrate   # creates missing tables/indexes, applies additive upgrades + reference data; preserves records
npm run seed      # optional idempotent reference-data repair, no demo finances
```

## Design Rules

- **Money is stored as `DECIMAL(14,2)`**. Application calculations still use JavaScript numbers/rounding; there is no FX conversion.
- **Safe delete**: transactions → `status='deleted'` (soft); categories/budgets/bills/accounts → `status='archived'` when history exists; goals → `status='cancelled'`.
- **Foreign keys** enforce every relationship; `ON DELETE CASCADE` only where the child has no independent value (profiles, notes, settings), `ON DELETE SET NULL` where history must survive (transaction.category_id).
- **Unique constraints**: user email; budget (user, category, month, year); insight (user, month, year); analytics snapshot (user, month, year); settings (user, key); bookmark pairs.
- **Session revocation**: `users.session_version` defaults to zero and increases on logout/password reset/change/admin access changes. Deploy the migration before the new authentication code.
- **User ownership**: every per-user table carries `user_id` and the API enforces `user_id = authenticated user` on every query.

## Relationship Map

```text
USERS 1─1 PROFILES
USERS 1─N ACCOUNTS
USERS 1─N CATEGORIES (NULL user_id = system default)
USERS 1─N TRANSACTIONS ─N─1 ACCOUNTS, ─N─1 CATEGORIES, ─N─1 RECURRING
USERS 1─N RECURRING_TRANSACTIONS
USERS 1─N BUDGETS ─N─1 CATEGORIES
USERS 1─N GOALS 1─N GOAL_CONTRIBUTIONS
USERS 1─N BILLS ─N─1 CATEGORIES
USERS 1─N INSIGHTS 1─N INSIGHT_BOOKMARKS
TIPS 1─N TIP_BOOKMARKS
USERS 1─N NOTES
USERS 1─N NOTIFICATIONS
USERS 1─N IMPORTS 1─N IMPORT_ROWS ─N─1 TRANSACTIONS
USERS 1─N AI_CATEGORY_SUGGESTIONS / AI_CORRECTION_HISTORY ─N─1 CATEGORIES
USERS 1─N ACTIVITIES
USERS 1─N SETTINGS
USERS 1─N ANALYTICS_SNAPSHOTS
```

## Credentials Note

Register real users through the UI. Admin bootstrap requires explicit credentials.
Sample accounts/data require `seed -- --demo` on an empty disposable development
database. Destructive `--force` seeding is disabled; never reset an existing real DB.
Backend timestamps and password-reset expiry use UTC MySQL sessions.

The final local preservation check reran migration/default seed and compared
ordered-row hashes of users, profiles, accounts, transactions, budgets, goals and
goal contributions: unchanged. No production database was accessed.
