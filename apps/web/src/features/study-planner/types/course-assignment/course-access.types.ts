import type { AssignmentStatus, UserType } from '../user-profile.types'
import type { CourseInfo } from './course-content.types'

export interface B2BCourseAssignment {
  id: string
  organizationId: string
  organizationName?: string
  userId: string
  courseId: string
  course: CourseInfo
  assignedBy?: string
  assignedByName?: string
  assignedAt: string
  dueDate?: string
  status: AssignmentStatus
  completionPercentage: number
  completedAt?: string
  message?: string
}

export interface TeamCourseAssignment {
  id: string
  teamId: string
  teamName: string
  organizationId?: string
  organizationName?: string
  courseId: string
  course: CourseInfo
  assignedBy: string
  assignedByName?: string
  assignedAt: string
  dueDate?: string
  status: AssignmentStatus
  message?: string
}

export interface B2CCoursePurchase {
  purchaseId: string
  userId: string
  courseId: string
  course: CourseInfo
  purchasedAt: string
  accessStatus: 'active' | 'suspended' | 'expired' | 'cancelled'
  expiresAt?: string
  completionPercentage?: number
}

export interface CourseAssignment {
  courseId: string
  course: CourseInfo
  userType: UserType
  dueDate?: string
  hasActivePlan?: boolean
  assignedBy?: string
  organizationId?: string
  organizationName?: string
  status: AssignmentStatus | 'active'
  completionPercentage: number
  completedLessons?: number
  totalLessons?: number
  lastAccessedAt?: string
  source: 'organization' | 'team' | 'purchase'
}
