import type { createAdminSupabase } from './admin-client'
import {
  cleanupObsoleteLessons,
  cleanupObsoleteModules,
  replaceLessonActivities,
  replaceLessonMaterials,
} from './apply-payload-details'
import type { CourseEngineLesson, CourseEnginePayload } from './types'
import { extractVideoInfo } from './video'

type AdminSupabaseClient = ReturnType<typeof createAdminSupabase>

export async function applyPayloadToCourse(
  supabase: AdminSupabaseClient,
  courseId: string,
  instructorId: string,
  payload: CourseEnginePayload,
): Promise<void> {
  const validModuleIds: string[] = []
  const validLessonIds: string[] = []

  for (const module of payload.modules ?? []) {
    const { data, error } = await supabase.from('course_modules').upsert({
      course_id: courseId,
      module_title: module.title,
      module_description: module.description ?? null,
      module_order_index: module.order_index,
      is_published: false,
      module_duration_minutes: 0,
    }, { onConflict: 'course_id,module_order_index' }).select().single()

    if (error) throw new Error(`Module upsert failed (order ${module.order_index}): ${error.message}`)
    validModuleIds.push(data.module_id)

    for (const lesson of module.lessons ?? []) {
      const lessonId = await upsertLesson(supabase, data.module_id, instructorId, lesson)
      validLessonIds.push(lessonId)
      await replaceLessonMaterials(supabase, lessonId, lesson.materials ?? [])
      await replaceLessonActivities(supabase, lessonId, lesson.activities ?? [])
    }
  }

  await cleanupObsoleteLessons(supabase, validModuleIds, validLessonIds)
  await cleanupObsoleteModules(supabase, courseId, validModuleIds)
}

async function upsertLesson(
  supabase: AdminSupabaseClient,
  moduleId: string,
  instructorId: string,
  lesson: CourseEngineLesson,
): Promise<string> {
  const videoInfo = extractVideoInfo(lesson.video_url ?? '')
  const { data, error } = await supabase.from('course_lessons').upsert({
    module_id: moduleId,
    instructor_id: instructorId,
    lesson_title: lesson.title,
    lesson_order_index: lesson.order_index,
    video_provider: videoInfo.provider,
    video_provider_id: videoInfo.id || null,
    duration_seconds: lesson.duration || 60,
    transcript_content: lesson.transcription ?? null,
    summary_content: lesson.summary ?? null,
    is_published: false,
  }, { onConflict: 'module_id,lesson_order_index' }).select().single()

  if (error) throw new Error(`Lesson upsert failed (order ${lesson.order_index}): ${error.message}`)
  return data.lesson_id
}
