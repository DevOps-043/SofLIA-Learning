import type { Dispatch, SetStateAction } from 'react'
import type {
  AdminCompany,
  LearningPath,
  LearningPathOrganizationAssignmentSummary,
  LearningPathUpsertPayload,
  LearningPathUserAssignmentSummary,
} from '../../types'

export type LpTranslator = (key: string, defaultValue: string, options?: Record<string, unknown>) => string
export type CourseOption = { id: string; title: string }
export type SetLearningPath = Dispatch<SetStateAction<LearningPath | null>>
export type SaveMetadata = (payload: LearningPathUpsertPayload) => Promise<void>
export type ReorderItems = (fromIndex: number, toIndex: number) => Promise<void>
export type SetRemoveTarget = Dispatch<SetStateAction<string | null>>
export type SetOrganizationAssignmentToRevoke = Dispatch<SetStateAction<LearningPathOrganizationAssignmentSummary | null>>

export type {
  AdminCompany,
  LearningPath,
  LearningPathOrganizationAssignmentSummary,
  LearningPathUserAssignmentSummary,
}

export function getUserLabel(user: {
  email: string
  display_name: string | null
  first_name: string | null
  last_name: string | null
} | null | undefined) {
  if (!user) return null

  const composedName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
  return user.display_name || composedName || user.email
}
