import type { ReportFilters } from '../../types/report-data.types'
import {
  getActiveOrganizationUsers,
  getFilteredUserIds,
  getUserDisplayName,
  roundToSingleDecimal,
  type ReportRuntime,
  type ReportSupabaseClient,
  type ReportUserProfile,
} from './shared'

interface CourseLookup {
  id: string
  title: string | null
  category: string | null
  level?: string | null
}

interface CompletionAssignment {
  course_id: string
  user_id: string
  status: string | null
  completion_percentage: number | null
  completed_at: string | null
  assigned_at: string | null
  due_date: string | null
}

interface CompletionReportRow extends CompletionAssignment {
  course_title: string
  course_category: string
  course_level: string
}

interface CompletionByCourseSummary {
  course_id: string
  course_title: string
  total: number
  completed: number
  in_progress: number
  not_started: number
  average_completion: number
}

interface LessonProgressRecord {
  user_id: string
  lesson_id: string
  time_spent_minutes: number | null
  completed_at: string | null
  started_at: string | null
  last_accessed_at: string | null
  lesson_status: string | null
}

interface LessonCourseLookup {
  lesson_id: string
  lesson_title: string | null
  course_modules?: {
    courses?: {
      id: string
      title: string | null
    } | null
  } | null
}

interface TimeByUserSummary {
  user_id: string
  user_name: string
  user_email: string
  total_minutes: number
  total_hours: number
  lessons_completed: number
  lessons_in_progress: number
  lessons_not_started: number
}

interface TimeByCourseSummary {
  course_id: string
  course_title: string
  total_minutes: number
  total_hours: number
}

interface CertificateRecord {
  user_id: string
  course_id: string
  issued_at: string | null
  certificate_url: string | null
}

interface EnrichedCertificate extends CertificateRecord {
  user_name: string
  user_email: string
  course_title: string
  course_category: string
  course_level: string
}

interface CertificatesByCourseSummary {
  course_id: string
  course_title: string
  count: number
}

interface CertificatesByUserSummary {
  user_id: string
  user_name: string
  user_email: string
  count: number
}

function buildUserMap(
  organizationUsers: Awaited<ReturnType<typeof getActiveOrganizationUsers>>,
): Map<string, ReportUserProfile | null> {
  return new Map(
    organizationUsers.map((organizationUser) => [organizationUser.user_id, organizationUser.users]),
  )
}

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
  const assignmentRows = (assignments || []) as CompletionAssignment[]
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

  const courseRows = (courses || []) as CourseLookup[]
  const courseMap = new Map(courseRows.map((course) => [course.id, course]))

  const completionData: CompletionReportRow[] = assignmentRows.map((assignment) => {
    const course = courseMap.get(assignment.course_id)

    return {
      ...assignment,
      course_title: course?.title || 'Curso desconocido',
      course_category: course?.category || '',
      course_level: course?.level || '',
    }
  })

  const completed = completionData.filter((assignment) => assignment.status === 'completed')
  const inProgress = completionData.filter((assignment) => assignment.status === 'in_progress')
  const notStarted = completionData.filter((assignment) => assignment.status === 'not_started')

  const completionByCourse = new Map<string, CompletionByCourseSummary>()
  completionData.forEach((completion) => {
    const currentCourse = completionByCourse.get(completion.course_id) || {
      course_id: completion.course_id,
      course_title: completion.course_title,
      total: 0,
      completed: 0,
      in_progress: 0,
      not_started: 0,
      average_completion: 0,
    }

    currentCourse.total++
    if (completion.status === 'completed') {
      currentCourse.completed++
    } else if (completion.status === 'in_progress') {
      currentCourse.in_progress++
    } else {
      currentCourse.not_started++
    }
    currentCourse.average_completion =
      ((currentCourse.average_completion * (currentCourse.total - 1)) +
        (completion.completion_percentage || 0)) /
      currentCourse.total

    completionByCourse.set(completion.course_id, currentCourse)
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
            (sum, completion) => sum + (completion.completion_percentage || 0),
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
  const organizationUserIds = organizationUsers.map((organizationUser) => organizationUser.user_id)
  const userIds = getFilteredUserIds(organizationUserIds, filters)

  if (userIds.length === 0) {
    return {
      total_users: 0,
      total_minutes: 0,
      total_hours: 0,
      average_minutes_per_user: 0,
      average_hours_per_user: 0,
      time_data: [] as TimeByUserSummary[],
      time_by_course: [] as TimeByCourseSummary[],
    }
  }

  let lessonProgressQuery = supabase
    .from('user_lesson_progress')
    .select(
      'user_id, lesson_id, time_spent_minutes, completed_at, started_at, last_accessed_at, lesson_status',
    )
    .in('user_id', userIds)

  if (filters.start_date) {
    lessonProgressQuery = lessonProgressQuery.gte('started_at', filters.start_date)
  }

  if (filters.end_date) {
    lessonProgressQuery = lessonProgressQuery.lte('last_accessed_at', filters.end_date)
  }

  const { data: lessonProgress } = await lessonProgressQuery
  const lessonProgressRows = (lessonProgress || []) as LessonProgressRecord[]
  const lessonIds = [...new Set(lessonProgressRows.map((progress) => progress.lesson_id))]
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

  const lessonRows = (lessons || []) as LessonCourseLookup[]
  const lessonMap = new Map(
    lessonRows.map((lesson) => [
      lesson.lesson_id,
      {
        lesson_title: lesson.lesson_title,
        course_id: lesson.course_modules?.courses?.id,
        course_title: lesson.course_modules?.courses?.title || 'Curso desconocido',
      },
    ]),
  )

  const userMap = buildUserMap(organizationUsers)

  const timeByUser = new Map<string, TimeByUserSummary>()
  lessonProgressRows.forEach((progress) => {
    const currentUser = timeByUser.get(progress.user_id) || {
      user_id: progress.user_id,
      user_name: getUserDisplayName(userMap.get(progress.user_id)),
      user_email: userMap.get(progress.user_id)?.email || '',
      total_minutes: 0,
      total_hours: 0,
      lessons_completed: 0,
      lessons_in_progress: 0,
      lessons_not_started: 0,
    }

    currentUser.total_minutes += progress.time_spent_minutes || 0
    if (progress.lesson_status === 'completed') {
      currentUser.lessons_completed++
    } else if (progress.lesson_status === 'in_progress') {
      currentUser.lessons_in_progress++
    } else {
      currentUser.lessons_not_started++
    }

    timeByUser.set(progress.user_id, currentUser)
  })

  timeByUser.forEach((user) => {
    user.total_hours = roundToSingleDecimal(user.total_minutes / 60)
  })

  const totalMinutes =
    lessonProgressRows.reduce(
      (sum, progress) => sum + (progress.time_spent_minutes || 0),
      0,
    )

  const timeByCourse = new Map<string, TimeByCourseSummary>()
  lessonProgressRows.forEach((progress) => {
    const lesson = lessonMap.get(progress.lesson_id)
    if (!lesson?.course_id) {
      return
    }

    const currentCourse = timeByCourse.get(lesson.course_id) || {
      course_id: lesson.course_id,
      course_title: lesson.course_title,
      total_minutes: 0,
      total_hours: 0,
    }

    currentCourse.total_minutes += progress.time_spent_minutes || 0
    timeByCourse.set(lesson.course_id, currentCourse)
  })

  timeByCourse.forEach((course) => {
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
  const organizationUserIds = organizationUsers.map((organizationUser) => organizationUser.user_id)
  const userIds = getFilteredUserIds(organizationUserIds, filters)

  if (userIds.length === 0) {
    return {
      total_certificates: 0,
      total_users_with_certificates: 0,
      certificates: [] as EnrichedCertificate[],
      certificates_by_course: [] as CertificatesByCourseSummary[],
      certificates_by_user: [] as CertificatesByUserSummary[],
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
  const certificateRows = (certificates || []) as CertificateRecord[]
  const courseIds = [...new Set(certificateRows.map((certificate) => certificate.course_id))]
  const courses =
    courseIds.length > 0
      ? (
          await supabase
            .from('courses')
            .select('id, title, category, level')
            .in('id', courseIds)
        ).data
      : []

  const courseRows = (courses || []) as CourseLookup[]
  const courseMap = new Map(courseRows.map((course) => [course.id, course]))
  const userMap = buildUserMap(organizationUsers)

  const enrichedCertificates: EnrichedCertificate[] = certificateRows.map((certificate) => {
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

  const certificatesByCourse = new Map<string, CertificatesByCourseSummary>()
  enrichedCertificates.forEach((certificate) => {
    const currentCourse = certificatesByCourse.get(certificate.course_id) || {
      course_id: certificate.course_id,
      course_title: certificate.course_title,
      count: 0,
    }
    currentCourse.count++
    certificatesByCourse.set(certificate.course_id, currentCourse)
  })

  const certificatesByUser = new Map<string, CertificatesByUserSummary>()
  enrichedCertificates.forEach((certificate) => {
    const currentUser = certificatesByUser.get(certificate.user_id) || {
      user_id: certificate.user_id,
      user_name: certificate.user_name,
      user_email: certificate.user_email,
      count: 0,
    }
    currentUser.count++
    certificatesByUser.set(certificate.user_id, currentUser)
  })

  return {
    total_certificates: enrichedCertificates.length,
    total_users_with_certificates: certificatesByUser.size,
    certificates: enrichedCertificates,
    certificates_by_course: Array.from(certificatesByCourse.values()),
    certificates_by_user: Array.from(certificatesByUser.values()),
  }
}
