#!/usr/bin/env node
/**
 * Creates an admin user: node scripts/create-admin.js <email> <password> [first_name] [last_name]
 * Or set ADMIN_EMAIL and ADMIN_PASSWORD. No default administrator credentials.
 */
const path = require('path');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const run = async () => {
  const email = (process.argv[2] || process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.argv[3] || process.env.ADMIN_PASSWORD || '';
  const firstName = process.argv[4] || 'Admin';
  const lastName = process.argv[5] || 'User';

  if (!email || !password) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD or provide email and password arguments');
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) throw new Error('Password requires at least 8 characters, uppercase, lowercase and a number');

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
      throw new Error(`A user with email ${email} already exists`);
    }

    await connection.beginTransaction();
    const hash = await bcrypt.hash(password, 12);
    const [result] = await connection.execute(
      "INSERT INTO users (email, password_hash, role, status, email_verified) VALUES (?, ?, 'admin', 'active', 1)",
      [email, hash]
    );
    await connection.execute(
      "INSERT INTO profiles (user_id, first_name, last_name, academic_year) VALUES (?, ?, ?, 'other')",
      [result.insertId, firstName, lastName]
    );

    await connection.execute("INSERT INTO accounts (user_id, name, type, balance, is_default) VALUES (?, 'Cash Wallet', 'cash', 0, 1)", [result.insertId]);
    await connection.commit();
    console.log('✓ Admin user created successfully:');
    console.log(`  Email: ${email}`);

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
};

run().catch((err) => {
  console.error('✗ Failed to create admin:', err.message);
  process.exit(1);
});
