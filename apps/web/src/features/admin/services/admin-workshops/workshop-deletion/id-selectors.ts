import { fromLoose } from '@/lib/supabase/looseQuery'
import { buildDeletionError, isMissingRelationError } from './errors'
import type { SupabaseClient, TableSelectOptions } from './types'

export function uniqIds(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

export async function selectIdsByEq(
  supabase: SupabaseClient,
  tableName: string,
  idColumn: string,
  filterColumn: string,
  filterValue: string,
  errorMessage: string,
  options: TableSelectOptions = {},
): Promise<string[]> {
  const { data, error } = await fromLoose<Record<string, string | null | undefined>>(
    supabase,
    tableName,
  )
    .select(idColumn)
    .eq(filterColumn, filterValue)

  if (!error) return uniqIds((data || []).map((row) => row[idColumn] || ''))
  if (options.ignoreMissingRelation && isMissingRelationError(error)) return []
  throw buildDeletionError(errorMessage, error)
}

export async function selectIdsByIn(
  supabase: SupabaseClient,
  tableName: string,
  idColumn: string,
  filterColumn: string,
  filterValues: string[],
  errorMessage: string,
  options: TableSelectOptions = {},
): Promise<string[]> {
  if (!filterValues.length) return []

  const { data, error } = await fromLoose<Record<string, string | null | undefined>>(
    supabase,
    tableName,
  )
    .select(idColumn)
    .in(filterColumn, filterValues)

  if (!error) return uniqIds((data || []).map((row) => row[idColumn] || ''))
  if (options.ignoreMissingRelation && isMissingRelationError(error)) return []
  throw buildDeletionError(errorMessage, error)
}
