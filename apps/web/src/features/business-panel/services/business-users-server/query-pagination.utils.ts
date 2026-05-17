import type {
  OrganizationUsersPage,
  OrganizationUsersPageFilters,
} from './query.types'

export function normalizePagination(filters: OrganizationUsersPageFilters) {
  const page = Math.max(1, filters.page)
  const pageSize = Math.min(Math.max(filters.pageSize, 1), 100)

  return {
    from: (page - 1) * pageSize,
    page,
    pageSize,
    to: page * pageSize - 1,
  }
}

export function emptyOrganizationUsersPage(page: number, pageSize: number): OrganizationUsersPage {
  return {
    users: [],
    pagination: {
      page,
      pageSize,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
    },
  }
}
