const getMonthRange = (year, month) => {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  };
};

const getCurrentMonth = () => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

const getDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
};

const getLastNMonths = (n = 6) => {
  const months = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }
  return months;
};

const getStartOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEndOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const isExpired = (date) => new Date(date) < new Date();

const formatDate = (date, format = 'YYYY-MM-DD') => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return format.replace('YYYY', y).replace('MM', m).replace('DD', day);
};

const getMonthName = (month) => {
  const names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return names[month - 1] || `Month ${month}`;
};

// DATE columns are calendar values, not local-midnight timestamps. Work in UTC
// and clamp month/year steps so January 31 does not skip February entirely.
const getNextOccurrence = (frequency, currentDate) => {
  const d = new Date(String(currentDate).slice(0, 10) + 'T00:00:00Z');
  const days = { daily: 1, weekly: 7, biweekly: 14 };
  const months = { monthly: 1, quarterly: 3, yearly: 12 };
  if (days[frequency]) d.setUTCDate(d.getUTCDate() + days[frequency]);
  if (months[frequency]) {
    const day = d.getUTCDate();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + months[frequency]);
    const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(day, last));
  }
  return d.toISOString().split('T')[0];
};

module.exports = {
  getMonthRange, getCurrentMonth, getDateRange, getLastNMonths,
  getStartOfDay, getEndOfDay, addDays, addMonths, isExpired, formatDate, getNextOccurrence, getMonthName
};