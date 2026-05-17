import type { StudySessionsRow } from './study-sessions.row'
import type { StudySessionsInsert } from './study-sessions.insert'
import type { StudySessionsUpdate } from './study-sessions.update'
import type { StudySessionsRelationships } from './study-sessions.relationships'

export type StudySessionsTable = {
  Row: StudySessionsRow
  Insert: StudySessionsInsert
  Update: StudySessionsUpdate
  Relationships: StudySessionsRelationships
}
