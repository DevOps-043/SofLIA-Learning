import type { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

export interface FlexibleQueryResult<T> {
  data: T | null
  error: { code?: string; message: string } | null
}

export interface FlexibleBuilder {
  delete(): FlexibleBuilder
  eq(column: string, value: unknown): FlexibleBuilder
  in(column: string, values: readonly unknown[]): FlexibleBuilder
  insert(values: unknown): FlexibleBuilder
  is(column: string, value: unknown): FlexibleBuilder
  limit(count: number): FlexibleBuilder
  lt(column: string, value: unknown): FlexibleBuilder
  lte(column: string, value: unknown): FlexibleBuilder
  maybeSingle<T>(): PromiseLike<FlexibleQueryResult<T>>
  order(column: string, options?: { ascending?: boolean }): FlexibleBuilder
  returns<T>(): PromiseLike<FlexibleQueryResult<T>>
  select(columns?: string): FlexibleBuilder
  single<T>(): PromiseLike<FlexibleQueryResult<T>>
  update(values: unknown): FlexibleBuilder
  upsert(
    values: unknown,
    options?: { onConflict?: string; ignoreDuplicates?: boolean },
  ): FlexibleBuilder
}

/** Typed facade for tables and RPCs not yet present in generated DB types. */
export function flexibleFrom(
  client: AdminClient,
  table: string,
): FlexibleBuilder {
  return (client as unknown as { from(name: string): FlexibleBuilder }).from(
    table,
  )
}
