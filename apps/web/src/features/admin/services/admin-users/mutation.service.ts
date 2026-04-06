import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { createClient } from '../../../../lib/supabase/server'
import { AuditLogService } from '../auditLog.service'
import { createAdminClient } from './client'
import {
  ADMIN_USER_SELECT_FIELDS,
  buildAdminUserInsertPayload,
  buildAdminUserUpdatePayload,
  mapAdminUserCreateError,
} from './helpers'
import type {
  AdminUser,
  AdminUserCreateInput,
  AdminUserRequestInfo,
} from './types'

export async function updateAdminUser(
  userId: string,
  userData: Partial<AdminUser>,
  adminUserId: string,
  requestInfo?: AdminUserRequestInfo,
): Promise<AdminUser> {
  const adminSupabase = createAdminClient()
  const { data: oldData } = await adminSupabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  const { data, error } = await adminSupabase
    .from('users')
    .update(buildAdminUserUpdatePayload(userData))
    .eq('id', userId)
    .select(ADMIN_USER_SELECT_FIELDS)
    .single()

  if (error) {
    throw error
  }

  await AuditLogService.logAction({
    user_id: userId,
    admin_user_id: adminUserId,
    action: 'UPDATE',
    table_name: 'users',
    record_id: userId,
    old_values: (oldData as unknown as Record<string, unknown>) || undefined,
    new_values: userData as unknown as Record<string, unknown>,
    ip_address: requestInfo?.ip,
    user_agent: requestInfo?.userAgent,
  })

  return data as AdminUser
}

export async function updateAdminUserRole(userId: string, newRole: string) {
  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase
    .from('users')
    .update({ cargo_rol: newRole })
    .eq('id', userId)

  if (error) {
    throw error
  }
}

export async function createAdminUser(
  userData: AdminUserCreateInput,
  adminUserId: string,
  requestInfo?: AdminUserRequestInfo,
): Promise<AdminUser> {
  const adminSupabase = createAdminClient()

  try {
    const passwordHash = await bcrypt.hash(userData.password, 12)
    const userId = crypto.randomUUID()

    const { data, error } = await adminSupabase
      .from('users')
      .insert(buildAdminUserInsertPayload(userId, userData, passwordHash))
      .select(ADMIN_USER_SELECT_FIELDS)
      .single()

    if (error) {
      throw error
    }

    await AuditLogService.logAction({
      user_id: data.id,
      admin_user_id: adminUserId,
      action: 'CREATE',
      table_name: 'users',
      record_id: data.id,
      old_values: undefined,
      new_values: userData as unknown as Record<string, unknown>,
      ip_address: requestInfo?.ip,
      user_agent: requestInfo?.userAgent,
    })

    return data as AdminUser
  } catch (error) {
    const mappedError = mapAdminUserCreateError(error)
    if (mappedError) {
      throw new Error(mappedError)
    }

    throw error
  }
}
