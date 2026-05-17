export interface CourseProgress {
  id: string
  userId: string
  courseId: string
  percentage: number
  completedModules: number
  totalModules: number
  lastWatchedVideoId?: string
  startedAt: Date
  completedAt?: Date
  updatedAt: Date
}

export interface ModuleProgress {
  id: string
  userId: string
  moduleId: string
  percentage: number
  isCompleted: boolean
  startedAt: Date
  completedAt?: Date
  updatedAt: Date
}

export interface VideoProgress {
  id: string
  userId: string
  videoId: string
  watchedPercentage: number
  isWatched: boolean
  lastWatchedAt: Date
  updatedAt: Date
}
