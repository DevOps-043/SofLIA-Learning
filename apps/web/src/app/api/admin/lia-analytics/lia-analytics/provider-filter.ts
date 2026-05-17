export function applyProviderFilter<T extends { ilike: (column: string, pattern: string) => T }>(
  query: T,
  provider: string
): T {
  if (provider === 'openai') {
    return query.ilike('model_used', 'gpt%')
  }

  if (provider === 'gemini') {
    return query.ilike('model_used', 'gemini%')
  }

  return query
}
