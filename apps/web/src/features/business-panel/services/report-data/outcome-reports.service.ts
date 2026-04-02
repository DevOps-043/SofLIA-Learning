import type { ReportFilters } from '../../types/report-data.types'
import {
  getActiveOrganizationUsers,
  getFilteredUserIds,
  getUserDisplayName,
  roundToSingleDecimal,
  type ReportRuntime,
  type ReportSupabaseClient,
} from './shared'

export async function generateCompletionReport(
  supabase: ReportSupabaseClient,
  organizationId: string,
  filters: ReportFilters,
) {
  let assignmentsQuery = supabase
    .from('organization_course_assignments')
    .select('course_id, user_id, status, completion_percentage, completed_at, assigned_at, due_date')
    .eq('organization_id', organizationId)

  if (filters.start_date) {
    assignmentsQuery = assignmentsQuery.gte('completed_at', filters.start_date)
  }

  if (filters.end_date) {
    assignmentsQuery = assignmentsQuery.lte('completed_at', filters.end_date)
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

  const completionData = (assignments || []).map((assignment: any) => {
    const course = courseMap.get(assignment.course_id)

    return {
      ...assignment,
      course_title: course?.title || 'Curso desconocido',
      course_category: course?.category || '',
      course_level: course?.level || '',
    }
  })

  const completed = completionData.filter((assignment: any) => assignment.status === 'completed')
  const inProgress = completionData.filter((assignment: any) => assignment.status === 'in_progress')
  const notStarted = completionData.filter((assignment: any) => assignment.status === 'not_started')

  const completionByCourse = new Map()
  completionData.forEach((completion: any) => {
    if (!completionByCourse.has(completion.course_id)) {
      completionByCourse.set(completion.course_id, {
        course_id: completion.course_id,
        course_title: completion.course_title,
        total: 0,
        completed: 0,
        in_progress: 0,
        not_started: 0,
        average_completion: 0,
      })
    }

    const course = completionByCourse.get(completion.course_id)
    course.total++
    if (completion.status === 'completed') {
      course.completed++
    } else if (completion.status === 'in_progress') {
      course.in_progress++
    } else {
      course.not_started++
    }
    course.average_completion =
      ((course.average_completion * (course.total - 1)) + (completion.completion_percentage || 0)) /
      course.total
  })

  const completionRate =
    completionData.length > 0 ? (completed.length / completionData.length) * 100 : 0

  return {
    total_assignments: completionData.length,
    completed: completed.length,
    in_progress: inProgress.length,
    not_started: notStarted.length,
    completion_rate: completionRate,
    average_completion_percentage:
      completionData.length > 0
        ? completionData.reduce(
            (sum: number, completion: any) => sum + (completion.completion_percentage || 0),
            0,
          ) / completionData.length
        : 0,
    completion_data: completionData,
    completion_by_course: Array.from(completionByCourse.values()),
  }
}

export async function generateTimeSpentReport(
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
      total_minutes: 0,
      total_hours: 0,
      average_minutes_per_user: 0,
      average_hours_per_user: 0,
      time_data: [],
      time_by_course: [],
    }
  }

  let lessonProgressQuery = supabase
    .from('user_lesson_progress')
    .select(
      'user_id, lesson_id, time_spent_minutes, completed_at, started_at, last_accessed_at, completion_status',
    )
    .in('user_id', userIds)

  if (filters.start_date) {
    lessonProgressQuery = lessonProgressQuery.gte('started_at', filters.start_date)
  }

  if (filters.end_date) {
    lessonProgressQuery = lessonProgressQuery.lte('last_accessed_at', filters.end_date)
  }

  const { data: lessonProgress } = await lessonProgressQuery
  const lessonIds = [...new Set((lessonProgress || []).map((progress: any) => progress.lesson_id))]
  const lessons =
    lessonIds.length > 0
      ? (
          await supabase
            .from('course_lessons')
            .select(
              'lesson_id, lesson_title, module_id, course_modules!course_lessons_module_id_fkey (course_id, courses!course_modules_course_id_fkey (id, title))',
            )
            .in('lesson_id', lessonIds)
        ).data
      : []

  const lessonMap = new Map()
  lessons?.forEach((lesson: any) => {
    lessonMap.set(lesson.lesson_id, {
      lesson_title: lesson.lesson_title,
      course_id: lesson.course_modules?.courses?.id,
      course_title: lesson.course_modules?.courses?.title || 'Curso desconocido',
    })
  })

  const userMap = new Map(
    organizationUsers.map((organizationUser: any) => [organizationUser.user_id, organizationUser.users]),
  )

  const timeByUser = new Map()
  lessonProgress?.forEach((progress: any) => {
    if (!timeByUser.has(progress.user_id)) {
      const user = userMap.get(progress.user_id)
      timeByUser.set(progress.user_id, {
        user_id: progress.user_id,
        user_name: getUserDisplayName(user),
        user_email: user?.email || '',
        total_minutes: 0,
        total_hours: 0,
        lessons_completed: 0,
        lessons_in_progress: 0,
        lessons_not_started: 0,
      })
    }

    const user = timeByUser.get(progress.user_id)
    user.total_minutes += progress.time_spent_minutes || 0
    if (progress.completion_status === 'completed') {
      user.lessons_completed++
    } else if (progress.completion_status === 'in_progress') {
      user.lessons_in_progress++
    } else {
      user.lessons_not_started++
    }
  })

  timeByUser.forEach((user: any) => {
    user.total_hours = roundToSingleDecimal(user.total_minutes / 60)
  })

  const totalMinutes =
    lessonProgress?.reduce(
      (sum: number, progress: any) => sum + (progress.time_spent_minutes || 0),
      0,
    ) || 0

  const timeByCourse = new Map()
  lessonProgress?.forEach((progress: any) => {
    const lesson = lessonMap.get(progress.lesson_id)
    if (!lesson?.course_id) {
      return
    }

    if (!timeByCourse.has(lesson.course_id)) {
      timeByCourse.set(lesson.course_id, {
        course_id: lesson.course_id,
        course_title: lesson.course_title,
        total_minutes: 0,
        total_hours: 0,
      })
    }

    const course = timeByCourse.get(lesson.course_id)
    course.total_minutes += progress.time_spent_minutes || 0
  })

  timeByCourse.forEach((course: any) => {
    course.total_hours = roundToSingleDecimal(course.total_minutes / 60)
  })

  return {
    total_users: userIds.length,
    total_minutes: totalMinutes,
    total_hours: roundToSingleDecimal(totalMinutes / 60),
    average_minutes_per_user:
      userIds.length > 0 ? roundToSingleDecimal(totalMinutes / userIds.length) : 0,
    average_hours_per_user:
      userIds.length > 0 ? roundToSingleDecimal(totalMinutes / 60 / userIds.length) : 0,
    time_data: Array.from(timeByUser.values()),
    time_by_course: Array.from(timeByCourse.values()),
  }
}

export async function generateCertificatesReport(
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
      total_certificates: 0,
      total_users_with_certificates: 0,
      certificates: [],
      certificates_by_course: [],
      certificates_by_user: [],
    }
  }

  let certificatesQuery = supabase
    .from('user_course_certificates')
    .select('user_id, course_id, issued_at, certificate_url')
    .in('user_id', userIds)
    .order('issued_at', { ascending: false })

  if (filters.start_date) {
    certificatesQuery = certificatesQuery.gte('issued_at', filters.start_date)
  }

  if (filters.end_date) {
    certificatesQuery = certificatesQuery.lte('issued_at', filters.end_date)
  }

  const { data: certificates } = await certificatesQuery
  const courseIds = [...new Set((certificates || []).map((certificate: any) => certificate.course_id))]
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

  const enrichedCertificates = (certificates || []).map((certificate: any) => {
    const course = courseMap.get(certificate.course_id)
    const user = userMap.get(certificate.user_id)

    return {
      ...certificate,
      user_name: getUserDisplayName(user),
      user_email: user?.email || '',
      course_title: course?.title || 'Curso desconocido',
      course_category: course?.category || '',
      course_level: course?.level || '',
    }
  })

  const certificatesByCourse = new Map()
  enrichedCertificates.forEach((certificate: any) => {
    if (!certificatesByCourse.has(certificate.course_id)) {
      certificatesByCourse.set(certificate.course_id, {
        course_id: certificate.course_id,
        course_title: certificate.course_title,
        count: 0,
      })
    }
    certificatesByCourse.get(certificate.course_id).count++
  })

  const certificatesByUser = new Map()
  enrichedCertificates.forEach((certificate: any) => {
    if (!certificatesByUser.has(certificate.user_id)) {
      certificatesByUser.set(certificate.user_id, {
        user_id: certificate.user_id,
        user_name: certificate.user_name,
        user_email: certificate.user_email,
        count: 0,
      })
    }
    certificatesByUser.get(certificate.user_id).count++
  })

  return {
    total_certificates: enrichedCertificates.length,
    total_users_with_certificates: certificatesByUser.size,
    certificates: enrichedCertificates,
    certificates_by_course: Array.from(certificatesByCourse.values()),
    certificates_by_user: Array.from(certificatesByUser.values()),
  }
}
