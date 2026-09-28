const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
      ...(!/password|token/i.test(err.path) && { value: err.value })
    }));
    throw new ValidationError('Validation failed', formattedErrors);
  }
  next();
};

module.exports = validate;
