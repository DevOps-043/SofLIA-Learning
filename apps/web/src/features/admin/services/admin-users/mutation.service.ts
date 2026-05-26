import crypto from 'crypto'
import { createClient } from '../../../../lib/supabase/server'
import { AuditLogService } from '../auditLog.service'
import { createAdminClient } from './client'
import {
  createSupabaseAuthUserWithLegacyId,
  deleteSupabaseAuthUser,
} from '@/features/auth/services/supabase-auth-bridge.service'
import {
  ADMIN_USER_SELECT_FIELDS,
  buildAdminUserInsertPayload,
  buildAdminUserUpdatePayload,
  mapAdminUserWithAge,
  mapAdminUserCreateError,
  omitDemographicsFromAudit,
} from './helpers'
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';
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
    .select(SELECT_COLUMNS.users)
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
    old_values: omitDemographicsFromAudit(
      oldData as unknown as Record<string, unknown>,
    ),
    new_values: omitDemographicsFromAudit(
      userData as unknown as Record<string, unknown>,
    ),
    ip_address: requestInfo?.ip,
    user_agent: requestInfo?.userAgent,
  })

  return mapAdminUserWithAge(data as AdminUser)
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
    const userId = crypto.randomUUID()
    await createSupabaseAuthUserWithLegacyId({
      cargo_rol: userData.cargo_rol,
      display_name: userData.display_name || null,
      email: userData.email,
      email_verified: true,
      first_name: userData.first_name || null,
      id: userId,
      last_name: userData.last_name || null,
      password: userData.password,
      profile_picture_url: userData.profile_picture_url || null,
      username: userData.username,
    })

    const { data, error } = await adminSupabase
      .from('users')
      .upsert(buildAdminUserInsertPayload(userId, userData), { onConflict: 'id' })
      .select(ADMIN_USER_SELECT_FIELDS)
      .single()

    if (error) {
      await deleteSupabaseAuthUser(userId)
      throw error
    }

    await AuditLogService.logAction({
      user_id: data.id,
      admin_user_id: adminUserId,
      action: 'CREATE',
      table_name: 'users',
      record_id: data.id,
      old_values: undefined,
      new_values: omitDemographicsFromAudit(
        userData as unknown as Record<string, unknown>,
      ),
      ip_address: requestInfo?.ip,
      user_agent: requestInfo?.userAgent,
    })

    return mapAdminUserWithAge(data as AdminUser)
  } catch (error) {
    const mappedError = mapAdminUserCreateError(error)
    if (mappedError) {
      throw new Error(mappedError)
    }

    throw error
  }
}
