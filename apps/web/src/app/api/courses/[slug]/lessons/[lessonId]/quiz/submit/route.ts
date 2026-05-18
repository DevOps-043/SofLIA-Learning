import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

import { resolveCourseEnrollment } from '@/features/courses/services/course-enrollment.server.service'
import { SessionService } from '@/features/auth/services/session.service'
import { createClient } from '@/lib/supabase/server'

interface ExistingQuizSubmissionRow {
  is_passed: boolean | null
  percentage_score: number | null
  submission_id: string
}

interface QuizQuestionRow {
  correctAnswer?: string | number
  id?: string
  options?: string[]
  points?: number
  question_id?: string
  questionType?: string
}

interface QuizSubmissionMatch {
  activity_id?: string
  enrollment_id: string
  lesson_id: string
  material_id?: string
  user_id: string
}

function normalizeOption(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

function normalizeTrueFalse(value: string): string {
  const normalized = normalizeOption(value)

  if (normalized === 'true' || normalized === 'verdadero') {
    return 'verdadero'
  }

  if (normalized === 'false' || normalized === 'falso') {
    return 'falso'
  }

  return normalized
}

function isAnswerCorrect(
  question: QuizQuestionRow,
  selectedAnswer: string | number,
): boolean {
  const correctAnswer = question.correctAnswer
  const options = question.options || []

  if (question.questionType === 'true_false') {
    if (typeof selectedAnswer === 'number') {
      const selectedOption = options[selectedAnswer]

      if (typeof correctAnswer === 'string') {
        return (
          normalizeTrueFalse(selectedOption) === normalizeTrueFalse(correctAnswer)
        )
      }

      if (typeof correctAnswer === 'number') {
        return selectedAnswer === correctAnswer
      }
    }

    if (typeof selectedAnswer === 'string') {
      if (typeof correctAnswer === 'string') {
        return (
          normalizeTrueFalse(selectedAnswer) === normalizeTrueFalse(correctAnswer)
        )
      }

      if (typeof correctAnswer === 'number') {
        return (
          normalizeTrueFalse(selectedAnswer) ===
          normalizeTrueFalse(options[correctAnswer])
        )
      }
    }

    return false
  }

  if (typeof selectedAnswer === 'number') {
    if (typeof correctAnswer === 'number') {
      return selectedAnswer === correctAnswer
    }

    if (typeof correctAnswer === 'string') {
      const selectedOption = options[selectedAnswer]
      return normalizeOption(selectedOption) === normalizeOption(correctAnswer)
    }
  }

  if (typeof selectedAnswer === 'string') {
    if (typeof correctAnswer === 'string') {
      return normalizeOption(selectedAnswer) === normalizeOption(correctAnswer)
    }

    if (typeof correctAnswer === 'number') {
      return (
        normalizeOption(selectedAnswer) ===
        normalizeOption(options[correctAnswer])
      )
    }
  }

  return false
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> },
) {
  try {
    const { slug, lessonId } = await params
    const supabase = await createClient()

    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 },
      )
    }

    const body = await request.json()
    const organizationId =
      typeof body?.organizationId === 'string' &&
      body.organizationId.trim().length > 0
        ? body.organizationId.trim()
        : null

    const enrollment = await resolveCourseEnrollment(
      supabase,
      currentUser.id,
      course.id,
      organizationId,
    )

    if (!enrollment) {
      return NextResponse.json(
        { error: 'No estas inscrito en este curso' },
        { status: 404 },
      )
    }

    const enrollmentId = enrollment.enrollment_id
    const resolvedOrganizationId = enrollment.organization_id || organizationId
    const {
      answers,
      quizData,
      materialId,
      activityId,
      totalPoints,
    } = body as {
      activityId?: string | null
      answers?: Record<string, string | number>
      materialId?: string | null
      quizData?: QuizQuestionRow[] | { questions?: QuizQuestionRow[] }
      organizationId?: string | null
      totalPoints?: number
    }

    if (!answers || !quizData || (!materialId && !activityId)) {
      return NextResponse.json(
        {
          error:
            'Datos incompletos: se requieren answers, quizData y materialId o activityId',
        },
        { status: 400 },
      )
    }

    const { data: lesson, error: lessonError } = await supabase
      .from('course_lessons')
      .select('lesson_id')
      .eq('lesson_id', lessonId)
      .single()

    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: 'Leccion no encontrada' },
        { status: 404 },
      )
    }

    const questions = Array.isArray(quizData)
      ? quizData
      : Array.isArray(quizData.questions)
        ? quizData.questions
        : []
    const totalQuestions = questions.length

    let correctAnswers = 0
    let pointsEarned = 0

    for (const question of questions) {
      const questionId = question.id || question.question_id

      if (!questionId) {
        continue
      }

      const selectedAnswer = answers[questionId]

      if (
        selectedAnswer !== undefined &&
        isAnswerCorrect(question, selectedAnswer)
      ) {
        correctAnswers += 1
        pointsEarned += question.points || 1
      }
    }

    const percentageScore =
      totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100 * 100) / 100
        : 0
    const isPassed = percentageScore >= 80
    const calculatedTotalPoints =
      totalPoints ||
      questions.reduce(
        (sum: number, question: QuizQuestionRow) => sum + (question.points || 1),
        0,
      )
    const now = new Date().toISOString()

    const submissionQuery: QuizSubmissionMatch = {
      user_id: currentUser.id,
      lesson_id: lessonId,
      enrollment_id: enrollmentId,
    }

    if (materialId) {
      submissionQuery.material_id = materialId
    }

    if (activityId) {
      submissionQuery.activity_id = activityId
    }

    const { data: existingSubmission } = await supabase
      .from('user_quiz_submissions')
      .select('submission_id, percentage_score, is_passed')
      .match(submissionQuery)
      .single<ExistingQuizSubmissionRow>()

    const previousScore = existingSubmission?.percentage_score || 0
    const previousPassed = existingSubmission?.is_passed || false
    const shouldPersistAttempt =
      !existingSubmission || isPassed || !previousPassed
    const didImproveBestScore = percentageScore > previousScore
    const bestScore = existingSubmission
      ? Math.max(previousScore, percentageScore)
      : percentageScore

    let submissionResult: ExistingQuizSubmissionRow | Record<string, unknown>

    if (existingSubmission) {
      if (shouldPersistAttempt) {
        const { data, error } = await supabase
          .from('user_quiz_submissions')
          .update({
            user_answers: answers,
            score: correctAnswers,
            total_points: calculatedTotalPoints,
            percentage_score: percentageScore,
            is_passed: isPassed,
            completed_at: now,
            organization_id: resolvedOrganizationId,
            updated_at: now,
          })
          .eq('submission_id', existingSubmission.submission_id)
          .select()
          .single()

        if (error) {
          techDebtLogger.error('Error actualizando submission:', error)
          return NextResponse.json(
            { error: 'Error al actualizar respuestas del quiz' },
            { status: 500 },
          )
        }

        submissionResult = data
      } else {
        submissionResult = existingSubmission
      }
    } else {
      const { data, error } = await supabase
        .from('user_quiz_submissions')
        .insert({
          user_id: currentUser.id,
          lesson_id: lessonId,
          enrollment_id: enrollmentId,
          material_id: materialId || null,
          activity_id: activityId || null,
          organization_id: resolvedOrganizationId,
          user_answers: answers,
          score: correctAnswers,
          total_points: calculatedTotalPoints,
          percentage_score: percentageScore,
          is_passed: isPassed,
          completed_at: now,
        })
        .select()
        .single()

      if (error) {
        techDebtLogger.error('Error creando submission:', error)
        return NextResponse.json(
          { error: 'Error al guardar respuestas del quiz' },
          { status: 500 },
        )
      }

      submissionResult = data
    }

    const [materialQuizzes, activityQuizzes] = await Promise.all([
      supabase
        .from('lesson_materials')
        .select('material_id')
        .eq('lesson_id', lessonId)
        .eq('material_type', 'quiz'),
      supabase
        .from('lesson_activities')
        .select('activity_id')
        .eq('lesson_id', lessonId)
        .eq('activity_type', 'quiz')
        .eq('is_required', true),
    ])

    const hasQuizzes =
      ((materialQuizzes.data?.length || 0) + (activityQuizzes.data?.length || 0)) >
      0

    if (hasQuizzes && (!existingSubmission || isPassed || didImproveBestScore)) {
      const { data: existingProgress } = await supabase
        .from('user_lesson_progress')
        .select(
          'progress_id, quiz_progress_percentage, quiz_passed, video_progress_percentage',
        )
        .eq('enrollment_id', enrollmentId)
        .eq('lesson_id', lessonId)
        .single()

      const bestProgressScore = existingProgress?.quiz_progress_percentage
        ? Math.max(existingProgress.quiz_progress_percentage, percentageScore)
        : percentageScore
      const bestPassed = existingProgress?.quiz_passed || isPassed

      if (existingProgress) {
        const { error: progressUpdateError } = await supabase
          .from('user_lesson_progress')
          .update({
            quiz_progress_percentage: bestProgressScore,
            quiz_completed: true,
            quiz_passed: bestPassed,
            organization_id: resolvedOrganizationId,
            updated_at: now,
          })
          .eq('progress_id', existingProgress.progress_id)

        if (progressUpdateError) {
          techDebtLogger.error('Error actualizando progreso del quiz:', progressUpdateError)
          return NextResponse.json(
            { error: 'Error al actualizar el progreso del quiz' },
            { status: 500 },
          )
        }
      } else {
        const { error: progressInsertError } = await supabase
          .from('user_lesson_progress')
          .insert({
            user_id: currentUser.id,
            lesson_id: lessonId,
            enrollment_id: enrollmentId,
            organization_id: resolvedOrganizationId,
            quiz_progress_percentage: bestProgressScore,
            quiz_completed: true,
            quiz_passed: bestPassed,
            started_at: now,
            last_accessed_at: now,
          })

        if (progressInsertError) {
          techDebtLogger.error('Error creando progreso del quiz:', progressInsertError)
          return NextResponse.json(
            { error: 'Error al guardar el progreso del quiz' },
            { status: 500 },
          )
        }
      }
    }

    let message = ''
    if (!shouldPersistAttempt && existingSubmission) {
      message = `Ya habias aprobado este quiz con ${previousScore}%. Este intento no reemplazo tu intento aprobado.`
    } else if (
      existingSubmission &&
      !isPassed &&
      !previousPassed &&
      !didImproveBestScore
    ) {
      message = `Intento guardado. Tu mejor puntaje sigue siendo ${previousScore}%.`
    } else if (isPassed) {
      message = 'Quiz aprobado.'
    } else {
      message =
        'Quiz completado, pero no alcanzaste el 80% requerido. Puedes intentarlo de nuevo para mejorar tu puntaje.'
    }

    return NextResponse.json({
      success: true,
      message,
      saved: shouldPersistAttempt,
      result: {
        score: correctAnswers,
        totalQuestions,
        totalPoints: calculatedTotalPoints,
        pointsEarned,
        percentage: percentageScore,
        isPassed,
        submission: submissionResult,
        bestScore,
      },
    })
  } catch (error) {
    techDebtLogger.error(
      'Error en POST /api/courses/[slug]/lessons/[lessonId]/quiz/submit:',
      error,
    )
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 },
    )
  }
}
