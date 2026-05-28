import type {
  CourseChartData,
  CourseUserStats,
  EnrolledUser,
} from '../../components/CourseManagement/types'

export interface WorkshopEnrollmentAnalyticsRow {
  completed_at: string | null
  enrollment_id: string
  enrollment_status: string | null
  enrolled_at: string | null
  last_accessed_at: string | null
  overall_progress_percentage: number | null
  started_at: string | null
  user_id: string
}

export interface WorkshopUserProfileRow {
  display_name: string | null
  email: string | null
  id: string
  profile_picture_url: string | null
  username: string | null
}

export interface WorkshopContentCounts {
  totalActivities: number
  totalLessons: number
  totalMaterials: number
}

export interface WorkshopReviewSummary {
  averageRating: number
  totalReviews: number
}

const PROGRESS_BUCKETS = [
  { name: '0-25%', min: 0, max: 25 },
  { name: '26-50%', min: 26, max: 50 },
  { name: '51-75%', min: 51, max: 75 },
  { name: '76-100%', min: 76, max: 100 },
]

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export function buildCourseChartData(
  enrollments: WorkshopEnrollmentAnalyticsRow[],
  now = new Date(),
): CourseChartData {
  return {
    enrollment_trend_7d: buildEnrollmentTrend(enrollments, now),
    progress_distribution: buildProgressDistribution(enrollments),
    student_status_by_month: buildStudentStatusByMonth(enrollments, now),
  }
}

export function buildCourseUserStats(
  enrollments: WorkshopEnrollmentAnalyticsRow[],
  contentCounts: WorkshopContentCounts,
  reviewSummary: WorkshopReviewSummary,
  certificateCount: number,
  now = new Date(),
): CourseUserStats {
  const totalEnrolled = enrollments.length
  const completed = enrollments.filter(isCompletedEnrollment).length
  const inProgress = enrollments.filter((enrollment) => {
    const progress = normalizeProgress(enrollment.overall_progress_percentage)
    return !isCompletedEnrollment(enrollment) && progress > 0
  }).length
  const notStarted = enrollments.filter((enrollment) => {
    const progress = normalizeProgress(enrollment.overall_progress_percentage)
    return !isCompletedEnrollment(enrollment) && progress === 0
  }).length
  const progressSum = enrollments.reduce(
    (total, enrollment) => total + normalizeProgress(enrollment.overall_progress_percentage),
    0,
  )
  const active7d = countActiveSince(enrollments, daysAgo(now, 7))
  const active30d = countActiveSince(enrollments, daysAgo(now, 30))

  return {
    active_7d: active7d,
    active_30d: active30d,
    average_progress: totalEnrolled > 0 ? progressSum / totalEnrolled : 0,
    average_rating: reviewSummary.averageRating,
    completed,
    completion_rate: totalEnrolled > 0 ? (completed / totalEnrolled) * 100 : 0,
    in_progress: inProgress,
    not_started: notStarted,
    retention_rate: totalEnrolled > 0 ? (active30d / totalEnrolled) * 100 : 0,
    total_activities: contentCounts.totalActivities,
    total_certificates: certificateCount,
    total_enrolled: totalEnrolled,
    total_lessons: contentCounts.totalLessons,
    total_materials: contentCounts.totalMaterials,
    total_reviews: reviewSummary.totalReviews,
  }
}

export function buildEnrolledUsers(
  enrollments: WorkshopEnrollmentAnalyticsRow[],
  profilesById: Map<string, WorkshopUserProfileRow>,
): EnrolledUser[] {
  return enrollments.map((enrollment) => {
    const profile = profilesById.get(enrollment.user_id)
    const displayName = profile?.display_name || profile?.username || profile?.email || 'Usuario sin nombre'

    return {
      display_name: displayName,
      email: profile?.email ?? null,
      enrolled_at: enrollment.enrolled_at,
      enrollment_id: enrollment.enrollment_id,
      enrollment_status: enrollment.enrollment_status || 'active',
      last_accessed_at: enrollment.last_accessed_at,
      profile_picture: profile?.profile_picture_url ?? null,
      progress_percentage: normalizeProgress(enrollment.overall_progress_percentage),
      user_id: enrollment.user_id,
      username: profile?.username ?? null,
    }
  })
}

function buildProgressDistribution(enrollments: WorkshopEnrollmentAnalyticsRow[]) {
  return PROGRESS_BUCKETS.map((bucket) => ({
    name: bucket.name,
    value: enrollments.filter((enrollment) => {
      const progress = normalizeProgress(enrollment.overall_progress_percentage)
      return progress >= bucket.min && progress <= bucket.max
    }).length,
  }))
}

function buildEnrollmentTrend(enrollments: WorkshopEnrollmentAnalyticsRow[], now: Date) {
  const days = Array.from({ length: 7 }, (_, index) => startOfDay(daysAgo(now, 6 - index)))

  return days.map((day) => {
    const nextDay = addDays(day, 1)
    return {
      activos: enrollments.filter((enrollment) => isDateInRange(enrollment.last_accessed_at, day, nextDay)).length,
      dia: DAY_LABELS[day.getDay()],
      inscripciones: enrollments.filter((enrollment) => isDateInRange(enrollment.enrolled_at, day, nextDay)).length,
    }
  })
}

function buildStudentStatusByMonth(enrollments: WorkshopEnrollmentAnalyticsRow[], now: Date) {
  const months = Array.from({ length: 6 }, (_, index) => startOfMonth(addMonths(now, index - 5)))

  return months.map((month) => {
    const monthEnd = addMonths(month, 1)
    const visibleEnrollments = enrollments.filter((enrollment) => {
      const enrolledAt = parseDate(enrollment.enrolled_at)
      return enrolledAt && enrolledAt < monthEnd
    })

    const completados = visibleEnrollments.filter((enrollment) => {
      const completedAt = parseDate(enrollment.completed_at)
      return completedAt ? completedAt < monthEnd : isCompletedEnrollment(enrollment)
    }).length

    const enProgreso = visibleEnrollments.filter((enrollment) => {
      if (isCompletedEnrollment(enrollment)) return false
      return normalizeProgress(enrollment.overall_progress_percentage) > 0
    }).length

    return {
      completados,
      enProgreso,
      mes: MONTH_LABELS[month.getMonth()],
      noIniciados: Math.max(0, visibleEnrollments.length - completados - enProgreso),
    }
  })
}

function countActiveSince(enrollments: WorkshopEnrollmentAnalyticsRow[], since: Date): number {
  return enrollments.filter((enrollment) => {
    const lastAccessedAt = parseDate(enrollment.last_accessed_at)
    return lastAccessedAt ? lastAccessedAt >= since : false
  }).length
}

function isCompletedEnrollment(enrollment: WorkshopEnrollmentAnalyticsRow): boolean {
  return enrollment.enrollment_status === 'completed' || normalizeProgress(enrollment.overall_progress_percentage) >= 100
}

function normalizeProgress(progress: number | null): number {
  if (progress === null || !Number.isFinite(progress)) return 0
  return Math.min(100, Math.max(0, Number(progress)))
}

function isDateInRange(dateValue: string | null, start: Date, end: Date): boolean {
  const date = parseDate(dateValue)
  return date ? date >= start && date < end : false
}

function parseDate(dateValue: string | null): Date | null {
  if (!dateValue) return null
  const date = new Date(dateValue)
  return Number.isNaN(date.getTime()) ? null : date
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

function daysAgo(date: Date, days: number): Date {
  return addDays(date, -days)
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}
