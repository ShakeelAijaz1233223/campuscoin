const sum = (arr, fn = (x) => x) => arr.reduce((acc, item) => acc + parseFloat(fn(item) || 0), 0);

const mean = (arr, fn) => {
  if (!arr.length) return 0;
  return sum(arr, fn) / arr.length;
};

const percentageChange = (current, previous) => {
  const c = parseFloat(current);
  const p = parseFloat(previous);
  if (!p || p === 0) return c > 0 ? 100 : 0;
  return ((c - p) / Math.abs(p)) * 100;
};

const round2 = (num) => Math.round(parseFloat(num) * 100) / 100;

const median = (arr, fn = (x) => x) => {
  if (!arr.length) return 0;
  const sorted = arr.map(fn).map(Number).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

const standardDeviation = (arr, fn = (x) => x) => {
  if (arr.length < 2) return 0;
  const values = arr.map(fn).map(Number);
  const avg = mean(values);
  const squaredDiffs = values.map((v) => (v - avg) ** 2);
  return Math.sqrt(sum(squaredDiffs) / values.length);
};

/**
 * Unusually large transaction detection using mean + 2*stdDev threshold.
 */
const largeThreshold = (amounts) => {
  if (amounts.length < 3) return null;
  const avg = mean(amounts);
  const std = standardDeviation(amounts);
  return round2(avg + 2 * std);
};

/**
 * Linear trend forecast for the next period based on historical values.
 * values: array of numbers ordered oldest -> newest.
 */
const linearForecast = (values) => {
  const n = values.length;
  if (n === 0) return 0;
  if (n === 1) return values[0];
  const xs = values.map((_, i) => i);
  const xMean = mean(xs);
  const yMean = mean(values);
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (xs[i] - xMean) * (values[i] - yMean);
    denominator += (xs[i] - xMean) ** 2;
  }
  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;
  return round2(Math.max(0, intercept + slope * n));
};

const savingsRate = (income, expense) => {
  if (!income || income <= 0) return 0;
  return round2(((income - expense) / income) * 100);
};

module.exports = { sum, mean, median, percentageChange, round2, standardDeviation, largeThreshold, linearForecast, savingsRate };
