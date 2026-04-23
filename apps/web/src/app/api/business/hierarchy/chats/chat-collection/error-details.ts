export type ErrorWithDetails = {
  message?: string
  stack?: string
  name?: string
}

export function getErrorDetails(error: unknown): ErrorWithDetails {
  if (error && typeof error === 'object') return error as ErrorWithDetails
  return {}
}
