export interface ErrorWithDigest {
  digest: string
}

export function hasDigest(error: unknown): error is ErrorWithDigest {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as ErrorWithDigest).digest === 'string'
  )
}

export function getUnknownErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export function getUnknownErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined
}
