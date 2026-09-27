const fs = require('fs');
const { parse } = require('csv-parse');

/**
 * Parse a CSV file into structured rows.
 * Supports flexible headers: date, description, amount, type, category, notes, account
 * Returns { headers, rows } where rows is an array of objects keyed by normalized header names.
 */
const SUPPORTED_COLUMNS = {
  date: ['date', 'transaction date', 'txn_date', 'posted', 'posted date', 'transaction_date'],
  description: ['description', 'details', 'narration', 'memo', 'particulars', 'title', 'name'],
  amount: ['amount', 'value', 'amt', 'transaction amount', 'amount(pkr)', 'amount_pkr'],
  type: ['type', 'transaction type', 'debit/credit', 'dr/cr', 'direction'],
  category_id: ['category_id', 'categoryid'],
  category: ['category', 'category name', 'cat'],
  notes: ['notes', 'note', 'comment', 'remarks'],
  account: ['account', 'account name', 'source account']
};

const normalizeHeader = (header) => {
  const h = String(header || '').trim().toLowerCase().replace(/["']/g, '');
  for (const [canonical, variants] of Object.entries(SUPPORTED_COLUMNS)) {
    if (variants.includes(h)) return canonical;
  }
  return h.replace(/\s+/g, '_');
};

const parseCSVFile = (filePath, options = {}) => {
  return new Promise((resolve, reject) => {
    const maxRows = options.maxRows || 5000;
    const content = fs.readFileSync(filePath, 'utf8');
    // Strip BOM
    const clean = content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;

    parse(
      clean,
      {
        columns: (headers) => headers.map(normalizeHeader),
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
        bom: true
      },
      (err, rows) => {
        if (err) return reject(new Error(`CSV parsing failed: ${err.message}`));
        if (!rows || rows.length === 0) return reject(new Error('CSV file contains no data rows'));
        if(rows.length>maxRows)return reject(new Error(`CSV contains too many rows (maximum ${maxRows})`));
        const trimmed = rows.slice(0, maxRows).map((row, idx) => ({ ...row, _rowNumber: idx + 2 }));
        resolve({ headers: Object.keys(rows[0] || {}), rows: trimmed, totalRows: rows.length });
      }
    );
  });
};

/**
 * Normalize a raw CSV row into a transaction-shaped object.
 * Returns { ok, data?, error? }
 */
const normalizeRow = (row) => {
  const date = row.date ? String(row.date).trim() : '';
  const description = row.description ? String(row.description).trim() : '';
  const amountRaw = row.amount !== undefined && row.amount !== null ? String(row.amount).trim() : '';
  const type = row.type ? String(row.type).trim().toLowerCase() : '';
  const category = row.category ? String(row.category).trim() : '';
  const notes = row.notes ? String(row.notes).trim() : '';
  const account = row.account ? String(row.account).trim() : '';

  const errors = [];
  if (!date) errors.push('Missing date');
  if (!description) errors.push('Missing description');
  if (!amountRaw) errors.push('Missing amount');

  // Parse amount: strip currency symbols and commas
  let amount = null;
  if (amountRaw) {
    const cleaned = amountRaw.replace(/[^0-9.\-]/g, '');
    amount = parseFloat(cleaned);
    if (isNaN(amount)) errors.push(`Invalid amount: "${amountRaw}"`);
    else if (amount <= 0) errors.push(`Amount must be positive: ${amount}`);
    else if (amount > 999999999) errors.push(`Amount too large: ${amount}`);
  }

  // Parse date: support YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
  let parsedDate = null;
  if (date) {
    parsedDate = parseDate(date);
    if (!parsedDate) errors.push(`Invalid date format: "${date}" (use YYYY-MM-DD)`);
  }

  // Normalize type
  let normalizedType = 'expense';
  if (type) {
    if (['credit', 'income', 'in', 'cr', 'deposit', 'received'].includes(type)) normalizedType = 'income';
    else if (['debit', 'expense', 'out', 'dr', 'withdrawal', 'paid', 'payment'].includes(type)) normalizedType = 'expense';
    else errors.push(`Invalid type: "${type}" (use income/expense or credit/debit)`);
  } else if (amount !== null && amount < 0) {
    normalizedType = 'expense';
  }

  if (errors.length > 0) return { ok: false, error: errors.join('; '), raw: row };

  return {
    ok: true,
    data: {
      date: parsedDate,
      description,
      amount: Math.abs(amount),
      type: normalizedType,
      category,
      category_id: row.category_id ? Number(row.category_id) : null,
      notes,
      account
    },
    raw: row
  };
};

const parseDate = (value) => {
  const v = String(value).trim();

  // YYYY-MM-DD or YYYY/MM/DD
  let m = v.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (m) {
    const [, y, mo, d] = m;
    const date = new Date(Date.UTC(+y, +mo - 1, +d));
    return isValidDate(date, +y, +mo, +d) ? date.toISOString().split('T')[0] : null;
  }

  // DD/MM/YYYY (day-first, common in PK region)
  m = v.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (m) {
    let [, d, mo, y] = m;
    if (+mo > 12) { [d, mo] = [mo, d]; } // swap if month/day swapped
    const date = new Date(Date.UTC(+y, +mo - 1, +d));
    return isValidDate(date, +y, +mo, +d) ? date.toISOString().split('T')[0] : null;
  }

  // Try native Date parsing as fallback (e.g., "Jan 5, 2026")
  const native = new Date(v);
  if (!isNaN(native.getTime()) && native.getFullYear() >= 2000 && native.getFullYear() <= 2100) {
    return native.toISOString().split('T')[0];
  }

  return null;
};

const isValidDate = (date, y, mo, d) =>
  date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;

module.exports = { parseCSVFile, normalizeRow, parseDate, normalizeHeader, SUPPORTED_COLUMNS };
