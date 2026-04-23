import type { SupabaseMutationError } from './learning-path-row.types'

export function normalizeSlug(value: string | null | undefined) {
  if (!value) return null

  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildLearningPathMutationErrorMessage(
  error: SupabaseMutationError,
  fallbackMessage: string,
) {
  if (!error) return fallbackMessage
  if (error.code === '23505') return 'Ya existe un learning path con ese slug'
  if (error.code === '23503') {
    return 'No se pudo asociar el learning path con el administrador actual'
  }

  return error.message || error.details || fallbackMessage
}
