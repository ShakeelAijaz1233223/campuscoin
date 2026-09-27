#!/usr/bin/env node
/**
 * Creates an admin user: node scripts/create-admin.js <email> <password> [first_name] [last_name]
 * Defaults to admin@campuscoin.com / Admin@123 if no args given.
 */
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const run = async () => {
  const email = (process.argv[2] || 'admin@campuscoin.com').toLowerCase().trim();
  const password = process.argv[3] || 'Admin@123';
  const firstName = process.argv[4] || 'Admin';
  const lastName = process.argv[5] || 'User';

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

    const hash = await bcrypt.hash(password, 12);
    const [result] = await connection.execute(
      "INSERT INTO users (email, password_hash, role, status, email_verified) VALUES (?, ?, 'admin', 'active', 1)",
      [email, hash]
    );
    await connection.execute(
      "INSERT INTO profiles (user_id, first_name, last_name, academic_year) VALUES (?, ?, ?, 'other')",
      [result.insertId, firstName, lastName]
    );

    console.log('✓ Admin user created successfully:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
  } finally {
    await connection.end();
  }
};

run().catch((err) => {
  console.error('✗ Failed to create admin:', err.message);
  process.exit(1);
});
