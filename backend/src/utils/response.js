const sendSuccess = (res, data = null, message = 'Request successful', meta = {}, statusCode = 200) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  if (meta && Object.keys(meta).length > 0) response.meta = meta;
  return res.status(statusCode).json(response);
};

const sendCreated = (res, data = null, message = 'Resource created successfully') => {
  return sendSuccess(res, data, message, {}, 201);
};

const sendNoContent = (res) => {
  return res.status(204).end();
};

const sendError = (res, message = 'An error occurred', statusCode = 500, errors = []) => {
  const response = { success: false, message };
  if (errors.length > 0) response.errors = errors;
  return res.status(statusCode).json(response);
};

const sendPaginated = (res, data, pagination, message = 'Request successful') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta: { pagination }
  });
};

module.exports = { sendSuccess, sendCreated, sendNoContent, sendError, sendPaginated };