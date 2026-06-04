export class TTSQuotaExceededError extends Error {
  constructor(message = 'TTS quota exceeded') {
    super(message)
    this.name = 'TTSQuotaExceededError'
  }
}

export function isTTSAbortError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  return error.name === 'AbortError' || error.message.includes('aborted')
}

export function isTTSQuotaExceededError(error: unknown): boolean {
  return error instanceof Error && error.name === 'TTSQuotaExceededError'
}
