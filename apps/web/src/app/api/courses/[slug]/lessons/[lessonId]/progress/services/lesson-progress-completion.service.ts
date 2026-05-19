import { createClient } from '@/lib/supabase/server'
import { calculateCourseProgress } from '@/lib/utils/lesson-progress'
import { computeLessonActivityProgress } from '@/features/courses/services/activity-submission.server.service'
import { resolveCourseEnrollment } from '@/features/courses/services/course-enrollment.server.service'
import {
  hasPassedRequiredQuizzes,
  LessonProgressError,
  sortLessonsForCourse,
} from './lesson-progress.shared'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

interface CourseRow {
  id: string
  title: string
  instructor_id: string | null
}

interface ModuleRow {
  module_id: string
  module_order_index: number
}

interface LessonRow {
  lesson_id: string
  lesson_title: string | null
  lesson_order_index: number
  module_id: string
  module_order_index: number
}

interface ProgressSummaryRow {
  lesson_id: string
  video_progress_percentage: number | null
  quiz_passed: boolean | null
}

interface QuizSubmissionRow {
  is_passed: boolean | null
}

type LessonProgressSideEffectHandler = (
  completionContext: {
    supabase: SupabaseServerClient
    userId: string
    courseId: string
    enrollmentId: string
    courseTitle: string
    lessonId: string
    lessonTitle?: string | null
    instructorId?: string | null
    organizationId?: string | null
    wasCompleted: boolean
    now: string
  },
  overallProgress: number,
) => void

const importSideEffectsModule = new Function(
  'modulePath',
  'return import(modulePath)',
) as (
  modulePath: string,
) => Promise<{
  triggerLessonProgressSideEffects: LessonProgressSideEffectHandler
}>

function triggerLessonProgressSideEffectsAsync(
  completionContext: {
    supabase: SupabaseServerClient
    userId: string
    courseId: string
    enrollmentId: string
    courseTitle: string
    lessonId: string
    lessonTitle?: string | null
    instructorId?: string | null
    organizationId?: string | null
    wasCompleted: boolean
    now: string
  },
  overallProgress: number,
) {
  void importSideEffectsModule('./lesson-progress-side-effects.service')
    .then(({ triggerLessonProgressSideEffects }) => {
      triggerLessonProgressSideEffects(completionContext, overallProgress)
    })
    .catch(() => undefined)
}

async function ensureEnrollment(
  supabase: SupabaseServerClient,
  userId: string,
  courseId: string,
  organizationId?: string | null,
) {
  const enrollment = await resolveCourseEnrollment(
    supabase,
    userId,
    courseId,
    organizationId,
  )

  if (enrollment) {
    return enrollment
  }

  const now = new Date().toISOString()
  const { data: createdEnrollment, error: createError } = await supabase
    .from('user_course_enrollments')
    .insert({
      user_id: userId,
      course_id: courseId,
      organization_id: organizationId ?? null,
      enrollment_status: 'active',
      overall_progress_percentage: 0,
      enrolled_at: now,
      started_at: now,
      last_accessed_at: now,
    })
    .select('enrollment_id, overall_progress_percentage, enrollment_status')
    .single()

  if (createError || !createdEnrollment) {
    throw new LessonProgressError(
      'ENROLLMENT_CREATE_FAILED',
      500,
      'Error al crear inscripcion',
    )
  }

  return createdEnrollment
}

async function loadCourseAndLessons(
  supabase: SupabaseServerClient,
  slug: string,
) {
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, instructor_id')
    .eq('slug', slug)
    .single()

  if (courseError || !course) {
    throw new LessonProgressError(
      'COURSE_NOT_FOUND',
      404,
      'Curso no encontrado',
    )
  }

  const { data: modules, error: modulesError } = await supabase
    .from('course_modules')
    .select('module_id, module_order_index')
    .eq('course_id', course.id)
    .eq('is_published', true)
    .order('module_order_index', { ascending: true })

  if (modulesError || !modules || modules.length === 0) {
    throw new LessonProgressError(
      'COURSE_HAS_NO_MODULES',
      404,
      'El curso no tiene modulos',
    )
  }

  const { data: lessons, error: lessonsError } = await supabase
    .from('course_lessons')
    .select('lesson_id, lesson_title, lesson_order_index, module_id')
    .in(
      'module_id',
      modules.map((module) => module.module_id),
    )
    .eq('is_published', true)
    .order('lesson_order_index', { ascending: true })

  if (lessonsError || !lessons || lessons.length === 0) {
    throw new LessonProgressError(
      'COURSE_HAS_NO_LESSONS',
      404,
      'El curso no tiene lecciones',
    )
  }

  const moduleOrderMap = new Map(
    (modules as ModuleRow[]).map((module) => [
      module.module_id,
      module.module_order_index,
    ]),
  )

  return {
    course: course as CourseRow,
    lessons: sortLessonsForCourse(
      (lessons as Array<Omit<LessonRow, 'module_order_index'>>).map((lesson) => ({
        ...lesson,
        module_order_index: moduleOrderMap.get(lesson.module_id) || 0,
      })),
    ),
  }
}

async function validatePreviousLessonCompletion(
  supabase: SupabaseServerClient,
  enrollmentId: string,
  lessons: LessonRow[],
  lessonIndex: number,
) {
  if (lessonIndex <= 0) {
    return
  }

  const previousLesson = lessons[lessonIndex - 1]
  const { data: previousProgress } = await supabase
    .from('user_lesson_progress')
    .select('is_completed')
    .eq('enrollment_id', enrollmentId)
    .eq('lesson_id', previousLesson.lesson_id)
    .single()

  if (!previousProgress?.is_completed) {
    throw new LessonProgressError(
      'PREVIOUS_LESSON_NOT_COMPLETED',
      400,
      'Debes completar la leccion anterior antes de completar esta',
    )
  }
}

async function validateRequiredQuizzes(
  supabase: SupabaseServerClient,
  userId: string,
  lessonId: string,
  enrollmentId: string,
) {
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

  const materialIds = (materialQuizzes.data || []).map((quiz) => quiz.material_id)
  const activityIds = (activityQuizzes.data || []).map((quiz) => quiz.activity_id)
  const totalRequiredQuizzes = materialIds.length + activityIds.length

  if (totalRequiredQuizzes === 0) {
    return
  }

  let submissionsQuery = supabase
    .from('user_quiz_submissions')
    .select('is_passed')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .eq('enrollment_id', enrollmentId)

  if (materialIds.length > 0 && activityIds.length > 0) {
    submissionsQuery = submissionsQuery.or(
      `material_id.in.(${materialIds.join(',')}),activity_id.in.(${activityIds.join(',')})`,
    )
  } else if (materialIds.length > 0) {
    submissionsQuery = submissionsQuery.in('material_id', materialIds)
  } else if (activityIds.length > 0) {
    submissionsQuery = submissionsQuery.in('activity_id', activityIds)
  }

  const { data: submissions } = await submissionsQuery
  if (
    !hasPassedRequiredQuizzes(
      totalRequiredQuizzes,
      (submissions || []) as QuizSubmissionRow[],
    )
  ) {
    const passedSubmissions = (submissions || []).filter(
      (submission) => submission.is_passed,
    ).length

    throw new LessonProgressError(
      'REQUIRED_QUIZ_NOT_PASSED',
      400,
      'Hace falta realizar actividad',
      {
        totalRequired: totalRequiredQuizzes,
        passed: passedSubmissions,
        message: `Debes completar y aprobar todos los quizzes obligatorios (${passedSubmissions}/${totalRequiredQuizzes} completados)`,
      },
    )
  }
}

async function validateRequiredActivities(
  supabase: SupabaseServerClient,
  userId: string,
  courseId: string,
  courseTitle: string,
  instructorId: string | null,
  lessonId: string,
  enrollmentId: string,
) {
  const activityProgress = await computeLessonActivityProgress(supabase, {
    courseId,
    courseTitle,
    enrollmentId,
    instructorId,
    lessonId,
    organizationId: null,
    userId,
  })

  if (
    activityProgress.requiredActivitiesTotal === 0 ||
    activityProgress.requiredActivitiesCompleted >=
      activityProgress.requiredActivitiesTotal
  ) {
    return
  }

  throw new LessonProgressError(
    'REQUIRED_ACTIVITY_NOT_COMPLETED',
    400,
    'Hace falta realizar actividad',
    {
      totalRequired: activityProgress.requiredActivitiesTotal,
      passed: activityProgress.requiredActivitiesCompleted,
      message: `Debes completar todas las actividades obligatorias (${activityProgress.requiredActivitiesCompleted}/${activityProgress.requiredActivitiesTotal} completadas)`,
    },
  )
}

async function upsertLessonProgress(
  supabase: SupabaseServerClient,
  userId: string,
  lessonId: string,
  enrollmentId: string,
  now: string,
) {
  const { data: existingProgress } = await supabase
    .from('user_lesson_progress')
    .select('progress_id, is_completed, video_progress_percentage')
    .eq('enrollment_id', enrollmentId)
    .eq('lesson_id', lessonId)
    .single()

  if (existingProgress) {
    const { error } = await supabase
      .from('user_lesson_progress')
      .update({
        is_completed: true,
        lesson_status: 'completed',
        completed_at: now,
        video_progress_percentage: 100,
        last_accessed_at: now,
        updated_at: now,
      })
      .eq('progress_id', existingProgress.progress_id)

    if (error) {
      throw new LessonProgressError(
        'LESSON_PROGRESS_UPDATE_FAILED',
        500,
        'Error al actualizar progreso',
      )
    }
  } else {
    const { error } = await supabase.from('user_lesson_progress').insert({
      user_id: userId,
      lesson_id: lessonId,
      enrollment_id: enrollmentId,
      is_completed: true,
      lesson_status: 'completed',
      video_progress_percentage: 100,
      completed_at: now,
      started_at: now,
      last_accessed_at: now,
    })

    if (error) {
      throw new LessonProgressError(
        'LESSON_PROGRESS_INSERT_FAILED',
        500,
        'Error al guardar progreso',
      )
    }
  }
}

async function recalculateOverallProgress(
  supabase: SupabaseServerClient,
  enrollmentId: string,
  lessons: LessonRow[],
  now: string,
) {
  const lessonIds = lessons.map((lesson) => lesson.lesson_id)
  const [materialQuizzesResult, activityQuizzesResult, allProgressResult] =
    await Promise.all([
      supabase
        .from('lesson_materials')
        .select('lesson_id')
        .in('lesson_id', lessonIds)
        .eq('material_type', 'quiz'),
      supabase
        .from('lesson_activities')
        .select('lesson_id')
        .in('lesson_id', lessonIds)
        .eq('activity_type', 'quiz')
        .eq('is_required', true),
      supabase
        .from('user_lesson_progress')
        .select('lesson_id, video_progress_percentage, quiz_passed')
        .eq('enrollment_id', enrollmentId),
    ])

  const lessonsWithQuizzes = new Set<string>()
  ;(materialQuizzesResult.data || []).forEach((quiz) =>
    lessonsWithQuizzes.add(quiz.lesson_id),
  )
  ;(activityQuizzesResult.data || []).forEach((quiz) =>
    lessonsWithQuizzes.add(quiz.lesson_id),
  )

  const progressMap = new Map(
    ((allProgressResult.data || []) as ProgressSummaryRow[]).map((progress) => [
      progress.lesson_id,
      progress,
    ]),
  )

  const overallProgress = calculateCourseProgress(
    lessons.map((lesson) => {
      const progress = progressMap.get(lesson.lesson_id)
      return {
        lesson_id: lesson.lesson_id,
        video_progress_percentage: progress?.video_progress_percentage || 0,
        quiz_passed: progress?.quiz_passed || false,
      }
    }),
    lessonsWithQuizzes,
  )

  const { data: previousEnrollment } = await supabase
    .from('user_course_enrollments')
    .select('overall_progress_percentage, enrollment_status')
    .eq('enrollment_id', enrollmentId)
    .single()

  await supabase
    .from('user_course_enrollments')
    .update({
      overall_progress_percentage: overallProgress,
      last_accessed_at: now,
      updated_at: now,
      enrollment_status: overallProgress === 100 ? 'completed' : 'active',
      completed_at: overallProgress === 100 ? now : null,
    })
    .eq('enrollment_id', enrollmentId)

  return {
    overallProgress,
    wasCompleted: previousEnrollment?.enrollment_status === 'completed',
  }
}

export async function completeLessonProgress(
  supabase: SupabaseServerClient,
  userId: string,
  slug: string,
  lessonId: string,
  organizationId?: string | null,
) {
  const { course, lessons } = await loadCourseAndLessons(supabase, slug)
  const lessonIndex = lessons.findIndex((lesson) => lesson.lesson_id === lessonId)

  if (lessonIndex === -1) {
    throw new LessonProgressError(
      'LESSON_NOT_FOUND',
      404,
      'Leccion no encontrada',
    )
  }

  const enrollment = await ensureEnrollment(
    supabase,
    userId,
    course.id,
    organizationId,
  )
  await validatePreviousLessonCompletion(
    supabase,
    enrollment.enrollment_id,
    lessons,
    lessonIndex,
  )
  await validateRequiredQuizzes(supabase, userId, lessonId, enrollment.enrollment_id)
  await validateRequiredActivities(
    supabase,
    userId,
    course.id,
    course.title,
    course.instructor_id,
    lessonId,
    enrollment.enrollment_id,
  )

  const now = new Date().toISOString()
  await upsertLessonProgress(
    supabase,
    userId,
    lessonId,
    enrollment.enrollment_id,
    now,
  )

  const { overallProgress, wasCompleted } = await recalculateOverallProgress(
    supabase,
    enrollment.enrollment_id,
    lessons,
    now,
  )

  triggerLessonProgressSideEffectsAsync(
    {
      supabase,
      userId,
      courseId: course.id,
      enrollmentId: enrollment.enrollment_id,
      courseTitle: course.title,
      lessonId,
      lessonTitle: lessons[lessonIndex]?.lesson_title,
      instructorId: course.instructor_id,
      organizationId: enrollment.organization_id || organizationId || null,
      wasCompleted,
      now,
    },
    overallProgress,
  )

  return {
    lessonId,
    overallProgress,
  }
}
