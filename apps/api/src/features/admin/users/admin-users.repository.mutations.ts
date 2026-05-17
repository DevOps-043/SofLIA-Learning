import { DatabaseError } from '@/core/errors/app-error'
import { logger } from '@/core/logging/logger'
import { getServiceClient } from '@/core/supabase/service-client'

import {
  buildAdminUserRolePayload,
  buildAdminUserSoftDeletePayload,
  buildAdminUserUpdatePayload,
} from './admin-users.utils'
import { ADMIN_USER_SELECT_FIELDS } from './admin-users.select'
import type {
  AdminUser,
  AdminUserRoleUpdateInput,
  AdminUserUpdateInput,
} from './admin-users.types'

export async function updateUser(userId: string, input: AdminUserUpdateInput) {
  const client = getServiceClient()
  const { data, error } = await client
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

export async function updateUserRole(
  userId: string,
  input: AdminUserRoleUpdateInput,
) {
  const client = getServiceClient()
  const { data, error } = await client
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

export async function softDeleteUser(userId: string, reason: string) {
  const client = getServiceClient()
  const { data, error } = await client
    .from('users')
    .update(buildAdminUserSoftDeletePayload(reason))
    .eq('id', userId)
    .select('id, banned_at, ban_reason')
    .single()

  if (error || !data) {
    throw new DatabaseError('Error al desactivar el usuario', error)
  }

  await suspendActiveMemberships(userId)

  return {
    user_id: data.id,
    banned_at: data.banned_at ?? new Date().toISOString(),
    reason: data.ban_reason ?? reason,
  }
}

async function suspendActiveMemberships(userId: string) {
  const client = getServiceClient()

  try {
    const { error } = await client
      .from('organization_users')
      .update({ status: 'suspended' })
      .eq('user_id', userId)
      .eq('status', 'active')

    if (error) {
      logger.warn('No se pudieron suspender las membresias del usuario', {
        membershipError: error,
        userId,
      })
    }
  } catch (membershipError) {
    logger.warn('Fallo la suspension de membresias durante el soft delete', {
      membershipError,
      userId,
    })
  }
}
