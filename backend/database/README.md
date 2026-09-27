# CampusCoin Database

MySQL 8.0+ (or MariaDB 10.6+) schema for the CampusCoin student finance platform.

## Files

| File | Purpose |
|------|---------|
| `schema.sql` | All 26 tables: users, profiles, password_resets, accounts, categories, transactions, recurring_transactions, budgets, goals, goal_contributions, bills, insights, tips, tip_bookmarks, insight_bookmarks, notes, notifications, announcements, imports, import_rows, ai_category_suggestions, ai_correction_history, activities, settings, analytics_snapshots, system_settings |
| `indexes.sql` | Additional composite performance indexes |
| `seed.sql` | Alternative raw SQL seed (the `npm run seed` script is the recommended, bcrypt-safe seeder) |

## Apply

```bash
npm run migrate   # creates DB + schema + indexes
npm run seed      # loads admin, student, categories, sample data
```

## Design Rules

- **Money is `DECIMAL(14,2)`** — never floating point.
- **Safe delete**: transactions → `status='deleted'` (soft); categories/budgets/bills/accounts → `status='archived'` when history exists; goals → `status='cancelled'`.
- **Foreign keys** enforce every relationship; `ON DELETE CASCADE` only where the child has no independent value (profiles, notes, settings), `ON DELETE SET NULL` where history must survive (transaction.category_id).
- **Unique constraints**: user email; budget (user, category, month, year); insight (user, month, year); analytics snapshot (user, month, year); settings (user, key); bookmark pairs.
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

The seed script creates test accounts with bcrypt-hashed passwords. See the root README for credentials. Never seed real personal data.
