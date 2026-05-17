import {
  USER_NULL_UPDATE_TABLES,
  USER_SIMPLE_DELETE_TABLES,
} from './delete-user.config'
import { MISSING_TABLE_ERROR_CODES } from './delete-user.constants'
import type { AdminSupabaseClient } from './delete-user.types'

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

export async function executeSimpleDeletes(
  adminSupabase: AdminSupabaseClient,
  userId: string,
) {
  for (const config of USER_SIMPLE_DELETE_TABLES) {
    await deleteFromTable(adminSupabase, config.tableName, userId, config.column)
  }
}

export async function executeNullUpdates(
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
