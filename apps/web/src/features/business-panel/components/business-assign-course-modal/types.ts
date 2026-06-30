import type { TFunction } from 'i18next'

export type AssignmentMode = 'users' | 'all' | 'node'

export interface BusinessAssignCourseModalProps {
  isOpen: boolean
  onClose: () => void
  courseId: string
  courseTitle: string
  orgSlug: string
  onAssignComplete: () => void
}

export interface BusinessAssignCourseCopyProps {
  t: TFunction
}
