#!/usr/bin/env node
/**
 * Migration script: creates the database and applies schema + indexes.
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const run = async () => {
  const database = process.env.DB_NAME || 'campuscoin';
  if (!/^[A-Za-z0-9_]+$/.test(database)) throw new Error('DB_NAME must contain only letters, numbers and underscores');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    console.log('→ Creating database if it does not exist...');
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'campuscoin'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${process.env.DB_NAME || 'campuscoin'}\``);

    console.log('→ Applying schema.sql...');
    const schema = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
    await connection.query(schema);

    console.log('→ Applying indexes.sql...');
    const indexes = fs.readFileSync(path.join(__dirname, '../database/indexes.sql'), 'utf8');
    // Skip existing indexes individually, not the whole batch after its first duplicate.
    for (const statement of indexes.replace(/--[^\n]*/g, '').split(';').filter(s => s.trim())) {
      try { await connection.query(statement); }
      catch (err) { if (err.code !== 'ER_DUP_KEYNAME') throw err; }
    }
    await require('../database/defaults')(connection);

    console.log('✓ Migration completed successfully.');
    console.log(`  Database: ${process.env.DB_NAME || 'campuscoin'}`);
    console.log('  Essential reference data ready. No demo users or financial records were added.');
  } finally {
    await connection.end();
  }
};

run().catch((err) => {
  console.error('✗ Migration failed:', err.message);
  process.exit(1);
});
