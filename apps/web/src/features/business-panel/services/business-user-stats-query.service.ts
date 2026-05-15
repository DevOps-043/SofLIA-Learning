// Barrel re-export — completion and engagement logic live in sub-files
import { logger } from '../../../lib/utils/logger'
import { createClient } from '../../../lib/supabase/server'
import { fetchCompletionData } from './business-user-stats-completion.service'
import { fetchEngagementData } from './business-user-stats-engagement.service'
import { fetchLearningPathCourseOrder } from './business-user-stats-learning-path.service'

type BusinessUserStatsSupabaseClient = Awaited<ReturnType<typeof createClient>>

type Relation<T> = T | T[] | null

// =============================================
// TYPE DEFINITIONS (unchanged — preserved for backward compatibility)
// =============================================

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
  video_progress_percentage: number | null
  required_activities_completed: number | null
  required_activities_total: number | null
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
  lesson_order_index: number | null
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
  /** course_id → order index derived from the user's assigned learning paths. */
  learningPathCourseOrder: Map<string, number>
}

export type BusinessUserStatsQueryResult =
  | { status: 'forbidden'; error: string }
  | { status: 'not_found'; error: string }
  | { status: 'ok'; data: BusinessUserStatsQueryData }

// =============================================
// HELPER
// =============================================

export function unwrapRelation<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) {
    return relation[0] || null
  }
  return relation || null
}

// =============================================
// MAIN ORCHESTRATOR (delegates to sub-files)
// =============================================

export async function fetchBusinessUserStatsData(
  supabase: BusinessUserStatsSupabaseClient,
  organizationId: string,
  userId: string,
): Promise<BusinessUserStatsQueryResult> {
  // Security validation: confirm user belongs to this org
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

  // Run completion, engagement and learning-path-order queries in parallel
  const [completionData, engagementData, learningPathCourseOrder] = await Promise.all([
    fetchCompletionData(supabase, organizationId, userId),
    fetchEngagementData(supabase, userId),
    fetchLearningPathCourseOrder(supabase, organizationId, userId),
  ])

  return {
    status: 'ok',
    data: {
      organizationUser,
      learningPathCourseOrder,
      enrollments: completionData.enrollments,
      lessonProgress: completionData.lessonProgress,
      lessons: completionData.lessons,
      courseModules: completionData.courseModules,
      lessonCounts: completionData.lessonCounts,
      activityCompletions: completionData.activityCompletions,
      lessonNotes: completionData.lessonNotes,
      certificates: completionData.certificates,
      instructors: completionData.instructors,
      assignments: completionData.assignments,
      liaConversations: engagementData.liaConversations,
      liaMessages: engagementData.liaMessages,
      quizSubmissions: engagementData.quizSubmissions,
    },
  }
}
