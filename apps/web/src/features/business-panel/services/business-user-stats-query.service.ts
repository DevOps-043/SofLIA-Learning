import { logger } from '../../../lib/utils/logger'
import { createClient } from '../../../lib/supabase/server'

type BusinessUserStatsSupabaseClient = Awaited<ReturnType<typeof createClient>>

type Relation<T> = T | T[] | null

interface BusinessUserStatsProfileRecord {
  id: string
  username: string
  email: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  profile_picture_url: string | null
}

export interface BusinessUserStatsOrganizationUserRecord {
  user_id: string
  organization_id: string
  joined_at: string | null
  role: string | null
  job_title: string | null
  users: Relation<BusinessUserStatsProfileRecord>
}

interface BusinessUserStatsCourseRelationRecord {
  id: string
  title: string | null
  slug?: string | null
  thumbnail_url?: string | null
  category?: string | null
  level?: string | null
  instructor_id?: string | null
}

export interface BusinessUserStatsEnrollmentRecord {
  enrollment_id: string
  enrollment_status: string | null
  overall_progress_percentage: number | null
  enrolled_at: string | null
  started_at: string | null
  completed_at: string | null
  last_accessed_at: string | null
  course_id: string
  courses: Relation<BusinessUserStatsCourseRelationRecord>
}

interface BusinessUserStatsEnrollmentCourseRecord {
  course_id: string
  courses: Relation<Pick<BusinessUserStatsCourseRelationRecord, 'id' | 'title'>>
}

export interface BusinessUserStatsLessonProgressRecord {
  progress_id: string
  lesson_status: string | null
  is_completed: boolean | null
  time_spent_minutes: number | null
  completed_at: string | null
  started_at: string | null
  enrollment_id: string | null
  lesson_id: string
  quiz_progress_percentage: number | null
  quiz_completed: boolean | null
  quiz_passed: boolean | null
  user_course_enrollments: Relation<BusinessUserStatsEnrollmentCourseRecord>
}

interface BusinessUserStatsCourseModuleRelationRecord {
  module_id: string
  module_title: string | null
  module_order_index: number | null
  course_id: string | null
}

export interface BusinessUserStatsLessonRecord {
  lesson_id: string
  lesson_title: string | null
  module_id: string | null
  course_modules: Relation<BusinessUserStatsCourseModuleRelationRecord>
}

export interface BusinessUserStatsCourseModuleRecord {
  module_id: string
  module_title: string | null
  module_order_index: number | null
  course_id: string
}

export interface BusinessUserStatsLessonCountRecord {
  lesson_id: string
  module_id: string
}

interface BusinessUserStatsCourseModuleNestedRecord {
  module_id: string
  course_id: string | null
}

interface BusinessUserStatsCourseLessonNestedRecord {
  lesson_id: string
  module_id: string | null
  course_modules: Relation<BusinessUserStatsCourseModuleNestedRecord>
}

interface BusinessUserStatsLessonActivityRecord {
  activity_id: string
  activity_title: string | null
  activity_type: string | null
  lesson_id: string | null
  course_lessons: Relation<BusinessUserStatsCourseLessonNestedRecord>
}

export interface BusinessUserStatsActivityCompletionRecord {
  completion_id: string
  activity_id: string
  status: string | null
  completed_steps: number | null
  total_steps: number | null
  time_to_complete_seconds: number | null
  attempts_to_complete: number | null
  completed_at: string | null
  lesson_activities: Relation<BusinessUserStatsLessonActivityRecord>
}

export interface BusinessUserStatsLessonNoteRecord {
  note_id: string
  lesson_id: string | null
  is_auto_generated: boolean | null
  course_lessons: Relation<BusinessUserStatsCourseLessonNestedRecord>
}

export interface BusinessUserStatsCertificateRecord {
  certificate_id: string
  certificate_url: string | null
  certificate_hash: string | null
  course_id: string
  issued_at: string | null
  expires_at: string | null
  courses: Relation<BusinessUserStatsCourseRelationRecord>
}

export interface BusinessUserStatsInstructorRecord {
  id: string
  first_name: string | null
  last_name: string | null
  username: string | null
}

export interface BusinessUserStatsLiaConversationRecord {
  conversation_id: string
  course_id: string | null
  lesson_id: string | null
  started_at: string | null
  ended_at: string | null
  total_messages: number | null
  conversation_completed: boolean | null
}

export interface BusinessUserStatsLiaMessageRecord {
  message_id: string
  conversation_id: string
  role: string | null
  created_at: string | null
}

interface BusinessUserStatsQuizEnrollmentRecord {
  course_id: string
}

export interface BusinessUserStatsQuizSubmissionRecord {
  submission_id: string
  score: number | null
  total_points: number | null
  percentage_score: number | null
  is_passed: boolean | null
  completed_at: string | null
  created_at: string | null
  lesson_id: string | null
  enrollment_id: string | null
  user_course_enrollments: Relation<BusinessUserStatsQuizEnrollmentRecord>
}

export interface BusinessUserStatsAssignmentRecord {
  id: string
  course_id: string
  status: string | null
  completion_percentage: number | null
  assigned_at: string | null
  due_date: string | null
  completed_at: string | null
  courses: Relation<Pick<BusinessUserStatsCourseRelationRecord, 'id' | 'title'>>
}

export interface BusinessUserStatsQueryData {
  organizationUser: BusinessUserStatsOrganizationUserRecord
  enrollments: BusinessUserStatsEnrollmentRecord[]
  lessonProgress: BusinessUserStatsLessonProgressRecord[]
  lessons: BusinessUserStatsLessonRecord[]
  courseModules: BusinessUserStatsCourseModuleRecord[]
  lessonCounts: BusinessUserStatsLessonCountRecord[]
  activityCompletions: BusinessUserStatsActivityCompletionRecord[]
  lessonNotes: BusinessUserStatsLessonNoteRecord[]
  certificates: BusinessUserStatsCertificateRecord[]
  instructors: BusinessUserStatsInstructorRecord[]
  liaConversations: BusinessUserStatsLiaConversationRecord[]
  liaMessages: BusinessUserStatsLiaMessageRecord[]
  quizSubmissions: BusinessUserStatsQuizSubmissionRecord[]
  assignments: BusinessUserStatsAssignmentRecord[]
}

export type BusinessUserStatsQueryResult =
  | { status: 'forbidden'; error: string }
  | { status: 'not_found'; error: string }
  | { status: 'ok'; data: BusinessUserStatsQueryData }

export async function fetchBusinessUserStatsData(
  supabase: BusinessUserStatsSupabaseClient,
  organizationId: string,
  userId: string,
): Promise<BusinessUserStatsQueryResult> {
  const organizationUserResult = await supabase
    .from('organization_users')
    .select(`
      user_id,
      organization_id,
      joined_at,
      role,
      job_title,
      users!organization_users_user_id_fkey (
        id,
        username,
        email,
        first_name,
        last_name,
        display_name,
        profile_picture_url
      )
    `)
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .single()

  if (organizationUserResult.error || !organizationUserResult.data) {
    logger.error('Business user stats security validation failed', {
      userId,
      organizationId,
      error: organizationUserResult.error,
    })

    return {
      status: 'forbidden',
      error: 'Usuario no encontrado o no pertenece a tu organización',
    }
  }

  const organizationUser =
    organizationUserResult.data as unknown as BusinessUserStatsOrganizationUserRecord

  const [
    enrollmentsResult,
    lessonProgressResult,
    activityCompletionsResult,
    lessonNotesResult,
    certificatesResult,
    liaConversationsResult,
    quizSubmissionsResult,
    assignmentsResult,
  ] = await Promise.all([
    supabase
      .from('user_course_enrollments')
      .select(`
        enrollment_id,
        enrollment_status,
        overall_progress_percentage,
        enrolled_at,
        started_at,
        completed_at,
        last_accessed_at,
        course_id,
        courses (
          id,
          title,
          slug,
          thumbnail_url,
          category,
          level
        )
      `)
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false }),

    supabase
      .from('user_lesson_progress')
      .select(`
        progress_id,
        lesson_status,
        is_completed,
        time_spent_minutes,
        completed_at,
        started_at,
        enrollment_id,
        lesson_id,
        quiz_progress_percentage,
        quiz_completed,
        quiz_passed,
        user_course_enrollments!inner (
          course_id,
          courses (
            id,
            title
          )
        )
      `)
      .eq('user_id', userId),

    supabase
      .from('lia_activity_completions')
      .select(`
        completion_id,
        activity_id,
        status,
        completed_steps,
        total_steps,
        time_to_complete_seconds,
        attempts_to_complete,
        completed_at,
        lesson_activities (
          activity_id,
          activity_title,
          activity_type,
          lesson_id,
          course_lessons (
            lesson_id,
            module_id,
            course_modules (
              module_id,
              course_id
            )
          )
        )
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false }),

    supabase
      .from('user_lesson_notes')
      .select(`
        note_id,
        lesson_id,
        is_auto_generated,
        course_lessons (
          lesson_id,
          module_id,
          course_modules (
            module_id,
            course_id
          )
        )
      `)
      .eq('user_id', userId),

    supabase
      .from('user_course_certificates')
      .select(`
        certificate_id,
        certificate_url,
        certificate_hash,
        course_id,
        issued_at,
        expires_at,
        courses (
          id,
          title,
          slug,
          thumbnail_url,
          instructor_id
        )
      `)
      .eq('user_id', userId)
      .order('issued_at', { ascending: false }),

    supabase
      .from('lia_conversations')
      .select(`
        conversation_id,
        course_id,
        lesson_id,
        started_at,
        ended_at,
        total_messages,
        conversation_completed
      `)
      .eq('user_id', userId)
      .order('started_at', { ascending: false }),

    supabase
      .from('user_quiz_submissions')
      .select(`
        submission_id,
        score,
        total_points,
        percentage_score,
        is_passed,
        completed_at,
        created_at,
        lesson_id,
        enrollment_id,
        user_course_enrollments!inner(course_id)
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false }),

    supabase
      .from('organization_course_assignments')
      .select(`
        id,
        course_id,
        status,
        completion_percentage,
        assigned_at,
        due_date,
        completed_at,
        courses (
          id,
          title
        )
      `)
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .order('assigned_at', { ascending: false }),
  ])

  if (enrollmentsResult.error) logger.error('Error fetching enrollments:', enrollmentsResult.error)
  if (lessonProgressResult.error) {
    logger.error('Error fetching lesson progress:', lessonProgressResult.error)
  }
  if (activityCompletionsResult.error) {
    logger.error('Error fetching activity completions:', activityCompletionsResult.error)
  }
  if (lessonNotesResult.error) logger.error('Error fetching lesson notes:', lessonNotesResult.error)
  if (certificatesResult.error) logger.error('Error fetching certificates:', certificatesResult.error)
  if (liaConversationsResult.error) {
    logger.error('Error fetching LIA conversations:', liaConversationsResult.error)
  }
  if (quizSubmissionsResult.error) {
    logger.error('Error fetching quiz submissions:', quizSubmissionsResult.error)
  }
  if (assignmentsResult.error) logger.error('Error fetching assignments:', assignmentsResult.error)

  const enrollments = (enrollmentsResult.data ||
    []) as unknown as BusinessUserStatsEnrollmentRecord[]
  const lessonProgress = (lessonProgressResult.data ||
    []) as unknown as BusinessUserStatsLessonProgressRecord[]
  const activityCompletions = (activityCompletionsResult.data ||
    []) as unknown as BusinessUserStatsActivityCompletionRecord[]
  const lessonNotes = (lessonNotesResult.data ||
    []) as unknown as BusinessUserStatsLessonNoteRecord[]
  const certificates = (certificatesResult.data ||
    []) as unknown as BusinessUserStatsCertificateRecord[]
  const liaConversations = (liaConversationsResult.data ||
    []) as unknown as BusinessUserStatsLiaConversationRecord[]
  const quizSubmissions = (quizSubmissionsResult.data ||
    []) as unknown as BusinessUserStatsQuizSubmissionRecord[]
  const assignments = (assignmentsResult.data ||
    []) as unknown as BusinessUserStatsAssignmentRecord[]

  const lessonIds = Array.from(
    new Set(lessonProgress.map((progress) => progress.lesson_id).filter(Boolean)),
  )
  const courseIds = Array.from(
    new Set(enrollments.map((enrollment) => enrollment.course_id).filter(Boolean)),
  )
  const instructorIds = Array.from(
    new Set(
      certificates
        .map((certificate) => unwrapRelation(certificate.courses)?.instructor_id)
        .filter(Boolean),
    ),
  ) as string[]
  const conversationIds = liaConversations
    .map((conversation) => conversation.conversation_id)
    .filter(Boolean)

  const lessonsResult =
    lessonIds.length > 0
      ? await supabase
          .from('course_lessons')
          .select(`
            lesson_id,
            lesson_title,
            module_id,
            course_modules (
              module_id,
              module_title,
              module_order_index,
              course_id
            )
          `)
          .in('lesson_id', lessonIds)
      : { data: [], error: null }

  if (lessonsResult.error) logger.error('Error fetching lessons:', lessonsResult.error)
  const lessons = (lessonsResult.data || []) as unknown as BusinessUserStatsLessonRecord[]

  const courseModulesResult =
    courseIds.length > 0
      ? await supabase
          .from('course_modules')
          .select(`
            module_id,
            module_title,
            module_order_index,
            course_id
          `)
          .in('course_id', courseIds)
          .order('module_order_index', { ascending: true })
      : { data: [], error: null }

  if (courseModulesResult.error) {
    logger.error('Error fetching course modules:', courseModulesResult.error)
  }
  const courseModules =
    (courseModulesResult.data || []) as unknown as BusinessUserStatsCourseModuleRecord[]

  const moduleIds = courseModules.map((module) => module.module_id).filter(Boolean)
  const lessonCountsResult =
    moduleIds.length > 0
      ? await supabase
          .from('course_lessons')
          .select('lesson_id, module_id')
          .in('module_id', moduleIds)
          .eq('is_published', true)
      : { data: [], error: null }

  if (lessonCountsResult.error) {
    logger.error('Error fetching lesson counts:', lessonCountsResult.error)
  }
  const lessonCounts =
    (lessonCountsResult.data || []) as unknown as BusinessUserStatsLessonCountRecord[]

  const instructorsResult =
    instructorIds.length > 0
      ? await supabase
          .from('users')
          .select('id, first_name, last_name, username')
          .in('id', instructorIds)
      : { data: [], error: null }

  if (instructorsResult.error) {
    logger.error('Error fetching instructors:', instructorsResult.error)
  }
  const instructors =
    (instructorsResult.data || []) as unknown as BusinessUserStatsInstructorRecord[]

  const liaMessagesResult =
    conversationIds.length > 0
      ? await supabase
          .from('lia_messages')
          .select('message_id, conversation_id, role, created_at')
          .in('conversation_id', conversationIds)
      : { data: [], error: null }

  if (liaMessagesResult.error) logger.error('Error fetching LIA messages:', liaMessagesResult.error)
  const liaMessages =
    (liaMessagesResult.data || []) as unknown as BusinessUserStatsLiaMessageRecord[]

  return {
    status: 'ok',
    data: {
      organizationUser,
      enrollments,
      lessonProgress,
      lessons,
      courseModules,
      lessonCounts,
      activityCompletions,
      lessonNotes,
      certificates,
      instructors,
      liaConversations,
      liaMessages,
      quizSubmissions,
      assignments,
    },
  }
}

export function unwrapRelation<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) {
    return relation[0] || null
  }

  return relation || null
}
