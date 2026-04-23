import { CourseImportError } from './errors'
import { insertImportedActivities } from './activities'
import { insertImportedLesson } from './lesson-insert'
import { insertImportedMaterials } from './materials'
import { insertImportedModule } from './module-insert'
import type { ImportedModule, ServiceSupabaseClient } from './types'

export async function importCourseContent(
  supabase: ServiceSupabaseClient,
  courseId: string,
  instructorId: string,
  modules: ImportedModule[],
) {
  try {
    for (const moduleData of modules) {
      const newModule = await insertImportedModule(supabase, courseId, moduleData)
      for (const lessonData of moduleData.lessons) {
        const newLesson = await insertImportedLesson(
          supabase,
          newModule.module_id,
          instructorId,
          lessonData,
        )
        await insertImportedMaterials(supabase, newLesson.lesson_id, lessonData.materials)
        await insertImportedActivities(supabase, newLesson.lesson_id, lessonData.activities)
      }
    }
  } catch (error) {
    console.error('[IMPORT API] Error inserting modules/lessons:', error)
    await supabase.from('courses').delete().eq('id', courseId)
    throw new CourseImportError(500, {
      error: 'Partial processing failure. Rolled back.',
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
