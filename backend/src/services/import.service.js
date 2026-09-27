const fs = require('fs');
const ImportModel = require('../models/import.model');
const CategoryModel = require('../models/category.model');
const AccountModel = require('../models/account.model');
const NotificationModel = require('../models/notification.model');
const ActivityModel = require('../models/activity.model');
const AiCorrectionModel = require('../models/aiCorrection.model');
const { parseCSVFile, normalizeRow } = require('../helpers/csvParser');
const { findBatchDuplicates, findIntraBatchDuplicates } = require('../helpers/duplicateDetector');
const { getAIProvider } = require('../config/ai');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const db = require('../config/database');

/**
 * STEP 1-4: Upload → Validate → Parse → Preview
 * Parses the uploaded CSV, validates every row, detects duplicates,
 * applies AI categorization suggestions, and stores the import + rows
 * for later confirmation. Nothing is inserted into transactions yet.
 */
const createImport = async (userId, file, { account_id, type_default = 'expense', use_ai = true }) => {
  if (!file) throw new BadRequestError('CSV file is required');

  let importRecord;
  try {
    const account = await AccountModel.findById(account_id);
    if (!account || account.user_id !== userId || account.status !== 'active') {
      throw new BadRequestError('Invalid account. Provide a valid account_id for the import.');
    }
    importRecord = await ImportModel.create({
      user_id: userId,
      filename: file.filename,
      original_name: file.originalname,
      file_size: file.size
    });

    // Parse CSV
    const { rows } = await parseCSVFile(file.path);

    if (rows.length === 0) {
      await ImportModel.update(importRecord.id, { status: 'failed', error_message: 'No data rows found in CSV' });
      throw new BadRequestError('CSV file contains no data rows');
    }

    await ImportModel.update(importRecord.id, { total_rows: rows.length, status: 'processing' });

    // Validate rows
    const categories = await CategoryModel.findByUser(userId, {});
    const validRows = [];
    const invalidRows = [];

    for (const raw of rows) {
      const normalized = normalizeRow({ ...raw, type: raw.type || type_default });
      if (!normalized.ok) {
        invalidRows.push({ row_number: raw._rowNumber || 0, error: normalized.error });
        await ImportModel.createRow({
          import_id: importRecord.id,
          row_number: raw._rowNumber || 0,
          raw_data: raw,
          status: 'invalid',
          error_message: normalized.error
        });
      } else {
        validRows.push({ ...normalized.data, row_number: raw._rowNumber });
      }
    }

    // Duplicate detection (against DB history + within the file)
    const dbDuplicates = await findBatchDuplicates(userId, validRows);
    const intraBatch = findIntraBatchDuplicates(validRows);

    // AI categorization suggestions
    const provider = getAIProvider();
    const expenseCategories = categories.filter((c) => c.type === 'expense');
    const incomeCategories = categories.filter((c) => c.type === 'income');

    const preparedRows = validRows.map((row, index) => {
      const isDbDup = dbDuplicates.has(index);
      const isIntraDup = intraBatch.has(index);
      let suggestedCategoryId = null;
      let confidence = null;

      if (row.category_id) {
        const explicit=categories.find(c=>c.id===row.category_id&&c.type===row.type);
        if(!explicit)throw new BadRequestError(`Invalid category in row ${row.row_number}`);
        suggestedCategoryId=explicit.id;confidence=1;
      }
      if (!suggestedCategoryId && row.category) {
        const match = categories.find((c) => c.name.toLowerCase() === row.category.toLowerCase() && c.type === row.type);
        if (match) { suggestedCategoryId = match.id; confidence = 1.0; }
      }
      if (!suggestedCategoryId && use_ai) {
        try {
          const pool = row.type === 'income' ? incomeCategories : expenseCategories;
          const suggestion = provider.categorize(row.description, pool);
          if (suggestion.categoryId) {
            suggestedCategoryId = suggestion.categoryId;
            confidence = suggestion.confidence;
            AiCorrectionModel.createSuggestion(userId, row.description, suggestion.categoryId, suggestion.confidence).catch(() => {});
          }
        } catch (err) { /* AI optional — ignore */ }
      }

      return {
        ...row,
        status: (isDbDup || isIntraDup) ? 'duplicate' : 'valid',
        duplicate_of: isDbDup ? dbDuplicates.get(index)[0].id : null,
        suggested_category_id: suggestedCategoryId,
        ai_confidence: confidence
      };
    });

    for (const row of preparedRows) {
      await ImportModel.createRow({
        import_id: importRecord.id,
        row_number: row.row_number,
        raw_data: { date: row.date, description: row.description, amount: row.amount, type: row.type, category: row.category, notes: row.notes, category_id: row.category_id, account_id: account.id },
        status: row.status,
        suggested_category_id: row.suggested_category_id,
        ai_confidence: row.ai_confidence
      });
    }

    const summary = {
      import_id: importRecord.id,
      filename: file.originalname,
      total_rows: rows.length,
      valid_rows: preparedRows.filter((r) => r.status === 'valid').length,
      duplicate_rows: preparedRows.filter((r) => r.status === 'duplicate').length,
      invalid_rows: invalidRows.length,
      preview: preparedRows.slice(0, 50).map((r) => ({
        row_number: r.row_number,
        date: r.date,
        description: r.description,
        amount: r.amount,
        type: r.type,
        suggested_category_id: r.suggested_category_id,
        ai_confidence: r.ai_confidence,
        status: r.status,
        duplicate_of: r.duplicate_of
      })),
      errors: invalidRows.slice(0, 50)
    };

    await ImportModel.update(importRecord.id, {
      duplicate_rows: preparedRows.filter((r) => r.status === 'duplicate').length,
      failed_rows: invalidRows.length
    });

    return summary;
  } catch (err) {
    if (importRecord) {
      await ImportModel.update(importRecord.id, { status: 'failed', error_message: err.message });
    }
    // Cleanup file on failure
    fs.unlink(file.path, () => {});
    if (err instanceof BadRequestError) throw err;
    throw new BadRequestError(`CSV validation failed: ${err.message}`);
  }
};

/**
 * STEP 5-7: User corrections on previewed rows.
 * Accepts per-row category overrides before confirmation.
 */
// All mutations of an import take the same parent-row lock. Reading rows only
// after this lock prevents confirmation from using a stale, pre-correction copy.
const lockImport = async (conn, userId, importId) => {
  const [imports] = await conn.execute('SELECT * FROM imports WHERE id = ? AND user_id = ? FOR UPDATE', [importId, userId]);
  if (!imports.length) throw new NotFoundError('Import not found');
  return imports[0];
};

const correctImportRow = async (userId, importId, rowId, { category_id, action }) => {
  await db.transaction(async (conn) => {
    const imp = await lockImport(conn, userId, importId);
    if (!['processing', 'pending'].includes(imp.status)) throw new BadRequestError('Import is not editable');
    const [rows] = await conn.execute('SELECT * FROM import_rows WHERE id = ? AND import_id = ?', [rowId, importId]);
    const row = rows[0];
    if (!row) throw new NotFoundError('Import row not found');

    if (action === 'skip') {
      await conn.execute("UPDATE import_rows SET status = 'skipped' WHERE id = ?", [rowId]);
    } else if (category_id) {
      // A category correction cannot fix an invalid date or amount. Such rows
      // must be edited and revalidated from the frontend preview first.
      if (row.status === 'invalid' || row.status === 'skipped') {
        throw new BadRequestError('Edit and revalidate this row before categorizing it');
      }
      const [categories] = await conn.execute('SELECT * FROM categories WHERE id = ?', [category_id]);
      const category = categories[0];
      if (!category || category.status !== 'active' || (category.user_id !== userId && category.is_default !== 1)) {
        throw new BadRequestError('Invalid category');
      }
      const raw = typeof row.raw_data === 'string' ? JSON.parse(row.raw_data) : row.raw_data;
      if (category.type !== raw.type) throw new BadRequestError('Category type does not match row type');
      if (row.suggested_category_id && row.suggested_category_id !== Number(category_id)) {
        await AiCorrectionModel.create(userId, String(raw.description || ''), row.suggested_category_id, category_id);
      }
      await conn.execute('UPDATE import_rows SET suggested_category_id = ? WHERE id = ?', [category_id, rowId]);
    }
  });
  return ImportModel.getRows(importId, { limit: 10000 });
};

/**
 * STEP 8-11: Confirmation → Database Transaction → Result → Notification.
 * Inserts all valid rows inside a single MySQL transaction with rollback
 * on any critical failure. Also lets the caller select which rows to include.
 */
const confirmImport = async (userId, importId, { include_duplicates = false, skip_duplicates = true }, ip = null) => {
  // Explicit inclusion takes precedence for legacy clients; the UI sends both.
  const includeDuplicates = include_duplicates || !skip_duplicates;
  let imp;
  let result;
  try {
    result = await db.transaction(async (conn) => {
      imp = await lockImport(conn, userId, importId);
      if (!['pending', 'processing'].includes(imp.status)) throw new BadRequestError('Import is not confirmable');
      const [rows] = await conn.execute('SELECT * FROM import_rows WHERE import_id = ? ORDER BY `row_number`', [importId]);
      const importable = rows.filter(row => row.status === 'valid' || (row.status === 'duplicate' && includeDuplicates));
      let fallbackAccountId;

      for (const row of importable) {
        const raw = typeof row.raw_data === 'string' ? JSON.parse(row.raw_data) : row.raw_data;
        if (!raw.account_id && !fallbackAccountId) {
          // Compatibility for imports uploaded before account_id was persisted.
          const [accounts] = await conn.execute("SELECT id FROM accounts WHERE user_id = ? AND status = 'active' ORDER BY is_default DESC, id LIMIT 1", [userId]);
          if (!accounts.length) throw new BadRequestError('No active account found');
          fallbackAccountId = accounts[0].id;
        }
        const accountId = raw.account_id || fallbackAccountId;
        const [accounts] = await conn.execute("SELECT id FROM accounts WHERE id = ? AND user_id = ? AND status = 'active' FOR UPDATE", [accountId, userId]);
        if (!accounts.length) throw new BadRequestError('Import account is unavailable');
        if (row.suggested_category_id) {
          const [categories] = await conn.execute("SELECT id FROM categories WHERE id = ? AND (user_id = ? OR is_default = 1) AND type = ? AND status = 'active'", [row.suggested_category_id, userId, raw.type]);
          if (!categories.length) throw new BadRequestError('Import category is unavailable; correct the category before confirming');
        }
        const delta = raw.type === 'income' ? Number(raw.amount) : -Number(raw.amount);
        const [transaction] = await conn.execute(
          `INSERT INTO transactions (user_id, account_id, category_id, import_id, type, amount, description, notes, date, ai_suggested_category_id, ai_confidence)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, accountId, row.suggested_category_id || null, importId, raw.type, raw.amount,
            String(raw.description || '').substring(0, 500), raw.notes || null, raw.date,
            row.suggested_category_id || null, row.ai_confidence ?? null]
        );
        await conn.execute('UPDATE accounts SET balance = balance + ? WHERE id = ?', [delta, accountId]);
        await conn.execute("UPDATE import_rows SET status = 'imported', transaction_id = ? WHERE id = ?", [transaction.insertId, row.id]);
      }
      const failed = rows.filter(row => row.status === 'invalid').length;
      await conn.execute("UPDATE imports SET status = 'completed', successful_rows = ?, failed_rows = ?, error_message = NULL WHERE id = ?", [importable.length, failed, importId]);
      return {
        imported: importable.length,
        skipped: rows.length - importable.length,
        duplicates_skipped: rows.filter(row => row.status === 'duplicate' && !includeDuplicates).length,
        failed,
        total_rows: rows.length
      };
    });
  } catch (err) {
    // Ownership/state errors must never change another user's or a completed
    // import's status. Validation failures remain editable for correction.
    if (err instanceof BadRequestError || err instanceof NotFoundError) throw err;
    await db.update("UPDATE imports SET status = 'failed', error_message = ? WHERE id = ? AND user_id = ? AND status IN ('pending', 'processing')",
      [`Database insertion failed: ${err.message}`, importId, userId]);
    throw new BadRequestError('Import failed and rolled back. No transactions were saved. Revalidate your CSV and try again.');
  }

  await NotificationModel.create(userId, 'import_result', 'Import Completed',
    `Your CSV import completed: ${result.imported} transactions imported, ${result.skipped} rows skipped, ${result.failed} invalid rows.`,
    { import_id: importId, ...result });
  await ActivityModel.create(userId, 'imported', 'import', importId, `Imported ${result.imported} transactions from ${imp.original_name}`, null, ip);
  // Includes successful zero-row imports, which otherwise leak uploaded files.
  fs.unlink(require('path').join(__dirname, '../../uploads', imp.filename), () => {});
  return result;
};

const getImports = async (userId, filters) => {
  const { imports, total } = await ImportModel.findByUser(userId, filters);
  return { imports, total };
};

const getImport = async (userId, importId) => {
  const imp = await ImportModel.findById(importId);
  if (!imp || imp.user_id !== userId) throw new NotFoundError('Import not found');
  const rows = await ImportModel.getRows(importId, { limit: 10000 });
  const stats = await ImportModel.getRowStats(importId);
  return { import: imp, rows, stats };
};

const getImportErrors = async (userId, importId) => {
  const imp = await ImportModel.findById(importId);
  if (!imp || imp.user_id !== userId) throw new NotFoundError('Import not found');
  const rows = await ImportModel.getRows(importId, { status: 'invalid', limit: 500 });
  return rows.map((r) => ({ row_number: r.row_number, error: r.error_message, data: r.raw_data }));
};

const cancelImport = async (userId, importId) => {
  const imp = await db.transaction(async (conn) => {
    const record = await lockImport(conn, userId, importId);
    if (record.status === 'completed') throw new BadRequestError('Cannot cancel a completed import');
    await conn.execute("UPDATE imports SET status = 'cancelled' WHERE id = ?", [importId]);
    return record;
  });
  fs.unlink(require('path').join(__dirname, '../../uploads', imp.filename), () => {});
  return true;
};

module.exports = { createImport, correctImportRow, confirmImport, getImports, getImport, getImportErrors, cancelImport };
