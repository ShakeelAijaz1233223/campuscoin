#!/usr/bin/env node
/**
 * Reset script: drops and recreates the database, then re-applies schema and seed data.
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const run = async () => {
  const dbName = process.env.DB_NAME || 'campuscoin';
  if (process.env.NODE_ENV === 'production' || !/^[A-Za-z0-9_]+$/.test(dbName) || !process.argv.includes('--confirm=' + dbName)) {
    throw new Error('Destructive reset blocked. Back up first; use --confirm=' + dbName + ' only for a disposable development database.');
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    console.log(`→ Dropping database ${dbName}...`);
    await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);

    console.log(`→ Creating database ${dbName}...`);
    await connection.query(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${dbName}\``);

    console.log('→ Applying schema...');
    await connection.query(fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8'));

    try {
      await connection.query(fs.readFileSync(path.join(__dirname, '../database/indexes.sql'), 'utf8'));
    } catch (err) {
      if (err.code !== 'ER_DUP_KEYNAME') throw err;
    }
  } finally {
    await connection.end();
  }

  console.log('→ Seeding data...');
  const { execSync } = require('child_process');
  execSync('node scripts/seed.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  console.log('✓ Reset completed. Database is fresh and seeded.');
};

run().catch((err) => {
  console.error('✗ Reset failed:', err.message);
  process.exit(1);
});
