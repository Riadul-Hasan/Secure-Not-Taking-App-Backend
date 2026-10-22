const DEFAULT_LIMIT = 4;
const MAX_LIMIT = 4;

const paginate = (query = {}) => {
  const rawPage = Number.parseInt(query.page, 10);
  const rawLimit = Number.parseInt(query.limit, 10);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, MAX_LIMIT)
      : DEFAULT_LIMIT;

  return { page, limit, skip: (page - 1) * limit, maxLimit: MAX_LIMIT };
};

const buildMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
});

module.exports = { paginate, buildMeta, DEFAULT_LIMIT, MAX_LIMIT };