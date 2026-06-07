export function applyProviderFilter<
  T extends {
    ilike: (column: string, pattern: string) => T
    or: (filters: string) => T
  }
>(
  query: T,
  provider: string
): T {
  if (provider === 'gemini') {
    return query.or('model_used.is.null,model_used.ilike.%gemini%')
  }

  return query
}
