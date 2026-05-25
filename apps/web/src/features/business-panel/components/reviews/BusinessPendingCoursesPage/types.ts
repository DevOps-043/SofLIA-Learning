import type { ReactNode } from 'react'
import type { AdminCourse } from '@/features/admin/actions/adminCourses.actions'

export interface BusinessPendingCoursesPageProps {
  basePath: string
}

export type ReviewTab = 'pending' | 'rejected'

export interface ReviewCounts {
  pending: number
  rejected: number
  updates: number
  fresh: number
}

export interface ReviewTone {
  color: string
  background: string
  border: string
}

export type ReviewTranslator = (key: string) => string
export type SelectReviewCourse = (courseId: string) => void

export interface ActionButtonProps {
  label: string
  icon: ReactNode
  onClick: () => void
  backgroundColor: string
  color: string
  borderColor: string
}

export interface ReviewCourseCardLabels {
  approveAction: string
  dangerAction: string
  dateLabel: string
  instructorFallback: string
  levelLabel: string
  notAvailable: string
  statusBadge: string
  typeBadge: string
  viewAction: string
}

export interface ReviewCourseCardProps {
  activeTab: ReviewTab
  basePath: string
  course: AdminCourse
  index: number
  labels: ReviewCourseCardLabels
  language: string
  onApprove: SelectReviewCourse
  onDelete: SelectReviewCourse
  onReject: SelectReviewCourse
}
