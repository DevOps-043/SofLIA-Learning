import { createClient } from '../../../../lib/supabase/server'
import { deleteSupabaseAuthUser } from '@/features/auth/services/supabase-auth-bridge.service'
import { SELECT_COLUMNS } from '../../../../lib/supabase/select-types'
import { createAdminClient } from './client'
import { logUserDeleteAttempt } from './delete-user.audit'
import { prepareRequiredInstructorReferencesForDelete } from './delete-user.instructor-reassign'
import { deleteUserManually } from './delete-user.manual'
import { deleteUserViaRpc } from './delete-user.rpc'
import type { AdminUserRequestInfo } from './types'

export async function deleteAdminUser(
  userId: string,
  adminUserId: string,
  requestInfo?: AdminUserRequestInfo,
) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  const { data: userData } = await supabase
    .from('users')
    .select(SELECT_COLUMNS.users)
    .eq('id', userId)
    .single()

  if (!userData) {
    throw new Error('Usuario no encontrado')
  }

  await logUserDeleteAttempt(userId, adminUserId, userData, requestInfo)

  await prepareRequiredInstructorReferencesForDelete(
    adminSupabase,
    userId,
    adminUserId,
  )

  const deletedViaRpc = await deleteUserViaRpc(adminSupabase, userId)
  if (deletedViaRpc) {
    await deleteSupabaseAuthUser(userId)
    return
  }

  await deleteUserManually(adminSupabase, userId)
  await deleteSupabaseAuthUser(userId)
}
