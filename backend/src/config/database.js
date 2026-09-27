const mysql = require('mysql2/promise');
const env = require('./env');
const logger = require('../utils/logger');

const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00',
  dateStrings: true
});

const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    logger.info('MySQL connected successfully');
    conn.release();
    return true;
  } catch (err) {
    logger.error('MySQL connection failed:', err.message);
    throw err;
  }
};

const query = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

const getOne = async (sql, params = []) => {
  const rows = await query(sql, params);
  return rows[0] || null;
};

const insert = async (sql, params = []) => {
  const [result] = await pool.execute(sql, params);
  return { insertId: result.insertId, affectedRows: result.affectedRows };
};

const update = async (sql, params = []) => {
  const [result] = await pool.execute(sql, params);
  return { affectedRows: result.affectedRows, changedRows: result.changedRows };
};

const remove = async (sql, params = []) => {
  const [result] = await pool.execute(sql, params);
  return { affectedRows: result.affectedRows };
};

const transaction = async (callback) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = { pool, testConnection, query, getOne, insert, update, remove, transaction };