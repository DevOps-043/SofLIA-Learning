import { extractVideoInfo } from './video-info'
import type { ImportedLesson, ServiceSupabaseClient } from './types'

export async function insertImportedLesson(
  supabase: ServiceSupabaseClient,
  moduleId: string,
  instructorId: string,
  lessonData: ImportedLesson,
) {
  const videoInfo = extractVideoInfo(lessonData.video_url || '')
  const { data, error } = await supabase
    .from('course_lessons')
    .insert({
      module_id: moduleId,
      instructor_id: instructorId,
      lesson_title: lessonData.title,
      lesson_order_index: lessonData.order_index + 1,
      video_provider: videoInfo.provider,
      video_provider_id: videoInfo.id,
      duration_seconds: lessonData.duration || 1,
      transcript_content: lessonData.transcription,
      summary_content: lessonData.summary,
      is_published: false,
    })
    .select()
    .single()

  if (error) throw error
  return data as { lesson_id: string }
}
