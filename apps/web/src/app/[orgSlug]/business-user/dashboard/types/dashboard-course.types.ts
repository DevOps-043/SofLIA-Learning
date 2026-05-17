export interface DashboardStats {
  total_assigned: number
  in_progress: number
  completed: number
  certificates: number
}

export interface AssignedCourse {
  id: string
  course_id: string
  title: string
  instructor: string
  progress: number
  status: 'No iniciado' | 'Asignado' | 'En progreso' | 'Completado'
  thumbnail: string
  slug: string
  assigned_at: string
  due_date?: string
  completed_at?: string
  has_certificate?: boolean
}

export type AssignedLearningPathItemStatus = 'completed' | 'available' | 'locked'

export interface AssignedLearningPathItem {
  courseId: string
  title: string
  slug: string | null
  thumbnail: string | null
  position: number
  progress: number
  status: AssignedLearningPathItemStatus
  isUnlocked: boolean
  isCompleted: boolean
  hasCertificate: boolean
}

export interface AssignedLearningPath {
  id: string
  title: string
  description: string | null
  progressPercentage: number
  completedItemsCount: number
  totalItemsCount: number
  nextCourseSlug: string | null
  items: AssignedLearningPathItem[]
}

export interface BusinessUserCertificateSummary {
  course_id: string
  certificate_id: string
}
