const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('./constants');

const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(query.limit) || DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const buildPaginationMeta = (totalItems, page, limit) => {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    totalItems,
    totalPages,
    currentPage: page,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
};

module.exports = { getPagination, buildPaginationMeta };