import { buildQuestionResponseCounts, buildUserQuestionReactions } from './question-maps'
import type { SupabaseServerClient } from './types'

interface QuestionRow extends Record<string, unknown> {
  id: string
}

export async function loadCourseQuestions(
  supabase: SupabaseServerClient,
  courseId: string,
  userId: string | undefined,
) {
  const { data: questions, error } = await supabase
    .from('course_questions')
    .select(`
      *,
      user:users!course_questions_user_id_fkey(
        id, username, display_name, first_name, last_name, profile_picture_url
      )
    `)
    .eq('course_id', courseId)
    .eq('is_hidden', false)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !questions || questions.length === 0) return []

  const questionRows = questions as QuestionRow[]
  const questionIds = questionRows.map((question) => question.id)
  const [responsesResult, userReactionsResult] = await Promise.all([
    supabase.from('course_question_responses').select('question_id').in('question_id', questionIds).eq('is_deleted', false),
    userId
      ? supabase.from('course_question_reactions').select('question_id, reaction_type').eq('user_id', userId).in('question_id', questionIds)
      : Promise.resolve({ data: null, error: null }),
  ])
  const countsMap = buildQuestionResponseCounts(responsesResult.data || null)
  const reactionsMap = buildUserQuestionReactions(userReactionsResult.data || null)

  return questionRows.map((question) => ({
    ...question,
    response_count: countsMap.get(question.id) || 0,
    user_reaction: reactionsMap.get(question.id) || null,
  }))
}
