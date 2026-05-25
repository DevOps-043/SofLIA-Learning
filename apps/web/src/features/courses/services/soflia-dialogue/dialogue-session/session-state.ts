import {
  dialogueActivityConfigSchema,
  type DialogueState,
} from '../../../types/dialogue-runtime'

export const activeDialogueStates: DialogueState[] = [
  'START',
  'ELICIT_RESPONSE',
  'EVALUATE_RESPONSE',
  'CHALLENGE_OR_PROBE',
  'HINT',
  'RESCUE',
]

export function normalizeSessionState(value: string): DialogueState {
  const parsed = dialogueActivityConfigSchema.shape
  void parsed

  const allowed: DialogueState[] = [
    'START',
    'ELICIT_RESPONSE',
    'EVALUATE_RESPONSE',
    'CHALLENGE_OR_PROBE',
    'HINT',
    'RESCUE',
    'COMPLETE',
    'FAIL_OR_RETRY',
    'SESSION_SUMMARY',
  ]

  return allowed.includes(value as DialogueState)
    ? (value as DialogueState)
    : 'START'
}
