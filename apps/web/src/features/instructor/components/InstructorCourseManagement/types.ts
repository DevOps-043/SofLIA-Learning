import type { AdminModule } from '../../../admin/services/adminModules.service'
import type { AdminLesson } from '../../../admin/services/adminLessons.service'
import type { CourseSkill } from '../../../courses/components/CourseSkillsSelector'
import type { Dispatch, SetStateAction, FormEvent, ChangeEvent } from 'react'

export type ActiveTab = 'modules' | 'config' | 'certificates' | 'preview' | 'stats'

export interface ConfigData {
  title: string
  description: string
  category: string
  level: string
  duration_total_minutes: number
  price: number
  thumbnail_url: string
  slug: string
}

export interface InstructorModulesTabProps {
  modules: AdminModule[]
  modulesLoading: boolean
  expandedModules: Set<string>
  expandedLessons: Set<string>
  toggleModule: (moduleId: string) => void
  toggleLesson: (lessonId: string) => void
  lessons: AdminLesson[]
  materials: { material_id: string; lesson_id: string; material_title: string; material_type: string }[]
  activities: { activity_id: string; lesson_id: string; activity_title: string; activity_type: string }[]
  setSelectedModule: (m: AdminModule | null) => void
  setShowModuleModal: (v: boolean) => void
  setDeletingModule: (m: AdminModule | null) => void
  setShowDeleteModuleModal: (v: boolean) => void
  setSelectedLesson: (l: AdminLesson | null) => void
  setShowLessonModal: (v: boolean) => void
  setEditingModuleId: (id: string | null) => void
  setEditingLessonId: (id: string | null) => void
  setEditingActivityId: (id: string | null) => void
  setDeletingLesson: (l: AdminLesson | null) => void
  setShowDeleteLessonModal: (v: boolean) => void
  setShowMaterialModal: (v: boolean) => void
  setShowActivityModal: (v: boolean) => void
}

export interface InstructorConfigTabProps {
  courseId: string
  configData: ConfigData
  setConfigData: Dispatch<SetStateAction<ConfigData>>
  handleConfigChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  handleSaveConfig: (e: FormEvent<HTMLFormElement>) => void
  savingConfig: boolean
  courseSkills: CourseSkill[]
  setCourseSkills: (skills: CourseSkill[]) => void
  savingSkills: boolean
}

export interface InstructorPreviewTabProps {
  workshopPreview: {
    title: string
    description: string
    category?: string
    level: string
    duration_total_minutes: number
    price: number
    thumbnail_url?: string
    slug?: string
  } | null
  previewLoading: boolean
}

export interface InstructorUserStats {
  total_enrolled: number
  completed: number
  in_progress: number
  not_started: number
  average_progress: number
  active_7d: number
  active_30d: number
  last_activity_at: string | null
  total_purchases: number
  active_purchases: number
  course_price: number
  total_revenue_cents: number
  total_revenue_display: string
  total_reviews: number
  average_rating: number
  total_certificates: number
  total_notes: number
  completed_activities: number
  total_lessons: number
  total_materials: number
  total_activities: number
  median_progress: number
  std_deviation: number
  variance: number
  q1_progress: number
  q3_progress: number
  iqr_progress: number
  min_progress: number
  max_progress: number
  retention_rate: number
  completion_rate: number
  avg_completion_days: number
}

export interface InstructorEnrolledUser {
  enrollment_id: string
  user_id: string
  username: string
  display_name: string
  email: string
  profile_picture: string | null
  enrollment_status: string
  progress_percentage: number
  enrolled_at: string | null
  started_at: string | null
  completed_at: string | null
  last_accessed_at: string | null
}

export interface InstructorEnrollmentTrendPoint {
  date: string
  enrollments: number
  completions: number
}

export interface InstructorProgressDistributionPoint {
  range: string
  count: number
}

export interface InstructorEngagementPoint {
  user_id: string
  progress: number
  days_active: number
  notes_created: number
}

export interface InstructorEnrollmentRatePoint {
  period: string
  enrollment_rate: number
  completion_rate: number
  retention_rate: number
}

export interface InstructorPiePoint {
  name: string
  count: number
}

export interface InstructorStudentStatusByMonthPoint {
  mes: string
  completados: number
  enProgreso: number
  noIniciados: number
}

export interface InstructorChartData {
  enrollment_trend: InstructorEnrollmentTrendPoint[]
  progress_distribution: InstructorProgressDistributionPoint[]
  engagement_data: InstructorEngagementPoint[]
  enrollment_rates: InstructorEnrollmentRatePoint[]
  user_roles_pie: InstructorPiePoint[]
  user_areas_pie: InstructorPiePoint[]
  student_status_by_month: InstructorStudentStatusByMonthPoint[]
}

export interface InstructorStatsTabProps {
  modules: AdminModule[]
  userStats: InstructorUserStats | null
  enrolledUsers: InstructorEnrolledUser[]
  statsLoading: boolean
  chartData: InstructorChartData | null
}

export interface DeleteModuleModalProps {
  deletingModule: AdminModule
  onCancel: () => void
  onConfirm: () => Promise<void>
}

export interface DeleteLessonModalProps {
  deletingLesson: AdminLesson
  onCancel: () => void
  onConfirm: () => Promise<void>
}
