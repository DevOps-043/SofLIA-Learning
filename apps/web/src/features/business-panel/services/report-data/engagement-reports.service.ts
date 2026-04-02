import type { ReportFilters } from '../../types/report-data.types'
import {
  getActiveOrganizationUsers,
  getFilteredUserIds,
  getUserDisplayName,
  type ReportRuntime,
  type ReportSupabaseClient,
  type ReportUserProfile,
} from './shared'

interface AssignmentCourse {
  id: string
  title: string | null
  category: string | null
  level?: string | null
}

interface OrganizationCourseAssignment {
  user_id: string
  course_id: string
  status: string | null
  completion_percentage: number | null
  assigned_at: string | null
  completed_at: string | null
  due_date: string | null
}

interface ProgressReportRow extends OrganizationCourseAssignment {
  user_name: string
  user_email: string
  course_title: string
  course_category: string
  course_level: string
}

interface ProgressByCourseSummary {
  course_id: string
  course_title: string
  total: number
  completed: number
  in_progress: number
  not_started: number
  average_progress: number
}

interface CourseEnrollment {
  user_id: string
  course_id: string
  enrolled_at: string | null
  last_accessed_at: string | null
  enrollment_status: string | null
}

interface ActivityReportRow extends CourseEnrollment {
  user_name: string
  user_email: string
  course_title: string
  course_category: string
}

interface ActivityByCourseSummary {
  course_id: string
  course_title: string
  total_enrollments: number
  active: number
  completed: number
  inactive: number
}

function buildUserMap(
  organizationUsers: Awaited<ReturnType<typeof getActiveOrganizationUsers>>,
): Map<string, ReportUserProfile | null> {
  return new Map(
    organizationUsers.map((organizationUser) => [organizationUser.user_id, organizationUser.users]),
  )
}

export async function generateProgressReport(
  supabase: ReportSupabaseClient,
  organizationId: string,
  filters: ReportFilters,
  runtime: ReportRuntime,
) {
  const organizationUsers = await getActiveOrganizationUsers(supabase, organizationId, runtime)
  const organizationUserIds = organizationUsers.map((organizationUser) => organizationUser.user_id)
  const userIds = getFilteredUserIds(organizationUserIds, filters)

  if (userIds.length === 0) {
    return {
      total_users: 0,
      total_assignments: 0,
      completed_count: 0,
      in_progress_count: 0,
      not_started_count: 0,
      average_progress: 0,
      progress_data: [] as ProgressReportRow[],
      progress_by_course: [] as ProgressByCourseSummary[],
    }
  }

  let assignmentsQuery = supabase
    .from('organization_course_assignments')
    .select('user_id, course_id, status, completion_percentage, assigned_at, completed_at, due_date')
    .eq('organization_id', organizationId)
    .in('user_id', userIds)

  if (filters.start_date) {
    assignmentsQuery = assignmentsQuery.gte('assigned_at', filters.start_date)
  }

  if (filters.end_date) {
    assignmentsQuery = assignmentsQuery.lte('assigned_at', filters.end_date)
  }

  const { data: assignments } = await assignmentsQuery
  const assignmentRows = (assignments || []) as OrganizationCourseAssignment[]
  const courseIds = [...new Set(assignmentRows.map((assignment) => assignment.course_id))]
  const courses =
    courseIds.length > 0
      ? (
          await supabase
            .from('courses')
            .select('id, title, category, level')
            .in('id', courseIds)
        ).data
      : []

  const courseRows = (courses || []) as AssignmentCourse[]
  const courseMap = new Map(courseRows.map((course) => [course.id, course]))
  const userMap = buildUserMap(organizationUsers)

  const progressData: ProgressReportRow[] = assignmentRows.map((assignment) => {
    const course = courseMap.get(assignment.course_id)
    const user = userMap.get(assignment.user_id)

    return {
      ...assignment,
      user_name: getUserDisplayName(user),
      user_email: user?.email || '',
      course_title: course?.title || 'Curso desconocido',
      course_category: course?.category || '',
      course_level: course?.level || '',
    }
  })

  const completedCount = progressData.filter((progress) => progress.status === 'completed').length
  const inProgressCount = progressData.filter((progress) => progress.status === 'in_progress').length
  const notStartedCount = progressData.filter((progress) => progress.status === 'not_started').length
  const averageProgress =
    progressData.length > 0
      ? progressData.reduce(
          (sum, progress) => sum + (progress.completion_percentage || 0),
          0,
        ) / progressData.length
      : 0

  const progressByCourse = new Map<string, ProgressByCourseSummary>()
  progressData.forEach((progress) => {
    const currentCourse = progressByCourse.get(progress.course_id) || {
      course_id: progress.course_id,
      course_title: progress.course_title,
      total: 0,
      completed: 0,
      in_progress: 0,
      not_started: 0,
      average_progress: 0,
    }

    currentCourse.total++
    if (progress.status === 'completed') {
      currentCourse.completed++
    } else if (progress.status === 'in_progress') {
      currentCourse.in_progress++
    } else {
      currentCourse.not_started++
    }
    currentCourse.average_progress =
      ((currentCourse.average_progress * (currentCourse.total - 1)) +
        (progress.completion_percentage || 0)) /
      currentCourse.total

    progressByCourse.set(progress.course_id, currentCourse)
  })

  return {
    total_users: userIds.length,
    total_assignments: assignmentRows.length,
    completed_count: completedCount,
    in_progress_count: inProgressCount,
    not_started_count: notStartedCount,
    average_progress: averageProgress,
    progress_data: progressData,
    progress_by_course: Array.from(progressByCourse.values()),
  }
}

export async function generateActivityReport(
  supabase: ReportSupabaseClient,
  organizationId: string,
  filters: ReportFilters,
  runtime: ReportRuntime,
) {
  const organizationUsers = await getActiveOrganizationUsers(supabase, organizationId, runtime)
  const organizationUserIds = organizationUsers.map((organizationUser) => organizationUser.user_id)
  const userIds = getFilteredUserIds(organizationUserIds, filters)

  if (userIds.length === 0) {
    return {
      total_activities: 0,
      total_users: 0,
      active_count: 0,
      completed_count: 0,
      inactive_count: 0,
      activities: [] as ActivityReportRow[],
      activity_by_course: [] as ActivityByCourseSummary[],
    }
  }

  let enrollmentsQuery = supabase
    .from('user_course_enrollments')
    .select('user_id, course_id, enrolled_at, last_accessed_at, enrollment_status')
    .in('user_id', userIds)
    .order('last_accessed_at', { ascending: false })

  if (filters.start_date) {
    enrollmentsQuery = enrollmentsQuery.gte('enrolled_at', filters.start_date)
  }

  if (filters.end_date) {
    enrollmentsQuery = enrollmentsQuery.lte('enrolled_at', filters.end_date)
  }

  const { data: enrollments } = await enrollmentsQuery.limit(500)
  const enrollmentRows = (enrollments || []) as CourseEnrollment[]
  const courseIds = [...new Set(enrollmentRows.map((enrollment) => enrollment.course_id))]
  const courses =
    courseIds.length > 0
      ? (
          await supabase
            .from('courses')
            .select('id, title, category')
            .in('id', courseIds)
        ).data
      : []

  const courseRows = (courses || []) as AssignmentCourse[]
  const courseMap = new Map(courseRows.map((course) => [course.id, course]))
  const userMap = buildUserMap(organizationUsers)

  const activities: ActivityReportRow[] = enrollmentRows.map((enrollment) => {
    const course = courseMap.get(enrollment.course_id)
    const user = userMap.get(enrollment.user_id)

    return {
      ...enrollment,
      user_name: getUserDisplayName(user),
      user_email: user?.email || '',
      course_title: course?.title || 'Curso desconocido',
      course_category: course?.category || '',
    }
  })

  const activeCount = activities.filter((activity) => activity.enrollment_status === 'active').length
  const completedCount =
    activities.filter((activity) => activity.enrollment_status === 'completed').length
  const inactiveCount =
    activities.filter((activity) => activity.enrollment_status === 'inactive').length

  const activityByCourse = new Map<string, ActivityByCourseSummary>()
  activities.forEach((activity) => {
    const currentCourse = activityByCourse.get(activity.course_id) || {
      course_id: activity.course_id,
      course_title: activity.course_title,
      total_enrollments: 0,
      active: 0,
      completed: 0,
      inactive: 0,
    }

    currentCourse.total_enrollments++
    if (activity.enrollment_status === 'active') {
      currentCourse.active++
    } else if (activity.enrollment_status === 'completed') {
      currentCourse.completed++
    } else {
      currentCourse.inactive++
    }

    activityByCourse.set(activity.course_id, currentCourse)
  })

  return {
    total_activities: activities.length,
    total_users: userIds.length,
    active_count: activeCount,
    completed_count: completedCount,
    inactive_count: inactiveCount,
    activities,
    activity_by_course: Array.from(activityByCourse.values()),
  }
}
