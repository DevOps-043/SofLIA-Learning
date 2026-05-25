export const MAX_DIALOGUE_ACTIVITY_ATTEMPTS = 3

export type DialogueAttemptDecision =
  | {
      kind: 'can_create'
      attemptNumber: number
    }
  | {
      kind: 'limit_reached'
    }

export function resolveDialogueAttempt(
  existingSessionCount: number,
  maxAttempts = MAX_DIALOGUE_ACTIVITY_ATTEMPTS,
): DialogueAttemptDecision {
  if (existingSessionCount >= maxAttempts) {
    return { kind: 'limit_reached' }
  }

  return {
    kind: 'can_create',
    attemptNumber: existingSessionCount + 1,
  }
}
