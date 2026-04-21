import { createClient } from '@/lib/supabase/server'
import type {
  CourseSource,
  LessonData,
  ModuleData,
  PendingLessonsCourseSummary,
  PendingLessonWithModule,
  ProgressData,
} from './pending-lessons.types'

type StudyPlannerSupabaseClient = Awaited<ReturnType<typeof createClient>>

function resolveLessonDurationMinutes(lesson: LessonData): number {
  if (lesson.total_duration_minutes && lesson.total_duration_minutes > 0) {
    return lesson.total_duration_minutes
  }

  if (lesson.duration_seconds && lesson.duration_seconds > 0) {
    return Math.ceil(lesson.duration_seconds / 60)
  }

  return 15
}

export async function loadPendingLessonsForCourse(params: {
  courseSource: CourseSource
  currentUserId: string
  supabase: StudyPlannerSupabaseClient
}): Promise<PendingLessonsCourseSummary | null> {
  const { data: modules, error: modulesError } = await params.supabase
    .from('course_modules')
    .select(`
      module_id,
      module_title,
      module_order_index,
      is_published
    `)
    .eq('course_id', params.courseSource.course_id)
    .eq('is_published', true)
    .order('module_order_index', { ascending: true })

  if (modulesError || !modules?.length) {
    return null
  }

  const moduleIds = (modules as ModuleData[]).map((module) => module.module_id)
  const { data: lessons, error: lessonsError } = await params.supabase
    .from('course_lessons')
    .select(`
      lesson_id,
      lesson_title,
      lesson_description,
      lesson_order_index,
      duration_seconds,
      total_duration_minutes,
      module_id,
      is_published
    `)
    .in('module_id', moduleIds)
    .eq('is_published', true)
    .order('lesson_order_index', { ascending: true })

  if (lessonsError || !lessons) {
    console.error(`Error obteniendo lecciones del curso ${params.courseSource.course_id}:`, lessonsError)
    return null
  }

  const lessonIds = (lessons as LessonData[]).map((lesson) => lesson.lesson_id)
  const { data: completedProgress, error: progressError } = await params.supabase
    .from('user_lesson_progress')
    .select('lesson_id, lesson_status, is_completed')
    .eq('user_id', params.currentUserId)
    .eq('is_completed', true)
    .in('lesson_id', lessonIds)

  if (progressError) {
    console.error(`Error consultando progreso para curso ${params.courseSource.course_id}:`, progressError)
  }

  const completedLessonIds = new Set(
    ((completedProgress as ProgressData[] | null) || []).map((progress) => progress.lesson_id),
  )

  const pendingLessonsWithModules: PendingLessonWithModule[] = (lessons as LessonData[])
    .filter((lesson) => !completedLessonIds.has(lesson.lesson_id))
    .map((lesson) => {
      const module = (modules as ModuleData[]).find((item) => item.module_id === lesson.module_id)

      return {
        lessonId: lesson.lesson_id,
        lessonTitle: lesson.lesson_title,
        lessonOrderIndex: lesson.lesson_order_index,
        durationMinutes: resolveLessonDurationMinutes(lesson),
        durationSeconds: lesson.duration_seconds || 0,
        moduleId: lesson.module_id,
        moduleTitle: module?.module_title || 'Modulo',
        moduleOrderIndex: module?.module_order_index || 0,
      }
    })
    .sort((first, second) => {
      if (first.moduleOrderIndex !== second.moduleOrderIndex) {
        return first.moduleOrderIndex - second.moduleOrderIndex
      }

      return first.lessonOrderIndex - second.lessonOrderIndex
    })

  return {
    courseId: params.courseSource.course_id,
    courseTitle: params.courseSource.courseInfo?.title || 'Curso',
    dueDate: params.courseSource.due_date,
    totalLessons: lessons.length,
    completedLessons: completedLessonIds.size,
    pendingLessons: pendingLessonsWithModules,
    pendingCount: pendingLessonsWithModules.length,
  }
}
