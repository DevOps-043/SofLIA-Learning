export type LearningPathDashboardItemStatus = 'completed' | 'available' | 'locked'

export interface LearningPathDashboardPathRow {
  id: string
  title: string | null
  description: string | null
  is_active: boolean | null
}

export interface LearningPathDashboardCourseRow {
  id: string
  title: string | null
  slug: string | null
  thumbnail_url?: string | null
}

export interface LearningPathDashboardItemRow {
  id: string
  learning_path_id: string
  course_id: string
  position: number
  courses?: LearningPathDashboardCourseRow | null
}

export interface LearningPathDashboardEnrollmentRow {
  course_id: string
  organization_id?: string | null
  overall_progress_percentage: number | null
  enrollment_status: string | null
  completed_at?: string | null
}

export interface LearningPathDashboardCertificateRow {
  course_id: string
}

export interface AssignedLearningPathDashboardItem {
  courseId: string
  title: string
  slug: string | null
  thumbnail: string | null
  position: number
  progress: number
  status: LearningPathDashboardItemStatus
  isUnlocked: boolean
  isCompleted: boolean
  hasCertificate: boolean
}

export interface AssignedLearningPathDashboard {
  id: string
  title: string
  description: string | null
  progressPercentage: number
  completedItemsCount: number
  totalItemsCount: number
  nextCourseSlug: string | null
  items: AssignedLearningPathDashboardItem[]
}

interface BuildBusinessUserLearningPathsParams {
  paths: LearningPathDashboardPathRow[]
  items: LearningPathDashboardItemRow[]
  enrollments: LearningPathDashboardEnrollmentRow[]
  certificates: LearningPathDashboardCertificateRow[]
  organizationId?: string | null
}

function getEnrollmentProgress(enrollment: LearningPathDashboardEnrollmentRow | undefined) {
  if (!enrollment?.overall_progress_percentage) {
    return 0
  }

  return Math.max(0, Math.min(100, Number(enrollment.overall_progress_percentage)))
}

function isEnrollmentCompleted(enrollment: LearningPathDashboardEnrollmentRow | undefined) {
  if (!enrollment) return false

  return enrollment.enrollment_status === 'completed' || getEnrollmentProgress(enrollment) >= 100
}

function buildEnrollmentMap(
  enrollments: LearningPathDashboardEnrollmentRow[],
  organizationId?: string | null,
) {
  const enrollmentMap = new Map<string, LearningPathDashboardEnrollmentRow>()

  for (const enrollment of enrollments) {
    const current = enrollmentMap.get(enrollment.course_id)
    if (!current) {
      enrollmentMap.set(enrollment.course_id, enrollment)
      continue
    }

    const currentMatchesOrg = current.organization_id === organizationId
    const nextMatchesOrg = enrollment.organization_id === organizationId
    if (!currentMatchesOrg && nextMatchesOrg) {
      enrollmentMap.set(enrollment.course_id, enrollment)
    }
  }

  return enrollmentMap
}

export function buildBusinessUserLearningPaths({
  paths,
  items,
  enrollments,
  certificates,
  organizationId,
}: BuildBusinessUserLearningPathsParams): AssignedLearningPathDashboard[] {
  const enrollmentMap = buildEnrollmentMap(enrollments, organizationId)
  const certificateCourseIds = new Set(certificates.map((certificate) => certificate.course_id))

  const itemsByPathId = new Map<string, LearningPathDashboardItemRow[]>()
  for (const item of items) {
    const existing = itemsByPathId.get(item.learning_path_id) || []
    existing.push(item)
    itemsByPathId.set(item.learning_path_id, existing)
  }

  return paths
    .filter((path) => path.is_active !== false)
    .map((path) => {
      const pathItems = (itemsByPathId.get(path.id) || [])
        .slice()
        .sort((left, right) => left.position - right.position)

      let previousCourseCompleted = true
      let completedItemsCount = 0
      let accumulatedProgress = 0

      const mappedItems = pathItems.map((item) => {
        const enrollment = enrollmentMap.get(item.course_id)
        const isCompleted = isEnrollmentCompleted(enrollment)
        const progress = isCompleted
          ? 100
          : Math.round(getEnrollmentProgress(enrollment) * 100) / 100
        const isUnlocked = previousCourseCompleted
        const status: LearningPathDashboardItemStatus = isCompleted
          ? 'completed'
          : isUnlocked
            ? 'available'
            : 'locked'

        if (isCompleted) {
          completedItemsCount += 1
        }

        accumulatedProgress += progress
        previousCourseCompleted = previousCourseCompleted && isCompleted

        return {
          courseId: item.course_id,
          title: item.courses?.title || 'Curso sin titulo',
          slug: item.courses?.slug || null,
          thumbnail: item.courses?.thumbnail_url || null,
          position: item.position,
          progress,
          status,
          isUnlocked,
          isCompleted,
          hasCertificate: certificateCourseIds.has(item.course_id),
        }
      })

      const totalItemsCount = mappedItems.length
      const progressPercentage =
        totalItemsCount > 0
          ? Math.round(accumulatedProgress / totalItemsCount)
          : 0
      const nextCourseSlug =
        mappedItems.find((item) => item.isUnlocked && !item.isCompleted && item.slug)?.slug ||
        null

      return {
        id: path.id,
        title: path.title || 'Ruta sin titulo',
        description: path.description,
        progressPercentage,
        completedItemsCount,
        totalItemsCount,
        nextCourseSlug,
        items: mappedItems,
      }
    })
    .filter((path) => path.totalItemsCount > 0)
}
