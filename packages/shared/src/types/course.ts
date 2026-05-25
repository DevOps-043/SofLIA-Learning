export interface Course {
  id: string
  title: string
  description: string
  thumbnail?: string
  status: CourseStatus
  estimatedDuration: number
  difficulty: CourseDifficulty
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  modules: Module[]
}

export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum CourseDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export interface Module {
  id: string
  courseId: string
  title: string
  description: string
  order: number
  isUnlocked: boolean
  videos: Video[]
  createdAt: Date
  updatedAt: Date
}

export interface Video {
  id: string
  moduleId: string
  title: string
  description?: string
  url: string
  duration: number
  order: number
  thumbnail?: string
  createdAt: Date
  updatedAt: Date
}
