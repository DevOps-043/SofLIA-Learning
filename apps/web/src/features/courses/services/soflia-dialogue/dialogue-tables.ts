import { fromLoose } from '@/lib/supabase/looseQuery'

import type {
  DialogueEvaluationRow,
  DialogueResultRow,
  DialogueSessionRow,
  DialogueTurnRow,
  LooseWriteRow,
} from './dialogue-table-rows'

export type {
  DialogueEvaluationRow,
  DialogueResultRow,
  DialogueSessionRow,
  DialogueTurnRow,
  LooseWriteRow,
} from './dialogue-table-rows'

export function dialogueSessionsTable(client: unknown) {
  return fromLoose<DialogueSessionRow, LooseWriteRow>(
    client,
    'soflia_dialogue_sessions',
  )
}

export function dialogueTurnsTable(client: unknown) {
  return fromLoose<DialogueTurnRow, LooseWriteRow>(
    client,
    'soflia_dialogue_turns',
  )
}

export function dialogueEvaluationsTable(client: unknown) {
  return fromLoose<DialogueEvaluationRow, LooseWriteRow>(
    client,
    'soflia_dialogue_evaluations',
  )
}

export function dialogueResultsTable(client: unknown) {
  return fromLoose<DialogueResultRow, LooseWriteRow>(
    client,
    'soflia_dialogue_results',
  )
}

export function dialogueEventsTable(client: unknown) {
  return fromLoose<Record<string, unknown>, LooseWriteRow>(
    client,
    'soflia_dialogue_events',
  )
}
