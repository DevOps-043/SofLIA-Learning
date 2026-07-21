import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

import { quizSubmitSchema, type QuizSubmitBody } from '@/app/api/courses/_schemas'
import { resolveCourseEnrollment } from '@/features/courses/services/course-enrollment.server.service'
import { enqueueLessonAutoNoteJob } from '@/features/notebook/services/notebook-generation.server.service'
import { recordQuizAttempt } from '@/features/courses/services/quiz/record-quiz-attempt.service'
import {
  gradeQuiz,
  resolveGradableQuizQuestions,
} from '@/features/courses/services/quiz/grade-quiz.service'
import {
  resolveQuizAttempt,
  MAX_QUIZ_ATTEMPTS,
} from '@/features/courses/services/quiz/quiz-attempt-limit.service'
import { fetchRequiredLessonQuizStatus } from '@/features/courses/services/quiz/required-quiz-status.service'
import { SessionService } from '@/features/auth/services/session.service'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { createClient } from '@/lib/supabase/server'

interface ExistingQuizSubmissionRow {
  is_passed: boolean | null
  percentage_score: number | null
  submission_id: string
}

/**
 * Carga el contenido crudo del quiz (con la clave de respuestas) desde la BD.
 * SEGURIDAD: esta es la ÚNICA fuente de verdad para calificar; el body del cliente
 * nunca contiene la clave.
 */
async function loadQuizAnswerKeyContent(
  supabase: ReturnType<typeof createAdminClient>,
  input: { lessonId: string; materialId: string | null; activityId: string | null },
): Promise<unknown> {
  if (input.materialId) {
    const { data } = await supabase
      .from('lesson_materials')
      .select('content_data')
      .eq('material_id', input.materialId)
      .eq('lesson_id', input.lessonId)
      .maybeSingle()

    return (data as { content_data?: unknown } | null)?.content_data ?? null
  }

  if (input.activityId) {
    const { data } = await supabase
      .from('lesson_activities')
      .select('activity_content')
      .eq('activity_id', input.activityId)
      .eq('lesson_id', input.lessonId)
      .maybeSingle()

    return (data as { activity_content?: unknown } | null)?.activity_content ?? null
  }

  return null
}

async function handlePost(
  _request: NextRequest,
  body: QuizSubmitBody,
  { params }: { params: Promise<{ slug: string; lessonId: string }> },
) {
  try {
    const { slug, lessonId } = await params
    const supabase = await createClient()
    // Persisting user quiz data (submission, attempt history) is done with the
    // service-role client — the same pattern already used below for lesson
    // progress. The request is authenticated (SessionService) and authorized
    // (enrollment resolution) before any write, and this avoids RLS write
    // failures on the user-data tables.
    const writeClient = createAdminClient()

    // Three independent lookups — run in parallel to save 2 sequential RTTs.
    const [currentUser, courseResult, lessonResult] = await Promise.all([
      SessionService.getCurrentUser(),
      supabase.from('courses').select('id, title').eq('slug', slug).single(),
      supabase.from('course_lessons').select('lesson_id').eq('lesson_id', lessonId).single(),
    ])

    if (!currentUser) {
      return apiError('UNAUTHENTICATED', 'No autenticado.', 401)
    }

    const { data: course, error: courseError } = courseResult
    if (courseError || !course) {
      return apiError('COURSE_NOT_FOUND', 'Curso no encontrado.', 404)
    }

    const { data: lesson, error: lessonError } = lessonResult
    if (lessonError || !lesson) {
      return apiError('LESSON_NOT_FOUND', 'Leccion no encontrada.', 404)
    }

    const organizationId =
      body.organizationId && body.organizationId.trim().length > 0
        ? body.organizationId
        : null

    const enrollment = await resolveCourseEnrollment(
      supabase,
      currentUser.id,
      course.id,
      organizationId,
    )

    if (!enrollment) {
      return apiError('ENROLLMENT_NOT_FOUND', 'No estas inscrito en este curso.', 404)
    }

    const enrollmentId = enrollment.enrollment_id
    const resolvedOrganizationId = enrollment.organization_id || organizationId
    const { answers, materialId, activityId, durationSeconds } = body
    const normalizedMaterialId = materialId || null
    const normalizedActivityId = activityId || null

    // --- Calificación autoritativa en el servidor (clave desde BD) ---
    // Se lee con el cliente service-role (writeClient): el usuario ya está autenticado
    // y autorizado (enrollment), y así el grader siempre obtiene la clave sin depender
    // de la RLS de las tablas de contenido.
    const storedQuizContent = await loadQuizAnswerKeyContent(writeClient, {
      lessonId,
      materialId: normalizedMaterialId,
      activityId: normalizedActivityId,
    })
    const gradableQuestions = resolveGradableQuizQuestions(storedQuizContent)

    if (gradableQuestions.length === 0) {
      return apiError(
        'QUIZ_CONTENT_NOT_FOUND',
        'No se encontro el contenido del quiz para calificar.',
        404,
      )
    }

    // Estado previo (para "ya aprobado" y para decidir persistencia del mejor puntaje).
    let existingSubmissionQuery = writeClient
      .from('user_quiz_submissions')
      .select('submission_id, percentage_score, is_passed')
      .eq('user_id', currentUser.id)
      .eq('lesson_id', lessonId)

    if (normalizedMaterialId) {
      existingSubmissionQuery = existingSubmissionQuery.eq('material_id', normalizedMaterialId)
    }

    if (normalizedActivityId) {
      existingSubmissionQuery = existingSubmissionQuery.eq('activity_id', normalizedActivityId)
    }

    const { data: existingSubmission } = await existingSubmissionQuery
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<ExistingQuizSubmissionRow>()

    const previousScore = existingSubmission?.percentage_score || 0
    const previousPassed = existingSubmission?.is_passed || false

    // --- Límite de intentos + cooldown (no aplica si ya aprobó) ---
    const attemptDecision = await resolveQuizAttempt(writeClient, {
      userId: currentUser.id,
      lessonId,
      enrollmentId,
      materialId: normalizedMaterialId,
      activityId: normalizedActivityId,
      alreadyPassed: previousPassed,
    })

    if (attemptDecision.kind === 'limit_reached') {
      const retryAfterSeconds = Math.max(
        0,
        Math.ceil(
          (new Date(attemptDecision.retryAfter).getTime() - Date.now()) / 1000,
        ),
      )

      return apiError(
        'QUIZ_ATTEMPT_LIMIT_REACHED',
        `Alcanzaste el maximo de ${MAX_QUIZ_ATTEMPTS} intentos. Podras volver a intentarlo mas tarde.`,
        429,
        {
          details: { retryAfter: attemptDecision.retryAfter },
          headers: { 'Retry-After': String(retryAfterSeconds) },
        },
      )
    }

    const graded = gradeQuiz(gradableQuestions, answers)
    const {
      correctAnswers,
      pointsEarned,
      totalQuestions,
      totalPoints: calculatedTotalPoints,
      percentageScore,
      isPassed,
      perQuestion,
    } = graded
    const now = new Date().toISOString()

    const shouldPersistAttempt =
      !existingSubmission || isPassed || !previousPassed
    const didImproveBestScore = percentageScore > previousScore
    const bestScore = existingSubmission
      ? Math.max(previousScore, percentageScore)
      : percentageScore

    let submissionResult: ExistingQuizSubmissionRow | Record<string, unknown>

    if (existingSubmission) {
      if (shouldPersistAttempt) {
        const { data, error } = await writeClient
          .from('user_quiz_submissions')
          .update({
            enrollment_id: enrollmentId,
            user_answers: answers,
            score: correctAnswers,
            total_points: calculatedTotalPoints,
            percentage_score: percentageScore,
            is_passed: isPassed,
            completed_at: now,
            organization_id: resolvedOrganizationId,
            updated_at: now,
            duration_seconds: durationSeconds,
          })
          .eq('submission_id', existingSubmission.submission_id)
          .select()
          .single()

        if (error) {
          techDebtLogger.error('Error actualizando submission:', error)
          return apiError(
            'QUIZ_SUBMISSION_UPDATE_FAILED',
            'Error al actualizar respuestas del quiz.',
            500,
            { details: error.message },
          )
        }

        submissionResult = data
      } else {
        submissionResult = existingSubmission
      }
    } else {
      const { data, error } = await writeClient
        .from('user_quiz_submissions')
        .insert({
          user_id: currentUser.id,
          lesson_id: lessonId,
          enrollment_id: enrollmentId,
          material_id: normalizedMaterialId,
          activity_id: normalizedActivityId,
          organization_id: resolvedOrganizationId,
          user_answers: answers,
          score: correctAnswers,
          total_points: calculatedTotalPoints,
          percentage_score: percentageScore,
          is_passed: isPassed,
          completed_at: now,
          duration_seconds: durationSeconds,
        })
        .select()
        .single()

      if (error) {
        techDebtLogger.error('Error creando submission:', error)
        return apiError(
          'QUIZ_SUBMISSION_SAVE_FAILED',
          'Error al guardar respuestas del quiz.',
          500,
          { details: error.message },
        )
      }

      submissionResult = data
    }

    // Historial append-only: registra ESTE intento (cada envío). Se ESPERA (await)
    // porque el conteo de intentos del cooldown depende de que la fila exista antes
    // del siguiente envío. Si ya estaba aprobado, no consume/registra intento nuevo.
    if (attemptDecision.kind !== 'already_passed') {
      await recordQuizAttempt(writeClient, {
        userId: currentUser.id,
        lessonId,
        enrollmentId,
        materialId: normalizedMaterialId,
        activityId: normalizedActivityId,
        organizationId: resolvedOrganizationId,
        score: correctAnswers,
        totalPoints: calculatedTotalPoints,
        percentageScore,
        isPassed,
        durationSeconds: durationSeconds ?? null,
        completedAt: now,
      })
    }

    const quizStatus = await fetchRequiredLessonQuizStatus(supabase, {
      enrollmentId,
      lessonId,
      userId: currentUser.id,
    })

    if (
      quizStatus.hasRequiredQuizzes &&
      (!existingSubmission || isPassed || didImproveBestScore)
    ) {
      // Intentionally look up by (user_id, lesson_id) without filtering on
      // enrollment_id — the same enrollment-ID drift that affects submissions
      // can also affect progress rows. We self-heal enrollment_id on update.
      const { data: existingProgress } = await writeClient
        .from('user_lesson_progress')
        .select(
          'progress_id, quiz_progress_percentage, quiz_passed, video_progress_percentage',
        )
        .eq('user_id', currentUser.id)
        .eq('lesson_id', lessonId)
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle()

      const bestProgressScore = existingProgress?.quiz_progress_percentage
        ? Math.max(existingProgress.quiz_progress_percentage, percentageScore)
        : percentageScore
      const bestPassed = existingProgress?.quiz_passed || isPassed

      if (existingProgress) {
        const { error: progressUpdateError } = await writeClient
          .from('user_lesson_progress')
          .update({
            enrollment_id: enrollmentId,
            quiz_progress_percentage: bestProgressScore,
            quiz_completed: true,
            quiz_passed: bestPassed,
            organization_id: resolvedOrganizationId,
            updated_at: now,
          })
          .eq('progress_id', existingProgress.progress_id)

        if (progressUpdateError) {
          techDebtLogger.error('Error actualizando progreso del quiz:', progressUpdateError)
          return apiError(
            'QUIZ_PROGRESS_UPDATE_FAILED',
            'Error al actualizar el progreso del quiz.',
            500,
          )
        }
      } else {
        const { error: progressInsertError } = await writeClient
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
          return apiError(
            'QUIZ_PROGRESS_SAVE_FAILED',
            'Error al guardar el progreso del quiz.',
            500,
          )
        }
      }
    }

    if (isPassed && quizStatus.allQuizzesPassed) {
      try {
        if (resolvedOrganizationId) {
          await enqueueLessonAutoNoteJob({
            courseId: course.id,
            enrollmentId,
            lessonId,
            organizationId: resolvedOrganizationId,
            priority: 50,
            sourceVersion: `${now}:${percentageScore}`,
            userId: currentUser.id,
          })
        }
      } catch (enqueueError) {
        techDebtLogger.error('Lesson auto-note enqueue failed', {
          error:
            enqueueError instanceof Error ? enqueueError.message : enqueueError,
          lessonId,
          userId: currentUser.id,
        })
      }
    }

    const attemptsRemaining =
      attemptDecision.kind === 'can_attempt'
        ? Math.max(0, attemptDecision.attemptsRemaining - (isPassed ? 0 : 1))
        : null

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
        perQuestion,
        attemptsRemaining,
        maxAttempts: MAX_QUIZ_ATTEMPTS,
      },
    })
  } catch (error) {
    techDebtLogger.error(
      'Error en POST /api/courses/[slug]/lessons/[lessonId]/quiz/submit:',
      error,
    )
    return apiError('INTERNAL_ERROR', 'Error interno del servidor.', 500, {
      details: error instanceof Error ? error.message : 'Error desconocido',
    })
  }
}

export const POST = withZodBody(quizSubmitSchema, handlePost)
