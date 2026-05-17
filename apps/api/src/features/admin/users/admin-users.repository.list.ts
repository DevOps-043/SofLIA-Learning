import { DatabaseError } from '@/core/errors/app-error'
import { getServiceClient } from '@/core/supabase/service-client'

import {
  buildAdminUsersSearchFilter,
  groupMembershipsByUser,
  mapAdminUserListItems,
} from './admin-users.utils'
import { findMemberships } from './admin-users.repository.memberships'
import { ADMIN_USER_SELECT_FIELDS } from './admin-users.select'
import type { AdminUser, NormalizedAdminUserListQuery } from './admin-users.types'

export async function findUsers(filters: NormalizedAdminUserListQuery) {
  const client = getServiceClient()
  let query = client.from('users').select(ADMIN_USER_SELECT_FIELDS, {
    count: 'exact',
  })

  if (filters.search) query = query.or(buildAdminUsersSearchFilter(filters.search))
  if (filters.role) query = query.eq('cargo_rol', filters.role)

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
  if (users.length === 0) return { users: [], total: count ?? 0 }

  const memberships = await findMemberships(
    users.map((user) => user.id),
    true,
  )

  return {
    users: mapAdminUserListItems(users, groupMembershipsByUser(memberships)),
    total: count ?? 0,
  }
}
