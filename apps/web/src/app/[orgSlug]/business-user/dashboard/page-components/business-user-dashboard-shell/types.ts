import type { CSSProperties } from 'react'

import type { StyleConfig } from '@/features/business-panel/hooks/useOrganizationStyles'
import type {
  AssignedCourse,
  AssignedLearningPath,
  BusinessUserDashboardColors,
  BusinessUserDashboardStatItem,
  Organization,
  OrgRole,
} from '../../types'

export type CourseViewMode = 'grid' | 'list'
export type DashboardTranslator = (key: string, defaultValue?: string) => string

export interface CourseListSectionEntry {
  assigned: boolean
  course: AssignedCourse
  isLocked: boolean
  pathTitle?: string
  position?: number
}

export interface CourseListSection {
  entries: CourseListSectionEntry[]
  id: string
  summary: string
  title: string
}

export interface BusinessUserDashboardShellProps {
  assignedCourses: AssignedCourse[]
  backgroundStyle: CSSProperties
  cssVariables: CSSProperties
  disableHeavyEffects: boolean
  displayName: string
  handleAnalyticsClick: () => void
  handleCertificatesClick: () => void
  handleCourseClick: (course: AssignedCourse, action?: 'start' | 'continue' | 'certificate') => void
  handleLearningPathCourseClick: (slug: string | null | undefined) => void
  handleLogout: () => void
  handleProfileClick: () => void
  handleVideoComplete: () => void
  initials: string
  introVideos: string[]
  learningPaths: AssignedLearningPath[]
  myStats: BusinessUserDashboardStatItem[]
  organization: Organization | null
  orgColors: BusinessUserDashboardColors
  orgRole: OrgRole
  orgSlug?: string
  restartTour: () => void
  showVideoIntro: boolean
  stats: { certificates: number }
  t: DashboardTranslator
  user: {
    display_name?: string
    first_name?: string
    last_name?: string
    username?: string
  } | null
  userDashboardStyles: StyleConfig | null | undefined
}
