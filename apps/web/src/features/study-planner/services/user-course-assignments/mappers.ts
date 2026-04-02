import type {
  B2BCourseAssignment,
  B2CCoursePurchase,
  TeamCourseAssignment,
} from '../../types/user-context.types'
import {
  mapAssignmentStatus,
  mapCourseInfo,
  mapPersonName,
  normalizeOptionalString,
} from '../course-query.shared'
import type {
  AssignmentBuilderInput,
  CoursePurchaseRow,
  OrganizationAssignmentRow,
} from './types'

export function normalizeActivePurchaseStatus(status?: string | null) {
  if (status === 'expired' || status === 'cancelled' || status === 'suspended') {
    return status
  }

  return 'active'
}

export function hasUpcomingDueDate(dueDate?: string | null) {
  if (!dueDate) {
    return true
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const normalizedDueDate = new Date(dueDate)
  normalizedDueDate.setHours(0, 0, 0, 0)

  return normalizedDueDate >= today
}

export function buildOrganizationAssignment(
  item: OrganizationAssignmentRow,
): B2BCourseAssignment | null {
  if (!item.courses) {
    return null
  }

  return {
    id: item.id,
    organizationId: item.organization_id,
    userId: item.user_id,
    courseId: item.course_id,
    course: mapCourseInfo(item.courses),
    assignedBy: normalizeOptionalString(item.assigned_by),
    assignedByName: mapPersonName(item.assigner),
    assignedAt: item.assigned_at,
    dueDate: normalizeOptionalString(item.due_date),
    status: mapAssignmentStatus(item.status),
    completionPercentage: item.completion_percentage ?? 0,
    completedAt: normalizeOptionalString(item.completed_at),
    message: normalizeOptionalString(item.message),
  }
}

export function buildTeamAssignment(
  item: AssignmentBuilderInput,
  teamId: string,
  teamName: string,
): TeamCourseAssignment | null {
  if (!item.courses) {
    return null
  }

  return {
    id: item.id,
    teamId,
    teamName,
    courseId: item.course_id,
    course: mapCourseInfo(item.courses),
    assignedBy: item.assigned_by ?? '',
    assignedByName: mapPersonName(item.assigner),
    assignedAt: item.assigned_at,
    dueDate: normalizeOptionalString(item.due_date),
    status: mapAssignmentStatus(item.status),
    message: normalizeOptionalString(item.message),
  }
}

export function buildCoursePurchase(
  item: CoursePurchaseRow,
  completionPercentage: number,
): B2CCoursePurchase | null {
  if (!item.courses) {
    return null
  }

  return {
    purchaseId: item.purchase_id,
    userId: item.user_id,
    courseId: item.course_id,
    course: mapCourseInfo(item.courses),
    purchasedAt: item.purchased_at,
    accessStatus: normalizeActivePurchaseStatus(
      item.access_status,
    ) as B2CCoursePurchase['accessStatus'],
    expiresAt: normalizeOptionalString(item.expires_at),
    completionPercentage,
  }
}
