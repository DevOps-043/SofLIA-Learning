import { createClient } from '../../../../lib/supabase/server'
import { AuditLogService } from '../auditLog.service'
import { createAdminClient } from './client'
import {
  USER_REQUIRED_INSTRUCTOR_REFERENCE_TABLES,
  USER_NULL_UPDATE_TABLES,
  USER_SIMPLE_DELETE_TABLES,
} from './delete-user.config'
import type { AdminUserRequestInfo } from './types'

type AdminSupabaseClient = ReturnType<typeof createAdminClient>

interface UserIdRow {
  id: string
}

const MISSING_TABLE_ERROR_CODES = new Set(['42P01', 'PGRST204', 'PGRST116'])

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

  if (error && !MISSING_TABLE_ERROR_CODES.has(error.code)) {
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

  if (error && !MISSING_TABLE_ERROR_CODES.has(error.code)) {
    console.warn(`Error actualizando ${tableName}.${column}:`, error.message)
  }
}

async function hasRequiredInstructorReferences(
  adminSupabase: AdminSupabaseClient,
  userId: string,
) {
  for (const tableName of USER_REQUIRED_INSTRUCTOR_REFERENCE_TABLES) {
    const { data, error } = await adminSupabase
      .from(tableName as never)
      .select('lesson_id')
      .eq('instructor_id' as never, userId)
      .limit(1)

    if (error) {
      if (MISSING_TABLE_ERROR_CODES.has(error.code)) {
        continue
      }

      throw new Error(
        `No se pudieron validar referencias de instructor en ${tableName}: ${error.message}`,
      )
    }

    if (data?.length) {
      return true
    }
  }

  return false
}

async function resolveInstructorReassignmentUserId(
  adminSupabase: AdminSupabaseClient,
  targetUserId: string,
  adminUserId: string,
) {
  if (adminUserId !== targetUserId) {
    const { data: adminUser } = await adminSupabase
      .from('users')
      .select('id')
      .eq('id', adminUserId)
      .maybeSingle<UserIdRow>()

    if (adminUser?.id) {
      return adminUser.id
    }
  }

  const { data: fallbackUser, error } = await adminSupabase
    .from('users')
    .select('id')
    .neq('id', targetUserId)
    .in('cargo_rol', ['Administrador', 'Instructor'])
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle<UserIdRow>()

  if (error) {
    throw new Error(
      `No se pudo buscar un instructor sustituto para las lecciones: ${error.message}`,
    )
  }

  if (!fallbackUser?.id) {
    throw new Error(
      'No se puede eliminar el usuario porque es instructor de lecciones y no existe un administrador o instructor sustituto para reasignarlas.',
    )
  }

  return fallbackUser.id
}

async function reassignRequiredInstructorReferences(
  adminSupabase: AdminSupabaseClient,
  targetUserId: string,
  replacementUserId: string,
) {
  for (const tableName of USER_REQUIRED_INSTRUCTOR_REFERENCE_TABLES) {
    const { error } = await adminSupabase
      .from(tableName as never)
      .update({ instructor_id: replacementUserId } as never)
      .eq('instructor_id' as never, targetUserId)

    if (error && !MISSING_TABLE_ERROR_CODES.has(error.code)) {
      throw new Error(
        `No se pudieron reasignar las lecciones de ${tableName}: ${error.message}`,
      )
    }
  }
}

async function prepareRequiredInstructorReferencesForDelete(
  adminSupabase: AdminSupabaseClient,
  targetUserId: string,
  adminUserId: string,
) {
  const mustReassignReferences = await hasRequiredInstructorReferences(
    adminSupabase,
    targetUserId,
  )

  if (!mustReassignReferences) {
    return
  }

  const replacementUserId = await resolveInstructorReassignmentUserId(
    adminSupabase,
    targetUserId,
    adminUserId,
  )

  await reassignRequiredInstructorReferences(
    adminSupabase,
    targetUserId,
    replacementUserId,
  )
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

  await prepareRequiredInstructorReferencesForDelete(
    adminSupabase,
    userId,
    adminUserId,
  )

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
