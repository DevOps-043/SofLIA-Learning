import type { TFunction } from 'i18next'

export interface BusinessAssignCourseModalProps {
  isOpen: boolean
  onClose: () => void
  courseId: string
  courseTitle: string
  orgSlug: string
  onAssignComplete: () => void
}

export interface BusinessAssignCourseTheme {
  primaryColor: string
  accentColor: string
  cardBackground: string
  textColor: string
  borderColor: string
  isDark: boolean
}

export interface BusinessAssignCourseCopyProps {
  t: TFunction
}
