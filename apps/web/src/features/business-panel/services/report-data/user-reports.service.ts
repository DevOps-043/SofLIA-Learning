import { logger } from '../../../../lib/utils/logger'
import type { ReportFilters } from '../../types/report-data.types'
import {
  getUserDisplayName,
  roundToSingleDecimal,
  type ActiveOrganizationUser,
  type ReportSupabaseClient,
} from './shared'

interface CourseReference {
  id: string
  title: string | null
}

interface AssignmentWithCourse {
  user_id: string
  course_id: string
  status: string | null
  completion_percentage: number | null
  courses: CourseReference | null
}

interface CertificateWithCourse {
  user_id: string
  course_id: string
  issued_at: string | null
  courses: CourseReference | null
}

interface UserProgressAccumulator {
  total_courses: number
  completed_courses: number
  in_progress_courses: number
  average_progress: number
  total_progress: number
  progress_count: number
}

interface UserCourseSummary {
  course_id: string
  course_title: string | null
  status: string | null
  completion_percentage: number
}

interface UserCertificateSummary {
  course_id: string
  course_title: string | null
  issued_at: string | null
}

export interface UserReportEntry {
  user_id: string
  username: string | null
  email: string | null
  display_name: string
  first_name: string | null
  last_name: string | null
  role: string | null
  job_title: string
  status: string | null
  joined_at: string | null
  last_login_at: string | null
  created_at: string | null
  courses: UserCourseSummary[]
  certificates: UserCertificateSummary[]
  progress: Omit<UserProgressAccumulator, 'total_progress' | 'progress_count'>
}

export interface UsersReport {
  total_users: number
  users: UserReportEntry[]
  summary: {
    by_job_title: Record<string, number>
    by_status: Record<string, number>
  }
}

interface CourseAssignmentRecord {
  id: string
  course_id: string
  user_id: string
  status: string | null
  completion_percentage: number | null
  assigned_at: string | null
  completed_at: string | null
  due_date: string | null
}

interface CourseRecord {
  id: string
  title: string | null
  category: string | null
  level: string | null
  duration_total_minutes: number | null
  thumbnail_url: string | null
}

interface CourseAccumulator {
  course_id: string
  course_title: string | null
  category: string | null
  level: string | null
  duration_minutes: number | null
  total_assigned: number
  completed: number
  in_progress: number
  not_started: number
  average_progress: number
  total_users: number
  assigned_user_ids: Set<string>
}

export interface CourseReportEntry {
  course_id: string
  course_title: string | null
  category: string | null
  level: string | null
  duration_minutes: number | null
  total_assigned: number
  completed: number
  in_progress: number
  not_started: number
  average_progress: number
  total_users: number
}

export interface CoursesReport {
  total_courses: number
  total_assignments: number
  courses: CourseReportEntry[]
  summary: {
    total_completed: number
    total_in_progress: number
    total_not_started: number
    average_completion_rate: number
  }
}

function getOrganizationUserRows(
  organizationUsers: ActiveOrganizationUser[] | null | undefined,
): ActiveOrganizationUser[] {
  return (organizationUsers || []).filter(
    (organizationUser): organizationUser is ActiveOrganizationUser => Boolean(organizationUser.users),
  )
}

export async function generateUsersReport(
  supabase: ReportSupabaseClient,
  organizationId: string,
  filters: ReportFilters,
): Promise<UsersReport> {
  let query = supabase
    .from('organization_users')
    .select(`
      role,
      status,
      joined_at,
      user_id,
      job_title,
      users!organization_users_user_id_fkey (
        id,
        username,
        email,
        first_name,
        last_name,
        display_name,
        profile_picture_url,
        last_login_at,
        created_at,
        updated_at
      )
    `)
    .eq('organization_id', organizationId)

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters.role && filters.role !== 'all') {
    query = query.eq('role', filters.role)
  }

  if (filters.user_ids?.length) {
    query = query.in('user_id', filters.user_ids)
  }

  if (filters.start_date) {
    query = query.gte('joined_at', filters.start_date)
  }

  if (filters.end_date) {
    query = query.lte('joined_at', filters.end_date)
  }

  const { data: organizationUsers, error } = await query.order('joined_at', { ascending: false })

  if (error) {
    logger.error('Error fetching users for report:', error)
    throw error
  }

  const organizationUserRows = getOrganizationUserRows(
    organizationUsers as ActiveOrganizationUser[] | null | undefined,
  )
  const userIds = organizationUserRows.map((organizationUser) => organizationUser.users!.id)

  let assignments: AssignmentWithCourse[] = []
  let certificates: CertificateWithCourse[] = []

  if (userIds.length > 0) {
    const [{ data: assignmentsData }, { data: certificatesData }] = await Promise.all([
      supabase
        .from('organization_course_assignments')
        .select(
          'user_id, course_id, status, completion_percentage, courses!organization_course_assignments_course_id_fkey (id, title)',
        )
        .eq('organization_id', organizationId)
        .in('user_id', userIds),
      supabase
        .from('user_course_certificates')
        .select(
          'user_id, course_id, issued_at, courses!user_course_certificates_course_id_fkey (id, title)',
        )
        .in('user_id', userIds),
    ])

    assignments = (assignmentsData || []) as AssignmentWithCourse[]
    certificates = (certificatesData || []) as CertificateWithCourse[]
  }

  const coursesByUser = new Map<string, UserCourseSummary[]>()
  const certificatesByUser = new Map<string, UserCertificateSummary[]>()
  const progressByUser = new Map<string, UserProgressAccumulator>()

  assignments.forEach((assignment) => {
    if (!coursesByUser.has(assignment.user_id)) {
      coursesByUser.set(assignment.user_id, [])
    }

    if (!progressByUser.has(assignment.user_id)) {
      progressByUser.set(assignment.user_id, {
        total_courses: 0,
        completed_courses: 0,
        in_progress_courses: 0,
        average_progress: 0,
        total_progress: 0,
        progress_count: 0,
      })
    }

    if (assignment.courses) {
      coursesByUser.get(assignment.user_id)?.push({
        course_id: assignment.courses.id,
        course_title: assignment.courses.title,
        status: assignment.status,
        completion_percentage: assignment.completion_percentage || 0,
      })
    }

    const progress = progressByUser.get(assignment.user_id)
    if (!progress) {
      return
    }

    progress.total_courses++
    if (assignment.status === 'completed') {
      progress.completed_courses++
    } else if (assignment.status === 'in_progress') {
      progress.in_progress_courses++
    }
    progress.total_progress += assignment.completion_percentage || 0
    progress.progress_count++
  })

  progressByUser.forEach((progress) => {
    progress.average_progress =
      progress.progress_count > 0
        ? roundToSingleDecimal(progress.total_progress / progress.progress_count)
        : 0
  })

  certificates.forEach((certificate) => {
    if (!certificatesByUser.has(certificate.user_id)) {
      certificatesByUser.set(certificate.user_id, [])
    }

    if (certificate.courses) {
      certificatesByUser.get(certificate.user_id)?.push({
        course_id: certificate.courses.id,
        course_title: certificate.courses.title,
        issued_at: certificate.issued_at,
      })
    }
  })

  const users: UserReportEntry[] = organizationUserRows.map((organizationUser) => {
    const user = organizationUser.users!
    const userId = user.id
    const userCourses = coursesByUser.get(userId) || []
    const userCertificates = certificatesByUser.get(userId) || []
    const userProgress = progressByUser.get(userId) || {
      total_courses: 0,
      completed_courses: 0,
      in_progress_courses: 0,
      average_progress: 0,
      total_progress: 0,
      progress_count: 0,
    }

    return {
      user_id: userId,
      username: user.username,
      email: user.email,
      display_name: getUserDisplayName(user),
      first_name: user.first_name,
      last_name: user.last_name,
      role: organizationUser.role || null,
      job_title: organizationUser.job_title || 'No especificado',
      status: organizationUser.status || null,
      joined_at: organizationUser.joined_at || null,
      last_login_at: user.updated_at || user.last_login_at || null,
      created_at: user.created_at || null,
      courses: userCourses,
      certificates: userCertificates,
      progress: {
        total_courses: userProgress.total_courses,
        completed_courses: userProgress.completed_courses,
        in_progress_courses: userProgress.in_progress_courses,
        average_progress: userProgress.average_progress,
      },
    }
  })

  return {
    total_users: users.length,
    users,
    summary: {
      by_job_title: users.reduce<Record<string, number>>((accumulator, user) => {
        const jobTitle = user.job_title || 'No especificado'
        accumulator[jobTitle] = (accumulator[jobTitle] || 0) + 1
        return accumulator
      }, {}),
      by_status: users.reduce<Record<string, number>>((accumulator, user) => {
        const status = user.status || 'unknown'
        accumulator[status] = (accumulator[status] || 0) + 1
        return accumulator
      }, {}),
    },
  }
}

export async function generateCoursesReport(
  supabase: ReportSupabaseClient,
  organizationId: string,
  filters: ReportFilters,
): Promise<CoursesReport> {
  let assignmentsQuery = supabase
    .from('organization_course_assignments')
    .select(`
      id,
      course_id,
      user_id,
      status,
      completion_percentage,
      assigned_at,
      completed_at,
      due_date
    `)
    .eq('organization_id', organizationId)

  if (filters.start_date) {
    assignmentsQuery = assignmentsQuery.gte('assigned_at', filters.start_date)
  }

  if (filters.end_date) {
    assignmentsQuery = assignmentsQuery.lte('assigned_at', filters.end_date)
  }

  if (filters.user_ids?.length) {
    assignmentsQuery = assignmentsQuery.in('user_id', filters.user_ids)
  }

  if (filters.course_ids?.length) {
    assignmentsQuery = assignmentsQuery.in('course_id', filters.course_ids)
  }

  const { data: assignments, error: assignmentsError } = await assignmentsQuery.order('assigned_at', {
    ascending: false,
  })

  if (assignmentsError) {
    logger.error('Error fetching course assignments:', assignmentsError)
  }

  const assignmentRows = (assignments || []) as CourseAssignmentRecord[]
  const courseIds = [...new Set(assignmentRows.map((assignment) => assignment.course_id))]

  if (courseIds.length === 0) {
    return {
      total_courses: 0,
      total_assignments: assignmentRows.length,
      courses: [],
      summary: {
        total_completed: 0,
        total_in_progress: 0,
        total_not_started: 0,
        average_completion_rate: 0,
      },
    }
  }

  let coursesQuery = supabase
    .from('courses')
    .select('id, title, category, level, duration_total_minutes, thumbnail_url')
    .in('id', courseIds)

  if (filters.course_ids?.length) {
    coursesQuery = coursesQuery.in('id', filters.course_ids)
  }

  const { data: coursesData, error: coursesError } = await coursesQuery

  if (coursesError) {
    logger.error('Error fetching courses for report:', coursesError)
  }

  const courseRows = (coursesData || []) as CourseRecord[]
  const courseMap = new Map<string, CourseAccumulator>()

  courseRows.forEach((course) => {
    courseMap.set(course.id, {
      course_id: course.id,
      course_title: course.title,
      category: course.category,
      level: course.level,
      duration_minutes: course.duration_total_minutes,
      total_assigned: 0,
      completed: 0,
      in_progress: 0,
      not_started: 0,
      average_progress: 0,
      total_users: 0,
      assigned_user_ids: new Set<string>(),
    })
  })

  assignmentRows.forEach((assignment) => {
    const course = courseMap.get(assignment.course_id)
    if (!course) {
      return
    }

    course.total_assigned++
    course.assigned_user_ids.add(assignment.user_id)
    course.total_users = course.assigned_user_ids.size

    if (assignment.status === 'completed') {
      course.completed++
    } else if (assignment.status === 'in_progress') {
      course.in_progress++
    } else {
      course.not_started++
    }

    course.average_progress =
      ((course.average_progress * (course.total_assigned - 1)) +
        (assignment.completion_percentage || 0)) /
      course.total_assigned
  })

  const courses: CourseReportEntry[] = Array.from(courseMap.values()).map((course) => {
    const { assigned_user_ids, ...courseSummary } = course
    return courseSummary
  })

  return {
    total_courses: courses.length,
    total_assignments: assignmentRows.length,
    courses,
    summary: {
      total_completed: courses.reduce((sum, course) => sum + course.completed, 0),
      total_in_progress: courses.reduce((sum, course) => sum + course.in_progress, 0),
      total_not_started: courses.reduce((sum, course) => sum + course.not_started, 0),
      average_completion_rate:
        courses.length > 0
          ? courses.reduce((sum, course) => sum + course.average_progress, 0) / courses.length
          : 0,
    },
  }
}
