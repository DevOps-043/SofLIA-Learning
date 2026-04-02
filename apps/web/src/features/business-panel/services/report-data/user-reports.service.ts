import { logger } from '../../../../lib/utils/logger'
import type { ReportFilters } from '../../types/report-data.types'
import {
  getUserDisplayName,
  roundToSingleDecimal,
  type ReportSupabaseClient,
} from './shared'

export async function generateUsersReport(
  supabase: ReportSupabaseClient,
  organizationId: string,
  filters: ReportFilters,
) {
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

  if (filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters.role !== 'all') {
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

  const userIds = (organizationUsers || [])
    .filter((organizationUser: any) => organizationUser.users)
    .map((organizationUser: any) => organizationUser.users.id)

  let assignments: any[] = []
  let certificates: any[] = []

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

    assignments = assignmentsData || []
    certificates = certificatesData || []
  }

  const coursesByUser = new Map()
  const certificatesByUser = new Map()
  const progressByUser = new Map()

  assignments.forEach((assignment: any) => {
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

    const course = assignment.courses
    if (course) {
      coursesByUser.get(assignment.user_id).push({
        course_id: course.id,
        course_title: course.title,
        status: assignment.status,
        completion_percentage: assignment.completion_percentage || 0,
      })
    }

    const progress = progressByUser.get(assignment.user_id)
    progress.total_courses++
    if (assignment.status === 'completed') {
      progress.completed_courses++
    } else if (assignment.status === 'in_progress') {
      progress.in_progress_courses++
    }
    progress.total_progress += assignment.completion_percentage || 0
    progress.progress_count++
  })

  progressByUser.forEach((progress: any) => {
    progress.average_progress =
      progress.progress_count > 0
        ? roundToSingleDecimal(progress.total_progress / progress.progress_count)
        : 0
  })

  certificates.forEach((certificate: any) => {
    if (!certificatesByUser.has(certificate.user_id)) {
      certificatesByUser.set(certificate.user_id, [])
    }

    const course = certificate.courses
    if (course) {
      certificatesByUser.get(certificate.user_id).push({
        course_id: course.id,
        course_title: course.title,
        issued_at: certificate.issued_at,
      })
    }
  })

  const users = (organizationUsers || [])
    .filter((organizationUser: any) => organizationUser.users)
    .map((organizationUser: any) => {
      const userId = organizationUser.users.id
      const userCourses = coursesByUser.get(userId) || []
      const userCertificates = certificatesByUser.get(userId) || []
      const userProgress = progressByUser.get(userId) || {
        total_courses: 0,
        completed_courses: 0,
        in_progress_courses: 0,
        average_progress: 0,
      }

      return {
        user_id: userId,
        username: organizationUser.users.username,
        email: organizationUser.users.email,
        display_name: getUserDisplayName(organizationUser.users),
        first_name: organizationUser.users.first_name,
        last_name: organizationUser.users.last_name,
        role: organizationUser.role,
        job_title: organizationUser.job_title || 'No especificado',
        status: organizationUser.status,
        joined_at: organizationUser.joined_at,
        last_login_at: organizationUser.users.updated_at || organizationUser.users.last_login_at,
        created_at: organizationUser.users.created_at,
        courses: userCourses,
        certificates: userCertificates,
        progress: userProgress,
      }
    })

  return {
    total_users: users.length,
    users,
    summary: {
      by_job_title: users.reduce((accumulator: any, user: any) => {
        const jobTitle = user.job_title || 'No especificado'
        accumulator[jobTitle] = (accumulator[jobTitle] || 0) + 1
        return accumulator
      }, {}),
      by_status: users.reduce((accumulator: any, user: any) => {
        accumulator[user.status] = (accumulator[user.status] || 0) + 1
        return accumulator
      }, {}),
    },
  }
}

export async function generateCoursesReport(
  supabase: ReportSupabaseClient,
  organizationId: string,
  filters: ReportFilters,
) {
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

  const courseIds = [...new Set((assignments || []).map((assignment: any) => assignment.course_id))]

  if (courseIds.length === 0) {
    return {
      total_courses: 0,
      total_assignments: assignments?.length || 0,
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

  const courseMap = new Map()

  ;(coursesData || []).forEach((course: any) => {
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

  ;(assignments || []).forEach((assignment: any) => {
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

  const courses = Array.from(courseMap.values()).map((course: any) => {
    const { assigned_user_ids, ...courseSummary } = course
    return courseSummary
  })

  return {
    total_courses: courses.length,
    total_assignments: assignments?.length || 0,
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
