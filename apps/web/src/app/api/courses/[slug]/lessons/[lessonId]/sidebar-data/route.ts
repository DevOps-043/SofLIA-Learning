import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SessionService } from '@/features/auth/services/session.service'
import { resolveCourseEnrollment } from '@/features/courses/services/course-enrollment.server.service'
import { resolveLearningPathAccessForCourse } from '@/features/learning-paths/services/learning-path-access.server'
import { buildQuizSubmissionSnapshot } from '@/features/courses/services/quiz-submission.service'
import { withCacheHeaders, cacheHeaders } from '@/lib/utils/cache-headers'
import { ContentTranslationService } from '@/core/services/contentTranslation.service'
import {
  buildActivitySubmissionSummaryMap,
} from '@/features/courses/services/activity-submission.server.service'
import {
  normalizeLearnLanguage,
  resolveCourseLessonByLanguage,
} from '@/app/api/courses/_services/lesson-language-resolution.service'

interface LessonActivityRow {
  activity_id: string
  activity_title: string | null
  activity_description: string | null
  activity_type: string | null
  is_required?: boolean | null
  [key: string]: unknown
}

interface LessonMaterialRow {
  material_id: string
  material_title: string | null
  material_description: string | null
  material_type: string | null
  [key: string]: unknown
}

interface LiaCompletionRow {
  activity_id: string
  status: string
}

interface QuizProgressRow {
  activity_id: string | null
  is_passed: boolean | null
}

interface QuizSubmissionRow {
  submission_id: string
  material_id: string | null
  activity_id: string | null
  percentage_score: number | null
  is_passed: boolean | null
  completed_at: string | null
  score: number | null
  user_answers: unknown
}

interface QuizStatusItem {
  id: string
  title: string | null
  type: 'material' | 'activity'
  isRequired?: boolean | null
  isCompleted: boolean
  isPassed: boolean
  latestSubmission: ReturnType<typeof buildQuizSubmissionSnapshot>
  percentage: number
  completedAt: string | null
}

interface QuizStatusResponse {
  hasRequiredQuizzes: boolean
  totalRequiredQuizzes: number
  completedQuizzes: number
  passedQuizzes: number
  allQuizzesPassed: boolean
  quizzes: QuizStatusItem[]
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> },
) {
  try {
    const { slug, lessonId } = await params
    const supabase = createAdminClient()
    const organizationId = request.nextUrl.searchParams.get('orgId')?.trim() || null
    const language = normalizeLearnLanguage(
      request.nextUrl.searchParams.get('language'),
    )

    const currentUser = await SessionService.getCurrentUser()
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, instructor_id')
      .eq('slug', slug)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
    }

    if (currentUser?.id) {
      const learningPathState = await resolveLearningPathAccessForCourse({
        userId: currentUser.id,
        courseId: course.id,
        organizationId,
      })

      if (learningPathState && !learningPathState.currentCourseUnlocked) {
        return withCacheHeaders(
          NextResponse.json(
            {
              error: 'CURSO_BLOQUEADO_POR_LEARNING_PATH',
              message:
                'Este taller aún está bloqueado dentro de su learning path.',
              learningPath: learningPathState,
            },
            { status: 423 },
          ),
          cacheHeaders.dynamic,
        )
      }
    }

    const resolvedLesson = await resolveCourseLessonByLanguage({
      supabase,
      courseId: course.id,
      lessonId,
      requestedLanguage: language,
    })

    if (!resolvedLesson.lesson || !resolvedLesson.baseLessonId) {
      return NextResponse.json(
        { error: 'Leccion no encontrada o no pertenece al curso' },
        { status: 404 },
      )
    }

    const resolvedLessonId = resolvedLesson.baseLessonId

    const [
      activitiesResult,
      materialsResult,
      materialQuizzesResult,
      activityQuizzesResult,
      enrollmentResult,
      liaCompletionsResult,
      quizSubmissionsResult,
    ] = await Promise.all([
      supabase
        .from('lesson_activities')
        .select('*')
        .eq('lesson_id', resolvedLessonId)
        .order('activity_order_index', { ascending: true })
        .returns<LessonActivityRow[]>(),

      supabase
        .from('lesson_materials')
        .select('*')
        .eq('lesson_id', resolvedLessonId)
        .order('material_order_index', { ascending: true })
        .returns<LessonMaterialRow[]>(),

      supabase
        .from('lesson_materials')
        .select('material_id, material_title, material_type')
        .eq('lesson_id', resolvedLessonId)
        .eq('material_type', 'quiz')
        .returns<LessonMaterialRow[]>(),

      supabase
        .from('lesson_activities')
        .select('activity_id, activity_title, activity_type, is_required')
        .eq('lesson_id', resolvedLessonId)
        .eq('activity_type', 'quiz')
        .eq('is_required', true)
        .returns<LessonActivityRow[]>(),

      currentUser
        ? resolveCourseEnrollment(supabase, currentUser.id, course.id, organizationId)
        : Promise.resolve(null),

      currentUser
        ? supabase
            .from('lia_activity_completions')
            .select('activity_id, status')
            .eq('user_id', currentUser.id)
            .eq('status', 'completed')
            .returns<LiaCompletionRow[]>()
        : Promise.resolve({ data: null, error: null }),

      currentUser
        ? supabase
            .from('user_quiz_submissions')
            .select('activity_id, is_passed')
            .eq('user_id', currentUser.id)
            .eq('lesson_id', resolvedLessonId)
            .returns<QuizProgressRow[]>()
        : Promise.resolve({ data: null, error: null }),
    ])

    if (activitiesResult.error) {
      console.error('Error fetching activities:', activitiesResult.error)
      return NextResponse.json({ error: 'Error al obtener actividades' }, { status: 500 })
    }

    if (materialsResult.error) {
      console.error('Error fetching materials:', materialsResult.error)
      return NextResponse.json({ error: 'Error al obtener materiales' }, { status: 500 })
    }

    let rawActivities = activitiesResult.data || []
    let materials = materialsResult.data || []

    if (rawActivities.length > 0) {
      try {
        rawActivities = (await ContentTranslationService.translateArray(
          'activity',
          rawActivities.map((activity) => ({ ...activity, id: activity.activity_id })),
          ['activity_title', 'activity_description'],
          language,
          supabase,
        )) as LessonActivityRow[]
      } catch {
        // Keep base content on translation errors.
      }
    }

    if (materials.length > 0) {
      try {
        materials = (await ContentTranslationService.translateArray(
          'material',
          materials.map((material) => ({ ...material, id: material.material_id })),
          ['material_title', 'material_description'],
          language,
          supabase,
        )) as LessonMaterialRow[]
      } catch {
        // Keep base content on translation errors.
      }
    }

    const activityIds = rawActivities.map((activity) => activity.activity_id)
    const liaCompletions = (liaCompletionsResult.data || []).filter((completion) =>
      activityIds.includes(completion.activity_id),
    )
    const quizSubmissions = (quizSubmissionsResult.data || []).filter(
      (submission) =>
        submission.activity_id !== null && activityIds.includes(submission.activity_id),
    )

    const completedActivityIds = new Set<string>([
      ...liaCompletions
        .filter((completion) => completion.status === 'completed')
        .map((completion) => completion.activity_id),
      ...quizSubmissions
        .filter(
          (submission): submission is QuizProgressRow & { activity_id: string } =>
            Boolean(submission.is_passed && submission.activity_id),
        )
        .map((submission) => submission.activity_id),
    ])

    if (currentUser && enrollmentResult) {
      const activitySubmissionSummaryMap = await buildActivitySubmissionSummaryMap(
        supabase,
        {
          courseId: course.id,
          courseTitle:
            typeof course.title === 'string' ? course.title : 'Curso',
          enrollmentId: enrollmentResult.enrollment_id,
          instructorId:
            typeof course.instructor_id === 'string'
              ? course.instructor_id
              : null,
          lessonId: resolvedLessonId,
          organizationId:
            enrollmentResult.organization_id ?? organizationId ?? null,
          userId: currentUser.id,
        },
        rawActivities,
      )

      activitySubmissionSummaryMap.forEach((summary, activityId) => {
        if (summary.completionSatisfied) {
          completedActivityIds.add(activityId)
        }
      })
    }

    const activities = rawActivities.map((activity) => ({
      ...activity,
      is_completed: completedActivityIds.has(activity.activity_id),
    }))

    let quizStatus: QuizStatusResponse = {
      hasRequiredQuizzes: false,
      totalRequiredQuizzes: 0,
      completedQuizzes: 0,
      passedQuizzes: 0,
      allQuizzesPassed: true,
      quizzes: [],
    }

    if (currentUser && enrollmentResult) {
      const materialQuizzesList = materialQuizzesResult.data || []
      const activityQuizzesList = activityQuizzesResult.data || []
      const totalRequiredQuizzes = materialQuizzesList.length + activityQuizzesList.length

      if (totalRequiredQuizzes > 0) {
        const { data: submissions } = await supabase
          .from('user_quiz_submissions')
          .select(
            'submission_id, material_id, activity_id, percentage_score, is_passed, completed_at, score, user_answers',
          )
          .eq('user_id', currentUser.id)
          .eq('lesson_id', resolvedLessonId)
          .eq('enrollment_id', enrollmentResult.enrollment_id)
          .returns<QuizSubmissionRow[]>()

        const submissionsList = submissions || []
        const quizzesStatusArray: QuizStatusItem[] = []

        for (const materialQuiz of materialQuizzesList) {
          const submission = submissionsList.find(
            (item) => item.material_id === materialQuiz.material_id,
          )

          quizzesStatusArray.push({
            id: materialQuiz.material_id,
            title: materialQuiz.material_title,
            type: 'material',
            isCompleted: !!submission,
            isPassed: submission?.is_passed || false,
            latestSubmission: buildQuizSubmissionSnapshot({
              completedAt: submission?.completed_at,
              score: submission?.score,
              submissionId: submission?.submission_id,
              userAnswers: submission?.user_answers,
            }),
            percentage: submission?.percentage_score || 0,
            completedAt: submission?.completed_at || null,
          })
        }

        for (const activityQuiz of activityQuizzesList) {
          const submission = submissionsList.find(
            (item) => item.activity_id === activityQuiz.activity_id,
          )

          quizzesStatusArray.push({
            id: activityQuiz.activity_id,
            title: activityQuiz.activity_title,
            type: 'activity',
            isRequired: activityQuiz.is_required,
            isCompleted: !!submission,
            isPassed: submission?.is_passed || false,
            latestSubmission: buildQuizSubmissionSnapshot({
              completedAt: submission?.completed_at,
              score: submission?.score,
              submissionId: submission?.submission_id,
              userAnswers: submission?.user_answers,
            }),
            percentage: submission?.percentage_score || 0,
            completedAt: submission?.completed_at || null,
          })
        }

        const completedQuizzes = quizzesStatusArray.filter((q) => q.isCompleted).length
        const passedQuizzes = quizzesStatusArray.filter((q) => q.isPassed).length
        const allQuizzesPassed = quizzesStatusArray.every((q) => q.isPassed)

        quizStatus = {
          hasRequiredQuizzes: true,
          totalRequiredQuizzes,
          completedQuizzes,
          passedQuizzes,
          allQuizzesPassed,
          quizzes: quizzesStatusArray,
        }
      }
    }

    const missingPieces = [...resolvedLesson.translationContext.missingPieces]
    if (resolvedLesson.translationContext.usedFallback && activities.length === 0) {
      missingPieces.push('activities')
    }
    if (resolvedLesson.translationContext.usedFallback && materials.length === 0) {
      missingPieces.push('materials')
    }

    const response = {
      activities,
      materials,
      quizStatus,
      translationContext: {
        ...resolvedLesson.translationContext,
        usedFallback:
          resolvedLesson.translationContext.usedFallback ||
          missingPieces.length > resolvedLesson.translationContext.missingPieces.length,
        missingPieces: [...new Set(missingPieces)],
      },
    }

    return withCacheHeaders(NextResponse.json(response), cacheHeaders.dynamic)
  } catch (error) {
    console.error('Error in sidebar-data API:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
      },
      { status: 500 },
    )
  }
}
