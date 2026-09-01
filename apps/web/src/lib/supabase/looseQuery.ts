type LoosePrimitive = string | number | boolean | null

type LooseQueryError = {
  message: string
  code?: string
  details?: string
  hint?: string
}

type LooseSelectOptions = {
  count?: 'exact' | 'planned' | 'estimated'
  head?: boolean
}

type LooseQueryResult<T> = {
  data: T[] | null
  error: LooseQueryError | null
  count?: number | null
}

type LooseSingleQueryResult<T> = {
  data: T | null
  error: LooseQueryError | null
  count?: number | null
}

type LooseMutationResult = {
  data: null
  error: LooseQueryError | null
}

export interface LooseQueryChain<T> extends Promise<LooseQueryResult<T>> {
  eq(column: string, value: LoosePrimitive): LooseQueryChain<T>
  is(column: string, value: LoosePrimitive): LooseQueryChain<T>
  neq(column: string, value: LoosePrimitive): LooseQueryChain<T>
  ilike(column: string, value: string): LooseQueryChain<T>
  in(column: string, values: readonly LoosePrimitive[]): LooseQueryChain<T>
  gt(column: string, value: string | number): LooseQueryChain<T>
  lt(column: string, value: string | number): LooseQueryChain<T>
  gte(column: string, value: string | number): LooseQueryChain<T>
  lte(column: string, value: string | number): LooseQueryChain<T>
  not(
    column: string,
    operator: string,
    value: LoosePrimitive | string
  ): LooseQueryChain<T>
  or(filters: string): LooseQueryChain<T>
  order(column: string, options: { ascending: boolean }): LooseQueryChain<T>
  range(from: number, to: number): LooseQueryChain<T>
  limit(count: number): LooseQueryChain<T>
  single(): PromiseLike<LooseSingleQueryResult<T>>
  maybeSingle(): PromiseLike<LooseSingleQueryResult<T>>
}

export interface LooseMutationChain<T> extends Promise<LooseMutationResult> {
  eq(column: string, value: LoosePrimitive): LooseMutationChain<T>
  is(column: string, value: LoosePrimitive): LooseMutationChain<T>
  neq(column: string, value: LoosePrimitive): LooseMutationChain<T>
  ilike(column: string, value: string): LooseMutationChain<T>
  in(column: string, values: readonly LoosePrimitive[]): LooseMutationChain<T>
  lte(column: string, value: string | number): LooseMutationChain<T>
  not(
    column: string,
    operator: string,
    value: LoosePrimitive | string
  ): LooseMutationChain<T>
  select(query?: string): LooseQueryChain<T>
}

export interface LooseMutableTable<TRead, TWrite = Partial<TRead>> {
  select(query: string, options?: LooseSelectOptions): LooseQueryChain<TRead>
  insert(values: TWrite | TWrite[]): LooseMutationChain<TRead>
  upsert(
    values: TWrite | TWrite[],
    options?: { onConflict?: string; ignoreDuplicates?: boolean }
  ): LooseMutationChain<TRead>
  update(values: Partial<TWrite>): LooseMutationChain<TRead>
  delete(): LooseMutationChain<TRead>
}

export function fromLoose<TRead, TWrite = Partial<TRead>>(
  client: unknown,
  relation: string
): LooseMutableTable<TRead, TWrite> {
  return (client as { from: (table: string) => LooseMutableTable<TRead, TWrite> }).from(relation)
}
