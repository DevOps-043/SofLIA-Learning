import { DatabaseError } from '@/core/errors/app-error'
import { getServiceClient } from '@/core/supabase/service-client'

import { groupMembershipsByUser } from './admin-users.utils'
import { findMemberships } from './admin-users.repository.memberships'
import { ADMIN_USER_SELECT_FIELDS } from './admin-users.select'
import type { AdminUser, AdminUserDetail } from './admin-users.types'

export async function findById(userId: string) {
  const client = getServiceClient()
  const { data, error } = await client
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

  const memberships = await findMemberships([userId], false)

  return {
    ...(data as AdminUser),
    memberships: groupMembershipsByUser(memberships).get(userId) ?? [],
  } satisfies AdminUserDetail
}
