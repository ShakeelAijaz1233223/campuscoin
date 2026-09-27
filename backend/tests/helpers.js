/**
 * Shared test helpers. Requires MySQL running with schema applied:
 *   npm run migrate && npm run seed
 * Run tests with: npm test  (NODE_ENV=test is set automatically)
 */
process.env.NODE_ENV = 'test';
// Never default integration fixtures into the application's campuscoin database.
process.env.DB_NAME = process.env.DB_NAME || 'campuscoin_test';

const app = require('../src/app');
const mysql = require('mysql2/promise');

let server;
let baseUrl;

const startServer = async () => {
  if (server) return baseUrl;
  await new Promise((resolve) => {
    server = app.listen(0, () => resolve());
  });
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}/api/v1`;
  return baseUrl;
};

const stopServer = async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
    server = null;
  }
  // Close the app's DB pool so the test process can exit
  try {
    const db = require('../src/config/database');
    await db.pool.end();
  } catch (e) { /* already closed */ }
};

const getDb = () => mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'campuscoin',
  waitForConnections: true,
  connectionLimit: 5
});

let uniqueCounter = Date.now();
const uniqueEmail = (prefix = 'user') => `${prefix}.${uniqueCounter++}.${Math.floor(Math.random() * 1e6)}@test.local`;

const api = async (method, path, { token, body, headers = {} } = {}) => {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  let json = null;
  try { json = await res.json(); } catch (e) { /* no body */ }
  return { status: res.status, data: json };
};

const registerAndLogin = async ({ role = 'student', password = 'TestPass@123', first_name = 'Test' } = {}) => {
  const email = uniqueEmail(role);
  const reg = await api('POST', '/auth/register', {
    body: { email, password, first_name, last_name: 'Tester' }
  });
  if (role === 'admin') {
    const db = await getDb();
    await db.execute("UPDATE users SET role = 'admin' WHERE email = ?", [email]);
    await db.end();
  }
  const login = await api('POST', '/auth/login', { body: { email, password } });
  return { email, password, token: login.data?.data?.token, user: login.data?.data?.user };
};

const createAccount = async (token, overrides = {}) => {
  const res = await api('POST', '/accounts', {
    token,
    body: { name: `Acc ${Math.random().toString(36).substring(7)}`, type: 'cash', balance: 1000, ...overrides }
  });
  return res.data?.data?.account;
};

module.exports = { startServer, stopServer, api, registerAndLogin, createAccount, uniqueEmail, getDb };
