import test from 'node:test';
import assert from 'node:assert/strict';
import { buildYearMonths } from '../src/utils/chartData.js';

test('cash-flow chart never presents unrecorded future months as an expense crash', () => {
  const data = buildYearMonths(
    { incomeExpense: [{ name: '2026-09', income: 100, expense: 25 }] },
    2026,
    new Date('2026-09-28T12:00:00Z')
  );
  assert.equal(data.length, 12);
  assert.deepEqual(data[8], { label: 'Sep', income: 100, expense: 25 });
  assert.deepEqual(data[9], { label: 'Oct', income: null, expense: null });
  assert.deepEqual(data[0], { label: 'Jan', income: 0, expense: 0 });
});
test('recorded future entries remain visible; unrelated years cannot leak into a chart', () => {
  const data = buildYearMonths(
    {
      incomeExpense: [
        { name: '2026-12', income: '20.50', expense: '5.25' },
        { name: '2025-11', income: 500, expense: 400 }
      ]
    },
    2026,
    new Date('2026-09-28T12:00:00Z')
  );
  assert.equal(data[11].income, 20.5);
  assert.equal(data[10].income, null);
});
