type StatsQueryResult<TRow> = {
  count: number | null
  data: TRow[] | null
  error: unknown | null
}

type StatsQuery<TRow> = PromiseLike<StatsQueryResult<TRow>> & {
  eq(column: string, value: boolean | number | string): StatsQuery<TRow>
  gte(column: string, value: string): StatsQuery<TRow>
  limit(count: number): StatsQuery<TRow>
  order(column: string, options?: { ascending?: boolean }): StatsQuery<TRow>
}

type StatsTable<TRow> = {
  select(columns: string, options?: { count?: 'exact'; head?: boolean }): StatsQuery<TRow>
}

type StatsSupabaseClient = {
  from<TRow>(table: string): StatsTable<TRow>
}

export function statsTable<TRow>(supabase: unknown, table: string): StatsTable<TRow> {
  return (supabase as StatsSupabaseClient).from<TRow>(table)
}
