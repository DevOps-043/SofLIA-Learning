import type {
  BusinessUser,
  BusinessUsersPaginationMeta,
} from '../businessUsers.service'

export type MembershipRow = { user_id: string }

export interface OrganizationUsersPageFilters {
  page: number
  pageSize: number
  search?: string
  role?: string
  status?: string
}

export interface OrganizationUsersPage {
  users: BusinessUser[]
  pagination: BusinessUsersPaginationMeta
}
