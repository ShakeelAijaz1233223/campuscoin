const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const env = require('./config/env');
const routes = require('./routes');
const requestLogger = require('./middleware/requestLogger');
const { apiLimiter } = require('./middleware/rateLimit');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: env.CLIENT_URL === '*' ? true : env.CLIENT_URL.split(',').map(origin => origin.trim()).filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Input sanitization: strip angle brackets from string inputs to defuse XSS payloads
app.use((req, res, next) => {
  const clean = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    for (const key of Object.keys(obj)) {
      if (['password', 'current_password', 'new_password'].includes(key)) continue;
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(/[<>]/g, '').trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        clean(obj[key]);
      }
    }
    return obj;
  };
  if (req.body) clean(req.body);
  next();
});

// Request logging
if (env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// Static exports (reports) — authenticated downloads go through the API route
// Uploaded financial CSVs are private; never expose the upload directory.

// Health check (before rate limiting so probes never get throttled)
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'CampusCoin API is healthy', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// Global rate limiting (disabled in test runs so suites aren't throttled)
if (env.NODE_ENV !== 'test') {
  app.use('/api', apiLimiter);
}

// API routes
app.use('/api/v1', routes);

// 404 + error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
