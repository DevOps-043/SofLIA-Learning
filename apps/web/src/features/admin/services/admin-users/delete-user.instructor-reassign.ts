import { USER_REQUIRED_INSTRUCTOR_REFERENCE_TABLES } from './delete-user.config'
import { MISSING_TABLE_ERROR_CODES } from './delete-user.constants'
import {
  hasRequiredInstructorReferences,
  resolveInstructorReassignmentUserId,
} from './delete-user.instructor-lookup'
import type { AdminSupabaseClient } from './delete-user.types'

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

export async function prepareRequiredInstructorReferencesForDelete(
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
