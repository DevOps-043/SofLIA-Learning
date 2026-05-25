import { USER_REQUIRED_INSTRUCTOR_REFERENCE_TABLES } from './delete-user.config'
import { MISSING_TABLE_ERROR_CODES } from './delete-user.constants'
import type { AdminSupabaseClient, UserIdRow } from './delete-user.types'

export async function hasRequiredInstructorReferences(
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

export async function resolveInstructorReassignmentUserId(
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
