export type LiaProvider = 'openai' | 'gemini' | 'all'

const PROVIDER_PATTERNS: Partial<Record<LiaProvider, string>> = {
  openai: 'gpt%',
  gemini: 'gemini%',
}

export function applyProviderFilter<
  T extends { ilike: (column: string, pattern: string) => T },
>(query: T, provider: string) {
  const pattern = PROVIDER_PATTERNS[provider as LiaProvider]
  return pattern ? query.ilike('model_used', pattern) : query
}
