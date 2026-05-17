import { z } from 'zod'

export const dialogueRuntimeType = 'SOFLIA_DIALOGUE' as const

export const dialogueStateSchema = z.enum([
  'START',
  'ELICIT_RESPONSE',
  'EVALUATE_RESPONSE',
  'CHALLENGE_OR_PROBE',
  'HINT',
  'RESCUE',
  'COMPLETE',
  'FAIL_OR_RETRY',
  'SESSION_SUMMARY',
])

export type DialogueState = z.infer<typeof dialogueStateSchema>

export const terminalDialogueStates: DialogueState[] = [
  'COMPLETE',
  'FAIL_OR_RETRY',
  'SESSION_SUMMARY',
]

export function isTerminalDialogueState(state: DialogueState) {
  return terminalDialogueStates.includes(state)
}
