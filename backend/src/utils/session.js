const jwt = require('jsonwebtoken');
const env = require('../config/env');
const COOKIE = 'campuscoin_session';
const options = () => ({ httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/v1' });
const setSession = (res, token) => res.cookie(COOKIE, token, { ...options(), expires: new Date(jwt.decode(token).exp * 1000) });
const clearSession = res => res.clearCookie(COOKIE, options());
const readSession = req => {
  const value = (req.headers.cookie || '').split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='));
  return value ? value.slice(COOKIE.length + 1) : null;
};
module.exports = { setSession, clearSession, readSession };
