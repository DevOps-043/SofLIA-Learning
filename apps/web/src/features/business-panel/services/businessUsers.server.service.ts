import 'server-only'

import type {
  BusinessUser,
  BusinessUsersPaginationMeta,
  BusinessUserStats,
  CreateBusinessUserRequest,
  UpdateBusinessUserRequest,
} from './businessUsers.service'
import {
  activateUser,
  createOrganizationUser,
  deleteOrganizationUser,
  getOrganizationStats,
  getOrganizationUsers,
  getOrganizationUsersPage,
  resendInvitation,
  suspendUser,
  updateOrganizationUser,
} from './business-users-server'

export class BusinessUsersServerService {
  static async getOrganizationUsers(
    organizationId: string,
  ): Promise<BusinessUser[]> {
    return getOrganizationUsers(organizationId)
  }

  static async getOrganizationUsersPage(
    organizationId: string,
    filters: {
      page: number
      pageSize: number
      search?: string
      role?: string
      status?: string
    },
  ): Promise<{ users: BusinessUser[]; pagination: BusinessUsersPaginationMeta }> {
    return getOrganizationUsersPage(organizationId, filters)
  }

  static async getOrganizationStats(
    organizationId: string,
  ): Promise<BusinessUserStats> {
    return getOrganizationStats(organizationId)
  }

  static async createOrganizationUser(
    organizationId: string,
    userData: CreateBusinessUserRequest,
    createdBy: string,
  ): Promise<BusinessUser> {
    return createOrganizationUser(organizationId, userData, createdBy)
  }

  static async updateOrganizationUser(
    organizationId: string,
    userId: string,
    userData: UpdateBusinessUserRequest,
  ): Promise<BusinessUser> {
    return updateOrganizationUser(organizationId, userId, userData)
  }

  static async deleteOrganizationUser(
    organizationId: string,
    userId: string,
  ): Promise<void> {
    return deleteOrganizationUser(organizationId, userId)
  }

  static async resendInvitation(
    organizationId: string,
    userId: string,
  ): Promise<void> {
    return resendInvitation(organizationId, userId)
  }

  static async suspendUser(
    organizationId: string,
    userId: string,
  ): Promise<void> {
    return suspendUser(organizationId, userId)
  }

  static async activateUser(
    organizationId: string,
    userId: string,
  ): Promise<void> {
    return activateUser(organizationId, userId)
  }
}
