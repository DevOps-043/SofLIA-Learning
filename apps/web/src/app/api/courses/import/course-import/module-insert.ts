import { buildImportedActivityRows } from './activity-rows'
import { buildImportedMaterialRows } from './material-rows'
import type { CourseImportModule } from './schemas'
import type { CourseImportSupabaseClient } from './service-client'
import { extractVideoInfo } from './video'

export async function insertImportedModules(
  supabase: CourseImportSupabaseClient,
  courseId: string,
  instructorId: string,
  modules: CourseImportModule[]
) {
  for (const moduleInput of modules) {
    const moduleId = await insertImportedModule(supabase, courseId, moduleInput)

    for (const lesson of moduleInput.lessons) {
      const lessonId = await insertImportedLesson(
        supabase,
        moduleId,
        instructorId,
        lesson
      )

      if (lesson.materials.length > 0) {
        await supabase
          .from('lesson_materials')
          .insert(buildImportedMaterialRows(lesson.materials, lessonId))
      }

      if (lesson.activities.length > 0) {
        await supabase
          .from('lesson_activities')
          .insert(buildImportedActivityRows(lesson.activities, lessonId))
      }
    }
  }
}

async function insertImportedModule(
  supabase: CourseImportSupabaseClient,
  courseId: string,
  moduleInput: CourseImportModule
): Promise<string> {
  const { data, error } = await supabase
    .from('course_modules')
    .insert({
      course_id: courseId,
      is_published: false,
      module_description: moduleInput.description,
      module_duration_minutes: 0,
      module_order_index: moduleInput.order_index + 1,
      module_title: moduleInput.title,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data.module_id
}

async function insertImportedLesson(
  supabase: CourseImportSupabaseClient,
  moduleId: string,
  instructorId: string,
  lesson: CourseImportModule['lessons'][number]
): Promise<string> {
  const videoInfo = extractVideoInfo(lesson.video_url || '')
  const { data, error } = await supabase
    .from('course_lessons')
    .insert({
      duration_seconds: lesson.duration || 1,
      instructor_id: instructorId,
      is_published: false,
      lesson_order_index: lesson.order_index + 1,
      lesson_title: lesson.title,
      module_id: moduleId,
      summary_content: lesson.summary,
      transcript_content: lesson.transcription,
      video_provider: videoInfo.provider,
      video_provider_id: videoInfo.id,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data.lesson_id
}
