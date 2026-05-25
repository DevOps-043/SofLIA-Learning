export function isTTSAbortError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  return error.name === 'AbortError' || error.message.includes('aborted')
}
