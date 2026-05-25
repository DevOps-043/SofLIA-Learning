import type React from 'react'
import type { CourseWithInstructor } from '../../../features/courses/services/course.service'

export interface CourseHoverPopoverProps {
  course: CourseWithInstructor
  isVisible: boolean
  cardRef: React.RefObject<HTMLDivElement>
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClose: () => void
}
