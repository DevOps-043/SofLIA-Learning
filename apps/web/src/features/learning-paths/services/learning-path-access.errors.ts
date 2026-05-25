import type { QueryLikeError } from './learning-path-access.types'

export function isMissingLearningPathInfrastructureError(
  error: QueryLikeError | null | undefined,
) {
  if (!error) return false

  const combined = `${error.code || ''} ${error.message || ''} ${error.details || ''}`.toLowerCase()

  return (
    error.code === '42P01' ||
    combined.includes('does not exist') ||
    combined.includes('relation') ||
    combined.includes('learning_path')
  )
}
