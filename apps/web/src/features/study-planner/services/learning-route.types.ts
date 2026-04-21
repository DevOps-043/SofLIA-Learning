export interface CourseWithProgress {
  course_id: string
  title: string
  level: 'beginner' | 'intermediate' | 'advanced' | null
  category: string | null
  progress_percentage: number
  duration_total_minutes: number | null
}

export interface LearningRouteItem {
  courseId: string
  title: string
  level: 'beginner' | 'intermediate' | 'advanced' | null
  category: string | null
  order: number
  isRequired: boolean
  isOwned: boolean
  currentProgress: number
  estimatedMinutes: number
  reason: string
}

export interface LearningRoute {
  name: string
  description: string
  items: LearningRouteItem[]
  totalMinutes: number
  totalCourses: number
  completedCourses: number
  estimatedWeeks: number
}

export interface SuggestedRoute {
  route: LearningRoute
  suggestedCourses: SuggestedCourse[]
  warnings: string[]
  tips: string[]
}

export interface SuggestedCourse {
  courseId: string
  title: string
  level: string | null
  category: string | null
  reason: string
  priority: 'high' | 'medium' | 'low'
}

export interface LearningRouteReorderPreferences {
  prioritizeCourseIds?: string[]
  excludeCourseIds?: string[]
  maxCourses?: number
}
