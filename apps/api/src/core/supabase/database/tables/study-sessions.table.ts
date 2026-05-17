import type { StudySessionRow } from './study-sessions.fields'
import type {
  StudySessionInsert,
  StudySessionUpdate,
} from './study-sessions.mutations'

export type StudySessionsTable = {
  Row: StudySessionRow
  Insert: StudySessionInsert
  Update: StudySessionUpdate
  Relationships: []
}
