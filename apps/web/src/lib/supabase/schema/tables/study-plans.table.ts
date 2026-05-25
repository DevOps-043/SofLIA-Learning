import type { StudyPlansRow } from './study-plans.row'
import type { StudyPlansInsert } from './study-plans.insert'
import type { StudyPlansUpdate } from './study-plans.update'
import type { StudyPlansRelationships } from './study-plans.relationships'

export type StudyPlansTable = {
  Row: StudyPlansRow
  Insert: StudyPlansInsert
  Update: StudyPlansUpdate
  Relationships: StudyPlansRelationships
}
