require('dotenv').config({
  path: require('path').join(__dirname, '../../.env')
});

const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_HOST: process.env.DB_HOST || '127.0.0.1',
  DB_PORT: parseInt(process.env.DB_PORT) || 3306,
  DB_NAME: process.env.DB_NAME || 'campuscoin',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  JWT_SECRET: process.env.JWT_SECRET || 'default_dev_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5242880,
  AI_PROVIDER: process.env.AI_PROVIDER || 'none',
  AI_API_KEY: process.env.AI_API_KEY || '',
  RESET_TOKEN_EXPIRY: parseInt(process.env.RESET_TOKEN_EXPIRY) || 3600000,
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 1000
};

if (
  env.NODE_ENV === 'production' &&
  (!process.env.JWT_SECRET || env.JWT_SECRET.length < 32)
)
  throw new Error(
    'Set JWT_SECRET to a random secret of at least 32 characters in production'
  );
if (
  env.NODE_ENV === 'production' &&
  env.CLIENT_URL.split(',').some((origin) => origin.trim() === '*')
)
  throw new Error('Wildcard credentialed CORS is not allowed in production');
module.exports = env;
