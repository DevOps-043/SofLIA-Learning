export interface LearningPathAccessItem {
  courseId: string
  slug: string | null
  title: string
  position: number
  isCompleted: boolean
  isUnlocked: boolean
  isCurrent: boolean
}

export interface LearningPathAccessState {
  learningPathId: string
  title: string
  description: string | null
  currentCourseId: string
  currentCourseUnlocked: boolean
  progressPercentage: number
  completedItemsCount: number
  totalItemsCount: number
  items: LearningPathAccessItem[]
}

export interface LearningPathRow {
  id: string
  title: string
  description: string | null
  is_active: boolean | null
}

export interface LearningPathItemFlatRow {
  id: string
  learning_path_id: string
  course_id: string
  position: number
}

export interface CourseMinRow {
  id: string
  slug: string | null
  title: string | null
}

export interface EnrollmentRow {
  course_id: string
  organization_id: string | null
  overall_progress_percentage: number | null
  enrollment_status: string | null
}

export interface UserLearningPathProgressRow {
  id: string
}

export interface QueryLikeError {
  code?: string
  message?: string
  details?: string
}
