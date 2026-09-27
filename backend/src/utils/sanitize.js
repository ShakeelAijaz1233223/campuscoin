const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

const stripSensitive = (user) => {
  if (!user) return null;
  const { password_hash, password, reset_token, ...safe } = user;
  return safe;
};

module.exports = { sanitizeString, sanitizeObject, stripSensitive };