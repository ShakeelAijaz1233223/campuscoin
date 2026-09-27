-- ============================================================
-- CampusCoin Seed Data
-- Run AFTER schema_fixed.sql
-- ============================================================

INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`) VALUES
('app_name', 'CampusCoin', 'Application name'),
('app_version', '1.0.0', 'Application version'),
('max_upload_size', '5242880', 'Maximum upload file size in bytes'),
('supported_csv_columns', 'date,description,amount,type,category', 'Supported CSV import columns'),
('maintenance_mode', 'false', 'Maintenance mode toggle');

INSERT INTO `users` (`email`, `password_hash`, `role`, `status`, `email_verified`) VALUES
('admin@campuscoin.com', '$2a$12$LJ3MFgKsSWWEsFjxn/3kMOcO8E/B/DVsWTv0HRXHhRfnKPXdmOiG6', 'admin', 'active', 1);

INSERT INTO `profiles` (`user_id`, `first_name`, `last_name`, `academic_year`, `monthly_allowance`, `monthly_savings_goal`) VALUES
(1, 'System', 'Administrator', 'graduate', 0.00, 0.00);

INSERT INTO `users` (`email`, `password_hash`, `role`, `status`, `email_verified`) VALUES
('student@campuscoin.com', '$2a$12$92K5zLpX0MQfFlnHhCe7IOOFtiEJfJeA9zv32ClFPpGdNUWQx4YiW', 'student', 'active', 1);

INSERT INTO `profiles` (`user_id`, `first_name`, `last_name`, `academic_year`, `monthly_allowance`, `monthly_savings_goal`) VALUES
(2, 'Test', 'Student', 'sophomore', 15000.00, 3000.00);

INSERT INTO `categories` (`user_id`, `name`, `type`, `icon`, `color`, `is_default`, `sort_order`) VALUES
(NULL, 'Allowance', 'income', 'wallet', '#4CAF50', 1, 1),
(NULL, 'Part-time Job', 'income', 'briefcase', '#2196F3', 1, 2),
(NULL, 'Scholarship', 'income', 'award', '#9C27B0', 1, 3),
(NULL, 'Gift', 'income', 'gift', '#FF9800', 1, 4),
(NULL, 'Other Income', 'income', 'plus-circle', '#607D8B', 1, 5);

INSERT INTO `categories` (`user_id`, `name`, `type`, `icon`, `color`, `is_default`, `sort_order`) VALUES
(NULL, 'Food', 'expense', 'utensils', '#F44336', 1, 1),
(NULL, 'Transport', 'expense', 'bus', '#FF9800', 1, 2),
(NULL, 'Hostel/Rent', 'expense', 'home', '#795548', 1, 3),
(NULL, 'Academics', 'expense', 'book', '#3F51B5', 1, 4),
(NULL, 'Subscriptions', 'expense', 'tv', '#E91E63', 1, 5),
(NULL, 'Entertainment', 'expense', 'music', '#9C27B0', 1, 6),
(NULL, 'Miscellaneous', 'expense', 'grid', '#607D8B', 1, 7);

INSERT INTO `accounts` (`user_id`, `name`, `type`, `balance`, `is_default`) VALUES
(2, 'Cash Wallet', 'cash', 5000.00, 1),
(2, 'Bank Account', 'bank', 12000.00, 0),
(2, 'Mobile Wallet', 'wallet', 2500.00, 0);

INSERT INTO `transactions` (`user_id`, `account_id`, `category_id`, `type`, `amount`, `description`, `date`) VALUES
(2, 1, 1, 'income', 15000.00, 'Monthly allowance from parents', '2026-09-01'),
(2, 2, 2, 'income', 8000.00, 'Part-time tutoring salary', '2026-09-05'),
(2, 1, 6, 'expense', 2500.00, 'Grocery shopping for the week', '2026-09-02'),
(2, 1, 7, 'expense', 500.00, 'Bus pass recharge', '2026-09-03'),
(2, 2, 8, 'expense', 6000.00, 'Hostel rent payment', '2026-09-01'),
(2, 1, 9, 'expense', 1200.00, 'Textbooks for semester', '2026-09-04'),
(2, 3, 10, 'expense', 500.00, 'Netflix subscription', '2026-09-01'),
(2, 1, 11, 'expense', 800.00, 'Movie and dinner with friends', '2026-09-06'),
(2, 1, 6, 'expense', 1800.00, 'Lunch and snacks for the week', '2026-09-08'),
(2, 3, 7, 'expense', 300.00, 'Rickshaw fare', '2026-09-09'),
(2, 1, 12, 'expense', 400.00, 'Stationery items', '2026-09-10'),
(2, 2, 3, 'income', 10000.00, 'Merit scholarship disbursement', '2026-09-10'),
(2, 1, 6, 'expense', 2200.00, 'Weekly groceries', '2026-09-15'),
(2, 1, 11, 'expense', 1500.00, 'Concert tickets', '2026-09-18'),
(2, 2, 8, 'expense', 6000.00, 'Next month hostel rent', '2026-09-25');

INSERT INTO `budgets` (`user_id`, `category_id`, `amount`, `month`, `year`, `spent`) VALUES
(2, 6, 8000.00, 9, 2026, 6500.00),
(2, 7, 2000.00, 9, 2026, 800.00),
(2, 8, 6000.00, 9, 2026, 6000.00),
(2, 9, 2000.00, 9, 2026, 1200.00),
(2, 10, 500.00, 9, 2026, 500.00),
(2, 11, 3000.00, 9, 2026, 2300.00);

INSERT INTO `goals` (`user_id`, `name`, `description`, `target_amount`, `current_amount`, `target_date`) VALUES
(2, 'New Laptop Fund', 'Saving for a new laptop for studies', 80000.00, 15000.00, '2027-06-01'),
(2, 'Emergency Fund', 'Building an emergency fund', 20000.00, 8000.00, '2026-12-31'),
(2, 'Spring Break Trip', 'Saving for spring break trip with friends', 30000.00, 5000.00, '2027-03-01');

INSERT INTO `goal_contributions` (`goal_id`, `user_id`, `amount`, `date`) VALUES
(1, 2, 5000.00, '2026-07-01'),
(1, 2, 5000.00, '2026-08-01'),
(1, 2, 5000.00, '2026-09-01'),
(2, 2, 2000.00, '2026-06-01'),
(2, 2, 3000.00, '2026-07-01'),
(2, 2, 3000.00, '2026-08-01'),
(3, 2, 2500.00, '2026-08-15'),
(3, 2, 2500.00, '2026-09-15');

INSERT INTO `bills` (`user_id`, `category_id`, `name`, `amount`, `due_date`, `frequency`, `is_paid`, `reminder_days`) VALUES
(2, 8, 'Hostel Rent', 6000.00, '2026-10-01', 'monthly', 0, 5),
(2, 10, 'Netflix', 500.00, '2026-10-01', 'monthly', 0, 3),
(2, 10, 'Internet Bill', 1500.00, '2026-10-05', 'monthly', 0, 3),
(2, 9, 'Semester Fee', 45000.00, '2027-01-15', 'one_time', 0, 30);

INSERT INTO `tips` (`title`, `content`, `category`, `priority`, `is_system`) VALUES
('Track Every Expense', 'The key to financial health is knowing where your money goes. Record even the smallest purchases.', 'general', 10, 1),
('Use the 50/30/20 Rule', 'Try to spend 50% on needs, 30% on wants, and save 20% of your income.', 'savings', 9, 1),
('Cook More, Eat Out Less', 'Preparing meals at home can save you up to 60% on food expenses compared to eating out.', 'food', 8, 1),
('Use Student Discounts', 'Always ask for student discounts. Many services, restaurants, and stores offer special rates for students.', 'general', 7, 1),
('Set Up an Emergency Fund', 'Aim to save at least one month of expenses as an emergency fund for unexpected costs.', 'savings', 9, 1),
('Review Subscriptions Monthly', 'Check your active subscriptions regularly. Cancel ones you rarely use to save money.', 'subscriptions', 6, 1),
('Walk or Cycle When Possible', 'Short distances can be walked or cycled instead of using transport, saving money and improving health.', 'transport', 5, 1),
('Buy Used Textbooks', 'Consider buying second-hand textbooks or using library copies to cut academic costs significantly.', 'academics', 7, 1),
('Avoid Impulse Purchases', 'Wait 24 hours before making non-essential purchases. You may find you don''t really need the item.', 'general', 8, 1),
('Set Monthly Budget Limits', 'Create budgets for each spending category and track your progress throughout the month.', 'budgeting', 10, 1);

INSERT INTO `insights` (`user_id`, `month`, `year`, `summary`, `tip`, `metadata`) VALUES
(2, 8, 2026, 'Your total spending in August was PKR 18,500, which is 12% higher than July. Food and entertainment were the top categories. Consider reducing dining out to save more.', 'Try meal prepping on weekends to reduce your weekday food spending by up to 30%.', '{"total_income": 25000, "total_expense": 18500, "savings_rate": 26, "top_category": "Food"}'),
(2, 9, 2026, 'September spending is trending at PKR 19,500 with a few days remaining. You are on track with your budget for most categories. Entertainment spending increased significantly.', 'Your entertainment spending increased by 45% compared to last month. Set a specific entertainment budget to stay in control.', '{"total_income": 33000, "total_expense": 19500, "savings_rate": 41, "top_category": "Hostel/Rent"}');

INSERT INTO `notifications` (`user_id`, `type`, `title`, `message`, `is_read`) VALUES
(2, 'budget_alert', 'Budget Near Limit', 'Your Food budget is 81% used. You have PKR 1,500 remaining for September.', 0),
(2, 'bill_reminder', 'Bill Due Soon', 'Hostel Rent of PKR 6,000 is due on October 1st. Make sure you have sufficient balance.', 0),
(2, 'goal_progress', 'Goal Milestone', 'Great job! Your Emergency Fund has reached 40% of your target. Keep it up!', 1),
(2, 'system', 'Welcome to CampusCoin', 'Welcome to CampusCoin! Start by setting up your accounts and recording your first transaction.', 1);

INSERT INTO `recurring_transactions` (`user_id`, `account_id`, `category_id`, `type`, `amount`, `description`, `frequency`, `start_date`, `next_occurrence`) VALUES
(2, 2, 8, 'expense', 6000.00, 'Monthly hostel rent', 'monthly', '2026-09-01', '2026-10-01'),
(2, 1, 1, 'income', 15000.00, 'Monthly allowance', 'monthly', '2026-09-01', '2026-10-01');

INSERT INTO `activities` (`user_id`, `action`, `entity_type`, `entity_id`, `description`) VALUES
(2, 'created', 'transaction', 1, 'Created income transaction: Monthly allowance'),
(2, 'created', 'transaction', 3, 'Created expense transaction: Grocery shopping'),
(2, 'created', 'budget', 1, 'Created Food budget for September 2026'),
(2, 'created', 'goal', 1, 'Created savings goal: New Laptop Fund'),
(2, 'updated', 'profile', 2, 'Updated profile information');
