import { createClient } from '../../../../lib/supabase/server'
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
    return
  }

  await deleteUserManually(adminSupabase, userId)
}
