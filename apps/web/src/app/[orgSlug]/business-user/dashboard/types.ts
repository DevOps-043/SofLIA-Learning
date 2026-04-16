import type { LucideIcon } from 'lucide-react'
import type { StyleConfig } from '../../../../features/business-panel/hooks/useOrganizationStyles'

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
  status: 'Asignado' | 'En progreso' | 'Completado'
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

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url?: string | null
  favicon_url?: string | null
  show_navbar_name?: boolean
}

export type OrgRole = 'owner' | 'admin' | 'member' | 'superadmin' | null

export interface BusinessUserDashboardIdentity {
  first_name?: string
  last_name?: string
  display_name?: string
  username?: string
}

export interface BusinessUserDashboardColors {
  primary: string
  accent: string
  text: string
  cardBg: string
  sidebarBg: string
  border: string
  isLightMode: boolean
  textSecondary: string
  textMuted: string
  iconColor: string
  heroBg: string
  heroOverlay: string
  gridPattern: string
}

export interface BusinessUserDashboardStatItem {
  label: string
  value: number
  icon: LucideIcon
  color: string
}

export interface BusinessUserCertificateSummary {
  course_id: string
  certificate_id: string
}

export interface BusinessUserDashboardStylesProps {
  userDashboardStyles: StyleConfig | null | undefined
  resolvedTheme: string
}
