const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

/** Missing past periods are recorded zeroes. Unrecorded future periods are not forecasts. */
export function buildYearMonths(report, year, now = new Date()) {
  const byMonth = new Map(
    (report?.incomeExpense || [])
      .filter((row) => Number(String(row.name).slice(0, 4)) === year)
      .map((row) => [Number(String(row.name).slice(5, 7)), row])
  );
  return MONTHS.map((label, index) => {
    const row = byMonth.get(index + 1);
    const future =
      year > now.getUTCFullYear() ||
      (year === now.getUTCFullYear() && index > now.getUTCMonth());
    return {
      label,
      income: row ? Number(row.income) || 0 : future ? null : 0,
      expense: row ? Number(row.expense) || 0 : future ? null : 0
    };
  });
}
