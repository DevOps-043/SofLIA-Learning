import { deleteByEq, deleteByIn, deleteOptionalByEq, deleteOptionalByIn } from './delete-helpers'
import type { SupabaseClient } from './types'

type DeleteByInSpec = { table: string; column: string; values: string[]; label: string; optional?: boolean; ignoreMissingRelation?: boolean }
type DeleteByEqSpec = { table: string; column: string; value: string; label: string; optional?: boolean; ignoreMissingRelation?: boolean }

export async function deleteByInBatch(supabase: SupabaseClient, specs: DeleteByInSpec[]) {
  for (const spec of specs) {
    const options = { label: spec.label, ignoreMissingRelation: spec.ignoreMissingRelation }
    if (spec.optional) await deleteOptionalByIn(supabase, spec.table, spec.column, spec.values, options)
    else await deleteByIn(supabase, spec.table, spec.column, spec.values, options)
  }
}

export async function deleteByEqBatch(supabase: SupabaseClient, specs: DeleteByEqSpec[]) {
  for (const spec of specs) {
    const options = { label: spec.label, ignoreMissingRelation: spec.ignoreMissingRelation }
    if (spec.optional) await deleteOptionalByEq(supabase, spec.table, spec.column, spec.value, options)
    else await deleteByEq(supabase, spec.table, spec.column, spec.value, options)
  }
}
