const toDecimal = (amount) => {
  return parseFloat(parseFloat(amount).toFixed(2));
};

const addMoney = (a, b) => {
  return toDecimal(toDecimal(a) + toDecimal(b));
};

const subtractMoney = (a, b) => {
  return toDecimal(toDecimal(a) - toDecimal(b));
};

const percentageOf = (part, total) => {
  if (!total || total === 0) return 0;
  return toDecimal((toDecimal(part) / toDecimal(total)) * 100);
};

const formatMoney = (amount, currency = 'PKR') => {
  return `${currency} ${toDecimal(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

module.exports = { toDecimal, addMoney, subtractMoney, percentageOf, formatMoney };