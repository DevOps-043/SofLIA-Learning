import type { CourseLevel } from '../user-profile.types'
import type { CourseInfo } from './course-content.types'

export interface LearningRoute {
  id: string
  userId: string
  name: string
  description?: string
  courses: CourseInfo[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface LearningRouteSuggestion {
  name: string
  description: string
  courses: CourseInfo[]
  reason: string
  estimatedDuration: number
  difficulty: CourseLevel
  skills: string[]
}
