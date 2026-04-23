import { fromLoose } from '@/lib/supabase/looseQuery'
import { buildDeletionError, isMissingRelationError } from './errors'
import type {
  DeleteEqPlan,
  DeleteInPlan,
  DeleteOperationResult,
  SupabaseClient,
  TableDeleteOptions,
} from './types'

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

export async function runDeleteEqPlans(supabase: SupabaseClient, plans: DeleteEqPlan[]) {
  for (const plan of plans) {
    const options = { label: plan.label, ignoreMissingRelation: true }
    await deleteByEq(supabase, plan.tableName, plan.column, plan.value, plan.required ? { label: plan.label } : options)
  }
}

export async function runDeleteInPlans(supabase: SupabaseClient, plans: DeleteInPlan[]) {
  for (const plan of plans) {
    const options = { label: plan.label, ignoreMissingRelation: true }
    await deleteByIn(supabase, plan.tableName, plan.column, plan.values, plan.required ? { label: plan.label } : options)
  }
}

async function executeDelete(
  label: string,
  operation: DeleteOperationResult,
  options: TableDeleteOptions = {},
): Promise<void> {
  const { error } = await operation

  if (!error) return
  if (options.ignoreMissingRelation && isMissingRelationError(error)) return

  throw buildDeletionError(`No se pudieron eliminar ${label}`, error)
}
