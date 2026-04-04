import { createClient } from '../../../lib/supabase/server'
import { logger } from '../../../lib/utils/logger'

type BusinessUserStatsSupabaseClient = Awaited<ReturnType<typeof createClient>>

type Relation<T> = T | T[] | null

interface BusinessUserStatsQuizEnrollmentRecord {
  course_id: string
}

interface BusinessUserStatsLiaConversationRecord {
  conversation_id: string
  course_id: string | null
  lesson_id: string | null
  started_at: string | null
  ended_at: string | null
  total_messages: number | null
  conversation_completed: boolean | null
}

interface BusinessUserStatsLiaMessageRecord {
  message_id: string
  conversation_id: string
  role: string | null
  created_at: string | null
}

interface BusinessUserStatsQuizSubmissionRecord {
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

export interface EngagementQueryData {
  liaConversations: BusinessUserStatsLiaConversationRecord[]
  liaMessages: BusinessUserStatsLiaMessageRecord[]
  quizSubmissions: BusinessUserStatsQuizSubmissionRecord[]
}


export async function fetchEngagementData(
  supabase: BusinessUserStatsSupabaseClient,
  userId: string,
): Promise<EngagementQueryData> {
  const [
    liaConversationsResult,
    quizSubmissionsResult,
  ] = await Promise.all([
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
  ])

  if (liaConversationsResult.error) {
    logger.error('Error fetching LIA conversations:', liaConversationsResult.error)
  }
  if (quizSubmissionsResult.error) {
    logger.error('Error fetching quiz submissions:', quizSubmissionsResult.error)
  }

  const liaConversations = (liaConversationsResult.data || []) as unknown as BusinessUserStatsLiaConversationRecord[]
  const quizSubmissions = (quizSubmissionsResult.data || []) as unknown as BusinessUserStatsQuizSubmissionRecord[]

  const conversationIds = liaConversations
    .map((conversation) => conversation.conversation_id)
    .filter(Boolean)

  const liaMessagesResult =
    conversationIds.length > 0
      ? await supabase
          .from('lia_messages')
          .select('message_id, conversation_id, role, created_at')
          .in('conversation_id', conversationIds)
      : { data: [], error: null }

  if (liaMessagesResult.error) logger.error('Error fetching LIA messages:', liaMessagesResult.error)
  const liaMessages = (liaMessagesResult.data || []) as unknown as BusinessUserStatsLiaMessageRecord[]

  return { liaConversations, liaMessages, quizSubmissions }
}
