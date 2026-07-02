export type DialogueRuntimeErrorCode =
  | 'DIALOGUE_CONFIG_INVALID'
  | 'DIALOGUE_SESSION_NOT_FOUND'
  | 'DIALOGUE_SESSION_CLOSED'
  | 'DIALOGUE_ATTEMPT_LIMIT_REACHED'
  | 'DIALOGUE_EVALUATION_FAILED'
  | 'DIALOGUE_EVALUATION_UNAVAILABLE'
  | 'DIALOGUE_TUTOR_FAILED'
  | 'DIALOGUE_PERSISTENCE_FAILED'

export class DialogueRuntimeError extends Error {
  constructor(
    public readonly code: DialogueRuntimeErrorCode,
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'DialogueRuntimeError'
  }
}
