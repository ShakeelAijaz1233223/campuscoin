-- ============================================================
-- CampusCoin Additional Performance Indexes
-- Run AFTER schema_fixed.sql
-- ============================================================

CREATE INDEX idx_transactions_user_date_type
  ON transactions(user_id, date, type);

CREATE INDEX idx_transactions_user_category_date
  ON transactions(user_id, category_id, date);

CREATE INDEX idx_transactions_user_account_date
  ON transactions(user_id, account_id, date);

CREATE INDEX idx_transactions_user_status_date
  ON transactions(user_id, status, date);

CREATE INDEX idx_budgets_user_year_month
  ON budgets(user_id, year, month);

CREATE INDEX idx_bills_user_due_status
  ON bills(user_id, due_date, status);

CREATE INDEX idx_transactions_date_type
  ON transactions(date, type);

CREATE INDEX idx_import_rows_status
  ON import_rows(import_id, status);

CREATE INDEX idx_activities_user_created
  ON activities(user_id, created_at);

CREATE INDEX idx_notifications_user_read_created
  ON notifications(user_id, is_read, created_at);
