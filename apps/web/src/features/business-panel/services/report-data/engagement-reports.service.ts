import type { ReportFilters } from '../../types/report-data.types'
import {
  getActiveOrganizationUsers,
  getFilteredUserIds,
  getUserDisplayName,
  type ReportRuntime,
  type ReportSupabaseClient,
} from './shared'

export async function generateProgressReport(
  supabase: ReportSupabaseClient,
  organizationId: string,
  filters: ReportFilters,
  runtime: ReportRuntime,
) {
  const organizationUsers = await getActiveOrganizationUsers(supabase, organizationId, runtime)
  const organizationUserIds = organizationUsers.map((organizationUser: any) => organizationUser.user_id)
  const userIds = getFilteredUserIds(organizationUserIds, filters)

  if (userIds.length === 0) {
    return {
      total_users: 0,
      total_assignments: 0,
      completed_count: 0,
      in_progress_count: 0,
      not_started_count: 0,
      average_progress: 0,
      progress_data: [],
      progress_by_course: [],
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
  const courseIds = [...new Set((assignments || []).map((assignment: any) => assignment.course_id))]
  const courses =
    courseIds.length > 0
      ? (
          await supabase
            .from('courses')
            .select('id, title, category, level')
            .in('id', courseIds)
        ).data
      : []

  const courseMap = new Map((courses || []).map((course: any) => [course.id, course]))
  const userMap = new Map(
    organizationUsers.map((organizationUser: any) => [organizationUser.user_id, organizationUser.users]),
  )

  const progressData = (assignments || []).map((assignment: any) => {
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

  const completedCount = progressData.filter((progress: any) => progress.status === 'completed').length
  const inProgressCount =
    progressData.filter((progress: any) => progress.status === 'in_progress').length
  const notStartedCount =
    progressData.filter((progress: any) => progress.status === 'not_started').length
  const averageProgress =
    progressData.length > 0
      ? progressData.reduce(
          (sum: number, progress: any) => sum + (progress.completion_percentage || 0),
          0,
        ) / progressData.length
      : 0

  const progressByCourse = new Map()
  progressData.forEach((progress: any) => {
    if (!progressByCourse.has(progress.course_id)) {
      progressByCourse.set(progress.course_id, {
        course_id: progress.course_id,
        course_title: progress.course_title,
        total: 0,
        completed: 0,
        in_progress: 0,
        not_started: 0,
        average_progress: 0,
      })
    }

    const course = progressByCourse.get(progress.course_id)
    course.total++
    if (progress.status === 'completed') {
      course.completed++
    } else if (progress.status === 'in_progress') {
      course.in_progress++
    } else {
      course.not_started++
    }
    course.average_progress =
      ((course.average_progress * (course.total - 1)) + (progress.completion_percentage || 0)) /
      course.total
  })

  return {
    total_users: userIds.length,
    total_assignments: assignments?.length || 0,
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
  const organizationUserIds = organizationUsers.map((organizationUser: any) => organizationUser.user_id)
  const userIds = getFilteredUserIds(organizationUserIds, filters)

  if (userIds.length === 0) {
    return {
      total_activities: 0,
      total_users: 0,
      active_count: 0,
      completed_count: 0,
      inactive_count: 0,
      activities: [],
      activity_by_course: [],
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
  const courseIds = [...new Set((enrollments || []).map((enrollment: any) => enrollment.course_id))]
  const courses =
    courseIds.length > 0
      ? (
          await supabase
            .from('courses')
            .select('id, title, category')
            .in('id', courseIds)
        ).data
      : []

  const courseMap = new Map((courses || []).map((course: any) => [course.id, course]))
  const userMap = new Map(
    organizationUsers.map((organizationUser: any) => [organizationUser.user_id, organizationUser.users]),
  )

  const activities = (enrollments || []).map((enrollment: any) => {
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

  const activeCount = activities.filter((activity: any) => activity.enrollment_status === 'active').length
  const completedCount =
    activities.filter((activity: any) => activity.enrollment_status === 'completed').length
  const inactiveCount =
    activities.filter((activity: any) => activity.enrollment_status === 'inactive').length

  const activityByCourse = new Map()
  activities.forEach((activity: any) => {
    if (!activityByCourse.has(activity.course_id)) {
      activityByCourse.set(activity.course_id, {
        course_id: activity.course_id,
        course_title: activity.course_title,
        total_enrollments: 0,
        active: 0,
        completed: 0,
        inactive: 0,
      })
    }

    const course = activityByCourse.get(activity.course_id)
    course.total_enrollments++
    if (activity.enrollment_status === 'active') {
      course.active++
    } else if (activity.enrollment_status === 'completed') {
      course.completed++
    } else {
      course.inactive++
    }
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
