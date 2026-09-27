const rateLimit = require('express-rate-limit');
const env = require('../config/env');

// In test runs, limiters are no-ops so suites aren't throttled.
const noop = (req, res, next) => next();

const makeLimiter = (options) => (env.NODE_ENV === 'test' ? noop : rateLimit(options));

const apiLimiter = makeLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

const uploadLimiter = makeLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Upload limit reached, please try again later' }
});

module.exports = { apiLimiter, authLimiter, uploadLimiter };
