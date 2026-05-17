export function isQuizLikeContent(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  const record = value as Record<string, unknown>
  return Array.isArray(record.questions) || Array.isArray(record.items)
}
