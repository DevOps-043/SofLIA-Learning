import { fromLoose } from '@/lib/supabase/looseQuery'
import { buildDeletionError, isMissingRelationError } from './errors'
import type { SupabaseClient, TableSelectOptions } from './types'

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

  if (error) {
    if (options.ignoreMissingRelation && isMissingRelationError(error)) return []
    throw buildDeletionError(errorMessage, error)
  }

  return uniqIds((data || []).map((row) => row[idColumn] || ''))
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

  if (error) {
    if (options.ignoreMissingRelation && isMissingRelationError(error)) return []
    throw buildDeletionError(errorMessage, error)
  }

  return uniqIds((data || []).map((row) => row[idColumn] || ''))
}

export function uniqIds(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}
