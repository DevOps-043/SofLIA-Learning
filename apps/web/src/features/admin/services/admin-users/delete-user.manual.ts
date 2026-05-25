import {
  deleteEnrollmentDependencies,
  deleteScormDependencies,
} from './delete-user.dependencies'
import {
  executeNullUpdates,
  executeSimpleDeletes,
} from './delete-user.table-operations'
import type { AdminSupabaseClient } from './delete-user.types'

export async function deleteUserManually(
  adminSupabase: AdminSupabaseClient,
  userId: string,
) {
  await deleteEnrollmentDependencies(adminSupabase, userId)
  await deleteScormDependencies(adminSupabase, userId)
  await executeNullUpdates(adminSupabase, userId)
  await executeSimpleDeletes(adminSupabase, userId)

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

  const { data: checkUser } = await adminSupabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single()

  if (checkUser) {
    throw new Error(
      'El usuario no fue eliminado. Existen referencias en otras tablas que impiden la eliminacion.'
    )
  }
}
