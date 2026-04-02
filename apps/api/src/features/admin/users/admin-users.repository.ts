import { DatabaseError } from '@/core/errors/app-error'
import { logger } from '@/core/logging/logger'
import { getServiceClient } from '@/core/supabase/service-client'

import {
  buildAdminUserRolePayload,
  buildAdminUserSoftDeletePayload,
  buildAdminUsersSearchFilter,
  buildAdminUserUpdatePayload,
  groupMembershipsByUser,
  mapAdminUserListItems,
  mapAdminUserMembershipRow,
  type AdminUserMembershipRow,
} from './admin-users.utils'
import type {
  AdminUser,
  AdminUserDetail,
  AdminUserListItem,
  AdminUserRoleUpdateInput,
  AdminUserSoftDeleteResult,
  AdminUserStats,
  AdminUserUpdateInput,
  NormalizedAdminUserListQuery,
} from './admin-users.types'

const ADMIN_USER_SELECT_FIELDS = `
  id,
  username,
  email,
  first_name,
  last_name,
  display_name,
  cargo_rol,
  type_rol,
  email_verified,
  email_verified_at,
  phone,
  bio,
  location,
  profile_picture_url,
  country_code,
  created_at,
  updated_at,
  last_login_at,
  is_banned,
  banned_at,
  ban_reason
`

export interface AdminUsersRepository {
  findUsers(
    filters: NormalizedAdminUserListQuery,
  ): Promise<{ users: AdminUserListItem[]; total: number }>
  getStats(): Promise<AdminUserStats>
  findById(userId: string): Promise<AdminUserDetail | null>
  updateUser(userId: string, input: AdminUserUpdateInput): Promise<AdminUser>
  updateUserRole(
    userId: string,
    input: AdminUserRoleUpdateInput,
  ): Promise<AdminUser>
  softDeleteUser(
    userId: string,
    reason: string,
  ): Promise<AdminUserSoftDeleteResult>
}

export class SupabaseAdminUsersRepository implements AdminUsersRepository {
  private readonly client = getServiceClient()

  async findUsers(filters: NormalizedAdminUserListQuery) {
    let query = this.client
      .from('users')
      .select(ADMIN_USER_SELECT_FIELDS, { count: 'exact' })

    if (filters.search) {
      query = query.or(buildAdminUsersSearchFilter(filters.search))
    }

    if (filters.role) {
      query = query.eq('cargo_rol', filters.role)
    }

    if (filters.status === 'banned') {
      query = query.eq('is_banned', true)
    } else if (filters.status === 'active') {
      query = query.eq('is_banned', false).gte('last_login_at', filters.activeSinceIso)
    } else if (filters.status === 'inactive') {
      query = query
        .eq('is_banned', false)
        .or(`last_login_at.is.null,last_login_at.lt.${filters.activeSinceIso}`)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(filters.from, filters.to)

    if (error) {
      throw new DatabaseError('Error al obtener usuarios administrativos', error)
    }

    const users = (data ?? []) as AdminUser[]

    if (users.length === 0) {
      return {
        users: [],
        total: count ?? 0,
      }
    }

    const memberships = await this.findMemberships(
      users.map((user) => user.id),
      true,
    )

    return {
      users: mapAdminUserListItems(users, groupMembershipsByUser(memberships)),
      total: count ?? 0,
    }
  }

  async getStats(): Promise<AdminUserStats> {
    const activeSinceIso = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString()

    const [
      totalUsersResult,
      activeUsersResult,
      bannedUsersResult,
      verifiedUsersResult,
      rolesResult,
      organizationsResult,
    ] = await Promise.all([
      this.client.from('users').select('id', { count: 'exact', head: true }),
      this.client
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('is_banned', false)
        .gte('last_login_at', activeSinceIso),
      this.client
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('is_banned', true),
      this.client
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('email_verified', true),
      this.client.from('users').select('cargo_rol'),
      this.client
        .from('organization_users')
        .select('organization_id, user_id, role, status, organizations(name, slug)')
        .eq('status', 'active'),
    ])

    if (totalUsersResult.error) {
      throw new DatabaseError(
        'Error al contar el total de usuarios',
        totalUsersResult.error,
      )
    }
    if (activeUsersResult.error) {
      throw new DatabaseError(
        'Error al contar los usuarios activos',
        activeUsersResult.error,
      )
    }
    if (bannedUsersResult.error) {
      throw new DatabaseError(
        'Error al contar los usuarios bloqueados',
        bannedUsersResult.error,
      )
    }
    if (verifiedUsersResult.error) {
      throw new DatabaseError(
        'Error al contar los usuarios verificados',
        verifiedUsersResult.error,
      )
    }
    if (rolesResult.error) {
      throw new DatabaseError(
        'Error al obtener la distribucion de roles',
        rolesResult.error,
      )
    }
    if (organizationsResult.error) {
      throw new DatabaseError(
        'Error al obtener la distribucion por organizacion',
        organizationsResult.error,
      )
    }

    const roleCounts = new Map<string, number>()
    const organizationCounts = new Map<
      string,
      AdminUserStats['organization_distribution'][number]
    >()

    for (const row of rolesResult.data ?? []) {
      const roleName = row.cargo_rol?.trim() || 'Sin rol'
      roleCounts.set(roleName, (roleCounts.get(roleName) ?? 0) + 1)
    }

    for (const row of (organizationsResult.data ?? []) as AdminUserMembershipRow[]) {
      const membership = mapAdminUserMembershipRow(row)
      const organizationName =
        membership.organization_name?.trim() || 'Sin organizacion'
      const currentOrganization = organizationCounts.get(
        membership.organization_id,
      )

      if (currentOrganization) {
        currentOrganization.count += 1
        continue
      }

      organizationCounts.set(membership.organization_id, {
        organization_id: membership.organization_id,
        organization_name: organizationName,
        organization_slug: membership.organization_slug,
        count: 1,
      })
    }

    return {
      total_users: totalUsersResult.count ?? 0,
      active_users: activeUsersResult.count ?? 0,
      banned_users: bannedUsersResult.count ?? 0,
      verified_users: verifiedUsersResult.count ?? 0,
      role_distribution: Array.from(roleCounts.entries())
        .map(([role, count]) => ({ role, count }))
        .sort((left, right) => right.count - left.count),
      organization_distribution: Array.from(organizationCounts.values()).sort(
        (left, right) => right.count - left.count,
      ),
    }
  }

  async findById(userId: string) {
    const { data, error } = await this.client
      .from('users')
      .select(ADMIN_USER_SELECT_FIELDS)
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      throw new DatabaseError('Error al obtener el usuario', error)
    }

    if (!data) {
      return null
    }

    const memberships = await this.findMemberships([userId], false)

    return {
      ...(data as AdminUser),
      memberships: groupMembershipsByUser(memberships).get(userId) ?? [],
    } satisfies AdminUserDetail
  }

  async updateUser(userId: string, input: AdminUserUpdateInput) {
    const { data, error } = await this.client
      .from('users')
      .update(buildAdminUserUpdatePayload(input))
      .eq('id', userId)
      .select(ADMIN_USER_SELECT_FIELDS)
      .single()

    if (error || !data) {
      throw new DatabaseError('Error al actualizar el usuario', error)
    }

    return data as AdminUser
  }

  async updateUserRole(userId: string, input: AdminUserRoleUpdateInput) {
    const { data, error } = await this.client
      .from('users')
      .update(buildAdminUserRolePayload(input))
      .eq('id', userId)
      .select(ADMIN_USER_SELECT_FIELDS)
      .single()

    if (error || !data) {
      throw new DatabaseError('Error al actualizar el rol del usuario', error)
    }

    return data as AdminUser
  }

  async softDeleteUser(userId: string, reason: string) {
    const { data, error } = await this.client
      .from('users')
      .update(buildAdminUserSoftDeletePayload(reason))
      .eq('id', userId)
      .select('id, banned_at, ban_reason')
      .single()

    if (error || !data) {
      throw new DatabaseError('Error al desactivar el usuario', error)
    }

    try {
      const { error: membershipError } = await this.client
        .from('organization_users')
        .update({ status: 'suspended' })
        .eq('user_id', userId)
        .eq('status', 'active')

      if (membershipError) {
        logger.warn('No se pudieron suspender las membresias del usuario', {
          membershipError,
          userId,
        })
      }
    } catch (membershipError) {
      logger.warn('Fallo la suspension de membresias durante el soft delete', {
        membershipError,
        userId,
      })
    }

    return {
      user_id: data.id,
      banned_at: data.banned_at ?? new Date().toISOString(),
      reason: data.ban_reason ?? reason,
    }
  }

  private async findMemberships(userIds: string[], activeOnly: boolean) {
    if (userIds.length === 0) {
      return []
    }

    let query = this.client
      .from('organization_users')
      .select('user_id, organization_id, role, status, organizations(name, slug)')
      .in('user_id', userIds)

    if (activeOnly) {
      query = query.eq('status', 'active')
    }

    const { data, error } = await query

    if (error) {
      throw new DatabaseError(
        'Error al obtener las membresias de organizacion',
        error,
      )
    }

    return (data ?? []) as AdminUserMembershipRow[]
  }
}
