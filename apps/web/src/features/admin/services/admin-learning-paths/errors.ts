import type { SupabaseMutationError } from './rows'

export function normalizeSlug(value: string | null | undefined) {
  if (!value) return null

  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function isMissingLearningPathAssignmentMetadataError(error: unknown) {
  if (!error || typeof error !== 'object') return false

  const candidate = error as { code?: string; message?: string; details?: string; hint?: string }
  const text = [candidate.message, candidate.details, candidate.hint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return (
    candidate.code === '42703' ||
    text.includes('assignment_source') ||
    text.includes('default_rule_id')
  )
}

export function buildLearningPathMutationErrorMessage(
  error: SupabaseMutationError,
  fallbackMessage: string,
) {
  if (!error) return fallbackMessage

  if (error.code === '23505') {
    return 'Ya existe un learning path con ese slug'
  }

  if (error.code === '23503') {
    return 'No se pudo asociar el learning path con el administrador actual'
  }

  return error.message || error.details || fallbackMessage
}
