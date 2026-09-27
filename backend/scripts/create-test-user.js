#!/usr/bin/env node
/**
 * Creates a test student user with sample data: node scripts/create-test-user.js [email] [password]
 * Defaults to test@campuscoin.com / Test@1234
 */
const path = require('path');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const run = async () => {
  if (process.env.NODE_ENV === 'production') throw new Error('Test users cannot be created in production');
  const email = (process.argv[2] || 'test@campuscoin.com').toLowerCase().trim();
  const password = process.argv[3] || 'Test@1234';

  if (password.length < 8) {
    console.error('✗ Password must be at least 8 characters');
    process.exit(1);
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campuscoin'
  });

  try {
    const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.error(`✗ A user with email ${email} already exists`);
      process.exit(1);
    }

    await connection.beginTransaction();
    const hash = await bcrypt.hash(password, 12);
    const [result] = await connection.execute(
      "INSERT INTO users (email, password_hash, role, status, email_verified) VALUES (?, ?, 'student', 'active', 1)",
      [email, hash]
    );
    const userId = result.insertId;

    await connection.execute(
      "INSERT INTO profiles (user_id, first_name, last_name, academic_year, monthly_allowance, monthly_savings_goal) VALUES (?, 'Test', 'User', 'junior', 12000, 2000)",
      [userId]
    );
    await connection.execute(
      "INSERT INTO accounts (user_id, name, type, balance, is_default) VALUES (?, 'Cash Wallet', 'cash', 0, 1)",
      [userId]
    );

    // Pull a couple of default categories and add a couple of sample transactions
    const [cats] = await connection.execute("SELECT id FROM categories WHERE is_default = 1 AND type = 'expense' ORDER BY sort_order LIMIT 2");
    const [accounts] = await connection.execute('SELECT id FROM accounts WHERE user_id = ? LIMIT 1', [userId]);
    const accountId = accounts[0].id;
    const today = new Date().toISOString().split('T')[0];
    if (cats[0]) {
      await connection.execute(
        "INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, date) VALUES (?, ?, ?, 'expense', 500, 'Sample lunch expense', ?)",
        [userId, accountId, cats[0].id, today]
      );
    }
    if (cats[1]) {
      await connection.execute(
        "INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, date) VALUES (?, ?, ?, 'expense', 300, 'Sample transport expense', ?)",
        [userId, accountId, cats[1].id, today]
      );
    }

    await connection.execute('UPDATE accounts SET balance = balance - ? WHERE id = ?', [(cats[0]?500:0)+(cats[1]?300:0),accountId]);
    await connection.commit();
    console.log('✓ Test student user created successfully:');
    console.log(`  Email: ${email}`);

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
};

run().catch((err) => {
  console.error('✗ Failed to create test user:', err.message);
  process.exit(1);
});
