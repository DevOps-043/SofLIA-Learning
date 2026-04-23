import { SupabaseClient } from '@supabase/supabase-js'
import { ExistingQuizSubmissionRow, QuizGradeResult, QuizSubmissionMatch, QuizSubmitRequestBody } from './types'

export async function persistQuizSubmission(
  supabase: SupabaseClient,
  params: {
    userId: string
    lessonId: string
    enrollmentId: string
    body: QuizSubmitRequestBody
    grade: QuizGradeResult
  },
) {
  const { userId, lessonId, enrollmentId, body, grade } = params
  const now = new Date().toISOString()
  const submissionQuery: QuizSubmissionMatch = { user_id: userId, lesson_id: lessonId, enrollment_id: enrollmentId }
  if (body.materialId) submissionQuery.material_id = body.materialId
  if (body.activityId) submissionQuery.activity_id = body.activityId

  const { data: existingSubmission } = await supabase
    .from('user_quiz_submissions')
    .select('submission_id, percentage_score, is_passed')
    .match(submissionQuery)
    .single<ExistingQuizSubmissionRow>()

  const previousScore = existingSubmission?.percentage_score || 0
  const previousPassed = existingSubmission?.is_passed || false
  const shouldPersistAttempt = !existingSubmission || grade.isPassed || !previousPassed
  const didImproveBestScore = grade.percentageScore > previousScore
  const bestScore = existingSubmission ? Math.max(previousScore, grade.percentageScore) : grade.percentageScore

  const submissionResult = existingSubmission
    ? shouldPersistAttempt
      ? await updateExistingSubmission(supabase, existingSubmission.submission_id, body, grade, now)
      : existingSubmission
    : await createSubmission(supabase, userId, lessonId, enrollmentId, body, grade, now)

  return { bestScore, didImproveBestScore, existingSubmission, previousPassed, previousScore, shouldPersistAttempt, submissionResult }
}

async function updateExistingSubmission(
  supabase: SupabaseClient,
  submissionId: string,
  body: QuizSubmitRequestBody,
  grade: QuizGradeResult,
  now: string,
) {
  const { data, error } = await supabase
    .from('user_quiz_submissions')
    .update({
      user_answers: body.answers,
      score: grade.correctAnswers,
      total_points: grade.calculatedTotalPoints,
      percentage_score: grade.percentageScore,
      is_passed: grade.isPassed,
      completed_at: now,
      updated_at: now,
    })
    .eq('submission_id', submissionId)
    .select()
    .single()

  if (error) throw Object.assign(new Error('Error al actualizar respuestas del quiz'), { status: 500 })
  return data
}

async function createSubmission(
  supabase: SupabaseClient,
  userId: string,
  lessonId: string,
  enrollmentId: string,
  body: QuizSubmitRequestBody,
  grade: QuizGradeResult,
  now: string,
) {
  const { data, error } = await supabase
    .from('user_quiz_submissions')
    .insert({
      user_id: userId,
      lesson_id: lessonId,
      enrollment_id: enrollmentId,
      material_id: body.materialId || null,
      activity_id: body.activityId || null,
      user_answers: body.answers,
      score: grade.correctAnswers,
      total_points: grade.calculatedTotalPoints,
      percentage_score: grade.percentageScore,
      is_passed: grade.isPassed,
      completed_at: now,
    })
    .select()
    .single()

  if (error) throw Object.assign(new Error('Error al guardar respuestas del quiz'), { status: 500 })
  return data
}
