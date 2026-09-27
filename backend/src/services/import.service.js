const fs = require('fs');
const ImportModel = require('../models/import.model');
const CategoryModel = require('../models/category.model');
const AccountModel = require('../models/account.model');
const TransactionModel = require('../models/transaction.model');
const NotificationModel = require('../models/notification.model');
const ActivityModel = require('../models/activity.model');
const AiCorrectionModel = require('../models/aiCorrection.model');
const { parseCSVFile, normalizeRow } = require('../helpers/csvParser');
const { findBatchDuplicates, findIntraBatchDuplicates, normalizeDescription } = require('../helpers/duplicateDetector');
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

  const account = await AccountModel.findById(account_id);
  if (!account || account.user_id !== userId || account.status !== 'active') throw new BadRequestError('Invalid account. Provide a valid account_id for the import.');

  const importRecord = await ImportModel.create({
    user_id: userId,
    filename: file.filename,
    original_name: file.originalname,
    file_size: file.size
  });

  try {
    // Parse CSV
    const { headers, rows, totalRows } = await parseCSVFile(file.path);

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
      const normalized = normalizeRow(raw);
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
    if (err.message && err.message.includes('CSV parsing failed')) {
      await ImportModel.update(importRecord.id, { status: 'failed', error_message: err.message });
    }
    // Cleanup file on failure
    fs.unlink(file.path, () => {});
    throw err;
  }
};

/**
 * STEP 5-7: User corrections on previewed rows.
 * Accepts per-row category overrides before confirmation.
 */
const correctImportRow = async (userId, importId, rowId, { category_id, action }) => {
  const imp = await ImportModel.findById(importId);
  if (!imp || imp.user_id !== userId) throw new NotFoundError('Import not found');
  if (imp.status !== 'processing' && imp.status !== 'pending') throw new BadRequestError('Import is not editable');

  const rows = await ImportModel.getRows(importId, { limit: 10000 });
  const row = rows.find((r) => r.id === rowId);
  if (!row) throw new NotFoundError('Import row not found');

  if (action === 'skip') {
    await ImportModel.updateRow(rowId, { status: 'skipped' });
  } else if (category_id) {
    const category = await CategoryModel.findById(category_id);
    if (!category || (category.user_id !== userId && category.is_default !== 1)) throw new BadRequestError('Invalid category');
    const raw=typeof row.raw_data==='string'?JSON.parse(row.raw_data):row.raw_data;
    if(category.type!==raw.type)throw new BadRequestError('Category type does not match row type');
    if (row.suggested_category_id && row.suggested_category_id !== category_id) {
      // Learning signal
      await AiCorrectionModel.create(userId, String(raw.description || ''), row.suggested_category_id, category_id);
    }
    await ImportModel.updateRow(rowId, { suggested_category_id: category_id, status: row.status === 'duplicate' ? 'duplicate' : 'valid' });
  }

  return ImportModel.getRows(importId, { limit: 10000 });
};

/**
 * STEP 8-11: Confirmation → Database Transaction → Result → Notification.
 * Inserts all valid rows inside a single MySQL transaction with rollback
 * on any critical failure. Also lets the caller select which rows to include.
 */
const confirmImport = async (userId, importId, { include_duplicates = false, skip_duplicates = true }, ip = null) => {
  const imp = await ImportModel.findById(importId);
  if (!imp || imp.user_id !== userId) throw new NotFoundError('Import not found');
  if (!['pending','processing'].includes(imp.status)) throw new BadRequestError('Import is not confirmable');

  const rows = await ImportModel.getRows(importId, { limit: 10000 });
  const importable = rows.filter((r) => {
    if (r.status === 'valid') return true;
    if (r.status === 'duplicate' && include_duplicates) return true;
    return false;
  });

  if (importable.length === 0) {
    await ImportModel.update(importId, { status: 'completed', successful_rows: 0, failed_rows: rows.filter((r) => r.status === 'invalid').length });
    await NotificationModel.create(userId, 'import_result', 'Import Completed', 'Your CSV import finished with 0 transactions imported (no valid rows).', { import_id: importId });
    return { imported: 0, skipped: rows.length, duplicates_skipped: rows.filter((r) => r.status === 'duplicate' && !include_duplicates).length, failed: rows.filter((r) => r.status === 'invalid').length };
  }

  const account = await AccountModel.findById(imp.user_id ? (await firstUserAccount(userId)) : null);
  const defaultAccount = await AccountModel.findDefault(userId) || account;

  let imported = 0;
  try {
    await db.transaction(async (conn) => {
      const [locked]=await conn.execute('SELECT status FROM imports WHERE id = ? FOR UPDATE',[importId]);
      if(!['pending','processing'].includes(locked[0].status))throw new BadRequestError('Import is not confirmable');
      for (const row of importable) {
        const raw = typeof row.raw_data === 'string' ? JSON.parse(row.raw_data) : row.raw_data;
        const accountId=raw.account_id||defaultAccount.id;
        const [owned]=await conn.execute("SELECT id FROM accounts WHERE id = ? AND user_id = ? AND status = 'active'",[accountId,userId]);
        if(!owned.length)throw new BadRequestError('Import account is unavailable');
        const delta = raw.type === 'income' ? parseFloat(raw.amount) : -parseFloat(raw.amount);

        const [r] = await conn.execute(
          `INSERT INTO transactions (user_id, account_id, category_id, import_id, type, amount, description, notes, date, ai_suggested_category_id, ai_confidence)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, accountId, row.suggested_category_id || null, importId, raw.type, raw.amount,
           String(raw.description || '').substring(0, 500), raw.notes || null, raw.date,
           row.suggested_category_id || null, row.ai_confidence || null]
        );
        await conn.execute('UPDATE accounts SET balance = balance + ? WHERE id = ?', [delta, accountId]);
        await conn.execute('UPDATE import_rows SET status = ?, transaction_id = ? WHERE id = ?', ['imported', r.insertId, row.id]);
        imported++;
      }
      await conn.execute('UPDATE imports SET status = ?, successful_rows = ? WHERE id = ?', ['completed', imported, importId]);
    });
  } catch (err) {
    // A concurrent confirmation must not overwrite a completed import's status.
    if(err instanceof BadRequestError)throw err;
    // Critical failure: full rollback already happened; mark import failed
    await ImportModel.update(importId, { status: 'failed', error_message: `Database insertion failed: ${err.message}` });
    await NotificationModel.create(userId, 'import_result', 'Import Failed', `Your CSV import failed and was rolled back. No transactions were saved.`, { import_id: importId });
    throw new BadRequestError(`Import failed and rolled back: ${err.message}`);
  }

  const duplicatesSkipped = rows.filter((r) => r.status === 'duplicate' && !include_duplicates).length;
  const failed = rows.filter((r) => r.status === 'invalid').length;

  await NotificationModel.create(userId, 'import_result', 'Import Completed',
    `Your CSV import completed: ${imported} transactions imported, ${duplicatesSkipped} duplicates skipped, ${failed} invalid rows.`,
    { import_id: importId, imported, duplicates_skipped: duplicatesSkipped, failed });

  await ActivityModel.create(userId, 'imported', 'import', importId, `Imported ${imported} transactions from ${imp.original_name}`, null, ip);

  // Cleanup uploaded file
  fs.unlink(imp.filename ? require('path').join(__dirname, '../../uploads', imp.filename) : '', () => {});

  return { imported, duplicates_skipped: duplicatesSkipped, failed, total_rows: rows.length };
};

const firstUserAccount = async (userId) => {
  const account = await AccountModel.findDefault(userId);
  if (account) return account.id;
  const accounts = await AccountModel.findByUser(userId);
  if (accounts.length === 0) throw new BadRequestError('No account found. Create an account first.');
  return accounts[0].id;
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
  const imp = await ImportModel.findById(importId);
  if (!imp || imp.user_id !== userId) throw new NotFoundError('Import not found');
  if (imp.status === 'completed') throw new BadRequestError('Cannot cancel a completed import');
  await ImportModel.update(importId, { status: 'cancelled' });
  fs.unlink(require('path').join(__dirname, '../../uploads', imp.filename), () => {});
  return true;
};

module.exports = { createImport, correctImportRow, confirmImport, getImports, getImport, getImportErrors, cancelImport };
