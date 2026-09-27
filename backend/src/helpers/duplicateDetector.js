const db = require('../config/database');

/**
 * Detects duplicate transactions for a user.
 * A duplicate is a transaction with the same normalized description, same amount
 * (within tolerance), occurring within N hours of the target date.
 */
const normalizeDescription = (description) => {
  return String(description || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const findExistingDuplicates = async (userId, { description, amount, date }, options = {}) => {
  const hours = options.hours || 24;
  const tolerance = options.tolerance || 0.01;
  const excludeId = options.excludeId || null;

  const normalized = normalizeDescription(description);
  if (!normalized || amount === undefined || amount === null) return [];

  // Look back/forward within the window for similar transactions
  const candidates = await db.query(
    `SELECT id, description, amount, date, type FROM transactions
     WHERE user_id = ? AND status = 'active'
       AND ABS(amount - ?) <= ?
       AND date BETWEEN DATE_SUB(?, INTERVAL ? HOUR) AND DATE_ADD(?, INTERVAL ? HOUR)`,
    [userId, amount, tolerance, date, hours, date, hours]
  );

  const duplicates = candidates.filter((t) => {
    if (excludeId && t.id === excludeId) return false;
    const tNorm = normalizeDescription(t.description);
    // Exact normalized match OR one contains the other (bank narration prefixes)
    return tNorm === normalized || (tNorm.length > 3 && normalized.length > 3 && (tNorm.includes(normalized) || normalized.includes(tNorm)));
  });

  return duplicates;
};

/**
 * Batch duplicate detection for CSV import rows.
 * rows: [{ date, description, amount, type }]
 * Returns Map keyed by row index with array of matching existing transactions.
 */
const findBatchDuplicates = async (userId, rows) => {
  const results = new Map();
  if (!rows.length) return results;

  // Load user transactions from the widest relevant window once
  const dates = rows.map((r) => r.date).filter(Boolean).sort();
  if (!dates.length) return results;
  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];

  const existing = await db.query(
    `SELECT id, description, amount, date, type FROM transactions
     WHERE user_id = ? AND status = 'active' AND date BETWEEN DATE_SUB(?, INTERVAL 2 DAY) AND DATE_ADD(?, INTERVAL 2 DAY)`,
    [userId, minDate, maxDate]
  );

  const normalizedExisting = existing.map((t) => ({
    ...t,
    _norm: normalizeDescription(t.description),
    _amount: parseFloat(t.amount)
  }));

  rows.forEach((row, index) => {
    const norm = normalizeDescription(row.description);
    const amount = parseFloat(row.amount);
    if (!norm || isNaN(amount)) return;
    const matches = normalizedExisting.filter((t) => {
      const sameAmount = Math.abs(t._amount - amount) <= 0.01;
      const sameDayWindow = Math.abs(new Date(t.date) - new Date(row.date)) <= 24 * 60 * 60 * 1000 * 1.5;
      const sameDesc = t._norm === norm || (t._norm.length > 3 && norm.length > 3 && (t._norm.includes(norm) || norm.includes(t._norm)));
      return sameAmount && sameDesc && sameDayWindow;
    });
    if (matches.length > 0) results.set(index, matches);
  });

  return results;
};

/**
 * Detect intra-batch duplicates (same transaction appearing twice in one CSV).
 */
const findIntraBatchDuplicates = (rows) => {
  const seen = new Map();
  const dupIndices = new Set();
  rows.forEach((row, index) => {
    const key = `${normalizeDescription(row.description)}|${parseFloat(row.amount).toFixed(2)}|${row.date}`;
    if (seen.has(key)) dupIndices.add(index);
    else seen.set(key, index);
  });
  return dupIndices;
};

module.exports = { normalizeDescription, findExistingDuplicates, findBatchDuplicates, findIntraBatchDuplicates };
