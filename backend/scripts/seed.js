#!/usr/bin/env node
/**
 * Seed script: loads development/test data.
 * Idempotent — skips seeding if users already exist unless --force is passed.
 */
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const run = async () => {
  const force = process.argv.includes('--force');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campuscoin',
    multipleStatements: true
  });

  try {
    const [existing] = await connection.query('SELECT COUNT(*) as count FROM users');
    if (existing[0].count > 0 && !force) {
      console.log('Database already contains users. Use --force to seed anyway.');
      return;
    }
    if (force) {
      console.log('→ Force mode: clearing existing data...');
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      for (const table of ['users', 'profiles', 'accounts', 'categories', 'transactions', 'recurring_transactions',
        'budgets', 'goals', 'goal_contributions', 'bills', 'insights', 'tips', 'tip_bookmarks', 'insight_bookmarks',
        'notes', 'notifications', 'announcements', 'imports', 'import_rows', 'ai_category_suggestions',
        'ai_correction_history', 'activities', 'settings', 'analytics_snapshots', 'system_settings']) {
        await connection.query(`TRUNCATE TABLE \`${table}\``);
      }
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    }

    console.log('→ Seeding system settings...');
    await connection.query(`
      INSERT INTO system_settings (setting_key, setting_value, description) VALUES
      ('app_name', 'CampusCoin', 'Application name'),
      ('app_version', '1.0.0', 'Application version'),
      ('maintenance_mode', 'false', 'Maintenance mode toggle')
    `);

    console.log('→ Creating admin account (admin@campuscoin.com / Admin@123)...');
    const adminHash = await bcrypt.hash('Admin@123', 12);
    const [adminResult] = await connection.query(
      "INSERT INTO users (email, password_hash, role, status, email_verified) VALUES ('admin@campuscoin.com', ?, 'admin', 'active', 1)",
      [adminHash]
    );
    await connection.query(
      "INSERT INTO profiles (user_id, first_name, last_name, academic_year) VALUES (?, 'System', 'Administrator', 'graduate')",
      [adminResult.insertId]
    );

    console.log('→ Creating student account (student@campuscoin.com / Student@123)...');
    const studentHash = await bcrypt.hash('Student@123', 12);
    const [studentResult] = await connection.query(
      "INSERT INTO users (email, password_hash, role, status, email_verified) VALUES ('student@campuscoin.com', ?, 'student', 'active', 1)",
      [studentHash]
    );
    const studentId = studentResult.insertId;
    await connection.query(
      "INSERT INTO profiles (user_id, first_name, last_name, academic_year, monthly_allowance, monthly_savings_goal) VALUES (?, 'Test', 'Student', 'sophomore', 15000, 3000)",
      [studentId]
    );

    console.log('→ Creating default categories...');
    const incomeCategories = [
      ['Allowance', 'wallet', '#4CAF50'], ['Part-time Job', 'briefcase', '#2196F3'],
      ['Scholarship', 'award', '#9C27B0'], ['Gift', 'gift', '#FF9800'], ['Other Income', 'plus-circle', '#607D8B']
    ];
    for (let i = 0; i < incomeCategories.length; i++) {
      await connection.query(
        "INSERT INTO categories (user_id, name, type, icon, color, is_default, sort_order) VALUES (NULL, ?, 'income', ?, ?, 1, ?)",
        [...incomeCategories[i], i + 1]
      );
    }
    const expenseCategories = [
      ['Food', 'utensils', '#F44336'], ['Transport', 'bus', '#FF9800'], ['Hostel/Rent', 'home', '#795548'],
      ['Academics', 'book', '#3F51B5'], ['Subscriptions', 'tv', '#E91E63'], ['Entertainment', 'music', '#9C27B0'],
      ['Miscellaneous', 'grid', '#607D8B']
    ];
    for (let i = 0; i < expenseCategories.length; i++) {
      await connection.query(
        "INSERT INTO categories (user_id, name, type, icon, color, is_default, sort_order) VALUES (NULL, ?, 'expense', ?, ?, 1, ?)",
        [...expenseCategories[i], i + 1]
      );
    }

    console.log('→ Creating student accounts...');
    const [cash] = await connection.query(
      "INSERT INTO accounts (user_id, name, type, balance, is_default) VALUES (?, 'Cash Wallet', 'cash', 5000, 1)",
      [studentId]
    );
    const [bank] = await connection.query(
      "INSERT INTO accounts (user_id, name, type, balance, is_default) VALUES (?, 'Bank Account', 'bank', 12000, 0)",
      [studentId]
    );
    await connection.query(
      "INSERT INTO accounts (user_id, name, type, balance, is_default) VALUES (?, 'Mobile Wallet', 'wallet', 2500, 0)",
      [studentId]
    );
    const cashId = cash.insertId;
    const bankId = bank.insertId;

    // Category ids: income 1-5, expense 6-12 (based on insert order above)
    const cat = {
      allowance: 1, job: 2, scholarship: 3, gift: 4, otherIncome: 5,
      food: 6, transport: 7, rent: 8, academics: 9, subs: 10, entertainment: 11, misc: 12
    };

    console.log('→ Creating realistic student transactions (last 2 months)...');
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const pad = (n) => String(n).padStart(2, '0');
    const dayOf = (monthOffset, day) => {
      const d = new Date(y, m - 1 - monthOffset, day);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(String(day).padStart(2, '0'))}`;
    };

    const transactions = [
      // Two months of income
      [dayOf(0, 1), 'income', 15000, 'Monthly allowance from parents', cat.allowance, cashId],
      [dayOf(0, 5), 'income', 8000, 'Part-time tutoring salary', cat.job, bankId],
      [dayOf(0, 10), 'income', 10000, 'Merit scholarship disbursement', cat.scholarship, bankId],
      [dayOf(1, 1), 'income', 15000, 'Monthly allowance from parents', cat.allowance, cashId],
      [dayOf(1, 5), 'income', 8000, 'Part-time tutoring salary', cat.job, bankId],
      // Food
      [dayOf(0, 2), 'expense', 2500, 'Grocery shopping for the week', cat.food, cashId],
      [dayOf(0, 8), 'expense', 1800, 'Lunch and snacks for the week', cat.food, cashId],
      [dayOf(0, 15), 'expense', 2200, 'Weekly groceries', cat.food, cashId],
      [dayOf(1, 3), 'expense', 2000, 'Groceries', cat.food, cashId],
      [dayOf(1, 12), 'expense', 1600, 'Cafeteria meals', cat.food, cashId],
      // Transport
      [dayOf(0, 3), 'expense', 500, 'Bus pass recharge', cat.transport, cashId],
      [dayOf(0, 9), 'expense', 300, 'Rickshaw fare', cat.transport, cashId],
      [dayOf(1, 7), 'expense', 500, 'Bus pass recharge', cat.transport, cashId],
      // Rent
      [dayOf(0, 1), 'expense', 6000, 'Hostel rent payment', cat.rent, bankId],
      [dayOf(1, 1), 'expense', 6000, 'Hostel rent payment', cat.rent, bankId],
      // Academics
      [dayOf(0, 4), 'expense', 1200, 'Textbooks for semester', cat.academics, cashId],
      [dayOf(0, 10), 'expense', 400, 'Stationery items', cat.academics, cashId],
      [dayOf(1, 14), 'expense', 900, 'Lab manual and printing', cat.academics, cashId],
      // Subscriptions
      [dayOf(0, 1), 'expense', 500, 'Netflix subscription', cat.subs, cashId],
      [dayOf(1, 1), 'expense', 500, 'Netflix subscription', cat.subs, cashId],
      [dayOf(1, 6), 'expense', 250, 'Spotify premium', cat.subs, cashId],
      // Entertainment
      [dayOf(0, 6), 'expense', 800, 'Movie and dinner with friends', cat.entertainment, cashId],
      [dayOf(0, 18), 'expense', 1500, 'Concert tickets', cat.entertainment, cashId],
      [dayOf(1, 20), 'expense', 700, 'Game night with friends', cat.entertainment, cashId],
      // Misc
      [dayOf(1, 22), 'expense', 350, 'Miscellaneous campus expenses', cat.misc, cashId]
    ];

    for (const [date, type, amount, description, categoryId, accountId] of transactions) {
      await connection.query(
        "INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [studentId, accountId, categoryId, type, amount, description, date]
      );
      const delta = type === 'income' ? amount : -amount;
      await connection.query('UPDATE accounts SET balance = balance + ? WHERE id = ?', [delta, accountId]);
    }

    console.log('→ Creating budgets for current month...');
    await connection.query(
      "INSERT INTO budgets (user_id, category_id, amount, month, year) VALUES (?, ?, 8000, ?, ?), (?, ?, 2000, ?, ?), (?, ?, 7000, ?, ?), (?, ?, 2000, ?, ?), (?, ?, 800, ?, ?), (?, ?, 3000, ?, ?)",
      [studentId, cat.food, m, y, studentId, cat.transport, m, y, studentId, cat.rent, m, y, studentId, cat.academics, m, y, studentId, cat.subs, m, y, studentId, cat.entertainment, m, y]
    );

    console.log('→ Creating savings goals + contributions...');
    const [goal1] = await connection.query(
      "INSERT INTO goals (user_id, name, description, target_amount, current_amount, target_date) VALUES (?, 'New Laptop Fund', 'Saving for a new laptop for studies', 80000, 15000, DATE_ADD(NOW(), INTERVAL 9 MONTH))",
      [studentId]
    );
    const [goal2] = await connection.query(
      "INSERT INTO goals (user_id, name, description, target_amount, current_amount, target_date) VALUES (?, 'Emergency Fund', 'Building an emergency fund', 20000, 8000, DATE_ADD(NOW(), INTERVAL 3 MONTH))",
      [studentId]
    );
    const [goal3] = await connection.query(
      "INSERT INTO goals (user_id, name, description, target_amount, current_amount, target_date) VALUES (?, 'Spring Break Trip', 'Saving for a trip with friends', 30000, 5000, DATE_ADD(NOW(), INTERVAL 6 MONTH))",
      [studentId]
    );
    await connection.query(
      "INSERT INTO goal_contributions (goal_id, user_id, amount, date) VALUES (?, ?, 5000, DATE_SUB(NOW(), INTERVAL 60 DAY)), (?, ?, 5000, DATE_SUB(NOW(), INTERVAL 30 DAY)), (?, ?, 5000, DATE_SUB(NOW(), INTERVAL 1 DAY))",
      [goal1.insertId, studentId, goal1.insertId, studentId, goal1.insertId, studentId]
    );
    await connection.query(
      "INSERT INTO goal_contributions (goal_id, user_id, amount, date) VALUES (?, ?, 3000, DATE_SUB(NOW(), INTERVAL 45 DAY)), (?, ?, 5000, DATE_SUB(NOW(), INTERVAL 10 DAY))",
      [goal2.insertId, studentId, goal2.insertId, studentId]
    );
    await connection.query(
      "INSERT INTO goal_contributions (goal_id, user_id, amount, date) VALUES (?, ?, 2500, DATE_SUB(NOW(), INTERVAL 40 DAY)), (?, ?, 2500, DATE_SUB(NOW(), INTERVAL 8 DAY))",
      [goal3.insertId, studentId, goal3.insertId, studentId]
    );

    console.log('→ Creating bills...');
    await connection.query(
      "INSERT INTO bills (user_id, category_id, name, amount, due_date, frequency, reminder_days) VALUES (?, ?, 'Hostel Rent', 6000, DATE_ADD(CURDATE(), INTERVAL 4 DAY), 'monthly', 5), (?, ?, 'Internet Bill', 1500, DATE_ADD(CURDATE(), INTERVAL 8 DAY), 'monthly', 3), (?, ?, 'Netflix', 500, DATE_ADD(CURDATE(), INTERVAL 12 DAY), 'monthly', 3)",
      [studentId, cat.rent, studentId, cat.subs, studentId, cat.subs]
    );
    // One overdue bill
    await connection.query(
      "INSERT INTO bills (user_id, category_id, name, amount, due_date, frequency, reminder_days) VALUES (?, ?, 'Electricity Bill', 2200, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'monthly', 2)",
      [studentId, cat.misc]
    );

    console.log('→ Creating recurring transactions...');
    await connection.query(
      "INSERT INTO recurring_transactions (user_id, account_id, category_id, type, amount, description, frequency, start_date, next_occurrence) VALUES (?, ?, ?, 'expense', 6000, 'Monthly hostel rent', 'monthly', DATE_SUB(CURDATE(), INTERVAL 1 MONTH), DATE_ADD(CURDATE(), INTERVAL 1 MONTH))",
      [studentId, bankId, cat.rent]
    );
    await connection.query(
      "INSERT INTO recurring_transactions (user_id, account_id, category_id, type, amount, description, frequency, start_date, next_occurrence) VALUES (?, ?, ?, 'income', 15000, 'Monthly allowance', 'monthly', DATE_SUB(CURDATE(), INTERVAL 1 MONTH), DATE_ADD(CURDATE(), INTERVAL 1 MONTH))",
      [studentId, cashId, cat.allowance]
    );

    console.log('→ Creating system saving tips...');
    const tips = [
      ['Track Every Expense', 'The key to financial health is knowing where your money goes. Record even the smallest purchases.', 'general', 10],
      ['Use the 50/30/20 Rule', 'Try to spend 50% on needs, 30% on wants, and save 20% of your income.', 'savings', 9],
      ['Cook More, Eat Out Less', 'Preparing meals at home can save you up to 60% on food expenses compared to eating out.', 'food', 8],
      ['Use Student Discounts', 'Always ask for student discounts. Many services offer special rates for students.', 'general', 7],
      ['Set Up an Emergency Fund', 'Aim to save at least one month of expenses for unexpected costs.', 'savings', 9],
      ['Review Subscriptions Monthly', 'Cancel subscriptions you rarely use to save money.', 'subscriptions', 6],
      ['Walk or Cycle When Possible', 'Short distances can be walked instead of using transport — saving money and improving health.', 'transport', 5],
      ['Buy Used Textbooks', 'Second-hand textbooks or library copies cut academic costs significantly.', 'academics', 7],
      ['Avoid Impulse Purchases', 'Wait 24 hours before non-essential purchases. You may find you do not need the item.', 'general', 8],
      ['Set Monthly Budget Limits', 'Create budgets for each spending category and track progress throughout the month.', 'budgeting', 10]
    ];
    for (const [title, content, category, priority] of tips) {
      await connection.query(
        'INSERT INTO tips (title, content, category, priority, is_system) VALUES (?, ?, ?, ?, 1)',
        [title, content, category, priority]
      );
    }

    console.log('→ Creating sample insight...');
    await connection.query(
      "INSERT INTO insights (user_id, month, year, summary, tip, metadata) VALUES (?, ?, ?, 'Your spending has been steady. Track daily to unlock richer insights as more data accumulates.', 'Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.', ?)",
      [studentId, m, y, JSON.stringify({ generated_by: 'seed', advisory: true })]
    );

    console.log('→ Creating announcements...');
    await connection.query(
      "INSERT INTO announcements (title, content, type, is_active, created_by) VALUES ('Welcome to CampusCoin', 'CampusCoin helps students track spending, budget smarter, and save for goals.', 'info', 1, ?)",
      [adminResult.insertId]
    );

    console.log('');
    console.log('✓ Seeding completed successfully.');
    console.log('');
    console.log('Test credentials:');
    console.log('  Admin:   admin@campuscoin.com / Admin@123');
    console.log('  Student: student@campuscoin.com / Student@123');
  } finally {
    await connection.end();
  }
};

run().catch((err) => {
  console.error('✗ Seeding failed:', err.message);
  process.exit(1);
});
