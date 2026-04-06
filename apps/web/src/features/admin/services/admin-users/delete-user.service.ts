import { createClient } from '../../../../lib/supabase/server'
import { AuditLogService } from '../auditLog.service'
import { createAdminClient } from './client'
import {
  USER_NULL_UPDATE_TABLES,
  USER_SIMPLE_DELETE_TABLES,
} from './delete-user.config'
import type { AdminUserRequestInfo } from './types'

type AdminSupabaseClient = ReturnType<typeof createAdminClient>

async function deleteFromTable(
  adminSupabase: AdminSupabaseClient,
  tableName: string,
  userId: string,
  column = 'user_id',
) {
  const { error } = await adminSupabase
    .from(tableName as never)
    .delete()
    .eq(column as never, userId)

  if (error && error.code !== '42P01' && error.code !== 'PGRST204') {
    console.warn(`Error eliminando de ${tableName}:`, error.message)
  }
}

async function updateTableReferenceToNull(
  adminSupabase: AdminSupabaseClient,
  tableName: string,
  column: string,
  userId: string,
) {
  const { error } = await adminSupabase
    .from(tableName as never)
    .update({ [column]: null } as never)
    .eq(column as never, userId)

  if (error && error.code !== '42P01' && error.code !== 'PGRST204') {
    console.warn(`Error actualizando ${tableName}.${column}:`, error.message)
  }
}

async function deleteEnrollmentDependencies(
  adminSupabase: AdminSupabaseClient,
  userId: string,
) {
  const { data: enrollments } = await adminSupabase
    .from('user_course_enrollments')
    .select('enrollment_id')
    .eq('user_id', userId)

  const enrollmentIds =
    (enrollments || []).map(
      (e: { enrollment_id: string }) => e.enrollment_id,
    )

  if (!enrollmentIds.length) {
    return
  }

  await adminSupabase
    .from('user_lesson_progress')
    .delete()
    .in('enrollment_id', enrollmentIds)

  await adminSupabase
    .from('user_quiz_submissions')
    .delete()
    .in('enrollment_id', enrollmentIds)

  await adminSupabase
    .from('user_course_certificates')
    .delete()
    .in('enrollment_id', enrollmentIds)
}

async function deleteScormDependencies(
  adminSupabase: AdminSupabaseClient,
  userId: string,
) {
  const { data: scormAttempts } = await adminSupabase
    .from('scorm_attempts')
    .select('id')
    .eq('user_id', userId)

  if (!scormAttempts?.length) {
    return
  }

  const attemptIds = scormAttempts.map((a: { id: string }) => a.id)

  await adminSupabase
    .from('scorm_interactions')
    .delete()
    .in('attempt_id', attemptIds)

  await adminSupabase
    .from('scorm_objectives')
    .delete()
    .in('attempt_id', attemptIds)

  await adminSupabase
    .from('scorm_attempts')
    .delete()
    .eq('user_id', userId)
}

async function executeSimpleDeletes(
  adminSupabase: AdminSupabaseClient,
  userId: string,
) {
  for (const config of USER_SIMPLE_DELETE_TABLES) {
    await deleteFromTable(adminSupabase, config.tableName, userId, config.column)
  }
}

async function executeNullUpdates(
  adminSupabase: AdminSupabaseClient,
  userId: string,
) {
  for (const config of USER_NULL_UPDATE_TABLES) {
    await updateTableReferenceToNull(
      adminSupabase,
      config.tableName,
      config.column || 'user_id',
      userId,
    )
  }
}

async function deleteUserViaRpc(
  adminSupabase: AdminSupabaseClient,
  userId: string,
) {
  const rpcClient = adminSupabase as unknown as {
    rpc: (
      fn: string,
      args: { target_user_id: string },
    ) => Promise<{ data: unknown; error: unknown | null }>
  }

  const { error } = await rpcClient.rpc('delete_user_cascade', {
    target_user_id: userId,
  })

  return !error
}

export async function deleteAdminUser(
  userId: string,
  adminUserId: string,
  requestInfo?: AdminUserRequestInfo,
) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (!userData) {
    throw new Error('Usuario no encontrado')
  }

  try {
    await AuditLogService.logAction({
      user_id: userId,
      admin_user_id: adminUserId,
      action: 'DELETE',
      table_name: 'users',
      record_id: userId,
      old_values: (userData as unknown as Record<string, unknown>) || undefined,
      new_values: undefined,
      ip_address: requestInfo?.ip,
      user_agent: requestInfo?.userAgent,
    })
  } catch {
    // Audit log failure should not block deletion
  }

  // Intentar con la función RPC primero (más eficiente y atómica)
  const deletedViaRpc = await deleteUserViaRpc(adminSupabase, userId)
  if (deletedViaRpc) {
    return
  }

  // Fallback: eliminación manual tabla por tabla
  await deleteEnrollmentDependencies(adminSupabase, userId)
  await deleteScormDependencies(adminSupabase, userId)
  await executeNullUpdates(adminSupabase, userId)
  await executeSimpleDeletes(adminSupabase, userId)

  // Eliminar el usuario - este paso DEBE funcionar
  const { error: deleteError } = await adminSupabase
    .from('users')
    .delete()
    .eq('id', userId)

  if (deleteError) {
    throw new Error(
      `No se pudo eliminar el usuario: ${deleteError.message}. ` +
      `Posibles referencias pendientes en otras tablas.`
    )
  }

  // Verificar que realmente se eliminó
  const { data: checkUser } = await adminSupabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single()

  if (checkUser) {
    throw new Error(
      'El usuario no fue eliminado. Existen referencias en otras tablas que impiden la eliminación.'
    )
  }
}
