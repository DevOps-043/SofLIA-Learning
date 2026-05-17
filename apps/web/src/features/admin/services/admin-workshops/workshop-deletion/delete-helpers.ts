import { fromLoose } from '@/lib/supabase/looseQuery'
import { buildDeletionError, isMissingRelationError } from './errors'
import type { DeleteOperationResult, SupabaseClient, TableDeleteOptions } from './types'

export async function executeDelete(
  label: string,
  operation: DeleteOperationResult,
  options: TableDeleteOptions = {},
): Promise<void> {
  const { error } = await operation
  if (!error) return
  if (options.ignoreMissingRelation && isMissingRelationError(error)) return
  throw buildDeletionError(`No se pudieron eliminar ${label}`, error)
}

export async function deleteByEq(
  supabase: SupabaseClient,
  tableName: string,
  column: string,
  value: string,
  options: TableDeleteOptions = {},
): Promise<void> {
  await executeDelete(
    options.label || `los registros de ${tableName}`,
    fromLoose(supabase, tableName).delete().eq(column, value),
    options,
  )
}

export function deleteOptionalByEq(
  supabase: SupabaseClient,
  tableName: string,
  column: string,
  value: string,
  options: TableDeleteOptions = {},
): Promise<void> {
  return deleteByEq(supabase, tableName, column, value, { ...options, ignoreMissingRelation: true })
}

export async function deleteByIn(
  supabase: SupabaseClient,
  tableName: string,
  column: string,
  values: string[],
  options: TableDeleteOptions = {},
): Promise<void> {
  if (!values.length) return
  await executeDelete(
    options.label || `los registros de ${tableName}`,
    fromLoose(supabase, tableName).delete().in(column, values),
    options,
  )
}

export function deleteOptionalByIn(
  supabase: SupabaseClient,
  tableName: string,
  column: string,
  values: string[],
  options: TableDeleteOptions = {},
): Promise<void> {
  return deleteByIn(supabase, tableName, column, values, { ...options, ignoreMissingRelation: true })
}

export async function deleteContentTranslations(
  supabase: SupabaseClient,
  entityType: 'course' | 'module' | 'lesson' | 'activity' | 'material',
  entityIds: string[],
): Promise<void> {
  if (!entityIds.length) return

  await executeDelete(
    `las traducciones de ${entityType}`,
    fromLoose(supabase, 'content_translations')
      .delete()
      .eq('entity_type', entityType)
      .in('entity_id', entityIds),
    { ignoreMissingRelation: true },
  )
}
