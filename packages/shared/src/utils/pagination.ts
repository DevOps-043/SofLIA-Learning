export const calculatePagination = (
  page: number,
  limit: number,
  total: number,
) => {
  const totalPages = Math.ceil(total / limit)

  return {
    page,
    limit,
    offset: (page - 1) * limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}
